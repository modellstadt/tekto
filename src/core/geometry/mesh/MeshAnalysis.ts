/**
 * Tekto MeshAnalysis — Mesh measurement and processing algorithms.
 *
 * Mirrors HDGEO.Core.MeshAnalysis.
 */

import { Vec3 } from "../../math/vectors";
import { ConnectedMesh } from "./ConnectedMesh";

export const MeshAnalysis = {

  /** Compute mesh volume (for closed, consistent-winding triangle meshes) */
  meshVolume(mesh: ConnectedMesh): number {
    let volume = 0;
    for (const face of mesh.faces()) {
      if (face.nodes.length !== 3) continue;
      const a = mesh.node(face.nodes[0])!.position;
      const b = mesh.node(face.nodes[1])!.position;
      const c = mesh.node(face.nodes[2])!.position;
      volume += a.dot(b.cross(c)) / 6;
    }
    return Math.abs(volume);
  },

  /** Compute mesh surface area */
  meshSurfaceArea(mesh: ConnectedMesh): number {
    let area = 0;
    for (const face of mesh.faces()) {
      if (face.nodes.length < 3) continue;
      const positions = face.nodes.map(n => mesh.node(n)!.position);
      for (let i = 1; i < positions.length - 1; i++) {
        area += positions[i].sub(positions[0]).cross(positions[i + 1].sub(positions[0])).len() * 0.5;
      }
    }
    return area;
  },

  /** Mesh centroid (vertex average) */
  meshCentroid(mesh: ConnectedMesh): Vec3 {
    let sum = Vec3.zero();
    let count = 0;
    for (const node of mesh.nodes()) {
      sum = sum.add(node.position);
      count++;
    }
    return count > 0 ? sum.div(count) : Vec3.zero();
  },

  /** Laplacian smooth (moves each vertex toward the average of its neighbors) */
  laplacianSmooth(mesh: ConnectedMesh, iterations = 1, factor = 0.5): void {
    for (let iter = 0; iter < iterations; iter++) {
      const newPositions = new Map<number, Vec3>();
      for (const node of mesh.nodes()) {
        const neighbors = mesh.nodeNeighbors(node.id);
        if (neighbors.length === 0 || mesh.isBoundaryNode(node.id)) {
          newPositions.set(node.id, node.position);
          continue;
        }
        const avg = neighbors
          .map(nid => mesh.node(nid)!.position)
          .reduce((s, p) => s.add(p), Vec3.zero())
          .div(neighbors.length);
        newPositions.set(node.id, node.position.lerp(avg, factor));
      }
      for (const [id, pos] of newPositions) {
        const node = mesh.node(id)!;
        (node as any).position = pos;
      }
    }
    mesh.computeVertexNormals();
  },

  /** 3D Convex hull — returns a ConnectedMesh */
  convexHull3D(points: Vec3[]): ConnectedMesh {
    if (points.length < 4) return new ConnectedMesh();

    const mesh = new ConnectedMesh();
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
