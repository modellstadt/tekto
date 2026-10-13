/**
 * The view-mode icons. Each is a picture of what its render mode does to a cube, so what is
 * checked is that the pictures say different things: a solid with toned faces, a
 * see-through with its hidden edges faint, the visible edges alone, and every edge.
 */
import { describe, it, expect } from "vitest";
import {
  viewModeIconShapes, viewModeIconSvg, VIEW_MODE_ICON_CORNERS, type IconShape,
} from "../src/gui/viewModeIcons";

const filled = (s: IconShape[]) => s.filter((x) => x.kind === "polygon" && x.fill !== undefined);
const faint = (s: IconShape[]) => s.filter((x) => x.kind === "line" && x.opacity !== undefined);
const lines = (s: IconShape[]) => s.filter((x) => x.kind === "line");

describe("view mode icons", () => {
  it("draws solid as three faces in three tones", () => {
    const tones = filled(viewModeIconShapes("solid")).map((x) => (x as { fill: number }).fill);
    expect(tones).toHaveLength(3);
    expect(new Set(tones).size).toBe(3);
    expect(faint(viewModeIconShapes("solid"))).toHaveLength(0);
  });

  it("draws ghost see-through, with the three edges a solid hides", () => {
    const shapes = viewModeIconShapes("ghost");
    expect(faint(shapes)).toHaveLength(3);
    expect(filled(shapes).every((x) => (x as { fill: number }).fill < 0.5)).toBe(true);
  });

  it("draws hidden line as the visible edges only, wireframe as every edge", () => {
    const hl = viewModeIconShapes("hiddenline"), wire = viewModeIconShapes("wireframe");
    expect(filled(hl)).toHaveLength(0);
    expect(faint(hl)).toHaveLength(0);
    expect(filled(wire)).toHaveLength(0);
    expect(faint(wire)).toHaveLength(0);
    expect(lines(wire).length).toBe(lines(hl).length + 3);
  });

  it("keeps the hidden corner off the front one, or ghost and hidden line look alike", () => {
    const { front, back } = VIEW_MODE_ICON_CORNERS;
    expect(Math.hypot(front[0] - back[0], front[1] - back[1])).toBeGreaterThan(1.5);
  });

  it("renders as SVG in currentColor at the size asked for", () => {
    const svg = viewModeIconSvg("ghost", 14);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="14"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg.match(/stroke-opacity/g)).toHaveLength(3);
    expect(viewModeIconSvg("solid")).not.toBe(viewModeIconSvg("hiddenline"));
  });
});
