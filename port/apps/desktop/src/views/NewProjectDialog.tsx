import { useState } from "react";
import { motion } from "framer-motion";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, X } from "lucide-react";
import type { NewProjectOptions } from "../App";

const resolutions = [
  { label: "1080p (16:9)", width: 1920, height: 1080 },
  { label: "4K (16:9)", width: 3840, height: 2160 },
  { label: "Vertical (9:16)", width: 1080, height: 1920 },
  { label: "720p (16:9)", width: 1280, height: 720 },
];
const fpsOptions = [24, 30, 60];

export function NewProjectDialog({
  onCreate,
  onClose,
}: {
  onCreate: (o: NewProjectOptions) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("Untitled Project");
  const [dir, setDir] = useState<string | null>(null);
  const [res, setRes] = useState(0);
  const [fps, setFps] = useState(30);

  const canCreate = name.trim().length > 0 && !!dir;

  async function pickDir() {
    const chosen = await open({ directory: true, title: "Onde salvar o projeto" });
    if (typeof chosen === "string") setDir(chosen);
  }

  function submit() {
    if (!canCreate || !dir) return;
    const r = resolutions[res]!;
    onCreate({ dir, name: name.trim(), fps, width: r.width, height: r.height });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgb(0 0 0 / 0.5)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="pp-glass w-[440px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Novo projeto
          </h2>
          <button onClick={onClose} className="cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>
          Nome
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          className="mb-4 w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "rgb(var(--c-white) / 0.06)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
        />

        <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>
          Resolução
        </label>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {resolutions.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRes(i)}
              className="cursor-pointer rounded-lg px-3 py-2 text-left text-xs"
              style={{
                background: i === res ? "rgb(var(--c-white) / 0.08)" : "rgb(var(--c-white) / 0.03)",
                border: `1px solid ${i === res ? "var(--accent-color)" : "var(--border-subtle)"}`,
                color: "var(--text-secondary)",
              }}
            >
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>{r.label}</div>
              <div style={{ color: "var(--text-muted)" }}>{r.width}×{r.height}</div>
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>
          FPS
        </label>
        <div className="mb-4 flex gap-2">
          {fpsOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFps(f)}
              className="flex-1 cursor-pointer rounded-lg py-2 text-sm"
              style={{
                background: f === fps ? "rgb(var(--c-white) / 0.08)" : "rgb(var(--c-white) / 0.03)",
                border: `1px solid ${f === fps ? "var(--accent-color)" : "var(--border-subtle)"}`,
                color: "var(--text-primary)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={pickDir}
          className="mb-5 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{ background: "rgb(var(--c-white) / 0.06)", border: "1px solid var(--border-subtle)", color: dir ? "var(--text-secondary)" : "var(--text-muted)" }}
        >
          <FolderOpen size={16} />
          <span className="truncate">{dir ?? "Escolher pasta…"}</span>
        </button>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="cursor-pointer rounded-lg px-4 py-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!canCreate}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent-gradient)", boxShadow: "var(--accent-glow)" }}
          >
            Criar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
