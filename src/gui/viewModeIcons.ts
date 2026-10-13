/**
 * Icons for the render modes: one cube drawn the way each mode draws, as Rhino and Blender
 * show viewport shading. The icon is a small picture of what the mode does, not a metaphor
 * for it.
 *
 * - solid: its three faces in three tones, lit from above left
 * - ghost: see-through, the three hidden edges showing faintly
 * - hiddenline: only the edges a viewer can see
 * - wireframe: every edge, the hidden ones as strong as the rest
 *
 * The cube is a general axonometry rather than an isometric on purpose. In a true isometric
 * the hidden back corner projects onto the front one, so the edges that tell ghost from
 * hidden line would fall on lines already drawn and the two icons would be the same picture.
 *
 * Drawn on a 24 unit grid in `currentColor`, the convention of lucide and most icon sets,
 * so they size and colour like the icons beside them. The shapes are plain data
 * (`viewModeIconShapes`); `viewModeIconSvg` renders them as a string for DOM apps and
 * `tekto/react`'s `ViewModeIcon` as JSX.
 */
import type { RenderMode } from "../scene/Scene";

/** One shape of a view-mode icon: a polygon (filled at `fill` opacity, outlined if `stroke`) or a line (at `opacity`). */
export type IconShape =
  | { kind: "polygon"; points: string; fill?: number; stroke?: boolean }
  | { kind: "line"; from: [number, number]; to: [number, number]; opacity?: number };

type P = [number, number];
// the top face, left, back, right, front; the bottom face is the top dropped
const A: P = [3, 7.5], B: P = [13, 4], C: P = [21, 8], D: P = [11, 11.5];
const DROP = 9;
const down = ([x, y]: P): P => [x, y + DROP];
const [A2, B2, C2, D2] = [A, B, C, D].map(down);
const pts = (...ps: P[]) => ps.map((p) => p.join(",")).join(" ");

/** The front corner and the hidden back one: distinct, which is the point. */
export const VIEW_MODE_ICON_CORNERS = { front: D, back: B2 } as const;

const OUTLINE = pts(A, B, C, C2, D2, A2);
const inner = (): IconShape[] =>
  [[D, A], [D, C], [D, D2]].map(([from, to]) => ({ kind: "line", from, to }));
// the three edges a solid hides, all meeting at the back bottom corner
const hidden = (opacity?: number): IconShape[] =>
  [[B, B2], [A2, B2], [C2, B2]].map(([from, to]) => ({ kind: "line", from, to, ...(opacity === undefined ? {} : { opacity }) }));

/** What to draw for a render mode, back to front. */
export function viewModeIconShapes(mode: RenderMode): IconShape[] {
  if (mode === "solid") {
    return [
      { kind: "polygon", points: pts(A, B, C, D), fill: 0.18 },
      { kind: "polygon", points: pts(A, D, D2, A2), fill: 0.45 },
      { kind: "polygon", points: pts(D, C, C2, D2), fill: 0.8 },
      { kind: "polygon", points: OUTLINE, stroke: true },
      ...inner(),
    ];
  }
  if (mode === "ghost") {
    return [
      { kind: "polygon", points: OUTLINE, fill: 0.12 },
      ...hidden(0.45),
      { kind: "polygon", points: OUTLINE, stroke: true },
      ...inner(),
    ];
  }
  if (mode === "wireframe") return [...hidden(), { kind: "polygon", points: OUTLINE, stroke: true }, ...inner()];
  return [{ kind: "polygon", points: OUTLINE, stroke: true }, ...inner()];
}

/** The SVG root's attributes, shared by the string and the React form. */
export const VIEW_MODE_ICON_SVG = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;

/**
 * A render mode's icon as SVG markup, for a DOM app: `button.innerHTML =
 * viewModeIconSvg("ghost")`. `size` in pixels, 16 by default.
 */
export function viewModeIconSvg(mode: RenderMode, size = 16): string {
  const a = VIEW_MODE_ICON_SVG;
  const body = viewModeIconShapes(mode).map((s) => {
    if (s.kind === "line") {
      const o = s.opacity !== undefined ? ` stroke-opacity="${s.opacity}"` : "";
      return `<line x1="${s.from[0]}" y1="${s.from[1]}" x2="${s.to[0]}" y2="${s.to[1]}"${o}/>`;
    }
    const fill = s.fill !== undefined ? ` fill="currentColor" fill-opacity="${s.fill}"` : "";
    return `<polygon points="${s.points}"${fill}${s.stroke ? "" : ` stroke="none"`}/>`;
  }).join("");
  return `<svg xmlns="${a.xmlns}" viewBox="${a.viewBox}" width="${size}" height="${size}" fill="none" `
    + `stroke="currentColor" stroke-width="${a.strokeWidth}" stroke-linejoin="round" `
    + `stroke-linecap="round" aria-hidden="true">${body}</svg>`;
}
