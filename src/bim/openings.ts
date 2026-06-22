// ====================================================================
// BIM / Openings — reusable Door & Window types (Type-Instance + Psets)
// ====================================================================
//
// The geometric opening (a hole punched through a wall) is `WallOpening`
// in `core/geometry/walls.ts`. This file adds the *domain* layer over it,
// mirroring `WallType`/`SlabType`:
//
//   ✓ TYPE-INSTANCE   — one `OpeningType` ("Ext. entrance door, 1hr") is
//                       referenced by many `WallOpening`s. Matches
//                       `IfcDoorType` ↔ `IfcDoor` / `IfcWindowType` ↔ `IfcWindow`.
//   ✓ OPERATION       — how the leaf moves (swing / slide / fold) for doors,
//                       or how panels divide for windows. Maps to
//                       `IfcDoorTypeOperationEnum` / `IfcWindowTypePartitioningEnum`.
//   ✓ PROPERTY SETS   — open `properties` map. Standard keys map to
//                       `Pset_DoorCommon` / `Pset_WindowCommon` at export.
//
// The IFC enum *strings* live in the exporter, not here — this stays a
// plain, schema-free description.

import type { PropertyMap } from "./walls/types";

/** How a door leaf operates. Maps to `IfcDoorTypeOperationEnum`. */
export type DoorOperation =
  | "single_swing_left"
  | "single_swing_right"
  | "double_swing"
  | "double_door_single_swing"
  | "sliding"
  | "folding"
  | "revolving"
  | "not_defined";

/** How a window is partitioned. Maps to `IfcWindowTypePartitioningEnum`. */
export type WindowPartitioning =
  | "single_panel"
  | "double_panel_vertical"
  | "double_panel_horizontal"
  | "triple_panel"
  | "not_defined";

export interface OpeningTypeOptions {
  name: string;
  /** "door" → IfcDoor(Type); "window" → IfcWindow(Type). Default "door". */
  kind?: "door" | "window";
  /** Door leaf operation (ignored for windows). Default "not_defined". */
  operation?: DoorOperation;
  /** Window panel partitioning (ignored for doors). Default "not_defined". */
  partitioning?: WindowPartitioning;
  /** Leaf / frame material name, e.g. "Oak", "Aluminium". */
  material?: string;
  description?: string;
  /**
   * Open Pset map. Recognised keys map to `Pset_DoorCommon` /
   * `Pset_WindowCommon` (e.g. `fireRating`, `acousticRating`, `uValue`,
   * `isExternal`, `securityRating`); anything else passes through.
   */
  properties?: PropertyMap;
}

/**
 * Reusable door/window type — the IFC `IfcDoorType` / `IfcWindowType`
 * analogue. Attach one to a `WallOpening` (its `type` field) and the IFC
 * exporter emits the type once, links every instance via
 * `IfcRelDefinesByType`, and writes the matching common Pset.
 */
export class OpeningType {
  name: string;
  kind: "door" | "window";
  operation: DoorOperation;
  partitioning: WindowPartitioning;
  material?: string;
  description?: string;
  properties: PropertyMap;

  constructor(opts: OpeningTypeOptions) {
    this.name = opts.name;
    this.kind = opts.kind ?? "door";
    this.operation = opts.operation ?? "not_defined";
    this.partitioning = opts.partitioning ?? "not_defined";
    this.material = opts.material;
    this.description = opts.description;
    this.properties = opts.properties ?? {};
  }

  /** Convenience: a swinging interior/exterior door type. */
  static door(name: string, opts: Omit<OpeningTypeOptions, "name" | "kind"> = {}): OpeningType {
    return new OpeningType({ ...opts, name, kind: "door" });
  }

  /** Convenience: a window type. */
  static window(name: string, opts: Omit<OpeningTypeOptions, "name" | "kind"> = {}): OpeningType {
    return new OpeningType({ ...opts, name, kind: "window" });
  }
}
