import type { ReactNode } from "react";
import { HomeIcon, SlidersIcon, LayersIcon } from "./icons";

export type Route = "home" | "appearance";

const items: { id: Route; label: string; icon: ReactNode }[] = [
  { id: "home", label: "Início", icon: <HomeIcon /> },
  { id: "appearance", label: "Aparência", icon: <SlidersIcon /> },
];

export function Sidebar({ route, onNavigate }: { route: Route; onNavigate: (r: Route) => void }) {
  return (
    <aside
      className="pp-surface flex w-56 shrink-0 flex-col gap-1 p-3"
      style={{ borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none" }}
    >
      <div className="mb-4 flex items-center gap-2 px-2 pt-1">
        <div
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: "var(--accent-color)", color: "rgb(var(--c-base))" }}
        >
          <LayersIcon width={18} height={18} />
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

      {items.map((it) => {
        const active = route === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onNavigate(it.id)}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors"
            style={{
              background: active ? "rgb(var(--c-white) / 0.08)" : "transparent",
              color: active ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            <span style={{ color: active ? "var(--accent-color)" : "var(--text-muted)" }}>{it.icon}</span>
            {it.label}
          </button>
        );
      })}
    </aside>
  );
}
