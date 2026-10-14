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

// src/core.ts
var core_exports = {};
__export(core_exports, {
  AABB: () => AABB,
  Algo: () => Algo,
  ArcCurve: () => ArcCurve,
  BalloonFrame: () => BalloonFrame,
  BlobDetect: () => BlobDetect,
  BspTree: () => BspTree,
  Capsule2D: () => Capsule2D,
  CltConstruction: () => CltConstruction,
  CubicBezierCurve: () => CubicBezierCurve,
  Curvature: () => Curvature,
  CurveUtils: () => CurveUtils,
  DASH_PATTERNS: () => DASH_PATTERNS,
  Delaunay2D: () => Delaunay2D,
  DistanceTransform: () => DistanceTransform,
  Doc: () => Doc,
  ExtrudedRibbon: () => ExtrudedRibbon,
  FloodFill: () => FloodFill,
  Graph: () => Graph,
  GridGraph: () => GridGraph,
  HMath: () => HMath,
  HelixCurve: () => HelixCurve,
  HolzrahmenBau: () => HolzrahmenBau,
  HolzrahmenBauJointStyle: () => HolzrahmenBauJointStyle,
  IfcFile: () => IfcFile,
  IfcModel: () => IfcModel,
  IfcWriter: () => IfcWriter,
  Intersections: () => Intersections,
  JoistedSlab: () => JoistedSlab,
  LineCurve: () => LineCurve,
  MITER_LIMIT: () => MITER_LIMIT,
  MarchingCubes: () => MarchingCubes,
  MarchingSquares: () => MarchingSquares,
  Mat4: () => Mat4,
  MathUtils: () => MathUtils,
  Mesh: () => Mesh,
  MeshAnalysis: () => MeshAnalysis,
  MeshCleanup: () => MeshCleanup,
  MeshFactory: () => MeshFactory,
  MeshSubdivide: () => MeshSubdivide,
  MeshTransform: () => MeshTransform,
  NoFitPolygon: () => NoFitPolygon,
  NurbsCurve: () => NurbsCurve,
  NurbsSurface: () => NurbsSurface,
  OBB2D: () => OBB2D,
  ObjFile: () => ObjFile,
  OpeningType: () => OpeningType,
  PGFace: () => PGFace,
  PGHalfEdge: () => PGHalfEdge,
  PGVertex: () => PGVertex,
  ParamStore: () => ParamStore,
  PixelView: () => PixelView,
  PlanarGraph: () => PlanarGraph,
  PlanarGraphCleanup: () => PlanarGraphCleanup,
  PlanarGraphRepair: () => PlanarGraphRepair,
  Plane: () => Plane,
  Polygon2D: () => Polygon2D,
  PolygonBool: () => PolygonBool,
  PolylineCurve: () => PolylineCurve,
  Ray: () => Ray,
  RibbonEndTrim: () => RibbonEndTrim,
  RibbonFrame: () => RibbonFrame,
  RibbonJoint: () => RibbonJoint,
  RibbonOpening: () => RibbonOpening,
  RibbonSystem: () => RibbonSystem,
  RigidBody2D: () => RigidBody2D,
  Scene: () => Scene,
  SdfBlend: () => SdfBlend,
  SdfBoundedExtrude: () => SdfBoundedExtrude,
  SdfBox: () => SdfBox,
  SdfCapsule: () => SdfCapsule,
  SdfCone: () => SdfCone,
  SdfCylinder: () => SdfCylinder,
  SdfEllipsoid: () => SdfEllipsoid,
  SdfExtrude: () => SdfExtrude,
  SdfGradient: () => SdfGradient,
  SdfIntersect: () => SdfIntersect,
  SdfLattice: () => SdfLattice,
  SdfLineField: () => SdfLine,
  SdfMicrostructure: () => SdfMicrostructure,
  SdfMirror: () => SdfMirror,
  SdfOffset: () => SdfOffset,
  SdfOnion: () => SdfOnion,
  SdfOps: () => SdfOps,
  SdfPlaneField: () => SdfPlane,
  SdfRadialArray: () => SdfRadialArray,
  SdfRevolution: () => SdfRevolution,
  SdfShell: () => SdfShell,
  SdfSmoothSubtract: () => SdfSmoothSubtract,
  SdfSmoothUnion: () => SdfSmoothUnion,
  SdfSphere: () => SdfSphere,
  SdfSubtract: () => SdfSubtract,
  SdfTorus: () => SdfTorus,
  SdfTransform: () => SdfTransform,
  SdfTwist: () => SdfTwist,
  SdfUnion: () => SdfUnion,
  SdfUtils: () => SdfUtils,
  SdfVoronoi: () => SdfVoronoi,
  Segment: () => Segment,
  Selection: () => Selection,
  SharedStore: () => SharedStore,
  Sheet: () => Sheet,
  SheetView: () => SheetView,
  Slab: () => Slab,
  SlabOpening: () => SlabOpening,
  SlabType: () => SlabType,
  SolidConstruction: () => SolidConstruction,
  SolidSlabConstruction: () => SolidSlabConstruction,
  Space: () => Space,
  Sphere: () => Sphere,
  Spring2D: () => Spring2D,
  SpringSystem3D: () => SpringSystem3D,
  Stair: () => Stair,
  StairType: () => StairType,
  StreamlineTracer: () => StreamlineTracer,
  SunPosition: () => SunPosition,
  Triangle: () => Triangle,
  Vec2: () => Vec2,
  Vec3: () => Vec3,
  Vec4: () => Vec4,
  VecMath: () => VecMath,
  VoxelGrid: () => VoxelGrid,
  VoxelGrid2D: () => VoxelGrid2D,
  Wall: () => Wall,
  WallJoint: () => WallJoint,
  WallOpening: () => WallOpening,
  WallSystem: () => WallSystem,
  WallType: () => WallType,
  aciFromHex: () => aciFromHex,
  bindScene: () => bindScene,
  boundingWalls: () => boundingWalls,
  boxOf: () => boxOf,
  buildCutList: () => buildCutList,
  chooseJoistDirection: () => chooseJoistDirection,
  clampedUniformKnots: () => clampedUniformKnots,
  closestPointOnSegment: () => closestPointOnSegment,
  cltLayers: () => cltLayers,
  collabColor: () => collabColor,
  contactBetween: () => contactBetween,
  createLayout: () => createLayout,
  createParams: () => createParams,
  createRandom: () => createRandom,
  devServerAdapter: () => devServerAdapter,
  edgeOutwardVisibility: () => edgeOutwardVisibility,
  findAdjacent: () => findAdjacent,
  holzrahmenbauLayers: () => holzrahmenbauLayers,
  joistDirectionFromBounds: () => joistDirectionFromBounds,
  joistDirectionFromPCA: () => joistDirectionFromPCA,
  joistDirectionFromSupports: () => joistDirectionFromSupports,
  lineClipPolygon: () => lineClipPolygon,
  localAdapter: () => localAdapter,
  memoryAdapter: () => memoryAdapter,
  neighboursOf: () => neighboursOf,
  noise: () => noise,
  perpVisibility: () => perpVisibility,
  perpVisibilityOfPolys: () => perpVisibilityOfPolys,
  pickPrim: () => pickPrim,
  polygonFromVertices: () => polygonFromVertices,
  polygonIntersection: () => polygonIntersection,
  realize: () => realize,
  realizeSlab: () => realizeSlab,
  repelBodies: () => repelBodies,
  reverseContact: () => reverse,
  segmentSegmentClosest: () => segmentSegmentClosest,
  selectOnClick: () => selectOnClick,
  setClipSnap: () => setClipSnap,
  shareSelection: () => shareSelection,
  stampName: () => stampName,
  supabaseAdapter: () => supabaseAdapter,
  writeDxf2D: () => writeDxf2D,
  writeDxf3D: () => writeDxf3D
});
module.exports = __toCommonJS(core_exports);

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
  static rotationX(rad2) {
    const c = Math.cos(rad2), s = Math.sin(rad2);
    const m = _Mat4.identity().m.slice();
    m[5] = c;
    m[6] = s;
    m[9] = -s;
    m[10] = c;
    return new _Mat4(new Float64Array(m));
  }
  static rotationY(rad2) {
    const c = Math.cos(rad2), s = Math.sin(rad2);
    const m = _Mat4.identity().m.slice();
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    return new _Mat4(new Float64Array(m));
  }
  static rotationZ(rad2) {
    const c = Math.cos(rad2), s = Math.sin(rad2);
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
  determinant3x3(a, b, c, d, e, f2, g, h, i) {
    return a * e * i - a * f2 * h - b * d * i + b * f2 * g + c * d * h - c * e * g;
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

// src/core/geometry/Ray.ts
var Ray = class {
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }
  at(t) {
    return this.origin.add(this.direction.mul(t));
  }
  closestPointTo(point) {
    const t = Math.max(0, point.sub(this.origin).dot(this.direction));
    return this.at(t);
  }
  distToPoint(point) {
    return this.closestPointTo(point).distTo(point);
  }
  intersectPlane(plane) {
    const denom = this.direction.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(this.origin.dot(plane.normal) + plane.d) / denom;
    if (t < 0) return null;
    return { t, point: this.at(t) };
  }
  intersectTriangle(tri) {
    const edge1 = tri.b.sub(tri.a);
    const edge2 = tri.c.sub(tri.a);
    const h = this.direction.cross(edge2);
    const a = edge1.dot(h);
    if (Math.abs(a) < HMath.EPSILON) return null;
    const f2 = 1 / a;
    const s = this.origin.sub(tri.a);
    const u = f2 * s.dot(h);
    if (u < 0 || u > 1) return null;
    const q = s.cross(edge1);
    const v = f2 * this.direction.dot(q);
    if (v < 0 || u + v > 1) return null;
    const t = f2 * edge2.dot(q);
    if (t < HMath.EPSILON) return null;
    return { t, point: this.at(t), u, v };
  }
  intersectSphere(sphere) {
    const oc = this.origin.sub(sphere.center);
    const a = this.direction.dot(this.direction);
    const b = 2 * oc.dot(this.direction);
    const c = oc.dot(oc) - sphere.radius * sphere.radius;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return [];
    const sqrtDisc = Math.sqrt(disc);
    const results = [];
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    if (t1 >= 0) results.push({ t: t1, point: this.at(t1) });
    if (t2 >= 0 && !HMath.almostEqual(t1, t2)) results.push({ t: t2, point: this.at(t2) });
    return results;
  }
  intersectAABB(box) {
    let tMin = -Infinity, tMax = Infinity;
    const invD = [1 / this.direction.x, 1 / this.direction.y, 1 / this.direction.z];
    const orig = this.origin.toArray();
    const bMin = box.min.toArray();
    const bMax = box.max.toArray();
    for (let i = 0; i < 3; i++) {
      let t0 = (bMin[i] - orig[i]) * invD[i];
      let t1 = (bMax[i] - orig[i]) * invD[i];
      if (invD[i] < 0) [t0, t1] = [t1, t0];
      tMin = Math.max(tMin, t0);
      tMax = Math.min(tMax, t1);
      if (tMax < tMin) return null;
    }
    return { tMin, tMax };
  }
  toJSON() {
    return { origin: this.origin.toJSON(), direction: this.direction.toJSON() };
  }
};

// src/core/geometry/Plane.ts
var Plane = class _Plane {
  /** ax + by + cz + d = 0 */
  constructor(normal, d) {
    this.normal = normal;
    this.d = d;
  }
  static fromPointNormal(point, normal) {
    const n = normal.normalize();
    return new _Plane(n, -n.dot(point));
  }
  static fromThreePoints(a, b, c) {
    const n = b.sub(a).cross(c.sub(a)).normalize();
    return new _Plane(n, -n.dot(a));
  }
  static XY() {
    return new _Plane(Vec3.unitZ(), 0);
  }
  static XZ() {
    return new _Plane(Vec3.unitY(), 0);
  }
  static YZ() {
    return new _Plane(Vec3.unitX(), 0);
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
    return new _Plane(this.normal.neg(), -this.d);
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
  const a = d1.dot(d1), e = d2.dot(d2), f2 = d2.dot(r);
  let t, u;
  if (a <= HMath.EPSILON && e <= HMath.EPSILON) {
    return { pointA: a1, pointB: b1, t: 0, u: 0 };
  }
  if (a <= HMath.EPSILON) {
    t = 0;
    u = HMath.clamp(f2 / e, 0, 1);
  } else {
    const c = d1.dot(r);
    if (e <= HMath.EPSILON) {
      u = 0;
      t = HMath.clamp(-c / a, 0, 1);
    } else {
      const b = d1.dot(d2);
      const denom = a * e - b * b;
      t = denom !== 0 ? HMath.clamp((b * f2 - c * e) / denom, 0, 1) : 0;
      u = (b * t + f2) / e;
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
    const plane = Plane.fromThreePoints(this.a, this.b, this.c);
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

// src/core/geometry/Sphere.ts
var Sphere = class {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }
  containsPoint(p) {
    return this.center.distSqTo(p) <= this.radius * this.radius + HMath.EPSILON;
  }
  intersectsSphere(other) {
    const r = this.radius + other.radius;
    return this.center.distSqTo(other.center) <= r * r;
  }
  toJSON() {
    return { center: this.center.toJSON(), radius: this.radius };
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

// src/core/geometry/Intersections.ts
var EPS = 1e-8;
var EPS2D = 1e-10;
var Intersections = {
  // ================================================================
  // 3D RAY INTERSECTIONS
  // ================================================================
  /**
   * Intersects a Ray with a line segment (A, B).
   * Returns the intersection point. If parallel/miss, returns midpoint of segment.
   */
  raySegment(rayOrigin, rayDir, pA, pB) {
    const edgeDir = pB.sub(pA);
    const v3 = rayOrigin.sub(pA);
    const crossDirEdge = rayDir.cross(edgeDir);
    const denom = crossDirEdge.lenSq();
    if (denom < EPS) return pA.add(pB).mul(0.5);
    const crossRayV3 = rayDir.cross(v3);
    let u = crossRayV3.dot(crossDirEdge) / denom;
    u = HMath.clamp(u, 0, 1);
    return pA.add(edgeDir.mul(u));
  },
  /**
   * Moller-Trumbore ray-triangle intersection.
   * Returns { t, u, v } if hit, or null if miss.
   */
  rayTriangle(rayOrigin, rayDir, v0, v1, v2) {
    const edge1 = v1.sub(v0);
    const edge2 = v2.sub(v0);
    const h = rayDir.cross(edge2);
    const a = edge1.dot(h);
    if (a > -EPS && a < EPS) return null;
    const f2 = 1 / a;
    const s = rayOrigin.sub(v0);
    const u = f2 * s.dot(h);
    if (u < 0 || u > 1) return null;
    const q = s.cross(edge1);
    const v = f2 * rayDir.dot(q);
    if (v < 0 || u + v > 1) return null;
    const t = f2 * edge2.dot(q);
    if (t <= EPS) return null;
    return { t, u, v };
  },
  /**
   * Checks if a point P (assumed to be on the triangle plane) is inside ABC.
   * Uses the "Same Side" technique with cross products.
   */
  pointInTriangle3D(p, a, b, c) {
    const ab = b.sub(a), bc = c.sub(b), ca = a.sub(c);
    const pa = p.sub(a), pb = p.sub(b), pc = p.sub(c);
    const n = ab.cross(ca);
    if (ab.cross(pa).dot(n) < 0) return false;
    if (bc.cross(pb).dot(n) < 0) return false;
    if (ca.cross(pc).dot(n) < 0) return false;
    return true;
  },
  /** Returns the closest point on segment AB to point P. */
  closestPointOnSegment(a, b, p) {
    const ab = b.sub(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / ab.lenSq(), 0, 1);
    return a.add(ab.mul(t));
  },
  /**
   * Finds the closest points on two 3D lines (not segments).
   * Returns { c1, c2 }.
   */
  closestPointsLineLine(p1, d1, p2, d2) {
    const r = p1.sub(p2);
    const a = d1.dot(d1);
    const b = d1.dot(d2);
    const c = d1.dot(r);
    const e = d2.dot(d2);
    const f2 = d2.dot(r);
    const d = a * e - b * b;
    if (d < EPS) {
      return { c1: p1, c2: p2.add(d2.mul(p1.sub(p2).dot(d2))) };
    }
    const s = (b * f2 - c * e) / d;
    const t = (a * f2 - b * c) / d;
    return { c1: p1.add(d1.mul(s)), c2: p2.add(d2.mul(t)) };
  },
  // ================================================================
  // RAY-PLANE / RAY-SPHERE / RAY-AABB
  // ================================================================
  /** Intersects a ray with a plane. Returns { t, point } or null. */
  rayPlane(ray, plane) {
    const denom = ray.direction.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(ray.origin.dot(plane.normal) + plane.d) / denom;
    if (t < 0) return null;
    return { t, point: ray.at(t) };
  },
  /** Intersects a ray with a sphere. Returns { t1, t2 } or null. */
  raySphere(ray, sphere) {
    const oc = ray.origin.sub(sphere.center);
    const a = ray.direction.dot(ray.direction);
    const b = 2 * oc.dot(ray.direction);
    const c = oc.dot(oc) - sphere.radius * sphere.radius;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    if (t1 >= 0 || t2 >= 0) return { t1, t2 };
    return null;
  },
  /** Intersects a ray with an AABB. Returns { tMin, tMax } or null. */
  rayAABB(ray, box) {
    let tMin = -Infinity;
    let tMax = Infinity;
    const invX = 1 / ray.direction.x;
    const invY = 1 / ray.direction.y;
    const invZ = 1 / ray.direction.z;
    let tx0 = (box.min.x - ray.origin.x) * invX;
    let tx1 = (box.max.x - ray.origin.x) * invX;
    if (invX < 0) {
      const tmp = tx0;
      tx0 = tx1;
      tx1 = tmp;
    }
    tMin = Math.max(tMin, tx0);
    tMax = Math.min(tMax, tx1);
    if (tMax < tMin) return null;
    let ty0 = (box.min.y - ray.origin.y) * invY;
    let ty1 = (box.max.y - ray.origin.y) * invY;
    if (invY < 0) {
      const tmp = ty0;
      ty0 = ty1;
      ty1 = tmp;
    }
    tMin = Math.max(tMin, ty0);
    tMax = Math.min(tMax, ty1);
    if (tMax < tMin) return null;
    let tz0 = (box.min.z - ray.origin.z) * invZ;
    let tz1 = (box.max.z - ray.origin.z) * invZ;
    if (invZ < 0) {
      const tmp = tz0;
      tz0 = tz1;
      tz1 = tmp;
    }
    tMin = Math.max(tMin, tz0);
    tMax = Math.min(tMax, tz1);
    if (tMax >= tMin) return { tMin, tMax };
    return null;
  },
  // ================================================================
  // 2D LINE/SEGMENT/RAY INTERSECTIONS
  // ================================================================
  /**
   * Intersects two 2D line segments with full parameter info.
   * Returns { t, u, point } or null.
   */
  segmentIntersect2D(a1, a2, b1, b2) {
    const d1 = a2.sub(a1), d2 = b2.sub(b1);
    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = b1.sub(a1);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const u = (diff.x * d1.y - diff.y * d1.x) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { t, u, point: a1.add(d1.mul(t)) };
    }
    return null;
  },
  /** Intersects two 2D line segments, returns the point or null. */
  segmentSegment2D(a1, a2, b1, b2) {
    const d1 = a2.sub(a1), d2 = b2.sub(b1);
    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = b1.sub(a1);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const u = (diff.x * d1.y - diff.y * d1.x) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return a1.add(d1.mul(t));
    }
    return null;
  },
  /** Intersects two infinite 2D lines. Returns point or null. */
  lineLine2D(a1, a2, b1, b2) {
    const denom = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
    if (Math.abs(denom) < EPS2D) return null;
    const num = (a1.y - b1.y) * (b2.x - b1.x) - (a1.x - b1.x) * (b2.y - b1.y);
    const t = num / denom;
    return new Vec2(a1.x + t * (a2.x - a1.x), a1.y + t * (a2.y - a1.y));
  },
  /** Intersects a 2D ray (origin + direction) with a segment. */
  raySegment2D(rayOrigin, rayDir, a, b) {
    const d2 = b.sub(a);
    const cross = rayDir.x * d2.y - rayDir.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = a.sub(rayOrigin);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const u = (diff.x * rayDir.y - diff.y * rayDir.x) / cross;
    if (t >= 0 && u >= 0 && u <= 1) {
      return rayOrigin.add(rayDir.mul(t));
    }
    return null;
  },
  /** Intersects a 2D ray with an infinite line through a and b. */
  rayLine2D(rayOrigin, rayDir, lineA, lineB) {
    const lineDir = lineB.sub(lineA);
    const denom = rayDir.x * lineDir.y - rayDir.y * lineDir.x;
    if (Math.abs(denom) < EPS2D) return null;
    const diff = lineA.sub(rayOrigin);
    const t = (diff.x * lineDir.y - diff.y * lineDir.x) / denom;
    if (t < 0) return null;
    return rayOrigin.add(rayDir.mul(t));
  },
  /** Intersects a 2D segment with an infinite line. */
  segmentLine2D(segA, segB, lineA, lineB) {
    const d1 = segB.sub(segA);
    const d2 = lineB.sub(lineA);
    const denom = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(denom) < EPS2D) return null;
    const diff = lineA.sub(segA);
    const t = (diff.x * d2.y - diff.y * d2.x) / denom;
    if (t < 0 || t > 1) return null;
    return segA.add(d1.mul(t));
  },
  /** Intersects two 2D rays (each defined by origin + direction). */
  rayRay2D(o1, d1, o2, d2) {
    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = o2.sub(o1);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const s = (diff.x * d1.y - diff.y * d1.x) / cross;
    if (t < 0 || s < 0) return null;
    return o1.add(d1.mul(t));
  },
  // ================================================================
  // CIRCLE INTERSECTIONS (2D)
  // ================================================================
  /** Intersects an infinite line with a circle. Returns 0, 1, or 2 intersection points. */
  circleLine(a, b, center, radius) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const cx = center.x - a.x;
    const cy = center.y - a.y;
    const A = dx * dx + dy * dy;
    const B = dx * cx + dy * cy;
    const C = cx * cx + cy * cy - radius * radius;
    const pBy2 = B / A;
    const q = C / A;
    const disc = pBy2 * pBy2 - q;
    if (disc < 0) return [];
    const sqrtDisc = Math.sqrt(disc);
    const s1 = -pBy2 + sqrtDisc;
    const s2 = -pBy2 - sqrtDisc;
    const p1 = new Vec2(a.x - dx * s1, a.y - dy * s1);
    if (Math.abs(disc) < EPS2D) return [p1];
    const p2 = new Vec2(a.x - dx * s2, a.y - dy * s2);
    return [p1, p2];
  },
  /** Intersect two circles. Returns 0, 1, or 2 intersection points. */
  circleCircle(c1x, c1y, r1, c2x, c2y, r2) {
    const dx = c2x - c1x, dy = c2y - c1y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9 || d < 1e-12) return [];
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const mx = c1x + a * dx / d, my = c1y + a * dy / d;
    const h2 = r1 * r1 - a * a;
    if (h2 < 0) return [[mx, my]];
    const h = Math.sqrt(h2);
    const px = -dy / d * h, py = dx / d * h;
    if (h < 1e-9) return [[mx, my]];
    return [[mx + px, my + py], [mx - px, my - py]];
  },
  /** Intersects a segment with a circle. Returns only points within the segment. */
  circleSegment(a, b, center, radius) {
    const lineHits = Intersections.circleLine(a, b, center, radius);
    if (lineHits.length === 0) return [];
    const mid = a.add(b).mul(0.5);
    const halfLen = a.distTo(b) * 0.5;
    return lineHits.filter((p) => p.distTo(mid) <= halfLen + HMath.EPSILON);
  },
  // ================================================================
  // 3D PLANE INTERSECTIONS
  // ================================================================
  /** Intersects a line segment with a plane. Returns the hit point or null. */
  segmentPlane(a, b, plane) {
    const dA = plane.distToPoint(a);
    const dB = plane.distToPoint(b);
    if (dA * dB > 0) return null;
    const denom = dA - dB;
    if (Math.abs(denom) < HMath.EPSILON) return a;
    const t = dA / denom;
    return a.lerp(b, t);
  },
  /** Intersects an infinite line with a plane. Returns the hit point or null. */
  linePlane(a, b, plane) {
    const dir = b.sub(a);
    const denom = dir.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(a.dot(plane.normal) + plane.d) / denom;
    return a.add(dir.mul(t));
  },
  /** Intersects two planes. Returns { point, direction } of the line, or null if parallel. */
  planePlane(p1, p2) {
    const dir = p1.normal.cross(p2.normal);
    if (dir.lenSq() < HMath.EPSILON) return null;
    const absX = Math.abs(dir.x);
    const absY = Math.abs(dir.y);
    const absZ = Math.abs(dir.z);
    let point;
    if (absZ >= absX && absZ >= absY)
      point = solvePlanePair(2, 0, 1, p1, p2);
    else if (absY >= absX)
      point = solvePlanePair(1, 2, 0, p1, p2);
    else
      point = solvePlanePair(0, 1, 2, p1, p2);
    return { point, direction: dir.normalize() };
  },
  // ================================================================
  // POLYGON-RAY (2D)
  // ================================================================
  /** Finds all intersection points of a 2D ray with a polygon's edges. */
  polygonRay2D(rayOrigin, rayDir, polygon) {
    const hits = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const hit = Intersections.raySegment2D(rayOrigin, rayDir, polygon[i], polygon[(i + 1) % n]);
      if (hit) hits.push(hit);
    }
    return hits;
  }
};
function coord(v, i) {
  return i === 0 ? v.x : i === 1 ? v.y : v.z;
}
function setCoord(x, y, z, i, val) {
  if (i === 0) return new Vec3(val, y, z);
  if (i === 1) return new Vec3(x, val, z);
  return new Vec3(x, y, val);
}
function solvePlanePair(_zeroCoord, coordA, coordB, p1, p2) {
  const a1 = coord(p1.normal, coordA);
  const b1 = coord(p1.normal, coordB);
  const d1 = -p1.d;
  const a2 = coord(p2.normal, coordA);
  const b2 = coord(p2.normal, coordB);
  const d2 = -p2.d;
  const denom = a1 * b2 - a2 * b1;
  const A0 = (b2 * d1 - b1 * d2) / denom;
  const B0 = (a1 * d2 - a2 * d1) / denom;
  let result = new Vec3(0, 0, 0);
  result = setCoord(result.x, result.y, result.z, coordA, A0);
  result = setCoord(result.x, result.y, result.z, coordB, B0);
  return result;
}

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
      const f2 = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      cx += (polygon[i].x + polygon[j].x) * f2;
      cy += (polygon[i].y + polygon[j].y) * f2;
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
var BoolNode = class {
  constructor(pos) {
    this.next = this;
    this.prev = this;
    this.isIntersection = false;
    this.entering = false;
    this.visited = false;
    this.partner = null;
    this.alpha = 0;
    this.pos = pos;
  }
};
function buildBoolList(poly) {
  const head = new BoolNode(poly[0]);
  let prev = head;
  for (let i = 1; i < poly.length; i++) {
    const node = new BoolNode(poly[i]);
    node.prev = prev;
    prev.next = node;
    prev = node;
  }
  prev.next = head;
  head.prev = prev;
  return head;
}
function insertBoolNode(after, node) {
  let cur = after;
  while (cur.next !== after.next || cur === after) {
    if (!cur.next.isIntersection || cur.next.alpha > node.alpha) break;
    cur = cur.next;
    if (cur === after) break;
  }
  node.next = cur.next;
  node.prev = cur;
  cur.next.prev = node;
  cur.next = node;
}
function boolSegHit(ax, ay, bx, by, cx, cy, dx, dy) {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
  if (t > 1e-8 && t < 1 - 1e-8 && u > 1e-8 && u < 1 - 1e-8) return { t, u };
  return null;
}
function boolPip(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (poly[i].y > pt.y !== poly[j].y > pt.y && pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) {
      inside = !inside;
    }
  }
  return inside;
}
function polygonIntersection(subjPoly, clipPoly) {
  const subj = buildBoolList(subjPoly);
  const clip = buildBoolList(clipPoly);
  let hasIntersections = false;
  let sNode = subj;
  do {
    let cNode = clip;
    do {
      const hit = boolSegHit(
        sNode.pos.x,
        sNode.pos.y,
        sNode.next.pos.x,
        sNode.next.pos.y,
        cNode.pos.x,
        cNode.pos.y,
        cNode.next.pos.x,
        cNode.next.pos.y
      );
      if (hit) {
        const pt = new Vec2(
          sNode.pos.x + hit.t * (sNode.next.pos.x - sNode.pos.x),
          sNode.pos.y + hit.t * (sNode.next.pos.y - sNode.pos.y)
        );
        const sInt = new BoolNode(pt);
        sInt.isIntersection = true;
        sInt.alpha = hit.t;
        const cInt = new BoolNode(pt);
        cInt.isIntersection = true;
        cInt.alpha = hit.u;
        sInt.partner = cInt;
        cInt.partner = sInt;
        insertBoolNode(sNode, sInt);
        insertBoolNode(cNode, cInt);
        hasIntersections = true;
      }
      cNode = cNode.next;
      while (cNode.isIntersection && cNode !== clip) cNode = cNode.next;
    } while (cNode !== clip);
    sNode = sNode.next;
    while (sNode.isIntersection && sNode !== subj) sNode = sNode.next;
  } while (sNode !== subj);
  if (!hasIntersections) {
    if (boolPip(subjPoly[0], clipPoly)) return [subjPoly];
    if (boolPip(clipPoly[0], subjPoly)) return [clipPoly];
    return [];
  }
  let cur = subj;
  let inside = boolPip(cur.pos, clipPoly);
  do {
    if (cur.isIntersection) {
      cur.entering = !inside;
      inside = !inside;
    }
    cur = cur.next;
  } while (cur !== subj);
  const results = [];
  cur = subj;
  do {
    if (cur.isIntersection && cur.entering && !cur.visited) {
      const poly = [];
      let walker = cur;
      let onSubject = true;
      for (let safety = 0; safety < 1e3; safety++) {
        walker.visited = true;
        if (walker.partner) walker.partner.visited = true;
        poly.push(walker.pos);
        walker = walker.next;
        if (walker.isIntersection) {
          if (walker === cur) break;
          walker.visited = true;
          if (walker.partner) walker.partner.visited = true;
          if (walker.partner) {
            walker = walker.partner;
            onSubject = !onSubject;
          }
        }
        if (walker === cur) break;
      }
      if (poly.length >= 3) results.push(poly);
    }
    cur = cur.next;
  } while (cur !== subj);
  return results;
}

// src/core/geometry/PolygonBool.ts
var import_polygon_clipping = __toESM(require("polygon-clipping"));
var SNAP = 1e-3;
function setClipSnap(grid) {
  SNAP = grid > 0 ? grid : 0;
}
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

// src/core/geometry/NoFitPolygon.ts
var import_poly_decomp = require("poly-decomp");
var NoFitPolygon = {
  /** Reflect a ring through the origin (negate every vertex) — forms −B. */
  reflect(ring) {
    return ring.map((v) => new Vec2(-v.x, -v.y));
  },
  /**
   * Decompose a simple polygon into convex pieces (poly-decomp quickDecomp).
   * Input may have any winding; pieces come back CCW. Triangles and convex
   * inputs pass through as a single piece.
   */
  decomposeConvex(ring) {
    if (ring.length <= 3) return [ring.slice()];
    const pts = ring.map((v) => [v.x, v.y]);
    (0, import_poly_decomp.removeCollinearPoints)(pts, 0.01);
    if (pts.length <= 3) return [pts.map(([x, y]) => new Vec2(x, y))];
    (0, import_poly_decomp.makeCCW)(pts);
    const pieces = (0, import_poly_decomp.quickDecomp)(pts);
    return pieces.map((piece) => piece.map(([x, y]) => new Vec2(x, y)));
  },
  /**
   * Minkowski sum of two *convex* rings = convex hull of all pairwise vertex
   * sums. O(|a|·|b|) but the inputs are small convex pieces.
   */
  minkowskiSumConvex(a, b) {
    const pts = [];
    for (const pa of a) for (const pb of b) pts.push(pa.add(pb));
    return Polygon2D.convexHull2D(pts);
  },
  /**
   * Minkowski sum of two arbitrary simple polygons. Decomposes both into convex
   * pieces, sums every pair, and unions the results (may produce holes).
   */
  minkowskiSum(a, b) {
    const ca = NoFitPolygon.decomposeConvex(a);
    const cb = NoFitPolygon.decomposeConvex(b);
    const parts = [];
    for (const pa of ca) {
      for (const pb of cb) {
        const sum = NoFitPolygon.minkowskiSumConvex(pa, pb);
        if (sum.length >= 3) parts.push(PolygonBool.fromRing(sum));
      }
    }
    return PolygonBool.union(...parts);
  },
  /**
   * No-Fit Polygon of `orbiting` about `fixed`: NFP = fixed ⊕ (−orbiting).
   * Both polygons are given in absolute coordinates; the result is the locus of
   * `orbiting`'s reference point (its frame origin) for touching placements on
   * the boundary, overlapping placements in the interior.
   */
  nfp(fixed, orbiting) {
    return NoFitPolygon.minkowskiSum(fixed, NoFitPolygon.reflect(orbiting));
  },
  /**
   * Inner-Fit region: the locus of `orbiting`'s reference point such that
   * `orbiting` stays fully inside `container`.
   *
   * Computed as ∩ over vertices v of conv(orbiting) of (container − v). This is
   * exact for convex or rectangular containers (the common surface case) and a
   * mild over-approximation for concave containers.
   */
  innerFit(container, orbiting) {
    const hull = Polygon2D.convexHull2D(orbiting);
    if (hull.length === 0) return [];
    let acc = null;
    for (const v of hull) {
      const shifted = PolygonBool.fromRing(container.map((c) => new Vec2(c.x - v.x, c.y - v.y)));
      acc = acc === null ? shifted : PolygonBool.intersection(acc, shifted);
      if (PolygonBool.isEmpty(acc)) return [];
    }
    return acc ?? [];
  }
};

// src/core/geometry/PerpVisibility.ts
function clipSlabY(px, py, qx, qy, top) {
  let t0 = 0;
  let t1 = 1;
  const dx = qx - px;
  const dy = qy - py;
  const clip = (p, q) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!clip(-dy, py)) return null;
  if (!clip(dy, top - py)) return null;
  if (t1 < t0) return null;
  return [px + t0 * dx, py + t0 * dy, px + t1 * dx, py + t1 * dy];
}
function perpVisibility(a, b, obstacles, maxDist) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < 1e-9 || maxDist <= 0) return [];
  const ux = (b.x - a.x) / L;
  const uy = (b.y - a.y) / L;
  const nx = -uy;
  const ny = ux;
  const fwdX = (p) => (p.x - a.x) * ux + (p.y - a.y) * uy;
  const fwdY = (p) => (p.x - a.x) * nx + (p.y - a.y) * ny;
  const back = (x, y) => new Vec2(a.x + x * ux + y * nx, a.y + x * uy + y * ny);
  const shadows = [];
  for (const [p, q] of obstacles) {
    const clip = clipSlabY(fwdX(p), fwdY(p), fwdX(q), fwdY(q), maxDist);
    if (!clip) continue;
    const [px, py, qx, qy] = clip;
    if (Math.abs(px - qx) < 1e-9) continue;
    shadows.push(PolygonBool.fromRing([
      new Vec2(px, py),
      new Vec2(qx, qy),
      new Vec2(qx, maxDist),
      new Vec2(px, maxDist)
    ]));
  }
  const base = PolygonBool.fromRing([
    new Vec2(0, 0),
    new Vec2(L, 0),
    new Vec2(L, maxDist),
    new Vec2(0, maxDist)
  ]);
  let lit;
  try {
    lit = shadows.length ? PolygonBool.difference(base, PolygonBool.union(...shadows)) : base;
  } catch {
    return [];
  }
  const out = [];
  for (const poly of lit) {
    for (const ring of poly) {
      if (ring.length >= 3) out.push(ring.map((v) => back(v.x, v.y)));
    }
  }
  return out;
}
function perpVisibilityOfPolys(a, b, polygons, maxDist, skipEdge) {
  const same = (u, v) => Math.abs(u.x - v.x) < 1e-6 && Math.abs(u.y - v.y) < 1e-6;
  const segs = [];
  for (const ring of polygons) {
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i];
      const q = ring[(i + 1) % ring.length];
      if (skipEdge && (same(p, skipEdge[0]) && same(q, skipEdge[1]) || same(p, skipEdge[1]) && same(q, skipEdge[0]))) {
        continue;
      }
      segs.push([p, q]);
    }
  }
  return perpVisibility(a, b, segs, maxDist);
}
function edgeOutwardVisibility(ring, i, obstacles, maxDist) {
  const p = ring[i];
  const q = ring[(i + 1) % ring.length];
  const ccw = Polygon2D.signedArea(ring) > 0;
  const a = ccw ? q : p;
  const b = ccw ? p : q;
  return perpVisibilityOfPolys(a, b, obstacles, maxDist, [p, q]);
}

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
    for (let f2 = 0; f2 < this._faceN; f2++) {
      if (!this._faceAlive[f2]) continue;
      const s = this._faceStart[f2], e = this._faceStart[f2 + 1];
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
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) {
      throw new Error(`Mesh.setPosition: node ${id} would get a non-finite position (${p.x}, ${p.y}, ${p.z})`);
    }
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
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
      throw new Error(`Mesh.addNode: non-finite position (${position.x}, ${position.y}, ${position.z}) \u2014 check the inputs that computed it`);
    }
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
    for (const f2 of this.nodeFaces(id)) this.removeFace(f2);
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
    for (const f2 of this.edgeFaces(id)) this.removeFace(f2);
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
    if (n < 3) throw new Error(`Mesh.addFace: a face needs at least 3 nodes, got ${n}`);
    for (let i = 0; i < n; i++) {
      if (!this.isNodeAlive(nodeIds[i])) {
        throw new Error(`Mesh.addFace: node ${nodeIds[i]} does not exist (the mesh has ${this._nodeLive} nodes, ids 0\u2026${this._nodeN - 1})`);
      }
    }
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
    for (let f2 = 0; f2 < this._faceN; f2++) {
      if (!this._faceAlive[f2]) continue;
      buf.length = 0;
      const s = this._faceStart[f2], e = this._faceStart[f2 + 1];
      for (let c = s; c < e; c++) buf.push(nodes[this._cVert[c]]);
      faces[f2] = m.addFace(buf, this._faceData?.get(f2));
      if (this._faceNrm && f2 < this._faceNrmN) {
        m.setFaceNormal(faces[f2], new Vec3(this._faceNrm[f2 * 3], this._faceNrm[f2 * 3 + 1], this._faceNrm[f2 * 3 + 2]));
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
    for (let f2 = 0; f2 < other._faceN; f2++) {
      if (!other._faceAlive[f2]) continue;
      buf.length = 0;
      const s = other._faceStart[f2], e = other._faceStart[f2 + 1];
      for (let c = s; c < e; c++) buf.push(nodes[other._cVert[c]]);
      m.addFace(buf, other._faceData?.get(f2));
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
    for (let f2 = 0; f2 < this._faceN; f2++) {
      if (!this._faceAlive[f2]) continue;
      const s = this._faceStart[f2], e = this._faceStart[f2 + 1], n = e - s;
      let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < n; i++) {
        const a = cv[s + i] * 3, b = cv[s + (i + 1) % n] * 3;
        nx += (pos[a + 1] - pos[b + 1]) * (pos[a + 2] + pos[b + 2]);
        ny += (pos[a + 2] - pos[b + 2]) * (pos[a] + pos[b]);
        nz += (pos[a] - pos[b]) * (pos[a + 1] + pos[b + 1]);
      }
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const inv = len > 1e-12 ? 1 / len : 0;
      fn[f2 * 3] = nx * inv;
      fn[f2 * 3 + 1] = ny * inv;
      fn[f2 * 3 + 2] = nz * inv;
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
    for (let f2 = 0; f2 < this._faceN; f2++) {
      if (!this._faceAlive[f2]) continue;
      const x = fn[f2 * 3], y = fn[f2 * 3 + 1], z = fn[f2 * 3 + 2];
      for (let c = this._faceStart[f2], e = this._faceStart[f2 + 1]; c < e; c++) {
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
  /**
   * Check the mesh for what silently breaks rendering, volumes and exports, in one pass:
   * non-finite positions, faces that reference missing nodes or repeat one, degenerate
   * (zero-area) faces, non-manifold edges, faces wound against their neighbours, and a
   * closed mesh that is inside-out. `issues` is empty when the mesh is sound; open
   * (boundary) edges are counted but are not an issue — plenty of good meshes are open.
   */
  validate() {
    const issues = [];
    const first = {};
    const note = (k, s) => {
      if (!(k in first)) first[k] = s;
    };
    let nonFinite = 0, badRefs = 0, repeated = 0, degenerate = 0;
    const pos = this._pos, cv = this._cVert;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      if (!Number.isFinite(pos[i * 3]) || !Number.isFinite(pos[i * 3 + 1]) || !Number.isFinite(pos[i * 3 + 2])) {
        nonFinite++;
        note("nonFinite", `node ${i}`);
      }
    }
    for (let f2 = 0; f2 < this._faceN; f2++) {
      if (!this._faceAlive[f2]) continue;
      const s0 = this._faceStart[f2], s1 = this._faceStart[f2 + 1], n = s1 - s0;
      let bad = false;
      for (let c = s0; c < s1; c++) {
        if (!this.isNodeAlive(cv[c])) {
          bad = true;
          note("badRefs", `face ${f2} \u2192 node ${cv[c]}`);
        }
        if (cv[c] === cv[s0 + (c - s0 + 1) % n]) {
          repeated++;
          note("repeated", `face ${f2}`);
          break;
        }
      }
      if (bad) {
        badRefs++;
        continue;
      }
      let finiteFace = true;
      for (let c = s0; c < s1 && finiteFace; c++) {
        const o = cv[c] * 3;
        finiteFace = Number.isFinite(pos[o]) && Number.isFinite(pos[o + 1]) && Number.isFinite(pos[o + 2]);
      }
      if (!finiteFace) continue;
      let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < n; i++) {
        const a = cv[s0 + i] * 3, b = cv[s0 + (i + 1) % n] * 3;
        nx += (pos[a + 1] - pos[b + 1]) * (pos[a + 2] + pos[b + 2]);
        ny += (pos[a + 2] - pos[b + 2]) * (pos[a] + pos[b]);
        nz += (pos[a] - pos[b]) * (pos[a + 1] + pos[b + 1]);
      }
      if (!(Math.hypot(nx, ny, nz) > 1e-14)) {
        degenerate++;
        note("degenerate", `face ${f2}`);
      }
    }
    let boundary = 0, nonManifold = 0, inconsistent = 0;
    for (let e = 0; e < this._edgeN; e++) {
      if (!this._edgeAlive[e]) continue;
      const k = this._edgeCornerCount(e);
      if (k === 1) boundary++;
      else if (k > 2) {
        nonManifold++;
        note("nonManifold", `edge ${e} (${this._edgeA[e]}\u2013${this._edgeB[e]}, ${k} faces)`);
      } else if (k === 2) {
        const c1 = this._edgeFirstCorner[e], c2 = this._cNextInEdge[c1];
        if (cv[c1] === cv[c2]) {
          inconsistent++;
          note("inconsistent", `edge ${e} (${this._edgeA[e]}\u2013${this._edgeB[e]})`);
        }
      }
    }
    const closed = this._faceLive > 0 && boundary === 0 && nonManifold === 0 && badRefs === 0;
    let signedVolume;
    if (closed && nonFinite === 0) {
      const idx = this.indices;
      let v = 0;
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
        v += (pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) + pos[a + 1] * (pos[b + 2] * pos[c] - pos[b] * pos[c + 2]) + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c])) / 6;
      }
      signedVolume = v;
    }
    const say = (count, what, key) => {
      if (count) issues.push(`${count} ${what} (first: ${first[key]})`);
    };
    say(nonFinite, "nodes with a non-finite position", "nonFinite");
    say(badRefs, "faces referencing missing nodes", "badRefs");
    say(repeated, "faces repeating a node", "repeated");
    say(degenerate, "degenerate (zero-area) faces", "degenerate");
    say(nonManifold, "non-manifold edges", "nonManifold");
    say(inconsistent, "edges between faces wound against each other", "inconsistent");
    if (signedVolume !== void 0 && signedVolume < 0 && inconsistent === 0) {
      issues.push(`closed but inside-out: signed volume ${signedVolume.toPrecision(4)} \u2014 faces point inward (MeshTransform.flipFaces)`);
    }
    return {
      valid: issues.length === 0,
      issues,
      closed,
      ...signedVolume !== void 0 ? { signedVolume } : {},
      counts: {
        nodes: this._nodeLive,
        edges: this._edgeLive,
        faces: this._faceLive,
        boundaryEdges: boundary,
        nonManifoldEdges: nonManifold,
        inconsistentEdges: inconsistent,
        nonFiniteNodes: nonFinite,
        badFaces: badRefs,
        repeatedFaces: repeated,
        degenerateFaces: degenerate
      }
    };
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
    for (const f2 of faces) mesh.addFace(f2.map((i) => ids[i]));
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
    for (let f2 = 0; f2 < this._faceN; f2++) {
      if (!this._faceAlive[f2]) continue;
      const d = this._faceData?.get(f2);
      if (d && Object.keys(d).length) faceData.push([faces.length, d]);
      faces.push(this.faceNodes(f2).map((n) => map[n]));
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
      for (const fj of json.faces) {
        if (fj.nodes.length < 3) continue;
        mesh2.addFace(fj.nodes.map((n) => idMap.get(n)), fj.data && Object.keys(fj.data).length ? fj.data : void 0);
      }
      mesh2.computeVertexNormals();
      return mesh2;
    }
    if ("indices" in json) return new _Mesh(json.positions, json.indices, json.normals, json.uvs);
    const mesh = new _Mesh(json.positions, [], json.normals, json.uvs, json.colors);
    for (const f2 of json.faces) mesh.addFace(f2);
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

// src/core/geometry/mesh/MeshAnalysis.ts
var MeshAnalysis = {
  /** Mesh volume (closed, consistently wound; polygons are fan-triangulated). */
  meshVolume(mesh) {
    return mesh.volume();
  },
  /** Mesh surface area. */
  meshSurfaceArea(mesh) {
    return mesh.surfaceArea();
  },
  /** Mesh centroid (vertex average). */
  meshCentroid(mesh) {
    return mesh.centroid();
  },
  /** Laplacian smooth (moves each interior vertex toward the average of its neighbors). */
  laplacianSmooth(mesh, iterations = 1, factor = 0.5) {
    mesh.smooth(iterations, factor);
  },
  /** 3D Convex hull — returns a Mesh */
  convexHull3D(points) {
    if (points.length < 4) return new Mesh();
    const mesh = new Mesh();
    const ids = mesh.addNodes(points);
    let i0 = 0, i1 = 1, i2 = -1, i3 = -1;
    for (let i = 2; i < points.length; i++) {
      const cross = points[i1].sub(points[i0]).cross(points[i].sub(points[i0]));
      if (cross.len() > 1e-8) {
        i2 = i;
        break;
      }
    }
    if (i2 === -1) return mesh;
    const testNormal = points[i1].sub(points[i0]).cross(points[i2].sub(points[i0])).normalize();
    for (let i = 0; i < points.length; i++) {
      if (i === i0 || i === i1 || i === i2) continue;
      const d2 = Math.abs(points[i].sub(points[i0]).dot(testNormal));
      if (d2 > 1e-8) {
        i3 = i;
        break;
      }
    }
    if (i3 === -1) return mesh;
    const d = points[i3].sub(points[i0]).dot(testNormal);
    if (d > 0) {
      mesh.addTriangle(ids[i0], ids[i2], ids[i1]);
      mesh.addTriangle(ids[i0], ids[i1], ids[i3]);
      mesh.addTriangle(ids[i1], ids[i2], ids[i3]);
      mesh.addTriangle(ids[i2], ids[i0], ids[i3]);
    } else {
      mesh.addTriangle(ids[i0], ids[i1], ids[i2]);
      mesh.addTriangle(ids[i0], ids[i3], ids[i1]);
      mesh.addTriangle(ids[i1], ids[i3], ids[i2]);
      mesh.addTriangle(ids[i2], ids[i3], ids[i0]);
    }
    const used = /* @__PURE__ */ new Set([i0, i1, i2, i3]);
    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue;
      const p = points[i];
      mesh.computeFaceNormals();
      const visible = [];
      for (const face of mesh.faces()) {
        if (!face.normal) continue;
        const centroid = face.nodes.map((nid) => mesh.node(nid).position).reduce((s, v) => s.add(v), Vec3.zero()).div(face.nodes.length);
        if (p.sub(centroid).dot(face.normal) > 1e-8) {
          visible.push(face.id);
        }
      }
      if (visible.length === 0) continue;
      used.add(i);
      const edgeVisCount = /* @__PURE__ */ new Map();
      for (const fid of visible) {
        const face = mesh.face(fid);
        for (const eid of face.edges) {
          edgeVisCount.set(eid, (edgeVisCount.get(eid) || 0) + 1);
        }
      }
      const horizon = [];
      for (const [eid, count] of edgeVisCount) {
        if (count === 1) horizon.push(eid);
      }
      for (const fid of visible) mesh.removeFace(fid);
      const pid = ids[i];
      for (const eid of horizon) {
        const edge = mesh.edge(eid);
        if (!edge) continue;
        let a = edge.nodes[0], b = edge.nodes[1];
        const survivingFace = edge.faces.length > 0 ? mesh.face(edge.faces[0]) : void 0;
        if (survivingFace) {
          const nl = survivingFace.nodes;
          for (let si = 0; si < nl.length; si++) {
            if (nl[si] === edge.nodes[0] && nl[(si + 1) % nl.length] === edge.nodes[1]) {
              a = edge.nodes[1];
              b = edge.nodes[0];
              break;
            }
          }
        }
        mesh.addTriangle(a, b, pid);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  }
};

// src/core/geometry/curves/index.ts
var ArcLengthCache = class {
  constructor(precisionSteps = 50) {
    this.table = [];
    this._totalLength = 0;
    this.steps = precisionSteps;
  }
  get totalLength() {
    return this._totalLength;
  }
  rebuild(getPoint) {
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
  getTFromDistance(distance) {
    if (distance <= 0) return 0;
    if (distance >= this._totalLength) return 1;
    let lo = 0, hi = this.table.length - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >> 1;
      if (this.table[mid] < distance) lo = mid;
      else hi = mid;
    }
    const lenPrev = this.table[lo];
    const lenNext = this.table[hi];
    const ratio = (distance - lenPrev) / (lenNext - lenPrev);
    const stepSize = 1 / this.steps;
    return lo * stepSize + ratio * stepSize;
  }
};
var LineCurve = class {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  get length() {
    return this.start.distTo(this.end);
  }
  getTFromDistance(distance) {
    const len = this.length;
    if (len <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / len, 0, 1);
  }
  getPoint(t) {
    return this.start.lerp(this.end, HMath.clamp(t, 0, 1));
  }
  getTangent(_t) {
    return this.end.sub(this.start).normalize();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var ArcCurve = class {
  constructor(center, radius, startAngle, sweepAngle, normal) {
    this.center = center;
    this.radius = radius;
    this.startAngle = startAngle;
    this.sweepAngle = sweepAngle;
    this.normal = normal;
    this.normal = normal.normalize();
    let fwd = this.normal.cross(Vec3.unitY());
    if (fwd.lenSq() < 1e-3) fwd = this.normal.cross(Vec3.unitX());
    this.forward = fwd.normalize();
  }
  get length() {
    return Math.abs(this.radius * this.sweepAngle);
  }
  getTFromDistance(distance) {
    return HMath.clamp(distance / this.length, 0, 1);
  }
  getPoint(t) {
    const angle = this.startAngle + this.sweepAngle * t;
    const c = Math.cos(angle), s = Math.sin(angle);
    const k = this.normal;
    const v = this.forward;
    const rotated = v.mul(c).add(k.cross(v).mul(s)).add(k.mul(k.dot(v) * (1 - c)));
    return this.center.add(rotated.mul(this.radius));
  }
  getTangent(t) {
    const angle = this.startAngle + this.sweepAngle * t;
    const c = Math.cos(angle), s = Math.sin(angle);
    const k = this.normal;
    const v = this.forward;
    const direction = v.mul(c).add(k.cross(v).mul(s)).add(k.mul(k.dot(v) * (1 - c)));
    const tangent = k.cross(direction);
    return this.sweepAngle >= 0 ? tangent : tangent.neg();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var HelixCurve = class {
  constructor(center, radius, startAngle, sweepAngle, startZ, endZ) {
    this.center = center;
    this.radius = radius;
    this.startAngle = startAngle;
    this.sweepAngle = sweepAngle;
    this.startZ = startZ;
    this.endZ = endZ;
  }
  get length() {
    const absSweep = Math.abs(this.sweepAngle);
    if (absSweep < HMath.EPSILON) return Math.abs(this.endZ - this.startZ);
    const dz = this.endZ - this.startZ;
    const pitchPerRad = dz / this.sweepAngle;
    return absSweep * Math.sqrt(this.radius * this.radius + pitchPerRad * pitchPerRad);
  }
  getTFromDistance(distance) {
    const len = this.length;
    if (len <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / len, 0, 1);
  }
  getPoint(t) {
    const a = this.startAngle + this.sweepAngle * t;
    const z = this.startZ + (this.endZ - this.startZ) * t;
    return new Vec3(
      this.center.x + this.radius * Math.cos(a),
      this.center.y + this.radius * Math.sin(a),
      z
    );
  }
  getTangent(t) {
    const a = this.startAngle + this.sweepAngle * t;
    const dz = this.endZ - this.startZ;
    return new Vec3(
      -this.radius * Math.sin(a) * this.sweepAngle,
      this.radius * Math.cos(a) * this.sweepAngle,
      dz
    ).normalize();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var CubicBezierCurve = class {
  constructor(p0, p1, p2, p3) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.cache = new ArcLengthCache(50);
    this.cache.rebuild((t) => this.getPoint(t));
  }
  updateControlPoints(p0, p1, p2, p3) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.cache.rebuild((t) => this.getPoint(t));
  }
  getPoint(t) {
    t = HMath.clamp(t, 0, 1);
    const u = 1 - t;
    const tt = t * t, uu = u * u;
    const uuu = uu * u, ttt = tt * t;
    return this.p0.mul(uuu).add(this.p1.mul(3 * uu * t)).add(this.p2.mul(3 * u * tt)).add(this.p3.mul(ttt));
  }
  getTangent(t) {
    t = HMath.clamp(t, 0, 1);
    const u = 1 - t;
    const uu = u * u, tt = t * t;
    return this.p1.sub(this.p0).mul(3 * uu).add(this.p2.sub(this.p1).mul(6 * u * t)).add(this.p3.sub(this.p2).mul(3 * tt)).normalize();
  }
  get length() {
    return this.cache.totalLength;
  }
  getTFromDistance(distance) {
    return this.cache.getTFromDistance(distance);
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var NurbsCurve = class {
  constructor(controlPoints, degree, knots, weights) {
    this.controlPoints = controlPoints;
    this.degree = degree;
    this.knots = knots;
    this.weights = weights;
    this.cache = new ArcLengthCache(100);
    if (weights && weights.length !== controlPoints.length) {
      throw new Error(`NurbsCurve: ${weights.length} weights for ${controlPoints.length} control points \u2014 need one weight per control point`);
    }
    this.cache.rebuild((t) => this.getPoint(t));
  }
  getPoint(t) {
    const uMin = this.knots[this.degree];
    const uMax = this.knots[this.knots.length - this.degree - 1];
    const u = uMin + (uMax - uMin) * HMath.clamp(t, 0, 1);
    return this.evaluateDeBoor(u);
  }
  getTangent(t) {
    const eps = 1e-3;
    const t0 = HMath.clamp(t - eps, 0, 1);
    const t1 = HMath.clamp(t + eps, 0, 1);
    return this.getPoint(t1).sub(this.getPoint(t0)).normalize();
  }
  get length() {
    return this.cache.totalLength;
  }
  getTFromDistance(distance) {
    return this.cache.getTFromDistance(distance);
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
  /** De Boor in homogeneous coordinates: blend (w·P, w), then divide. Weights of 1 reduce to the plain B-spline. */
  evaluateDeBoor(u) {
    const k = this.findKnotSpan(u);
    const w = this.weights;
    const d = [];
    const dw = [];
    for (let j = 0; j <= this.degree; j++) {
      const i = k - this.degree + j;
      const wi = w ? w[i] : 1;
      d[j] = this.controlPoints[i].mul(wi);
      dw[j] = wi;
    }
    for (let r = 1; r <= this.degree; r++) {
      for (let j = this.degree; j >= r; j--) {
        const denom = this.knots[k + 1 + j - r] - this.knots[k - this.degree + j];
        const alpha = denom > 0 ? (u - this.knots[k - this.degree + j]) / denom : 0;
        d[j] = d[j - 1].mul(1 - alpha).add(d[j].mul(alpha));
        dw[j] = dw[j - 1] * (1 - alpha) + dw[j] * alpha;
      }
    }
    return d[this.degree].div(dw[this.degree]);
  }
  findKnotSpan(u) {
    const n = this.controlPoints.length - 1;
    if (Math.abs(u - this.knots[n + 1]) < 1e-4) return n;
    let low = this.degree, high = n + 1;
    let mid = low + high >> 1;
    while (u < this.knots[mid] || u >= this.knots[mid + 1]) {
      if (u < this.knots[mid]) high = mid;
      else low = mid;
      mid = low + high >> 1;
    }
    return mid;
  }
};
var PolylineCurve = class {
  constructor(points) {
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
  get length() {
    return this._totalLength;
  }
  getTFromDistance(distance) {
    if (this._totalLength <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / this._totalLength, 0, 1);
  }
  getPoint(t) {
    const targetDist = HMath.clamp(t, 0, 1) * this._totalLength;
    let lo = 0, hi = this.accumulatedLengths.length - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >> 1;
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
  getTangent(t) {
    const targetDist = HMath.clamp(t, 0, 1) * this._totalLength;
    let lo = 0, hi = this.accumulatedLengths.length - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >> 1;
      if (this.accumulatedLengths[mid] < targetDist) lo = mid;
      else hi = mid;
    }
    const segIdx = Math.min(lo, this.points.length - 2);
    return this.points[segIdx + 1].sub(this.points[segIdx]).normalize();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var CurveUtils = {
  /** Returns exactly 'count' points distributed along the curve. */
  divideByCount(curve, count) {
    if (count < 2) count = 2;
    const points = [];
    if ("length" in curve && typeof curve.getTFromDistance === "function") {
      const mc = curve;
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
  divideByFixedLength(curve, segmentLength) {
    if (segmentLength <= 1e-4) return [curve.getPoint(0), curve.getPoint(1)];
    const totalLength = curve.length;
    const points = [];
    let d = 0;
    while (d <= totalLength) {
      points.push(curve.getPointAtDistance(d));
      d += segmentLength;
    }
    const endPt = curve.getPoint(1);
    if (points[points.length - 1].distTo(endPt) > 1e-3) {
      points.push(endPt);
    }
    return points;
  },
  /** Divides curve with segments roughly equal to targetLength (all equal). */
  divideByTargetLength(curve, targetLength) {
    const totalLength = curve.length;
    if (totalLength <= targetLength) return [curve.getPoint(0), curve.getPoint(1)];
    const segments = Math.max(1, Math.round(totalLength / targetLength));
    return CurveUtils.divideByCount(curve, segments + 1);
  },
  /** Evaluate one component of a cubic Bezier at parameter t. */
  cubicEval(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  },
  /** Extract sub-curve [tStart, tEnd] from a cubic Bezier via De Casteljau. */
  splitCubic(p0, p1, p2, p3, tStart, tEnd) {
    function lerp3(a2, b2, t) {
      return new Vec3(a2.x + (b2.x - a2.x) * t, a2.y + (b2.y - a2.y) * t, a2.z + (b2.z - a2.z) * t);
    }
    function splitAt(q0, q1, q2, q3, t) {
      const a2 = lerp3(q0, q1, t), b2 = lerp3(q1, q2, t), c2 = lerp3(q2, q3, t);
      const d = lerp3(a2, b2, t), e = lerp3(b2, c2, t);
      const f2 = lerp3(d, e, t);
      return { left: [q0, a2, d, f2], right: [f2, e, c2, q3] };
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
  findTForComponent(curve, target, component, iterations = 40) {
    let lo = 0, hi = 1;
    for (let i = 0; i < iterations; i++) {
      const mid = (lo + hi) / 2;
      if (curve.getPoint(mid)[component] < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  },
  /** Unroll a 3D polyline into a flat elevation profile: X = cumulative XY arc length, Z = original height. */
  unrollPolyline(pts, yOffset = 0) {
    const out = [];
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
  findUnrollX(polyline, pt) {
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
      if (d < bestDist) {
        bestDist = d;
        bestCum = cumDist + segLen * t;
      }
      cumDist += segLen;
    }
    return bestCum;
  },
  /**
   * Compute rotation-minimizing (parallel transport) frames along a polyline path.
   * Returns one frame per path point: tangent T, normal U, binormal V (all unit vectors).
   */
  parallelTransportFrames(path) {
    if (path.length < 2) return [];
    const frames = [];
    let T = path[1].sub(path[0]).normalize();
    let U = T.cross(Vec3.unitZ());
    if (U.lenSq() < 1e-3) U = T.cross(Vec3.unitX());
    U = U.normalize();
    let V = T.cross(U).normalize();
    frames.push({ tangent: T, normal: U, binormal: V });
    for (let i = 1; i < path.length; i++) {
      if (i < path.length - 1) {
        T = path[i + 1].sub(path[i - 1]).normalize();
      } else {
        T = path[i].sub(path[i - 1]).normalize();
      }
      U = U.sub(T.mul(T.dot(U))).normalize();
      if (U.lenSq() < 1e-12) {
        U = T.cross(Vec3.unitZ());
        if (U.lenSq() < 1e-3) U = T.cross(Vec3.unitX());
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
  arcFromPointTangentPoint(p1, tangent, p2) {
    const perpX = -tangent.y, perpY = tangent.x;
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const chordDx = p2.x - p1.x, chordDy = p2.y - p1.y;
    const pbDx = -chordDy, pbDy = chordDx;
    const det = perpX * pbDy - perpY * pbDx;
    if (Math.abs(det) < 1e-12) {
      return new ArcCurve(
        new Vec3(mx, my, 0),
        1e6,
        0,
        0,
        Vec3.unitZ()
      );
    }
    const t = ((mx - p1.x) * pbDy - (my - p1.y) * pbDx) / det;
    const cx = p1.x + t * perpX;
    const cy = p1.y + t * perpY;
    const radius = Math.hypot(cx - p1.x, cy - p1.y);
    const startAngle = Math.atan2(p1.y - cy, p1.x - cx);
    let endAngle = Math.atan2(p2.y - cy, p2.x - cx);
    const radDx = p1.x - cx, radDy = p1.y - cy;
    const ccwDot = tangent.x * -radDy + tangent.y * radDx;
    let ccwSweep = endAngle - startAngle;
    if (ccwSweep < 0) ccwSweep += Math.PI * 2;
    const sweepAngle = ccwDot > 0 ? ccwSweep : -(Math.PI * 2 - ccwSweep);
    return new ArcCurve(
      new Vec3(cx, cy, 0),
      radius,
      startAngle - Math.PI,
      sweepAngle,
      Vec3.unitZ()
    );
  }
};

// src/core/geometry/mesh/MeshFactory.ts
function need(ok, msg) {
  if (!ok) throw new Error(`MeshFactory.${msg}`);
}
var isCount = (n, min) => Number.isInteger(n) && n >= min;
var MeshFactory = {
  // ── Parametric Surfaces ──
  grid(width, depth, divisionsX, divisionsZ, heightFn = () => 0) {
    need(isCount(divisionsX, 1) && isCount(divisionsZ, 1), `grid: divisions must be whole numbers \u2265 1, got ${divisionsX} \xD7 ${divisionsZ}`);
    need(Number.isFinite(width) && Number.isFinite(depth), `grid: width and depth must be finite, got ${width} \xD7 ${depth}`);
    const mesh = new Mesh();
    const ids = [];
    for (let iz = 0; iz <= divisionsZ; iz++) {
      ids[iz] = [];
      for (let ix = 0; ix <= divisionsX; ix++) {
        const x = (ix / divisionsX - 0.5) * width;
        const z = (iz / divisionsZ - 0.5) * depth;
        const y = heightFn(x, z);
        ids[iz][ix] = mesh.addNode(new Vec3(x, y, z));
      }
    }
    for (let iz = 0; iz < divisionsZ; iz++) {
      for (let ix = 0; ix < divisionsX; ix++) {
        mesh.addQuad(ids[iz][ix], ids[iz][ix + 1], ids[iz + 1][ix + 1], ids[iz + 1][ix]);
      }
    }
    mesh.update = (hfn) => {
      const pos = mesh.positions;
      let vi = 1;
      for (let iz = 0; iz <= divisionsZ; iz++) {
        for (let ix = 0; ix <= divisionsX; ix++) {
          pos[vi] = hfn((ix / divisionsX - 0.5) * width, (iz / divisionsZ - 0.5) * depth);
          vi += 3;
        }
      }
      mesh.markPositionsChanged();
      mesh.computeVertexNormals();
    };
    mesh.computeVertexNormals();
    return mesh;
  },
  /**
   * Extrude a closed polygon (no repeated last point) along `direction`. Faces point
   * outward whichever way the polygon winds: it is reoriented to run counter-clockwise
   * seen from the tip of `direction` first.
   */
  extrude(polygon, direction, cap = true) {
    need(polygon.length >= 2, `extrude: the outline needs at least 2 points, got ${polygon.length}`);
    need(direction.lenSq() > 0 && Number.isFinite(direction.lenSq()), `extrude: the direction must be a finite, non-zero vector`);
    const mesh = new Mesh();
    const n = polygon.length;
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < n; i++) {
      const a = polygon[i], b = polygon[(i + 1) % n];
      nx += (a.y - b.y) * (a.z + b.z);
      ny += (a.z - b.z) * (a.x + b.x);
      nz += (a.x - b.x) * (a.y + b.y);
    }
    const outline = nx * direction.x + ny * direction.y + nz * direction.z < 0 ? [...polygon].reverse() : polygon;
    const bottom = outline.map((p) => mesh.addNode(p));
    const top = outline.map((p) => mesh.addNode(p.add(direction)));
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      mesh.addQuad(bottom[i], bottom[next], top[next], top[i]);
    }
    if (cap && n >= 3) {
      mesh.addFace([...bottom].reverse());
      mesh.addFace(top);
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  revolve(profile, segments = 32, angleRange = Math.PI * 2) {
    need(profile.length >= 2, `revolve: the profile needs at least 2 points, got ${profile.length}`);
    need(isCount(segments, 1), `revolve: segments must be a whole number \u2265 1, got ${segments}`);
    const mesh = new Mesh();
    const n = profile.length;
    const ids = [];
    const isClosed = Math.abs(angleRange - Math.PI * 2) < 1e-6;
    const slices = isClosed ? segments : segments + 1;
    for (let s = 0; s < slices; s++) {
      ids[s] = [];
      const angle = s / segments * angleRange;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let i = 0; i < n; i++) {
        const p = profile[i];
        ids[s][i] = mesh.addNode(new Vec3(p.x * cos, p.y, p.x * sin));
      }
    }
    for (let s = 0; s < segments; s++) {
      const ns = (s + 1) % slices;
      for (let i = 0; i < n - 1; i++) {
        mesh.addQuad(ids[s][i], ids[s][i + 1], ids[ns][i + 1], ids[ns][i]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  loft(profiles, closedProfile = true) {
    need(profiles.length >= 2, `loft: needs at least 2 profiles, got ${profiles.length}`);
    need(
      profiles.every((p) => p.length === profiles[0].length && p.length >= 2),
      `loft: every profile needs the same number of points (\u2265 2), got ${profiles.map((p) => p.length).join(", ")}`
    );
    const mesh = new Mesh();
    const ids = [];
    for (let p = 0; p < profiles.length; p++) {
      ids[p] = profiles[p].map((pos) => mesh.addNode(pos));
    }
    for (let p = 0; p < profiles.length - 1; p++) {
      const currIds = ids[p];
      const nextIds = ids[p + 1];
      const n = Math.min(currIds.length, nextIds.length);
      const limit = closedProfile ? n : n - 1;
      for (let i = 0; i < limit; i++) {
        const ni = (i + 1) % n;
        mesh.addQuad(currIds[i], currIds[ni], nextIds[ni], nextIds[i]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  // ── Primitives ──
  box(width = 1, height = 1, depth = 1) {
    const w = width / 2, h = height / 2, d = depth / 2;
    const mesh = new Mesh();
    const v = [
      mesh.addNode(new Vec3(-w, -h, -d)),
      mesh.addNode(new Vec3(w, -h, -d)),
      mesh.addNode(new Vec3(w, h, -d)),
      mesh.addNode(new Vec3(-w, h, -d)),
      mesh.addNode(new Vec3(-w, -h, d)),
      mesh.addNode(new Vec3(w, -h, d)),
      mesh.addNode(new Vec3(w, h, d)),
      mesh.addNode(new Vec3(-w, h, d))
    ];
    mesh.addQuad(v[0], v[3], v[2], v[1]);
    mesh.addQuad(v[4], v[5], v[6], v[7]);
    mesh.addQuad(v[0], v[1], v[5], v[4]);
    mesh.addQuad(v[2], v[3], v[7], v[6]);
    mesh.addQuad(v[0], v[4], v[7], v[3]);
    mesh.addQuad(v[1], v[2], v[6], v[5]);
    mesh.computeVertexNormals();
    return mesh;
  },
  sphere(radius = 1, segments = 24, rings = 16) {
    need(isCount(segments, 3) && isCount(rings, 2), `sphere: needs whole numbers, segments \u2265 3 and rings \u2265 2, got ${segments} and ${rings}`);
    const mesh = new Mesh();
    const ids = [];
    for (let r = 0; r <= rings; r++) {
      ids[r] = [];
      const phi = r / rings * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      for (let s = 0; s <= segments; s++) {
        const theta = s / segments * Math.PI * 2;
        ids[r][s] = mesh.addNode(new Vec3(
          radius * sinPhi * Math.cos(theta),
          radius * cosPhi,
          radius * sinPhi * Math.sin(theta)
        ));
      }
    }
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        if (r > 0) {
          mesh.addTriangle(ids[r][s], ids[r][s + 1], ids[r + 1][s + 1]);
        }
        if (r < rings - 1) {
          mesh.addTriangle(ids[r][s], ids[r + 1][s + 1], ids[r + 1][s]);
        }
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  cylinder(radiusTop = 1, radiusBottom = 1, height = 2, segments = 24, cap = true) {
    need(isCount(segments, 3), `cylinder: segments must be a whole number \u2265 3, got ${segments}`);
    const mesh = new Mesh();
    const h2 = height / 2;
    const bottomIds = [];
    const topIds = [];
    for (let s = 0; s <= segments; s++) {
      const angle = s / segments * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      bottomIds.push(mesh.addNode(new Vec3(radiusBottom * cos, -h2, radiusBottom * sin)));
      topIds.push(mesh.addNode(new Vec3(radiusTop * cos, h2, radiusTop * sin)));
    }
    for (let s = 0; s < segments; s++) {
      mesh.addQuad(bottomIds[s], topIds[s], topIds[s + 1], bottomIds[s + 1]);
    }
    if (cap) {
      const bottomCenter = mesh.addNode(new Vec3(0, -h2, 0));
      const topCenter = mesh.addNode(new Vec3(0, h2, 0));
      for (let s = 0; s < segments; s++) {
        mesh.addTriangle(bottomCenter, bottomIds[s], bottomIds[s + 1]);
        mesh.addTriangle(topCenter, topIds[s + 1], topIds[s]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  torus(majorRadius = 1, minorRadius = 0.3, segments = 32, sides = 16) {
    need(isCount(segments, 3) && isCount(sides, 3), `torus: segments and sides must be whole numbers \u2265 3, got ${segments} and ${sides}`);
    const mesh = new Mesh();
    const ids = [];
    for (let s = 0; s <= segments; s++) {
      ids[s] = [];
      const theta = s / segments * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      for (let r = 0; r <= sides; r++) {
        const phi = r / sides * Math.PI * 2;
        const x = (majorRadius + minorRadius * Math.cos(phi)) * cosT;
        const y = minorRadius * Math.sin(phi);
        const z = (majorRadius + minorRadius * Math.cos(phi)) * sinT;
        ids[s][r] = mesh.addNode(new Vec3(x, y, z));
      }
    }
    for (let s = 0; s < segments; s++) {
      for (let r = 0; r < sides; r++) {
        mesh.addQuad(ids[s][r], ids[s][r + 1], ids[s + 1][r + 1], ids[s + 1][r]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  /**
   * Create a tube mesh by sweeping a circular cross-section along a path.
   * Accepts uniform radius (number) or per-point varying radii (number[]).
   */
  pipe(path, radius, sides = 8) {
    need(path.length >= 2, `pipe: the path needs at least 2 points, got ${path.length}`);
    need(isCount(sides, 3), `pipe: sides must be a whole number \u2265 3, got ${sides}`);
    if (Array.isArray(radius) && radius.length !== path.length) {
      throw new Error(`MeshFactory.pipe: ${radius.length} radii for ${path.length} path points \u2014 need one radius per point (or a single number)`);
    }
    const mesh = new Mesh();
    const frames = CurveUtils.parallelTransportFrames(path);
    if (frames.length === 0) return mesh;
    const ids = [];
    for (let p = 0; p < path.length; p++) {
      ids[p] = [];
      const r = typeof radius === "number" ? radius : radius[p];
      const frame = frames[p];
      for (let s = 0; s < sides; s++) {
        const angle = s / sides * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const offset = frame.normal.mul(cos * r).add(frame.binormal.mul(sin * r));
        ids[p][s] = mesh.addNode(path[p].add(offset));
      }
    }
    for (let p = 0; p < path.length - 1; p++) {
      for (let s = 0; s < sides; s++) {
        const ns = (s + 1) % sides;
        mesh.addQuad(ids[p][s], ids[p][ns], ids[p + 1][ns], ids[p + 1][s]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  // ── Mesh Modifiers ──
  /**
   * Catmull-Clark subdivision. With `opts.creaseAngleDeg`, edges whose
   * adjacent faces meet at a dihedral angle sharper than the threshold are
   * treated as CREASES (sharp-edge rules: edge point = midpoint; a vertex on
   * exactly two crease edges moves by the 1D B-spline rule (a + 6v + b)/8;
   * three or more crease edges pin the vertex). Boundary edges always count
   * as creases in that mode. Without opts the classic behavior is unchanged.
   */
  subdivide(mesh, opts) {
    const result = new Mesh();
    const facePoints = /* @__PURE__ */ new Map();
    const edgePoints = /* @__PURE__ */ new Map();
    const nodeMap = /* @__PURE__ */ new Map();
    const useCreases = opts?.creaseAngleDeg !== void 0 || opts?.creaseEdge !== void 0;
    const creased = /* @__PURE__ */ new Set();
    if (useCreases) {
      const cosThresh = Math.cos((opts?.creaseAngleDeg ?? 180) * Math.PI / 180);
      const faceNormal = /* @__PURE__ */ new Map();
      for (const face of mesh.faces()) {
        const ps = face.nodes.map((nid) => mesh.node(nid).position);
        let nx = 0, ny = 0, nz = 0;
        for (let i = 0; i < ps.length; i++) {
          const a = ps[i], b = ps[(i + 1) % ps.length];
          nx += (a.y - b.y) * (a.z + b.z);
          ny += (a.z - b.z) * (a.x + b.x);
          nz += (a.x - b.x) * (a.y + b.y);
        }
        const len = Math.hypot(nx, ny, nz) || 1;
        faceNormal.set(face.id, new Vec3(nx / len, ny / len, nz / len));
      }
      for (const edge of mesh.edges()) {
        if (edge.faces.length !== 2) {
          creased.add(edge.id);
          continue;
        }
        if (opts?.creaseEdge?.(mesh.node(edge.nodes[0]).position, mesh.node(edge.nodes[1]).position)) {
          creased.add(edge.id);
          continue;
        }
        const n0 = faceNormal.get(edge.faces[0]);
        const n1 = faceNormal.get(edge.faces[1]);
        if (n0.x * n1.x + n0.y * n1.y + n0.z * n1.z < cosThresh) creased.add(edge.id);
      }
    }
    for (const face of mesh.faces()) {
      const positions = face.nodes.map((nid) => mesh.node(nid).position);
      const centroid = positions.reduce((sum, p) => sum.add(p), Vec3.zero()).div(positions.length);
      facePoints.set(face.id, result.addNode(centroid));
    }
    for (const edge of mesh.edges()) {
      const p0 = mesh.node(edge.nodes[0]).position;
      const p1 = mesh.node(edge.nodes[1]).position;
      const mid = p0.lerp(p1, 0.5);
      if (edge.faces.length === 2 && !creased.has(edge.id)) {
        const fc0 = mesh.face(edge.faces[0]).nodes.map((n) => mesh.node(n).position);
        const fc1 = mesh.face(edge.faces[1]).nodes.map((n) => mesh.node(n).position);
        const c0 = fc0.reduce((s, p) => s.add(p), Vec3.zero()).div(fc0.length);
        const c1 = fc1.reduce((s, p) => s.add(p), Vec3.zero()).div(fc1.length);
        const ep = p0.add(p1).add(c0).add(c1).mul(0.25);
        edgePoints.set(edge.id, result.addNode(ep));
      } else {
        edgePoints.set(edge.id, result.addNode(mid));
      }
    }
    for (const node of mesh.nodes()) {
      const n = node.faces.length;
      if (n === 0) {
        nodeMap.set(node.id, result.addNode(node.position));
        continue;
      }
      if (opts?.pinVertex?.(node.position)) {
        nodeMap.set(node.id, result.addNode(node.position));
        continue;
      }
      if (useCreases) {
        const inc = node.edges.filter((eid) => creased.has(eid));
        if (inc.length >= 3) {
          nodeMap.set(node.id, result.addNode(node.position));
          continue;
        }
        if (inc.length === 2) {
          const far = (eid) => {
            const e = mesh.edge(eid);
            const other = e.nodes[0] === node.id ? e.nodes[1] : e.nodes[0];
            return mesh.node(other).position;
          };
          const cp = far(inc[0]).add(node.position.mul(6)).add(far(inc[1])).div(8);
          nodeMap.set(node.id, result.addNode(cp));
          continue;
        }
      }
      const F = node.faces.map((fid) => {
        const fp = facePoints.get(fid);
        return result.node(fp).position;
      }).reduce((s, p) => s.add(p), Vec3.zero()).div(n);
      const R = node.edges.map((eid) => {
        const e = mesh.edge(eid);
        const p0 = mesh.node(e.nodes[0]).position;
        const p1 = mesh.node(e.nodes[1]).position;
        return p0.lerp(p1, 0.5);
      }).reduce((s, p) => s.add(p), Vec3.zero()).div(node.edges.length);
      const newPos = F.add(R.mul(2)).add(node.position.mul(n - 3)).div(n);
      nodeMap.set(node.id, result.addNode(mesh.isBoundaryNode(node.id) ? node.position : newPos));
    }
    for (const face of mesh.faces()) {
      const fp = facePoints.get(face.id);
      const n = face.nodes.length;
      for (let i = 0; i < n; i++) {
        const curr = face.nodes[i];
        const prevEdge = face.edges[(i + n - 1) % n];
        const currEdge = face.edges[i];
        result.addQuad(
          edgePoints.get(prevEdge),
          nodeMap.get(curr),
          edgePoints.get(currEdge),
          fp
        );
      }
    }
    result.computeVertexNormals();
    return result;
  },
  triangulate(mesh) {
    const result = mesh.clone();
    for (const face of [...result.faces()]) {
      if (face.nodes.length <= 3) continue;
      const nodes = face.nodes;
      result.removeFace(face.id);
      for (let i = 1; i < nodes.length - 1; i++) {
        result.addTriangle(nodes[0], nodes[i], nodes[i + 1]);
      }
    }
    result.computeVertexNormals();
    return result;
  },
  /**
   * Midpoint (1→4) subdivision of the triangulated mesh: every triangle becomes
   * four, vertices stay where they are. Linear — no smoothing; for the smooth
   * limit surface use `subdivide` (Catmull-Clark).
   */
  midpointSubdivide(mesh) {
    const pos = mesh.positions, idx = mesh.indices;
    const vc = mesh.vertexCount, tc = idx.length / 3;
    const key = (a, b) => a < b ? a * 4294967296 + b : b * 4294967296 + a;
    const mid = /* @__PURE__ */ new Map();
    let newVc = vc;
    for (let t = 0; t < idx.length; t += 3) {
      for (let j = 0; j < 3; j++) {
        const k = key(idx[t + j], idx[t + (j + 1) % 3]);
        if (!mid.has(k)) mid.set(k, newVc++);
      }
    }
    const newPos = new Float64Array(newVc * 3);
    newPos.set(pos);
    for (const [k, m] of mid) {
      const a = Math.floor(k / 4294967296) * 3, b = k % 4294967296 * 3, o = m * 3;
      newPos[o] = (pos[a] + pos[b]) * 0.5;
      newPos[o + 1] = (pos[a + 1] + pos[b + 1]) * 0.5;
      newPos[o + 2] = (pos[a + 2] + pos[b + 2]) * 0.5;
    }
    const newIdx = new Uint32Array(tc * 12);
    let ii = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const v0 = idx[t], v1 = idx[t + 1], v2 = idx[t + 2];
      const m01 = mid.get(key(v0, v1)), m12 = mid.get(key(v1, v2)), m20 = mid.get(key(v2, v0));
      newIdx[ii++] = v0;
      newIdx[ii++] = m01;
      newIdx[ii++] = m20;
      newIdx[ii++] = m01;
      newIdx[ii++] = v1;
      newIdx[ii++] = m12;
      newIdx[ii++] = m20;
      newIdx[ii++] = m12;
      newIdx[ii++] = v2;
      newIdx[ii++] = m01;
      newIdx[ii++] = m12;
      newIdx[ii++] = m20;
    }
    return new Mesh(newPos, newIdx);
  }
};

// src/core/geometry/mesh/MeshTransform.ts
var MeshTransform = {
  // ================================================================
  // AFFINE TRANSFORMS
  // ================================================================
  /** Applies an arbitrary 4x4 matrix to all vertex positions. */
  transform(mesh, matrix) {
    for (const node of mesh.nodes()) {
      node.position = matrix.transformPoint(node.position);
    }
    mesh.computeVertexNormals();
  },
  /** Translates all vertices by an offset vector. */
  translate(mesh, offset) {
    for (const node of mesh.nodes()) {
      node.position = node.position.add(offset);
    }
  },
  /** Uniform scale around origin. */
  scale(mesh, factor) {
    for (const node of mesh.nodes()) {
      node.position = node.position.mul(factor);
    }
  },
  /** Non-uniform scale around origin. */
  scaleXYZ(mesh, sx, sy, sz) {
    for (const node of mesh.nodes()) {
      const p = node.position;
      node.position = new Vec3(p.x * sx, p.y * sy, p.z * sz);
    }
    mesh.computeVertexNormals();
  },
  /** Non-uniform scale around a center point. */
  scaleAbout(mesh, sx, sy, sz, center) {
    for (const node of mesh.nodes()) {
      const p = node.position.sub(center);
      node.position = new Vec3(p.x * sx, p.y * sy, p.z * sz).add(center);
    }
    mesh.computeVertexNormals();
  },
  /** Rotates the mesh around an axis through the origin. */
  rotate(mesh, axis, angleRadians) {
    const a = axis.normalize();
    const c = Math.cos(angleRadians), s = Math.sin(angleRadians), t = 1 - c;
    const { x, y, z } = a;
    const m = new Float64Array(16);
    m[0] = t * x * x + c;
    m[4] = t * x * y - s * z;
    m[8] = t * x * z + s * y;
    m[12] = 0;
    m[1] = t * x * y + s * z;
    m[5] = t * y * y + c;
    m[9] = t * y * z - s * x;
    m[13] = 0;
    m[2] = t * x * z - s * y;
    m[6] = t * y * z + s * x;
    m[10] = t * z * z + c;
    m[14] = 0;
    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;
    const mat = new Mat4(m);
    for (const node of mesh.nodes()) {
      node.position = mat.transformPoint(node.position);
    }
    mesh.computeVertexNormals();
  },
  /** Rotates the mesh around an axis through a center point. */
  rotateAbout(mesh, axis, angleRadians, center) {
    const a = axis.normalize();
    const c = Math.cos(angleRadians), s = Math.sin(angleRadians), t = 1 - c;
    const { x, y, z } = a;
    const m = new Float64Array(16);
    m[0] = t * x * x + c;
    m[4] = t * x * y - s * z;
    m[8] = t * x * z + s * y;
    m[12] = 0;
    m[1] = t * x * y + s * z;
    m[5] = t * y * y + c;
    m[9] = t * y * z - s * x;
    m[13] = 0;
    m[2] = t * x * z - s * y;
    m[6] = t * y * z + s * x;
    m[10] = t * z * z + c;
    m[14] = 0;
    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;
    const mat = new Mat4(m);
    for (const node of mesh.nodes()) {
      node.position = mat.transformPoint(node.position.sub(center)).add(center);
    }
    mesh.computeVertexNormals();
  },
  // ================================================================
  // AXIS OPERATIONS
  // ================================================================
  /** Swaps two coordinate axes (e.g. Y↔Z for Z-up to Y-up conversion). */
  swapAxes(mesh, a, b) {
    if (a === b) return;
    for (const node of mesh.nodes()) {
      const p = node.position;
      const va = getCoord(p, a), vb = getCoord(p, b);
      node.position = setCoord2(setCoord2(p, a, vb), b, va);
    }
    MeshTransform.flipFaces(mesh);
    mesh.computeVertexNormals();
  },
  /** Mirrors the mesh across a plane through the origin. */
  mirror(mesh, axis) {
    for (const node of mesh.nodes()) {
      const p = node.position;
      switch (axis) {
        case "x":
          node.position = new Vec3(-p.x, p.y, p.z);
          break;
        case "y":
          node.position = new Vec3(p.x, -p.y, p.z);
          break;
        case "z":
          node.position = new Vec3(p.x, p.y, -p.z);
          break;
      }
    }
    MeshTransform.flipFaces(mesh);
    mesh.computeVertexNormals();
  },
  // ================================================================
  // FACE ORIENTATION
  // ================================================================
  /** Reverses the winding order of all faces (flips normals). */
  flipFaces(mesh) {
    for (const id of mesh.faceIds()) mesh.reverseFace(id);
    mesh.computeVertexNormals();
  },
  /**
   * Makes all face normals consistent using BFS flood-fill.
   * Picks an initial face and propagates its orientation to neighbors.
   */
  reorientFaces(mesh) {
    const allFaces = mesh.facesArray();
    const faceCount = allFaces.length;
    if (faceCount === 0) return;
    const checked = /* @__PURE__ */ new Set();
    const queue = [];
    for (const startFace of allFaces) {
      if (checked.has(startFace.id)) continue;
      checked.add(startFace.id);
      queue.push(startFace.id);
      while (queue.length > 0) {
        const fId = queue.shift();
        const f2 = mesh.face(fId);
        const neighborIds = /* @__PURE__ */ new Set();
        for (const eId of f2.edges) {
          const e = mesh.edge(eId);
          if (!e) continue;
          for (const nfId of e.faces) {
            if (nfId !== fId) neighborIds.add(nfId);
          }
        }
        for (const nbId of neighborIds) {
          if (checked.has(nbId)) continue;
          checked.add(nbId);
          if (!hasSameOrientation(mesh, fId, nbId)) mesh.reverseFace(nbId);
          queue.push(nbId);
        }
      }
    }
    mesh.computeVertexNormals();
  },
  // ================================================================
  // CENTER
  // ================================================================
  /** Moves the mesh so its bounding box center is at the origin. */
  centerAtOrigin(mesh) {
    const allNodes = mesh.nodesArray();
    if (allNodes.length === 0) return;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const n of allNodes) {
      const p = n.position;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const center = new Vec3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    MeshTransform.translate(mesh, center.neg());
  },
  /** Moves the mesh so its centroid (average of vertices) is at the origin. */
  centerAtCentroid(mesh) {
    const allNodes = mesh.nodesArray();
    if (allNodes.length === 0) return;
    let sx = 0, sy = 0, sz = 0;
    for (const n of allNodes) {
      sx += n.position.x;
      sy += n.position.y;
      sz += n.position.z;
    }
    const centroid = new Vec3(sx / allNodes.length, sy / allNodes.length, sz / allNodes.length);
    MeshTransform.translate(mesh, centroid.neg());
  }
};
function getCoord(v, axis) {
  switch (axis) {
    case "x":
      return v.x;
    case "y":
      return v.y;
    case "z":
      return v.z;
  }
}
function setCoord2(v, axis, val) {
  switch (axis) {
    case "x":
      return new Vec3(val, v.y, v.z);
    case "y":
      return new Vec3(v.x, val, v.z);
    case "z":
      return new Vec3(v.x, v.y, val);
  }
}
function hasSameOrientation(mesh, fId1, fId2) {
  const f1 = mesh.face(fId1);
  const f2 = mesh.face(fId2);
  const v1 = f1.nodes;
  const v2 = f2.nodes;
  for (let i = 0; i < v1.length; i++) {
    const a = v1[i];
    const b = v1[(i + 1) % v1.length];
    for (let j = 0; j < v2.length; j++) {
      if (v2[j] === a && v2[(j + 1) % v2.length] === b) return false;
    }
  }
  return true;
}

// src/core/geometry/mesh/MeshSubdivide.ts
var MeshSubdivide = {
  /** Splits all edges longer than maxLength in a single pass. */
  splitLongEdges(mesh, maxLength) {
    const maxLenSq = maxLength * maxLength;
    const toSplit = [];
    for (const e of mesh.edges()) {
      const a = mesh.node(e.nodes[0]).position;
      const b = mesh.node(e.nodes[1]).position;
      if (a.distSqTo(b) > maxLenSq) toSplit.push(e.id);
    }
    if (toSplit.length === 0) return;
    for (const eid of toSplit) {
      const e = mesh.edge(eid);
      if (!e) continue;
      mesh.splitEdge(eid);
    }
    mesh.computeVertexNormals();
  },
  /**
   * Iteratively subdivides the mesh until all edges are shorter than targetLength.
   */
  refineByEdgeLength(mesh, targetLength, maxIterations = 5) {
    for (let iter = 0; iter < maxIterations; iter++) {
      const targetSq = targetLength * targetLength;
      const toSplit = [];
      for (const e of mesh.edges()) {
        const a = mesh.node(e.nodes[0]).position;
        const b = mesh.node(e.nodes[1]).position;
        if (a.distSqTo(b) > targetSq) toSplit.push(e.id);
      }
      if (toSplit.length === 0) break;
      for (const eid of toSplit) {
        const e = mesh.edge(eid);
        if (!e) continue;
        mesh.splitEdge(eid);
      }
    }
    mesh.computeVertexNormals();
  },
  /**
   * Doo-Sabin subdivision: each face shrinks toward its centroid, creating
   * new F-faces, E-faces (edge quads), and V-faces (vertex n-gons).
   */
  dooSabin(mesh) {
    const allFaces = mesh.facesArray();
    const allEdges = mesh.edgesArray();
    const allNodes = mesh.nodesArray();
    const nodeIdToIdx = /* @__PURE__ */ new Map();
    allNodes.forEach((n, i) => nodeIdToIdx.set(n.id, i));
    const newPositions = [];
    const newVertIdx = [];
    const faceIdToLocalIdx = /* @__PURE__ */ new Map();
    for (let fi = 0; fi < allFaces.length; fi++) {
      const f2 = allFaces[fi];
      faceIdToLocalIdx.set(f2.id, fi);
      const n = f2.nodes.length;
      const verts = f2.nodes;
      let center = Vec3.zero();
      for (const nid of verts) center = center.add(mesh.node(nid).position);
      center = center.div(n);
      const indices = [];
      for (let i = 0; i < n; i++) {
        const iPrev = (i - 1 + n) % n;
        const iNext = (i + 1) % n;
        const v = mesh.node(verts[i]).position;
        const midBefore = mesh.node(verts[iPrev]).position.add(v).mul(0.5);
        const midAfter = v.add(mesh.node(verts[iNext]).position).mul(0.5);
        newPositions.push(center.add(v).add(midBefore).add(midAfter).mul(0.25));
        indices.push(newPositions.length - 1);
      }
      newVertIdx.push(indices);
    }
    const vertPosInFace = /* @__PURE__ */ new Map();
    for (let fi = 0; fi < allFaces.length; fi++) {
      const f2 = allFaces[fi];
      for (let i = 0; i < f2.nodes.length; i++) {
        vertPosInFace.set(`${f2.nodes[i]}_${f2.id}`, i);
      }
    }
    const newFaces = [];
    for (let fi = 0; fi < allFaces.length; fi++) {
      newFaces.push([...newVertIdx[fi]]);
    }
    for (const e of allEdges) {
      if (e.faces.length < 2) continue;
      const faceA = e.faces[0];
      const faceB = e.faces[1];
      const fiA = faceIdToLocalIdx.get(faceA);
      const fiB = faceIdToLocalIdx.get(faceB);
      const posFromA = vertPosInFace.get(`${e.nodes[0]}_${faceA}`);
      const posToA = vertPosInFace.get(`${e.nodes[1]}_${faceA}`);
      const posFromB = vertPosInFace.get(`${e.nodes[0]}_${faceB}`);
      const posToB = vertPosInFace.get(`${e.nodes[1]}_${faceB}`);
      const fA = mesh.face(faceA);
      const vertsA = fA.nodes;
      const forwardInA = posToA === (posFromA + 1) % vertsA.length;
      let nA0, nA1, nB0, nB1;
      if (forwardInA) {
        nA0 = newVertIdx[fiA][posFromA];
        nA1 = newVertIdx[fiA][posToA];
        nB0 = newVertIdx[fiB][posToB];
        nB1 = newVertIdx[fiB][posFromB];
      } else {
        nA0 = newVertIdx[fiA][posToA];
        nA1 = newVertIdx[fiA][posFromA];
        nB0 = newVertIdx[fiB][posFromB];
        nB1 = newVertIdx[fiB][posToB];
      }
      newFaces.push([nA0, nA1, nB0, nB1]);
    }
    for (const node of allNodes) {
      if (mesh.isBoundaryNode(node.id)) continue;
      const faceRing = dooSabinFaceRing(mesh, node, allFaces, vertPosInFace, faceIdToLocalIdx);
      if (!faceRing || faceRing.length < 3) continue;
      const vFaceVerts = [];
      for (const fId of faceRing) {
        const fi = faceIdToLocalIdx.get(fId);
        const posInFace = vertPosInFace.get(`${node.id}_${fId}`);
        vFaceVerts.push(newVertIdx[fi][posInFace]);
      }
      vFaceVerts.reverse();
      if (vFaceVerts.length <= 4) {
        newFaces.push(vFaceVerts);
      } else {
        for (let i = 1; i < vFaceVerts.length - 1; i++) {
          newFaces.push([vFaceVerts[0], vFaceVerts[i], vFaceVerts[i + 1]]);
        }
      }
    }
    mesh.clear();
    const nodeIds = newPositions.map((p) => mesh.addNode(p));
    for (const face of newFaces) {
      const mapped = face.map((i) => nodeIds[i]);
      mesh.addFace(mapped);
    }
    MeshTransform.reorientFaces(mesh);
  }
};
function dooSabinFaceRing(mesh, node, _allFaces, _vertPosInFace, _faceIdToLocalIdx) {
  const facesAround = node.faces;
  if (facesAround.length === 0) return null;
  const ring = [];
  const visited = /* @__PURE__ */ new Set();
  const startFace = facesAround[0];
  ring.push(startFace);
  visited.add(startFace);
  const startFaceObj = mesh.face(startFace);
  const posInFace = startFaceObj.nodes.indexOf(node.id);
  if (posInFace < 0) return null;
  let crossVert = startFaceObj.nodes[(posInFace + 1) % startFaceObj.nodes.length];
  let sharedEdge = findSharedEdge(mesh, node.id, crossVert);
  if (!sharedEdge) return null;
  let currentFace = sharedEdge.faces.find((f2) => f2 !== startFace);
  if (currentFace === void 0) return null;
  while (!visited.has(currentFace)) {
    ring.push(currentFace);
    visited.add(currentFace);
    const cf = mesh.face(currentFace);
    const idx = cf.nodes.indexOf(node.id);
    if (idx < 0) break;
    const n = cf.nodes.length;
    const prev = cf.nodes[(idx - 1 + n) % n];
    const next = cf.nodes[(idx + 1) % n];
    const otherVert = next === crossVert ? prev : next;
    sharedEdge = findSharedEdge(mesh, node.id, otherVert);
    if (!sharedEdge) break;
    const nextFace = sharedEdge.faces.find((f2) => f2 !== currentFace);
    if (nextFace === void 0) break;
    crossVert = otherVert;
    currentFace = nextFace;
  }
  return ring.length === facesAround.length ? ring : null;
}
function findSharedEdge(mesh, nodeA, nodeB) {
  const nA = mesh.node(nodeA);
  if (!nA) return null;
  for (const eId of nA.edges) {
    const e = mesh.edge(eId);
    if (!e) continue;
    if (e.nodes[0] === nodeA && e.nodes[1] === nodeB || e.nodes[0] === nodeB && e.nodes[1] === nodeA) {
      return e;
    }
  }
  return null;
}

// src/core/geometry/mesh/MeshCleanup.ts
var MeshCleanup = {
  /** Merges vertices that have the exact same position (binary equality). */
  mergeIdenticalVertices(mesh) {
    const allNodes = mesh.nodesArray();
    const allFaces = mesh.facesArray();
    const uniquePos = /* @__PURE__ */ new Map();
    const positions = [];
    const oldToNew = /* @__PURE__ */ new Map();
    for (const node of allNodes) {
      const key = `${node.position.x},${node.position.y},${node.position.z}`;
      if (uniquePos.has(key)) {
        oldToNew.set(node.id, uniquePos.get(key));
      } else {
        const newIdx = positions.length;
        uniquePos.set(key, newIdx);
        positions.push(node.position);
        oldToNew.set(node.id, newIdx);
      }
    }
    const newFaces = [];
    for (const f2 of allFaces) {
      const mapped = f2.nodes.map((n) => oldToNew.get(n));
      const distinct = new Set(mapped);
      if (distinct.size < 3) continue;
      if (distinct.size < mapped.length) {
        const deduped = [];
        for (const v of mapped) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== v) deduped.push(v);
        }
        if (deduped.length >= 3) newFaces.push(deduped);
      } else {
        newFaces.push(mapped);
      }
    }
    applyRemap(mesh, positions, newFaces);
  },
  /** Merges vertices that are within a certain distance of each other. */
  weldVertices(mesh, threshold) {
    if (threshold <= 1e-6) {
      MeshCleanup.mergeIdenticalVertices(mesh);
      return;
    }
    const allNodes = mesh.nodesArray();
    const allFaces = mesh.facesArray();
    const count = allNodes.length;
    const sorted = allNodes.slice().sort((a, b) => a.position.x - b.position.x);
    const oldToNew = /* @__PURE__ */ new Map();
    const positions = [];
    const sqThreshold = threshold * threshold;
    for (let i = 0; i < count; i++) {
      const nodeA = sorted[i];
      if (oldToNew.has(nodeA.id)) continue;
      const newIdx = positions.length;
      oldToNew.set(nodeA.id, newIdx);
      positions.push(nodeA.position);
      for (let j = i + 1; j < count; j++) {
        const nodeB = sorted[j];
        if (oldToNew.has(nodeB.id)) continue;
        if (nodeB.position.x - nodeA.position.x > threshold) break;
        if (nodeA.position.distSqTo(nodeB.position) <= sqThreshold) {
          oldToNew.set(nodeB.id, newIdx);
        }
      }
    }
    const newFaces = [];
    for (const f2 of allFaces) {
      const mapped = f2.nodes.map((n) => oldToNew.get(n));
      const distinct = new Set(mapped);
      if (distinct.size < 3) continue;
      if (distinct.size < mapped.length) {
        const deduped = [];
        for (const v of mapped) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== v) deduped.push(v);
        }
        if (deduped.length >= 3) newFaces.push(deduped);
      } else {
        newFaces.push(mapped);
      }
    }
    applyRemap(mesh, positions, newFaces);
  }
};
function applyRemap(mesh, positions, faces) {
  mesh.clear();
  const ids = positions.map((p) => mesh.addNode(p));
  for (const f2 of faces) {
    mesh.addFace(f2.map((i) => ids[i]));
  }
  mesh.computeVertexNormals();
}

// src/core/algo/algorithms.ts
var Algo = { ...Polygon2D, ...MeshAnalysis };

// src/core/algo/Curvature.ts
function tangentBasis(n) {
  if (n.lenSq() < 1e-12) return { u: Vec3.unitX(), v: Vec3.unitZ() };
  const axis = Math.abs(n.z) < 0.9 ? Vec3.unitZ() : Vec3.unitX();
  const u = axis.sub(n.mul(axis.dot(n))).normalize();
  const v = n.cross(u).normalize();
  return { u, v };
}
function triangleArea(a, b, c) {
  return b.sub(a).cross(c.sub(a)).len() * 0.5;
}
var Curvature = {
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
  taubin(mesh) {
    mesh.computeVertexNormals();
    const result = /* @__PURE__ */ new Map();
    for (const node of mesh.nodes()) {
      const n = node.normal ?? Vec3.zero();
      const p = node.position;
      const isBoundary = mesh.isBoundaryNode(node.id) || node.faces.length === 0 || n.lenSq() < 1e-12;
      const { u, v } = tangentBasis(n);
      let mUU = 0, mVV = 0, mUV = 0;
      let totalW = 0;
      for (const eid of node.edges) {
        const edge = mesh.edge(eid);
        const otherId = edge.nodes[0] === node.id ? edge.nodes[1] : edge.nodes[0];
        const other = mesh.node(otherId);
        if (!other) continue;
        const e = other.position.sub(p);
        const eLenSq = e.lenSq();
        if (eLenSq < 1e-20) continue;
        let w = 0;
        for (const fid of edge.faces) {
          const face = mesh.face(fid);
          if (!face || face.nodes.length < 3) continue;
          const fn = face.nodes;
          const p0 = mesh.node(fn[0]).position;
          for (let i = 1; i < fn.length - 1; i++) {
            w += triangleArea(p0, mesh.node(fn[i]).position, mesh.node(fn[i + 1]).position);
          }
        }
        if (w < 1e-20) continue;
        const kappa = -2 * n.dot(e) / eLenSq;
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
          kMax: 0,
          kMin: 0,
          dirMax: u,
          dirMin: v,
          meanCurvature: 0,
          gaussCurvature: 0,
          isBoundary
        });
        continue;
      }
      mUU /= totalW;
      mVV /= totalW;
      mUV /= totalW;
      const trace = mUU + mVV;
      const halfDiff = (mUU - mVV) * 0.5;
      const gap = Math.sqrt(halfDiff * halfDiff + mUV * mUV);
      const m1 = trace * 0.5 + gap;
      const m2 = trace * 0.5 - gap;
      let e1U, e1V;
      if (Math.abs(mUV) > 1e-12) {
        e1U = m1 - mVV;
        e1V = mUV;
      } else {
        if (mUU >= mVV) {
          e1U = 1;
          e1V = 0;
        } else {
          e1U = 0;
          e1V = 1;
        }
      }
      const inv = 1 / Math.sqrt(e1U * e1U + e1V * e1V);
      e1U *= inv;
      e1V *= inv;
      const e2U = -e1V, e2V = e1U;
      const kMax = 3 * m1 - m2;
      const kMin = 3 * m2 - m1;
      const dirMax = u.mul(e1U).add(v.mul(e1V)).normalize();
      const dirMin = u.mul(e2U).add(v.mul(e2V)).normalize();
      result.set(node.id, {
        kMax,
        kMin,
        dirMax,
        dirMin,
        meanCurvature: (kMax + kMin) * 0.5,
        gaussCurvature: kMax * kMin,
        isBoundary
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
  facePrincipalField(mesh, curvatures, which) {
    const field = /* @__PURE__ */ new Map();
    for (const face of mesh.faces()) {
      let sx = 0, sy = 0, sz = 0;
      let magSum = 0;
      let count = 0;
      let refDir = null;
      for (const nid of face.nodes) {
        const c = curvatures.get(nid);
        if (!c) continue;
        let d = which === "max" ? c.dirMax : c.dirMin;
        if (refDir === null) refDir = d;
        else if (d.dot(refDir) < 0) d = d.neg();
        const mag = Math.abs(which === "max" ? c.kMax : c.kMin);
        sx += d.x;
        sy += d.y;
        sz += d.z;
        magSum += mag;
        count++;
      }
      if (count === 0) {
        field.set(face.id, Vec3.zero());
        continue;
      }
      const inv = 1 / count;
      const avg = new Vec3(sx * inv, sy * inv, sz * inv);
      const len = avg.len();
      if (len < 1e-9) {
        field.set(face.id, Vec3.zero());
        continue;
      }
      const fn = face.normal ?? avg;
      let planar = avg.sub(fn.mul(avg.dot(fn) / Math.max(fn.lenSq(), 1e-12)));
      const pLen = planar.len();
      if (pLen < 1e-9) {
        field.set(face.id, Vec3.zero());
        continue;
      }
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
  combDirections(mesh, curvatures) {
    const visited = /* @__PURE__ */ new Set();
    const queue = [];
    for (const node of mesh.nodes()) {
      if (visited.has(node.id)) continue;
      const c0 = curvatures.get(node.id);
      if (!c0) continue;
      visited.add(node.id);
      queue.push(node.id);
      while (queue.length > 0) {
        const id = queue.shift();
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
  }
};

// src/core/algo/StreamlineTracer.ts
var StreamlineTracer = {
  /**
   * Laplacian smoothing of a single polyline. Each interior point is moved
   * toward the midpoint of its two neighbors. The endpoints are fixed so the
   * curve doesn't shrink at the silhouette / boundary.
   *
   * Pass `iterations > 1` for stronger smoothing; `weight ∈ [0,1]` controls
   * per-iteration step. Point count is unchanged (good for plotters — output
   * length stays predictable).
   */
  smoothPolyline(points, iterations = 1, weight = 0.5) {
    if (points.length < 3 || iterations < 1) return points;
    let cur = points;
    for (let it = 0; it < iterations; it++) {
      const next = new Array(cur.length);
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
  trace(mesh, field, options = {}) {
    const {
      maxSteps = 200,
      stride = 1,
      minMagSq = 1e-12,
      stepFactor = 0.25,
      liftFactor = 0.02
    } = options;
    const avgEdge = computeAverageEdgeLength(mesh);
    const dt = avgEdge * stepFactor;
    const lift = avgEdge * liftFactor;
    const lines = [];
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
  }
};
function computeAverageEdgeLength(mesh) {
  const edges = mesh.edgesArray();
  if (edges.length === 0) return 0.1;
  let total = 0;
  let count = 0;
  for (let i = 0; i < edges.length; i += 5) {
    const e = edges[i];
    const a = mesh.node(e.nodes[0]).position;
    const b = mesh.node(e.nodes[1]).position;
    total += a.distTo(b);
    count++;
  }
  return count > 0 ? total / count : 0.1;
}
function buildFaceCache(mesh) {
  const normals = /* @__PURE__ */ new Map();
  const centers = /* @__PURE__ */ new Map();
  for (const f2 of mesh.faces()) {
    const a = mesh.node(f2.nodes[0]).position;
    const b = mesh.node(f2.nodes[1]).position;
    const c = mesh.node(f2.nodes[2]).position;
    normals.set(f2.id, f2.normal ?? b.sub(a).cross(c.sub(a)).normalize());
    let sx = 0, sy = 0, sz = 0;
    for (const nid of f2.nodes) {
      const p = mesh.node(nid).position;
      sx += p.x;
      sy += p.y;
      sz += p.z;
    }
    const inv = 1 / f2.nodes.length;
    centers.set(f2.id, new Vec3(sx * inv, sy * inv, sz * inv));
  }
  return { normals, centers };
}
function isPointInFace(mesh, faceId, p) {
  const f2 = mesh.face(faceId);
  const n = f2.nodes;
  const p0 = mesh.node(n[0]).position;
  for (let i = 1; i < n.length - 1; i++) {
    const p1 = mesh.node(n[i]).position;
    const p2 = mesh.node(n[i + 1]).position;
    if (pointInTriangle(p, p0, p1, p2)) return true;
  }
  return false;
}
function pointInTriangle(p, a, b, c) {
  const normal = b.sub(a).cross(c.sub(a));
  const wA = b.sub(p).cross(c.sub(p)).dot(normal);
  const wB = c.sub(p).cross(a.sub(p)).dot(normal);
  const wC = a.sub(p).cross(b.sub(p)).dot(normal);
  return wA >= 0 && wB >= 0 && wC >= 0;
}
function findExitEdge(mesh, faceId, pos, dir, faceNormalFor) {
  const f2 = mesh.face(faceId);
  const n = faceNormalFor(faceId);
  let closest = Infinity;
  let bestEdge = -1;
  let bestPoint = Vec3.zero();
  for (const eid of f2.edges) {
    const edge = mesh.edge(eid);
    const A = mesh.node(edge.nodes[0]).position;
    const B = mesh.node(edge.nodes[1]).position;
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
function closestEdgeFallback(mesh, faceId, proposedNext) {
  const f2 = mesh.face(faceId);
  let minDist = Infinity;
  let bestEdge = -1;
  let bestPoint = Vec3.zero();
  for (const eid of f2.edges) {
    const edge = mesh.edge(eid);
    const A = mesh.node(edge.nodes[0]).position;
    const B = mesh.node(edge.nodes[1]).position;
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
function neighborFace(mesh, edgeId, currentFaceId) {
  const e = mesh.edge(edgeId);
  if (e.faces.length < 2) return -1;
  return e.faces[0] === currentFaceId ? e.faces[1] : e.faces[0];
}
function traceEuler(mesh, cache, startFaceId, startDir, field, maxSteps, dt, lift) {
  const normalFor = (id) => cache.normals.get(id) ?? Vec3.unitY();
  const centerFor = (id) => cache.centers.get(id) ?? Vec3.zero();
  const points = [];
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

// src/core/algo/BspTree.ts
var EPS2 = 1e-5;
function polygonFromVertices(vertices, shared) {
  const plane = Plane.fromThreePoints(vertices[0], vertices[1], vertices[2]);
  return { vertices, plane, shared };
}
function flipPolygon(p) {
  return { vertices: [...p.vertices].reverse(), plane: p.plane.flipped(), shared: p.shared };
}
function splitPolygon(polygon, plane, coplanarFront, coplanarBack, front, back) {
  const verts = polygon.vertices;
  const n = verts.length;
  const dists = new Array(n);
  const sides = new Array(n);
  let type = 0 /* COPLANAR */;
  for (let i = 0; i < n; i++) {
    const d = plane.distToPoint(verts[i]);
    dists[i] = d;
    const s = d > EPS2 ? 1 /* FRONT */ : d < -EPS2 ? 2 /* BACK */ : 0 /* COPLANAR */;
    sides[i] = s;
    type |= s;
  }
  switch (type) {
    case 0 /* COPLANAR */:
      if (plane.normal.dot(polygon.plane.normal) > 0) coplanarFront.push(polygon);
      else coplanarBack.push(polygon);
      break;
    case 1 /* FRONT */:
      front.push(polygon);
      break;
    case 2 /* BACK */:
      back.push(polygon);
      break;
    case 3 /* SPANNING */: {
      const f2 = [];
      const b = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const si = sides[i], sj = sides[j];
        const vi = verts[i], vj = verts[j];
        if (si !== 2 /* BACK */) f2.push(vi);
        if (si !== 1 /* FRONT */) b.push(vi);
        if ((si | sj) === 3 /* SPANNING */) {
          const t = dists[i] / (dists[i] - dists[j]);
          const v = vi.lerp(vj, t);
          f2.push(v);
          b.push(v);
        }
      }
      if (f2.length >= 3) front.push({ vertices: f2, plane: polygon.plane, shared: polygon.shared });
      if (b.length >= 3) back.push({ vertices: b, plane: polygon.plane, shared: polygon.shared });
      break;
    }
  }
}
function buildNode(polygons) {
  if (polygons.length === 0) return null;
  const plane = polygons[0].plane;
  const coF = [];
  const coB = [];
  const front = [];
  const back = [];
  for (const p of polygons) {
    splitPolygon(p, plane, coF, coB, front, back);
  }
  return {
    plane,
    front: buildNode(front),
    back: buildNode(back),
    coplanarFront: coF,
    coplanarBack: coB
  };
}
function allPolygons(node) {
  if (!node) return [];
  return [
    ...node.coplanarFront,
    ...node.coplanarBack,
    ...allPolygons(node.front),
    ...allPolygons(node.back)
  ];
}
function cloneNode(node) {
  if (!node) return null;
  return {
    plane: node.plane,
    front: cloneNode(node.front),
    back: cloneNode(node.back),
    coplanarFront: [...node.coplanarFront],
    coplanarBack: [...node.coplanarBack]
  };
}
function invertNode(node) {
  if (!node) return;
  for (let i = 0; i < node.coplanarFront.length; i++) {
    node.coplanarFront[i] = flipPolygon(node.coplanarFront[i]);
  }
  for (let i = 0; i < node.coplanarBack.length; i++) {
    node.coplanarBack[i] = flipPolygon(node.coplanarBack[i]);
  }
  const tmp = node.coplanarFront;
  node.coplanarFront = node.coplanarBack;
  node.coplanarBack = tmp;
  node.plane = node.plane.flipped();
  const tmpChild = node.front;
  node.front = node.back;
  node.back = tmpChild;
  invertNode(node.front);
  invertNode(node.back);
}
function clipPolygons(node, polygons) {
  if (!node) return [...polygons];
  let front = [];
  let back = [];
  const coF = [];
  const coB = [];
  for (const p of polygons) {
    splitPolygon(p, node.plane, coF, coB, front, back);
  }
  front = front.concat(coF);
  back = back.concat(coB);
  front = clipPolygons(node.front, front);
  back = node.back ? clipPolygons(node.back, back) : [];
  return front.concat(back);
}
function clipTo(a, b) {
  if (!a || !b) return;
  a.coplanarFront = clipPolygons(b, a.coplanarFront);
  a.coplanarBack = clipPolygons(b, a.coplanarBack);
  clipTo(a.front, b);
  clipTo(a.back, b);
}
function classifyPointNode(node, point) {
  if (!node) return "outside";
  const d = node.plane.distToPoint(point);
  if (d > EPS2) return classifyPointNode(node.front, point);
  if (d < -EPS2) {
    return node.back ? classifyPointNode(node.back, point) : "inside";
  }
  for (const poly of node.coplanarFront) {
    if (pointInConvexPolygon(point, poly)) return "on";
  }
  for (const poly of node.coplanarBack) {
    if (pointInConvexPolygon(point, poly)) return "on";
  }
  const fc = classifyPointNode(node.front, point);
  if (fc === "inside") return "inside";
  return classifyPointNode(node.back, point);
}
function pointInConvexPolygon(point, poly) {
  const verts = poly.vertices;
  const n = verts.length;
  const normal = poly.plane.normal;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const edge = verts[j].sub(verts[i]);
    const toPoint = point.sub(verts[i]);
    if (edge.cross(toPoint).dot(normal) < -EPS2) return false;
  }
  return true;
}
function traverseFTB(node, eye, visit) {
  if (!node) return;
  const d = node.plane.distToPoint(eye);
  if (d > 0) {
    traverseFTB(node.front, eye, visit);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    traverseFTB(node.back, eye, visit);
  } else {
    traverseFTB(node.back, eye, visit);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    traverseFTB(node.front, eye, visit);
  }
}
function traverseBTF(node, eye, visit) {
  if (!node) return;
  const d = node.plane.distToPoint(eye);
  if (d > 0) {
    traverseBTF(node.back, eye, visit);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    traverseBTF(node.front, eye, visit);
  } else {
    traverseBTF(node.front, eye, visit);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    traverseBTF(node.back, eye, visit);
  }
}
function polygonsFromMesh(positions, indices) {
  const nVerts = positions.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < positions.length; i += 3) {
    cx += positions[i];
    cy += positions[i + 1];
    cz += positions[i + 2];
  }
  cx /= nVerts;
  cy /= nVerts;
  cz /= nVerts;
  const polys = [];
  const nTri = indices.length / 3;
  for (let i = 0; i < nTri; i++) {
    const i0 = indices[i * 3] * 3;
    const i1 = indices[i * 3 + 1] * 3;
    const i2 = indices[i * 3 + 2] * 3;
    let a = new Vec3(positions[i0], positions[i0 + 1], positions[i0 + 2]);
    let b = new Vec3(positions[i1], positions[i1 + 1], positions[i1 + 2]);
    let c = new Vec3(positions[i2], positions[i2 + 1], positions[i2 + 2]);
    const cross = b.sub(a).cross(c.sub(a));
    if (cross.len() < EPS2) continue;
    const triCenter = new Vec3(
      (a.x + b.x + c.x) / 3,
      (a.y + b.y + c.y) / 3,
      (a.z + b.z + c.z) / 3
    );
    const outward = new Vec3(triCenter.x - cx, triCenter.y - cy, triCenter.z - cz);
    if (cross.dot(outward) < 0) {
      const tmp = b;
      b = c;
      c = tmp;
    }
    polys.push(polygonFromVertices([a, b, c]));
  }
  return polys;
}
function polygonsToMesh(polys) {
  const QUANT = 1e5;
  const vertMap = /* @__PURE__ */ new Map();
  const verts = [];
  const idxs = [];
  function addVert(v) {
    const key = `${Math.round(v.x * QUANT)}:${Math.round(v.y * QUANT)}:${Math.round(v.z * QUANT)}`;
    let idx = vertMap.get(key);
    if (idx !== void 0) return idx;
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
    indices: new Uint32Array(idxs)
  };
}
var BspTree = class _BspTree {
  constructor(root) {
    this.root = root;
  }
  // ── Construction ──
  /** Build a BSP tree from polygons. */
  static fromPolygons(polys) {
    return new _BspTree(buildNode(polys));
  }
  /** Build a BSP tree from an indexed triangle mesh. */
  static fromMesh(positions, indices) {
    return _BspTree.fromPolygons(polygonsFromMesh(positions, indices));
  }
  // ── Queries ──
  /** Collect all polygons in the tree. */
  toPolygons() {
    return allPolygons(this.root);
  }
  /** Triangulate all polygons and return as typed arrays (shared vertices). */
  toMesh() {
    return polygonsToMesh(this.toPolygons());
  }
  /** Triangulate with flat (per-face) normals — ready for rendering.
   *  No vertex deduplication; each triangle gets its own 3 vertices + normal. */
  toFlatMesh() {
    const polys = this.toPolygons();
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
        positions[vi] = vs[0].x;
        positions[vi + 1] = vs[0].y;
        positions[vi + 2] = vs[0].z;
        normals[vi] = nx;
        normals[vi + 1] = ny;
        normals[vi + 2] = nz;
        vi += 3;
        positions[vi] = vs[j].x;
        positions[vi + 1] = vs[j].y;
        positions[vi + 2] = vs[j].z;
        normals[vi] = nx;
        normals[vi + 1] = ny;
        normals[vi + 2] = nz;
        vi += 3;
        positions[vi] = vs[j + 1].x;
        positions[vi + 1] = vs[j + 1].y;
        positions[vi + 2] = vs[j + 1].z;
        normals[vi] = nx;
        normals[vi + 1] = ny;
        normals[vi + 2] = nz;
        vi += 3;
        indices[ii++] = base;
        indices[ii++] = base + 1;
        indices[ii++] = base + 2;
      }
    }
    return { positions, normals, indices };
  }
  /** Deep clone. */
  clone() {
    return new _BspTree(cloneNode(this.root));
  }
  /** Flip solid inside/outside. */
  invert() {
    invertNode(this.root);
    return this;
  }
  /** Classify a point relative to the solid. */
  classifyPoint(point) {
    return classifyPointNode(this.root, point);
  }
  // ── Traversal ──
  /** Visit polygons front-to-back from the given eye position. */
  traverseFrontToBack(eye, visit) {
    traverseFTB(this.root, eye, visit);
  }
  /** Visit polygons back-to-front from the given eye position (painter's order). */
  traverseBackToFront(eye, visit) {
    traverseBTF(this.root, eye, visit);
  }
  // ── CSG operations (return new trees, inputs unchanged) ──
  /** Return a new tree representing the union of a and b. */
  static union(a, b) {
    const ac = a.clone();
    const bc = b.clone();
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    return _BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
  }
  /** Return a new tree representing a with b subtracted. */
  static subtract(a, b) {
    const ac = a.clone();
    const bc = b.clone();
    invertNode(ac.root);
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    const result = _BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
    result.invert();
    return result;
  }
  /** Return a new tree representing the intersection of a and b. */
  static intersect(a, b) {
    const ac = a.clone();
    const bc = b.clone();
    invertNode(ac.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(ac.root);
    invertNode(bc.root);
    return _BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
  }
};

// src/core/geometry/surfaces/index.ts
function findKnotSpan(u, degree, knots, numCtrl) {
  const n = numCtrl - 1;
  if (u >= knots[n + 1]) return n;
  if (u <= knots[degree]) return degree;
  let low = degree, high = n + 1;
  let mid = low + high >> 1;
  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid;
    else low = mid;
    mid = low + high >> 1;
  }
  return mid;
}
function deBoor4D(pw, w, degree, knots, u) {
  const k = findKnotSpan(u, degree, knots, pw.length);
  const dPw = new Array(degree + 1);
  const dW = new Array(degree + 1);
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
function clampedUniformKnots(numCtrl, degree) {
  if (numCtrl <= degree) {
    throw new Error(`Need at least degree+1 control points (got ${numCtrl}, degree ${degree})`);
  }
  const knots = [];
  for (let i = 0; i <= degree; i++) knots.push(0);
  const interior = numCtrl - degree - 1;
  for (let i = 1; i <= interior; i++) knots.push(i / (interior + 1));
  for (let i = 0; i <= degree; i++) knots.push(1);
  return knots;
}
var NurbsSurface = class _NurbsSurface {
  /**
   * @param controlPoints  controlPoints[uIdx][vIdx], size (nU+1) × (nV+1)
   * @param degreeU        degree in the u-direction
   * @param degreeV        degree in the v-direction
   * @param knotsU         length must equal controlPoints.length + degreeU + 1
   * @param knotsV         length must equal controlPoints[0].length + degreeV + 1
   * @param weights        optional, same shape as controlPoints (defaults to all 1)
   */
  constructor(controlPoints, degreeU, degreeV, knotsU, knotsV, weights) {
    this.controlPoints = controlPoints;
    this.degreeU = degreeU;
    this.degreeV = degreeV;
    this.knotsU = knotsU;
    this.knotsV = knotsV;
    this.weights = weights;
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
  getPoint(u, v) {
    const uMin = this.knotsU[this.degreeU];
    const uMax = this.knotsU[this.knotsU.length - this.degreeU - 1];
    const vMin = this.knotsV[this.degreeV];
    const vMax = this.knotsV[this.knotsV.length - this.degreeV - 1];
    const uu = uMin + (uMax - uMin) * HMath.clamp(u, 0, 1);
    const vv = vMin + (vMax - vMin) * HMath.clamp(v, 0, 1);
    return this.evaluate(uu, vv);
  }
  /** Outward normal at (u, v) via finite differences in parameter space. */
  getNormal(u, v) {
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
   * Tessellate the surface into a Mesh by sampling on a (uDivs × vDivs) grid.
   * `closedU` / `closedV` merge the seam (use closedU=true for surfaces from `revolve`).
   */
  toMesh(uDivs = 32, vDivs = 32, closedU = false, closedV = false) {
    const mesh = new Mesh();
    const uSteps = closedU ? uDivs : uDivs + 1;
    const vSteps = closedV ? vDivs : vDivs + 1;
    const ids = [];
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
  static loft(curves, degreeU = 3) {
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
    const grid = curves.map((c) => c.controlPoints.map((p) => new Vec3(p.x, p.y, p.z)));
    const weights = curves.map(
      (c) => c.weights ? c.weights.slice() : new Array(nV).fill(1)
    );
    const nU = curves.length;
    const actualDegreeU = Math.max(1, Math.min(degreeU, nU - 1));
    const knotsU = clampedUniformKnots(nU, actualDegreeU);
    return new _NurbsSurface(grid, actualDegreeU, degreeV, knotsU, knotsV, weights);
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
  static revolve(profile, axisOrigin = new Vec3(0, 0, 0), axisDir = new Vec3(0, 1, 0)) {
    const A = axisDir.normalize();
    let xRef = Math.abs(A.dot(new Vec3(1, 0, 0))) < 0.9 ? new Vec3(1, 0, 0) : new Vec3(0, 0, 1);
    xRef = xRef.sub(A.mul(A.dot(xRef))).normalize();
    const yRef = A.cross(xRef).normalize();
    const SQRT1_2 = Math.SQRT1_2;
    const distMul = [1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1];
    const weightMul = [1, SQRT1_2, 1, SQRT1_2, 1, SQRT1_2, 1, SQRT1_2, 1];
    const nV = profile.controlPoints.length;
    const grid = [];
    const weights = [];
    for (let i = 0; i < 9; i++) {
      grid[i] = [];
      weights[i] = [];
      const angle = i * Math.PI / 4;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      for (let j = 0; j < nV; j++) {
        const P2 = profile.controlPoints[j];
        const rel = P2.sub(axisOrigin);
        const h = rel.dot(A);
        const radialVec = rel.sub(A.mul(h));
        const radius = radialVec.len();
        let radialDir;
        let perpRadialDir;
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
    const knotsU = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4];
    return new _NurbsSurface(grid, 2, profile.degree, knotsU, profile.knots.slice(), weights);
  }
  // ── Internal ──
  evaluate(u, v) {
    const nU = this.controlPoints.length;
    const rowPw = new Array(nU);
    const rowW = new Array(nU);
    for (let i = 0; i < nU; i++) {
      const pts = this.controlPoints[i];
      const wts = this.weights ? this.weights[i] : null;
      const nV = pts.length;
      const pw = new Array(nV);
      const w = new Array(nV);
      for (let j = 0; j < nV; j++) {
        const wj = wts ? wts[j] : 1;
        pw[j] = pts[j].mul(wj);
        w[j] = wj;
      }
      const r = deBoor4D(pw, w, this.degreeV, this.knotsV, v);
      rowPw[i] = r.pw;
      rowW[i] = r.w;
    }
    const final = deBoor4D(rowPw, rowW, this.degreeU, this.knotsU, u);
    return final.pw.mul(1 / final.w);
  }
};

// src/core/solar/SunPosition.ts
var SunPosition = {
  /**
   * Compute the sun's position in the sky for a given UTC instant and
   * geographic coordinates.
   *
   * @example
   *   // Solar noon, summer solstice, Zurich:
   *   const sun = SunPosition.compute({
   *     date:      new Date(Date.UTC(2025, 5, 21, 11, 30)),
   *     latitude:  47.37,
   *     longitude: 8.55,
   *   });
   *   // sun.altitude ≈ 1.10 rad (≈ 63°), sun.azimuth ≈ π (south).
   *   threeLight.position.copy(sun.direction).multiplyScalar(50);
   */
  compute(opts) {
    const { date, latitude, longitude } = opts;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const jd0 = julianDay(year, month, day);
    const t = jd0 + hour / 24 - 2451545;
    const meanLon = mod360(280.46 + 0.9856474 * t);
    const meanAnom = mod360(357.528 + 0.9856003 * t);
    const mA = rad(meanAnom);
    const eclLon = mod360(
      meanLon + 1.915 * Math.sin(mA) + 0.02 * Math.sin(2 * mA)
    );
    const eL = rad(eclLon);
    const obliq = rad(23.439 - 4e-7 * t);
    let ra = Math.atan2(Math.cos(obliq) * Math.sin(eL), Math.cos(eL));
    if (ra < 0) ra += 2 * Math.PI;
    const decl = Math.asin(Math.sin(obliq) * Math.sin(eL));
    let gmst = (6.697375 + 0.0657098242 * t + hour) % 24;
    if (gmst < 0) gmst += 24;
    let lmst = (gmst + longitude / 15) % 24;
    if (lmst < 0) lmst += 24;
    let ha = rad(lmst * 15) - ra;
    if (ha > Math.PI) ha -= 2 * Math.PI;
    if (ha < -Math.PI) ha += 2 * Math.PI;
    const lat = rad(latitude);
    const sinAlt = Math.sin(decl) * Math.sin(lat) + Math.cos(decl) * Math.cos(lat) * Math.cos(ha);
    const altitude = Math.asin(clamp(sinAlt, -1, 1));
    const cosAlt = Math.cos(altitude);
    let azimuth = 0;
    if (cosAlt > 1e-9) {
      const sinAz = -Math.cos(decl) * Math.sin(ha);
      const cosAz = Math.sin(decl) * Math.cos(lat) - Math.cos(decl) * Math.cos(ha) * Math.sin(lat);
      azimuth = Math.atan2(sinAz, cosAz);
      if (azimuth < 0) azimuth += 2 * Math.PI;
      if (azimuth >= 2 * Math.PI) azimuth -= 2 * Math.PI;
    }
    const direction = new Vec3(
      Math.sin(azimuth) * cosAlt,
      Math.cos(azimuth) * cosAlt,
      Math.sin(altitude)
    );
    return { altitude, azimuth, direction, isDaytime: altitude > 0 };
  }
};
function rad(deg) {
  return deg * Math.PI / 180;
}
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
function mod360(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}
function julianDay(year, month, day) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

// src/core/graph/index.ts
var MinHeap = class {
  constructor() {
    this.data = [];
  }
  get size() {
    return this.data.length;
  }
  push(val, priority) {
    this.data.push({ val, pri: priority });
    this.bubbleUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return void 0;
    const top = this.data[0].val;
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  bubbleUp(i) {
    while (i > 0) {
      const p = i - 1 >> 1;
      if (this.data[i].pri >= this.data[p].pri) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }
  bubbleDown(i) {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].pri < this.data[min].pri) min = l;
      if (r < n && this.data[r].pri < this.data[min].pri) min = r;
      if (min === i) break;
      [this.data[i], this.data[min]] = [this.data[min], this.data[i]];
      i = min;
    }
  }
};
var Graph = class _Graph {
  constructor(nodeCount, getNeighbors, getWeight) {
    this.nodeCount = nodeCount;
    this.getNeighbors = getNeighbors;
    this.getWeight = getWeight ?? (() => 1);
  }
  // ── Dijkstra ──
  dijkstra(source) {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    dist[source] = 0;
    return this.dijkstraFromDistances(dist);
  }
  dijkstraFromSources(sources) {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    for (const s of sources) dist[s] = 0;
    return this.dijkstraFromDistances(dist);
  }
  dijkstraFromDistances(startDist) {
    const dist = new Float64Array(startDist);
    const pred = new Int32Array(this.nodeCount).fill(-1);
    const pq = new MinHeap();
    for (let i = 0; i < this.nodeCount; i++) {
      if (dist[i] < Infinity) pq.push(i, dist[i]);
    }
    while (pq.size > 0) {
      const u = pq.pop();
      for (const v of this.getNeighbors(u)) {
        const d = dist[u] + this.getWeight(u, v);
        if (d < dist[v]) {
          dist[v] = d;
          pred[v] = u;
          pq.push(v, d);
        }
      }
    }
    return { dist, pred };
  }
  shortestPath(source, target) {
    const { pred } = this.dijkstra(source);
    return _Graph.tracePath(pred, target);
  }
  static tracePath(pred, target) {
    const path = [];
    let v = target;
    while (v !== -1) {
      path.push(v);
      v = pred[v];
    }
    return path;
  }
  // ── Voronoi ──
  dijkstraVoronoi(sources) {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    const pred = new Int32Array(this.nodeCount).fill(-1);
    const closest = new Int32Array(this.nodeCount).fill(-1);
    const pq = new MinHeap();
    for (const s of sources) {
      dist[s] = 0;
      closest[s] = s;
      pq.push({ node: s, origin: s }, 0);
    }
    while (pq.size > 0) {
      const { node: u, origin } = pq.pop();
      if (closest[u] !== -1 && closest[u] !== origin && dist[u] < Infinity) continue;
      for (const v of this.getNeighbors(u)) {
        const d = dist[u] + this.getWeight(u, v);
        if (d < dist[v]) {
          dist[v] = d;
          pred[v] = u;
          closest[v] = origin;
          pq.push({ node: v, origin }, d);
        }
      }
    }
    return { dist, pred, closest };
  }
  // ── Connected components ──
  connectedComponents() {
    const labels = new Int32Array(this.nodeCount).fill(-1);
    const components = [];
    for (let i = 0; i < this.nodeCount; i++) {
      if (labels[i] >= 0) continue;
      const gid = components.length;
      const component = [];
      components.push(component);
      const queue = [i];
      labels[i] = gid;
      component.push(i);
      while (queue.length > 0) {
        const current = queue.shift();
        for (const nb of this.getNeighbors(current)) {
          if (labels[nb] < 0) {
            labels[nb] = gid;
            component.push(nb);
            queue.push(nb);
          }
        }
      }
    }
    return components;
  }
  componentLabels() {
    const labels = new Int32Array(this.nodeCount).fill(-1);
    let gid = 0;
    for (let i = 0; i < this.nodeCount; i++) {
      if (labels[i] >= 0) continue;
      const queue = [i];
      labels[i] = gid;
      while (queue.length > 0) {
        const current = queue.shift();
        for (const nb of this.getNeighbors(current)) {
          if (labels[nb] < 0) {
            labels[nb] = gid;
            queue.push(nb);
          }
        }
      }
      gid++;
    }
    return labels;
  }
  // ── Flood fill ──
  floodFill(seeds, maxDistance = Infinity) {
    const { dist } = this.dijkstraFromSources(seeds);
    const result = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (dist[i] <= maxDistance) result.push(i);
    return result;
  }
  floodFillPredicate(seed, predicate) {
    const visited = new Uint8Array(this.nodeCount);
    const result = [];
    const queue = [];
    if (!predicate(seed)) return result;
    visited[seed] = 1;
    queue.push(seed);
    result.push(seed);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const nb of this.getNeighbors(current)) {
        if (!visited[nb] && predicate(nb)) {
          visited[nb] = 1;
          result.push(nb);
          queue.push(nb);
        }
      }
    }
    return result;
  }
  // ── Degree analysis ──
  degrees() {
    const deg = new Int32Array(this.nodeCount);
    for (let i = 0; i < this.nodeCount; i++)
      deg[i] = this.getNeighbors(i).length;
    return deg;
  }
  leafNodes() {
    const leaves = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (this.getNeighbors(i).length === 1) leaves.push(i);
    return leaves;
  }
  junctionNodes() {
    const junctions = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (this.getNeighbors(i).length >= 3) junctions.push(i);
    return junctions;
  }
  // ── Eccentricity / Diameter ──
  eccentricity(node) {
    const { dist } = this.dijkstra(node);
    let max = 0;
    for (let i = 0; i < dist.length; i++)
      if (dist[i] < Infinity && dist[i] > max) max = dist[i];
    return max;
  }
  diameter() {
    let max = 0;
    for (let i = 0; i < this.nodeCount; i++)
      max = Math.max(max, this.eccentricity(i));
    return max;
  }
  // ── Factories ──
  static fromAdjacencyList(adjacency, weightFn) {
    return new _Graph(adjacency.length, (i) => adjacency[i], weightFn);
  }
  static fromEdgeList(nodeCount, edges, undirected = true, weightFn) {
    const adj = Array.from({ length: nodeCount }, () => []);
    for (const [from, to] of edges) {
      adj[from].push(to);
      if (undirected) adj[to].push(from);
    }
    return new _Graph(nodeCount, (i) => adj[i], weightFn);
  }
};
var GridGraph = {
  /** Creates a 2D 4-connected grid graph (N/S/E/W neighbors). */
  grid2D4(nx, ny, weightFn) {
    const n = nx * ny;
    const nbs = new Array(n);
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const list = [];
        if (x < nx - 1) list.push((x + 1) * ny + y);
        if (y < ny - 1) list.push(x * ny + y + 1);
        if (x > 0) list.push((x - 1) * ny + y);
        if (y > 0) list.push(x * ny + y - 1);
        nbs[x * ny + y] = list;
      }
    }
    return new Graph(n, (i) => nbs[i], weightFn ?? (() => 1));
  },
  /** Creates a 2D 8-connected grid graph (includes diagonals). */
  grid2D8(nx, ny, weightFn) {
    const n = nx * ny;
    const nbs = new Array(n);
    const sqrt2 = Math.SQRT2;
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const list = [];
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx2 = x + dx, ny2 = y + dy;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny)
              list.push(nx2 * ny + ny2);
          }
        nbs[x * ny + y] = list;
      }
    }
    if (!weightFn) {
      weightFn = (i, j) => {
        const x1 = Math.floor(i / ny), y1 = i % ny;
        const x2 = Math.floor(j / ny), y2 = j % ny;
        return x1 !== x2 && y1 !== y2 ? sqrt2 : 1;
      };
    }
    return new Graph(n, (i) => nbs[i], weightFn);
  },
  /** Creates a 3D 6-connected voxel grid graph (face neighbors only). */
  grid3D6(nx, ny, nz, weightFn) {
    const nyz = ny * nz;
    const n = nx * ny * nz;
    const nbs = new Array(n);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const list = [];
          if (x > 0) list.push((x - 1) * nyz + y * nz + z);
          if (x < nx - 1) list.push((x + 1) * nyz + y * nz + z);
          if (y > 0) list.push(x * nyz + (y - 1) * nz + z);
          if (y < ny - 1) list.push(x * nyz + (y + 1) * nz + z);
          if (z > 0) list.push(x * nyz + y * nz + z - 1);
          if (z < nz - 1) list.push(x * nyz + y * nz + z + 1);
          nbs[x * nyz + y * nz + z] = list;
        }
    return new Graph(n, (i) => nbs[i], weightFn ?? (() => 1));
  }
};

// src/core/geometry/planarGraph/index.ts
var PGVertex = class {
  constructor(position) {
    this.edge = null;
    this.tag = 0;
    this.position = position;
  }
  get isIsolated() {
    return this.edge === null;
  }
  get degree() {
    if (!this.edge) return 0;
    let n = 0;
    let h = this.edge;
    do {
      n++;
      h = h.nextAtOrigin;
    } while (h !== this.edge);
    return n;
  }
  *outgoingEdges() {
    if (!this.edge) return;
    let h = this.edge;
    do {
      yield h;
      h = h.nextAtOrigin;
    } while (h !== this.edge);
  }
  *neighbors() {
    for (const h of this.outgoingEdges()) yield h.destination;
  }
  getEdgeTo(dest) {
    if (!this.edge) return null;
    let h = this.edge;
    do {
      if (h.destination === dest) return h;
      h = h.nextAtOrigin;
    } while (h !== this.edge);
    return null;
  }
  isNeighbor(other) {
    return this.getEdgeTo(other) !== null;
  }
};
var PGHalfEdge = class {
  constructor() {
    this.face = null;
    this.tag = 0;
  }
  get destination() {
    return this.twin.origin;
  }
  get nextAtOrigin() {
    return this.twin.next;
  }
  get prevAtOrigin() {
    let h = this;
    while (h.nextAtOrigin !== this) h = h.nextAtOrigin;
    return h;
  }
  get prev() {
    return this.prevAtOrigin.twin;
  }
  get direction() {
    return this.destination.position.sub(this.origin.position);
  }
  get midpoint() {
    return this.origin.position.add(this.destination.position).mul(0.5);
  }
  get length() {
    return this.direction.len();
  }
  get angle() {
    const d = this.direction;
    return Math.atan2(d.y, d.x);
  }
  get isSingle() {
    return this.nextAtOrigin === this;
  }
};
var PGFace = class {
  constructor() {
    this.tag = 0;
    this.color = null;
  }
  *edges() {
    let h = this.edge;
    do {
      yield h;
      h = h.next;
    } while (h !== this.edge);
  }
  *vertices() {
    let h = this.edge;
    do {
      yield h.origin;
      h = h.next;
    } while (h !== this.edge);
  }
  polygon() {
    const poly = [];
    for (const v of this.vertices()) poly.push(v.position);
    return poly;
  }
  get edgeCount() {
    let n = 0;
    let h = this.edge;
    do {
      n++;
      h = h.next;
    } while (h !== this.edge);
    return n;
  }
  signedArea() {
    let area = 0;
    let h = this.edge;
    do {
      const a = h.origin.position;
      const b = h.destination.position;
      area += a.x * b.y - b.x * a.y;
      h = h.next;
    } while (h !== this.edge);
    return area * 0.5;
  }
  get isCCW() {
    return this.signedArea() > 0;
  }
};
var PlanarGraph = class {
  constructor() {
    this.vertices = [];
    this.halfEdges = [];
    this.faces = [];
    this._removed = null;
  }
  // ── Construction ──
  addVertex(position) {
    const v = new PGVertex(position);
    this.vertices.push(v);
    return v;
  }
  addEdge(from, to) {
    const h = this.createEdgePair(from, to);
    this.attach(h);
    return h;
  }
  createEdgePair(from, to) {
    const h = new PGHalfEdge();
    const t = new PGHalfEdge();
    h.origin = from;
    t.origin = to;
    h.twin = t;
    t.twin = h;
    h.next = t;
    t.next = h;
    this.halfEdges.push(h, t);
    return h;
  }
  // ── Attach / Detach ──
  attach(h) {
    attachAtVertex(h);
    attachAtVertex(h.twin);
  }
  detach(h) {
    detachHalf(h);
    detachHalf(h.twin);
    h.next = h.twin;
    h.twin.next = h;
  }
  removeEdge(h) {
    this.detach(h);
    if (!this._removed) this._removed = /* @__PURE__ */ new Set();
    this._removed.add(h);
    this._removed.add(h.twin);
  }
  flushRemovals() {
    if (!this._removed || this._removed.size === 0) return;
    const rem = this._removed;
    for (let i = this.halfEdges.length - 1; i >= 0; i--) {
      if (rem.has(this.halfEdges[i])) this.halfEdges.splice(i, 1);
    }
    this._removed.clear();
  }
  // ── Face Construction ──
  buildFaces() {
    this.flushRemovals();
    this.clearFaces();
    for (const he of this.halfEdges) he.face = null;
    for (const he of this.halfEdges) {
      if (he.face !== null) continue;
      const face = new PGFace();
      face.edge = he;
      this.faces.push(face);
      let cur = he;
      do {
        cur.face = face;
        cur = cur.next;
      } while (cur !== he);
    }
  }
  clearFaces() {
    this.faces.length = 0;
    for (const he of this.halfEdges) he.face = null;
  }
  removeNegativeFaces(removeNegative = true) {
    for (let i = this.faces.length - 1; i >= 0; i--) {
      const neg = this.faces[i].signedArea() < 0;
      if (neg === removeNegative) {
        let cur = this.faces[i].edge;
        const start = cur;
        do {
          cur.face = null;
          cur = cur.next;
        } while (cur !== start);
        this.faces.splice(i, 1);
      }
    }
  }
  // ── Queries ──
  getUniqueEdges() {
    this.flushRemovals();
    const result = [];
    const seen = /* @__PURE__ */ new Set();
    for (const he of this.halfEdges) {
      if (seen.has(he)) continue;
      seen.add(he);
      seen.add(he.twin);
      result.push(he);
    }
    return result;
  }
  findClosestVertex(point, tolerance) {
    const tolSq = tolerance * tolerance;
    let best = null;
    let bestDist = Infinity;
    for (const v of this.vertices) {
      const d = v.position.distSqTo(point);
      if (d < tolSq && d < bestDist) {
        bestDist = d;
        best = v;
      }
    }
    return best;
  }
  getBounds() {
    if (this.vertices.length === 0) return { min: Vec2.zero(), max: Vec2.zero() };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of this.vertices) {
      if (v.position.x < minX) minX = v.position.x;
      if (v.position.y < minY) minY = v.position.y;
      if (v.position.x > maxX) maxX = v.position.x;
      if (v.position.y > maxY) maxY = v.position.y;
    }
    return { min: new Vec2(minX, minY), max: new Vec2(maxX, maxY) };
  }
  clearTags() {
    for (const v of this.vertices) v.tag = 0;
    for (const he of this.halfEdges) he.tag = 0;
    for (const f2 of this.faces) f2.tag = 0;
  }
  /** Edge positions as Vec3 pairs on the XZ ground plane (Y-up). */
  getEdgePositions3D() {
    const unique = this.getUniqueEdges();
    const result = [];
    for (const he of unique) {
      const a = he.origin.position;
      const b = he.destination.position;
      result.push(new Vec3(a.x, 0, a.y), new Vec3(b.x, 0, b.y));
    }
    return result;
  }
  /**
   * Creates a flat Mesh from CCW faces on the XZ ground plane.
   * Uses ear-clipping triangulation (handles non-convex faces correctly).
   * Optional per-face color callback.
   */
  toFlatMesh(faceColor) {
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    for (let fi = 0; fi < this.faces.length; fi++) {
      const face = this.faces[fi];
      if (face.signedArea() <= 0) continue;
      const poly = face.polygon();
      if (poly.length < 3) continue;
      const col = face.color ?? (faceColor ? faceColor(face, fi) : [0.4, 0.6, 0.9, 1]);
      const baseIdx = positions.length / 3;
      for (const v of poly) {
        positions.push(v.x, 0, v.y);
        normals.push(0, 1, 0);
        colors.push(col[0], col[1], col[2], col[3]);
      }
      const triIndices = earClipTriangulate(poly);
      for (const idx of triIndices) {
        indices.push(baseIdx + idx);
      }
    }
    if (positions.length === 0) {
      return new Mesh(new Float32Array(0), new Uint32Array(0));
    }
    const fm = new Mesh(
      new Float32Array(positions),
      new Uint32Array(indices),
      new Float32Array(normals),
      void 0,
      // uvs
      new Float32Array(colors)
    );
    return fm;
  }
};
function earClipTriangulate(poly) {
  const n = poly.length;
  if (n < 3) return [];
  if (n === 3) return [0, 1, 2];
  const indices = [];
  const remaining = [];
  for (let i = 0; i < n; i++) remaining.push(i);
  let safety = n * n;
  while (remaining.length > 3 && safety-- > 0) {
    let earFound = false;
    for (let i = 0; i < remaining.length; i++) {
      const pi = (i + remaining.length - 1) % remaining.length;
      const ni = (i + 1) % remaining.length;
      const a = poly[remaining[pi]];
      const b = poly[remaining[i]];
      const c = poly[remaining[ni]];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross <= 0) continue;
      let isEar = true;
      for (let j = 0; j < remaining.length; j++) {
        if (j === pi || j === i || j === ni) continue;
        if (pointInTriangle2D2(poly[remaining[j]], a, b, c)) {
          isEar = false;
          break;
        }
      }
      if (isEar) {
        indices.push(remaining[pi], remaining[i], remaining[ni]);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }
    if (!earFound) break;
  }
  if (remaining.length === 3) {
    indices.push(remaining[0], remaining[1], remaining[2]);
  }
  return indices;
}
function pointInTriangle2D2(p, a, b, c) {
  const d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  const d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y);
  const d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}
function attachAtVertex(h) {
  const v = h.origin;
  if (v.edge === null) {
    v.edge = h;
    return;
  }
  if (v.edge.isSingle) {
    attachAfter(v.edge, h);
    return;
  }
  const newAngle = h.angle;
  let insertAfterEdge = null;
  let maxAngleEdge = null;
  let bestAngle = -Infinity;
  let maxAngle = -Infinity;
  let cur = v.edge;
  do {
    const a = cur.angle;
    if (a < newAngle && a > bestAngle) {
      bestAngle = a;
      insertAfterEdge = cur;
    }
    if (a > maxAngle) {
      maxAngle = a;
      maxAngleEdge = cur;
    }
    cur = cur.nextAtOrigin;
  } while (cur !== v.edge);
  const target = insertAfterEdge ?? maxAngleEdge;
  attachBefore(target, h);
}
function attachAfter(existing, newEdge) {
  const save = existing.nextAtOrigin;
  existing.twin.next = newEdge;
  newEdge.twin.next = save;
}
function attachBefore(existing, newEdge) {
  const prev = existing.prevAtOrigin;
  prev.twin.next = newEdge;
  newEdge.twin.next = existing;
}
function detachHalf(h) {
  const v = h.origin;
  if (v.edge === h) {
    const nextO = h.nextAtOrigin;
    v.edge = nextO === h ? null : nextO;
  }
  const pr = h.prev;
  const nextInFace = h.twin.next;
  pr.next = nextInFace;
}
var PlanarGraphRepair = {
  /** Creates a valid planar graph from line segments. */
  fromSegments(segments, tolerance) {
    const graph = new PlanarGraph();
    for (const seg of segments) {
      const v1 = graph.addVertex(seg.a);
      const v2 = graph.addVertex(seg.b);
      const h = graph.createEdgePair(v1, v2);
      graph.attach(h);
    }
    fuseCloseVertices(graph, tolerance);
    intersectWithVertices(graph, tolerance);
    intersectEdges(graph, tolerance);
    graph.buildFaces();
    return graph;
  }
};
function fuseCloseVertices(graph, tolerance) {
  const tolSq = tolerance * tolerance;
  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;
  const rep = /* @__PURE__ */ new Map();
  for (const v of graph.vertices) rep.set(v, v);
  for (let i = 0; i < graph.vertices.length; i++) {
    const vi = graph.vertices[i];
    if (rep.get(vi) !== vi) continue;
    for (let j = i + 1; j < graph.vertices.length; j++) {
      const vj = graph.vertices[j];
      if (rep.get(vj) !== vj) continue;
      if (vi.position.distSqTo(vj.position) < tolSq) rep.set(vj, vi);
    }
  }
  for (const h of edges) {
    h.origin = rep.get(h.origin);
    h.twin.origin = rep.get(h.twin.origin);
  }
  reattachEdges(graph, edges);
}
function intersectWithVertices(graph, tolerance) {
  const EPS3 = 1e-3;
  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;
  const edgeSplits = /* @__PURE__ */ new Map();
  for (let ei = 0; ei < edges.length; ei++) {
    const h = edges[ei];
    const a = h.origin.position;
    const b = h.destination.position;
    for (const v of graph.vertices) {
      if (v === h.origin || v === h.destination) continue;
      const dist = VecMath.distanceToSegment2D(v.position, a, b);
      if (dist < tolerance) {
        const t = projectOnSegment(v.position, a, b);
        if (t > EPS3 && t < 1 - EPS3) {
          if (!edgeSplits.has(ei)) edgeSplits.set(ei, []);
          edgeSplits.get(ei).push({ t, v });
        }
      }
    }
  }
  const allEdges = [];
  for (let ei = 0; ei < edges.length; ei++) {
    const splits = edgeSplits.get(ei);
    if (!splits) {
      allEdges.push(edges[ei]);
      continue;
    }
    splitEdgeIntoChain(graph, edges[ei], splits, allEdges);
  }
  reattachEdges(graph, allEdges);
}
function intersectEdges(graph, tolerance) {
  const EPS3 = 1e-3;
  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;
  const edgeSplits = /* @__PURE__ */ new Map();
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const h1 = edges[i];
      const h2 = edges[j];
      if (h1.origin === h2.origin || h1.origin === h2.destination || h1.destination === h2.origin || h1.destination === h2.destination) continue;
      const result = Polygon2D.segmentIntersect2D(
        h1.origin.position,
        h1.destination.position,
        h2.origin.position,
        h2.destination.position
      );
      if (result && result.t > EPS3 && result.t < 1 - EPS3 && result.u > EPS3 && result.u < 1 - EPS3) {
        const v = graph.findClosestVertex(result.point, tolerance) ?? graph.addVertex(result.point);
        if (!edgeSplits.has(i)) edgeSplits.set(i, []);
        edgeSplits.get(i).push({ t: result.t, v });
        if (!edgeSplits.has(j)) edgeSplits.set(j, []);
        edgeSplits.get(j).push({ t: result.u, v });
      }
    }
  }
  const allEdges = [];
  for (let ei = 0; ei < edges.length; ei++) {
    const splits = edgeSplits.get(ei);
    if (!splits) {
      allEdges.push(edges[ei]);
      continue;
    }
    splitEdgeIntoChain(graph, edges[ei], splits, allEdges);
  }
  reattachEdges(graph, allEdges);
}
function splitEdgeIntoChain(graph, h, splits, output) {
  const origin = h.origin;
  const dest = h.destination;
  splits.sort((a, b) => a.t - b.t);
  for (let k = splits.length - 1; k > 0; k--) {
    if (splits[k].v === splits[k - 1].v) splits.splice(k, 1);
  }
  const filtered = splits.filter((s) => s.v !== origin && s.v !== dest);
  if (filtered.length === 0) {
    output.push(h);
    return;
  }
  h.twin.origin = filtered[0].v;
  output.push(h);
  for (let k = 0; k < filtered.length - 1; k++) {
    output.push(graph.createEdgePair(filtered[k].v, filtered[k + 1].v));
  }
  output.push(graph.createEdgePair(filtered[filtered.length - 1].v, dest));
}
function reattachEdges(graph, edges) {
  const valid = [];
  for (const h of edges) {
    if (h.origin === h.destination) continue;
    if (h.origin.isNeighbor(h.destination)) continue;
    graph.attach(h);
    valid.push(h);
  }
  graph.halfEdges.length = 0;
  for (const h of valid) {
    graph.halfEdges.push(h, h.twin);
  }
  const referenced = /* @__PURE__ */ new Set();
  for (const he of graph.halfEdges) {
    referenced.add(he.origin);
    referenced.add(he.destination);
  }
  for (let i = graph.vertices.length - 1; i >= 0; i--) {
    if (!referenced.has(graph.vertices[i])) graph.vertices.splice(i, 1);
  }
}
function projectOnSegment(p, a, b) {
  const ab = b.sub(a);
  const lenSq = ab.lenSq();
  if (lenSq < HMath.EPSILON) return 0;
  return p.sub(a).dot(ab) / lenSq;
}
var PlanarGraphCleanup = {
  /** Iteratively removes degree-1 vertices (dead ends). */
  removeDeadEnds(graph) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        const v = graph.vertices[i];
        if (v.degree === 1) {
          graph.removeEdge(v.edge);
          changed = true;
        }
      }
      graph.flushRemovals();
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
      }
    }
  },
  /** Dissolves degree-2 vertices with collinear edges. */
  removeLinearVertices(graph, angleTolerance = 0.01) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        const v = graph.vertices[i];
        if (v.degree !== 2) continue;
        const h1 = v.edge;
        const h2 = h1.nextAtOrigin;
        if (h2 === h1) continue;
        const d1 = h1.direction;
        const d2 = h2.direction;
        const cross = d1.x * d2.y - d1.y * d2.x;
        const dot = d1.dot(d2);
        const angle = Math.abs(Math.atan2(cross, dot));
        if (Math.abs(angle - Math.PI) < angleTolerance) {
          const a = h1.destination;
          const b = h2.destination;
          graph.removeEdge(h1);
          graph.removeEdge(h2);
          graph.vertices.splice(i, 1);
          if (!a.isNeighbor(b)) graph.addEdge(a, b);
          changed = true;
          break;
        }
      }
    }
  },
  /** Removes edges where both sides belong to the same face. */
  removeEdgesWithSameFace(graph) {
    const toRemove = [];
    for (const h of graph.getUniqueEdges()) {
      if (h.face !== null && h.twin.face !== null && h.face === h.twin.face)
        toRemove.push(h);
    }
    for (const h of toRemove) graph.removeEdge(h);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    if (toRemove.length > 0) graph.buildFaces();
  },
  /** Removes inner edges (both sides are bounded faces). */
  removeInnerEdges(graph) {
    const toRemove = [];
    for (const h of graph.getUniqueEdges()) {
      const leftBounded = h.face !== null && h.face.signedArea() > 0;
      const rightBounded = h.twin.face !== null && h.twin.face.signedArea() > 0;
      if (leftBounded && rightBounded) toRemove.push(h);
    }
    for (const h of toRemove) graph.removeEdge(h);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    if (toRemove.length > 0) graph.buildFaces();
  }
};
var DTriangle = class {
  constructor(v0, v1, v2) {
    this.children = [];
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
  }
};
var Delaunay2D = {
  /** Triangulates 2D points and returns a PlanarGraph with Delaunay faces. */
  triangulate(points) {
    if (points.length < 3) throw new Error("Need at least 3 points for triangulation.");
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const margin = Math.max(maxX - minX, maxY - minY) * 2 + 1;
    const cx = (minX + maxX) * 0.5, cy = (minY + maxY) * 0.5;
    const graph = new PlanarGraph();
    const sv0 = graph.addVertex(new Vec2(cx - margin, cy - margin));
    const sv1 = graph.addVertex(new Vec2(cx + margin, cy - margin));
    const sv2 = graph.addVertex(new Vec2(cx, cy + margin));
    graph.addEdge(sv0, sv1);
    graph.addEdge(sv1, sv2);
    graph.addEdge(sv2, sv0);
    const root = new DTriangle(sv0, sv1, sv2);
    for (const p of points) {
      const v = graph.addVertex(p);
      delaunayInsert(graph, v, root);
    }
    removeSuperTriangle(graph, sv0, sv1, sv2);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    repairConvexHull(graph);
    graph.buildFaces();
    return graph;
  }
};
function delaunayInsert(graph, v, root) {
  const tri = locateTriangle(root, v.position);
  if (!tri) return;
  const a = tri.v0, b = tri.v1, c = tri.v2;
  const edgeHit = onEdge(v.position, a.position, b.position, c.position);
  if (edgeHit < 0) {
    splitTriangle(graph, tri, v, root);
  } else {
    splitOnEdge(graph, tri, v, edgeHit, root);
  }
}
function splitTriangle(graph, tri, v, root) {
  const { v0: a, v1: b, v2: c } = tri;
  graph.addEdge(v, a);
  graph.addEdge(v, b);
  graph.addEdge(v, c);
  tri.children.push(new DTriangle(v, a, b), new DTriangle(v, b, c), new DTriangle(v, c, a));
  flipIfNeeded(graph, v, a, b, root);
  flipIfNeeded(graph, v, b, c, root);
  flipIfNeeded(graph, v, c, a, root);
}
function splitOnEdge(graph, tri, v, edgeHit, root) {
  let a = tri.v0, b = tri.v1, c = tri.v2;
  if (edgeHit === 1) {
    const tmp = a;
    a = b;
    b = c;
    c = tmp;
  } else if (edgeHit === 2) {
    const tmp = c;
    c = b;
    b = a;
    a = tmp;
  }
  let d = null;
  let opposite = null;
  const hab = a.getEdgeTo(b);
  if (hab) {
    const twin = hab.twin;
    let cur = twin.next;
    let safety = 0;
    while (cur !== twin && safety++ < 20) {
      if (cur.origin !== a && cur.origin !== b) {
        d = cur.origin;
        break;
      }
      cur = cur.next;
    }
    if (d) {
      const cx = (a.position.x + b.position.x + d.position.x) / 3;
      const cy = (a.position.y + b.position.y + d.position.y) / 3;
      opposite = locateTriangle(root, new Vec2(cx, cy));
    }
  }
  if (hab) graph.removeEdge(hab);
  graph.addEdge(v, a);
  graph.addEdge(v, b);
  graph.addEdge(v, c);
  tri.children.push(new DTriangle(v, a, c), new DTriangle(v, b, c));
  if (d) {
    graph.addEdge(v, d);
    const t3 = new DTriangle(v, a, d);
    const t4 = new DTriangle(v, b, d);
    if (opposite) {
      opposite.children.push(t3, t4);
    }
    flipIfNeeded(graph, v, a, d, root);
    flipIfNeeded(graph, v, d, b, root);
  }
  flipIfNeeded(graph, v, a, c, root);
  flipIfNeeded(graph, v, c, b, root);
}
function flipIfNeeded(graph, v, p1, p2, root) {
  const h = p1.getEdgeTo(p2);
  if (!h) return;
  const opp = findOppositeVertex(h, v);
  if (!opp) return;
  if (inCircumcircle(v.position, p1.position, p2.position, opp.position)) {
    const c1x = (v.position.x + p1.position.x + p2.position.x) / 3;
    const c1y = (v.position.y + p1.position.y + p2.position.y) / 3;
    const c2x = (opp.position.x + p1.position.x + p2.position.x) / 3;
    const c2y = (opp.position.y + p1.position.y + p2.position.y) / 3;
    const tri1 = locateTriangle(root, new Vec2(c1x, c1y));
    const tri2 = locateTriangle(root, new Vec2(c2x, c2y));
    graph.removeEdge(h);
    graph.addEdge(v, opp);
    const newT1 = new DTriangle(v, p1, opp);
    const newT2 = new DTriangle(v, opp, p2);
    if (tri1) {
      tri1.children.push(newT1, newT2);
    }
    if (tri2 && tri2 !== tri1) {
      tri2.children.push(newT1, newT2);
    }
    flipIfNeeded(graph, v, p1, opp, root);
    flipIfNeeded(graph, v, opp, p2, root);
  }
}
function findOppositeVertex(h, exclude) {
  const twin = h.twin;
  let cur = twin.next;
  let safety = 0;
  while (cur !== twin && safety++ < 20) {
    if (cur.origin !== h.origin && cur.origin !== h.destination && cur.origin !== exclude)
      return cur.origin;
    cur = cur.next;
  }
  return null;
}
function inCircumcircle(a, b, c, d) {
  const ax = a.x - d.x, ay = a.y - d.y;
  const bx = b.x - d.x, by = b.y - d.y;
  const cx2 = c.x - d.x, cy = c.y - d.y;
  const aSq = ax * ax + ay * ay;
  const bSq = bx * bx + by * by;
  const cSq = cx2 * cx2 + cy * cy;
  const det = ax * (by * cSq - cy * bSq) - bx * (ay * cSq - cy * aSq) + cx2 * (ay * bSq - by * aSq);
  const orient = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return orient > 0 ? det > 0 : det < 0;
}
function locateTriangle(node, p) {
  if (node.children.length === 0)
    return containsPoint(node, p) ? node : null;
  for (const child of node.children) {
    if (containsPoint(child, p)) {
      const result = locateTriangle(child, p);
      if (result) return result;
    }
  }
  return locateTriangleBrute(node, p);
}
function locateTriangleBrute(node, p) {
  if (node.children.length === 0)
    return containsPointRelaxed(node, p) ? node : null;
  for (const child of node.children) {
    const result = locateTriangleBrute(child, p);
    if (result) return result;
  }
  return null;
}
function containsPoint(tri, p) {
  const d1 = triSign(p, tri.v0.position, tri.v1.position);
  const d2 = triSign(p, tri.v1.position, tri.v2.position);
  const d3 = triSign(p, tri.v2.position, tri.v0.position);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function containsPointRelaxed(tri, p) {
  const EPS3 = 1e-10;
  const d1 = triSign(p, tri.v0.position, tri.v1.position);
  const d2 = triSign(p, tri.v1.position, tri.v2.position);
  const d3 = triSign(p, tri.v2.position, tri.v0.position);
  const hasNeg = d1 < -EPS3 || d2 < -EPS3 || d3 < -EPS3;
  const hasPos = d1 > EPS3 || d2 > EPS3 || d3 > EPS3;
  return !(hasNeg && hasPos);
}
function triSign(p, a, b) {
  return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
}
function onEdge(p, a, b, c) {
  const EPS3 = 1e-6;
  if (Math.abs(triSign(p, a, b)) < EPS3) return 0;
  if (Math.abs(triSign(p, b, c)) < EPS3) return 1;
  if (Math.abs(triSign(p, c, a)) < EPS3) return 2;
  return -1;
}
function removeSuperTriangle(graph, sv0, sv1, sv2) {
  const superVerts = /* @__PURE__ */ new Set([sv0, sv1, sv2]);
  const toRemove = [];
  for (const h of graph.getUniqueEdges()) {
    if (superVerts.has(h.origin) || superVerts.has(h.destination))
      toRemove.push(h);
  }
  for (const h of toRemove) graph.removeEdge(h);
  for (let i = graph.vertices.length - 1; i >= 0; i--) {
    if (superVerts.has(graph.vertices[i])) graph.vertices.splice(i, 1);
  }
}
function repairConvexHull(graph) {
  for (let iter = 0; iter < 1e3; iter++) {
    graph.buildFaces();
    const extFace = graph.faces.find((f2) => f2.signedArea() < 0);
    if (!extFace) return;
    const edges = [];
    for (const he of extFace.edges()) edges.push(he);
    let foundConcavity = false;
    for (let i = 0; i < edges.length; i++) {
      const cur = edges[i];
      const nxt = edges[(i + 1) % edges.length];
      const d1 = cur.direction;
      const d2 = nxt.direction;
      const cross = d1.x * d2.y - d1.y * d2.x;
      if (cross > 1e-9) {
        graph.addEdge(cur.origin, nxt.destination);
        foundConcavity = true;
        break;
      }
    }
    if (!foundConcavity) break;
  }
}

// src/core/voxel/index.ts
function gaussianKernel(radius) {
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);
  const sigma = radius / 3;
  const s2 = 2 * sigma * sigma;
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / s2);
    sum += kernel[i];
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}
var VoxelGrid2D = class _VoxelGrid2D {
  constructor(nx, ny, cellSize = 1, x1 = 0, y1 = 0) {
    this.nx = nx;
    this.ny = ny;
    this.cellSize = cellSize;
    this.x1 = x1;
    this.y1 = y1;
    this.values = new Float32Array(nx * ny);
  }
  static fromBounds(min, max, cellSize) {
    const nx = Math.floor((max.x - min.x) / cellSize) + 2;
    const ny = Math.floor((max.y - min.y) / cellSize) + 2;
    return new _VoxelGrid2D(nx, ny, cellSize, min.x - cellSize, min.y - cellSize);
  }
  static fromResolution(min, max, resolution) {
    const cs = Math.max(max.x - min.x, max.y - min.y) / (resolution - 1);
    return _VoxelGrid2D.fromBounds(min, max, cs);
  }
  // ── Indexing ──
  getIndex(x, y) {
    return x * this.ny + y;
  }
  get(x, y) {
    if (x < 0 || x >= this.nx || y < 0 || y >= this.ny) return Infinity;
    return this.values[x * this.ny + y];
  }
  set(x, y, value) {
    if (x >= 0 && x < this.nx && y >= 0 && y < this.ny)
      this.values[x * this.ny + y] = value;
  }
  getPosition(x, y) {
    return new Vec2(this.x1 + x * this.cellSize, this.y1 + y * this.cellSize);
  }
  getVoxelCoord(worldPos) {
    return {
      x: Math.round((worldPos.x - this.x1) / this.cellSize),
      y: Math.round((worldPos.y - this.y1) / this.cellSize)
    };
  }
  // ── Fill ──
  fillFromFunction(fn) {
    for (let x = 0; x < this.nx; x++) {
      const xc = this.x1 + x * this.cellSize;
      for (let y = 0; y < this.ny; y++) {
        const yc = this.y1 + y * this.cellSize;
        this.values[x * this.ny + y] = fn(new Vec2(xc, yc));
      }
    }
  }
  clear(value = Infinity) {
    this.values.fill(value);
  }
  // ── Scalar offset ──
  offset(amount) {
    for (let i = 0; i < this.values.length; i++)
      this.values[i] += amount;
  }
  // ── Gaussian blur (separable 2-pass) ──
  blur(radius) {
    if (radius <= 0) return;
    const kernel = gaussianKernel(radius);
    const kSize = kernel.length;
    const { nx, ny, values } = this;
    const temp = new Float32Array(values.length);
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        let v = 0, wSum = 0;
        for (let k = 0; k < kSize; k++) {
          const cx = x + k - radius;
          if (cx >= 0 && cx < nx) {
            v += values[cx * ny + y] * kernel[k];
            wSum += kernel[k];
          }
        }
        temp[x * ny + y] = v / wSum;
      }
    }
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        let v = 0, wSum = 0;
        for (let k = 0; k < kSize; k++) {
          const cy = y + k - radius;
          if (cy >= 0 && cy < ny) {
            v += temp[x * ny + cy] * kernel[k];
            wSum += kernel[k];
          }
        }
        values[x * ny + y] = v / wSum;
      }
    }
  }
  // ── Utilities ──
  getRange() {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] < min) min = this.values[i];
      if (this.values[i] > max) max = this.values[i];
    }
    return { min, max };
  }
  clone() {
    const copy = new _VoxelGrid2D(this.nx, this.ny, this.cellSize, this.x1, this.y1);
    copy.values.set(this.values);
    return copy;
  }
};
var VoxelGrid = class _VoxelGrid {
  constructor(nx, ny, nz, cellSize = 1, x1 = 0, y1 = 0, z1 = 0) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.cellSize = cellSize;
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
    this.values = new Float32Array(nx * ny * nz);
  }
  static fromBounds(min, max, cellSize) {
    const nx = Math.floor((max.x - min.x) / cellSize) + 2;
    const ny = Math.floor((max.y - min.y) / cellSize) + 2;
    const nz = Math.floor((max.z - min.z) / cellSize) + 2;
    return new _VoxelGrid(
      nx,
      ny,
      nz,
      cellSize,
      min.x - cellSize,
      min.y - cellSize,
      min.z - cellSize
    );
  }
  static fromResolution(min, max, resolution) {
    const cs = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) / (resolution - 1);
    return _VoxelGrid.fromBounds(min, max, cs);
  }
  // ── Indexing ──
  getIndex(x, y, z) {
    return x * this.ny * this.nz + y * this.nz + z;
  }
  get(x, y, z) {
    if (x < 0 || x >= this.nx || y < 0 || y >= this.ny || z < 0 || z >= this.nz) return Infinity;
    return this.values[this.getIndex(x, y, z)];
  }
  set(x, y, z, value) {
    if (x >= 0 && x < this.nx && y >= 0 && y < this.ny && z >= 0 && z < this.nz)
      this.values[this.getIndex(x, y, z)] = value;
  }
  getPosition(x, y, z) {
    return new Vec3(
      this.x1 + x * this.cellSize,
      this.y1 + y * this.cellSize,
      this.z1 + z * this.cellSize
    );
  }
  getVoxelCoord(worldPos) {
    return {
      x: Math.round((worldPos.x - this.x1) / this.cellSize),
      y: Math.round((worldPos.y - this.y1) / this.cellSize),
      z: Math.round((worldPos.z - this.z1) / this.cellSize)
    };
  }
  // ── Fill ──
  fillFromSdf(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          values[x * nyz + y * nz + z] = sdf.distance(new Vec3(xc, yc, z1 + z * cellSize));
        }
      }
    }
  }
  fillFromFunction(fn) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          values[x * nyz + y * nz + z] = fn(new Vec3(xc, yc, z1 + z * cellSize));
        }
      }
    }
  }
  clear(value = Infinity) {
    this.values.fill(value);
  }
  // ── Boolean ops (modify in place) ──
  union(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.min(values[idx], sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }
  subtract(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.max(values[idx], -sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }
  intersect(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.max(values[idx], sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }
  // ── Scalar offset ──
  offset(amount) {
    for (let i = 0; i < this.values.length; i++)
      this.values[i] += amount;
  }
  // ── Gaussian blur (separable 3-pass) ──
  blur(radius) {
    if (radius <= 0) return;
    const kernel = gaussianKernel(radius);
    const kSize = kernel.length;
    const { nx, ny, nz, values } = this;
    const nyz = ny * nz;
    const temp = new Float32Array(values.length);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cx = x + k - radius;
            if (cx >= 0 && cx < nx) {
              v += values[cx * nyz + y * nz + z] * kernel[k];
              wSum += kernel[k];
            }
          }
          temp[x * nyz + y * nz + z] = v / wSum;
        }
    const temp2 = new Float32Array(values.length);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cy = y + k - radius;
            if (cy >= 0 && cy < ny) {
              v += temp[x * nyz + cy * nz + z] * kernel[k];
              wSum += kernel[k];
            }
          }
          temp2[x * nyz + y * nz + z] = v / wSum;
        }
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cz = z + k - radius;
            if (cz >= 0 && cz < nz) {
              v += temp2[x * nyz + y * nz + cz] * kernel[k];
              wSum += kernel[k];
            }
          }
          values[x * nyz + y * nz + z] = v / wSum;
        }
  }
  // ── Utilities ──
  getRange() {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] < min) min = this.values[i];
      if (this.values[i] > max) max = this.values[i];
    }
    return { min, max };
  }
  clone() {
    const copy = new _VoxelGrid(
      this.nx,
      this.ny,
      this.nz,
      this.cellSize,
      this.x1,
      this.y1,
      this.z1
    );
    copy.values.set(this.values);
    return copy;
  }
};
var MarchingSquares = {
  extract(values, nx, ny, iso = 0, cellSize = 1, originX = 0, originY = 0) {
    const segments = [];
    const n = new Float32Array(4);
    for (let x = 0; x < nx - 1; x++) {
      for (let y = 0; y < ny - 1; y++) {
        n[0] = values[x * ny + y];
        n[1] = values[(x + 1) * ny + y];
        n[2] = values[(x + 1) * ny + y + 1];
        n[3] = values[x * ny + y + 1];
        let caseNum = 0;
        for (let i = 3; i >= 0; i--) {
          if (n[i] > iso) caseNum++;
          if (i > 0) caseNum <<= 1;
        }
        const x1 = originX + x * cellSize;
        const y1 = originY + y * cellSize;
        const x2 = x1 + cellSize;
        const y2 = y1 + cellSize;
        const offset = caseNum * 4;
        for (let i = offset; i < offset + 4; i += 2) {
          const e1 = MS_EDGE_TABLE[i];
          const e2 = MS_EDGE_TABLE[i + 1];
          if (e1 < 0 || e2 < 0) break;
          segments.push({
            a: msEdgePoint(e1, n, x1, y1, x2, y2, iso, cellSize),
            b: msEdgePoint(e2, n, x1, y1, x2, y2, iso, cellSize)
          });
        }
      }
    }
    return segments;
  },
  extractFromGrid(grid, iso = 0) {
    return MarchingSquares.extract(
      grid.values,
      grid.nx,
      grid.ny,
      iso,
      grid.cellSize,
      grid.x1,
      grid.y1
    );
  }
};
function msInterp(v1, v2, iso) {
  const denom = v2 - v1;
  if (Math.abs(denom) < 1e-10) return 0;
  return (iso - v1) / denom;
}
function msEdgePoint(edge, n, x1, y1, x2, y2, iso, cellSize) {
  switch (edge) {
    case 0:
      return new Vec2(x1 + msInterp(n[0], n[1], iso) * cellSize, y1);
    case 1:
      return new Vec2(x2, y1 + msInterp(n[1], n[2], iso) * cellSize);
    case 2:
      return new Vec2(x1 + msInterp(n[3], n[2], iso) * cellSize, y2);
    case 3:
      return new Vec2(x1, y1 + msInterp(n[0], n[3], iso) * cellSize);
    default:
      return new Vec2(x1, y1);
  }
}
var MS_EDGE_TABLE = new Int8Array([
  -1,
  -1,
  -1,
  -1,
  0,
  3,
  -1,
  -1,
  1,
  0,
  -1,
  -1,
  1,
  3,
  -1,
  -1,
  2,
  1,
  -1,
  -1,
  0,
  1,
  2,
  3,
  2,
  0,
  -1,
  -1,
  2,
  3,
  -1,
  -1,
  3,
  2,
  -1,
  -1,
  0,
  2,
  -1,
  -1,
  1,
  0,
  3,
  2,
  1,
  2,
  -1,
  -1,
  3,
  1,
  -1,
  -1,
  0,
  1,
  -1,
  -1,
  3,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1
]);
var MarchingCubes = {
  extract(grid, iso = 0) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = grid;
    const nyz = ny * nz;
    const n = new Float32Array(8);
    const positions = [];
    const indices = [];
    const vertMap = /* @__PURE__ */ new Map();
    function addVertex(vx, vy, vz) {
      const qx = Math.round(vx * 1e4);
      const qy = Math.round(vy * 1e4);
      const qz = Math.round(vz * 1e4);
      const key = `${qx},${qy},${qz}`;
      let idx = vertMap.get(key);
      if (idx !== void 0) return idx;
      idx = positions.length;
      positions.push(new Vec3(vx, vy, vz));
      vertMap.set(key, idx);
      return idx;
    }
    for (let x = 0; x < nx - 1; x++) {
      for (let y = 0; y < ny - 1; y++) {
        for (let z = 0; z < nz - 1; z++) {
          const idx = x * nyz + y * nz + z;
          n[0] = values[idx + nz];
          n[1] = values[idx + nyz + nz];
          n[2] = values[idx + nyz];
          n[3] = values[idx];
          n[4] = values[idx + nz + 1];
          n[5] = values[idx + nyz + nz + 1];
          n[6] = values[idx + nyz + 1];
          n[7] = values[idx + 1];
          let caseNum = 0;
          for (let i = 7; i >= 0; i--) {
            if (n[i] > iso) caseNum++;
            if (i > 0) caseNum <<= 1;
          }
          const offset = caseNum * 15;
          for (let i = offset; i < offset + 15; i += 3) {
            if (MC_TRI_TABLE[i] < 0) break;
            for (let j = i; j < i + 3; j++) {
              let vx, vy, vz;
              switch (MC_TRI_TABLE[j]) {
                case 0:
                  vx = x + mcInterp(n[0], n[1], iso);
                  vy = y + 1;
                  vz = z;
                  break;
                case 1:
                  vx = x + 1;
                  vy = y + mcInterp(n[2], n[1], iso);
                  vz = z;
                  break;
                case 2:
                  vx = x + mcInterp(n[3], n[2], iso);
                  vy = y;
                  vz = z;
                  break;
                case 3:
                  vx = x;
                  vy = y + mcInterp(n[3], n[0], iso);
                  vz = z;
                  break;
                case 4:
                  vx = x + mcInterp(n[4], n[5], iso);
                  vy = y + 1;
                  vz = z + 1;
                  break;
                case 5:
                  vx = x + 1;
                  vy = y + mcInterp(n[6], n[5], iso);
                  vz = z + 1;
                  break;
                case 6:
                  vx = x + mcInterp(n[7], n[6], iso);
                  vy = y;
                  vz = z + 1;
                  break;
                case 7:
                  vx = x;
                  vy = y + mcInterp(n[7], n[4], iso);
                  vz = z + 1;
                  break;
                case 8:
                  vx = x;
                  vy = y + 1;
                  vz = z + mcInterp(n[0], n[4], iso);
                  break;
                case 9:
                  vx = x + 1;
                  vy = y + 1;
                  vz = z + mcInterp(n[1], n[5], iso);
                  break;
                case 10:
                  vx = x;
                  vy = y;
                  vz = z + mcInterp(n[3], n[7], iso);
                  break;
                case 11:
                  vx = x + 1;
                  vy = y;
                  vz = z + mcInterp(n[2], n[6], iso);
                  break;
                default:
                  vx = x;
                  vy = y;
                  vz = z;
                  break;
              }
              indices.push(addVertex(
                x1 + vx * cellSize,
                y1 + vy * cellSize,
                z1 + vz * cellSize
              ));
            }
          }
        }
      }
    }
    return Mesh.fromIndexedTriangles(positions, indices);
  }
};
function mcInterp(v1, v2, iso) {
  const denom = v2 - v1;
  if (Math.abs(denom) < 1e-10) return 0;
  return (iso - v1) / denom;
}
var MC_TRI_TABLE = new Int8Array([
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  8,
  3,
  9,
  8,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  1,
  2,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  2,
  11,
  0,
  2,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  8,
  3,
  2,
  11,
  8,
  11,
  9,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  10,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  10,
  2,
  8,
  10,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  9,
  0,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  10,
  2,
  1,
  9,
  10,
  9,
  8,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  11,
  1,
  10,
  11,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  11,
  1,
  0,
  8,
  11,
  8,
  10,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  9,
  0,
  3,
  10,
  9,
  10,
  11,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  8,
  11,
  11,
  8,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  7,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  3,
  0,
  7,
  3,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  1,
  9,
  4,
  7,
  1,
  7,
  3,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  4,
  7,
  3,
  0,
  4,
  1,
  2,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  2,
  11,
  9,
  0,
  2,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  11,
  9,
  2,
  9,
  7,
  2,
  7,
  3,
  7,
  9,
  4,
  -1,
  -1,
  -1,
  8,
  4,
  7,
  3,
  10,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  4,
  7,
  10,
  2,
  4,
  2,
  0,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  0,
  1,
  8,
  4,
  7,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  7,
  10,
  9,
  4,
  10,
  9,
  10,
  2,
  9,
  2,
  1,
  -1,
  -1,
  -1,
  3,
  11,
  1,
  3,
  10,
  11,
  7,
  8,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  10,
  11,
  1,
  4,
  10,
  1,
  0,
  4,
  7,
  10,
  4,
  -1,
  -1,
  -1,
  4,
  7,
  8,
  9,
  0,
  10,
  9,
  10,
  11,
  10,
  0,
  3,
  -1,
  -1,
  -1,
  4,
  7,
  10,
  4,
  10,
  9,
  9,
  10,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  0,
  8,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  5,
  4,
  1,
  5,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  5,
  4,
  8,
  3,
  5,
  3,
  1,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  9,
  5,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  8,
  1,
  2,
  11,
  4,
  9,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  2,
  11,
  5,
  4,
  2,
  4,
  0,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  11,
  5,
  3,
  2,
  5,
  3,
  5,
  4,
  3,
  4,
  8,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  10,
  2,
  0,
  8,
  10,
  4,
  9,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  5,
  4,
  0,
  1,
  5,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  1,
  5,
  2,
  5,
  8,
  2,
  8,
  10,
  4,
  8,
  5,
  -1,
  -1,
  -1,
  11,
  3,
  10,
  11,
  1,
  3,
  9,
  5,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  5,
  0,
  8,
  1,
  8,
  11,
  1,
  8,
  10,
  11,
  -1,
  -1,
  -1,
  5,
  4,
  0,
  5,
  0,
  10,
  5,
  10,
  11,
  10,
  0,
  3,
  -1,
  -1,
  -1,
  5,
  4,
  8,
  5,
  8,
  11,
  11,
  8,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  7,
  8,
  5,
  7,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  3,
  0,
  9,
  5,
  3,
  5,
  7,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  7,
  8,
  0,
  1,
  7,
  1,
  5,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  5,
  3,
  3,
  5,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  7,
  8,
  9,
  5,
  7,
  11,
  1,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  1,
  2,
  9,
  5,
  0,
  5,
  3,
  0,
  5,
  7,
  3,
  -1,
  -1,
  -1,
  8,
  0,
  2,
  8,
  2,
  5,
  8,
  5,
  7,
  11,
  5,
  2,
  -1,
  -1,
  -1,
  2,
  11,
  5,
  2,
  5,
  3,
  3,
  5,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  9,
  5,
  7,
  8,
  9,
  3,
  10,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  7,
  9,
  7,
  2,
  9,
  2,
  0,
  2,
  7,
  10,
  -1,
  -1,
  -1,
  2,
  3,
  10,
  0,
  1,
  8,
  1,
  7,
  8,
  1,
  5,
  7,
  -1,
  -1,
  -1,
  10,
  2,
  1,
  10,
  1,
  7,
  7,
  1,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  8,
  8,
  5,
  7,
  11,
  1,
  3,
  11,
  3,
  10,
  -1,
  -1,
  -1,
  5,
  7,
  0,
  5,
  0,
  9,
  7,
  10,
  0,
  1,
  0,
  11,
  10,
  11,
  0,
  10,
  11,
  0,
  10,
  0,
  3,
  11,
  5,
  0,
  8,
  0,
  7,
  5,
  7,
  0,
  10,
  11,
  5,
  7,
  10,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  0,
  1,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  8,
  3,
  1,
  9,
  8,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  6,
  5,
  2,
  6,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  6,
  5,
  1,
  2,
  6,
  3,
  0,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  6,
  5,
  9,
  0,
  6,
  0,
  2,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  9,
  8,
  5,
  8,
  2,
  5,
  2,
  6,
  3,
  2,
  8,
  -1,
  -1,
  -1,
  2,
  3,
  10,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  0,
  8,
  10,
  2,
  0,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  2,
  3,
  10,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  11,
  6,
  1,
  9,
  2,
  9,
  10,
  2,
  9,
  8,
  10,
  -1,
  -1,
  -1,
  6,
  3,
  10,
  6,
  5,
  3,
  5,
  1,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  10,
  0,
  10,
  5,
  0,
  5,
  1,
  5,
  10,
  6,
  -1,
  -1,
  -1,
  3,
  10,
  6,
  0,
  3,
  6,
  0,
  6,
  5,
  0,
  5,
  9,
  -1,
  -1,
  -1,
  6,
  5,
  9,
  6,
  9,
  10,
  10,
  9,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  11,
  6,
  4,
  7,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  3,
  0,
  4,
  7,
  3,
  6,
  5,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  9,
  0,
  5,
  11,
  6,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  6,
  5,
  1,
  9,
  7,
  1,
  7,
  3,
  7,
  9,
  4,
  -1,
  -1,
  -1,
  6,
  1,
  2,
  6,
  5,
  1,
  4,
  7,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  5,
  5,
  2,
  6,
  3,
  0,
  4,
  3,
  4,
  7,
  -1,
  -1,
  -1,
  8,
  4,
  7,
  9,
  0,
  5,
  0,
  6,
  5,
  0,
  2,
  6,
  -1,
  -1,
  -1,
  7,
  3,
  9,
  7,
  9,
  4,
  3,
  2,
  9,
  5,
  9,
  6,
  2,
  6,
  9,
  3,
  10,
  2,
  7,
  8,
  4,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  11,
  6,
  4,
  7,
  2,
  4,
  2,
  0,
  2,
  7,
  10,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  4,
  7,
  8,
  2,
  3,
  10,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  9,
  2,
  1,
  9,
  10,
  2,
  9,
  4,
  10,
  7,
  10,
  4,
  5,
  11,
  6,
  8,
  4,
  7,
  3,
  10,
  5,
  3,
  5,
  1,
  5,
  10,
  6,
  -1,
  -1,
  -1,
  5,
  1,
  10,
  5,
  10,
  6,
  1,
  0,
  10,
  7,
  10,
  4,
  0,
  4,
  10,
  0,
  5,
  9,
  0,
  6,
  5,
  0,
  3,
  6,
  10,
  6,
  3,
  8,
  4,
  7,
  6,
  5,
  9,
  6,
  9,
  10,
  4,
  7,
  9,
  7,
  10,
  9,
  -1,
  -1,
  -1,
  11,
  4,
  9,
  6,
  4,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  11,
  6,
  4,
  9,
  11,
  0,
  8,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  0,
  1,
  11,
  6,
  0,
  6,
  4,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  3,
  1,
  8,
  1,
  6,
  8,
  6,
  4,
  6,
  1,
  11,
  -1,
  -1,
  -1,
  1,
  4,
  9,
  1,
  2,
  4,
  2,
  6,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  8,
  1,
  2,
  9,
  2,
  4,
  9,
  2,
  6,
  4,
  -1,
  -1,
  -1,
  0,
  2,
  4,
  4,
  2,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  3,
  2,
  8,
  2,
  4,
  4,
  2,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  4,
  9,
  11,
  6,
  4,
  10,
  2,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  2,
  2,
  8,
  10,
  4,
  9,
  11,
  4,
  11,
  6,
  -1,
  -1,
  -1,
  3,
  10,
  2,
  0,
  1,
  6,
  0,
  6,
  4,
  6,
  1,
  11,
  -1,
  -1,
  -1,
  6,
  4,
  1,
  6,
  1,
  11,
  4,
  8,
  1,
  2,
  1,
  10,
  8,
  10,
  1,
  9,
  6,
  4,
  9,
  3,
  6,
  9,
  1,
  3,
  10,
  6,
  3,
  -1,
  -1,
  -1,
  8,
  10,
  1,
  8,
  1,
  0,
  10,
  6,
  1,
  9,
  1,
  4,
  6,
  4,
  1,
  3,
  10,
  6,
  3,
  6,
  0,
  0,
  6,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  4,
  8,
  10,
  6,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  11,
  6,
  7,
  8,
  11,
  8,
  9,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  7,
  3,
  0,
  11,
  7,
  0,
  9,
  11,
  6,
  7,
  11,
  -1,
  -1,
  -1,
  11,
  6,
  7,
  1,
  11,
  7,
  1,
  7,
  8,
  1,
  8,
  0,
  -1,
  -1,
  -1,
  11,
  6,
  7,
  11,
  7,
  1,
  1,
  7,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  6,
  1,
  6,
  8,
  1,
  8,
  9,
  8,
  6,
  7,
  -1,
  -1,
  -1,
  2,
  6,
  9,
  2,
  9,
  1,
  6,
  7,
  9,
  0,
  9,
  3,
  7,
  3,
  9,
  7,
  8,
  0,
  7,
  0,
  6,
  6,
  0,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  3,
  2,
  6,
  7,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  10,
  11,
  6,
  8,
  11,
  8,
  9,
  8,
  6,
  7,
  -1,
  -1,
  -1,
  2,
  0,
  7,
  2,
  7,
  10,
  0,
  9,
  7,
  6,
  7,
  11,
  9,
  11,
  7,
  1,
  8,
  0,
  1,
  7,
  8,
  1,
  11,
  7,
  6,
  7,
  11,
  2,
  3,
  10,
  10,
  2,
  1,
  10,
  1,
  7,
  11,
  6,
  1,
  6,
  7,
  1,
  -1,
  -1,
  -1,
  8,
  9,
  6,
  8,
  6,
  7,
  9,
  1,
  6,
  10,
  6,
  3,
  1,
  3,
  6,
  0,
  9,
  1,
  10,
  6,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  8,
  0,
  7,
  0,
  6,
  3,
  10,
  0,
  10,
  6,
  0,
  -1,
  -1,
  -1,
  7,
  10,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  8,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  1,
  9,
  8,
  3,
  1,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  1,
  2,
  6,
  10,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  3,
  0,
  8,
  6,
  10,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  9,
  0,
  2,
  11,
  9,
  6,
  10,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  10,
  7,
  2,
  11,
  3,
  11,
  8,
  3,
  11,
  9,
  8,
  -1,
  -1,
  -1,
  7,
  2,
  3,
  6,
  2,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  0,
  8,
  7,
  6,
  0,
  6,
  2,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  7,
  6,
  2,
  3,
  7,
  0,
  1,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  6,
  2,
  1,
  8,
  6,
  1,
  9,
  8,
  8,
  7,
  6,
  -1,
  -1,
  -1,
  11,
  7,
  6,
  11,
  1,
  7,
  1,
  3,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  7,
  6,
  1,
  7,
  11,
  1,
  8,
  7,
  1,
  0,
  8,
  -1,
  -1,
  -1,
  0,
  3,
  7,
  0,
  7,
  11,
  0,
  11,
  9,
  6,
  11,
  7,
  -1,
  -1,
  -1,
  7,
  6,
  11,
  7,
  11,
  8,
  8,
  11,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  8,
  4,
  10,
  8,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  6,
  10,
  3,
  0,
  6,
  0,
  4,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  6,
  10,
  8,
  4,
  6,
  9,
  0,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  4,
  6,
  9,
  6,
  3,
  9,
  3,
  1,
  10,
  3,
  6,
  -1,
  -1,
  -1,
  6,
  8,
  4,
  6,
  10,
  8,
  2,
  11,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  3,
  0,
  10,
  0,
  6,
  10,
  0,
  4,
  6,
  -1,
  -1,
  -1,
  4,
  10,
  8,
  4,
  6,
  10,
  0,
  2,
  9,
  2,
  11,
  9,
  -1,
  -1,
  -1,
  11,
  9,
  3,
  11,
  3,
  2,
  9,
  4,
  3,
  10,
  3,
  6,
  4,
  6,
  3,
  8,
  2,
  3,
  8,
  4,
  2,
  4,
  6,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  4,
  2,
  4,
  6,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  9,
  0,
  2,
  3,
  4,
  2,
  4,
  6,
  4,
  3,
  8,
  -1,
  -1,
  -1,
  1,
  9,
  4,
  1,
  4,
  2,
  2,
  4,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  1,
  3,
  8,
  6,
  1,
  8,
  4,
  6,
  6,
  11,
  1,
  -1,
  -1,
  -1,
  11,
  1,
  0,
  11,
  0,
  6,
  6,
  0,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  6,
  3,
  4,
  3,
  8,
  6,
  11,
  3,
  0,
  3,
  9,
  11,
  9,
  3,
  11,
  9,
  4,
  6,
  11,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  5,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  4,
  9,
  5,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  0,
  1,
  5,
  4,
  0,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  7,
  6,
  8,
  3,
  4,
  3,
  5,
  4,
  3,
  1,
  5,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  11,
  1,
  2,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  10,
  7,
  1,
  2,
  11,
  0,
  8,
  3,
  4,
  9,
  5,
  -1,
  -1,
  -1,
  7,
  6,
  10,
  5,
  4,
  11,
  4,
  2,
  11,
  4,
  0,
  2,
  -1,
  -1,
  -1,
  3,
  4,
  8,
  3,
  5,
  4,
  3,
  2,
  5,
  11,
  5,
  2,
  10,
  7,
  6,
  7,
  2,
  3,
  7,
  6,
  2,
  5,
  4,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  0,
  8,
  6,
  0,
  6,
  2,
  6,
  8,
  7,
  -1,
  -1,
  -1,
  3,
  6,
  2,
  3,
  7,
  6,
  1,
  5,
  0,
  5,
  4,
  0,
  -1,
  -1,
  -1,
  6,
  2,
  8,
  6,
  8,
  7,
  2,
  1,
  8,
  4,
  8,
  5,
  1,
  5,
  8,
  9,
  5,
  4,
  11,
  1,
  6,
  1,
  7,
  6,
  1,
  3,
  7,
  -1,
  -1,
  -1,
  1,
  6,
  11,
  1,
  7,
  6,
  1,
  0,
  7,
  8,
  7,
  0,
  9,
  5,
  4,
  4,
  0,
  11,
  4,
  11,
  5,
  0,
  3,
  11,
  6,
  11,
  7,
  3,
  7,
  11,
  7,
  6,
  11,
  7,
  11,
  8,
  5,
  4,
  11,
  4,
  8,
  11,
  -1,
  -1,
  -1,
  6,
  9,
  5,
  6,
  10,
  9,
  10,
  8,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  6,
  10,
  0,
  6,
  3,
  0,
  5,
  6,
  0,
  9,
  5,
  -1,
  -1,
  -1,
  0,
  10,
  8,
  0,
  5,
  10,
  0,
  1,
  5,
  5,
  6,
  10,
  -1,
  -1,
  -1,
  6,
  10,
  3,
  6,
  3,
  5,
  5,
  3,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  9,
  5,
  10,
  9,
  10,
  8,
  10,
  5,
  6,
  -1,
  -1,
  -1,
  0,
  10,
  3,
  0,
  6,
  10,
  0,
  9,
  6,
  5,
  6,
  9,
  1,
  2,
  11,
  10,
  8,
  5,
  10,
  5,
  6,
  8,
  0,
  5,
  11,
  5,
  2,
  0,
  2,
  5,
  6,
  10,
  3,
  6,
  3,
  5,
  2,
  11,
  3,
  11,
  5,
  3,
  -1,
  -1,
  -1,
  5,
  8,
  9,
  5,
  2,
  8,
  5,
  6,
  2,
  3,
  8,
  2,
  -1,
  -1,
  -1,
  9,
  5,
  6,
  9,
  6,
  0,
  0,
  6,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  5,
  8,
  1,
  8,
  0,
  5,
  6,
  8,
  3,
  8,
  2,
  6,
  2,
  8,
  1,
  5,
  6,
  2,
  1,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  3,
  6,
  1,
  6,
  11,
  3,
  8,
  6,
  5,
  6,
  9,
  8,
  9,
  6,
  11,
  1,
  0,
  11,
  0,
  6,
  9,
  5,
  0,
  5,
  6,
  0,
  -1,
  -1,
  -1,
  0,
  3,
  8,
  5,
  6,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  5,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  5,
  11,
  7,
  5,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  5,
  11,
  10,
  7,
  5,
  8,
  3,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  10,
  7,
  5,
  11,
  10,
  1,
  9,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  7,
  5,
  11,
  10,
  7,
  9,
  8,
  1,
  8,
  3,
  1,
  -1,
  -1,
  -1,
  10,
  1,
  2,
  10,
  7,
  1,
  7,
  5,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  1,
  2,
  7,
  1,
  7,
  5,
  7,
  2,
  10,
  -1,
  -1,
  -1,
  9,
  7,
  5,
  9,
  2,
  7,
  9,
  0,
  2,
  2,
  10,
  7,
  -1,
  -1,
  -1,
  7,
  5,
  2,
  7,
  2,
  10,
  5,
  9,
  2,
  3,
  2,
  8,
  9,
  8,
  2,
  2,
  5,
  11,
  2,
  3,
  5,
  3,
  7,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  2,
  0,
  8,
  5,
  2,
  8,
  7,
  5,
  11,
  2,
  5,
  -1,
  -1,
  -1,
  9,
  0,
  1,
  5,
  11,
  3,
  5,
  3,
  7,
  3,
  11,
  2,
  -1,
  -1,
  -1,
  9,
  8,
  2,
  9,
  2,
  1,
  8,
  7,
  2,
  11,
  2,
  5,
  7,
  5,
  2,
  1,
  3,
  5,
  3,
  7,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  7,
  0,
  7,
  1,
  1,
  7,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  0,
  3,
  9,
  3,
  5,
  5,
  3,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  8,
  7,
  5,
  9,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  8,
  4,
  5,
  11,
  8,
  11,
  10,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  0,
  4,
  5,
  10,
  0,
  5,
  11,
  10,
  10,
  3,
  0,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  8,
  4,
  11,
  8,
  11,
  10,
  11,
  4,
  5,
  -1,
  -1,
  -1,
  11,
  10,
  4,
  11,
  4,
  5,
  10,
  3,
  4,
  9,
  4,
  1,
  3,
  1,
  4,
  2,
  5,
  1,
  2,
  8,
  5,
  2,
  10,
  8,
  4,
  5,
  8,
  -1,
  -1,
  -1,
  0,
  4,
  10,
  0,
  10,
  3,
  4,
  5,
  10,
  2,
  10,
  1,
  5,
  1,
  10,
  0,
  2,
  5,
  0,
  5,
  9,
  2,
  10,
  5,
  4,
  5,
  8,
  10,
  8,
  5,
  9,
  4,
  5,
  2,
  10,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  5,
  11,
  3,
  5,
  2,
  3,
  4,
  5,
  3,
  8,
  4,
  -1,
  -1,
  -1,
  5,
  11,
  2,
  5,
  2,
  4,
  4,
  2,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  11,
  2,
  3,
  5,
  11,
  3,
  8,
  5,
  4,
  5,
  8,
  0,
  1,
  9,
  5,
  11,
  2,
  5,
  2,
  4,
  1,
  9,
  2,
  9,
  4,
  2,
  -1,
  -1,
  -1,
  8,
  4,
  5,
  8,
  5,
  3,
  3,
  5,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  4,
  5,
  1,
  0,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  4,
  5,
  8,
  5,
  3,
  9,
  0,
  5,
  0,
  3,
  5,
  -1,
  -1,
  -1,
  9,
  4,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  10,
  7,
  4,
  9,
  10,
  9,
  11,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  4,
  9,
  7,
  9,
  10,
  7,
  9,
  11,
  10,
  -1,
  -1,
  -1,
  1,
  11,
  10,
  1,
  10,
  4,
  1,
  4,
  0,
  7,
  4,
  10,
  -1,
  -1,
  -1,
  3,
  1,
  4,
  3,
  4,
  8,
  1,
  11,
  4,
  7,
  4,
  10,
  11,
  10,
  4,
  4,
  10,
  7,
  9,
  10,
  4,
  9,
  2,
  10,
  9,
  1,
  2,
  -1,
  -1,
  -1,
  9,
  7,
  4,
  9,
  10,
  7,
  9,
  1,
  10,
  2,
  10,
  1,
  0,
  8,
  3,
  10,
  7,
  4,
  10,
  4,
  2,
  2,
  4,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  7,
  4,
  10,
  4,
  2,
  8,
  3,
  4,
  3,
  2,
  4,
  -1,
  -1,
  -1,
  2,
  9,
  11,
  2,
  7,
  9,
  2,
  3,
  7,
  7,
  4,
  9,
  -1,
  -1,
  -1,
  9,
  11,
  7,
  9,
  7,
  4,
  11,
  2,
  7,
  8,
  7,
  0,
  2,
  0,
  7,
  3,
  7,
  11,
  3,
  11,
  2,
  7,
  4,
  11,
  1,
  11,
  0,
  4,
  0,
  11,
  1,
  11,
  2,
  8,
  7,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  1,
  4,
  1,
  7,
  7,
  1,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  1,
  4,
  1,
  7,
  0,
  8,
  1,
  8,
  7,
  1,
  -1,
  -1,
  -1,
  4,
  0,
  3,
  7,
  4,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  8,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  11,
  8,
  11,
  10,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  9,
  3,
  9,
  10,
  10,
  9,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  11,
  0,
  11,
  8,
  8,
  11,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  1,
  11,
  10,
  3,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  10,
  1,
  10,
  9,
  9,
  10,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  9,
  3,
  9,
  10,
  1,
  2,
  9,
  2,
  10,
  9,
  -1,
  -1,
  -1,
  0,
  2,
  10,
  8,
  0,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  2,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  8,
  2,
  8,
  11,
  11,
  8,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  11,
  2,
  0,
  9,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  8,
  2,
  8,
  11,
  0,
  1,
  8,
  1,
  11,
  8,
  -1,
  -1,
  -1,
  1,
  11,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  3,
  8,
  9,
  1,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  9,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  3,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1
]);
function matchesSign(value, targetSign) {
  return targetSign > 0 ? value > 0 : value < 0;
}
var FloodFill = {
  fill2D(grid, seeds, targetSign = 1) {
    const { values, nx, ny } = grid;
    const visited = new Uint8Array(values.length);
    const queue = [];
    for (const { x: sx, y: sy } of seeds) {
      if (sx < 0 || sx >= nx || sy < 0 || sy >= ny) continue;
      const idx = sx * ny + sy;
      if (visited[idx]) continue;
      if (!matchesSign(values[idx], targetSign)) continue;
      visited[idx] = 1;
      values[idx] = -values[idx];
      queue.push(idx);
    }
    const dx = [-1, 1, 0, 0];
    const dy = [0, 0, -1, 1];
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = Math.floor(idx / ny);
      const y = idx % ny;
      for (let d = 0; d < 4; d++) {
        const nx2 = x + dx[d], ny2 = y + dy[d];
        if (nx2 < 0 || nx2 >= nx || ny2 < 0 || ny2 >= ny) continue;
        const nIdx = nx2 * ny + ny2;
        if (visited[nIdx]) continue;
        if (!matchesSign(values[nIdx], targetSign)) continue;
        visited[nIdx] = 1;
        values[nIdx] = -values[nIdx];
        queue.push(nIdx);
      }
    }
  },
  fill3D(grid, seeds, targetSign = 1) {
    const { values, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const visited = new Uint8Array(values.length);
    const queue = [];
    for (const { x: sx, y: sy, z: sz } of seeds) {
      if (sx < 0 || sx >= nx || sy < 0 || sy >= ny || sz < 0 || sz >= nz) continue;
      const idx = sx * nyz + sy * nz + sz;
      if (visited[idx]) continue;
      if (!matchesSign(values[idx], targetSign)) continue;
      visited[idx] = 1;
      values[idx] = -values[idx];
      queue.push(idx);
    }
    const ddx = [-1, 1, 0, 0, 0, 0];
    const ddy = [0, 0, -1, 1, 0, 0];
    const ddz = [0, 0, 0, 0, -1, 1];
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = Math.floor(idx / nyz);
      const rem = idx % nyz;
      const y = Math.floor(rem / nz);
      const z = rem % nz;
      for (let d = 0; d < 6; d++) {
        const nx2 = x + ddx[d], ny2 = y + ddy[d], nz2 = z + ddz[d];
        if (nx2 < 0 || nx2 >= nx || ny2 < 0 || ny2 >= ny || nz2 < 0 || nz2 >= nz) continue;
        const nIdx = nx2 * nyz + ny2 * nz + nz2;
        if (visited[nIdx]) continue;
        if (!matchesSign(values[nIdx], targetSign)) continue;
        visited[nIdx] = 1;
        values[nIdx] = -values[nIdx];
        queue.push(nIdx);
      }
    }
  }
};
var DistanceTransform = {
  compute2D(grid, d1 = 1, d2 = 1.414) {
    const { values: v, nx, ny } = grid;
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        let cur = v[idx];
        if (cur === 0) continue;
        if (x > 0) {
          const c = v[(x - 1) * ny + y] + d1;
          if (c < cur) cur = c;
        }
        if (y > 0) {
          const c = v[idx - 1] + d1;
          if (c < cur) cur = c;
        }
        if (x > 0 && y > 0) {
          const c = v[(x - 1) * ny + y - 1] + d2;
          if (c < cur) cur = c;
        }
        if (x < nx - 1 && y > 0) {
          const c = v[(x + 1) * ny + y - 1] + d2;
          if (c < cur) cur = c;
        }
        v[idx] = cur;
      }
    }
    for (let x = nx - 1; x >= 0; x--) {
      for (let y = ny - 1; y >= 0; y--) {
        const idx = x * ny + y;
        let cur = v[idx];
        if (cur === 0) continue;
        if (x < nx - 1) {
          const c = v[(x + 1) * ny + y] + d1;
          if (c < cur) cur = c;
        }
        if (y < ny - 1) {
          const c = v[idx + 1] + d1;
          if (c < cur) cur = c;
        }
        if (x < nx - 1 && y < ny - 1) {
          const c = v[(x + 1) * ny + y + 1] + d2;
          if (c < cur) cur = c;
        }
        if (x > 0 && y < ny - 1) {
          const c = v[(x - 1) * ny + y + 1] + d2;
          if (c < cur) cur = c;
        }
        v[idx] = cur;
      }
    }
  },
  compute2DWithLabels(grid, labels, d1 = 1, d2 = 1.414) {
    const { values: v, nx, ny } = grid;
    function tryUpdate(idx, nIdx, cost, valid, cur) {
      if (!valid) return;
      const c = v[nIdx] + cost;
      if (c < cur.v) {
        cur.v = c;
        labels[idx] = labels[nIdx];
      }
    }
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        if (v[idx] === 0) continue;
        const cur = { v: v[idx] };
        tryUpdate(idx, (x - 1) * ny + y, d1, x > 0, cur);
        tryUpdate(idx, idx - 1, d1, y > 0, cur);
        tryUpdate(idx, (x - 1) * ny + y - 1, d2, x > 0 && y > 0, cur);
        tryUpdate(idx, (x + 1) * ny + y - 1, d2, x < nx - 1 && y > 0, cur);
        v[idx] = cur.v;
      }
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--) {
        const idx = x * ny + y;
        if (v[idx] === 0) continue;
        const cur = { v: v[idx] };
        tryUpdate(idx, (x + 1) * ny + y, d1, x < nx - 1, cur);
        tryUpdate(idx, idx + 1, d1, y < ny - 1, cur);
        tryUpdate(idx, (x + 1) * ny + y + 1, d2, x < nx - 1 && y < ny - 1, cur);
        tryUpdate(idx, (x - 1) * ny + y + 1, d2, x > 0 && y < ny - 1, cur);
        v[idx] = cur.v;
      }
  },
  compute3D(grid, d1 = 1, d2 = 1.414, d3 = 1.732) {
    const { values: v, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const costs = [d1, d2, d3];
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of FORWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const c = v[nx2 * nyz + ny2 * nz + nz2] + costs[ci];
              if (c < cur) cur = c;
            }
          }
          v[idx] = cur;
        }
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--)
        for (let z = nz - 1; z >= 0; z--) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of BACKWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const c = v[nx2 * nyz + ny2 * nz + nz2] + costs[ci];
              if (c < cur) cur = c;
            }
          }
          v[idx] = cur;
        }
  },
  compute3DWithLabels(grid, labels, d1 = 1, d2 = 1.414, d3 = 1.732) {
    const { values: v, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const costs = [d1, d2, d3];
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of FORWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const nIdx = nx2 * nyz + ny2 * nz + nz2;
              const c = v[nIdx] + costs[ci];
              if (c < cur) {
                cur = c;
                labels[idx] = labels[nIdx];
              }
            }
          }
          v[idx] = cur;
        }
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--)
        for (let z = nz - 1; z >= 0; z--) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of BACKWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const nIdx = nx2 * nyz + ny2 * nz + nz2;
              const c = v[nIdx] + costs[ci];
              if (c < cur) {
                cur = c;
                labels[idx] = labels[nIdx];
              }
            }
          }
          v[idx] = cur;
        }
  }
};
var FORWARD_3D = [
  [-1, 0, 0, 0],
  [0, -1, 0, 0],
  [0, 0, -1, 0],
  [-1, -1, 0, 1],
  [-1, 1, 0, 1],
  [-1, 0, -1, 1],
  [-1, 0, 1, 1],
  [0, -1, -1, 1],
  [0, -1, 1, 1],
  [-1, -1, -1, 2],
  [-1, -1, 1, 2],
  [-1, 1, -1, 2],
  [-1, 1, 1, 2]
];
var BACKWARD_3D = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [1, 1, 0, 1],
  [1, -1, 0, 1],
  [1, 0, 1, 1],
  [1, 0, -1, 1],
  [0, 1, 1, 1],
  [0, 1, -1, 1],
  [1, 1, 1, 2],
  [1, 1, -1, 2],
  [1, -1, 1, 2],
  [1, -1, -1, 2]
];
var BlobDetect = {
  labelComponents2D(grid, threshold = 0) {
    const { values: v, nx, ny } = grid;
    const labels = new Int32Array(v.length);
    let blobCount = 0;
    const queue = [];
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        if (labels[idx] !== 0) continue;
        if (v[idx] <= threshold) continue;
        blobCount++;
        labels[idx] = blobCount;
        queue.length = 0;
        queue.push(idx);
        let head = 0;
        while (head < queue.length) {
          const ci = queue[head++];
          const cx = Math.floor(ci / ny);
          const cy = ci % ny;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const bx = cx + dx, by = cy + dy;
            if (bx < 0 || bx >= nx || by < 0 || by >= ny) continue;
            const nIdx = bx * ny + by;
            if (labels[nIdx] !== 0) continue;
            if (v[nIdx] <= threshold) continue;
            labels[nIdx] = blobCount;
            queue.push(nIdx);
          }
        }
      }
    }
    return { labels, blobCount };
  },
  traceContours2D(grid, threshold = 0) {
    const { values: v, nx, ny } = grid;
    const DX = [1, 1, 0, -1, -1, -1, 0, 1];
    const DY = [0, -1, -1, -1, 0, 1, 1, 1];
    const fg = new Uint8Array(v.length);
    const border = new Uint8Array(v.length);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        fg[idx] = v[idx] > threshold ? 1 : 0;
        if (!fg[idx]) continue;
        if (x === 0 || x === nx - 1 || y === 0 || y === ny - 1) {
          border[idx] = 1;
          continue;
        }
        for (let d = 0; d < 8; d += 2) {
          const bx = x + DX[d], by = y + DY[d];
          if (bx < 0 || bx >= nx || by < 0 || by >= ny || v[bx * ny + by] <= threshold) {
            border[idx] = 1;
            break;
          }
        }
      }
    const visited = new Uint8Array(v.length);
    const contours = [];
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const startIdx = x * ny + y;
        if (!border[startIdx] || visited[startIdx]) continue;
        let startDir = -1;
        for (let d = 0; d < 8; d++) {
          const bx = x + DX[d], by = y + DY[d];
          if (bx < 0 || bx >= nx || by < 0 || by >= ny || !fg[bx * ny + by]) {
            startDir = d;
            break;
          }
        }
        if (startDir === -1) continue;
        const contour = [];
        let cx = x, cy = y;
        let lastDir = (startDir + 4) % 8;
        do {
          const searchStart = ((lastDir + 4) % 8 + 1) % 8;
          let nextDir = -1;
          for (let i = 0; i < 8; i++) {
            const d = (searchStart + i) % 8;
            const bx = cx + DX[d], by = cy + DY[d];
            if (bx < 0 || bx >= nx || by < 0 || by >= ny) continue;
            if (border[bx * ny + by]) {
              nextDir = d;
              break;
            }
          }
          if (nextDir === -1) break;
          const nextX = cx + DX[nextDir], nextY = cy + DY[nextDir];
          const nextIdx = nextX * ny + nextY;
          if (!visited[nextIdx]) {
            visited[nextIdx] = 1;
            contour.push({ x: nextX, y: nextY });
          }
          cx = nextX;
          cy = nextY;
          lastDir = nextDir;
        } while (cx !== x || cy !== y);
        if (contour.length >= 3) contours.push(contour);
      }
    return contours;
  }
};
var PixelView = {
  /**
   * Computes visibility from a single viewpoint, incrementing the result grid
   * for each visible cell (both open and obstacle cells).
   * @param obstacles Grid where values <= 0 are obstacles, > 0 are open.
   * @param result Grid to increment for each visible cell (same dimensions).
   * @param x Viewpoint X (grid coords).
   * @param y Viewpoint Y (grid coords).
   */
  analyse(obstacles, result, x, y) {
    stepView(obstacles, result, x, y, 1, 0);
    stepView(obstacles, result, x, y, -1, 0);
    stepView(obstacles, result, x, y, 0, 1);
    stepView(obstacles, result, x, y, 0, -1);
  },
  /**
   * Computes visibility from every non-obstacle cell, accumulating total visibility
   * counts. Result cells with higher values are visible from more viewpoints.
   */
  analyseAll(obstacles, result) {
    for (let x = 0; x < obstacles.nx; x++)
      for (let y = 0; y < obstacles.ny; y++)
        if (!isObstacle(obstacles, x, y))
          PixelView.analyse(obstacles, result, x, y);
  }
};
function isObstacle(obstacles, x, y) {
  if (x < 0 || x >= obstacles.nx || y < 0 || y >= obstacles.ny) return true;
  return obstacles.values[x * obstacles.ny + y] <= 0;
}
function inBounds(x, y, nx, ny) {
  return x >= 0 && x < nx && y >= 0 && y < ny;
}
var ViewEvent = class _ViewEvent {
  constructor(startX, startY, endX, endY) {
    const dX = endX - startX;
    const dY = endY - startY;
    const adX = Math.abs(dX);
    const adY = Math.abs(dY);
    this.stepDX = Math.sign(dX);
    this.stepDY = Math.sign(dY);
    if (adX > adY) {
      this.stepPX = this.stepDX;
      this.stepPY = 0;
      this.dFast = adY;
      this.dSlow = adX;
    } else {
      this.stepPX = 0;
      this.stepPY = this.stepDY;
      this.dFast = adX;
      this.dSlow = adY;
    }
    this.x = startX;
    this.y = startY;
    this.error = this.dSlow / 2;
  }
  stepForward() {
    this.error -= this.dFast;
    if (this.error < 0) {
      this.error += this.dSlow;
      this.x += this.stepDX;
      this.y += this.stepDY;
    } else {
      this.x += this.stepPX;
      this.y += this.stepPY;
    }
  }
  clone() {
    const ev = Object.create(_ViewEvent.prototype);
    Object.assign(ev, this);
    return ev;
  }
};
function stepView(obstacles, result, x, y, stepX, stepY) {
  const nx = obstacles.nx, ny = obstacles.ny;
  const maxDepth = Math.max(nx, ny);
  let plusX, plusY;
  let events = [];
  let nextEvents = [];
  if (stepX !== 0) {
    events.push(new ViewEvent(x, y, x + stepX, y - 1));
    events.push(new ViewEvent(x, y + 1, x + stepX, y + 2));
    plusX = 0;
    plusY = 1;
  } else {
    events.push(new ViewEvent(x, y, x - 1, y + stepY));
    events.push(new ViewEvent(x + 1, y, x + 2, y + stepY));
    plusX = 1;
    plusY = 0;
  }
  for (let depth = 0; depth < maxDepth && events.length > 0; depth++) {
    nextEvents.length = 0;
    for (const ev of events) ev.stepForward();
    for (let i = 0; i + 1 < events.length; i += 2) {
      const cEvent0 = events[i];
      const cEvent1 = events[i + 1];
      const scanSteps = plusY !== 0 ? cEvent1.y - cEvent0.y : cEvent1.x - cEvent0.x;
      if (scanSteps <= 0) continue;
      if (plusX === 0 && (cEvent0.x < 0 || cEvent0.x >= nx)) continue;
      if (plusY === 0 && (cEvent0.y < 0 || cEvent0.y >= ny)) continue;
      let cX = cEvent0.x;
      let cY = cEvent0.y;
      let isOpen = !isObstacle(obstacles, cX, cY);
      let openStart = cEvent0.clone();
      if (inBounds(cX, cY, nx, ny))
        result.values[cX * ny + cY] += 1;
      cX += plusX;
      cY += plusY;
      for (let s = 1; s < scanSteps; s++) {
        const isObs = isObstacle(obstacles, cX, cY);
        if (inBounds(cX, cY, nx, ny))
          result.values[cX * ny + cY] += 1;
        if (isOpen && isObs) {
          nextEvents.push(openStart);
          nextEvents.push(new ViewEvent(cX, cY, cX + cX - x, cY + cY - y));
          isOpen = false;
        } else if (!isOpen && !isObs) {
          openStart = new ViewEvent(cX, cY, cX + cX - x, cY + cY - y);
          isOpen = true;
        }
        cX += plusX;
        cY += plusY;
      }
      if (isOpen) {
        nextEvents.push(openStart);
        nextEvents.push(cEvent1);
      }
    }
    [events, nextEvents] = [nextEvents, events];
  }
}

// src/core/sdf/index.ts
var EPSILON2 = HMath.EPSILON;
var TWO_PI3 = Math.PI * 2;
var SdfSphere = class {
  constructor(radius, center = Vec3.zero()) {
    this.radius = radius;
    this.center = center;
  }
  distance(p) {
    return p.sub(this.center).len() - this.radius;
  }
};
var SdfBox = class _SdfBox {
  constructor(halfExtents, center = Vec3.zero()) {
    this.halfExtents = halfExtents;
    this.center = center;
  }
  static fromSize(sx, sy, sz) {
    return new _SdfBox(new Vec3(sx * 0.5, sy * 0.5, sz * 0.5));
  }
  distance(p) {
    const d = p.sub(this.center);
    const qx = Math.abs(d.x) - this.halfExtents.x;
    const qy = Math.abs(d.y) - this.halfExtents.y;
    const qz = Math.abs(d.z) - this.halfExtents.z;
    const outside = new Vec3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)).len();
    const inside = Math.min(Math.max(qx, Math.max(qy, qz)), 0);
    return outside + inside;
  }
};
var SdfCapsule = class {
  constructor(a, b, radius) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  distance(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.dot(ab);
    const t = abSq < EPSILON2 ? 0 : HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
    return p.sub(this.a.add(ab.mul(t))).len() - this.radius;
  }
};
var SdfCylinder = class _SdfCylinder {
  constructor(a, b, radius) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  static vertical(height, radius) {
    return new _SdfCylinder(
      new Vec3(0, -height * 0.5, 0),
      new Vec3(0, height * 0.5, 0),
      radius
    );
  }
  distance(p) {
    const ab = this.b.sub(this.a);
    const abLen = ab.len();
    if (abLen < EPSILON2) return p.sub(this.a).len() - this.radius;
    const axis = ab.mul(1 / abLen);
    const ap = p.sub(this.a);
    const h = ap.dot(axis);
    const radial = ap.sub(axis.mul(h));
    const r = radial.len();
    const dR = r - this.radius;
    const dH = Math.max(-h, h - abLen);
    if (dR <= 0 && dH <= 0) return Math.max(dR, dH);
    if (dR > 0 && dH > 0) return Math.sqrt(dR * dR + dH * dH);
    return Math.max(dR, dH);
  }
};
var SdfCone = class {
  constructor(a, b, radiusA, radiusB) {
    this.a = a;
    this.b = b;
    this.radiusA = radiusA;
    this.radiusB = radiusB;
  }
  distance(p) {
    const ab = this.b.sub(this.a);
    const abLen = ab.len();
    if (abLen < EPSILON2)
      return p.sub(this.a).len() - Math.max(this.radiusA, this.radiusB);
    const axis = ab.mul(1 / abLen);
    const ap = p.sub(this.a);
    const h = ap.dot(axis);
    const t = HMath.clamp(h / abLen, 0, 1);
    const r = ap.sub(axis.mul(h)).len();
    const rAtH = this.radiusA + (this.radiusB - this.radiusA) * t;
    const dR = r - rAtH;
    const dH = Math.max(-h, h - abLen);
    if (dR <= 0 && dH <= 0) return Math.max(dR, dH);
    if (dR > 0 && dH > 0) return Math.sqrt(dR * dR + dH * dH);
    return Math.max(dR, dH);
  }
};
var SdfTorus = class {
  constructor(majorRadius, minorRadius) {
    this.majorRadius = majorRadius;
    this.minorRadius = minorRadius;
  }
  distance(p) {
    const qx = Math.sqrt(p.x * p.x + p.z * p.z) - this.majorRadius;
    return Math.sqrt(qx * qx + p.y * p.y) - this.minorRadius;
  }
};
var SdfEllipsoid = class {
  constructor(radii) {
    this.radii = radii;
  }
  distance(p) {
    const scaled = new Vec3(p.x / this.radii.x, p.y / this.radii.y, p.z / this.radii.z);
    const scaled2 = new Vec3(
      p.x / (this.radii.x * this.radii.x),
      p.y / (this.radii.y * this.radii.y),
      p.z / (this.radii.z * this.radii.z)
    );
    const k0 = scaled.len();
    const k1 = scaled2.len();
    return k1 < EPSILON2 ? 0 : k0 * (k0 - 1) / k1;
  }
};
var SdfPlane = class {
  constructor(normal, dOrPoint) {
    this.normal = normal.normalize();
    if (typeof dOrPoint === "number") {
      this.d = dOrPoint;
    } else {
      this.d = this.normal.dot(dOrPoint);
    }
  }
  distance(p) {
    return p.dot(this.normal) - this.d;
  }
};
var SdfLine = class {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  distance(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.dot(ab);
    if (abSq < EPSILON2) return p.sub(this.a).len();
    const t = p.sub(this.a).dot(ab) / abSq;
    return p.sub(this.a.add(ab.mul(t))).len();
  }
};
var SdfUnion = class {
  constructor(...children) {
    this.children = children;
  }
  distance(p) {
    let min = Infinity;
    for (const c of this.children) min = Math.min(min, c.distance(p));
    return min;
  }
};
var SdfIntersect = class {
  constructor(...children) {
    this.children = children;
  }
  distance(p) {
    let max = -Infinity;
    for (const c of this.children) max = Math.max(max, c.distance(p));
    return max;
  }
};
var SdfSubtract = class {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  distance(p) {
    return Math.max(this.a.distance(p), -this.b.distance(p));
  }
};
var SdfBlend = class {
  constructor(a, b, radius = 1) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  distance(p) {
    const dA = this.a.distance(p);
    const dB = this.b.distance(p);
    const e = Math.max(this.radius - Math.abs(dA - dB), 0);
    return Math.min(dA, dB) - e * e * 0.25 / this.radius;
  }
};
var SdfSmoothSubtract = class {
  constructor(a, b, radius = 1) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  distance(p) {
    const dA = this.a.distance(p);
    const dB = this.b.distance(p);
    const e = Math.max(this.radius - Math.abs(dA + dB), 0);
    return Math.max(dA, -dB) + e * e * 0.25 / this.radius;
  }
};
var SdfSmoothUnion = class {
  constructor(a, b, k = 1) {
    this.a = a;
    this.b = b;
    this.k = k;
  }
  distance(p) {
    const a = this.a.distance(p);
    const b = this.b.distance(p);
    const h = HMath.clamp(0.5 + 0.5 * (b - a) / this.k, 0, 1);
    const mix = b + h * (a - b);
    return mix - this.k * h * (1 - h);
  }
};
var SdfShell = class {
  constructor(input, thickness = 1) {
    this.input = input;
    this.thickness = thickness;
  }
  distance(p) {
    return Math.abs(this.input.distance(p)) - this.thickness;
  }
};
var SdfOnion = class {
  constructor(input, thickness, layers = 1) {
    this.input = input;
    this.thickness = thickness;
    this.layers = layers;
  }
  distance(p) {
    let d = this.input.distance(p);
    for (let i = 0; i < this.layers; i++) d = Math.abs(d) - this.thickness;
    return d;
  }
};
var SdfTwist = class {
  constructor(input, anglePerUnit, z1 = -1, z2 = 1) {
    this.input = input;
    this.anglePerUnit = anglePerUnit;
    this.z1 = z1;
    this.z2 = z2;
  }
  distance(p) {
    const range = this.z2 - this.z1;
    const t = range < EPSILON2 ? 0 : (p.z - this.z1) / range - 0.5;
    const theta = t * this.anglePerUnit;
    const c = Math.cos(theta), s = Math.sin(theta);
    return this.input.distance(new Vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z));
  }
};
var SdfRevolution = class {
  constructor(input) {
    this.input = input;
  }
  distance(p) {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    return this.input.distance(new Vec3(r, p.y, 0));
  }
};
var SdfExtrude = class {
  constructor(input) {
    this.input = input;
  }
  distance(p) {
    return this.input.distance(new Vec3(p.x, p.y, 0));
  }
};
var SdfBoundedExtrude = class {
  constructor(input, height) {
    this.input = input;
    this.halfHeight = height * 0.5;
  }
  distance(p) {
    const d2d = this.input.distance(new Vec3(p.x, p.y, 0));
    return Math.max(d2d, Math.abs(p.z) - this.halfHeight);
  }
};
var SdfMirror = class {
  constructor(input, planeNormal) {
    this.input = input;
    this.normal = planeNormal.normalize();
  }
  distance(p) {
    const d = p.dot(this.normal);
    const q = d < 0 ? p.sub(this.normal.mul(2 * d)) : p;
    return this.input.distance(q);
  }
};
var SdfRadialArray = class {
  constructor(input, count) {
    this.input = input;
    this.count = count;
    this.deltaAngle = TWO_PI3 / count;
  }
  distance(p) {
    let angle = Math.atan2(p.y, p.x);
    if (angle < 0) angle += TWO_PI3;
    const closest = Math.round(angle / this.deltaAngle) * this.deltaAngle;
    const rot = angle - closest;
    const r = Math.sqrt(p.x * p.x + p.y * p.y);
    return this.input.distance(new Vec3(r * Math.cos(rot), r * Math.sin(rot), p.z));
  }
};
var SdfTransform = class {
  constructor(input, transform) {
    this.input = input;
    this.inverse = transform.invert();
  }
  setTransform(transform) {
    this.inverse = transform.invert();
  }
  distance(p) {
    return this.input.distance(this.inverse.transformPoint(p));
  }
};
var SdfOffset = class {
  constructor(input, amount) {
    this.input = input;
    this.amount = amount;
  }
  distance(p) {
    return this.input.distance(p) - this.amount;
  }
};
var SdfGradient = class {
  constructor(a, b, factor = 1) {
    this.a = a;
    this.b = b;
    this.factor = factor;
  }
  distance(p) {
    return this.a.distance(p) + this.factor * this.b.distance(p);
  }
};
var SdfVoronoi = class {
  constructor(offset = 0) {
    this.offset = offset;
    this.children = [];
  }
  distance(p) {
    let min1 = Infinity, min2 = Infinity;
    for (const c of this.children) {
      const d = c.distance(p);
      if (d < min1) {
        min2 = min1;
        min1 = d;
      } else if (d < min2) {
        min2 = d;
      }
    }
    return this.children.length > 0 ? Math.abs(min1 - min2) - this.offset : 0;
  }
};
var SdfLattice = class {
  constructor(type = "gyroid", scale = 1, offset = 0, shell = false) {
    this.type = type;
    this.scale = scale;
    this.offset = offset;
    this.shell = shell;
  }
  distance(p) {
    const a = p.x / this.scale;
    const b = p.y / this.scale;
    const c = p.z / this.scale;
    const { sin, cos } = Math;
    let value;
    switch (this.type) {
      case "schwarz":
        value = cos(a) + cos(b) + cos(c);
        break;
      case "gyroid":
        value = sin(a) * cos(b) + sin(b) * cos(c) + sin(c) * cos(a);
        break;
      case "diamond":
        value = sin(a) * sin(b) * sin(c) + sin(a) * cos(b) * cos(c) + cos(a) * sin(b) * cos(c) + cos(a) * cos(b) * sin(c);
        break;
      case "lidinoid":
        value = 0.5 * (sin(2 * a) * cos(b) * sin(c) + sin(2 * b) * cos(c) * sin(a) + sin(2 * c) * cos(a) * sin(b)) - 0.5 * (cos(2 * a) * cos(2 * b) + cos(2 * b) * cos(2 * c) + cos(2 * c) * cos(2 * a)) + 0.15;
        break;
      case "neovius":
        value = 3 * cos(a) + cos(b) + cos(c) + 4 * cos(a) * cos(b) * cos(c);
        break;
      case "fischerKoch":
        value = cos(2 * a) * sin(b) * cos(c) + cos(2 * b) * sin(c) * cos(a) + cos(2 * c) * sin(a) * cos(b);
        break;
      case "frd":
        value = 8 * cos(a) * cos(b) * cos(c) + cos(2 * a) * cos(2 * c) * cos(2 * a) - (cos(2 * a) * sin(2 * b) + cos(2 * b) * sin(2 * c) + cos(2 * c) * sin(2 * a));
        break;
      case "doubleDiamond":
        value = sin(2 * a) * sin(2 * b) + sin(2 * b) * sin(2 * c) + sin(2 * a) * sin(2 * c) + cos(2 * a) * cos(2 * b) * cos(2 * c);
        break;
      case "doubleGyroid":
        value = 2.75 * (sin(2 * a) * sin(c) * cos(b) + sin(2 * b) * sin(a) * cos(c) + sin(2 * c) * sin(b) * cos(a)) - (cos(2 * a) * cos(2 * b) + cos(2 * b) * cos(2 * c) + cos(2 * c) * cos(2 * a));
        break;
      case "s":
        value = cos(2 * a) * sin(b) * cos(c) + cos(2 * b) * sin(c) * cos(a) + cos(2 * c) * sin(a) * cos(b) - 0.4;
        break;
      default:
        value = 0;
    }
    return this.shell ? Math.abs(value) - this.offset : value + this.offset;
  }
};
var SdfMicrostructure = class {
  constructor(cellSize = 10, strutRadius = 1, pattern = "bigX") {
    this.cellSize = cellSize;
    this.strutRadius = strutRadius;
    this.pattern = pattern;
    this.struts = generateStruts(pattern, cellSize);
  }
  distance(p) {
    const cs = this.cellSize;
    const hs = cs * 0.5;
    const q = new Vec3(
      Math.abs(Math.abs(p.x) % cs - hs),
      Math.abs(Math.abs(p.y) % cs - hs),
      Math.abs(Math.abs(p.z) % cs - hs)
    );
    let minDist = Infinity;
    for (const { a, b } of this.struts) {
      const d = distToSegment(q, a, b);
      if (d < minDist) minDist = d;
    }
    return minDist - this.strutRadius;
  }
};
function distToSegment(p, a, b) {
  const ab = b.sub(a);
  const abSq = ab.dot(ab);
  if (abSq < EPSILON2) return p.sub(a).len();
  const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
  return p.sub(a.add(ab.mul(t))).len();
}
function generateStruts(pattern, dim) {
  const v1 = 0, v2 = dim * 0.5, v3 = dim * 0.25;
  const p = [
    new Vec3(v1, v1, v1),
    new Vec3(v2, v1, v1),
    new Vec3(v2, v2, v1),
    new Vec3(v1, v2, v1),
    new Vec3(v1, v1, v2),
    new Vec3(v2, v1, v2),
    new Vec3(v2, v2, v2),
    new Vec3(v1, v2, v2),
    new Vec3(v3, v1, v1),
    new Vec3(v2, v3, v1),
    new Vec3(v3, v2, v1),
    new Vec3(v1, v3, v1),
    new Vec3(v1, v1, v3),
    new Vec3(v2, v1, v3),
    new Vec3(v2, v2, v3),
    new Vec3(v1, v2, v3),
    new Vec3(v3, v1, v2),
    new Vec3(v2, v3, v2),
    new Vec3(v3, v2, v2),
    new Vec3(v1, v3, v2)
  ];
  const s = (a, b) => ({ a: p[a], b: p[b] });
  switch (pattern) {
    case "bigX":
      return [s(0, 6)];
    case "grid":
      return [s(2, 6), s(5, 6), s(7, 6)];
    case "star":
      return [s(0, 6), s(2, 6), s(5, 6), s(7, 6)];
    case "cross":
      return [s(1, 6), s(3, 6), s(4, 6)];
    case "octagon":
      return [s(1, 3), s(3, 4), s(4, 1)];
    case "octet":
      return [s(1, 6), s(3, 6), s(4, 6), s(1, 3), s(3, 4), s(4, 1)];
    case "vintile":
      return [s(8, 13), s(13, 17), s(17, 18), s(18, 15), s(15, 11), s(11, 8)];
    case "dual":
      return [s(0, 1), s(0, 3), s(0, 4)];
    case "interlock":
      return [s(2, 6), s(5, 6), s(7, 6), s(0, 1), s(0, 3), s(0, 4)];
    case "isotrop":
      return [s(0, 1), s(2, 1), s(5, 1), s(7, 1), s(7, 3), s(7, 6), s(7, 4)];
    default:
      return [s(0, 6)];
  }
}
var SdfUtils = {
  gradient(sdf, p, epsilon = 1e-3) {
    const dx = sdf.distance(new Vec3(p.x + epsilon, p.y, p.z)) - sdf.distance(new Vec3(p.x - epsilon, p.y, p.z));
    const dy = sdf.distance(new Vec3(p.x, p.y + epsilon, p.z)) - sdf.distance(new Vec3(p.x, p.y - epsilon, p.z));
    const dz = sdf.distance(new Vec3(p.x, p.y, p.z + epsilon)) - sdf.distance(new Vec3(p.x, p.y, p.z - epsilon));
    return new Vec3(dx, dy, dz).normalize();
  },
  rayMarch(sdf, origin, direction, maxDistance = 1e3, tolerance = 1e-3, maxSteps = 256) {
    const dir = direction.normalize();
    let t = 0;
    for (let i = 0; i < maxSteps && t < maxDistance; i++) {
      const p = origin.add(dir.mul(t));
      const d = sdf.distance(p);
      if (d < tolerance) return { hitPoint: p, distance: t };
      t += d;
    }
    return null;
  },
  surfaceNormal(sdf, p, projectionSteps = 3, epsilon = 1e-3) {
    let q = p;
    for (let i = 0; i < projectionSteps; i++) {
      const d = sdf.distance(q);
      const grad2 = SdfUtils.gradient(sdf, q, epsilon);
      q = q.sub(grad2.mul(d));
    }
    return SdfUtils.gradient(sdf, q, epsilon);
  },
  projectToSurface(sdf, p, maxSteps = 16, epsilon = 1e-3) {
    let q = p;
    for (let i = 0; i < maxSteps; i++) {
      const d = sdf.distance(q);
      if (Math.abs(d) < epsilon) break;
      q = q.sub(SdfUtils.gradient(sdf, q, epsilon).mul(d));
    }
    return q;
  },
  estimateCurvature(sdf, p, epsilon = 0.01) {
    const center = sdf.distance(p);
    const laplacian = sdf.distance(new Vec3(p.x + epsilon, p.y, p.z)) + sdf.distance(new Vec3(p.x - epsilon, p.y, p.z)) + sdf.distance(new Vec3(p.x, p.y + epsilon, p.z)) + sdf.distance(new Vec3(p.x, p.y - epsilon, p.z)) + sdf.distance(new Vec3(p.x, p.y, p.z + epsilon)) + sdf.distance(new Vec3(p.x, p.y, p.z - epsilon)) - 6 * center;
    return laplacian / (epsilon * epsilon);
  },
  ambientOcclusion(sdf, surfacePoint, normal, samples = 5, maxDistance = 1) {
    let ao = 0;
    let weight = 1;
    const stepSize = maxDistance / samples;
    for (let i = 1; i <= samples; i++) {
      const expectedDist = i * stepSize;
      const actualDist = sdf.distance(surfacePoint.add(normal.mul(expectedDist)));
      ao += weight * Math.max(0, expectedDist - actualDist);
      weight *= 0.5;
    }
    return HMath.clamp(1 - ao, 0, 1);
  }
};
var SdfOps = {
  translate(sdf, x, y, z) {
    return new SdfTransform(sdf, Mat4.translation(x, y, z));
  },
  rotateX(sdf, radians) {
    return new SdfTransform(sdf, Mat4.rotationX(radians));
  },
  rotateY(sdf, radians) {
    return new SdfTransform(sdf, Mat4.rotationY(radians));
  },
  rotateZ(sdf, radians) {
    return new SdfTransform(sdf, Mat4.rotationZ(radians));
  },
  scale(sdf, factor) {
    return new SdfTransform(sdf, Mat4.scaling(factor, factor, factor));
  },
  union(a, b) {
    return new SdfUnion(a, b);
  },
  intersect(a, b) {
    return new SdfIntersect(a, b);
  },
  subtract(a, b) {
    return new SdfSubtract(a, b);
  },
  blend(a, b, radius = 1) {
    return new SdfBlend(a, b, radius);
  },
  shell(sdf, thickness) {
    return new SdfShell(sdf, thickness);
  },
  round(sdf, radius) {
    return new SdfOffset(sdf, radius);
  },
  mirror(sdf, normal) {
    return new SdfMirror(sdf, normal);
  },
  twist(sdf, anglePerUnit) {
    return new SdfTwist(sdf, anglePerUnit);
  },
  revolve(sdf) {
    return new SdfRevolution(sdf);
  }
};

// src/core/geometry/Capsule2D.ts
var Capsule2D = class _Capsule2D {
  constructor(center, halfLength, radius, angle = 0) {
    this.center = center;
    this.halfLength = halfLength;
    this.radius = radius;
    this.angle = angle;
  }
  /** The two endpoint centers of the internal segment. */
  get endpoints() {
    const dir = Vec2.fromAngle(this.angle).mul(this.halfLength);
    return [this.center.sub(dir), this.center.add(dir)];
  }
  /** Full length including endcaps. */
  get totalLength() {
    return this.halfLength * 2 + this.radius * 2;
  }
  /** Approximate area. */
  get area() {
    return this.halfLength * 2 * this.radius * 2 + Math.PI * this.radius * this.radius;
  }
  /** Approximate mass (proportional to area). */
  get mass() {
    return (this.halfLength * 2 + Math.PI * this.radius) * this.radius * 0.01;
  }
  /** Approximate moment of inertia about center. */
  get inertia() {
    return this.mass * ((this.halfLength * 2) ** 2 + this.radius ** 2) / 6;
  }
  /** Three grab handles: endA, center, endB. */
  get handles() {
    const [a, b] = this.endpoints;
    return [a, this.center, b];
  }
  /** Closest point on the internal segment to a world point. */
  closestSegmentPoint(p) {
    const [a, b] = this.endpoints;
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < 1e-12) return a;
    const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / abSq));
    return a.add(ab.mul(t));
  }
  /** Signed distance from capsule surface to a point. Negative = inside. */
  distToPoint(p) {
    return p.distTo(this.closestSegmentPoint(p)) - this.radius;
  }
  /** Test if a point is inside the capsule. */
  containsPoint(p) {
    return this.distToPoint(p) <= 0;
  }
  /** Hit-test handles first (rotation priority), then body (translate). */
  hitTest(p, handleRadius) {
    const [a, , b] = this.handles;
    const r2 = handleRadius * handleRadius;
    if (p.distSqTo(a) <= r2) return { type: "endA" };
    if (p.distSqTo(b) <= r2) return { type: "endB" };
    if (this.containsPoint(p)) return { type: "center" };
    return null;
  }
  /** Clone with optional overrides. */
  clone() {
    return new _Capsule2D(this.center, this.halfLength, this.radius, this.angle);
  }
};

// src/core/physics/index.ts
var SpringSystem3D = class {
  constructor() {
    this.pos = [];
    this.vel = [];
    this.invMass = new Float32Array(0);
    this.springs = [];
    // Settings
    this.gravity = new Vec3(0, -9.81, 0);
    this.floorPlane = new Plane(new Vec3(0, 1, 0), 10);
    // y = −10, under gravity −Y
    this.globalVelDamping = 0.02;
    this.useGlobalStiffness = true;
    this.globalStiffness = 200;
    this.globalDamping = 2;
    this.stiffnessStrut = 2e3;
    this.stiffnessShear = 1e3;
    this.stiffnessHinge = 500;
    this.maxForce = 1e5;
  }
  // ── Init from mesh ──
  initFromMesh(mesh, trussThickness = 0, useHinges = true) {
    const useTruss = Math.abs(trussThickness) > 1e-3;
    const nodes = mesh.nodesArray();
    const layer1Count = nodes.length;
    const totalCount = useTruss ? layer1Count * 2 : layer1Count;
    const idToIdx = /* @__PURE__ */ new Map();
    for (let i = 0; i < nodes.length; i++) {
      idToIdx.set(nodes[i].id, i);
    }
    this.pos = new Array(totalCount);
    this.vel = new Array(totalCount);
    this.invMass = new Float32Array(totalCount);
    this.springs = [];
    for (let i = 0; i < layer1Count; i++) {
      this.pos[i] = nodes[i].position;
      this.vel[i] = Vec3.zero();
      this.invMass[i] = 1;
    }
    if (useTruss) {
      const normals = this.computeSmoothNormals(mesh, nodes, idToIdx);
      for (let i = 0; i < layer1Count; i++) {
        const ghostIdx = i + layer1Count;
        this.pos[ghostIdx] = this.pos[i].sub(normals[i].mul(trussThickness));
        this.vel[ghostIdx] = Vec3.zero();
        this.invMass[ghostIdx] = 1;
        this.addSpring(i, ghostIdx, this.stiffnessStrut);
      }
    }
    for (const edge of mesh.edges()) {
      const u = idToIdx.get(edge.nodes[0]);
      const v = idToIdx.get(edge.nodes[1]);
      this.addSpring(u, v, this.stiffnessStrut);
      if (useTruss) {
        const u2 = u + layer1Count;
        const v2 = v + layer1Count;
        this.addSpring(u2, v2, this.stiffnessStrut);
        this.addSpring(u, v2, this.stiffnessShear);
        this.addSpring(v, u2, this.stiffnessShear);
      }
    }
    for (const face of mesh.faces()) {
      if (face.nodes.length === 4) {
        const [a, b, c, d] = face.nodes.map((n) => idToIdx.get(n));
        this.addSpring(a, c, this.stiffnessShear);
        this.addSpring(b, d, this.stiffnessShear);
        if (useTruss) {
          this.addSpring(a + layer1Count, c + layer1Count, this.stiffnessShear);
          this.addSpring(b + layer1Count, d + layer1Count, this.stiffnessShear);
        }
      }
    }
    if (useHinges) this.addBendingSprings(mesh, idToIdx);
  }
  computeSmoothNormals(mesh, nodes, idToIdx) {
    const normals = new Array(nodes.length).fill(Vec3.zero());
    for (const face of mesh.faces()) {
      if (face.nodes.length < 3) continue;
      const pA = mesh.node(face.nodes[0]).position;
      const pB = mesh.node(face.nodes[1]).position;
      const pC = mesh.node(face.nodes[2]).position;
      const n = pB.sub(pA).cross(pC.sub(pA)).normalize();
      for (const nid of face.nodes) {
        const idx = idToIdx.get(nid);
        normals[idx] = normals[idx].add(n);
      }
    }
    for (let i = 0; i < normals.length; i++) {
      normals[i] = normals[i].lenSq() > 0 ? normals[i].normalize() : new Vec3(0, 0, 1);
    }
    return normals;
  }
  addBendingSprings(mesh, idToIdx) {
    for (const edge of mesh.edges()) {
      if (edge.faces.length < 2) continue;
      const fA = mesh.face(edge.faces[0]);
      const fB = mesh.face(edge.faces[1]);
      if (!fA || !fB) continue;
      const wingA = this.getOppositeVertex(fA.nodes, edge.nodes[0], edge.nodes[1]);
      const wingB = this.getOppositeVertex(fB.nodes, edge.nodes[0], edge.nodes[1]);
      if (wingA !== -1 && wingB !== -1) {
        this.addSpring(idToIdx.get(wingA), idToIdx.get(wingB), this.stiffnessHinge);
      }
    }
  }
  getOppositeVertex(faceNodes, v1, v2) {
    for (const n of faceNodes) {
      if (n !== v1 && n !== v2) return n;
    }
    return -1;
  }
  // ── Spring management ──
  addSpring(i, j, k = 200) {
    if (i < 0 || i >= this.pos.length || j < 0 || j >= this.pos.length) return;
    const restLength = this.pos[i].sub(this.pos[j]).len();
    this.springs.push({ i, j, restLength, k });
  }
  // ── Pin/unpin vertices ──
  pin(index) {
    this.invMass[index] = 0;
  }
  unpin(index) {
    this.invMass[index] = 1;
  }
  // ── Simulation step ──
  step(dt, substeps = 8) {
    if (substeps < 1) substeps = 1;
    const h = dt / substeps;
    const count = this.pos.length;
    const force = new Array(count);
    for (let s = 0; s < substeps; s++) {
      for (let i = 0; i < count; i++) force[i] = Vec3.zero();
      for (let i = 0; i < count; i++) {
        if (this.invMass[i] > 0)
          force[i] = force[i].add(this.gravity.mul(1 / this.invMass[i]));
      }
      for (const sp of this.springs) {
        const d = this.pos[sp.j].sub(this.pos[sp.i]);
        const len = d.len();
        if (isNaN(len) || len < 1e-8) continue;
        const n = d.mul(1 / len);
        const stretch = len - sp.restLength;
        const currentK = this.useGlobalStiffness ? this.globalStiffness : sp.k;
        const fs = currentK * stretch;
        const vRel = this.vel[sp.j].sub(this.vel[sp.i]).dot(n);
        const fd = this.globalDamping * vRel;
        let f2 = n.mul(fs + fd);
        const magSq = f2.dot(f2);
        if (magSq > this.maxForce * this.maxForce)
          f2 = f2.normalize().mul(this.maxForce);
        force[sp.i] = force[sp.i].add(f2);
        force[sp.j] = force[sp.j].sub(f2);
      }
      for (let i = 0; i < count; i++) {
        if (this.invMass[i] === 0) continue;
        const accel = force[i].mul(this.invMass[i]);
        this.vel[i] = this.vel[i].add(accel.mul(h));
        this.vel[i] = this.vel[i].mul(1 - this.globalVelDamping);
        this.pos[i] = this.pos[i].add(this.vel[i].mul(h));
        if (isNaN(this.pos[i].x) || isNaN(this.pos[i].y) || isNaN(this.pos[i].z)) {
          this.pos[i] = Vec3.zero();
          this.vel[i] = Vec3.zero();
        }
        const dist = this.floorPlane.distToPoint(this.pos[i]);
        if (dist < 0) {
          this.pos[i] = this.pos[i].sub(this.floorPlane.normal.mul(dist));
          const vNormal = this.vel[i].dot(this.floorPlane.normal);
          if (vNormal < 0)
            this.vel[i] = this.vel[i].sub(this.floorPlane.normal.mul(vNormal * 1.3));
        }
      }
    }
  }
  // ── Update mesh from simulation ──
  updateMesh(mesh) {
    const nodes = mesh.nodesArray();
    if (this.pos.length < nodes.length) return;
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].position = this.pos[i];
    }
    mesh.computeVertexNormals();
  }
};

// src/core/physics/RigidBody2D.ts
var DEFAULTS = {
  damping: 0.984,
  angularDamping: 0.975,
  wallRestitution: -0.4
};
var RigidBody2D = class {
  constructor(shape, config) {
    // Velocities
    this.vx = 0;
    this.vy = 0;
    this.va = 0;
    this.shape = shape;
    this.mass = shape.mass;
    this.inertia = shape.inertia;
    this.cfg = { ...DEFAULTS, ...config };
  }
  // ── Convenience accessors ──
  get x() {
    return this.shape.center.x;
  }
  set x(v) {
    this.shape.center = new Vec2(v, this.shape.center.y);
  }
  get y() {
    return this.shape.center.y;
  }
  set y(v) {
    this.shape.center = new Vec2(this.shape.center.x, v);
  }
  get angle() {
    return this.shape.angle;
  }
  set angle(v) {
    this.shape.angle = v;
  }
  get position() {
    return this.shape.center;
  }
  set position(v) {
    this.shape.center = v;
  }
  // ── Physics ──
  /**
   * Apply a force at a world-space point.
   * Generates both linear acceleration and torque.
   */
  applyForceAt(fx, fy, px, py) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
    const rx = px - this.x;
    const ry = py - this.y;
    this.va += (rx * fy - ry * fx) / this.inertia;
  }
  /** Apply a central force (no torque). */
  applyForce(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }
  /** Integrate velocities → positions with damping. */
  integrate(gravity = 0) {
    this.vy += gravity;
    this.vx *= this.cfg.damping;
    this.vy *= this.cfg.damping;
    this.va *= this.cfg.angularDamping;
    this.shape.center = new Vec2(this.x + this.vx, this.y + this.vy);
    this.shape.angle += this.va;
  }
  /** Constrain capsule inside a rectangular box. Produces angular impulse on wall hits. */
  constrainToBox(bx, by, bw, bh) {
    const [a, b] = this.shape.endpoints;
    const r = this.shape.radius;
    const rest = this.cfg.wallRestitution;
    for (const p of [a, b]) {
      if (p.x - r < bx) {
        const pen = bx - (p.x - r);
        this.x += pen;
        if (this.vx < 0) this.vx *= rest;
        this.va += (p.y - this.y) * pen * 0.01 / this.inertia;
      }
      if (p.x + r > bx + bw) {
        const pen = p.x + r - (bx + bw);
        this.x -= pen;
        if (this.vx > 0) this.vx *= rest;
        this.va -= (p.y - this.y) * pen * 0.01 / this.inertia;
      }
      if (p.y - r < by) {
        const pen = by - (p.y - r);
        this.y += pen;
        if (this.vy < 0) this.vy *= rest;
        this.va -= (p.x - this.x) * pen * 0.01 / this.inertia;
      }
      if (p.y + r > by + bh) {
        const pen = p.y + r - (by + bh);
        this.y -= pen;
        if (this.vy > 0) this.vy *= rest;
        this.va += (p.x - this.x) * pen * 0.01 / this.inertia;
      }
    }
  }
  /** Kill all velocities. */
  stop() {
    this.vx = 0;
    this.vy = 0;
    this.va = 0;
  }
};
var Spring2D = class {
  constructor(a, b, restLength, config) {
    /** Cached surface attachment points (for rendering). */
    this.surfA = null;
    this.surfB = null;
    /** Current stretch beyond rest length. */
    this.stretch = 0;
    this.bodyA = a;
    this.bodyB = b;
    this.restLength = restLength;
    this.stiffness = config?.stiffness ?? 0.35;
    this.damping = config?.damping ?? 0.055;
  }
  /** Compute and apply spring + damping forces for one timestep. */
  apply() {
    const [a0, a1] = this.bodyA.shape.endpoints;
    const [b0, b1] = this.bodyB.shape.endpoints;
    const { pA, pB } = segSegClosest2D(a0, a1, b0, b1);
    const d = pB.sub(pA);
    const dist = d.len() || 1e-6;
    const n = d.div(dist);
    const surfDist = dist - this.bodyA.shape.radius - this.bodyB.shape.radius;
    const stretch = surfDist - this.restLength;
    const dvx = this.bodyB.vx - this.bodyA.vx;
    const dvy = this.bodyB.vy - this.bodyA.vy;
    const dampF = (dvx * n.x + dvy * n.y) * this.damping;
    const force = stretch * this.stiffness + dampF;
    const fx = n.x * force;
    const fy = n.y * force;
    this.bodyA.applyForceAt(fx, fy, pA.x, pA.y);
    this.bodyB.applyForceAt(-fx, -fy, pB.x, pB.y);
    this.surfA = pA.add(n.mul(this.bodyA.shape.radius));
    this.surfB = pB.sub(n.mul(this.bodyB.shape.radius));
    this.stretch = stretch;
  }
};
function repelBodies(a, b, stiffness = 1.2) {
  const [a0, a1] = a.shape.endpoints;
  const [b0, b1] = b.shape.endpoints;
  const { pA, pB } = segSegClosest2D(a0, a1, b0, b1);
  const d = pB.sub(pA);
  const dist = d.len() || 1e-6;
  const minDist = a.shape.radius + b.shape.radius + 2;
  if (dist < minDist) {
    const pen = minDist - dist;
    const n = d.div(dist);
    const f2 = pen * stiffness;
    a.applyForceAt(-n.x * f2, -n.y * f2, pA.x, pA.y);
    b.applyForceAt(n.x * f2, n.y * f2, pB.x, pB.y);
  }
}
function segSegClosest2D(a0, a1, b0, b1) {
  const da = a1.sub(a0);
  const db = b1.sub(b0);
  const r0 = a0.sub(b0);
  const aa = da.dot(da);
  const ee = db.dot(db);
  const ff = db.dot(r0);
  let s, t;
  if (aa < 1e-8 && ee < 1e-8) {
    s = 0;
    t = 0;
  } else if (aa < 1e-8) {
    s = 0;
    t = clamp01(ff / ee);
  } else {
    const cc = da.dot(r0);
    if (ee < 1e-8) {
      t = 0;
      s = clamp01(-cc / aa);
    } else {
      const bb = da.dot(db);
      const denom = aa * ee - bb * bb;
      s = denom !== 0 ? clamp01((bb * ff - cc * ee) / denom) : 0;
      t = (bb * s + ff) / ee;
      if (t < 0) {
        t = 0;
        s = clamp01(-cc / aa);
      } else if (t > 1) {
        t = 1;
        s = clamp01((bb - cc) / aa);
      }
    }
  }
  return {
    pA: a0.add(da.mul(s)),
    pB: b0.add(db.mul(t))
  };
}
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// src/io/index.ts
function emptyMeshData() {
  return { positions: [], normals: [], uvs: [], faces: [], groups: [] };
}
var ObjFile = {
  /** Parses an OBJ string into MeshData. Handles v/vt/vn/f lines. */
  parse(source) {
    const result = emptyMeshData();
    const rawPositions = [];
    const rawUVs = [];
    const rawNormals = [];
    const indexCache = /* @__PURE__ */ new Map();
    let activeGroup = null;
    let activeGroupFaceStart = 0;
    const flushGroup = () => {
      if (activeGroup === null) return;
      const count = result.faces.length - activeGroupFaceStart;
      if (count > 0) {
        result.groups.push({
          name: activeGroup,
          faceStart: activeGroupFaceStart,
          faceCount: count
        });
      }
    };
    for (const line of source.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed[0] === "#") continue;
      const parts = trimmed.split(/\s+/);
      const type = parts[0];
      if (type === "g" && parts.length >= 2) {
        flushGroup();
        activeGroup = parts.slice(1).join(" ");
        activeGroupFaceStart = result.faces.length;
        continue;
      }
      if (type === "v" && parts.length >= 4) {
        rawPositions.push(new Vec3(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ));
      } else if (type === "vt" && parts.length >= 3) {
        rawUVs.push(new Vec2(
          parseFloat(parts[1]),
          parseFloat(parts[2])
        ));
      } else if (type === "vn" && parts.length >= 4) {
        rawNormals.push(new Vec3(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ));
      } else if (type === "f" && parts.length >= 4) {
        const faceIndices = [];
        for (let i = 1; i < parts.length; i++) {
          const block = parts[i];
          const key = block;
          let finalIndex = indexCache.get(key);
          if (finalIndex === void 0) {
            const { p, t, n } = parseObjIndex(block, rawPositions.length, rawUVs.length, rawNormals.length);
            result.positions.push(rawPositions[p]);
            if (t >= 0) result.uvs.push(rawUVs[t]);
            else if (result.uvs.length > 0) result.uvs.push(Vec2.zero());
            if (n >= 0) result.normals.push(rawNormals[n]);
            else if (result.normals.length > 0) result.normals.push(new Vec3(0, 1, 0));
            finalIndex = result.positions.length - 1;
            indexCache.set(key, finalIndex);
          }
          faceIndices.push(finalIndex);
        }
        result.faces.push(faceIndices);
      }
    }
    flushGroup();
    if (result.groups.length === 0) result.groups = void 0;
    return result;
  },
  /** Serializes MeshData to an OBJ format string. */
  serialize(data) {
    const lines = [];
    lines.push("# Exported by Tekto");
    lines.push(`# Vertices: ${data.positions.length}`);
    lines.push(`# Faces: ${data.faces.length}`);
    for (const v of data.positions)
      lines.push(`v ${f(v.x)} ${f(v.y)} ${f(v.z)}`);
    for (const vt of data.uvs)
      lines.push(`vt ${f(vt.x)} ${f(vt.y)}`);
    for (const vn of data.normals)
      lines.push(`vn ${f(vn.x)} ${f(vn.y)} ${f(vn.z)}`);
    const hasUV = data.uvs.length > 0;
    const hasNorm = data.normals.length > 0;
    for (const face of data.faces) {
      let line = "f";
      for (const idx of face) {
        const val = idx + 1;
        if (hasUV && hasNorm) line += ` ${val}/${val}/${val}`;
        else if (hasUV) line += ` ${val}/${val}`;
        else if (hasNorm) line += ` ${val}//${val}`;
        else line += ` ${val}`;
      }
      lines.push(line);
    }
    return lines.join("\n") + "\n";
  }
};
function f(v) {
  return v.toFixed(6).replace(/\.?0+$/, "");
}
function parseObjIndex(block, pCount, tCount, nCount) {
  const bits = block.split("/");
  let p = parseInt(bits[0], 10);
  let t = -1;
  let n = -1;
  if (bits.length > 1 && bits[1] !== "") t = parseInt(bits[1], 10);
  if (bits.length > 2 && bits[2] !== "") n = parseInt(bits[2], 10);
  if (p < 0) p = pCount + p;
  else p--;
  if (t < 0) t = tCount + t;
  else if (t > 0) t--;
  if (n < 0) n = nCount + n;
  else if (n > 0) n--;
  return { p, t, n };
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
function writeDxf3D(content) {
  const polylines = content.polylines ?? [];
  const lineSegs = content.lines ?? [];
  const points = content.points ?? [];
  const arcs = content.arcs ?? [];
  const circles = content.circles ?? [];
  const lines = [];
  const okR = (r) => Number.isFinite(r) && r > 1e-9;
  const finite = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
  const bad = (what, i, layer) => {
    throw new Error(`writeDxf3D: ${what} ${i} (layer "${layer}") has a non-finite coordinate`);
  };
  polylines.forEach((p, i) => {
    if (!p.points.every(finite)) bad("polyline", i, p.layer);
  });
  lineSegs.forEach((l, i) => {
    if (!finite(l.start) || !finite(l.end)) bad("line", i, l.layer);
  });
  points.forEach((pt, i) => {
    if (!finite(pt.position)) bad("point", i, pt.layer);
  });
  arcs.forEach((a, i) => {
    if (okR(a.radius) && (!finite(a.center) || !Number.isFinite(a.startDeg) || !Number.isFinite(a.endDeg))) bad("arc", i, a.layer);
  });
  circles.forEach((c, i) => {
    if (okR(c.radius) && !finite(c.center)) bad("circle", i, c.layer);
  });
  const used = /* @__PURE__ */ new Set();
  for (const p of polylines) if (p.points.length >= 2) used.add(p.layer);
  for (const s of lineSegs) used.add(s.layer);
  for (const a of arcs) if (okR(a.radius)) used.add(a.layer);
  for (const c of circles) if (okR(c.radius)) used.add(c.layer);
  for (const pt of points) used.add(pt.layer);
  const { names, colorOf } = _resolveLayers(content.layers ?? [], used);
  _writeR12Prologue(lines, names, colorOf, 1);
  const emitCircle = (layer, c, r) => lines.push("0", "CIRCLE", "8", _sanLayer(layer), "10", _real(c.x), "20", _real(c.y), "30", _real(c.z), "40", _real(r));
  lines.push("0", "SECTION", "2", "ENTITIES");
  for (const poly of polylines) {
    if (poly.points.length < 2) continue;
    const layer = _sanLayer(poly.layer);
    lines.push("0", "POLYLINE", "8", layer, "66", "1", "70", poly.closed ? "9" : "8");
    lines.push("10", "0", "20", "0", "30", "0");
    for (const p of poly.points) {
      lines.push("0", "VERTEX", "8", layer, "10", _real(p.x), "20", _real(p.y), "30", _real(p.z), "70", "32");
    }
    lines.push("0", "SEQEND", "8", layer);
  }
  for (const s of lineSegs) {
    lines.push(
      "0",
      "LINE",
      "8",
      _sanLayer(s.layer),
      "10",
      _real(s.start.x),
      "20",
      _real(s.start.y),
      "30",
      _real(s.start.z),
      "11",
      _real(s.end.x),
      "21",
      _real(s.end.y),
      "31",
      _real(s.end.z)
    );
  }
  for (const c of circles) if (okR(c.radius)) emitCircle(c.layer, c.center, c.radius);
  for (const a of arcs) {
    if (!okR(a.radius)) continue;
    if (Math.abs(a.endDeg - a.startDeg) >= 360 - 1e-6) {
      emitCircle(a.layer, a.center, a.radius);
      continue;
    }
    const norm = (d) => {
      let x = d % 360;
      if (x < 0) x += 360;
      return x;
    };
    lines.push(
      "0",
      "ARC",
      "8",
      _sanLayer(a.layer),
      "10",
      _real(a.center.x),
      "20",
      _real(a.center.y),
      "30",
      _real(a.center.z),
      "40",
      _real(a.radius),
      "50",
      _real(norm(a.startDeg)),
      "51",
      _real(norm(a.endDeg))
    );
  }
  for (const pt of points) {
    lines.push("0", "POINT", "8", _sanLayer(pt.layer), "10", _real(pt.position.x), "20", _real(pt.position.y), "30", _real(pt.position.z));
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\r\n") + "\r\n";
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

// src/io/download.ts
function stampName(fileName, date = /* @__PURE__ */ new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? `${fileName.slice(0, dot)}-${stamp}${fileName.slice(dot)}` : `${fileName}-${stamp}`;
}

// src/io/IfcFile.ts
var IfcFile = {
  /**
   * Parse an IFC file (as ArrayBuffer) into a single fused FlatMeshData.
   * All elements are merged; no per-element groups are produced.
   */
  async parse(buffer, options = {}) {
    const wasmPath = options.wasmPath ?? "/";
    const recenter = options.recenter ?? true;
    const log = options.onProgress ?? (() => {
    });
    const { IfcAPI } = await import("web-ifc");
    const api = new IfcAPI();
    api.SetWasmPath(wasmPath);
    await api.Init();
    const t0 = performance.now();
    const modelID = api.OpenModel(new Uint8Array(buffer));
    if (modelID < 0) {
      throw new Error("IfcFile.parse: failed to open IFC model");
    }
    log(`opened in ${(performance.now() - t0).toFixed(0)}ms`);
    const positions = [];
    const normals = [];
    const indices = [];
    const t1 = performance.now();
    let meshCount = 0;
    api.StreamAllMeshes(modelID, (flatMesh) => {
      const placedGeoms = flatMesh.geometries;
      const n = placedGeoms.size();
      for (let i = 0; i < n; i++) {
        const placed = placedGeoms.get(i);
        const geom = api.GetGeometry(modelID, placed.geometryExpressID);
        const verts = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
        const idxs = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());
        const m = placed.flatTransformation;
        const baseVertex = positions.length / 3;
        for (let v = 0; v < verts.length; v += 6) {
          const x = verts[v], y = verts[v + 1], z = verts[v + 2];
          const nx = verts[v + 3], ny = verts[v + 4], nz = verts[v + 5];
          positions.push(
            m[0] * x + m[4] * y + m[8] * z + m[12],
            m[1] * x + m[5] * y + m[9] * z + m[13],
            m[2] * x + m[6] * y + m[10] * z + m[14]
          );
          normals.push(
            m[0] * nx + m[4] * ny + m[8] * nz,
            m[1] * nx + m[5] * ny + m[9] * nz,
            m[2] * nx + m[6] * ny + m[10] * nz
          );
        }
        for (let k = 0; k < idxs.length; k++) {
          indices.push(idxs[k] + baseVertex);
        }
        geom.delete();
      }
      meshCount++;
    });
    log(`streamed ${meshCount} meshes in ${(performance.now() - t1).toFixed(0)}ms`);
    log(`vertices: ${positions.length / 3}, triangles: ${indices.length / 3}`);
    api.CloseModel(modelID);
    if (recenter && positions.length > 0) {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] -= cx;
        positions[i + 1] -= cy;
        positions[i + 2] -= cz;
      }
      log(`recentered: bbox center was (${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)})`);
    }
    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 1e-9) {
        normals[i] = nx / len;
        normals[i + 1] = ny / len;
        normals[i + 2] = nz / len;
      }
    }
    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      indices: new Uint32Array(indices)
    };
  }
};

// src/io/IfcModel.ts
var WEBIFC_IFCPROJECT = 103090709;
var REL_TYPES = {
  voids: 1401173127,
  // IfcRelVoidsElement: an opening carved into a wall
  fills: 3940055652,
  // IfcRelFillsElement: a window or door filling one
  connectsPath: 3945020480,
  // IfcRelConnectsPathElements: wall meets wall
  connects: 1204542856,
  // IfcRelConnectsElements: the general supertype
  definesByType: 781010003,
  // IfcRelDefinesByType: occurrence to its type
  aggregates: 160246688
  // IfcRelAggregates: a whole and its parts
};
function refs(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => typeof v === "number" ? v : v?.value).filter(
    (v) => typeof v === "number"
  );
}
async function readRelations(api, modelID, log) {
  const out = /* @__PURE__ */ new Map();
  const of = (id) => {
    let r = out.get(id);
    if (!r) out.set(id, r = {});
    return r;
  };
  const lines = (type) => {
    const found = [];
    try {
      const ids = api.GetLineIDsWithType(modelID, type);
      for (let i = 0; i < ids.size(); i++) {
        try {
          found.push(api.GetLine(modelID, ids.get(i)));
        } catch {
        }
      }
    } catch {
    }
    return found;
  };
  const openingOf = /* @__PURE__ */ new Map();
  for (const rel of lines(REL_TYPES.voids)) {
    const host = refs(rel?.RelatingBuildingElement)[0];
    for (const opening of refs(rel?.RelatedOpeningElement)) {
      if (host !== void 0) openingOf.set(opening, host);
    }
  }
  let filled = 0;
  for (const rel of lines(REL_TYPES.fills)) {
    const opening = refs(rel?.RelatingOpeningElement)[0];
    const host = opening === void 0 ? void 0 : openingOf.get(opening);
    if (host === void 0) continue;
    for (const filler of refs(rel?.RelatedBuildingElement)) {
      of(host).hosts = [...of(host).hosts ?? [], filler];
      of(filler).hostedBy = host;
      filled++;
    }
  }
  let connected = 0;
  for (const [type, name] of [
    [REL_TYPES.connectsPath, "IfcRelConnectsPathElements"],
    [REL_TYPES.connects, "IfcRelConnectsElements"]
  ]) {
    for (const rel of lines(type)) {
      const a = refs(rel?.RelatingElement)[0], b = refs(rel?.RelatedElement)[0];
      if (a === void 0 || b === void 0 || a === b) continue;
      const description = (rel?.Name?.value ?? rel?.Description?.value) || void 0;
      for (const [from, to] of [[a, b], [b, a]]) {
        const r = of(from);
        r.connectedTo = [...r.connectedTo ?? [], { to, relation: name, description }];
      }
      connected++;
    }
  }
  let typed = 0;
  for (const rel of lines(REL_TYPES.definesByType)) {
    const typeId = refs(rel?.RelatingType)[0];
    if (typeId === void 0) continue;
    let typeName;
    try {
      typeName = readValue(api.GetLine(modelID, typeId)?.Name);
    } catch {
    }
    for (const occurrence of refs(rel?.RelatedObjects)) {
      Object.assign(of(occurrence), { typeId, typeName });
      typed++;
    }
  }
  for (const rel of lines(REL_TYPES.aggregates)) {
    const whole = refs(rel?.RelatingObject)[0];
    if (whole === void 0) continue;
    const parts = refs(rel?.RelatedObjects);
    if (!parts.length) continue;
    of(whole).parts = [...of(whole).parts ?? [], ...parts];
    for (const p of parts) of(p).partOf = whole;
  }
  log(`relations: ${filled} openings filled, ${connected} connections, ${typed} typed`);
  return out;
}
function titleCase(name) {
  if (!name) return name;
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
function readValue(v) {
  if (v === null || v === void 0) return void 0;
  if (typeof v !== "object") return v;
  if ("value" in v) return v.value;
  return void 0;
}
function flattenSet(set) {
  const out = {};
  const entries = set?.HasProperties ?? set?.Quantities ?? [];
  for (const p of entries) {
    const name = readValue(p?.Name);
    if (typeof name !== "string") continue;
    const value = readValue(p?.NominalValue) ?? readValue(p?.LengthValue) ?? readValue(p?.AreaValue) ?? readValue(p?.VolumeValue) ?? readValue(p?.CountValue) ?? readValue(p?.WeightValue) ?? readValue(p?.TimeValue);
    if (value !== void 0) out[name] = value;
  }
  return out;
}
var IfcModel = {
  /**
   * Parse an IFC file into its elements, each with geometry and properties.
   */
  async parse(buffer, options = {}) {
    const wasmPath = options.wasmPath ?? "/";
    const recenter = options.recenter ?? true;
    const wantProps = options.properties ?? true;
    const wantTree = options.tree ?? true;
    const wantRelations = options.relations ?? true;
    const log = options.onProgress ?? (() => {
    });
    const { IfcAPI } = await import("web-ifc");
    const api = new IfcAPI();
    api.SetWasmPath(wasmPath);
    await api.Init();
    const modelID = api.OpenModel(new Uint8Array(buffer));
    if (modelID < 0) throw new Error("IfcModel.parse: failed to open IFC model");
    const raw = [];
    const t0 = performance.now();
    api.StreamAllMeshes(modelID, (flatMesh) => {
      const positions = [];
      const normals = [];
      const indices = [];
      const geoms = flatMesh.geometries;
      for (let i = 0; i < geoms.size(); i++) {
        const placed = geoms.get(i);
        const geom = api.GetGeometry(modelID, placed.geometryExpressID);
        const verts = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
        const idxs = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());
        const m = placed.flatTransformation;
        const base = positions.length / 3;
        for (let v = 0; v < verts.length; v += 6) {
          const x = verts[v], y = verts[v + 1], z = verts[v + 2];
          const nx = verts[v + 3], ny = verts[v + 4], nz = verts[v + 5];
          positions.push(
            m[0] * x + m[4] * y + m[8] * z + m[12],
            m[1] * x + m[5] * y + m[9] * z + m[13],
            m[2] * x + m[6] * y + m[10] * z + m[14]
          );
          normals.push(
            m[0] * nx + m[4] * ny + m[8] * nz,
            m[1] * nx + m[5] * ny + m[9] * nz,
            m[2] * nx + m[6] * ny + m[10] * nz
          );
        }
        for (let k = 0; k < idxs.length; k++) indices.push(idxs[k] + base);
        geom.delete();
      }
      if (positions.length) raw.push({ expressID: flatMesh.expressID, positions, normals, indices });
    });
    log(`streamed ${raw.length} elements in ${(performance.now() - t0).toFixed(0)}ms`);
    let cx = 0, cy = 0, cz = 0;
    if (recenter && raw.length) {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (const e of raw) {
        for (let i = 0; i < e.positions.length; i += 3) {
          const x = e.positions[i], y = e.positions[i + 1], z = e.positions[i + 2];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
      }
      cx = (minX + maxX) / 2;
      cy = (minY + maxY) / 2;
      cz = (minZ + maxZ) / 2;
    }
    const relations = wantRelations ? await readRelations(api, modelID, log) : /* @__PURE__ */ new Map();
    const elements = [];
    for (const e of raw) {
      let ifcClass = "IfcProduct";
      let name;
      let globalId;
      try {
        const typeCode = api.GetLineType(modelID, e.expressID);
        ifcClass = titleCase(api.GetNameFromTypeCode(typeCode)) || ifcClass;
        if (ifcClass.toLowerCase().startsWith("ifc")) {
          ifcClass = "Ifc" + ifcClass.slice(3, 4).toUpperCase() + ifcClass.slice(4);
        }
        const line = api.GetLine(modelID, e.expressID);
        name = readValue(line?.Name);
        globalId = readValue(line?.GlobalId);
      } catch {
      }
      const properties = {};
      const psets = {};
      if (wantProps) {
        const both = [];
        for (const includeType of [true, false]) {
          try {
            both.push(await api.properties.getPropertySets(
              modelID,
              e.expressID,
              true,
              includeType
            ) ?? []);
          } catch (err) {
            log(`${includeType ? "type" : "instance"} properties unavailable for #${e.expressID}: ${err.message}`);
          }
        }
        for (const set of both.flat()) {
          const setName = readValue(set?.Name) || `set_${set?.expressID}`;
          const flat = flattenSet(set);
          if (!Object.keys(flat).length) continue;
          psets[setName] = { ...psets[setName], ...flat };
          Object.assign(properties, flat);
        }
      }
      if (recenter) {
        for (let i = 0; i < e.positions.length; i += 3) {
          e.positions[i] -= cx;
          e.positions[i + 1] -= cy;
          e.positions[i + 2] -= cz;
        }
      }
      elements.push({
        expressID: e.expressID,
        ifcClass,
        name,
        globalId,
        mesh: {
          positions: new Float32Array(e.positions),
          normals: new Float32Array(e.normals),
          indices: new Uint32Array(e.indices)
        },
        properties,
        psets,
        ...relations.has(e.expressID) ? { relations: relations.get(e.expressID) } : {}
      });
    }
    let lengthScale = 1;
    try {
      const projects = api.GetLineIDsWithType(modelID, WEBIFC_IFCPROJECT);
      if (projects.size()) {
        const project = api.GetLine(modelID, projects.get(0), true);
        const units = project?.UnitsInContext?.Units ?? [];
        for (const u of units) {
          if (u?.UnitType?.value !== "LENGTHUNIT") continue;
          if (u?.Name?.value === "METRE") {
            const prefix = u?.Prefix?.value;
            lengthScale = prefix === "MILLI" ? 1e-3 : prefix === "CENTI" ? 0.01 : prefix === "DECI" ? 0.1 : prefix === "KILO" ? 1e3 : 1;
          } else if (u?.ConversionFactor) {
            const f2 = readValue(u.ConversionFactor?.ValueComponent);
            if (typeof f2 === "number") lengthScale = f2;
          }
          break;
        }
      }
    } catch {
    }
    log(`length unit: ${lengthScale} m per unit`);
    let tree;
    if (wantTree) {
      try {
        const walk = (n) => ({
          expressID: n.expressID,
          ifcClass: titleCase(n.type ?? ""),
          name: readValue(n.Name),
          children: (n.children ?? []).map(walk)
        });
        tree = walk(await api.properties.getSpatialStructure(modelID, true));
      } catch {
      }
    }
    api.CloseModel(modelID);
    log(`parsed ${elements.length} elements`);
    return { elements, tree, center: [cx, cy, cz], lengthScale };
  }
};

// src/io/IfcWriter.ts
var IfcWriter = class {
  constructor(opts = {}) {
    this.entities = [];
    this.nextId = 1;
    // Bootstrap refs.
    this.ownerHistoryRef = 0;
    this.contextRef = 0;
    this.projectRef = 0;
    this.siteRef = 0;
    this.buildingRef = 0;
    this.buildingPlacementRef = 0;
    this.storeyRef = 0;
    // default storey ref (the one bootstrapped from `IfcWriterOptions`)
    this.storeyPlacementRef = 0;
    // its local placement
    this.originPointRef = 0;
    this.dirXRef = 0;
    this.dirZRef = 0;
    this.worldPlacementRef = 0;
    this.rootPlacementRef = 0;
    // Multi-storey tracking — every storey created via `addStorey` (plus
    // the default one) has its placement ref and its list of contained
    // elements, emitted as one `IfcRelContainedInSpatialStructure` per
    // storey at save time.
    this.storeyPlacementByRef = /* @__PURE__ */ new Map();
    // storeyRef → placementRef
    this.storeyElevationByRef = /* @__PURE__ */ new Map();
    // storeyRef → elevation
    this.elementsByStorey = /* @__PURE__ */ new Map();
    // storeyRef → contained element refs
    this.partRefs = /* @__PURE__ */ new Set();
    // what addRoof may gather: addSlab / addMember results
    // Tracking.
    this.wallRefs = [];
    this.wallByObject = /* @__PURE__ */ new Map();
    this.slabRefs = [];
    this.slabTypeRefs = /* @__PURE__ */ new Map();
    this.slabDefinesByTypeBatches = /* @__PURE__ */ new Map();
    this.placementByWall = /* @__PURE__ */ new Map();
    // wall → its local placement ref
    this.wallTypeRefs = /* @__PURE__ */ new Map();
    this.materialLayerSetRefs = /* @__PURE__ */ new Map();
    this.materialRefs = /* @__PURE__ */ new Map();
    this.definesByTypeBatches = /* @__PURE__ */ new Map();
    // typeRef → [wallRefs]
    this.openingTypeRefs = /* @__PURE__ */ new Map();
    this.openingDefinesByTypeBatches = /* @__PURE__ */ new Map();
    // door/window typeRef → [instanceRefs]
    this.spacesByStorey = /* @__PURE__ */ new Map();
    // storeyRef → IfcSpace refs (aggregated, not contained)
    this.stairTypeRefs = /* @__PURE__ */ new Map();
    this.stairDefinesByTypeBatches = /* @__PURE__ */ new Map();
    /**
     * Per-wall arc-length deltas applied to the body geometry at each end:
     *   • Through wall in a butt joint → extension (negative at start, positive at end).
     *   • Butting wall in a butt joint → shortening (positive at start, negative at end).
     * Populated by `computeWallTrims` before `writeStraightWall` consumes it.
     */
    this.wallTrimMap = /* @__PURE__ */ new Map();
    this.opts = {
      projectName: opts.projectName ?? "Tekto Project",
      projectDescription: opts.projectDescription ?? "",
      siteName: opts.siteName ?? "Site",
      buildingName: opts.buildingName ?? "Building",
      storeyName: opts.storeyName ?? "Ground Floor",
      storeyElevation: opts.storeyElevation ?? 0,
      author: opts.author ?? "",
      authorGivenName: opts.authorGivenName ?? "",
      organization: opts.organization ?? "Tekto",
      application: opts.application ?? "Tekto",
      applicationVersion: opts.applicationVersion ?? "0.1",
      viewDefinition: opts.viewDefinition ?? "ViewDefinition [DesignTransferView_V1.0]"
    };
    this.bootstrap();
  }
  // ── Public API ────────────────────────────────────────────────────
  /**
   * Add an additional `IfcBuildingStorey` to the model and return its
   * line id. Pass that id as `opts.storey` on subsequent `addWall` /
   * `addSlab` / `addWallSystem` calls to attach elements to the new
   * storey. The bootstrap storey (created from `IfcWriterOptions`)
   * stays the default for any call that omits `storey`. Heights stay
   * absolute: a wall on a storey at 3 m has `baseElevation: 3`.
   *
   * @example
   *   const writer = new IfcWriter({ storeyName: "Ground floor", storeyElevation: 0 });
   *   writer.addWallSystem(groundFloorSystem);          // → ground floor
   *   const first = writer.addStorey({ name: "First floor", elevation: 3.0 });
   *   writer.addWallSystem(firstFloorSystem, { storey: first });
   */
  addStorey(opts) {
    const { storeyRef, placementRef } = this.createStoreyEntities(opts.name, opts.elevation);
    this.storeyPlacementByRef.set(storeyRef, placementRef);
    this.elementsByStorey.set(storeyRef, []);
    return storeyRef;
  }
  /** Convenience: returns the bootstrap storey's IFC line id. */
  getDefaultStorey() {
    return this.storeyRef;
  }
  /**
   * Add a `WallSystem` and everything it carries — the recommended one-shot
   * entry point. Emits wall types, materials, walls, openings, members,
   * and joint relations in a single coherent batch.
   *
   * `opts.storey` (optional) selects which storey to attach the walls to.
   * Defaults to the bootstrap storey from `IfcWriterOptions`.
   */
  addWallSystem(system, opts = {}) {
    const incMembers = opts.includeMembers ?? true;
    const incJoints = opts.includeJoints ?? true;
    const incOpenings = opts.includeOpenings ?? true;
    const incMaterials = opts.includeMaterials ?? true;
    const realised = incMembers ? system.realize() : null;
    this.computeWallTrims(system);
    const storey = this.resolveStorey(opts.storey);
    for (const wall of system.walls) {
      const wallRef = this.addWall(wall, { includeMaterials: incMaterials, storey });
      if (incOpenings) {
        for (const op of wall.openings) this.addOpening(wall, wallRef, op, storey);
      }
    }
    if (incMembers && realised) {
      for (const r of realised) {
        const wallRef = this.wallByObject.get(r.wall);
        if (wallRef == null) continue;
        const memberRefs = [];
        for (const part of r.parts) {
          if (part.role === "monolithic") continue;
          const ref = this.addMember(wallRef, part);
          memberRefs.push(ref);
        }
        if (memberRefs.length > 0) {
          this.addEntity(
            `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${wallRef},(${memberRefs.map((r2) => `#${r2}`).join(",")}))`
          );
        }
      }
    }
    if (incJoints) {
      for (const j of system.joints) this.addJoint(j);
    }
  }
  /**
   * Add one wall — returns its IFC line id. Used internally by
   * `addWallSystem`; can also be called directly for one-off walls.
   *
   * `opts.storey` selects which storey to attach the wall to. Defaults
   * to the bootstrap storey.
   */
  addWall(wall, opts = {}) {
    const cl = wall.centerline;
    if (cl.length < 2) throw new Error("IfcWriter.addWall: centerline needs \u2265 2 points");
    const storey = this.resolveStorey(opts.storey);
    const refs2 = [];
    for (let i = 0; i < cl.length - 1; i++) {
      refs2.push(this.writeStraightWall(wall, cl[i], cl[i + 1], i, cl.length - 1, storey));
    }
    const primaryRef = refs2[0];
    this.wallByObject.set(wall, primaryRef);
    for (const r of refs2) this.attachToStorey(r, storey);
    if (wall.type) {
      const typeRef = this.ensureWallType(wall.type, opts.includeMaterials ?? true);
      const batch = this.definesByTypeBatches.get(typeRef) ?? [];
      batch.push(primaryRef);
      this.definesByTypeBatches.set(typeRef, batch);
      if (opts.includeMaterials ?? true) {
        const layerSetRef = this.materialLayerSetRefs.get(wall.type);
        if (layerSetRef !== void 0) {
          this.writeMaterialLayerSetUsage(primaryRef, layerSetRef, wall);
        }
      }
    }
    return primaryRef;
  }
  /**
   * Add an opening (door or window) on the given wall. Emits
   * IfcOpeningElement + IfcRelVoidsElement (carving the wall) and
   * IfcDoor or IfcWindow + IfcRelFillsElement (filling the void).
   */
  addOpening(wall, wallRef, opening, storeyRef) {
    const isDoor = opening.sillHeight <= 1e-3;
    const opHeight = opening.headHeight - opening.sillHeight;
    const opWidth = opening.width;
    const opDepth = wall.thickness;
    const opCenter = pointAlongCenterline(wall.centerline, opening.centerlinePosition);
    const tangent = tangentAlongCenterline(wall.centerline, opening.centerlinePosition);
    const frame = this.storeyFrame(storeyRef ?? this.storeyRef);
    const z = wall.baseElevation + opening.sillHeight - frame.elevation;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(opCenter.x)},${ifcReal(opCenter.y)},${ifcReal(z)}))`);
    const refDir = this.addEntity(`IFCDIRECTION((${ifcReal(tangent.x)},${ifcReal(tangent.y)},0.))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${refDir})`);
    const parentPlacementRef = frame.placement;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const profileOrigin = this.addEntity(`IFCCARTESIANPOINT((0.,0.))`);
    const profileAxis2D = this.addEntity(`IFCAXIS2PLACEMENT2D(#${profileOrigin},${"$"})`);
    const profile = this.addEntity(
      `IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profileAxis2D},${ifcReal(opWidth)},${ifcReal(opDepth)})`
    );
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(opHeight)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const openingName = opening.name ?? (isDoor ? "Door opening" : "Window opening");
    const openingRef = this.addEntity(
      `IFCOPENINGELEMENT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(openingName)},$,$,#${localPlacement},#${productShape},$,.OPENING.)`
    );
    this.addEntity(
      `IFCRELVOIDSELEMENT(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${wallRef},#${openingRef})`
    );
    const type = opening.type;
    const asDoor = type ? type.kind === "door" : isDoor;
    const fillName = opening.name ?? type?.name ?? (asDoor ? "Door" : "Window");
    const fillType = asDoor ? "IFCDOOR" : "IFCWINDOW";
    const fillPredefined = asDoor ? ".DOOR." : ".WINDOW.";
    const fillOperation = type ? asDoor ? ifcDoorOperation(type.operation) : ifcWindowPartitioning(type.partitioning) : ".NOTDEFINED.";
    const fillRef = this.addEntity(
      `${fillType}(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(fillName)},$,$,#${localPlacement},#${productShape},$,${ifcReal(opHeight)},${ifcReal(opWidth)},${fillPredefined},${fillOperation},$)`
    );
    this.addEntity(
      `IFCRELFILLSELEMENT(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${openingRef},#${fillRef})`
    );
    if (type) {
      const typeRef = this.ensureOpeningType(type);
      const batch = this.openingDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(fillRef);
      this.openingDefinesByTypeBatches.set(typeRef, batch);
    }
    const mergedProps = {
      ...type?.properties ?? {},
      ...opening.properties ?? {}
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(fillRef, asDoor ? "Pset_DoorCommon" : "Pset_WindowCommon", mergedProps);
    }
    return { openingRef, fillRef };
  }
  /**
   * Add a framed member (stud / plate / header / cripple / etc.) as an
   * IfcMember with a tessellated body (IfcTriangulatedFaceSet — efficient,
   * IFC4-native). The mesh is in world coordinates. Aggregating under a
   * wall is the caller's responsibility (see addWallSystem).
   *
   * An element that stands on its own — a railing, a column — passes
   * `opts.storey` and is contained in that storey. A part that a wall, slab
   * or roof gathers leaves it out: it is contained through its whole.
   *
   *   ifc.addMember(0, { name: "Railing", role: "railing", mesh, ifcType: "IfcRailing" }, { storey: first });
   */
  addMember(_parentWallRef, part, opts = {}) {
    void _parentWallRef;
    const storey = opts.storey === void 0 ? null : this.resolveStorey(opts.storey);
    const mesh = part.mesh;
    const positions = mesh.positions;
    const indices = mesh.indices;
    const coords = [];
    for (let i = 0; i < positions.length; i += 3) {
      coords.push(`(${ifcReal(positions[i])},${ifcReal(positions[i + 1])},${ifcReal(positions[i + 2])})`);
    }
    const pointListRef = this.addEntity(`IFCCARTESIANPOINTLIST3D((${coords.join(",")}))`);
    const tris = [];
    for (let i = 0; i < indices.length; i += 3) {
      tris.push(`(${indices[i] + 1},${indices[i + 1] + 1},${indices[i + 2] + 1})`);
    }
    const faceSet = this.addEntity(`IFCTRIANGULATEDFACESET(#${pointListRef},$,$,(${tris.join(",")}),$)`);
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','Tessellation',(#${faceSet}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const placement = this.addEntity(`IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${this.worldPlacementRef})`);
    const ifcType = part.ifcType ?? "IfcMember";
    const typeName = ifcType.toUpperCase();
    const memberRef = this.addEntity(
      `${typeName}(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(part.name)},$,${ifcStr(part.role)},#${placement},#${productShape},$,.NOTDEFINED.)`
    );
    this.partRefs.add(memberRef);
    if (storey !== null) this.attachToStorey(memberRef, storey);
    if (part.material) {
      const matRef = this.ensureMaterial(part.material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${memberRef}),#${matRef})`
      );
    }
    return memberRef;
  }
  /**
   * Add a wall-to-wall joint as IfcRelConnectsPathElements. The joint's
   * style + throughWall hint are exposed in a custom Pset attached to the
   * relation (so receiving applications can read the design intent).
   */
  addJoint(joint) {
    if (joint.walls.length < 2) return null;
    const w0 = this.wallByObject.get(joint.walls[0]);
    const w1 = this.wallByObject.get(joint.walls[1]);
    if (w0 == null || w1 == null) return null;
    const through = joint.throughWall;
    const throughIsW0 = through === joint.walls[0];
    const throughEndAtJoint = endIsAtJoint(through ?? joint.walls[0], joint.ribbonJoint.point);
    const buttingEndAtJoint = endIsAtJoint(throughIsW0 ? joint.walls[1] : joint.walls[0], joint.ribbonJoint.point);
    const throughConnectionType = joint.kind === "T" ? ".ATPATH." : connectionTypeFromEnd(throughEndAtJoint);
    const buttingConnectionType = connectionTypeFromEnd(buttingEndAtJoint);
    const relatingRef = throughIsW0 ? w0 : w1;
    const relatedRef = throughIsW0 ? w1 : w0;
    const relRef = this.addEntity(
      `IFCRELCONNECTSPATHELEMENTS(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(`${joint.kind}-joint`)},$,$,#${relatingRef},#${relatedRef},(0),(0),${throughConnectionType},${buttingConnectionType})`
    );
    const props = {
      style: joint.style,
      throughWall: through?.name ?? "",
      kind: joint.kind,
      connectionType: joint.connectionType ?? "unspecified",
      ...joint.properties
    };
    this.writePset(relRef, "Pset_JointCommon", props);
    return relRef;
  }
  // ── Slabs ────────────────────────────────────────────────────────
  /**
   * Add a slab (floor / ceiling / roof) — returns its IFC line id.
   * Geometry: `IfcExtrudedAreaSolid` with an `IfcArbitraryClosedProfileDef`
   * built from the slab boundary, extruded up by `slab.thickness` from
   * the slab's bottom (`elevation − thickness`).
   *
   * Optionally aggregates SlabParts (joists, sheathing, ceiling) under
   * the slab via `IfcRelAggregates` when `opts.includeParts` is true.
   */
  addSlab(slab, opts = {}) {
    const storey = this.resolveStorey(opts.storey);
    const ring = Polygon2D.openRing(slab.boundary);
    const ptRefs = [];
    for (const p of ring) {
      ptRefs.push(this.addEntity(`IFCCARTESIANPOINT((${ifcReal(p.x)},${ifcReal(p.y)}))`));
    }
    const closedPts = [...ptRefs, ptRefs[0]];
    const polyline = this.addEntity(`IFCPOLYLINE((${closedPts.map((r) => `#${r}`).join(",")}))`);
    const profile = this.addEntity(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#${polyline})`);
    const frame = this.storeyFrame(storey);
    const bottomZ = slab.elevation - slab.thickness - frame.elevation;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(bottomZ)}))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${this.dirXRef})`);
    const parentPlacementRef = frame.placement;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(slab.thickness)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const slabName = slab.name ?? "Slab";
    const predef = opts.predefinedType ?? "FLOOR";
    const slabRef = this.addEntity(
      `IFCSLAB(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(slabName)},$,$,#${localPlacement},#${productShape},$,.${predef}.)`
    );
    this.slabRefs.push(slabRef);
    this.partRefs.add(slabRef);
    this.attachToStorey(slabRef, storey);
    const openingRings = slab.openingRings();
    slab.openings.forEach((opening, i) => {
      const [p0, p1] = openingRings[i];
      const u = p1.sub(p0).normalize();
      const at = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(opening.centerX)},${ifcReal(opening.centerY)},${ifcReal(bottomZ)}))`);
      const refDir = this.addEntity(`IFCDIRECTION((${ifcReal(u.x)},${ifcReal(u.y)},0.))`);
      const axis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${at},#${this.dirZRef},#${refDir})`);
      const placement = this.addEntity(`IFCLOCALPLACEMENT(#${frame.placement},#${axis})`);
      const centre = this.addEntity(`IFCCARTESIANPOINT((0.,0.))`);
      const centreAxis = this.addEntity(`IFCAXIS2PLACEMENT2D(#${centre},$)`);
      const rect = this.addEntity(`IFCRECTANGLEPROFILEDEF(.AREA.,$,#${centreAxis},${ifcReal(opening.width)},${ifcReal(opening.depth)})`);
      const solid = this.addEntity(`IFCEXTRUDEDAREASOLID(#${rect},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(slab.thickness)})`);
      const rep = this.addEntity(`IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${solid}))`);
      const shape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${rep}))`);
      const openingRef = this.addEntity(
        `IFCOPENINGELEMENT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(opening.name ?? "Slab opening")},$,$,#${placement},#${shape},$,.OPENING.)`
      );
      this.addEntity(`IFCRELVOIDSELEMENT(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${slabRef},#${openingRef})`);
    });
    const mergedProps = {
      ...slab.type?.properties ?? {},
      ...slab.properties ?? {}
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(slabRef, "Pset_SlabCommon", mergedProps);
    }
    if (slab.type) {
      const typeRef = this.ensureSlabType(slab.type);
      const batch = this.slabDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(slabRef);
      this.slabDefinesByTypeBatches.set(typeRef, batch);
    }
    if (opts.includeParts !== false) {
      let parts = opts.parts;
      if (!parts && slab.type?.construction) {
        const ctx = slab.joistDirection ? { joistDirection: slab.joistDirection } : void 0;
        parts = slab.type.construction(slab, ctx);
      }
      if (parts && parts.length > 0) {
        const partRefs = [];
        for (const p of parts) {
          if (p.role === "monolithic") continue;
          partRefs.push(this.addMember(slabRef, p));
        }
        if (partRefs.length > 0) {
          this.addEntity(
            `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${slabRef},(${partRefs.map((r) => `#${r}`).join(",")}))`
          );
        }
      }
    }
    return slabRef;
  }
  ensureSlabType(type) {
    const existing = this.slabTypeRefs.get(type);
    if (existing !== void 0) return existing;
    const psets = this.typePropertySets("Pset_SlabCommon", type.properties);
    const typeRef = this.addEntity(
      `IFCSLABTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,${psets},$,$,$,.NOTDEFINED.)`
    );
    this.slabTypeRefs.set(type, typeRef);
    return typeRef;
  }
  // ── Roofs ────────────────────────────────────────────────────────
  /**
   * Add a roof: an `IfcRoof` that gathers its parts — slabs, members, plates,
   * coverings already written with `addSlab` / `addMember` — and is contained
   * in a storey (default: the bootstrap storey). The parts stop being
   * contained in a storey themselves: in IFC a part belongs to its whole, and
   * the whole to the storey.
   *
   *   const deck = ifc.addSlab(roofSlab, { predefinedType: "ROOF", storey: top });
   *   const rafters = rafterParts.map((p) => ifc.addMember(0, p));
   *   ifc.addRoof([deck, ...rafters], { storey: top, predefinedType: "GABLE_ROOF" });
   */
  addRoof(parts, opts = {}) {
    const storey = this.resolveStorey(opts.storey);
    if (parts.length === 0) throw new Error("IfcWriter.addRoof: a roof needs at least one part (a ref from addSlab or addMember).");
    for (const p of parts) {
      if (!this.partRefs.has(p)) throw new Error(`IfcWriter.addRoof: #${p} is not a slab or member this writer wrote (refs come from addSlab / addMember).`);
    }
    const gathered = new Set(parts);
    for (const [ref, list] of this.elementsByStorey) this.elementsByStorey.set(ref, list.filter((e) => !gathered.has(e)));
    const placement = this.addEntity(`IFCLOCALPLACEMENT(#${this.storeyFrame(storey).placement},#${this.worldPlacementRef})`);
    const roofRef = this.addEntity(
      `IFCROOF(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(opts.name ?? "Roof")},$,$,#${placement},$,$,.${opts.predefinedType ?? "NOTDEFINED"}.)`
    );
    this.attachToStorey(roofRef, storey);
    this.addEntity(
      `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${roofRef},(${parts.map((r) => `#${r}`).join(",")}))`
    );
    return roofRef;
  }
  // ── Stairs ───────────────────────────────────────────────────────
  /**
   * Add a stair as an `IfcStair` that aggregates one `IfcStairFlight` per
   * computed flight. The stair is contained in its storey; flights carry the
   * tessellated step geometry and the riser/tread metrics. A `StairType`
   * links via `IfcRelDefinesByType`; `properties` go on `Pset_StairCommon`.
   */
  addStair(stair, opts = {}) {
    const storey = this.resolveStorey(opts.storey);
    const stairPlacement = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${this.worldPlacementRef})`
    );
    const stairRef = this.addEntity(
      `IFCSTAIR(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(stair.name)},$,$,#${stairPlacement},$,$,${ifcStairShape(stair.type?.shape ?? "straight_run")})`
    );
    this.attachToStorey(stairRef, storey);
    const flightRefs = [];
    for (const flight of stair.flights()) {
      flightRefs.push(this.writeStairFlight(flight, stair.type?.material));
    }
    if (flightRefs.length > 0) {
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${stairRef},(${flightRefs.map((r) => `#${r}`).join(",")}))`
      );
    }
    if (stair.type) {
      const typeRef = this.ensureStairType(stair.type);
      const batch = this.stairDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(stairRef);
      this.stairDefinesByTypeBatches.set(typeRef, batch);
    }
    const mergedProps = {
      ...stair.type?.properties ?? {},
      ...stair.properties
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(stairRef, "Pset_StairCommon", mergedProps);
    }
    return stairRef;
  }
  writeStairFlight(flight, material) {
    const productShape = this.writeTriangulatedShape(flight.positions, flight.indices);
    const placement = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${this.worldPlacementRef})`
    );
    const flightRef = this.addEntity(
      `IFCSTAIRFLIGHT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(flight.name)},$,$,#${placement},#${productShape},$,${flight.risers},${flight.treads},${ifcReal(flight.riserHeight)},${ifcReal(flight.treadDepth)},.STRAIGHT.)`
    );
    if (material) {
      const matRef = this.ensureMaterial(material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${flightRef}),#${matRef})`
      );
    }
    return flightRef;
  }
  ensureStairType(type) {
    const existing = this.stairTypeRefs.get(type);
    if (existing !== void 0) return existing;
    const psets = this.typePropertySets("Pset_StairCommon", type.properties);
    const typeRef = this.addEntity(
      `IFCSTAIRTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,${psets},$,$,$,${ifcStairShape(type.shape)})`
    );
    this.stairTypeRefs.set(type, typeRef);
    return typeRef;
  }
  /**
   * Emit a tessellated solid (IfcCartesianPointList3D + IfcTriangulatedFaceSet)
   * from a flat positions array and 0-based triangle indices. Returns the
   * IfcProductDefinitionShape ref.
   */
  writeTriangulatedShape(positions, indices) {
    const coords = [];
    for (let i = 0; i < positions.length; i += 3) {
      coords.push(`(${ifcReal(positions[i])},${ifcReal(positions[i + 1])},${ifcReal(positions[i + 2])})`);
    }
    const pointListRef = this.addEntity(`IFCCARTESIANPOINTLIST3D((${coords.join(",")}))`);
    const tris = [];
    for (let i = 0; i < indices.length; i += 3) {
      tris.push(`(${indices[i] + 1},${indices[i + 1] + 1},${indices[i + 2] + 1})`);
    }
    const faceSet = this.addEntity(`IFCTRIANGULATEDFACESET(#${pointListRef},$,$,(${tris.join(",")}),$)`);
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','Tessellation',(#${faceSet}))`
    );
    return this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
  }
  // ── Spaces (rooms) ───────────────────────────────────────────────
  /**
   * Add a room as an `IfcSpace` — returns its IFC line id. Geometry is the
   * boundary polygon extruded up by `space.height` from `space.elevation`.
   * The space is aggregated under its storey via `IfcRelAggregates` (the
   * correct spatial-decomposition relationship for spaces), its `function`
   * becomes `IfcSpace.LongName`, and `properties` go on `Pset_SpaceCommon`.
   *
   * `opts.boundaries` — walls that bound the room (e.g. from
   * `boundingWalls(space, walls)`). Each already-added wall emits an
   * `IfcRelSpaceBoundary` (PHYSICAL; INTERNAL/EXTERNAL from the wall's
   * `isExternal` property). Walls not yet added to the writer are skipped.
   */
  addSpace(space, opts = {}) {
    const storey = this.resolveStorey(opts.storey);
    const ring = Polygon2D.openRing(space.boundary);
    const ptRefs = [];
    for (const p of ring) {
      ptRefs.push(this.addEntity(`IFCCARTESIANPOINT((${ifcReal(p.x)},${ifcReal(p.y)}))`));
    }
    const closedPts = [...ptRefs, ptRefs[0]];
    const polyline = this.addEntity(`IFCPOLYLINE((${closedPts.map((r) => `#${r}`).join(",")}))`);
    const profile = this.addEntity(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#${polyline})`);
    const frame = this.storeyFrame(storey);
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(space.elevation - frame.elevation)}))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${this.dirXRef})`);
    const parentPlacementRef = frame.placement;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(space.height)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const spaceRef = this.addEntity(
      `IFCSPACE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(space.name)},$,$,#${localPlacement},#${productShape},${ifcOpt(space.function ?? "")},.ELEMENT.,.INTERNAL.,$)`
    );
    const list = this.spacesByStorey.get(storey) ?? [];
    list.push(spaceRef);
    this.spacesByStorey.set(storey, list);
    const props = {
      GrossFloorArea: round3(space.area()),
      ...space.properties
    };
    this.writePset(spaceRef, "Pset_SpaceCommon", props);
    if (opts.boundaries) {
      for (const wall of opts.boundaries) {
        const wallRef = this.wallByObject.get(wall);
        if (wallRef == null) continue;
        const ext = isExternalWall(wall) ? ".EXTERNAL." : ".INTERNAL.";
        this.addEntity(
          `IFCRELSPACEBOUNDARY(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${spaceRef},#${wallRef},$,.PHYSICAL.,${ext})`
        );
      }
    }
    return spaceRef;
  }
  /**
   * Ensure an `IfcDoorType` / `IfcWindowType` exists for this opening type,
   * returning its line id. Door types carry an OperationType; window types
   * carry a PartitioningType. The type's `properties` go on a common Pset.
   */
  ensureOpeningType(type) {
    const existing = this.openingTypeRefs.get(type);
    if (existing !== void 0) return existing;
    const psets = this.typePropertySets(
      type.kind === "door" ? "Pset_DoorCommon" : "Pset_WindowCommon",
      type.properties
    );
    let typeRef;
    if (type.kind === "door") {
      typeRef = this.addEntity(
        `IFCDOORTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,${psets},$,$,$,.DOOR.,${ifcDoorOperation(type.operation)},$,$)`
      );
    } else {
      typeRef = this.addEntity(
        `IFCWINDOWTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,${psets},$,$,$,.WINDOW.,${ifcWindowPartitioning(type.partitioning)},$,$)`
      );
    }
    this.openingTypeRefs.set(type, typeRef);
    if (type.material) {
      const matRef = this.ensureMaterial(type.material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${typeRef}),#${matRef})`
      );
    }
    return typeRef;
  }
  // ── Save ──────────────────────────────────────────────────────────
  save() {
    this.flushDefinesByType();
    this.linkSpatialStructure();
    return this.assembleStep();
  }
  saveBytes() {
    return new TextEncoder().encode(this.save());
  }
  saveBlob() {
    return new Blob([this.save()], { type: "application/ifc" });
  }
  // ── Bootstrap ────────────────────────────────────────────────────
  bootstrap() {
    this.originPointRef = this.addEntity(`IFCCARTESIANPOINT((0.,0.,0.))`);
    this.dirXRef = this.addEntity(`IFCDIRECTION((1.,0.,0.))`);
    this.dirZRef = this.addEntity(`IFCDIRECTION((0.,0.,1.))`);
    this.worldPlacementRef = this.addEntity(
      `IFCAXIS2PLACEMENT3D(#${this.originPointRef},#${this.dirZRef},#${this.dirXRef})`
    );
    const person = this.addEntity(
      `IFCPERSON($,${ifcOpt(this.opts.author)},${ifcOpt(this.opts.authorGivenName)},$,$,$,$,$)`
    );
    const org = this.addEntity(`IFCORGANIZATION($,${ifcStr(this.opts.organization)},$,$,$)`);
    const personAndOrg = this.addEntity(`IFCPERSONANDORGANIZATION(#${person},#${org},$)`);
    const app = this.addEntity(
      `IFCAPPLICATION(#${org},${ifcStr(this.opts.applicationVersion)},${ifcStr(this.opts.application)},${ifcStr(this.opts.application.toLowerCase())})`
    );
    const epoch = 17e8;
    this.ownerHistoryRef = this.addEntity(
      `IFCOWNERHISTORY(#${personAndOrg},#${app},$,.ADDED.,$,$,$,${epoch})`
    );
    const metre = this.addEntity(`IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)`);
    const radian = this.addEntity(`IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)`);
    const squareMetre = this.addEntity(`IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`);
    const cubicMetre = this.addEntity(`IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)`);
    const unitAssign = this.addEntity(
      `IFCUNITASSIGNMENT((#${metre},#${squareMetre},#${cubicMetre},#${radian}))`
    );
    this.contextRef = this.addEntity(
      `IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-5,#${this.worldPlacementRef},$)`
    );
    this.projectRef = this.addEntity(
      `IFCPROJECT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.projectName)},${ifcOpt(this.opts.projectDescription)},$,$,$,(#${this.contextRef}),#${unitAssign})`
    );
    this.rootPlacementRef = this.addEntity(`IFCLOCALPLACEMENT($,#${this.worldPlacementRef})`);
    this.siteRef = this.addEntity(
      `IFCSITE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.siteName)},$,$,#${this.rootPlacementRef},$,$,.ELEMENT.,$,$,$,$,$)`
    );
    this.buildingPlacementRef = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.rootPlacementRef},#${this.worldPlacementRef})`
    );
    this.buildingRef = this.addEntity(
      `IFCBUILDING(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.buildingName)},$,$,#${this.buildingPlacementRef},$,$,.ELEMENT.,$,$,$)`
    );
    const { storeyRef, placementRef } = this.createStoreyEntities(
      this.opts.storeyName,
      this.opts.storeyElevation
    );
    this.storeyRef = storeyRef;
    this.storeyPlacementRef = placementRef;
    this.storeyPlacementByRef.set(storeyRef, placementRef);
    this.elementsByStorey.set(storeyRef, []);
    this.addEntity(`IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.projectRef},(#${this.siteRef}))`);
    this.addEntity(`IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.siteRef},(#${this.buildingRef}))`);
  }
  /** Build the IfcBuildingStorey + IfcLocalPlacement pair. Returns both refs. */
  createStoreyEntities(name, elevation) {
    const originPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(elevation)}))`);
    const axis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${originPt},#${this.dirZRef},#${this.dirXRef})`);
    const placementRef = this.addEntity(`IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${axis})`);
    const storeyRef = this.addEntity(
      `IFCBUILDINGSTOREY(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(name)},$,$,#${placementRef},$,$,.ELEMENT.,${ifcReal(elevation)})`
    );
    this.storeyElevationByRef.set(storeyRef, elevation);
    return { storeyRef, placementRef };
  }
  /**
   * Where an element on a storey is placed: in the storey's placement, which is already
   * raised to the storey's elevation. Heights in the API are absolute (`Wall.baseElevation`,
   * `Slab.elevation`, `Space.elevation`), so the element's local z is its height minus
   * `elevation`.
   */
  storeyFrame(storeyRef) {
    return {
      placement: this.storeyPlacementByRef.get(storeyRef) ?? this.storeyPlacementRef,
      elevation: this.storeyElevationByRef.get(storeyRef) ?? 0
    };
  }
  // ── Wall geometry ────────────────────────────────────────────────
  /**
   * Per-wall deltas from butt joints. Sign convention along the wall's
   * tangent (p0 → p1):
   *   - Through wall, start at joint → startDelta negative (extend back)
   *   - Through wall, end at joint   → endDelta   positive (extend fwd)
   *   - Butting wall, start at joint → startDelta positive (shorten in)
   *   - Butting wall, end at joint   → endDelta   negative (shorten in)
   * Mitered joints leave deltas at 0 — both walls meet at centerline.
   */
  computeWallTrims(system) {
    this.wallTrimMap.clear();
    for (const w of system.walls) {
      this.wallTrimMap.set(w, { startDelta: 0, endDelta: 0 });
    }
    for (const joint of system.joints) {
      if (joint.style !== "butt") continue;
      const through = joint.throughWall;
      if (!through) continue;
      const halfThrough = through.thickness * 0.5;
      const buttings = joint.walls.filter((w) => w !== through);
      const maxButtHalfW = buttings.reduce((m, w) => Math.max(m, w.thickness * 0.5), 0);
      for (const wall of joint.walls) {
        const trim = this.wallTrimMap.get(wall);
        if (!trim) continue;
        const endPos = endIsAtJoint(wall, joint.ribbonJoint.point);
        if (wall === through) {
          if (endPos === "start") trim.startDelta -= maxButtHalfW;
          else if (endPos === "end") trim.endDelta += maxButtHalfW;
        } else {
          if (endPos === "start") trim.startDelta += halfThrough;
          else if (endPos === "end") trim.endDelta -= halfThrough;
        }
      }
    }
  }
  writeStraightWall(wall, p0, p1, segIndex, segTotal, storeyRef) {
    const rawDx = p1.x - p0.x;
    const rawDy = p1.y - p0.y;
    const rawLen = Math.hypot(rawDx, rawDy);
    if (rawLen < 1e-9) throw new Error("IfcWriter: zero-length wall segment");
    const ux = rawDx / rawLen;
    const uy = rawDy / rawLen;
    const trim = this.wallTrimMap.get(wall);
    let startX = p0.x, startY = p0.y;
    let endX = p1.x, endY = p1.y;
    if (trim) {
      if (segIndex === 0) {
        startX = p0.x + ux * trim.startDelta;
        startY = p0.y + uy * trim.startDelta;
      }
      if (segIndex === segTotal - 1) {
        endX = p1.x + ux * trim.endDelta;
        endY = p1.y + uy * trim.endDelta;
      }
    }
    const length = Math.hypot(endX - startX, endY - startY);
    if (length < 1e-9) throw new Error("IfcWriter: zero-length trimmed wall segment");
    const frame = this.storeyFrame(storeyRef ?? this.storeyRef);
    const z = wall.baseElevation - frame.elevation;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(startX)},${ifcReal(startY)},${ifcReal(z)}))`);
    const refDir = this.addEntity(`IFCDIRECTION((${ifcReal(ux)},${ifcReal(uy)},0.))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${refDir})`);
    const parentPlacementRef = frame.placement;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const profileOrigin = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(length / 2)},0.))`);
    const profileAxisDir = this.addEntity(`IFCDIRECTION((1.,0.))`);
    const profileAxis = this.addEntity(`IFCAXIS2PLACEMENT2D(#${profileOrigin},#${profileAxisDir})`);
    const profile = this.addEntity(
      `IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profileAxis},${ifcReal(length)},${ifcReal(wall.thickness)})`
    );
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(wall.height)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const wallName = segTotal > 1 ? `${wall.name ?? "Wall"}_${segIndex + 1}` : wall.name ?? "Wall";
    const wallRef = this.addEntity(
      `IFCWALLSTANDARDCASE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(wallName)},$,$,#${localPlacement},#${productShape},$,.NOTDEFINED.)`
    );
    this.wallRefs.push(wallRef);
    this.placementByWall.set(wall, localPlacement);
    const mergedProps = {
      ...wall.type?.properties ?? {},
      ...wall.properties ?? {}
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(wallRef, "Pset_WallCommon", mergedProps);
    }
    return wallRef;
  }
  // ── Wall type registry ──────────────────────────────────────────
  ensureWallType(type, includeMaterials) {
    const existing = this.wallTypeRefs.get(type);
    if (existing !== void 0) return existing;
    const psets = this.typePropertySets("Pset_WallCommon", type.properties);
    const typeRef = this.addEntity(
      `IFCWALLTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,${psets},$,$,$,.NOTDEFINED.)`
    );
    this.wallTypeRefs.set(type, typeRef);
    if (includeMaterials && type.layers && type.layers.length > 0) {
      const layerSetRef = this.writeMaterialLayerSet(type.layers, type.name);
      this.materialLayerSetRefs.set(type, layerSetRef);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${typeRef}),#${layerSetRef})`
      );
    }
    return typeRef;
  }
  flushDefinesByType() {
    for (const [typeRef, wallRefs] of this.definesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${wallRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
    for (const [typeRef, slabRefs] of this.slabDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${slabRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
    for (const [typeRef, instanceRefs] of this.openingDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${instanceRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
    for (const [typeRef, stairRefs] of this.stairDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${stairRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
  }
  // ── Materials ────────────────────────────────────────────────────
  ensureMaterial(name) {
    const existing = this.materialRefs.get(name);
    if (existing !== void 0) return existing;
    const ref = this.addEntity(`IFCMATERIAL(${ifcStr(name)},$,$)`);
    this.materialRefs.set(name, ref);
    return ref;
  }
  writeMaterialLayerSet(layers, setName) {
    const layerRefs = [];
    for (const l of layers) {
      const matRef = this.ensureMaterial(l.material);
      const layerRef = this.addEntity(
        `IFCMATERIALLAYER(#${matRef},${ifcReal(l.thickness)},$,$,$,$,$)`
      );
      layerRefs.push(layerRef);
    }
    const layerSetRef = this.addEntity(
      `IFCMATERIALLAYERSET((${layerRefs.map((r) => `#${r}`).join(",")}),${ifcStr(setName)},$)`
    );
    return layerSetRef;
  }
  writeMaterialLayerSetUsage(wallRef, layerSetRef, wall) {
    const offset = -wall.thickness * 0.5;
    const usageRef = this.addEntity(
      `IFCMATERIALLAYERSETUSAGE(#${layerSetRef},.AXIS2.,.POSITIVE.,${ifcReal(offset)},$)`
    );
    this.addEntity(
      `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${wallRef}),#${usageRef})`
    );
  }
  // ── Property sets ───────────────────────────────────────────────
  /** The set on its own, with no relationship: what a type holds directly. */
  writePsetEntity(name, props) {
    const propRefs = [];
    for (const [key, value] of Object.entries(props)) {
      propRefs.push(this.writeSingleValue(standardPropertyName(name, key), value));
    }
    if (propRefs.length === 0) return null;
    return this.addEntity(
      `IFCPROPERTYSET(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(name)},$,(${propRefs.map((r) => `#${r}`).join(",")}))`
    );
  }
  /** The set plus the relationship that attaches it to an occurrence. */
  writePset(elementRef, name, props) {
    const psetRef = this.writePsetEntity(name, props);
    if (psetRef === null) return;
    this.addEntity(
      `IFCRELDEFINESBYPROPERTIES(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${elementRef}),#${psetRef})`
    );
  }
  /**
   * A type's property sets, for its `HasPropertySets` attribute.
   *
   * They belong there and not on an `IfcRelDefinesByProperties`, which is how
   * an occurrence gets its own. The attribute used to be written null, and a
   * reader asking for type properties then gets nothing at all: web-ifc raises
   * "HasPropertySets is not iterable" and gives up on the element. It was
   * invisible from here only because the type's properties are also copied
   * onto the occurrence's set, so a round trip through this writer looked
   * complete while anything reading the type saw an empty type.
   *
   * The set has to exist before the type entity that names it, so this is
   * called first and its result inlined.
   */
  typePropertySets(name, props) {
    if (!props || Object.keys(props).length === 0) return "$";
    const ref = this.writePsetEntity(name, props);
    return ref === null ? "$" : `(#${ref})`;
  }
  writeSingleValue(name, value) {
    return this.addEntity(`IFCPROPERTYSINGLEVALUE(${ifcStr(name)},$,${ifcTypedValue(value)},$)`);
  }
  // ── Spatial linking ─────────────────────────────────────────────
  /** Validate / default the storey ref for an add* call. */
  resolveStorey(storeyRef) {
    if (storeyRef == null) return this.storeyRef;
    if (!this.elementsByStorey.has(storeyRef)) {
      throw new Error(
        `IfcWriter: unknown storey ref #${storeyRef} (must come from addStorey() or getDefaultStorey()).`
      );
    }
    return storeyRef;
  }
  /** Record an element ref under its storey for later spatial linking. */
  attachToStorey(elementRef, storeyRef) {
    const list = this.elementsByStorey.get(storeyRef);
    if (list) list.push(elementRef);
  }
  linkSpatialStructure() {
    const storeyRefs = Array.from(this.elementsByStorey.keys());
    if (storeyRefs.length > 0) {
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.buildingRef},(${storeyRefs.map((r) => `#${r}`).join(",")}))`
      );
    }
    for (const [storeyRef, elements] of this.elementsByStorey) {
      if (elements.length === 0) continue;
      const list = elements.map((r) => `#${r}`).join(",");
      this.addEntity(
        `IFCRELCONTAINEDINSPATIALSTRUCTURE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${list}),#${storeyRef})`
      );
    }
    for (const [storeyRef, spaces] of this.spacesByStorey) {
      if (spaces.length === 0) continue;
      const list = spaces.map((r) => `#${r}`).join(",");
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${storeyRef},(${list}))`
      );
    }
  }
  // ── Plumbing ────────────────────────────────────────────────────
  addEntity(content) {
    const id = this.nextId++;
    this.entities.push(`#${id}=${content};`);
    return id;
  }
  assembleStep() {
    const date = (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "");
    const filename = `${(this.opts.projectName || "model").replace(/[^\w-]/g, "_")}.ifc`;
    const header = `HEADER;
FILE_DESCRIPTION((${ifcStr(this.opts.viewDefinition)}),'2;1');
FILE_NAME(${ifcStr(filename)},${ifcStr(date)},(${ifcStr(this.opts.author)}),(${ifcStr(this.opts.organization)}),${ifcStr(this.opts.application + " " + this.opts.applicationVersion)},${ifcStr(this.opts.application)},'');
FILE_SCHEMA(('IFC4'));
ENDSEC;`;
    return `ISO-10303-21;
${header}
DATA;
${this.entities.join("\n")}
ENDSEC;
END-ISO-10303-21;
`;
  }
};
function ifcStr(s) {
  return `'${s.replace(/'/g, "''")}'`;
}
function ifcOpt(s) {
  return s ? ifcStr(s) : "$";
}
function ifcReal(n) {
  if (!Number.isFinite(n)) return "0.";
  const s = n.toString();
  return s.includes(".") || s.includes("e") || s.includes("E") ? s : `${s}.`;
}
function round3(n) {
  return Math.round(n * 1e3) / 1e3;
}
var IFC_PROPERTY_NAMES = {
  isexternal: "IsExternal",
  loadbearing: "LoadBearing",
  firerating: "FireRating",
  acousticrating: "AcousticRating",
  thermaltransmittance: "ThermalTransmittance",
  compartmentation: "Compartmentation",
  extendtostructure: "ExtendToStructure",
  ispermeable: "IsPermeable",
  surfacespreadofflame: "SurfaceSpreadOfFlame",
  combustible: "Combustible",
  reference: "Reference",
  status: "Status"
};
function standardPropertyName(psetName, key) {
  if (!psetName.startsWith("Pset_")) return key;
  return IFC_PROPERTY_NAMES[key.toLowerCase()] ?? key;
}
function isExternalWall(wall) {
  return wall.properties?.isExternal === true || wall.type?.properties?.isExternal === true;
}
function ifcTypedValue(v) {
  if (typeof v === "string") return `IFCTEXT(${ifcStr(v)})`;
  if (typeof v === "boolean") return `IFCBOOLEAN(${v ? ".T." : ".F."})`;
  if (typeof v === "number") return `IFCREAL(${ifcReal(v)})`;
  return `IFCTEXT(${ifcStr(String(v))})`;
}
function ifcGuid() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  let s = "";
  for (let i = 0; i < 22; i++) s += chars[Math.floor(Math.random() * 64)];
  return `'${s}'`;
}
function ifcDoorOperation(op) {
  switch (op) {
    case "single_swing_left":
      return ".SINGLE_SWING_LEFT.";
    case "single_swing_right":
      return ".SINGLE_SWING_RIGHT.";
    case "double_swing":
      return ".DOUBLE_DOOR_DOUBLE_SWING.";
    case "double_door_single_swing":
      return ".DOUBLE_DOOR_SINGLE_SWING.";
    case "sliding":
      return ".SLIDING_TO_LEFT.";
    case "folding":
      return ".FOLDING_TO_LEFT.";
    case "revolving":
      return ".REVOLVING.";
    default:
      return ".NOTDEFINED.";
  }
}
function ifcWindowPartitioning(p) {
  switch (p) {
    case "single_panel":
      return ".SINGLE_PANEL.";
    case "double_panel_vertical":
      return ".DOUBLE_PANEL_VERTICAL.";
    case "double_panel_horizontal":
      return ".DOUBLE_PANEL_HORIZONTAL.";
    case "triple_panel":
      return ".TRIPLE_PANEL_VERTICAL.";
    default:
      return ".NOTDEFINED.";
  }
}
function ifcStairShape(s) {
  switch (s) {
    case "straight_run":
      return ".STRAIGHT_RUN.";
    case "two_straight_run":
      return ".TWO_STRAIGHT_RUN_STAIR.";
    case "quarter_turn":
      return ".QUARTER_TURN_STAIR.";
    case "half_turn":
      return ".HALF_TURN_STAIR.";
    case "spiral":
      return ".SPIRAL_STAIR.";
    default:
      return ".NOTDEFINED.";
  }
}
function pointAlongCenterline(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const dx = cl[i + 1].x - cl[i].x;
    const dy = cl[i + 1].y - cl[i].y;
    const len = Math.hypot(dx, dy);
    if (m <= acc + len) {
      const t = len > 1e-9 ? (m - acc) / len : 0;
      return { x: cl[i].x + dx * t, y: cl[i].y + dy * t };
    }
    acc += len;
  }
  const last = cl[cl.length - 1];
  return { x: last.x, y: last.y };
}
function tangentAlongCenterline(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const dx2 = cl[i + 1].x - cl[i].x;
    const dy2 = cl[i + 1].y - cl[i].y;
    const len2 = Math.hypot(dx2, dy2);
    if (m <= acc + len2) {
      return len2 > 1e-9 ? { x: dx2 / len2, y: dy2 / len2 } : { x: 1, y: 0 };
    }
    acc += len2;
  }
  const n = cl.length;
  const dx = cl[n - 1].x - cl[n - 2].x;
  const dy = cl[n - 1].y - cl[n - 2].y;
  const len = Math.hypot(dx, dy);
  return len > 1e-9 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
}
function endIsAtJoint(wall, pt) {
  const cl = wall.centerline;
  const startDist = Math.hypot(pt.x - cl[0].x, pt.y - cl[0].y);
  const endDist = Math.hypot(pt.x - cl[cl.length - 1].x, pt.y - cl[cl.length - 1].y);
  if (startDist < 1e-3) return "start";
  if (endDist < 1e-3) return "end";
  return "interior";
}
function connectionTypeFromEnd(end) {
  if (end === "start") return ".ATSTART.";
  if (end === "end") return ".ATEND.";
  return ".ATPATH.";
}

// src/core/geometry/ExtrudedRibbon.ts
var RibbonFrame = class {
  constructor(segStart, segEnd, halfWidth, baseZ, height, uOffset = 0) {
    this.origin = segStart;
    const delta = segEnd.sub(segStart);
    this.segLength = delta.len();
    this.dirU = this.segLength > 1e-9 ? delta.div(this.segLength) : new Vec2(1, 0);
    this.dirW = new Vec2(-this.dirU.y, this.dirU.x);
    this.halfWidth = halfWidth;
    this.baseZ = baseZ;
    this.height = height;
    this.uOffset = uOffset;
  }
  /** Local (u, v, w) → world (x, y, z). */
  toWorld(u, v, w = 0) {
    const xy = this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(w));
    return new Vec3(xy.x, xy.y, this.baseZ + v);
  }
  /** Local (u, w) → world XY (height ignored). */
  toWorldXY(u, w = 0) {
    return this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(w));
  }
  /** World point → (u, v, w). */
  toLocal(world) {
    const delta = new Vec2(world.x, world.y).sub(this.origin);
    return {
      u: delta.dot(this.dirU),
      w: delta.dot(this.dirW),
      v: world.z - this.baseZ
    };
  }
  leftAt(u) {
    return this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(this.halfWidth));
  }
  rightAt(u) {
    return this.origin.add(this.dirU.mul(u)).sub(this.dirW.mul(this.halfWidth));
  }
  centerAt(u) {
    return this.origin.add(this.dirU.mul(u));
  }
  get leftNormal() {
    return new Vec3(this.dirW.x, this.dirW.y, 0);
  }
  get rightNormal() {
    return new Vec3(-this.dirW.x, -this.dirW.y, 0);
  }
};
var RibbonOpening = class {
  constructor(centerlinePosition, width = 0.9, bottomOffset = 0, topOffset = 2.1) {
    this.centerlinePosition = centerlinePosition;
    this.width = width;
    this.bottomOffset = bottomOffset;
    this.topOffset = topOffset;
  }
};
var RibbonEndTrim = class _RibbonEndTrim {
  constructor(leftTrimPoint, leftTrimDir, rightTrimPoint, rightTrimDir) {
    this.leftTrimPoint = leftTrimPoint;
    this.leftTrimDir = leftTrimDir;
    this.rightTrimPoint = rightTrimPoint;
    this.rightTrimDir = rightTrimDir;
    /**
     * If `true`, the trimmed end gets an explicit cap face (built from the
     * trimmed leftPts / rightPts). Use for butt-style joints where the
     * trimmed end is visible at the joint. Default `false` (no cap), which
     * is correct for mitered joints where the two walls' offset edges
     * meet along the bisector and a cap would z-fight.
     */
    this.drawCap = false;
  }
  static bothSides(pointOnLine, lineDirection) {
    return new _RibbonEndTrim(pointOnLine, lineDirection, pointOnLine, lineDirection);
  }
};
var MITER_LIMIT = 6;
var ExtrudedRibbon = class {
  constructor(opts) {
    this.width = 0.2;
    this.height = 3;
    this.baseZ = 0;
    this.openings = [];
    const o = Array.isArray(opts) ? { centerline: opts } : opts;
    if (!o.centerline || o.centerline.length < 2) {
      throw new Error("ExtrudedRibbon: centerline needs at least 2 points");
    }
    this.centerline = o.centerline;
    if (o.width !== void 0) this.width = o.width;
    if (o.height !== void 0) this.height = o.height;
    if (o.baseZ !== void 0) this.baseZ = o.baseZ;
  }
  get length() {
    let total = 0;
    for (let i = 0; i < this.centerline.length - 1; i++) {
      total += this.centerline[i].distTo(this.centerline[i + 1]);
    }
    return total;
  }
  get segmentCount() {
    return this.centerline.length - 1;
  }
  get isClosedPolyline() {
    const cl = this.centerline;
    return cl.length >= 3 && cl[0].distSqTo(cl[cl.length - 1]) < 1e-10;
  }
  // ── Meshing ──
  /** Build a stand-alone triangle mesh for this ribbon. */
  toMesh() {
    const buf = newBuffers();
    this.buildInto(buf, null, null);
    return finishMesh(buf);
  }
  /**
   * Append this ribbon's geometry into accumulator buffers (used by
   * RibbonSystem to combine many ribbons in one mesh).
   */
  buildInto(buf, startTrim, endTrim) {
    const cl = this.centerline;
    const n = cl.length;
    if (n < 2) return;
    const isClosed = this.isClosedPolyline;
    const vCount = isClosed ? n - 1 : n;
    const r = this.width * 0.5;
    const z0 = this.baseZ;
    const z1 = this.baseZ + this.height;
    const leftPts = new Array(vCount);
    const rightPts = new Array(vCount);
    for (let i = 0; i < vCount; i++) {
      const p = cl[i];
      let prev = null;
      let next = null;
      if (i > 0) prev = cl[i - 1];
      else if (isClosed) prev = cl[vCount - 1];
      if (i < vCount - 1) next = cl[i + 1];
      else if (isClosed) next = cl[0];
      const { left, right } = computeOffsetPoint(p, prev, next, r);
      leftPts[i] = left;
      rightPts[i] = right;
    }
    if (!isClosed && vCount >= 2) {
      if (startTrim) {
        const d = safeNormalize(cl[1].sub(cl[0]));
        const trimmed = applyEndTrim(cl[0], d, r, startTrim);
        leftPts[0] = trimmed.left;
        rightPts[0] = trimmed.right;
      }
      if (endTrim) {
        const last = vCount - 1;
        const d = safeNormalize(cl[last].sub(cl[last - 1]));
        const trimmed = applyEndTrim(cl[last], d, r, endTrim);
        leftPts[last] = trimmed.left;
        rightPts[last] = trimmed.right;
      }
    }
    const arcLen = new Array(vCount).fill(0);
    for (let i = 1; i < vCount; i++) {
      arcLen[i] = arcLen[i - 1] + cl[i - 1].distTo(cl[i]);
    }
    const segCount = isClosed ? vCount : vCount - 1;
    for (let s = 0; s < segCount; s++) {
      const i = s;
      const j = (s + 1) % vCount;
      const iL = leftPts[i], iR = rightPts[i];
      const jL = leftPts[j], jR = rightPts[j];
      const segStart = arcLen[i];
      let segEnd = arcLen[j < vCount ? j : 0];
      if (segEnd <= segStart) segEnd = segStart + cl[i].distTo(cl[j]);
      const segLen = segEnd - segStart;
      const frame = new RibbonFrame(cl[i], cl[j], r, z0, z1 - z0, segStart);
      const iLu = iL.sub(cl[i]).dot(frame.dirU);
      const iRu = iR.sub(cl[i]).dot(frame.dirU);
      const jLu = segLen + jL.sub(cl[j]).dot(frame.dirU);
      const jRu = segLen + jR.sub(cl[j]).dot(frame.dirU);
      const startMinU = Math.min(iLu, iRu);
      const endMaxU = Math.max(jLu, jRu);
      const minStrip = Math.max(0.02, segLen * 0.02);
      const ops = [];
      for (const op of this.openings) {
        if (op.centerlinePosition < segStart || op.centerlinePosition > segEnd) continue;
        const cu = op.centerlinePosition - segStart;
        let uL = Math.max(cu - op.width * 0.5, 0);
        let uR = Math.min(cu + op.width * 0.5, segLen);
        if (uR <= uL + 1e-6) continue;
        if (uL < minStrip) uL = Math.max(startMinU, 0);
        if (segLen - uR < minStrip) uR = Math.min(endMaxU, segLen);
        ops.push({ uL, uR, vBot: op.bottomOffset, vTop: op.topOffset });
      }
      ops.sort((a, b) => a.uL - b.uL);
      if (ops.length === 0) {
        emitQuad(
          buf,
          new Vec3(iL.x, iL.y, z0),
          new Vec3(iL.x, iL.y, z1),
          new Vec3(jL.x, jL.y, z1),
          new Vec3(jL.x, jL.y, z0),
          frame.leftNormal
        );
        emitQuad(
          buf,
          new Vec3(iR.x, iR.y, z0),
          new Vec3(jR.x, jR.y, z0),
          new Vec3(jR.x, jR.y, z1),
          new Vec3(iR.x, iR.y, z1),
          frame.rightNormal
        );
      } else {
        const h = z1 - z0;
        emitSideLocal(buf, frame, segLen, h, ops, 1, iL, jL);
        emitSideLocal(buf, frame, segLen, h, ops, -1, iR, jR);
        const eps = segLen * 0.01;
        for (const { uL, uR, vBot, vTop } of ops) {
          const atStart = uL < eps;
          const atEnd = uR > segLen - eps;
          const llXY = atStart ? iL : frame.toWorldXY(uL, +r);
          const lrXY = atEnd ? jL : frame.toWorldXY(uR, +r);
          const rlXY = atStart ? iR : frame.toWorldXY(uL, -r);
          const rrXY = atEnd ? jR : frame.toWorldXY(uR, -r);
          const zSill = z0 + vBot;
          const zHead = z0 + vTop;
          emitQuad(
            buf,
            new Vec3(llXY.x, llXY.y, zHead),
            new Vec3(rlXY.x, rlXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zHead),
            new Vec3(lrXY.x, lrXY.y, zHead),
            new Vec3(0, 0, -1)
          );
          if (vBot > 1e-3) {
            emitQuad(
              buf,
              new Vec3(llXY.x, llXY.y, zSill),
              new Vec3(lrXY.x, lrXY.y, zSill),
              new Vec3(rrXY.x, rrXY.y, zSill),
              new Vec3(rlXY.x, rlXY.y, zSill),
              new Vec3(0, 0, 1)
            );
          }
          const jambLN = new Vec3(-frame.dirU.x, -frame.dirU.y, 0);
          emitQuad(
            buf,
            new Vec3(llXY.x, llXY.y, zSill),
            new Vec3(rlXY.x, rlXY.y, zSill),
            new Vec3(rlXY.x, rlXY.y, zHead),
            new Vec3(llXY.x, llXY.y, zHead),
            jambLN
          );
          const jambRN = new Vec3(frame.dirU.x, frame.dirU.y, 0);
          emitQuad(
            buf,
            new Vec3(lrXY.x, lrXY.y, zSill),
            new Vec3(lrXY.x, lrXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zSill),
            jambRN
          );
        }
      }
      emitQuad(
        buf,
        new Vec3(iL.x, iL.y, z1),
        new Vec3(iR.x, iR.y, z1),
        new Vec3(jR.x, jR.y, z1),
        new Vec3(jL.x, jL.y, z1),
        new Vec3(0, 0, 1)
      );
      emitQuad(
        buf,
        new Vec3(iL.x, iL.y, z0),
        new Vec3(jL.x, jL.y, z0),
        new Vec3(jR.x, jR.y, z0),
        new Vec3(iR.x, iR.y, z0),
        new Vec3(0, 0, -1)
      );
    }
    if (!isClosed) {
      if (startTrim === null || startTrim.drawCap) {
        const firstDir = safeNormalize(cl[1].sub(cl[0]));
        const startNormal = new Vec3(-firstDir.x, -firstDir.y, 0);
        const sL = leftPts[0], sR = rightPts[0];
        emitQuad(
          buf,
          new Vec3(sL.x, sL.y, z0),
          new Vec3(sR.x, sR.y, z0),
          new Vec3(sR.x, sR.y, z1),
          new Vec3(sL.x, sL.y, z1),
          startNormal
        );
      }
      if (endTrim === null || endTrim.drawCap) {
        const last = vCount - 1;
        const lastDir = safeNormalize(cl[last].sub(cl[last - 1]));
        const endNormal = new Vec3(lastDir.x, lastDir.y, 0);
        const eL = leftPts[last], eR = rightPts[last];
        emitQuad(
          buf,
          new Vec3(eR.x, eR.y, z0),
          new Vec3(eL.x, eL.y, z0),
          new Vec3(eL.x, eL.y, z1),
          new Vec3(eR.x, eR.y, z1),
          endNormal
        );
      }
    }
  }
};
function newBuffers() {
  return { positions: [], normals: [], indices: [] };
}
function finishMesh(buf) {
  return new Mesh(
    new Float32Array(buf.positions),
    new Uint32Array(buf.indices),
    new Float32Array(buf.normals)
  );
}
function emitQuad(buf, a, b, c, d, normal) {
  const base = buf.positions.length / 3;
  buf.positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
  for (let i = 0; i < 4; i++) buf.normals.push(normal.x, normal.y, normal.z);
  buf.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
function computeOffsetPoint(p, prev, next, r) {
  if (prev === null && next === null) return { left: p, right: p };
  if (prev === null) {
    const d = safeNormalize(next.sub(p));
    const n = new Vec2(-d.y, d.x);
    return { left: p.add(n.mul(r)), right: p.sub(n.mul(r)) };
  }
  if (next === null) {
    const d = safeNormalize(p.sub(prev));
    const n = new Vec2(-d.y, d.x);
    return { left: p.add(n.mul(r)), right: p.sub(n.mul(r)) };
  }
  const d1 = safeNormalize(p.sub(prev));
  const d2 = safeNormalize(next.sub(p));
  const n1 = new Vec2(-d1.y, d1.x);
  const n2 = new Vec2(-d2.y, d2.x);
  const dot = d1.x * d2.x + d1.y * d2.y;
  if (dot < -0.999) {
    return { left: p.add(n1.mul(r)), right: p.sub(n1.mul(r)) };
  }
  let miter = n1.add(n2).mul(r / (1 + dot));
  const maxLen = r * MITER_LIMIT;
  if (miter.lenSq() > maxLen * maxLen) miter = n1.mul(r);
  return { left: p.add(miter), right: p.sub(miter) };
}
function applyEndTrim(endpoint, wallDir, r, trim) {
  const perp = new Vec2(-wallDir.y, wallDir.x);
  const leftLineOrigin = endpoint.add(perp.mul(r));
  const rightLineOrigin = endpoint.sub(perp.mul(r));
  const left = intersectLines(leftLineOrigin, wallDir, trim.leftTrimPoint, trim.leftTrimDir) ?? leftLineOrigin;
  const right = intersectLines(rightLineOrigin, wallDir, trim.rightTrimPoint, trim.rightTrimDir) ?? rightLineOrigin;
  return { left, right };
}
function intersectLines(p1, d1, p2, d2) {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-9) return null;
  const delta = p2.sub(p1);
  const t = (delta.x * d2.y - delta.y * d2.x) / denom;
  return p1.add(d1.mul(t));
}
function safeNormalize(v) {
  const len = v.len();
  return len > 1e-9 ? v.div(len) : new Vec2(1, 0);
}
function emitSideLocal(buf, frame, segLen, height, openings, side, startMiter, endMiter) {
  const w = frame.halfWidth * side;
  const normal = side > 0 ? frame.leftNormal : frame.rightNormal;
  const flip = side < 0;
  let cursor = 0;
  const minU = segLen * 5e-3;
  for (let oi = 0; oi < openings.length; oi++) {
    const { uL, uR, vBot, vTop } = openings[oi];
    if (uL > cursor + minU) {
      const isFirst = cursor < 1e-3;
      emitSideStrip(
        buf,
        frame,
        cursor,
        uL,
        0,
        height,
        w,
        normal,
        flip,
        isFirst ? startMiter : null,
        null
      );
    }
    if (vTop < height - 1e-3) {
      const hAtStart = uL < 1e-3;
      const hAtEnd = uR > segLen - 1e-3;
      emitSideStrip(
        buf,
        frame,
        uL,
        uR,
        vTop,
        height,
        w,
        normal,
        flip,
        hAtStart ? startMiter : null,
        hAtEnd ? endMiter : null
      );
    }
    if (vBot > 1e-3) {
      const sAtStart = uL < 1e-3;
      const sAtEnd = uR > segLen - 1e-3;
      emitSideStrip(
        buf,
        frame,
        uL,
        uR,
        0,
        vBot,
        w,
        normal,
        flip,
        sAtStart ? startMiter : null,
        sAtEnd ? endMiter : null
      );
    }
    cursor = uR;
  }
  if (cursor < segLen - minU) {
    emitSideStrip(
      buf,
      frame,
      cursor,
      segLen,
      0,
      height,
      w,
      normal,
      flip,
      null,
      endMiter
    );
  }
}
function emitSideStrip(buf, frame, u0, u1, v0, v1, w, normal, flipWinding, startMiterPt, endMiterPt) {
  let a, b;
  if (startMiterPt) {
    a = new Vec3(startMiterPt.x, startMiterPt.y, frame.baseZ + v0);
    b = new Vec3(startMiterPt.x, startMiterPt.y, frame.baseZ + v1);
  } else {
    a = frame.toWorld(u0, v0, w);
    b = frame.toWorld(u0, v1, w);
  }
  let c, d;
  if (endMiterPt) {
    c = new Vec3(endMiterPt.x, endMiterPt.y, frame.baseZ + v1);
    d = new Vec3(endMiterPt.x, endMiterPt.y, frame.baseZ + v0);
  } else {
    c = frame.toWorld(u1, v1, w);
    d = frame.toWorld(u1, v0, w);
  }
  if (flipWinding) emitQuad(buf, a, d, c, b, normal);
  else emitQuad(buf, a, b, c, d, normal);
}

// src/core/geometry/RibbonJoint.ts
var RibbonJoint = class {
  constructor(participants, point, kind) {
    this.style = "mitered";
    this.participants = participants;
    this.point = point;
    this.kind = kind;
    const interiorP = participants.find((p) => p.endIsAtJoint === null);
    if (interiorP) {
      this.throughRibbon = interiorP.ribbon;
    } else {
      this.throughRibbon = participants.map((p) => p.ribbon).reduce((a, b) => clLen(a.centerline) > clLen(b.centerline) ? a : b);
    }
  }
  /** Compute per-ribbon trim contributions from this joint. */
  computeTrims() {
    const out = /* @__PURE__ */ new Map();
    if (this.style === "butt") this.computeButtTrims(out);
    else this.computeMiteredTrims(out);
    return out;
  }
  // ── Style: mitered ──────────────────────────────────────────────
  computeMiteredTrims(out) {
    if (this.kind === "T") {
      const throughP = this.participants.find((p) => p.endIsAtJoint === null);
      const stemP = this.participants.find((p) => p.endIsAtJoint !== null);
      if (!throughP || !stemP) return;
      out.set(throughP.ribbon, {});
      const segDir = segmentTangent(throughP.ribbon.centerline, throughP.arcLength);
      const perp = new Vec2(-segDir.y, segDir.x);
      const halfW = throughP.ribbon.width * 0.5;
      const stemInteriorRef = interiorReference(stemP);
      const toStem = stemInteriorRef.sub(this.point);
      const side = perp.x * toStem.x + perp.y * toStem.y;
      const nearFacePoint = side >= 0 ? this.point.add(perp.mul(halfW)) : this.point.sub(perp.mul(halfW));
      const trim = RibbonEndTrim.bothSides(nearFacePoint, segDir);
      setEndTrim(out, stemP, trim);
      return;
    }
    const dirs = this.participants.filter((p) => p.endIsAtJoint !== null).map((p) => ({ p, dir: dirAwayFromJoint(p) })).map((e) => ({ ...e, angle: Math.atan2(e.dir.y, e.dir.x) })).sort((a, b) => a.angle - b.angle);
    if (dirs.length < 2) return;
    for (let i = 0; i < dirs.length; i++) {
      const cur = dirs[i];
      const cw = dirs[(i - 1 + dirs.length) % dirs.length].dir;
      const ccw = dirs[(i + 1) % dirs.length].dir;
      const cwBisector = safeNormalize(cur.dir.add(cw));
      const ccwBisector = safeNormalize(cur.dir.add(ccw));
      const crossCW = cur.dir.x * cw.y - cur.dir.y * cw.x;
      const crossCCW = cur.dir.x * ccw.y - cur.dir.y * ccw.x;
      if (Math.abs(crossCW) < 1e-6 && Math.abs(crossCCW) < 1e-6) continue;
      setEndTrim(out, cur.p, new RibbonEndTrim(this.point, ccwBisector, this.point, cwBisector));
    }
  }
  // ── Style: butt ────────────────────────────────────────────────
  computeButtTrims(out) {
    const through = this.throughRibbon;
    if (!through) {
      this.computeMiteredTrims(out);
      return;
    }
    const throughP = this.participants.find((p) => p.ribbon === through);
    if (!throughP) {
      this.computeMiteredTrims(out);
      return;
    }
    const throughDirAway = throughP.endIsAtJoint === null ? segmentTangent(through.centerline, throughP.arcLength) : dirAwayFromJoint(throughP);
    const perp = new Vec2(-throughDirAway.y, throughDirAway.x);
    const halfW_through = through.width * 0.5;
    if (throughP.endIsAtJoint === null) {
      out.set(through, {});
    } else {
      const buttings = this.participants.filter((p) => p.ribbon !== through);
      const maxButtHalfW = buttings.reduce((m, p) => Math.max(m, p.ribbon.width * 0.5), 0);
      const extensionDir = throughDirAway.mul(-1);
      const extendedPoint = this.point.add(extensionDir.mul(maxButtHalfW));
      const trim = RibbonEndTrim.bothSides(extendedPoint, perp);
      trim.drawCap = true;
      const t = {};
      if (throughP.endIsAtJoint === "start") t.start = trim;
      else t.end = trim;
      out.set(through, t);
    }
    for (const p of this.participants) {
      if (p.ribbon === through) continue;
      const interiorRef = interiorReference(p);
      const toInside = interiorRef.sub(this.point);
      const side = perp.x * toInside.x + perp.y * toInside.y;
      const nearFacePoint = side >= 0 ? this.point.add(perp.mul(halfW_through)) : this.point.sub(perp.mul(halfW_through));
      const trim = RibbonEndTrim.bothSides(nearFacePoint, throughDirAway);
      trim.drawCap = true;
      setEndTrim(out, p, trim);
    }
  }
};
function clLen(cl) {
  let total = 0;
  for (let i = 0; i < cl.length - 1; i++) total += cl[i].distTo(cl[i + 1]);
  return total;
}
function segmentTangent(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const d2 = cl[i + 1].sub(cl[i]);
      const len2 = d2.len();
      return len2 > 1e-9 ? d2.div(len2) : new Vec2(1, 0);
    }
    acc += segLen;
  }
  const d = cl[cl.length - 1].sub(cl[cl.length - 2]);
  const len = d.len();
  return len > 1e-9 ? d.div(len) : new Vec2(1, 0);
}
function dirAwayFromJoint(p) {
  const cl = p.ribbon.centerline;
  if (p.endIsAtJoint === "start") return safeNormalize(cl[1].sub(cl[0]));
  if (p.endIsAtJoint === "end") return safeNormalize(cl[cl.length - 2].sub(cl[cl.length - 1]));
  return new Vec2(1, 0);
}
function interiorReference(p) {
  const cl = p.ribbon.centerline;
  if (p.endIsAtJoint === "start") return cl[1];
  if (p.endIsAtJoint === "end") return cl[cl.length - 2];
  return cl[0];
}
function setEndTrim(out, p, trim) {
  const cur = out.get(p.ribbon) ?? {};
  if (p.endIsAtJoint === "start") cur.start = trim;
  else if (p.endIsAtJoint === "end") cur.end = trim;
  out.set(p.ribbon, cur);
}

// src/core/geometry/RibbonSystem.ts
var RibbonSystem = class {
  constructor(ribbons) {
    this.ribbons = [];
    this.joints = [];
    this.touchEpsilon = 1e-3;
    this._jointsDetected = false;
    if (ribbons) for (const r of ribbons) this.ribbons.push(r);
  }
  add(ribbon) {
    this.ribbons.push(ribbon);
    this._jointsDetected = false;
  }
  // ── Joint detection ────────────────────────────────────────────────
  /**
   * Re-scan the ribbon geometry and rebuild the `joints` array. Called
   * implicitly by `buildMesh` / `computeTrims` when no detection has
   * happened yet. Call explicitly if you've mutated ribbon centerlines
   * after the initial detection.
   *
   * Existing joint *styles* are preserved when the same set of ribbons
   * meet at the same point — useful so a user-set `style: "butt"`
   * survives a geometry update.
   */
  detectJoints() {
    const eps = this.touchEpsilon;
    const oldStyles = /* @__PURE__ */ new Map();
    for (const j of this.joints) oldStyles.set(this.jointKey(j), j);
    const next = [];
    for (let i = 0; i < this.ribbons.length; i++) {
      const stem = this.ribbons[i];
      if (stem.isClosedPolyline) continue;
      const stemEndpoints = ["start", "end"];
      for (const which of stemEndpoints) {
        const ep = which === "start" ? stem.centerline[0] : stem.centerline[stem.centerline.length - 1];
        for (let j = 0; j < this.ribbons.length; j++) {
          if (j === i) continue;
          const through = this.ribbons[j];
          const segCount = through.centerline.length - 1;
          let acc = 0;
          let found = false;
          for (let s = 0; s < segCount && !found; s++) {
            const a = through.centerline[s];
            const b = through.centerline[s + 1];
            const ab = b.sub(a);
            const lenSq = ab.lenSq();
            if (lenSq < 1e-18) continue;
            const t = ep.sub(a).dot(ab) / lenSq;
            if (t > eps && t < 1 - eps) {
              const closest = a.add(ab.mul(t));
              if (closest.distTo(ep) < eps) {
                const arcOnThrough = acc + t * Math.sqrt(lenSq);
                const participants = [
                  { ribbon: through, endIsAtJoint: null, arcLength: arcOnThrough },
                  { ribbon: stem, endIsAtJoint: which, arcLength: which === "start" ? 0 : clLen2(stem.centerline) }
                ];
                const joint = new RibbonJoint(participants, ep, "T");
                this.applyOldStyle(joint, oldStyles);
                next.push(joint);
                found = true;
              }
            }
            acc += Math.sqrt(lenSq);
          }
        }
      }
    }
    const endpoints = [];
    for (const r of this.ribbons) {
      if (r.isClosedPolyline) continue;
      endpoints.push({ ribbon: r, which: "start", point: r.centerline[0] });
      endpoints.push({ ribbon: r, which: "end", point: r.centerline[r.centerline.length - 1] });
    }
    const used = /* @__PURE__ */ new Set();
    for (let i = 0; i < endpoints.length; i++) {
      if (used.has(i)) continue;
      const cluster = [endpoints[i]];
      for (let k = i + 1; k < endpoints.length; k++) {
        if (used.has(k)) continue;
        if (endpoints[k].point.distTo(endpoints[i].point) < eps) {
          cluster.push(endpoints[k]);
          used.add(k);
        }
      }
      if (cluster.length < 2) continue;
      used.add(i);
      const participants = cluster.map((e) => ({
        ribbon: e.ribbon,
        endIsAtJoint: e.which,
        arcLength: e.which === "start" ? 0 : clLen2(e.ribbon.centerline)
      }));
      const kind = cluster.length === 2 ? "L" : cluster.length === 3 ? "Y" : cluster.length === 4 ? "X" : "cluster";
      const joint = new RibbonJoint(participants, cluster[0].point, kind);
      this.applyOldStyle(joint, oldStyles);
      next.push(joint);
    }
    this.joints = next;
    this._jointsDetected = true;
  }
  applyOldStyle(joint, old) {
    const prior = old.get(this.jointKey(joint));
    if (prior) {
      joint.style = prior.style;
      joint.throughRibbon = prior.throughRibbon;
    }
  }
  jointKey(j) {
    const idxs = j.participants.map((p) => this.ribbons.indexOf(p.ribbon)).filter((i) => i >= 0).sort((a, b) => a - b);
    return `${j.kind}:${idxs.join(",")}`;
  }
  // ── Trim aggregation ───────────────────────────────────────────────
  /** Aggregate per-ribbon trims from every joint. Returns `{start, end}` per ribbon. */
  computeTrims() {
    if (!this._jointsDetected) this.detectJoints();
    const trims = this.ribbons.map(() => ({ start: null, end: null }));
    for (const j of this.joints) {
      const byRibbon = j.computeTrims();
      for (const [ribbon, t] of byRibbon) {
        const i = this.ribbons.indexOf(ribbon);
        if (i < 0) continue;
        if (t.start !== void 0) trims[i].start = t.start;
        if (t.end !== void 0) trims[i].end = t.end;
      }
    }
    return trims;
  }
  /**
   * Backward-compat: return T-junctions where another ribbon's endpoint
   * lands on this ribbon's interior. Drawn from the populated `joints`
   * array — does not re-scan geometry independently.
   */
  findTJunctionsOnRibbon(ribbon) {
    if (!this._jointsDetected) this.detectJoints();
    const result = [];
    for (const j of this.joints) {
      if (j.kind !== "T") continue;
      const throughP = j.participants.find((p) => p.endIsAtJoint === null);
      const stemP = j.participants.find((p) => p.endIsAtJoint !== null);
      if (!throughP || !stemP) continue;
      if (throughP.ribbon !== ribbon) continue;
      result.push({ arcLength: throughP.arcLength, otherRibbon: stemP.ribbon });
    }
    return result;
  }
  // ── Meshing ────────────────────────────────────────────────────────
  buildMesh() {
    const buf = newBuffers();
    this.buildInto(buf);
    return finishMesh(buf);
  }
  buildInto(buf) {
    const trims = this.computeTrims();
    for (let i = 0; i < this.ribbons.length; i++) {
      this.ribbons[i].buildInto(buf, trims[i].start, trims[i].end);
    }
  }
};
function clLen2(cl) {
  let total = 0;
  for (let i = 0; i < cl.length - 1; i++) total += cl[i].distTo(cl[i + 1]);
  return total;
}

// src/bim/walls/types.ts
var WallType = class {
  constructor(opts) {
    this.name = opts.name;
    this.description = opts.description;
    this.construction = opts.construction;
    this.layers = opts.layers;
    this.properties = opts.properties ?? {};
    this.junctionStyle = opts.junctionStyle;
  }
  /** Total nominal thickness summed from material layers (0 if none). */
  get layeredThickness() {
    return (this.layers ?? []).reduce((s, l) => s + l.thickness, 0);
  }
};
function realize(wall, ctx) {
  const type = wall.type;
  const envelopeMesh = ctx?.startTrim || ctx?.endTrim ? trimmedEnvelope(wall, ctx) : wall.toMesh();
  const parts = type?.construction ? type.construction(wall, ctx) : [];
  const layers = type?.layers ?? [];
  const properties = { ...type?.properties ?? {}, ...wall.properties ?? {} };
  return { wall, parts, layers, envelopeMesh, properties };
}
function trimmedEnvelope(wall, ctx) {
  wall.syncOpeningsToRibbon();
  const buf = newBuffers();
  wall.ribbon.buildInto(buf, ctx.startTrim ?? null, ctx.endTrim ?? null);
  return finishMesh(buf);
}
function realizeSystem(system) {
  const trims = system.ribbons.computeTrims();
  const out = [];
  for (let i = 0; i < system.walls.length; i++) {
    const wall = system.walls[i];
    const t = trims[i] ?? { start: null, end: null };
    const tJunctions = system.ribbons.findTJunctionsOnRibbon(wall.ribbon).map((j) => {
      const otherWall = system.walls.find((w) => w.ribbon === j.otherRibbon);
      return {
        arcLength: j.arcLength,
        otherWall: otherWall ?? wall,
        otherThickness: otherWall?.thickness ?? 0
      };
    });
    const ctx = {
      startTrim: t.start ?? void 0,
      endTrim: t.end ?? void 0,
      tJunctions
    };
    out.push(realize(wall, ctx));
  }
  return out;
}
function buildCutList(parts, roundMm = 1) {
  const buckets = /* @__PURE__ */ new Map();
  for (const p of parts) {
    if (p.length === void 0 || !p.profile || !p.material) continue;
    const lenMm = Math.round(p.length * 1e3 / roundMm) * roundMm;
    const key = `${p.material}|${p.profile.name ?? `${p.profile.w}x${p.profile.h}`}|${lenMm}|${p.role}`;
    const existing = buckets.get(key);
    if (existing) existing.count++;
    else buckets.set(key, {
      material: p.material,
      profile: p.profile,
      length: lenMm / 1e3,
      count: 1,
      role: p.role
    });
  }
  return [...buckets.values()].sort(
    (a, b) => a.material.localeCompare(b.material) || a.length - b.length
  );
}

// src/bim/walls/joints.ts
var WallJoint = class {
  constructor(opts) {
    this.connectionType = "unspecified";
    this.properties = {};
    this.ribbonJoint = opts.ribbonJoint;
    this.walls = opts.walls;
    if (opts.connectionType) this.connectionType = opts.connectionType;
    if (opts.fastenerCount !== void 0) this.fastenerCount = opts.fastenerCount;
    if (opts.properties) this.properties = opts.properties;
  }
  /** Joint geometry style. Mirrors `ribbonJoint.style`. */
  get style() {
    return this.ribbonJoint.style;
  }
  set style(v) {
    this.ribbonJoint.style = v;
  }
  /** For "butt" style: which wall passes through. */
  get throughWall() {
    const through = this.ribbonJoint.throughRibbon;
    return through ? this.walls.find((w) => w.ribbon === through) : void 0;
  }
  set throughWall(w) {
    this.ribbonJoint.throughRibbon = w?.ribbon;
  }
  /** Joint kind (L/T/Y/X/cluster). Read-only — derived from geometry. */
  get kind() {
    return this.ribbonJoint.kind;
  }
};

// src/core/geometry/walls.ts
var WallOpening = class _WallOpening {
  constructor(centerlinePosition, width = 0.9, sillHeight = 0, headHeight = 2.1, name) {
    this.centerlinePosition = centerlinePosition;
    this.width = width;
    this.sillHeight = sillHeight;
    this.headHeight = headHeight;
    this.name = name;
  }
  /** True if sillHeight is effectively zero (door-type opening). */
  get isDoor() {
    return this.sillHeight <= 1e-3;
  }
  static door(centerlinePosition, width = 0.9, headHeight = 2.1) {
    return new _WallOpening(centerlinePosition, width, 0, headHeight, "Door");
  }
  static window(centerlinePosition, width = 1.2, sillHeight = 0.9, headHeight = 2.2) {
    return new _WallOpening(centerlinePosition, width, sillHeight, headHeight, "Window");
  }
};
var Wall = class _Wall {
  constructor(opts) {
    /** Rectangular openings (doors, windows). Synced into the ribbon at meshing time. */
    this.openings = [];
    if (Array.isArray(opts)) {
      this.ribbon = new ExtrudedRibbon(opts);
    } else {
      this.ribbon = new ExtrudedRibbon({
        centerline: opts.centerline,
        width: opts.thickness,
        height: opts.height,
        baseZ: opts.baseElevation
      });
      this.name = opts.name;
      this.type = opts.type;
      this.properties = opts.properties;
    }
  }
  /** Convenience constructor for a single straight wall. */
  static segment(start, end, opts = {}) {
    return new _Wall({
      centerline: [start, end],
      thickness: opts.thickness,
      height: opts.height,
      baseElevation: opts.baseElevation,
      name: opts.name
    });
  }
  // ── Forwarded properties (convenience) ──
  get centerline() {
    return this.ribbon.centerline;
  }
  set centerline(v) {
    this.ribbon.centerline = v;
  }
  get thickness() {
    return this.ribbon.width;
  }
  set thickness(v) {
    this.ribbon.width = v;
  }
  get height() {
    return this.ribbon.height;
  }
  set height(v) {
    this.ribbon.height = v;
  }
  get baseElevation() {
    return this.ribbon.baseZ;
  }
  set baseElevation(v) {
    this.ribbon.baseZ = v;
  }
  get length() {
    return this.ribbon.length;
  }
  get segmentCount() {
    return this.ribbon.segmentCount;
  }
  get isClosedPolyline() {
    return this.ribbon.isClosedPolyline;
  }
  // ── Meshing ──
  /** Build a stand-alone triangle mesh for this wall (no junction analysis). */
  toMesh() {
    this.syncOpeningsToRibbon();
    return this.ribbon.toMesh();
  }
  /** Build a combined mesh from a collection of walls (no junction analysis). */
  static buildMesh(walls) {
    const buf = newBuffers();
    for (const w of walls) {
      w.syncOpeningsToRibbon();
      w.ribbon.buildInto(buf, null, null);
    }
    return finishMesh(buf);
  }
  /**
   * Translate WallOpenings (BIM level) → RibbonOpenings (geometry level).
   * Called automatically by `toMesh` / `Wall.buildMesh` / `WallSystem.buildMesh`.
   */
  syncOpeningsToRibbon() {
    this.ribbon.openings.length = 0;
    for (const wo of this.openings) {
      this.ribbon.openings.push(new RibbonOpening(
        wo.centerlinePosition,
        wo.width,
        wo.sillHeight,
        wo.headHeight
      ));
    }
  }
};
var WallSystem = class {
  constructor(walls) {
    /** The underlying geometry-level ribbon system. */
    this.ribbons = new RibbonSystem();
    /** BIM-level wall references (parallel to `ribbons.ribbons`). */
    this.walls = [];
    this._jointCache = [];
    this._jointCacheStamp = -1;
    if (walls) for (const w of walls) this.add(w);
  }
  get touchEpsilon() {
    return this.ribbons.touchEpsilon;
  }
  set touchEpsilon(v) {
    this.ribbons.touchEpsilon = v;
  }
  add(wall) {
    this.walls.push(wall);
    wall.syncOpeningsToRibbon();
    this.ribbons.add(wall.ribbon);
    this._jointCacheStamp = -1;
  }
  /** BIM-level joints, mirroring `ribbons.joints` 1-to-1. Built lazily. */
  get joints() {
    this.ensureJoints();
    return this._jointCache;
  }
  /**
   * Force a fresh joint detection (RibbonSystem-level) and rebuild the
   * `WallJoint` wrappers with per-`WallType` default styles applied.
   * Call after mutating wall centerlines / types.
   */
  detectJoints() {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ribbons.detectJoints();
    this.rebuildJointCache();
  }
  ensureJoints() {
    this.ribbons.detectJoints();
    if (this._jointCacheStamp !== this.ribbons.joints.length || this._jointCache.length !== this.ribbons.joints.length) {
      this.rebuildJointCache();
    }
  }
  rebuildJointCache() {
    this._jointCache = this.ribbons.joints.map((rj) => {
      const walls = rj.participants.map((p) => this.walls.find((w) => w.ribbon === p.ribbon)).filter((w) => !!w);
      const styleVotes = /* @__PURE__ */ new Map();
      for (const w of walls) {
        const s = w.type?.junctionStyle;
        if (s) styleVotes.set(s, (styleVotes.get(s) ?? 0) + 1);
      }
      let winner;
      let winCount = 0;
      for (const [s, c] of styleVotes) if (c > winCount) {
        winner = s;
        winCount = c;
      }
      if (winner === "butt" || winner === "mitered") rj.style = winner;
      return new WallJoint({ ribbonJoint: rj, walls });
    });
    this._jointCacheStamp = this.ribbons.joints.length;
  }
  /** Build one combined mesh for every wall, with junction trims applied. */
  buildMesh() {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ensureJoints();
    return this.ribbons.buildMesh();
  }
  /**
   * Realise every wall in the system with **junction-aware framing**:
   * plate trims, partition-end shortening, channel-stud insertion in
   * through-walls. Joints are detected (or refreshed) automatically.
   */
  realize() {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ensureJoints();
    return realizeSystem(this);
  }
};

// src/bim/walls/solid.ts
var SolidConstruction = (wall) => [{
  name: "shell",
  role: "monolithic",
  mesh: wall.toMesh(),
  ifcType: "IfcWall"
}];

// src/bim/walls/framing-helpers.ts
function makePlate(name, role, centerline, z, verticalH, acrossWallW, material, profile, startTrim = null, endTrim = null) {
  const ribbon = new ExtrudedRibbon({
    centerline,
    width: acrossWallW,
    height: verticalH,
    baseZ: z
  });
  let mesh;
  if (startTrim || endTrim) {
    const buf = newBuffers();
    ribbon.buildInto(buf, startTrim, endTrim);
    mesh = finishMesh(buf);
  } else {
    mesh = ribbon.toMesh();
  }
  return {
    name,
    role,
    mesh,
    material,
    profile,
    length: polylineLength(centerline),
    ifcType: "IfcMember"
  };
}
function makeStud(name, role, position, tangent, baseZ, height, profile, material) {
  const depthH = profile.h;
  const widthW = profile.w;
  const perp = new Vec2(-tangent.y, tangent.x);
  const studStart = position.sub(perp.mul(depthH * 0.5));
  const studEnd = position.add(perp.mul(depthH * 0.5));
  const ribbon = new ExtrudedRibbon({
    centerline: [studStart, studEnd],
    width: widthW,
    height,
    baseZ
  });
  return {
    name,
    role,
    mesh: ribbon.toMesh(),
    material,
    profile,
    length: height,
    ifcType: "IfcMember"
  };
}
function makeBeam(name, role, centerline, z, verticalDepth, acrossWallW, material, profile) {
  const ribbon = new ExtrudedRibbon({
    centerline,
    width: acrossWallW,
    height: verticalDepth,
    baseZ: z
  });
  return {
    name,
    role,
    mesh: ribbon.toMesh(),
    material,
    profile,
    length: polylineLength(centerline),
    ifcType: "IfcMember"
  };
}
function polylineLength(cl) {
  return Polygon2D.polylineLength(cl);
}
function pointAt(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const t = segLen > 1e-9 ? (m - acc) / segLen : 0;
      return cl[i].add(cl[i + 1].sub(cl[i]).mul(t));
    }
    acc += segLen;
  }
  return cl[cl.length - 1];
}
function tangentAt(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const d2 = cl[i + 1].sub(cl[i]);
      const len2 = d2.len();
      return len2 > 1e-9 ? d2.div(len2) : new Vec2(1, 0);
    }
    acc += segLen;
  }
  const d = cl[cl.length - 1].sub(cl[cl.length - 2]);
  const len = d.len();
  return len > 1e-9 ? d.div(len) : new Vec2(1, 0);
}
function subCenterline(cl, uStart, uEnd) {
  if (uEnd <= uStart) return [];
  const result = [];
  let acc = 0;
  let started = false;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    const segStart = acc;
    const segEnd = acc + segLen;
    if (uEnd <= segStart) break;
    if (uStart >= segEnd) {
      acc += segLen;
      continue;
    }
    if (!started) {
      const t = segLen > 1e-9 ? (Math.max(uStart, segStart) - segStart) / segLen : 0;
      result.push(cl[i].add(cl[i + 1].sub(cl[i]).mul(t)));
      started = true;
    }
    if (uEnd <= segEnd) {
      const t = segLen > 1e-9 ? (uEnd - segStart) / segLen : 0;
      result.push(cl[i].add(cl[i + 1].sub(cl[i]).mul(t)));
      return result;
    } else {
      result.push(cl[i + 1]);
    }
    acc += segLen;
  }
  return result;
}
function effectiveStartArc(centerline, startTrim) {
  if (!startTrim || centerline.length < 2) return 0;
  const dir = safeNormalize(centerline[1].sub(centerline[0]));
  const hit = intersectLines(centerline[0], dir, startTrim.leftTrimPoint, startTrim.leftTrimDir);
  if (!hit) return 0;
  const d = hit.sub(centerline[0]).dot(dir);
  return Math.max(0, d);
}
function effectiveEndArc(centerline, endTrim) {
  const total = polylineLength(centerline);
  if (!endTrim || centerline.length < 2) return total;
  const n = centerline.length;
  const dir = safeNormalize(centerline[n - 1].sub(centerline[n - 2]));
  const hit = intersectLines(centerline[n - 1], dir, endTrim.leftTrimPoint, endTrim.leftTrimDir);
  if (!hit) return total;
  const d = hit.sub(centerline[n - 1]).dot(dir);
  return Math.min(total, total + d);
}
function envelopeStartArc(centerline, startTrim) {
  if (!startTrim || centerline.length < 2) return 0;
  const dir = safeNormalize(centerline[1].sub(centerline[0]));
  const hit = intersectLines(centerline[0], dir, startTrim.leftTrimPoint, startTrim.leftTrimDir);
  if (!hit) return 0;
  return hit.sub(centerline[0]).dot(dir);
}
function envelopeEndArc(centerline, endTrim) {
  const total = polylineLength(centerline);
  if (!endTrim || centerline.length < 2) return total;
  const n = centerline.length;
  const dir = safeNormalize(centerline[n - 1].sub(centerline[n - 2]));
  const hit = intersectLines(centerline[n - 1], dir, endTrim.leftTrimPoint, endTrim.leftTrimDir);
  if (!hit) return total;
  return total + hit.sub(centerline[n - 1]).dot(dir);
}
function pointAtExtrapolating(cl, m) {
  if (cl.length < 2) return cl[0] ?? new Vec2(0, 0);
  const total = polylineLength(cl);
  if (m < 0) {
    const dir = safeNormalize(cl[1].sub(cl[0]));
    return cl[0].add(dir.mul(m));
  }
  if (m > total) {
    const n = cl.length;
    const dir = safeNormalize(cl[n - 1].sub(cl[n - 2]));
    return cl[n - 1].add(dir.mul(m - total));
  }
  return pointAt(cl, m);
}
function addEndAndCornerStuds(parts, wall, startTrim, endTrim, studProfile, material, studZ0, studH) {
  const cl = wall.centerline;
  const isClosed = wall.isClosedPolyline;
  const n = cl.length;
  const positions = [];
  if (!isClosed) {
    const envStart = envelopeStartArc(cl, startTrim);
    const envEnd = envelopeEndArc(cl, endTrim);
    const startPostArc = envStart + studProfile.w * 0.5;
    const endPostArc = envEnd - studProfile.w * 0.5;
    const startTangentArc = Math.max(0, Math.min(polylineLength(cl), startPostArc));
    const endTangentArc = Math.max(0, Math.min(polylineLength(cl), endPostArc));
    parts.push(makeStud(
      "End stud (start)",
      "stud",
      pointAtExtrapolating(cl, startPostArc),
      tangentAt(cl, startTangentArc),
      studZ0,
      studH,
      studProfile,
      material
    ));
    positions.push(startPostArc);
    parts.push(makeStud(
      "End stud (end)",
      "stud",
      pointAtExtrapolating(cl, endPostArc),
      tangentAt(cl, endTangentArc),
      studZ0,
      studH,
      studProfile,
      material
    ));
    positions.push(endPostArc);
  }
  const uniqueCount = isClosed ? n - 1 : n;
  let acc = 0;
  for (let i = 0; i < uniqueCount; i++) {
    if (i > 0) acc += cl[i - 1].distTo(cl[i]);
    if (!isClosed && (i === 0 || i === uniqueCount - 1)) continue;
    parts.push(makeStud(
      `Corner post ${i + 1}`,
      "stud",
      pointAt(cl, acc),
      tangentAt(cl, acc),
      studZ0,
      studH,
      studProfile,
      material
    ));
    positions.push(acc);
  }
  return positions;
}
function addChannelStuds(parts, cl, junction, studProfile, material, studZ0, studH) {
  const offset = junction.otherThickness * 0.5 + studProfile.w * 0.5;
  const positions = [junction.arcLength - offset, junction.arcLength + offset];
  let i = 0;
  for (const m of positions) {
    if (m < studProfile.w * 0.5 || m > polylineLength(cl) - studProfile.w * 0.5) continue;
    parts.push(makeStud(
      `Channel ${++i} (T-junc @ ${junction.arcLength.toFixed(2)} m)`,
      "stud",
      pointAt(cl, m),
      tangentAt(cl, m),
      studZ0,
      studH,
      studProfile,
      material
    ));
  }
  return positions;
}
function placeCripples(parts, cl, uL, uR, studProfile, material, studSpacing, z0, h, role, namePrefix, margin = studProfile.h * 1.5) {
  const cuL = uL + margin;
  const cuR = uR - margin;
  if (cuR <= cuL) return;
  const startK = Math.ceil((cuL - studSpacing * 0.5) / studSpacing);
  const endK = Math.floor((cuR - studSpacing * 0.5) / studSpacing);
  let i = 0;
  for (let k = startK; k <= endK; k++) {
    const m = studSpacing * 0.5 + k * studSpacing;
    parts.push(makeStud(
      `${namePrefix} ${++i}`,
      role,
      pointAt(cl, m),
      tangentAt(cl, m),
      z0,
      h,
      studProfile,
      material
    ));
  }
}
function addHeaderSillCripples(parts, wall, opening, uL, uR, idx, studProfile, plateProfile, material, topPlateCount, studSpacing, headerDepthFor, cfg) {
  const cl = wall.centerline;
  const baseZ = wall.baseElevation;
  const stud = studProfile;
  const plate = plateProfile;
  const plateVerticalH = plate.w;
  const plateAcrossWall = plate.h;
  const topAll = plateVerticalH * topPlateCount;
  const wallH = wall.height;
  const isDoor = opening.sillHeight <= 1e-3;
  const toPlate = opening.headHeight >= wallH - topAll - 1e-3;
  const headerDepth = toPlate ? 0 : headerDepthFor(opening.width);
  const headerZ = baseZ + opening.headHeight;
  const headerCl = subCenterline(cl, uL - cfg.headerMargin, uR + cfg.headerMargin);
  if (!toPlate && headerCl.length >= 2 && polylineLength(headerCl) > 1e-3) {
    parts.push(makeBeam(
      `${cfg.headerLabel} (op ${idx})`,
      "header",
      headerCl,
      headerZ,
      headerDepth,
      stud.h,
      material,
      { w: stud.h, h: headerDepth, name: `${cfg.headerName} ${(headerDepth * 1e3).toFixed(0)}` }
    ));
  }
  const upperZ0 = headerZ + headerDepth;
  const upperZ1 = baseZ + wallH - topAll;
  const upperH = upperZ1 - upperZ0;
  if (upperH > 0.05) {
    placeCripples(
      parts,
      cl,
      uL,
      uR,
      stud,
      material,
      studSpacing,
      upperZ0,
      upperH,
      "cripple",
      `${cfg.crippleUpLabel} (op ${idx})`,
      cfg.crippleMargin
    );
  }
  if (!isDoor) {
    const sillZ = baseZ + opening.sillHeight;
    const sillCl = subCenterline(cl, uL - cfg.sillMargin, uR + cfg.sillMargin);
    if (sillCl.length >= 2 && polylineLength(sillCl) > 1e-3) {
      parts.push(makeBeam(
        `${cfg.sillLabel} (op ${idx})`,
        "blocking",
        sillCl,
        sillZ - plateVerticalH,
        plateVerticalH,
        plateAcrossWall,
        material,
        { w: plate.w, h: plate.h, name: cfg.sillName }
      ));
    }
    const lowerZ0 = baseZ + plateVerticalH;
    const lowerZ1 = sillZ - plateVerticalH;
    const lowerH = lowerZ1 - lowerZ0;
    if (lowerH > 0.05) {
      placeCripples(
        parts,
        cl,
        uL,
        uR,
        stud,
        material,
        studSpacing,
        lowerZ0,
        lowerH,
        "cripple",
        `${cfg.crippleDownLabel} (op ${idx})`,
        cfg.crippleMargin
      );
    }
  }
}

// src/bim/walls/balloon-frame.ts
var DEFAULTS2 = {
  studProfile: { w: 0.038, h: 0.089, name: "SPF 2\xD74 (38\xD789)" },
  plateProfile: { w: 0.038, h: 0.089, name: "SPF 2\xD74 (38\xD789)" },
  studSpacing: 0.4,
  topPlateCount: 2,
  headerDepth: (w) => w >= 1.8 ? 0.235 : w >= 1.2 ? 0.184 : 0.14,
  material: "SPF"
};
function BalloonFrame(options = {}) {
  const opts = { ...DEFAULTS2, ...options };
  return (wall, ctx) => {
    const parts = [];
    const cl = wall.centerline;
    const baseZ = wall.baseElevation;
    const wallH = wall.height;
    const plate = opts.plateProfile;
    const stud = opts.studProfile;
    const sp = opts.studSpacing;
    const topN = opts.topPlateCount;
    const plateVerticalH = plate.w;
    const plateAcrossWall = plate.h;
    const topAll = plateVerticalH * topN;
    const startArc = ctx?.startTrim ? effectiveStartArc(cl, ctx.startTrim) : 0;
    const endArc = effectiveEndArc(cl, ctx?.endTrim ?? null);
    parts.push(makePlate(
      "Sill plate",
      "sillPlate",
      cl,
      baseZ,
      plateVerticalH,
      plateAcrossWall,
      opts.material,
      plate,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null
    ));
    for (let i = 0; i < topN; i++) {
      const z = baseZ + wallH - topAll + i * plateVerticalH;
      parts.push(makePlate(
        topN > 1 ? `Top plate ${i + 1}` : "Top plate",
        "topPlate",
        cl,
        z,
        plateVerticalH,
        plateAcrossWall,
        opts.material,
        plate,
        ctx?.startTrim ?? null,
        ctx?.endTrim ?? null
      ));
    }
    const studZ0 = baseZ + plateVerticalH;
    const studH = wallH - plateVerticalH - topAll;
    const openingExtents = [];
    let openingIdx = 0;
    for (const o of wall.openings) {
      openingIdx++;
      const uL = o.centerlinePosition - o.width / 2;
      const uR = o.centerlinePosition + o.width / 2;
      openingExtents.push({ uL, uR });
      addOpeningFramingNA(parts, wall, o, uL, uR, openingIdx, opts, studZ0, studH);
    }
    const channelZones = [];
    if (ctx?.tJunctions) {
      for (const j of ctx.tJunctions) {
        const placed = addChannelStuds(parts, cl, j, stud, opts.material, studZ0, studH);
        channelZones.push(...placed);
      }
    }
    const mandatoryZones = addEndAndCornerStuds(
      parts,
      wall,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null,
      stud,
      opts.material,
      studZ0,
      studH
    );
    let studIdx = 0;
    for (let m = startArc + sp; m < endArc; m += sp) {
      const inOpening = openingExtents.some(
        (r) => m >= r.uL - stud.h * 0.5 && m <= r.uR + stud.h * 0.5
      );
      if (inOpening) continue;
      const inChannel = channelZones.some((p) => Math.abs(p - m) < stud.h);
      if (inChannel) continue;
      const nearMandatory = mandatoryZones.some((p) => Math.abs(p - m) < stud.h);
      if (nearMandatory) continue;
      parts.push(makeStud(
        `Stud ${++studIdx}`,
        "stud",
        pointAt(cl, m),
        tangentAt(cl, m),
        studZ0,
        studH,
        stud,
        opts.material
      ));
    }
    return parts;
  };
}
function addOpeningFramingNA(parts, wall, opening, uL, uR, idx, opts, studZ0, studH) {
  const cl = wall.centerline;
  const baseZ = wall.baseElevation;
  const stud = opts.studProfile;
  const plate = opts.plateProfile;
  const plateVerticalH = plate.w;
  parts.push(makeStud(
    `King L (op ${idx})`,
    "stud",
    pointAt(cl, uL - stud.h * 0.5),
    tangentAt(cl, uL),
    studZ0,
    studH,
    stud,
    opts.material
  ));
  parts.push(makeStud(
    `King R (op ${idx})`,
    "stud",
    pointAt(cl, uR + stud.h * 0.5),
    tangentAt(cl, uR),
    studZ0,
    studH,
    stud,
    opts.material
  ));
  const jackHeight = opening.headHeight - plateVerticalH;
  const jackZ0 = baseZ + plateVerticalH;
  parts.push(makeStud(
    `Jack L (op ${idx})`,
    "jackStud",
    pointAt(cl, uL + stud.h * 0.5),
    tangentAt(cl, uL),
    jackZ0,
    jackHeight,
    stud,
    opts.material
  ));
  parts.push(makeStud(
    `Jack R (op ${idx})`,
    "jackStud",
    pointAt(cl, uR - stud.h * 0.5),
    tangentAt(cl, uR),
    jackZ0,
    jackHeight,
    stud,
    opts.material
  ));
  addHeaderSillCripples(
    parts,
    wall,
    opening,
    uL,
    uR,
    idx,
    stud,
    plate,
    opts.material,
    opts.topPlateCount,
    opts.studSpacing,
    opts.headerDepth,
    {
      headerMargin: stud.h * 0.5,
      headerLabel: "Header",
      headerName: "Header",
      sillMargin: stud.h * 0.5,
      sillLabel: "Rough sill",
      sillName: "Sill blocking",
      crippleUpLabel: "Cripple \u2191",
      crippleDownLabel: "Cripple \u2193"
    }
  );
}

// src/bim/walls/holzrahmenbau.ts
var DEFAULTS3 = {
  studProfile: { w: 0.06, h: 0.12, name: "KVH 60\xD7120" },
  plateProfile: { w: 0.06, h: 0.12, name: "KVH 60\xD7120" },
  studSpacing: 0.625,
  topPlateCount: 1,
  headerDepth: (w) => w >= 2 ? 0.24 : w >= 1.4 ? 0.2 : 0.16,
  material: "KVH C24",
  doubledKings: true
};
var HolzrahmenBauJointStyle = "butt";
function HolzrahmenBau(options = {}) {
  const opts = { ...DEFAULTS3, ...options };
  return (wall, ctx) => {
    const parts = [];
    const cl = wall.centerline;
    const baseZ = wall.baseElevation;
    const wallH = wall.height;
    const plate = opts.plateProfile;
    const stud = opts.studProfile;
    const sp = opts.studSpacing;
    const topN = opts.topPlateCount;
    const plateVerticalH = plate.w;
    const plateAcrossWall = plate.h;
    const topAll = plateVerticalH * topN;
    const startArc = ctx?.startTrim ? effectiveStartArc(cl, ctx.startTrim) : 0;
    const endArc = effectiveEndArc(cl, ctx?.endTrim ?? null);
    parts.push(makePlate(
      "Schwelle",
      "sillPlate",
      cl,
      baseZ,
      plateVerticalH,
      plateAcrossWall,
      opts.material,
      plate,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null
    ));
    for (let i = 0; i < topN; i++) {
      const z = baseZ + wallH - topAll + i * plateVerticalH;
      parts.push(makePlate(
        topN > 1 ? `R\xE4hm ${i + 1}` : "R\xE4hm",
        "topPlate",
        cl,
        z,
        plateVerticalH,
        plateAcrossWall,
        opts.material,
        plate,
        ctx?.startTrim ?? null,
        ctx?.endTrim ?? null
      ));
    }
    const studZ0 = baseZ + plateVerticalH;
    const studH = wallH - plateVerticalH - topAll;
    const openingExtents = [];
    let openingIdx = 0;
    for (const o of wall.openings) {
      openingIdx++;
      const uL = o.centerlinePosition - o.width / 2;
      const uR = o.centerlinePosition + o.width / 2;
      openingExtents.push({ uL, uR });
      addOpeningFramingDE(parts, wall, o, uL, uR, openingIdx, opts, studZ0, studH);
    }
    const channelZones = [];
    if (ctx?.tJunctions) {
      for (const j of ctx.tJunctions) {
        const placed = addChannelStuds(parts, cl, j, stud, opts.material, studZ0, studH);
        channelZones.push(...placed);
      }
    }
    const mandatoryZones = addEndAndCornerStuds(
      parts,
      wall,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null,
      stud,
      opts.material,
      studZ0,
      studH
    );
    const edgeSkip = opts.doubledKings ? stud.w * 1.5 : stud.h * 0.5;
    let studIdx = 0;
    for (let m = startArc + sp; m < endArc; m += sp) {
      const inOpening = openingExtents.some(
        (r) => m >= r.uL - edgeSkip && m <= r.uR + edgeSkip
      );
      if (inOpening) continue;
      const inChannel = channelZones.some((p) => Math.abs(p - m) < stud.h);
      if (inChannel) continue;
      const nearMandatory = mandatoryZones.some((p) => Math.abs(p - m) < stud.h);
      if (nearMandatory) continue;
      parts.push(makeStud(
        `St\xE4nder ${++studIdx}`,
        "stud",
        pointAt(cl, m),
        tangentAt(cl, m),
        studZ0,
        studH,
        stud,
        opts.material
      ));
    }
    return parts;
  };
}
function addOpeningFramingDE(parts, wall, opening, uL, uR, idx, opts, studZ0, studH) {
  const cl = wall.centerline;
  const stud = opts.studProfile;
  const plate = opts.plateProfile;
  const placeEdgeKings = (mEdge, side) => {
    const sign = side === "L" ? -1 : 1;
    const m1 = mEdge + sign * stud.w * 0.5;
    parts.push(makeStud(
      `St\xE4nder Kant ${side} (op ${idx})`,
      "stud",
      pointAt(cl, m1),
      tangentAt(cl, m1),
      studZ0,
      studH,
      stud,
      opts.material
    ));
    if (opts.doubledKings) {
      const m2 = mEdge + sign * stud.w * 1.5;
      parts.push(makeStud(
        `Doppelst\xE4nder ${side} (op ${idx})`,
        "stud",
        pointAt(cl, m2),
        tangentAt(cl, m2),
        studZ0,
        studH,
        stud,
        opts.material
      ));
    }
  };
  placeEdgeKings(uL, "L");
  placeEdgeKings(uR, "R");
  addHeaderSillCripples(
    parts,
    wall,
    opening,
    uL,
    uR,
    idx,
    stud,
    plate,
    opts.material,
    opts.topPlateCount,
    opts.studSpacing,
    opts.headerDepth,
    {
      headerMargin: stud.w * 0.5,
      headerLabel: "Sturz",
      headerName: "Sturz",
      sillMargin: stud.w * 0.5,
      sillLabel: "Br\xFCstungsriegel",
      sillName: "Br\xFCstungsriegel",
      crippleUpLabel: "Kopfriegel",
      crippleDownLabel: "Fu\xDFriegel",
      crippleMargin: stud.w * 2.5
    }
  );
}
function holzrahmenbauLayers(opts = {}) {
  const layers = [];
  const intBoard = opts.interiorBoard ?? { material: "Gipsfaser", thickness: 0.0125 };
  const instCav = opts.installationCavity ?? { thickness: 0.03 };
  const vapour = opts.vapourBarrier ?? { material: "Dampfbremse" };
  const insul = opts.insulation ?? { material: "Mineralwolle", thickness: 0.12 };
  const extBoard = opts.exteriorBoard ?? { material: "DWD-Platte", thickness: 0.016 };
  const weather = opts.weatherMembrane ?? { material: "Wind-/Wetterbahn" };
  const battens = opts.ventilationBattens ?? { thickness: 0.03 };
  const cladding = opts.cladding ?? { material: "Holzfassade", thickness: 0.02 };
  layers.push({ material: intBoard.material, thickness: intBoard.thickness, position: "interior" });
  layers.push({
    material: "Installationsebene",
    thickness: instCav.thickness,
    position: "interior",
    properties: { airGap: true }
  });
  layers.push({
    material: vapour.material,
    thickness: 2e-4,
    position: "core",
    properties: { sd: 100 }
  });
  layers.push({
    material: insul.material,
    thickness: insul.thickness,
    position: "core",
    properties: { lambda: 0.035 }
  });
  layers.push({
    material: extBoard.material,
    thickness: extBoard.thickness,
    position: "exterior",
    properties: { sd: 0.2 }
  });
  layers.push({ material: weather.material, thickness: 5e-4, position: "exterior" });
  layers.push({
    material: "Lattung",
    thickness: battens.thickness,
    position: "exterior",
    properties: { ventilated: true }
  });
  layers.push({ material: cladding.material, thickness: cladding.thickness, position: "exterior" });
  return layers;
}

// src/bim/walls/clt.ts
var DEFAULT_LAMELLAE = [0.04, 0.02, 0.04, 0.02, 0.04];
function cltLayers(opts = {}) {
  const lamellae = opts.lamellae ?? DEFAULT_LAMELLAE;
  const grade = opts.grade ?? "C24";
  return lamellae.map((thk, i) => ({
    material: `CLT ${grade} (${(thk * 1e3).toFixed(0)} mm)`,
    thickness: thk,
    position: i === 0 ? "interior" : i === lamellae.length - 1 ? "exterior" : "core",
    properties: { grainDirection: i % 2 === 0 ? "longitudinal" : "transverse" }
  }));
}
var CltConstruction = (wall) => [{
  name: "CLT panel",
  role: "monolithic",
  mesh: wall.toMesh(),
  material: "CLT",
  ifcType: "IfcWall"
}];

// src/bim/slabs/orientation.ts
function chooseJoistDirection(slab, opts = {}) {
  const method = opts.method ?? "auto";
  if ((method === "auto" || method === "supports") && opts.supports && opts.supports.length >= 2) {
    const fromSupports = joistDirectionFromSupports(slab, opts.supports, opts.angleTolerance);
    if (fromSupports) return fromSupports;
  }
  return joistDirectionFromBounds(slab.boundary);
}
function joistDirectionFromBounds(boundary) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of boundary) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = maxX - minX;
  const dy = maxY - minY;
  return dx > dy ? new Vec2(0, 1) : new Vec2(1, 0);
}
function joistDirectionFromPCA(boundary) {
  if (boundary.length < 3) return new Vec2(1, 0);
  let cx = 0, cy = 0;
  for (const p of boundary) {
    cx += p.x;
    cy += p.y;
  }
  cx /= boundary.length;
  cy /= boundary.length;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of boundary) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  sxx /= boundary.length;
  sxy /= boundary.length;
  syy /= boundary.length;
  const trace = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, trace * trace * 0.25 - det));
  const lamMajor = trace * 0.5 + disc;
  let mx, my;
  if (Math.abs(sxy) > 1e-12) {
    mx = lamMajor - syy;
    my = sxy;
  } else {
    mx = sxx >= syy ? 1 : 0;
    my = sxx >= syy ? 0 : 1;
  }
  const len = Math.hypot(mx, my);
  if (len < 1e-12) return new Vec2(1, 0);
  return new Vec2(-my / len, mx / len);
}
function joistDirectionFromSupports(_slab, supports, angleTol = 5 * Math.PI / 180) {
  if (supports.length < 2) return null;
  const groups = [];
  for (const w of supports) {
    const cl = w.centerline;
    if (cl.length < 2) continue;
    const dx = cl[cl.length - 1].x - cl[0].x;
    const dy = cl[cl.length - 1].y - cl[0].y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const tx = dx / len, ty = dy / len;
    let angle = Math.atan2(ty, tx);
    if (angle < 0) angle += Math.PI;
    if (angle >= Math.PI) angle -= Math.PI;
    let merged = false;
    for (const g of groups) {
      const dAng = Math.abs(angle - g.angle);
      const wrap = Math.min(dAng, Math.PI - dAng);
      if (wrap < angleTol) {
        g.walls.push(w);
        merged = true;
        break;
      }
    }
    if (!merged) groups.push({ angle, tangent: new Vec2(tx, ty), walls: [w] });
  }
  let best = null;
  for (const g of groups) {
    if (g.walls.length < 2) continue;
    const perp = new Vec2(-g.tangent.y, g.tangent.x);
    let minP = Infinity, maxP = -Infinity;
    for (const w of g.walls) {
      const cl = w.centerline;
      const midX = (cl[0].x + cl[cl.length - 1].x) * 0.5;
      const midY = (cl[0].y + cl[cl.length - 1].y) * 0.5;
      const proj = midX * perp.x + midY * perp.y;
      if (proj < minP) minP = proj;
      if (proj > maxP) maxP = proj;
    }
    const span = maxP - minP;
    if (!best || span < best.span) best = { tangent: g.tangent, span };
  }
  if (!best) return null;
  return new Vec2(-best.tangent.y, best.tangent.x);
}
function lineClipPolygon(origin, direction, boundary) {
  const hits = [];
  const dx = direction.x, dy = direction.y;
  for (let i = 0; i < boundary.length - 1; i++) {
    const a = boundary[i];
    const b = boundary[i + 1];
    const ex = b.x - a.x, ey = b.y - a.y;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) continue;
    const s = ((a.x - origin.x) * ey - (a.y - origin.y) * ex) / denom;
    const u = ((a.x - origin.x) * dy - (a.y - origin.y) * dx) / denom;
    if (u < -1e-9 || u > 1 + 1e-9) continue;
    hits.push(s);
  }
  hits.sort((a, b) => a - b);
  const dedup = [];
  for (const h of hits) {
    if (dedup.length === 0 || Math.abs(dedup[dedup.length - 1] - h) > 1e-6) {
      dedup.push(h);
    }
  }
  return dedup;
}

// src/bim/slabs/types.ts
var SlabOpening = class {
  constructor(centerX, centerY, width, depth, name) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.width = width;
    this.depth = depth;
    this.name = name;
  }
};
var SlabType = class {
  constructor(opts) {
    this.name = opts.name;
    this.description = opts.description;
    this.construction = opts.construction;
    this.layers = opts.layers;
    this.properties = opts.properties ?? {};
    this.defaultJoistSpacing = opts.defaultJoistSpacing;
    this.defaultJoistProfile = opts.defaultJoistProfile;
    this.defaultMaterial = opts.defaultMaterial;
  }
  get layeredThickness() {
    return (this.layers ?? []).reduce((s, l) => s + l.thickness, 0);
  }
};
var Slab = class {
  constructor(opts) {
    this.openings = [];
    this.boundary = opts.boundary;
    this.thickness = opts.thickness ?? 0.2;
    this.elevation = opts.elevation ?? 0;
    this.name = opts.name;
    this.type = opts.type;
    this.properties = opts.properties;
    if (opts.openings) this.openings.push(...opts.openings);
    this.joistDirection = opts.joistDirection;
  }
  /** Total perimeter length (m). */
  get perimeter() {
    let total = 0;
    const b = this.boundary;
    for (let i = 0; i < b.length - 1; i++) total += b[i].distTo(b[i + 1]);
    return total;
  }
  /** Slab footprint area (m²). Uses signed-area magnitude. */
  get area() {
    return Math.abs(Polygon2D.signedArea(this.boundary));
  }
  /**
   * The openings as rings in the XY plane (counter-clockwise, open): each a rectangle
   * `width` along `direction` and `depth` across it, about its centre. `direction` defaults
   * to the way `JoistedSlab` runs its joists without a context: `joistDirection`, else the
   * one the bounds suggest. Throws for an opening that is empty or not inside the boundary.
   */
  openingRings(direction = this.joistDirection ?? joistDirectionFromBounds(this.boundary)) {
    const u = direction.normalize();
    const v = u.perp();
    const outer = Polygon2D.openRing(this.boundary);
    return this.openings.map((o, i) => {
      const label = `Slab "${this.name ?? "slab"}": opening ${o.name ?? i}`;
      if (!(o.width > 0 && o.depth > 0)) throw new Error(`${label} needs a width and depth above 0, got ${o.width} \xD7 ${o.depth}.`);
      const c = new Vec2(o.centerX, o.centerY), a = u.mul(o.width / 2), b = v.mul(o.depth / 2);
      const ring = [c.sub(a).sub(b), c.add(a).sub(b), c.add(a).add(b), c.sub(a).add(b)];
      if (!ring.every((p) => Polygon2D.pointInPolygon(p, outer))) {
        throw new Error(`${label} at (${o.centerX}, ${o.centerY}) is not inside the slab's boundary.`);
      }
      return ring;
    });
  }
  /**
   * Build the slab envelope mesh: top and bottom faces with the openings cut out, the
   * outside edge and the openings' sides.
   */
  toMesh() {
    const outer = Polygon2D.openRing(this.boundary);
    if (outer.length < 3) {
      return new Mesh(new Float32Array(), new Uint32Array(), new Float32Array());
    }
    const zTop = this.elevation;
    const zBot = this.elevation - this.thickness;
    const wound = (r, ccw) => Polygon2D.signedArea(r) > 0 === ccw ? r : r.slice().reverse();
    const rings = [wound(outer, true), ...this.openingRings().map((r) => wound(r, false))];
    const all = rings.flat();
    const tris = Polygon2D.triangulateWithHoles(rings[0], rings.slice(1));
    const positions = [];
    const normals = [];
    const indices = [];
    const topBase = positions.length / 3;
    for (const p of all) {
      positions.push(p.x, p.y, zTop);
      normals.push(0, 0, 1);
    }
    for (const [a, b2, c] of tris) indices.push(topBase + a, topBase + b2, topBase + c);
    const botBase = positions.length / 3;
    for (const p of all) {
      positions.push(p.x, p.y, zBot);
      normals.push(0, 0, -1);
    }
    for (const [a, b2, c] of tris) indices.push(botBase + c, botBase + b2, botBase + a);
    for (const ring of rings) {
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const p0 = ring[i];
        const p1 = ring[(i + 1) % n];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len = Math.hypot(dx, dy);
        if (len < 1e-9) continue;
        const nx = dy / len, ny = -dx / len;
        const base = positions.length / 3;
        positions.push(p0.x, p0.y, zBot, p1.x, p1.y, zBot, p1.x, p1.y, zTop, p0.x, p0.y, zTop);
        for (let k = 0; k < 4; k++) normals.push(nx, ny, 0);
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    return new Mesh(new Float32Array(positions), new Uint32Array(indices), new Float32Array(normals));
  }
};
function realizeSlab(slab, ctx) {
  const type = slab.type;
  const envelopeMesh = slab.toMesh();
  const parts = type?.construction ? type.construction(slab, ctx) : [];
  const layers = type?.layers ?? [];
  const properties = { ...type?.properties ?? {}, ...slab.properties ?? {} };
  return { slab, parts, layers, envelopeMesh, properties, joistDirection: ctx?.joistDirection };
}

// src/bim/slabs/solid.ts
var SolidSlabConstruction = (slab) => [{
  name: "shell",
  role: "monolithic",
  mesh: slab.toMesh(),
  ifcType: "IfcSlab"
}];

// src/bim/slabs/joisted.ts
var DEFAULTS4 = {
  profile: { w: 0.06, h: 0.22, name: "KVH 60\xD7220" },
  spacing: 0.625,
  material: "KVH C24",
  rim: true,
  rimProfile: { w: 0.06, h: 0.22, name: "KVH 60\xD7220 (rim)" },
  edgeOffset: -1,
  // sentinel — resolved per-call to `spacing/2`
  bearingGap: 0.01,
  sheathingThickness: 0.022,
  sheathingMaterial: "OSB",
  ceilingThickness: 0.0125,
  ceilingMaterial: "Gipsfaser"
};
function JoistedSlab(options = {}) {
  const opts = { ...DEFAULTS4, ...options };
  return (slab, ctx) => {
    const direction = slab.joistDirection ?? ctx?.joistDirection ?? joistDirectionFromBounds(slab.boundary);
    const perp = new Vec2(-direction.y, direction.x);
    const parts = [];
    const joistTopZ = slab.elevation - opts.sheathingThickness;
    const joistBottomZ = joistTopZ - opts.profile.h;
    const closingRing = ensureClosedRing(slab.boundary);
    const rimW = opts.rim ? opts.rimProfile.w : 0;
    const bearingGap = Math.max(0, opts.bearingGap);
    const edgeOffset = opts.edgeOffset >= 0 ? opts.edgeOffset : opts.spacing * 0.5;
    let regularJoistClipBoundary = closingRing;
    if (opts.rim) {
      const rimCenterline = ensureClosedRing(Polygon2D.offset(stripClose(closingRing), -rimW * 0.5));
      const rimRibbon = new ExtrudedRibbon({
        centerline: rimCenterline,
        width: rimW,
        height: opts.rimProfile.h,
        baseZ: joistBottomZ
      });
      parts.push({
        name: "Rim joist",
        role: "beam",
        mesh: rimRibbon.toMesh(),
        material: opts.material,
        profile: opts.rimProfile,
        length: ringPerimeter(rimCenterline),
        ifcType: "IfcMember"
      });
      regularJoistClipBoundary = ensureClosedRing(
        Polygon2D.offset(stripClose(closingRing), -(rimW + bearingGap))
      );
    } else if (bearingGap > 1e-9) {
      regularJoistClipBoundary = ensureClosedRing(
        Polygon2D.offset(stripClose(closingRing), -bearingGap)
      );
    }
    let minP = Infinity, maxP = -Infinity;
    for (const p of regularJoistClipBoundary) {
      const proj = p.x * perp.x + p.y * perp.y;
      if (proj < minP) minP = proj;
      if (proj > maxP) maxP = proj;
    }
    const at = (t, p) => new Vec2(direction.x * t + perp.x * p, direction.y * t + perp.y * p);
    const member = (name, role, a, b) => {
      const length = a.distTo(b);
      if (length < 0.01) return;
      const ribbon = new ExtrudedRibbon({ centerline: [a, b], width: opts.profile.w, height: opts.profile.h, baseZ: joistBottomZ });
      parts.push({ name, role, mesh: ribbon.toMesh(), material: opts.material, profile: opts.profile, length, ifcType: "IfcMember" });
    };
    const span = (p) => {
      const hits = lineClipPolygon(at(0, p), direction, regularJoistClipBoundary);
      return hits.length < 2 ? null : [hits[0], hits[hits.length - 1]];
    };
    const w = opts.profile.w;
    const wells = slab.openingRings(direction).map((ring) => {
      const ts = ring.map((q) => q.dot(direction)), ps = ring.map((q) => q.dot(perp));
      return { t0: Math.min(...ts), t1: Math.max(...ts), p0: Math.min(...ps), p1: Math.max(...ps) };
    });
    const trimmerPs = wells.flatMap((o) => [o.p0 - w / 2, o.p1 + w / 2]);
    const startP = minP + edgeOffset;
    const endP = maxP - edgeOffset;
    let joistIdx = 0;
    for (let p = startP; p <= endP + 1e-6; p += opts.spacing) {
      if (trimmerPs.some((tp) => Math.abs(p - tp) < w)) continue;
      const range = span(p);
      if (!range) continue;
      let pieces = [range];
      for (const o of wells) {
        if (p <= o.p0 - w / 2 || p >= o.p1 + w / 2) continue;
        const cut0 = o.t0 - w - bearingGap, cut1 = o.t1 + w + bearingGap;
        pieces = pieces.flatMap(([a, b]) => cut1 <= a || cut0 >= b ? [[a, b]] : [[a, Math.min(b, cut0)], [Math.max(a, cut1), b]]);
      }
      for (const [a, b] of pieces) member(`Joist ${++joistIdx}`, "joist", at(a, p), at(b, p));
    }
    wells.forEach((o, i) => {
      const n = wells.length > 1 ? ` ${i + 1}` : "";
      for (const [k, p] of [o.p0 - w / 2, o.p1 + w / 2].entries()) {
        const range = span(p);
        if (range) member(`Trimmer${n}${k ? "b" : "a"}`, "trimmer", at(range[0], p), at(range[1], p));
      }
      for (const [k, t] of [o.t0 - w / 2, o.t1 + w / 2].entries()) {
        member(`Header${n}${k ? "b" : "a"}`, "header", at(t, o.p0 + bearingGap), at(t, o.p1 - bearingGap));
      }
    });
    if (opts.sheathingThickness > 1e-6) {
      const sheathingSlab = makeFlatPlate(slab, direction, slab.elevation - opts.sheathingThickness, opts.sheathingThickness);
      parts.push({
        name: "Sheathing",
        role: "sheathing",
        mesh: sheathingSlab,
        material: opts.sheathingMaterial,
        ifcType: "IfcPlate"
      });
    }
    if (opts.ceilingThickness > 1e-6) {
      const ceilingZ = joistBottomZ - opts.ceilingThickness;
      const ceilingMesh = makeFlatPlate(slab, direction, ceilingZ, opts.ceilingThickness);
      parts.push({
        name: "Ceiling",
        role: "ceiling",
        mesh: ceilingMesh,
        material: opts.ceilingMaterial,
        ifcType: "IfcCovering"
      });
    }
    return parts;
  };
}
function stripClose(polygon) {
  return Polygon2D.openRing(polygon);
}
function ensureClosedRing(polygon) {
  return Polygon2D.closeRing(polygon);
}
function ringPerimeter(closedRing) {
  return Polygon2D.polylineLength(closedRing);
}
function makeFlatPlate(slab, direction, baseZ, thickness) {
  return new Slab({
    boundary: slab.boundary,
    thickness,
    elevation: baseZ + thickness,
    openings: slab.openings,
    joistDirection: direction
  }).toMesh();
}

// src/bim/openings.ts
var OpeningType = class _OpeningType {
  constructor(opts) {
    this.name = opts.name;
    this.kind = opts.kind ?? "door";
    this.operation = opts.operation ?? "not_defined";
    this.partitioning = opts.partitioning ?? "not_defined";
    this.material = opts.material;
    this.description = opts.description;
    this.properties = opts.properties ?? {};
  }
  /** Convenience: a swinging interior/exterior door type. */
  static door(name, opts = {}) {
    return new _OpeningType({ ...opts, name, kind: "door" });
  }
  /** Convenience: a window type. */
  static window(name, opts = {}) {
    return new _OpeningType({ ...opts, name, kind: "window" });
  }
};

// src/bim/spaces.ts
var Space = class {
  constructor(opts) {
    if (opts.boundary.length < 3) {
      throw new Error("Space: boundary needs \u2265 3 points");
    }
    this.name = opts.name;
    this.boundary = opts.boundary;
    this.elevation = opts.elevation ?? 0;
    this.height = opts.height ?? 2.7;
    this.function = opts.function;
    this.properties = opts.properties ?? {};
  }
  /** Floor area of the boundary polygon (shoelace formula), in m². */
  area() {
    const b = this.boundary;
    let a = 0;
    for (let i = 0, n = b.length; i < n; i++) {
      const p = b[i];
      const q = b[(i + 1) % n];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) * 0.5;
  }
  /** Approximate room volume (floor area × clear height), in m³. */
  volume() {
    return this.area() * this.height;
  }
};
function boundingWalls(space, walls, tol = 0.35) {
  const ring = space.boundary;
  const n = ring.length;
  const out = [];
  for (const wall of walls) {
    const cl = wall.centerline;
    let bounds = false;
    for (let e = 0; e < n && !bounds; e++) {
      const a = ring[e];
      const b = ring[(e + 1) % n];
      for (let s = 0; s < cl.length - 1 && !bounds; s++) {
        if (segmentAlongEdge(cl[s], cl[s + 1], a, b, tol)) bounds = true;
      }
    }
    if (bounds) out.push(wall);
  }
  return out;
}
function segmentAlongEdge(c, d, a, b, tol) {
  const ex = b.x - a.x, ey = b.y - a.y;
  const elen = Math.hypot(ex, ey);
  if (elen < 1e-9) return false;
  const ux = ex / elen, uy = ey / elen;
  const perp = (px, py) => Math.abs((px - a.x) * -uy + (py - a.y) * ux);
  if (perp(c.x, c.y) > tol || perp(d.x, d.y) > tol) return false;
  const wx = d.x - c.x, wy = d.y - c.y;
  const wlen = Math.hypot(wx, wy);
  if (wlen < 1e-9) return false;
  if (Math.abs((wx * ux + wy * uy) / wlen) < 0.99) return false;
  const tc = (c.x - a.x) * ux + (c.y - a.y) * uy;
  const td = (d.x - a.x) * ux + (d.y - a.y) * uy;
  const lo = Math.max(0, Math.min(tc, td));
  const hi = Math.min(elen, Math.max(tc, td));
  return hi - lo > 0.1;
}

// src/bim/stairs.ts
var StairType = class {
  constructor(opts) {
    this.name = opts.name;
    this.shape = opts.shape ?? "straight_run";
    this.material = opts.material;
    this.description = opts.description;
    this.properties = opts.properties ?? {};
  }
};
var Stair = class {
  constructor(opts) {
    if (!(opts.totalRise > 0)) throw new Error("Stair: totalRise must be > 0");
    this.name = opts.name ?? "Stair";
    this.start = opts.start;
    this.direction = opts.direction ?? new Vec2(1, 0);
    this.width = opts.width ?? 1;
    this.totalRise = opts.totalRise;
    this.riserHeight = opts.riserHeight ?? 0.18;
    this.treadDepth = opts.treadDepth ?? 0.27;
    this.type = opts.type;
    this.properties = opts.properties ?? {};
  }
  /** Number of risers, chosen so the actual riser is closest to the target. */
  get risers() {
    return Math.max(1, Math.round(this.totalRise / this.riserHeight));
  }
  /** Actual riser height (`totalRise` split evenly). */
  get actualRiser() {
    return this.totalRise / this.risers;
  }
  /**
   * Compute the flight geometry. A straight run is a single flight built as
   * a stepped solid: step i is a box spanning going [i·tread, (i+1)·tread],
   * rising from the floor to (i+1)·riser, across the full width.
   */
  flights() {
    const risers = this.risers;
    const riser = this.actualRiser;
    const tread = this.treadDepth;
    const dLen = Math.hypot(this.direction.x, this.direction.y) || 1;
    const ux = this.direction.x / dLen;
    const uy = this.direction.y / dLen;
    const ax = -uy;
    const ay = ux;
    const halfW = this.width * 0.5;
    const sx = this.start.x, sy = this.start.y, sz = this.start.z;
    const positions = [];
    const indices = [];
    const push = (along, across, z) => {
      const x = sx + ux * along + ax * across;
      const y = sy + uy * along + ay * across;
      positions.push(x, y, z);
      return positions.length / 3 - 1;
    };
    for (let i = 0; i < risers; i++) {
      const a0 = i * tread;
      const a1 = (i + 1) * tread;
      const z0 = sz;
      const z1 = sz + (i + 1) * riser;
      const flb = push(a0, -halfW, z0), frb = push(a1, -halfW, z0);
      const blb = push(a0, +halfW, z0), brb = push(a1, +halfW, z0);
      const flt = push(a0, -halfW, z1), frt = push(a1, -halfW, z1);
      const blt = push(a0, +halfW, z1), brt = push(a1, +halfW, z1);
      pushBox(indices, flb, frb, brb, blb, flt, frt, brt, blt);
    }
    return [{
      name: `${this.name} flight`,
      positions,
      indices,
      risers,
      treads: Math.max(0, risers - 1),
      riserHeight: riser,
      treadDepth: tread
    }];
  }
};
function pushBox(out, flb, frb, brb, blb, flt, frt, brt, blt) {
  const quad = (a, b, c, d) => {
    out.push(a, b, c, a, c, d);
  };
  quad(flb, blb, brb, frb);
  quad(flt, frt, brt, blt);
  quad(flb, frb, frt, flt);
  quad(brb, blb, blt, brt);
  quad(frb, brb, brt, frt);
  quad(blb, flb, flt, blt);
}

// src/scene/Scene.ts
var DEFAULT_STYLE2 = {
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
    if (this.currentKey !== void 0 && obj.key === void 0) obj.key = this.currentKey;
    this.objects.set(obj.id, obj);
    this.emit({ type: "object:add", id: obj.id });
    return obj;
  }
  /**
   * Run `fn`; every object it adds carries `key` (the record it shows) from creation, so
   * listeners — renderer, Markup, snapshots — see it with the add. Nested calls use the
   * innermost key. `bindScene` does this for each record.
   */
  withKey(key, fn) {
    const outer = this.currentKey;
    this.currentKey = key;
    try {
      return fn();
    } finally {
      this.currentKey = outer;
    }
  }
  /** The objects showing one record (see `withKey`). */
  byKey(key) {
    const out = [];
    for (const o of this.objects.values()) if (o.key === key) out.push(o);
    return out;
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
      style: { ...DEFAULT_STYLE2, color: "#ff6b6b", pointSize: 0.1, ...style },
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
      style: { ...DEFAULT_STYLE2, color: "#4dabf7", ...style },
      interactive: true,
      data: {}
    });
  }
  addPolygon(vertices, style) {
    return this.add({
      id: this.genId("poly"),
      type: "polygon",
      vertices,
      style: { ...DEFAULT_STYLE2, color: "#51cf66", opacity: 0.6, ...style },
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
      style: { ...DEFAULT_STYLE2, color: "#4dabf7", ...style },
      interactive: false,
      data: {}
    });
  }
  addMesh(mesh, style) {
    return this.add({
      id: this.genId("mesh"),
      type: "mesh",
      mesh,
      style: { ...DEFAULT_STYLE2, color: "#845ef7", ...style },
      interactive: true,
      data: {}
    });
  }
  addFlatMesh(data, style) {
    return this.add({
      id: this.genId("mesh"),
      type: "mesh",
      flatMeshData: data,
      style: { ...DEFAULT_STYLE2, color: "#845ef7", ...style },
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
      style: { ...DEFAULT_STYLE2, color: "#ffd43b", ...style },
      interactive: true,
      data: {}
    });
  }
  /**
   * A light in the model, at `position`: a point light, or a spot aimed at `spec.target`.
   * Like any object it is keyed, re-made by a sketch re-run and hidden by `style.visible`;
   * the renderer lights the scene with it in both lighting modes, without shadows (a point
   * light's shadow is six renders, per light). Its colour is `style.color` (default white).
   *
   *   scene.addLight(new Vec3(2, 3, 2.4), { intensity: 6 });
   *   scene.addLight(new Vec3(0, 0, 3), { kind: "spot", target: new Vec3(0, 2, 0), angle: 25 }, { color: "#ffd2a0" });
   */
  addLight(position, spec = {}, style) {
    const kind = spec.kind ?? "point";
    const fail = (why) => {
      throw new Error(`addLight: ${why}`);
    };
    if (![position.x, position.y, position.z].every(Number.isFinite)) fail(`a non-finite position (${position.x}, ${position.y}, ${position.z})`);
    const intensity = spec.intensity ?? 4, range = spec.range ?? 8, angle = spec.angle ?? 30;
    if (!(intensity >= 0)) fail(`intensity must be 0 or more, got ${spec.intensity}`);
    if (!(range >= 0)) fail(`range must be 0 or more (0: without limit), got ${spec.range}`);
    if (kind === "spot" && !spec.target) fail(`a spot needs a target to aim at`);
    if (kind === "spot" && !(angle > 0 && angle < 90)) fail(`a spot's angle is a half angle between 0 and 90 degrees, got ${spec.angle}`);
    return this.add({
      id: this.genId("light"),
      type: "light",
      position,
      light: { kind, intensity, range, angle, ...spec.target ? { target: spec.target } : {} },
      style: { ...DEFAULT_STYLE2, color: "#ffffff", ...style },
      interactive: false,
      data: {}
    });
  }
  addPlane(normal, distance, style) {
    return this.add({
      id: this.genId("plane"),
      type: "plane",
      normal,
      distance,
      style: { ...DEFAULT_STYLE2, color: "#aaaaaa", opacity: 0.3, ...style },
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
function createParams(schema) {
  return new ParamStore(schema);
}
function createLayout(folders) {
  return { folders };
}

// src/bim/adjacency.ts
function boxOf(positions) {
  if (!positions.length) return null;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i + 2 < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  return { min, max };
}
function share(aMin, aMax, bMin, bMax) {
  return Math.min(aMax, bMax) - Math.max(aMin, bMin);
}
function contactBetween(a, b, opts = {}) {
  const tol = opts.tolerance ?? 0.05;
  const up = opts.up ?? 2;
  const gaps = [0, 1, 2].map((k) => share(a.min[k], a.max[k], b.min[k], b.max[k]));
  if (gaps.some((g) => g < -tol)) return null;
  const flat = [0, 1, 2].filter((k) => k !== up);
  const area = flat.reduce((p, k) => p * Math.max(0, gaps[k]), 1);
  const footprint = (box) => flat.reduce((p, k) => p * (box.max[k] - box.min[k]), 1);
  const smaller = Math.min(footprint(a), footprint(b));
  const overlap = smaller > 0 ? Math.min(1, area / smaller) : 0;
  const verticalTouch = gaps[up] <= tol;
  if (verticalTouch) {
    if (overlap < (opts.minOverlap ?? 0.02)) return null;
    const aAbove = a.min[up] >= b.max[up] - tol;
    const bAbove = b.min[up] >= a.max[up] - tol;
    if (aAbove) return { contact: "supportedBy", overlap };
    if (bAbove) return { contact: "supports", overlap };
  }
  if (flat.some((k) => gaps[k] <= tol)) return { contact: "abuts", overlap };
  return { contact: "overlaps", overlap };
}
function reverse(contact) {
  return contact === "supports" ? "supportedBy" : contact === "supportedBy" ? "supports" : contact;
}
function findAdjacent(elements, opts = {}) {
  const tol = opts.tolerance ?? 0.05;
  const up = opts.up ?? 2;
  const sorted = [...elements].sort((p, q) => p.box.min[up] - q.box.min[up]);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (b.box.min[up] > a.box.max[up] + tol) break;
      const met = contactBetween(a.box, b.box, opts);
      if (!met) continue;
      out.push({
        a: a.id,
        b: b.id,
        contact: met.contact,
        tolerance: tol,
        overlap: met.overlap
      });
    }
  }
  return out;
}
function neighboursOf(id, all) {
  const out = [];
  for (const r of all) {
    if (r.a === id) out.push({ id: r.b, contact: r.contact, overlap: r.overlap, tolerance: r.tolerance });
    else if (r.b === id) out.push({ id: r.a, contact: reverse(r.contact), overlap: r.overlap, tolerance: r.tolerance });
  }
  return out;
}

// src/collab/SharedStore.ts
var PALETTE = ["#e8590c", "#1c7ed6", "#2f9e44", "#ae3ec9", "#f08c00", "#0ca678", "#d6336c", "#4263eb"];
function collabColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = h * 31 + id.charCodeAt(i) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
var SharedStore = class {
  constructor(opts) {
    /** This client (tab). */
    this.session = randomId();
    this.records = /* @__PURE__ */ new Map();
    /** Keys written here and not yet confirmed by the backend: remote versions wait … */
    this.pending = /* @__PURE__ */ new Map();
    /** … here (the newest per key), and the newer of it and ours wins on confirmation. */
    this.deferred = /* @__PURE__ */ new Map();
    this._status = "offline";
    this._user = null;
    this._presence = [];
    this.myState = {};
    this.unsub = null;
    this.unsubUser = null;
    this.changeL = /* @__PURE__ */ new Set();
    this.presenceL = /* @__PURE__ */ new Set();
    this.statusL = /* @__PURE__ */ new Set();
    this.userL = /* @__PURE__ */ new Set();
    this.broadcastL = /* @__PURE__ */ new Set();
    this.errorL = /* @__PURE__ */ new Set();
    this.doc = opts.doc;
    this.adapter = opts.adapter;
    this.color = opts.color;
  }
  /** Load the document and go live. Safe to call again after `disconnect()`. */
  async connect() {
    this.setStatus("connecting");
    this._user = await this.adapter.user();
    this.unsubUser = this.adapter.onUser?.((u) => {
      this._user = u;
      this.announce();
      for (const l of this.userL) l(u);
    }) ?? null;
    this.unsub = this.adapter.subscribe(this.doc, this.session, {
      record: (rec) => this.receive(rec),
      presence: (list) => {
        this._presence = list;
        for (const l of this.presenceL) l(list);
      },
      broadcast: (event, payload, from) => {
        if (from !== this.session) for (const l of this.broadcastL) l(event, payload, from);
      },
      status: (s, d) => this.setStatus(s, d)
    });
    try {
      const all = await this.adapter.load(this.doc);
      const keys = [];
      for (const rec of all) if (this.take(rec)) keys.push(rec.key);
      if (keys.length) this.emit(keys, "remote");
    } catch (e) {
      this.setStatus("error", String(e));
      throw e;
    }
    this.announce();
  }
  disconnect() {
    this.unsub?.();
    this.unsub = null;
    this.unsubUser?.();
    this.unsubUser = null;
    this.setStatus("offline");
  }
  // ── records ──
  get(key) {
    const r = this.records.get(key);
    return r && r.value !== null ? r.value : void 0;
  }
  has(key) {
    return this.get(key) !== void 0;
  }
  /** Live entries (removed records left out). */
  entries() {
    const out = [];
    for (const [k, r] of this.records) if (r.value !== null) out.push([k, r.value]);
    return out;
  }
  /** Who wrote a key last, and when (backend time). */
  meta(key) {
    const r = this.records.get(key);
    return r && { by: r.by, at: r.at };
  }
  /** Write a key: applied here at once, then stored; on failure the stored version comes back. */
  set(key, value) {
    const before = this.records.get(key);
    const ticket = (this.pending.get(key) ?? 0) + 1;
    this.pending.set(key, ticket);
    this.records.set(key, { key, value, by: this._user?.id ?? "", at: before?.at ?? 0 });
    this.emit([key], "local");
    const settle = () => {
      if (this.pending.get(key) !== ticket) return false;
      this.pending.delete(key);
      const d = this.deferred.get(key);
      this.deferred.delete(key);
      return d ? this.take(d) : false;
    };
    this.adapter.put(this.doc, key, value).then(
      (stored) => {
        this.take(stored, true);
        if (settle()) this.emit([key], "remote");
      },
      (err) => {
        if (this.pending.get(key) === ticket) {
          if (before) this.records.set(key, before);
          else this.records.delete(key);
          settle();
          this.emit([key], "remote");
        }
        const msg = String(err?.message ?? err);
        for (const l of this.errorL) l(key, msg);
      }
    );
  }
  delete(key) {
    this.set(key, null);
  }
  // ── presence, broadcasts ──
  get presence() {
    return this._presence;
  }
  /** The other clients (this tab left out). */
  get others() {
    return this._presence.filter((p) => p.session !== this.session);
  }
  /** Merge into this client's presence state and announce it (only when something changed,
   *  so calling it on every sketch run costs nothing). */
  setPresence(state) {
    const next = { ...this.myState, ...state };
    if (JSON.stringify(next) === JSON.stringify(this.myState)) return;
    this.myState = next;
    this.announce();
  }
  broadcast(event, payload) {
    this.adapter.broadcast(this.doc, this.session, event, payload);
  }
  // ── user, status ──
  get user() {
    return this._user;
  }
  get status() {
    return this._status;
  }
  async signIn() {
    await this.adapter.signIn?.();
  }
  async signOut() {
    await this.adapter.signOut?.();
  }
  // ── listeners (each returns its unsubscribe) ──
  onChange(cb) {
    this.changeL.add(cb);
    return () => this.changeL.delete(cb);
  }
  onPresence(cb) {
    this.presenceL.add(cb);
    return () => this.presenceL.delete(cb);
  }
  onStatus(cb) {
    this.statusL.add(cb);
    return () => this.statusL.delete(cb);
  }
  onUser(cb) {
    this.userL.add(cb);
    return () => this.userL.delete(cb);
  }
  onBroadcast(cb) {
    this.broadcastL.add(cb);
    return () => this.broadcastL.delete(cb);
  }
  /** A write the backend refused (e.g. not signed in / not an editor). */
  onError(cb) {
    this.errorL.add(cb);
    return () => this.errorL.delete(cb);
  }
  // ── internals ──
  receive(rec) {
    if (this.take(rec)) this.emit([rec.key], "remote");
  }
  /** Take a backend version unless this one is as new (or newer); while a local write of the
   *  key is pending, remote versions are held back (deferred). */
  take(rec, own = false) {
    if (!own && this.pending.has(rec.key)) {
      const d = this.deferred.get(rec.key);
      if (!d || d.at < rec.at) this.deferred.set(rec.key, rec);
      return false;
    }
    const cur = this.records.get(rec.key);
    if (cur && (own ? cur.at > rec.at : cur.at >= rec.at)) return false;
    this.records.set(rec.key, rec);
    return true;
  }
  emit(keys, source) {
    for (const l of this.changeL) l(keys, source);
  }
  setStatus(s, detail) {
    this._status = s;
    for (const l of this.statusL) l(s, detail);
  }
  announce() {
    if (!this.unsub) return;
    const user = this._user ?? { id: `guest-${this.session}`, name: "Guest" };
    this.adapter.setPresence(this.doc, { session: this.session, user, color: this.color ?? collabColor(user.id), state: this.myState });
  }
};
function memoryAdapter(opts = {}) {
  const docs = /* @__PURE__ */ new Map();
  const subs = /* @__PURE__ */ new Map();
  const presence = /* @__PURE__ */ new Map();
  let clock = 0;
  const now2 = () => clock = Math.max(clock + 1, Date.now());
  const docOf = (m, doc) => m.get(doc) ?? m.set(doc, /* @__PURE__ */ new Map()).get(doc);
  const make = (user) => ({
    async load(doc) {
      return [...docOf(docs, doc).values()].map((r) => ({ ...r }));
    },
    async put(doc, key, value) {
      const rec = { key, value: value ?? null, by: user?.id ?? "guest", at: now2() };
      docOf(docs, doc).set(key, rec);
      queueMicrotask(() => {
        for (const s of docOf(subs, doc).values()) s.record({ ...rec });
      });
      return { ...rec };
    },
    subscribe(doc, session, on) {
      docOf(subs, doc).set(session, on);
      queueMicrotask(() => on.status("online"));
      return () => {
        docOf(subs, doc).delete(session);
        docOf(presence, doc).delete(session);
        const list = [...docOf(presence, doc).values()];
        for (const s of docOf(subs, doc).values()) s.presence(list);
      };
    },
    setPresence(doc, p) {
      docOf(presence, doc).set(p.session, p);
      const list = [...docOf(presence, doc).values()];
      queueMicrotask(() => {
        for (const s of docOf(subs, doc).values()) s.presence(list);
      });
    },
    broadcast(doc, session, event, payload) {
      queueMicrotask(() => {
        for (const [sid, s] of docOf(subs, doc)) if (sid !== session) s.broadcast(event, payload, session);
      });
    },
    async user() {
      return user;
    }
  });
  return Object.assign(make(opts.user ?? null), { withUser: make });
}
var DEV_ENDPOINT = "/__tekto/collab";
var DEV_NAME_KEY = "tekto.collab.name";
var DEV_ID_KEY = "tekto.collab.id";
function devServerAdapter(opts = {}) {
  const base = opts.endpoint ?? DEV_ENDPOINT;
  const userL = /* @__PURE__ */ new Set();
  const store = (k, v) => {
    try {
      if (v !== void 0) localStorage.setItem(k, v);
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const currentUser = () => {
    const name = store(DEV_NAME_KEY);
    if (!name) return null;
    const id = store(DEV_ID_KEY) ?? store(DEV_ID_KEY, `dev-${randomId()}`);
    return { id, name };
  };
  const post = async (path, body) => {
    const r = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  };
  return {
    async load(doc) {
      const r = await fetch(`${base}/records?doc=${encodeURIComponent(doc)}`);
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
      return r.json();
    },
    put(doc, key, value) {
      return post("/put", { doc, key, value: value ?? null, by: currentUser()?.name ?? "guest" });
    },
    subscribe(doc, session, on) {
      let es = null;
      let closed = false;
      const open = () => {
        on.status("connecting");
        es = new EventSource(`${base}/events?doc=${encodeURIComponent(doc)}&session=${session}`);
        es.addEventListener("open", () => on.status("online"));
        es.addEventListener("record", (e) => on.record(JSON.parse(e.data)));
        es.addEventListener("presence", (e) => on.presence(JSON.parse(e.data)));
        es.addEventListener("broadcast", (e) => {
          const m = JSON.parse(e.data);
          on.broadcast(m.event, m.payload, m.from);
        });
        es.addEventListener("error", () => {
          if (!closed) on.status("connecting", "reconnecting");
        });
      };
      open();
      return () => {
        closed = true;
        es?.close();
        on.status("offline");
      };
    },
    setPresence(doc, presence) {
      void post("/presence", { doc, presence }).catch(() => {
      });
    },
    broadcast(doc, session, event, payload) {
      void post("/broadcast", { doc, from: session, event, payload }).catch(() => {
      });
    },
    async user() {
      return currentUser();
    },
    async signIn() {
      const name = window.prompt("Your name (shown to the others)", store(DEV_NAME_KEY) ?? "");
      if (!name) return;
      store(DEV_NAME_KEY, name.trim());
      const u = currentUser();
      for (const l of userL) l(u);
    },
    async signOut() {
      try {
        localStorage.removeItem(DEV_NAME_KEY);
      } catch {
      }
      for (const l of userL) l(null);
    },
    onUser(cb) {
      userL.add(cb);
      return () => userL.delete(cb);
    }
  };
}
function supabaseUser(u) {
  if (!u) return null;
  const m = u.user_metadata ?? {};
  return { id: m.user_name ?? m.preferred_username ?? u.email ?? u.id, name: m.full_name ?? m.name ?? m.user_name ?? u.email ?? "user", avatarUrl: m.avatar_url };
}
function fromRow(row) {
  return { key: row.key, value: row.value ?? null, by: row.by ?? "", at: Date.parse(row.at) };
}
function supabaseAdapter(client, opts = {}) {
  const table = opts.table ?? "tekto_records";
  const channels = /* @__PURE__ */ new Map();
  const joined = /* @__PURE__ */ new Set();
  const lastPresence = /* @__PURE__ */ new Map();
  return {
    async load(doc) {
      const { data, error } = await client.from(table).select("key,value,by,at").eq("doc", doc);
      if (error) throw new Error(error.message);
      return (data ?? []).map(fromRow);
    },
    async put(doc, key, value) {
      const { data, error } = await client.from(table).upsert({ doc, key, value: value ?? null }, { onConflict: "doc,key" }).select("key,value,by,at").single();
      if (error) throw new Error(error.message);
      return fromRow(data);
    },
    subscribe(doc, session, on) {
      on.status("connecting");
      const ch = client.channel(`tekto:${doc}`, { config: { presence: { key: session }, broadcast: { self: false } } });
      ch.on("postgres_changes", { event: "*", schema: "public", table, filter: `doc=eq.${doc}` }, (p) => {
        if (p.new?.key) on.record(fromRow(p.new));
      });
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        on.presence(Object.values(state).map((metas) => metas[metas.length - 1]).filter(Boolean));
      });
      ch.on("broadcast", { event: "tekto" }, (m) => on.broadcast(m.payload.event, m.payload.payload, m.payload.from));
      ch.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          joined.add(doc);
          on.status("online");
          const p = lastPresence.get(doc);
          if (p) void ch.track(p);
        } else if (status === "CLOSED") {
          joined.delete(doc);
          on.status("offline");
        } else on.status(status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "error" : "connecting", err?.message ?? status);
      });
      channels.set(doc, ch);
      return () => {
        channels.delete(doc);
        joined.delete(doc);
        void client.removeChannel(ch);
        on.status("offline");
      };
    },
    setPresence(doc, presence) {
      lastPresence.set(doc, presence);
      if (joined.has(doc)) void channels.get(doc)?.track(presence);
    },
    broadcast(doc, session, event, payload) {
      void channels.get(doc)?.send({ type: "broadcast", event: "tekto", payload: { event, payload, from: session } });
    },
    async user() {
      return supabaseUser((await client.auth.getUser()).data.user);
    },
    async signIn() {
      await client.auth.signInWithOAuth({ provider: opts.provider ?? "github", options: { redirectTo: location.href } });
    },
    async signOut() {
      await client.auth.signOut();
    },
    onUser(cb) {
      const { data } = client.auth.onAuthStateChange((_e, s) => cb(supabaseUser(s?.user)));
      return () => data.subscription.unsubscribe();
    }
  };
}

// src/collab/Doc.ts
var SEP = "/";
function newId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
}
var Doc = class {
  constructor(opts) {
    this.past = [];
    this.future = [];
    this.open = null;
    // the transaction being written
    this.depth = 0;
    this.applying = null;
    this.pendingKeys = /* @__PURE__ */ new Set();
    // changed during a transaction, emitted once at the end
    this.pendingSource = "local";
    this.listeners = /* @__PURE__ */ new Set();
    this.historyL = /* @__PURE__ */ new Set();
    this.name = opts.name;
    this.historyLimit = opts.historyLimit ?? 200;
    this.coalesceMs = opts.coalesceMs ?? 800;
    this.store = new SharedStore({ doc: opts.name, adapter: opts.adapter ?? memoryAdapter() });
    this.unsubStore = this.store.onChange((keys, source) => {
      const src = this.applying ?? source;
      if (this.depth > 0) {
        for (const k of keys) this.pendingKeys.add(k);
        this.pendingSource = src;
        return;
      }
      this.emit(keys, src);
    });
    this.ready = this.store.connect();
  }
  // ── Reading ──
  get(collection, id) {
    return this.store.get(collection + SEP + id);
  }
  has(collection, id) {
    return this.store.has(collection + SEP + id);
  }
  /** `[id, record]` for every record of a collection, in insertion order. */
  all(collection) {
    const prefix = collection + SEP;
    return this.store.entries().filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]);
  }
  ids(collection) {
    return this.all(collection).map(([id]) => id);
  }
  count(collection) {
    return this.all(collection).length;
  }
  // ── Writing ──
  /** Add a record; returns its id (or uses `id` if given). */
  add(collection, value, opts = {}) {
    if (collection.includes(SEP)) throw new Error(`Doc: a collection name can't contain "${SEP}" (got "${collection}")`);
    const id = opts.id ?? newId();
    if (this.has(collection, id)) throw new Error(`Doc.add: ${collection}${SEP}${id} already exists`);
    this.write(collection + SEP + id, value, opts, `Add ${collection}`);
    return id;
  }
  /**
   * Change a record: an object merges into it (`{ h: 12 }`), a function maps it
   * (`b => ({ ...b, h: b.h * 2 })`). Throws if the record doesn't exist.
   */
  update(collection, id, change, opts = {}) {
    const cur = this.get(collection, id);
    if (cur === void 0) throw new Error(`Doc.update: ${collection}${SEP}${id} does not exist`);
    const next = typeof change === "function" ? change(cur) : { ...cur, ...change };
    this.write(collection + SEP + id, next, opts, `Edit ${collection}`);
  }
  /** Remove a record (a no-op if it is already gone). */
  remove(collection, id, opts = {}) {
    if (!this.has(collection, id)) return;
    this.write(collection + SEP + id, null, opts, `Delete ${collection}`);
  }
  /**
   * Run several edits as one undo step and one change notification. Nested transactions
   * join the outer one.
   *
   *   doc.transact("Duplicate", () => { for (const id of sel) doc.add("blocks", { ...doc.get("blocks", id)!, x: … }); });
   */
  transact(label, fn, opts = {}) {
    const outer = this.depth === 0;
    if (outer) this.open = { label, changes: /* @__PURE__ */ new Map(), coalesce: opts.coalesce, at: now() };
    this.depth++;
    try {
      return fn();
    } finally {
      this.depth--;
      if (outer) {
        const step = this.open;
        this.open = null;
        if (step.changes.size && opts.undoable !== false) this.record(step);
        const keys = [...this.pendingKeys];
        this.pendingKeys.clear();
        if (keys.length) this.emit(keys, this.pendingSource);
      }
    }
  }
  // ── Undo / redo ──
  undo() {
    return this.travel(this.past, this.future, "before");
  }
  redo() {
    return this.travel(this.future, this.past, "after");
  }
  canUndo() {
    return this.past.length > 0;
  }
  canRedo() {
    return this.future.length > 0;
  }
  /** "Undo <this>": the label of the step `undo()` would revert. */
  undoLabel() {
    return this.past[this.past.length - 1]?.label;
  }
  redoLabel() {
    return this.future[this.future.length - 1]?.label;
  }
  /** Forget the history (after Open, or to make a state the new baseline). */
  clearHistory() {
    this.past = [];
    this.future = [];
    this.notifyHistory();
  }
  // ── Listening ──
  /** Records that changed, once per transaction, and where the change came from. */
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  /** The undo/redo history changed (enable or relabel Undo / Redo). */
  onHistory(cb) {
    this.historyL.add(cb);
    return () => this.historyL.delete(cb);
  }
  // ── Save / Open ──
  toJSON() {
    var _a;
    const collections = {};
    for (const [key, value] of this.store.entries()) {
      const i = key.indexOf(SEP);
      if (i < 0) continue;
      (collections[_a = key.slice(0, i)] ?? (collections[_a] = {}))[key.slice(i + 1)] = value;
    }
    return { format: "tekto-doc/1", name: this.name, collections };
  }
  /**
   * Replace the document's records with `json` (from `toJSON()`): records not in it are
   * removed. Not undoable by default — Open starts a new history — pass `undoable: true`
   * to make it one undo step ("Load").
   */
  load(json, opts = {}) {
    if (json?.format !== "tekto-doc/1") throw new Error(`Doc.load: not a tekto document (format ${String(json?.format)})`);
    const wanted = /* @__PURE__ */ new Map();
    for (const [c, recs] of Object.entries(json.collections ?? {})) {
      for (const [id, v] of Object.entries(recs)) wanted.set(c + SEP + id, v);
    }
    this.transact("Load", () => {
      for (const [k] of this.store.entries()) if (!wanted.has(k)) this.write(k, null, {}, "Load");
      for (const [k, v] of wanted) this.write(k, v, {}, "Load");
    }, { undoable: opts.undoable ?? false });
    if (!opts.undoable) this.clearHistory();
  }
  dispose() {
    this.unsubStore();
    this.store.disconnect();
  }
  // ── Internals ──
  write(key, value, opts, defaultLabel) {
    if (this.depth > 0) {
      this.track(this.open, key, value);
      this.store.set(key, value ?? null);
      return;
    }
    this.transact(opts.label ?? defaultLabel, () => {
      this.track(this.open, key, value);
      this.store.set(key, value ?? null);
    }, { coalesce: opts.coalesce, undoable: opts.undoable });
  }
  track(step, key, after) {
    const prev = step.changes.get(key);
    const before = prev ? prev.before : this.store.get(key) ?? null;
    step.changes.set(key, { before, after: after ?? null });
  }
  record(step) {
    const top = this.past[this.past.length - 1];
    if (step.coalesce && top && top.coalesce === step.coalesce && step.at - top.at < this.coalesceMs) {
      for (const [k, c] of step.changes) {
        const t = top.changes.get(k);
        top.changes.set(k, { before: t ? t.before : c.before, after: c.after });
      }
      top.at = step.at;
    } else {
      this.past.push(step);
      if (this.past.length > this.historyLimit) this.past.shift();
    }
    this.future = [];
    this.notifyHistory();
  }
  travel(from, to, side) {
    const step = from.pop();
    if (!step) return false;
    this.applying = "history";
    try {
      this.depth++;
      for (const [k, c] of step.changes) this.store.set(k, c[side] ?? null);
    } finally {
      this.depth--;
      this.applying = null;
    }
    step.coalesce = void 0;
    to.push(step);
    const keys = [...this.pendingKeys];
    this.pendingKeys.clear();
    if (keys.length) this.emit(keys, "history");
    this.notifyHistory();
    return true;
  }
  emit(keys, source) {
    const changes = [];
    for (const key of new Set(keys)) {
      const i = key.indexOf(SEP);
      if (i < 0) continue;
      changes.push({ collection: key.slice(0, i), id: key.slice(i + 1), value: this.store.get(key) });
    }
    if (!changes.length) return;
    for (const l of this.listeners) l(changes, source);
  }
  notifyHistory() {
    for (const l of this.historyL) l();
  }
};
function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
function localAdapter(opts = {}) {
  const prefix = opts.prefix ?? "tekto.doc.";
  const storage = opts.storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  const docs = /* @__PURE__ */ new Map();
  let clock = 0;
  const tick = () => clock = Math.max(clock + 1, Date.now());
  const read = (doc) => {
    let m = docs.get(doc);
    if (m) return m;
    m = /* @__PURE__ */ new Map();
    try {
      const raw = storage?.getItem(prefix + doc);
      if (raw) for (const r of JSON.parse(raw)) m.set(r.key, r);
    } catch {
    }
    docs.set(doc, m);
    return m;
  };
  const save = (doc) => {
    try {
      storage?.setItem(prefix + doc, JSON.stringify([...read(doc).values()].filter((r) => r.value !== null)));
    } catch (e) {
      console.warn(`localAdapter: could not save "${doc}" (${String(e)})`);
    }
  };
  const user = { id: "local", name: "You" };
  return {
    async load(doc) {
      return [...read(doc).values()].map((r) => ({ ...r }));
    },
    async put(doc, key, value) {
      const rec = { key, value: value ?? null, by: user.id, at: tick() };
      read(doc).set(key, rec);
      save(doc);
      return { ...rec };
    },
    subscribe(_doc, _session, on) {
      queueMicrotask(() => on.status("online"));
      return () => on.status("offline");
    },
    setPresence(_doc, _p) {
    },
    broadcast() {
    },
    async user() {
      return user;
    }
  };
}
function bindScene(doc, collection, scene, render) {
  const objects = /* @__PURE__ */ new Map();
  const keyOf = (id) => `${collection}${SEP}${id}`;
  let capturing = null;
  const unsubScene = scene.on((e) => {
    if (e.type === "object:add" && capturing) capturing.push(e.id);
    else if (e.type === "scene:clear") objects.clear();
  });
  const drop = (id) => {
    for (const sid of objects.get(id) ?? []) scene.remove(sid);
    objects.delete(id);
  };
  const draw = (id, record) => {
    drop(id);
    if (record === void 0) return;
    const added = [];
    capturing = added;
    try {
      scene.withKey(keyOf(id), () => render(record, id));
    } catch (e) {
      console.error(`bindScene("${collection}"): rendering ${keyOf(id)} failed:`, e);
    } finally {
      capturing = null;
    }
    objects.set(id, added);
  };
  for (const [id, rec] of doc.all(collection)) draw(id, rec);
  const unsubDoc = doc.onChange((changes) => {
    for (const c of changes) if (c.collection === collection) draw(c.id, c.value);
  });
  return {
    collection,
    objectsOf: (id) => [...objects.get(id) ?? []],
    recordOf: (sceneId) => {
      const key = scene.get(sceneId)?.key;
      return key && key.startsWith(collection + SEP) ? key.slice(collection.length + 1) : void 0;
    },
    refresh: (id) => {
      if (id !== void 0) draw(id, doc.get(collection, id));
      else for (const [rid, rec] of doc.all(collection)) draw(rid, rec);
    },
    dispose: () => {
      unsubDoc();
      unsubScene();
      for (const id of [...objects.keys()]) drop(id);
    }
  };
}
var Selection = class {
  constructor() {
    this.set = /* @__PURE__ */ new Set();
    this.listeners = /* @__PURE__ */ new Set();
  }
  keys() {
    return [...this.set];
  }
  has(key) {
    return this.set.has(key);
  }
  get size() {
    return this.set.size;
  }
  /** The ids of the selected records of one collection. */
  ids(collection) {
    const prefix = collection + SEP;
    return this.keys().filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
  }
  /** Replace the selection. */
  select(keys) {
    const next = new Set(keys);
    if (next.size === this.set.size && [...next].every((k) => this.set.has(k))) return;
    this.set = next;
    this.emit();
  }
  add(key) {
    if (!this.set.has(key)) {
      this.set.add(key);
      this.emit();
    }
  }
  remove(key) {
    if (this.set.delete(key)) this.emit();
  }
  toggle(key) {
    if (!this.set.delete(key)) this.set.add(key);
    this.emit();
  }
  clear() {
    if (this.set.size) {
      this.set.clear();
      this.emit();
    }
  }
  /** A click on a record (`key`) or on nothing (null): it selects the record, Shift/⌘/Ctrl
   *  adds or removes it, a plain click on nothing clears. The rule every view shares — a
   *  3D viewport (`selectOnClick`), a drawing (`SheetCanvas.onPick`), a list. */
  click(key, mods = {}) {
    const adding = !!(mods.shiftKey || mods.metaKey || mods.ctrlKey);
    if (!key) {
      if (!adding) this.clear();
      return;
    }
    if (adding) this.toggle(key);
    else this.select([key]);
  }
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  emit() {
    const keys = this.keys();
    for (const l of this.listeners) l(keys);
  }
};
function selectOnClick(view, scene, selection) {
  view.setPickEnabled(true);
  const highlight = () => {
    if (!selection.size) {
      view.setSelectionHighlight(null);
      return;
    }
    const ids = [];
    for (const o of scene.all()) if (o.key && selection.has(o.key)) ids.push(o.id);
    view.setSelectionHighlight(ids);
  };
  const offPick = view.onPick((sceneId, info) => selection.click(sceneId ? scene.get(sceneId)?.key : null, info));
  const offSel = selection.onChange(highlight);
  let queued = false;
  const offScene = scene.on((e) => {
    if (e.type !== "object:add" || !selection.size || queued) return;
    const key = scene.get(e.id)?.key;
    if (!key || !selection.has(key)) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      highlight();
    });
  });
  highlight();
  return () => {
    offPick();
    offSel();
    offScene();
    view.setSelectionHighlight(null);
  };
}
function shareSelection(selection, store, view, scene) {
  const publish = () => store.setPresence({ selection: selection.keys() });
  const offSel = selection.onChange(publish);
  publish();
  if (!view || !scene) return () => {
    offSel();
    store.setPresence({ selection: [] });
  };
  const show = () => {
    const entries = store.others.map((p) => {
      const keys = Array.isArray(p.state.selection) ? p.state.selection : [];
      const want = new Set(keys);
      const ids = scene.all().filter((o) => o.key && want.has(o.key)).map((o) => o.id);
      return { ids, color: p.color };
    }).filter((e) => e.ids.length);
    view.setPresenceHighlight(entries);
  };
  let queued = false;
  const offScene = scene.on((e) => {
    if (e.type !== "object:add" && e.type !== "scene:clear" || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      show();
    });
  });
  const offPresence = store.onPresence(show);
  show();
  return () => {
    offSel();
    offPresence();
    offScene();
    view.setPresenceHighlight([]);
    store.setPresence({ selection: [] });
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AABB,
  Algo,
  ArcCurve,
  BalloonFrame,
  BlobDetect,
  BspTree,
  Capsule2D,
  CltConstruction,
  CubicBezierCurve,
  Curvature,
  CurveUtils,
  DASH_PATTERNS,
  Delaunay2D,
  DistanceTransform,
  Doc,
  ExtrudedRibbon,
  FloodFill,
  Graph,
  GridGraph,
  HMath,
  HelixCurve,
  HolzrahmenBau,
  HolzrahmenBauJointStyle,
  IfcFile,
  IfcModel,
  IfcWriter,
  Intersections,
  JoistedSlab,
  LineCurve,
  MITER_LIMIT,
  MarchingCubes,
  MarchingSquares,
  Mat4,
  MathUtils,
  Mesh,
  MeshAnalysis,
  MeshCleanup,
  MeshFactory,
  MeshSubdivide,
  MeshTransform,
  NoFitPolygon,
  NurbsCurve,
  NurbsSurface,
  OBB2D,
  ObjFile,
  OpeningType,
  PGFace,
  PGHalfEdge,
  PGVertex,
  ParamStore,
  PixelView,
  PlanarGraph,
  PlanarGraphCleanup,
  PlanarGraphRepair,
  Plane,
  Polygon2D,
  PolygonBool,
  PolylineCurve,
  Ray,
  RibbonEndTrim,
  RibbonFrame,
  RibbonJoint,
  RibbonOpening,
  RibbonSystem,
  RigidBody2D,
  Scene,
  SdfBlend,
  SdfBoundedExtrude,
  SdfBox,
  SdfCapsule,
  SdfCone,
  SdfCylinder,
  SdfEllipsoid,
  SdfExtrude,
  SdfGradient,
  SdfIntersect,
  SdfLattice,
  SdfLineField,
  SdfMicrostructure,
  SdfMirror,
  SdfOffset,
  SdfOnion,
  SdfOps,
  SdfPlaneField,
  SdfRadialArray,
  SdfRevolution,
  SdfShell,
  SdfSmoothSubtract,
  SdfSmoothUnion,
  SdfSphere,
  SdfSubtract,
  SdfTorus,
  SdfTransform,
  SdfTwist,
  SdfUnion,
  SdfUtils,
  SdfVoronoi,
  Segment,
  Selection,
  SharedStore,
  Sheet,
  SheetView,
  Slab,
  SlabOpening,
  SlabType,
  SolidConstruction,
  SolidSlabConstruction,
  Space,
  Sphere,
  Spring2D,
  SpringSystem3D,
  Stair,
  StairType,
  StreamlineTracer,
  SunPosition,
  Triangle,
  Vec2,
  Vec3,
  Vec4,
  VecMath,
  VoxelGrid,
  VoxelGrid2D,
  Wall,
  WallJoint,
  WallOpening,
  WallSystem,
  WallType,
  aciFromHex,
  bindScene,
  boundingWalls,
  boxOf,
  buildCutList,
  chooseJoistDirection,
  clampedUniformKnots,
  closestPointOnSegment,
  cltLayers,
  collabColor,
  contactBetween,
  createLayout,
  createParams,
  createRandom,
  devServerAdapter,
  edgeOutwardVisibility,
  findAdjacent,
  holzrahmenbauLayers,
  joistDirectionFromBounds,
  joistDirectionFromPCA,
  joistDirectionFromSupports,
  lineClipPolygon,
  localAdapter,
  memoryAdapter,
  neighboursOf,
  noise,
  perpVisibility,
  perpVisibilityOfPolys,
  pickPrim,
  polygonFromVertices,
  polygonIntersection,
  realize,
  realizeSlab,
  repelBodies,
  reverseContact,
  segmentSegmentClosest,
  selectOnClick,
  setClipSnap,
  shareSelection,
  stampName,
  supabaseAdapter,
  writeDxf2D,
  writeDxf3D
});
