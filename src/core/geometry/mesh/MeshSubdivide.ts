/**
 * Tekto MeshSubdivide — Subdivision and refinement operations on ConnectedMesh.
 *
 * Mirrors HDGEO.Core.MeshSubdivide.
 * Note: CatmullClark is in MeshFactory.subdivide().
 */

import { Vec3 } from "../../math/vectors";
import { ConnectedMesh, MeshNode } from "./ConnectedMesh";
import { MeshTransform } from "./MeshTransform";

export const MeshSubdivide = {

  /** Splits all edges longer than maxLength in a single pass. */
  splitLongEdges(mesh: ConnectedMesh, maxLength: number): void {
    const maxLenSq = maxLength * maxLength;

    // Collect edges that need splitting
    const toSplit: number[] = [];
    for (const e of mesh.edges()) {
      const a = mesh.node(e.nodes[0])!.position;
      const b = mesh.node(e.nodes[1])!.position;
      if (a.distSqTo(b) > maxLenSq) toSplit.push(e.id);
    }

    if (toSplit.length === 0) return;

    // Split each marked edge
    for (const eid of toSplit) {
      const e = mesh.edge(eid);
      if (!e) continue; // may have been removed by prior splits
      mesh.splitEdge(eid);
    }

    mesh.computeVertexNormals();
  },

  /**
   * Iteratively subdivides the mesh until all edges are shorter than targetLength.
   */
  refineByEdgeLength(mesh: ConnectedMesh, targetLength: number, maxIterations = 5): void {
    for (let iter = 0; iter < maxIterations; iter++) {
      const targetSq = targetLength * targetLength;
      const toSplit: number[] = [];

      for (const e of mesh.edges()) {
        const a = mesh.node(e.nodes[0])!.position;
        const b = mesh.node(e.nodes[1])!.position;
        if (a.distSqTo(b) > targetSq) toSplit.push(e.id);
      }

      if (toSplit.length === 0) break;

      for (const eid of toSplit) {
        const e = mesh.edge(eid);
        if (!e) continue;
        mesh.splitEdge(eid);
      }
    }

    mesh.computeVertexNormals();
  },

  /**
   * Doo-Sabin subdivision: each face shrinks toward its centroid, creating
   * new F-faces, E-faces (edge quads), and V-faces (vertex n-gons).
   */
  dooSabin(mesh: ConnectedMesh): void {
    const allFaces = mesh.facesArray();
    const allEdges = mesh.edgesArray();
    const allNodes = mesh.nodesArray();

    // Map old node IDs to contiguous indices for lookup
    const nodeIdToIdx = new Map<number, number>();
    allNodes.forEach((n, i) => nodeIdToIdx.set(n.id, i));

    // --- 1. Compute new face-vertex positions ---
    const newPositions: Vec3[] = [];
    // newVertIdx[faceLocalIdx][vertLocalIdx] = index into newPositions
    const newVertIdx: number[][] = [];
    const faceIdToLocalIdx = new Map<number, number>();

    for (let fi = 0; fi < allFaces.length; fi++) {
      const f = allFaces[fi];
      faceIdToLocalIdx.set(f.id, fi);
      const n = f.nodes.length;
      const verts = f.nodes;

      let center = Vec3.zero();
      for (const nid of verts) center = center.add(mesh.node(nid)!.position);
      center = center.div(n);

      const indices: number[] = [];
      for (let i = 0; i < n; i++) {
        const iPrev = (i - 1 + n) % n;
        const iNext = (i + 1) % n;

        const v = mesh.node(verts[i])!.position;
        const midBefore = mesh.node(verts[iPrev])!.position.add(v).mul(0.5);
        const midAfter = v.add(mesh.node(verts[iNext])!.position).mul(0.5);

        newPositions.push(center.add(v).add(midBefore).add(midAfter).mul(0.25));
        indices.push(newPositions.length - 1);
      }
      newVertIdx.push(indices);
    }

    // Build lookup: (nodeId, faceId) → position within face
    const vertPosInFace = new Map<string, number>();
    for (let fi = 0; fi < allFaces.length; fi++) {
      const f = allFaces[fi];
      for (let i = 0; i < f.nodes.length; i++) {
        vertPosInFace.set(`${f.nodes[i]}_${f.id}`, i);
      }
    }

    // Collect new faces as arrays of indices into newPositions
    const newFaces: number[][] = [];

    // --- 2. F-faces: one per original face ---
    for (let fi = 0; fi < allFaces.length; fi++) {
      newFaces.push([...newVertIdx[fi]]);
    }

    // --- 3. E-faces: one quad per original interior edge ---
    for (const e of allEdges) {
      if (e.faces.length < 2) continue; // boundary edge

      const faceA = e.faces[0];
      const faceB = e.faces[1];
      const fiA = faceIdToLocalIdx.get(faceA)!;
      const fiB = faceIdToLocalIdx.get(faceB)!;

      const posFromA = vertPosInFace.get(`${e.nodes[0]}_${faceA}`)!;
      const posToA = vertPosInFace.get(`${e.nodes[1]}_${faceA}`)!;
      const posFromB = vertPosInFace.get(`${e.nodes[0]}_${faceB}`)!;
      const posToB = vertPosInFace.get(`${e.nodes[1]}_${faceB}`)!;

      // Check edge direction in FaceA
      const fA = mesh.face(faceA)!;
      const vertsA = fA.nodes;
      const forwardInA = posToA === (posFromA + 1) % vertsA.length;

      let nA0: number, nA1: number, nB0: number, nB1: number;
      if (forwardInA) {
        nA0 = newVertIdx[fiA][posFromA];
        nA1 = newVertIdx[fiA][posToA];
        nB0 = newVertIdx[fiB][posToB];
        nB1 = newVertIdx[fiB][posFromB];
      } else {
        nA0 = newVertIdx[fiA][posToA];
        nA1 = newVertIdx[fiA][posFromA];
        nB0 = newVertIdx[fiB][posFromB];
        nB1 = newVertIdx[fiB][posToB];
      }

      newFaces.push([nA0, nA1, nB0, nB1]);
    }

    // --- 4. V-faces: one n-gon per original interior vertex ---
    for (const node of allNodes) {
      if (mesh.isBoundaryNode(node.id)) continue;

      const faceRing = dooSabinFaceRing(mesh, node, allFaces, vertPosInFace, faceIdToLocalIdx);
      if (!faceRing || faceRing.length < 3) continue;

      const vFaceVerts: number[] = [];
      for (const fId of faceRing) {
        const fi = faceIdToLocalIdx.get(fId)!;
        const posInFace = vertPosInFace.get(`${node.id}_${fId}`)!;
        vFaceVerts.push(newVertIdx[fi][posInFace]);
      }

      // Reverse: V-face winding opposes the face ring traversal direction
      vFaceVerts.reverse();

      // Fan-triangulate n-gons with n > 4
      if (vFaceVerts.length <= 4) {
        newFaces.push(vFaceVerts);
      } else {
        for (let i = 1; i < vFaceVerts.length - 1; i++) {
          newFaces.push([vFaceVerts[0], vFaceVerts[i], vFaceVerts[i + 1]]);
        }
      }
    }

    // --- 5. Apply result ---
    mesh.clear();
    const nodeIds = newPositions.map(p => mesh.addNode(p));
    for (const face of newFaces) {
      const mapped = face.map(i => nodeIds[i]);
      mesh.addFace(mapped);
    }

    // E-faces and V-faces may have inconsistent winding relative to F-faces.
    // BFS flood-fill from the (correctly wound) F-faces fixes all orientations
    // and recomputes vertex normals.
    MeshTransform.reorientFaces(mesh);
  },
};

/** Ordered ring of face IDs around an interior vertex (for Doo-Sabin). */
function dooSabinFaceRing(
  mesh: ConnectedMesh,
  node: MeshNode,
  _allFaces: any[],
  _vertPosInFace: Map<string, number>,
  _faceIdToLocalIdx: Map<number, number>
): number[] | null {
  const facesAround = node.faces;
  if (facesAround.length === 0) return null;

  const ring: number[] = [];
  const visited = new Set<number>();

  const startFace = facesAround[0];
  ring.push(startFace);
  visited.add(startFace);

  // Find next vertex in start face from node
  const startFaceObj = mesh.face(startFace)!;
  const posInFace = startFaceObj.nodes.indexOf(node.id);
  if (posInFace < 0) return null;
  let crossVert = startFaceObj.nodes[(posInFace + 1) % startFaceObj.nodes.length];

  // Find the shared edge
  let sharedEdge = findSharedEdge(mesh, node.id, crossVert);
  if (!sharedEdge) return null;

  let currentFace = sharedEdge.faces.find(f => f !== startFace);
  if (currentFace === undefined) return null;

  while (!visited.has(currentFace)) {
    ring.push(currentFace);
    visited.add(currentFace);

    // Find other neighbor of node in current face (not crossVert)
    const cf = mesh.face(currentFace)!;
    const idx = cf.nodes.indexOf(node.id);
    if (idx < 0) break;
    const n = cf.nodes.length;
    const prev = cf.nodes[(idx - 1 + n) % n];
    const next = cf.nodes[(idx + 1) % n];
    const otherVert = next === crossVert ? prev : next;

    sharedEdge = findSharedEdge(mesh, node.id, otherVert);
    if (!sharedEdge) break;

    const nextFace = sharedEdge.faces.find(f => f !== currentFace);
    if (nextFace === undefined) break;

    crossVert = otherVert;
    currentFace = nextFace;
  }

  return ring.length === facesAround.length ? ring : null;
}

function findSharedEdge(mesh: ConnectedMesh, nodeA: number, nodeB: number) {
  const nA = mesh.node(nodeA);
  if (!nA) return null;
  for (const eId of nA.edges) {
    const e = mesh.edge(eId);
    if (!e) continue;
    if ((e.nodes[0] === nodeA && e.nodes[1] === nodeB) ||
        (e.nodes[0] === nodeB && e.nodes[1] === nodeA)) {
      return e;
    }
  }
  return null;
}
