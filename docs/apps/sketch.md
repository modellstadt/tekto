# sketch: a 3D study

<Live page="transforms" label="Transforms" poster="/shots/transforms.webp" alt="Translation, rotation and scale in a sketch" />

<Live page="mesh-factory" label="MeshFactory" />

`sketch(fn)` turns one function into an interactive 3D app. Each `lab.slider`, `lab.toggle` or `lab.select` adds a control to the panel and returns its value. When a control changes, the whole function runs again and the scene is rebuilt from scratch. This is the fast way to a parametric study: the design is a function of its parameters.

```ts
import { sketch, MeshFactory } from "tekto";

sketch((lab) => {
  const levels = lab.slider("Subdivision", 0, 3, 1, { step: 1 });
  const wire = lab.toggle("Wireframe", false);

  let m = MeshFactory.box(1.5, 1.5, 1.5);
  for (let i = 0; i < levels.value; i++) m = MeshFactory.subdivide(m);   // Catmull-Clark

  lab.mesh(m).color("#c9b79c").wireframe(wire.value);
  lab.button("Smoothest", () => levels.set(3));                          // one-shot work goes in a button
  lab.log("Faces", m.faceCount);
}, { title: "Subdivision", camera: [4, 3, 5] });
```

## What to know

- **The function runs again on every change.** Put one-shot work in `lab.button` callbacks and caches in module scope, outside the function.
- **Ids are positional.** Objects are re-declared each run, so an id holds only while the run declares the same objects in the same order. For selection, undo and save, use [appShell](/apps/app-shell) and a [Doc](/buildings/doc).
- **Y-up by default.** Pass `{ up: "z" }` for CAD content, so plans, buildings and the sun agree.
- **Set a control from code** with `handle.set(value)`; save and restore all of them with `getParams()` / `setParams()` on the returned `SketchInstance`.
- **Commands**: `lab.command([{ id, label, keys, run }])` gives a person a key and an agent an id (`__tekto.run("…")`).

::: tip Playground
[Transforms](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/transforms.ts) and [MeshFactory](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/mesh-factory.ts): `npm run playground`, then `?page=transforms`.
:::
