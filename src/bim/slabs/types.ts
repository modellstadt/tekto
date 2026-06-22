// ====================================================================
// BIM / Slabs — Type-Instance + Layers + Aggregated Parts + Psets
// ====================================================================
//
// Mirror of `src/bim/walls/types.ts` adapted to horizontal elements
// (floors, ceilings, roofs). The three IFC patterns we adopted for
// walls apply unchanged to slabs:
//
//   ✓ Type-Instance       — `SlabType` ↔ `IfcSlabType`
//   ✓ Layers + Parts      — `MaterialLayer[]` (CLT lamellae, screed,
//                            finish, insulation) AND/OR `SlabPart[]`
//                            (joists, beams, sheathing, decking)
//   ✓ Property Sets       — open `properties` map on type + part +
//                            layer; standard keys map to `Pset_SlabCommon`
//
// At IFC export each `Slab` becomes `IfcSlab`, each `SlabPart` becomes
// `IfcMember` (beams/joists) or `IfcPlate` (sheathing) or `IfcCovering`
// (decking/ceiling), aggregated under the slab via `IfcRelAggregates`.

import { Vec2 } from "../../core/math/vectors";
import { Polygon2D } from "../../core/geometry/Polygon2D";
import { Mesh } from "../../core/geometry/mesh/Mesh";
import type {
  PropertyMap, MaterialLayer, PartProfile,
} from "../walls/types";

// Re-use types from walls — they're domain-generic, not wall-specific.
export type { PropertyMap, MaterialLayer, PartProfile } from "../walls/types";

// ─── Roles for slab parts ───────────────────────────────────────────

/**
 * Role tag for a slab part. Drives the IFC mapping at export time:
 *   joist / beam / header / blocking → IfcMember
 *   sheathing / decking              → IfcPlate / IfcCovering
 *   topping / screed / finish        → IfcCovering
 *   monolithic                       → IfcSlab (the whole envelope as one piece)
 */
export type SlabPartRole =
  | "joist"           // primary horizontal member
  | "beam"            // larger primary beam (often supports joists)
  | "header"          // around openings
  | "blocking"        // between joists, for stiffness
  | "sheathing"       // OSB / plywood structural deck on top of joists
  | "decking"         // finished floor surface
  | "topping"         // concrete topping
  | "insulation"      // cavity insulation
  | "ceiling"         // gypsum / plaster ceiling below joists
  | "monolithic"      // the whole slab as one piece
  | string;

// ─── Slab parts ──────────────────────────────────────────────────────

export interface SlabPart {
  name: string;
  role: SlabPartRole;
  mesh: Mesh;
  material?: string;
  profile?: PartProfile;
  /** Linear length (joists, beams). */
  length?: number;
  /** Explicit IFC subtype override. Default: derived from role. */
  ifcType?: "IfcMember" | "IfcPlate" | "IfcCovering" | "IfcSlab" | "IfcBuildingElementProxy";
  properties?: PropertyMap;
}

// ─── Slab openings (stair wells, duct penetrations, …) ──────────────

/**
 * A rectangular opening in a slab (stair well, mechanical penetration,
 * skylight). Positioned in world coordinates within the slab boundary.
 * Aligned with the slab's local frame (X = joist direction by default,
 * but can be overridden by the construction).
 */
export class SlabOpening {
  centerX: number;
  centerY: number;
  /** Dimension along the slab's local X (joist direction). */
  width: number;
  /** Dimension along the slab's local Y (across joists). */
  depth: number;
  name?: string;

  constructor(centerX: number, centerY: number, width: number, depth: number, name?: string) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.width = width;
    this.depth = depth;
    this.name = name;
  }
}

// ─── Construction context ───────────────────────────────────────────

/**
 * Optional context passed to a `SlabConstruction`. Provides the joist
 * direction (auto-resolved by the system or explicitly set) and the
 * supporting walls (used by the structural-aware construction variants).
 */
export interface SlabContext {
  /** Resolved joist direction (unit vector in the XY plane). */
  joistDirection: Vec2;
  /** Walls that support this slab (used by joisted constructions). */
  supports?: import("../../core/geometry/walls").Wall[];
}

// ─── Construction function ──────────────────────────────────────────

export type SlabConstruction = (slab: Slab, ctx?: SlabContext) => SlabPart[];

// ─── SlabType ───────────────────────────────────────────────────────

export interface SlabTypeOptions {
  name: string;
  description?: string;
  construction?: SlabConstruction;
  layers?: MaterialLayer[];
  properties?: PropertyMap;
  /** Default joist spacing for joisted constructions (m). */
  defaultJoistSpacing?: number;
  /** Default joist profile (cross-section). */
  defaultJoistProfile?: PartProfile;
  /** Material name for joists / structural members. */
  defaultMaterial?: string;
}

/**
 * Reusable slab *type* — the IFC `IfcSlabType` analogue.
 *
 * @example Solid CLT slab (monolithic, layered material):
 * const Clt200 = new SlabType({
 *   name: "CLT 200 (5-ply)",
 *   construction: SolidSlabConstruction,
 *   layers: cltLayers({ lamellae: [0.04, 0.02, 0.04, 0.02, 0.04, 0.02, 0.04] }),
 *   properties: { loadBearing: true, fireRating: "REI60" },
 * });
 *
 * @example Joisted timber slab (parts + sheathing/ceiling layers):
 * const Joisted = new SlabType({
 *   name: "Timber joist + OSB",
 *   construction: JoistedSlab({ spacing: 0.625, profile: { w: 0.06, h: 0.22 } }),
 *   layers: [
 *     { material: "Gipsfaser 12.5 mm", thickness: 0.0125, position: "interior" },
 *     { material: "OSB 22 mm",         thickness: 0.022,  position: "exterior" },
 *   ],
 *   properties: { loadBearing: true, fireRating: "REI60" },
 * });
 */
export class SlabType {
  readonly name: string;
  readonly description?: string;
  readonly construction?: SlabConstruction;
  readonly layers?: MaterialLayer[];
  readonly properties: PropertyMap;
  readonly defaultJoistSpacing?: number;
  readonly defaultJoistProfile?: PartProfile;
  readonly defaultMaterial?: string;

  constructor(opts: SlabTypeOptions) {
    this.name                = opts.name;
    this.description         = opts.description;
    this.construction        = opts.construction;
    this.layers              = opts.layers;
    this.properties          = opts.properties ?? {};
    this.defaultJoistSpacing = opts.defaultJoistSpacing;
    this.defaultJoistProfile = opts.defaultJoistProfile;
    this.defaultMaterial     = opts.defaultMaterial;
  }

  get layeredThickness(): number {
    return (this.layers ?? []).reduce((s, l) => s + l.thickness, 0);
  }
}

// ─── Slab instance ──────────────────────────────────────────────────

export interface SlabOptions {
  /**
   * Closed XY polygon defining the slab footprint. Must be closed
   * (first point ≈ last point) and either CCW or CW.
   */
  boundary: Vec2[];
  /** Structural thickness of the slab (m). Default: 0.2. */
  thickness?: number;
  /**
   * Top-of-slab elevation in world Z (m). The slab body extends from
   * (elevation − thickness) up to `elevation`. Default: 0.
   */
  elevation?: number;
  name?: string;
  type?: SlabType;
  properties?: PropertyMap;
  openings?: SlabOpening[];
  /**
   * Explicit joist direction override. If unset, the construction (or
   * `SlabSystem`) auto-computes via the orientation helpers.
   */
  joistDirection?: Vec2;
}

export class Slab {
  readonly boundary: Vec2[];
  thickness: number;
  elevation: number;
  name?: string;
  type?: SlabType;
  properties?: PropertyMap;
  readonly openings: SlabOpening[] = [];
  /**
   * Optional override for joist direction. When set, `SlabSystem` /
   * `realize` will use this instead of auto-computing.
   */
  joistDirection?: Vec2;

  constructor(opts: SlabOptions) {
    this.boundary = opts.boundary;
    this.thickness = opts.thickness ?? 0.2;
    this.elevation = opts.elevation ?? 0;
    this.name = opts.name;
    this.type = opts.type;
    this.properties = opts.properties;
    if (opts.openings) this.openings.push(...opts.openings);
    this.joistDirection = opts.joistDirection;
  }

  /** Total perimeter length (m). */
  get perimeter(): number {
    let total = 0;
    const b = this.boundary;
    for (let i = 0; i < b.length - 1; i++) total += b[i].distTo(b[i + 1]);
    return total;
  }

  /** Slab footprint area (m²). Uses signed-area magnitude. */
  get area(): number {
    return Math.abs(Polygon2D.signedArea(this.boundary));
  }

  /**
   * Build the slab envelope mesh: top face + bottom face + side quads.
   * Uses `Polygon2D.triangulate2D` (ear-clipping) for the caps.
   */
  toMesh(): Mesh {
    const b = this.boundary;
    // Drop the duplicate closing vertex if the polygon is closed.
    const ring = b.length >= 3 && b[0].distSqTo(b[b.length - 1]) < 1e-12
      ? b.slice(0, -1)
      : b.slice();
    const n = ring.length;
    if (n < 3) {
      return new Mesh(new Float32Array(), new Uint32Array(), new Float32Array());
    }

    const zTop = this.elevation;
    const zBot = this.elevation - this.thickness;

    const positions: number[] = [];
    const normals:   number[] = [];
    const indices:   number[] = [];

    // ── Top + bottom caps (each gets its own vertex set to keep normals clean) ──
    const tris = Polygon2D.triangulate2D(ring);

    // Top: outward normal = +Z
    const topBase = positions.length / 3;
    for (const p of ring) {
      positions.push(p.x, p.y, zTop);
      normals.push(0, 0, 1);
    }
    for (const [a, b2, c] of tris) {
      indices.push(topBase + a, topBase + b2, topBase + c);
    }

    // Bottom: outward normal = −Z, reverse winding
    const botBase = positions.length / 3;
    for (const p of ring) {
      positions.push(p.x, p.y, zBot);
      normals.push(0, 0, -1);
    }
    for (const [a, b2, c] of tris) {
      indices.push(botBase + c, botBase + b2, botBase + a);
    }

    // ── Side quads (outward normals computed from each edge) ──
    for (let i = 0; i < n; i++) {
      const p0 = ring[i];
      const p1 = ring[(i + 1) % n];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-9) continue;
      // Outward normal for a CCW polygon = right-perpendicular (dy, −dx)/len.
      const nx = dy / len, ny = -dx / len;
      const base = positions.length / 3;
      positions.push(p0.x, p0.y, zBot, p1.x, p1.y, zBot, p1.x, p1.y, zTop, p0.x, p0.y, zTop);
      for (let k = 0; k < 4; k++) normals.push(nx, ny, 0);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    return new Mesh(new Float32Array(positions), new Uint32Array(indices), new Float32Array(normals));
  }
}

// ─── Realized slab (geometry + metadata pair) ───────────────────────

export interface RealizedSlab {
  slab: Slab;
  parts: SlabPart[];
  layers: MaterialLayer[];
  envelopeMesh: Mesh;
  properties: PropertyMap;
  joistDirection?: Vec2;
}

export function realizeSlab(slab: Slab, ctx?: SlabContext): RealizedSlab {
  const type = slab.type;
  const envelopeMesh = slab.toMesh();
  const parts = type?.construction ? type.construction(slab, ctx) : [];
  const layers = type?.layers ?? [];
  const properties: PropertyMap = { ...(type?.properties ?? {}), ...(slab.properties ?? {}) };
  return { slab, parts, layers, envelopeMesh, properties, joistDirection: ctx?.joistDirection };
}
