/**
 * House — a building as data: storeys, walls, openings, slabs, rooms, a roof and a stair as
 * records in a `Doc`, built into timber-frame walls, joisted floors, a gable roof and a half-turn
 * stair by `bindBuilding`, checked by record.
 *
 *   records       `doc` collections storeys / walls / openings / slabs / spaces / roofs / stairs;
 *                 Save JSON shows them, Open JSON reads them back
 *   bindBuilding  any change rebuilds the house; each object is keyed by its record
 *   checks        what is wrong, as callouts on the records concerned (openings past a wall's
 *                 end, free wall ends, rooms that overlap…)
 *   undo / redo   every edit, including a whole house written at once, is one step
 *   agentDoc      an agent reads and edits the records (`__tekto.doc`, or from outside through
 *                 the dev server: `tools/mcp.mjs`), each patch one undo step, answered with the issues
 *   ?empty        start on an empty site (the Empty site button does the same, undoably)
 *   ?shared=1     the records go through the dev server (`.tekto/collab/house.json`), shared by
 *                 every window that opens the page with it
 */
import {
  appShell, Doc, bindBuilding, agentDoc, buildingSchema, Selection, selectOnClick, localAdapter, devServerAdapter, download,
  type BuildingData, type BuildingRecords, type BuildingIssue, type DocJSON,
} from "../../src";

const rect = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const FOOTPRINT = rect(-0.15, -0.15, 10.15, 8.15);

/**
 * A two-storey house, 10 × 8 m, what an empty document starts with: study, hall and living
 * below; a landing, bath and two bedrooms above; a half-turn stair from the hall to the landing,
 * cutting its own well; a gable roof whose ridge runs east–west.
 */
const EXAMPLE: BuildingData = {
  storeys: {
    eg: { name: "Ground floor", elevation: 0, height: 2.9 },
    og: { name: "Upper floor", elevation: 2.9, height: 2.6 },
  },
  slabs: {
    base: { storey: "eg", boundary: FOOTPRINT, type: "ground", name: "Ground slab" },
    floor: { storey: "og", boundary: FOOTPRINT, name: "Upper floor" },
  },
  roofs: {
    roof: { storey: "og", kind: "gable", pitch: 35, footprint: rect(-0.125, -0.125, 10.125, 8.125), overhang: 0.5, gableOverhang: 0.3, name: "Roof" },
  },
  stairs: {
    stair: { storey: "eg", at: [0.6, 7.3], direction: [1, 0], shape: "half_turn", turn: "right", name: "Stair" },
  },
  walls: {
    s: { storey: "eg", path: [[0, 0], [10, 0]], name: "South" }, e: { storey: "eg", path: [[10, 0], [10, 8]], name: "East" },
    n: { storey: "eg", path: [[10, 8], [0, 8]], name: "North" }, w: { storey: "eg", path: [[0, 8], [0, 0]], name: "West" },
    p1: { storey: "eg", path: [[6, 0], [6, 8]], type: "interior" }, p2: { storey: "eg", path: [[0, 4.5], [6, 4.5]], type: "interior" },
    s2: { storey: "og", path: [[0, 0], [10, 0]], name: "South" }, e2: { storey: "og", path: [[10, 0], [10, 8]], name: "East" },
    n2: { storey: "og", path: [[10, 8], [0, 8]], name: "North" }, w2: { storey: "og", path: [[0, 8], [0, 0]], name: "West" },
    q1: { storey: "og", path: [[4, 0], [4, 8]], type: "interior" }, q2: { storey: "og", path: [[4, 4.5], [10, 4.5]], type: "interior" },
    q3: { storey: "og", path: [[0, 3.5], [4, 3.5]], type: "interior" },
  },
  openings: {
    entry: { wall: "n", kind: "door", at: 5.5, width: 1.1, name: "Entrance" },
    sw0: { wall: "s", kind: "window", at: 3, width: 1.6 },
    sw1: { wall: "s", kind: "window", at: 8, width: 2.4, sill: 0.5 },
    ew1: { wall: "e", kind: "window", at: 4, width: 2 },
    nw1: { wall: "n", kind: "window", at: 2, width: 1.6 },
    ww1: { wall: "w", kind: "window", at: 4.5, width: 1.2 },
    d1: { wall: "p1", kind: "door", at: 6.2, width: 0.9 },
    d2: { wall: "p2", kind: "door", at: 4.8, width: 0.9 },
    sw2: { wall: "s2", kind: "window", at: 2, width: 1, sill: 1.1 }, sw3: { wall: "s2", kind: "window", at: 7, width: 1.4 },
    ew2: { wall: "e2", kind: "window", at: 6.3, width: 1.2 },
    nw2: { wall: "n2", kind: "window", at: 3, width: 1.2 },
    ww2: { wall: "w2", kind: "window", at: 1.5, width: 1 },
    d3: { wall: "q1", kind: "door", at: 4, width: 0.8 }, d4: { wall: "q1", kind: "door", at: 6.3, width: 0.8 },
    d5: { wall: "q3", kind: "door", at: 2, width: 0.8 },
  },
  spaces: {
    study: { storey: "eg", name: "Study", boundary: rect(0, 0, 6, 4.5), use: "office" },
    hall: { storey: "eg", name: "Hall", boundary: rect(0, 4.5, 6, 8), use: "hall" },
    living: { storey: "eg", name: "Living / kitchen", boundary: rect(6, 0, 10, 8), use: "living" },
    bath: { storey: "og", name: "Bath", boundary: rect(0, 0, 4, 3.5), use: "bath" },
    landing: { storey: "og", name: "Landing", boundary: rect(0, 3.5, 4, 8), use: "hall" },
    bed1: { storey: "og", name: "Bedroom", boundary: rect(4, 0, 10, 4.5), use: "bedroom" },
    bed2: { storey: "og", name: "Bedroom", boundary: rect(4, 4.5, 10, 8), use: "bedroom" },
  },
};

export default function (container: HTMLElement) {
  const query = new URLSearchParams(location.search);
  const shared = query.get("shared");
  const doc = new Doc<BuildingRecords>({ name: "house", adapter: shared ? devServerAdapter() : localAdapter() });
  const selection = new Selection();

  const app = appShell({
    title: "House",
    container,
    topBar: false,
    navGizmo: true,
    shadingBar: true,
    units: "m",
    renderer: { gridStyle: "fading" },
    camera: [22, -18, 16],
    target: [5, 4, 2.5],
    params: {
      framing: { type: "bool", default: false, label: "Framing" },
      issues: { type: "bool", default: true, label: "Show issues", display: true },
      undo: { type: "button", label: "Undo", action: () => doc.undo() },
      redo: { type: "button", label: "Redo", action: () => doc.redo() },
      reset: { type: "button", label: "Example house", action: () => load(EXAMPLE, "Example house") },
      empty: { type: "button", label: "Empty site", action: () => load({}, "Clear the site") },
      ifc: { type: "button", label: "Export IFC", action: () => download(house.building.toIfc({ projectName: "House" }), "house.ifc", { stamp: true }) },
      save: { type: "button", label: "Save JSON", action: () => download(JSON.stringify(doc.toJSON(), null, 2), "house.json", { stamp: true }) },
      open: { type: "button", label: "Open JSON", action: () => openJson() },
    },
    groups: {
      Show: ["framing", "issues"],
      History: ["undo", "redo"],
      File: ["reset", "empty", "ifc", "save", "open"],
    },
  });

  // Walls and slabs are flat: their tessellation says nothing, so no wire overlay.
  app.renderer.setOverlays({ wireframe: false });

  // ── Document → building → scene ──
  const house = bindBuilding(doc, app.scene);
  house.onBuild((building, issues) => {
    app.renderer.setSectionLevels(building.levels());
    showIssues(issues);
    status();
  });
  app.params.onChange((key, value) => {
    if (key === "framing") house.setDetail(value ? "framing" : "envelope");
    if (key === "issues") showIssues(house.issues);
  });
  const stopSelecting = selectOnClick(app.renderer, app.scene, selection);
  selection.onChange(status);
  // Agents edit the same records: checked against the schema, one undo step, answered with the issues.
  const stopAgent = agentDoc(doc, { schema: buildingSchema(), check: () => house.issues });

  /** Each issue as a callout on the records it concerns: red for an error, amber for a warning. */
  function showIssues(issues: BuildingIssue[]) {
    app.renderer.setCallouts(app.params.get("issues") ? issues.filter((i) => i.keys.length).map((i, n) => ({
      id: `${i.code}-${n}`,
      text: i.code,
      detail: i.message,
      colour: i.severity === "error" ? "#e5484d" : "#f5a524",
      objects: i.keys,
    })) : []);
  }

  /** Replace the document's building with `data`, as one undo step. */
  function load(data: BuildingData, label: string) {
    doc.transact(label, () => {
      for (const c of ["stairs", "roofs", "spaces", "slabs", "openings", "walls", "storeys"] as const) for (const id of doc.ids(c)) doc.remove(c, id);
      for (const [c, rows] of Object.entries(data) as [keyof BuildingRecords, Record<string, never>][]) {
        for (const [id, rec] of Object.entries(rows)) doc.add(c, rec, { id });
      }
    });
    selection.clear();
  }

  function openJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try { doc.load(JSON.parse(await f.text()) as DocJSON); selection.clear(); }
      catch (e) { console.error("Open JSON:", e); }
    };
    input.click();
  }

  app.commands.add([
    { id: "edit.undo", label: "Undo", keys: "Mod+Z", group: "Edit", run: () => { doc.undo(); }, enabled: () => doc.canUndo() },
    { id: "edit.redo", label: "Redo", keys: ["Shift+Mod+Z", "Mod+Y"], group: "Edit", run: () => { doc.redo(); }, enabled: () => doc.canRedo() },
  ]);

  // ── Status: the house in numbers, the selection, what Undo would do ──
  function status() {
    const b = house.building;
    const walls = b.storeys.reduce((n, s) => n + s.walls.size, 0);
    const errors = house.issues.filter((i) => i.severity === "error").length;
    const warnings = house.issues.length - errors;
    const picked = selection.ids("walls")[0] ? `walls/${selection.ids("walls")[0]}` : selection.keys()[0];
    const undo = doc.undoLabel();
    app.status([
      `${b.storeys.length} storeys · ${walls} walls · ${b.areas().total.toFixed(1)} m²`,
      errors || warnings ? `${errors} errors · ${warnings} warnings` : "no issues",
      picked ? `selected ${picked}` : "",
      undo ? `Undo: ${undo}` : "",
    ].filter(Boolean).join(" · "));
  }
  doc.onHistory(status);

  // The example house in an empty document, once the stored one has loaded (`?empty`: a bare site).
  void doc.ready.then(() => {
    if (query.has("empty")) {
      load({}, "Clear the site");
      doc.clearHistory();
    } else if (doc.count("storeys") === 0) {
      load(EXAMPLE, "Example house");
      doc.clearHistory();
    }
    status();
  });

  // For agents and tests: the document, the building and its issues.
  (window as unknown as { house: unknown }).house = { doc, selection, get building() { return house.building; }, get issues() { return house.issues; } };

  return {
    dispose() {
      stopSelecting();
      stopAgent();
      house.dispose();
      doc.dispose();
      app.dispose();
    },
  };
}
