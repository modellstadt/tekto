/**
 * Stairs: the riser count and its split at the landing, the landing's height, the plan footprints
 * of the straight, L and U shapes, the slab opening over the flights, the errors that name the bad
 * input, and the IFC export (IfcStair aggregating its flights and the IfcSlab LANDING).
 */
import { describe, it, expect } from "vitest";
import { Vec2, Vec3 } from "../src/core/math/vectors";
import { Polygon2D } from "../src/core/geometry/Polygon2D";
import { Mesh } from "../src/core/geometry/mesh/Mesh";
import { Slab } from "../src/bim/slabs";
import { Stair, StairType, type StairOptions } from "../src/bim/stairs";
import { IfcWriter } from "../src/io/IfcWriter";
import { IfcModel } from "../src/io/IfcModel";

// 3.0 m at 0.18 → 17 risers of 3/17; the landing after the 9th, then 8 more.
const RISE = 3.0, R = 3 / 17, G = 0.27;
const stair = (opts: Partial<StairOptions> = {}) =>
  new Stair({ name: "ST", start: new Vec3(0, 0, 0), totalRise: RISE, ...opts });

function bounds(ring: Vec2[]) {
  const xs = ring.map((p) => p.x), ys = ring.map((p) => p.y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** [x0, y0, x1, y1] of `ring`, to 1e-9. */
function expectBounds(ring: Vec2[], expected: number[]) {
  bounds(ring).forEach((v, i) => expect(v).toBeCloseTo(expected[i], 9));
}

/** Each step box of a flight: its plan bounds and its top (the boxes are 8 vertices each). */
function treads(s: Stair) {
  return s.flights().flatMap((f) => {
    const out: { box: number[]; top: number }[] = [];
    for (let b = 0; b < f.positions.length; b += 24) {
      const pts: Vec2[] = [];
      let top = -Infinity;
      for (let k = b; k < b + 24; k += 3) { pts.push(new Vec2(f.positions[k], f.positions[k + 1])); top = Math.max(top, f.positions[k + 2]); }
      out.push({ box: bounds(pts), top });
    }
    return out;
  });
}

describe("Stair risers and landing", () => {
  it("a straight run climbs the whole rise in even risers, one tread fewer than risers", () => {
    const s = stair();
    expect(s.risers).toBe(17);
    const [f] = s.flights();
    expect(f.risers).toBe(17);
    expect(f.treads).toBe(16);
    expect(f.risers * f.riserHeight).toBeCloseTo(RISE, 12);
    expect(f.positions.length / 24).toBe(16);                           // one box per tread
    // the last riser arrives at the floor above: the top tread is one riser below it
    expect(Math.max(...treads(s).map((t) => t.top))).toBeCloseTo(RISE - R, 12);
    expect(s.landing()).toBeNull();
  });

  it("the flights of a turning stair share the risers and still climb the whole rise", () => {
    for (const shape of ["two_straight_run", "quarter_turn", "half_turn"] as const) {
      const flights = stair({ shape }).flights();
      expect(flights.map((f) => f.risers)).toEqual([9, 8]);
      expect(flights.reduce((sum, f) => sum + f.risers * f.riserHeight, 0)).toBeCloseTo(RISE, 12);
    }
  });

  it("the landing is a slab whose top is the riser it comes after", () => {
    const landing = stair({ shape: "half_turn" }).landing()!;
    expect(landing.elevation).toBeCloseTo(9 * R, 12);
    expect(landing.thickness).toBe(0.2);
    expect(landing.name).toBe("ST landing");

    const early = stair({ shape: "half_turn", landingAfter: 5, landingThickness: 0.25 });
    expect(early.flights().map((f) => f.risers)).toEqual([5, 12]);
    expect(early.landing()!.elevation).toBeCloseTo(5 * R, 12);
    expect(early.landing()!.thickness).toBe(0.25);
    // the second flight climbs on from the landing
    const second = treads(early).slice(4);
    expect(Math.min(...second.map((t) => t.top))).toBeCloseTo(6 * R, 12);
  });

  it("a landing one riser up is no thicker than that riser", () => {
    expect(stair({ shape: "quarter_turn", landingAfter: 1 }).landing()!.thickness).toBeCloseTo(R, 12);
  });

  it("every flight is closed with its faces pointing out", () => {
    for (const shape of ["straight_run", "quarter_turn", "half_turn"] as const) {
      for (const turn of ["left", "right"] as const) {
        for (const f of stair({ shape, turn, direction: new Vec2(1, 2) }).flights()) {
          const check = new Mesh(f.positions, f.indices).validate();
          expect(check.closed).toBe(true);
          expect(check.signedVolume!).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("Stair footprint", () => {
  it("a straight run is a rectangle, its length the treads' goings", () => {
    const ring = stair().footprint();
    expect(ring).toHaveLength(4);
    expectBounds(ring, [0, -0.5, 16 * G, 0.5]);
  });

  it("two runs in line take the landing between them", () => {
    const ring = stair({ shape: "two_straight_run" }).footprint();
    expectBounds(ring, [0, -0.5, 8 * G + 1 + 7 * G, 0.5]);
  });

  it("an L turns left by default, the second flight flush with the landing's far edge", () => {
    const s = stair({ shape: "quarter_turn" });
    const ring = s.footprint();
    expect(ring).toHaveLength(6);
    expect(Polygon2D.isCCW(ring)).toBe(true);
    expectBounds(ring, [0, -0.5, 8 * G + 1, 0.5 + 7 * G]);
    expect(Polygon2D.area(ring)).toBeCloseTo((8 * G + 1) * 1 + 7 * G * 1, 9);
    expectBounds(Polygon2D.openRing(s.landing()!.boundary), [8 * G, -0.5, 8 * G + 1, 0.5]);
    // the second flight runs up +Y between the landing's far edge and one width before it
    const second = treads(s).slice(8);
    for (const { box } of second) {
      expect(box[0]).toBeCloseTo(8 * G, 9);
      expect(box[2]).toBeCloseTo(8 * G + 1, 9);
      expect(box[1]).toBeGreaterThanOrEqual(0.5 - 1e-9);
    }
  });

  it("a U puts the second flight beside the first, the gap between them, and mirrors to the right", () => {
    const s = stair({ shape: "half_turn" });
    const ring = s.footprint();
    expect(Polygon2D.isCCW(ring)).toBe(true);
    // the second flight is one tread shorter, so the outline steps in where it ends
    expect(ring).toHaveLength(6);
    expectBounds(ring, [0, -0.5, 8 * G + 1, 1.6]);
    expect(Polygon2D.area(ring)).toBeCloseTo((8 * G + 1) * 2.1 - G * 1.1, 9);
    expectBounds(Polygon2D.openRing(s.landing()!.boundary), [8 * G, -0.5, 8 * G + 1, 1.6]);

    const right = stair({ shape: "half_turn", turn: "right", gap: 0.2 }).footprint();
    expect(Polygon2D.isCCW(right)).toBe(true);
    expectBounds(right, [0, -1.7, 8 * G + 1, 0.5]);
  });

  it("a U whose second flight is longer reaches past the first flight's start", () => {
    const ring = stair({ shape: "half_turn", landingAfter: 6 }).footprint();   // 5 treads, then 10
    expectBounds(ring, [5 * G - 10 * G, -0.5, 5 * G + 1, 1.6]);
  });
});

describe("Stair.slabOpening", () => {
  // 6 × 4 floor at 3.0, 0.2 thick: underside 2.8, so a tread above 0.8 has less than 2 m.
  const floor = (joistDirection?: Vec2, elevation = 3) => new Slab({
    boundary: [new Vec2(-1, -1), new Vec2(5, -1), new Vec2(5, 3), new Vec2(-1, 3), new Vec2(-1, -1)],
    thickness: 0.2, elevation, joistDirection,
  });

  it("covers every tread with less than the clearance under the slab, and the landing", () => {
    const s = stair({ shape: "half_turn" });
    const slab = floor(new Vec2(1, 0));
    const opening = s.slabOpening(slab)!;
    slab.openings.push(opening);
    const [x0, y0, x1, y1] = bounds(slab.openingRings()[0]);   // inside the slab, else this throws
    const inside = (b: number[]) => b[0] >= x0 - 1e-9 && b[1] >= y0 - 1e-9 && b[2] <= x1 + 1e-9 && b[3] <= y1 + 1e-9;
    const all = treads(s);
    for (const t of all) {
      if (2.8 - t.top < 2.0) expect(inside(t.box), `tread at ${t.top.toFixed(3)} m`).toBe(true);
    }
    // the lowest four treads of the first flight keep their headroom: the opening starts after them
    expect(x0).toBeCloseTo(G, 9);                         // where the shorter second flight ends
    [x1, y0, y1].forEach((v, i) => expect(v).toBeCloseTo([8 * G + 1, -0.5, 1.6][i], 9));
    expect(opening.name).toBe("ST well");
  });

  it("a straight run opens from the first tread too close to the slab up to the last riser", () => {
    const opening = stair().slabOpening(floor(new Vec2(1, 0)))!;
    // treads 5… (tops 5R = 0.88 and up) are above 0.8; tread 5 starts at 4 goings
    expect(opening.centerX - opening.width / 2).toBeCloseTo(4 * G, 9);
    expect(opening.centerX + opening.width / 2).toBeCloseTo(16 * G, 9);
    expect(opening.depth).toBeCloseTo(1, 9);
  });

  it("is laid out in the slab's frame: joists along Y put its width along Y", () => {
    const s = stair({ shape: "half_turn" });
    const along = s.slabOpening(floor(new Vec2(1, 0)))!;
    const across = s.slabOpening(floor())!;               // 6 × 4: the bounds suggest joists along Y
    expect(across.width).toBeCloseTo(along.depth, 9);
    expect(across.depth).toBeCloseTo(along.width, 9);
    expect(across.centerX).toBeCloseTo(along.centerX, 9);
    expect(across.centerY).toBeCloseTo(along.centerY, 9);
  });

  it("clearance Infinity opens over the whole stair; a slab far above needs none", () => {
    const s = stair({ shape: "quarter_turn" });
    const whole = s.slabOpening(floor(new Vec2(1, 0)), { clearance: Infinity })!;
    const [x0, y0, x1, y1] = bounds(s.footprint());
    expect(whole.centerX).toBeCloseTo((x0 + x1) / 2, 9);
    expect(whole.centerY).toBeCloseTo((y0 + y1) / 2, 9);
    expect(whole.width).toBeCloseTo(x1 - x0, 9);
    expect(whole.depth).toBeCloseTo(y1 - y0, 9);
    expect(s.slabOpening(floor(new Vec2(1, 0), 10))).toBeNull();
  });
});

describe("Stair errors name the bad input", () => {
  it("throws on a rise, size or landing that cannot be built", () => {
    expect(() => stair({ totalRise: 0 })).toThrow(/Stair "ST": totalRise must be above 0, got 0/);
    expect(() => stair({ width: -1 })).toThrow(/width must be above 0, got -1/);
    expect(() => stair({ direction: new Vec2(0, 0) })).toThrow(/direction must be a non-zero vector/);
    expect(() => stair({ shape: "quarter_turn", landingDepth: 0.8 })).toThrow(/quarter-turn landing .* landingDepth 0.8 < width 1/);
    expect(() => stair({ shape: "half_turn", landingAfter: 17 })).toThrow(/landingAfter must be a whole riser from 1 to 16 .* got 17/);
    expect(() => stair({ shape: "half_turn", landingAfter: 2.5 })).toThrow(/landingAfter .* got 2.5/);
    expect(() => stair({ shape: "half_turn", gap: -0.1 })).toThrow(/gap must be 0 or more, got -0.1/);
    expect(() => stair({ shape: "half_turn", totalRise: 0.18 })).toThrow(/needs 2 risers or more/);
    expect(() => stair({ type: new StairType({ name: "T", shape: "spiral" }) })).toThrow(/shape "spiral" has no geometry/);
    expect(() => stair().slabOpening(new Slab({ boundary: [new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1)] }), { clearance: -1 }))
      .toThrow(/Stair "ST".slabOpening: clearance must be 0 or more, got -1/);
  });

  it("the shape comes from the type unless the stair names its own", () => {
    const type = new StairType({ name: "U", shape: "half_turn" });
    expect(stair({ type }).flights()).toHaveLength(2);
    expect(stair({ type, shape: "straight_run" }).flights()).toHaveLength(1);
  });
});

describe("Stair IFC export", () => {
  const write = () => {
    const w = new IfcWriter({});
    w.addStair(stair({ shape: "half_turn", type: new StairType({ name: "RC", shape: "half_turn", material: "Concrete" }) }));
    return w.saveBytes();
  };
  const linesOf = (text: string) => new Map(text.split("\n").map((l) => /^(#\d+)=(.*);$/.exec(l)).filter((m) => m).map((m) => [m![1], m![2]]));

  it("writes an IfcStair aggregating both flights and the IfcSlab LANDING", () => {
    const lines = linesOf(new TextDecoder().decode(write()));
    const find = (re: RegExp) => [...lines].filter(([, l]) => re.test(l)).map(([id]) => id);
    const [stairRef] = find(/^IFCSTAIR\(/);
    expect(lines.get(stairRef)).toContain(".HALF_TURN_STAIR.");
    const flights = find(/^IFCSTAIRFLIGHT\(/);
    expect(flights).toHaveLength(2);
    const landings = find(/^IFCSLAB\(.*\.LANDING\.\)$/);
    expect(landings).toHaveLength(1);

    const aggregates = [...lines.values()].find((l) => l.startsWith("IFCRELAGGREGATES(") && l.includes(`,${stairRef},(`))!;
    for (const part of [...flights, ...landings]) expect(aggregates).toContain(part);
    // the storey contains the stair, not its landing
    const contained = [...lines.values()].find((l) => l.startsWith("IFCRELCONTAINEDINSPATIALSTRUCTURE("))!;
    expect(contained).toContain(stairRef);
    expect(contained).not.toContain(`${landings[0]},`);
    expect(contained).not.toContain(`${landings[0]})`);
    // the type's material on every part
    const material = [...lines.values()].find((l) => l.startsWith("IFCRELASSOCIATESMATERIAL("))!;
    for (const part of [...flights, ...landings]) expect(material).toContain(part);
  });

  it("reads back with web-ifc: two flights and the landing at its height", async () => {
    const model = await IfcModel.parse(write().buffer as ArrayBuffer, { wasmPath: "", tree: false, recenter: false, relations: false, properties: false });
    expect(model.elements.filter((e) => /StairFlight/i.test(e.ifcClass))).toHaveLength(2);
    const slab = model.elements.find((e) => /Slab/i.test(e.ifcClass))!;
    // web-ifc hands geometry back Y-up: IFC's z is its y.
    const p = slab.mesh.positions;
    let lo = Infinity, hi = -Infinity;
    for (let i = 1; i < p.length; i += 3) { lo = Math.min(lo, p[i]); hi = Math.max(hi, p[i]); }
    expect(hi).toBeCloseTo(9 * R, 5);
    expect(lo).toBeCloseTo(9 * R - 0.2, 5);
  });
});
