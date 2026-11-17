# Curvature and streamlines

<Live page="streamlines" label="Streamlines" poster="/shots/streamlines.webp" alt="Streamlines along the principal curvature directions of a bumpy sphere" />

<Live page="curvature" label="Curvature (Taubin)" />

`Curvature.taubin` estimates the principal curvatures and directions at every node of a mesh. Combed into consistent signs and averaged per face, they form a direction field, and `StreamlineTracer.trace` follows that field across the faces into polylines that wrap the form: a basis for rib layouts, hatching or fibre paths.

```ts
import { Curvature, MeshFactory, StreamlineTracer } from "tekto/core";

const mesh = MeshFactory.torus(1, 0.35, 64, 32);

const curvatures = Curvature.taubin(mesh);                     // per node: kMax, kMin and their directions
Curvature.combDirections(mesh, curvatures);                    // consistent signs between neighbours
const field = Curvature.facePrincipalField(mesh, curvatures, "max");

const lines = StreamlineTracer.trace(mesh, field);             // Vec3[][]: one polyline per streamline
console.log(lines.length, "streamlines");
```

`StreamlineTracer.trace` takes options for how many steps a line may take (`maxSteps`), which faces seed one (`stride`) and the step length (`stepFactor`). To draw the streamlines as a line drawing with hidden parts removed, `extractVisiblePolylines` renders the mesh's depth and keeps the runs in front, and `polylinesToSVG` writes them out.

::: tip Playground
[Streamlines](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/streamlines.ts) (`?page=streamlines`) and [Curvature (Taubin)](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/curvature.ts) (`?page=curvature`).
:::
