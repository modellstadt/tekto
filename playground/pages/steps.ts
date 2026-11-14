/**
 * Steps — a generated site plan read as the steps it ran. Every part of the program is a
 * `lab.step(name, inputs, fn)`: the steps panel (bottom of the view) draws them as a graph,
 * left to right as the values flow, with each step's time, output and share of the run.
 *
 *   click a step      its inputs, output and code; its geometry lights up
 *   click geometry    the step that made it
 *   note on a step    "Mark step for agent", then "Save … for agent": the notes go into the
 *                     snapshot (.tekto/markup/latest/markup.json `stepMarks`) with the steps
 *
 * The program: a site, seeds scattered in it and relaxed (each round a step inside "relax"),
 * Voronoi cells, plots shrunk back from the streets, small plots dropped, heights rising
 * towards the middle, masses extruded, figures. "streets" computes a street network that
 * is only drawn with "Draw streets" on — off, the analysis marks it as unused work.
 */
import { sketch, SketchInstance, Vec2, Vec3, Voronoi2D, Polygon2D, MeshFactory, createRandom } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const count = lab.slider("Plots", 6, 80, 32, { step: 1, group: "Program" }).value;
    const rounds = lab.slider("Relax rounds", 0, 8, 3, { step: 1, group: "Program" }).value;
    const street = lab.slider("Street width", 0.5, 6, 2.5, { step: 0.1, group: "Program" }).value;
    const minArea = lab.slider("Smallest plot (m²)", 0, 300, 60, { step: 5, group: "Program" }).value;
    const seed = lab.slider("Seed", 1, 50, 7, { step: 1, group: "Program" }).value;
    const drawStreets = lab.toggle("Draw streets", false, { group: "Program" }).value;

    const site = lab.step("site", { width: 120, depth: 80 }, ({ width, depth }) => {
      const outline = [new Vec2(0, 0), new Vec2(width, 0), new Vec2(width, depth * 0.7), new Vec2(width * 0.75, depth),
        new Vec2(0, depth)];
      lab.polyline([...outline, outline[0]].map((p) => new Vec3(p.x, p.y, 0.05))).color("#f0a848").layer("site");
      return outline;
    });

    const seeds = lab.step("seeds", { site, count, seed }, ({ site, count, seed }) => {
      const rand = createRandom(seed);
      const xs = site.map((p) => p.x), ys = site.map((p) => p.y);
      const out: Vec2[] = [];
      while (out.length < count) {
        const p = new Vec2(rand.random(Math.min(...xs), Math.max(...xs)), rand.random(Math.min(...ys), Math.max(...ys)));
        if (Polygon2D.pointInPolygon(p, site)) out.push(p);
      }
      return out;
    });

    // Lloyd relaxation: each round moves every seed to the centre of its cell.
    const relaxed = lab.step("relax", { seeds, site, rounds }, ({ seeds, site, rounds }) => {
      let points = seeds;
      for (let r = 0; r < rounds; r++) {
        points = lab.step("round", { points, site }, ({ points, site }) =>
          Voronoi2D.cells(points, { clip: site }).map((c, i) => (c.polygon.length >= 3 ? Polygon2D.centroid2D(c.polygon) : points[i])));
      }
      return points;
    });

    const cells = lab.step("cells", { relaxed, site }, ({ relaxed, site }) => {
      const out = Voronoi2D.cells(relaxed, { clip: site }).filter((c) => c.polygon.length >= 3);
      for (const c of out) lab.polyline([...c.polygon, c.polygon[0]].map((p) => new Vec3(p.x, p.y, 0.03))).color("#5b6472").layer("cells");
      return out;
    });

    // Back from the streets: each cell pulled towards its centre by half the street width.
    const plots = lab.step("plots", { cells, street }, ({ cells, street }) => cells.map((c) => {
      const centre = Polygon2D.centroid2D(c.polygon);
      const radius = Math.sqrt(Polygon2D.area(c.polygon) / Math.PI);
      const k = Math.max(0.3, 1 - street / 2 / radius);
      return c.polygon.map((p) => centre.add(p.sub(centre).mul(k)));
    }));

    const kept = lab.step("keep", { plots, minArea }, ({ plots, minArea }) => plots.filter((p) => Polygon2D.area(p) >= minArea));

    const heights = lab.step("heights", { kept, site }, ({ kept, site }) => {
      const centre = Polygon2D.centroid2D(site);
      const far = Math.max(...site.map((p) => p.distTo(centre)));
      return kept.map((p) => Math.round(2 + 6 * (1 - Polygon2D.centroid2D(p).distTo(centre) / far)));
    });

    const masses = lab.step("massing", { kept, heights, storey: 3.2 }, ({ kept, heights, storey }) => kept.map((p, i) => {
      const m = MeshFactory.extrude(p.map((q) => new Vec3(q.x, q.y, 0)), new Vec3(0, 0, heights[i] * storey));
      lab.mesh(m).color(heights[i] >= 6 ? "#c9b49a" : "#ddd3c4").layer("massing");
      return m;
    }));

    const streets = lab.step("streets", { cells }, ({ cells }) => {
      // Street centre lines: between the centres of cells that share an edge.
      const adj = Voronoi2D.neighbors(cells, Math.max(...cells.map((c) => c.site)) + 1);
      const centre = new Map(cells.map((c) => [c.site, Polygon2D.centroid2D(c.polygon)]));
      const lines: [Vec2, Vec2][] = [];
      adj.forEach((ns, i) => { for (const j of ns) if (j > i && centre.has(i) && centre.has(j)) lines.push([centre.get(i)!, centre.get(j)!]); });
      return lines;
    });
    if (drawStreets) {
      lab.step("draw streets", { streets }, ({ streets }) => {
        for (const [a, b] of streets) lab.line(a.x, a.y, 0.08, b.x, b.y, 0.08).color("#7aa2c8").layer("streets");
      });
    }

    const figures = lab.step("figures", { kept, heights, masses }, ({ kept, heights }) => {
      const area = kept.reduce((s, p) => s + Polygon2D.area(p), 0);
      const gfa = kept.reduce((s, p, i) => s + Polygon2D.area(p) * heights[i], 0);
      return { plots: kept.length, footprint: Math.round(area), gfa: Math.round(gfa), far: Math.round((gfa / Polygon2D.area(site)) * 100) / 100 };
    });
    lab.log("Plots", figures.plots);
    lab.log("Footprint", `${figures.footprint} m²`);
    lab.log("Floor area", `${figures.gfa} m²`);
    lab.log("Floor area ratio", figures.far);
  }, {
    container,
    title: "Steps",
    up: "z",
    camera: [150, -70, 120],
    target: [60, 40, 0],
  });
}
