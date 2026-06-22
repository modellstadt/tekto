/**
 * Per-vertex principal curvature estimation via Taubin's tensor method.
 *
 * Reference: G. Taubin, "Estimating the Tensor of Curvature of a Surface from a
 * Polyhedral Approximation," ICCV 1995.
 *
 * For each vertex we accumulate a symmetric tensor over the one-ring, then
 * solve a closed-form 2×2 eigendecomposition in the tangent plane (the surface
 * normal is the third — trivial — eigenvector, so the full 3×3 Jacobi can be
 * skipped). This mirrors the tangent-plane trick used by HDGEO's
 * `StressVisualizer.ComputeTensorFields`.
 *
 * Output is a *line field*: principal directions are defined up to a 180° flip
 * (the eigensolver's per-vertex sign is arbitrary). Call `combDirections` to
 * make the field sign-consistent across the mesh before tracing streamlines.
 */
import { Vec3 } from "../math/vectors";
import type { ConnectedMesh } from "../geometry/mesh/ConnectedMesh";

export interface VertexCurvature {
  /** Principal curvature with larger (signed) value. */
  kMax: number;
  /** Principal curvature with smaller (signed) value. */
  kMin: number;
  /** Unit principal direction (in the tangent plane) corresponding to kMax. */
  dirMax: Vec3;
  /** Unit principal direction (in the tangent plane) corresponding to kMin. */
  dirMin: Vec3;
  /** (kMax + kMin) / 2 */
  meanCurvature: number;
  /** kMax * kMin */
  gaussCurvature: number;
  /** True if this vertex lies on a mesh boundary (open edge). Curvature is unreliable here. */
  isBoundary: boolean;
}

/** Pick an orthonormal (u, v) basis spanning the tangent plane perpendicular to n.
 *  Falls back to world axes if `n` is degenerate (length ~0). */
function tangentBasis(n: Vec3): { u: Vec3; v: Vec3 } {
  if (n.lenSq() < 1e-12) return { u: Vec3.unitX(), v: Vec3.unitZ() };
  const axis = Math.abs(n.z) < 0.9 ? Vec3.unitZ() : Vec3.unitX();
  const u = axis.sub(n.mul(axis.dot(n))).normalize();
  const v = n.cross(u).normalize();
  return { u, v };
}

function triangleArea(a: Vec3, b: Vec3, c: Vec3): number {
  return b.sub(a).cross(c.sub(a)).len() * 0.5;
}

export const Curvature = {
  /**
   * Estimate per-vertex principal curvatures and directions.
   *
   * `mesh.computeVertexNormals()` is invoked internally to ensure normals are
   * available and up-to-date.
   *
   * Returns a Map keyed by node id. Boundary and degenerate vertices receive
   * zero curvature and an arbitrary (but unit) direction pair; check
   * `result.isBoundary` to filter them out.
   */
  taubin(mesh: ConnectedMesh): Map<number, VertexCurvature> {
    mesh.computeVertexNormals();

    const result = new Map<number, VertexCurvature>();

    for (const node of mesh.nodes()) {
      const n = node.normal ?? Vec3.zero();
      const p = node.position;
      // Treat isolated / no-face vertices as boundary; their normals are zero.
      const isBoundary = mesh.isBoundaryNode(node.id) || node.faces.length === 0 || n.lenSq() < 1e-12;
      const { u, v } = tangentBasis(n);

      // Accumulate the 2×2 tangent-plane tensor in the (u, v) basis.
      let mUU = 0, mVV = 0, mUV = 0;
      let totalW = 0;

      for (const eid of node.edges) {
        const edge = mesh.edge(eid)!;
        const otherId = edge.nodes[0] === node.id ? edge.nodes[1] : edge.nodes[0];
        const other = mesh.node(otherId);
        if (!other) continue;

        const e = other.position.sub(p);
        const eLenSq = e.lenSq();
        if (eLenSq < 1e-20) continue;

        // Edge weight: sum of incident triangle areas (Taubin weighting).
        // For polygonal (quad) faces we fan-triangulate from face.nodes[0].
        let w = 0;
        for (const fid of edge.faces) {
          const face = mesh.face(fid);
          if (!face || face.nodes.length < 3) continue;
          const fn = face.nodes;
          const p0 = mesh.node(fn[0])!.position;
          for (let i = 1; i < fn.length - 1; i++) {
            w += triangleArea(p0, mesh.node(fn[i])!.position, mesh.node(fn[i + 1])!.position);
          }
        }
        if (w < 1e-20) continue;

        // Directional (normal) curvature estimate κ_ij = -2 nᵀe / |e|².
        // Sign convention: convex w.r.t. an outward-pointing normal → positive κ
        // (so a unit sphere with outward normals has κ_max = κ_min = +1).
        const kappa = -2 * n.dot(e) / eLenSq;

        // Tangent projection of the edge: T_ij = (e − n(n·e)) / |·|.
        const tProj = e.sub(n.mul(n.dot(e)));
        const tLen = tProj.len();
        if (tLen < 1e-12) continue;
        const tU = tProj.dot(u) / tLen;
        const tV = tProj.dot(v) / tLen;

        mUU += w * kappa * tU * tU;
        mVV += w * kappa * tV * tV;
        mUV += w * kappa * tU * tV;
        totalW += w;
      }

      if (totalW < 1e-20) {
        result.set(node.id, {
          kMax: 0, kMin: 0,
          dirMax: u, dirMin: v,
          meanCurvature: 0, gaussCurvature: 0, isBoundary,
        });
        continue;
      }

      // Normalize so Σ w = 1; required for Taubin's eigenvalue → κ recovery.
      mUU /= totalW;
      mVV /= totalW;
      mUV /= totalW;

      // 2×2 symmetric eigendecomposition of [[mUU, mUV], [mUV, mVV]].
      const trace = mUU + mVV;
      const halfDiff = (mUU - mVV) * 0.5;
      const gap = Math.sqrt(halfDiff * halfDiff + mUV * mUV);
      const m1 = trace * 0.5 + gap; // larger
      const m2 = trace * 0.5 - gap; // smaller

      // Eigenvector for m1 in (u, v) coordinates.
      let e1U: number, e1V: number;
      if (Math.abs(mUV) > 1e-12) {
        e1U = m1 - mVV;
        e1V = mUV;
      } else {
        // Diagonal tensor — principal axes are u and v.
        if (mUU >= mVV) { e1U = 1; e1V = 0; }
        else            { e1U = 0; e1V = 1; }
      }
      const inv = 1 / Math.sqrt(e1U * e1U + e1V * e1V);
      e1U *= inv; e1V *= inv;
      // Second principal direction is perpendicular in the tangent plane.
      const e2U = -e1V, e2V = e1U;

      // Taubin recovery: M's eigenvalues are linear combos of κ_max, κ_min.
      //   m1 = (3 κ_max + κ_min) / 8
      //   m2 = (3 κ_min + κ_max) / 8
      // ⇒ κ_max = 3 m1 − m2, κ_min = 3 m2 − m1.
      const kMax = 3 * m1 - m2;
      const kMin = 3 * m2 - m1;

      const dirMax = u.mul(e1U).add(v.mul(e1V)).normalize();
      const dirMin = u.mul(e2U).add(v.mul(e2V)).normalize();

      result.set(node.id, {
        kMax, kMin, dirMax, dirMin,
        meanCurvature: (kMax + kMin) * 0.5,
        gaussCurvature: kMax * kMin,
        isBoundary,
      });
    }

    return result;
  },

  /**
   * Build a per-face direction field by averaging the vertex principal
   * directions around each face. Use `which: "max" | "min"` to pick which
   * eigenvector to average. The result is scaled by the (averaged) curvature
   * magnitude so that flat / umbilic faces produce near-zero vectors and can
   * be filtered out by the streamline tracer.
   *
   * Run `combDirections` first — otherwise face-averaged vectors will cancel
   * each other out wherever two adjacent vertices have opposite sign.
   */
  facePrincipalField(
    mesh: ConnectedMesh,
    curvatures: Map<number, VertexCurvature>,
    which: "max" | "min",
  ): Map<number, Vec3> {
    const field = new Map<number, Vec3>();
    for (const face of mesh.faces()) {
      let sx = 0, sy = 0, sz = 0;
      let magSum = 0;
      let count = 0;
      let refDir: Vec3 | null = null;
      for (const nid of face.nodes) {
        const c = curvatures.get(nid);
        if (!c) continue;
        let d = which === "max" ? c.dirMax : c.dirMin;
        // Align this vertex's direction with the first one we saw on this face
        // to suppress any leftover sign disagreement that survived combing.
        if (refDir === null) refDir = d;
        else if (d.dot(refDir) < 0) d = d.neg();
        const mag = Math.abs(which === "max" ? c.kMax : c.kMin);
        sx += d.x; sy += d.y; sz += d.z;
        magSum += mag;
        count++;
      }
      if (count === 0) { field.set(face.id, Vec3.zero()); continue; }
      const inv = 1 / count;
      const avg = new Vec3(sx * inv, sy * inv, sz * inv);
      const len = avg.len();
      if (len < 1e-9) { field.set(face.id, Vec3.zero()); continue; }
      // Project the averaged direction onto the face plane and normalize.
      const fn = face.normal ?? avg; // computeFaceNormals() ran inside taubin()
      let planar = avg.sub(fn.mul(avg.dot(fn) / Math.max(fn.lenSq(), 1e-12)));
      const pLen = planar.len();
      if (pLen < 1e-9) { field.set(face.id, Vec3.zero()); continue; }
      planar = planar.div(pLen).mul(magSum * inv);
      field.set(face.id, planar);
    }
    return field;
  },

  /**
   * Make the principal direction field sign-consistent across the mesh by greedy
   * BFS. For each visited vertex, flip both `dirMax` and `dirMin` if their dot
   * with the corresponding direction of an already-visited neighbor is negative.
   *
   * Not globally optimal — seams will appear near umbilic / singular points.
   * Mutates `curvatures` in place.
   */
  combDirections(mesh: ConnectedMesh, curvatures: Map<number, VertexCurvature>): void {
    const visited = new Set<number>();
    const queue: number[] = [];

    for (const node of mesh.nodes()) {
      if (visited.has(node.id)) continue;
      const c0 = curvatures.get(node.id);
      if (!c0) continue;

      visited.add(node.id);
      queue.push(node.id);

      while (queue.length > 0) {
        const id = queue.shift()!;
        const cur = curvatures.get(id);
        if (!cur) continue;

        for (const nid of mesh.nodeNeighbors(id)) {
          if (visited.has(nid)) continue;
          const nc = curvatures.get(nid);
          if (!nc) continue;
          visited.add(nid);

          if (nc.dirMax.dot(cur.dirMax) < 0) {
            nc.dirMax = nc.dirMax.neg();
          }
          if (nc.dirMin.dot(cur.dirMin) < 0) {
            nc.dirMin = nc.dirMin.neg();
          }
          queue.push(nid);
        }
      }
    }
  },
};
