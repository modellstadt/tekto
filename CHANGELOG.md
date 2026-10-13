# Changelog

All notable changes to tekto. Versions follow [semantic versioning](https://semver.org);
before 1.0, breaking changes bump the minor version. See
[CONTRIBUTING.md](CONTRIBUTING.md#releases-and-versions) for how releases are made.

## Unreleased

- **New `Sheet` — drawings that look the same on screen, in SVG and in DXF** (`tekto/core`).
  Views placed on a sheet at a scale (`new Sheet({ scale: 50 })` = 1:50; `sheet.view("east",
  { at, rotation, scale, project })`), where `project` projects 3D points into an elevation or
  section — by two axes, or by a function for an unrolled strip. Entities: `polyline` / `line` /
  `rect` (with `fill` for poché), `circle`, `arc`, `fill` (with holes), `text`, `dim` (aligned,
  horizontal, vertical: extension lines, ticks, the length in mm, text upright and above),
  `radius`, `leader`, `level` ("+2.450"), and `segments` from `DxfExporter.toSegments`. Geometry
  is in model metres; annotation is in paper mm, so 2.5 mm text stays 2.5 mm in a 1:10 detail.
  Layers carry colour, pen weight and dash. `explode()` gives the primitives every output draws;
  `toSVG()` writes them sized in mm with `data-layer` / `data-key`, `toDXF()` as R12 with
  dashed line types scaled for paper, colours, aligned text and fills as SOLIDs.
- **`writeDxf2D`**: per-entity colour and line type, `solids`, text alignment (`align`,
  `valign`), layers' `lineType` written with a pattern (`linetypeScale` sizes it), and
  `aciFromHex` (CSS colour → nearest AutoCAD colour index).

## 0.7.1 — 2026-10-13

The retained CAD model: a document, a scene that follows it, selection, Markup, and an example.

- **New `Doc` — the document of a retained app** (`tekto/core`). Typed records in named
  collections, each with a stable id (`doc.add("walls", {...})` → the object's handle through
  edits, undo, saving and reopening); `update` merges or maps, `remove`; `transact(label, fn)`
  makes many writes one undo step and one notification; `undo` / `redo` with labels, and
  `coalesce` keys that turn a drag into one step; `onChange(changes, "local" | "remote" |
  "history")`; `toJSON` / `load` for Save and Open. Built on `SharedStore`, so the adapters give
  persistence and shared editing: new `localAdapter()` (this browser), `devServerAdapter()`,
  `supabaseAdapter()`, `memoryAdapter()`. Records are plain JSON; geometry is derived from them.
- **New `bindScene(doc, collection, scene, render)`** — keeps a scene in step with one
  collection: `render(record, id)` adds the objects that show a record; a changed record
  rebuilds only its objects (once per transaction), a removed one's go; undo shows up like any
  edit; a record whose render throws is reported and skipped. `binding.recordOf(sceneId)` maps a
  pick to its record, `objectsOf(id)` a record to what to highlight.
- **`SceneObject.key`** — the record an object shows (`"blocks/k3f9x2"`), set by
  `scene.withKey(key, fn)` from the moment it is added; `scene.byKey(key)`. Snapshots and ✎
  Markup report it, so a mark on the viewport names a document record.
- **New `Selection` and `selectOnClick(renderer, scene, selection)`** — selection by record
  key, not scene object, so it survives re-renders, undo and reload. A click selects the record
  an object shows, Shift/⌘/Ctrl-click toggles, a background click clears; every object of a
  selected record is highlighted, again after `bindScene` rebuilds it. `ThreeRenderer`:
  `setSelectionHighlight` takes a list of ids, and `onPick` listeners get the modifier keys
  (`PickInfo`).
- **✎ Markup in `appShell()`** — the same overlay as in `sketch()` (opt out with
  `markup: false`). Marks resolve to the objects they touch and, through `key`, to the document
  records they show; `window.__tekto.snapshot()` (and so `snap`) includes the marks.
- **New playground page "Site Editor (Doc + undo)"** — the retained model end to end and the
  example to copy: blocks in a `Doc` (kept in this browser, or `?shared=1` through the dev
  server), `bindScene`, click/Shift-click selection with highlight, sliders that edit the
  selection (a drag is one undo step), Add / Duplicate / Delete, ⌘Z / ⇧⌘Z, arrow keys,
  Save JSON / Open JSON.

## 0.7.0 — 2026-10-13

- **Export pipeline.** New `writeDxf2D` (in `tekto/core` and `tekto/2d`): plans, sections and
  cut sheets as AutoCAD-safe R12 — closed/open polylines, lines, circles, arcs, single-line
  text — with `scale: 1000` writing metres as millimetres (and saying so in the header). New
  `download(data, fileName, { stamp })` (browser): a string, bytes or Blob as a file, the URL
  kept alive past the click (revoking at once truncates large files — the testbench's own menu
  did that; fixed). `stampName` dates a file name. A standalone `sketch()` now shows
  **Export ▾ / Import ▾** in its header for `lab.registerExport/registerImport` (only the
  testbench shell showed them, so no app used them); export handlers may return a string.

- **Controls can be set from code.** Every control handle (`lab.slider`, `toggle`, `select`,
  `colorPicker`, `layerTree`, `dragHandle`; `sketch2d` too) gains `.set(value)`: the panel
  moves and the sketch re-runs (during a run it only stores the value). `layerTree().set`
  takes partial updates per layer (`{ beams: { visible: false } }`). `SketchInstance` and
  `Sketch2DInstance` gain `getParams()` / `setParams(values)` — save a design and reopen it
  without reloading the page (`setParams` takes labels, `"Group:Label"` or keys and reports
  what it couldn't apply).
- **Breaking (types only) — `ParamStore` values are typed from the schema.** `get("radius")`
  returns `number` for a float param, `boolean` for a bool, and so on (it returned `any`);
  `getAll()` is typed the same way. Casts like `params.get("radius") as number` still compile.
  A store declared as `ParamSchema` (e.g. `const schema: ParamSchema = {…}`) yields a union:
  write `{…} satisfies ParamSchema` to keep exact types, or cast where a dynamic key is read.

- **Changed — certain bugs now throw where they happen** instead of producing quiet garbage
  (each message names the call and the value): `Mesh.addNode`/`setPosition` with a non-finite
  position; `Mesh.addFace` with fewer than 3 nodes or a node that doesn't exist (it went into
  the index buffer); `MeshFactory` generators with impossible arguments (`grid` with 0
  divisions, `sphere` with 2 segments, `loft` over profiles of different lengths — it used the
  shorter one —, a 1-point `pipe` …); `writeDxf3D` with a NaN coordinate (it wrote `0`; arcs and
  circles with a degenerate radius are still dropped). Loading an old Map-based mesh JSON skips
  its degenerate faces. Eight apps in tekto-apps run unchanged on it.
- **New `Mesh.validate()`** — non-finite positions, faces with missing or repeated nodes,
  degenerate faces, non-manifold edges, faces wound against their neighbours, and a closed
  mesh that is inside-out; open edges are counted, not flagged. Every snapshot runs it on the
  scene's meshes: `markup.json` → `scene.meshIssues`, and `snap` prints them.
- **Fix — `Polygon2D.offset`:** a ring that repeats its first point no longer gets a notch
  (and comes back closed); insetting past the polygon returns `[]` instead of an inverted
  shape; a non-finite distance throws.

- **The agent loop works on every app.** `sketch2d()` and `appShell()` now install
  `window.__tekto` too (it was `sketch()` only), so `snap` captures all three. New
  `__tekto.schema()` lists every control with type, range, default and value. `markup.json`
  now carries the app's `lab.log` lines (`appShell`: its status) and the errors the page hit
  (window errors, rejected promises, `console.error`). `snap` prints the log lines and exits 1
  when the page reported an error (`--allow-errors` to accept); `--camera` on a 2D app fails
  clearly. New playground page **App Shell (retained)** — the first `appShell` example.

- **New entry points `tekto/core` and `tekto/2d`.** `tekto/core` is the geometry and data
  layer — meshes, curves, NURBS, polygons, BIM, IFC/OBJ writers, `writeDxf3D`, `Scene`,
  `ParamStore`, `SharedStore` — with no three.js and no DOM: it runs in Node scripts, workers
  and tests. `tekto/2d` is `sketch2d` with the 2D geometry a first sketch needs. The main
  `tekto` entry is unchanged (it re-exports `tekto/core`). CI walks both entries and runs them
  in Node with three and React blocked.
- `writeDxf3D` and the DXF layer types moved into a three-free module (`DxfExporter`, which
  renders hidden lines on the GPU, keeps its API and re-exports them); output is byte-identical.

## 0.6.1 — 2026-10-13

- **Fix — `NurbsCurve` now uses its weights.** Evaluation ignored them, so every rational
  curve came out as a plain B-spline (a quarter circle bulged to radius 1.06 at its midpoint)
  and disagreed with `NurbsSurface`, which did use them. Curves built with weights change
  shape — to the shape they were meant to have; check anything that compensated (e.g. a
  workaround for "getPoint ignores weights"). A weights array of the wrong length now throws.
- **Fix — generators face outward.** `MeshFactory.extrude` wound its caps against its sides
  (a unit square extruded by 1 had volume 1/3); it now reorients the outline so every face
  points outward whichever way the polygon winds. `MeshFactory.cylinder` (and `lab.cylinder`)
  was built inside-out; flipped. Double-sided rendering hid both; volumes, back-face culling,
  hidden-line views, offsets and IFC/DXF solids did not. `MeshFactory.pipe` with a radius array
  that doesn't match the path now throws instead of producing NaN positions.
- **Fix — `import "tekto"` works in plain Node** (ESM and CommonJS), so scripts, agents and
  test runners other than Vite can use the geometry. The three.js addon imports lacked their
  `.js` extension, which bundlers forgive and Node does not. Fixing the path also made
  TypeScript see `OrbitControls`/`TransformControls` for the first time (they were silently
  `any`); `@types/three` is now aligned with the runtime (0.160 → 0.183). CI checks that the
  build loads in Node.
- **Fix — `snap --params` applies what it is given, or says why not.** The documented
  `--params '{"Radius":2}'` did nothing: sketch keys read `slider::Radius` and unknown keys were
  dropped silently, so an agent photographed the unchanged design. Controls are now named by
  label (case-insensitive) or `"Group:Label"`; a name that matches nothing fails the run and
  lists the page's controls. New `ParamStore.findKeys` / `setByName` / `names` (also behind
  `window.__tekto.setParams` / `paramNames`). `snap` no longer crashes on exit while Chrome is
  still writing its temp profile.
- **Docs:** README "For LLMs" matches the code again (two coordinate conventions, one `Mesh`,
  no claims of a demo or JSDoc for every export, no stale test counts).
- **Build:** `dist/` is cleaned before each build (stale chunks from earlier releases were
  shipped), and `"sideEffects": false` lets app bundlers tree-shake the barrel.
- **Tests:** a flaky render-on-demand browser test (exact float comparison of the camera)
  compares within 1e-9.

## 0.6.0 — 2026-10-05

- **Breaking — render on demand.** The `sketch()` viewport draws a frame only when something
  changed: a re-run, a scene or style change, the camera (orbit, damping, `lab.camera` …),
  lights and sun, drag handles, the gizmo, a resize, a restored WebGL context — and on every
  frame while a sketch animates (a `{ retain: true }` animate callback draws on the frames where
  it changes something through the Lab or the scene). Orbit damping is drawn to the end and then
  stopped, so the camera rests exactly where it was last drawn. An idle sketch no longer redraws 60 times a second (11.5k objects: 60 → 0 draws/s,
  the main thread no longer ~100% busy). Migration: a sketch that changes three.js objects
  directly (e.g. moves an object added with `addExternalObject`) calls the new
  `lab.requestRender()` (also `SketchInstance.requestRender()`, `ThreeRenderer.requestRender()`
  / `renderIfNeeded()`). `appShell()` and `ThreeRenderer.startLoop()` still draw every frame.
- **Cheaper restyles.** Colour, opacity, visibility and `layer` style changes on lines, tube
  segments and unlabelled points, and `pickTag` / `pickable` on any object, patch the existing
  three.js object instead of removing and rebuilding it (other changes still rebuild). Chained
  calls like `lab.line(…).color(c).layer(l).pickTag(t)` used to build the object four times: a
  run of 11.5k such objects now builds 11.5k three.js objects instead of 46.5k and re-runs about
  1.9× faster.
- **Shared editing.** `SharedStore` — a document of keyed records several people (and agents)
  edit together: writes apply locally at once, the backend stores them and sends them live;
  last write wins per key; presence and broadcasts. Backends are adapters: `memoryAdapter`,
  `devServerAdapter` (Vite dev server; plugin `tekto/collab-vite`, records in
  `.tekto/collab/<doc>.json`), `supabaseAdapter` (the app passes its supabase-js client — no
  new dependency). `PresenceBar` shows who is online. Playground page "Shared Editing".

## 0.5.0 — 2026-09-26

- **Breaking — `HPlane` is `Plane`.** The class was always exported as `Plane` as well; the
  `HPlane` name and the deep path `core/geometry/HPlane` are gone. Last of the aliases.
- Docs: CLAUDE.md and CONTRIBUTING.md checked against the code — two coordinate
  conventions (Y-up sketch/MeshFactory, Z-up appShell/BIM/DXF), `three` scope, no
  backward-compat aliases, apps pin a tag or vendor a release.

## 0.4.0 — 2026-09-26

- **Breaking — one `Mesh` class.** `ConnectedMesh` (Map per element) and the flat
  `Mesh`/`FlatMesh` (typed arrays, triangles only) are now a single `Mesh`: typed-array
  storage, polygon faces, and full connectivity (edges, node↔edge↔face links) kept
  incrementally by every edit. Both APIs survive on the one class — `addNode`/`addFace`/
  `node(id)`/`splitEdge`… and `positions`/`indices`/`normals`/`smooth`… — so most code
  compiles unchanged. Same 200k-triangle grid: 31 ms / 45 MB instead of 238 ms / 232 MB;
  1M triangles load from arrays in 83 ms. Migration:
  - `ConnectedMesh`, `FlatMesh`, `RenderMesh`, `MeshGen`, `FlatMeshGen` are gone: write `Mesh`
    and `MeshFactory` (which gained `midpointSubdivide`, and `grid(...).update(fn)`). The deep
    paths `core/geometry/mesh/ConnectedMesh` and `core/mesh/FlatMesh` no longer exist.
  - Ids are indices; removing an element leaves a tombstone until `compact()`, which
    renumbers. `nodeCount` counts live nodes, `vertexCount` counts slots.
  - `face.nodes` (and `node.edges`, `node.faces`, `face.edges`) are snapshots; reversing a
    face is `mesh.reverseFace(id)`. `node.position = p` still writes through.
  - `toIndexedTriangles()` → `toMeshData()`; `FlatMesh.fromConnectedMesh(m)` /
    `m.toConnectedMesh()` are gone — there is nothing to convert, use the mesh.
  - `mesh.positions` is `Float64Array` (the analysis code needs the precision); the
    `MeshData` handed to the renderer/IO stays `Float32Array`. A flat mesh no longer
    satisfies `FlatMeshData` structurally — pass `mesh.toMeshData()`.
  - `toJSON()` writes `{positions, faces}`; `fromJSON()` also reads both old formats.
  - `lab.MeshGen` is `lab.MeshFactory`; `edgeFaces(id)` returns face ids, not objects.

## 0.3.0 — 2026-09-23

- **Changed — scene ids are per scene and restart at `clear()`.** Rebuilding the
  same content gives the same ids, so a selection (highlight + transform gizmo)
  now survives the sketch re-run that a pick triggers; before, the gizmo was left
  stranded at the origin. The stability is positional: a run that adds, removes
  or reorders objects shifts the ids after it. Ids are no longer unique across
  scenes or across clears — don't store them beyond a scene's lifetime.
- New playground page **Pick & Gizmo**, covering picking + TransformControls.
- Browser tests (Playwright): every playground page must render a live canvas
  with no console errors. `npm run test:ui`; runs in CI as a second job.
- Docs: **Two scene models — rebuilt vs retained** (README + CLAUDE.md): which
  model gives objects a lasting identity, and how to choose before writing code.

## 0.2.2 — 2026-09-22

- Fix: the move / rotate / scale gizmo never appeared with three.js r169 or newer
  (`TransformControls` is no longer an `Object3D`; its visible part is `getHelper()`).

## 0.2.1 — 2026-09-22

- **✎ Markup:** every 3D `sketch()` has a Markup button. Draw on the view and
  each mark is resolved to the objects it touches (layer, label, source line)
  and world points, saved as a bundle an agent can read. New exports:
  `MarkupBundle`, `MarkupCaptureOptions`, `MarkupObjectRef`, `MarkKind`;
  `SketchConfig.markup`; dev-server plugin `tekto/markup-vite`.
- **`npm run snap`** (`tools/snap.mjs`): capture a running sketch in headless
  Chrome, so an agent can check its own change.
- Descriptions: tekto is an AI-first platform for online CAD experiments.
- CI: every PR runs lint, tests and a build on a clean install; PRs outside
  `release/*` may not change `dist/`.
- Team process: `CONTRIBUTING.md`, `CODEOWNERS`, PR template.
- `package-lock.json` synced with `package.json` (`polygon-clipping`,
  `poly-decomp` were missing, so `npm ci` failed).

## 0.2.0

First tagged release: the baseline apps can pin (`github:modellstadt/tekto#v0.2.0`).
