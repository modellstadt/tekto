# Why tekto

![A two-storey timber house built from records](/shots/house.webp)

tekto is a TypeScript library for computational geometry and CAD in the browser, made at [Digital Building Technologies](https://dbt.arch.ethz.ch/) (DBT), ETH Zurich, for teaching and research. It is built to be used *with* a coding agent: a person describes a design idea, the agent writes a small app, and both of them work on the same model in the browser.

## What makes it AI-first

- **One function is one app.** [`sketch()`](/apps/sketch) turns a single function into an interactive 3D app with sliders. It is short enough for an agent to write, read and rewrite in one go.
- **People can point.** ✎ Markup draws on the view. Each mark is resolved to the objects it touches, their world coordinates and the source line that made them, so a note says "this wall", not "the thing on the left". See [Markup and notes](/collaboration/notes).
- **Agents can look.** `npm run snap` captures a running app in headless Chrome the way a person sees it, and exits 1 if the page logged an error. An agent checks its change before it says it works.
- **Agents can work in the open app.** The [MCP server](/claude/mcp) lets Claude read and edit the document of the tab a person has open. Every edit is one undo step for that person.
- **Written for agents.** The repository's `CLAUDE.md` holds the conventions and the mistakes agents make most; `llms.txt` and `llms-full.txt` list every export with its one-line doc.

## What is in it

Underneath is a geometry toolkit that does not need an agent at all:

| Area | Names |
|---|---|
| Meshes | `Mesh`, `MeshFactory`, `MeshTransform`, `MeshSubdivide`, `BspTree` |
| Curves and surfaces | `NurbsCurve`, `NurbsSurface`, `CurveUtils`, `Curvature`, `StreamlineTracer` |
| 2D | `Polygon2D`, `PolygonBool`, `Voronoi2D`, `Delaunay2D`, `Particles2D`, `NoFitPolygon` |
| Fields | `VoxelGrid`, `MarchingCubes`, the `Sdf…` family |
| Buildings | `realizeBuilding`, `BUILDING_SCHEMA`, `Wall`, `Slab`, `Roof`, `Stair`, `IfcWriter` |
| Drawings and files | `Sheet`, `SheetCanvas`, `writeDxf2D`, `writeDxf3D`, `writePdf2D`, `ObjFile`, `IfcModel` |
| Apps | `sketch`, `sketch2d`, `appShell`, `Doc`, `SharedStore`, `ThreeRenderer` |

Everything is plain browser code: TypeScript, three.js and Vite. An experiment is a static page you can share as a link.

## Three entry points

| Import | What | Needs |
|---|---|---|
| `"tekto"` | everything: geometry, the three.js renderer, panels, `sketch()`, `appShell()` | a browser, `three` |
| `"tekto/core"` | geometry and data only | nothing; runs in Node, workers and tests |
| `"tekto/2d"` | `sketch2d` and the 2D geometry a first sketch needs | a browser, no `three` |
| `"tekto/react"` | React components | `react`, `react-dom` |

Use `tekto/core` for scripts, checks and workers. CI makes sure it never pulls in three.js.

## Two ways to hold a model

Decide this first; changing later means rewriting the app's core.

- **Rebuilt**: `sketch()` and `sketch2d()` run your function again on every change and re-create every object. Right for parametric studies, where the design is a function of its parameters.
- **Retained**: an `appShell()` app keeps a [`Doc`](/buildings/doc) of records with stable ids, and the scene follows it. Right when a person selects things, names them, undoes and saves.

## Two coordinate conventions

`sketch()` and the `MeshFactory` primitives are Y-up, as in three.js. `appShell()`, buildings, DXF and the sun are Z-up, with XY as the ground plane. For CAD content in a `sketch()`, pass `up: "z"`.
