#!/usr/bin/env node
/**
 * doc-shots — the screenshots of the documentation site (docs/), taken from the playground.
 *
 * Run it at each release, with the playground's dev server up:
 *
 *   npm run playground                                  # or: vite playground --port 5190
 *   node tools/doc-shots.mjs [--port 5173] [--only house,roof-hip] [--width 1600]
 *
 * Each shot opens a playground page in headless Chromium (Playwright, a devDependency),
 * sets it up the way a person would (Studio light, a sun, AO, a render mode, a section,
 * params, a camera), crops to the view and writes `docs/public/shots/<name>.webp`,
 * `--width` pixels wide (default 1600), so the repository stays small.
 *
 * `window.__tekto.owner` is the running sketch or app: its `renderer`, `scene` and
 * `frame()`. `frame()` animates, so the camera is adjusted only after it settles.
 * The script exits 1 when a page logged an error.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const PORT = Number(flag("port", "5173"));
const ONLY = flag("only", "")?.split(",").filter(Boolean);
const WIDTH = Number(flag("width", "1600"));
const QUALITY = 0.82;                  // WebP quality: small files, no visible banding
const SETTLE_MS = 1500;                // frame() animates for about this long
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../docs/public/shots");
const BASE = `http://localhost:${PORT}`;

/**
 * The shots. `page` is the playground slug (`testbench.html?page=…`); `o` is the look:
 * studio, sun ("morning" | "noon" | "sunset"), ao, mode ("hiddenline" | "ghost" | …),
 * background, section, params (by label), camera [[position], [target]], back (move the
 * framed camera back by this factor), frame (false keeps the page's own camera). `before`
 * lists edits made first (`{ click: "<button>" }`, `{ params }`); `clicks` taps a 2D canvas.
 *
 * Two looks. A feature's illustration is a line drawing (`...LINE`): white paper, hidden
 * lines, no grid, and nothing of the app over the view (`chrome: false`), the model filling
 * the frame; `hide` lists layers left out (a house's room tints). A shot of the app itself
 * (a render mode, the lighting, a panel) keeps the app as a person sees it, controls whole.
 */
const LINE = { line: true, chrome: false };
// Shapes with few edges (a sphere, a smooth surface) read better shaded: the same white page, Studio light.
const CLAY = { studio: true, ao: true, background: "#ffffff", chrome: false };
const HOUSE = [[15.5, -9.5, 7.6], [5.2, 3.6, 3.3]];      // the house from the south-east, filling the frame
const SHOTS = [
  { name: "house", page: "house", o: { ...LINE, hide: ["spaces"], camera: HOUSE } },
  { name: "house-framing", page: "house", o: { ...LINE, hide: ["spaces"], camera: HOUSE, params: { Framing: true } } },
  { name: "house-plan-cut", page: "house", o: { ...LINE, hide: ["spaces"], section: { axis: "z", coordinate: 1.6 }, camera: [[11.5, -5.5, 11.5], [5, 4, 0.4]] } },
  { name: "house-hidden-line", page: "house", o: { mode: "hiddenline", background: "#ffffff", back: 1.3 } },
  { name: "house-ghost-framing", page: "house", o: { mode: "ghost", studio: true, back: 1.3, params: { Framing: true } } },
  { name: "house-sunset", page: "house", o: { studio: true, sun: "sunset", ao: true, back: 1.35 } },
  { name: "roof-hip", page: "roofs", o: { ...LINE, back: 1.3, params: { Kind: "hip" } } },
  { name: "roof-gable", page: "roofs", o: { ...LINE, back: 1.3, params: { Kind: "gable" } } },
  { name: "floor-stair-well", page: "framed-floor", o: { ...LINE, back: 0.9, params: { Callouts: false } } },
  { name: "stair-timber", page: "framed-floor", o: { ...LINE, params: { Callouts: false, Structure: "timber" }, section: { axis: "z", coordinate: 2.75 }, camera: [[5.6, -0.9, 3.4], [3.1, 2.3, 1.3]] } },
  { name: "timber-frame", page: "framed-wall", o: { ...LINE, back: 0.85, params: { Callouts: false } } },
  { name: "framed-wall-callouts", page: "framed-wall", o: { studio: true, ao: true, frame: false } },
  { name: "twisted-tower", page: "app-shell", o: { ...LINE, back: 1.02, params: { Floors: 40, "Twist (°)": 180 } } },
  { name: "site-editor", page: "site-editor", o: { ...LINE, camera: [[27, -21, 19], [10, 5, 4]] },
    before: [12, 6, 9, 4, 15, 7, 10].flatMap((h) => [{ click: "Add block" }, { params: { Height: h } }]) },
  { name: "primitives", page: "primitives", o: { ...CLAY, back: 0.72 } },
  { name: "mesh-factory", page: "mesh-factory", o: { ...CLAY, back: 0.9 } },
  { name: "mesh-ops", page: "mesh-ops", o: { ...CLAY, back: 0.72 } },
  { name: "transforms", page: "transforms", o: { ...CLAY, back: 0.9 } },
  { name: "lines-points", page: "lines-points", o: {} },
  { name: "booleans", page: "bsp-csg", o: { ...CLAY, back: 0.55 } },
  { name: "nurbs", page: "nurbs-surfaces", o: { ...LINE, back: 1.0 } },
  { name: "curves", page: "curves", o: { frame: false } },
  { name: "streamlines", page: "streamlines", o: { ...LINE, back: 0.85 } },
  { name: "planar-graph", page: "planar-graph", o: {} },
  { name: "voronoi", page: "voronoi", o: { frame: false } },
  { name: "circle-packing", page: "circle-packing", wait: 5000, o: {} },
  { name: "pointer-2d", page: "pointer-2d", clicks: [[0.3, 0.3], [0.62, 0.22], [0.75, 0.6], [0.5, 0.8], [0.25, 0.65]], o: {} },
  { name: "drawing-sheet", page: "drawing-sheet", o: { frame: false, bare: true } },
  { name: "sketch-drawing", page: "sketch-drawing", o: { studio: true, ao: true, params: { Drawing: true }, frame: false, bare: true } },
  { name: "dxf-3d", page: "dxf-3d", o: {} },
  { name: "shared-editing", page: "shared-editing", query: "&doc=doc-shots", o: { frame: false } },
  { name: "steps-panel", page: "steps", crop: false, steps: "massing", o: { studio: true, ao: true, camera: [[60, -70, 115], [60, 18, -22]] } },
  { name: "notes-with-claude", page: "house", query: "&agent-relay&tab=docshots", crop: false, notes: true, o: { studio: true, sun: "morning", ao: true, camera: [[15.5, -10.5, 8.5], [6.5, 4, 3]] } },
  // ── The interface ──
  // The app as a person meets it (docs/interface/): the real look, with its chrome, never cut by
  // the crop. Beyond the fields above: `viewport` [w, h] and `scale` (device pixels per CSS
  // pixel); `ui`, what a person does once the look is set (see `act`); `markers`, numbered discs
  // drawn in the page before the screenshot (see `placeMarkers`) with `markerSize`; `clip`, a
  // CSS selector to crop to, with `pad` pixels around it, instead of the view.
  { name: "ui-tour", page: "framed-floor", viewport: [1200, 760], crop: false, o: { studio: true, frame: false },
    ui: [{ click: { text: "AO" } }],
    markers: [
      { n: 1, at: "#page-chooser", ax: 1, dx: 18 },
      { n: 2, at: "span", text: "LIVE", ax: 1, dx: 18 },
      { n: 3, at: "span", text: "Light", ax: 0, dx: -18 },
      { n: 4, at: "span", text: "Stair", ax: 1, dx: 18 },
      { n: 5, at: "input[type=range]", ax: 0.78, dy: -15 },
      { n: 6, at: "select", text: "straight_run", ax: 0.72 },
      { n: 7, at: "label:has(input[type=checkbox])", ax: 1, dx: 18 },
      { n: 8, at: "button", text: "Export IFC", ax: 0.82 },
      { n: 9, at: "[data-tekto-shading-bar]", ax: 1, dx: 18 },
      { n: 10, world: [3, 2.25, 3.1] },
      { n: 11, at: "button", text: "Trimmer", ax: 0, dx: -18 },
      { n: 12, at: "button", text: "✎ Markup", ax: 0, dx: -18 },
      { n: 13, at: 'button[title^="Perspective or orthographic"]', ax: 0, dx: -44, dy: -44 },
      { n: 14, at: "[data-tekto-status]", ax: 1, dx: 18 },
    ] },
  { name: "ui-playground", page: "timber", viewport: [1200, 760], crop: false, markerSize: 18, o: { back: 1.7 },
    ui: [{ select: { css: "#lighting-mode", value: "studio" } }],
    markers: [
      { n: 1, at: "#page-chooser", ax: 1, dx: 16 },
      { n: 2, at: "#render-mode", ay: 1, dy: 16 },
      { n: 3, at: "#section-axis", ay: 1, dy: 16 },
      { n: 4, at: "#light-group .label", ay: 1, dy: 21 },
      { n: 5, at: "#sun-btn", ax: 1, dx: 11 },
      { n: 6, at: "#export-btn", ax: 1, dx: 12 },
    ] },
  // The app's own top bar by itself: `clip` is the toolbar element (it has no id; its inline style names it).
  { name: "ui-app-toolbar", page: "app-shell", viewport: [1200, 760], scale: 3, clip: 'div[style*="margin-left: auto"][style*="gap: 16px"]', pad: [10, 7, 10, 7],
    o: { studio: true }, ui: [{ click: { text: "AO" } }] },
  { name: "ui-shading-bar", page: "house", viewport: [1200, 760], scale: 4, clip: "[data-tekto-shading-bar]", pad: [10, 10, 10, 30], markerSize: 15,
    o: { studio: true, sun: "morning", ao: true },
    markers: ['[title="Solid"]', '[title="Wireframe"]', '[title="Hidden line"]', '[title="Ghost"]', '[title^="Flat lighting"]', '[title^="Studio lighting"]',
      '[title^="Ambient occlusion"]', '[title^="Sun:"]', '[title^="Section:"]', '[title^="Overlays:"]', '[title^="Frame:"]', '[title^="Snapshot:"]']
      .map((sel, i) => ({ n: i + 1, at: `[data-tekto-shading-bar] button${sel}`, ay: 1, dy: 16 })) },
  { name: "ui-section", page: "house", viewport: [1200, 760], o: { studio: true, ao: true, camera: [[4, -5.5, 17], [5, 4, 2.4]] },
    ui: [{ click: { title: "Section: cut the model" } }, { click: { title: "Plan of Ground floor: cut 1.2 m above 0 m" } }] },
  { name: "ui-plan-view", page: "house", viewport: [1200, 760], o: { studio: true, section: { axis: "z", coordinate: 1.2 }, frame: false },
    ui: [{ view: "top", ortho: true }] },
  { name: "ui-selection", page: "site-editor", viewport: [1200, 760], crop: false, o: { studio: true, sun: "morning", ao: true, camera: [[27, -21, 19], [10, 5, 4]] },
    before: [12, 6, 9, 4, 15, 7, 10].flatMap((h) => [{ click: "Add block" }, { params: { Height: h } }]),
    ui: [{ clickWorld: [14, 0, 6] }, { clickWorld: [14, 7, 7], shift: true }] },
  { name: "ui-gizmo", page: "gizmo", viewport: [1200, 760], crop: false, o: { frame: false },
    ui: [{ clickWorld: [0, 1, 0] }] },
  { name: "ui-markup", page: "house", viewport: [1560, 900], o: { studio: true, sun: "morning", ao: true, camera: [[15.5, -10.5, 8.5], [6.5, 4, 3]] },
    ui: [{ click: { text: "✎ Markup" } },
      { loop: [10, 4, 1.6], r: 62 }, { type: "Make this window wider", enter: true },
      { stroke: [[1.5, 2, 7], [5, 2, 7], [8.5, 2, 7]] }, { type: "Is the pitch right?", enter: true }] },
];

/** In the page: light, mode, section, params and camera, as a person would set them. */
function look(o) {
  const t = window.__tekto, r = t.owner.renderer, s = t.owner.scene;
  if (o.params) t.setParams(o.params);
  if (!r) return;                                  // sketch2d: a canvas, nothing to light
  if (o.studio) s.setLightingMode("studio");
  if (o.line) { r.setBackground("#ffffff"); r.setOverlays({ grid: false, axes: false }); s.setRenderMode("hiddenline"); }
  if (o.background) { r.setBackground(o.background); r.setOverlays({ grid: false }); }   // before the mode
  if (o.mode) s.setRenderMode(o.mode);
  if (o.sun) r.setSunPreset(o.sun);
  if (o.ao) r.setAmbientOcclusion(true);
  r.setOverlays({ wireframe: false });
  if (o.section) r.setSection(o.section);
  if (o.camera) t.camera(o.camera[0], o.camera[1]);
  else if (o.frame !== false) r.frame();
}

/** In the page, once it is set up: leave layers out, and take the app's controls off the view. */
function finish(o) {
  const t = window.__tekto, r = t.owner.renderer, s = t.owner.scene;
  if (!r) return;
  if (o.hide) for (const obj of s.byType("mesh")) if (o.hide.includes(obj.style.layer)) s.setStyle(obj.id, { visible: false });
  if (o.bare) {                                    // a drawing over the view: keep it, take off the app's own controls
    document.querySelectorAll("[data-tekto-status],[data-tekto-shading-bar],[data-tekto-viewer-header],[data-tekto-nav-column]").forEach((el) => { el.style.visibility = "hidden"; });
    document.querySelectorAll("button").forEach((b) => { if (/Markup/.test(b.textContent)) b.style.visibility = "hidden"; });
  }
  if (o.chrome !== false) return;
  r.setOverlays({ grid: false, axes: false });
  const view = r.canvasEl, box = view.getBoundingClientRect();
  for (const el of document.body.querySelectorAll("*")) {
    if (el === view || el.contains(view)) continue;
    const q = el.getBoundingClientRect();
    if (q.width && q.right > box.left && q.left < box.right && q.bottom > box.top && q.top < box.bottom) el.style.visibility = "hidden";
  }
}

/** In the page, once framing has settled: step back from the target by `k`. */
function stepBack(k) {
  const t = window.__tekto, c = t.owner.renderer.cameraState();
  t.camera(c.position.map((v, i) => c.target[i] + (v - c.target[i]) * k), c.target);
}

/** In a blank page: a PNG scaled to `width` and encoded as WebP by the browser. */
async function toWebp([b64, width, quality]) {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const w = Math.min(width, img.naturalWidth), h = Math.round((img.naturalHeight * w) / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/webp", quality).split(",")[1];
}

const note = (text, pin, keys, at) => ({
  text, author: "BD", createdAt: new Date(Date.now() + at).toISOString(), pin, strokes: [], keys,
  view: { position: [22, -18, 16], target: [5, 4, 2.5] },
});
const relay = (op, args, page) => fetch(`${BASE}/__tekto/agent/call`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ op, args, agent: "Claude Code", page }),
}).then((r) => r.json());

/** The House page with two notes, one done by the agent and one it answered. */
async function addNotes(page) {
  const ids = await page.evaluate(([a, b]) => [window.house.notes.add(a), window.house.notes.add(b)], [
    note("Make the east window wider", [10, 4, 1.6], ["openings/ew1"], 0),
    note("Is the roof pitch right?", [5, 0, 6.6], ["roofs/roof"], 1000),
  ]);
  await page.waitForTimeout(800);
  await relay("apply", { patch: { update: { "openings/ew1": { width: 2.6 } } }, label: "Claude: wider east window" }, "docshots");
  await relay("noteResolve", { id: ids[0], text: "Widened the east window from 2 m to 2.6 m." }, "docshots");
  await relay("noteReply", { id: ids[1], text: "It is 35°, typical for timber houses is 30–45°. Shall I make it steeper?" }, "docshots");
  await page.locator(`[data-note="${ids[1]}"]`).click();
}

// ── The interface shots: what a person does, numbered markers, a crop around one control ──

/** In the page: a world point [x, y, z] as page pixels. */
function toScreen([x, y, z]) {
  const r = window.__tekto.owner.renderer, c = r.canvasEl.getBoundingClientRect(), p = r.worldToScreen({ x, y, z });
  return [c.left + p.x, c.top + p.y];
}

/**
 * One step of a shot's `ui` list, taken as a person would:
 *   { click: { title } | { text } | { css } }   a control by its tooltip, its label, or a selector
 *   { select: { css, value } }                  an option of a dropdown
 *   { clickWorld: [x, y, z], shift }            a click on the model there (Shift adds to a selection)
 *   { loop: [x, y, z], r }                      a loop of r pixels drawn round a point (✎ Markup)
 *   { stroke: [[x, y, z], …] }                  a stroke drawn through points (✎ Markup)
 *   { type: "text", enter }                     typed into whatever has the focus
 *   { view: "top", ortho }                      a named view, a projection, then everything framed
 */
async function act(page, step) {
  if (step.click) {
    const c = step.click;
    const target = c.title ? page.getByTitle(c.title, { exact: true }) : c.text ? page.getByRole("button", { name: c.text, exact: true }) : page.locator(c.css);
    await target.first().click();
  }
  if (step.select) await page.locator(step.select.css).selectOption(step.select.value);
  if (step.clickWorld) {
    const [x, y] = await page.evaluate(toScreen, step.clickWorld);
    if (step.shift) await page.keyboard.down("Shift");
    await page.mouse.click(x, y);
    if (step.shift) await page.keyboard.up("Shift");
  }
  if (step.loop || step.stroke) {
    let path;
    if (step.loop) {
      const [cx, cy] = await page.evaluate(toScreen, step.loop);
      path = Array.from({ length: 41 }, (_, i) => [cx + step.r * Math.cos((i / 40) * 2 * Math.PI), cy + step.r * Math.sin((i / 40) * 2 * Math.PI)]);
    } else {
      path = [];
      for (const p of step.stroke) path.push(await page.evaluate(toScreen, p));
    }
    await page.mouse.move(path[0][0], path[0][1]);
    await page.mouse.down();
    for (const [x, y] of path.slice(1)) await page.mouse.move(x, y, { steps: step.loop ? 1 : 8 });
    await page.mouse.up();
  }
  if (step.type) {
    await page.waitForTimeout(200);
    await page.keyboard.type(step.type);
    if (step.enter) await page.keyboard.press("Enter");
  }
  if (step.view || step.ortho) {
    await page.evaluate((s) => {
      const r = window.__tekto.owner.renderer;
      if (s.ortho) r.setProjection("orthographic");
      if (s.view) r.setView(s.view, { animate: false });
      r.frame();
    }, step);
  }
  await page.waitForTimeout(step.wait ?? 400);
}

/**
 * In the page: numbered discs over the interface, for a legend under the picture. A marker is
 * `{ n, at: "css", text }` — the first visible element matching the selector (whose text starts
 * with `text`), at `ax`, `ay` across it (0…1, default its middle) plus `dx`, `dy` pixels — or
 * `{ n, world: [x, y, z] }`, a point of the model.
 */
function placeMarkers([markers, size]) {
  const shown = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  for (const m of markers) {
    let x, y;
    if (m.world) {
      const r = window.__tekto.owner.renderer, c = r.canvasEl.getBoundingClientRect(), p = r.worldToScreen({ x: m.world[0], y: m.world[1], z: m.world[2] });
      [x, y] = [c.left + p.x, c.top + p.y];
    } else {
      const el = [...document.querySelectorAll(m.at)].find((e) => shown(e) && (!m.text || e.textContent.trim().startsWith(m.text)));
      if (!el) throw new Error(`marker ${m.n}: nothing shown matches ${m.at}${m.text ? ` "${m.text}"` : ""}`);
      const r = el.getBoundingClientRect();
      [x, y] = [r.left + r.width * (m.ax ?? 0.5), r.top + r.height * (m.ay ?? 0.5)];
    }
    const d = document.createElement("div");
    d.dataset.docMarker = String(m.n);
    d.textContent = String(m.n);
    d.style.cssText = `position:fixed;left:${x + (m.dx ?? 0) - size / 2}px;top:${y + (m.dy ?? 0) - size / 2}px;width:${size}px;height:${size}px;`
      + `box-sizing:border-box;border-radius:50%;background:#fff;color:#11131a;border:${size / 11}px solid #11131a;z-index:2147483647;`
      + `display:flex;align-items:center;justify-content:center;font:700 ${size * 0.55}px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;`
      + "box-shadow:0 1px 5px rgba(0,0,0,.6);pointer-events:none;";
    document.body.appendChild(d);
  }
}

/** In the page: the box of one element with `pad` pixels round it ([left, top, right, bottom] or one number). */
function clipAround([selector, pad]) {
  const r = document.querySelector(selector).getBoundingClientRect();
  const [l, t, rr, b] = Array.isArray(pad) ? pad : [pad, pad, pad, pad];
  return { x: r.left - l, y: r.top - t, width: r.width + l + rr, height: r.height + t + b };
}

fs.mkdirSync(OUT, { recursive: true });
const launchArgs = process.platform === "darwin" ? ["--use-angle=metal", "--enable-gpu"] : [];
const browser = await chromium.launch({ args: launchArgs });
const encoder = await browser.newPage();
let failed = 0;

for (const shot of SHOTS) {
  if (ONLY?.length && !ONLY.includes(shot.name)) continue;
  const [vw, vh] = shot.viewport ?? [1600, 1000];
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: shot.scale ?? (shot.o.line ? 1 : 2) });   // a line drawing at the size it is shown: its lines stay a pixel wide
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  try {
    await page.goto(`${BASE}/testbench.html?page=${shot.page}${shot.query ?? ""}`);
    await page.waitForFunction(() => window.__tekto?.owner, null, { timeout: 30000 });
    await page.waitForTimeout(SETTLE_MS);
    for (const step of shot.before ?? []) {          // edits a person would make first: buttons, then params
      if (step.click) await page.getByRole("button", { name: step.click, exact: true }).click();
      if (step.params) await page.evaluate((p) => window.__tekto.setParams(p), step.params);
      await page.waitForTimeout(150);
    }
    await page.evaluate(look, shot.o);
    if (shot.o.back) {
      await page.waitForTimeout(SETTLE_MS);
      await page.evaluate(stepBack, shot.o.back);
    }
    await page.evaluate(finish, shot.o);
    if (shot.clicks) {
      const box = await page.locator("canvas").first().boundingBox();
      for (const [u, v] of shot.clicks) await page.mouse.click(box.x + u * box.width, box.y + v * box.height);
    }
    if (shot.notes) await addNotes(page);
    if (shot.steps) {
      await page.locator('[data-tekto-steps="pill"]').click();
      await page.locator(`[data-tekto-steps="panel"] [data-step="${shot.steps}"]`).click();
    }
    if (shot.ui) {
      await page.waitForTimeout(SETTLE_MS);          // the camera at rest before a click on the model
      for (const step of shot.ui) await act(page, step);
    }
    await page.waitForTimeout(shot.wait ?? 2500);
    if (shot.markers) await page.evaluate(placeMarkers, [shot.markers, shot.markerSize ?? 24]);
    // The view only, without the testbench's bar; the steps and notes shots keep the whole page.
    const clip = shot.crop === false ? undefined : shot.clip ? await page.evaluate(clipAround, [shot.clip, shot.pad ?? 8]) : await page.evaluate(() => {
      const el = (window.__tekto.owner.renderer?.canvasEl ?? document.querySelector("canvas")).parentElement;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    const png = await page.screenshot({ ...(clip ? { clip } : {}) });
    const webp = await encoder.evaluate(toWebp, [png.toString("base64"), WIDTH, QUALITY]);
    const file = path.join(OUT, `${shot.name}.webp`);
    fs.writeFileSync(file, Buffer.from(webp, "base64"));
    const kb = Math.round(fs.statSync(file).size / 1024);
    if (errors.length) failed++;
    console.log(`${shot.name.padEnd(22)} ${String(kb).padStart(4)} KB${errors.length ? `  errors: ${errors.join(" | ").slice(0, 200)}` : ""}`);
  } catch (e) {
    failed++;
    console.log(`${shot.name.padEnd(22)} failed: ${String(e).slice(0, 200)}`);
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
