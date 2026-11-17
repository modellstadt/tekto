# Steps: a program as a graph

<Live page="steps" label="Steps" poster="/shots/steps-panel.webp" alt="A generated site plan and its steps panel" />

Generated code is read, checked and steered more than it is written. A generator that wraps its parts in steps, `lab.step(name, inputs, fn)` in a `sketch()` or `app.step` in an `appShell()`, is recorded as it runs: each step's inputs, its output, its time, an error, the line that called it and the objects it drew. Which step fed which is read off the values themselves, so nothing is declared twice. The **steps panel** at the bottom of the view draws the run as a graph; click a step for its details, click geometry for the step that made it, and leave a note on a step for an agent.

```ts
import { MeshFactory, Polygon2D, Vec2, Vec3, Voronoi2D, createRandom, sketch } from "tekto";

sketch((lab) => {
  const count = lab.slider("Plots", 6, 80, 32, { step: 1 }).value;

  const site = lab.step("site", { width: 120, depth: 80 }, ({ width, depth }) =>
    [new Vec2(0, 0), new Vec2(width, 0), new Vec2(width, depth), new Vec2(0, depth)]);

  const seeds = lab.step("seeds", { site, count }, ({ site, count }) => {
    const random = createRandom(7);
    return Array.from({ length: count }, () => new Vec2(random.random(0, 120), random.random(0, 80)))
      .filter((p) => Polygon2D.pointInPolygon(p, site));
  });

  const cells = lab.step("cells", { seeds, site }, ({ seeds, site }) =>
    Voronoi2D.cells(seeds, { clip: site }).filter((c) => c.polygon.length >= 3));

  lab.step("massing", { cells }, ({ cells }) => cells.map((c) => {
    const plot = Polygon2D.offset(c.polygon, -1.5);
    if (plot.length < 3) return null;
    const m = MeshFactory.extrude(plot.map((q) => new Vec3(q.x, q.y, 0)), new Vec3(0, 0, 9));
    lab.mesh(m).color("#ddd3c4");
    return m;
  }));
}, { up: "z", camera: [150, -70, 120], target: [60, 40, 0] });
```

A note on a step ("Mark step for agent", then "Save … for agent") goes into the snapshot with the steps (`markup.json` `steps` and `stepMarks`), so an agent changes that step knowing what it was given and what it produced. Agents read the same through `__tekto.steps()`, the relay's `steps` call and the MCP tool `tekto_steps`. Outside an app, `StepTrace` from `tekto/core` records any program the same way: `trace.step(name, inputs, fn)`, then `trace.toJSON()`.

::: tip Playground
[Steps](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/steps.ts): `?page=steps`, a generated site plan written as steps.
:::
