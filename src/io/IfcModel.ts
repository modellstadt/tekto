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

/**
 * IFC type codes, hard-coded so `web-ifc` stays a runtime-only dependency of
 * this module. Read out of the installed package rather than guessed.
 */
const WEBIFC_IFCPROJECT = 103090709;
const REL_TYPES = {
  voids: 1401173127,        // IfcRelVoidsElement: an opening carved into a wall
  fills: 3940055652,        // IfcRelFillsElement: a window or door filling one
  connectsPath: 3945020480, // IfcRelConnectsPathElements: wall meets wall
  connects: 1204542856,     // IfcRelConnectsElements: the general supertype
  definesByType: 781010003, // IfcRelDefinesByType: occurrence to its type
  aggregates: 160246688,    // IfcRelAggregates: a whole and its parts
} as const;

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
  /**
   * Read element-to-element relations: what fills what, what touches what,
   * what type an occurrence is. A handful of whole-model queries rather than
   * per element, so it is cheap even on a large file. Default: true.
   */
  relations?: boolean;
  onProgress?: (msg: string) => void;
}

/** Every id in an IFC attribute that may be one reference or a list of them. */
function refs(value: any): number[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => (typeof v === "number" ? v : v?.value)).filter(
    (v): v is number => typeof v === "number");
}

/**
 * Element-to-element relations, read as a handful of whole-model queries.
 *
 * The alternative is asking per element, which is a round trip each and the
 * reason property reading is the slow part of this parser. There are only a
 * few thousand relationship lines in a large model and they are all wanted, so
 * they are read in one pass per type and indexed.
 *
 * Voids and fills are chained on purpose. IFC does not connect a window to a
 * wall directly: the wall is voided by an opening, and the opening is filled
 * by the window. Reading only one half gives you the opening, which is an
 * element nobody wants to select.
 */
async function readRelations(
  api: any, modelID: number, log: (m: string) => void,
): Promise<Map<number, IfcRelations>> {
  const out = new Map<number, IfcRelations>();
  const of = (id: number) => {
    let r = out.get(id);
    if (!r) out.set(id, (r = {}));
    return r;
  };
  const lines = (type: number): any[] => {
    const found: any[] = [];
    try {
      const ids = api.GetLineIDsWithType(modelID, type);
      for (let i = 0; i < ids.size(); i++) {
        try { found.push(api.GetLine(modelID, ids.get(i))); } catch { /* skip a bad line */ }
      }
    } catch { /* a schema without this relation at all */ }
    return found;
  };

  // wall -> opening -> filling element, collapsed to wall <-> window
  const openingOf = new Map<number, number>();          // opening -> host
  for (const rel of lines(REL_TYPES.voids)) {
    const host = refs(rel?.RelatingBuildingElement)[0];
    for (const opening of refs(rel?.RelatedOpeningElement)) {
      if (host !== undefined) openingOf.set(opening, host);
    }
  }
  let filled = 0;
  for (const rel of lines(REL_TYPES.fills)) {
    const opening = refs(rel?.RelatingOpeningElement)[0];
    const host = opening === undefined ? undefined : openingOf.get(opening);
    if (host === undefined) continue;
    for (const filler of refs(rel?.RelatedBuildingElement)) {
      of(host).hosts = [...(of(host).hosts ?? []), filler];
      of(filler).hostedBy = host;
      filled++;
    }
  }

  // connections. Both directions are recorded: the file names one element as
  // relating and the other as related, and a reader asking "what touches this"
  // does not care which side the author happened to write it from.
  let connected = 0;
  for (const [type, name] of [
    [REL_TYPES.connectsPath, "IfcRelConnectsPathElements"],
    [REL_TYPES.connects, "IfcRelConnectsElements"],
  ] as const) {
    for (const rel of lines(type)) {
      const a = refs(rel?.RelatingElement)[0], b = refs(rel?.RelatedElement)[0];
      if (a === undefined || b === undefined || a === b) continue;
      const description = (rel?.Name?.value ?? rel?.Description?.value) || undefined;
      for (const [from, to] of [[a, b], [b, a]] as const) {
        const r = of(from);
        r.connectedTo = [...(r.connectedTo ?? []), { to, relation: name, description }];
      }
      connected++;
    }
  }

  // the type an occurrence is defined by, which is the unit a specification is
  // actually written against
  let typed = 0;
  for (const rel of lines(REL_TYPES.definesByType)) {
    const typeId = refs(rel?.RelatingType)[0];
    if (typeId === undefined) continue;
    let typeName: string | undefined;
    try { typeName = readValue(api.GetLine(modelID, typeId)?.Name) as string | undefined; }
    catch { /* a type without a readable name is still a type */ }
    for (const occurrence of refs(rel?.RelatedObjects)) {
      Object.assign(of(occurrence), { typeId, typeName });
      typed++;
    }
  }

  // wholes and parts. The spatial tree is aggregated the same way, so only
  // relations between things that carry geometry are of interest here; the
  // consumer filters by what it actually loaded.
  for (const rel of lines(REL_TYPES.aggregates)) {
    const whole = refs(rel?.RelatingObject)[0];
    if (whole === undefined) continue;
    const parts = refs(rel?.RelatedObjects);
    if (!parts.length) continue;
    of(whole).parts = [...(of(whole).parts ?? []), ...parts];
    for (const p of parts) of(p).partOf = whole;
  }

  log(`relations: ${filled} openings filled, ${connected} connections, ${typed} typed`);
  return out;
}

/**
 * How one element relates to another, in IFC's own vocabulary.
 *
 * The names are IFC's because the concepts are: there is no reason to invent a
 * word for "the window is in this wall" when the schema has spent thirty years
 * settling on one, and an app that speaks these names can hand them to any
 * other tool that reads the format.
 *
 *   hosts / hostedBy   IfcRelVoidsElement + IfcRelFillsElement, chained. A wall
 *                      hosts the window filling the opening carved into it.
 *   connectedTo        IfcRelConnectsElements and its subtypes, of which
 *                      IfcRelConnectsPathElements (wall meets wall) is the one
 *                      that actually appears in files.
 *   typeId             IfcRelDefinesByType. The unit a specification is
 *                      written against: nobody picks a product for one wall.
 *   partOf / parts     IfcRelAggregates, a whole and its pieces.
 */
export interface IfcRelations {
  /** openings in this element are filled by these elements */
  hosts?: number[];
  /** this element fills an opening in that one */
  hostedBy?: number;
  /** elements this one is recorded as touching, and how the file said so */
  connectedTo?: { to: number; relation: string; description?: string }[];
  /** the IfcTypeObject this occurrence is defined by */
  typeId?: number;
  typeName?: string;
  /** the whole this is a part of, and the parts it is made of */
  partOf?: number;
  parts?: number[];
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
  /**
   * What the file says this element is connected to.
   *
   * Stated, never inferred. Everything here was written down by whoever
   * authored the model; anything worked out from geometry is a different kind
   * of claim and lives in `adjacency.ts`, which says so. A file that records
   * no connections leaves this empty rather than guessing, because "the author
   * did not say" and "these do not touch" are different facts.
   */
  relations?: IfcRelations;
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
  /**
   * Metres per project length unit, read from the file's own unit assignment.
   * A quantity or a coordinate multiplied by this is in metres.
   *
   * Not cosmetic: an ArchiCAD export states a slab thickness as 0.2 and a
   * Revit export states the same thickness as 150, because one project is in
   * metres and the other in millimetres. Anything comparing a model against
   * external data has to normalise, and cannot do it by guessing magnitudes.
   */
  lengthScale: number;
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
    const wantRelations = options.relations ?? true;
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

    // ── what the file says is connected to what ─────────────────────────
    // read before the elements so each carries its own relations, and as a few
    // whole-model queries rather than a round trip per element
    const relations = wantRelations
      ? await readRelations(api, modelID, log) : new Map<number, IfcRelations>();

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
        /**
         * Both reads, type first, and the instance wins.
         *
         * web-ifc's last argument, includeTypeProperties, is substitutive and
         * not additive: it returns the TYPE object's property sets INSTEAD of
         * the element's. Quantities live only on the instance, so asking for
         * type properties dropped every Qto_*BaseQuantities set, and instance
         * sets came back truncated to whatever the type happened to carry. On
         * Autodesk's Revit sample that is 0 of 446 elements with a Height,
         * Length or Width against 271 without the flag; on AC20-FZK-Haus the
         * type read returns nothing at all for 68 of 83 elements, where the
         * instance read returns something for every one.
         *
         * It was silent because it does not throw. The old fallback only ran
         * when web-ifc raised, and here the flagged call succeeds and simply
         * returns less.
         *
         * Type first because that is what IFC means by a type: a default the
         * occurrence may override. On the same sample the two disagree on 237
         * elements, and the disagreement is not cosmetic (Pset_WallCommon
         * IsExternal reads false on the type and true on the wall).
         *
         * Each call gets its own try. One of them still throws for elements
         * whose type relation web-ifc cannot resolve ("Cannot read properties
         * of undefined (reading 'IsTypedBy')"), and that must not cost the
         * element the half that did work.
         */
        const both: any[][] = [];
        for (const includeType of [true, false]) {
          try {
            both.push(await api.properties.getPropertySets(
              modelID, e.expressID, true, includeType) ?? []);
          } catch (err) {
            // still report it: silence here is what made every element look
            // property-less in the first place
            log(`${includeType ? "type" : "instance"} properties unavailable `
              + `for #${e.expressID}: ${(err as Error).message}`);
          }
        }
        for (const set of both.flat()) {
          const setName = (readValue(set?.Name) as string) || `set_${set?.expressID}`;
          const flat = flattenSet(set);
          if (!Object.keys(flat).length) continue;
          // merged rather than replaced: Pset_WallCommon exists on both sides
          // with different members, so assigning the instance's copy over the
          // type's would hide a default the type is the only source of
          psets[setName] = { ...psets[setName], ...flat };
          Object.assign(properties, flat);
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
        ...(relations.has(e.expressID) ? { relations: relations.get(e.expressID) } : {}),
      });
    }

    // ── units, from IfcProject's unit assignment ────────────────────────
    let lengthScale = 1;
    try {
      const projects = api.GetLineIDsWithType(modelID, WEBIFC_IFCPROJECT);
      if (projects.size()) {
        const project = api.GetLine(modelID, projects.get(0), true);
        const units = project?.UnitsInContext?.Units ?? [];
        for (const u of units) {
          if (u?.UnitType?.value !== "LENGTHUNIT") continue;
          if (u?.Name?.value === "METRE") {
            const prefix = u?.Prefix?.value;
            lengthScale = prefix === "MILLI" ? 0.001 : prefix === "CENTI" ? 0.01
              : prefix === "DECI" ? 0.1 : prefix === "KILO" ? 1000 : 1;
          } else if (u?.ConversionFactor) {
            // inches and feet arrive as a factor over an SI unit
            const f = readValue(u.ConversionFactor?.ValueComponent);
            if (typeof f === "number") lengthScale = f;
          }
          break;
        }
      }
    } catch { /* a file without a readable unit assignment is treated as metres */ }
    log(`length unit: ${lengthScale} m per unit`);

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
    return { elements, tree, center: [cx, cy, cz], lengthScale };
  },
};
