# Sheet

<Live page="drawing-sheet" label="Drawing Sheet" poster="/shots/drawing-sheet.webp" alt="A plan, two elevations and a detail on one sheet" />

A `Sheet` is a drawing at a scale: views placed on a sheet (a plan, elevations projected from 3D points, a detail at a larger scale) with lines, arcs, fills, text, dimensions, leaders and level marks on named layers, and a title block. It draws in the minimal language of an office's plans: small grey annotation sized in paper millimetres (2 mm text, 1.8 mm dimensions), view titles above each view stating their scale, black ink for what is cut, and colour only as pale fills for materials. Everything is exploded into one list of primitives, and the screen ([`SheetCanvas`](/drawings/sheet-canvas)), `toSVG` and `toDXF` all draw that list: what you see is what you export.

```ts
import { DRAWING_PALETTE, Sheet, Vec3 } from "tekto/core";

const w = 12, d = 7, h = 3.2;
const sheet = new Sheet({
  scale: 100,                                            // 1:100
  layers: {
    cut: { weight: 0.5 },
    view: { weight: 0.25 },
    axis: { weight: 0.13, dash: "center", color: DRAWING_PALETTE.faint },
    dims: { weight: 0.13, color: DRAWING_PALETTE.annotation },
  },
});

const plan = sheet.view("plan", { title: "Plan" });         // drawn as "Plan 1:100", above the view
plan.rect(0, 0, w, d, { layer: "cut", fill: DRAWING_PALETTE.concrete, key: "slab/roof" });   // `key` ties it to a record
plan.line([0, -1.5], [0, d + 1.5], { layer: "axis" });
plan.dim([0, d], [w, d], { layer: "dims", offset: 8 });      // offset in paper mm
plan.leader([[1, d], [2, d + 1.2], [4, d + 1.2]], "Roof edge above", { layer: "dims" });

// An elevation projected from the model's 3D points
const south = sheet.view("south", { at: [0, -(h + 6)], title: "South elevation", project: { right: new Vec3(1, 0, 0), up: new Vec3(0, 0, 1) } });
south.polyline([new Vec3(0, 0, 0), new Vec3(w, 0, 0), new Vec3(w, 0, h), new Vec3(0, 0, h)], { layer: "view", closed: true });
south.level(new Vec3(-1, 0, h), { layer: "dims" });

// The plan head, left of the drawing and level with its top
sheet.titleBlock({
  office: "Digital Building Technologies · ETH Zurich", project: "Pavilion",
  title: "Plan and elevation", phase: "Concept", number: "001.100", date: "16.11.2026", drawn: "BD",
  revisions: [{ index: "a", note: "Roof overhang 600" }], notes: ["Dimensions in metres."],
});

const svg = sheet.toSVG({ background: "#ffffff" });
const dxf = sheet.toDXF();                                 // AutoCAD-safe R12, one layer per sheet layer
console.log(sheet.explode().length, svg.length, dxf.length);
```

## What to know

- `sheet.paper(mm)` converts paper millimetres to model units at the sheet's scale, for symbols such as grid bubbles.
- A view's own `scale` enlarges a detail: `sheet.view("detail", { scale: 5, … })` on a 1:100 sheet is 1:20.
- Give primitives a `key` (`"columns/A1"`) and a click in the drawing selects the same record as a click in 3D.
- A title that names its own scale (`"Section A-A 1:20"`) is kept as written; `titleScale: false` leaves the scale off.
- `DRAWING_PALETTE` holds the colours: `ink`, `annotation` and `faint` greys, pale cut fills (`cut`, `steel`, `concrete`, `timber`, `poche`) and one `accent` for what must stand out.
- Level marks stand on a level line, and a leader always ends on a level shoulder with its text.
- Save with `download(sheet.toDXF(), "plan.dxf", { stamp: true })`.

::: tip Playground
[Drawing Sheet](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/drawing-sheet.ts): `?page=drawing-sheet`, with Export SVG and Export DXF.
:::
