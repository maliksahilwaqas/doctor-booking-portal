export type AccentName = "blue" | "teal" | "indigo" | "green" | "maroon";

export interface AccentTheme {
  label: string;
  accent: string;
  accent700: string;
  accent600: string;
  accent200: string;
  accent100: string;
  accent400: string;
}

// Named accent options an admin can pick from the Branding tab, exactly as
// defined in the Claude Design mockup's `ACCENTS` table.
export const ACCENT_THEMES: Record<AccentName, AccentTheme> = {
  blue: { label: "Blue", accent: "#1445e0", accent700: "#0c2f9e", accent600: "#0f3ac6", accent200: "#dbe3ff", accent100: "#eef2ff", accent400: "#7f9bff" },
  teal: { label: "Teal", accent: "#0d7d74", accent700: "#075049", accent600: "#0a6660", accent200: "#c9ece9", accent100: "#e8f6f4", accent400: "#5fbdb5" },
  indigo: { label: "Indigo", accent: "#3a2fb8", accent700: "#251d80", accent600: "#2f269c", accent200: "#dcd9f7", accent100: "#eeecfb", accent400: "#8f88e0" },
  green: { label: "Green", accent: "#2c7a2f", accent700: "#1c521f", accent600: "#236428", accent200: "#d3ead4", accent100: "#eaf5ea", accent400: "#79bd7c" },
  maroon: { label: "Maroon", accent: "#9a1f3c", accent700: "#671227", accent600: "#7f1832", accent200: "#f0d3da", accent100: "#f8eaee", accent400: "#cf7d92" },
};

export const ACCENT_NAMES = Object.keys(ACCENT_THEMES) as AccentName[];
