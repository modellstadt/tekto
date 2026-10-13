/**
 * Sketch + drawing — a `sketch()` that shows its model in 3D and, at the flick of a toggle,
 * as a dimensioned drawing laid over the viewport (`lab.overlay()` + `SheetCanvas`). The
 * shape of an app like the stair: one function builds the model, and the drawing is drawn
 * from the same numbers, so the plan, the elevation, the DXF and the 3D view can't disagree.
 */
import { sketch, MeshFactory, Sheet, SheetCanvas, Vec3, download, type SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  let sheetView: SheetCanvas | null = null;          // made once, kept across re-runs
  let sheet = new Sheet();

  return sketch((lab) => {
    const steps = lab.slider("Steps", 4, 20, 12, { step: 1 });
    const rise = lab.slider("Rise (m)", 0.14, 0.2, 0.175, { step: 0.005 });
    const tread = lab.slider("Tread (m)", 0.22, 0.34, 0.28, { step: 0.01 });
    const width = lab.slider("Width (m)", 0.8, 2, 1.2, { step: 0.05 });
    const drawing = lab.toggle("Drawing", false);
    lab.button("Export DXF", () => download(sheet.toDXF(), "stair.dxf", { stamp: true }));

    // ── The model: one box per step, Z-up ──
    const n = steps.value, r = rise.value, t = tread.value, w = width.value;
    for (let i = 0; i < n; i++) {
      const step = MeshFactory.box(t, w, r * (i + 1));
      step.translate(t * (i + 0.5), w / 2, (r * (i + 1)) / 2);
      lab.mesh(step).color("#c9b79c");
    }

    // ── The drawing, from the same numbers ──
    sheet = new Sheet({ scale: 50, layers: { cut: { weight: 0.5 }, view: { weight: 0.25 }, dims: { weight: 0.13 } } });
    const plan = sheet.view("plan", { title: "Plan 1:50" });
    for (let i = 0; i < n; i++) plan.rect(t * i, 0, t, w, { layer: "view" });
    plan.dim([0, 0], [t * n, 0], { layer: "dims", offset: -8 });
    plan.dim([t * n, 0], [t * n, w], { layer: "dims", offset: -8 });
    plan.leader([[t * 0.5, w * 0.5], [-0.4, w + 0.4]], `${n} steps ${Math.round(r * 1000)}/${Math.round(t * 1000)}`, { layer: "dims" });
    const side = sheet.view("side", { at: [0, -(r * n) - 2.2], title: "Elevation 1:50", project: { right: new Vec3(1, 0, 0), up: new Vec3(0, 0, 1) } });
    const profile: Vec3[] = [new Vec3(0, 0, 0)];
    for (let i = 0; i < n; i++) profile.push(new Vec3(t * i, 0, r * (i + 1)), new Vec3(t * (i + 1), 0, r * (i + 1)));
    profile.push(new Vec3(t * n, 0, 0));
    side.polyline(profile, { layer: "cut", closed: true, fill: "#dddddd" });
    side.dim(new Vec3(t * n, 0, 0), new Vec3(t * n, 0, r * n), { layer: "dims", offset: -8 });
    side.level(new Vec3(-0.5, 0, 0), { layer: "dims" });
    side.level(new Vec3(-0.5, 0, r * n), { layer: "dims" });

    sheetView ??= new SheetCanvas(lab.overlay());
    sheetView.setSheet(sheet);
    lab.overlay().style.display = drawing.value ? "" : "none";
    lab.log("Going", `${(t * n).toFixed(2)} m`);
    lab.log("Height", `${(r * n).toFixed(2)} m`);
  }, { container, title: "Sketch + drawing", up: "z", camera: [6, -5, 4], target: [1.6, 0.6, 1] });
}
