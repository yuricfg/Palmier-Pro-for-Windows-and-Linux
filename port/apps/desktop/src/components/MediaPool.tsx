import { useEffect, useState, type ComponentType } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import {
  Film,
  Music,
  Image as ImageIcon,
  Type,
  Sparkles,
  Captions,
  FolderOpen,
  Upload,
  Link2,
  Copy,
  Scissors,
  type LucideProps,
  type LucideIcon,
} from "lucide-react";
import type { ClipType, ParsedProject } from "@palmier/schema";
import { trackColors } from "@palmier/ui";
import { usePersistentState } from "../lib/persistent";
import type { ImportMode } from "../lib/import";

const typeIcon: Record<ClipType, ComponentType<LucideProps>> = {
  video: Film,
  audio: Music,
  image: ImageIcon,
  text: Type,
  lottie: Sparkles,
};

type Tab = "media" | "music" | "captions";
const tabs: { id: Tab; label: string; icon: ComponentType<LucideProps> }[] = [
  { id: "media", label: "Mídia", icon: FolderOpen },
  { id: "music", label: "Música", icon: Music },
  { id: "captions", label: "Legendas", icon: Captions },
];

const modes: { id: ImportMode; label: string; icon: LucideIcon }[] = [
  { id: "reference", label: "Referenciar (link)", icon: Link2 },
  { id: "copy", label: "Copiar pro projeto", icon: Copy },
  { id: "move", label: "Mover pro projeto", icon: Scissors },
];

function fmtDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MediaPool({
  project,
  onImport,
}: {
  project: ParsedProject;
  onImport: (paths: string[], mode: ImportMode) => void;
}) {
  const [tab, setTab] = useState<Tab>("media");
  const [mode, setMode] = usePersistentState<ImportMode>("pp.importMode", "reference");
  const [dropActive, setDropActive] = useState(false);

  const entries = project.manifest?.entries ?? [];
  const shown = tab === "music" ? entries.filter((e) => e.type === "audio") : entries;

  // OS drag-drop (real file paths via Tauri).
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over" || event.payload.type === "enter") setDropActive(true);
        else if (event.payload.type === "leave") setDropActive(false);
        else if (event.payload.type === "drop") {
          setDropActive(false);
          if (event.payload.paths.length) onImport(event.payload.paths, mode);
        }
      })
      .then((fn) => (unlisten = fn))
      .catch(() => {});
    return () => unlisten?.();
  }, [onImport, mode]);

  async function importViaDialog() {
    const picked = await open({ multiple: true, title: "Importar mídia" });
    if (!picked) return;
    onImport(Array.isArray(picked) ? picked : [picked], mode);
  }

  const ModeIcon = modes.find((m) => m.id === mode)!.icon;

  return (
    <div
      className="pp-glass flex h-full flex-col overflow-hidden"
      style={dropActive ? { outline: "2px dashed var(--accent-color)", outlineOffset: -4 } : undefined}
    >
      <div className="flex items-center gap-1 px-2 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: active ? "rgb(var(--c-white) / 0.08)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* import bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <button
          onClick={importViaDialog}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-white"
          style={{ background: "var(--accent-gradient)", boxShadow: "var(--accent-glow)" }}
        >
          <Upload size={13} />
          Importar
        </button>
        <select
          value={mode}
          onChange={(e) => setMode(e.currentTarget.value as ImportMode)}
          title="Como tratar arquivos importados"
          className="cursor-pointer rounded-lg px-2 py-1.5 text-xs outline-none"
          style={{ background: "rgb(var(--c-white) / 0.06)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          {modes.map((m) => (
            <option key={m.id} value={m.id} style={{ background: "#161420" }}>
              {m.label}
            </option>
          ))}
        </select>
        <ModeIcon size={14} style={{ color: "var(--text-muted)" }} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {tab === "captions" ? (
          <Empty label="Legendas aparecem aqui." />
        ) : shown.length === 0 ? (
          <Empty label={tab === "music" ? "Nenhuma faixa de áudio." : "Arraste arquivos aqui ou use Importar."} />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {shown.map((e) => {
              const Icon = typeIcon[e.type];
              const color = trackColors[e.type] ?? "#888888";
              return (
                <div key={e.id} className="pp-raised cursor-grab overflow-hidden p-0" title={e.name} draggable>
                  <div className="grid aspect-video place-items-center" style={{ background: "rgb(0 0 0 / 0.35)" }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <span className="truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {e.name}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {fmtDuration(e.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center px-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
      {label}
    </div>
  );
}
