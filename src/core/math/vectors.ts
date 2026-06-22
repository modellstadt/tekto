/**
 * Tekto Core Math
 *
 * Immutable vector/matrix types with fluent API.
 * All operations return new instances (no mutation).
 */

// ─── Vec2 ────────────────────────────────────

export class Vec2 {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}

  static zero() { return new Vec2(0, 0); }
  static one() { return new Vec2(1, 1); }
  static unitX() { return new Vec2(1, 0); }
  static unitY() { return new Vec2(0, 1); }
  static fromAngle(radians: number) { return new Vec2(Math.cos(radians), Math.sin(radians)); }
  static fromArray(a: number[]) { return new Vec2(a[0] ?? 0, a[1] ?? 0); }

  add(v: Vec2): Vec2 { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2): Vec2 { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number): Vec2 { return new Vec2(this.x * s, this.y * s); }
  div(s: number): Vec2 { return new Vec2(this.x / s, this.y / s); }
  neg(): Vec2 { return new Vec2(-this.x, -this.y); }

  dot(v: Vec2): number { return this.x * v.x + this.y * v.y; }
  cross(v: Vec2): number { return this.x * v.y - this.y * v.x; }

  len(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lenSq(): number { return this.x * this.x + this.y * this.y; }
  normalize(): Vec2 { const l = this.len(); return l > 1e-12 ? this.div(l) : Vec2.zero(); }

  distTo(v: Vec2): number { return this.sub(v).len(); }
  distSqTo(v: Vec2): number { return this.sub(v).lenSq(); }

  lerp(v: Vec2, t: number): Vec2 { return new Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t); }
  angle(): number { return Math.atan2(this.y, this.x); }
  angleTo(v: Vec2): number { return Math.atan2(this.cross(v), this.dot(v)); }
  rotate(radians: number): Vec2 {
    const c = Math.cos(radians), s = Math.sin(radians);
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }
  perp(): Vec2 { return new Vec2(-this.y, this.x); }

  almostEqual(v: Vec2, eps = 1e-10): boolean {
    return Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps;
  }

  toArray(): [number, number] { return [this.x, this.y]; }
  toVec3(z = 0): Vec3 { return new Vec3(this.x, this.y, z); }
  toString(): string { return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)})`; }
  clone(): Vec2 { return new Vec2(this.x, this.y); }
  toJSON(): { x: number; y: number } { return { x: this.x, y: this.y }; }
  static fromJSON(j: { x: number; y: number }): Vec2 { return new Vec2(j.x, j.y); }
}

// ─── Vec3 ────────────────────────────────────

export class Vec3 {
  constructor(
    public readonly x: number = 0,
    public readonly y: number = 0,
    public readonly z: number = 0
  ) {}

  static zero() { return new Vec3(0, 0, 0); }
  static one() { return new Vec3(1, 1, 1); }
  static unitX() { return new Vec3(1, 0, 0); }
  static unitY() { return new Vec3(0, 1, 0); }
  static unitZ() { return new Vec3(0, 0, 1); }
  static fromArray(a: number[]) { return new Vec3(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0); }

  add(v: Vec3): Vec3 { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v: Vec3): Vec3 { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(s: number): Vec3 { return new Vec3(this.x * s, this.y * s, this.z * s); }
  div(s: number): Vec3 { return new Vec3(this.x / s, this.y / s, this.z / s); }
  neg(): Vec3 { return new Vec3(-this.x, -this.y, -this.z); }

  dot(v: Vec3): number { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  len(): number { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  lenSq(): number { return this.x * this.x + this.y * this.y + this.z * this.z; }
  normalize(): Vec3 { const l = this.len(); return l > 1e-12 ? this.div(l) : Vec3.zero(); }

  distTo(v: Vec3): number { return this.sub(v).len(); }
  distSqTo(v: Vec3): number { return this.sub(v).lenSq(); }

  lerp(v: Vec3, t: number): Vec3 {
    return new Vec3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t
    );
  }

  project(onto: Vec3): Vec3 {
    const d = onto.lenSq();
    return d > 1e-12 ? onto.mul(this.dot(onto) / d) : Vec3.zero();
  }

  reflect(normal: Vec3): Vec3 {
    return this.sub(normal.mul(2 * this.dot(normal)));
  }

  almostEqual(v: Vec3, eps = 1e-10): boolean {
    return Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps && Math.abs(this.z - v.z) < eps;
  }

  toArray(): [number, number, number] { return [this.x, this.y, this.z]; }
  toVec2(): Vec2 { return new Vec2(this.x, this.y); }
  xz(): Vec2 { return new Vec2(this.x, this.z); }
  toString(): string { return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`; }
  clone(): Vec3 { return new Vec3(this.x, this.y, this.z); }
  toJSON(): { x: number; y: number; z: number } { return { x: this.x, y: this.y, z: this.z }; }
  static fromJSON(j: { x: number; y: number; z: number }): Vec3 { return new Vec3(j.x, j.y, j.z); }
}

// ─── Vec4 ────────────────────────────────────

export class Vec4 {
  constructor(
    public readonly x: number = 0,
    public readonly y: number = 0,
    public readonly z: number = 0,
    public readonly w: number = 0
  ) {}

  dot(v: Vec4): number { return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w; }
  toVec3(): Vec3 { return new Vec3(this.x, this.y, this.z); }
  toArray(): [number, number, number, number] { return [this.x, this.y, this.z, this.w]; }
}

// ─── Mat4 (column-major, like OpenGL/Three.js) ──

export class Mat4 {
  /** 16 elements in column-major order */
  constructor(public readonly m: Float64Array = new Float64Array(16)) {
    if (m.length === 0) {
      this.m = Mat4.identity().m;
    }
  }

  static identity(): Mat4 {
    const m = new Float64Array(16);
    m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
    return new Mat4(m);
  }

  static translation(x: number, y: number, z: number): Mat4 {
    const m = Mat4.identity().m.slice() as unknown as Float64Array;
    m[12] = x; m[13] = y; m[14] = z;
    return new Mat4(new Float64Array(m));
  }

  static scaling(x: number, y: number, z: number): Mat4 {
    const m = new Float64Array(16);
    m[0] = x; m[5] = y; m[10] = z; m[15] = 1;
    return new Mat4(m);
  }

  static rotationX(rad: number): Mat4 {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = Mat4.identity().m.slice() as unknown as Float64Array;
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
    return new Mat4(new Float64Array(m));
  }

  static rotationY(rad: number): Mat4 {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = Mat4.identity().m.slice() as unknown as Float64Array;
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
    return new Mat4(new Float64Array(m));
  }

  static rotationZ(rad: number): Mat4 {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = Mat4.identity().m.slice() as unknown as Float64Array;
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
    return new Mat4(new Float64Array(m));
  }

  static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const z = eye.sub(target).normalize();
    const x = up.cross(z).normalize();
    const y = z.cross(x);
    const m = new Float64Array(16);
    m[0] = x.x; m[1] = y.x; m[2] = z.x; m[3] = 0;
    m[4] = x.y; m[5] = y.y; m[6] = z.y; m[7] = 0;
    m[8] = x.z; m[9] = y.z; m[10] = z.z; m[11] = 0;
    m[12] = -x.dot(eye); m[13] = -y.dot(eye); m[14] = -z.dot(eye); m[15] = 1;
    return new Mat4(m);
  }

  multiply(b: Mat4): Mat4 {
    const a = this.m, bm = b.m, r = new Float64Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        r[col * 4 + row] =
          a[row] * bm[col * 4] + a[4 + row] * bm[col * 4 + 1] +
          a[8 + row] * bm[col * 4 + 2] + a[12 + row] * bm[col * 4 + 3];
      }
    }
    return new Mat4(r);
  }

  transformPoint(v: Vec3): Vec3 {
    const m = this.m;
    const w = m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15];
    return new Vec3(
      (m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12]) / w,
      (m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13]) / w,
      (m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14]) / w
    );
  }

  transformDirection(v: Vec3): Vec3 {
    const m = this.m;
    return new Vec3(
      m[0] * v.x + m[4] * v.y + m[8] * v.z,
      m[1] * v.x + m[5] * v.y + m[9] * v.z,
      m[2] * v.x + m[6] * v.y + m[10] * v.z
    );
  }

  invert(): Mat4 {
    const m = this.m, r = new Float64Array(16);
    const a00=m[0],a01=m[1],a02=m[2],a03=m[3],
          a10=m[4],a11=m[5],a12=m[6],a13=m[7],
          a20=m[8],a21=m[9],a22=m[10],a23=m[11],
          a30=m[12],a31=m[13],a32=m[14],a33=m[15];
    const b00=a00*a11-a01*a10, b01=a00*a12-a02*a10,
          b02=a00*a13-a03*a10, b03=a01*a12-a02*a11,
          b04=a01*a13-a03*a11, b05=a02*a13-a03*a12,
          b06=a20*a31-a21*a30, b07=a20*a32-a22*a30,
          b08=a20*a33-a23*a30, b09=a21*a32-a22*a31,
          b10=a21*a33-a23*a31, b11=a22*a33-a23*a32;
    let det = b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
    if (Math.abs(det) < 1e-12) return Mat4.identity();
    det = 1 / det;
    r[0]=(a11*b11-a12*b10+a13*b09)*det;
    r[1]=(a02*b10-a01*b11-a03*b09)*det;
    r[2]=(a31*b05-a32*b04+a33*b03)*det;
    r[3]=(a22*b04-a21*b05-a23*b03)*det;
    r[4]=(a12*b08-a10*b11-a13*b07)*det;
    r[5]=(a00*b11-a02*b08+a03*b07)*det;
    r[6]=(a32*b02-a30*b05-a33*b01)*det;
    r[7]=(a20*b05-a22*b02+a23*b01)*det;
    r[8]=(a10*b10-a11*b08+a13*b06)*det;
    r[9]=(a01*b08-a00*b10-a03*b06)*det;
    r[10]=(a30*b04-a31*b02+a33*b00)*det;
    r[11]=(a21*b02-a20*b04-a23*b00)*det;
    r[12]=(a11*b07-a10*b09-a12*b06)*det;
    r[13]=(a00*b09-a01*b07+a02*b06)*det;
    r[14]=(a31*b01-a30*b03-a32*b00)*det;
    r[15]=(a20*b03-a21*b01+a22*b00)*det;
    return new Mat4(r);
  }

  toArray(): number[] { return Array.from(this.m); }
}

// ─── Utility (re-exported from HMath.ts) ─────

export { HMath, MathUtils } from "./HMath";
