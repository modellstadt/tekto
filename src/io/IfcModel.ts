/**
 * Tekto IFC import, per element.
 *
 * `IfcFile.parse` fuses a model into one mesh, which is right for context
 * geometry and wrong for anything the user clicks: selection, a model tree and
 * property inspection all need the elements kept apart. `IfcModel.parse` keeps
 * them, each with its own mesh, its IFC class, its property sets and its
 * quantities, so an app can pick an element and ask questions about it.
 *
 * Same `web-ifc` dependency and the same setup as IfcFile: install it in the
 * app and serve `web-ifc.wasm`.
 *
 *   const buf   = await fetch('/model.ifc').then(r => r.arrayBuffer());
 *   const model = await IfcModel.parse(buf, { wasmPath: '/' });
 *   model.elements[0].ifcClass      // "IfcSlab"
 *   model.elements[0].properties    // { Width: 0.22, Span: 9.0, ... }
 *
 * Properties are flattened from every property set and quantity set into one
 * bag, because that is what a consumer usually wants, and the original sets are
 * kept alongside in `psets` for when the distinction matters.
 */
import type { MeshData } from "../core/geometry/mesh/Mesh";

export interface IfcParseElementsOptions {
  /** Directory (with trailing slash) where web-ifc.wasm is served. Default: '/'. */
  wasmPath?: string;
  /** Recentre every element by the model bounding-box centre. Default: true. */
  recenter?: boolean;
  /** Read property and quantity sets. Costs a round trip per element on large
   *  models, so it can be turned off for a geometry-only pass. Default: true. */
  properties?: boolean;
  /** Read the spatial structure (site / storey / space). Default: true. */
  tree?: boolean;
  onProgress?: (msg: string) => void;
}

export interface IfcElementData {
  expressID: number;
  /** "IfcSlab", "IfcWall", ... in IFC's own casing where web-ifc reports it. */
  ifcClass: string;
  name?: string;
  globalId?: string;
  mesh: MeshData;
  /** Every property and quantity, flattened. Later sets win on a name clash. */
  properties: Record<string, string | number | boolean>;
  /** The same values kept by their set name, when the origin matters. */
  psets: Record<string, Record<string, string | number | boolean>>;
}

export interface IfcSpatialNode {
  expressID: number;
  ifcClass: string;
  name?: string;
  children: IfcSpatialNode[];
}

export interface IfcModelData {
  elements: IfcElementData[];
  tree?: IfcSpatialNode;
  /** Offset subtracted from every vertex when `recenter` is on. */
  center: [number, number, number];
}

/** IFC spells the same quantity many ways; this only normalises the casing. */
function titleCase(name: string): string {
  if (!name) return name;
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function readValue(v: any): string | number | boolean | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== "object") return v;
  if ("value" in v) return v.value;
  return undefined;
}

/** Pull name/value pairs out of a property set or a quantity set. */
function flattenSet(set: any): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  const entries = set?.HasProperties ?? set?.Quantities ?? [];
  for (const p of entries) {
    const name = readValue(p?.Name);
    if (typeof name !== "string") continue;
    const value =
      readValue(p?.NominalValue) ??
      readValue(p?.LengthValue) ??
      readValue(p?.AreaValue) ??
      readValue(p?.VolumeValue) ??
      readValue(p?.CountValue) ??
      readValue(p?.WeightValue) ??
      readValue(p?.TimeValue);
    if (value !== undefined) out[name] = value;
  }
  return out;
}

export const IfcModel = {
  /**
   * Parse an IFC file into its elements, each with geometry and properties.
   */
  async parse(buffer: ArrayBuffer, options: IfcParseElementsOptions = {}): Promise<IfcModelData> {
    const wasmPath = options.wasmPath ?? "/";
    const recenter = options.recenter ?? true;
    const wantProps = options.properties ?? true;
    const wantTree = options.tree ?? true;
    const log = options.onProgress ?? (() => {});

    // @ts-ignore - optional peer dependency, resolved by the consuming app
    const { IfcAPI } = await import("web-ifc");
    const api = new IfcAPI();
    api.SetWasmPath(wasmPath);
    await api.Init();

    const modelID = api.OpenModel(new Uint8Array(buffer));
    if (modelID < 0) throw new Error("IfcModel.parse: failed to open IFC model");

    // ── geometry, kept per element ───────────────────────────────────────
    const raw: { expressID: number; positions: number[]; normals: number[]; indices: number[] }[] = [];
    const t0 = performance.now();
    api.StreamAllMeshes(modelID, (flatMesh: any) => {
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      const geoms = flatMesh.geometries;
      for (let i = 0; i < geoms.size(); i++) {
        const placed = geoms.get(i);
        const geom = api.GetGeometry(modelID, placed.geometryExpressID);
        const verts = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
        const idxs = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());
        const m = placed.flatTransformation;
        const base = positions.length / 3;
        // web-ifc interleaves [px, py, pz, nx, ny, nz]
        for (let v = 0; v < verts.length; v += 6) {
          const x = verts[v], y = verts[v + 1], z = verts[v + 2];
          const nx = verts[v + 3], ny = verts[v + 4], nz = verts[v + 5];
          positions.push(
            m[0] * x + m[4] * y + m[8] * z + m[12],
            m[1] * x + m[5] * y + m[9] * z + m[13],
            m[2] * x + m[6] * y + m[10] * z + m[14],
          );
          normals.push(
            m[0] * nx + m[4] * ny + m[8] * nz,
            m[1] * nx + m[5] * ny + m[9] * nz,
            m[2] * nx + m[6] * ny + m[10] * nz,
          );
        }
        for (let k = 0; k < idxs.length; k++) indices.push(idxs[k] + base);
        geom.delete();
      }
      if (positions.length) raw.push({ expressID: flatMesh.expressID, positions, normals, indices });
    });
    log(`streamed ${raw.length} elements in ${(performance.now() - t0).toFixed(0)}ms`);

    // ── one centre for the whole model, so elements stay in register ─────
    let cx = 0, cy = 0, cz = 0;
    if (recenter && raw.length) {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (const e of raw) {
        for (let i = 0; i < e.positions.length; i += 3) {
          const x = e.positions[i], y = e.positions[i + 1], z = e.positions[i + 2];
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
        }
      }
      cx = (minX + maxX) / 2; cy = (minY + maxY) / 2; cz = (minZ + maxZ) / 2;
    }

    // ── class, name and properties ──────────────────────────────────────
    const elements: IfcElementData[] = [];
    for (const e of raw) {
      let ifcClass = "IfcProduct";
      let name: string | undefined;
      let globalId: string | undefined;
      try {
        const typeCode = api.GetLineType(modelID, e.expressID);
        // reported as IFCSLAB; title-cased so it reads like the schema
        ifcClass = titleCase(api.GetNameFromTypeCode(typeCode)) || ifcClass;
        if (ifcClass.toLowerCase().startsWith("ifc")) {
          ifcClass = "Ifc" + ifcClass.slice(3, 4).toUpperCase() + ifcClass.slice(4);
        }
        const line = api.GetLine(modelID, e.expressID);
        name = readValue(line?.Name) as string | undefined;
        globalId = readValue(line?.GlobalId) as string | undefined;
      } catch { /* an element without a readable header still has geometry */ }

      const properties: Record<string, string | number | boolean> = {};
      const psets: Record<string, Record<string, string | number | boolean>> = {};
      if (wantProps) {
        try {
          // includeTypeProperties throws inside web-ifc for elements whose type
          // relation it cannot resolve ("Cannot read properties of undefined
          // (reading 'IsTypedBy')"), and one throw used to cost the element its
          // entire property bag. Ask for them, fall back to the element's own.
          let sets: any[] = [];
          try {
            sets = await api.properties.getPropertySets(modelID, e.expressID, true, true);
          } catch {
            sets = await api.properties.getPropertySets(modelID, e.expressID, true, false);
          }
          for (const set of sets ?? []) {
            const setName = (readValue(set?.Name) as string) || `set_${set?.expressID}`;
            const flat = flattenSet(set);
            if (Object.keys(flat).length) {
              psets[setName] = flat;
              Object.assign(properties, flat);
            }
          }
        } catch (err) {
          // still report it: silence here is what made every element look
          // property-less in the first place
          log(`properties unavailable for #${e.expressID}: ${(err as Error).message}`);
        }
      }

      if (recenter) {
        for (let i = 0; i < e.positions.length; i += 3) {
          e.positions[i] -= cx; e.positions[i + 1] -= cy; e.positions[i + 2] -= cz;
        }
      }

      elements.push({
        expressID: e.expressID,
        ifcClass,
        name,
        globalId,
        mesh: {
          positions: new Float32Array(e.positions),
          normals: new Float32Array(e.normals),
          indices: new Uint32Array(e.indices),
        },
        properties,
        psets,
      });
    }

    let tree: IfcSpatialNode | undefined;
    if (wantTree) {
      try {
        const walk = (n: any): IfcSpatialNode => ({
          expressID: n.expressID,
          ifcClass: titleCase(n.type ?? ""),
          name: readValue(n.Name) as string | undefined,
          children: (n.children ?? []).map(walk),
        });
        tree = walk(await api.properties.getSpatialStructure(modelID, true));
      } catch { /* a model without a spatial structure is still usable */ }
    }

    api.CloseModel(modelID);
    log(`parsed ${elements.length} elements`);
    return { elements, tree, center: [cx, cy, cz] };
  },
};
