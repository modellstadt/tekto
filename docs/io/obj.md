# OBJ

<Live page="house" label="House" poster="/shots/house.webp" alt="The house, exported as OBJ grouped by layer" />

`ObjFile` reads and writes Wavefront OBJ, keeping its `g` groups and `usemtl` materials both ways, and writes the matching `.mtl`. `scene.toMeshData({ groupBy: "layer" })` (or `"object"`) gives a whole scene as one OBJ with a group per layer and its colours as materials, ready for Rhino or Cinema 4D. Coordinates pass through unchanged: no axis swap, no unit scaling.

```ts
import { download, MeshFactory, ObjFile, Scene, stampName } from "tekto";

// Export: a scene grouped by layer, and the .mtl its groups' colours are in
const scene = new Scene();
scene.addMesh(MeshFactory.box(4, 0.2, 3), { color: "#e4e1da", layer: "walls" });
scene.addMesh(MeshFactory.box(4, 3, 0.25), { color: "#c9b79c", layer: "slabs" });
const data = scene.toMeshData({ groupBy: "layer" });
const mtl = stampName("model.mtl");
download(ObjFile.serializeMtl(data.materials ?? []), mtl);
download(ObjFile.serialize(data, { mtllib: mtl }), stampName("model.obj"));

// Import: positions, polygon faces, and the groups with their materials
async function open(file: File) {
  const obj = ObjFile.parse(await file.text());
  for (const g of obj.groups ?? []) console.log(g.name, g.material, g.faceCount);
  return obj;
}
void open;
```

`ObjFile.parse` returns OBJ's own shape (`positions`, `faces`, `groups`), not a `Mesh`. `stampName("model.obj")` adds the date and time: `model-20261116-1542.obj`.

::: tip Playground
[House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts) (`?page=house`): Export OBJ writes the house grouped by layer, with its `.mtl`.
:::
