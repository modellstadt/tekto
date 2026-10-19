/**
 * Tekto Scene
 *
 * Scene graph layer that wraps core geometry with:
 *   - Visual properties (color, opacity, wireframe, labels)
 *   - Selection and hover state
 *   - Event system
 *   - Serialization
 */

import { Vec3 } from "../core/math/vectors";
import { Mesh } from "../core/geometry/mesh/Mesh";
import { colorMaterial, type MeshData, type ObjMaterial } from "../io";
import type { MeshData as RenderMeshData } from "../core/geometry/mesh/Mesh";

// ─── Scene Object ────────────────────────────

/** The kinds of object a `Scene` holds; `type` decides which geometry fields of a `SceneObject` are set. */
export type SceneObjectType = "point" | "segment" | "polyline" | "polygon" | "mesh" | "circle" | "plane" | "light" | "group";

/**
 * What kind of light `scene.addLight` adds, and how strong: a `"point"` light shines all
 * round (a bulb), a `"spot"` in a cone toward `target`. `intensity` in candela (default 4);
 * `range`, how far it reaches in metres (0 = without limit; default 8); a spot's `angle`,
 * its cone's half angle in degrees (default 30).
 */
export interface LightSpec {
  kind?: "point" | "spot";
  intensity?: number;
  range?: number;
  target?: Vec3;
  angle?: number;
}

/** How meshes are drawn: lit surfaces, wireframe, a hidden-line drawing, or ghost —
 *  every surface translucent in its own colour with its creases, so what is inside reads
 *  through (a selection is drawn opaque). */
export type RenderMode = "solid" | "wireframe" | "hiddenline" | "ghost";

/**
 * Where to cut, in the content's own axes. The side below the cut along `axis` is kept
 * (a plan cut on `"z"` removes what is above); `flip` keeps the other side.
 *
 * Give the cut either as `coordinate`, a position along the axis in model units ("cut at
 * 1.2 m"), or as `at`, a fraction of the content's extent along it, so 0.5 is halfway
 * through whatever is loaded and the caller needs to know nothing about the model's
 * coordinates. `coordinate` wins when both are set; neither means `at: 0.5`.
 */
export interface SectionRequest {
  axis: "x" | "y" | "z";
  at?: number;
  coordinate?: number;
  /** keep the far side instead of the near one */
  flip?: boolean;
}

/** Perspective for looking at a building, orthographic for drawing one. */
export type Projection = "perspective" | "orthographic";

/** The six faces of the bounding box, plus the corner view. */
export type StandardView = "iso" | "top" | "bottom" | "front" | "back" | "left" | "right";

/**
 * High-level lighting / shading preset applied across the scene.
 *
 *   "flat"   — current defaults: 3 cheap lights, MeshPhongMaterial, no
 *              shadows, no tonemapping. Fast, neutral, good for inspection.
 *   "studio" — PBR (MeshStandardMaterial), one sun-style directional light
 *              with PCF-soft shadow maps, ACES filmic tonemapping. Surfaces
 *              read as real materials; readable contact shadows on the
 *              floor; significantly slower (~2-3× per frame).
 */
export type LightingMode = "flat" | "studio";

/** How a scene object is drawn: colour, opacity, line and point size, visibility, label and layer, plus optional shading, edge, PBR and dash settings. */
export interface VisualStyle {
  color: string;
  opacity: number;
  wireframe: boolean;
  lineWidth: number;
  pointSize: number;
  doubleSided: boolean;
  visible: boolean;
  /** Render with per-face (faceted) normals instead of smooth/averaged vertex
   *  normals. Doesn't change the geometry — only the material — so it also works
   *  on shared-vertex meshes (e.g. `MeshFactory.box`, whose 8 shared corners
   *  otherwise read as a subtly rounded cube). Default false. */
  flatShading?: boolean;
  /** Hidden-line render mode: draw only edges where the angle between the two
   *  adjacent faces exceeds this many degrees (feature / crease edges). Coplanar
   *  tessellation edges — e.g. a quad's diagonal split, or the tiling seams
   *  across a flat wall — are dropped, leaving a clean technical-drawing look.
   *  Default 30. */
  edgeAngle?: number;
  /** Hidden-line render mode: color of this object's feature-edge lines.
   *  Default #b0b0b0 — a neutral gray line drawing; set per object to keep
   *  its identity color readable in the hidden-line view. */
  edgeColor?: string;
  /** When set, renders back-faces in this color (enables doubleSided automatically). */
  backfaceColor?: string;
  /** Per-group colors keyed by group name (only used when FlatMeshData has groups). */
  groupColors?: Record<string, string>;
  /** When true, this object is excluded from mesh export (e.g. toMeshData). */
  noExport?: boolean;
  /** Optional semantic layer/class name. Invisible in the 3D display but
   *  queryable for exports (DXF layers), selection, and filtering. */
  layer?: string;
  label?: string;
  labelColor?: string;
  /** Font-size multiplier for the label sprite (1 = default, 0.5 = half). */
  labelScale?: number;
  tubeRadius?: number;
  /** Print-layer striping (metres): tube meshes with pipe UVs get a repeating layer-line texture along
   *  their length, one stripe per this height — the stacked-bead look of 3D-printed metal. */
  printLayerH?: number;
  /** PBR metalness (studio lighting only): 0 = dielectric, 1 = metal. Default 0. */
  metalness?: number;
  /** PBR roughness (studio lighting only): 0 = mirror, 1 = diffuse. Default 0.65. */
  roughness?: number;
  /** Dashed line (segment / polyline / circle): world-unit dash + gap lengths.
   *  Renders via THREE.LineDashedMaterial (+ computeLineDistances). */
  dash?: { size: number; gap: number };
}

const DEFAULT_STYLE: VisualStyle = {
  color: "#6ee7b7",
  opacity: 1,
  wireframe: false,
  lineWidth: 2,
  pointSize: 0.1,
  doubleSided: true,
  visible: true,
};

/** One object in a `Scene`: id, type, style, and the geometry fields its type uses (a point's `position`, a mesh's `mesh` …); `key` names the document record it shows. */
export interface SceneObject {
  id: string;
  type: SceneObjectType;
  style: VisualStyle;
  interactive: boolean;
  data: Record<string, any>; // extensible user data

  // Geometry payload (one of these is set based on type)
  position?: Vec3;          // point
  start?: Vec3;             // segment
  end?: Vec3;               // segment
  vertices?: Vec3[];        // polygon
  center?: Vec3;            // circle
  radius?: number;          // circle
  normal?: Vec3;            // plane
  distance?: number;        // plane
  mesh?: Mesh;
  flatMeshData?: FlatMeshData; // mesh (flat arrays with optional per-vertex colors)
  children?: string[];      // group
  light?: Required<Omit<LightSpec, "target">> & { target?: Vec3 };   // light (at `position`)

  /** Optional transform applied on top of the baked geometry (interactive editing / gizmo drag). */
  transform?: SceneTransform;
  /** Pickable in the viewport (click → select). Default: true. */
  pickable?: boolean;
  /** Semantic pick tag surfaced in lab.onPick — select by meaning, not raw scene id. */
  pickTag?: string;
  /**
   * The document record this object shows, e.g. `"blocks/k3f9x2"` (set by `scene.withKey`
   * and `bindScene`). Unlike the scene id it outlives re-renders, so selection, Markup and
   * agents can name the thing a person sees.
   */
  key?: string;
}

/** A renderer-applied transform on top of baked geometry. All fields optional. */
export interface SceneTransform {
  position?: Vec3;
  /** Euler angles in radians (XYZ order). */
  rotation?: Vec3;
  scale?: Vec3;
}

/**
 * Flat mesh data for direct rendering (positions/normals/indices + optional
 * vertex colors). Extends the core render-mesh `MeshData` (inheriting
 * `positions`/`normals`/`indices`/`colors`/`uvs`) and adds named sub-groups.
 */
export interface FlatMeshData extends RenderMeshData {
  colors?: Float32Array;    // RGBA per vertex (4 floats per vertex)
  /** Named sub-groups as contiguous index ranges (from OBJ `g` lines or manual splits). */
  groups?: { name: string; indexStart: number; indexCount: number }[];
}

// ─── Events ──────────────────────────────────

/** What changed in a `Scene` (objects, selection, hover, clear, render or lighting mode); renderers stay in step by listening to these. */
export type SceneEvent =
  | { type: "object:add"; id: string }
  | { type: "object:remove"; id: string }
  | { type: "object:update"; id: string; changes: Partial<SceneObject> }
  | { type: "object:style"; id: string; style: Partial<VisualStyle> }
  | { type: "selection:change"; ids: string[] }
  | { type: "hover:change"; id: string | null }
  | { type: "scene:clear" }
  | { type: "scene:renderMode"; mode: RenderMode }
  | { type: "scene:lightingMode"; mode: LightingMode }
  | { type: "scene:environment"; enabled: boolean }
  | { type: "camera:change" };

/** A callback passed to `scene.on(...)`. */
export type SceneEventListener = (event: SceneEvent) => void;

// ─── Scene Manager ───────────────────────────


/**
 * The objects an app shows: points, segments, polylines, polygons, meshes, each with a
 * {@link VisualStyle} (colour, opacity, layer, label …). Renderers listen to its events.
 * `sketch()` rebuilds it every run; `appShell()` apps keep and edit it. Ids are per scene.
 *
 *   const obj = scene.addMesh(mesh, { color: "#ccc", layer: "slab" }); scene.setStyle(obj.id, { opacity: 0.5 });
 */
export class Scene {
  private objects = new Map<string, SceneObject>();
  /** Per-scene, reset by clear(): see genId. */
  private idCounter = 0;
  private listeners = new Set<SceneEventListener>();
  private selectedIds = new Set<string>();
  private hoveredId: string | null = null;
  private suspendDepth = 0;
  private currentKey: string | undefined;
  renderMode: RenderMode = "solid";
  lightingMode: LightingMode = "flat";
  environmentEnabled = false;

  setRenderMode(mode: RenderMode): void {
    if (this.renderMode === mode) return;
    this.renderMode = mode;
    this.emit({ type: "scene:renderMode", mode });
  }

  setLightingMode(mode: LightingMode): void {
    if (this.lightingMode === mode) return;
    this.lightingMode = mode;
    this.emit({ type: "scene:lightingMode", mode });
  }

  setEnvironment(enabled: boolean): void {
    if (this.environmentEnabled === enabled) return;
    this.environmentEnabled = enabled;
    this.emit({ type: "scene:environment", enabled });
  }

  // ── Subscription ──

  on(listener: SceneEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SceneEvent) {
    if (this.suspendDepth > 0) return;
    for (const l of this.listeners) l(event);
  }

  /**
   * Run a block of mutations without emitting events.
   * Use this from sync/CRDT consumers to apply remote mutations
   * without echoing them back into the broadcast layer.
   * Nested calls are allowed; events resume when the outermost block ends.
   */
  withSuspendedEvents<T>(fn: () => T): T {
    this.suspendDepth++;
    try { return fn(); }
    finally { this.suspendDepth--; }
  }

  // ── Object Management ──

  private add(obj: SceneObject): SceneObject {
    if (this.currentKey !== undefined && obj.key === undefined) obj.key = this.currentKey;
    this.objects.set(obj.id, obj);
    this.emit({ type: "object:add", id: obj.id });
    return obj;
  }

  /**
   * Run `fn`; every object it adds carries `key` (the record it shows) from creation, so
   * listeners — renderer, Markup, snapshots — see it with the add. Nested calls use the
   * innermost key. `bindScene` does this for each record.
   */
  withKey<T>(key: string, fn: () => T): T {
    const outer = this.currentKey;
    this.currentKey = key;
    try { return fn(); }
    finally { this.currentKey = outer; }
  }

  /** The objects showing one record (see `withKey`). */
  byKey(key: string): SceneObject[] {
    const out: SceneObject[] = [];
    for (const o of this.objects.values()) if (o.key === key) out.push(o);
    return out;
  }

  get(id: string): SceneObject | undefined { return this.objects.get(id); }
  has(id: string): boolean { return this.objects.has(id); }
  all(): SceneObject[] { return [...this.objects.values()]; }
  count(): number { return this.objects.size; }

  update(id: string, changes: Partial<SceneObject>): void {
    const obj = this.objects.get(id);
    if (!obj) return;
    Object.assign(obj, changes);
    this.emit({ type: "object:update", id, changes });
  }

  setStyle(id: string, style: Partial<VisualStyle>): void {
    const obj = this.objects.get(id);
    if (!obj) return;
    Object.assign(obj.style, style);
    this.emit({ type: "object:style", id, style });
  }

  remove(id: string): void {
    this.objects.delete(id);
    this.selectedIds.delete(id);
    this.emit({ type: "object:remove", id });
  }

  clear(): void {
    this.objects.clear();
    this.selectedIds.clear();
    this.hoveredId = null;
    // Ids restart, so rebuilding the same content gives the same ids (see genId).
    this.idCounter = 0;
    this.emit({ type: "scene:clear" });
  }

  /**
   * Ids are per-scene and restart at clear(), so a sketch that declares the
   * same objects in the same order gets the SAME ids on every run. That is what
   * lets a selection (highlight + transform gizmo) survive a re-run.
   *
   * The stability is POSITIONAL: ids follow declaration order, so a run that
   * adds, removes or reorders an object shifts every id after it — a selection
   * can then land on the neighbour. Sketches that need a selection to hold
   * across such a change should declare their objects unconditionally (and
   * vary style instead), or track their own keys.
   *
   * Ids stay unique within a scene; they are NOT unique across scenes or across
   * clears, so don't store them outside the scene's lifetime.
   */
  private genId(prefix: string): string { return `${prefix}_${++this.idCounter}`; }

  // ── Builder Methods ──

  addPoint(position: Vec3, style?: Partial<VisualStyle>, data?: Record<string, any>): SceneObject {
    return this.add({
      id: this.genId("pt"), type: "point", position,
      style: { ...DEFAULT_STYLE, color: "#ff6b6b", pointSize: 0.1, ...style },
      interactive: true, data: data ?? {},
    });
  }

  addPoints(positions: Vec3[], style?: Partial<VisualStyle>): SceneObject[] {
    return positions.map(p => this.addPoint(p, style));
  }

  addSegment(start: Vec3, end: Vec3, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: this.genId("seg"), type: "segment", start, end,
      style: { ...DEFAULT_STYLE, color: "#4dabf7", ...style },
      interactive: true, data: {},
    });
  }

  addPolygon(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: this.genId("poly"), type: "polygon", vertices,
      style: { ...DEFAULT_STYLE, color: "#51cf66", opacity: 0.6, ...style },
      interactive: true, data: {},
    });
  }

  /** Batched polyline — renders as a single buffered Three.js Line, not one
   *  object per segment. Use for streamlines, hatches, sketched curves, etc.
   *  where N can be in the thousands. */
  addPolyline(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: this.genId("pline"), type: "polyline", vertices,
      style: { ...DEFAULT_STYLE, color: "#4dabf7", ...style },
      interactive: false, data: {},
    });
  }

  addMesh(mesh: Mesh, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: this.genId("mesh"), type: "mesh", mesh,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true, data: {},
    });
  }

  addFlatMesh(data: FlatMeshData, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: this.genId("mesh"), type: "mesh", flatMeshData: data,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true, data: {},
    });
  }

  addCircle(center: Vec3, radius: number, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: this.genId("cir"), type: "circle", center, radius,
      style: { ...DEFAULT_STYLE, color: "#ffd43b", ...style },
      interactive: true, data: {},
    });
  }

  /**
   * A light in the model, at `position`: a point light, or a spot aimed at `spec.target`.
   * Like any object it is keyed, re-made by a sketch re-run and hidden by `style.visible`;
   * the renderer lights the scene with it in both lighting modes, without shadows (a point
   * light's shadow is six renders, per light). Its colour is `style.color` (default white).
   *
   *   scene.addLight(new Vec3(2, 3, 2.4), { intensity: 6 });
   *   scene.addLight(new Vec3(0, 0, 3), { kind: "spot", target: new Vec3(0, 2, 0), angle: 25 }, { color: "#ffd2a0" });
   */
  addLight(position: Vec3, spec: LightSpec = {}, style?: Partial<VisualStyle>): SceneObject {
    const kind = spec.kind ?? "point";
    const fail = (why: string) => { throw new Error(`addLight: ${why}`); };
    if (![position.x, position.y, position.z].every(Number.isFinite)) fail(`a non-finite position (${position.x}, ${position.y}, ${position.z})`);
    const intensity = spec.intensity ?? 4, range = spec.range ?? 8, angle = spec.angle ?? 30;
    if (!(intensity >= 0)) fail(`intensity must be 0 or more, got ${spec.intensity}`);
    if (!(range >= 0)) fail(`range must be 0 or more (0: without limit), got ${spec.range}`);
    if (kind === "spot" && !spec.target) fail(`a spot needs a target to aim at`);
    if (kind === "spot" && !(angle > 0 && angle < 90)) fail(`a spot's angle is a half angle between 0 and 90 degrees, got ${spec.angle}`);
    return this.add({
      id: this.genId("light"), type: "light", position,
      light: { kind, intensity, range, angle, ...(spec.target ? { target: spec.target } : {}) },
      style: { ...DEFAULT_STYLE, color: "#ffffff", ...style },
      interactive: false, data: {},
    });
  }

  addPlane(normal: Vec3, distance: number, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: this.genId("plane"), type: "plane", normal, distance,
      style: { ...DEFAULT_STYLE, color: "#aaaaaa", opacity: 0.3, ...style },
      interactive: false, data: {},
    });
  }

  // ── Selection ──

  select(id: string): void {
    this.selectedIds.add(id);
    this.emit({ type: "selection:change", ids: this.getSelection() });
  }

  deselect(id: string): void {
    this.selectedIds.delete(id);
    this.emit({ type: "selection:change", ids: this.getSelection() });
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) this.deselect(id); else this.select(id);
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.emit({ type: "selection:change", ids: [] });
  }

  getSelection(): string[] { return [...this.selectedIds]; }
  isSelected(id: string): boolean { return this.selectedIds.has(id); }

  // ── Hover ──

  setHover(id: string | null): void {
    if (this.hoveredId === id) return;
    this.hoveredId = id;
    this.emit({ type: "hover:change", id });
  }

  getHover(): string | null { return this.hoveredId; }

  // ── Queries ──

  byType(type: SceneObjectType): SceneObject[] {
    return this.all().filter(o => o.type === type);
  }

  // ── Export ──

  /**
   * The visible mesh geometry (meshes, flat meshes, segments with a `tubeRadius`; not
   * `noExport`) merged into one `ObjMeshData` for `ObjFile.serialize`. Without options the
   * faces come in object order, ungrouped.
   *
   * `groupBy` keeps the objects apart in the OBJ as `g` groups, for Rhino or Cinema 4D:
   * - `"object"`: one group per object, named by its `key` (the record it shows; objects of
   *   one record share the name) or else its id (`"mesh_3"`);
   * - `"layer"`: one group per `style.layer` (`"default"` without one), each layer's faces one
   *   contiguous block, layers in the order they first appear.
   *
   * Each group's `material` is named by its colour, `c_rrggbb` (`_a45` appended below full
   * opacity), and `materials` lists them for `ObjFile.serializeMtl`. A layer whose objects
   * differ in colour is split into consecutive runs of the same name, one per material — what
   * `usemtl` does within an OBJ group.
   *
   *   const data = scene.toMeshData({ groupBy: "layer" });
   *   download(ObjFile.serializeMtl(data.materials!), "model.mtl");
   *   download(ObjFile.serialize(data, { mtllib: "model.mtl" }), "model.obj");
   */
  toMeshData(options: { groupBy?: "object" | "layer" } = {}): MeshData {
    const positions: Vec3[] = [];
    const normals: Vec3[] = [];
    const parts: { obj: SceneObject; faces: number[][] }[] = [];

    for (const obj of this.objects.values()) {
      if (!obj.style.visible) continue;
      if (obj.style.noExport) continue;
      const faces: number[][] = [];

      if (obj.mesh) {
        // Mesh: remap node IDs → sequential indices
        const nodeMap = new Map<number, number>();
        const offset = positions.length;
        for (const node of obj.mesh.nodesArray()) {
          nodeMap.set(node.id, offset + nodeMap.size);
          positions.push(node.position);
          normals.push(node.normal ?? Vec3.unitY());
        }
        for (const face of obj.mesh.facesArray()) {
          faces.push(face.nodes.map(n => nodeMap.get(n)!));
        }
      } else if (obj.flatMeshData) {
        // FlatMeshData: reshape typed arrays
        const fd = obj.flatMeshData;
        const offset = positions.length;
        const vertCount = fd.positions.length / 3;
        for (let i = 0; i < vertCount; i++) {
          positions.push(new Vec3(fd.positions[i * 3], fd.positions[i * 3 + 1], fd.positions[i * 3 + 2]));
          normals.push(new Vec3(fd.normals[i * 3], fd.normals[i * 3 + 1], fd.normals[i * 3 + 2]));
        }
        for (let i = 0; i < fd.indices.length; i += 3) {
          faces.push([fd.indices[i] + offset, fd.indices[i + 1] + offset, fd.indices[i + 2] + offset]);
        }
      } else if (obj.type === "segment" && obj.start && obj.end && obj.style.tubeRadius) {
        // Segment with tubeRadius → generate cylinder mesh
        Scene._addTubeMesh(positions, normals, faces, obj.start, obj.end, obj.style.tubeRadius, 6);
      }
      if (faces.length > 0) parts.push({ obj, faces });
    }

    const { groupBy } = options;
    if (!groupBy) return { positions, normals, uvs: [], faces: parts.flatMap(p => p.faces) };

    // One run per object, or per layer and colour with each layer's runs together.
    type Run = { name: string; material: ObjMaterial; faces: number[][] };
    let runs: Run[] = parts.map(({ obj, faces }) => ({
      name: groupBy === "layer" ? (obj.style.layer || "default") : (obj.key ?? obj.id),
      material: colorMaterial(obj.style.color, obj.style.opacity),
      faces,
    }));
    if (groupBy === "layer") {
      const layers = new Map<string, Map<string, Run>>();
      for (const run of runs) {
        const layer = layers.get(run.name) ?? new Map<string, Run>();
        layers.set(run.name, layer);
        const same = layer.get(run.material.name);
        if (same) for (const face of run.faces) same.faces.push(face);
        else layer.set(run.material.name, { ...run, faces: [...run.faces] });
      }
      runs = [...layers.values()].flatMap(layer => [...layer.values()]);
    }

    const faces: number[][] = [];
    const groups: NonNullable<MeshData["groups"]> = [];
    const materials = new Map<string, ObjMaterial>();
    for (const run of runs) {
      groups.push({ name: run.name, faceStart: faces.length, faceCount: run.faces.length, material: run.material.name });
      for (const face of run.faces) faces.push(face);
      if (!materials.has(run.material.name)) materials.set(run.material.name, run.material);
    }
    return { positions, normals, uvs: [], faces, groups, materials: [...materials.values()] };
  }

  /** Generate a cylinder tube mesh between two points. */
  private static _addTubeMesh(
    positions: Vec3[], normals: Vec3[], faces: number[][],
    a: Vec3, b: Vec3, radius: number, segs: number,
  ): void {
    const dir = b.sub(a);
    const len = dir.len();
    if (len < 1e-8) return;
    const axZ = dir.mul(1 / len);

    // Build orthonormal basis
    const tmp = Math.abs(axZ.x) < 0.9 ? new Vec3(1, 0, 0) : new Vec3(0, 1, 0);
    const axX = axZ.cross(tmp).normalize();
    const axY = axZ.cross(axX);

    const offset = positions.length;
    // Two rings of vertices: ring 0 at `a`, ring 1 at `b`
    for (let ring = 0; ring < 2; ring++) {
      const center = ring === 0 ? a : b;
      for (let i = 0; i < segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const nx = axX.x * cos + axY.x * sin;
        const ny = axX.y * cos + axY.y * sin;
        const nz = axX.z * cos + axY.z * sin;
        positions.push(new Vec3(center.x + nx * radius, center.y + ny * radius, center.z + nz * radius));
        normals.push(new Vec3(nx, ny, nz));
      }
    }
    // Quad faces connecting the two rings
    for (let i = 0; i < segs; i++) {
      const i0 = offset + i;
      const i1 = offset + (i + 1) % segs;
      const i2 = offset + segs + (i + 1) % segs;
      const i3 = offset + segs + i;
      faces.push([i0, i1, i2, i3]);
    }
  }

  // ── Serialization ──

  toJSON(): SceneJSON {
    return {
      objects: this.all().map(obj => ({
        ...obj,
        position: obj.position?.toJSON(),
        start: obj.start?.toJSON(),
        end: obj.end?.toJSON(),
        vertices: obj.vertices?.map(v => v.toJSON()),
        center: obj.center?.toJSON(),
        normal: obj.normal?.toJSON(),
        mesh: obj.mesh?.toJSON(),
      })),
    };
  }

  static fromJSON(json: SceneJSON): Scene {
    const scene = new Scene();
    for (const obj of json.objects) {
      const sceneObj: SceneObject = {
        ...obj,
        position: obj.position ? Vec3.fromJSON(obj.position) : undefined,
        start: obj.start ? Vec3.fromJSON(obj.start) : undefined,
        end: obj.end ? Vec3.fromJSON(obj.end) : undefined,
        vertices: obj.vertices?.map((v: any) => Vec3.fromJSON(v)),
        center: obj.center ? Vec3.fromJSON(obj.center) : undefined,
        normal: obj.normal ? Vec3.fromJSON(obj.normal) : undefined,
        mesh: obj.mesh ? Mesh.fromJSON(obj.mesh) : undefined,
      };
      scene.objects.set(sceneObj.id, sceneObj);
      // Advance this scene's counter past any IDs already used in the JSON
      // so newly added objects never collide with restored ones.
      const match = sceneObj.id.match(/_(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > scene.idCounter) scene.idCounter = num;
      }
    }
    return scene;
  }
}

/** What `scene.toJSON()` writes and `Scene.fromJSON` reads: the objects, with vectors and meshes as plain JSON. */
export interface SceneJSON {
  objects: any[];
}
