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
 */
const SHOTS = [
  { name: "house", page: "house", o: { studio: true, sun: "morning", ao: true, back: 1.35 } },
  { name: "house-framing", page: "house", o: { studio: true, sun: "morning", ao: true, back: 1.35, params: { Framing: true } } },
  { name: "house-plan-cut", page: "house", o: { studio: true, ao: true, section: { axis: "z", coordinate: 4.2 }, camera: [[4, -5.5, 17], [5, 4, 2.4]] } },
  { name: "house-hidden-line", page: "house", o: { mode: "hiddenline", background: "#ffffff", back: 1.3 } },
  { name: "house-ghost-framing", page: "house", o: { mode: "ghost", studio: true, back: 1.3, params: { Framing: true } } },
  { name: "house-sunset", page: "house", o: { studio: true, sun: "sunset", ao: true, back: 1.35 } },
  { name: "roof-hip", page: "roofs", o: { studio: true, sun: "sunset", ao: true, back: 1.2, params: { Kind: "hip" } } },
  { name: "roof-gable", page: "roofs", o: { studio: true, sun: "morning", ao: true, back: 1.35, params: { Kind: "gable" } } },
  { name: "floor-stair-well", page: "framed-floor", o: { studio: true, ao: true } },
  { name: "timber-frame", page: "timber", o: { studio: true, ao: true, back: 2.1, params: { Storeys: 3 } } },
  { name: "framed-wall-callouts", page: "framed-wall", o: { studio: true, ao: true, frame: false } },
  { name: "twisted-tower", page: "app-shell", o: { studio: true, sun: "sunset", ao: true, back: 1.15, params: { Floors: 24, "Twist (°)": 120 } } },
  { name: "site-editor", page: "site-editor", o: { studio: true, sun: "morning", ao: true, camera: [[27, -21, 19], [10, 5, 4]] },
    before: [12, 6, 9, 4, 15, 7, 10].flatMap((h) => [{ click: "Add block" }, { params: { Height: h } }]) },
  { name: "primitives", page: "primitives", o: { studio: true, ao: true } },
  { name: "mesh-factory", page: "mesh-factory", o: { studio: true, ao: true } },
  { name: "mesh-ops", page: "mesh-ops", o: { studio: true, ao: true } },
  { name: "transforms", page: "transforms", o: { studio: true, ao: true } },
  { name: "lines-points", page: "lines-points", o: {} },
  { name: "booleans", page: "bsp-csg", o: { studio: true, ao: true, back: 0.55 } },
  { name: "nurbs", page: "nurbs-surfaces", o: { studio: true, ao: true } },
  { name: "curves", page: "curves", o: { frame: false } },
  { name: "streamlines", page: "streamlines", o: {} },
  { name: "planar-graph", page: "planar-graph", o: {} },
  { name: "voronoi", page: "voronoi", o: { frame: false } },
  { name: "circle-packing", page: "circle-packing", wait: 5000, o: {} },
  { name: "pointer-2d", page: "pointer-2d", clicks: [[0.3, 0.3], [0.62, 0.22], [0.75, 0.6], [0.5, 0.8], [0.25, 0.65]], o: {} },
  { name: "drawing-sheet", page: "drawing-sheet", o: { frame: false } },
  { name: "sketch-drawing", page: "sketch-drawing", o: { studio: true, ao: true, params: { Drawing: true }, frame: false } },
  { name: "dxf-3d", page: "dxf-3d", o: {} },
  { name: "shared-editing", page: "shared-editing", query: "&doc=doc-shots", o: { frame: false } },
  { name: "steps-panel", page: "steps", crop: false, steps: "massing", o: { studio: true, ao: true, camera: [[60, -70, 115], [60, 18, -22]] } },
  { name: "notes-with-claude", page: "house", query: "&agent-relay&tab=docshots", crop: false, notes: true, o: { studio: true, sun: "morning", ao: true, camera: [[15.5, -10.5, 8.5], [6.5, 4, 3]] } },
];

/** In the page: light, mode, section, params and camera, as a person would set them. */
function look(o) {
  const t = window.__tekto, r = t.owner.renderer, s = t.owner.scene;
  if (o.params) t.setParams(o.params);
  if (!r) return;                                  // sketch2d: a canvas, nothing to light
  if (o.studio) s.setLightingMode("studio");
  if (o.background) { r.setBackground(o.background); r.setOverlays({ grid: false }); }   // before the mode
  if (o.mode) s.setRenderMode(o.mode);
  if (o.sun) r.setSunPreset(o.sun);
  if (o.ao) r.setAmbientOcclusion(true);
  r.setOverlays({ wireframe: false });
  if (o.section) r.setSection(o.section);
  if (o.camera) t.camera(o.camera[0], o.camera[1]);
  else if (o.frame !== false) r.frame();
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

fs.mkdirSync(OUT, { recursive: true });
const launchArgs = process.platform === "darwin" ? ["--use-angle=metal", "--enable-gpu"] : [];
const browser = await chromium.launch({ args: launchArgs });
const encoder = await browser.newPage();
let failed = 0;

for (const shot of SHOTS) {
  if (ONLY?.length && !ONLY.includes(shot.name)) continue;
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
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
    if (shot.clicks) {
      const box = await page.locator("canvas").first().boundingBox();
      for (const [u, v] of shot.clicks) await page.mouse.click(box.x + u * box.width, box.y + v * box.height);
    }
    if (shot.notes) await addNotes(page);
    if (shot.steps) {
      await page.locator('[data-tekto-steps="pill"]').click();
      await page.locator(`[data-tekto-steps="panel"] [data-step="${shot.steps}"]`).click();
    }
    await page.waitForTimeout(shot.wait ?? 2500);
    // The view only, without the testbench's bar; the steps and notes shots keep the whole page.
    const clip = shot.crop === false ? undefined : await page.evaluate(() => {
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
