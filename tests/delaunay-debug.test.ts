import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Delaunay2D, PGHalfEdge } from "../src/core/geometry/planarGraph";

function inCircumcircle(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  const ax = a.x - d.x, ay = a.y - d.y;
  const bx = b.x - d.x, by = b.y - d.y;
  const cx2 = c.x - d.x, cy = c.y - d.y;
  const aSq = ax * ax + ay * ay;
  const bSq = bx * bx + by * by;
  const cSq = cx2 * cx2 + cy * cy;
  const det = ax * (by * cSq - cy * bSq)
            - bx * (ay * cSq - cy * aSq)
            + cx2 * (ay * bSq - by * aSq);
  const orient = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return orient > 0 ? det > 0 : det < 0;
}

function giftWrapHull(points: Vec2[]): Vec2[] {
  if (points.length < 3) return [...points];
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].x < points[start].x ||
        (points[i].x === points[start].x && points[i].y < points[start].y))
      start = i;
  }
  const hull: Vec2[] = [];
  let current = start;
  do {
    hull.push(points[current]);
    let next = 0;
    for (let i = 0; i < points.length; i++) {
      if (i === current) continue;
      if (next === current) { next = i; continue; }
      const cross = (points[i].x - points[current].x) * (points[next].y - points[current].y)
                   - (points[i].y - points[current].y) * (points[next].x - points[current].x);
      if (cross > 0) next = i;
      else if (cross === 0 && points[i].distSqTo(points[current]) > points[next].distSqTo(points[current]))
        next = i;
    }
    current = next;
  } while (current !== start && hull.length < points.length + 1);
  return hull;
}

describe("Delaunay debug", () => {
  it("seed 1: check circumcircle violations", () => {
    let s = 1;
    function rand(): number {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    }
    const pts: Vec2[] = [];
    for (let i = 0; i < 30; i++)
      pts.push(new Vec2(rand() * 8 - 4, rand() * 8 - 4));

    const g = Delaunay2D.triangulate(pts);

    // Check circumcircle condition for all interior edges
    let violations = 0;
    for (const he of g.getUniqueEdges()) {
      const f1 = he.face;
      const f2 = he.twin.face;
      if (!f1 || !f2) continue;
      if (f1.signedArea() <= 0 || f2.signedArea() <= 0) continue; // skip boundary

      // Get the 4 vertices of the quadrilateral
      const a = he.origin.position;
      const b = he.destination.position;

      // Find the vertex opposite to the edge in each triangle
      let c: Vec2 | null = null, d: Vec2 | null = null;
      for (const v of f1.vertices()) {
        if (v.position !== a && v.position !== b) { c = v.position; break; }
      }
      for (const v of f2.vertices()) {
        if (v.position !== a && v.position !== b) { d = v.position; break; }
      }
      if (!c || !d) continue;

      // Check: d should NOT be inside circumcircle of (a, b, c)
      if (inCircumcircle(a, b, c, d)) {
        violations++;
        console.log(`Circumcircle violation: edge (${a}) → (${b})`);
        console.log(`  triangle1: (${a}), (${b}), (${c})`);
        console.log(`  triangle2: (${a}), (${b}), (${d})`);
        console.log(`  d=(${d}) is INSIDE circumcircle of (a,b,c)`);
      }
    }
    console.log(`Total circumcircle violations: ${violations}`);

    // Check boundary
    const extFace = g.faces.find(f => f.signedArea() < 0)!;
    const bEdges: PGHalfEdge[] = [];
    for (const he of extFace.edges()) bEdges.push(he);
    console.log(`Boundary vertices: ${bEdges.length}`);

    const bVerts = bEdges.map(he => he.origin.position);
    console.log("Boundary:", bVerts.map(v => `(${v.x.toFixed(2)},${v.y.toFixed(2)})`).join(" → "));

    const hull = giftWrapHull(pts);
    console.log(`True hull: ${hull.length} vertices`);
    console.log("Hull:", hull.map(v => `(${v.x.toFixed(2)},${v.y.toFixed(2)})`).join(" → "));

    // Check which boundary edges should NOT be boundary
    for (const he of bEdges) {
      // Is this a boundary edge? Check if the edge from he.origin to he.destination
      // connects two hull vertices
      const a = he.origin.position;
      const b = he.destination.position;
      const aOnHull = hull.some(h => h.distTo(a) < 0.001);
      const bOnHull = hull.some(h => h.distTo(b) < 0.001);
      if (!aOnHull || !bOnHull) {
        console.log(`Non-hull boundary edge: (${a.x.toFixed(4)},${a.y.toFixed(4)}) → (${b.x.toFixed(4)},${b.y.toFixed(4)})`);
        console.log(`  a on hull: ${aOnHull}, b on hull: ${bOnHull}`);

        // Check the triangles adjacent to this vertex
        const badV = !aOnHull ? he.origin : he.destination;
        console.log(`  Bad vertex degree: ${badV.degree}`);
        const outEdges: string[] = [];
        for (const e of badV.outgoingEdges()) {
          outEdges.push(`→(${e.destination.position.x.toFixed(2)},${e.destination.position.y.toFixed(2)})`);
        }
        console.log(`  Outgoing edges: ${outEdges.join(", ")}`);
      }
    }

    // Also check: are there edges between hull-adjacent vertices that SHOULD exist?
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i];
      const b = hull[(i + 1) % hull.length];
      const va = g.vertices.find(v => v.position.distTo(a) < 0.001);
      const vb = g.vertices.find(v => v.position.distTo(b) < 0.001);
      if (va && vb) {
        const edge = va.getEdgeTo(vb);
        if (!edge) {
          console.log(`MISSING hull edge: (${a.x.toFixed(4)},${a.y.toFixed(4)}) → (${b.x.toFixed(4)},${b.y.toFixed(4)})`);
        }
      }
    }
  });
});
