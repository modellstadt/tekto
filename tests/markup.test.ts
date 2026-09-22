/**
 * How a hand-drawn mark is read before anything is raycast.
 *
 * The kind decides how the scene is sampled — a loop samples what it encloses,
 * a line what it runs over — so a wobbly circle read as a "stroke" would point
 * the agent at the rim instead of the thing inside. These are pure functions of
 * screen points, so they're checked here rather than by drawing in a browser.
 */
import { describe, it, expect } from "vitest";
import { classify, simplify, resample, gridInside } from "../src/sketch/Markup";

type Pt = [number, number];
const circle = (cx: number, cy: number, r: number, n = 60, wobble = 0): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2 * 0.95;          // a hand rarely closes the loop exactly
    const rr = r + (i % 2 ? wobble : -wobble);
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
const line = (a: Pt, b: Pt, n = 20): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);

describe("classify", () => {
  it("reads a nearly closed, wobbly circle as a loop", () => {
    expect(classify([circle(100, 100, 40, 60, 3)])).toBe("loop");
  });
  it("reads a straight drag as a line and a tap as a point", () => {
    expect(classify([line([0, 0], [200, 50])])).toBe("line");
    expect(classify([[[5, 5], [6, 6]]])).toBe("point");
  });
  it("reads two crossing straight strokes as a cross-out", () => {
    expect(classify([line([0, 0], [100, 100]), line([0, 100], [100, 0])])).toBe("cross");
  });
  it("reads an open curve as a free stroke, not a loop", () => {
    expect(classify([circle(100, 100, 40, 60).slice(0, 30)])).toBe("stroke");
  });
});

describe("simplify / resample / gridInside", () => {
  it("keeps a straight stroke to its two ends and caps point count", () => {
    expect(simplify(line([0, 0], [300, 0], 100), 24)).toEqual([[0, 0], [300, 0]]);
    expect(simplify(circle(0, 0, 100, 400), 24).length).toBeLessThanOrEqual(24);
  });
  it("resamples evenly and never exceeds the cap", () => {
    const pts = resample(line([0, 0], [1000, 0], 3), 8, 80);
    expect(pts.length).toBeLessThanOrEqual(82);
    expect(pts[pts.length - 1]).toEqual([1000, 0]);
  });
  it("samples only inside the ring", () => {
    const ring = circle(0, 0, 50, 80);
    const pts = gridInside(ring, 150);
    expect(pts.length).toBeGreaterThan(50);
    expect(pts.every(([x, y]) => Math.hypot(x, y) < 50)).toBe(true);
  });
});
