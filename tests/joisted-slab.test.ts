import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Slab, SlabType, JoistedSlab, chooseJoistDirection } from "../src/bim/slabs";

const RECT_5x4: Vec2[] = [
  new Vec2(0, 0), new Vec2(5, 0), new Vec2(5, 4), new Vec2(0, 4), new Vec2(0, 0),
];

function makeType(opts = {}) {
  return new SlabType({
    name: "Test joist",
    construction: JoistedSlab({
      spacing: 0.625,
      profile: { w: 0.06, h: 0.22, name: "60×220" },
      material: "KVH",
      ...opts,
    }),
  });
}

describe("JoistedSlab — rim joist + clipped regulars", () => {
  it("emits one rim joist (closed-loop beam) plus N regular joists", () => {
    const type = makeType();
    const slab = new Slab({
      boundary: RECT_5x4, thickness: 0.28, elevation: 0,
      name: "Floor", type,
      joistDirection: new Vec2(1, 0), // E-W joists
    });
    const parts = type.construction!(slab);
    const rim    = parts.filter(p => p.role === "beam");
    const joists = parts.filter(p => p.role === "joist");
    expect(rim.length).toBe(1);
    expect(joists.length).toBeGreaterThan(0);
    // 4 m short side, spacing 0.625, edgeOffset = 0.3125 → ~6 joists
    expect(joists.length).toBeGreaterThan(4);
    expect(joists.length).toBeLessThan(10);
  });

  it("regular joists end short of the rim (bearing gap)", () => {
    const bearingGap = 0.01;
    const type = makeType({ bearingGap });
    const slab = new Slab({
      boundary: RECT_5x4, thickness: 0.28, elevation: 0, type,
      joistDirection: new Vec2(1, 0),
    });
    const parts = type.construction!(slab);
    const joists = parts.filter(p => p.role === "joist");
    expect(joists.length).toBeGreaterThan(0);

    // For an axis-aligned 5×4 rectangle, E-W joists should run from
    // x ≈ rimW + bearingGap = 0.07 to x ≈ 5 − 0.07 = 4.93.
    const rimW = 0.06;
    const expectedStart = rimW + bearingGap; // 0.07
    const expectedEnd   = 5 - rimW - bearingGap; // 4.93
    for (const j of joists) {
      // joist.length is along the joist axis (E-W direction).
      expect(j.length!).toBeCloseTo(expectedEnd - expectedStart, 2);
    }
  });

  it("no rim → joists extend to the slab boundary", () => {
    const type = makeType({ rim: false, bearingGap: 0 });
    const slab = new Slab({
      boundary: RECT_5x4, thickness: 0.28, elevation: 0, type,
      joistDirection: new Vec2(1, 0),
    });
    const parts = type.construction!(slab);
    const rim = parts.filter(p => p.role === "beam");
    expect(rim.length).toBe(0);
    const joists = parts.filter(p => p.role === "joist");
    for (const j of joists) {
      expect(j.length!).toBeCloseTo(5, 2); // full 5m span
    }
  });

  it("first joist offset matches edgeOffset", () => {
    // Rotate "E-W joists at projection p ∈ x-axis": the perpendicular
    // direction is +Y, so first joist's y-projection is edgeOffset
    // above minP (= rim inside face = 0 + rimW + bearingGap = 0.07).
    const type = makeType({ edgeOffset: 0.5, bearingGap: 0.01 });
    const slab = new Slab({
      boundary: RECT_5x4, thickness: 0.28, elevation: 0, type,
      joistDirection: new Vec2(1, 0),
    });
    const parts = type.construction!(slab);
    const joists = parts.filter(p => p.role === "joist");
    expect(joists.length).toBeGreaterThan(0);
  });
});

describe("chooseJoistDirection", () => {
  it("bounding-box: joists run perpendicular to longer side", () => {
    const slab = new Slab({ boundary: RECT_5x4 });
    const dir = chooseJoistDirection(slab, { method: "bbox" });
    // 5 m east-west, 4 m north-south → joists span shorter side (N-S),
    // so dir ≈ (0, ±1).
    expect(Math.abs(dir.x)).toBeLessThan(0.01);
    expect(Math.abs(dir.y)).toBeCloseTo(1, 2);
  });
});
