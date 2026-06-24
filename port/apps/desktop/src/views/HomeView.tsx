import { useMemo } from "react";
import { trackColors } from "@palmier/ui";
import { FolderIcon, FilmIcon } from "../components/icons";
import { summarize } from "../lib/summary";
import type { OpenedProject } from "../lib/project";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pp-raised flex flex-col gap-1 p-4">
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

export function HomeView({
  opened,
  busy,
  error,
  onOpen,
}: {
  opened: OpenedProject | null;
  busy: boolean;
  error: string | null;
  onOpen: () => void;
}) {
  const summary = useMemo(() => (opened ? summarize(opened.project) : null), [opened]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Início
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Abra um projeto <code>.palmier</code> para inspecionar a timeline.
          </p>
        </div>
        <button
          onClick={onOpen}
          disabled={busy}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ background: "var(--accent-color)", color: "rgb(var(--c-base))" }}
        >
          <FolderIcon width={16} height={16} />
          {busy ? "Abrindo…" : "Abrir projeto"}
        </button>
      </header>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgb(229 79 79 / 0.12)", color: "#ff9b9b", border: "1px solid rgb(229 79 79 / 0.3)" }}
        >
          {error}
        </div>
      )}

      {!opened && !error && (
        <div
          className="pp-surface flex flex-col items-center justify-center gap-3 py-20 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          <FilmIcon width={40} height={40} />
          <div className="text-sm">Nenhum projeto aberto ainda.</div>
        </div>
      )}

      {opened && summary && (
        <>
          <div className="pp-surface flex items-center gap-4 p-4">
            <div
              className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-md"
              style={{ background: "rgb(var(--c-base))" }}
            >
              {opened.thumbnailDataUrl ? (
                <img src={opened.thumbnailDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <FilmIcon width={28} height={28} />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {opened.name}
              </div>
              <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {opened.path}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="FPS" value={summary.fps} />
            <StatCard label="Resolução" value={summary.resolution} />
            <StatCard label="Duração" value={summary.durationLabel} />
            <StatCard label="Mídia" value={summary.mediaCount} />
            <StatCard label="Trilhas" value={summary.trackCount} />
            <StatCard label="Clipes" value={summary.clipCount} />
            <StatCard label="Frames" value={summary.totalFrames} />
          </div>

          <div className="pp-surface p-4">
            <div className="mb-3 text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Por tipo de trilha
            </div>
            <div className="flex flex-col gap-2">
              {summary.byType.map((row) => (
                <div key={row.type} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: trackColors[row.type] ?? "var(--text-muted)" }}
                  />
                  <span className="w-20 capitalize" style={{ color: "var(--text-secondary)" }}>
                    {row.type}
                  </span>
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {row.tracks} trilha(s) · {row.clips} clipe(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
