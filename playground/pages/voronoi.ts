/**
 * Voronoi — clipped Voronoi and power diagrams with the neighbour across every cell edge
 * (Voronoi2D, the dual of Delaunay2D). Cells are coloured so that no two neighbours share a
 * colour (greedy, from Voronoi2D.neighbors); light lines run between cells, amber lines along
 * the clip (edge label -1). A concave clip can cut a cell in two: the extra pieces are counted.
 */
import {
  sketch, SketchInstance, Vec2, Vec3, Voronoi2D, Polygon2D, createRandom,
} from "../../src";
import type { ColoredMeshData, VoronoiCell } from "../../src";

const CLIPS = {
  "Box": [new Vec2(-4, -4), new Vec2(4, -4), new Vec2(4, 4), new Vec2(-4, 4)],
  // Points on an ellipse at uneven angles: convex, and not a box.
  "Convex": [0, 50, 110, 160, 215, 270, 320].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return new Vec2(4.2 * Math.cos(a), 3.8 * Math.sin(a));
  }),
  "L-shape": [
    new Vec2(-4, -4), new Vec2(4, -4), new Vec2(4, 0), new Vec2(0, 0), new Vec2(0, 4), new Vec2(-4, 4),
  ],
  "U-shape": [
    new Vec2(-4, -4), new Vec2(4, -4), new Vec2(4, 4), new Vec2(1.5, 4),
    new Vec2(1.5, -1), new Vec2(-1.5, -1), new Vec2(-1.5, 4), new Vec2(-4, 4),
  ],
} as const;
type ClipName = keyof typeof CLIPS;

/** A few muted fills; neighbours never share one. */
const FILLS: [number, number, number][] = [
  [0.32, 0.40, 0.50], // slate
  [0.40, 0.48, 0.41], // sage
  [0.53, 0.49, 0.40], // sand
  [0.48, 0.40, 0.44], // mauve
  [0.36, 0.46, 0.48], // teal grey
  [0.45, 0.44, 0.50], // lavender grey
];
const SITE_DOT: [number, number, number] = [0.93, 0.93, 0.9];
const EDGE_INNER = "#e6e6e6";
const EDGE_CLIP = "#f0a848";
/** Heights above the cell fills (z-up): circles, lines, site dots. */
const CIRCLE_Z = 0.001, LINE_Z = 0.002, DOT_Z = 0.003;

/** Greedy colouring over the neighbour lists: the first fill no coloured neighbour has. */
function colourSites(adj: number[][]): number[] {
  const colour = new Array<number>(adj.length).fill(-1);
  for (let i = 0; i < adj.length; i++) {
    const used = new Set(adj[i].map((j) => colour[j]));
    let c = 0;
    while (c < FILLS.length && used.has(c)) c++;
    colour[i] = c < FILLS.length ? c : i % FILLS.length;
  }
  return colour;
}

/** One flat-coloured mesh for every cell, power circle and site dot. */
class FlatBuilder {
  private positions: number[] = [];
  private colors: number[] = [];
  private indices: number[] = [];

  polygon(poly: Vec2[], z: number, rgb: [number, number, number]): void {
    const base = this.positions.length / 3;
    for (const p of poly) {
      this.positions.push(p.x, p.y, z);
      this.colors.push(rgb[0], rgb[1], rgb[2], 1);
    }
    for (const [a, b, c] of Polygon2D.triangulate2D(poly)) this.indices.push(base + a, base + b, base + c);
  }

  disc(c: Vec2, r: number, z: number, rgb: [number, number, number], segments = 20): void {
    const ring: Vec2[] = [];
    for (let k = 0; k < segments; k++) {
      const a = (k / segments) * Math.PI * 2;
      ring.push(new Vec2(c.x + r * Math.cos(a), c.y + r * Math.sin(a)));
    }
    this.polygon(ring, z, rgb);
  }

  build(): ColoredMeshData {
    const n = this.positions.length / 3;
    const normals = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) normals[k * 3 + 2] = 1;
    return {
      positions: new Float32Array(this.positions),
      normals,
      indices: new Uint32Array(this.indices),
      colors: new Float32Array(this.colors),
    };
  }
}

/** `count` sites spread uniformly over the clip region. */
function sitesIn(clip: readonly Vec2[], count: number, seed: number): Vec2[] {
  const rng = createRandom(seed);
  const ring = clip.slice();
  const sites: Vec2[] = [];
  for (let tries = 0; sites.length < count && tries < count * 20; tries++) {
    const p = new Vec2(rng.random(-4, 4), rng.random(-4, 4));
    if (Polygon2D.containsWinding(ring, p)) sites.push(p);
  }
  return sites;
}

/** Runs of consecutive edges of one kind (between cells, or along the clip) as polylines. */
function edgeRuns(cell: VoronoiCell, z: number): { clip: boolean; points: Vec3[] }[] {
  const { polygon, neighbors } = cell;
  const m = polygon.length;
  const kindOf = (k: number) => neighbors[k] < 0;
  // Start at an edge whose kind differs from the previous one, so no run wraps around.
  let first = 0;
  while (first < m && kindOf(first) === kindOf((first + m - 1) % m)) first++;
  if (first === m) first = 0;
  const runs: { clip: boolean; points: Vec3[] }[] = [];
  for (let s = 0; s < m; s++) {
    const k = (first + s) % m;
    const a = polygon[k], b = polygon[(k + 1) % m];
    const last = runs[runs.length - 1];
    if (last && last.clip === kindOf(k)) last.points.push(new Vec3(b.x, b.y, z));
    else runs.push({ clip: kindOf(k), points: [new Vec3(a.x, a.y, z), new Vec3(b.x, b.y, z)] });
  }
  return runs;
}

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const count = lab.slider("Sites", 2, 2000, 300, { step: 1 });
    const seed = lab.slider("Seed", 0, 1000, 42, { step: 1 });
    const clipName = lab.select("Clip", Object.keys(CLIPS) as ClipName[], "L-shape");
    const power = lab.toggle("Power diagram", false);

    lab.once(() => lab.setProjection("orthographic"));

    const clip = CLIPS[clipName.value];
    const sites = sitesIn(clip, count.value, seed.value);
    const clipArea = Math.abs(Polygon2D.signedArea(clip.slice()));
    const spacing = Math.sqrt(clipArea / Math.max(1, sites.length));
    const rng = createRandom(seed.value + 1);
    const radii = power.value ? sites.map(() => spacing * rng.random(0.15, 0.65)) : undefined;

    const t0 = performance.now();
    const cells = Voronoi2D.cells(sites, { clip: clip.slice(), radii });
    const buildMs = performance.now() - t0;
    const adj = Voronoi2D.neighbors(cells, sites.length);
    const colour = colourSites(adj);

    // Fills: cells, then power circles and site dots just above them.
    const flat = new FlatBuilder();
    for (const c of cells) if (c.polygon.length) flat.polygon(c.polygon, 0, FILLS[colour[c.site]]);
    if (radii) {
      sites.forEach((p, i) => {
        const f = FILLS[colour[i]];
        flat.disc(p, radii[i], CIRCLE_Z, [f[0] + (1 - f[0]) * 0.16, f[1] + (1 - f[1]) * 0.16, f[2] + (1 - f[2]) * 0.16], 28);
      });
    }
    for (const p of sites) flat.disc(p, spacing * 0.06, DOT_Z, SITE_DOT, 10);
    lab.flatMesh(flat.build()).doubleSided(true);

    // Edges: between cells (light) and along the clip (amber), from each cell's labels.
    for (const c of cells) {
      if (!c.polygon.length) continue;
      for (const run of edgeRuns(c, LINE_Z)) {
        lab.polyline(run.points).color(run.clip ? EDGE_CLIP : EDGE_INNER).opacity(run.clip ? 1 : 0.7);
      }
    }

    let cellArea = 0;
    for (const c of cells) if (c.polygon.length) cellArea += Polygon2D.signedArea(c.polygon);
    const pairs = adj.reduce((s, list) => s + list.length, 0) / 2;
    const empty = cells.slice(0, sites.length).filter((c) => !c.polygon.length).length;

    lab.log("Sites", sites.length);
    lab.log("Cells", `${cells.length} (${cells.length - sites.length} extra pieces, ${empty} empty)`);
    lab.log("Neighbour pairs", pairs);
    lab.log("Area", `${cellArea.toFixed(4)} of ${clipArea.toFixed(4)}`);
    lab.log("Build", `${buildMs.toFixed(1)} ms`);
  }, {
    container,
    title: "Voronoi",
    up: "z",
    grid: false,
    axes: false,
    camera: [0, -0.01, 11],
    target: [0, 0, 0],
  });
}
