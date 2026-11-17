# MeshFactory

<Live page="mesh-factory" label="MeshFactory" poster="/shots/mesh-factory.webp" alt="Box, spheres, cylinder, torus, a height grid, an extrusion, a revolve and a loft" />

`MeshFactory` makes meshes from parameters: primitives, a height-mapped grid, extrusions, revolutions, lofts, pipes, and subdivision. Every generator returns a `Mesh`. The primitives are built Y-up, as three.js expects; in a Z-up app turn them with [`MeshTransform.swapAxes`](/geometry/mesh-transform).

```ts
import { MeshFactory, Vec2, Vec3 } from "tekto/core";

const box = MeshFactory.box(1.5, 1.5, 1.5);
const ball = MeshFactory.sphere(0.8, 16, 12);
const cone = MeshFactory.cylinder(0, 0.5, 1.5, 16);             // a top radius of 0 is a cone
const terrain = MeshFactory.grid(10, 10, 32, 32, (x, z) => Math.sin(x * 0.8) * Math.cos(z * 0.6) * 0.5);

const hexagon = [0, 1, 2, 3, 4, 5].map((i) => new Vec3(Math.cos(i * Math.PI / 3), 0, Math.sin(i * Math.PI / 3)));
const prism = MeshFactory.extrude(hexagon, new Vec3(0, 1.5, 0));

const profile = [new Vec2(0.2, 0), new Vec2(0.8, 0), new Vec2(0.3, 0.2), new Vec2(0.3, 1.2)];
const vase = MeshFactory.revolve(profile, 32);

const rings = [0, 0.8, 1.6].map((y, k) => Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2, r = 0.5 + 0.3 * Math.sin(k);
  return new Vec3(Math.cos(a) * r, y, Math.sin(a) * r);
}));
const tower = MeshFactory.loft(rings);

const smooth = MeshFactory.subdivide(box);                        // Catmull-Clark
const tube = MeshFactory.pipe([new Vec3(0, 0, 0), new Vec3(1, 1, 0), new Vec3(2, 1, 1)], 0.1);
console.log(ball.faceCount, cone, terrain, prism, vase, tower, smooth, tube);
```

| Generator | Makes |
|---|---|
| `box(w, h, d)` | an axis-aligned box |
| `sphere(r, segments, rings)` | a UV sphere |
| `cylinder(rTop, rBottom, h, segments)` | a cylinder or cone |
| `torus(majorR, minorR, segments, sides)` | a torus |
| `grid(w, d, divsX, divsZ, heightFn?)` | a height-mapped grid; `.update(heightFn)` rewrites it in place |
| `extrude(polygon, direction)` | a polygon pushed along a vector |
| `revolve(profile, segments)` | a surface of revolution from a 2D profile |
| `loft(profiles)` | a skin through cross-sections |
| `pipe(path, radius, sides)` | a tube along a 3D polyline |
| `subdivide(mesh)` | Catmull-Clark, with creases and pinned nodes |
| `midpointSubdivide(mesh)`, `triangulate(mesh)` | 1→4 triangle refinement, fan triangulation |

::: tip Playground
[MeshFactory](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/mesh-factory.ts): `?page=mesh-factory`.
:::
