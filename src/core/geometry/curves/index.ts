/**
 * Tekto Curves — Parametric curve types.
 *
 * Mirrors HDGEO.Core.Curves.
 */

import { Vec2, Vec3 } from "../../math/vectors";
import { HMath } from "../../math/HMath";

// ─── Interfaces ──────────────────────────────

/** Parametric curve where t is normalized [0..1]. */
export interface ICurve {
  getPoint(t: number): Vec3;
  getTangent(t: number): Vec3;
}

/** Curve that supports distance-based queries (arc length). */
export interface IMetricCurve extends ICurve {
  readonly length: number;
  getTFromDistance(distance: number): number;
  getPointAtDistance(distance: number): Vec3;
}

// ─── Arc Length Cache ────────────────────────

/**
 * Shared arc-length lookup table for curves that need sampled distance→t mapping.
 * Used by CubicBezierCurve and NurbsCurve.
 */
export class ArcLengthCache {
  private table: number[] = [];
  private _totalLength = 0;
  private steps: number;

  get totalLength(): number { return this._totalLength; }

  constructor(precisionSteps = 50) {
    this.steps = precisionSteps;
  }

  rebuild(getPoint: (t: number) => Vec3): void {
    this.table = [0];
    let currentLen = 0;
    let prevPos = getPoint(0);
    const step = 1 / this.steps;

    for (let i = 1; i <= this.steps; i++) {
      const t = i * step;
      const currentPos = getPoint(t);
      currentLen += prevPos.distTo(currentPos);
      this.table.push(currentLen);
      prevPos = currentPos;
    }
    this._totalLength = currentLen;
  }

  getTFromDistance(distance: number): number {
    if (distance <= 0) return 0;
    if (distance >= this._totalLength) return 1;

    // Binary search
    let lo = 0, hi = this.table.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.table[mid] < distance) lo = mid;
      else hi = mid;
    }

    const lenPrev = this.table[lo];
    const lenNext = this.table[hi];
    const ratio = (distance - lenPrev) / (lenNext - lenPrev);
    const stepSize = 1 / this.steps;
    return lo * stepSize + ratio * stepSize;
  }
}

// ─── LineCurve ───────────────────────────────

export class LineCurve implements IMetricCurve {
  constructor(public start: Vec3, public end: Vec3) {}

  get length(): number { return this.start.distTo(this.end); }

  getTFromDistance(distance: number): number {
    const len = this.length;
    if (len <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / len, 0, 1);
  }

  getPoint(t: number): Vec3 {
    return this.start.lerp(this.end, HMath.clamp(t, 0, 1));
  }

  getTangent(_t: number): Vec3 {
    return this.end.sub(this.start).normalize();
  }

  getPointAtDistance(distance: number): Vec3 {
    return this.getPoint(this.getTFromDistance(distance));
  }
}

// ─── ArcCurve ────────────────────────────────

export class ArcCurve implements IMetricCurve {
  public forward: Vec3;

  constructor(
    public center: Vec3,
    public radius: number,
    public startAngle: number,
    public sweepAngle: number,
    public normal: Vec3
  ) {
    this.normal = normal.normalize();
    let fwd = this.normal.cross(Vec3.unitY());
    if (fwd.lenSq() < 0.001) fwd = this.normal.cross(Vec3.unitX());
    this.forward = fwd.normalize();
  }

  get length(): number { return Math.abs(this.radius * this.sweepAngle); }

  getTFromDistance(distance: number): number {
    return HMath.clamp(distance / this.length, 0, 1);
  }

  getPoint(t: number): Vec3 {
    const angle = this.startAngle + this.sweepAngle * t;
    const c = Math.cos(angle), s = Math.sin(angle);
    // Rodrigues rotation of forward around normal by angle
    const k = this.normal;
    const v = this.forward;
    const rotated = v.mul(c)
      .add(k.cross(v).mul(s))
      .add(k.mul(k.dot(v) * (1 - c)));
    return this.center.add(rotated.mul(this.radius));
  }

  getTangent(t: number): Vec3 {
    const angle = this.startAngle + this.sweepAngle * t;
    const c = Math.cos(angle), s = Math.sin(angle);
    const k = this.normal;
    const v = this.forward;
    const direction = v.mul(c)
      .add(k.cross(v).mul(s))
      .add(k.mul(k.dot(v) * (1 - c)));
    const tangent = k.cross(direction);
    return this.sweepAngle >= 0 ? tangent : tangent.neg();
  }

  getPointAtDistance(distance: number): Vec3 {
    return this.getPoint(this.getTFromDistance(distance));
  }
}

// ─── HelixCurve ───────────────────────────────

/**
 * Helical curve in the XY plane with Z height.
 * Generalizes a circular arc (when startZ === endZ) to a helix
 * with linear Z interpolation along the sweep.
 */
export class HelixCurve implements IMetricCurve {
  constructor(
    public center: Vec3,
    public radius: number,
    public startAngle: number,
    public sweepAngle: number,
    public startZ: number,
    public endZ: number,
  ) {}

  get length(): number {
    const absSweep = Math.abs(this.sweepAngle);
    if (absSweep < HMath.EPSILON) return Math.abs(this.endZ - this.startZ);
    const dz = this.endZ - this.startZ;
    const pitchPerRad = dz / this.sweepAngle;
    return absSweep * Math.sqrt(this.radius * this.radius + pitchPerRad * pitchPerRad);
  }

  getTFromDistance(distance: number): number {
    const len = this.length;
    if (len <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / len, 0, 1);
  }

  getPoint(t: number): Vec3 {
    const a = this.startAngle + this.sweepAngle * t;
    const z = this.startZ + (this.endZ - this.startZ) * t;
    return new Vec3(
      this.center.x + this.radius * Math.cos(a),
      this.center.y + this.radius * Math.sin(a),
      z,
    );
  }

  getTangent(t: number): Vec3 {
    const a = this.startAngle + this.sweepAngle * t;
    const dz = this.endZ - this.startZ;
    return new Vec3(
      -this.radius * Math.sin(a) * this.sweepAngle,
      this.radius * Math.cos(a) * this.sweepAngle,
      dz,
    ).normalize();
  }

  getPointAtDistance(distance: number): Vec3 {
    return this.getPoint(this.getTFromDistance(distance));
  }
}

// ─── CubicBezierCurve ────────────────────────

export class CubicBezierCurve implements IMetricCurve {
  private cache = new ArcLengthCache(50);

  constructor(
    public p0: Vec3,
    public p1: Vec3,
    public p2: Vec3,
    public p3: Vec3
  ) {
    this.cache.rebuild(t => this.getPoint(t));
  }

  updateControlPoints(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): void {
    this.p0 = p0; this.p1 = p1; this.p2 = p2; this.p3 = p3;
    this.cache.rebuild(t => this.getPoint(t));
  }

  getPoint(t: number): Vec3 {
    t = HMath.clamp(t, 0, 1);
    const u = 1 - t;
    const tt = t * t, uu = u * u;
    const uuu = uu * u, ttt = tt * t;
    return this.p0.mul(uuu)
      .add(this.p1.mul(3 * uu * t))
      .add(this.p2.mul(3 * u * tt))
      .add(this.p3.mul(ttt));
  }

  getTangent(t: number): Vec3 {
    t = HMath.clamp(t, 0, 1);
    const u = 1 - t;
    const uu = u * u, tt = t * t;
    return this.p1.sub(this.p0).mul(3 * uu)
      .add(this.p2.sub(this.p1).mul(6 * u * t))
      .add(this.p3.sub(this.p2).mul(3 * tt))
      .normalize();
  }

  get length(): number { return this.cache.totalLength; }
  getTFromDistance(distance: number): number { return this.cache.getTFromDistance(distance); }
  getPointAtDistance(distance: number): Vec3 { return this.getPoint(this.getTFromDistance(distance)); }
}

// ─── NurbsCurve ──────────────────────────────

export class NurbsCurve implements IMetricCurve {
  private cache = new ArcLengthCache(100);

  constructor(
    public controlPoints: Vec3[],
    public degree: number,
    public knots: number[],
    public weights?: number[]
  ) {
    this.cache.rebuild(t => this.getPoint(t));
  }

  getPoint(t: number): Vec3 {
    const uMin = this.knots[this.degree];
    const uMax = this.knots[this.knots.length - this.degree - 1];
    const u = uMin + (uMax - uMin) * HMath.clamp(t, 0, 1);
    return this.evaluateDeBoor(u);
  }

  getTangent(t: number): Vec3 {
    const eps = 0.001;
    const t0 = HMath.clamp(t - eps, 0, 1);
    const t1 = HMath.clamp(t + eps, 0, 1);
    return this.getPoint(t1).sub(this.getPoint(t0)).normalize();
  }

  get length(): number { return this.cache.totalLength; }
  getTFromDistance(distance: number): number { return this.cache.getTFromDistance(distance); }
  getPointAtDistance(distance: number): Vec3 { return this.getPoint(this.getTFromDistance(distance)); }

  private evaluateDeBoor(u: number): Vec3 {
    const k = this.findKnotSpan(u);
    const d: Vec3[] = [];
    for (let j = 0; j <= this.degree; j++) {
      d[j] = this.controlPoints[k - this.degree + j];
    }

    for (let r = 1; r <= this.degree; r++) {
      for (let j = this.degree; j >= r; j--) {
        const denom = this.knots[k + 1 + j - r] - this.knots[k - this.degree + j];
        const alpha = (u - this.knots[k - this.degree + j]) / denom;
        d[j] = d[j - 1].mul(1 - alpha).add(d[j].mul(alpha));
      }
    }
    return d[this.degree];
  }

  private findKnotSpan(u: number): number {
    const n = this.controlPoints.length - 1;
    if (Math.abs(u - this.knots[n + 1]) < 0.0001) return n;

    let low = this.degree, high = n + 1;
    let mid = (low + high) >> 1;

    while (u < this.knots[mid] || u >= this.knots[mid + 1]) {
      if (u < this.knots[mid]) high = mid;
      else low = mid;
      mid = (low + high) >> 1;
    }
    return mid;
  }
}

// ─── PolylineCurve ───────────────────────────

export class PolylineCurve implements IMetricCurve {
  private points: Vec3[];
  private accumulatedLengths: number[];
  private _totalLength: number;

  constructor(points: Vec3[]) {
    if (points.length < 2) throw new Error("Polyline must have at least 2 points.");
    this.points = [...points];
    this.accumulatedLengths = [0];
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
      sum += points[i].distTo(points[i + 1]);
      this.accumulatedLengths.push(sum);
    }
    this._totalLength = sum;
  }

  get length(): number { return this._totalLength; }

  getTFromDistance(distance: number): number {
    if (this._totalLength <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / this._totalLength, 0, 1);
  }

  getPoint(t: number): Vec3 {
    const targetDist = HMath.clamp(t, 0, 1) * this._totalLength;

    // Binary search for segment
    let lo = 0, hi = this.accumulatedLengths.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.accumulatedLengths[mid] < targetDist) lo = mid;
      else hi = mid;
    }

    if (hi >= this.points.length) return this.points[this.points.length - 1];
    if (lo < 0) return this.points[0];

    const distStart = this.accumulatedLengths[lo];
    const distEnd = this.accumulatedLengths[hi];
    const segLen = distEnd - distStart;
    if (segLen < HMath.EPSILON) return this.points[lo];

    const alpha = (targetDist - distStart) / segLen;
    return this.points[lo].lerp(this.points[hi], alpha);
  }

  getTangent(t: number): Vec3 {
    const targetDist = HMath.clamp(t, 0, 1) * this._totalLength;
    let lo = 0, hi = this.accumulatedLengths.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.accumulatedLengths[mid] < targetDist) lo = mid;
      else hi = mid;
    }
    const segIdx = Math.min(lo, this.points.length - 2);
    return this.points[segIdx + 1].sub(this.points[segIdx]).normalize();
  }

  getPointAtDistance(distance: number): Vec3 {
    return this.getPoint(this.getTFromDistance(distance));
  }
}

// ─── Curve Utilities ─────────────────────────

export const CurveUtils = {
  /** Returns exactly 'count' points distributed along the curve. */
  divideByCount(curve: ICurve, count: number): Vec3[] {
    if (count < 2) count = 2;
    const points: Vec3[] = [];

    if ("length" in curve && typeof (curve as IMetricCurve).getTFromDistance === "function") {
      const mc = curve as IMetricCurve;
      const stepDist = mc.length / (count - 1);
      for (let i = 0; i < count; i++) {
        if (i === 0) points.push(curve.getPoint(0));
        else if (i === count - 1) points.push(curve.getPoint(1));
        else points.push(mc.getPointAtDistance(i * stepDist));
      }
    } else {
      const stepT = 1 / (count - 1);
      for (let i = 0; i < count; i++) {
        points.push(curve.getPoint(i * stepT));
      }
    }
    return points;
  },

  /** Steps along the curve by exactly 'segmentLength'. */
  divideByFixedLength(curve: IMetricCurve, segmentLength: number): Vec3[] {
    if (segmentLength <= 0.0001) return [curve.getPoint(0), curve.getPoint(1)];
    const totalLength = curve.length;
    const points: Vec3[] = [];

    let d = 0;
    while (d <= totalLength) {
      points.push(curve.getPointAtDistance(d));
      d += segmentLength;
    }

    const endPt = curve.getPoint(1);
    if (points[points.length - 1].distTo(endPt) > 0.001) {
      points.push(endPt);
    }
    return points;
  },

  /** Divides curve with segments roughly equal to targetLength (all equal). */
  divideByTargetLength(curve: IMetricCurve, targetLength: number): Vec3[] {
    const totalLength = curve.length;
    if (totalLength <= targetLength) return [curve.getPoint(0), curve.getPoint(1)];
    const segments = Math.max(1, Math.round(totalLength / targetLength));
    return CurveUtils.divideByCount(curve, segments + 1);
  },

  /** Evaluate one component of a cubic Bezier at parameter t. */
  cubicEval(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  },

  /** Extract sub-curve [tStart, tEnd] from a cubic Bezier via De Casteljau. */
  splitCubic(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, tStart: number, tEnd: number): CubicBezierCurve {
    function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
      return new Vec3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    }
    function splitAt(q0: Vec3, q1: Vec3, q2: Vec3, q3: Vec3, t: number): { left: Vec3[]; right: Vec3[] } {
      const a = lerp3(q0, q1, t), b = lerp3(q1, q2, t), c = lerp3(q2, q3, t);
      const d = lerp3(a, b, t), e = lerp3(b, c, t);
      const f = lerp3(d, e, t);
      return { left: [q0, a, d, f], right: [f, e, c, q3] };
    }
    if (tStart <= 0 && tEnd >= 1) return new CubicBezierCurve(p0, p1, p2, p3);
    const { left } = splitAt(p0, p1, p2, p3, tEnd);
    const [a, b, c, d_] = left;
    const tMapped = tEnd > 1e-12 ? tStart / tEnd : 0;
    const { right } = splitAt(a, b, c, d_, tMapped);
    const [ra, rb, rc, rd] = right;
    return new CubicBezierCurve(ra, rb, rc, rd);
  },

  /** Binary search for parameter t where curve.getPoint(t)[component] ~ target. Assumes monotonic. */
  findTForComponent(
    curve: { getPoint(t: number): Vec3 },
    target: number,
    component: 'x' | 'y' | 'z',
    iterations = 40,
  ): number {
    let lo = 0, hi = 1;
    for (let i = 0; i < iterations; i++) {
      const mid = (lo + hi) / 2;
      if (curve.getPoint(mid)[component] < target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  },

  /** Unroll a 3D polyline into a flat elevation profile: X = cumulative XY arc length, Z = original height. */
  unrollPolyline(pts: Vec3[], yOffset = 0): Vec3[] {
    const out: Vec3[] = [];
    let cumD = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
        cumD += Math.sqrt(dx * dx + dy * dy);
      }
      out.push(new Vec3(cumD, yOffset, pts[i].z));
    }
    return out;
  },

  /** Find the unrolled X position for a 3D point projected onto a polyline's XY footprint. */
  findUnrollX(polyline: Vec3[], pt: Vec3): number {
    let bestDist = Infinity, bestCum = 0, cumDist = 0;
    for (let i = 1; i < polyline.length; i++) {
      const a = polyline[i - 1], b = polyline[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const px = pt.x - a.x, py = pt.y - a.y;
      let t = segLen > 0 ? (px * dx + py * dy) / (segLen * segLen) : 0;
      t = Math.max(0, Math.min(1, t));
      const cx = a.x + dx * t, cy = a.y + dy * t;
      const d = Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2);
      if (d < bestDist) { bestDist = d; bestCum = cumDist + segLen * t; }
      cumDist += segLen;
    }
    return bestCum;
  },

  /**
   * Compute rotation-minimizing (parallel transport) frames along a polyline path.
   * Returns one frame per path point: tangent T, normal U, binormal V (all unit vectors).
   */
  parallelTransportFrames(path: Vec3[]): { tangent: Vec3; normal: Vec3; binormal: Vec3 }[] {
    if (path.length < 2) return [];

    const frames: { tangent: Vec3; normal: Vec3; binormal: Vec3 }[] = [];

    // Compute tangent for first point
    let T = path[1].sub(path[0]).normalize();

    // Seed initial normal: perpendicular to tangent
    let U = T.cross(Vec3.unitZ());
    if (U.lenSq() < 0.001) U = T.cross(Vec3.unitX());
    U = U.normalize();
    let V = T.cross(U).normalize();

    frames.push({ tangent: T, normal: U, binormal: V });

    for (let i = 1; i < path.length; i++) {
      // Compute new tangent
      if (i < path.length - 1) {
        T = path[i + 1].sub(path[i - 1]).normalize();
      } else {
        T = path[i].sub(path[i - 1]).normalize();
      }

      // Project previous normal onto the perpendicular plane of new tangent
      U = U.sub(T.mul(T.dot(U))).normalize();
      if (U.lenSq() < 1e-12) {
        // Fallback if degenerate
        U = T.cross(Vec3.unitZ());
        if (U.lenSq() < 0.001) U = T.cross(Vec3.unitX());
        U = U.normalize();
      }
      V = T.cross(U).normalize();

      frames.push({ tangent: T, normal: U, binormal: V });
    }

    return frames;
  },

  /**
   * Constructs a circular arc starting at p1 with the given tangent direction,
   * ending at p2. The arc lies in the XY plane (Z = 0).
   *
   * Finds the center at the intersection of:
   *  - the perpendicular to the tangent at p1
   *  - the perpendicular bisector of chord p1→p2
   */
  arcFromPointTangentPoint(p1: Vec2, tangent: Vec2, p2: Vec2): ArcCurve {
    const perpX = -tangent.y, perpY = tangent.x;
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const chordDx = p2.x - p1.x, chordDy = p2.y - p1.y;
    const pbDx = -chordDy, pbDy = chordDx;

    const det = perpX * pbDy - perpY * pbDx;
    if (Math.abs(det) < 1e-12) {
      // Degenerate: tangent parallel to chord — return a straight line as arc
      return new ArcCurve(
        new Vec3(mx, my, 0), 1e6, 0, 0, Vec3.unitZ(),
      );
    }

    const t = ((mx - p1.x) * pbDy - (my - p1.y) * pbDx) / det;
    const cx = p1.x + t * perpX;
    const cy = p1.y + t * perpY;
    const radius = Math.hypot(cx - p1.x, cy - p1.y);

    const startAngle = Math.atan2(p1.y - cy, p1.x - cx);
    let endAngle = Math.atan2(p2.y - cy, p2.x - cx);

    // Determine CW vs CCW from tangent alignment
    const radDx = p1.x - cx, radDy = p1.y - cy;
    const ccwDot = tangent.x * (-radDy) + tangent.y * radDx;
    let ccwSweep = endAngle - startAngle;
    if (ccwSweep < 0) ccwSweep += Math.PI * 2;

    const sweepAngle = ccwDot > 0
      ? ccwSweep
      : -(Math.PI * 2 - ccwSweep);

    return new ArcCurve(
      new Vec3(cx, cy, 0), radius, startAngle, sweepAngle, Vec3.unitZ(),
    );
  },
};
