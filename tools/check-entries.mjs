#!/usr/bin/env node
/**
 * check-entries — "tekto/core" and "tekto/2d" promise to run without three.js or React
 * (Node scripts, workers, tests, a first 2D sketch). This keeps the promise honest.
 *
 *  1. Walk every file each entry loads in dist/ (ESM, CJS and the .d.ts declarations) and
 *     fail on any static import of three, react or react-dom. Dynamic `import("web-ifc")`
 *     is lazy and allowed.
 *  2. Import both entries in this Node process with `three` and `react` made unresolvable,
 *     and check a few exports really work.
 *
 * Run after `npm run build`: `node tools/check-entries.mjs` (CI does).
 */
import fs from "node:fs";
import path from "node:path";
import module from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const FORBIDDEN = /^(three|react|react-dom)(\/|$)/;
const ENTRIES = ["core", "2d"];
let failed = false;
const fail = (msg) => { console.error("✗ " + msg); failed = true; };

// Static imports only: `import … from "x"`, `export … from "x"`, `import "x"`, `require("x")`.
const SPEC = /(?:^|[\s;])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|[\s;])import\s*['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/gm;

function closure(file) {
  const seen = new Set(), bare = new Map();
  const visit = (f) => {
    if (seen.has(f)) return;
    seen.add(f);
    // Skip comment lines: JSDoc examples (` *   import { sketch2d } from "tekto"`) are not imports.
    const code = fs.readFileSync(f, "utf8").split("\n").filter(l => !/^\s*(\*|\/\/|\/\*)/.test(l)).join("\n");
    for (const m of code.matchAll(SPEC)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (spec.startsWith(".")) {
        const next = path.resolve(path.dirname(f), spec);
        // A .d.ts names its chunks "./x.js", a .d.mts "./x.mjs": both mean the declaration file.
        const hit = [next, next + ".mjs", next + ".js", next + ".d.ts", next + ".d.mts",
          next.replace(/\.js$/, ".d.ts"), next.replace(/\.mjs$/, ".d.mts")]
          .find(c => fs.existsSync(c) && fs.statSync(c).isFile());
        if (hit) visit(hit); else fail(`${path.relative(dist, f)} imports ${spec}, which is not in dist/`);
      } else if (!bare.has(spec)) bare.set(spec, path.relative(dist, f));
    }
  };
  visit(file);
  return { files: seen.size, bare };
}

for (const entry of ENTRIES) {
  for (const ext of [".mjs", ".js", ".d.ts", ".d.mts"]) {
    const file = path.join(dist, entry + ext);
    if (!fs.existsSync(file)) { fail(`dist/${entry}${ext} missing — run npm run build`); continue; }
    const { files, bare } = closure(file);
    const bad = [...bare].filter(([s]) => FORBIDDEN.test(s));
    for (const [spec, from] of bad) fail(`tekto/${entry} (${ext}) reaches "${spec}" via dist/${from}`);
    if (!bad.length) console.log(`✓ tekto/${entry} ${ext.padEnd(6)} ${files} file(s), no three/react (other deps: ${[...bare.keys()].join(", ") || "none"})`);
  }
}

// Runtime: make three/react unresolvable for this process, then load the entries.
if (typeof module.registerHooks === "function") {
  module.registerHooks({
    resolve(specifier, context, next) {
      if (FORBIDDEN.test(specifier)) throw new Error(`blocked by check-entries: ${specifier}`);
      return next(specifier, context);
    },
  });
  const core = await import(pathToFileURL(path.join(dist, "core.mjs")).href);
  const v = core.MeshFactory.box(1, 2, 3).volume();
  if (Math.abs(v - 6) > 1e-9) fail(`tekto/core: box volume ${v}, expected 6`);
  const arc = new core.NurbsCurve([new core.Vec3(1, 0, 0), new core.Vec3(1, 1, 0), new core.Vec3(0, 1, 0)], 2, [0, 0, 0, 1, 1, 1], [1, Math.SQRT1_2, 1]);
  if (Math.abs(arc.getPoint(0.5).len() - 1) > 1e-9) fail("tekto/core: NURBS arc off the circle");
  if (!core.writeDxf3D({ lines: [{ layer: "a", start: new core.Vec3(0, 0, 0), end: new core.Vec3(1, 0, 0) }] }).includes("LINE")) fail("tekto/core: writeDxf3D");
  const twoD = await import(pathToFileURL(path.join(dist, "2d.mjs")).href);
  if (typeof twoD.sketch2d !== "function" || typeof twoD.PolygonBool?.union !== "function") fail("tekto/2d: sketch2d / PolygonBool missing");
  const cjs = module.createRequire(import.meta.url)(path.join(dist, "core.js"));
  if (typeof cjs.Mesh !== "function") fail("tekto/core (CJS): Mesh missing");
  console.log(`✓ tekto/core and tekto/2d load and run in Node with three and react blocked (${Object.keys(core).length} and ${Object.keys(twoD).length} exports)`);
} else {
  console.log("· runtime check skipped: this Node has no module.registerHooks (needs ≥ 22.15)");
}

if (failed) process.exit(1);
