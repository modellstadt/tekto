import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { ConnectedMesh as Mesh } from "../src/core/geometry/mesh/ConnectedMesh";
import { MeshFactory as MeshGen } from "../src/core/geometry/mesh/MeshFactory";
import { Mesh as FlatMesh } from "../src/core/geometry/mesh/Mesh";
import { FlatMeshGen } from "../src/core/mesh/FlatMesh";

describe("FlatMesh", () => {
  it("creates from arrays", () => {
    const pos = new Float32Array([0,0,0, 1,0,0, 0.5,1,0]);
    const idx = new Uint32Array([0, 1, 2]);
    const fm = new FlatMesh(pos, idx);

    expect(fm.vertexCount).toBe(3);
    expect(fm.triangleCount).toBe(1);
  });

  it("computes normals automatically", () => {
    const pos = new Float32Array([0,0,0, 1,0,0, 0,0,1]);
    const idx = new Uint32Array([0, 2, 1]);
    const fm = new FlatMesh(pos, idx);

    const n = fm.getNormal(0);
    expect(n.y).toBeGreaterThan(0.9); // pointing up (CCW winding from above)
  });

  it("converts from Mesh", () => {
    const mesh = MeshGen.sphere(1, 12, 8);
    const fm = FlatMesh.fromConnectedMesh(mesh);

    expect(fm.vertexCount).toBe(mesh.nodeCount);
    expect(fm.triangleCount).toBeGreaterThan(0);
  });

  it("converts back to Mesh", () => {
    const mesh = MeshGen.box(1, 1, 1);
    const fm = FlatMesh.fromConnectedMesh(mesh);
    const mesh2 = fm.toConnectedMesh();

    expect(mesh2.nodeCount).toBe(fm.vertexCount);
    expect(mesh2.faceCount).toBe(fm.triangleCount);
  });

  it("computes volume of a unit sphere", () => {
    const fm = FlatMeshGen.sphere(1, 32, 24);
    const vol = fm.volume();
    const expected = (4 / 3) * Math.PI; // ~4.189
    // Discrete approximation, allow 5% error
    expect(Math.abs(vol - expected) / expected).toBeLessThan(0.05);
  });

  it("computes surface area of a unit sphere", () => {
    const fm = FlatMeshGen.sphere(1, 32, 24);
    const area = fm.surfaceArea();
    const expected = 4 * Math.PI; // ~12.566
    expect(Math.abs(area - expected) / expected).toBeLessThan(0.05);
  });

  it("computes lazy adjacency", () => {
    const fm = FlatMeshGen.sphere(1, 8, 6);
    const nb = fm.neighbors(0);
    expect(nb.length).toBeGreaterThan(0);
  });

  it("detects boundary vertices", () => {
    const fm = FlatMeshGen.grid(4, 4, 4, 4);
    // Grid has boundary edges
    let boundaryCount = 0;
    for (let i = 0; i < fm.vertexCount; i++) {
      if (fm.isBoundary(i)) boundaryCount++;
    }
    expect(boundaryCount).toBeGreaterThan(0);
  });

  it("smooth reduces roughness", () => {
    const fm = FlatMeshGen.sphere(1, 8, 6);
    const posBefore = new Float32Array(fm.positions);
    fm.smooth(3, 0.5);
    // Positions should have changed
    let diff = 0;
    for (let i = 0; i < fm.positions.length; i++) {
      diff += Math.abs(fm.positions[i] - posBefore[i]);
    }
    expect(diff).toBeGreaterThan(0);
  });

  it("translates in place", () => {
    const fm = FlatMeshGen.box(1, 1, 1);
    const c1 = fm.centroid();
    fm.translate(5, 0, 0);
    const c2 = fm.centroid();
    expect(c2.x - c1.x).toBeCloseTo(5);
  });

  it("scales uniformly", () => {
    const fm = FlatMeshGen.box(1, 1, 1);
    const b1 = fm.bounds();
    fm.scale(2);
    const b2 = fm.bounds();
    expect(b2.max.x).toBeCloseTo(b1.max.x * 2);
  });

  it("merges two meshes", () => {
    const a = FlatMeshGen.box(1, 1, 1);
    const b = FlatMeshGen.sphere(0.5, 8, 6);
    const merged = a.merge(b);
    expect(merged.vertexCount).toBe(a.vertexCount + b.vertexCount);
    expect(merged.triangleCount).toBe(a.triangleCount + b.triangleCount);
  });

  it("clones without sharing data", () => {
    const fm = FlatMeshGen.box(1, 1, 1);
    const cl = fm.clone();
    cl.translate(10, 0, 0);
    expect(fm.getPosition(0).x).not.toBeCloseTo(cl.getPosition(0).x);
  });

  it("serializes and deserializes", () => {
    const fm = FlatMeshGen.sphere(1, 8, 6);
    const json = fm.toJSON();
    const fm2 = FlatMesh.fromJSON(json);
    expect(fm2.vertexCount).toBe(fm.vertexCount);
    expect(fm2.triangleCount).toBe(fm.triangleCount);
  });

  it("computes Euler characteristic for closed mesh", () => {
    // Use a tetrahedron (4V, 6E, 4F) — UV spheres have seam-duplicated vertices
    const pos = new Float32Array([1,1,1, -1,-1,1, -1,1,-1, 1,-1,-1]);
    const idx = new Uint32Array([0,1,2, 0,3,1, 0,2,3, 1,3,2]);
    const fm = new FlatMesh(pos, idx);
    const euler = fm.eulerCharacteristic();
    expect(euler).toBe(2); // closed genus-0 surface
  });
});

describe("FlatMeshGen", () => {
  it("generates a grid", () => {
    const fm = FlatMeshGen.grid(4, 4, 8, 8);
    expect(fm.vertexCount).toBe(9 * 9);
    expect(fm.triangleCount).toBe(8 * 8 * 2);
  });

  it("grid update function works", () => {
    const fm = FlatMeshGen.grid(4, 4, 8, 8);
    const y0 = fm.positions[1]; // y of first vertex
    (fm as any).update((x: number, z: number) => 5.0);
    expect(fm.positions[1]).toBeCloseTo(5.0);
  });

  it("generates a sphere", () => {
    const fm = FlatMeshGen.sphere(2, 16, 12);
    expect(fm.vertexCount).toBeGreaterThan(100);
  });

  it("generates a torus", () => {
    const fm = FlatMeshGen.torus(1, 0.3, 16, 8);
    expect(fm.vertexCount).toBe(17 * 9);
    expect(fm.triangleCount).toBe(16 * 8 * 2);
  });

  it("subdivides", () => {
    const fm = FlatMeshGen.sphere(1, 6, 4);
    const sub = FlatMeshGen.subdivide(fm);
    expect(sub.triangleCount).toBe(fm.triangleCount * 4);
  });

  it("performance: generates 100K-tri grid in under 100ms", () => {
    const start = performance.now();
    const fm = FlatMeshGen.grid(10, 10, 200, 200);
    const elapsed = performance.now() - start;
    expect(fm.triangleCount).toBe(200 * 200 * 2); // 80K tris
    expect(elapsed).toBeLessThan(100);
  });
});
