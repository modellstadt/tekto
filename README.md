# ⬡ Tekto

**An AI-first platform for online CAD experiments.** Describe a design idea to a coding agent and get a running, interactive CAD app in the browser. Then point at what to change, right in the viewport, and iterate together.

Tekto is designed so that people and AI agents work on the same model:

- **One function = one app.** The [Sketch API](#sketch-api-easiest) turns a single function into an interactive 3D or 2D app with sliders. It is small enough for an agent to write, read and rewrite in one go.
- **People can point.** Draw on the viewport with [✎ Markup](#markup--instructions-for-an-ai-drawn-on-the-view). Each mark is resolved to the objects it touches, their world coordinates and the source line that created them, not just a circle on a screenshot.
- **Agents can look.** `npm run snap` captures a running sketch in headless Chrome the way a person sees it, so an agent can check its own change before claiming it works.
- **Written for agents.** [CLAUDE.md](CLAUDE.md) is the agent handbook (conventions, gotchas, what never to do without asking), and the whole public API is one entry point, `src/index.ts`.
- **Online by default.** Everything is plain browser code (TypeScript, three.js, Vite). An experiment is a static page you can share as a link.

Underneath is a full computational geometry toolkit: meshes, curves & **NURBS** surfaces, **SDF** fields, voxels, graphs (incl. planar/Delaunay), 2D polygon booleans and nesting, **BIM** timber framing + **IFC** export, solar and physics, plus analysis (curvature, mesh metrics, convex hull) and renderers. Built for teaching and research.

**Mesh** → one class for editing, subdivision, topology queries *and* rendering — typed arrays underneath, connectivity kept by every edit, a million triangles in tens of MB  
**Sketch API** → one function = a full interactive app with GUI

> **For students:** if you got this repo to embed in your own project, skip ahead to **[Using tekto in your own project](#using-tekto-in-your-own-project)**. The rest of the README is for people working *on* the library itself.

## Quick Start

```bash
npm install github:modellstadt/tekto three
# add `react react-dom` only if you import from "tekto/react"
```

### Entry points

| Import | What | Needs |
|---|---|---|
| `"tekto"` | everything: geometry + three.js renderers, panels, `sketch()`, `appShell()` | a browser, `three` |
| `"tekto/core"` | geometry and data only: `Mesh`, `MeshFactory`, curves, NURBS, polygons, BIM, IFC/OBJ/DXF writers, `Scene`, `ParamStore`, `SharedStore` | nothing — runs in Node, workers, tests |
| `"tekto/2d"` | `sketch2d` plus `Vec2`, `Polygon2D`, `PolygonBool`, noise: the small on-ramp | a browser, no `three` |
| `"tekto/react"` | React components | `react`, `react-dom` |

Use `tekto/core` for scripts and checks (`node check.mjs` with `import { MeshFactory } from "tekto/core"`) and in workers; CI guarantees it never pulls in three.js.

### Start here

<!-- start-here: copied into llms.txt by tools/gen-llms.mjs; bare `Names` must be exports (CI checks) -->
About 30 names cover most apps. **Apps:** `sketch` (3D, rebuilt each run), `sketch2d` (2D canvas), `appShell` (retained: users build, select and save). **Geometry:** `Vec2`, `Vec3`, `Mesh`, `MeshFactory`, `MeshTransform`, `Polygon2D`, `PolygonBool`, `NurbsCurve`, `NurbsSurface`, `CurveUtils`. **Data:** `Scene`, `ParamStore`, `Doc` + `bindScene` + `Selection` (retained apps), `SharedStore`. **Files:** `Sheet` (drawings), `writeDxf2D`, `writeDxf3D`, `DxfExporter`, `IfcWriter`, `ObjFile`, `download`.

| To … | use | not |
|---|---|---|
| make a parametric study | `sketch` | — |
| make an app people edit, select and save | `appShell` + `Doc` + `bindScene` + `selectOnClick` (see the Site Editor page) | `sketch` (it rebuilds everything each run) |
| run geometry in Node, a worker or a test | `import … from "tekto/core"` | `"tekto"` (pulls in three.js) |
| build a mesh | `MeshFactory.box(…)` etc., or `new Mesh()` + `mesh.addNode` / `mesh.addFace` | hand-filled typed arrays |
| measure or smooth a mesh | `mesh.volume()`, `mesh.smooth()` | the older `MeshAnalysis` / `Algo` wrappers |
| check a mesh | `mesh.validate()` | judging a double-sided render |
| 2D booleans, with holes | `PolygonBool` | `polygonIntersection` (two simple rings only) |
| draw plans, elevations, details — dimensioned, to scale — and export them | `Sheet` (`sheet.toDXF()`, `sheet.toSVG()`) + `download`; on screen `SheetCanvas` (see the Drawing Sheet page) | a second export path that repeats the screen's transforms; a hand-written DXF or Blob |
| export 3D lines / views of meshes / BIM | `writeDxf3D` / `DxfExporter` / `IfcWriter` | — |
| set a control from code | `handle.set(value)` on any control | clicking the panel's DOM |
| save and reopen a design | parametric: `getParams()` / `setParams()`; edited: `doc.toJSON()` / `doc.load()` | `localStorage` + reload |
| undo | `doc.undo()` — `doc.transact(…)` makes one step, `{ coalesce: "h" }` one drag | snapshots of app state you keep yourself |
| see what your change did | `npm run snap -- <url>`: exit code, `view.png`, `markup.json` | assuming it worked |

Five rules that catch agents out:
1. **Rebuilt or retained — decide first.** `sketch` re-creates every object on each change (ids are positional); a retained app keeps a `Doc` whose record ids live until removed, and `bindScene` derives the scene from it. Selection, undo and save need the second.
2. **Two coordinate conventions.** `sketch` and the `MeshFactory` primitives are Y-up; `appShell`, BIM, DXF and sun are Z-up. Pass `up: "z"` to `sketch` for CAD content.
3. **The sketch function runs again on every change.** Put one-shot work in `lab.button` callbacks and caches in module scope.
4. **One name per concept.** `Mesh` is the only mesh (edit by id, read as arrays); `face.nodes` is a snapshot — reverse a face with `mesh.reverseFace(id)`.
5. **Look before you claim.** `npm run snap` exits 1 if the page logged an error; an error from `Mesh`, `MeshFactory` or `writeDxf3D` names the call and the bad value — fix the input, don't catch it.
<!-- /start-here -->

### Sketch API (easiest)

Write a single function, get an interactive 3D app with auto-generated sliders:

```ts
import { sketch } from "tekto";

sketch((lab) => {
  const r = lab.slider("Radius", 0.1, 3, 1);
  const segs = lab.slider("Segments", 4, 48, 16, { step: 1 });
  const wf = lab.toggle("Wireframe", false);

  const sphere = lab.sphere(r.value, segs.value);
  sphere.color("#38d9a9").wireframe(wf.value);

  lab.log("Volume", sphere.volume().toFixed(3));
});
```

### Sketch2D — 2D canvas apps (p5.js-easy)

Want a plain 2D canvas instead of 3D? Use `sketch2d`. Same auto-generated GUI,
but the draw callback hands you a raw `CanvasRenderingContext2D` — no WebGL, no
Three.js. It's the tekto answer to p5.js, and a complete running app is this
short:

```ts
import { sketch2d } from "tekto";

sketch2d((lab) => {
  const r = lab.slider("Radius", 5, 100, 40);   // → side-panel slider

  lab.draw((ctx, w, h) => {                      // → runs every frame
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#38d9a9";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, r.value, 0, Math.PI * 2);
    ctx.fill();
  });
});
```

The `lab` surface for 2D:

- **Controls** — `lab.slider / toggle / select / colorPicker / button`, same as 3D.
- **`lab.draw((ctx, w, h) => …)`** — your render, called every frame with a 2D context.
- **`lab.animate((t, dt) => …)`** — opt into a continuous loop (`t`, `dt` in seconds). Without it, the canvas only redraws when a control changes.
- **Pointer input** — `lab.onPointerDown / onPointerMove / onPointerUp`, each receiving `{ x, y, id }` in canvas CSS-pixels, unified across mouse + touch + pen. The `id` tracks one finger across a gesture, so multi-touch and drag-and-drop just work; call `lab.canvas.setPointerCapture(id)` to keep a drag alive off-canvas. (Legacy `lab.mouseX / mouseY / mousePressed` are still there for quick sketches.) **Note:** pointer events don't auto-redraw — if your drawing only changes on input, add `lab.animate(() => {})` to keep frames flowing.
- **Math helpers** — `lab.sin / cos / lerp / clamp / noise / random / vec2 / PI / TWO_PI`, like p5's globals but scoped to `lab`.

The **Pointer Input** playground page is the canonical input demo — it exercises
this whole 2D surface end to end. Run `npm run playground` and pick *Pointer Input*.

### Core library

```ts
import { Mesh, MeshFactory, Vec3 } from "tekto";

// Build by id — every edit keeps the connectivity up to date
const mesh = new Mesh();
const a = mesh.addNode(new Vec3(0, 0, 0));
const b = mesh.addNode(new Vec3(1, 0, 0));
const c = mesh.addNode(new Vec3(0.5, 1, 0));
mesh.addTriangle(a, b, c);
mesh.nodeNeighbors(a);              // [b, c]
mesh.splitEdge(mesh.findEdge(a, b)!);

// Procedural generation
const terrain = MeshFactory.grid(10, 10, 32, 32, (x, z) =>
  Math.sin(x * 0.8) * Math.cos(z * 0.6) * 0.5
);
const vase = MeshFactory.revolve(profile, 32);
const smooth = MeshFactory.subdivide(box);   // Catmull-Clark

// Large data: load arrays straight in, same class, same API
const scan = new Mesh(positions, indices);   // 1M triangles in ~80 ms
scan.smooth(3, 0.5);                         // in place, on the arrays
scan.toMeshData();                           // Float32 arrays for the GPU / OBJ
```

## Architecture

```
src/
├── core/               ← Pure geometry, zero dependencies
│   ├── math/           ← Vec2, Vec3, Vec4, Mat4
│   ├── geometry/       ← Ray, Plane, Triangle, AABB, Sphere, polygons, curves, surfaces, mesh/ (Mesh + MeshFactory + ops)
│   ├── drawing/        ← Sheet: drawings at a scale (views, dimensions), to SVG and DXF
│   └── algo/           ← Convex hull, triangulation, analysis
├── scene/              ← Scene graph with visual properties
├── render/             ← Three.js + SVG renderers
├── gui/                ← ParamStore (the one param model) + ControlPanel + theme + LayerPanel
├── sketch/             ← sketch / sketch2d / appShell (student- and app-facing)
└── react/              ← React components + hooks
```

### One mesh

There used to be two classes — a Map-per-element `ConnectedMesh` for editing and a typed-array
`FlatMesh` for rendering — and every API had to pick one. Now there is `Mesh`: typed arrays
underneath, polygon faces, and the connectivity (edges, node↔edge↔face) kept as typed-array linked
lists that every edit maintains incrementally. Both old APIs live on it.

| | |
|---|---|
| Edit by id | `addNode` / `addEdge` / `addFace` / `removeFace` / `splitEdge` / `collapseEdge` / `reverseFace`; `node(id)`, `edge(id)`, `face(id)` are views that read and write through (`node.position = p`) |
| Query | `nodeNeighbors`, `findEdge`, `isBoundaryEdge`, `boundaryEdges`, `faceVerts(id)` (zero-copy) |
| Arrays | `positions` (Float64), `normals`, `indices` (fan-triangulated, cached), `toMeshData()` (Float32 for the GPU / IO), `new Mesh(positions, indices)` |
| Ids | are indices and stay valid across other edits; removal leaves a tombstone, `compact()` renumbers |
| Cost | 200k triangles: 31 ms to build with edges, ~45 MB; 1M triangles from arrays: 83 ms, ~72 MB. Catmull-Clark on 40k quads: 0.33 s. 5,000 edge splits: 9 ms |
| Watch out | `face.nodes` / `node.edges` are snapshots (reverse a face with `reverseFace`); in hot loops read `positions`/`faceVerts`, not views |
| Check | `mesh.validate()` lists what silently breaks volumes, culling and exports — NaN positions, bad faces, non-manifold or inconsistently wound edges, an inside-out solid. Certain bugs throw where they happen (a face on a missing node, a NaN position, a loft over mismatched profiles) |

### Three access levels

1. **Sketch API** — `sketch()` (3D) / `sketch2d()` (2D canvas): one function, zero framework knowledge. For students and quick experiments. The function re-runs on every parameter change.
2. **App Shell** — `appShell()`: a persistent sidebar + viewer for real apps. The panel is built ONCE from a declarative `params` schema and updated in place, so animation loops never fight the GUI. Comes with the top bar (lighting / render mode / camera / Cut / Sun; `topBar: { cut: false }` drops a control the app has no use for) and the axis widget for plans and elevations. Subscribe with `app.params.onChange(...)`.
3. **React components** *(optional)* — `<ParamPanel>`, `<InspectorPanel>`, hooks, imported from **`tekto/react`** (install `react` + `react-dom`). Only reach for this when you need React ecosystem integration; levels 1–2 cover most apps. The core `tekto` barrel is React-free.

All three levels share the same GUI foundation: values live in a `ParamStore`, panels are rendered by the shared `ControlPanel`, colors come from `getTheme()`. A control type added there appears everywhere.

### Two scene models: rebuilt vs retained

The access levels above are about the GUI. This is the other axis — **who owns
the objects** — and it decides whether an object has a lasting identity. Pick it
before you start; converting later means rewriting the app's core.

| | **Rebuilt** (`sketch()` / `sketch2d()`) | **Retained** (`appShell()` + `Doc` + `bindScene`) |
|---|---|---|
| The scene is | re-created by your function on every param change | created once, then edited |
| Objects | are thrown away and re-declared each run | live until you remove them |
| Identity | positional: ids follow declaration order and restart at `clear()` | a record id from `doc.add`, stable for its whole life; every object showing it carries `key` = `"collection/id"` |
| Selection / gizmo | survives a re-run while the run declares the same objects (see [`Scene.genId`](src/scene/Scene.ts)) | `Selection` by record + `selectOnClick`: survives re-renders, undo, reload |
| Undo / redo | not a concept — the code is the state | `doc.undo()` / `redo()`, `transact` for one step, `coalesce` for a drag |
| Save / load | `getParams()` / `setParams()`, re-run the code | `doc.toJSON()` / `doc.load()`; or persist live with `localAdapter` / `devServerAdapter` / `supabaseAdapter` |
| Best for | studies, demos, teaching, anything parametric end-to-end | apps where the user builds, names and reopens things |
| Examples | every playground page | playground **Site Editor** ([site-editor.ts](playground/pages/site-editor.ts)), **App Shell** |

**Rebuilt** is the fast path: write a function, get sliders, change a number and
everything is recomputed. The cost is that no object outlives a run, so nothing
can carry a lasting handle. What tekto guarantees is narrower: rebuilding the
same content reproduces the same ids, which is what keeps a selection and its
transform gizmo attached across the re-run a click triggers. Add, remove or
reorder an object and the ids after it shift.

**Retained** is the CAD model: your app holds a document, each entry gets an id
when it is created, and that id is the handle — through edits, undo, saving and
reopening. tekto provides the pieces:

```ts
const doc = new Doc<{ blocks: Block }>({ name: "site", adapter: localAdapter() });   // records = decisions, as JSON
const blocks = bindScene(doc, "blocks", app.scene, (b) => app.scene.addMesh(blockMesh(b)));  // geometry is derived
selectOnClick(app.renderer, app.scene, selection);                                    // selection by record
doc.update("blocks", id, { h: 12 }, { coalesce: "h" }); doc.undo(); doc.toJSON();
```

The scene follows the document record by record — only what changed is rebuilt —
and ✎ Markup marks name the records they touch. The [Site Editor](playground/pages/site-editor.ts)
page puts it all together in about 170 lines. `sketch()` is not involved; use
`appShell()` or your own UI (React, or anything else).

**Choosing.** If a user will point at a thing and expect it to stay that thing —
select it, rename it, attach data to it, save the file, come back tomorrow — you
need the retained model. If the whole design is a function of its parameters,
stay with the rebuilt one; it is far less code.

## Generators

| Generator | Description |
|---|---|
| `box(w, h, d)` | Axis-aligned box |
| `sphere(r, segments, rings)` | UV sphere |
| `cylinder(rTop, rBottom, h, segments)` | Cylinder/cone |
| `torus(majorR, minorR, segments, sides)` | Torus |
| `grid(w, d, divsX, divsZ, heightFn?)` | Height-mapped grid |
| `revolve(profile, segments)` | Revolution surface from 2D profile |
| `extrude(polygon, direction)` | Extrude polygon along vector |
| `loft(profiles)` | Loft between cross-sections |
| `subdivide(mesh)` | Catmull-Clark subdivision (creases, pinned vertices) |
| `midpointSubdivide(mesh)` | Linear 1→4 triangle refinement |
| `triangulate(mesh)` | Fan triangulation |
| `pipe(path, radius, sides)` | Tube swept along a 3D polyline |

All of them return a `Mesh`. `grid(...)` also has `.update(heightFn)` for rewriting heights in place.

## Algorithms

**2D:** convex hull, ear-clipping triangulation, point-in-polygon, segment intersection, signed area, centroid, min enclosing circle (Welzl), robust boolean ops with holes (`PolygonBool`: union/difference/intersection), Minkowski sum / No-Fit Polygon / inner-fit for nesting (`NoFitPolygon`), perpendicular edge-visibility regions (`perpVisibility` / `edgeOutwardVisibility`)

**3D:** convex hull (incremental), mesh volume/surface area/centroid, Laplacian smoothing

## BIM walls, slabs, and IFC export

A small BIM layer for timber-frame architectural experiments.

- **Walls** ([src/bim/walls/](src/bim/walls/)) — `WallType` ↔ `Wall` instances; constructions for solid CLT, Balloon-frame, and Holzrahmenbau; first-class joints (`WallJoint`) with butt / mitered styles and through-wall corner extension.
- **Slabs** ([src/bim/slabs/](src/bim/slabs/)) — same shape as walls: `SlabType` ↔ `Slab`, with `SolidSlabConstruction` and `JoistedSlab(opts)` (timber-joist + rim joist + sheathing + ceiling + configurable `edgeOffset` and `bearingGap`). Joist orientation is picked from the supporting walls via `chooseJoistDirection`.
- **IFC4 export** ([src/io/IfcWriter.ts](src/io/IfcWriter.ts)) — writes STEP-21 directly (no `web-ifc` dependency). Covers wall types, material layers, openings, framed members, joints, and **multi-storey** buildings.
- **Solar / shadow studies** ([src/core/solar/SunPosition.ts](src/core/solar/SunPosition.ts)) — Michalsky-style sun-position algorithm (~0.01° accuracy 1950–2050). Date + lat/lon → altitude / azimuth / unit direction vector in Z-up scene coords.

The Timber demo ([playground/pages/timber/](playground/pages/timber/)) is the canonical example — drag the corners, toggle constructions, pick a wall or slab to edit it inline, set the Storeys slider to stack the room, then click *Export ▾ → IFC* in the top bar.

### Multi-storey IFC

`IfcWriter` always creates one bootstrap storey from its options. Add more with `addStorey({ name, elevation })` and pass the returned ref via `opts.storey` on per-element calls:

```ts
const writer = new IfcWriter({ buildingName: "House", storeyName: "Ground floor" });
const ground = writer.getDefaultStorey();
const first  = writer.addStorey({ name: "First floor", elevation: 3.0 });

writer.addWallSystem(groundFloorSystem, { storey: ground });
writer.addWallSystem(firstFloorSystem,  { storey: first  });
writer.addSlab(foundation, { storey: ground, predefinedType: "FLOOR" });
writer.addSlab(midFloor,   { storey: first,  predefinedType: "FLOOR" });
writer.addSlab(roof,       { storey: first,  predefinedType: "ROOF"  });
```

Each storey gets its own `IfcRelContainedInSpatialStructure` at save time; the building → storeys aggregation is emitted automatically.

## Testbench shell pattern

The playground's testbench ([playground/testbench.html](playground/testbench.html) + [.ts](playground/testbench.ts)) is also a *template* for custom apps. Three reusable pieces:

- **Top-bar** with global controls — page chooser (categorised dropdown), render mode (solid / wireframe / hidden-line / ghost), Cut (a section along Z, X or Y, and where), lighting preset (Flat / Studio with PBR + soft shadows + ACES tonemapping), Sun popover (city / lat-lon / date / hour / `Now` button), Export ▾ and Import ▾ menus populated dynamically from the current sketch.
- **`SketchConfig.showHeader`** — set `false` (or auto-detected when the container has `data-shell="…"`) to suppress the sketch's internal title bar so the shell's top bar becomes the single source of page identity.
- **`lab.registerExport({ name, fileName, handler })`** / **`lab.registerImport({ name, accept, handler })`** — sketches register handlers; the shell discovers them via `SketchInstance.getExports/getImports` + `onExportsChange/onImportsChange` and shows menu items automatically.

A custom app can either copy the relevant blocks out of `testbench.html` / `testbench.ts` and adapt them, or use the testbench unchanged and add its own pages under `playground/pages/`.

## Lighting presets

Two presets, switchable from the top bar's *Light* dropdown (persisted in `localStorage`):

| Mode | Materials | Shadows | Tonemapping | Best for |
|---|---|---|---|---|
| **Flat** (default) | `MeshPhongMaterial`, 3 cheap lights | none | linear | Inspection, fast iteration, large mesh counts |
| **Studio** | `MeshStandardMaterial` (PBR) | PCF-soft, 2048² map, 30 m frustum | ACES filmic + sRGB | Renderings, daylight studies, architecture demos |

The sun direction is driven from the top-bar Sun popover (`SunPosition.compute({ date, latitude, longitude })` → `SketchInstance.setSunDirection(direction)`). Inside a sketch, `lab.setSunDirection(dir)` lets the sketch override per-frame (animated daily cycles, etc.).

### Flat vs smooth shading

Surface meshes shade **smoothly** by default: `computeVertexNormals()` averages the
normals of the faces meeting at each vertex. That's right for curved surfaces, but
for hard-edged geometry it has a catch — if a box **shares** its 8 corner vertices
across faces (as `MeshFactory.box` does), the averaged corner normals make it read
as a subtly *rounded* cube.

Two ways to get crisp, faceted faces:

- **Per-mesh, no geometry change** — set `flatShading: true` in the style:
  ```ts
  scene.addMesh(box, { color: "#9aa3b2", flatShading: true });
  ```
  Three.js then derives a per-face normal on the GPU, ignoring the shared vertex
  normals. Works on any mesh, costs nothing extra, and is the usual answer.
- **In the geometry** — give every face its own (unshared) vertices before
  `computeVertexNormals()`, so each gets a flat normal. Only needed when the hard
  edges must survive **export** (OBJ/DXF read vertex normals; the material flag
  doesn't travel with the geometry).

### Hidden-line edges

The **hidden-line** render mode draws **sharp (feature) edges only** — built with
`THREE.EdgesGeometry`, so an edge appears only where the angle between its two
faces exceeds `style.edgeAngle` (default **30°**). Coplanar tessellation edges —
a quad's diagonal split, or the tiling seams across a flat wall — drop out,
leaving a clean technical-drawing look. Lower the angle to reveal gentler creases
on curved surfaces; raise it to show only the hardest edges. Lines draw in a
neutral gray unless the object sets `style.edgeColor`, which keeps its identity
color readable in the line drawing:

```ts
scene.addMesh(building, { edgeAngle: 20 });                      // a touch more detail
scene.addMesh(flat, { color: "#e0a14f", edgeColor: "#e0a14f" }); // colored edges
```

Note this draws creases, not view-dependent silhouettes — a smooth sphere has no
sharp edges, so in hidden-line it reads as the occluding solid with no lines.

### Ghost and section cuts

**Ghost** (`scene.setRenderMode("ghost")`, the Ghost button) draws every surface faint in
its own colour, with its creases, so what is inside reads through what is in front; a
selected object is drawn solid. A **section** cuts the model with a plane and fills the cut:

```ts
renderer.setSection({ axis: "z", coordinate: 1.2 });     // plan cut at 1.2 m: what is above goes
renderer.setSection({ axis: "x", at: 0.5 });             // through the middle of the content
renderer.setSection({ axis: "y", at: 0.3, flip: true }); // keep the other side
renderer.setSection(null);
```

In a `sketch()` it is `lab.setSection(…)`, and it stays across re-runs. Clicks pick what is
still there. The cut face is the solids' inside drawn flat (poché) on opaque surfaces, so it
needs no closed meshes; translucent ones are just clipped. Both cost nothing until used.

### A drawing over the 3D view

A sketch can show what it builds as a drawing too: `lab.overlay()` is a layer over the 3D
view, kept across re-runs, and a `SheetCanvas` mounted there draws the `Sheet` the run builds
from the same numbers as the model — so the plan, the elevation, the DXF and the 3D view
can't disagree. (In `appShell()` it is `app.overlay()`.)

```ts
let sheetView: SheetCanvas | null = null;                  // outside the sketch function
sketch((lab) => {
  const showDrawing = lab.toggle("Drawing", false);
  // … build the model, and the Sheet from the same numbers …
  sheetView ??= new SheetCanvas(lab.overlay());
  sheetView.setSheet(sheet);                               // keeps its zoom across runs
  lab.overlay().style.display = showDrawing.value ? "" : "none";
});
```

Snapshots and ✎ Markup include a visible overlay, so an agent sees the drawing a person sees.

### Commands and shortcuts

What an app can do goes in one list, with its keys, rather than in a hand-written `keydown`
handler nobody else can see. `appShell()` has `app.commands`; a `sketch()` declares
them per run with `lab.command`:

```ts
app.commands.add([
  { id: "edit.undo", label: "Undo", keys: "Mod+Z", run: () => doc.undo(), enabled: () => doc.canUndo() },
  { id: "edit.delete", label: "Delete", keys: ["Delete", "Backspace"], run: removeSelected },
]);
```

`Mod` is ⌘ on a Mac and Ctrl elsewhere; keys typed into a field stay in the field; a command
whose `enabled()` says no is skipped. `formatKeys("Shift+Mod+Z")` writes it as the platform
does (⇧⌘Z / Ctrl+Shift+Z). Every 3D app starts with the view commands (`view.fitAll`,
`view.top`, `view.front`, …, `view.toggleProjection`) without keys. Agents list them with
`window.__tekto.commands()` and run one with `__tekto.run(id)`; snapshots name them.

### Named views and the axis widget

`renderer.setView("top")` is a plan (north up), `"front"`, `"back"`, `"left"`, `"right"` are
elevations, `"iso"` the diagonal; the camera turns there at the same distance (pass
`{ animate: false }` to jump). With `setProjection("orthographic")` they are drawings. In a
`sketch()`: `lab.setView("front")`.

The **axis widget** (`navGizmo`) sits in a corner: click an axis for that view, drag it to
orbit, double-click to square up to the nearest axis, and toggle persp/ortho under it.
Ask for it with `navGizmo: true` in `appShell()` or `sketch()` (or a corner, `"top-left"`);
it is off by default because an app may have its own panels in that corner.

A few more things the renderer does for a model, none of which an app has to ask for:
- **Creases are drawn in, a frame at a time.** Hidden line and ghost build their edges
  within a time budget per frame, so switching a model of thousands of meshes doesn't
  stall the tab. `renderer.pendingEdges` says how many are left; a snapshot waits for all.
- **The sun frames the content.** In Studio, the shadow camera is fitted to what the scene
  shows, so a 1 m part and a 100 m site both get complete, sharp shadows.

And two it offers:
- `renderer.setSelectionStyle("outline")`: a selection is outlined on top of everything
  instead of tinted, for apps whose colours carry meaning, and so it shows through what
  stands in front.
- `renderer.onHover((id) => …)`: what the pointer is over, reported when it changes. The top bar's Cam control follows the projection
wherever it is changed (`renderer.onProjection`).

## Markup — instructions for an AI, drawn on the view

Every 3D `sketch()` has a **✎ Markup** button in the viewport corner. Draw on the view, give each mark a short note, write an overall instruction and press **Save** (⌘S). The capture is a bundle an agent can read:

```
.tekto/markup/<stamp>-<sketch>/     (and a copy in .tekto/markup/latest/)
  view.png      the view with numbered magenta marks and a legend of the notes
  clean.png     the same view without marks
  markup.json   camera, params, one entry per mark, and a summary of the scene
```

Each mark keeps its strokes as vectors *and* the scene objects they touch, resolved when you draw it. That means its kind (`loop` = the things inside, `line`, `point`, `cross`, `stroke`), the objects it hits with their layer, label and colour, the **source line that created each one** (e.g. `apps/stair/main.ts:212`), and the world points it lands on. The PNG shows what you meant; the JSON says exactly which object, where, and in which file. Shift-drag adds a stroke to the previous mark. Esc closes Markup.

An agent can take the same capture itself, without marks, to look at its own result:

```bash
npm run snap -- "http://localhost:5173/testbench.html?page=mesh-factory" \
  [--params '{"Subdivision Levels":2}'] [--camera 8,6,10,0,0,0] [--size 1400x900]
```

`snap` drives headless Chrome over the DevTools protocol (no extra dependency) and writes to `.tekto/markup/<stamp>-snap/`. It works on every kind of app — `sketch()`, `sketch2d()` and `appShell()` all install `window.__tekto` — prints the app's `lab.log` lines, and **exits 1 when the page threw or logged an error** (`--allow-errors` accepts that), so a broken page is never taken for a finished one. `markup.json` carries the params, the log lines, those errors and the app's commands; in the page, `window.__tekto.schema()` lists every control with its range and value, and `window.__tekto.commands()` / `__tekto.run("edit.undo")` list and run what the app can do, the way a person would by key. `--params` names controls by their label (case-insensitive), or `"Group:Label"` when two share a label; a name that matches nothing fails the run and lists the page's controls, so a change that didn't apply is never photographed as if it had.

Saving to disk and mapping stack positions to `.ts` lines is done by a small Vite plugin; the playground already has it. In an app's `vite.config`:

```js
import tektoMarkup from "tekto/markup-vite";
export default { plugins: [tektoMarkup()] };
```

Without the plugin, Save downloads the three files instead. Turn the button off with `sketch(fn, { markup: false })`.

## Shared editing — several people (and agents) on one model

`SharedStore` is a document of keyed records that everyone with the same document name edits together: a write applies locally at once, is stored by the backend and reaches the other clients live. Per key the last write wins (backend clock) — right for small teams, especially with **presence** showing who is on what. Broadcasts carry transient messages (a point while it is dragged) that are never stored.

```ts
import { SharedStore, devServerAdapter, PresenceBar } from "tekto";

const store = new SharedStore<[number, number, number]>({ doc: "my-model", adapter: devServerAdapter() });
await store.connect();
store.onChange((keys, source) => lab.invalidate());   // a local or remote change → re-run
store.set("p1", [0, 1, 2]);                            // applied here, stored, sent to everyone
store.setPresence({ selected: "p1" });                 // others see it in store.others
new PresenceBar(store, lab.viewport);                  // badges + Sign in, left of ✎ Markup
```

**Shared selection.** In a retained app the selection travels through presence, so everyone
sees who is on what before two edits collide:

```ts
shareSelection(selection, doc.store, app.renderer, app.scene);
```

This client's selected record keys go into its presence, and the renderer outlines what the
others have selected, each in their presence colour. The outlines follow the records through
rebuilds and are clipped by a section. The Site Editor does it with `?shared=1`: open it in
two windows.

The backend is an adapter:

| adapter | for | records live in |
|---|---|---|
| `memoryAdapter()` | tests, one-page demos | memory |
| `devServerAdapter()` | windows on one Vite dev server (and agents) | `.tekto/collab/<doc>.json` — edit it and the windows follow |
| `supabaseAdapter(client)` | online, with sign-in | a Supabase table (+ history) |

The dev adapter needs the plugin (the playground has it — see the **Shared Editing** page):

```js
import tektoCollab from "tekto/collab-vite";
export default { plugins: [tektoCollab()] };
```

**Supabase.** The app creates the client (`createClient(url, anonKey)` from `@supabase/supabase-js`, the app's own dependency) and passes it: `supabaseAdapter(client, { provider: "github" })`. Set up once in the project's SQL editor — records, a history of every write, and writes only for the GitHub logins in `tekto_editors` (who wrote is taken from the sign-in, never from the client):

```sql
create table if not exists public.tekto_records (
  doc text not null, key text not null, value jsonb,
  by text not null default '', at timestamptz not null default now(),
  primary key (doc, key)
);
create table if not exists public.tekto_history (
  id bigint generated always as identity primary key,
  doc text not null, key text not null, value jsonb, by text not null, at timestamptz not null
);
create table if not exists public.tekto_editors (login text primary key);

create or replace function public.tekto_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.by := coalesce(auth.jwt() -> 'user_metadata' ->> 'user_name', auth.jwt() ->> 'email', 'anon');
  new.at := now();
  return new;
end $$;
create or replace function public.tekto_log() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.tekto_history (doc, key, value, by, at) values (new.doc, new.key, new.value, new.by, new.at);
  return null;
end $$;
drop trigger if exists tekto_stamp on public.tekto_records;
create trigger tekto_stamp before insert or update on public.tekto_records
  for each row execute function public.tekto_stamp();
drop trigger if exists tekto_log on public.tekto_records;   -- after: once per write (an upsert
create trigger tekto_log after insert or update on public.tekto_records   -- fires both before-triggers)
  for each row execute function public.tekto_log();

create or replace function public.tekto_is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tekto_editors e
                 where e.login = auth.jwt() -> 'user_metadata' ->> 'user_name');
$$;

alter table public.tekto_records enable row level security;
alter table public.tekto_history enable row level security;
alter table public.tekto_editors enable row level security;
create policy "anyone reads" on public.tekto_records for select using (true);
create policy "editors insert" on public.tekto_records for insert with check (public.tekto_is_editor());
create policy "editors update" on public.tekto_records for update
  using (public.tekto_is_editor()) with check (public.tekto_is_editor());
create policy "editors read history" on public.tekto_history for select using (public.tekto_is_editor());
alter publication supabase_realtime add table public.tekto_records;

insert into public.tekto_editors (login) values ('your-github-login') on conflict do nothing;
```

GitHub sign-in: a GitHub OAuth app whose callback is `https://<project>.supabase.co/auth/v1/callback`, its id and secret under Supabase → Authentication → Providers → GitHub, and the app's URLs (deployed and `http://localhost:5173/**`) under Authentication → URL Configuration. Read access is open (`using (true)`); tighten that policy if the model is not public.

## Exploring everything via the testbench

Every part of the library is exercised by the playground testbench:

```bash
npm run playground   # all demos (Timber + IFC, Primitives, NURBS Surfaces, etc.)
```

The testbench's *Timber + IFC* page is the canonical showcase of the BIM walls/slabs/IFC layer and the lighting/shadow + Sun presets.

## Using tekto in your own project

### Option A — install straight from GitHub (recommended)

```bash
npm install github:modellstadt/tekto three
```

This builds tekto automatically on install (via its `prepare` hook). Then in any file:

```ts
import { sketch, Vec3, MeshFactory, SunPosition, IfcWriter } from "tekto";
```

> The React layer is a separate entry point — `import { TektoApp, ParamPanel } from "tekto/react"` (install `react` + `react-dom` for it). The core import above needs neither.

### Option B — sibling-folder link (for live local development of tekto itself)

If you want to edit tekto's source alongside your project (or pin to a specific local version), drop it next to your own project as a sibling:

```
~/your-workspace/
├── tekto/          ← cloned from this repo
└── my-project/       ← your project
```

In `my-project/package.json`:

```jsonc
{
  "dependencies": {
    "tekto": "file:../tekto",
    "three":   "^0.160.0"
  }
}
```

Then in `tekto/` (one-time):

```bash
npm install
npm run build         # produces dist/ that your project consumes
# (or `npm run dev` in a separate terminal for watch-mode hot-reload)
```

Then in `my-project/`:

```bash
npm install           # the file:../tekto dep resolves to the sibling
npm run dev           # or whatever your project's dev command is
```

Modern npm creates a real symlink (`node_modules/tekto → ../../tekto`), so source edits in tekto are picked up live.

### Option C — vendored copy (no link, no install)

For class assignments where you want the library to "just be there":

```bash
cp -R tekto/src my-project/lib/tekto/
```

Then `import { sketch } from "./lib/tekto/index"`. No npm needed for tekto itself, but you still need to install `three` (and `react` if you use the React layer).

### Your first sketch

Create `my-project/main.ts`:

```ts
import { sketch } from "tekto";

sketch((lab) => {
  const r = lab.slider("Radius", 0.1, 3, 1.5);
  const segs = lab.slider("Segments", 8, 64, 24, { step: 1 });

  const s = lab.sphere(r.value, segs.value);
  s.color("#38d9a9");

  lab.log("Volume",     s.volume().toFixed(3));
  lab.log("Vertices",   s.nodeCount().toString());
});
```

And `my-project/index.html`:

```html
<!DOCTYPE html>
<html><body><div id="app"></div><script type="module" src="./main.ts"></script></body></html>
```

`npm run dev` (with [Vite](https://vitejs.dev/) installed) gives you a hot-reload 3D app in the browser with a real GUI on the right.

### What's available from `tekto`?

Run this once and you have the whole public surface:

```ts
import * as G from "tekto";
console.log(Object.keys(G).sort());
```

Or use IDE autocomplete on the import line — every export is typed, and the core ones carry JSDoc. The big buckets:

- **Math + primitives**: `Vec2`, `Vec3`, `Vec4`, `Mat4`, `MathUtils`, `Ray`, `Plane`, `Triangle`, `AABB`, `Sphere`, `Polygon2D`, `Intersections`.
- **Meshes**: `Mesh` (the one class: id-based editing, connectivity, typed arrays), `MeshFactory` (primitives + extrude + revolve + loft + pipe + subdivide), `MeshTransform`, `MeshSubdivide`, `MeshCleanup`, `MeshAnalysis`.
- **Curves + surfaces**: `LineCurve`, `ArcCurve`, `HelixCurve`, `NurbsCurve`, `CubicBezierCurve`, `NurbsSurface`.
- **Algorithms**: `Algo` (convex hull, triangulation, point-in-polygon, …), `PolygonBool` (boolean ops with holes), `NoFitPolygon` (Minkowski / NFP / inner-fit for nesting), `perpVisibility` (collimated edge-visibility polygons), `Curvature` (Taubin), `StreamlineTracer`, `BspTree` (CSG), `PlanarGraph` (DCEL), `Delaunay2D`.
- **BIM**: `WallType`, `Wall`, `WallSystem`, `BalloonFrame`, `HolzrahmenBau`, `WallJoint`, `SlabType`, `Slab`, `JoistedSlab`, `IfcWriter`.
- **Solar**: `SunPosition` (date + lat/lon → altitude / azimuth / direction).
- **Rendering**: `ThreeRenderer` — the one 3D renderer under `sketch()` and `appShell()`: render modes (solid / wireframe / hidden line / ghost) with creases built a frame at a time, `setSection` (a cut with poché), `setView` (plans and elevations; orthographic + hidden line + `front` is an elevation) and the `navGizmo` axis widget, `fitTo`, `setCallouts` (labels in the margins with leaders), `setSelectionStyle("outline")`, `onHover`, `gridStyle: "fading"` (a ground ruled in metres for the content's size, fading out), `shadingBar` (icons in the view for render style, lighting and a morning / noon / sunset sun), a Studio sun framed to the content, and a teardown that releases the WebGL context. Its rules are plain functions (`viewDirection`, `sectionPlane`, `fitRadius`, …). A model from elsewhere (IFC, a cut list) goes in as `scene.addMesh(new Mesh(positions, indices), { color })` and gets all of it.
- **IO**: `ObjFile`, `DxfExporter` (2D hidden-line views of meshes), `Sheet` (a drawing at a scale: views placed on the sheet — plan, elevations projected from 3D, details — with lines, arcs, fills, text, dimensions, leaders and level marks; `toSVG` and `toDXF` export the same primitives; on screen `SheetCanvas` — pan, zoom, pick by `key`, highlight — or `drawSheet` into any canvas; over a 3D app in `app.overlay()` or a sketch's `lab.overlay()` — see the *Sketch + drawing* page), `writeDxf2D` (raw drawings: polylines, lines, circles, arcs, text, solids, line types; `scale: 1000` → mm), `writeDxf3D` (true-3D polylines/lines/points/arcs/circles in world space — all emit AutoCAD-safe R12), `download` / `stampName` (save a file from the browser — a `sketch()` lists `lab.registerExport` items in its Export menu), `IfcFile` (IFC *import* — needs `npm install web-ifc`), `IfcWriter` (IFC *export* — no extra deps).
- **Sketch API**: `sketch` (3D), `sketch2d` (2D canvas), `Lab` / `Lab2D` (the API surfaces you'll mostly use). Types `MarkupBundle` / `MarkupCaptureOptions` / `MarkupObjectRef` / `MarkKind` for the [Markup](#markup--instructions-for-an-ai-drawn-on-the-view) capture.
- **Shared editing**: `SharedStore` (keyed records, last write wins, presence, broadcasts), `memoryAdapter` / `devServerAdapter` / `supabaseAdapter`, `PresenceBar`, `collabColor` — see [Shared editing](#shared-editing--several-people-and-agents-on-one-model).
- **App Shell**: `appShell` — persistent-panel apps (panel built once, animation-friendly) with a built-in top bar (Flat/Studio lighting, render mode with an icon per mode, Persp/Iso camera, Cut and Sun popovers — each can be switched off).
- **React** (from `tekto/react`): `AccordionColumn` — a column of collapsible sections, one of which takes the leftover height and scrolls; headers stay visible with their own summary, open sections drag taller, and the arrangement persists. The shape every inspector ends up with. `ViewModeIcon` — a render mode's icon as a component.
- **GUI building blocks**: `ParamStore` (the one parameter model — all entry APIs store values here), `ControlPanel` (the shared slider/toggle/select/color/menu/tab renderer), `getTheme` (the white-on-dark panel palette), `LayerPanel`, `viewModeIconSvg` (a cube drawn the way each render mode draws — solid, ghost, hidden line, wireframe — for a mode switch).

For curated category breakdowns see **[Generators](#generators)**, **[Algorithms](#algorithms)**, and **[BIM walls, slabs, and IFC export](#bim-walls-slabs-and-ifc-export)** above. For a hands-on walk-through, open the playground (`npm run playground` in the tekto repo) and click any demo — the page's `.ts` file under [playground/pages/](playground/pages/) is exactly the kind of code you'd write to use the same API.

## For LLMs / coding assistants

If you're an LLM helping someone use tekto, read [`llms.txt`](llms.txt) first — the names that cover most apps, which to use for what, and five rules — and [`llms-full.txt`](llms-full.txt) for every export with its one-line doc. Then:

1. **Read [`CLAUDE.md`](CLAUDE.md) first** — it's the agent-editing handbook for this codebase: what catches agents out (one `Mesh`, re-running sketches), the two coordinate conventions, the lint setup (which extends to `playground/` + `tests/`, not just `src/`), and the "what to never do without asking" list.
2. **Use only the names exported from `src/index.ts`** (or `src/react.ts`, imported as `tekto/react`, for the React layer). Don't import from `tekto/src/*` directly — that's a private surface. If something a user needs isn't exported, file it as an issue or add the re-export deliberately.
3. **Pattern-match against the playground demos** ([playground/pages/](playground/pages/)) and the tests ([tests/](tests/)) — they are the canonical "how to use X" examples. Not every export has a demo yet; when one is missing, the export's JSDoc and its test are the next best reference.
4. **Sketches re-run on every parameter change.** Don't put expensive one-shot work inside the sketch body. Use `lab.button(...)` for one-shots; cache anything across runs in module-scope variables. The 3D viewport draws only when something changed (re-run, scene, camera, lights, animation); after changing three.js objects directly, call `lab.requestRender()`.
5. **There are two coordinate conventions — know which one you're in.** `sketch()` and the `MeshFactory` primitives are Y-up (three.js); `appShell()`, BIM (walls, slabs, stairs), DXF and sun position are Z-up (XY = ground plane). For CAD content in a `sketch()`, pass `up: "z"`. When emitting DXF or screen-space SVG, drop Z.
6. **Look before you claim.** When the user says "see the markup", read `.tekto/markup/latest/markup.json` and `view.png`. To check your own change visually, run `npm run snap -- <page url>` against the running dev server and read the bundle it prints. See [Markup](#markup--instructions-for-an-ai-drawn-on-the-view).
7. **Vec2 / Vec3 / Vec4 / Mat4 are immutable.** All ops return new instances. Don't mutate `.x` / `.y` / `.z`; to move a mesh node, assign `node.position = p`.

One name per concept: `Mesh`, `MeshFactory`, `Plane`. If you meet an older name in an app (`ConnectedMesh`, `FlatMesh`, `MeshGen`, `HPlane`), the app predates tekto 0.4/0.5 — see the CHANGELOG for the rename.

## Development

```bash
npm install        # install dependencies
npm run build      # build CJS + ESM + types (tsup)
npm run dev        # watch mode
npm test           # run vitest (unit tests in tests/*.test.ts)
npm run lint       # tsc --noEmit -p tsconfig.lint.json
                   # covers src/, playground/, tests/ — catches type
                   # errors in demos before they reach the browser
npm run playground # vite playground (testbench with all demos)
```

`tsconfig.lint.json` extends `tsconfig.json` with `noEmit: true` and a
wider `include` (`src`, `playground`, `tests`). `tsconfig.json` itself
is the *build* config and stays scoped to `src/` so `tsup` emits clean
declarations. CI should run `npm run lint` *and* `npm test`.

## License

MIT
