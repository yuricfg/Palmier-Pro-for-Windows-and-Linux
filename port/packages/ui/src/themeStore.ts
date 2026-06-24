import { create } from "zustand";

export type ThemePreset = "dark" | "oled" | "liquid-glass";

/** Recommended opacity/blur when a preset is selected; individual knobs override live. */
const presetDefaults: Record<ThemePreset, { surfaceOpacity: number; glassBlur: number }> = {
  dark: { surfaceOpacity: 1, glassBlur: 0 },
  oled: { surfaceOpacity: 1, glassBlur: 0 },
  "liquid-glass": { surfaceOpacity: 0.55, glassBlur: 18 },
};

export interface ThemeState {
  preset: ThemePreset;
  /** sRGB accent as hex (#rrggbb). */
  accent: string;
  /** Opacity of panel surfaces (0–1). Lower = glassier. */
  surfaceOpacity: number;
  /** backdrop-filter blur in px. */
  glassBlur: number;
  /** Optional background image URL applied behind the app shell. */
  backgroundImage: string | null;

  setPreset: (preset: ThemePreset) => void;
  setAccent: (hex: string) => void;
  setSurfaceOpacity: (value: number) => void;
  setGlassBlur: (px: number) => void;
  setBackgroundImage: (url: string | null) => void;
  /** Push the full state onto :root. Call once on mount. */
  apply: () => void;
}

function hexToChannels(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return "245 239 228";
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)].join(" ");
}

function writeVars(state: ThemeState): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", state.preset);
  root.style.setProperty("--accent", hexToChannels(state.accent));
  root.style.setProperty("--surface-opacity", String(state.surfaceOpacity));
  root.style.setProperty("--glass-blur", `${state.glassBlur}px`);
  root.style.setProperty("--bg-image", state.backgroundImage ? `url("${state.backgroundImage}")` : "none");
}

export const useTheme = create<ThemeState>()((set, get) => ({
  preset: "dark",
  accent: "#f5efe4",
  surfaceOpacity: 1,
  glassBlur: 0,
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
