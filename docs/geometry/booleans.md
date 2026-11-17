# Booleans

<Live page="bsp-csg" label="BSP &amp; CSG" poster="/shots/booleans.webp" alt="A sphere subtracted from a box" />

`BspTree` does constructive solid geometry on closed meshes: union, subtract and intersect. Build a tree from a mesh's arrays, combine two trees into a new one (the inputs stay as they were), and read the result back as arrays. It can also tell whether a point is inside, outside or on the result.

```ts
import { BspTree, Mesh, MeshFactory, Vec3 } from "tekto/core";

const box = MeshFactory.box(1.3, 1.3, 1.3).toMeshData();
const ball = MeshFactory.sphere(0.8, 16, 10);
ball.translate(0.6, 0, 0);
const sphere = ball.toMeshData();

const a = BspTree.fromMesh(box.positions, box.indices);
const b = BspTree.fromMesh(sphere.positions, sphere.indices);
const cut = BspTree.subtract(a, b);            // also BspTree.union, BspTree.intersect

const { positions, indices } = cut.toMesh();
const result = new Mesh(positions, indices);   // back to a Mesh, to show or export
cut.classifyPoint(new Vec3(-0.5, 0, 0));       // "inside" | "outside" | "on"
console.log(result.faceCount);
```

For 2D outlines, use [`PolygonBool`](/2d/polygons), which handles holes.

::: tip Playground
[BSP & CSG](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/bsp-csg.ts): `?page=bsp-csg`.
:::
