// ====================================================================
// BIM / Walls — Type-Instance, Material Layers, Aggregated Parts, Psets
// ====================================================================
//
// Domain-semantics layer over the geometric wall envelope
// (`src/core/geometry/walls.ts`). Borrowed-and-trimmed from IFC.
//
// Three patterns from IFC, three patterns left out:
//
//   ✓ TYPE-INSTANCE       — `WallType` is reused by many `Wall` instances.
//                           Matches `IfcWallType` ↔ `IfcWall`.
//   ✓ LAYERS + PARTS      — a wall type can be monolithic (material layers)
//                           OR framed (an aggregation of meshed parts) OR both.
//                           Matches `IfcMaterialLayerSetUsage` and
//                           `IfcRelAggregates` → `IfcMember`s + `IfcCovering`s.
//   ✓ PROPERTY SETS       — open-ended `properties` map on type and parts.
//                           Maps to `IfcPropertySet` + standard `Pset_WallCommon`.
//
//   ✗ Relationship-as-object   — IFC turns every relation into its own
//                                STEP entity. In TS we just hold references;
//                                the IFC exporter unrolls these into the schema.
//   ✗ `IfcWallStandardCase`    — the "axis + perpendicular extrusion" subtype.
//                                Picked at export time based on the centerline.
//   ✗ Full material vocabulary — `IfcMaterialProfile{Set,SetUsage,Profile}`.
//                                One flat `{ material, profile }` here; the
//                                exporter expands as needed.

import type { Mesh } from "../../core/geometry/mesh/Mesh";
import type { Wall, WallSystem } from "../../core/geometry/walls";
import type { RibbonEndTrim } from "../../core/geometry/ExtrudedRibbon";
import { newBuffers, finishMesh } from "../../core/geometry/ExtrudedRibbon";
import type { JointStyle } from "../../core/geometry/RibbonJoint";

// ─── Property map ────────────────────────────────────────────────────

/**
 * Open-ended key/value map for property sets. Maps to `IfcPropertySet`
 * at export time. Standard keys for walls (recognised by the IFC exporter
 * when present and mapped to `Pset_WallCommon`):
 *
 *   - `fireRating`        (string, e.g. "1hr")
 *   - `acousticRating`    (number, dB)
 *   - `uValue`            (number, W/m²K)
 *   - `loadBearing`       (boolean)
 *   - `isExternal`        (boolean)
 *   - `combustible`       (boolean)
 *   - `surfaceSpreadOfFlame` (string)
 *
 * Any other key/value passes through as a custom Pset.
 */
export type PropertyMap = Record<string, unknown>;

// ─── Material layers (monolithic / layered walls) ────────────────────

/** Position of a material layer relative to the wall's axis (centerline). */
export type LayerPosition =
  | "interior"           // on the interior side of the axis (negative offset)
  | "exterior"           // on the exterior side of the axis (positive offset)
  | "core"               // straddling the axis
  | number;              // explicit signed offset from the axis, in metres

/**
 * One layer in a layered wall. Order in `WallType.layers` matters — by
 * convention, list from **interior to exterior**, the same order IFC uses
 * for `IfcMaterialLayerSet`.
 *
 * Maps to `IfcMaterialLayer` (+ position becomes `IfcMaterialLayerSetUsage`).
 *
 * @example
 * { material: "Gypsum board 12.5 mm", thickness: 0.0125, position: "interior" }
 */
export interface MaterialLayer {
  /** Human-readable material name. Maps to `IfcMaterial.Name`. */
  material: string;
  /** Layer thickness, in metres. Maps to `IfcMaterialLayer.LayerThickness`. */
  thickness: number;
  /** Where this layer sits relative to the wall axis. Default: `"core"`. */
  position?: LayerPosition;
  /** Layer-specific properties (will become a Pset on the IfcMaterial). */
  properties?: PropertyMap;
}

// ─── Aggregated parts (framed / decomposed walls) ────────────────────

/**
 * Role tag for a wall part. Used by the IFC exporter to pick the right
 * IFC subtype (an `IfcMember` for studs, an `IfcCovering` for sheathing,
 * an `IfcPlate` for top/bottom plates).
 *
 * The set is open — pass any string for custom roles. The known values
 * have default IFC mappings; unknown roles default to `IfcBuildingElementProxy`.
 */
export type WallPartRole =
  | "stud"            // → IfcMember (load-bearing or stiffening)
  | "topPlate"        // → IfcMember
  | "sillPlate"       // → IfcMember (a.k.a. sole plate)
  | "header"          // → IfcMember (lintel over an opening)
  | "jackStud"        // → IfcMember (cripple under a header)
  | "cripple"         // → IfcMember (above/below an opening)
  | "blocking"        // → IfcMember (between studs)
  | "sheathing"       // → IfcCovering (OSB/plywood)
  | "cladding"        // → IfcCovering (siding/brick veneer)
  | "insulation"      // → IfcCovering with Pset_CoveringCommon
  | "vaporBarrier"    // → IfcCovering
  | "drywall"         // → IfcCovering
  | "monolithic"      // → IfcWall (the whole envelope as one piece)
  | string;           // custom — → IfcBuildingElementProxy

/**
 * Cross-section profile for a stud/plate/header. Most lumber is rectangular.
 * Maps to `IfcRectangleProfileDef` (rectangular) or a custom profile.
 *
 * Convention (looking at the wall in plan from above, axis running L→R):
 *
 *   `w` = the dimension **along the wall direction** (parallel to the wall face).
 *   `h` = the dimension **across the wall** (perpendicular to the wall face;
 *         into the wall — defines the cavity depth for studs / the breadth
 *         of a horizontal member like a plate).
 *
 * For a North-American 2×4 stud (38 × 89): `{ w: 0.038, h: 0.089 }` — 38 mm
 * visible between sheathings, 89 mm into the wall.
 * For a German KVH 60×120: `{ w: 0.060, h: 0.120 }`.
 */
export interface PartProfile {
  /** Width parallel to the wall face — along the wall direction. */
  w: number;
  /** Depth perpendicular to the wall face — into the wall thickness. */
  h: number;
  /** Optional profile name (e.g. "SPF 2×4 (38×89)", "KVH 60×120"). */
  name?: string;
}

/**
 * A single mesh sub-element of a wall (one stud, one plate, one piece
 * of sheathing). Carries enough metadata to ship to IFC, generate a
 * cut list, or paint by material.
 *
 * Maps to `IfcMember` / `IfcPlate` / `IfcCovering` (chosen by `ifcType`,
 * defaulted from `role`).
 */
export interface WallPart {
  /** Display name (e.g. "Stud 12", "Top plate", "Sheathing panel"). */
  name: string;
  /** Role tag — drives the IFC mapping; see {@link WallPartRole}. */
  role: WallPartRole;
  /** Triangle mesh for this part (use the flat `Mesh` from `core/geometry/mesh`). */
  mesh: Mesh;
  /** Material name (free-form; the exporter resolves to `IfcMaterial`). */
  material?: string;
  /** Cross-section profile (for studs/plates/etc.). Used by the cut list. */
  profile?: PartProfile;
  /** Linear length, in metres (along the part's main axis). Used by the cut list. */
  length?: number;
  /** Explicit IFC subtype override. Default: derived from `role`. */
  ifcType?: "IfcMember" | "IfcCovering" | "IfcPlate" | "IfcWall" | "IfcBuildingElementProxy";
  /** Part-specific property set. Maps to an `IfcPropertySet` on the IFC element. */
  properties?: PropertyMap;
}

// ─── Cut list ────────────────────────────────────────────────────────

/**
 * One entry in a fabrication cut list. Used by the BalloonFrame and
 * similar framed-wall constructions to report what lumber is needed.
 */
export interface CutListItem {
  material: string;            // "SPF"
  profile: PartProfile;        // { w: 0.038, h: 0.089, name: "2×4" }
  length: number;              // metres
  count: number;               // how many of this length
  role: WallPartRole;          // "stud", "topPlate", …
}

// ─── Wall construction function ──────────────────────────────────────

// ─── Junction context (junction-aware framing) ───────────────────────

/**
 * One T-junction landing on the **interior** of this wall — i.e., another
 * wall's centerline endpoint touches this wall's centerline between two
 * of its own vertices. The through-wall construction uses this to insert
 * channel/backing studs that provide a nailing surface for the partition's
 * drywall return.
 */
export interface WallTJunction {
  /** Arc-length along THIS wall's centerline where the other wall meets. */
  arcLength: number;
  /** The OTHER wall — the partition / spur whose endpoint lands here. */
  otherWall: Wall;
  /** Convenience: the other wall's thickness in metres. */
  otherThickness: number;
}

/**
 * Optional context passed by `WallSystem.realize()` to each wall's
 * construction. Lets the construction respond to junctions: trim plates
 * to neighbour faces, shorten partition end-studs to land at the through
 * wall, and insert channel studs in through-walls.
 */
export interface WallContext {
  /** Trim line at the start endpoint (from `RibbonSystem` junction analysis). */
  startTrim?: RibbonEndTrim;
  /** Trim line at the end endpoint. */
  endTrim?: RibbonEndTrim;
  /** T-junctions landing on this wall's *interior* (through-wall responsibility). */
  tJunctions?: WallTJunction[];
}

/**
 * The geometric realization of a wall type. Pure function: takes the
 * wall envelope + optional junction context, returns the aggregated parts.
 *
 * If a wall type is purely layered (CMU + plaster + finish) and not
 * decomposed, the construction function returns `[]` and the layers
 * are carried on the `WallType` itself.
 *
 * @example
 * const stripped: WallConstruction = (wall) => [
 *   { name: "shell", role: "monolithic", mesh: wall.toMesh() }
 * ];
 */
export type WallConstruction = (wall: Wall, ctx?: WallContext) => WallPart[];

// ─── Wall type (the IFC-style type definition) ───────────────────────

/**
 * A reusable wall *type* — the IFC `IfcWallType` analogue. Define once,
 * apply to many `Wall` instances. Carries the construction (parts),
 * layers (materials), and properties (Psets).
 *
 * Walls can be:
 *   - **Monolithic** — only `layers` is set; the envelope mesh is the geometry.
 *   - **Framed** — only `construction` is set; parts make up the geometry.
 *   - **Both** — framed-and-sheathed (timber frame + gypsum/OSB layers).
 *
 * @example Monolithic CMU + drywall (no decomposition, just layered material):
 * const CmuWall = new WallType({
 *   name: "200 mm CMU + 13 mm drywall",
 *   layers: [
 *     { material: "Drywall 13 mm",     thickness: 0.013, position: "interior" },
 *     { material: "CMU 190 mm",        thickness: 0.190, position: "core" },
 *     { material: "Render 10 mm",      thickness: 0.010, position: "exterior" },
 *   ],
 *   properties: { fireRating: "2hr", uValue: 1.6, loadBearing: true, isExternal: true },
 * });
 *
 * @example Framed 2×4 wall (decomposed into studs + plates + sheathing):
 * const Framed2x4 = new WallType({
 *   name: "2×4 framed w/ OSB",
 *   construction: BalloonFrame({ studSpacing: 0.4, studSize: { w: 0.038, h: 0.089 } }),
 *   layers: [
 *     { material: "OSB 11 mm",         thickness: 0.011, position: "exterior" },
 *     { material: "Gypsum 13 mm",      thickness: 0.013, position: "interior" },
 *   ],
 *   properties: { fireRating: "1hr", loadBearing: true },
 * });
 */
export class WallType {
  readonly name: string;
  readonly description?: string;
  readonly construction?: WallConstruction;
  readonly layers?: MaterialLayer[];
  readonly properties: PropertyMap;
  /**
   * Preferred joint style for joints involving this wall type. Used by
   * `WallSystem.realize()` to set sensible defaults on auto-detected
   * joints. `"butt"` matches prefab-panel construction (Holzrahmenbau,
   * Holztafelbau, steel-stud panel); `"mitered"` matches monolithic
   * construction (concrete, CMU, CLT slab). Default: `"mitered"`.
   */
  readonly junctionStyle?: JointStyle;

  constructor(opts: {
    name: string;
    description?: string;
    construction?: WallConstruction;
    layers?: MaterialLayer[];
    properties?: PropertyMap;
    junctionStyle?: JointStyle;
  }) {
    this.name = opts.name;
    this.description = opts.description;
    this.construction = opts.construction;
    this.layers = opts.layers;
    this.properties = opts.properties ?? {};
    this.junctionStyle = opts.junctionStyle;
  }

  /** Total nominal thickness summed from material layers (0 if none). */
  get layeredThickness(): number {
    return (this.layers ?? []).reduce((s, l) => s + l.thickness, 0);
  }
}

// ─── Realized wall (the geometry + metadata pair) ────────────────────

/**
 * The result of `realize(wall)`. The geometry side of the type-instance
 * relationship — what you actually render or export.
 *
 * - `parts` is populated when the wall type has a construction function
 *   (framed walls). Empty for purely-monolithic walls.
 * - `layers` is populated when the wall type defines layered materials.
 *   Empty for purely-framed walls.
 * - `envelopeMesh` is the whole-wall envelope (single mesh from the
 *   underlying `ExtrudedRibbon`), trimmed at its joints when it comes from
 *   `WallSystem.realize()` (or a `WallContext` with trims), so the walls of a
 *   system meet at their corners as `WallSystem.buildMesh()` draws them.
 *   Always present; useful for quick rendering and for monolithic walls as
 *   the primary mesh.
 * - `properties` is the merged Pset (wall instance overrides type defaults).
 */
export interface RealizedWall {
  wall: Wall;
  parts: WallPart[];
  layers: MaterialLayer[];
  envelopeMesh: Mesh;
  properties: PropertyMap;
}

/**
 * Apply a wall's type to produce its realized geometry + metadata.
 * If the wall has no type, returns a monolithic realization using only
 * the envelope mesh (sensible default for quick visualisation).
 *
 * For junction-aware framing (channel studs, plate trims, partition
 * shortening), pass a `WallContext` — or use `WallSystem.realize()`
 * which computes the context for every wall automatically.
 *
 * The function is pure — no side effects, safe to call repeatedly.
 */
export function realize(wall: Wall, ctx?: WallContext): RealizedWall {
  const type = wall.type;
  const envelopeMesh = ctx?.startTrim || ctx?.endTrim ? trimmedEnvelope(wall, ctx) : wall.toMesh();
  const parts = type?.construction ? type.construction(wall, ctx) : [];
  const layers = type?.layers ?? [];
  const properties: PropertyMap = { ...(type?.properties ?? {}), ...(wall.properties ?? {}) };
  return { wall, parts, layers, envelopeMesh, properties };
}

/**
 * Realise every wall in a system with automatic junction context.
 * Calls `realize()` for each wall after gathering trims + T-junctions
 * via the underlying `RibbonSystem`. Use this instead of looping over
 * walls + calling `realize(wall)` when you want junction-aware framing.
 */
/** A wall's envelope cut at its joints: what `WallSystem.buildMesh()` draws for it. */
function trimmedEnvelope(wall: Wall, ctx: WallContext): Mesh {
  wall.syncOpeningsToRibbon();
  const buf = newBuffers();
  wall.ribbon.buildInto(buf, ctx.startTrim ?? null, ctx.endTrim ?? null);
  return finishMesh(buf);
}

export function realizeSystem(system: WallSystem): RealizedWall[] {
  const trims = system.ribbons.computeTrims();
  const out: RealizedWall[] = [];
  for (let i = 0; i < system.walls.length; i++) {
    const wall = system.walls[i];
    const t = trims[i] ?? { start: null, end: null };
    const tJunctions = system.ribbons.findTJunctionsOnRibbon(wall.ribbon).map(j => {
      const otherWall = system.walls.find(w => w.ribbon === j.otherRibbon);
      return {
        arcLength: j.arcLength,
        otherWall: otherWall ?? wall,
        otherThickness: otherWall?.thickness ?? 0,
      };
    });
    const ctx: WallContext = {
      startTrim: t.start ?? undefined,
      endTrim:   t.end   ?? undefined,
      tJunctions,
    };
    out.push(realize(wall, ctx));
  }
  return out;
}

// ─── Cut-list helpers ────────────────────────────────────────────────

/**
 * Roll a list of parts into a cut list keyed by (material × profile × length-bucket): a
 * wall's (`RealizedWall.parts`), a slab's (`realizeSlab(…).parts`), or both together. Parts
 * without a length, profile or material (sheathing, the envelope) are left out. The default
 * bucket is exact-millimetre — pass `roundMm` to coarsen.
 */
export function buildCutList(
  parts: readonly Pick<WallPart, "material" | "profile" | "length" | "role">[],
  roundMm = 1,
): CutListItem[] {
  const buckets = new Map<string, CutListItem>();
  for (const p of parts) {
    if (p.length === undefined || !p.profile || !p.material) continue;
    const lenMm = Math.round((p.length * 1000) / roundMm) * roundMm;
    const key = `${p.material}|${p.profile.name ?? `${p.profile.w}x${p.profile.h}`}|${lenMm}|${p.role}`;
    const existing = buckets.get(key);
    if (existing) existing.count++;
    else buckets.set(key, {
      material: p.material,
      profile: p.profile,
      length: lenMm / 1000,
      count: 1,
      role: p.role,
    });
  }
  return [...buckets.values()].sort((a, b) =>
    a.material.localeCompare(b.material) || a.length - b.length,
  );
}
