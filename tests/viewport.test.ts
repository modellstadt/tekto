/**
 * The rules a Viewport draws by, tested without a GPU.
 *
 * Everything here is a plain function on purpose: the parts of a viewport that
 * are easy to get quietly wrong (which axis a named view looks down, whether a
 * wide model fits a narrow panel, whether ghost mode still writes depth) are
 * the parts that need no WebGL to check.
 */
import { describe, it, expect } from "vitest";
import {
  edgeStyle, surfaceAppearance, lightBalance, standardOrbit, fitRadius, orthoFrustum,
} from "../src/render/Viewport";

describe("view modes", () => {
  it("keeps the base colour in shaded mode and drops it in the others", () => {
    expect(surfaceAppearance("shaded", 0xc0ffee).colour).toBe(0xc0ffee);
    expect(surfaceAppearance("hidden-line", 0xc0ffee).colour).toBe(0xffffff);
    expect(surfaceAppearance("ghost", 0xc0ffee).colour).not.toBe(0xc0ffee);
  });

  it("lets a part behind read through a ghost", () => {
    const ghost = surfaceAppearance("ghost", 0x888888);
    expect(ghost.opacity).toBeLessThan(0.3);
    // the one that matters: with depth writing on, the nearest ghost hides
    // everything behind it and the mode shows nothing it was asked for
    expect(ghost.depthWrite).toBe(false);
  });

  it("pushes hidden-line surfaces back so the creases sit on top", () => {
    expect(surfaceAppearance("hidden-line", 0).polygonOffset).toBe(true);
    expect(surfaceAppearance("shaded", 0).polygonOffset).toBe(false);
  });

  it("draws creases hardest in hidden line and softest in ghost", () => {
    expect(edgeStyle("hidden-line").opacity).toBe(1);
    expect(edgeStyle("ghost").opacity).toBeLessThan(edgeStyle("shaded").opacity);
    expect(edgeStyle("hidden-line").colour).not.toBe(edgeStyle("shaded").colour);
  });
});

describe("light balance", () => {
  it("never casts a shadow in ghost mode", () => {
    expect(lightBalance("ghost", true).shadowed).toBe(false);
    expect(lightBalance("shaded", true).shadowed).toBe(true);
    expect(lightBalance("shaded", false).shadowed).toBe(false);
  });

  it("steps the sky back when the sun is doing the work", () => {
    const lit = lightBalance("shaded", true);
    const flat = lightBalance("shaded", false);
    expect(lit.sun).toBeGreaterThan(flat.sun);
    expect(lit.sky).toBeLessThan(flat.sky);
  });

  it("lightens the shadow over a white hidden-line page", () => {
    expect(lightBalance("hidden-line", true).groundOpacity)
      .toBeLessThan(lightBalance("shaded", true).groundOpacity);
  });
});

describe("standard views", () => {
  // phi is measured from +Y, theta around Y from +Z towards +X
  it("puts the camera on the axis each view is named for", () => {
    const H = Math.PI / 2;
    expect(standardOrbit("front")).toEqual({ phi: H, theta: 0 });
    expect(standardOrbit("back").theta).toBeCloseTo(Math.PI);
    expect(standardOrbit("right").theta).toBeCloseTo(H);
    expect(standardOrbit("left").theta).toBeCloseTo(-H);
    expect(standardOrbit("iso").phi).toBeGreaterThan(0);
    expect(standardOrbit("iso").phi).toBeLessThan(H);
  });

  it("holds top and bottom off the pole, where the view would roll freely", () => {
    expect(standardOrbit("top").phi).toBeGreaterThan(0);
    expect(standardOrbit("top").phi).toBeLessThan(0.01);
    expect(Math.PI - standardOrbit("bottom").phi).toBeLessThan(0.01);
  });
});

describe("framing", () => {
  it("pulls back further for a bigger subject, proportionally", () => {
    const near = fitRadius(1, 45, 1);
    const far = fitRadius(10, 45, 1);
    expect(far).toBeCloseTo(near * 10);
  });

  it("fits the tighter axis, so a portrait panel does not clip a wide building", () => {
    // the bug this prevents: fitting on the vertical only, which leaves a
    // building running off both sides of a tall narrow panel
    const wide = fitRadius(5, 45, 2);       // landscape: vertical is tighter
    const tall = fitRadius(5, 45, 0.5);     // portrait: horizontal is tighter
    expect(tall).toBeGreaterThan(wide);
  });

  it("never lets the camera sit inside the subject", () => {
    expect(fitRadius(0, 45, 1)).toBeGreaterThanOrEqual(1);
  });

  it("frames the same subject in both projections", () => {
    // an orthographic frustum built from the perspective distance and field of
    // view shows the same extent, so switching changes the convention only
    const distance = fitRadius(5, 45, 1.5);
    const f = orthoFrustum(distance, 45, 1.5);
    const halfHeight = distance * Math.tan((45 * Math.PI) / 180 / 2);
    expect(f.top).toBeCloseTo(halfHeight);
    expect(f.bottom).toBeCloseTo(-halfHeight);
    expect(f.right - f.left).toBeCloseTo((f.top - f.bottom) * 1.5);
  });
});
