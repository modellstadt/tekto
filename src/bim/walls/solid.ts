// ====================================================================
// BIM / Walls / Solid — monolithic / layered (no decomposition)
// ====================================================================
//
// Concrete walls, CMU walls, CLT panels — any wall that is one piece
// of material (or several stacked layers, but with no geometric
// decomposition: each layer is just metadata).
//
// At IFC export time, the single mesh becomes `IfcWall` and the
// material layers become `IfcMaterialLayerSet` + `IfcMaterialLayerSetUsage`.

import type { Wall } from "../../core/geometry/walls";
import type { WallConstruction, WallPart } from "./types";

// ─── Construction function ───────────────────────────────────────────

/**
 * The trivial construction: the whole wall is one part, the envelope mesh.
 *
 * Use this when the wall has material layers (CMU + plaster + finish) but
 * no need to model each lamella as separate geometry. The wall renders and
 * exports as a single solid; the layers are metadata for take-off, U-value
 * calculation, and IFC.
 *
 * @example
 * const ConcreteWall = new WallType({
 *   name: "200 mm concrete",
 *   construction: SolidConstruction,
 *   layers: [{ material: "C25/30", thickness: 0.2, position: "core" }],
 *   properties: { fireRating: "4hr", loadBearing: true },
 * });
 */
export const SolidConstruction: WallConstruction = (wall: Wall): WallPart[] => [{
  name: "shell",
  role: "monolithic",
  mesh: wall.toMesh(),
  ifcType: "IfcWall",
}];
