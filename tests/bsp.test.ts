import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { BspTree, polygonFromVertices, BspPolygon } from "../src/core/algo/BspTree";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a unit cube [0,1]^3 as 12 triangles. */
function unitCubePolygons(): BspPolygon[] {
  const v = [
    new Vec3(0,0,0), new Vec3(1,0,0), new Vec3(1,1,0), new Vec3(0,1,0), // bottom z=0
    new Vec3(0,0,1), new Vec3(1,0,1), new Vec3(1,1,1), new Vec3(0,1,1), // top z=1
  ];
  // 6 faces, each as a quad (CCW from outside)
  const faces: [number,number,number,number][] = [
    [0,3,2,1], // bottom (z=0, normal -Z)
    [4,5,6,7], // top    (z=1, normal +Z)
    [0,1,5,4], // front  (y=0, normal -Y)
    [2,3,7,6], // back   (y=1, normal +Y)
    [0,4,7,3], // left   (x=0, normal -X)
    [1,2,6,5], // right  (x=1, normal +X)
  ];
  return faces.map(f => polygonFromVertices(f.map(i => v[i])));
}

/** Build a cube from mesh data (positions + indices). */
function unitCubeMesh(): { positions: Float32Array; indices: Uint32Array } {
  const v = [
    0,0,0, 1,0,0, 1,1,0, 0,1,0,
    0,0,1, 1,0,1, 1,1,1, 0,1,1,
  ];
  // Each face → 2 triangles (CCW from outside)
  const idx = [
    0,3,2, 0,2,1, // bottom -Z
    4,5,6, 4,6,7, // top +Z
    0,1,5, 0,5,4, // front -Y
    2,3,7, 2,7,6, // back +Y
    0,4,7, 0,7,3, // left -X
    1,2,6, 1,6,5, // right +X
  ];
  return { positions: new Float32Array(v), indices: new Uint32Array(idx) };
}

function cubeAt(cx: number, cy: number, cz: number, size: number): BspPolygon[] {
  const s = size / 2;
  const v = [
    new Vec3(cx-s,cy-s,cz-s), new Vec3(cx+s,cy-s,cz-s),
    new Vec3(cx+s,cy+s,cz-s), new Vec3(cx-s,cy+s,cz-s),
    new Vec3(cx-s,cy-s,cz+s), new Vec3(cx+s,cy-s,cz+s),
    new Vec3(cx+s,cy+s,cz+s), new Vec3(cx-s,cy+s,cz+s),
  ];
  const faces: [number,number,number,number][] = [
    [0,3,2,1], [4,5,6,7], [0,1,5,4], [2,3,7,6], [0,4,7,3], [1,2,6,5],
  ];
  return faces.map(f => polygonFromVertices(f.map(i => v[i])));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("BspTree", () => {

  describe("construction", () => {
    it("builds from polygons", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      expect(tree.root).not.toBeNull();
      const polys = tree.toPolygons();
      // Should have at least 6 polygons (may have more due to splits)
      expect(polys.length).toBeGreaterThanOrEqual(6);
    });

    it("builds from mesh data", () => {
      const { positions, indices } = unitCubeMesh();
      const tree = BspTree.fromMesh(positions, indices);
      expect(tree.root).not.toBeNull();
      expect(tree.toPolygons().length).toBeGreaterThanOrEqual(12);
    });

    it("handles empty input", () => {
      const tree = BspTree.fromPolygons([]);
      expect(tree.root).toBeNull();
      expect(tree.toPolygons()).toEqual([]);
    });
  });

  describe("point classification", () => {
    it("classifies points inside a cube", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      expect(tree.classifyPoint(new Vec3(0.5, 0.5, 0.5))).toBe("inside");
    });

    it("classifies points outside a cube", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      expect(tree.classifyPoint(new Vec3(2, 0.5, 0.5))).toBe("outside");
      expect(tree.classifyPoint(new Vec3(-1, 0.5, 0.5))).toBe("outside");
      expect(tree.classifyPoint(new Vec3(0.5, 0.5, 2))).toBe("outside");
    });

    it("classifies points on a face as 'on'", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      expect(tree.classifyPoint(new Vec3(0.5, 0.5, 0))).toBe("on");
      expect(tree.classifyPoint(new Vec3(0.5, 0.5, 1))).toBe("on");
    });
  });

  describe("clone and invert", () => {
    it("clone produces independent copy", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      const cloned = tree.clone();
      expect(cloned.toPolygons().length).toBe(tree.toPolygons().length);
      // Mutating original should not affect clone
      tree.invert();
      expect(cloned.classifyPoint(new Vec3(0.5, 0.5, 0.5))).toBe("inside");
    });

    it("invert flips inside/outside", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      tree.invert();
      expect(tree.classifyPoint(new Vec3(0.5, 0.5, 0.5))).toBe("outside");
      expect(tree.classifyPoint(new Vec3(2, 0.5, 0.5))).toBe("inside");
    });
  });

  describe("mesh roundtrip", () => {
    it("roundtrip preserves geometry", () => {
      const { positions, indices } = unitCubeMesh();
      const tree = BspTree.fromMesh(positions, indices);
      const out = tree.toMesh();
      // Should have valid triangles
      expect(out.indices.length).toBeGreaterThanOrEqual(12 * 3);
      expect(out.positions.length).toBeGreaterThanOrEqual(8 * 3);
      // All vertices should be in [0,1] range
      for (let i = 0; i < out.positions.length; i++) {
        expect(out.positions[i]).toBeGreaterThanOrEqual(-1e-4);
        expect(out.positions[i]).toBeLessThanOrEqual(1 + 1e-4);
      }
    });
  });

  describe("CSG operations", () => {
    it("union of two non-overlapping cubes has more polygons", () => {
      const a = BspTree.fromPolygons(cubeAt(0, 0, 0, 1));
      const b = BspTree.fromPolygons(cubeAt(3, 0, 0, 1));
      const result = BspTree.union(a, b);
      const polys = result.toPolygons();
      // Two separate cubes: should have polygons from both
      expect(polys.length).toBeGreaterThanOrEqual(12);
      // Points inside both original cubes should be inside the union
      expect(result.classifyPoint(new Vec3(0, 0, 0))).toBe("inside");
      expect(result.classifyPoint(new Vec3(3, 0, 0))).toBe("inside");
      // Point between them should be outside
      expect(result.classifyPoint(new Vec3(1.5, 0, 0))).toBe("outside");
    });

    it("union of overlapping cubes contains both", () => {
      const a = BspTree.fromPolygons(cubeAt(0, 0, 0, 2));
      const b = BspTree.fromPolygons(cubeAt(1, 0, 0, 2));
      const result = BspTree.union(a, b);
      // Points inside either cube should be inside the union
      expect(result.classifyPoint(new Vec3(-0.5, 0, 0))).toBe("inside");
      expect(result.classifyPoint(new Vec3(1.5, 0, 0))).toBe("inside");
      expect(result.classifyPoint(new Vec3(0.5, 0, 0))).toBe("inside");
      // Point clearly outside both
      expect(result.classifyPoint(new Vec3(5, 0, 0))).toBe("outside");
    });

    it("subtract removes volume", () => {
      const a = BspTree.fromPolygons(cubeAt(0, 0, 0, 2));
      const b = BspTree.fromPolygons(cubeAt(1, 0, 0, 2));
      const result = BspTree.subtract(a, b);
      // Point in A but not B → inside
      expect(result.classifyPoint(new Vec3(-0.8, 0, 0))).toBe("inside");
      // Point in overlap → outside (subtracted)
      expect(result.classifyPoint(new Vec3(0.5, 0, 0))).toBe("outside");
      // Point only in B → outside
      expect(result.classifyPoint(new Vec3(1.5, 0, 0))).toBe("outside");
    });

    it("intersect keeps only overlap", () => {
      const a = BspTree.fromPolygons(cubeAt(0, 0, 0, 2));
      const b = BspTree.fromPolygons(cubeAt(1, 0, 0, 2));
      const result = BspTree.intersect(a, b);
      // Point in overlap → inside
      expect(result.classifyPoint(new Vec3(0.5, 0, 0))).toBe("inside");
      // Point only in A → outside
      expect(result.classifyPoint(new Vec3(-0.8, 0, 0))).toBe("outside");
      // Point only in B → outside
      expect(result.classifyPoint(new Vec3(1.8, 0, 0))).toBe("outside");
    });
  });

  describe("traversal", () => {
    it("front-to-back visits all polygons", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      const total = tree.toPolygons().length;
      let visited = 0;
      tree.traverseFrontToBack(new Vec3(5, 5, 5), (polys) => { visited += polys.length; });
      expect(visited).toBe(total);
    });

    it("back-to-front visits all polygons", () => {
      const tree = BspTree.fromPolygons(unitCubePolygons());
      const total = tree.toPolygons().length;
      let visited = 0;
      tree.traverseBackToFront(new Vec3(5, 5, 5), (polys) => { visited += polys.length; });
      expect(visited).toBe(total);
    });
  });
});
