# Changelog

All notable changes to tekto. Versions follow [semantic versioning](https://semver.org);
before 1.0, breaking changes bump the minor version. See
[CONTRIBUTING.md](CONTRIBUTING.md#releases-and-versions) for how releases are made.

## Unreleased

## 0.8.2 — 2026-10-14

The issues 7DHouse filed (#62–#65) and what BuildGraph needed from the old Viewport, on the one renderer: IFC storeys at their height, roofs, slab openings framed and voided, Studio's poché and shadows, callouts that see more and cost less, hidden objects hidden from everything, view-mode icons, a fading grid ground, and appShell drawing on demand.

- `buildCutList` takes slab parts (any part with a material, profile, length and role), so
  a joisted floor's joists go on the same cut list as the walls' studs without a cast.
  From BuildGraph.
- **A fading grid ground**, `gridStyle: "fading"` (BuildGraph's grid ground, now on the one
  renderer, either up axis, any background): the ground ruled in round metres for the size
  of the content (1 m under a house, 10 m under a block, every fifth line stronger), fading
  out with distance so it has no edge, and refitted when the content changes. Opt-in; the
  default stays the fixed `"lines"` grid. The Site Editor page uses it.
- `AccordionColumn`: a section that appears after the first render opens per its own
  `defaultOpen` (it opened collapsed: the open state was seeded once). From BuildGraph.
- **View-mode icons** (BuildGraph's #22, now keyed by render mode): a cube drawn the way
  each mode draws, solid, ghost, hidden line and wireframe. `viewModeIconSvg(mode, size)`
  for a DOM app, `viewModeIconShapes(mode)` as data, and `ViewModeIcon` in `tekto/react`.
  The appShell top bar's Mode buttons show them.
- **Renderer fixes from 7DHouse** (#64, #65):
  - Studio lighting no longer logs five three.js warnings per object: materials get only
    the parameters that are set.
  - In Studio a section shows its poché on double-sided meshes (the default style). The
    Studio material had dropped the surface's polygon offset, so a surface's own back faces
    painted over the poché.
  - A section clips shadows too: the part it removes no longer shades what is left.
  - Flat lighting in a Z-up scene takes its sky from +Z, not from the side. Facades facing
    −Y had the ground colour.
- **`IfcWriter`: an element on an upper storey is written at its height**, not a storey
  higher (#62). Heights stay absolute in the API; the writer subtracts the storey's
  elevation where it places an element inside the storey. Members (world-coordinate meshes)
  are placed under the building, as stairs are, so a wall and its studs agree. Files made
  with an upper storey before this need re-exporting.
- **`IfcWriter.addRoof(parts, { storey, predefinedType })`** writes an `IfcRoof` that
  gathers slabs and members already written and is contained in the storey in their place.
  **`addMember(…, { storey })`** contains a free-standing element (a railing, a column) in
  its storey. (#63)
- **Slab openings cut the slab** (#63). `Slab.toMesh()` leaves each `SlabOpening` out and
  walls it, and `IfcWriter.addSlab` voids the slab with an `IfcOpeningElement` per opening.
  `Slab.openingRings(direction?)` gives their outlines, and fails loudly for one outside the
  slab. `Polygon2D.triangulateWithHoles(outer, holes)` (the drawing sheet's, now shared)
  triangulates a polygon with holes. A clockwise slab boundary no longer gives inward faces.
- **`JoistedSlab` frames its openings** (#63): a trimmer along each long side, in place of
  the joists there; a header across each end, between the trimmers; the joists in between
  stop at the headers with the bearing gap. The sheathing and ceiling leave the opening
  out. New part role `"trimmer"`. Playground: **Framed Floor** (a stair well, Export IFC).
- **Callouts, from BuildGraph's fixes to the old Viewport**: an element counts as
  in sight if its centre or one of eight points toward its corners is, and only surfaces
  that write depth hide it, so ghost and see-through parts hide no label. A label whose
  text, detail or colour changed is redrawn. Visibility is worked out only once the camera
  has been still for 120 ms, a 6 ms slice per frame, and stops once both margins are full
  ("up to N more not labelled").
- **`appShell()` draws on demand**: an idle app no longer redraws every frame (render on
  demand had only reached `sketch()`). An app with `onAnimate` still draws every frame.
  Changed three.js objects yourself outside `onAnimate`? Call `app.renderer.requestRender()`.
- **A hidden object is hidden from everything** (BuildGraph's `Viewport.setHidden`, #21,
  now on the one renderer): with `style.visible: false` it can't be picked or hovered
  (`pickAt`, `pick`; `hitAt` already skipped it), shows no selection or presence outline,
  and has no callout. Fix on the way: a callout whose element left the view (hidden, out of
  sight) stayed on screen without its leader; it is hidden now.
- `AccordionColumn` and `InfoHint` (and their props types) are no longer marked
  experimental: BuildGraph uses them. 47 exports keep the tag.

## 0.8.1 — 2026-10-13

The review's last items: the renderer and the sketch split into parts, commands and shortcuts, drawings over a sketch, every export documented (51 marked experimental), a shared selection, and seven bugs fixed that the documentation pass found.

- **Fixes found while documenting every export** (each with a test that failed before):
  - `CurveUtils.arcFromPointTangentPoint` returned its arc turned half a turn about the
    centre: it measured angles from +X, but `ArcCurve` measures them from its `forward`
    (−X for a +Z normal).
  - `SdfRadialArray` folded by reflection, so its copies came out mirrored. They are
    rotated now.
  - `BspTree.traverseFrontToBack` visited back to front and `traverseBackToFront` front to
    back.
  - `SpringSystem3D`'s default floor was the plane z = 10 facing +Z, under gravity along −Y,
    so the first step pushed everything to z = 10. It is now y = −10 (Y-up); a Z-up model
    sets both.
  - `polylinesToSVG`'s default stroke was 0.5 model units (half a metre). It is now 0.2 % of
    the drawing's larger side.
  - `vec3` params ignored their `min` / `max`; each component is clamped now.
  - `SVGRenderer` drew no polylines.
  - Docs: `DxfWriteOptions.precision` defaults to 6 below scale 100, and `depthBias` is
    ignored. CLAUDE.md wrongly said `BspTree.toMesh()` builds a `Mesh`; it returns typed arrays.

- **Shared selection.** `shareSelection(selection, doc.store, renderer, scene)` puts this
  client's selected record keys into its presence. Each window outlines what the others have
  selected, in their presence colour, so people (and agents) see who is on what before they
  collide.
  - The outlines follow their records through rebuilds and are clipped by a section.
  - Withdrawing the share clears this client's selection everywhere.
  - New on `ThreeRenderer`: `setPresenceHighlight(entries)`. `PresenceView` is the
    structural type `shareSelection` draws with.
  - The Site Editor shares its selection and, with `?shared=1`, shows a presence bar.

- **Unused exports are marked `@experimental`, and kept.**
  - 51 exports had no user in the library, the playground, the tests, tekto-apps or
    buchholz-stair. They are 46 values (most of the SDF family, the React components,
    `SVGRenderer`, `Intersections`, `SpringSystem3D`, `MarchingSquares`, `createParams` …)
    and 5 types that only those values use.
  - Option types of used functions don't count as unused, even if no app names them.
  - The tag says "no app uses this yet; it may still change", and `llms-full.txt` shows it,
    so an agent prefers the established API. Drop the tag when an app adopts one.

- **Every export is documented.**
  - The 219 exports without JSDoc have it now, including `Mesh`, `Vec3`, `ThreeRenderer`, the
    Scene types, the BIM and IO types, the SDF family and the React components.
  - Each doc was checked against the code for units, axes, angles and defaults. Where the code
    surprises (`ArcCurve` measures from −X, `Mat4()` is all zeros), the doc says so.
  - `llms-full.txt` now gives every export's first sentence.
  - `tools/gen-llms.mjs --check` (CI) fails on an export without JSDoc, so it stays this way.

- **`lab.overlay(name?)` in `sketch()`**: a layer over the 3D view, kept across re-runs, for
  a 2D view such as a `SheetCanvas` showing the drawing of what the sketch builds. This is
  what an app like the stair needs. Snapshots and ✎ Markup include visible overlay canvases,
  as in `appShell()`; the overlay and snapshot helpers are now shared. The sketch's 3D
  viewport has its own stacking context, so the axis widget stays under an overlay.
  New playground page: **Sketch + drawing** (a stair with a Drawing toggle and Export DXF).

- **New: commands and shortcuts.** `Commands` is one list of what an app can do: id, label,
  keys (`"Mod+Z"`: ⌘ on a Mac, Ctrl elsewhere), `run`, and `enabled`.
  - It runs commands from their keys, but not while typing in a field, and lists them.
  - `appShell()` has `app.commands`; `sketch()` has `lab.command(…)`, declared per run.
  - Both start with the view commands (`viewCommands`: frame all, plan, the elevations, iso,
    perspective/ortho), without keys.
  - Agents get `window.__tekto.commands()` and `__tekto.run(id)`, and snapshots
    (`markup.json`) list the commands.
  - `keyMatches` / `formatKeys` are exported for apps with their own UI.
  - The Site Editor's keys are now commands. The MeshFactory page shows `lab.command` (`]` / `[`).

- **`SketchInstance` sheds its frame and its handles** (internal; nothing changes for a
  sketch). The chainable handles `lab.mesh(…)` / `lab.point(…)` / `lab.line(…)` return move to
  `sketch/handles.ts` as functions of the scene. The sketch's frame moves to
  `sketch/sketchLayout.ts`: title bar, resizable and collapsible panel, viewport, log
  overlay, and the Export / Import menus. `Sketch.ts`: 1851 → 1431 lines.

- **`ThreeRenderer` is split into parts** (internal; the public API is unchanged). The class
  keeps the scene sync, the draw loop and its public methods, which delegate to:
  `ObjectBuilder` (scene objects → three.js objects), `Lighting`, `CameraRig` (projection,
  views, fitTo, the axis widget), `Pointer` (picking, hover, drag handles, transform gizmo)
  and `Marks` (selection, section, callouts). The parts share a `RendererCore`. 2477 lines
  became 885 + five files of 280–500 lines.

## 0.8.0 — 2026-10-13

One renderer. `ThreeRenderer` gains the separate `Viewport`'s features: ghost, section cuts, named views and the axis widget, progressive creases, a framed sun, outlines, hover, callouts and `fitTo`. Each is opt-in where it shows up on screen, and `Viewport` is removed (**breaking**, see the first entry).

- **Breaking: `Viewport` is removed. tekto has one renderer.** Everything the separate
  `Viewport` did is on `ThreeRenderer` (#48–#50 and this release). So every `sketch()` and
  `appShell()` app has it, along with picking, selection, Markup and snapshots, which
  `Viewport` never had. Migration:
  - **Content:** `new Viewport(host, { up: "z" })` + `setContent(meshes)` → an
    `appShell({ container, navGizmo: true })` (or `new ThreeRenderer(scene, host, { up: "z",
    navGizmo: true })`), with each mesh as `scene.addMesh(new Mesh(positions, indices),
    { color })`. `Viewport.meshFrom(buffers)` → `new Mesh(buffers.positions, buffers.indices)`.
  - **Modes:** `setViewMode("shaded" | "ghost" | "hidden-line")` →
    `scene.setRenderMode("solid" | "ghost" | "hiddenline")`.
  - **Same names on the renderer:** `setView`, `orbitTo`, `setProjection`, `setSection` /
    `setSectionColour`, `fitTo`, `setCallouts`. Objects are now scene ids or record keys
    instead of three.js objects.
  - **Picking and hover:** `onPick` / `onHover` options → `renderer.onPick` / `renderer.onHover`.
  - **Highlighting:** `setOutlined(meshes)` → `setSelectionStyle("outline")` +
    `setSelectionHighlight(ids)`.
  - **Colours:** `appearanceOf` → the object's style (`scene.setStyle`).
  - **Sun:** `setSun(date, lat, lon)` / `setShadows` → Studio lighting +
    `setSunDirection(SunPosition.compute({ date, latitude, longitude }).direction)`.
  - `ViewportOptions` and `ContentOptions` are gone. `CalloutItem.objects` holds scene ids
    or record keys (it held `THREE.Object3D[]`). The view rules (`edgeStyle`,
    `standardOrbit`, …) stay exported.
- **New on `ThreeRenderer`:**
  - `setCallouts(items, { onPick, onHover })`: labels in the margins with leaders to what
    they name. They never overlap. Ones whose subject is hidden are left out, and what
    doesn't fit is counted. A record key follows its record through rebuilds.
  - `fitTo(objects, { margin, animate })`: frames a selection or a part. It glides there
    keeping the viewing direction; in orthographic it sets the zoom.
- appShell top bar: **Light** and **Mode** now follow changes made in code, as Cam does.
- Playground: **Framed Wall** replaces the Viewport page. It shows a framed wall with every
  mode, Cut, views, the axis widget, callouts, outline selection, hover and Frame selection.

- **One renderer, part 3: render quality on `ThreeRenderer`** (from `Viewport`).
  - Hidden-line and ghost creases are built a frame at a time (8 ms budget), so a mode
    switch on a large model no longer stalls. `pendingEdges` counts what is left;
    `snapshotPng` (and so `snap` and Markup) waits for all of them.
  - In Studio the sun is aimed at the content and its shadow camera is fitted around it,
    instead of a fixed 30 m box at the origin. A normal bias scaled to the content keeps lit
    faces clean. `setSunDirection`'s `distance` is now a minimum.
  - `setSelectionStyle("outline")`: the selection is drawn as outlines on top of everything,
    leaving the fill colour alone. Outlines are clipped by a section and go away with their
    object.
  - `onHover(listener)`: the object under the pointer, when it changes (throttled, not while
    orbiting).

- **One renderer, part 2: named views and the axis widget on `ThreeRenderer`** (from
  `Viewport`).
  - `setView("top" | "front" | "back" | "left" | "right" | "bottom" | "iso")`: a plan (north
    up) or an elevation at the same distance. The camera turns there unless
    `{ animate: false }`; an orbit cancels the turn.
  - `orbitTo(direction)`, `projection`, and `onProjection(listener)`, so every control that
    shows the projection stays true.
  - In a sketch: `lab.setView`. New `viewDirection(view, up)` in the view rules.
  - `navGizmo`: the axis widget. Click an axis, drag to orbit, double-click to square up,
    persp/ortho toggle. Opt-in with `navGizmo: true` (or a corner) in `appShell()`,
    `sketch()` or the renderer config; off by default, because an app may have its own
    panels in that corner. It stays under an `app.overlay()`.
  - appShell top bar: Cam is now **Persp | Ortho**, kept in step with the widget, plus an
    **Iso** button (orthographic from the diagonal, as before).
  - `Projection` and `StandardView` move to the Scene types, which keeps `tekto/2d` free of
    three.js.

- **One renderer, part 1: section cuts and ghost on `ThreeRenderer`** (from `Viewport`), so
  every `sketch()` and `appShell()` app has them.
  - `renderer.setSection({ axis, coordinate | at, flip })` cuts the model with a plane and
    fills the cut (poché on opaque surfaces). A pick skips what the cut removed. The cut
    stays while the scene is rebuilt. `setSectionColour`, `section`. In a sketch:
    `lab.setSection`; `SketchInstance.setSection`.
  - New render mode **`"ghost"`**: surfaces faint in their own colour, with creases. A
    selection is drawn solid. Ghosts cast no shadows. Creases turn dark on a light background.
  - appShell top bar: **Ghost** in Mode and a **Cut ▾** popover (axis, position, flip).
    `topBar` also takes `{ light, mode, camera, cut, sun }`, so an app can switch off
    controls it has no use for. The testbench has Ghost and a Cut control too.
  - `SectionRequest` gains `coordinate` (a cut at a model position; `at` stays a fraction)
    and moves to the Scene types. The view rules `Viewport` and `ThreeRenderer` share
    (`edgeStyle`, `surfaceAppearance`, `standardOrbit`, … and new `sectionPlane`) live in
    their own module. They are exported under the same names. With `flip`, a fraction cut
    stays where it was and only the kept side changes.

## 0.7.2 — 2026-10-13

Drawings: a `Sheet` shown on screen and exported to SVG and DXF from the same primitives.

- **New `SheetCanvas` — a `Sheet` on screen** (`tekto/2d`, `tekto`). It fills a container,
  fits the drawing, zooms with the wheel about the cursor, pans by dragging and fits on
  double-click. Pens, dashes and text are drawn at their paper size for the current zoom.
  A click picks the primitive under it (`onPick`, with a pixel tolerance), and its `key`
  names the record. `setHighlight(keys)` shows a selection. `onDraw` paints in screen
  pixels on top. `toScreen` / `toSheet` convert. A sheet rebuilt on every edit keeps the
  zoom. Also new: `drawSheet(ctx, sheet, transform)` draws into any canvas (a `sketch2d`),
  `fitSheet(bounds, w, h)` fits it, and `pickPrim(prims, p, tolerance)` is the hit test
  (`tekto/core`).
- **`appShell()`: `app.overlay()`** — a layer over the 3D view, under the status line and ✎
  Markup, for a 2D view such as a `SheetCanvas`. Snapshots (`npm run snap`, Markup) now
  include visible overlay canvases, so an agent sees the drawing a person sees.
- **`Selection.click(key, mods)`** — the click rule every view shares (select; Shift/⌘/Ctrl
  toggles; a plain click on nothing clears). `selectOnClick` uses it.
- **Playground: Drawing Sheet.** A parametric pavilion in 3D and as a drawing: plan 1:100
  with grid and dimensions, two elevations projected from the model, a 1:20 detail, and
  Export SVG / DXF. A column clicked in any view is selected in all of them.
- `LevelOptions` is now exported.

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
