/**
 * Tekto Sketch2D API
 *
 * Lightweight 2D canvas sketch — same panel/controls as Sketch,
 * but renders to a raw CanvasRenderingContext2D instead of Three.js.
 * No WebGL, no Three.js dependency.
 *
 * ─── Usage ───────────────────────────────────
 *
 *   import { sketch2d } from "tekto";
 *
 *   sketch2d((lab) => {
 *     const r = lab.slider("Radius", 1, 100, 30);
 *     const color = lab.colorPicker("Fill", "#38d9a9");
 *
 *     lab.draw((ctx, w, h) => {
 *       ctx.clearRect(0, 0, w, h);
 *       ctx.fillStyle = color.value;
 *       ctx.beginPath();
 *       ctx.arc(w / 2, h / 2, r.value, 0, Math.PI * 2);
 *       ctx.fill();
 *     });
 *   });
 *
 * ─── How it works ────────────────────────────
 *
 *   Like Sketch, the function re-runs when any parameter changes.
 *   The draw callback receives a 2D context and canvas dimensions.
 *   Use lab.animate() for continuous rendering.
 *
 *   Params live in a ParamStore and the panel is rendered by the shared
 *   ControlPanel (src/gui/) — the same system the 3D sketch API and
 *   appShell use.
 */

import { Vec2, MathUtils } from "../core/math/vectors";
import { noise } from "../core/math/noise";
import { createRandom, SeededRandom } from "../core/math/random";
import { ParamStore, ParamDef } from "../gui/Params";
import { ControlPanel, ControlItem, PanelButton } from "../gui/ControlPanel";
import { getTheme } from "../gui/theme";
import type { Reactive, SliderOpts, SelectOpts } from "./SketchTypes";
export type { Reactive, SliderOpts, SelectOpts } from "./SketchTypes";

// ═══════════════════════════════════════════════
// Public Types
// ═══════════════════════════════════════════════

export interface Sketch2DConfig {
  /** DOM element or CSS selector to mount into */
  container?: HTMLElement | string;
  /** Title shown in the header */
  title?: string;
  /** Canvas background color (CSS) */
  background?: string;
  /** Panel width in pixels (default 280) */
  panelWidth?: number;
  /** Dark or light theme */
  theme?: "dark" | "light";
}

export type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
export type AnimateFn = (time: number, dt: number) => void;

/** A single pointer (mouse / touch / pen) sample in CSS pixels relative to the canvas. */
export interface Pointer2D {
  /** X in CSS pixels, relative to the canvas top-left. */
  x: number;
  /** Y in CSS pixels, relative to the canvas top-left. */
  y: number;
  /** Stable id for this pointer — match it across down/move/up to track one finger. */
  id: number;
}
export type PointerFn = (p: Pointer2D) => void;

/** The lab context passed to the sketch function */
export interface Lab2D {
  // ── GUI Controls ──
  slider(label: string, min: number, max: number, defaultValue: number, opts?: SliderOpts): Reactive<number>;
  toggle(label: string, defaultValue?: boolean, opts?: { group?: string }): Reactive<boolean>;
  select<T extends string>(label: string, options: readonly T[], defaultValue?: T, opts?: SelectOpts): Reactive<T>;
  colorPicker(label: string, defaultValue?: string, opts?: { group?: string }): Reactive<string>;
  button(label: string, action: () => void, opts?: { group?: string }): void;

  /** Register the draw callback. Called on every re-run and animation frame. */
  draw(fn: DrawFn): void;
  /** Enable continuous animation. Callback runs each frame. */
  animate(fn: AnimateFn): void;
  /**
   * Run `fn` on the FIRST sketch run only — skipped on re-runs. Use for
   * one-shot setup (loading data, attaching listeners to lab.canvas)
   * without guard flags. Calls are matched by declaration order, so keep
   * `once` calls unconditional at the top level of the sketch body.
   */
  once(fn: () => void): void;

  /** Get the raw canvas element (for advanced use like multiple canvases) */
  readonly canvas: HTMLCanvasElement;
  /** Get the 2D rendering context */
  readonly ctx: CanvasRenderingContext2D;
  /** Canvas width in CSS pixels */
  readonly width: number;
  /** Canvas height in CSS pixels */
  readonly height: number;
  /** Device pixel ratio */
  readonly dpr: number;

  // ── Info ──
  log(label: string, value?: string | number): void;

  // ── Math ──
  vec2(x: number, y: number): Vec2;
  PI: number;
  TWO_PI: number;
  sin: typeof Math.sin;
  cos: typeof Math.cos;
  atan2: typeof Math.atan2;
  abs: typeof Math.abs;
  sqrt: typeof Math.sqrt;
  floor: typeof Math.floor;
  ceil: typeof Math.ceil;
  round: typeof Math.round;
  min: typeof Math.min;
  max: typeof Math.max;
  lerp: typeof MathUtils.lerp;
  clamp: typeof MathUtils.clamp;
  noise(x: number, y?: number, z?: number): number;
  random(min?: number, max?: number): number;
  randomSeed(seed: number): void;

  // ── Input ──
  readonly mouseX: number;
  readonly mouseY: number;
  readonly mousePressed: boolean;

  /**
   * Pointer input (mouse + touch + pen, unified). Register a handler that
   * fires on every pointer-down. Coordinates are CSS pixels relative to the
   * canvas; `id` is stable across the down/move/up of one finger so multi-touch
   * gestures can be tracked. Handlers are re-collected on each sketch re-run,
   * so register them at the top level of the sketch body (like `draw`).
   *
   * To keep a drag tracking outside the canvas bounds, call
   * `lab.canvas.setPointerCapture(id)` inside the down handler.
   */
  onPointerDown(fn: PointerFn): void;
  /** Fires on pointer-move for any active pointer. See {@link onPointerDown}. */
  onPointerMove(fn: PointerFn): void;
  /** Fires on pointer-up / pointer-cancel. See {@link onPointerDown}. */
  onPointerUp(fn: PointerFn): void;
}

export type Sketch2DFn = (lab: Lab2D) => void;

// ═══════════════════════════════════════════════
// Internal state
// ═══════════════════════════════════════════════

interface LogEntry {
  label: string;
  value: string;
}

// ═══════════════════════════════════════════════
// Implementation
// ═══════════════════════════════════════════════

export function sketch2d(fn: Sketch2DFn, config?: Sketch2DConfig): Sketch2DInstance {
  return new Sketch2DInstance(fn, config ?? {});
}

export class Sketch2DInstance {
  private fn: Sketch2DFn;
  private config: Sketch2DConfig;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private panelEl!: HTMLElement;
  private logEl!: HTMLElement;

  // Param model: values in the ParamStore, placement in `items` — rendered
  // by the shared ControlPanel.
  private store: ParamStore = new ParamStore({});
  private panel!: ControlPanel;
  private items = new Map<string, ControlItem>();
  private buttons: PanelButton[] = [];
  private logs: LogEntry[] = [];
  private drawFn: DrawFn | null = null;
  private animateFn: AnimateFn | null = null;
  private pointerDownFns: PointerFn[] = [];
  private pointerMoveFns: PointerFn[] = [];
  private pointerUpFns: PointerFn[] = [];
  private continuous = false;
  private _prevFingerprint = "";
  private _baseLogCount = 0;
  private _onceRan: boolean[] = [];
  private _onceSeq = 0;

  private rng: SeededRandom = createRandom();
  private disposed = false;
  private startTime = performance.now();
  private lastTime = performance.now();
  private rerunTimer = 0;
  private _running = false;

  // Input state
  private _mouseX = 0;
  private _mouseY = 0;
  private _mousePressed = false;

  constructor(fn: Sketch2DFn, config: Sketch2DConfig) {
    this.fn = fn;
    this.config = config;

    if (typeof config.container === "string") {
      this.container = document.querySelector(config.container) as HTMLElement;
    } else if (config.container) {
      this.container = config.container;
    } else {
      this.container = document.body;
    }

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
    this.buildDOM();
    this.wireInput();
    this.runSketch();
    this.startLoop();
  }

  // ── DOM ──

  private buildDOM() {
    const pw = this.config.panelWidth ?? 280;
    const t = getTheme(this.config.theme);

    const root = document.createElement("div");
    root.style.cssText = `
      display:grid; grid-template-columns:${pw}px 1fr; grid-template-rows:44px 1fr;
      height:100%; width:100%; overflow:hidden; position:relative;
      background:${t.bg}; color:${t.text};
      font-family:${t.font};
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
      background:${t.panelBg}; border-bottom:1px solid ${t.border};
    `;
    header.innerHTML = `
      <span style="font-weight:600;font-size:14px;color:${t.accent}">
        &#x2B21; ${this.config.title ?? "Tekto Sketch2D"}
      </span>
      <span style="font-size:9px;padding:2px 6px;border-radius:3px;
        background:${t.hoverBg};color:${t.accent}">2D</span>
    `;
    root.appendChild(header);

    // Panel
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      grid-column:1; grid-row:2; overflow-y:auto; overflow-x:hidden; padding:0;
      background:${t.panelBg}; border-right:1px solid ${t.border};
    `;
    root.appendChild(this.panelEl);

    this.panel = new ControlPanel({
      store: this.store,
      theme: t,
      getButtons: () => this.buttons,
      onAction: () => this.scheduleRerun(),
    });
    this.panelEl.appendChild(this.panel.el);
    this.store.onChange(() => this.scheduleRerun());

    // Collapsible sidebar — a toggle in the header hides the panel and hands the width
    // to the canvas; the choice is persisted across reloads.
    const collapseKey = "tekto.sketch2d.collapsed";
    let collapsed = false;
    try { collapsed = localStorage.getItem(collapseKey) === "1"; } catch { /* noop */ }
    const toggleBtn = document.createElement("button");
    toggleBtn.style.cssText = `
      margin-left:auto; cursor:pointer; width:28px; height:26px; border-radius:6px;
      border:1px solid ${t.border}; background:transparent; color:${t.text};
      font-size:15px; line-height:1; padding:0; flex:none;
    `;
    const applyCollapse = () => {
      root.style.gridTemplateColumns = collapsed ? "0 1fr" : `${pw}px 1fr`;
      this.panelEl.style.display = collapsed ? "none" : "";
      toggleBtn.textContent = collapsed ? "›" : "‹";   // › when hidden, ‹ when shown
      toggleBtn.title = collapsed ? "Show controls" : "Hide controls";
    };
    toggleBtn.addEventListener("click", () => {
      collapsed = !collapsed;
      try { localStorage.setItem(collapseKey, collapsed ? "1" : "0"); } catch { /* noop */ }
      applyCollapse();
      this.resizeCanvas();
    });
    header.appendChild(toggleBtn);

    // Canvas container + log overlay
    const vpWrap = document.createElement("div");
    vpWrap.style.cssText = "grid-column:2;grid-row:2;position:relative;overflow:hidden;";   // pinned so a display:none panel can't steal its column

    this.canvas.style.cssText = `
      width:100%; height:100%; display:block;
      background:${this.config.background ?? (t.isDark ? "#0a0a10" : "#ffffff")};
    `;
    vpWrap.appendChild(this.canvas);

    this.logEl = document.createElement("div");
    this.logEl.style.cssText = `
      position:absolute; bottom:12px; left:12px;
      padding:8px 12px; border-radius:6px;
      background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
      font-size:11px; line-height:1.7; color:${t.textDim};
      pointer-events:none; max-width:300px;
      border:1px solid rgba(22,24,42,.8); display:none;
    `;
    vpWrap.appendChild(this.logEl);

    root.appendChild(vpWrap);

    if (this.container === document.body) {
      this.container.style.margin = "0";
      this.container.style.height = "100vh";
      this.container.style.overflow = "hidden";
    }
    this.container.appendChild(root);
    applyCollapse();   // honor the persisted collapsed state on first paint

    // Resize canvas to match viewport
    const ro = new ResizeObserver(() => this.resizeCanvas());
    ro.observe(vpWrap);
    this.resizeCanvas();
  }

  private resizeCanvas() {
    const parent = this.canvas.parentElement!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w > 0 && h > 0) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.redraw();
    }
  }

  private wireInput() {
    // Stop touch-drags from scrolling/zooming the page so a sketch can own the gesture.
    this.canvas.style.touchAction = "none";

    const sample = (e: PointerEvent): Pointer2D => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, id: e.pointerId };
    };

    this.canvas.addEventListener("pointerdown", (e) => {
      const p = sample(e);
      this._mouseX = p.x; this._mouseY = p.y; this._mousePressed = true;
      for (const fn of this.pointerDownFns) fn(p);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      const p = sample(e);
      this._mouseX = p.x; this._mouseY = p.y;
      for (const fn of this.pointerMoveFns) fn(p);
    });
    const onUp = (e: PointerEvent) => {
      const p = sample(e);
      this._mouseX = p.x; this._mouseY = p.y; this._mousePressed = false;
      for (const fn of this.pointerUpFns) fn(p);
    };
    this.canvas.addEventListener("pointerup", onUp);
    this.canvas.addEventListener("pointercancel", onUp);
  }

  // ── Sketch execution ──

  private runSketch() {
    this.buttons = [];
    this.logs = [];
    this.drawFn = null;
    this.animateFn = null;
    this.continuous = false;
    this.pointerDownFns = [];
    this.pointerMoveFns = [];
    this.pointerUpFns = [];
    this._onceSeq = 0;

    const usedParams = new Set<string>();
    const lab = this.buildLab(usedParams);

    // Param writes during the run (store.define / defaults) must not
    // re-trigger scheduleRerun via the onChange subscription.
    this._running = true;
    try { this.fn(lab); } catch (e) {
      console.error("Sketch2D error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }
    this._running = false;

    for (const key of this.store.keys()) {
      if (!usedParams.has(key)) {
        this.store.remove(key);
        this.items.delete(key);
      }
    }

    // Only rebuild panel DOM when param structure changes (not on value changes).
    // This preserves slider focus during drag.
    const fingerprint = [...this.items.keys()].sort().join("|")
      + "‖" + this.buttons.map(b => `${b.group}:${b.label}`).join("|");
    if (fingerprint !== this._prevFingerprint) {
      this._prevFingerprint = fingerprint;
      this.panel.render([...this.items.values()]);
    }
    // Logs pushed by the sketch BODY are the persistent baseline; logs pushed
    // inside draw()/animate() are per-frame and reset each frame (see loop).
    this._baseLogCount = this.logs.length;
    this.updateLog();
    this.redraw();
  }

  private redraw() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    if (w > 0 && h > 0 && this.drawFn) {
      this.ctx.save();
      this.drawFn(this.ctx, w, h);
      this.ctx.restore();
    }
  }

  private scheduleRerun() {
    if (this._running || this.rerunTimer) return;
    this.rerunTimer = requestAnimationFrame(() => {
      this.rerunTimer = 0;
      this.runSketch();
    });
  }

  private buildLab(usedParams: Set<string>): Lab2D {
    const self = this;

    function makeParam<T>(key: string, def: ParamDef, item: ControlItem): Reactive<T> {
      usedParams.add(key);
      if (!self.store.has(key)) {
        self.store.define(key, def);
        self.items.set(key, item);
      }
      return { get value() { return self.store.get(key); } };
    }

    return {
      slider(label, min, max, def, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `slider:${opts?.group ?? ""}:${label}`;
        return makeParam(key,
          { type: "float", min, max, default: def, step: opts?.step ?? (max - min) / 100, label },
          { key, group });
      },
      toggle(label, def = false, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `toggle:${opts?.group ?? ""}:${label}`;
        return makeParam(key, { type: "bool", default: def, label }, { key, group });
      },
      select(label, options, def, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `select:${opts?.group ?? ""}:${label}`;
        return makeParam(key,
          { type: "select", options, default: def ?? options[0], label },
          { key, group });
      },
      colorPicker(label, def = "#38d9a9", opts) {
        const group = opts?.group ?? "Display";
        const key = `color:${opts?.group ?? ""}:${label}`;
        return makeParam(key, { type: "color", default: def, label }, { key, group });
      },
      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions" });
      },

      draw(fn) { self.drawFn = fn; },
      animate(fn) { self.animateFn = fn; self.continuous = true; },
      once(fn) {
        const i = self._onceSeq++;
        if (!self._onceRan[i]) {
          self._onceRan[i] = true;
          fn();
        }
      },

      get canvas() { return self.canvas; },
      get ctx() { return self.ctx; },
      get width() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.width / dpr;
      },
      get height() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.height / dpr;
      },
      get dpr() { return Math.min(window.devicePixelRatio, 2); },

      log(label, value) {
        self.logs.push({ label, value: value != null ? String(value) : "" });
      },

      // Math
      vec2: (x, y) => new Vec2(x, y),
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      sin: Math.sin,
      cos: Math.cos,
      atan2: Math.atan2,
      abs: Math.abs,
      sqrt: Math.sqrt,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      lerp: MathUtils.lerp,
      clamp: MathUtils.clamp,
      noise(x, y?, z?) { return noise(x, y ?? 0, z ?? 0); },
      random(min?, max?) { return self.rng.random(min, max); },
      randomSeed(seed) { self.rng = createRandom(seed); },

      // Input
      get mouseX() { return self._mouseX; },
      get mouseY() { return self._mouseY; },
      get mousePressed() { return self._mousePressed; },
      onPointerDown(fn) { self.pointerDownFns.push(fn); },
      onPointerMove(fn) { self.pointerMoveFns.push(fn); },
      onPointerUp(fn) { self.pointerUpFns.push(fn); },
    };
  }

  private updateLog() {
    if (this.logs.length === 0) {
      this.logEl.style.display = "none";
      return;
    }
    this.logEl.style.display = "block";
    this.logEl.innerHTML = this.logs.map(l =>
      `<div style="display:flex;gap:8px;">` +
      `<span style="color:#4a5070">${l.label}</span>` +
      `<span style="color:#b8bdd4">${l.value}</span></div>`
    ).join('');
  }

  // ── Animation Loop ──

  private startLoop() {
    const loop = () => {
      if (this.disposed) return;
      if (this.continuous && this.animateFn) {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        // Drop last frame's draw()/animate() logs so per-frame lab.log calls
        // replace instead of accumulate (body-level logs stay).
        this.logs.length = this._baseLogCount;
        this.animateFn((now - this.startTime) / 1000, Math.min(dt, 1 / 15));
        this.redraw();
        this.updateLog();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /** Tear down the sketch */
  dispose() {
    this.disposed = true;
    this.panel.dispose();
    this.container.innerHTML = "";
  }
}
