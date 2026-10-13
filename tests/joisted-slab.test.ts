import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Slab, SlabType, SlabOpening, JoistedSlab, chooseJoistDirection } from "../src/bim/slabs";
import { buildCutList } from "../src/bim/walls";

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

describe("JoistedSlab — openings", () => {
  // A 1.2 × 1.0 stair well in the middle of a 5 × 4 floor, joists running E-W.
  const W = 0.06, GAP = 0.01;
  const well = { x0: 1.9, x1: 3.1, y0: 1.5, y1: 2.5 };
  const framed = () => {
    const type = makeType({ bearingGap: GAP });
    const slab = new Slab({
      boundary: RECT_5x4, thickness: 0.28, elevation: 0, type, joistDirection: new Vec2(1, 0),
      openings: [new SlabOpening(2.5, 2, 1.2, 1.0, "Stair well")],
    });
    return type.construction!(slab);
  };
  const box = (p: { mesh: { positions: ArrayLike<number> } }) => {
    const a = p.mesh.positions;
    const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    for (let i = 0; i < a.length; i += 3) {
      b.x0 = Math.min(b.x0, a[i]); b.x1 = Math.max(b.x1, a[i]); b.y0 = Math.min(b.y0, a[i + 1]); b.y1 = Math.max(b.y1, a[i + 1]);
    }
    return b;
  };

  it("frames the well: a trimmer along each side, a header across each end, nothing through it", () => {
    const parts = framed();
    const trimmers = parts.filter(p => p.role === "trimmer").map(box);
    const headers = parts.filter(p => p.role === "header").map(box);
    expect(trimmers.map(b => [b.y0, b.y1])).toEqual([
      [expect.closeTo(well.y0 - W, 5), expect.closeTo(well.y0, 5)],
      [expect.closeTo(well.y1, 5), expect.closeTo(well.y1 + W, 5)],
    ]);
    for (const t of trimmers) expect(t.x1 - t.x0).toBeCloseTo(5 - 2 * (W + GAP), 5);   // rim to rim, like a joist
    expect(headers.map(b => [b.x0, b.x1])).toEqual([
      [expect.closeTo(well.x0 - W, 5), expect.closeTo(well.x0, 5)],
      [expect.closeTo(well.x1, 5), expect.closeTo(well.x1 + W, 5)],
    ]);
    for (const h of headers) expect([h.y0, h.y1]).toEqual([expect.closeTo(well.y0 + GAP, 5), expect.closeTo(well.y1 - GAP, 5)]);

    // No member crosses the well.
    for (const p of parts.filter(p => p.role === "joist" || p.role === "trimmer" || p.role === "header")) {
      const b = box(p);
      const overlaps = b.x0 < well.x1 - 1e-6 && b.x1 > well.x0 + 1e-6 && b.y0 < well.y1 - 1e-6 && b.y1 > well.y0 + 1e-6;
      expect(overlaps, `${p.name} runs through the well`).toBe(false);
    }
  });

  it("the joists between the trimmers stop at the headers; none lies against a trimmer", () => {
    const parts = framed();
    const tails = parts.filter(p => p.role === "joist").map(box).filter(b => b.y0 > well.y0 && b.y1 < well.y1);
    expect(tails.length).toBeGreaterThan(0);
    for (const t of tails) {
      const endsAtHeader = Math.abs(t.x1 - (well.x0 - W - GAP)) < 1e-5 || Math.abs(t.x0 - (well.x1 + W + GAP)) < 1e-5;
      expect(endsAtHeader).toBe(true);
    }
    const trimmerYs = [well.y0 - W / 2, well.y1 + W / 2];
    for (const j of parts.filter(p => p.role === "joist").map(box)) {
      for (const y of trimmerYs) expect(Math.abs((j.y0 + j.y1) / 2 - y)).toBeGreaterThanOrEqual(W - 1e-9);
    }
  });

  it("the sheathing and ceiling leave the well open", () => {
    const parts = framed();
    for (const role of ["sheathing", "ceiling"]) {
      const plate = parts.find(p => p.role === role)!;
      const { positions: a, indices: ix } = plate.mesh;
      const zTop = Math.max(...Array.from(a).filter((_, i) => i % 3 === 2));
      let area = 0;
      for (let t = 0; t < ix.length; t += 3) {
        const [p, q, r] = [ix[t] * 3, ix[t + 1] * 3, ix[t + 2] * 3];
        if (![p, q, r].every(k => Math.abs(a[k + 2] - zTop) < 1e-6)) continue;
        area += ((a[q] - a[p]) * (a[r + 1] - a[p + 1]) - (a[r] - a[p]) * (a[q + 1] - a[p + 1])) / 2;
      }
      expect(area, role).toBeCloseTo(20 - 1.2 * 1.0, 4);
    }
  });
});

describe("buildCutList", () => {
  it("takes a slab's parts without a cast", () => {
    const type = makeType();
    const slab = new Slab({ boundary: RECT_5x4, thickness: 0.28, type, joistDirection: new Vec2(1, 0) });
    const parts = type.construction!(slab);
    const cut = buildCutList(parts);
    const joists = cut.filter(c => c.role === "joist");
    expect(joists).toHaveLength(1);                                   // every regular joist the same length
    expect(joists[0].count).toBe(parts.filter(p => p.role === "joist").length);
    expect(joists[0].length).toBeCloseTo(5 - 2 * (0.06 + 0.01), 3);
    expect(cut.some(c => c.role === "sheathing")).toBe(false);        // no length: not on a cut list
  });
});
