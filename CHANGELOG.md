# Changelog

All notable changes to tekto. Versions follow [semantic versioning](https://semver.org);
before 1.0, breaking changes bump the minor version. See
[CONTRIBUTING.md](CONTRIBUTING.md#releases-and-versions) for how releases are made.

## Unreleased

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
