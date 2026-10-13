/**
 * Slab openings (stair wells): the hole triangulation, the slab's mesh with its openings
 * cut out, the openings' frame, and the IFC export voiding the slab.
 */
import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Polygon2D } from "../src/core/geometry/Polygon2D";
import { Slab, SlabOpening } from "../src/bim/slabs";
import { IfcWriter } from "../src/io/IfcWriter";
import type { Mesh } from "../src/core/geometry/mesh/Mesh";

const RECT_5x4 = [new Vec2(0, 0), new Vec2(5, 0), new Vec2(5, 4), new Vec2(0, 4), new Vec2(0, 0)];

/** Enclosed volume, positive when the faces point out (the faces need not share vertices). Float32 positions: compare to ~1e-5. */
function volume(m: Mesh): number {
  const p = m.positions, ix = m.indices;
  let v = 0;
  for (let t = 0; t < ix.length; t += 3) {
    const [a, b, c] = [ix[t] * 3, ix[t + 1] * 3, ix[t + 2] * 3];
    v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
       - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c])
       + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
  }
  return v / 6;
}

describe("Polygon2D.triangulateWithHoles", () => {
  it("covers the polygon minus its hole, counter-clockwise, indexing the rings as given", () => {
    const outer = [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 4), new Vec2(0, 4)].reverse();   // clockwise in
    const hole = [new Vec2(1, 1), new Vec2(3, 1), new Vec2(3, 3), new Vec2(1, 3)];
    const all = [...outer, ...hole];
    const tris = Polygon2D.triangulateWithHoles(outer, [hole]);
    let area = 0;
    for (const [a, b, c] of tris) {
      const s = Polygon2D.signedArea([all[a], all[b], all[c]]);
      expect(s).toBeGreaterThan(0);
      area += s;
    }
    expect(area).toBeCloseTo(16 - 4, 9);
  });
});

describe("Slab openings", () => {
  const well = () => new SlabOpening(3.5, 2, 1, 2.5, "Stair well");

  it("toMesh cuts the opening out and walls it, wound outward either way round", () => {
    for (const boundary of [RECT_5x4, [...RECT_5x4].reverse()]) {
      const slab = new Slab({ boundary, thickness: 0.2, elevation: 3, openings: [well()], joistDirection: new Vec2(1, 0) });
      expect(volume(slab.toMesh())).toBeCloseTo((20 - 1 * 2.5) * 0.2, 5);
    }
    expect(volume(new Slab({ boundary: RECT_5x4, thickness: 0.2 }).toMesh())).toBeCloseTo(4, 5);
  });

  it("an opening's width runs along the joists, its depth across", () => {
    const slab = new Slab({ boundary: RECT_5x4, openings: [well()], joistDirection: new Vec2(0, 1) });
    const [ring] = slab.openingRings();
    const xs = ring.map(p => p.x), ys = ring.map(p => p.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(1, 9);      // width, along y
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2.5, 9);    // depth, across
    expect(Polygon2D.signedArea(ring)).toBeGreaterThan(0);
  });

  it("an opening outside the slab, or with no size, fails loudly", () => {
    expect(() => new Slab({ boundary: RECT_5x4, openings: [new SlabOpening(4.8, 2, 1, 1, "Edge")] }).toMesh()).toThrow(/opening Edge .* not inside/);
    expect(() => new Slab({ boundary: RECT_5x4, openings: [new SlabOpening(2, 2, 0, 1)] }).openingRings()).toThrow(/width and depth above 0/);
  });

  it("the IFC export voids the slab with an opening element", () => {
    const w = new IfcWriter({});
    const slabRef = w.addSlab(new Slab({ boundary: RECT_5x4, thickness: 0.2, openings: [well()] }), { includeParts: false });
    const out = w.save();
    const opening = out.split("\n").find(l => l.includes("=IFCOPENINGELEMENT("))!;
    expect(opening).toContain("'Stair well'");
    const openingRef = opening.slice(1, opening.indexOf("="));
    expect(out).toMatch(new RegExp(`=IFCRELVOIDSELEMENT\\('[^']+',#\\d+,\\$,\\$,#${slabRef},#${openingRef}\\);`));
  });
});
