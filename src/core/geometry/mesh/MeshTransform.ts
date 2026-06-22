/**
 * Tekto MeshTransform — Geometric transformations on ConnectedMesh.
 *
 * Mirrors HDGEO.Core.MeshTransform.
 */

import { Vec3, Mat4 } from "../../math/vectors";
import type { ConnectedMesh } from "./ConnectedMesh";

export type Axis = "x" | "y" | "z";

export const MeshTransform = {

  // ================================================================
  // AFFINE TRANSFORMS
  // ================================================================

  /** Applies an arbitrary 4x4 matrix to all vertex positions. */
  transform(mesh: ConnectedMesh, matrix: Mat4): void {
    for (const node of mesh.nodes()) {
      node.position = matrix.transformPoint(node.position);
    }
    mesh.computeVertexNormals();
  },

  /** Translates all vertices by an offset vector. */
  translate(mesh: ConnectedMesh, offset: Vec3): void {
    for (const node of mesh.nodes()) {
      node.position = node.position.add(offset);
    }
  },

  /** Uniform scale around origin. */
  scale(mesh: ConnectedMesh, factor: number): void {
    for (const node of mesh.nodes()) {
      node.position = node.position.mul(factor);
    }
  },

  /** Non-uniform scale around origin. */
  scaleXYZ(mesh: ConnectedMesh, sx: number, sy: number, sz: number): void {
    for (const node of mesh.nodes()) {
      const p = node.position;
      node.position = new Vec3(p.x * sx, p.y * sy, p.z * sz);
    }
    mesh.computeVertexNormals();
  },

  /** Non-uniform scale around a center point. */
  scaleAbout(mesh: ConnectedMesh, sx: number, sy: number, sz: number, center: Vec3): void {
    for (const node of mesh.nodes()) {
      const p = node.position.sub(center);
      node.position = new Vec3(p.x * sx, p.y * sy, p.z * sz).add(center);
    }
    mesh.computeVertexNormals();
  },

  /** Rotates the mesh around an axis through the origin. */
  rotate(mesh: ConnectedMesh, axis: Vec3, angleRadians: number): void {
    const a = axis.normalize();
    const c = Math.cos(angleRadians), s = Math.sin(angleRadians), t = 1 - c;
    const { x, y, z } = a;
    const m = new Float64Array(16);
    m[0] = t * x * x + c;     m[4] = t * x * y - s * z; m[8]  = t * x * z + s * y; m[12] = 0;
    m[1] = t * x * y + s * z; m[5] = t * y * y + c;     m[9]  = t * y * z - s * x; m[13] = 0;
    m[2] = t * x * z - s * y; m[6] = t * y * z + s * x; m[10] = t * z * z + c;     m[14] = 0;
    m[3] = 0;                 m[7] = 0;                  m[11] = 0;                 m[15] = 1;
    const mat = new Mat4(m);
    for (const node of mesh.nodes()) {
      node.position = mat.transformPoint(node.position);
    }
    mesh.computeVertexNormals();
  },

  /** Rotates the mesh around an axis through a center point. */
  rotateAbout(mesh: ConnectedMesh, axis: Vec3, angleRadians: number, center: Vec3): void {
    const a = axis.normalize();
    const c = Math.cos(angleRadians), s = Math.sin(angleRadians), t = 1 - c;
    const { x, y, z } = a;
    const m = new Float64Array(16);
    m[0] = t * x * x + c;     m[4] = t * x * y - s * z; m[8]  = t * x * z + s * y; m[12] = 0;
    m[1] = t * x * y + s * z; m[5] = t * y * y + c;     m[9]  = t * y * z - s * x; m[13] = 0;
    m[2] = t * x * z - s * y; m[6] = t * y * z + s * x; m[10] = t * z * z + c;     m[14] = 0;
    m[3] = 0;                 m[7] = 0;                  m[11] = 0;                 m[15] = 1;
    const mat = new Mat4(m);
    for (const node of mesh.nodes()) {
      node.position = mat.transformPoint(node.position.sub(center)).add(center);
    }
    mesh.computeVertexNormals();
  },

  // ================================================================
  // AXIS OPERATIONS
  // ================================================================

  /** Swaps two coordinate axes (e.g. Y↔Z for Z-up to Y-up conversion). */
  swapAxes(mesh: ConnectedMesh, a: Axis, b: Axis): void {
    if (a === b) return;
    for (const node of mesh.nodes()) {
      const p = node.position;
      const va = getCoord(p, a), vb = getCoord(p, b);
      node.position = setCoord(setCoord(p, a, vb), b, va);
    }
    MeshTransform.flipFaces(mesh);
    mesh.computeVertexNormals();
  },

  /** Mirrors the mesh across a plane through the origin. */
  mirror(mesh: ConnectedMesh, axis: Axis): void {
    for (const node of mesh.nodes()) {
      const p = node.position;
      switch (axis) {
        case "x": node.position = new Vec3(-p.x, p.y, p.z); break;
        case "y": node.position = new Vec3(p.x, -p.y, p.z); break;
        case "z": node.position = new Vec3(p.x, p.y, -p.z); break;
      }
    }
    MeshTransform.flipFaces(mesh);
    mesh.computeVertexNormals();
  },

  // ================================================================
  // FACE ORIENTATION
  // ================================================================

  /** Reverses the winding order of all faces (flips normals). */
  flipFaces(mesh: ConnectedMesh): void {
    for (const face of mesh.faces()) {
      face.nodes.reverse();
    }
    mesh.computeVertexNormals();
  },

  /**
   * Makes all face normals consistent using BFS flood-fill.
   * Picks an initial face and propagates its orientation to neighbors.
   */
  reorientFaces(mesh: ConnectedMesh): void {
    const allFaces = mesh.facesArray();
    const faceCount = allFaces.length;
    if (faceCount === 0) return;

    const checked = new Set<number>();
    const queue: number[] = [];

    for (const startFace of allFaces) {
      if (checked.has(startFace.id)) continue;
      checked.add(startFace.id);
      queue.push(startFace.id);

      while (queue.length > 0) {
        const fId = queue.shift()!;
        const f = mesh.face(fId)!;

        // Find neighboring faces (faces sharing an edge)
        const neighborIds = new Set<number>();
        for (const eId of f.edges) {
          const e = mesh.edge(eId);
          if (!e) continue;
          for (const nfId of e.faces) {
            if (nfId !== fId) neighborIds.add(nfId);
          }
        }

        for (const nbId of neighborIds) {
          if (checked.has(nbId)) continue;
          checked.add(nbId);

          if (!hasSameOrientation(mesh, fId, nbId)) {
            const nb = mesh.face(nbId)!;
            nb.nodes.reverse();
          }

          queue.push(nbId);
        }
      }
    }

    mesh.computeVertexNormals();
  },

  // ================================================================
  // CENTER
  // ================================================================

  /** Moves the mesh so its bounding box center is at the origin. */
  centerAtOrigin(mesh: ConnectedMesh): void {
    const allNodes = mesh.nodesArray();
    if (allNodes.length === 0) return;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const n of allNodes) {
      const p = n.position;
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    }
    const center = new Vec3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    MeshTransform.translate(mesh, center.neg());
  },

  /** Moves the mesh so its centroid (average of vertices) is at the origin. */
  centerAtCentroid(mesh: ConnectedMesh): void {
    const allNodes = mesh.nodesArray();
    if (allNodes.length === 0) return;
    let sx = 0, sy = 0, sz = 0;
    for (const n of allNodes) {
      sx += n.position.x; sy += n.position.y; sz += n.position.z;
    }
    const centroid = new Vec3(sx / allNodes.length, sy / allNodes.length, sz / allNodes.length);
    MeshTransform.translate(mesh, centroid.neg());
  },
};

// ── helpers ──

function getCoord(v: Vec3, axis: Axis): number {
  switch (axis) {
    case "x": return v.x;
    case "y": return v.y;
    case "z": return v.z;
  }
}

function setCoord(v: Vec3, axis: Axis, val: number): Vec3 {
  switch (axis) {
    case "x": return new Vec3(val, v.y, v.z);
    case "y": return new Vec3(v.x, val, v.z);
    case "z": return new Vec3(v.x, v.y, val);
  }
}

function hasSameOrientation(mesh: ConnectedMesh, fId1: number, fId2: number): boolean {
  const f1 = mesh.face(fId1)!;
  const f2 = mesh.face(fId2)!;
  const v1 = f1.nodes;
  const v2 = f2.nodes;

  for (let i = 0; i < v1.length; i++) {
    const a = v1[i];
    const b = v1[(i + 1) % v1.length];
    for (let j = 0; j < v2.length; j++) {
      if (v2[j] === a && v2[(j + 1) % v2.length] === b) return false;
    }
  }
  return true;
}
