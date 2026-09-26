/**
 * The mesh's array API: what the GPU and the IO code see.
 *
 * `positions` / `indices` / `normals` are views and caches over the same mesh
 * the topology API edits, so what matters here is that they agree with it —
 * counts, fan-triangulation of quads, normals appearing on first use — and that
 * bulk construction from arrays is as cheap as it was when this was a separate
 * class. The topology side is in mesh.test.ts.
 */
import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { Mesh } from "../src/core/geometry/mesh/Mesh";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";

describe("Mesh (array API)", () => {
  it("creates from arrays", () => {
    const pos = new Float32Array([0,0,0, 1,0,0, 0.5,1,0]);
    const idx = new Uint32Array([0, 1, 2]);
    const fm = new Mesh(pos, idx);

    expect(fm.vertexCount).toBe(3);
    expect(fm.triangleCount).toBe(1);
    expect(fm.edgeCount).toBe(3);          // connectivity comes with it
  });

  it("computes normals on first use", () => {
    const pos = new Float32Array([0,0,0, 1,0,0, 0,0,1]);
    const idx = new Uint32Array([0, 2, 1]);
    const fm = new Mesh(pos, idx);

    const n = fm.getNormal(0);
    expect(n.y).toBeGreaterThan(0.9); // pointing up (CCW winding from above)
    expect(fm.normals.length).toBe(9);
  });

  it("fan-triangulates quads for the index buffer", () => {
    const box = MeshFactory.box(1, 1, 1);
    expect(box.faceCount).toBe(6);
    expect(box.triangleCount).toBe(12);
    expect(box.indices.length).toBe(36);
    expect(box.getTriangle(0)).toEqual([0, 3, 2]);
  });

  it("round-trips through MeshData", () => {
    const box = MeshFactory.box(1, 1, 1);
    const data = box.toMeshData();
    expect(data.positions.length).toBe(8 * 3);
    expect(data.indices.length).toBe(36);
    const back = Mesh.fromMeshData(data);
    expect(back.vertexCount).toBe(8);
    expect(back.faceCount).toBe(12);
    expect(back.volume()).toBeCloseTo(1);
  });

  it("computes volume of a unit sphere", () => {
    const fm = MeshFactory.sphere(1, 32, 24);
    const vol = fm.volume();
    const expected = (4 / 3) * Math.PI; // ~4.189
    // Discrete approximation, allow 5% error
    expect(Math.abs(vol - expected) / expected).toBeLessThan(0.05);
  });

  it("computes surface area of a unit sphere", () => {
    const fm = MeshFactory.sphere(1, 32, 24);
    const area = fm.surfaceArea();
    const expected = 4 * Math.PI; // ~12.566
    expect(Math.abs(area - expected) / expected).toBeLessThan(0.05);
  });

  it("answers neighbour queries", () => {
    const fm = MeshFactory.sphere(1, 8, 6);
    const nb = fm.neighbors(0);
    expect(nb.length).toBeGreaterThan(0);
  });

  it("detects boundary vertices", () => {
    const fm = MeshFactory.grid(4, 4, 4, 4);
    let boundaryCount = 0;
    for (let i = 0; i < fm.vertexCount; i++) {
      if (fm.isBoundary(i)) boundaryCount++;
    }
    expect(boundaryCount).toBe(16);       // the ring of a 5x5 node grid
  });

  it("smooth reduces roughness", () => {
    const fm = MeshFactory.sphere(1, 8, 6);
    const posBefore = new Float64Array(fm.positions);
    fm.smooth(3, 0.5);
    let diff = 0;
    for (let i = 0; i < fm.positions.length; i++) {
      diff += Math.abs(fm.positions[i] - posBefore[i]);
    }
    expect(diff).toBeGreaterThan(0);
  });

  it("translates in place", () => {
    const fm = MeshFactory.box(1, 1, 1);
    const c1 = fm.centroid();
    fm.translate(5, 0, 0);
    const c2 = fm.centroid();
    expect(c2.x - c1.x).toBeCloseTo(5);
  });

  it("scales uniformly", () => {
    const fm = MeshFactory.box(1, 1, 1);
    const b1 = fm.bounds();
    fm.scale(2);
    const b2 = fm.bounds();
    expect(b2.max.x).toBeCloseTo(b1.max.x * 2);
  });

  it("merges two meshes", () => {
    const a = MeshFactory.box(1, 1, 1);
    const b = MeshFactory.sphere(0.5, 8, 6);
    const merged = a.merge(b);
    expect(merged.vertexCount).toBe(a.vertexCount + b.vertexCount);
    expect(merged.triangleCount).toBe(a.triangleCount + b.triangleCount);
    expect(merged.edgeCount).toBe(a.edgeCount + b.edgeCount);
  });

  it("clones without sharing data", () => {
    const fm = MeshFactory.box(1, 1, 1);
    const cl = fm.clone();
    cl.translate(10, 0, 0);
    expect(fm.getPosition(0).x).not.toBeCloseTo(cl.getPosition(0).x);
  });

  it("serializes and deserializes", () => {
    const fm = MeshFactory.sphere(1, 8, 6);
    const json = fm.toJSON();
    const fm2 = Mesh.fromJSON(json);
    expect(fm2.vertexCount).toBe(fm.vertexCount);
    expect(fm2.triangleCount).toBe(fm.triangleCount);
  });

  it("computes Euler characteristic for closed mesh", () => {
    const pos = new Float32Array([1,1,1, -1,-1,1, -1,1,-1, 1,-1,-1]);
    const idx = new Uint32Array([0,1,2, 0,3,1, 0,2,3, 1,3,2]);
    const fm = new Mesh(pos, idx);
    expect(fm.eulerCharacteristic()).toBe(2); // closed genus-0 surface
  });

  it("keeps uvs and colours through toMeshData", () => {
    const m = new Mesh([0,0,0, 1,0,0, 0,1,0], [0, 1, 2], undefined, [0,0, 1,0, 0,1], [1,0,0,1, 0,1,0,1, 0,0,1,1]);
    const d = m.toMeshData();
    expect(Array.from(d.uvs!)).toEqual([0,0, 1,0, 0,1]);
    expect(d.colors!.length).toBe(12);
  });
});

describe("MeshFactory (array side)", () => {
  it("generates a grid", () => {
    const fm = MeshFactory.grid(4, 4, 8, 8);
    expect(fm.vertexCount).toBe(9 * 9);
    expect(fm.triangleCount).toBe(8 * 8 * 2);
  });

  it("grid update rewrites heights in place", () => {
    const fm = MeshFactory.grid(4, 4, 8, 8);
    fm.update(() => 5.0);
    expect(fm.positions[1]).toBeCloseTo(5.0);
    expect(fm.bounds().max.y).toBeCloseTo(5.0);
  });

  it("generates a sphere", () => {
    const fm = MeshFactory.sphere(2, 16, 12);
    expect(fm.vertexCount).toBeGreaterThan(100);
  });

  it("generates a torus", () => {
    const fm = MeshFactory.torus(1, 0.3, 16, 8);
    expect(fm.vertexCount).toBe(17 * 9);
    expect(fm.triangleCount).toBe(16 * 8 * 2);
  });

  it("midpoint-subdivides", () => {
    const fm = MeshFactory.sphere(1, 6, 4);
    const sub = MeshFactory.midpointSubdivide(fm);
    expect(sub.triangleCount).toBe(fm.triangleCount * 4);
  });

  // The two timing tests guard against connectivity being rebuilt per edit — that
  // regression costs seconds, not milliseconds — so the bounds are loose enough for
  // a cold CI runner (locally ~30 ms and ~20 ms) and each builds once to warm the JIT.
  it("performance: builds an 80K-tri grid with edges in well under a second", () => {
    MeshFactory.grid(10, 10, 200, 200);
    const start = performance.now();
    const fm = MeshFactory.grid(10, 10, 200, 200);
    const elapsed = performance.now() - start;
    expect(fm.triangleCount).toBe(200 * 200 * 2); // 80K tris
    expect(fm.edgeCount).toBe(2 * 200 * 201);
    expect(elapsed).toBeLessThan(400);
  });

  it("performance: loads 200K triangles from arrays in well under a second", () => {
    const n = 316, pos = new Float32Array((n + 1) * (n + 1) * 3), idx = new Uint32Array(n * n * 6);
    let k = 0;
    for (let iz = 0; iz < n; iz++) for (let ix = 0; ix < n; ix++) {
      const a = iz * (n + 1) + ix, b = a + 1, c = a + n + 1, d = c + 1;
      idx[k++] = a; idx[k++] = b; idx[k++] = d; idx[k++] = a; idx[k++] = d; idx[k++] = c;
    }
    new Mesh(pos, idx);
    const start = performance.now();
    const m = new Mesh(pos, idx);
    const elapsed = performance.now() - start;
    expect(m.triangleCount).toBe(n * n * 2);
    expect(m.edgeCount).toBe(3 * n * n + 2 * n);
    expect(elapsed).toBeLessThan(500);
    void Vec3;
  });
});
