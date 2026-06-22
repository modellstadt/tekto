# Agent rules for editing this repo

Read this before you make changes. The companion document is [README.md](README.md), which is the canonical map of the library; this file is just the *editing rules* on top of it.

## Mission

This repo is the **public library**. It ships the library plus the playground/testbench.

Stand-alone applications that *consume* the library live in their own separate, independent repos and link back via `"tekto": "file:../tekto"`. Keep this repo to the library and its playground — if you find yourself wanting to add an `apps/` directory here, stop: an app belongs in its own consumer repo, not in the library.

This is a teaching/research toolkit, not a shipping product. The maintainer is iterating quickly on architectural-geometry experiments. Optimise for:
- **Readable diffs** over clever refactors.
- **One concrete change per request** — do not bundle unrelated cleanups unless asked.
- **Reading the surrounding code before editing.** The same concept (e.g. mesh) often has two names because of backward-compat aliases. See [README.md → Conventions / invariants](README.md#conventions--invariants).
- **Anything an outside consumer needs must be re-exported from `src/index.ts`.** Deep imports like `from "tekto/src/scene/Scene"` are forbidden — apps can only see the public surface. If you add a new module that an app will use, also add the export here. **Exception — the React layer:** React components/hooks are exported from `src/react.ts` (the separate `tekto/react` entry), *not* `src/index.ts`. This keeps the core `tekto` barrel React-free so non-React apps don't need react installed. Anything that imports `react` belongs in `src/react.ts`, never in the core barrel.

## The two things that catch agents out most

1. **Mesh has two names.** `ConnectedMesh` (Map-backed, edit-friendly) is also exported as `Mesh`. The other mesh — `Mesh` (typed arrays, render-friendly) — is exported as `FlatMesh` and `RenderMesh`. When reading code you will see all four names. Don't "fix" the aliases; check [src/index.ts](src/index.ts) before assuming a type. The old `core/mesh/Mesh.ts` and `core/mesh/MeshGen.ts` shims have been removed — `core/mesh/FlatMesh.ts` still exists but only holds the `FlatMeshGen` generators.
2. **The Sketch function re-runs end-to-end on every parameter change.** No memoisation, no diffing. If you put expensive work inside the function body, every slider drag re-runs it. One-shot work goes in button callbacks; cached state goes into module-scope variables.
3. **Lint = `tsconfig.lint.json`, not the default tsconfig.json.** The default config scopes to `src/` (for clean tsup declarations); the lint config widens the scope to `src + playground + tests`. Type errors in demos surface at `npm run lint`, *not* only at runtime in the browser. Always re-run `npm run lint` after touching anything under `playground/`.

## Vec immutability

`Vec2`/`Vec3`/`Vec4`/`Mat4` use `readonly` fields. All ops return new instances. There are a few intentional escape hatches — `(p as any).x = …` in `Algo.laplacianSmooth` and `translate`. Search the repo for `as any` before adding a new one; if you find a clean way to express the mutation in legal TS, prefer it.

## Coordinate convention

Z-up. XY is the ground plane. The `Top` camera preset is "looking down -Z, up=+Y". When emitting DXF or screen-space SVG, drop the Z.

## What to use, what to avoid

- **Use `MeshFactory`** for procedural meshes that need adjacency (e.g., subdivision, topology editing).
- **Use `FlatMeshGen`** for big rendered meshes (heightfields, large NURBS evaluations).
- **Use `sketch(...)`** to build a runnable demo. Don't reach for the React app shell unless you specifically need persistent state, multiple panels, or routing.
- **Avoid** importing `three` inside `src/` — it's an externalised peer dep. Add new Three.js calls in `src/render/ThreeRenderer.ts` and expose what you need through the renderer interface.
- **Avoid** adding new files when an existing file is a good home. The library prefers a handful of larger, well-organised modules over many tiny ones.

## Editing checklist

Before writing the edit:

- [ ] I've located the canonical file via `src/index.ts` or `README.md → Map of the Library`.
- [ ] I've read the surrounding 50–100 lines, not just the symbol I'm changing.
- [ ] I've checked whether the same concept has multiple names (`ConnectedMesh`/`Mesh`, `Mesh`/`FlatMesh`/`RenderMesh`).
- [ ] If touching a "known issue" function (see [README.md](README.md#known-issues--dont-reinvent-these)), I'm either avoiding it or actually fixing it.

After the edit:

- [ ] `npm run lint` (which is `tsc --noEmit -p tsconfig.lint.json`, covering `src/` + `playground/` + `tests/`) is clean.
- [ ] Affected tests pass (`npm test`). Add a test if the change is non-trivial *and* the rest of the module has tests; otherwise don't pad the suite.
- [ ] If the change touches the public API (anything exported from `src/index.ts`), I've updated the README's module map / common-tasks index.

## What to *never* do without asking

- **Run `git push`, `git push --force`, `git reset --hard`, `git checkout .`** — none of these. Even on feature branches.
- **Bypass hooks** (`--no-verify`, `--no-gpg-sign`). If a hook is wrong, fix the hook.
- **Reformat / re-style code that's not part of the diff.** The repo has no Prettier/ESLint config; the maintainer's existing style is the style.
- **Delete files** without listing them first and getting approval. Even removing dead exports.
- **Add a new dependency** without checking if the existing ones cover the use case. The library is deliberately small; growing the dependency footprint is a cost.

## Playground

The playground ([playground/pages/](playground/pages/)) is the canonical place to validate new library code. When you add a public API, add or update a playground page that exercises it. `npm run playground` boots the testbench.

### The shell pattern

The testbench ([playground/testbench.html](playground/testbench.html) + [.ts](playground/testbench.ts)) provides a top-bar shell that *every* sketch mounted into it inherits:

- **Brand · Page chooser** (left).
- **Render Mode** · **Lighting** · **Sun ▾** popover · **Export ▾** · **Import ▾** (right).

A sketch participates in the shell by:

- Letting the shell auto-detect a `data-shell="…"` container and suppress the sketch's own 44 px title bar. No code change needed if you mount via `sketch({ container })`.
- Calling `lab.registerExport({name, fileName, handler})` / `lab.registerImport({name, accept, handler})` to populate the menus. Sketches that don't register anything just hide those buttons.
- The shell drives the directional light via `SketchInstance.setSunDirection(direction)` based on the popover's date/lat/lon — sketches don't need their own sun controls. They CAN call `lab.setSunDirection(dir)` inside the sketch fn to override per-frame (animated daily cycles).

When you build a new custom app outside the testbench: copy the relevant CSS + popover blocks from `testbench.html`/`testbench.ts`. Future work could extract this into a `src/sketch/AppShell.ts` helper — not done yet.

### Lighting + shadows

Two presets toggled from the top bar:

- **Flat** (default) — `MeshPhongMaterial`, 3 cheap lights, no shadows, no tonemapping. Fast. Use for inspection.
- **Studio** — `MeshStandardMaterial` (PBR), one sun-style directional light with PCF-soft 2048² shadows on a 30 m frustum, ACES filmic tonemapping, sRGB output, an invisible `ShadowMaterial` ground plane that catches the contact shadows. ~2-3× slower per frame.

Shadow flags are applied in `addToThree` based on the current lighting mode, so sketch re-runs preserve shadow behaviour. `_makeMaterial(opts)` in `ThreeRenderer.ts` picks Phong vs Standard; if you add a new material site, route it through this helper.

## When you're stuck

- Run `npm run lint` to see what TypeScript thinks of your change.
- Search for prior art: most APIs in `src/` are exercised by at least one playground page. Find one and pattern-match.
- If you're working through an assistant that keeps cross-conversation memory, read what's already there before re-deriving context.
- Open a clarifying question rather than guess — see the doctrine in the top-level CLAUDE.md (this file) about "explorations should be 2-3 sentences with a recommendation, not a decided plan."

## Style

Imports grouped by source (lib first, then local), then a blank line. Prefer named imports. Trailing commas on multi-line. Two-space indent. No semicolons-required policy — the repo mixes both because TypeScript's ASI is forgiving; match the file you're in.

No JSDoc preamble on small helpers; keep blocks short. Use JSDoc on public exports — those go into the `.dts` bundle.

When you need a constant for tuning (e.g., "this taper margin should be ~0.5 m"), make it a named `const` near the top of the function, not a magic number.

## When to update this file

Add a rule here only when the same agent mistake has happened twice. If a single misstep was avoidable by reading the README, that's a README issue — fix the README instead.
