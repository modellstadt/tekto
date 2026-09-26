/**
 * Mesh — the one mesh class: edited, analysed and rendered from the same object.
 *
 * Storage is typed arrays, so a million triangles fit in tens of megabytes and
 * the render upload is a copy of the arrays, not a walk over objects. On top of
 * that the mesh keeps full connectivity — edges, and the links node↔edge↔face —
 * as typed-array linked lists that are maintained incrementally by every edit.
 * So `addFace`, `removeFace`, `splitEdge` cost what they touch, never a rebuild,
 * and an id handed out by `addNode`/`addEdge`/`addFace` stays valid until
 * `compact()` is called.
 *
 *   - Ids are indices. Removal tombstones the element; `nodeCount`/`edgeCount`/
 *     `faceCount` count the live ones, `vertexCount` counts vertex slots (what
 *     `positions.length / 3` is). `compact()` drops the tombstones and renumbers.
 *   - Faces are polygons (triangles, quads, n-gons); `indices` fan-triangulates
 *     on demand for the GPU and is cached until the topology changes.
 *   - `node(id)` / `edge(id)` / `face(id)` return small views (`MeshNode` …) that
 *     read and write through to the arrays: `node.position = p` works, and
 *     `face.nodes` is a snapshot array — to reverse a face use `reverseFace(id)`.
 *   - Normals, bounds and the triangle index are caches: computed on first use,
 *     dropped by whatever invalidates them.
 *   - Positions are Float64 (the analysis code compares to 1e-8); normals, uvs
 *     and colours are Float32.
 *
 * Both older classes' APIs are kept: the id-based topology API of the former
 * `ConnectedMesh` and the array API (`positions`, `indices`, `vertexCount`,
 * `smooth` …) of the former flat `Mesh`/`FlatMesh`.
 */

import { Vec3 } from "../../math/vectors";
import { AABB } from "../AABB";
import { Triangle } from "../Triangle";

// ─── Interchange types ─────────────────────────────────────────

/** Flat arrays for rendering and IO: what a GPU or an OBJ writer wants. */
export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  uvs?: Float32Array;
  colors?: Float32Array;
}

/** What `toJSON()` writes. Dense: tombstones are dropped, ids renumbered. */
export interface MeshJSON {
  positions: number[];
  faces: number[][];
  normals?: number[];
  uvs?: number[];
  colors?: number[];
  nodeData?: [number, Record<string, any>][];
  faceData?: [number, Record<string, any>][];
}

/** Formats `fromJSON()` still reads: the former ConnectedMesh and flat-mesh files. */
export type LegacyMeshJSON =
  | { nodes: { id: number; position: { x: number; y: number; z: number }; data?: Record<string, any> }[];
      faces: { id: number; nodes: number[]; data?: Record<string, any> }[] }
  | { positions: number[]; indices: number[]; normals?: number[]; uvs?: number[] };

// ─── Element views ─────────────────────────────────────────────

/** A node seen through `mesh.node(id)`: reads and writes go to the mesh. */
export interface MeshNode {
  readonly id: number;
  position: Vec3;
  /** Incident edge ids (snapshot). */
  readonly edges: number[];
  /** Incident face ids (snapshot). */
  readonly faces: number[];
  /** Set by `computeVertexNormals()`; undefined before. */
  normal?: Vec3;
  readonly data: Record<string, any>;
}

export interface MeshEdge {
  readonly id: number;
  readonly nodes: [number, number];
  /** Incident face ids (snapshot). */
  readonly faces: number[];
  readonly data: Record<string, any>;
}

export interface MeshFace {
  readonly id: number;
  /** Node ids in winding order (snapshot — see `Mesh.reverseFace`). */
  readonly nodes: number[];
  /** Edge ids, `edges[i]` joining `nodes[i]` to `nodes[i+1]` (snapshot). */
  readonly edges: number[];
  /** Set by `computeFaceNormals()`; undefined before. */
  normal?: Vec3;
  readonly data: Record<string, any>;
}

class NodeView implements MeshNode {
  constructor(private readonly m: Mesh, readonly id: number) {}
  get position(): Vec3 { return this.m.getPosition(this.id); }
  set position(p: Vec3) { this.m.setPosition(this.id, p); }
  get edges(): number[] { return this.m.nodeEdges(this.id); }
  get faces(): number[] { return this.m.nodeFaces(this.id); }
  get normal(): Vec3 | undefined { return this.m.nodeNormal(this.id); }
  set normal(n: Vec3 | undefined) { if (n) this.m.setNormal(this.id, n); }
  get data(): Record<string, any> { return this.m.nodeData(this.id); }
}

class EdgeView implements MeshEdge {
  constructor(private readonly m: Mesh, readonly id: number) {}
  get nodes(): [number, number] { return this.m.edgeNodes(this.id); }
  get faces(): number[] { return this.m.edgeFaces(this.id); }
  get data(): Record<string, any> { return this.m.edgeData(this.id); }
}

class FaceView implements MeshFace {
  constructor(private readonly m: Mesh, readonly id: number) {}
  get nodes(): number[] { return this.m.faceNodes(this.id); }
  get edges(): number[] { return this.m.faceEdges(this.id); }
  get normal(): Vec3 | undefined { return this.m.faceNormal(this.id); }
  set normal(n: Vec3 | undefined) { if (n) this.m.setFaceNormal(this.id, n); }
  get data(): Record<string, any> { return this.m.faceData(this.id); }
}

// ─── Typed-array helpers ───────────────────────────────────────

type TA = Float64Array | Float32Array | Uint32Array | Int32Array | Uint8Array;

function grow<T extends TA>(a: T, len: number, fill = 0): T {
  const b = new (a.constructor as new (n: number) => T)(len);
  (b as any).set(a);
  if (fill !== 0) b.fill(fill, a.length);
  return b;
}

const NONE = -1;

// ─── Mesh ──────────────────────────────────────────────────────

export class Mesh {
  // nodes — a slot per id; `_nodeN` slots used, `_nodeLive` of them alive
  private _pos = new Float64Array(16 * 3);
  private _nrm: Float32Array | null = null;    // vertex normals, valid for ids < _nrmN
  private _nrmN = 0;
  private _uv: Float32Array | null = null;     // 2 per slot
  private _col: Float32Array | null = null;    // 4 per slot (RGBA)
  private _nodeAlive = new Uint8Array(16);
  private _nodeFirstEdge = new Int32Array(16).fill(NONE);
  private _nodeFirstCorner = new Int32Array(16).fill(NONE);
  private _nodeN = 0;
  private _nodeLive = 0;

  // edges — endpoints plus two "next" pointers, one for each endpoint's list
  private _edgeA = new Uint32Array(32);
  private _edgeB = new Uint32Array(32);
  private _edgeNext = new Int32Array(64).fill(NONE);     // [2e] next in A's list, [2e+1] in B's
  private _edgeFirstCorner = new Int32Array(32).fill(NONE);
  private _edgeAlive = new Uint8Array(32);
  private _edgeN = 0;
  private _edgeLive = 0;

  // faces — a corner range each; corners carry the node, the outgoing edge and two list links
  private _faceStart = new Uint32Array(17);   // _faceN + 1 entries
  private _faceAlive = new Uint8Array(16);
  private _faceNrm: Float32Array | null = null;  // valid for ids < _faceNrmN
  private _faceNrmN = 0;
  private _faceN = 0;
  private _faceLive = 0;
  private _cVert = new Uint32Array(64);
  private _cFace = new Uint32Array(64);
  private _cEdge = new Int32Array(64);
  private _cNextInNode = new Int32Array(64);
  private _cNextInEdge = new Int32Array(64);
  private _cornerN = 0;
  private _triCount = 0;   // live triangles after fan-triangulation

  // side tables, allocated on first use
  private _nodeData: Map<number, Record<string, any>> | null = null;
  private _edgeData: Map<number, Record<string, any>> | null = null;
  private _faceData: Map<number, Record<string, any>> | null = null;

  // caches
  private _bounds: AABB | null = null;
  private _tri: Uint32Array | null = null;

  /**
   * `new Mesh()` is empty. `new Mesh(positions, indices, normals?, uvs?, colors?)`
   * loads flat triangle arrays (the former flat-mesh constructor).
   */
  constructor(
    positions?: ArrayLike<number>,
    indices?: ArrayLike<number>,
    normals?: ArrayLike<number>,
    uvs?: ArrayLike<number>,
    colors?: ArrayLike<number>,
  ) {
    if (positions) this._load(positions, indices ?? [], normals, uvs, colors);
  }

  // ── Counts ──

  /** Live nodes. */
  get nodeCount(): number { return this._nodeLive; }
  /** Live edges. */
  get edgeCount(): number { return this._edgeLive; }
  /** Live faces (polygons). */
  get faceCount(): number { return this._faceLive; }
  /** Vertex slots — `positions.length / 3`. Equals `nodeCount` unless nodes were removed. */
  get vertexCount(): number { return this._nodeN; }
  /** Triangles after fan-triangulating the live faces. */
  get triangleCount(): number { return this._triCount; }
  /** True if any element was removed and not yet compacted. */
  get hasTombstones(): boolean {
    return this._nodeLive !== this._nodeN || this._edgeLive !== this._edgeN || this._faceLive !== this._faceN;
  }

  // ── Flat views (the GPU side) ──

  /** xyz per vertex slot. A view into the mesh: edits are live, but call
   *  `markPositionsChanged()` afterwards so normals and bounds are recomputed. */
  get positions(): Float64Array { return this._pos.subarray(0, this._nodeN * 3); }
  /** Vertex normals, computed on first use. */
  get normals(): Float32Array {
    if (!this._nrm || this._nrmN !== this._nodeN) this.computeVertexNormals();
    return this._nrm!.subarray(0, this._nodeN * 3);
  }
  /** Triangle index over the live faces (fan-triangulated). Cached; a plain view of
   *  the corner array when the mesh is all triangles with nothing removed. */
  get indices(): Uint32Array {
    if (this._tri) return this._tri;
    if (this._faceLive === this._faceN && this._triCount * 3 === this._cornerN) {
      return (this._tri = this._cVert.subarray(0, this._cornerN));
    }
    const out = new Uint32Array(this._triCount * 3);
    let k = 0;
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const s = this._faceStart[f], e = this._faceStart[f + 1];
      for (let c = s + 1; c + 1 < e; c++) {
        out[k++] = this._cVert[s]; out[k++] = this._cVert[c]; out[k++] = this._cVert[c + 1];
      }
    }
    return (this._tri = out);
  }
  get uvs(): Float32Array | null { return this._uv ? this._uv.subarray(0, this._nodeN * 2) : null; }
  get colors(): Float32Array | null { return this._col ? this._col.subarray(0, this._nodeN * 4) : null; }

  /** Attach per-vertex uvs (2 floats per slot). */
  setUVs(uvs: ArrayLike<number> | null): void {
    if (!uvs) { this._uv = null; return; }
    this._uv = new Float32Array(this._nodeAlive.length * 2);
    this._uv.set(uvs);
  }
  /** Attach per-vertex colours (4 floats per slot, RGBA). */
  setColors(colors: ArrayLike<number> | null): void {
    if (!colors) { this._col = null; return; }
    this._col = new Float32Array(this._nodeAlive.length * 4);
    this._col.set(colors);
  }

  /** Call after writing into `positions` directly. */
  markPositionsChanged(): void {
    this._bounds = null;
    this._nrmN = 0;
    this._faceNrmN = 0;
  }

  // ── Nodes ──

  getPosition(id: number): Vec3 {
    const o = id * 3;
    return new Vec3(this._pos[o], this._pos[o + 1], this._pos[o + 2]);
  }

  setPosition(id: number, p: Vec3): void {
    const o = id * 3;
    this._pos[o] = p.x; this._pos[o + 1] = p.y; this._pos[o + 2] = p.z;
    this._bounds = null;
  }

  /** Vertex normal, computing all of them if they are stale. */
  getNormal(id: number): Vec3 {
    if (!this._nrm || this._nrmN !== this._nodeN) this.computeVertexNormals();
    const o = id * 3;
    return new Vec3(this._nrm![o], this._nrm![o + 1], this._nrm![o + 2]);
  }

  /** Vertex normal if `computeVertexNormals()` covered this node, else undefined. */
  nodeNormal(id: number): Vec3 | undefined {
    if (!this._nrm || id >= this._nrmN) return undefined;
    const o = id * 3;
    return new Vec3(this._nrm[o], this._nrm[o + 1], this._nrm[o + 2]);
  }

  setNormal(id: number, n: Vec3): void {
    if (!this._nrm) this._nrm = new Float32Array(this._nodeAlive.length * 3);
    const o = id * 3;
    this._nrm[o] = n.x; this._nrm[o + 1] = n.y; this._nrm[o + 2] = n.z;
    if (this._nrmN <= id) this._nrmN = id + 1;
  }

  nodeData(id: number): Record<string, any> {
    if (!this._nodeData) this._nodeData = new Map();
    let d = this._nodeData.get(id);
    if (!d) this._nodeData.set(id, (d = {}));
    return d;
  }

  isNodeAlive(id: number): boolean { return id >= 0 && id < this._nodeN && this._nodeAlive[id] === 1; }

  node(id: number): MeshNode | undefined {
    return this.isNodeAlive(id) ? new NodeView(this, id) : undefined;
  }

  *nodes(): IterableIterator<MeshNode> {
    for (let i = 0; i < this._nodeN; i++) if (this._nodeAlive[i]) yield new NodeView(this, i);
  }

  nodesArray(): MeshNode[] { return [...this.nodes()]; }

  /** Live node ids, in order. */
  nodeIds(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this._nodeN; i++) if (this._nodeAlive[i]) out.push(i);
    return out;
  }

  addNode(position: Vec3, data?: Record<string, any>): number {
    const id = this._addNodeXYZ(position.x, position.y, position.z);
    if (data) (this._nodeData ??= new Map()).set(id, data);
    return id;
  }

  addNodes(positions: Vec3[]): number[] {
    return positions.map(p => this.addNode(p));
  }

  private _addNodeXYZ(x: number, y: number, z: number): number {
    const id = this._nodeN;
    this._needNodes(id + 1);
    const o = id * 3;
    this._pos[o] = x; this._pos[o + 1] = y; this._pos[o + 2] = z;
    this._nodeAlive[id] = 1;
    this._nodeFirstEdge[id] = NONE;
    this._nodeFirstCorner[id] = NONE;
    this._nodeN++;
    this._nodeLive++;
    this._bounds = null;
    return id;
  }

  /** Incident edge ids. */
  nodeEdges(id: number): number[] {
    const out: number[] = [];
    for (let e = this._nodeFirstEdge[id]; e !== NONE; e = this._nextEdgeOf(e, id)) out.push(e);
    return out;
  }

  /** Incident face ids. */
  nodeFaces(id: number): number[] {
    const out: number[] = [];
    for (let c = this._nodeFirstCorner[id]; c !== NONE; c = this._cNextInNode[c]) out.push(this._cFace[c]);
    return out;
  }

  nodeNeighbors(id: number): number[] {
    if (!this.isNodeAlive(id)) return [];
    const out: number[] = [];
    for (let e = this._nodeFirstEdge[id]; e !== NONE; e = this._nextEdgeOf(e, id)) {
      out.push(this._edgeA[e] === id ? this._edgeB[e] : this._edgeA[e]);
    }
    return out;
  }

  /** Neighbour ids as a typed array (the flat-mesh spelling of `nodeNeighbors`). */
  neighbors(id: number): Uint32Array { return Uint32Array.from(this.nodeNeighbors(id)); }

  isBoundaryNode(id: number): boolean {
    if (!this.isNodeAlive(id)) return false;
    for (let e = this._nodeFirstEdge[id]; e !== NONE; e = this._nextEdgeOf(e, id)) {
      if (this._edgeCornerCount(e) < 2) return true;
    }
    return false;
  }

  /** Flat-mesh spelling of `isBoundaryNode`. */
  isBoundary(id: number): boolean { return this.isBoundaryNode(id); }

  removeNode(id: number): void {
    if (!this.isNodeAlive(id)) return;
    for (const f of this.nodeFaces(id)) this.removeFace(f);
    for (const e of this.nodeEdges(id)) this.removeEdge(e);
    this._nodeAlive[id] = 0;
    this._nodeLive--;
    this._nodeData?.delete(id);
    this._bounds = null;
  }

  // ── Edges ──

  edgeNodes(id: number): [number, number] { return [this._edgeA[id], this._edgeB[id]]; }

  /** Incident face ids. */
  edgeFaces(id: number): number[] {
    const out: number[] = [];
    for (let c = this._edgeFirstCorner[id]; c !== NONE; c = this._cNextInEdge[c]) out.push(this._cFace[c]);
    return out;
  }

  edgeData(id: number): Record<string, any> {
    if (!this._edgeData) this._edgeData = new Map();
    let d = this._edgeData.get(id);
    if (!d) this._edgeData.set(id, (d = {}));
    return d;
  }

  isEdgeAlive(id: number): boolean { return id >= 0 && id < this._edgeN && this._edgeAlive[id] === 1; }

  edge(id: number): MeshEdge | undefined {
    return this.isEdgeAlive(id) ? new EdgeView(this, id) : undefined;
  }

  *edges(): IterableIterator<MeshEdge> {
    for (let i = 0; i < this._edgeN; i++) if (this._edgeAlive[i]) yield new EdgeView(this, i);
  }

  edgesArray(): MeshEdge[] { return [...this.edges()]; }

  /** The edge joining two nodes, in either direction, or undefined. */
  findEdge(a: number, b: number): number | undefined {
    if (!this.isNodeAlive(a)) return undefined;
    for (let e = this._nodeFirstEdge[a]; e !== NONE; e = this._nextEdgeOf(e, a)) {
      const ea = this._edgeA[e], eb = this._edgeB[e];
      if ((ea === a && eb === b) || (ea === b && eb === a)) return e;
    }
    return undefined;
  }

  /** Adds an edge, or returns the existing one between the two nodes. */
  addEdge(a: number, b: number, data?: Record<string, any>): number {
    const existing = this.findEdge(a, b);
    if (existing !== undefined) return existing;
    const id = this._edgeN;
    this._needEdges(id + 1);
    this._edgeA[id] = a; this._edgeB[id] = b;
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
    if (data) this._edgeData ? this._edgeData.set(id, data) : (this._edgeData = new Map([[id, data]]));
    return id;
  }

  edgeOtherNode(edgeId: number, nodeId: number): number {
    return this._edgeA[edgeId] === nodeId ? this._edgeB[edgeId] : this._edgeA[edgeId];
  }

  isBoundaryEdge(id: number): boolean {
    return this.isEdgeAlive(id) ? this._edgeCornerCount(id) < 2 : false;
  }

  boundaryEdges(): MeshEdge[] {
    const out: MeshEdge[] = [];
    for (let e = 0; e < this._edgeN; e++) {
      if (this._edgeAlive[e] && this._edgeCornerCount(e) < 2) out.push(new EdgeView(this, e));
    }
    return out;
  }

  /** Removes the edge and every face that uses it. */
  removeEdge(id: number): void {
    if (!this.isEdgeAlive(id)) return;
    for (const f of this.edgeFaces(id)) this.removeFace(f);
    const a = this._edgeA[id], b = this._edgeB[id];
    this._unlinkEdge(id, a);
    if (b !== a) this._unlinkEdge(id, b);
    this._edgeAlive[id] = 0;
    this._edgeLive--;
    this._edgeData?.delete(id);
  }

  private _nextEdgeOf(e: number, node: number): number {
    return this._edgeA[e] === node ? this._edgeNext[2 * e] : this._edgeNext[2 * e + 1];
  }

  private _edgeCornerCount(e: number): number {
    let n = 0;
    for (let c = this._edgeFirstCorner[e]; c !== NONE; c = this._cNextInEdge[c]) n++;
    return n;
  }

  private _unlinkEdge(id: number, node: number): void {
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
  faceVerts(id: number): Uint32Array {
    return this._cVert.subarray(this._faceStart[id], this._faceStart[id + 1]);
  }

  faceNodes(id: number): number[] { return Array.from(this.faceVerts(id)); }

  faceEdges(id: number): number[] {
    return Array.from(this._cEdge.subarray(this._faceStart[id], this._faceStart[id + 1]));
  }

  faceSize(id: number): number { return this._faceStart[id + 1] - this._faceStart[id]; }

  /** Face normal if `computeFaceNormals()` covered this face, else undefined. */
  faceNormal(id: number): Vec3 | undefined {
    if (!this._faceNrm || id >= this._faceNrmN) return undefined;
    const o = id * 3;
    return new Vec3(this._faceNrm[o], this._faceNrm[o + 1], this._faceNrm[o + 2]);
  }

  setFaceNormal(id: number, n: Vec3): void {
    if (!this._faceNrm) this._faceNrm = new Float32Array(this._faceAlive.length * 3);
    const o = id * 3;
    this._faceNrm[o] = n.x; this._faceNrm[o + 1] = n.y; this._faceNrm[o + 2] = n.z;
    if (this._faceNrmN <= id) this._faceNrmN = id + 1;
  }

  faceData(id: number): Record<string, any> {
    if (!this._faceData) this._faceData = new Map();
    let d = this._faceData.get(id);
    if (!d) this._faceData.set(id, (d = {}));
    return d;
  }

  isFaceAlive(id: number): boolean { return id >= 0 && id < this._faceN && this._faceAlive[id] === 1; }

  face(id: number): MeshFace | undefined {
    return this.isFaceAlive(id) ? new FaceView(this, id) : undefined;
  }

  *faces(): IterableIterator<MeshFace> {
    for (let i = 0; i < this._faceN; i++) if (this._faceAlive[i]) yield new FaceView(this, i);
  }

  facesArray(): MeshFace[] { return [...this.faces()]; }

  /** Live face ids, in order. */
  faceIds(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this._faceN; i++) if (this._faceAlive[i]) out.push(i);
    return out;
  }

  addFace(nodeIds: ArrayLike<number>, data?: Record<string, any>): number {
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
    if (data) this._faceData ? this._faceData.set(id, data) : (this._faceData = new Map([[id, data]]));
    return id;
  }

  addTriangle(a: number, b: number, c: number, data?: Record<string, any>): number {
    return this.addFace([a, b, c], data);
  }

  addQuad(a: number, b: number, c: number, d: number, data?: Record<string, any>): number {
    return this.addFace([a, b, c, d], data);
  }

  /** Removes the face. Its edges stay (an edge is its own element). */
  removeFace(id: number): void {
    if (!this.isFaceAlive(id)) return;
    this._unlinkCorners(id);
    this._faceAlive[id] = 0;
    this._faceLive--;
    this._triCount -= Math.max(0, this.faceSize(id) - 2);
    this._faceData?.delete(id);
    this._tri = null;
  }

  /** Reverses the winding of a face in place (what `face.nodes.reverse()` used to do). */
  reverseFace(id: number): void {
    if (!this.isFaceAlive(id)) return;
    this._unlinkCorners(id);
    const v = this.faceVerts(id);
    v.reverse();
    this._linkCorners(id);
    this._tri = null;
  }

  faceTriangle(id: number): Triangle | null {
    if (!this.isFaceAlive(id) || this.faceSize(id) !== 3) return null;
    const s = this._faceStart[id];
    return new Triangle(
      this.getPosition(this._cVert[s]),
      this.getPosition(this._cVert[s + 1]),
      this.getPosition(this._cVert[s + 2]),
    );
  }

  /** Registers the face's corners with their edges and nodes (edges are created as needed). */
  private _linkCorners(id: number): void {
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

  private _unlinkCorners(id: number): void {
    const s = this._faceStart[id], e = this._faceStart[id + 1];
    for (let c = s; c < e; c++) {
      // edge list
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
      // node list
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

  clear(): void {
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
  compact(): { nodes: Int32Array; edges: Int32Array; faces: Int32Array } {
    const fresh = new Mesh();
    const maps = this._copyInto(fresh);
    Object.assign(this, fresh);
    return maps;
  }

  clone(): Mesh {
    const m = new Mesh();
    this._copyInto(m);
    return m;
  }

  /** Copies the live elements into `m` (densely renumbered) and returns the id maps. */
  private _copyInto(m: Mesh): { nodes: Int32Array; edges: Int32Array; faces: Int32Array } {
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
      if (hasNrm) { m._nrm![j * 3] = this._nrm![i * 3]; m._nrm![j * 3 + 1] = this._nrm![i * 3 + 1]; m._nrm![j * 3 + 2] = this._nrm![i * 3 + 2]; }
      if (this._uv) { m._uv![j * 2] = this._uv[i * 2]; m._uv![j * 2 + 1] = this._uv[i * 2 + 1]; }
      if (this._col) for (let k = 0; k < 4; k++) m._col![j * 4 + k] = this._col[i * 4 + k];
      const d = this._nodeData?.get(i);
      if (d) (m._nodeData ??= new Map()).set(j, d);
    }
    if (hasNrm) m._nrmN = m._nodeN;
    // edges first, so ids of face-less edges survive and edge order is kept
    for (let e = 0; e < this._edgeN; e++) {
      if (!this._edgeAlive[e]) continue;
      edges[e] = m.addEdge(nodes[this._edgeA[e]], nodes[this._edgeB[e]], this._edgeData?.get(e));
    }
    const buf: number[] = [];
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
  merge(other: Mesh): Mesh {
    const m = this.clone();
    const nodes = new Int32Array(other._nodeN).fill(NONE);
    // attributes survive only when both sides carry them
    if (!(m._uv && other._uv)) m._uv = null;
    if (!(m._col && other._col)) m._col = null;
    for (let i = 0; i < other._nodeN; i++) {
      if (!other._nodeAlive[i]) continue;
      const j = nodes[i] = m._addNodeXYZ(other._pos[i * 3], other._pos[i * 3 + 1], other._pos[i * 3 + 2]);
      if (m._uv) { m._uv[j * 2] = other._uv![i * 2]; m._uv[j * 2 + 1] = other._uv![i * 2 + 1]; }
      if (m._col) for (let k = 0; k < 4; k++) m._col[j * 4 + k] = other._col![i * 4 + k];
    }
    for (let e = 0; e < other._edgeN; e++) {
      if (other._edgeAlive[e]) m.addEdge(nodes[other._edgeA[e]], nodes[other._edgeB[e]]);
    }
    const buf: number[] = [];
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
  computeFaceNormals(): void {
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
      fn[f * 3] = nx * inv; fn[f * 3 + 1] = ny * inv; fn[f * 3 + 2] = nz * inv;
    }
    this._faceNrmN = this._faceN;
  }

  /** Vertex normal = normalised sum of the unit normals of the faces around it. */
  computeVertexNormals(): void {
    this.computeFaceNormals();
    if (!this._nrm || this._nrm.length < this._nodeAlive.length * 3) {
      this._nrm = new Float32Array(this._nodeAlive.length * 3);
    }
    const nrm = this._nrm, fn = this._faceNrm!, cv = this._cVert;
    nrm.fill(0, 0, this._nodeN * 3);
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const x = fn[f * 3], y = fn[f * 3 + 1], z = fn[f * 3 + 2];
      for (let c = this._faceStart[f], e = this._faceStart[f + 1]; c < e; c++) {
        const o = cv[c] * 3;
        nrm[o] += x; nrm[o + 1] += y; nrm[o + 2] += z;
      }
    }
    for (let i = 0; i < this._nodeN; i++) {
      const o = i * 3;
      const len = Math.sqrt(nrm[o] * nrm[o] + nrm[o + 1] * nrm[o + 1] + nrm[o + 2] * nrm[o + 2]);
      if (len > 1e-12) { nrm[o] /= len; nrm[o + 1] /= len; nrm[o + 2] /= len; }
      else { nrm[o] = 0; nrm[o + 1] = 0; nrm[o + 2] = 0; }
    }
    this._nrmN = this._nodeN;
  }

  /** Flat-mesh spelling of `computeVertexNormals`. */
  computeNormals(): void { this.computeVertexNormals(); }

  // ── Measures ──

  bounds(): AABB {
    if (this._bounds) return this._bounds;
    const pos = this._pos;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    if (this._nodeLive === 0) minX = minY = minZ = maxX = maxY = maxZ = 0;
    return (this._bounds = new AABB(new Vec3(minX, minY, minZ), new Vec3(maxX, maxY, maxZ)));
  }

  /** Signed-tetrahedra volume (closed, consistently wound meshes). */
  volume(): number {
    const pos = this._pos, idx = this.indices;
    let vol = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      vol += (
        pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) +
        pos[a + 1] * (pos[b + 2] * pos[c] - pos[b] * pos[c + 2]) +
        pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c])
      ) / 6;
    }
    return Math.abs(vol);
  }

  surfaceArea(): number {
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
  centroid(): Vec3 {
    let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      sx += this._pos[i * 3]; sy += this._pos[i * 3 + 1]; sz += this._pos[i * 3 + 2];
    }
    const n = this._nodeLive || 1;
    return new Vec3(sx / n, sy / n, sz / n);
  }

  /** V − E + F over the live elements. */
  eulerCharacteristic(): number { return this._nodeLive - this._edgeLive + this._faceLive; }

  // ── In-place geometry ──

  translate(dx: number, dy: number, dz: number): void {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN * 3; i += 3) { pos[i] += dx; pos[i + 1] += dy; pos[i + 2] += dz; }
    this._bounds = null;
  }

  scale(s: number): void {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN * 3; i++) pos[i] *= s;
    this._bounds = null;
  }

  scaleXYZ(sx: number, sy: number, sz: number): void {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN * 3; i += 3) { pos[i] *= sx; pos[i + 1] *= sy; pos[i + 2] *= sz; }
    this.markPositionsChanged();
  }

  mapPositions(fn: (x: number, y: number, z: number, index: number) => [number, number, number]): void {
    const pos = this._pos;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      const [x, y, z] = fn(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], i);
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    }
    this.markPositionsChanged();
  }

  /** Laplacian smoothing: each interior node moves toward the mean of its neighbours. */
  smooth(iterations = 1, factor = 0.5): void {
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
          const o = (this._edgeA[e] === v ? this._edgeB[e] : this._edgeA[e]) * 3;
          ax += tmp[o]; ay += tmp[o + 1]; az += tmp[o + 2]; k++;
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
  splitEdge(edgeId: number, t = 0.5): number {
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
        const other = nodeList.find(n => n !== a && n !== b)!;
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
  collapseEdge(edgeId: number): number {
    if (!this.isEdgeAlive(edgeId)) return -1;
    const [keepId, removeId] = this.edgeNodes(edgeId);
    this.setPosition(keepId, this.getPosition(keepId).lerp(this.getPosition(removeId), 0.5));
    for (const fid of this.nodeFaces(removeId)) {
      const data = this._faceData?.get(fid);
      const unique = [...new Set(this.faceNodes(fid).map(n => (n === removeId ? keepId : n)))];
      this.removeFace(fid);
      if (unique.length >= 3) this.addFace(unique, data);
    }
    this.removeNode(removeId);
    return keepId;
  }

  // ── Triangle access (flat API) ──

  getTriangle(t: number): [number, number, number] {
    const idx = this.indices, o = t * 3;
    return [idx[o], idx[o + 1], idx[o + 2]];
  }

  getTrianglePositions(t: number): [Vec3, Vec3, Vec3] {
    const [a, b, c] = this.getTriangle(t);
    return [this.getPosition(a), this.getPosition(b), this.getPosition(c)];
  }

  // ── Conversion ──

  /** Flat Float32 arrays for rendering/IO. Dense: removed nodes are dropped. */
  toMeshData(): MeshData {
    const nrm = this.normals;
    const idx = this.indices;
    if (!this.hasTombstones || this._nodeLive === this._nodeN) {
      const n = this._nodeN * 3;
      const positions = new Float32Array(n);
      for (let i = 0; i < n; i++) positions[i] = this._pos[i];
      return {
        positions,
        normals: new Float32Array(nrm),
        indices: idx === this._tri && idx.buffer === this._cVert.buffer ? new Uint32Array(idx) : idx,
        ...(this._uv ? { uvs: new Float32Array(this.uvs!) } : {}),
        ...(this._col ? { colors: new Float32Array(this.colors!) } : {}),
      };
    }
    const map = new Int32Array(this._nodeN).fill(NONE);
    let k = 0;
    for (let i = 0; i < this._nodeN; i++) if (this._nodeAlive[i]) map[i] = k++;
    const positions = new Float32Array(k * 3), normals = new Float32Array(k * 3);
    const uvs = this._uv ? new Float32Array(k * 2) : undefined;
    const colors = this._col ? new Float32Array(k * 4) : undefined;
    for (let i = 0; i < this._nodeN; i++) {
      const j = map[i];
      if (j === NONE) continue;
      for (let d = 0; d < 3; d++) { positions[j * 3 + d] = this._pos[i * 3 + d]; normals[j * 3 + d] = nrm[i * 3 + d]; }
      if (uvs) { uvs[j * 2] = this._uv![i * 2]; uvs[j * 2 + 1] = this._uv![i * 2 + 1]; }
      if (colors) for (let d = 0; d < 4; d++) colors[j * 4 + d] = this._col![i * 4 + d];
    }
    const indices = new Uint32Array(idx.length);
    for (let i = 0; i < idx.length; i++) indices[i] = map[idx[i]];
    return { positions, normals, indices, ...(uvs ? { uvs } : {}), ...(colors ? { colors } : {}) };
  }

  static fromMeshData(d: MeshData): Mesh {
    return new Mesh(d.positions, d.indices, d.normals, d.uvs, d.colors);
  }

  static fromArrays(
    positions: ArrayLike<number>,
    indices: ArrayLike<number>,
    normals?: ArrayLike<number>,
    uvs?: ArrayLike<number>,
    colors?: ArrayLike<number>,
  ): Mesh {
    return new Mesh(positions, indices, normals, uvs, colors);
  }

  static fromIndexedTriangles(positions: Vec3[], indices: number[], data?: Record<string, any>[]): Mesh {
    const mesh = new Mesh();
    const ids = mesh.addNodes(positions);
    for (let i = 0; i < indices.length; i += 3) {
      mesh.addTriangle(ids[indices[i]], ids[indices[i + 1]], ids[indices[i + 2]], data?.[i / 3]);
    }
    mesh.computeVertexNormals();
    return mesh;
  }

  static fromFaces(positions: Vec3[], faces: number[][]): Mesh {
    const mesh = new Mesh();
    const ids = mesh.addNodes(positions);
    for (const f of faces) mesh.addFace(f.map(i => ids[i]));
    mesh.computeVertexNormals();
    return mesh;
  }

  private _load(
    positions: ArrayLike<number>, indices: ArrayLike<number>,
    normals?: ArrayLike<number>, uvs?: ArrayLike<number>, colors?: ArrayLike<number>,
  ): void {
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
      tri[0] = indices[i]; tri[1] = indices[i + 1]; tri[2] = indices[i + 2];
      this.addFace(tri);
    }
  }

  // ── Serialization ──

  toJSON(): MeshJSON {
    const map = new Int32Array(this._nodeN).fill(NONE);
    const positions: number[] = [];
    let k = 0;
    for (let i = 0; i < this._nodeN; i++) {
      if (!this._nodeAlive[i]) continue;
      map[i] = k++;
      positions.push(this._pos[i * 3], this._pos[i * 3 + 1], this._pos[i * 3 + 2]);
    }
    const faces: number[][] = [];
    const faceData: [number, Record<string, any>][] = [];
    for (let f = 0; f < this._faceN; f++) {
      if (!this._faceAlive[f]) continue;
      const d = this._faceData?.get(f);
      if (d && Object.keys(d).length) faceData.push([faces.length, d]);
      faces.push(this.faceNodes(f).map(n => map[n]));
    }
    const nodeData: [number, Record<string, any>][] = [];
    if (this._nodeData) for (const [id, d] of this._nodeData) if (map[id] !== NONE && Object.keys(d).length) nodeData.push([map[id], d]);
    const out: MeshJSON = { positions, faces };
    if (this._nrm && this._nrmN === this._nodeN) {
      const normals: number[] = [];
      for (let i = 0; i < this._nodeN; i++) if (map[i] !== NONE) normals.push(this._nrm[i * 3], this._nrm[i * 3 + 1], this._nrm[i * 3 + 2]);
      out.normals = normals;
    }
    if (this._uv) { const uvs: number[] = []; for (let i = 0; i < this._nodeN; i++) if (map[i] !== NONE) uvs.push(this._uv[i * 2], this._uv[i * 2 + 1]); out.uvs = uvs; }
    if (this._col) { const colors: number[] = []; for (let i = 0; i < this._nodeN; i++) if (map[i] !== NONE) colors.push(this._col[i * 4], this._col[i * 4 + 1], this._col[i * 4 + 2], this._col[i * 4 + 3]); out.colors = colors; }
    if (nodeData.length) out.nodeData = nodeData;
    if (faceData.length) out.faceData = faceData;
    return out;
  }

  /** Reads the current format and both legacy ones (`{nodes, faces}` and `{positions, indices}`). */
  static fromJSON(json: MeshJSON | LegacyMeshJSON): Mesh {
    if ("nodes" in json) {
      const mesh = new Mesh();
      const idMap = new Map<number, number>();
      for (const nj of json.nodes) idMap.set(nj.id, mesh.addNode(Vec3.fromJSON(nj.position), nj.data && Object.keys(nj.data).length ? nj.data : undefined));
      for (const fj of json.faces) mesh.addFace(fj.nodes.map(n => idMap.get(n)!), fj.data && Object.keys(fj.data).length ? fj.data : undefined);
      mesh.computeVertexNormals();
      return mesh;
    }
    if ("indices" in json) return new Mesh(json.positions, json.indices, json.normals, json.uvs);
    const mesh = new Mesh(json.positions, [], json.normals, json.uvs, json.colors);
    for (const f of json.faces) mesh.addFace(f);
    if (json.nodeData) for (const [id, d] of json.nodeData) mesh._nodeData ? mesh._nodeData.set(id, d) : (mesh._nodeData = new Map([[id, d]]));
    if (json.faceData) for (const [id, d] of json.faceData) mesh._faceData ? mesh._faceData.set(id, d) : (mesh._faceData = new Map([[id, d]]));
    return mesh;
  }

  // ── Capacity ──

  private _needNodes(n: number): void {
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

  private _needEdges(n: number): void {
    let cap = this._edgeAlive.length;
    if (n <= cap) return;
    while (cap < n) cap *= 2;
    this._edgeA = grow(this._edgeA, cap);
    this._edgeB = grow(this._edgeB, cap);
    this._edgeNext = grow(this._edgeNext, cap * 2, NONE);
    this._edgeFirstCorner = grow(this._edgeFirstCorner, cap, NONE);
    this._edgeAlive = grow(this._edgeAlive, cap);
  }

  private _needFaces(n: number): void {
    let cap = this._faceAlive.length;
    if (n <= cap) return;
    while (cap < n) cap *= 2;
    this._faceStart = grow(this._faceStart, cap + 1);
    this._faceAlive = grow(this._faceAlive, cap);
    if (this._faceNrm) this._faceNrm = grow(this._faceNrm, cap * 3);
  }

  private _needCorners(n: number): void {
    let cap = this._cVert.length;
    if (n <= cap) return;
    while (cap < n) cap *= 2;
    this._cVert = grow(this._cVert, cap);
    this._cFace = grow(this._cFace, cap);
    this._cEdge = grow(this._cEdge, cap, NONE);
    this._cNextInNode = grow(this._cNextInNode, cap, NONE);
    this._cNextInEdge = grow(this._cNextInEdge, cap, NONE);
  }
}
