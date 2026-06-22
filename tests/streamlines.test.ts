import { describe, it, expect } from "vitest";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";
import { Curvature } from "../src/core/algo/Curvature";
import { StreamlineTracer } from "../src/core/algo/StreamlineTracer";
import { Vec3 } from "../src/core/math/vectors";

describe("StreamlineTracer.smoothPolyline", () => {
  it("leaves a straight line untouched", () => {
    const line = [new Vec3(0, 0, 0), new Vec3(1, 0, 0), new Vec3(2, 0, 0), new Vec3(3, 0, 0)];
    const out = StreamlineTracer.smoothPolyline(line, 5, 0.5);
    expect(out.length).toBe(line.length);
    for (let i = 0; i < line.length; i++) {
      expect(out[i].distTo(line[i])).toBeLessThan(1e-9);
    }
  });

  it("pins endpoints and reduces zigzag amplitude", () => {
    const line = [
      new Vec3(0, 0, 0),
      new Vec3(1, 1, 0),
      new Vec3(2, -1, 0),
      new Vec3(3, 1, 0),
      new Vec3(4, -1, 0),
      new Vec3(5, 0, 0),
    ];
    const out = StreamlineTracer.smoothPolyline(line, 6, 0.5);
    expect(out.length).toBe(line.length);
    // endpoints fixed
    expect(out[0].distTo(line[0])).toBeLessThan(1e-9);
    expect(out[5].distTo(line[5])).toBeLessThan(1e-9);
    // interior y-amplitude collapses
    const maxAbsY = Math.max(...out.slice(1, -1).map(p => Math.abs(p.y)));
    expect(maxAbsY).toBeLessThan(0.5);
  });

  it("is a no-op for sub-3-point inputs or non-positive iterations", () => {
    const two = [new Vec3(0, 0, 0), new Vec3(1, 0, 0)];
    expect(StreamlineTracer.smoothPolyline(two, 3, 0.5)).toBe(two);
    const long = [new Vec3(0, 0, 0), new Vec3(1, 1, 0), new Vec3(2, 0, 0)];
    expect(StreamlineTracer.smoothPolyline(long, 0, 0.5)).toBe(long);
  });
});

describe("StreamlineTracer", () => {
  it("produces polylines whose points stay on the mesh surface", () => {
    const r = 1;
    const mesh = MeshFactory.sphere(r, 32, 24);
    const curvatures = Curvature.taubin(mesh);
    Curvature.combDirections(mesh, curvatures);
    const field = Curvature.facePrincipalField(mesh, curvatures, "max");

    const lines = StreamlineTracer.trace(mesh, field, { maxSteps: 100, stride: 8 });
    expect(lines.length).toBeGreaterThan(0);

    // Every emitted point should sit near the sphere of radius r (small lift
    // allowed for the anti-Z-fight offset baked into the tracer).
    let maxOff = 0;
    for (const line of lines) {
      for (const p of line) {
        maxOff = Math.max(maxOff, Math.abs(p.len() - r));
      }
    }
    expect(maxOff).toBeLessThan(0.1);
  });

  it("each emitted point is close to the previous one (no teleportation)", () => {
    const mesh = MeshFactory.torus(1, 0.35, 32, 16);
    const curvatures = Curvature.taubin(mesh);
    Curvature.combDirections(mesh, curvatures);
    const field = Curvature.facePrincipalField(mesh, curvatures, "max");

    const lines = StreamlineTracer.trace(mesh, field, { maxSteps: 60, stride: 6 });
    expect(lines.length).toBeGreaterThan(0);

    let maxJump = 0;
    for (const line of lines) {
      for (let i = 1; i < line.length; i++) {
        maxJump = Math.max(maxJump, line[i].distTo(line[i - 1]));
      }
    }
    // Average edge length on this torus is ~0.13; a step is ~0.25 of that
    // (~0.033) plus the edge-cross step. Anything past 0.3 means the tracer
    // teleported across the mesh.
    expect(maxJump).toBeLessThan(0.3);
  });

  it("reaches mesh boundaries on an open surface", () => {
    const mesh = MeshFactory.grid(2, 2, 20, 20, (x, z) => 0.15 * Math.sin(2 * x) * Math.cos(2 * z));
    const curvatures = Curvature.taubin(mesh);
    Curvature.combDirections(mesh, curvatures);
    const field = Curvature.facePrincipalField(mesh, curvatures, "max");

    const lines = StreamlineTracer.trace(mesh, field, { maxSteps: 400, stride: 4 });
    expect(lines.length).toBeGreaterThan(0);

    // The grid spans x,z ∈ [−1, 1]. A streamline that terminated at a
    // boundary edge has at least one endpoint within ~one edge length of
    // |x|=1 or |z|=1. We expect a healthy fraction of lines to do that —
    // not 100%, because umbilic singularities on the wavy field can also
    // trap some streamlines into spirals interior to the mesh.
    let reachedBoundary = 0;
    for (const line of lines) {
      if (line.length < 2) continue;
      const ends = [line[0], line[line.length - 1]];
      for (const e of ends) {
        if (Math.abs(e.x) > 0.92 || Math.abs(e.z) > 0.92) {
          reachedBoundary++;
          break;
        }
      }
    }
    expect(reachedBoundary).toBeGreaterThan(lines.length * 0.3);
    void Vec3;
  });
});
