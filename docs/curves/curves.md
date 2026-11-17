# Curves

<Live page="curves" label="Curves" poster="/shots/curves.webp" alt="A line, an arc, a Bézier and a polyline with arc-length marks" />

Every curve in tekto answers the same questions: `getPoint(t)` and `getTangent(t)` for `t` from 0 to 1, its `length`, and `getPointAtDistance(d)` for points evenly spaced along it. `LineCurve`, `ArcCurve`, `HelixCurve`, `CubicBezierCurve`, `PolylineCurve` and [`NurbsCurve`](/curves/nurbs) all share that interface, so code that divides or sweeps a curve works on any of them.

```ts
import { ArcCurve, CubicBezierCurve, CurveUtils, PolylineCurve, Vec3 } from "tekto/core";

const arc = new ArcCurve(new Vec3(0, 0, 0), 2, 0, Math.PI, new Vec3(0, 0, 1));   // centre, radius, start, end, normal
const s = new CubicBezierCurve(new Vec3(-3, 0, 0), new Vec3(-1, 2, 0), new Vec3(1, -2, 0), new Vec3(3, 0, 0));
const zigzag = new PolylineCurve([new Vec3(0, 0, 0), new Vec3(1, 1, 0), new Vec3(2, 0, 0)]);

arc.length;                                        // 2π
const posts = CurveUtils.divideByFixedLength(s, 0.5);    // a point every 0.5 m along the Bézier
const ten = CurveUtils.divideByCount(zigzag, 10);
const mid = s.getPointAtDistance(s.length / 2);
console.log(posts.length, ten.length, mid, s.getTangent(0.5));
```

`CurveUtils` also has `parallelTransportFrames` (frames along a curve for sweeps without twisting) and `unrollPolyline` (lay a 3D polyline flat, for an unrolled elevation).

::: tip Playground
[Curves](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/curves.ts): `?page=curves`.
:::
