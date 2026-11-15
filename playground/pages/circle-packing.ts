/**
 * Circle Packing — Particles2D relaxing circles inside an outline.
 *
 * Packing is the first step of a 2008 generative office-building applet: scatter
 * area/(2√3 r²) points in the site (one hexagon's worth of area each), relax them as
 * circles of radius r for 200 steps — overlaps push apart, the edges push back in —
 * and drop any centre left outside. `Particles2D.pack(ring, r, { seed })` does all of
 * it in one call; here it runs a step per frame so you can watch it.
 *
 * Bubble diagram: rooms of different sizes, each linked by a spring to the rooms it
 * should touch, find their places inside the outline.
 */
import { sketch2d, Sketch2DInstance, Vec2, Polygon2D, Particles2D, createRandom } from "../../src";

// Outlines in metres, counter-clockwise.
const OUTLINES = {
  "Square": [new Vec2(0, 0), new Vec2(40, 0), new Vec2(40, 40), new Vec2(0, 40)],
  "L-shape": [new Vec2(0, 0), new Vec2(50, 0), new Vec2(50, 20), new Vec2(22, 20), new Vec2(22, 44), new Vec2(0, 44)],
  "Site": [
    new Vec2(0, 0), new Vec2(38, -6), new Vec2(58, 8), new Vec2(52, 26), new Vec2(36, 24),
    new Vec2(30, 44), new Vec2(6, 48), new Vec2(-8, 22),
  ],
};
type OutlineName = keyof typeof OUTLINES;
const OUTLINE_NAMES = Object.keys(OUTLINES) as OutlineName[];
const MODES = ["Packing", "Bubble diagram"] as const;
type Mode = typeof MODES[number];

const BACKGROUND = "#0a0b14";
const PACK_STEPS = 200;                  // the applet's iteration count
const BUBBLE_MAX_STEPS = 1500;
const BUBBLE_TOLERANCE = 1e-3;           // m: settled once nothing moves more
const BUBBLE_STIFFNESS = 0.05;           // soft: springs that cannot all be met squeeze rooms less

// A small office brief: radius in metres; links are the rooms that should touch.
const ROOMS = [
  { name: "Hall", r: 7, color: "#f2c46d" },
  { name: "Open office", r: 7.5, color: "#6fa8ff" },
  { name: "Team room", r: 5, color: "#8fc7ff" },
  { name: "Meeting", r: 4.5, color: "#c79bff" },
  { name: "Café", r: 4.5, color: "#ff9f7a" },
  { name: "Focus", r: 3, color: "#9fd0ff" },
  { name: "Archive", r: 3.5, color: "#b8bdd4" },
  { name: "WC", r: 2.5, color: "#7fd6d0" },
];
const LINKS: [number, number][] = [[0, 1], [0, 3], [0, 4], [0, 7], [1, 2], [1, 5], [2, 3], [1, 6], [4, 7]];

// Simulation state persists across sketch re-runs; a new key starts it again.
let sim: Particles2D | null = null;
let simKey = "";
let steps = 0;
let dropped = 0;
let done = false;
let stepMs = 0;

function start(mode: Mode, ring: Vec2[], radius: number, seed: number): void {
  const random = createRandom(seed);
  const s = new Particles2D();
  s.boundary = ring;
  if (mode === "Packing") {
    const count = Math.round(Polygon2D.area(ring) / (2 * Math.sqrt(3) * radius * radius));
    for (const p of Particles2D.scatter(ring, count, random)) s.add(p, radius);
  } else {
    const spots = Particles2D.scatter(ring, ROOMS.length, random);
    ROOMS.forEach((room, i) => s.add(spots[i], room.r));
    for (const [i, j] of LINKS) s.addSpring(i, j, ROOMS[i].r + ROOMS[j].r, BUBBLE_STIFFNESS);
  }
  sim = s;
  steps = 0;
  dropped = 0;
  done = false;
  stepMs = 0;
}

/** Packing ends like the applet: centres left outside the ring are dropped. */
function dropOutside(s: Particles2D, ring: Vec2[]): void {
  const keep = s.positions.map((p) => Polygon2D.pointInPolygon(p, ring));
  dropped = keep.filter((k) => !k).length;
  s.positions = s.positions.filter((_, i) => keep[i]);
  s.radii = s.radii.filter((_, i) => keep[i]);
  s.pinned = s.pinned.filter((_, i) => keep[i]);
}

/** One step (or `budget` of them); marks the run done when it reaches its end. */
function advance(mode: Mode, ring: Vec2[], budget: number): void {
  if (!sim || done) return;
  const t0 = performance.now();
  let ran = 0, move = Infinity;
  while (ran < budget && !done) {
    move = sim.step();
    ran++;
    steps++;
    if (mode === "Packing" ? steps >= PACK_STEPS : move <= BUBBLE_TOLERANCE || steps >= BUBBLE_MAX_STEPS) done = true;
  }
  if (ran > 0) stepMs = (performance.now() - t0) / ran;
  if (done && mode === "Packing") dropOutside(sim, ring);
}

export default function (container: HTMLElement): Sketch2DInstance {
  return sketch2d((lab) => {
    const mode = lab.select("Mode", MODES, "Packing");
    const outline = lab.select("Outline", OUTLINE_NAMES, "L-shape");
    const radius = mode.value === "Packing" ? lab.slider("Radius", 0.4, 4, 1.6, { step: 0.1 }) : null;
    const seed = lab.slider("Seed", 0, 100, 1, { step: 1 });
    const animate = lab.toggle("Animate", true);

    // This run's values: the callbacks below keep them, so a frame drawn between a control
    // change and the re-run still matches the simulation it draws.
    const m = mode.value, name = outline.value, ring = OUTLINES[name];
    const key = [m, name, radius?.value ?? 0, seed.value].join("|");
    if (!sim || key !== simKey) {
      start(m, ring, radius?.value ?? 1, seed.value);
      simKey = key;
    }

    lab.button("Relax", () => advance(m, ring, m === "Packing" ? PACK_STEPS : BUBBLE_MAX_STEPS));
    lab.button("Reset", () => { simKey = ""; });

    const readout = () => {
      if (!sim) return;
      lab.log("Circles", sim.positions.length + (dropped ? ` (${dropped} dropped)` : ""));
      lab.log("Overlap", `${sim.overlap().toFixed(2)} m`);
      lab.log("Steps", `${steps}${done ? " · done" : ""}`);
      if (stepMs > 0) lab.log("Step", `${stepMs.toFixed(2)} ms`);
    };

    if (animate.value) {
      lab.animate(() => {
        advance(m, ring, 1);
        readout();
      });
    } else {
      readout();
    }

    lab.draw((ctx, w, h) => {
      if (!sim) return;
      ctx.fillStyle = BACKGROUND;              // painted, so a snapshot of the canvas shows it too
      ctx.fillRect(0, 0, w, h);

      // World (metres, y up) → canvas (pixels, y down), fitted with a margin.
      const MARGIN = 48;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of ring) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
      const s = Math.min((w - 2 * MARGIN) / (x1 - x0), (h - 2 * MARGIN) / (y1 - y0));
      const ox = (w - s * (x1 - x0)) / 2 - s * x0, oy = (h + s * (y1 - y0)) / 2 + s * y0;
      const X = (x: number) => ox + s * x, Y = (y: number) => oy - s * y;

      // Outline
      ctx.beginPath();
      ring.forEach((p, i) => (i === 0 ? ctx.moveTo(X(p.x), Y(p.y)) : ctx.lineTo(X(p.x), Y(p.y))));
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fill();
      ctx.strokeStyle = "#c8cce0";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const { positions, radii } = sim;
      if (m === "Packing") {
        // One path for the circles inside and one for any outside (dropped when the run ends):
        // thousands of circles draw as two fills and two strokes.
        const inside = positions.map((p) => Polygon2D.pointInPolygon(p, ring));
        for (const [want, fill, stroke, dot] of [
          [true, "rgba(111,168,255,0.16)", "rgba(143,190,255,0.85)", "#dfe8ff"],
          [false, "rgba(255,107,107,0.25)", "#ff6b6b", "#ff6b6b"],
        ] as const) {
          const circles = new Path2D(), dots = new Path2D();
          for (let i = 0; i < positions.length; i++) {
            if (inside[i] !== want) continue;
            const cx = X(positions[i].x), cy = Y(positions[i].y), cr = radii[i] * s;
            circles.moveTo(cx + cr, cy);
            circles.arc(cx, cy, cr, 0, Math.PI * 2);
            dots.rect(cx - 1, cy - 1, 2, 2);
          }
          ctx.fillStyle = fill;
          ctx.fill(circles);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          ctx.stroke(circles);
          ctx.fillStyle = dot;
          ctx.fill(dots);
        }
      } else {
        // Springs, then rooms with their name and area.
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (const sp of sim.springs) {
          const a = positions[sp.i], b = positions[sp.j];
          ctx.beginPath();
          ctx.moveTo(X(a.x), Y(a.y));
          ctx.lineTo(X(b.x), Y(b.y));
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = 0; i < positions.length; i++) {
          const p = positions[i], room = ROOMS[i];
          ctx.beginPath();
          ctx.arc(X(p.x), Y(p.y), radii[i] * s, 0, Math.PI * 2);
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = room.color;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = room.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = "#f4f5fa";
          ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
          ctx.fillText(room.name, X(p.x), Y(p.y) - 7);
          ctx.fillStyle = "#b8bdd4";
          ctx.font = "11px ui-monospace, monospace";
          ctx.fillText(`${Math.round(Math.PI * radii[i] * radii[i])} m²`, X(p.x), Y(p.y) + 8);
        }
      }

      ctx.fillStyle = "#7a80a0";
      ctx.font = "12px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        m === "Packing"
          ? `${name}: area / (2√3 r²) circles, ${PACK_STEPS} steps, then centres outside are dropped`
          : `${name}: rooms linked by springs to the rooms they should touch`,
        16, 14,
      );
    });
  }, { container, title: "Circle Packing", background: BACKGROUND });
}
