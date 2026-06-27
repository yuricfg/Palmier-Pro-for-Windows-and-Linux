import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Film, Trash2, Loader2 } from "lucide-react";
import { readRegistry, readThumbnail, removeFromRegistry, type RegistryEntry } from "../lib/registry";
import { NewProjectDialog } from "./NewProjectDialog";
import type { NewProjectOptions } from "../App";

function ProjectCard({
  entry,
  onOpen,
  onRemove,
}: {
  entry: RegistryEntry;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    readThumbnail(entry.path)
      .then((b64) => alive && setThumb(b64 ? `data:image/jpeg;base64,${b64}` : null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [entry.path]);

  const date = entry.last_opened ? new Date(entry.last_opened).toLocaleDateString("pt-BR") : "";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      onClick={onOpen}
      className="pp-glass group relative cursor-pointer overflow-hidden p-0"
      title={entry.path}
    >
      <div className="grid aspect-video place-items-center" style={{ background: "rgb(0 0 0 / 0.4)" }}>
        {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <Film size={26} style={{ color: "var(--text-muted)" }} />}
      </div>
      <div className="px-3 py-2.5">
        <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {entry.name}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {entry.width && entry.height ? `${entry.width}×${entry.height} · ` : ""}
          {date}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Remover do histórico"
        className="absolute right-2 top-2 grid h-7 w-7 cursor-pointer place-items-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "rgb(0 0 0 / 0.55)", color: "var(--text-secondary)" }}
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}

export function HomeView({
  busy,
  error,
  onPick,
  onOpenPath,
  onNewProject,
}: {
  busy: boolean;
  error: string | null;
  onPick: () => void;
  onOpenPath: (path: string) => void;
  onNewProject: (o: NewProjectOptions) => void;
}) {
  const [recents, setRecents] = useState<RegistryEntry[]>([]);
  const [showNew, setShowNew] = useState(false);

  const refresh = () => readRegistry().then(setRecents).catch(() => setRecents([]));
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 overflow-auto p-8">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="pp-gradient-text text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
            Crie um novo projeto ou continue de onde parou.
          </p>
        </div>
        <button
          onClick={onPick}
          disabled={busy}
          className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          style={{ background: "rgb(var(--c-white) / 0.06)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
          Abrir do disco
        </button>
      </motion.header>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgb(229 79 79 / 0.12)", color: "#ffb3b3", border: "1px solid rgb(229 79 79 / 0.3)" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <motion.button
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          onClick={() => setShowNew(true)}
          className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)]"
          style={{ border: "1.5px dashed var(--border-strong)", color: "var(--text-tertiary)" }}
        >
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-white"
            style={{ background: "var(--accent-gradient)", boxShadow: "var(--accent-glow)" }}
          >
            <Plus size={22} />
          </div>
          <span className="text-sm font-medium">Novo projeto</span>
        </motion.button>

        {recents.map((entry) => (
          <ProjectCard
            key={entry.path}
            entry={entry}
            onOpen={() => onOpenPath(entry.path)}
            onRemove={() => removeFromRegistry(entry.path).then(refresh)}
          />
        ))}
      </div>

      {recents.length === 0 && (
        <div className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Nenhum projeto recente ainda.
        </div>
      )}

      {showNew && (
        <NewProjectDialog
          onClose={() => setShowNew(false)}
          onCreate={(o) => {
            setShowNew(false);
            onNewProject(o);
          }}
        />
      )}
    </div>
  );
}
