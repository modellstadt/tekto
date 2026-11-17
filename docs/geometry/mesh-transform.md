# MeshTransform

<Live page="app-shell" label="App Shell" poster="/shots/twisted-tower.webp" alt="Slabs rotated floor by floor" />

<Live page="transforms" label="Transforms" />

`MeshTransform` moves, turns, scales and mirrors a `Mesh` in place, and swaps axes between the Y-up and Z-up conventions. It works on the mesh's arrays directly, so it is cheap on large meshes.

```ts
import { Mat4, MeshFactory, MeshTransform, Vec3 } from "tekto/core";

const column = MeshFactory.cylinder(0.15, 0.15, 3, 24);   // built Y-up, standing along y
MeshTransform.swapAxes(column, "y", "z");                 // now it stands along z, for a Z-up app
MeshTransform.translate(column, new Vec3(4, 2, 1.5));

const slab = MeshFactory.box(4, 2.4, 0.12);
MeshTransform.rotate(slab, new Vec3(0, 0, 1), Math.PI / 8);   // about the origin
MeshTransform.rotateAbout(slab, new Vec3(0, 0, 1), Math.PI / 8, new Vec3(2, 0, 0));
MeshTransform.scaleXYZ(slab, 1, 1, 2);
MeshTransform.mirror(slab, "x");                              // mirrors and keeps the faces outward
MeshTransform.transform(slab, Mat4.translation(0, 0, 3));
MeshTransform.centerAtOrigin(column);
```

## What to know

- Every function changes the mesh you pass and returns nothing. `mesh.clone()` first if you need the original.
- `mesh.translate(x, y, z)` is the same as `MeshTransform.translate`, written on the mesh.
- `flipFaces` reverses every face; `reorientFaces` makes the winding consistent across a mesh.
- Don't "fix" a generator for Z-up: rotate its output with `swapAxes`.

::: tip Playground
[App Shell](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/app-shell.ts) (`?page=app-shell`) twists its slabs with `MeshTransform.rotate`; [Transforms](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/transforms.ts) shows the same in a sketch.
:::
