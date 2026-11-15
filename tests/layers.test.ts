import { describe, it, expect } from "vitest";
import {
  computeEffectiveVisibility, computeEffectiveLock, layerDefaults, activateLayer, keepActiveOn,
  type LayerNode,
} from "../src/gui/LayerPanel";

const NODES: LayerNode[] = [
  { id: "structure", label: "Structure", children: [
    { id: "columns", label: "Columns", defaultColor: "#ef4444" },
    { id: "beams",   label: "Beams", defaultLocked: true },
  ]},
  { id: "guides", label: "Guides", defaultVisible: false },
];

describe("layer tree state", () => {
  it("starts every layer from its defaults", () => {
    expect(layerDefaults(NODES)).toEqual({
      structure: { visible: true,  color: "#888888", locked: false },
      columns:   { visible: true,  color: "#ef4444", locked: false },
      beams:     { visible: true,  color: "#888888", locked: true },
      guides:    { visible: false, color: "#888888", locked: false },
    });
  });

  it("a parent's lock masks its children without changing their own state", () => {
    const value = layerDefaults(NODES);
    value.structure = { ...value.structure, locked: true };
    expect(computeEffectiveLock(NODES, value)).toEqual({ structure: true, columns: true, beams: true, guides: false });
    expect(value.columns.locked).toBe(false);
    expect(computeEffectiveLock(NODES, {})).toEqual({ structure: false, columns: false, beams: true, guides: false });
  });

  it("making a layer active turns it and its parents on and unlocks them", () => {
    const value = layerDefaults(NODES);
    value.structure = { ...value.structure, visible: false };
    const updates = activateLayer(NODES, value, "beams");
    expect(updates).toEqual({
      structure: { visible: true, color: "#888888", locked: false },
      beams:     { visible: true, color: "#888888", locked: false },
    });
    const next = { ...value, ...updates };
    expect(computeEffectiveVisibility(NODES, next).beams).toBe(true);
    expect(computeEffectiveLock(NODES, next).beams).toBe(false);
    expect(activateLayer(NODES, value, "columns")).toEqual({ structure: { visible: true, color: "#888888", locked: false } });
    expect(activateLayer(NODES, value, "nope")).toEqual({});
  });

  it("the active layer and its parents can't be turned off or locked", () => {
    const kept = keepActiveOn(NODES, "columns", {
      structure: { visible: false },
      columns:   { locked: true, color: "#00ff88" },
      beams:     { visible: false },
    });
    expect(kept).toEqual({ structure: {}, columns: { color: "#00ff88" }, beams: { visible: false } });
    expect(keepActiveOn(NODES, "columns", { columns: { visible: true, locked: false } }))
      .toEqual({ columns: { visible: true, locked: false } });
    // A tree without an active layer ("", `columns: { active: false }`) keeps nothing on.
    expect(keepActiveOn(NODES, "", { structure: { visible: false }, columns: { locked: true } }))
      .toEqual({ structure: { visible: false }, columns: { locked: true } });
  });
});
