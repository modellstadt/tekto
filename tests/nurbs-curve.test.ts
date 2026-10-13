/**
 * NurbsCurve evaluation — the weights.
 *
 * Until 0.6.1 the curve stored its weights and never read them, so every rational
 * curve (the exact circles and arcs NURBS exist for) came out as a plain B-spline:
 * a quarter circle bulged to radius 1.06 at its midpoint. NurbsSurface evaluated
 * the same weights correctly, so a surface lofted from curves disagreed with the
 * curves. These tests pin the exact conics down.
 */
import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { NurbsCurve } from "../src/core/geometry/curves";

const SQ = Math.SQRT1_2;

/** Unit circle as 4 quadratic rational arcs (9 control points, the textbook construction). */
function unitCircle(): NurbsCurve {
  const cps = [
    new Vec3(1, 0, 0), new Vec3(1, 1, 0), new Vec3(0, 1, 0), new Vec3(-1, 1, 0),
    new Vec3(-1, 0, 0), new Vec3(-1, -1, 0), new Vec3(0, -1, 0), new Vec3(1, -1, 0),
    new Vec3(1, 0, 0),
  ];
  const w = [1, SQ, 1, SQ, 1, SQ, 1, SQ, 1];
  const knots = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4];
  return new NurbsCurve(cps, 2, knots, w);
}

describe("NurbsCurve weights", () => {
  it("a weighted quarter arc is an exact circle", () => {
    const c = new NurbsCurve(
      [new Vec3(1, 0, 0), new Vec3(1, 1, 0), new Vec3(0, 1, 0)], 2, [0, 0, 0, 1, 1, 1], [1, SQ, 1],
    );
    for (let i = 0; i <= 20; i++) {
      const p = c.getPoint(i / 20);
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 10);
    }
    expect(c.getPoint(0.5).x).toBeCloseTo(SQ, 10);       // midpoint at 45°
    expect(c.length).toBeCloseTo(Math.PI / 2, 3);         // arc-length cache sees the true arc
  });

  it("a 9-point full circle stays on the unit circle everywhere", () => {
    const c = unitCircle();
    for (let i = 0; i <= 100; i++) {
      const p = c.getPoint(i / 100);
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 10);
    }
    expect(c.length).toBeCloseTo(2 * Math.PI, 2);
  });

  it("weights of 1 give the same curve as no weights", () => {
    const cps = [new Vec3(0, 0, 0), new Vec3(1, 2, 0), new Vec3(3, 2, 1), new Vec3(4, 0, 0)];
    const knots = [0, 0, 0, 0, 1, 1, 1, 1];
    const plain = new NurbsCurve(cps, 3, knots);
    const ones = new NurbsCurve(cps, 3, knots, [1, 1, 1, 1]);
    for (let i = 0; i <= 10; i++) {
      const a = plain.getPoint(i / 10), b = ones.getPoint(i / 10);
      expect(a.distTo(b)).toBeLessThan(1e-12);
    }
  });

  it("a heavier weight pulls the curve toward its control point", () => {
    const cps = [new Vec3(0, 0, 0), new Vec3(1, 1, 0), new Vec3(2, 0, 0)];
    const knots = [0, 0, 0, 1, 1, 1];
    const y = (w: number) => new NurbsCurve(cps, 2, knots, [1, w, 1]).getPoint(0.5).y;
    expect(y(1)).toBeCloseTo(0.5, 10);                    // plain parabola
    expect(y(4)).toBeGreaterThan(y(1));
    expect(y(0.25)).toBeLessThan(y(1));
  });

  it("rejects a weights array of the wrong length", () => {
    expect(() => new NurbsCurve(
      [new Vec3(0, 0, 0), new Vec3(1, 0, 0), new Vec3(2, 0, 0)], 2, [0, 0, 0, 1, 1, 1], [1, 1],
    )).toThrow(/3 control points/);
  });
});
