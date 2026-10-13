// ═══════════════════════════════════════════════
// tekto/core — the geometry and data layer
// ═══════════════════════════════════════════════
//
// Everything here runs without three.js and without a DOM: in the browser, in
// Node scripts, in workers and in tests. `import { … } from "tekto/core"`.
// The main "tekto" entry re-exports all of it, plus the browser layer
// (renderers, panels, sketch(), appShell()). Add a three-free export HERE;
// CI (tools/check-entries.mjs) fails if this entry ever reaches three or react.

// Core Math
export { Vec2, Vec3, Vec4, Mat4 } from "./core/math/vectors";
export { HMath, MathUtils } from "./core/math/HMath";
export { VecMath } from "./core/math/VecMath";
export { noise } from "./core/math/noise";
export { createRandom } from "./core/math/random";
export type { SeededRandom } from "./core/math/random";

// Geometry Primitives (new canonical locations)
export { Ray } from "./core/geometry/Ray";
export { Plane } from "./core/geometry/Plane";
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
export { PolygonBool, setClipSnap } from "./core/geometry/PolygonBool";
export type { Ring2, Poly2, MultiPoly2 } from "./core/geometry/PolygonBool";
export { NoFitPolygon } from "./core/geometry/NoFitPolygon";
export { perpVisibility, perpVisibilityOfPolys, edgeOutwardVisibility } from "./core/geometry/PerpVisibility";
export type { PerpSegment } from "./core/geometry/PerpVisibility";
export { MeshAnalysis } from "./core/geometry/mesh/MeshAnalysis";

// Mesh — one class: id-based editing + typed-array storage + connectivity.
export { Mesh } from "./core/geometry/mesh/Mesh";
export type { MeshNode, MeshEdge, MeshFace, MeshJSON, LegacyMeshJSON, MeshValidation, MeshData as FlatMeshData } from "./core/geometry/mesh/Mesh";
export { MeshFactory } from "./core/geometry/mesh/MeshFactory";
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
export { writeDxf3D, writeDxf2D } from "./io/DxfWriter";
export type { DxfLayerDef, Dxf3DContent, Dxf3DPolyline, Dxf3DLine, Dxf3DPoint, Dxf3DArc, Dxf3DCircle } from "./io/DxfWriter";
export type { Dxf2DContent, Dxf2DPolyline, Dxf2DLine, Dxf2DCircle, Dxf2DArc, Dxf2DText, Dxf2DPoint } from "./io/DxfWriter";
export { stampName } from "./io/download";
export { IfcFile } from "./io/IfcFile";
export type { IfcParseOptions } from "./io/IfcFile";
export { IfcModel } from "./io/IfcModel";
export type {
  IfcParseElementsOptions, IfcElementData, IfcModelData, IfcSpatialNode, IfcRelations,
} from "./io/IfcModel";
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

// Params — the ONE parameter model. sketch(), sketch2d(), appShell(), and
// the React ParamPanel all store their values in a ParamStore.
export { ParamStore, createParams, createLayout } from "./gui/Params";
export type {
  ParamDef, ParamSchema, FloatParam, IntParam, BoolParam,
  SelectParam, ColorParam, StringParam, Vec3Param, ButtonParam,
  ParamFolder, ParamLayout,
} from "./gui/Params";

// Which elements touch which, worked out from geometry. The companion to the
// relations an IFC file states, and separate because inference is not testimony.
export {
  boxOf, contactBetween, findAdjacent, neighboursOf, reverse as reverseContact,
} from "./bim/adjacency";
export type {
  Box, Contact, Adjacency, UpAxis, AdjacencyOptions,
} from "./bim/adjacency";

// Shared editing: a document of keyed records several people (and agents) edit together,
// with presence; backends are adapters (in-process, Vite dev server, Supabase).
export { SharedStore, collabColor, memoryAdapter, devServerAdapter, supabaseAdapter } from "./collab/SharedStore";
// The document of a retained app: typed records, stable ids, undo/redo, save/open (on SharedStore).
export { Doc, localAdapter, bindScene, Selection, selectOnClick } from "./collab/Doc";
export type { DocSchema, DocChange, DocChangeSource, DocEditOptions, DocOptions, DocJSON, SceneBinding, PickingView } from "./collab/Doc";
export type {
  SharedRecord, CollabUser, Presence, CollabStatus, CollabEvents, CollabAdapter, SharedStoreOptions, SupabaseLike,
} from "./collab/SharedStore";
