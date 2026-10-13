/** Signed distance fields: the radial array places rotated copies, not mirrored ones. */
import { describe, it, expect } from "vitest";
import { SdfSphere, SdfRadialArray } from "../src/core/sdf";
import { Vec3 } from "../src/core/math/vectors";

describe("SdfRadialArray", () => {
  it("copies an off-axis shape by rotation, keeping its own position", () => {
    const array = new SdfRadialArray(new SdfSphere(0.3, new Vec3(2, 0.5, 0)), 4);
    expect(array.distance(new Vec3(2, 0.5, 0))).toBeCloseTo(-0.3, 9);        // the original, where it was
    expect(array.distance(new Vec3(-0.5, 2, 0))).toBeCloseTo(-0.3, 9);       // turned 90°
    expect(array.distance(new Vec3(2, -0.5, 0))).toBeGreaterThan(0.5);       // its mirror image is not a copy
  });
});
