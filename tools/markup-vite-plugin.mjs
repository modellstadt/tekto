/**
 * Vite dev-server plugin: receives markup bundles from the ✎ Markup overlay
 * (src/sketch/Markup.ts) and writes them to disk for an agent to read.
 *
 *   .tekto/markup/<stamp>-<label>/{view.png, clean.png, markup.json}
 *   .tekto/markup/latest/          ← copy of the newest bundle
 *
 * It also turns the raw stack positions the browser recorded ("http://…/main.ts?t=1:40:9")
 * into source lines ("apps/stair/main.ts:212") using the dev server's own source maps —
 * browsers don't apply source maps to Error.stack.
 *
 * And it relays calls from outside the page into the tab a person has open, so an agent can
 * read and edit an app's shared document (`agentDoc`), set controls, take a snapshot:
 *
 *   POST /__tekto/agent/call   {"op": "apply", "args": {"patch": {…}, "label": "…"}}  → {"result": …}
 *   GET  /__tekto/agent/status                                                       → the open pages
 *
 * The page listens on `/__tekto/agent/events` (the plugin marks it with a meta tag) and
 * answers on `/__tekto/agent/result`; the newest page to connect takes the calls.
 * `tools/mcp.mjs` is an MCP server over these calls.
 *
 * Usage (vite.config.mjs):
 *   import tektoMarkup from "tekto/markup-vite";
 *   export default { plugins: [tektoMarkup()] };
 */
import fs from "node:fs";
import path from "node:path";

export default function tektoMarkup(opts = {}) {
  const outRoot = path.resolve(opts.dir ?? ".tekto/markup");
  return {
    name: "tekto-markup",
    apply: "serve",
    // Tells the page the relay is here (see AgentBridge.connectRelay): dev only, like the plugin.
    transformIndexHtml(html) {
      return { html, tags: [{ tag: "meta", attrs: { name: "tekto-agent-relay", content: RELAY }, injectTo: "head" }] };
    },
    configureServer(server) {
      server.middlewares.use(RELAY, agentRelay(server));
      server.middlewares.use("/__tekto/markup", (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; return res.end(); }
        let body = "";
        req.setEncoding("utf8");
        req.on("data", (c) => { body += c; });
        req.on("end", async () => {
          try {
            const { label = "sketch", markup, viewPng, cleanPng } = JSON.parse(body);
            await remapSources(server, markup);
            const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const dir = path.join(outRoot, `${stamp}-${String(label).replace(/[^\w-]/g, "")}`);
            writeBundle(dir, markup, viewPng, cleanPng);
            const latest = path.join(outRoot, "latest");
            fs.rmSync(latest, { recursive: true, force: true });
            writeBundle(latest, { ...markup, bundle: path.relative(process.cwd(), dir) }, viewPng, cleanPng);
            const rel = path.relative(process.cwd(), dir);
            server.config.logger.info(`[tekto-markup] saved ${rel}`);
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ dir: rel }));
          } catch (e) {
            res.statusCode = 500;
            res.end(String(e?.stack ?? e));
          }
        });
      });
    },
  };
}

const RELAY = "/__tekto/agent";

/** The relay's routes: events (the page listens), result (the page answers), call and status (agents). */
function agentRelay(server) {
  const pages = [];                       // connected pages, oldest first: { res, title, url, since }
  const waiting = new Map();              // call id → { done, timer }
  let next = 1;
  const json = (res, status, body) => { res.statusCode = status; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(body)); };

  return (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const route = url.pathname;
    if (req.method === "GET" && route === "/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
      res.write(": tekto agent relay\n\n");
      const page = { res, title: url.searchParams.get("title") ?? "", url: url.searchParams.get("url") ?? "", since: new Date().toISOString() };
      pages.push(page);
      const beat = setInterval(() => res.write(": beat\n\n"), 25000);
      req.on("close", () => { clearInterval(beat); pages.splice(pages.indexOf(page), 1); });
      return;
    }
    if (req.method === "GET" && route === "/status") {
      return json(res, 200, { tekto: true, pages: pages.map(({ title, url, since }) => ({ title, url, since })) });
    }
    if (req.method !== "POST") return json(res, 405, { error: "GET /events, GET /status, POST /call, POST /result" });
    readBody(req).then((text) => {
      let body;
      try { body = JSON.parse(text || "{}"); } catch { return json(res, 400, { error: "the body is not JSON" }); }
      if (route === "/result") {
        const w = waiting.get(String(body.id));
        if (w) { clearTimeout(w.timer); waiting.delete(String(body.id)); w.done(body); }
        return json(res, 200, { ok: true });
      }
      if (route === "/call") {
        const page = pages[pages.length - 1];
        if (!page) return json(res, 503, { error: "No tekto page is open on this dev server: open the app in a browser first." });
        const id = String(next++);
        const timeoutMs = Number(body.timeoutMs) > 0 ? Number(body.timeoutMs) : 30000;
        const timer = setTimeout(() => {
          waiting.delete(id);
          json(res, 504, { error: `The page "${page.title}" did not answer "${body.op}" within ${timeoutMs} ms.` });
        }, timeoutMs);
        waiting.set(id, { timer, done: (r) => (r.error !== undefined ? json(res, 500, { error: r.error }) : json(res, 200, { result: r.result, page: page.title })) });
        page.res.write(`event: call\ndata: ${JSON.stringify({ id, op: body.op, args: body.args ?? {} })}\n\n`);
        server.config.logger.info(`[tekto-agent] ${body.op} → ${page.title || page.url}`);
        return;
      }
      json(res, 404, { error: `no route ${route}` });
    }, (e) => json(res, 500, { error: String(e) }));
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (c) => { body += c; });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function writeBundle(dir, markup, viewPng, cleanPng) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "markup.json"), toJson(markup));
  fs.writeFileSync(path.join(dir, "view.png"), Buffer.from(viewPng.split(",")[1], "base64"));
  fs.writeFileSync(path.join(dir, "clean.png"), Buffer.from(cleanPng.split(",")[1], "base64"));
}

/** Pretty JSON, but short number arrays (points, bounds, ids) stay on one line. */
function toJson(v) {
  return JSON.stringify(v, null, 2).replace(/\[\s*([-\d.e,\s"\w]*?)\s*\]/g, (m, inner) =>
    inner.length < 160 && !inner.includes("{") ? `[${inner.split(/,\s*/).join(", ")}]` : m);
}

// ── Stack position → source line ─────────────────────────────────────────

/** Rewrite every `src` field in the markup (marks and scene summary) in place. */
async function remapSources(server, markup) {
  const cache = new Map();
  const map = async (raw) => {
    if (!cache.has(raw)) cache.set(raw, await resolveSite(server, raw));
    return cache.get(raw);
  };
  const walk = async (v) => {
    if (Array.isArray(v)) { for (const x of v) await walk(x); return; }
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (k === "src" && typeof x === "string") v[k] = await map(x);
      else await walk(x);
    }
  };
  await walk(markup);
  // Summaries were written in the browser with raw sites; patch them too.
  for (const m of markup.marks ?? []) {
    if (typeof m.summary === "string") {
      for (const [raw, nice] of cache) m.summary = m.summary.split(raw).join(nice);
    }
  }
}

async function resolveSite(server, raw) {
  const m = raw.match(/^(.*):(\d+):(\d+)$/);
  if (!m) return raw;
  const [, url, line, col] = m;
  let pathname;
  try { pathname = new URL(url).pathname; } catch { return raw; }
  const mod = (await server.moduleGraph.getModuleByUrl(pathname).catch(() => null))
    ?? [...(server.moduleGraph.urlToModuleMap?.values?.() ?? [])].find((x) => x.url.split("?")[0] === pathname);
  const file = mod?.file ?? pathname;
  const rel = path.relative(process.cwd(), file);
  const sm = mod?.transformResult?.map;
  if (!sm?.mappings) return `${rel}:${line}`;
  const orig = lookup(sm.mappings, +line - 1, +col - 1);
  return orig != null ? `${rel}:${orig + 1}` : `${rel}:${line}`;
}

/** Original line (0-based) for a generated line/column, from a v3 source map's `mappings`. */
function lookup(mappings, genLine, genCol) {
  const lines = mappings.split(";");
  let srcLine = 0, srcCol = 0, srcIdx = 0, name = 0;
  let found = null;
  for (let l = 0; l < lines.length && l <= genLine; l++) {
    let gCol = 0;
    let best = null;
    for (const seg of lines[l].split(",")) {
      if (!seg) continue;
      const v = decodeVlq(seg);
      gCol += v[0];
      if (v.length >= 4) { srcIdx += v[1]; srcLine += v[2]; srcCol += v[3]; }
      if (v.length >= 5) name += v[4];
      if (l === genLine && v.length >= 4 && gCol <= genCol) best = srcLine;
      if (l === genLine && best == null && v.length >= 4) best = srcLine; // column before first segment
    }
    if (l === genLine) found = best;
  }
  return found;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function decodeVlq(seg) {
  const out = [];
  let value = 0, shift = 0;
  for (const ch of seg) {
    const d = B64.indexOf(ch);
    value += (d & 31) << shift;
    if (d & 32) { shift += 5; continue; }
    out.push(value & 1 ? -(value >>> 1) : value >>> 1);
    value = 0; shift = 0;
  }
  return out;
}
