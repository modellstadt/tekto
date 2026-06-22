// ====================================================================
// BIM / Walls / CLT — Cross-Laminated Timber panel
// ====================================================================
//
// A CLT wall is a single solid panel built up from alternating-grain
// lamellae. Geometrically it's one piece (no decomposition into members),
// so this is a *layered* construction, not an aggregated one.
//
// The wall renders as a single envelope mesh. The lamellae thicknesses
// and grain directions are carried as `MaterialLayer[]` metadata —
// useful for structural calc, U-value, and IFC export
// (`IfcMaterialLayerSet`).

import type { Wall } from "../../core/geometry/walls";
import type { WallConstruction, WallPart, MaterialLayer } from "./types";

export interface CltOptions {
  /**
   * Lamella thicknesses, in order interior → exterior, in metres.
   * Default: `[0.04, 0.02, 0.04, 0.02, 0.04]` (standard 160 mm 5-ply,
   * alternating 40/20 mm boards).
   */
  lamellae?: number[];
  /** Grade name (e.g. `"C24"` for European, `"V2 M5"` for ETA panels). */
  grade?: string;
  /** Total expected panel thickness — sanity check against summed lamellae. */
  totalThickness?: number;
}

const DEFAULT_LAMELLAE = [0.04, 0.02, 0.04, 0.02, 0.04];

/**
 * Build the `MaterialLayer[]` for a CLT panel from a list of lamella
 * thicknesses. Grain alternates 0° / 90° starting from the interior.
 */
export function cltLayers(opts: CltOptions = {}): MaterialLayer[] {
  const lamellae = opts.lamellae ?? DEFAULT_LAMELLAE;
  const grade    = opts.grade ?? "C24";
  return lamellae.map((thk, i) => ({
    material: `CLT ${grade} (${(thk * 1000).toFixed(0)} mm)`,
    thickness: thk,
    position: i === 0 ? "interior" : i === lamellae.length - 1 ? "exterior" : "core",
    properties: { grainDirection: i % 2 === 0 ? "longitudinal" : "transverse" },
  }));
}

/**
 * CLT construction: the wall is a single panel (one `WallPart`), the
 * lamellae are layered metadata.
 *
 * @example
 * const Clt160 = new WallType({
 *   name: "CLT 160 (5-ply)",
 *   construction: CltConstruction,
 *   layers: cltLayers({ lamellae: [0.04, 0.02, 0.04, 0.02, 0.04], grade: "C24" }),
 *   properties: { loadBearing: true, fireRating: "REI60" },
 * });
 */
export const CltConstruction: WallConstruction = (wall: Wall): WallPart[] => [{
  name: "CLT panel",
  role: "monolithic",
  mesh: wall.toMesh(),
  material: "CLT",
  ifcType: "IfcWall",
}];
