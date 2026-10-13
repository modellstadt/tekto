/**
 * MeshFactory generators: faces point outward.
 *
 * Orientation is invisible on screen while meshes render double-sided, so it went
 * wrong without anyone seeing it: `extrude` wound its caps against its sides (a unit
 * cube came out with volume 1/3) and `cylinder` was built inside-out. It is not
 * invisible downstream — volumes, IFC and DXF solids, back-face culling, hidden-line
 * views and offsets all read the winding. So for every closed generator the signed
 * volume must be positive and match the analytic volume; for open ones every face must
 * look away from the axis.
 */
import { describe, it, expect } from "vitest";
import { Vec2, Vec3 } from "../src/core/math/vectors";
import { Mesh } from "../src/core/geometry/mesh/Mesh";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";

/** Signed volume: positive when the faces of a closed mesh point outward. */
function signedVolume(m: Mesh): number {
  const p = m.positions, idx = m.indices;
  let v = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    v += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
        + p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2])
        + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
  }
  return v;
}

/** Every face normal looks away from the axis through `origin` along `axis` (open radial shapes). */
function facesLookAwayFromAxis(m: Mesh, origin: Vec3, axis: Vec3): boolean {
  m.computeFaceNormals();
  const a = axis.normalize();
  for (const f of m.faces()) {
    const c = f.nodes.map(i => m.getPosition(i)).reduce((s, p) => s.add(p), Vec3.zero()).div(f.nodes.length);
    const rel = c.sub(origin);
    const radial = rel.sub(a.mul(rel.dot(a)));
    if (f.normal!.dot(radial) <= 0) return false;
  }
  return true;
}

const square = (s = 1) => [new Vec3(0, 0, 0), new Vec3(s, 0, 0), new Vec3(s, s, 0), new Vec3(0, s, 0)];

describe("closed generators have outward faces and the right volume", () => {
  it("box", () => {
    expect(signedVolume(MeshFactory.box(1, 2, 3))).toBeCloseTo(6, 10);
  });

  it("sphere", () => {
    const v = signedVolume(MeshFactory.sphere(1, 96, 64));
    expect(v).toBeGreaterThan(0);
    expect(v).toBeCloseTo((4 / 3) * Math.PI, 1);
  });

  it("cylinder (was inside-out) and cone", () => {
    const v = signedVolume(MeshFactory.cylinder(1, 1, 2, 128));
    expect(v).toBeGreaterThan(0);
    expect(v).toBeCloseTo(2 * Math.PI, 2);
    const cone = signedVolume(MeshFactory.cylinder(0, 1, 3, 128));
    expect(cone).toBeCloseTo(Math.PI, 2);                 // πr²h/3
    expect(MeshFactory.cylinder(1, 1, 2, 24).volume()).toBeCloseTo(Math.abs(signedVolume(MeshFactory.cylinder(1, 1, 2, 24))), 10);
  });

  it("torus", () => {
    const v = signedVolume(MeshFactory.torus(1, 0.3, 128, 64));
    expect(v).toBeGreaterThan(0);
    expect(v).toBeCloseTo(2 * Math.PI * Math.PI * 1 * 0.09, 2);   // 2π²Rr²
  });
});

describe("extrude", () => {
  it("a unit square makes a unit cube, whichever way it winds (was 1/3)", () => {
    expect(signedVolume(MeshFactory.extrude(square(), new Vec3(0, 0, 1)))).toBeCloseTo(1, 10);
    expect(signedVolume(MeshFactory.extrude([...square()].reverse(), new Vec3(0, 0, 1)))).toBeCloseTo(1, 10);
  });

  it("extruding downward or sideways still faces outward", () => {
    expect(signedVolume(MeshFactory.extrude(square(), new Vec3(0, 0, -2)))).toBeCloseTo(2, 10);
    const wall = [new Vec3(0, 0, 0), new Vec3(4, 0, 0), new Vec3(4, 0, 3), new Vec3(0, 0, 3)];
    expect(signedVolume(MeshFactory.extrude(wall, new Vec3(0, 0.2, 0)))).toBeCloseTo(4 * 3 * 0.2, 10);
  });

  it("a concave L keeps its area × height", () => {
    const L = [new Vec3(0, 0, 0), new Vec3(2, 0, 0), new Vec3(2, 1, 0), new Vec3(1, 1, 0), new Vec3(1, 2, 0), new Vec3(0, 2, 0)];
    const m = MeshFactory.extrude(L, new Vec3(0, 0, 1.5));
    expect(m.faceCount).toBe(8);
    expect(signedVolume(m)).toBeCloseTo(3 * 1.5, 10);
  });

  it("without caps the sides still face outward", () => {
    const sq = [new Vec3(-1, -1, 0), new Vec3(1, -1, 0), new Vec3(1, 1, 0), new Vec3(-1, 1, 0)];
    for (const outline of [sq, [...sq].reverse()]) {
      const m = MeshFactory.extrude(outline, new Vec3(0, 0, 1), false);
      expect(m.faceCount).toBe(4);
      expect(facesLookAwayFromAxis(m, Vec3.zero(), new Vec3(0, 0, 1))).toBe(true);
    }
  });
});

describe("open generators", () => {
  const ring = (z: number, r = 1, n = 16) =>
    Array.from({ length: n }, (_, i) => new Vec3(r * Math.cos((i / n) * 2 * Math.PI), r * Math.sin((i / n) * 2 * Math.PI), z));

  it("loft over counter-clockwise rings faces outward", () => {
    const m = MeshFactory.loft([ring(0), ring(1, 1.5), ring(2)]);
    expect(m.faceCount).toBe(2 * 16);
    expect(m.nodeCount).toBe(3 * 16);
    expect(facesLookAwayFromAxis(m, Vec3.zero(), new Vec3(0, 0, 1))).toBe(true);
  });

  it("loft with an open profile skips the closing strip", () => {
    const m = MeshFactory.loft([ring(0).slice(0, 5), ring(1).slice(0, 5)], false);
    expect(m.faceCount).toBe(4);
  });

  it("pipe along a straight path faces outward, with per-point radii", () => {
    const path = [new Vec3(0, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 0, 2)];
    const m = MeshFactory.pipe(path, [0.5, 0.25, 0.5], 12);
    expect(m.nodeCount).toBe(3 * 12);
    expect(m.faceCount).toBe(2 * 12);
    expect(facesLookAwayFromAxis(m, Vec3.zero(), new Vec3(0, 0, 1))).toBe(true);
    const mid = m.getPosition(12);                       // first node of the middle ring
    expect(Math.hypot(mid.x, mid.y)).toBeCloseTo(0.25, 10);
  });

  it("pipe rejects a radius array that does not match the path (was NaN)", () => {
    const path = [new Vec3(0, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 0, 2)];
    expect(() => MeshFactory.pipe(path, [0.5, 0.5])).toThrow(/2 radii for 3 path points/);
  });

  it("revolve of a profile drawn bottom to top faces outward (Y axis)", () => {
    const m = MeshFactory.revolve([new Vec2(1, 0), new Vec2(1.5, 1), new Vec2(1, 2)], 24);
    expect(m.faceCount).toBe(24 * 2);
    expect(m.nodeCount).toBe(24 * 3);                    // closed sweep: no duplicated seam
    expect(facesLookAwayFromAxis(m, Vec3.zero(), new Vec3(0, 1, 0))).toBe(true);
  });

  it("a partial revolve keeps both end slices", () => {
    const m = MeshFactory.revolve([new Vec2(1, 0), new Vec2(1, 1)], 8, Math.PI);
    expect(m.nodeCount).toBe(9 * 2);
    expect(m.faceCount).toBe(8);
  });
});
