import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import {
  PlanarGraph, PGVertex, PGHalfEdge, PGFace,
  PlanarGraphRepair, PlanarGraphCleanup, Delaunay2D,
} from "../src/core/geometry/planarGraph";

// ── DCEL invariant checks ──

function checkDCELInvariants(graph: PlanarGraph): string[] {
  const errors: string[] = [];
  graph.flushRemovals();

  // 1. Twin symmetry
  for (const he of graph.halfEdges) {
    if (he.twin.twin !== he) errors.push(`Twin symmetry broken for edge at ${he.origin.position}`);
    if (he.twin.origin !== he.destination)
      errors.push(`Twin origin mismatch: ${he.origin.position} → ${he.destination.position}`);
  }

  // 2. Radial cycle at each vertex
  for (const v of graph.vertices) {
    if (v.isIsolated) continue;
    const seen = new Set<PGHalfEdge>();
    let h = v.edge!;
    let safety = 0;
    do {
      if (seen.has(h)) { errors.push(`Radial cycle broken at vertex ${v.position}`); break; }
      seen.add(h);
      if (h.origin !== v) errors.push(`Edge at vertex ${v.position} has wrong origin ${h.origin.position}`);
      h = h.nextAtOrigin;
      safety++;
    } while (h !== v.edge! && safety < 1000);
    if (safety >= 1000) errors.push(`Infinite radial cycle at vertex ${v.position}`);
  }

  // 3. Face loop cycle
  for (const he of graph.halfEdges) {
    let cur = he;
    let safety = 0;
    do { cur = cur.next; safety++; } while (cur !== he && safety < 1000);
    if (safety >= 1000) errors.push(`Infinite face loop from edge at ${he.origin.position}`);
  }

  // 4. Radial ordering is angularly sorted (CW) at vertices with 3+ edges
  for (const v of graph.vertices) {
    if (v.degree < 3) continue;
    const angles: number[] = [];
    let h = v.edge!;
    do { angles.push(h.angle); h = h.nextAtOrigin; } while (h !== v.edge!);

    // Check CW: find the single "wrap" point and verify all others decrease
    let wrapCount = 0;
    for (let i = 0; i < angles.length; i++) {
      const next = angles[(i + 1) % angles.length];
      if (next > angles[i]) wrapCount++;
    }
    if (wrapCount > 1) {
      errors.push(`Non-CW radial ordering at vertex ${v.position}: angles=[${angles.map(a => a.toFixed(3)).join(",")}]`);
    }
  }

  return errors;
}

// ── Tests ──

describe("PlanarGraph DCEL", () => {
  it("builds a simple triangle correctly", () => {
    const g = new PlanarGraph();
    const a = g.addVertex(new Vec2(0, 0));
    const b = g.addVertex(new Vec2(1, 0));
    const c = g.addVertex(new Vec2(0, 1));
    g.addEdge(a, b);
    g.addEdge(b, c);
    g.addEdge(c, a);
    g.buildFaces();

    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);
    expect(g.faces.length).toBe(2); // interior + exterior
    const areas = g.faces.map(f => f.signedArea()).sort((a, b) => b - a);
    expect(areas[0]).toBeGreaterThan(0); // CCW interior
    expect(areas[1]).toBeLessThan(0);    // CW exterior
  });

  it("builds a square correctly", () => {
    const g = new PlanarGraph();
    const a = g.addVertex(new Vec2(0, 0));
    const b = g.addVertex(new Vec2(1, 0));
    const c = g.addVertex(new Vec2(1, 1));
    const d = g.addVertex(new Vec2(0, 1));
    g.addEdge(a, b);
    g.addEdge(b, c);
    g.addEdge(c, d);
    g.addEdge(d, a);
    g.buildFaces();

    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);
    expect(g.faces.length).toBe(2);
  });

  it("builds a square with diagonal correctly", () => {
    const g = new PlanarGraph();
    const a = g.addVertex(new Vec2(0, 0));
    const b = g.addVertex(new Vec2(1, 0));
    const c = g.addVertex(new Vec2(1, 1));
    const d = g.addVertex(new Vec2(0, 1));
    g.addEdge(a, b);
    g.addEdge(b, c);
    g.addEdge(c, d);
    g.addEdge(d, a);
    g.addEdge(a, c); // diagonal
    g.buildFaces();

    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);
    expect(g.faces.length).toBe(3); // 2 triangles + 1 exterior
  });
});

describe("PlanarGraphRepair.fromSegments", () => {
  it("handles crossing segments", () => {
    const segments = [
      { a: new Vec2(-1, 0), b: new Vec2(1, 0) },
      { a: new Vec2(0, -1), b: new Vec2(0, 1) },
    ];
    const g = PlanarGraphRepair.fromSegments(segments, 0.05);
    PlanarGraphCleanup.removeDeadEnds(g);
    g.buildFaces();

    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);
  });

  it("handles multiple crossing segments with valid faces", () => {
    // Simple box shape
    const segments = [
      { a: new Vec2(0, 0), b: new Vec2(1, 0) },
      { a: new Vec2(1, 0), b: new Vec2(1, 1) },
      { a: new Vec2(1, 1), b: new Vec2(0, 1) },
      { a: new Vec2(0, 1), b: new Vec2(0, 0) },
    ];
    const g = PlanarGraphRepair.fromSegments(segments, 0.05);
    g.buildFaces();
    g.removeNegativeFaces();

    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);
    // Should have exactly 1 interior face (the square)
    expect(g.faces.length).toBe(1);
    expect(g.faces[0].signedArea()).toBeCloseTo(1.0, 1);
  });

  it("handles random segments with valid DCEL", () => {
    // Seeded random (same as playground)
    let s = 42;
    function rand(): number {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    }

    const range = 4;
    const segments: { a: Vec2; b: Vec2 }[] = [];
    for (let i = 0; i < 20; i++) {
      segments.push({
        a: new Vec2(rand() * range * 2 - range, rand() * range * 2 - range),
        b: new Vec2(rand() * range * 2 - range, rand() * range * 2 - range),
      });
    }

    const g = PlanarGraphRepair.fromSegments(segments, 0.05);
    PlanarGraphCleanup.removeDeadEnds(g);
    g.buildFaces();
    g.removeNegativeFaces();

    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);

    // Faces should not overlap: total face area should be <= bounding box area
    let totalArea = 0;
    for (const f of g.faces) totalArea += Math.abs(f.signedArea());

    const bounds = g.getBounds();
    const bbArea = (bounds.max.x - bounds.min.x) * (bounds.max.y - bounds.min.y);
    expect(totalArea).toBeLessThanOrEqual(bbArea + 0.01);
  });
});

describe("Delaunay2D", () => {
  it("triangulates 4 points into a valid triangulation", () => {
    const pts = [
      new Vec2(0, 0), new Vec2(1, 0),
      new Vec2(1, 1), new Vec2(0, 1),
    ];
    const g = Delaunay2D.triangulate(pts);

    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);
    expect(g.vertices.length).toBe(4);

    // Should have triangular faces
    const positiveFaces = g.faces.filter(f => f.signedArea() > 0);
    expect(positiveFaces.length).toBe(2); // square split into 2 triangles
    for (const f of positiveFaces) {
      expect(f.edgeCount).toBe(3);
    }
  });

  it("produces convex hull boundary", () => {
    // 30 random points with seed 42
    let s = 42;
    function rand(): number {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    }

    const pts: Vec2[] = [];
    for (let i = 0; i < 30; i++) {
      pts.push(new Vec2(rand() * 8 - 4, rand() * 8 - 4));
    }

    const g = Delaunay2D.triangulate(pts);
    const errors = checkDCELInvariants(g);
    expect(errors).toEqual([]);

    // All vertices should be connected
    expect(g.vertices.length).toBe(30);
    for (const v of g.vertices) {
      expect(v.isIsolated).toBe(false);
    }

    // All positive faces should be triangles
    const positiveFaces = g.faces.filter(f => f.signedArea() > 0);
    for (const f of positiveFaces) {
      expect(f.edgeCount).toBe(3);
    }

    // Find the exterior (negative area) face and check its boundary is convex
    const exteriorFace = g.faces.find(f => f.signedArea() < 0);
    expect(exteriorFace).toBeDefined();
    if (exteriorFace) {
      // The exterior face boundary is CW. All turns along it should be
      // right turns (negative cross product) for a convex hull.
      const edges: PGHalfEdge[] = [];
      for (const he of exteriorFace.edges()) edges.push(he);
      expect(edges.length).toBeGreaterThanOrEqual(3);

      for (let i = 0; i < edges.length; i++) {
        const cur = edges[i];
        const next = edges[(i + 1) % edges.length];
        const d1 = cur.direction;
        const d2 = next.direction;
        const cross = d1.x * d2.y - d1.y * d2.x;
        // CW boundary → all cross products should be <= 0 (right turns)
        expect(cross).toBeLessThanOrEqual(1e-9);
      }
    }

    // Euler's formula: V - E + F = 2 (including unbounded face)
    const V = g.vertices.length;
    const E = g.getUniqueEdges().length;
    const F = g.faces.length;
    expect(V - E + F).toBe(2);
  });

  it("produces convex hull boundary for 200 seeds", () => {
    for (let seed = 0; seed < 200; seed++) {
      let s = seed;
      function rand(): number {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        return s / 0x7fffffff;
      }

      const pts: Vec2[] = [];
      for (let i = 0; i < 30; i++) {
        pts.push(new Vec2(rand() * 8 - 4, rand() * 8 - 4));
      }

      const g = Delaunay2D.triangulate(pts);
      const errors = checkDCELInvariants(g);
      if (errors.length > 0) {
        throw new Error(`Seed ${seed}: DCEL invariant: ${errors[0]}`);
      }

      // No isolated vertices
      const isolated = g.vertices.filter(v => v.isIsolated);
      if (isolated.length > 0) {
        throw new Error(`Seed ${seed}: ${isolated.length} isolated vertices`);
      }

      // Euler: V - E + F = 2
      const V = g.vertices.length;
      const E = g.getUniqueEdges().length;
      const F = g.faces.length;
      if (V - E + F !== 2) {
        throw new Error(`Seed ${seed}: Euler V-E+F = ${V - E + F}`);
      }

      // All positive faces are triangles
      for (const f of g.faces) {
        if (f.signedArea() > 0 && f.edgeCount !== 3) {
          throw new Error(`Seed ${seed}: non-triangle face (${f.edgeCount} edges)`);
        }
      }

      // Convex hull: exterior face boundary must have only right turns (CW)
      const extFace = g.faces.find(f => f.signedArea() < 0);
      if (!extFace) throw new Error(`Seed ${seed}: no exterior face`);
      const bEdges: PGHalfEdge[] = [];
      for (const he of extFace.edges()) bEdges.push(he);
      for (let i = 0; i < bEdges.length; i++) {
        const d1 = bEdges[i].direction;
        const d2 = bEdges[(i + 1) % bEdges.length].direction;
        const cross = d1.x * d2.y - d1.y * d2.x;
        if (cross > 1e-9) {
          throw new Error(
            `Seed ${seed}: non-convex boundary turn at vertex ` +
            `${bEdges[(i + 1) % bEdges.length].origin.position} (cross=${cross.toFixed(6)})`
          );
        }
      }

      // Independent convex hull check: all input points should be inside or on boundary
      const hullVerts: Vec2[] = [];
      for (const he of extFace.edges()) hullVerts.push(he.origin.position);
      for (const p of pts) {
        let inside = true;
        for (let i = 0; i < hullVerts.length; i++) {
          const a = hullVerts[i];
          const b = hullVerts[(i + 1) % hullVerts.length];
          // CW winding: point should be on right side (cross <= 0)
          const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
          if (cross > 1e-6) { inside = false; break; }
        }
        if (!inside) {
          throw new Error(`Seed ${seed}: point ${p} outside convex hull boundary`);
        }
      }
    }
  });
});
