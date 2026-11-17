# Voronoi

<Live page="voronoi" label="Voronoi" poster="/shots/voronoi.webp" alt="Voronoi cells clipped to an L-shaped outline, coloured so neighbours differ" />

<Live page="steps" label="Steps" />

`Voronoi2D.cells(sites, { clip })` gives each site the part of a region that is nearer to it than to any other site. The region can be any simple ring, convex or not. Every edge of every cell names the site across it (or `-1` along the clip), so the diagram doubles as an adjacency graph: which plots touch, where a street runs between them. With `radii` it becomes a power diagram, whose boundaries pass through the contact points of touching circles.

```ts
import { Polygon2D, Vec2, Voronoi2D, createRandom } from "tekto/core";

const site = [new Vec2(0, 0), new Vec2(60, 0), new Vec2(60, 25), new Vec2(30, 25), new Vec2(30, 50), new Vec2(0, 50)];
const random = createRandom(7);
const seeds: Vec2[] = [];
while (seeds.length < 40) {
  const p = new Vec2(random.random(0, 60), random.random(0, 50));
  if (Polygon2D.pointInPolygon(p, site)) seeds.push(p);
}

const cells = Voronoi2D.cells(seeds, { clip: site });      // cells[i].site === i
const neighbours = Voronoi2D.neighbors(cells, seeds.length);
for (const cell of cells) {
  Polygon2D.area(cell.polygon);                            // counter-clockwise outline
  cell.neighbors;                                          // the site across each edge, -1 on the clip
}

// Lloyd relaxation: move each seed to the centre of its cell, a few times
let points = seeds;
for (let round = 0; round < 3; round++) {
  points = Voronoi2D.cells(points, { clip: site }).map((c, i) => (c.polygon.length >= 3 ? Polygon2D.centroid2D(c.polygon) : points[i]));
}
console.log(neighbours[0]);
```

`Voronoi2D` is marked experimental: no app depends on it yet, so its shape may still change. 5,000 sites take a few tens of milliseconds.

::: tip Playground
[Voronoi](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/voronoi.ts) (`?page=voronoi`): four clips and a power diagram. [Steps](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/steps.ts) builds a site plan on it.
:::
