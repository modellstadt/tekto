// ====================================================================
// MESH OFFSET — thicken / shell a mesh
// ====================================================================
//
// Creates a shell by duplicating geometry and offsetting along vertex
// normals (uniform, per-vertex, or along a fixed direction). Optional
// boundary-edge bridging closes the open sides into a solid.
//
// Ported from HDGEO C# (HDGEO.Core.Geometry.MeshOffset),
// which was itself ported from the HDGeo Java MeshOffset.

import { Vec3 } from "../../math/vectors";
import { ConnectedMesh } from "./ConnectedMesh";

/**
 * Offset (thicken) a mesh by a uniform distance along its vertex normals.
 * Returns a new mesh containing both the original surface and the offset
 * surface; if `closeSides` is true, boundary edges are bridged with quad
 * strips to form a closed solid.
 */
export function offset(mesh: ConnectedMesh, distance: number, closeSides = true): ConnectedMesh {
  return offsetByFunction(mesh, () => distance, closeSides);
}

/**
 * Per-vertex offset along vertex normals. `distanceFn(originalNodeId)` is
 * called for each input node and returns the offset distance for that
 * vertex (positive = along normal, negative = against).
 */
export function offsetByFunction(
  mesh: ConnectedMesh,
  distanceFn: (originalNodeId: number) => number,
  closeSides = true,
): ConnectedMesh {
  mesh.computeVertexNormals();

  const result = new ConnectedMesh();
  const originalIds = [...mesh.nodes()].map(n => n.id);

  // 1. Copy original vertices (mapping original id → new id).
  const originalToBase = new Map<number, number>();
  for (const id of originalIds) {
    const node = mesh.node(id)!;
    originalToBase.set(id, result.addNode(node.position));
  }

  // 2. Add offset vertices (one per original).
  const originalToOffset = new Map<number, number>();
  for (const id of originalIds) {
    const node = mesh.node(id)!;
    const normal = node.normal ?? new Vec3(0, 1, 0);
    const d = distanceFn(id);
    originalToOffset.set(id, result.addNode(node.position.add(normal.mul(d))));
  }

  // 3. Copy original faces.
  for (const f of mesh.faces()) {
    result.addFace(f.nodes.map(nid => originalToBase.get(nid)!));
  }

  // 4. Offset faces with reversed winding.
  for (const f of mesh.faces()) {
    const reversed = f.nodes.slice().reverse().map(nid => originalToOffset.get(nid)!);
    result.addFace(reversed);
  }

  // 5. Bridge boundary edges with quad strips.
  if (closeSides) {
    for (const e of mesh.boundaryEdges()) {
      const a = e.nodes[0];
      const b = e.nodes[1];
      // From outside, the bridge quad faces outward — winding (b, a, a', b').
      result.addFace([
        originalToBase.get(b)!,
        originalToBase.get(a)!,
        originalToOffset.get(a)!,
        originalToOffset.get(b)!,
      ]);
    }
  }

  result.computeVertexNormals();
  return result;
}

/**
 * Offset every vertex by the same world-space direction (no normals).
 * Useful for extruding a flat mesh into a prism.
 */
export function offsetDirection(mesh: ConnectedMesh, direction: Vec3, closeSides = true): ConnectedMesh {
  const result = new ConnectedMesh();
  const originalIds = [...mesh.nodes()].map(n => n.id);

  const originalToBase = new Map<number, number>();
  for (const id of originalIds) {
    originalToBase.set(id, result.addNode(mesh.node(id)!.position));
  }

  const originalToOffset = new Map<number, number>();
  for (const id of originalIds) {
    originalToOffset.set(id, result.addNode(mesh.node(id)!.position.add(direction)));
  }

  for (const f of mesh.faces()) {
    result.addFace(f.nodes.map(nid => originalToBase.get(nid)!));
  }
  for (const f of mesh.faces()) {
    const reversed = f.nodes.slice().reverse().map(nid => originalToOffset.get(nid)!);
    result.addFace(reversed);
  }

  if (closeSides) {
    for (const e of mesh.boundaryEdges()) {
      const a = e.nodes[0], b = e.nodes[1];
      result.addFace([
        originalToBase.get(b)!,
        originalToBase.get(a)!,
        originalToOffset.get(a)!,
        originalToOffset.get(b)!,
      ]);
    }
  }

  result.computeVertexNormals();
  return result;
}

/**
 * Per-vertex offset using explicit normals and distances (one per node, in
 * the same iteration order as `mesh.nodes()`).
 */
export function offsetByArrays(
  mesh: ConnectedMesh, normals: Vec3[], distances: number[], closeSides = true,
): ConnectedMesh {
  const originalIds = [...mesh.nodes()].map(n => n.id);
  if (normals.length !== originalIds.length || distances.length !== originalIds.length) {
    throw new Error("MeshOffset.offsetByArrays: normals and distances must match vertex count");
  }

  const result = new ConnectedMesh();
  const idIndex = new Map<number, number>();
  originalIds.forEach((id, i) => idIndex.set(id, i));

  const originalToBase = new Map<number, number>();
  for (const id of originalIds) {
    originalToBase.set(id, result.addNode(mesh.node(id)!.position));
  }

  const originalToOffset = new Map<number, number>();
  for (const id of originalIds) {
    const i = idIndex.get(id)!;
    originalToOffset.set(id, result.addNode(mesh.node(id)!.position.add(normals[i].mul(distances[i]))));
  }

  for (const f of mesh.faces()) {
    result.addFace(f.nodes.map(nid => originalToBase.get(nid)!));
  }
  for (const f of mesh.faces()) {
    const reversed = f.nodes.slice().reverse().map(nid => originalToOffset.get(nid)!);
    result.addFace(reversed);
  }

  if (closeSides) {
    for (const e of mesh.boundaryEdges()) {
      const a = e.nodes[0], b = e.nodes[1];
      result.addFace([
        originalToBase.get(b)!,
        originalToBase.get(a)!,
        originalToOffset.get(a)!,
        originalToOffset.get(b)!,
      ]);
    }
  }

  result.computeVertexNormals();
  return result;
}

export const MeshOffset = { offset, offsetByFunction, offsetDirection, offsetByArrays };
