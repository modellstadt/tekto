// ═══════════════════════════════════════════════
// Tekto — Computational Geometry Toolkit
// ═══════════════════════════════════════════════

// The geometry and data layer: three-free, also importable on its own as "tekto/core".
export * from "./core";

// ── Browser layer: three.js renderers, panels, sketch(), appShell() ──

// Save a file from the browser (DOM; stampName is in core)
export { download } from "./io/download";

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
// Commands: what an app can do, with its keys — run by key, listed for a palette, run by agents.
export { Commands, keyMatches, formatKeys, viewCommands } from "./gui/Commands";
export type { Command, CommandInfo, ViewControl } from "./gui/Commands";
// A cube per render mode, drawn the way the mode draws: for a mode switch.
export { viewModeIconShapes, viewModeIconSvg, VIEW_MODE_ICON_SVG, VIEW_MODE_ICON_CORNERS } from "./gui/viewModeIcons";
export type { IconShape } from "./gui/viewModeIcons";
// The legend of a ColorRamp or of categories: over the 3D view (in snapshots) or in a panel row.
export { colorLegend } from "./gui/ColorLegend";
export type { ColorLegend, ColorLegendOptions } from "./gui/ColorLegend";
export { ControlPanel } from "./gui/ControlPanel";
export type {
  ControlItem, PanelButton, CustomRow, ExtraTab, ControlPanelConfig,
} from "./gui/ControlPanel";

// Renderers
export { ThreeRenderer } from "./render/ThreeRenderer";
export type { ThreeRendererConfig, PickInfo } from "./render/ThreeRenderer";
export type { AmbientOcclusionOptions } from "./render/AmbientOcclusion";
export type { ShadingBarCorner } from "./render/ShadingBar";
export type { SunPreset } from "./render/viewRules";
export { SVGRenderer } from "./render/SVGRenderer";
export { SheetCanvas, drawSheet, fitSheet } from "./render/SheetCanvas";
export type { SheetCanvasOptions, SheetTransform, DrawSheetOptions } from "./render/SheetCanvas";
export type { SVGRendererConfig } from "./render/SVGRenderer";
// The rules the renderer draws by, as plain functions: mode looks, named views, fitting, sections.
export {
  edgeStyle, surfaceAppearance, lightBalance, modeBackground,
  groundAppearance, sectionAppearance, DEFAULT_BACKGROUND,
  standardOrbit, orbitFor, shortestTurn, nearestAxis, easeInOut,
  fitRadius, orthoFrustum, sectionPlane, flatLights,
} from "./render/viewRules";
export type { ViewMode, Appearance, FlatLighting } from "./render/viewRules";
// The axis widget ThreeRenderer puts in a corner (`navGizmo: true`). Exported for an app
// that wants one over a renderer of its own.
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
export { viewerToolbar } from "./sketch/ViewerToolbar";
export type { TopBarOptions } from "./sketch/ViewerToolbar";

export { PresenceBar } from "./collab/PresenceBar";
export type { PresenceBarOptions } from "./collab/PresenceBar";

// Markup overlay types (the overlay itself is mounted by sketch(); see sketch/Markup.ts)
export type { MarkupBundle, MarkupCaptureOptions, MarkupObjectRef, MarkKind, MarkupRenderer } from "./sketch/Markup";
export { markup } from "./sketch/Markup";
// Share an app's document with agents: `window.__tekto.doc`, and through the dev server's relay
// (tekto/markup-vite) from outside the page — `tools/mcp.mjs` gives an agent these as tools.
export { agentDoc } from "./sketch/AgentBridge";
export type { AgentDocOptions, AgentDocApi, AgentIssue } from "./sketch/AgentBridge";
// Notes that live with the model: sketched notes kept in a Doc collection, drawn over the view.
export { notesLayer, NotesLayer } from "./sketch/Notes";
export type { Note, NotesRenderer } from "./sketch/Notes";

// Sketch2D API (Level 1 — 2D canvas variant, no Three.js)
export { sketch2d, Sketch2DInstance } from "./sketch/Sketch2D";
export type {
  Lab2D, Sketch2DConfig, Sketch2DFn, DrawFn, AnimateFn, Pointer2D, PointerFn,
} from "./sketch/Sketch2D";

// React (Level 3 — advanced) lives in its own entry point so the main "tekto"
// barrel stays React-free. Import from "tekto/react" (needs react + react-dom).
