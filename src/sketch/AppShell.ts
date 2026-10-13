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

import { Scene, LightingMode, RenderMode } from "../scene/Scene";
import { ThreeRenderer, ThreeRendererConfig } from "../render/ThreeRenderer";
import { ParamStore, ParamSchema } from "../gui/Params";
import { ControlPanel, ControlItem } from "../gui/ControlPanel";
import { getTheme, Theme } from "../gui/theme";
import { SunPosition } from "../core/solar/SunPosition";
import { installAgentBridge, plainBundle, sceneSummary, describeSceneObject, addOverlay, snapshotWithOverlays } from "./AgentBridge";
import { Commands, viewCommands } from "../gui/Commands";
import { MarkupOverlay, type MarkupCaptureOptions } from "./Markup";

// ─── Config ──────────────────────────────────

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
  /** The axis widget in a viewport corner (`true` = bottom right): click an axis for a plan
   *  or an elevation, toggle persp/ortho under it. Default `false` — an app may have its own
   *  panels in that corner. */
  navGizmo?: boolean | "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

// ─── App Shell instance ──────────────────────

/** The appShell top bar's controls; each is shown unless set to false. */
export interface TopBarOptions {
  /** Flat / Studio lighting. */
  light?: boolean;
  /** Solid / Wire / Hidden / Ghost. */
  mode?: boolean;
  /** Perspective / isometric. */
  camera?: boolean;
  /** A section through the model (`renderer.setSection`). */
  cut?: boolean;
  /** The sun for a place, date and hour. */
  sun?: boolean;
}

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
    ...config.renderer,
  });

  // ── Commands: the view's from the start, keys bound while the app is mounted ──
  const commands = new Commands();
  commands.add(viewCommands(renderer));
  const unbindKeys = commands.bindKeys();

  // ── Top bar: lighting (Flat / Studio) · render mode · camera · sun ──
  if (config.topBar !== false) {
    buildTopBar(header, scene, renderer, t, config.topBar === true || config.topBar === undefined ? {} : config.topBar);
  }

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
    if (animateFn) animateFn(dt, (now - startTime) / 1000);
    renderer.render();
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
  });
  return instance;
}

// ─── Top bar (lighting / render mode / camera / sun) ──
//
// The testbench's top-bar features for custom apps: Flat vs Studio (PBR +
// soft shadows + ACES) lighting, render mode, perspective/iso camera, and a
// Sun popover (date + lat/lon → SunPosition → directional light, for
// solar/shadow studies).

function buildTopBar(header: HTMLElement, scene: Scene, renderer: ThreeRenderer, t: Theme, show: TopBarOptions): void {
  const bar = document.createElement("div");
  bar.style.cssText = "margin-left:auto; display:flex; align-items:center; gap:16px;";
  header.appendChild(bar);

  const tag = (label: string) => {
    const el = document.createElement("span");
    el.textContent = label;
    el.style.cssText = `color:${t.textFaint}; text-transform:uppercase; letter-spacing:1px; font-size:9px;`;
    return el;
  };

  function segmented<T extends string>(opts: Array<[string, T]>, initial: T, onSel: (v: T) => void, follow?: (set: (v: T) => void) => void): HTMLElement {
    const wrap = document.createElement("div");
    wrap.style.cssText = `display:flex; border:1px solid ${t.border}; border-radius:5px; overflow:hidden;`;
    const btns: Array<[HTMLButtonElement, T]> = [];
    const set = (val: T) => {
      for (const [b, v] of btns) {
        const on = v === val;
        b.style.background = on ? t.accent : "transparent";
        b.style.color = on ? t.panelBg : t.textDim;
      }
    };
    for (const [label, val] of opts) {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = "padding:3px 9px; border:0; background:transparent; font:inherit; font-size:11px; cursor:pointer;";
      b.onclick = () => { set(val); onSel(val); };
      wrap.appendChild(b);
      btns.push([b, val]);
    }
    set(initial);
    follow?.(set);                       // the state can change elsewhere: show it when it does
    return wrap;
  }

  const group = (label: string, control: HTMLElement) => {
    const g = document.createElement("div");
    g.style.cssText = "display:flex; align-items:center; gap:6px;";
    g.append(tag(label), control);
    return g;
  };

  if (show.light !== false) bar.appendChild(group("Light", segmented<LightingMode>(
    [["Flat", "flat"], ["Studio", "studio"]], scene.lightingMode, (v) => scene.setLightingMode(v),
    (set) => scene.on((e) => { if (e.type === "scene:lightingMode") set(e.mode); }))));
  if (show.mode !== false) bar.appendChild(group("Mode", segmented<RenderMode>(
    [["Solid", "solid"], ["Wire", "wireframe"], ["Hidden", "hiddenline"], ["Ghost", "ghost"]], scene.renderMode, (v) => scene.setRenderMode(v),
    (set) => scene.on((e) => { if (e.type === "scene:renderMode") set(e.mode); }))));
  if (show.camera !== false) {
    const cam = group("Cam", segmented<"perspective" | "orthographic">(
      [["Persp", "perspective"], ["Ortho", "orthographic"]], renderer.projection,
      (v) => renderer.setProjection(v), (set) => renderer.onProjection(set)));
    // True isometric: orthographic, on the diagonal with equal foreshortening on X, Y and Z.
    // Orbiting afterwards stays orthographic (a general axonometric).
    const iso = document.createElement("button");
    iso.textContent = "Iso";
    iso.title = "Isometric: orthographic, from the diagonal";
    iso.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
    iso.onclick = () => { renderer.setProjection("orthographic"); renderer.setView("iso"); };
    cam.appendChild(iso);
    bar.appendChild(cam);
  }
  if (show.cut !== false) bar.appendChild(buildCut(renderer, t, segmented));
  if (show.sun !== false) bar.appendChild(buildSun(renderer, t));
}

/** "Cut ▾": a section along an axis, its position through the model, which side stays. */
function buildCut(
  renderer: ThreeRenderer, t: Theme,
  segmented: <T extends string>(opts: Array<[string, T]>, initial: T, onSel: (v: T) => void) => HTMLElement,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;";
  const btn = document.createElement("button");
  btn.textContent = "Cut ▾";
  btn.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
  const pop = document.createElement("div");
  pop.style.cssText = `position:absolute; top:130%; right:0; z-index:50; display:none; flex-direction:column; gap:8px;
    padding:12px; border:1px solid ${t.border}; border-radius:8px; background:${t.panelBg};
    box-shadow:0 8px 24px rgba(0,0,0,.45); width:228px; font-size:11px; color:${t.textDim};`;
  btn.onclick = () => { pop.style.display = pop.style.display === "none" ? "flex" : "none"; };
  wrap.append(btn, pop);

  const state = { axis: "off" as "off" | "x" | "y" | "z", at: 50, flip: false };
  const apply = () => {
    renderer.setSection(state.axis === "off" ? null : { axis: state.axis, at: state.at / 100, flip: state.flip });
    btn.style.color = state.axis === "off" ? t.textDim : t.accent;
  };
  const pos = document.createElement("input");
  pos.type = "range"; pos.min = "0"; pos.max = "100"; pos.step = "1"; pos.value = "50";
  pos.className = "tekto-slider";
  pos.style.cssText = `cursor:pointer;--tekto-track:${t.controlBorder};--tekto-thumb:${t.accent};`;
  pos.oninput = () => { state.at = Number(pos.value); apply(); };
  const flip = document.createElement("label");
  flip.style.cssText = "display:flex; align-items:center; gap:6px; cursor:pointer;";
  const flipBox = document.createElement("input");
  flipBox.type = "checkbox";
  flipBox.onchange = () => { state.flip = flipBox.checked; apply(); };
  flip.append(flipBox, "Keep the other side");
  pop.append(
    segmented<"off" | "x" | "y" | "z">([["Off", "off"], ["Plan", "z"], ["X", "x"], ["Y", "y"]], "off", (v) => { state.axis = v; apply(); }),
    pos, flip,
  );
  return wrap;
}

function buildSun(renderer: ThreeRenderer, t: Theme): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;";

  const btn = document.createElement("button");
  btn.innerHTML = "&#x2600;&#xFE0E; Sun &#x25BE;";
  btn.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
  wrap.appendChild(btn);

  const pop = document.createElement("div");
  pop.style.cssText = `position:absolute; top:130%; right:0; z-index:50; display:none; flex-direction:column; gap:8px;
    padding:12px; border:1px solid ${t.border}; border-radius:8px; background:${t.panelBg};
    box-shadow:0 8px 24px rgba(0,0,0,.45); width:228px;`;
  wrap.appendChild(pop);
  btn.onclick = () => { pop.style.display = pop.style.display === "none" ? "flex" : "none"; };

  // Default: Zürich, summer solstice, 13:00.
  const state = { lat: 47.37, lon: 8.55, month: 6, day: 21, hour: 13 };

  const readout = document.createElement("div");
  readout.style.cssText = `font-size:10px; color:${t.textDim}; font-family:${t.font};`;

  const apply = () => {
    const date = new Date(Date.UTC(2025, state.month - 1, state.day, Math.floor(state.hour), Math.round((state.hour % 1) * 60)));
    const sun = SunPosition.compute({ date, latitude: state.lat, longitude: state.lon });
    renderer.setSunDirection(sun.direction);
    const deg = (r: number) => Math.round((r * 180) / Math.PI);
    readout.textContent = `alt ${deg(sun.altitude)}°  az ${deg(sun.azimuth)}°  ${sun.isDaytime ? "day" : "night"}`;
  };

  const num = (label: string, value: number, min: number, max: number, step: number, onCh: (v: number) => void) => {
    const r = document.createElement("label");
    r.style.cssText = `display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; color:${t.textDim};`;
    const sp = document.createElement("span"); sp.textContent = label;
    const i = document.createElement("input");
    i.type = "number"; i.value = String(value); i.min = String(min); i.max = String(max); i.step = String(step);
    i.style.cssText = `width:84px; padding:2px 5px; background:${t.fieldBg}; border:1px solid ${t.border}; border-radius:4px; color:inherit; font:inherit; font-size:11px;`;
    i.oninput = () => onCh(Number(i.value));
    r.append(sp, i);
    return r;
  };

  pop.append(
    num("Latitude", state.lat, -90, 90, 0.1, (v) => { state.lat = v; apply(); }),
    num("Longitude", state.lon, -180, 180, 0.1, (v) => { state.lon = v; apply(); }),
    num("Month", state.month, 1, 12, 1, (v) => { state.month = v; apply(); }),
    num("Day", state.day, 1, 31, 1, (v) => { state.day = v; apply(); }),
  );

  // Hour slider.
  const hourWrap = document.createElement("label");
  hourWrap.style.cssText = `display:flex; flex-direction:column; gap:4px; font-size:11px; color:${t.textDim};`;
  const hourLabel = document.createElement("span"); hourLabel.textContent = "Hour 13:00";
  const hour = document.createElement("input");
  hour.type = "range"; hour.min = "0"; hour.max = "24"; hour.step = "0.25"; hour.value = "13";
  hour.className = "tekto-slider";
  hour.style.cssText = `cursor:pointer;--tekto-track:${t.controlBorder};--tekto-thumb:${t.accent};`;
  hour.oninput = () => {
    state.hour = Number(hour.value);
    const h = Math.floor(state.hour), m = Math.round((state.hour % 1) * 60);
    hourLabel.textContent = `Hour ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    apply();
  };
  hourWrap.append(hourLabel, hour);
  pop.append(hourWrap, readout);

  apply(); // seed an initial sun direction so Studio has a sensible light
  return wrap;
}
