// Walking, pixel-based. Dijkstra on the grid of floor cells (tekto Graph)
// gives every cell its walking distance to the exit. Isochrones show that
// field, the shortest path follows it down from a start cell, and a crowd of
// walkers descends the same field while keeping a little distance from each
// other, which is enough for queues to form at the doors.

import { Graph } from "../../../src";
import type { AppFactory, View } from "./shared";
import { P, BAR, clear, fit, text, dot, rng, FONT_SMALL } from "./shared";
import { plan, NX, NY, CELL, idx, isWall, interior, drawWalls, planPointer, resetPlan } from "./plan";

interface Walker { x: number; y: number; vx: number; vy: number }

export const walking: AppFactory = (env) => {
  let version = -1;
  let dist: Float64Array = new Float64Array(NX * NY) as Float64Array;
  let route: number[] = [];
  let view: View | null = null;
  const walkers: Walker[] = [];
  const rand = rng(11);
  let arrived = 0;

  function field() {
    const D8: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
    const nbs = (i: number) => {
      const x = Math.floor(i / NY), y = i % NY, out: number[] = [];
      if (isWall(x, y)) return out;
      for (const [dx, dy] of D8) {
        if (isWall(x + dx, y + dy)) continue;
        if (dx && dy && (isWall(x + dx, y) || isWall(x, y + dy))) continue; // no corner cutting
        out.push(idx(x + dx, y + dy));
      }
      return out;
    };
    const weight = (a: number, b: number) => (Math.floor(a / NY) !== Math.floor(b / NY) && a % NY !== b % NY ? Math.SQRT2 : 1);
    const g = new Graph(NX * NY, nbs, weight);
    const res = g.dijkstra(idx(plan.exit[0], plan.exit[1]));
    dist = res.dist;
    route = Graph.tracePath(res.pred, idx(plan.start[0], plan.start[1]));
    if (!Number.isFinite(dist[idx(plan.start[0], plan.start[1])])) route = [];
  }

  function spawn(w?: Walker): Walker {
    for (let k = 0; k < 200; k++) {
      const x = 5 + rand() * 61, y = 5 + rand() * 33;
      const i = idx(Math.floor(x), Math.floor(y));
      if (!isWall(Math.floor(x), Math.floor(y)) && Number.isFinite(dist[i]) && dist[i] > 12) {
        const o = w ?? { x, y, vx: 0, vy: 0 };
        o.x = x; o.y = y; o.vx = 0; o.vy = 0;
        return o;
      }
    }
    return w ?? { x: 30, y: 15, vx: 0, vy: 0 };
  }

  return {
    title: "Walking: distance, path, crowd",
    height: 470,
    fn: (lab) => {
      const tool = lab.select("Tool", ["Draw wall", "Erase", "Move exit", "Move start"] as const, "Draw wall").value;
      const iso = lab.toggle("Isochrones (every 2 m)", true, { group: "Show" }).value;
      const showPath = lab.toggle("Shortest path", true, { group: "Show" }).value;
      const count = lab.slider("Walkers", 0, 300, 90, { step: 1, group: "Crowd" }).value;
      const speed = lab.slider("Speed m/s", 0.5, 2.5, 1.3, { step: 0.05, group: "Crowd" }).value;
      const personal = lab.slider("Personal space m", 0, 1.2, 0.5, { step: 0.05, group: "Crowd" }).value;
      lab.button("Reset plan", () => { resetPlan(); });

      planPointer(lab, () => view, () => tool, { "Move exit": "exit", "Move start": "start" });

      if (version !== plan.version) { field(); version = plan.version; }
      while (walkers.length < count) walkers.push(spawn());
      walkers.length = Math.min(walkers.length, count);

      lab.animate((_t, dt) => {
        if (!env.visible) return;
        if (version !== plan.version) { field(); version = plan.version; }
        const v = speed / CELL;              // cells per second
        const rSep = personal / CELL + 0.6;
        for (const w of walkers) {
          const cx = Math.floor(w.x), cy = Math.floor(w.y);
          const here = dist[idx(cx, cy)];
          if (!Number.isFinite(here) || isWall(cx, cy)) { spawn(w); continue; }
          if (here < 2) { arrived++; spawn(w); continue; }
          // steepest descent over the 8 neighbours
          let bx = 0, by = 0, best = here;
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            if (!dx && !dy) continue;
            const d = isWall(cx + dx, cy + dy) ? Infinity : dist[idx(cx + dx, cy + dy)];
            if (d < best) { best = d; bx = cx + dx + 0.5 - w.x; by = cy + dy + 0.5 - w.y; }
          }
          const bl = Math.hypot(bx, by) || 1;
          let ax = (bx / bl) * v, ay = (by / bl) * v;
          // keep some distance from the others
          for (const o of walkers) {
            if (o === w) continue;
            const dx = w.x - o.x, dy = w.y - o.y, d2 = dx * dx + dy * dy;
            if (d2 > rSep * rSep || d2 < 1e-6) continue;
            const d = Math.sqrt(d2), push = (rSep - d) / rSep;
            ax += (dx / d) * push * v * 1.6; ay += (dy / d) * push * v * 1.6;
          }
          w.vx += (ax - w.vx) * Math.min(1, dt * 6);
          w.vy += (ay - w.vy) * Math.min(1, dt * 6);
          const sp = Math.hypot(w.vx, w.vy);
          if (sp > v) { w.vx *= v / sp; w.vy *= v / sp; }
          const nx = w.x + w.vx * dt, ny = w.y + w.vy * dt;
          if (!isWall(Math.floor(nx), Math.floor(ny))) { w.x = nx; w.y = ny; }
          else if (!isWall(Math.floor(nx), Math.floor(w.y))) w.x = nx;
          else if (!isWall(Math.floor(w.x), Math.floor(ny))) w.y = ny;
        }
        const s = dist[idx(plan.start[0], plan.start[1])];
        lab.log("Path length", Number.isFinite(s) ? `${(s * CELL).toFixed(1)} m` : "no route");
        lab.log("Walkers out", `${arrived}`);
      });

      lab.draw((ctx, w, h) => {
        if (!env.visible) return;
        clear(ctx, w, h);
        view = fit(0, 0, NX, NY, 0, 0, w, h - BAR, 8);
        const v = view, s = v.s;
        const band = 2 / CELL; // 2 m
        if (iso) {
          for (let x = 0; x < NX; x++) for (let y = 0; y < NY; y++) {
            const d = dist[idx(x, y)];
            if (!Number.isFinite(d) || isWall(x, y) || !interior(x, y)) continue;
            const b = Math.floor(d / band);
            if (b % 2 === 0) { ctx.fillStyle = P.grey(0.07); ctx.fillRect(v.X(x), v.Y(y + 1), s + 0.5, s + 0.5); }
          }
          // contour edges between bands
          ctx.strokeStyle = P.grey(0.4);
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          for (let x = 0; x < NX - 1; x++) for (let y = 0; y < NY - 1; y++) {
            const d = dist[idx(x, y)];
            if (!Number.isFinite(d) || !interior(x, y)) continue;
            const b = Math.floor(d / band);
            const r = interior(x + 1, y) ? dist[idx(x + 1, y)] : Infinity, u = interior(x, y + 1) ? dist[idx(x, y + 1)] : Infinity;
            if (Number.isFinite(r) && Math.floor(r / band) !== b) { ctx.moveTo(v.X(x + 1), v.Y(y)); ctx.lineTo(v.X(x + 1), v.Y(y + 1)); }
            if (Number.isFinite(u) && Math.floor(u / band) !== b) { ctx.moveTo(v.X(x), v.Y(y + 1)); ctx.lineTo(v.X(x + 1), v.Y(y + 1)); }
          }
          ctx.stroke();
        }
        drawWalls(ctx, v);

        if (showPath && route.length > 1) {
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          route.forEach((i, k) => {
            const x = Math.floor(i / NY) + 0.5, y = (i % NY) + 0.5;
            if (k) ctx.lineTo(v.X(x), v.Y(y)); else ctx.moveTo(v.X(x), v.Y(y));
          });
          ctx.stroke();
        }
        // walkers
        ctx.fillStyle = P.ink;
        for (const wk of walkers) dot(ctx, v.X(wk.x), v.Y(wk.y), Math.max(1.6, 0.35 * s));
        // markers
        const [sx, sy] = plan.start, [ex, ey] = plan.exit;
        ctx.fillStyle = P.paper; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        dot(ctx, v.X(sx + 0.5), v.Y(sy + 0.5), 6); dot(ctx, v.X(sx + 0.5), v.Y(sy + 0.5), 6, false);
        ctx.fillStyle = P.ink;
        ctx.fillRect(v.X(ex + 0.5) - 6, v.Y(ey + 0.5) - 6, 12, 12);
        ctx.fillStyle = P.grey(0.6);
        text(ctx, "start", v.X(sx + 0.5) + 9, v.Y(sy + 0.5) + 4, "left", "alphabetic", FONT_SMALL);
        text(ctx, "exit", v.X(ex + 0.5), v.Y(ey + 0.5) - 11, "center", "alphabetic", FONT_SMALL);
      });
    },
  };
};
