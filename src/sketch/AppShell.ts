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

import { Scene } from "../scene/Scene";
import { ThreeRenderer, ThreeRendererConfig } from "../render/ThreeRenderer";
import { ParamStore, ParamSchema } from "../gui/Params";
import { ControlPanel, ControlItem } from "../gui/ControlPanel";
import { getTheme, Theme } from "../gui/theme";
import { installAgentBridge, plainBundle, sceneSummary, describeSceneObject, addOverlay, snapshotWithOverlays } from "./AgentBridge";
import { Commands, viewCommands } from "../gui/Commands";
import { viewerToolbar, type TopBarOptions } from "./ViewerToolbar";
import { NotesLayer, type Note } from "./Notes";
import type { Doc } from "../collab/Doc";
import { MarkupOverlay, type MarkupCaptureOptions } from "./Markup";

// ─── Config ──────────────────────────────────

/** Options for `appShell()`: the container, the param schema and its groups, the initial camera, up axis (default Z), theme, panel width, and which top bar, Markup and axis-widget controls to show. */
export interface AppShellConfig<S extends ParamSchema = ParamSchema> {
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
  notes?: Doc<any> | { doc: Doc<any>; collection?: string; author?: string };
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

// ─── App Shell instance ──────────────────────

/** What `appShell()` returns: its params, scene, renderer, panel and commands, the build/display/animate hooks, the status line and overlays, and `dispose`. */
export interface AppShellInstance<S extends ParamSchema = ParamSchema> {
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

// ─── Build the shell ─────────────────────────

/**
 * A persistent app ("retained" model): params declared once as a schema, geometry built in
 * `onBuild`, restyled in `onDisplay`, objects added to a `Scene` the app owns and keeps.
 * Z-up by default. The path for apps whose users build, select, name and save things.
 *
 *   const app = appShell({ container, params: { floors: { type: "int", min: 1, max: 40, default: 12 } } });
 *   app.onBuild(() => { app.scene.clear(); … app.scene.addMesh(m); }); app.rebuild();
 */
export function appShell<S extends ParamSchema>(config: AppShellConfig<S>): AppShellInstance<S> {
  const t = getTheme(config.theme);
  const panelWidth = config.panelWidth ?? 260;

  // ── Layout ──

  const root = document.createElement("div");
  root.style.cssText = `
    display:grid; grid-template-columns:${panelWidth}px 1fr;
    grid-template-rows:36px 1fr;
    width:100%; height:100%; font-family:${t.font};
    font-size:12px; color:${t.text}; background:${t.panelBg};
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
    background:${t.panelBg}; border-bottom:1px solid ${t.border};
  `;
  header.innerHTML = `
    <span style="font-weight:600;font-size:14px;color:${t.accent}">
      &#x2B21; ${config.title ?? "Tekto App"}
    </span>
    <span style="font-size:9px;padding:2px 6px;border-radius:3px;
      background:${t.hoverBg};color:${t.accent}">LIVE</span>
  `;
  root.appendChild(header);

  // Panel
  const panelEl = document.createElement("div");
  panelEl.style.cssText = `
    overflow-y:auto; overflow-x:hidden; padding:0;
    background:${t.panelBg}; border-right:1px solid ${t.border};
  `;
  root.appendChild(panelEl);

  // Viewport wrapper
  const vpWrap = document.createElement("div");
  vpWrap.style.cssText = "position:relative;overflow:hidden;";

  const viewportEl = document.createElement("div");
  // Its own stacking context: what the 3D view puts in its corners (the axis widget) stays
  // with the 3D view, under any overlay() laid over it.
  viewportEl.style.cssText = "width:100%;height:100%;isolation:isolate;";
  vpWrap.appendChild(viewportEl);

  // Status overlay
  const statusEl = document.createElement("div");
  statusEl.style.cssText = `
    position:absolute; bottom:12px; left:12px;
    padding:8px 12px; border-radius:6px;
    background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
    font-size:11px; line-height:1.7; color:${t.textDim};
    pointer-events:none; max-width:340px;
    border:1px solid rgba(22,24,42,.8);
    white-space:pre; font-family:${t.font};
    display:none;
  `;
  vpWrap.appendChild(statusEl);

  root.appendChild(vpWrap);
  config.container.appendChild(root);

  // ── ParamStore + shared ControlPanel sidebar ──

  const params = new ParamStore(config.params);
  const panel = new ControlPanel({ store: params, theme: t });

  const groups = config.groups ?? { Parameters: Object.keys(config.params) };
  const items: ControlItem[] = [];
  for (const [groupName, keys] of Object.entries(groups)) {
    for (const key of keys) items.push({ key, group: groupName });
  }
  panel.render(items);
  panelEl.appendChild(panel.el);

  // ── Scene + Renderer ──

  const scene = new Scene();
  const renderer = new ThreeRenderer(scene, viewportEl, {
    backgroundColor: config.background ?? 0x0a0b14,
    cameraPosition: config.camera ?? [6, 8, 10],
    cameraTarget: config.target ?? [0, 0, 0],
    // Z-up by default — matches the tekto convention (XY = ground plane) and
    // the architectural / BIM / voxel geometry these apps usually build. Pass
    // `up: "y"` if you're showing the Y-up built-in primitives (box/cylinder/sphere).
    up: config.up ?? "z",
    navGizmo: config.navGizmo ?? false,
    shadingBar: config.shadingBar ?? false,
    units: config.units ?? null,
    ...config.renderer,
  });

  // ── Commands: the view's from the start, keys bound while the app is mounted ──
  const commands = new Commands();
  commands.add(viewCommands(renderer));
  const unbindKeys = commands.bindKeys();

  // ── Top bar: lighting · render mode · camera · cut · sun (the viewer toolbar) ──
  const toolbar = config.topBar === false ? null
    : viewerToolbar(scene, renderer, { ...(config.topBar === true || config.topBar === undefined ? {} : config.topBar), theme: t });
  if (toolbar) header.appendChild(toolbar.el);

  // ── Notes that live with the model (a Doc collection), drawn over the view ──
  const notesCfg = config.notes ? ("doc" in config.notes ? config.notes : { doc: config.notes }) : null;
  const notes = notesCfg ? new NotesLayer(renderer, notesCfg.doc, { collection: notesCfg.collection, host: vpWrap }) : null;

  // ── Build / display passes ──
  // Two-tier invalidation: params flagged `display: true` only re-run the
  // display pass (restyle); everything else re-runs build then display.

  let buildFn: (() => void) | null = null;
  let displayFn: (() => void) | null = null;

  params.onChange((key) => {
    const def = params.getDef(key as any) as { display?: boolean } | undefined;
    if (def?.display) {
      displayFn?.();
    } else {
      buildFn?.();
      displayFn?.();
    }
  });

  // ── Animation loop ──

  let animateFn: ((dt: number, time: number) => void) | null = null;
  let lastTime = performance.now();
  let startTime = lastTime;
  let disposed = false;

  function loop() {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 1 / 15);
    lastTime = now;
    // An animating app draws every frame; otherwise only when something asked for a frame.
    if (animateFn) {
      animateFn(dt, (now - startTime) / 1000);
      renderer.render();
    } else {
      renderer.renderIfNeeded();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ── window.__tekto for agents (tools/snap.mjs) ──

  let statusText = "";
  const overlays: HTMLElement[] = [];
  const instance: AppShellInstance<S> = {
    params,
    scene,
    renderer,
    panel,
    commands,
    notes,

    onAnimate(fn) { animateFn = fn; },

    onBuild(fn) { buildFn = fn; },
    onDisplay(fn) { displayFn = fn; },
    rebuild() { buildFn?.(); displayFn?.(); },

    status(text: string) {
      statusText = text;
      if (text) {
        statusEl.textContent = text;
        statusEl.style.display = "block";
      } else {
        statusEl.style.display = "none";
      }
    },

    overlay() { return addOverlay(viewportEl, overlays); },

    dispose() {
      disposed = true;
      markup?.dispose();
      bridge.dispose();
      unbindKeys();
      toolbar?.dispose();
      notes?.dispose();
      panel.dispose();
      renderer.dispose();
      config.container.removeChild(root);
    },
  };

  // What the viewport shows: the 3D view, and the overlay canvases that are visible over it.
  const snapshotPng = (): string => snapshotWithOverlays(renderer, vpWrap);

  // ✎ Markup: marks resolve to the objects they touch — and through `key` to document records.
  const context = () => ({
    harness: "appShell",
    ...sceneSummary(scene, renderer, (id) => describeSceneObject(scene, id)),
    up: config.up ?? "z",
    params: params.getAll(),
    logs: statusText ? [{ label: "status", value: statusText }] : [],
    commands: commands.list(),
    errors: bridge.errors(),
  });
  const markup = config.markup === false ? null : new MarkupOverlay({
    viewport: vpWrap,
    title: config.title ?? "app",
    hitAt: (x, y) => renderer.hitAt(x, y),
    groundAt: (x, y) => renderer.groundAt(x, y),
    snapshotPng: () => snapshotPng(),
    describe: (id) => describeSceneObject(scene, id),
    context,
    setTracking: () => { /* retained scenes aren't re-run: objects carry their record key instead */ },
    ...(notes ? { keep: (ns: Note[]) => { notes.keep(ns); } } : {}),
    ...(notesCfg && "author" in notesCfg && notesCfg.author ? { author: notesCfg.author } : {}),
  });

  const bridge = installAgentBridge({
    owner: instance,
    commands,
    harness: "appShell",
    store: params,
    snapshot: (opts?: MarkupCaptureOptions) => markup
      ? markup.capture(opts)
      : plainBundle({
          ...opts,
          title: config.title ?? "app",
          harness: "appShell",
          png: snapshotPng(),
          viewport: { width: viewportEl.clientWidth, height: viewportEl.clientHeight },
          context: context(),
        }),
    camera: (pos, target) => {
      renderer.setCameraPosition(pos[0], pos[1], pos[2]);
      if (target) renderer.lookAt(target[0], target[1], target[2]);
    },
    section: (cut) => renderer.setSection(cut),
  });
  return instance;
}
