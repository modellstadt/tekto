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

// src/core/geometry/mesh/ConnectedMesh.ts
var ConnectedMesh = class _ConnectedMesh {
  constructor() {
    this._nodes = /* @__PURE__ */ new Map();
    this._edges = /* @__PURE__ */ new Map();
    this._faces = /* @__PURE__ */ new Map();
    this._nextNodeId = 0;
    this._nextEdgeId = 0;
    this._nextFaceId = 0;
    this._bounds = null;
  }
  // ── Accessors ──
  get nodeCount() {
    return this._nodes.size;
  }
  get edgeCount() {
    return this._edges.size;
  }
  get faceCount() {
    return this._faces.size;
  }
  node(id) {
    return this._nodes.get(id);
  }
  edge(id) {
    return this._edges.get(id);
  }
  face(id) {
    return this._faces.get(id);
  }
  nodes() {
    return this._nodes.values();
  }
  edges() {
    return this._edges.values();
  }
  faces() {
    return this._faces.values();
  }
  nodesArray() {
    return [...this._nodes.values()];
  }
  edgesArray() {
    return [...this._edges.values()];
  }
  facesArray() {
    return [...this._faces.values()];
  }
  // ── Topology Builders ──
  addNode(position, data = {}) {
    const id = this._nextNodeId++;
    this._nodes.set(id, { id, position, edges: [], faces: [], data });
    this._bounds = null;
    return id;
  }
  addNodes(positions) {
    return positions.map((p) => this.addNode(p));
  }
  addEdge(nodeA, nodeB, data = {}) {
    const existing = this.findEdge(nodeA, nodeB);
    if (existing !== void 0) return existing;
    const id = this._nextEdgeId++;
    this._edges.set(id, { id, nodes: [nodeA, nodeB], faces: [], data });
    this._nodes.get(nodeA).edges.push(id);
    this._nodes.get(nodeB).edges.push(id);
    return id;
  }
  addFace(nodeIds, data = {}) {
    const id = this._nextFaceId++;
    const edgeIds = [];
    for (let i = 0; i < nodeIds.length; i++) {
      const a = nodeIds[i];
      const b = nodeIds[(i + 1) % nodeIds.length];
      const eid = this.addEdge(a, b);
      edgeIds.push(eid);
      this._edges.get(eid).faces.push(id);
    }
    for (const nid of nodeIds) {
      this._nodes.get(nid).faces.push(id);
    }
    this._faces.set(id, { id, nodes: nodeIds, edges: edgeIds, data });
    return id;
  }
  addTriangle(a, b, c, data = {}) {
    return this.addFace([a, b, c], data);
  }
  addQuad(a, b, c, d, data = {}) {
    return this.addFace([a, b, c, d], data);
  }
  // ── Removal ──
  removeNode(id) {
    const node = this._nodes.get(id);
    if (!node) return;
    for (const fid of [...node.faces]) this.removeFace(fid);
    for (const eid of [...node.edges]) this.removeEdge(eid);
    this._nodes.delete(id);
    this._bounds = null;
  }
  removeEdge(id) {
    const edge = this._edges.get(id);
    if (!edge) return;
    for (const fid of [...edge.faces]) this.removeFace(fid);
    for (const nid of edge.nodes) {
      const node = this._nodes.get(nid);
      if (node) node.edges = node.edges.filter((e) => e !== id);
    }
    this._edges.delete(id);
  }
  removeFace(id) {
    const face = this._faces.get(id);
    if (!face) return;
    for (const eid of face.edges) {
      const edge = this._edges.get(eid);
      if (edge) edge.faces = edge.faces.filter((f) => f !== id);
    }
    for (const nid of face.nodes) {
      const node = this._nodes.get(nid);
      if (node) node.faces = node.faces.filter((f) => f !== id);
    }
    this._faces.delete(id);
  }
  clear() {
    this._nodes.clear();
    this._edges.clear();
    this._faces.clear();
    this._nextNodeId = 0;
    this._nextEdgeId = 0;
    this._nextFaceId = 0;
    this._bounds = null;
  }
  // ── Queries ──
  findEdge(nodeA, nodeB) {
    const na = this._nodes.get(nodeA);
    if (!na) return void 0;
    for (const eid of na.edges) {
      const e = this._edges.get(eid);
      if (e.nodes[0] === nodeA && e.nodes[1] === nodeB || e.nodes[0] === nodeB && e.nodes[1] === nodeA) {
        return eid;
      }
    }
    return void 0;
  }
  nodeNeighbors(nodeId) {
    const node = this._nodes.get(nodeId);
    if (!node) return [];
    const neighbors = [];
    for (const eid of node.edges) {
      const edge = this._edges.get(eid);
      neighbors.push(edge.nodes[0] === nodeId ? edge.nodes[1] : edge.nodes[0]);
    }
    return neighbors;
  }
  edgeFaces(edgeId) {
    const edge = this._edges.get(edgeId);
    if (!edge) return [];
    return edge.faces.map((fid) => this._faces.get(fid)).filter(Boolean);
  }
  isBoundaryEdge(edgeId) {
    const edge = this._edges.get(edgeId);
    return edge ? edge.faces.length < 2 : false;
  }
  isBoundaryNode(nodeId) {
    const node = this._nodes.get(nodeId);
    if (!node) return false;
    return node.edges.some((eid) => this.isBoundaryEdge(eid));
  }
  boundaryEdges() {
    return this.edgesArray().filter((e) => e.faces.length < 2);
  }
  edgeOtherNode(edgeId, nodeId) {
    const edge = this._edges.get(edgeId);
    return edge.nodes[0] === nodeId ? edge.nodes[1] : edge.nodes[0];
  }
  bounds() {
    if (this._bounds) return this._bounds;
    this._bounds = AABB.fromPoints(this.nodesArray().map((n) => n.position));
    return this._bounds;
  }
  faceTriangle(faceId) {
    const face = this._faces.get(faceId);
    if (!face || face.nodes.length !== 3) return null;
    return new Triangle(
      this._nodes.get(face.nodes[0]).position,
      this._nodes.get(face.nodes[1]).position,
      this._nodes.get(face.nodes[2]).position
    );
  }
  // ── Normals ──
  computeFaceNormals() {
    for (const face of this._faces.values()) {
      if (face.nodes.length < 3) continue;
      const a = this._nodes.get(face.nodes[0]).position;
      const b = this._nodes.get(face.nodes[1]).position;
      const c = this._nodes.get(face.nodes[2]).position;
      face.normal = b.sub(a).cross(c.sub(a)).normalize();
    }
  }
  computeVertexNormals() {
    this.computeFaceNormals();
    for (const node of this._nodes.values()) {
      let sum = Vec3.zero();
      for (const fid of node.faces) {
        const face = this._faces.get(fid);
        if (face?.normal) sum = sum.add(face.normal);
      }
      node.normal = sum.normalize();
    }
  }
  // ── Topology Operations ──
  splitEdge(edgeId, t = 0.5) {
    const edge = this._edges.get(edgeId);
    if (!edge) return -1;
    const nA = this._nodes.get(edge.nodes[0]);
    const nB = this._nodes.get(edge.nodes[1]);
    const midPos = nA.position.lerp(nB.position, t);
    const midId = this.addNode(midPos);
    const facesToSplit = [...edge.faces];
    for (const fid of facesToSplit) {
      const face = this._faces.get(fid);
      const nodeList = face.nodes;
      const idxA = nodeList.indexOf(edge.nodes[0]);
      const idxB = nodeList.indexOf(edge.nodes[1]);
      const newNodes = [...nodeList];
      const insertAt = Math.max(idxA, idxB);
      if (Math.abs(idxA - idxB) === 1) {
        newNodes.splice(insertAt, 0, midId);
      } else {
        newNodes.push(midId);
      }
      this.removeFace(fid);
      if (nodeList.length === 3) {
        const other = nodeList.find((n) => n !== edge.nodes[0] && n !== edge.nodes[1]);
        this.addFace([edge.nodes[0], midId, other], face.data);
        this.addFace([midId, edge.nodes[1], other], face.data);
      } else {
        this.addFace(newNodes, face.data);
      }
    }
    this.removeEdge(edgeId);
    return midId;
  }
  collapseEdge(edgeId) {
    const edge = this._edges.get(edgeId);
    if (!edge) return -1;
    const [keepId, removeId] = edge.nodes;
    const keepNode = this._nodes.get(keepId);
    const removeNode = this._nodes.get(removeId);
    keepNode.position = keepNode.position.lerp(removeNode.position, 0.5);
    for (const fid of [...removeNode.faces]) {
      const face = this._faces.get(fid);
      if (!face) continue;
      const newNodes = face.nodes.map((n) => n === removeId ? keepId : n);
      const unique = [...new Set(newNodes)];
      this.removeFace(fid);
      if (unique.length >= 3) {
        this.addFace(unique, face.data);
      }
    }
    this.removeNode(removeId);
    this._bounds = null;
    return keepId;
  }
  // ── Conversion ──
  static fromIndexedTriangles(positions, indices, data) {
    const mesh = new _ConnectedMesh();
    const nodeIds = mesh.addNodes(positions);
    for (let i = 0; i < indices.length; i += 3) {
      const faceData = data?.[i / 3] ?? {};
      mesh.addTriangle(
        nodeIds[indices[i]],
        nodeIds[indices[i + 1]],
        nodeIds[indices[i + 2]],
        faceData
      );
    }
    mesh.computeVertexNormals();
    return mesh;
  }
  static fromFaces(positions, faces) {
    const mesh = new _ConnectedMesh();
    const nodeIds = mesh.addNodes(positions);
    for (const faceNodes of faces) {
      mesh.addFace(faceNodes.map((i) => nodeIds[i]));
    }
    mesh.computeVertexNormals();
    return mesh;
  }
  toIndexedTriangles() {
    const nodeMap = /* @__PURE__ */ new Map();
    const posArray = [];
    const normArray = [];
    let idx = 0;
    for (const node of this._nodes.values()) {
      nodeMap.set(node.id, idx++);
      posArray.push(node.position.x, node.position.y, node.position.z);
      const n = node.normal ?? Vec3.unitY();
      normArray.push(n.x, n.y, n.z);
    }
    const indexArray = [];
    for (const face of this._faces.values()) {
      const nids = face.nodes.map((n) => nodeMap.get(n));
      for (let i = 1; i < nids.length - 1; i++) {
        indexArray.push(nids[0], nids[i], nids[i + 1]);
      }
    }
    return {
      positions: new Float32Array(posArray),
      indices: new Uint32Array(indexArray),
      normals: new Float32Array(normArray)
    };
  }
  // ── Serialization ──
  toJSON() {
    return {
      nodes: this.nodesArray().map((n) => ({
        id: n.id,
        position: n.position.toJSON(),
        data: n.data
      })),
      faces: this.facesArray().map((f) => ({
        id: f.id,
        nodes: f.nodes,
        data: f.data
      }))
    };
  }
  static fromJSON(json) {
    const mesh = new _ConnectedMesh();
    const idMap = /* @__PURE__ */ new Map();
    for (const nj of json.nodes) {
      const newId = mesh.addNode(Vec3.fromJSON(nj.position), nj.data ?? {});
      idMap.set(nj.id, newId);
    }
    for (const fj of json.faces) {
      mesh.addFace(fj.nodes.map((n) => idMap.get(n)), fj.data ?? {});
    }
    mesh.computeVertexNormals();
    return mesh;
  }
  clone() {
    return _ConnectedMesh.fromJSON(this.toJSON());
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
var _idCounter = 0;
function genId(prefix) {
  return `${prefix}_${++_idCounter}`;
}
var Scene = class _Scene {
  constructor() {
    this.objects = /* @__PURE__ */ new Map();
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
    this.emit({ type: "scene:clear" });
  }
  // ── Builder Methods ──
  addPoint(position, style, data) {
    return this.add({
      id: genId("pt"),
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
      id: genId("seg"),
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
      id: genId("poly"),
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
      id: genId("pline"),
      type: "polyline",
      vertices,
      style: { ...DEFAULT_STYLE, color: "#4dabf7", ...style },
      interactive: false,
      data: {}
    });
  }
  addMesh(mesh, style) {
    return this.add({
      id: genId("mesh"),
      type: "mesh",
      mesh,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true,
      data: {}
    });
  }
  addFlatMesh(data, style) {
    return this.add({
      id: genId("mesh"),
      type: "mesh",
      flatMeshData: data,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true,
      data: {}
    });
  }
  addCircle(center, radius, style) {
    return this.add({
      id: genId("cir"),
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
      id: genId("plane"),
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
        mesh: obj.mesh ? ConnectedMesh.fromJSON(obj.mesh) : void 0
      };
      scene.objects.set(sceneObj.id, sceneObj);
      const match = sceneObj.id.match(/_(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > _idCounter) _idCounter = num;
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
  ConnectedMesh,
  Scene
};
