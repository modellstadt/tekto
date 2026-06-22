import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Polygon2D } from "../src/core/geometry/Polygon2D";

/**
 * Regression suite for the sign-convention bug we fixed in this
 * session: positive `distance` is OUTWARD (polygon grows), negative is
 * INWARD (polygon shrinks). The pre-fix implementation did the opposite
 * silently — the kind of bug that's easy to miss without explicit area
 * + vertex assertions.
 */
describe("Polygon2D.offset — sign convention + invariants", () => {
  const square: Vec2[] = [
    new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 10), new Vec2(0, 10),
  ]; // CCW, area = 100

  it("positive distance grows a CCW polygon (area increases)", () => {
    const out = Polygon2D.offset(square, 1);
    const a0 = Math.abs(Polygon2D.signedArea(square));
    const a1 = Math.abs(Polygon2D.signedArea(out));
    expect(a1).toBeGreaterThan(a0);
    expect(a1).toBeCloseTo(144, 1); // (10+2)² = 144
  });

  it("negative distance shrinks a CCW polygon (area decreases)", () => {
    const out = Polygon2D.offset(square, -1);
    const a0 = Math.abs(Polygon2D.signedArea(square));
    const a1 = Math.abs(Polygon2D.signedArea(out));
    expect(a1).toBeLessThan(a0);
    expect(a1).toBeCloseTo(64, 1); // (10−2)² = 64
  });

  it("CW input — same sign convention (positive = outward)", () => {
    const cw = [...square].reverse();
    const out = Polygon2D.offset(cw, 1);
    const a1 = Math.abs(Polygon2D.signedArea(out));
    expect(a1).toBeCloseTo(144, 1);
  });

  it("vertices on the offset polygon are at the right distance", () => {
    // For a 10×10 square offset by +1, SW corner goes from (0,0) to (-1,-1).
    const out = Polygon2D.offset(square, 1);
    // Find the vertex nearest (-1, -1).
    const sw = out.reduce((best, p) =>
      p.distSqTo(new Vec2(-1, -1)) < best.distSqTo(new Vec2(-1, -1)) ? p : best, out[0]);
    expect(sw.x).toBeCloseTo(-1, 5);
    expect(sw.y).toBeCloseTo(-1, 5);
  });

  it("round-trip out→in returns close to the original", () => {
    const grown   = Polygon2D.offset(square, 0.5);
    const shrunk  = Polygon2D.offset(grown, -0.5);
    for (let i = 0; i < square.length; i++) {
      expect(shrunk[i].x).toBeCloseTo(square[i].x, 4);
      expect(shrunk[i].y).toBeCloseTo(square[i].y, 4);
    }
  });

  it("polygons with <3 vertices return unchanged", () => {
    const pair = [new Vec2(0, 0), new Vec2(1, 0)];
    const out = Polygon2D.offset(pair, 1);
    expect(out.length).toBe(2);
  });
});
