import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import type { Clip } from "@palmier/schema";
import { Timeline } from "../components/timeline/Timeline";
import { Gutter } from "../components/timeline/Gutter";
import { Preview } from "../components/Preview";
import { MediaPool } from "../components/MediaPool";
import { Inspector } from "../components/Inspector";
import { usePersistentState } from "../lib/persistent";
import { saveProjectPackage, type OpenedProject } from "../lib/project";
import { importFiles, type ImportMode } from "../lib/import";
import type { ParsedProject } from "@palmier/schema";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function EditorWorkspace({
  opened,
  onProjectChange,
}: {
  opened: OpenedProject | null;
  onProjectChange: (p: ParsedProject) => void;
}) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>(undefined);
  const posRef = useRef(0);

  // panel sizes (persisted across sessions)
  const [leftW, setLeftW] = usePersistentState("pp.layout.leftW", 300);
  const [rightW, setRightW] = usePersistentState("pp.layout.rightW", 320);
  const [previewH, setPreviewH] = usePersistentState("pp.layout.previewH", 360);

  const totalFrames = useMemo(() => {
    let max = 0;
    for (const t of opened?.project.timeline.tracks ?? []) {
      for (const c of t.clips) max = Math.max(max, c.startFrame + c.durationFrames);
    }
    return max;
  }, [opened]);

  const selectedClip: Clip | undefined = useMemo(() => {
    if (!selectedClipId || !opened) return undefined;
    for (const t of opened.project.timeline.tracks) {
      const c = t.clips.find((cl) => cl.id === selectedClipId);
      if (c) return c;
    }
    return undefined;
  }, [selectedClipId, opened]);

  const setPos = useCallback((f: number) => {
    posRef.current = f;
    setFrame(f);
  }, []);

  useEffect(() => {
    setPlaying(false);
    setSelectedClipId(undefined);
    setPos(0);
  }, [opened?.path, setPos]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && posRef.current >= totalFrames) setPos(0);
      return !p;
    });
  }, [totalFrames, setPos]);

  useEffect(() => {
    if (!playing || !opened) return;
    const fps = opened.project.timeline.fps;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = posRef.current + dt * fps;
      if (next >= totalFrames) {
        setPos(totalFrames);
        setPlaying(false);
        return;
      }
      setPos(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, opened, totalFrames, setPos]);

  async function handleImport(paths: string[], mode: ImportMode) {
    if (!opened) return;
    const added = await importFiles(opened.path, paths, mode);
    if (!added.length) return;
    const manifest = opened.project.manifest ?? { version: 2, entries: [], folders: [] };
    const updated: ParsedProject = {
      ...opened.project,
      manifest: { ...manifest, entries: [...manifest.entries, ...added] },
    };
    onProjectChange(updated);
    await saveProjectPackage(opened.path, updated).catch(() => {});
  }

  if (!opened) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="pp-glass flex flex-col items-center gap-4 px-16 py-20 text-center"
        >
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "rgb(var(--accent) / 0.12)", border: "1px solid rgb(var(--accent) / 0.25)" }}
          >
            <Clapperboard size={28} style={{ color: "var(--accent-color)" }} />
          </div>
          <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Abra um projeto em <span style={{ color: "var(--text-secondary)" }}>Início</span> para editar.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0 p-3">
      <div style={{ width: leftW }} className="min-w-0">
        <MediaPool project={opened.project} onImport={handleImport} />
      </div>
      <Gutter orientation="vertical" onResize={(d) => setLeftW((w) => clamp(w + d, 200, 520))} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div style={{ height: previewH }} className="min-h-0">
          <Preview project={opened.project} packageDir={opened.path} frame={frame} />
        </div>
        <Gutter orientation="horizontal" onResize={(d) => setPreviewH((h) => clamp(h + d, 160, 900))} />
        <div className="min-h-0 flex-1">
          <Timeline
            project={opened.project}
            frame={frame}
            onFrameChange={setPos}
            playing={playing}
            onTogglePlay={togglePlay}
            onSkipStart={() => setPos(0)}
            selectedClipId={selectedClipId}
            onSelectClip={setSelectedClipId}
          />
        </div>
      </div>

      <Gutter orientation="vertical" onResize={(d) => setRightW((w) => clamp(w - d, 240, 560))} />
      <div style={{ width: rightW }} className="min-w-0">
        <Inspector project={opened.project} clip={selectedClip} />
      </div>
    </div>
  );
}
