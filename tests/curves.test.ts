/**
 * Curve helpers: an arc through a point with a tangent, to another point, comes out where the
 * points are (ArcCurve counts its angles from −X for a +Z normal; the helper must agree).
 */
import { describe, it, expect } from "vitest";
import { CurveUtils } from "../src/core/geometry/curves";
import { Vec2 } from "../src/core/math/vectors";

const near = (p: { x: number; y: number }, x: number, y: number) => expect(Math.hypot(p.x - x, p.y - y)).toBeLessThan(1e-9);

describe("CurveUtils.arcFromPointTangentPoint", () => {
  it("starts at p1 along the tangent and ends at p2 (counter-clockwise)", () => {
    const arc = CurveUtils.arcFromPointTangentPoint(new Vec2(1, 0), new Vec2(0, 1), new Vec2(0, 1));
    near(arc.getPoint(0), 1, 0);
    near(arc.getPoint(0.5), Math.SQRT1_2, Math.SQRT1_2);
    near(arc.getPoint(1), 0, 1);
  });

  it("turns clockwise when the tangent says so", () => {
    const arc = CurveUtils.arcFromPointTangentPoint(new Vec2(1, 0), new Vec2(0, -1), new Vec2(0, -1));
    near(arc.getPoint(0), 1, 0);
    near(arc.getPoint(0.5), Math.SQRT1_2, -Math.SQRT1_2);
    near(arc.getPoint(1), 0, -1);
  });

  it("works off the origin too", () => {
    const arc = CurveUtils.arcFromPointTangentPoint(new Vec2(5, 2), new Vec2(0, 1), new Vec2(3, 4));
    near(arc.getPoint(0), 5, 2);
    near(arc.getPoint(1), 3, 4);
  });
});
