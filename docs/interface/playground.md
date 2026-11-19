# The playground

The playground is tekto's apps in one page: 36 of them, from a single sphere to a house built from records. It is the quickest way to see what tekto does, and the place to try a change before it goes into an app.

<Live />

## On this site, and on your machine

**On this site** every page runs in your browser: turn and cut the model, change the light, move the sliders, export. A docs page about one of them shows it with **▶ Run it here**, which opens the app over the page, and **Open live**, which opens it in a tab of its own. In the playground, **Docs** and **Source** lead back to the page about it and to its code.

**On your machine** the same pages run from a clone, with what needs the dev server: ✎ Markup saves your marks to `.tekto/markup/` where Claude reads them (on this site it downloads the files instead), `npm run snap` captures a view for Claude, shared editing works, and a page reloads when its file changes. This is where you work with Claude.

```sh
npm run playground   # in a clone of tekto
```

![The playground with its top bar numbered](/shots/ui-playground.webp)

1. **Page**: pick an app. The address follows (`?page=timber`), so a link opens the same app.
2. **Render**: Solid, Wireframe, Hidden line or Ghost, for the page's view.
3. **Cut**: a section through the model.
4. **Light**: Flat or Studio.
5. **Sun**: the sun for a date and a place, and Studio's light follows it.
6. **Export** and **Import**: what the app can write (OBJ, IFC, DXF, …) or read, when it can.

Next to the page chooser, **Docs** opens the page about this app and **Source** its file.

The left side and the view are the app's own, as in any [tekto app](/interface/tour).

## Pages worth opening first

| Page | What it shows |
|---|---|
| <Live page="house" label="House" link /> | A two-storey house from records: framing, rooms, a timber stair, notes, IFC |
| <Live page="framed-floor" label="Framed Floor" link /> | A joisted floor over a stair: its well framed; timber, steel or concrete |
| <Live page="drawing-sheet" label="Drawing Sheet" link /> | A plan, elevations and a detail with a title block; SVG and DXF |
| <Live page="sketch-drawing" label="Sketch + drawing" link /> | A stair as a model and as a plan and section, from the same numbers |
| <Live page="nurbs-surfaces" label="NURBS Surfaces" link /> | A NURBS column, its ribs and its shell |
| <Live page="steps" label="Steps" link /> | A program shown as the graph of its steps |
| <Live page="site-editor" label="Site Editor" link /> | A model you edit: select, move, undo, save |
| `shared-editing` | Two windows editing the same model (from a clone) |

Each page is one file in `playground/pages/`: open it next to the running page to see how it is made.

## The lecture apps

The six groups named **Lecture** hold the 28 apps of the lecture script *Digital Theory and Culture in Architecture* (ETH Zurich). Each makes one idea of computational design legible: a parametric house whose stair follows Blondel's rule, shape grammars and L-systems, fitness landscapes and Pareto fronts, hanging chains and boids, a neural network and a tiny language model, a camera, the Cornell box, and 3D printing, milling, hot-wire cutting, brick bonds and stone.

They are 2D sketches ([sketch2d](/apps/sketch2d)): a panel of parameters, a drawing, and a status bar with the numbers the model computes. Their sources are in `playground/pages/lecture/`, one file each. In the lecture, the language model is trained on the script's own chapters. Here it is trained on these docs.

| Start with | What it shows |
|---|---|
| <Live page="lecture-house" label="Parametric house" link /> | Eight numbers make the house; the stair is derived from them |
| <Live page="lecture-walking" label="Walking" link /> | Distance, shortest path and a crowd, in a plan you draw |
| <Live page="lecture-cornell" label="Cornell box" link /> | Path tracing, one bounce at a time |
| <Live page="lecture-bricks" label="Brick bonds" link /> | Bonds, and bricks rotated by an attractor |
