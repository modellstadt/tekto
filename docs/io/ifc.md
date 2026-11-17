# IFC

<Live page="roofs" label="Roofs" poster="/shots/roof-gable.webp" alt="A gable roof: IfcWriter writes it as an IfcRoof of roof slabs" />

<Live page="framed-floor" label="Framed Floor" />
<Live page="house" label="House" />

tekto writes IFC4 itself: `IfcWriter` produces STEP text with no extra dependency. It covers wall types and material layers, walls with their openings (doors and windows with frame, glass and leaves), framed members, joints, slabs, roofs, stairs, spaces and several storeys. A [building from records](/buildings/records) writes itself with `building.toIfc()`. For reading, `IfcModel.parse` keeps each element apart, with its IFC class, property sets and relations; it needs the optional `web-ifc` package.

```ts
import { IfcModel, IfcWriter, Mesh, Scene, Slab, Vec2, Wall } from "tekto";

// Write
const writer = new IfcWriter({ projectName: "Pavilion", buildingName: "House", storeyName: "Ground floor" });
const ground = writer.getDefaultStorey();
const first = writer.addStorey({ name: "First floor", elevation: 3.0 });
const wall = new Wall({ centerline: [new Vec2(0, 0), new Vec2(8, 0)], thickness: 0.3, height: 3, name: "South" });
writer.addWall(wall, { storey: ground });
const floor = new Slab({ boundary: [new Vec2(0, 0), new Vec2(8, 0), new Vec2(8, 6), new Vec2(0, 6)], thickness: 0.25, elevation: 3 });
writer.addSlab(floor, { storey: first, predefinedType: "FLOOR" });
const text = writer.save();                       // STEP-21 text; saveBlob() for a download

// Read (npm install web-ifc, and serve web-ifc.wasm)
async function load(buffer: ArrayBuffer, scene: Scene) {
  const model = await IfcModel.parse(buffer, { wasmPath: "/" });
  for (const el of model.elements) {
    scene.addMesh(new Mesh(el.mesh.positions, el.mesh.indices), { label: el.name ?? el.ifcClass, layer: el.ifcClass });
  }
  return model;
}
console.log(text.length, load);
```

`IfcFile.parse` reads a whole file as one fused mesh instead, for context geometry nobody selects.

::: tip Playground
[Timber + IFC](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/timber/index.ts) (`?page=timber`): Export ▾ → IFC. [Roofs](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/roofs.ts), [Framed Floor](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/framed-floor.ts) and [House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts) export IFC too.
:::
