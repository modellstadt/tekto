// ═══════════════════════════════════════════════
// Tekto — Computational Geometry Toolkit
// ═══════════════════════════════════════════════

// The geometry and data layer: three-free, also importable on its own as "tekto/core".
export * from "./core";

// ── Browser layer: three.js renderers, panels, sketch(), appShell() ──

// IO that renders (GPU hidden line) or projects through three.js
export { DxfExporter, processWorkerRequest } from "./io/DxfExporter";
export type { DxfView, DxfMeshOptions, DxfEdgeOptions, DxfWriteOptions, DxfSegment, DxfWorkerRequest } from "./io/DxfExporter";
export { hiddenLineIdBuffer } from "./io/IdBufferHiddenLine";
export { extractVisiblePolylines, polylinesToSVG } from "./io/PolylineVisibility";
export type {
  VisibilityView, VisibilityOptions, ProjectedSegment, VisibilityResult, SVGOptions,
} from "./io/PolylineVisibility";
export type { IdBufferOptions } from "./io/IdBufferHiddenLine";

// GUI: shared theme + control renderer (used by sketch / sketch2d / appShell;
// also usable standalone for custom panels).
export { getTheme } from "./gui/theme";
export type { Theme } from "./gui/theme";
export { ControlPanel } from "./gui/ControlPanel";
export type {
  ControlItem, PanelButton, CustomRow, ExtraTab, ControlPanelConfig,
} from "./gui/ControlPanel";

// Renderers
export { ThreeRenderer } from "./render/ThreeRenderer";
export type { ThreeRendererConfig } from "./render/ThreeRenderer";
export { SVGRenderer } from "./render/SVGRenderer";
export type { SVGRendererConfig } from "./render/SVGRenderer";
// A viewport for meshes an app built itself, as opposed to a Scene the library
// owns: view modes, progressive creases, a real sun, camera projections.
export {
  Viewport, edgeStyle, surfaceAppearance, lightBalance, modeBackground,
  groundAppearance, sectionAppearance, DEFAULT_BACKGROUND,
  standardOrbit, orbitFor, shortestTurn, nearestAxis, easeInOut,
  fitRadius, orthoFrustum,
} from "./render/Viewport";
export type {
  ViewMode, Projection, StandardView, Appearance, ViewportOptions, ContentOptions,
  SectionRequest,
} from "./render/Viewport";
// The axis widget the Viewport puts in its corner. Exported for an app that
// wants one over a scene of its own; a Viewport already has it.
export { NavGizmo } from "./render/NavGizmo";
export type { NavGizmoOptions } from "./render/NavGizmo";
// Labels in the margins with leaders to what they name, laid out the way a
// drawing is annotated rather than floated at the thing.
export { Callouts, layoutLabels, labelWidthFor } from "./render/Callouts";
export type { CalloutItem, Placement, LayoutOptions } from "./render/Callouts";

// GUI: layer panel (consumed by both the sketch API + standalone apps).
export { LayerPanel, computeEffectiveVisibility } from "./gui/LayerPanel";
export type { LayerNode, LayerState, LayerMap } from "./gui/LayerPanel";

// Sketch API (Level 1 — primary student-facing API)
export { sketch, SketchInstance } from "./sketch/Sketch";
export type {
  Lab, SketchConfig, Reactive,
  MeshHandle, PointHandle, LineHandle, ShapeHandle,
  SliderOpts, SelectOpts, ShapeMode,
  ExportRegistration, ImportRegistration,
} from "./sketch/Sketch";

// App Shell (Level 2 — persistent-panel apps without React)
export { appShell } from "./sketch/AppShell";
export type { AppShellConfig, AppShellInstance } from "./sketch/AppShell";

export { PresenceBar } from "./collab/PresenceBar";
export type { PresenceBarOptions } from "./collab/PresenceBar";

// Markup overlay types (the overlay itself is mounted by sketch(); see sketch/Markup.ts)
export type { MarkupBundle, MarkupCaptureOptions, MarkupObjectRef, MarkKind } from "./sketch/Markup";

// Sketch2D API (Level 1 — 2D canvas variant, no Three.js)
export { sketch2d, Sketch2DInstance } from "./sketch/Sketch2D";
export type {
  Lab2D, Sketch2DConfig, Sketch2DFn, DrawFn, AnimateFn, Pointer2D, PointerFn,
} from "./sketch/Sketch2D";

// React (Level 3 — advanced) lives in its own entry point so the main "tekto"
// barrel stays React-free. Import from "tekto/react" (needs react + react-dom).
