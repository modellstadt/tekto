#!/usr/bin/env node
/**
 * gen-llms — writes llms.txt and llms-full.txt, the files an agent reads before using tekto.
 *
 *   llms.txt       what tekto is, the README's "Start here" block (names, a "use Y, not Z"
 *                  table, five rules), the entry points and where to read more.
 *   llms-full.txt  every export of every entry with its kind and the first sentence of its
 *                  JSDoc; namespaces and classes list their members. Generated from the
 *                  TypeScript sources, so it cannot drift from the code.
 *
 * `--check` (CI) regenerates in memory and fails if the committed files differ, and fails
 * if a bare `Name` in the Start-here block is not an export — so the docs an agent trusts
 * stay true. Run `node tools/gen-llms.mjs` after changing exports, JSDoc or the README block.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const ENTRIES = [
  { spec: "tekto/core", file: "src/core.ts", about: "geometry and data — no three.js, no DOM; runs in Node, workers and tests" },
  { spec: "tekto", file: "src/index.ts", about: "everything in tekto/core plus the browser layer: renderers, panels, sketch(), appShell()" },
  { spec: "tekto/2d", file: "src/2d.ts", about: "sketch2d and the 2D geometry a first sketch needs — no three.js" },
];

// ── Read the exports with the type checker ──────────────────────────────────

const cfg = ts.getParsedCommandLineOfConfigFile(path.join(root, "tsconfig.json"), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
const program = ts.createProgram(ENTRIES.map(e => path.join(root, e.file)), cfg.options);
const checker = program.getTypeChecker();

const firstSentence = (text) => {
  const t = text.replace(/\{@link\s+([^}|\s]+)[^}]*\}/g, "$1").replace(/\s+/g, " ").trim();
  const m = t.match(/^(.+?[.!?])(\s|$)/);
  const s = (m ? m[1] : t);
  return s.length > 200 ? s.slice(0, 197) + "…" : s;
};
const docOf = (sym) => firstSentence(ts.displayPartsToString(sym.getDocumentationComment(checker)));

function kindOf(sym) {
  const d = sym.declarations?.[0];
  if (!d) return "value";
  if (ts.isClassDeclaration(d)) return "class";
  if (ts.isFunctionDeclaration(d)) return "function";
  if (ts.isInterfaceDeclaration(d)) return "interface";
  if (ts.isTypeAliasDeclaration(d)) return "type";
  if (ts.isEnumDeclaration(d)) return "enum";
  if (ts.isVariableDeclaration(d)) return d.initializer && ts.isObjectLiteralExpression(d.initializer) ? "namespace" : "const";
  return "value";
}

/** Public member names of a class or a namespace object, in source order. */
function membersOf(sym, kind) {
  const d = sym.declarations?.[0];
  if (kind === "class" && d && ts.isClassDeclaration(d)) {
    return d.members
      .filter(m => (ts.isMethodDeclaration(m) || ts.isGetAccessorDeclaration(m) || ts.isPropertyDeclaration(m)) && m.name && ts.isIdentifier(m.name))
      .filter(m => !(ts.getCombinedModifierFlags(m) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) && !m.name.text.startsWith("_"))
      .map(m => (ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static ? "static " : "") + m.name.text + (ts.isMethodDeclaration(m) ? "()" : ""));
  }
  if (kind === "namespace" && d && ts.isVariableDeclaration(d) && d.initializer && ts.isObjectLiteralExpression(d.initializer)) {
    return d.initializer.properties
      .map(p => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text + (ts.isMethodDeclaration(p) ? "()" : "") : null))
      .filter(Boolean)
      .filter(n => !n.startsWith("_"));
  }
  return [];
}

function exportsOf(file) {
  const sf = program.getSourceFile(path.join(root, file));
  const modSym = checker.getSymbolAtLocation(sf);
  return checker.getExportsOfModule(modSym).map(exp => {
    const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
    const kind = kindOf(sym);
    return { name: exp.name, kind, doc: docOf(sym), members: membersOf(sym, kind) };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

const byEntry = Object.fromEntries(ENTRIES.map(e => [e.spec, exportsOf(e.file)]));
const coreNames = new Set(byEntry["tekto/core"].map(x => x.name));
const allNames = new Set(Object.values(byEntry).flat().map(x => x.name));

// ── The README's Start-here block ───────────────────────────────────────────

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const block = readme.match(/<!-- start-here[^>]*-->\n([\s\S]*?)<!-- \/start-here -->/);
if (!block) { console.error("README.md has no <!-- start-here --> … <!-- /start-here --> block"); process.exit(1); }
const startHere = block[1].trim();
// Every bare `Identifier` in the block must be an export (browser globals excepted), so a
// renamed or removed name can't linger in the one page agents read first.
const NOT_EXPORTS = new Set(["localStorage"]);
const stale = [...new Set([...startHere.matchAll(/`([A-Za-z_$][A-Za-z0-9_$]*)`/g)].map(m => m[1]))]
  .filter(n => !allNames.has(n) && !NOT_EXPORTS.has(n));

// ── Render ──────────────────────────────────────────────────────────────────

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const line = (x) => `- \`${x.name}\` (${x.kind})${x.doc ? ": " + x.doc : ""}${x.members.length ? `\n  members: ${x.members.join(", ")}` : ""}`;
const VALUE = new Set(["class", "function", "namespace", "const", "value", "enum"]);

const llms = `# tekto

> ${pkg.description}

tekto ${pkg.version}. One function becomes an interactive CAD app in the browser; people point at what to change on the viewport (✎ Markup) and agents check their own work (\`npm run snap\`). Docs: [README](README.md) · [agent rules (CLAUDE.md)](CLAUDE.md) · [changelog](CHANGELOG.md) · [full API index (llms-full.txt)](llms-full.txt) · examples in [playground/pages](playground/pages/).

## Start here

${startHere}

## Entry points

${ENTRIES.map(e => `- \`import … from "${e.spec}"\` — ${e.about} (${byEntry[e.spec].filter(x => VALUE.has(x.kind)).length} values, ${byEntry[e.spec].filter(x => !VALUE.has(x.kind)).length} types)`).join("\n")}
- \`import … from "tekto/react"\` — React components (needs react, react-dom)

## Read more

- [README → Two scene models](README.md#two-scene-models-rebuilt-vs-retained): rebuilt (\`sketch\`) or retained (\`appShell\`).
- [README → One mesh](README.md#one-mesh): the \`Mesh\` class — ids, connectivity, arrays, \`validate()\`.
- [README → Markup](README.md#markup--instructions-for-an-ai-drawn-on-the-view): reading a person's marks; \`snap\` for your own.
- [CLAUDE.md](CLAUDE.md): conventions, gotchas and what never to do without asking.
`;

const full = `# tekto ${pkg.version} — API index

Generated by tools/gen-llms.mjs from the TypeScript sources: every export, its kind and the
first sentence of its JSDoc; classes and namespaces list their public members. For how to
choose between them, read llms.txt first.

${ENTRIES.map(e => {
  const list = e.spec === "tekto" ? byEntry[e.spec].filter(x => !coreNames.has(x.name)) : byEntry[e.spec];
  const values = list.filter(x => VALUE.has(x.kind)), types = list.filter(x => !VALUE.has(x.kind));
  const heading = e.spec === "tekto" ? `${e.spec} — ${e.about} (below: the browser layer only)` : `${e.spec} — ${e.about}`;
  return `## ${heading}\n\n${values.map(line).join("\n")}\n\nTypes: ${types.map(x => `\`${x.name}\``).join(", ") || "none"}\n`;
}).join("\n")}`;

// ── Write or check ──────────────────────────────────────────────────────────

let failed = false;
if (stale.length) { console.error(`✗ README Start-here names that are not exports: ${stale.join(", ")}`); failed = true; }
for (const [file, text] of [["llms.txt", llms], ["llms-full.txt", full]]) {
  const p = path.join(root, file);
  if (check) {
    const cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
    if (cur !== text) { console.error(`✗ ${file} is out of date — run: node tools/gen-llms.mjs`); failed = true; }
    else console.log(`✓ ${file} matches the code`);
  } else {
    fs.writeFileSync(p, text);
    console.log(`wrote ${file} (${text.length} chars)`);
  }
}
if (failed) process.exit(1);
