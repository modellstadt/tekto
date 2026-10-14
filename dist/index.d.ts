import { V as Vec3, M as Mesh, R as RenderMode, S as Scene, b as SectionRequest, L as LightingMode } from './Scene-BHniJuab.js';
export { A as AABB, F as ColoredMeshData, c as FlatMeshData, d as LegacyMeshJSON, e as LightSpec, f as Mat4, g as MeshEdge, h as MeshFace, i as MeshJSON, j as MeshNode, k as MeshValidation, O as ObjFile, l as ObjMeshData, P as Projection, m as SceneEvent, n as SceneEventListener, o as SceneJSON, a as SceneObject, p as SceneObjectType, q as StandardView, T as Triangle, r as Vec2, s as Vec4, t as VisualStyle } from './Scene-BHniJuab.js';
import { D as DxfLayerDef } from './download-YOiO7Lln.js';
export { A as Algo, a as DASH_PATTERNS, b as Dash, c as DimOptions, d as DrawOptions, e as Dxf2DArc, f as Dxf2DCircle, g as Dxf2DContent, h as Dxf2DLine, i as Dxf2DLook, j as Dxf2DPoint, k as Dxf2DPolyline, l as Dxf2DSolid, m as Dxf2DText, n as Dxf3DArc, o as Dxf3DCircle, p as Dxf3DContent, q as Dxf3DLine, r as Dxf3DPoint, s as Dxf3DPolyline, F as FilletResult, H as HMath, L as LevelOptions, t as LineStyle, M as MathUtils, u as MeshFactory, v as MultiPoly2, O as OBB2D, P as Poly2, w as Polygon2D, x as PolygonBool, y as Pt, R as ResolvedStyle, z as Ring2, S as SeededRandom, B as Segment, C as Sheet, E as SheetOptions, G as SheetPrim, I as SheetView, T as TextOptions, V as ViewOptions, J as aciFromHex, K as closestPointOnSegment, N as createRandom, Q as download, U as noise, W as pickPrim, X as polygonIntersection, Y as segmentSegmentClosest, Z as setClipSnap, _ as stampName, $ as writeDxf2D, a0 as writeDxf3D } from './download-YOiO7Lln.js';
import { BspTree } from './core.js';
export { AddWallSystemOptions, Adjacency, AdjacencyOptions, ArcCurve, Axis, BalloonFrame, BalloonFrameOptions, BlobDetect, Box, BspNode, BspPolygon, Capsule2D, CltConstruction, CltOptions, ConnectionType, Contact, CubicBezierCurve, Curvature, CurveUtils, CutListItem, Delaunay2D, DistanceTransform, DoorOperation, ExtrudedRibbon, ExtrudedRibbonOptions, FloodFill, Graph, GridGraph, HelixCurve, HolzrahmenBau, HolzrahmenBauJointStyle, HolzrahmenBauOptions, ICurve, IMetricCurve, ISdf, IfcElementData, IfcFile, IfcModel, IfcModelData, IfcParseElementsOptions, IfcParseOptions, IfcRelations, IfcSpatialNode, IfcWriter, IfcWriterOptions, Intersect2DResult, Intersections, JointKind, JointParticipant, JointStyle, JointTrim, JoistOrientationOptions, JoistedSlab, JoistedSlabOptions, LatticeType, LayerPosition, LineCurve, MITER_LIMIT, MarchingCubes, MarchingSquares, MaterialLayer, MeshAnalysis, MeshBuffers, MeshCleanup, MeshSubdivide, MeshTransform, MicroPatternType, NoFitPolygon, NurbsCurve, NurbsSurface, OpeningType, OpeningTypeOptions, PGFace, PGHalfEdge, PGVertex, PartProfile, PerpSegment, PixelView, PlanarGraph, PlanarGraphCleanup, PlanarGraphRepair, Plane, PointClassification, PolylineCurve, PropertyMap, Ray, RealizedSlab, RealizedWall, RibbonEndTrim, RibbonFrame, RibbonJoint, RibbonOpening, RibbonSystem, RigidBody2D, RigidBodyConfig, SdfBlend, SdfBoundedExtrude, SdfBox, SdfCapsule, SdfCone, SdfCylinder, SdfEllipsoid, SdfExtrude, SdfGradient, SdfIntersect, SdfLattice, SdfLineField, SdfMicrostructure, SdfMirror, SdfOffset, SdfOnion, SdfOps, SdfPlaneField, SdfRadialArray, SdfRevolution, SdfShell, SdfSmoothSubtract, SdfSmoothUnion, SdfSphere, SdfSubtract, SdfTorus, SdfTransform, SdfTwist, SdfUnion, SdfUtils, SdfVoronoi, Slab, SlabConstruction, SlabContext, SlabOpening, SlabOptions, SlabPart, SlabPartRole, SlabType, SlabTypeOptions, SolidConstruction, SolidSlabConstruction, Space, SpaceOptions, Sphere, Spring, Spring2D, SpringConfig, SpringSystem3D, Stair, StairFlight, StairOptions, StairShape, StairType, StairTypeOptions, StreamlineOptions, StreamlineTracer, SunPosition, SunPositionInput, SunPositionResult, UpAxis, VecMath, VertexCurvature, VoxelGrid, VoxelGrid2D, Wall, WallConstruction, WallJoint, WallJointOptions, WallOpening, WallOptions, WallPart, WallPartRole, WallSystem, WallType, WindowPartitioning, boundingWalls, boxOf, buildCutList, chooseJoistDirection, clampedUniformKnots, cltLayers, contactBetween, edgeOutwardVisibility, findAdjacent, holzrahmenbauLayers, joistDirectionFromBounds, joistDirectionFromPCA, joistDirectionFromSupports, lineClipPolygon, neighboursOf, perpVisibility, perpVisibilityOfPolys, polygonFromVertices, realize, realizeSlab, repelBodies, reverseContact } from './core.js';
import { P as ParamStore, b as ParamSchema, D as Doc, S as SharedStore, d as Presence } from './Doc-CaIknIs8.js';
export { B as BoolParam, e as ButtonParam, C as CollabAdapter, f as CollabEvents, g as CollabStatus, h as CollabUser, i as ColorParam, j as DocChange, k as DocChangeSource, l as DocEditOptions, m as DocJSON, n as DocOptions, o as DocSchema, F as FloatParam, I as IntParam, p as ParamDef, q as ParamFolder, a as ParamLayout, r as PickingView, s as PresenceView, t as SceneBinding, u as SelectParam, v as Selection, w as SharedRecord, x as SharedStoreOptions, y as StringParam, z as SupabaseLike, V as Vec3Param, A as bindScene, E as collabColor, G as createLayout, H as createParams, J as devServerAdapter, K as localAdapter, L as memoryAdapter, M as selectOnClick, N as shareSelection, O as supabaseAdapter } from './Doc-CaIknIs8.js';
import { b as Theme, c as ThreeRendererConfig, a as TopBarOptions, T as ThreeRenderer, N as NotesLayer } from './Markup-MQFyllX1.js';
export { A as AmbientOcclusionOptions, d as Appearance, C as CalloutItem, e as Callouts, D as DEFAULT_BACKGROUND, L as LayoutOptions, f as MarkKind, g as MarkupBundle, h as MarkupCaptureOptions, i as MarkupObjectRef, M as MarkupRenderer, j as Note, k as NotesRenderer, P as PickInfo, l as Placement, S as ShadingBarCorner, m as SunPreset, V as ViewMode, n as easeInOut, o as edgeStyle, p as fitRadius, q as getTheme, r as groundAppearance, s as labelWidthFor, t as layoutLabels, u as lightBalance, v as markup, w as modeBackground, x as nearestAxis, y as notesLayer, z as orbitFor, B as orthoFrustum, E as sectionAppearance, F as sectionPlane, G as shortestTurn, H as standardOrbit, I as surfaceAppearance, J as viewerToolbar } from './Markup-MQFyllX1.js';
import { C as Commands, E as ExportRegistration, I as ImportRegistration, L as Lab, S as SketchConfig, R as Reactive } from './2d-Cbmk9v3B.js';
export { A as AnimateFn, a as Command, b as CommandInfo, D as DrawFn, c as DrawSheetOptions, d as Lab2D, e as LayerMap, f as LayerNode, g as LayerPanel, h as LayerState, i as LineHandle, M as MeshHandle, P as PointHandle, j as Pointer2D, k as PointerFn, l as SelectOpts, m as ShapeHandle, n as ShapeMode, o as SheetCanvas, p as SheetCanvasOptions, q as SheetTransform, r as Sketch2DConfig, s as Sketch2DFn, t as Sketch2DInstance, u as SliderOpts, V as ViewControl, v as computeEffectiveVisibility, w as drawSheet, x as fitSheet, y as formatKeys, z as keyMatches, B as sketch2d, F as viewCommands } from './2d-Cbmk9v3B.js';
import * as THREE from 'three';
import 'three/examples/jsm/controls/OrbitControls.js';

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

/** Options for the WebGL id-buffer hidden-line pass (`hiddenLineIdBuffer`, `DxfExporter.toSegmentsGpu`): buffer resolution (default 2048 px square), debug layers, U flip, layers kept by name, and a layer for occluded runs. */
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

/** The orthographic view a `DxfExporter` projects onto: the direction it looks along and the drawing's up direction (default +Z). */
interface DxfView {
    /** Direction the camera looks toward (into the scene). Will be normalized. */
    viewDir: Vec3;
    /** Up direction for the 2D output. Default: Vec3(0, 0, 1). */
    upDir?: Vec3;
}
/** Options for `DxfExporter.addMesh`: layer, the dihedral angle in degrees above which an edge is drawn (default 30), open edges, and whether smooth edges go to a soft layer or become view-dependent silhouettes. `addBspTree` reads only `layer`, `featureAngle` and `boundary`. */
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
/** Options for `DxfExporter.addEdge` / `addPolyline`: the DXF layer (default "0"). */
interface DxfEdgeOptions {
    layer?: string;
}
/** Options for `DxfExporter.toDxf` and its siblings: coordinate scale (default 1000, metres → millimetres), decimals, and hidden-line removal or classified debug layers. */
interface DxfWriteOptions {
    /** Scale multiplier applied to all coordinates. Default 1000 (meters→mm). */
    scale?: number;
    /** Decimal places in output. Default 3, or 6 when `scale` is below 100 (metres stay precise). */
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
    /** Ignored: the hidden-line pass works out its own tolerance. Kept so existing calls compile. */
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
/** One projected 2D line in view coordinates (u right, v up, unscaled model units) with its layer: what `toSegments` / `toSegmentsGpu` return and `toDxfFromSegments` writes. */
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
/** A plain-data hidden-line job from `DxfExporter.toWorkerRequest` (flattened triangles, view-resolved edges, layers, view, scale): post it to a Web Worker that calls `processWorkerRequest`. */
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

/** The orthographic view for `extractVisiblePolylines`: the view direction and the up direction (default +Y, where `DxfView` defaults to +Z). */
interface VisibilityView {
    /** View direction (camera-to-target). The unit vector is fine. */
    viewDir: Vec3;
    /** World-up reference (defaults to +Y). */
    upDir?: Vec3;
}
/** Options for `extractVisiblePolylines`: depth-buffer resolution (default 1024 px square) and the depth tolerance as a fraction of the view-depth range (default 0.005). */
interface VisibilityOptions {
    /** Offscreen target resolution. Higher = sharper silhouettes. Default 1024. */
    resolution?: number;
    /** Depth tolerance, in fraction of the scene's view-depth range. Default 0.005.
     *  Increase if you see streamlines breaking up where they sit just above the
     *  mesh; decrease if back-side lines bleed through silhouettes. */
    bias?: number;
}
/** One visible run of a polyline: its points in 2D view space (u, v, in model units) and the same points in 3D. */
interface ProjectedSegment {
    /** 2D points (u, v) in view space — ready for SVG / DXF. */
    points2D: {
        u: number;
        v: number;
    }[];
    /** Original 3D points (for in-scene preview rendering). */
    points3D: Vec3[];
}
/** What `extractVisiblePolylines` returns: the visible runs and the (u, v) bounds of the mesh's projection, which `polylinesToSVG` uses for its viewBox. */
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
/**
 * Hidden-line removal for any 3D polylines (streamlines, hatching, sketched
 * curves) against a mesh: renders the mesh's depth offscreen with WebGL
 * (three.js) and keeps the runs of points in front of it. Visibility is
 * tested per point, so a segment is never split between its points; a
 * point outside the mesh's outline counts as visible.
 */
declare function extractVisiblePolylines(mesh: Mesh, polylines: Vec3[][], view: VisibilityView, options?: VisibilityOptions): VisibilityResult;
/** Options for `polylinesToSVG`: stroke width in SVG user units, which are model units (default 0.2 % of the drawing's larger side), stroke colour (default "#000") and viewBox padding as a fraction of its size (default 0.02). */
interface SVGOptions {
    /** Stroke width in SVG user units (= model units). Default: 0.2 % of the drawing's larger side. */
    strokeWidth?: number;
    /** Stroke color (any CSS color). Default "#000". */
    stroke?: string;
    /** Pad the viewBox by this fraction of scene size. Default 0.02. */
    padFraction?: number;
}
/** Projected runs (from `extractVisiblePolylines`) as SVG text: one `<polyline>` per run, v flipped so up is up on paper, viewBox = `bounds` plus padding, in model units. */
declare function polylinesToSVG(segments: ProjectedSegment[], bounds: {
    minU: number;
    maxU: number;
    minV: number;
    maxV: number;
}, options?: SVGOptions): string;

/**
 * Icons for the render modes: one cube drawn the way each mode draws, as Rhino and Blender
 * show viewport shading. The icon is a small picture of what the mode does, not a metaphor
 * for it.
 *
 * - solid: its three faces in three tones, lit from above left
 * - ghost: see-through, the three hidden edges showing faintly
 * - hiddenline: only the edges a viewer can see
 * - wireframe: every edge, the hidden ones as strong as the rest
 *
 * The cube is a general axonometry rather than an isometric on purpose. In a true isometric
 * the hidden back corner projects onto the front one, so the edges that tell ghost from
 * hidden line would fall on lines already drawn and the two icons would be the same picture.
 *
 * Drawn on a 24 unit grid in `currentColor`, the convention of lucide and most icon sets,
 * so they size and colour like the icons beside them. The shapes are plain data
 * (`viewModeIconShapes`); `viewModeIconSvg` renders them as a string for DOM apps and
 * `tekto/react`'s `ViewModeIcon` as JSX.
 */

/** One shape of a view-mode icon: a polygon (filled at `fill` opacity, outlined if `stroke`) or a line (at `opacity`). */
type IconShape = {
    kind: "polygon";
    points: string;
    fill?: number;
    stroke?: boolean;
} | {
    kind: "line";
    from: [number, number];
    to: [number, number];
    opacity?: number;
};
type P = [number, number];
/** The front corner and the hidden back one: distinct, which is the point. */
declare const VIEW_MODE_ICON_CORNERS: {
    readonly front: P;
    readonly back: P;
};
/** What to draw for a render mode, back to front. */
declare function viewModeIconShapes(mode: RenderMode): IconShape[];
/** The SVG root's attributes, shared by the string and the React form. */
declare const VIEW_MODE_ICON_SVG: {
    readonly xmlns: "http://www.w3.org/2000/svg";
    readonly viewBox: "0 0 24 24";
    readonly fill: "none";
    readonly stroke: "currentColor";
    readonly strokeWidth: 1.5;
    readonly strokeLinejoin: "round";
    readonly strokeLinecap: "round";
};
/**
 * A render mode's icon as SVG markup, for a DOM app: `button.innerHTML =
 * viewModeIconSvg("ghost")`. `size` in pixels, 16 by default.
 */
declare function viewModeIconSvg(mode: RenderMode, size?: number): string;

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
/** Options for `new ControlPanel(...)`: the `ParamStore` it shows, theme, buttons, and the commit/action/tab hooks of its owner. */
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
/**
 * The panel every tekto GUI uses (`sketch`, `sketch2d`, `appShell`): sliders, toggles, selects, colours, text, buttons, menus, tabs and accordion groups for the values in a `ParamStore`.
 * Call `render(items, …)` when the set of controls changes; value changes update the live controls in place (so a slider keeps focus mid-drag).
 */
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
 * Tekto SVG Renderer
 *
 * Renders Scene objects as SVG for clean 2D visualization.
 * Supports labels, annotations, and CSS styling.
 * Uses XZ plane projection by default.
 */

/** Pixel size, viewBox (model units), grid, labels and projection plane of an `SVGRenderer`; pass any subset, the rest has defaults. */
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
/**
 * Draws a `Scene`'s points, segments, polylines, polygons, circles and meshes as SVG, projected onto one plane (`xz` by default), and redraws on every scene change.
 * `setViewBox` pans/zooms; `dispose()` unsubscribes and removes the SVG.
 *
 * @experimental No app uses this yet; it may still change.
 */
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
 * The axis widget in the corner of a viewport.
 *
 * It exists because a renderer that knows how to be a plan or an elevation is
 * no use if no reader can ask it to: `setView` and `setProjection` were public,
 * tested, and unreachable from every application built on them. A capability
 * with no affordance is a capability nobody has. ThreeRenderer shows it with
 * `navGizmo: true`.
 *
 * Drawn as SVG rather than a second WebGL scene. It stays crisp at any device
 * pixel ratio, it costs no context (a browser allows only a handful, and this
 * library already fights for them), and hit testing is what the DOM does for a
 * living: each ball is an element, so a click is a click rather than a
 * raycast.
 *
 * What it shows is the *content's* axes, not the world's: `update` takes the
 * turn between the two, so a renderer that rotated a Z-up model into a Y-up
 * scene would still not tell an engineer their Z was horizontal. ThreeRenderer
 * keeps the content's axes (it turns the camera's up), so its turn is none.
 */

/** Size, corner and projection toggle of a `NavGizmo`, and the callbacks through which it drives the viewport. */
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
/**
 * The axis widget in a viewport corner, drawn as SVG: click an axis ball to look down it, drag to orbit, double-click to snap to the nearest axis, toggle perspective/ortho.
 * It only reports intent through its callbacks; the owner calls `update(camera, contentRotation)` after each draw. `ThreeRenderer` shows one with `navGizmo: true`.
 */
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
/**
 * What `sketch()` returns: the running 3D sketch, driven from outside by its host (the testbench shell) — render mode, lighting, sun, section, the registered exports and imports.
 * `getParams` / `setParams` save and restore its controls; `dispose()` tears it down.
 */
declare class SketchInstance {
    private fn;
    private config;
    private container;
    /** What the sketch can do, with its keys — the view commands, and what `lab.command`
     *  declares in the current run. Agents list and run them through `window.__tekto`. */
    readonly commands: Commands;
    private viewportWrap;
    private overlays;
    private overlayByName;
    private _runCommands;
    private _unbindCommandKeys;
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
    /** Change the scene render mode (solid / wireframe / hiddenline / ghost). */
    setRenderMode(mode: RenderMode): void;
    /**
     * A layer over the 3D view, kept across re-runs — mount a 2D view there (a `SheetCanvas`
     * showing the drawing of what the sketch builds). The same `name` gives the same layer;
     * hide it (`style.display = "none"`) to show the 3D view again. Its canvases marked
     * `data-tekto-overlay` are in snapshots and ✎ Markup.
     */
    overlay(name?: string): HTMLElement;
    /** Cut the model with a section (see `ThreeRenderer.setSection`); null clears. */
    setSection(section: SectionRequest | null): void;
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
    /** Rebuild the header's Export / Import menus when the registered names change. */
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

/** Options for `appShell()`: the container, the param schema and its groups, the initial camera, up axis (default Z), theme, panel width, and which top bar, Markup and axis-widget controls to show. */
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
    /** Top bar with Lighting / Render-mode / Camera / Cut / Sun controls. Default: true.
     *  An object turns single controls off where they don't make sense for the app
     *  (`{ cut: false, sun: false }`). */
    topBar?: boolean | TopBarOptions;
    /** Show the ✎ Markup button (draw instructions on the view; marks name document records). Default `true`. */
    markup?: boolean;
    /** Notes that live with the model: the doc whose `notes` collection keeps them (or
     *  `{ doc, collection, author }`). Markup then offers "Keep as notes", and the notes are
     *  drawn over the view with a pin each (`app.notes`). */
    notes?: Doc<any> | {
        doc: Doc<any>;
        collection?: string;
        author?: string;
    };
    /** The axis widget in a viewport corner (`true` = bottom right): click an axis for a plan
     *  or an elevation, toggle persp/ortho under it. Default `false` — an app may have its own
     *  panels in that corner. */
    navGizmo?: boolean | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** The shading bar in a viewport corner (`true` = top left): icons for the render style, the
     *  lighting and the sun (morning, noon, sunset). Default `false`. */
    shadingBar?: boolean | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** The scene's unit (`"m"`, `"mm"`…): readouts show coordinates in it. Unset: relative to
     *  the content's extent. */
    units?: string;
}
/** What `appShell()` returns: its params, scene, renderer, panel and commands, the build/display/animate hooks, the status line and overlays, and `dispose`. */
interface AppShellInstance<S extends ParamSchema = ParamSchema> {
    params: ParamStore<S>;
    scene: Scene;
    renderer: ThreeRenderer;
    /** The sidebar renderer — call panel.render(...) to change the control structure at runtime. */
    panel: ControlPanel;
    /** What the app can do, with its keys: `app.commands.add({ id: "edit.undo", label: "Undo",
     *  keys: "Mod+Z", run: () => doc.undo() })`. Keys work while the app is mounted (not while
     *  typing in a field); agents list and run them through `window.__tekto`. The view commands
     *  (`view.top`, `view.fitAll`, …) are there from the start, without keys. */
    commands: Commands;
    /** The notes layer when `notes` was given: show, hide, go to, keep. */
    notes: NotesLayer | null;
    /**
     * Register an animation callback, called every frame with dt in seconds. While one is set
     * the view draws every frame; without one it draws only when something changed (the
     * scene, the camera, a param), so an idle app costs nothing. Changed three.js objects
     * yourself outside it? Call `app.renderer.requestRender()`.
     */
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

/** Options for `PresenceBar`: where it sits and what each person's tooltip says. */
interface PresenceBarOptions {
    /** CSS for the bar's position inside the host; default: top right, left of ✎ Markup. */
    position?: string;
    /** Tooltip line per person, from their presence state (e.g. "editing ch218.0"). */
    describe?: (p: Presence) => string | undefined;
}
/**
 * Who is online in a `SharedStore` document: a connection dot, one badge per person, and a Sign in / Sign out button.
 * `new PresenceBar(store, host)` mounts it in `host` and re-renders on presence, status and user changes; `destroy()` removes it.
 */
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

export { type AppShellConfig, type AppShellInstance, BspTree, Commands, type ControlItem, ControlPanel, type ControlPanelConfig, type CustomRow, Doc, type DxfEdgeOptions, DxfExporter, DxfLayerDef, type DxfMeshOptions, type DxfSegment, type DxfView, type DxfWorkerRequest, type DxfWriteOptions, ExportRegistration, type ExtraTab, type IconShape, type IdBufferOptions, ImportRegistration, Lab, LightingMode, Mesh, NavGizmo, type NavGizmoOptions, NotesLayer, type PanelButton, ParamSchema, ParamStore, Presence, PresenceBar, type PresenceBarOptions, type ProjectedSegment, Reactive, RenderMode, type SVGOptions, SVGRenderer, type SVGRendererConfig, Scene, SectionRequest, SharedStore, SketchConfig, SketchInstance, Theme, ThreeRenderer, ThreeRendererConfig, TopBarOptions, VIEW_MODE_ICON_CORNERS, VIEW_MODE_ICON_SVG, Vec3, type VisibilityOptions, type VisibilityResult, type VisibilityView, appShell, extractVisiblePolylines, hiddenLineIdBuffer, polylinesToSVG, processWorkerRequest, sketch, viewModeIconShapes, viewModeIconSvg };
