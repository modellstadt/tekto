# Agent rules for editing this repo

Read this before you make changes. The companion document is [README.md](README.md), which is the canonical map of the library; this file is just the *editing rules* on top of it.

## Mission

This repo is the **public library**. It ships the library plus the playground/testbench.

Stand-alone applications that *consume* the library live in their own separate, independent repos and pin a release tag (`"tekto": "github:modellstadt/tekto#vX.Y.Z"`); only the maintainer's local workspace links `"file:../tekto"`. Keep this repo to the library and its playground — if you find yourself wanting to add an `apps/` directory here, stop: an app belongs in its own consumer repo, not in the library.

Tekto is an **AI-first platform for online CAD experiments**: people and agents iterate on the same browser-based model (sketch apps, Markup, `snap`). Keeping the library easy for an agent to read, drive and check is part of the job, not a side concern. It is a teaching/research platform, not a shipping product. The maintainer is iterating quickly on architectural-geometry experiments. Optimise for:
- **Readable diffs** over clever refactors.
- **One concrete change per request** — do not bundle unrelated cleanups unless asked.
- **Reading the surrounding code before editing.** A concept may still carry a deprecated alias (`ConnectedMesh`/`FlatMesh` → `Mesh`); write the canonical name, never add an alias. See [README.md → One mesh](README.md#one-mesh).
- **Anything an outside consumer needs must be re-exported from `src/index.ts`.** Deep imports like `from "tekto/src/scene/Scene"` are forbidden — apps can only see the public surface. If you add a new module that an app will use, also add the export here. **Exception — the React layer:** React components/hooks are exported from `src/react.ts` (the separate `tekto/react` entry), *not* `src/index.ts`. This keeps the core `tekto` barrel React-free so non-React apps don't need react installed. Anything that imports `react` belongs in `src/react.ts`, never in the core barrel.

## Rebuilt vs retained scenes

Two ways an app produces a scene — get this right before writing code, and see [README → Two scene models](README.md#two-scene-models-rebuilt-vs-retained):

- **Rebuilt** — `sketch()` / `sketch2d()`: the function re-runs on every param change and re-creates every object. Ids are positional (per-scene counter, reset by `Scene.clear()`), so a selection holds only while the run declares the same objects in the same order. Never store an id beyond a run, and don't hang app state off one.
- **Retained** — the app owns a document and syncs a long-lived `Scene` (`appShell()` or a custom/React UI). Ids are created with the object and last for its lifetime: that is the CAD "handle", and the model to choose when the user selects, renames, saves or reopens things.

Asked for something with selection, an outliner, undo or save/load? That is the retained model — do not build it on `sketch()`.

## Where things live

The public surface is [src/index.ts](src/index.ts) — **read it first**; it's the authoritative export map. The README Architecture tree is a conceptual sketch and lags the real folders (it still shows `core/primitives/`). Actual layout:

- math → `src/core/math/`
- geometry primitives (Ray, Plane, Triangle, AABB, Sphere), 2D polygon ops, curves, surfaces → `src/core/geometry/` (**not** `core/primitives/` — that dir was removed)
- the mesh → `src/core/geometry/mesh/Mesh.ts` (one class: id-based editing + typed arrays + connectivity), its generators in `MeshFactory.ts` next to it, and the operations (`MeshTransform`, `MeshSubdivide`, `MeshCleanup`, `MeshAnalysis`, `MeshOffset`) in the same folder. `ConnectedMesh.ts` and `src/core/mesh/FlatMesh.ts` are one-line deprecation shims, gone next minor — don't import from them.
- BIM → `src/bim/`, IO → `src/io/`, renderers → `src/render/`

## The two things that catch agents out most

1. **There is one `Mesh`.** It is edited by id (`addNode`/`addFace`/`node(id)`/`splitEdge` …) *and* read as arrays (`positions`/`indices`/`normals`, `toMeshData()`); ids are indices, removal leaves a tombstone until `compact()`. `face.nodes` is a snapshot — reversing it does nothing; use `mesh.reverseFace(id)`. `node.position = p` writes through. `ConnectedMesh`, `FlatMesh` (aliases) and `MeshGen`, `FlatMeshGen`, `RenderMesh` are gone or deprecated — write `Mesh` and `MeshFactory`. There is no conversion step any more: `Mesh.fromConnectedMesh(m)`/`m.toConnectedMesh()` return the mesh itself and will be removed. **Also removed — don't reference them:** `src/core/primitives/primitives.ts` (primitives live directly in `src/core/geometry/` — `Ray.ts`, `Triangle.ts`, `AABB.ts`, `Sphere.ts`, etc.) and the `src/core/geometry/mesh/MeshData.ts` stub. (`Wall`, `Slab`, `ExtrudedRibbon`, `NurbsSurface`, `BspTree` still legitimately have their own `toMesh()` that builds a `Mesh`.)
2. **The Sketch function re-runs end-to-end on every parameter change.** No memoisation, no diffing. If you put expensive work inside the function body, every slider drag re-runs it. One-shot work goes in button callbacks; cached state goes into module-scope variables.
3. **Lint = `tsconfig.lint.json`, not the default tsconfig.json.** The default config scopes to `src/` (for clean tsup declarations); the lint config widens the scope to `src + playground + tests`. Type errors in demos surface at `npm run lint`, *not* only at runtime in the browser. Always re-run `npm run lint` after touching anything under `playground/`.
4. **A couple of recent additions/omissions.** `Polygon2D` gained `openRing` / `closeRing` / `polylineLength` ([src/core/geometry/Polygon2D.ts](src/core/geometry/Polygon2D.ts):83,95,67) — also reachable via `Algo.*`, since `Algo` spreads `Polygon2D`; don't re-implement them. `MeshOffset` ([src/core/geometry/mesh/MeshOffset.ts](src/core/geometry/mesh/MeshOffset.ts)) exists but is intentionally **not** re-exported from `src/index.ts` — leave it internal unless the maintainer asks.

## Vec immutability

`Vec2`/`Vec3`/`Vec4`/`Mat4` use `readonly` fields. All ops return new instances. There are a few intentional escape hatches that mutate a node's position in place via `(node as any).position = …` — in `MeshAnalysis.laplacianSmooth` (re-exported as `Algo.laplacianSmooth`) and in the rotate handlers in `src/sketch/Sketch.ts`. These mutate `MeshNode.position`, which is a mutable field — *not* the `readonly` Vec components — so `MeshTransform.translate`/`scale` reassign `node.position` directly, no `as any` needed. Search the repo for `as any` before adding a new one; if you find a clean way to express the mutation in legal TS, prefer it.

## Coordinate convention

Z-up. XY is the ground plane. The `Top` camera preset is "looking down -Z, up=+Y". When emitting DXF or screen-space SVG, drop the Z.

## What to use, what to avoid

- **Use `MeshFactory`** for procedural meshes; `Mesh` carries connectivity at every size, so there is no separate "big mesh" path. For data that arrives as arrays (a scan, an IFC), `new Mesh(positions, indices)` — 1M triangles load in under 100 ms.
- **Hot loops read arrays, not views.** `mesh.faceVerts(id)`, `mesh.positions`, `mesh.indices` cost nothing; `mesh.node(id).position` allocates a view and a `Vec3`. Fine for a pass over a few thousand nodes, not for an inner loop over a million.
- **Use `sketch(...)`** to build a runnable demo. Don't reach for the React app shell unless you specifically need persistent state, multiple panels, or routing.
- **Avoid** importing `three` inside `src/` — it's an externalised peer dep. Add new Three.js calls in `src/render/ThreeRenderer.ts` and expose what you need through the renderer interface.
- **Avoid** adding new files when an existing file is a good home. The library prefers a handful of larger, well-organised modules over many tiny ones.

## Editing checklist

Before writing the edit:

- [ ] I've located the canonical file via `src/index.ts` (authoritative export map); the [README Architecture tree](README.md#architecture) is a conceptual overview and may lag the real folder names.
- [ ] I've read the surrounding 50–100 lines, not just the symbol I'm changing.
- [ ] I'm using the canonical name (`Mesh`, `MeshFactory`), not a deprecated alias, and not adding one.
- [ ] If touching a fragile function (see [src/index.ts](src/index.ts) and [README.md → One mesh](README.md#one-mesh)), I'm either avoiding it or actually fixing it.

After the edit:

- [ ] `npm run lint` (which is `tsc --noEmit -p tsconfig.lint.json`, covering `src/` + `playground/` + `tests/`) is clean.
- [ ] Affected tests pass (`npm test`). Add a test if the change is non-trivial *and* the rest of the module has tests; otherwise don't pad the suite.
- [ ] If the change touches the public API (anything exported from `src/index.ts`), I've updated the README's [What's available from `tekto`](README.md#whats-available-from-tekto) list. (Sanity-check exact names against `src/index.ts` — that bucket list paraphrases.)

## Team workflow

Several people and their agents work on this repo. The full rules are in [CONTRIBUTING.md](CONTRIBUTING.md); the ones agents break most:

- **Work on a branch, deliver a PR.** `main` is protected; nothing lands without a PR and green CI (lint, tests, build on `npm ci`).
- **Never commit `dist/`** outside a `release/vX.Y.Z` branch. CI rejects it. If a build touched it: `git checkout origin/main -- dist`.
- **Changed the public API** (`src/index.ts`, `src/react.ts`)? Add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md); mark renames/removals **Breaking** with how to migrate.
- **Added or removed a dependency?** Commit the updated `package-lock.json` in the same PR, or `npm ci` fails in CI.

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

When you build a new custom app outside the testbench: use `appShell()` from [src/sketch/AppShell.ts](src/sketch/AppShell.ts) — it provides the panel (via the shared `ControlPanel`), the Scene + ThreeRenderer harness, and the top bar (lighting / render mode / camera / Sun popover). Do NOT copy panel/top-bar code into an app; if the shell lacks something, extend `AppShell.ts` in the library.

### Lighting + shadows

Two presets toggled from the top bar:

- **Flat** (default) — `MeshPhongMaterial`, 3 cheap lights, no shadows, no tonemapping. Fast. Use for inspection.
- **Studio** — `MeshStandardMaterial` (PBR), one sun-style directional light with PCF-soft 2048² shadows on a 30 m frustum, ACES filmic tonemapping, sRGB output, an invisible `ShadowMaterial` ground plane that catches the contact shadows. ~2-3× slower per frame.

Shadow flags are applied in `addToThree` based on the current lighting mode, so sketch re-runs preserve shadow behaviour. `_makeMaterial(opts)` in `ThreeRenderer.ts` picks Phong vs Standard; if you add a new material site, route it through this helper.

## When you're stuck

- Run `npm run lint` to see what TypeScript thinks of your change.
- Search for prior art: most APIs in `src/` are exercised by at least one playground page. Find one and pattern-match.
- If you're working through an assistant that keeps cross-conversation memory, read what's already there before re-deriving context.
- Open a clarifying question rather than guess; when exploring, give a 2-3-sentence recommendation, not a decided plan.

## Style

Imports grouped by source (lib first, then local), then a blank line. Prefer named imports. Trailing commas on multi-line. Two-space indent. No semicolons-required policy — the repo mixes both because TypeScript's ASI is forgiving; match the file you're in.

No JSDoc preamble on small helpers; keep blocks short. Use JSDoc on public exports — those go into the `.dts` bundle.

When you need a constant for tuning (e.g., "this taper margin should be ~0.5 m"), make it a named `const` near the top of the function, not a magic number.

## GUI defaults (sketch2d / lab panels)

Panel chrome is WHITE on the dark background: white slider accents and value
labels, white toggle tracks (dark knob when ON), plain white title — NO green
accents (#38d9a9) and NO gradient text in labels/titles. This is the intended
default for every tekto app; if you build a new control type for the lab
panel, style it white-on-dark to match. (The `colorPicker` DEFAULT COLOR VALUE
is content, not chrome — it may stay whatever the sketch wants.)

Since the GUI unification, panel colors come from [src/gui/theme.ts](src/gui/theme.ts)
and ALL controls are rendered by [src/gui/ControlPanel.ts](src/gui/ControlPanel.ts)
(shared by `sketch`, `sketch2d`, and `appShell`; values live in `ParamStore`).
Add or restyle a control type THERE, never inline in Sketch.ts / Sketch2D.ts /
AppShell.ts — those files only declare params and mount the panel.

Sliders are the rectangular "scientific" style: flat 4 px track, square white
7×14 px thumb, no rounded pill — via the injected `.tekto-slider` stylesheet in
ControlPanel.ts (`--tekto-track` / `--tekto-thumb` CSS vars per control). Any
new range input in tekto chrome should use that class, not `accent-color`.

## When to update this file

Add a rule here only when the same agent mistake has happened twice. If a single misstep was avoidable by reading the README, that's a README issue — fix the README instead.
