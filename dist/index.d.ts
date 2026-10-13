import { V as Vec3, M as Mesh, S as Scene, R as RenderMode, L as LightingMode } from './Scene-CVb27q1H.js';
export { A as AABB, F as ColoredMeshData, c as FlatMeshData, d as LegacyMeshJSON, e as Mat4, f as MeshEdge, g as MeshFace, h as MeshJSON, i as MeshNode, j as MeshValidation, O as ObjFile, k as ObjMeshData, l as SceneEvent, m as SceneEventListener, n as SceneJSON, a as SceneObject, o as SceneObjectType, T as Triangle, b as Vec2, p as Vec4, q as VisualStyle } from './Scene-CVb27q1H.js';
import { D as DxfLayerDef } from './download-BhsA6Zpm.js';
export { A as Algo, a as DASH_PATTERNS, b as Dash, c as DimOptions, d as DrawOptions, e as Dxf2DArc, f as Dxf2DCircle, g as Dxf2DContent, h as Dxf2DLine, i as Dxf2DLook, j as Dxf2DPoint, k as Dxf2DPolyline, l as Dxf2DSolid, m as Dxf2DText, n as Dxf3DArc, o as Dxf3DCircle, p as Dxf3DContent, q as Dxf3DLine, r as Dxf3DPoint, s as Dxf3DPolyline, F as FilletResult, H as HMath, L as LevelOptions, t as LineStyle, M as MathUtils, u as MeshFactory, v as MultiPoly2, O as OBB2D, P as Poly2, w as Polygon2D, x as PolygonBool, y as Pt, R as ResolvedStyle, z as Ring2, S as SeededRandom, B as Segment, C as Sheet, E as SheetOptions, G as SheetPrim, I as SheetView, T as TextOptions, V as ViewOptions, J as aciFromHex, K as closestPointOnSegment, N as createRandom, Q as download, U as noise, W as pickPrim, X as polygonIntersection, Y as segmentSegmentClosest, Z as setClipSnap, _ as stampName, $ as writeDxf2D, a0 as writeDxf3D } from './download-BhsA6Zpm.js';
import { BspTree, SharedStore, Presence } from './core.js';
export { AddWallSystemOptions, Adjacency, AdjacencyOptions, ArcCurve, Axis, BalloonFrame, BalloonFrameOptions, BlobDetect, Box, BspNode, BspPolygon, Capsule2D, CltConstruction, CltOptions, CollabAdapter, CollabEvents, CollabStatus, CollabUser, ConnectionType, Contact, CubicBezierCurve, Curvature, CurveUtils, CutListItem, Delaunay2D, DistanceTransform, Doc, DocChange, DocChangeSource, DocEditOptions, DocJSON, DocOptions, DocSchema, DoorOperation, ExtrudedRibbon, ExtrudedRibbonOptions, FloodFill, Graph, GridGraph, HelixCurve, HolzrahmenBau, HolzrahmenBauJointStyle, HolzrahmenBauOptions, ICurve, IMetricCurve, ISdf, IfcElementData, IfcFile, IfcModel, IfcModelData, IfcParseElementsOptions, IfcParseOptions, IfcRelations, IfcSpatialNode, IfcWriter, IfcWriterOptions, Intersect2DResult, Intersections, JointKind, JointParticipant, JointStyle, JointTrim, JoistOrientationOptions, JoistedSlab, JoistedSlabOptions, LatticeType, LayerPosition, LineCurve, MITER_LIMIT, MarchingCubes, MarchingSquares, MaterialLayer, MeshAnalysis, MeshBuffers, MeshCleanup, MeshSubdivide, MeshTransform, MicroPatternType, NoFitPolygon, NurbsCurve, NurbsSurface, OpeningType, OpeningTypeOptions, PGFace, PGHalfEdge, PGVertex, PartProfile, PerpSegment, PickingView, PixelView, PlanarGraph, PlanarGraphCleanup, PlanarGraphRepair, Plane, PointClassification, PolylineCurve, PropertyMap, Ray, RealizedSlab, RealizedWall, RibbonEndTrim, RibbonFrame, RibbonJoint, RibbonOpening, RibbonSystem, RigidBody2D, RigidBodyConfig, SceneBinding, SdfBlend, SdfBoundedExtrude, SdfBox, SdfCapsule, SdfCone, SdfCylinder, SdfEllipsoid, SdfExtrude, SdfGradient, SdfIntersect, SdfLattice, SdfLineField, SdfMicrostructure, SdfMirror, SdfOffset, SdfOnion, SdfOps, SdfPlaneField, SdfRadialArray, SdfRevolution, SdfShell, SdfSmoothSubtract, SdfSmoothUnion, SdfSphere, SdfSubtract, SdfTorus, SdfTransform, SdfTwist, SdfUnion, SdfUtils, SdfVoronoi, Selection, SharedRecord, SharedStoreOptions, Slab, SlabConstruction, SlabContext, SlabOpening, SlabOptions, SlabPart, SlabPartRole, SlabType, SlabTypeOptions, SolidConstruction, SolidSlabConstruction, Space, SpaceOptions, Sphere, Spring, Spring2D, SpringConfig, SpringSystem3D, Stair, StairFlight, StairOptions, StairShape, StairType, StairTypeOptions, StreamlineOptions, StreamlineTracer, SunPosition, SunPositionInput, SunPositionResult, SupabaseLike, UpAxis, VecMath, VertexCurvature, VoxelGrid, VoxelGrid2D, Wall, WallConstruction, WallJoint, WallJointOptions, WallOpening, WallOptions, WallPart, WallPartRole, WallSystem, WallType, WindowPartitioning, bindScene, boundingWalls, boxOf, buildCutList, chooseJoistDirection, clampedUniformKnots, cltLayers, collabColor, contactBetween, devServerAdapter, edgeOutwardVisibility, findAdjacent, holzrahmenbauLayers, joistDirectionFromBounds, joistDirectionFromPCA, joistDirectionFromSupports, lineClipPolygon, localAdapter, memoryAdapter, neighboursOf, perpVisibility, perpVisibilityOfPolys, polygonFromVertices, realize, realizeSlab, repelBodies, reverseContact, selectOnClick, supabaseAdapter } from './core.js';
import { P as ParamStore, b as ParamSchema } from './Params-C5uOYti3.js';
export { B as BoolParam, d as ButtonParam, C as ColorParam, F as FloatParam, I as IntParam, e as ParamDef, f as ParamFolder, a as ParamLayout, S as SelectParam, g as StringParam, V as Vec3Param, h as createLayout, i as createParams } from './Params-C5uOYti3.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { E as ExportRegistration, I as ImportRegistration, L as Lab, S as SketchConfig, R as Reactive } from './2d-aEcAc41G.js';
export { A as AnimateFn, D as DrawFn, a as DrawSheetOptions, b as Lab2D, c as LayerMap, d as LayerNode, e as LayerPanel, f as LayerState, g as LineHandle, M as MeshHandle, P as PointHandle, h as Pointer2D, i as PointerFn, j as SelectOpts, k as ShapeHandle, l as ShapeMode, m as SheetCanvas, n as SheetCanvasOptions, o as SheetTransform, p as Sketch2DConfig, q as Sketch2DFn, r as Sketch2DInstance, s as SliderOpts, t as computeEffectiveVisibility, u as drawSheet, v as fitSheet, w as sketch2d } from './2d-aEcAc41G.js';

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

interface IdBufferOptions {
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
    /** Emit occluded runs under this layer name even when debugLayers is off
     *  (classic dashed "hidden" lines alongside semantic visible layers). */
    occludedLayer?: string;
}
interface IEdgeLite {
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    layer: string;
    adjTris?: number[];
    /** Face normals of the triangles sharing this edge — for front/back classification. */
    adjNormals?: [number, number, number][];
}
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
declare function hiddenLineIdBuffer(positions: Float32Array, indices: Uint32Array, edges: IEdgeLite[], _triNormals: [number, number, number][] | null, view: DxfView, options?: IdBufferOptions): DxfSegment[];

/**
 * DXF Exporter with hidden-line removal.
 *
 * Pipeline:
 *  1. Collect triangles (occluders) and edges (to draw)
 *  2. Project orthographically onto the view plane
 *  3. Back-face cull, depth-sort front-facing triangles
 *  4. Per-edge interval subtraction: clip visible [0,1] range against each
 *     closer triangle using Cyrus-Beck 2D clipping
 *  5. Write DXF R12 (AC1009) — universally compatible
 *
 * Usage:
 *   const exp = new DxfExporter();
 *   exp.addMesh(mesh.positions, mesh.indices, { layer: 'stairs' });
 *   exp.addPolyline(pts, { layer: 'centerline' });
 *   const dxf = exp.toDxf({ viewDir: new Vec3(0, 1, 0) });
 */

interface DxfView {
    /** Direction the camera looks toward (into the scene). Will be normalized. */
    viewDir: Vec3;
    /** Up direction for the 2D output. Default: Vec3(0, 0, 1). */
    upDir?: Vec3;
}
interface DxfMeshOptions {
    /** DXF layer name for edges of this mesh. Default: '0'. */
    layer?: string;
    /**
     * Include edges with dihedral angle above this threshold (degrees).
     * Lower = more edges. Default: 30.
     */
    featureAngle?: number;
    /** Include boundary (open) edges. Default: true. */
    boundary?: boolean;
    /**
     * If provided, soft edges (below featureAngle — e.g. tessellation lines)
     * are written to this layer instead of being discarded. Lets CAD users
     * toggle triangulation noise on/off independently.
     */
    softEdgeLayer?: string;
    /**
     * Resolve smooth edges (below featureAngle) as VIEW-DEPENDENT silhouettes
     * instead of emitting every one of them: each becomes a candidate that is
     * kept at export only where its two faces straddle the view direction (one
     * front-, one back-facing) — i.e. the true outline of a curved surface, on
     * this mesh's layer, occlusion-tested like any edge. Coplanar tessellation
     * edges can never be a silhouette and are dropped. Takes precedence over
     * softEdgeLayer. Same technique addBspTree already uses. Default: false.
     */
    silhouettes?: boolean;
}
interface DxfEdgeOptions {
    layer?: string;
}
interface DxfWriteOptions {
    /** Scale multiplier applied to all coordinates. Default 1000 (meters→mm). */
    scale?: number;
    /** Decimal places in output. Default 3. */
    precision?: number;
    /**
     * Run hidden-line removal. Default true.
     * Set false for a fast export that projects all edges without occlusion testing.
     */
    hiddenLine?: boolean;
    /**
     * Debug mode: export ALL edges on classified layers instead of removing hidden lines.
     * Layers: "visible", "occluded", "all-edges" (projected without HL).
     * Overrides hiddenLine when true.
     */
    debugLayers?: boolean;
    /**
     * Depth bias for hidden-line self-occlusion prevention, in world units.
     * Must exceed tessellation error of curved surfaces but be smaller than
     * the thinnest geometry. Default 0.01.
     */
    depthBias?: number;
}
interface IEdge {
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    layer: string;
    kind?: 'feature' | 'boundary' | 'silhouette';
    adjTris?: number[];
    /** Face normals of adjacent triangles — used for front/back classification. */
    adjNormals?: [number, number, number][];
    /** Triangle index range [start, end) for the mesh this edge belongs to — used to
     *  skip all same-mesh triangles when depth-testing silhouette edges. */
    meshTriRange?: [number, number];
}
interface DxfSegment {
    u0: number;
    v0: number;
    u1: number;
    v1: number;
    layer: string;
}
/**
 * 2D DXF views of 3D meshes with hidden lines removed: add meshes and edges, then
 * `toDxf({ viewDir })` (CPU) or `toDxfGpu` / `toSegmentsGpu` (WebGL id buffer). For
 * drawings you construct yourself use `writeDxf2D`; for true-3D lines, `writeDxf3D`.
 */
declare class DxfExporter {
    private _tris;
    /** Per-triangle face normal (parallel to _tris). null = normals unavailable. */
    private _triNormals;
    private _edges;
    /** Edges whose visibility depends on view direction (silhouette candidates). */
    private _silhouetteEdges;
    private _layers;
    /** Define a layer with color and line type. */
    layer(def: DxfLayerDef): this;
    /**
     * Add a triangulated mesh. Extracts triangles for occlusion and
     * feature / boundary edges for drawing.
     */
    addMesh(positions: Float32Array, indices: Uint32Array, options?: DxfMeshOptions): this;
    /** Add triangles for occlusion only — edges NOT drawn. */
    addOccluder(positions: Float32Array, indices: Uint32Array): this;
    /** Add a polyline as a sequence of edges. */
    addPolyline(pts: Vec3[], options?: DxfEdgeOptions): this;
    /** Add a single edge. */
    addEdge(a: Vec3, b: Vec3, options?: DxfEdgeOptions): this;
    /**
     * Add geometry from a BSP tree. Extracts occluder triangles, feature/boundary
     * edges, and silhouette edge candidates (view-dependent, resolved at export).
     *
     * BSP polygons have reliable normals, enabling back-face culling and silhouette
     * detection in the hidden-line pass.
     */
    addBspTree(bsp: BspTree, options?: DxfMeshOptions): this;
    /** Returns a serializable request object for Web Worker hidden-line computation. */
    toWorkerRequest(view: DxfView, options?: DxfWriteOptions): DxfWorkerRequest;
    /** Return raw projected segments with layer classification (for live preview). */
    toSegments(view: DxfView, options?: DxfWriteOptions): DxfSegment[];
    /** Project edges and write DXF. Runs hidden-line removal unless hiddenLine=false. */
    toDxf(view: DxfView, options?: DxfWriteOptions): string;
    /**
     * GPU-accelerated hidden-line removal using ID buffer rendering.
     * Returns projected segments — same output as toSegments() but uses the GPU
     * for visibility, which handles intersecting/overlapping meshes naturally.
     * Requires Three.js.
     */
    toSegmentsGpu(view: DxfView, options?: IdBufferOptions): DxfSegment[];
    /**
     * GPU-accelerated hidden-line DXF export.
     * Same as toDxf() but uses GPU ID buffer for visibility testing.
     * Requires Three.js.
     */
    toDxfGpu(view: DxfView, options?: DxfWriteOptions & IdBufferOptions): string;
    /** Write DXF from pre-computed segments (e.g. merged from multiple sources). */
    toDxfFromSegments(segs: DxfSegment[], options?: {
        scale?: number;
        precision?: number;
    }): string;
    /** Return edge counts grouped by layer name. Useful for debugging edge classification. */
    debugEdgeCounts(): Record<string, number>;
    /** Clear all geometry (reuse the exporter for a different view). */
    clear(): this;
}
interface DxfWorkerRequest {
    /** Flat array: ax,ay,az,bx,by,bz,cx,cy,cz per triangle */
    trisFlat: number[];
    /** Flat array: nx,ny,nz per triangle (parallel to trisFlat). Optional. */
    triNormalsFlat?: number[];
    edges: IEdge[];
    layers: DxfLayerDef[];
    viewDir: [number, number, number];
    upDir: [number, number, number];
    scale: number;
    precision: number;
    depthBias?: number;
}
/** Run hidden-line DXF computation — intended to be called from a Web Worker. */
declare function processWorkerRequest(req: DxfWorkerRequest, onProgress?: (p: number) => void): string;

interface VisibilityView {
    /** View direction (camera-to-target). The unit vector is fine. */
    viewDir: Vec3;
    /** World-up reference (defaults to +Y). */
    upDir?: Vec3;
}
interface VisibilityOptions {
    /** Offscreen target resolution. Higher = sharper silhouettes. Default 1024. */
    resolution?: number;
    /** Depth tolerance, in fraction of the scene's view-depth range. Default 0.005.
     *  Increase if you see streamlines breaking up where they sit just above the
     *  mesh; decrease if back-side lines bleed through silhouettes. */
    bias?: number;
}
interface ProjectedSegment {
    /** 2D points (u, v) in view space — ready for SVG / DXF. */
    points2D: {
        u: number;
        v: number;
    }[];
    /** Original 3D points (for in-scene preview rendering). */
    points3D: Vec3[];
}
interface VisibilityResult {
    /** Visible polyline chunks. Long polylines may yield multiple chunks. */
    segments: ProjectedSegment[];
    /** View bounds in 2D (the (u, v) range covered by the mesh's projection). */
    bounds: {
        minU: number;
        maxU: number;
        minV: number;
        maxV: number;
    };
}
declare function extractVisiblePolylines(mesh: Mesh, polylines: Vec3[][], view: VisibilityView, options?: VisibilityOptions): VisibilityResult;
interface SVGOptions {
    /** Stroke width in SVG user units. Default 0.5. */
    strokeWidth?: number;
    /** Stroke color (any CSS color). Default "#000". */
    stroke?: string;
    /** Pad the viewBox by this fraction of scene size. Default 0.02. */
    padFraction?: number;
}
declare function polylinesToSVG(segments: ProjectedSegment[], bounds: {
    minU: number;
    maxU: number;
    minV: number;
    maxV: number;
}, options?: SVGOptions): string;

/**
 * Tekto GUI theme — the single source of panel chrome colors.
 *
 * Every tekto panel (sketch, sketch2d, appShell, LayerPanel, ControlPanel)
 * derives its colors from here instead of re-declaring hex literals inline.
 *
 * Chrome is WHITE on the dark background by design: white slider accents and
 * value labels, white toggle tracks, plain white titles — no colored accents
 * in panel chrome. (Content colors — e.g. a colorPicker's default value — are
 * the sketch's business, not the theme's.)
 */
interface Theme {
    isDark: boolean;
    /** App background behind the viewport */
    bg: string;
    /** Panel / header background */
    panelBg: string;
    /** Elevated surface (dropdowns, popovers) */
    popupBg: string;
    /** Hairline borders between panel sections */
    border: string;
    /** Borders on individual controls (inputs, selects, buttons) */
    controlBorder: string;
    /** Primary text */
    text: string;
    /** Secondary text (control labels) */
    textDim: string;
    /** Tertiary text (group headers, disabled) */
    textFaint: string;
    /** Chrome accent — white on dark, near-black on light */
    accent: string;
    /** Hover wash for rows / buttons */
    hoverBg: string;
    /** Input field background (selects, text inputs) */
    fieldBg: string;
    /** Panel font stack */
    font: string;
}
declare function getTheme(mode?: "dark" | "light"): Theme;

/**
 * ControlPanel — the shared panel/control renderer for all tekto GUIs.
 *
 * One implementation of sliders, toggles, selects, color pickers, text
 * inputs, buttons, menus, tabs, and accordion groups — consumed by
 * `sketch()` (3D), `sketch2d()` (2D canvas), and `appShell()` (persistent
 * apps). Values live in a {@link ParamStore}; the panel renders its
 * definitions and keeps the DOM in sync with the store in both directions.
 *
 * Pure DOM, no framework dependency. Styling comes from {@link Theme}
 * (white-on-dark chrome — see CLAUDE.md "GUI defaults").
 *
 * Lifecycle: call `render(items, ...)` whenever the CONTROL STRUCTURE
 * changes (params added/removed). Value-only changes never need a re-render
 * — the store subscription updates the live controls in place, which is what
 * preserves slider focus during a drag.
 */

/** One control to render: which store key, and where it goes in the panel. */
interface ControlItem {
    key: string;
    /** Accordion section (default "Parameters") */
    group?: string;
    /** Tab name — panel shows a tab bar when 2+ distinct tabs exist */
    tab?: string;
    /** Menu name — control renders inside a top menu dropdown instead of a section (toggles only) */
    menu?: string;
    /** Per-control accent override (slider track thumb color) */
    accent?: string;
}
/**
 * An action button. Buttons are looked up at CLICK time via `getButtons`,
 * because immediate-mode owners (sketch) recreate the action closures on
 * every re-run while the panel DOM persists — capturing `action` directly
 * would call a stale closure.
 */
interface PanelButton {
    label: string;
    action: () => void;
    group?: string;
    tab?: string;
    menu?: string;
    /** Display-only action (camera moves, restyling): skip the owner's
     *  post-action hook (which typically re-runs the sketch). */
    display?: boolean;
}
/** A caller-owned element hosted in the panel (e.g. a LayerPanel tree). */
interface CustomRow {
    key: string;
    el: HTMLElement;
    group?: string;
    tab?: string;
    /** Bleed past the section's horizontal padding (full-width components) */
    fullBleed?: boolean;
}
/** A tab whose content the owner renders itself (e.g. sketch's Info tab). */
interface ExtraTab {
    name: string;
    render: (container: HTMLElement) => void;
}
interface ControlPanelConfig {
    store: ParamStore;
    theme?: Theme;
    /** Current buttons — re-read at render AND click time (see PanelButton). */
    getButtons?: () => PanelButton[];
    /** Slider drag ended / discrete control committed a value. */
    onCommit?: (key: string) => void;
    /** A button or menu action ran (owners typically re-run the sketch). */
    onAction?: () => void;
    /** The user switched to another tab (panel re-renders itself first). */
    onTabChange?: (tab: string) => void;
}
declare class ControlPanel {
    /** Mount this element in your panel container. */
    readonly el: HTMLElement;
    /**
     * Persistent footer container, re-attached below the sections on every
     * render. Owners park their info/log nodes here and update them in place.
     */
    readonly footer: HTMLElement;
    private store;
    private theme;
    private cfg;
    private collapsedGroups;
    private activeTab;
    private activeMenu;
    private items;
    private customRows;
    private extraTabs;
    private updaters;
    private unsubStore;
    private docClick;
    constructor(cfg: ControlPanelConfig);
    dispose(): void;
    /** Rebuild the panel DOM for a new control structure. */
    render(items: ControlItem[], customRows?: CustomRow[], extraTabs?: ExtraTab[]): void;
    /** Push a value into a live control without going through the store. */
    applyValue(key: string, value: any): void;
    private closeMenus;
    private buildMenuBar;
    /** The currently active tab name ("" when the panel has no tabs). */
    getActiveTab(): string;
    private buildTabBar;
    private buildSection;
    private buildButtonRow;
    private buildControl;
}

/**
 * Tekto Three.js Renderer
 *
 * Converts Scene objects → Three.js scene graph.
 * Manages lifecycle, materials, and GPU resources.
 */

type GizmoMode = "translate" | "rotate" | "scale" | "none";
/** Modifier keys held during a pick (a click on the viewport). */
interface PickInfo {
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
}
interface ThreeRendererConfig {
    antialias: boolean;
    backgroundColor: number;
    showGrid: boolean;
    gridSize: number;
    gridDivisions: number;
    showAxes: boolean;
    axesSize: number;
    enableOrbitControls: boolean;
    enableDamping: boolean;
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
    fov: number;
    /** Coordinate system up-axis: "y" (Three.js default) or "z" (CAD convention). */
    up: "y" | "z";
}
declare class ThreeRenderer {
    readonly threeScene: THREE.Scene;
    readonly camera: THREE.PerspectiveCamera;
    private _orthoCam;
    private _isOrtho;
    readonly renderer: THREE.WebGLRenderer;
    readonly controls?: OrbitControls;
    /** The currently active camera — perspective or orthographic. */
    get activeCamera(): THREE.Camera;
    private gScene;
    private config;
    private isZUp;
    private objectMap;
    private unsub;
    private rafId;
    private _needsRender;
    private _lastCamPos;
    private ambientLight;
    private dirLight;
    private hemiLight;
    private currentLighting;
    private studioMetalness;
    private studioRoughness;
    private studioColor;
    private studioFlatShading;
    private hideHelpers;
    private gridHelper;
    private axesHelper;
    private shadowGround;
    private shadowGroundHidden;
    private externalObjects;
    private envMap;
    private envSourceTex;
    private envEnabled;
    private envBackground;
    private container;
    private resizeObserver;
    private raycaster;
    private pickEnabled;
    private pickListeners;
    private transformControls;
    private gizmoMode;
    private gizmoAttachedId;
    private pointerDown;
    private selectionMaterials;
    private dragHandles;
    private dragHandleConstraints;
    private dragHandlePlanes;
    private dragHandleMoveCb;
    private dragHandleEndCb;
    private dragHandlePickCb;
    private activeDragHandle;
    private selectedDragHandle;
    private dragPlane;
    private dragSeenThisRun;
    constructor(gScene: Scene, container: HTMLElement, config?: Partial<ThreeRendererConfig>);
    private handleEvent;
    private addToThree;
    /** Apply a style patch to the existing three object if it only touches colour,
     *  opacity, visibility or inert keys. False → the caller rebuilds the object. */
    private _restyleInPlace;
    /** Set colour + opacity on a single-material object exactly as convert() would build
     *  it: lines (segment, polyline, circle), tube segments and unlabelled points. Meshes,
     *  polygons, planes and labelled points have mode- or label-dependent materials → false. */
    private _repaint;
    /** Apply `obj.transform` (position/rotation/scale) to a Three.Object3D. */
    private applyTransform;
    private removeFromThree;
    private clearThree;
    /** Rebuild all mesh objects (called when render mode changes). */
    private rebuildAllMeshes;
    /**
     * Build a material that respects the current lighting mode. Studio mode
     * returns an `MeshStandardMaterial` (PBR; reacts correctly to shadows
     * and tonemapping); Flat mode returns the original `MeshPhongMaterial`.
     * Same option surface — caller doesn't have to care which one comes back.
     */
    private _makeMaterial;
    /** Cached horizontal-stripe textures for print-layer shading, keyed by layer height (m). One texture
     *  period = one printed bead: bright rounded crown, dark groove at the layer boundary. The pipe UVs
     *  carry V in metres, so repeat.y = 1/layerH gives physically-true layer spacing. */
    private _stripeTexCache;
    private _stripeTexture;
    /**
     * Set the Studio-mode default PBR material applied to meshes that don't
     * carry their own metalness/roughness. Takes effect on the next material
     * build (e.g. the next sketch re-run). metalness/roughness in 0..1.
     */
    setStudioMaterial(metalness: number, roughness: number, color?: string | null, flatShading?: boolean): void;
    private _isHelper;
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
    setShadowGroundVisible(visible: boolean): void;
    /**
     * Add a raw THREE.Object3D (e.g. a loaded glTF/GLB scene) to the renderer,
     * persisting across sketch re-runs. Re-adding the same id replaces it.
     * Meshes are flagged to cast + receive shadows (visible in Studio lighting).
     */
    addExternalObject(obj: THREE.Object3D, id: string): void;
    removeExternalObject(id: string): void;
    setHelpersVisible(visible: boolean): void;
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
    setFog(color: string, density?: number): void;
    /** Tone-mapping exposure (1 = neutral; <1 darker, >1 brighter). */
    setExposure(v: number): void;
    setSunDirection(direction: Vec3, distance?: number): void;
    /**
     * Reconfigure renderer + lights + scene shadow flags for the given mode.
     * Material swapping happens after this returns, via `rebuildAllMeshes`.
     */
    private _applyLighting;
    /**
     * Toggle a prefiltered environment map on `threeScene.environment`. Only
     * studio PBR (`MeshStandardMaterial`) materials sample it, so this is a
     * no-op visually in flat mode — but it's safe to enable in either mode.
     * The map is built once on first enable and reused thereafter.
     */
    private _applyEnvironment;
    /**
     * Set an equirectangular source texture for the environment (e.g. a loaded
     * HDR via RGBELoader). Pass null to use the built-in procedural gradient.
     * The texture is PMREM-prefiltered here; the caller keeps ownership of it.
     */
    setEnvironmentSource(equirect: THREE.Texture | null): void;
    /**
     * Show the equirectangular environment source as the scene backdrop (sky).
     * No-op until a source is set via setEnvironmentSource. When off, the
     * background is left to setBackground().
     */
    setEnvironmentBackground(visible: boolean): void;
    /**
     * Rotate the environment + background (Euler radians) — e.g. to align a Y-up
     * HDRI/equirect source with a Z-up scene (tilt ~90° about X).
     */
    setEnvironmentRotation(x: number, y: number, z: number): void;
    private _applyBackground;
    /**
     * Build a prefiltered (PMREM) environment from a procedural vertical
     * gradient — bright neutral sky at the top, mid horizon, darker ground —
     * using core Three only (no `three/examples` RoomEnvironment). Returns the
     * PMREM-filtered cube texture; the source `DataTexture` and the generator
     * are disposed before returning.
     */
    private _buildEnvironment;
    /** Build a THREE.Line for a line-type object — dashed material (+ line distances)
     *  when the style requests it, else a basic line material. */
    private _makeLine;
    private convert;
    /** Convert a Tekto Mesh → Three.js group with solid + wireframe */
    private convertMesh;
    /** Convert flat mesh data (with optional per-vertex colors) → Three.js group */
    private convertFlatMesh;
    /** Shared mesh group builder — handles solid / wireframe / hiddenline render modes */
    private buildMeshGroup;
    private createTextSprite;
    getThreeObject(id: string): THREE.Object3D | undefined;
    /**
     * Project a world-space point into the viewport. Returned `x`, `y` are
     * relative to the canvas's bounding rect (top-left = 0, 0).
     * `visible` is false when the point is behind the camera or outside
     * the normalised device cube — caller should hide the overlay.
     */
    worldToScreen(world: Vec3): {
        x: number;
        y: number;
        visible: boolean;
    };
    /** Enable/disable orbit ROTATION (pan + zoom stay). Off → a strict-2D view. */
    setOrbitRotateEnabled(enabled: boolean): void;
    /** Enable/disable click-to-pick on the canvas. */
    setPickEnabled(enabled: boolean): void;
    /** Subscribe to pick events. Returns unsubscribe. `id` is null when the user clicked background;
     *  `info` carries the modifier keys (Shift/⌘-click to add to a selection). */
    onPick(listener: (id: string | null, info: PickInfo) => void): () => void;
    private onPointerDown;
    private onPointerUp;
    private onPointerMoveDragging;
    private onPointerUpDragging;
    /** Returns the handle name under (clientX, clientY) or null. */
    private dragHandleHitTest;
    /** Raycast at (clientX, clientY) against a Three.Plane; returns the intersection point. */
    private raycastPlane;
    /** Register the per-drag, per-drag-end, and per-pick callbacks. */
    setDragHandleCallbacks(onMove: (name: string, x: number, y: number, z: number) => void, onEnd?: (name: string) => void, onPick?: (name: string | null) => void): void;
    /** Mark the start of a sketch run: clear the "seen this run" set. */
    beginDragHandleSweep(): void;
    /**
     * Create or update a drag handle by stable name. Position is world-space.
     * `constrain` (optional) snaps the dragged position — e.g. to a polyline.
     */
    upsertDragHandle(name: string, x: number, y: number, z: number, color?: string, size?: number, constrain?: (x: number, y: number, z: number) => [number, number, number], plane?: "ground" | "screen"): void;
    /** Remove any drag handles that weren't visited in this run. */
    endDragHandleSweep(): void;
    /** Currently selected drag handle, or null. */
    getSelectedHandle(): string | null;
    /** The handle currently being DRAGGED (set on pointer-down, cleared on pointer-up); null when idle. */
    getActiveDragHandle(): string | null;
    /** Programmatically select / deselect a drag handle (visual + callback). */
    setHandleSelected(name: string | null): void;
    private applyHandleStyle;
    /** Raycast at viewport coordinates and return the topmost pickable scene id (or null). */
    pickAt(clientX: number, clientY: number): string | null;
    /** Like `pickAt`, but also returns the world-space hit point, and skips hidden objects
     *  (the raycaster alone tests invisible ones too). Used by the markup overlay. */
    hitAt(clientX: number, clientY: number): {
        id: string;
        point: Vec3;
    } | null;
    /** Where a viewport ray meets the ground plane (z=0 for Z-up, y=0 otherwise), via the active camera. */
    groundAt(clientX: number, clientY: number): Vec3 | null;
    /** World-space bounds of a scene object as currently rendered, or null if empty/unknown. */
    objectBounds(id: string): {
        min: Vec3;
        max: Vec3;
    } | null;
    /** Is the scene object currently shown (its own style and every parent)? */
    isObjectShown(id: string): boolean;
    /** The camera as plain numbers, enough to reproduce the view. */
    cameraState(): {
        projection: "perspective" | "orthographic";
        position: number[];
        target: number[];
        up: number[];
        fov: number;
    };
    /** Render now and read the canvas back as a PNG data URL. Must stay synchronous: without
     *  `preserveDrawingBuffer` the buffer is only readable in the same task as the draw. */
    snapshotPng(): string;
    setGizmoMode(mode: GizmoMode): void;
    getGizmoMode(): GizmoMode;
    attachGizmo(id: string): void;
    detachGizmo(): void;
    private ensureGizmo;
    /** Read the gizmo'd Three.Object3D's transform and write it back into the SceneObject. */
    private writeBackTransform;
    /** Highlight one object, several (a record's objects, a multi-selection), or none. */
    setSelectionHighlight(ids: string | readonly string[] | null): void;
    /** Draw now, unconditionally. */
    render(): void;
    /**
     * Ask for a draw on the next `renderIfNeeded()`. Scene events, the camera API,
     * lights, drag handles, the gizmo, orbit controls and resizes already ask; call
     * it after changing three.js objects directly (e.g. one added with
     * `addExternalObject`).
     */
    requestRender(): void;
    /**
     * Draw only if something changed since the last draw, or while orbit damping
     * is still moving the camera. Returns whether it drew. An idle scene of 10k
     * objects otherwise costs a full draw on every animation frame.
     */
    renderIfNeeded(): boolean;
    /**
     * OrbitControls only reports moves above its EPS (~1e-3 rad), but damping keeps
     * creeping the camera after that, so the last drawn frame would lag the camera
     * slightly. Follow the creep frame by frame instead, and once the remaining
     * glide is under ~0.1 px apply it at once: the camera then rests exactly where
     * it was last drawn. Returns whether the camera moved this frame.
     */
    private _settleDamping;
    startLoop(): () => void;
    resize(): void;
    /** Compute the orthographic frustum to match the current perspective camera view distance. */
    private _syncOrthoCamFrustum;
    /**
     * Switch between perspective and orthographic projection.
     * Transfers the current camera position/orientation so the view is continuous.
     */
    setProjection(type: "perspective" | "orthographic"): void;
    /**
     * Set the camera up vector. Use (0,1,0) for top-down plan views (Z-up scenes),
     * and restore (0,0,1) for side/elevation views.
     */
    setCameraUp(x: number, y: number, z: number): void;
    /** The WebGL canvas element (for attaching input listeners / overlays). */
    get canvasEl(): HTMLCanvasElement;
    /** Set the viewport background color. */
    setBackground(color: number | string): void;
    /** Move the camera without changing its target. */
    setCameraPosition(x: number, y: number, z: number): void;
    /** Aim the camera (and orbit-controls target) at a point. */
    lookAt(x: number, y: number, z: number): void;
    /**
     * Fit all visible scene objects inside the current view.
     * Preserves the camera direction; only adjusts distance and target.
     */
    fitAll(): void;
    /** Pick scene objects under a screen coordinate */
    pick(screenX: number, screenY: number): {
        id: string;
        point: THREE.Vector3;
    } | null;
    /** Project a screen position onto a plane */
    screenToPlane(screenX: number, screenY: number, plane?: THREE.Plane): THREE.Vector3 | null;
    private disposeObject;
    dispose(): void;
}

/**
 * Tekto SVG Renderer
 *
 * Renders Scene objects as SVG for clean 2D visualization.
 * Supports labels, annotations, and CSS styling.
 * Uses XZ plane projection by default.
 */

interface SVGRendererConfig {
    width: number;
    height: number;
    viewBox: {
        minX: number;
        minY: number;
        width: number;
        height: number;
    };
    backgroundColor: string;
    showGrid: boolean;
    gridSpacing: number;
    gridColor: string;
    showLabels: boolean;
    projection: "xz" | "xy" | "yz";
    padding: number;
    pointRadius: number;
}
declare class SVGRenderer {
    private gScene;
    private config;
    private svg;
    private contentGroup;
    private gridGroup;
    private unsub;
    constructor(gScene: Scene, container: HTMLElement, config?: Partial<SVGRendererConfig>);
    private project;
    private drawGrid;
    render(): void;
    private renderObject;
    private createSVGCircle;
    private createSVGLine;
    private createSVGPolygon;
    private createSVGText;
    /** Update the viewBox (pan/zoom) */
    setViewBox(minX: number, minY: number, width: number, height: number): void;
    dispose(): void;
}

/**
 * Labels that point at elements, laid out the way a drawing does.
 *
 * The distinction that decides everything here: a tag in a modelling tool
 * names what you drew and floats where the thing is. A callout on a drawing
 * sits in the margin, in a column, with a leader to the thing it is about. The
 * second reads at a glance and stays readable while you turn the model,
 * because the labels never overlap and never swim; the first turns into a
 * heap the moment two elements line up behind each other, which on a building
 * is most of the time.
 *
 * So this is not "billboard some text at a world position". It is: project the
 * anchors, drop the ones you cannot see, stack what is left into the two
 * margins in the order their anchors run down the screen, and draw a leader
 * from each label to its anchor.
 *
 * The layout is a pure function of screen positions (`layoutLabels`), so the
 * rule that two labels never overlap is checked without a browser.
 */

/** What the host wants said about one thing in the scene. */
interface CalloutItem {
    id: string;
    /** the line that is read. Keep it short: this is a margin, not a panel. */
    text: string;
    /** a quieter second line, for a grade or a count */
    detail?: string;
    /** a swatch, so a callout and the element it points at agree by colour */
    colour?: string;
    /** what it points at. The anchor is the centre of their combined bounds. */
    objects: THREE.Object3D[];
}
/** One label, placed. Pixel coordinates within the host. */
interface Placement {
    id: string;
    side: "left" | "right";
    /** where the label's own box sits */
    x: number;
    y: number;
    /** where its leader ends */
    anchorX: number;
    anchorY: number;
}
/**
 * How wide a label may be in a host of this width.
 *
 * Fixed at 150 px this was fine in a full-window viewport and useless in a
 * panel: two 150 px margins in a 374 px column leave 74 px of drawing, so the
 * annotation covered the thing it annotated. A share of the width instead,
 * floored at something a product code still fits in and capped so a wide
 * viewport does not grow billboards.
 */
declare function labelWidthFor(hostWidth: number): number;
interface LayoutOptions {
    width: number;
    height: number;
    /** vertical pitch between labels, which is a label's height plus its gap */
    rowHeight?: number;
    /** how wide a label is allowed to be */
    labelWidth?: number;
    /** clearance from the host's edges */
    inset?: number;
}
/** What a layout could place, and what it could not. */
interface Layout {
    placed: Placement[];
    /**
     * Ids there was no room for, in the order they were given.
     *
     * Reported rather than clipped. A margin holds a fixed number of rows, and
     * the first version of this let the surplus run off the bottom edge into an
     * `overflow: hidden`, so eleven of thirty labels simply were not there and
     * nothing said so. A reader counting labelled elements would have counted
     * wrong. The caller is expected to say how many are missing.
     */
    dropped: string[];
}
/**
 * Stack labels into the left and right margins without overlapping.
 *
 * Each label wants to sit level with its own anchor and is pushed down until
 * it clears the one above; if that runs the column off the bottom, the whole
 * column is lifted back inside. Labels keep the vertical order of their
 * anchors, which is what makes the leaders readable: leaders that cross each
 * other are worse than no leaders, because the reader follows the wrong one
 * and believes the answer.
 *
 * Anchors on the left half of the screen get the left margin. Not because the
 * side matters, but because a leader that crosses the whole drawing to reach
 * the far margin passes over everything in between.
 *
 * More labels than rows is resolved by *input order*, which is the caller's
 * priority, and never by compressing the pitch: labels printed on top of each
 * other are not more information, they are less.
 */
declare function layoutLabels(anchors: {
    id: string;
    x: number;
    y: number;
}[], opts: LayoutOptions): Layout;
/**
 * The DOM layer: labels, leaders, and clicks.
 *
 * Knows nothing about cameras or meshes. It is handed placements in pixels and
 * renders them, which is what keeps the layout rule above testable.
 */
declare class Callouts {
    private opts;
    private root;
    private svg;
    private labels;
    private items;
    private overflow;
    private labelWidth;
    constructor(host: HTMLElement, opts?: {
        labelWidth?: number;
        onPick?: (id: string) => void;
        onHover?: (id: string | null) => void;
    });
    /** What there is to say. Placements arrive separately, each frame. */
    setItems(items: CalloutItem[]): void;
    /** Track the host's width, so labels stay a share of it rather than a
     *  constant that only suits one panel size. */
    setLabelWidth(px: number): void;
    /** The objects a caller must measure to anchor each callout. */
    objectsOf(id: string): THREE.Object3D[];
    get ids(): string[];
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
    update(placements: Placement[], unplaced?: number): void;
    private showOverflow;
    private make;
    setVisible(on: boolean): void;
    dispose(): void;
}

/**
 * A viewport for looking at a building.
 *
 * ThreeRenderer draws a `Scene` of `SceneObject`s and is the right thing when
 * the library owns the model. This is the other case: an app that has already
 * built its own meshes (from IFC, from a cut list, from a supplier's geometry)
 * and wants somewhere honest to put them. It takes `THREE.Mesh`es and gives
 * back the five things every such app has otherwise rewritten:
 *
 *  - **view modes** that answer different questions. Shaded says what a thing
 *    is made of; ghost says where a part sits inside the whole; hidden line is
 *    the drawing convention, and with an orthographic camera it is a plan or an
 *    elevation rather than a picture.
 *  - **creases built progressively.** EdgesGeometry runs per mesh on the main
 *    thread, so a project-scale model either stalls the tab or (worse, and this
 *    is what actually happened) silently gets no outlines at all and hidden
 *    line comes out as a white silhouette. Above a threshold they are built
 *    when a mode asks, a few hundred meshes per frame, reporting as they go.
 *  - **a real sun.** `SunPosition` is a Michalsky solar position accurate to
 *    about a hundredth of a degree; what was missing was the part between it
 *    and a light: frame the shadow camera to the content, put a catcher under
 *    the lowest point, and say out loud what was assumed.
 *  - **navigation the reader can reach.** The axis gizmo in the corner is not
 *    decoration: without it the named views and the orthographic camera above
 *    were public API that no application built on this class had ever called,
 *    so the plan and elevation this viewport can draw were unreachable by
 *    anyone using it. It also answers, before you click anything, which way is
 *    up and which face you are looking at.
 *  - **teardown that releases the WebGL context.** `renderer.dispose()` does
 *    not, and a browser allows only a handful of contexts. A couple of
 *    viewports times every hot reload exhausts them, after which new canvases
 *    come back black and nothing says why.
 *
 * What it deliberately does not know: what your meshes mean. Colour by IFC
 * class, by framing role, by whether a decision has been made against it, all
 * of that is the app's, supplied through `appearanceOf`.
 */

/**
 * How the content is drawn. Not decoration: each answers a different question.
 *  shaded      what is it made of
 *  ghost       where does this part sit in the whole, everything else stepped
 *              back so the selection reads through the fabric
 *  hidden-line the drawing convention: white surfaces, dark creases, occluded
 *              lines hidden by the surfaces in front of them
 */
type ViewMode = "shaded" | "ghost" | "hidden-line";
/**
 * Where to cut, in the content's own axes.
 *
 * `at` is a fraction of the content's extent along that axis, so 0.5 is
 * halfway through whatever is loaded and the caller needs to know nothing
 * about the model's coordinates.
 */
interface SectionRequest {
    axis: "x" | "y" | "z";
    at: number;
    /** keep the far side instead of the near one */
    flip?: boolean;
}
/** Perspective for looking at a building, orthographic for drawing one. */
type Projection = "perspective" | "orthographic";
/** The six faces of the bounding box, plus the corner view. */
type StandardView = "iso" | "top" | "bottom" | "front" | "back" | "left" | "right";
/** How one mesh is painted. Colours are hex integers, as three.js takes them. */
interface Appearance {
    colour: number;
    opacity: number;
    depthWrite: boolean;
    polygonOffset: boolean;
}
interface ViewportOptions {
    background?: number;
    /**
     * Whether the content stands on a visible ground. True by default, because a
     * building floating in a void reads as floating. Turn it off for a viewport
     * showing one component rather than a building: a product on a thumbnail is
     * not standing anywhere, and the horizon behind it is noise.
     */
    ground?: boolean;
    /**
     * Up axis of the meshes handed over. Tekto and IFC are both Z-up, but
     * web-ifc returns geometry already turned to three.js Y-up, so an app can
     * have both in play. Getting this wrong lays a storey-height wall on the floor.
     */
    up?: "y" | "z";
    /** The corner the camera starts in. */
    view?: StandardView;
    /**
     * The axis widget in the corner: which way is up, and a click target for
     * every face view. True by default, because without it this class's named
     * views and its orthographic camera are unreachable by anybody using it, and
     * a reader has no way to tell a plan from a steep look down.
     *
     * Turn it off for a viewport showing one component rather than a building,
     * where the same reasoning as `ground` applies: a product on a thumbnail has
     * no north and the widget is noise.
     */
    gizmo?: boolean;
    /** Corner for that widget. Bottom right by default, out of the way of the
     *  toolbars apps put along the top. */
    gizmoCorner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /**
     * The projection changed, which the host cannot otherwise know: the gizmo
     * offers the toggle, so a host that only ever called `setProjection` itself
     * would still be out of date the moment a reader used the widget.
     */
    onProjection?: (projection: Projection) => void;
    /** A click on a callout label. See `setCallouts`. */
    onPickCallout?: (id: string) => void;
    /** The pointer over a callout label, so a host can light the element it
     *  points at. Null on leaving. */
    onHoverCallout?: (id: string | null) => void;
    /** A click that hit nothing reports null. A drag orbits and reports nothing. */
    onPick?: (mesh: THREE.Mesh | null, event: PointerEvent) => void;
    /**
     * What the pointer is over, as it moves. Reported only when it changes, and
     * never while orbiting, so a host can paint a hover without a raycast per
     * frame. Without this a model reads as a picture: nothing answers until you
     * have already clicked, and you cannot tell what a click would select.
     */
    onHover?: (mesh: THREE.Mesh | null) => void;
    /**
     * The app's last word on how one mesh looks, asked before the mode decides.
     * Return null to let the mode paint it. This is where a selection colour, or
     * "this part is spoken for", belongs: the viewport has no opinion on either.
     */
    appearanceOf?: (mesh: THREE.Mesh, mode: ViewMode) => Partial<Appearance> | null;
}
interface ContentOptions {
    /** Overrides the viewport's own setting for this content only. */
    up?: "y" | "z";
    /**
     * Which meshes get a crease outline: all of them, none, or a predicate. A
     * translucent sheet usually wants none, because an outline around something
     * you can see through reads as a box drawn over the thing that matters.
     */
    outline?: boolean | ((mesh: THREE.Mesh) => boolean);
    /** Crease angle in degrees. 30 keeps a curved surface from turning into wireframe. */
    creaseAngle?: number;
}
/** The page shaded and hidden-line are drawn on, when the host names none. */
declare const DEFAULT_BACKGROUND = 16119802;
/** Crease colour and weight for a mode. Hidden line draws them at full strength
 *  because in that mode the lines are the drawing. */
declare function edgeStyle(mode: ViewMode): {
    colour: number;
    opacity: number;
};
/**
 * The page a mode is drawn on.
 *
 * Ghost inverts: pale edges over a dark ground read where dark edges over a
 * pale one wash out, and a translucent surface adds light instead of
 * subtracting it, so the parts stack up legibly instead of greying together.
 * The other two keep the host's own background.
 */
declare function modeBackground(mode: ViewMode, base: number): number;
/**
 * How a cut face is drawn.
 *
 * Poché: solid and dark, and flat rather than lit. A section is a drawing
 * convention before it is a picture, and the convention is that cut material
 * reads as one mass so the eye separates what was sliced from what is merely
 * seen beyond it. Shading the cut instead, which is what a lit material does,
 * gives it highlights and gradients and it stops reading as a cut at all: it
 * becomes another grey surface among the grey surfaces behind it.
 *
 * Ghost inverts, as it does everywhere else here. On its dark ground a black
 * poché would be a hole rather than a solid, so the cut goes pale and the
 * relationship survives.
 */
declare function sectionAppearance(mode: ViewMode): {
    colour: number;
};
/**
 * The visible plane the content stands on.
 *
 * Independent of whether the sun is casting: a building floating in a void
 * with a smudge under it reads as floating, and the smudge alone was doing all
 * the work of saying which way is down. Hidden in hidden line, where a grey
 * plate is not what a drawing is. The tone is a step off the background rather
 * than a colour of its own, so it reads as ground and not as a surface
 * somebody modelled.
 */
declare function groundAppearance(mode: ViewMode): {
    visible: boolean;
    colour: number;
    opacity: number;
};
/** How a mode paints a surface whose own colour is `base`. */
declare function surfaceAppearance(mode: ViewMode, base: number): Appearance;
/**
 * Sun and sky intensity for a mode.
 *
 * Ghost is transparent throughout and a shadow cast by something you can see
 * through reads as dirt on the drawing, so it never casts. With the sun doing
 * the work the sky has to step back, or the shadows wash out.
 */
declare function lightBalance(mode: ViewMode, shadows: boolean): {
    shadowed: boolean;
    sun: number;
    sky: number;
    groundOpacity: number;
};
/**
 * Where the camera sits for a named view, as three.js spherical angles: phi
 * from +Y, theta around Y from +Z towards +X.
 */
declare function standardOrbit(view: StandardView): {
    phi: number;
    theta: number;
};
/**
 * Where the camera sits to look down `direction`, which points from the subject
 * towards the camera. The inverse of what the tick loop does with a spherical.
 *
 * Clamped off the poles like the named views, so clicking the gizmo's Y ball
 * lands on the same well-defined orientation that `setView("top")` does rather
 * than on a plan whose north is whatever floating point decided.
 */
declare function orbitFor(direction: {
    x: number;
    y: number;
    z: number;
}): {
    phi: number;
    theta: number;
};
/**
 * The end angle to interpolate towards so a turn takes the short way round.
 *
 * Without this, orbiting from theta 3.0 to -3.0 (a tenth of a turn apart on the
 * screen) spins the building almost the whole way about instead, which reads as
 * the viewport having lost its place rather than as a view change.
 */
declare function shortestTurn(from: number, to: number): number;
/**
 * Whichever of the six axis directions a view is already closest to. What a
 * double click on the gizmo snaps to: the reader is nearly at an elevation and
 * wants to be exactly at one, without having to work out which.
 */
declare function nearestAxis(direction: {
    x: number;
    y: number;
    z: number;
}): THREE.Vector3;
/** Smoothstep. A camera that starts and stops abruptly reads as a cut, and a
 *  cut is exactly what an animated view change exists to avoid. */
declare function easeInOut(t: number): number;
/**
 * How far back to sit so a sphere of `boundingRadius` fits, on the tighter of
 * the two field-of-view axes. A portrait panel clips a wide building on the
 * horizontal, which is exactly the case a vertical-only fit gets wrong.
 */
declare function fitRadius(boundingRadius: number, fovDeg: number, aspect: number, margin?: number): number;
/**
 * The orthographic frustum that frames what a perspective camera would see at
 * the same distance, so switching projection changes the drawing convention
 * and not the subject.
 */
declare function orthoFrustum(distance: number, fovDeg: number, aspect: number): {
    left: number;
    right: number;
    top: number;
    bottom: number;
};
/**
 * A three.js viewport for meshes the app built itself (an IFC model, a cut list), as
 * opposed to a `Scene`: shaded / ghost / hidden-line modes, named views, sections, sun,
 * nav gizmo. Takes `THREE.Mesh[]` via `setContent`. For tekto `Scene`s use `ThreeRenderer`.
 */
declare class Viewport {
    private host;
    private opts;
    readonly scene: THREE.Scene;
    private renderer;
    private perspective;
    private orthographic;
    private projectionMode;
    private root;
    private meshGroup;
    private outlines;
    /** Bright edges around a chosen set, drawn over everything. See setOutlined. */
    private highlight;
    /**
     * The poché: one back-faced copy of each mesh while a section is live.
     *
     * Under `root`, sharing geometry and local matrices with the meshes, so it
     * inherits the up-axis rotation exactly as they do.
     */
    private sectionGroup;
    /** kept so a colour change can rebuild the same cut */
    private sectionRequest;
    private section;
    /** null means "whatever the view mode says", which is the usual case. */
    private sectionColour;
    private frame;
    private mode;
    private outlinesBuilt;
    private buildingOutlines;
    private content;
    private sun;
    private sky;
    /** Catches the cast shadow and is otherwise invisible: ShadowMaterial draws
     *  nothing where nothing falls on it, so no ground slab appears. */
    private ground;
    /**
     * A visible plane under the shadow catcher, so the building stands on
     * something rather than floating in a void with a smudge beneath it. Sized
     * and placed with the shadow catcher; hidden in hidden line, where a grey
     * plate is not what a drawing is.
     */
    private groundPlane;
    private shadows;
    private hovered;
    private lastHover;
    /** Where the light comes from, in three.js Y-up. Replaced by a real solar
     *  position through setSun; this is the fallback for a sun below the horizon,
     *  and for a viewport nobody has told a date. */
    private sunDir;
    private sunNote;
    private target;
    private spherical;
    private gizmo;
    private callouts;
    /** World-space anchor per callout, remeasured only when the content changes:
     *  a bounding box costs a walk of the geometry and nothing in the scene
     *  moves except the camera. */
    private calloutAnchors;
    /** Which callouts the reader can actually see, recomputed on a timer rather
     *  than per frame, because it costs a raycast each. */
    private calloutVisible;
    private calloutCheckedAt;
    /** Last orbit the gizmo was drawn for, so it is redrawn on a move and not on
     *  every one of the frames a still camera also renders. */
    private gizmoAt;
    /**
     * A camera move in progress. Any input from the reader drops it: a view
     * animation that fights an orbit is worse than no animation at all.
     */
    private move;
    constructor(host: HTMLElement, opts?: ViewportOptions);
    /** The camera currently in use. Follows setProjection. */
    get camera(): THREE.Camera;
    private setUp;
    private bind;
    /** Orbit by a pointer travel in pixels. Shared by the canvas and the gizmo,
     *  so dragging the widget turns the model exactly as dragging the model does. */
    private orbitBy;
    /** The mesh under the pointer, at most every other animation frame.
     *  Reported only on a change, so the host repaints on a crossing and not on
     *  every pixel of travel. */
    private hover;
    private meshAt;
    private pick;
    /**
     * Show these meshes, replacing whatever was there.
     *
     * The meshes are the app's: build them however the app colours things, and
     * put the unpainted colour on `mesh.userData.baseColour` so shaded mode can
     * return to it.
     */
    setContent(meshes: THREE.Mesh[], opts?: ContentOptions): void;
    /** Which meshes the content options ask for an outline around. */
    private wantsOutlines;
    clear(): void;
    /** Convenience for the common case: a mesh from raw buffers, which is what
     *  every Tekto generator and every IFC reader hands over. */
    static meshFrom(buffers: {
        positions: Float32Array;
        normals?: Float32Array;
        indices: Uint32Array | Uint16Array;
    }, material: THREE.Material): THREE.Mesh;
    get viewMode(): ViewMode;
    /**
     * The mode a reader chose. Unlike the internal apply, this will go and build
     * the outlines the mode needs if large content was loaded without them.
     */
    setViewMode(mode: ViewMode, onProgress?: (message: string | null) => void): void;
    get projection(): Projection;
    /** Perspective or orthographic. Orthographic with hidden line and a face view
     *  is a plan or an elevation; that pairing is the point of having both. */
    setProjection(projection: Projection): void;
    /**
     * Point the camera at a named face, keeping the distance.
     *
     * Animated by default. A view change that jumps is read as the model having
     * been replaced rather than turned, and the reader loses which face they are
     * now looking at, which is the one thing the change was for. Pass
     * `{ animate: false }` where a jump is wanted (restoring a stored view, or a
     * test that wants the end state now).
     */
    setView(view: StandardView, opts?: {
        animate?: boolean;
    }): void;
    /**
     * Look down a direction given in the content's own axes, so a caller with a
     * Z-up model asks for `(0, 0, 1)` and gets a plan whichever way the viewport
     * has turned the content to face three.js.
     */
    orbitTo(direction: THREE.Vector3, opts?: {
        animate?: boolean;
    }): void;
    /** Which way the camera currently lies from the subject, in content axes. */
    private viewDirection;
    private orbit;
    /** Start a camera move to a partial end state, holding whatever it omits. */
    private animate;
    /** Advance a camera move, if one is running. Called once per frame. */
    private step;
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
    setCallouts(items: CalloutItem[]): void;
    /**
     * Which anchors the reader can actually see.
     *
     * A leader pointing confidently at a wall that is behind three other walls
     * is worse than no leader: on a face view half the building is occluded, and
     * without this every one of those elements would still be labelled and the
     * reader would have no way to tell which. One raycast per callout, on a
     * timer, because the answer only changes when the camera moves.
     */
    private checkCalloutVisibility;
    /** Project, cull and lay out this frame's labels. */
    private drawCallouts;
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
    setSection(section: SectionRequest | null): void;
    /** Override what the cut face is painted. Pass null to go back to following
     *  the view mode, which is what a section normally wants. */
    setSectionColour(colour: number | null): void;
    /** The section in force, or null. */
    get sectionAt(): SectionRequest | null;
    private clearSection;
    /** Clipping is per material in three, so it has to reach every one the app
     *  handed over as well as the ones this class makes. */
    private applyClipping;
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
    setOutlined(meshes: THREE.Object3D[], colour?: number): void;
    /** Repaint every mesh. Call after changing whatever `appearanceOf` reads. */
    repaint(): void;
    /** Apply the current mode to one mesh. The app's hook has the first word. */
    private paint;
    private applyMode;
    /**
     * Creases for the content, a chunk per frame.
     *
     * One LineSegments per chunk rather than per mesh: a few thousand line
     * objects is a few thousand draw calls, and merging costs nothing here
     * because the outlines are styled as one anyway.
     */
    private buildOutlines;
    get shadowsOn(): boolean;
    /** Sun shadows on or off. Off by default: they are a presentation choice, and
     *  in hidden line they are a departure from the drawing convention. */
    setShadows(on: boolean): void;
    get sunDescription(): string;
    /**
     * Put a real sun in the sky, for a place and an instant.
     *
     * Two honest limits, both reported through `sunDescription`: the content's
     * +Y (or +Z, for Z-up content) is assumed to be north, because a viewport
     * cannot know a project's true north; and a sun below the horizon falls back
     * to a generic light rather than showing a black building.
     */
    setSun(date: Date, latitude: number, longitude: number, place?: string): void;
    /** Sun and ground, framed to whatever is in the scene. Cheap, and only run
     *  when the contents or the light change. */
    private frameSun;
    /** Frame the contents: centre on the bounding box and pull back far enough
     *  that it fits the tighter of the two field-of-view axes. */
    fit(margin?: number): void;
    /**
     * Frame part of the content: a selection, a storey, one component.
     *
     * Animated, unlike `fit`, because the reader is going somewhere within a
     * model they can already see and needs to keep hold of where. The margin is
     * looser than `fit`'s for the same reason: a part framed edge to edge loses
     * the surroundings that say which part it is.
     */
    fitTo(objects: THREE.Object3D[], opts?: {
        margin?: number;
        animate?: boolean;
    }): void;
    private radiusFor;
    private resize;
    private tick;
    dispose(): void;
}

/**
 * The axis widget in the corner of a viewport.
 *
 * It exists because the Viewport already knew how to be a plan or an
 * elevation and no user could ask it to: `setView` and `setProjection` were
 * public, tested, and unreachable from every application built on them. A
 * capability with no affordance is a capability nobody has.
 *
 * Drawn as SVG rather than a second WebGL scene. It stays crisp at any device
 * pixel ratio, it costs no context (a browser allows only a handful, and this
 * library already fights for them), and hit testing is what the DOM does for a
 * living: each ball is an element, so a click is a click rather than a
 * raycast.
 *
 * What it shows is the *content's* axes, not the world's. A Z-up model is
 * rotated into a Y-up scene by `setUp`, and a gizmo that reported the scene's
 * axes would tell an engineer their Z was horizontal.
 */

interface NavGizmoOptions {
    /** Pixels. The ball radius and font scale with it. */
    size?: number;
    /** Which corner of the host it sits in. */
    corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** Distance from the two edges of that corner, in pixels. */
    inset?: number;
    /**
     * Whether to show the projection toggle under the axes.
     *
     * On by default, and not decoration either: clicking an axis gets you a face
     * view, but a face view in perspective is a photograph of a building taken
     * from the front, with the far corner smaller than the near one. An
     * elevation is the orthographic one. Having reached the view and not the
     * convention, a reader is one control short of the drawing they asked for.
     */
    projectionToggle?: boolean;
    /** Look down this direction, in content space. The viewport animates. */
    onAxis: (direction: THREE.Vector3) => void;
    /** Drag on the gizmo, in pixels, to orbit. */
    onDrag: (dx: number, dy: number) => void;
    /** Double click: snap to whichever axis the view is already nearest. */
    onSnap: () => void;
    /** Flip between perspective and orthographic. */
    onProjection?: () => void;
}
declare class NavGizmo {
    private opts;
    private root;
    private svg;
    private balls;
    private projectionButton;
    private size;
    private centre;
    private reach;
    private ballR;
    private scratch;
    private inverse;
    /** Set while a drag is under way, so the click that ends one is not read as
     *  a click on whichever ball happened to be under the pointer. */
    private moved;
    /** The window listeners a drag needs, dropped in one go on dispose. */
    private listeners;
    constructor(host: HTMLElement, opts: NavGizmoOptions);
    private makeBall;
    /**
     * The projection toggle: a caption that names the convention in force and
     * changes it when clicked, rather than an icon nobody can read at 9 pixels.
     */
    private makeProjectionToggle;
    /** Tell the widget which projection is in force, so its caption is true. */
    setProjection(projection: "perspective" | "orthographic"): void;
    private bind;
    /**
     * Redraw for the current camera.
     *
     * `contentRotation` carries the root's own turn, so the labels describe the
     * model's axes rather than the scene's.
     */
    update(camera: THREE.Camera, contentRotation: THREE.Quaternion): void;
    setVisible(on: boolean): void;
    dispose(): void;
}

type SketchFn = (lab: Lab) => void;
/**
 * One function = one interactive 3D app. `fn` runs again on every control change and
 * re-declares the whole scene ("rebuilt" model: no object outlives a run). Y-up by default;
 * pass `up: "z"` for CAD content. Installs `window.__tekto` for `npm run snap`.
 *
 *   sketch((lab) => { const r = lab.slider("Radius", 0.1, 3, 1); lab.sphere(r.value); });
 *
 * For an app whose users create, select and save objects, use {@link appShell} (retained).
 */
declare function sketch(fn: SketchFn, config?: SketchConfig): SketchInstance;
declare class SketchInstance {
    private fn;
    private config;
    private container;
    private scene;
    private renderer;
    private store;
    private panel;
    private items;
    private layerTrees;
    private theme;
    private buttons;
    exports: Map<string, ExportRegistration>;
    imports: Map<string, ImportRegistration>;
    private _exportListeners;
    private _importListeners;
    private logs;
    private infoText;
    private animateFn;
    private frame;
    private startTime;
    private lastTime;
    private disposed;
    private _running;
    private _squelch;
    private _hasTabs;
    private _onceRan;
    private _onceSeq;
    private rng;
    private _mouseX;
    private _mouseY;
    private _pmouseX;
    private _pmouseY;
    private _mousePressed;
    private _key;
    private _keyPressed;
    private _onMouseClicked;
    private _onMouseDragged;
    private _onKeyPressed;
    private _onKeyReleased;
    private _onPick;
    private _selectedId;
    private _pickEnabled;
    private _pickUnsub;
    private _dragHandles;
    private _dragHandleSeq;
    private _dragHandlesWired;
    private _onHandlePick;
    private _boundKeyDown;
    private _boundKeyUp;
    private _shapeVerts;
    private _shapeMode;
    private _continuous;
    private _retain;
    private panelEl;
    private viewportEl;
    private logEl;
    private markup;
    private bridge;
    private _fileMenusEl;
    private _fileMenusSig;
    private _trackSource;
    private _srcById;
    private separatorCount;
    private _prevParamFingerprint;
    /** Log container inside the "Info" tab (tab mode only; set during render) */
    private _panelLogEl;
    /** Info-text section in the panel footer */
    private _panelInfoEl;
    /** Log section in the panel footer (non-tab mode) */
    private _panelFooterLogEl;
    private _lastRerunTime;
    private _rerunTimer;
    private _displayKeys;
    private _onDisplayFns;
    private _onTabChange;
    private _viewLayerStack;
    private _viewLayerObjects;
    constructor(fn: SketchFn, config: SketchConfig);
    private buildDOM;
    private initRenderer;
    private wireInput;
    enablePicking(enabled: boolean): void;
    setGizmoMode(mode: "translate" | "rotate" | "scale" | "none"): void;
    setSelected(id: string | null): void;
    /** Create or update a drag handle for this sketch run; returns a Reactive<Vec3>. */
    registerDragHandle(initX: number, initY: number, initZ: number, opts?: {
        name?: string;
        color?: string;
        size?: number;
        constrain?: (x: number, y: number, z: number) => [number, number, number];
        plane?: "ground" | "screen";
    }): Reactive<Vec3>;
    setHandleSelected(name: string | null): void;
    get selectedHandle(): string | null;
    get activeDragHandle(): string | null;
    /** Programmatically set a slider's value — updates the stored param AND its live DOM control. */
    setSlider(label: string, value: number, group?: string): void;
    private runSketch;
    /** Feed the current control structure to the shared ControlPanel. */
    private panelRender;
    private buildLab;
    private addMeshHandle;
    private addFlatMeshHandle;
    private addPointHandle;
    private addLineHandle;
    private addPolylineHandle;
    private addShapeHandle;
    private updateLog;
    private startLoop;
    /** A change to `key` is display-only when the param was declared with
     *  `display: true` AND the sketch registered a display pass; otherwise
     *  fall back to the normal full re-run (safe default). */
    private isDisplayChange;
    /** Run the display pass (restyle-only, no geometry rebuild). */
    private runDisplayPass;
    /** Throttled sketch re-run — at most once per 50ms so the browser stays responsive during slider drag. */
    private scheduleRerun;
    /** Immediate re-run on control commit (slider drag-end, toggle, select) —
     *  cancels any pending throttled re-run so the final value applies now. */
    private commitRun;
    /** Force re-run the sketch */
    rerun(): void;
    /**
     * Draw the viewport on the next frame. The loop draws only when something
     * changed; call this after changing three.js objects directly (e.g. one added
     * with `addExternalObject`). Scene, camera and Lab calls already do.
     */
    requestRender(): void;
    /** Change the scene render mode (solid / wireframe / hiddenline). */
    setRenderMode(mode: RenderMode): void;
    /**
     * Switch shading preset. `"studio"` enables PBR materials, sun-style
     * shadows, and ACES tonemapping; `"flat"` is the lightweight default.
     * See `LightingMode` in `src/scene/Scene.ts` for the trade-offs.
     */
    setLightingMode(mode: LightingMode): void;
    /**
     * Toggle a procedural environment map for image-based reflections. Only
     * visibly affects `"studio"` PBR materials (it modulates their specular
     * highlights / reflections); harmless in `"flat"` mode.
     */
    setEnvironment(enabled: boolean): void;
    /**
     * Set an equirectangular source texture (e.g. an HDR loaded via RGBELoader)
     * for the environment map. Pass null for the built-in procedural gradient.
     */
    setEnvironmentSource(equirect: THREE.Texture | null): void;
    /** Show the environment source (e.g. the HDR) as the visible sky backdrop. */
    setFog(color: string, density?: number): void;
    setExposure(v: number): void;
    setEnvironmentBackground(visible: boolean): void;
    /** Rotate the environment + background (Euler radians); aligns a Y-up HDRI to Z-up. */
    setEnvironmentRotation(x: number, y: number, z: number): void;
    /**
     * Add a raw THREE.Object3D (e.g. a glTF/GLB scene loaded with GLTFLoader) to
     * the scene, kept across sketch re-runs. Re-adding the same id replaces it.
     */
    addExternalObject(obj: THREE.Object3D, id: string): void;
    removeExternalObject(id: string): void;
    /**
     * Studio-mode default PBR material for meshes that don't set their own
     * metalness/roughness in their VisualStyle. metalness 0..1 (1 = metal),
     * roughness 0..1 (0 = mirror). Applies on the next sketch re-run.
     */
    setStudioMaterial(metalness: number, roughness: number, color?: string | null, flatShading?: boolean): void;
    /**
     * Show/hide line + point "helper" objects (axes, construction lines, markers,
     * labels) while keeping solid meshes — e.g. for a clean render view.
     */
    setHelpersVisible(visible: boolean): void;
    /**
     * Show/hide tekto's studio shadow-catcher plane at the origin. Hide it when
     * your sketch provides its own ground to receive shadows.
     */
    setShadowGroundVisible(visible: boolean): void;
    /**
     * Aim the main directional light from outside the sketch fn — used
     * by host shells (testbench, custom apps) to push a sun position
     * computed from their own date/location UI. Inside a sketch, prefer
     * `lab.setSunDirection(direction)`.
     */
    setSunDirection(direction: Vec3, distance?: number): void;
    /**
     * Read the sketch's registered export entries (via `lab.registerExport`).
     * Returns a fresh snapshot — safe to iterate without holding a reference
     * to the underlying Map.
     */
    getExports(): ExportRegistration[];
    getImports(): ImportRegistration[];
    /**
     * Subscribe to export/import registration changes. The shell (testbench
     * top bar, app frame) uses this to re-render its menus when the sketch
     * adds or replaces entries between re-runs.
     */
    onExportsChange(fn: () => void): () => void;
    onImportsChange(fn: () => void): () => void;
    private initMarkup;
    private describeObject;
    /** Camera, params, logs, errors and a scene summary grouped by (layer, label, type, source line). */
    private markupContext;
    /**
     * Export ▾ / Import ▾ in the sketch's own header, from `lab.registerExport/registerImport`.
     * Without a header (inside a shell) the shell's top bar shows them instead. Rebuilt only
     * when the registered names change, not on every re-run.
     */
    private renderFileMenus;
    /** The current value of every control, keyed for `setParams` — save it to reopen a design. */
    getParams(): Record<string, unknown>;
    /**
     * Set controls by label ("Radius"), "Group:Label" or key — e.g. the object `getParams()`
     * returned — and re-run once. Reports names it could not apply instead of dropping them.
     */
    setParams(values: Record<string, unknown>): {
        applied: string[];
        unknown: string[];
        ambiguous: {
            name: string;
            keys: string[];
        }[];
    };
    /** Destroy the sketch and clean up */
    dispose(): void;
}

/**
 * Tekto App Shell — Level 2.
 *
 * Reusable harness for apps with a persistent GUI sidebar + 3D viewer.
 * Unlike the Sketch API, the GUI panel is built ONCE and updated in-place,
 * so animation loops never break checkbox / toggle interaction. This is the
 * blessed path for "a real app": declarative params (ParamStore), the shared
 * ControlPanel sidebar, a Scene + ThreeRenderer, and a top bar with the
 * testbench's lighting / render-mode / camera / sun controls built in.
 *
 * (Promoted into the library from the app-shell.ts previously copy-pasted
 * between consumer apps — see CLAUDE.md "The shell pattern".)
 *
 * Usage:
 *
 *   import { appShell } from "tekto";
 *
 *   const app = appShell({
 *     title: "My App",
 *     container: document.getElementById("app")!,
 *     params: {
 *       radius: { type: "float", min: 0.1, max: 5, default: 1, label: "Radius" },
 *       show:   { type: "bool", default: true, label: "Show mesh" },
 *       reset:  { type: "button", label: "Reset", action: () => { ... } },
 *     },
 *     camera: [10, 8, 10],
 *     target: [0, 2, 0],
 *   });
 *
 *   app.params.get("radius");                     // read a value
 *   app.params.onChange((key, value) => rebuild()); // react to changes
 *   app.onBuild(() => regenerate());              // build params → rebuild geometry
 *   app.onDisplay(() => restyle());               // `display: true` params → restyle only
 *   app.rebuild();                                // initial build (build + display pass)
 *   app.onAnimate((dt) => { ... });               // per-frame callback
 *   app.status("Layer 5 / 20\nSim: 3.2s");        // overlay text (no rebuild)
 *   app.scene.addMesh(mesh);                      // geometry via the Scene
 */

interface AppShellConfig<S extends ParamSchema = ParamSchema> {
    title?: string;
    container: HTMLElement;
    params: S;
    /** Group params into named sections. Keys = group names, values = param key arrays. */
    groups?: Record<string, string[]>;
    camera?: [number, number, number];
    target?: [number, number, number];
    background?: number;
    /** Camera up-axis. Default "z" (tekto Z-up convention). Use "y" for the Y-up built-in primitives. */
    up?: "y" | "z";
    theme?: "dark" | "light";
    /** Panel width in pixels (default: 260) */
    panelWidth?: number;
    /** Renderer config overrides */
    renderer?: Partial<ThreeRendererConfig>;
    /** Top bar with Lighting / Render-mode / Camera / Sun controls. Default: true. */
    topBar?: boolean;
    /** Show the ✎ Markup button (draw instructions on the view; marks name document records). Default `true`. */
    markup?: boolean;
}
interface AppShellInstance<S extends ParamSchema = ParamSchema> {
    params: ParamStore<S>;
    scene: Scene;
    renderer: ThreeRenderer;
    /** The sidebar renderer — call panel.render(...) to change the control structure at runtime. */
    panel: ControlPanel;
    /** Register an animation callback (called every frame with dt in seconds) */
    onAnimate(fn: (dt: number, time: number) => void): void;
    /**
     * Register the build pass: runs (then the display pass) whenever a param
     * WITHOUT `display: true` changes. Regenerate geometry here. Registering
     * does not run it — call `rebuild()` once after setup for the initial build.
     */
    onBuild(fn: () => void): void;
    /**
     * Register the display pass: runs when a param WITH `display: true`
     * changes, and after every build pass. Only restyle existing scene
     * objects here (visibility, colors, materials) — never create geometry,
     * so display-param changes stay cheap.
     */
    onDisplay(fn: () => void): void;
    /** Run the build pass then the display pass (e.g. for the initial build). */
    rebuild(): void;
    /** Update the status overlay text (cheap — just sets textContent) */
    status(text: string): void;
    /**
     * A new layer over the 3D view, under the status line and ✎ Markup — mount a 2D view
     * there (`new SheetCanvas(app.overlay(), { sheet })`); hide it (`style.display = "none"`)
     * to show the 3D view again. Its canvases marked `data-tekto-overlay` are in snapshots.
     */
    overlay(): HTMLElement;
    /** Dispose everything */
    dispose(): void;
}
/**
 * A persistent app ("retained" model): params declared once as a schema, geometry built in
 * `onBuild`, restyled in `onDisplay`, objects added to a `Scene` the app owns and keeps.
 * Z-up by default. The path for apps whose users build, select, name and save things.
 *
 *   const app = appShell({ container, params: { floors: { type: "int", min: 1, max: 40, default: 12 } } });
 *   app.onBuild(() => { app.scene.clear(); … app.scene.addMesh(m); }); app.rebuild();
 */
declare function appShell<S extends ParamSchema>(config: AppShellConfig<S>): AppShellInstance<S>;

/**
 * PresenceBar — who is online in a SharedStore document: a dot for the connection, one round
 * badge per person (their colour, initials or GitHub avatar; tooltip = name and what they are
 * on), and a Sign in / Sign out button. Sits in the viewport's top bar row, left of ✎ Markup.
 */

interface PresenceBarOptions {
    /** CSS for the bar's position inside the host; default: top right, left of ✎ Markup. */
    position?: string;
    /** Tooltip line per person, from their presence state (e.g. "editing ch218.0"). */
    describe?: (p: Presence) => string | undefined;
}
declare class PresenceBar {
    private store;
    private opts;
    readonly el: HTMLDivElement;
    private dot;
    private people;
    private btn;
    private unsubs;
    constructor(store: SharedStore<unknown>, host: HTMLElement, opts?: PresenceBarOptions);
    destroy(): void;
    render(): void;
}

/**
 * Markup — draw on the viewport to tell an AI (or a colleague) what to change.
 *
 * The point is not the drawing, it is what the drawing is resolved to. A circle
 * in a screenshot makes the reader guess which object, where in space, and which
 * line of code. Here every mark is resolved at the moment it is drawn:
 *
 *   - the strokes are kept as vectors (screen space), simplified for the file;
 *   - each mark is raycast into the scene: which objects it touches or encloses
 *     (with their layer, label and the source line that created them), and the
 *     world points it lands on;
 *   - the same marks are burnt into a PNG with big numbers, for a vision model.
 *
 * A capture is a bundle — `view.png` (marks), `clean.png` (no marks) and
 * `markup.json` (camera, params, marks, scene summary). It is POSTed to the dev
 * server (tools/markup-vite-plugin.mjs writes it to `.tekto/markup/`); without
 * the plugin the three files are downloaded instead.
 *
 * `window.__tekto.snapshot()` produces the same bundle without any marks, so an
 * agent driving a headless browser (tools/snap.mjs) sees what a person sees.
 */

interface MarkupObjectRef {
    id: string;
    type: string;
    layer?: string;
    label?: string;
    tag?: string;
    color?: string;
    /** Where the object was created, e.g. "pages/primitives.ts:12" (resolved by the dev server). */
    src?: string;
    /** The document record it shows, e.g. "blocks/k3f9x2" (`bindScene` / `scene.withKey`). */
    key?: string;
}
type MarkKind = "point" | "loop" | "line" | "cross" | "stroke";
interface MarkupCaptureOptions {
    /** Overall instruction, written to markup.json and the PNG legend. */
    note?: string;
    /** POST to the dev server (default true); false only returns the bundle. */
    save?: boolean;
    /** Short word for the folder name, e.g. "snap". */
    label?: string;
}
interface MarkupBundle {
    markup: Record<string, unknown>;
    viewPng: string;
    cleanPng: string;
    /** Folder the dev server wrote to, if it did. */
    dir?: string;
}

export { type AppShellConfig, type AppShellInstance, type Appearance, BspTree, type CalloutItem, Callouts, type ContentOptions, type ControlItem, ControlPanel, type ControlPanelConfig, type CustomRow, DEFAULT_BACKGROUND, type DxfEdgeOptions, DxfExporter, DxfLayerDef, type DxfMeshOptions, type DxfSegment, type DxfView, type DxfWorkerRequest, type DxfWriteOptions, ExportRegistration, type ExtraTab, type IdBufferOptions, ImportRegistration, Lab, type LayoutOptions, LightingMode, type MarkKind, type MarkupBundle, type MarkupCaptureOptions, type MarkupObjectRef, Mesh, NavGizmo, type NavGizmoOptions, type PanelButton, ParamSchema, ParamStore, type PickInfo, type Placement, Presence, PresenceBar, type PresenceBarOptions, type ProjectedSegment, type Projection, Reactive, RenderMode, type SVGOptions, SVGRenderer, type SVGRendererConfig, Scene, type SectionRequest, SharedStore, SketchConfig, SketchInstance, type StandardView, type Theme, ThreeRenderer, type ThreeRendererConfig, Vec3, type ViewMode, Viewport, type ViewportOptions, type VisibilityOptions, type VisibilityResult, type VisibilityView, appShell, easeInOut, edgeStyle, extractVisiblePolylines, fitRadius, getTheme, groundAppearance, hiddenLineIdBuffer, labelWidthFor, layoutLabels, lightBalance, modeBackground, nearestAxis, orbitFor, orthoFrustum, polylinesToSVG, processWorkerRequest, sectionAppearance, shortestTurn, sketch, standardOrbit, surfaceAppearance };
