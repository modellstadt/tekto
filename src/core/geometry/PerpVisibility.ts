// Perpendicular ("collimated") edge visibility.
//
// From every point of an emitter segment a→b, a ray is shot PERPENDICULAR to
// the segment (not fanning out — parallel rays, like a collimated linear light).
// Each ray travels outward until it meets the nearest obstacle, or `maxDist`.
// The union of those ray stubs is the emitter's visible region — a polygon whose
// base is the emitter and whose far boundary is the obstacles' lower envelope.
//
// Method (the fast idea: transform, then it's 1-D): rotate the scene so the
// emitter lies on the x-axis and rays point +y. Then a point (x, y) is LIT iff
// no obstacle lies between the base and it in that column, i.e. it is below the
// nearest obstacle. Equivalently:
//
//     lit  =  base slab  −  ⋃ (region directly ABOVE each obstacle segment)
//
// We take that difference with tekto's snapped booleans rather than sweeping a
// lower envelope by hand: the boolean form is short and reuses machinery that
// already handles the collinear/touching degeneracies real edge sets are full
// of. If the obstacle set ever grows large enough that the O(n log n) envelope
// sweep matters, note that non-overlapping obstacles never cross, so the
// envelope's breakpoints are just segment endpoints — a sweep needs no
// intersection tests. Until then, robustness beats the constant factor.

import { Vec2 } from "../math/vectors";
import { Polygon2D } from "./Polygon2D";
import { PolygonBool } from "./PolygonBool";
import type { Ring2, MultiPoly2 } from "./PolygonBool";

export type PerpSegment = readonly [Vec2, Vec2];

/** Clip a segment to the horizontal slab 0 ≤ y ≤ top (Liang–Barsky on y only).
 *  Returns the clipped endpoints [px,py,qx,qy] or null if nothing survives. */
function clipSlabY(
  px: number, py: number, qx: number, qy: number, top: number,
): [number, number, number, number] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = qx - px;
  const dy = qy - py;
  const clip = (p: number, q: number): boolean => {
    if (Math.abs(p) < 1e-12) return q >= 0; // parallel to the bound
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!clip(-dy, py)) return null;        // y ≥ 0
  if (!clip(dy, top - py)) return null;   // y ≤ top
  if (t1 < t0) return null;
  return [px + t0 * dx, py + t0 * dy, px + t1 * dx, py + t1 * dy];
}

/**
 * Perpendicular-visibility region of segment a→b, with rays shot toward its
 * LEFT side (the direction rot90ccw(b−a)). `obstacles` are opaque one-sided
 * walls; each ray stops at the nearest. `maxDist` bounds otherwise-endless rays.
 *
 * Returns the region as zero or more simple rings in WORLD coordinates (more
 * than one only when obstacles split the beam into disjoint lit strips). Empty
 * if the segment is degenerate or nothing is visible.
 */
export function perpVisibility(
  a: Vec2, b: Vec2, obstacles: readonly PerpSegment[], maxDist: number,
): Ring2[] {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < 1e-9 || maxDist <= 0) return [];
  // frame: u along the edge, n the left normal; rays go +n
  const ux = (b.x - a.x) / L;
  const uy = (b.y - a.y) / L;
  const nx = -uy;
  const ny = ux;
  const fwdX = (p: Vec2) => (p.x - a.x) * ux + (p.y - a.y) * uy;
  const fwdY = (p: Vec2) => (p.x - a.x) * nx + (p.y - a.y) * ny;
  const back = (x: number, y: number) => new Vec2(a.x + x * ux + y * nx, a.y + x * uy + y * ny);

  const shadows: MultiPoly2[] = [];
  for (const [p, q] of obstacles) {
    const clip = clipSlabY(fwdX(p), fwdY(p), fwdX(q), fwdY(q), maxDist);
    if (!clip) continue;
    const [px, py, qx, qy] = clip;
    if (Math.abs(px - qx) < 1e-9) continue; // vertical → zero-width shadow
    // the region directly above the clipped segment, up to the slab top
    shadows.push(PolygonBool.fromRing([
      new Vec2(px, py), new Vec2(qx, qy), new Vec2(qx, maxDist), new Vec2(px, maxDist),
    ]));
  }

  const base = PolygonBool.fromRing([
    new Vec2(0, 0), new Vec2(L, 0), new Vec2(L, maxDist), new Vec2(0, maxDist),
  ]);
  let lit: MultiPoly2;
  try {
    lit = shadows.length ? PolygonBool.difference(base, PolygonBool.union(...shadows)) : base;
  } catch {
    return [];
  }
  const out: Ring2[] = [];
  for (const poly of lit) {
    for (const ring of poly) {
      if (ring.length >= 3) out.push(ring.map((v) => back(v.x, v.y)));
    }
  }
  return out;
}

/** As {@link perpVisibility}, but obstacles are given as polygon rings (each
 *  decomposed to its edges). `skipEdge`, if given, is dropped from the obstacle
 *  set — pass the emitter's own edge so it doesn't shadow its own beam. */
export function perpVisibilityOfPolys(
  a: Vec2, b: Vec2, polygons: readonly Ring2[], maxDist: number, skipEdge?: PerpSegment,
): Ring2[] {
  const same = (u: Vec2, v: Vec2) => Math.abs(u.x - v.x) < 1e-6 && Math.abs(u.y - v.y) < 1e-6;
  const segs: PerpSegment[] = [];
  for (const ring of polygons) {
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i];
      const q = ring[(i + 1) % ring.length];
      if (skipEdge
        && ((same(p, skipEdge[0]) && same(q, skipEdge[1])) || (same(p, skipEdge[1]) && same(q, skipEdge[0])))) {
        continue;
      }
      segs.push([p, q]);
    }
  }
  return perpVisibility(a, b, segs, maxDist);
}

/**
 * Visibility of edge `i` of `ring`, shot toward its OUTWARD side (away from the
 * ring interior — winding is detected, so either orientation works), against a
 * set of obstacle rings. The emitter's own edge is excluded automatically.
 */
export function edgeOutwardVisibility(
  ring: Ring2, i: number, obstacles: readonly Ring2[], maxDist: number,
): Ring2[] {
  const p = ring[i];
  const q = ring[(i + 1) % ring.length];
  // rays go LEFT of a→b. For a CCW ring the interior is left of (p→q), so the
  // outward side is left of (q→p); for CW it's the reverse.
  const ccw = Polygon2D.signedArea(ring) > 0;
  const a = ccw ? q : p;
  const b = ccw ? p : q;
  return perpVisibilityOfPolys(a, b, obstacles, maxDist, [p, q]);
}
