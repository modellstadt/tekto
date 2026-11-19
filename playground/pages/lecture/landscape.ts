// A one-dimensional fitness landscape you can see whole. A building (or a
// parking grid) is rotated about a fixed point in an irregular plot; for each
// angle we compute how good the best fitting design is. The curve over the
// angle is the landscape. A hill climber explores it one step at a time.

import type { AppFactory, Pt, View } from "./shared";
import { P, BAR, clear, fit, path, hatch, line, text, dot, polyInPoly, orientedRect, FONT_SMALL } from "./shared";

const STEPS = 180; // 1° resolution, 0–179°

export const landscape: AppFactory = (env) => {
  const PLOT0: Pt[] = [[0, 0], [72, 4], [70, 20], [34, 22], [26, 52], [8, 54], [-2, 26]];
  const CENTRE0: Pt = [18, 16];
  let plot: Pt[] = PLOT0.map((p) => [...p] as Pt);
  let centre: Pt = [...CENTRE0] as Pt;
  let fitness = new Float64Array(STEPS);
  let key = "";
  let theta = 62;               // current angle (index = degrees)
  let trail: number[] = [];
  let climbing = false;
  let stuck = false;
  let clock = 0;
  let evals = 0;
  let planView: View | null = null;
  let graph: { x: number; y: number; w: number; h: number } | null = null;
  let drag: number | null = null;
  let dirty = false;

  // The building runs through the centre point: each end grows until it
  // meets the boundary (a decoder: the angle is the only gene).
  function building(w: number, deg: number): { f: number; rect: Pt[] | null } {
    const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a);
    const piece = (s0: number, s1: number) => {
      const m = (s0 + s1) / 2;
      return orientedRect(centre[0] + ux * m, centre[1] + uy * m, s1 - s0, w, a);
    };
    if (!polyInPoly(piece(-0.1, 0.1), plot)) return { f: 0, rect: null };
    const reach = (dir: 1 | -1) => {
      let lo = 0.1, hi = 160;
      for (let k = 0; k < 20; k++) {
        const m = (lo + hi) / 2;
        if (polyInPoly(dir > 0 ? piece(0, m) : piece(-m, 0), plot)) lo = m; else hi = m;
      }
      return lo;
    };
    const f = reach(1), b = reach(-1);
    return { f: (f + b) * w, rect: piece(-b, f) };
  }

  function parking(deg: number): { f: number; bays: Pt[][] } {
    const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
    const bays: Pt[][] = [];
    const BW = 2.5, BD = 5, AISLE = 6, MOD = BD * 2 + AISLE;
    for (let j = -4; j <= 4; j++) {
      for (let i = -32; i <= 32; i++) {
        for (const side of [0, 1]) {
          const off = j * MOD + (side ? BD + AISLE : 0);
          const x0 = i * BW;
          const corners: Pt[] = [[x0, off], [x0 + BW, off], [x0 + BW, off + BD], [x0, off + BD]].map(([p, q]) =>
            [centre[0] + ux * p + vx * q, centre[1] + uy * p + vy * q] as Pt);
          if (polyInPoly(corners, plot)) bays.push(corners);
        }
      }
    }
    return { f: bays.length, bays };
  }

  return {
    title: "Fitness landscape",
    height: 520,
    fn: (lab) => {
      const problem = lab.select("Problem", ["Longest building", "Parking spaces"] as const, "Longest building").value;
      const width = problem === "Longest building" ? lab.slider("Building width m", 6, 30, 14, { step: 0.5 }).value : 0;
      const step = lab.slider("Step size °", 1, 30, 3, { step: 1, group: "Hill climber" }).value;
      const neutral = lab.toggle("Accept equal moves", false, { group: "Hill climber" }).value;
      const basins = lab.toggle("Show basins", false, { group: "Hill climber" }).value;
      lab.button("Climb", () => { climbing = true; stuck = false; if (!trail.length) trail = [theta]; }, { group: "Hill climber" });
      lab.button("Random restart", () => { theta = Math.floor(Math.random() * STEPS); trail = [theta]; climbing = false; stuck = false; evals = 0; }, { group: "Hill climber" });
      lab.button("Reset plot", () => { plot = PLOT0.map((p) => [...p] as Pt); centre = [...CENTRE0] as Pt; }, { group: "Plot" });

      const evalAll = () => {
        const k = `${problem}|${width}|${plot.flat().join(",")}|${centre.join(",")}`;
        if (k === key) return;
        key = k;
        for (let d = 0; d < STEPS; d++) fitness[d] = problem === "Longest building" ? building(width, d).f : parking(d).f;
      };
      evalAll();

      const wrap = (d: number) => ((d % STEPS) + STEPS) % STEPS;
      const climbFrom = (d0: number): number => {
        let d = d0;
        for (let k = 0; k < 400; k++) {
          const a = wrap(d - step), b = wrap(d + step);
          const best = fitness[a] >= fitness[b] ? a : b;
          if (fitness[best] > fitness[d]) d = best; else break;
        }
        return d;
      };

      lab.onPointerDown((p) => {
        if (graph && p.x >= graph.x && p.x <= graph.x + graph.w && p.y >= graph.y - 10 && p.y <= graph.y + graph.h + 24) {
          theta = wrap(Math.round(((p.x - graph.x) / graph.w) * STEPS));
          trail = [theta]; climbing = false; stuck = false; evals = 0;
          return;
        }
        if (!planView) return;
        const v = planView;
        const hit = (q: Pt) => Math.hypot(v.X(q[0]) - p.x, v.Y(q[1]) - p.y) < 10;
        if (hit(centre)) drag = -1;
        else { const i = plot.findIndex(hit); drag = i >= 0 ? i : null; }
        if (drag !== null) lab.canvas.setPointerCapture(p.id);
      });
      lab.onPointerMove((p) => {
        if (drag === null || !planView) return;
        const q = planView.inv(p.x, p.y) as Pt;
        if (drag === -1) centre = q; else plot[drag] = q;
        dirty = true; // re-evaluated once per frame in animate()
      });
      lab.onPointerUp(() => { drag = null; });

      lab.animate((t) => {
        if (!env.visible) return;
        if (dirty) { dirty = false; evalAll(); }
        if (climbing && t - clock > 0.3) {
          clock = t;
          const a = wrap(theta - step), b = wrap(theta + step);
          evals += 2;
          let best = fitness[a] > fitness[b] ? a : fitness[b] > fitness[a] ? b : (Math.random() < 0.5 ? a : b);
          if (fitness[best] > fitness[theta] || (neutral && fitness[best] === fitness[theta] && trail.length < 80)) {
            theta = best; trail.push(theta);
          } else { climbing = false; stuck = true; }
        }
        let gmax = 0;
        for (let d = 1; d < STEPS; d++) if (fitness[d] > fitness[gmax]) gmax = d;
        const unit = problem === "Longest building" ? " m²" : " bays";
        lab.log("Angle", `${theta}°`);
        lab.log("Fitness", `${fitness[theta].toFixed(0)}${unit}`);
        lab.log("Global best", `${fitness[gmax].toFixed(0)}${unit} at ${gmax}°`);
        lab.log("Climber", climbing ? `climbing (${evals} evaluations)` : stuck ? `stopped after ${evals} evaluations${fitness[theta] < fitness[gmax] ? ": local peak" : ": global peak"}` : "click the curve, then Climb");
      });

      lab.draw((ctx, w, h) => {
        if (!env.visible) return;
        clear(ctx, w, h);
        h -= BAR;
        const wide = w > 640;
        const pr = wide ? { x: 0, y: 0, w: w * 0.55, h } : { x: 0, y: 0, w, h: h * 0.56 };
        const gr = wide ? { x: w * 0.55 + 30, y: 40, w: w * 0.45 - 50, h: h - 90 } : { x: 44, y: h * 0.56 + 18, w: w - 64, h: h * 0.44 - 62 };
        graph = gr;

        // ── plan ──
        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
        for (const [x, y] of plot) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
        const v = fit(minx - 4, miny - 4, maxx + 4, maxy + 4, pr.x, pr.y, pr.w, pr.h, 10);
        planView = v;
        const S = (q: Pt): Pt => [v.X(q[0]), v.Y(q[1])];
        if (problem === "Longest building") {
          const r = building(width, theta).rect;
          if (r) {
            ctx.fillStyle = P.grey(0.12); path(ctx, r.map(S), true); ctx.fill();
            ctx.strokeStyle = P.grey(0.5); hatch(ctx, r.map(S), 4, (theta * Math.PI) / 180 + Math.PI / 4, 0.6);
            ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6; path(ctx, r.map(S), true); ctx.stroke();
          }
        } else {
          ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8;
          ctx.fillStyle = P.grey(0.1);
          for (const b of parking(theta).bays) { path(ctx, b.map(S), true); ctx.fill(); ctx.stroke(); }
        }
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.2;
        path(ctx, plot.map(S), true); ctx.stroke();
        ctx.fillStyle = P.paper; ctx.lineWidth = 1.2;
        for (const q of plot) { const [x, y] = S(q); ctx.fillRect(x - 4, y - 4, 8, 8); ctx.strokeRect(x - 4, y - 4, 8, 8); }
        const [cx, cy] = S(centre);
        ctx.fillStyle = P.ink; dot(ctx, cx, cy, 3.5);
        ctx.lineWidth = 1; dot(ctx, cx, cy, 8, false);
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "drag corners and centre", pr.x + 10, pr.y + 16, "left", "alphabetic", FONT_SMALL);

        // ── landscape ──
        let fmax = 1e-9; for (let d = 0; d < STEPS; d++) fmax = Math.max(fmax, fitness[d]);
        const GX = (d: number) => gr.x + (d / STEPS) * gr.w;
        const GY = (f: number) => gr.y + gr.h - (f / fmax) * gr.h;
        ctx.strokeStyle = P.grey(0.35); ctx.lineWidth = 1;
        line(ctx, gr.x, gr.y + gr.h, gr.x + gr.w, gr.y + gr.h);
        line(ctx, gr.x, gr.y, gr.x, gr.y + gr.h);
        ctx.fillStyle = P.grey(0.55);
        for (const d of [0, 45, 90, 135, 180]) {
          line(ctx, GX(d), gr.y + gr.h, GX(d), gr.y + gr.h + 4);
          text(ctx, `${d}°`, GX(d), gr.y + gr.h + 15, "center", "alphabetic", FONT_SMALL);
        }
        text(ctx, problem === "Longest building" ? "floor area" : "bays", gr.x - 6, gr.y - 8, "left", "alphabetic", FONT_SMALL);
        text(ctx, fmax.toFixed(0), gr.x - 5, gr.y + 4, "right", "alphabetic", FONT_SMALL);
        text(ctx, "0", gr.x - 5, gr.y + gr.h + 4, "right", "alphabetic", FONT_SMALL);

        // basins of attraction: alternate ink/paper for each distinct end point
        if (basins) {
          let prevEnd = -1, alt = 0;
          const by = gr.y + gr.h + 20;
          for (let d = 0; d < STEPS; d++) {
            const e = climbFrom(d);
            if (e !== prevEnd) { alt ^= 1; prevEnd = e; }
            ctx.fillStyle = alt ? P.ink : P.grey(0.25);
            ctx.fillRect(GX(d), by, gr.w / STEPS + 0.5, 5);
          }
        }

        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let d = 0; d < STEPS; d++) {
          if (problem === "Parking spaces") {
            if (d) ctx.lineTo(GX(d), GY(fitness[d - 1]));
            ctx[d ? "lineTo" : "moveTo"](GX(d), GY(fitness[d]));
          } else ctx[d ? "lineTo" : "moveTo"](GX(d), GY(fitness[d]));
        }
        ctx.stroke();

        // global max
        let gmax = 0; for (let d = 1; d < STEPS; d++) if (fitness[d] > fitness[gmax]) gmax = d;
        ctx.fillStyle = P.ink;
        ctx.beginPath(); ctx.moveTo(GX(gmax), GY(fitness[gmax]) - 5); ctx.lineTo(GX(gmax) - 5, GY(fitness[gmax]) - 13); ctx.lineTo(GX(gmax) + 5, GY(fitness[gmax]) - 13); ctx.fill();

        // climber
        ctx.strokeStyle = P.grey(0.5); ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]); line(ctx, GX(theta), gr.y, GX(theta), gr.y + gr.h); ctx.setLineDash([]);
        ctx.fillStyle = P.grey(0.45);
        for (const d of trail) dot(ctx, GX(d), GY(fitness[d]), 2.4);
        ctx.fillStyle = P.paper; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        dot(ctx, GX(theta), GY(fitness[theta]), 5.5); dot(ctx, GX(theta), GY(fitness[theta]), 5.5, false);
      });
    },
  };
};
