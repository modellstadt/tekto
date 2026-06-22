/**
 * Planar Graph — DCEL from random line segments + Delaunay triangulation.
 * Port of HDGEO PlanarGraphTestPage.
 */
import {
  sketch, SketchInstance, Vec2, Vec3,
  PlanarGraph, PlanarGraphRepair, PlanarGraphCleanup, Delaunay2D,
} from "../../src";

const FACE_PALETTE: [number, number, number, number][] = [
  [0.35, 0.55, 0.85, 1],   // blue
  [0.30, 0.75, 0.45, 1],   // green
  [0.85, 0.45, 0.30, 1],   // orange
  [0.70, 0.40, 0.80, 1],   // purple
  [0.25, 0.70, 0.75, 1],   // teal
  [0.85, 0.70, 0.25, 1],   // yellow
  [0.55, 0.30, 0.65, 1],   // dark violet
  [0.40, 0.80, 0.55, 1],   // mint
  [0.80, 0.35, 0.55, 1],   // rose
  [0.45, 0.60, 0.30, 1],   // olive
];

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const scene = lab.select("Scene", ["Random Segments", "Delaunay"]);
    const seed = lab.slider("Seed", 0, 1000, 42, { step: 1 });
    const showFaces = lab.toggle("Show Faces", true);

    // Seeded random
    let s = seed.value | 0;
    function rand(): number {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    }

    let graph: PlanarGraph;
    let buildMs: number;

    if (scene.value === "Random Segments") {
      const segCount = lab.slider("Segments", 5, 200, 20, { step: 1 });
      const removeDeadEnds = lab.toggle("Remove Dead Ends", true);

      const range = 4;
      const segments: { a: Vec2; b: Vec2 }[] = [];
      for (let i = 0; i < segCount.value; i++) {
        segments.push({
          a: new Vec2(rand() * range * 2 - range, rand() * range * 2 - range),
          b: new Vec2(rand() * range * 2 - range, rand() * range * 2 - range),
        });
      }

      const t0 = performance.now();
      graph = PlanarGraphRepair.fromSegments(segments, 0.05);
      if (removeDeadEnds.value) PlanarGraphCleanup.removeDeadEnds(graph);
      graph.buildFaces();
      graph.removeNegativeFaces();
      buildMs = performance.now() - t0;

      // Draw original input segments (dim) for reference
      for (const seg of segments) {
        lab.line(seg.a.x, 0.005, seg.a.y, seg.b.x, 0.005, seg.b.y)
          .color(lab.rgb(80, 80, 100)).opacity(0.3);
      }

    } else {
      const pointCount = lab.slider("Points", 4, 200, 30, { step: 1 });
      const range = 4;
      const points: Vec2[] = [];
      for (let i = 0; i < pointCount.value; i++) {
        points.push(new Vec2(rand() * range * 2 - range, rand() * range * 2 - range));
      }

      const t0 = performance.now();
      graph = Delaunay2D.triangulate(points);
      buildMs = performance.now() - t0;
    }

    // Draw faces
    if (showFaces.value && graph.faces.length > 0) {
      const fm = graph.toFlatMesh((_face, fi) => FACE_PALETTE[fi % FACE_PALETTE.length]);
      if (fm.triangleCount > 0) {
        lab.flatMesh({
          positions: fm.positions,
          normals:   fm.normals,
          indices:   fm.indices,
          colors:    fm.colors ?? undefined,
        }).doubleSided(true);
      }
    }

    // Draw edges (bright white; polygonOffset on solid material handles depth)
    const edgePositions = graph.getEdgePositions3D();
    for (let i = 0; i < edgePositions.length; i += 2) {
      const a = edgePositions[i], b = edgePositions[i + 1];
      lab.line(a.x, 0.01, a.z, b.x, 0.01, b.z).color(lab.rgb(255, 255, 255));
    }

    // Draw vertices
    for (const v of graph.vertices) {
      lab.point(v.position.x, 0.02, v.position.y)
        .color(lab.rgb(255, 200, 80)).size(0.04);
    }

    // Info
    lab.log("Vertices", graph.vertices.length.toString());
    lab.log("Edges", graph.getUniqueEdges().length.toString());
    lab.log("Faces", graph.faces.length.toString());
    lab.log("Build", `${buildMs.toFixed(1)} ms`);
  }, { container });
}
