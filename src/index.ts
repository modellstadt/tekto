// ═══════════════════════════════════════════════
// Tekto — Computational Geometry Toolkit
// ═══════════════════════════════════════════════

// Core Math
export { Vec2, Vec3, Vec4, Mat4 } from "./core/math/vectors";
export { HMath, MathUtils } from "./core/math/HMath";
export { VecMath } from "./core/math/VecMath";
export { noise } from "./core/math/noise";
export { createRandom } from "./core/math/random";
export type { SeededRandom } from "./core/math/random";

// Geometry Primitives (new canonical locations)
export { Ray } from "./core/geometry/Ray";
export { HPlane, HPlane as Plane } from "./core/geometry/HPlane";
export { Triangle } from "./core/geometry/Triangle";
export { AABB } from "./core/geometry/AABB";
export { Sphere } from "./core/geometry/Sphere";
export { Segment, closestPointOnSegment, segmentSegmentClosest } from "./core/geometry/Segment";
export { OBB2D } from "./core/geometry/OBB2D";
export { Intersections } from "./core/geometry/Intersections";
export type { Intersect2DResult } from "./core/geometry/Intersections";

// Geometry Algorithms
export { Polygon2D, polygonIntersection } from "./core/geometry/Polygon2D";
export type { FilletResult } from "./core/geometry/Polygon2D";
export { MeshAnalysis } from "./core/geometry/mesh/MeshAnalysis";

// Mesh (new canonical names + backward-compat aliases)
export { ConnectedMesh, ConnectedMesh as Mesh } from "./core/geometry/mesh/ConnectedMesh";
export type { MeshNode, MeshEdge, MeshFace, MeshJSON } from "./core/geometry/mesh/ConnectedMesh";
export { MeshFactory, MeshFactory as MeshGen } from "./core/geometry/mesh/MeshFactory";
export { Mesh as RenderMesh, Mesh as FlatMesh } from "./core/geometry/mesh/Mesh";
export type { MeshData as FlatMeshData, MeshJSON as FlatMeshJSON } from "./core/geometry/mesh/Mesh";
export { FlatMeshGen } from "./core/mesh/FlatMesh";
export { MeshTransform } from "./core/geometry/mesh/MeshTransform";
export type { Axis } from "./core/geometry/mesh/MeshTransform";
export { MeshSubdivide } from "./core/geometry/mesh/MeshSubdivide";
export { MeshCleanup } from "./core/geometry/mesh/MeshCleanup";

// Algorithms (backward-compat)
export { Algo } from "./core/algo/algorithms";

// Mesh curvature (Taubin discrete principal directions) + streamline
// tracer over a face-based vector field.
export { Curvature } from "./core/algo/Curvature";
export type { VertexCurvature } from "./core/algo/Curvature";
export { StreamlineTracer } from "./core/algo/StreamlineTracer";
export type { StreamlineOptions } from "./core/algo/StreamlineTracer";

// BSP Tree
export { BspTree, polygonFromVertices } from "./core/algo/BspTree";
export type { BspPolygon, BspNode, PointClassification } from "./core/algo/BspTree";

// Curves
export { LineCurve, ArcCurve, HelixCurve, CubicBezierCurve, NurbsCurve, PolylineCurve, CurveUtils } from "./core/geometry/curves";
export type { ICurve, IMetricCurve } from "./core/geometry/curves";

// Surfaces (NURBS tensor-product)
export { NurbsSurface, clampedUniformKnots } from "./core/geometry/surfaces";

// Solar
export { SunPosition } from "./core/solar/SunPosition";
export type { SunPositionInput, SunPositionResult } from "./core/solar/SunPosition";

// Graph
export { Graph, GridGraph } from "./core/graph";

// Planar Graph (DCEL)
export { PlanarGraph, PGVertex, PGHalfEdge, PGFace, PlanarGraphRepair, PlanarGraphCleanup, Delaunay2D } from "./core/geometry/planarGraph";

// Voxel
export { VoxelGrid2D, VoxelGrid, MarchingSquares, MarchingCubes, FloodFill, DistanceTransform, BlobDetect, PixelView } from "./core/voxel";

// SDF
export {
  SdfSphere, SdfBox, SdfCapsule, SdfCylinder, SdfCone, SdfTorus,
  SdfEllipsoid, SdfPlane as SdfPlaneField, SdfLine as SdfLineField,
  SdfUnion, SdfIntersect, SdfSubtract,
  SdfBlend, SdfSmoothSubtract, SdfSmoothUnion,
  SdfShell, SdfOnion, SdfTwist, SdfRevolution, SdfExtrude, SdfBoundedExtrude,
  SdfMirror, SdfRadialArray, SdfTransform, SdfOffset, SdfGradient, SdfVoronoi,
  SdfLattice, SdfMicrostructure,
  SdfUtils, SdfOps,
} from "./core/sdf";
export type { ISdf, LatticeType, MicroPatternType } from "./core/sdf";

// Geometry (2D)
export { Capsule2D } from "./core/geometry/Capsule2D";

// Physics
export { SpringSystem3D } from "./core/physics";
export type { Spring } from "./core/physics";
export { RigidBody2D, Spring2D, repelBodies } from "./core/physics/RigidBody2D";
export type { RigidBodyConfig, SpringConfig } from "./core/physics/RigidBody2D";

// IO
export { ObjFile } from "./io";
export type { MeshData as ObjMeshData } from "./io";
export { DxfExporter, processWorkerRequest } from "./io/DxfExporter";
export type { DxfView, DxfLayerDef, DxfMeshOptions, DxfEdgeOptions, DxfWriteOptions, DxfSegment, DxfWorkerRequest } from "./io/DxfExporter";
export { hiddenLineIdBuffer } from "./io/IdBufferHiddenLine";
export { extractVisiblePolylines, polylinesToSVG } from "./io/PolylineVisibility";
export type {
  VisibilityView, VisibilityOptions, ProjectedSegment, VisibilityResult, SVGOptions,
} from "./io/PolylineVisibility";
export type { IdBufferOptions } from "./io/IdBufferHiddenLine";
export { IfcFile } from "./io/IfcFile";
export type { IfcParseOptions } from "./io/IfcFile";
export { IfcWriter } from "./io/IfcWriter";
export type { IfcWriterOptions, AddWallSystemOptions } from "./io/IfcWriter";

// Ribbons + Walls + Slabs (BIM-grade timber framing).
export { ExtrudedRibbon, RibbonFrame, RibbonOpening, RibbonEndTrim, MITER_LIMIT } from "./core/geometry/ExtrudedRibbon";
export type { ExtrudedRibbonOptions, MeshBuffers } from "./core/geometry/ExtrudedRibbon";
export { RibbonSystem } from "./core/geometry/RibbonSystem";
export { RibbonJoint } from "./core/geometry/RibbonJoint";
export type { JointStyle, JointKind, JointParticipant, JointTrim } from "./core/geometry/RibbonJoint";
export { Wall, WallOpening, WallSystem } from "./core/geometry/walls";
export type { WallOptions } from "./core/geometry/walls";

export {
  WallType, realize, buildCutList,
  SolidConstruction, BalloonFrame,
  HolzrahmenBau, holzrahmenbauLayers, HolzrahmenBauJointStyle,
  CltConstruction, cltLayers,
  WallJoint,
} from "./bim/walls";
export type {
  WallConstruction, WallPart, WallPartRole,
  MaterialLayer, LayerPosition,
  PartProfile, CutListItem, PropertyMap, RealizedWall,
  BalloonFrameOptions, HolzrahmenBauOptions, CltOptions,
  ConnectionType, WallJointOptions,
} from "./bim/walls";

export {
  Slab, SlabType, SlabOpening, realizeSlab,
  chooseJoistDirection,
  joistDirectionFromBounds, joistDirectionFromPCA, joistDirectionFromSupports,
  lineClipPolygon,
  SolidSlabConstruction, JoistedSlab,
} from "./bim/slabs";
export type {
  SlabConstruction, SlabPart, SlabPartRole,
  SlabOptions, SlabTypeOptions, SlabContext, RealizedSlab,
  JoistOrientationOptions, JoistedSlabOptions,
} from "./bim/slabs";

// Openings (door / window types), Spaces (rooms), Stairs.
export { OpeningType } from "./bim/openings";
export type { OpeningTypeOptions, DoorOperation, WindowPartitioning } from "./bim/openings";
export { Space, boundingWalls } from "./bim/spaces";
export type { SpaceOptions } from "./bim/spaces";
export { Stair, StairType } from "./bim/stairs";
export type { StairOptions, StairTypeOptions, StairFlight, StairShape } from "./bim/stairs";

// Scene
export { Scene } from "./scene/Scene";
export type {
  SceneObject, SceneObjectType, VisualStyle, RenderMode, LightingMode,
  FlatMeshData as ColoredMeshData,
  SceneEvent, SceneEventListener, SceneJSON,
} from "./scene/Scene";

// Params
export { ParamStore, createParams, createLayout } from "./gui/Params";
export type {
  ParamDef, ParamSchema, FloatParam, IntParam, BoolParam,
  SelectParam, ColorParam, StringParam, Vec3Param, ButtonParam,
  ParamFolder, ParamLayout,
} from "./gui/Params";

// Renderers
export { ThreeRenderer } from "./render/ThreeRenderer";
export type { ThreeRendererConfig } from "./render/ThreeRenderer";
export { SVGRenderer } from "./render/SVGRenderer";
export type { SVGRendererConfig } from "./render/SVGRenderer";

// GUI: layer panel (consumed by both the sketch API + standalone apps).
export { LayerPanel, computeEffectiveVisibility } from "./gui/LayerPanel";
export type { LayerNode, LayerState, LayerMap } from "./gui/LayerPanel";

// Sketch API (Level 1 — primary student-facing API)
export { sketch, SketchInstance } from "./sketch/Sketch";
export type {
  Lab, SketchConfig, Reactive,
  MeshHandle, PointHandle, LineHandle,
  SliderOpts, SelectOpts, ShapeMode,
  ExportRegistration, ImportRegistration,
} from "./sketch/Sketch";

// Sketch2D API (Level 1 — 2D canvas variant, no Three.js)
export { sketch2d, Sketch2DInstance } from "./sketch/Sketch2D";
export type {
  Lab2D, Sketch2DConfig, Sketch2DFn, DrawFn, AnimateFn, Pointer2D, PointerFn,
} from "./sketch/Sketch2D";

// React (Level 3 — advanced)
export {
  TektoApp, useScene, useSceneObjects, useSelection, useParams,
  ParamPanel, InspectorPanel, Toolbar,
} from "./react/components";
export type { ToolbarAction } from "./react/components";
