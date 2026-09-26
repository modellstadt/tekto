// src/core/math/HMath.ts
var HMath = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,
  EPSILON: 1e-10,
  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  smoothstep(edge0, edge1, x) {
    const t = HMath.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },
  /** Map value from one range to another */
  remap(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
  },
  almostEqual(a, b, eps = 1e-10) {
    return Math.abs(a - b) < eps;
  },
  /** Returns t in [0,1] if angle lies within arc(startAngle, sweepAngle), else null. */
  sweepFraction(angle, startAngle, sweepAngle) {
    if (Math.abs(sweepAngle) < 1e-12) return null;
    let delta = angle - startAngle;
    const TAU = Math.PI * 2;
    if (sweepAngle > 0) {
      delta = (delta % TAU + TAU) % TAU;
    } else {
      delta = -((-delta % TAU + TAU) % TAU);
    }
    const t = delta / sweepAngle;
    return t >= -1e-9 && t <= 1 + 1e-9 ? Math.max(0, Math.min(1, t)) : null;
  },
  /** Solve quadratic Bezier (1-t)²a + 2(1-t)t·b + t²c = target for t ∈ [0,1]. Returns t or null. */
  solveQuadraticBezier(a, b, c, target) {
    const A = a - 2 * b + c;
    const B = 2 * (b - a);
    const C = a - target;
    if (Math.abs(A) < 1e-12) {
      if (Math.abs(B) < 1e-12) return null;
      const t = -C / B;
      return t >= -1e-6 && t <= 1 + 1e-6 ? Math.max(0, Math.min(1, t)) : null;
    }
    const disc = B * B - 4 * A * C;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const t1 = (-B - sq) / (2 * A);
    const t2 = (-B + sq) / (2 * A);
    for (const t of [t1, t2]) {
      if (t >= -1e-6 && t <= 1 + 1e-6) return Math.max(0, Math.min(1, t));
    }
    return null;
  }
};
var MathUtils = HMath;

// src/core/math/vectors.ts
var Vec2 = class _Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  static zero() {
    return new _Vec2(0, 0);
  }
  static one() {
    return new _Vec2(1, 1);
  }
  static unitX() {
    return new _Vec2(1, 0);
  }
  static unitY() {
    return new _Vec2(0, 1);
  }
  static fromAngle(radians) {
    return new _Vec2(Math.cos(radians), Math.sin(radians));
  }
  static fromArray(a) {
    return new _Vec2(a[0] ?? 0, a[1] ?? 0);
  }
  add(v) {
    return new _Vec2(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new _Vec2(this.x - v.x, this.y - v.y);
  }
  mul(s) {
    return new _Vec2(this.x * s, this.y * s);
  }
  div(s) {
    return new _Vec2(this.x / s, this.y / s);
  }
  neg() {
    return new _Vec2(-this.x, -this.y);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  lenSq() {
    return this.x * this.x + this.y * this.y;
  }
  normalize() {
    const l = this.len();
    return l > 1e-12 ? this.div(l) : _Vec2.zero();
  }
  distTo(v) {
    return this.sub(v).len();
  }
  distSqTo(v) {
    return this.sub(v).lenSq();
  }
  lerp(v, t) {
    return new _Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
  }
  angle() {
    return Math.atan2(this.y, this.x);
  }
  angleTo(v) {
    return Math.atan2(this.cross(v), this.dot(v));
  }
  rotate(radians) {
    const c = Math.cos(radians), s = Math.sin(radians);
    return new _Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }
  perp() {
    return new _Vec2(-this.y, this.x);
  }
  almostEqual(v, eps = 1e-10) {
    return Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps;
  }
  toArray() {
    return [this.x, this.y];
  }
  toVec3(z = 0) {
    return new Vec3(this.x, this.y, z);
  }
  toString() {
    return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)})`;
  }
  clone() {
    return new _Vec2(this.x, this.y);
  }
  toJSON() {
    return { x: this.x, y: this.y };
  }
  static fromJSON(j) {
    return new _Vec2(j.x, j.y);
  }
};
var Vec3 = class _Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  static zero() {
    return new _Vec3(0, 0, 0);
  }
  static one() {
    return new _Vec3(1, 1, 1);
  }
  static unitX() {
    return new _Vec3(1, 0, 0);
  }
  static unitY() {
    return new _Vec3(0, 1, 0);
  }
  static unitZ() {
    return new _Vec3(0, 0, 1);
  }
  static fromArray(a) {
    return new _Vec3(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0);
  }
  add(v) {
    return new _Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  sub(v) {
    return new _Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  mul(s) {
    return new _Vec3(this.x * s, this.y * s, this.z * s);
  }
  div(s) {
    return new _Vec3(this.x / s, this.y / s, this.z / s);
  }
  neg() {
    return new _Vec3(-this.x, -this.y, -this.z);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }
  cross(v) {
    return new _Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  lenSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  normalize() {
    const l = this.len();
    return l > 1e-12 ? this.div(l) : _Vec3.zero();
  }
  distTo(v) {
    return this.sub(v).len();
  }
  distSqTo(v) {
    return this.sub(v).lenSq();
  }
  lerp(v, t) {
    return new _Vec3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t
    );
  }
  project(onto) {
    const d = onto.lenSq();
    return d > 1e-12 ? onto.mul(this.dot(onto) / d) : _Vec3.zero();
  }
  reflect(normal) {
    return this.sub(normal.mul(2 * this.dot(normal)));
  }
  almostEqual(v, eps = 1e-10) {
    return Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps && Math.abs(this.z - v.z) < eps;
  }
  toArray() {
    return [this.x, this.y, this.z];
  }
  toVec2() {
    return new Vec2(this.x, this.y);
  }
  xz() {
    return new Vec2(this.x, this.z);
  }
  toString() {
    return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`;
  }
  clone() {
    return new _Vec3(this.x, this.y, this.z);
  }
  toJSON() {
    return { x: this.x, y: this.y, z: this.z };
  }
  static fromJSON(j) {
    return new _Vec3(j.x, j.y, j.z);
  }
};
var Vec4 = class {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }
  toVec3() {
    return new Vec3(this.x, this.y, this.z);
  }
  toArray() {
    return [this.x, this.y, this.z, this.w];
  }
};
var Mat4 = class _Mat4 {
  /** 16 elements in column-major order */
  constructor(m = new Float64Array(16)) {
    this.m = m;
    if (m.length === 0) {
      this.m = _Mat4.identity().m;
    }
  }
  static identity() {
    const m = new Float64Array(16);
    m[0] = 1;
    m[5] = 1;
    m[10] = 1;
    m[15] = 1;
    return new _Mat4(m);
  }
  static translation(x, y, z) {
    const m = _Mat4.identity().m.slice();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return new _Mat4(new Float64Array(m));
  }
  static scaling(x, y, z) {
    const m = new Float64Array(16);
    m[0] = x;
    m[5] = y;
    m[10] = z;
    m[15] = 1;
    return new _Mat4(m);
  }
  static rotationX(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = _Mat4.identity().m.slice();
    m[5] = c;
    m[6] = s;
    m[9] = -s;
    m[10] = c;
    return new _Mat4(new Float64Array(m));
  }
  static rotationY(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = _Mat4.identity().m.slice();
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    return new _Mat4(new Float64Array(m));
  }
  static rotationZ(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = _Mat4.identity().m.slice();
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return new _Mat4(new Float64Array(m));
  }
  static lookAt(eye, target, up) {
    const z = eye.sub(target).normalize();
    const x = up.cross(z).normalize();
    const y = z.cross(x);
    const m = new Float64Array(16);
    m[0] = x.x;
    m[1] = y.x;
    m[2] = z.x;
    m[3] = 0;
    m[4] = x.y;
    m[5] = y.y;
    m[6] = z.y;
    m[7] = 0;
    m[8] = x.z;
    m[9] = y.z;
    m[10] = z.z;
    m[11] = 0;
    m[12] = -x.dot(eye);
    m[13] = -y.dot(eye);
    m[14] = -z.dot(eye);
    m[15] = 1;
    return new _Mat4(m);
  }
  multiply(b) {
    const a = this.m, bm = b.m, r = new Float64Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        r[col * 4 + row] = a[row] * bm[col * 4] + a[4 + row] * bm[col * 4 + 1] + a[8 + row] * bm[col * 4 + 2] + a[12 + row] * bm[col * 4 + 3];
      }
    }
    return new _Mat4(r);
  }
  transformPoint(v) {
    const m = this.m;
    const w = m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15];
    return new Vec3(
      (m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12]) / w,
      (m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13]) / w,
      (m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14]) / w
    );
  }
  transformDirection(v) {
    const m = this.m;
    return new Vec3(
      m[0] * v.x + m[4] * v.y + m[8] * v.z,
      m[1] * v.x + m[5] * v.y + m[9] * v.z,
      m[2] * v.x + m[6] * v.y + m[10] * v.z
    );
  }
  invert() {
    const m = this.m, r = new Float64Array(16);
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7], a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (Math.abs(det) < 1e-12) return _Mat4.identity();
    det = 1 / det;
    r[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    r[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    r[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    r[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    r[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    r[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    r[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    r[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    r[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    r[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    r[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    r[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    r[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    r[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    r[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    r[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return new _Mat4(r);
  }
  toArray() {
    return Array.from(this.m);
  }
};

// src/core/math/VecMath.ts
var EPSILON = HMath.EPSILON;
var TWO_PI = Math.PI * 2;
var VecMath = {
  // ================================================================
  // INTERPOLATION & POINT CONSTRUCTION
  // ================================================================
  /** Point between a and b at parameter t (0=a, 1=b). */
  pointBetween(a, b, t) {
    return a.lerp(b, t);
  },
  /** Point on segment a→b at absolute distance from a. */
  pointBetweenAbsolute(a, b, distance) {
    const len = a.distTo(b);
    if (len < EPSILON) return a;
    return a.lerp(b, distance / len);
  },
  /** Generates evenly spaced points along a segment (inclusive of endpoints). */
  pointsBetween(a, b, segments) {
    if (segments < 1) return [a, b];
    const pts = [];
    for (let i = 0; i <= segments; i++)
      pts.push(a.lerp(b, i / segments));
    return pts;
  },
  /** Generates points along a segment with minimum spacing. */
  pointsAlongSegment(a, b, spacing) {
    const len = a.distTo(b);
    const n = Math.max(1, Math.floor(len / spacing));
    const step = b.sub(a).div(n);
    const pts = [];
    for (let i = 0; i <= n; i++)
      pts.push(a.add(step.mul(i)));
    return pts;
  },
  // ================================================================
  // POLAR / ANGLE CONSTRUCTION
  // ================================================================
  /** Creates a 2D unit vector from an angle (radians). */
  fromAngle2D(angle) {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  },
  /** Creates a 3D point from polar coordinates in XY plane. */
  polar(angle, length) {
    return new Vec3(length * Math.cos(angle), length * Math.sin(angle), 0);
  },
  /** Creates a 3D point from polar coordinates in XZ plane with height Y. */
  polarXZ(angle, length, y = 0) {
    return new Vec3(length * Math.cos(angle), y, length * Math.sin(angle));
  },
  /** Creates a point at origin offset by polar (angle, length). */
  polarOffset(origin, angle, length) {
    return origin.add(VecMath.fromAngle2D(angle).mul(length));
  },
  // ================================================================
  // ANGLES
  // ================================================================
  /** 2D heading angle of a Vec2 (radians, -PI..PI). */
  angle2D(v) {
    return Math.atan2(v.y, v.x);
  },
  /** 2D heading angle of a Vec3 projected to XY. */
  angle2DFrom3D(v) {
    return Math.atan2(v.y, v.x);
  },
  /** Positive angle (0..2PI) of a 2D vector. */
  anglePositive(v) {
    const a = Math.atan2(v.y, v.x);
    return a < 0 ? a + TWO_PI : a;
  },
  /**
   * Angle between two 3D vectors (radians, 0..PI).
   * Safe: returns 0 for zero-length vectors, clamps dot to avoid NaN.
   */
  angleBetween(a, b) {
    const ma = a.len();
    const mb = b.len();
    if (ma < EPSILON || mb < EPSILON) return 0;
    const dot = HMath.clamp(a.dot(b) / (ma * mb), -1, 1);
    return Math.acos(dot);
  },
  /**
   * Signed angle from vector a to vector b around the given axis (radians, -PI..PI).
   */
  angleBetweenSigned(a, b, axis) {
    const angle = VecMath.angleBetween(a, b);
    const cross = a.cross(b);
    if (cross.dot(axis) < 0) return -angle;
    return angle;
  },
  /** Counter-clockwise angle from direction a to b (radians, 0..2PI). */
  angleBetweenCCW(a, b) {
    let angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
    if (angle < 0) angle += TWO_PI;
    return angle;
  },
  /** Angle at vertex P between edges PA and PB (radians, 0..PI). */
  angleAtVertex(p, a, b) {
    const va = a.sub(p);
    const vb = b.sub(p);
    const dot = va.dot(vb);
    const cross = va.x * vb.y - va.y * vb.x;
    return Math.abs(Math.atan2(cross, dot));
  },
  /** Angle between two line segments sharing a common endpoint (radians). */
  angleBetweenSegments(a1, a2, b1, b2) {
    return VecMath.angleBetween(a2.sub(a1), b2.sub(b1));
  },
  // ================================================================
  // PERPENDICULAR / ROTATION 2D
  // ================================================================
  /** Rotates a 2D vector 90° counter-clockwise. */
  rotate90(v) {
    return new Vec2(-v.y, v.x);
  },
  /** Rotates a 2D vector 90° clockwise. */
  rotate90CW(v) {
    return new Vec2(v.y, -v.x);
  },
  /** Rotates a 2D vector by an angle (radians). */
  rotate2D(v, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(v.x * c - v.y * s, v.x * s + v.y * c);
  },
  // ================================================================
  // DISTANCE UTILITIES
  // ================================================================
  /** Shortest distance from point to infinite line through a and b. */
  distanceToLine(p, lineA, lineB) {
    const ab = lineB.sub(lineA);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(lineA);
    const t = p.sub(lineA).dot(ab) / abSq;
    return p.distTo(lineA.add(ab.mul(t)));
  },
  /** Shortest distance from point to segment ab. */
  distanceToSegment(p, a, b) {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distTo(a.add(ab.mul(t)));
  },
  /** Squared distance from point to segment ab (avoids sqrt). */
  distanceToSegmentSq(p, a, b) {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distSqTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distSqTo(a.add(ab.mul(t)));
  },
  /** 2D distance from point to segment (XY only). */
  distanceToSegment2D(p, a, b) {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distTo(a.add(ab.mul(t)));
  },
  /** 2D distance from point to infinite line through a and b. */
  distanceToLine2D(p, a, b) {
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
  closestPointOnLine(p, lineA, lineB) {
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
  closestPointsSegmentSegment(a1, a2, b1, b2) {
    const u = a2.sub(a1);
    const v = b2.sub(b1);
    const w = a1.sub(b1);
    const a = u.dot(u);
    const b = u.dot(v);
    const c = v.dot(v);
    const d = u.dot(w);
    const e = v.dot(w);
    const D = a * c - b * b;
    let sN, sD = D;
    let tN, tD = D;
    if (D < EPSILON) {
      sN = 0;
      sD = 1;
      tN = e;
      tD = c;
    } else {
      sN = b * e - c * d;
      tN = a * e - b * d;
      if (sN < 0) {
        sN = 0;
        tN = e;
        tD = c;
      } else if (sN > sD) {
        sN = sD;
        tN = e + b;
        tD = c;
      }
    }
    if (tN < 0) {
      tN = 0;
      if (-d < 0) sN = 0;
      else if (-d > a) sN = sD;
      else {
        sN = -d;
        sD = a;
      }
    } else if (tN > tD) {
      tN = tD;
      if (-d + b < 0) sN = 0;
      else if (-d + b > a) sN = sD;
      else {
        sN = -d + b;
        sD = a;
      }
    }
    const sc = Math.abs(sN) < EPSILON ? 0 : sN / sD;
    const tc = Math.abs(tN) < EPSILON ? 0 : tN / tD;
    return {
      c1: a1.add(u.mul(sc)),
      c2: b1.add(v.mul(tc))
    };
  },
  // ================================================================
  // PROJECTION
  // ================================================================
  /** Projects a vector onto a plane defined by its normal. */
  projectOnPlane(v, planeNormal) {
    return v.sub(planeNormal.mul(v.dot(planeNormal)));
  },
  // ================================================================
  // OFFSET (2D line offset for polygon operations)
  // ================================================================
  /**
   * Offsets a 2D line segment by a perpendicular distance.
   * Positive = left side when walking from p1 to p2.
   */
  offsetSegment2D(p1, p2, offset) {
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
  rotationBetween(from, to) {
    const dot = from.dot(to);
    if (dot > 1 - EPSILON) return Mat4.identity();
    if (dot < -1 + EPSILON) {
      let axis2 = Vec3.unitX().cross(from);
      if (axis2.lenSq() < EPSILON) axis2 = Vec3.unitY().cross(from);
      axis2 = axis2.normalize();
      const k = axis2;
      const m2 = new Float64Array(16);
      m2[0] = 2 * k.x * k.x - 1;
      m2[4] = 2 * k.x * k.y;
      m2[8] = 2 * k.x * k.z;
      m2[12] = 0;
      m2[1] = 2 * k.y * k.x;
      m2[5] = 2 * k.y * k.y - 1;
      m2[9] = 2 * k.y * k.z;
      m2[13] = 0;
      m2[2] = 2 * k.z * k.x;
      m2[6] = 2 * k.z * k.y;
      m2[10] = 2 * k.z * k.z - 1;
      m2[14] = 0;
      m2[3] = 0;
      m2[7] = 0;
      m2[11] = 0;
      m2[15] = 1;
      return new Mat4(m2);
    }
    const cross = from.cross(to);
    const angle = Math.acos(HMath.clamp(dot, -1, 1));
    const axis = cross.normalize();
    const co = Math.cos(angle), s = Math.sin(angle), t = 1 - co;
    const { x, y, z } = axis;
    const m = new Float64Array(16);
    m[0] = t * x * x + co;
    m[4] = t * x * y - s * z;
    m[8] = t * x * z + s * y;
    m[12] = 0;
    m[1] = t * x * y + s * z;
    m[5] = t * y * y + co;
    m[9] = t * y * z - s * x;
    m[13] = 0;
    m[2] = t * x * z - s * y;
    m[6] = t * y * z + s * x;
    m[10] = t * z * z + co;
    m[14] = 0;
    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;
    return new Mat4(m);
  },
  /**
   * Builds a coordinate frame matrix from an origin, a Z-axis direction (normal),
   * and an approximate X-axis hint.
   */
  frameFromNormal(origin, normal, xHint) {
    const z = normal.normalize();
    const hint = xHint ?? (Math.abs(z.dot(Vec3.unitY())) < 0.99 ? Vec3.unitY() : Vec3.unitX());
    const x = hint.cross(z).normalize();
    const y = z.cross(x);
    const m = new Float64Array(16);
    m[0] = x.x;
    m[1] = x.y;
    m[2] = x.z;
    m[3] = 0;
    m[4] = y.x;
    m[5] = y.y;
    m[6] = y.z;
    m[7] = 0;
    m[8] = z.x;
    m[9] = z.y;
    m[10] = z.z;
    m[11] = 0;
    m[12] = origin.x;
    m[13] = origin.y;
    m[14] = origin.z;
    m[15] = 1;
    return new Mat4(m);
  },
  // ================================================================
  // WINDING & ORIENTATION
  // ================================================================
  /**
   * Returns the signed area of the parallelogram formed by triangle (p0, p1, p2) in 2D.
   * Positive if counter-clockwise, negative if clockwise.
   */
  cross2D(p0, p1, p2) {
    return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
  },
  /** Returns +1 (CCW/left), -1 (CW/right), or 0 (collinear). */
  orientation(p0, p1, p2) {
    const c = VecMath.cross2D(p0, p1, p2);
    if (c > EPSILON) return 1;
    if (c < -EPSILON) return -1;
    return 0;
  },
  /** Tests if four 2D points form a convex quadrilateral. */
  isConvexQuad(a, b, c, d) {
    const o1 = VecMath.orientation(a, b, c);
    const o2 = VecMath.orientation(b, c, d);
    const o3 = VecMath.orientation(c, d, a);
    const o4 = VecMath.orientation(d, a, b);
    return o1 === o2 && o2 === o3 && o3 === o4 && o1 !== 0;
  },
  /** Tests if a point lies on the line segment ab (2D, within tolerance). */
  isPointOnSegment2D(a, b, p, tolerance = 1e-3) {
    return VecMath.distanceToSegment2D(p, a, b) < tolerance;
  },
  // ================================================================
  // TRIANGLE UTILITIES
  // ================================================================
  /** Signed volume of tetrahedron formed by triangle and origin (for mesh volume). */
  triangleSignedVolume(a, b, c) {
    return a.dot(b.cross(c)) / 6;
  },
  /** 3D triangle area via cross product magnitude. */
  triangleArea(a, b, c) {
    return b.sub(a).cross(c.sub(a)).len() * 0.5;
  },
  /** 2D triangle area (signed). */
  triangleArea2D(a, b, c) {
    return VecMath.cross2D(a, b, c) * 0.5;
  },
  /** Normal of a triangle (unit length). */
  triangleNormal(a, b, c) {
    return b.sub(a).cross(c.sub(a)).normalize();
  },
  // ================================================================
  // BISECTOR
  // ================================================================
  /**
   * 2D angular bisector direction at vertex P between edges PA and PB.
   * The returned vector points into the bisector, unit length.
   */
  bisector2D(p, a, b) {
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
  arcLength(angle, radius) {
    return radius * angle;
  },
  /** Arc angle from arc length and radius. */
  arcAngle(length, radius) {
    return length / radius;
  },
  // ================================================================
  // 3x3 DETERMINANT
  // ================================================================
  /** Determinant of a 3x3 matrix given by rows. */
  determinant3x3(a, b, c, d, e, f, g, h, i) {
    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  },
  /** Direction, length, and unit perpendicular of a 2D segment (XY plane). */
  segmentPerpendicular2D(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < EPSILON) return { dx: 0, dy: 0, len: 0, px: 0, py: 0 };
    return { dx: dx / len, dy: dy / len, len, px: -dy / len, py: dx / len };
  }
};

// src/core/geometry/HPlane.ts
var HPlane = class _HPlane {
  /** ax + by + cz + d = 0 */
  constructor(normal, d) {
    this.normal = normal;
    this.d = d;
  }
  static fromPointNormal(point, normal) {
    const n = normal.normalize();
    return new _HPlane(n, -n.dot(point));
  }
  static fromThreePoints(a, b, c) {
    const n = b.sub(a).cross(c.sub(a)).normalize();
    return new _HPlane(n, -n.dot(a));
  }
  static XY() {
    return new _HPlane(Vec3.unitZ(), 0);
  }
  static XZ() {
    return new _HPlane(Vec3.unitY(), 0);
  }
  static YZ() {
    return new _HPlane(Vec3.unitX(), 0);
  }
  distToPoint(point) {
    return this.normal.dot(point) + this.d;
  }
  projectPoint(point) {
    return point.sub(this.normal.mul(this.distToPoint(point)));
  }
  side(point) {
    const d = this.distToPoint(point);
    if (d > HMath.EPSILON) return 1;
    if (d < -HMath.EPSILON) return -1;
    return 0;
  }
  /** Reflects a vector off the plane (like a light ray bouncing). */
  reflectVector(direction) {
    return direction.reflect(this.normal);
  }
  /** Reflects a point to the other side of the plane. */
  reflectPoint(point) {
    const dist = this.distToPoint(point);
    return point.sub(this.normal.mul(2 * dist));
  }
  /** Returns a new plane with the normal flipped. */
  flipped() {
    return new _HPlane(this.normal.neg(), -this.d);
  }
  toJSON() {
    return { normal: this.normal.toJSON(), d: this.d };
  }
};

// src/core/geometry/AABB.ts
var AABB = class _AABB {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }
  static empty() {
    return new _AABB(
      new Vec3(Infinity, Infinity, Infinity),
      new Vec3(-Infinity, -Infinity, -Infinity)
    );
  }
  static fromPoints(points) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      minZ = Math.min(minZ, p.z);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      maxZ = Math.max(maxZ, p.z);
    }
    return new _AABB(new Vec3(minX, minY, minZ), new Vec3(maxX, maxY, maxZ));
  }
  center() {
    return this.min.lerp(this.max, 0.5);
  }
  size() {
    return this.max.sub(this.min);
  }
  volume() {
    const s = this.size();
    return s.x * s.y * s.z;
  }
  expand(point) {
    return new _AABB(
      new Vec3(Math.min(this.min.x, point.x), Math.min(this.min.y, point.y), Math.min(this.min.z, point.z)),
      new Vec3(Math.max(this.max.x, point.x), Math.max(this.max.y, point.y), Math.max(this.max.z, point.z))
    );
  }
  union(other) {
    return new _AABB(
      new Vec3(Math.min(this.min.x, other.min.x), Math.min(this.min.y, other.min.y), Math.min(this.min.z, other.min.z)),
      new Vec3(Math.max(this.max.x, other.max.x), Math.max(this.max.y, other.max.y), Math.max(this.max.z, other.max.z))
    );
  }
  containsPoint(p) {
    return p.x >= this.min.x && p.x <= this.max.x && p.y >= this.min.y && p.y <= this.max.y && p.z >= this.min.z && p.z <= this.max.z;
  }
  intersectsAABB(other) {
    return this.max.x >= other.min.x && this.min.x <= other.max.x && this.max.y >= other.min.y && this.min.y <= other.max.y && this.max.z >= other.min.z && this.min.z <= other.max.z;
  }
  toJSON() {
    return { min: this.min.toJSON(), max: this.max.toJSON() };
  }
};

// src/core/geometry/Segment.ts
var Segment = class _Segment {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  get direction() {
    return this.b.sub(this.a);
  }
  get length() {
    return this.a.distTo(this.b);
  }
  get lengthSquared() {
    return this.a.distSqTo(this.b);
  }
  get midpoint() {
    return this.a.add(this.b).mul(0.5);
  }
  /** Point on segment at parameter t (0=A, 1=B). */
  pointAt(t) {
    return this.a.lerp(this.b, t);
  }
  /** Closest point on this segment to point p. */
  closestPoint(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.lenSq();
    if (abSq < HMath.EPSILON) return this.a;
    const t = HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
    return this.a.add(ab.mul(t));
  }
  /** Parameter t of the closest point on the segment to p (clamped 0..1). */
  closestParameter(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.lenSq();
    if (abSq < HMath.EPSILON) return 0;
    return HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
  }
  /** Distance from a point to this segment. */
  distanceTo(p) {
    return p.distTo(this.closestPoint(p));
  }
  /** Squared distance from a point to this segment. */
  distanceSquaredTo(p) {
    return p.distSqTo(this.closestPoint(p));
  }
  /** Bounding box of this segment. */
  get bounds() {
    return new AABB(
      new Vec3(Math.min(this.a.x, this.b.x), Math.min(this.a.y, this.b.y), Math.min(this.a.z, this.b.z)),
      new Vec3(Math.max(this.a.x, this.b.x), Math.max(this.a.y, this.b.y), Math.max(this.a.z, this.b.z))
    );
  }
  /** Splits a segment into n equal parts, returning n+1 points. */
  static split(a, b, segments) {
    if (segments < 1) segments = 1;
    const pts = [];
    for (let i = 0; i <= segments; i++)
      pts.push(a.lerp(b, i / segments));
    return pts;
  }
  /**
   * Finds the closest points between this segment and another.
   * Returns { c1, c2 } — points on this segment and the other.
   */
  closestPointsTo(other) {
    return VecMath.closestPointsSegmentSegment(this.a, this.b, other.a, other.b);
  }
  /** Shortest distance between two segments. */
  distanceToSegment(other) {
    const { c1, c2 } = this.closestPointsTo(other);
    return c1.distTo(c2);
  }
  /** Returns a new segment reversed (B→A). */
  reversed() {
    return new _Segment(this.b, this.a);
  }
  toString() {
    return `Segment [${this.a} \u2192 ${this.b}]`;
  }
};
function closestPointOnSegment(p, a, b) {
  const ab = b.sub(a);
  const lenSq = ab.lenSq();
  if (lenSq < HMath.EPSILON) return a;
  const t = HMath.clamp(p.sub(a).dot(ab) / lenSq, 0, 1);
  return a.add(ab.mul(t));
}
function segmentSegmentClosest(a1, a2, b1, b2) {
  const d1 = a2.sub(a1), d2 = b2.sub(b1), r = a1.sub(b1);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  let t, u;
  if (a <= HMath.EPSILON && e <= HMath.EPSILON) {
    return { pointA: a1, pointB: b1, t: 0, u: 0 };
  }
  if (a <= HMath.EPSILON) {
    t = 0;
    u = HMath.clamp(f / e, 0, 1);
  } else {
    const c = d1.dot(r);
    if (e <= HMath.EPSILON) {
      u = 0;
      t = HMath.clamp(-c / a, 0, 1);
    } else {
      const b = d1.dot(d2);
      const denom = a * e - b * b;
      t = denom !== 0 ? HMath.clamp((b * f - c * e) / denom, 0, 1) : 0;
      u = (b * t + f) / e;
      if (u < 0) {
        u = 0;
        t = HMath.clamp(-c / a, 0, 1);
      } else if (u > 1) {
        u = 1;
        t = HMath.clamp((b - c) / a, 0, 1);
      }
    }
  }
  return {
    pointA: a1.add(d1.mul(t)),
    pointB: b1.add(d2.mul(u)),
    t,
    u
  };
}

// src/core/geometry/Triangle.ts
var Triangle = class {
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
  normal() {
    return this.b.sub(this.a).cross(this.c.sub(this.a)).normalize();
  }
  area() {
    return this.b.sub(this.a).cross(this.c.sub(this.a)).len() * 0.5;
  }
  centroid() {
    return new Vec3(
      (this.a.x + this.b.x + this.c.x) / 3,
      (this.a.y + this.b.y + this.c.y) / 3,
      (this.a.z + this.b.z + this.c.z) / 3
    );
  }
  /** Barycentric coordinates of a point (assumes point is on triangle's plane) */
  barycentric(p) {
    const v0 = this.b.sub(this.a), v1 = this.c.sub(this.a), v2 = p.sub(this.a);
    const d00 = v0.dot(v0), d01 = v0.dot(v1), d11 = v1.dot(v1);
    const d20 = v2.dot(v0), d21 = v2.dot(v1);
    const denom = d00 * d11 - d01 * d01;
    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    return new Vec3(1 - v - w, v, w);
  }
  containsPoint(p) {
    const bary = this.barycentric(p);
    return bary.x >= -HMath.EPSILON && bary.y >= -HMath.EPSILON && bary.z >= -HMath.EPSILON;
  }
  closestPointTo(p) {
    const plane = HPlane.fromThreePoints(this.a, this.b, this.c);
    const proj = plane.projectPoint(p);
    if (this.containsPoint(proj)) return proj;
    const candidates = [
      closestPointOnSegment(p, this.a, this.b),
      closestPointOnSegment(p, this.b, this.c),
      closestPointOnSegment(p, this.c, this.a)
    ];
    let best = candidates[0], bestDist = p.distSqTo(best);
    for (let i = 1; i < 3; i++) {
      const d = p.distSqTo(candidates[i]);
      if (d < bestDist) {
        best = candidates[i];
        bestDist = d;
      }
    }
    return best;
  }
  toJSON() {
    return { a: this.a.toJSON(), b: this.b.toJSON(), c: this.c.toJSON() };
  }
};

// src/core/geometry/mesh/Mesh.ts
var NodeView = class {
  constructor(m, id) {
    this.m = m;
    this.id = id;
  }
  get position() {
    return this.m.getPosition(this.id);
  }
  set position(p) {
    this.m.setPosition(this.id, p);
  }
  get edges() {
    return this.m.nodeEdges(this.id);
  }
  get faces() {
    return this.m.nodeFaces(this.id);
  }
  get normal() {
    return this.m.nodeNormal(this.id);
  }
  set normal(n) {
    if (n) this.m.setNormal(this.id, n);
  }
  get data() {
    return this.m.nodeData(this.id);
  }
};
var EdgeView = class {
  constructor(m, id) {
    this.m = m;
    this.id = id;
  }
  get nodes() {
    return this.m.edgeNodes(this.id);
  }
  get faces() {
    return this.m.edgeFaces(this.id);
  }
  get data() {
    return this.m.edgeData(this.id);
  }
};
var FaceView = class {
  constructor(m, id) {
    this.m = m;
    this.id = id;
  }
  get nodes() {
    return this.m.faceNodes(this.id);
  }
  get edges() {
    return this.m.faceEdges(this.id);
  }
  get normal() {
    return this.m.faceNormal(this.id);
  }
  set normal(n) {
    if (n) this.m.setFaceNormal(this.id, n);
  }
  get data() {
    return this.m.faceData(this.id);
  }
};
function grow(a, len, fill = 0) {
  const b = new a.constructor(len);
  b.set(a);
  if (fill !== 0) b.fill(fill, a.length);
  return b;
}
var NONE = -1;
var Mesh = class _Mesh {
  /**
   * `new Mesh()` is empty. `new Mesh(positions, indices, normals?, uvs?, colors?)`
   * loads flat triangle arrays (the former flat-mesh constructor).
   */
  constructor(positions, indices, normals, uvs, colors) {
    // nodes — a slot per id; `_nodeN` slots used, `_nodeLive` of them alive
    this._pos = new Float64Array(16 * 3);
    this._nrm = null;
    // vertex normals, valid for ids < _nrmN
    this._nrmN = 0;
    this._uv = null;
    // 2 per slot
    this._col = null;
    // 4 per slot (RGBA)
    this._nodeAlive = new Uint8Array(16);
    this._nodeFirstEdge = new Int32Array(16).fill(NONE);
    this._nodeFirstCorner = new Int32Array(16).fill(NONE);
    this._nodeN = 0;
    this._nodeLive = 0;
    // edges — endpoints plus two "next" pointers, one for each endpoint's list
    this._edgeA = new Uint32Array(32);
    this._edgeB = new Uint32Array(32);
    this._edgeNext = new Int32Array(64).fill(NONE);
    // [2e] next in A's list, [2e+1] in B's
    this._edgeFirstCorner = new Int32Array(32).fill(NONE);
    this._edgeAlive = new Uint8Array(32);
    this._edgeN = 0;
    this._edgeLive = 0;
    // faces — a corner range each; corners carry the node, the outgoing edge and two list links
    this._faceStart = new Uint32Array(17);
    // _faceN + 1 entries
    this._faceAlive = new Uint8Array(16);
    this._faceNrm = null;
    // valid for ids < _faceNrmN
    this._faceNrmN = 0;
    this._faceN = 0;
    this._faceLive = 0;
    this._cVert = new Uint32Array(64);
    this._cFace = new Uint32Array(64);
    this._cEdge = new Int32Array(64);
    this._cNextInNode = new Int32Array(64);
    this._cNextInEdge = new Int32Array(64);
    this._cornerN = 0;
    this._triCount = 0;
    // live triangles after fan-triangulation
    // side tables, allocated on first use
    this._nodeData = null;
    this._edgeData = null;
    this._faceData = null;
    // caches
    this._bounds = null;
    this._tri = null;
    if (positions) this._load(positions, indices ?? [], normals, uvs, colors);
  }
  // ── Counts ──
  /** Live nodes. */
  get nodeCount() {
    return this._nodeLive;
  }
  /** Live edges. */
  get edgeCount() {
    return this._edgeLive;
  }
  /** Live faces (polygons). */
  get faceCount() {
    return this._faceLive;
  }
  /** Vertex slots — `positions.length / 3`. Equals `nodeCount` unless nodes were removed. */
  get vertexCount() {
    return this._nodeN;
  }
  /** Triangles after fan-triangulating the live faces. */
  get triangleCount() {
    return this._triCount;
  }
  /** True if any element was removed and not yet compacted. */
  get hasTombstones() {
    return this._nodeLive !== this._nodeN || this._edgeLive !== this._edgeN || this._faceLive !== this._faceN;
  }
  // ── Flat views (the GPU side) ──
  /** xyz per vertex slot. A view into the mesh: edits are live, but call
   *  `markPositionsChanged()` afterwards so normals and bounds are recomputed. */
  get positions() {
    return this._pos.subarray(0, this._nodeN * 3);
  }
  /** Vertex normals, computed on first use. */
  get normals() {
    if (!this._nrm || this._nrmN !== this._nodeN) this.computeVertexNormals();
    return this._nrm.subarray(0, this._nodeN * 3);
  }
  /** Triangle index over the live faces (fan-triangulated). Cached; a plain view of
   *  the corner array when the mesh is all triangles with nothing removed. */
  get indices() {
    if (this._tri) return this._tri;
    if (this._faceLive === this._faceN && this._triCount * 3 === this._cornerN) {
      return this._tri = this._cVert.subarray(0, this._cornerN);
    }
    const out = new Uint32Array(this._triCount * 3);
    let k = 0;
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const s = this._faceStart[f], e = this._faceStart[f + 1];
      for (let c = s + 1; c + 1 < e; c++) {
        out[k++] = this._cVert[s];
        out[k++] = this._cVert[c];
        out[k++] = this._cVert[c + 1];
      }
    }
    return this._tri = out;
  }
  get uvs() {
    return this._uv ? this._uv.subarray(0, this._nodeN * 2) : null;
  }
  get colors() {
    return this._col ? this._col.subarray(0, this._nodeN * 4) : null;
  }
  /** Attach per-vertex uvs (2 floats per slot). */
  setUVs(uvs) {
    if (!uvs) {
      this._uv = null;
      return;
    }
    this._uv = new Float32Array(this._nodeAlive.length * 2);
    this._uv.set(uvs);
  }
  /** Attach per-vertex colours (4 floats per slot, RGBA). */
  setColors(colors) {
    if (!colors) {
      this._col = null;
      return;
    }
    this._col = new Float32Array(this._nodeAlive.length * 4);
    this._col.set(colors);
  }
  /** Call after writing into `positions` directly. */
  markPositionsChanged() {
    this._bounds = null;
    this._nrmN = 0;
    this._faceNrmN = 0;
  }
  // ── Nodes ──
  getPosition(id) {
    const o = id * 3;
    return new Vec3(this._pos[o], this._pos[o + 1], this._pos[o + 2]);
  }
  setPosition(id, p) {
    const o = id * 3;
    this._pos[o] = p.x;
    this._pos[o + 1] = p.y;
    this._pos[o + 2] = p.z;
    this._bounds = null;
  }
  /** Vertex normal, computing all of them if they are stale. */
  getNormal(id) {
    if (!this._nrm || this._nrmN !== this._nodeN) this.computeVertexNormals();
    const o = id * 3;
    return new Vec3(this._nrm[o], this._nrm[o + 1], this._nrm[o + 2]);
  }
  /** Vertex normal if `computeVertexNormals()` covered this node, else undefined. */
  nodeNormal(id) {
    if (!this._nrm || id >= this._nrmN) return void 0;
    const o = id * 3;
    return new Vec3(this._nrm[o], this._nrm[o + 1], this._nrm[o + 2]);
  }
  setNormal(id, n) {
    if (!this._nrm) this._nrm = new Float32Array(this._nodeAlive.length * 3);
    const o = id * 3;
    this._nrm[o] = n.x;
    this._nrm[o + 1] = n.y;
    this._nrm[o + 2] = n.z;
    if (this._nrmN <= id) this._nrmN = id + 1;
  }
  nodeData(id) {
    if (!this._nodeData) this._nodeData = /* @__PURE__ */ new Map();
    let d = this._nodeData.get(id);
    if (!d) this._nodeData.set(id, d = {});
    return d;
  }
  isNodeAlive(id) {
    return id >= 0 && id < this._nodeN && this._nodeAlive[id] === 1;
  }
  node(id) {
    return this.isNodeAlive(id) ? new NodeView(this, id) : void 0;
  }
  *nodes() {
    for (let i = 0; i < this._nodeN; i++) if (this._nodeAlive[i]) yield new NodeView(this, i);
  }
  nodesArray() {
    return [...this.nodes()];
  }
  /** Live node ids, in order. */
  nodeIds() {
    const out = [];
    for (let i = 0; i < this._nodeN; i++) if (this._nodeAlive[i]) out.push(i);
    return out;
  }
  addNode(position, data) {
    const id = this._addNodeXYZ(position.x, position.y, position.z);
    if (data) (this._nodeData ?? (this._nodeData = /* @__PURE__ */ new Map())).set(id, data);
    return id;
  }
  addNodes(positions) {
    return positions.map((p) => this.addNode(p));
  }
  _addNodeXYZ(x, y, z) {
    const id = this._nodeN;
    this._needNodes(id + 1);
    const o = id * 3;
    this._pos[o] = x;
    this._pos[o + 1] = y;
    this._pos[o + 2] = z;
    this._nodeAlive[id] = 1;
    this._nodeFirstEdge[id] = NONE;
    this._nodeFirstCorner[id] = NONE;
    this._nodeN++;
    this._nodeLive++;
    this._bounds = null;
    return id;
  }
  /** Incident edge ids. */
  nodeEdges(id) {
    const out = [];
    for (let e = this._nodeFirstEdge[id]; e !== NONE; e = this._nextEdgeOf(e, id)) out.push(e);
    return out;
  }
  /** Incident face ids. */
  nodeFaces(id) {
    const out = [];
    for (let c = this._nodeFirstCorner[id]; c !== NONE; c = this._cNextInNode[c]) out.push(this._cFace[c]);
    return out;
  }
  nodeNeighbors(id) {
    if (!this.isNodeAlive(id)) return [];
    const out = [];
    for (let e = this._nodeFirstEdge[id]; e !== NONE; e = this._nextEdgeOf(e, id)) {
      out.push(this._edgeA[e] === id ? this._edgeB[e] : this._edgeA[e]);
    }
    return out;
  }
  /** Neighbour ids as a typed array (the flat-mesh spelling of `nodeNeighbors`). */
  neighbors(id) {
    return Uint32Array.from(this.nodeNeighbors(id));
  }
  isBoundaryNode(id) {
    if (!this.isNodeAlive(id)) return false;
    for (let e = this._nodeFirstEdge[id]; e !== NONE; e = this._nextEdgeOf(e, id)) {
      if (this._edgeCornerCount(e) < 2) return true;
    }
    return false;
  }
  /** Flat-mesh spelling of `isBoundaryNode`. */
  isBoundary(id) {
    return this.isBoundaryNode(id);
  }
  removeNode(id) {
    if (!this.isNodeAlive(id)) return;
    for (const f of this.nodeFaces(id)) this.removeFace(f);
    for (const e of this.nodeEdges(id)) this.removeEdge(e);
    this._nodeAlive[id] = 0;
    this._nodeLive--;
    this._nodeData?.delete(id);
    this._bounds = null;
  }
  // ── Edges ──
  edgeNodes(id) {
    return [this._edgeA[id], this._edgeB[id]];
  }
  /** Incident face ids. */
  edgeFaces(id) {
    const out = [];
    for (let c = this._edgeFirstCorner[id]; c !== NONE; c = this._cNextInEdge[c]) out.push(this._cFace[c]);
    return out;
  }
  edgeData(id) {
    if (!this._edgeData) this._edgeData = /* @__PURE__ */ new Map();
    let d = this._edgeData.get(id);
    if (!d) this._edgeData.set(id, d = {});
    return d;
  }
  isEdgeAlive(id) {
    return id >= 0 && id < this._edgeN && this._edgeAlive[id] === 1;
  }
  edge(id) {
    return this.isEdgeAlive(id) ? new EdgeView(this, id) : void 0;
  }
  *edges() {
    for (let i = 0; i < this._edgeN; i++) if (this._edgeAlive[i]) yield new EdgeView(this, i);
  }
  edgesArray() {
    return [...this.edges()];
  }
  /** The edge joining two nodes, in either direction, or undefined. */
  findEdge(a, b) {
    if (!this.isNodeAlive(a)) return void 0;
    for (let e = this._nodeFirstEdge[a]; e !== NONE; e = this._nextEdgeOf(e, a)) {
      const ea = this._edgeA[e], eb = this._edgeB[e];
      if (ea === a && eb === b || ea === b && eb === a) return e;
    }
    return void 0;
  }
  /** Adds an edge, or returns the existing one between the two nodes. */
  addEdge(a, b, data) {
    const existing = this.findEdge(a, b);
    if (existing !== void 0) return existing;
    const id = this._edgeN;
    this._needEdges(id + 1);
    this._edgeA[id] = a;
    this._edgeB[id] = b;
    this._edgeAlive[id] = 1;
    this._edgeFirstCorner[id] = NONE;
    this._edgeNext[2 * id] = this._nodeFirstEdge[a];
    this._nodeFirstEdge[a] = id;
    if (b !== a) {
      this._edgeNext[2 * id + 1] = this._nodeFirstEdge[b];
      this._nodeFirstEdge[b] = id;
    } else {
      this._edgeNext[2 * id + 1] = NONE;
    }
    this._edgeN++;
    this._edgeLive++;
    if (data) this._edgeData ? this._edgeData.set(id, data) : this._edgeData = /* @__PURE__ */ new Map([[id, data]]);
    return id;
  }
  edgeOtherNode(edgeId, nodeId) {
    return this._edgeA[edgeId] === nodeId ? this._edgeB[edgeId] : this._edgeA[edgeId];
  }
  isBoundaryEdge(id) {
    return this.isEdgeAlive(id) ? this._edgeCornerCount(id) < 2 : false;
  }
  boundaryEdges() {
    const out = [];
    for (let e = 0; e < this._edgeN; e++) {
      if (this._edgeAlive[e] && this._edgeCornerCount(e) < 2) out.push(new EdgeView(this, e));
    }
    return out;
  }
  /** Removes the edge and every face that uses it. */
  removeEdge(id) {
    if (!this.isEdgeAlive(id)) return;
    for (const f of this.edgeFaces(id)) this.removeFace(f);
    const a = this._edgeA[id], b = this._edgeB[id];
    this._unlinkEdge(id, a);
    if (b !== a) this._unlinkEdge(id, b);
    this._edgeAlive[id] = 0;
    this._edgeLive--;
    this._edgeData?.delete(id);
  }
  _nextEdgeOf(e, node) {
    return this._edgeA[e] === node ? this._edgeNext[2 * e] : this._edgeNext[2 * e + 1];
  }
  _edgeCornerCount(e) {
    let n = 0;
    for (let c = this._edgeFirstCorner[e]; c !== NONE; c = this._cNextInEdge[c]) n++;
    return n;
  }
  _unlinkEdge(id, node) {
    let prev = NONE;
    for (let e = this._nodeFirstEdge[node]; e !== NONE; e = this._nextEdgeOf(e, node)) {
      if (e === id) {
        const next = this._nextEdgeOf(e, node);
        if (prev === NONE) this._nodeFirstEdge[node] = next;
        else if (this._edgeA[prev] === node) this._edgeNext[2 * prev] = next;
        else this._edgeNext[2 * prev + 1] = next;
        return;
      }
      prev = e;
    }
  }
  // ── Faces ──
  /** Node ids of a face as a view into the corner array — no copy, valid until the next edit. */
  faceVerts(id) {
    return this._cVert.subarray(this._faceStart[id], this._faceStart[id + 1]);
  }
  faceNodes(id) {
    return Array.from(this.faceVerts(id));
  }
  faceEdges(id) {
    return Array.from(this._cEdge.subarray(this._faceStart[id], this._faceStart[id + 1]));
  }
  faceSize(id) {
    return this._faceStart[id + 1] - this._faceStart[id];
  }
  /** Face normal if `computeFaceNormals()` covered this face, else undefined. */
  faceNormal(id) {
    if (!this._faceNrm || id >= this._faceNrmN) return void 0;
    const o = id * 3;
    return new Vec3(this._faceNrm[o], this._faceNrm[o + 1], this._faceNrm[o + 2]);
  }
  setFaceNormal(id, n) {
    if (!this._faceNrm) this._faceNrm = new Float32Array(this._faceAlive.length * 3);
    const o = id * 3;
    this._faceNrm[o] = n.x;
    this._faceNrm[o + 1] = n.y;
    this._faceNrm[o + 2] = n.z;
    if (this._faceNrmN <= id) this._faceNrmN = id + 1;
  }
  faceData(id) {
    if (!this._faceData) this._faceData = /* @__PURE__ */ new Map();
    let d = this._faceData.get(id);
    if (!d) this._faceData.set(id, d = {});
    return d;
  }
  isFaceAlive(id) {
    return id >= 0 && id < this._faceN && this._faceAlive[id] === 1;
  }
  face(id) {
    return this.isFaceAlive(id) ? new FaceView(this, id) : void 0;
  }
  *faces() {
    for (let i = 0; i < this._faceN; i++) if (this._faceAlive[i]) yield new FaceView(this, i);
  }
  facesArray() {
    return [...this.faces()];
  }
  /** Live face ids, in order. */
  faceIds() {
    const out = [];
    for (let i = 0; i < this._faceN; i++) if (this._faceAlive[i]) out.push(i);
    return out;
  }
  addFace(nodeIds, data) {
    const n = nodeIds.length;
    const id = this._faceN;
    this._needFaces(id + 1);
    const start = this._cornerN;
    this._needCorners(start + n);
    for (let i = 0; i < n; i++) {
      this._cVert[start + i] = nodeIds[i];
      this._cFace[start + i] = id;
    }
    this._faceStart[id] = start;
    this._faceStart[id + 1] = start + n;
    this._cornerN = start + n;
    this._faceAlive[id] = 1;
    this._faceN++;
    this._faceLive++;
    this._triCount += Math.max(0, n - 2);
    this._linkCorners(id);
    this._tri = null;
    if (data) this._faceData ? this._faceData.set(id, data) : this._faceData = /* @__PURE__ */ new Map([[id, data]]);
    return id;
  }
  addTriangle(a, b, c, data) {
    return this.addFace([a, b, c], data);
  }
  addQuad(a, b, c, d, data) {
    return this.addFace([a, b, c, d], data);
  }
  /** Removes the face. Its edges stay (an edge is its own element). */
  removeFace(id) {
    if (!this.isFaceAlive(id)) return;
    this._unlinkCorners(id);
    this._faceAlive[id] = 0;
    this._faceLive--;
    this._triCount -= Math.max(0, this.faceSize(id) - 2);
    this._faceData?.delete(id);
    this._tri = null;
  }
  /** Reverses the winding of a face in place (what `face.nodes.reverse()` used to do). */
  reverseFace(id) {
    if (!this.isFaceAlive(id)) return;
    this._unlinkCorners(id);
    const v = this.faceVerts(id);
    v.reverse();
    this._linkCorners(id);
    this._tri = null;
  }
  faceTriangle(id) {
    if (!this.isFaceAlive(id) || this.faceSize(id) !== 3) return null;
    const s = this._faceStart[id];
    return new Triangle(
      this.getPosition(this._cVert[s]),
      this.getPosition(this._cVert[s + 1]),
      this.getPosition(this._cVert[s + 2])
    );
  }
  /** Registers the face's corners with their edges and nodes (edges are created as needed). */
  _linkCorners(id) {
    const s = this._faceStart[id], e = this._faceStart[id + 1], n = e - s;
    for (let i = 0; i < n; i++) {
      const c = s + i;
      const a = this._cVert[c], b = this._cVert[s + (i + 1) % n];
      const edge = this.addEdge(a, b);
      this._cEdge[c] = edge;
      this._cNextInEdge[c] = this._edgeFirstCorner[edge];
      this._edgeFirstCorner[edge] = c;
      this._cNextInNode[c] = this._nodeFirstCorner[a];
      this._nodeFirstCorner[a] = c;
    }
  }
  _unlinkCorners(id) {
    const s = this._faceStart[id], e = this._faceStart[id + 1];
    for (let c = s; c < e; c++) {
      const edge = this._cEdge[c];
      let prev = NONE;
      for (let k = this._edgeFirstCorner[edge]; k !== NONE; k = this._cNextInEdge[k]) {
        if (k === c) {
          if (prev === NONE) this._edgeFirstCorner[edge] = this._cNextInEdge[k];
          else this._cNextInEdge[prev] = this._cNextInEdge[k];
          break;
        }
        prev = k;
      }
      const node = this._cVert[c];
      prev = NONE;
      for (let k = this._nodeFirstCorner[node]; k !== NONE; k = this._cNextInNode[k]) {
        if (k === c) {
          if (prev === NONE) this._nodeFirstCorner[node] = this._cNextInNode[k];
          else this._cNextInNode[prev] = this._cNextInNode[k];
          break;
        }
        prev = k;
      }
    }
  }
  // ── Whole-mesh ──
  clear() {
    this._nodeN = this._nodeLive = 0;
    this._edgeN = this._edgeLive = 0;
    this._faceN = this._faceLive = 0;
    this._cornerN = 0;
    this._triCount = 0;
    this._nrmN = 0;
    this._faceNrmN = 0;
    this._nodeData = this._edgeData = this._faceData = null;
    this._bounds = null;
    this._tri = null;
  }
  /**
   * Drops removed elements and renumbers the rest densely, in order. Returns the
   * old→new maps (−1 for removed). Every id held before this call is stale.
   */
  compact() {
    const fresh = new _Mesh();
    const maps = this._copyInto(fresh);
    Object.assign(this, fresh);
    return maps;
  }
  clone() {
    const m = new _Mesh();
    this._copyInto(m);
    return m;
  }
  /** Copies the live elements into `m` (densely renumbered) and returns the id maps. */
  _copyInto(m) {
    const nodes = new Int32Array(this._nodeN).fill(NONE);
    const edges = new Int32Array(this._edgeN).fill(NONE);
    const faces = new Int32Array(this._faceN).fill(NONE);
    m._needNodes(this._nodeLive);
    const hasNrm = !!this._nrm && this._nrmN === this._nodeN;
    if (hasNrm) m._nrm = new Float32Array(m._nodeAlive.length * 3);
    if (this._uv) m._uv = new Float32Array(m._nodeAlive.length * 2);
    if (this._col) m._col = new Float32Array(m._nodeAlive.length * 4);
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      const j = m._addNodeXYZ(this._pos[i * 3], this._pos[i * 3 + 1], this._pos[i * 3 + 2]);
      nodes[i] = j;
      if (hasNrm) {
        m._nrm[j * 3] = this._nrm[i * 3];
        m._nrm[j * 3 + 1] = this._nrm[i * 3 + 1];
        m._nrm[j * 3 + 2] = this._nrm[i * 3 + 2];
      }
      if (this._uv) {
        m._uv[j * 2] = this._uv[i * 2];
        m._uv[j * 2 + 1] = this._uv[i * 2 + 1];
      }
      if (this._col) for (let k = 0; k < 4; k++) m._col[j * 4 + k] = this._col[i * 4 + k];
      const d = this._nodeData?.get(i);
      if (d) (m._nodeData ?? (m._nodeData = /* @__PURE__ */ new Map())).set(j, d);
    }
    if (hasNrm) m._nrmN = m._nodeN;
    for (let e = 0; e < this._edgeN; e++) {
      if (!this._edgeAlive[e]) continue;
      edges[e] = m.addEdge(nodes[this._edgeA[e]], nodes[this._edgeB[e]], this._edgeData?.get(e));
    }
    const buf = [];
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      buf.length = 0;
      const s = this._faceStart[f], e = this._faceStart[f + 1];
      for (let c = s; c < e; c++) buf.push(nodes[this._cVert[c]]);
      faces[f] = m.addFace(buf, this._faceData?.get(f));
      if (this._faceNrm && f < this._faceNrmN) {
        m.setFaceNormal(faces[f], new Vec3(this._faceNrm[f * 3], this._faceNrm[f * 3 + 1], this._faceNrm[f * 3 + 2]));
      }
    }
    return { nodes, edges, faces };
  }
  /** Appends another mesh (its live nodes, edges and faces) and returns the combined mesh. */
  merge(other) {
    const m = this.clone();
    const nodes = new Int32Array(other._nodeN).fill(NONE);
    if (!(m._uv && other._uv)) m._uv = null;
    if (!(m._col && other._col)) m._col = null;
    for (let i = 0; i < other._nodeN; i++) {
      if (!other._nodeAlive[i]) continue;
      const j = nodes[i] = m._addNodeXYZ(other._pos[i * 3], other._pos[i * 3 + 1], other._pos[i * 3 + 2]);
      if (m._uv) {
        m._uv[j * 2] = other._uv[i * 2];
        m._uv[j * 2 + 1] = other._uv[i * 2 + 1];
      }
      if (m._col) for (let k = 0; k < 4; k++) m._col[j * 4 + k] = other._col[i * 4 + k];
    }
    for (let e = 0; e < other._edgeN; e++) {
      if (other._edgeAlive[e]) m.addEdge(nodes[other._edgeA[e]], nodes[other._edgeB[e]]);
    }
    const buf = [];
    for (let f = 0; f < other._faceN; f++) {
      if (!other._faceAlive[f]) continue;
      buf.length = 0;
      const s = other._faceStart[f], e = other._faceStart[f + 1];
      for (let c = s; c < e; c++) buf.push(nodes[other._cVert[c]]);
      m.addFace(buf, other._faceData?.get(f));
    }
    m._nrmN = 0;
    return m;
  }
  // ── Normals ──
  /** Newell normal per live face (robust for non-planar quads). */
  computeFaceNormals() {
    if (!this._faceNrm || this._faceNrm.length < this._faceAlive.length * 3) {
      this._faceNrm = new Float32Array(this._faceAlive.length * 3);
    }
    const pos = this._pos, fn = this._faceNrm, cv = this._cVert;
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const s = this._faceStart[f], e = this._faceStart[f + 1], n = e - s;
      let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < n; i++) {
        const a = cv[s + i] * 3, b = cv[s + (i + 1) % n] * 3;
        nx += (pos[a + 1] - pos[b + 1]) * (pos[a + 2] + pos[b + 2]);
        ny += (pos[a + 2] - pos[b + 2]) * (pos[a] + pos[b]);
        nz += (pos[a] - pos[b]) * (pos[a + 1] + pos[b + 1]);
      }
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const inv = len > 1e-12 ? 1 / len : 0;
      fn[f * 3] = nx * inv;
      fn[f * 3 + 1] = ny * inv;
      fn[f * 3 + 2] = nz * inv;
    }
    this._faceNrmN = this._faceN;
  }
  /** Vertex normal = normalised sum of the unit normals of the faces around it. */
  computeVertexNormals() {
    this.computeFaceNormals();
    if (!this._nrm || this._nrm.length < this._nodeAlive.length * 3) {
      this._nrm = new Float32Array(this._nodeAlive.length * 3);
    }
    const nrm = this._nrm, fn = this._faceNrm, cv = this._cVert;
    nrm.fill(0, 0, this._nodeN * 3);
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const x = fn[f * 3], y = fn[f * 3 + 1], z = fn[f * 3 + 2];
      for (let c = this._faceStart[f], e = this._faceStart[f + 1]; c < e; c++) {
        const o = cv[c] * 3;
        nrm[o] += x;
        nrm[o + 1] += y;
        nrm[o + 2] += z;
      }
    }
    for (let i = 0; i < this._nodeN; i++) {
      const o = i * 3;
      const len = Math.sqrt(nrm[o] * nrm[o] + nrm[o + 1] * nrm[o + 1] + nrm[o + 2] * nrm[o + 2]);
      if (len > 1e-12) {
        nrm[o] /= len;
        nrm[o + 1] /= len;
        nrm[o + 2] /= len;
      } else {
        nrm[o] = 0;
        nrm[o + 1] = 0;
        nrm[o + 2] = 0;
      }
    }
    this._nrmN = this._nodeN;
  }
  /** Flat-mesh spelling of `computeVertexNormals`. */
  computeNormals() {
    this.computeVertexNormals();
  }
  // ── Measures ──
  bounds() {
    if (this._bounds) return this._bounds;
    const pos = this._pos;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    if (this._nodeLive === 0) minX = minY = minZ = maxX = maxY = maxZ = 0;
    return this._bounds = new AABB(new Vec3(minX, minY, minZ), new Vec3(maxX, maxY, maxZ));
  }
  /** Signed-tetrahedra volume (closed, consistently wound meshes). */
  volume() {
    const pos = this._pos, idx = this.indices;
    let vol = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      vol += (pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) + pos[a + 1] * (pos[b + 2] * pos[c] - pos[b] * pos[c + 2]) + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c])) / 6;
    }
    return Math.abs(vol);
  }
  surfaceArea() {
    const pos = this._pos, idx = this.indices;
    let area = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const abx = pos[b] - pos[a], aby = pos[b + 1] - pos[a + 1], abz = pos[b + 2] - pos[a + 2];
      const acx = pos[c] - pos[a], acy = pos[c + 1] - pos[a + 1], acz = pos[c + 2] - pos[a + 2];
      const cx = aby * acz - abz * acy, cy = abz * acx - abx * acz, cz = abx * acy - aby * acx;
      area += Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    }
    return area;
  }
  /** Average of the live node positions. */
  centroid() {
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      sx += this._pos[i * 3];
      sy += this._pos[i * 3 + 1];
      sz += this._pos[i * 3 + 2];
    }
    const n = this._nodeLive || 1;
    return new Vec3(sx / n, sy / n, sz / n);
  }
  /** V − E + F over the live elements. */
  eulerCharacteristic() {
    return this._nodeLive - this._edgeLive + this._faceLive;
  }
  // ── In-place geometry ──
  translate(dx, dy, dz) {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN * 3; i += 3) {
      pos[i] += dx;
      pos[i + 1] += dy;
      pos[i + 2] += dz;
    }
    this._bounds = null;
  }
  scale(s) {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN * 3; i++) pos[i] *= s;
    this._bounds = null;
  }
  scaleXYZ(sx, sy, sz) {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN * 3; i += 3) {
      pos[i] *= sx;
      pos[i + 1] *= sy;
      pos[i + 2] *= sz;
    }
    this.markPositionsChanged();
  }
  mapPositions(fn) {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      const [x, y, z] = fn(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], i);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    this.markPositionsChanged();
  }
  /** Laplacian smoothing: each interior node moves toward the mean of its neighbours. */
  smooth(iterations = 1, factor = 0.5) {
    const n = this._nodeN, pos = this._pos;
    const tmp = new Float64Array(n * 3);
    const boundary = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (this._nodeAlive[i] && this.isBoundaryNode(i)) boundary[i] = 1;
    for (let it = 0; it < iterations; it++) {
      tmp.set(pos.subarray(0, n * 3));
      for (let v = 0; v < n; v++) {
        if (!this._nodeAlive[v] || boundary[v]) continue;
        let ax = 0, ay = 0, az = 0, k = 0;
        for (let e = this._nodeFirstEdge[v]; e !== NONE; e = this._nextEdgeOf(e, v)) {
          const o2 = (this._edgeA[e] === v ? this._edgeB[e] : this._edgeA[e]) * 3;
          ax += tmp[o2];
          ay += tmp[o2 + 1];
          az += tmp[o2 + 2];
          k++;
        }
        if (k === 0) continue;
        const o = v * 3, inv = 1 / k;
        pos[o] = tmp[o] + (ax * inv - tmp[o]) * factor;
        pos[o + 1] = tmp[o + 1] + (ay * inv - tmp[o + 1]) * factor;
        pos[o + 2] = tmp[o + 2] + (az * inv - tmp[o + 2]) * factor;
      }
    }
    this.markPositionsChanged();
    this.computeVertexNormals();
  }
  // ── Topology operations ──
  /** Splits an edge at parameter `t`, splitting its faces; returns the new node id. */
  splitEdge(edgeId, t = 0.5) {
    if (!this.isEdgeAlive(edgeId)) return -1;
    const [a, b] = this.edgeNodes(edgeId);
    const midId = this.addNode(this.getPosition(a).lerp(this.getPosition(b), t));
    for (const fid of this.edgeFaces(edgeId)) {
      const nodeList = this.faceNodes(fid);
      const data = this._faceData?.get(fid);
      const idxA = nodeList.indexOf(a), idxB = nodeList.indexOf(b);
      const newNodes = [...nodeList];
      if (Math.abs(idxA - idxB) === 1) newNodes.splice(Math.max(idxA, idxB), 0, midId);
      else newNodes.push(midId);
      this.removeFace(fid);
      if (nodeList.length === 3) {
        const other = nodeList.find((n) => n !== a && n !== b);
        this.addFace([a, midId, other], data);
        this.addFace([midId, b, other], data);
      } else {
        this.addFace(newNodes, data);
      }
    }
    this.removeEdge(edgeId);
    return midId;
  }
  /** Collapses an edge to its midpoint; returns the surviving node id. */
  collapseEdge(edgeId) {
    if (!this.isEdgeAlive(edgeId)) return -1;
    const [keepId, removeId] = this.edgeNodes(edgeId);
    this.setPosition(keepId, this.getPosition(keepId).lerp(this.getPosition(removeId), 0.5));
    for (const fid of this.nodeFaces(removeId)) {
      const data = this._faceData?.get(fid);
      const unique = [...new Set(this.faceNodes(fid).map((n) => n === removeId ? keepId : n))];
      this.removeFace(fid);
      if (unique.length >= 3) this.addFace(unique, data);
    }
    this.removeNode(removeId);
    return keepId;
  }
  // ── Triangle access (flat API) ──
  getTriangle(t) {
    const idx = this.indices, o = t * 3;
    return [idx[o], idx[o + 1], idx[o + 2]];
  }
  getTrianglePositions(t) {
    const [a, b, c] = this.getTriangle(t);
    return [this.getPosition(a), this.getPosition(b), this.getPosition(c)];
  }
  // ── Conversion ──
  /** Flat Float32 arrays for rendering/IO. Dense: removed nodes are dropped. */
  toMeshData() {
    const nrm = this.normals;
    const idx = this.indices;
    if (!this.hasTombstones || this._nodeLive === this._nodeN) {
      const n = this._nodeN * 3;
      const positions2 = new Float32Array(n);
      for (let i = 0; i < n; i++) positions2[i] = this._pos[i];
      return {
        positions: positions2,
        normals: new Float32Array(nrm),
        indices: idx === this._tri && idx.buffer === this._cVert.buffer ? new Uint32Array(idx) : idx,
        ...this._uv ? { uvs: new Float32Array(this.uvs) } : {},
        ...this._col ? { colors: new Float32Array(this.colors) } : {}
      };
    }
    const map = new Int32Array(this._nodeN).fill(NONE);
    let k = 0;
    for (let i = 0; i < this._nodeN; i++) if (this._nodeAlive[i]) map[i] = k++;
    const positions = new Float32Array(k * 3), normals = new Float32Array(k * 3);
    const uvs = this._uv ? new Float32Array(k * 2) : void 0;
    const colors = this._col ? new Float32Array(k * 4) : void 0;
    for (let i = 0; i < this._nodeN; i++) {
      const j = map[i];
      if (j === NONE) continue;
      for (let d = 0; d < 3; d++) {
        positions[j * 3 + d] = this._pos[i * 3 + d];
        normals[j * 3 + d] = nrm[i * 3 + d];
      }
      if (uvs) {
        uvs[j * 2] = this._uv[i * 2];
        uvs[j * 2 + 1] = this._uv[i * 2 + 1];
      }
      if (colors) for (let d = 0; d < 4; d++) colors[j * 4 + d] = this._col[i * 4 + d];
    }
    const indices = new Uint32Array(idx.length);
    for (let i = 0; i < idx.length; i++) indices[i] = map[idx[i]];
    return { positions, normals, indices, ...uvs ? { uvs } : {}, ...colors ? { colors } : {} };
  }
  static fromMeshData(d) {
    return new _Mesh(d.positions, d.indices, d.normals, d.uvs, d.colors);
  }
  static fromArrays(positions, indices, normals, uvs, colors) {
    return new _Mesh(positions, indices, normals, uvs, colors);
  }
  static fromIndexedTriangles(positions, indices, data) {
    const mesh = new _Mesh();
    const ids = mesh.addNodes(positions);
    for (let i = 0; i < indices.length; i += 3) {
      mesh.addTriangle(ids[indices[i]], ids[indices[i + 1]], ids[indices[i + 2]], data?.[i / 3]);
    }
    mesh.computeVertexNormals();
    return mesh;
  }
  static fromFaces(positions, faces) {
    const mesh = new _Mesh();
    const ids = mesh.addNodes(positions);
    for (const f of faces) mesh.addFace(f.map((i) => ids[i]));
    mesh.computeVertexNormals();
    return mesh;
  }
  _load(positions, indices, normals, uvs, colors) {
    const n = Math.floor(positions.length / 3);
    this._needNodes(n);
    for (let i = 0; i < n; i++) this._addNodeXYZ(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    if (normals && normals.length >= n * 3) {
      this._nrm = new Float32Array(this._nodeAlive.length * 3);
      for (let i = 0; i < n * 3; i++) this._nrm[i] = normals[i];
      this._nrmN = n;
    }
    if (uvs) this.setUVs(uvs);
    if (colors) this.setColors(colors);
    this._needFaces(Math.floor(indices.length / 3));
    this._needCorners(indices.length);
    const tri = [0, 0, 0];
    for (let i = 0; i + 2 < indices.length; i += 3) {
      tri[0] = indices[i];
      tri[1] = indices[i + 1];
      tri[2] = indices[i + 2];
      this.addFace(tri);
    }
  }
  // ── Serialization ──
  toJSON() {
    const map = new Int32Array(this._nodeN).fill(NONE);
    const positions = [];
    let k = 0;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      map[i] = k++;
      positions.push(this._pos[i * 3], this._pos[i * 3 + 1], this._pos[i * 3 + 2]);
    }
    const faces = [];
    const faceData = [];
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const d = this._faceData?.get(f);
      if (d && Object.keys(d).length) faceData.push([faces.length, d]);
      faces.push(this.faceNodes(f).map((n) => map[n]));
    }
    const nodeData = [];
    if (this._nodeData) {
      for (const [id, d] of this._nodeData) if (map[id] !== NONE && Object.keys(d).length) nodeData.push([map[id], d]);
    }
    const out = { positions, faces };
    if (this._nrm && this._nrmN === this._nodeN) {
      const normals = [];
      for (let i = 0; i < this._nodeN; i++) if (map[i] !== NONE) normals.push(this._nrm[i * 3], this._nrm[i * 3 + 1], this._nrm[i * 3 + 2]);
      out.normals = normals;
    }
    if (this._uv) {
      const uvs = [];
      for (let i = 0; i < this._nodeN; i++) if (map[i] !== NONE) uvs.push(this._uv[i * 2], this._uv[i * 2 + 1]);
      out.uvs = uvs;
    }
    if (this._col) {
      const colors = [];
      for (let i = 0; i < this._nodeN; i++) if (map[i] !== NONE) colors.push(this._col[i * 4], this._col[i * 4 + 1], this._col[i * 4 + 2], this._col[i * 4 + 3]);
      out.colors = colors;
    }
    if (nodeData.length) out.nodeData = nodeData;
    if (faceData.length) out.faceData = faceData;
    return out;
  }
  /** Reads the current format and both legacy ones (`{nodes, faces}` and `{positions, indices}`). */
  static fromJSON(json) {
    if ("nodes" in json) {
      const mesh2 = new _Mesh();
      const idMap = /* @__PURE__ */ new Map();
      for (const nj of json.nodes) idMap.set(nj.id, mesh2.addNode(Vec3.fromJSON(nj.position), nj.data && Object.keys(nj.data).length ? nj.data : void 0));
      for (const fj of json.faces) mesh2.addFace(fj.nodes.map((n) => idMap.get(n)), fj.data && Object.keys(fj.data).length ? fj.data : void 0);
      mesh2.computeVertexNormals();
      return mesh2;
    }
    if ("indices" in json) return new _Mesh(json.positions, json.indices, json.normals, json.uvs);
    const mesh = new _Mesh(json.positions, [], json.normals, json.uvs, json.colors);
    for (const f of json.faces) mesh.addFace(f);
    if (json.nodeData) for (const [id, d] of json.nodeData) mesh._nodeData ? mesh._nodeData.set(id, d) : mesh._nodeData = /* @__PURE__ */ new Map([[id, d]]);
    if (json.faceData) for (const [id, d] of json.faceData) mesh._faceData ? mesh._faceData.set(id, d) : mesh._faceData = /* @__PURE__ */ new Map([[id, d]]);
    return mesh;
  }
  // ── Capacity ──
  _needNodes(n) {
    let cap = this._nodeAlive.length;
    if (n <= cap) return;
    while (cap < n) cap *= 2;
    this._pos = grow(this._pos, cap * 3);
    if (this._nrm) this._nrm = grow(this._nrm, cap * 3);
    if (this._uv) this._uv = grow(this._uv, cap * 2);
    if (this._col) this._col = grow(this._col, cap * 4);
    this._nodeAlive = grow(this._nodeAlive, cap);
    this._nodeFirstEdge = grow(this._nodeFirstEdge, cap, NONE);
    this._nodeFirstCorner = grow(this._nodeFirstCorner, cap, NONE);
  }
  _needEdges(n) {
    let cap = this._edgeAlive.length;
    if (n <= cap) return;
    while (cap < n) cap *= 2;
    this._edgeA = grow(this._edgeA, cap);
    this._edgeB = grow(this._edgeB, cap);
    this._edgeNext = grow(this._edgeNext, cap * 2, NONE);
    this._edgeFirstCorner = grow(this._edgeFirstCorner, cap, NONE);
    this._edgeAlive = grow(this._edgeAlive, cap);
  }
  _needFaces(n) {
    let cap = this._faceAlive.length;
    if (n <= cap) return;
    while (cap < n) cap *= 2;
    this._faceStart = grow(this._faceStart, cap + 1);
    this._faceAlive = grow(this._faceAlive, cap);
    if (this._faceNrm) this._faceNrm = grow(this._faceNrm, cap * 3);
  }
  _needCorners(n) {
    let cap = this._cVert.length;
    if (n <= cap) return;
    while (cap < n) cap *= 2;
    this._cVert = grow(this._cVert, cap);
    this._cFace = grow(this._cFace, cap);
    this._cEdge = grow(this._cEdge, cap, NONE);
    this._cNextInNode = grow(this._cNextInNode, cap, NONE);
    this._cNextInEdge = grow(this._cNextInEdge, cap, NONE);
  }
};

// src/scene/Scene.ts
var DEFAULT_STYLE = {
  color: "#6ee7b7",
  opacity: 1,
  wireframe: false,
  lineWidth: 2,
  pointSize: 0.1,
  doubleSided: true,
  visible: true
};
var Scene = class _Scene {
  constructor() {
    this.objects = /* @__PURE__ */ new Map();
    /** Per-scene, reset by clear(): see genId. */
    this.idCounter = 0;
    this.listeners = /* @__PURE__ */ new Set();
    this.selectedIds = /* @__PURE__ */ new Set();
    this.hoveredId = null;
    this.suspendDepth = 0;
    this.renderMode = "solid";
    this.lightingMode = "flat";
    this.environmentEnabled = false;
  }
  setRenderMode(mode) {
    if (this.renderMode === mode) return;
    this.renderMode = mode;
    this.emit({ type: "scene:renderMode", mode });
  }
  setLightingMode(mode) {
    if (this.lightingMode === mode) return;
    this.lightingMode = mode;
    this.emit({ type: "scene:lightingMode", mode });
  }
  setEnvironment(enabled) {
    if (this.environmentEnabled === enabled) return;
    this.environmentEnabled = enabled;
    this.emit({ type: "scene:environment", enabled });
  }
  // ── Subscription ──
  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(event) {
    if (this.suspendDepth > 0) return;
    for (const l of this.listeners) l(event);
  }
  /**
   * Run a block of mutations without emitting events.
   * Use this from sync/CRDT consumers to apply remote mutations
   * without echoing them back into the broadcast layer.
   * Nested calls are allowed; events resume when the outermost block ends.
   */
  withSuspendedEvents(fn) {
    this.suspendDepth++;
    try {
      return fn();
    } finally {
      this.suspendDepth--;
    }
  }
  // ── Object Management ──
  add(obj) {
    this.objects.set(obj.id, obj);
    this.emit({ type: "object:add", id: obj.id });
    return obj;
  }
  get(id) {
    return this.objects.get(id);
  }
  has(id) {
    return this.objects.has(id);
  }
  all() {
    return [...this.objects.values()];
  }
  count() {
    return this.objects.size;
  }
  update(id, changes) {
    const obj = this.objects.get(id);
    if (!obj) return;
    Object.assign(obj, changes);
    this.emit({ type: "object:update", id, changes });
  }
  setStyle(id, style) {
    const obj = this.objects.get(id);
    if (!obj) return;
    Object.assign(obj.style, style);
    this.emit({ type: "object:style", id, style });
  }
  remove(id) {
    this.objects.delete(id);
    this.selectedIds.delete(id);
    this.emit({ type: "object:remove", id });
  }
  clear() {
    this.objects.clear();
    this.selectedIds.clear();
    this.hoveredId = null;
    this.idCounter = 0;
    this.emit({ type: "scene:clear" });
  }
  /**
   * Ids are per-scene and restart at clear(), so a sketch that declares the
   * same objects in the same order gets the SAME ids on every run. That is what
   * lets a selection (highlight + transform gizmo) survive a re-run.
   *
   * The stability is POSITIONAL: ids follow declaration order, so a run that
   * adds, removes or reorders an object shifts every id after it — a selection
   * can then land on the neighbour. Sketches that need a selection to hold
   * across such a change should declare their objects unconditionally (and
   * vary style instead), or track their own keys.
   *
   * Ids stay unique within a scene; they are NOT unique across scenes or across
   * clears, so don't store them outside the scene's lifetime.
   */
  genId(prefix) {
    return `${prefix}_${++this.idCounter}`;
  }
  // ── Builder Methods ──
  addPoint(position, style, data) {
    return this.add({
      id: this.genId("pt"),
      type: "point",
      position,
      style: { ...DEFAULT_STYLE, color: "#ff6b6b", pointSize: 0.1, ...style },
      interactive: true,
      data: data ?? {}
    });
  }
  addPoints(positions, style) {
    return positions.map((p) => this.addPoint(p, style));
  }
  addSegment(start, end, style) {
    return this.add({
      id: this.genId("seg"),
      type: "segment",
      start,
      end,
      style: { ...DEFAULT_STYLE, color: "#4dabf7", ...style },
      interactive: true,
      data: {}
    });
  }
  addPolygon(vertices, style) {
    return this.add({
      id: this.genId("poly"),
      type: "polygon",
      vertices,
      style: { ...DEFAULT_STYLE, color: "#51cf66", opacity: 0.6, ...style },
      interactive: true,
      data: {}
    });
  }
  /** Batched polyline — renders as a single buffered Three.js Line, not one
   *  object per segment. Use for streamlines, hatches, sketched curves, etc.
   *  where N can be in the thousands. */
  addPolyline(vertices, style) {
    return this.add({
      id: this.genId("pline"),
      type: "polyline",
      vertices,
      style: { ...DEFAULT_STYLE, color: "#4dabf7", ...style },
      interactive: false,
      data: {}
    });
  }
  addMesh(mesh, style) {
    return this.add({
      id: this.genId("mesh"),
      type: "mesh",
      mesh,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true,
      data: {}
    });
  }
  addFlatMesh(data, style) {
    return this.add({
      id: this.genId("mesh"),
      type: "mesh",
      flatMeshData: data,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true,
      data: {}
    });
  }
  addCircle(center, radius, style) {
    return this.add({
      id: this.genId("cir"),
      type: "circle",
      center,
      radius,
      style: { ...DEFAULT_STYLE, color: "#ffd43b", ...style },
      interactive: true,
      data: {}
    });
  }
  addPlane(normal, distance, style) {
    return this.add({
      id: this.genId("plane"),
      type: "plane",
      normal,
      distance,
      style: { ...DEFAULT_STYLE, color: "#aaaaaa", opacity: 0.3, ...style },
      interactive: false,
      data: {}
    });
  }
  // ── Selection ──
  select(id) {
    this.selectedIds.add(id);
    this.emit({ type: "selection:change", ids: this.getSelection() });
  }
  deselect(id) {
    this.selectedIds.delete(id);
    this.emit({ type: "selection:change", ids: this.getSelection() });
  }
  toggleSelect(id) {
    if (this.selectedIds.has(id)) this.deselect(id);
    else this.select(id);
  }
  clearSelection() {
    this.selectedIds.clear();
    this.emit({ type: "selection:change", ids: [] });
  }
  getSelection() {
    return [...this.selectedIds];
  }
  isSelected(id) {
    return this.selectedIds.has(id);
  }
  // ── Hover ──
  setHover(id) {
    if (this.hoveredId === id) return;
    this.hoveredId = id;
    this.emit({ type: "hover:change", id });
  }
  getHover() {
    return this.hoveredId;
  }
  // ── Queries ──
  byType(type) {
    return this.all().filter((o) => o.type === type);
  }
  // ── Export ──
  /** Merges all visible mesh geometry into a single MeshData for OBJ export. */
  toMeshData() {
    const positions = [];
    const normals = [];
    const faces = [];
    for (const obj of this.objects.values()) {
      if (!obj.style.visible) continue;
      if (obj.style.noExport) continue;
      if (obj.mesh) {
        const nodeMap = /* @__PURE__ */ new Map();
        const offset = positions.length;
        for (const node of obj.mesh.nodesArray()) {
          nodeMap.set(node.id, offset + nodeMap.size);
          positions.push(node.position);
          normals.push(node.normal ?? Vec3.unitY());
        }
        for (const face of obj.mesh.facesArray()) {
          faces.push(face.nodes.map((n) => nodeMap.get(n)));
        }
      } else if (obj.flatMeshData) {
        const fd = obj.flatMeshData;
        const offset = positions.length;
        const vertCount = fd.positions.length / 3;
        for (let i = 0; i < vertCount; i++) {
          positions.push(new Vec3(fd.positions[i * 3], fd.positions[i * 3 + 1], fd.positions[i * 3 + 2]));
          normals.push(new Vec3(fd.normals[i * 3], fd.normals[i * 3 + 1], fd.normals[i * 3 + 2]));
        }
        for (let i = 0; i < fd.indices.length; i += 3) {
          faces.push([fd.indices[i] + offset, fd.indices[i + 1] + offset, fd.indices[i + 2] + offset]);
        }
      } else if (obj.type === "segment" && obj.start && obj.end && obj.style.tubeRadius) {
        _Scene._addTubeMesh(positions, normals, faces, obj.start, obj.end, obj.style.tubeRadius, 6);
      }
    }
    return { positions, normals, uvs: [], faces };
  }
  /** Generate a cylinder tube mesh between two points. */
  static _addTubeMesh(positions, normals, faces, a, b, radius, segs) {
    const dir = b.sub(a);
    const len = dir.len();
    if (len < 1e-8) return;
    const axZ = dir.mul(1 / len);
    const tmp = Math.abs(axZ.x) < 0.9 ? new Vec3(1, 0, 0) : new Vec3(0, 1, 0);
    const axX = axZ.cross(tmp).normalize();
    const axY = axZ.cross(axX);
    const offset = positions.length;
    for (let ring = 0; ring < 2; ring++) {
      const center = ring === 0 ? a : b;
      for (let i = 0; i < segs; i++) {
        const angle = i / segs * Math.PI * 2;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const nx = axX.x * cos + axY.x * sin;
        const ny = axX.y * cos + axY.y * sin;
        const nz = axX.z * cos + axY.z * sin;
        positions.push(new Vec3(center.x + nx * radius, center.y + ny * radius, center.z + nz * radius));
        normals.push(new Vec3(nx, ny, nz));
      }
    }
    for (let i = 0; i < segs; i++) {
      const i0 = offset + i;
      const i1 = offset + (i + 1) % segs;
      const i2 = offset + segs + (i + 1) % segs;
      const i3 = offset + segs + i;
      faces.push([i0, i1, i2, i3]);
    }
  }
  // ── Serialization ──
  toJSON() {
    return {
      objects: this.all().map((obj) => ({
        ...obj,
        position: obj.position?.toJSON(),
        start: obj.start?.toJSON(),
        end: obj.end?.toJSON(),
        vertices: obj.vertices?.map((v) => v.toJSON()),
        center: obj.center?.toJSON(),
        normal: obj.normal?.toJSON(),
        mesh: obj.mesh?.toJSON()
      }))
    };
  }
  static fromJSON(json) {
    const scene = new _Scene();
    for (const obj of json.objects) {
      const sceneObj = {
        ...obj,
        position: obj.position ? Vec3.fromJSON(obj.position) : void 0,
        start: obj.start ? Vec3.fromJSON(obj.start) : void 0,
        end: obj.end ? Vec3.fromJSON(obj.end) : void 0,
        vertices: obj.vertices?.map((v) => Vec3.fromJSON(v)),
        center: obj.center ? Vec3.fromJSON(obj.center) : void 0,
        normal: obj.normal ? Vec3.fromJSON(obj.normal) : void 0,
        mesh: obj.mesh ? Mesh.fromJSON(obj.mesh) : void 0
      };
      scene.objects.set(sceneObj.id, sceneObj);
      const match = sceneObj.id.match(/_(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > scene.idCounter) scene.idCounter = num;
      }
    }
    return scene;
  }
};

export {
  HMath,
  MathUtils,
  Vec2,
  Vec3,
  Vec4,
  Mat4,
  VecMath,
  HPlane,
  AABB,
  Segment,
  closestPointOnSegment,
  segmentSegmentClosest,
  Triangle,
  Mesh,
  Scene
};
