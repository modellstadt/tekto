/**
 * The view-mode icons. Each is a picture of what its mode does to a cube, so
 * what is checked is that the three pictures say three different things: a
 * solid with toned faces, a see-through with its hidden edges, and the
 * visible edges alone.
 */
import { describe, it, expect } from "vitest";
import {
  viewModeIconShapes, viewModeIconSvg, VIEW_MODE_ICON_CORNERS, type IconShape,
} from "../src/render/viewModeIcons";

const filled = (s: IconShape[]) => s.filter((x) => x.kind === "polygon" && x.fill !== undefined);
const faint = (s: IconShape[]) => s.filter((x) => x.kind === "line" && x.opacity !== undefined);

describe("view mode icons", () => {
  it("draws shaded as three faces in three tones", () => {
    const tones = filled(viewModeIconShapes("shaded")).map((x) => (x as { fill: number }).fill);
    expect(tones).toHaveLength(3);
    expect(new Set(tones).size).toBe(3);
    expect(faint(viewModeIconShapes("shaded"))).toHaveLength(0);
  });

  it("draws ghost see-through, with the three edges a solid hides", () => {
    const shapes = viewModeIconShapes("ghost");
    expect(faint(shapes)).toHaveLength(3);
    // one light fill over the whole silhouette, nothing opaque
    expect(filled(shapes).every((x) => (x as { fill: number }).fill < 0.5)).toBe(true);
  });

  it("draws hidden line as the visible edges only", () => {
    const shapes = viewModeIconShapes("hidden-line");
    expect(filled(shapes)).toHaveLength(0);
    expect(faint(shapes)).toHaveLength(0);
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
    expect(viewModeIconSvg("shaded")).not.toBe(viewModeIconSvg("hidden-line"));
  });
});
