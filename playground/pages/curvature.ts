/**
 * Curvature — Taubin per-vertex principal direction visualization.
 *
 * Pipeline step 1 of the curvature-following hatching project: validate that
 * the curvature pass produces a coherent direction field before building
 * streamline tracing / hidden-line rendering on top.
 *
 * Each vertex gets a short segment along its principal direction(s).
 * Toggle the greedy comb to see the raw (signed-arbitrary) field vs. the
 * sign-aligned field.
 */
import {
  sketch, SketchInstance,
  MeshFactory, MeshAnalysis, MeshCleanup, Curvature,
  Vec3,
} from "../../src";
import type { ConnectedMesh } from "../../src";

type ShapeName = "sphere" | "torus" | "subdivided box" | "wavy grid";

function buildMesh(shape: ShapeName, detail: number): ConnectedMesh {
  let m: ConnectedMesh;
  switch (shape) {
    case "sphere":
      m = MeshFactory.sphere(1, 8 + detail * 4, 6 + detail * 3);
      break;
    case "torus":
      m = MeshFactory.torus(1, 0.35, 16 + detail * 8, 8 + detail * 4);
      break;
    case "subdivided box": {
      m = MeshFactory.box(1.4, 1.4, 1.4);
      for (let i = 0; i < detail; i++) m = MeshFactory.subdivide(m);
      MeshAnalysis.laplacianSmooth(m, 2, 0.5);
      break;
    }
    case "wavy grid": {
      const div = 16 + detail * 8;
      m = MeshFactory.grid(2.4, 2.4, div, div,
        (x, z) => 0.25 * Math.sin(2 * x) * Math.cos(2 * z));
      break;
    }
  }
  // Weld the lat/lon longitude seam in sphere/torus so the comb propagates
  // continuously across the +X meridian. Epsilon weld (not binary-equal merge)
  // because cos(2π) isn't bit-equal to cos(0).
  MeshCleanup.weldVertices(m, 1e-6);
  return m;
}

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const shape = lab.select("Shape",
      ["sphere", "torus", "subdivided box", "wavy grid"] as const, "torus");
    const detail = lab.slider("Detail", 0, 3, 1, { step: 1 });
    const segLen = lab.slider("Segment length", 0.01, 0.3, 0.08);
    const showMax = lab.toggle("Show kMax (red)", true);
    const showMin = lab.toggle("Show kMin (cyan)", true);
    const showMesh = lab.toggle("Show mesh", true);
    const comb = lab.toggle("Greedy comb (sign-align)", false);
    const colorByMag = lab.toggle("Color by curvature magnitude", true);

    const mesh = buildMesh(shape.value, detail.value);

    if (showMesh.value) {
      lab.mesh(mesh).color(lab.rgb(40, 44, 60)).opacity(0.85);
    }

    const curvatures = Curvature.taubin(mesh);
    if (comb.value) Curvature.combDirections(mesh, curvatures);

    // Stats for the legend
    let kMaxAbs = 0, kMinAbs = 0;
    let sumMean = 0, sumGauss = 0, nValid = 0;
    for (const c of curvatures.values()) {
      if (c.isBoundary) continue;
      kMaxAbs = Math.max(kMaxAbs, Math.abs(c.kMax));
      kMinAbs = Math.max(kMinAbs, Math.abs(c.kMin));
      sumMean += c.meanCurvature;
      sumGauss += c.gaussCurvature;
      nValid++;
    }
    const normMax = kMaxAbs > 1e-6 ? kMaxAbs : 1;
    const normMin = kMinAbs > 1e-6 ? kMinAbs : 1;

    // Per-vertex segments
    const half = segLen.value * 0.5;
    for (const node of mesh.nodes()) {
      const c = curvatures.get(node.id);
      if (!c || c.isBoundary) continue;
      const p = node.position;

      if (showMax.value) {
        const a = p.sub(c.dirMax.mul(half));
        const b = p.add(c.dirMax.mul(half));
        const t = colorByMag.value
          ? Math.min(1, Math.abs(c.kMax) / normMax)
          : 1;
        const col = lab.rgb(
          Math.round(80 + t * 175),
          Math.round(30 + t * 50),
          Math.round(40 + t * 40),
        );
        lab.line(a.x, a.y, a.z, b.x, b.y, b.z).color(col).radius(0.006);
      }

      if (showMin.value) {
        const a = p.sub(c.dirMin.mul(half));
        const b = p.add(c.dirMin.mul(half));
        const t = colorByMag.value
          ? Math.min(1, Math.abs(c.kMin) / normMin)
          : 1;
        const col = lab.rgb(
          Math.round(30 + t * 40),
          Math.round(120 + t * 100),
          Math.round(160 + t * 80),
        );
        lab.line(a.x, a.y, a.z, b.x, b.y, b.z).color(col).radius(0.006);
      }
    }

    // Reference curvature (analytic) for known shapes
    let analytic = "";
    if (shape.value === "sphere") {
      analytic = "expected k1 = k2 = 1.000  (radius 1)";
    } else if (shape.value === "torus") {
      analytic = "expected k1 ≈ 1/0.35 ≈ 2.857  (minor),  k2 ranges over [-3.077 .. +0.741]";
    }

    lab.info("Taubin curvature pass — step 1 of the hatching pipeline.");
    lab.log("Vertices", mesh.nodeCount);
    lab.log("Faces", mesh.faceCount);
    lab.log("max |kMax|", kMaxAbs.toFixed(3));
    lab.log("max |kMin|", kMinAbs.toFixed(3));
    if (nValid > 0) {
      lab.log("mean H", (sumMean / nValid).toFixed(3));
      lab.log("mean K", (sumGauss / nValid).toFixed(3));
    }
    if (analytic) lab.info(analytic);
    lab.info("Red = kMax direction.  Cyan = kMin direction.");
    lab.info("Toggle the greedy comb to flip signs into a coherent field.");
  }, {
    container,
    title: "Curvature (Taubin)",
    background: 0x0a0b14,
    camera: [2.8, 2.2, 3.5],
    target: [0, 0, 0],
  });
}
