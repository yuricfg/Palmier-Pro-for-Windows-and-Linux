import { create } from "zustand";

export type ThemePreset = "dark" | "oled" | "liquid-glass";

/** Recommended opacity/blur when a preset is selected; individual knobs override live. */
const presetDefaults: Record<ThemePreset, { surfaceOpacity: number; glassBlur: number }> = {
  dark: { surfaceOpacity: 1, glassBlur: 0 },
  oled: { surfaceOpacity: 1, glassBlur: 0 },
  "liquid-glass": { surfaceOpacity: 0.7, glassBlur: 16 },
};

export interface ThemeState {
  preset: ThemePreset;
  /** Primary accent as hex (#rrggbb). */
  accent: string;
  /** Secondary accent — the far stop of the accent gradient. */
  accent2: string;
  /** Opacity of panel surfaces (0–1). Lower = glassier. */
  surfaceOpacity: number;
  /** backdrop-filter blur in px. */
  glassBlur: number;
  /** Optional background image URL applied behind the app shell. */
  backgroundImage: string | null;

  setPreset: (preset: ThemePreset) => void;
  setAccent: (hex: string) => void;
  setAccent2: (hex: string) => void;
  setSurfaceOpacity: (value: number) => void;
  setGlassBlur: (px: number) => void;
  setBackgroundImage: (url: string | null) => void;
  /** Push the full state onto :root. Call once on mount. */
  apply: () => void;
}

function hexToChannels(hex: string, fallback: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return fallback;
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)].join(" ");
}

function writeVars(state: ThemeState): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", state.preset);
  root.style.setProperty("--accent", hexToChannels(state.accent, "99 102 241"));
  root.style.setProperty("--accent-2", hexToChannels(state.accent2, "168 85 247"));
  root.style.setProperty("--surface-opacity", String(state.surfaceOpacity));
  root.style.setProperty("--glass-blur", `${state.glassBlur}px`);
  root.style.setProperty("--bg-image", state.backgroundImage ? `url("${state.backgroundImage}")` : "none");
}

export const useTheme = create<ThemeState>()((set, get) => ({
  preset: "liquid-glass",
  accent: "#6366f1",
  accent2: "#a855f7",
  surfaceOpacity: 0.7,
  glassBlur: 16,
  backgroundImage: null,

  setPreset: (preset) => {
    const d = presetDefaults[preset];
    set({ preset, surfaceOpacity: d.surfaceOpacity, glassBlur: d.glassBlur });
    writeVars(get());
  },
  setAccent: (accent) => {
    set({ accent });
    writeVars(get());
  },
  setAccent2: (accent2) => {
    set({ accent2 });
    writeVars(get());
  },
  setSurfaceOpacity: (surfaceOpacity) => {
    set({ surfaceOpacity });
    writeVars(get());
  },
  setGlassBlur: (glassBlur) => {
    set({ glassBlur });
    writeVars(get());
  },
  setBackgroundImage: (backgroundImage) => {
    set({ backgroundImage });
    writeVars(get());
  },
  apply: () => writeVars(get()),
}));
