// ═══════════════════════════════════════════════
// tekto/2d — the small on-ramp
// ═══════════════════════════════════════════════
//
// A 2D canvas sketch with sliders, p5-style, and the 2D geometry a first sketch
// needs. No three.js. `import { sketch2d, Vec2, PolygonBool } from "tekto/2d"`.
// Everything else (meshes, curves, BIM, IO …) is in "tekto/core"; the 3D sketch
// and renderers are in "tekto".

export { sketch2d, Sketch2DInstance } from "./sketch/Sketch2D";
export type {
  Lab2D, Sketch2DConfig, Sketch2DFn, DrawFn, AnimateFn, Pointer2D, PointerFn,
  Reactive, SliderOpts, SelectOpts,
} from "./sketch/Sketch2D";

export { Vec2, Vec3 } from "./core/math/vectors";
export { noise } from "./core/math/noise";
export { createRandom } from "./core/math/random";
export type { SeededRandom } from "./core/math/random";

export { Polygon2D } from "./core/geometry/Polygon2D";
export type { FilletResult } from "./core/geometry/Polygon2D";
export { PolygonBool } from "./core/geometry/PolygonBool";
export type { Ring2, Poly2, MultiPoly2 } from "./core/geometry/PolygonBool";
export { Segment, closestPointOnSegment, segmentSegmentClosest } from "./core/geometry/Segment";

// Exporting a drawing: writeDxf2D(...) → download(..., "plan.dxf")
export { writeDxf2D } from "./io/DxfWriter";
export type { Dxf2DContent, Dxf2DPolyline, Dxf2DLine, Dxf2DCircle, Dxf2DArc, Dxf2DText, Dxf2DPoint, DxfLayerDef } from "./io/DxfWriter";
export { download, stampName } from "./io/download";
