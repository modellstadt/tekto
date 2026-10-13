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
//   • Openings  each `slab.openings[]` gets a trimmer along both long
//                sides (in place of the joists there) and a header across
//                both ends; the joists in between stop at the headers. The
//                sheathing and ceiling leave the opening out.
//
// Currently NOT modelled (clear extension points):
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
import { Slab } from "./types";
import type {
  SlabConstruction, SlabPart, SlabContext, PartProfile,
} from "./types";
import { lineClipPolygon, joistDirectionFromBounds } from "./orientation";

// ─── Options ─────────────────────────────────────────────────────────

/** Options for `JoistedSlab`: joist profile, spacing and material, the rim joist, edge and bearing offsets, and the sheathing and ceiling layers (metres; defaults KVH 60×220 @ 0.625, 22 mm OSB, 12.5 mm ceiling). */
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

    // A point at `t` along the joists and `p` across them, and a member between two of them.
    const at = (t: number, p: number) => new Vec2(direction.x * t + perp.x * p, direction.y * t + perp.y * p);
    const member = (name: string, role: string, a: Vec2, b: Vec2) => {
      const length = a.distTo(b);
      if (length < 0.01) return;
      const ribbon = new ExtrudedRibbon({ centerline: [a, b], width: opts.profile.w, height: opts.profile.h, baseZ: joistBottomZ });
      parts.push({ name, role, mesh: ribbon.toMesh(), material: opts.material, profile: opts.profile, length, ifcType: "IfcMember" });
    };
    /** Where a line of joists at `p` meets the inside of the rim, as [tMin, tMax] along it. */
    const span = (p: number): [number, number] | null => {
      const hits = lineClipPolygon(at(0, p), direction, regularJoistClipBoundary);
      return hits.length < 2 ? null : [hits[0], hits[hits.length - 1]];
    };

    // ── Openings: their extent along (t) and across (p) the joists; a trimmer stands beside
    //    each long side, a header across each end between the trimmers ──
    const w = opts.profile.w;
    const wells = slab.openingRings(direction).map((ring) => {
      const ts = ring.map((q) => q.dot(direction)), ps = ring.map((q) => q.dot(perp));
      return { t0: Math.min(...ts), t1: Math.max(...ts), p0: Math.min(...ps), p1: Math.max(...ps) };
    });
    const trimmerPs = wells.flatMap((o) => [o.p0 - w / 2, o.p1 + w / 2]);

    // ── Place joists with `edgeOffset` from the inside face on each side ──
    const startP = minP + edgeOffset;
    const endP   = maxP - edgeOffset;
    let joistIdx = 0;
    for (let p = startP; p <= endP + 1e-6; p += opts.spacing) {
      if (trimmerPs.some((tp) => Math.abs(p - tp) < w)) continue;      // a trimmer stands here
      const range = span(p);
      if (!range) continue;
      // A joist through an opening stops at its headers: the pieces either side are tail joists.
      let pieces: [number, number][] = [range];
      for (const o of wells) {
        if (p <= o.p0 - w / 2 || p >= o.p1 + w / 2) continue;
        const cut0 = o.t0 - w - bearingGap, cut1 = o.t1 + w + bearingGap;
        pieces = pieces.flatMap(([a, b]): [number, number][] =>
          cut1 <= a || cut0 >= b ? [[a, b]] : [[a, Math.min(b, cut0)], [Math.max(a, cut1), b]]);
      }
      for (const [a, b] of pieces) member(`Joist ${++joistIdx}`, "joist", at(a, p), at(b, p));
    }
    wells.forEach((o, i) => {
      const n = wells.length > 1 ? ` ${i + 1}` : "";
      for (const [k, p] of [o.p0 - w / 2, o.p1 + w / 2].entries()) {
        const range = span(p);
        if (range) member(`Trimmer${n}${k ? "b" : "a"}`, "trimmer", at(range[0], p), at(range[1], p));
      }
      // Headers hang between the trimmers' inner faces, with the bearing gap at each end.
      for (const [k, t] of [o.t0 - w / 2, o.t1 + w / 2].entries()) {
        member(`Header${n}${k ? "b" : "a"}`, "header", at(t, o.p0 + bearingGap), at(t, o.p1 - bearingGap));
      }
    });

    // ── Sheathing (full slab area, one thin plate above the joists) ──
    if (opts.sheathingThickness > 1e-6) {
      const sheathingSlab = makeFlatPlate(slab, direction, slab.elevation - opts.sheathingThickness, opts.sheathingThickness);
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
      const ceilingMesh = makeFlatPlate(slab, direction, ceilingZ, opts.ceilingThickness);
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
 * A thin flat plate over the slab's footprint, `thickness` up from `baseZ`, with the slab's
 * openings left out (aligned with the joists). Used for the sheathing and ceiling layers.
 */
function makeFlatPlate(slab: Slab, direction: Vec2, baseZ: number, thickness: number): Mesh {
  return new Slab({
    boundary: slab.boundary, thickness, elevation: baseZ + thickness,
    openings: slab.openings, joistDirection: direction,
  }).toMesh();
}
