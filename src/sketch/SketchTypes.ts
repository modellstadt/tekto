/**
 * Sketch public type definitions.
 *
 * Extracted from `Sketch.ts` to keep the implementation file focused on
 * runtime behaviour. All `Lab.*` methods, handle interfaces, config
 * interfaces, and the export/import registration shapes live here.
 *
 * Internal types (`SketchFn`, `ParamState`, `LogEntry`) stay in
 * `Sketch.ts` since they're implementation details of `SketchInstance`.
 */

import type { Vec2, Vec3 } from "../core/math/vectors";
import type { ConnectedMesh as Mesh } from "../core/geometry/mesh/ConnectedMesh";
import type { MeshFactory as MeshGen } from "../core/geometry/mesh/MeshFactory";
import type { Algo } from "../core/algo/algorithms";
import type { Scene, VisualStyle, FlatMeshData } from "../scene/Scene";
import type { LayerNode, LayerMap } from "../gui/LayerPanel";
export type { LayerNode, LayerState, LayerMap } from "../gui/LayerPanel";

// ─── SketchConfig ────────────────────────────────────────────────────

export interface SketchConfig {
  /** DOM element or CSS selector to mount into */
  container?: HTMLElement | string;
  /** Title shown in the header */
  title?: string;
  /** Background color (hex number) */
  background?: number;
  /** Show grid */
  grid?: boolean;
  /** Show axes */
  axes?: boolean;
  /** Camera starting position */
  camera?: [number, number, number];
  /** Camera look-at target */
  target?: [number, number, number];
  /** Show the 2D projection panel */
  show2D?: boolean;
  /** Panel width in pixels */
  panelWidth?: number;
  /** Dark or light theme */
  theme?: "dark" | "light";
  /** Up-axis: "y" (Three.js default) or "z" (CAD convention, XY = ground plane) */
  up?: "y" | "z";
  /**
   * Show the sketch's internal title/LIVE-badge header. Default `true`.
   * Set `false` when the sketch is mounted inside a shell (testbench / app
   * frame) that already provides a top bar with the current page title.
   */
  showHeader?: boolean;
}

// ─── Export / Import registrations (top-bar shell menus) ─────────────

/** Item registered via `lab.registerExport(...)`. */
export interface ExportRegistration {
  name: string;
  fileName: string;
  mimeType?: string;
  handler: () => Blob | Promise<Blob>;
}

/** Item registered via `lab.registerImport(...)`. */
export interface ImportRegistration {
  name: string;
  accept?: string;
  handler: (file: File) => void | Promise<void>;
}

// ─── Reactive value ──────────────────────────────────────────────────

/** A reactive value — reads .value, triggers sketch re-run on change */
export interface Reactive<T> {
  readonly value: T;
}

// ─── Control options ────────────────────────────────────────────────

/** Options for slider */
export interface SliderOpts {
  step?: number;
  label?: string;
  group?: string;
  tab?: string;
  menu?: string;
  color?: string;
}

/** Options for select */
export interface SelectOpts {
  label?: string;
  group?: string;
  tab?: string;
  menu?: string;
}

// ─── Scene-object handles ────────────────────────────────────────────

/** A handle to a mesh in the scene — fluent chainable API */
export interface MeshHandle {
  readonly id: string;
  readonly mesh: Mesh;

  // Style (chainable)
  color(c: string): MeshHandle;
  opacity(o: number): MeshHandle;
  wireframe(w?: boolean): MeshHandle;
  visible(v?: boolean): MeshHandle;
  label(l: string): MeshHandle;
  doubleSided(d?: boolean): MeshHandle;
  /** Show back-faces in this color (debug: reveals flipped normals). */
  backfaceColor(c: string | undefined): MeshHandle;
  /** Set the color for a named group (only applies when the mesh has groups). */
  groupColor(name: string, color: string): MeshHandle;
  /** Exclude this mesh from export (e.g. DXF). */
  noExport(v?: boolean): MeshHandle;
  /** Assign a semantic layer / class name (used by exports, filtering, debug). */
  layer(name: string): MeshHandle;

  // Transform
  translate(x: number, y: number, z: number): MeshHandle;
  scale(s: number): MeshHandle;
  rotateX(rad: number): MeshHandle;
  rotateY(rad: number): MeshHandle;
  rotateZ(rad: number): MeshHandle;

  // Modify (returns new handle with modified mesh)
  subdivide(iterations?: number): MeshHandle;
  smooth(iterations?: number, factor?: number): MeshHandle;

  // Query
  volume(): number;
  surfaceArea(): number;
  nodeCount(): number;
  faceCount(): number;
  edgeCount(): number;
}

/** A handle to a point */
export interface PointHandle {
  readonly id: string;
  color(c: string): PointHandle;
  size(s: number): PointHandle;
  label(l: string): PointHandle;
  moveTo(x: number, y: number, z: number): PointHandle;
  position(): Vec3;
  /** Assign a semantic layer / class name (used by exports, filtering, debug). */
  layer(name: string): PointHandle;
}

/** A handle to a line/segment */
export interface LineHandle {
  readonly id: string;
  color(c: string): LineHandle;
  opacity(o: number): LineHandle;
  radius(r: number): LineHandle;
  /** Assign a semantic layer / class name (used by exports, filtering, debug). */
  layer(name: string): LineHandle;
  /** Render dashed (world-unit dash/gap), via THREE.LineDashedMaterial.
   *  Defaults: size 0.05, gap = size. */
  dashed(size?: number, gap?: number): LineHandle;
}

/** Shape mode for beginShape/endShape */
export type ShapeMode = "triangles" | "lines" | "line_strip" | "quads";

// ─── Lab (the API surface a sketch function receives) ────────────────

/** The Lab context passed to every sketch function */
export interface Lab {
  // ── GUI Controls (create UI + return reactive value) ──
  slider(label: string, min: number, max: number, defaultValue: number, opts?: SliderOpts): Reactive<number>;
  /**
   * Programmatically set an existing slider's value — updates both the value the
   * sketch reads and the on-screen slider control. Identify the slider by its
   * `label` and (if it was created with one) its `group`. No-op if not found.
   */
  setSlider(label: string, value: number, opts?: { group?: string }): void;
  toggle(label: string, defaultValue?: boolean, opts?: { group?: string; tab?: string; menu?: string }): Reactive<boolean>;
  select<T extends string>(label: string, options: T[], defaultValue?: T, opts?: SelectOpts): Reactive<T>;
  colorPicker(label: string, defaultValue?: string, opts?: { group?: string; tab?: string; menu?: string }): Reactive<string>;
  /**
   * Render a scrollable layer-tree panel — checkboxes, collapse/expand, and
   * optional per-node color pickers. Returns a reactive `LayerMap`
   * (`Record<id, { visible, color }>`).
   *
   * The panel instance is persistent: collapsed state and scroll position
   * survive sketch re-runs. Nodes can change between runs (e.g. async loads).
   */
  layerTree(label: string, nodes: LayerNode[], opts?: { group?: string; tab?: string }): Reactive<LayerMap>;

  // ── Actions ──
  button(label: string, action: () => void, opts?: { group?: string; tab?: string; menu?: string }): void;
  separator(): void;

  /**
   * Register an "Export ▾" item for the host shell (testbench / app)
   * to surface in its top-bar Export menu. The handler returns a `Blob`
   * (or a Promise of one); the shell handles the download.
   *
   * Idempotent across sketch re-runs (re-registering the same `name`
   * just refreshes the handler closure).
   *
   *   lab.registerExport({
   *     name:     "IFC",                          // shown as menu label
   *     fileName: "model.ifc",                    // default download name
   *     mimeType: "application/ifc",              // optional
   *     handler:  () => writer.saveBlob(),
   *   });
   */
  registerExport(opts: { name: string; fileName: string; mimeType?: string; handler: () => Blob | Promise<Blob> }): void;

  /**
   * Register an "Import ▾" item for the host shell. The handler receives
   * the user-selected `File`.
   *
   *   lab.registerImport({
   *     name:    "OBJ",
   *     accept:  ".obj",                          // file-input filter
   *     handler: async (file) => loadObj(await file.text()),
   *   });
   */
  registerImport(opts: { name: string; accept?: string; handler: (file: File) => void | Promise<void> }): void;

  // ── Geometry Builders (add to scene + return handle) ──
  mesh(m: Mesh, style?: Partial<VisualStyle>): MeshHandle;
  flatMesh(data: FlatMeshData, style?: Partial<VisualStyle>): MeshHandle;
  sphere(radius?: number, segments?: number, rings?: number): MeshHandle;
  box(width?: number, height?: number, depth?: number): MeshHandle;
  torus(majorR?: number, minorR?: number, segments?: number, sides?: number): MeshHandle;
  cylinder(radiusTop?: number, radiusBottom?: number, height?: number, segments?: number): MeshHandle;
  grid(width?: number, depth?: number, divX?: number, divZ?: number, heightFn?: (x: number, z: number) => number): MeshHandle;
  revolve(profile: Vec2[], segments?: number): MeshHandle;
  extrude(polygon: Vec3[], direction: Vec3): MeshHandle;

  point(x: number, y: number, z: number): PointHandle;
  points(positions: Vec3[]): PointHandle[];
  line(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): LineHandle;
  /**
   * Draw a polyline as a single GPU-buffered line — orders of magnitude faster
   * than `beginShape("line_strip")` when emitting thousands of curves. The
   * returned handle's `radius()` is a no-op (buffered lines don't support
   * tube radius).
   */
  polyline(points: Vec3[]): LineHandle;
  polygon(vertices: Vec3[], style?: Partial<VisualStyle>): string;
  circle(cx: number, cy: number, cz: number, radius: number): string;

  // ── Algorithms ──
  algo: typeof Algo;
  MeshGen: typeof MeshGen;

  // ── Scene control ──
  clear(): void;
  background(color: number): void;
  camera(x: number, y: number, z: number): void;
  lookAt(x: number, y: number, z: number): void;
  /** Fit all visible scene objects into the current view. */
  fitAll(): void;
  /** Switch between perspective and parallel (orthographic) projection. */
  setProjection(type: "perspective" | "orthographic"): void;
  /**
   * Set the camera up vector.
   * Use (0,1,0) for top-down plan views (avoids gimbal lock in Z-up scenes).
   * Use (0,0,1) to restore Z-up for elevation/side views.
   */
  cameraUp(x: number, y: number, z: number): void;

  // ── Info display ──
  log(label: string, value?: string | number): void;
  info(text: string): void;

  /**
   * Aim the main directional light at the origin from `direction`
   * (FROM origin TO light, Z-up scene coords). Use with `SunPosition`
   * to drive shadow studies from date + lat/lon — see the Timber demo.
   *
   *   const sun = SunPosition.compute({ date, latitude, longitude });
   *   if (sun.isDaytime) lab.setSunDirection(sun.direction);
   */
  setSunDirection(direction: Vec3, distance?: number): void;

  // ── Math constructors ──
  vec2(x: number, y: number): Vec2;
  vec3(x: number, y: number, z: number): Vec3;

  // ── Processing Constants ──
  readonly PI: number;
  readonly TWO_PI: number;
  readonly HALF_PI: number;
  readonly TAU: number;
  readonly QUARTER_PI: number;

  // ── Math Helpers (match HDGEO Sketch API) ──
  sin(a: number): number;
  cos(a: number): number;
  tan(a: number): number;
  atan2(y: number, x: number): number;
  abs(v: number): number;
  sqrt(v: number): number;
  pow(b: number, e: number): number;
  floor(v: number): number;
  ceil(v: number): number;
  round(v: number): number;
  min(a: number, b: number): number;
  max(a: number, b: number): number;
  lerp(a: number, b: number, t: number): number;
  map(value: number, start1: number, stop1: number, start2: number, stop2: number): number;
  constrain(val: number, min: number, max: number): number;
  dist(x1: number, y1: number, x2: number, y2: number): number;
  rad(degrees: number): number;
  deg(radians: number): number;

  // ── Noise & Random ──
  noise(x: number, y?: number, z?: number): number;
  random(min?: number, max?: number): number;
  randomSeed(seed: number): void;

  // ── Color Utility ──
  rgb(r: number, g?: number, b?: number): string;

  // ── Mouse & Keyboard Input ──
  readonly mouseX: number;
  readonly mouseY: number;
  readonly pmouseX: number;
  readonly pmouseY: number;
  readonly mousePressed: boolean;
  readonly key: string;
  readonly keyPressed: boolean;

  onMouseClicked(fn: () => void): void;
  onMouseDragged(fn: () => void): void;
  onKeyPressed(fn: (key: string) => void): void;
  onKeyReleased(fn: (key: string) => void): void;

  // ── Viewport / overlays ──
  /**
   * The viewport container element (parent of the canvas). Append custom
   * HTML overlays (popups, tooltips, in-scene labels) here — they will be
   * cleaned up automatically when the sketch is disposed.
   */
  readonly viewport: HTMLElement;

  /**
   * Project a world-space point to canvas-local pixel coordinates. Use
   * to position HTML overlays at 3D points (joint markers, callouts,
   * annotations). Returns `visible: false` when the point is behind the
   * camera or outside the frustum.
   */
  worldToScreen(x: number, y: number, z: number): { x: number; y: number; visible: boolean };

  /**
   * Force a sketch re-run. Use after mutating shared state from a custom
   * event handler (e.g. an `<select>` `change` listener inside an HTML
   * overlay) that the library doesn't already track.
   */
  invalidate(): void;

  // ── Picking + transform gizmo ──
  /**
   * Enable or disable click-to-pick on the viewport. When enabled, clicking
   * a pickable object selects it (and attaches the transform gizmo if a mode
   * other than "none" is active). Default: disabled.
   */
  enablePicking(enabled?: boolean): void;
  /** Register a callback invoked on every click pick. `id` is null for background clicks. */
  onPick(fn: (id: string | null) => void): void;
  /** Set the gizmo mode: translate (W), rotate (E), scale (R), or none. */
  setGizmoMode(mode: "translate" | "rotate" | "scale" | "none"): void;
  /** Programmatically select an object (shows the gizmo + highlight). */
  setSelected(id: string | null): void;
  /** The currently selected object id, or null. */
  readonly selectedId: string | null;

  // ── Drag handles (live point manipulation) ──
  /**
   * Create a draggable control point. Returns a reactive `Vec3` value:
   * read `.value.x` / `.value.y` / `.value.z` to use the current position.
   * Dragging the handle in the viewport (left-click + drag, ground-plane constrained)
   * updates the value and re-runs the sketch.
   *
   * Handles are persisted across re-runs by `opts.name` (default: declaration order).
   * Pass an explicit name when you want stable identity, e.g. when the call site moves.
   *
   * `opts.constrain` (optional): snap function applied during drag — receives
   * the raw raycast position and returns the constrained position. Use to lock
   * a handle to a curve (e.g. opening positions along a wall centerline) or
   * a plane.
   *
   * `opts.plane` (optional): which plane the drag is constrained to. "ground"
   * (default) drags perpendicular to the world up axis; "screen" drags in the
   * camera-facing plane, letting a handle move in elevation in a side view.
   */
  dragHandle(
    x: number, y: number, z: number,
    opts?: {
      name?: string;
      color?: string;
      size?: number;
      constrain?: (x: number, y: number, z: number) => [number, number, number];
      plane?: "ground" | "screen";
    },
  ): Reactive<Vec3>;

  /**
   * Register a callback invoked when a drag handle is clicked (with or
   * without movement). `name` is null when the user clicks empty space.
   * Used for selecting opening positions, joint handles, etc.
   */
  onHandlePick(fn: (name: string | null) => void): void;

  /** Programmatically select or deselect a drag handle. */
  setHandleSelected(name: string | null): void;

  /** The currently selected drag handle name, or null. */
  readonly selectedHandle: string | null;
  /**
   * The handle currently being dragged (set on pointer-down, null on release).
   * Use to detect an in-progress drag — unlike `selectedHandle`, which persists
   * after the gesture ends until another pick.
   */
  readonly activeDragHandle: string | null;

  // ── beginShape/endShape ──
  beginShape(mode?: ShapeMode): void;
  vertex(x: number, y: number, z: number): void;
  /** Horizontal quad at height z. Vertices A→B→C→D CCW from above = normal up. Reverse order for normal down. Must be inside beginShape("quads"). */
  hQuad(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number, z: number): void;
  /** Vertical quad spanning zTop→zBot. Normal points LEFT of A→B direction (looking down from +Z). Must be inside beginShape("quads"). */
  vQuad(ax: number, ay: number, bx: number, by: number, zTop: number, zBot: number): void;
  endShape(close?: boolean): MeshHandle | LineHandle | null;

  // ── Time ──
  readonly frame: number;
  readonly time: number;
  readonly dt: number;

  // ── Animation ──
  /**
   * Register a per-frame callback.
   *
   * Default: the sketch function re-runs every frame (immediate mode).
   * With `{ retain: true }`: the sketch only re-runs on param changes.
   * The animate callback runs per-frame either way.
   */
  animate(fn: (time: number, dt: number) => void, opts?: { retain?: boolean }): void;

  // ── Scene Access ──
  getScene(): Scene;
}
