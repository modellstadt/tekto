/**
 * Tekto Surfaces — Parametric NURBS surface (tensor-product rational B-spline).
 *
 * Companion to NurbsCurve. A NurbsSurface is defined by a 2D control grid
 * controlPoints[uIdx][vIdx] together with degrees (degreeU, degreeV),
 * knot vectors (knotsU, knotsV), and optional weights (same shape as the grid).
 *
 * Evaluation uses rational De Boor in homogeneous form so revolved surfaces
 * (which need weight = 1/√2 at corner control points) are geometrically exact.
 */

import { Vec3 } from "../../math/vectors";
import { HMath } from "../../math/HMath";
import { NurbsCurve } from "../curves";
import { ConnectedMesh } from "../mesh/ConnectedMesh";

// ─── Helpers ─────────────────────────────────

function findKnotSpan(u: number, degree: number, knots: number[], numCtrl: number): number {
  const n = numCtrl - 1;
  if (u >= knots[n + 1]) return n;
  if (u <= knots[degree]) return degree;

  let low = degree, high = n + 1;
  let mid = (low + high) >> 1;
  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid;
    else low = mid;
    mid = (low + high) >> 1;
  }
  return mid;
}

/**
 * De Boor evaluation in 4D homogeneous space.
 * Inputs: weighted positions (Pw = P*w) and weights w.
 * Output: weighted position and weight at parameter u — caller divides Pw/w to project to 3D.
 */
function deBoor4D(
  pw: Vec3[],
  w: number[],
  degree: number,
  knots: number[],
  u: number,
): { pw: Vec3; w: number } {
  const k = findKnotSpan(u, degree, knots, pw.length);
  const dPw: Vec3[] = new Array(degree + 1);
  const dW: number[] = new Array(degree + 1);
  for (let j = 0; j <= degree; j++) {
    const idx = k - degree + j;
    dPw[j] = pw[idx];
    dW[j] = w[idx];
  }
  for (let r = 1; r <= degree; r++) {
    for (let j = degree; j >= r; j--) {
      const denom = knots[k + 1 + j - r] - knots[k - degree + j];
      const alpha = denom > 0 ? (u - knots[k - degree + j]) / denom : 0;
      dPw[j] = dPw[j - 1].mul(1 - alpha).add(dPw[j].mul(alpha));
      dW[j] = dW[j - 1] * (1 - alpha) + dW[j] * alpha;
    }
  }
  return { pw: dPw[degree], w: dW[degree] };
}

/** Build a clamped uniform knot vector with `numCtrl` control points and given degree. */
export function clampedUniformKnots(numCtrl: number, degree: number): number[] {
  if (numCtrl <= degree) {
    throw new Error(`Need at least degree+1 control points (got ${numCtrl}, degree ${degree})`);
  }
  const knots: number[] = [];
  for (let i = 0; i <= degree; i++) knots.push(0);
  const interior = numCtrl - degree - 1;
  for (let i = 1; i <= interior; i++) knots.push(i / (interior + 1));
  for (let i = 0; i <= degree; i++) knots.push(1);
  return knots;
}

// ─── NurbsSurface ────────────────────────────

export class NurbsSurface {
  /**
   * @param controlPoints  controlPoints[uIdx][vIdx], size (nU+1) × (nV+1)
   * @param degreeU        degree in the u-direction
   * @param degreeV        degree in the v-direction
   * @param knotsU         length must equal controlPoints.length + degreeU + 1
   * @param knotsV         length must equal controlPoints[0].length + degreeV + 1
   * @param weights        optional, same shape as controlPoints (defaults to all 1)
   */
  constructor(
    public controlPoints: Vec3[][],
    public degreeU: number,
    public degreeV: number,
    public knotsU: number[],
    public knotsV: number[],
    public weights?: number[][],
  ) {
    const nU = controlPoints.length;
    const nV = controlPoints[0]?.length ?? 0;
    if (knotsU.length !== nU + degreeU + 1) {
      throw new Error(`knotsU length ${knotsU.length} != ${nU} + ${degreeU} + 1`);
    }
    if (knotsV.length !== nV + degreeV + 1) {
      throw new Error(`knotsV length ${knotsV.length} != ${nV} + ${degreeV} + 1`);
    }
  }

  /** Evaluate the surface at (u, v), both normalized to [0, 1]. */
  getPoint(u: number, v: number): Vec3 {
    const uMin = this.knotsU[this.degreeU];
    const uMax = this.knotsU[this.knotsU.length - this.degreeU - 1];
    const vMin = this.knotsV[this.degreeV];
    const vMax = this.knotsV[this.knotsV.length - this.degreeV - 1];
    const uu = uMin + (uMax - uMin) * HMath.clamp(u, 0, 1);
    const vv = vMin + (vMax - vMin) * HMath.clamp(v, 0, 1);
    return this.evaluate(uu, vv);
  }

  /** Outward normal at (u, v) via finite differences in parameter space. */
  getNormal(u: number, v: number): Vec3 {
    const eps = 1e-3;
    const u1 = u + eps > 1 ? u - eps : u + eps;
    const v1 = v + eps > 1 ? v - eps : v + eps;
    const signU = u + eps > 1 ? -1 : 1;
    const signV = v + eps > 1 ? -1 : 1;
    const p = this.getPoint(u, v);
    const du = this.getPoint(u1, v).sub(p).mul(signU);
    const dv = this.getPoint(u, v1).sub(p).mul(signV);
    return du.cross(dv).normalize();
  }

  /**
   * Tessellate the surface into a ConnectedMesh by sampling on a (uDivs × vDivs) grid.
   * `closedU` / `closedV` merge the seam (use closedU=true for surfaces from `revolve`).
   */
  toMesh(uDivs = 32, vDivs = 32, closedU = false, closedV = false): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const uSteps = closedU ? uDivs : uDivs + 1;
    const vSteps = closedV ? vDivs : vDivs + 1;
    const ids: number[][] = [];

    for (let i = 0; i < uSteps; i++) {
      ids[i] = [];
      const u = i / uDivs;
      for (let j = 0; j < vSteps; j++) {
        const v = j / vDivs;
        ids[i][j] = mesh.addNode(this.getPoint(u, v));
      }
    }

    for (let i = 0; i < uDivs; i++) {
      for (let j = 0; j < vDivs; j++) {
        const ni = closedU ? (i + 1) % uSteps : i + 1;
        const nj = closedV ? (j + 1) % vSteps : j + 1;
        mesh.addQuad(ids[i][j], ids[ni][j], ids[ni][nj], ids[i][nj]);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  }

  // ── Static constructors ──

  /**
   * Skinned NURBS surface through a set of compatible cross-section curves.
   *
   * All input curves must share the same degree, knot vector, and number of
   * control points. The curves become rows of the surface control net in the
   * u-direction; v-direction inherits from the curves. The resulting surface
   * passes exactly through the first and last curve (clamped knot ends).
   *
   * @param curves      ≥ 2 compatible NurbsCurves
   * @param degreeU     desired u-direction degree (clamped to curves.length - 1)
   */
  static loft(curves: NurbsCurve[], degreeU = 3): NurbsSurface {
    if (curves.length < 2) throw new Error("loft requires at least 2 curves");

    const degreeV = curves[0].degree;
    const knotsV = curves[0].knots.slice();
    const nV = curves[0].controlPoints.length;

    for (let i = 1; i < curves.length; i++) {
      if (curves[i].degree !== degreeV) {
        throw new Error(`loft: curve ${i} has degree ${curves[i].degree}, expected ${degreeV}`);
      }
      if (curves[i].controlPoints.length !== nV) {
        throw new Error(`loft: curve ${i} has ${curves[i].controlPoints.length} control points, expected ${nV}`);
      }
      if (curves[i].knots.length !== knotsV.length) {
        throw new Error(`loft: curve ${i} has incompatible knot vector`);
      }
    }

    const grid: Vec3[][] = curves.map(c => c.controlPoints.map(p => new Vec3(p.x, p.y, p.z)));
    const weights: number[][] = curves.map(c =>
      c.weights ? c.weights.slice() : new Array(nV).fill(1),
    );

    const nU = curves.length;
    const actualDegreeU = Math.max(1, Math.min(degreeU, nU - 1));
    const knotsU = clampedUniformKnots(nU, actualDegreeU);

    return new NurbsSurface(grid, actualDegreeU, degreeV, knotsU, knotsV, weights);
  }

  /**
   * Revolve a NURBS profile curve around an axis to produce a NURBS surface of revolution.
   *
   * Uses the standard 9-control-point / 4-arc rational quadratic encoding of a
   * full circle (degree 2 in the u-direction, weights alternating 1 and 1/√2),
   * so the result is geometrically exact.
   *
   * @param profile      profile curve. Treated as the v-direction of the output.
   * @param axisOrigin   a point on the axis. Default origin.
   * @param axisDir      axis direction (need not be unit). Default world Y.
   */
  static revolve(
    profile: NurbsCurve,
    axisOrigin: Vec3 = new Vec3(0, 0, 0),
    axisDir: Vec3 = new Vec3(0, 1, 0),
  ): NurbsSurface {
    const A = axisDir.normalize();

    // Build a stable orthonormal frame { xRef, yRef, A } perpendicular to the axis.
    let xRef = Math.abs(A.dot(new Vec3(1, 0, 0))) < 0.9 ? new Vec3(1, 0, 0) : new Vec3(0, 0, 1);
    xRef = xRef.sub(A.mul(A.dot(xRef))).normalize();
    const yRef = A.cross(xRef).normalize();

    const SQRT1_2 = Math.SQRT1_2;
    // Distance multiplier for each of the 9 circle control points.
    // Even-index points sit on the circle (r); odd-index "corner" points sit at r/cos(45°) = r·√2.
    const distMul = [1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1];
    const weightMul = [1, SQRT1_2, 1, SQRT1_2, 1, SQRT1_2, 1, SQRT1_2, 1];

    const nV = profile.controlPoints.length;
    const grid: Vec3[][] = [];
    const weights: number[][] = [];

    for (let i = 0; i < 9; i++) {
      grid[i] = [];
      weights[i] = [];
      const angle = i * Math.PI / 4;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);

      for (let j = 0; j < nV; j++) {
        const P = profile.controlPoints[j];
        const rel = P.sub(axisOrigin);
        const h = rel.dot(A);
        const radialVec = rel.sub(A.mul(h));
        const radius = radialVec.len();

        // Local radial frame for this profile point (so the swept circle is centered on the axis
        // and starts at the profile point itself, regardless of how the profile is oriented).
        let radialDir: Vec3;
        let perpRadialDir: Vec3;
        if (radius > 1e-10) {
          radialDir = radialVec.div(radius);
          perpRadialDir = A.cross(radialDir);
        } else {
          radialDir = xRef;
          perpRadialDir = yRef;
        }

        const offset = radialDir.mul(ca).add(perpRadialDir.mul(sa)).mul(radius * distMul[i]);
        const pos = axisOrigin.add(A.mul(h)).add(offset);

        const profW = profile.weights ? profile.weights[j] : 1;
        grid[i][j] = pos;
        weights[i][j] = weightMul[i] * profW;
      }
    }

    // 9 control points, degree 2, 4 quadratic Bezier arcs spliced together.
    // Standard knot vector for 4 arcs: [0,0,0, 1,1, 2,2, 3,3, 4,4,4]  (length 12 = 9 + 2 + 1).
    const knotsU = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4];

    return new NurbsSurface(grid, 2, profile.degree, knotsU, profile.knots.slice(), weights);
  }

  // ── Internal ──

  private evaluate(u: number, v: number): Vec3 {
    const nU = this.controlPoints.length;
    const rowPw: Vec3[] = new Array(nU);
    const rowW: number[] = new Array(nU);

    // Step 1: collapse each row down the v-direction in homogeneous coords.
    for (let i = 0; i < nU; i++) {
      const pts = this.controlPoints[i];
      const wts = this.weights ? this.weights[i] : null;
      const nV = pts.length;
      const pw: Vec3[] = new Array(nV);
      const w: number[] = new Array(nV);
      for (let j = 0; j < nV; j++) {
        const wj = wts ? wts[j] : 1;
        pw[j] = pts[j].mul(wj);
        w[j] = wj;
      }
      const r = deBoor4D(pw, w, this.degreeV, this.knotsV, v);
      rowPw[i] = r.pw;
      rowW[i] = r.w;
    }

    // Step 2: collapse the intermediate column along the u-direction.
    const final = deBoor4D(rowPw, rowW, this.degreeU, this.knotsU, u);
    return final.pw.mul(1 / final.w);
  }
}
