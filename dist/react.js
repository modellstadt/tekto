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

// src/react.ts
var react_exports = {};
__export(react_exports, {
  InspectorPanel: () => InspectorPanel,
  ParamPanel: () => ParamPanel,
  TektoApp: () => TektoApp,
  Toolbar: () => Toolbar,
  useParams: () => useParams,
  useScene: () => useScene,
  useSceneObjects: () => useSceneObjects,
  useSelection: () => useSelection
});
module.exports = __toCommonJS(react_exports);

// src/react/components.tsx
var import_react = __toESM(require("react"));

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

// src/core/math/VecMath.ts
var EPSILON = HMath.EPSILON;
var TWO_PI = Math.PI * 2;

// src/core/geometry/Segment.ts
function closestPointOnSegment(p, a, b) {
  const ab = b.sub(a);
  const lenSq = ab.lenSq();
  if (lenSq < HMath.EPSILON) return a;
  const t = HMath.clamp(p.sub(a).dot(ab) / lenSq, 0, 1);
  return a.add(ab.mul(t));
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

// src/react/components.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var Ctx = (0, import_react.createContext)(null);
function useScene() {
  const ctx = (0, import_react.useContext)(Ctx);
  if (!ctx) throw new Error("useScene must be inside <TektoApp>");
  return ctx.scene;
}
function TektoApp({
  scene: extScene,
  children
}) {
  const scene = (0, import_react.useMemo)(() => extScene ?? new Scene(), [extScene]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, { value: { scene }, children });
}
function useSceneObjects() {
  const scene = useScene();
  const [objects, setObjects] = (0, import_react.useState)(scene.all());
  (0, import_react.useEffect)(() => scene.on(() => setObjects([...scene.all()])), [scene]);
  return objects;
}
function useSelection() {
  const scene = useScene();
  const [ids, setIds] = (0, import_react.useState)([]);
  (0, import_react.useEffect)(() => scene.on((e) => {
    if (e.type === "selection:change") setIds(e.ids);
  }), [scene]);
  return {
    ids,
    select: (id) => scene.select(id),
    deselect: (id) => scene.deselect(id),
    toggle: (id) => scene.toggleSelect(id),
    clear: () => scene.clearSelection(),
    isSelected: (id) => scene.isSelected(id)
  };
}
function useParams(store) {
  const [values, setValues] = (0, import_react.useState)(store.getAll());
  (0, import_react.useEffect)(() => {
    return store.onChange(() => setValues({ ...store.getAll() }));
  }, [store]);
  const set = (0, import_react.useCallback)((key, value) => store.set(key, value), [store]);
  return { values, set, store };
}
function ParamPanel({ store, layout, title, style, className }) {
  const { values, set } = useParams(store);
  const schema = store.getSchema();
  const renderParam = (key) => {
    const def = schema[key];
    if (!def) return null;
    const label = def.label ?? key;
    switch (def.type) {
      case "float":
      case "int":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "range",
              min: def.min,
              max: def.max,
              step: def.step ?? (def.type === "int" ? 1 : (def.max - def.min) / 100),
              value: values[key],
              onChange: (e) => set(key, parseFloat(e.target.value)),
              style: sliderStyle
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: valueStyle, children: def.type === "int" ? values[key] : values[key]?.toFixed(2) })
        ] }, key);
      case "bool":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: values[key],
              onChange: (e) => set(key, e.target.checked),
              style: checkStyle
            }
          )
        ] }, key);
      case "select":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "select",
            {
              value: values[key],
              onChange: (e) => set(key, e.target.value),
              style: selectStyle,
              children: def.options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: o, children: o }, o))
            }
          )
        ] }, key);
      case "color":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "color",
              value: values[key],
              onChange: (e) => set(key, e.target.value),
              style: colorStyle
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: valueStyle, children: values[key] })
        ] }, key);
      case "string":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "text",
              value: values[key],
              placeholder: def.placeholder,
              onChange: (e) => set(key, e.target.value),
              style: textStyle
            }
          )
        ] }, key);
      case "vec3":
        const v = values[key];
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...rowStyle, flexDirection: "column", alignItems: "stretch" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 4 }, children: ["x", "y", "z"].map((axis, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "number",
              value: v[i],
              step: def.step ?? 0.1,
              onChange: (e) => {
                const nv = [...v];
                nv[i] = parseFloat(e.target.value) || 0;
                set(key, nv);
              },
              style: { ...textStyle, flex: 1 },
              placeholder: axis
            },
            axis
          )) })
        ] }, key);
      case "button":
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: def.action, style: buttonStyle, children: label }) }, key);
      default:
        return null;
    }
  };
  const renderFolder = (folder) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderWidget, { label: folder.label, defaultOpen: folder.open !== false, children: folder.params.map(renderParam) }, folder.label);
  const allKeys = Object.keys(schema);
  const layoutKeys = layout?.folders.flatMap((f) => f.params) ?? [];
  const ungroupedKeys = allKeys.filter((k) => !layoutKeys.includes(k));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className, style: { ...panelStyle, ...style }, children: [
    title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: panelTitleStyle, children: title }),
    layout?.folders.map(renderFolder),
    ungroupedKeys.length > 0 && ungroupedKeys.map(renderParam)
  ] });
}
function FolderWidget({
  label,
  defaultOpen = true,
  children
}) {
  const [open, setOpen] = (0, import_react.useState)(defaultOpen);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 8 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        onClick: () => setOpen(!open),
        style: {
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 0",
          color: "#8899bb",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "1px",
          userSelect: "none"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", fontSize: 10 }, children: "\u25B6" }),
          label
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { paddingLeft: 4 }, children })
  ] });
}
function InspectorPanel({
  style,
  className,
  onSelect
}) {
  const objects = useSceneObjects();
  const selection = useSelection();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className, style: { ...panelStyle, ...style }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: panelTitleStyle, children: [
      "Scene Objects (",
      objects.length,
      ")"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 1 }, children: [
      objects.map((obj) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          onClick: () => {
            selection.toggle(obj.id);
            onSelect?.(obj.id);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 8px",
            borderRadius: 4,
            cursor: "pointer",
            background: selection.isSelected(obj.id) ? "rgba(59,130,246,.15)" : "transparent",
            borderLeft: `3px solid ${obj.style.color}`
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "#5a6080", fontSize: 11, fontFamily: "monospace" }, children: obj.type }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "#9aa0b8", fontSize: 11, fontFamily: "monospace" }, children: obj.id }),
            obj.style.label && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "#6a7090", fontSize: 10, fontStyle: "italic" }, children: [
              '"',
              obj.style.label,
              '"'
            ] })
          ]
        },
        obj.id
      )),
      objects.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "#3a3f58", fontStyle: "italic", fontSize: 12, padding: 8 }, children: "Empty scene" })
    ] })
  ] });
}
function Toolbar({
  actions,
  style,
  className
}) {
  const groups = /* @__PURE__ */ new Map();
  for (const a of actions) {
    const g = a.group ?? "__default";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(a);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className, style: { display: "flex", gap: 2, ...style }, children: [...groups.entries()].map(([group, items], gi) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
    gi > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, background: "#1e2035", margin: "4px 4px" } }),
    items.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        onClick: a.onClick,
        title: a.shortcut ? `${a.label} (${a.shortcut})` : a.label,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          border: "1px solid",
          borderColor: a.active ? "#3b82f6" : "#1e2035",
          borderRadius: 6,
          background: a.active ? "rgba(59,130,246,.12)" : "transparent",
          color: a.active ? "#93c5fd" : "#6a7090",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.12s",
          whiteSpace: "nowrap"
        },
        children: [
          a.icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: a.icon }),
          a.label
        ]
      },
      a.key
    ))
  ] }, group)) });
}
var panelStyle = {
  padding: 12,
  background: "rgba(14, 15, 26, 0.95)",
  borderRadius: 8,
  border: "1px solid #1a1c2e",
  color: "#c8cad8",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  maxHeight: "100%",
  overflowY: "auto"
};
var panelTitleStyle = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  color: "#5a6080",
  marginBottom: 12,
  fontFamily: "monospace"
};
var rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 6
};
var labelStyle = {
  width: 80,
  flexShrink: 0,
  fontSize: 12,
  color: "#8a90a8",
  textTransform: "capitalize"
};
var sliderStyle = {
  flex: 1,
  height: 4,
  appearance: "auto",
  accentColor: "#3b82f6",
  cursor: "pointer"
};
var valueStyle = {
  width: 48,
  textAlign: "right",
  fontSize: 11,
  fontFamily: "monospace",
  color: "#6ee7b7"
};
var checkStyle = {
  accentColor: "#3b82f6",
  cursor: "pointer"
};
var selectStyle = {
  flex: 1,
  padding: "4px 8px",
  background: "#0a0b14",
  border: "1px solid #1e2035",
  borderRadius: 4,
  color: "#c8cad8",
  fontSize: 12,
  fontFamily: "inherit"
};
var textStyle = {
  flex: 1,
  padding: "4px 8px",
  background: "#0a0b14",
  border: "1px solid #1e2035",
  borderRadius: 4,
  color: "#c8cad8",
  fontSize: 12,
  fontFamily: "inherit"
};
var colorStyle = {
  width: 32,
  height: 24,
  border: "1px solid #1e2035",
  borderRadius: 4,
  padding: 0,
  cursor: "pointer",
  background: "none"
};
var buttonStyle = {
  width: "100%",
  padding: "7px 12px",
  border: "1px solid #1e2035",
  borderRadius: 5,
  background: "transparent",
  color: "#8a90a8",
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "monospace",
  transition: "all 0.15s"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InspectorPanel,
  ParamPanel,
  TektoApp,
  Toolbar,
  useParams,
  useScene,
  useSceneObjects,
  useSelection
});
