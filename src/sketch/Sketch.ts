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

import { Vec2, Vec3, MathUtils } from "../core/math/vectors";
import { ConnectedMesh as Mesh } from "../core/geometry/mesh/ConnectedMesh";
import { MeshFactory as MeshGen } from "../core/geometry/mesh/MeshFactory";
import { Algo } from "../core/algo/algorithms";
import { Scene, VisualStyle, FlatMeshData, RenderMode } from "../scene/Scene";
import { LayerPanel, LayerMap, LayerNode } from "../gui/LayerPanel";
import { ParamStore } from "../gui/Params";
import { ControlPanel, ControlItem, PanelButton, CustomRow, ExtraTab } from "../gui/ControlPanel";
import { getTheme, Theme } from "../gui/theme";
import { ThreeRenderer } from "../render/ThreeRenderer";
import { noise } from "../core/math/noise";
import { createRandom, SeededRandom } from "../core/math/random";

// Public types live in `./SketchTypes` — re-exported here so the existing
// `import { Lab, SketchConfig, … } from "tekto/sketch/Sketch"` keeps working.
export type {
  Lab, SketchConfig, Reactive,
  SliderOpts, SelectOpts, ShapeMode,
  MeshHandle, PointHandle, LineHandle, ShapeHandle,
  ExportRegistration, ImportRegistration,
  LayerNode, LayerState, LayerMap,
} from "./SketchTypes";
import type {
  Lab, SketchConfig, ExportRegistration, ImportRegistration,
  MeshHandle, PointHandle, LineHandle, ShapeHandle, ShapeMode,
  Reactive, DragSpace, HandleSetOpts,
} from "./SketchTypes";

// ═══════════════════════════════════════════════
// Implementation
// ═══════════════════════════════════════════════

type SketchFn = (lab: Lab) => void;

/** Convert a DragSpace into a constrain(x,y,z)→[x,y,z] projection for registerDragHandle. */
function spaceToConstrain(space: DragSpace): ((x: number, y: number, z: number) => [number, number, number]) | undefined {
  switch (space.kind) {
    case "free":
    case "ground":
      return undefined;                                   // free = unconstrained; ground = renderer default
    case "plane": {
      const o = space.origin, n = space.normal;
      const nl = Math.hypot(n.x, n.y, n.z) || 1;
      const nx = n.x / nl, ny = n.y / nl, nz = n.z / nl;
      return (x, y, z) => {                                // project onto the plane
        const d = (x - o.x) * nx + (y - o.y) * ny + (z - o.z) * nz;
        return [x - nx * d, y - ny * d, z - nz * d];
      };
    }
    case "axis": {
      const o = space.origin, dir = space.dir;
      const dl2 = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z || 1;
      return (x, y, z) => {                                // project onto the line
        const t = ((x - o.x) * dir.x + (y - o.y) * dir.y + (z - o.z) * dir.z) / dl2;
        return [o.x + dir.x * t, o.y + dir.y * t, o.z + dir.z * t];
      };
    }
    case "curve": {
      const m = space.samples ?? 64;
      const pts: Vec3[] = [];
      for (let i = 0; i <= m; i++) pts.push(space.at(i / m));
      return (x, y, z) => {                                // snap to the closest sample on the curve
        let bx = pts[0].x, by = pts[0].y, bz = pts[0].z, bestD = Infinity;
        for (const p of pts) {
          const d = (p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2;
          if (d < bestD) { bestD = d; bx = p.x; by = p.y; bz = p.z; }
        }
        return [bx, by, bz];
      };
    }
  }
}

/** Persistent per-sketch layer-tree state — lives outside the ParamStore
 *  because its value is a structured LayerMap edited by a LayerPanel, not a
 *  scalar control. */
interface LayerTreeState {
  key: string;
  value: LayerMap;
  nodes: LayerNode[];
  panel: LayerPanel;
  group: string;
  tab: string;
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

  // Param model: values live in the shared ParamStore, panel placement in
  // `items`, and the DOM is rendered by the shared ControlPanel (src/gui/).
  private store: ParamStore = new ParamStore({});
  private panel!: ControlPanel;
  private items = new Map<string, ControlItem>();
  private layerTrees = new Map<string, LayerTreeState>();
  private theme!: Theme;
  private buttons: PanelButton[] = [];
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

  // Re-run suppression: `_running` while the sketch fn executes (param
  // declarations must not schedule re-runs), `_squelch` during programmatic
  // setSlider (updates the control but does not re-run — original semantics).
  private _running = false;
  private _squelch = false;
  private _hasTabs = false;
  private _onceRan: boolean[] = [];
  private _onceSeq = 0;

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
  private _onPick: ((id: string | null, pick?: { tag?: string; layer?: string }) => void) | null = null;
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
  /** Log container inside the "Info" tab (tab mode only; set during render) */
  private _panelLogEl: HTMLElement | null = null;
  /** Info-text section in the panel footer */
  private _panelInfoEl: HTMLElement | null = null;
  /** Log section in the panel footer (non-tab mode) */
  private _panelFooterLogEl: HTMLElement | null = null;
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
    const t = this.theme = getTheme(this.config.theme);
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
      background:${t.bg};
      color:${t.text};
      font-family:${t.font};
    `;

    // Header (the sketch's own title bar; suppressed when host shell
    // already shows a top bar). White chrome — see CLAUDE.md "GUI defaults".
    if (showHeader) {
      const header = document.createElement("div");
      header.style.cssText = `
        grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
        background:${t.panelBg};
        border-bottom:1px solid ${t.border};
      `;
      header.innerHTML = `
        <span style="font-weight:600;font-size:14px;color:${t.accent}">
          &#x2B21; ${this.config.title ?? "Tekto Sketch"}
        </span>
        <span style="font-size:9px;padding:2px 6px;border-radius:3px;
          background:${t.hoverBg};color:${t.accent}">LIVE</span>
      `;
      root.appendChild(header);
    }

    // Panel
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      overflow-y:auto; overflow-x:hidden; padding:0;
      background:${t.panelBg};
      border-right:1px solid ${t.border};
      position:relative;
    `;
    root.appendChild(this.panelEl);

    // Shared control renderer — values live in this.store; panelRender()
    // feeds it the current control structure after each sketch run.
    this.panel = new ControlPanel({
      store: this.store,
      theme: t,
      getButtons: () => this.buttons,
      onCommit: () => this.commitRun(),
      onAction: () => this.runSketch(),
    });
    this.panelEl.appendChild(this.panel.el);
    this.store.onChange(() => {
      if (!this._running && !this._squelch) this.scheduleRerun();
    });
    // Footer: info text + logs (non-tab mode), updated in place by updateLog()
    this._panelInfoEl = document.createElement("div");
    this._panelInfoEl.style.cssText = `padding:12px 14px;border-bottom:1px solid ${t.border};font-size:11px;color:${t.textDim};line-height:1.7;white-space:pre-wrap;display:none;`;
    this._panelFooterLogEl = document.createElement("div");
    this._panelFooterLogEl.style.cssText = `padding:10px 14px;border-bottom:1px solid ${t.border};display:none;`;
    this.panel.footer.append(this._panelInfoEl, this._panelFooterLogEl);

    // Resize handle (vertical bar on the panel's right edge).
    const resizeHandle = document.createElement("div");
    resizeHandle.title = "Drag to resize panel · double-click to reset";
    const handleIdle   = t.isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.14)";
    const handleHover  = t.isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.30)";
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
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };

    // Collapse / expand the panel to reclaim the full canvas width.
    const collapseKey = `tekto.panelCollapsed.${this.config.title ?? "default"}`;
    const btnCss = (left: number) => `
      position:absolute; top:${(showHeader ? 44 : 0) + 6}px; left:${left}px;
      width:20px; height:24px; z-index:11; cursor:pointer; user-select:none;
      display:flex; align-items:center; justify-content:center;
      font:13px/1 ui-monospace,monospace;
      border:1px solid ${t.controlBorder}; border-radius:4px;
      background:${t.panelBg}; color:${t.accent};
    `;
    const collapseBtn = document.createElement("div");
    collapseBtn.title = "Collapse panel";
    collapseBtn.textContent = "‹";   // ‹
    collapseBtn.style.cssText = btnCss(panelWidth - 26);
    root.appendChild(collapseBtn);
    const expandBtn = document.createElement("div");
    expandBtn.title = "Show panel";
    expandBtn.textContent = "›";      // ›
    expandBtn.style.cssText = btnCss(4);   // sits on the collapsed 28px rail
    expandBtn.style.display = "none";
    root.appendChild(expandBtn);

    const applyCollapsed = (c: boolean) => {
      // Collapsed = a slim RAIL (not 0px): the expand chevron stays visible in a stable spot and the
      // canvas reclaims the rest. An explicit resize nudge follows the reflow — the renderer's
      // ResizeObserver usually catches it, but a forced event makes the canvas resize deterministic.
      root.style.gridTemplateColumns = c ? "28px 1fr" : `${curWidth}px 1fr`;
      this.panelEl.style.display = c ? "none" : "";
      resizeHandle.style.display = c ? "none" : "";
      collapseBtn.style.display = c ? "none" : "flex";
      collapseBtn.style.left = `${curWidth - 26}px`;
      expandBtn.style.display = c ? "flex" : "none";
      localStorage.setItem(collapseKey, c ? "1" : "0");
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
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
    const canvas = this.renderer.canvasEl;

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
        if (this._onPick) {
          const o = id ? this.scene.get(id) : null;
          this._onPick(id, o ? { tag: o.pickTag, layer: o.style.layer } : undefined);
        }
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
    const key = `slider:${group}:${label}`;
    if (!this.store.has(key)) return;
    // The store clamps to min/max; the ControlPanel's store subscription
    // pushes the value into the live DOM control. Squelched so a
    // programmatic set doesn't schedule a re-run (original semantics).
    this._squelch = true;
    this.store.set(key, value);
    this._squelch = false;
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
    this._onceSeq = 0;

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

    // Execute. Param declarations during the run must not schedule re-runs.
    this._running = true;
    try {
      this.fn(lab);
    } catch (e) {
      console.error("Tekto sketch error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }
    this._running = false;

    // Sweep out any drag handles that weren't re-declared this run.
    this.renderer.endDragHandleSweep();

    // Remove unused params + layer trees
    for (const key of this.store.keys()) {
      if (!usedParams.has(key)) {
        this.store.remove(key);
        this.items.delete(key);
      }
    }
    for (const key of this.layerTrees.keys()) {
      if (!usedParams.has(key)) this.layerTrees.delete(key);
    }

    // Only rebuild panel DOM when the control structure changes
    // (params/buttons added/removed), not on value-only changes.
    // This prevents destroying slider focus during drag.
    const hasTabControls =
      [...this.items.values()].some(it => it.tab) ||
      this.buttons.some(b => b.tab) ||
      [...this.layerTrees.values()].some(lt => lt.tab);
    const hasInfoTab = hasTabControls && this.logs.length > 0;
    const fingerprint = [
      ...[...this.items.values()].map(it => `${it.key}@${it.tab ?? ""}`).sort(),
      ...this.buttons.map(b => `btn:${b.menu ?? ""}:${b.group ?? ""}:${b.label}@${b.tab ?? ""}`),
      ...[...this.layerTrees.keys()].sort(),
      hasInfoTab ? "tab:Info" : "",
    ].join("|");
    if (fingerprint !== this._prevParamFingerprint) {
      this._prevParamFingerprint = fingerprint;
      this.panelRender(hasInfoTab);
    }
    this.updateLog();
  }

  /** Feed the current control structure to the shared ControlPanel. */
  private panelRender(hasInfoTab: boolean) {
    const t = this.theme;
    this._panelLogEl = null; // re-created by the Info tab renderer below

    const customRows: CustomRow[] = [...this.layerTrees.values()].map(lt => ({
      key: lt.key,
      el: lt.panel.el,
      group: lt.group,
      tab: lt.tab || undefined,
      fullBleed: true,
    }));

    const extraTabs: ExtraTab[] = hasInfoTab
      ? [{
          name: "Info",
          render: (container) => {
            this._panelLogEl = container;
            container.style.cssText = `padding:12px 14px;font-size:11px;color:${t.textDim};line-height:1.9;`;
            this.updateLog();
          },
        }]
      : [];

    this._hasTabs =
      new Set([
        ...[...this.items.values()].map(it => it.tab).filter(Boolean),
        ...this.buttons.map(b => b.tab).filter(Boolean),
        ...(hasInfoTab ? ["Info"] : []),
      ]).size > 1 || hasInfoTab;

    this.panel.render([...this.items.values()], customRows, extraTabs);
  }

  private buildLab(usedParams: Set<string>): Lab {
    const self = this;
    const now = performance.now();

    // Immediate-mode param declaration: define in the store on first sight,
    // remember panel placement, return a live view onto the store value.
    const declare = <T>(
      key: string,
      def: import("../gui/Params").ParamDef,
      item: ControlItem,
    ): Reactive<T> => {
      usedParams.add(key);
      if (!this.store.has(key)) {
        this.store.define(key, def);
        this.items.set(key, item);
      }
      const store = this.store;
      return { get value() { return store.get(key); } };
    };

    const lab: Lab = {
      // ── GUI Controls ──

      slider(label, min, max, defaultValue, opts) {
        const key = `slider:${opts?.group ?? ""}:${label}`;
        return declare(key,
          { type: "float", min, max, default: defaultValue, step: opts?.step ?? (max - min) / 100, label },
          { key, group: opts?.group ?? "Parameters", tab: opts?.tab, menu: opts?.menu, accent: opts?.color });
      },

      setSlider(label, value, opts) {
        self.setSlider(label, value, opts?.group ?? "");
      },

      toggle(label, defaultValue = false, opts) {
        const key = `toggle:${opts?.group ?? ""}:${label}`;
        return declare(key,
          { type: "bool", default: defaultValue, label },
          { key, group: opts?.group ?? "Parameters", tab: opts?.tab, menu: opts?.menu });
      },

      select(label, options, defaultValue, opts) {
        const key = `select:${opts?.group ?? ""}:${label}`;
        return declare(key,
          { type: "select", options, default: defaultValue ?? options[0], label },
          { key, group: opts?.group ?? "Parameters", tab: opts?.tab, menu: opts?.menu });
      },

      colorPicker(label, defaultValue = "#38d9a9", opts) {
        const key = `color:${opts?.group ?? ""}:${label}`;
        return declare(key,
          { type: "color", default: defaultValue, label },
          { key, group: opts?.group ?? "Display", tab: opts?.tab, menu: opts?.menu });
      },

      layerTree(label, nodes, opts) {
        const key = `layertree:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        let lt = self.layerTrees.get(key);
        if (!lt) {
          const state = {
            key,
            value: {} as LayerMap,
            nodes,
            group: opts?.group ?? "Layers",
            tab: opts?.tab ?? "",
          } as LayerTreeState;
          state.panel = new LayerPanel({
            nodes,
            value: {},
            isDark: self.theme.isDark,
            onChange: (updates) => {
              state.value = { ...state.value, ...updates };
              state.panel.update(state.nodes, state.value);
              self.runSketch();
            },
          });
          lt = state;
          self.layerTrees.set(key, state);
        } else {
          // Nodes may change between runs (e.g. async mesh load)
          lt.nodes = nodes;
          lt.panel.update(nodes, lt.value);
        }
        const state = lt;
        return { get value() { return state.value; } };
      },

      // ── Actions ──

      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions", tab: opts?.tab, menu: opts?.menu });
      },

      once(fn) {
        const i = self._onceSeq++;
        if (!self._onceRan[i]) {
          self._onceRan[i] = true;
          fn();
        }
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
        return self.addShapeHandle(self.scene.addPolygon(vertices, style));
      },

      circle(cx, cy, cz, radius) {
        return self.addShapeHandle(self.scene.addCircle(new Vec3(cx, cy, cz), radius));
      },

      // ── Algorithms ──
      algo: Algo,
      MeshGen,

      // ── Scene Control ──
      clear() { self.scene.clear(); },
      background(c: number) { self.renderer.setBackground(c); },
      camera(x, y, z) { self.renderer.setCameraPosition(x, y, z); },
      lookAt(x, y, z) { self.renderer.lookAt(x, y, z); },
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
      setOrbitRotateEnabled(enabled) { self.renderer.setOrbitRotateEnabled(enabled); },
      onPick(fn) { self._onPick = fn; },
      setGizmoMode(mode) { self.setGizmoMode(mode); },
      setSelected(id) { self.setSelected(id); },
      get selectedId() { return self._selectedId; },

      // ── Drag handles ──
      dragHandle(x, y, z, opts) { return self.registerDragHandle(x, y, z, opts); },
      handles<T>(items: T[], opts: HandleSetOpts<T>) {
        const active = self.renderer.getActiveDragHandle();
        items.forEach((item, i) => {
          const name = opts.key(item, i);
          const m = opts.position(item, i);
          // Model = source of truth: re-seed the stored handle to the model each run,
          // except the one being actively dragged (whose moved value we read below).
          if (name !== active) self._dragHandles.set(name, m);
          const constrain = opts.space ? spaceToConstrain(opts.space(item, i)) : undefined;
          const v = self.registerDragHandle(m.x, m.y, m.z, { name, color: opts.color, size: opts.size, constrain });
          if (v.value.distTo(m) > 1e-6) opts.onDrag(item, v.value, i);
        });
      },
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
            dashed(size, gap) { for (const h of handles) h.dashed(size, gap); return compound; },
            pickTag(tag) { for (const h of handles) h.pickTag(tag); return compound; },
            pickable(p = true) { for (const h of handles) h.pickable(p); return compound; },
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
      labelScale(s) { self.scene.setStyle(obj.id, { labelScale: s }); return handle; },
      doubleSided(d = true) { self.scene.setStyle(obj.id, { doubleSided: d }); return handle; },
      backfaceColor(c) { self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c }); return handle; },
      groupColor(_name, _color) { return handle; },
      noExport(v = true) { self.scene.setStyle(obj.id, { noExport: v }); return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },
      printLayers(heightM) { self.scene.setStyle(obj.id, { printLayerH: heightM }); return handle; },

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
      labelScale(s) { self.scene.setStyle(obj.id, { labelScale: s }); return handle; },
      doubleSided(d = true) { self.scene.setStyle(obj.id, { doubleSided: d }); return handle; },
      backfaceColor(c) { self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c }); return handle; },
      groupColor(name, color) {
        const existing = self.scene.get(obj.id)?.style.groupColors ?? {};
        self.scene.setStyle(obj.id, { groupColors: { ...existing, [name]: color } });
        return handle;
      },
      noExport(v = true) { self.scene.setStyle(obj.id, { noExport: v }); return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },
      printLayers(heightM) { self.scene.setStyle(obj.id, { printLayerH: heightM }); return handle; },
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
      labelScale(s) { self.scene.setStyle(obj.id, { labelScale: s }); return handle; },
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
      dashed(size, gap) { self.scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } }); return handle; },
      pickTag(tag) { self.scene.update(obj.id, { pickTag: tag }); return handle; },
      pickable(p = true) { self.scene.update(obj.id, { pickable: p }); return handle; },
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
      dashed(size, gap) { self.scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } }); return handle; },
      pickTag(tag) { self.scene.update(obj.id, { pickTag: tag }); return handle; },
      pickable(p = true) { self.scene.update(obj.id, { pickable: p }); return handle; },
    };
    return handle;
  }

  private addShapeHandle(obj: import("../scene/Scene").SceneObject): ShapeHandle {
    const self = this;
    const handle: ShapeHandle = {
      get id() { return obj.id; },
      color(c) { self.scene.setStyle(obj.id, { color: c }); return handle; },
      opacity(o) { self.scene.setStyle(obj.id, { opacity: o }); return handle; },
      visible(v = true) { self.scene.setStyle(obj.id, { visible: v }); return handle; },
      label(l) { self.scene.setStyle(obj.id, { label: l }); return handle; },
      layer(name) { self.scene.setStyle(obj.id, { layer: name }); return handle; },
    };
    return handle;
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

    // Update the panel log section in-place: the Info tab container when
    // tabs are active, the footer section otherwise.
    const logHtml = this.logs
      .map(l => `<div style="font-size:10px;line-height:1.7;"><span style="color:${this.theme.textDim}">${l.label}</span>${l.value ? ` <span style="color:${this.theme.accent}">${l.value}</span>` : ""}</div>`)
      .join("");
    if (this._hasTabs) {
      if (this._panelFooterLogEl) this._panelFooterLogEl.style.display = "none";
      if (this._panelLogEl) this._panelLogEl.innerHTML = logHtml;
    } else if (this._panelFooterLogEl) {
      this._panelFooterLogEl.innerHTML = logHtml;
      this._panelFooterLogEl.style.display = this.logs.length > 0 ? "block" : "none";
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

  /** Immediate re-run on control commit (slider drag-end, toggle, select) —
   *  cancels any pending throttled re-run so the final value applies now. */
  private commitRun() {
    if (this._rerunTimer) { clearTimeout(this._rerunTimer); this._rerunTimer = 0; }
    this._lastRerunTime = performance.now();
    this.runSketch();
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
   * Set an equirectangular source texture (e.g. an HDR loaded via RGBELoader)
   * for the environment map. Pass null for the built-in procedural gradient.
   */
  setEnvironmentSource(equirect: import("three").Texture | null) {
    this.renderer.setEnvironmentSource(equirect);
  }

  /** Show the environment source (e.g. the HDR) as the visible sky backdrop. */
  setEnvironmentBackground(visible: boolean) {
    this.renderer.setEnvironmentBackground(visible);
  }

  /** Rotate the environment + background (Euler radians); aligns a Y-up HDRI to Z-up. */
  setEnvironmentRotation(x: number, y: number, z: number) {
    this.renderer.setEnvironmentRotation(x, y, z);
  }

  /**
   * Add a raw THREE.Object3D (e.g. a glTF/GLB scene loaded with GLTFLoader) to
   * the scene, kept across sketch re-runs. Re-adding the same id replaces it.
   */
  addExternalObject(obj: import("three").Object3D, id: string) {
    this.renderer.addExternalObject(obj, id);
  }

  removeExternalObject(id: string) {
    this.renderer.removeExternalObject(id);
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
   * Show/hide line + point "helper" objects (axes, construction lines, markers,
   * labels) while keeping solid meshes — e.g. for a clean render view.
   */
  setHelpersVisible(visible: boolean) {
    this.renderer.setHelpersVisible(visible);
  }

  /**
   * Show/hide tekto's studio shadow-catcher plane at the origin. Hide it when
   * your sketch provides its own ground to receive shadows.
   */
  setShadowGroundVisible(visible: boolean) {
    this.renderer.setShadowGroundVisible(visible);
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
    this.panel.dispose();
    this.renderer.dispose();
  }
}
