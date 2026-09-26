/**
 * The mesh's topology API: ids, connectivity and edits.
 *
 * One class now holds both the id-based editing API and the typed-array storage,
 * so the properties worth pinning down are the ones that used to come for free
 * from a Map per element: an id survives other elements being removed, an edge is
 * shared by the faces around it, removing a face leaves its edges, and reversing
 * a face reverses it in the mesh, not in a copy. The array side is in
 * flatmesh.test.ts.
 */
import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { Mesh } from "../src/core/geometry/mesh/Mesh";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";
import { MeshTransform } from "../src/core/geometry/mesh/MeshTransform";

const tri = () => {
  const m = new Mesh();
  const a = m.addNode(new Vec3(0, 0, 0));
  const b = m.addNode(new Vec3(1, 0, 0));
  const c = m.addNode(new Vec3(0.5, 1, 0));
  m.addTriangle(a, b, c);
  return { m, a, b, c };
};

describe("Mesh", () => {
  it("creates nodes and retrieves them", () => {
    const m = new Mesh();
    const id = m.addNode(new Vec3(1, 2, 3));
    const node = m.node(id);
    expect(node).toBeDefined();
    expect(node!.position.x).toBe(1);
    expect(m.nodeCount).toBe(1);
  });

  it("creates a triangle with edges", () => {
    const { m } = tri();
    expect(m.nodeCount).toBe(3);
    expect(m.edgeCount).toBe(3);
    expect(m.faceCount).toBe(1);
  });

  it("shares edges between adjacent faces", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(1, 1, 0));
    const d = m.addNode(new Vec3(0, 1, 0));
    m.addTriangle(a, b, c);
    m.addTriangle(a, c, d);

    // Edge a-c is shared, so 5 edges total not 6
    expect(m.edgeCount).toBe(5);
    expect(m.faceCount).toBe(2);
    const ac = m.findEdge(a, c)!;
    expect(m.edge(ac)!.faces.length).toBe(2);
    expect(m.isBoundaryEdge(ac)).toBe(false);
    expect(m.isBoundaryEdge(m.findEdge(a, b)!)).toBe(true);
  });

  it("finds edges", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    m.addEdge(a, b);

    expect(m.findEdge(a, b)).toBeDefined();
    expect(m.findEdge(b, a)).toBeDefined(); // reverse order
    expect(m.findEdge(a, 999)).toBeUndefined();
    expect(m.addEdge(b, a)).toBe(m.findEdge(a, b)); // no duplicate
  });

  it("queries node neighbors", () => {
    const { m, a, b, c } = tri();
    const neighbors = m.nodeNeighbors(a);
    expect(neighbors).toContain(b);
    expect(neighbors).toContain(c);
    expect(neighbors.length).toBe(2);
  });

  it("detects boundary edges", () => {
    const { m } = tri();
    expect(m.boundaryEdges().length).toBe(3);
  });

  it("computes vertex normals", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(0, 0, 1));
    m.addTriangle(a, c, b);
    expect(m.node(a)!.normal).toBeUndefined();   // not computed yet
    m.computeVertexNormals();
    const normal = m.node(a)!.normal!;
    expect(normal.y).toBeGreaterThan(0); // pointing up (CCW winding from above)
  });

  it("writes node positions through the view", () => {
    const { m, a } = tri();
    m.node(a)!.position = new Vec3(5, 6, 7);
    expect(m.getPosition(a).y).toBe(6);
    expect(m.positions[a * 3 + 2]).toBe(7);
    expect(m.bounds().max.z).toBe(7);
  });

  it("exports flat arrays", () => {
    const { m } = tri();
    const data = m.toMeshData();
    expect(data.positions.length).toBe(9);  // 3 verts * 3 components
    expect(data.indices.length).toBe(3);     // 1 triangle
    expect(data.normals.length).toBe(9);
    expect(data.positions).toBeInstanceOf(Float32Array);
  });

  it("serializes and deserializes", () => {
    const m = new Mesh();
    m.addNode(new Vec3(0, 0, 0));
    m.addNode(new Vec3(1, 0, 0));
    m.addNode(new Vec3(0.5, 1, 0));
    m.addTriangle(0, 1, 2);

    const json = m.toJSON();
    const m2 = Mesh.fromJSON(json);
    expect(m2.nodeCount).toBe(3);
    expect(m2.faceCount).toBe(1);
    expect(m2.edgeCount).toBe(3);
  });

  it("reads both legacy JSON formats", () => {
    const old = Mesh.fromJSON({
      nodes: [{ id: 7, position: { x: 0, y: 0, z: 0 } }, { id: 9, position: { x: 1, y: 0, z: 0 } }, { id: 4, position: { x: 0, y: 1, z: 0 } }],
      faces: [{ id: 1, nodes: [7, 9, 4], data: { tag: "roof" } }],
    });
    expect(old.faceCount).toBe(1);
    expect(old.face(0)!.data.tag).toBe("roof");
    const flat = Mesh.fromJSON({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2] });
    expect(flat.edgeCount).toBe(3);
  });

  it("keeps per-element data and passes it through a split", () => {
    const { m, a, b } = tri();
    m.faceData(0).material = "oak";
    const mid = m.splitEdge(m.findEdge(a, b)!);
    expect(mid).toBe(3);
    expect(m.faceCount).toBe(2);
    for (const f of m.faces()) expect(f.data.material).toBe("oak");
  });

  it("computes Euler characteristic for closed mesh", () => {
    const box = MeshFactory.box(1, 1, 1);
    // Cube: V=8, E=12, F=6, V-E+F=2
    expect(box.nodeCount - box.edgeCount + box.faceCount).toBe(2);
    expect(box.eulerCharacteristic()).toBe(2);
  });
});

describe("Mesh removal, tombstones and compaction", () => {
  it("removing a face keeps its edges and the other ids", () => {
    const m = new Mesh();
    const a = m.addNode(new Vec3(0, 0, 0));
    const b = m.addNode(new Vec3(1, 0, 0));
    const c = m.addNode(new Vec3(1, 1, 0));
    const d = m.addNode(new Vec3(0, 1, 0));
    const f0 = m.addTriangle(a, b, c);
    const f1 = m.addTriangle(a, c, d);
    m.removeFace(f0);
    expect(m.faceCount).toBe(1);
    expect(m.face(f0)).toBeUndefined();
    expect(m.face(f1)!.nodes).toEqual([a, c, d]);
    expect(m.edgeCount).toBe(5);                       // edges are their own elements
    expect(m.isBoundaryEdge(m.findEdge(a, c)!)).toBe(true);
    expect(m.node(b)!.faces).toEqual([]);
    expect(m.hasTombstones).toBe(true);
    expect(m.indices.length).toBe(3);                  // only the live face
  });

  it("removing a node takes its faces and edges with it", () => {
    const box = MeshFactory.box(1, 1, 1);
    box.removeNode(0);
    expect(box.nodeCount).toBe(7);
    expect(box.faceCount).toBe(3);                     // three quads met at that corner
    expect(box.edgeCount).toBe(9);
    for (const f of box.faces()) expect(f.nodes).not.toContain(0);
  });

  it("compact renumbers densely and returns the map", () => {
    const box = MeshFactory.box(1, 1, 1);
    box.removeFace(0);
    box.removeNode(7);
    const live = box.faceIds();
    const positionsBefore = live.map(f => box.faceNodes(f).map(n => box.getPosition(n)));
    const maps = box.compact();
    expect(box.hasTombstones).toBe(false);
    expect(box.vertexCount).toBe(box.nodeCount);
    expect(maps.nodes[7]).toBe(-1);
    expect(maps.faces[0]).toBe(-1);
    live.forEach((f, i) => {
      const nf = maps.faces[f];
      expect(box.faceNodes(nf).map(n => box.getPosition(n))).toEqual(positionsBefore[i]);
    });
    expect(box.eulerCharacteristic()).toBe(box.nodeCount - box.edgeCount + box.faceCount);
  });

  it("clone drops tombstones without changing the geometry", () => {
    const box = MeshFactory.box(1, 1, 1);
    box.removeFace(2);
    const c = box.clone();
    expect(c.hasTombstones).toBe(false);
    expect(c.faceCount).toBe(5);
    expect(c.volume()).toBeCloseTo(box.volume());
    c.translate(10, 0, 0);
    expect(box.getPosition(0).x).not.toBeCloseTo(c.getPosition(0).x);
  });
});

describe("Mesh face winding", () => {
  it("reverseFace flips the winding in the mesh itself", () => {
    const { m } = tri();
    const before = m.face(0)!.nodes;
    m.face(0)!.nodes.reverse();                        // a snapshot — no effect
    expect(m.face(0)!.nodes).toEqual(before);
    m.computeFaceNormals();
    const nz = m.face(0)!.normal!.z;
    m.reverseFace(0);
    expect(m.face(0)!.nodes).toEqual([...before].reverse());
    expect(m.edgeCount).toBe(3);
    m.computeFaceNormals();
    expect(m.face(0)!.normal!.z).toBeCloseTo(-nz);
  });

  it("flipFaces and reorientFaces work on a box", () => {
    const box = MeshFactory.box(1, 1, 1);
    const v = box.volume();
    MeshTransform.flipFaces(box);
    expect(box.volume()).toBeCloseTo(v);
    box.computeFaceNormals();
    // after the flip every face normal points inward: centroid side
    for (const f of box.faces()) {
      const c = f.nodes.map(n => box.getPosition(n)).reduce((s, p) => s.add(p), Vec3.zero()).div(f.nodes.length);
      expect(f.normal!.dot(c)).toBeLessThan(0);
    }
    box.reverseFace(0);
    MeshTransform.reorientFaces(box);
    box.computeFaceNormals();
    const signs = new Set([...box.faces()].map(f => Math.sign(f.normal!.dot(f.nodes.map(n => box.getPosition(n)).reduce((s, p) => s.add(p), Vec3.zero())))));
    expect(signs.size).toBe(1);
  });
});

describe("Mesh edit loops", () => {
  it("thousands of edge splits stay incremental", () => {
    const g = MeshFactory.grid(10, 10, 60, 60);
    const edges = g.edgesArray().map(e => e.id).filter((_, i) => i % 2 === 0);
    const t0 = performance.now();
    for (const e of edges) g.splitEdge(e);
    const ms = performance.now() - t0;
    expect(g.nodeCount).toBe(61 * 61 + edges.length);
    expect(ms).toBeLessThan(500);
    g.compact();
    expect(g.hasTombstones).toBe(false);
  });

  it("collapseEdge merges two nodes", () => {
    const g = MeshFactory.grid(2, 2, 2, 2);
    const e = g.findEdge(4, 5)!;             // an interior edge of the 3x3 node grid
    const keep = g.collapseEdge(e);          // keeps the edge's first node, whichever that is
    const gone = keep === 4 ? 5 : 4;
    expect([4, 5]).toContain(keep);
    expect(g.nodeCount).toBe(8);
    expect(g.node(gone)).toBeUndefined();
    for (const f of g.faces()) expect(f.nodes).not.toContain(gone);
  });
});

describe("MeshFactory", () => {
  it("generates a box with correct topology", () => {
    const m = MeshFactory.box(2, 2, 2);
    expect(m.nodeCount).toBe(8);
    expect(m.faceCount).toBe(6);
  });

  it("generates a sphere", () => {
    const m = MeshFactory.sphere(1, 12, 8);
    expect(m.nodeCount).toBeGreaterThan(50);
    expect(m.faceCount).toBeGreaterThan(80);
  });

  it("generates a grid with height function", () => {
    const m = MeshFactory.grid(4, 4, 8, 8, (x, z) => Math.sin(x) * Math.cos(z));
    expect(m.nodeCount).toBe(9 * 9); // (8+1) * (8+1)
    expect(m.faceCount).toBe(8 * 8);  // quads
  });

  it("generates a torus", () => {
    const m = MeshFactory.torus(1, 0.3, 16, 8);
    expect(m.faceCount).toBe(16 * 8);
  });

  it("subdivides a box", () => {
    const box = MeshFactory.box(1, 1, 1);
    const sub = MeshFactory.subdivide(box);
    expect(sub.faceCount).toBeGreaterThan(box.faceCount);
    // Catmull-Clark: each quad → 4 quads
    expect(sub.faceCount).toBe(box.faceCount * 4);
  });

  it("triangulates a box", () => {
    const box = MeshFactory.box(1, 1, 1);
    const tri = MeshFactory.triangulate(box);
    // Each quad → 2 triangles
    expect(tri.faceCount).toBe(box.faceCount * 2);
  });
});
