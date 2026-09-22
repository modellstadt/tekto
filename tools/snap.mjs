#!/usr/bin/env node
/**
 * snap — capture a tekto sketch the way a person sees it, for an agent.
 *
 * Opens a running dev-server page in headless Chrome, optionally sets params and
 * camera, and calls `window.__tekto.snapshot()`. The bundle goes through the same
 * dev-server plugin as the ✎ Markup button, so it lands in `.tekto/markup/<stamp>-snap/`
 * (and `.tekto/markup/latest/`). Console errors from the page are printed too.
 *
 *   node tools/snap.mjs "http://localhost:5173/testbench.html?page=primitives"
 *        [--params '{"Radius":2}'] [--camera 8,6,10[,0,0,0]] [--size 1400x900]
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
const url = args.find((a) => !a.startsWith("--") && !isFlagValue(a));
const flag = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
function isFlagValue(a) { const i = args.indexOf(a); return i > 0 && args[i - 1].startsWith("--"); }
if (!url) { console.error("usage: snap.mjs <url> [--params json] [--camera x,y,z[,tx,ty,tz]] [--size WxH] [--note text] [--wait ms]"); process.exit(2); }

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

const cleanup = () => { try { proc.kill(); } catch {} fs.rmSync(profile, { recursive: true, force: true }); };
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

  cdp.on("Runtime.exceptionThrown", (p) => console.error("[page exception]", p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text));
  cdp.on("Runtime.consoleAPICalled", (p) => {
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
    if (Date.now() - t0 > 30000) throw new Error("page never exposed window.__tekto (is it a 3D sketch()? is the dev server running?)");
    await sleep(200);
  }
  if (flag("params")) await evaluate(`window.__tekto.setParams(${flag("params")})`);
  if (flag("camera")) {
    const c = flag("camera").split(",").map(Number);
    await evaluate(`window.__tekto.camera(${JSON.stringify(c.slice(0, 3))}, ${c.length >= 6 ? JSON.stringify(c.slice(3, 6)) : "undefined"})`);
  }
  await sleep(wait);

  const out = await evaluate(`window.__tekto.snapshot({ label: "snap", note: ${JSON.stringify(flag("note") ?? "")} })
    .then(b => ({ dir: b.dir, groups: b.markup.scene.groups.length, shown: b.markup.scene.shownObjects }))`);
  if (!out.dir) throw new Error("snapshot was not saved — is tools/markup-vite-plugin.mjs in the dev server's vite config?");
  console.log(`${out.dir}  (${out.shown} objects in ${out.groups} groups)`);
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
