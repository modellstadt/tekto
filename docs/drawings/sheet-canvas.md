# SheetCanvas

<Live page="sketch-drawing" label="Sketch + drawing" poster="/shots/sketch-drawing.webp" alt="A stair drawn as a plan and an elevation over the 3D view" />

<Live page="drawing-sheet" label="Drawing Sheet" />

`SheetCanvas` shows a [`Sheet`](/drawings/sheet) in any container: it fills it, fits the drawing, zooms with the wheel about the cursor, pans by dragging and fits again on double-click. Mounted in `lab.overlay()` (or `app.overlay()` in an `appShell`), it lies over the 3D view, and the sketch builds the model and the drawing from the same numbers, so the plan, the elevation, the DXF and the 3D view cannot disagree.

```ts
import { download, MeshFactory, Sheet, SheetCanvas, sketch } from "tekto";

let sheetView: SheetCanvas | null = null;              // made once, outside the sketch function
let sheet = new Sheet();

sketch((lab) => {
  const n = lab.slider("Steps", 4, 20, 12, { step: 1 }).value;
  const r = 0.175, t = 0.28, w = 1.2;
  const showDrawing = lab.toggle("Drawing", true);
  lab.button("Export DXF", () => download(sheet.toDXF(), "stair.dxf", { stamp: true }));

  for (let i = 0; i < n; i++) {                        // the model
    const step = MeshFactory.box(t, w, r * (i + 1));
    step.translate(t * (i + 0.5), w / 2, (r * (i + 1)) / 2);
    lab.mesh(step).color("#c9b79c");
  }

  sheet = new Sheet({ scale: 50, layers: { view: { weight: 0.25 }, dims: { weight: 0.13 } } });   // the drawing
  const plan = sheet.view("plan", { title: "Plan 1:50" });
  for (let i = 0; i < n; i++) plan.rect(t * i, 0, t, w, { layer: "view" });
  plan.dim([0, 0], [t * n, 0], { layer: "dims", offset: -8 });

  sheetView ??= new SheetCanvas(lab.overlay());
  sheetView.setSheet(sheet);                           // keeps its zoom across runs
  lab.overlay().style.display = showDrawing.value ? "" : "none";
}, { up: "z", camera: [6, -5, 4], target: [1.6, 0.6, 1] });
```

## What to know

- `sheetView.onPick((prim, mods) => …)` reports the primitive clicked, with its `key`; `setHighlight(keys)` lights up the primitives of those records.
- Snapshots and ✎ Markup include a visible overlay, so an agent sees the drawing a person sees.
- `drawSheet(ctx, sheet, transform)` draws into a canvas of your own, and `fitSheet` gives the transform that fits it.

::: tip Playground
[Sketch + drawing](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/sketch-drawing.ts) (`?page=sketch-drawing`), and the [Drawing Sheet](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/drawing-sheet.ts), where one selection is shared by the drawing and the 3D view.
:::
