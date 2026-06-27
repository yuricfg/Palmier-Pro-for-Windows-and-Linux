import { motion } from "framer-motion";
import { Home, Clapperboard, SlidersHorizontal, Film, type LucideIcon } from "lucide-react";
import { spring } from "./motion";

export type Route = "home" | "editor" | "appearance";

const items: { id: Route; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "editor", label: "Editor", icon: Film },
  { id: "appearance", label: "Aparência", icon: SlidersHorizontal },
];

export function Sidebar({
  route,
  onNavigate,
  hasProject,
}: {
  route: Route;
  onNavigate: (r: Route) => void;
  hasProject: boolean;
}) {
  return (
    <aside
      className="pp-glass relative z-10 flex w-60 shrink-0 flex-col gap-1 p-3"
      style={{ borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0 }}
    >
      <div className="mb-6 flex items-center gap-3 px-2 pt-2">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl text-white"
          style={{ background: "var(--accent-gradient)", boxShadow: "var(--accent-glow)" }}
        >
          <Clapperboard size={18} strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Palmier Pro
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            cross-platform · v0.1
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = route === it.id;
          const dim = it.id === "editor" && !hasProject;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className="relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium"
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "rgb(var(--c-white) / 0.08)", border: "1px solid var(--border-subtle)" }}
                  transition={spring}
                />
              )}
              <span
                className="relative z-10 flex items-center gap-3 transition-colors"
                style={{ color: active ? "var(--text-primary)" : dim ? "var(--text-muted)" : "var(--text-tertiary)" }}
              >
                <Icon size={17} strokeWidth={2} style={{ color: active ? "var(--accent-color)" : "var(--text-muted)" }} />
                {it.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
