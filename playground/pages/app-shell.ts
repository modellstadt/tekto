/**
 * App Shell — the retained-model harness: params declared once, geometry built in
 * `onBuild`, restyled in `onDisplay`, objects added to a Scene the app owns.
 *
 * A twisting tower of floor slabs, Z-up (the appShell default and the CAD convention).
 * Changing a build param regenerates the slabs; the colour is a display param and only
 * restyles them. `snap` works here too: window.__tekto comes with every harness.
 */
import { appShell, MeshFactory, MeshTransform, Vec3 } from "../../src";

export default function (container: HTMLElement) {
  const app = appShell({
    title: "App Shell",
    container,
    topBar: true,               // the shell's own bar: light, mode, camera, cut, sun
    navGizmo: true,             // the axis widget: plans and elevations a click away
    camera: [14, -16, 12],
    target: [0, 0, 4],
    params: {
      floors: { type: "int",   min: 2, max: 40, default: 12, label: "Floors" },
      height: { type: "float", min: 0.2, max: 1.5, default: 0.7, step: 0.05, label: "Floor Height" },
      size:   { type: "float", min: 1, max: 8, default: 4, step: 0.1, label: "Slab Size" },
      twist:  { type: "float", min: 0, max: 180, default: 60, step: 1, label: "Twist (°)" },
      color:  { type: "color", default: "#cfd8dc", label: "Color", display: true },
    },
    groups: { Tower: ["floors", "height", "size", "twist"], Display: ["color"] },
  });

  const slabs: string[] = [];

  app.onBuild(() => {
    app.scene.clear();
    slabs.length = 0;
    const floors = app.params.get("floors") as number;
    const h = app.params.get("height") as number;
    const size = app.params.get("size") as number;
    const twist = ((app.params.get("twist") as number) * Math.PI) / 180;
    for (let i = 0; i < floors; i++) {
      const slab = MeshFactory.box(size, size * 0.6, 0.12);          // Z-up: thickness along z
      MeshTransform.rotate(slab, new Vec3(0, 0, 1), (twist * i) / Math.max(1, floors - 1));
      slab.translate(0, 0, i * h);
      slabs.push(app.scene.addMesh(slab, { label: `floor ${i + 1}`, layer: "slab" }).id);
    }
    app.status(`${floors} floors · ${(floors * h).toFixed(1)} m`);
  });

  app.onDisplay(() => {
    const color = app.params.get("color") as string;
    for (const id of slabs) app.scene.setStyle(id, { color });
  });

  app.rebuild();
  return app;
}
