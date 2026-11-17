# Roofs

<Live page="roofs" label="Roofs" poster="/shots/roof-hip.webp" alt="A hip roof at sunset" />

`Roof` makes a flat, shed (mono-pitch), gable or hip roof from plain data: the outside face of the walls as a footprint, the eaves elevation, the pitch, the overhangs and the build-up. It gives the top surfaces and slab meshes of its planes, the ridge, and the gables: the infill above the end walls, since walls have one height. A flat roof takes any footprint; the pitched kinds take a rectangle whose first edge is an eave.

```ts
import { IfcWriter, Roof, Vec2 } from "tekto/core";

const footprint = [new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 8), new Vec2(0, 8)];
const roof = new Roof({
  kind: "gable",                 // "flat" | "shed" | "gable" | "hip"
  footprint,
  eavesElevation: 3,             // top of the walls
  pitch: 35,
  overhang: 0.6,
  gableOverhang: 0.3,
  thickness: 0.3,
  name: "Roof",
});

roof.ridgeHeight();                                     // world Z of the ridge
const area = roof.planes().reduce((s, p) => s + p.area, 0);
const gables = roof.gables(0.3);                        // infill above the end walls, 0.3 m thick
const mesh = roof.toMesh();

const ifc = new IfcWriter({ projectName: "Roof" });
ifc.addRoof(roof, { gableThickness: 0.3 });              // an IfcRoof of roof slabs, the gables as walls
console.log(area, gables.length, mesh.faceCount, ifc.save().length);
```

In a building, a roof is a record with a `storey`; its eaves sit on that storey's walls. See [Building records](/buildings/records).

![A gable roof](/shots/roof-gable.webp)

::: tip Playground
[Roofs](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/roofs.ts): `?page=roofs`, all four kinds.
:::
