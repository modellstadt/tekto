// src/gui/theme.ts
var DARK = {
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
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
var LIGHT = {
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
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
function getTheme(mode = "dark") {
  return mode === "light" ? LIGHT : DARK;
}

export {
  getTheme
};
