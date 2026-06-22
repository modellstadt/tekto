/**
 * Tekto ConnectedMesh — Topological mesh with adjacency queries.
 *
 * A flexible mesh data structure with:
 *   - Nodes (vertices) with edge adjacency lists
 *   - Edges with face adjacency
 *   - Faces with ordered node/edge references
 *
 * Mirrors HDGEO.Core.ConnectedMesh.
 */

import { Vec3 } from "../../math/vectors";
import { AABB } from "../AABB";
import { Triangle } from "../Triangle";

// ─── Element Types ───────────────────────────

export interface MeshNode {
  id: number;
  position: Vec3;
  edges: number[];
  faces: number[];
  normal?: Vec3;
  data: Record<string, any>;
}

export interface MeshEdge {
  id: number;
  nodes: [number, number];
  faces: number[];
  data: Record<string, any>;
}

export interface MeshFace {
  id: number;
  nodes: number[];
  edges: number[];
  normal?: Vec3;
  data: Record<string, any>;
}

// ─── ConnectedMesh Class ──────────────────────

export class ConnectedMesh {
  private _nodes: Map<number, MeshNode> = new Map();
  private _edges: Map<number, MeshEdge> = new Map();
  private _faces: Map<number, MeshFace> = new Map();
  private _nextNodeId = 0;
  private _nextEdgeId = 0;
  private _nextFaceId = 0;
  private _bounds: AABB | null = null;

  // ── Accessors ──

  get nodeCount(): number { return this._nodes.size; }
  get edgeCount(): number { return this._edges.size; }
  get faceCount(): number { return this._faces.size; }

  node(id: number): MeshNode | undefined { return this._nodes.get(id); }
  edge(id: number): MeshEdge | undefined { return this._edges.get(id); }
  face(id: number): MeshFace | undefined { return this._faces.get(id); }

  nodes(): IterableIterator<MeshNode> { return this._nodes.values(); }
  edges(): IterableIterator<MeshEdge> { return this._edges.values(); }
  faces(): IterableIterator<MeshFace> { return this._faces.values(); }

  nodesArray(): MeshNode[] { return [...this._nodes.values()]; }
  edgesArray(): MeshEdge[] { return [...this._edges.values()]; }
  facesArray(): MeshFace[] { return [...this._faces.values()]; }

  // ── Topology Builders ──

  addNode(position: Vec3, data: Record<string, any> = {}): number {
    const id = this._nextNodeId++;
    this._nodes.set(id, { id, position, edges: [], faces: [], data });
    this._bounds = null;
    return id;
  }

  addNodes(positions: Vec3[]): number[] {
    return positions.map(p => this.addNode(p));
  }

  addEdge(nodeA: number, nodeB: number, data: Record<string, any> = {}): number {
    const existing = this.findEdge(nodeA, nodeB);
    if (existing !== undefined) return existing;

    const id = this._nextEdgeId++;
    this._edges.set(id, { id, nodes: [nodeA, nodeB], faces: [], data });
    this._nodes.get(nodeA)!.edges.push(id);
    this._nodes.get(nodeB)!.edges.push(id);
    return id;
  }

  addFace(nodeIds: number[], data: Record<string, any> = {}): number {
    const id = this._nextFaceId++;
    const edgeIds: number[] = [];

    for (let i = 0; i < nodeIds.length; i++) {
      const a = nodeIds[i];
      const b = nodeIds[(i + 1) % nodeIds.length];
      const eid = this.addEdge(a, b);
      edgeIds.push(eid);
      this._edges.get(eid)!.faces.push(id);
    }

    for (const nid of nodeIds) {
      this._nodes.get(nid)!.faces.push(id);
    }

    this._faces.set(id, { id, nodes: nodeIds, edges: edgeIds, data });
    return id;
  }

  addTriangle(a: number, b: number, c: number, data: Record<string, any> = {}): number {
    return this.addFace([a, b, c], data);
  }

  addQuad(a: number, b: number, c: number, d: number, data: Record<string, any> = {}): number {
    return this.addFace([a, b, c, d], data);
  }

  // ── Removal ──

  removeNode(id: number): void {
    const node = this._nodes.get(id);
    if (!node) return;
    for (const fid of [...node.faces]) this.removeFace(fid);
    for (const eid of [...node.edges]) this.removeEdge(eid);
    this._nodes.delete(id);
    this._bounds = null;
  }

  removeEdge(id: number): void {
    const edge = this._edges.get(id);
    if (!edge) return;
    for (const fid of [...edge.faces]) this.removeFace(fid);
    for (const nid of edge.nodes) {
      const node = this._nodes.get(nid);
      if (node) node.edges = node.edges.filter(e => e !== id);
    }
    this._edges.delete(id);
  }

  removeFace(id: number): void {
    const face = this._faces.get(id);
    if (!face) return;
    for (const eid of face.edges) {
      const edge = this._edges.get(eid);
      if (edge) edge.faces = edge.faces.filter(f => f !== id);
    }
    for (const nid of face.nodes) {
      const node = this._nodes.get(nid);
      if (node) node.faces = node.faces.filter(f => f !== id);
    }
    this._faces.delete(id);
  }

  clear(): void {
    this._nodes.clear();
    this._edges.clear();
    this._faces.clear();
    this._nextNodeId = 0;
    this._nextEdgeId = 0;
    this._nextFaceId = 0;
    this._bounds = null;
  }

  // ── Queries ──

  findEdge(nodeA: number, nodeB: number): number | undefined {
    const na = this._nodes.get(nodeA);
    if (!na) return undefined;
    for (const eid of na.edges) {
      const e = this._edges.get(eid)!;
      if ((e.nodes[0] === nodeA && e.nodes[1] === nodeB) ||
          (e.nodes[0] === nodeB && e.nodes[1] === nodeA)) {
        return eid;
      }
    }
    return undefined;
  }

  nodeNeighbors(nodeId: number): number[] {
    const node = this._nodes.get(nodeId);
    if (!node) return [];
    const neighbors: number[] = [];
    for (const eid of node.edges) {
      const edge = this._edges.get(eid)!;
      neighbors.push(edge.nodes[0] === nodeId ? edge.nodes[1] : edge.nodes[0]);
    }
    return neighbors;
  }

  edgeFaces(edgeId: number): MeshFace[] {
    const edge = this._edges.get(edgeId);
    if (!edge) return [];
    return edge.faces.map(fid => this._faces.get(fid)!).filter(Boolean);
  }

  isBoundaryEdge(edgeId: number): boolean {
    const edge = this._edges.get(edgeId);
    return edge ? edge.faces.length < 2 : false;
  }

  isBoundaryNode(nodeId: number): boolean {
    const node = this._nodes.get(nodeId);
    if (!node) return false;
    return node.edges.some(eid => this.isBoundaryEdge(eid));
  }

  boundaryEdges(): MeshEdge[] {
    return this.edgesArray().filter(e => e.faces.length < 2);
  }

  edgeOtherNode(edgeId: number, nodeId: number): number {
    const edge = this._edges.get(edgeId)!;
    return edge.nodes[0] === nodeId ? edge.nodes[1] : edge.nodes[0];
  }

  bounds(): AABB {
    if (this._bounds) return this._bounds;
    this._bounds = AABB.fromPoints(this.nodesArray().map(n => n.position));
    return this._bounds;
  }

  faceTriangle(faceId: number): Triangle | null {
    const face = this._faces.get(faceId);
    if (!face || face.nodes.length !== 3) return null;
    return new Triangle(
      this._nodes.get(face.nodes[0])!.position,
      this._nodes.get(face.nodes[1])!.position,
      this._nodes.get(face.nodes[2])!.position
    );
  }

  // ── Normals ──

  computeFaceNormals(): void {
    for (const face of this._faces.values()) {
      if (face.nodes.length < 3) continue;
      const a = this._nodes.get(face.nodes[0])!.position;
      const b = this._nodes.get(face.nodes[1])!.position;
      const c = this._nodes.get(face.nodes[2])!.position;
      face.normal = b.sub(a).cross(c.sub(a)).normalize();
    }
  }

  computeVertexNormals(): void {
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

  splitEdge(edgeId: number, t = 0.5): number {
    const edge = this._edges.get(edgeId);
    if (!edge) return -1;

    const nA = this._nodes.get(edge.nodes[0])!;
    const nB = this._nodes.get(edge.nodes[1])!;
    const midPos = nA.position.lerp(nB.position, t);
    const midId = this.addNode(midPos);

    const facesToSplit = [...edge.faces];
    for (const fid of facesToSplit) {
      const face = this._faces.get(fid)!;
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
        const other = nodeList.find(n => n !== edge.nodes[0] && n !== edge.nodes[1])!;
        this.addFace([edge.nodes[0], midId, other], face.data);
        this.addFace([midId, edge.nodes[1], other], face.data);
      } else {
        this.addFace(newNodes, face.data);
      }
    }

    this.removeEdge(edgeId);
    return midId;
  }

  collapseEdge(edgeId: number): number {
    const edge = this._edges.get(edgeId);
    if (!edge) return -1;

    const [keepId, removeId] = edge.nodes;
    const keepNode = this._nodes.get(keepId)!;
    const removeNode = this._nodes.get(removeId)!;

    keepNode.position = keepNode.position.lerp(removeNode.position, 0.5);

    for (const fid of [...removeNode.faces]) {
      const face = this._faces.get(fid);
      if (!face) continue;

      const newNodes = face.nodes.map(n => n === removeId ? keepId : n);
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

  static fromIndexedTriangles(
    positions: Vec3[],
    indices: number[],
    data?: Record<string, any>[]
  ): ConnectedMesh {
    const mesh = new ConnectedMesh();
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

  static fromFaces(positions: Vec3[], faces: number[][]): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const nodeIds = mesh.addNodes(positions);
    for (const faceNodes of faces) {
      mesh.addFace(faceNodes.map(i => nodeIds[i]));
    }
    mesh.computeVertexNormals();
    return mesh;
  }

  toIndexedTriangles(): { positions: Float32Array; indices: Uint32Array; normals: Float32Array } {
    const nodeMap = new Map<number, number>();
    const posArray: number[] = [];
    const normArray: number[] = [];
    let idx = 0;

    for (const node of this._nodes.values()) {
      nodeMap.set(node.id, idx++);
      posArray.push(node.position.x, node.position.y, node.position.z);
      const n = node.normal ?? Vec3.unitY();
      normArray.push(n.x, n.y, n.z);
    }

    const indexArray: number[] = [];
    for (const face of this._faces.values()) {
      const nids = face.nodes.map(n => nodeMap.get(n)!);
      for (let i = 1; i < nids.length - 1; i++) {
        indexArray.push(nids[0], nids[i], nids[i + 1]);
      }
    }

    return {
      positions: new Float32Array(posArray),
      indices: new Uint32Array(indexArray),
      normals: new Float32Array(normArray),
    };
  }

  // ── Serialization ──

  toJSON(): MeshJSON {
    return {
      nodes: this.nodesArray().map(n => ({
        id: n.id,
        position: n.position.toJSON(),
        data: n.data,
      })),
      faces: this.facesArray().map(f => ({
        id: f.id,
        nodes: f.nodes,
        data: f.data,
      })),
    };
  }

  static fromJSON(json: MeshJSON): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const idMap = new Map<number, number>();

    for (const nj of json.nodes) {
      const newId = mesh.addNode(Vec3.fromJSON(nj.position), nj.data ?? {});
      idMap.set(nj.id, newId);
    }

    for (const fj of json.faces) {
      mesh.addFace(fj.nodes.map(n => idMap.get(n)!), fj.data ?? {});
    }

    mesh.computeVertexNormals();
    return mesh;
  }

  clone(): ConnectedMesh {
    return ConnectedMesh.fromJSON(this.toJSON());
  }
}

/** Backward-compat alias */
export { ConnectedMesh as Mesh };

// ─── JSON Types ──────────────────────────────

export interface MeshJSON {
  nodes: { id: number; position: { x: number; y: number; z: number }; data?: Record<string, any> }[];
  faces: { id: number; nodes: number[]; data?: Record<string, any> }[];
}
