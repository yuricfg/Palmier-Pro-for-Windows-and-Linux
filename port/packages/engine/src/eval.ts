// Per-frame clip evaluation, ported from Sources/PalmierPro/Models/Timeline.swift
// (Clip.*At methods) and Models/Keyframe.swift (KeyframeTrack.sample, smoothstep).
// Pure + framework-free so it can be unit-tested headless and reused by any renderer.

import type { AnimPair, Clip, Crop, KeyframeTrack, Transform } from "@palmier/schema";

export const smoothstep = (t: number): number => t * t * (3 - 2 * t);

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

type Lerp<V> = (a: V, b: V, t: number) => V;

const lerpNum: Lerp<number> = (a, b, t) => a + (b - a) * t;
const lerpPair: Lerp<AnimPair> = (a, b, t) => ({ a: lerpNum(a.a, b.a, t), b: lerpNum(a.b, b.b, t) });
const lerpCrop: Lerp<Crop> = (a, b, t) => ({
  left: lerpNum(a.left, b.left, t),
  top: lerpNum(a.top, b.top, t),
  right: lerpNum(a.right, b.right, t),
  bottom: lerpNum(a.bottom, b.bottom, t),
});

/** KeyframeTrack.sample — `frame` is clip-relative. Mirrors Keyframe.swift exactly. */
function sample<V>(track: KeyframeTrack<V> | undefined, frame: number, fallback: V, lerp: Lerp<V>): V {
  const kfs = track?.keyframes;
  if (!kfs || kfs.length === 0) return fallback;
  if (kfs.length === 1) return kfs[0]!.value;
  if (frame <= kfs[0]!.frame) return kfs[0]!.value;
  const last = kfs[kfs.length - 1]!;
  if (frame >= last.frame) return last.value;

  const bIdx = kfs.findIndex((k) => k.frame > frame);
  if (bIdx <= 0) return last.value;
  const a = kfs[bIdx - 1]!;
  const b = kfs[bIdx]!;
  const raw = (frame - a.frame) / (b.frame - a.frame);
  switch (a.interpolationOut) {
    case "hold":
      return a.value;
    case "linear":
      return lerp(a.value, b.value, raw);
    case "smooth":
      return lerp(a.value, b.value, smoothstep(raw));
  }
}

const rel = (clip: Clip, frame: number): number => frame - clip.startFrame;
const active = (track: { keyframes: unknown[] } | undefined): boolean => !!track && track.keyframes.length > 0;

/** 0…1 fade envelope from the head/tail ramps. */
export function fadeMultiplier(clip: Clip, frame: number): number {
  const r = rel(clip, frame);
  if (r < 0 || r > clip.durationFrames) return 0;
  const inMul =
    clip.fadeInFrames > 0
      ? (() => {
          const t = Math.min(1, r / clip.fadeInFrames);
          return clip.fadeInInterpolation === "smooth" ? smoothstep(t) : t;
        })()
      : 1;
  const outRem = clip.durationFrames - r;
  const outMul =
    clip.fadeOutFrames > 0
      ? (() => {
          const t = Math.min(1, outRem / clip.fadeOutFrames);
          return clip.fadeOutInterpolation === "smooth" ? smoothstep(t) : t;
        })()
      : 1;
  return Math.min(inMul, outMul);
}

export function opacityAt(clip: Clip, frame: number): number {
  const base = sample(clip.opacityTrack, rel(clip, frame), clip.opacity, lerpNum);
  if (clip.mediaType === "audio" || (clip.fadeInFrames <= 0 && clip.fadeOutFrames <= 0)) {
    return clamp01(base);
  }
  return clamp01(base * fadeMultiplier(clip, frame));
}

export function cropAt(clip: Clip, frame: number): Crop {
  return sample(clip.cropTrack, rel(clip, frame), clip.crop, lerpCrop);
}

function sizeAt(clip: Clip, frame: number): { w: number; h: number } {
  const fb: AnimPair = { a: clip.transform.width, b: clip.transform.height };
  const s = sample(clip.scaleTrack, rel(clip, frame), fb, lerpPair);
  return { w: s.a, h: s.b };
}

function topLeftAt(clip: Clip, frame: number): { x: number; y: number } {
  if (active(clip.positionTrack)) {
    const p = sample(clip.positionTrack, rel(clip, frame), { a: 0, b: 0 }, lerpPair);
    return { x: p.a, y: p.b };
  }
  const sz = sizeAt(clip, frame);
  return { x: clip.transform.centerX - sz.w / 2, y: clip.transform.centerY - sz.h / 2 };
}

function rotationAt(clip: Clip, frame: number): number {
  return sample(clip.rotationTrack, rel(clip, frame), clip.transform.rotation, lerpNum);
}

export function hasTransformAnimation(clip: Clip): boolean {
  return active(clip.positionTrack) || active(clip.scaleTrack) || active(clip.rotationTrack);
}

/** Sampled Transform at `frame`. Mirrors Clip.transformAt — note flips are dropped
 *  for animated transforms (matches the Swift renderer quirk). */
export function transformAt(clip: Clip, frame: number): Transform {
  const tl = topLeftAt(clip, frame);
  const sz = sizeAt(clip, frame);
  return {
    centerX: tl.x + sz.w / 2,
    centerY: tl.y + sz.h / 2,
    width: sz.w,
    height: sz.h,
    rotation: rotationAt(clip, frame),
    flipHorizontal: false,
    flipVertical: false,
  };
}

/** Static transform (keeps flips) unless the clip is animated — matches FrameRenderer. */
export function effectiveTransform(clip: Clip, frame: number): Transform {
  return hasTransformAnimation(clip) ? transformAt(clip, frame) : clip.transform;
}

/** First clip covering `frame` on a track, or undefined. */
export function clipAtFrame(clips: Clip[], frame: number): Clip | undefined {
  return clips.find((c) => frame >= c.startFrame && frame < c.startFrame + c.durationFrames);
}
