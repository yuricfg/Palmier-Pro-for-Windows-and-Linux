import { motion } from "framer-motion";
import type { Clip } from "@palmier/schema";

/** Clip-relative frames that carry any keyframe, deduped + sorted. */
function keyframeFrames(clip: Clip): number[] {
  const tracks = [
    clip.opacityTrack,
    clip.positionTrack,
    clip.scaleTrack,
    clip.rotationTrack,
    clip.cropTrack,
    clip.volumeTrack,
  ];
  const set = new Set<number>();
  for (const t of tracks) {
    if (!t) continue;
    for (const kf of t.keyframes) set.add(kf.frame);
  }
  return [...set].sort((a, b) => a - b);
}

function label(clip: Clip, mediaName: string | undefined): string {
  if (clip.mediaType === "text") return clip.textContent?.trim() || "Texto";
  return mediaName ?? clip.mediaRef;
}

export function ClipBlock({
  clip,
  pxPerFrame,
  color,
  mediaName,
  selected,
  onSelect,
}: {
  clip: Clip;
  pxPerFrame: number;
  color: string;
  mediaName: string | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const left = clip.startFrame * pxPerFrame;
  const width = Math.max(3, clip.durationFrames * pxPerFrame);
  const fadeInW = clip.fadeInFrames * pxPerFrame;
  const fadeOutW = clip.fadeOutFrames * pxPerFrame;
  const kfs = keyframeFrames(clip);

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.97 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="absolute bottom-1 top-1 cursor-pointer overflow-hidden rounded-md"
      style={{
        left,
        width,
        background: `${color}2e`,
        border: selected ? "1.5px solid var(--text-primary)" : `1px solid ${color}`,
        boxShadow: selected ? "var(--accent-glow)" : "none",
        transformOrigin: "left",
      }}
      title={label(clip, mediaName)}
    >
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />

      {fadeInW > 0 && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: fadeInW, background: "linear-gradient(to right, rgb(0 0 0 / 0.55), transparent)" }}
        />
      )}
      {fadeOutW > 0 && (
        <div
          className="absolute inset-y-0 right-0"
          style={{ width: fadeOutW, background: "linear-gradient(to left, rgb(0 0 0 / 0.55), transparent)" }}
        />
      )}

      <span
        className="pointer-events-none absolute left-2.5 top-1 truncate text-[10px] font-medium"
        style={{ color: "var(--text-secondary)", maxWidth: `calc(100% - 14px)` }}
      >
        {label(clip, mediaName)}
      </span>

      {kfs.map((f) => (
        <span
          key={f}
          className="absolute bottom-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full ring-1 ring-black/40"
          style={{ left: f * pxPerFrame, background: "var(--text-primary)" }}
        />
      ))}
    </motion.div>
  );
}
