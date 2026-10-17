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
//   ✓ FILL            — the frame, glass and leaves in the hole: `openingFill`
//                       builds them from the type (frame size, partitioning,
//                       operation), or takes the parts an app made itself
//                       (`WallOpening.fill`). The IFC exporter writes them as
//                       the door's / window's body.
//
// The IFC enum *strings* live in the exporter, not here — this stays a
// plain, schema-free description.

import { Vec3 } from "../core/math/vectors";
import type { Mesh } from "../core/geometry/mesh/Mesh";
import { MeshFactory } from "../core/geometry/mesh/MeshFactory";
import { MeshTransform } from "../core/geometry/mesh/MeshTransform";
import type { Wall, WallOpening } from "../core/geometry/walls";
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

/** Options for `new OpeningType(...)`: name, door or window, how it operates or is partitioned, material and Pset properties. */
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
   * The frame's section: `width` in the face of the wall, `depth` through it (m). Default
   * 0.07 × 0.08 for a window, 0.06 × 0.10 for a door.
   */
  frame?: { width?: number; depth?: number };
  /** Where the fill sits across the wall, from its centreline to its left face (m, + left). Default 0. */
  offset?: number;
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
  frame?: { width?: number; depth?: number };
  offset?: number;

  constructor(opts: OpeningTypeOptions) {
    this.name = opts.name;
    this.kind = opts.kind ?? "door";
    this.operation = opts.operation ?? "not_defined";
    this.partitioning = opts.partitioning ?? "not_defined";
    this.material = opts.material;
    this.description = opts.description;
    this.properties = opts.properties ?? {};
    this.frame = opts.frame;
    this.offset = opts.offset;
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

// ─── Fill: frame, glass, leaves ───────────────────────────────────────

/** One part of what fills an opening, in world coordinates. */
export interface OpeningFillPart {
  name: string;
  role: "frame" | "glazing" | "leaf";
  mesh: Mesh;
  material?: string;
}

const GLASS = 0.024;          // an insulated glazing unit
const LEAF = 0.04;            // a door leaf
const GAP = 0.005;            // round a leaf

/**
 * What fills a wall opening: `opening.fill` when the app made its own, else built from the
 * opening's type — a window's frame with mullions or a transom by its partitioning and a pane
 * in each panel; a door's frame (jambs and head) and one leaf, or two for a double door. Each
 * part is a closed mesh in world coordinates, centred in the wall unless the type's `offset`
 * moves it.
 */
export function openingFill(wall: Wall, opening: WallOpening): OpeningFillPart[] {
  if (opening.fill) return opening.fill;
  const type = opening.type;
  const door = type ? type.kind === "door" : opening.isDoor;
  const w = opening.width, h = opening.headHeight - opening.sillHeight;
  const fw = Math.min(type?.frame?.width ?? (door ? 0.06 : 0.07), w / 4, h / 4);
  const fd = Math.min(type?.frame?.depth ?? (door ? 0.1 : 0.08), wall.thickness);
  if (!(w > 0 && h > 0 && fw > 0 && fd > 0)) return [];
  const v = type?.offset ?? 0;
  const at = alongCentreline(wall, opening.centerlinePosition);
  const z0 = wall.baseElevation + opening.sillHeight;
  // A box in the opening's frame: u along the wall from the opening's centre, v across, z up from the sill.
  const box = (su: number, sv: number, sz: number, u: number, z: number, vv = v): Mesh => {
    const m = MeshFactory.box(su, sv, sz);
    m.translate(u, vv, z);
    MeshTransform.rotate(m, new Vec3(0, 0, 1), at.angle);
    m.translate(at.x, at.y, z0);
    return m;
  };
  const merged = (meshes: Mesh[]) => meshes.reduce((a, b) => a.merge(b));
  const frameMaterial = type?.material ?? "Wood";
  const inner = w - 2 * fw;

  if (door) {
    const frame = merged([
      box(fw, fd, h, -w / 2 + fw / 2, h / 2), box(fw, fd, h, w / 2 - fw / 2, h / 2),
      box(inner, fd, fw, 0, h - fw / 2),
    ]);
    const two = type?.operation === "double_swing" || type?.operation === "double_door_single_swing";
    const lh = h - fw - 2 * GAP;
    const lw = two ? (inner - 3 * GAP) / 2 : inner - 2 * GAP;
    const leaves = two
      ? [box(lw, LEAF, lh, -(lw + GAP) / 2, GAP + lh / 2), box(lw, LEAF, lh, (lw + GAP) / 2, GAP + lh / 2)]
      : [box(lw, LEAF, lh, 0, GAP + lh / 2)];
    return [
      { name: "Door frame", role: "frame", mesh: frame, material: frameMaterial },
      ...leaves.map((mesh, i): OpeningFillPart => ({ name: leaves.length > 1 ? `Door leaf ${i + 1}` : "Door leaf", role: "leaf", mesh, material: frameMaterial })),
    ];
  }

  // Window: the outer frame, then mullions (vertical) or a transom (horizontal) by partitioning.
  const p = type?.partitioning;
  const columns = p === "double_panel_vertical" ? 2 : p === "triple_panel" ? 3 : 1;
  const rows = p === "double_panel_horizontal" ? 2 : 1;
  const members = [
    box(fw, fd, h, -w / 2 + fw / 2, h / 2), box(fw, fd, h, w / 2 - fw / 2, h / 2),
    box(inner, fd, fw, 0, fw / 2), box(inner, fd, fw, 0, h - fw / 2),
  ];
  const pw = (inner - (columns - 1) * fw) / columns, ph = (h - 2 * fw - (rows - 1) * fw) / rows;
  for (let c = 1; c < columns; c++) members.push(box(fw, fd, h - 2 * fw, -inner / 2 + c * (pw + fw) - fw / 2, h / 2));
  for (let r = 1; r < rows; r++) members.push(box(inner, fd, fw, 0, fw + r * (ph + fw) - fw / 2));
  const panes: Mesh[] = [];
  for (let c = 0; c < columns; c++) {
    for (let r = 0; r < rows; r++) panes.push(box(pw, GLASS, ph, -inner / 2 + c * (pw + fw) + pw / 2, fw + r * (ph + fw) + ph / 2));
  }
  return [
    { name: "Window frame", role: "frame", mesh: merged(members), material: frameMaterial },
    { name: "Glazing", role: "glazing", mesh: merged(panes), material: "Glass" },
  ];
}

/** The point at arc length `m` along a wall's centreline, and the direction of its segment there. */
function alongCentreline(wall: Wall, m: number): { x: number; y: number; angle: number } {
  const cl = wall.centerline;
  let run = 0;
  for (let i = 1; i < cl.length; i++) {
    const a = cl[i - 1], seg = cl[i].sub(a), len = seg.len();
    if (m <= run + len || i === cl.length - 1) {
      const t = len > 1e-12 ? Math.max(0, Math.min(1, (m - run) / len)) : 0;
      return { x: a.x + seg.x * t, y: a.y + seg.y * t, angle: Math.atan2(seg.y, seg.x) };
    }
    run += len;
  }
  return { x: cl[0]?.x ?? 0, y: cl[0]?.y ?? 0, angle: 0 };
}
