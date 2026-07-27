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
  /** Top bar with Lighting / Render-mode / Camera / Sun controls. Default: true. */
  topBar?: boolean;
}

// ─── App Shell instance ──────────────────────

export interface AppShellInstance<S extends ParamSchema = ParamSchema> {
  params: ParamStore<S>;
  scene: Scene;
  renderer: ThreeRenderer;
  /** The sidebar renderer — call panel.render(...) to change the control structure at runtime. */
  panel: ControlPanel;

  /** Register an animation callback (called every frame with dt in seconds) */
  onAnimate(fn: (dt: number, time: number) => void): void;

  /** Update the status overlay text (cheap — just sets textContent) */
  status(text: string): void;

  /** Dispose everything */
  dispose(): void;
}

// ─── Build the shell ─────────────────────────

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
  viewportEl.style.cssText = "width:100%;height:100%;";
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
    ...config.renderer,
  });

  // ── Top bar: lighting (Flat / Studio) · render mode · camera · sun ──
  if (config.topBar !== false) {
    buildTopBar(header, scene, renderer, t);
  }

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

  // ── Return instance ──

  return {
    params,
    scene,
    renderer,
    panel,

    onAnimate(fn) { animateFn = fn; },

    status(text: string) {
      if (text) {
        statusEl.textContent = text;
        statusEl.style.display = "block";
      } else {
        statusEl.style.display = "none";
      }
    },

    dispose() {
      disposed = true;
      panel.dispose();
      renderer.dispose();
      config.container.removeChild(root);
    },
  };
}

// ─── Top bar (lighting / render mode / camera / sun) ──
//
// The testbench's top-bar features for custom apps: Flat vs Studio (PBR +
// soft shadows + ACES) lighting, render mode, perspective/iso camera, and a
// Sun popover (date + lat/lon → SunPosition → directional light, for
// solar/shadow studies).

function buildTopBar(header: HTMLElement, scene: Scene, renderer: ThreeRenderer, t: Theme): void {
  const bar = document.createElement("div");
  bar.style.cssText = "margin-left:auto; display:flex; align-items:center; gap:16px;";
  header.appendChild(bar);

  const tag = (label: string) => {
    const el = document.createElement("span");
    el.textContent = label;
    el.style.cssText = `color:${t.textFaint}; text-transform:uppercase; letter-spacing:1px; font-size:9px;`;
    return el;
  };

  function segmented<T extends string>(opts: Array<[string, T]>, initial: T, onSel: (v: T) => void): HTMLElement {
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
    return wrap;
  }

  const group = (label: string, control: HTMLElement) => {
    const g = document.createElement("div");
    g.style.cssText = "display:flex; align-items:center; gap:6px;";
    g.append(tag(label), control);
    return g;
  };

  bar.appendChild(group("Light", segmented<LightingMode>(
    [["Flat", "flat"], ["Studio", "studio"]], "flat", (v) => scene.setLightingMode(v))));
  bar.appendChild(group("Mode", segmented<RenderMode>(
    [["Solid", "solid"], ["Wire", "wireframe"], ["Hidden", "hiddenline"]], "solid", (v) => scene.setRenderMode(v))));
  bar.appendChild(group("Cam", segmented<"persp" | "iso">(
    [["Persp", "persp"], ["Iso", "iso"]], "persp", (v) => {
      if (v === "iso") {
        // True isometric: camera on the (1,-1,1) diagonal — equal foreshortening
        // on X/Y/Z — at the current viewing distance, with orthographic projection.
        // Orbiting afterwards stays orthographic (general axonometric).
        renderer.setProjection("perspective"); // normalize: pose lives on the persp camera
        const c = renderer.controls;
        if (c) {
          const target = c.target;
          const step = renderer.camera.position.distanceTo(target) / Math.sqrt(3);
          renderer.setCameraPosition(target.x + step, target.y - step, target.z + step);
          c.update();
        }
        renderer.setProjection("orthographic");
      } else {
        renderer.setProjection("perspective");
      }
    })));
  bar.appendChild(buildSun(renderer, t));
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
