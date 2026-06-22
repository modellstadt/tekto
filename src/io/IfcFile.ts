/**
 * Tekto IFC import — wraps `web-ifc` (WASM) to extract triangle geometry
 * from an IFC file as one fused FlatMeshData. Suitable for context geometry
 * (buildings, sites) where per-element selection is not needed.
 *
 * `web-ifc` is loaded via dynamic import so it stays out of the main Tekto
 * bundle. Apps that use IfcFile must install it themselves:
 *
 *   npm install web-ifc
 *
 * The wasm binary (web-ifc.wasm) must be reachable from the browser. Easiest
 * setup: copy node_modules/web-ifc/web-ifc.wasm to your app's public/ folder
 * and call IfcFile.parse(buf, { wasmPath: '/' }).
 *
 * Example:
 *   const buf  = await fetch('/site.ifc').then(r => r.arrayBuffer());
 *   const mesh = await IfcFile.parse(buf, { wasmPath: '/' });
 *   lab.flatMesh(mesh);
 */
import type { MeshData as FlatMeshData } from "../core/geometry/mesh/Mesh";

export interface IfcParseOptions {
  /** Directory (with trailing slash) where web-ifc.wasm is served. Default: '/'. */
  wasmPath?: string;
  /** Recenter the mesh so its bbox center sits at the origin. Avoids large
   *  site offsets (e.g. UTM coordinates) blowing up float precision in WebGL.
   *  Default: true. */
  recenter?: boolean;
  /** Optional progress / stats callback. */
  onProgress?: (msg: string) => void;
}

export const IfcFile = {
  /**
   * Parse an IFC file (as ArrayBuffer) into a single fused FlatMeshData.
   * All elements are merged; no per-element groups are produced.
   */
  async parse(buffer: ArrayBuffer, options: IfcParseOptions = {}): Promise<FlatMeshData> {
    const wasmPath = options.wasmPath ?? "/";
    const recenter = options.recenter ?? true;
    const log      = options.onProgress ?? (() => {});

    // Dynamic import — keeps web-ifc out of the main Tekto bundle.
    // web-ifc is an OPTIONAL peer dependency: only apps that actually call
    // IfcFile install it, so it may be absent when the library itself is built.
    // Resolved at runtime by the consumer.
    // @ts-ignore - optional peer dependency, not present in the library's own build
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

    // Growable scratch buffers — finalised to typed arrays at the end
    const positions: number[] = [];
    const normals:   number[] = [];
    const indices:   number[] = [];

    const t1 = performance.now();
    let meshCount = 0;
    api.StreamAllMeshes(modelID, (flatMesh: any) => {
      const placedGeoms = flatMesh.geometries;
      const n = placedGeoms.size();
      for (let i = 0; i < n; i++) {
        const placed = placedGeoms.get(i);
        const geom   = api.GetGeometry(modelID, placed.geometryExpressID);
        const verts  = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
        const idxs   = api.GetIndexArray (geom.GetIndexData(),  geom.GetIndexDataSize());

        // 4x4 column-major placement matrix
        const m = placed.flatTransformation;
        const baseVertex = positions.length / 3;

        // web-ifc returns interleaved [px, py, pz, nx, ny, nz] per vertex
        for (let v = 0; v < verts.length; v += 6) {
          const x = verts[v],     y = verts[v + 1], z = verts[v + 2];
          const nx = verts[v + 3], ny = verts[v + 4], nz = verts[v + 5];

          // Position: full affine transform
          positions.push(
            m[0] * x + m[4] * y + m[8]  * z + m[12],
            m[1] * x + m[5] * y + m[9]  * z + m[13],
            m[2] * x + m[6] * y + m[10] * z + m[14],
          );
          // Normal: rotation only, drop translation
          // (assumes near-rigid transform — fine for IFC element placements)
          normals.push(
            m[0] * nx + m[4] * ny + m[8]  * nz,
            m[1] * nx + m[5] * ny + m[9]  * nz,
            m[2] * nx + m[6] * ny + m[10] * nz,
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

    // Recenter to model origin so distant site coordinates don't break WebGL precision
    if (recenter && positions.length > 0) {
      let minX =  Infinity, minY =  Infinity, minZ =  Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i]     -= cx;
        positions[i + 1] -= cy;
        positions[i + 2] -= cz;
      }
      log(`recentered: bbox center was (${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)})`);
    }

    // Renormalise — the matrix transform above doesn't account for non-uniform scale
    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 1e-9) {
        normals[i]     = nx / len;
        normals[i + 1] = ny / len;
        normals[i + 2] = nz / len;
      }
    }

    return {
      positions: new Float32Array(positions),
      normals:   new Float32Array(normals),
      indices:   new Uint32Array(indices),
    };
  },
};
