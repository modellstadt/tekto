/**
 * Roofs — the four `Roof` kinds over a 10 × 8 m house: flat, shed, gable and hip. The
 * walls have one height (the eaves); the roof gives the infill above the end walls
 * (`roof.gables(t)`). Export IFC writes an IfcRoof of roof slabs and the gables as walls.
 *
 *   sliders   kind, pitch, the overhangs at the eaves and the gables, the build-up
 */
import { appShell, download, IfcWriter, Roof, Vec2, Wall, type RoofKind } from "../../src";

const LENGTH = 10, WIDTH = 8, EAVES = 3, WALL = 0.3;
const FOOTPRINT = [new Vec2(0, 0), new Vec2(LENGTH, 0), new Vec2(LENGTH, WIDTH), new Vec2(0, WIDTH)];

/** The walls up to the eaves, inside the footprint: the long ones run through the corners. */
function walls(): Wall[] {
  const h = WALL / 2;
  return [
    [[0, h], [LENGTH, h]], [[LENGTH, WIDTH - h], [0, WIDTH - h]],
    [[LENGTH - h, WALL], [LENGTH - h, WIDTH - WALL]], [[h, WIDTH - WALL], [h, WALL]],
  ].map(([a, b], i) => new Wall({ centerline: [new Vec2(a[0], a[1]), new Vec2(b[0], b[1])], thickness: WALL, height: EAVES, name: `Wall ${i + 1}` }));
}

export default function (container: HTMLElement) {
  let roof: Roof | null = null;

  const app = appShell({
    title: "Roofs",
    container,
    topBar: true,
    navGizmo: true,
    shadingBar: true,
    units: "m",
    camera: [19, -13, 13],
    target: [5, 4, 3],
    params: {
      kind: { type: "select", options: ["gable", "hip", "shed", "flat"], default: "gable", label: "Kind" },
      pitch: { type: "float", min: 5, max: 60, default: 35, step: 1, label: "Pitch °" },
      overhang: { type: "float", min: 0, max: 1.5, default: 0.6, step: 0.05, label: "Eaves overhang" },
      gableOverhang: { type: "float", min: 0, max: 1.5, default: 0.3, step: 0.05, label: "Gable overhang" },
      thickness: { type: "float", min: 0.1, max: 0.5, default: 0.3, step: 0.01, label: "Build-up" },
      ifc: { type: "button", label: "Export IFC", action: () => exportIfc() },
    },
    groups: {
      Roof: ["kind", "pitch", "overhang", "gableOverhang", "thickness"],
      File: ["ifc"],
    },
  });

  app.onBuild(() => {
    app.scene.clear();
    const p = app.params;
    roof = new Roof({
      kind: p.get("kind") as RoofKind, footprint: FOOTPRINT, eavesElevation: EAVES, pitch: p.get("pitch"),
      overhang: p.get("overhang"), gableOverhang: p.get("gableOverhang"), thickness: p.get("thickness"), name: "Roof",
    });
    walls().forEach((w, i) => app.scene.withKey(`walls/${i}`, () => app.scene.addMesh(w.toMesh(), { color: "#e4e1da", label: w.name, layer: "walls" })));
    roof.gables(WALL).forEach((g, i) => app.scene.withKey(`gables/${i}`, () => app.scene.addMesh(g.mesh, { color: "#d8d2c6", label: g.name, layer: "gables" })));
    roof.planes().forEach((plane, i) => app.scene.withKey(`planes/${i}`, () => app.scene.addMesh(plane.mesh, { color: "#9a5b45", label: plane.name, layer: "roof" })));
  });

  app.onDisplay(() => {
    if (!roof) return;
    const area = roof.planes().reduce((s, p) => s + p.area, 0);
    app.status(`${roof.kind} · ridge +${roof.ridgeHeight().toFixed(2)} m · ${area.toFixed(1)} m² of roof · ${roof.gables(WALL).length} gable infills`);
  });

  function exportIfc() {
    if (!roof) return;
    const ifc = new IfcWriter({ projectName: "Roofs" });
    const ground = ifc.getDefaultStorey();
    for (const w of walls()) ifc.addWall(w, { storey: ground });
    ifc.addRoof(roof, { storey: ground, gableThickness: WALL });
    download(ifc.save(), `roof-${roof.kind}.ifc`, { stamp: true });
  }

  app.rebuild();

  // For agents and tests: the roof as built.
  (window as unknown as { roofs: unknown }).roofs = { get roof() { return roof; } };

  return { dispose() { app.dispose(); } };
}
