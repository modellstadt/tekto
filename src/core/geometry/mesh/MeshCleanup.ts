/**
 * Tekto MeshCleanup — Vertex merging and welding on ConnectedMesh.
 *
 * Mirrors HDGEO.Core.MeshCleanup.
 */

import { Vec3 } from "../../math/vectors";
import { ConnectedMesh } from "./ConnectedMesh";

export const MeshCleanup = {

  /** Merges vertices that have the exact same position (binary equality). */
  mergeIdenticalVertices(mesh: ConnectedMesh): void {
    const allNodes = mesh.nodesArray();
    const allFaces = mesh.facesArray();

    const uniquePos = new Map<string, number>();
    const positions: Vec3[] = [];
    const oldToNew = new Map<number, number>();

    for (const node of allNodes) {
      const key = `${node.position.x},${node.position.y},${node.position.z}`;
      if (uniquePos.has(key)) {
        oldToNew.set(node.id, uniquePos.get(key)!);
      } else {
        const newIdx = positions.length;
        uniquePos.set(key, newIdx);
        positions.push(node.position);
        oldToNew.set(node.id, newIdx);
      }
    }

    // Collect remapped faces (filtering degenerate)
    const newFaces: number[][] = [];
    for (const f of allFaces) {
      const mapped = f.nodes.map(n => oldToNew.get(n)!);
      const distinct = new Set(mapped);
      if (distinct.size < 3) continue;

      if (distinct.size < mapped.length) {
        // Deduplicate while preserving order
        const deduped: number[] = [];
        for (const v of mapped) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== v) deduped.push(v);
        }
        if (deduped.length >= 3) newFaces.push(deduped);
      } else {
        newFaces.push(mapped);
      }
    }

    applyRemap(mesh, positions, newFaces);
  },

  /** Merges vertices that are within a certain distance of each other. */
  weldVertices(mesh: ConnectedMesh, threshold: number): void {
    if (threshold <= 1e-6) {
      MeshCleanup.mergeIdenticalVertices(mesh);
      return;
    }

    const allNodes = mesh.nodesArray();
    const allFaces = mesh.facesArray();
    const count = allNodes.length;

    // Sort by X for efficiency
    const sorted = allNodes.slice().sort((a, b) => a.position.x - b.position.x);
    const oldToNew = new Map<number, number>();
    const positions: Vec3[] = [];
    const sqThreshold = threshold * threshold;

    for (let i = 0; i < count; i++) {
      const nodeA = sorted[i];
      if (oldToNew.has(nodeA.id)) continue;

      const newIdx = positions.length;
      oldToNew.set(nodeA.id, newIdx);
      positions.push(nodeA.position);

      for (let j = i + 1; j < count; j++) {
        const nodeB = sorted[j];
        if (oldToNew.has(nodeB.id)) continue;
        if (nodeB.position.x - nodeA.position.x > threshold) break;
        if (nodeA.position.distSqTo(nodeB.position) <= sqThreshold) {
          oldToNew.set(nodeB.id, newIdx);
        }
      }
    }

    const newFaces: number[][] = [];
    for (const f of allFaces) {
      const mapped = f.nodes.map(n => oldToNew.get(n)!);
      const distinct = new Set(mapped);
      if (distinct.size < 3) continue;

      if (distinct.size < mapped.length) {
        const deduped: number[] = [];
        for (const v of mapped) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== v) deduped.push(v);
        }
        if (deduped.length >= 3) newFaces.push(deduped);
      } else {
        newFaces.push(mapped);
      }
    }

    applyRemap(mesh, positions, newFaces);
  },
};

function applyRemap(mesh: ConnectedMesh, positions: Vec3[], faces: number[][]): void {
  mesh.clear();
  const ids = positions.map(p => mesh.addNode(p));
  for (const f of faces) {
    mesh.addFace(f.map(i => ids[i]));
  }
  mesh.computeVertexNormals();
}
