import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { ConnectedMesh as Mesh } from "../src/core/geometry/mesh/ConnectedMesh";
import { MeshFactory as MeshGen } from "../src/core/geometry/mesh/MeshFactory";

describe("Mesh", () => {
  it("creates nodes and retrieves them", () => {
    const m = new Mesh();
    const id = m.addNode(new Vec3(1, 2, 3));
    const node = m.node(id);
    expect(node).toBeDefined();
    expect(node!.position.x).toBe(1);
    expect(m.nodeCount).toBe(1);
  });

  it("creates a triangle with edges", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(0.5, 1, 0));
    m.addTriangle(a, b, c);

    expect(m.nodeCount).toBe(3);
    expect(m.edgeCount).toBe(3);
    expect(m.faceCount).toBe(1);
  });

  it("shares edges between adjacent faces", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(1, 1, 0));
    const d = m.addNode(new Vec3(0, 1, 0));
    m.addTriangle(a, b, c);
    m.addTriangle(a, c, d);

    // Edge a-c is shared, so 5 edges total not 6
    expect(m.edgeCount).toBe(5);
    expect(m.faceCount).toBe(2);
  });

  it("finds edges", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    m.addEdge(a, b);

    expect(m.findEdge(a, b)).toBeDefined();
    expect(m.findEdge(b, a)).toBeDefined(); // reverse order
    expect(m.findEdge(a, 999)).toBeUndefined();
  });

  it("queries node neighbors", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(0.5, 1, 0));
    m.addTriangle(a, b, c);

    const neighbors = m.nodeNeighbors(a);
    expect(neighbors).toContain(b);
    expect(neighbors).toContain(c);
    expect(neighbors.length).toBe(2);
  });

  it("detects boundary edges", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(0.5, 1, 0));
    m.addTriangle(a, b, c);

    // Single triangle — all edges are boundary
    const boundary = m.boundaryEdges();
    expect(boundary.length).toBe(3);
  });

  it("computes vertex normals", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(0, 0, 1));
    m.addTriangle(a, c, b);
    m.computeVertexNormals();

    const normal = m.node(a)!.normal!;
    expect(normal.y).toBeGreaterThan(0); // pointing up (CCW winding from above)
  });

  it("exports to indexed triangles", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(0.5, 1, 0));
    m.addTriangle(a, b, c);
    m.computeVertexNormals();

    const data = m.toIndexedTriangles();
    expect(data.positions.length).toBe(9);  // 3 verts * 3 components
    expect(data.indices.length).toBe(3);     // 1 triangle
    expect(data.normals.length).toBe(9);
  });

  it("serializes and deserializes", () => {
    const m = new Mesh();
    m.addNode(new Vec3(0, 0, 0));
    m.addNode(new Vec3(1, 0, 0));
    m.addNode(new Vec3(0.5, 1, 0));
    m.addTriangle(0, 1, 2);

    const json = m.toJSON();
    const m2 = Mesh.fromJSON(json);
    expect(m2.nodeCount).toBe(3);
    expect(m2.faceCount).toBe(1);
    expect(m2.edgeCount).toBe(3);
  });

  it("computes Euler characteristic for closed mesh", () => {
    const box = MeshGen.box(1, 1, 1);
    // Cube: V=8, E=12, F=6, V-E+F=2
    expect(box.nodeCount - box.edgeCount + box.faceCount).toBe(2);
  });
});

describe("MeshGen", () => {
  it("generates a box with correct topology", () => {
    const m = MeshGen.box(2, 2, 2);
    expect(m.nodeCount).toBe(8);
    expect(m.faceCount).toBe(6);
  });

  it("generates a sphere", () => {
    const m = MeshGen.sphere(1, 12, 8);
    expect(m.nodeCount).toBeGreaterThan(50);
    expect(m.faceCount).toBeGreaterThan(80);
  });

  it("generates a grid with height function", () => {
    const m = MeshGen.grid(4, 4, 8, 8, (x, z) => Math.sin(x) * Math.cos(z));
    expect(m.nodeCount).toBe(9 * 9); // (8+1) * (8+1)
    expect(m.faceCount).toBe(8 * 8);  // quads
  });

  it("generates a torus", () => {
    const m = MeshGen.torus(1, 0.3, 16, 8);
    expect(m.faceCount).toBe(16 * 8);
  });

  it("subdivides a box", () => {
    const box = MeshGen.box(1, 1, 1);
    const sub = MeshGen.subdivide(box);
    expect(sub.faceCount).toBeGreaterThan(box.faceCount);
    // Catmull-Clark: each quad → 4 quads
    expect(sub.faceCount).toBe(box.faceCount * 4);
  });

  it("triangulates a box", () => {
    const box = MeshGen.box(1, 1, 1);
    const tri = MeshGen.triangulate(box);
    // Each quad → 2 triangles
    expect(tri.faceCount).toBe(box.faceCount * 2);
  });
});
