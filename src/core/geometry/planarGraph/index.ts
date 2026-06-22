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
 */

import { Vec2, Vec3 } from "../../math/vectors";
import { HMath } from "../../math/HMath";
import { VecMath } from "../../math/VecMath";
import { Polygon2D } from "../Polygon2D";
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
