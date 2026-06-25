# ⬡ Tekto

Computational geometry toolkit for **interactive 3D generation, analysis, and visualization**. Built for teaching and experimentation.

It's not just meshes: curves & **NURBS** surfaces, **SDF** fields, voxels, graphs (incl. planar/Delaunay), **BIM** timber framing + **IFC** export, solar, and physics — plus analysis (curvature, mesh metrics, convex hull) and renderers, all in one toolkit.

**Mesh** (adjacency-tracked) → for editing, subdivision, topology queries  
**FlatMesh** (typed arrays) → for rendering, animation, large meshes (500K+ tris)  
**Sketch API** → one function = a full interactive app with GUI

> **For students:** if you got this repo to embed in your own project, skip ahead to **[Using tekto in your own project](#using-tekto-in-your-own-project)**. The rest of the README is for people working *on* the library itself.

## Quick Start

```bash
npm install github:modellstadt/tekto three
# add `react react-dom` only if you import from "tekto/react"
```

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
import { Mesh, MeshGen, FlatMesh, FlatMeshGen, Vec3 } from "tekto";

// Adjacency-tracked mesh (for editing)
const mesh = new Mesh();
const a = mesh.addNode(new Vec3(0, 0, 0));
const b = mesh.addNode(new Vec3(1, 0, 0));
const c = mesh.addNode(new Vec3(0.5, 1, 0));
mesh.addTriangle(a, b, c);
mesh.computeVertexNormals();

// Procedural generation
const terrain = MeshGen.grid(10, 10, 32, 32, (x, z) =>
  Math.sin(x * 0.8) * Math.cos(z * 0.6) * 0.5
);
const vase = MeshGen.revolve(profile, 32);
const smooth = MeshGen.subdivide(box);

// High-performance flat mesh (for large data)
const bigTerrain = FlatMeshGen.grid(100, 100, 500, 500);
bigTerrain.smooth(3, 0.5);         // in-place
console.log(bigTerrain.volume());   // instant
```

## Architecture

```
src/
├── core/               ← Pure geometry, zero dependencies
│   ├── math/           ← Vec2, Vec3, Vec4, Mat4
│   ├── primitives/     ← Ray, Plane, Triangle, AABB, Sphere
│   ├── mesh/           ← Mesh + FlatMesh + generators
│   └── algo/           ← Convex hull, triangulation, analysis
├── scene/              ← Scene graph with visual properties
├── render/             ← Three.js + SVG renderers
├── gui/                ← Parameter system with auto-UI
├── sketch/             ← Sketch API (student-facing)
└── react/              ← React components + hooks
```

### Mesh vs FlatMesh

| | **Mesh** | **FlatMesh** |
|---|---|---|
| Storage | Map per node/edge/face | Float32Array + Uint32Array |
| Memory | ~1KB per vertex | ~24 bytes per vertex |
| Adjacency | Always available | Lazy, built on first query |
| Editing | Add/remove nodes/edges/faces | Append only |
| 10K verts | 50ms build, 10MB | 2ms build, 0.2MB |
| 100K verts | 800ms build, 100MB | 8ms build, 2.4MB |
| Best for | Subdivision, topology, teaching | Rendering, animation, large data |
| Conversion | `FlatMesh.fromConnectedMesh(m)` | `flat.toConnectedMesh()` |

### Three access levels

1. **Sketch API** — one function, zero framework knowledge. For students and quick experiments.
2. **Scene + Params** — framework-agnostic. For apps without React.
3. **React components** — `<ParamPanel>`, `<InspectorPanel>`, hooks, imported from **`tekto/react`** (install `react` + `react-dom`). For full applications. The core `tekto` barrel is React-free, so non-React apps need neither.

## Generators

| Generator | Description |
|---|---|
| `box(w, h, d)` | Axis-aligned box |
| `sphere(r, segments, rings)` | UV sphere |
| `cylinder(rTop, rBottom, h, segments)` | Cylinder/cone |
| `torus(majorR, minorR, segments, sides)` | Torus |
| `grid(w, d, divsX, divsZ, heightFn?)` | Height-mapped grid |
| `revolve(profile, segments)` | Revolution surface from 2D profile |
| `extrude(polygon, direction)` | Extrude polygon along vector — **`MeshGen` only** |
| `loft(profiles)` | Loft between cross-sections — **`MeshGen` only** |
| `subdivide(mesh)` | Catmull-Clark subdivision |
| `triangulate(mesh)` | Fan triangulation — **`MeshGen` only** |
| `pipe(path, radius, sides)` | Tube swept along a 3D polyline — **`MeshGen` only** |

`MeshGen` (→ Mesh) implements all eleven. `FlatMeshGen` (→ FlatMesh) implements the seven that
don't need adjacency — `box`, `sphere`, `cylinder`, `torus`, `grid`, `revolve`, `subdivide` — but
not `extrude`, `loft`, `triangulate`, or `pipe`.

## Algorithms

**2D:** convex hull, ear-clipping triangulation, point-in-polygon, segment intersection, signed area, centroid, min enclosing circle (Welzl)

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

- **Top-bar** with global controls — page chooser (categorised dropdown), render mode (solid / wireframe / hidden-line), lighting preset (Flat / Studio with PBR + soft shadows + ACES tonemapping), Sun popover (city / lat-lon / date / hour / `Now` button), Export ▾ and Import ▾ menus populated dynamically from the current sketch.
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
on curved surfaces; raise it to show only the hardest edges:

```ts
scene.addMesh(building, { edgeAngle: 20 });   // a touch more detail
```

Note this draws creases, not view-dependent silhouettes — a smooth sphere has no
sharp edges, so in hidden-line it reads as the occluding solid with no lines.

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

Or use IDE autocomplete on the import line — every export is typed and has JSDoc. The big buckets:

- **Math + primitives**: `Vec2`, `Vec3`, `Vec4`, `Mat4`, `MathUtils`, `Ray`, `Plane`, `Triangle`, `AABB`, `Sphere`, `Polygon2D`, `Intersections`.
- **Meshes**: `Mesh` / `ConnectedMesh` (adjacency), `FlatMesh` / `RenderMesh` (typed arrays), `MeshFactory` / `MeshGen` (primitives + extrude + revolve + loft + subdivide), `FlatMeshGen`, `MeshAnalysis`.
- **Curves + surfaces**: `LineCurve`, `ArcCurve`, `HelixCurve`, `NurbsCurve`, `CubicBezierCurve`, `NurbsSurface`.
- **Algorithms**: `Algo` (convex hull, triangulation, point-in-polygon, …), `Curvature` (Taubin), `StreamlineTracer`, `BspTree` (CSG), `PlanarGraph` (DCEL), `Delaunay2D`.
- **BIM**: `WallType`, `Wall`, `WallSystem`, `BalloonFrame`, `HolzrahmenBau`, `WallJoint`, `SlabType`, `Slab`, `JoistedSlab`, `IfcWriter`.
- **Solar**: `SunPosition` (date + lat/lon → altitude / azimuth / direction).
- **IO**: `ObjFile`, `DxfExporter`, `IfcFile` (IFC *import* — needs `npm install web-ifc`), `IfcWriter` (IFC *export* — no extra deps).
- **Sketch API**: `sketch`, `Lab` (the API surface you'll mostly use).

For curated category breakdowns see **[Generators](#generators)**, **[Algorithms](#algorithms)**, and **[BIM walls, slabs, and IFC export](#bim-walls-slabs-and-ifc-export)** above. For a hands-on walk-through, open the playground (`npm run playground` in the tekto repo) and click any demo — the page's `.ts` file under [playground/pages/](playground/pages/) is exactly the kind of code you'd write to use the same API.

## For LLMs / coding assistants

If you're an LLM helping someone use tekto, please:

1. **Read [`CLAUDE.md`](CLAUDE.md) first** — it's the agent-editing handbook for this codebase: naming gotchas (mesh has two names), coordinate convention (Z-up), the lint setup (which extends to `playground/` + `tests/`, not just `src/`), and the "what to never do without asking" list.
2. **Use only the names exported from `src/index.ts`** (or `src/react.ts`, imported as `tekto/react`, for the React layer). Don't import from `tekto/src/*` directly — that's a private surface. If something a user needs isn't exported, file it as an issue or add the re-export deliberately.
3. **Pattern-match against the playground demos** ([playground/pages/](playground/pages/)) — every public API has at least one demo that exercises it. They're the canonical "how to use X" examples. Find one and copy its shape.
4. **Sketches re-run on every parameter change.** Don't put expensive one-shot work inside the sketch body. Use `lab.button(...)` for one-shots; cache anything across runs in module-scope variables.
5. **Coordinate convention is Z-up** (XY = ground plane). When emitting DXF or screen-space SVG, drop Z. The walls / slabs / sun-position modules all assume this convention; don't rotate to Y-up just because Three.js does by default.
6. **Vec2 / Vec3 / Vec4 / Mat4 are immutable.** All ops return new instances. Don't mutate `.x` / `.y` / `.z` — search for `as any` in the repo before reaching for that escape hatch.

The recurring "the same concept has two or more names" pitfalls are catalogued near the top of CLAUDE.md. Reading those three points alone will save you most debugging time.

## Development

```bash
npm install        # install dependencies
npm run build      # build CJS + ESM + types (tsup)
npm run dev        # watch mode
npm test           # run vitest (150 tests, 16 files)
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
