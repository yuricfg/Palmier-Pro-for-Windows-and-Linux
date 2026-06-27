// Canvas2D frame compositor, ported from Compositing/FrameRenderer.swift and
// Preview/CompositionBuilder.affineTransform. Draws the project frame: layers
// bottom→top over black, each with crop → transform → opacity.

import type { Clip, TextStyle, Timeline } from "@palmier/schema";
import { clipAtFrame, cropAt, effectiveTransform, opacityAt } from "./eval";

export type LayerSource = HTMLImageElement | HTMLVideoElement;

function sourceSize(src: LayerSource): { w: number; h: number } {
  if (src instanceof HTMLVideoElement) return { w: src.videoWidth, h: src.videoHeight };
  return { w: src.naturalWidth, h: src.naturalHeight };
}

function rgba(c: { r: number; g: number; b: number; a: number }): string {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
}

const REFERENCE_CANVAS_HEIGHT = 1080;

function drawText(ctx: CanvasRenderingContext2D, style: TextStyle, content: string, H: number): void {
  const size = style.fontSize * style.fontScale * (H / REFERENCE_CANVAS_HEIGHT);
  const weight = /bold|black|semibold|heavy/i.test(style.fontName) ? "700" : "400";
  const family = style.fontName.replace(/-(Bold|Regular|Medium|Light|Semibold)$/i, "");
  ctx.font = `${weight} ${size}px "${family}", "Inter Variable", sans-serif`;
  ctx.textAlign = style.alignment;
  ctx.textBaseline = "middle";

  const x = style.alignment === "left" ? -ctx.measureText(content).width / 2 : style.alignment === "right" ? ctx.measureText(content).width / 2 : 0;

  if (style.background.enabled) {
    const w = ctx.measureText(content).width;
    ctx.fillStyle = rgba(style.background.color);
    ctx.fillRect(-w / 2 - size * 0.2, -size * 0.7, w + size * 0.4, size * 1.4);
  }
  if (style.shadow.enabled) {
    ctx.shadowColor = rgba(style.shadow.color);
    ctx.shadowOffsetX = style.shadow.offsetX;
    ctx.shadowOffsetY = -style.shadow.offsetY;
    ctx.shadowBlur = style.shadow.blur;
  }
  ctx.fillStyle = rgba(style.color);
  ctx.fillText(content, x, 0);
  ctx.shadowColor = "transparent";

  if (style.border.enabled) {
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.strokeStyle = rgba(style.border.color);
    ctx.strokeText(content, x, 0);
  }
}

function drawClip(ctx: CanvasRenderingContext2D, clip: Clip, frame: number, src: LayerSource | undefined, W: number, H: number): void {
  const alpha = opacityAt(clip, frame);
  if (alpha <= 0) return;

  const t = effectiveTransform(clip, frame);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(t.centerX * W, t.centerY * H);
  if (t.rotation) ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.scale(t.flipHorizontal ? -1 : 1, t.flipVertical ? -1 : 1);

  const boxW = t.width * W;
  const boxH = t.height * H;

  if (clip.mediaType === "text") {
    if (clip.textStyle) drawText(ctx, clip.textStyle, clip.textContent ?? "", H);
  } else if (src) {
    const { w: sw, h: sh } = sourceSize(src);
    if (sw > 0 && sh > 0) {
      const crop = cropAt(clip, frame);
      const sx = crop.left * sw;
      const sy = crop.top * sh;
      const cw = Math.max(1, (1 - crop.left - crop.right) * sw);
      const ch = Math.max(1, (1 - crop.top - crop.bottom) * sh);
      ctx.drawImage(src, sx, sy, cw, ch, -boxW / 2, -boxH / 2, boxW, boxH);
    }
  }
  ctx.restore();
}

/** Render the composited frame. Tracks are drawn in array order (later = on top). */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  timeline: Timeline,
  frame: number,
  getSource: (mediaRef: string) => LayerSource | undefined,
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  for (const track of timeline.tracks) {
    if (track.hidden || track.type === "audio") continue;
    const clip = clipAtFrame(track.clips, frame);
    if (!clip) continue;
    drawClip(ctx, clip, frame, getSource(clip.mediaRef), W, H);
  }
}
