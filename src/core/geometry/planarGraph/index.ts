/**
 * Tekto PlanarGraph — 2D planar graph based on a doubly-connected edge list (DCEL).
 *
 * Ports HDGEO.Core.Geometry.PlanarGraph (PlanarGraph.cs, PlanarGraphRepair.cs, PlanarGraphCleanup.cs).
 *
 * Supports:
 *   - Building valid planar graphs from raw line segments
 *   - Angle-based radial edge ordering at vertices
 *   - Face construction via half-edge loop traversal
 *   - Cleanup: dead-end removal, linear vertex dissolution
 *   - Delaunay triangulation, and its dual: clipped Voronoi / power diagrams (Voronoi2D)
 */

import { Vec2, Vec3 } from "../../math/vectors";
import { HMath } from "../../math/HMath";
import { VecMath } from "../../math/VecMath";
import { Polygon2D } from "../Polygon2D";
import { PolygonBool } from "../PolygonBool";
import type { MultiPoly2 } from "../PolygonBool";
import { Mesh } from "../mesh/Mesh";

// ================================================================
// ELEMENT TYPES
// ================================================================

/** Vertex in a 2D planar graph (DCEL). */
export class PGVertex {
  position: Vec2;
  edge: PGHalfEdge | null = null;
  tag = 0;

  constructor(position: Vec2) { this.position = position; }

  get isIsolated(): boolean { return this.edge === null; }

  get degree(): number {
    if (!this.edge) return 0;
    let n = 0;
    let h: PGHalfEdge = this.edge;
    do { n++; h = h.nextAtOrigin; } while (h !== this.edge);
    return n;
  }

  *outgoingEdges(): IterableIterator<PGHalfEdge> {
    if (!this.edge) return;
    let h: PGHalfEdge = this.edge;
    do { yield h; h = h.nextAtOrigin; } while (h !== this.edge);
  }

  *neighbors(): IterableIterator<PGVertex> {
    for (const h of this.outgoingEdges()) yield h.destination;
  }

  getEdgeTo(dest: PGVertex): PGHalfEdge | null {
    if (!this.edge) return null;
    let h: PGHalfEdge = this.edge;
    do {
      if (h.destination === dest) return h;
      h = h.nextAtOrigin;
    } while (h !== this.edge);
    return null;
  }

  isNeighbor(other: PGVertex): boolean { return this.getEdgeTo(other) !== null; }
}

/** Half-edge in a 2D planar graph (DCEL). */
export class PGHalfEdge {
  origin!: PGVertex;
  twin!: PGHalfEdge;
  next!: PGHalfEdge;
  face: PGFace | null = null;
  tag = 0;

  get destination(): PGVertex { return this.twin.origin; }
  get nextAtOrigin(): PGHalfEdge { return this.twin.next; }

  get prevAtOrigin(): PGHalfEdge {
    let h: PGHalfEdge = this as PGHalfEdge;
    while (h.nextAtOrigin !== this) h = h.nextAtOrigin;
    return h;
  }

  get prev(): PGHalfEdge { return this.prevAtOrigin.twin; }

  get direction(): Vec2 { return this.destination.position.sub(this.origin.position); }
  get midpoint(): Vec2 { return this.origin.position.add(this.destination.position).mul(0.5); }
  get length(): number { return this.direction.len(); }
  get angle(): number { const d = this.direction; return Math.atan2(d.y, d.x); }
  get isSingle(): boolean { return this.nextAtOrigin === this; }
}

/** Face in a 2D planar graph (DCEL). */
export class PGFace {
  edge!: PGHalfEdge;
  tag = 0;
  color: [number, number, number, number] | null = null;

  *edges(): IterableIterator<PGHalfEdge> {
    let h = this.edge;
    do { yield h; h = h.next; } while (h !== this.edge);
  }

  *vertices(): IterableIterator<PGVertex> {
    let h = this.edge;
    do { yield h.origin; h = h.next; } while (h !== this.edge);
  }

  polygon(): Vec2[] {
    const poly: Vec2[] = [];
    for (const v of this.vertices()) poly.push(v.position);
    return poly;
  }

  get edgeCount(): number {
    let n = 0;
    let h = this.edge;
    do { n++; h = h.next; } while (h !== this.edge);
    return n;
  }

  signedArea(): number {
    let area = 0;
    let h = this.edge;
    do {
      const a = h.origin.position;
      const b = h.destination.position;
      area += a.x * b.y - b.x * a.y;
      h = h.next;
    } while (h !== this.edge);
    return area * 0.5;
  }

  get isCCW(): boolean { return this.signedArea() > 0; }
}

// ================================================================
// PLANAR GRAPH (DCEL CONTAINER)
// ================================================================

/**
 * A 2D planar graph as a half-edge structure (DCEL): vertices, twin half-edges kept in angular order
 * around each vertex, and faces from `buildFaces()` (CCW = bounded, CW = outer). Build one from raw
 * segments with `PlanarGraphRepair.fromSegments`.
 */
export class PlanarGraph {
  readonly vertices: PGVertex[] = [];
  readonly halfEdges: PGHalfEdge[] = [];
  readonly faces: PGFace[] = [];

  private _removed: Set<PGHalfEdge> | null = null;

  // ── Construction ──

  addVertex(position: Vec2): PGVertex {
    const v = new PGVertex(position);
    this.vertices.push(v);
    return v;
  }

  addEdge(from: PGVertex, to: PGVertex): PGHalfEdge {
    const h = this.createEdgePair(from, to);
    this.attach(h);
    return h;
  }

  createEdgePair(from: PGVertex, to: PGVertex): PGHalfEdge {
    const h = new PGHalfEdge();
    const t = new PGHalfEdge();
    h.origin = from;
    t.origin = to;
    h.twin = t; t.twin = h;
    h.next = t; t.next = h;
    this.halfEdges.push(h, t);
    return h;
  }

  // ── Attach / Detach ──

  attach(h: PGHalfEdge): void {
    attachAtVertex(h);
    attachAtVertex(h.twin);
  }

  detach(h: PGHalfEdge): void {
    detachHalf(h);
    detachHalf(h.twin);
    h.next = h.twin;
    h.twin.next = h;
  }

  removeEdge(h: PGHalfEdge): void {
    this.detach(h);
    if (!this._removed) this._removed = new Set();
    this._removed.add(h);
    this._removed.add(h.twin);
  }

  flushRemovals(): void {
    if (!this._removed || this._removed.size === 0) return;
    const rem = this._removed;
    for (let i = this.halfEdges.length - 1; i >= 0; i--) {
      if (rem.has(this.halfEdges[i])) this.halfEdges.splice(i, 1);
    }
    this._removed.clear();
  }

  // ── Face Construction ──

  buildFaces(): void {
    this.flushRemovals();
    this.clearFaces();
    for (const he of this.halfEdges) he.face = null;

    for (const he of this.halfEdges) {
      if (he.face !== null) continue;
      const face = new PGFace();
      face.edge = he;
      this.faces.push(face);

      let cur = he;
      do { cur.face = face; cur = cur.next; } while (cur !== he);
    }
  }

  clearFaces(): void {
    this.faces.length = 0;
    for (const he of this.halfEdges) he.face = null;
  }

  removeNegativeFaces(removeNegative = true): void {
    for (let i = this.faces.length - 1; i >= 0; i--) {
      const neg = this.faces[i].signedArea() < 0;
      if (neg === removeNegative) {
        let cur = this.faces[i].edge;
        const start = cur;
        do { cur.face = null; cur = cur.next; } while (cur !== start);
        this.faces.splice(i, 1);
      }
    }
  }

  // ── Queries ──

  getUniqueEdges(): PGHalfEdge[] {
    this.flushRemovals();
    const result: PGHalfEdge[] = [];
    const seen = new Set<PGHalfEdge>();
    for (const he of this.halfEdges) {
      if (seen.has(he)) continue;
      seen.add(he);
      seen.add(he.twin);
      result.push(he);
    }
    return result;
  }

  findClosestVertex(point: Vec2, tolerance: number): PGVertex | null {
    const tolSq = tolerance * tolerance;
    let best: PGVertex | null = null;
    let bestDist = Infinity;
    for (const v of this.vertices) {
      const d = v.position.distSqTo(point);
      if (d < tolSq && d < bestDist) { bestDist = d; best = v; }
    }
    return best;
  }

  getBounds(): { min: Vec2; max: Vec2 } {
    if (this.vertices.length === 0) return { min: Vec2.zero(), max: Vec2.zero() };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of this.vertices) {
      if (v.position.x < minX) minX = v.position.x;
      if (v.position.y < minY) minY = v.position.y;
      if (v.position.x > maxX) maxX = v.position.x;
      if (v.position.y > maxY) maxY = v.position.y;
    }
    return { min: new Vec2(minX, minY), max: new Vec2(maxX, maxY) };
  }

  clearTags(): void {
    for (const v of this.vertices) v.tag = 0;
    for (const he of this.halfEdges) he.tag = 0;
    for (const f of this.faces) f.tag = 0;
  }

  /** Edge positions as Vec3 pairs on the XZ ground plane (Y-up). */
  getEdgePositions3D(): Vec3[] {
    const unique = this.getUniqueEdges();
    const result: Vec3[] = [];
    for (const he of unique) {
      const a = he.origin.position;
      const b = he.destination.position;
      result.push(new Vec3(a.x, 0, a.y), new Vec3(b.x, 0, b.y));
    }
    return result;
  }

  /**
   * Creates a flat Mesh from CCW faces on the XZ ground plane.
   * Uses ear-clipping triangulation (handles non-convex faces correctly).
   * Optional per-face color callback.
   */
  toFlatMesh(faceColor?: (face: PGFace, index: number) => [number, number, number, number]): Mesh {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let fi = 0; fi < this.faces.length; fi++) {
      const face = this.faces[fi];
      if (face.signedArea() <= 0) continue;

      const poly = face.polygon();
      if (poly.length < 3) continue;

      const col = face.color ?? (faceColor ? faceColor(face, fi) : [0.4, 0.6, 0.9, 1.0]);
      const baseIdx = positions.length / 3;

      for (const v of poly) {
        positions.push(v.x, 0, v.y);
        normals.push(0, 1, 0);
        colors.push(col[0], col[1], col[2], col[3]);
      }

      const triIndices = earClipTriangulate(poly);
      for (const idx of triIndices) {
        indices.push(baseIdx + idx);
      }
    }

    if (positions.length === 0) {
      return new Mesh(new Float32Array(0), new Uint32Array(0));
    }

    const fm = new Mesh(
      new Float32Array(positions),
      new Uint32Array(indices),
      new Float32Array(normals),
      undefined, // uvs
      new Float32Array(colors),
    );
    return fm;
  }
}

// ── Ear-clipping triangulation ──

/** Triangulate a simple CCW polygon via ear clipping. Returns flat index array. */
function earClipTriangulate(poly: Vec2[]): number[] {
  const n = poly.length;
  if (n < 3) return [];
  if (n === 3) return [0, 1, 2];

  const indices: number[] = [];
  const remaining: number[] = [];
  for (let i = 0; i < n; i++) remaining.push(i);

  let safety = n * n; // upper bound on iterations
  while (remaining.length > 3 && safety-- > 0) {
    let earFound = false;
    for (let i = 0; i < remaining.length; i++) {
      const pi = (i + remaining.length - 1) % remaining.length;
      const ni = (i + 1) % remaining.length;
      const a = poly[remaining[pi]];
      const b = poly[remaining[i]];
      const c = poly[remaining[ni]];

      // Must be a convex vertex (left turn for CCW polygon)
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross <= 0) continue;

      // No other remaining vertex inside the triangle
      let isEar = true;
      for (let j = 0; j < remaining.length; j++) {
        if (j === pi || j === i || j === ni) continue;
        if (pointInTriangle2D(poly[remaining[j]], a, b, c)) {
          isEar = false;
          break;
        }
      }

      if (isEar) {
        indices.push(remaining[pi], remaining[i], remaining[ni]);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }
    if (!earFound) break; // degenerate polygon
  }

  if (remaining.length === 3) {
    indices.push(remaining[0], remaining[1], remaining[2]);
  }
  return indices;
}

function pointInTriangle2D(p: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  const d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y);
  const d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// ── Attach / Detach helpers ──

function attachAtVertex(h: PGHalfEdge): void {
  const v = h.origin;
  if (v.edge === null) { v.edge = h; return; }
  if (v.edge.isSingle) { attachAfter(v.edge, h); return; }

  const newAngle = h.angle;
  let insertAfterEdge: PGHalfEdge | null = null;
  let maxAngleEdge: PGHalfEdge | null = null;
  let bestAngle = -Infinity;
  let maxAngle = -Infinity;

  let cur = v.edge;
  do {
    const a = cur.angle;
    if (a < newAngle && a > bestAngle) { bestAngle = a; insertAfterEdge = cur; }
    if (a > maxAngle) { maxAngle = a; maxAngleEdge = cur; }
    cur = cur.nextAtOrigin;
  } while (cur !== v.edge);

  const target = insertAfterEdge ?? maxAngleEdge!;
  attachBefore(target, h);
}

function attachAfter(existing: PGHalfEdge, newEdge: PGHalfEdge): void {
  const save = existing.nextAtOrigin;
  existing.twin.next = newEdge;
  newEdge.twin.next = save;
}

function attachBefore(existing: PGHalfEdge, newEdge: PGHalfEdge): void {
  const prev = existing.prevAtOrigin;
  prev.twin.next = newEdge;
  newEdge.twin.next = existing;
}

function detachHalf(h: PGHalfEdge): void {
  const v = h.origin;
  if (v.edge === h) {
    const nextO = h.nextAtOrigin;
    v.edge = (nextO === h) ? null : nextO;
  }
  const pr = h.prev;
  const nextInFace = h.twin.next;
  pr.next = nextInFace;
}

// ================================================================
// PLANAR GRAPH REPAIR — build from raw segments
// ================================================================

/** Builds a valid `PlanarGraph` from raw 2D segments: fuses vertices within `tolerance`, splits edges at vertices and crossings, then builds faces. */
export const PlanarGraphRepair = {

  /** Creates a valid planar graph from line segments. */
  fromSegments(segments: { a: Vec2; b: Vec2 }[], tolerance: number): PlanarGraph {
    const graph = new PlanarGraph();

    for (const seg of segments) {
      const v1 = graph.addVertex(seg.a);
      const v2 = graph.addVertex(seg.b);
      const h = graph.createEdgePair(v1, v2);
      graph.attach(h);
    }

    fuseCloseVertices(graph, tolerance);
    intersectWithVertices(graph, tolerance);
    intersectEdges(graph, tolerance);
    graph.buildFaces();

    return graph;
  },
};

function fuseCloseVertices(graph: PlanarGraph, tolerance: number): void {
  const tolSq = tolerance * tolerance;

  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;

  const rep = new Map<PGVertex, PGVertex>();
  for (const v of graph.vertices) rep.set(v, v);

  for (let i = 0; i < graph.vertices.length; i++) {
    const vi = graph.vertices[i];
    if (rep.get(vi) !== vi) continue;
    for (let j = i + 1; j < graph.vertices.length; j++) {
      const vj = graph.vertices[j];
      if (rep.get(vj) !== vj) continue;
      if (vi.position.distSqTo(vj.position) < tolSq) rep.set(vj, vi);
    }
  }

  for (const h of edges) {
    h.origin = rep.get(h.origin)!;
    h.twin.origin = rep.get(h.twin.origin)!;
  }

  reattachEdges(graph, edges);
}

function intersectWithVertices(graph: PlanarGraph, tolerance: number): void {
  const EPS = 0.001;

  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;

  const edgeSplits = new Map<number, { t: number; v: PGVertex }[]>();

  for (let ei = 0; ei < edges.length; ei++) {
    const h = edges[ei];
    const a = h.origin.position;
    const b = h.destination.position;

    for (const v of graph.vertices) {
      if (v === h.origin || v === h.destination) continue;
      const dist = VecMath.distanceToSegment2D(v.position, a, b);
      if (dist < tolerance) {
        const t = projectOnSegment(v.position, a, b);
        if (t > EPS && t < 1 - EPS) {
          if (!edgeSplits.has(ei)) edgeSplits.set(ei, []);
          edgeSplits.get(ei)!.push({ t, v });
        }
      }
    }
  }

  const allEdges: PGHalfEdge[] = [];
  for (let ei = 0; ei < edges.length; ei++) {
    const splits = edgeSplits.get(ei);
    if (!splits) { allEdges.push(edges[ei]); continue; }
    splitEdgeIntoChain(graph, edges[ei], splits, allEdges);
  }

  reattachEdges(graph, allEdges);
}

function intersectEdges(graph: PlanarGraph, tolerance: number): void {
  const EPS = 0.001;

  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;

  const edgeSplits = new Map<number, { t: number; v: PGVertex }[]>();

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const h1 = edges[i];
      const h2 = edges[j];

      if (h1.origin === h2.origin || h1.origin === h2.destination ||
          h1.destination === h2.origin || h1.destination === h2.destination) continue;

      const result = Polygon2D.segmentIntersect2D(
        h1.origin.position, h1.destination.position,
        h2.origin.position, h2.destination.position,
      );

      if (result && result.t > EPS && result.t < 1 - EPS &&
          result.u > EPS && result.u < 1 - EPS) {
        const v = graph.findClosestVertex(result.point, tolerance)
                  ?? graph.addVertex(result.point);

        if (!edgeSplits.has(i)) edgeSplits.set(i, []);
        edgeSplits.get(i)!.push({ t: result.t, v });

        if (!edgeSplits.has(j)) edgeSplits.set(j, []);
        edgeSplits.get(j)!.push({ t: result.u, v });
      }
    }
  }

  const allEdges: PGHalfEdge[] = [];
  for (let ei = 0; ei < edges.length; ei++) {
    const splits = edgeSplits.get(ei);
    if (!splits) { allEdges.push(edges[ei]); continue; }
    splitEdgeIntoChain(graph, edges[ei], splits, allEdges);
  }

  reattachEdges(graph, allEdges);
}

function splitEdgeIntoChain(
  graph: PlanarGraph,
  h: PGHalfEdge,
  splits: { t: number; v: PGVertex }[],
  output: PGHalfEdge[],
): void {
  const origin = h.origin;
  const dest = h.destination;

  splits.sort((a, b) => a.t - b.t);
  for (let k = splits.length - 1; k > 0; k--) {
    if (splits[k].v === splits[k - 1].v) splits.splice(k, 1);
  }
  const filtered = splits.filter(s => s.v !== origin && s.v !== dest);
  if (filtered.length === 0) { output.push(h); return; }

  // Reuse original half-edge for first segment
  h.twin.origin = filtered[0].v;
  output.push(h);

  for (let k = 0; k < filtered.length - 1; k++) {
    output.push(graph.createEdgePair(filtered[k].v, filtered[k + 1].v));
  }

  output.push(graph.createEdgePair(filtered[filtered.length - 1].v, dest));
}

function reattachEdges(graph: PlanarGraph, edges: PGHalfEdge[]): void {
  const valid: PGHalfEdge[] = [];
  for (const h of edges) {
    if (h.origin === h.destination) continue;
    if (h.origin.isNeighbor(h.destination)) continue;
    graph.attach(h);
    valid.push(h);
  }

  graph.halfEdges.length = 0;
  for (const h of valid) {
    graph.halfEdges.push(h, h.twin);
  }

  const referenced = new Set<PGVertex>();
  for (const he of graph.halfEdges) {
    referenced.add(he.origin);
    referenced.add(he.destination);
  }
  for (let i = graph.vertices.length - 1; i >= 0; i--) {
    if (!referenced.has(graph.vertices[i])) graph.vertices.splice(i, 1);
  }
}

function projectOnSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = b.sub(a);
  const lenSq = ab.lenSq();
  if (lenSq < HMath.EPSILON) return 0;
  return p.sub(a).dot(ab) / lenSq;
}

// ================================================================
// PLANAR GRAPH CLEANUP
// ================================================================

/** In-place passes on a `PlanarGraph`: remove dead ends, dissolve collinear degree-2 vertices, drop edges with the same face on both sides or bounded faces on both sides. */
export const PlanarGraphCleanup = {

  /** Iteratively removes degree-1 vertices (dead ends). */
  removeDeadEnds(graph: PlanarGraph): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        const v = graph.vertices[i];
        if (v.degree === 1) {
          graph.removeEdge(v.edge!);
          changed = true;
        }
      }
      graph.flushRemovals();
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
      }
    }
  },

  /** Dissolves degree-2 vertices with collinear edges. */
  removeLinearVertices(graph: PlanarGraph, angleTolerance = 0.01): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        const v = graph.vertices[i];
        if (v.degree !== 2) continue;

        const h1 = v.edge!;
        const h2 = h1.nextAtOrigin;
        if (h2 === h1) continue;

        const d1 = h1.direction;
        const d2 = h2.direction;
        const cross = d1.x * d2.y - d1.y * d2.x;
        const dot = d1.dot(d2);
        const angle = Math.abs(Math.atan2(cross, dot));

        if (Math.abs(angle - Math.PI) < angleTolerance) {
          const a = h1.destination;
          const b = h2.destination;
          graph.removeEdge(h1);
          graph.removeEdge(h2);
          graph.vertices.splice(i, 1);
          if (!a.isNeighbor(b)) graph.addEdge(a, b);
          changed = true;
          break;
        }
      }
    }
  },

  /** Removes edges where both sides belong to the same face. */
  removeEdgesWithSameFace(graph: PlanarGraph): void {
    const toRemove: PGHalfEdge[] = [];
    for (const h of graph.getUniqueEdges()) {
      if (h.face !== null && h.twin.face !== null && h.face === h.twin.face)
        toRemove.push(h);
    }
    for (const h of toRemove) graph.removeEdge(h);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    if (toRemove.length > 0) graph.buildFaces();
  },

  /** Removes inner edges (both sides are bounded faces). */
  removeInnerEdges(graph: PlanarGraph): void {
    const toRemove: PGHalfEdge[] = [];
    for (const h of graph.getUniqueEdges()) {
      const leftBounded = h.face !== null && h.face.signedArea() > 0;
      const rightBounded = h.twin.face !== null && h.twin.face.signedArea() > 0;
      if (leftBounded && rightBounded) toRemove.push(h);
    }
    for (const h of toRemove) graph.removeEdge(h);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    if (toRemove.length > 0) graph.buildFaces();
  },
};

// ================================================================
// DELAUNAY 2D — incremental Delaunay triangulation → DCEL
// ================================================================

/** History DAG node for point location. */
class DTriangle {
  v0: PGVertex;
  v1: PGVertex;
  v2: PGVertex;
  children: DTriangle[] = [];
  constructor(v0: PGVertex, v1: PGVertex, v2: PGVertex) {
    this.v0 = v0; this.v1 = v1; this.v2 = v2;
  }
}

/** Incremental Delaunay triangulation of 2D points (at least 3), returned as a `PlanarGraph` whose CCW faces are the triangles. */
export const Delaunay2D = {

  /** Triangulates 2D points and returns a PlanarGraph with Delaunay faces. */
  triangulate(points: Vec2[]): PlanarGraph {
    if (points.length < 3) throw new Error("Need at least 3 points for triangulation.");

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    }

    const margin = Math.max(maxX - minX, maxY - minY) * 2 + 1;
    const cx = (minX + maxX) * 0.5, cy = (minY + maxY) * 0.5;

    const graph = new PlanarGraph();
    const sv0 = graph.addVertex(new Vec2(cx - margin, cy - margin));
    const sv1 = graph.addVertex(new Vec2(cx + margin, cy - margin));
    const sv2 = graph.addVertex(new Vec2(cx, cy + margin));

    graph.addEdge(sv0, sv1);
    graph.addEdge(sv1, sv2);
    graph.addEdge(sv2, sv0);

    const root = new DTriangle(sv0, sv1, sv2);

    for (const p of points) {
      const v = graph.addVertex(p);
      delaunayInsert(graph, v, root);
    }

    removeSuperTriangle(graph, sv0, sv1, sv2);

    // Remove any isolated vertices (points that failed insertion)
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }

    // Repair boundary: super-triangle removal may leave concave dents
    repairConvexHull(graph);

    graph.buildFaces();
    return graph;
  },
};

function delaunayInsert(graph: PlanarGraph, v: PGVertex, root: DTriangle): void {
  const tri = locateTriangle(root, v.position);
  if (!tri) return;

  const a = tri.v0, b = tri.v1, c = tri.v2;
  const edgeHit = onEdge(v.position, a.position, b.position, c.position);

  if (edgeHit < 0) {
    splitTriangle(graph, tri, v, root);
  } else {
    splitOnEdge(graph, tri, v, edgeHit, root);
  }
}

function splitTriangle(graph: PlanarGraph, tri: DTriangle, v: PGVertex, root: DTriangle): void {
  const { v0: a, v1: b, v2: c } = tri;
  graph.addEdge(v, a);
  graph.addEdge(v, b);
  graph.addEdge(v, c);

  tri.children.push(new DTriangle(v, a, b), new DTriangle(v, b, c), new DTriangle(v, c, a));

  flipIfNeeded(graph, v, a, b, root);
  flipIfNeeded(graph, v, b, c, root);
  flipIfNeeded(graph, v, c, a, root);
}

function splitOnEdge(graph: PlanarGraph, tri: DTriangle, v: PGVertex, edgeHit: number, root: DTriangle): void {
  let a = tri.v0, b = tri.v1, c = tri.v2;
  if (edgeHit === 1) { const tmp = a; a = b; b = c; c = tmp; }
  else if (edgeHit === 2) { const tmp = c; c = b; b = a; a = tmp; }

  let d: PGVertex | null = null;
  let opposite: DTriangle | null = null;

  const hab = a.getEdgeTo(b);
  if (hab) {
    const twin = hab.twin;
    let cur = twin.next;
    let safety = 0;
    while (cur !== twin && safety++ < 20) {
      if (cur.origin !== a && cur.origin !== b) { d = cur.origin; break; }
      cur = cur.next;
    }
    if (d) {
      const cx = (a.position.x + b.position.x + d.position.x) / 3;
      const cy = (a.position.y + b.position.y + d.position.y) / 3;
      opposite = locateTriangle(root, new Vec2(cx, cy));
    }
  }

  if (hab) graph.removeEdge(hab);
  graph.addEdge(v, a);
  graph.addEdge(v, b);
  graph.addEdge(v, c);

  tri.children.push(new DTriangle(v, a, c), new DTriangle(v, b, c));

  if (d) {
    graph.addEdge(v, d);
    const t3 = new DTriangle(v, a, d);
    const t4 = new DTriangle(v, b, d);
    if (opposite) { opposite.children.push(t3, t4); }
    flipIfNeeded(graph, v, a, d, root);
    flipIfNeeded(graph, v, d, b, root);
  }

  flipIfNeeded(graph, v, a, c, root);
  flipIfNeeded(graph, v, c, b, root);
}

function flipIfNeeded(graph: PlanarGraph, v: PGVertex, p1: PGVertex, p2: PGVertex, root: DTriangle): void {
  const h = p1.getEdgeTo(p2);
  if (!h) return;

  const opp = findOppositeVertex(h, v);
  if (!opp) return;

  if (inCircumcircle(v.position, p1.position, p2.position, opp.position)) {
    const c1x = (v.position.x + p1.position.x + p2.position.x) / 3;
    const c1y = (v.position.y + p1.position.y + p2.position.y) / 3;
    const c2x = (opp.position.x + p1.position.x + p2.position.x) / 3;
    const c2y = (opp.position.y + p1.position.y + p2.position.y) / 3;
    const tri1 = locateTriangle(root, new Vec2(c1x, c1y));
    const tri2 = locateTriangle(root, new Vec2(c2x, c2y));

    graph.removeEdge(h);
    graph.addEdge(v, opp);

    const newT1 = new DTriangle(v, p1, opp);
    const newT2 = new DTriangle(v, opp, p2);

    if (tri1) { tri1.children.push(newT1, newT2); }
    if (tri2 && tri2 !== tri1) { tri2.children.push(newT1, newT2); }

    flipIfNeeded(graph, v, p1, opp, root);
    flipIfNeeded(graph, v, opp, p2, root);
  }
}

function findOppositeVertex(h: PGHalfEdge, exclude: PGVertex): PGVertex | null {
  const twin = h.twin;
  let cur = twin.next;
  let safety = 0;
  while (cur !== twin && safety++ < 20) {
    if (cur.origin !== h.origin && cur.origin !== h.destination && cur.origin !== exclude)
      return cur.origin;
    cur = cur.next;
  }
  return null;
}

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

function locateTriangle(node: DTriangle, p: Vec2): DTriangle | null {
  if (node.children.length === 0)
    return containsPoint(node, p) ? node : null;

  for (const child of node.children) {
    if (containsPoint(child, p)) {
      const result = locateTriangle(child, p);
      if (result) return result;
    }
  }

  // Fallback: point on boundary between children — try all leaf descendants
  return locateTriangleBrute(node, p);
}

/** Brute-force fallback: collect all leaves and find the closest containing one. */
function locateTriangleBrute(node: DTriangle, p: Vec2): DTriangle | null {
  if (node.children.length === 0)
    return containsPointRelaxed(node, p) ? node : null;
  for (const child of node.children) {
    const result = locateTriangleBrute(child, p);
    if (result) return result;
  }
  return null;
}

function containsPoint(tri: DTriangle, p: Vec2): boolean {
  const d1 = triSign(p, tri.v0.position, tri.v1.position);
  const d2 = triSign(p, tri.v1.position, tri.v2.position);
  const d3 = triSign(p, tri.v2.position, tri.v0.position);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/** Relaxed containment with small tolerance for boundary cases. */
function containsPointRelaxed(tri: DTriangle, p: Vec2): boolean {
  const EPS = 1e-10;
  const d1 = triSign(p, tri.v0.position, tri.v1.position);
  const d2 = triSign(p, tri.v1.position, tri.v2.position);
  const d3 = triSign(p, tri.v2.position, tri.v0.position);
  const hasNeg = d1 < -EPS || d2 < -EPS || d3 < -EPS;
  const hasPos = d1 > EPS || d2 > EPS || d3 > EPS;
  return !(hasNeg && hasPos);
}

function triSign(p: Vec2, a: Vec2, b: Vec2): number {
  return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
}

function onEdge(p: Vec2, a: Vec2, b: Vec2, c: Vec2): number {
  const EPS = 1e-6;
  if (Math.abs(triSign(p, a, b)) < EPS) return 0;
  if (Math.abs(triSign(p, b, c)) < EPS) return 1;
  if (Math.abs(triSign(p, c, a)) < EPS) return 2;
  return -1;
}

function removeSuperTriangle(graph: PlanarGraph, sv0: PGVertex, sv1: PGVertex, sv2: PGVertex): void {
  const superVerts = new Set([sv0, sv1, sv2]);
  const toRemove: PGHalfEdge[] = [];
  for (const h of graph.getUniqueEdges()) {
    if (superVerts.has(h.origin) || superVerts.has(h.destination))
      toRemove.push(h);
  }
  for (const h of toRemove) graph.removeEdge(h);

  for (let i = graph.vertices.length - 1; i >= 0; i--) {
    if (superVerts.has(graph.vertices[i])) graph.vertices.splice(i, 1);
  }
}

/**
 * After super-triangle removal, the boundary may be concave due to edge flips
 * toward super-triangle vertices during insertion. This repairs the boundary
 * by iteratively clipping concave ears until the boundary is the convex hull.
 */
function repairConvexHull(graph: PlanarGraph): void {
  for (let iter = 0; iter < 1000; iter++) {
    graph.buildFaces();

    const extFace = graph.faces.find(f => f.signedArea() < 0);
    if (!extFace) return;

    // Collect exterior boundary edges
    const edges: PGHalfEdge[] = [];
    for (const he of extFace.edges()) edges.push(he);

    // Find a concavity: a left turn on the CW exterior boundary
    let foundConcavity = false;
    for (let i = 0; i < edges.length; i++) {
      const cur = edges[i];
      const nxt = edges[(i + 1) % edges.length];
      const d1 = cur.direction;
      const d2 = nxt.direction;
      const cross = d1.x * d2.y - d1.y * d2.x;

      if (cross > 1e-9) {
        // Left turn on CW boundary = concave dent
        // Clip the ear: add edge from cur.origin to nxt.destination
        graph.addEdge(cur.origin, nxt.destination);
        foundConcavity = true;
        break;
      }
    }

    if (!foundConcavity) break;
  }
}

// ================================================================
// VORONOI 2D — the dual of Delaunay2D: clipped Voronoi and power diagrams
// ================================================================

/**
 * One cell of a `Voronoi2D` diagram: the part of the clip region nearer to its site than to any other site (by power distance when radii are given).
 *
 * @experimental No app uses this yet; it may still change.
 */
export interface VoronoiCell {
  /** Index of the site in the input array. */
  site: number;
  /** The outline, counter-clockwise, first point not repeated; empty when the clip leaves nothing of the cell. */
  polygon: Vec2[];
  /** One entry per edge polygon[k] → polygon[k+1]: the site whose cell lies across that edge, or -1 where the clip boundary bounds the cell. */
  neighbors: number[];
}

/**
 * Options for `Voronoi2D.cells`: the region to clip the diagram to, and a radius per site for a power diagram.
 *
 * @experimental No app uses this yet; it may still change.
 */
export interface VoronoiOptions {
  /** The region to clip to: a simple polygon ring, convex or not, either winding, first point not repeated. Default: the sites' bounding rectangle grown by half its larger side on every side. */
  clip?: Vec2[];
  /** A radius per site: a power (Laguerre) diagram, in which the boundary between two touching circles runs through their contact point. Default: plain Voronoi. */
  radii?: number[];
}

/** Relative to the diagram's size: sites nearer than this coincide, and shorter edges are dropped. */
const VORONOI_EPS = 1e-10;
/** Floor for that tolerance in ulps of the largest coordinate, for a small diagram far from the origin. */
const VORONOI_ULPS = 64;
/** Relative to a cell's size: how near the clip ring an edge of a concave-clipped cell must lie to count as lying on it. */
const VORONOI_RING_TOL = 1e-8;
/** PolygonBool snaps to a fixed grid (setClipSnap); a cell is intersected with the clip ring in a frame where it spans this many units, so the snap is negligible in any units. */
const VORONOI_BOOL_FRAME = 1e9;

/** A polygon being clipped: vertex k and the label of its edge k → k+1, in reusable arrays. */
class VPoly {
  x: number[] = [];
  y: number[] = [];
  l: number[] = [];
  n = 0;
  push(x: number, y: number, l: number): void {
    const k = this.n++;
    this.x[k] = x; this.y[k] = y; this.l[k] = l;
  }
  copyFrom(p: VPoly): void {
    this.n = 0;
    for (let k = 0; k < p.n; k++) this.push(p.x[k], p.y[k], p.l[k]);
  }
}

/**
 * Voronoi and power (Laguerre) diagrams of 2D points, clipped to a region, with the site across every cell edge — the dual of `Delaunay2D`.
 *
 *   const cells = Voronoi2D.cells(sites, { clip: outline });   // cells[i].site === i
 *   const adj = Voronoi2D.neighbors(cells, sites.length);       // adj[i]: the sites next to i
 *
 * Exact half-plane clipping: each cell is cut only by the sites a uniform grid and a security
 * radius say can reach it, so 5,000 sites take a few tens of milliseconds. It does not use
 * `Delaunay2D`; every site gets its cell, also coincident and collinear ones.
 *
 * @experimental No app uses this yet; it may still change.
 */
export const Voronoi2D = {

  /**
   * The cells of `sites` within `options.clip`. Result order: `cells[i].site === i` for every
   * `i < sites.length`, and that entry is the piece of site i's cell that contains the site (if
   * the site lies outside the clip: its largest piece; an empty polygon when nothing is left).
   * A concave clip can cut one cell into several pieces; any further pieces are appended after
   * the first `sites.length` entries, each carrying its `site`. So `cells.length >= sites.length`,
   * and the pieces together cover the clip region exactly.
   *
   * Each polygon is counter-clockwise and `neighbors[k]` names the site across its edge k (`-1`
   * on the clip boundary). With `options.radii` the diagram is a power diagram (a small circle
   * among large ones can have an empty cell, or a cell that misses its own centre). Of sites
   * that coincide, the one with the larger radius (then the lower index) keeps the cell; the
   * others get an empty one and are nobody's neighbour. Throws, naming the value, on a
   * non-finite site, a `radii` array of the wrong length or with a negative entry, or a clip
   * ring that encloses no area.
   */
  cells(sites: Vec2[], options: VoronoiOptions = {}): VoronoiCell[] {
    const n = sites.length;
    const { clip, radii } = options;
    for (let i = 0; i < n; i++) {
      const p = sites[i];
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y))
        throw new Error(`Voronoi2D.cells: sites[${i}] is ${p ? `(${p.x}, ${p.y})` : p}; a site needs finite x and y.`);
    }
    if (radii !== undefined) {
      if (radii.length !== n)
        throw new Error(`Voronoi2D.cells: options.radii has ${radii.length} entries for ${n} sites; give one radius per site.`);
      for (let i = 0; i < n; i++) {
        if (!(Number.isFinite(radii[i]) && radii[i] >= 0))
          throw new Error(`Voronoi2D.cells: options.radii[${i}] is ${radii[i]}; a radius must be a finite number >= 0.`);
      }
    }
    if (clip !== undefined) {
      for (let k = 0; k < clip.length; k++) {
        const p = clip[k];
        if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y))
          throw new Error(`Voronoi2D.cells: options.clip[${k}] is ${p ? `(${p.x}, ${p.y})` : p}; clip points need finite x and y.`);
      }
    }
    if (n === 0) return [];

    // ── Sites' bounds, the clip ring and the diagram's scale ──
    let sx0 = Infinity, sy0 = Infinity, sx1 = -Infinity, sy1 = -Infinity;
    for (const p of sites) {
      if (p.x < sx0) sx0 = p.x; if (p.x > sx1) sx1 = p.x;
      if (p.y < sy0) sy0 = p.y; if (p.y > sy1) sy1 = p.y;
    }
    const sw = sx1 - sx0, sh = sy1 - sy0;
    let rawClip: Vec2[];
    if (clip !== undefined) {
      rawClip = clip;
    } else {
      const pad = Math.max(sw, sh) / 2 || 1;
      rawClip = [
        new Vec2(sx0 - pad, sy0 - pad), new Vec2(sx1 + pad, sy0 - pad),
        new Vec2(sx1 + pad, sy1 + pad), new Vec2(sx0 - pad, sy1 + pad),
      ];
    }
    let cx0 = Infinity, cy0 = Infinity, cx1 = -Infinity, cy1 = -Infinity;
    for (const p of rawClip) {
      if (p.x < cx0) cx0 = p.x; if (p.x > cx1) cx1 = p.x;
      if (p.y < cy0) cy0 = p.y; if (p.y > cy1) cy1 = p.y;
    }
    const scale = Math.max(sw, sh, cx1 - cx0, cy1 - cy0) || 1;
    const far = Math.max(Math.abs(sx0), Math.abs(sx1), Math.abs(sy0), Math.abs(sy1), Math.abs(cx0), Math.abs(cx1), Math.abs(cy0), Math.abs(cy1));
    const eps = Math.max(VORONOI_EPS * scale, VORONOI_ULPS * Number.EPSILON * far);
    const ring = voronoiClipRing(rawClip, eps, clip !== undefined);
    const convexClip = voronoiIsConvex(ring.x, ring.y);

    const base = new VPoly();
    if (convexClip) {
      for (let k = 0; k < ring.x.length; k++) base.push(ring.x[k], ring.y[k], -1);
    } else {
      base.push(cx0, cy0, -1); base.push(cx1, cy0, -1); base.push(cx1, cy1, -1); base.push(cx0, cy1, -1);
    }

    // ── Uniform grid over the sites, about one site per grid cell ──
    let cs = Math.max(Math.sqrt((sw * sh) / n), Math.max(sw, sh) / n);
    if (!(cs > 0)) cs = 1;
    const gnx = Math.floor(sw / cs) + 1, gny = Math.floor(sh / cs) + 1;
    const gcol = new Int32Array(n), grow = new Int32Array(n);
    const start = new Int32Array(gnx * gny + 1);
    for (let i = 0; i < n; i++) {
      gcol[i] = Math.min(gnx - 1, Math.floor((sites[i].x - sx0) / cs));
      grow[i] = Math.min(gny - 1, Math.floor((sites[i].y - sy0) / cs));
      start[grow[i] * gnx + gcol[i] + 1]++;
    }
    for (let g = 0; g < gnx * gny; g++) start[g + 1] += start[g];
    const items = new Int32Array(n);
    const fill = start.slice(0, gnx * gny);
    for (let i = 0; i < n; i++) items[fill[grow[i] * gnx + gcol[i]]++] = i;

    const r = (i: number) => (radii ? radii[i] : 0);

    // ── Coincident sites: the larger radius, then the lower index, keeps the cell ──
    const dead = new Uint8Array(n);
    const eps2 = eps * eps;
    for (let i = 0; i < n; i++) {
      const pi = sites[i];
      for (let gy = Math.max(0, grow[i] - 1); gy <= Math.min(gny - 1, grow[i] + 1) && !dead[i]; gy++) {
        for (let gx = Math.max(0, gcol[i] - 1); gx <= Math.min(gnx - 1, gcol[i] + 1) && !dead[i]; gx++) {
          const g = gy * gnx + gx;
          for (let q = start[g]; q < start[g + 1]; q++) {
            const j = items[q];
            if (j === i) continue;
            const dx = sites[j].x - pi.x, dy = sites[j].y - pi.y;
            if (dx * dx + dy * dy < eps2 && (r(j) > r(i) || (r(j) === r(i) && j < i))) { dead[i] = 1; break; }
          }
        }
      }
    }
    let rmax2 = 0;
    for (let i = 0; i < n; i++) if (!dead[i]) rmax2 = Math.max(rmax2, r(i) * r(i));

    // ── One convex cell: the base polygon cut by the bisectors of the sites that can reach it ──
    let cur = new VPoly(), nxt = new VPoly();
    const dist: number[] = [];
    const convexCell = (i: number): VPoly | null => {
      const px = sites[i].x, py = sites[i].y, ri2 = r(i) * r(i);
      cur.copyFrom(base);
      let R = voronoiReach(cur, px, py);
      const ci = gcol[i], cj = grow[i];
      for (let k = 0; ; k++) {
        if (k > 0) {
          // No site in ring k or beyond is nearer to site i than `near`.
          let near = Infinity;
          if (ci - k >= 0) near = Math.min(near, px - (sx0 + (ci - k + 1) * cs));
          if (ci + k <= gnx - 1) near = Math.min(near, sx0 + (ci + k) * cs - px);
          if (cj - k >= 0) near = Math.min(near, py - (sy0 + (cj - k + 1) * cs));
          if (cj + k <= gny - 1) near = Math.min(near, sy0 + (cj + k) * cs - py);
          if (near === Infinity) break;
          if (near >= R + Math.sqrt(Math.max(0, R * R - ri2 + rmax2))) break;
        }
        const x0 = ci - k, x1 = ci + k, y0 = cj - k, y1 = cj + k;
        for (let gy = Math.max(0, y0); gy <= Math.min(gny - 1, y1); gy++) {
          const fullRow = gy === y0 || gy === y1;
          for (let gx = Math.max(0, x0); gx <= Math.min(gnx - 1, x1); gx++) {
            if (!fullRow && gx !== x0 && gx !== x1) { gx = x1 - 1; continue; }
            const g = gy * gnx + gx;
            for (let q = start[g]; q < start[g + 1]; q++) {
              const j = items[q];
              if (j === i || dead[j]) continue;
              const dx = sites[j].x - px, dy = sites[j].y - py;
              const dd = Math.sqrt(dx * dx + dy * dy);
              if (dd * dd < eps2) continue;
              // Site i keeps { x : (x - p_i)·u <= h }, u the unit vector towards site j.
              const h = (dd * dd + ri2 - r(j) * r(j)) / (2 * dd);
              if (h >= R) continue;
              if (!voronoiClip(cur, nxt, px, py, dx / dd, dy / dd, h, j, dist)) continue;
              const t = cur; cur = nxt; nxt = t;
              if (cur.n < 3) return null;
              R = voronoiReach(cur, px, py);
            }
          }
        }
      }
      voronoiDropShortEdges(cur, eps);
      return cur.n >= 3 ? cur : null;
    };

    // ── Assemble: piece 0 of every site first, further pieces after ──
    const out: VoronoiCell[] = new Array(n);
    const extra: VoronoiCell[] = [];
    const toCell = (site: number, p: VPoly | null): VoronoiCell => {
      const polygon: Vec2[] = [], neighbors: number[] = [];
      if (p) for (let k = 0; k < p.n; k++) { polygon.push(new Vec2(p.x[k], p.y[k])); neighbors.push(p.l[k]); }
      return { site, polygon, neighbors };
    };
    const ringClip = convexClip ? null : new VoronoiRingClip(ring.x, ring.y, eps);
    for (let i = 0; i < n; i++) {
      const cell = dead[i] ? null : convexCell(i);
      if (!ringClip || !cell) { out[i] = toCell(i, cell); continue; }
      const pieces = ringClip.clip(cell, sites[i].x, sites[i].y, i);
      out[i] = toCell(i, pieces[0] ?? null);
      for (let k = 1; k < pieces.length; k++) extra.push(toCell(i, pieces[k]));
    }
    return extra.length ? out.concat(extra) : out;
  },

  /**
   * For each site, the sites whose cells share an edge with it — ascending, no duplicates,
   * symmetric — read from the `neighbors` labels of `cells` (any pieces, any order).
   * `siteCount` is `sites.length` of the call that made `cells`.
   */
  neighbors(cells: VoronoiCell[], siteCount: number): number[][] {
    if (!(Number.isInteger(siteCount) && siteCount >= 0))
      throw new Error(`Voronoi2D.neighbors: siteCount is ${siteCount}; pass sites.length.`);
    const sets: Set<number>[] = [];
    for (let i = 0; i < siteCount; i++) sets.push(new Set());
    for (const c of cells) {
      if (!(Number.isInteger(c.site) && c.site >= 0 && c.site < siteCount))
        throw new Error(`Voronoi2D.neighbors: a cell has site ${c.site}, outside 0..${siteCount - 1}; is siteCount sites.length?`);
      for (const j of c.neighbors) {
        if (j < 0 || j === c.site) continue;
        if (!(Number.isInteger(j) && j < siteCount))
          throw new Error(`Voronoi2D.neighbors: the cell of site ${c.site} names neighbour ${j}, outside 0..${siteCount - 1}; is siteCount sites.length?`);
        sets[c.site].add(j);
        sets[j].add(c.site);
      }
    }
    return sets.map((s) => [...s].sort((a, b) => a - b));
  },
};

/** The clip as an open CCW ring without repeated or collinear points; throws when it encloses no area. */
function voronoiClipRing(clip: Vec2[], eps: number, given: boolean): { x: number[]; y: number[] } {
  let x: number[] = [], y: number[] = [];
  for (const p of clip) {
    const m = x.length;
    if (m > 0 && Math.abs(p.x - x[m - 1]) <= eps && Math.abs(p.y - y[m - 1]) <= eps) continue;
    x.push(p.x); y.push(p.y);
  }
  while (x.length > 1 && Math.abs(x[0] - x[x.length - 1]) <= eps && Math.abs(y[0] - y[y.length - 1]) <= eps) { x.pop(); y.pop(); }
  // Drop vertices that lie on the line through their neighbours (straight runs and spikes).
  for (let changed = true; changed && x.length >= 3;) {
    changed = false;
    for (let k = 0; k < x.length && x.length >= 3; k++) {
      const a = (k + x.length - 1) % x.length, b = (k + 1) % x.length;
      const ex = x[b] - x[a], ey = y[b] - y[a], len = Math.hypot(ex, ey);
      const off = len > 0 ? Math.abs((x[k] - x[a]) * ey - (y[k] - y[a]) * ex) / len : Math.hypot(x[k] - x[a], y[k] - y[a]);
      if (off <= eps) { x.splice(k, 1); y.splice(k, 1); changed = true; k--; }
    }
  }
  let area2 = 0;
  for (let k = 0; k < x.length; k++) {
    const b = (k + 1) % x.length;
    area2 += x[k] * y[b] - x[b] * y[k];
  }
  if (x.length < 3 || Math.abs(area2) <= eps * eps) {
    if (given) throw new Error(`Voronoi2D.cells: options.clip (${clip.length} points) encloses no area; give a ring of at least 3 points that are not all on one line.`);
    throw new Error("Voronoi2D.cells: the default clip encloses no area.");
  }
  if (area2 < 0) { x = x.reverse(); y = y.reverse(); }
  return { x, y };
}

/** True when the CCW ring turns left at every vertex and winds once. */
function voronoiIsConvex(x: number[], y: number[]): boolean {
  const m = x.length;
  let turning = 0;
  for (let k = 0; k < m; k++) {
    const a = (k + m - 1) % m, b = (k + 1) % m;
    const ux = x[k] - x[a], uy = y[k] - y[a], vx = x[b] - x[k], vy = y[b] - y[k];
    const cross = ux * vy - uy * vx;
    if (cross <= 0) return false;
    turning += Math.atan2(cross, ux * vx + uy * vy);
  }
  return Math.abs(turning - 2 * Math.PI) < 1e-6;
}

/** The largest distance from (px, py) to a vertex of `p`: the whole convex polygon lies within it. */
function voronoiReach(p: VPoly, px: number, py: number): number {
  let m = 0;
  for (let k = 0; k < p.n; k++) {
    const dx = p.x[k] - px, dy = p.y[k] - py, d = dx * dx + dy * dy;
    if (d > m) m = d;
  }
  return Math.sqrt(m);
}

/**
 * Sutherland–Hodgman with edge labels: keeps the part of `src` where (x - o)·u <= h and writes it
 * to `dst`; the run along the line gets `label`. Returns false (dst untouched) when nothing is cut.
 * Signs are exact, with no tolerance, so the two cells either side of a short edge decide alike;
 * the edges this makes shorter than the tolerance are dropped once the cell is done.
 */
function voronoiClip(
  src: VPoly, dst: VPoly, ox: number, oy: number, ux: number, uy: number, h: number,
  label: number, d: number[],
): boolean {
  const m = src.n;
  let anyOut = false, anyIn = false;
  for (let k = 0; k < m; k++) {
    const v = (src.x[k] - ox) * ux + (src.y[k] - oy) * uy - h;
    d[k] = v;
    if (v > 0) anyOut = true; else anyIn = true;
  }
  if (!anyOut) return false;
  dst.n = 0;
  if (!anyIn) return true;
  for (let k = 0; k < m; k++) {
    const kn = k + 1 === m ? 0 : k + 1;
    const dc = d[k], dn = d[kn];
    if (dc <= 0) {
      if (dn <= 0) {
        dst.push(src.x[k], src.y[k], src.l[k]);
      } else if (dc < 0) {
        // Leaving: from the exit point to the next entry point the cell runs along the line.
        dst.push(src.x[k], src.y[k], src.l[k]);
        const t = dc / (dc - dn);
        dst.push(src.x[k] + t * (src.x[kn] - src.x[k]), src.y[k] + t * (src.y[kn] - src.y[k]), label);
      } else {
        dst.push(src.x[k], src.y[k], label); // on the line, leaving from here
      }
    } else if (dn < 0) {
      const t = dc / (dc - dn);
      dst.push(src.x[k] + t * (src.x[kn] - src.x[k]), src.y[k] + t * (src.y[kn] - src.y[k]), src.l[k]);
    }
  }
  return true;
}

/** Drops vertex k when its edge k → k+1 is shorter than `minLen` (vertex k+1 keeps its label). */
function voronoiDropShortEdges(p: VPoly, minLen: number): void {
  const min2 = minLen * minLen;
  for (let changed = true; changed && p.n > 0;) {
    changed = false;
    let w = 0;
    const m = p.n;
    for (let k = 0; k < m; k++) {
      const kn = k + 1 === m ? 0 : k + 1;
      const dx = p.x[kn] - p.x[k], dy = p.y[kn] - p.y[k];
      if (dx * dx + dy * dy < min2) { changed = true; continue; }
      p.x[w] = p.x[k]; p.y[w] = p.y[k]; p.l[w] = p.l[k]; w++;
    }
    p.n = w;
  }
  if (p.n < 3) p.n = 0;
}

/** Cuts convex cells to a concave clip ring and labels the pieces' edges. */
class VoronoiRingClip {
  private readonly x: number[];
  private readonly y: number[];
  private readonly minEdge: number;
  // Bounds of ring edge k (vertex k → k+1), for a cheap prefilter.
  private readonly ex0: Float64Array;
  private readonly ey0: Float64Array;
  private readonly ex1: Float64Array;
  private readonly ey1: Float64Array;

  constructor(x: number[], y: number[], minEdge: number) {
    this.x = x; this.y = y; this.minEdge = minEdge;
    const m = x.length;
    this.ex0 = new Float64Array(m); this.ey0 = new Float64Array(m);
    this.ex1 = new Float64Array(m); this.ey1 = new Float64Array(m);
    for (let k = 0; k < m; k++) {
      const b = (k + 1) % m;
      this.ex0[k] = Math.min(x[k], x[b]); this.ex1[k] = Math.max(x[k], x[b]);
      this.ey0[k] = Math.min(y[k], y[b]); this.ey1[k] = Math.max(y[k], y[b]);
    }
  }

  /** The pieces of convex `cell` inside the ring: the one holding (sx, sy) first, else the largest first. */
  clip(cell: VPoly, sx: number, sy: number, site: number): VPoly[] {
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (let k = 0; k < cell.n; k++) {
      if (cell.x[k] < bx0) bx0 = cell.x[k]; if (cell.x[k] > bx1) bx1 = cell.x[k];
      if (cell.y[k] < by0) by0 = cell.y[k]; if (cell.y[k] > by1) by1 = cell.y[k];
    }
    const extent = Math.max(bx1 - bx0, by1 - by0);
    const tol = Math.max(this.minEdge, VORONOI_RING_TOL * extent);
    const near: number[] = [];
    for (let k = 0; k < this.x.length; k++) {
      if (this.ex0[k] <= bx1 + tol && this.ex1[k] >= bx0 - tol && this.ey0[k] <= by1 + tol && this.ey1[k] >= by0 - tol) near.push(k);
    }
    let crosses = false;
    for (const k of near) {
      const b = (k + 1) % this.x.length;
      if (voronoiSegmentEnters(this.x[k], this.y[k], this.x[b], this.y[b], cell, tol)) { crosses = true; break; }
    }
    if (!crosses) {
      // The ring does not pass through the cell: the cell is all inside or all outside.
      let mx = 0, my = 0;
      for (let k = 0; k < cell.n; k++) { mx += cell.x[k]; my += cell.y[k]; }
      if (!this.contains(mx / cell.n, my / cell.n)) return [];
      if (near.length === 0) { const p = new VPoly(); p.copyFrom(cell); return [p]; }
      const p = this.label(cell.x.slice(0, cell.n), cell.y.slice(0, cell.n), cell, near, tol);
      return p ? [p] : [];
    }

    // Only the ring's part around the cell takes part; its runs along the box stay clear of the cell.
    const margin = extent / 4 + tol;
    const part = voronoiRingInBox(this.x, this.y, bx0 - margin, by0 - margin, bx1 + margin, by1 + margin);
    // Intersect in a local frame where the cell spans VORONOI_BOOL_FRAME units.
    const ox = (bx0 + bx1) / 2, oy = (by0 + by1) / 2, s = VORONOI_BOOL_FRAME / (extent || 1);
    const cellRing: Vec2[] = [];
    for (let k = 0; k < cell.n; k++) cellRing.push(new Vec2((cell.x[k] - ox) * s, (cell.y[k] - oy) * s));
    const clipRing: Vec2[] = [];
    for (let k = 0; k < part.x.length; k++) clipRing.push(new Vec2((part.x[k] - ox) * s, (part.y[k] - oy) * s));
    let result: MultiPoly2;
    try {
      result = PolygonBool.intersection(PolygonBool.fromRing(cellRing), PolygonBool.fromRing(clipRing));
    } catch (err) {
      throw new Error(`Voronoi2D.cells: cutting the cell of site ${site} to options.clip failed (${(err as Error).message}); is the clip a simple ring?`);
    }
    const pieces: { p: VPoly; area: number; holds: boolean }[] = [];
    for (const poly of result) {
      const outer = poly[0];
      if (!outer || outer.length < 3) continue;
      const px = outer.map((v) => v.x / s + ox), py = outer.map((v) => v.y / s + oy);
      const p = this.label(px, py, cell, near, tol);
      if (!p) continue;
      const area = voronoiArea(p);
      if (2 * area <= tol * voronoiPerimeter(p)) continue; // no wider than the tolerance: noise
      pieces.push({ p, area, holds: voronoiContains(p.x, p.y, p.n, sx, sy) });
    }
    pieces.sort((a, b) => (a.holds !== b.holds ? (a.holds ? -1 : 1) : b.area - a.area));
    return pieces.map((q) => q.p);
  }

  /**
   * Labels the edges of a piece (CCW ring px/py) of `cell`: split at ring and cell vertices that
   * lie on an edge, a stretch along the clip ring is -1, one along a labelled cell edge takes that label.
   */
  private label(px: number[], py: number[], cell: VPoly, near: number[], tol: number): VPoly | null {
    if (voronoiSignedArea(px, py) < 0) { px.reverse(); py.reverse(); }
    const m = px.length, rm = this.x.length;
    const out = new VPoly();
    const cuts: number[] = [];
    for (let k = 0; k < m; k++) {
      const ax = px[k], ay = py[k], bx = px[(k + 1) % m], by = py[(k + 1) % m];
      const ex = bx - ax, ey = by - ay, len = Math.hypot(ex, ey);
      if (len <= tol) continue;
      cuts.length = 0;
      cuts.push(0, 1);
      const cutAt = (vx: number, vy: number) => {
        const t = ((vx - ax) * ex + (vy - ay) * ey) / (len * len);
        if (t * len <= tol || (1 - t) * len <= tol) return;
        if (Math.abs((vx - ax) * ey - (vy - ay) * ex) / len <= tol) cuts.push(t);
      };
      for (const e of near) { cutAt(this.x[e], this.y[e]); const b = (e + 1) % rm; cutAt(this.x[b], this.y[b]); }
      for (let c = 0; c < cell.n; c++) cutAt(cell.x[c], cell.y[c]);
      cuts.sort((a, b) => a - b);
      let last = NaN;
      for (let q = 0; q + 1 < cuts.length; q++) {
        const t0 = cuts[q], t1 = cuts[q + 1];
        if ((t1 - t0) * len <= tol) continue;
        const x0 = ax + t0 * ex, y0 = ay + t0 * ey, x1 = ax + t1 * ex, y1 = ay + t1 * ey;
        const lab = this.classify(x0, y0, x1, y1, cell, near, tol);
        if (lab === last) continue;
        out.push(x0, y0, lab);
        last = lab;
      }
    }
    voronoiDropShortEdges(out, this.minEdge);
    return out.n >= 3 ? out : null;
  }

  /** -1 when the stretch lies along the clip ring, else the label of the cell edge it lies along (-1 if none). */
  private classify(x0: number, y0: number, x1: number, y1: number, cell: VPoly, near: number[], tol: number): number {
    const rm = this.x.length;
    for (const e of near) {
      const b = (e + 1) % rm;
      if (voronoiAlong(x0, y0, x1, y1, this.x[e], this.y[e], this.x[b], this.y[b], tol)) return -1;
    }
    for (let c = 0; c < cell.n; c++) {
      if (cell.l[c] < 0) continue;
      const b = c + 1 === cell.n ? 0 : c + 1;
      if (voronoiAlong(x0, y0, x1, y1, cell.x[c], cell.y[c], cell.x[b], cell.y[b], tol)) return cell.l[c];
    }
    return -1;
  }

  private contains(px: number, py: number): boolean {
    return voronoiContains(this.x, this.y, this.x.length, px, py);
  }
}

/**
 * The part of a ring inside a box (Sutherland–Hodgman). Where the ring leaves and re-enters the box
 * the result runs back and forth along the box: zero-width, so it adds nothing under the non-zero rule.
 */
function voronoiRingInBox(x: number[], y: number[], x0: number, y0: number, x1: number, y1: number): { x: number[]; y: number[] } {
  let px = x, py = y;
  for (let side = 0; side < 4 && px.length >= 3; side++) {
    // Signed distance outside the box's side `side`: left, right, bottom, top.
    const out = (k: number) => (side === 0 ? x0 - px[k] : side === 1 ? px[k] - x1 : side === 2 ? y0 - py[k] : py[k] - y1);
    const qx: number[] = [], qy: number[] = [];
    for (let k = 0, m = px.length; k < m; k++) {
      const kn = k + 1 === m ? 0 : k + 1;
      const a = out(k), b = out(kn);
      if (a <= 0) { qx.push(px[k]); qy.push(py[k]); }
      if ((a <= 0) !== (b <= 0)) {
        const t = a / (a - b);
        qx.push(px[k] + t * (px[kn] - px[k])); qy.push(py[k] + t * (py[kn] - py[k]));
      }
    }
    px = qx; py = qy;
  }
  return { x: px, y: py };
}

/** True when segment 0→1 lies on segment a→b: both ends within `tol` of its line, its midpoint within its span. */
function voronoiAlong(x0: number, y0: number, x1: number, y1: number, ax: number, ay: number, bx: number, by: number, tol: number): boolean {
  const ex = bx - ax, ey = by - ay, len = Math.hypot(ex, ey);
  if (len <= 0) return false;
  if (Math.abs((x0 - ax) * ey - (y0 - ay) * ex) / len > tol) return false;
  if (Math.abs((x1 - ax) * ey - (y1 - ay) * ex) / len > tol) return false;
  const t = (((x0 + x1) / 2 - ax) * ex + ((y0 + y1) / 2 - ay) * ey) / len;
  return t >= -tol && t <= len + tol;
}

/** True when segment a→b enters the convex CCW `cell` shrunk by `tol` (Cyrus–Beck). */
function voronoiSegmentEnters(ax: number, ay: number, bx: number, by: number, cell: VPoly, tol: number): boolean {
  let t0 = 0, t1 = 1;
  for (let k = 0; k < cell.n; k++) {
    const kn = k + 1 === cell.n ? 0 : k + 1;
    const ex = cell.x[kn] - cell.x[k], ey = cell.y[kn] - cell.y[k], len = Math.hypot(ex, ey);
    if (len <= 0) continue;
    const nx = ey / len, ny = -ex / len; // outward normal
    const fa = (ax - cell.x[k]) * nx + (ay - cell.y[k]) * ny + tol;
    const fb = (bx - cell.x[k]) * nx + (by - cell.y[k]) * ny + tol;
    if (fa > 0 && fb > 0) return false;
    if (fa > 0) t0 = Math.max(t0, fa / (fa - fb));
    else if (fb > 0) t1 = Math.min(t1, fa / (fa - fb));
    if (t0 >= t1) return false;
  }
  return true;
}

/** Even–odd point-in-polygon on coordinate arrays. */
function voronoiContains(x: number[], y: number[], m: number, px: number, py: number): boolean {
  let inside = false;
  for (let k = 0, j = m - 1; k < m; j = k++) {
    if ((y[k] > py) !== (y[j] > py) && px < ((x[j] - x[k]) * (py - y[k])) / (y[j] - y[k]) + x[k]) inside = !inside;
  }
  return inside;
}

function voronoiSignedArea(x: number[], y: number[]): number {
  let a = 0;
  for (let k = 0, m = x.length; k < m; k++) {
    const b = k + 1 === m ? 0 : k + 1;
    a += x[k] * y[b] - x[b] * y[k];
  }
  return a / 2;
}

function voronoiPerimeter(p: VPoly): number {
  let s = 0;
  for (let k = 0; k < p.n; k++) {
    const b = k + 1 === p.n ? 0 : k + 1;
    s += Math.hypot(p.x[b] - p.x[k], p.y[b] - p.y[k]);
  }
  return s;
}

function voronoiArea(p: VPoly): number {
  let a = 0;
  for (let k = 0; k < p.n; k++) {
    const b = k + 1 === p.n ? 0 : k + 1;
    a += p.x[k] * p.y[b] - p.x[b] * p.y[k];
  }
  return Math.abs(a) / 2;
}
