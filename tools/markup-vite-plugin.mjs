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
    configureServer(server) {
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
