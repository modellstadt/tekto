// ====================================================================
// BIM / Slabs / Orientation — joist-direction helpers
// ====================================================================
//
// Two strategies for choosing joist direction when the user hasn't
// pinned it explicitly on the slab:
//
//   1. Bounding-box heuristic — joists span the SHORT dimension of the
//      slab's bounding box. Works for ~80% of cases. Cheap.
//   2. Support-driven — joists span perpendicular to the parallel pair
//      of supporting walls with the smallest gap. Architecturally
//      honest; respects intermediate supports. Requires the wall list.
//
// `chooseJoistDirection(slab, opts)` is the public entry point — picks
// method 2 when `supports` is available, falls back to method 1
// otherwise.

import { Vec2 } from "../../core/math/vectors";
import type { Wall } from "../../core/geometry/walls";
import type { Slab } from "./types";

/** Strategy options for `chooseJoistDirection`. */
export interface JoistOrientationOptions {
  /** Walls that support the slab. When provided, method 2 is used. */
  supports?: Wall[];
  /**
   * Maximum angle (radians) between two walls to consider them parallel
   * for grouping in method 2. Default: 5°.
   */
  angleTolerance?: number;
  /** Force a particular method. Default: auto. */
  method?: "bbox" | "supports" | "auto";
}

/**
 * Pick a joist direction for a slab. Returns a unit Vec2 indicating the
 * direction joists should run.
 *
 * If `opts.supports` is provided and not empty, uses the support-driven
 * method (#2). Otherwise falls back to the bounding-box heuristic (#1).
 *
 * @example
 *   const dir = chooseJoistDirection(slab, { supports: room.walls });
 */
export function chooseJoistDirection(slab: Slab, opts: JoistOrientationOptions = {}): Vec2 {
  const method = opts.method ?? "auto";
  if ((method === "auto" || method === "supports") && opts.supports && opts.supports.length >= 2) {
    const fromSupports = joistDirectionFromSupports(slab, opts.supports, opts.angleTolerance);
    if (fromSupports) return fromSupports;
  }
  return joistDirectionFromBounds(slab.boundary);
}

// ─── Method 1: bounding-box heuristic ───────────────────────────────

/**
 * Method 1 — joists span the SHORTER dimension of the slab's
 * axis-aligned bounding box. Returns one of `(1, 0)` or `(0, 1)`.
 *
 * For tilted slabs use {@link joistDirectionFromPCA} instead.
 */
export function joistDirectionFromBounds(boundary: Vec2[]): Vec2 {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of boundary) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = maxX - minX;
  const dy = maxY - minY;
  // Joists run perpendicular to the longer side → along the shorter axis.
  return dx > dy ? new Vec2(0, 1) : new Vec2(1, 0);
}

/**
 * Method 1 variant — PCA-based: returns the unit vector along the
 * shorter principal axis of the boundary point cloud. Better than the
 * AABB heuristic for tilted/rotated slabs.
 */
export function joistDirectionFromPCA(boundary: Vec2[]): Vec2 {
  if (boundary.length < 3) return new Vec2(1, 0);
  let cx = 0, cy = 0;
  for (const p of boundary) { cx += p.x; cy += p.y; }
  cx /= boundary.length; cy /= boundary.length;

  let sxx = 0, sxy = 0, syy = 0;
  for (const p of boundary) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  sxx /= boundary.length;
  sxy /= boundary.length;
  syy /= boundary.length;

  // Eigenvalues of the 2×2 covariance matrix.
  const trace = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, (trace * trace) * 0.25 - det));
  const lamMajor = trace * 0.5 + disc;

  // Major-axis eigenvector.
  let mx: number, my: number;
  if (Math.abs(sxy) > 1e-12) {
    mx = lamMajor - syy;
    my = sxy;
  } else {
    mx = sxx >= syy ? 1 : 0;
    my = sxx >= syy ? 0 : 1;
  }
  const len = Math.hypot(mx, my);
  if (len < 1e-12) return new Vec2(1, 0);
  // Joists run along the MINOR axis (perpendicular to major).
  return new Vec2(-my / len, mx / len);
}

// ─── Method 2: support-driven ───────────────────────────────────────

/**
 * Method 2 — joists run perpendicular to the parallel pair of supports
 * with the smallest gap (≈ shortest joist span). Returns `null` when no
 * pair of parallel supporting walls is found (caller should fall back).
 *
 * Walls are grouped by their tangent direction within `angleTol` radians;
 * for each group with ≥ 2 members, the perpendicular spread of the wall
 * centerlines is the candidate joist span; the smallest-spread group
 * wins.
 */
export function joistDirectionFromSupports(
  _slab: Slab, supports: Wall[], angleTol = 5 * Math.PI / 180,
): Vec2 | null {
  if (supports.length < 2) return null;

  // Group supports by tangent angle (treat +d and −d as parallel — modulo π).
  const groups: { angle: number; tangent: Vec2; walls: Wall[] }[] = [];
  for (const w of supports) {
    const cl = w.centerline;
    if (cl.length < 2) continue;
    const dx = cl[cl.length - 1].x - cl[0].x;
    const dy = cl[cl.length - 1].y - cl[0].y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const tx = dx / len, ty = dy / len;
    let angle = Math.atan2(ty, tx);
    // Fold into [0, π) so parallel walls in opposite directions merge.
    if (angle < 0) angle += Math.PI;
    if (angle >= Math.PI) angle -= Math.PI;

    let merged = false;
    for (const g of groups) {
      const dAng = Math.abs(angle - g.angle);
      const wrap = Math.min(dAng, Math.PI - dAng);
      if (wrap < angleTol) {
        g.walls.push(w);
        merged = true;
        break;
      }
    }
    if (!merged) groups.push({ angle, tangent: new Vec2(tx, ty), walls: [w] });
  }

  // For each group, compute the perpendicular spread of wall midpoints —
  // that is the candidate joist span if joists run perpendicular to the group.
  let best: { tangent: Vec2; span: number } | null = null;
  for (const g of groups) {
    if (g.walls.length < 2) continue;
    const perp = new Vec2(-g.tangent.y, g.tangent.x);
    let minP = Infinity, maxP = -Infinity;
    for (const w of g.walls) {
      const cl = w.centerline;
      const midX = (cl[0].x + cl[cl.length - 1].x) * 0.5;
      const midY = (cl[0].y + cl[cl.length - 1].y) * 0.5;
      const proj = midX * perp.x + midY * perp.y;
      if (proj < minP) minP = proj;
      if (proj > maxP) maxP = proj;
    }
    const span = maxP - minP;
    if (!best || span < best.span) best = { tangent: g.tangent, span };
  }
  if (!best) return null;
  // Joists run PERPENDICULAR to the support group's tangent.
  return new Vec2(-best.tangent.y, best.tangent.x);
}

// ─── Polygon-line clip (used by joist placement) ────────────────────

/**
 * Intersect an infinite 2D line `origin + t · direction` with a closed
 * polygon's edges. Returns the *sorted* list of `t` parameters where
 * intersections occur. For convex polygons this is exactly 0 or 2 hits;
 * for non-convex polygons it may be more.
 *
 * Used by `JoistedSlab` to clip joist segments to the slab outline.
 */
export function lineClipPolygon(
  origin: Vec2, direction: Vec2, boundary: Vec2[],
): number[] {
  const hits: number[] = [];
  const dx = direction.x, dy = direction.y;
  for (let i = 0; i < boundary.length - 1; i++) {
    const a = boundary[i];
    const b = boundary[i + 1];
    const ex = b.x - a.x, ey = b.y - a.y;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) continue; // parallel
    const s = ((a.x - origin.x) * ey - (a.y - origin.y) * ex) / denom;
    const u = ((a.x - origin.x) * dy - (a.y - origin.y) * dx) / denom;
    if (u < -1e-9 || u > 1 + 1e-9) continue; // outside this edge
    hits.push(s);
  }
  hits.sort((a, b) => a - b);
  // Deduplicate near-equal hits (corner cases where the line passes
  // exactly through a vertex would otherwise produce a double hit).
  const dedup: number[] = [];
  for (const h of hits) {
    if (dedup.length === 0 || Math.abs(dedup[dedup.length - 1] - h) > 1e-6) {
      dedup.push(h);
    }
  }
  return dedup;
}
