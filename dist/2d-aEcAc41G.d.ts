import { M as Mesh, q as VisualStyle, V as Vec3, F as FlatMeshData, b as Vec2, S as Scene } from './Scene-CVb27q1H.js';
import { A as Algo, u as MeshFactory, M as MathUtils, G as SheetPrim, C as Sheet, y as Pt } from './download-BhsA6Zpm.js';

/**
 * LayerPanel — reusable tree-based layer/visibility panel.
 *
 * Pure DOM, no framework dependency. Embeds in the Sketch API via
 * lab.layerTree(), or use standalone by appending .el to any container.
 *
 * Parent visibility works as a NON-DESTRUCTIVE MASK:
 *   - Hiding a parent dims its children visually but does NOT change their
 *     stored state. Re-enabling the parent restores children as they were.
 *   - Use computeEffectiveVisibility() to get the resolved visibility for
 *     each node (own state AND all ancestor states combined).
 */
interface LayerNode {
    /** Unique identifier — used as key in LayerMap */
    id: string;
    /** Display label */
    label: string;
    /** Initial visibility (default: true) */
    defaultVisible?: boolean;
    /** Initial color. When defined, a color picker is shown next to the label. */
    defaultColor?: string;
    /** Child nodes */
    children?: LayerNode[];
}
interface LayerState {
    visible: boolean;
    color: string;
}
/** Flat map of node id → stored state (own toggle only, not ancestor-aware) */
type LayerMap = Record<string, LayerState>;
/**
 * Traverse a layer tree and return a map of id → effective visibility,
 * where a node is effectively visible only when it AND all its ancestors
 * are individually visible.
 *
 * Use this in your render function instead of reading `layers[id].visible`
 * directly — it gives the correct CAD-style masked result.
 */
declare function computeEffectiveVisibility(nodes: LayerNode[], value: LayerMap): Record<string, boolean>;
declare class LayerPanel {
    /** Mount this element anywhere in your UI */
    readonly el: HTMLElement;
    private _nodes;
    private _value;
    private _onChange;
    private _collapsed;
    private _isDark;
    constructor(opts: {
        nodes: LayerNode[];
        value: LayerMap;
        onChange: (updates: LayerMap) => void;
        isDark?: boolean;
    });
    /**
     * Re-render with new nodes/value.
     * Scroll position and collapsed state are preserved.
     */
    update(nodes: LayerNode[], value: LayerMap): void;
    private _stateOf;
    private _rebuild;
    /**
     * @param ancestorVisible — whether all ancestors are currently visible.
     *   Used only for visual dimming; does NOT affect stored state.
     */
    private _renderNode;
}

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

interface SketchConfig {
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
    /** Show the ✎ Markup button (draw instructions on the view; see Markup.ts). Default `true`. */
    markup?: boolean;
}
/** Item registered via `lab.registerExport(...)`. */
interface ExportRegistration {
    name: string;
    fileName: string;
    mimeType?: string;
    /** The file's contents: a string (DXF, SVG, JSON …) or a Blob, or a promise of one. */
    handler: () => Blob | string | Promise<Blob | string>;
}
/** Item registered via `lab.registerImport(...)`. */
interface ImportRegistration {
    name: string;
    accept?: string;
    handler: (file: File) => void | Promise<void>;
}
/** A reactive value — reads .value, triggers sketch re-run on change */
/**
 * A control's value. Read `.value` in the sketch. `.set(v)` changes the control from
 * code — a button, a key, a loaded file — moves the panel with it, and re-runs the
 * sketch; called during a run it only stores the value for the next one.
 */
interface Reactive<T, S = T> {
    readonly value: T;
    set(value: S): void;
}
/** Options for slider */
interface SliderOpts {
    step?: number;
    label?: string;
    group?: string;
    tab?: string;
    menu?: string;
    color?: string;
    /** Display-only param: changes run the `lab.onDisplay` pass instead of a full re-run. */
    display?: boolean;
}
/** Options for select */
interface SelectOpts {
    label?: string;
    group?: string;
    tab?: string;
    menu?: string;
    /** Display-only param: changes run the `lab.onDisplay` pass instead of a full re-run. */
    display?: boolean;
}
/** A handle to a mesh in the scene — fluent chainable API */
interface MeshHandle {
    readonly id: string;
    readonly mesh: Mesh;
    color(c: string): MeshHandle;
    opacity(o: number): MeshHandle;
    wireframe(w?: boolean): MeshHandle;
    visible(v?: boolean): MeshHandle;
    label(l: string): MeshHandle;
    /** Font-size multiplier for this object's label sprite (1 = default, 0.5 = half). */
    labelScale(s: number): MeshHandle;
    doubleSided(d?: boolean): MeshHandle;
    /** Show back-faces in this color (debug: reveals flipped normals). */
    backfaceColor(c: string | undefined): MeshHandle;
    /** Set the color for a named group (only applies when the mesh has groups). */
    groupColor(name: string, color: string): MeshHandle;
    /** Exclude this mesh from export (e.g. DXF). */
    noExport(v?: boolean): MeshHandle;
    /** Assign a semantic layer / class name (used by exports, filtering, debug). */
    layer(name: string): MeshHandle;
    /** Print-layer striping: repeat a layer-line stripe every `heightM` metres along the tube (pipe-UV
     *  meshes only) — the stacked-bead look of 3D-printed metal. Pass undefined to clear. */
    printLayers(heightM: number | undefined): MeshHandle;
    translate(x: number, y: number, z: number): MeshHandle;
    scale(s: number): MeshHandle;
    rotateX(rad: number): MeshHandle;
    rotateY(rad: number): MeshHandle;
    rotateZ(rad: number): MeshHandle;
    /** Catmull-Clark subdivide; `creaseAngleDeg` keeps sharp dihedrals (and boundaries) crisp. */
    subdivide(iterations?: number, opts?: {
        creaseAngleDeg?: number;
        creaseEdge?: (a: Vec3, b: Vec3) => boolean;
        pinVertex?: (p: Vec3) => boolean;
    }): MeshHandle;
    smooth(iterations?: number, factor?: number): MeshHandle;
    volume(): number;
    surfaceArea(): number;
    nodeCount(): number;
    faceCount(): number;
    edgeCount(): number;
}
/** A handle to a point */
interface PointHandle {
    readonly id: string;
    color(c: string): PointHandle;
    size(s: number): PointHandle;
    label(l: string): PointHandle;
    /** Font-size multiplier for this object's label sprite (1 = default, 0.5 = half). */
    labelScale(s: number): PointHandle;
    moveTo(x: number, y: number, z: number): PointHandle;
    position(): Vec3;
    /** Assign a semantic layer / class name (used by exports, filtering, debug). */
    layer(name: string): PointHandle;
}
/** A handle to a line/segment */
interface LineHandle {
    readonly id: string;
    color(c: string): LineHandle;
    opacity(o: number): LineHandle;
    radius(r: number): LineHandle;
    /** Assign a semantic layer / class name (used by exports, filtering, debug). */
    layer(name: string): LineHandle;
    /** Render dashed (world-unit dash/gap), via THREE.LineDashedMaterial.
     *  Defaults: size 0.05, gap = size. */
    dashed(size?: number, gap?: number): LineHandle;
    /** Tag this line for selection — surfaced as `pick.tag` in lab.onPick. */
    pickTag(tag: string): LineHandle;
    /** Enable/disable click-picking for this line (default true). */
    pickable(p?: boolean): LineHandle;
}
/** A handle to a filled 2D shape in the scene (polygon, circle) */
interface ShapeHandle {
    readonly id: string;
    color(c: string): ShapeHandle;
    opacity(o: number): ShapeHandle;
    visible(v?: boolean): ShapeHandle;
    label(l: string): ShapeHandle;
    /** Assign a semantic layer / class name (used by exports, filtering, debug). */
    layer(name: string): ShapeHandle;
}
/** Shape mode for beginShape/endShape */
type ShapeMode = "triangles" | "lines" | "line_strip" | "quads";
/** The Lab context passed to every sketch function */
/** Where an interactive handle may move (used by lab.handles). */
type DragSpace = {
    kind: "free";
} | {
    kind: "ground";
} | {
    kind: "plane";
    origin: Vec3;
    normal: Vec3;
} | {
    kind: "axis";
    origin: Vec3;
    dir: Vec3;
} | {
    kind: "curve";
    at: (t: number) => Vec3;
    samples?: number;
};
/** Options for lab.handles — a data-bound set of draggable handles. The model is
 *  the source of truth: handles re-seed from `position` each run (so slider/other
 *  edits are followed) except the one actively being dragged, whose moved position
 *  is written back via `onDrag`. */
interface HandleSetOpts<T> {
    key: (item: T, i: number) => string;
    position: (item: T, i: number) => Vec3;
    space?: (item: T, i: number) => DragSpace;
    onDrag: (item: T, p: Vec3, i: number) => void;
    color?: string;
    size?: number;
}
interface Lab {
    slider(label: string, min: number, max: number, defaultValue: number, opts?: SliderOpts): Reactive<number>;
    /**
     * Programmatically set an existing slider's value — updates both the value the
     * sketch reads and the on-screen slider control. Identify the slider by its
     * `label` and (if it was created with one) its `group`. No-op if not found.
     */
    setSlider(label: string, value: number, opts?: {
        group?: string;
    }): void;
    toggle(label: string, defaultValue?: boolean, opts?: {
        group?: string;
        tab?: string;
        menu?: string;
        display?: boolean;
    }): Reactive<boolean>;
    select<T extends string>(label: string, options: readonly T[], defaultValue?: T, opts?: SelectOpts): Reactive<T>;
    colorPicker(label: string, defaultValue?: string, opts?: {
        group?: string;
        tab?: string;
        menu?: string;
        display?: boolean;
    }): Reactive<string>;
    /**
     * Render a scrollable layer-tree panel — checkboxes, collapse/expand, and
     * optional per-node color pickers. Returns a reactive `LayerMap`
     * (`Record<id, { visible, color }>`).
     *
     * The panel instance is persistent: collapsed state and scroll position
     * survive sketch re-runs. Nodes can change between runs (e.g. async loads).
     */
    /** `.set({ beams: { visible: false } })` updates layers in place (partial per layer). */
    layerTree(label: string, nodes: LayerNode[], opts?: {
        group?: string;
        tab?: string;
        display?: boolean;
    }): Reactive<LayerMap, Record<string, Partial<LayerState>>>;
    /** `display: true` marks a display-only action (camera preset, restyle):
     *  the sketch is NOT re-run after it — the click costs only the action itself. */
    button(label: string, action: () => void, opts?: {
        group?: string;
        tab?: string;
        menu?: string;
        display?: boolean;
    }): void;
    separator(): void;
    /**
     * Run `fn` on the FIRST sketch run only — skipped on all re-runs. Use for
     * one-shot setup (loading a file, attaching custom listeners to
     * `lab.viewport`) without hand-rolled guard flags. Calls are matched by
     * declaration order, so keep `once` calls unconditional at the top level
     * of the sketch body.
     */
    once(fn: () => void): void;
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
    registerExport(opts: {
        name: string;
        fileName: string;
        mimeType?: string;
        handler: () => Blob | string | Promise<Blob | string>;
    }): void;
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
    registerImport(opts: {
        name: string;
        accept?: string;
        handler: (file: File) => void | Promise<void>;
    }): void;
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
    polygon(vertices: Vec3[], style?: Partial<VisualStyle>): ShapeHandle;
    circle(cx: number, cy: number, cz: number, radius: number): ShapeHandle;
    algo: typeof Algo;
    MeshFactory: typeof MeshFactory;
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
    /** Exponential distance fog tinted `color`; density 0 clears it (~0.005–0.03 at building scale). */
    setFog(color: string, density?: number): void;
    /** Tone-mapping exposure (1 = neutral). */
    setExposure(v: number): void;
    vec2(x: number, y: number): Vec2;
    vec3(x: number, y: number, z: number): Vec3;
    readonly PI: number;
    readonly TWO_PI: number;
    readonly HALF_PI: number;
    readonly TAU: number;
    readonly QUARTER_PI: number;
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
    noise(x: number, y?: number, z?: number): number;
    random(min?: number, max?: number): number;
    randomSeed(seed: number): void;
    rgb(r: number, g?: number, b?: number): string;
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
    worldToScreen(x: number, y: number, z: number): {
        x: number;
        y: number;
        visible: boolean;
    };
    /**
     * Force a sketch re-run. Use after mutating shared state from a custom
     * event handler (e.g. an `<select>` `change` listener inside an HTML
     * overlay) that the library doesn't already track.
     */
    invalidate(): void;
    /**
     * Draw the viewport on the next frame without re-running the sketch. The
     * viewport draws only when something changed — scene objects, camera, lights,
     * handles, or anything else done through the Lab — so this is needed only
     * after changing three.js objects directly.
     */
    requestRender(): void;
    /**
     * Register the display pass: called when a param declared with
     * `display: true` changes, INSTEAD of re-running the sketch. The callback
     * should only restyle existing scene objects (visibility, color, opacity,
     * projection, …) — typically via `styleViewLayer` — never create or
     * destroy geometry. Call `lab.invalidate()` from inside it when a change
     * cannot be satisfied by restyling (e.g. a layer turned on that was never
     * built) to fall back to a full re-run.
     *
     * Registered per run like other callbacks, so the closure captures the
     * current run's build-param values. If no display pass is registered,
     * display-param changes fall back to a normal re-run.
     */
    onDisplay(fn: () => void): void;
    /** The panel's currently active tab name ("" when the panel has no tabs). */
    readonly activeTab: string;
    /**
     * Register a callback for tab switches (per run, like other callbacks).
     * Tab clicks re-render only the panel — the sketch does NOT re-run — so use
     * this to refresh tab-dependent side content (e.g. `lab.info(...)`, which
     * applies immediately when called from here) without paying for a rebuild.
     */
    onTabChange(fn: (tab: string) => void): void;
    /**
     * Tag every scene object created until the matching `endViewLayer()` with
     * view-layer `name` (nestable — the innermost layer wins). View layers are
     * per-run bookkeeping for the display pass; they are independent of the
     * `.layer()` export/semantic layer on handles.
     */
    beginViewLayer(name: string): void;
    endViewLayer(): void;
    /** Scoped form of begin/endViewLayer. */
    viewLayer(name: string, fn: () => void): void;
    /** Whether `name` was declared (via begin/viewLayer) during the last run —
     *  even if it created no objects. Lets the display pass detect layers the
     *  build skipped entirely (→ `lab.invalidate()`). */
    hasViewLayer(name: string): boolean;
    /** Apply a style patch to every object created under view-layer `name`.
     *  Returns the number of objects touched (0 when unknown/empty). */
    styleViewLayer(name: string, style: Partial<VisualStyle>): number;
    /**
     * Enable or disable click-to-pick on the viewport. When enabled, clicking
     * a pickable object selects it (and attaches the transform gizmo if a mode
     * other than "none" is active). Default: disabled.
     */
    enablePicking(enabled?: boolean): void;
    /** Enable/disable orbit rotation (pan + zoom stay). Off → a strict-2D view. */
    setOrbitRotateEnabled(enabled: boolean): void;
    /** Register a callback invoked on every click pick. `id` is null for background clicks. */
    onPick(fn: (id: string | null, pick?: {
        tag?: string;
        layer?: string;
    }) => void): void;
    /** Set the gizmo mode: translate (W), rotate (E), scale (R), or none. */
    setGizmoMode(mode: "translate" | "rotate" | "scale" | "none"): void;
    /** Programmatically select an object (shows the gizmo + highlight). */
    setSelected(id: string | null): void;
    /** The currently selected object id, or null. */
    readonly selectedId: string | null;
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
    dragHandle(x: number, y: number, z: number, opts?: {
        name?: string;
        color?: string;
        size?: number;
        constrain?: (x: number, y: number, z: number) => [number, number, number];
        plane?: "ground" | "screen";
    }): Reactive<Vec3>;
    /**
     * Data-bound set of draggable handles. Declare it every run with your model
     * items; each gets a handle keyed by `key`. The model is the source of truth —
     * handles re-seed from `position` each run (so slider/other edits are followed)
     * except the one actively being dragged, whose moved position is written back
     * via `onDrag`. Built on dragHandle + the mark-and-sweep lifecycle.
     */
    handles<T>(items: T[], opts: HandleSetOpts<T>): void;
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
    beginShape(mode?: ShapeMode): void;
    vertex(x: number, y: number, z: number): void;
    /** Horizontal quad at height z. Vertices A→B→C→D CCW from above = normal up. Reverse order for normal down. Must be inside beginShape("quads"). */
    hQuad(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number, z: number): void;
    /** Vertical quad spanning zTop→zBot. Normal points LEFT of A→B direction (looking down from +Z). Must be inside beginShape("quads"). */
    vQuad(ax: number, ay: number, bx: number, by: number, zTop: number, zBot: number): void;
    endShape(close?: boolean): MeshHandle | LineHandle | null;
    readonly frame: number;
    readonly time: number;
    readonly dt: number;
    /**
     * Register a per-frame callback.
     *
     * Default: the sketch function re-runs every frame (immediate mode).
     * With `{ retain: true }`: the sketch only re-runs on param changes.
     * The animate callback runs per-frame either way. The viewport draws a frame
     * when the callback changed something through the Lab or the scene (objects,
     * camera, sun, sliders …); after changing three.js objects directly, call
     * `lab.requestRender()`.
     */
    animate(fn: (time: number, dt: number) => void, opts?: {
        retain?: boolean;
    }): void;
    getScene(): Scene;
}

/**
 * Tekto Sketch2D API
 *
 * Lightweight 2D canvas sketch — same panel/controls as Sketch,
 * but renders to a raw CanvasRenderingContext2D instead of Three.js.
 * No WebGL, no Three.js dependency.
 *
 * ─── Usage ───────────────────────────────────
 *
 *   import { sketch2d } from "tekto";
 *
 *   sketch2d((lab) => {
 *     const r = lab.slider("Radius", 1, 100, 30);
 *     const color = lab.colorPicker("Fill", "#38d9a9");
 *
 *     lab.draw((ctx, w, h) => {
 *       ctx.clearRect(0, 0, w, h);
 *       ctx.fillStyle = color.value;
 *       ctx.beginPath();
 *       ctx.arc(w / 2, h / 2, r.value, 0, Math.PI * 2);
 *       ctx.fill();
 *     });
 *   });
 *
 * ─── How it works ────────────────────────────
 *
 *   Like Sketch, the function re-runs when any parameter changes.
 *   The draw callback receives a 2D context and canvas dimensions.
 *   Use lab.animate() for continuous rendering.
 *
 *   Params live in a ParamStore and the panel is rendered by the shared
 *   ControlPanel (src/gui/) — the same system the 3D sketch API and
 *   appShell use.
 */

interface Sketch2DConfig {
    /** DOM element or CSS selector to mount into */
    container?: HTMLElement | string;
    /** Title shown in the header */
    title?: string;
    /** Canvas background color (CSS) */
    background?: string;
    /** Panel width in pixels (default 280) */
    panelWidth?: number;
    /** Dark or light theme */
    theme?: "dark" | "light";
}
type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
type AnimateFn = (time: number, dt: number) => void;
/** A single pointer (mouse / touch / pen) sample in CSS pixels relative to the canvas. */
interface Pointer2D {
    /** X in CSS pixels, relative to the canvas top-left. */
    x: number;
    /** Y in CSS pixels, relative to the canvas top-left. */
    y: number;
    /** Stable id for this pointer — match it across down/move/up to track one finger. */
    id: number;
}
type PointerFn = (p: Pointer2D) => void;
/** The lab context passed to the sketch function */
interface Lab2D {
    slider(label: string, min: number, max: number, defaultValue: number, opts?: SliderOpts): Reactive<number>;
    toggle(label: string, defaultValue?: boolean, opts?: {
        group?: string;
    }): Reactive<boolean>;
    select<T extends string>(label: string, options: readonly T[], defaultValue?: T, opts?: SelectOpts): Reactive<T>;
    colorPicker(label: string, defaultValue?: string, opts?: {
        group?: string;
    }): Reactive<string>;
    button(label: string, action: () => void, opts?: {
        group?: string;
    }): void;
    /** Register the draw callback. Called on every re-run and animation frame. */
    draw(fn: DrawFn): void;
    /** Enable continuous animation. Callback runs each frame. */
    animate(fn: AnimateFn): void;
    /**
     * Run `fn` on the FIRST sketch run only — skipped on re-runs. Use for
     * one-shot setup (loading data, attaching listeners to lab.canvas)
     * without guard flags. Calls are matched by declaration order, so keep
     * `once` calls unconditional at the top level of the sketch body.
     */
    once(fn: () => void): void;
    /** Get the raw canvas element (for advanced use like multiple canvases) */
    readonly canvas: HTMLCanvasElement;
    /** Get the 2D rendering context */
    readonly ctx: CanvasRenderingContext2D;
    /** Canvas width in CSS pixels */
    readonly width: number;
    /** Canvas height in CSS pixels */
    readonly height: number;
    /** Device pixel ratio */
    readonly dpr: number;
    log(label: string, value?: string | number): void;
    vec2(x: number, y: number): Vec2;
    PI: number;
    TWO_PI: number;
    sin: typeof Math.sin;
    cos: typeof Math.cos;
    atan2: typeof Math.atan2;
    abs: typeof Math.abs;
    sqrt: typeof Math.sqrt;
    floor: typeof Math.floor;
    ceil: typeof Math.ceil;
    round: typeof Math.round;
    min: typeof Math.min;
    max: typeof Math.max;
    lerp: typeof MathUtils.lerp;
    clamp: typeof MathUtils.clamp;
    noise(x: number, y?: number, z?: number): number;
    random(min?: number, max?: number): number;
    randomSeed(seed: number): void;
    readonly mouseX: number;
    readonly mouseY: number;
    readonly mousePressed: boolean;
    /**
     * Pointer input (mouse + touch + pen, unified). Register a handler that
     * fires on every pointer-down. Coordinates are CSS pixels relative to the
     * canvas; `id` is stable across the down/move/up of one finger so multi-touch
     * gestures can be tracked. Handlers are re-collected on each sketch re-run,
     * so register them at the top level of the sketch body (like `draw`).
     *
     * To keep a drag tracking outside the canvas bounds, call
     * `lab.canvas.setPointerCapture(id)` inside the down handler.
     */
    onPointerDown(fn: PointerFn): void;
    /** Fires on pointer-move for any active pointer. See {@link onPointerDown}. */
    onPointerMove(fn: PointerFn): void;
    /** Fires on pointer-up / pointer-cancel. See {@link onPointerDown}. */
    onPointerUp(fn: PointerFn): void;
}
type Sketch2DFn = (lab: Lab2D) => void;
/**
 * One function = one interactive 2D canvas app, p5-style: controls in the panel, a `draw`
 * callback with the canvas context, pointer events. No three.js — also in `tekto/2d`.
 *
 *   sketch2d((lab) => { const n = lab.slider("Count", 3, 12, 6, { step: 1 });
 *     lab.draw((ctx, w, h) => { … }); });
 */
declare function sketch2d(fn: Sketch2DFn, config?: Sketch2DConfig): Sketch2DInstance;
declare class Sketch2DInstance {
    private fn;
    private config;
    private container;
    private canvas;
    private ctx;
    private panelEl;
    private logEl;
    private store;
    private panel;
    private items;
    private buttons;
    private logs;
    private bridge;
    private drawFn;
    private animateFn;
    private pointerDownFns;
    private pointerMoveFns;
    private pointerUpFns;
    private continuous;
    private _prevFingerprint;
    private _baseLogCount;
    private _onceRan;
    private _onceSeq;
    private rng;
    private disposed;
    private startTime;
    private lastTime;
    private rerunTimer;
    private _running;
    private _mouseX;
    private _mouseY;
    private _mousePressed;
    constructor(fn: Sketch2DFn, config: Sketch2DConfig);
    private buildDOM;
    private resizeCanvas;
    private wireInput;
    private runSketch;
    private redraw;
    private scheduleRerun;
    private buildLab;
    private updateLog;
    private startLoop;
    /** Tear down the sketch */
    /** The current value of every control, keyed for `setParams` — save it to reopen a design. */
    getParams(): Record<string, unknown>;
    /** Set controls by label, "Group:Label" or key, and re-run once; reports what it couldn't apply. */
    setParams(values: Record<string, unknown>): {
        applied: string[];
        unknown: string[];
        ambiguous: {
            name: string;
            keys: string[];
        }[];
    };
    dispose(): void;
}

/**
 * A Sheet on screen — the same exploded primitives `toSVG` and `toDXF` write, drawn on a
 * canvas: pens at their paper weight, dashes at their paper length, text at its paper
 * height, all at the current zoom.
 *
 *   drawSheet(ctx, sheet, fitSheet(sheet.bounds(), w, h))      // in any 2D canvas (sketch2d)
 *
 *   const view = new SheetCanvas(container, { sheet });         // a widget: pan, zoom, pick
 *   view.onPick((prim) => selection.select(prim?.key ? [prim.key] : []));
 *   selection.onChange((keys) => view.setHighlight(keys));
 *
 * No three.js — this is part of `tekto/2d`.
 */

/** Sheet → screen: `scale` CSS pixels per sheet unit, the sheet origin at (`x`, `y`); y up. */
interface SheetTransform {
    scale: number;
    x: number;
    y: number;
}
interface DrawSheetOptions {
    /** The exploded sheet, if you have it already (`sheet.explode()`). */
    prims?: readonly SheetPrim[];
    /** Keys whose primitives are drawn highlighted. */
    highlight?: Iterable<string> | null;
    highlightColor?: string;
}
/** The transform that fits `bounds` into a `width` × `height` canvas with a pixel margin. */
declare function fitSheet(bounds: {
    min: Pt;
    max: Pt;
} | null, width: number, height: number, margin?: number): SheetTransform;
/** Draw the sheet's primitives with `t`; the canvas transform (e.g. device-pixel ratio) is kept. */
declare function drawSheet(ctx: CanvasRenderingContext2D, sheet: Sheet, t: SheetTransform, opts?: DrawSheetOptions): void;
interface SheetCanvasOptions {
    sheet?: Sheet | null;
    /** Paper colour (default white; "transparent" shows what is underneath). */
    background?: string;
    /** How close a click must be to pick a line, in CSS pixels (default 6). */
    pickTolerance?: number;
    /** Margin when fitting, in CSS pixels (default 24). */
    margin?: number;
    highlightColor?: string;
}
type Mods = {
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
};
/**
 * A sheet in a container: fills it, fits the drawing, zooms with the wheel (about the
 * cursor), pans by dragging, fits again on double-click. A click picks the primitive under
 * it (`onPick` — its `key` names the record); `setHighlight(keys)` shows a selection.
 * `onDraw` paints on top in screen pixels (handles, markers that keep their size), with
 * `toScreen` / `toSheet` to convert. The canvas is marked `data-tekto-overlay`, so over
 * an `appShell()` viewport (`app.overlay()`) it shows in snapshots.
 */
declare class SheetCanvas {
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private _sheet;
    private prims;
    private t;
    private fitted;
    private highlight;
    private pickFns;
    private drawFns;
    private frame;
    private ro;
    private off;
    private opts;
    constructor(container: HTMLElement, opts?: SheetCanvasOptions);
    get sheet(): Sheet | null;
    /** The primitives on screen (the sheet, exploded once per `setSheet`). */
    get primitives(): readonly SheetPrim[];
    get transform(): SheetTransform;
    /** Show a sheet. The first one is fitted; later ones keep the zoom, so a sheet rebuilt on
     *  every edit stays put (`fit: true` to refit). */
    setSheet(sheet: Sheet | null, opts?: {
        fit?: boolean;
    }): void;
    setTransform(t: SheetTransform): void;
    fit(): void;
    toSheet(x: number, y: number): Pt;
    toScreen(p: Pt): {
        x: number;
        y: number;
    };
    /** The primitive at a canvas position (CSS pixels), or null. */
    pick(x: number, y: number): SheetPrim | null;
    /** Clicks (not drags): the picked primitive, or null for paper. Returns the unsubscribe. */
    onPick(fn: (prim: SheetPrim | null, mods: Mods) => void): () => void;
    /** Draw primitives with these keys highlighted (a selection); null clears. */
    setHighlight(keys: Iterable<string> | null): void;
    /** Paint over the sheet in screen pixels after every redraw. Returns the unsubscribe. */
    onDraw(fn: (ctx: CanvasRenderingContext2D, t: SheetTransform) => void): () => void;
    /** Redraw on the next frame (calls coalesce). */
    redraw(): void;
    /** Draw now — before reading the canvas back. */
    paint(): void;
    dispose(): void;
    private size;
    private resize;
    private wire;
}

export { type AnimateFn as A, type DrawFn as D, type ExportRegistration as E, type ImportRegistration as I, type Lab as L, type MeshHandle as M, type PointHandle as P, type Reactive as R, type SketchConfig as S, type DrawSheetOptions as a, type Lab2D as b, type LayerMap as c, type LayerNode as d, LayerPanel as e, type LayerState as f, type LineHandle as g, type Pointer2D as h, type PointerFn as i, type SelectOpts as j, type ShapeHandle as k, type ShapeMode as l, SheetCanvas as m, type SheetCanvasOptions as n, type SheetTransform as o, type Sketch2DConfig as p, type Sketch2DFn as q, Sketch2DInstance as r, type SliderOpts as s, computeEffectiveVisibility as t, drawSheet as u, fitSheet as v, sketch2d as w };
