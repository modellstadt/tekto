/**
 * Tekto PolygonBool — robust 2D boolean operations on polygons *with holes*.
 *
 * Thin, Vec2-native wrapper over `polygon-clipping` (pure-JS, sweepline-robust).
 * Unlike {@link polygonIntersection} (Greiner–Hormann, two simple rings, no
 * holes), these operate on multipolygons that may contain holes — which is
 * exactly what you need when a packed/placed region encloses a gap, or when a
 * No-Fit Polygon develops an interior void.
 *
 * Representation:
 *   Ring2      = Vec2[]            one ring, *open* (no repeated closing vertex)
 *   Poly2      = Ring2[]           [outerRing, ...holeRings]
 *   MultiPoly2 = Poly2[]           zero or more disjoint polygons, each w/ holes
 *
 * Winding is not required on input (polygon-clipping normalises). On output,
 * outer rings are CCW and holes CW, following polygon-clipping's convention.
 */

import polygonClipping from "polygon-clipping";

import { Vec2 } from "../math/vectors";
import { Polygon2D } from "./Polygon2D";

export type Ring2 = Vec2[];
export type Poly2 = Ring2[];
export type MultiPoly2 = Poly2[];

// ── polygon-clipping geometry (plain [x,y] pairs) ──
type PCPair = [number, number];
type PCRing = PCPair[];
type PCPolygon = PCRing[];
type PCMultiPolygon = PCPolygon[];

// Snap input coordinates to a fine grid before clipping. polygon-clipping is a
// floating-point sweepline; vertices that are meant to coincide but differ by a
// float epsilon spawn huge numbers of near-degenerate intersection events, which
// can make a union/difference take *minutes* (or throw). Snapping collapses those
// to identical points. 1e-3 is far below any real feature size, so geometry is
// visually unchanged. Override per call site via {@link setClipSnap} if needed.
let SNAP = 1e-3;

/** Set the coordinate snap grid used before boolean ops (mm). 0 disables it. */
export function setClipSnap(grid: number): void {
  SNAP = grid > 0 ? grid : 0;
}

function snap(n: number): number {
  return SNAP > 0 ? Math.round(n / SNAP) * SNAP : n;
}

function ringToPC(ring: Ring2): PCRing {
  return ring.map((v) => [snap(v.x), snap(v.y)] as PCPair);
}

function multiToPC(mp: MultiPoly2): PCMultiPolygon {
  return mp.map((poly) => poly.map(ringToPC));
}

function pcRingToRing(r: PCRing): Ring2 {
  const pts = r.map(([x, y]) => new Vec2(x, y));
  // polygon-clipping closes its rings (last == first); drop the duplicate so we
  // stay in tekto's open-ring convention.
  if (pts.length > 1) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (a.x === b.x && a.y === b.y) pts.pop();
  }
  return pts;
}

function pcToMulti(geom: PCMultiPolygon): MultiPoly2 {
  return geom.map((poly) => poly.map(pcRingToRing));
}

export const PolygonBool = {

  // ── construction / inspection ──

  /** Wrap a single solid ring as a multipolygon. */
  fromRing(ring: Ring2): MultiPoly2 {
    return [[ring]];
  },

  /** Flatten every ring (outer + holes, all polygons) — handy for drawing. */
  rings(mp: MultiPoly2): Ring2[] {
    const out: Ring2[] = [];
    for (const poly of mp) for (const ring of poly) out.push(ring);
    return out;
  },

  /** True when the multipolygon encloses no area. */
  isEmpty(mp: MultiPoly2): boolean {
    return mp.length === 0 || mp.every((poly) => poly.length === 0);
  },

  /**
   * Total enclosed area (outer rings minus holes). Always non-negative; relies
   * on polygon-clipping's CCW-outer / CW-hole output, but uses absolute ring
   * areas so it is also correct for hand-built input with consistent winding.
   */
  area(mp: MultiPoly2): number {
    let total = 0;
    for (const poly of mp) {
      poly.forEach((ring, i) => {
        const a = Math.abs(Polygon2D.signedArea(ring));
        total += i === 0 ? a : -a; // first ring is the outer boundary
      });
    }
    return total;
  },

  // ── boolean ops ──

  /** Union of one or more multipolygons. */
  union(...mps: MultiPoly2[]): MultiPoly2 {
    const nonEmpty = mps.filter((m) => !PolygonBool.isEmpty(m));
    if (nonEmpty.length === 0) return [];
    const [first, ...rest] = nonEmpty.map(multiToPC);
    return pcToMulti(polygonClipping.union(first, ...rest));
  },

  /** `subject` minus every `clip`. */
  difference(subject: MultiPoly2, ...clips: MultiPoly2[]): MultiPoly2 {
    if (PolygonBool.isEmpty(subject)) return [];
    const clipsNonEmpty = clips.filter((m) => !PolygonBool.isEmpty(m));
    if (clipsNonEmpty.length === 0) return PolygonBool.union(subject);
    return pcToMulti(
      polygonClipping.difference(multiToPC(subject), ...clipsNonEmpty.map(multiToPC)),
    );
  },

  /** Intersection of two or more multipolygons. */
  intersection(...mps: MultiPoly2[]): MultiPoly2 {
    if (mps.length === 0 || mps.some((m) => PolygonBool.isEmpty(m))) return [];
    const [first, ...rest] = mps.map(multiToPC);
    return pcToMulti(polygonClipping.intersection(first, ...rest));
  },
};
