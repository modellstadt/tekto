// ====================================================================
// BIM / Spaces — rooms as bounded volumes (IfcSpace)
// ====================================================================
//
// A `Space` is a room: a horizontal boundary polygon, a floor elevation,
// and a clear height, plus a *function* (Bedroom / Kitchen / Circulation …)
// and an open property set.
//
//   ✓ FUNCTION       — free-form `function` string → `IfcSpace.LongName`,
//                      the human-readable room use. (PredefinedType stays
//                      INTERNAL; classification codes can ride in `properties`.)
//   ✓ PROPERTY SETS  — open `properties` map → `Pset_SpaceCommon`
//                      (e.g. `GrossPlannedArea`, `IsExternal`, `NetPlannedArea`).
//
// Geometry is the simplest useful thing: the boundary extruded up by
// `height`. Richer `IfcRelSpaceBoundary` links to the surrounding walls
// are a later increment — a space-as-volume already supports area
// take-off, room schedules, and function tagging.

import { Vec2 } from "../core/math/vectors";
import type { PropertyMap } from "./walls/types";
import type { Wall } from "../core/geometry/walls";

export interface SpaceOptions {
  name: string;
  /** Boundary polygon in the XY ground plane (CCW), in metres. */
  boundary: Vec2[];
  /** Floor level (world Z). Default 0. */
  elevation?: number;
  /** Clear room height. Default 2.7 m. */
  height?: number;
  /** Room use, e.g. "Bedroom", "Kitchen", "Circulation". → IfcSpace.LongName. */
  function?: string;
  /** Open Pset map → Pset_SpaceCommon (+ any custom keys). */
  properties?: PropertyMap;
}

/**
 * A room — the IFC `IfcSpace` analogue. Aggregated under its building
 * storey at export (via `IfcRelAggregates`, the correct spatial-decomposition
 * relationship for spaces — not `IfcRelContainedInSpatialStructure`).
 */
export class Space {
  name: string;
  boundary: Vec2[];
  elevation: number;
  height: number;
  function?: string;
  properties: PropertyMap;

  constructor(opts: SpaceOptions) {
    if (opts.boundary.length < 3) {
      throw new Error("Space: boundary needs ≥ 3 points");
    }
    this.name = opts.name;
    this.boundary = opts.boundary;
    this.elevation = opts.elevation ?? 0;
    this.height = opts.height ?? 2.7;
    this.function = opts.function;
    this.properties = opts.properties ?? {};
  }

  /** Floor area of the boundary polygon (shoelace formula), in m². */
  area(): number {
    const b = this.boundary;
    let a = 0;
    for (let i = 0, n = b.length; i < n; i++) {
      const p = b[i];
      const q = b[(i + 1) % n];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) * 0.5;
  }

  /** Approximate room volume (floor area × clear height), in m³. */
  volume(): number {
    return this.area() * this.height;
  }
}

// ─── Space boundaries (which walls bound a room) ───────────────────

/**
 * Find which walls bound a space: a wall whose centerline runs along one of
 * the space's boundary edges (approximately collinear, and overlapping in
 * projection). Pass the result to `IfcWriter.addSpace(space, { boundaries })`
 * to emit `IfcRelSpaceBoundary` relations.
 *
 * @param tol  Max perpendicular distance from the edge line to accept a wall
 *             (≈ how far a wall centerline may sit off the room outline).
 */
export function boundingWalls(space: Space, walls: Wall[], tol = 0.35): Wall[] {
  const ring = space.boundary;
  const n = ring.length;
  const out: Wall[] = [];
  for (const wall of walls) {
    const cl = wall.centerline;
    let bounds = false;
    for (let e = 0; e < n && !bounds; e++) {
      const a = ring[e];
      const b = ring[(e + 1) % n];
      for (let s = 0; s < cl.length - 1 && !bounds; s++) {
        if (segmentAlongEdge(cl[s], cl[s + 1], a, b, tol)) bounds = true;
      }
    }
    if (bounds) out.push(wall);
  }
  return out;
}

/** True if segment c→d runs along edge a→b (collinear within `tol`, parallel, overlapping). */
function segmentAlongEdge(c: Vec2, d: Vec2, a: Vec2, b: Vec2, tol: number): boolean {
  const ex = b.x - a.x, ey = b.y - a.y;
  const elen = Math.hypot(ex, ey);
  if (elen < 1e-9) return false;
  const ux = ex / elen, uy = ey / elen;
  // Perpendicular distance of c, d from the infinite edge line.
  const perp = (px: number, py: number) => Math.abs((px - a.x) * -uy + (py - a.y) * ux);
  if (perp(c.x, c.y) > tol || perp(d.x, d.y) > tol) return false;
  // Parallel within ~8°.
  const wx = d.x - c.x, wy = d.y - c.y;
  const wlen = Math.hypot(wx, wy);
  if (wlen < 1e-9) return false;
  if (Math.abs((wx * ux + wy * uy) / wlen) < 0.99) return false;
  // Projection overlap onto the edge parameter [0, elen].
  const tc = (c.x - a.x) * ux + (c.y - a.y) * uy;
  const td = (d.x - a.x) * ux + (d.y - a.y) * uy;
  const lo = Math.max(0, Math.min(tc, td));
  const hi = Math.min(elen, Math.max(tc, td));
  return hi - lo > 0.1; // ≥ 10 cm shared run
}
