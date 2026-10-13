/**
 * Failing loudly.
 *
 * An agent can only fix what it can see. Until 0.7 a bad input became quiet garbage: a
 * face pointing at a node that doesn't exist went straight into the index buffer, a NaN
 * position rendered as nothing, a loft over mismatched profiles used the shorter one,
 * an over-inset polygon came back inverted, writeDxf3D wrote NaN as 0. Now a certain bug
 * throws where it happens, with the name of the call and the value; and `validate()`
 * reports what is wrong with a mesh that was built without one.
 */
import { describe, it, expect } from "vitest";
import { Vec2, Vec3 } from "../src/core/math/vectors";
import { Mesh } from "../src/core/geometry/mesh/Mesh";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";
import { MeshTransform } from "../src/core/geometry/mesh/MeshTransform";
import { Polygon2D } from "../src/core/geometry/Polygon2D";
import { writeDxf3D } from "../src/io/DxfWriter";

describe("Mesh refuses certain bugs where they happen", () => {
  it("addFace: missing nodes and faces under 3 nodes throw", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0)), b = m.addNode(new Vec3(1, 0, 0));
    expect(() => m.addFace([a, b, 99])).toThrow(/node 99 does not exist/);
    expect(() => m.addFace([a, b])).toThrow(/at least 3 nodes, got 2/);
    m.removeNode(b);
    expect(() => m.addFace([a, b, a])).toThrow(/node 1 does not exist/);
    expect(m.faceCount).toBe(0);
  });

  it("addNode and setPosition refuse non-finite positions", () => {
    const m = new Mesh();
    expect(() => m.addNode(new Vec3(0, NaN, 0))).toThrow(/non-finite position/);
    const a = m.addNode(new Vec3(0, 0, 0));
    expect(() => m.setPosition(a, new Vec3(Infinity, 0, 0))).toThrow(/node 0 would get a non-finite position/);
    expect(m.getPosition(a).x).toBe(0);
  });

  it("loading an old JSON skips the degenerate faces the Map-based mesh allowed", () => {
    const m = Mesh.fromJSON({
      nodes: [{ id: 0, position: { x: 0, y: 0, z: 0 } }, { id: 1, position: { x: 1, y: 0, z: 0 } }, { id: 2, position: { x: 0, y: 1, z: 0 } }],
      faces: [{ id: 0, nodes: [0, 1] }, { id: 1, nodes: [0, 1, 2] }],
    });
    expect(m.faceCount).toBe(1);
  });
});

describe("MeshFactory names the bad argument", () => {
  it("throws instead of building NaN or skipping silently", () => {
    expect(() => MeshFactory.grid(1, 1, 0, 4)).toThrow(/MeshFactory\.grid: divisions must be whole numbers ≥ 1, got 0 × 4/);
    expect(() => MeshFactory.sphere(1, 2, 8)).toThrow(/MeshFactory\.sphere/);
    expect(() => MeshFactory.cylinder(1, 1, 2, 2.5)).toThrow(/MeshFactory\.cylinder/);
    expect(() => MeshFactory.torus(1, 0.3, 2, 8)).toThrow(/MeshFactory\.torus/);
    expect(() => MeshFactory.revolve([new Vec2(1, 0)])).toThrow(/MeshFactory\.revolve: the profile needs at least 2 points/);
    expect(() => MeshFactory.pipe([new Vec3(0, 0, 0)], 0.1)).toThrow(/MeshFactory\.pipe: the path needs at least 2 points/);
    expect(() => MeshFactory.extrude([new Vec3(0, 0, 0), new Vec3(1, 0, 0)], new Vec3(0, 0, 0))).toThrow(/non-zero vector/);
  });

  it("loft over profiles of different lengths throws (it used the shorter one)", () => {
    const ring = (n: number, z: number) => Array.from({ length: n }, (_, i) => new Vec3(Math.cos(i), Math.sin(i), z));
    expect(() => MeshFactory.loft([ring(4, 0), ring(6, 1)])).toThrow(/same number of points \(≥ 2\), got 4, 6/);
    expect(() => MeshFactory.loft([ring(4, 0)])).toThrow(/at least 2 profiles/);
  });

  it("a NaN that reaches a node is still caught at the node", () => {
    expect(() => MeshFactory.sphere(NaN, 8, 6)).toThrow(/Mesh\.addNode: non-finite position/);
  });
});

describe("Mesh.validate", () => {
  it("passes sound meshes, closed and open, and reports the solid's volume", () => {
    const box = MeshFactory.box(1, 2, 3).validate();
    expect(box).toMatchObject({ valid: true, issues: [], closed: true });
    expect(box.signedVolume).toBeCloseTo(6, 10);
    const grid = MeshFactory.grid(2, 2, 4, 4).validate();
    expect(grid.valid).toBe(true);
    expect(grid.closed).toBe(false);
    expect(grid.counts.boundaryEdges).toBe(16);
  });

  it("reports a closed mesh that is inside-out", () => {
    const box = MeshFactory.box(1, 1, 1);
    MeshTransform.flipFaces(box);
    const r = box.validate();
    expect(r.valid).toBe(false);
    expect(r.issues.join()).toMatch(/inside-out/);
  });

  it("reports faces wound against their neighbours", () => {
    const box = MeshFactory.box(1, 1, 1);
    box.reverseFace(0);
    const r = box.validate();
    expect(r.counts.inconsistentEdges).toBe(4);
    expect(r.issues.join()).toMatch(/4 edges between faces wound against each other/);
  });

  it("reports non-manifold edges, degenerate faces and NaN written into the arrays", () => {
    const m = new Mesh();
    const [a, b, c, d, e] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]].map(([x, y, z]) => m.addNode(new Vec3(x, y, z)));
    m.addTriangle(a, b, c); m.addTriangle(b, a, d); m.addTriangle(a, b, e);   // three faces on edge a–b
    const f = m.addNode(new Vec3(2, 0, 0)), g = m.addNode(new Vec3(3, 0, 0));
    m.addTriangle(b, f, g);                                                    // collinear: zero area
    m.positions[e * 3] = NaN; m.markPositionsChanged();
    const r = m.validate();
    expect(r.counts.nonManifoldEdges).toBe(1);
    expect(r.counts.degenerateFaces).toBe(1);
    expect(r.counts.nonFiniteNodes).toBe(1);
    expect(r.issues.length).toBe(3);
  });
});

describe("Polygon2D.offset", () => {
  const square = [new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1), new Vec2(0, 1)];

  it("a ring that repeats its first point offsets without a notch and stays closed", () => {
    const open = Polygon2D.offset(square, 0.1);
    const closed = Polygon2D.offset([...square, square[0]], 0.1);
    expect(closed.length).toBe(5);
    expect(closed[4].distTo(closed[0])).toBe(0);
    closed.slice(0, 4).forEach((p, i) => expect(p.distTo(open[i])).toBeLessThan(1e-12));
    expect(Polygon2D.area(open)).toBeCloseTo(1.44, 10);
  });

  it("insetting past the inner radius returns [] instead of an inverted polygon", () => {
    expect(Polygon2D.offset(square, -0.6)).toEqual([]);
    expect(Polygon2D.area(Polygon2D.offset(square, -0.25))).toBeCloseTo(0.25, 10);
    expect(Polygon2D.offset([...square].reverse(), -0.6)).toEqual([]);
  });

  it("rejects a non-finite distance", () => {
    expect(() => Polygon2D.offset(square, NaN)).toThrow(/finite number/);
  });
});

describe("writeDxf3D", () => {
  it("refuses a NaN coordinate instead of writing 0", () => {
    expect(() => writeDxf3D({ polylines: [{ layer: "a", points: [new Vec3(0, 0, 0), new Vec3(NaN, 1, 0)] }] }))
      .toThrow(/polyline 0 \(layer "a"\) has a non-finite coordinate/);
    expect(() => writeDxf3D({ lines: [{ layer: "b", start: new Vec3(0, 0, 0), end: new Vec3(0, Infinity, 0) }] })).toThrow(/line 0/);
    expect(() => writeDxf3D({ arcs: [{ layer: "c", center: new Vec3(NaN, 0, 0), radius: 1, startDeg: 0, endDeg: 90 }] })).toThrow(/arc 0/);
  });
});
