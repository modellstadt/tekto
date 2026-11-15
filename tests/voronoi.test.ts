import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { createRandom } from "../src/core/math/random";
import { Polygon2D } from "../src/core/geometry/Polygon2D";
import { PolygonBool, setClipSnap } from "../src/core/geometry/PolygonBool";
import { Voronoi2D } from "../src/core/geometry/planarGraph";
import type { VoronoiCell } from "../src/core/geometry/planarGraph";

// ── Fixtures ──

function randomSites(n: number, seed: number, x0 = 0, y0 = 0, w = 1, h = 1): Vec2[] {
  const r = createRandom(seed);
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) out.push(new Vec2(x0 + r.random() * w, y0 + r.random() * h));
  return out;
}

function randomRadii(n: number, seed: number, min: number, max: number): number[] {
  const r = createRandom(seed);
  return Array.from({ length: n }, () => r.random(min, max));
}

const v = (x: number, y: number) => new Vec2(x, y);
const UNIT = [v(0, 0), v(1, 0), v(1, 1), v(0, 1)];
const L_SHAPE = [v(0, 0), v(1, 0), v(1, 0.5), v(0.5, 0.5), v(0.5, 1), v(0, 1)];
const U_SHAPE = [v(0, 0), v(1, 0), v(1, 1), v(0.7, 1), v(0.7, 0.35), v(0.3, 0.35), v(0.3, 1), v(0, 1)];
/** A convex octagon, clockwise (the clip may have either winding). */
const OCTAGON = Array.from({ length: 8 }, (_, k) => v(0.5 + 0.6 * Math.cos(-k * Math.PI / 4 + 0.2), 0.5 + 0.6 * Math.sin(-k * Math.PI / 4 + 0.2)));

/** The default clip: the sites' bounds grown by half the larger side on every side. */
function defaultBox(sites: Vec2[]): Vec2[] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of sites) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  const pad = Math.max(x1 - x0, y1 - y0) / 2 || 1;
  return [v(x0 - pad, y0 - pad), v(x1 + pad, y0 - pad), v(x1 + pad, y1 + pad), v(x0 - pad, y1 + pad)];
}

const areaOf = (poly: Vec2[]) => (poly.length ? Polygon2D.signedArea(poly) : 0);
const totalArea = (cells: VoronoiCell[]) => cells.reduce((s, c) => s + areaOf(c.polygon), 0);
const ringArea = (ring: Vec2[]) => Math.abs(Polygon2D.signedArea(ring));

function powerDist(x: Vec2, sites: Vec2[], radii: number[] | undefined, i: number): number {
  const r = radii ? radii[i] : 0;
  return x.distSqTo(sites[i]) - r * r;
}

function distToRing(p: Vec2, ring: Vec2[]): number {
  let best = Infinity;
  for (let k = 0; k < ring.length; k++) {
    const a = ring[k], b = ring[(k + 1) % ring.length], ab = b.sub(a);
    const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / ab.lenSq()));
    best = Math.min(best, p.distTo(a.add(ab.mul(t))));
  }
  return best;
}

/**
 * Every edge labelled j lies where sites i and j are equally near (by power) and no site is
 * nearer; every edge labelled -1 lies on the clip; polygons are CCW; labels are mutual.
 */
function checkExact(cells: VoronoiCell[], sites: Vec2[], clip: Vec2[], radii?: number[]): void {
  const tol = 1e-8;
  const bad: string[] = [];
  const pairs = new Set<string>();
  for (const c of cells) {
    const i = c.site;
    if (c.neighbors.length !== c.polygon.length) bad.push(`cell ${i}: ${c.neighbors.length} labels for ${c.polygon.length} edges`);
    if (c.polygon.length === 0) continue;
    if (!(Polygon2D.signedArea(c.polygon) > 0)) bad.push(`cell ${i} is not counter-clockwise`);
    for (let k = 0; k < c.polygon.length; k++) {
      const a = c.polygon[k], b = c.polygon[(k + 1) % c.polygon.length];
      if (!(a.distTo(b) > 0)) bad.push(`cell ${i} edge ${k} has zero length`);
      const m = a.add(b).mul(0.5);
      const j = c.neighbors[k];
      const own = powerDist(m, sites, radii, i);
      if (j >= 0) {
        if (j === i) bad.push(`cell ${i} edge ${k} names itself`);
        const gap = Math.abs(own - powerDist(m, sites, radii, j));
        if (!(gap < tol)) bad.push(`cell ${i} edge ${k} → ${j}: not on their bisector (${gap})`);
        pairs.add(`${i}:${j}`);
      } else {
        const off = Math.max(distToRing(a, clip), distToRing(b, clip), distToRing(m, clip));
        if (!(off < tol)) bad.push(`cell ${i} edge ${k} → -1: ${off} off the clip`);
      }
      for (let l = 0; l < sites.length; l++) {
        if (l !== i && !(powerDist(m, sites, radii, l) > own - tol)) bad.push(`cell ${i} edge ${k}: site ${l} is nearer`);
      }
    }
  }
  for (const p of pairs) {
    const [i, j] = p.split(":");
    if (!pairs.has(`${j}:${i}`)) bad.push(`edge ${i} → ${j} has no edge ${j} → ${i}`);
  }
  expect(bad).toEqual([]);
}

/** The result-order contract: one entry per site first, extra pieces after. */
function checkOrder(cells: VoronoiCell[], n: number): void {
  expect(cells.length).toBeGreaterThanOrEqual(n);
  for (let i = 0; i < n; i++) expect(cells[i].site).toBe(i);
  for (let k = n; k < cells.length; k++) {
    expect(cells[k].site).toBeGreaterThanOrEqual(0);
    expect(cells[k].site).toBeLessThan(n);
    expect(cells[k].polygon.length).toBeGreaterThan(0);
  }
}

// ── Brute force: every site cuts every cell, no grid, no pruning ──

function bruteCell(i: number, sites: Vec2[], start: Vec2[], radii?: number[]): { polygon: Vec2[]; neighbors: number[] } {
  let poly = Polygon2D.isCCW(start) ? start.slice() : start.slice().reverse();
  let labels = poly.map(() => -1);
  for (let j = 0; j < sites.length; j++) {
    if (j === i) continue;
    const u = sites[j].sub(sites[i]), d = u.len();
    const ri = radii ? radii[i] : 0, rj = radii ? radii[j] : 0;
    const h = (d * d + ri * ri - rj * rj) / (2 * d);
    const side = (x: Vec2) => x.sub(sites[i]).dot(u) / d - h;
    const np: Vec2[] = [], nl: number[] = [];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k], b = poly[(k + 1) % poly.length], da = side(a), db = side(b);
      if (da <= 0) { np.push(a); nl.push(labels[k]); }
      if ((da <= 0) !== (db <= 0)) { np.push(a.lerp(b, da / (da - db))); nl.push(da <= 0 ? j : labels[k]); }
    }
    poly = np; labels = nl;
    if (poly.length < 3) return { polygon: [], neighbors: [] };
  }
  return { polygon: poly, neighbors: labels };
}

function bruteNeighbors(sites: Vec2[], start: Vec2[], radii?: number[]): { areas: number[]; adj: number[][] } {
  const areas: number[] = [];
  const sets = sites.map(() => new Set<number>());
  for (let i = 0; i < sites.length; i++) {
    const c = bruteCell(i, sites, start, radii);
    areas.push(areaOf(c.polygon));
    for (let k = 0; k < c.polygon.length; k++) {
      const j = c.neighbors[k];
      if (j >= 0 && c.polygon[k].distTo(c.polygon[(k + 1) % c.polygon.length]) > 1e-9) { sets[i].add(j); sets[j].add(i); }
    }
  }
  return { areas, adj: sets.map((s) => [...s].sort((a, b) => a - b)) };
}

function areasBySite(cells: VoronoiCell[], n: number): number[] {
  const a = new Array(n).fill(0);
  for (const c of cells) a[c.site] += areaOf(c.polygon);
  return a;
}

// ── Tests ──

describe("Voronoi2D.cells — areas", () => {
  const sites = randomSites(300, 1);

  it("cells tile the default box", () => {
    const cells = Voronoi2D.cells(sites);
    checkOrder(cells, sites.length);
    expect(cells.length).toBe(sites.length);
    expect(totalArea(cells)).toBeCloseTo(ringArea(defaultBox(sites)), 9);
  });

  it("cells tile a convex clip (given clockwise)", () => {
    const cells = Voronoi2D.cells(sites, { clip: OCTAGON });
    expect(cells.length).toBe(sites.length);
    expect(totalArea(cells)).toBeCloseTo(ringArea(OCTAGON), 9);
  });

  it("cells tile a concave L-shaped clip", () => {
    const cells = Voronoi2D.cells(sites, { clip: L_SHAPE });
    checkOrder(cells, sites.length);
    expect(totalArea(cells)).toBeCloseTo(0.75, 9);
  });

  it("cells tile a U-shaped clip, which cuts some cells in two", () => {
    const cells = Voronoi2D.cells(randomSites(40, 3), { clip: U_SHAPE });
    checkOrder(cells, 40);
    expect(totalArea(cells)).toBeCloseTo(ringArea(U_SHAPE), 9);
  });

  it("power cells tile the clip too", () => {
    const radii = randomRadii(sites.length, 2, 0, 0.05);
    expect(totalArea(Voronoi2D.cells(sites, { radii }))).toBeCloseTo(ringArea(defaultBox(sites)), 9);
    expect(totalArea(Voronoi2D.cells(sites, { radii, clip: UNIT }))).toBeCloseTo(1, 9);
    expect(totalArea(Voronoi2D.cells(sites, { radii, clip: L_SHAPE }))).toBeCloseTo(0.75, 9);
  });
});

describe("Voronoi2D.cells — exactness", () => {
  it("plain Voronoi in the default box", () => {
    for (const seed of [11, 12]) {
      const sites = randomSites(150, seed);
      checkExact(Voronoi2D.cells(sites), sites, defaultBox(sites));
    }
  });

  it("plain Voronoi in a convex and in concave clips", () => {
    const sites = randomSites(150, 13);
    checkExact(Voronoi2D.cells(sites, { clip: OCTAGON }), sites, OCTAGON);
    checkExact(Voronoi2D.cells(sites, { clip: L_SHAPE }), sites, L_SHAPE);
    checkExact(Voronoi2D.cells(sites, { clip: U_SHAPE }), sites, U_SHAPE);
  });

  it("sites outside the clip", () => {
    const sites = randomSites(120, 14, -0.5, -0.5, 2, 2);
    const cells = Voronoi2D.cells(sites, { clip: U_SHAPE });
    checkOrder(cells, sites.length);
    checkExact(cells, sites, U_SHAPE);
    expect(totalArea(cells)).toBeCloseTo(ringArea(U_SHAPE), 9);
  });

  it("power diagrams", () => {
    const sites = randomSites(150, 15);
    const radii = randomRadii(sites.length, 16, 0, 0.08);
    checkExact(Voronoi2D.cells(sites, { radii }), sites, defaultBox(sites), radii);
    checkExact(Voronoi2D.cells(sites, { radii, clip: L_SHAPE }), sites, L_SHAPE, radii);
  });

  it("a big circle among small ones: empty and off-centre cells stay exact", () => {
    const sites = randomSites(60, 17);
    const radii = sites.map((_, i) => (i === 0 ? 0.4 : 0.01));
    const cells = Voronoi2D.cells(sites, { radii, clip: UNIT });
    checkExact(cells, sites, UNIT, radii);
    expect(totalArea(cells)).toBeCloseTo(1, 9);
    expect(cells.some((c) => c.polygon.length === 0)).toBe(true);
  });
});

describe("Voronoi2D.neighbors", () => {
  it("is symmetric, ascending and without duplicates", () => {
    const sites = randomSites(200, 21);
    const adj = Voronoi2D.neighbors(Voronoi2D.cells(sites, { clip: L_SHAPE }), sites.length);
    expect(adj.length).toBe(sites.length);
    adj.forEach((list, i) => {
      for (let k = 1; k < list.length; k++) expect(list[k]).toBeGreaterThan(list[k - 1]);
      for (const j of list) {
        expect(j).not.toBe(i);
        expect(adj[j]).toContain(i);
      }
    });
  });

  it("matches brute force in a box, a convex clip and with radii", () => {
    const cases: { sites: Vec2[]; clip: Vec2[]; radii?: number[]; useDefault?: boolean }[] = [];
    const a = randomSites(200, 22);
    cases.push({ sites: a, clip: defaultBox(a), useDefault: true });
    cases.push({ sites: randomSites(200, 23), clip: OCTAGON });
    const b = randomSites(200, 24);
    cases.push({ sites: b, clip: UNIT, radii: randomRadii(200, 25, 0, 0.06) });
    for (const { sites, clip, radii, useDefault } of cases) {
      const cells = Voronoi2D.cells(sites, { clip: useDefault ? undefined : clip, radii });
      const ref = bruteNeighbors(sites, clip, radii);
      expect(Voronoi2D.neighbors(cells, sites.length)).toEqual(ref.adj);
      const areas = areasBySite(cells, sites.length);
      for (let i = 0; i < sites.length; i++) expect(areas[i]).toBeCloseTo(ref.areas[i], 10);
    }
  });

  it("matches brute force clipped to a concave ring, per site", () => {
    const sites = randomSites(200, 26);
    setClipSnap(0); // the reference must not snap to the default 1e-3 grid at this scale
    try {
    for (const clip of [L_SHAPE, U_SHAPE]) {
      const cells = Voronoi2D.cells(sites, { clip });
      const box = [v(0, 0), v(1, 0), v(1, 1), v(0, 1)]; // both rings' bounds
      const areas = areasBySite(cells, sites.length);
      for (let i = 0; i < sites.length; i++) {
        const convex = bruteCell(i, sites, box).polygon;
        const ref = convex.length ? PolygonBool.area(PolygonBool.intersection(PolygonBool.fromRing(convex), PolygonBool.fromRing(clip))) : 0;
        expect(areas[i]).toBeCloseTo(ref, 10);
      }
    }
    } finally {
      setClipSnap(1e-3);
    }
  });
});

describe("Voronoi2D.cells — special configurations", () => {
  it("a square grid of sites gives unit square cells", () => {
    const sites: Vec2[] = [];
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) sites.push(v(x, y));
    const clip = [v(-0.5, -0.5), v(4.5, -0.5), v(4.5, 4.5), v(-0.5, 4.5)];
    const cells = Voronoi2D.cells(sites, { clip });
    expect(cells.length).toBe(25);
    for (const c of cells) {
      expect(c.polygon.length).toBe(4);
      expect(areaOf(c.polygon)).toBeCloseTo(1, 12);
      const p = sites[c.site];
      for (const q of c.polygon) {
        expect(Math.abs(Math.abs(q.x - p.x) - 0.5)).toBeLessThan(1e-12);
        expect(Math.abs(Math.abs(q.y - p.y) - 0.5)).toBeLessThan(1e-12);
      }
    }
    const adj = Voronoi2D.neighbors(cells, 25);
    expect(adj[12]).toEqual([7, 11, 13, 17]); // no diagonal neighbours through the shared corners
    expect(adj[0]).toEqual([1, 5]);
    expect(cells[0].neighbors.filter((j) => j === -1).length).toBe(2);
    checkExact(cells, sites, clip);
  });

  it("a grid in an L whose inner edges run along cell boundaries", () => {
    const sites: Vec2[] = [];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) sites.push(v(x + 0.5, y + 0.5));
    const clip = [v(0, 0), v(4, 0), v(4, 2), v(2, 2), v(2, 4), v(0, 4)];
    const cells = Voronoi2D.cells(sites, { clip });
    checkOrder(cells, 16);
    checkExact(cells, sites, clip);
    expect(totalArea(cells)).toBeCloseTo(12, 10);
    const adj = Voronoi2D.neighbors(cells, 16);
    // Site (2.5, 1.5) is index 6: the ring runs along its top edge, so (2.5, 2.5) is not across it.
    expect(adj[6]).toEqual([2, 5, 7]);
    expect(cells[10].polygon.length).toBe(0); // (2.5, 2.5) lies in the notch
    for (const list of adj) expect(list).not.toContain(10);
  });

  it("two touching circles meet at their contact point", () => {
    const sites = [v(0, 0), v(3, 0)];
    const radii = [1, 2];
    const cells = Voronoi2D.cells(sites, { radii, clip: [v(-4, -4), v(6, -4), v(6, 4), v(-4, 4)] });
    const k = cells[0].neighbors.indexOf(1);
    expect(k).toBeGreaterThanOrEqual(0);
    const a = cells[0].polygon[k], b = cells[0].polygon[(k + 1) % cells[0].polygon.length];
    expect(a.x).toBeCloseTo(1, 12);
    expect(b.x).toBeCloseTo(1, 12);
    expect(Math.min(a.y, b.y)).toBeLessThan(0);
    expect(Math.max(a.y, b.y)).toBeGreaterThan(0);
  });

  it("coincident sites: one keeps the cell, the others are empty and nobody's neighbour", () => {
    const sites = [v(0, 0), v(1, 0), v(0, 0), v(0.5, 1), v(1, 0)];
    const cells = Voronoi2D.cells(sites);
    checkOrder(cells, 5);
    expect(cells[2].polygon).toEqual([]);
    expect(cells[2].neighbors).toEqual([]);
    expect(cells[4].polygon).toEqual([]);
    expect(cells[0].polygon.length).toBeGreaterThan(0);
    expect(totalArea(cells)).toBeCloseTo(ringArea(defaultBox(sites)), 10);
    const adj = Voronoi2D.neighbors(cells, 5);
    expect(adj).toEqual([[1, 3], [0, 3], [], [0, 1], []]);

    // With radii the larger circle keeps it.
    const withRadii = Voronoi2D.cells([v(0, 0), v(2, 0), v(0, 0)], { radii: [0.1, 0.1, 0.3] });
    expect(withRadii[0].polygon).toEqual([]);
    expect(withRadii[2].polygon.length).toBeGreaterThan(0);
  });

  it("a single site gets the whole clip", () => {
    const box = Voronoi2D.cells([v(2, 3)]);
    expect(box.length).toBe(1);
    expect(areaOf(box[0].polygon)).toBeCloseTo(4, 12); // grown by 1 on every side
    expect(box[0].neighbors.every((j) => j === -1)).toBe(true);

    const l = Voronoi2D.cells([v(0.2, 0.2)], { clip: L_SHAPE });
    expect(l.length).toBe(1);
    expect(areaOf(l[0].polygon)).toBeCloseTo(0.75, 12);
    expect(l[0].polygon.length).toBe(6);
    expect(l[0].neighbors).toEqual([-1, -1, -1, -1, -1, -1]);
  });

  it("collinear sites give strips", () => {
    const sites = [v(3, 0), v(0, 0), v(1, 0), v(4, 0), v(2, 0)];
    const cells = Voronoi2D.cells(sites);
    checkExact(cells, sites, defaultBox(sites));
    expect(totalArea(cells)).toBeCloseTo(ringArea(defaultBox(sites)), 10);
    expect(Voronoi2D.neighbors(cells, 5)).toEqual([[3, 4], [2], [1, 4], [0], [0, 2]]);
    for (const c of cells) expect(c.polygon.length).toBe(4);
  });

  it("no sites, no cells", () => {
    expect(Voronoi2D.cells([])).toEqual([]);
    expect(Voronoi2D.neighbors([], 0)).toEqual([]);
  });

  it("fails loudly on bad input, naming it", () => {
    const sites = [v(0, 0), v(1, 0), v(0, 1)];
    expect(() => Voronoi2D.cells(sites, { radii: [1, 2] })).toThrow(/Voronoi2D\.cells.*radii has 2 entries for 3 sites/);
    expect(() => Voronoi2D.cells(sites, { radii: [1, -2, 1] })).toThrow(/radii\[1\] is -2/);
    expect(() => Voronoi2D.cells([v(0, 0), v(NaN, 1)])).toThrow(/sites\[1\]/);
    expect(() => Voronoi2D.cells(sites, { clip: [v(0, 0), v(1, 1)] })).toThrow(/options\.clip/);
    expect(() => Voronoi2D.cells(sites, { clip: [v(0, 0), v(1, 1), v(2, 2)] })).toThrow(/encloses no area/);
    expect(() => Voronoi2D.neighbors([{ site: 5, polygon: [], neighbors: [] }], 3)).toThrow(/Voronoi2D\.neighbors/);
  });
});
