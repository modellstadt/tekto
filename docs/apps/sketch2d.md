# sketch2d: a 2D canvas

![Dragging handles to shape a polygon](/shots/pointer-2d.webp)

`sketch2d(fn)` is the 2D counterpart of `sketch()`, close to p5.js: the same panel of controls, and a `lab.draw` callback that gets a plain `CanvasRenderingContext2D`. There is no WebGL and no three.js; import it from `tekto/2d` and the page stays small.

```ts
import { sketch2d, Vec2 } from "tekto/2d";

const points: Vec2[] = [];

sketch2d((lab) => {
  const r = lab.slider("Handle radius", 4, 20, 8);
  lab.button("Clear", () => { points.length = 0; });

  lab.onPointerDown((p) => { points.push(new Vec2(p.x, p.y)); });

  lab.draw((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#9fb6cc";
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    if (points.length > 2) ctx.closePath();
    ctx.stroke();
    for (const p of points) { ctx.beginPath(); ctx.arc(p.x, p.y, r.value, 0, Math.PI * 2); ctx.fill(); }
  });
  lab.animate(() => {});   // pointer events don't redraw by themselves: keep frames coming
});
```

## What to know

- `lab.draw` runs when a control changes. `lab.animate((t, dt) => …)` turns on a continuous loop.
- `lab.onPointerDown / onPointerMove / onPointerUp` get `{ x, y, id }` in canvas pixels, the same for mouse, touch and pen. The `id` follows one finger, so several drags at once work.
- `lab.noise`, `lab.random`, `lab.lerp`, `lab.vec2` and friends are there, scoped to `lab`.
- Geometry in `tekto/2d`: `Vec2`, `Polygon2D`, `PolygonBool`, `Sheet`, `noise`, `createRandom`.

::: tip Playground
[Pointer Input](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/pointer-2d.ts): `?page=pointer-2d`. [Circle Packing](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/circle-packing.ts) is a larger 2D sketch.
:::
