/**
 * Tekto NoFitPolygon — Minkowski sums, No-Fit Polygons (NFP), and Inner-Fit
 * regions for 2D nesting / packing.
 *
 * The NFP of B about A is the locus of B's reference point (the origin of B's
 * local frame) at which B *touches* A without overlapping it:
 *
 *     interior(NFP) ⇔ B overlaps A   (forbidden)
 *     boundary(NFP) ⇔ B touches A     (the tightest legal placements)
 *     exterior(NFP) ⇔ B disjoint A    (loose)
 *
 * and is computed as the Minkowski sum  NFP(A, B) = A ⊕ (−B).
 *
 * Concave shapes are handled the robust way: decompose A and B into convex
 * pieces, Minkowski-sum every pair (a convex sum is just the convex hull of the
 * pairwise vertex sums), then union the lot — which naturally produces the
 * interior holes a concave NFP can have (e.g. B trapped in a pocket of A).
 *
 * Depends on tekto's own {@link Polygon2D.convexHull2D} and {@link PolygonBool};
 * the only external piece is `poly-decomp` for the convex decomposition.
 */

import { makeCCW, quickDecomp, removeCollinearPoints } from "poly-decomp";

import { Vec2 } from "../math/vectors";
import { Polygon2D } from "./Polygon2D";
import { PolygonBool, type Ring2, type MultiPoly2 } from "./PolygonBool";

export const NoFitPolygon = {

  /** Reflect a ring through the origin (negate every vertex) — forms −B. */
  reflect(ring: Ring2): Ring2 {
    return ring.map((v) => new Vec2(-v.x, -v.y));
  },

  /**
   * Decompose a simple polygon into convex pieces (poly-decomp quickDecomp).
   * Input may have any winding; pieces come back CCW. Triangles and convex
   * inputs pass through as a single piece.
   */
  decomposeConvex(ring: Ring2): Ring2[] {
    if (ring.length <= 3) return [ring.slice()];
    const pts = ring.map((v) => [v.x, v.y] as [number, number]);
    removeCollinearPoints(pts, 0.01);
    if (pts.length <= 3) return [pts.map(([x, y]) => new Vec2(x, y))];
    makeCCW(pts);
    const pieces = quickDecomp(pts);
    return pieces.map((piece) => piece.map(([x, y]) => new Vec2(x, y)));
  },

  /**
   * Minkowski sum of two *convex* rings = convex hull of all pairwise vertex
   * sums. O(|a|·|b|) but the inputs are small convex pieces.
   */
  minkowskiSumConvex(a: Ring2, b: Ring2): Ring2 {
    const pts: Vec2[] = [];
    for (const pa of a) for (const pb of b) pts.push(pa.add(pb));
    return Polygon2D.convexHull2D(pts);
  },

  /**
   * Minkowski sum of two arbitrary simple polygons. Decomposes both into convex
   * pieces, sums every pair, and unions the results (may produce holes).
   */
  minkowskiSum(a: Ring2, b: Ring2): MultiPoly2 {
    const ca = NoFitPolygon.decomposeConvex(a);
    const cb = NoFitPolygon.decomposeConvex(b);
    const parts: MultiPoly2[] = [];
    for (const pa of ca) {
      for (const pb of cb) {
        const sum = NoFitPolygon.minkowskiSumConvex(pa, pb);
        if (sum.length >= 3) parts.push(PolygonBool.fromRing(sum));
      }
    }
    return PolygonBool.union(...parts);
  },

  /**
   * No-Fit Polygon of `orbiting` about `fixed`: NFP = fixed ⊕ (−orbiting).
   * Both polygons are given in absolute coordinates; the result is the locus of
   * `orbiting`'s reference point (its frame origin) for touching placements on
   * the boundary, overlapping placements in the interior.
   */
  nfp(fixed: Ring2, orbiting: Ring2): MultiPoly2 {
    return NoFitPolygon.minkowskiSum(fixed, NoFitPolygon.reflect(orbiting));
  },

  /**
   * Inner-Fit region: the locus of `orbiting`'s reference point such that
   * `orbiting` stays fully inside `container`.
   *
   * Computed as ∩ over vertices v of conv(orbiting) of (container − v). This is
   * exact for convex or rectangular containers (the common surface case) and a
   * mild over-approximation for concave containers.
   */
  innerFit(container: Ring2, orbiting: Ring2): MultiPoly2 {
    const hull = Polygon2D.convexHull2D(orbiting);
    if (hull.length === 0) return [];
    let acc: MultiPoly2 | null = null;
    for (const v of hull) {
      const shifted = PolygonBool.fromRing(container.map((c) => new Vec2(c.x - v.x, c.y - v.y)));
      acc = acc === null ? shifted : PolygonBool.intersection(acc, shifted);
      if (PolygonBool.isEmpty(acc)) return [];
    }
    return acc ?? [];
  },
};
