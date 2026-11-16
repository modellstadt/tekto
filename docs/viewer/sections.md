# Sections

![A plan cut through the house at 4.2 m](/shots/house-plan-cut.webp)

A section cuts the model with a plane and fills the cut. The cut face is drawn flat as poché on opaque surfaces, so it needs no closed meshes; translucent ones are just clipped. Clicks pick only what is still there. A section costs nothing until it is used.

```ts
import { sketch, MeshFactory } from "tekto";

sketch((lab) => {
  const height = lab.slider("Cut height", 0.2, 3, 1.2);
  const shell = MeshFactory.box(6, 3, 4);                 // Y-up: height along y
  shell.translate(0, 1.5, 0);
  lab.mesh(shell).color("#d8d2c6");
  lab.setSection({ axis: "y", coordinate: height.value });  // stays across re-runs
});
```

In an app, the same on the renderer:

```ts
import { appShell } from "tekto";

const app = appShell({ container: document.getElementById("app")!, title: "Sections", params: {} });
app.renderer.setSection({ axis: "z", coordinate: 1.2 });     // a plan cut at 1.2 m: what is above goes
app.renderer.setSection({ axis: "x", at: 0.5 });             // through the middle of the content
app.renderer.setSection({ axis: "y", at: 0.3, flip: true }); // keep the other side
app.renderer.setSection(null);
app.renderer.setSectionLevels([{ name: "Ground floor", elevation: 0 }, { name: "Upper floor", elevation: 2.9 }]);
```

`coordinate` is a position in model units; `at` is a fraction of the content's extent along the axis. `setSectionLevels` gives the shading bar a chip per storey that cuts a plan 1.2 m above its floor. An agent cuts the same way with the MCP tool `tekto_section`.

::: tip Playground
[House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts) (`?page=house`): the section icon in the shading bar, one chip per storey. [Framed Wall](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/framed-wall.ts) has Cut ▾ in the top bar.
:::
