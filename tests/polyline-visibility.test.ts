/** polylinesToSVG: a default stroke that suits the drawing's size, in its units. */
import { describe, it, expect } from "vitest";
import { polylinesToSVG } from "../src/io/PolylineVisibility";
import { Vec3 } from "../src/core/math/vectors";

describe("polylinesToSVG", () => {
  it("scales its default stroke to the drawing (a site plan and a detail both read)", () => {
    const seg = (s: number) => [{ points2D: [{ u: 0, v: 0 }, { u: s, v: s }], points3D: [new Vec3(0, 0, 0), new Vec3(s, s, 0)] }];
    const width = (svg: string) => Number(svg.match(/stroke-width="([\d.e-]+)"/)![1]);
    const detail = polylinesToSVG(seg(0.2) as never, { minU: 0, maxU: 0.2, minV: 0, maxV: 0.2 });
    const site = polylinesToSVG(seg(100) as never, { minU: 0, maxU: 100, minV: 0, maxV: 100 });
    expect(width(detail)).toBeCloseTo(0.0004, 9);
    expect(width(site)).toBeCloseTo(0.2, 9);
    expect(width(polylinesToSVG(seg(1) as never, { minU: 0, maxU: 1, minV: 0, maxV: 1 }, { strokeWidth: 0.5 }))).toBe(0.5);
  });
});
