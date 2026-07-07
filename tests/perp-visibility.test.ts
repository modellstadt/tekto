import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Polygon2D } from "../src/core/geometry/Polygon2D";
import type { Ring2 } from "../src/core/geometry/PolygonBool";
import {
  perpVisibility, perpVisibilityOfPolys, edgeOutwardVisibility, type PerpSegment,
} from "../src/core/geometry/PerpVisibility";

const area = (rings: Ring2[]) => rings.reduce((s, r) => s + Math.abs(Polygon2D.signedArea(r)), 0);

describe("perpVisibility", () => {
  it("with no obstacles fills the full base × maxDist slab", () => {
    const rings = perpVisibility(new Vec2(0, 0), new Vec2(10, 0), [], 100);
    expect(rings.length).toBe(1);
    expect(area(rings)).toBeCloseTo(10 * 100, 3);
  });

  it("a partial overhead wall casts the expected shadow", () => {
    // emitter [0,10] on the x-axis; a wall at y=5 over x∈[2,8]; rays go +y.
    // lit = 2 columns to maxDist + 6 columns to y=5 + 2 columns to maxDist
    const wall: PerpSegment = [new Vec2(2, 5), new Vec2(8, 5)];
    const rings = perpVisibility(new Vec2(0, 0), new Vec2(10, 0), [wall], 100);
    expect(area(rings)).toBeCloseTo(2 * 100 + 6 * 5 + 2 * 100, 2);
  });

  it("a full overhead wall splits nothing but caps the beam at the wall", () => {
    const wall: PerpSegment = [new Vec2(-1, 4), new Vec2(11, 4)];
    const rings = perpVisibility(new Vec2(0, 0), new Vec2(10, 0), [wall], 100);
    expect(area(rings)).toBeCloseTo(10 * 4, 2);
  });

  it("ignores obstacles behind the emitter (y < 0)", () => {
    const behind: PerpSegment = [new Vec2(2, -5), new Vec2(8, -5)];
    const rings = perpVisibility(new Vec2(0, 0), new Vec2(10, 0), [behind], 100);
    expect(area(rings)).toBeCloseTo(10 * 100, 2);
  });

  it("is rotation-invariant (same area on a tilted emitter)", () => {
    // rotate the whole configuration 30° about the origin
    const t = Math.PI / 6;
    const rot = (v: Vec2) => new Vec2(v.x * Math.cos(t) - v.y * Math.sin(t), v.x * Math.sin(t) + v.y * Math.cos(t));
    const wall: PerpSegment = [rot(new Vec2(2, 5)), rot(new Vec2(8, 5))];
    const rings = perpVisibility(rot(new Vec2(0, 0)), rot(new Vec2(10, 0)), [wall], 100);
    expect(area(rings)).toBeCloseTo(2 * 100 + 6 * 5 + 2 * 100, 2);
  });
});

describe("edgeOutwardVisibility", () => {
  it("shoots away from the interior regardless of winding", () => {
    // unit square [0,10]²; bottom edge index 0. Outward from the bottom edge is
    // −y (out of the square), so with a ceiling far below in −y it stays capped.
    const ccw: Ring2 = [new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 10), new Vec2(0, 10)];
    const floor: Ring2 = [new Vec2(0, -6), new Vec2(10, -6), new Vec2(10, -7), new Vec2(0, -7)];
    const rings = edgeOutwardVisibility(ccw, 0, [floor], 100);
    // beam is 10 wide, blocked at y=-6 → depth 6
    expect(area(rings)).toBeCloseTo(10 * 6, 1);
    // same square wound CW must give the same outward result
    const cw: Ring2 = [...ccw].reverse();
    // the bottom edge is whichever edge has both endpoints on y=0
    const j = cw.findIndex((v, k) => v.y === 0 && cw[(k + 1) % cw.length].y === 0);
    const rings2 = edgeOutwardVisibility(cw, j, [floor], 100);
    expect(area(rings2)).toBeCloseTo(10 * 6, 1);
  });

  it("polygon obstacles block the beam (perpVisibilityOfPolys)", () => {
    const blocker: Ring2 = [new Vec2(3, 4), new Vec2(7, 4), new Vec2(7, 6), new Vec2(3, 6)];
    const rings = perpVisibilityOfPolys(new Vec2(0, 0), new Vec2(10, 0), [blocker], 100);
    // 4 columns capped at y=4, the other 6 reach maxDist
    expect(area(rings)).toBeCloseTo(4 * 4 + 6 * 100, 1);
  });
});
