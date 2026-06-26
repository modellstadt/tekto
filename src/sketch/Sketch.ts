/**
 * Tekto Sketch API
 *
 * The primary student-facing API. Write a single function,
 * get a full interactive 3D app with GUI, controls, and visualization.
 *
 * Design principles:
 *   1. ONE function = a working app
 *   2. ZERO framework knowledge required (no React, no JSX)
 *   3. Immediate-mode FEEL: lab.slider() both creates UI and returns a value
 *   4. Every call is chainable and readable
 *   5. Errors are friendly, not cryptic
 *
 * ─── Usage ───────────────────────────────────
 *
 *   import { sketch } from "tekto";
 *
 *   sketch((lab) => {
 *     const r = lab.slider("Radius", 0.1, 3, 1);
 *     const segs = lab.slider("Segments", 4, 48, 16, { step: 1 });
 *
 *     const sphere = lab.sphere(r.value, segs.value);
 *     sphere.color("#38d9a9").wireframe(true);
 *
 *     lab.button("Subdivide", () => sphere.subdivide());
 *     lab.button("Smooth", () => sphere.smooth(3));
 *
 *     lab.log("Volume", sphere.volume().toFixed(3));
 *   });
 *
 * ─── How it works ────────────────────────────
 *
 *   The sketch function is re-invoked every time a parameter changes.
 *   Like React's render or Processing's draw(), but triggered by UI.
 *   The framework diffs what changed and updates the 3D scene minimally.
 */

import * as THREE from "three";
import { Vec2, Vec3, MathUtils } from "../core/math/vectors";
import { ConnectedMesh as Mesh } from "../core/geometry/mesh/ConnectedMesh";
import { MeshFactory as MeshGen } from "../core/geometry/mesh/MeshFactory";
import { Algo } from "../core/algo/algorithms";
import { Scene, VisualStyle, FlatMeshData, RenderMode } from "../scene/Scene";
import { LayerPanel, LayerMap } from "../gui/LayerPanel";
import { ThreeRenderer } from "../render/ThreeRenderer";
import { noise } from "../core/math/noise";
import { createRandom, SeededRandom } from "../core/math/random";

// Public types live in `./SketchTypes` — re-exported here so the existing
// `import { Lab, SketchConfig, … } from "tekto/sketch/Sketch"` keeps working.
export type {
  Lab, SketchConfig, Reactive,
  SliderOpts, SelectOpts, ShapeMode,
  MeshHandle, PointHandle, LineHandle,
  ExportRegistration, ImportRegistration,
  LayerNode, LayerState, LayerMap,
} from "./SketchTypes";
import type {
  Lab, SketchConfig, ExportRegistration, ImportRegistration,
  MeshHandle, PointHandle, LineHandle, ShapeMode,
  Reactive,
} from "./SketchTypes";

// ═══════════════════════════════════════════════
// Implementation
// ═══════════════════════════════════════════════

type SketchFn = (lab: Lab) => void;

interface ParamState {
  key: string;
  type: "slider" | "toggle" | "select" | "color" | "layertree";
  label: string;
  group: string;
  tab: string;
  menu: string;
  value: any;
  config: any;
  /** Persistent LayerPanel instance (layertree only) — survives panel rebuilds */
  _layerPanel?: LayerPanel;
  /** Push a new value into this param's live DOM control (slider only) — set during render */
  _applyValue?: (v: number) => void;
}

interface LogEntry {
  label: string;
  value: string;
}

export function sketch(fn: SketchFn, config?: SketchConfig): SketchInstance {
  return new SketchInstance(fn, config ?? {});
}

export class SketchInstance {
  private fn: SketchFn;
  private config: SketchConfig;
  private container: HTMLElement;
  private scene: Scene;
  private renderer!: ThreeRenderer;

  // State
  private params: Map<string, ParamState> = new Map();
  private buttons: { label: string; action: () => void; group: string; tab: string; menu: string }[] = [];
  // Top-bar export / import handlers registered by the sketch. Survive
  // sketch re-runs (re-registering replaces the handler closure).
  exports = new Map<string, ExportRegistration>();
  imports = new Map<string, ImportRegistration>();
  // Listeners that the host shell (testbench / app frame) subscribes to so
  // it can refresh its Export/Import menus when the sketch registers items.
  private _exportListeners = new Set<() => void>();
  private _importListeners = new Set<() => void>();
  private logs: LogEntry[] = [];
  private infoText = "";
  private animateFn: ((time: number, dt: number) => void) | null = null;
  private frame = 0;
  private startTime = performance.now();
  private lastTime = performance.now();
  private disposed = false;

  // Accordion collapse state (persists across panel rebuilds)
  private collapsedGroups = new Set<string>();
  private activeTab = "";
  private activeMenu = "";

  // Random state (persists across sketch re-runs)
  private rng: SeededRandom = createRandom();

  // Input state
  private _mouseX = 0;
  private _mouseY = 0;
  private _pmouseX = 0;
  private _pmouseY = 0;
  private _mousePressed = false;
  private _key = "";
  private _keyPressed = false;

  // Input callbacks (set per sketch run)
  private _onMouseClicked: (() => void) | null = null;
  private _onMouseDragged: (() => void) | null = null;
  private _onKeyPressed: ((key: string) => void) | null = null;
  private _onKeyReleased: ((key: string) => void) | null = null;

  // Picking + gizmo state
  private _onPick: ((id: string | null) => void) | null = null;
  private _selectedId: string | null = null;
  private _pickEnabled = false;
  private _pickUnsub: (() => void) | null = null;

  // Drag handle state (persistent across runs)
  private _dragHandles = new Map<string, Vec3>();
  private _dragHandleSeq = 0;
  private _dragHandlesWired = false;
  private _onHandlePick: ((name: string | null) => void) | null = null;

  // Stored event handlers for cleanup
  private _boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private _boundKeyUp: ((e: KeyboardEvent) => void) | null = null;

  // beginShape state
  private _shapeVerts: Vec3[] = [];
  private _shapeMode: ShapeMode = "triangles";

  // Continuous re-run mode (set when lab.animate() is called)
  private _continuous = false;
  // Retain mode: animate runs per-frame but sketch only re-runs on param changes
  private _retain = false;

  // DOM
  private panelEl!: HTMLElement;
  private viewportEl!: HTMLElement;
  private logEl!: HTMLElement;
  private separatorCount = 0;
  private _prevParamFingerprint = "";
  private _panelLogEl: HTMLElement | null = null;
  private _panelInfoEl: HTMLElement | null = null;
  private _lastRerunTime = 0;
  private _rerunTimer = 0;

  constructor(fn: SketchFn, config: SketchConfig) {
    this.fn = fn;
    this.config = config;
    this.scene = new Scene();

    // Resolve container
    if (typeof config.container === "string") {
      this.container = document.querySelector(config.container) as HTMLElement;
    } else if (config.container) {
      this.container = config.container;
    } else {
      this.container = document.body;
    }

    this.buildDOM();
    this.initRenderer();
    this.wireInput();
    this.runSketch();
    this.startLoop();
  }

  // ── DOM Construction ──

  private buildDOM() {
    const defaultWidth = this.config.panelWidth ?? 320;
    const storageKey = `tekto.panelWidth.${this.config.title ?? "default"}`;
    const stored = parseInt(localStorage.getItem(storageKey) ?? "", 10);
    const panelWidth = Number.isFinite(stored) && stored >= 200 && stored <= 800 ? stored : defaultWidth;
    const isDark = this.config.theme !== "light";
    // Default the internal header off when the container is tagged by a
    // shell (`<div data-shell="testbench">…</div>`) — the shell's top bar
    // already shows the page title, so the sketch's own 44 px title bar
    // would be redundant. Sketches can still force-show with
    // `{ showHeader: true }`.
    const inShell = this.container instanceof HTMLElement && this.container.dataset.shell != null;
    const showHeader = this.config.showHeader ?? !inShell;
    const headerRow = showHeader ? "44px " : "";

    // Root
    const root = document.createElement("div");
    root.style.cssText = `
      display:grid; grid-template-columns:${panelWidth}px 1fr; grid-template-rows:${headerRow}1fr;
      height:100%; width:100%; overflow:hidden; position:relative;
      background:${isDark ? "#07080e" : "#f4f5f8"};
      color:${isDark ? "#b8bdd4" : "#2a2d3a"};
      font-family:'IBM Plex Mono',ui-monospace,monospace;
    `;

    // Header (the sketch's own title bar; suppressed when host shell
    // already shows a top bar).
    if (showHeader) {
      const header = document.createElement("div");
      header.style.cssText = `
        grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
        background:${isDark ? "#0c0d16" : "#fff"};
        border-bottom:1px solid ${isDark ? "#16182a" : "#e0e2ea"};
      `;
      header.innerHTML = `
        <span style="font-weight:600;font-size:14px;color:#38d9a9">
          &#x2B21; ${this.config.title ?? "Tekto Sketch"}
        </span>
        <span style="font-size:9px;padding:2px 6px;border-radius:3px;
          background:rgba(56,217,169,.1);color:#38d9a9">LIVE</span>
      `;
      root.appendChild(header);
    }

    // Panel
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      overflow-y:auto; overflow-x:hidden; padding:0;
      background:${isDark ? "#0c0d16" : "#fff"};
      border-right:1px solid ${isDark ? "#16182a" : "#e0e2ea"};
      position:relative;
    `;
    root.appendChild(this.panelEl);

    // Resize handle (vertical bar on the panel's right edge).
    const resizeHandle = document.createElement("div");
    resizeHandle.title = "Drag to resize panel · double-click to reset";
    const handleIdle   = isDark ? "rgba(56,217,169,.18)" : "rgba(56,217,169,.28)";
    const handleHover  = isDark ? "rgba(56,217,169,.45)" : "rgba(56,217,169,.55)";
    resizeHandle.style.cssText = `
      position:absolute; top:${showHeader ? 44 : 0}px; bottom:0;
      left:${panelWidth - 3}px; width:6px;
      cursor:col-resize; z-index:10;
      background:${handleIdle};
      transition:background .15s;
    `;
    resizeHandle.addEventListener("mouseenter", () => { resizeHandle.style.background = handleHover; });
    resizeHandle.addEventListener("mouseleave", () => { resizeHandle.style.background = handleIdle; });
    resizeHandle.addEventListener("dblclick", () => applyWidth(defaultWidth));
    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = parseInt(root.style.gridTemplateColumns, 10) || panelWidth;
      const onMove = (ev: MouseEvent) => {
        const next = Math.max(200, Math.min(800, startWidth + (ev.clientX - startX)));
        applyWidth(next);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
      };
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    root.appendChild(resizeHandle);

    let curWidth = panelWidth;
    const applyWidth = (w: number) => {
      curWidth = w;
      root.style.gridTemplateColumns = `${w}px 1fr`;
      resizeHandle.style.left = `${w - 3}px`;
      collapseBtn.style.left = `${w - 26}px`;
      localStorage.setItem(storageKey, String(w));
    };

    // Collapse / expand the panel to reclaim the full canvas width.
    const collapseKey = `tekto.panelCollapsed.${this.config.title ?? "default"}`;
    const btnCss = (left: number) => `
      position:absolute; top:${(showHeader ? 44 : 0) + 6}px; left:${left}px;
      width:20px; height:24px; z-index:11; cursor:pointer; user-select:none;
      display:flex; align-items:center; justify-content:center;
      font:13px/1 ui-monospace,monospace;
      border:1px solid ${isDark ? "#23263a" : "#d4d7e0"}; border-radius:4px;
      background:${isDark ? "#0c0d16" : "#fff"}; color:#38d9a9;
    `;
    const collapseBtn = document.createElement("div");
    collapseBtn.title = "Collapse panel";
    collapseBtn.textContent = "‹";   // ‹
    collapseBtn.style.cssText = btnCss(panelWidth - 26);
    root.appendChild(collapseBtn);
    const expandBtn = document.createElement("div");
    expandBtn.title = "Show panel";
    expandBtn.textContent = "›";      // ›
    expandBtn.style.cssText = btnCss(6);
    expandBtn.style.display = "none";
    root.appendChild(expandBtn);

    const applyCollapsed = (c: boolean) => {
      root.style.gridTemplateColumns = c ? "0px 1fr" : `${curWidth}px 1fr`;
      this.panelEl.style.display = c ? "none" : "";
      resizeHandle.style.display = c ? "none" : "";
      collapseBtn.style.display = c ? "none" : "flex";
      collapseBtn.style.left = `${curWidth - 26}px`;
      expandBtn.style.display = c ? "flex" : "none";
      localStorage.setItem(collapseKey, c ? "1" : "0");
    };
    collapseBtn.addEventListener("click", () => applyCollapsed(true));
    expandBtn.addEventListener("click", () => applyCollapsed(false));
    if (localStorage.getItem(collapseKey) === "1") applyCollapsed(true);

    // Viewport container (holds 3D canvas + log overlay)
    const vpWrap = document.createElement("div");
    vpWrap.style.cssText = "position:relative;overflow:hidden;";

    this.viewportEl = document.createElement("div");
    this.viewportEl.style.cssText = "width:100%;height:100%;";
    vpWrap.appendChild(this.viewportEl);

    // Log overlay
    this.logEl = document.createElement("div");
    this.logEl.style.cssText = `
      position:absolute; bottom:12px; left:12px;
      padding:8px 12px; border-radius:6px;
      background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
      font-size:11px; line-height:1.7; color:#7a80a0;
      pointer-events:none; max-width:300px;
      border:1px solid rgba(22,24,42,.8);
      display:none;
    `;
    vpWrap.appendChild(this.logEl);

    root.appendChild(vpWrap);

    // Mount
    if (this.container === document.body) {
      this.container.style.margin = "0";
      this.container.style.height = "100vh";
      this.container.style.overflow = "hidden";
    }
    this.container.appendChild(root);
  }

  private initRenderer() {
    const zUp = this.config.up === "z";
    this.renderer = new ThreeRenderer(this.scene, this.viewportEl, {
      backgroundColor: this.config.background ?? 0x07080e,
      showGrid: this.config.grid !== false,
      showAxes: this.config.axes !== false,
      cameraPosition: this.config.camera ?? (zUp ? [8, -10, 6] : [5, 6, 8]),
      cameraTarget: this.config.target ?? [0, 0, 0],
      up: this.config.up ?? "y",
    });
  }

  // ── Input Wiring ──

  private wireInput() {
    const canvas = this.renderer.renderer.domElement;

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this._pmouseX = this._mouseX;
      this._pmouseY = this._mouseY;
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
      if (this._mousePressed && this._onMouseDragged) {
        this._onMouseDragged();
      }
    });

    canvas.addEventListener("mousedown", () => {
      this._mousePressed = true;
      if (this._onMouseClicked) this._onMouseClicked();
    });

    canvas.addEventListener("mouseup", () => {
      this._mousePressed = false;
    });

    this._boundKeyDown = (e: KeyboardEvent) => {
      this._key = e.key;
      this._keyPressed = true;
      if (this._onKeyPressed) this._onKeyPressed(e.key);
    };
    this._boundKeyUp = (e: KeyboardEvent) => {
      this._key = e.key;
      this._keyPressed = false;
      if (this._onKeyReleased) this._onKeyReleased(e.key);
    };
    window.addEventListener("keydown", this._boundKeyDown);
    window.addEventListener("keyup", this._boundKeyUp);
  }

  // ── Picking + gizmo ──

  enablePicking(enabled: boolean): void {
    if (enabled === this._pickEnabled) return;
    this._pickEnabled = enabled;
    this.renderer.setPickEnabled(enabled);
    if (enabled) {
      this._pickUnsub = this.renderer.onPick((id) => {
        this.setSelected(id);
        if (this._onPick) this._onPick(id);
        // Re-run the sketch so user code can read the new selection.
        this.runSketch();
      });
    } else {
      this._pickUnsub?.();
      this._pickUnsub = null;
      this.setSelected(null);
    }
  }

  setGizmoMode(mode: "translate" | "rotate" | "scale" | "none"): void {
    this.renderer.setGizmoMode(mode);
  }

  setSelected(id: string | null): void {
    this._selectedId = id;
    this.renderer.setSelectionHighlight(id);
    if (id) this.renderer.attachGizmo(id);
    else    this.renderer.detachGizmo();
    this.scene.clearSelection();
    if (id) this.scene.select(id);
  }

  /** Create or update a drag handle for this sketch run; returns a Reactive<Vec3>. */
  registerDragHandle(
    initX: number, initY: number, initZ: number,
    opts?: {
      name?: string; color?: string; size?: number;
      constrain?: (x: number, y: number, z: number) => [number, number, number];
      plane?: "ground" | "screen";
    },
  ): Reactive<Vec3> {
    if (!this._dragHandlesWired) {
      this.renderer.setPickEnabled(true);
      this.renderer.setDragHandleCallbacks(
        (name, x, y, z) => {
          this._dragHandles.set(name, new Vec3(x, y, z));
          this.runSketch();
        },
        undefined,
        (name) => {
          if (this._onHandlePick) this._onHandlePick(name);
          // Re-run the sketch so user code can read the new selectedHandle
          // (click-without-drag doesn't trigger the move callback).
          this.runSketch();
        },
      );
      this._dragHandlesWired = true;
    }
    const name = opts?.name ?? `handle_${this._dragHandleSeq++}`;
    if (!this._dragHandles.has(name)) {
      this._dragHandles.set(name, new Vec3(initX, initY, initZ));
    }
    let cur = this._dragHandles.get(name)!;
    // Re-apply the constraint to the stored value so handles that snap to a
    // curve track the curve when it changes shape (e.g. opening positions
    // re-projecting onto a wall whose corners just moved).
    if (opts?.constrain) {
      const [cx, cy, cz] = opts.constrain(cur.x, cur.y, cur.z);
      if (cx !== cur.x || cy !== cur.y || cz !== cur.z) {
        cur = new Vec3(cx, cy, cz);
        this._dragHandles.set(name, cur);
      }
    }
    this.renderer.upsertDragHandle(name, cur.x, cur.y, cur.z, opts?.color, opts?.size, opts?.constrain, opts?.plane);
    return { value: cur };
  }

  setHandleSelected(name: string | null): void {
    this.renderer.setHandleSelected(name);
  }
  get selectedHandle(): string | null { return this.renderer.getSelectedHandle(); }
  get activeDragHandle(): string | null { return this.renderer.getActiveDragHandle(); }

  /** Programmatically set a slider's value — updates the stored param AND its live DOM control. */
  setSlider(label: string, value: number, group = ""): void {
    const p = this.params.get(`slider:${group}:${label}`);
    if (!p || p.type !== "slider") return;
    const v = Math.min(p.config.max, Math.max(p.config.min, value));
    p.value = v;
    p._applyValue?.(v);
  }

  // ── Run Sketch ──

  private runSketch() {
    // Clear scene but preserve params
    this.scene.clear();
    this.buttons = [];
    this.logs = [];
    this.infoText = "";
    this.animateFn = null;
    this._continuous = false;
    this._retain = false;
    this.separatorCount = 0;

    // Clear per-run callbacks
    this._onMouseClicked = null;
    this._onMouseDragged = null;
    this._onKeyPressed = null;
    this._onKeyReleased = null;
    this._onPick = null;
    this._onHandlePick = null;

    // Reset drag-handle declaration order; mark all currently-known handles
    // as "unseen" so any that aren't re-declared this run get removed.
    this._dragHandleSeq = 0;
    this.renderer.beginDragHandleSweep();

    // Track which params are used this run
    const usedParams = new Set<string>();

    // Build the Lab context
    const lab = this.buildLab(usedParams);

    // Execute
    try {
      this.fn(lab);
    } catch (e) {
      console.error("Tekto sketch error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }

    // Sweep out any drag handles that weren't re-declared this run.
    this.renderer.endDragHandleSweep();

    // Remove unused params
    for (const key of this.params.keys()) {
      if (!usedParams.has(key)) this.params.delete(key);
    }

    // Only rebuild panel DOM when the param set structure changes
    // (params added/removed), not on value-only changes.
    // This prevents destroying slider focus during drag.
    const fingerprint = [...this.params.values()].map(p => `${p.key}@${p.tab}`).sort().join("|");
    if (fingerprint !== this._prevParamFingerprint) {
      this._prevParamFingerprint = fingerprint;
      this.rebuildPanel();
    }
    this.updateLog();
  }

  private buildLab(usedParams: Set<string>): Lab {
    const self = this;
    const now = performance.now();

    const lab: Lab = {
      // ── GUI Controls ──

      slider(label, min, max, defaultValue, opts) {
        const key = `slider:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key, type: "slider", label,
            group: opts?.group ?? "Parameters", tab: opts?.tab ?? "", menu: opts?.menu ?? "",
            value: defaultValue,
            config: { min, max, step: opts?.step ?? (max - min) / 100, color: opts?.color },
          });
        }
        const p = self.params.get(key)!;
        return { get value() { return p.value; } };
      },

      setSlider(label, value, opts) {
        self.setSlider(label, value, opts?.group ?? "");
      },

      toggle(label, defaultValue = false, opts) {
        const key = `toggle:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key, type: "toggle", label,
            group: opts?.group ?? "Parameters", tab: opts?.tab ?? "", menu: opts?.menu ?? "",
            value: defaultValue,
            config: {},
          });
        }
        const p = self.params.get(key)!;
        return { get value() { return p.value; } };
      },

      select(label, options, defaultValue, opts) {
        const key = `select:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key, type: "select", label,
            group: opts?.group ?? "Parameters", tab: opts?.tab ?? "", menu: opts?.menu ?? "",
            value: defaultValue ?? options[0],
            config: { options },
          });
        }
        const p = self.params.get(key)!;
        return { get value() { return p.value; } };
      },

      colorPicker(label, defaultValue = "#38d9a9", opts) {
        const key = `color:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key, type: "color", label,
            group: opts?.group ?? "Display", tab: opts?.tab ?? "", menu: opts?.menu ?? "",
            value: defaultValue,
            config: {},
          });
        }
        const p = self.params.get(key)!;
        return { get value() { return p.value; } };
      },

      layerTree(label, nodes, opts) {
        const key = `layertree:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key, type: "layertree", label,
            group: opts?.group ?? "Layers", tab: opts?.tab ?? "", menu: "",
            value: {} as LayerMap,
            config: { nodes },
          });
        } else {
          // Update nodes in case they changed (e.g. async mesh load)
          self.params.get(key)!.config.nodes = nodes;
        }
        const p = self.params.get(key)!;
        return { get value() { return p.value as LayerMap; } };
      },

      // ── Actions ──

      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions", tab: opts?.tab ?? "", menu: opts?.menu ?? "" });
      },

      separator() {
        self.separatorCount++;
      },

      registerExport(opts) {
        self.exports.set(opts.name, { ...opts });
        for (const l of self._exportListeners) l();
      },

      registerImport(opts) {
        self.imports.set(opts.name, { ...opts });
        for (const l of self._importListeners) l();
      },

      // ── Geometry Builders ──

      mesh(m, style) {
        return self.addMeshHandle(m, style);
      },

      flatMesh(data, style) {
        return self.addFlatMeshHandle(data, style);
      },

      sphere(r = 1, seg = 24, rings = 16) {
        return self.addMeshHandle(MeshGen.sphere(r, seg, rings));
      },

      box(w = 1, h = 1, d = 1) {
        return self.addMeshHandle(MeshGen.box(w, h, d));
      },

      torus(R = 1, r = 0.3, seg = 32, sides = 16) {
        return self.addMeshHandle(MeshGen.torus(R, r, seg, sides));
      },

      cylinder(rt = 1, rb = 1, h = 2, seg = 24) {
        return self.addMeshHandle(MeshGen.cylinder(rt, rb, h, seg));
      },

      grid(w = 10, d = 10, dx = 24, dz = 24, hfn) {
        return self.addMeshHandle(MeshGen.grid(w, d, dx, dz, hfn));
      },

      revolve(profile, seg = 32) {
        return self.addMeshHandle(MeshGen.revolve(profile, seg));
      },

      extrude(polygon, direction) {
        return self.addMeshHandle(MeshGen.extrude(polygon, direction));
      },

      point(x, y, z) {
        return self.addPointHandle(new Vec3(x, y, z));
      },

      points(positions) {
        return positions.map(p => self.addPointHandle(p));
      },

      line(x1, y1, z1, x2, y2, z2) {
        return self.addLineHandle(new Vec3(x1, y1, z1), new Vec3(x2, y2, z2));
      },

      polyline(points) {
        return self.addPolylineHandle(points);
      },

      polygon(vertices, style) {
        return self.scene.addPolygon(vertices, style).id;
      },

      circle(cx, cy, cz, radius) {
        return self.scene.addCircle(new Vec3(cx, cy, cz), radius).id;
      },

      // ── Algorithms ──
      algo: Algo,
      MeshGen,

      // ── Scene Control ──
      clear() { self.scene.clear(); },
      background(c: number) { self.renderer.threeScene.background = new THREE.Color(c); },
      camera(x, y, z) { self.renderer.camera.position.set(x, y, z); },
      lookAt(x, y, z) {
        self.renderer.camera.lookAt(x, y, z);
        if (self.renderer.controls) {
          self.renderer.controls.target.set(x, y, z);
          self.renderer.controls.update();
        }
      },
      fitAll() { self.renderer.fitAll(); },
      setProjection(type) { self.renderer.setProjection(type); },
      cameraUp(x, y, z) { self.renderer.setCameraUp(x, y, z); },

      // ── Info ──
      log(label, value) {
        self.logs.push({ label, value: value != null ? String(value) : "" });
      },
      info(text) {
        self.infoText = text;
      },

      setSunDirection(direction, distance) {
        self.renderer.setSunDirection(direction, distance);
      },

      // ── Math constructors ──
      vec2: (x, y) => new Vec2(x, y),
      vec3: (x, y, z) => new Vec3(x, y, z),

      // ── Processing Constants ──
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      HALF_PI: Math.PI / 2,
      TAU: Math.PI * 2,
      QUARTER_PI: Math.PI / 4,

      // ── Math Helpers ──
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      atan2: Math.atan2,
      abs: Math.abs,
      sqrt: Math.sqrt,
      pow: Math.pow,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      lerp: MathUtils.lerp,
      map: MathUtils.remap,
      constrain: MathUtils.clamp,
      dist(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      },
      rad(degrees) { return degrees * MathUtils.DEG2RAD; },
      deg(radians) { return radians * MathUtils.RAD2DEG; },

      // ── Noise & Random ──
      noise(x: number, y?: number, z?: number) {
        return noise(x, y ?? 0, z ?? 0);
      },
      random(min?: number, max?: number) {
        return self.rng.random(min, max);
      },
      randomSeed(seed: number) {
        self.rng.randomSeed(seed);
      },

      // ── Color Utility ──
      rgb(r: number, g?: number, b?: number): string {
        if (g === undefined) {
          // Grayscale: rgb(128) → "#808080"
          const v = Math.round(MathUtils.clamp(r, 0, 255));
          return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
        }
        const rr = Math.round(MathUtils.clamp(r, 0, 255));
        const gg = Math.round(MathUtils.clamp(g, 0, 255));
        const bb = Math.round(MathUtils.clamp(b ?? 0, 0, 255));
        return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
      },

      // ── Mouse & Keyboard Input ──
      get mouseX() { return self._mouseX; },
      get mouseY() { return self._mouseY; },
      get pmouseX() { return self._pmouseX; },
      get pmouseY() { return self._pmouseY; },
      get mousePressed() { return self._mousePressed; },
      get key() { return self._key; },
      get keyPressed() { return self._keyPressed; },

      onMouseClicked(fn) { self._onMouseClicked = fn; },
      onMouseDragged(fn) { self._onMouseDragged = fn; },
      onKeyPressed(fn) { self._onKeyPressed = fn; },
      onKeyReleased(fn) { self._onKeyReleased = fn; },

      // ── Viewport / overlays ──
      get viewport() { return self.viewportEl; },
      worldToScreen(x, y, z) { return self.renderer.worldToScreen(new Vec3(x, y, z)); },
      invalidate() { self.runSketch(); },

      // ── Picking + transform gizmo ──
      enablePicking(enabled = true) { self.enablePicking(enabled); },
      onPick(fn) { self._onPick = fn; },
      setGizmoMode(mode) { self.setGizmoMode(mode); },
      setSelected(id) { self.setSelected(id); },
      get selectedId() { return self._selectedId; },

      // ── Drag handles ──
      dragHandle(x, y, z, opts) { return self.registerDragHandle(x, y, z, opts); },
      onHandlePick(fn) { self._onHandlePick = fn; },
      setHandleSelected(name) { self.setHandleSelected(name); },
      get selectedHandle() { return self.selectedHandle; },
      get activeDragHandle() { return self.activeDragHandle; },

      // ── beginShape/endShape ──
      beginShape(mode: ShapeMode = "triangles") {
        self._shapeVerts = [];
        self._shapeMode = mode;
      },

      vertex(x: number, y: number, z: number) {
        self._shapeVerts.push(new Vec3(x, y, z));
      },

      hQuad(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number, z: number) {
        const v = self._shapeVerts;
        v.push(new Vec3(ax, ay, z), new Vec3(bx, by, z), new Vec3(cx, cy, z), new Vec3(dx, dy, z));
      },

      vQuad(ax: number, ay: number, bx: number, by: number, zTop: number, zBot: number) {
        const v = self._shapeVerts;
        v.push(new Vec3(ax, ay, zTop), new Vec3(bx, by, zTop), new Vec3(bx, by, zBot), new Vec3(ax, ay, zBot));
      },

      endShape(close = false): MeshHandle | LineHandle | null {
        const verts = self._shapeVerts;
        if (verts.length < 2) return null;

        const mode = self._shapeMode;

        if (mode === "lines" || mode === "line_strip") {
          // Create line segments, return compound handle that applies to all
          const handles: LineHandle[] = [];

          if (mode === "lines") {
            for (let i = 0; i + 1 < verts.length; i += 2) {
              handles.push(self.addLineHandle(verts[i], verts[i + 1]));
            }
          } else {
            // line_strip
            for (let i = 0; i < verts.length - 1; i++) {
              handles.push(self.addLineHandle(verts[i], verts[i + 1]));
            }
            if (close && verts.length >= 3) {
              handles.push(self.addLineHandle(verts[verts.length - 1], verts[0]));
            }
          }

          self._shapeVerts = [];
          if (handles.length === 0) return null;

          const compound: LineHandle = {
            get id() { return handles[0].id; },
            color(c) { for (const h of handles) h.color(c); return compound; },
            opacity(o) { for (const h of handles) h.opacity(o); return compound; },
            radius(r) { for (const h of handles) h.radius(r); return compound; },
            layer(name) { for (const h of handles) h.layer(name); return compound; },
          };
          return compound;
        }

        // Build a Mesh from vertices
        const mesh = new Mesh();
        const nodeIds = verts.map(v => mesh.addNode(v));

        if (mode === "triangles") {
          for (let i = 0; i + 2 < nodeIds.length; i += 3) {
            mesh.addTriangle(nodeIds[i], nodeIds[i + 1], nodeIds[i + 2]);
          }
        } else if (mode === "quads") {
          for (let i = 0; i + 3 < nodeIds.length; i += 4) {
            mesh.addQuad(nodeIds[i], nodeIds[i + 1], nodeIds[i + 2], nodeIds[i + 3]);
          }
        }

        mesh.computeVertexNormals();
        self._shapeVerts = [];
        return self.addMeshHandle(mesh);
      },

      // ── Time ──
      get frame() { return self.frame; },
      get time() { return (now - self.startTime) / 1000; },
      get dt() { return (now - self.lastTime) / 1000; },

      // ── Animation ──
      animate(fn, opts) {
        self.animateFn = fn;
        self._continuous = true;
        if (opts?.retain) self._retain = true;
      },

      // ── Scene Access ──
      getScene() { return self.scene; },
    };

    return lab;
  }

  // ── Handle Factories ──

  private addMeshHandle(mesh: Mesh, style?: Partial<VisualStyle>): MeshHandle {
    const obj = this.scene.addMesh(mesh, style);
    const self = this;

    const handle: MeshHandle = {
      get id() { return obj.id; },
      get mesh() { return mesh; },

      color(c) { self.scene.setStyle(obj.id, { color: c }); return handle; },
      opacity(o) { self.scene.setStyle(obj.id, { opacity: o }); return handle; },
      wireframe(w = true) { self.scene.setStyle(obj.id, { wireframe: w }); return handle; },
      visible(v = true) { self.scene.setStyle(obj.id, { visible: v }); return handle; },
      label(l) { self.scene.setStyle(obj.id, { label: l }); return handle; },
      doubleSided(d = true) { self.scene.setStyle(obj.id, { doubleSided: d }); return handle; },
      backfaceColor(c) { self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c }); return handle; },
      groupColor(_name, _color) { return handle; },
      noExport(v = true) { self.scene.setStyle(obj.id, { noExport: v }); return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },

      translate(x, y, z) {
        for (const n of mesh.nodes()) {
          (n as any).position = n.position.add(new Vec3(x, y, z));
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },

      scale(s) {
        for (const n of mesh.nodes()) {
          (n as any).position = n.position.mul(s);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },

      rotateX(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        for (const n of mesh.nodes()) {
          const p = n.position;
          (n as any).position = new Vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },

      rotateY(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        for (const n of mesh.nodes()) {
          const p = n.position;
          (n as any).position = new Vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },

      rotateZ(rad) {
        const c = Math.cos(rad), s = Math.sin(rad);
        for (const n of mesh.nodes()) {
          const p = n.position;
          (n as any).position = new Vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },

      subdivide(iterations = 1) {
        let m = mesh;
        for (let i = 0; i < iterations; i++) m = MeshGen.subdivide(m);
        self.scene.remove(obj.id);
        return self.addMeshHandle(m, obj.style);
      },

      smooth(iterations = 1, factor = 0.5) {
        Algo.laplacianSmooth(mesh, iterations, factor);
        self.scene.update(obj.id, { mesh });
        return handle;
      },

      volume() { return Algo.meshVolume(mesh); },
      surfaceArea() { return Algo.meshSurfaceArea(mesh); },
      nodeCount() { return mesh.nodeCount; },
      faceCount() { return mesh.faceCount; },
      edgeCount() { return mesh.edgeCount; },
    };

    return handle;
  }

  private addFlatMeshHandle(data: FlatMeshData, style?: Partial<VisualStyle>): MeshHandle {
    const obj = this.scene.addFlatMesh(data, style);
    const self = this;

    // FlatMeshHandle supports style changes but not geometry transforms
    const handle: MeshHandle = {
      get id() { return obj.id; },
      get mesh() { return null as any; }, // no ConnectedMesh backing
      color(c) { self.scene.setStyle(obj.id, { color: c }); return handle; },
      opacity(o) { self.scene.setStyle(obj.id, { opacity: o }); return handle; },
      wireframe(w = true) { self.scene.setStyle(obj.id, { wireframe: w }); return handle; },
      visible(v = true) { self.scene.setStyle(obj.id, { visible: v }); return handle; },
      label(l) { self.scene.setStyle(obj.id, { label: l }); return handle; },
      doubleSided(d = true) { self.scene.setStyle(obj.id, { doubleSided: d }); return handle; },
      backfaceColor(c) { self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c }); return handle; },
      groupColor(name, color) {
        const existing = self.scene.get(obj.id)?.style.groupColors ?? {};
        self.scene.setStyle(obj.id, { groupColors: { ...existing, [name]: color } });
        return handle;
      },
      noExport(v = true) { self.scene.setStyle(obj.id, { noExport: v }); return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },
      translate() { return handle; },
      scale() { return handle; },
      rotateX() { return handle; },
      rotateY() { return handle; },
      rotateZ() { return handle; },
      subdivide() { return handle; },
      smooth() { return handle; },
      volume() { return 0; },
      surfaceArea() { return 0; },
      nodeCount() { return data.positions.length / 3; },
      faceCount() { return data.indices.length / 3; },
      edgeCount() { return 0; },
    };
    return handle;
  }

  private addPointHandle(pos: Vec3): PointHandle {
    const obj = this.scene.addPoint(pos);
    const self = this;

    const handle: PointHandle = {
      get id() { return obj.id; },
      color(c) { self.scene.setStyle(obj.id, { color: c }); return handle; },
      size(s) { self.scene.setStyle(obj.id, { pointSize: s }); return handle; },
      label(l) { self.scene.setStyle(obj.id, { label: l }); return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },
      moveTo(x, y, z) { self.scene.update(obj.id, { position: new Vec3(x, y, z) }); return handle; },
      position() { return self.scene.get(obj.id)?.position ?? pos; },
    };
    return handle;
  }

  private addLineHandle(a: Vec3, b: Vec3): LineHandle {
    const obj = this.scene.addSegment(a, b);
    const self = this;

    const handle: LineHandle = {
      get id() { return obj.id; },
      color(c) { self.scene.setStyle(obj.id, { color: c }); return handle; },
      opacity(o) { self.scene.setStyle(obj.id, { opacity: o }); return handle; },
      radius(r) { self.scene.setStyle(obj.id, { tubeRadius: r }); return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },
    };
    return handle;
  }

  private addPolylineHandle(points: Vec3[]): LineHandle {
    const obj = this.scene.addPolyline(points);
    const self = this;

    const handle: LineHandle = {
      get id() { return obj.id; },
      color(c) { self.scene.setStyle(obj.id, { color: c }); return handle; },
      opacity(o) { self.scene.setStyle(obj.id, { opacity: o }); return handle; },
      // tubeRadius has no effect on the buffered Line — kept for API parity.
      radius(_r) { return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },
    };
    return handle;
  }

  // ── Panel Rendering ──

  private rebuildPanel() {
    this._panelLogEl = null; // will be re-created below
    this._panelInfoEl = null;
    const isDark = this.config.theme !== "light";
    const border = isDark ? "#16182a" : "#e0e2ea";
    const dimColor = isDark ? "#5a6080" : "#8a8fa0";
    const textColor = isDark ? "#7a80a0" : "#4a4f60";
    const accentColor = "#ffffff";
    const hoverBg = "rgba(56,217,169,.08)";

    this.panelEl.innerHTML = "";

    // ── Collect menus (params and buttons that have menu set) ──
    const menuNames: string[] = [];
    const menuParams = new Map<string, ParamState[]>();
    const menuButtons = new Map<string, typeof this.buttons>();
    for (const p of this.params.values()) {
      if (!p.menu) continue;
      if (!menuNames.includes(p.menu)) menuNames.push(p.menu);
      if (!menuParams.has(p.menu)) menuParams.set(p.menu, []);
      menuParams.get(p.menu)!.push(p);
    }
    for (const b of this.buttons) {
      if (!b.menu) continue;
      if (!menuNames.includes(b.menu)) menuNames.push(b.menu);
      if (!menuButtons.has(b.menu)) menuButtons.set(b.menu, []);
      menuButtons.get(b.menu)!.push(b);
    }

    // ── Collect tabs ──
    const tabOrder: string[] = [];
    for (const p of this.params.values()) {
      if (p.tab && !tabOrder.includes(p.tab)) tabOrder.push(p.tab);
    }
    for (const b of this.buttons) {
      if (b.tab && !tabOrder.includes(b.tab)) tabOrder.push(b.tab);
    }
    // Auto-add Info tab when tabs exist and logs are non-empty
    if (tabOrder.length > 0 && this.logs.length > 0 && !tabOrder.includes("Info")) {
      tabOrder.push("Info");
    }
    const hasTabs = tabOrder.length > 1;
    if (hasTabs && (!this.activeTab || !tabOrder.includes(this.activeTab))) {
      this.activeTab = tabOrder[0];
    }

    // ── Menu bar ──
    if (menuNames.length > 0) {
      const menuBar = document.createElement("div");
      menuBar.style.cssText = `
        display:flex;border-bottom:1px solid ${border};flex-shrink:0;position:relative;
      `;

      for (const menuName of menuNames) {
        const menuBtn = document.createElement("button");
        menuBtn.textContent = menuName + " \u25BE";
        menuBtn.style.cssText = `
          padding:8px 10px;border:none;background:transparent;
          color:${dimColor};font-family:inherit;font-size:9px;font-weight:500;
          text-transform:uppercase;letter-spacing:1.2px;cursor:pointer;transition:color .12s;
        `;
        menuBtn.addEventListener("mouseenter", () => { menuBtn.style.color = accentColor; });
        menuBtn.addEventListener("mouseleave", () => { menuBtn.style.color = this.activeMenu === menuName ? accentColor : dimColor; });

        // Dropdown panel
        const dropdown = document.createElement("div");
        dropdown.style.cssText = `
          display:none;position:absolute;top:100%;left:0;z-index:100;
          min-width:160px;background:${isDark ? "#0d0f1e" : "#f5f6fa"};
          border:1px solid ${border};border-radius:4px;padding:4px 0;
          box-shadow:0 4px 16px rgba(0,0,0,.4);
        `;

        // Populate dropdown items
        const params = menuParams.get(menuName) ?? [];
        const btns   = menuButtons.get(menuName) ?? [];

        for (const p of params) {
          if (p.type === "toggle") {
            const row = document.createElement("div");
            row.style.cssText = `
              display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;
              font-size:11px;color:${textColor};transition:background .1s;
            `;
            const check = document.createElement("span");
            check.textContent = p.value ? "\u2713" : " ";
            check.style.cssText = `width:12px;text-align:center;color:${accentColor};font-size:10px;`;
            const lbl = document.createElement("span");
            lbl.textContent = p.label;
            row.appendChild(check); row.appendChild(lbl);
            row.addEventListener("mouseenter", () => { row.style.background = hoverBg; });
            row.addEventListener("mouseleave", () => { row.style.background = "transparent"; });
            row.addEventListener("click", (e) => {
              e.stopPropagation();
              p.value = !p.value;
              check.textContent = p.value ? "\u2713" : " ";
              this.runSketch();
            });
            dropdown.appendChild(row);
          }
        }
        // Separator between params and buttons if both exist
        if (params.length > 0 && btns.length > 0) {
          const sep = document.createElement("div");
          sep.style.cssText = `border-top:1px solid ${border};margin:4px 0;`;
          dropdown.appendChild(sep);
        }
        for (const b of btns) {
          const row = document.createElement("div");
          row.style.cssText = `
            padding:7px 12px;cursor:pointer;font-size:11px;
            color:${textColor};transition:background .1s;
          `;
          row.textContent = b.label;
          row.addEventListener("mouseenter", () => { row.style.background = hoverBg; row.style.color = accentColor; });
          row.addEventListener("mouseleave", () => { row.style.background = "transparent"; row.style.color = textColor; });
          // Capture label+menu so the handler looks up the CURRENT action from
          // this.buttons at click time. The panel DOM is not rebuilt on every sketch
          // re-run (fingerprint optimisation), so closing over `b.action` directly
          // would capture a stale closure after a layer toggle or param change.
          const btnLabel = b.label, btnMenu = b.menu;
          row.addEventListener("click", () => {
            this.activeMenu = "";
            dropdown.style.display = "none";
            const current = this.buttons.find(cb => cb.label === btnLabel && cb.menu === btnMenu);
            current?.action();
            this.runSketch();
          });
          dropdown.appendChild(row);
        }

        menuBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isOpen = this.activeMenu === menuName;
          // Close all dropdowns first
          menuBar.querySelectorAll<HTMLElement>(".menu-dropdown").forEach(d => { d.style.display = "none"; });
          this.activeMenu = isOpen ? "" : menuName;
          if (!isOpen) dropdown.style.display = "block";
          menuBtn.style.color = isOpen ? dimColor : accentColor;
        });

        dropdown.classList.add("menu-dropdown");
        menuBar.appendChild(menuBtn);
        menuBar.appendChild(dropdown);
      }

      // Click outside closes menus
      document.addEventListener("click", () => {
        this.activeMenu = "";
        menuBar.querySelectorAll<HTMLElement>(".menu-dropdown").forEach(d => { d.style.display = "none"; });
      }, { once: false, capture: false });

      this.panelEl.appendChild(menuBar);
    }

    // ── Tab bar ──
    if (hasTabs) {
      const tabBar = document.createElement("div");
      tabBar.style.cssText = `display:flex;border-bottom:1px solid ${border};flex-shrink:0;`;
      for (const tab of tabOrder) {
        const btn = document.createElement("button");
        btn.textContent = tab;
        const isActive = tab === this.activeTab;
        btn.style.cssText = `
          flex:1;padding:9px 4px;border:none;
          border-bottom:2px solid ${isActive ? accentColor : "transparent"};
          background:transparent;color:${isActive ? accentColor : dimColor};
          font-family:inherit;font-size:9px;font-weight:500;text-transform:uppercase;
          letter-spacing:1.2px;cursor:pointer;transition:all .12s;
        `;
        btn.addEventListener("click", () => {
          this.activeTab = tab;
          this.rebuildPanel();
        });
        tabBar.appendChild(btn);
      }
      this.panelEl.appendChild(tabBar);
    }

    // ── Info tab content (logs) — persistent container ──
    if (hasTabs && this.activeTab === "Info") {
      this._panelLogEl = document.createElement("div");
      this._panelLogEl.style.cssText = `padding:12px 14px;font-size:11px;color:${textColor};line-height:1.9;`;
      this.panelEl.appendChild(this._panelLogEl);
      this.updateLog();
      return; // Info tab has no accordion groups
    }

    // ── Filter params/buttons to active tab ──
    const activeTabFilter = (tab: string, menu: string) => menu === "" && (!hasTabs || tab === this.activeTab || tab === "");

    const groups = new Map<string, ParamState[]>();
    for (const p of this.params.values()) {
      if (!activeTabFilter(p.tab, p.menu)) continue;
      if (!groups.has(p.group)) groups.set(p.group, []);
      groups.get(p.group)!.push(p);
    }
    const buttonGroups = new Map<string, typeof this.buttons>();
    for (const b of this.buttons) {
      if (!activeTabFilter(b.tab, b.menu)) continue;
      if (!buttonGroups.has(b.group)) buttonGroups.set(b.group, []);
      buttonGroups.get(b.group)!.push(b);
    }

    const allGroupNames = new Set([...groups.keys(), ...buttonGroups.keys()]);

    for (const groupName of allGroupNames) {
      const section = document.createElement("div");
      section.style.cssText = `border-bottom:1px solid ${border};`;
      const collapsed = this.collapsedGroups.has(groupName);

      const header = document.createElement("div");
      header.style.cssText = `
        padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:6px;
        user-select:none;transition:background .1s;
      `;
      header.addEventListener("mouseenter", () => { header.style.background = "rgba(56,217,169,.04)"; });
      header.addEventListener("mouseleave", () => { header.style.background = "transparent"; });

      const arrow = document.createElement("span");
      arrow.style.cssText = `font-size:8px;color:${dimColor};transition:transform .15s;width:10px;`;
      arrow.textContent = collapsed ? "\u25B6" : "\u25BC";
      header.appendChild(arrow);

      const title = document.createElement("span");
      title.style.cssText = `font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:1.8px;color:${dimColor};`;
      title.textContent = groupName;
      header.appendChild(title);

      section.appendChild(header);

      const content = document.createElement("div");
      content.style.cssText = `padding:0 14px 10px;${collapsed ? "display:none;" : ""}`;

      const params = groups.get(groupName) ?? [];
      for (const p of params) content.appendChild(this.renderParam(p, isDark));

      const btns = buttonGroups.get(groupName) ?? [];
      for (const b of btns) {
        const row = document.createElement("div");
        row.style.cssText = "margin-bottom:4px;";
        const btn = document.createElement("button");
        btn.textContent = b.label;
        btn.style.cssText = `
          width:100%;padding:7px 10px;border:1px solid ${border};border-radius:5px;
          background:transparent;color:${textColor};font-family:inherit;font-size:10px;
          cursor:pointer;transition:all .12s;
        `;
        btn.addEventListener("mouseenter", () => { btn.style.background = hoverBg; btn.style.borderColor = accentColor; btn.style.color = accentColor; });
        btn.addEventListener("mouseleave", () => { btn.style.background = "transparent"; btn.style.borderColor = border; btn.style.color = textColor; });
        btn.addEventListener("click", () => { b.action(); this.runSketch(); });
        row.appendChild(btn);
        content.appendChild(row);
      }

      section.appendChild(content);

      header.addEventListener("click", () => {
        if (this.collapsedGroups.has(groupName)) {
          this.collapsedGroups.delete(groupName);
          content.style.display = "";
          arrow.textContent = "\u25BC";
        } else {
          this.collapsedGroups.add(groupName);
          content.style.display = "none";
          arrow.textContent = "\u25B6";
        }
      });

      this.panelEl.appendChild(section);
    }

    // Info section (plain text, shown when not in tabs mode).
    // Always create the node so updateLog() can refresh it in place on
    // value-only re-runs (which skip rebuildPanel).
    {
      const section = document.createElement("div");
      section.style.cssText = `padding:12px 14px;border-bottom:1px solid ${border};font-size:11px;color:${textColor};line-height:1.7;white-space:pre-wrap;`;
      section.textContent = this.infoText;
      section.style.display = this.infoText ? "block" : "none";
      this.panelEl.appendChild(section);
      this._panelInfoEl = section;
    }

    // Logs at bottom — persistent container, updated in-place by updateLog()
    if (!hasTabs) {
      this._panelLogEl = document.createElement("div");
      this._panelLogEl.style.cssText = `padding:10px 14px;border-bottom:1px solid ${border};display:none;`;
      this.panelEl.appendChild(this._panelLogEl);
    }
  }

  private renderParam(p: ParamState, isDark: boolean): HTMLElement {
    // LayerTree — full-width component, no standard label row
    if (p.type === "layertree") {
      if (!p._layerPanel) {
        p._layerPanel = new LayerPanel({
          nodes: p.config.nodes,
          value: p.value,
          isDark,
          onChange: (updates) => {
            p.value = { ...p.value, ...updates };
            this.runSketch();
          },
        });
      } else {
        p._layerPanel.update(p.config.nodes, p.value);
      }
      // Re-attach the persistent element (was detached by innerHTML="")
      const wrap = document.createElement("div");
      wrap.style.cssText = "margin:0 -14px;"; // bleed past group content padding
      wrap.appendChild(p._layerPanel.el);
      return wrap;
    }

    const border = isDark ? "#1e2140" : "#d0d3de";
    const dimColor = isDark ? "#7a80a0" : "#6a6f80";
    const accentColor = "#ffffff";

    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:5px;min-height:26px;";

    const label = document.createElement("span");
    label.style.cssText = `width:80px;flex-shrink:0;font-size:11px;color:${dimColor};text-transform:capitalize;`;
    label.textContent = p.label;
    row.appendChild(label);

    switch (p.type) {
      case "slider": {
        const input = document.createElement("input");
        input.type = "range";
        input.min = String(p.config.min);
        input.max = String(p.config.max);
        input.step = String(p.config.step);
        input.value = String(p.value);
        input.style.cssText = `
          flex:1;height:3px;-webkit-appearance:none;appearance:none;
          background:${border};border-radius:2px;outline:none;cursor:pointer;
          accent-color:${p.config.color || accentColor};
        `;

        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `width:42px;text-align:right;font-size:10px;color:${accentColor};`;
        const isInt = p.config.step >= 1;
        const rawDec = isInt ? 0 : Math.max(2, -Math.floor(Math.log10(p.config.step) - 0.001));
        const decimals = Math.min(Math.max(0, rawDec), 20);
        const fmt = (v: number) => isInt ? String(v) : v.toFixed(decimals);
        valueSpan.textContent = fmt(p.value);

        input.addEventListener("input", () => {
          const v = parseFloat(input.value);
          p.value = v;
          valueSpan.textContent = fmt(v);
          this.scheduleRerun();
        });
        input.addEventListener("change", () => {
          // Ensure final value is applied immediately when drag ends
          if (this._rerunTimer) { clearTimeout(this._rerunTimer); this._rerunTimer = 0; }
          this.runSketch();
        });
        // Let setSlider() push a value into this live control programmatically.
        p._applyValue = (v: number) => { input.value = String(v); valueSpan.textContent = fmt(v); };

        row.appendChild(input);
        row.appendChild(valueSpan);
        break;
      }

      case "toggle": {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = p.value;
        input.style.cssText = `accent-color:${accentColor};cursor:pointer;width:14px;height:14px;`;
        input.addEventListener("change", () => {
          p.value = input.checked;
          this.runSketch();
        });
        row.appendChild(input);
        break;
      }

      case "select": {
        const select = document.createElement("select");
        select.style.cssText = `
          flex:1;padding:4px 8px;background:${isDark ? "#07080e" : "#f4f5f8"};
          border:1px solid ${border};border-radius:4px;color:inherit;
          font-family:inherit;font-size:11px;outline:none;cursor:pointer;
        `;
        for (const opt of p.config.options) {
          const el = document.createElement("option");
          el.value = opt;
          el.textContent = opt;
          if (opt === p.value) el.selected = true;
          select.appendChild(el);
        }
        select.addEventListener("change", () => {
          p.value = select.value;
          this.runSketch();
        });
        row.appendChild(select);
        break;
      }

      case "color": {
        const input = document.createElement("input");
        input.type = "color";
        input.value = p.value;
        input.style.cssText = `width:32px;height:24px;border:1px solid ${border};border-radius:4px;padding:0;cursor:pointer;background:none;`;
        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `font-size:10px;color:${dimColor};`;
        valueSpan.textContent = p.value;
        input.addEventListener("input", () => {
          p.value = input.value;
          valueSpan.textContent = input.value;
          this.runSketch();
        });
        row.appendChild(input);
        row.appendChild(valueSpan);
        break;
      }
    }

    return row;
  }

  // ── Log Display ──

  private updateLog() {
    // Update the viewport overlay
    if (this.logs.length > 0) {
      this.logEl.innerHTML = this.logs
        .map(l => `<span style="color:#5a5e7a">${l.label}</span>${l.value ? ` <span style="color:#fff">${l.value}</span>` : ""}`)
        .join("<br>");
      this.logEl.style.display = "block";
    } else {
      this.logEl.style.display = "none";
    }

    // Update the panel info section (in-place, no rebuild)
    if (this._panelInfoEl) {
      this._panelInfoEl.textContent = this.infoText;
      this._panelInfoEl.style.display = this.infoText ? "block" : "none";
    }

    // Update the panel log section (in-place, no rebuild)
    if (this._panelLogEl) {
      if (this.logs.length > 0) {
        this._panelLogEl.innerHTML = this.logs
          .map(l => `<div style="font-size:10px;line-height:1.7;"><span style="color:#7a80a0">${l.label}</span>${l.value ? ` <span style="color:#fff">${l.value}</span>` : ""}</div>`)
          .join("");
        this._panelLogEl.style.display = "block";
      } else {
        this._panelLogEl.style.display = "none";
      }
    }
  }

  // ── Render Loop ──

  private startLoop() {
    const loop = () => {
      if (this.disposed) return;
      this.frame++;
      const now = performance.now();
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      // In continuous mode, re-run the sketch each frame so
      // lab.time-dependent code animates — unless retain mode is on,
      // in which case only the animate callback runs per-frame.
      if (this._continuous && !this._retain) {
        this.runSketch();
      }

      if (this.animateFn) {
        this.animateFn((now - this.startTime) / 1000, dt);
      }

      this.renderer.render();
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ── Public Methods ──

  /** Throttled sketch re-run — at most once per 50ms so the browser stays responsive during slider drag. */
  private scheduleRerun() {
    if (this._rerunTimer) return;
    const elapsed = performance.now() - this._lastRerunTime;
    const delay = Math.max(0, 50 - elapsed);
    this._rerunTimer = window.setTimeout(() => {
      this._rerunTimer = 0;
      this._lastRerunTime = performance.now();
      this.runSketch();
    }, delay);
  }

  /** Force re-run the sketch */
  rerun() {
    this.runSketch();
  }

  /** Change the scene render mode (solid / wireframe / hiddenline). */
  setRenderMode(mode: RenderMode) {
    this.scene.setRenderMode(mode);
  }

  /**
   * Switch shading preset. `"studio"` enables PBR materials, sun-style
   * shadows, and ACES tonemapping; `"flat"` is the lightweight default.
   * See `LightingMode` in `src/scene/Scene.ts` for the trade-offs.
   */
  setLightingMode(mode: import("../scene/Scene").LightingMode) {
    this.scene.setLightingMode(mode);
  }

  /**
   * Toggle a procedural environment map for image-based reflections. Only
   * visibly affects `"studio"` PBR materials (it modulates their specular
   * highlights / reflections); harmless in `"flat"` mode.
   */
  setEnvironment(enabled: boolean) {
    this.scene.setEnvironment(enabled);
  }

  /**
   * Studio-mode default PBR material for meshes that don't set their own
   * metalness/roughness in their VisualStyle. metalness 0..1 (1 = metal),
   * roughness 0..1 (0 = mirror). Applies on the next sketch re-run.
   */
  setStudioMaterial(metalness: number, roughness: number, color: string | null = null, flatShading = false) {
    this.renderer.setStudioMaterial(metalness, roughness, color, flatShading);
  }

  /**
   * Aim the main directional light from outside the sketch fn — used
   * by host shells (testbench, custom apps) to push a sun position
   * computed from their own date/location UI. Inside a sketch, prefer
   * `lab.setSunDirection(direction)`.
   */
  setSunDirection(direction: Vec3, distance?: number) {
    this.renderer.setSunDirection(direction, distance);
  }

  /**
   * Read the sketch's registered export entries (via `lab.registerExport`).
   * Returns a fresh snapshot — safe to iterate without holding a reference
   * to the underlying Map.
   */
  getExports(): ExportRegistration[] { return Array.from(this.exports.values()); }
  getImports(): ImportRegistration[] { return Array.from(this.imports.values()); }

  /**
   * Subscribe to export/import registration changes. The shell (testbench
   * top bar, app frame) uses this to re-render its menus when the sketch
   * adds or replaces entries between re-runs.
   */
  onExportsChange(fn: () => void): () => void {
    this._exportListeners.add(fn);
    return () => this._exportListeners.delete(fn);
  }
  onImportsChange(fn: () => void): () => void {
    this._importListeners.add(fn);
    return () => this._importListeners.delete(fn);
  }

  /** Destroy the sketch and clean up */
  dispose() {
    this.disposed = true;
    if (this._boundKeyDown) window.removeEventListener("keydown", this._boundKeyDown);
    if (this._boundKeyUp) window.removeEventListener("keyup", this._boundKeyUp);
    this._boundKeyDown = null;
    this._boundKeyUp = null;
    this.renderer.dispose();
  }
}
