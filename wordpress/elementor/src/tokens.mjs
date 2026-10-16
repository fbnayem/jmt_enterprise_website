/**
 * Design tokens copied from src/app/globals.css (Tailwind @theme) and the
 * Tailwind defaults the site uses, so Elementor output matches the live site.
 */

export const color = {
  brand50: "#eef3fb",
  brand100: "#dbe5f6",
  brand200: "#b9cbec",
  brand300: "#8aa6dc",
  brand400: "#5a7fc6",
  brand500: "#3760ad",
  brand600: "#1f4892",
  brand700: "#173a7a",
  brand800: "#112f66",
  brand900: "#0c2650",
  brand950: "#071733",
  accent300: "#ff9e9e",
  accent400: "#f66b6b",
  accent500: "#e23a3a",
  accent600: "#c8161a",
  accent700: "#b00a0c",
  ink: "#0b1226",
  muted: "#4a5571",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald400: "#34d399",
  emerald600: "#059669",
  // text-brand-100/90 on navy
  brand100_90: "rgba(219, 229, 246, 0.9)",
  brand100_80: "rgba(219, 229, 246, 0.8)",
};

export const font = {
  family: "Plus Jakarta Sans",
};

/** Tailwind font-size scale: [size px, line-height px]. */
export const textSize = {
  xs: [12, 16],
  sm: [14, 20],
  base: [16, 24],
  lg: [18, 28],
  xl: [20, 28],
  "2xl": [24, 32],
  "3xl": [30, 36],
  "4xl": [36, 40],
  "5xl": [48, 48],
  "6xl": [60, 60],
  "7xl": [72, 72],
  "8xl": [96, 96],
};

/**
 * Page widths. Tailwind `container-page` is max-w-7xl (1280px) including
 * px-4 / sm:px-6 / lg:px-8 padding, so the boxed inner width is 1280 - 64.
 * Narrower pages override max-width (max-w-3xl etc.) with the same padding.
 */
export const width = {
  page: 1216, // max-w-7xl
  "5xl": 960, // max-w-5xl (1024 - 64)
  "4xl": 832, // max-w-4xl (896 - 64)
  "3xl": 704, // max-w-3xl (768 - 64)
  "2xl": 608, // max-w-2xl (672 - 64)
  xl: 512, // max-w-xl (576 - 64)
};

/** Horizontal page gutters: desktop (lg:px-8), tablet (sm:px-6), mobile (px-4). */
export const gutter = { desktop: 32, tablet: 24, mobile: 16 };

/** Public logo, pinned to a commit so the URL never changes. Elementor downloads it on import. */
export const LOGO_URL =
  "https://raw.githubusercontent.com/fbnayem/jmt_enterprise_website/7c74fde848004c56f1314c8267d13ca7eceba93b/public/brand/jmt-logo.png";
export const LOGO_SIZE = { width: 640, height: 432 };
