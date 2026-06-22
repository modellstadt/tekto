/**
 * Tekto VecMath — Static vector/geometry utility functions.
 *
 * Mirrors HDGEO.Core.VecMath — all bugs fixed, no mutating inputs.
 */

import { Vec2, Vec3, Mat4 } from "./vectors";
import { HMath } from "./HMath";

const EPSILON = HMath.EPSILON;
const TWO_PI = Math.PI * 2;

export const VecMath = {
  // ================================================================
  // INTERPOLATION & POINT CONSTRUCTION
  // ================================================================

  /** Point between a and b at parameter t (0=a, 1=b). */
  pointBetween(a: Vec3, b: Vec3, t: number): Vec3 {
    return a.lerp(b, t);
  },

  /** Point on segment a→b at absolute distance from a. */
  pointBetweenAbsolute(a: Vec3, b: Vec3, distance: number): Vec3 {
    const len = a.distTo(b);
    if (len < EPSILON) return a;
    return a.lerp(b, distance / len);
  },

  /** Generates evenly spaced points along a segment (inclusive of endpoints). */
  pointsBetween(a: Vec3, b: Vec3, segments: number): Vec3[] {
    if (segments < 1) return [a, b];
    const pts: Vec3[] = [];
    for (let i = 0; i <= segments; i++)
      pts.push(a.lerp(b, i / segments));
    return pts;
  },

  /** Generates points along a segment with minimum spacing. */
  pointsAlongSegment(a: Vec3, b: Vec3, spacing: number): Vec3[] {
    const len = a.distTo(b);
    const n = Math.max(1, Math.floor(len / spacing));
    const step = b.sub(a).div(n);
    const pts: Vec3[] = [];
    for (let i = 0; i <= n; i++)
      pts.push(a.add(step.mul(i)));
    return pts;
  },

  // ================================================================
  // POLAR / ANGLE CONSTRUCTION
  // ================================================================

  /** Creates a 2D unit vector from an angle (radians). */
  fromAngle2D(angle: number): Vec2 {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  },

  /** Creates a 3D point from polar coordinates in XY plane. */
  polar(angle: number, length: number): Vec3 {
    return new Vec3(length * Math.cos(angle), length * Math.sin(angle), 0);
  },

  /** Creates a 3D point from polar coordinates in XZ plane with height Y. */
  polarXZ(angle: number, length: number, y = 0): Vec3 {
    return new Vec3(length * Math.cos(angle), y, length * Math.sin(angle));
  },

  /** Creates a point at origin offset by polar (angle, length). */
  polarOffset(origin: Vec2, angle: number, length: number): Vec2 {
    return origin.add(VecMath.fromAngle2D(angle).mul(length));
  },

  // ================================================================
  // ANGLES
  // ================================================================

  /** 2D heading angle of a Vec2 (radians, -PI..PI). */
  angle2D(v: Vec2): number {
    return Math.atan2(v.y, v.x);
  },

  /** 2D heading angle of a Vec3 projected to XY. */
  angle2DFrom3D(v: Vec3): number {
    return Math.atan2(v.y, v.x);
  },

  /** Positive angle (0..2PI) of a 2D vector. */
  anglePositive(v: Vec2): number {
    const a = Math.atan2(v.y, v.x);
    return a < 0 ? a + TWO_PI : a;
  },

  /**
   * Angle between two 3D vectors (radians, 0..PI).
   * Safe: returns 0 for zero-length vectors, clamps dot to avoid NaN.
   */
  angleBetween(a: Vec3, b: Vec3): number {
    const ma = a.len();
    const mb = b.len();
    if (ma < EPSILON || mb < EPSILON) return 0;
    const dot = HMath.clamp(a.dot(b) / (ma * mb), -1, 1);
    return Math.acos(dot);
  },

  /**
   * Signed angle from vector a to vector b around the given axis (radians, -PI..PI).
   */
  angleBetweenSigned(a: Vec3, b: Vec3, axis: Vec3): number {
    const angle = VecMath.angleBetween(a, b);
    const cross = a.cross(b);
    if (cross.dot(axis) < 0) return -angle;
    return angle;
  },

  /** Counter-clockwise angle from direction a to b (radians, 0..2PI). */
  angleBetweenCCW(a: Vec2, b: Vec2): number {
    let angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
    if (angle < 0) angle += TWO_PI;
    return angle;
  },

  /** Angle at vertex P between edges PA and PB (radians, 0..PI). */
  angleAtVertex(p: Vec2, a: Vec2, b: Vec2): number {
    const va = a.sub(p);
    const vb = b.sub(p);
    const dot = va.dot(vb);
    const cross = va.x * vb.y - va.y * vb.x;
    return Math.abs(Math.atan2(cross, dot));
  },

  /** Angle between two line segments sharing a common endpoint (radians). */
  angleBetweenSegments(a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): number {
    return VecMath.angleBetween(a2.sub(a1), b2.sub(b1));
  },

  // ================================================================
  // PERPENDICULAR / ROTATION 2D
  // ================================================================

  /** Rotates a 2D vector 90° counter-clockwise. */
  rotate90(v: Vec2): Vec2 {
    return new Vec2(-v.y, v.x);
  },

  /** Rotates a 2D vector 90° clockwise. */
  rotate90CW(v: Vec2): Vec2 {
    return new Vec2(v.y, -v.x);
  },

  /** Rotates a 2D vector by an angle (radians). */
  rotate2D(v: Vec2, angle: number): Vec2 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(v.x * c - v.y * s, v.x * s + v.y * c);
  },

  // ================================================================
  // DISTANCE UTILITIES
  // ================================================================

  /** Shortest distance from point to infinite line through a and b. */
  distanceToLine(p: Vec3, lineA: Vec3, lineB: Vec3): number {
    const ab = lineB.sub(lineA);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(lineA);
    const t = p.sub(lineA).dot(ab) / abSq;
    return p.distTo(lineA.add(ab.mul(t)));
  },

  /** Shortest distance from point to segment ab. */
  distanceToSegment(p: Vec3, a: Vec3, b: Vec3): number {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distTo(a.add(ab.mul(t)));
  },

  /** Squared distance from point to segment ab (avoids sqrt). */
  distanceToSegmentSq(p: Vec3, a: Vec3, b: Vec3): number {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distSqTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distSqTo(a.add(ab.mul(t)));
  },

  /** 2D distance from point to segment (XY only). */
  distanceToSegment2D(p: Vec2, a: Vec2, b: Vec2): number {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distTo(a.add(ab.mul(t)));
  },

  /** 2D distance from point to infinite line through a and b. */
  distanceToLine2D(p: Vec2, a: Vec2, b: Vec2): number {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = p.sub(a).dot(ab) / abSq;
    return p.distTo(a.add(ab.mul(t)));
  },

  // ================================================================
  // CLOSEST POINT
  // ================================================================

  /** Closest point on infinite line through a and b to point p. */
  closestPointOnLine(p: Vec3, lineA: Vec3, lineB: Vec3): Vec3 {
    const ab = lineB.sub(lineA);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return lineA;
    const t = p.sub(lineA).dot(ab) / abSq;
    return lineA.add(ab.mul(t));
  },

  /**
   * Closest points between two 3D line segments.
   * Returns { c1, c2 } — points on segment 1 and segment 2.
   */
  closestPointsSegmentSegment(
    a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3
  ): { c1: Vec3; c2: Vec3 } {
    const u = a2.sub(a1);
    const v = b2.sub(b1);
    const w = a1.sub(b1);

    const a = u.dot(u);
    const b = u.dot(v);
    const c = v.dot(v);
    const d = u.dot(w);
    const e = v.dot(w);
    const D = a * c - b * b;

    let sN: number, sD = D;
    let tN: number, tD = D;

    if (D < EPSILON) {
      sN = 0; sD = 1; tN = e; tD = c;
    } else {
      sN = b * e - c * d;
      tN = a * e - b * d;
      if (sN < 0) { sN = 0; tN = e; tD = c; }
      else if (sN > sD) { sN = sD; tN = e + b; tD = c; }
    }

    if (tN < 0) {
      tN = 0;
      if (-d < 0) sN = 0;
      else if (-d > a) sN = sD;
      else { sN = -d; sD = a; }
    } else if (tN > tD) {
      tN = tD;
      if (-d + b < 0) sN = 0;
      else if (-d + b > a) sN = sD;
      else { sN = -d + b; sD = a; }
    }

    const sc = Math.abs(sN) < EPSILON ? 0 : sN / sD;
    const tc = Math.abs(tN) < EPSILON ? 0 : tN / tD;

    return {
      c1: a1.add(u.mul(sc)),
      c2: b1.add(v.mul(tc)),
    };
  },

  // ================================================================
  // PROJECTION
  // ================================================================

  /** Projects a vector onto a plane defined by its normal. */
  projectOnPlane(v: Vec3, planeNormal: Vec3): Vec3 {
    return v.sub(planeNormal.mul(v.dot(planeNormal)));
  },

  // ================================================================
  // OFFSET (2D line offset for polygon operations)
  // ================================================================

  /**
   * Offsets a 2D line segment by a perpendicular distance.
   * Positive = left side when walking from p1 to p2.
   */
  offsetSegment2D(p1: Vec2, p2: Vec2, offset: number): { a: Vec2; b: Vec2 } {
    const dir = p2.sub(p1).normalize();
    const perp = new Vec2(-dir.y, dir.x);
    const off = perp.mul(offset);
    return { a: p1.add(off), b: p2.add(off) };
  },

  // ================================================================
  // MATRIX CONSTRUCTION
  // ================================================================

  /**
   * Creates a rotation matrix that rotates direction 'from' to direction 'to'.
   * Both should be unit vectors.
   */
  rotationBetween(from: Vec3, to: Vec3): Mat4 {
    const dot = from.dot(to);
    if (dot > 1 - EPSILON) return Mat4.identity();
    if (dot < -1 + EPSILON) {
      let axis = Vec3.unitX().cross(from);
      if (axis.lenSq() < EPSILON) axis = Vec3.unitY().cross(from);
      axis = axis.normalize();
      const k = axis;
      const m = new Float64Array(16);
      m[0] = 2 * k.x * k.x - 1; m[4] = 2 * k.x * k.y;     m[8]  = 2 * k.x * k.z;     m[12] = 0;
      m[1] = 2 * k.y * k.x;     m[5] = 2 * k.y * k.y - 1;  m[9]  = 2 * k.y * k.z;     m[13] = 0;
      m[2] = 2 * k.z * k.x;     m[6] = 2 * k.z * k.y;      m[10] = 2 * k.z * k.z - 1; m[14] = 0;
      m[3] = 0;                  m[7] = 0;                   m[11] = 0;                  m[15] = 1;
      return new Mat4(m);
    }
    const cross = from.cross(to);
    const angle = Math.acos(HMath.clamp(dot, -1, 1));
    const axis = cross.normalize();
    const co = Math.cos(angle), s = Math.sin(angle), t = 1 - co;
    const { x, y, z } = axis;
    const m = new Float64Array(16);
    m[0] = t * x * x + co;    m[4] = t * x * y - s * z; m[8]  = t * x * z + s * y; m[12] = 0;
    m[1] = t * x * y + s * z; m[5] = t * y * y + co;    m[9]  = t * y * z - s * x; m[13] = 0;
    m[2] = t * x * z - s * y; m[6] = t * y * z + s * x; m[10] = t * z * z + co;    m[14] = 0;
    m[3] = 0;                 m[7] = 0;                  m[11] = 0;                 m[15] = 1;
    return new Mat4(m);
  },

  /**
   * Builds a coordinate frame matrix from an origin, a Z-axis direction (normal),
   * and an approximate X-axis hint.
   */
  frameFromNormal(origin: Vec3, normal: Vec3, xHint?: Vec3): Mat4 {
    const z = normal.normalize();
    const hint = xHint ?? (Math.abs(z.dot(Vec3.unitY())) < 0.99 ? Vec3.unitY() : Vec3.unitX());
    const x = hint.cross(z).normalize();
    const y = z.cross(x);
    const m = new Float64Array(16);
    m[0] = x.x; m[1] = x.y; m[2] = x.z; m[3] = 0;
    m[4] = y.x; m[5] = y.y; m[6] = y.z; m[7] = 0;
    m[8] = z.x; m[9] = z.y; m[10] = z.z; m[11] = 0;
    m[12] = origin.x; m[13] = origin.y; m[14] = origin.z; m[15] = 1;
    return new Mat4(m);
  },

  // ================================================================
  // WINDING & ORIENTATION
  // ================================================================

  /**
   * Returns the signed area of the parallelogram formed by triangle (p0, p1, p2) in 2D.
   * Positive if counter-clockwise, negative if clockwise.
   */
  cross2D(p0: Vec2, p1: Vec2, p2: Vec2): number {
    return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
  },

  /** Returns +1 (CCW/left), -1 (CW/right), or 0 (collinear). */
  orientation(p0: Vec2, p1: Vec2, p2: Vec2): -1 | 0 | 1 {
    const c = VecMath.cross2D(p0, p1, p2);
    if (c > EPSILON) return 1;
    if (c < -EPSILON) return -1;
    return 0;
  },

  /** Tests if four 2D points form a convex quadrilateral. */
  isConvexQuad(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
    const o1 = VecMath.orientation(a, b, c);
    const o2 = VecMath.orientation(b, c, d);
    const o3 = VecMath.orientation(c, d, a);
    const o4 = VecMath.orientation(d, a, b);
    return o1 === o2 && o2 === o3 && o3 === o4 && o1 !== 0;
  },

  /** Tests if a point lies on the line segment ab (2D, within tolerance). */
  isPointOnSegment2D(a: Vec2, b: Vec2, p: Vec2, tolerance = 0.001): boolean {
    return VecMath.distanceToSegment2D(p, a, b) < tolerance;
  },

  // ================================================================
  // TRIANGLE UTILITIES
  // ================================================================

  /** Signed volume of tetrahedron formed by triangle and origin (for mesh volume). */
  triangleSignedVolume(a: Vec3, b: Vec3, c: Vec3): number {
    return a.dot(b.cross(c)) / 6;
  },

  /** 3D triangle area via cross product magnitude. */
  triangleArea(a: Vec3, b: Vec3, c: Vec3): number {
    return b.sub(a).cross(c.sub(a)).len() * 0.5;
  },

  /** 2D triangle area (signed). */
  triangleArea2D(a: Vec2, b: Vec2, c: Vec2): number {
    return VecMath.cross2D(a, b, c) * 0.5;
  },

  /** Normal of a triangle (unit length). */
  triangleNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
    return b.sub(a).cross(c.sub(a)).normalize();
  },

  // ================================================================
  // BISECTOR
  // ================================================================

  /**
   * 2D angular bisector direction at vertex P between edges PA and PB.
   * The returned vector points into the bisector, unit length.
   */
  bisector2D(p: Vec2, a: Vec2, b: Vec2): Vec2 {
    const da = a.sub(p).normalize();
    const db = b.sub(p).normalize();
    const bisect = da.add(db);
    const len = bisect.len();
    if (len < EPSILON) return VecMath.rotate90(da);
    return bisect.div(len);
  },

  // ================================================================
  // ARC UTILITIES
  // ================================================================

  /** Arc length from angle and radius. */
  arcLength(angle: number, radius: number): number {
    return radius * angle;
  },

  /** Arc angle from arc length and radius. */
  arcAngle(length: number, radius: number): number {
    return length / radius;
  },

  // ================================================================
  // 3x3 DETERMINANT
  // ================================================================

  /** Determinant of a 3x3 matrix given by rows. */
  determinant3x3(
    a: number, b: number, c: number,
    d: number, e: number, f: number,
    g: number, h: number, i: number
  ): number {
    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  },

  /** Direction, length, and unit perpendicular of a 2D segment (XY plane). */
  segmentPerpendicular2D(ax: number, ay: number, bx: number, by: number): { dx: number; dy: number; len: number; px: number; py: number } {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < EPSILON) return { dx: 0, dy: 0, len: 0, px: 0, py: 0 };
    return { dx: dx / len, dy: dy / len, len, px: -dy / len, py: dx / len };
  },
};
