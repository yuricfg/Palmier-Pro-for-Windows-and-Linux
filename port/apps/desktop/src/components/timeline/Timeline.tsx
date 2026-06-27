import { useEffect, useMemo, useRef, useState, type ComponentType, type PointerEvent as ReactPointerEvent } from "react";
import { ZoomIn, ZoomOut, Maximize2, Play, Pause, SkipBack, type LucideProps } from "lucide-react";
import { trackColors } from "@palmier/ui";
import type { ParsedProject } from "@palmier/schema";
import { TrackRow } from "./TrackRow";
import { framesToTimecode, chooseTickSeconds } from "../../lib/timecode";

const HEADER_W = 132;
const ROW_H = 56;
const RULER_H = 32;
const MIN_PXF = 0.4;
const MAX_PXF = 30;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function ToolBtn({ onClick, icon: Icon, label }: { onClick: () => void; icon: ComponentType<LucideProps>; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-white/10"
      style={{ color: "var(--text-tertiary)" }}
    >
      <Icon size={15} />
    </button>
  );
}

export function Timeline({
  project,
  frame,
  onFrameChange,
  playing,
  onTogglePlay,
  onSkipStart,
  selectedClipId,
  onSelectClip,
}: {
  project: ParsedProject;
  frame: number;
  onFrameChange: (f: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onSkipStart: () => void;
  selectedClipId: string | undefined;
  onSelectClip: (id: string) => void;
}) {
  const { timeline, manifest } = project;
  const [pxPerFrame, setPxPerFrame] = useState(6);
  const scrollRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null); // x-origin (frame 0) of the lane content
  const scrubbing = useRef(false);

  const totalFrames = useMemo(() => {
    let max = 0;
    for (const t of timeline.tracks) for (const c of t.clips) max = Math.max(max, c.startFrame + c.durationFrames);
    return max;
  }, [timeline]);

  const mediaNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of manifest?.entries ?? []) m.set(e.id, e.name);
    return m;
  }, [manifest]);

  const labels = useMemo(() => {
    const counts: Record<string, number> = {};
    return timeline.tracks.map((t) => {
      counts[t.type] = (counts[t.type] ?? 0) + 1;
      return `${t.type[0]!.toUpperCase()}${counts[t.type]}`;
    });
  }, [timeline]);

  const frameFromX = (clientX: number): number => {
    const el = originRef.current;
    if (!el) return frame;
    return clamp(Math.round((clientX - el.getBoundingClientRect().left) / pxPerFrame), 0, totalFrames);
  };

  // Drag-scrub: pointer capture keeps moves flowing even off the element.
  const onScrubDown = (e: ReactPointerEvent) => {
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onFrameChange(frameFromX(e.clientX));
  };
  const onScrubMove = (e: ReactPointerEvent) => {
    if (scrubbing.current) onFrameChange(frameFromX(e.clientX));
  };
  const onScrubUp = (e: ReactPointerEvent) => {
    scrubbing.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Keyboard: step frames (←/→, Shift = ×10), jump to start/end.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      let next: number | null = null;
      if (e.key === "ArrowRight") next = frame + step;
      else if (e.key === "ArrowLeft") next = frame - step;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = totalFrames;
      if (next !== null) {
        e.preventDefault();
        onFrameChange(clamp(next, 0, totalFrames));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frame, totalFrames, onFrameChange, onTogglePlay]);

  // pad the lane to at least 10s so short projects aren't cramped
  const padFrames = Math.max(totalFrames, Math.round(10 * timeline.fps));
  const contentW = Math.max(200, padFrames * pxPerFrame);

  const tickFrames = chooseTickSeconds(pxPerFrame, timeline.fps) * timeline.fps;
  const ticks: number[] = [];
  for (let f = 0; f <= padFrames; f += tickFrames) ticks.push(f);

  function fit() {
    const w = scrollRef.current?.clientWidth ?? 900;
    setPxPerFrame(clamp((w - HEADER_W - 24) / Math.max(totalFrames, 1), MIN_PXF, MAX_PXF));
  }
  const zoom = (factor: number) => setPxPerFrame((p) => clamp(p * factor, MIN_PXF, MAX_PXF));

  return (
    <div className="pp-glass flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Timeline
        </span>
        <div className="flex items-center gap-1">
          <ToolBtn onClick={onSkipStart} icon={SkipBack} label="Início (Home)" />
          <button
            onClick={onTogglePlay}
            aria-label={playing ? "Pausar" : "Reproduzir"}
            title={playing ? "Pausar (espaço)" : "Reproduzir (espaço)"}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-white"
            style={{ background: "var(--accent-gradient)", boxShadow: "var(--accent-glow)" }}
          >
            {playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          </button>
        </div>
        <span
          className="rounded-md px-2 py-1 text-xs font-medium tabular-nums"
          style={{ background: "rgb(var(--c-white) / 0.06)", color: "var(--accent-color)" }}
        >
          {framesToTimecode(frame, timeline.fps)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <ToolBtn onClick={() => zoom(1 / 1.3)} icon={ZoomOut} label="Menos zoom" />
          <ToolBtn onClick={fit} icon={Maximize2} label="Ajustar à largura" />
          <ToolBtn onClick={() => zoom(1.3)} icon={ZoomIn} label="Mais zoom" />
        </div>
      </div>

      <div ref={scrollRef} className="relative flex-1 overflow-auto">
        <div className="relative" style={{ width: HEADER_W + contentW, minWidth: "100%" }}>
          {/* ruler */}
          <div
            className="sticky top-0 z-20 flex"
            style={{ height: RULER_H, background: "var(--bg-raised)", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div
              className="sticky left-0 z-30"
              style={{ width: HEADER_W, background: "var(--bg-raised)", borderRight: "1px solid var(--border-subtle)" }}
            />
            <div
              ref={originRef}
              className="relative cursor-ew-resize"
              style={{ width: contentW }}
              onPointerDown={onScrubDown}
              onPointerMove={onScrubMove}
              onPointerUp={onScrubUp}
            >
              {ticks.map((f) => (
                <div
                  key={f}
                  className="absolute bottom-0 top-0 flex items-end pb-1 pl-1 text-[10px] tabular-nums"
                  style={{ left: f * pxPerFrame, color: "var(--text-muted)", borderLeft: "1px solid var(--border-subtle)" }}
                >
                  {framesToTimecode(f, timeline.fps)}
                </div>
              ))}
            </div>
          </div>

          {/* tracks */}
          {timeline.tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              label={labels[i]!}
              color={trackColors[t.type] ?? "#888888"}
              pxPerFrame={pxPerFrame}
              contentW={contentW}
              headerW={HEADER_W}
              rowH={ROW_H}
              mediaNames={mediaNames}
              selectedClipId={selectedClipId}
              onSelectClip={onSelectClip}
              onScrubDown={onScrubDown}
              onScrubMove={onScrubMove}
              onScrubUp={onScrubUp}
            />
          ))}
          {timeline.tracks.length === 0 && (
            <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>
              Este projeto não tem trilhas.
            </div>
          )}

          {/* playhead */}
          <div
            className="pointer-events-none absolute z-20"
            style={{ top: RULER_H, bottom: 0, left: HEADER_W + frame * pxPerFrame, width: 2, background: "var(--accent-color)" }}
          >
            <div
              className="absolute h-2.5 w-2.5 -translate-x-1/2 rotate-45"
              style={{ top: -5, left: 1, background: "var(--accent-color)", boxShadow: "var(--accent-glow)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
