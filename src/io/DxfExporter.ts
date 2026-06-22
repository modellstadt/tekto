/**
 * DXF Exporter with hidden-line removal.
 *
 * Pipeline:
 *  1. Collect triangles (occluders) and edges (to draw)
 *  2. Project orthographically onto the view plane
 *  3. Back-face cull, depth-sort front-facing triangles
 *  4. Per-edge interval subtraction: clip visible [0,1] range against each
 *     closer triangle using Cyrus-Beck 2D clipping
 *  5. Write DXF R12 (AC1009) — universally compatible
 *
 * Usage:
 *   const exp = new DxfExporter();
 *   exp.addMesh(mesh.positions, mesh.indices, { layer: 'stairs' });
 *   exp.addPolyline(pts, { layer: 'centerline' });
 *   const dxf = exp.toDxf({ viewDir: new Vec3(0, 1, 0) });
 */

import { Vec3 } from '../core/math/vectors';
import type { BspTree } from '../core/algo/BspTree';
import { hiddenLineIdBuffer, type IdBufferOptions } from './IdBufferHiddenLine';

// ── Public types ──────────────────────────────────────────────────────────────

export interface DxfView {
  /** Direction the camera looks toward (into the scene). Will be normalized. */
  viewDir: Vec3;
  /** Up direction for the 2D output. Default: Vec3(0, 0, 1). */
  upDir?: Vec3;
}

export interface DxfLayerDef {
  name: string;
  /** AutoCAD Color Index (ACI): 1=red 2=yellow 3=green 4=cyan 5=blue 7=white */
  color?: number;
  lineType?: string;
}

export interface DxfMeshOptions {
  /** DXF layer name for edges of this mesh. Default: '0'. */
  layer?: string;
  /**
   * Include edges with dihedral angle above this threshold (degrees).
   * Lower = more edges. Default: 30.
   */
  featureAngle?: number;
  /** Include boundary (open) edges. Default: true. */
  boundary?: boolean;
  /**
   * If provided, soft edges (below featureAngle — e.g. tessellation lines)
   * are written to this layer instead of being discarded. Lets CAD users
   * toggle triangulation noise on/off independently.
   */
  softEdgeLayer?: string;
}

export interface DxfEdgeOptions {
  layer?: string;
}

export interface DxfWriteOptions {
  /** Scale multiplier applied to all coordinates. Default 1000 (meters→mm). */
  scale?: number;
  /** Decimal places in output. Default 3. */
  precision?: number;
  /**
   * Run hidden-line removal. Default true.
   * Set false for a fast export that projects all edges without occlusion testing.
   */
  hiddenLine?: boolean;
  /**
   * Debug mode: export ALL edges on classified layers instead of removing hidden lines.
   * Layers: "visible", "occluded", "all-edges" (projected without HL).
   * Overrides hiddenLine when true.
   */
  debugLayers?: boolean;
  /**
   * Depth bias for hidden-line self-occlusion prevention, in world units.
   * Must exceed tessellation error of curved surfaces but be smaller than
   * the thinnest geometry. Default 0.01.
   */
  depthBias?: number;
}

// ── Internal types ────────────────────────────────────────────────────────────

/** A point projected to screen space. d = depth along view direction. */
interface PP { u: number; v: number; d: number; }

interface STri {
  p: [PP, PP, PP];
  avgD: number;
  minU: number; maxU: number; minV: number; maxV: number;
  /** Original index into the flat tris array (for adjacency skip). */
  srcIdx: number;
}

interface IEdge {
  ax: number; ay: number; az: number; bx: number; by: number; bz: number;
  layer: string; kind?: 'feature' | 'boundary' | 'silhouette';
  adjTris?: number[];
  /** Face normals of adjacent triangles — used for front/back classification. */
  adjNormals?: [number, number, number][];
  /** Triangle index range [start, end) for the mesh this edge belongs to — used to
   *  skip all same-mesh triangles when depth-testing silhouette edges. */
  meshTriRange?: [number, number];
}
/** Edge between two faces — included as silhouette when exactly one face is front-facing. */
interface ISilhouetteEdge extends IEdge {
  n0x: number; n0y: number; n0z: number;
  n1x: number; n1y: number; n1z: number;
}
export interface DxfSegment { u0: number; v0: number; u1: number; v1: number; layer: string; }
type ISeg = DxfSegment;

// ── Main class ────────────────────────────────────────────────────────────────

export class DxfExporter {
  private _tris: { ax: number; ay: number; az: number; bx: number; by: number; bz: number; cx: number; cy: number; cz: number }[] = [];
  /** Per-triangle face normal (parallel to _tris). null = normals unavailable. */
  private _triNormals: [number, number, number][] | null = null;
  private _edges: IEdge[] = [];
  /** Edges whose visibility depends on view direction (silhouette candidates). */
  private _silhouetteEdges: ISilhouetteEdge[] = [];
  private _layers: Map<string, DxfLayerDef> = new Map();

  /** Define a layer with color and line type. */
  layer(def: DxfLayerDef): this {
    this._layers.set(def.name, def);
    return this;
  }

  /**
   * Add a triangulated mesh. Extracts triangles for occlusion and
   * feature / boundary edges for drawing.
   */
  addMesh(positions: Float32Array, indices: Uint32Array, options?: DxfMeshOptions): this {
    const layer          = options?.layer          ?? '0';
    const featAngle      = options?.featureAngle   ?? 30;
    const boundary       = options?.boundary       ?? true;
    const softEdgeLayer  = options?.softEdgeLayer;
    const cosThresh      = Math.cos(featAngle * Math.PI / 180);

    const nTri = indices.length / 3;
    const triBase = this._tris.length; // global index of first tri in this batch

    // ── Occluder triangles ──────────────────────────────────────────────────
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      this._tris.push({
        ax: positions[i0],     ay: positions[i0 + 1], az: positions[i0 + 2],
        bx: positions[i1],     by: positions[i1 + 1], bz: positions[i1 + 2],
        cx: positions[i2],     cy: positions[i2 + 1], cz: positions[i2 + 2],
      });
    }

    // ── Weld vertices by position (so duplicate verts share edge adjacency) ──
    const QUANT = 1e6; // quantize to ~1 micron
    const posKey = (vi: number) => {
      const o = vi * 3;
      return `${Math.round(positions[o] * QUANT)}:${Math.round(positions[o + 1] * QUANT)}:${Math.round(positions[o + 2] * QUANT)}`;
    };
    const weldMap = new Map<string, number>(); // posKey → canonical vertex index
    const weld = (vi: number): number => {
      const k = posKey(vi);
      const existing = weldMap.get(k);
      if (existing !== undefined) return existing;
      weldMap.set(k, vi);
      return vi;
    };

    // ── Vertex → incident triangles & Edge → adjacent triangles ────────────
    const vtxTris = new Map<number, number[]>(); // welded vertex → local tri indices
    const edgeMap = new Map<string, number[]>();
    const eKey = (a: number, b: number) => a < b ? `${a}:${b}` : `${b}:${a}`;
    for (let i = 0; i < nTri; i++) {
      const a = weld(indices[i * 3]), b = weld(indices[i * 3 + 1]), c = weld(indices[i * 3 + 2]);
      for (const v of [a, b, c]) {
        const arr = vtxTris.get(v); if (arr) arr.push(i); else vtxTris.set(v, [i]);
      }
      for (const [p, q] of [[a, b], [b, c], [c, a]] as [number, number][]) {
        const k = eKey(p, q);
        const arr = edgeMap.get(k) ?? []; arr.push(i); edgeMap.set(k, arr);
      }
    }

    // ── Face normals ────────────────────────────────────────────────────────
    if (!this._triNormals) this._triNormals = new Array(this._tris.length - nTri).fill([0, 0, 0]);
    const fn: [number, number, number][] = [];
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      const ux = positions[i1] - positions[i0], uy = positions[i1 + 1] - positions[i0 + 1], uz = positions[i1 + 2] - positions[i0 + 2];
      const vx = positions[i2] - positions[i0], vy = positions[i2 + 1] - positions[i0 + 1], vz = positions[i2 + 2] - positions[i0 + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const n: [number, number, number] = [nx / l, ny / l, nz / l];
      fn.push(n);
      this._triNormals.push(n);
    }

    // ── Classify edges ──────────────────────────────────────────────────────
    for (const [key, tris] of edgeMap) {
      const [as, bs] = key.split(':');
      const aVtx = +as, bVtx = +bs;
      const ai = aVtx * 3, bi = bVtx * 3;
      let include = false;
      let kind: 'feature' | 'boundary' | undefined;
      let edgeLayer = layer; // may be overridden to softEdgeLayer for soft edges

      // Deduplicate adjacent triangles by normal direction for angle calculation.
      // Multiple triangles with the same normal (coplanar) count as one unique face.
      const uniqueNormals: number[] = []; // indices into tris[] with distinct normals
      for (const t of tris) {
        const n = fn[t];
        const isDup = uniqueNormals.some(u => {
          const nu = fn[u];
          return n[0] * nu[0] + n[1] * nu[1] + n[2] * nu[2] > 0.999;
        });
        if (!isDup) uniqueNormals.push(t);
      }
      if (tris.length === 1) {
        // True boundary edge — only one triangle claims this edge (open mesh border)
        if (boundary) { include = true; kind = 'boundary'; }
      } else if (uniqueNormals.length === 1) {
        // Multiple triangles, all coplanar (same normal) → soft interior edge.
        // Note: duplicate/overlapping triangles also land here; routing them to
        // the soft layer rather than boundary is the correct CAD behaviour.
        if (softEdgeLayer) { include = true; kind = 'feature'; edgeLayer = softEdgeLayer; }
      } else if (featAngle < 0) {
        include = true; kind = 'feature';
      } else {
        // Multiple distinct normals — check angle between each pair
        let minDot = 1;
        for (let i = 0; i < uniqueNormals.length; i++) {
          for (let j = i + 1; j < uniqueNormals.length; j++) {
            const ni = fn[uniqueNormals[i]], nj = fn[uniqueNormals[j]];
            const d = ni[0] * nj[0] + ni[1] * nj[1] + ni[2] * nj[2];
            if (d < minDot) minDot = d;
          }
        }
        if (minDot < cosThresh) {
          include = true; kind = 'feature';
        } else if (softEdgeLayer) {
          // Sharp enough to share an edge but angle below threshold → soft
          include = true; kind = 'feature'; edgeLayer = softEdgeLayer;
        }
      }
      if (include) {
        // 2-ring adjacency: collect all triangles that share a vertex with any
        // 1-ring triangle. This prevents false self-occlusion from front-facing
        // triangles near silhouette edges on coarse tessellations.
        // 1-ring: all triangles touching either edge vertex
        const ring1 = new Set<number>();
        const aTris = vtxTris.get(aVtx); if (aTris) for (const t of aTris) ring1.add(t);
        const bTris = vtxTris.get(bVtx); if (bTris) for (const t of bTris) ring1.add(t);
        // 2-ring: all triangles touching any vertex of any 1-ring triangle
        const ring2 = new Set<number>();
        ring1.forEach(t => ring2.add(t));
        ring1.forEach(t => {
          const va = weld(indices[t * 3]), vb = weld(indices[t * 3 + 1]), vc = weld(indices[t * 3 + 2]);
          for (const v of [va, vb, vc]) {
            const vt = vtxTris.get(v); if (vt) for (const tt of vt) ring2.add(tt);
          }
        });
        const adjArr: number[] = [];
        ring2.forEach(t => adjArr.push(triBase + t));
        this._edges.push({
          ax: positions[ai], ay: positions[ai + 1], az: positions[ai + 2],
          bx: positions[bi], by: positions[bi + 1], bz: positions[bi + 2],
          layer: edgeLayer, kind,
          adjTris: adjArr,
          adjNormals: uniqueNormals.map(t => fn[t]),
          meshTriRange: [triBase, triBase + nTri],
        });
      }
    }
    return this;
  }

  /** Add triangles for occlusion only — edges NOT drawn. */
  addOccluder(positions: Float32Array, indices: Uint32Array): this {
    const nTri = indices.length / 3;
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      this._tris.push({
        ax: positions[i0], ay: positions[i0 + 1], az: positions[i0 + 2],
        bx: positions[i1], by: positions[i1 + 1], bz: positions[i1 + 2],
        cx: positions[i2], cy: positions[i2 + 1], cz: positions[i2 + 2],
      });
    }
    return this;
  }

  /** Add a polyline as a sequence of edges. */
  addPolyline(pts: Vec3[], options?: DxfEdgeOptions): this {
    const layer = options?.layer ?? '0';
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      this._edges.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer });
    }
    return this;
  }

  /** Add a single edge. */
  addEdge(a: Vec3, b: Vec3, options?: DxfEdgeOptions): this {
    this._edges.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer: options?.layer ?? '0' });
    return this;
  }

  /**
   * Add geometry from a BSP tree. Extracts occluder triangles, feature/boundary
   * edges, and silhouette edge candidates (view-dependent, resolved at export).
   *
   * BSP polygons have reliable normals, enabling back-face culling and silhouette
   * detection in the hidden-line pass.
   */
  addBspTree(bsp: BspTree, options?: DxfMeshOptions): this {
    const layer     = options?.layer        ?? '0';
    const featAngle = options?.featureAngle ?? 30;
    const boundary  = options?.boundary     ?? true;
    const cosThresh = Math.cos(featAngle * Math.PI / 180);

    const polys = bsp.toPolygons();
    if (!this._triNormals) this._triNormals = new Array(this._tris.length).fill([0, 0, 0]);

    // ── Fan-triangulate polygons → occluder triangles with normals ────────
    for (const p of polys) {
      const vs = p.vertices;
      if (vs.length < 3) continue;
      const n = p.plane.normal;
      const nArr: [number, number, number] = [n.x, n.y, n.z];
      for (let j = 1; j < vs.length - 1; j++) {
        this._tris.push({
          ax: vs[0].x, ay: vs[0].y, az: vs[0].z,
          bx: vs[j].x, by: vs[j].y, bz: vs[j].z,
          cx: vs[j + 1].x, cy: vs[j + 1].y, cz: vs[j + 1].z,
        });
        this._triNormals.push(nArr);
      }
    }

    // ── Build edge → polygon adjacency ───────────────────────────────────
    const QUANT = 1e5;
    const vKey = (v: Vec3) =>
      `${Math.round(v.x * QUANT)}:${Math.round(v.y * QUANT)}:${Math.round(v.z * QUANT)}`;

    interface EdgeInfo { a: Vec3; b: Vec3; pis: number[] }
    const edgeMap = new Map<string, EdgeInfo>();

    for (let pi = 0; pi < polys.length; pi++) {
      const vs = polys[pi].vertices;
      for (let i = 0; i < vs.length; i++) {
        const j = (i + 1) % vs.length;
        const ka = vKey(vs[i]), kb = vKey(vs[j]);
        const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        let entry = edgeMap.get(key);
        if (!entry) { entry = { a: vs[i], b: vs[j], pis: [] }; edgeMap.set(key, entry); }
        entry.pis.push(pi);
      }
    }

    // ── Classify edges ───────────────────────────────────────────────────
    for (const entry of edgeMap.values()) {
      const { a, b, pis } = entry;
      const ea: IEdge = { ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer };

      if (pis.length === 1) {
        // Boundary edge
        if (boundary) this._edges.push(ea);
      } else if (pis.length >= 2) {
        const n0 = polys[pis[0]].plane.normal;
        const n1 = polys[pis[1]].plane.normal;
        const dot = n0.x * n1.x + n0.y * n1.y + n0.z * n1.z;

        if (featAngle < 0 || dot < cosThresh) {
          // Feature edge (always visible regardless of view)
          this._edges.push(ea);
        } else {
          // Smooth internal edge — may be a silhouette from certain views
          this._silhouetteEdges.push({
            ...ea,
            n0x: n0.x, n0y: n0.y, n0z: n0.z,
            n1x: n1.x, n1y: n1.y, n1z: n1.z,
          });
        }
      }
    }

    return this;
  }

  /** Returns a serializable request object for Web Worker hidden-line computation. */
  toWorkerRequest(view: DxfView, options?: DxfWriteOptions): DxfWorkerRequest {
    const trisFlat: number[] = [];
    for (const t of this._tris) trisFlat.push(t.ax, t.ay, t.az, t.bx, t.by, t.bz, t.cx, t.cy, t.cz);
    // Flatten normals (3 floats per triangle, parallel to trisFlat groups of 9)
    const triNormalsFlat: number[] | undefined = this._triNormals
      ? this._triNormals.flatMap(n => n) : undefined;
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    // Resolve silhouette edges for this view
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    return {
      trisFlat,
      triNormalsFlat,
      edges: [...allEdges],
      layers: [...this._layers.values()],
      viewDir: [view.viewDir.x, view.viewDir.y, view.viewDir.z],
      upDir: [upDir.x, upDir.y, upDir.z],
      scale: options?.scale ?? 1000,
      precision: options?.precision ?? 3,
      depthBias: options?.depthBias,
    };
  }

  /** Return raw projected segments with layer classification (for live preview). */
  toSegments(view: DxfView, options?: DxfWriteOptions): DxfSegment[] {
    const bias = options?.depthBias; // undefined → auto-computed inside _hiddenLine/_hiddenLineDebug
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    if (options?.debugLayers) {
      return _hiddenLineDebug(this._tris, allEdges, view, this._triNormals, bias);
    }
    if (options?.hiddenLine !== false) {
      return _hiddenLine(this._tris, allEdges, view, undefined, this._triNormals, bias);
    }
    // Fast path — project only
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const b = _basis(view.viewDir, upDir);
    const segs: DxfSegment[] = [];
    for (const e of allEdges) {
      const u0 = e.ax * b.rx + e.ay * b.ry + e.az * b.rz;
      const v0 = e.ax * b.ux + e.ay * b.uy + e.az * b.uz;
      const u1 = e.bx * b.rx + e.by * b.ry + e.bz * b.rz;
      const v1 = e.bx * b.ux + e.by * b.uy + e.bz * b.uz;
      const du = u1 - u0, dv = v1 - v0;
      if (du * du + dv * dv < 1e-12) continue;
      segs.push({ u0, v0, u1, v1, layer: e.layer });
    }
    return segs;
  }

  /** Project edges and write DXF. Runs hidden-line removal unless hiddenLine=false. */
  toDxf(view: DxfView, options?: DxfWriteOptions): string {
    const scale = options?.scale ?? 1000;
    const prec  = options?.precision ?? 3;
    const doHL  = options?.hiddenLine !== false;
    const bias  = options?.depthBias ?? 0.01;

    if (options?.debugLayers) {
      // Debug mode: export all edges on classified layers
      const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
      const debugSegs = _hiddenLineDebug(this._tris, allEdges, view, this._triNormals, bias);
      const debugLayerDefs: DxfLayerDef[] = [
        ...this._layers.values(),
        { name: 'visible',   color: 3 }, // green
        { name: 'occluded',  color: 1 }, // red
        { name: 'feature',   color: 5 }, // blue
        { name: 'boundary',  color: 2 }, // yellow
        { name: 'silhouette', color: 4 }, // cyan
      ];
      return _writeDxf(debugSegs, debugLayerDefs, scale, prec);
    }

    if (doHL) {
      // Resolve silhouette edges for this view direction
      const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
      const segs = _hiddenLine(this._tris, allEdges, view, undefined, this._triNormals, bias);
      return _writeDxf(segs, [...this._layers.values()], scale, prec);
    }
    // Fast path: project all edges, no occlusion
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const b = _basis(view.viewDir, upDir);
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    const segs: ISeg[] = [];
    for (const e of allEdges) {
      const u0 = e.ax * b.rx + e.ay * b.ry + e.az * b.rz;
      const v0 = e.ax * b.ux + e.ay * b.uy + e.az * b.uz;
      const u1 = e.bx * b.rx + e.by * b.ry + e.bz * b.rz;
      const v1 = e.bx * b.ux + e.by * b.uy + e.bz * b.uz;
      const du = u1 - u0, dv = v1 - v0;
      if (du * du + dv * dv < 1e-12) continue;
      segs.push({ u0, v0, u1, v1, layer: e.layer });
    }
    return _writeDxf(segs, [...this._layers.values()], scale, prec);
  }

  /**
   * GPU-accelerated hidden-line removal using ID buffer rendering.
   * Returns projected segments — same output as toSegments() but uses the GPU
   * for visibility, which handles intersecting/overlapping meshes naturally.
   * Requires Three.js.
   */
  toSegmentsGpu(view: DxfView, options?: IdBufferOptions): DxfSegment[] {
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    // Flatten internal tris to positions + indices
    const nTri = this._tris.length;
    const positions = new Float32Array(nTri * 9);
    const indices = new Uint32Array(nTri * 3);
    for (let i = 0; i < nTri; i++) {
      const t = this._tris[i];
      const o = i * 9;
      positions[o] = t.ax; positions[o + 1] = t.ay; positions[o + 2] = t.az;
      positions[o + 3] = t.bx; positions[o + 4] = t.by; positions[o + 5] = t.bz;
      positions[o + 6] = t.cx; positions[o + 7] = t.cy; positions[o + 8] = t.cz;
      indices[i * 3] = i * 3; indices[i * 3 + 1] = i * 3 + 1; indices[i * 3 + 2] = i * 3 + 2;
    }
    return hiddenLineIdBuffer(positions, indices, allEdges, this._triNormals, view, options);
  }

  /**
   * GPU-accelerated hidden-line DXF export.
   * Same as toDxf() but uses GPU ID buffer for visibility testing.
   * Requires Three.js.
   */
  toDxfGpu(view: DxfView, options?: DxfWriteOptions & IdBufferOptions): string {
    const scale = options?.scale ?? 1000;
    const prec  = options?.precision ?? 3;
    const segs = this.toSegmentsGpu(view, {
      resolution: options?.resolution ?? 4096,
      debugLayers: options?.debugLayers,
      flipU: options?.flipU,
    });
    const layers: DxfLayerDef[] = [...this._layers.values()];
    if (options?.debugLayers) {
      layers.push(
        { name: 'visible',   color: 3 },
        { name: 'occluded',  color: 1 },
        { name: 'feature',   color: 5 },
        { name: 'boundary',  color: 2 },
        { name: 'silhouette', color: 4 },
      );
    }
    return _writeDxf(segs, layers, scale, prec);
  }

  /** Write DXF from pre-computed segments (e.g. merged from multiple sources). */
  toDxfFromSegments(segs: DxfSegment[], options?: { scale?: number; precision?: number }): string {
    return _writeDxf(segs, [...this._layers.values()], options?.scale ?? 1000, options?.precision ?? 3);
  }

  /** Return edge counts grouped by layer name. Useful for debugging edge classification. */
  debugEdgeCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const e of this._edges) counts[e.layer] = (counts[e.layer] ?? 0) + 1;
    return counts;
  }

  /** Clear all geometry (reuse the exporter for a different view). */
  clear(): this {
    this._tris = []; this._triNormals = null; this._edges = []; this._silhouetteEdges = [];
    return this;
  }
}

// ── Silhouette edge resolution ────────────────────────────────────────────────

/** Resolve view-dependent silhouette edges and merge with static edges. */
function _withSilhouettes(edges: IEdge[], silhouettes: ISilhouetteEdge[], viewDir: Vec3): IEdge[] {
  if (silhouettes.length === 0) return edges;
  const vx = viewDir.x, vy = viewDir.y, vz = viewDir.z;
  const result = [...edges];
  for (const s of silhouettes) {
    const d0 = s.n0x * vx + s.n0y * vy + s.n0z * vz;
    const d1 = s.n1x * vx + s.n1y * vy + s.n1z * vz;
    // Silhouette: one face front-facing (dot < 0) and the other back-facing (dot > 0)
    if ((d0 < 0) !== (d1 < 0)) {
      result.push(s);
    }
  }
  return result;
}

// ── Orthographic projection basis ─────────────────────────────────────────────

interface Basis { rx: number; ry: number; rz: number; ux: number; uy: number; uz: number; fx: number; fy: number; fz: number; }

function _basis(viewDir: Vec3, upDir: Vec3): Basis {
  let fx = viewDir.x, fy = viewDir.y, fz = viewDir.z;
  const fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;

  // right = upDir × front
  let rx = upDir.y * fz - upDir.z * fy;
  let ry = upDir.z * fx - upDir.x * fz;
  let rz = upDir.x * fy - upDir.y * fx;
  const rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rl; ry /= rl; rz /= rl;

  // up = front × right
  const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
  return { rx, ry, rz, ux, uy, uz, fx, fy, fz };
}

function _proj(x: number, y: number, z: number, b: Basis): PP {
  return {
    u: x * b.rx + y * b.ry + z * b.rz,
    v: x * b.ux + y * b.uy + z * b.uz,
    d: x * b.fx + y * b.fy + z * b.fz,
  };
}

// ── 2D helpers ────────────────────────────────────────────────────────────────

const _c2 = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;

/**
 * Cyrus-Beck clip of segment p0→p1 against CCW triangle (t0,t1,t2).
 * Returns [tEnter, tExit] of the segment inside the triangle, or null.
 */
function _clipTri(
  p0u: number, p0v: number, p1u: number, p1v: number,
  t0u: number, t0v: number, t1u: number, t1v: number, t2u: number, t2v: number,
): [number, number] | null {
  const du = p1u - p0u, dv = p1v - p0v;
  let tEn = 0, tEx = 1;
  // Three half-planes for CCW triangle edges
  const edges: [number, number, number, number][] = [
    [t0u, t0v, t1u, t1v],
    [t1u, t1v, t2u, t2v],
    [t2u, t2v, t0u, t0v],
  ];
  for (const [qu, qv, ru, rv] of edges) {
    const nx = -(rv - qv), ny = ru - qu; // inward normal (CCW edge)
    const num = nx * (qu - p0u) + ny * (qv - p0v);
    const den = nx * du + ny * dv;
    if (Math.abs(den) < 1e-12) {
      if (num < -1e-8) return null; // parallel & outside
      continue;
    }
    const t = num / den;
    if (den > 0) tEn = Math.max(tEn, t);
    else          tEx = Math.min(tEx, t);
    if (tEn > tEx + 1e-8) return null;
  }
  tEn = Math.max(0, tEn); tEx = Math.min(1, tEx);
  return tEn < tEx - 1e-6 ? [tEn, tEx] : null;
}

/** Subtract interval [a,b] from a sorted list of visible intervals. */
function _subInterval(vis: [number, number][], a: number, b: number): [number, number][] {
  const out: [number, number][] = [];
  for (const [lo, hi] of vis) {
    if (b <= lo + 1e-7 || a >= hi - 1e-7) { out.push([lo, hi]); continue; }
    if (a > lo + 1e-7) out.push([lo, a]);
    if (b < hi - 1e-7) out.push([b, hi]);
  }
  return out;
}

// ── Serializable worker types ─────────────────────────────────────────────────

export interface DxfWorkerRequest {
  /** Flat array: ax,ay,az,bx,by,bz,cx,cy,cz per triangle */
  trisFlat: number[];
  /** Flat array: nx,ny,nz per triangle (parallel to trisFlat). Optional. */
  triNormalsFlat?: number[];
  edges: IEdge[];
  layers: DxfLayerDef[];
  viewDir: [number, number, number];
  upDir: [number, number, number];
  scale: number;
  precision: number;
  depthBias?: number;
}

/** Run hidden-line DXF computation — intended to be called from a Web Worker. */
export function processWorkerRequest(
  req: DxfWorkerRequest,
  onProgress?: (p: number) => void,
): string {
  const tris = [];
  for (let i = 0; i < req.trisFlat.length; i += 9) {
    tris.push({
      ax: req.trisFlat[i],     ay: req.trisFlat[i + 1], az: req.trisFlat[i + 2],
      bx: req.trisFlat[i + 3], by: req.trisFlat[i + 4], bz: req.trisFlat[i + 5],
      cx: req.trisFlat[i + 6], cy: req.trisFlat[i + 7], cz: req.trisFlat[i + 8],
    });
  }
  let triNormals: [number, number, number][] | null = null;
  if (req.triNormalsFlat) {
    triNormals = [];
    for (let i = 0; i < req.triNormalsFlat.length; i += 3) {
      triNormals.push([req.triNormalsFlat[i], req.triNormalsFlat[i + 1], req.triNormalsFlat[i + 2]]);
    }
  }
  const view: DxfView = {
    viewDir: new Vec3(req.viewDir[0], req.viewDir[1], req.viewDir[2]),
    upDir:   new Vec3(req.upDir[0],   req.upDir[1],   req.upDir[2]),
  };
  const segs = _hiddenLine(tris, req.edges, view, onProgress, triNormals, req.depthBias);
  return _writeDxf(segs, req.layers, req.scale, req.precision);
}

// ── 2D AABB BVH for projected triangles ──────────────────────────────────────

const BVH_LEAF_MAX = 8; // max triangles per leaf before splitting

/** Flat BVH node. Children are contiguous: left = idx+1, right = idx+rightOff. */
interface BvhNode {
  minU: number; minV: number; maxU: number; maxV: number;
  /** 0 = leaf. >0 = offset to right child (left child is always idx+1). */
  rightOff: number;
  /** Leaf only: start index in triOrder. */
  start: number;
  /** Leaf only: number of triangles. */
  count: number;
}

interface Bvh2D { nodes: BvhNode[]; triOrder: number[]; }

function _buildBvh2D(stris: STri[]): Bvh2D {
  const n = stris.length;
  const triOrder = new Array<number>(n);
  for (let i = 0; i < n; i++) triOrder[i] = i;
  const nodes: BvhNode[] = [];

  function build(start: number, count: number): number {
    // Compute bounding box
    let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
    for (let i = start; i < start + count; i++) {
      const t = stris[triOrder[i]];
      if (t.minU < minU) minU = t.minU;
      if (t.maxU > maxU) maxU = t.maxU;
      if (t.minV < minV) minV = t.minV;
      if (t.maxV > maxV) maxV = t.maxV;
    }

    if (count <= BVH_LEAF_MAX) {
      const idx = nodes.length;
      nodes.push({ minU, minV, maxU, maxV, rightOff: 0, start, count });
      return idx;
    }

    // Split along longest axis at centroid median
    const splitU = (maxU - minU) >= (maxV - minV);
    const mid = start + (count >> 1);

    // Partial sort: nth_element equivalent — partition around median
    _nthElement(triOrder, start, start + count - 1, mid, stris, splitU);

    const idx = nodes.length;
    nodes.push({ minU, minV, maxU, maxV, rightOff: 0, start: 0, count: 0 });
    build(start, mid - start);                       // left child at idx+1
    const rightIdx = build(mid, start + count - mid); // right child
    nodes[idx].rightOff = rightIdx - idx;
    return idx;
  }

  if (n > 0) build(0, n);
  return { nodes, triOrder };
}

/** Centroid value for a projected triangle along the given axis. */
function _triCentroid(stris: STri[], idx: number, splitU: boolean): number {
  const t = stris[idx];
  return splitU ? (t.minU + t.maxU) : (t.minV + t.maxV);
}

/** In-place quickselect: partitions order[lo..hi] so that order[nth] is the nth-smallest centroid. */
function _nthElement(
  order: number[], lo: number, hi: number, nth: number,
  stris: STri[], splitU: boolean,
): void {
  while (lo < hi) {
    // Lomuto partition with median-of-three pivot
    const mid = (lo + hi) >> 1;
    // Sort lo, mid, hi by centroid and use mid as pivot
    if (_triCentroid(stris, order[lo], splitU) > _triCentroid(stris, order[mid], splitU)) {
      const tmp = order[lo]; order[lo] = order[mid]; order[mid] = tmp;
    }
    if (_triCentroid(stris, order[lo], splitU) > _triCentroid(stris, order[hi], splitU)) {
      const tmp = order[lo]; order[lo] = order[hi]; order[hi] = tmp;
    }
    if (_triCentroid(stris, order[mid], splitU) > _triCentroid(stris, order[hi], splitU)) {
      const tmp = order[mid]; order[mid] = order[hi]; order[hi] = tmp;
    }
    // Move pivot to hi-1
    { const tmp = order[mid]; order[mid] = order[hi - 1]; order[hi - 1] = tmp; }
    const pivotVal = _triCentroid(stris, order[hi - 1], splitU);

    // Hoare-style partition
    let i = lo, j = hi - 1;
    for (;;) {
      while (_triCentroid(stris, order[++i], splitU) < pivotVal) { /* skip */ }
      while (_triCentroid(stris, order[--j], splitU) > pivotVal) { /* skip */ }
      if (i >= j) break;
      { const tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
    }
    // Place pivot at its final position
    { const tmp = order[i]; order[i] = order[hi - 1]; order[hi - 1] = tmp; }

    if (i === nth) return;
    if (nth < i) hi = i - 1; else lo = i + 1;
  }
}

/** Query BVH for all triangles overlapping the given AABB. Results pushed to `out`. */
function _queryBvh(bvh: Bvh2D, qMinU: number, qMinV: number, qMaxU: number, qMaxV: number, out: number[]): void {
  const { nodes, triOrder } = bvh;
  if (nodes.length === 0) return;
  const stack: number[] = [0];
  while (stack.length > 0) {
    const ni = stack.pop()!;
    const nd = nodes[ni];
    // AABB overlap test
    if (qMaxU < nd.minU || qMinU > nd.maxU || qMaxV < nd.minV || qMinV > nd.maxV) continue;
    if (nd.rightOff === 0) {
      // Leaf — push triangle indices
      for (let i = nd.start, end = nd.start + nd.count; i < end; i++) {
        out.push(triOrder[i]);
      }
    } else {
      stack.push(ni + 1);           // left child
      stack.push(ni + nd.rightOff); // right child
    }
  }
}

// ── 3D BVH for ray casting ───────────────────────────────────────────────────

type Tri3D = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; cx: number; cy: number; cz: number };

interface Aabb3D { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number; }

interface Bvh3DNode extends Aabb3D {
  rightOff: number; // 0 = leaf
  start: number;    // leaf: start index in triOrder
  count: number;    // leaf: number of triangles
}

interface Bvh3D { nodes: Bvh3DNode[]; triOrder: number[]; }

function _buildBvh3D(tris: Tri3D[], indices: number[]): Bvh3D {
  const n = indices.length;
  const triOrder = indices.slice();
  const nodes: Bvh3DNode[] = [];

  // Precompute centroids
  const cx = new Float64Array(tris.length);
  const cy = new Float64Array(tris.length);
  const cz = new Float64Array(tris.length);
  for (let i = 0; i < tris.length; i++) {
    const t = tris[i];
    cx[i] = (t.ax + t.bx + t.cx) / 3;
    cy[i] = (t.ay + t.by + t.cy) / 3;
    cz[i] = (t.az + t.bz + t.cz) / 3;
  }

  function build(start: number, count: number): number {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = start; i < start + count; i++) {
      const t = tris[triOrder[i]];
      minX = Math.min(minX, t.ax, t.bx, t.cx);
      minY = Math.min(minY, t.ay, t.by, t.cy);
      minZ = Math.min(minZ, t.az, t.bz, t.cz);
      maxX = Math.max(maxX, t.ax, t.bx, t.cx);
      maxY = Math.max(maxY, t.ay, t.by, t.cy);
      maxZ = Math.max(maxZ, t.az, t.bz, t.cz);
    }
    if (count <= BVH_LEAF_MAX) {
      const idx = nodes.length;
      nodes.push({ minX, minY, minZ, maxX, maxY, maxZ, rightOff: 0, start, count });
      return idx;
    }
    // Split along longest axis at centroid median
    const sx = maxX - minX, sy = maxY - minY, sz = maxZ - minZ;
    const axis = sx >= sy && sx >= sz ? 0 : sy >= sz ? 1 : 2;
    const cArr = axis === 0 ? cx : axis === 1 ? cy : cz;
    const mid = start + (count >> 1);
    // Quickselect around median
    _nthElement3D(triOrder, start, start + count - 1, mid, cArr);
    const idx = nodes.length;
    nodes.push({ minX, minY, minZ, maxX, maxY, maxZ, rightOff: 0, start: 0, count: 0 });
    build(start, mid - start);
    const rightIdx = build(mid, start + count - mid);
    nodes[idx].rightOff = rightIdx - idx;
    return idx;
  }

  if (n > 0) build(0, n);
  return { nodes, triOrder };
}

function _nthElement3D(order: number[], lo: number, hi: number, nth: number, vals: Float64Array): void {
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (vals[order[lo]] > vals[order[mid]]) { const t = order[lo]; order[lo] = order[mid]; order[mid] = t; }
    if (vals[order[lo]] > vals[order[hi]]) { const t = order[lo]; order[lo] = order[hi]; order[hi] = t; }
    if (vals[order[mid]] > vals[order[hi]]) { const t = order[mid]; order[mid] = order[hi]; order[hi] = t; }
    { const t = order[mid]; order[mid] = order[hi - 1]; order[hi - 1] = t; }
    const pivotVal = vals[order[hi - 1]];
    let i = lo, j = hi - 1;
    for (;;) {
      while (vals[order[++i]] < pivotVal) { /* skip */ }
      while (vals[order[--j]] > pivotVal) { /* skip */ }
      if (i >= j) break;
      { const t = order[i]; order[i] = order[j]; order[j] = t; }
    }
    { const t = order[i]; order[i] = order[hi - 1]; order[hi - 1] = t; }
    if (i === nth) return;
    if (nth < i) hi = i - 1; else lo = i + 1;
  }
}

/**
 * Ray-AABB intersection (slab method). Returns true if ray hits the box.
 * Ray: origin + t * dir, t in [0, tMax].
 * invDir = 1/dir (precomputed), dirSign = dir < 0.
 */
function _rayAabb(
  ox: number, oy: number, oz: number,
  invDx: number, invDy: number, invDz: number,
  node: Bvh3DNode,
): boolean {
  let tmin = (((invDx >= 0 ? node.minX : node.maxX) - ox) * invDx);
  let tmax = (((invDx >= 0 ? node.maxX : node.minX) - ox) * invDx);
  const tymin = (((invDy >= 0 ? node.minY : node.maxY) - oy) * invDy);
  const tymax = (((invDy >= 0 ? node.maxY : node.minY) - oy) * invDy);
  if (tmin > tymax || tymin > tmax) return false;
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;
  const tzmin = (((invDz >= 0 ? node.minZ : node.maxZ) - oz) * invDz);
  const tzmax = (((invDz >= 0 ? node.maxZ : node.minZ) - oz) * invDz);
  if (tmin > tzmax || tzmin > tmax) return false;
  if (tzmin > tmin) tmin = tzmin;
  if (tzmax < tmax) tmax = tzmax;
  return tmax >= 0 && tmin <= tmax;
}

/**
 * Möller–Trumbore ray-triangle intersection.
 * Returns the distance t along the ray, or -1 if no intersection.
 */
function _rayTri(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  t: Tri3D,
): number {
  const e1x = t.bx - t.ax, e1y = t.by - t.ay, e1z = t.bz - t.az;
  const e2x = t.cx - t.ax, e2y = t.cy - t.ay, e2z = t.cz - t.az;
  const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x;
  const a = e1x * hx + e1y * hy + e1z * hz;
  if (a > -1e-10 && a < 1e-10) return -1; // parallel
  const f = 1 / a;
  const sx = ox - t.ax, sy = oy - t.ay, sz = oz - t.az;
  const u = f * (sx * hx + sy * hy + sz * hz);
  if (u < -1e-6 || u > 1 + 1e-6) return -1;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
  const v = f * (dx * qx + dy * qy + dz * qz);
  if (v < -1e-6 || u + v > 1 + 1e-6) return -1;
  const tt = f * (e2x * qx + e2y * qy + e2z * qz);
  return tt > 1e-6 ? tt : -1;
}

/**
 * Cast a ray from `origin` along `dir` and check if any triangle (not in skipSet) is hit.
 * Returns true if occluded (something is in front).
 * dir should point toward the camera (against viewDir), so hits at t > 0 are between
 * the point and the camera... Actually for orthographic:
 *   - We cast from the edge point TOWARD the camera (dir = -viewDir)
 *   - Any hit at t > 0 means a triangle is between the point and the camera → occluded
 *   - We only care about ANY hit, not the closest
 */
function _isOccluded3D(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  bvh: Bvh3D, allTris: Tri3D[],
  adjTris: number[] | undefined,
): boolean {
  const { nodes, triOrder } = bvh;
  if (nodes.length === 0) return false;
  const invDx = 1 / dx, invDy = 1 / dy, invDz = 1 / dz;
  const stack: number[] = [0];
  while (stack.length > 0) {
    const ni = stack.pop()!;
    const nd = nodes[ni];
    if (!_rayAabb(ox, oy, oz, invDx, invDy, invDz, nd)) continue;
    if (nd.rightOff === 0) {
      for (let i = nd.start, end = nd.start + nd.count; i < end; i++) {
        const ti = triOrder[i];
        if (adjTris && adjTris.indexOf(ti) >= 0) continue;
        const t = _rayTri(ox, oy, oz, dx, dy, dz, allTris[ti]);
        if (t > 0) return true;
      }
    } else {
      stack.push(ni + 1);
      stack.push(ni + nd.rightOff);
    }
  }
  return false;
}

// ── Hidden-line core ──────────────────────────────────────────────────────────

function _hiddenLine(
  tris: Tri3D[],
  edges: IEdge[],
  view: DxfView,
  onProgress?: (p: number) => void,
  triNormals?: [number, number, number][] | null,
  _depthBias?: number, // kept for API compat, no longer used
): ISeg[] {
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  const b     = _basis(view.viewDir, upDir);
  const hasNormals = triNormals != null && triNormals.length === tris.length;

  // Collect front-facing triangle indices for the 3D BVH (only these can occlude)
  const frontIdx: number[] = [];
  const stris: STri[] = [];
  for (let ti = 0; ti < tris.length; ti++) {
    if (hasNormals) {
      const n = triNormals![ti];
      if (n[0] * b.fx + n[1] * b.fy + n[2] * b.fz > 0) continue;
    }
    frontIdx.push(ti);
    const tri = tris[ti];
    const pa = _proj(tri.ax, tri.ay, tri.az, b);
    const pb = _proj(tri.bx, tri.by, tri.bz, b);
    const pc = _proj(tri.cx, tri.cy, tri.cz, b);
    const cross = _c2(pb.u - pa.u, pb.v - pa.v, pc.u - pa.u, pc.v - pa.v);
    if (Math.abs(cross) < 1e-10) continue;
    const p1 = cross > 0 ? pb : pc;
    const p2 = cross > 0 ? pc : pb;
    stris.push({
      p: [pa, p1, p2],
      avgD: (pa.d + pb.d + pc.d) / 3,
      minU: Math.min(pa.u, pb.u, pc.u), maxU: Math.max(pa.u, pb.u, pc.u),
      minV: Math.min(pa.v, pb.v, pc.v), maxV: Math.max(pa.v, pb.v, pc.v),
      srcIdx: ti,
    });
  }
  stris.sort((a, z) => a.avgD - z.avgD);
  const bvh2d = _buildBvh2D(stris);

  // Build 3D BVH over front-facing triangles for ray casting
  const bvh3d = _buildBvh3D(tris, frontIdx);
  // Ray direction: toward camera = -viewDir
  const rdx = -b.fx, rdy = -b.fy, rdz = -b.fz;

  const result: ISeg[] = [];
  const nEdges = edges.length;
  const candBuf: number[] = [];

  for (let ei = 0; ei < nEdges; ei++) {
    if (onProgress && (ei & 63) === 0) onProgress(ei / nEdges);
    const edge = edges[ei];
    const ea = _proj(edge.ax, edge.ay, edge.az, b);
    const eb = _proj(edge.bx, edge.by, edge.bz, b);

    // Face-orientation visibility
    const adjN = edge.adjNormals;
    const hasFrontFace = !adjN || adjN.length === 0 ||
      adjN.some(n => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    const allFrontFaces = adjN && adjN.length > 0 &&
      adjN.every(n => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);

    let vis: [number, number][];
    if (!hasFrontFace) {
      vis = [];
    } else if (allFrontFaces) {
      vis = [[0, 1]];
    } else {
      vis = [[0, 1]];
    }

    if (vis.length > 0 && !allFrontFaces) {
      const adj = edge.adjTris;
      const eMinU = Math.min(ea.u, eb.u), eMaxU = Math.max(ea.u, eb.u);
      const eMinV = Math.min(ea.v, eb.v), eMaxV = Math.max(ea.v, eb.v);

      // 2D: find which projected triangles overlap this edge
      candBuf.length = 0;
      _queryBvh(bvh2d, eMinU, eMinV, eMaxU, eMaxV, candBuf);

      for (let ci = 0; ci < candBuf.length; ci++) {
        if (!vis.length) break;
        const tri = stris[candBuf[ci]];
        // Skip adjacent triangles
        if (adj && adj.indexOf(tri.srcIdx) >= 0) continue;

        const [ta, tb, tc] = tri.p;
        const interval = _clipTri(
          ea.u, ea.v, eb.u, eb.v,
          ta.u, ta.v, tb.u, tb.v, tc.u, tc.v,
        );
        if (!interval) continue;

        // 3D ray cast at interval midpoint to confirm occlusion
        const tM = (interval[0] + interval[1]) * 0.5;
        const px = edge.ax + (edge.bx - edge.ax) * tM;
        const py = edge.ay + (edge.by - edge.ay) * tM;
        const pz = edge.az + (edge.bz - edge.az) * tM;
        // Cast ray toward camera — if any non-adjacent tri is hit, this interval is occluded
        if (!_isOccluded3D(px, py, pz, rdx, rdy, rdz, bvh3d, tris, adj)) continue;

        vis = _subInterval(vis, interval[0], interval[1]);
      }
    }

    for (const [t0, t1] of vis) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * t0, v0: ea.v + (eb.v - ea.v) * t0,
        u1: ea.u + (eb.u - ea.u) * t1, v1: ea.v + (eb.v - ea.v) * t1,
        layer: edge.layer,
      });
    }
  }

  return result;
}

// ── Debug hidden-line: exports visible + occluded + edge-kind layers ──────────

function _hiddenLineDebug(
  tris: Tri3D[],
  edges: IEdge[],
  view: DxfView,
  triNormals?: [number, number, number][] | null,
  _depthBias?: number,
): ISeg[] {
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  const b     = _basis(view.viewDir, upDir);
  const hasNormals = triNormals != null && triNormals.length === tris.length;

  const frontIdx: number[] = [];
  const stris: STri[] = [];
  for (let ti = 0; ti < tris.length; ti++) {
    if (hasNormals) {
      const n = triNormals![ti];
      if (n[0] * b.fx + n[1] * b.fy + n[2] * b.fz > 0) continue;
    }
    frontIdx.push(ti);
    const tri = tris[ti];
    const pa = _proj(tri.ax, tri.ay, tri.az, b);
    const pb = _proj(tri.bx, tri.by, tri.bz, b);
    const pc = _proj(tri.cx, tri.cy, tri.cz, b);
    const cross = _c2(pb.u - pa.u, pb.v - pa.v, pc.u - pa.u, pc.v - pa.v);
    if (Math.abs(cross) < 1e-10) continue;
    const p1 = cross > 0 ? pb : pc;
    const p2 = cross > 0 ? pc : pb;
    stris.push({
      p: [pa, p1, p2],
      avgD: (pa.d + pb.d + pc.d) / 3,
      minU: Math.min(pa.u, pb.u, pc.u), maxU: Math.max(pa.u, pb.u, pc.u),
      minV: Math.min(pa.v, pb.v, pc.v), maxV: Math.max(pa.v, pb.v, pc.v),
      srcIdx: ti,
    });
  }
  stris.sort((a, z) => a.avgD - z.avgD);
  const bvh2d = _buildBvh2D(stris);
  const bvh3d = _buildBvh3D(tris, frontIdx);
  const rdx = -b.fx, rdy = -b.fy, rdz = -b.fz;

  const result: ISeg[] = [];
  const candBuf: number[] = [];

  for (const edge of edges) {
    const ea = _proj(edge.ax, edge.ay, edge.az, b);
    const eb = _proj(edge.bx, edge.by, edge.bz, b);

    // 1) Emit on edge-kind layer
    const kindLayer = edge.kind ?? 'feature';
    result.push({
      u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: kindLayer,
    });

    // 2) Face-orientation visibility
    const adjN = edge.adjNormals;
    const hasFrontFace = !adjN || adjN.length === 0 ||
      adjN.some(n => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    const allFrontFaces = adjN && adjN.length > 0 &&
      adjN.every(n => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);

    let vis: [number, number][];
    if (!hasFrontFace) {
      vis = [];
    } else if (allFrontFaces) {
      vis = [[0, 1]];
    } else {
      vis = [[0, 1]];
    }

    if (vis.length > 0 && !allFrontFaces) {
      const adj = edge.adjTris;

      candBuf.length = 0;
      _queryBvh(bvh2d, Math.min(ea.u, eb.u), Math.min(ea.v, eb.v),
                        Math.max(ea.u, eb.u), Math.max(ea.v, eb.v), candBuf);

      for (let ci = 0; ci < candBuf.length; ci++) {
        if (!vis.length) break;
        const tri = stris[candBuf[ci]];
        if (adj && adj.indexOf(tri.srcIdx) >= 0) continue;

        const [ta, tb, tc] = tri.p;
        const interval = _clipTri(ea.u, ea.v, eb.u, eb.v, ta.u, ta.v, tb.u, tb.v, tc.u, tc.v);
        if (!interval) continue;

        // 3D ray cast at interval midpoint
        const tM = (interval[0] + interval[1]) * 0.5;
        const px = edge.ax + (edge.bx - edge.ax) * tM;
        const py = edge.ay + (edge.by - edge.ay) * tM;
        const pz = edge.az + (edge.bz - edge.az) * tM;
        if (!_isOccluded3D(px, py, pz, rdx, rdy, rdz, bvh3d, tris, adj)) continue;

        vis = _subInterval(vis, interval[0], interval[1]);
      }
    }

    // Visible portions
    for (const [t0, t1] of vis) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * t0, v0: ea.v + (eb.v - ea.v) * t0,
        u1: ea.u + (eb.u - ea.u) * t1, v1: ea.v + (eb.v - ea.v) * t1,
        layer: 'visible',
      });
    }

    // Occluded portions
    let prev = 0;
    for (const [t0, t1] of vis) {
      if (t0 > prev + 1e-7) {
        result.push({
          u0: ea.u + (eb.u - ea.u) * prev, v0: ea.v + (eb.v - ea.v) * prev,
          u1: ea.u + (eb.u - ea.u) * t0,   v1: ea.v + (eb.v - ea.v) * t0,
          layer: 'occluded',
        });
      }
      prev = t1;
    }
    if (prev < 1 - 1e-7) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * prev, v0: ea.v + (eb.v - ea.v) * prev,
        u1: eb.u, v1: eb.v,
        layer: 'occluded',
      });
    }
  }

  return result;
}

// ── DXF R12 (AC1009) writer ────────────────────────────────────────────────────
// Matches the minimal structure used by Processing's RawDXF — just a HEADER for
// bounding box (needed by Illustrator) + plain ENTITIES section. No TABLES/BLOCKS.

function _writeDxf(segs: ISeg[], layers: DxfLayerDef[], scale: number, prec: number): string {
  const f = (n: number) => (n * scale).toFixed(prec);
  const lines: string[] = [];

  // ── TABLES section for layer definitions (colors) ──
  if (layers.length > 0) {
    lines.push('0', 'SECTION', '2', 'TABLES');
    lines.push('0', 'TABLE', '2', 'LAYER', '70', String(layers.length));
    for (const l of layers) {
      lines.push('0', 'LAYER', '2', l.name, '70', '0', '62', String(l.color ?? 7), '6', l.lineType ?? 'CONTINUOUS');
    }
    lines.push('0', 'ENDTAB');
    lines.push('0', 'ENDSEC');
  }

  // ── ENTITIES ──
  lines.push('0', 'SECTION', '2', 'ENTITIES');
  for (const s of segs) {
    lines.push(
      '0', 'LINE',
      '8', s.layer,
      '10', f(s.u0), '20', f(s.v0), '30', '0.0',
      '11', f(s.u1), '21', f(s.v1), '31', '0.0',
    );
  }
  lines.push('0', 'ENDSEC', '0', 'EOF');

  return lines.join('\r\n') + '\r\n';
}
