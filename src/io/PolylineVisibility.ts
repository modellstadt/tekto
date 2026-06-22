/**
 * Hidden-line removal for arbitrary 3D polylines (streamlines, sketched curves,
 * hatch lines, …) against a triangle mesh.
 *
 * Approach:
 *   1. Render the mesh into an offscreen Three.js render target whose fragment
 *      shader packs the view-space depth into RGBA8.
 *   2. For each polyline point, project to (u, v, d) in the same view space,
 *      sample the buffer at (u, v), unpack the surface depth, and compare:
 *      visible iff `d ≤ surfDepth + bias`.
 *   3. Split each polyline at visible/occluded transitions and emit the visible
 *      runs (in 3D, so the caller can keep them in-place — projection to 2D is
 *      a one-liner using the returned `view` basis).
 *
 * This is the same depth-test idea HDGEO's MeshStreamlineTracer leaves
 * unimplemented and the spec calls out as the "heavy step" of the curvature-
 * hatching pipeline. It mirrors the offscreen-render setup in
 * `IdBufferHiddenLine.ts`, but does depth-comparison instead of triangle-ID
 * match — which means it works for *any* 3D polyline, not just mesh edges.
 */
import * as THREE from "three";
import { Vec3 } from "../core/math/vectors";
import type { ConnectedMesh } from "../core/geometry/mesh/ConnectedMesh";

export interface VisibilityView {
  /** View direction (camera-to-target). The unit vector is fine. */
  viewDir: Vec3;
  /** World-up reference (defaults to +Y). */
  upDir?: Vec3;
}

export interface VisibilityOptions {
  /** Offscreen target resolution. Higher = sharper silhouettes. Default 1024. */
  resolution?: number;
  /** Depth tolerance, in fraction of the scene's view-depth range. Default 0.005.
   *  Increase if you see streamlines breaking up where they sit just above the
   *  mesh; decrease if back-side lines bleed through silhouettes. */
  bias?: number;
}

export interface ProjectedSegment {
  /** 2D points (u, v) in view space — ready for SVG / DXF. */
  points2D: { u: number; v: number }[];
  /** Original 3D points (for in-scene preview rendering). */
  points3D: Vec3[];
}

export interface VisibilityResult {
  /** Visible polyline chunks. Long polylines may yield multiple chunks. */
  segments: ProjectedSegment[];
  /** View bounds in 2D (the (u, v) range covered by the mesh's projection). */
  bounds: { minU: number; maxU: number; minV: number; maxV: number };
}

// ─── Shaders ──────────────────────────────────

// Pack a 0..1 depth value into 8 bits per channel, RGBA8. Three.js's
// `packDepthToRGBA` chunklet does this; inlined here so we don't depend on
// ShaderChunk lookup paths.
const DEPTH_PACK = /* glsl */ `
  vec4 packDepth(float d) {
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
    vec4 res = fract(d * bitShift);
    res -= res.xxyz * bitMask;
    return res;
  }
`;

const VS = /* glsl */ `
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
`;

const FS = /* glsl */ `
  precision highp float;
  varying float vDepth01;
  ${DEPTH_PACK}
  void main() { gl_FragColor = packDepth(vDepth01); }
`;

// ─── Public API ───────────────────────────────

export function extractVisiblePolylines(
  mesh: ConnectedMesh,
  polylines: Vec3[][],
  view: VisibilityView,
  options?: VisibilityOptions,
): VisibilityResult {
  const resolution = options?.resolution ?? 1024;
  const biasFraction = options?.bias ?? 0.005;

  // ── View basis (matches DxfExporter._basis / IdBufferHiddenLine) ──
  const up = view.upDir ?? new Vec3(0, 1, 0);
  let fx = view.viewDir.x, fy = view.viewDir.y, fz = view.viewDir.z;
  {
    const l = Math.hypot(fx, fy, fz) || 1;
    fx /= l; fy /= l; fz /= l;
  }
  let rx = up.y * fz - up.z * fy;
  let ry = up.z * fx - up.x * fz;
  let rz = up.x * fy - up.y * fx;
  {
    const l = Math.hypot(rx, ry, rz) || 1;
    rx /= l; ry /= l; rz /= l;
  }
  const ux = fy * rz - fz * ry;
  const uy = fz * rx - fx * rz;
  const uz = fx * ry - fy * rx;

  const proj = (x: number, y: number, z: number) => ({
    u: x * rx + y * ry + z * rz,
    v: x * ux + y * uy + z * uz,
    d: x * fx + y * fy + z * fz,
  });

  // ── Compute scene bounds in view space ──
  let minU = Infinity, maxU = -Infinity;
  let minV = Infinity, maxV = -Infinity;
  let minD = Infinity, maxD = -Infinity;

  // Triangulate the mesh while computing bounds — we'll feed the same vertices
  // to the GPU below.
  const verts: number[] = [];
  for (const face of mesh.faces()) {
    if (face.nodes.length < 3) continue;
    const ps = face.nodes.map(id => mesh.node(id)!.position);
    const p0 = ps[0];
    for (let i = 1; i < ps.length - 1; i++) {
      const a = p0, b = ps[i], c = ps[i + 1];
      for (const p of [a, b, c]) {
        const pr = proj(p.x, p.y, p.z);
        verts.push(pr.u, pr.v, pr.d);
        if (pr.u < minU) minU = pr.u; if (pr.u > maxU) maxU = pr.u;
        if (pr.v < minV) minV = pr.v; if (pr.v > maxV) maxV = pr.v;
        if (pr.d < minD) minD = pr.d; if (pr.d > maxD) maxD = pr.d;
      }
    }
  }

  if (verts.length === 0) {
    return { segments: [], bounds: { minU: 0, maxU: 0, minV: 0, maxV: 0 } };
  }

  // Margin so silhouette pixels aren't clipped at the buffer edge.
  const sceneSize = Math.max(maxU - minU, maxV - minV);
  const margin = sceneSize * 0.02;
  minU -= margin; maxU += margin; minV -= margin; maxV += margin;
  // Pad the depth range so polylines lifted off the surface don't fall outside [0, 1].
  const depthRange = (maxD - minD) || 1;
  const depthPad = depthRange * 0.1;
  minD -= depthPad; maxD += depthPad;

  // ── Build offscreen Three.js scene ──
  const triPositions = new Float32Array(verts);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(triPositions, 3));
  // Three.js uses right-handed -Z forward; we already projected onto our own
  // basis where +depth = away. Flip Z for the GPU so larger d → larger Z away.
  for (let i = 2; i < triPositions.length; i += 3) triPositions[i] = -triPositions[i];
  geo.attributes.position.needsUpdate = true;

  const material = new THREE.ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
    uniforms: { uMinD: { value: minD }, uMaxD: { value: maxD } },
  });

  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geo, material));

  const camZ = -minD + 1;
  const farZ = (maxD - minD) + 2;
  const camera = new THREE.OrthographicCamera(minU, maxU, maxV, minV, 0.5, farZ);
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, camZ - 1);

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(resolution, resolution);
  renderer.setClearColor(new THREE.Color(0, 0, 0), 0);

  const rt = new THREE.WebGLRenderTarget(resolution, resolution, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
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

  // ── Sample / classify polylines ──
  function unpackDepth01(px: number, py: number): number | null {
    if (px < 0 || px >= resolution || py < 0 || py >= resolution) return null;
    const idx = (py * resolution + px) * 4;
    if (pixels[idx + 3] === 0) return null; // background — no surface here
    // Reverse of packDepth: d = r*256³ + g*256² + b*256 + a, all in [0, 256), each / 256^k.
    const r = pixels[idx]     / 255;
    const g = pixels[idx + 1] / 255;
    const b = pixels[idx + 2] / 255;
    const a = pixels[idx + 3] / 255;
    return r / (256 * 256 * 256) + g / (256 * 256) + b / 256 + a;
  }

  function toPixel(u: number, v: number): [number, number] {
    return [
      Math.round(((u - minU) / (maxU - minU)) * (resolution - 1)),
      Math.round(((v - minV) / (maxV - minV)) * (resolution - 1)),
    ];
  }

  const bias01 = biasFraction;
  const segments: ProjectedSegment[] = [];

  function isVisible(p: Vec3): boolean {
    const pr = proj(p.x, p.y, p.z);
    const [px, py] = toPixel(pr.u, pr.v);
    // 3×3 neighborhood sample — robust to sub-pixel jitter at silhouettes.
    let best: number | null = null;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const s = unpackDepth01(px + ox, py + oy);
        if (s !== null && (best === null || s < best)) best = s;
      }
    }
    if (best === null) return true; // outside the mesh's silhouette → visible (sky)
    const d01 = (pr.d - minD) / (maxD - minD);
    return d01 <= best + bias01;
  }

  for (const poly of polylines) {
    if (poly.length < 2) continue;
    let run3: Vec3[] = [];
    let run2: { u: number; v: number }[] = [];
    for (const p of poly) {
      if (isVisible(p)) {
        run3.push(p);
        const pr = proj(p.x, p.y, p.z);
        run2.push({ u: pr.u, v: pr.v });
      } else if (run3.length >= 2) {
        segments.push({ points3D: run3, points2D: run2 });
        run3 = []; run2 = [];
      } else {
        run3 = []; run2 = [];
      }
    }
    if (run3.length >= 2) segments.push({ points3D: run3, points2D: run2 });
  }

  return { segments, bounds: { minU, maxU, minV, maxV } };
}

// ─── SVG helper ───────────────────────────────

export interface SVGOptions {
  /** Stroke width in SVG user units. Default 0.5. */
  strokeWidth?: number;
  /** Stroke color (any CSS color). Default "#000". */
  stroke?: string;
  /** Pad the viewBox by this fraction of scene size. Default 0.02. */
  padFraction?: number;
}

export function polylinesToSVG(
  segments: ProjectedSegment[],
  bounds: { minU: number; maxU: number; minV: number; maxV: number },
  options?: SVGOptions,
): string {
  const stroke = options?.stroke ?? "#000";
  const sw = options?.strokeWidth ?? 0.5;
  const pad = options?.padFraction ?? 0.02;

  const w = bounds.maxU - bounds.minU;
  const h = bounds.maxV - bounds.minV;
  const padX = w * pad;
  const padY = h * pad;
  const vbX = bounds.minU - padX;
  const vbY = -(bounds.maxV + padY);  // flip v so +v points up on paper
  const vbW = w + 2 * padX;
  const vbH = h + 2 * padY;

  const parts: string[] = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(4)} ${vbY.toFixed(4)} ${vbW.toFixed(4)} ${vbH.toFixed(4)}" ` +
    `fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">`
  );
  for (const seg of segments) {
    if (seg.points2D.length < 2) continue;
    const d = seg.points2D
      .map(p => `${p.u.toFixed(4)},${(-p.v).toFixed(4)}`)
      .join(" ");
    parts.push(`<polyline points="${d}"/>`);
  }
  parts.push(`</svg>\n`);
  return parts.join("\n");
}
