/**
 * Tekto GUI theme — the single source of panel chrome colors.
 *
 * Every tekto panel (sketch, sketch2d, appShell, LayerPanel, ControlPanel)
 * derives its colors from here instead of re-declaring hex literals inline.
 *
 * Chrome is WHITE on the dark background by design: white slider accents and
 * value labels, white toggle tracks, plain white titles — no colored accents
 * in panel chrome. (Content colors — e.g. a colorPicker's default value — are
 * the sketch's business, not the theme's.)
 */

export interface Theme {
  isDark: boolean;
  /** App background behind the viewport */
  bg: string;
  /** Panel / header background */
  panelBg: string;
  /** Elevated surface (dropdowns, popovers) */
  popupBg: string;
  /** Hairline borders between panel sections */
  border: string;
  /** Borders on individual controls (inputs, selects, buttons) */
  controlBorder: string;
  /** Primary text */
  text: string;
  /** Secondary text (control labels) */
  textDim: string;
  /** Tertiary text (group headers, disabled) */
  textFaint: string;
  /** Chrome accent — white on dark, near-black on light */
  accent: string;
  /** Hover wash for rows / buttons */
  hoverBg: string;
  /** Input field background (selects, text inputs) */
  fieldBg: string;
  /** Panel font stack */
  font: string;
}

const DARK: Theme = {
  isDark: true,
  bg: "#07080e",
  panelBg: "#0c0d16",
  popupBg: "#0d0f1e",
  border: "#16182a",
  controlBorder: "#1e2140",
  text: "#b8bdd4",
  textDim: "#7a80a0",
  textFaint: "#5a6080",
  accent: "#ffffff",
  hoverBg: "rgba(255,255,255,.06)",
  fieldBg: "#07080e",
  font: "'IBM Plex Mono',ui-monospace,monospace",
};

const LIGHT: Theme = {
  isDark: false,
  bg: "#f4f5f8",
  panelBg: "#ffffff",
  popupBg: "#f5f6fa",
  border: "#e0e2ea",
  controlBorder: "#d0d3de",
  text: "#2a2d3a",
  textDim: "#5a6080",
  textFaint: "#8a8fa0",
  accent: "#16182c",
  hoverBg: "rgba(0,0,0,.05)",
  fieldBg: "#f4f5f8",
  font: "'IBM Plex Mono',ui-monospace,monospace",
};

export function getTheme(mode: "dark" | "light" = "dark"): Theme {
  return mode === "light" ? LIGHT : DARK;
}
