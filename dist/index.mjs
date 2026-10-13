import {
  ControlPanel,
  Sketch2DInstance,
  describeSceneObject,
  getTheme,
  installAgentBridge,
  plainBundle,
  saveBundle,
  sceneSummary,
  sketch2d,
  slug
} from "./chunk-3WSXZOOI.mjs";
import {
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
  Delaunay2D,
  DistanceTransform,
  ExtrudedRibbon,
  FloodFill,
  Graph,
  GridGraph,
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
  MeshAnalysis,
  MeshCleanup,
  MeshFactory,
  MeshSubdivide,
  MeshTransform,
  NoFitPolygon,
  NurbsCurve,
  NurbsSurface,
  ObjFile,
  OpeningType,
  PGFace,
  PGHalfEdge,
  PGVertex,
  PixelView,
  PlanarGraph,
  PlanarGraphCleanup,
  PlanarGraphRepair,
  PolylineCurve,
  Ray,
  RibbonEndTrim,
  RibbonFrame,
  RibbonJoint,
  RibbonOpening,
  RibbonSystem,
  RigidBody2D,
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
  SdfLine,
  SdfMicrostructure,
  SdfMirror,
  SdfOffset,
  SdfOnion,
  SdfOps,
  SdfPlane,
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
  SharedStore,
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
  VoxelGrid,
  VoxelGrid2D,
  Wall,
  WallJoint,
  WallOpening,
  WallSystem,
  WallType,
  boundingWalls,
  boxOf,
  buildCutList,
  chooseJoistDirection,
  clampedUniformKnots,
  cltLayers,
  collabColor,
  contactBetween,
  devServerAdapter,
  edgeOutwardVisibility,
  findAdjacent,
  holzrahmenbauLayers,
  joistDirectionFromBounds,
  joistDirectionFromPCA,
  joistDirectionFromSupports,
  lineClipPolygon,
  memoryAdapter,
  neighboursOf,
  perpVisibility,
  perpVisibilityOfPolys,
  polygonFromVertices,
  realize,
  realizeSlab,
  repelBodies,
  reverse,
  supabaseAdapter
} from "./chunk-GR7OHNEI.mjs";
import {
  OBB2D,
  ParamStore,
  Polygon2D,
  PolygonBool,
  _resolveLayers,
  _sanLayer,
  _writeR12Prologue,
  createLayout,
  createParams,
  createRandom,
  download,
  noise,
  polygonIntersection,
  setClipSnap,
  stampName,
  writeDxf2D,
  writeDxf3D
} from "./chunk-TZW7QNPY.mjs";
import {
  Mesh,
  Plane,
  Scene,
  Triangle
} from "./chunk-7UDZ2EE6.mjs";
import {
  AABB,
  HMath,
  Mat4,
  MathUtils,
  Segment,
  Vec2,
  Vec3,
  Vec4,
  VecMath,
  closestPointOnSegment,
  segmentSegmentClosest
} from "./chunk-VTSIDLJ7.mjs";

// src/io/IdBufferHiddenLine.ts
import * as THREE from "three";
var ID_VERTEX_SHADER = (
  /* glsl */
  `
  attribute float objectId;
  varying float vId;
  void main() {
    vId = objectId;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
);
var ID_FRAGMENT_SHADER = (
  /* glsl */
  `
  precision highp float;
  varying float vId;
  void main() {
    int id = int(vId + 0.5);
    float r = float(id - (id / 256) * 256) / 255.0;
    int id2 = id / 256;
    float g = float(id2 - (id2 / 256) * 256) / 255.0;
    int id3 = id2 / 256;
    float b = float(id3 - (id3 / 256) * 256) / 255.0;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`
);
function hiddenLineIdBuffer(positions, indices, edges, _triNormals, view, options) {
  const resolution = options?.resolution ?? 2048;
  const debugLayers = options?.debugLayers ?? false;
  const preserveSet = new Set(options?.preserveLayers ?? []);
  const occludedLayer = options?.occludedLayer;
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  let fx = view.viewDir.x, fy = view.viewDir.y, fz = view.viewDir.z;
  const fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let rx = upDir.y * fz - upDir.z * fy;
  let ry = upDir.z * fx - upDir.x * fz;
  let rz = upDir.x * fy - upDir.y * fx;
  const rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
  function proj(x, y, z) {
    return {
      u: x * rx + y * ry + z * rz,
      v: x * ux + y * uy + z * uz,
      d: x * fx + y * fy + z * fz
    };
  }
  const nVerts = positions.length / 3;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  let minD = Infinity, maxD = -Infinity;
  for (let i = 0; i < nVerts; i++) {
    const p = proj(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    if (p.u < minU) minU = p.u;
    if (p.u > maxU) maxU = p.u;
    if (p.v < minV) minV = p.v;
    if (p.v > maxV) maxV = p.v;
    if (p.d < minD) minD = p.d;
    if (p.d > maxD) maxD = p.d;
  }
  const margin = Math.max(maxU - minU, maxV - minV) * 0.02;
  minU -= margin;
  maxU += margin;
  minV -= margin;
  maxV += margin;
  const depthRange = maxD - minD || 1;
  minD -= depthRange * 0.1;
  maxD += depthRange * 0.1;
  const nTri = indices.length / 3;
  const scene = new THREE.Scene();
  const camZ = -minD + 1;
  const farZ = -minD - -maxD + 2;
  const camera = new THREE.OrthographicCamera(minU, maxU, maxV, minV, 0.5, farZ);
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, camZ - 1);
  const triPositions = new Float32Array(nTri * 9);
  const objectIds = new Float32Array(nTri * 3);
  for (let ti = 0; ti < nTri; ti++) {
    const origId = ti + 1;
    for (let vi = 0; vi < 3; vi++) {
      const srcVtx = indices[ti * 3 + vi];
      const p = proj(positions[srcVtx * 3], positions[srcVtx * 3 + 1], positions[srcVtx * 3 + 2]);
      triPositions[ti * 9 + vi * 3] = p.u;
      triPositions[ti * 9 + vi * 3 + 1] = p.v;
      triPositions[ti * 9 + vi * 3 + 2] = -p.d;
      objectIds[ti * 3 + vi] = origId;
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(triPositions, 3));
  geom.setAttribute("objectId", new THREE.BufferAttribute(objectIds, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: ID_VERTEX_SHADER,
    fragmentShader: ID_FRAGMENT_SHADER,
    side: THREE.DoubleSide,
    // let GPU depth test decide, we already culled back-faces
    depthTest: true,
    depthWrite: true
  });
  scene.add(new THREE.Mesh(geom, material));
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(resolution, resolution);
  renderer.setClearColor(new THREE.Color(0, 0, 0), 0);
  const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType
  });
  renderer.setRenderTarget(renderTarget);
  renderer.clear();
  renderer.render(scene, camera);
  const pixels = new Uint8Array(resolution * resolution * 4);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, resolution, resolution, pixels);
  renderer.setRenderTarget(null);
  renderTarget.dispose();
  geom.dispose();
  material.dispose();
  try {
    renderer.forceContextLoss();
  } catch {
  }
  renderer.dispose();
  function readId(px, py) {
    if (px < 0 || px >= resolution || py < 0 || py >= resolution) return 0;
    const idx = (py * resolution + px) * 4;
    const a = pixels[idx + 3];
    if (a === 0) return 0;
    return pixels[idx] + (pixels[idx + 1] << 8) + (pixels[idx + 2] << 16);
  }
  function toPixel(u, v) {
    const px = (u - minU) / (maxU - minU) * resolution;
    const py = (v - minV) / (maxV - minV) * resolution;
    return [px, py];
  }
  const result = [];
  for (const edge of edges) {
    let isVisibleAt2 = function(px, py) {
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const id = readId(px + ox, py + oy);
          if (id === 0) return true;
          if (adjSet != null && adjSet.has(id - 1)) return true;
        }
      }
      return false;
    }, _emitRun2 = function(visible, t0, t1) {
      if (t1 - t0 < 1e-7) return;
      const u0 = ea.u + (eb.u - ea.u) * t0;
      const v0 = ea.v + (eb.v - ea.v) * t0;
      const u1 = ea.u + (eb.u - ea.u) * t1;
      const v1 = ea.v + (eb.v - ea.v) * t1;
      if (preserveSet.has(edge.layer)) {
        if (visible) result.push({ u0, v0, u1, v1, layer: edge.layer });
      } else if (visible) {
        const lyr = debugLayers ? isSilhouette ? "silhouette" : "visible" : edge.layer;
        result.push({ u0, v0, u1, v1, layer: lyr });
      } else if (debugLayers || occludedLayer) {
        result.push({ u0, v0, u1, v1, layer: debugLayers ? "occluded" : occludedLayer });
      }
    };
    var isVisibleAt = isVisibleAt2, _emitRun = _emitRun2;
    const ea = proj(edge.ax, edge.ay, edge.az);
    const eb = proj(edge.bx, edge.by, edge.bz);
    const adjN = edge.adjNormals;
    let isSilhouette = false;
    if (adjN && adjN.length > 1) {
      const hasFrontFace = adjN.some((n) => n[0] * fx + n[1] * fy + n[2] * fz <= 0.087);
      const hasBackFace = adjN.some((n) => n[0] * fx + n[1] * fy + n[2] * fz > 0.087);
      if (!hasFrontFace) {
        if (debugLayers) {
          result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: "occluded" });
        } else if (occludedLayer) {
          result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: occludedLayer });
        }
        continue;
      }
      isSilhouette = hasFrontFace && hasBackFace;
    }
    const [px0, py0] = toPixel(ea.u, ea.v);
    const [px1, py1] = toPixel(eb.u, eb.v);
    const dx = px1 - px0, dy = py1 - py0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps < 1) {
      const id = readId(Math.round(px0), Math.round(py0));
      const adj2 = edge.adjTris;
      const isVis = id === 0 || adj2 != null && adj2.indexOf(id - 1) >= 0;
      if (preserveSet.has(edge.layer)) {
        if (isVis) result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: edge.layer });
      } else if (isVis) {
        const lyr = debugLayers ? isSilhouette ? "silhouette" : "visible" : edge.layer;
        result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: lyr });
      } else if (debugLayers || occludedLayer) {
        result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: debugLayers ? "occluded" : occludedLayer });
      }
      continue;
    }
    const adj = edge.adjTris;
    const adjSet = adj ? new Set(adj) : null;
    const nSamples = Math.ceil(steps);
    let prevVis = false;
    let runStart = 0;
    let firstSample = true;
    for (let s = 0; s <= nSamples; s++) {
      const t = Math.min(s / nSamples, 1);
      const px = Math.round(px0 + dx * t);
      const py = Math.round(py0 + dy * t);
      const isVis = isVisibleAt2(px, py);
      if (firstSample) {
        prevVis = isVis;
        runStart = t;
        firstSample = false;
        continue;
      }
      if (isVis !== prevVis) {
        const tEnd = t;
        _emitRun2(prevVis, runStart, tEnd);
        runStart = tEnd;
        prevVis = isVis;
      }
    }
    _emitRun2(prevVis, runStart, 1);
  }
  if (options?.flipU) {
    for (const s of result) {
      s.u0 = -s.u0;
      s.u1 = -s.u1;
    }
  }
  return result;
}

// src/io/DxfExporter.ts
var DxfExporter = class {
  constructor() {
    this._tris = [];
    /** Per-triangle face normal (parallel to _tris). null = normals unavailable. */
    this._triNormals = null;
    this._edges = [];
    /** Edges whose visibility depends on view direction (silhouette candidates). */
    this._silhouetteEdges = [];
    this._layers = /* @__PURE__ */ new Map();
  }
  /** Define a layer with color and line type. */
  layer(def) {
    this._layers.set(def.name, def);
    return this;
  }
  /**
   * Add a triangulated mesh. Extracts triangles for occlusion and
   * feature / boundary edges for drawing.
   */
  addMesh(positions, indices, options) {
    const layer = options?.layer ?? "0";
    const featAngle = options?.featureAngle ?? 30;
    const boundary = options?.boundary ?? true;
    const softEdgeLayer = options?.softEdgeLayer;
    const silhouettes = options?.silhouettes ?? false;
    const cosThresh = Math.cos(featAngle * Math.PI / 180);
    const nTri = indices.length / 3;
    const triBase = this._tris.length;
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      this._tris.push({
        ax: positions[i0],
        ay: positions[i0 + 1],
        az: positions[i0 + 2],
        bx: positions[i1],
        by: positions[i1 + 1],
        bz: positions[i1 + 2],
        cx: positions[i2],
        cy: positions[i2 + 1],
        cz: positions[i2 + 2]
      });
    }
    const QUANT = 1e6;
    const posKey = (vi) => {
      const o = vi * 3;
      return `${Math.round(positions[o] * QUANT)}:${Math.round(positions[o + 1] * QUANT)}:${Math.round(positions[o + 2] * QUANT)}`;
    };
    const weldMap = /* @__PURE__ */ new Map();
    const weld = (vi) => {
      const k = posKey(vi);
      const existing = weldMap.get(k);
      if (existing !== void 0) return existing;
      weldMap.set(k, vi);
      return vi;
    };
    const vtxTris = /* @__PURE__ */ new Map();
    const edgeMap = /* @__PURE__ */ new Map();
    const eKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
    for (let i = 0; i < nTri; i++) {
      const a = weld(indices[i * 3]), b = weld(indices[i * 3 + 1]), c = weld(indices[i * 3 + 2]);
      for (const v of [a, b, c]) {
        const arr = vtxTris.get(v);
        if (arr) arr.push(i);
        else vtxTris.set(v, [i]);
      }
      for (const [p, q] of [[a, b], [b, c], [c, a]]) {
        const k = eKey(p, q);
        const arr = edgeMap.get(k) ?? [];
        arr.push(i);
        edgeMap.set(k, arr);
      }
    }
    if (!this._triNormals) this._triNormals = new Array(this._tris.length - nTri).fill([0, 0, 0]);
    const fn = [];
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      const ux = positions[i1] - positions[i0], uy = positions[i1 + 1] - positions[i0 + 1], uz = positions[i1 + 2] - positions[i0 + 2];
      const vx = positions[i2] - positions[i0], vy = positions[i2 + 1] - positions[i0 + 1], vz = positions[i2 + 2] - positions[i0 + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const n = [nx / l, ny / l, nz / l];
      fn.push(n);
      this._triNormals.push(n);
    }
    for (const [key, tris] of edgeMap) {
      const [as, bs] = key.split(":");
      const aVtx = +as, bVtx = +bs;
      const ai = aVtx * 3, bi = bVtx * 3;
      let include = false;
      let kind;
      let edgeLayer = layer;
      let asSilhouette = false;
      const uniqueNormals = [];
      for (const t of tris) {
        const n = fn[t];
        const isDup = uniqueNormals.some((u) => {
          const nu = fn[u];
          return n[0] * nu[0] + n[1] * nu[1] + n[2] * nu[2] > 0.999;
        });
        if (!isDup) uniqueNormals.push(t);
      }
      if (tris.length === 1) {
        if (boundary) {
          include = true;
          kind = "boundary";
        }
      } else if (uniqueNormals.length === 1) {
        if (!silhouettes && softEdgeLayer) {
          include = true;
          kind = "feature";
          edgeLayer = softEdgeLayer;
        }
      } else if (featAngle < 0) {
        include = true;
        kind = "feature";
      } else {
        let minDot = 1;
        for (let i = 0; i < uniqueNormals.length; i++) {
          for (let j = i + 1; j < uniqueNormals.length; j++) {
            const ni = fn[uniqueNormals[i]], nj = fn[uniqueNormals[j]];
            const d = ni[0] * nj[0] + ni[1] * nj[1] + ni[2] * nj[2];
            if (d < minDot) minDot = d;
          }
        }
        if (minDot < cosThresh) {
          include = true;
          kind = "feature";
        } else if (silhouettes) {
          include = true;
          kind = "silhouette";
          asSilhouette = true;
        } else if (softEdgeLayer) {
          include = true;
          kind = "feature";
          edgeLayer = softEdgeLayer;
        }
      }
      if (include) {
        const ring1 = /* @__PURE__ */ new Set();
        const aTris = vtxTris.get(aVtx);
        if (aTris) for (const t of aTris) ring1.add(t);
        const bTris = vtxTris.get(bVtx);
        if (bTris) for (const t of bTris) ring1.add(t);
        const ring2 = /* @__PURE__ */ new Set();
        ring1.forEach((t) => ring2.add(t));
        ring1.forEach((t) => {
          const va = weld(indices[t * 3]), vb = weld(indices[t * 3 + 1]), vc = weld(indices[t * 3 + 2]);
          for (const v of [va, vb, vc]) {
            const vt = vtxTris.get(v);
            if (vt) for (const tt of vt) ring2.add(tt);
          }
        });
        const adjArr = [];
        ring2.forEach((t) => adjArr.push(triBase + t));
        const edge = {
          ax: positions[ai],
          ay: positions[ai + 1],
          az: positions[ai + 2],
          bx: positions[bi],
          by: positions[bi + 1],
          bz: positions[bi + 2],
          layer: edgeLayer,
          kind,
          adjTris: adjArr,
          adjNormals: uniqueNormals.map((t) => fn[t]),
          meshTriRange: [triBase, triBase + nTri]
        };
        if (asSilhouette) {
          const n0 = fn[uniqueNormals[0]], n1 = fn[uniqueNormals[1]];
          this._silhouetteEdges.push({ ...edge, n0x: n0[0], n0y: n0[1], n0z: n0[2], n1x: n1[0], n1y: n1[1], n1z: n1[2] });
        } else {
          this._edges.push(edge);
        }
      }
    }
    return this;
  }
  /** Add triangles for occlusion only — edges NOT drawn. */
  addOccluder(positions, indices) {
    const nTri = indices.length / 3;
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      this._tris.push({
        ax: positions[i0],
        ay: positions[i0 + 1],
        az: positions[i0 + 2],
        bx: positions[i1],
        by: positions[i1 + 1],
        bz: positions[i1 + 2],
        cx: positions[i2],
        cy: positions[i2 + 1],
        cz: positions[i2 + 2]
      });
    }
    return this;
  }
  /** Add a polyline as a sequence of edges. */
  addPolyline(pts, options) {
    const layer = options?.layer ?? "0";
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      this._edges.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer });
    }
    return this;
  }
  /** Add a single edge. */
  addEdge(a, b, options) {
    this._edges.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer: options?.layer ?? "0" });
    return this;
  }
  /**
   * Add geometry from a BSP tree. Extracts occluder triangles, feature/boundary
   * edges, and silhouette edge candidates (view-dependent, resolved at export).
   *
   * BSP polygons have reliable normals, enabling back-face culling and silhouette
   * detection in the hidden-line pass.
   */
  addBspTree(bsp, options) {
    const layer = options?.layer ?? "0";
    const featAngle = options?.featureAngle ?? 30;
    const boundary = options?.boundary ?? true;
    const cosThresh = Math.cos(featAngle * Math.PI / 180);
    const polys = bsp.toPolygons();
    if (!this._triNormals) this._triNormals = new Array(this._tris.length).fill([0, 0, 0]);
    for (const p of polys) {
      const vs = p.vertices;
      if (vs.length < 3) continue;
      const n = p.plane.normal;
      const nArr = [n.x, n.y, n.z];
      for (let j = 1; j < vs.length - 1; j++) {
        this._tris.push({
          ax: vs[0].x,
          ay: vs[0].y,
          az: vs[0].z,
          bx: vs[j].x,
          by: vs[j].y,
          bz: vs[j].z,
          cx: vs[j + 1].x,
          cy: vs[j + 1].y,
          cz: vs[j + 1].z
        });
        this._triNormals.push(nArr);
      }
    }
    const QUANT = 1e5;
    const vKey = (v) => `${Math.round(v.x * QUANT)}:${Math.round(v.y * QUANT)}:${Math.round(v.z * QUANT)}`;
    const edgeMap = /* @__PURE__ */ new Map();
    for (let pi = 0; pi < polys.length; pi++) {
      const vs = polys[pi].vertices;
      for (let i = 0; i < vs.length; i++) {
        const j = (i + 1) % vs.length;
        const ka = vKey(vs[i]), kb = vKey(vs[j]);
        const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        let entry = edgeMap.get(key);
        if (!entry) {
          entry = { a: vs[i], b: vs[j], pis: [] };
          edgeMap.set(key, entry);
        }
        entry.pis.push(pi);
      }
    }
    for (const entry of edgeMap.values()) {
      const { a, b, pis } = entry;
      const ea = { ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer };
      if (pis.length === 1) {
        if (boundary) this._edges.push(ea);
      } else if (pis.length >= 2) {
        const n0 = polys[pis[0]].plane.normal;
        const n1 = polys[pis[1]].plane.normal;
        const dot = n0.x * n1.x + n0.y * n1.y + n0.z * n1.z;
        if (featAngle < 0 || dot < cosThresh) {
          this._edges.push(ea);
        } else {
          this._silhouetteEdges.push({
            ...ea,
            n0x: n0.x,
            n0y: n0.y,
            n0z: n0.z,
            n1x: n1.x,
            n1y: n1.y,
            n1z: n1.z
          });
        }
      }
    }
    return this;
  }
  /** Returns a serializable request object for Web Worker hidden-line computation. */
  toWorkerRequest(view, options) {
    const trisFlat = [];
    for (const t of this._tris) trisFlat.push(t.ax, t.ay, t.az, t.bx, t.by, t.bz, t.cx, t.cy, t.cz);
    const triNormalsFlat = this._triNormals ? this._triNormals.flatMap((n) => n) : void 0;
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    return {
      trisFlat,
      triNormalsFlat,
      edges: [...allEdges],
      layers: [...this._layers.values()],
      viewDir: [view.viewDir.x, view.viewDir.y, view.viewDir.z],
      upDir: [upDir.x, upDir.y, upDir.z],
      scale: options?.scale ?? 1e3,
      precision: options?.precision ?? _defaultPrecision(options?.scale ?? 1e3),
      depthBias: options?.depthBias
    };
  }
  /** Return raw projected segments with layer classification (for live preview). */
  toSegments(view, options) {
    const bias = options?.depthBias;
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    if (options?.debugLayers) {
      return _hiddenLineDebug(this._tris, allEdges, view, this._triNormals, bias);
    }
    if (options?.hiddenLine !== false) {
      return _hiddenLine(this._tris, allEdges, view, void 0, this._triNormals, bias);
    }
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const b = _basis(view.viewDir, upDir);
    const segs = [];
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
  toDxf(view, options) {
    const scale = options?.scale ?? 1e3;
    const prec = options?.precision ?? _defaultPrecision(scale);
    const doHL = options?.hiddenLine !== false;
    const bias = options?.depthBias ?? 0.01;
    if (options?.debugLayers) {
      const allEdges2 = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
      const debugSegs = _hiddenLineDebug(this._tris, allEdges2, view, this._triNormals, bias);
      const debugLayerDefs = [
        ...this._layers.values(),
        { name: "visible", color: 3 },
        // green
        { name: "occluded", color: 1 },
        // red
        { name: "feature", color: 5 },
        // blue
        { name: "boundary", color: 2 },
        // yellow
        { name: "silhouette", color: 4 }
        // cyan
      ];
      return _writeDxf(debugSegs, debugLayerDefs, scale, prec);
    }
    if (doHL) {
      const allEdges2 = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
      const segs2 = _hiddenLine(this._tris, allEdges2, view, void 0, this._triNormals, bias);
      return _writeDxf(segs2, [...this._layers.values()], scale, prec);
    }
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const b = _basis(view.viewDir, upDir);
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    const segs = [];
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
  toSegmentsGpu(view, options) {
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    const nTri = this._tris.length;
    const positions = new Float32Array(nTri * 9);
    const indices = new Uint32Array(nTri * 3);
    for (let i = 0; i < nTri; i++) {
      const t = this._tris[i];
      const o = i * 9;
      positions[o] = t.ax;
      positions[o + 1] = t.ay;
      positions[o + 2] = t.az;
      positions[o + 3] = t.bx;
      positions[o + 4] = t.by;
      positions[o + 5] = t.bz;
      positions[o + 6] = t.cx;
      positions[o + 7] = t.cy;
      positions[o + 8] = t.cz;
      indices[i * 3] = i * 3;
      indices[i * 3 + 1] = i * 3 + 1;
      indices[i * 3 + 2] = i * 3 + 2;
    }
    return hiddenLineIdBuffer(positions, indices, allEdges, this._triNormals, view, options);
  }
  /**
   * GPU-accelerated hidden-line DXF export.
   * Same as toDxf() but uses GPU ID buffer for visibility testing.
   * Requires Three.js.
   */
  toDxfGpu(view, options) {
    const scale = options?.scale ?? 1e3;
    const prec = options?.precision ?? _defaultPrecision(scale);
    const segs = this.toSegmentsGpu(view, {
      resolution: options?.resolution ?? 4096,
      debugLayers: options?.debugLayers,
      flipU: options?.flipU
    });
    const layers = [...this._layers.values()];
    if (options?.debugLayers) {
      layers.push(
        { name: "visible", color: 3 },
        { name: "occluded", color: 1 },
        { name: "feature", color: 5 },
        { name: "boundary", color: 2 },
        { name: "silhouette", color: 4 }
      );
    }
    return _writeDxf(segs, layers, scale, prec);
  }
  /** Write DXF from pre-computed segments (e.g. merged from multiple sources). */
  toDxfFromSegments(segs, options) {
    return _writeDxf(segs, [...this._layers.values()], options?.scale ?? 1e3, options?.precision ?? _defaultPrecision(options?.scale ?? 1e3));
  }
  /** Return edge counts grouped by layer name. Useful for debugging edge classification. */
  debugEdgeCounts() {
    const counts = {};
    for (const e of this._edges) counts[e.layer] = (counts[e.layer] ?? 0) + 1;
    return counts;
  }
  /** Clear all geometry (reuse the exporter for a different view). */
  clear() {
    this._tris = [];
    this._triNormals = null;
    this._edges = [];
    this._silhouetteEdges = [];
    return this;
  }
};
function _defaultPrecision(scale) {
  return scale >= 100 ? 3 : 6;
}
function _withSilhouettes(edges, silhouettes, viewDir) {
  if (silhouettes.length === 0) return edges;
  const vx = viewDir.x, vy = viewDir.y, vz = viewDir.z;
  const result = [...edges];
  for (const s of silhouettes) {
    const d0 = s.n0x * vx + s.n0y * vy + s.n0z * vz;
    const d1 = s.n1x * vx + s.n1y * vy + s.n1z * vz;
    if (d0 < 0 !== d1 < 0) {
      result.push(s);
    }
  }
  return result;
}
function _basis(viewDir, upDir) {
  let fx = viewDir.x, fy = viewDir.y, fz = viewDir.z;
  const fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let rx = upDir.y * fz - upDir.z * fy;
  let ry = upDir.z * fx - upDir.x * fz;
  let rz = upDir.x * fy - upDir.y * fx;
  const rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
  return { rx, ry, rz, ux, uy, uz, fx, fy, fz };
}
function _proj(x, y, z, b) {
  return {
    u: x * b.rx + y * b.ry + z * b.rz,
    v: x * b.ux + y * b.uy + z * b.uz,
    d: x * b.fx + y * b.fy + z * b.fz
  };
}
var _c2 = (ax, ay, bx, by) => ax * by - ay * bx;
function _clipTri(p0u, p0v, p1u, p1v, t0u, t0v, t1u, t1v, t2u, t2v) {
  const du = p1u - p0u, dv = p1v - p0v;
  let tEn = 0, tEx = 1;
  const edges = [
    [t0u, t0v, t1u, t1v],
    [t1u, t1v, t2u, t2v],
    [t2u, t2v, t0u, t0v]
  ];
  for (const [qu, qv, ru, rv] of edges) {
    const nx = -(rv - qv), ny = ru - qu;
    const num = nx * (qu - p0u) + ny * (qv - p0v);
    const den = nx * du + ny * dv;
    if (Math.abs(den) < 1e-12) {
      if (num < -1e-8) return null;
      continue;
    }
    const t = num / den;
    if (den > 0) tEn = Math.max(tEn, t);
    else tEx = Math.min(tEx, t);
    if (tEn > tEx + 1e-8) return null;
  }
  tEn = Math.max(0, tEn);
  tEx = Math.min(1, tEx);
  return tEn < tEx - 1e-6 ? [tEn, tEx] : null;
}
function _subInterval(vis, a, b) {
  const out = [];
  for (const [lo, hi] of vis) {
    if (b <= lo + 1e-7 || a >= hi - 1e-7) {
      out.push([lo, hi]);
      continue;
    }
    if (a > lo + 1e-7) out.push([lo, a]);
    if (b < hi - 1e-7) out.push([b, hi]);
  }
  return out;
}
function processWorkerRequest(req, onProgress) {
  const tris = [];
  for (let i = 0; i < req.trisFlat.length; i += 9) {
    tris.push({
      ax: req.trisFlat[i],
      ay: req.trisFlat[i + 1],
      az: req.trisFlat[i + 2],
      bx: req.trisFlat[i + 3],
      by: req.trisFlat[i + 4],
      bz: req.trisFlat[i + 5],
      cx: req.trisFlat[i + 6],
      cy: req.trisFlat[i + 7],
      cz: req.trisFlat[i + 8]
    });
  }
  let triNormals = null;
  if (req.triNormalsFlat) {
    triNormals = [];
    for (let i = 0; i < req.triNormalsFlat.length; i += 3) {
      triNormals.push([req.triNormalsFlat[i], req.triNormalsFlat[i + 1], req.triNormalsFlat[i + 2]]);
    }
  }
  const view = {
    viewDir: new Vec3(req.viewDir[0], req.viewDir[1], req.viewDir[2]),
    upDir: new Vec3(req.upDir[0], req.upDir[1], req.upDir[2])
  };
  const segs = _hiddenLine(tris, req.edges, view, onProgress, triNormals, req.depthBias);
  return _writeDxf(segs, req.layers, req.scale, req.precision);
}
var BVH_LEAF_MAX = 8;
function _buildBvh2D(stris) {
  const n = stris.length;
  const triOrder = new Array(n);
  for (let i = 0; i < n; i++) triOrder[i] = i;
  const nodes = [];
  function build(start, count) {
    let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
    for (let i = start; i < start + count; i++) {
      const t = stris[triOrder[i]];
      if (t.minU < minU) minU = t.minU;
      if (t.maxU > maxU) maxU = t.maxU;
      if (t.minV < minV) minV = t.minV;
      if (t.maxV > maxV) maxV = t.maxV;
    }
    if (count <= BVH_LEAF_MAX) {
      const idx2 = nodes.length;
      nodes.push({ minU, minV, maxU, maxV, rightOff: 0, start, count });
      return idx2;
    }
    const splitU = maxU - minU >= maxV - minV;
    const mid = start + (count >> 1);
    _nthElement(triOrder, start, start + count - 1, mid, stris, splitU);
    const idx = nodes.length;
    nodes.push({ minU, minV, maxU, maxV, rightOff: 0, start: 0, count: 0 });
    build(start, mid - start);
    const rightIdx = build(mid, start + count - mid);
    nodes[idx].rightOff = rightIdx - idx;
    return idx;
  }
  if (n > 0) build(0, n);
  return { nodes, triOrder };
}
function _triCentroid(stris, idx, splitU) {
  const t = stris[idx];
  return splitU ? t.minU + t.maxU : t.minV + t.maxV;
}
function _nthElement(order, lo, hi, nth, stris, splitU) {
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (_triCentroid(stris, order[lo], splitU) > _triCentroid(stris, order[mid], splitU)) {
      const tmp = order[lo];
      order[lo] = order[mid];
      order[mid] = tmp;
    }
    if (_triCentroid(stris, order[lo], splitU) > _triCentroid(stris, order[hi], splitU)) {
      const tmp = order[lo];
      order[lo] = order[hi];
      order[hi] = tmp;
    }
    if (_triCentroid(stris, order[mid], splitU) > _triCentroid(stris, order[hi], splitU)) {
      const tmp = order[mid];
      order[mid] = order[hi];
      order[hi] = tmp;
    }
    {
      const tmp = order[mid];
      order[mid] = order[hi - 1];
      order[hi - 1] = tmp;
    }
    const pivotVal = _triCentroid(stris, order[hi - 1], splitU);
    let i = lo, j = hi - 1;
    for (; ; ) {
      while (_triCentroid(stris, order[++i], splitU) < pivotVal) {
      }
      while (_triCentroid(stris, order[--j], splitU) > pivotVal) {
      }
      if (i >= j) break;
      {
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }
    }
    {
      const tmp = order[i];
      order[i] = order[hi - 1];
      order[hi - 1] = tmp;
    }
    if (i === nth) return;
    if (nth < i) hi = i - 1;
    else lo = i + 1;
  }
}
function _queryBvh(bvh, qMinU, qMinV, qMaxU, qMaxV, out) {
  const { nodes, triOrder } = bvh;
  if (nodes.length === 0) return;
  const stack = [0];
  while (stack.length > 0) {
    const ni = stack.pop();
    const nd = nodes[ni];
    if (qMaxU < nd.minU || qMinU > nd.maxU || qMaxV < nd.minV || qMinV > nd.maxV) continue;
    if (nd.rightOff === 0) {
      for (let i = nd.start, end = nd.start + nd.count; i < end; i++) {
        out.push(triOrder[i]);
      }
    } else {
      stack.push(ni + 1);
      stack.push(ni + nd.rightOff);
    }
  }
}
function _buildBvh3D(tris, indices) {
  const n = indices.length;
  const triOrder = indices.slice();
  const nodes = [];
  const cx = new Float64Array(tris.length);
  const cy = new Float64Array(tris.length);
  const cz = new Float64Array(tris.length);
  for (let i = 0; i < tris.length; i++) {
    const t = tris[i];
    cx[i] = (t.ax + t.bx + t.cx) / 3;
    cy[i] = (t.ay + t.by + t.cy) / 3;
    cz[i] = (t.az + t.bz + t.cz) / 3;
  }
  function build(start, count) {
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
      const idx2 = nodes.length;
      nodes.push({ minX, minY, minZ, maxX, maxY, maxZ, rightOff: 0, start, count });
      return idx2;
    }
    const sx = maxX - minX, sy = maxY - minY, sz = maxZ - minZ;
    const axis = sx >= sy && sx >= sz ? 0 : sy >= sz ? 1 : 2;
    const cArr = axis === 0 ? cx : axis === 1 ? cy : cz;
    const mid = start + (count >> 1);
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
function _nthElement3D(order, lo, hi, nth, vals) {
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (vals[order[lo]] > vals[order[mid]]) {
      const t = order[lo];
      order[lo] = order[mid];
      order[mid] = t;
    }
    if (vals[order[lo]] > vals[order[hi]]) {
      const t = order[lo];
      order[lo] = order[hi];
      order[hi] = t;
    }
    if (vals[order[mid]] > vals[order[hi]]) {
      const t = order[mid];
      order[mid] = order[hi];
      order[hi] = t;
    }
    {
      const t = order[mid];
      order[mid] = order[hi - 1];
      order[hi - 1] = t;
    }
    const pivotVal = vals[order[hi - 1]];
    let i = lo, j = hi - 1;
    for (; ; ) {
      while (vals[order[++i]] < pivotVal) {
      }
      while (vals[order[--j]] > pivotVal) {
      }
      if (i >= j) break;
      {
        const t = order[i];
        order[i] = order[j];
        order[j] = t;
      }
    }
    {
      const t = order[i];
      order[i] = order[hi - 1];
      order[hi - 1] = t;
    }
    if (i === nth) return;
    if (nth < i) hi = i - 1;
    else lo = i + 1;
  }
}
function _rayAabb(ox, oy, oz, invDx, invDy, invDz, node) {
  let tmin = ((invDx >= 0 ? node.minX : node.maxX) - ox) * invDx;
  let tmax = ((invDx >= 0 ? node.maxX : node.minX) - ox) * invDx;
  const tymin = ((invDy >= 0 ? node.minY : node.maxY) - oy) * invDy;
  const tymax = ((invDy >= 0 ? node.maxY : node.minY) - oy) * invDy;
  if (tmin > tymax || tymin > tmax) return false;
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;
  const tzmin = ((invDz >= 0 ? node.minZ : node.maxZ) - oz) * invDz;
  const tzmax = ((invDz >= 0 ? node.maxZ : node.minZ) - oz) * invDz;
  if (tmin > tzmax || tzmin > tmax) return false;
  if (tzmin > tmin) tmin = tzmin;
  if (tzmax < tmax) tmax = tzmax;
  return tmax >= 0 && tmin <= tmax;
}
function _rayTri(ox, oy, oz, dx, dy, dz, t) {
  const e1x = t.bx - t.ax, e1y = t.by - t.ay, e1z = t.bz - t.az;
  const e2x = t.cx - t.ax, e2y = t.cy - t.ay, e2z = t.cz - t.az;
  const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x;
  const a = e1x * hx + e1y * hy + e1z * hz;
  if (a > -1e-10 && a < 1e-10) return -1;
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
function _isOccluded3D(ox, oy, oz, dx, dy, dz, bvh, allTris, adjTris) {
  const { nodes, triOrder } = bvh;
  if (nodes.length === 0) return false;
  const invDx = 1 / dx, invDy = 1 / dy, invDz = 1 / dz;
  const stack = [0];
  while (stack.length > 0) {
    const ni = stack.pop();
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
function _hiddenLine(tris, edges, view, onProgress, triNormals, _depthBias) {
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  const b = _basis(view.viewDir, upDir);
  const hasNormals = triNormals != null && triNormals.length === tris.length;
  const frontIdx = [];
  const stris = [];
  for (let ti = 0; ti < tris.length; ti++) {
    if (hasNormals) {
      const n = triNormals[ti];
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
      minU: Math.min(pa.u, pb.u, pc.u),
      maxU: Math.max(pa.u, pb.u, pc.u),
      minV: Math.min(pa.v, pb.v, pc.v),
      maxV: Math.max(pa.v, pb.v, pc.v),
      srcIdx: ti
    });
  }
  stris.sort((a, z) => a.avgD - z.avgD);
  const bvh2d = _buildBvh2D(stris);
  const bvh3d = _buildBvh3D(tris, frontIdx);
  const rdx = -b.fx, rdy = -b.fy, rdz = -b.fz;
  const result = [];
  const nEdges = edges.length;
  const candBuf = [];
  for (let ei = 0; ei < nEdges; ei++) {
    if (onProgress && (ei & 63) === 0) onProgress(ei / nEdges);
    const edge = edges[ei];
    const ea = _proj(edge.ax, edge.ay, edge.az, b);
    const eb = _proj(edge.bx, edge.by, edge.bz, b);
    const adjN = edge.adjNormals;
    const hasFrontFace = !adjN || adjN.length === 0 || adjN.some((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    const allFrontFaces = adjN && adjN.length > 0 && adjN.every((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    let vis;
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
      candBuf.length = 0;
      _queryBvh(bvh2d, eMinU, eMinV, eMaxU, eMaxV, candBuf);
      for (let ci = 0; ci < candBuf.length; ci++) {
        if (!vis.length) break;
        const tri = stris[candBuf[ci]];
        if (adj && adj.indexOf(tri.srcIdx) >= 0) continue;
        const [ta, tb, tc] = tri.p;
        const interval = _clipTri(
          ea.u,
          ea.v,
          eb.u,
          eb.v,
          ta.u,
          ta.v,
          tb.u,
          tb.v,
          tc.u,
          tc.v
        );
        if (!interval) continue;
        const tM = (interval[0] + interval[1]) * 0.5;
        const px = edge.ax + (edge.bx - edge.ax) * tM;
        const py = edge.ay + (edge.by - edge.ay) * tM;
        const pz = edge.az + (edge.bz - edge.az) * tM;
        if (!_isOccluded3D(px, py, pz, rdx, rdy, rdz, bvh3d, tris, adj)) continue;
        vis = _subInterval(vis, interval[0], interval[1]);
      }
    }
    for (const [t0, t1] of vis) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * t0,
        v0: ea.v + (eb.v - ea.v) * t0,
        u1: ea.u + (eb.u - ea.u) * t1,
        v1: ea.v + (eb.v - ea.v) * t1,
        layer: edge.layer
      });
    }
  }
  return result;
}
function _hiddenLineDebug(tris, edges, view, triNormals, _depthBias) {
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  const b = _basis(view.viewDir, upDir);
  const hasNormals = triNormals != null && triNormals.length === tris.length;
  const frontIdx = [];
  const stris = [];
  for (let ti = 0; ti < tris.length; ti++) {
    if (hasNormals) {
      const n = triNormals[ti];
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
      minU: Math.min(pa.u, pb.u, pc.u),
      maxU: Math.max(pa.u, pb.u, pc.u),
      minV: Math.min(pa.v, pb.v, pc.v),
      maxV: Math.max(pa.v, pb.v, pc.v),
      srcIdx: ti
    });
  }
  stris.sort((a, z) => a.avgD - z.avgD);
  const bvh2d = _buildBvh2D(stris);
  const bvh3d = _buildBvh3D(tris, frontIdx);
  const rdx = -b.fx, rdy = -b.fy, rdz = -b.fz;
  const result = [];
  const candBuf = [];
  for (const edge of edges) {
    const ea = _proj(edge.ax, edge.ay, edge.az, b);
    const eb = _proj(edge.bx, edge.by, edge.bz, b);
    const kindLayer = edge.kind ?? "feature";
    result.push({
      u0: ea.u,
      v0: ea.v,
      u1: eb.u,
      v1: eb.v,
      layer: kindLayer
    });
    const adjN = edge.adjNormals;
    const hasFrontFace = !adjN || adjN.length === 0 || adjN.some((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    const allFrontFaces = adjN && adjN.length > 0 && adjN.every((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    let vis;
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
      _queryBvh(
        bvh2d,
        Math.min(ea.u, eb.u),
        Math.min(ea.v, eb.v),
        Math.max(ea.u, eb.u),
        Math.max(ea.v, eb.v),
        candBuf
      );
      for (let ci = 0; ci < candBuf.length; ci++) {
        if (!vis.length) break;
        const tri = stris[candBuf[ci]];
        if (adj && adj.indexOf(tri.srcIdx) >= 0) continue;
        const [ta, tb, tc] = tri.p;
        const interval = _clipTri(ea.u, ea.v, eb.u, eb.v, ta.u, ta.v, tb.u, tb.v, tc.u, tc.v);
        if (!interval) continue;
        const tM = (interval[0] + interval[1]) * 0.5;
        const px = edge.ax + (edge.bx - edge.ax) * tM;
        const py = edge.ay + (edge.by - edge.ay) * tM;
        const pz = edge.az + (edge.bz - edge.az) * tM;
        if (!_isOccluded3D(px, py, pz, rdx, rdy, rdz, bvh3d, tris, adj)) continue;
        vis = _subInterval(vis, interval[0], interval[1]);
      }
    }
    for (const [t0, t1] of vis) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * t0,
        v0: ea.v + (eb.v - ea.v) * t0,
        u1: ea.u + (eb.u - ea.u) * t1,
        v1: ea.v + (eb.v - ea.v) * t1,
        layer: "visible"
      });
    }
    let prev = 0;
    for (const [t0, t1] of vis) {
      if (t0 > prev + 1e-7) {
        result.push({
          u0: ea.u + (eb.u - ea.u) * prev,
          v0: ea.v + (eb.v - ea.v) * prev,
          u1: ea.u + (eb.u - ea.u) * t0,
          v1: ea.v + (eb.v - ea.v) * t0,
          layer: "occluded"
        });
      }
      prev = t1;
    }
    if (prev < 1 - 1e-7) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * prev,
        v0: ea.v + (eb.v - ea.v) * prev,
        u1: eb.u,
        v1: eb.v,
        layer: "occluded"
      });
    }
  }
  return result;
}
function _writeDxf(segs, layers, scale, prec) {
  const f = (n) => Number.isFinite(n) ? (n * scale).toFixed(prec) : "0";
  const lines = [];
  const used = /* @__PURE__ */ new Set();
  for (const s of segs) used.add(s.layer);
  const { names, colorOf } = _resolveLayers(layers, used);
  _writeR12Prologue(lines, names, colorOf, scale);
  lines.push("0", "SECTION", "2", "ENTITIES");
  for (const s of segs) {
    lines.push(
      "0",
      "LINE",
      "8",
      _sanLayer(s.layer),
      "10",
      f(s.u0),
      "20",
      f(s.v0),
      "30",
      "0.0",
      "11",
      f(s.u1),
      "21",
      f(s.v1),
      "31",
      "0.0"
    );
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\r\n") + "\r\n";
}

// src/io/PolylineVisibility.ts
import * as THREE2 from "three";
var DEPTH_PACK = (
  /* glsl */
  `
  vec4 packDepth(float d) {
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
    vec4 res = fract(d * bitShift);
    res -= res.xxyz * bitMask;
    return res;
  }
`
);
var VS = (
  /* glsl */
  `
  varying float vDepth01;
  uniform float uMinD;
  uniform float uMaxD;
  void main() {
    // CPU side stored position.z = -d (negated so the ortho camera looking
    // along -Z renders closer-to-camera as nearer). Un-flip here to read
    // the original view-space depth.
    float vd = -position.z;
    vDepth01 = clamp((vd - uMinD) / (uMaxD - uMinD), 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
);
var FS = (
  /* glsl */
  `
  precision highp float;
  varying float vDepth01;
  ${DEPTH_PACK}
  void main() { gl_FragColor = packDepth(vDepth01); }
`
);
function extractVisiblePolylines(mesh, polylines, view, options) {
  const resolution = options?.resolution ?? 1024;
  const biasFraction = options?.bias ?? 5e-3;
  const up = view.upDir ?? new Vec3(0, 1, 0);
  let fx = view.viewDir.x, fy = view.viewDir.y, fz = view.viewDir.z;
  {
    const l = Math.hypot(fx, fy, fz) || 1;
    fx /= l;
    fy /= l;
    fz /= l;
  }
  let rx = up.y * fz - up.z * fy;
  let ry = up.z * fx - up.x * fz;
  let rz = up.x * fy - up.y * fx;
  {
    const l = Math.hypot(rx, ry, rz) || 1;
    rx /= l;
    ry /= l;
    rz /= l;
  }
  const ux = fy * rz - fz * ry;
  const uy = fz * rx - fx * rz;
  const uz = fx * ry - fy * rx;
  const proj = (x, y, z) => ({
    u: x * rx + y * ry + z * rz,
    v: x * ux + y * uy + z * uz,
    d: x * fx + y * fy + z * fz
  });
  let minU = Infinity, maxU = -Infinity;
  let minV = Infinity, maxV = -Infinity;
  let minD = Infinity, maxD = -Infinity;
  const verts = [];
  for (const face of mesh.faces()) {
    if (face.nodes.length < 3) continue;
    const ps = face.nodes.map((id) => mesh.node(id).position);
    const p0 = ps[0];
    for (let i = 1; i < ps.length - 1; i++) {
      const a = p0, b = ps[i], c = ps[i + 1];
      for (const p of [a, b, c]) {
        const pr = proj(p.x, p.y, p.z);
        verts.push(pr.u, pr.v, pr.d);
        if (pr.u < minU) minU = pr.u;
        if (pr.u > maxU) maxU = pr.u;
        if (pr.v < minV) minV = pr.v;
        if (pr.v > maxV) maxV = pr.v;
        if (pr.d < minD) minD = pr.d;
        if (pr.d > maxD) maxD = pr.d;
      }
    }
  }
  if (verts.length === 0) {
    return { segments: [], bounds: { minU: 0, maxU: 0, minV: 0, maxV: 0 } };
  }
  const sceneSize = Math.max(maxU - minU, maxV - minV);
  const margin = sceneSize * 0.02;
  minU -= margin;
  maxU += margin;
  minV -= margin;
  maxV += margin;
  const depthRange = maxD - minD || 1;
  const depthPad = depthRange * 0.1;
  minD -= depthPad;
  maxD += depthPad;
  const triPositions = new Float32Array(verts);
  const geo = new THREE2.BufferGeometry();
  geo.setAttribute("position", new THREE2.BufferAttribute(triPositions, 3));
  for (let i = 2; i < triPositions.length; i += 3) triPositions[i] = -triPositions[i];
  geo.attributes.position.needsUpdate = true;
  const material = new THREE2.ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    side: THREE2.DoubleSide,
    depthTest: true,
    depthWrite: true,
    uniforms: { uMinD: { value: minD }, uMaxD: { value: maxD } }
  });
  const scene = new THREE2.Scene();
  scene.add(new THREE2.Mesh(geo, material));
  const camZ = -minD + 1;
  const farZ = maxD - minD + 2;
  const camera = new THREE2.OrthographicCamera(minU, maxU, maxV, minV, 0.5, farZ);
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, camZ - 1);
  const renderer = new THREE2.WebGLRenderer({ antialias: false });
  renderer.setSize(resolution, resolution);
  renderer.setClearColor(new THREE2.Color(0, 0, 0), 0);
  const rt = new THREE2.WebGLRenderTarget(resolution, resolution, {
    minFilter: THREE2.NearestFilter,
    magFilter: THREE2.NearestFilter,
    format: THREE2.RGBAFormat,
    type: THREE2.UnsignedByteType
  });
  renderer.setRenderTarget(rt);
  renderer.clear();
  renderer.render(scene, camera);
  const pixels = new Uint8Array(resolution * resolution * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, resolution, resolution, pixels);
  renderer.setRenderTarget(null);
  rt.dispose();
  geo.dispose();
  material.dispose();
  renderer.dispose();
  function unpackDepth01(px, py) {
    if (px < 0 || px >= resolution || py < 0 || py >= resolution) return null;
    const idx = (py * resolution + px) * 4;
    if (pixels[idx + 3] === 0) return null;
    const r = pixels[idx] / 255;
    const g = pixels[idx + 1] / 255;
    const b = pixels[idx + 2] / 255;
    const a = pixels[idx + 3] / 255;
    return r / (256 * 256 * 256) + g / (256 * 256) + b / 256 + a;
  }
  function toPixel(u, v) {
    return [
      Math.round((u - minU) / (maxU - minU) * (resolution - 1)),
      Math.round((v - minV) / (maxV - minV) * (resolution - 1))
    ];
  }
  const bias01 = biasFraction;
  const segments = [];
  function isVisible(p) {
    const pr = proj(p.x, p.y, p.z);
    const [px, py] = toPixel(pr.u, pr.v);
    let best = null;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const s = unpackDepth01(px + ox, py + oy);
        if (s !== null && (best === null || s < best)) best = s;
      }
    }
    if (best === null) return true;
    const d01 = (pr.d - minD) / (maxD - minD);
    return d01 <= best + bias01;
  }
  for (const poly of polylines) {
    if (poly.length < 2) continue;
    let run3 = [];
    let run2 = [];
    for (const p of poly) {
      if (isVisible(p)) {
        run3.push(p);
        const pr = proj(p.x, p.y, p.z);
        run2.push({ u: pr.u, v: pr.v });
      } else if (run3.length >= 2) {
        segments.push({ points3D: run3, points2D: run2 });
        run3 = [];
        run2 = [];
      } else {
        run3 = [];
        run2 = [];
      }
    }
    if (run3.length >= 2) segments.push({ points3D: run3, points2D: run2 });
  }
  return { segments, bounds: { minU, maxU, minV, maxV } };
}
function polylinesToSVG(segments, bounds2, options) {
  const stroke = options?.stroke ?? "#000";
  const sw = options?.strokeWidth ?? 0.5;
  const pad = options?.padFraction ?? 0.02;
  const w = bounds2.maxU - bounds2.minU;
  const h = bounds2.maxV - bounds2.minV;
  const padX = w * pad;
  const padY = h * pad;
  const vbX = bounds2.minU - padX;
  const vbY = -(bounds2.maxV + padY);
  const vbW = w + 2 * padX;
  const vbH = h + 2 * padY;
  const parts = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(4)} ${vbY.toFixed(4)} ${vbW.toFixed(4)} ${vbH.toFixed(4)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">`
  );
  for (const seg of segments) {
    if (seg.points2D.length < 2) continue;
    const d = seg.points2D.map((p) => `${p.u.toFixed(4)},${(-p.v).toFixed(4)}`).join(" ");
    parts.push(`<polyline points="${d}"/>`);
  }
  parts.push(`</svg>
`);
  return parts.join("\n");
}

// src/render/ThreeRenderer.ts
import * as THREE3 from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
var INERT_STYLE_KEYS = /* @__PURE__ */ new Set(["layer", "lineWidth", "noExport"]);
var DEFAULTS = {
  antialias: true,
  backgroundColor: 658196,
  showGrid: true,
  gridSize: 20,
  gridDivisions: 20,
  showAxes: true,
  axesSize: 3,
  enableOrbitControls: true,
  enableDamping: true,
  cameraPosition: [6, 8, 10],
  cameraTarget: [0, 0, 0],
  fov: 55,
  up: "y"
};
var ThreeRenderer = class {
  constructor(gScene, container, config) {
    this._isOrtho = false;
    this.objectMap = /* @__PURE__ */ new Map();
    this.unsub = null;
    this.rafId = 0;
    // Render on demand: set by anything that can change the picture (scene events,
    // camera, lights, handles, resize); cleared by a draw. See renderIfNeeded().
    this._needsRender = true;
    // Camera position at the previous renderIfNeeded(), to follow orbit damping
    // below OrbitControls' change threshold (see _settleDamping).
    this._lastCamPos = new THREE3.Vector3(NaN, NaN, NaN);
    this.currentLighting = "flat";
    // Studio-mode default PBR material, used when a mesh sets no explicit
    // metalness/roughness in its VisualStyle. Configurable via setStudioMaterial.
    this.studioMetalness = 0;
    this.studioRoughness = 0.65;
    // When set, forces this color on studio meshes (overriding their own); null = keep per-mesh color.
    this.studioColor = null;
    this.studioFlatShading = false;
    // When true, line/point "helper" objects are hidden (e.g. a clean render view
    // that shows only solid meshes). Solid geometry is unaffected.
    this.hideHelpers = false;
    this.gridHelper = null;
    this.axesHelper = null;
    // Invisible shadow-catcher plane added only in Studio mode so the
    // PCF-soft shadows have a surface to land on.
    this.shadowGround = null;
    // When true, the studio shadow-catcher plane (at the world origin) is hidden —
    // e.g. when the app provides its own ground to receive shadows.
    this.shadowGroundHidden = false;
    // Raw THREE objects (e.g. loaded glTF scenes) added by the app, kept across
    // sketch re-runs (clearThree only touches objectMap-managed objects).
    this.externalObjects = /* @__PURE__ */ new Map();
    // Prefiltered (PMREM) environment map for image-based reflections.
    // Built lazily once on first enable, then reused. Only visibly affects
    // studio PBR materials.
    this.envMap = null;
    // Optional equirectangular source (e.g. a loaded HDR) for the environment.
    // null → the built-in procedural gradient. The app owns/disposes this texture.
    this.envSourceTex = null;
    this.envEnabled = false;
    this.envBackground = false;
    this.resizeObserver = null;
    // ── Picking + Gizmo ──
    this.raycaster = new THREE3.Raycaster();
    this.pickEnabled = false;
    this.pickListeners = /* @__PURE__ */ new Set();
    this.transformControls = null;
    this.gizmoMode = "translate";
    this.gizmoAttachedId = null;
    this.pointerDown = null;
    this.selectionMaterials = /* @__PURE__ */ new Map();
    // ── Drag handles ──
    this.dragHandles = /* @__PURE__ */ new Map();
    this.dragHandleConstraints = /* @__PURE__ */ new Map();
    this.dragHandlePlanes = /* @__PURE__ */ new Map();
    this.dragHandleMoveCb = null;
    this.dragHandleEndCb = null;
    this.dragHandlePickCb = null;
    this.activeDragHandle = null;
    this.selectedDragHandle = null;
    this.dragPlane = new THREE3.Plane();
    this.dragSeenThisRun = /* @__PURE__ */ new Set();
    /** Cached horizontal-stripe textures for print-layer shading, keyed by layer height (m). One texture
     *  period = one printed bead: bright rounded crown, dark groove at the layer boundary. The pipe UVs
     *  carry V in metres, so repeat.y = 1/layerH gives physically-true layer spacing. */
    this._stripeTexCache = /* @__PURE__ */ new Map();
    this.onPointerDown = (e) => {
      const handleName = this.dragHandleHitTest(e.clientX, e.clientY);
      if (handleName) {
        e.preventDefault();
        this.activeDragHandle = handleName;
        this.setHandleSelected(handleName);
        if (this.controls) this.controls.enabled = false;
        const handle = this.dragHandles.get(handleName);
        let normal;
        if (this.dragHandlePlanes.get(handleName) === "screen") {
          normal = new THREE3.Vector3();
          this.activeCamera.getWorldDirection(normal);
        } else {
          normal = this.isZUp ? new THREE3.Vector3(0, 0, 1) : new THREE3.Vector3(0, 1, 0);
        }
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, handle.position);
        const dom = this.renderer.domElement;
        dom.addEventListener("pointermove", this.onPointerMoveDragging);
        dom.addEventListener("pointerup", this.onPointerUpDragging, { once: true });
        dom.setPointerCapture(e.pointerId);
        return;
      }
      this.pointerDown = { x: e.clientX, y: e.clientY };
    };
    this.onPointerUp = (e) => {
      if (!this.pointerDown) return;
      const dx = e.clientX - this.pointerDown.x;
      const dy = e.clientY - this.pointerDown.y;
      this.pointerDown = null;
      if (dx * dx + dy * dy > 25) return;
      if (this.transformControls?.dragging) return;
      if (this.selectedDragHandle !== null) this.setHandleSelected(null);
      const id = this.pickAt(e.clientX, e.clientY);
      for (const l of this.pickListeners) l(id);
    };
    this.onPointerMoveDragging = (e) => {
      if (!this.activeDragHandle) return;
      const hit = this.raycastPlane(e.clientX, e.clientY, this.dragPlane);
      if (!hit) return;
      const handle = this.dragHandles.get(this.activeDragHandle);
      if (!handle) return;
      let x = hit.x, y = hit.y, z = hit.z;
      const constrain = this.dragHandleConstraints.get(this.activeDragHandle);
      if (constrain) {
        const c = constrain(x, y, z);
        x = c[0];
        y = c[1];
        z = c[2];
      }
      handle.position.set(x, y, z);
      this.requestRender();
      if (this.dragHandleMoveCb) {
        this.dragHandleMoveCb(this.activeDragHandle, x, y, z);
      }
    };
    this.onPointerUpDragging = (_e) => {
      const name = this.activeDragHandle;
      this.activeDragHandle = null;
      if (this.controls) this.controls.enabled = true;
      const dom = this.renderer.domElement;
      dom.removeEventListener("pointermove", this.onPointerMoveDragging);
      if (name && this.dragHandlePickCb) this.dragHandlePickCb(name);
      if (name && this.dragHandleEndCb) this.dragHandleEndCb(name);
    };
    this.gScene = gScene;
    this.container = container;
    this.config = { ...DEFAULTS, ...config };
    this.isZUp = this.config.up === "z";
    const cfg = this.config;
    this.threeScene = new THREE3.Scene();
    this.threeScene.background = new THREE3.Color(cfg.backgroundColor);
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE3.PerspectiveCamera(cfg.fov, aspect, 0.1, 1e3);
    if (this.isZUp) this.camera.up.set(0, 0, 1);
    this.camera.position.set(...cfg.cameraPosition);
    this.camera.lookAt(...cfg.cameraTarget);
    this._orthoCam = new THREE3.OrthographicCamera(-10, 10, 10, -10, 0.01, 2e3);
    if (this.isZUp) this._orthoCam.up.set(0, 0, 1);
    this._orthoCam.position.set(...cfg.cameraPosition);
    this._orthoCam.lookAt(...cfg.cameraTarget);
    this.renderer = new THREE3.WebGLRenderer({ antialias: cfg.antialias });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    this.ambientLight = new THREE3.AmbientLight(16777215, 0.5);
    this.threeScene.add(this.ambientLight);
    this.dirLight = new THREE3.DirectionalLight(16777215, 0.7);
    this.dirLight.position.set(8, this.isZUp ? 10 : 15, this.isZUp ? 15 : 10);
    this.dirLight.target.position.set(0, 0, 0);
    this.threeScene.add(this.dirLight);
    this.threeScene.add(this.dirLight.target);
    this.hemiLight = new THREE3.HemisphereLight(4482730, 3351057, 0.4);
    this.threeScene.add(this.hemiLight);
    this._applyLighting(this.gScene.lightingMode);
    if (cfg.showGrid) {
      const grid = new THREE3.GridHelper(cfg.gridSize, cfg.gridDivisions, 3816538, 2763850);
      if (this.isZUp) grid.rotation.x = Math.PI / 2;
      this.gridHelper = grid;
      this.threeScene.add(grid);
    }
    if (cfg.showAxes) {
      this.axesHelper = new THREE3.AxesHelper(cfg.axesSize);
      this.threeScene.add(this.axesHelper);
    }
    if (cfg.enableOrbitControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = cfg.enableDamping;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(...cfg.cameraTarget);
      this.controls.addEventListener("change", () => this.requestRender());
    }
    this.renderer.domElement.addEventListener("webglcontextrestored", () => this.requestRender());
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.unsub = gScene.on((e) => this.handleEvent(e));
    for (const obj of gScene.all()) this.addToThree(obj);
  }
  /** The currently active camera — perspective or orthographic. */
  get activeCamera() {
    return this._isOrtho ? this._orthoCam : this.camera;
  }
  // ── Event Handling ──
  handleEvent(event) {
    this._needsRender = true;
    switch (event.type) {
      case "object:add": {
        const obj = this.gScene.get(event.id);
        if (obj) this.addToThree(obj);
        break;
      }
      case "object:remove":
        this.removeFromThree(event.id);
        break;
      case "object:style": {
        const t = this.objectMap.get(event.id);
        const srcObj = this.gScene.get(event.id);
        if (t && srcObj && this._restyleInPlace(t, srcObj, event.style)) break;
        this.removeFromThree(event.id);
        if (srcObj) this.addToThree(srcObj);
        break;
      }
      case "object:update": {
        const t = this.objectMap.get(event.id);
        const obj = this.gScene.get(event.id);
        if (t && obj && Object.keys(event.changes).every((k) => k === "pickTag" || k === "pickable")) {
          t.userData.pickable = obj.pickable !== false;
          break;
        }
        this.removeFromThree(event.id);
        if (obj) this.addToThree(obj);
        break;
      }
      case "scene:clear":
        this.clearThree();
        break;
      case "scene:renderMode":
        this.rebuildAllMeshes();
        break;
      case "scene:lightingMode":
        this._applyLighting(event.mode);
        this.rebuildAllMeshes();
        break;
      case "scene:environment":
        this._applyEnvironment(event.enabled);
        break;
    }
  }
  // ── Object Conversion ──
  addToThree(obj) {
    const t = this.convert(obj);
    if (!t) return;
    t.userData.geomId = obj.id;
    t.userData.pickable = obj.pickable !== false;
    t.userData.objType = obj.type;
    t.userData.styleVisible = obj.style.visible;
    t.visible = obj.style.visible && !(this.hideHelpers && this._isHelper(obj.type));
    this.applyTransform(t, obj);
    if (this.currentLighting === "studio") {
      t.traverse((child) => {
        if (child instanceof THREE3.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    this.threeScene.add(t);
    this.objectMap.set(obj.id, t);
    if (this.gizmoAttachedId === obj.id) this.attachGizmo(obj.id);
  }
  /** Apply a style patch to the existing three object if it only touches colour,
   *  opacity, visibility or inert keys. False → the caller rebuilds the object. */
  _restyleInPlace(t, obj, patch) {
    let paint = false;
    for (const k of Object.keys(patch)) {
      if (k === "color" || k === "opacity") paint = true;
      else if (k !== "visible" && !INERT_STYLE_KEYS.has(k)) return false;
    }
    if (paint && !this._repaint(t, obj)) return false;
    if ("visible" in patch) {
      t.userData.styleVisible = obj.style.visible;
      t.visible = obj.style.visible && !(this.hideHelpers && this._isHelper(obj.type));
    }
    return true;
  }
  /** Set colour + opacity on a single-material object exactly as convert() would build
   *  it: lines (segment, polyline, circle), tube segments and unlabelled points. Meshes,
   *  polygons, planes and labelled points have mode- or label-dependent materials → false. */
  _repaint(t, obj) {
    const s = obj.style;
    const tube = obj.type === "segment" && !!s.tubeRadius && s.tubeRadius > 0;
    const line = !tube && (obj.type === "segment" || obj.type === "polyline" || obj.type === "circle");
    const solid = tube || obj.type === "point" && !s.label;
    const m = t.material;
    if (!line && !solid || !m || Array.isArray(m)) return false;
    const mat = m;
    mat.color.set(solid && this.currentLighting === "studio" ? this.studioColor ?? s.color : s.color);
    if (obj.type === "point") {
      const sel = this.selectionMaterials.get(t.uuid);
      (sel ? sel.oldEmissive : mat.emissive).set(s.color);
    }
    const transparent = s.opacity < 1;
    if (mat.transparent !== transparent) {
      mat.transparent = transparent;
      mat.needsUpdate = true;
    }
    mat.opacity = s.opacity;
    return true;
  }
  /** Apply `obj.transform` (position/rotation/scale) to a Three.Object3D. */
  applyTransform(t, obj) {
    const tr = obj.transform;
    if (!tr) return;
    if (tr.position) t.position.set(tr.position.x, tr.position.y, tr.position.z);
    if (tr.rotation) t.rotation.set(tr.rotation.x, tr.rotation.y, tr.rotation.z);
    if (tr.scale) t.scale.set(tr.scale.x, tr.scale.y, tr.scale.z);
  }
  removeFromThree(id) {
    const t = this.objectMap.get(id);
    if (!t) return;
    this.threeScene.remove(t);
    this.disposeObject(t);
    this.objectMap.delete(id);
  }
  clearThree() {
    for (const [, t] of this.objectMap) {
      this.threeScene.remove(t);
      this.disposeObject(t);
    }
    this.objectMap.clear();
  }
  /** Rebuild all mesh objects (called when render mode changes). */
  rebuildAllMeshes() {
    for (const obj of this.gScene.all()) {
      if (obj.type !== "mesh") continue;
      this.removeFromThree(obj.id);
      this.addToThree(obj);
    }
  }
  /**
   * Build a material that respects the current lighting mode. Studio mode
   * returns an `MeshStandardMaterial` (PBR; reacts correctly to shadows
   * and tonemapping); Flat mode returns the original `MeshPhongMaterial`.
   * Same option surface — caller doesn't have to care which one comes back.
   */
  _makeMaterial(opts) {
    if (this.currentLighting === "studio") {
      return new THREE3.MeshStandardMaterial({
        color: this.studioColor ?? opts.color,
        emissive: opts.emissive,
        emissiveIntensity: opts.emissiveIntensity,
        opacity: opts.opacity,
        transparent: opts.transparent,
        side: opts.side,
        wireframe: opts.wireframe,
        flatShading: opts.flatShading ?? this.studioFlatShading,
        depthTest: opts.depthTest,
        depthWrite: opts.depthWrite,
        vertexColors: opts.vertexColors,
        roughness: opts.roughness ?? this.studioRoughness,
        metalness: opts.metalness ?? this.studioMetalness
      });
    }
    const { metalness: _m, roughness: _r, ...rest } = opts;
    return new THREE3.MeshPhongMaterial(rest);
  }
  _stripeTexture(layerH) {
    let tex = this._stripeTexCache.get(layerH);
    if (tex) return tex;
    const H = 64;
    const cv = document.createElement("canvas");
    cv.width = 2;
    cv.height = H;
    const ctx = cv.getContext("2d");
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const crown = Math.sin(Math.PI * t);
      const v = Math.round(150 + 105 * Math.pow(crown, 0.7));
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, 2, 1);
    }
    tex = new THREE3.CanvasTexture(cv);
    tex.wrapS = THREE3.RepeatWrapping;
    tex.wrapT = THREE3.RepeatWrapping;
    tex.repeat.set(1, 1 / layerH);
    tex.anisotropy = 4;
    this._stripeTexCache.set(layerH, tex);
    return tex;
  }
  /**
   * Set the Studio-mode default PBR material applied to meshes that don't
   * carry their own metalness/roughness. Takes effect on the next material
   * build (e.g. the next sketch re-run). metalness/roughness in 0..1.
   */
  setStudioMaterial(metalness, roughness, color = null, flatShading = false) {
    const metalChanged = this.studioMetalness !== metalness || this.studioRoughness !== roughness;
    this.studioMetalness = metalness;
    this.studioRoughness = roughness;
    this.studioColor = color;
    this.studioFlatShading = flatShading;
    if (metalChanged && this.currentLighting === "studio") {
      for (const obj of this.gScene.all()) {
        if (obj.type !== "mesh") continue;
        const s = obj.style;
        if (s.metalness !== void 0 && s.roughness !== void 0) continue;
        const t = this.objectMap.get(obj.id);
        if (!t) continue;
        t.traverse((c) => {
          if (!(c instanceof THREE3.Mesh)) return;
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          for (const m of mats) {
            if (m instanceof THREE3.MeshStandardMaterial) {
              if (s.metalness === void 0) m.metalness = metalness;
              if (s.roughness === void 0) m.roughness = roughness;
            }
          }
        });
      }
    }
    this.requestRender();
  }
  // Line/point "helper" object types (vs solid meshes/polygons/planes).
  _isHelper(type) {
    return type === "segment" || type === "polyline" || type === "point" || type === "circle";
  }
  /**
   * Show/hide line + point "helper" objects (axes, construction lines, markers,
   * labels). Solid meshes are unaffected. Applies immediately to existing
   * objects and to all future ones until changed.
   */
  /**
   * Show/hide the studio shadow-catcher plane at the world origin. Hide it when
   * the app supplies its own ground mesh to receive shadows (avoids a duplicate
   * shadow at z=0).
   */
  setShadowGroundVisible(visible) {
    this.shadowGroundHidden = !visible;
    if (this.shadowGround) this.shadowGround.visible = visible;
    this.requestRender();
  }
  /**
   * Add a raw THREE.Object3D (e.g. a loaded glTF/GLB scene) to the renderer,
   * persisting across sketch re-runs. Re-adding the same id replaces it.
   * Meshes are flagged to cast + receive shadows (visible in Studio lighting).
   */
  addExternalObject(obj, id) {
    const prev = this.externalObjects.get(id);
    if (prev) this.threeScene.remove(prev);
    obj.traverse((o) => {
      const m = o;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    this.externalObjects.set(id, obj);
    this.threeScene.add(obj);
    this.requestRender();
  }
  removeExternalObject(id) {
    const prev = this.externalObjects.get(id);
    if (prev) {
      this.threeScene.remove(prev);
      this.externalObjects.delete(id);
    }
    this.requestRender();
  }
  setHelpersVisible(visible) {
    this.hideHelpers = !visible;
    if (this.gridHelper) this.gridHelper.visible = visible;
    if (this.axesHelper) this.axesHelper.visible = visible;
    this.threeScene.traverse((o) => {
      if (this._isHelper(o.userData?.objType)) {
        o.visible = visible ? o.userData.styleVisible ?? true : false;
      }
    });
    this.requestRender();
  }
  /**
   * Aim the main directional light at the origin from the given unit
   * direction (FROM origin TO light). Input is in Z-up scene coords
   * (+X east, +Y north, +Z up) — typical sun-vector convention; the
   * renderer remaps internally if the scene is Y-up.
   *
   * @param direction Unit vector pointing toward the light source.
   * @param distance  How far back to place the light (m). Default 50.
   */
  /** Exponential distance fog tinted `color`; density 0 (or omitted) clears it. ~0.005–0.03 is a
   *  useful range at building scale. */
  setFog(color, density = 0) {
    this.threeScene.fog = density > 1e-6 ? new THREE3.FogExp2(new THREE3.Color(color), density) : null;
    this.requestRender();
  }
  /** Tone-mapping exposure (1 = neutral; <1 darker, >1 brighter). */
  setExposure(v) {
    this.renderer.toneMappingExposure = v;
    this.requestRender();
  }
  setSunDirection(direction, distance = 50) {
    const x = direction.x;
    const y = this.isZUp ? direction.y : direction.z;
    const z = this.isZUp ? direction.z : -direction.y;
    this.dirLight.position.set(x * distance, y * distance, z * distance);
    this.dirLight.target.position.set(0, 0, 0);
    this.dirLight.target.updateMatrixWorld();
    this.dirLight.shadow.camera.updateProjectionMatrix();
    this.requestRender();
  }
  /**
   * Reconfigure renderer + lights + scene shadow flags for the given mode.
   * Material swapping happens after this returns, via `rebuildAllMeshes`.
   */
  _applyLighting(mode) {
    this.currentLighting = mode;
    const studio = mode === "studio";
    this.renderer.shadowMap.enabled = studio;
    this.renderer.shadowMap.type = THREE3.PCFSoftShadowMap;
    this.renderer.toneMapping = studio ? THREE3.ACESFilmicToneMapping : THREE3.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE3.SRGBColorSpace;
    if (studio) {
      this.ambientLight.intensity = 0.35;
      this.hemiLight.intensity = 0.3;
      this.dirLight.intensity = 2.8;
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.set(2048, 2048);
      this.dirLight.shadow.bias = -5e-4;
      const sc = this.dirLight.shadow.camera;
      const d = 30;
      sc.near = 0.5;
      sc.far = 200;
      sc.left = -d;
      sc.right = d;
      sc.top = d;
      sc.bottom = -d;
      sc.updateProjectionMatrix();
    } else {
      this.ambientLight.intensity = 0.5;
      this.hemiLight.intensity = 0.4;
      this.dirLight.intensity = 0.7;
      this.dirLight.castShadow = false;
    }
    this.threeScene.traverse((obj) => {
      if (obj instanceof THREE3.Mesh) {
        obj.castShadow = studio;
        obj.receiveShadow = studio;
      }
    });
    if (studio && !this.shadowGround) {
      const geo = new THREE3.PlaneGeometry(400, 400);
      const mat = new THREE3.ShadowMaterial({ opacity: 0.35 });
      this.shadowGround = new THREE3.Mesh(geo, mat);
      this.shadowGround.receiveShadow = true;
      if (!this.isZUp) this.shadowGround.rotation.x = -Math.PI / 2;
      this.shadowGround.position.set(0, this.isZUp ? 0 : -1e-3, this.isZUp ? -1e-3 : 0);
      this.shadowGround.visible = !this.shadowGroundHidden;
      this.threeScene.add(this.shadowGround);
    } else if (!studio && this.shadowGround) {
      this.threeScene.remove(this.shadowGround);
      this.shadowGround.geometry.dispose();
      this.shadowGround.material.dispose();
      this.shadowGround = null;
    }
  }
  /**
   * Toggle a prefiltered environment map on `threeScene.environment`. Only
   * studio PBR (`MeshStandardMaterial`) materials sample it, so this is a
   * no-op visually in flat mode — but it's safe to enable in either mode.
   * The map is built once on first enable and reused thereafter.
   */
  _applyEnvironment(enabled) {
    this.envEnabled = enabled;
    if (enabled) {
      if (!this.envMap) this.envMap = this._buildEnvironment();
      this.threeScene.environment = this.envMap;
    } else {
      this.threeScene.environment = null;
    }
  }
  /**
   * Set an equirectangular source texture for the environment (e.g. a loaded
   * HDR via RGBELoader). Pass null to use the built-in procedural gradient.
   * The texture is PMREM-prefiltered here; the caller keeps ownership of it.
   */
  setEnvironmentSource(equirect) {
    if (this.envSourceTex === equirect) return;
    this.envSourceTex = equirect;
    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }
    if (this.envEnabled) {
      this.envMap = this._buildEnvironment();
      this.threeScene.environment = this.envMap;
    }
    this._applyBackground();
    this.requestRender();
  }
  /**
   * Show the equirectangular environment source as the scene backdrop (sky).
   * No-op until a source is set via setEnvironmentSource. When off, the
   * background is left to setBackground().
   */
  setEnvironmentBackground(visible) {
    this.envBackground = visible;
    this._applyBackground();
    this.requestRender();
  }
  /**
   * Rotate the environment + background (Euler radians) — e.g. to align a Y-up
   * HDRI/equirect source with a Z-up scene (tilt ~90° about X).
   */
  setEnvironmentRotation(x, y, z) {
    const s = this.threeScene;
    s.environmentRotation?.set(x, y, z);
    s.backgroundRotation?.set(x, y, z);
    this.requestRender();
  }
  _applyBackground() {
    if (this.envBackground && this.envSourceTex) {
      this.envSourceTex.mapping = THREE3.EquirectangularReflectionMapping;
      this.threeScene.background = this.envSourceTex;
    }
  }
  /**
   * Build a prefiltered (PMREM) environment from a procedural vertical
   * gradient — bright neutral sky at the top, mid horizon, darker ground —
   * using core Three only (no `three/examples` RoomEnvironment). Returns the
   * PMREM-filtered cube texture; the source `DataTexture` and the generator
   * are disposed before returning.
   */
  _buildEnvironment() {
    if (this.envSourceTex) {
      this.envSourceTex.mapping = THREE3.EquirectangularReflectionMapping;
      const pmremSrc = new THREE3.PMREMGenerator(this.renderer);
      const envSrc = pmremSrc.fromEquirectangular(this.envSourceTex).texture;
      pmremSrc.dispose();
      return envSrc;
    }
    const W = 16, H = 256;
    const data = new Uint8Array(W * H * 4);
    const sky = [0.85, 0.88, 0.95];
    const horizon = [0.55, 0.55, 0.55];
    const ground = [0.12, 0.12, 0.13];
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1);
      let r, g, b;
      if (t < 0.5) {
        const k = t / 0.5;
        r = ground[0] + (horizon[0] - ground[0]) * k;
        g = ground[1] + (horizon[1] - ground[1]) * k;
        b = ground[2] + (horizon[2] - ground[2]) * k;
      } else {
        const k = (t - 0.5) / 0.5;
        r = horizon[0] + (sky[0] - horizon[0]) * k;
        g = horizon[1] + (sky[1] - horizon[1]) * k;
        b = horizon[2] + (sky[2] - horizon[2]) * k;
      }
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i] = Math.round(r * 255);
        data[i + 1] = Math.round(g * 255);
        data[i + 2] = Math.round(b * 255);
        data[i + 3] = 255;
      }
    }
    const tex = new THREE3.DataTexture(data, W, H, THREE3.RGBAFormat);
    tex.mapping = THREE3.EquirectangularReflectionMapping;
    tex.colorSpace = THREE3.SRGBColorSpace;
    tex.needsUpdate = true;
    const pmrem = new THREE3.PMREMGenerator(this.renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }
  /** Build a THREE.Line for a line-type object — dashed material (+ line distances)
   *  when the style requests it, else a basic line material. */
  _makeLine(geo, s) {
    const mat = s.dash ? new THREE3.LineDashedMaterial({ color: s.color, opacity: s.opacity, transparent: s.opacity < 1, dashSize: s.dash.size, gapSize: s.dash.gap }) : new THREE3.LineBasicMaterial({ color: s.color, opacity: s.opacity, transparent: s.opacity < 1 });
    const line = new THREE3.Line(geo, mat);
    if (s.dash) line.computeLineDistances();
    return line;
  }
  convert(obj) {
    const s = obj.style;
    switch (obj.type) {
      case "point": {
        const geo = new THREE3.SphereGeometry(s.pointSize, 12, 12);
        const mat = this._makeMaterial({
          color: s.color,
          emissive: s.color,
          emissiveIntensity: 0.3,
          opacity: s.opacity,
          transparent: s.opacity < 1,
          metalness: s.metalness,
          roughness: s.roughness
        });
        const mesh = new THREE3.Mesh(geo, mat);
        if (obj.position) mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        if (s.label) {
          const group = new THREE3.Group();
          group.add(mesh);
          const sprite = this.createTextSprite(s.label, s.labelColor ?? s.color, s.labelScale ?? 1);
          if (obj.position) sprite.position.set(obj.position.x, obj.position.y, obj.position.z);
          if (this.isZUp) sprite.position.z += s.pointSize + 0.15;
          else sprite.position.y += s.pointSize + 0.15;
          group.add(sprite);
          return group;
        }
        return mesh;
      }
      case "segment": {
        if (!obj.start || !obj.end) return null;
        const a = new THREE3.Vector3(obj.start.x, obj.start.y, obj.start.z);
        const b = new THREE3.Vector3(obj.end.x, obj.end.y, obj.end.z);
        if (s.tubeRadius && s.tubeRadius > 0) {
          const dir = new THREE3.Vector3().subVectors(b, a);
          const len = dir.length();
          if (len < 1e-8) return null;
          const geo2 = new THREE3.CylinderGeometry(s.tubeRadius, s.tubeRadius, len, 6, 1);
          geo2.rotateX(Math.PI / 2);
          geo2.translate(0, 0, len / 2);
          const mesh = new THREE3.Mesh(geo2, this._makeMaterial({
            color: s.color,
            opacity: s.opacity,
            transparent: s.opacity < 1,
            metalness: s.metalness,
            roughness: s.roughness
          }));
          mesh.position.copy(a);
          mesh.lookAt(b);
          return mesh;
        }
        const geo = new THREE3.BufferGeometry().setFromPoints([a, b]);
        return this._makeLine(geo, s);
      }
      case "polyline": {
        if (!obj.vertices || obj.vertices.length < 2) return null;
        const n = obj.vertices.length;
        const arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const v = obj.vertices[i];
          arr[i * 3] = v.x;
          arr[i * 3 + 1] = v.y;
          arr[i * 3 + 2] = v.z;
        }
        const geo = new THREE3.BufferGeometry();
        geo.setAttribute("position", new THREE3.BufferAttribute(arr, 3));
        return this._makeLine(geo, s);
      }
      case "polygon": {
        if (!obj.vertices || obj.vertices.length < 2) return null;
        const group = new THREE3.Group();
        const pts = obj.vertices.map((v) => new THREE3.Vector3(v.x, v.y, v.z));
        if (pts.length > 2) pts.push(pts[0].clone());
        const lineGeo = new THREE3.BufferGeometry().setFromPoints(pts);
        group.add(new THREE3.Line(lineGeo, new THREE3.LineBasicMaterial({ color: s.color })));
        if (obj.vertices.length >= 3) {
          if (this.isZUp) {
            const shape = new THREE3.Shape(obj.vertices.map((v) => new THREE3.Vector2(v.x, v.y)));
            const shapeGeo = new THREE3.ShapeGeometry(shape);
            group.add(new THREE3.Mesh(shapeGeo, this._makeMaterial({
              color: s.color,
              opacity: s.opacity,
              transparent: true,
              side: THREE3.DoubleSide,
              metalness: s.metalness,
              roughness: s.roughness
            })));
          } else {
            const shape = new THREE3.Shape(obj.vertices.map((v) => new THREE3.Vector2(v.x, v.z)));
            const shapeGeo = new THREE3.ShapeGeometry(shape);
            shapeGeo.rotateX(-Math.PI / 2);
            group.add(new THREE3.Mesh(shapeGeo, this._makeMaterial({
              color: s.color,
              opacity: s.opacity,
              transparent: true,
              side: THREE3.DoubleSide,
              metalness: s.metalness,
              roughness: s.roughness
            })));
          }
        }
        return group;
      }
      case "mesh": {
        if (obj.flatMeshData) return this.convertFlatMesh(obj.flatMeshData, s);
        if (!obj.mesh) return null;
        return this.convertMesh(obj.mesh, s);
      }
      case "circle": {
        if (!obj.center || obj.radius == null) return null;
        const pts = [];
        const seg = 64;
        for (let i = 0; i <= seg; i++) {
          const a = i / seg * Math.PI * 2;
          const ca = Math.cos(a) * obj.radius, sa = Math.sin(a) * obj.radius;
          if (this.isZUp) {
            pts.push(new THREE3.Vector3(obj.center.x + ca, obj.center.y + sa, obj.center.z));
          } else {
            pts.push(new THREE3.Vector3(obj.center.x + ca, obj.center.y, obj.center.z + sa));
          }
        }
        const geo = new THREE3.BufferGeometry().setFromPoints(pts);
        return this._makeLine(geo, s);
      }
      case "plane": {
        if (!obj.normal) return null;
        const geo = new THREE3.PlaneGeometry(10, 10);
        const mat = this._makeMaterial({
          color: s.color,
          opacity: s.opacity,
          transparent: true,
          side: THREE3.DoubleSide,
          metalness: s.metalness,
          roughness: s.roughness
        });
        const mesh = new THREE3.Mesh(geo, mat);
        const n = new THREE3.Vector3(obj.normal.x, obj.normal.y, obj.normal.z).normalize();
        mesh.lookAt(n);
        mesh.position.copy(n.multiplyScalar(obj.distance ?? 0));
        return mesh;
      }
      default:
        return null;
    }
  }
  /** Convert a Tekto Mesh → Three.js group with solid + wireframe */
  convertMesh(gmesh, s) {
    const data = gmesh.toMeshData();
    const geo = new THREE3.BufferGeometry();
    geo.setAttribute("position", new THREE3.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE3.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE3.BufferAttribute(data.indices, 1));
    const pipeUV = gmesh.__pipeUV;
    if (pipeUV && pipeUV.sides > 0) {
      const n = data.positions.length / 3;
      const uv = new Float32Array(n * 2);
      for (let k = 0; k < n; k++) {
        const ring = Math.min(Math.floor(k / pipeUV.sides), pipeUV.vAtRing.length - 1);
        uv[k * 2] = k % pipeUV.sides / pipeUV.sides;
        uv[k * 2 + 1] = pipeUV.vAtRing[ring] ?? 0;
      }
      geo.setAttribute("uv", new THREE3.BufferAttribute(uv, 2));
    }
    return this.buildMeshGroup(geo, s);
  }
  /** Convert flat mesh data (with optional per-vertex colors) → Three.js group */
  convertFlatMesh(data, s) {
    const geo = new THREE3.BufferGeometry();
    geo.setAttribute("position", new THREE3.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE3.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE3.BufferAttribute(data.indices, 1));
    const hasColors = !!data.colors?.length;
    if (hasColors) geo.setAttribute("color", new THREE3.BufferAttribute(data.colors, 4));
    if (data.groups?.length && this.gScene.renderMode === "solid" && !hasColors) {
      const groupColors = s.groupColors ?? {};
      const side = s.backfaceColor ? THREE3.DoubleSide : s.doubleSided ? THREE3.DoubleSide : THREE3.FrontSide;
      for (let i = 0; i < data.groups.length; i++) {
        const g = data.groups[i];
        geo.addGroup(g.indexStart, g.indexCount, i);
      }
      const materials = data.groups.map((g) => this._makeMaterial({
        color: groupColors[g.name] ?? s.color,
        opacity: s.wireframe ? s.opacity * 0.3 : s.opacity,
        transparent: s.opacity < 1 || s.wireframe,
        side,
        flatShading: s.flatShading ?? false,
        metalness: s.metalness,
        roughness: s.roughness,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      }));
      const group = new THREE3.Group();
      group.add(new THREE3.Mesh(geo, materials));
      if (!s.wireframe) {
        group.add(new THREE3.Mesh(geo.clone(), new THREE3.MeshBasicMaterial({
          color: 16777215,
          wireframe: true,
          opacity: 0.04,
          transparent: true
        })));
      }
      return group;
    }
    return this.buildMeshGroup(geo, s, hasColors);
  }
  /** Shared mesh group builder — handles solid / wireframe / hiddenline render modes */
  buildMeshGroup(geo, s, hasVertexColors = false) {
    const group = new THREE3.Group();
    const mode = this.gScene.renderMode;
    const side = s.doubleSided ? THREE3.DoubleSide : THREE3.FrontSide;
    if (mode === "wireframe") {
      const wireMat = new THREE3.MeshBasicMaterial({
        color: s.color,
        wireframe: true,
        opacity: s.opacity,
        transparent: s.opacity < 1
      });
      group.add(new THREE3.Mesh(geo, wireMat));
    } else if (mode === "hiddenline") {
      const occlusionMat = new THREE3.MeshBasicMaterial({
        color: this.config.backgroundColor,
        side,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      group.add(new THREE3.Mesh(geo, occlusionMat));
      const edgeAngle = s.edgeAngle ?? 30;
      const wireGeo = new THREE3.EdgesGeometry(geo, edgeAngle);
      const wireMat = new THREE3.LineBasicMaterial({ color: s.edgeColor ?? 3092271, toneMapped: false });
      group.add(new THREE3.LineSegments(wireGeo, wireMat));
      const rimMat = new THREE3.MeshBasicMaterial({
        color: s.edgeColor ?? 3092271,
        side: THREE3.BackSide,
        toneMapped: false
      });
      group.add(new THREE3.Mesh(geo, rimMat));
    } else {
      const solidMat = this._makeMaterial({
        color: hasVertexColors ? 16777215 : s.color,
        vertexColors: hasVertexColors,
        opacity: s.wireframe ? s.opacity * 0.3 : s.opacity,
        transparent: s.opacity < 1 || s.wireframe,
        side: s.backfaceColor ? THREE3.DoubleSide : side,
        flatShading: s.flatShading ?? false,
        metalness: s.metalness,
        roughness: s.roughness,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      if (s.printLayerH && s.printLayerH > 1e-5 && geo.getAttribute("uv")) {
        const tex = this._stripeTexture(s.printLayerH);
        solidMat.map = tex;
        solidMat.bumpMap = tex;
        solidMat.bumpScale = s.printLayerH * 0.35;
        solidMat.needsUpdate = true;
      }
      if (s.backfaceColor) {
        const bc = new THREE3.Color(s.backfaceColor);
        solidMat.onBeforeCompile = (shader) => {
          shader.uniforms.backfaceColor = { value: bc };
          shader.fragmentShader = "uniform vec3 backfaceColor;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            `#include <color_fragment>
            if (!gl_FrontFacing) { diffuseColor.rgb = backfaceColor; }`
          );
        };
      }
      group.add(new THREE3.Mesh(geo, solidMat));
      if (s.wireframe) {
        const wireMat = new THREE3.MeshBasicMaterial({
          color: s.color,
          wireframe: true,
          opacity: s.opacity * 0.8,
          transparent: true
        });
        group.add(new THREE3.Mesh(geo.clone(), wireMat));
      } else if (!hasVertexColors) {
        const subtleWire = new THREE3.MeshBasicMaterial({
          color: 16777215,
          wireframe: true,
          opacity: 0.04,
          transparent: true
        });
        group.add(new THREE3.Mesh(geo.clone(), subtleWire));
      }
    }
    return group;
  }
  // ── Text Sprites ──
  createTextSprite(text, color, labelScale = 1) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSize = 48;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width) + 16;
    const h = fontSize + 16;
    canvas.width = w;
    canvas.height = h;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, w / 2, h / 2);
    const tex = new THREE3.CanvasTexture(canvas);
    tex.minFilter = THREE3.LinearFilter;
    const mat = new THREE3.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE3.Sprite(mat);
    const scale = 5e-3 * labelScale;
    sprite.scale.set(w * scale, h * scale, 1);
    return sprite;
  }
  // ── Get Three.js object for a scene ID ──
  getThreeObject(id) {
    return this.objectMap.get(id);
  }
  /**
   * Project a world-space point into the viewport. Returned `x`, `y` are
   * relative to the canvas's bounding rect (top-left = 0, 0).
   * `visible` is false when the point is behind the camera or outside
   * the normalised device cube — caller should hide the overlay.
   */
  worldToScreen(world) {
    const v = new THREE3.Vector3(world.x, world.y, world.z).project(this.activeCamera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = (v.x * 0.5 + 0.5) * rect.width;
    const y = (-v.y * 0.5 + 0.5) * rect.height;
    const visible = v.z > -1 && v.z < 1;
    return { x, y, visible };
  }
  // ── Picking ──
  /** Enable/disable orbit ROTATION (pan + zoom stay). Off → a strict-2D view. */
  setOrbitRotateEnabled(enabled) {
    if (this.controls) this.controls.enableRotate = enabled;
  }
  /** Enable/disable click-to-pick on the canvas. */
  setPickEnabled(enabled) {
    if (enabled === this.pickEnabled) return;
    this.pickEnabled = enabled;
    const dom = this.renderer.domElement;
    if (enabled) {
      dom.addEventListener("pointerdown", this.onPointerDown);
      dom.addEventListener("pointerup", this.onPointerUp);
    } else {
      dom.removeEventListener("pointerdown", this.onPointerDown);
      dom.removeEventListener("pointerup", this.onPointerUp);
      this.pointerDown = null;
    }
  }
  /** Subscribe to pick events. Returns unsubscribe. `id` is null when the user clicked background. */
  onPick(listener) {
    this.pickListeners.add(listener);
    return () => this.pickListeners.delete(listener);
  }
  /** Returns the handle name under (clientX, clientY) or null. */
  dragHandleHitTest(clientX, clientY) {
    if (this.dragHandles.size === 0) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const meshes = [...this.dragHandles.values()];
    const hits = this.raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? hits[0].object.userData.handleName : null;
  }
  /** Raycast at (clientX, clientY) against a Three.Plane; returns the intersection point. */
  raycastPlane(clientX, clientY, plane) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const hit = new THREE3.Vector3();
    return this.raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  }
  // ── Drag handles API ──
  /** Register the per-drag, per-drag-end, and per-pick callbacks. */
  setDragHandleCallbacks(onMove, onEnd, onPick) {
    this.dragHandleMoveCb = onMove;
    this.dragHandleEndCb = onEnd ?? null;
    this.dragHandlePickCb = onPick ?? null;
  }
  /** Mark the start of a sketch run: clear the "seen this run" set. */
  beginDragHandleSweep() {
    this.dragSeenThisRun.clear();
  }
  /**
   * Create or update a drag handle by stable name. Position is world-space.
   * `constrain` (optional) snaps the dragged position — e.g. to a polyline.
   */
  upsertDragHandle(name, x, y, z, color = "#38d9a9", size = 0.12, constrain, plane) {
    this.dragSeenThisRun.add(name);
    let mesh = this.dragHandles.get(name);
    if (!mesh) {
      const geo = new THREE3.SphereGeometry(size, 16, 12);
      const mat = this._makeMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55
      });
      mesh = new THREE3.Mesh(geo, mat);
      mesh.userData.handleName = name;
      mesh.userData.baseSize = size;
      mesh.userData.baseColor = color;
      mesh.renderOrder = 999;
      mesh.material.depthTest = false;
      this.threeScene.add(mesh);
      this.dragHandles.set(name, mesh);
    } else {
      const mat = mesh.material;
      if (mat.color.getHexString() !== color.replace(/^#/, "").toLowerCase()) {
        mat.color.set(color);
        mat.emissive.set(color);
        mesh.userData.baseColor = color;
      }
      const cur = mesh.geometry.parameters?.radius;
      if (cur !== size) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE3.SphereGeometry(size, 16, 12);
        mesh.userData.baseSize = size;
      }
    }
    if (constrain) this.dragHandleConstraints.set(name, constrain);
    else this.dragHandleConstraints.delete(name);
    if (plane) this.dragHandlePlanes.set(name, plane);
    else this.dragHandlePlanes.delete(name);
    if (this.activeDragHandle !== name) mesh.position.set(x, y, z);
    if (this.selectedDragHandle === name) this.applyHandleStyle(name, true);
    this.requestRender();
  }
  /** Remove any drag handles that weren't visited in this run. */
  endDragHandleSweep() {
    for (const [name, mesh] of this.dragHandles) {
      if (!this.dragSeenThisRun.has(name)) {
        this.threeScene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.dragHandles.delete(name);
        this.dragHandleConstraints.delete(name);
        this.dragHandlePlanes.delete(name);
        if (this.selectedDragHandle === name) this.selectedDragHandle = null;
        this.requestRender();
      }
    }
  }
  /** Currently selected drag handle, or null. */
  getSelectedHandle() {
    return this.selectedDragHandle;
  }
  /** The handle currently being DRAGGED (set on pointer-down, cleared on pointer-up); null when idle. */
  getActiveDragHandle() {
    return this.activeDragHandle;
  }
  /** Programmatically select / deselect a drag handle (visual + callback). */
  setHandleSelected(name) {
    if (this.selectedDragHandle === name) return;
    if (this.selectedDragHandle) this.applyHandleStyle(this.selectedDragHandle, false);
    this.selectedDragHandle = name;
    if (name) this.applyHandleStyle(name, true);
  }
  applyHandleStyle(name, selected) {
    const mesh = this.dragHandles.get(name);
    if (!mesh) return;
    const mat = mesh.material;
    if (selected) {
      mat.emissiveIntensity = 1;
      mesh.scale.setScalar(1.6);
    } else {
      mat.emissiveIntensity = 0.55;
      mesh.scale.setScalar(1);
    }
    this.requestRender();
  }
  /** Raycast at viewport coordinates and return the topmost pickable scene id (or null). */
  pickAt(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const cam = this.activeCamera;
    this.raycaster.params.Line.threshold = cam.isOrthographicCamera ? Math.max(1e-3, (cam.top - cam.bottom) / cam.zoom * 0.012) : 0.08;
    const pickable = [];
    for (const t of this.objectMap.values()) {
      if (t.userData.pickable !== false) pickable.push(t);
    }
    const hits = this.raycaster.intersectObjects(pickable, true);
    for (const h of hits) {
      let cur = h.object;
      while (cur && !cur.userData.geomId) cur = cur.parent;
      if (cur?.userData.geomId) return cur.userData.geomId;
    }
    return null;
  }
  /** Like `pickAt`, but also returns the world-space hit point, and skips hidden objects
   *  (the raycaster alone tests invisible ones too). Used by the markup overlay. */
  hitAt(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const cam = this.activeCamera;
    this.raycaster.params.Line.threshold = cam.isOrthographicCamera ? Math.max(1e-3, (cam.top - cam.bottom) / cam.zoom * 0.012) : 0.08;
    const targets = [];
    for (const t of this.objectMap.values()) if (t.visible) targets.push(t);
    const hits = this.raycaster.intersectObjects(targets, true);
    for (const h of hits) {
      let cur = h.object;
      let shown = true;
      while (cur && !cur.userData.geomId) {
        if (!cur.visible) shown = false;
        cur = cur.parent;
      }
      if (shown && cur?.userData.geomId) {
        return { id: cur.userData.geomId, point: new Vec3(h.point.x, h.point.y, h.point.z) };
      }
    }
    return null;
  }
  /** Where a viewport ray meets the ground plane (z=0 for Z-up, y=0 otherwise), via the active camera. */
  groundAt(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const n = this.isZUp ? new THREE3.Vector3(0, 0, 1) : new THREE3.Vector3(0, 1, 0);
    const hit = new THREE3.Vector3();
    return this.raycaster.ray.intersectPlane(new THREE3.Plane(n, 0), hit) ? new Vec3(hit.x, hit.y, hit.z) : null;
  }
  /** World-space bounds of a scene object as currently rendered, or null if empty/unknown. */
  objectBounds(id) {
    const t = this.objectMap.get(id);
    if (!t) return null;
    const b = new THREE3.Box3().setFromObject(t);
    if (b.isEmpty()) return null;
    return { min: new Vec3(b.min.x, b.min.y, b.min.z), max: new Vec3(b.max.x, b.max.y, b.max.z) };
  }
  /** Is the scene object currently shown (its own style and every parent)? */
  isObjectShown(id) {
    let cur = this.objectMap.get(id) ?? null;
    if (!cur) return false;
    for (; cur; cur = cur.parent) if (!cur.visible) return false;
    return true;
  }
  /** The camera as plain numbers, enough to reproduce the view. */
  cameraState() {
    const c = this.activeCamera;
    const t = this.controls?.target ?? new THREE3.Vector3();
    return {
      projection: this._isOrtho ? "orthographic" : "perspective",
      position: [c.position.x, c.position.y, c.position.z],
      target: [t.x, t.y, t.z],
      up: [c.up.x, c.up.y, c.up.z],
      fov: this.camera.fov
    };
  }
  /** Render now and read the canvas back as a PNG data URL. Must stay synchronous: without
   *  `preserveDrawingBuffer` the buffer is only readable in the same task as the draw. */
  snapshotPng() {
    this.render();
    return this.renderer.domElement.toDataURL("image/png");
  }
  // ── Gizmo (transform controls) ──
  setGizmoMode(mode) {
    this.gizmoMode = mode;
    if (mode === "none") {
      this.detachGizmo();
    } else {
      this.ensureGizmo();
      this.transformControls?.setMode(mode);
      if (this.gizmoAttachedId) this.attachGizmo(this.gizmoAttachedId);
    }
    this.requestRender();
  }
  getGizmoMode() {
    return this.gizmoMode;
  }
  attachGizmo(id) {
    const t = this.objectMap.get(id);
    if (!t) {
      this.detachGizmo();
      return;
    }
    if (this.gizmoMode === "none") {
      this.gizmoAttachedId = id;
      return;
    }
    this.ensureGizmo();
    this.transformControls.attach(t);
    this.gizmoAttachedId = id;
    this.requestRender();
  }
  detachGizmo() {
    this.transformControls?.detach();
    this.gizmoAttachedId = null;
    this.requestRender();
  }
  ensureGizmo() {
    if (this.transformControls) return;
    const tc = new TransformControls(this.activeCamera, this.renderer.domElement);
    tc.setMode(this.gizmoMode === "none" ? "translate" : this.gizmoMode);
    tc.addEventListener("dragging-changed", (e) => {
      const dragging = e.value === true;
      if (this.controls) this.controls.enabled = !dragging;
      if (!dragging && this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    tc.addEventListener("objectChange", () => {
      if (this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    tc.addEventListener("change", () => this.requestRender());
    this.threeScene.add(typeof tc.getHelper === "function" ? tc.getHelper() : tc);
    this.transformControls = tc;
  }
  /** Read the gizmo'd Three.Object3D's transform and write it back into the SceneObject. */
  writeBackTransform(id) {
    const t = this.objectMap.get(id);
    if (!t) return;
    const obj = this.gScene.get(id);
    if (!obj) return;
    const transform = {
      position: new Vec3(t.position.x, t.position.y, t.position.z),
      rotation: new Vec3(t.rotation.x, t.rotation.y, t.rotation.z),
      scale: new Vec3(t.scale.x, t.scale.y, t.scale.z)
    };
    this.gScene.withSuspendedEvents(() => {
      this.gScene.update(id, { transform });
    });
  }
  // ── Selection visual feedback ──
  setSelectionHighlight(id) {
    this.requestRender();
    for (const [, info] of this.selectionMaterials) {
      const m = info.mat;
      m.emissive.copy(info.oldEmissive);
      m.emissiveIntensity = info.oldIntensity;
    }
    this.selectionMaterials.clear();
    if (!id) return;
    const t = this.objectMap.get(id);
    if (!t) return;
    t.traverse((child) => {
      const m = child.material;
      if (m && m.emissive instanceof THREE3.Color) {
        this.selectionMaterials.set(child.uuid, {
          mat: m,
          oldEmissive: m.emissive.clone(),
          oldIntensity: m.emissiveIntensity ?? 0
        });
        m.emissive = new THREE3.Color(3725737);
        m.emissiveIntensity = 0.35;
      }
    });
  }
  // ── Render ──
  /** Draw now, unconditionally. */
  render() {
    this.controls?.update();
    this.renderer.render(this.threeScene, this.activeCamera);
    this._needsRender = false;
  }
  /**
   * Ask for a draw on the next `renderIfNeeded()`. Scene events, the camera API,
   * lights, drag handles, the gizmo, orbit controls and resizes already ask; call
   * it after changing three.js objects directly (e.g. one added with
   * `addExternalObject`).
   */
  requestRender() {
    this._needsRender = true;
  }
  /**
   * Draw only if something changed since the last draw, or while orbit damping
   * is still moving the camera. Returns whether it drew. An idle scene of 10k
   * objects otherwise costs a full draw on every animation frame.
   */
  renderIfNeeded() {
    const moved = this.controls?.update() ?? false;
    const settling = this._settleDamping();
    if (!moved && !settling && !this._needsRender) return false;
    this.renderer.render(this.threeScene, this.activeCamera);
    this._needsRender = false;
    return true;
  }
  /**
   * OrbitControls only reports moves above its EPS (~1e-3 rad), but damping keeps
   * creeping the camera after that, so the last drawn frame would lag the camera
   * slightly. Follow the creep frame by frame instead, and once the remaining
   * glide is under ~0.1 px apply it at once: the camera then rests exactly where
   * it was last drawn. Returns whether the camera moved this frame.
   */
  _settleDamping() {
    const c = this.controls;
    if (!c) return false;
    const pos = c.object.position;
    const step = pos.distanceTo(this._lastCamPos);
    this._lastCamPos.copy(pos);
    if (!(step > 1e-9 * Math.max(pos.distanceTo(c.target), 1))) return false;
    if (c.enableDamping && c.dampingFactor > 0) {
      const f = c.dampingFactor;
      const rest = step * (1 - f) / f / Math.max(pos.distanceTo(c.target), 1e-9);
      if (rest < 1e-4) {
        c.enableDamping = false;
        c.update();
        c.enableDamping = true;
        this._lastCamPos.copy(pos);
      }
    }
    return true;
  }
  startLoop() {
    let running = true;
    const loop = () => {
      if (!running) return;
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(this.rafId);
    };
  }
  // ── Resize ──
  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._syncOrthoCamFrustum();
    this.renderer.setSize(w, h);
    this.render();
  }
  // ── Projection & View ──
  /** Compute the orthographic frustum to match the current perspective camera view distance. */
  _syncOrthoCamFrustum() {
    const target = this.controls?.target ?? new THREE3.Vector3();
    const dist2 = Math.max(this.camera.position.distanceTo(target), 0.1);
    const fovRad = this.camera.fov * Math.PI / 180;
    const halfH = Math.tan(fovRad / 2) * dist2;
    const halfW = halfH * this.camera.aspect;
    this._orthoCam.left = -halfW;
    this._orthoCam.right = halfW;
    this._orthoCam.top = halfH;
    this._orthoCam.bottom = -halfH;
    this._orthoCam.near = -dist2 * 10;
    this._orthoCam.far = dist2 * 10;
    this._orthoCam.updateProjectionMatrix();
  }
  /**
   * Switch between perspective and orthographic projection.
   * Transfers the current camera position/orientation so the view is continuous.
   */
  setProjection(type) {
    const wasOrtho = this._isOrtho;
    this._isOrtho = type === "orthographic";
    if (this._isOrtho && !wasOrtho) {
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this._orthoCam.zoom = 1;
      this._syncOrthoCamFrustum();
    } else if (!this._isOrtho && wasOrtho) {
      this.camera.position.copy(this._orthoCam.position);
      this.camera.quaternion.copy(this._orthoCam.quaternion);
      const zoom = this._orthoCam.zoom;
      if (zoom !== 1 && this.controls) {
        const t = this.controls.target;
        this.camera.position.sub(t).divideScalar(zoom).add(t);
        this._orthoCam.zoom = 1;
      }
    }
    if (this.controls) {
      this.controls.object = this.activeCamera;
      this.controls.update();
    }
    this.requestRender();
  }
  /**
   * Set the camera up vector. Use (0,1,0) for top-down plan views (Z-up scenes),
   * and restore (0,0,1) for side/elevation views.
   */
  setCameraUp(x, y, z) {
    this.camera.up.set(x, y, z);
    this._orthoCam.up.set(x, y, z);
    if (this.controls) this.controls.update();
    this.requestRender();
  }
  /** The WebGL canvas element (for attaching input listeners / overlays). */
  get canvasEl() {
    return this.renderer.domElement;
  }
  /** Set the viewport background color. */
  setBackground(color) {
    this.threeScene.background = new THREE3.Color(color);
    this.config.backgroundColor = color;
    this.requestRender();
  }
  /** Move the camera without changing its target. */
  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
    this.requestRender();
  }
  /** Aim the camera (and orbit-controls target) at a point. */
  lookAt(x, y, z) {
    this.camera.lookAt(x, y, z);
    if (this.controls) {
      this.controls.target.set(x, y, z);
      this.controls.update();
    }
    this.requestRender();
  }
  /**
   * Fit all visible scene objects inside the current view.
   * Preserves the camera direction; only adjusts distance and target.
   */
  fitAll() {
    const box = new THREE3.Box3();
    for (const obj of this.objectMap.values()) {
      if (obj.visible) {
        const b = new THREE3.Box3().setFromObject(obj);
        if (!b.isEmpty()) box.union(b);
      }
    }
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE3.Vector3());
    const sphere = box.getBoundingSphere(new THREE3.Sphere());
    const target = this.controls?.target.clone() ?? center;
    let dir = new THREE3.Vector3().subVectors(this.camera.position, target);
    if (dir.length() < 1e-6) dir.set(1, 1, 1);
    dir.normalize();
    const fovRad = this.camera.fov * Math.PI / 180;
    const dist2 = sphere.radius / Math.tan(fovRad / 2) * 1.3;
    this.camera.position.copy(center).addScaledVector(dir, dist2);
    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
    if (this._isOrtho) {
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this._syncOrthoCamFrustum();
    }
    this.requestRender();
  }
  // ── Raycasting ──
  /** Pick scene objects under a screen coordinate */
  pick(screenX, screenY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE3.Vector2(
      (screenX - rect.left) / rect.width * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE3.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const targets = [...this.objectMap.values()];
    const hits = raycaster.intersectObjects(targets, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj && !obj.userData.geomId) obj = obj.parent;
      if (obj?.userData.geomId) {
        return { id: obj.userData.geomId, point: hit.point };
      }
    }
    return null;
  }
  /** Project a screen position onto a plane */
  screenToPlane(screenX, screenY, plane) {
    const defaultNormal = this.isZUp ? new THREE3.Vector3(0, 0, 1) : new THREE3.Vector3(0, 1, 0);
    const p = plane ?? new THREE3.Plane(defaultNormal, 0);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE3.Vector2(
      (screenX - rect.left) / rect.width * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE3.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const target = new THREE3.Vector3();
    return raycaster.ray.intersectPlane(p, target) ? target : null;
  }
  // ── Cleanup ──
  disposeObject(obj) {
    obj.traverse((child) => {
      const m = child;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material.dispose();
      }
    });
  }
  dispose() {
    this.unsub?.();
    this.clearThree();
    this.threeScene.environment = null;
    this.envMap?.dispose();
    this.envMap = null;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    try {
      this.renderer.forceContextLoss();
    } catch {
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
};

// src/render/SVGRenderer.ts
var DEFAULTS2 = {
  width: 800,
  height: 600,
  viewBox: { minX: -5, minY: -5, width: 10, height: 10 },
  backgroundColor: "#0a0b14",
  showGrid: true,
  gridSpacing: 1,
  gridColor: "#1a1c3a",
  showLabels: true,
  projection: "xz",
  padding: 20,
  pointRadius: 5
};
var SVGRenderer = class {
  constructor(gScene, container, config) {
    this.unsub = null;
    this.gScene = gScene;
    this.config = { ...DEFAULTS2, ...config };
    const c = this.config;
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", String(c.width));
    this.svg.setAttribute("height", String(c.height));
    this.svg.setAttribute("viewBox", `${c.viewBox.minX} ${c.viewBox.minY} ${c.viewBox.width} ${c.viewBox.height}`);
    this.svg.style.background = c.backgroundColor;
    this.svg.style.display = "block";
    container.appendChild(this.svg);
    this.gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.svg.appendChild(this.gridGroup);
    if (c.showGrid) this.drawGrid();
    this.contentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.contentGroup.setAttribute("transform", "scale(1, -1)");
    this.svg.appendChild(this.contentGroup);
    this.unsub = gScene.on(() => this.render());
    this.render();
  }
  project(v) {
    switch (this.config.projection) {
      case "xz":
        return { x: v.x, y: v.z };
      case "xy":
        return { x: v.x, y: v.y };
      case "yz":
        return { x: v.y, y: v.z };
    }
  }
  drawGrid() {
    const { viewBox: vb, gridSpacing: gs, gridColor } = this.config;
    const startX = Math.floor(vb.minX / gs) * gs;
    const startY = Math.floor(vb.minY / gs) * gs;
    const endX = vb.minX + vb.width;
    const endY = vb.minY + vb.height;
    for (let x = startX; x <= endX; x += gs) {
      const line = this.createSVGLine(x, vb.minY, x, vb.minY + vb.height, gridColor, 0.02);
      this.gridGroup.appendChild(line);
    }
    for (let y = startY; y <= endY; y += gs) {
      const line = this.createSVGLine(vb.minX, y, vb.minX + vb.width, y, gridColor, 0.02);
      this.gridGroup.appendChild(line);
    }
    this.gridGroup.appendChild(this.createSVGLine(vb.minX, 0, endX, 0, "#2a3055", 0.04));
    this.gridGroup.appendChild(this.createSVGLine(0, vb.minY, 0, endY, "#2a3055", 0.04));
  }
  render() {
    while (this.contentGroup.firstChild) this.contentGroup.removeChild(this.contentGroup.firstChild);
    for (const obj of this.gScene.all()) {
      if (!obj.style.visible) continue;
      this.renderObject(obj);
    }
  }
  renderObject(obj) {
    const s = obj.style;
    const pr = this.config.pointRadius * this.config.viewBox.width / this.config.width;
    switch (obj.type) {
      case "point": {
        if (!obj.position) break;
        const p = this.project(obj.position);
        const circle = this.createSVGCircle(p.x, p.y, pr, s.color, s.opacity);
        circle.dataset.geomId = obj.id;
        this.contentGroup.appendChild(circle);
        if (s.label && this.config.showLabels) {
          const text = this.createSVGText(p.x + pr * 2, p.y + pr * 2, s.label, s.labelColor ?? s.color);
          text.setAttribute("transform", `scale(1,-1)`);
          text.setAttribute("y", String(-p.y - pr * 2));
          this.contentGroup.appendChild(text);
        }
        break;
      }
      case "segment": {
        if (!obj.start || !obj.end) break;
        const a = this.project(obj.start);
        const b = this.project(obj.end);
        const line = this.createSVGLine(a.x, a.y, b.x, b.y, s.color, 0.03, s.opacity);
        line.dataset.geomId = obj.id;
        this.contentGroup.appendChild(line);
        break;
      }
      case "polygon": {
        if (!obj.vertices || obj.vertices.length < 2) break;
        const pts = obj.vertices.map((v) => this.project(v));
        const poly = this.createSVGPolygon(pts, s.color, s.opacity);
        poly.dataset.geomId = obj.id;
        this.contentGroup.appendChild(poly);
        break;
      }
      case "circle": {
        if (!obj.center || obj.radius == null) break;
        const c = this.project(obj.center);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(c.x));
        circle.setAttribute("cy", String(c.y));
        circle.setAttribute("r", String(obj.radius));
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", s.color);
        circle.setAttribute("stroke-width", "0.03");
        circle.setAttribute("opacity", String(s.opacity));
        circle.dataset.geomId = obj.id;
        this.contentGroup.appendChild(circle);
        break;
      }
      case "mesh": {
        if (!obj.mesh) break;
        for (const face of obj.mesh.faces()) {
          const pts = face.nodes.map((nid) => {
            const node = obj.mesh.node(nid);
            return node ? this.project(node.position) : { x: 0, y: 0 };
          });
          const poly = this.createSVGPolygon(pts, s.color, s.opacity * 0.3);
          this.contentGroup.appendChild(poly);
        }
        for (const edge of obj.mesh.edges()) {
          const a = obj.mesh.node(edge.nodes[0]);
          const b = obj.mesh.node(edge.nodes[1]);
          if (!a || !b) continue;
          const pa = this.project(a.position);
          const pb = this.project(b.position);
          this.contentGroup.appendChild(
            this.createSVGLine(pa.x, pa.y, pb.x, pb.y, s.color, 0.02, s.opacity * 0.5)
          );
        }
        break;
      }
    }
  }
  // ── SVG Helpers ──
  createSVGCircle(cx, cy, r, color, opacity = 1) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", String(cx));
    el.setAttribute("cy", String(cy));
    el.setAttribute("r", String(r));
    el.setAttribute("fill", color);
    el.setAttribute("opacity", String(opacity));
    return el;
  }
  createSVGLine(x1, y1, x2, y2, color, width = 0.02, opacity = 1) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("x1", String(x1));
    el.setAttribute("y1", String(y1));
    el.setAttribute("x2", String(x2));
    el.setAttribute("y2", String(y2));
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", String(width));
    el.setAttribute("opacity", String(opacity));
    return el;
  }
  createSVGPolygon(pts, color, opacity = 0.5) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    el.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
    el.setAttribute("fill", color);
    el.setAttribute("fill-opacity", String(opacity));
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", "0.03");
    return el;
  }
  createSVGText(x, y, text, color) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", String(x));
    el.setAttribute("y", String(y));
    el.setAttribute("fill", color);
    el.setAttribute("font-size", "0.2");
    el.setAttribute("font-family", "monospace");
    el.textContent = text;
    return el;
  }
  /** Update the viewBox (pan/zoom) */
  setViewBox(minX, minY, width, height) {
    this.config.viewBox = { minX, minY, width, height };
    this.svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
    this.render();
  }
  dispose() {
    this.unsub?.();
    this.svg.remove();
  }
};

// src/render/Viewport.ts
import * as THREE5 from "three";

// src/render/NavGizmo.ts
import * as THREE4 from "three";
var AXES = [
  { axis: "x", dir: new THREE4.Vector3(1, 0, 0), colour: "#e0566a" },
  { axis: "y", dir: new THREE4.Vector3(0, 1, 0), colour: "#7fb648" },
  { axis: "z", dir: new THREE4.Vector3(0, 0, 1), colour: "#4b8fd6" }
];
var SVG = "http://www.w3.org/2000/svg";
var NavGizmo = class {
  constructor(host, opts) {
    this.opts = opts;
    this.balls = [];
    this.projectionButton = null;
    this.scratch = new THREE4.Vector3();
    this.inverse = new THREE4.Quaternion();
    /** Set while a drag is under way, so the click that ends one is not read as
     *  a click on whichever ball happened to be under the pointer. */
    this.moved = false;
    /** The window listeners a drag needs, dropped in one go on dispose. */
    this.listeners = new AbortController();
    this.size = opts.size ?? 88;
    this.centre = this.size / 2;
    this.ballR = Math.max(7, this.size * 0.105);
    this.reach = this.centre - this.ballR - 2;
    this.root = document.createElement("div");
    const corner = opts.corner ?? "bottom-right";
    const inset = `${opts.inset ?? 12}px`;
    this.root.style.cssText = `position:absolute;width:${this.size}px;
      ${corner.includes("top") ? "top" : "bottom"}:${inset};
      ${corner.includes("left") ? "left" : "right"}:${inset};
      cursor:grab;touch-action:none;user-select:none;z-index:5;
      display:flex;flex-direction:column;align-items:center;gap:2px`;
    this.svg = document.createElementNS(SVG, "svg");
    this.svg.setAttribute("viewBox", `0 0 ${this.size} ${this.size}`);
    this.svg.setAttribute("width", String(this.size));
    this.svg.setAttribute("height", String(this.size));
    this.root.append(this.svg);
    for (const { axis, dir, colour } of AXES) {
      for (const positive of [true, false]) {
        this.balls.push(this.makeBall(
          positive ? dir.clone() : dir.clone().negate(),
          colour,
          positive,
          positive ? axis.toUpperCase() : `-${axis.toUpperCase()}`
        ));
      }
    }
    if (opts.onProjection && opts.projectionToggle !== false) {
      this.projectionButton = this.makeProjectionToggle();
      this.root.append(this.projectionButton);
    }
    this.bind();
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.append(this.root);
  }
  makeBall(dir, colour, positive, name) {
    const g = document.createElementNS(SVG, "g");
    g.style.cursor = "pointer";
    let line = null;
    if (positive) {
      line = document.createElementNS(SVG, "line");
      line.setAttribute("stroke", colour);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linecap", "round");
      g.append(line);
    }
    const circle = document.createElementNS(SVG, "circle");
    circle.setAttribute("r", String(this.ballR));
    circle.setAttribute("stroke", colour);
    circle.setAttribute("stroke-width", "1.5");
    g.append(circle);
    let label = null;
    if (positive) {
      label = document.createElementNS(SVG, "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.setAttribute("font-size", String(this.ballR * 1.25));
      label.setAttribute("font-family", "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif");
      label.setAttribute("font-weight", "600");
      label.setAttribute("fill", "#fff");
      label.setAttribute("pointer-events", "none");
      label.textContent = name;
      g.append(label);
    }
    g.addEventListener("pointerenter", () => {
      circle.setAttribute("r", String(this.ballR * 1.25));
      circle.setAttribute("stroke-width", "2.5");
    });
    g.addEventListener("pointerleave", () => {
      circle.setAttribute("r", String(this.ballR));
      circle.setAttribute("stroke-width", "1.5");
    });
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this.moved) this.opts.onAxis(dir.clone());
    });
    this.svg.append(g);
    return { el: g, circle, label, line, dir, colour, positive, name };
  }
  /**
   * The projection toggle: a caption that names the convention in force and
   * changes it when clicked, rather than an icon nobody can read at 9 pixels.
   */
  makeProjectionToggle() {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "persp";
    b.title = "Perspective or orthographic. An elevation is the orthographic one.";
    b.style.cssText = `font:600 9px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      letter-spacing:.06em;text-transform:uppercase;padding:3px 6px;border-radius:4px;
      border:1px solid rgba(90,100,110,.35);background:rgba(255,255,255,.82);
      color:#5a646e;cursor:pointer;pointer-events:auto`;
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      this.opts.onProjection?.();
    });
    return b;
  }
  /** Tell the widget which projection is in force, so its caption is true. */
  setProjection(projection) {
    if (!this.projectionButton) return;
    const ortho = projection === "orthographic";
    this.projectionButton.textContent = ortho ? "ortho" : "persp";
    this.projectionButton.style.background = ortho ? "#1b2733" : "rgba(255,255,255,.82)";
    this.projectionButton.style.color = ortho ? "#fff" : "#5a646e";
  }
  bind() {
    let dragging = false, lx = 0, ly = 0;
    this.root.addEventListener("pointerdown", (e) => {
      dragging = true;
      this.moved = false;
      lx = e.clientX;
      ly = e.clientY;
      this.root.style.cursor = "grabbing";
      e.preventDefault();
    });
    globalThis.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.moved = true;
      this.opts.onDrag(dx, dy);
      lx = e.clientX;
      ly = e.clientY;
    }, { signal: this.listeners.signal });
    const end = () => {
      dragging = false;
      this.root.style.cursor = "grab";
    };
    globalThis.addEventListener("pointerup", end, { signal: this.listeners.signal });
    globalThis.addEventListener("pointercancel", end, { signal: this.listeners.signal });
    this.root.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (!this.moved) this.opts.onSnap();
    });
  }
  /**
   * Redraw for the current camera.
   *
   * `contentRotation` carries the root's own turn, so the labels describe the
   * model's axes rather than the scene's.
   */
  update(camera, contentRotation) {
    this.inverse.copy(camera.quaternion).invert();
    const placed = this.balls.map((ball) => {
      const v = this.scratch.copy(ball.dir).applyQuaternion(contentRotation).applyQuaternion(this.inverse);
      return {
        ball,
        x: this.centre + v.x * this.reach,
        y: this.centre - v.y * this.reach,
        depth: v.z
        // the camera looks down -Z
      };
    });
    placed.sort((a, b) => a.depth - b.depth);
    for (const { ball, x, y, depth } of placed) {
      this.svg.append(ball.el);
      ball.circle.setAttribute("cx", String(x));
      ball.circle.setAttribute("cy", String(y));
      const away = depth < 0;
      ball.circle.setAttribute("fill", ball.positive && !away ? ball.colour : "#ffffff");
      ball.el.setAttribute("opacity", away ? "0.55" : "1");
      if (ball.label) {
        ball.label.setAttribute("x", String(x));
        ball.label.setAttribute("y", String(y));
        ball.label.setAttribute("fill", away ? ball.colour : "#ffffff");
      }
      if (ball.line) {
        ball.line.setAttribute("x1", String(this.centre));
        ball.line.setAttribute("y1", String(this.centre));
        ball.line.setAttribute("x2", String(x));
        ball.line.setAttribute("y2", String(y));
      }
    }
  }
  setVisible(on) {
    this.root.style.display = on ? "" : "none";
  }
  dispose() {
    this.listeners.abort();
    this.root.remove();
  }
};

// src/render/Callouts.ts
var SVG2 = "http://www.w3.org/2000/svg";
function labelWidthFor(hostWidth) {
  return Math.round(Math.max(88, Math.min(170, hostWidth * 0.27)));
}
function layoutLabels(anchors, opts) {
  const rowHeight = opts.rowHeight ?? 30;
  const labelWidth = opts.labelWidth ?? labelWidthFor(opts.width);
  const inset = opts.inset ?? 8;
  const capacity = Math.max(0, Math.floor((opts.height - 2 * inset) / rowHeight));
  const placed = [];
  const dropped = [];
  for (const side of ["left", "right"]) {
    const mine = anchors.filter((a) => a.x < opts.width / 2 === (side === "left"));
    const keep = mine.slice(0, capacity).sort((a, b) => a.y - b.y);
    for (const a of mine.slice(capacity)) dropped.push(a.id);
    if (!keep.length) continue;
    const ys = [];
    let previous = -Infinity;
    for (const a of keep) {
      const y = Math.max(a.y, previous + rowHeight, inset);
      ys.push(y);
      previous = y;
    }
    const overshoot = ys[ys.length - 1] + rowHeight - (opts.height - inset);
    if (overshoot > 0) {
      let floor = inset;
      for (let i = 0; i < ys.length; i++) {
        ys[i] = Math.max(ys[i] - overshoot, floor);
        floor = ys[i] + rowHeight;
      }
    }
    keep.forEach((a, i) => placed.push({
      id: a.id,
      side,
      x: side === "left" ? inset : opts.width - inset - labelWidth,
      y: ys[i],
      anchorX: a.x,
      anchorY: a.y
    }));
  }
  return { placed, dropped };
}
var Callouts = class {
  constructor(host, opts = {}) {
    this.opts = opts;
    this.labels = /* @__PURE__ */ new Map();
    this.items = /* @__PURE__ */ new Map();
    this.overflow = null;
    this.labelWidth = opts.labelWidth ?? 150;
    this.root = document.createElement("div");
    this.root.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4";
    this.svg = document.createElementNS(SVG2, "svg");
    this.svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible";
    this.root.append(this.svg);
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.append(this.root);
  }
  /** What there is to say. Placements arrive separately, each frame. */
  setItems(items) {
    this.items = new Map(items.map((i) => [i.id, i]));
    for (const [id, el] of this.labels) {
      if (!this.items.has(id)) {
        el.box.remove();
        el.leader.remove();
        this.labels.delete(id);
      }
    }
  }
  /** Track the host's width, so labels stay a share of it rather than a
   *  constant that only suits one panel size. */
  setLabelWidth(px) {
    if (px === this.labelWidth) return;
    this.labelWidth = px;
    for (const { box } of this.labels.values()) box.style.width = `${px}px`;
  }
  /** The objects a caller must measure to anchor each callout. */
  objectsOf(id) {
    return this.items.get(id)?.objects ?? [];
  }
  get ids() {
    return [...this.items.keys()];
  }
  /**
   * Draw this frame's placements. Anything not placed is hidden, not removed:
   * an element that comes back into view keeps its element rather than
   * flickering a new one in.
   *
   * `unplaced` is how many the margins had no room for, and it is shown. A
   * reader who can see fifteen labels and is not told there were twenty-two
   * has been given a wrong count, quietly, which is the failure this whole
   * project is arranged against.
   */
  update(placements, unplaced = 0) {
    const placed = new Set(placements.map((p) => p.id));
    for (const [id, el] of this.labels) {
      if (!placed.has(id)) {
        el.box.hidden = true;
        el.leader.setAttribute("points", "");
      }
    }
    for (const p of placements) {
      const item = this.items.get(p.id);
      if (!item) continue;
      const el = this.labels.get(p.id) ?? this.make(p.id, item);
      el.box.hidden = false;
      el.box.style.left = `${p.x}px`;
      el.box.style.top = `${p.y}px`;
      const from = p.side === "left" ? p.x + this.labelWidth : p.x;
      const knee = p.side === "left" ? from + 10 : from - 10;
      const mid = p.y + 9;
      el.leader.setAttribute(
        "points",
        `${from},${mid} ${knee},${mid} ${p.anchorX},${p.anchorY}`
      );
    }
    this.showOverflow(unplaced);
  }
  showOverflow(n) {
    if (!n) {
      this.overflow?.remove();
      this.overflow = null;
      return;
    }
    if (!this.overflow) {
      this.overflow = document.createElement("div");
      this.overflow.style.cssText = `position:absolute;left:50%;bottom:6px;transform:translateX(-50%);
        pointer-events:none;padding:2px 7px;border-radius:3px;
        background:rgba(255,255,255,.9);border:1px solid rgba(90,100,110,.25);
        font:500 10px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#79838d`;
      this.root.append(this.overflow);
    }
    this.overflow.textContent = `${n} more not labelled: no room in the margins`;
  }
  make(id, item) {
    const leader = document.createElementNS(SVG2, "polyline");
    leader.setAttribute("fill", "none");
    leader.setAttribute("stroke", "#8a949e");
    leader.setAttribute("stroke-width", "1");
    this.svg.append(leader);
    const box = document.createElement("button");
    box.type = "button";
    const stripe = item.colour ?? "#8a949e";
    box.style.cssText = `position:absolute;pointer-events:auto;width:${this.labelWidth}px;
      box-sizing:border-box;text-align:left;padding:2px 4px 2px 5px;border-radius:2px;
      cursor:pointer;border:1px solid rgba(90,100,110,.28);border-left:3px solid ${stripe};
      background:rgba(255,255,255,.94);
      font:500 10.5px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color:#2b3540;box-shadow:0 1px 2px rgba(20,30,40,.12);display:block;
      overflow:hidden;white-space:nowrap`;
    const text = document.createElement("span");
    text.textContent = item.text;
    text.style.cssText = "display:block;overflow:hidden;text-overflow:ellipsis";
    box.append(text);
    if (item.detail) {
      const d = document.createElement("span");
      d.textContent = item.detail;
      d.style.cssText = `display:block;color:#79838d;font-weight:400;font-size:9.5px;
        overflow:hidden;text-overflow:ellipsis`;
      box.append(d);
    }
    box.title = item.detail ? `${item.text} (${item.detail})` : item.text;
    box.addEventListener("click", (e) => {
      e.stopPropagation();
      this.opts.onPick?.(id);
    });
    box.addEventListener("pointerenter", () => this.opts.onHover?.(id));
    box.addEventListener("pointerleave", () => this.opts.onHover?.(null));
    box.addEventListener("pointerdown", (e) => e.stopPropagation());
    this.root.append(box);
    const el = { box, leader };
    this.labels.set(id, el);
    return el;
  }
  setVisible(on) {
    this.root.style.display = on ? "" : "none";
  }
  dispose() {
    this.root.remove();
  }
};

// src/render/Viewport.ts
var OUTLINE_LIMIT = 1500;
var OUTLINE_CHUNK = 250;
var FALLBACK_SURFACE = 14278115;
var DEFAULT_BACKGROUND = 16119802;
function edgeStyle(mode) {
  if (mode === "hidden-line") return { colour: 1779507, opacity: 1 };
  if (mode === "ghost") return { colour: 15265526, opacity: 0.75 };
  return { colour: 5923950, opacity: 0.55 };
}
function modeBackground(mode, base) {
  return mode === "ghost" ? 1777961 : base;
}
function sectionAppearance(mode) {
  if (mode === "ghost") return { colour: 15265526 };
  return { colour: 1779507 };
}
function groundAppearance(mode) {
  if (mode === "hidden-line") return { visible: false, colour: 16777215, opacity: 0 };
  if (mode === "ghost") return { visible: true, colour: 2436408, opacity: 1 };
  return { visible: true, colour: 15199217, opacity: 1 };
}
function surfaceAppearance(mode, base) {
  if (mode === "ghost") {
    return { colour: base, opacity: 0.11, depthWrite: false, polygonOffset: false };
  }
  if (mode === "hidden-line") {
    return { colour: 16777215, opacity: 1, depthWrite: true, polygonOffset: true };
  }
  return { colour: base, opacity: 1, depthWrite: true, polygonOffset: false };
}
function lightBalance(mode, shadows) {
  const shadowed = shadows && mode !== "ghost";
  return {
    shadowed,
    sun: shadowed ? 2.6 : 1.4,
    sky: shadowed ? 1.1 : 2.2,
    // ShadowMaterial darkens whatever is behind it, so on a white hidden-line
    // page the shadow has to be lighter than it is over a shaded model
    groundOpacity: mode === "hidden-line" ? 0.16 : 0.24
  };
}
var POLE = 1e-3;
function standardOrbit(view) {
  const H = Math.PI / 2;
  switch (view) {
    case "top":
      return { phi: POLE, theta: 0 };
    case "bottom":
      return { phi: Math.PI - POLE, theta: 0 };
    case "front":
      return { phi: H, theta: 0 };
    case "back":
      return { phi: H, theta: Math.PI };
    case "right":
      return { phi: H, theta: H };
    case "left":
      return { phi: H, theta: -H };
    default:
      return { phi: Math.PI / 3, theta: Math.PI / 4 };
  }
}
function orbitFor(direction) {
  const s = new THREE5.Spherical().setFromVector3(
    new THREE5.Vector3(direction.x, direction.y, direction.z).normalize()
  );
  return { phi: Math.min(Math.PI - POLE, Math.max(POLE, s.phi)), theta: s.theta };
}
function shortestTurn(from, to) {
  const TAU = Math.PI * 2;
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return from + delta;
}
function nearestAxis(direction) {
  const v = new THREE5.Vector3(direction.x, direction.y, direction.z).normalize();
  const axis = new THREE5.Vector3();
  const [ax, ay, az] = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
  if (ax >= ay && ax >= az) axis.set(Math.sign(v.x) || 1, 0, 0);
  else if (ay >= az) axis.set(0, Math.sign(v.y) || 1, 0);
  else axis.set(0, 0, Math.sign(v.z) || 1);
  return axis;
}
function easeInOut(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}
function fitRadius(boundingRadius, fovDeg, aspect, margin = 1.25) {
  const vFov = fovDeg * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.01));
  const dist2 = Math.max(boundingRadius, 1e-6) / Math.sin(Math.min(vFov, hFov) / 2);
  return Math.max(1, dist2 * margin);
}
function orthoFrustum(distance, fovDeg, aspect) {
  const h = 2 * distance * Math.tan(fovDeg * Math.PI / 180 / 2);
  const w = h * aspect;
  return { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 };
}
var Viewport = class {
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.scene = new THREE5.Scene();
    this.projectionMode = "perspective";
    this.root = new THREE5.Group();
    this.meshGroup = new THREE5.Group();
    this.outlines = new THREE5.Group();
    /** Bright edges around a chosen set, drawn over everything. See setOutlined. */
    this.highlight = new THREE5.Group();
    /**
     * The poché: one back-faced copy of each mesh while a section is live.
     *
     * Under `root`, sharing geometry and local matrices with the meshes, so it
     * inherits the up-axis rotation exactly as they do.
     */
    this.sectionGroup = new THREE5.Group();
    /** kept so a colour change can rebuild the same cut */
    this.sectionRequest = null;
    this.section = null;
    /** null means "whatever the view mode says", which is the usual case. */
    this.sectionColour = null;
    this.frame = 0;
    this.mode = "shaded";
    this.outlinesBuilt = false;
    this.buildingOutlines = false;
    this.content = {};
    this.shadows = false;
    this.hovered = null;
    this.lastHover = 0;
    /** Where the light comes from, in three.js Y-up. Replaced by a real solar
     *  position through setSun; this is the fallback for a sun below the horizon,
     *  and for a viewport nobody has told a date. */
    this.sunDir = new THREE5.Vector3(1, 1.6, 1.1).normalize();
    this.sunNote = "generic light, no date";
    // simple orbit: enough for looking at a building, and no extra dependency
    this.target = new THREE5.Vector3();
    this.gizmo = null;
    this.callouts = null;
    /** World-space anchor per callout, remeasured only when the content changes:
     *  a bounding box costs a walk of the geometry and nothing in the scene
     *  moves except the camera. */
    this.calloutAnchors = /* @__PURE__ */ new Map();
    /** Which callouts the reader can actually see, recomputed on a timer rather
     *  than per frame, because it costs a raycast each. */
    this.calloutVisible = /* @__PURE__ */ new Set();
    this.calloutCheckedAt = 0;
    /** Last orbit the gizmo was drawn for, so it is redrawn on a move and not on
     *  every one of the frames a still camera also renders. */
    this.gizmoAt = { phi: NaN, theta: NaN };
    /**
     * A camera move in progress. Any input from the reader drops it: a view
     * animation that fights an orbit is worse than no animation at all.
     */
    this.move = null;
    this.tick = () => {
      this.frame = requestAnimationFrame(this.tick);
      this.step();
      const camera = this.camera;
      camera.position.setFromSpherical(this.spherical).add(this.target);
      camera.lookAt(this.target);
      if (this.gizmo && (this.spherical.phi !== this.gizmoAt.phi || this.spherical.theta !== this.gizmoAt.theta)) {
        this.gizmo.update(camera, this.root.quaternion);
        this.gizmoAt = { phi: this.spherical.phi, theta: this.spherical.theta };
      }
      camera.updateMatrixWorld();
      this.drawCallouts();
      if (this.projectionMode === "orthographic") {
        const aspect = (this.host.clientWidth || 1) / (this.host.clientHeight || 1);
        const f = orthoFrustum(this.spherical.radius, this.perspective.fov, aspect);
        if (f.top !== this.orthographic.top) {
          this.orthographic.left = f.left;
          this.orthographic.right = f.right;
          this.orthographic.top = f.top;
          this.orthographic.bottom = f.bottom;
          this.orthographic.updateProjectionMatrix();
        }
      }
      this.renderer.render(this.scene, camera);
    };
    const home = standardOrbit(opts.view ?? "iso");
    this.spherical = new THREE5.Spherical(30, home.phi, home.theta);
    this.scene.background = new THREE5.Color(opts.background ?? DEFAULT_BACKGROUND);
    this.perspective = new THREE5.PerspectiveCamera(45, 1, 0.05, 5e3);
    this.orthographic = new THREE5.OrthographicCamera(-1, 1, 1, -1, 0.01, 5e3);
    this.renderer = new THREE5.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 2));
    const dom = this.renderer.domElement;
    dom.style.display = "block";
    dom.style.width = "100%";
    dom.style.height = "100%";
    host.appendChild(dom);
    this.sky = new THREE5.HemisphereLight(16777215, 8952234, 2.2);
    this.sun = new THREE5.DirectionalLight(16777215, 1.4);
    this.sun.position.set(1, 2, 1.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -5e-4;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE5.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.ground = new THREE5.Mesh(
      new THREE5.PlaneGeometry(1, 1),
      new THREE5.ShadowMaterial({ opacity: 0.22 })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.visible = false;
    this.groundPlane = new THREE5.Mesh(
      new THREE5.PlaneGeometry(1, 1),
      // unlit, so the plane stays an even tone whatever the sun is doing and
      // never competes with the building for attention
      new THREE5.MeshBasicMaterial({ transparent: true })
    );
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.visible = false;
    this.groundPlane.renderOrder = -1;
    this.setUp(opts.up ?? "y");
    this.root.add(this.meshGroup, this.outlines, this.highlight, this.sectionGroup);
    this.scene.add(
      this.sky,
      this.sun,
      this.sun.target,
      this.ground,
      this.groundPlane,
      this.root
    );
    if (opts.gizmo !== false) {
      this.gizmo = new NavGizmo(host, {
        corner: opts.gizmoCorner,
        onAxis: (direction) => this.orbitTo(direction),
        onDrag: (dx, dy) => {
          this.move = null;
          this.orbitBy(dx, dy);
        },
        onSnap: () => this.orbitTo(nearestAxis(this.viewDirection())),
        onProjection: () => this.setProjection(
          this.projectionMode === "perspective" ? "orthographic" : "perspective"
        )
      });
      this.gizmo.setProjection(this.projectionMode);
    }
    this.bind();
    this.resize();
    this.tick();
  }
  /** The camera currently in use. Follows setProjection. */
  get camera() {
    return this.projectionMode === "orthographic" ? this.orthographic : this.perspective;
  }
  setUp(up) {
    this.root.rotation.set(up === "z" ? -Math.PI / 2 : 0, 0, 0);
    this.gizmoAt.phi = NaN;
  }
  bind() {
    const el = this.renderer.domElement;
    let dragging = false, moved = false, lx = 0, ly = 0;
    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = false;
      lx = e.clientX;
      ly = e.clientY;
      this.move = null;
    });
    el.addEventListener("pointerleave", () => {
      if (this.hovered !== null) {
        this.hovered = null;
        this.opts.onHover?.(null);
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) {
        this.hover(e);
        return;
      }
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      this.orbitBy(dx, dy);
      lx = e.clientX;
      ly = e.clientY;
    });
    el.addEventListener("pointerup", (e) => {
      dragging = false;
      if (!moved) this.pick(e);
    });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.move = null;
      this.spherical.radius = Math.max(
        0.05,
        Math.min(4e3, this.spherical.radius * (1 + Math.sign(e.deltaY) * 0.12))
      );
    }, { passive: false });
    new ResizeObserver(() => this.resize()).observe(this.host);
  }
  /** Orbit by a pointer travel in pixels. Shared by the canvas and the gizmo,
   *  so dragging the widget turns the model exactly as dragging the model does. */
  orbitBy(dx, dy) {
    this.spherical.theta -= dx * 5e-3;
    this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi - dy * 5e-3));
  }
  /** The mesh under the pointer, at most every other animation frame.
   *  Reported only on a change, so the host repaints on a crossing and not on
   *  every pixel of travel. */
  hover(e) {
    if (!this.opts.onHover) return;
    const now = performance.now();
    if (now - this.lastHover < 40) return;
    this.lastHover = now;
    const hit = this.meshAt(e.clientX, e.clientY);
    if (hit === this.hovered) return;
    this.hovered = hit;
    this.opts.onHover(hit);
  }
  meshAt(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE5.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE5.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    return ray.intersectObjects(this.meshGroup.children, false)[0]?.object ?? null;
  }
  pick(e) {
    if (!this.opts.onPick) return;
    this.opts.onPick(this.meshAt(e.clientX, e.clientY), e);
  }
  // -- content --------------------------------------------------------------
  /**
   * Show these meshes, replacing whatever was there.
   *
   * The meshes are the app's: build them however the app colours things, and
   * put the unpainted colour on `mesh.userData.baseColour` so shaded mode can
   * return to it.
   */
  setContent(meshes, opts = {}) {
    this.clear();
    this.content = opts;
    if (opts.up) this.setUp(opts.up);
    for (const mesh of meshes) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.meshGroup.add(mesh);
    }
    this.applyMode(this.mode);
    if (this.wantsOutlines().length <= OUTLINE_LIMIT) this.buildOutlines();
    this.root.updateMatrixWorld(true);
    this.fit();
    this.frameSun();
  }
  /** Which meshes the content options ask for an outline around. */
  wantsOutlines() {
    const rule = this.content.outline ?? true;
    if (rule === false) return [];
    const all = this.meshGroup.children;
    return rule === true ? all : all.filter(rule);
  }
  clear() {
    for (const child of this.meshGroup.children) {
      child.geometry.dispose();
      const m = child.material;
      (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
    }
    for (const line of this.outlines.children) {
      line.geometry.dispose();
      line.material.dispose();
    }
    this.clearSection();
    this.meshGroup.clear();
    this.outlines.clear();
    this.setOutlined([]);
    this.calloutAnchors.clear();
    this.calloutVisible.clear();
    this.callouts?.setItems([]);
    this.outlinesBuilt = false;
    this.buildingOutlines = false;
  }
  /** Convenience for the common case: a mesh from raw buffers, which is what
   *  every Tekto generator and every IFC reader hands over. */
  static meshFrom(buffers, material) {
    const g = new THREE5.BufferGeometry();
    g.setAttribute("position", new THREE5.BufferAttribute(buffers.positions, 3));
    if (buffers.normals?.length) {
      g.setAttribute("normal", new THREE5.BufferAttribute(buffers.normals, 3));
    }
    g.setIndex(new THREE5.BufferAttribute(buffers.indices, 1));
    if (!buffers.normals?.length) g.computeVertexNormals();
    return new THREE5.Mesh(g, material);
  }
  // -- how it is drawn ------------------------------------------------------
  get viewMode() {
    return this.mode;
  }
  /**
   * The mode a reader chose. Unlike the internal apply, this will go and build
   * the outlines the mode needs if large content was loaded without them.
   */
  setViewMode(mode, onProgress) {
    this.applyMode(mode);
    if (!this.outlinesBuilt && this.meshGroup.children.length) this.buildOutlines(onProgress);
  }
  get projection() {
    return this.projectionMode;
  }
  /** Perspective or orthographic. Orthographic with hidden line and a face view
   *  is a plan or an elevation; that pairing is the point of having both. */
  setProjection(projection) {
    const changed = projection !== this.projectionMode;
    this.projectionMode = projection;
    this.gizmo?.setProjection(projection);
    this.resize();
    if (changed) this.opts.onProjection?.(projection);
  }
  /**
   * Point the camera at a named face, keeping the distance.
   *
   * Animated by default. A view change that jumps is read as the model having
   * been replaced rather than turned, and the reader loses which face they are
   * now looking at, which is the one thing the change was for. Pass
   * `{ animate: false }` where a jump is wanted (restoring a stored view, or a
   * test that wants the end state now).
   */
  setView(view, opts = {}) {
    const { phi, theta } = standardOrbit(view);
    this.orbit(phi, theta, opts.animate !== false);
  }
  /**
   * Look down a direction given in the content's own axes, so a caller with a
   * Z-up model asks for `(0, 0, 1)` and gets a plan whichever way the viewport
   * has turned the content to face three.js.
   */
  orbitTo(direction, opts = {}) {
    const world = direction.clone().applyQuaternion(this.root.quaternion);
    const { phi, theta } = orbitFor(world);
    this.orbit(phi, theta, opts.animate !== false);
  }
  /** Which way the camera currently lies from the subject, in content axes. */
  viewDirection() {
    return new THREE5.Vector3().setFromSpherical(this.spherical).applyQuaternion(this.root.quaternion.clone().invert()).normalize();
  }
  orbit(phi, theta, animate) {
    if (!animate) {
      this.move = null;
      this.spherical.phi = phi;
      this.spherical.theta = theta;
      return;
    }
    this.animate({ phi, theta: shortestTurn(this.spherical.theta, theta) });
  }
  /** Start a camera move to a partial end state, holding whatever it omits. */
  animate(to, ms = 340) {
    const from = {
      phi: this.spherical.phi,
      theta: this.spherical.theta,
      radius: this.spherical.radius,
      target: this.target.clone()
    };
    this.move = {
      from,
      to: {
        phi: to.phi ?? from.phi,
        theta: to.theta ?? from.theta,
        radius: to.radius ?? from.radius,
        target: to.target?.clone() ?? from.target.clone()
      },
      start: performance.now(),
      ms
    };
  }
  /** Advance a camera move, if one is running. Called once per frame. */
  step() {
    if (!this.move) return;
    const { from, to, start, ms } = this.move;
    const t = easeInOut((performance.now() - start) / ms);
    this.spherical.phi = from.phi + (to.phi - from.phi) * t;
    this.spherical.theta = from.theta + (to.theta - from.theta) * t;
    this.spherical.radius = from.radius + (to.radius - from.radius) * t;
    this.target.lerpVectors(from.target, to.target, t);
    if (t >= 1) this.move = null;
  }
  /**
   * Label these things, in the margins, with leaders to them.
   *
   * What a label says is the host's business, as colour is: this class knows
   * how a drawing is annotated and nothing about what the annotation means.
   * Pass an empty array to clear.
   *
   * Anchors are measured here and once, because a bounding box costs a walk of
   * the geometry and nothing in this scene moves except the camera.
   */
  setCallouts(items) {
    if (!items.length && !this.callouts) return;
    if (!this.callouts) {
      this.callouts = new Callouts(this.host, {
        onPick: (id) => this.opts.onPickCallout?.(id),
        onHover: (id) => this.opts.onHoverCallout?.(id)
      });
    }
    this.callouts.setItems(items);
    this.calloutAnchors.clear();
    this.root.updateMatrixWorld(true);
    const box = new THREE5.Box3();
    for (const item of items) {
      if (!item.objects.length) continue;
      box.makeEmpty();
      for (const o of item.objects) box.expandByObject(o);
      if (!box.isEmpty()) this.calloutAnchors.set(item.id, box.getCenter(new THREE5.Vector3()));
    }
    this.calloutCheckedAt = 0;
  }
  /**
   * Which anchors the reader can actually see.
   *
   * A leader pointing confidently at a wall that is behind three other walls
   * is worse than no leader: on a face view half the building is occluded, and
   * without this every one of those elements would still be labelled and the
   * reader would have no way to tell which. One raycast per callout, on a
   * timer, because the answer only changes when the camera moves.
   */
  checkCalloutVisibility() {
    this.calloutVisible.clear();
    const camera = this.camera;
    const ray = new THREE5.Raycaster();
    const meshes = this.meshGroup.children;
    const direction = new THREE5.Vector3();
    for (const [id, anchor] of this.calloutAnchors) {
      const wanted = this.callouts?.objectsOf(id) ?? [];
      direction.copy(anchor).sub(camera.position);
      const distance = direction.length();
      ray.set(camera.position, direction.normalize());
      ray.far = distance;
      const hit = ray.intersectObjects(meshes, false)[0];
      if (!hit || wanted.includes(hit.object) || hit.distance >= distance - 1e-3) {
        this.calloutVisible.add(id);
      }
    }
  }
  /** Project, cull and lay out this frame's labels. */
  drawCallouts() {
    if (!this.callouts) return;
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    const camera = this.camera;
    const now = performance.now();
    if (now - this.calloutCheckedAt > 180) {
      this.checkCalloutVisibility();
      this.calloutCheckedAt = now;
    }
    const v = new THREE5.Vector3();
    const anchors = [];
    for (const [id, anchor] of this.calloutAnchors) {
      if (!this.calloutVisible.has(id)) continue;
      v.copy(anchor).project(camera);
      if (v.z > 1) continue;
      anchors.push({ id, x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h });
    }
    const labelWidth = labelWidthFor(w);
    this.callouts.setLabelWidth(labelWidth);
    const { placed, dropped } = layoutLabels(anchors, { width: w, height: h, labelWidth });
    this.callouts.update(placed, dropped.length);
  }
  /**
   * Cut the model with a plane, and cap the cut so it reads as solid.
   *
   * `axis` is in the content's own frame, so a Z-up model asks for "z" and
   * gets a horizontal cut whichever way the viewport has turned the content to
   * face three.js. `at` is a fraction of the content's extent along that axis,
   * so 0.5 is halfway through whatever is loaded. Pass null to clear.
   *
   * The capping is the whole point and the reason this is not three lines. A
   * clipping plane on its own leaves the cut hollow: you see the far side from
   * the inside and the building reads as a shell, which is wrong about the one
   * thing a section exists to show. How the cut is filled is explained where
   * it is done, below.
   */
  setSection(section) {
    this.clearSection();
    this.sectionRequest = section;
    this.renderer.localClippingEnabled = section !== null;
    if (!section) {
      this.applyClipping([]);
      return;
    }
    this.root.updateMatrixWorld(true);
    const box = new THREE5.Box3().setFromObject(this.meshGroup);
    if (box.isEmpty()) {
      this.applyClipping([]);
      return;
    }
    const local = new THREE5.Vector3(
      section.axis === "x" ? 1 : 0,
      section.axis === "y" ? 1 : 0,
      section.axis === "z" ? 1 : 0
    );
    const normal = local.clone().applyQuaternion(this.root.quaternion).normalize();
    if (section.flip) normal.negate();
    const lo = new THREE5.Vector3(), hi = new THREE5.Vector3();
    box.getCenter(lo);
    const half = box.getSize(new THREE5.Vector3()).multiplyScalar(0.5);
    const reach = Math.abs(normal.x) * half.x + Math.abs(normal.y) * half.y + Math.abs(normal.z) * half.z;
    const centre = box.getCenter(hi);
    const t = (Math.min(1, Math.max(0, section.at)) - 0.5) * 2 * reach;
    const plane = new THREE5.Plane(
      normal.clone().negate(),
      centre.dot(normal) + t
    );
    this.section = plane;
    this.applyClipping([plane]);
    const poche = new THREE5.MeshBasicMaterial({
      color: this.sectionColour ?? sectionAppearance(this.mode).colour,
      side: THREE5.BackSide,
      clippingPlanes: [plane]
    });
    for (const mesh of this.meshGroup.children) {
      if (!mesh.geometry) continue;
      const inside2 = new THREE5.Mesh(mesh.geometry, poche);
      inside2.matrixAutoUpdate = false;
      inside2.matrix.copy(mesh.matrix);
      inside2.matrixWorldNeedsUpdate = true;
      inside2.renderOrder = -1;
      this.sectionGroup.add(inside2);
    }
  }
  /** Override what the cut face is painted. Pass null to go back to following
   *  the view mode, which is what a section normally wants. */
  setSectionColour(colour) {
    if (colour === this.sectionColour) return;
    this.sectionColour = colour;
    if (this.sectionRequest) this.setSection(this.sectionRequest);
  }
  /** The section in force, or null. */
  get sectionAt() {
    return this.sectionRequest;
  }
  clearSection() {
    for (const child of this.sectionGroup.children) {
      const m = child.material;
      (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      if (child.geometry && !this.meshGroup.children.some((mesh) => mesh.geometry === child.geometry)) child.geometry.dispose();
    }
    this.sectionGroup.clear();
    this.section = null;
  }
  /** Clipping is per material in three, so it has to reach every one the app
   *  handed over as well as the ones this class makes. */
  applyClipping(planes) {
    const set = (m) => {
      for (const one of Array.isArray(m) ? m : [m]) {
        one.clippingPlanes = planes.length ? planes : null;
        one.needsUpdate = true;
      }
    };
    for (const mesh of this.meshGroup.children) set(mesh.material);
    for (const line of this.outlines.children) set(line.material);
    for (const line of this.highlight.children) set(line.material);
  }
  /**
   * Draw a bright outline around these meshes, on top of everything.
   *
   * The way to mark a set of elements without spending their fill colour,
   * which matters once an app paints by something (a product, a state, an
   * evidence grade) and still needs to say "these ones". Dimming everything
   * else says the same thing by destroying the rest of the picture.
   *
   * Drawn with `depthTest` off, so an outlined element reads through the
   * fabric in front of it. That is not a compromise: the usual reason to
   * highlight a set is that some of it is behind something, and an outline you
   * can only see when nothing is in the way answers the easy half of the
   * question.
   *
   * One pixel wide. `LineBasicMaterial.linewidth` is ignored by every WebGL
   * implementation worth naming, and this machine reports an aliased line
   * width range of exactly [1, 1]. Thickness would mean the instanced-quad
   * line from three's examples, which this library already imports elsewhere
   * for its controls, so it is available; it is not used here because drawing
   * over the top is what makes the highlight legible, and a saturated line at
   * one pixel over the fabric reads better than a thick one behind it. If a
   * host wants weight as well, that is the change to make.
   */
  setOutlined(meshes, colour = 2063072) {
    for (const line of this.highlight.children) {
      line.geometry.dispose();
      line.material.dispose();
    }
    this.highlight.clear();
    if (!meshes.length) return;
    const material = new THREE5.LineBasicMaterial({
      color: colour,
      depthTest: false,
      transparent: true,
      opacity: 0.95
    });
    const angle = this.content.creaseAngle ?? 30;
    for (const object of meshes) {
      const mesh = object;
      if (!mesh.geometry) continue;
      const edges = new THREE5.EdgesGeometry(mesh.geometry, angle);
      const line = new THREE5.LineSegments(edges, material);
      line.applyMatrix4(mesh.matrix);
      line.renderOrder = 999;
      this.highlight.add(line);
    }
  }
  /** Repaint every mesh. Call after changing whatever `appearanceOf` reads. */
  repaint() {
    for (const child of this.meshGroup.children) this.paint(child);
  }
  /** Apply the current mode to one mesh. The app's hook has the first word. */
  paint(mesh) {
    const material = mesh.material;
    const base = mesh.userData.baseColour ?? FALLBACK_SURFACE;
    const look = {
      ...surfaceAppearance(this.mode, base),
      ...this.opts.appearanceOf?.(mesh, this.mode) ?? {}
    };
    material.color.setHex(look.colour);
    if (material.emissive) {
      const flat = this.mode === "hidden-line" || this.mode === "ghost";
      material.emissive.setHex(flat ? look.colour : 0);
      material.emissiveIntensity = this.mode === "ghost" ? 0.8 : 1;
    }
    material.opacity = look.opacity;
    material.transparent = look.opacity < 1;
    material.depthWrite = look.depthWrite;
    material.polygonOffset = look.polygonOffset;
    if (look.polygonOffset) {
      material.polygonOffsetFactor = 1;
      material.polygonOffsetUnits = 1;
    }
    material.needsUpdate = true;
  }
  applyMode(mode) {
    const changed = mode !== this.mode;
    this.mode = mode;
    this.scene.background.setHex(
      modeBackground(mode, this.opts.background ?? DEFAULT_BACKGROUND)
    );
    const balance = lightBalance(mode, this.shadows);
    const floor = groundAppearance(mode);
    this.groundPlane.visible = floor.visible && (this.opts.ground ?? true);
    const gm = this.groundPlane.material;
    gm.color.setHex(floor.colour);
    gm.opacity = floor.opacity;
    gm.transparent = floor.opacity < 1;
    gm.needsUpdate = true;
    if (changed && this.sectionRequest && this.sectionColour === null) {
      queueMicrotask(() => {
        if (this.sectionRequest) this.setSection(this.sectionRequest);
      });
    }
    this.sun.castShadow = balance.shadowed;
    this.ground.visible = balance.shadowed;
    this.sun.intensity = balance.sun;
    this.sky.intensity = balance.sky;
    this.ground.material.opacity = balance.groundOpacity;
    this.renderer.shadowMap.needsUpdate = true;
    this.repaint();
    const style = edgeStyle(mode);
    for (const line of this.outlines.children) {
      const lm = line.material;
      lm.color.setHex(style.colour);
      lm.opacity = style.opacity;
      lm.transparent = style.opacity < 1;
      lm.needsUpdate = true;
    }
  }
  /**
   * Creases for the content, a chunk per frame.
   *
   * One LineSegments per chunk rather than per mesh: a few thousand line
   * objects is a few thousand draw calls, and merging costs nothing here
   * because the outlines are styled as one anyway.
   */
  buildOutlines(onProgress) {
    if (this.buildingOutlines) return;
    const meshes = this.wantsOutlines();
    if (!meshes.length) {
      this.outlinesBuilt = true;
      return;
    }
    this.buildingOutlines = true;
    const angle = this.content.creaseAngle ?? 30;
    const style = edgeStyle(this.mode);
    let i = 0;
    const step = () => {
      const positions = [];
      const end = Math.min(i + OUTLINE_CHUNK, meshes.length);
      for (; i < end; i++) {
        const edges = new THREE5.EdgesGeometry(meshes[i].geometry, angle);
        const p = edges.getAttribute("position").array;
        const m = meshes[i].matrix;
        const v = new THREE5.Vector3();
        for (let k = 0; k < p.length; k += 3) {
          v.set(p[k], p[k + 1], p[k + 2]).applyMatrix4(m);
          positions.push(v.x, v.y, v.z);
        }
        edges.dispose();
      }
      if (positions.length) {
        const g = new THREE5.BufferGeometry();
        g.setAttribute("position", new THREE5.Float32BufferAttribute(positions, 3));
        this.outlines.add(new THREE5.LineSegments(g, new THREE5.LineBasicMaterial({
          color: style.colour,
          opacity: style.opacity,
          transparent: style.opacity < 1
        })));
      }
      if (i < meshes.length) {
        onProgress?.(`Drawing edges: ${i} of ${meshes.length} ...`);
        requestAnimationFrame(step);
      } else {
        this.outlinesBuilt = true;
        this.buildingOutlines = false;
        this.applyMode(this.mode);
        onProgress?.(null);
      }
    };
    requestAnimationFrame(step);
  }
  // -- the sun --------------------------------------------------------------
  get shadowsOn() {
    return this.shadows;
  }
  /** Sun shadows on or off. Off by default: they are a presentation choice, and
   *  in hidden line they are a departure from the drawing convention. */
  setShadows(on) {
    this.shadows = on;
    this.frameSun();
    this.applyMode(this.mode);
  }
  get sunDescription() {
    return this.sunNote;
  }
  /**
   * Put a real sun in the sky, for a place and an instant.
   *
   * Two honest limits, both reported through `sunDescription`: the content's
   * +Y (or +Z, for Z-up content) is assumed to be north, because a viewport
   * cannot know a project's true north; and a sun below the horizon falls back
   * to a generic light rather than showing a black building.
   */
  setSun(date, latitude, longitude, place = "") {
    const sun = SunPosition.compute({ date, latitude, longitude });
    const when = date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
    if (!sun.isDaytime) {
      this.sunDir.set(1, 1.6, 1.1).normalize();
      this.sunNote = `sun is below the horizon at ${when}, showing a generic light`;
    } else {
      this.sunDir.set(sun.direction.x, sun.direction.z, -sun.direction.y).normalize();
      const alt = Math.round(sun.altitude * 180 / Math.PI);
      const azi = Math.round(sun.azimuth * 180 / Math.PI);
      this.sunNote = `${place || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`}, ${when}: altitude ${alt} degrees, azimuth ${azi} from north. The model's north is taken as its own up-plane +Y.`;
    }
    this.frameSun();
  }
  /** Sun and ground, framed to whatever is in the scene. Cheap, and only run
   *  when the contents or the light change. */
  frameSun() {
    this.root.updateMatrixWorld(true);
    const box = new THREE5.Box3().setFromObject(this.meshGroup);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE5.Sphere());
    const r = Math.max(sphere.radius, 0.5);
    this.sun.position.copy(sphere.center).addScaledVector(this.sunDir, r * 3);
    this.sun.target.position.copy(sphere.center);
    this.sun.target.updateMatrixWorld();
    this.sun.shadow.normalBias = r * 2e-3;
    const cam = this.sun.shadow.camera;
    cam.left = -r * 1.2;
    cam.right = r * 1.2;
    cam.top = r * 1.2;
    cam.bottom = -r * 1.2;
    cam.near = r * 0.5;
    cam.far = r * 6;
    cam.updateProjectionMatrix();
    this.ground.position.set(sphere.center.x, box.min.y - r * 1e-3, sphere.center.z);
    this.ground.scale.set(r * 6, r * 6, 1);
    this.groundPlane.position.set(sphere.center.x, box.min.y - r * 4e-3, sphere.center.z);
    this.groundPlane.scale.set(r * 7, r * 7, 1);
    this.renderer.shadowMap.needsUpdate = true;
  }
  // -- framing --------------------------------------------------------------
  /** Frame the contents: centre on the bounding box and pull back far enough
   *  that it fits the tighter of the two field-of-view axes. */
  fit(margin = 1.25) {
    this.root.updateMatrixWorld(true);
    const box = new THREE5.Box3().setFromObject(this.root);
    if (box.isEmpty()) return;
    this.move = null;
    box.getCenter(this.target);
    this.spherical.radius = this.radiusFor(box, margin);
    this.resize();
  }
  /**
   * Frame part of the content: a selection, a storey, one component.
   *
   * Animated, unlike `fit`, because the reader is going somewhere within a
   * model they can already see and needs to keep hold of where. The margin is
   * looser than `fit`'s for the same reason: a part framed edge to edge loses
   * the surroundings that say which part it is.
   */
  fitTo(objects, opts = {}) {
    if (!objects.length) return;
    this.root.updateMatrixWorld(true);
    const box = new THREE5.Box3();
    for (const o of objects) box.expandByObject(o);
    if (box.isEmpty()) return;
    const target = box.getCenter(new THREE5.Vector3());
    const radius = this.radiusFor(box, opts.margin ?? 1.8);
    if (opts.animate === false) {
      this.move = null;
      this.target.copy(target);
      this.spherical.radius = radius;
      this.resize();
      return;
    }
    this.animate({ radius, target });
  }
  radiusFor(box, margin) {
    const size = box.getSize(new THREE5.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
    return fitRadius(radius, this.perspective.fov, this.perspective.aspect, margin);
  }
  resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    this.perspective.aspect = aspect;
    this.perspective.updateProjectionMatrix();
    const f = orthoFrustum(this.spherical.radius, this.perspective.fov, aspect);
    this.orthographic.left = f.left;
    this.orthographic.right = f.right;
    this.orthographic.top = f.top;
    this.orthographic.bottom = f.bottom;
    this.orthographic.near = 0.01;
    this.orthographic.far = Math.max(100, this.spherical.radius * 10);
    this.orthographic.updateProjectionMatrix();
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.gizmo?.dispose();
    this.callouts?.dispose();
    this.setOutlined([]);
    this.clearSection();
    this.clear();
    for (const plane of [this.ground, this.groundPlane]) {
      plane.geometry.dispose();
      plane.material.dispose();
    }
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
};

// src/gui/LayerPanel.ts
function computeEffectiveVisibility(nodes, value) {
  const result = {};
  const walk = (node, parentEffective) => {
    const own = value[node.id]?.visible ?? (node.defaultVisible ?? true);
    const effective = parentEffective && own;
    result[node.id] = effective;
    node.children?.forEach((child) => walk(child, effective));
  };
  nodes.forEach((node) => walk(node, true));
  return result;
}
var LayerPanel = class {
  constructor(opts) {
    this._nodes = [];
    this._value = {};
    this._collapsed = /* @__PURE__ */ new Set();
    this._isDark = opts.isDark ?? true;
    this._onChange = opts.onChange;
    this.el = document.createElement("div");
    this.el.style.cssText = "overflow-y:auto;max-height:300px;";
    this.update(opts.nodes, opts.value);
  }
  /**
   * Re-render with new nodes/value.
   * Scroll position and collapsed state are preserved.
   */
  update(nodes, value) {
    this._nodes = nodes;
    this._value = value;
    const scroll = this.el.scrollTop;
    this.el.innerHTML = "";
    for (const node of this._nodes) this._renderNode(node, 0, true);
    this.el.scrollTop = scroll;
  }
  // ── Private helpers ──
  _stateOf(node) {
    return this._value[node.id] ?? {
      visible: node.defaultVisible ?? true,
      color: node.defaultColor ?? "#888888"
    };
  }
  _rebuild() {
    const scroll = this.el.scrollTop;
    this.el.innerHTML = "";
    for (const node of this._nodes) this._renderNode(node, 0, true);
    this.el.scrollTop = scroll;
  }
  /**
   * @param ancestorVisible — whether all ancestors are currently visible.
   *   Used only for visual dimming; does NOT affect stored state.
   */
  _renderNode(node, depth, ancestorVisible) {
    const state = this._stateOf(node);
    const hasChildren = !!node.children?.length;
    const isCollapsed = this._collapsed.has(node.id);
    const effectiveVisible = ancestorVisible && state.visible;
    const d = this._isDark;
    const labelColor = d ? effectiveVisible ? "#b8bdd4" : "#3a3f5a" : effectiveVisible ? "#2a2d3a" : "#b0b4c0";
    const arrowColor = d ? "#3a3f5a" : "#b0b4c0";
    const hoverBg = d ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:5px;
      padding:3px 6px 3px ${6 + depth * 14}px;
      border-radius:3px;cursor:default;transition:background .1s;min-height:22px;
    `;
    row.addEventListener("mouseenter", () => {
      row.style.background = hoverBg;
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "";
    });
    const arrow = document.createElement("span");
    arrow.style.cssText = `width:10px;font-size:7px;flex-shrink:0;line-height:1;color:${arrowColor};user-select:none;`;
    if (hasChildren) {
      arrow.textContent = isCollapsed ? "\u25B6" : "\u25BC";
      arrow.style.cursor = "pointer";
      arrow.addEventListener("click", (e) => {
        e.stopPropagation();
        this._collapsed.has(node.id) ? this._collapsed.delete(node.id) : this._collapsed.add(node.id);
        this._rebuild();
      });
    }
    row.appendChild(arrow);
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = state.visible;
    cb.style.cssText = `cursor:pointer;width:11px;height:11px;flex-shrink:0;accent-color:${d ? "#ffffff" : "#16182c"};margin:0;opacity:${ancestorVisible ? "1" : "0.35"};`;
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      this._onChange({ [node.id]: { ...state, visible: cb.checked } });
    });
    row.appendChild(cb);
    const lbl = document.createElement("span");
    lbl.textContent = node.label;
    lbl.style.cssText = `
      flex:1;font-size:11px;color:${labelColor};
      user-select:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    `;
    row.appendChild(lbl);
    const cp = document.createElement("input");
    cp.type = "color";
    cp.value = state.color;
    cp.title = "Layer color";
    cp.style.cssText = `
      width:16px;height:13px;border:1px solid ${d ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.15)"};
      border-radius:2px;padding:0;cursor:pointer;flex-shrink:0;outline:none;background:none;
    `;
    cp.addEventListener("change", (e) => {
      e.stopPropagation();
      this._onChange({ [node.id]: { ...state, color: cp.value } });
    });
    row.appendChild(cp);
    this.el.appendChild(row);
    if (hasChildren && !isCollapsed) {
      for (const child of node.children) {
        this._renderNode(child, depth + 1, effectiveVisible);
      }
    }
  }
};

// src/sketch/Markup.ts
var INK = "#ff00d4";
var MarkupOverlay = class {
  constructor(host) {
    this.marks = [];
    this.drawing = null;
    this.active = false;
    this.onKey = (e) => this.handleKey(e);
    this.host = host;
    const vp = host.viewport;
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:20;cursor:crosshair;touch-action:none;display:none;";
    vp.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.chips = document.createElement("div");
    this.chips.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:21;display:none;";
    vp.appendChild(this.chips);
    const btnCss = "font:12px system-ui,sans-serif;padding:5px 10px;border-radius:5px;border:1px solid #d0d0d6;background:#fff;color:#222;cursor:pointer;";
    this.toggleBtn = document.createElement("button");
    this.toggleBtn.textContent = "\u270E Markup";
    this.toggleBtn.title = "Draw on the view to give instructions (saved as screenshot + JSON)";
    this.toggleBtn.style.cssText = `position:absolute;top:10px;right:10px;z-index:22;${btnCss}`;
    this.toggleBtn.addEventListener("click", () => this.setActive(!this.active));
    vp.appendChild(this.toggleBtn);
    this.bar = document.createElement("div");
    this.bar.style.cssText = "position:absolute;top:10px;right:100px;z-index:22;display:none;gap:6px;align-items:center;background:#fff;border:1px solid #d0d0d6;border-radius:7px;padding:5px;box-shadow:0 2px 8px rgba(0,0,0,.12);";
    this.noteBox = document.createElement("input");
    this.noteBox.placeholder = "Instruction for the whole view\u2026";
    this.noteBox.style.cssText = "font:12px system-ui,sans-serif;width:260px;padding:5px 8px;border:1px solid #d0d0d6;border-radius:5px;";
    this.noteBox.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") void this.save();
    });
    const mk = (label, title, fn) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.title = title;
      b.style.cssText = btnCss;
      b.addEventListener("click", fn);
      return b;
    };
    this.status = document.createElement("span");
    this.status.style.cssText = "font:11px system-ui,sans-serif;color:#666;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    this.bar.append(
      this.noteBox,
      mk("Undo", "Remove last mark (\u2318Z)", () => this.undo()),
      mk("Clear", "Remove all marks", () => {
        this.marks = [];
        this.redraw();
      }),
      mk("Save", "Save view.png + markup.json (\u2318S)", () => void this.save()),
      this.status
    );
    vp.appendChild(this.bar);
    this.canvas.addEventListener("pointerdown", (e) => this.down(e));
    this.canvas.addEventListener("pointermove", (e) => this.move(e));
    this.canvas.addEventListener("pointerup", (e) => this.up(e));
  }
  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    this.host.setTracking(on);
    this.canvas.style.display = on ? "block" : "none";
    this.chips.style.display = on ? "block" : "none";
    this.bar.style.display = on ? "flex" : "none";
    this.toggleBtn.textContent = on ? "Done" : "\u270E Markup";
    if (on) {
      this.resize();
      window.addEventListener("keydown", this.onKey, true);
      this.setStatus("Drag to mark \xB7 Shift adds to the last mark");
    } else {
      window.removeEventListener("keydown", this.onKey, true);
      this.marks = [];
      this.redraw();
    }
  }
  dispose() {
    window.removeEventListener("keydown", this.onKey, true);
    this.canvas.remove();
    this.chips.remove();
    this.bar.remove();
    this.toggleBtn.remove();
  }
  // ── Input ──
  local(e) {
    const r = this.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  down(e) {
    if (e.button !== 0) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.drawing = [this.local(e)];
    if (!(e.shiftKey && this.marks.length)) {
      this.marks.push({ n: this.marks.length + 1, strokes: [], note: "" });
    }
    this.marks[this.marks.length - 1].strokes.push(this.drawing);
  }
  move(e) {
    if (!this.drawing) return;
    const p = this.local(e);
    const q = this.drawing[this.drawing.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2) {
      this.drawing.push(p);
      this.redraw();
    }
  }
  up(_e) {
    if (!this.drawing) return;
    this.drawing = null;
    const mark = this.marks[this.marks.length - 1];
    mark.resolved = this.resolve(mark);
    this.redraw();
    if (mark.strokes.length === 1) this.askNote(mark);
  }
  handleKey(e) {
    if (e.target instanceof HTMLInputElement) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      void this.save();
    } else if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.stopPropagation();
      this.undo();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      this.setActive(false);
    }
  }
  undo() {
    this.marks.pop();
    this.redraw();
  }
  /** A small input at the mark's badge; Enter keeps it, Escape leaves the mark without a note. */
  askNote(mark) {
    const [x, y] = badgeAt(mark);
    const inp = document.createElement("input");
    inp.placeholder = `note for ${mark.n}\u2026`;
    inp.style.cssText = `position:absolute;left:${x + 16}px;top:${y - 12}px;z-index:23;font:12px system-ui,sans-serif;width:200px;padding:4px 7px;border:2px solid ${INK};border-radius:5px;background:#fff;`;
    let closed = false;
    const done = () => {
      if (closed) return;
      closed = true;
      mark.note = inp.value.trim();
      inp.remove();
      this.redraw();
    };
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") done();
      if (e.key === "Escape") {
        inp.value = mark.note;
        done();
      }
    });
    inp.addEventListener("blur", done);
    this.host.viewport.appendChild(inp);
    setTimeout(() => inp.focus(), 0);
  }
  // ── Resolving a mark against the scene ──
  resolve(mark) {
    const r = this.canvas.getBoundingClientRect();
    const ray = (p) => this.host.hitAt(r.left + p[0], r.top + p[1]);
    const ground = (p) => this.host.groundAt(r.left + p[0], r.top + p[1]);
    const kind = classify(mark.strokes);
    const counts = /* @__PURE__ */ new Map();
    const points = [];
    let samples = 0;
    const hit = (p) => {
      samples++;
      const h = ray(p);
      if (!h) return null;
      counts.set(h.id, (counts.get(h.id) ?? 0) + 1);
      points.push(h.point);
      return h;
    };
    const world = {};
    const all = mark.strokes.flat();
    if (kind === "loop") {
      const ring = mark.strokes[0];
      for (const p of gridInside(ring, 150)) hit(p);
      if (points.length) world.centroid = round3(mean(points));
      if (points.length) world.bounds = bounds(points).map(round3);
    } else if (kind === "point") {
      const h = hit(all[0]);
      const g = h?.point ?? ground(all[0]);
      if (g) world.at = round3(g);
    } else {
      for (const s of mark.strokes) for (const p of resample(s, 8, 80)) hit(p);
      const s0 = mark.strokes[0];
      const a = ray(s0[0])?.point ?? ground(s0[0]);
      const b = ray(s0[s0.length - 1])?.point ?? ground(s0[s0.length - 1]);
      if (a) world.from = round3(a);
      if (b) world.to = round3(b);
      if (a && b) world.length = [+Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z).toFixed(4)];
    }
    const hits = [...counts.entries()].sort((p, q) => q[1] - p[1]).filter(([, c], i) => i < 12 && (c >= 2 || samples <= 3 || i === 0)).map(([id, c]) => ({ ...this.host.describe(id) ?? { id, type: "?" }, share: +(c / Math.max(1, samples)).toFixed(3) }));
    return { kind, hits, world, summary: summarize(kind, hits) };
  }
  // ── Drawing ──
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.host.viewport.clientWidth, h = this.host.viewport.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.redraw();
  }
  redraw() {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    drawMarks(ctx, this.marks);
    this.chips.innerHTML = "";
    for (const m of this.marks) {
      if (!m.resolved) continue;
      const [x, y] = badgeAt(m);
      const chip = document.createElement("div");
      chip.textContent = (m.note ? `${m.note} \u2014 ` : "") + m.resolved.summary;
      chip.style.cssText = `position:absolute;left:${x + 16}px;top:${y + 14}px;font:11px system-ui,sans-serif;color:#222;background:rgba(255,255,255,.9);border:1px solid #ddd;border-radius:4px;padding:2px 6px;max-width:320px;`;
      this.chips.appendChild(chip);
    }
  }
  setStatus(s) {
    this.status.textContent = s;
    this.status.title = s;
  }
  // ── Capture ──
  async save() {
    this.setStatus("Saving\u2026");
    try {
      const b = await this.capture({ note: this.noteBox.value.trim() });
      this.setStatus(b.dir ? `Saved \u2192 ${b.dir}` : "Downloaded (no dev-server plugin)");
    } catch (e) {
      this.setStatus(`Save failed: ${e}`);
    }
  }
  /** Build the bundle for the current view and marks; save it unless `save: false`. */
  async capture(opts = {}) {
    const wasActive = this.active;
    if (!wasActive) this.host.setTracking(true);
    try {
      const cleanPng = this.host.snapshotPng();
      const note = opts.note ?? "";
      const viewPng = await this.composite(cleanPng, note);
      const vp = this.host.viewport;
      const markup = {
        format: "tekto-markup/1",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        sketch: { title: this.host.title, url: location.href },
        instruction: note,
        viewport: { width: vp.clientWidth, height: vp.clientHeight, dpr: window.devicePixelRatio || 1 },
        ...this.host.context(),
        marks: this.marks.map((m) => ({
          n: m.n,
          note: m.note,
          kind: m.resolved?.kind,
          summary: m.resolved?.summary,
          hits: m.resolved?.hits ?? [],
          world: m.resolved?.world ?? {},
          screen: {
            bbox: bbox2(m.strokes.flat()),
            strokes: m.strokes.map((s) => simplify(s, 24).map((p) => [Math.round(p[0]), Math.round(p[1])]))
          }
        })),
        files: { view: "view.png", clean: "clean.png" }
      };
      const bundle = { markup, viewPng, cleanPng };
      if (opts.save !== false) bundle.dir = await saveBundle(bundle, opts.label ?? slug(this.host.title));
      return bundle;
    } finally {
      if (!wasActive) this.host.setTracking(false);
    }
  }
  /** The 3D view with the marks and a legend burnt in, at device resolution. */
  async composite(cleanPng, note) {
    const img = new Image();
    img.src = cleanPng;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const s = img.width / Math.max(1, this.host.viewport.clientWidth);
    g.setTransform(s, 0, 0, s, 0, 0);
    drawMarks(g, this.marks);
    const lines = [
      ...note ? [note] : [],
      ...this.marks.filter((m) => m.note).map((m) => `${m.n}  ${m.note}`)
    ];
    if (lines.length) {
      g.font = "13px system-ui,sans-serif";
      const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 20;
      const h = lines.length * 18 + 12;
      const y0 = img.height / s - h - 10;
      g.fillStyle = "rgba(255,255,255,.92)";
      g.fillRect(10, y0, w, h);
      g.fillStyle = "#111";
      lines.forEach((l, i) => g.fillText(l, 20, y0 + 20 + i * 18));
    }
    return c.toDataURL("image/png");
  }
};
function drawMarks(g, marks) {
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const m of marks) {
    for (const [w, col] of [[8, "rgba(255,255,255,.9)"], [3.5, INK]]) {
      g.strokeStyle = col;
      g.lineWidth = w;
      for (const s of m.strokes) {
        if (s.length === 1) {
          g.beginPath();
          g.arc(s[0][0], s[0][1], w, 0, Math.PI * 2);
          g.fillStyle = col;
          g.fill();
          continue;
        }
        g.beginPath();
        s.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        g.stroke();
      }
    }
    const [x, y] = badgeAt(m);
    g.beginPath();
    g.arc(x, y, 12, 0, Math.PI * 2);
    g.fillStyle = INK;
    g.fill();
    g.lineWidth = 2.5;
    g.strokeStyle = "#fff";
    g.stroke();
    g.fillStyle = "#fff";
    g.font = "bold 14px system-ui,sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(m.n), x, y + 0.5);
    g.textAlign = "start";
    g.textBaseline = "alphabetic";
  }
}
function badgeAt(m) {
  const p = m.strokes[0]?.[0] ?? [0, 0];
  return [Math.max(14, p[0] - 16), Math.max(14, p[1] - 16)];
}
function classify(strokes) {
  const all = strokes.flat();
  const len = strokes.reduce((a, s2) => a + pathLength(s2), 0);
  if (len < 8) return "point";
  if (strokes.length === 2 && strokes.every(isStraight) && segmentsCross(strokes[0], strokes[1])) return "cross";
  const s = strokes[0];
  const L = pathLength(s);
  const gap = dist(s[0], s[s.length - 1]);
  if (strokes.length === 1 && L > 40 && gap < 0.25 * L) return "loop";
  if (strokes.length === 1 && isStraight(s)) return "line";
  return all.length ? "stroke" : "point";
}
function isStraight(s) {
  return pathLength(s) > 0 && dist(s[0], s[s.length - 1]) / pathLength(s) > 0.9;
}
function segmentsCross(a, b) {
  const [p, q, r, s] = [a[0], a[a.length - 1], b[0], b[b.length - 1]];
  const o = (u, v, w) => Math.sign((v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]));
  return o(p, q, r) !== o(p, q, s) && o(r, s, p) !== o(r, s, q);
}
function summarize(kind, hits) {
  const verb = { point: "at", loop: "around", line: "along", cross: "crossing out", stroke: "over" }[kind];
  if (!hits.length) return `${kind} ${verb} empty space`;
  const names = /* @__PURE__ */ new Map();
  for (const h of hits) {
    const name = h.label ?? h.layer ?? h.tag ?? (h.color ? `${h.type} ${h.color}` : h.type);
    const key = h.src ? `${name} (${h.src})` : name;
    names.set(key, (names.get(key) ?? 0) + 1);
  }
  return `${kind} ${verb} ` + [...names].map(([k, c]) => c > 1 ? `${k} \xD7${c}` : k).join(", ");
}
function pathLength(s) {
  let L = 0;
  for (let i = 1; i < s.length; i++) L += dist(s[i - 1], s[i]);
  return L;
}
function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function resample(s, step, max) {
  const L = pathLength(s);
  if (s.length < 2 || L === 0) return s.slice(0, 1);
  const d = Math.max(step, L / max);
  const out = [s[0]];
  let carry = 0;
  for (let i = 1; i < s.length; i++) {
    const seg = dist(s[i - 1], s[i]);
    let t = d - carry;
    while (t <= seg) {
      const f = t / seg;
      out.push([s[i - 1][0] + (s[i][0] - s[i - 1][0]) * f, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * f]);
      t += d;
    }
    carry = seg - (t - d);
  }
  out.push(s[s.length - 1]);
  return out;
}
function gridInside(ring, target) {
  const [x0, y0, x1, y1] = bbox2(ring);
  const area = Math.abs(ring.reduce((a, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return a + p[0] * q[1] - q[0] * p[1];
  }, 0)) / 2;
  const step = Math.max(4, Math.sqrt(area / target));
  const out = [];
  for (let y = y0 + step / 2; y < y1; y += step) {
    for (let x = x0 + step / 2; x < x1; x += step) if (inside([x, y], ring)) out.push([x, y]);
  }
  return out;
}
function inside(p, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function simplify(s, max) {
  if (s.length <= 2) return s;
  for (let eps = 1; ; eps *= 1.5) {
    const out = rdp(s, eps);
    if (out.length <= max) return out;
  }
}
function rdp(s, eps) {
  if (s.length <= 2) return s;
  const [a, b] = [s[0], s[s.length - 1]];
  const L = dist(a, b) || 1;
  let best = -1, idx = 0;
  for (let i = 1; i < s.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - s[i][1]) - (a[0] - s[i][0]) * (b[1] - a[1])) / L;
    if (d > best) {
      best = d;
      idx = i;
    }
  }
  if (best <= eps) return [a, b];
  return [...rdp(s.slice(0, idx + 1), eps).slice(0, -1), ...rdp(s.slice(idx), eps)];
}
function bbox2(ps) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ps) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)];
}
function mean(ps) {
  const s = ps.reduce((a, p) => [a[0] + p.x, a[1] + p.y, a[2] + p.z], [0, 0, 0]);
  return { x: s[0] / ps.length, y: s[1] / ps.length, z: s[2] / ps.length };
}
function bounds(ps) {
  const lo = { x: Infinity, y: Infinity, z: Infinity }, hi = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const p of ps) {
    lo.x = Math.min(lo.x, p.x);
    lo.y = Math.min(lo.y, p.y);
    lo.z = Math.min(lo.z, p.z);
    hi.x = Math.max(hi.x, p.x);
    hi.y = Math.max(hi.y, p.y);
    hi.z = Math.max(hi.z, p.z);
  }
  return [lo, hi];
}
function round3(p) {
  return [p.x, p.y, p.z].map((v) => +v.toFixed(4));
}

// src/sketch/Sketch.ts
function spaceToConstrain(space) {
  switch (space.kind) {
    case "free":
    case "ground":
      return void 0;
    // free = unconstrained; ground = renderer default
    case "plane": {
      const o = space.origin, n = space.normal;
      const nl = Math.hypot(n.x, n.y, n.z) || 1;
      const nx = n.x / nl, ny = n.y / nl, nz = n.z / nl;
      return (x, y, z) => {
        const d = (x - o.x) * nx + (y - o.y) * ny + (z - o.z) * nz;
        return [x - nx * d, y - ny * d, z - nz * d];
      };
    }
    case "axis": {
      const o = space.origin, dir = space.dir;
      const dl2 = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z || 1;
      return (x, y, z) => {
        const t = ((x - o.x) * dir.x + (y - o.y) * dir.y + (z - o.z) * dir.z) / dl2;
        return [o.x + dir.x * t, o.y + dir.y * t, o.z + dir.z * t];
      };
    }
    case "curve": {
      const m = space.samples ?? 64;
      const pts = [];
      for (let i = 0; i <= m; i++) pts.push(space.at(i / m));
      return (x, y, z) => {
        let bx = pts[0].x, by = pts[0].y, bz = pts[0].z, bestD = Infinity;
        for (const p of pts) {
          const d = (p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2;
          if (d < bestD) {
            bestD = d;
            bx = p.x;
            by = p.y;
            bz = p.z;
          }
        }
        return [bx, by, bz];
      };
    }
  }
}
function sketch(fn, config) {
  return new SketchInstance(fn, config ?? {});
}
var SketchInstance = class {
  constructor(fn, config) {
    // Param model: values live in the shared ParamStore, panel placement in
    // `items`, and the DOM is rendered by the shared ControlPanel (src/gui/).
    this.store = new ParamStore({});
    this.items = /* @__PURE__ */ new Map();
    this.layerTrees = /* @__PURE__ */ new Map();
    this.buttons = [];
    // Top-bar export / import handlers registered by the sketch. Survive
    // sketch re-runs (re-registering replaces the handler closure).
    this.exports = /* @__PURE__ */ new Map();
    this.imports = /* @__PURE__ */ new Map();
    // Listeners that the host shell (testbench / app frame) subscribes to so
    // it can refresh its Export/Import menus when the sketch registers items.
    this._exportListeners = /* @__PURE__ */ new Set();
    this._importListeners = /* @__PURE__ */ new Set();
    this.logs = [];
    this.infoText = "";
    this.animateFn = null;
    this.frame = 0;
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.disposed = false;
    // Re-run suppression: `_running` while the sketch fn executes (param
    // declarations must not schedule re-runs), `_squelch` during programmatic
    // setSlider (updates the control but does not re-run — original semantics).
    this._running = false;
    this._squelch = false;
    this._hasTabs = false;
    this._onceRan = [];
    this._onceSeq = 0;
    // Random state (persists across sketch re-runs)
    this.rng = createRandom();
    // Input state
    this._mouseX = 0;
    this._mouseY = 0;
    this._pmouseX = 0;
    this._pmouseY = 0;
    this._mousePressed = false;
    this._key = "";
    this._keyPressed = false;
    // Input callbacks (set per sketch run)
    this._onMouseClicked = null;
    this._onMouseDragged = null;
    this._onKeyPressed = null;
    this._onKeyReleased = null;
    // Picking + gizmo state
    this._onPick = null;
    this._selectedId = null;
    this._pickEnabled = false;
    this._pickUnsub = null;
    // Drag handle state (persistent across runs)
    this._dragHandles = /* @__PURE__ */ new Map();
    this._dragHandleSeq = 0;
    this._dragHandlesWired = false;
    this._onHandlePick = null;
    // Stored event handlers for cleanup
    this._boundKeyDown = null;
    this._boundKeyUp = null;
    // beginShape state
    this._shapeVerts = [];
    this._shapeMode = "triangles";
    // Continuous re-run mode (set when lab.animate() is called)
    this._continuous = false;
    // Retain mode: animate runs per-frame but sketch only re-runs on param changes
    this._retain = false;
    // Markup overlay (Markup.ts). While it is open, every object added to the scene
    // records the user-code line that created it, so a mark can point at source.
    this.markup = null;
    this.bridge = null;
    // Export ▾ / Import ▾ in the sketch's own header (a shell's top bar does it otherwise).
    this._fileMenusEl = null;
    this._fileMenusSig = "";
    this._trackSource = false;
    this._srcById = /* @__PURE__ */ new Map();
    this.separatorCount = 0;
    this._prevParamFingerprint = "";
    /** Log container inside the "Info" tab (tab mode only; set during render) */
    this._panelLogEl = null;
    /** Info-text section in the panel footer */
    this._panelInfoEl = null;
    /** Log section in the panel footer (non-tab mode) */
    this._panelFooterLogEl = null;
    this._lastRerunTime = 0;
    this._rerunTimer = 0;
    // Display-only params: keys declared with `display: true` route their
    // changes to the display pass (lab.onDisplay) instead of a full re-run.
    this._displayKeys = /* @__PURE__ */ new Set();
    this._onDisplayFns = [];
    // Tab-switch callback (per run) — lets a sketch update tab-dependent info
    // text without re-running (the panel re-renders itself on tab clicks).
    this._onTabChange = null;
    // View-layer tagging (per run): object ids created inside begin/endViewLayer
    // scopes, keyed by layer name. Reset every run — ids don't survive clear().
    this._viewLayerStack = [];
    this._viewLayerObjects = /* @__PURE__ */ new Map();
    this.fn = fn;
    this.config = config;
    this.scene = new Scene();
    this.scene.on((e) => {
      if (e.type === "object:add" && this._trackSource) {
        const site = callSite();
        if (site) this._srcById.set(e.id, site);
      }
      if (e.type === "object:add" && this._viewLayerStack.length > 0) {
        const name = this._viewLayerStack[this._viewLayerStack.length - 1];
        this._viewLayerObjects.get(name).push(e.id);
      }
    });
    if (typeof config.container === "string") {
      this.container = document.querySelector(config.container);
    } else if (config.container) {
      this.container = config.container;
    } else {
      this.container = document.body;
    }
    this.buildDOM();
    this.initRenderer();
    this.wireInput();
    this.runSketch();
    this.startLoop();
    if (this.config.markup !== false) this.initMarkup();
  }
  // ── DOM Construction ──
  buildDOM() {
    const defaultWidth = this.config.panelWidth ?? 320;
    const storageKey = `tekto.panelWidth.${this.config.title ?? "default"}`;
    const stored = parseInt(localStorage.getItem(storageKey) ?? "", 10);
    const panelWidth = Number.isFinite(stored) && stored >= 200 && stored <= 800 ? stored : defaultWidth;
    const t = this.theme = getTheme(this.config.theme);
    const inShell = this.container instanceof HTMLElement && this.container.dataset.shell != null;
    const showHeader = this.config.showHeader ?? !inShell;
    const headerRow = showHeader ? "44px " : "";
    const root = document.createElement("div");
    root.style.cssText = `
      display:grid; grid-template-columns:${panelWidth}px 1fr; grid-template-rows:${headerRow}1fr;
      height:100%; width:100%; overflow:hidden; position:relative;
      background:${t.bg};
      color:${t.text};
      font-family:${t.font};
    `;
    if (showHeader) {
      const header = document.createElement("div");
      header.style.cssText = `
        grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
        background:${t.panelBg};
        border-bottom:1px solid ${t.border};
      `;
      header.innerHTML = `
        <span style="font-weight:600;font-size:14px;color:${t.accent}">
          &#x2B21; ${this.config.title ?? "Tekto Sketch"}
        </span>
        <span style="font-size:9px;padding:2px 6px;border-radius:3px;
          background:${t.hoverBg};color:${t.accent}">LIVE</span>
      `;
      this._fileMenusEl = document.createElement("div");
      this._fileMenusEl.style.cssText = "margin-left:auto;display:flex;gap:8px;position:relative;";
      header.appendChild(this._fileMenusEl);
      root.appendChild(header);
    }
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      overflow-y:auto; overflow-x:hidden; padding:0;
      background:${t.panelBg};
      border-right:1px solid ${t.border};
      position:relative; grid-column:1;
    `;
    root.appendChild(this.panelEl);
    this.panel = new ControlPanel({
      store: this.store,
      theme: t,
      getButtons: () => this.buttons,
      onCommit: (key) => {
        if (this.isDisplayChange(key)) this.runDisplayPass();
        else this.commitRun();
      },
      onAction: () => this.runSketch(),
      onTabChange: (tab) => {
        this._onTabChange?.(tab);
      }
    });
    this.panelEl.appendChild(this.panel.el);
    this.store.onChange((key) => {
      if (this._running || this._squelch) return;
      if (this.isDisplayChange(key)) this.runDisplayPass();
      else this.scheduleRerun();
    });
    this._panelInfoEl = document.createElement("div");
    this._panelInfoEl.style.cssText = `padding:12px 14px;border-bottom:1px solid ${t.border};font-size:11px;color:${t.textDim};line-height:1.7;white-space:pre-wrap;display:none;`;
    this._panelFooterLogEl = document.createElement("div");
    this._panelFooterLogEl.style.cssText = `padding:10px 14px;border-bottom:1px solid ${t.border};display:none;`;
    this.panel.footer.append(this._panelInfoEl, this._panelFooterLogEl);
    const resizeHandle = document.createElement("div");
    resizeHandle.title = "Drag to resize panel \xB7 double-click to reset";
    const handleIdle = t.isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.14)";
    const handleHover = t.isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.30)";
    resizeHandle.style.cssText = `
      position:absolute; top:${showHeader ? 44 : 0}px; bottom:0;
      left:${panelWidth - 3}px; width:6px;
      cursor:col-resize; z-index:10;
      background:${handleIdle};
      transition:background .15s;
    `;
    resizeHandle.addEventListener("mouseenter", () => {
      resizeHandle.style.background = handleHover;
    });
    resizeHandle.addEventListener("mouseleave", () => {
      resizeHandle.style.background = handleIdle;
    });
    resizeHandle.addEventListener("dblclick", () => applyWidth(defaultWidth));
    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = parseInt(root.style.gridTemplateColumns, 10) || panelWidth;
      const onMove = (ev) => {
        const next = Math.max(200, Math.min(800, startWidth + (ev.clientX - startX)));
        applyWidth(next);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
      };
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    root.appendChild(resizeHandle);
    let curWidth = panelWidth;
    const applyWidth = (w) => {
      curWidth = w;
      root.style.gridTemplateColumns = `${w}px 1fr`;
      resizeHandle.style.left = `${w - 3}px`;
      collapseBtn.style.left = `${w - 26}px`;
      localStorage.setItem(storageKey, String(w));
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
    const collapseKey = `tekto.panelCollapsed.${this.config.title ?? "default"}`;
    const btnCss = (left) => `
      position:absolute; top:${(showHeader ? 44 : 0) + 6}px; left:${left}px;
      width:20px; height:24px; z-index:11; cursor:pointer; user-select:none;
      display:flex; align-items:center; justify-content:center;
      font:13px/1 ui-monospace,monospace;
      border:1px solid ${t.controlBorder}; border-radius:4px;
      background:${t.panelBg}; color:${t.accent};
    `;
    const collapseBtn = document.createElement("div");
    collapseBtn.title = "Collapse panel";
    collapseBtn.textContent = "\u2039";
    collapseBtn.style.cssText = btnCss(panelWidth - 26);
    root.appendChild(collapseBtn);
    const expandBtn = document.createElement("div");
    expandBtn.title = "Show panel";
    expandBtn.textContent = "\u203A";
    expandBtn.style.cssText = btnCss(4);
    expandBtn.style.display = "none";
    root.appendChild(expandBtn);
    const applyCollapsed = (c) => {
      root.style.gridTemplateColumns = c ? "28px 1fr" : `${curWidth}px 1fr`;
      this.panelEl.style.display = c ? "none" : "";
      resizeHandle.style.display = c ? "none" : "";
      collapseBtn.style.display = c ? "none" : "flex";
      collapseBtn.style.left = `${curWidth - 26}px`;
      expandBtn.style.display = c ? "flex" : "none";
      localStorage.setItem(collapseKey, c ? "1" : "0");
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
    collapseBtn.addEventListener("click", () => applyCollapsed(true));
    expandBtn.addEventListener("click", () => applyCollapsed(false));
    if (localStorage.getItem(collapseKey) === "1") applyCollapsed(true);
    const vpWrap = document.createElement("div");
    vpWrap.style.cssText = "position:relative;overflow:hidden;grid-column:2;";
    this.viewportEl = document.createElement("div");
    this.viewportEl.style.cssText = "width:100%;height:100%;";
    vpWrap.appendChild(this.viewportEl);
    this.logEl = document.createElement("div");
    this.logEl.style.cssText = `
      position:absolute; bottom:12px; left:12px;
      padding:8px 12px; border-radius:6px;
      background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
      font-size:11px; line-height:1.7; color:#7a80a0;
      pointer-events:none; max-width:300px;
      border:1px solid rgba(22,24,42,.8);
      display:none;
    `;
    vpWrap.appendChild(this.logEl);
    root.appendChild(vpWrap);
    if (this.container === document.body) {
      this.container.style.margin = "0";
      this.container.style.height = "100vh";
      this.container.style.overflow = "hidden";
    }
    this.container.appendChild(root);
  }
  initRenderer() {
    const zUp = this.config.up === "z";
    this.renderer = new ThreeRenderer(this.scene, this.viewportEl, {
      backgroundColor: this.config.background ?? 460814,
      showGrid: this.config.grid !== false,
      showAxes: this.config.axes !== false,
      cameraPosition: this.config.camera ?? (zUp ? [8, -10, 6] : [5, 6, 8]),
      cameraTarget: this.config.target ?? [0, 0, 0],
      up: this.config.up ?? "y"
    });
  }
  // ── Input Wiring ──
  wireInput() {
    const canvas = this.renderer.canvasEl;
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this._pmouseX = this._mouseX;
      this._pmouseY = this._mouseY;
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
      if (this._mousePressed && this._onMouseDragged) {
        this._onMouseDragged();
      }
    });
    canvas.addEventListener("mousedown", () => {
      this._mousePressed = true;
      if (this._onMouseClicked) this._onMouseClicked();
    });
    canvas.addEventListener("mouseup", () => {
      this._mousePressed = false;
    });
    this._boundKeyDown = (e) => {
      this._key = e.key;
      this._keyPressed = true;
      if (this._onKeyPressed) this._onKeyPressed(e.key);
    };
    this._boundKeyUp = (e) => {
      this._key = e.key;
      this._keyPressed = false;
      if (this._onKeyReleased) this._onKeyReleased(e.key);
    };
    window.addEventListener("keydown", this._boundKeyDown);
    window.addEventListener("keyup", this._boundKeyUp);
  }
  // ── Picking + gizmo ──
  enablePicking(enabled) {
    if (enabled === this._pickEnabled) return;
    this._pickEnabled = enabled;
    this.renderer.setPickEnabled(enabled);
    if (enabled) {
      this._pickUnsub = this.renderer.onPick((id) => {
        this.setSelected(id);
        if (this._onPick) {
          const o = id ? this.scene.get(id) : null;
          this._onPick(id, o ? { tag: o.pickTag, layer: o.style.layer } : void 0);
        }
        this.runSketch();
      });
    } else {
      this._pickUnsub?.();
      this._pickUnsub = null;
      this.setSelected(null);
    }
  }
  setGizmoMode(mode) {
    this.renderer.setGizmoMode(mode);
  }
  setSelected(id) {
    this._selectedId = id;
    this.renderer.setSelectionHighlight(id);
    if (id) this.renderer.attachGizmo(id);
    else this.renderer.detachGizmo();
    this.scene.clearSelection();
    if (id) this.scene.select(id);
  }
  /** Create or update a drag handle for this sketch run; returns a Reactive<Vec3>. */
  registerDragHandle(initX, initY, initZ, opts) {
    if (!this._dragHandlesWired) {
      this.renderer.setPickEnabled(true);
      this.renderer.setDragHandleCallbacks(
        (name2, x, y, z) => {
          this._dragHandles.set(name2, new Vec3(x, y, z));
          this.runSketch();
        },
        void 0,
        (name2) => {
          if (this._onHandlePick) this._onHandlePick(name2);
          this.runSketch();
        }
      );
      this._dragHandlesWired = true;
    }
    const name = opts?.name ?? `handle_${this._dragHandleSeq++}`;
    if (!this._dragHandles.has(name)) {
      this._dragHandles.set(name, new Vec3(initX, initY, initZ));
    }
    let cur = this._dragHandles.get(name);
    if (opts?.constrain) {
      const [cx, cy, cz] = opts.constrain(cur.x, cur.y, cur.z);
      if (cx !== cur.x || cy !== cur.y || cz !== cur.z) {
        cur = new Vec3(cx, cy, cz);
        this._dragHandles.set(name, cur);
      }
    }
    this.renderer.upsertDragHandle(name, cur.x, cur.y, cur.z, opts?.color, opts?.size, opts?.constrain, opts?.plane);
    return {
      value: cur,
      set: (v) => {
        this._dragHandles.set(name, v);
        if (!this._running) this.runSketch();
      }
    };
  }
  setHandleSelected(name) {
    this.renderer.setHandleSelected(name);
  }
  get selectedHandle() {
    return this.renderer.getSelectedHandle();
  }
  get activeDragHandle() {
    return this.renderer.getActiveDragHandle();
  }
  /** Programmatically set a slider's value — updates the stored param AND its live DOM control. */
  setSlider(label, value, group = "") {
    const key = `slider:${group}:${label}`;
    if (!this.store.has(key)) return;
    this._squelch = true;
    this.store.set(key, value);
    this._squelch = false;
  }
  // ── Run Sketch ──
  runSketch() {
    const __runT0 = performance.now();
    this.scene.clear();
    this._srcById.clear();
    this.buttons = [];
    this.logs = [];
    this.infoText = "";
    this.animateFn = null;
    this._continuous = false;
    this._retain = false;
    this.separatorCount = 0;
    this._onceSeq = 0;
    this._onMouseClicked = null;
    this._onMouseDragged = null;
    this._onKeyPressed = null;
    this._onKeyReleased = null;
    this._onPick = null;
    this._onHandlePick = null;
    this._onTabChange = null;
    this._onDisplayFns = [];
    this._displayKeys.clear();
    this._viewLayerStack = [];
    this._viewLayerObjects.clear();
    this._dragHandleSeq = 0;
    this.renderer.beginDragHandleSweep();
    const usedParams = /* @__PURE__ */ new Set();
    const lab = this.buildLab(usedParams);
    this._running = true;
    try {
      this.fn(lab);
    } catch (e) {
      console.error("Tekto sketch error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }
    this._running = false;
    this.renderer.endDragHandleSweep();
    for (const key of this.store.keys()) {
      if (!usedParams.has(key)) {
        this.store.remove(key);
        this.items.delete(key);
      }
    }
    for (const key of this.layerTrees.keys()) {
      if (!usedParams.has(key)) this.layerTrees.delete(key);
    }
    const hasTabControls = [...this.items.values()].some((it) => it.tab) || this.buttons.some((b) => b.tab) || [...this.layerTrees.values()].some((lt) => lt.tab);
    const hasInfoTab = hasTabControls && this.logs.length > 0;
    const fingerprint = [
      ...[...this.items.values()].map((it) => `${it.key}@${it.tab ?? ""}`).sort(),
      ...this.buttons.map((b) => `btn:${b.menu ?? ""}:${b.group ?? ""}:${b.label}@${b.tab ?? ""}`),
      ...[...this.layerTrees.keys()].sort(),
      hasInfoTab ? "tab:Info" : ""
    ].join("|");
    if (fingerprint !== this._prevParamFingerprint) {
      this._prevParamFingerprint = fingerprint;
      this.panelRender(hasInfoTab);
    }
    if (this._selectedId) {
      if (this.scene.has(this._selectedId)) {
        this.renderer.setSelectionHighlight(this._selectedId);
        this.renderer.attachGizmo(this._selectedId);
      } else {
        this._selectedId = null;
        this.renderer.setSelectionHighlight(null);
        this.renderer.detachGizmo();
      }
    }
    this.updateLog();
    console.debug(`tekto: sketch run ${(performance.now() - __runT0).toFixed(1)}ms (${this.scene.count()} objects)`);
  }
  /** Feed the current control structure to the shared ControlPanel. */
  panelRender(hasInfoTab) {
    const t = this.theme;
    this._panelLogEl = null;
    const customRows = [...this.layerTrees.values()].map((lt) => ({
      key: lt.key,
      el: lt.panel.el,
      group: lt.group,
      tab: lt.tab || void 0,
      fullBleed: true
    }));
    const extraTabs = hasInfoTab ? [{
      name: "Info",
      render: (container) => {
        this._panelLogEl = container;
        container.style.cssText = `padding:12px 14px;font-size:11px;color:${t.textDim};line-height:1.9;`;
        this.updateLog();
      }
    }] : [];
    this._hasTabs = (/* @__PURE__ */ new Set([
      ...[...this.items.values()].map((it) => it.tab).filter(Boolean),
      ...this.buttons.map((b) => b.tab).filter(Boolean),
      ...hasInfoTab ? ["Info"] : []
    ])).size > 1 || hasInfoTab;
    this.panel.render([...this.items.values()], customRows, extraTabs);
  }
  buildLab(usedParams) {
    const self = this;
    const now = performance.now();
    const declare = (key, def, item, display) => {
      usedParams.add(key);
      if (display) this._displayKeys.add(key);
      if (!this.store.has(key)) {
        this.store.define(key, def);
        this.items.set(key, item);
      }
      const store = this.store;
      return { get value() {
        return store.get(key);
      }, set(v) {
        store.set(key, v);
      } };
    };
    const lab = {
      // ── GUI Controls ──
      slider(label, min, max, defaultValue, opts) {
        const key = `slider:${opts?.group ?? ""}:${label}`;
        return declare(
          key,
          { type: "float", min, max, default: defaultValue, step: opts?.step ?? (max - min) / 100, label },
          { key, group: opts?.group ?? "Parameters", tab: opts?.tab, menu: opts?.menu, accent: opts?.color },
          opts?.display
        );
      },
      setSlider(label, value, opts) {
        self.setSlider(label, value, opts?.group ?? "");
      },
      toggle(label, defaultValue = false, opts) {
        const key = `toggle:${opts?.group ?? ""}:${label}`;
        return declare(
          key,
          { type: "bool", default: defaultValue, label },
          { key, group: opts?.group ?? "Parameters", tab: opts?.tab, menu: opts?.menu },
          opts?.display
        );
      },
      select(label, options, defaultValue, opts) {
        const key = `select:${opts?.group ?? ""}:${label}`;
        return declare(
          key,
          { type: "select", options, default: defaultValue ?? options[0], label },
          { key, group: opts?.group ?? "Parameters", tab: opts?.tab, menu: opts?.menu },
          opts?.display
        );
      },
      colorPicker(label, defaultValue = "#38d9a9", opts) {
        const key = `color:${opts?.group ?? ""}:${label}`;
        return declare(
          key,
          { type: "color", default: defaultValue, label },
          { key, group: opts?.group ?? "Display", tab: opts?.tab, menu: opts?.menu },
          opts?.display
        );
      },
      layerTree(label, nodes, opts) {
        const key = `layertree:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        let lt = self.layerTrees.get(key);
        if (!lt) {
          const state2 = {
            key,
            value: {},
            nodes,
            group: opts?.group ?? "Layers",
            tab: opts?.tab ?? "",
            display: !!opts?.display
          };
          state2.panel = new LayerPanel({
            nodes,
            value: {},
            isDark: self.theme.isDark,
            onChange: (updates) => {
              state2.value = { ...state2.value, ...updates };
              state2.panel.update(state2.nodes, state2.value);
              if (state2.display && self._onDisplayFns.length > 0) self.runDisplayPass();
              else self.runSketch();
            }
          });
          lt = state2;
          self.layerTrees.set(key, state2);
        } else {
          lt.nodes = nodes;
          lt.display = !!opts?.display;
          lt.panel.update(nodes, lt.value);
        }
        const state = lt;
        return {
          get value() {
            return state.value;
          },
          set(update) {
            const next = { ...state.value };
            for (const [id, v] of Object.entries(update)) next[id] = { ...next[id], ...v };
            state.value = next;
            state.panel.update(state.nodes, state.value);
            if (self._running) return;
            if (state.display && self._onDisplayFns.length > 0) self.runDisplayPass();
            else self.runSketch();
          }
        };
      },
      // ── Actions ──
      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions", tab: opts?.tab, menu: opts?.menu, display: opts?.display });
      },
      once(fn) {
        const i = self._onceSeq++;
        if (!self._onceRan[i]) {
          self._onceRan[i] = true;
          fn();
        }
      },
      separator() {
        self.separatorCount++;
      },
      registerExport(opts) {
        self.exports.set(opts.name, { ...opts });
        for (const l of self._exportListeners) l();
        self.renderFileMenus();
      },
      registerImport(opts) {
        self.imports.set(opts.name, { ...opts });
        for (const l of self._importListeners) l();
        self.renderFileMenus();
      },
      // ── Geometry Builders ──
      mesh(m, style) {
        return self.addMeshHandle(m, style);
      },
      flatMesh(data, style) {
        return self.addFlatMeshHandle(data, style);
      },
      sphere(r = 1, seg = 24, rings = 16) {
        return self.addMeshHandle(MeshFactory.sphere(r, seg, rings));
      },
      box(w = 1, h = 1, d = 1) {
        return self.addMeshHandle(MeshFactory.box(w, h, d));
      },
      torus(R = 1, r = 0.3, seg = 32, sides = 16) {
        return self.addMeshHandle(MeshFactory.torus(R, r, seg, sides));
      },
      cylinder(rt = 1, rb = 1, h = 2, seg = 24) {
        return self.addMeshHandle(MeshFactory.cylinder(rt, rb, h, seg));
      },
      grid(w = 10, d = 10, dx = 24, dz = 24, hfn) {
        return self.addMeshHandle(MeshFactory.grid(w, d, dx, dz, hfn));
      },
      revolve(profile, seg = 32) {
        return self.addMeshHandle(MeshFactory.revolve(profile, seg));
      },
      extrude(polygon, direction) {
        return self.addMeshHandle(MeshFactory.extrude(polygon, direction));
      },
      point(x, y, z) {
        return self.addPointHandle(new Vec3(x, y, z));
      },
      points(positions) {
        return positions.map((p) => self.addPointHandle(p));
      },
      line(x1, y1, z1, x2, y2, z2) {
        return self.addLineHandle(new Vec3(x1, y1, z1), new Vec3(x2, y2, z2));
      },
      polyline(points) {
        return self.addPolylineHandle(points);
      },
      polygon(vertices, style) {
        return self.addShapeHandle(self.scene.addPolygon(vertices, style));
      },
      circle(cx, cy, cz, radius) {
        return self.addShapeHandle(self.scene.addCircle(new Vec3(cx, cy, cz), radius));
      },
      // ── Algorithms ──
      algo: Algo,
      MeshFactory,
      // ── Scene Control ──
      clear() {
        self.scene.clear();
      },
      background(c) {
        self.renderer.setBackground(c);
      },
      camera(x, y, z) {
        self.renderer.setCameraPosition(x, y, z);
      },
      lookAt(x, y, z) {
        self.renderer.lookAt(x, y, z);
      },
      fitAll() {
        self.renderer.fitAll();
      },
      setProjection(type) {
        self.renderer.setProjection(type);
      },
      cameraUp(x, y, z) {
        self.renderer.setCameraUp(x, y, z);
      },
      // ── Info ──
      log(label, value) {
        self.logs.push({ label, value: value != null ? String(value) : "" });
      },
      info(text) {
        self.infoText = text;
        if (!self._running) self.updateLog();
      },
      setFog(color, density = 0) {
        self.renderer.setFog(color, density);
      },
      setExposure(v) {
        self.renderer.setExposure(v);
      },
      setSunDirection(direction, distance) {
        self.renderer.setSunDirection(direction, distance);
      },
      // ── Math constructors ──
      vec2: (x, y) => new Vec2(x, y),
      vec3: (x, y, z) => new Vec3(x, y, z),
      // ── Processing Constants ──
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      HALF_PI: Math.PI / 2,
      TAU: Math.PI * 2,
      QUARTER_PI: Math.PI / 4,
      // ── Math Helpers ──
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      atan2: Math.atan2,
      abs: Math.abs,
      sqrt: Math.sqrt,
      pow: Math.pow,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      lerp: MathUtils.lerp,
      map: MathUtils.remap,
      constrain: MathUtils.clamp,
      dist(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      },
      rad(degrees) {
        return degrees * MathUtils.DEG2RAD;
      },
      deg(radians) {
        return radians * MathUtils.RAD2DEG;
      },
      // ── Noise & Random ──
      noise(x, y, z) {
        return noise(x, y ?? 0, z ?? 0);
      },
      random(min, max) {
        return self.rng.random(min, max);
      },
      randomSeed(seed) {
        self.rng.randomSeed(seed);
      },
      // ── Color Utility ──
      rgb(r, g, b) {
        if (g === void 0) {
          const v = Math.round(MathUtils.clamp(r, 0, 255));
          return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
        }
        const rr = Math.round(MathUtils.clamp(r, 0, 255));
        const gg = Math.round(MathUtils.clamp(g, 0, 255));
        const bb = Math.round(MathUtils.clamp(b ?? 0, 0, 255));
        return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
      },
      // ── Mouse & Keyboard Input ──
      get mouseX() {
        return self._mouseX;
      },
      get mouseY() {
        return self._mouseY;
      },
      get pmouseX() {
        return self._pmouseX;
      },
      get pmouseY() {
        return self._pmouseY;
      },
      get mousePressed() {
        return self._mousePressed;
      },
      get key() {
        return self._key;
      },
      get keyPressed() {
        return self._keyPressed;
      },
      onMouseClicked(fn) {
        self._onMouseClicked = fn;
      },
      onMouseDragged(fn) {
        self._onMouseDragged = fn;
      },
      onKeyPressed(fn) {
        self._onKeyPressed = fn;
      },
      onKeyReleased(fn) {
        self._onKeyReleased = fn;
      },
      // ── Viewport / overlays ──
      get viewport() {
        return self.viewportEl;
      },
      worldToScreen(x, y, z) {
        return self.renderer.worldToScreen(new Vec3(x, y, z));
      },
      invalidate() {
        self.runSketch();
      },
      requestRender() {
        self.renderer.requestRender();
      },
      // ── Display pass + view layers ──
      onDisplay(fn) {
        self._onDisplayFns.push(fn);
      },
      get activeTab() {
        return self.panel.getActiveTab();
      },
      onTabChange(fn) {
        self._onTabChange = fn;
      },
      beginViewLayer(name) {
        self._viewLayerStack.push(name);
        if (!self._viewLayerObjects.has(name)) self._viewLayerObjects.set(name, []);
      },
      endViewLayer() {
        self._viewLayerStack.pop();
      },
      viewLayer(name, fn) {
        lab.beginViewLayer(name);
        try {
          fn();
        } finally {
          lab.endViewLayer();
        }
      },
      hasViewLayer(name) {
        return self._viewLayerObjects.has(name);
      },
      styleViewLayer(name, style) {
        const ids = self._viewLayerObjects.get(name);
        if (!ids) return 0;
        let touched = 0;
        for (const id of ids) {
          if (self.scene.has(id)) {
            self.scene.setStyle(id, style);
            touched++;
          }
        }
        return touched;
      },
      // ── Picking + transform gizmo ──
      enablePicking(enabled = true) {
        self.enablePicking(enabled);
      },
      setOrbitRotateEnabled(enabled) {
        self.renderer.setOrbitRotateEnabled(enabled);
      },
      onPick(fn) {
        self._onPick = fn;
      },
      setGizmoMode(mode) {
        self.setGizmoMode(mode);
      },
      setSelected(id) {
        self.setSelected(id);
      },
      get selectedId() {
        return self._selectedId;
      },
      // ── Drag handles ──
      dragHandle(x, y, z, opts) {
        return self.registerDragHandle(x, y, z, opts);
      },
      handles(items, opts) {
        const active = self.renderer.getActiveDragHandle();
        items.forEach((item, i) => {
          const name = opts.key(item, i);
          const m = opts.position(item, i);
          if (name !== active) self._dragHandles.set(name, m);
          const constrain = opts.space ? spaceToConstrain(opts.space(item, i)) : void 0;
          const v = self.registerDragHandle(m.x, m.y, m.z, { name, color: opts.color, size: opts.size, constrain });
          if (v.value.distTo(m) > 1e-6) opts.onDrag(item, v.value, i);
        });
      },
      onHandlePick(fn) {
        self._onHandlePick = fn;
      },
      setHandleSelected(name) {
        self.setHandleSelected(name);
      },
      get selectedHandle() {
        return self.selectedHandle;
      },
      get activeDragHandle() {
        return self.activeDragHandle;
      },
      // ── beginShape/endShape ──
      beginShape(mode = "triangles") {
        self._shapeVerts = [];
        self._shapeMode = mode;
      },
      vertex(x, y, z) {
        self._shapeVerts.push(new Vec3(x, y, z));
      },
      hQuad(ax, ay, bx, by, cx, cy, dx, dy, z) {
        const v = self._shapeVerts;
        v.push(new Vec3(ax, ay, z), new Vec3(bx, by, z), new Vec3(cx, cy, z), new Vec3(dx, dy, z));
      },
      vQuad(ax, ay, bx, by, zTop, zBot) {
        const v = self._shapeVerts;
        v.push(new Vec3(ax, ay, zTop), new Vec3(bx, by, zTop), new Vec3(bx, by, zBot), new Vec3(ax, ay, zBot));
      },
      endShape(close = false) {
        const verts = self._shapeVerts;
        if (verts.length < 2) return null;
        const mode = self._shapeMode;
        if (mode === "lines" || mode === "line_strip") {
          const handles = [];
          if (mode === "lines") {
            for (let i = 0; i + 1 < verts.length; i += 2) {
              handles.push(self.addLineHandle(verts[i], verts[i + 1]));
            }
          } else {
            for (let i = 0; i < verts.length - 1; i++) {
              handles.push(self.addLineHandle(verts[i], verts[i + 1]));
            }
            if (close && verts.length >= 3) {
              handles.push(self.addLineHandle(verts[verts.length - 1], verts[0]));
            }
          }
          self._shapeVerts = [];
          if (handles.length === 0) return null;
          const compound = {
            get id() {
              return handles[0].id;
            },
            color(c) {
              for (const h of handles) h.color(c);
              return compound;
            },
            opacity(o) {
              for (const h of handles) h.opacity(o);
              return compound;
            },
            radius(r) {
              for (const h of handles) h.radius(r);
              return compound;
            },
            layer(name) {
              for (const h of handles) h.layer(name);
              return compound;
            },
            dashed(size, gap) {
              for (const h of handles) h.dashed(size, gap);
              return compound;
            },
            pickTag(tag) {
              for (const h of handles) h.pickTag(tag);
              return compound;
            },
            pickable(p = true) {
              for (const h of handles) h.pickable(p);
              return compound;
            }
          };
          return compound;
        }
        const mesh = new Mesh();
        const nodeIds = verts.map((v) => mesh.addNode(v));
        if (mode === "triangles") {
          for (let i = 0; i + 2 < nodeIds.length; i += 3) {
            mesh.addTriangle(nodeIds[i], nodeIds[i + 1], nodeIds[i + 2]);
          }
        } else if (mode === "quads") {
          for (let i = 0; i + 3 < nodeIds.length; i += 4) {
            mesh.addQuad(nodeIds[i], nodeIds[i + 1], nodeIds[i + 2], nodeIds[i + 3]);
          }
        }
        mesh.computeVertexNormals();
        self._shapeVerts = [];
        return self.addMeshHandle(mesh);
      },
      // ── Time ──
      get frame() {
        return self.frame;
      },
      get time() {
        return (now - self.startTime) / 1e3;
      },
      get dt() {
        return (now - self.lastTime) / 1e3;
      },
      // ── Animation ──
      animate(fn, opts) {
        self.animateFn = fn;
        self._continuous = true;
        if (opts?.retain) self._retain = true;
      },
      // ── Scene Access ──
      getScene() {
        return self.scene;
      }
    };
    return lab;
  }
  // ── Handle Factories ──
  addMeshHandle(mesh, style) {
    const obj = this.scene.addMesh(mesh, style);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      get mesh() {
        return mesh;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      wireframe(w = true) {
        self.scene.setStyle(obj.id, { wireframe: w });
        return handle;
      },
      visible(v = true) {
        self.scene.setStyle(obj.id, { visible: v });
        return handle;
      },
      label(l) {
        self.scene.setStyle(obj.id, { label: l });
        return handle;
      },
      labelScale(s) {
        self.scene.setStyle(obj.id, { labelScale: s });
        return handle;
      },
      doubleSided(d = true) {
        self.scene.setStyle(obj.id, { doubleSided: d });
        return handle;
      },
      backfaceColor(c) {
        self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c });
        return handle;
      },
      groupColor(_name, _color) {
        return handle;
      },
      noExport(v = true) {
        self.scene.setStyle(obj.id, { noExport: v });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      printLayers(heightM) {
        self.scene.setStyle(obj.id, { printLayerH: heightM });
        return handle;
      },
      translate(x, y, z) {
        for (const n of mesh.nodes()) {
          n.position = n.position.add(new Vec3(x, y, z));
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      scale(s) {
        for (const n of mesh.nodes()) {
          n.position = n.position.mul(s);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      rotateX(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        for (const n of mesh.nodes()) {
          const p = n.position;
          n.position = new Vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      rotateY(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        for (const n of mesh.nodes()) {
          const p = n.position;
          n.position = new Vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      rotateZ(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        for (const n of mesh.nodes()) {
          const p = n.position;
          n.position = new Vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      subdivide(iterations = 1, opts) {
        let m = mesh;
        for (let i = 0; i < iterations; i++) m = MeshFactory.subdivide(m, opts);
        self.scene.remove(obj.id);
        return self.addMeshHandle(m, obj.style);
      },
      smooth(iterations = 1, factor = 0.5) {
        Algo.laplacianSmooth(mesh, iterations, factor);
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      volume() {
        return Algo.meshVolume(mesh);
      },
      surfaceArea() {
        return Algo.meshSurfaceArea(mesh);
      },
      nodeCount() {
        return mesh.nodeCount;
      },
      faceCount() {
        return mesh.faceCount;
      },
      edgeCount() {
        return mesh.edgeCount;
      }
    };
    return handle;
  }
  addFlatMeshHandle(data, style) {
    const obj = this.scene.addFlatMesh(data, style);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      get mesh() {
        return null;
      },
      // flat data has no Mesh object behind it
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      wireframe(w = true) {
        self.scene.setStyle(obj.id, { wireframe: w });
        return handle;
      },
      visible(v = true) {
        self.scene.setStyle(obj.id, { visible: v });
        return handle;
      },
      label(l) {
        self.scene.setStyle(obj.id, { label: l });
        return handle;
      },
      labelScale(s) {
        self.scene.setStyle(obj.id, { labelScale: s });
        return handle;
      },
      doubleSided(d = true) {
        self.scene.setStyle(obj.id, { doubleSided: d });
        return handle;
      },
      backfaceColor(c) {
        self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c });
        return handle;
      },
      groupColor(name, color) {
        const existing = self.scene.get(obj.id)?.style.groupColors ?? {};
        self.scene.setStyle(obj.id, { groupColors: { ...existing, [name]: color } });
        return handle;
      },
      noExport(v = true) {
        self.scene.setStyle(obj.id, { noExport: v });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      printLayers(heightM) {
        self.scene.setStyle(obj.id, { printLayerH: heightM });
        return handle;
      },
      translate() {
        return handle;
      },
      scale() {
        return handle;
      },
      rotateX() {
        return handle;
      },
      rotateY() {
        return handle;
      },
      rotateZ() {
        return handle;
      },
      subdivide() {
        return handle;
      },
      smooth() {
        return handle;
      },
      volume() {
        return 0;
      },
      surfaceArea() {
        return 0;
      },
      nodeCount() {
        return data.positions.length / 3;
      },
      faceCount() {
        return data.indices.length / 3;
      },
      edgeCount() {
        return 0;
      }
    };
    return handle;
  }
  addPointHandle(pos) {
    const obj = this.scene.addPoint(pos);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      size(s) {
        self.scene.setStyle(obj.id, { pointSize: s });
        return handle;
      },
      label(l) {
        self.scene.setStyle(obj.id, { label: l });
        return handle;
      },
      labelScale(s) {
        self.scene.setStyle(obj.id, { labelScale: s });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      moveTo(x, y, z) {
        self.scene.update(obj.id, { position: new Vec3(x, y, z) });
        return handle;
      },
      position() {
        return self.scene.get(obj.id)?.position ?? pos;
      }
    };
    return handle;
  }
  addLineHandle(a, b) {
    const obj = this.scene.addSegment(a, b);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      radius(r) {
        self.scene.setStyle(obj.id, { tubeRadius: r });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      dashed(size, gap) {
        self.scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } });
        return handle;
      },
      pickTag(tag) {
        self.scene.update(obj.id, { pickTag: tag });
        return handle;
      },
      pickable(p = true) {
        self.scene.update(obj.id, { pickable: p });
        return handle;
      }
    };
    return handle;
  }
  addPolylineHandle(points) {
    const obj = this.scene.addPolyline(points);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      // tubeRadius has no effect on the buffered Line — kept for API parity.
      radius(_r) {
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      dashed(size, gap) {
        self.scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } });
        return handle;
      },
      pickTag(tag) {
        self.scene.update(obj.id, { pickTag: tag });
        return handle;
      },
      pickable(p = true) {
        self.scene.update(obj.id, { pickable: p });
        return handle;
      }
    };
    return handle;
  }
  addShapeHandle(obj) {
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      visible(v = true) {
        self.scene.setStyle(obj.id, { visible: v });
        return handle;
      },
      label(l) {
        self.scene.setStyle(obj.id, { label: l });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      }
    };
    return handle;
  }
  // ── Log Display ──
  updateLog() {
    if (this.logs.length > 0) {
      this.logEl.innerHTML = this.logs.map((l) => `<span style="color:#5a5e7a">${l.label}</span>${l.value ? ` <span style="color:#fff">${l.value}</span>` : ""}`).join("<br>");
      this.logEl.style.display = "block";
    } else {
      this.logEl.style.display = "none";
    }
    if (this._panelInfoEl) {
      this._panelInfoEl.textContent = this.infoText;
      this._panelInfoEl.style.display = this.infoText ? "block" : "none";
    }
    const logHtml = this.logs.map((l) => `<div style="font-size:10px;line-height:1.7;"><span style="color:${this.theme.textDim}">${l.label}</span>${l.value ? ` <span style="color:${this.theme.accent}">${l.value}</span>` : ""}</div>`).join("");
    if (this._hasTabs) {
      if (this._panelFooterLogEl) this._panelFooterLogEl.style.display = "none";
      if (this._panelLogEl) this._panelLogEl.innerHTML = logHtml;
    } else if (this._panelFooterLogEl) {
      this._panelFooterLogEl.innerHTML = logHtml;
      this._panelFooterLogEl.style.display = this.logs.length > 0 ? "block" : "none";
    }
  }
  // ── Render Loop ──
  startLoop() {
    const loop = () => {
      if (this.disposed) return;
      this.frame++;
      const now = performance.now();
      const dt = (now - this.lastTime) / 1e3;
      this.lastTime = now;
      if (this._continuous && !this._retain) {
        this.runSketch();
      }
      if (this.animateFn) {
        this.animateFn((now - this.startTime) / 1e3, dt);
      }
      this.renderer.renderIfNeeded();
      requestAnimationFrame(loop);
    };
    loop();
  }
  // ── Public Methods ──
  /** A change to `key` is display-only when the param was declared with
   *  `display: true` AND the sketch registered a display pass; otherwise
   *  fall back to the normal full re-run (safe default). */
  isDisplayChange(key) {
    return this._displayKeys.has(key) && this._onDisplayFns.length > 0;
  }
  /** Run the display pass (restyle-only, no geometry rebuild). */
  runDisplayPass() {
    const t0 = performance.now();
    for (const fn of this._onDisplayFns) {
      try {
        fn();
      } catch (e) {
        console.error("Tekto display pass error:", e);
      }
    }
    console.debug(`tekto: display pass ${(performance.now() - t0).toFixed(1)}ms`);
  }
  /** Throttled sketch re-run — at most once per 50ms so the browser stays responsive during slider drag. */
  scheduleRerun() {
    if (this._rerunTimer) return;
    const elapsed = performance.now() - this._lastRerunTime;
    const delay = Math.max(0, 50 - elapsed);
    this._rerunTimer = window.setTimeout(() => {
      this._rerunTimer = 0;
      this._lastRerunTime = performance.now();
      this.runSketch();
    }, delay);
  }
  /** Immediate re-run on control commit (slider drag-end, toggle, select) —
   *  cancels any pending throttled re-run so the final value applies now. */
  commitRun() {
    if (this._rerunTimer) {
      clearTimeout(this._rerunTimer);
      this._rerunTimer = 0;
    }
    this._lastRerunTime = performance.now();
    this.runSketch();
  }
  /** Force re-run the sketch */
  rerun() {
    this.runSketch();
  }
  /**
   * Draw the viewport on the next frame. The loop draws only when something
   * changed; call this after changing three.js objects directly (e.g. one added
   * with `addExternalObject`). Scene, camera and Lab calls already do.
   */
  requestRender() {
    this.renderer.requestRender();
  }
  /** Change the scene render mode (solid / wireframe / hiddenline). */
  setRenderMode(mode) {
    this.scene.setRenderMode(mode);
  }
  /**
   * Switch shading preset. `"studio"` enables PBR materials, sun-style
   * shadows, and ACES tonemapping; `"flat"` is the lightweight default.
   * See `LightingMode` in `src/scene/Scene.ts` for the trade-offs.
   */
  setLightingMode(mode) {
    this.scene.setLightingMode(mode);
  }
  /**
   * Toggle a procedural environment map for image-based reflections. Only
   * visibly affects `"studio"` PBR materials (it modulates their specular
   * highlights / reflections); harmless in `"flat"` mode.
   */
  setEnvironment(enabled) {
    this.scene.setEnvironment(enabled);
  }
  /**
   * Set an equirectangular source texture (e.g. an HDR loaded via RGBELoader)
   * for the environment map. Pass null for the built-in procedural gradient.
   */
  setEnvironmentSource(equirect) {
    this.renderer.setEnvironmentSource(equirect);
  }
  /** Show the environment source (e.g. the HDR) as the visible sky backdrop. */
  setFog(color, density = 0) {
    this.renderer.setFog(color, density);
  }
  setExposure(v) {
    this.renderer.setExposure(v);
  }
  setEnvironmentBackground(visible) {
    this.renderer.setEnvironmentBackground(visible);
  }
  /** Rotate the environment + background (Euler radians); aligns a Y-up HDRI to Z-up. */
  setEnvironmentRotation(x, y, z) {
    this.renderer.setEnvironmentRotation(x, y, z);
  }
  /**
   * Add a raw THREE.Object3D (e.g. a glTF/GLB scene loaded with GLTFLoader) to
   * the scene, kept across sketch re-runs. Re-adding the same id replaces it.
   */
  addExternalObject(obj, id) {
    this.renderer.addExternalObject(obj, id);
  }
  removeExternalObject(id) {
    this.renderer.removeExternalObject(id);
  }
  /**
   * Studio-mode default PBR material for meshes that don't set their own
   * metalness/roughness in their VisualStyle. metalness 0..1 (1 = metal),
   * roughness 0..1 (0 = mirror). Applies on the next sketch re-run.
   */
  setStudioMaterial(metalness, roughness, color = null, flatShading = false) {
    this.renderer.setStudioMaterial(metalness, roughness, color, flatShading);
  }
  /**
   * Show/hide line + point "helper" objects (axes, construction lines, markers,
   * labels) while keeping solid meshes — e.g. for a clean render view.
   */
  setHelpersVisible(visible) {
    this.renderer.setHelpersVisible(visible);
  }
  /**
   * Show/hide tekto's studio shadow-catcher plane at the origin. Hide it when
   * your sketch provides its own ground to receive shadows.
   */
  setShadowGroundVisible(visible) {
    this.renderer.setShadowGroundVisible(visible);
  }
  /**
   * Aim the main directional light from outside the sketch fn — used
   * by host shells (testbench, custom apps) to push a sun position
   * computed from their own date/location UI. Inside a sketch, prefer
   * `lab.setSunDirection(direction)`.
   */
  setSunDirection(direction, distance) {
    this.renderer.setSunDirection(direction, distance);
  }
  /**
   * Read the sketch's registered export entries (via `lab.registerExport`).
   * Returns a fresh snapshot — safe to iterate without holding a reference
   * to the underlying Map.
   */
  getExports() {
    return Array.from(this.exports.values());
  }
  getImports() {
    return Array.from(this.imports.values());
  }
  /**
   * Subscribe to export/import registration changes. The shell (testbench
   * top bar, app frame) uses this to re-render its menus when the sketch
   * adds or replaces entries between re-runs.
   */
  onExportsChange(fn) {
    this._exportListeners.add(fn);
    return () => this._exportListeners.delete(fn);
  }
  onImportsChange(fn) {
    this._importListeners.add(fn);
    return () => this._importListeners.delete(fn);
  }
  // ── Markup (see Markup.ts) ──
  initMarkup() {
    const self = this;
    this.markup = new MarkupOverlay({
      viewport: this.viewportEl.parentElement,
      title: this.config.title ?? "sketch",
      hitAt: (x, y) => this.renderer.hitAt(x, y),
      groundAt: (x, y) => this.renderer.groundAt(x, y),
      snapshotPng: () => this.renderer.snapshotPng(),
      describe: (id) => this.describeObject(id),
      context: () => this.markupContext(),
      setTracking(on) {
        if (on === self._trackSource) return;
        self._trackSource = on;
        if (on) self.runSketch();
      }
    });
    this.bridge = installAgentBridge({
      owner: this,
      harness: "sketch",
      store: this.store,
      snapshot: (opts) => this.markup.capture(opts),
      camera: (pos, target) => {
        this.renderer.setCameraPosition(pos[0], pos[1], pos[2]);
        if (target) this.renderer.lookAt(target[0], target[1], target[2]);
      }
    });
  }
  describeObject(id) {
    return describeSceneObject(this.scene, id, this._srcById.get(id));
  }
  /** Camera, params, logs, errors and a scene summary grouped by (layer, label, type, source line). */
  markupContext() {
    return {
      harness: "sketch",
      ...sceneSummary(this.scene, this.renderer, (id) => this.describeObject(id)),
      up: this.config.up ?? "y",
      params: this.store.getAll(),
      logs: this.logs.map((l) => ({ ...l })),
      errors: this.bridge?.errors() ?? []
    };
  }
  /**
   * Export ▾ / Import ▾ in the sketch's own header, from `lab.registerExport/registerImport`.
   * Without a header (inside a shell) the shell's top bar shows them instead. Rebuilt only
   * when the registered names change, not on every re-run.
   */
  renderFileMenus() {
    const host = this._fileMenusEl;
    if (!host) return;
    const sig = [...this.exports.keys()].join("\0") + "|" + [...this.imports.keys()].join("\0");
    if (sig === this._fileMenusSig) return;
    this._fileMenusSig = sig;
    host.innerHTML = "";
    const t = this.theme;
    const menu = (label, items) => {
      if (!items.length) return;
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative;";
      const btn = document.createElement("button");
      btn.textContent = `${label} \u25BE`;
      btn.style.cssText = `font:12px ${t.font};padding:4px 10px;border-radius:4px;cursor:pointer;
        background:${t.panelBg};color:${t.text};border:1px solid ${t.controlBorder};`;
      const list = document.createElement("div");
      list.style.cssText = `position:absolute;right:0;top:calc(100% + 4px);min-width:180px;z-index:30;display:none;
        background:${t.panelBg};border:1px solid ${t.controlBorder};border-radius:6px;padding:4px;box-shadow:0 4px 16px rgba(0,0,0,.3);`;
      for (const it of items) {
        const b = document.createElement("button");
        b.textContent = it.name;
        if (it.title) b.title = it.title;
        b.style.cssText = `display:block;width:100%;text-align:left;font:12px ${t.font};padding:6px 10px;border:0;border-radius:4px;
          background:transparent;color:${t.text};cursor:pointer;`;
        b.addEventListener("mouseenter", () => {
          b.style.background = t.hoverBg;
        });
        b.addEventListener("mouseleave", () => {
          b.style.background = "transparent";
        });
        b.addEventListener("click", async () => {
          list.style.display = "none";
          try {
            await it.run();
          } catch (e) {
            console.error(`tekto ${label.toLowerCase()} "${it.name}":`, e);
          }
        });
        list.appendChild(b);
      }
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = list.style.display === "none";
        for (const l of host.querySelectorAll("[data-tekto-menu]")) l.style.display = "none";
        list.style.display = open ? "block" : "none";
      });
      list.dataset.tektoMenu = "";
      document.addEventListener("click", () => {
        list.style.display = "none";
      });
      wrap.append(btn, list);
      host.appendChild(wrap);
    };
    menu("Export", this.getExports().map((it) => ({
      name: it.name,
      title: `Download as ${it.fileName}`,
      run: async () => download(await it.handler(), it.fileName, it.mimeType ? { type: it.mimeType } : {})
    })));
    menu("Import", this.getImports().map((it) => ({
      name: it.name,
      run: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = it.accept ?? "";
        input.onchange = async () => {
          const f = input.files?.[0];
          if (f) await it.handler(f);
        };
        input.click();
      }
    })));
  }
  /** The current value of every control, keyed for `setParams` — save it to reopen a design. */
  getParams() {
    return { ...this.store.getAll() };
  }
  /**
   * Set controls by label ("Radius"), "Group:Label" or key — e.g. the object `getParams()`
   * returned — and re-run once. Reports names it could not apply instead of dropping them.
   */
  setParams(values) {
    return this.store.setByName(values);
  }
  /** Destroy the sketch and clean up */
  dispose() {
    this.disposed = true;
    this.markup?.dispose();
    this.bridge?.dispose();
    if (this._boundKeyDown) window.removeEventListener("keydown", this._boundKeyDown);
    if (this._boundKeyUp) window.removeEventListener("keyup", this._boundKeyUp);
    this._boundKeyDown = null;
    this._boundKeyUp = null;
    this.panel.dispose();
    this.renderer.dispose();
  }
};
function callSite() {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 40;
  const stack = new Error().stack ?? "";
  Error.stackTraceLimit = limit;
  for (const line of stack.split("\n").slice(1)) {
    const m = line.match(/(https?:\/\/[^\s)]+):(\d+):(\d+)/) ?? line.match(/@(\S+):(\d+):(\d+)$/);
    if (!m) continue;
    const url = m[1];
    if (/\/tekto\/(src|dist)\/|node_modules|\/@vite\/|\/@fs\/.*\/tekto\/src\//.test(url)) continue;
    return `${url}:${m[2]}:${m[3]}`;
  }
  return void 0;
}

// src/sketch/AppShell.ts
function appShell(config) {
  const t = getTheme(config.theme);
  const panelWidth = config.panelWidth ?? 260;
  const root = document.createElement("div");
  root.style.cssText = `
    display:grid; grid-template-columns:${panelWidth}px 1fr;
    grid-template-rows:36px 1fr;
    width:100%; height:100%; font-family:${t.font};
    font-size:12px; color:${t.text}; background:${t.panelBg};
  `;
  const header = document.createElement("div");
  header.style.cssText = `
    grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
    background:${t.panelBg}; border-bottom:1px solid ${t.border};
  `;
  header.innerHTML = `
    <span style="font-weight:600;font-size:14px;color:${t.accent}">
      &#x2B21; ${config.title ?? "Tekto App"}
    </span>
    <span style="font-size:9px;padding:2px 6px;border-radius:3px;
      background:${t.hoverBg};color:${t.accent}">LIVE</span>
  `;
  root.appendChild(header);
  const panelEl = document.createElement("div");
  panelEl.style.cssText = `
    overflow-y:auto; overflow-x:hidden; padding:0;
    background:${t.panelBg}; border-right:1px solid ${t.border};
  `;
  root.appendChild(panelEl);
  const vpWrap = document.createElement("div");
  vpWrap.style.cssText = "position:relative;overflow:hidden;";
  const viewportEl = document.createElement("div");
  viewportEl.style.cssText = "width:100%;height:100%;";
  vpWrap.appendChild(viewportEl);
  const statusEl = document.createElement("div");
  statusEl.style.cssText = `
    position:absolute; bottom:12px; left:12px;
    padding:8px 12px; border-radius:6px;
    background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
    font-size:11px; line-height:1.7; color:${t.textDim};
    pointer-events:none; max-width:340px;
    border:1px solid rgba(22,24,42,.8);
    white-space:pre; font-family:${t.font};
    display:none;
  `;
  vpWrap.appendChild(statusEl);
  root.appendChild(vpWrap);
  config.container.appendChild(root);
  const params = new ParamStore(config.params);
  const panel = new ControlPanel({ store: params, theme: t });
  const groups = config.groups ?? { Parameters: Object.keys(config.params) };
  const items = [];
  for (const [groupName, keys] of Object.entries(groups)) {
    for (const key of keys) items.push({ key, group: groupName });
  }
  panel.render(items);
  panelEl.appendChild(panel.el);
  const scene = new Scene();
  const renderer = new ThreeRenderer(scene, viewportEl, {
    backgroundColor: config.background ?? 658196,
    cameraPosition: config.camera ?? [6, 8, 10],
    cameraTarget: config.target ?? [0, 0, 0],
    // Z-up by default — matches the tekto convention (XY = ground plane) and
    // the architectural / BIM / voxel geometry these apps usually build. Pass
    // `up: "y"` if you're showing the Y-up built-in primitives (box/cylinder/sphere).
    up: config.up ?? "z",
    ...config.renderer
  });
  if (config.topBar !== false) {
    buildTopBar(header, scene, renderer, t);
  }
  let buildFn = null;
  let displayFn = null;
  params.onChange((key) => {
    const def = params.getDef(key);
    if (def?.display) {
      displayFn?.();
    } else {
      buildFn?.();
      displayFn?.();
    }
  });
  let animateFn = null;
  let lastTime = performance.now();
  let startTime = lastTime;
  let disposed = false;
  function loop() {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1e3, 1 / 15);
    lastTime = now;
    if (animateFn) animateFn(dt, (now - startTime) / 1e3);
    renderer.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  let statusText = "";
  const instance = {
    params,
    scene,
    renderer,
    panel,
    onAnimate(fn) {
      animateFn = fn;
    },
    onBuild(fn) {
      buildFn = fn;
    },
    onDisplay(fn) {
      displayFn = fn;
    },
    rebuild() {
      buildFn?.();
      displayFn?.();
    },
    status(text) {
      statusText = text;
      if (text) {
        statusEl.textContent = text;
        statusEl.style.display = "block";
      } else {
        statusEl.style.display = "none";
      }
    },
    dispose() {
      disposed = true;
      bridge.dispose();
      panel.dispose();
      renderer.dispose();
      config.container.removeChild(root);
    }
  };
  const bridge = installAgentBridge({
    owner: instance,
    harness: "appShell",
    store: params,
    snapshot: (opts) => plainBundle({
      ...opts,
      title: config.title ?? "app",
      harness: "appShell",
      png: renderer.snapshotPng(),
      viewport: { width: viewportEl.clientWidth, height: viewportEl.clientHeight },
      context: {
        ...sceneSummary(scene, renderer, (id) => describeSceneObject(scene, id)),
        up: config.up ?? "z",
        params: params.getAll(),
        logs: statusText ? [{ label: "status", value: statusText }] : [],
        errors: bridge.errors()
      }
    }),
    camera: (pos, target) => {
      renderer.setCameraPosition(pos[0], pos[1], pos[2]);
      if (target) renderer.lookAt(target[0], target[1], target[2]);
    }
  });
  return instance;
}
function buildTopBar(header, scene, renderer, t) {
  const bar = document.createElement("div");
  bar.style.cssText = "margin-left:auto; display:flex; align-items:center; gap:16px;";
  header.appendChild(bar);
  const tag = (label) => {
    const el = document.createElement("span");
    el.textContent = label;
    el.style.cssText = `color:${t.textFaint}; text-transform:uppercase; letter-spacing:1px; font-size:9px;`;
    return el;
  };
  function segmented(opts, initial, onSel) {
    const wrap = document.createElement("div");
    wrap.style.cssText = `display:flex; border:1px solid ${t.border}; border-radius:5px; overflow:hidden;`;
    const btns = [];
    const set = (val) => {
      for (const [b, v] of btns) {
        const on = v === val;
        b.style.background = on ? t.accent : "transparent";
        b.style.color = on ? t.panelBg : t.textDim;
      }
    };
    for (const [label, val] of opts) {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = "padding:3px 9px; border:0; background:transparent; font:inherit; font-size:11px; cursor:pointer;";
      b.onclick = () => {
        set(val);
        onSel(val);
      };
      wrap.appendChild(b);
      btns.push([b, val]);
    }
    set(initial);
    return wrap;
  }
  const group = (label, control) => {
    const g = document.createElement("div");
    g.style.cssText = "display:flex; align-items:center; gap:6px;";
    g.append(tag(label), control);
    return g;
  };
  bar.appendChild(group("Light", segmented(
    [["Flat", "flat"], ["Studio", "studio"]],
    "flat",
    (v) => scene.setLightingMode(v)
  )));
  bar.appendChild(group("Mode", segmented(
    [["Solid", "solid"], ["Wire", "wireframe"], ["Hidden", "hiddenline"]],
    "solid",
    (v) => scene.setRenderMode(v)
  )));
  bar.appendChild(group("Cam", segmented(
    [["Persp", "persp"], ["Iso", "iso"]],
    "persp",
    (v) => {
      if (v === "iso") {
        renderer.setProjection("perspective");
        const c = renderer.controls;
        if (c) {
          const target = c.target;
          const step = renderer.camera.position.distanceTo(target) / Math.sqrt(3);
          renderer.setCameraPosition(target.x + step, target.y - step, target.z + step);
          c.update();
        }
        renderer.setProjection("orthographic");
      } else {
        renderer.setProjection("perspective");
      }
    }
  )));
  bar.appendChild(buildSun(renderer, t));
}
function buildSun(renderer, t) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;";
  const btn = document.createElement("button");
  btn.innerHTML = "&#x2600;&#xFE0E; Sun &#x25BE;";
  btn.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
  wrap.appendChild(btn);
  const pop = document.createElement("div");
  pop.style.cssText = `position:absolute; top:130%; right:0; z-index:50; display:none; flex-direction:column; gap:8px;
    padding:12px; border:1px solid ${t.border}; border-radius:8px; background:${t.panelBg};
    box-shadow:0 8px 24px rgba(0,0,0,.45); width:228px;`;
  wrap.appendChild(pop);
  btn.onclick = () => {
    pop.style.display = pop.style.display === "none" ? "flex" : "none";
  };
  const state = { lat: 47.37, lon: 8.55, month: 6, day: 21, hour: 13 };
  const readout = document.createElement("div");
  readout.style.cssText = `font-size:10px; color:${t.textDim}; font-family:${t.font};`;
  const apply = () => {
    const date = new Date(Date.UTC(2025, state.month - 1, state.day, Math.floor(state.hour), Math.round(state.hour % 1 * 60)));
    const sun = SunPosition.compute({ date, latitude: state.lat, longitude: state.lon });
    renderer.setSunDirection(sun.direction);
    const deg = (r) => Math.round(r * 180 / Math.PI);
    readout.textContent = `alt ${deg(sun.altitude)}\xB0  az ${deg(sun.azimuth)}\xB0  ${sun.isDaytime ? "day" : "night"}`;
  };
  const num = (label, value, min, max, step, onCh) => {
    const r = document.createElement("label");
    r.style.cssText = `display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; color:${t.textDim};`;
    const sp = document.createElement("span");
    sp.textContent = label;
    const i = document.createElement("input");
    i.type = "number";
    i.value = String(value);
    i.min = String(min);
    i.max = String(max);
    i.step = String(step);
    i.style.cssText = `width:84px; padding:2px 5px; background:${t.fieldBg}; border:1px solid ${t.border}; border-radius:4px; color:inherit; font:inherit; font-size:11px;`;
    i.oninput = () => onCh(Number(i.value));
    r.append(sp, i);
    return r;
  };
  pop.append(
    num("Latitude", state.lat, -90, 90, 0.1, (v) => {
      state.lat = v;
      apply();
    }),
    num("Longitude", state.lon, -180, 180, 0.1, (v) => {
      state.lon = v;
      apply();
    }),
    num("Month", state.month, 1, 12, 1, (v) => {
      state.month = v;
      apply();
    }),
    num("Day", state.day, 1, 31, 1, (v) => {
      state.day = v;
      apply();
    })
  );
  const hourWrap = document.createElement("label");
  hourWrap.style.cssText = `display:flex; flex-direction:column; gap:4px; font-size:11px; color:${t.textDim};`;
  const hourLabel = document.createElement("span");
  hourLabel.textContent = "Hour 13:00";
  const hour = document.createElement("input");
  hour.type = "range";
  hour.min = "0";
  hour.max = "24";
  hour.step = "0.25";
  hour.value = "13";
  hour.className = "tekto-slider";
  hour.style.cssText = `cursor:pointer;--tekto-track:${t.controlBorder};--tekto-thumb:${t.accent};`;
  hour.oninput = () => {
    state.hour = Number(hour.value);
    const h = Math.floor(state.hour), m = Math.round(state.hour % 1 * 60);
    hourLabel.textContent = `Hour ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    apply();
  };
  hourWrap.append(hourLabel, hour);
  pop.append(hourWrap, readout);
  apply();
  return wrap;
}

// src/collab/PresenceBar.ts
var STATUS_COL = { online: "#2f9e44", connecting: "#f08c00", offline: "#adb5bd", error: "#e03131" };
var PresenceBar = class {
  constructor(store, host, opts = {}) {
    this.store = store;
    this.opts = opts;
    this.unsubs = [];
    this.el = document.createElement("div");
    this.el.style.cssText = `position:absolute;${opts.position ?? "top:10px;right:100px;"}z-index:22;display:flex;gap:6px;align-items:center;font:12px system-ui,sans-serif;background:#fff;border:1px solid #d0d0d6;border-radius:7px;padding:3px 6px;box-shadow:0 2px 8px rgba(0,0,0,.12);`;
    this.dot = document.createElement("span");
    this.dot.style.cssText = "width:8px;height:8px;border-radius:50%;display:inline-block;";
    this.people = document.createElement("div");
    this.people.style.cssText = "display:flex;gap:3px;align-items:center;";
    this.btn = document.createElement("button");
    this.btn.style.cssText = "font:12px system-ui,sans-serif;padding:3px 8px;border-radius:5px;border:1px solid #d0d0d6;background:#fff;color:#222;cursor:pointer;";
    this.btn.addEventListener("click", () => void (store.user ? store.signOut() : store.signIn()));
    this.el.append(this.dot, this.people, this.btn);
    host.appendChild(this.el);
    this.unsubs.push(store.onPresence(() => this.render()), store.onStatus(() => this.render()), store.onUser(() => this.render()));
    this.render();
  }
  destroy() {
    for (const u of this.unsubs) u();
    this.el.remove();
  }
  render() {
    const st = this.store.status;
    this.dot.style.background = STATUS_COL[st];
    this.dot.title = `shared editing: ${st}`;
    const user = this.store.user;
    this.btn.textContent = user ? "Sign out" : "Sign in";
    this.btn.title = user ? `Signed in as ${user.name}` : "Sign in to edit together";
    this.people.replaceChildren();
    const seen = /* @__PURE__ */ new Set();
    for (const p of this.store.presence) {
      if (seen.has(p.user.id)) continue;
      seen.add(p.user.id);
      const b = document.createElement("span");
      const me = p.session === this.store.session;
      b.style.cssText = `width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:600 10px system-ui,sans-serif;color:#fff;background:${p.color};box-shadow:0 0 0 2px ${me ? "#222" : "#fff"};overflow:hidden;`;
      if (p.user.avatarUrl) {
        const img = document.createElement("img");
        img.src = p.user.avatarUrl;
        img.alt = "";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        b.appendChild(img);
      } else {
        b.textContent = p.user.name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
      }
      const what = this.opts.describe?.(p);
      b.title = `${p.user.name}${me ? " (you)" : ""}${what ? ` \u2014 ${what}` : ""}`;
      this.people.appendChild(b);
    }
  }
};
export {
  AABB,
  Algo,
  ArcCurve,
  BalloonFrame,
  BlobDetect,
  BspTree,
  Callouts,
  Capsule2D,
  CltConstruction,
  ControlPanel,
  CubicBezierCurve,
  Curvature,
  CurveUtils,
  DEFAULT_BACKGROUND,
  Delaunay2D,
  DistanceTransform,
  DxfExporter,
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
  LayerPanel,
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
  NavGizmo,
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
  PresenceBar,
  Ray,
  RibbonEndTrim,
  RibbonFrame,
  RibbonJoint,
  RibbonOpening,
  RibbonSystem,
  RigidBody2D,
  SVGRenderer,
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
  SdfLine as SdfLineField,
  SdfMicrostructure,
  SdfMirror,
  SdfOffset,
  SdfOnion,
  SdfOps,
  SdfPlane as SdfPlaneField,
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
  SharedStore,
  Sketch2DInstance,
  SketchInstance,
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
  ThreeRenderer,
  Triangle,
  Vec2,
  Vec3,
  Vec4,
  VecMath,
  Viewport,
  VoxelGrid,
  VoxelGrid2D,
  Wall,
  WallJoint,
  WallOpening,
  WallSystem,
  WallType,
  appShell,
  boundingWalls,
  boxOf,
  buildCutList,
  chooseJoistDirection,
  clampedUniformKnots,
  closestPointOnSegment,
  cltLayers,
  collabColor,
  computeEffectiveVisibility,
  contactBetween,
  createLayout,
  createParams,
  createRandom,
  devServerAdapter,
  download,
  easeInOut,
  edgeOutwardVisibility,
  edgeStyle,
  extractVisiblePolylines,
  findAdjacent,
  fitRadius,
  getTheme,
  groundAppearance,
  hiddenLineIdBuffer,
  holzrahmenbauLayers,
  joistDirectionFromBounds,
  joistDirectionFromPCA,
  joistDirectionFromSupports,
  labelWidthFor,
  layoutLabels,
  lightBalance,
  lineClipPolygon,
  memoryAdapter,
  modeBackground,
  nearestAxis,
  neighboursOf,
  noise,
  orbitFor,
  orthoFrustum,
  perpVisibility,
  perpVisibilityOfPolys,
  polygonFromVertices,
  polygonIntersection,
  polylinesToSVG,
  processWorkerRequest,
  realize,
  realizeSlab,
  repelBodies,
  reverse as reverseContact,
  sectionAppearance,
  segmentSegmentClosest,
  setClipSnap,
  shortestTurn,
  sketch,
  sketch2d,
  stampName,
  standardOrbit,
  supabaseAdapter,
  surfaceAppearance,
  writeDxf2D,
  writeDxf3D
};
