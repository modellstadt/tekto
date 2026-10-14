/**
 * Lights as scene objects: what `addLight` keeps, what it refuses, and that a snapshot's
 * summary lists a light at its place (it has no geometry to measure).
 */
import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { Scene } from "../src/scene/Scene";
import { sceneSummary, describeSceneObject } from "../src/sketch/AgentBridge";

describe("scene.addLight", () => {
  it("keeps a point light with neutral defaults, and a spot with its target", () => {
    const scene = new Scene();
    const bulb = scene.addLight(new Vec3(1, 2, 2.4));
    expect(bulb).toMatchObject({ type: "light", position: { x: 1, y: 2, z: 2.4 }, light: { kind: "point", intensity: 4, range: 8 } });
    expect(bulb.style.color).toBe("#ffffff");
    const spot = scene.addLight(new Vec3(0, 0, 3), { kind: "spot", target: new Vec3(0, 2, 0), angle: 25, intensity: 10 }, { color: "#ffd2a0" });
    expect(spot.light).toMatchObject({ kind: "spot", angle: 25, intensity: 10, target: { x: 0, y: 2, z: 0 } });
    expect(spot.style.color).toBe("#ffd2a0");
  });

  it("refuses what cannot be a light, saying why", () => {
    const scene = new Scene();
    expect(() => scene.addLight(new Vec3(NaN, 0, 0))).toThrow(/non-finite position/);
    expect(() => scene.addLight(new Vec3(0, 0, 0), { intensity: -1 })).toThrow(/intensity/);
    expect(() => scene.addLight(new Vec3(0, 0, 0), { kind: "spot" })).toThrow(/needs a target/);
    expect(() => scene.addLight(new Vec3(0, 0, 0), { kind: "spot", target: new Vec3(1, 0, 0), angle: 120 })).toThrow(/half angle/);
  });

  it("is listed in a snapshot's summary at its place", () => {
    const scene = new Scene();
    const id = scene.addLight(new Vec3(1, 2, 3), {}, { label: "lamp" }).id;
    const renderer = {
      isObjectShown: () => true,
      objectBounds: () => null,                                  // no geometry
      cameraState: () => ({ projection: "perspective" as const, position: [0, 0, 10], target: [0, 0, 0], up: [0, 0, 1], fov: 55 }),
    };
    const summary = sceneSummary(scene, renderer, (i) => describeSceneObject(scene, i)) as { scene: { shownObjects: number; groups: { type: string; label?: string; bounds: number[][] }[] } };
    expect(summary.scene.shownObjects).toBe(1);
    expect(summary.scene.groups[0]).toMatchObject({ type: "light", label: "lamp", bounds: [[1, 2, 3], [1, 2, 3]] });
    expect(id).toMatch(/^light_/);
  });
});
