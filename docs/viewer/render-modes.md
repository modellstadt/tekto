# Render modes

<Live page="house" label="House" poster="/shots/house-hidden-line.webp" alt="The house in hidden line on white" />

<Live page="framed-wall" label="Framed Wall" />
<Live page="shape-modes" label="Shape Modes" />

One renderer, `ThreeRenderer`, sits under every `sketch()` and `appShell()`. It draws a scene in four modes: **solid**, **wireframe**, **hidden line** (sharp edges only, like a technical drawing) and **ghost** (every surface faint in its own colour, with its creases, so what is inside reads through what is in front). The top bar and the shading bar switch them; code does the same.

```ts
import { appShell, MeshFactory } from "tekto";

const app = appShell({
  container: document.getElementById("app")!,
  title: "Modes",
  params: {},
  shadingBar: true,
  navGizmo: true,
  camera: [6, -6, 4],
  target: [0, 0, 1],
});
const box = MeshFactory.box(2, 2, 2);
box.translate(0, 0, 1);
app.scene.addMesh(box, { color: "#cfd8dc", edgeAngle: 20 });   // creases sharper than 20° are drawn

app.renderer.setBackground("#ffffff");      // set the page before the mode
app.scene.setRenderMode("hiddenline");      // "solid" | "wireframe" | "hiddenline" | "ghost"
app.renderer.setProjection("orthographic");
app.renderer.setView("front");              // an elevation: "top" is a plan, "iso" the diagonal
```

## What to know

- **Hidden line** draws creases, not silhouettes: an edge appears where its faces meet at more than `style.edgeAngle` (default 30°), so the tessellation of a flat wall drops out. A smooth sphere has no creases. `edgeColor` keeps an object's colour in the drawing.
- **Ghost** draws a selected object solid, so it stands out against the rest.
- Creases are built a frame at a time: switching a model of thousands of meshes does not stall the tab. A snapshot waits for all of them.
- **Hard edges**: `flatShading: true` in an object's style gives crisp faces without changing the geometry.
- `setSelectionStyle("outline")` outlines a selection instead of tinting it, for models whose colours carry meaning.

![The house in ghost mode with its framing](/shots/house-ghost-framing.webp)

::: tip Playground
[Framed Wall](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/framed-wall.ts) (`?page=framed-wall`): modes, a section, named views and the axis widget on one wall. [Shape Modes](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/shape-modes.ts) (`?page=shape-modes`).
:::
