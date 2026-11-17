# PDF

<Live page="drawing-sheet" label="Drawing Sheet" poster="/shots/drawing-sheet.webp" alt="A dimensioned drawing, the kind of content a PDF carries at scale" />

`writePdf2D` writes the same 2D content as `writeDxf2D` as a vector PDF at a true scale: one page sized to the drawing plus margins, a title with the scale, and a scale bar. Print it at 100 % and 1 m measures 2 cm at 1:50. Colours are darkened enough for white paper unless you ask for them as given.

```ts
import { download, writePdf2D, type Dxf2DContent } from "tekto";

const plan: Dxf2DContent = {
  polylines: [
    { layer: "cut", points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }], closed: true },
  ],
  lines: [{ layer: "axis", start: { x: 3, y: -1 }, end: { x: 3, y: 5 } }],
  texts: [{ layer: "text", at: { x: 0.2, y: 0.2 }, text: "Living", height: 0.2 }],
};

const pdf = writePdf2D(plan, {
  scale: 50,                 // 1:50
  title: "Ground floor",     // printed as "Ground floor · 1:50"
  margin: 10,                // mm
  scaleBar: true,
});
download(pdf, "plan.pdf", { stamp: true });
```

A drawing in metres is the default; pass `unit: 0.001` for one in millimetres.

::: tip Playground
No playground page writes a PDF yet. The [Drawing Sheet](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/drawing-sheet.ts) (`?page=drawing-sheet`) exports the same kind of drawing as SVG and DXF.
:::
