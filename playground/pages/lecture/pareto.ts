// Pareto front. A block on a plot, with rotation, width, depth and number of
// storeys free. Two objectives pull against each other: floor area (more is
// better) and shadow cast on the neighbour's garden to the north at a winter
// noon (less is better). Every grey dot is one design; the black ones are not
// beaten on both counts by any other. A weighted sum picks one of them; a
// small evolutionary run finds the same edge without sampling everything.

import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, fit, path, hatch, line, text, dot, orientedRect, rng, FONT_SMALL } from "./shared";

const PLOT = { x0: 0, y0: 0, x1: 60, y1: 40 };
const SETBACK = 3;
const GARDEN = { x0: 0, y0: 40, x1: 60, y1: 68 };
const CENTRE: Pt = [30, 20];
const FLOOR = 3;

interface Design { g: number[]; theta: number; w: number; d: number; n: number; area: number; shadow: number; rect: Pt[]; hull: Pt[] }

function decode(g: number[]): Omit<Design, "area" | "shadow" | "hull"> {
  const theta = g[0] * Math.PI, w = 8 + g[1] * 34, d = 8 + g[2] * 12, n = 1 + Math.round(g[3] * 15);
  return { g, theta, w, d, n, rect: orientedRect(CENTRE[0], CENTRE[1], w, d, theta) };
}

function valid(rect: Pt[]): boolean {
  return rect.every(([x, y]) => x >= PLOT.x0 + SETBACK && x <= PLOT.x1 - SETBACK && y >= PLOT.y0 + SETBACK && y <= PLOT.y1 - SETBACK);
}

function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

function inConvex(x: number, y: number, h: Pt[]): boolean {
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length];
    if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < 0) return false;
  }
  return true;
}

export const pareto: AppFactory = (env) => {
  let samples: Design[] = [];
  let sampleKey = "";
  let pop: Design[] = [];
  let gen = 0;
  let clock = 0;
  let hover: Design | null = null;
  let pinned: Design | null = null;
  let space: { x: number; y: number; w: number; h: number; amax: number; smax: number } | null = null;

  return {
    title: "Pareto front",
    height: 540,
    fn: (lab) => {
      const alt = lab.slider("Sun altitude °", 12, 60, 20, { step: 1, group: "Sun (noon)" }).value;
      const az = lab.slider("Sun azimuth °", -45, 45, 0, { step: 1, group: "Sun (noon)" }).value;
      const count = lab.slider("Random designs", 200, 3000, 1500, { step: 100, group: "Designs" }).value;
      const weight = lab.slider("Weight: area ↔ shadow", 0, 1, 0.5, { step: 0.01, group: "Weighted sum" }).value;
      const showW = lab.toggle("Show weighted choice", true, { group: "Weighted sum" }).value;
      const evolve = lab.toggle("Evolve", false, { group: "Evolution" }).value;
      lab.button("New population", () => { pop = []; gen = 0; }, { group: "Evolution" });

      const sunV = (n: number): Pt => {
        const L = (n * FLOOR) / Math.tan((alt * Math.PI) / 180), a = (az * Math.PI) / 180;
        return [Math.sin(a) * L, Math.cos(a) * L];
      };
      const evaluate = (g: number[]): Design | null => {
        const base = decode(g);
        if (!valid(base.rect)) return null;
        const [vx, vy] = sunV(base.n);
        const h = hull([...base.rect, ...base.rect.map(([x, y]) => [x + vx, y + vy] as Pt)]);
        let cells = 0;
        for (let x = GARDEN.x0 + 0.5; x < GARDEN.x1; x += 1) for (let y = GARDEN.y0 + 0.5; y < GARDEN.y1; y += 1) if (inConvex(x, y, h)) cells++;
        return { ...base, area: base.w * base.d * base.n, shadow: cells, hull: h };
      };
      const randomDesign = (r: () => number): Design => {
        for (let k = 0; k < 500; k++) { const d = evaluate([r(), r(), r(), r()]); if (d) return d; }
        return evaluate([0, 0, 0, 0])!;
      };

      const key = `${alt}|${az}|${count}`;
      if (key !== sampleKey) {
        const r = rng(4242);
        samples = Array.from({ length: count }, () => randomDesign(r));
        pop = pop.map((p) => evaluate(p.g) ?? p);
        hover = null; pinned = pinned ? evaluate(pinned.g) : null;
        sampleKey = key;
      }
      const front = paretoFront(samples);
      const bounds = () => {
        const all = [...samples, ...pop];
        return { amax: Math.max(...all.map((s) => s.area)), smax: Math.max(1, ...all.map((s) => s.shadow)) };
      };
      let { amax, smax } = bounds();
      const score = (d: Design) => weight * (d.area / amax) - (1 - weight) * (d.shadow / smax);
      const chosen = samples.reduce((a, b) => (score(b) > score(a) ? b : a), samples[0]);

      lab.onPointerMove((p) => {
        if (!space) return;
        let best: Design | null = null, bd = 12;
        for (const d of [...pop, ...samples]) {
          const x = space.x + (d.area / space.amax) * space.w, y = space.y + space.h - (d.shadow / space.smax) * space.h;
          const dd = Math.hypot(x - p.x, y - p.y);
          if (dd < bd) { bd = dd; best = d; }
        }
        hover = best;
      });
      lab.onPointerDown(() => { pinned = hover ?? null; });
      lab.once(() => lab.canvas.addEventListener("pointerleave", () => { hover = null; }));

      lab.animate((t) => {
        if (!env.visible) return;
        if (evolve && t - clock > 0.15) { clock = t; step(); }
        const d = hover ?? pinned ?? (showW ? chosen : null);
        if (d) {
          lab.log("Design", `${(d.theta * 180 / Math.PI).toFixed(0)}°, ${d.w.toFixed(1)} × ${d.d.toFixed(1)} m, ${d.n} storeys`);
          lab.log("Floor area", `${d.area.toFixed(0)} m²`);
          lab.log("Shadow on garden", `${d.shadow} m²`);
        }
        lab.log("Front", `${front.length} of ${samples.length} designs`);
        if (pop.length) lab.log("Evolution", `generation ${gen}, population ${pop.length}`);
      });

      function step() {
        const r = Math.random;
        if (!pop.length) { pop = Array.from({ length: 40 }, () => randomDesign(r)); gen = 0; return; }
        const kids: Design[] = [];
        while (kids.length < 40) {
          const a = pop[Math.floor(r() * pop.length)], b = pop[Math.floor(r() * pop.length)];
          let child: Design | null = null;
          for (let k = 0; k < 10 && !child; k++) {
            const g = a.g.map((v, i) => {
              let x = r() < 0.5 ? v : b.g[i];
              if (r() < 0.1) x = r(); else x += gauss(r) * 0.07;
              return Math.min(1, Math.max(0, x));
            });
            child = evaluate(g);
          }
          kids.push(child ?? a);
        }
        pop = selectNSGA([...pop, ...kids], 40);
        gen++;
      }

      lab.draw((ctx, w, h) => {
        if (!env.visible) return;
        clear(ctx, w, h);
        h -= BAR;
        ({ amax, smax } = bounds());
        const wide = w > 660;
        const pr = wide ? { x: 0, y: 0, w: w * 0.48, h } : { x: 0, y: 0, w, h: h * 0.5 };
        const sr = wide ? { x: w * 0.48 + 46, y: 30, w: w * 0.52 - 70, h: h - 72 } : { x: 52, y: h * 0.5 + 24, w: w - 76, h: h * 0.5 - 60 };
        space = { ...sr, amax, smax };
        const sel = hover ?? pinned ?? (showW ? chosen : null);

        // ── plan ──
        const v = fit(-2, -4, 62, GARDEN.y1 + 4, pr.x, pr.y, pr.w, pr.h, 12);
        const S = (q: Pt): Pt => [v.X(q[0]), v.Y(q[1])];
        const R = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
        ctx.strokeStyle = P.grey(0.4); ctx.lineWidth = 1;
        path(ctx, R(GARDEN.x0, GARDEN.y0, GARDEN.x1, GARDEN.y1).map(S), true); ctx.stroke();
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "neighbour's garden (north)", v.X(0), v.Y(GARDEN.y1) - 5, "left", "alphabetic", FONT_SMALL);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6;
        path(ctx, R(PLOT.x0, PLOT.y0, PLOT.x1, PLOT.y1).map(S), true); ctx.stroke();
        ctx.strokeStyle = P.grey(0.45); ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
        path(ctx, R(SETBACK, SETBACK, PLOT.x1 - SETBACK, PLOT.y1 - SETBACK).map(S), true); ctx.stroke(); ctx.setLineDash([]);
        if (sel) {
          const hs = sel.hull.map(S);
          ctx.save();
          path(ctx, R(GARDEN.x0, GARDEN.y0, GARDEN.x1, GARDEN.y1).map(S), true); ctx.clip();
          ctx.fillStyle = P.grey(0.18); path(ctx, hs, true); ctx.fill();
          ctx.strokeStyle = P.ink; hatch(ctx, hs, 3.5, -Math.PI / 4, 0.7);
          ctx.restore();
          ctx.strokeStyle = P.grey(0.5); ctx.lineWidth = 0.8; ctx.setLineDash([2, 3]);
          path(ctx, hs, true); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = P.ink; path(ctx, sel.rect.map(S), true); ctx.fill();
          const c = S(CENTRE);
          ctx.fillStyle = P.paper;
          text(ctx, `${sel.n}`, c[0], c[1], "center", "middle", FONT_SMALL);
        }
        // sun arrow from the south
        const a = (az * Math.PI) / 180, sx = v.X(30 - Math.sin(a) * 6), sy = v.Y(-1 - Math.cos(a) * 1);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1;
        dot(ctx, sx, sy + 10, 4, false);
        ctx.fillStyle = P.grey(0.55);
        text(ctx, `sun ${alt}°`, sx + 8, sy + 14, "left", "alphabetic", FONT_SMALL);

        // ── objective space ──
        const X = (d: Design) => sr.x + (d.area / amax) * sr.w;
        const Y = (d: Design) => sr.y + sr.h - (d.shadow / smax) * sr.h;
        ctx.strokeStyle = P.grey(0.4); ctx.lineWidth = 1;
        line(ctx, sr.x, sr.y + sr.h, sr.x + sr.w, sr.y + sr.h);
        line(ctx, sr.x, sr.y, sr.x, sr.y + sr.h);
        ctx.fillStyle = P.grey(0.55);
        text(ctx, `floor area → ${amax.toFixed(0)} m²`, sr.x + sr.w, sr.y + sr.h + 16, "right", "alphabetic", FONT_SMALL);
        ctx.save(); ctx.translate(sr.x - 12, sr.y + sr.h); ctx.rotate(-Math.PI / 2);
        text(ctx, "shadow on neighbour →", 0, 0, "left", "alphabetic", FONT_SMALL); ctx.restore();

        if (sel) {
          // everything this design beats (less area, more shadow)
          ctx.fillStyle = P.grey(0.08);
          ctx.fillRect(sr.x, sr.y, X(sel) - sr.x, Y(sel) - sr.y);
        }
        ctx.fillStyle = P.grey(0.35);
        for (const d of samples) ctx.fillRect(X(d) - 1, Y(d) - 1, 2, 2);
        // front as a staircase
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2;
        ctx.beginPath();
        front.forEach((d, i) => {
          if (!i) ctx.moveTo(X(d), Y(d));
          else { ctx.lineTo(X(front[i - 1]), Y(d)); ctx.lineTo(X(d), Y(d)); }
        });
        ctx.stroke();
        ctx.fillStyle = P.ink;
        for (const d of front) dot(ctx, X(d), Y(d), 2.6);

        if (pop.length) {
          ctx.strokeStyle = P.ink; ctx.lineWidth = 1;
          for (const d of pop) ctx.strokeRect(X(d) - 3.5, Y(d) - 3.5, 7, 7);
        }
        if (showW && !hover) {
          // iso-line of the weighted sum through the chosen design
          const sc = score(chosen);
          const ys = (ax: number) => ((weight * ax / amax - sc) / Math.max(1e-6, 1 - weight)) * smax;
          ctx.strokeStyle = P.grey(0.55); ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
          ctx.save(); ctx.beginPath(); ctx.rect(sr.x, sr.y, sr.w, sr.h); ctx.clip();
          line(ctx, sr.x, sr.y + sr.h - (ys(0) / smax) * sr.h, sr.x + sr.w, sr.y + sr.h - (ys(amax) / smax) * sr.h);
          ctx.restore(); ctx.setLineDash([]);
        }
        if (sel) {
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
          dot(ctx, X(sel), Y(sel), 7, false);
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "hover a dot · click to pin", sr.x + 6, sr.y - 10, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};

function gauss(r: () => number): number {
  return Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r());
}

const dominates = (a: Design, b: Design) =>
  a.area >= b.area && a.shadow <= b.shadow && (a.area > b.area || a.shadow < b.shadow);

/** Non-dominated designs, sorted by floor area. */
function paretoFront(ds: Design[]): Design[] {
  const s = [...ds].sort((a, b) => b.area - a.area || a.shadow - b.shadow);
  const out: Design[] = [];
  let best = Infinity;
  for (const d of s) if (d.shadow < best) { out.push(d); best = d.shadow; }
  return out.reverse();
}

/** Survivor selection after NSGA-II: rank by non-dominated fronts, break ties by crowding distance. */
function selectNSGA(all: Design[], n: number): Design[] {
  const rest = [...all];
  const out: Design[] = [];
  while (out.length < n && rest.length) {
    const front = rest.filter((a) => !rest.some((b) => b !== a && dominates(b, a)));
    if (out.length + front.length <= n) {
      out.push(...front);
    } else {
      const cd = new Map<Design, number>(front.map((d) => [d, 0]));
      for (const k of ["area", "shadow"] as const) {
        const s = [...front].sort((a, b) => a[k] - b[k]);
        const span = Math.max(1e-9, s[s.length - 1][k] - s[0][k]);
        cd.set(s[0], Infinity); cd.set(s[s.length - 1], Infinity);
        for (let i = 1; i < s.length - 1; i++) cd.set(s[i], cd.get(s[i])! + (s[i + 1][k] - s[i - 1][k]) / span);
      }
      front.sort((a, b) => cd.get(b)! - cd.get(a)!);
      out.push(...front.slice(0, n - out.length));
    }
    for (const d of front) rest.splice(rest.indexOf(d), 1);
  }
  return out;
}
