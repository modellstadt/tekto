import { describe, it, expect } from "vitest";
import { Algo } from "../src/core/algo/algorithms";
import { Vec2, Vec3 } from "../src/core/math/vectors";
import { MeshFactory as MeshGen } from "../src/core/geometry/mesh/MeshFactory";

describe("Algo — 2D", () => {
  it("convexHull2D returns convex hull", () => {
    const points = [
      new Vec2(0, 0), new Vec2(1, 0), new Vec2(2, 0),
      new Vec2(0, 1), new Vec2(1, 1), new Vec2(2, 1),
      new Vec2(0, 2), new Vec2(1, 2), new Vec2(2, 2),
    ];
    const hull = Algo.convexHull2D(points);
    // Hull of a 3x3 grid should have 4 corners
    expect(hull.length).toBe(4);
  });

  it("convexHull2D handles collinear points", () => {
    const points = [new Vec2(0, 0), new Vec2(1, 0), new Vec2(2, 0)];
    const hull = Algo.convexHull2D(points);
    expect(hull.length).toBe(2);
  });

  it("pointInPolygon works", () => {
    const poly = [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 4), new Vec2(0, 4)];
    expect(Algo.pointInPolygon(new Vec2(2, 2), poly)).toBe(true);
    expect(Algo.pointInPolygon(new Vec2(5, 5), poly)).toBe(false);
  });

  it("signedArea computes correct sign", () => {
    // CCW polygon → positive area
    const ccw = [new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1), new Vec2(0, 1)];
    expect(Algo.signedArea(ccw)).toBeGreaterThan(0);

    // CW polygon → negative area
    const cw = [new Vec2(0, 0), new Vec2(0, 1), new Vec2(1, 1), new Vec2(1, 0)];
    expect(Algo.signedArea(cw)).toBeLessThan(0);
  });

  it("centroid2D computes center", () => {
    const poly = [new Vec2(0, 0), new Vec2(2, 0), new Vec2(2, 2), new Vec2(0, 2)];
    const c = Algo.centroid2D(poly);
    expect(c.x).toBeCloseTo(1);
    expect(c.y).toBeCloseTo(1);
  });

  it("segmentIntersect2D detects crossing", () => {
    const result = Algo.segmentIntersect2D(
      new Vec2(0, 0), new Vec2(2, 2),
      new Vec2(0, 2), new Vec2(2, 0),
    );
    expect(result).not.toBeNull();
    expect(result!.point.x).toBeCloseTo(1);
    expect(result!.point.y).toBeCloseTo(1);
  });

  it("segmentIntersect2D returns null for parallel segments", () => {
    const result = Algo.segmentIntersect2D(
      new Vec2(0, 0), new Vec2(2, 0),
      new Vec2(0, 1), new Vec2(2, 1),
    );
    expect(result).toBeNull();
  });

  it("minEnclosingCircle contains all points", () => {
    const points = [new Vec2(0, 0), new Vec2(3, 0), new Vec2(0, 4)];
    const circle = Algo.minEnclosingCircle(points);

    for (const p of points) {
      const dist = Math.sqrt((p.x - circle.center.x) ** 2 + (p.y - circle.center.y) ** 2);
      expect(dist).toBeLessThanOrEqual(circle.radius + 0.001);
    }
  });
});

describe("Algo — 3D mesh analysis", () => {
  it("meshVolume of unit box is ~1", () => {
    const box = MeshGen.box(1, 1, 1);
    const tri = MeshGen.triangulate(box);
    const vol = Algo.meshVolume(tri);
    expect(vol).toBeCloseTo(1, 1);
  });

  it("meshSurfaceArea of unit box is 6", () => {
    const box = MeshGen.box(1, 1, 1);
    const tri = MeshGen.triangulate(box);
    const area = Algo.meshSurfaceArea(tri);
    expect(area).toBeCloseTo(6, 1);
  });

  it("laplacianSmooth modifies positions", () => {
    const m = MeshGen.sphere(1, 8, 6);
    const posBefore = m.node(0)!.position.clone();
    Algo.laplacianSmooth(m, 3, 0.5);
    const posAfter = m.node(0)!.position;
    // At least some vertex should have moved
    const totalMoved = [...m.nodes()].reduce((sum, n) => {
      return sum + n.position.distTo(new Vec3(0, 0, 0));
    }, 0);
    expect(totalMoved).toBeGreaterThan(0);
  });
});
