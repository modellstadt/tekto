/**
 * Tekto Particles2D — circles in the plane relaxed by position-based steps.
 *
 * Overlapping circles push apart (pairs found with a uniform spatial hash), springs pull
 * pairs toward a rest length, a boundary ring keeps every circle inside. Each step gathers
 * the overlap and spring corrections first and moves every circle once (Jacobi), then the
 * boundary takes each circle back on its own, so the circles' order does not matter.
 * `pack` is the circle packing of the 2008 office-building applet.
 */

import { Vec2 } from "../math/vectors";
import { Polygon2D } from "../geometry/Polygon2D";
import { createRandom, type SeededRandom } from "../math/random";

/**
 * A spring between circles i and j of a Particles2D: pulls (or pushes) them toward `rest` centre distance; stiffness 0..1
 * is the fraction of the error corrected per step.
 *
 * @experimental No app uses this yet; it may still change.
 */
export interface Particles2DSpring {
  i: number;
  j: number;
  rest: number;
  stiffness: number;
}

/** Area of the hexagon around a circle of radius 1 — what one circle claims in a dense packing (2√3 r²). */
const HEX_AREA = 2 * Math.sqrt(3);
const PACK_STEPS = 200;
const PACK_SEED = 1;
/** Rejection sampling gives up after this many tries per point, times the bounding box's area over the ring's. */
const SCATTER_TRIES = 100;
/** Centres closer than this fraction of their contact distance count as coincident. */
const COINCIDENT = 1e-12;
/** A centre within this fraction of its radius of an edge is on it: it is pushed along the edge's inward normal. */
const ON_EDGE = 1e-9;
/** Passes of the boundary correction per step: each averages over the edges a circle still touches (a corner halves). */
const BOUNDARY_PASSES = 4;
/** `relax` stops once no circle moves more than this fraction of the largest radius. */
const RELAX_TOLERANCE = 1e-3;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function fail(call: string, why: string): never {
  throw new Error(`Particles2D.${call}: ${why}`);
}

/** Bucket of a spatial-hash cell (two large primes, xor). */
function hashCell(ix: number, iy: number): number {
  return Math.imul(ix | 0, 73856093) ^ Math.imul(iy | 0, 19349663);
}

/** A separating direction for two coincident centres, fixed by the index pair (never NaN). */
function separatingAngle(i: number, j: number): number {
  return GOLDEN_ANGLE * (Math.min(i, j) * 31 + Math.max(i, j) + 1);
}

/** The boundary ring prepared for a step: open, oriented, with each edge's vector and inward normal. */
interface BoundaryEdges {
  ring: Vec2[];
  ax: Float64Array; ay: Float64Array;
  ex: Float64Array; ey: Float64Array;
  lenSq: Float64Array;
  nx: Float64Array; ny: Float64Array;
}

/**
 * Circles in the plane that push apart where they overlap, springs that pull pairs toward a rest length, and an optional
 * boundary ring that keeps every circle inside — position-based relaxation for circle packing and bubble diagrams.
 * Each `step` gathers every overlap and spring correction first and then moves all circles at once, and the boundary
 * then takes each circle back on its own, so the result does not depend on the order of the circles; with the same
 * input it is deterministic.
 *
 *   const sim = new Particles2D();
 *   const a = sim.add(new Vec2(0, 0), 3), b = sim.add(new Vec2(1, 0), 2);
 *   sim.addSpring(a, b, 5);
 *   sim.relax(500);
 *
 * @experimental No app uses this yet; it may still change.
 */
export class Particles2D {
  /** Circle centres; `step` replaces them with new vectors. */
  positions: Vec2[] = [];
  /** Circle radii, one per position. */
  radii: number[] = [];
  /** A pinned circle never moves; whatever it meets takes the whole correction. */
  pinned: boolean[] = [];
  /** Springs between pairs of circles (`addSpring`). */
  springs: Particles2DSpring[] = [];
  /** Keep every circle inside this ring (any simple polygon, either winding), or null. */
  boundary: Vec2[] | null = null;
  /** Fraction of each overlap resolved per step (0..1). Default 0.8. */
  overlapStiffness = 0.8;
  /** Fraction of a boundary violation corrected per step (0..1). Default 1. */
  boundaryStiffness = 1;
  /** Extra gap kept between circles (default 0). */
  gap = 0;

  private xs = new Float64Array(0);
  private ys = new Float64Array(0);
  private dx = new Float64Array(0);
  private dy = new Float64Array(0);

  /** Add a circle; returns its index. */
  add(position: Vec2, radius: number): number {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) fail("add", `position must be finite, got (${position.x}, ${position.y})`);
    if (!Number.isFinite(radius) || radius < 0) fail("add", `radius must be a finite number ≥ 0, got ${radius}`);
    this.positions.push(position);
    this.radii.push(radius);
    this.pinned.push(false);
    return this.positions.length - 1;
  }

  /** Link circles `i` and `j` by a spring; `rest` defaults to their current centre distance, `stiffness` (0..1) to 0.5. */
  addSpring(i: number, j: number, rest?: number, stiffness = 0.5): void {
    this.checkIndex("addSpring", i);
    this.checkIndex("addSpring", j);
    if (i === j) fail("addSpring", `a spring needs two different circles, got ${i} and ${j}`);
    const length = rest ?? this.positions[i].distTo(this.positions[j]);
    if (!Number.isFinite(length) || length < 0) fail("addSpring", `rest length must be a finite number ≥ 0, got ${rest}`);
    if (!(stiffness >= 0 && stiffness <= 1)) fail("addSpring", `stiffness must be in 0..1, got ${stiffness}`);
    this.springs.push({ i, j, rest: length, stiffness });
  }

  /** Pin circle `i` in place (or release it with `pinned = false`). */
  pin(i: number, pinned = true): void {
    this.checkIndex("pin", i);
    this.pinned[i] = pinned;
  }

  /**
   * One relaxation step; returns the largest distance any circle moved.
   *
   * An overlap o = rᵢ + rⱼ + gap − d moves each circle o/2 × `overlapStiffness` apart; a spring moves each end
   * (d − rest)/2 × its stiffness toward the other; a pinned circle's partner takes the whole correction. All of them
   * are summed, then every circle moves. With a `boundary`, each moved circle is then corrected on its own (scaled by
   * `boundaryStiffness`): a centre outside the ring goes to the nearest point on it, and a circle closer than its
   * radius to edges is moved to lie its radius inside them — the average over those edges, repeated a few times, so it
   * settles into a corner and ends up centred where the ring is too narrow for it.
   */
  step(): number {
    const n = this.positions.length;
    this.checkSettings("step");
    this.load(n);
    const { xs, ys, dx, dy, radii } = this;
    const pinned = (i: number) => this.pinned[i] === true;
    dx.fill(0, 0, n);
    dy.fill(0, 0, n);

    // Overlaps: each circle takes half the correction, or all of it beside a pinned one.
    const k = this.overlapStiffness;
    this.forEachOverlap(n, (i, j, ex, ey, d, o) => {
      const pi = pinned(i), pj = pinned(j);
      if (pi && pj) return;
      let ux = 0, uy = 0;
      if (d > COINCIDENT * (o + d)) { ux = ex / d; uy = ey / d; }
      else { const a = separatingAngle(i, j); ux = Math.cos(a); uy = Math.sin(a); }
      const move = o * k;
      if (!pi) { const s = pj ? move : move / 2; dx[i] -= ux * s; dy[i] -= uy * s; }
      if (!pj) { const s = pi ? move : move / 2; dx[j] += ux * s; dy[j] += uy * s; }
    });

    // Springs: each end moves half the error toward the other.
    for (let s = 0; s < this.springs.length; s++) {
      const { i, j, rest, stiffness } = this.springs[s];
      if (!(i >= 0 && i < n && j >= 0 && j < n && Number.isInteger(i) && Number.isInteger(j))) {
        fail("step", `spring ${s} joins circles ${i} and ${j}, but there are ${n} circles`);
      }
      const pi = pinned(i), pj = pinned(j);
      if (pi && pj) continue;
      const ex = xs[j] - xs[i], ey = ys[j] - ys[i];
      const d = Math.sqrt(ex * ex + ey * ey);
      const err = d - rest;
      if (err === 0) continue;
      let ux = 0, uy = 0;
      if (d > COINCIDENT * (d + rest)) { ux = ex / d; uy = ey / d; }
      else { const a = separatingAngle(i, j); ux = Math.cos(a); uy = Math.sin(a); }
      const move = err * stiffness;
      if (!pi) { const m = pj ? move : move / 2; dx[i] += ux * m; dy[i] += uy * m; }
      if (!pj) { const m = pi ? move : move / 2; dx[j] -= ux * m; dy[j] -= uy * m; }
    }

    // Move every circle at once; then the boundary takes each one back inside, and its radius
    // away from the edges, from where it moved to.
    const edges = this.boundary ? this.prepareBoundary("step", this.boundary) : null;
    const kb = this.boundaryStiffness;
    let maxMove = 0;
    for (let i = 0; i < n; i++) {
      let x = xs[i] + dx[i], y = ys[i] + dy[i];
      if (edges && !pinned(i)) {
        let px = x, py = y;
        const p = new Vec2(x, y);
        if (!Polygon2D.pointInPolygon(p, edges.ring)) {
          const q = Polygon2D.closestPointOnEdge(edges.ring, p).point;
          px = q.x; py = q.y;
        }
        for (let pass = 0; pass < BOUNDARY_PASSES; pass++) {
          const [bx, by] = bandCorrection(edges, px, py, radii[i]);
          if (bx === 0 && by === 0) break;
          px += bx; py += by;
        }
        x += (px - x) * kb;
        y += (py - y) * kb;
      }
      const mx = x - xs[i], my = y - ys[i];
      if (mx === 0 && my === 0) continue;
      this.positions[i] = new Vec2(x, y);
      const m = Math.sqrt(mx * mx + my * my);
      if (m > maxMove) maxMove = m;
    }
    return maxMove;
  }

  /**
   * Steps until the largest move is no more than `tolerance` or `maxSteps` is reached; returns the number of steps run.
   * `tolerance` defaults to a thousandth of the largest radius.
   */
  relax(maxSteps: number, tolerance?: number): number {
    if (!Number.isInteger(maxSteps) || maxSteps < 0) fail("relax", `maxSteps must be a whole number ≥ 0, got ${maxSteps}`);
    let maxR = 0;
    for (const r of this.radii) if (r > maxR) maxR = r;
    const tol = tolerance ?? RELAX_TOLERANCE * maxR;
    if (!Number.isFinite(tol) || tol < 0) fail("relax", `tolerance must be a finite number ≥ 0, got ${tolerance}`);
    for (let s = 1; s <= maxSteps; s++) {
      if (this.step() <= tol) return s;
    }
    return maxSteps;
  }

  /** Total overlap between circles (sum over overlapping pairs), a convergence diagnostic. */
  overlap(): number {
    const n = this.positions.length;
    this.checkSettings("overlap");
    this.load(n);
    let total = 0;
    this.forEachOverlap(n, (_i, _j, _ex, _ey, _d, o) => { total += o; });
    return total;
  }

  /** `count` seeded-random points inside a ring (rejection sampling in its bounding box). */
  static scatter(ring: Vec2[], count: number, random: SeededRandom): Vec2[] {
    if (!Number.isInteger(count) || count < 0) fail("scatter", `count must be a whole number ≥ 0, got ${count}`);
    const poly = Polygon2D.openRing(ring);
    if (poly.length < 3) fail("scatter", `ring needs at least 3 points, got ${ring.length}`);
    const area = Polygon2D.area(poly);
    if (!(area > 0)) fail("scatter", `ring has no area (${area})`);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of poly) {
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    const maxTries = Math.ceil(count * SCATTER_TRIES * ((x1 - x0) * (y1 - y0)) / area) + 1000;
    const out: Vec2[] = [];
    for (let tries = 0; out.length < count; tries++) {
      if (tries > maxTries) fail("scatter", `found ${out.length} of ${count} points inside the ring in ${maxTries} tries`);
      const p = new Vec2(random.random(x0, x1), random.random(y0, y1));
      if (Polygon2D.pointInPolygon(p, poly)) out.push(p);
    }
    return out;
  }

  /**
   * Fills a ring with circles of radius r the way the 2008 applet did: scatter area/(2√3 r²) points, relax them for
   * `steps` steps (default 200) inside the ring, drop any left outside; returns the centres.
   * The points come from `random`, else from `createRandom(seed)` (default seed 1), so a seed always packs the same.
   */
  static pack(ring: Vec2[], radius: number, options: { random?: SeededRandom; seed?: number; steps?: number } = {}): Vec2[] {
    if (!Number.isFinite(radius) || radius <= 0) fail("pack", `radius must be a finite number > 0, got ${radius}`);
    const steps = options.steps ?? PACK_STEPS;
    if (!Number.isInteger(steps) || steps < 0) fail("pack", `steps must be a whole number ≥ 0, got ${steps}`);
    const poly = Polygon2D.openRing(ring);
    if (poly.length < 3) fail("pack", `ring needs at least 3 points, got ${ring.length}`);
    const random = options.random ?? createRandom(options.seed ?? PACK_SEED);
    const count = Math.round(Polygon2D.area(poly) / (HEX_AREA * radius * radius));

    const sim = new Particles2D();
    sim.boundary = poly;
    for (const p of Particles2D.scatter(poly, count, random)) sim.add(p, radius);
    for (let s = 0; s < steps; s++) sim.step();
    return sim.positions.filter((p) => Polygon2D.pointInPolygon(p, poly));
  }

  // ── Internals ──

  private checkIndex(call: string, i: number): void {
    if (!Number.isInteger(i) || i < 0 || i >= this.positions.length) {
      fail(call, `circle index ${i} is out of range (there are ${this.positions.length} circles)`);
    }
  }

  private checkSettings(call: string): void {
    const n = this.positions.length;
    if (this.radii.length !== n) fail(call, `${this.radii.length} radii for ${n} positions — need one radius per circle`);
    if (!(this.overlapStiffness >= 0 && this.overlapStiffness <= 1)) fail(call, `overlapStiffness must be in 0..1, got ${this.overlapStiffness}`);
    if (!(this.boundaryStiffness >= 0 && this.boundaryStiffness <= 1)) fail(call, `boundaryStiffness must be in 0..1, got ${this.boundaryStiffness}`);
    if (!Number.isFinite(this.gap) || this.gap < 0) fail(call, `gap must be a finite number ≥ 0, got ${this.gap}`);
  }

  /** Copy the centres into the scratch arrays (grown as needed). */
  private load(n: number): void {
    if (this.xs.length < n) {
      const size = Math.max(n, this.xs.length * 2);
      this.xs = new Float64Array(size);
      this.ys = new Float64Array(size);
      this.dx = new Float64Array(size);
      this.dy = new Float64Array(size);
    }
    for (let i = 0; i < n; i++) {
      this.xs[i] = this.positions[i].x;
      this.ys[i] = this.positions[i].y;
    }
  }

  /**
   * Visit every overlapping pair once (i < j), with j − i as (ex, ey), the centre distance d and the overlap o.
   * Circles go into a uniform spatial hash (cell = 2 × the largest radius + gap), so overlapping centres are in the
   * same or a neighbouring cell; a bucket two neighbour cells share is read once.
   */
  private forEachOverlap(n: number, visit: (i: number, j: number, ex: number, ey: number, d: number, o: number) => void): void {
    const { xs, ys, radii, gap } = this;
    let maxR = 0;
    for (let i = 0; i < n; i++) if (radii[i] > maxR) maxR = radii[i];
    const cell = 2 * maxR + gap;
    if (n < 2 || !(cell > 0)) return;
    const inv = 1 / cell;

    let size = 16;
    while (size < 2 * n) size *= 2;
    const mask = size - 1;
    const start = new Int32Array(size + 1);
    const bucket = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const b = hashCell(Math.floor(xs[i] * inv), Math.floor(ys[i] * inv)) & mask;
      bucket[i] = b;
      start[b + 1]++;
    }
    for (let b = 0; b < size; b++) start[b + 1] += start[b];
    const fill = start.slice(0, size);
    const order = new Int32Array(n);
    for (let i = 0; i < n; i++) order[fill[bucket[i]]++] = i;

    const seen = new Int32Array(9);
    for (let i = 0; i < n; i++) {
      const cx = Math.floor(xs[i] * inv), cy = Math.floor(ys[i] * inv);
      const ri = radii[i];
      let nSeen = 0;
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const b = hashCell(cx + ox, cy + oy) & mask;
          let dup = false;
          for (let s = 0; s < nSeen; s++) if (seen[s] === b) { dup = true; break; }
          if (dup) continue;
          seen[nSeen++] = b;
          for (let q = start[b]; q < start[b + 1]; q++) {
            const j = order[q];
            if (j <= i) continue;
            const ex = xs[j] - xs[i], ey = ys[j] - ys[i];
            const min = ri + radii[j] + gap;
            const d2 = ex * ex + ey * ey;
            if (d2 >= min * min) continue;
            const d = Math.sqrt(d2);
            visit(i, j, ex, ey, d, min - d);
          }
        }
      }
    }
  }

  private prepareBoundary(call: string, boundary: Vec2[]): BoundaryEdges {
    const ring = Polygon2D.openRing(boundary);
    const m = ring.length;
    if (m < 3) fail(call, `boundary needs at least 3 points, got ${boundary.length}`);
    const area = Polygon2D.signedArea(ring);
    if (!(Math.abs(area) > 0)) fail(call, `boundary has no area (${area})`);
    const inward = area > 0 ? 1 : -1;      // CCW: the interior is left of each edge
    const e: BoundaryEdges = {
      ring,
      ax: new Float64Array(m), ay: new Float64Array(m),
      ex: new Float64Array(m), ey: new Float64Array(m),
      lenSq: new Float64Array(m),
      nx: new Float64Array(m), ny: new Float64Array(m),
    };
    for (let k = 0; k < m; k++) {
      const a = ring[k], b = ring[(k + 1) % m];
      const ex = b.x - a.x, ey = b.y - a.y;
      const len = Math.sqrt(ex * ex + ey * ey);
      e.ax[k] = a.x; e.ay[k] = a.y;
      e.ex[k] = ex; e.ey[k] = ey;
      e.lenSq[k] = ex * ex + ey * ey;
      if (len > 0) { e.nx[k] = -ey / len * inward; e.ny[k] = ex / len * inward; }
    }
    return e;
  }
}

/**
 * The move that puts a circle of radius r at (px, py) its radius away from every edge closer than that: each such edge
 * pushes it along the normal from its closest point, and the pushes are averaged.
 */
function bandCorrection(edges: BoundaryEdges, px: number, py: number, r: number): [number, number] {
  const { ax, ay, ex, ey, lenSq, nx, ny } = edges;
  let sx = 0, sy = 0, hits = 0;
  for (let k = 0; k < ax.length; k++) {
    if (lenSq[k] === 0) continue;
    const x0 = ax[k], y0 = ay[k], x1 = x0 + ex[k], y1 = y0 + ey[k];
    if (px + r <= Math.min(x0, x1) || px - r >= Math.max(x0, x1) || py + r <= Math.min(y0, y1) || py - r >= Math.max(y0, y1)) continue;
    const t = Math.max(0, Math.min(1, ((px - x0) * ex[k] + (py - y0) * ey[k]) / lenSq[k]));
    const wx = px - (x0 + ex[k] * t), wy = py - (y0 + ey[k] * t);
    const d = Math.sqrt(wx * wx + wy * wy);
    if (d >= r) continue;
    const push = r - d;
    if (d > ON_EDGE * r) { sx += wx / d * push; sy += wy / d * push; }
    else { sx += nx[k] * push; sy += ny[k] * push; }
    hits++;
  }
  return hits > 0 ? [sx / hits, sy / hits] : [0, 0];
}
