import {
  AABB,
  HMath,
  Vec3,
  closestPointOnSegment
} from "./chunk-EKKTPIOR.mjs";

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
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const s0 = this._faceStart[f], s1 = this._faceStart[f + 1], n = s1 - s0;
      let bad = false;
      for (let c = s0; c < s1; c++) {
        if (!this.isNodeAlive(cv[c])) {
          bad = true;
          note("badRefs", `face ${f} \u2192 node ${cv[c]}`);
        }
        if (cv[c] === cv[s0 + (c - s0 + 1) % n]) {
          repeated++;
          note("repeated", `face ${f}`);
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
        note("degenerate", `face ${f}`);
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
      for (const fj of json.faces) {
        if (fj.nodes.length < 3) continue;
        mesh2.addFace(fj.nodes.map((n) => idMap.get(n)), fj.data && Object.keys(fj.data).length ? fj.data : void 0);
      }
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
      style: { ...DEFAULT_STYLE, color: "#ffffff", ...style },
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
  Plane,
  Triangle,
  Mesh,
  SunPosition,
  Scene
};
