/**
 * Tekto MeshAnalysis — Mesh measurement and processing algorithms.
 *
 * Mirrors HDGEO.Core.MeshAnalysis.
 */

import { Vec3 } from "../../math/vectors";
import { Mesh } from "./Mesh";

export const MeshAnalysis = {

  /** Mesh volume (closed, consistently wound; polygons are fan-triangulated). */
  meshVolume(mesh: Mesh): number { return mesh.volume(); },

  /** Mesh surface area. */
  meshSurfaceArea(mesh: Mesh): number { return mesh.surfaceArea(); },

  /** Mesh centroid (vertex average). */
  meshCentroid(mesh: Mesh): Vec3 { return mesh.centroid(); },

  /** Laplacian smooth (moves each interior vertex toward the average of its neighbors). */
  laplacianSmooth(mesh: Mesh, iterations = 1, factor = 0.5): void {
    mesh.smooth(iterations, factor);
  },

  /** 3D Convex hull — returns a Mesh */
  convexHull3D(points: Vec3[]): Mesh {
    if (points.length < 4) return new Mesh();

    const mesh = new Mesh();
    const ids = mesh.addNodes(points);

    // Find non-coplanar initial 4 points
    let i0 = 0, i1 = 1, i2 = -1, i3 = -1;

    for (let i = 2; i < points.length; i++) {
      const cross = points[i1].sub(points[i0]).cross(points[i].sub(points[i0]));
      if (cross.len() > 1e-8) { i2 = i; break; }
    }
    if (i2 === -1) return mesh;

    const testNormal = points[i1].sub(points[i0]).cross(points[i2].sub(points[i0])).normalize();
    for (let i = 0; i < points.length; i++) {
      if (i === i0 || i === i1 || i === i2) continue;
      const d = Math.abs(points[i].sub(points[i0]).dot(testNormal));
      if (d > 1e-8) { i3 = i; break; }
    }
    if (i3 === -1) return mesh;

    // Build initial tetrahedron
    const d = points[i3].sub(points[i0]).dot(testNormal);
    if (d > 0) {
      mesh.addTriangle(ids[i0], ids[i2], ids[i1]);
      mesh.addTriangle(ids[i0], ids[i1], ids[i3]);
      mesh.addTriangle(ids[i1], ids[i2], ids[i3]);
      mesh.addTriangle(ids[i2], ids[i0], ids[i3]);
    } else {
      mesh.addTriangle(ids[i0], ids[i1], ids[i2]);
      mesh.addTriangle(ids[i0], ids[i3], ids[i1]);
      mesh.addTriangle(ids[i1], ids[i3], ids[i2]);
      mesh.addTriangle(ids[i2], ids[i3], ids[i0]);
    }

    // Incrementally add remaining points
    const used = new Set([i0, i1, i2, i3]);
    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue;
      const p = points[i];

      mesh.computeFaceNormals();
      const visible: number[] = [];
      for (const face of mesh.faces()) {
        if (!face.normal) continue;
        const centroid = face.nodes
          .map(nid => mesh.node(nid)!.position)
          .reduce((s, v) => s.add(v), Vec3.zero())
          .div(face.nodes.length);
        if (p.sub(centroid).dot(face.normal) > 1e-8) {
          visible.push(face.id);
        }
      }

      if (visible.length === 0) continue;
      used.add(i);

      // Find horizon edges
      const edgeVisCount = new Map<number, number>();
      for (const fid of visible) {
        const face = mesh.face(fid)!;
        for (const eid of face.edges) {
          edgeVisCount.set(eid, (edgeVisCount.get(eid) || 0) + 1);
        }
      }

      const horizon: number[] = [];
      for (const [eid, count] of edgeVisCount) {
        if (count === 1) horizon.push(eid);
      }

      // Remove visible faces
      for (const fid of visible) mesh.removeFace(fid);

      // Create new faces from horizon edges to new point
      const pid = ids[i];
      for (const eid of horizon) {
        const edge = mesh.edge(eid);
        if (!edge) continue;
        let a = edge.nodes[0], b = edge.nodes[1];
        const survivingFace = edge.faces.length > 0 ? mesh.face(edge.faces[0]) : undefined;
        if (survivingFace) {
          const nl = survivingFace.nodes;
          for (let si = 0; si < nl.length; si++) {
            if (nl[si] === edge.nodes[0] && nl[(si + 1) % nl.length] === edge.nodes[1]) {
              a = edge.nodes[1]; b = edge.nodes[0];
              break;
            }
          }
        }
        mesh.addTriangle(a, b, pid);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },
};
