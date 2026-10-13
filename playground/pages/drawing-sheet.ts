/**
 * Drawing Sheet — one model, a 3D view and a dimensioned drawing, one selection.
 *
 *   Sheet          plan 1:100, two elevations projected from the model's 3D points, a 1:20
 *                  detail; dimensions, grid, levels, a leader — annotation sized in paper mm
 *   SheetCanvas    the drawing over the viewport (app.overlay()): wheel zooms, drag pans,
 *                  double-click fits; a slider keeps the zoom while the sheet is rebuilt
 *   Selection      click a column in the plan, an elevation, the detail or in 3D: it lights
 *                  up everywhere (Shift/⌘ adds)
 *   toSVG / toDXF  the export draws the same primitives as the screen
 */
import {
  appShell, Sheet, SheetCanvas, Selection, selectOnClick, MeshFactory, MeshTransform, Vec3, download,
  type SheetView,
} from "../../src";

type Model = { w: number; d: number; h: number; bays: number; col: number; roof: number };
type Column = { key: string; x: number; y: number };

const OVERHANG = 0.6;
const COLUMN_COLOR = "#cfd8dc";

/** Columns on the grid: axes 1… along x, rows A (y = 0) and B (y = depth). */
function columns(m: Model): Column[] {
  const out: Column[] = [];
  for (const [row, y] of [["A", 0], ["B", m.d]] as const) {
    for (let i = 0; i <= m.bays; i++) out.push({ key: `columns/${row}${i + 1}`, x: (m.w * i) / m.bays, y });
  }
  return out;
}

const disc = (cx: number, cy: number, r: number) =>
  Array.from({ length: 32 }, (_, i) => [cx + r * Math.cos((i * Math.PI) / 16), cy + r * Math.sin((i * Math.PI) / 16)] as [number, number]);

function drawing(m: Model): Sheet {
  const sheet = new Sheet({
    scale: 100,
    layers: {
      cut: { weight: 0.5 },
      view: { weight: 0.25 },
      hidden: { weight: 0.18, dash: "hidden", color: "#666666" },
      axis: { weight: 0.13, dash: "center", color: "#c62828" },
      dims: { weight: 0.13 },
      ground: { weight: 0.7 },
    },
  });
  const o = OVERHANG, r = m.col / 2, cols = columns(m);
  const R = sheet.paper(4);                                     // grid bubble radius: 4 mm on paper

  // ── Plan 1:100 ──
  const plan = sheet.view("plan", { title: "Plan 1:100" });
  const bubble = (v: SheetView, x: number, y: number, label: string) => {
    v.circle([x, y], R, { layer: "axis", dash: "solid" });
    v.text(label, [x, y], { layer: "axis", size: 3.5, align: "center", baseline: "middle" });
  };
  for (let i = 0; i <= m.bays; i++) {
    const x = (m.w * i) / m.bays;
    plan.line([x, -o - 1], [x, m.d + o + 0.5], { layer: "axis" });
    bubble(plan, x, -o - 1 - R, String(i + 1));
  }
  for (const [row, y] of [["A", 0], ["B", m.d]] as const) {
    plan.line([-o - 1, y], [m.w + o + 0.5, y], { layer: "axis" });
    bubble(plan, -o - 1 - R, y, row);
  }
  plan.rect(-o, -o, m.w + 2 * o, m.d + 2 * o, { layer: "hidden", key: "roof/main" });
  for (const c of cols) {
    plan.fill(disc(c.x, c.y, r), { color: "#9e9e9e", key: c.key });
    plan.circle([c.x, c.y], r, { layer: "cut", key: c.key });
  }
  for (let i = 0; i < m.bays; i++) plan.dim([(m.w * i) / m.bays, m.d + o], [(m.w * (i + 1)) / m.bays, m.d + o], { layer: "dims", offset: 8 });
  plan.dim([0, m.d + o], [m.w, m.d + o], { layer: "dims", offset: 16 });
  plan.dim([m.w + o, 0], [m.w + o, m.d], { layer: "dims", offset: -8 });
  plan.dim([m.w + o, -o], [m.w + o, m.d + o], { layer: "dims", offset: -16 });
  const bx = m.w / m.bays / 2;
  plan.leader([[bx, m.d + o], [bx + 0.8, m.d - 0.4], [bx + 1.6, m.d - 0.4]], "Roof edge above", { layer: "dims" });

  // ── Elevations 1:100, projected from the model ──
  const elevY = -(o + 5) - (m.h + m.roof);
  const south = sheet.view("south", { at: [0, elevY], title: "South elevation 1:100", project: { right: new Vec3(1, 0, 0), up: new Vec3(0, 0, 1) } });
  const east = sheet.view("east", { at: [m.w + 2 * o + 6, elevY], title: "East elevation 1:100", project: { right: new Vec3(0, 1, 0), up: new Vec3(0, 0, 1) } });
  for (const [v, along, span, front] of [[south, "x", m.w, 0], [east, "y", m.d, m.w]] as const) {
    const P = (u: number, z: number) => (along === "x" ? new Vec3(u, front, z) : new Vec3(front, u, z));
    v.line(P(-o - 1.5, 0), P(span + o + 1.5, 0), { layer: "ground" });
    for (const c of cols.filter(c => (along === "x" ? c.y === 0 : c.x === m.w))) {
      const u = along === "x" ? c.x : c.y;
      v.polyline([P(u - r, 0), P(u + r, 0), P(u + r, m.h), P(u - r, m.h)], { layer: "view", closed: true, key: c.key });
    }
    v.polyline([P(-o, m.h), P(span + o, m.h), P(span + o, m.h + m.roof), P(-o, m.h + m.roof)], { layer: "view", closed: true, key: "roof/main" });
    for (const z of [0, m.h, m.h + m.roof]) v.level(P(-o - 1.2, z), { layer: "dims" });
    v.dim(P(span + o, 0), P(span + o, m.h), { layer: "dims", offset: -8 });
  }

  // ── Detail 1:20: the column head at A1, cut through row A ──
  const det = sheet.view("detail", { at: [m.w + 2 * o + 6 + 5 * o, 1.5], scale: 5, title: "Column head 1:20" });
  const reach = 1.0, below = 0.6;
  det.rect(-r, -below, 2 * r, below, { layer: "cut", fill: "#9e9e9e", key: "columns/A1" });
  det.rect(-o, 0, o + reach, m.roof, { layer: "cut", fill: "#d6d6d6", key: "roof/main" });
  det.dim([-r, -below], [r, -below], { layer: "dims", offset: -8 });
  det.dim([reach, 0], [reach, m.roof], { layer: "dims", offset: -8 });
  det.dim([-o, m.roof], [0, m.roof], { layer: "dims", offset: 8 });
  det.leader([[r, -below / 2], [r + 0.3, -below / 2 - 0.15], [r + 0.6, -below / 2 - 0.15]], `Steel tube Ø ${Math.round(m.col * 1000)}`, { layer: "dims" });
  return sheet;
}

export default function (container: HTMLElement) {
  let sheet = new Sheet();
  const app = appShell({
    title: "Drawing Sheet",
    container,
    topBar: false,
    camera: [24, -24, 16],
    target: [6, 3.5, 2],
    params: {
      width: { type: "float", min: 6, max: 24, default: 12, step: 0.5, label: "Width" },
      depth: { type: "float", min: 4, max: 12, default: 7, step: 0.5, label: "Depth" },
      height: { type: "float", min: 2.5, max: 6, default: 3.2, step: 0.1, label: "Height" },
      bays: { type: "int", min: 1, max: 8, default: 4, label: "Bays" },
      column: { type: "float", min: 0.15, max: 0.6, default: 0.3, step: 0.05, label: "Column Ø" },
      roof: { type: "float", min: 0.15, max: 0.8, default: 0.35, step: 0.05, label: "Roof" },
      show: { type: "select", options: ["Drawing", "3D"], default: "Drawing", label: "Show", display: true },
      fit: { type: "button", label: "Fit drawing", action: () => view.fit() },
      svg: { type: "button", label: "Export SVG", action: () => download(sheet.toSVG({ background: "#ffffff" }), "pavilion.svg", { stamp: true }) },
      dxf: { type: "button", label: "Export DXF", action: () => download(sheet.toDXF(), "pavilion.dxf", { stamp: true }) },
    },
    groups: {
      Pavilion: ["width", "depth", "height", "bays", "column", "roof"],
      View: ["show", "fit"],
      Export: ["svg", "dxf"],
    },
  });

  const model = (): Model => ({
    w: app.params.get("width"), d: app.params.get("depth"), h: app.params.get("height"),
    bays: app.params.get("bays"), col: app.params.get("column"), roof: app.params.get("roof"),
  });

  // ── One selection, three ways to click: the 3D view, the drawing, and the keys they share ──
  const selection = new Selection();
  const stop3d = selectOnClick(app.renderer, app.scene, selection);
  const overlay = app.overlay();
  const view = new SheetCanvas(overlay);
  const offPick = view.onPick((prim, mods) => selection.click(prim?.key, mods));
  selection.onChange((keys) => { view.setHighlight(keys); status(); });

  app.onBuild(() => {
    const m = model();
    app.scene.clear();
    for (const c of columns(m)) {
      app.scene.withKey(c.key, () => {
        const tube = MeshFactory.cylinder(m.col / 2, m.col / 2, m.h, 24);
        MeshTransform.swapAxes(tube, "y", "z");                // stand it up in the Z-up shell
        tube.translate(c.x, c.y, m.h / 2);
        app.scene.addMesh(tube, { color: COLUMN_COLOR, label: c.key, layer: "columns" });
      });
    }
    app.scene.withKey("roof/main", () => {
      const slab = MeshFactory.box(m.w + 2 * OVERHANG, m.d + 2 * OVERHANG, m.roof);
      slab.translate(m.w / 2, m.d / 2, m.h + m.roof / 2);
      app.scene.addMesh(slab, { color: "#eceff1", label: "roof", layer: "roof" });
    });
    sheet = drawing(m);
    view.setSheet(sheet);
    status();
  });
  app.onDisplay(() => { overlay.style.display = app.params.get("show") === "Drawing" ? "" : "none"; });

  function status() {
    const n = selection.size;
    app.status(`1:100 · ${sheet.explode().length} primitives · ${n ? `${n} selected: ${selection.keys().join(", ")}` : "click a column"}`);
  }

  app.rebuild();

  // For agents and tests: the drawing, its view and the selection behind them.
  (window as unknown as { drawingSheet: unknown }).drawingSheet = { get sheet() { return sheet; }, view, selection };

  return {
    dispose() {
      offPick();
      stop3d();
      view.dispose();
      app.dispose();
    },
  };
}
