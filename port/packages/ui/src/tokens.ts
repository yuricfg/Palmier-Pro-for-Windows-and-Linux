// Design tokens ported from Sources/PalmierPro/UI/AppTheme.swift.
// Numeric/semantic source of truth for JS consumers (e.g. timeline track colors).
// The CSS-variable surface of these lives in theme.css; runtime knobs in themeStore.ts.

/** sRGB channel triplets "r g b" (0–255) so CSS can compose alpha: rgb(var(--x) / a). */
export const channels = {
  base: "10 10 10",
  surface: "22 22 22",
  raised: "30 30 30",
  prominent: "44 44 44",
  white: "255 255 255",
  /** Warm off-white accent (AppTheme.Accent.primary). */
  accent: "245 239 228",
} as const;

export const trackColors: Record<string, string> = {
  video: "#0091c2",
  audio: "#58a822",
  image: "#b72dd2",
  text: "#b72dd2",
  lottie: "#e0a800",
};

export const status = {
  error: "#e54f4f",
  success: "#4fb85f",
};

/** AppTheme.Opacity scale. */
export const opacity = {
  subtle: 0.04,
  hint: 0.06,
  faint: 0.08,
  soft: 0.1,
  muted: 0.15,
  moderate: 0.25,
  medium: 0.35,
  strong: 0.55,
  prominent: 0.8,
} as const;

/** AppTheme.Radius (px). */
export const radius = { xs: 3, xsSm: 4, sm: 6, md: 10, mdLg: 12, lg: 14, xl: 20 } as const;

/** AppTheme.Spacing (px). */
export const spacing = {
  xxs: 2, xs: 4, sm: 6, smMd: 8, md: 10, mdLg: 12, lg: 14, lgXl: 16, xl: 20, xlXxl: 24, xxl: 28,
} as const;

/** AppTheme.FontSize (px). */
export const fontSize = {
  micro: 8, xxs: 9, xs: 10, sm: 11, smMd: 12, md: 13, mdLg: 14, lg: 15, xl: 18,
  title1: 22, title2: 28, display: 36,
} as const;

export const anim = { hover: 0.15, transition: 0.2 } as const;
