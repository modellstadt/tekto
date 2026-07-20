/**
 * DXF 3D Writer — exercises `writeDxf3D`, tekto's true-3D DXF export (3D POLYLINE + CIRCLE + ARC +
 * POINT in world space), as opposed to DxfExporter's projected 2D hidden-line views. Build a helix,
 * preview it, and download an AutoCAD-safe R12 DXF.
 */
import { sketch, Vec3, writeDxf3D, SketchInstance } from "../../src";
import type { Dxf3DArc, Dxf3DCircle, Dxf3DLine, Dxf3DPoint, Dxf3DPolyline } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const turns  = lab.slider("Turns", 1, 8, 4, { step: 0.5 }).value;
    const perT   = lab.slider("Points / turn", 8, 64, 32, { step: 1 }).value;
    const radius = lab.slider("Radius", 0.5, 4, 2).value;
    const height = lab.slider("Height", 1, 8, 5).value;

    // Helix as a 3D polyline (Z-up world space).
    const n = Math.max(2, Math.round(turns * perT));
    const helix: Vec3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = t * turns * Math.PI * 2;
      helix.push(new Vec3(radius * Math.cos(a), radius * Math.sin(a), t * height));
    }
    lab.beginShape("line_strip");
    for (const p of helix) lab.vertex(p.x, p.y, p.z);
    lab.endShape()?.color("#5090ff");

    // Base + top rings — exported as full CIRCLEs; drawn here as line strips for preview.
    const ringZ = [0, height];
    for (const z of ringZ) {
      lab.beginShape("line_strip");
      for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; lab.vertex(radius * Math.cos(a), radius * Math.sin(a), z); }
      lab.endShape()?.color("#ff5a5a");
    }

    // A partial sweep at mid-height (30°→150°) — exported as an ARC.
    const arcZ = height / 2, a0 = 30, a1 = 150;
    lab.beginShape("line_strip");
    for (let i = 0; i <= 24; i++) { const a = (a0 + (a1 - a0) * i / 24) * Math.PI / 180; lab.vertex(radius * Math.cos(a), radius * Math.sin(a), arcZ); }
    lab.endShape()?.color("#50ff90");

    // Central axis — exported as a single LINE.
    lab.line(0, 0, 0, 0, 0, height).color("#aaaaaa");

    // End nodes.
    lab.point(helix[0].x, helix[0].y, helix[0].z).color("#ffe000").size(0.12);
    lab.point(helix[n].x, helix[n].y, helix[n].z).color("#ffe000").size(0.12);

    lab.info("Helix → DXF 3D POLYLINE");
    lab.info("Rings → DXF CIRCLEs");
    lab.info("Sweep → DXF ARC");
    lab.info("Axis → DXF LINE");
    lab.info("Ends → DXF POINTs");
    lab.log("helix", `${helix.length} vertices`);

    lab.button("Export 3D DXF", () => {
      const polylines: Dxf3DPolyline[] = [{ layer: "helix", points: helix }];
      const linesOut: Dxf3DLine[] = [{ layer: "axis", start: new Vec3(0, 0, 0), end: new Vec3(0, 0, height) }];
      const circles: Dxf3DCircle[] = ringZ.map(z => ({ layer: "rings", center: new Vec3(0, 0, z), radius }));
      const arcs: Dxf3DArc[] = [{ layer: "arc", center: new Vec3(0, 0, arcZ), radius, startDeg: a0, endDeg: a1 }];
      const points: Dxf3DPoint[] = [{ layer: "nodes", position: helix[0] }, { layer: "nodes", position: helix[n] }];
      const dxf = writeDxf3D({
        polylines, lines: linesOut, circles, arcs, points,
        layers: [
          { name: "helix", color: 5 }, // blue
          { name: "rings", color: 1 }, // red
          { name: "arc",   color: 3 }, // green
          { name: "axis",  color: 8 }, // grey
          { name: "nodes", color: 2 }, // yellow
        ],
      });
      const blob = new Blob([dxf], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "tekto_helix_3d.dxf";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }, { group: "Export" });
  }, {
    container,
    title: "DXF 3D Writer",
    background: 0x0a0b14,
    camera: [8, 8, 8],
    target: [0, 0, 2.5],
  });
}
