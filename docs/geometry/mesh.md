# Mesh

<Live page="mesh-ops" label="Mesh Operations" poster="/shots/mesh-ops.webp" alt="A box subdivided and smoothed" />

There is one mesh class. A `Mesh` is edited by id (`addNode`, `addFace`, `splitEdge`, …) and read as typed arrays (`positions`, `indices`, `normals`) on the same object. Every edit keeps the connectivity up to date: which nodes, edges and faces meet where. There is no conversion step between an "editing mesh" and a "render mesh".

```ts
import { Mesh, MeshFactory, Vec3 } from "tekto/core";

// Build by id
const mesh = new Mesh();
const a = mesh.addNode(new Vec3(0, 0, 0));
const b = mesh.addNode(new Vec3(1, 0, 0));
const c = mesh.addNode(new Vec3(0.5, 1, 0));
mesh.addTriangle(a, b, c);
mesh.nodeNeighbors(a);                     // the ids of b and c
mesh.splitEdge(mesh.findEdge(a, b)!);      // a new node in the middle of a–b
mesh.setPosition(c, new Vec3(0.5, 1.2, 0));      // or mesh.node(c)!.position = …

// Measure and check
const box = MeshFactory.box(2, 1, 1);
box.volume();                              // 2
const report = box.validate();             // NaN positions, bad faces, open or inside-out solids
console.log(report.valid, report.closed, report.issues);

// Data that arrives as arrays (a scan, an IFC): same class, same API
const { positions, indices } = box.toMeshData();   // Float32 / Uint32 for the GPU or a file
const copy = new Mesh(positions, indices);
copy.smooth(3, 0.5);                       // Laplacian, in place
```

## What to know

- **Ids are indices** and stay valid across other edits. Removing leaves a tombstone until `compact()` renumbers.
- **Views are snapshots.** `face.nodes` is a copy: reversing it does nothing. Use `mesh.reverseFace(id)`.
- **Hot loops read arrays.** `mesh.positions`, `mesh.faceVerts(id)` cost nothing; `mesh.node(id).position` allocates. Fine for thousands of nodes, not for an inner loop over a million.
- **Size**: 1 million triangles load from arrays in under 100 ms and take about 72 MB.
- **When something looks wrong**, `mesh.validate()` says why before you judge a double-sided render.

::: tip Playground
[Mesh Operations](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/mesh-ops.ts): `?page=mesh-ops`, subdivision, smoothing, Doo-Sabin.
:::
