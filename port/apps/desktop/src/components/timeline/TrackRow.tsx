import type { ComponentType, PointerEventHandler } from "react";
import {
  Film,
  Music,
  Image as ImageIcon,
  Type,
  Sparkles,
  EyeOff,
  VolumeX,
  type LucideProps,
} from "lucide-react";
import type { Track, ClipType } from "@palmier/schema";
import { ClipBlock } from "./ClipBlock";

const ICONS: Record<ClipType, ComponentType<LucideProps>> = {
  video: Film,
  audio: Music,
  image: ImageIcon,
  text: Type,
  lottie: Sparkles,
};

export function TrackRow({
  track,
  label,
  color,
  pxPerFrame,
  contentW,
  headerW,
  rowH,
  mediaNames,
  selectedClipId,
  onSelectClip,
  onScrubDown,
  onScrubMove,
  onScrubUp,
}: {
  track: Track;
  label: string;
  color: string;
  pxPerFrame: number;
  contentW: number;
  headerW: number;
  rowH: number;
  mediaNames: Map<string, string>;
  selectedClipId: string | undefined;
  onSelectClip: (id: string) => void;
  onScrubDown: PointerEventHandler<HTMLDivElement>;
  onScrubMove: PointerEventHandler<HTMLDivElement>;
  onScrubUp: PointerEventHandler<HTMLDivElement>;
}) {
  const Icon = ICONS[track.type];

  return (
    <div className="flex" style={{ height: rowH }}>
      <div
        className="sticky left-0 z-10 flex items-center gap-2 px-3"
        style={{
          width: headerW,
          background: "var(--bg-raised)",
          borderRight: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ background: `${color}22`, color }}>
          <Icon size={13} />
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
        <div className="ml-auto flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          {track.muted && <VolumeX size={12} />}
          {track.hidden && <EyeOff size={12} />}
        </div>
      </div>

      <div
        className="relative cursor-ew-resize"
        style={{ width: contentW, borderBottom: "1px solid var(--border-subtle)" }}
        onPointerDown={onScrubDown}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubUp}
      >
        {track.clips.map((clip) => (
          <ClipBlock
            key={clip.id}
            clip={clip}
            pxPerFrame={pxPerFrame}
            color={color}
            mediaName={mediaNames.get(clip.mediaRef)}
            selected={clip.id === selectedClipId}
            onSelect={() => onSelectClip(clip.id)}
          />
        ))}
      </div>
    </div>
  );
}
