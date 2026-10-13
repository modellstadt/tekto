#!/usr/bin/env node
/**
 * snap — capture a tekto sketch the way a person sees it, for an agent.
 *
 * Opens a running dev-server page in headless Chrome, optionally sets params and
 * camera, and calls `window.__tekto.snapshot()`. The bundle goes through the same
 * dev-server plugin as the ✎ Markup button, so it lands in `.tekto/markup/<stamp>-snap/`
 * (and `.tekto/markup/latest/`). Console errors from the page are printed too.
 *
 *   node tools/snap.mjs "http://localhost:5173/testbench.html?page=mesh-factory"
 *        [--params '{"Subdivision Levels":2}'] [--camera 8,6,10[,0,0,0]] [--size 1400x900]
 *
 * --params names controls by label (case-insensitive), "Group:Label" when two share a
 * label, or the internal key; a name that matches nothing fails the run and lists the
 * page's controls. Works for sketch(), sketch2d() and appShell() apps (--camera: 3D only).
 * The run exits 1 when the page threw or logged an error (--allow-errors accepts that);
 * the app's log lines are printed, and markup.json carries them and the errors.
 *        [--note "after raising the riser"] [--wait 800]
 *
 * No dependencies: talks to Chrome over the DevTools protocol with Node's WebSocket.
 * Set CHROME=/path/to/chrome if it is not in the usual place.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const BOOLEAN = new Set(["--allow-errors"]);
const isFlagValue = (a) => { const i = args.indexOf(a); return i > 0 && args[i - 1].startsWith("--") && !BOOLEAN.has(args[i - 1]); };
const url = args.find((a) => !a.startsWith("--") && !isFlagValue(a));
const flag = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const allowErrors = args.includes("--allow-errors");
if (!url) { console.error("usage: snap.mjs <url> [--params json] [--camera x,y,z[,tx,ty,tz]] [--size WxH] [--note text] [--wait ms] [--allow-errors]"); process.exit(2); }

const [W, H] = (flag("size") ?? "1400x900").split("x").map(Number);
const wait = +(flag("wait") ?? 600);

const chrome = process.env.CHROME ?? [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find((p) => fs.existsSync(p));
if (!chrome) { console.error("Chrome not found — set CHROME=/path/to/chrome"); process.exit(2); }

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "tekto-snap-"));
const proc = spawn(chrome, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`, "--hide-scrollbars", "--no-first-run",
  "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

// Chrome may still be writing its profile for a moment after the kill; a temp folder that
// lingers is harmless, a throw inside the exit handler is not (it masks the real exit code).
const cleanup = () => {
  try { proc.kill(); } catch {}
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
};
process.on("exit", cleanup);

try {
  const wsBrowser = await new Promise((resolve, reject) => {
    let buf = "";
    proc.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
    proc.on("exit", () => reject(new Error("Chrome exited:\n" + buf)));
    setTimeout(() => reject(new Error("Chrome did not start")), 15000);
  });
  const port = new URL(wsBrowser).port;
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const cdp = await connect(page.webSocketDebuggerUrl);

  let pageErrors = 0;   // exceptions and console.error during this run: they fail it
  cdp.on("Runtime.exceptionThrown", (p) => { pageErrors++; console.error("[page exception]", p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text); });
  cdp.on("Runtime.consoleAPICalled", (p) => {
    if (p.type === "error") pageErrors++;
    if (p.type === "error" || p.type === "warning") console.error(`[page ${p.type}]`, p.args.map((a) => a.value ?? a.description).join(" "));
  });
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Page.navigate", { url });

  const evaluate = async (expression) => {
    const r = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };

  const t0 = Date.now();
  while (!(await evaluate("!!window.__tekto").catch(() => false))) {
    if (Date.now() - t0 > 30000) throw new Error("page never exposed window.__tekto — is it a sketch(), sketch2d() or appShell() app, and is the dev server running?");
    await sleep(200);
  }
  if (flag("params")) {
    const r = await evaluate(`window.__tekto.setParams(${flag("params")})`);
    if (r && (r.unknown.length || r.ambiguous.length)) {
      const names = await evaluate("window.__tekto.paramNames ? window.__tekto.paramNames() : []");
      for (const n of r.unknown) console.error(`--params: no control named "${n}"`);
      for (const a of r.ambiguous) console.error(`--params: "${a.name}" matches ${a.keys.length} controls — write "Group:Label"`);
      console.error(`controls on this page: ${names.join(", ") || "(none)"}`);
      throw new Error("params not applied");
    }
  }
  if (flag("camera")) {
    if (!(await evaluate("typeof window.__tekto.camera === 'function'"))) throw new Error("--camera: this app has no 3D camera (sketch2d?)");
    const c = flag("camera").split(",").map(Number);
    await evaluate(`window.__tekto.camera(${JSON.stringify(c.slice(0, 3))}, ${c.length >= 6 ? JSON.stringify(c.slice(3, 6)) : "undefined"})`);
  }
  await sleep(wait);

  const out = await evaluate(`window.__tekto.snapshot({ label: "snap", note: ${JSON.stringify(flag("note") ?? "")} })
    .then(b => ({ dir: b.dir, harness: b.markup.harness, scene: b.markup.scene ? { groups: b.markup.scene.groups.length, shown: b.markup.scene.shownObjects,
                    meshesWithIssues: b.markup.scene.meshesWithIssues ?? 0, meshIssues: b.markup.scene.meshIssues ?? [] } : null,
                  logs: b.markup.logs ?? [], errors: b.markup.errors ?? [] }))`);
  if (!out.dir) throw new Error("snapshot was not saved — is tools/markup-vite-plugin.mjs in the dev server's vite config?");
  const what = out.scene ? `${out.scene.shown} objects in ${out.scene.groups} groups` : "2D canvas";
  console.log(`${out.dir}  (${out.harness ?? "sketch"}: ${what})`);
  for (const l of out.logs.slice(0, 20)) console.log(`  log  ${l.label}${l.value ? "  " + l.value : ""}`);
  // Mesh.validate() findings: printed, not fatal — an open or non-manifold mesh can be on purpose.
  if (out.scene?.meshesWithIssues) {
    console.log(`  ${out.scene.meshesWithIssues} mesh(es) with issues (markup.json → scene.meshIssues):`);
    for (const m of out.scene.meshIssues.slice(0, 5)) {
      console.log(`    ${m.label ?? m.layer ?? m.id}${m.src ? "  " + m.src : ""}: ${m.issues.join("; ")}`);
    }
  }
  // The app's own error record covers what happened before snap attached; CDP covers this run.
  const errs = Math.max(pageErrors, out.errors.length);
  if (errs && !allowErrors) {
    for (const e of out.errors.slice(0, 5)) console.error(`  error  ${e.split("\n")[0]}`);
    throw new Error(`the page reported ${errs} error(s) — the bundle is saved, but don't trust the picture (--allow-errors to accept)`);
  }
  cdp.close();
} catch (e) {
  console.error(String(e?.message ?? e));
  process.exitCode = 1;
} finally {
  cleanup();
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) listeners.get(msg.method)?.(msg.params);
  };
  return new Promise((resolve, reject) => {
    ws.onerror = reject;
    ws.onopen = () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id, method, params })); }),
      on: (method, fn) => listeners.set(method, fn),
      close: () => ws.close(),
    });
  });
}
