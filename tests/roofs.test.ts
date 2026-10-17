import { describe, it, expect } from "vitest";
import { Vec2, Vec3 } from "../src/core/math/vectors";
import { Roof, type RoofOptions } from "../src/bim/roofs";

const DEG = Math.PI / 180;
const L = 10, W = 8, EAVES = 6, PITCH = 35, O = 0.6, G = 0.3, T = 0.3;
const rect = (l = L, w = W) => [new Vec2(0, 0), new Vec2(l, 0), new Vec2(l, w), new Vec2(0, w)];
const roof = (opts: Partial<RoofOptions> = {}) => new Roof({
  kind: "gable", footprint: rect(), pitch: PITCH, eavesElevation: EAVES, overhang: O, gableOverhang: G, thickness: T, ...opts,
});
const tan = Math.tan(PITCH * DEG), cos = Math.cos(PITCH * DEG);
/** True if the polygon has a vertex at `p`. */
const hasVertex = (outline: Vec3[], p: Vec3) => outline.some((q) => q.distTo(p) < 1e-9);

describe("Roof — gable", () => {
  it("rises from the eaves at the pitch: the gable's apex is eaves + span/2 · tan(pitch)", () => {
    const r = roof();
    const [g] = r.gables(0.3);
    expect(EAVES + g.height).toBeCloseTo(EAVES + (W / 2) * tan, 12);
    // the top of the build-up is the build-up's vertical thickness higher
    expect(r.ridgeHeight()).toBeCloseTo(EAVES + (W / 2) * tan + T / cos, 12);
  });

  it("runs the ridge along the first edge, verge to verge, over the middle of the span", () => {
    const ridge = roof().ridge()!;
    expect(ridge.a.x).toBeCloseTo(-G, 12); expect(ridge.b.x).toBeCloseTo(L + G, 12);
    expect(ridge.a.y).toBeCloseTo(W / 2, 12); expect(ridge.b.y).toBeCloseTo(W / 2, 12);
    // start at the next corner and the ridge turns with it
    const turned = roof({ footprint: [new Vec2(L, 0), new Vec2(L, W), new Vec2(0, W), new Vec2(0, 0)] }).ridge()!;
    expect(turned.a.x).toBeCloseTo(L / 2, 12); expect(turned.b.x).toBeCloseTo(L / 2, 12);
  });

  it("has two planes, each the plan area over cos(pitch), meeting at the ridge", () => {
    const r = roof();
    const planes = r.planes();
    expect(planes).toHaveLength(2);
    for (const p of planes) {
      expect(p.area).toBeCloseTo((L + 2 * G) * (W / 2 + O) / cos, 9);
      expect(p.normal.z).toBeCloseTo(cos, 12);
      const ridge = r.ridge()!;
      expect(hasVertex(p.outline, ridge.a) && hasVertex(p.outline, ridge.b)).toBe(true);
    }
    expect(planes.map((p) => p.edge)).toEqual([0, 2]);
    // the low edge of the overhang: below the eaves by overhang · tan, plus the build-up
    const low = Math.min(...planes[0].outline.map((p) => p.z));
    expect(low).toBeCloseTo(EAVES - O * tan + T / cos, 12);
  });

  it("gables are triangles: the span wide, span/2 · tan(pitch) high, on the gable edges", () => {
    const gables = roof().gables(0.3);
    expect(gables.map((g) => g.edge)).toEqual([1, 3]);
    for (const g of gables) {
      const h = (W / 2) * tan;
      expect(g.height).toBeCloseTo(h, 12);
      expect(g.area).toBeCloseTo(W * h / 2, 12);
      expect(g.start.distTo(g.end)).toBeCloseTo(W, 12);
      const v = g.mesh.validate();
      expect(v.valid, v.issues.join("; ")).toBe(true);
      expect(v.closed).toBe(true);
      expect(g.mesh.volume()).toBeCloseTo(g.area * 0.3, 9);
      const b = g.mesh.bounds();
      expect(b.min.z).toBeCloseTo(EAVES, 12); expect(b.max.z).toBeCloseTo(EAVES + h, 12);
    }
    // half the thickness in from the footprint
    expect(gables[0].start.x).toBeCloseTo(L - 0.15, 12);
    expect(gables[1].start.x).toBeCloseTo(0.15, 12);
  });
});

describe("Roof — hip", () => {
  it("has four planes that meet at the ridge, which runs along the longer side", () => {
    // start on a short side: the ridge still runs along x, the long way
    const r = roof({ kind: "hip", footprint: [new Vec2(L, 0), new Vec2(L, W), new Vec2(0, W), new Vec2(0, 0)] });
    const ridge = r.ridge()!;
    expect(ridge.a.y).toBeCloseTo(W / 2, 12); expect(ridge.b.y).toBeCloseTo(W / 2, 12);
    expect(Math.abs(ridge.b.x - ridge.a.x)).toBeCloseTo(L - W, 12);
    expect(r.ridgeHeight()).toBeCloseTo(EAVES + (W / 2) * tan + T / cos, 12);
    const planes = r.planes();
    expect(planes).toHaveLength(4);
    const atRidge = planes.map((p) => [ridge.a, ridge.b].filter((q) => hasVertex(p.outline, q)).length);
    expect(atRidge.sort()).toEqual([1, 1, 2, 2]);         // two trapezoids, two triangles
    expect(planes.map((p) => p.edge).sort()).toEqual([0, 1, 2, 3]);
    expect(r.gables(0.3)).toEqual([]);
  });

  it("covers the plan with the overhang all round; each end is a triangle", () => {
    const planes = roof({ kind: "hip" }).planes();
    const total = planes.reduce((s, p) => s + p.area, 0);
    expect(total).toBeCloseTo((L + 2 * O) * (W + 2 * O) / cos, 9);
    const ends = planes.filter((p) => p.outline.length === 3);
    expect(ends).toHaveLength(2);
    for (const e of ends) expect(e.area).toBeCloseTo((W + 2 * O) * (W / 2 + O) / 2 / cos, 9);
  });

  it("over a square is a pyramid: four triangles meeting at one point", () => {
    const r = roof({ kind: "hip", footprint: rect(W, W) });
    const ridge = r.ridge()!;
    expect(ridge.length).toBeCloseTo(0, 12);
    const planes = r.planes();
    expect(planes.every((p) => p.outline.length === 3 && hasVertex(p.outline, ridge.a))).toBe(true);
    const v = r.toMesh().validate();
    expect(v.valid, v.issues.join("; ")).toBe(true);
  });
});

describe("Roof — shed and flat", () => {
  it("a shed rises from the first edge to the opposite one", () => {
    const r = roof({ kind: "shed" });
    const [plane] = r.planes();
    expect(r.planes()).toHaveLength(1);
    expect(plane.area).toBeCloseTo((L + 2 * G) * (W + 2 * O) / cos, 9);
    expect(plane.normal.y).toBeLessThan(0);              // drains towards edge 0, at y = 0
    expect(r.ridgeHeight()).toBeCloseTo(EAVES + (W + O) * tan + T / cos, 12);
    expect(r.ridge()!.a.y).toBeCloseTo(W + O, 12);
  });

  it("a shed's infill is a right triangle on each side and a strip over the high side", () => {
    const wt = 0.3, h = W * tan;
    const gables = roof({ kind: "shed" }).gables(wt);
    expect(gables.map((g) => g.edge)).toEqual([1, 2, 3]);
    const [side, high] = gables;
    expect(side.height).toBeCloseTo(h, 12);
    expect(side.area).toBeCloseTo(W * h / 2, 12);
    expect(high.area).toBeCloseTo((L - 2 * wt) * h, 12);
    for (const g of gables) {
      const v = g.mesh.validate();
      expect(v.valid && v.closed, v.issues.join("; ")).toBe(true);
    }
    expect(high.mesh.volume()).toBeCloseTo((L - 2 * wt) * wt * (W - wt / 2) * tan, 9);
  });

  it("a flat roof is the footprint grown by the overhang, its build-up on the walls", () => {
    const r = new Roof({ kind: "flat", footprint: rect(), eavesElevation: 3, overhang: 0.5, thickness: 0.4 });
    expect(r.ridge()).toBeNull();
    expect(r.ridgeHeight()).toBeCloseTo(3.4, 12);
    const [plane] = r.planes();
    expect(plane.area).toBeCloseTo((L + 1) * (W + 1), 9);
    expect(plane.outline.every((p) => Math.abs(p.z - 3.4) < 1e-12)).toBe(true);
    expect(r.toMesh().bounds().min.z).toBeCloseTo(3, 12);
    expect(r.gables(0.3)).toEqual([]);
  });

  it("a flat roof over a concave footprint is a closed solid, its caps triangulated", () => {
    const ell = [new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 4), new Vec2(4, 4), new Vec2(4, 8), new Vec2(0, 8)];
    const r = new Roof({ kind: "flat", footprint: ell, eavesElevation: 3, overhang: 0, thickness: 0.4 });
    const [plane] = r.planes();
    expect(plane.area).toBeCloseTo(10 * 8 - 6 * 4, 9);
    const m = r.toMesh(), v = m.validate();
    expect(v.valid && v.closed, v.issues.join("; ")).toBe(true);
    expect(m.volume()).toBeCloseTo(plane.area * 0.4, 9);
  });
});

describe("Roof — meshes, data and validation", () => {
  it("every kind's build-up is a sound closed solid: plan area × vertical thickness", () => {
    for (const kind of ["shed", "gable", "hip"] as const) {
      for (const footprint of [rect(), rect().reverse()]) {
        const r = roof({ kind, footprint });
        const m = r.toMesh(), v = m.validate();
        expect(v.valid, `${kind}: ${v.issues.join("; ")}`).toBe(true);
        expect(v.closed).toBe(true);
        expect(v.signedVolume!).toBeGreaterThan(0);
        const g = kind === "hip" ? O : G;
        expect(m.volume()).toBeCloseTo((L + 2 * g) * (W + 2 * O) * T / cos, 9);
      }
    }
  });

  it("a roof's JSON is the record that builds it again", () => {
    const r = roof({ kind: "hip", name: "House", properties: { fireRating: "REI30" } });
    const back = new Roof(JSON.parse(JSON.stringify(r)));
    expect(back.ridgeHeight()).toBeCloseTo(r.ridgeHeight(), 12);
    expect(back.planes().map((p) => p.area)).toEqual(r.planes().map((p) => p.area));
    expect(back.properties).toEqual({ fireRating: "REI30" });
  });

  it("names the bad input", () => {
    expect(() => roof({ pitch: 85 })).toThrow(/pitch must be between 0° and 80°, got 85/);
    expect(() => roof({ pitch: 0 })).toThrow(/gable roof needs a pitch above 0°/);
    expect(() => roof({ overhang: -0.2 })).toThrow(/overhang must be 0 or more, got -0.2/);
    expect(() => roof({ gableOverhang: -1 })).toThrow(/gableOverhang must be 0 or more/);
    expect(() => roof({ thickness: 0 })).toThrow(/thickness must be above 0/);
    expect(() => roof({ eavesElevation: NaN })).toThrow(/eavesElevation must be a finite number/);
    expect(() => roof({ kind: "mansard" as never })).toThrow(/kind must be "flat", "shed", "gable" or "hip", got "mansard"/);
    expect(() => roof({ kind: "hip", footprint: [new Vec2(0, 0), new Vec2(10, 0), new Vec2(9, 8), new Vec2(0, 8)] }))
      .toThrow(/hip roof needs a rectangular footprint, but corner 1 is 82.87°, not 90°/);
    expect(() => roof({ footprint: rect().slice(0, 3) })).toThrow(/gable roof needs a rectangular footprint of 4 corners, got 3/);
    expect(() => roof({ footprint: [new Vec2(0, 0), new Vec2(0, 0), new Vec2(1, 1)] })).toThrow(/footprint edge 0 has no length/);
    expect(() => roof().gables(0)).toThrow(/gables\(wallThickness\) needs a thickness above 0/);
    expect(() => roof().gables(L)).toThrow(/at most half the length \(5 m\), got 10/);
    // a flat roof ignores the pitch, and takes a closed ring
    expect(() => new Roof({ kind: "flat", footprint: [...rect(), new Vec2(0, 0)], eavesElevation: 3 })).not.toThrow();
  });
});
