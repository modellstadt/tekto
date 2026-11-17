# NURBS

<Live page="nurbs-surfaces" label="NURBS Surfaces" poster="/shots/nurbs.webp" alt="A column whose capital is a NURBS surface, with isocurves and principal curves" />


`NurbsCurve` and `NurbsSurface` are non-uniform rational B-splines: control points, a degree, a knot vector and optional weights. A surface can be built from its control net, lofted through compatible curves, or revolved around an axis; revolving uses rational weights, so circles are exact. `toMesh` tessellates it into a `Mesh` for display and export.

```ts
import { NurbsCurve, NurbsSurface, Vec3, clampedUniformKnots } from "tekto/core";

// Three section curves, each cubic through 5 control points with the same knots
const knots = clampedUniformKnots(5, 3);
const section = (z: number, r: number) => new NurbsCurve(
  [-2, -1, 0, 1, 2].map((x) => new Vec3(x * r, Math.cos(x) * r, z)), 3, knots);
const sections = [section(0, 1), section(2, 1.6), section(4, 0.8)];

const shell = NurbsSurface.loft(sections, 2);          // degree 2 across the sections
shell.getPoint(0.5, 0.5);
shell.getNormal(0.5, 0.5);
const mesh = shell.toMesh(48, 32);                     // u × v samples

// A vase: one profile turned around the z axis
const profile = new NurbsCurve(
  [new Vec3(0.3, 0, 0), new Vec3(0.9, 0, 0.4), new Vec3(0.4, 0, 1.2), new Vec3(0.6, 0, 1.8)], 3, clampedUniformKnots(4, 3));
const vase = NurbsSurface.revolve(profile, new Vec3(0, 0, 0), new Vec3(0, 0, 1)).toMesh(64, 24, true);
console.log(mesh.faceCount, vase.faceCount);
```

## What to know

- `clampedUniformKnots(numControlPoints, degree)` gives the usual open knot vector, so the curve starts and ends at its end control points.
- `loft` needs curves with the same degree, knots and number of control points.
- `toMesh(uDivs, vDivs, closedU, closedV)`: pass `closedU = true` for a revolved surface so the seam is welded.

::: tip Playground
[NURBS Surfaces](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/nurbs-surfaces.ts): `?page=nurbs-surfaces`, a mushroom column with isocurves and principal curves. [Shared Editing](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/shared-editing.ts) drags the control points of a `NurbsCurve`.
:::
