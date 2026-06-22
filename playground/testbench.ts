/**
 * Tekto TestBench — page router with top-bar shell.
 *
 * The shell provides:
 *   • Page chooser (left of the top bar) — categorised dropdown.
 *   • Render mode + lighting (right of the top bar) — persisted in
 *     localStorage so the same setting is reapplied on next reload and
 *     forwarded to each page on navigation.
 *   • Export / Import menus (right) — populated dynamically from
 *     `lab.registerExport(...)` / `lab.registerImport(...)` calls made
 *     by the currently-mounted sketch. Buttons hide when nothing is
 *     registered.
 *
 * Each page module just exports `default(container)` and is mounted
 * into `#app`. The shell tags `#app` with `data-shell="testbench"` so
 * `SketchConfig.showHeader` defaults to `false` and the sketch's own
 * 44 px title bar collapses into the top bar's page chooser.
 */

import type { RenderMode, LightingMode } from "../src";
import { SunPosition, SketchInstance, Sketch2DInstance } from "../src";

// ─── Cities (lat, lon, standard-time UTC offset) ────────────────────

interface City { name: string; lat: number; lon: number; tz: number; }
const CITIES: City[] = [
  { name: "Zurich",        lat:  47.37, lon:   8.55, tz: +1 },
  { name: "Berlin",        lat:  52.52, lon:  13.40, tz: +1 },
  { name: "Paris",         lat:  48.86, lon:   2.35, tz: +1 },
  { name: "London",        lat:  51.51, lon:  -0.13, tz:  0 },
  { name: "Madrid",        lat:  40.42, lon:  -3.70, tz: +1 },
  { name: "Rome",          lat:  41.90, lon:  12.50, tz: +1 },
  { name: "Stockholm",     lat:  59.33, lon:  18.07, tz: +1 },
  { name: "Reykjavik",     lat:  64.13, lon: -21.95, tz:  0 },
  { name: "Moscow",        lat:  55.76, lon:  37.62, tz: +3 },
  { name: "Dubai",         lat:  25.27, lon:  55.30, tz: +4 },
  { name: "Mumbai",        lat:  19.08, lon:  72.88, tz: +5.5 },
  { name: "Singapore",     lat:   1.35, lon: 103.82, tz: +8 },
  { name: "Beijing",       lat:  39.90, lon: 116.41, tz: +8 },
  { name: "Tokyo",         lat:  35.68, lon: 139.69, tz: +9 },
  { name: "Sydney",        lat: -33.87, lon: 151.21, tz: +10 },
  { name: "Honolulu",      lat:  21.31, lon:-157.86, tz: -10 },
  { name: "Anchorage",     lat:  61.22, lon:-149.90, tz: -9 },
  { name: "San Francisco", lat:  37.77, lon:-122.42, tz: -8 },
  { name: "Mexico City",   lat:  19.43, lon: -99.13, tz: -6 },
  { name: "Chicago",       lat:  41.88, lon: -87.63, tz: -6 },
  { name: "New York",      lat:  40.71, lon: -74.01, tz: -5 },
  { name: "Buenos Aires",  lat: -34.61, lon: -58.38, tz: -3 },
  { name: "São Paulo",     lat: -23.55, lon: -46.63, tz: -3 },
  { name: "Cape Town",     lat: -33.92, lon:  18.42, tz: +2 },
];

// ─── Page registry ──────────────────────────────────────────────────

interface PageEntry {
  slug: string;
  label: string;
  load: () => Promise<{ default: (container: HTMLElement) => SketchInstance | Sketch2DInstance }>;
}
interface PageGroup { name: string; pages: PageEntry[]; }

const GROUPS: PageGroup[] = [
  { name: "Basics", pages: [
    { slug: "primitives",   label: "Primitives",     load: () => import("./pages/primitives") },
    { slug: "transforms",   label: "Transforms",     load: () => import("./pages/transforms") },
    { slug: "lines-points", label: "Lines & Points", load: () => import("./pages/lines-points") },
    { slug: "shape-modes",  label: "Shape Modes",    load: () => import("./pages/shape-modes") },
    { slug: "colors",       label: "Colors",         load: () => import("./pages/colors") },
  ]},
  { name: "Geometry", pages: [
    { slug: "mesh-factory",   label: "MeshFactory",     load: () => import("./pages/mesh-factory") },
    { slug: "curves",         label: "Curves",          load: () => import("./pages/curves") },
    { slug: "nurbs-surfaces", label: "NURBS Surfaces",  load: () => import("./pages/nurbs-surfaces") },
    { slug: "mesh-ops",       label: "Mesh Operations", load: () => import("./pages/mesh-ops") },
    { slug: "curvature",      label: "Curvature (Taubin)", load: () => import("./pages/curvature") },
    { slug: "streamlines",    label: "Streamlines",     load: () => import("./pages/streamlines") },
    { slug: "bsp-csg",        label: "BSP & CSG",       load: () => import("./pages/bsp-csg") },
  ]},
  { name: "Fields & Graphs", pages: [
    { slug: "sdf",          label: "SDF + Marching", load: () => import("./pages/sdf") },
    { slug: "graph",        label: "Graph",          load: () => import("./pages/graph") },
    { slug: "planar-graph", label: "Planar Graph",   load: () => import("./pages/planar-graph") },
    { slug: "voxel-2d",     label: "Voxel Grid 2D",  load: () => import("./pages/voxel-2d") },
  ]},
  { name: "Motion & Camera", pages: [
    { slug: "particles", label: "Particles 2D", load: () => import("./pages/particles") },
    { slug: "camera",    label: "Camera",       load: () => import("./pages/camera") },
  ]},
  { name: "Sketch2D", pages: [
    { slug: "pointer-2d", label: "Pointer Input", load: () => import("./pages/pointer-2d") },
  ]},
  { name: "BIM", pages: [
    { slug: "timber",   label: "Timber + IFC", load: () => import("./pages/timber") },
    { slug: "dxf-test", label: "DXF Test",     load: () => import("./pages/dxf-test") },
  ]},
];

const PAGES = new Map(GROUPS.flatMap(g => g.pages.map(p => [p.slug, p] as const)));

// ─── State ──────────────────────────────────────────────────────────

// A page is either a 3D Sketch or a 2D Sketch2D. The top-bar's render/lighting/
// sun/export controls only apply to the 3D one; `as3D()` returns the current
// sketch only when it's a 3D SketchInstance, so those controls no-op for 2D.
let currentSketch: SketchInstance | Sketch2DInstance | null = null;
function as3D(): SketchInstance | null {
  return currentSketch instanceof SketchInstance ? currentSketch : null;
}
let currentPage = "";
let currentRenderMode: RenderMode = "solid";
const LIGHTING_KEY = "tekto.lightingMode";
let currentLightingMode: LightingMode =
  (localStorage.getItem(LIGHTING_KEY) as LightingMode) === "studio" ? "studio" : "flat";

const SUN_KEY = "tekto.sun";
interface SunState {
  cityIdx: number; // -1 = custom
  lat: number; lon: number; tz: number;
  dateISO: string;  // YYYY-MM-DD (date part only)
  hour: number;     // local hours (0..24)
}
const sun: SunState = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem(SUN_KEY) ?? "");
    if (stored && typeof stored.lat === "number") return stored;
  } catch { /* ignore */ }
  const today = new Date();
  return {
    cityIdx: 0, // Zurich
    lat: CITIES[0].lat, lon: CITIES[0].lon, tz: CITIES[0].tz,
    dateISO: today.toISOString().slice(0, 10),
    hour: 13.5,
  };
})();
function persistSun() { localStorage.setItem(SUN_KEY, JSON.stringify(sun)); }
let exportsUnsub:  (() => void) | null = null;
let importsUnsub:  (() => void) | null = null;

// ─── DOM refs ───────────────────────────────────────────────────────

const app             = document.getElementById("app") as HTMLDivElement;
const pageChooser     = document.getElementById("page-chooser") as HTMLSelectElement;
const renderModeSel   = document.getElementById("render-mode") as HTMLSelectElement;
const lightingSel     = document.getElementById("lighting-mode") as HTMLSelectElement;
const exportBtn       = document.getElementById("export-btn") as HTMLButtonElement;
const exportList      = document.getElementById("export-list") as HTMLDivElement;
const importBtn       = document.getElementById("import-btn") as HTMLButtonElement;
const importList      = document.getElementById("import-list") as HTMLDivElement;
const importFileInput = document.getElementById("import-file") as HTMLInputElement;
const sunBtn          = document.getElementById("sun-btn") as HTMLButtonElement;
const sunPopover      = document.getElementById("sun-popover") as HTMLDivElement;
const sunCity         = document.getElementById("sun-city") as HTMLSelectElement;
const sunLat          = document.getElementById("sun-lat") as HTMLInputElement;
const sunLon          = document.getElementById("sun-lon") as HTMLInputElement;
const sunTz           = document.getElementById("sun-tz") as HTMLInputElement;
const sunDate         = document.getElementById("sun-date") as HTMLInputElement;
const sunTime         = document.getElementById("sun-time") as HTMLInputElement;
const sunAltAz        = document.getElementById("sun-altaz") as HTMLSpanElement;
const sunBtnLabel     = document.getElementById("sun-btn-label") as HTMLSpanElement;
const sunNowBtn       = document.getElementById("sun-now") as HTMLButtonElement;
const renderGroup     = document.getElementById("render-group") as HTMLElement;
const lightGroup      = document.getElementById("light-group") as HTMLElement;
const sunMenu         = document.getElementById("sun-menu") as HTMLElement;

// Show the 3D-only top-bar controls for 3D pages, hide them for 2D (sketch2d)
// pages where render mode / lighting / sun have no meaning. (`.group` is
// inline-flex in CSS, so toggle inline display rather than the [hidden] attr.)
function setShellMode(is2D: boolean) {
  const d = is2D ? "none" : "";
  renderGroup.style.display = d;
  lightGroup.style.display = d;
  sunMenu.style.display = d;
}

// Tag the container so sketches can detect they're inside a shell and
// suppress their internal header (see SketchConfig.showHeader).
app.dataset.shell = "testbench";

// ─── Page chooser ───────────────────────────────────────────────────

for (const g of GROUPS) {
  const og = document.createElement("optgroup");
  og.label = g.name;
  for (const p of g.pages) {
    const opt = document.createElement("option");
    opt.value = p.slug;
    opt.textContent = p.label;
    og.appendChild(opt);
  }
  pageChooser.appendChild(og);
}
pageChooser.addEventListener("change", () => {
  const slug = pageChooser.value;
  history.pushState(null, "", `?page=${slug}`);
  loadPage(slug);
});

// ─── Render mode ────────────────────────────────────────────────────

renderModeSel.addEventListener("change", () => {
  currentRenderMode = renderModeSel.value as RenderMode;
  as3D()?.setRenderMode(currentRenderMode);
});

// ─── Lighting mode (persisted) ──────────────────────────────────────

lightingSel.value = currentLightingMode;
lightingSel.addEventListener("change", () => {
  currentLightingMode = lightingSel.value as LightingMode;
  localStorage.setItem(LIGHTING_KEY, currentLightingMode);
  as3D()?.setLightingMode(currentLightingMode);
});

// ─── Export / Import menus ──────────────────────────────────────────

function rebuildExportMenu() {
  const items = as3D()?.getExports() ?? [];
  exportList.innerHTML = "";
  if (items.length === 0) { exportBtn.hidden = true; exportList.hidden = true; return; }
  exportBtn.hidden = false;
  for (const it of items) {
    const b = document.createElement("button");
    b.className = "item";
    b.textContent = it.name;
    b.title = `Download as ${it.fileName}`;
    b.addEventListener("click", async () => {
      exportList.hidden = true;
      const blob = await it.handler();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = it.fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
    exportList.appendChild(b);
  }
}
exportBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  exportList.hidden = !exportList.hidden;
  importList.hidden = true;
});

function rebuildImportMenu() {
  const items = as3D()?.getImports() ?? [];
  importList.innerHTML = "";
  if (items.length === 0) { importBtn.hidden = true; importList.hidden = true; return; }
  importBtn.hidden = false;
  for (const it of items) {
    const b = document.createElement("button");
    b.className = "item";
    b.textContent = it.name;
    b.addEventListener("click", () => {
      importList.hidden = true;
      importFileInput.accept = it.accept ?? "";
      importFileInput.onchange = async () => {
        const f = importFileInput.files?.[0];
        if (!f) return;
        await it.handler(f);
        importFileInput.value = ""; // reset so picking the same file re-fires
      };
      importFileInput.click();
    });
    importList.appendChild(b);
  }
}
importBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  importList.hidden = !importList.hidden;
  exportList.hidden = true;
});

// ─── Sun popover + computation ──────────────────────────────────────

for (let i = 0; i < CITIES.length; i++) {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = CITIES[i].name;
  sunCity.appendChild(opt);
}
const customOpt = document.createElement("option");
customOpt.value = "-1"; customOpt.textContent = "Custom";
sunCity.appendChild(customOpt);

function hhmmFromHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

/** Push the current `sun` state into the inputs (one-way sync). */
function syncSunInputs() {
  sunCity.value = String(sun.cityIdx);
  sunLat.value  = sun.lat.toFixed(2);
  sunLon.value  = sun.lon.toFixed(2);
  sunTz.value   = sun.tz.toFixed(1);
  sunDate.value = sun.dateISO;
  sunTime.value = sun.hour.toFixed(2);
  sunTime.title = hhmmFromHour(sun.hour);
}

/** Recompute sun direction, push to the current sketch, update the top-bar label. */
function applySun() {
  // Compose UTC instant from `sun.dateISO` + `sun.hour` + `sun.tz`.
  const [y, m, d] = sun.dateISO.split("-").map(Number);
  const utcHours  = sun.hour - sun.tz;
  const utcMs     = Date.UTC(y, (m || 1) - 1, d || 1) + utcHours * 3600_000;
  const result = SunPosition.compute({
    date: new Date(utcMs),
    latitude:  sun.lat,
    longitude: sun.lon,
  });
  const altDeg = (result.altitude * 180 / Math.PI);
  const azDeg  = (result.azimuth  * 180 / Math.PI);
  const label  = result.isDaytime
    ? `${altDeg.toFixed(0)}° / ${azDeg.toFixed(0)}°`
    : "night";
  sunBtnLabel.textContent = label;
  sunAltAz.textContent = result.isDaytime
    ? `Alt ${altDeg.toFixed(1)}°  ·  Az ${azDeg.toFixed(1)}°  ·  ${hhmmFromHour(sun.hour)}`
    : `Below horizon at ${hhmmFromHour(sun.hour)}`;
  const s3d = as3D();
  if (result.isDaytime && s3d) s3d.setSunDirection(result.direction);
}

sunBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sunPopover.hidden = !sunPopover.hidden;
  exportList.hidden = true;
  importList.hidden = true;
});

sunCity.addEventListener("change", () => {
  const idx = Number(sunCity.value);
  if (idx >= 0) {
    const c = CITIES[idx];
    sun.cityIdx = idx; sun.lat = c.lat; sun.lon = c.lon; sun.tz = c.tz;
  } else {
    sun.cityIdx = -1;
  }
  syncSunInputs(); persistSun(); applySun();
});
function onCustomLatLonTz() {
  sun.lat = parseFloat(sunLat.value);
  sun.lon = parseFloat(sunLon.value);
  sun.tz  = parseFloat(sunTz.value);
  sun.cityIdx = -1; sunCity.value = "-1";
  persistSun(); applySun();
}
sunLat.addEventListener("change", onCustomLatLonTz);
sunLon.addEventListener("change", onCustomLatLonTz);
sunTz .addEventListener("change", onCustomLatLonTz);
sunDate.addEventListener("change", () => { sun.dateISO = sunDate.value; persistSun(); applySun(); });
sunTime.addEventListener("input",  () => { sun.hour = parseFloat(sunTime.value); persistSun(); applySun(); });

sunNowBtn.addEventListener("click", () => {
  const now = new Date();
  sun.dateISO = now.toISOString().slice(0, 10);
  // Approximate local-hour using the user's selected TZ (not the system
  // TZ — keeps the answer consistent with the chosen city).
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  sun.hour = ((utcH + sun.tz) % 24 + 24) % 24;
  syncSunInputs(); persistSun(); applySun();
});

syncSunInputs();
applySun();

// Hide menus on outside click.
document.addEventListener("click", () => {
  exportList.hidden = true;
  importList.hidden = true;
  sunPopover.hidden = true;
});
sunPopover.addEventListener("click", (e) => e.stopPropagation());

// ─── Page loading ───────────────────────────────────────────────────

async function loadPage(slug: string) {
  if (slug === currentPage) return;
  const entry = PAGES.get(slug);
  if (!entry) { console.warn(`Unknown page: ${slug}`); return; }

  // Drop subscriptions from the previous sketch (if any).
  exportsUnsub?.(); exportsUnsub = null;
  importsUnsub?.(); importsUnsub = null;

  if (currentSketch) {
    currentSketch.dispose();
    currentSketch = null;
  }
  app.innerHTML = "";

  currentPage = slug;
  pageChooser.value = slug;

  try {
    const mod = await entry.load();
    if (currentPage !== slug) return; // user already navigated away
    currentSketch = mod.default(app);
    const s3d = as3D();
    setShellMode(!s3d); // hide render/lighting/sun for 2D pages
    if (s3d) {
      if (currentRenderMode !== "solid")  s3d.setRenderMode(currentRenderMode);
      if (currentLightingMode !== "flat") s3d.setLightingMode(currentLightingMode);
      // Subscribe to the sketch's export/import registrations and re-render
      // the menus whenever the sketch (re)registers an entry.
      exportsUnsub = s3d.onExportsChange(rebuildExportMenu);
      importsUnsub = s3d.onImportsChange(rebuildImportMenu);
    }
    rebuildExportMenu();
    rebuildImportMenu();
    applySun(); // push current sun direction to the fresh sketch (3D only)
  } catch (e) {
    console.error(`Failed to load page "${slug}":`, e);
    app.innerHTML = `<div style="color:#ff6b6b;padding:40px;font-family:monospace">
      Failed to load page "${slug}".<br>${e}
    </div>`;
  }
}

// ─── Init ───────────────────────────────────────────────────────────

function getPageFromURL(): string {
  const params = new URLSearchParams(location.search);
  return params.get("page") || "primitives";
}
window.addEventListener("popstate", () => loadPage(getPageFromURL()));

loadPage(getPageFromURL());
