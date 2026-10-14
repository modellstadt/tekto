import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Wall, WallOpening, WallSystem } from "../src/core/geometry/walls";
import { WallType, HolzrahmenBau, BalloonFrame } from "../src/bim/walls";

// A 4 m wall, 2.6 m high, one window; the plates are 60 mm high (plateProfile.w).
function frame(construction: ReturnType<typeof HolzrahmenBau>, head: number) {
  const wall = new Wall({
    centerline: [new Vec2(0, 0), new Vec2(4, 0)], thickness: 0.2, height: 2.6, baseElevation: 0,
    type: new WallType({ name: "test", construction }),
  });
  wall.openings.push(WallOpening.window(2, 1.6, 0.3, head));
  return new WallSystem([wall]).realize()[0].parts;
}
const zs = (p: { mesh: { positions: ArrayLike<number> } }) => Array.from(p.mesh.positions).filter((_, k) => k % 3 === 2);
const top = (parts: { mesh: { positions: ArrayLike<number> } }[]) => Math.max(...parts.flatMap(zs));
// cripples over the opening: members between its head and the top plate
const above = (parts: ReturnType<typeof frame>, head: number) =>
  parts.filter((p) => p.role === "cripple" && Math.min(...zs(p)) >= head - 1e-6);

describe("an opening up to the top plate", () => {
  for (const [name, make] of [
    ["HolzrahmenBau", () => HolzrahmenBau({ plateProfile: { w: 0.06, h: 0.2, name: "KVH 60×200" } })],
    ["BalloonFrame", () => BalloonFrame({ plateProfile: { w: 0.06, h: 0.2, name: "plate" } })],
  ] as const) {
    it(`${name}: a window with room above gets its header and cripples`, () => {
      const parts = frame(make() as ReturnType<typeof HolzrahmenBau>, 2.2);
      expect(parts.filter((p) => p.role === "header")).toHaveLength(1);
      expect(above(parts, 2.2).length).toBeGreaterThan(0);
    });

    it(`${name}: a window to the underside of the top plate gets neither, and nothing crosses the plate`, () => {
      const parts = frame(make() as ReturnType<typeof HolzrahmenBau>, 2.6 - 0.06);
      expect(parts.filter((p) => p.role === "header")).toHaveLength(0);
      expect(above(parts, 2.6 - 0.06)).toHaveLength(0);
      // every member stays inside the wall's height
      expect(top(parts)).toBeLessThanOrEqual(2.6 + 1e-9);
      // the sill and the cripples below it are still there
      expect(parts.some((p) => p.role === "blocking")).toBe(true);
    });
  }
});
