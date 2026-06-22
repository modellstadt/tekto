import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { NurbsCurve } from "../src/core/geometry/curves";
import { NurbsSurface, clampedUniformKnots } from "../src/core/geometry/surfaces";

// ── Helpers ──

function approxEq(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) < eps;
}
function vec3Approx(a: Vec3, b: Vec3, eps = 1e-6) {
  return approxEq(a.x, b.x, eps) && approxEq(a.y, b.y, eps) && approxEq(a.z, b.z, eps);
}

/** Build a straight-line cubic NURBS curve through `pts` (linear interpolation in v). */
function linearNurbs(pts: Vec3[]): NurbsCurve {
  const knots = clampedUniformKnots(pts.length, 1);
  return new NurbsCurve(pts, 1, knots);
}

describe("NurbsSurface", () => {

  it("evaluates corners at the control-grid corners (clamped knots)", () => {
    // Bilinear patch: 2x2 control grid, degree 1 in both directions.
    const cp = [
      [new Vec3(0, 0, 0), new Vec3(0, 1, 0)],
      [new Vec3(1, 0, 0), new Vec3(1, 1, 0)],
    ];
    const knots = [0, 0, 1, 1];
    const s = new NurbsSurface(cp, 1, 1, knots, knots);

    expect(vec3Approx(s.getPoint(0, 0), new Vec3(0, 0, 0))).toBe(true);
    expect(vec3Approx(s.getPoint(1, 0), new Vec3(1, 0, 0))).toBe(true);
    expect(vec3Approx(s.getPoint(0, 1), new Vec3(0, 1, 0))).toBe(true);
    expect(vec3Approx(s.getPoint(1, 1), new Vec3(1, 1, 0))).toBe(true);
    expect(vec3Approx(s.getPoint(0.5, 0.5), new Vec3(0.5, 0.5, 0))).toBe(true);
  });

  it("loft connects two parallel lines into a ruled surface", () => {
    const c0 = linearNurbs([new Vec3(0, 0, 0), new Vec3(1, 0, 0), new Vec3(2, 0, 0)]);
    const c1 = linearNurbs([new Vec3(0, 0, 1), new Vec3(1, 0, 1), new Vec3(2, 0, 1)]);
    const s = NurbsSurface.loft([c0, c1], 1);

    // u=0 must lie on c0, u=1 on c1 (clamped endpoints).
    expect(vec3Approx(s.getPoint(0, 0), new Vec3(0, 0, 0))).toBe(true);
    expect(vec3Approx(s.getPoint(0, 1), new Vec3(2, 0, 0))).toBe(true);
    expect(vec3Approx(s.getPoint(1, 0), new Vec3(0, 0, 1))).toBe(true);
    expect(vec3Approx(s.getPoint(1, 1), new Vec3(2, 0, 1))).toBe(true);
    // Midpoint of a degree-1 loft is the average of endpoints.
    expect(vec3Approx(s.getPoint(0.5, 0.5), new Vec3(1, 0, 0.5))).toBe(true);
  });

  it("loft rejects incompatible curves", () => {
    const c0 = linearNurbs([new Vec3(0, 0, 0), new Vec3(1, 0, 0)]);
    const c1 = linearNurbs([new Vec3(0, 0, 1), new Vec3(1, 0, 1), new Vec3(2, 0, 1)]);
    expect(() => NurbsSurface.loft([c0, c1])).toThrow();
  });

  it("revolve produces a geometrically exact cylinder when profile is a vertical line", () => {
    // Profile: vertical segment at x=1, from y=0 to y=2. Revolve around Y → cylinder.
    const profile = linearNurbs([new Vec3(1, 0, 0), new Vec3(1, 2, 0)]);
    const s = NurbsSurface.revolve(profile);

    // Every sampled point should sit on the cylinder: x²+z² = 1, y ∈ [0,2].
    const samplesU = 24;
    const samplesV = 5;
    for (let i = 0; i <= samplesU; i++) {
      for (let j = 0; j <= samplesV; j++) {
        const u = i / samplesU;
        const v = j / samplesV;
        const p = s.getPoint(u, v);
        expect(approxEq(p.x * p.x + p.z * p.z, 1, 1e-5)).toBe(true);
        expect(approxEq(p.y, 2 * v, 1e-6)).toBe(true);
      }
    }
  });

  it("revolve produces an exact unit sphere when profile is a half-circle NURBS", () => {
    // Half-circle profile in the XY plane revolved around Y → unit sphere.
    // 5 control points / 2 quadratic Bezier arcs, going from (0,1) → (1,0) → (0,-1).
    const SQ = Math.SQRT1_2;
    const cps = [
      new Vec3(0, 1, 0),
      new Vec3(1, 1, 0),
      new Vec3(1, 0, 0),
      new Vec3(1, -1, 0),
      new Vec3(0, -1, 0),
    ];
    const w = [1, SQ, 1, SQ, 1];
    const knots = [0, 0, 0, 1, 1, 2, 2, 2];
    const profile = new NurbsCurve(cps, 2, knots, w);

    const s = NurbsSurface.revolve(profile);

    // Every sampled point should sit on the unit sphere.
    const samplesU = 16;
    const samplesV = 16;
    for (let i = 0; i <= samplesU; i++) {
      for (let j = 0; j <= samplesV; j++) {
        const p = s.getPoint(i / samplesU, j / samplesV);
        const r2 = p.x * p.x + p.y * p.y + p.z * p.z;
        expect(approxEq(r2, 1, 1e-4)).toBe(true);
      }
    }
  });

  it("toMesh creates the expected node and quad count", () => {
    const profile = linearNurbs([new Vec3(1, 0, 0), new Vec3(1, 1, 0)]);
    const s = NurbsSurface.revolve(profile);

    // closedU=true (revolution wraps in u), open in v.
    const mesh = s.toMesh(16, 4, true, false);
    expect(mesh.nodeCount).toBe(16 * (4 + 1));
    expect(mesh.faceCount).toBe(16 * 4);
  });

  it("clampedUniformKnots returns the right length", () => {
    // 5 control points, degree 3 → 5 + 3 + 1 = 9 knots.
    const knots = clampedUniformKnots(5, 3);
    expect(knots.length).toBe(9);
    expect(knots[0]).toBe(0);
    expect(knots[knots.length - 1]).toBe(1);
  });
});
