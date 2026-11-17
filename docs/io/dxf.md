# DXF

<Live page="dxf-3d" label="DXF 3D Writer" poster="/shots/dxf-3d.webp" alt="A helix with rings, an arc and an axis, written as a true-3D DXF" />

<Live page="dxf-test" label="DXF Test" />
<Live page="drawing-sheet" label="Drawing Sheet" />

There are three ways to DXF, all writing AutoCAD-safe R12 (every layer declared, R12-safe names, plain decimals):

- `sheet.toDXF()`: a [drawing](/drawings/sheet) at a scale, with dimensions, text and line types, the same primitives as on screen.
- `writeDxf2D(content, { scale })`: raw 2D content (polylines, lines, circles, arcs, text, solids) on named layers. `scale: 1000` writes metres as millimetres.
- `writeDxf3D(content)`: true-3D polylines, lines, points, arcs and circles in world coordinates, for curves and fabrication paths.

`DxfExporter` makes 2D views of meshes with hidden lines removed, on the CPU or with a WebGL id buffer.

```ts
import { download, Vec3, writeDxf2D, writeDxf3D } from "tekto";

// A plan in millimetres
const outline = [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }];
download(writeDxf2D({
  polylines: [{ layer: "cut", points: outline, closed: true }],
  texts: [{ layer: "text", at: { x: 0, y: -0.5 }, text: "Plan 1:50", height: 0.25 }],
  layers: [{ name: "cut", color: 7 }, { name: "text", color: 8 }],
}, { scale: 1000 }), "plan.dxf");

// A helix in 3D, with a base circle
const helix = Array.from({ length: 129 }, (_, i) => {
  const t = i / 128, a = t * 4 * Math.PI * 2;
  return new Vec3(2 * Math.cos(a), 2 * Math.sin(a), t * 5);
});
download(writeDxf3D({
  polylines: [{ layer: "helix", points: helix }],
  circles: [{ layer: "rings", center: new Vec3(0, 0, 0), radius: 2 }],
  layers: [{ name: "helix", color: 5 }, { name: "rings", color: 1 }],
}), "helix.dxf");
```

::: tip Playground
[DXF 3D Writer](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/dxf-3d.ts) (`?page=dxf-3d`), [DXF Test](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/dxf-test.ts) (`?page=dxf-test`) for hidden-line views, and the [Drawing Sheet](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/drawing-sheet.ts).
:::
