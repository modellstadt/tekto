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
import { ConnectedMesh as Mesh } from "../core/geometry/mesh/ConnectedMesh";
import type { MeshData } from "../io";
import type { MeshData as RenderMeshData } from "../core/geometry/mesh/Mesh";

// ─── Scene Object ────────────────────────────

export type SceneObjectType = "point" | "segment" | "polyline" | "polygon" | "mesh" | "circle" | "plane" | "group";

export type RenderMode = "solid" | "wireframe" | "hiddenline";

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
  tubeRadius?: number;
  /** PBR metalness (studio lighting only): 0 = dielectric, 1 = metal. Default 0. */
  metalness?: number;
  /** PBR roughness (studio lighting only): 0 = mirror, 1 = diffuse. Default 0.65. */
  roughness?: number;
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
  mesh?: Mesh;              // mesh (ConnectedMesh)
  flatMeshData?: FlatMeshData; // mesh (flat arrays with optional per-vertex colors)
  children?: string[];      // group

  /** Optional transform applied on top of the baked geometry (interactive editing / gizmo drag). */
  transform?: SceneTransform;
  /** Pickable in the viewport (click → select). Default: true. */
  pickable?: boolean;
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

export type SceneEventListener = (event: SceneEvent) => void;

// ─── Scene Manager ───────────────────────────

let _idCounter = 0;
function genId(prefix: string): string { return `${prefix}_${++_idCounter}`; }

export class Scene {
  private objects = new Map<string, SceneObject>();
  private listeners = new Set<SceneEventListener>();
  private selectedIds = new Set<string>();
  private hoveredId: string | null = null;
  private suspendDepth = 0;
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
    this.objects.set(obj.id, obj);
    this.emit({ type: "object:add", id: obj.id });
    return obj;
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
    this.emit({ type: "scene:clear" });
  }

  // ── Builder Methods ──

  addPoint(position: Vec3, style?: Partial<VisualStyle>, data?: Record<string, any>): SceneObject {
    return this.add({
      id: genId("pt"), type: "point", position,
      style: { ...DEFAULT_STYLE, color: "#ff6b6b", pointSize: 0.1, ...style },
      interactive: true, data: data ?? {},
    });
  }

  addPoints(positions: Vec3[], style?: Partial<VisualStyle>): SceneObject[] {
    return positions.map(p => this.addPoint(p, style));
  }

  addSegment(start: Vec3, end: Vec3, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: genId("seg"), type: "segment", start, end,
      style: { ...DEFAULT_STYLE, color: "#4dabf7", ...style },
      interactive: true, data: {},
    });
  }

  addPolygon(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: genId("poly"), type: "polygon", vertices,
      style: { ...DEFAULT_STYLE, color: "#51cf66", opacity: 0.6, ...style },
      interactive: true, data: {},
    });
  }

  /** Batched polyline — renders as a single buffered Three.js Line, not one
   *  object per segment. Use for streamlines, hatches, sketched curves, etc.
   *  where N can be in the thousands. */
  addPolyline(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: genId("pline"), type: "polyline", vertices,
      style: { ...DEFAULT_STYLE, color: "#4dabf7", ...style },
      interactive: false, data: {},
    });
  }

  addMesh(mesh: Mesh, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: genId("mesh"), type: "mesh", mesh,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true, data: {},
    });
  }

  addFlatMesh(data: FlatMeshData, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: genId("mesh"), type: "mesh", flatMeshData: data,
      style: { ...DEFAULT_STYLE, color: "#845ef7", ...style },
      interactive: true, data: {},
    });
  }

  addCircle(center: Vec3, radius: number, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: genId("cir"), type: "circle", center, radius,
      style: { ...DEFAULT_STYLE, color: "#ffd43b", ...style },
      interactive: true, data: {},
    });
  }

  addPlane(normal: Vec3, distance: number, style?: Partial<VisualStyle>): SceneObject {
    return this.add({
      id: genId("plane"), type: "plane", normal, distance,
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

  /** Merges all visible mesh geometry into a single MeshData for OBJ export. */
  toMeshData(): MeshData {
    const positions: Vec3[] = [];
    const normals: Vec3[] = [];
    const faces: number[][] = [];

    for (const obj of this.objects.values()) {
      if (!obj.style.visible) continue;
      if (obj.style.noExport) continue;

      if (obj.mesh) {
        // ConnectedMesh: remap node IDs → sequential indices
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
    }

    return { positions, normals, uvs: [], faces };
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
      // Advance the global counter past any IDs already used in the JSON
      // so newly added objects never collide with restored ones.
      const match = sceneObj.id.match(/_(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > _idCounter) _idCounter = num;
      }
    }
    return scene;
  }
}

export interface SceneJSON {
  objects: any[];
}
