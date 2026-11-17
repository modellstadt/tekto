# Packing

<Live page="circle-packing" label="Circle Packing" poster="/shots/circle-packing.webp" alt="Circles packed into an L-shaped outline" />

<Live page="particles" label="Particles 2D" />

`Particles2D` relaxes circles in the plane: overlapping circles push apart, springs pull pairs toward a rest length, pinned circles stay put, and a boundary ring (any simple polygon) keeps every circle inside. `Particles2D.pack` does the whole of a classic packing in one call: scatter about area / (2√3 r²) points, relax them for 200 steps, drop any left outside.

```ts
import { Particles2D, Vec2, createRandom } from "tekto/core";

const outline = [new Vec2(0, 0), new Vec2(50, 0), new Vec2(50, 20), new Vec2(22, 20), new Vec2(22, 44), new Vec2(0, 44)];

// One call: centres of circles of radius 2 m, the same for the same seed
const centres = Particles2D.pack(outline, 2, { seed: 1 });

// A bubble diagram: rooms as circles, springs between rooms that should touch
const rooms = [{ name: "Hall", r: 7 }, { name: "Office", r: 7.5 }, { name: "Meeting", r: 4.5 }, { name: "Café", r: 4.5 }];
const sim = new Particles2D();
sim.boundary = outline;
const spots = Particles2D.scatter(outline, rooms.length, createRandom(3));
rooms.forEach((room, i) => sim.add(spots[i], room.r));
sim.addSpring(0, 1, rooms[0].r + rooms[1].r, 0.05);
sim.addSpring(0, 2, rooms[0].r + rooms[2].r, 0.05);
sim.addSpring(0, 3, rooms[0].r + rooms[3].r, 0.05);
sim.relax(1500, 1e-3);                                // or sim.step() once per frame, to watch it settle
console.log(centres.length, sim.positions);
```

`Particles2D` is marked experimental: no app depends on it yet.

::: tip Playground
[Circle Packing](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/circle-packing.ts) (`?page=circle-packing`): packing and a bubble diagram, a step per frame. [Particles 2D](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/particles.ts) (`?page=particles`).
:::
