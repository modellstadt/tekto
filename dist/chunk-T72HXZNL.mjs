// src/gui/viewModeIcons.ts
var A = [3, 7.5];
var B = [13, 4];
var C = [21, 8];
var D = [11, 11.5];
var DROP = 9;
var down = ([x, y]) => [x, y + DROP];
var [A2, B2, C2, D2] = [A, B, C, D].map(down);
var pts = (...ps) => ps.map((p) => p.join(",")).join(" ");
var VIEW_MODE_ICON_CORNERS = { front: D, back: B2 };
var OUTLINE = pts(A, B, C, C2, D2, A2);
var inner = () => [[D, A], [D, C], [D, D2]].map(([from, to]) => ({ kind: "line", from, to }));
var hidden = (opacity) => [[B, B2], [A2, B2], [C2, B2]].map(([from, to]) => ({ kind: "line", from, to, ...opacity === void 0 ? {} : { opacity } }));
function viewModeIconShapes(mode) {
  if (mode === "solid") {
    return [
      { kind: "polygon", points: pts(A, B, C, D), fill: 0.18 },
      { kind: "polygon", points: pts(A, D, D2, A2), fill: 0.45 },
      { kind: "polygon", points: pts(D, C, C2, D2), fill: 0.8 },
      { kind: "polygon", points: OUTLINE, stroke: true },
      ...inner()
    ];
  }
  if (mode === "ghost") {
    return [
      { kind: "polygon", points: OUTLINE, fill: 0.12 },
      ...hidden(0.45),
      { kind: "polygon", points: OUTLINE, stroke: true },
      ...inner()
    ];
  }
  if (mode === "wireframe") return [...hidden(), { kind: "polygon", points: OUTLINE, stroke: true }, ...inner()];
  return [{ kind: "polygon", points: OUTLINE, stroke: true }, ...inner()];
}
var VIEW_MODE_ICON_SVG = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round",
  strokeLinecap: "round"
};
function viewModeIconSvg(mode, size = 16) {
  const a = VIEW_MODE_ICON_SVG;
  const body = viewModeIconShapes(mode).map((s) => {
    if (s.kind === "line") {
      const o = s.opacity !== void 0 ? ` stroke-opacity="${s.opacity}"` : "";
      return `<line x1="${s.from[0]}" y1="${s.from[1]}" x2="${s.to[0]}" y2="${s.to[1]}"${o}/>`;
    }
    const fill = s.fill !== void 0 ? ` fill="currentColor" fill-opacity="${s.fill}"` : "";
    return `<polygon points="${s.points}"${fill}${s.stroke ? "" : ` stroke="none"`}/>`;
  }).join("");
  return `<svg xmlns="${a.xmlns}" viewBox="${a.viewBox}" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${a.strokeWidth}" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${body}</svg>`;
}

export {
  VIEW_MODE_ICON_CORNERS,
  viewModeIconShapes,
  VIEW_MODE_ICON_SVG,
  viewModeIconSvg
};
