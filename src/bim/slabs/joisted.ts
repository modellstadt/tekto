// ====================================================================
// BIM / Slabs / Joisted — timber-joist + rim + sheathing construction
// ====================================================================
//
// Decomposes a slab into:
//
//   • Rim joist    one closed ribbon running the slab perimeter (the
//                  "Randträger" / "ring beam"). Receives the regular
//                  joists' end loads and ties the slab together.
//   • Joists       at `spacing`, clipped to the INSIDE face of the rim
//                  so each end is perpendicular to its own axis (no
//                  slanted cuts even when joists hit the boundary
//                  obliquely).
//   • Sheathing    a single thin plate covering the slab from above
//                  (OSB / plywood structural deck).
//   • Ceiling      a single thin plate below the joists (gypsum etc.).
//
// Currently NOT modelled (clear extension points):
//   • Joist headers / trimmers around `slab.openings` (TODO comment in
//     the construction body marks where they go).
//   • Cantilever overhangs (joists extending past the slab boundary).
//   • Crown / camber direction.
//
// At IFC export each member becomes `IfcMember` (joists, headers,
// blocking) or `IfcPlate` / `IfcCovering` (sheathing, ceiling),
// aggregated under the parent `IfcSlab` via `IfcRelAggregates`.

import { Vec2 } from "../../core/math/vectors";
import {
  ExtrudedRibbon,
} from "../../core/geometry/ExtrudedRibbon";
import { Polygon2D } from "../../core/geometry/Polygon2D";
import type {
  SlabConstruction, SlabPart, SlabContext, Slab, PartProfile,
} from "./types";
import { lineClipPolygon, joistDirectionFromBounds } from "./orientation";

// ─── Options ─────────────────────────────────────────────────────────

export interface JoistedSlabOptions {
  /** Joist cross-section. Default: KVH 60×220 (typical timber-joist size). */
  profile?: PartProfile;
  /** Joist spacing between centerlines (m). Default: 0.625. */
  spacing?: number;
  /** Material name for joists. Default: `"KVH C24"`. */
  material?: string;
  /**
   * Include a rim joist around the slab perimeter ("Randträger"). When
   * true (default), regular joists are clipped to the rim's inside face
   * so their end faces are perpendicular to their own axis. Set `false`
   * to revert to the unframed behaviour.
   */
  rim?: boolean;
  /** Rim joist cross-section. Default: same as regular joist. */
  rimProfile?: PartProfile;
  /**
   * Distance from the inside face of the rim (or slab boundary, if no rim)
   * to the first / last regular joist's centerline. Larger values give
   * more room between rim and first joist; the canonical value is
   * `spacing` (so the rim-to-first bay matches the inter-joist bay) or
   * `spacing/2` (uniform half-bay at each edge). Default: `spacing/2`.
   */
  edgeOffset?: number;
  /**
   * Gap between a regular joist's end and the rim joist's inside face,
   * in metres. Models the bearing pocket / Balkenschuh (joist hanger)
   * clearance. Set to 0 if you want joists to butt flush. Default: 0.01.
   */
  bearingGap?: number;
  /** Thickness of the structural sheathing layer (m). 0 → no sheathing. Default: 0.022 (22 mm OSB). */
  sheathingThickness?: number;
  /** Material name for sheathing. Default: `"OSB"`. */
  sheathingMaterial?: string;
  /** Thickness of the ceiling layer (m). 0 → no ceiling. Default: 0.0125. */
  ceilingThickness?: number;
  /** Material name for the ceiling layer. Default: `"Gipsfaser"`. */
  ceilingMaterial?: string;
}

const DEFAULTS: Required<JoistedSlabOptions> = {
  profile:            { w: 0.060, h: 0.220, name: "KVH 60×220" },
  spacing:            0.625,
  material:           "KVH C24",
  rim:                true,
  rimProfile:         { w: 0.060, h: 0.220, name: "KVH 60×220 (rim)" },
  edgeOffset:         -1,        // sentinel — resolved per-call to `spacing/2`
  bearingGap:         0.010,
  sheathingThickness: 0.022,
  sheathingMaterial:  "OSB",
  ceilingThickness:   0.0125,
  ceilingMaterial:    "Gipsfaser",
};

// ─── Construction factory ───────────────────────────────────────────

/**
 * Joisted-slab construction factory.
 *
 * Determines joist direction in this order:
 *   1. `slab.joistDirection` (explicit user override)
 *   2. `ctx.joistDirection`  (passed in via `realizeSlab` / `SlabSystem`)
 *   3. {@link joistDirectionFromBounds} (bounding-box fallback)
 *
 * @example
 * const FloorType = new SlabType({
 *   name: "Timber joist floor @ 625 mm",
 *   construction: JoistedSlab({ spacing: 0.625, profile: { w: 0.06, h: 0.22 } }),
 *   properties: { loadBearing: true },
 * });
 */
export function JoistedSlab(options: JoistedSlabOptions = {}): SlabConstruction {
  const opts = { ...DEFAULTS, ...options };

  return (slab: Slab, ctx?: SlabContext): SlabPart[] => {
    const direction = slab.joistDirection
      ?? ctx?.joistDirection
      ?? joistDirectionFromBounds(slab.boundary);
    const perp = new Vec2(-direction.y, direction.x);

    const parts: SlabPart[] = [];

    // ── Joist Z bounds ──
    // Joists sit immediately below the sheathing layer (top of joist =
    // slab.elevation − sheathingThickness). Their depth is profile.h.
    const joistTopZ    = slab.elevation - opts.sheathingThickness;
    const joistBottomZ = joistTopZ - opts.profile.h;

    // ── Rim joist (Randträger) running the perimeter ──
    const closingRing = ensureClosedRing(slab.boundary);
    const rimW = opts.rim ? opts.rimProfile.w : 0;
    const bearingGap = Math.max(0, opts.bearingGap);
    const edgeOffset = opts.edgeOffset >= 0 ? opts.edgeOffset : opts.spacing * 0.5;

    let regularJoistClipBoundary = closingRing;
    if (opts.rim) {
      // Rim centerline = boundary offset INWARD by rimW/2 so the rim's
      // OUTER face sits on the slab boundary. Polygon2D.offset: negative
      // distance for inward.
      const rimCenterline = ensureClosedRing(Polygon2D.offset(stripClose(closingRing), -rimW * 0.5));
      const rimRibbon = new ExtrudedRibbon({
        centerline: rimCenterline,
        width:  rimW,
        height: opts.rimProfile.h,
        baseZ:  joistBottomZ,
      });
      parts.push({
        name:     "Rim joist",
        role:     "beam",
        mesh:     rimRibbon.toMesh(),
        material: opts.material,
        profile:  opts.rimProfile,
        length:   ringPerimeter(rimCenterline),
        ifcType:  "IfcMember",
      });
      // Regular joists are clipped to the rim INSIDE face + `bearingGap`
      // (so the joist end face stops just short of the rim — leaving room
      // for a Balkenschuh / hanger / notch).
      regularJoistClipBoundary = ensureClosedRing(
        Polygon2D.offset(stripClose(closingRing), -(rimW + bearingGap)),
      );
    } else if (bearingGap > 1e-9) {
      // No rim, but still inset by the bearing gap so joists don't sit
      // hard against the slab edge.
      regularJoistClipBoundary = ensureClosedRing(
        Polygon2D.offset(stripClose(closingRing), -bearingGap),
      );
    }

    // ── Joist range: project the (possibly inner) boundary onto perp ──
    let minP = Infinity, maxP = -Infinity;
    for (const p of regularJoistClipBoundary) {
      const proj = p.x * perp.x + p.y * perp.y;
      if (proj < minP) minP = proj;
      if (proj > maxP) maxP = proj;
    }

    // ── Place joists with `edgeOffset` from the inside face on each side ──
    const startP = minP + edgeOffset;
    const endP   = maxP - edgeOffset;
    let joistIdx = 0;
    for (let p = startP; p <= endP + 1e-6; p += opts.spacing) {
      const origin = new Vec2(perp.x * p, perp.y * p);
      const hits = lineClipPolygon(origin, direction, regularJoistClipBoundary);
      if (hits.length < 2) continue;
      const tMin = hits[0];
      const tMax = hits[hits.length - 1];

      const startPt = new Vec2(origin.x + direction.x * tMin, origin.y + direction.y * tMin);
      const endPt   = new Vec2(origin.x + direction.x * tMax, origin.y + direction.y * tMax);
      const length  = startPt.distTo(endPt);
      if (length < 0.01) continue;

      const ribbon = new ExtrudedRibbon({
        centerline: [startPt, endPt],
        width:  opts.profile.w,
        height: opts.profile.h,
        baseZ:  joistBottomZ,
      });
      parts.push({
        name:     `Joist ${++joistIdx}`,
        role:     "joist",
        mesh:     ribbon.toMesh(),
        material: opts.material,
        profile:  opts.profile,
        length,
        ifcType:  "IfcMember",
      });
    }

    // TODO: openings — add headers + trimmers around each `slab.openings[]`.
    //   For each opening, replace the joists crossing it with full joists
    //   that stop at the opening's near edge, plus two trimmers (joists
    //   along the opening's parallel edges) and a header (joist
    //   perpendicular to the joist run, spanning between trimmers).

    // ── Sheathing (full slab area, one thin plate above the joists) ──
    if (opts.sheathingThickness > 1e-6) {
      const sheathingSlab = makeFlatPlate(
        slab.boundary,
        slab.elevation - opts.sheathingThickness,
        opts.sheathingThickness,
      );
      parts.push({
        name:     "Sheathing",
        role:     "sheathing",
        mesh:     sheathingSlab,
        material: opts.sheathingMaterial,
        ifcType:  "IfcPlate",
      });
    }

    // ── Ceiling (full slab area, one thin plate below the joists) ──
    if (opts.ceilingThickness > 1e-6) {
      const ceilingZ = joistBottomZ - opts.ceilingThickness;
      const ceilingMesh = makeFlatPlate(slab.boundary, ceilingZ, opts.ceilingThickness);
      parts.push({
        name:     "Ceiling",
        role:     "ceiling",
        mesh:     ceilingMesh,
        material: opts.ceilingMaterial,
        ifcType:  "IfcCovering",
      });
    }

    return parts;
  };
}

// ─── Helpers: closed-ring utilities ─────────────────────────────────

/** Return `polygon` with the closing duplicate vertex stripped (open ring). */
function stripClose(polygon: Vec2[]): Vec2[] {
  return Polygon2D.openRing(polygon);
}

/** Return `polygon` with a closing duplicate vertex (closed ring). */
function ensureClosedRing(polygon: Vec2[]): Vec2[] {
  return Polygon2D.closeRing(polygon);
}

function ringPerimeter(closedRing: Vec2[]): number {
  return Polygon2D.polylineLength(closedRing);
}

// ─── Helper: thin extruded plate from a 2D polygon ──────────────────

import { Mesh } from "../../core/geometry/mesh/Mesh";

/**
 * Build a thin flat plate by extruding `boundary` upward by `thickness`
 * starting at `baseZ`. Used for the sheathing / ceiling / topping layers.
 */
function makeFlatPlate(boundary: Vec2[], baseZ: number, thickness: number): Mesh {
  const ring = Polygon2D.openRing(boundary);
  const n = ring.length;
  if (n < 3) return new Mesh(new Float32Array(), new Uint32Array(), new Float32Array());

  const positions: number[] = [];
  const normals:   number[] = [];
  const indices:   number[] = [];
  const tris = Polygon2D.triangulate2D(ring);

  const topBase = positions.length / 3;
  for (const p of ring) { positions.push(p.x, p.y, baseZ + thickness); normals.push(0, 0, 1); }
  for (const [a, b, c] of tris) indices.push(topBase + a, topBase + b, topBase + c);

  const botBase = positions.length / 3;
  for (const p of ring) { positions.push(p.x, p.y, baseZ); normals.push(0, 0, -1); }
  for (const [a, b, c] of tris) indices.push(botBase + c, botBase + b, botBase + a);

  for (let i = 0; i < n; i++) {
    const p0 = ring[i];
    const p1 = ring[(i + 1) % n];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const nx = dy / len, ny = -dx / len;
    const base = positions.length / 3;
    positions.push(p0.x, p0.y, baseZ, p1.x, p1.y, baseZ, p1.x, p1.y, baseZ + thickness, p0.x, p0.y, baseZ + thickness);
    for (let k = 0; k < 4; k++) normals.push(nx, ny, 0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  return new Mesh(new Float32Array(positions), new Uint32Array(indices), new Float32Array(normals));
}
