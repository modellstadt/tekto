// ====================================================================
// BIM / Slabs / Solid — monolithic + layered (no decomposition)
// ====================================================================
//
// Concrete slabs, CLT panels, hollow-core, raft foundations — any slab
// that is one piece of material (or several stacked layers, but with
// no geometric decomposition).
//
// At IFC export the single mesh becomes `IfcSlab` and the material
// layers become `IfcMaterialLayerSet` + `IfcMaterialLayerSetUsage`.

import type { SlabConstruction, SlabPart, Slab } from "./types";

/**
 * Trivial construction: the whole slab is one part (the envelope mesh).
 * Combine with `layers` on the `SlabType` for layered build-ups
 * (concrete + finish, CLT lamellae, etc.).
 *
 * @example
 * const ConcreteSlab = new SlabType({
 *   name: "RC slab 200 mm",
 *   construction: SolidSlabConstruction,
 *   layers: [{ material: "C30/37", thickness: 0.2, position: "core" }],
 *   properties: { loadBearing: true, fireRating: "REI120" },
 * });
 */
export const SolidSlabConstruction: SlabConstruction = (slab: Slab): SlabPart[] => [{
  name: "shell",
  role: "monolithic",
  mesh: slab.toMesh(),
  ifcType: "IfcSlab",
}];
