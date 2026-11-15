/**
 * Particles2D: circles relaxed in the plane — overlaps, springs, pins and a boundary ring.
 *
 * `pack` fills a ring with area/(2√3 r²) circles, one hexagon's worth of area each. Kept r
 * inside the edges they cannot all fit (a 20 r square holds about 105 in a hexagonal
 * packing, and 115 are scattered), so a packing keeps some overlap: we check it stays
 * below 0.5 r for any pair and 0.15 r on average. Scattered at 80 % of that count, the
 * circles fit and relax to under 5 % of r.
 */
import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Polygon2D } from "../src/core/geometry/Polygon2D";
import { createRandom } from "../src/core/math/random";
import { Particles2D } from "../src/core/physics/Particles2D";

const HEX = 2 * Math.sqrt(3);
const square = (s: number) => [new Vec2(0, 0), new Vec2(s, 0), new Vec2(s, s), new Vec2(0, s)];
/** An L: a 2s × 2s square without its top-right quarter (reflex corner at (s, s)). */
const lShape = (s: number) => [
  new Vec2(0, 0), new Vec2(2 * s, 0), new Vec2(2 * s, s), new Vec2(s, s), new Vec2(s, 2 * s), new Vec2(0, 2 * s),
];

/** Largest overlap of equal circles of radius r, and the mean over the pairs that overlap. */
function overlaps(pts: Vec2[], r: number): { max: number; mean: number } {
  let max = 0, sum = 0, pairs = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const o = 2 * r - pts[i].distTo(pts[j]);
      if (o > 0) { max = Math.max(max, o); sum += o; pairs++; }
    }
  }
  return { max, mean: pairs ? sum / pairs : 0 };
}

const distToRing = (ring: Vec2[], p: Vec2) => Polygon2D.closestPointOnEdge(ring, p).point.distTo(p);

describe("Particles2D.pack — the 2008 applet's circle packing", () => {
  const R = 1;
  for (const [name, ring] of [["a square", square(20)], ["a concave L-shape", lShape(12)]] as const) {
    it(`fills ${name}: about area/(2√3 r²) circles, all inside, overlap bounded`, () => {
      const expected = Math.round(Polygon2D.area(ring) / (HEX * R * R));
      const pts = Particles2D.pack(ring, R, { seed: 1 });
      expect(pts.length).toBeLessThanOrEqual(expected);
      expect(pts.length).toBeGreaterThanOrEqual(Math.floor(0.9 * expected));
      for (const p of pts) {
        expect(Polygon2D.pointInPolygon(p, ring)).toBe(true);
        expect(distToRing(ring, p)).toBeGreaterThan(0.95 * R);  // the boundary holds them r inside
      }
      const { max, mean } = overlaps(pts, R);
      expect(max).toBeLessThan(0.5 * R);
      expect(mean).toBeLessThan(0.15 * R);
    });
  }

  it("is deterministic for a seed, and another seed packs differently", () => {
    const ring = lShape(10);
    const a = Particles2D.pack(ring, 1, { seed: 7 });
    expect(Particles2D.pack(ring, 1, { seed: 7 })).toEqual(a);
    expect(Particles2D.pack(ring, 1, { random: createRandom(7) })).toEqual(a);
    const b = Particles2D.pack(ring, 1, { seed: 8 });
    expect(b.some((p, i) => !a[i] || p.distTo(a[i]) > 1e-6)).toBe(true);
  });

  it("relaxes circles that fit to under 5 % of r overlap", () => {
    const ring = square(20);
    const count = Math.round(0.8 * Polygon2D.area(ring) / HEX);
    const sim = new Particles2D();
    sim.boundary = ring;
    for (const p of Particles2D.scatter(ring, count, createRandom(3))) sim.add(p, 1);
    const before = sim.overlap();
    sim.relax(1000);
    expect(sim.overlap()).toBeLessThan(0.01 * before);
    expect(overlaps(sim.positions, 1).max).toBeLessThan(0.05);
    for (const p of sim.positions) expect(distToRing(ring, p)).toBeGreaterThan(0.95);
  });

  it("handles thousands of circles", () => {
    const ring = square(100);
    const r = 100 / Math.sqrt(3000 * HEX);   // 3,000 circles
    const t0 = performance.now();
    const pts = Particles2D.pack(ring, r, { seed: 2 });
    expect(performance.now() - t0).toBeLessThan(10_000);   // ≈ 0.2 s here; an O(n²) pair search would show
    expect(pts.length).toBeGreaterThan(2900);
    expect(pts.every((p) => Polygon2D.pointInPolygon(p, ring))).toBe(true);
  });
});

describe("Particles2D — springs, pins, coincident circles, order", () => {
  it("springs converge to their rest lengths (a 3-4-5 triangle)", () => {
    const sim = new Particles2D();
    const a = sim.add(new Vec2(0, 0), 0.1), b = sim.add(new Vec2(9, 1), 0.1), c = sim.add(new Vec2(2, 7), 0.1);
    sim.addSpring(a, b, 3);
    sim.addSpring(b, c, 4);
    sim.addSpring(c, a, 5);
    sim.relax(2000, 1e-9);
    const d = (i: number, j: number) => sim.positions[i].distTo(sim.positions[j]);
    expect(d(a, b)).toBeCloseTo(3, 6);
    expect(d(b, c)).toBeCloseTo(4, 6);
    expect(d(c, a)).toBeCloseTo(5, 6);
  });

  it("a spring's rest length defaults to the current distance", () => {
    const sim = new Particles2D();
    sim.add(new Vec2(0, 0), 0.1);
    sim.add(new Vec2(3, 4), 0.1);
    sim.addSpring(0, 1);
    expect(sim.springs[0]).toEqual({ i: 0, j: 1, rest: 5, stiffness: 0.5 });
    expect(sim.step()).toBe(0);
  });

  it("pinned circles never move; what they meet takes the whole correction", () => {
    const sim = new Particles2D();
    const p = sim.add(new Vec2(0, 0), 1);
    const q = sim.add(new Vec2(1, 0), 1);       // overlaps p by 1
    const s = sim.add(new Vec2(0, 6), 0.5);     // pulled toward p by a spring
    sim.pin(p);
    sim.addSpring(p, s, 2, 1);
    const start = sim.positions[p];
    sim.step();
    expect(sim.positions[q].x).toBeCloseTo(1 + 0.8 * 1, 12);         // all of 0.8 × overlap
    expect(sim.positions[s].distTo(start)).toBeCloseTo(2, 12);       // all of the spring error
    sim.boundary = [new Vec2(-2, 2), new Vec2(2, 2), new Vec2(2, 6), new Vec2(-2, 6)];   // p is outside it
    sim.relax(200);
    expect(sim.positions[p]).toBe(start);
    sim.pin(p, false);
    sim.step();
    expect(sim.positions[p]).not.toBe(start);
  });

  it("coincident circles separate along a fixed direction, without NaN", () => {
    const sim = new Particles2D();
    sim.add(new Vec2(5, 5), 1);
    sim.add(new Vec2(5, 5), 1);
    sim.step();
    expect(sim.positions[0].distTo(sim.positions[1])).toBeCloseTo(0.8 * 2, 12);
    const three = new Particles2D();
    for (let i = 0; i < 3; i++) three.add(new Vec2(0, 0), 1);
    three.relax(500);
    for (const p of three.positions) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    expect(three.overlap()).toBeLessThan(1e-2);
  });

  it("does not depend on the order of the circles", () => {
    const ring = lShape(8);
    const rnd = createRandom(11);
    const pts = Particles2D.scatter(ring, 60, rnd);
    const radii = pts.map(() => rnd.random(0.6, 1.6));
    const springs = Array.from({ length: 15 }, (_, k) => [k * 2, k * 2 + 1] as const);
    const build = (order: number[]) => {
      const sim = new Particles2D();
      sim.boundary = ring;
      const at = new Map<number, number>();
      for (const i of order) at.set(i, sim.add(pts[i], radii[i]));
      for (const [i, j] of springs) sim.addSpring(at.get(i)!, at.get(j)!, 2.5, 0.3);
      sim.pin(at.get(59)!);
      for (let s = 0; s < 150; s++) sim.step();
      return pts.map((_, i) => sim.positions[at.get(i)!]);
    };
    const shuffled = pts.map((_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rnd.random(i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const a = build(pts.map((_, i) => i)), b = build(shuffled);
    for (let i = 0; i < pts.length; i++) expect(a[i].distTo(b[i])).toBeLessThan(1e-9);
  });

  it("relax stops once nothing moves more than the tolerance", () => {
    const sim = new Particles2D();
    sim.add(new Vec2(0, 0), 1);
    sim.add(new Vec2(0.5, 0), 1);
    const steps = sim.relax(1000, 1e-6);
    expect(steps).toBeGreaterThan(1);
    expect(steps).toBeLessThan(1000);
    expect(sim.step()).toBeLessThanOrEqual(1e-6);
    expect(sim.relax(1000)).toBe(1);          // settled: one step that moves (almost) nothing
  });
});

describe("Particles2D boundary", () => {
  it("keeps circles their radius inside a concave ring, either winding", () => {
    for (const ring of [lShape(6), lShape(6).reverse()]) {
      const sim = new Particles2D();
      sim.boundary = ring;
      sim.add(new Vec2(6.2, 6.3), 1);     // at the reflex corner, inside
      sim.add(new Vec2(9, 9), 1);         // in the notch: outside
      sim.add(new Vec2(-3, 2), 1);        // outside the left edge
      sim.add(new Vec2(11.5, 0.2), 1);    // in a convex corner
      sim.relax(500, 1e-9);
      for (const p of sim.positions) {
        expect(Polygon2D.pointInPolygon(p, ring)).toBe(true);
        expect(distToRing(ring, p)).toBeGreaterThan(1 - 1e-6);
      }
      expect(sim.positions[3].distTo(new Vec2(11, 1))).toBeLessThan(1e-6);
    }
  });

  it("a circle too big for a narrow part ends up centred in it", () => {
    const corridor = [new Vec2(0, 0), new Vec2(20, 0), new Vec2(20, 2), new Vec2(0, 2)];
    for (const start of [new Vec2(10, 0.3), new Vec2(10, -5), new Vec2(10, 1.9)]) {
      const sim = new Particles2D();
      sim.boundary = corridor;
      sim.add(start, 3);
      sim.relax(200, 1e-9);
      expect(sim.positions[0].y).toBeCloseTo(1, 9);
      expect(sim.positions[0].x).toBeGreaterThan(0);
      expect(sim.positions[0].x).toBeLessThan(20);
    }
  });
});

describe("Particles2D refuses bad input, naming the call and the value", () => {
  it("throws", () => {
    const sim = new Particles2D();
    expect(() => sim.add(new Vec2(0, 0), -1)).toThrow(/Particles2D\.add: radius .* got -1/);
    expect(() => sim.add(new Vec2(NaN, 0), 1)).toThrow(/Particles2D\.add: position/);
    sim.add(new Vec2(0, 0), 1);
    sim.add(new Vec2(3, 0), 1);
    expect(() => sim.addSpring(0, 5)).toThrow(/Particles2D\.addSpring: circle index 5 is out of range/);
    expect(() => sim.addSpring(1, 1)).toThrow(/Particles2D\.addSpring: .* got 1 and 1/);
    expect(() => sim.addSpring(0, 1, 2, 3)).toThrow(/Particles2D\.addSpring: stiffness .* got 3/);
    expect(() => sim.pin(-1)).toThrow(/Particles2D\.pin: circle index -1/);
    sim.boundary = [new Vec2(0, 0), new Vec2(1, 0)];
    expect(() => sim.step()).toThrow(/Particles2D\.step: boundary needs at least 3 points, got 2/);
    sim.boundary = null;
    sim.springs.push({ i: 0, j: 9, rest: 1, stiffness: 0.5 });
    expect(() => sim.step()).toThrow(/Particles2D\.step: spring 0 joins circles 0 and 9/);
    expect(() => Particles2D.pack([new Vec2(0, 0), new Vec2(1, 0)], 1)).toThrow(/Particles2D\.pack: ring needs at least 3 points, got 2/);
    expect(() => Particles2D.pack(square(5), 0)).toThrow(/Particles2D\.pack: radius .* got 0/);
    expect(() => Particles2D.scatter(square(5), -1, createRandom(1))).toThrow(/Particles2D\.scatter: count .* got -1/);
  });
});
