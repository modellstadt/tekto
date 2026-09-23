/**
 * Pick & Gizmo — click an object to select it, then drag the transform gizmo.
 *
 * The page every other one misses: picking plus three.js TransformControls, and
 * a selection that has to survive the sketch re-run a pick triggers (scene ids
 * restart at clear(), so the re-created object keeps its id). Both broke
 * silently once; tests/e2e/gizmo.spec.ts drives this page.
 */
import { sketch, SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const mode = lab.select("Gizmo", ["translate", "rotate", "scale", "none"], "translate");
    const dark = lab.toggle("Dark ground", true);

    // Always declared: ids are positional, so adding/removing an object here
    // would shift the ids after it and move the selection with them.
    lab.box(12, 0.05, 12).color(dark.value ? "#1b1f2a" : "#3a3f52").translate(0, -0.025, 0);

    // Mesh handles carry no pickTag (lines do), so name the ids we just made.
    const names: Record<string, string> = {
      [lab.box(1.6, 1.6, 1.6).color("#38d9a9").translate(-2.4, 0.8, 0).id]: "box",
      [lab.sphere(1, 24, 16).color("#f2b35a").translate(0, 1, 0).id]: "sphere",
      [lab.cylinder(0.7, 0.7, 2, 24).color("#4dabf7").translate(2.4, 1, 0).id]: "cylinder",
    };

    lab.enablePicking(true);
    lab.setGizmoMode(mode.value as "translate" | "rotate" | "scale" | "none");

    const id = lab.selectedId;
    lab.log("Selected", id ? (names[id] ?? id) : "—");
    lab.info("Click an object, then drag the gizmo. The selection survives the");
    lab.info("re-run each click triggers, and changing a parameter below.");
  }, {
    container,
    title: "Pick & Gizmo",
    background: 0x0a0b14,
    camera: [6, 5, 8],
    target: [0, 1, 0],
  });
}
