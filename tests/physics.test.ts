/** Spring-mass physics: the default floor lies under the default gravity. */
import { describe, it, expect } from "vitest";
import { SpringSystem3D } from "../src/core/physics";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";

describe("SpringSystem3D defaults", () => {
  it("a mesh at the origin falls a little, and is not thrown to a floor on another axis", () => {
    const sim = new SpringSystem3D();
    sim.initFromMesh(MeshFactory.box(1, 1, 1));
    const z0 = sim.pos.map(p => p.z), y0 = Math.min(...sim.pos.map(p => p.y));
    for (let i = 0; i < 5; i++) sim.step(1 / 60);
    expect(Math.max(...sim.pos.map((p, i) => Math.abs(p.z - z0[i])))).toBeLessThan(0.05);
    expect(Math.min(...sim.pos.map(p => p.y))).toBeLessThan(y0);              // gravity −Y pulls it down
    expect(Math.min(...sim.pos.map(p => p.y))).toBeGreaterThan(-10);          // above the floor at y = −10
  });
});
