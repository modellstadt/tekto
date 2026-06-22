/**
 * GPU-accelerated hidden-line removal using ID buffer rendering.
 *
 * Pipeline:
 *  1. Render all front-facing triangles to an offscreen ID buffer (each pixel = triangle index)
 *  2. For each edge, walk its projected pixels via DDA
 *  3. Classify each pixel as visible (background or adjacent triangle) or occluded
 *  4. Detect transition points along the edge, output exact vector segments
 *
 * Advantages over CPU ray casting:
 *  - GPU depth test handles intersecting/overlapping meshes naturally
 *  - No depth bias, no adjacency heuristics beyond 1-ring skip
 *  - Resolution-independent vector output (raster only determines WHERE transitions happen)
 */

import * as THREE from 'three';
import type { DxfView, DxfSegment } from './DxfExporter';
import { Vec3 } from '../core/math/vectors';

// ── Types ────────────────────────────────────────────────────────────────────

export interface IdBufferOptions {
  /** ID buffer resolution (square). Default: 2048. Higher = more accurate transitions. */
  resolution?: number;
  /** Show only visible edges (false) or both visible + occluded (true). Default: false. */
  debugLayers?: boolean;
  /** Negate u-coordinates in output. Use when viewDir is flipped relative to the
   *  non-HL projection to correct mirroring. Default: false. */
  flipU?: boolean;
  /**
   * Layer names that bypass the debugLayers classification and keep their original
   * name. Only their *visible* segments are output (occluded ones are dropped).
   * Useful for "soft" / tessellation edges that should always appear as their own
   * layer regardless of visibility classification.
   */
  preserveLayers?: string[];
}

interface IEdgeLite {
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  layer: string;
  adjTris?: number[];
  /** Face normals of the triangles sharing this edge — for front/back classification. */
  adjNormals?: [number, number, number][];
}

// ── Shaders ──────────────────────────────────────────────────────────────────

const ID_VERTEX_SHADER = /* glsl */ `
  attribute float objectId;
  varying float vId;
  void main() {
    vId = objectId;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ID_FRAGMENT_SHADER = /* glsl */ `
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
`;

// ── Main function ────────────────────────────────────────────────────────────

/**
 * Compute hidden-line segments using GPU ID buffer rendering.
 *
 * @param positions - Float32Array of vertex positions (x,y,z interleaved)
 * @param indices - Uint32Array of triangle indices
 * @param edges - Edge list with 3D endpoints, layer, and adjacency info
 * @param triNormals - Per-triangle face normals for back-face culling [optional]
 * @param view - Orthographic view direction
 * @param options - Resolution and debug settings
 */
export function hiddenLineIdBuffer(
  positions: Float32Array,
  indices: Uint32Array,
  edges: IEdgeLite[],
  _triNormals: [number, number, number][] | null,
  view: DxfView,
  options?: IdBufferOptions,
): DxfSegment[] {
  const resolution = options?.resolution ?? 2048;
  const debugLayers = options?.debugLayers ?? false;
  const preserveSet = new Set(options?.preserveLayers ?? []);

  // ── View basis (matches DxfExporter._basis) ──
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  let fx = view.viewDir.x, fy = view.viewDir.y, fz = view.viewDir.z;
  const fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;
  let rx = upDir.y * fz - upDir.z * fy;
  let ry = upDir.z * fx - upDir.x * fz;
  let rz = upDir.x * fy - upDir.y * fx;
  const rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rl; ry /= rl; rz /= rl;
  const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;

  function proj(x: number, y: number, z: number) {
    return {
      u: x * rx + y * ry + z * rz,
      v: x * ux + y * uy + z * uz,
      d: x * fx + y * fy + z * fz,
    };
  }

  // ── Compute scene bounds in view space ──
  const nVerts = positions.length / 3;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  let minD = Infinity, maxD = -Infinity;
  for (let i = 0; i < nVerts; i++) {
    const p = proj(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    if (p.u < minU) minU = p.u; if (p.u > maxU) maxU = p.u;
    if (p.v < minV) minV = p.v; if (p.v > maxV) maxV = p.v;
    if (p.d < minD) minD = p.d; if (p.d > maxD) maxD = p.d;
  }
  // Add margin
  const margin = Math.max(maxU - minU, maxV - minV) * 0.02;
  minU -= margin; maxU += margin; minV -= margin; maxV += margin;
  const depthRange = maxD - minD || 1;
  minD -= depthRange * 0.1; maxD += depthRange * 0.1;

  // No back-face culling on triangles — render ALL triangles and let the GPU
  // depth test pick the closest surface. This avoids projection mirroring issues
  // when flipping viewDir. Back-facing edges are still filtered by adjNormals below.
  const nTri = indices.length / 3;

  // ── Build Three.js scene for ID rendering ──
  const scene = new THREE.Scene();

  // Camera: ortho looking along -Z (Three.js default).
  // View-space Z = -d, so closer-to-camera = larger Z.
  const camZ = -minD + 1;
  const farZ = -minD - (-maxD) + 2;
  const camera = new THREE.OrthographicCamera(minU, maxU, maxV, minV, 0.5, farZ);
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, camZ - 1);

  // Build NON-INDEXED geometry: duplicate vertices per triangle so each triangle
  // gets its own objectId without interference from shared vertices.
  const triPositions = new Float32Array(nTri * 9);
  const objectIds = new Float32Array(nTri * 3);

  for (let ti = 0; ti < nTri; ti++) {
    const origId = ti + 1; // +1 so 0 = background
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
  geom.setAttribute('position', new THREE.BufferAttribute(triPositions, 3));
  geom.setAttribute('objectId', new THREE.BufferAttribute(objectIds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: ID_VERTEX_SHADER,
    fragmentShader: ID_FRAGMENT_SHADER,
    side: THREE.DoubleSide, // let GPU depth test decide, we already culled back-faces
    depthTest: true,
    depthWrite: true,
  });

  scene.add(new THREE.Mesh(geom, material));

  // ── Render to offscreen target ──
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(resolution, resolution);
  renderer.setClearColor(new THREE.Color(0, 0, 0), 0); // clear to (0,0,0,0)

  const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  });

  renderer.setRenderTarget(renderTarget);
  renderer.clear();
  renderer.render(scene, camera);

  // Read pixels
  const pixels = new Uint8Array(resolution * resolution * 4);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, resolution, resolution, pixels);

  // Cleanup GPU resources. `renderer.dispose()` alone doesn't release the
  // underlying WebGL context — without `forceContextLoss` the browser hits
  // its ~16-context cap after a few calls and refuses to create a new one.
  renderer.setRenderTarget(null);
  renderTarget.dispose();
  geom.dispose();
  material.dispose();
  try { renderer.forceContextLoss(); } catch { /* no-op */ }
  renderer.dispose();

  // ── Helper: read triangle ID at pixel (px, py) ──
  // Returns 0 for background, or original-triangle-index + 1
  function readId(px: number, py: number): number {
    if (px < 0 || px >= resolution || py < 0 || py >= resolution) return 0;
    const idx = (py * resolution + px) * 4;
    const a = pixels[idx + 3];
    if (a === 0) return 0; // background
    return pixels[idx] + (pixels[idx + 1] << 8) + (pixels[idx + 2] << 16);
  }

  // ── Helper: world coords → pixel coords ──
  function toPixel(u: number, v: number): [number, number] {
    const px = ((u - minU) / (maxU - minU)) * resolution;
    const py = ((v - minV) / (maxV - minV)) * resolution;
    return [px, py];
  }

  // ── Process edges ──
  const result: DxfSegment[] = [];

  for (const edge of edges) {
    const ea = proj(edge.ax, edge.ay, edge.az);
    const eb = proj(edge.bx, edge.by, edge.bz);

    // Face-orientation check and silhouette detection.
    // Boundary edges (1 adjacent face) skip the back-face filter — they belong to
    // thin surfaces (e.g. imported OBJ walls) that are visible from both sides.
    const adjN = edge.adjNormals;
    let isSilhouette = false;
    if (adjN && adjN.length > 1) {
      const hasFrontFace = adjN.some(n => n[0] * fx + n[1] * fy + n[2] * fz <= 0.087);
      const hasBackFace  = adjN.some(n => n[0] * fx + n[1] * fy + n[2] * fz > 0.087);
      if (!hasFrontFace) {
        if (debugLayers) {
          result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: 'occluded' });
        }
        continue;
      }
      isSilhouette = hasFrontFace && hasBackFace;
    }

    const [px0, py0] = toPixel(ea.u, ea.v);
    const [px1, py1] = toPixel(eb.u, eb.v);

    // DDA line walk
    const dx = px1 - px0, dy = py1 - py0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps < 1) {
      // Very short edge — check single point
      const id = readId(Math.round(px0), Math.round(py0));
      const adj = edge.adjTris;
      const isVis = id === 0 || (adj != null && adj.indexOf(id - 1) >= 0);
      if (preserveSet.has(edge.layer)) {
        // Preserved layers: keep original name, only emit if visible
        if (isVis) result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: edge.layer });
      } else if (isVis) {
        const lyr = debugLayers ? (isSilhouette ? 'silhouette' : 'visible') : edge.layer;
        result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: lyr });
      } else if (debugLayers) {
        result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: 'occluded' });
      }
      continue;
    }

    const adj = edge.adjTris;
    const adjSet = adj ? new Set(adj) : null;
    const nSamples = Math.ceil(steps);

    // Helper: check visibility at a pixel with neighborhood sampling.
    // For thin geometry (tubes, rails), the edge's adjacent triangle may be
    // in a neighboring pixel rather than the exact pixel under the edge.
    function isVisibleAt(px: number, py: number): boolean {
      // Check 3x3 neighborhood — if ANY pixel shows an adjacent triangle, it's visible
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const id = readId(px + ox, py + oy);
          if (id === 0) return true; // background = visible
          if (adjSet != null && adjSet.has(id - 1)) return true;
        }
      }
      return false;
    }

    // Walk and classify each sample
    let prevVis = false;
    let runStart = 0; // t parameter where current run started
    let firstSample = true;

    for (let s = 0; s <= nSamples; s++) {
      const t = Math.min(s / nSamples, 1);
      const px = Math.round(px0 + dx * t);
      const py = Math.round(py0 + dy * t);
      const isVis = isVisibleAt(px, py);

      if (firstSample) {
        prevVis = isVis;
        runStart = t;
        firstSample = false;
        continue;
      }

      if (isVis !== prevVis) {
        // Transition — emit the run that just ended
        const tEnd = t;
        _emitRun(prevVis, runStart, tEnd);
        runStart = tEnd;
        prevVis = isVis;
      }
    }
    // Emit final run
    _emitRun(prevVis, runStart, 1);

    function _emitRun(visible: boolean, t0: number, t1: number) {
      if (t1 - t0 < 1e-7) return;
      const u0 = ea.u + (eb.u - ea.u) * t0;
      const v0 = ea.v + (eb.v - ea.v) * t0;
      const u1 = ea.u + (eb.u - ea.u) * t1;
      const v1 = ea.v + (eb.v - ea.v) * t1;
      if (preserveSet.has(edge.layer)) {
        // Preserved layers: keep original name, only emit if visible
        if (visible) result.push({ u0, v0, u1, v1, layer: edge.layer });
      } else if (visible) {
        const lyr = debugLayers ? (isSilhouette ? 'silhouette' : 'visible') : edge.layer;
        result.push({ u0, v0, u1, v1, layer: lyr });
      } else if (debugLayers) {
        result.push({ u0, v0, u1, v1, layer: 'occluded' });
      }
    }
  }

  if (options?.flipU) {
    for (const s of result) { s.u0 = -s.u0; s.u1 = -s.u1; }
  }

  return result;
}
