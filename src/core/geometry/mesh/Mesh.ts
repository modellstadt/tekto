/**
 * Tekto Mesh — High-performance flat mesh using typed arrays.
 *
 * Designed for rendering, animation, GPU upload, and large meshes.
 * All faces are triangles. Adjacency is computed lazily.
 *
 * Mirrors HDGEO.Core.Mesh (the flat render mesh).
 */

import { Vec3 } from "../../math/vectors";
import { AABB } from "../AABB";
import { ConnectedMesh } from "./ConnectedMesh";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  uvs?: Float32Array;
  colors?: Float32Array;
}

export interface MeshJSON {
  positions: number[];
  indices: number[];
  normals?: number[];
  uvs?: number[];
}

/** Lazy-built adjacency data */
interface AdjacencyData {
  neighbors: Uint32Array[];
  edges: Uint32Array;
  vertexTriangles: Uint32Array[];
  edgeTriangles: Map<string, number[]>;
  boundary: Uint8Array;
}

// ═══════════════════════════════════════════════
// Mesh
// ═══════════════════════════════════════════════

export class Mesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  uvs: Float32Array | null;
  colors: Float32Array | null;

  private _adjacency: AdjacencyData | null = null;
  private _bounds: AABB | null = null;

  constructor(
    positions: Float32Array,
    indices: Uint32Array,
    normals?: Float32Array,
    uvs?: Float32Array,
    colors?: Float32Array,
  ) {
    this.positions = positions;
    this.indices = indices;
    this.normals = normals ?? new Float32Array(positions.length);
    this.uvs = uvs ?? null;
    this.colors = colors ?? null;

    if (!normals) this.computeNormals();
  }

  // ── Counts ──

  get vertexCount(): number { return this.positions.length / 3; }
  get triangleCount(): number { return this.indices.length / 3; }
  get edgeCount(): number { return this.adjacency.edges.length / 2; }

  // ── Vertex Access ──

  getPosition(i: number): Vec3 {
    const o = i * 3;
    return new Vec3(this.positions[o], this.positions[o + 1], this.positions[o + 2]);
  }

  setPosition(i: number, p: Vec3): void {
    const o = i * 3;
    this.positions[o] = p.x;
    this.positions[o + 1] = p.y;
    this.positions[o + 2] = p.z;
    this._bounds = null;
  }

  getNormal(i: number): Vec3 {
    const o = i * 3;
    return new Vec3(this.normals[o], this.normals[o + 1], this.normals[o + 2]);
  }

  getTriangle(triIdx: number): [number, number, number] {
    const o = triIdx * 3;
    return [this.indices[o], this.indices[o + 1], this.indices[o + 2]];
  }

  getTrianglePositions(triIdx: number): [Vec3, Vec3, Vec3] {
    const [a, b, c] = this.getTriangle(triIdx);
    return [this.getPosition(a), this.getPosition(b), this.getPosition(c)];
  }

  // ── Normals ──

  computeNormals(): void {
    const pos = this.positions, nrm = this.normals, idx = this.indices;
    nrm.fill(0);

    for (let t = 0; t < idx.length; t += 3) {
      const ai = idx[t] * 3, bi = idx[t + 1] * 3, ci = idx[t + 2] * 3;

      const abx = pos[bi] - pos[ai], aby = pos[bi + 1] - pos[ai + 1], abz = pos[bi + 2] - pos[ai + 2];
      const acx = pos[ci] - pos[ai], acy = pos[ci + 1] - pos[ai + 1], acz = pos[ci + 2] - pos[ai + 2];

      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;

      nrm[ai] += nx; nrm[ai + 1] += ny; nrm[ai + 2] += nz;
      nrm[bi] += nx; nrm[bi + 1] += ny; nrm[bi + 2] += nz;
      nrm[ci] += nx; nrm[ci + 1] += ny; nrm[ci + 2] += nz;
    }

    for (let i = 0; i < nrm.length; i += 3) {
      const x = nrm[i], y = nrm[i + 1], z = nrm[i + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 1e-12) {
        const inv = 1 / len;
        nrm[i] *= inv; nrm[i + 1] *= inv; nrm[i + 2] *= inv;
      } else {
        nrm[i] = 0; nrm[i + 1] = 1; nrm[i + 2] = 0;
      }
    }
  }

  // ── Lazy Adjacency ──

  get adjacency(): AdjacencyData {
    if (!this._adjacency) this._adjacency = this._buildAdjacency();
    return this._adjacency;
  }

  invalidateAdjacency(): void {
    this._adjacency = null;
  }

  private _buildAdjacency(): AdjacencyData {
    const vc = this.vertexCount;
    const idx = this.indices;
    const tc = this.triangleCount;

    const vtCounts = new Uint32Array(vc);
    for (let i = 0; i < idx.length; i++) vtCounts[idx[i]]++;

    const vertexTriangles: Uint32Array[] = new Array(vc);
    const vtOffsets = new Uint32Array(vc);
    for (let v = 0; v < vc; v++) vertexTriangles[v] = new Uint32Array(vtCounts[v]);

    for (let t = 0; t < tc; t++) {
      const o = t * 3;
      for (let j = 0; j < 3; j++) {
        const v = idx[o + j];
        vertexTriangles[v][vtOffsets[v]++] = t;
      }
    }

    const edgeSet = new Map<string, [number, number]>();
    const edgeTris = new Map<string, number[]>();
    const neighborSets: Set<number>[] = new Array(vc);
    for (let v = 0; v < vc; v++) neighborSets[v] = new Set();

    for (let t = 0; t < tc; t++) {
      const o = t * 3;
      for (let j = 0; j < 3; j++) {
        const a = idx[o + j], b = idx[o + (j + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (!edgeSet.has(key)) edgeSet.set(key, [Math.min(a, b), Math.max(a, b)]);
        if (!edgeTris.has(key)) edgeTris.set(key, []);
        edgeTris.get(key)!.push(t);
        neighborSets[a].add(b);
        neighborSets[b].add(a);
      }
    }

    const neighbors: Uint32Array[] = neighborSets.map(s => new Uint32Array(s));

    const edges = new Uint32Array(edgeSet.size * 2);
    let ei = 0;
    for (const [a, b] of edgeSet.values()) {
      edges[ei++] = a; edges[ei++] = b;
    }

    const boundary = new Uint8Array(vc);
    for (const [key, tris] of edgeTris) {
      if (tris.length < 2) {
        const [a, b] = key.split(':').map(Number);
        boundary[a] = 1;
        boundary[b] = 1;
      }
    }

    return { neighbors, edges, vertexTriangles, edgeTriangles: edgeTris, boundary };
  }

  // ── Queries ──

  neighbors(i: number): Uint32Array {
    return this.adjacency.neighbors[i];
  }

  isBoundary(i: number): boolean {
    return this.adjacency.boundary[i] === 1;
  }

  bounds(): AABB {
    if (this._bounds) return this._bounds;
    const pos = this.positions;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i + 1], z = pos[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    this._bounds = new AABB(new Vec3(minX, minY, minZ), new Vec3(maxX, maxY, maxZ));
    return this._bounds;
  }

  volume(): number {
    const pos = this.positions, idx = this.indices;
    let vol = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const ai = idx[t] * 3, bi = idx[t + 1] * 3, ci = idx[t + 2] * 3;
      vol += (
        pos[ai] * (pos[bi + 1] * pos[ci + 2] - pos[bi + 2] * pos[ci + 1]) +
        pos[ai + 1] * (pos[bi + 2] * pos[ci] - pos[bi] * pos[ci + 2]) +
        pos[ai + 2] * (pos[bi] * pos[ci + 1] - pos[bi + 1] * pos[ci])
      ) / 6;
    }
    return Math.abs(vol);
  }

  surfaceArea(): number {
    const pos = this.positions, idx = this.indices;
    let area = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const ai = idx[t] * 3, bi = idx[t + 1] * 3, ci = idx[t + 2] * 3;
      const abx = pos[bi] - pos[ai], aby = pos[bi + 1] - pos[ai + 1], abz = pos[bi + 2] - pos[ai + 2];
      const acx = pos[ci] - pos[ai], acy = pos[ci + 1] - pos[ai + 1], acz = pos[ci + 2] - pos[ai + 2];
      const cx = aby * acz - abz * acy, cy = abz * acx - abx * acz, cz = abx * acy - aby * acx;
      area += Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    }
    return area;
  }

  centroid(): Vec3 {
    const pos = this.positions;
    let sx = 0, sy = 0, sz = 0;
    const n = this.vertexCount;
    for (let i = 0; i < pos.length; i += 3) {
      sx += pos[i]; sy += pos[i + 1]; sz += pos[i + 2];
    }
    return new Vec3(sx / n, sy / n, sz / n);
  }

  eulerCharacteristic(): number {
    return this.vertexCount - this.edgeCount + this.triangleCount;
  }

  // ── Modification ──

  smooth(iterations = 1, factor = 0.5): void {
    const vc = this.vertexCount;
    const pos = this.positions;
    const adj = this.adjacency;
    const tmp = new Float32Array(pos.length);

    for (let iter = 0; iter < iterations; iter++) {
      tmp.set(pos);
      for (let v = 0; v < vc; v++) {
        if (adj.boundary[v]) continue;
        const nb = adj.neighbors[v];
        if (nb.length === 0) continue;
        const o = v * 3;
        let ax = 0, ay = 0, az = 0;
        for (let j = 0; j < nb.length; j++) {
          const no = nb[j] * 3;
          ax += tmp[no]; ay += tmp[no + 1]; az += tmp[no + 2];
        }
        const inv = 1 / nb.length;
        pos[o] = tmp[o] + (ax * inv - tmp[o]) * factor;
        pos[o + 1] = tmp[o + 1] + (ay * inv - tmp[o + 1]) * factor;
        pos[o + 2] = tmp[o + 2] + (az * inv - tmp[o + 2]) * factor;
      }
    }

    this.computeNormals();
    this._bounds = null;
  }

  translate(dx: number, dy: number, dz: number): void {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += dx; pos[i + 1] += dy; pos[i + 2] += dz;
    }
    this._bounds = null;
  }

  scale(s: number): void {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i++) pos[i] *= s;
    this._bounds = null;
  }

  scaleXYZ(sx: number, sy: number, sz: number): void {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] *= sx; pos[i + 1] *= sy; pos[i + 2] *= sz;
    }
    this.computeNormals();
    this._bounds = null;
  }

  mapPositions(fn: (x: number, y: number, z: number, index: number) => [number, number, number]): void {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i += 3) {
      const [x, y, z] = fn(pos[i], pos[i + 1], pos[i + 2], i / 3);
      pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
    }
    this.computeNormals();
    this._bounds = null;
  }

  // ── Merge ──

  merge(other: Mesh): Mesh {
    const vc = this.vertexCount;
    const newPos = new Float32Array(this.positions.length + other.positions.length);
    newPos.set(this.positions); newPos.set(other.positions, this.positions.length);

    const newNrm = new Float32Array(this.normals.length + other.normals.length);
    newNrm.set(this.normals); newNrm.set(other.normals, this.normals.length);

    const newIdx = new Uint32Array(this.indices.length + other.indices.length);
    newIdx.set(this.indices);
    for (let i = 0; i < other.indices.length; i++) {
      newIdx[this.indices.length + i] = other.indices[i] + vc;
    }

    return new Mesh(newPos, newIdx, newNrm);
  }

  // ── Clone ──

  clone(): Mesh {
    return new Mesh(
      new Float32Array(this.positions),
      new Uint32Array(this.indices),
      new Float32Array(this.normals),
      this.uvs ? new Float32Array(this.uvs) : undefined,
      this.colors ? new Float32Array(this.colors) : undefined,
    );
  }

  // ── Serialization ──

  toJSON(): MeshJSON {
    return {
      positions: Array.from(this.positions),
      indices: Array.from(this.indices),
      normals: Array.from(this.normals),
      uvs: this.uvs ? Array.from(this.uvs) : undefined,
    };
  }

  static fromJSON(json: MeshJSON): Mesh {
    return new Mesh(
      new Float32Array(json.positions),
      new Uint32Array(json.indices),
      json.normals ? new Float32Array(json.normals) : undefined,
      json.uvs ? new Float32Array(json.uvs) : undefined,
    );
  }

  // ── Conversion: ConnectedMesh <-> Mesh ──

  static fromConnectedMesh(mesh: ConnectedMesh): Mesh {
    const data = mesh.toIndexedTriangles();
    return new Mesh(data.positions, data.indices, data.normals);
  }

  /** @deprecated Use fromConnectedMesh instead */
  static fromMesh(mesh: ConnectedMesh): Mesh {
    return Mesh.fromConnectedMesh(mesh);
  }

  toConnectedMesh(): ConnectedMesh {
    const positions: Vec3[] = [];
    for (let i = 0; i < this.positions.length; i += 3) {
      positions.push(new Vec3(this.positions[i], this.positions[i + 1], this.positions[i + 2]));
    }
    const indices: number[] = Array.from(this.indices);
    return ConnectedMesh.fromIndexedTriangles(positions, indices);
  }

  /** @deprecated Use toConnectedMesh instead */
  toMesh(): ConnectedMesh {
    return this.toConnectedMesh();
  }

  static fromArrays(
    positions: Float32Array | number[],
    indices: Uint32Array | number[],
    normals?: Float32Array | number[],
  ): Mesh {
    return new Mesh(
      positions instanceof Float32Array ? positions : new Float32Array(positions),
      indices instanceof Uint32Array ? indices : new Uint32Array(indices),
      normals ? (normals instanceof Float32Array ? normals : new Float32Array(normals)) : undefined,
    );
  }
}

/** Backward-compat alias */
export { Mesh as FlatMesh };
