/**
 * Sketch + drawing — a `sketch()` that shows its model in 3D and, at the flick of a toggle,
 * as a dimensioned drawing laid over the viewport (`lab.overlay()` + `SheetCanvas`). The
 * shape of an app like the stair: one function builds the model, and the drawing is drawn
 * from the same numbers, so the plan, the section, the DXF and the 3D view can't disagree.
 *
 * The stair is a `Stair` built as timber, steel or concrete: the 3D view shows its flights,
 * and the section along its middle draws the profiles of the same parts (`stair.parts()`) —
 * what the cut goes through filled, the stringers beyond it as seen lines.
 */
import {
  sketch, Mesh, Sheet, DRAWING_PALETTE, SheetCanvas, Stair, Vec2, Vec3, download,
  type SketchInstance, type StairStructure,
} from "../../src";

const MATERIAL: Record<StairStructure, { colour: string; fill: string }> = {
  timber: { colour: "#c9a27a", fill: DRAWING_PALETTE.timber },
  steel: { colour: "#5d6166", fill: DRAWING_PALETTE.steel },
  concrete: { colour: "#c4c2bc", fill: DRAWING_PALETTE.concrete },
  solid: { colour: "#c9b79c", fill: DRAWING_PALETTE.poche },
};
const SLAB = 0.25;                                   // the floor the stair arrives at, drawn in the section

export default function (container: HTMLElement): SketchInstance {
  let sheetView: SheetCanvas | null = null;          // made once, kept across re-runs
  let sheet = new Sheet();

  return sketch((lab) => {
    const risers = lab.slider("Risers", 4, 20, 12, { step: 1 });
    const rise = lab.slider("Rise (m)", 0.14, 0.2, 0.175, { step: 0.005 });
    const going = lab.slider("Going (m)", 0.22, 0.34, 0.28, { step: 0.01 });
    const width = lab.slider("Width (m)", 0.8, 2, 1.2, { step: 0.05 });
    const structure = lab.select("Structure", ["timber", "steel", "concrete", "solid"], "timber");
    const drawing = lab.toggle("Drawing", false);
    lab.button("Export DXF", () => download(sheet.toDXF(), "stair.dxf", { stamp: true }));

    // ── The model: a stair from the floor to the floor above, Z-up, along +X ──
    const n = risers.value, r = rise.value, g = going.value, w = width.value;
    const kind = structure.value as StairStructure;
    const stair = new Stair({
      name: "Stair", start: new Vec3(0, w / 2, 0), direction: new Vec2(1, 0), width: w,
      totalRise: n * r, riserHeight: r, treadDepth: g, structure: kind,
    });
    for (const f of stair.flights()) lab.mesh(new Mesh(f.positions, f.indices)).color(MATERIAL[kind].colour);
    const L = (n - 1) * g, H = n * r;

    // ── The drawing, from the same stair ──
    sheet = new Sheet({
      scale: 50,
      layers: {
        cut: { weight: 0.5 },
        view: { weight: 0.18 },
        floor: { weight: 0.5 },
        dims: { weight: 0.13, color: DRAWING_PALETTE.annotation },
        axis: { weight: 0.13, dash: "center", color: DRAWING_PALETTE.faint },
      },
    });
    const plan = sheet.view("plan", { title: "Plan" });
    plan.rect(0, 0, L, w, { layer: "view" });
    for (let i = 1; i < n - 1; i++) plan.line([i * g, 0], [i * g, w], { layer: "view" });
    plan.line([-0.6, w / 2], [L + 0.6, w / 2], { layer: "axis" });                  // the section line A-A
    plan.text("A", [-0.75, w / 2], { layer: "dims", align: "right", baseline: "middle" });
    plan.dim([0, 0], [L, 0], { layer: "dims", offset: -8 });
    plan.dim([L, 0], [L, w], { layer: "dims", offset: -8 });
    plan.leader([[g * 0.5, w * 0.75], [g * 0.5 + 0.3, w + 0.35], [L * 0.45, w + 0.35]], `${n} risers ${Math.round(r * 1000)}/${Math.round(g * 1000)}, ${kind}`, { layer: "dims" });

    // Section A-A along the stair's middle: what the cut goes through filled, the rest seen beyond.
    const section = sheet.view("section", { at: [0, -H - 2.4], title: "Section A-A" });
    const [flight] = stair.parts();
    const cut = (across: [number, number]) => across[0] < 0 && across[1] > 0;
    for (const part of flight.parts.filter((p) => !cut(p.across))) {
      section.polyline(part.outline.map((p) => [p.x, p.y] as [number, number]), { layer: "view", closed: true });
    }
    for (const part of flight.parts.filter((p) => cut(p.across))) {
      section.polyline(part.outline.map((p) => [p.x, p.y] as [number, number]), { layer: "cut", closed: true, fill: MATERIAL[kind].fill });
    }
    section.line([-1, 0], [L + 1.2, 0], { layer: "floor" });                           // the floor it starts on
    section.rect(L, H - SLAB, 1.2, SLAB, { layer: "cut", fill: DRAWING_PALETTE.poche });  // the floor above
    section.dim([L + 1.2, 0], [L + 1.2, H], { layer: "dims", offset: -8 });
    section.level([-0.6, 0], { layer: "dims" });
    section.level([-0.6, H], { layer: "dims" });

    sheetView ??= new SheetCanvas(lab.overlay());
    sheetView.setSheet(sheet);
    lab.overlay().style.display = drawing.value ? "" : "none";
    lab.log("Going", `${L.toFixed(2)} m`);
    lab.log("Height", `${H.toFixed(2)} m`);
  }, { container, title: "Sketch + drawing", up: "z", camera: [6, -5, 4], target: [1.6, 0.6, 1] });
}
