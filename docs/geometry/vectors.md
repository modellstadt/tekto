# Vectors

<Live page="lines-points" label="Lines &amp; Points" poster="/shots/lines-points.webp" alt="Points, lines and a spiral" />

`Vec2`, `Vec3`, `Vec4` and `Mat4` are small immutable value types. Their fields are `readonly` and every operation returns a new instance, so a vector you hand to a function cannot change under you. Units are metres; plan coordinates are x, y.

```ts
import { Vec2, Vec3, Mat4 } from "tekto/core";

const a = new Vec3(1, 0, 0);
const b = new Vec3(0, 1, 0);

const n = a.cross(b);                    // (0, 0, 1)
const mid = a.lerp(b, 0.5);              // halfway
const d = a.distTo(b);                   // √2
let p = new Vec3(0, 0, 0);
p = p.add(n.mul(2.5));                   // never p.z = …: assign a new vector

const turn = Mat4.rotationZ(Math.PI / 2).multiply(Mat4.translation(1, 0, 0));   // b first, then a
const q = turn.transformPoint(new Vec3(0, 0, 0));                                // (0, 1, 0)

const corner = new Vec2(3, 4);
console.log(corner.len(), corner.rotate(Math.PI / 2), d, mid, q);
```

## What to know

- To move a mesh node, assign a new vector: `mesh.node(id).position = p` or `mesh.setPosition(id, p)`.
- `VecMath` has helpers that take vectors and return new ones: polar points, angles, point-to-segment distance.
- `Plane`, `Ray`, `Triangle`, `AABB`, `Sphere` and `Segment` are immutable too, with the usual hit tests.

::: tip Playground
[Lines & Points](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/lines-points.ts): `?page=lines-points`.
:::
