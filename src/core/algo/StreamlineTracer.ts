/**
 * Face-based streamline tracer for a direction field defined on mesh faces.
 *
 * Ported from HDGEO's `MeshStreamlineTracer` (see
 * `HDGEO/src/HDGEO.Core/Geometry/Mesh/MeshStreamLineTracer.cs`).
 *
 * Algorithm: for each seed face, take an Euler step in the face's field
 * direction (smoothed against the previous step's heading to keep the curve
 * coherent across discontinuities), then walk across the edge into the next
 * face when the step exits. Trace both directions from the seed and join the
 * results into a single polyline.
 *
 * Caveats:
 *  - The field must be sign-aligned (combed) before tracing — otherwise the
 *    180° eigensolver flips will tear streamlines apart at every face boundary.
 *  - Quads are supported but treated as ABC-triangle for normal / inside-test
 *    purposes (consistent with HDGEO's approach).
 *  - Seeds are picked by integer stride over face ids; this is *not* the
 *    Jobard-Lefebvre evenly-spaced placement. A separation-distance pass can
 *    be added later if streamline density needs to be uniform across the mesh.
 */
import { Vec3 } from "../math/vectors";
import type { ConnectedMesh } from "../geometry/mesh/ConnectedMesh";
import { closestPointOnSegment } from "../geometry/Segment";

export interface StreamlineOptions {
  /** Maximum integration steps per direction (forward + backward each get this budget). */
  maxSteps?: number;
  /** Skip every `stride` face ids when seeding. Lower = denser. */
  stride?: number;
  /** Drop seeds whose field magnitude² is below this. */
  minMagSq?: number;
  /** Multiplier on the mesh's average edge length to set the Euler step. */
  stepFactor?: number;
  /** Lift each emitted point along the face normal by this fraction of edge length (anti-Z-fight). */
  liftFactor?: number;
}

export const StreamlineTracer = {
  /**
   * Laplacian smoothing of a single polyline. Each interior point is moved
   * toward the midpoint of its two neighbors. The endpoints are fixed so the
   * curve doesn't shrink at the silhouette / boundary.
   *
   * Pass `iterations > 1` for stronger smoothing; `weight ∈ [0,1]` controls
   * per-iteration step. Point count is unchanged (good for plotters — output
   * length stays predictable).
   */
  smoothPolyline(points: Vec3[], iterations = 1, weight = 0.5): Vec3[] {
    if (points.length < 3 || iterations < 1) return points;
    let cur = points;
    for (let it = 0; it < iterations; it++) {
      const next: Vec3[] = new Array(cur.length);
      next[0] = cur[0];
      for (let i = 1; i < cur.length - 1; i++) {
        const mid = cur[i - 1].add(cur[i + 1]).mul(0.5);
        next[i] = cur[i].lerp(mid, weight);
      }
      next[cur.length - 1] = cur[cur.length - 1];
      cur = next;
    }
    return cur;
  },

  /**
   * Trace streamlines across a triangle/quad mesh given a per-face direction field.
   *
   * @param mesh           connected mesh
   * @param field          `Map<faceId, Vec3>` — direction (and magnitude) per face
   * @param options        tracing parameters
   * @returns              array of polylines (each polyline is Vec3[])
   */
  trace(
    mesh: ConnectedMesh,
    field: Map<number, Vec3>,
    options: StreamlineOptions = {},
  ): Vec3[][] {
    const {
      maxSteps = 200,
      stride = 1,
      minMagSq = 1e-12,
      stepFactor = 0.25,
      liftFactor = 0.02,
    } = options;

    const avgEdge = computeAverageEdgeLength(mesh);
    const dt = avgEdge * stepFactor;
    const lift = avgEdge * liftFactor;
    const lines: Vec3[][] = [];

    // Pre-compute face normals and centers once per call. Each Euler step
    // would otherwise recompute these (and they involve crosses + sqrts).
    const cache = buildFaceCache(mesh);

    const faces = mesh.facesArray();
    for (let i = 0; i < faces.length; i += stride) {
      const seedFace = faces[i];
      const seedDir = field.get(seedFace.id);
      if (!seedDir || seedDir.lenSq() < minMagSq) continue;

      const fwd = traceEuler(mesh, cache, seedFace.id, seedDir, field, maxSteps, dt, lift);
      const bwd = traceEuler(mesh, cache, seedFace.id, seedDir.neg(), field, maxSteps, dt, lift);

      if (bwd.length > 0) {
        bwd.reverse();
        if (fwd.length > 1) bwd.push(...fwd.slice(1));
        if (bwd.length > 2) lines.push(bwd);
      } else if (fwd.length > 1) {
        lines.push(fwd);
      }
    }
    return lines;
  },
};

// ─── Internals ────────────────────────────────

function computeAverageEdgeLength(mesh: ConnectedMesh): number {
  const edges = mesh.edgesArray();
  if (edges.length === 0) return 0.1;
  let total = 0;
  let count = 0;
  for (let i = 0; i < edges.length; i += 5) {
    const e = edges[i];
    const a = mesh.node(e.nodes[0])!.position;
    const b = mesh.node(e.nodes[1])!.position;
    total += a.distTo(b);
    count++;
  }
  return count > 0 ? total / count : 0.1;
}

interface FaceCache {
  normals: Map<number, Vec3>;
  centers: Map<number, Vec3>;
}

function buildFaceCache(mesh: ConnectedMesh): FaceCache {
  const normals = new Map<number, Vec3>();
  const centers = new Map<number, Vec3>();
  for (const f of mesh.faces()) {
    const a = mesh.node(f.nodes[0])!.position;
    const b = mesh.node(f.nodes[1])!.position;
    const c = mesh.node(f.nodes[2])!.position;
    normals.set(f.id, f.normal ?? b.sub(a).cross(c.sub(a)).normalize());

    let sx = 0, sy = 0, sz = 0;
    for (const nid of f.nodes) {
      const p = mesh.node(nid)!.position;
      sx += p.x; sy += p.y; sz += p.z;
    }
    const inv = 1 / f.nodes.length;
    centers.set(f.id, new Vec3(sx * inv, sy * inv, sz * inv));
  }
  return { normals, centers };
}

/** Returns true if `p` lies inside (or on) the polygon `face` (assumed roughly planar). */
function isPointInFace(mesh: ConnectedMesh, faceId: number, p: Vec3): boolean {
  const f = mesh.face(faceId)!;
  const n = f.nodes;
  // Fan-triangulate from node[0]; the point is inside the face iff it lies in any tri.
  const p0 = mesh.node(n[0])!.position;
  for (let i = 1; i < n.length - 1; i++) {
    const p1 = mesh.node(n[i])!.position;
    const p2 = mesh.node(n[i + 1])!.position;
    if (pointInTriangle(p, p0, p1, p2)) return true;
  }
  return false;
}

function pointInTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean {
  const normal = b.sub(a).cross(c.sub(a));
  const wA = b.sub(p).cross(c.sub(p)).dot(normal);
  const wB = c.sub(p).cross(a.sub(p)).dot(normal);
  const wC = a.sub(p).cross(b.sub(p)).dot(normal);
  return wA >= 0 && wB >= 0 && wC >= 0;
}

interface ExitHit {
  edgeId: number;
  point: Vec3;
}

/**
 * Ray-cast from `pos` along `dir` (both in the face's tangent plane) to find
 * which edge of `faceId` the ray exits through.
 */
function findExitEdge(
  mesh: ConnectedMesh,
  faceId: number,
  pos: Vec3,
  dir: Vec3,
  faceNormalFor: (id: number) => Vec3,
): ExitHit | null {
  const f = mesh.face(faceId)!;
  const n = faceNormalFor(faceId);

  let closest = Infinity;
  let bestEdge = -1;
  let bestPoint = Vec3.zero();

  for (const eid of f.edges) {
    const edge = mesh.edge(eid)!;
    const A = mesh.node(edge.nodes[0])!.position;
    const B = mesh.node(edge.nodes[1])!.position;
    const edgeDir = B.sub(A);
    const cross = edgeDir.cross(n);
    const denom = dir.dot(cross);
    if (Math.abs(denom) < 1e-6) continue;

    const t = A.sub(pos).dot(cross) / denom;
    if (t > -1e-4 && t < closest) {
      const hit = pos.add(dir.mul(t));
      const lenSq = edgeDir.lenSq();
      const u = lenSq > 0 ? hit.sub(A).dot(edgeDir) / lenSq : 0;
      if (u >= -0.01 && u <= 1.01) {
        closest = t;
        bestEdge = eid;
        bestPoint = hit;
      }
    }
  }
  return bestEdge >= 0 ? { edgeId: bestEdge, point: bestPoint } : null;
}

/**
 * Rescue fallback when `findExitEdge` returns null (typically because of
 * floating-point precision near a vertex or a sliver triangle). Pick the
 * edge physically closest to the proposed next position.
 */
function closestEdgeFallback(
  mesh: ConnectedMesh,
  faceId: number,
  proposedNext: Vec3,
): ExitHit | null {
  const f = mesh.face(faceId)!;
  let minDist = Infinity;
  let bestEdge = -1;
  let bestPoint = Vec3.zero();

  for (const eid of f.edges) {
    const edge = mesh.edge(eid)!;
    const A = mesh.node(edge.nodes[0])!.position;
    const B = mesh.node(edge.nodes[1])!.position;
    const close = closestPointOnSegment(proposedNext, A, B);
    const d = proposedNext.distSqTo(close);
    if (d < minDist) {
      minDist = d;
      bestEdge = eid;
      bestPoint = close;
    }
  }
  return bestEdge >= 0 ? { edgeId: bestEdge, point: bestPoint } : null;
}

function neighborFace(mesh: ConnectedMesh, edgeId: number, currentFaceId: number): number {
  const e = mesh.edge(edgeId)!;
  if (e.faces.length < 2) return -1;
  return e.faces[0] === currentFaceId ? e.faces[1] : e.faces[0];
}

function traceEuler(
  mesh: ConnectedMesh,
  cache: FaceCache,
  startFaceId: number,
  startDir: Vec3,
  field: Map<number, Vec3>,
  maxSteps: number,
  dt: number,
  lift: number,
): Vec3[] {
  const normalFor = (id: number): Vec3 => cache.normals.get(id) ?? Vec3.unitY();
  const centerFor = (id: number): Vec3 => cache.centers.get(id) ?? Vec3.zero();

  const points: Vec3[] = [];
  let currFace = startFaceId;
  let currPos = centerFor(currFace);
  let currDir = startDir;
  let normal = normalFor(currFace);
  points.push(currPos.add(normal.mul(lift)));

  for (let step = 0; step < maxSteps; step++) {
    let target = field.get(currFace);
    if (!target || target.lenSq() < 1e-12) break;
    if (target.dot(currDir) < 0) target = target.neg();

    let blended = currDir.lerp(target, 0.5);
    const blendedLen = blended.len();
    if (blendedLen < 1e-9) break;
    currDir = blended.div(blendedLen);

    normal = normalFor(currFace);
    let planeDir = currDir.sub(normal.mul(currDir.dot(normal)));
    const planeLen = planeDir.len();
    if (planeLen < 1e-9) break;
    planeDir = planeDir.div(planeLen);

    const nextPos = currPos.add(planeDir.mul(dt));

    if (isPointInFace(mesh, currFace, nextPos)) {
      currPos = nextPos;
      points.push(currPos.add(normal.mul(lift)));
      continue;
    }

    let exit = findExitEdge(mesh, currFace, currPos, planeDir, normalFor);
    if (!exit) exit = closestEdgeFallback(mesh, currFace, nextPos);
    if (!exit) break;

    currPos = exit.point;
    points.push(currPos.add(normal.mul(lift)));

    if (mesh.isBoundaryEdge(exit.edgeId)) break;
    const nextFace = neighborFace(mesh, exit.edgeId, currFace);
    if (nextFace < 0) break;
    currFace = nextFace;

    const nextNormal = normalFor(currFace);
    let nextDir = currDir.sub(nextNormal.mul(currDir.dot(nextNormal)));
    const nLen = nextDir.len();
    if (nLen < 1e-9) break;
    nextDir = nextDir.div(nLen);
    currPos = currPos.add(nextDir.mul(dt * 0.1));
  }

  return points;
}
