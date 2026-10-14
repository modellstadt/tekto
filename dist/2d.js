"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/2d.ts
var d_exports = {};
__export(d_exports, {
  Polygon2D: () => Polygon2D,
  PolygonBool: () => PolygonBool,
  Segment: () => Segment,
  Sheet: () => Sheet,
  SheetCanvas: () => SheetCanvas,
  SheetView: () => SheetView,
  Sketch2DInstance: () => Sketch2DInstance,
  Vec2: () => Vec2,
  Vec3: () => Vec3,
  closestPointOnSegment: () => closestPointOnSegment,
  createRandom: () => createRandom,
  download: () => download,
  drawSheet: () => drawSheet,
  fitSheet: () => fitSheet,
  noise: () => noise,
  pickPrim: () => pickPrim,
  segmentSegmentClosest: () => segmentSegmentClosest,
  sketch2d: () => sketch2d,
  stampName: () => stampName,
  writeDxf2D: () => writeDxf2D
});
module.exports = __toCommonJS(d_exports);

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

// src/core/math/noise.ts
var P = [
  151,
  160,
  137,
  91,
  90,
  15,
  131,
  13,
  201,
  95,
  96,
  53,
  194,
  233,
  7,
  225,
  140,
  36,
  103,
  30,
  69,
  142,
  8,
  99,
  37,
  240,
  21,
  10,
  23,
  190,
  6,
  148,
  247,
  120,
  234,
  75,
  0,
  26,
  197,
  62,
  94,
  252,
  219,
  203,
  117,
  35,
  11,
  32,
  57,
  177,
  33,
  88,
  237,
  149,
  56,
  87,
  174,
  20,
  125,
  136,
  171,
  168,
  68,
  175,
  74,
  165,
  71,
  134,
  139,
  48,
  27,
  166,
  77,
  146,
  158,
  231,
  83,
  111,
  229,
  122,
  60,
  211,
  133,
  230,
  220,
  105,
  92,
  41,
  55,
  46,
  245,
  40,
  244,
  102,
  143,
  54,
  65,
  25,
  63,
  161,
  1,
  216,
  80,
  73,
  209,
  76,
  132,
  187,
  208,
  89,
  18,
  169,
  200,
  196,
  135,
  130,
  116,
  188,
  159,
  86,
  164,
  100,
  109,
  198,
  173,
  186,
  3,
  64,
  52,
  217,
  226,
  250,
  124,
  123,
  5,
  202,
  38,
  147,
  118,
  126,
  255,
  82,
  85,
  212,
  207,
  206,
  59,
  227,
  47,
  16,
  58,
  17,
  182,
  189,
  28,
  42,
  223,
  183,
  170,
  213,
  119,
  248,
  152,
  2,
  44,
  154,
  163,
  70,
  221,
  153,
  101,
  155,
  167,
  43,
  172,
  9,
  129,
  22,
  39,
  253,
  19,
  98,
  108,
  110,
  79,
  113,
  224,
  232,
  178,
  185,
  112,
  104,
  218,
  246,
  97,
  228,
  251,
  34,
  242,
  193,
  238,
  210,
  144,
  12,
  191,
  179,
  162,
  241,
  81,
  51,
  145,
  235,
  249,
  14,
  239,
  107,
  49,
  192,
  214,
  31,
  181,
  199,
  106,
  157,
  184,
  84,
  204,
  176,
  115,
  121,
  50,
  45,
  127,
  4,
  150,
  254,
  138,
  236,
  205,
  93,
  222,
  114,
  67,
  29,
  24,
  72,
  243,
  141,
  128,
  195,
  78,
  66,
  215,
  61,
  156,
  180
];
var perm = new Uint8Array(512);
for (let i = 0; i < 512; i++) perm[i] = P[i & 255];
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(t, a, b) {
  return a + t * (b - a);
}
function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
function noise3D(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = perm[X] + Y;
  const AA = perm[A] + Z;
  const AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y;
  const BA = perm[B] + Z;
  const BB = perm[B + 1] + Z;
  const res = lerp(
    w,
    lerp(
      v,
      lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
      lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1))
    )
  );
  return (res + 1) * 0.5;
}
function noise(x, y = 0, z = 0) {
  return noise3D(x, y, z);
}

// src/core/math/random.ts
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function createRandom(seed) {
  let rng = mulberry32(seed ?? Date.now() ^ Math.random() * 4294967295);
  return {
    random(min, max) {
      const v = rng();
      if (min === void 0) return v;
      if (max === void 0) return v * min;
      return min + v * (max - min);
    },
    randomSeed(s) {
      rng = mulberry32(s);
    }
  };
}

// src/gui/Params.ts
var ParamStore = class {
  constructor(schema) {
    this.values = {};
    this.listeners = /* @__PURE__ */ new Set();
    this.keyListeners = /* @__PURE__ */ new Map();
    this.schema = schema;
    for (const [key, def] of Object.entries(schema)) {
      if (def.type !== "button") {
        this.values[key] = def.default;
      }
    }
  }
  get(key) {
    return this.values[key];
  }
  set(key, value) {
    const def = this.schema[key];
    if (!def || def.type === "button") return;
    if (def.type === "float" || def.type === "int") {
      value = Math.max(def.min, Math.min(def.max, value));
      if (def.type === "int") value = Math.round(value);
    }
    if (def.type === "vec3" && Array.isArray(value)) {
      const lo = def.min, hi = def.max;
      value = value.map((v, i) => Math.max(lo?.[i] ?? -Infinity, Math.min(hi?.[i] ?? Infinity, v)));
    }
    if (def.type === "select" && !def.options.includes(value)) return;
    this.values[key] = value;
    for (const l of this.listeners) l(key, value, this.values);
    const kl = this.keyListeners.get(key);
    if (kl) for (const l of kl) l(value);
  }
  /**
   * Dynamically add (or refresh) a parameter definition. Used by the sketch
   * APIs, whose immediate-mode `lab.slider(...)` calls declare params during
   * the sketch run. Initializes the value from `default` the first time;
   * an existing value is preserved so re-defining across re-runs is cheap.
   * Does NOT notify listeners (definition is structure, not a value change).
   */
  define(key, def) {
    const existed = key in this.schema;
    this.schema[key] = def;
    if (!existed && def.type !== "button") {
      this.values[key] = def.default;
    }
  }
  /** Remove a parameter (and its value). Does not notify listeners. */
  remove(key) {
    delete this.schema[key];
    delete this.values[key];
    this.keyListeners.delete(key);
  }
  has(key) {
    return key in this.schema;
  }
  keys() {
    return Object.keys(this.schema);
  }
  /** Get all current values */
  getAll() {
    return { ...this.values };
  }
  /** Get the schema for a specific key */
  getDef(key) {
    return this.schema[key];
  }
  /** Get entire schema */
  getSchema() {
    return this.schema;
  }
  /** Listen to all changes */
  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /** Listen to a specific key */
  onKey(key, listener) {
    if (!this.keyListeners.has(key)) this.keyListeners.set(key, /* @__PURE__ */ new Set());
    this.keyListeners.get(key).add(listener);
    return () => this.keyListeners.get(key)?.delete(listener);
  }
  /** Reset all to defaults */
  reset() {
    for (const [key, def] of Object.entries(this.schema)) {
      if (def.type !== "button") {
        this.set(key, def.default);
      }
    }
  }
  /** Serialization */
  toJSON() {
    return { ...this.values };
  }
  loadJSON(json) {
    for (const [key, value] of Object.entries(json)) {
      if (key in this.schema) {
        this.set(key, value);
      }
    }
  }
  /**
   * The keys a person or an agent means by `name`, most specific first: the exact key;
   * else the control's label, ignoring case ("Radius"); else "Group:Label" for sketch
   * keys, which read `type:group:label`. One key when the name is unambiguous.
   */
  findKeys(name) {
    if (name in this.schema) return [name];
    const n = name.trim().toLowerCase();
    const keys = Object.keys(this.schema);
    const byLabel = keys.filter((k) => (this.schema[k].label ?? k).toLowerCase() === n);
    if (byLabel.length) return byLabel;
    return keys.filter((k) => {
      const parts = k.split(":");
      return parts.length >= 3 && `${parts[1]}:${parts.slice(2).join(":")}`.toLowerCase() === n;
    });
  }
  /**
   * Set params by key or label (see `findKeys`) and say what could not be applied,
   * instead of dropping it the way `loadJSON` does. For tools and agents.
   */
  setByName(values) {
    const applied = [], unknown = [];
    const ambiguous = [];
    for (const [name, value] of Object.entries(values)) {
      const keys = this.findKeys(name);
      if (keys.length === 0) unknown.push(name);
      else if (keys.length > 1) ambiguous.push({ name, keys });
      else {
        this.set(keys[0], value);
        applied.push(keys[0]);
      }
    }
    return { applied, unknown, ambiguous };
  }
  /** Every param as the name to use with `setByName`: its label, or "Group:Label" when two share a label. */
  names() {
    const keys = Object.keys(this.schema);
    const label = (k) => this.schema[k].label ?? k;
    return keys.map((k) => {
      if (keys.filter((o) => label(o).toLowerCase() === label(k).toLowerCase()).length === 1) return label(k);
      const parts = k.split(":");
      return parts.length >= 3 && parts[1] ? `${parts[1]}:${parts.slice(2).join(":")}` : k;
    });
  }
};

// src/gui/theme.ts
var DARK = {
  isDark: true,
  bg: "#07080e",
  panelBg: "#0c0d16",
  popupBg: "#0d0f1e",
  border: "#16182a",
  controlBorder: "#1e2140",
  text: "#b8bdd4",
  textDim: "#7a80a0",
  textFaint: "#5a6080",
  accent: "#ffffff",
  hoverBg: "rgba(255,255,255,.06)",
  fieldBg: "#07080e",
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
var LIGHT = {
  isDark: false,
  bg: "#f4f5f8",
  panelBg: "#ffffff",
  popupBg: "#f5f6fa",
  border: "#e0e2ea",
  controlBorder: "#d0d3de",
  text: "#2a2d3a",
  textDim: "#5a6080",
  textFaint: "#8a8fa0",
  accent: "#16182c",
  hoverBg: "rgba(0,0,0,.05)",
  fieldBg: "#f4f5f8",
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
function getTheme(mode = "dark") {
  return mode === "light" ? LIGHT : DARK;
}

// src/gui/ControlPanel.ts
var DEFAULT_GROUP = "Parameters";
var SLIDER_STYLE_ID = "tekto-slider-style";
function ensureSliderStyle(doc) {
  if (doc.getElementById(SLIDER_STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = SLIDER_STYLE_ID;
  el.textContent = `
    .tekto-slider{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;height:16px;outline:none;padding:0;}
    .tekto-slider::-webkit-slider-runnable-track{height:4px;background:var(--tekto-track,#2a2d44);}
    .tekto-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:7px;height:14px;margin-top:-5px;border-radius:0;background:var(--tekto-thumb,#ffffff);}
    .tekto-slider::-moz-range-track{height:4px;background:var(--tekto-track,#2a2d44);}
    .tekto-slider::-moz-range-thumb{width:7px;height:14px;border-radius:0;border:none;background:var(--tekto-thumb,#ffffff);}
  `;
  doc.head.appendChild(el);
}
var ControlPanel = class {
  constructor(cfg) {
    this.collapsedGroups = /* @__PURE__ */ new Set();
    this.activeTab = "";
    this.activeMenu = "";
    // Rebuilt on each render — current structure + live-DOM value updaters
    this.items = [];
    this.customRows = [];
    this.extraTabs = [];
    this.updaters = /* @__PURE__ */ new Map();
    this.cfg = cfg;
    this.store = cfg.store;
    this.theme = cfg.theme ?? getTheme();
    this.el = document.createElement("div");
    this.footer = document.createElement("div");
    ensureSliderStyle(document);
    this.unsubStore = this.store.onChange((key, value) => {
      this.updaters.get(key)?.(value);
    });
    this.docClick = () => this.closeMenus();
    document.addEventListener("click", this.docClick);
  }
  dispose() {
    this.unsubStore();
    document.removeEventListener("click", this.docClick);
    this.el.innerHTML = "";
  }
  /** Rebuild the panel DOM for a new control structure. */
  render(items, customRows = [], extraTabs = []) {
    this.items = items;
    this.customRows = customRows;
    this.extraTabs = extraTabs;
    this.updaters.clear();
    this.el.innerHTML = "";
    const t = this.theme;
    const buttons = this.cfg.getButtons?.() ?? [];
    const menuNames = [];
    for (const it of items) if (it.menu && !menuNames.includes(it.menu)) menuNames.push(it.menu);
    for (const b of buttons) if (b.menu && !menuNames.includes(b.menu)) menuNames.push(b.menu);
    if (menuNames.length > 0) this.el.appendChild(this.buildMenuBar(menuNames, items, buttons));
    const tabOrder = [];
    for (const it of items) if (it.tab && !tabOrder.includes(it.tab)) tabOrder.push(it.tab);
    for (const b of buttons) if (b.tab && !tabOrder.includes(b.tab)) tabOrder.push(b.tab);
    for (const r of customRows) if (r.tab && !tabOrder.includes(r.tab)) tabOrder.push(r.tab);
    for (const et of extraTabs) if (!tabOrder.includes(et.name)) tabOrder.push(et.name);
    const hasTabs = tabOrder.length > 1;
    if (hasTabs && (!this.activeTab || !tabOrder.includes(this.activeTab))) {
      this.activeTab = tabOrder[0];
    }
    const pinnedItems = hasTabs ? items.filter((it) => !it.tab && !it.menu) : [];
    const pinnedButtons = hasTabs ? buttons.filter((b) => !b.tab && !b.menu) : [];
    if (pinnedItems.length || pinnedButtons.length) {
      const strip = document.createElement("div");
      strip.style.cssText = `padding:4px 8px 2px;border-bottom:1px solid ${t.border};`;
      for (const it of pinnedItems) {
        const row = this.buildControl(it);
        if (row) strip.appendChild(row);
      }
      for (const b of pinnedButtons) strip.appendChild(this.buildButtonRow(b));
      this.el.appendChild(strip);
    }
    if (hasTabs) this.el.appendChild(this.buildTabBar(tabOrder));
    const activeExtra = hasTabs ? this.extraTabs.find((et) => et.name === this.activeTab) : void 0;
    if (activeExtra) {
      const host = document.createElement("div");
      activeExtra.render(host);
      this.el.appendChild(host);
      this.el.appendChild(this.footer);
      return;
    }
    const inTab = (tab, menu) => !menu && (hasTabs ? !!tab && tab === this.activeTab : true);
    const groups = /* @__PURE__ */ new Map();
    const groupOf = (name) => {
      const g = name || DEFAULT_GROUP;
      if (!groups.has(g)) groups.set(g, { items: [], buttons: [], rows: [] });
      return groups.get(g);
    };
    for (const it of items) if (inTab(it.tab, it.menu)) groupOf(it.group).items.push(it);
    for (const b of buttons) if (inTab(b.tab, b.menu)) groupOf(b.group).buttons.push(b);
    for (const r of customRows) if (inTab(r.tab)) groupOf(r.group).rows.push(r);
    for (const [name, content] of groups) {
      this.el.appendChild(this.buildSection(name, content));
    }
    this.el.appendChild(this.footer);
  }
  /** Push a value into a live control without going through the store. */
  applyValue(key, value) {
    this.updaters.get(key)?.(value);
  }
  closeMenus() {
    this.activeMenu = "";
    this.el.querySelectorAll("[data-menu-dropdown]").forEach((d) => {
      d.style.display = "none";
    });
    this.el.querySelectorAll("[data-menu-btn]").forEach((b) => {
      b.style.color = this.theme.textFaint;
    });
  }
  // ── Menu bar ──
  buildMenuBar(menuNames, items, buttons) {
    const t = this.theme;
    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;border-bottom:1px solid ${t.border};flex-shrink:0;position:relative;`;
    for (const menuName of menuNames) {
      const btn = document.createElement("button");
      btn.dataset.menuBtn = menuName;
      btn.textContent = menuName + " \u25BE";
      btn.style.cssText = `
        padding:8px 10px;border:none;background:transparent;
        color:${t.textFaint};font-family:inherit;font-size:9px;font-weight:500;
        text-transform:uppercase;letter-spacing:1.2px;cursor:pointer;transition:color .12s;
      `;
      btn.addEventListener("mouseenter", () => {
        btn.style.color = t.accent;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.color = this.activeMenu === menuName ? t.accent : t.textFaint;
      });
      const dropdown = document.createElement("div");
      dropdown.dataset.menuDropdown = menuName;
      dropdown.style.cssText = `
        display:none;position:fixed;z-index:1000;overflow-y:auto;
        min-width:160px;background:${t.popupBg};
        border:1px solid ${t.border};border-radius:4px;padding:4px 0;
        box-shadow:0 4px 16px rgba(0,0,0,.4);
      `;
      const menuItems = items.filter((it) => it.menu === menuName);
      const menuButtons = buttons.filter((b) => b.menu === menuName);
      for (const it of menuItems) {
        const def = this.store.getDef(it.key);
        if (!def) continue;
        if (def.type === "select") {
          const opts = def.options ?? [];
          const rows = [];
          for (const opt of opts) {
            const row2 = document.createElement("div");
            row2.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;font-size:11px;color:${t.textDim};transition:background .1s;`;
            const check2 = document.createElement("span");
            check2.style.cssText = `width:12px;text-align:center;color:${t.accent};font-size:10px;`;
            check2.textContent = this.store.get(it.key) === opt ? "\u2713" : " ";
            const lbl2 = document.createElement("span");
            lbl2.textContent = opt;
            row2.append(check2, lbl2);
            row2.addEventListener("mouseenter", () => {
              row2.style.background = t.hoverBg;
            });
            row2.addEventListener("mouseleave", () => {
              row2.style.background = "transparent";
            });
            row2.addEventListener("click", (e) => {
              e.stopPropagation();
              this.store.set(it.key, opt);
              for (const r of rows) r.check.textContent = r.opt === opt ? "\u2713" : " ";
              this.cfg.onCommit?.(it.key);
            });
            rows.push({ opt, check: check2 });
            dropdown.appendChild(row2);
          }
          this.updaters.set(it.key, (v) => {
            for (const r of rows) r.check.textContent = r.opt === v ? "\u2713" : " ";
          });
          continue;
        }
        if (def.type !== "bool") continue;
        const row = document.createElement("div");
        row.style.cssText = `
          display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;
          font-size:11px;color:${t.textDim};transition:background .1s;
        `;
        const check = document.createElement("span");
        check.style.cssText = `width:12px;text-align:center;color:${t.accent};font-size:10px;`;
        check.textContent = this.store.get(it.key) ? "\u2713" : " ";
        const lbl = document.createElement("span");
        lbl.textContent = def.label ?? it.key;
        row.append(check, lbl);
        row.addEventListener("mouseenter", () => {
          row.style.background = t.hoverBg;
        });
        row.addEventListener("mouseleave", () => {
          row.style.background = "transparent";
        });
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          this.store.set(it.key, !this.store.get(it.key));
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => {
          check.textContent = v ? "\u2713" : " ";
        });
        dropdown.appendChild(row);
      }
      if (menuItems.length > 0 && menuButtons.length > 0) {
        const sep = document.createElement("div");
        sep.style.cssText = `border-top:1px solid ${t.border};margin:4px 0;`;
        dropdown.appendChild(sep);
      }
      for (const b of menuButtons) {
        const row = document.createElement("div");
        row.style.cssText = `padding:7px 12px;cursor:pointer;font-size:11px;color:${t.textDim};transition:background .1s;`;
        row.textContent = b.label;
        row.addEventListener("mouseenter", () => {
          row.style.background = t.hoverBg;
          row.style.color = t.accent;
        });
        row.addEventListener("mouseleave", () => {
          row.style.background = "transparent";
          row.style.color = t.textDim;
        });
        const btnLabel = b.label, btnMenu = b.menu, btnGroup = b.group;
        row.addEventListener("click", () => {
          this.closeMenus();
          const current = (this.cfg.getButtons?.() ?? []).find((cb) => cb.label === btnLabel && cb.menu === btnMenu && cb.group === btnGroup);
          current?.action();
          if (!current?.display) this.cfg.onAction?.();
        });
        dropdown.appendChild(row);
      }
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = this.activeMenu === menuName;
        this.closeMenus();
        if (!isOpen) {
          this.activeMenu = menuName;
          const r = btn.getBoundingClientRect();
          dropdown.style.display = "block";
          dropdown.style.top = `${r.bottom}px`;
          dropdown.style.maxHeight = `${Math.max(120, window.innerHeight - r.bottom - 8)}px`;
          dropdown.style.left = `${Math.max(4, Math.min(r.left, window.innerWidth - dropdown.offsetWidth - 4))}px`;
          btn.style.color = t.accent;
        }
      });
      const holder = document.createElement("div");
      holder.style.cssText = `position:relative;display:inline-block;`;
      holder.appendChild(btn);
      holder.appendChild(dropdown);
      bar.appendChild(holder);
    }
    return bar;
  }
  // ── Tab bar ──
  /** The currently active tab name ("" when the panel has no tabs). */
  getActiveTab() {
    return this.activeTab;
  }
  buildTabBar(tabOrder) {
    const t = this.theme;
    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;border-bottom:1px solid ${t.border};flex-shrink:0;`;
    for (const tab of tabOrder) {
      const btn = document.createElement("button");
      btn.textContent = tab;
      const isActive = tab === this.activeTab;
      btn.style.cssText = `
        flex:1;padding:9px 4px;border:none;
        border-bottom:2px solid ${isActive ? t.accent : "transparent"};
        background:transparent;color:${isActive ? t.accent : t.textFaint};
        font-family:inherit;font-size:9px;font-weight:500;text-transform:uppercase;
        letter-spacing:1.2px;cursor:pointer;transition:all .12s;
      `;
      btn.addEventListener("click", () => {
        this.activeTab = tab;
        this.render(this.items, this.customRows, this.extraTabs);
        this.cfg.onTabChange?.(tab);
      });
      bar.appendChild(btn);
    }
    return bar;
  }
  // ── Sections ──
  buildSection(name, content) {
    const t = this.theme;
    const section = document.createElement("div");
    section.style.cssText = `border-bottom:1px solid ${t.border};`;
    const collapsed = this.collapsedGroups.has(name);
    const header = document.createElement("div");
    header.style.cssText = `
      padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:6px;
      user-select:none;transition:background .1s;
    `;
    header.addEventListener("mouseenter", () => {
      header.style.background = t.hoverBg;
    });
    header.addEventListener("mouseleave", () => {
      header.style.background = "transparent";
    });
    const arrow2 = document.createElement("span");
    arrow2.style.cssText = `font-size:8px;color:${t.textFaint};transition:transform .15s;width:10px;`;
    arrow2.textContent = collapsed ? "\u25B6" : "\u25BC";
    header.appendChild(arrow2);
    const title = document.createElement("span");
    title.style.cssText = `font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:1.8px;color:${t.textFaint};`;
    title.textContent = name;
    header.appendChild(title);
    section.appendChild(header);
    const body = document.createElement("div");
    body.style.cssText = `padding:0 14px 10px;${collapsed ? "display:none;" : ""}`;
    for (const it of content.items) {
      const row = this.buildControl(it);
      if (row) body.appendChild(row);
    }
    for (const r of content.rows) {
      if (r.fullBleed) {
        const wrap = document.createElement("div");
        wrap.style.cssText = "margin:0 -14px;";
        wrap.appendChild(r.el);
        body.appendChild(wrap);
      } else {
        body.appendChild(r.el);
      }
    }
    for (const b of content.buttons) {
      body.appendChild(this.buildButtonRow(b));
    }
    section.appendChild(body);
    header.addEventListener("click", () => {
      const isCollapsed = this.collapsedGroups.has(name);
      if (isCollapsed) this.collapsedGroups.delete(name);
      else this.collapsedGroups.add(name);
      body.style.display = isCollapsed ? "" : "none";
      arrow2.textContent = isCollapsed ? "\u25BC" : "\u25B6";
    });
    return section;
  }
  // ── Individual controls ──
  buildButtonRow(b) {
    const t = this.theme;
    const row = document.createElement("div");
    row.style.cssText = "margin-bottom:4px;";
    const btn = document.createElement("button");
    btn.textContent = b.label;
    btn.style.cssText = `
      width:100%;padding:7px 10px;border:1px solid ${t.border};border-radius:5px;
      background:transparent;color:${t.textDim};font-family:inherit;font-size:10px;
      cursor:pointer;transition:all .12s;
    `;
    btn.addEventListener("mouseenter", () => {
      btn.style.background = t.hoverBg;
      btn.style.borderColor = t.accent;
      btn.style.color = t.accent;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "transparent";
      btn.style.borderColor = t.border;
      btn.style.color = t.textDim;
    });
    const label = b.label, group = b.group, menu = b.menu;
    btn.addEventListener("click", () => {
      const current = (this.cfg.getButtons?.() ?? []).find((cb) => cb.label === label && cb.group === group && cb.menu === menu) ?? b;
      current.action();
      if (!current.display) this.cfg.onAction?.();
    });
    row.appendChild(btn);
    return row;
  }
  buildControl(it) {
    const def = this.store.getDef(it.key);
    if (!def) return null;
    const t = this.theme;
    if (def.type === "button") {
      return this.buildButtonRow({ label: def.label ?? it.key, action: def.action, group: it.group });
    }
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:5px;min-height:26px;";
    const label = document.createElement("span");
    label.style.cssText = `width:80px;flex-shrink:0;font-size:11px;color:${t.textDim};text-transform:capitalize;`;
    label.textContent = def.label ?? it.key;
    row.appendChild(label);
    switch (def.type) {
      case "float":
      case "int": {
        const step = def.step ?? (def.type === "int" ? 1 : (def.max - def.min) / 100);
        const input = document.createElement("input");
        input.type = "range";
        input.min = String(def.min);
        input.max = String(def.max);
        input.step = String(step);
        input.value = String(this.store.get(it.key));
        input.className = "tekto-slider";
        input.style.cssText = `flex:1;--tekto-track:${t.controlBorder};--tekto-thumb:${it.accent || t.accent};`;
        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `width:42px;text-align:right;font-size:10px;color:${t.accent};`;
        const isInt = def.type === "int" || step >= 1;
        const rawDec = isInt ? 0 : Math.max(2, -Math.floor(Math.log10(step) - 1e-3));
        const decimals = Math.min(Math.max(0, rawDec), 20);
        const fmt = (v) => isInt ? String(Math.round(v)) : Number(v).toFixed(decimals);
        valueSpan.textContent = fmt(this.store.get(it.key));
        input.addEventListener("input", () => {
          this.store.set(it.key, parseFloat(input.value));
        });
        input.addEventListener("change", () => this.cfg.onCommit?.(it.key));
        this.updaters.set(it.key, (v) => {
          input.value = String(v);
          valueSpan.textContent = fmt(v);
        });
        row.append(input, valueSpan);
        break;
      }
      case "bool": {
        const wrap = document.createElement("label");
        wrap.style.cssText = "position:relative;width:32px;height:18px;cursor:pointer;flex-shrink:0;";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!this.store.get(it.key);
        input.style.cssText = "position:absolute;opacity:0;width:0;height:0;";
        const track = document.createElement("span");
        const knob = document.createElement("span");
        const paint = (on) => {
          track.style.cssText = `position:absolute;inset:0;border-radius:9px;transition:.2s;background:${on ? t.accent : t.controlBorder};`;
          knob.style.cssText = `position:absolute;left:${on ? "16px" : "2px"};top:2px;width:14px;height:14px;border-radius:50%;background:${on ? t.panelBg : "#ffffff"};transition:.2s;`;
        };
        paint(input.checked);
        track.appendChild(knob);
        wrap.append(input, track);
        input.addEventListener("change", () => {
          paint(input.checked);
          this.store.set(it.key, input.checked);
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => {
          input.checked = !!v;
          paint(!!v);
        });
        row.appendChild(wrap);
        break;
      }
      case "select": {
        const select = document.createElement("select");
        select.style.cssText = `
          flex:1;padding:4px 8px;background:${t.fieldBg};
          border:1px solid ${t.controlBorder};border-radius:4px;color:inherit;
          font-family:inherit;font-size:11px;outline:none;cursor:pointer;
        `;
        for (const opt of def.options) {
          const el = document.createElement("option");
          el.value = opt;
          el.textContent = opt;
          if (opt === this.store.get(it.key)) el.selected = true;
          select.appendChild(el);
        }
        select.addEventListener("change", () => {
          this.store.set(it.key, select.value);
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => {
          select.value = v;
        });
        row.appendChild(select);
        break;
      }
      case "color": {
        const input = document.createElement("input");
        input.type = "color";
        input.value = this.store.get(it.key);
        input.style.cssText = `width:32px;height:24px;border:1px solid ${t.controlBorder};border-radius:4px;padding:0;cursor:pointer;background:none;`;
        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `font-size:10px;color:${t.textDim};`;
        valueSpan.textContent = this.store.get(it.key);
        input.addEventListener("input", () => {
          this.store.set(it.key, input.value);
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => {
          input.value = v;
          valueSpan.textContent = v;
        });
        row.append(input, valueSpan);
        break;
      }
      case "string": {
        const input = document.createElement("input");
        input.type = "text";
        input.value = this.store.get(it.key) ?? "";
        input.placeholder = def.placeholder ?? "";
        input.style.cssText = `
          flex:1;padding:4px 8px;background:${t.fieldBg};
          border:1px solid ${t.controlBorder};border-radius:4px;color:inherit;
          font-family:inherit;font-size:11px;outline:none;
        `;
        input.addEventListener("input", () => {
          this.store.set(it.key, input.value);
        });
        input.addEventListener("change", () => this.cfg.onCommit?.(it.key));
        this.updaters.set(it.key, (v) => {
          if (input !== document.activeElement) input.value = v;
        });
        row.appendChild(input);
        break;
      }
      case "vec3": {
        const inputs = [];
        for (let i = 0; i < 3; i++) {
          const input = document.createElement("input");
          input.type = "number";
          if (def.step != null) input.step = String(def.step);
          input.value = String((this.store.get(it.key) ?? def.default)[i]);
          input.style.cssText = `
            flex:1;width:0;padding:3px 4px;background:${t.fieldBg};
            border:1px solid ${t.controlBorder};border-radius:4px;color:inherit;
            font-family:inherit;font-size:10px;outline:none;
          `;
          input.addEventListener("change", () => {
            const next = inputs.map((el) => Number(el.value));
            this.store.set(it.key, next);
            this.cfg.onCommit?.(it.key);
          });
          inputs.push(input);
          row.appendChild(input);
        }
        this.updaters.set(it.key, (v) => {
          for (let i = 0; i < 3; i++) inputs[i].value = String(v[i]);
        });
        break;
      }
    }
    return row;
  }
};

// src/io/download.ts
function stampName(fileName, date = /* @__PURE__ */ new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? `${fileName.slice(0, dot)}-${stamp}${fileName.slice(dot)}` : `${fileName}-${stamp}`;
}
var MIME = {
  dxf: "application/dxf",
  svg: "image/svg+xml",
  json: "application/json",
  obj: "model/obj",
  ifc: "application/x-step",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  stl: "model/stl"
};
function download(data, fileName, opts = {}) {
  const name = opts.stamp ? stampName(fileName) : fileName;
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  const blob = data instanceof Blob ? data : new Blob([data], { type: opts.type ?? MIME[ext] ?? "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6e4);
}

// src/sketch/AgentBridge.ts
var MAX_ERRORS = 50;
function installAgentBridge(host) {
  const errors = [];
  const record = (msg) => {
    if (errors.length < MAX_ERRORS) errors.push(msg.slice(0, 500));
  };
  const onError = (e) => record(`${e.message}${e.filename ? ` (${e.filename}:${e.lineno})` : ""}`);
  const onRejection = (e) => record(`unhandled rejection: ${String(e.reason?.stack ?? e.reason)}`);
  const origError = console.error;
  const wrapped = (...args) => {
    record(args.map((a) => a instanceof Error ? a.stack ?? a.message : typeof a === "string" ? a : safeJson(a)).join(" "));
    origError.apply(console, args);
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  console.error = wrapped;
  const store = host.store;
  window.__tekto = {
    owner: host.owner,
    harness: host.harness,
    snapshot: (opts) => host.snapshot(opts),
    params: () => store.getAll(),
    paramNames: () => store.names(),
    schema: () => paramSchema(store),
    errors: () => [...errors],
    // By label ("Radius"), "Group:Label" or key. Names that match nothing, or more than
    // one control, are reported (and warned about) instead of silently dropped.
    setParams: (p) => {
      const r = store.setByName(p);
      if (r.unknown.length || r.ambiguous.length) {
        console.warn("tekto setParams:", [
          ...r.unknown.map((n) => `no control named "${n}"`),
          ...r.ambiguous.map((a) => `"${a.name}" matches ${a.keys.length} controls \u2014 use Group:Label`)
        ].join("; "), "| controls:", store.names().join(", "));
      }
      return r;
    },
    ...host.camera ? { camera: host.camera } : {},
    // What the app can do — undo, delete, the views … — by id, as a person would by key.
    commands: () => host.commands?.list() ?? [],
    run: (id) => host.commands ? host.commands.run(id) : Promise.resolve(false)
  };
  return {
    errors: () => [...errors],
    dispose() {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      if (console.error === wrapped) console.error = origError;
      if (window.__tekto?.owner === host.owner) delete window.__tekto;
    }
  };
}
function paramSchema(store) {
  const schema = store.getSchema();
  const names = store.names();
  const values = store.getAll();
  return Object.keys(schema).map((key, i) => {
    const d = schema[key];
    return {
      name: names[i],
      key,
      type: d.type,
      ...d.label ? { label: d.label } : {},
      ...d.min !== void 0 ? { min: d.min } : {},
      ...d.max !== void 0 ? { max: d.max } : {},
      ...d.step !== void 0 ? { step: d.step } : {},
      ...d.options !== void 0 ? { options: d.options } : {},
      ...d.default !== void 0 ? { default: d.default } : {},
      value: values[key]
    };
  });
}
async function plainBundle(opts) {
  const markup = {
    format: "tekto-markup/1",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    sketch: { title: opts.title, url: location.href },
    harness: opts.harness,
    instruction: opts.note ?? "",
    viewport: { ...opts.viewport, dpr: window.devicePixelRatio || 1 },
    ...opts.context,
    marks: [],
    files: { view: "view.png", clean: "clean.png" }
  };
  const bundle = { markup, viewPng: opts.png, cleanPng: opts.png };
  if (opts.save !== false) bundle.dir = await saveBundle(bundle, opts.label ?? slug(opts.title));
  return bundle;
}
var ENDPOINT = "/__tekto/markup";
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sketch";
}
async function saveBundle(b, label) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, markup: b.markup, viewPng: b.viewPng, cleanPng: b.cleanPng })
    });
    if (res.ok) return (await res.json()).dir;
  } catch {
  }
  const dl = (name, href) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  };
  dl(`${label}-view.png`, b.viewPng);
  dl(`${label}-clean.png`, b.cleanPng);
  dl(`${label}-markup.json`, URL.createObjectURL(new Blob([JSON.stringify(b.markup, null, 2)], { type: "application/json" })));
  return void 0;
}
function safeJson(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// src/sketch/Sketch2D.ts
function sketch2d(fn, config) {
  return new Sketch2DInstance(fn, config ?? {});
}
var Sketch2DInstance = class {
  constructor(fn, config) {
    // Param model: values in the ParamStore, placement in `items` — rendered
    // by the shared ControlPanel.
    this.store = new ParamStore({});
    this.items = /* @__PURE__ */ new Map();
    this.buttons = [];
    this.logs = [];
    this.bridge = null;
    this.drawFn = null;
    this.animateFn = null;
    this.pointerDownFns = [];
    this.pointerMoveFns = [];
    this.pointerUpFns = [];
    this.continuous = false;
    this._prevFingerprint = "";
    this._baseLogCount = 0;
    this._onceRan = [];
    this._onceSeq = 0;
    this.rng = createRandom();
    this.disposed = false;
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.rerunTimer = 0;
    this._running = false;
    // Input state
    this._mouseX = 0;
    this._mouseY = 0;
    this._mousePressed = false;
    this.fn = fn;
    this.config = config;
    if (typeof config.container === "string") {
      this.container = document.querySelector(config.container);
    } else if (config.container) {
      this.container = config.container;
    } else {
      this.container = document.body;
    }
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.buildDOM();
    this.wireInput();
    this.runSketch();
    this.startLoop();
    this.bridge = installAgentBridge({
      owner: this,
      harness: "sketch2d",
      store: this.store,
      snapshot: (opts) => plainBundle({
        ...opts,
        title: this.config.title ?? "sketch2d",
        harness: "sketch2d",
        png: this.canvas.toDataURL("image/png"),
        viewport: { width: this.canvas.clientWidth, height: this.canvas.clientHeight },
        context: {
          params: this.store.getAll(),
          // The body's lines plus this frame's: keep the latest value per label.
          logs: [...new Map(this.logs.map((l) => [l.label, { ...l }])).values()],
          errors: this.bridge?.errors() ?? []
        }
      })
    });
  }
  // ── DOM ──
  buildDOM() {
    const pw = this.config.panelWidth ?? 280;
    const t = getTheme(this.config.theme);
    const root = document.createElement("div");
    root.style.cssText = `
      display:grid; grid-template-columns:${pw}px 1fr; grid-template-rows:44px 1fr;
      height:100%; width:100%; overflow:hidden; position:relative;
      background:${t.bg}; color:${t.text};
      font-family:${t.font};
    `;
    const header = document.createElement("div");
    header.style.cssText = `
      grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
      background:${t.panelBg}; border-bottom:1px solid ${t.border};
    `;
    header.innerHTML = `
      <span style="font-weight:600;font-size:14px;color:${t.accent}">
        &#x2B21; ${this.config.title ?? "Tekto Sketch2D"}
      </span>
      <span style="font-size:9px;padding:2px 6px;border-radius:3px;
        background:${t.hoverBg};color:${t.accent}">2D</span>
    `;
    root.appendChild(header);
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      grid-column:1; grid-row:2; overflow-y:auto; overflow-x:hidden; padding:0;
      background:${t.panelBg}; border-right:1px solid ${t.border};
    `;
    root.appendChild(this.panelEl);
    this.panel = new ControlPanel({
      store: this.store,
      theme: t,
      getButtons: () => this.buttons,
      onAction: () => this.scheduleRerun()
    });
    this.panelEl.appendChild(this.panel.el);
    this.store.onChange(() => this.scheduleRerun());
    const collapseKey = "tekto.sketch2d.collapsed";
    let collapsed = false;
    try {
      collapsed = localStorage.getItem(collapseKey) === "1";
    } catch {
    }
    const toggleBtn = document.createElement("button");
    toggleBtn.style.cssText = `
      margin-left:auto; cursor:pointer; width:28px; height:26px; border-radius:6px;
      border:1px solid ${t.border}; background:transparent; color:${t.text};
      font-size:15px; line-height:1; padding:0; flex:none;
    `;
    const applyCollapse = () => {
      root.style.gridTemplateColumns = collapsed ? "0 1fr" : `${pw}px 1fr`;
      this.panelEl.style.display = collapsed ? "none" : "";
      toggleBtn.textContent = collapsed ? "\u203A" : "\u2039";
      toggleBtn.title = collapsed ? "Show controls" : "Hide controls";
    };
    toggleBtn.addEventListener("click", () => {
      collapsed = !collapsed;
      try {
        localStorage.setItem(collapseKey, collapsed ? "1" : "0");
      } catch {
      }
      applyCollapse();
      this.resizeCanvas();
    });
    header.appendChild(toggleBtn);
    const vpWrap = document.createElement("div");
    vpWrap.style.cssText = "grid-column:2;grid-row:2;position:relative;overflow:hidden;";
    this.canvas.style.cssText = `
      width:100%; height:100%; display:block;
      background:${this.config.background ?? (t.isDark ? "#0a0a10" : "#ffffff")};
    `;
    vpWrap.appendChild(this.canvas);
    this.logEl = document.createElement("div");
    this.logEl.style.cssText = `
      position:absolute; bottom:12px; left:12px;
      padding:8px 12px; border-radius:6px;
      background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
      font-size:11px; line-height:1.7; color:${t.textDim};
      pointer-events:none; max-width:300px;
      border:1px solid rgba(22,24,42,.8); display:none;
    `;
    vpWrap.appendChild(this.logEl);
    root.appendChild(vpWrap);
    if (this.container === document.body) {
      this.container.style.margin = "0";
      this.container.style.height = "100vh";
      this.container.style.overflow = "hidden";
    }
    this.container.appendChild(root);
    applyCollapse();
    const ro = new ResizeObserver(() => this.resizeCanvas());
    ro.observe(vpWrap);
    this.resizeCanvas();
  }
  resizeCanvas() {
    const parent = this.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w > 0 && h > 0) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.redraw();
    }
  }
  wireInput() {
    this.canvas.style.touchAction = "none";
    const sample = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, id: e.pointerId };
    };
    this.canvas.addEventListener("pointerdown", (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      this._mousePressed = true;
      for (const fn of this.pointerDownFns) fn(p);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      for (const fn of this.pointerMoveFns) fn(p);
    });
    const onUp = (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      this._mousePressed = false;
      for (const fn of this.pointerUpFns) fn(p);
    };
    this.canvas.addEventListener("pointerup", onUp);
    this.canvas.addEventListener("pointercancel", onUp);
  }
  // ── Sketch execution ──
  runSketch() {
    this.buttons = [];
    this.logs = [];
    this.drawFn = null;
    this.animateFn = null;
    this.continuous = false;
    this.pointerDownFns = [];
    this.pointerMoveFns = [];
    this.pointerUpFns = [];
    this._onceSeq = 0;
    const usedParams = /* @__PURE__ */ new Set();
    const lab = this.buildLab(usedParams);
    this._running = true;
    try {
      this.fn(lab);
    } catch (e) {
      console.error("Sketch2D error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }
    this._running = false;
    for (const key of this.store.keys()) {
      if (!usedParams.has(key)) {
        this.store.remove(key);
        this.items.delete(key);
      }
    }
    const fingerprint = [...this.items.keys()].sort().join("|") + "\u2016" + this.buttons.map((b) => `${b.group}:${b.label}`).join("|");
    if (fingerprint !== this._prevFingerprint) {
      this._prevFingerprint = fingerprint;
      this.panel.render([...this.items.values()]);
    }
    this._baseLogCount = this.logs.length;
    this.updateLog();
    this.redraw();
  }
  redraw() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    if (w > 0 && h > 0 && this.drawFn) {
      this.ctx.save();
      this.drawFn(this.ctx, w, h);
      this.ctx.restore();
    }
  }
  scheduleRerun() {
    if (this._running || this.rerunTimer) return;
    this.rerunTimer = requestAnimationFrame(() => {
      this.rerunTimer = 0;
      this.runSketch();
    });
  }
  buildLab(usedParams) {
    const self = this;
    function makeParam(key, def, item) {
      usedParams.add(key);
      if (!self.store.has(key)) {
        self.store.define(key, def);
        self.items.set(key, item);
      }
      return { get value() {
        return self.store.get(key);
      }, set(v) {
        self.store.set(key, v);
      } };
    }
    return {
      slider(label, min, max, def, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `slider:${opts?.group ?? ""}:${label}`;
        return makeParam(
          key,
          { type: "float", min, max, default: def, step: opts?.step ?? (max - min) / 100, label },
          { key, group }
        );
      },
      toggle(label, def = false, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `toggle:${opts?.group ?? ""}:${label}`;
        return makeParam(key, { type: "bool", default: def, label }, { key, group });
      },
      select(label, options, def, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `select:${opts?.group ?? ""}:${label}`;
        return makeParam(
          key,
          { type: "select", options, default: def ?? options[0], label },
          { key, group }
        );
      },
      colorPicker(label, def = "#38d9a9", opts) {
        const group = opts?.group ?? "Display";
        const key = `color:${opts?.group ?? ""}:${label}`;
        return makeParam(key, { type: "color", default: def, label }, { key, group });
      },
      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions" });
      },
      draw(fn) {
        self.drawFn = fn;
      },
      animate(fn) {
        self.animateFn = fn;
        self.continuous = true;
      },
      once(fn) {
        const i = self._onceSeq++;
        if (!self._onceRan[i]) {
          self._onceRan[i] = true;
          fn();
        }
      },
      get canvas() {
        return self.canvas;
      },
      get ctx() {
        return self.ctx;
      },
      get width() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.width / dpr;
      },
      get height() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.height / dpr;
      },
      get dpr() {
        return Math.min(window.devicePixelRatio, 2);
      },
      log(label, value) {
        self.logs.push({ label, value: value != null ? String(value) : "" });
      },
      // Math
      vec2: (x, y) => new Vec2(x, y),
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      sin: Math.sin,
      cos: Math.cos,
      atan2: Math.atan2,
      abs: Math.abs,
      sqrt: Math.sqrt,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      lerp: MathUtils.lerp,
      clamp: MathUtils.clamp,
      noise(x, y, z) {
        return noise(x, y ?? 0, z ?? 0);
      },
      random(min, max) {
        return self.rng.random(min, max);
      },
      randomSeed(seed) {
        self.rng = createRandom(seed);
      },
      // Input
      get mouseX() {
        return self._mouseX;
      },
      get mouseY() {
        return self._mouseY;
      },
      get mousePressed() {
        return self._mousePressed;
      },
      onPointerDown(fn) {
        self.pointerDownFns.push(fn);
      },
      onPointerMove(fn) {
        self.pointerMoveFns.push(fn);
      },
      onPointerUp(fn) {
        self.pointerUpFns.push(fn);
      }
    };
  }
  updateLog() {
    if (this.logs.length === 0) {
      this.logEl.style.display = "none";
      return;
    }
    this.logEl.style.display = "block";
    this.logEl.innerHTML = this.logs.map(
      (l) => `<div style="display:flex;gap:8px;"><span style="color:#4a5070">${l.label}</span><span style="color:#b8bdd4">${l.value}</span></div>`
    ).join("");
  }
  // ── Animation Loop ──
  startLoop() {
    const loop = () => {
      if (this.disposed) return;
      if (this.continuous && this.animateFn) {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1e3;
        this.lastTime = now;
        this.logs.length = this._baseLogCount;
        this.animateFn((now - this.startTime) / 1e3, Math.min(dt, 1 / 15));
        this.redraw();
        this.updateLog();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  /** The current value of every control, keyed for `setParams` — save it to reopen a design. */
  getParams() {
    return { ...this.store.getAll() };
  }
  /** Set controls by label, "Group:Label" or key, and re-run once; reports what it couldn't apply. */
  setParams(values) {
    return this.store.setByName(values);
  }
  /** Tear down the sketch */
  dispose() {
    this.disposed = true;
    this.bridge?.dispose();
    this.panel.dispose();
    this.container.innerHTML = "";
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

// src/core/geometry/OBB2D.ts
var OBB2D = class {
  constructor(center, width, height, angle) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.angle = angle;
  }
  /** Unit direction along the width axis. */
  get axisU() {
    return VecMath.fromAngle2D(this.angle);
  }
  /** Unit direction along the height axis. */
  get axisV() {
    return VecMath.fromAngle2D(this.angle + Math.PI / 2);
  }
  get area() {
    return this.width * this.height;
  }
  /** Returns the 4 corners of the rectangle (CCW order). */
  get corners() {
    const u = this.axisU;
    const v = this.axisV;
    const hw = this.width * 0.5;
    const hh = this.height * 0.5;
    return [
      this.center.sub(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).add(v.mul(hh)),
      this.center.sub(u.mul(hw)).add(v.mul(hh))
    ];
  }
  /** Tests whether a point lies inside the OBB. */
  contains(p) {
    const d = p.sub(this.center);
    const u = this.axisU;
    const v = this.axisV;
    const projU = Math.abs(d.dot(u));
    const projV = Math.abs(d.dot(v));
    return projU <= this.width * 0.5 + HMath.EPSILON && projV <= this.height * 0.5 + HMath.EPSILON;
  }
  toString() {
    return `OBB2D [Center:${this.center} W:${this.width.toFixed(3)} H:${this.height.toFixed(3)} Angle:${(this.angle * HMath.RAD2DEG).toFixed(1)}\xB0]`;
  }
};

// src/core/geometry/Polygon2D.ts
var TWO_PI2 = Math.PI * 2;
var Polygon2D = {
  // ================================================================
  // CROSS PRODUCT / ORIENTATION
  // ================================================================
  /** 2D cross product of vectors OA x OB */
  cross2D(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  },
  // ================================================================
  // AREA & PERIMETER
  // ================================================================
  /** Signed area of a 2D polygon (positive if CCW, negative if CW). */
  signedArea(polygon) {
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    }
    return area / 2;
  },
  /** Unsigned area. */
  area(polygon) {
    return Math.abs(Polygon2D.signedArea(polygon));
  },
  /** Total perimeter length. */
  perimeter(polygon) {
    let total = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++)
      total += polygon[i].distTo(polygon[(i + 1) % n]);
    return total;
  },
  /**
   * Total arc length of an open polyline (no implied closing edge).
   * Sums segment lengths between consecutive vertices.
   */
  polylineLength(polyline) {
    let total = 0;
    for (let i = 0; i < polyline.length - 1; i++)
      total += polyline[i].distTo(polyline[i + 1]);
    return total;
  },
  // ================================================================
  // RING NORMALIZATION
  // ================================================================
  /**
   * Return `polygon` with the closing duplicate vertex stripped (open ring).
   * Only strips when the polygon has ≥3 vertices and its first/last vertices
   * coincide within `eps`. Always returns a fresh array.
   */
  openRing(polygon, eps = 1e-12) {
    return polygon.length >= 3 && polygon[0].distSqTo(polygon[polygon.length - 1]) < eps ? polygon.slice(0, -1) : polygon.slice();
  },
  /**
   * Return `polygon` with a closing duplicate vertex appended (closed ring).
   * Polygons with <3 vertices are returned as a fresh copy unchanged.
   * Always returns a fresh array.
   */
  closeRing(polygon, eps = 1e-12) {
    if (polygon.length < 3) return polygon.slice();
    return polygon[0].distSqTo(polygon[polygon.length - 1]) < eps ? polygon.slice() : [...polygon, polygon[0]];
  },
  /** Returns true if polygon vertices are in counter-clockwise order. */
  isCCW(polygon) {
    return Polygon2D.signedArea(polygon) > 0;
  },
  // ================================================================
  // CENTER
  // ================================================================
  /** Average center (centroid of vertices, fast but not area-weighted). */
  averageCenter(polygon) {
    let sx = 0, sy = 0;
    for (const p of polygon) {
      sx += p.x;
      sy += p.y;
    }
    return new Vec2(sx / polygon.length, sy / polygon.length);
  },
  /** Area-weighted centroid (gravity center). */
  centroid2D(polygon) {
    const A = Polygon2D.signedArea(polygon);
    if (Math.abs(A) < HMath.EPSILON) return Polygon2D.averageCenter(polygon);
    let cx = 0, cy = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const f = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      cx += (polygon[i].x + polygon[j].x) * f;
      cy += (polygon[i].y + polygon[j].y) * f;
    }
    const factor = 1 / (6 * A);
    return new Vec2(cx * factor, cy * factor);
  },
  // ================================================================
  // CONTAINMENT
  // ================================================================
  /** Point-in-polygon (ray casting, 2D). */
  pointInPolygon(point, polygon) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (yi > point.y !== yj > point.y && point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  },
  /** Point-in-polygon test using winding number (robust for concave polygons). */
  containsWinding(polygon, point) {
    let winding = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      if (a.y <= point.y) {
        if (b.y > point.y && VecMath.cross2D(a, b, point) > 0) winding++;
      } else {
        if (b.y <= point.y && VecMath.cross2D(a, b, point) < 0) winding--;
      }
    }
    return winding !== 0;
  },
  // ================================================================
  // CLOSEST POINT / VERTEX
  // ================================================================
  /** Index of the closest vertex to a point. */
  closestVertexIndex(polygon, point) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < polygon.length; i++) {
      const d = polygon[i].distSqTo(point);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  },
  /** Closest point on the polygon boundary to a given point. Returns { point, edgeIndex }. */
  closestPointOnEdge(polygon, point) {
    let bestEdge = 0;
    let bestDist = Infinity;
    let bestPt = polygon[0];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      const ab = b.sub(a);
      const abSq = ab.lenSq();
      const t = abSq < HMath.EPSILON ? 0 : HMath.clamp(point.sub(a).dot(ab) / abSq, 0, 1);
      const proj = a.add(ab.mul(t));
      const d = point.distSqTo(proj);
      if (d < bestDist) {
        bestDist = d;
        bestPt = proj;
        bestEdge = i;
      }
    }
    return { point: bestPt, edgeIndex: bestEdge };
  },
  /**
   * Closest point on a polyline to a query point, with arc-length.
   *
   * Treats `polyline` as a *sequence of segments* — if it's a closed polygon
   * (first point == last point), every segment is considered. If it's an open
   * polyline (first ≠ last), the last vertex closes a segment only when
   * `closed: true` is passed.
   *
   * Returns:
   *   - `point`        — the projected 2D point on the polyline.
   *   - `arcLength`    — distance from the polyline start to the projected point.
   *   - `segmentIndex` — index of the segment containing the projection.
   *   - `segmentT`     — 0..1 parameter along that segment.
   *   - `distance`     — distance from the query point to the projection.
   */
  closestPointOnPolyline(polyline, point, opts = {}) {
    const n = polyline.length;
    if (n < 2) return { point: polyline[0] ?? new Vec2(0, 0), arcLength: 0, segmentIndex: 0, segmentT: 0, distance: 0 };
    const closed = opts.closed ?? polyline[0].distSqTo(polyline[n - 1]) < 1e-12;
    const segCount = closed ? n : n - 1;
    let bestArc = 0, bestSeg = 0, bestT = 0;
    let bestPt = polyline[0];
    let bestDistSq = Infinity;
    let accLen = 0;
    for (let i = 0; i < segCount; i++) {
      const a = polyline[i];
      const b = polyline[(i + 1) % n];
      const ab = b.sub(a);
      const abSq = ab.lenSq();
      const t = abSq < HMath.EPSILON ? 0 : HMath.clamp(point.sub(a).dot(ab) / abSq, 0, 1);
      const proj = a.add(ab.mul(t));
      const d = point.distSqTo(proj);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestPt = proj;
        bestSeg = i;
        bestT = t;
        bestArc = accLen + t * Math.sqrt(abSq);
      }
      accLen += Math.sqrt(abSq);
    }
    return {
      point: bestPt,
      arcLength: bestArc,
      segmentIndex: bestSeg,
      segmentT: bestT,
      distance: Math.sqrt(bestDistSq)
    };
  },
  // ================================================================
  // INTERSECTION
  // ================================================================
  /** Segment-segment intersection (2D), returns parameter t along first segment. */
  segmentIntersect2D(a1, a2, b1, b2) {
    const d1 = a2.sub(a1), d2 = b2.sub(b1);
    const cross = d1.cross(d2);
    if (Math.abs(cross) < 1e-10) return null;
    const diff = b1.sub(a1);
    const t = diff.cross(d2) / cross;
    const u = diff.cross(d1) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { t, u, point: a1.add(d1.mul(t)) };
    }
    return null;
  },
  // ================================================================
  // OFFSET (parallel inset/outset)
  // ================================================================
  /**
   * Offsets a polygon by a distance. Works for both CCW and CW windings;
   * the function detects the orientation via signed area and produces a
   * geometrically *outward* offset for positive distance regardless.
   *
   *   distance > 0  →  polygon grows (outward / outset)
   *   distance < 0  →  polygon shrinks (inward / inset)
   *
   * Simple miter-join approach; may produce artifacts on very sharp angles
   * (the miter is clamped to 4× the offset distance to avoid spikes).
   */
  /**
   * Offset a simple polygon by moving each vertex along its corner bisector: positive
   * `distance` grows it, negative shrinks it, whichever way it winds. A ring that repeats
   * its first point comes back closed the same way. Insetting past the polygon's inner
   * radius returns `[]` (the polygon is gone) instead of an inverted shape. Vertex offset
   * only — no clean-up of self-intersections at deep concave insets; for those use
   * `PolygonBool`.
   */
  offset(polygon, distance) {
    if (!Number.isFinite(distance)) throw new Error(`Polygon2D.offset: distance must be a finite number, got ${distance}`);
    const closed = polygon.length > 3 && polygon[0].distSqTo(polygon[polygon.length - 1]) <= 1e-24;
    if (closed) polygon = Polygon2D.openRing(polygon);
    const n = polygon.length;
    if (n < 3) return [...polygon];
    const d = distance;
    const result = [];
    for (let i = 0; i < n; i++) {
      const prev = (i - 1 + n) % n;
      const next = (i + 1) % n;
      const e1Dir = polygon[i].sub(polygon[prev]).normalize();
      const e2Dir = polygon[next].sub(polygon[i]).normalize();
      const n1 = new Vec2(e1Dir.y, -e1Dir.x);
      const n2 = new Vec2(e2Dir.y, -e2Dir.x);
      const bisector = n1.add(n2);
      const bisLen = bisector.len();
      if (bisLen < HMath.EPSILON) {
        result.push(polygon[i].add(n1.mul(d)));
      } else {
        const bisNorm = bisector.div(bisLen);
        const sinHalfAngle = n1.x * bisNorm.y - n1.y * bisNorm.x;
        let scale = Math.abs(sinHalfAngle) < HMath.EPSILON ? d : d / sinHalfAngle;
        scale = HMath.clamp(scale, -Math.abs(d) * 4, Math.abs(d) * 4);
        result.push(polygon[i].add(bisNorm.mul(scale)));
      }
    }
    if (d < 0) {
      let reversed = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        if (polygon[j].sub(polygon[i]).dot(result[j].sub(result[i])) < 0) reversed++;
      }
      const a0 = Polygon2D.signedArea(polygon), a1 = Polygon2D.signedArea(result);
      if (reversed === n || Math.sign(a1) !== Math.sign(a0) || Math.abs(a1) < 1e-12 * Math.max(1, Math.abs(a0))) return [];
    }
    if (closed) result.push(result[0]);
    return result;
  },
  // ================================================================
  // SIMPLIFICATION
  // ================================================================
  /**
   * Douglas-Peucker simplification — removes points closer than tolerance
   * to the line between their neighbors.
   */
  simplify(polygon, tolerance) {
    if (polygon.length <= 3) return [...polygon];
    const keep = new Array(polygon.length).fill(true);
    let changed = true;
    const n = polygon.length;
    while (changed) {
      changed = false;
      for (let i = 0; i < n; i++) {
        if (!keep[i]) continue;
        const prev = prevKept(keep, i, n);
        const next = nextKept(keep, i, n);
        if (prev === next) continue;
        const dist = VecMath.distanceToSegment2D(polygon[i], polygon[prev], polygon[next]);
        if (dist < tolerance) {
          keep[i] = false;
          changed = true;
        }
      }
    }
    const result = [];
    for (let i = 0; i < n; i++)
      if (keep[i]) result.push(polygon[i]);
    return result.length >= 3 ? result : [...polygon];
  },
  /**
   * Removes vertices where the interior angle is close to 180°
   * (i.e. the vertex barely deviates from a straight line).
   */
  simplifyByAngle(polygon, minAngleRadians) {
    if (polygon.length <= 3) return [...polygon];
    const result = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const prev = polygon[(i - 1 + n) % n];
      const curr = polygon[i];
      const next = polygon[(i + 1) % n];
      const angle = VecMath.angleAtVertex(curr, prev, next);
      if (Math.PI - angle > minAngleRadians) result.push(curr);
    }
    return result.length >= 3 ? result : [...polygon];
  },
  /** Removes edges shorter than minLength by dropping one endpoint. */
  removeShortEdges(polygon, minLength) {
    if (polygon.length <= 3) return [...polygon];
    const minSq = minLength * minLength;
    const result = [polygon[0]];
    const n = polygon.length;
    for (let i = 1; i < n; i++) {
      if (result[result.length - 1].distSqTo(polygon[i]) >= minSq)
        result.push(polygon[i]);
    }
    if (result.length > 1 && result[result.length - 1].distSqTo(result[0]) < minSq)
      result.pop();
    return result.length >= 3 ? result : [...polygon];
  },
  // ================================================================
  // SUBDIVISION
  // ================================================================
  /** Subdivides every edge into n segments, producing n*vertexCount vertices. */
  subdivideEdges(polygon, subdivisions) {
    if (subdivisions < 2) return [...polygon];
    const n = polygon.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      for (let s = 0; s < subdivisions; s++)
        result.push(a.lerp(b, s / subdivisions));
    }
    return result;
  },
  /** Splits edges to ensure no edge is longer than maxLength. */
  splitLongEdges(polygon, maxLength) {
    const n = polygon.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      result.push(a);
      const len = a.distTo(b);
      if (len > maxLength) {
        const splits = Math.ceil(len / maxLength);
        for (let s = 1; s < splits; s++)
          result.push(a.lerp(b, s / splits));
      }
    }
    return result;
  },
  // ================================================================
  // NORMAL (for 3D n-gon, Newell's method)
  // ================================================================
  /**
   * Computes the best-fit normal for a 3D polygon using Newell's method.
   * Works for any number of vertices (not just triangles).
   */
  normal3D(polygon) {
    let nx = 0, ny = 0, nz = 0;
    const count = polygon.length;
    for (let i = 0; i < count; i++) {
      const curr = polygon[i];
      const next = polygon[(i + 1) % count];
      nx += (curr.y - next.y) * (curr.z + next.z);
      ny += (curr.z - next.z) * (curr.x + next.x);
      nz += (curr.x - next.x) * (curr.y + next.y);
    }
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return len > HMath.EPSILON ? new Vec3(nx / len, ny / len, nz / len) : Vec3.unitZ();
  },
  // ================================================================
  // FACTORY
  // ================================================================
  /** Creates a regular polygon (circle approximation) with n sides. */
  createCircle(radius, segments) {
    const pts = [];
    const twoPi = Math.PI * 2;
    for (let i = 0; i < segments; i++) {
      const angle = twoPi * i / segments;
      pts.push(new Vec2(radius * Math.cos(angle), radius * Math.sin(angle)));
    }
    return pts;
  },
  /** Creates a rectangle centered at origin. */
  createRect(width, height) {
    const w = width * 0.5, h = height * 0.5;
    return [
      new Vec2(-w, -h),
      new Vec2(w, -h),
      new Vec2(w, h),
      new Vec2(-w, h)
    ];
  },
  /** Returns the polygon with reversed winding order. */
  reverse(polygon) {
    return [...polygon].reverse();
  },
  // ================================================================
  // FILLET
  // ================================================================
  /**
   * Computes the fillet arc of given radius between two rays from a common origin.
   * Returns the arc center, tangent points, and oriented sweep angle.
   * The sweep is oriented so the arc passes through the interior
   * (the side facing the ray origin).
   */
  filletRays(origin, angle1, angle2, radius) {
    const d1x = Math.cos(angle1), d1y = Math.sin(angle1);
    const d2x = Math.cos(angle2), d2y = Math.sin(angle2);
    let interior = angle2 - angle1;
    while (interior > Math.PI) interior -= TWO_PI2;
    while (interior <= -Math.PI) interior += TWO_PI2;
    const half = Math.abs(interior) / 2;
    const bis = angle1 + interior / 2;
    const dist = radius / Math.sin(half);
    const cx = origin.x + Math.cos(bis) * dist;
    const cy = origin.y + Math.sin(bis) * dist;
    const vx = cx - origin.x, vy = cy - origin.y;
    const t1 = vx * d1x + vy * d1y;
    const t2 = vx * d2x + vy * d2y;
    const startPt = new Vec2(origin.x + d1x * t1, origin.y + d1y * t1);
    const endPt = new Vec2(origin.x + d2x * t2, origin.y + d2y * t2);
    const startAngle = Math.atan2(startPt.y - cy, startPt.x - cx);
    let endAngle = Math.atan2(endPt.y - cy, endPt.x - cx);
    const toOrigin = Math.atan2(origin.y - cy, origin.x - cx);
    let ccw = endAngle - startAngle;
    if (ccw < 0) ccw += TWO_PI2;
    let offset = toOrigin - startAngle;
    if (offset < 0) offset += TWO_PI2;
    const sweepAngle = offset <= ccw ? ccw : -(TWO_PI2 - ccw);
    return {
      center: new Vec2(cx, cy),
      radius,
      startAngle,
      sweepAngle,
      startPt,
      endPt
    };
  },
  // ================================================================
  // CONVEX HULL
  // ================================================================
  /** Convex hull (Andrew's monotone chain). Returns CCW-ordered hull points. */
  convexHull2D(points) {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    if (sorted.length <= 2) return sorted;
    const lower = [];
    for (const p of sorted) {
      while (lower.length >= 2 && Polygon2D.cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && Polygon2D.cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  },
  // ================================================================
  // TRIANGULATION
  // ================================================================
  /** Ear-clipping triangulation for simple 2D polygons. */
  triangulate2D(polygon) {
    if (polygon.length < 3) return [];
    if (polygon.length === 3) return [[0, 1, 2]];
    const isCCW = Polygon2D.signedArea(polygon) > 0;
    const remaining = polygon.map((_, i) => i);
    const triangles = [];
    const isEar = (prev, curr, next) => {
      const a = polygon[remaining[prev]];
      const b = polygon[remaining[curr]];
      const c = polygon[remaining[next]];
      const cross = Polygon2D.cross2D(a, b, c);
      if (isCCW ? cross <= 0 : cross >= 0) return false;
      for (let i = 0; i < remaining.length; i++) {
        if (i === prev || i === curr || i === next) continue;
        if (pointInTriangle2D(polygon[remaining[i]], a, b, c)) return false;
      }
      return true;
    };
    let safety = remaining.length * 3;
    while (remaining.length > 3 && safety-- > 0) {
      let found = false;
      for (let i = 0; i < remaining.length; i++) {
        const prev = (i - 1 + remaining.length) % remaining.length;
        const next = (i + 1) % remaining.length;
        if (isEar(prev, i, next)) {
          triangles.push([remaining[prev], remaining[i], remaining[next]]);
          remaining.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) break;
    }
    if (remaining.length === 3) {
      triangles.push([remaining[0], remaining[1], remaining[2]]);
    }
    return triangles;
  },
  /**
   * Triangles covering a polygon with holes, as indices into `[outer, ...holes].flat()`,
   * counter-clockwise. Rings may be open or closed and wound either way. Each hole is
   * bridged into the outer ring and the result ear-clipped: for simple rings, holes inside
   * the outer ring and apart from each other.
   */
  triangulateWithHoles(outer, holes = []) {
    const index = /* @__PURE__ */ new Map();
    [outer, ...holes].flat().forEach((p, i) => {
      if (!index.has(p)) index.set(p, i);
    });
    let poly = orientRing(outer, true);
    for (const hole of holes) poly = bridgeHole(poly, orientRing(hole, false));
    return earClipRing(poly).map(([a, b, c]) => [index.get(a), index.get(b), index.get(c)]);
  },
  // ================================================================
  // MINIMUM ENCLOSING CIRCLE
  // ================================================================
  /** Minimum enclosing circle (Welzl's algorithm, randomized). */
  minEnclosingCircle(points) {
    if (points.length === 0) return { center: new Vec2(), radius: 0 };
    if (points.length === 1) return { center: points[0], radius: 0 };
    const p = [...points].sort(() => Math.random() - 0.5);
    const from2 = (a, b) => ({
      center: a.lerp(b, 0.5),
      radius: a.distTo(b) / 2
    });
    const from3 = (a, b, c) => {
      const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(d) < 1e-10) {
        const d01 = a.distTo(b), d12 = b.distTo(c), d02 = a.distTo(c);
        if (d01 >= d12 && d01 >= d02) return from2(a, b);
        if (d12 >= d01 && d12 >= d02) return from2(b, c);
        return from2(a, c);
      }
      const ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
      const uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
      const center = new Vec2(ux, uy);
      return { center, radius: center.distTo(a) };
    };
    const inside = (circ, q) => circ.center.distTo(q) <= circ.radius + 1e-8;
    let D = from2(p[0], p[1]);
    for (let i = 2; i < p.length; i++) {
      if (inside(D, p[i])) continue;
      D = { center: p[i], radius: 0 };
      for (let j = 0; j < i; j++) {
        if (inside(D, p[j])) continue;
        D = from2(p[i], p[j]);
        for (let k = 0; k < j; k++) {
          if (!inside(D, p[k])) D = from3(p[i], p[j], p[k]);
        }
      }
    }
    return D;
  },
  // ================================================================
  // MINIMUM AREA RECTANGLE (OBB)
  // ================================================================
  /**
   * Computes the minimum-area oriented bounding rectangle of a point set.
   * Uses convex hull + edge-projection. O(n log n) total.
   */
  minAreaRect(points) {
    if (points.length === 0) return new OBB2D(Vec2.zero(), 0, 0, 0);
    if (points.length === 1) return new OBB2D(points[0], 0, 0, 0);
    const hull = Polygon2D.convexHull2D(points);
    const n = hull.length;
    if (n === 1) return new OBB2D(hull[0], 0, 0, 0);
    if (n === 2) {
      const mid = hull[0].lerp(hull[1], 0.5);
      const len = hull[0].distTo(hull[1]);
      const angle = VecMath.angle2D(hull[1].sub(hull[0]));
      return new OBB2D(mid, len, 0, angle);
    }
    let bestArea = Infinity;
    let bestAngle = 0;
    let bestW = 0, bestH = 0;
    let bestCenter = Vec2.zero();
    for (let i = 0; i < n; i++) {
      const edge = hull[(i + 1) % n].sub(hull[i]);
      if (edge.lenSq() < HMath.EPSILON) continue;
      const angle = VecMath.angle2D(edge);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let minU = Infinity, maxU = -Infinity;
      let minV = Infinity, maxV = -Infinity;
      for (let k = 0; k < n; k++) {
        const u = hull[k].x * cos + hull[k].y * sin;
        const v = -hull[k].x * sin + hull[k].y * cos;
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      const w = maxU - minU;
      const h = maxV - minV;
      const area = w * h;
      if (area < bestArea) {
        bestArea = area;
        bestAngle = angle;
        bestW = w;
        bestH = h;
        const cu = (minU + maxU) * 0.5;
        const cv = (minV + maxV) * 0.5;
        bestCenter = new Vec2(cu * cos - cv * sin, cu * sin + cv * cos);
      }
    }
    return new OBB2D(bestCenter, bestW, bestH, bestAngle);
  }
};
function ringArea(r) {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}
function orientRing(r, ccw) {
  const last = r[r.length - 1];
  const ring = r.length > 1 && r[0].x === last.x && r[0].y === last.y ? r.slice(0, -1) : r.slice();
  return ringArea(ring) > 0 === ccw ? ring : ring.reverse();
}
function bridgeHole(outer, hole) {
  let hi = 0;
  for (let i = 1; i < hole.length; i++) if (hole[i].x > hole[hi].x) hi = i;
  const h = hole[hi];
  let best = -1, bestD = Infinity;
  for (let i = 0; i < outer.length; i++) {
    const o = outer[i];
    if (o.x < h.x) continue;
    const d = (o.x - h.x) ** 2 + (o.y - h.y) ** 2;
    if (d < bestD && !cutCrosses(h, o, outer, hole)) {
      bestD = d;
      best = i;
    }
  }
  if (best < 0) best = 0;
  const holeLoop = [...hole.slice(hi), ...hole.slice(0, hi), h];
  return [...outer.slice(0, best + 1), ...holeLoop, ...outer.slice(best)];
}
function cutCrosses(a, b, ...rings) {
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length];
    if (p === a || q === a || p === b || q === b) continue;
    if (side(a, b, p) !== side(a, b, q) && side(p, q, a) !== side(p, q, b)) return true;
  }
  return false;
}
function earClipRing(poly) {
  const tris = [];
  const idx = poly.map((_, i) => i);
  const isEar = (i, j, k) => {
    const a = poly[i], b = poly[j], c = poly[k];
    if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 1e-18) return false;
    for (const m of idx) {
      if (m === i || m === j || m === k) continue;
      const p = poly[m];
      const s1 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      const s2 = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
      const s3 = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x);
      if (s1 >= 0 && s2 >= 0 && s3 >= 0 && !(p.x === a.x && p.y === a.y) && !(p.x === b.x && p.y === b.y) && !(p.x === c.x && p.y === c.y)) return false;
    }
    return true;
  };
  let guard = 0;
  while (idx.length > 3 && guard++ < 1e4) {
    let clipped = false;
    for (let n = 0; n < idx.length; n++) {
      const i = idx[(n + idx.length - 1) % idx.length], j = idx[n], k = idx[(n + 1) % idx.length];
      if (isEar(i, j, k)) {
        tris.push([poly[i], poly[j], poly[k]]);
        idx.splice(n, 1);
        clipped = true;
        break;
      }
    }
    if (!clipped) break;
  }
  if (idx.length === 3) tris.push([poly[idx[0]], poly[idx[1]], poly[idx[2]]]);
  return tris;
}
function pointInTriangle2D(p, a, b, c) {
  const d1 = Polygon2D.cross2D(a, b, p);
  const d2 = Polygon2D.cross2D(b, c, p);
  const d3 = Polygon2D.cross2D(c, a, p);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function nextKept(keep, i, n) {
  let next = (i + 1) % n;
  while (!keep[next] && next !== i) next = (next + 1) % n;
  return next;
}
function prevKept(keep, i, n) {
  let prev = (i - 1 + n) % n;
  while (!keep[prev] && prev !== i) prev = (prev - 1 + n) % n;
  return prev;
}

// src/core/geometry/PolygonBool.ts
var import_polygon_clipping = __toESM(require("polygon-clipping"));
var SNAP = 1e-3;
function snap(n) {
  return SNAP > 0 ? Math.round(n / SNAP) * SNAP : n;
}
function ringToPC(ring) {
  return ring.map((v) => [snap(v.x), snap(v.y)]);
}
function multiToPC(mp) {
  return mp.map((poly) => poly.map(ringToPC));
}
function pcRingToRing(r) {
  const pts = r.map(([x, y]) => new Vec2(x, y));
  if (pts.length > 1) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (a.x === b.x && a.y === b.y) pts.pop();
  }
  return pts;
}
function pcToMulti(geom) {
  return geom.map((poly) => poly.map(pcRingToRing));
}
var PolygonBool = {
  // ── construction / inspection ──
  /** Wrap a single solid ring as a multipolygon. */
  fromRing(ring) {
    return [[ring]];
  },
  /** Flatten every ring (outer + holes, all polygons) — handy for drawing. */
  rings(mp) {
    const out = [];
    for (const poly of mp) for (const ring of poly) out.push(ring);
    return out;
  },
  /** True when the multipolygon encloses no area. */
  isEmpty(mp) {
    return mp.length === 0 || mp.every((poly) => poly.length === 0);
  },
  /**
   * Total enclosed area (outer rings minus holes). Always non-negative; relies
   * on polygon-clipping's CCW-outer / CW-hole output, but uses absolute ring
   * areas so it is also correct for hand-built input with consistent winding.
   */
  area(mp) {
    let total = 0;
    for (const poly of mp) {
      poly.forEach((ring, i) => {
        const a = Math.abs(Polygon2D.signedArea(ring));
        total += i === 0 ? a : -a;
      });
    }
    return total;
  },
  // ── boolean ops ──
  /** Union of one or more multipolygons. */
  union(...mps) {
    const nonEmpty = mps.filter((m) => !PolygonBool.isEmpty(m));
    if (nonEmpty.length === 0) return [];
    const [first, ...rest] = nonEmpty.map(multiToPC);
    return pcToMulti(import_polygon_clipping.default.union(first, ...rest));
  },
  /** `subject` minus every `clip`. */
  difference(subject, ...clips) {
    if (PolygonBool.isEmpty(subject)) return [];
    const clipsNonEmpty = clips.filter((m) => !PolygonBool.isEmpty(m));
    if (clipsNonEmpty.length === 0) return PolygonBool.union(subject);
    return pcToMulti(
      import_polygon_clipping.default.difference(multiToPC(subject), ...clipsNonEmpty.map(multiToPC))
    );
  },
  /** Intersection of two or more multipolygons. */
  intersection(...mps) {
    if (mps.length === 0 || mps.some((m) => PolygonBool.isEmpty(m))) return [];
    const [first, ...rest] = mps.map(multiToPC);
    return pcToMulti(import_polygon_clipping.default.intersection(first, ...rest));
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

// src/io/DxfWriter.ts
function _sanLayer(s) {
  return s.trim().replace(/[^A-Za-z0-9$_-]/g, "_").slice(0, 31) || "LAYER0";
}
function _real(n) {
  if (!Number.isFinite(n) || Math.abs(n) < 1e-9) return "0";
  let s = n.toFixed(9);
  if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}
function _resolveLayers(defs, used) {
  const colorOf = /* @__PURE__ */ new Map();
  const names = [];
  for (const d of defs) {
    const n = _sanLayer(d.name);
    if (!colorOf.has(n)) {
      names.push(n);
      colorOf.set(n, d.color ?? 7);
    }
  }
  for (const raw of used) {
    const n = _sanLayer(raw);
    if (!colorOf.has(n)) {
      names.push(n);
      colorOf.set(n, 7);
    }
  }
  return { names, colorOf };
}
var LINETYPES = {
  DASHED: { desc: "Dashed __ __ __", pattern: [3, -1.5] },
  HIDDEN: { desc: "Hidden _ _ _ _", pattern: [1.5, -1] },
  DOTTED: { desc: "Dotted . . . .", pattern: [0, -1] },
  CENTER: { desc: "Center ____ _ ____", pattern: [6, -1.2, 1, -1.2] }
};
function _writeR12Prologue(lines, names, colorOf, scale = 1e3, linetypes = {}) {
  const used = [.../* @__PURE__ */ new Set([...linetypes.used ?? [], ...linetypes.layerType?.values() ?? []])].filter((n) => n in LINETYPES);
  const ps = linetypes.patternScale ?? 1;
  lines.push(
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$ACADVER",
    "1",
    "AC1009",
    "9",
    "$INSUNITS",
    "70",
    scale === 1 ? "6" : "4",
    "9",
    "$MEASUREMENT",
    "70",
    "1",
    "0",
    "ENDSEC"
  );
  lines.push("0", "SECTION", "2", "TABLES");
  lines.push("0", "TABLE", "2", "LTYPE", "70", String(1 + used.length));
  lines.push("0", "LTYPE", "2", "CONTINUOUS", "70", "0", "3", "Solid line", "72", "65", "73", "0", "40", "0");
  for (const name of used) {
    const { desc, pattern } = LINETYPES[name];
    const total = pattern.reduce((a, b) => a + Math.abs(b), 0) * ps;
    lines.push("0", "LTYPE", "2", name, "70", "0", "3", desc, "72", "65", "73", String(pattern.length), "40", _real(total));
    for (const d of pattern) lines.push("49", _real(d * ps));
  }
  lines.push("0", "ENDTAB");
  lines.push("0", "TABLE", "2", "LAYER", "70", String(names.length));
  for (const name of names) lines.push("0", "LAYER", "2", name, "70", "0", "62", String(colorOf.get(name) ?? 7), "6", linetypes.layerType?.get(name) ?? "CONTINUOUS");
  lines.push("0", "ENDTAB", "0", "ENDSEC");
  lines.push("0", "SECTION", "2", "BLOCKS", "0", "ENDSEC");
}
function writeDxf2D(content, opts = {}) {
  const scale = opts.scale ?? 1;
  if (!(Number.isFinite(scale) && scale > 0)) throw new Error(`writeDxf2D: scale must be a positive number, got ${scale}`);
  const polylines = content.polylines ?? [];
  const lineSegs = content.lines ?? [];
  const circles = content.circles ?? [];
  const arcs = content.arcs ?? [];
  const texts = content.texts ?? [];
  const solids = content.solids ?? [];
  const okR = (r) => Number.isFinite(r) && r > 1e-9;
  const finite = (p) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const bad = (what, i, layer, why = "a non-finite coordinate") => {
    throw new Error(`writeDxf2D: ${what} ${i} (layer "${layer}") has ${why}`);
  };
  polylines.forEach((p, i) => {
    if (!p.points.every(finite)) bad("polyline", i, p.layer);
  });
  lineSegs.forEach((l, i) => {
    if (!finite(l.start) || !finite(l.end)) bad("line", i, l.layer);
  });
  circles.forEach((c, i) => {
    if (okR(c.radius) && !finite(c.center)) bad("circle", i, c.layer);
  });
  arcs.forEach((a, i) => {
    if (okR(a.radius) && (!finite(a.center) || !Number.isFinite(a.startDeg) || !Number.isFinite(a.endDeg))) bad("arc", i, a.layer);
  });
  texts.forEach((t, i) => {
    if (!finite(t.at)) bad("text", i, t.layer);
    if (!(Number.isFinite(t.height) && t.height > 0)) bad("text", i, t.layer, `a height of ${t.height} (needs > 0)`);
  });
  const used = /* @__PURE__ */ new Set();
  for (const p of polylines) if (p.points.length >= 2) used.add(p.layer);
  for (const l of lineSegs) used.add(l.layer);
  for (const c of circles) if (okR(c.radius)) used.add(c.layer);
  for (const a of arcs) if (okR(a.radius)) used.add(a.layer);
  for (const t of texts) used.add(t.layer);
  for (const so of solids) if (so.points.length >= 3) used.add(so.layer);
  solids.forEach((so, i) => {
    if (!so.points.every(finite)) bad("solid", i, so.layer);
  });
  const lines = [];
  const { names, colorOf } = _resolveLayers(content.layers ?? [], used);
  const layerType = /* @__PURE__ */ new Map();
  for (const d of content.layers ?? []) if (d.lineType && d.lineType !== "CONTINUOUS") layerType.set(_sanLayer(d.name), d.lineType.toUpperCase());
  const usedTypes = [...polylines, ...lineSegs, ...circles, ...arcs].map((e) => e.linetype).filter((t) => !!t);
  _writeR12Prologue(lines, names, colorOf, scale, { used: usedTypes, layerType, patternScale: opts.linetypeScale ?? 1 });
  const look = (e) => [...e.linetype ? ["6", e.linetype] : [], ...e.color !== void 0 ? ["62", String(e.color)] : []];
  const v = (n) => _real(n * scale);
  const xy = (p) => ["10", v(p.x), "20", v(p.y), "30", "0"];
  const emitCircle = (e, c, r) => lines.push("0", "CIRCLE", "8", _sanLayer(e.layer), ...look(e), ...xy(c), "40", v(r));
  lines.push("0", "SECTION", "2", "ENTITIES");
  for (const poly of polylines) {
    if (poly.points.length < 2) continue;
    const layer = _sanLayer(poly.layer);
    lines.push("0", "POLYLINE", "8", layer, ...look(poly), "66", "1", "70", poly.closed ? "1" : "0", "10", "0", "20", "0", "30", "0");
    for (const p of poly.points) lines.push("0", "VERTEX", "8", layer, ...xy(p), "70", "0");
    lines.push("0", "SEQEND", "8", layer);
  }
  for (const l of lineSegs) {
    lines.push("0", "LINE", "8", _sanLayer(l.layer), ...look(l), ...xy(l.start), "11", v(l.end.x), "21", v(l.end.y), "31", "0");
  }
  for (const c of circles) if (okR(c.radius)) emitCircle(c, c.center, c.radius);
  for (const a of arcs) {
    if (!okR(a.radius)) continue;
    if (Math.abs(a.endDeg - a.startDeg) >= 360 - 1e-6) {
      emitCircle(a, a.center, a.radius);
      continue;
    }
    const norm = (d) => {
      let x = d % 360;
      if (x < 0) x += 360;
      return x;
    };
    lines.push("0", "ARC", "8", _sanLayer(a.layer), ...look(a), ...xy(a.center), "40", v(a.radius), "50", _real(norm(a.startDeg)), "51", _real(norm(a.endDeg)));
  }
  for (const so of solids) {
    if (so.points.length < 3) continue;
    const [p1, p2, p3, p4 = so.points[2]] = so.points;
    lines.push(
      "0",
      "SOLID",
      "8",
      _sanLayer(so.layer),
      ...so.color !== void 0 ? ["62", String(so.color)] : [],
      "10",
      v(p1.x),
      "20",
      v(p1.y),
      "30",
      "0",
      "11",
      v(p2.x),
      "21",
      v(p2.y),
      "31",
      "0",
      "12",
      v(p4.x),
      "22",
      v(p4.y),
      "32",
      "0",
      "13",
      v(p3.x),
      "23",
      v(p3.y),
      "33",
      "0"
    );
  }
  for (const t of texts) {
    const h = t.align === "center" ? 1 : t.align === "right" ? 2 : 0;
    const vj = t.valign === "bottom" ? 1 : t.valign === "middle" ? 2 : t.valign === "top" ? 3 : 0;
    lines.push(
      "0",
      "TEXT",
      "8",
      _sanLayer(t.layer),
      ...t.color !== void 0 ? ["62", String(t.color)] : [],
      ...xy(t.at),
      "40",
      v(t.height),
      "1",
      t.text.replace(/[\r\n]+/g, " "),
      "50",
      _real(t.rotationDeg ?? 0)
    );
    if (h || vj) lines.push("72", String(h), "11", v(t.at.x), "21", v(t.at.y), "31", "0", "73", String(vj));
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\r\n") + "\r\n";
}
var ACI = [
  [1, 255, 0, 0],
  [2, 255, 255, 0],
  [3, 0, 255, 0],
  [4, 0, 255, 255],
  [5, 0, 0, 255],
  [6, 255, 0, 255],
  [7, 0, 0, 0],
  [8, 128, 128, 128],
  [9, 192, 192, 192],
  [250, 51, 51, 51],
  [251, 80, 80, 80],
  [252, 105, 105, 105],
  [253, 130, 130, 130],
  [254, 190, 190, 190],
  [255, 255, 255, 255],
  [30, 255, 127, 0],
  [140, 0, 127, 255],
  [210, 255, 0, 127],
  [94, 0, 127, 0],
  [14, 127, 0, 0]
];
function aciFromHex(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 7;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  if (Math.max(r, g, b) - Math.min(r, g, b) < 24 && (r < 40 || r > 235)) return 7;
  let best = 7, bestD = Infinity;
  for (const [i, R, G, B] of ACI) {
    const d = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

// src/core/drawing/Sheet.ts
var DASH_PATTERNS = {
  dashed: [3, 1.5],
  hidden: [1.5, 1],
  dotted: [0.2, 1],
  center: [6, 1.2, 1, 1.2]
};
var DEFAULT_STYLE = { color: "#000000", weight: 0.25, dash: "solid" };
var SheetView = class {
  /** @internal — views come from `sheet.view(name)`. */
  constructor(sheet, name, opts) {
    this.entities = [];
    this.sheet = sheet;
    this.name = name;
    this.opts = opts;
  }
  get options() {
    return this.opts;
  }
  /** Lines through points; `closed` shuts the ring, `fill` colours its inside. Accepts 2D
   *  points, or `Vec3` when the view has `project`. */
  polyline(points, opts = {}) {
    const pts = points.map((p) => this.local(p));
    if (pts.length >= 2) this.entities.push({ t: "polyline", points: pts, closed: !!opts.closed, fill: opts.fill, o: opts });
    return this;
  }
  line(a, b, opts = {}) {
    return this.polyline([a, b], opts);
  }
  /** Axis-aligned rectangle from its lower-left corner. */
  rect(x, y, w, h, opts = {}) {
    return this.polyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...opts, closed: true });
  }
  circle(center, radius, opts = {}) {
    this.entities.push({ t: "circle", c: this.local(center), r: radius, o: opts });
    return this;
  }
  /** Counter-clockwise arc from `startDeg` to `endDeg`. */
  arc(center, radius, startDeg, endDeg, opts = {}) {
    this.entities.push({ t: "arc", c: this.local(center), r: radius, a0: startDeg, a1: endDeg, o: opts });
    return this;
  }
  /** A solid fill (poché): one ring, or [outer, ...holes]. */
  fill(rings, opts = {}) {
    const nested = Array.isArray(rings[0]) && rings[0].length > 0 && typeof rings[0][0] === "object";
    const list = nested ? rings : [rings];
    this.entities.push({ t: "fill", rings: list.map((r) => r.map((p) => this.local(p))), color: opts.color, o: opts });
    return this;
  }
  text(text, at, opts = {}) {
    this.entities.push({ t: "text", at: this.local(at), text, o: opts });
    return this;
  }
  /** A dimension between two points, with extension lines, ticks and the measured length. */
  dim(a, b, opts = {}) {
    this.entities.push({ t: "dim", a: this.local(a), b: this.local(b), o: opts });
    return this;
  }
  /** A radius dimension: centre mark, a line from the centre to the arc at `angle` degrees
   *  (default 45) with an arrow, and "R 1200" along it. */
  radius(center, radius, opts = {}) {
    this.entities.push({ t: "radius", c: this.local(center), r: radius, angle: opts.angle ?? 45, o: opts });
    return this;
  }
  /** A leader: an arrow at `points[0]` (what it points at), lines through the rest, and the
   *  text beside the last point. */
  leader(points, text, opts = {}) {
    const pts = points.map((p) => this.local(p));
    if (pts.length >= 2) this.entities.push({ t: "leader", points: pts, text, o: opts });
    return this;
  }
  /** A level mark: a triangle standing on the level at `at`, and the level in metres with
   *  its sign ("+2.450", "±0.000"). */
  level(at, opts = {}) {
    this.entities.push({ t: "level", at: this.local(at), o: opts });
    return this;
  }
  /** Projected segments, e.g. from `DxfExporter.toSegments(view)` (hidden lines removed). */
  segments(segs, opts = {}) {
    for (const s of segs) this.entities.push({ t: "polyline", points: [{ x: s.u0, y: s.v0 }, { x: s.u1, y: s.v1 }], closed: false, o: { layer: s.layer, ...opts } });
    return this;
  }
  local(p) {
    let q = toPt(p);
    const pr = this.opts.project, z = p.z;
    if (z !== void 0 && pr) {
      if (typeof pr === "function") q = toPt(pr(p));
      else {
        const { right, up, origin } = pr;
        const dx = q.x - (origin?.x ?? 0), dy = q.y - (origin?.y ?? 0), dz = z - (origin?.z ?? 0);
        q = { x: dx * right.x + dy * right.y + dz * right.z, y: dx * up.x + dy * up.y + dz * up.z };
      }
    }
    if (!Number.isFinite(q.x) || !Number.isFinite(q.y)) throw new Error(`Sheet view "${this.name}": non-finite point (${q.x}, ${q.y})`);
    return { x: q.x, y: q.y };
  }
  /** @internal */
  get sheetRef() {
    return this.sheet;
  }
};
var Sheet = class {
  constructor(opts = {}) {
    this.layerStyles = /* @__PURE__ */ new Map();
    this.views = /* @__PURE__ */ new Map();
    this.scale = opts.scale ?? 1;
    if (!(this.scale > 0)) throw new Error(`Sheet: scale must be positive (50 = 1:50), got ${opts.scale}`);
    for (const [name, style] of Object.entries(opts.layers ?? {})) this.layerStyles.set(name, style);
  }
  /** Define or change a layer's style. */
  layer(name, style) {
    this.layerStyles.set(name, { ...this.layerStyles.get(name), ...style });
    return this;
  }
  get layers() {
    return this.layerStyles;
  }
  /** The view named `name` — created with `opts` the first time. */
  view(name, opts = {}) {
    let v = this.views.get(name);
    if (!v) {
      v = new SheetView(this, name, opts);
      this.views.set(name, v);
    }
    return v;
  }
  /** The default view at the origin (`sheet.main.polyline(…)`). */
  get main() {
    return this.view("main");
  }
  viewNames() {
    return [...this.views.keys()];
  }
  /** Paper millimetres → sheet (model) units. */
  paper(mm) {
    return mm * this.scale / 1e3;
  }
  /** Everything as plain primitives in sheet coordinates — what every output draws. */
  explode() {
    const fills = [], rest = [];
    for (const view of this.views.values()) {
      const vo = view.options;
      const k = vo.scale ?? 1;
      const rot = (vo.rotation ?? 0) * Math.PI / 180, cr = Math.cos(rot), sr = Math.sin(rot);
      const at = vo.at ? toPt(vo.at) : { x: 0, y: 0 };
      const T = (p) => ({ x: at.x + k * (p.x * cr - p.y * sr), y: at.y + k * (p.x * sr + p.y * cr) });
      const P2 = (mm) => this.paper(mm) / k;
      const local = [];
      for (const e of view.entities) this.explodeEntity(e, P2, local);
      if (vo.title) {
        const b = boundsOf(local);
        if (b) local.push(textPrim(vo.title, { x: (b.min.x + b.max.x) / 2, y: b.min.y - P2(8) }, P2(3.5), 0, "center", "top", this.style({})));
      }
      for (const p of local) {
        const q = transformPrim(p, T, k, vo.rotation ?? 0);
        (q.kind === "fill" ? fills : rest).push(q);
      }
    }
    return [...fills, ...rest];
  }
  /** Bounds of the exploded drawing (text estimated), or null when empty. */
  bounds() {
    return boundsOf(this.explode());
  }
  /** The resolved style of an entity: layer style, then its overrides. */
  style(o) {
    const layer = o.layer ?? "0";
    const ls = this.layerStyles.get(layer) ?? {};
    return {
      layer,
      color: o.color ?? ls.color ?? DEFAULT_STYLE.color,
      weight: o.weight ?? ls.weight ?? DEFAULT_STYLE.weight,
      dash: o.dash ?? ls.dash ?? DEFAULT_STYLE.dash
    };
  }
  /** The sheet as an SVG document, sized in millimetres on paper (`margin` in mm). */
  toSVG(opts = {}) {
    return sheetToSVG(this, opts);
  }
  /**
   * The sheet as DXF R12: lines, polylines, arcs, circles, text with its alignment, dashed
   * line types, layers with their colours; fills as SOLID triangles. `units: "mm"` (default)
   * writes model metres as millimetres. Pen weights have no place in R12 — they travel with
   * the layers, as CAD plotting does.
   */
  toDXF(opts = {}) {
    return sheetToDXF(this, opts);
  }
  explodeEntity(e, P2, out) {
    const st = this.style(e.o);
    const key = e.o.key;
    switch (e.t) {
      case "polyline": {
        if (e.fill) out.push({ kind: "fill", rings: [e.points], color: e.fill, layer: st.layer, key });
        out.push({ kind: "polyline", points: e.points, closed: e.closed, style: st, key });
        break;
      }
      case "circle":
        out.push({ kind: "circle", center: e.c, radius: e.r, style: st, key });
        break;
      case "arc":
        out.push({ kind: "arc", center: e.c, radius: e.r, startDeg: e.a0, endDeg: e.a1, style: st, key });
        break;
      case "fill": {
        const layerFill = this.layerStyles.get(st.layer)?.fill;
        out.push({ kind: "fill", rings: e.rings, color: e.color ?? layerFill ?? "#d9d9d9", layer: st.layer, key });
        break;
      }
      case "text": {
        const o = e.o;
        out.push({ ...textPrim(e.text, e.at, P2(o.size ?? 2.5), o.rotation ?? 0, o.align ?? "left", o.baseline ?? "bottom", st), ...key ? { key } : {} });
        break;
      }
      case "dim":
        explodeDim(e.a, e.b, e.o, st, P2, out);
        break;
      case "radius":
        explodeRadius(e.c, e.r, e.angle, e.o, st, P2, out);
        break;
      case "leader":
        explodeLeader(e.points, e.text, e.o, st, P2, out);
        break;
      case "level":
        explodeLevel(e.at, e.o, st, P2, out);
        break;
    }
  }
};
function explodeDim(a, b, o, st, P2, out) {
  const dir = o.direction ?? "aligned";
  let ux = b.x - a.x, uy = b.y - a.y;
  if (dir === "horizontal") {
    ux = Math.sign(ux) || 1;
    uy = 0;
  }
  if (dir === "vertical") {
    ux = 0;
    uy = Math.sign(uy) || 1;
  }
  const len = Math.hypot(ux, uy);
  if (len < 1e-12) return;
  ux /= len;
  uy /= len;
  const nx = -uy, ny = ux;
  const measured = Math.abs((b.x - a.x) * ux + (b.y - a.y) * uy);
  const off = P2(o.offset ?? 8);
  const ka = a.x * nx + a.y * ny, kb = b.x * nx + b.y * ny;
  const base = (off >= 0 ? Math.max(ka, kb) : Math.min(ka, kb)) + off;
  const onLine = (p) => {
    const d = base - (p.x * nx + p.y * ny);
    return { x: p.x + nx * d, y: p.y + ny * d };
  };
  const da = onLine(a), db = onLine(b);
  const gap = P2(1), over = P2(2);
  const ext = (p, q) => {
    const L = Math.hypot(q.x - p.x, q.y - p.y);
    if (L <= gap) return;
    const ex = (q.x - p.x) / L, ey = (q.y - p.y) / L;
    out.push({ kind: "polyline", points: [{ x: p.x + ex * gap, y: p.y + ey * gap }, { x: q.x + ex * over, y: q.y + ey * over }], closed: false, style: st });
  };
  ext(a, da);
  ext(b, db);
  out.push({ kind: "polyline", points: [da, db], closed: false, style: st });
  const t = P2(1.25), tx = (ux + nx) * Math.SQRT1_2 * t, ty = (uy + ny) * Math.SQRT1_2 * t;
  for (const p of [da, db]) out.push({ kind: "polyline", points: [{ x: p.x - tx, y: p.y - ty }, { x: p.x + tx, y: p.y + ty }], closed: false, style: { ...st, weight: Math.max(st.weight, 0.35) } });
  const text = o.text ?? formatLength(measured, o);
  const ang = upright(ux, uy), r = ang * Math.PI / 180;
  const mid = { x: (da.x + db.x) / 2 - Math.sin(r) * P2(1), y: (da.y + db.y) / 2 + Math.cos(r) * P2(1) };
  out.push(textPrim(text, mid, P2(o.size ?? 2.5), ang, "center", "bottom", st));
}
function explodeRadius(c, radius, angle, o, st, P2, out) {
  const ux = Math.cos(angle * Math.PI / 180), uy = Math.sin(angle * Math.PI / 180);
  const m = P2(1.5);
  out.push({ kind: "polyline", points: [{ x: c.x - m, y: c.y }, { x: c.x + m, y: c.y }], closed: false, style: st });
  out.push({ kind: "polyline", points: [{ x: c.x, y: c.y - m }, { x: c.x, y: c.y + m }], closed: false, style: st });
  const end = { x: c.x + ux * radius, y: c.y + uy * radius };
  out.push({ kind: "polyline", points: [c, end], closed: false, style: st });
  out.push(arrow(end, ux, uy, P2, st));
  const ang = upright(ux, uy), r = ang * Math.PI / 180;
  const mid = { x: c.x + ux * radius / 2 - Math.sin(r) * P2(1), y: c.y + uy * radius / 2 + Math.cos(r) * P2(1) };
  out.push(textPrim(o.text ?? `R ${formatLength(radius, o)}`, mid, P2(o.size ?? 2.5), ang, "center", "bottom", st));
}
function explodeLeader(points, text, o, st, P2, out) {
  out.push({ kind: "polyline", points, closed: false, style: st });
  const [p0, p1] = points, L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  if (L > 0) out.push(arrow(p0, (p0.x - p1.x) / L, (p0.y - p1.y) / L, P2, st));
  const a = points[points.length - 2], b = points[points.length - 1];
  const right = b.x >= a.x;
  const at = { x: b.x + (right ? P2(1) : -P2(1)), y: b.y };
  out.push(textPrim(text, at, P2(o.size ?? 2.5), 0, o.align ?? (right ? "left" : "right"), o.baseline ?? "middle", st));
}
function explodeLevel(at, o, st, P2, out) {
  const h = P2(2.2), w = P2(1.3);
  out.push({ kind: "polyline", points: [at, { x: at.x - w, y: at.y + h }, { x: at.x + w, y: at.y + h }], closed: true, style: st });
  const v = o.value ?? at.y;
  const s = v.toFixed(o.decimals ?? 3);
  const text = o.text ?? (Number(s) === 0 ? `\xB1${s.replace("-", "")}` : v > 0 ? `+${s}` : s);
  out.push(textPrim(text, { x: at.x + w + P2(1), y: at.y + h / 2 }, P2(o.size ?? 2.5), 0, "left", "middle", st));
}
function arrow(p, ux, uy, P2, st) {
  const L = P2(2.5), c = Math.cos(0.3), s = Math.sin(0.3);
  const back = (sg) => ({ x: p.x - L * (ux * c - sg * uy * s), y: p.y - L * (uy * c + sg * ux * s) });
  return { kind: "polyline", points: [back(1), p, back(-1)], closed: false, style: st };
}
function upright(ux, uy) {
  let ang = Math.atan2(uy, ux) * 180 / Math.PI;
  if (ang > 90 + 1e-9 || ang <= -90 + 1e-9) ang += 180;
  return (ang % 360 + 360) % 360;
}
function formatLength(m, o) {
  const unit = o.unit ?? "mm";
  const value = m * (unit === "mm" ? 1e3 : unit === "cm" ? 100 : 1);
  return value.toFixed(o.decimals ?? (unit === "mm" ? 0 : unit === "cm" ? 1 : 2));
}
function toPt(p) {
  return Array.isArray(p) ? { x: p[0], y: p[1] } : p;
}
function textPrim(text, at, height, rotation, align, baseline, style) {
  return { kind: "text", at, text, height, rotation, align, baseline, style };
}
function transformPrim(p, T, k, rotDeg) {
  switch (p.kind) {
    case "polyline":
      return { ...p, points: p.points.map(T) };
    case "circle":
      return { ...p, center: T(p.center), radius: p.radius * k };
    case "arc":
      return { ...p, center: T(p.center), radius: p.radius * k, startDeg: p.startDeg + rotDeg, endDeg: p.endDeg + rotDeg };
    case "fill":
      return { ...p, rings: p.rings.map((r) => r.map(T)) };
    case "text":
      return { ...p, at: T(p.at), height: p.height * k, rotation: p.rotation + rotDeg };
  }
}
function textCorners(t) {
  const w = t.text.length * t.height * 0.6, h = t.height;
  const x0 = t.align === "left" ? 0 : t.align === "center" ? -w / 2 : -w;
  const y0 = t.baseline === "bottom" ? 0 : t.baseline === "middle" ? -h / 2 : -h;
  const r = t.rotation * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]].map(([x, y]) => ({ x: t.at.x + x * c - y * s, y: t.at.y + x * s + y * c }));
}
function boundsOf(prims) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (p) => {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  };
  for (const p of prims) {
    if (p.kind === "polyline") p.points.forEach(add);
    else if (p.kind === "fill") p.rings.forEach((r) => r.forEach(add));
    else if (p.kind === "circle") {
      add({ x: p.center.x - p.radius, y: p.center.y - p.radius });
      add({ x: p.center.x + p.radius, y: p.center.y + p.radius });
    } else if (p.kind === "arc") {
      let sweep = (p.endDeg - p.startDeg) % 360;
      if (sweep <= 0) sweep += 360;
      const at = (deg) => add({ x: p.center.x + p.radius * Math.cos(deg * Math.PI / 180), y: p.center.y + p.radius * Math.sin(deg * Math.PI / 180) });
      at(p.startDeg);
      at(p.startDeg + sweep);
      for (let q = Math.ceil(p.startDeg / 90) * 90; q < p.startDeg + sweep; q += 90) at(q);
    } else textCorners(p).forEach(add);
  }
  return x0 === Infinity ? null : { min: { x: x0, y: y0 }, max: { x: x1, y: y1 } };
}
function pickPrim(prims, p, tolerance) {
  for (let i = prims.length - 1; i >= 0; i--) {
    const q = prims[i];
    if (q.kind !== "fill" && primDistance(q, p) <= tolerance) return q;
  }
  for (let i = prims.length - 1; i >= 0; i--) {
    const q = prims[i];
    if (q.kind === "fill" && q.rings.reduce((inside, r) => inside !== inRing(r, p), false)) return q;
  }
  return null;
}
function primDistance(q, p) {
  if (q.kind === "polyline") {
    let d = Infinity;
    const n = q.points.length, m = q.closed ? n : n - 1;
    for (let i = 0; i < m; i++) d = Math.min(d, segDistance(p, q.points[i], q.points[(i + 1) % n]));
    return d;
  }
  if (q.kind === "circle") return Math.abs(Math.hypot(p.x - q.center.x, p.y - q.center.y) - q.radius);
  if (q.kind === "arc") {
    let a = Math.atan2(p.y - q.center.y, p.x - q.center.x) * 180 / Math.PI - q.startDeg;
    a = (a % 360 + 360) % 360;
    let sweep = (q.endDeg - q.startDeg) % 360;
    if (sweep <= 0) sweep += 360;
    if (a <= sweep) return Math.abs(Math.hypot(p.x - q.center.x, p.y - q.center.y) - q.radius);
    const end = (deg) => ({ x: q.center.x + q.radius * Math.cos(deg * Math.PI / 180), y: q.center.y + q.radius * Math.sin(deg * Math.PI / 180) });
    const e0 = end(q.startDeg), e1 = end(q.startDeg + sweep);
    return Math.min(Math.hypot(p.x - e0.x, p.y - e0.y), Math.hypot(p.x - e1.x, p.y - e1.y));
  }
  const c = textCorners(q);
  if (inRing(c, p)) return 0;
  return Math.min(...c.map((a, i) => segDistance(p, a, c[(i + 1) % 4])));
}
function segDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  const t = L2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function inRing(r, p) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j];
    if (a.y > p.y !== b.y > p.y && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function sheetToSVG(sheet, opts) {
  const prims = sheet.explode();
  const k = 1e3 / sheet.scale;
  const n = (v) => +v.toFixed(3);
  const X = (p) => n(p.x * k), Y = (p) => n(-p.y * k);
  const b = boundsOf(prims) ?? { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  const m = opts.margin ?? 10;
  const minX = b.min.x * k - m, minY = -b.max.y * k - m;
  const w = (b.max.x - b.min.x) * k + 2 * m, h = (b.max.y - b.min.y) * k + 2 * m;
  const stroke = (s) => `stroke="${s.color}" stroke-width="${n(s.weight)}"${s.dash !== "solid" ? ` stroke-dasharray="${DASH_PATTERNS[s.dash].join(" ")}"` : ""}`;
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}mm" height="${n(h)}mm" viewBox="${n(minX)} ${n(minY)} ${n(w)} ${n(h)}">`);
  if (opts.background) out.push(`<rect x="${n(minX)}" y="${n(minY)}" width="${n(w)}" height="${n(h)}" fill="${opts.background}"/>`);
  out.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round">`);
  for (const p of prims) {
    const key = p.key ? ` data-key="${esc(p.key)}"` : "";
    const layer = ` data-layer="${esc(p.kind === "fill" ? p.layer : p.style.layer)}"`;
    if (p.kind === "polyline") {
      const pts = p.points.map((q) => `${X(q)},${Y(q)}`).join(" ");
      out.push(`<${p.closed ? "polygon" : "polyline"} points="${pts}" ${stroke(p.style)}${layer}${key}/>`);
    } else if (p.kind === "circle") {
      out.push(`<circle cx="${X(p.center)}" cy="${Y(p.center)}" r="${n(p.radius * k)}" ${stroke(p.style)}${layer}${key}/>`);
    } else if (p.kind === "arc") {
      const a0 = p.startDeg * Math.PI / 180, a1 = p.endDeg * Math.PI / 180;
      let sweep = (p.endDeg - p.startDeg) % 360;
      if (sweep <= 0) sweep += 360;
      const s = { x: p.center.x + p.radius * Math.cos(a0), y: p.center.y + p.radius * Math.sin(a0) };
      const e = { x: p.center.x + p.radius * Math.cos(a1), y: p.center.y + p.radius * Math.sin(a1) };
      const r = n(p.radius * k);
      out.push(`<path d="M ${X(s)} ${Y(s)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${X(e)} ${Y(e)}" ${stroke(p.style)}${layer}${key}/>`);
    } else if (p.kind === "fill") {
      const d = p.rings.map((r) => "M " + r.map((q) => `${X(q)} ${Y(q)}`).join(" L ") + " Z").join(" ");
      out.push(`<path d="${d}" fill="${p.color}" fill-rule="evenodd" stroke="none"${layer}${key}/>`);
    } else {
      const anchor = p.align === "left" ? "start" : p.align === "center" ? "middle" : "end";
      const base = p.baseline === "bottom" ? "alphabetic" : p.baseline === "middle" ? "central" : "hanging";
      const x = X(p.at), y = Y(p.at);
      out.push(`<text x="${x}" y="${y}" font-size="${n(p.height * k)}" font-family="Helvetica, Arial, sans-serif" fill="${p.style.color}" stroke="none" text-anchor="${anchor}" dominant-baseline="${base}"${p.rotation ? ` transform="rotate(${n(-p.rotation)} ${x} ${y})"` : ""}${layer}${key}>${esc(p.text)}</text>`);
    }
  }
  out.push(`</g>`, `</svg>`);
  return out.join("\n") + "\n";
}
function sheetToDXF(sheet, opts) {
  const prims = sheet.explode();
  const units = opts.units ?? "mm";
  const c = {
    polylines: [],
    circles: [],
    arcs: [],
    texts: [],
    solids: [],
    layers: []
  };
  const lt = (d) => d === "solid" ? void 0 : d.toUpperCase();
  const layerColor = /* @__PURE__ */ new Map();
  for (const [name, st] of sheet.layers) layerColor.set(name, aciFromHex(st.color ?? DEFAULT_STYLE.color));
  for (const p of prims) {
    if (p.kind === "fill") {
      for (const tri of triangulateRings(p.rings)) c.solids.push({ layer: p.layer, points: tri, color: aciFromHex(p.color) });
      continue;
    }
    const s = p.style;
    const color = aciFromHex(s.color) === (layerColor.get(s.layer) ?? 7) ? void 0 : aciFromHex(s.color);
    const common = { layer: s.layer, ...color !== void 0 ? { color } : {}, ...lt(s.dash) ? { linetype: lt(s.dash) } : {} };
    if (p.kind === "polyline") c.polylines.push({ ...common, points: p.points, closed: p.closed });
    else if (p.kind === "circle") c.circles.push({ ...common, center: p.center, radius: p.radius });
    else if (p.kind === "arc") c.arcs.push({ ...common, center: p.center, radius: p.radius, startDeg: p.startDeg, endDeg: p.endDeg });
    else c.texts.push({ layer: s.layer, ...color !== void 0 ? { color } : {}, at: p.at, text: p.text, height: p.height, rotationDeg: p.rotation, align: p.align, valign: p.baseline });
  }
  const layers = [...sheet.layers].map(([name, st]) => ({ name, color: layerColor.get(name), ...st.dash && st.dash !== "solid" ? { lineType: st.dash.toUpperCase() } : {} }));
  return writeDxf2D({ ...c, layers }, { scale: units === "mm" ? 1e3 : 1, linetypeScale: sheet.scale * (units === "mm" ? 1 : 1e-3) });
}
function triangulateRings(rings) {
  const all = rings.flat();
  return Polygon2D.triangulateWithHoles(rings[0], rings.slice(1)).map((t) => t.map((i) => all[i]));
}

// src/render/SheetCanvas.ts
var FONT = "Helvetica, Arial, sans-serif";
var MIN_PEN_PX = 0.75;
var HIGHLIGHT = "#1e88e5";
function fitSheet(bounds, width, height, margin = 24) {
  if (!bounds) return { scale: 1, x: width / 2, y: height / 2 };
  const bw = Math.max(bounds.max.x - bounds.min.x, 1e-9), bh = Math.max(bounds.max.y - bounds.min.y, 1e-9);
  const scale = Math.max(1e-9, Math.min((width - 2 * margin) / bw, (height - 2 * margin) / bh));
  const cx = (bounds.min.x + bounds.max.x) / 2, cy = (bounds.min.y + bounds.max.y) / 2;
  return { scale, x: width / 2 - cx * scale, y: height / 2 + cy * scale };
}
function drawSheet(ctx, sheet, t, opts = {}) {
  const prims = opts.prims ?? sheet.explode();
  const hl = opts.highlight ? new Set(opts.highlight) : null;
  const hlColor = opts.highlightColor ?? HIGHLIGHT;
  const mmPx = sheet.scale / 1e3 * t.scale;
  const X = (p) => t.x + p.x * t.scale, Y = (p) => t.y - p.y * t.scale;
  const pen = (s, lit) => {
    ctx.strokeStyle = lit ? hlColor : s.color;
    ctx.lineWidth = Math.max(MIN_PEN_PX, s.weight * mmPx) + (lit ? 1.5 : 0);
    ctx.setLineDash(s.dash === "solid" ? [] : DASH_PATTERNS[s.dash].map((d) => Math.max(d * mmPx, 0.5)));
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of prims) {
    const lit = !!(hl && p.key && hl.has(p.key));
    if (p.kind === "fill") {
      ctx.beginPath();
      for (const r of p.rings) r.forEach((q, i) => i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q)));
      ctx.fillStyle = p.color;
      ctx.fill("evenodd");
      if (lit) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = hlColor;
        ctx.fill("evenodd");
        ctx.globalAlpha = 1;
      }
    } else if (p.kind === "polyline") {
      pen(p.style, lit);
      ctx.beginPath();
      p.points.forEach((q, i) => i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q)));
      if (p.closed) ctx.closePath();
      ctx.stroke();
    } else if (p.kind === "circle") {
      pen(p.style, lit);
      ctx.beginPath();
      ctx.arc(X(p.center), Y(p.center), p.radius * t.scale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === "arc") {
      let sweep = (p.endDeg - p.startDeg) % 360;
      if (sweep <= 0) sweep += 360;
      const a0 = -p.startDeg * Math.PI / 180, a1 = -(p.startDeg + sweep) * Math.PI / 180;
      pen(p.style, lit);
      ctx.beginPath();
      ctx.arc(X(p.center), Y(p.center), p.radius * t.scale, a0, a1, true);
      ctx.stroke();
    } else {
      const px = p.height * t.scale;
      if (px < 0.5) continue;
      ctx.save();
      ctx.translate(X(p.at), Y(p.at));
      if (p.rotation) ctx.rotate(-p.rotation * Math.PI / 180);
      ctx.font = `${px}px ${FONT}`;
      ctx.fillStyle = lit ? hlColor : p.style.color;
      ctx.textAlign = p.align;
      ctx.textBaseline = p.baseline === "bottom" ? "alphabetic" : p.baseline === "middle" ? "middle" : "hanging";
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}
var SheetCanvas = class {
  constructor(container, opts = {}) {
    this._sheet = null;
    this.prims = [];
    this.t = { scale: 1, x: 0, y: 0 };
    this.fitted = false;
    this.highlight = [];
    this.pickFns = [];
    this.drawFns = [];
    this.frame = 0;
    this.opts = opts;
    this.canvas = document.createElement("canvas");
    this.canvas.dataset.tektoOverlay = "";
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;";
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.off = this.wire();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    if (opts.sheet) this.setSheet(opts.sheet);
  }
  get sheet() {
    return this._sheet;
  }
  /** The primitives on screen (the sheet, exploded once per `setSheet`). */
  get primitives() {
    return this.prims;
  }
  get transform() {
    return { ...this.t };
  }
  /** Show a sheet. The first one is fitted; later ones keep the zoom, so a sheet rebuilt on
   *  every edit stays put (`fit: true` to refit). */
  setSheet(sheet, opts = {}) {
    this._sheet = sheet;
    this.prims = sheet ? sheet.explode() : [];
    if (opts.fit || !this.fitted) this.fit();
    else this.redraw();
  }
  setTransform(t) {
    this.t = { ...t };
    this.redraw();
  }
  fit() {
    const { width, height } = this.size();
    if (!this._sheet || !width || !height) {
      this.redraw();
      return;
    }
    this.t = fitSheet(boundsOf(this.prims), width, height, this.opts.margin ?? 24);
    this.fitted = true;
    this.redraw();
  }
  toSheet(x, y) {
    return { x: (x - this.t.x) / this.t.scale, y: (this.t.y - y) / this.t.scale };
  }
  toScreen(p) {
    return { x: this.t.x + p.x * this.t.scale, y: this.t.y - p.y * this.t.scale };
  }
  /** The primitive at a canvas position (CSS pixels), or null. */
  pick(x, y) {
    return pickPrim(this.prims, this.toSheet(x, y), (this.opts.pickTolerance ?? 6) / this.t.scale);
  }
  /** Clicks (not drags): the picked primitive, or null for paper. Returns the unsubscribe. */
  onPick(fn) {
    this.pickFns.push(fn);
    return () => {
      this.pickFns = this.pickFns.filter((f) => f !== fn);
    };
  }
  /** Draw primitives with these keys highlighted (a selection); null clears. */
  setHighlight(keys) {
    this.highlight = keys ? [...keys] : [];
    this.redraw();
  }
  /** Paint over the sheet in screen pixels after every redraw. Returns the unsubscribe. */
  onDraw(fn) {
    this.drawFns.push(fn);
    this.redraw();
    return () => {
      this.drawFns = this.drawFns.filter((f) => f !== fn);
      this.redraw();
    };
  }
  /** Redraw on the next frame (calls coalesce). */
  redraw() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.paint();
    });
  }
  /** Draw now — before reading the canvas back. */
  paint() {
    const { width, height, dpr } = this.size();
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const bg = this.opts.background ?? "#ffffff";
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }
    if (this._sheet) drawSheet(ctx, this._sheet, this.t, { prims: this.prims, highlight: this.highlight, highlightColor: this.opts.highlightColor });
    for (const fn of this.drawFns) {
      ctx.save();
      fn(ctx, this.transform);
      ctx.restore();
    }
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.off();
    this.canvas.remove();
  }
  size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { width: this.canvas.clientWidth, height: this.canvas.clientHeight, dpr };
  }
  resize() {
    const { width, height, dpr } = this.size();
    if (!width || !height) return;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    if (!this.fitted && this._sheet) this.fit();
    else this.paint();
  }
  wire() {
    const c = this.canvas;
    const local = (e) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onWheel = (e) => {
      e.preventDefault();
      const p = local(e), k = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 15e-4));
      this.t = { scale: this.t.scale * k, x: p.x - (p.x - this.t.x) * k, y: p.y - (p.y - this.t.y) * k };
      this.redraw();
    };
    let drag = null;
    const onDown = (e) => {
      if (e.button !== 0 && e.button !== 1) return;
      const p = local(e);
      drag = { id: e.pointerId, x: p.x, y: p.y, t: { ...this.t }, moved: false };
      c.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = local(e);
      if (!drag.moved && Math.hypot(p.x - drag.x, p.y - drag.y) < 4) return;
      drag.moved = true;
      this.t = { ...drag.t, x: drag.t.x + p.x - drag.x, y: drag.t.y + p.y - drag.y };
      this.redraw();
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasClick = !drag.moved && e.button === 0;
      drag = null;
      if (!wasClick) return;
      const p = local(e), prim = this.pick(p.x, p.y);
      for (const fn of this.pickFns) fn(prim, { shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey });
    };
    const onCancel = () => {
      drag = null;
    };
    const onDbl = () => this.fit();
    c.addEventListener("wheel", onWheel, { passive: false });
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onCancel);
    c.addEventListener("dblclick", onDbl);
    return () => {
      c.removeEventListener("wheel", onWheel);
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp);
      c.removeEventListener("pointercancel", onCancel);
      c.removeEventListener("dblclick", onDbl);
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Polygon2D,
  PolygonBool,
  Segment,
  Sheet,
  SheetCanvas,
  SheetView,
  Sketch2DInstance,
  Vec2,
  Vec3,
  closestPointOnSegment,
  createRandom,
  download,
  drawSheet,
  fitSheet,
  noise,
  pickPrim,
  segmentSegmentClosest,
  sketch2d,
  stampName,
  writeDxf2D
});
