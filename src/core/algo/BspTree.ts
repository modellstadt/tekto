/**
 * BSP (Binary Space Partition) Tree.
 *
 * Supports:
 *  - Autopartition BSP construction from convex polygons
 *  - CSG operations: union, subtract, intersect
 *  - Point classification: inside / outside / on
 *  - Front-to-back / back-to-front traversal for painter's algorithm
 *  - Mesh I/O: fromMesh / toMesh
 */

import { Vec3 } from "../math/vectors";
import { HPlane } from "../geometry/HPlane";

// ── Public types ─────────────────────────────────────────────────────────────

export interface BspPolygon {
  vertices: Vec3[];
  plane: HPlane;
  /** Optional user data carried through splits (e.g. material, layer). */
  shared?: unknown;
}

/** BSP tree node. null children represent empty half-spaces. */
export interface BspNode {
  plane: HPlane;
  front: BspNode | null;
  back: BspNode | null;
  coplanarFront: BspPolygon[];
  coplanarBack: BspPolygon[];
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Epsilon for polygon splitting. Larger than HMath.EPSILON to tolerate
 *  floating-point drift through recursive splits. */
const EPS = 1e-5;

// ── Polygon helpers ──────────────────────────────────────────────────────────

/** Create a BspPolygon from vertices, computing the plane automatically. */
export function polygonFromVertices(vertices: Vec3[], shared?: unknown): BspPolygon {
  const plane = HPlane.fromThreePoints(vertices[0], vertices[1], vertices[2]);
  return { vertices, plane, shared };
}

/** Flip a polygon (reverse winding + negate plane). */
function flipPolygon(p: BspPolygon): BspPolygon {
  return { vertices: [...p.vertices].reverse(), plane: p.plane.flipped(), shared: p.shared };
}

// ── Split polygon by plane ───────────────────────────────────────────────────

const enum Side { COPLANAR = 0, FRONT = 1, BACK = 2, SPANNING = 3 }

/**
 * Split a polygon by a plane. Pushes results into the four output arrays:
 *   coplanarFront, coplanarBack, front, back.
 */
function splitPolygon(
  polygon: BspPolygon,
  plane: HPlane,
  coplanarFront: BspPolygon[],
  coplanarBack: BspPolygon[],
  front: BspPolygon[],
  back: BspPolygon[],
): void {
  const verts = polygon.vertices;
  const n = verts.length;
  const dists: number[] = new Array(n);
  const sides: number[] = new Array(n);
  let type = Side.COPLANAR;

  for (let i = 0; i < n; i++) {
    const d = plane.distToPoint(verts[i]);
    dists[i] = d;
    const s = d > EPS ? Side.FRONT : d < -EPS ? Side.BACK : Side.COPLANAR;
    sides[i] = s;
    type |= s;
  }

  switch (type) {
    case Side.COPLANAR:
      // Same-facing or opposite-facing?
      if (plane.normal.dot(polygon.plane.normal) > 0) coplanarFront.push(polygon);
      else coplanarBack.push(polygon);
      break;

    case Side.FRONT:
      front.push(polygon);
      break;

    case Side.BACK:
      back.push(polygon);
      break;

    case Side.SPANNING: {
      const f: Vec3[] = [];
      const b: Vec3[] = [];

      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const si = sides[i], sj = sides[j];
        const vi = verts[i], vj = verts[j];

        if (si !== Side.BACK) f.push(vi);
        if (si !== Side.FRONT) b.push(vi);

        if ((si | sj) === Side.SPANNING) {
          // Edge crosses the plane — interpolate
          const t = dists[i] / (dists[i] - dists[j]);
          const v = vi.lerp(vj, t);
          f.push(v);
          b.push(v);
        }
      }

      if (f.length >= 3) front.push({ vertices: f, plane: polygon.plane, shared: polygon.shared });
      if (b.length >= 3) back.push({ vertices: b, plane: polygon.plane, shared: polygon.shared });
      break;
    }
  }
}

// ── Node operations ──────────────────────────────────────────────────────────

/** Build a BSP tree from a list of polygons. */
function buildNode(polygons: BspPolygon[]): BspNode | null {
  if (polygons.length === 0) return null;

  const plane = polygons[0].plane;
  const coF: BspPolygon[] = [];
  const coB: BspPolygon[] = [];
  const front: BspPolygon[] = [];
  const back: BspPolygon[] = [];

  for (const p of polygons) {
    splitPolygon(p, plane, coF, coB, front, back);
  }

  return {
    plane,
    front: buildNode(front),
    back: buildNode(back),
    coplanarFront: coF,
    coplanarBack: coB,
  };
}

/** Collect all polygons from a BSP tree. */
function allPolygons(node: BspNode | null): BspPolygon[] {
  if (!node) return [];
  return [
    ...node.coplanarFront,
    ...node.coplanarBack,
    ...allPolygons(node.front),
    ...allPolygons(node.back),
  ];
}

/** Deep clone a BSP node tree. */
function cloneNode(node: BspNode | null): BspNode | null {
  if (!node) return null;
  return {
    plane: node.plane,
    front: cloneNode(node.front),
    back: cloneNode(node.back),
    coplanarFront: [...node.coplanarFront],
    coplanarBack: [...node.coplanarBack],
  };
}

/** Flip inside/outside for all polygons in the tree. */
function invertNode(node: BspNode | null): void {
  if (!node) return;
  // Flip coplanar polygons
  for (let i = 0; i < node.coplanarFront.length; i++) {
    node.coplanarFront[i] = flipPolygon(node.coplanarFront[i]);
  }
  for (let i = 0; i < node.coplanarBack.length; i++) {
    node.coplanarBack[i] = flipPolygon(node.coplanarBack[i]);
  }
  // Swap coplanar bins
  const tmp = node.coplanarFront;
  node.coplanarFront = node.coplanarBack;
  node.coplanarBack = tmp;
  // Flip plane
  (node as any).plane = node.plane.flipped();
  // Swap and recurse children
  const tmpChild = node.front;
  node.front = node.back;
  node.back = tmpChild;
  invertNode(node.front);
  invertNode(node.back);
}

/**
 * Clip polygons against a BSP tree, keeping only the parts inside
 * (or outside if `keepInside` is false) the tree's solid.
 */
function clipPolygons(node: BspNode | null, polygons: BspPolygon[]): BspPolygon[] {
  if (!node) return [...polygons];

  let front: BspPolygon[] = [];
  let back: BspPolygon[] = [];
  const coF: BspPolygon[] = [];
  const coB: BspPolygon[] = [];

  for (const p of polygons) {
    splitPolygon(p, node.plane, coF, coB, front, back);
  }
  // Coplanar-front polygons go with front
  front = front.concat(coF);
  // Coplanar-back polygons go with back
  back = back.concat(coB);

  front = clipPolygons(node.front, front);
  // Back side: only keep if there IS a back subtree (inside the solid).
  // If node.back is null, back polygons are inside → discard them.
  back = node.back ? clipPolygons(node.back, back) : [];

  return front.concat(back);
}

/** Clip all polygons within tree `a` to the solid of tree `b`. */
function clipTo(a: BspNode | null, b: BspNode | null): void {
  if (!a || !b) return;
  a.coplanarFront = clipPolygons(b, a.coplanarFront);
  a.coplanarBack = clipPolygons(b, a.coplanarBack);
  clipTo(a.front, b);
  clipTo(a.back, b);
}

// ── Point classification ─────────────────────────────────────────────────────

export type PointClassification = "inside" | "outside" | "on";

function classifyPointNode(node: BspNode | null, point: Vec3): PointClassification {
  if (!node) return "outside";

  const d = node.plane.distToPoint(point);
  if (d > EPS) return classifyPointNode(node.front, point);
  if (d < -EPS) {
    // In the back half-space: if no back child, we're inside the solid
    return node.back ? classifyPointNode(node.back, point) : "inside";
  }
  // On the plane — check if point is within any coplanar polygon
  for (const poly of node.coplanarFront) {
    if (pointInConvexPolygon(point, poly)) return "on";
  }
  for (const poly of node.coplanarBack) {
    if (pointInConvexPolygon(point, poly)) return "on";
  }
  // On the plane but not in any polygon — try both sides
  const fc = classifyPointNode(node.front, point);
  if (fc === "inside") return "inside";
  return classifyPointNode(node.back, point);
}

/** Test if a point lies inside a convex polygon (assumed coplanar). */
function pointInConvexPolygon(point: Vec3, poly: BspPolygon): boolean {
  const verts = poly.vertices;
  const n = verts.length;
  const normal = poly.plane.normal;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const edge = verts[j].sub(verts[i]);
    const toPoint = point.sub(verts[i]);
    if (edge.cross(toPoint).dot(normal) < -EPS) return false;
  }
  return true;
}

// ── Traversal ────────────────────────────────────────────────────────────────

type TraversalCallback = (polygons: BspPolygon[]) => void;

function traverseFTB(node: BspNode | null, eye: Vec3, visit: TraversalCallback): void {
  if (!node) return;
  const d = node.plane.distToPoint(eye);
  if (d > 0) {
    // Eye in front: back first (farther), then coplanars, then front (closer)
    traverseFTB(node.back, eye, visit);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    traverseFTB(node.front, eye, visit);
  } else {
    traverseFTB(node.front, eye, visit);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    traverseFTB(node.back, eye, visit);
  }
}

function traverseBTF(node: BspNode | null, eye: Vec3, visit: TraversalCallback): void {
  if (!node) return;
  const d = node.plane.distToPoint(eye);
  if (d > 0) {
    // Eye in front: front first (closer), then coplanars, then back (farther)
    traverseBTF(node.front, eye, visit);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    traverseBTF(node.back, eye, visit);
  } else {
    traverseBTF(node.back, eye, visit);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    traverseBTF(node.front, eye, visit);
  }
}

// ── Mesh I/O ─────────────────────────────────────────────────────────────────

/** Create BspPolygons from indexed triangle mesh data.
 *  Auto-orients normals outward using the mesh centroid heuristic. */
function polygonsFromMesh(positions: Float32Array, indices: Uint32Array): BspPolygon[] {
  // Compute mesh centroid for orientation check
  const nVerts = positions.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < positions.length; i += 3) {
    cx += positions[i]; cy += positions[i + 1]; cz += positions[i + 2];
  }
  cx /= nVerts; cy /= nVerts; cz /= nVerts;

  const polys: BspPolygon[] = [];
  const nTri = indices.length / 3;
  for (let i = 0; i < nTri; i++) {
    const i0 = indices[i * 3] * 3;
    const i1 = indices[i * 3 + 1] * 3;
    const i2 = indices[i * 3 + 2] * 3;
    let a = new Vec3(positions[i0], positions[i0 + 1], positions[i0 + 2]);
    let b = new Vec3(positions[i1], positions[i1 + 1], positions[i1 + 2]);
    let c = new Vec3(positions[i2], positions[i2 + 1], positions[i2 + 2]);
    // Skip degenerate triangles
    const cross = b.sub(a).cross(c.sub(a));
    if (cross.len() < EPS) continue;
    // Ensure normal points away from centroid (outward)
    const triCenter = new Vec3(
      (a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3
    );
    const outward = new Vec3(triCenter.x - cx, triCenter.y - cy, triCenter.z - cz);
    if (cross.dot(outward) < 0) {
      // Winding is inward — swap b and c to flip
      const tmp = b; b = c; c = tmp;
    }
    polys.push(polygonFromVertices([a, b, c]));
  }
  return polys;
}

/** Fan-triangulate convex polygons and pack into typed arrays. */
function polygonsToMesh(polys: BspPolygon[]): { positions: Float32Array; indices: Uint32Array } {
  // Vertex deduplication via spatial hashing
  const QUANT = 1e5; // quantize to 10-micron grid
  const vertMap = new Map<string, number>();
  const verts: number[] = [];
  const idxs: number[] = [];

  function addVert(v: Vec3): number {
    const key = `${Math.round(v.x * QUANT)}:${Math.round(v.y * QUANT)}:${Math.round(v.z * QUANT)}`;
    let idx = vertMap.get(key);
    if (idx !== undefined) return idx;
    idx = verts.length / 3;
    vertMap.set(key, idx);
    verts.push(v.x, v.y, v.z);
    return idx;
  }

  for (const p of polys) {
    const vs = p.vertices;
    if (vs.length < 3) continue;
    const i0 = addVert(vs[0]);
    for (let j = 1; j < vs.length - 1; j++) {
      idxs.push(i0, addVert(vs[j]), addVert(vs[j + 1]));
    }
  }

  return {
    positions: new Float32Array(verts),
    indices: new Uint32Array(idxs),
  };
}

// ── Public API: BspTree class ────────────────────────────────────────────────

export class BspTree {
  constructor(public root: BspNode | null) {}

  // ── Construction ──

  /** Build a BSP tree from polygons. */
  static fromPolygons(polys: BspPolygon[]): BspTree {
    return new BspTree(buildNode(polys));
  }

  /** Build a BSP tree from an indexed triangle mesh. */
  static fromMesh(positions: Float32Array, indices: Uint32Array): BspTree {
    return BspTree.fromPolygons(polygonsFromMesh(positions, indices));
  }

  // ── Queries ──

  /** Collect all polygons in the tree. */
  toPolygons(): BspPolygon[] {
    return allPolygons(this.root);
  }

  /** Triangulate all polygons and return as typed arrays (shared vertices). */
  toMesh(): { positions: Float32Array; indices: Uint32Array } {
    return polygonsToMesh(this.toPolygons());
  }

  /** Triangulate with flat (per-face) normals — ready for rendering.
   *  No vertex deduplication; each triangle gets its own 3 vertices + normal. */
  toFlatMesh(): { positions: Float32Array; normals: Float32Array; indices: Uint32Array } {
    const polys = this.toPolygons();
    // Count total triangles
    let nTris = 0;
    for (const p of polys) nTris += Math.max(0, p.vertices.length - 2);
    const positions = new Float32Array(nTris * 9);
    const normals = new Float32Array(nTris * 9);
    const indices = new Uint32Array(nTris * 3);
    let vi = 0, ii = 0;
    for (const p of polys) {
      const vs = p.vertices;
      if (vs.length < 3) continue;
      const nx = p.plane.normal.x, ny = p.plane.normal.y, nz = p.plane.normal.z;
      for (let j = 1; j < vs.length - 1; j++) {
        const base = vi / 3;
        positions[vi] = vs[0].x; positions[vi+1] = vs[0].y; positions[vi+2] = vs[0].z;
        normals[vi] = nx; normals[vi+1] = ny; normals[vi+2] = nz;
        vi += 3;
        positions[vi] = vs[j].x; positions[vi+1] = vs[j].y; positions[vi+2] = vs[j].z;
        normals[vi] = nx; normals[vi+1] = ny; normals[vi+2] = nz;
        vi += 3;
        positions[vi] = vs[j+1].x; positions[vi+1] = vs[j+1].y; positions[vi+2] = vs[j+1].z;
        normals[vi] = nx; normals[vi+1] = ny; normals[vi+2] = nz;
        vi += 3;
        indices[ii++] = base; indices[ii++] = base + 1; indices[ii++] = base + 2;
      }
    }
    return { positions, normals, indices };
  }

  /** Deep clone. */
  clone(): BspTree {
    return new BspTree(cloneNode(this.root));
  }

  /** Flip solid inside/outside. */
  invert(): BspTree {
    invertNode(this.root);
    return this;
  }

  /** Classify a point relative to the solid. */
  classifyPoint(point: Vec3): PointClassification {
    return classifyPointNode(this.root, point);
  }

  // ── Traversal ──

  /** Visit polygons front-to-back from the given eye position. */
  traverseFrontToBack(eye: Vec3, visit: TraversalCallback): void {
    traverseFTB(this.root, eye, visit);
  }

  /** Visit polygons back-to-front from the given eye position (painter's order). */
  traverseBackToFront(eye: Vec3, visit: TraversalCallback): void {
    traverseBTF(this.root, eye, visit);
  }

  // ── CSG operations (return new trees, inputs unchanged) ──

  /** Return a new tree representing the union of a and b. */
  static union(a: BspTree, b: BspTree): BspTree {
    const ac = a.clone();
    const bc = b.clone();
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    // Remove coplanar faces from B that are inside A
    invertNode(bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    return BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
  }

  /** Return a new tree representing a with b subtracted. */
  static subtract(a: BspTree, b: BspTree): BspTree {
    const ac = a.clone();
    const bc = b.clone();
    invertNode(ac.root);
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    // ac is still inverted; merge all polys and invert the result
    // so A's polys get 2 inversions (net 0) and B's polys get 1 (facing inward)
    const result = BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
    result.invert();
    return result;
  }

  /** Return a new tree representing the intersection of a and b. */
  static intersect(a: BspTree, b: BspTree): BspTree {
    const ac = a.clone();
    const bc = b.clone();
    invertNode(ac.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(ac.root);
    invertNode(bc.root);
    return BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
  }
}
