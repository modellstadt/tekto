import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Wall, WallSystem } from "../src/core/geometry/walls";

// An L of two walls, 200 mm thick, meeting at (4, 0): mitred (the default), or butt with `a` through.
function corner(butt = false) {
  const a = new Wall({ centerline: [new Vec2(0, 0), new Vec2(4, 0)], thickness: 0.2, height: 2.6, baseElevation: 0 });
  const b = new Wall({ centerline: [new Vec2(4, 0), new Vec2(4, 3)], thickness: 0.2, height: 2.6, baseElevation: 0 });
  const system = new WallSystem([a, b]);
  if (butt) for (const j of system.joints) { j.style = "butt"; j.throughWall = a; }
  return system.realize();
}
const box = (m: { positions: ArrayLike<number> }) => {
  const p = Array.from(m.positions);
  const xs = p.filter((_, k) => k % 3 === 0), ys = p.filter((_, k) => k % 3 === 1);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

describe("the envelopes of a wall system", () => {
  it("meet at a mitred corner: both reach the outer corner", () => {
    const [a, b] = corner().map((r) => box(r.envelopeMesh));
    expect([a.x1, a.y0]).toEqual([4.1, -0.1].map((v) => expect.closeTo(v, 6)));
    expect([b.x1, b.y0]).toEqual([4.1, -0.1].map((v) => expect.closeTo(v, 6)));
  });

  it("meet at a butt corner as the system's mesh does: the outer corner filled, nothing twice", () => {
    const [a, b] = corner(true).map((r) => box(r.envelopeMesh));
    // the outer corner square (x 4…4.1, y −0.1…0) lies in one of them
    const inside = (q: ReturnType<typeof box>) => q.x0 <= 4.05 && q.x1 >= 4.05 && q.y0 <= -0.05 && q.y1 >= -0.05;
    expect(inside(a) || inside(b)).toBe(true);
    // and they share no area
    const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    expect(w <= 1e-9 || h <= 1e-9).toBe(true);
  });

  it("leave a wall realized on its own as it was", () => {
    const w = new Wall({ centerline: [new Vec2(0, 0), new Vec2(4, 0)], thickness: 0.2, height: 2.6, baseElevation: 0 });
    expect(box(new WallSystem([w]).realize()[0].envelopeMesh)).toEqual(box(w.toMesh()));
  });
});
