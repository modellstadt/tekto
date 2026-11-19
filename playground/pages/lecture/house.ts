// Parametric house. One fixed topology (walls, gable roof, windows, a straight
// stair), variable dimensions, and a few *derived* values: the number of
// risers follows from the storey height, the going from Blondel's rule, the
// slab opening from the headroom. Axonometric and section are two views of
// the same parameters.

import type { AppFactory } from "./shared";
import { P, BAR, clear, fit, path, hatch, text, line, dot, FONT_SMALL } from "./shared";
import type { Pt } from "./shared";

type V3 = [number, number, number];

export const house: AppFactory = () => ({
  title: "Parametric house",
  height: 500,
  fn: (lab) => {
    const W = lab.slider("Width m", 5, 14, 9, { step: 0.1, group: "House" }).value;
    const D = lab.slider("Depth m", 6, 14, 10, { step: 0.1, group: "House" }).value;
    const N = lab.slider("Storeys", 1, 4, 2, { step: 1, group: "House" }).value;
    const H = lab.slider("Storey height m", 2.5, 3.6, 3.0, { step: 0.05, group: "House" }).value;
    const pitch = lab.slider("Roof pitch °", 0, 55, 35, { step: 1, group: "House" }).value;
    const o = lab.slider("Overhang m", 0, 1.2, 0.5, { step: 0.05, group: "House" }).value;
    const nWin = lab.slider("Windows per floor", 1, 6, 3, { step: 1, group: "House" }).value;
    const rMax = lab.slider("Max riser cm", 15, 20, 17.5, { step: 0.5, group: "Stair" }).value / 100;
    const view = lab.select("View", ["Axonometric + section", "Axonometric", "Section"] as const, "Axonometric + section", { group: "View" }).value;
    const phi = (lab.slider("View angle °", -80, 80, 35, { step: 1, group: "View" }).value * Math.PI) / 180;

    // ── Derived values ──
    const t = Math.tan((pitch * Math.PI) / 180);
    const E = N * H;                      // eaves height
    const R = E + (D / 2) * t;            // ridge height
    const risers = Math.ceil(H / rMax - 1e-9);
    const r = H / risers;
    const g = Math.min(0.35, Math.max(0.2, 0.63 - 2 * r)); // Blondel: 2r + g = 63 cm
    const run = (risers - 1) * g;
    const y0 = 1.0;                       // stair starts 1 m behind the front wall
    const fits = y0 + run <= D - 0.8;

    lab.log("Floor area", `${(W * D * N).toFixed(0)} m²`);
    if (N > 1) {
      lab.log("Stair", `${risers} × ${(r * 100).toFixed(1)} cm`);
      lab.log("Going", `${(g * 100).toFixed(1)} cm  (2r+g = ${((2 * r + g) * 100).toFixed(0)})`);
      lab.log("Run", `${run.toFixed(2)} m ${fits ? "✓ fits" : "✗ too long"}`);
    } else {
      lab.log("Stair", "none (one storey)");
    }

    lab.draw((ctx, w, h) => {
      clear(ctx, w, h);
      const hh = h - BAR;
      if (view === "Axonometric") drawAxo(ctx, 0, 0, w, hh);
      else if (view === "Section") drawSection(ctx, 0, 0, w, hh);
      else if (w < 520) {
        drawAxo(ctx, 0, 0, w, hh * 0.5);
        drawSection(ctx, 0, hh * 0.5, w, hh * 0.5);
      } else {
        drawAxo(ctx, 0, 0, w * 0.52, hh);
        drawSection(ctx, w * 0.5, 0, w * 0.5, hh);
      }
    });

    // ── Axonometric ──────────────────────────────────────────────────
    function drawAxo(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
      const eps = (30 * Math.PI) / 180;
      const cp = Math.cos(phi), sp = Math.sin(phi), ce = Math.cos(eps), se = Math.sin(eps);
      const cx = W / 2, cy = D / 2;
      const proj = ([x, y, z]: V3): Pt => {
        const xr = (x - cx) * cp - (y - cy) * sp;
        const yr = (x - cx) * sp + (y - cy) * cp;
        return [xr, z * ce + yr * se];
      };
      const f: V3 = [sp * ce, cp * ce, -se]; // view direction (into the scene)
      const facing = (n: V3) => n[0] * f[0] + n[1] * f[1] + n[2] * f[2] < 0;

      const zr = E - o * t;
      const walls: { pts: V3[]; n: V3; wins: V3[][] }[] = [
        { pts: [[0, 0, 0], [W, 0, 0], [W, 0, E], [0, 0, E]], n: [0, -1, 0], wins: facadeWindows("front") },
        { pts: [[W, D, 0], [0, D, 0], [0, D, E], [W, D, E]], n: [0, 1, 0], wins: facadeWindows("back") },
        { pts: [[0, D, 0], [0, 0, 0], [0, 0, E], [0, D / 2, R], [0, D, E]], n: [-1, 0, 0], wins: sideWindows(0) },
        { pts: [[W, 0, 0], [W, D, 0], [W, D, E], [W, D / 2, R], [W, 0, E]], n: [1, 0, 0], wins: sideWindows(W) },
      ];
      const roofs: { pts: V3[]; n: V3 }[] = [
        { pts: [[-o, -o, zr], [W + o, -o, zr], [W + o, D / 2, R], [-o, D / 2, R]], n: [0, -t, 1] },
        { pts: [[W + o, D + o, zr], [-o, D + o, zr], [-o, D / 2, R], [W + o, D / 2, R]], n: [0, t, 1] },
      ];

      // bounds of everything that may be drawn
      const all: Pt[] = [...walls, ...roofs].flatMap((q) => q.pts.map(proj));
      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      for (const [x, y] of all) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
      const s = Math.min(18, (Math.min(rw / (maxx - minx), rh / (maxy - miny))) * 0.78);
      const X = (p: Pt): Pt => [rx + rw / 2 + (p[0] - (minx + maxx) / 2) * s, ry + rh / 2 - (p[1] - (miny + maxy) / 2) * s];
      const P2 = (v: V3) => X(proj(v));

      // ground shadow line
      ctx.strokeStyle = P.grey(0.35);
      ctx.lineWidth = 1;
      const gnd: V3[] = [[-1.5, -1.5, 0], [W + 1.5, -1.5, 0], [W + 1.5, D + 1.5, 0], [-1.5, D + 1.5, 0]];
      ctx.setLineDash([2, 3]);
      path(ctx, gnd.map(P2), true);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.lineWidth = 1.1;
      for (const wall of walls) {
        if (!facing(wall.n)) continue;
        ctx.fillStyle = P.paper;
        ctx.strokeStyle = P.ink;
        path(ctx, wall.pts.map(P2), true);
        ctx.fill();
        ctx.stroke();
        // storey lines, faint
        ctx.strokeStyle = P.grey(0.25);
        ctx.lineWidth = 0.7;
        for (let k = 1; k < N; k++) {
          const a = wall.pts[0], b = wall.pts[1];
          const p1 = P2([a[0], a[1], k * H]), p2 = P2([b[0], b[1], k * H]);
          line(ctx, p1[0], p1[1], p2[0], p2[1]);
        }
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 0.9;
        for (const win of wall.wins) {
          const q = win.map(P2);
          ctx.fillStyle = P.grey(0.1);
          path(ctx, q, true);
          ctx.fill();
          ctx.stroke();
          if (win.length === 4 && win[0][2] > 0.01) {
            const m1 = mid(q[0], q[1]), m2 = mid(q[3], q[2]);
            line(ctx, m1[0], m1[1], m2[0], m2[1]);
          }
        }
        ctx.lineWidth = 1.1;
      }

      // roof: farther slope first, back-facing slopes skipped
      const depthOf = (pts: V3[]) => pts.reduce((a, p) => a + p[0] * f[0] + p[1] * f[1] + p[2] * f[2], 0);
      const visibleRoofs = roofs.filter((q) => facing(q.n) || t === 0).sort((a, b) => depthOf(b.pts) - depthOf(a.pts));
      for (const q of visibleRoofs) {
        const s2 = q.pts.map(P2);
        ctx.fillStyle = P.paper;
        path(ctx, s2, true);
        ctx.fill();
        ctx.strokeStyle = P.grey(0.3);
        hatch(ctx, s2, 4, Math.atan2(s2[1][1] - s2[0][1], s2[1][0] - s2[0][0]), 0.6);
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 1.4;
        path(ctx, s2, true);
        ctx.stroke();
        ctx.lineWidth = 1.1;
      }
    }

    function facadeWindows(side: "front" | "back"): V3[][] {
      const y = side === "front" ? 0 : D;
      const out: V3[][] = [];
      for (let k = 0; k < N; k++) {
        for (let i = 0; i < nWin; i++) {
          const xc = ((i + 0.5) * W) / nWin;
          if (side === "front" && k === 0 && Math.abs(xc - W / 2) < 1.3) continue;
          const ww = Math.min(1.3, (W / nWin) * 0.6), z0 = k * H + 0.9, z1 = Math.min(k * H + 2.3, (k + 1) * H - 0.35);
          out.push([[xc - ww / 2, y, z0], [xc + ww / 2, y, z0], [xc + ww / 2, y, z1], [xc - ww / 2, y, z1]]);
        }
      }
      if (side === "front") out.push([[W / 2 - 0.5, 0, 0], [W / 2 + 0.5, 0, 0], [W / 2 + 0.5, 0, 2.2], [W / 2 - 0.5, 0, 2.2]]);
      if (side === "back") out.forEach((q) => q.reverse());
      return out;
    }

    function sideWindows(x: number): V3[][] {
      const out: V3[][] = [];
      const m = Math.max(1, Math.round(D / 4.5));
      for (let k = 0; k < N; k++) {
        for (let i = 0; i < m; i++) {
          const yc = ((i + 0.5) * D) / m, ww = 1.0, z0 = k * H + 0.9, z1 = Math.min(k * H + 2.3, (k + 1) * H - 0.35);
          out.push([[x, yc + ww / 2, z0], [x, yc - ww / 2, z0], [x, yc - ww / 2, z1], [x, yc + ww / 2, z1]]);
        }
      }
      return out;
    }

    // ── Section (cut across the ridge) ───────────────────────────────
    function drawSection(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
      const wt = 0.3, st = 0.25, rt = 0.22;
      const v = fit(-o - 2.2, -1, D + o + 1.2, R + 0.6, rx, ry, rw, rh, 18);
      const X = v.X, Y = v.Y;
      const rect = (y1: number, z1: number, y2: number, z2: number): Pt[] => [[X(y1), Y(z1)], [X(y2), Y(z1)], [X(y2), Y(z2)], [X(y1), Y(z2)]];
      const fillRect = (y1: number, z1: number, y2: number, z2: number) => { path(ctx, rect(y1, z1, y2, z2), true); ctx.fill(); };

      // ground + earth hatch
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 1;
      line(ctx, X(-o - 2.2), Y(0), X(D + o + 1.2), Y(0));
      ctx.strokeStyle = P.grey(0.4);
      hatch(ctx, rect(-o - 2.2, -0.6, D + o + 1.2, 0), 5, Math.PI / 4, 0.6);

      ctx.fillStyle = P.ink;
      fillRect(-wt, -0.35, D + wt, 0);          // ground slab
      for (const y1 of [-wt, D]) {              // external walls with window openings
        let z = 0;
        for (let k = 0; k < N; k++) {
          const z0 = k * H + 0.9, z1 = Math.min(k * H + 2.3, (k + 1) * H - 0.35);
          fillRect(y1, z, y1 + wt, z0);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8;
          line(ctx, X(y1 + wt / 2), Y(z0), X(y1 + wt / 2), Y(z1));
          z = z1;
        }
        fillRect(y1, z, y1 + wt, E);
      }

      // stairs and slabs with the openings they require
      for (let k = 1; k <= N; k++) {
        const zTop = k * H;
        if (k <= N - 1) {
          // opening where headroom above the stair would drop below 2.10 m
          const yOpen = y0 + g * Math.max(0, (H - st - 2.1 - r) / r);
          const yEnd = y0 + run;
          fillRect(0, zTop - st, Math.max(0, Math.min(yOpen, D)), zTop);
          if (yEnd < D) fillRect(Math.min(yEnd, D), zTop - st, D, zTop);
        } else {
          fillRect(0, zTop - st, D, zTop);
        }
      }
      if (N > 1) {
        for (let k = 0; k < N - 1; k++) {
          const z0 = k * H;
          const pts: Pt[] = [[X(y0), Y(z0)]];
          let yy = y0, zz = z0;
          for (let i = 0; i < risers; i++) {
            zz += r; pts.push([X(yy), Y(zz)]);
            if (i < risers - 1) { yy += g; pts.push([X(yy), Y(zz)]); }
          }
          // stringer underside
          const under: Pt[] = [[X(y0 + run), Y(z0 + H - st)], [X(y0 + 0.25), Y(z0)]];
          ctx.fillStyle = P.grey(0.15);
          path(ctx, [...pts, ...under], true);
          ctx.fill();
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 1.2;
          if (!fits) ctx.setLineDash([4, 3]);
          path(ctx, pts);
          ctx.stroke();
          ctx.lineWidth = 0.8;
          path(ctx, under);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = P.ink;
        text(ctx, `${risers} × ${(r * 100).toFixed(1)}`, X(y0 + run / 2), Y(H * 0.5) + 14, "left", "top", FONT_SMALL);
      }

      // roof, cut: a thick band along both slopes
      const zr = E - o * t;
      const k2 = rt / Math.cos(Math.atan(t));
      ctx.fillStyle = P.ink;
      path(ctx, [
        [X(-o), Y(zr)], [X(D / 2), Y(R)], [X(D + o), Y(zr)],
        [X(D + o), Y(zr - k2)], [X(D / 2), Y(R - k2)], [X(-o), Y(zr - k2)],
      ], true);
      ctx.fill();

      // level marks
      ctx.fillStyle = P.grey(0.6);
      for (let k = 0; k <= N; k++) {
        text(ctx, `+${(k * H).toFixed(2)}`, X(-o - 2.15), Y(k * H) - 3, "left", "alphabetic", FONT_SMALL);
      }
      if (t > 0) text(ctx, `+${R.toFixed(2)}`, X(D / 2) + 6, Y(R) - 4, "left", "alphabetic", FONT_SMALL);

      // a person for scale
      ctx.strokeStyle = P.ink;
      ctx.fillStyle = P.ink;
      ctx.lineWidth = 1.2;
      const py = D - 1.4, hgt = 1.75;
      dot(ctx, X(py), Y(hgt - 0.12), Math.max(1.5, 0.12 * v.s));
      line(ctx, X(py), Y(hgt - 0.25), X(py), Y(0.85));
      line(ctx, X(py), Y(0.85), X(py - 0.18), Y(0));
      line(ctx, X(py), Y(0.85), X(py + 0.18), Y(0));
      line(ctx, X(py), Y(1.4), X(py - 0.22), Y(0.9));
      line(ctx, X(py), Y(1.4), X(py + 0.22), Y(0.9));
    }
  },
});

function mid(a: Pt, b: Pt): Pt {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
