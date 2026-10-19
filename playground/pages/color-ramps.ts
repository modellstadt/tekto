/**
 * Colour Ramps — a terrain coloured per node by a scalar field through a `ColorRamp`, with its
 * key over the view (`colorLegend`, in the view's snapshots too).
 *
 *   Sequential   magnitude: the elevation, one blue, low end receding into the background
 *   Diverging    polarity: above or below the mean height, blue – neutral grey – red
 *   Categorical  identity: which zone a point is nearest, the 8 colours in their fixed order
 *
 * Dark and Light are each their own steps (with the matching background), not a flip.
 * `flatLighting: "plain"` keeps a face toward the sky the colour its legend says; the default
 * Flat lighting would dim it. An appShell, because its renderer config takes that option.
 */
import { appShell, colorLegend, ColorRamp, MeshFactory, createRandom, noise } from "../../src";

const SIZE = 12;          // terrain, metres square
const DIVISIONS = 96;     // grid cells per side
const ZONE_NAMES = "ABCDEFGH";

export default function (container: HTMLElement) {
  const app = appShell({
    title: "Colour Ramps",
    container,
    up: "y",                                     // MeshFactory.grid is Y-up
    camera: [9, 11, 13],
    target: [0, 0, 0],
    renderer: { flatLighting: "plain", showGrid: false, showAxes: false },
    params: {
      ramp:   { type: "select", options: ["Sequential", "Diverging", "Categorical"], default: "Sequential", label: "Ramp" },
      mode:   { type: "select", options: ["Dark", "Light"], default: "Dark", label: "Mode" },
      zones:  { type: "int", min: 2, max: 8, default: 6, label: "Zones" },
      relief: { type: "float", min: 0.2, max: 4, default: 1.6, step: 0.1, label: "Relief (m)" },
      seed:   { type: "int", min: 1, max: 99, default: 7, label: "Seed" },
    },
    groups: { Colour: ["ramp", "mode", "zones"], Terrain: ["relief", "seed"] },
  });

  // The key, over the view's bottom-right corner; the layer lets the pointer through to orbit.
  const legend = colorLegend({ corner: "bottom-right" });
  const layer = app.overlay();
  layer.style.pointerEvents = "none";
  layer.append(legend.el);

  app.onBuild(() => {
    const relief = app.params.get("relief") as number;
    const seed = app.params.get("seed") as number;
    const kind = app.params.get("ramp") as string;
    const mode = (app.params.get("mode") as string) === "Light" ? "light" : "dark";

    const terrain = MeshFactory.grid(SIZE, SIZE, DIVISIONS, DIVISIONS, (x, z) => {
      const f = 0.65 * noise(x * 0.22 + seed * 3.1, z * 0.22 - seed) + 0.35 * noise(x * 0.6 - seed, z * 0.6 + seed * 1.7);
      return relief * (f - 0.5) * 2;
    });
    const pos = terrain.positions, n = terrain.nodeCount;
    const heights = new Float64Array(n);
    for (let i = 0; i < n; i++) heights[i] = pos[i * 3 + 1];

    if (kind === "Categorical") {
      // Identity: the zone of the nearest seed point. Each zone index lands exactly on a stop
      // of a ramp through the categorical colours, so `colors()` gives them unmixed.
      const k = app.params.get("zones") as number;
      const rnd = createRandom(seed);
      const seeds = Array.from({ length: k }, () => [rnd.random(-SIZE / 2, SIZE / 2), rnd.random(-SIZE / 2, SIZE / 2)]);
      const zone = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let best = 0, bestD = Infinity;
        seeds.forEach(([sx, sz], j) => {
          const d = (pos[i * 3] - sx) ** 2 + (pos[i * 3 + 2] - sz) ** 2;
          if (d < bestD) { bestD = d; best = j; }
        });
        zone[i] = best;
      }
      const colors = ColorRamp.categorical(mode).slice(0, k);
      terrain.setColors(new ColorRamp(colors).colors(zone, { min: 0, max: k - 1 }));
      legend.update({ title: "Zone", items: colors.map((color, j) => ({ label: `Zone ${ZONE_NAMES[j]}`, color })), mode, corner: "bottom-right" });
    } else if (kind === "Diverging") {
      // Polarity: above or below the mean, on a range symmetric about zero so zero is the grey.
      const mean = heights.reduce((s, h) => s + h, 0) / n;
      const offset = heights.map((h) => h - mean);
      const m = Math.max(...offset.map(Math.abs)) || 1;
      const ramp = ColorRamp.diverging(mode);
      terrain.setColors(ramp.colors(offset, { min: -m, max: m }));
      legend.update({ title: "Height vs mean", unit: "m", ramp, min: -m, max: m, mode, corner: "bottom-right" });
    } else {
      // Magnitude: the elevation, its range the data's.
      const ramp = ColorRamp.sequential(mode);
      const min = Math.min(...heights), max = Math.max(...heights);
      terrain.setColors(ramp.colors(heights, { min, max }));
      legend.update({ title: "Elevation", unit: "m", ramp, min, max, mode, corner: "bottom-right" });
    }

    app.renderer.setBackground(mode === "light" ? 0xf5f7fa : 0x0a0b14);
    app.scene.clear();
    app.scene.addFlatMesh(terrain.toMeshData(), { label: "terrain" });   // the node colours, drawn
    app.status(`${kind} · ${mode} · ${n} nodes`);
  });

  app.rebuild();
  return app;
}
