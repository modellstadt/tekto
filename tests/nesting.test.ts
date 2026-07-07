import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { PolygonBool, type Ring2 } from "../src/core/geometry/PolygonBool";
import { NoFitPolygon } from "../src/core/geometry/NoFitPolygon";
import { Polygon2D } from "../src/core/geometry/Polygon2D";

const rect = (x0: number, y0: number, x1: number, y1: number): Ring2 => [
  new Vec2(x0, y0), new Vec2(x1, y0), new Vec2(x1, y1), new Vec2(x0, y1),
];

const bboxOf = (rings: Ring2[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rings) for (const p of r) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
};

describe("PolygonBool — booleans with holes", () => {
  it("union of two overlapping squares = sum − overlap", () => {
    const a = PolygonBool.fromRing(rect(0, 0, 10, 10));   // 100
    const b = PolygonBool.fromRing(rect(5, 5, 15, 15));   // 100, overlap 25
    const u = PolygonBool.union(a, b);
    expect(PolygonBool.area(u)).toBeCloseTo(175, 6);
    expect(u.length).toBe(1); // single connected region
  });

  it("difference cuts a hole-free notch", () => {
    const a = PolygonBool.fromRing(rect(0, 0, 10, 10));
    const b = PolygonBool.fromRing(rect(8, -1, 11, 11)); // slice off right strip
    const d = PolygonBool.difference(a, b);
    expect(PolygonBool.area(d)).toBeCloseTo(80, 6);
  });

  it("union of four bars around a gap produces a polygon WITH a hole", () => {
    // A 30×30 frame with a 10×10 central void, assembled from 4 bars.
    const bars = [
      PolygonBool.fromRing(rect(0, 0, 30, 10)),   // bottom
      PolygonBool.fromRing(rect(0, 20, 30, 30)),  // top
      PolygonBool.fromRing(rect(0, 10, 10, 20)),  // left
      PolygonBool.fromRing(rect(20, 10, 30, 20)), // right
    ];
    const u = PolygonBool.union(...bars);
    expect(u.length).toBe(1);          // one polygon
    expect(u[0].length).toBe(2);       // outer ring + ONE hole
    // Frame area = 900 − 100 central void
    expect(PolygonBool.area(u)).toBeCloseTo(800, 6);
  });
});

describe("NoFitPolygon — NFP & inner-fit identities", () => {
  it("NFP of two equal squares is a square of double the side, centred on origin", () => {
    const s = 10;
    const sq = rect(0, 0, s, s);
    const nfp = NoFitPolygon.nfp(sq, sq);
    expect(nfp.length).toBe(1);
    expect(PolygonBool.area(nfp)).toBeCloseTo((2 * s) ** 2, 4); // 400
    const bb = bboxOf(PolygonBool.rings(nfp));
    expect(bb.minX).toBeCloseTo(-s, 6);
    expect(bb.minY).toBeCloseTo(-s, 6);
    expect(bb.maxX).toBeCloseTo(s, 6);
    expect(bb.maxY).toBeCloseTo(s, 6);
  });

  it("inner-fit of a square in a rectangle is the inset rectangle", () => {
    const W = 100, H = 60, a = 12;
    const ifp = NoFitPolygon.innerFit(rect(0, 0, W, H), rect(0, 0, a, a));
    expect(PolygonBool.area(ifp)).toBeCloseTo((W - a) * (H - a), 4); // 88*48
    const bb = bboxOf(PolygonBool.rings(ifp));
    expect(bb.minX).toBeCloseTo(0, 6);
    expect(bb.minY).toBeCloseTo(0, 6);
    expect(bb.maxX).toBeCloseTo(W - a, 6);
    expect(bb.maxY).toBeCloseTo(H - a, 6);
  });

  it("Minkowski sum of a concave (L) shape with a square stays area-consistent and simple", () => {
    // L-shape (concave) — exercises convex decomposition.
    const L: Ring2 = [
      new Vec2(0, 0), new Vec2(20, 0), new Vec2(20, 8),
      new Vec2(8, 8), new Vec2(8, 20), new Vec2(0, 20),
    ];
    const box = rect(0, 0, 4, 4);
    const sum = NoFitPolygon.minkowskiSum(L, box);
    expect(sum.length).toBeGreaterThanOrEqual(1);
    // The sum must contain at least the original L's area plus growth.
    const lArea = Math.abs(Polygon2D.signedArea(L));
    expect(PolygonBool.area(sum)).toBeGreaterThan(lArea);
  });
});
