/**
 * DXF Hidden-Line Test — visualize edge classification and occlusion
 * by drawing projected segments as lab.line() in 3D space.
 */
import { sketch, Vec3, DxfExporter, SketchInstance } from "../../src";
import type { Lab, DxfSegment } from "../../src";

const LAYER_COLORS: Record<string, string> = {
  visible: "#00ff00", occluded: "#ff3333", feature: "#4488ff",
  boundary: "#ffcc00", silhouette: "#00cccc", test: "#888888",
};

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab: Lab) => {
    const segs = lab.slider("Segments", 4, 24, 6, { step: 1 }).value;
    const doDxf = lab.toggle("DXF Debug", true).value;
    const viewChoice = lab.slider("View", 0, 1, 0, { step: 1 }).value;
    const showLayer = lab.slider("Layer 0=all 1=feat 2=vis 3=occ", 0, 3, 0, { step: 1 }).value;

    // Geometry
    lab.sphere(2, segs, Math.max(3, Math.floor(segs / 2))).color(lab.rgb(100, 180, 255));
    lab.log("segs", `${segs}`);

    if (!doDxf) return;

    // Build DXF exporter from scene
    const md = lab.getScene().toMeshData();
    if (md.positions.length === 0) return;
    const pos = new Float32Array(md.positions.length * 3);
    for (let i = 0; i < md.positions.length; i++) {
      pos[i * 3] = md.positions[i].x;
      pos[i * 3 + 1] = md.positions[i].y;
      pos[i * 3 + 2] = md.positions[i].z;
    }
    const tris: number[] = [];
    for (const face of md.faces)
      for (let i = 1; i < face.length - 1; i++) tris.push(face[0], face[i], face[i + 1]);

    const exp = new DxfExporter();
    exp.layer({ name: "test", color: 7 });
    // featureAngle: -1 → include ALL edges regardless of dihedral angle
    exp.addMesh(pos, new Uint32Array(tris), { layer: "test", featureAngle: -1 });

    const edgeInfo = (exp as any)._edges as { kind?: string }[];
    const nBound = edgeInfo.filter(e => e.kind === "boundary").length;
    const nFeat = edgeInfo.filter(e => e.kind === "feature").length;
    lab.log("edges", `${edgeInfo.length} (${nBound} bnd, ${nFeat} feat)`);

    // Front=looking along -Z, Side=looking along -X.
    const viewDir = viewChoice === 0 ? new Vec3(0, 0, -1) : new Vec3(-1, 0, 0);
    const upDir = new Vec3(0, 1, 0);

    let debugSegs: DxfSegment[] = [];
    try {
      const t0 = performance.now();
      debugSegs = exp.toSegments({ viewDir, upDir }, { debugLayers: true });
      const dt = (performance.now() - t0).toFixed(1);
      lab.log("time", `${dt}ms`);
    } catch (e: any) {
      lab.log("ERR", e.message);
    }

    // Count per layer
    const counts: Record<string, number> = {};
    for (const s of debugSegs) counts[s.layer] = (counts[s.layer] ?? 0) + 1;
    for (const [k, v] of Object.entries(counts)) lab.log(k, `${v}`);

    // Filter by selected layer
    const layerFilter = ["", "feature", "visible", "occluded"][showLayer];

    // Draw projected segments as lines in the XY plane, offset to the right
    const offset = 5;
    for (const s of debugSegs) {
      if (layerFilter && s.layer !== layerFilter) continue;
      if (!isFinite(s.u0) || !isFinite(s.v0) || !isFinite(s.u1) || !isFinite(s.v1)) continue;
      const color = LAYER_COLORS[s.layer] ?? "#888";
      lab.line(
        s.u0 + offset, s.v0, 0,
        s.u1 + offset, s.v1, 0,
      ).color(color);
    }

  }, {
    container,
    title: "DXF Test",
    background: 0x0a0b14,
    camera: [8, 6, 10],
    target: [2, 0, 0],
  });
}
