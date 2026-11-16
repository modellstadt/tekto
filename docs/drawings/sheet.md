# Sheet

![A plan, two elevations and a detail on one sheet](/shots/drawing-sheet.webp)

A `Sheet` is a drawing at a scale: views placed on a sheet (a plan, elevations projected from 3D points, a detail at a larger scale) with lines, arcs, fills, text, dimensions, leaders and level marks on named layers. Annotation is sized in paper millimetres, so text stays readable at any scale. Everything is exploded into one list of primitives, and the screen ([`SheetCanvas`](/drawings/sheet-canvas)), `toSVG` and `toDXF` all draw that list: what you see is what you export.

```ts
import { Sheet, Vec3 } from "tekto/core";

const w = 12, d = 7, h = 3.2;
const sheet = new Sheet({
  scale: 100,                                            // 1:100
  layers: {
    cut: { weight: 0.5 },
    view: { weight: 0.25 },
    axis: { weight: 0.13, dash: "center", color: "#c62828" },
    dims: { weight: 0.13 },
  },
});

const plan = sheet.view("plan", { title: "Plan 1:100" });
plan.rect(0, 0, w, d, { layer: "cut", key: "slab/roof" });   // `key` ties a primitive to a record
plan.line([0, -1.5], [0, d + 1.5], { layer: "axis" });
plan.dim([0, d], [w, d], { layer: "dims", offset: 8 });      // offset in paper mm
plan.leader([[1, d], [2, d + 1.2], [4, d + 1.2]], "Roof edge above", { layer: "dims" });

// An elevation projected from the model's 3D points
const south = sheet.view("south", { at: [0, -(h + 6)], title: "South elevation 1:100", project: { right: new Vec3(1, 0, 0), up: new Vec3(0, 0, 1) } });
south.polyline([new Vec3(0, 0, 0), new Vec3(w, 0, 0), new Vec3(w, 0, h), new Vec3(0, 0, h)], { layer: "view", closed: true });
south.level(new Vec3(-1, 0, h), { layer: "dims" });

const svg = sheet.toSVG({ background: "#ffffff" });
const dxf = sheet.toDXF();                                 // AutoCAD-safe R12, one layer per sheet layer
console.log(sheet.explode().length, svg.length, dxf.length);
```

## What to know

- `sheet.paper(mm)` converts paper millimetres to model units at the sheet's scale, for symbols such as grid bubbles.
- A view's own `scale` enlarges a detail: `sheet.view("detail", { scale: 5, … })` on a 1:100 sheet is 1:20.
- Give primitives a `key` (`"columns/A1"`) and a click in the drawing selects the same record as a click in 3D.
- Save with `download(sheet.toDXF(), "plan.dxf", { stamp: true })`.

::: info Coming in the next release
`sheet.titleBlock({ … })` adds a title block (office, project, plan number, revisions); view titles move above the view on the left and state their scale on their own (`{ title: "Plan" }` → "Plan 1:50"); default annotation gets smaller (2 mm text); and `DRAWING_PALETTE` gives a minimal palette of inks, greys and pale cut fills.
:::

::: tip Playground
[Drawing Sheet](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/drawing-sheet.ts): `?page=drawing-sheet`, with Export SVG and Export DXF.
:::
