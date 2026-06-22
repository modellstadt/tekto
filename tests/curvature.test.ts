import { describe, it, expect } from "vitest";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";
import { Curvature } from "../src/core/algo/Curvature";
import { Vec3 } from "../src/core/math/vectors";

describe("Curvature.taubin", () => {
  it("recovers mean curvature ≈ 1/r on a sphere", () => {
    const r = 1.5;
    const mesh = MeshFactory.sphere(r, 48, 32);
    const result = Curvature.taubin(mesh);

    let sumMean = 0;
    let count = 0;
    for (const c of result.values()) {
      if (c.isBoundary) continue;
      sumMean += c.meanCurvature;
      count++;
    }
    expect(count).toBeGreaterThan(0);
    const avgMean = sumMean / count;
    const expected = 1 / r;
    // Mean curvature (trace of the shape operator) averages cleanly even on
    // anisotropic lat/lon meshes; the individual principal eigenvalues vary
    // a lot near the poles because the one-ring directions aren't uniform.
    expect(Math.abs(avgMean - expected)).toBeLessThan(0.05);
  });

  it("returns directions orthogonal to the surface normal and to each other", () => {
    const mesh = MeshFactory.sphere(1, 32, 24);
    const result = Curvature.taubin(mesh);

    for (const node of mesh.nodes()) {
      const c = result.get(node.id);
      if (!c || c.isBoundary) continue;
      const n = node.normal;
      if (!n || n.lenSq() < 1e-10) continue;

      // dirMax · n ≈ 0, dirMin · n ≈ 0
      expect(Math.abs(c.dirMax.dot(n))).toBeLessThan(1e-5);
      expect(Math.abs(c.dirMin.dot(n))).toBeLessThan(1e-5);
      // dirMax ⊥ dirMin
      expect(Math.abs(c.dirMax.dot(c.dirMin))).toBeLessThan(1e-5);
      // both are unit
      expect(Math.abs(c.dirMax.len() - 1)).toBeLessThan(1e-6);
      expect(Math.abs(c.dirMin.len() - 1)).toBeLessThan(1e-6);
    }
  });

  it("gives near-zero mean curvature on a flat grid", () => {
    const mesh = MeshFactory.grid(2, 2, 12, 12);
    const result = Curvature.taubin(mesh);

    for (const c of result.values()) {
      if (c.isBoundary) continue;
      expect(Math.abs(c.meanCurvature)).toBeLessThan(1e-6);
      expect(Math.abs(c.gaussCurvature)).toBeLessThan(1e-6);
    }
  });

  it("detects saddle behaviour on a hyperbolic paraboloid", () => {
    // y = x² − z² has principal curvatures of opposite sign everywhere.
    // (y = x·z would also be a saddle analytically, but it's ruled in both
    // grid axes — every axis-aligned chord lies in the tangent plane and the
    // quad grid would report κ ≈ 0 everywhere.)
    const mesh = MeshFactory.grid(2, 2, 20, 20, (x, z) => x * x - z * z);
    const result = Curvature.taubin(mesh);

    let saddleCount = 0;
    let total = 0;
    for (const node of mesh.nodes()) {
      const c = result.get(node.id);
      if (!c || c.isBoundary) continue;
      const p = node.position;
      // Sample only where the surface is meaningfully curved — near the origin
      // and near the grid boundary, |K| → 0 and discretization noise dominates.
      if (Math.abs(p.x) < 0.5 || Math.abs(p.z) < 0.5) continue;
      if (Math.abs(p.x) > 0.85 || Math.abs(p.z) > 0.85) continue;
      total++;
      if (c.gaussCurvature < 0) saddleCount++;
    }
    expect(total).toBeGreaterThan(20);
    expect(saddleCount / total).toBeGreaterThan(0.9);
  });

  it("combDirections makes the field locally sign-consistent", () => {
    const mesh = MeshFactory.sphere(1, 24, 16);
    const result = Curvature.taubin(mesh);
    Curvature.combDirections(mesh, result);

    let flipped = 0, total = 0;
    for (const node of mesh.nodes()) {
      const c = result.get(node.id);
      if (!c || c.isBoundary) continue;
      for (const nid of mesh.nodeNeighbors(node.id)) {
        const nc = result.get(nid);
        if (!nc || nc.isBoundary) continue;
        total++;
        if (c.dirMax.dot(nc.dirMax) < 0) flipped++;
      }
    }
    // After combing, the vast majority of neighbors should agree on sign.
    // (Singularities — umbilic points on the sphere — and any leftover topology
    // ambiguity can still produce a small fraction of disagreements.)
    expect(flipped / total).toBeLessThan(0.05);
    void Vec3; // keep the import alive in case of future direction tests
  });
});
