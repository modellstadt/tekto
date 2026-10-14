/**
 * The rules the renderer draws by, tested without a GPU.
 *
 * Everything here is a plain function on purpose: the parts of a viewport that
 * are easy to get quietly wrong (which axis a named view looks down, whether a
 * wide model fits a narrow panel, whether ghost mode still writes depth) are
 * the parts that need no WebGL to check.
 */
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  edgeStyle, surfaceAppearance, lightBalance, standardOrbit, fitRadius, orthoFrustum,
  modeBackground, groundAppearance, sectionAppearance, DEFAULT_BACKGROUND,
  orbitFor, shortestTurn, nearestAxis, easeInOut, sectionPlane, viewDirection, calloutSamples, occludes, rayTargets, cameraKey,
  groundGrid, gridLineColour, daylight, sunDirection, SUN_PRESETS,
} from "../src/render/viewRules";

/** Rough perceptual brightness of a packed hex colour, 0 to 255. */
function luminance(hex: number): number {
  const [r, g, b] = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("view modes", () => {
  it("keeps the base colour wherever the colour still means something", () => {
    expect(surfaceAppearance("shaded", 0xc0ffee).colour).toBe(0xc0ffee);
    // hidden line is a drawing: every surface is white paper by definition
    expect(surfaceAppearance("hidden-line", 0xc0ffee).colour).toBe(0xffffff);
    // ghost keeps it. Flattening every part to one grey threw away the thing
    // an app colours by, so the mode you would use to find a part inside the
    // whole was the one mode that could not show which product it carries.
    expect(surfaceAppearance("ghost", 0xc0ffee).colour).toBe(0xc0ffee);
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

  it("draws creases hardest in hidden line", () => {
    expect(edgeStyle("hidden-line").opacity).toBe(1);
    expect(edgeStyle("hidden-line").colour).not.toBe(edgeStyle("shaded").colour);
  });

  it("inverts ghost, rather than fading it until nothing reads", () => {
    // Ghost used to be dark creases at a quarter opacity on a near-white page,
    // which is the faintest thing a screen can draw. It is now light creases
    // on a dark ground: the same information, at a contrast you can see.
    const ghost = edgeStyle("ghost");
    expect(modeBackground("ghost", DEFAULT_BACKGROUND)).not.toBe(DEFAULT_BACKGROUND);
    expect(luminance(ghost.colour)).toBeGreaterThan(luminance(modeBackground("ghost", DEFAULT_BACKGROUND)));
    expect(ghost.opacity).toBeGreaterThan(edgeStyle("shaded").opacity);
    // and the other modes keep whatever page the host asked for
    expect(modeBackground("shaded", 0x123456)).toBe(0x123456);
    expect(modeBackground("hidden-line", 0x123456)).toBe(0x123456);
  });

  it("stands the content on a ground everywhere but the drawing", () => {
    expect(groundAppearance("shaded").visible).toBe(true);
    expect(groundAppearance("ghost").visible).toBe(true);
    expect(groundAppearance("hidden-line").visible).toBe(false);
    // a step off the page it sits on, never a colour competing with the model
    for (const mode of ["shaded", "ghost"] as const) {
      const page = modeBackground(mode, DEFAULT_BACKGROUND);
      expect(groundAppearance(mode).colour).not.toBe(page);
      expect(Math.abs(luminance(groundAppearance(mode).colour) - luminance(page)))
        .toBeLessThan(40);
    }
  });
});

describe("cut faces", () => {
  it("draws a cut dark, so it reads as material rather than as a surface", () => {
    // poché: the convention is that cut material is one solid mass, which is
    // what separates what was sliced from what is merely seen beyond it. This
    // was a warm mid grey and read as another surface among the surfaces
    const page = modeBackground("shaded", DEFAULT_BACKGROUND);
    expect(luminance(sectionAppearance("shaded").colour))
      .toBeLessThan(luminance(page) - 100);
  });

  it("agrees with the line weight of the drawing it belongs to", () => {
    expect(sectionAppearance("hidden-line").colour).toBe(edgeStyle("hidden-line").colour);
  });

  it("inverts on ghost's dark ground, where a black cut would be a hole", () => {
    const ghostPage = modeBackground("ghost", DEFAULT_BACKGROUND);
    expect(luminance(sectionAppearance("ghost").colour)).toBeGreaterThan(luminance(ghostPage));
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

describe("navigation", () => {
  /** What the tick loop does with a spherical, so a round trip is checkable. */
  function cameraDirection(orbit: { phi: number; theta: number }): THREE.Vector3 {
    return new THREE.Vector3()
      .setFromSpherical(new THREE.Spherical(1, orbit.phi, orbit.theta)).normalize();
  }

  it("puts the camera on the axis the gizmo was clicked on", () => {
    for (const axis of [
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
    ]) {
      const back = cameraDirection(orbitFor(axis));
      expect(back.distanceTo(axis)).toBeLessThan(1e-6);
    }
  });

  it("holds the poles off, so clicking Y is a plan and not a random roll", () => {
    // the same guard the named views get: straight down the up vector, the
    // camera has no defined orientation and north lands wherever
    expect(orbitFor({ x: 0, y: 1, z: 0 }).phi).toBe(standardOrbit("top").phi);
    expect(orbitFor({ x: 0, y: -1, z: 0 }).phi).toBe(standardOrbit("bottom").phi);
  });

  it("turns the short way round", () => {
    // the bug: 3.0 to -3.0 is a tenth of a turn apart on screen, and
    // interpolating the numbers spins the building nearly the whole way about
    expect(shortestTurn(3.0, -3.0)).toBeCloseTo(3.0 + (Math.PI * 2 - 6.0));
    expect(Math.abs(shortestTurn(3.0, -3.0) - 3.0)).toBeLessThan(Math.PI);
    expect(shortestTurn(0.2, 0.5)).toBeCloseTo(0.5);
    // and it lands on an angle that is still the one asked for
    const turned = shortestTurn(3.0, -3.0);
    expect(Math.cos(turned)).toBeCloseTo(Math.cos(-3.0));
    expect(Math.sin(turned)).toBeCloseTo(Math.sin(-3.0));
  });

  it("snaps to the axis the view is already nearest", () => {
    expect(nearestAxis({ x: 0.9, y: 0.2, z: 0.1 })).toEqual(new THREE.Vector3(1, 0, 0));
    expect(nearestAxis({ x: -0.1, y: -0.9, z: 0.2 })).toEqual(new THREE.Vector3(0, -1, 0));
    // an exact corner has to pick one rather than return nothing
    expect(nearestAxis({ x: 1, y: 1, z: 1 }).length()).toBe(1);
  });

  it("eases in and out, and ends where it was sent", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    // a frame late must not overshoot: the clamp is what ends the animation
    expect(easeInOut(1.4)).toBe(1);
    expect(easeInOut(-0.2)).toBe(0);
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

describe("section planes", () => {
  const Z = new THREE.Vector3(0, 0, 1);
  const kept = (plane: THREE.Plane, z: number) => plane.distanceToPoint(new THREE.Vector3(0, 0, z)) >= 0;

  it("a coordinate cut keeps what is below it, flip what is above — at the same place", () => {
    const below = sectionPlane({ axis: "z", coordinate: 2 }, Z, null)!;
    expect([kept(below, 1), kept(below, 3)]).toEqual([true, false]);
    const above = sectionPlane({ axis: "z", coordinate: 2, flip: true }, Z, null)!;
    expect([kept(above, 1), kept(above, 3)]).toEqual([false, true]);
  });

  it("a fraction is measured through the content; flipping doesn't move the cut", () => {
    const box = new THREE.Box3(new THREE.Vector3(-1, -1, 0), new THREE.Vector3(1, 1, 10));
    const p = sectionPlane({ axis: "z", at: 0.3 }, Z, box)!;
    const q = sectionPlane({ axis: "z", at: 0.3, flip: true }, Z, box)!;
    expect(p.distanceToPoint(new THREE.Vector3(0, 0, 3))).toBeCloseTo(0, 9);
    expect(q.distanceToPoint(new THREE.Vector3(0, 0, 3))).toBeCloseTo(0, 9);
    expect(sectionPlane({ axis: "z" }, Z, box)!.distanceToPoint(new THREE.Vector3(0, 0, 5))).toBeCloseTo(0, 9);
    // nothing loaded, nothing to measure a fraction against
    expect(sectionPlane({ axis: "z", at: 0.5 }, Z, new THREE.Box3())).toBeNull();
  });

  it("ghost creases go dark on a light page, so they can still be seen", () => {
    expect(luminance(edgeStyle("ghost").colour)).toBeGreaterThan(200);
    expect(luminance(edgeStyle("ghost", 0xffffff).colour)).toBeLessThan(60);
  });
});

describe("named views on the renderer", () => {
  const r = (v: THREE.Vector3) => v.toArray().map(x => Math.round(x * 1000) / 1000 + 0);
  it("a Z-up plan looks down with north up; elevations look level from their side", () => {
    expect(r(viewDirection("top", "z"))).toEqual([0, -0.001, 1]);
    expect(r(viewDirection("front", "z"))).toEqual([0, -1, 0]);
    expect(r(viewDirection("right", "z"))).toEqual([1, 0, 0]);
    expect(r(viewDirection("back", "z"))).toEqual([0, 1, 0]);
  });
  it("Y-up keeps three.js's own front (+Z) and looks down -Y for a plan", () => {
    expect(r(viewDirection("top", "y"))).toEqual([0, 1, 0.001]);
    expect(r(viewDirection("front", "y"))).toEqual([0, 0, 1]);
  });
  it("iso foreshortens all three axes alike", () => {
    const [x, y, z] = viewDirection("iso", "z").toArray().map(Math.abs);
    expect(x).toBeCloseTo(y, 12);
    expect(y).toBeCloseTo(z, 12);
    expect(viewDirection("iso", "z").length()).toBeCloseTo(1, 12);
  });
  it("agrees with the spherical named views once a Z-up content turn is undone", () => {
    for (const v of ["top", "front", "right", "back", "left"] as const) {
      const o = standardOrbit(v);
      const world = new THREE.Vector3().setFromSpherical(new THREE.Spherical(1, o.phi, o.theta));
      const content = new THREE.Vector3(world.x, -world.z, world.y);      // Z-up content turned into Y-up: -90° about X
      expect(r(content)).toEqual(r(viewDirection(v, "z")));
    }
  });
});

describe("callout visibility", () => {
  it("looks at the centre first, then inside each corner", () => {
    const box = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(8, 2.7, 0.25));
    const samples = calloutSamples(box);
    expect(samples).toHaveLength(9);
    expect(samples[0].toArray()).toEqual([4, 1.35, 0.125]);
    // every point inside the box, none on its corners
    for (const p of samples) expect(box.containsPoint(p)).toBe(true);
    expect(samples.slice(1).some((p) => p.x === 0 || p.x === 8)).toBe(false);
  });

  it("is hidden only by what the renderer would let hide it", () => {
    expect(occludes(new THREE.MeshStandardMaterial())).toBe(true);
    // ghost, and anything an app has made see-through, writes no depth
    expect(occludes(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.11, depthWrite: false }))).toBe(false);
    expect(occludes(new THREE.MeshStandardMaterial({ visible: false }))).toBe(false);
    expect(occludes([new THREE.MeshBasicMaterial()])).toBe(true);
  });
});

describe("fading grid ground", () => {
  it("spaces the grid in round metres for the size of the content", () => {
    expect(groundGrid(8)).toMatchObject({ minor: 1, major: 5 });       // a house
    expect(groundGrid(60)).toMatchObject({ minor: 10, major: 50 });    // a block
    expect(groundGrid(1).minor).toBeCloseTo(0.1);                      // a component
    // solid under the content, gone well inside the sheet, so no edge shows
    const g = groundGrid(8);
    expect(g.fadeFrom).toBeGreaterThan(8);
    expect(g.fadeTo).toBeLessThan(g.size / 2);
    // never zero or negative, whatever it is handed
    expect(groundGrid(0).minor).toBeGreaterThan(0);
  });

  it("rules its lines a step off the page, toward the other end", () => {
    for (const page of [0x0a0b14, 0xf4f6f9]) {
      const step = luminance(gridLineColour(page)) - luminance(page);
      expect(Math.sign(step)).toBe(luminance(page) > 127 ? -1 : 1);
      expect(Math.abs(step)).toBeLessThan(64);                          // a rule, not a drawing
    }
  });
});

describe("daylight", () => {
  it("is Studio's own balance at a high sun, and 7DHouse's evening at 20°", () => {
    expect(daylight(60)).toMatchObject({ sun: 0xffffff, sunIntensity: 2.8, exposure: 1, backgroundAmount: 0 });
    expect(daylight(20)).toMatchObject({ sun: 0xffc898, sky: 0x6a7ca6, exposure: 1.25 });
    expect(daylight(NaN)).toEqual(daylight(90));
  });

  it("dims, warms and opens up steadily as the sun goes down, to night", () => {
    let prev = daylight(90);
    for (let a = 89; a >= -20; a--) {
      const d = daylight(a);
      expect(d.sunIntensity).toBeLessThanOrEqual(prev.sunIntensity + 1e-9);
      expect(d.exposure).toBeGreaterThanOrEqual(prev.exposure - 1e-9);
      expect(d.backgroundAmount).toBeGreaterThanOrEqual(prev.backgroundAmount - 1e-9);
      prev = d;
    }
    expect(daylight(-20).sunIntensity).toBe(0);
    const evening = daylight(10).sun;
    expect((evening >> 16) & 255).toBeGreaterThan(evening & 255);      // warm: more red than blue
  });
});

describe("sun presets", () => {
  it("put the sun where the names say: east in the morning, south at noon, west at sunset", () => {
    const at = (n: "morning" | "noon" | "sunset") => sunDirection(SUN_PRESETS[n].azimuth, SUN_PRESETS[n].altitude);
    expect(at("morning").x).toBeGreaterThan(0.9);                    // +X is east
    expect(at("noon").y).toBeLessThan(-0.5);                         // south of the zenith (−Y)
    expect(at("sunset").x).toBeLessThan(-0.9);                       // west
    for (const n of ["morning", "noon", "sunset"] as const) {
      const d = at(n);
      expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 9);
      expect(Math.asin(d.z) * 180 / Math.PI).toBeCloseTo(SUN_PRESETS[n].altitude, 9);
    }
  });
});

describe("callout checks on a large model", () => {
  it("keys a still camera the same whatever the sign of its noise", () => {
    expect(cameraKey([1e-13, 2], [1])).toBe(cameraKey([-1e-13, 2], [1]));
    expect(cameraKey([0.5])).not.toBe(cameraKey([0.500002]));
  });

  it("casts at surfaces only: no crease lines, no wire overlay", () => {
    const group = new THREE.Group();
    const surface = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    const overlay = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ wireframe: true }));
    const creases = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial());
    group.add(surface, overlay, creases);
    const hidden = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    hidden.visible = false;
    expect(rayTargets([group, hidden])).toEqual([surface]);
  });
});
