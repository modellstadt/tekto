// Parametric subdivision, two ways.
//  - Recursive split: a rectangle is cut, then each half is cut again, with
//    ratio, variation and depth as parameters. Line weight follows the level
//    of the cut, so the hierarchy of the subdivision stays readable.
//  - Serpentine: Cecil Balmond's rule for Toyo Ito's 2002 Serpentine Pavilion.
//    Join the half point of one side to the third point of the next side; the
//    four lines do not meet inside the square, but extended they meet just
//    outside it, at the corners of a smaller, rotated square. Repeat, then
//    extend every line to the edge of the original square.

import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, fit, path, hatch, rng } from "./shared";

interface Cut { a: Pt; b: Pt; level: number }
interface Leaf { pts: Pt[]; kind: 0 | 1 | 2 }

export const subdivision: AppFactory = () => {
  let parityCache: { key: string; img: HTMLCanvasElement } | null = null;

  return {
    title: "Parametric subdivision",
    height: 500,
    fn: (lab) => {
      const mode = lab.select("Mode", ["Recursive split", "Serpentine"] as const, "Recursive split").value;

      if (mode === "Recursive split") {
        const depth = lab.slider("Depth", 1, 10, 6, { step: 1, group: "Split" }).value;
        const ratio = lab.slider("Ratio", 0.15, 0.85, 0.5, { step: 0.01, group: "Split" }).value;
        const variation = lab.slider("Variation", 0, 1, 0.35, { step: 0.01, group: "Split" }).value;
        const rule = lab.select("Cut across", ["Longer side", "Alternate"] as const, "Longer side", { group: "Split" }).value;
        const minSize = lab.slider("Min. cell", 0.01, 0.2, 0.04, { step: 0.005, group: "Split" }).value;
        const prop = lab.slider("Proportion", 0.5, 2, 1.5, { step: 0.05, group: "Frame" }).value;
        const fill = lab.slider("Solid cells", 0, 0.6, 0.12, { step: 0.01, group: "Frame" }).value;
        const seed = lab.slider("Seed", 1, 100, 7, { step: 1, group: "Frame" }).value;

        // Build the cut tree once per parameter change.
        const rand = rng(seed * 7919);
        const cuts: Cut[] = [];
        const leaves: Leaf[] = [];
        const split = (x: number, y: number, w: number, h: number, level: number) => {
          const vertical = rule === "Longer side" ? w >= h : level % 2 === 0;
          const len = vertical ? w : h;
          if (level >= depth || len < 2 * minSize) {
            const u = rand();
            leaves.push({ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], kind: u < fill ? 1 : u < fill * 2 ? 2 : 0 });
            return;
          }
          const r = Math.min(0.9, Math.max(0.1, ratio + (rand() - 0.5) * variation));
          if (vertical) {
            const xm = x + w * r;
            cuts.push({ a: [xm, y], b: [xm, y + h], level });
            split(x, y, xm - x, h, level + 1);
            split(xm, y, x + w - xm, h, level + 1);
          } else {
            const ym = y + h * r;
            cuts.push({ a: [x, ym], b: [x + w, ym], level });
            split(x, y, w, ym - y, level + 1);
            split(x, ym, w, y + h - ym, level + 1);
          }
        };
        const W = prop, H = 1;
        split(0, 0, W, H, 0);
        lab.log("Cells", leaves.length);
        lab.log("Cuts", cuts.length);

        lab.draw((ctx, w, h) => {
          clear(ctx, w, h);
          const v = fit(0, 0, W, H, 0, 0, w, h - BAR, 22);
          const S = (p: Pt): Pt => [v.X(p[0]), v.Y(p[1])];
          for (const leaf of leaves) {
            const q = leaf.pts.map(S);
            if (leaf.kind === 1) { ctx.fillStyle = P.ink; path(ctx, q, true); ctx.fill(); }
            else if (leaf.kind === 2) { ctx.strokeStyle = P.grey(0.55); hatch(ctx, q, 4, Math.PI / 4, 0.7); }
          }
          ctx.strokeStyle = P.ink;
          ctx.lineCap = "square";
          for (const c of cuts) {
            ctx.lineWidth = Math.max(0.6, 4 * Math.pow(0.7, c.level));
            const a = S(c.a), b = S(c.b);
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          }
          ctx.lineWidth = 4.5;
          path(ctx, [S([0, 0]), S([W, 0]), S([W, H]), S([0, H])], true);
          ctx.stroke();
        });
        return;
      }

      // ── Serpentine ────────────────────────────────────────────────────
      const a = lab.slider("Point on side 1", 0.05, 0.95, 0.5, { step: 0.01, group: "Rule" }).value;
      const b = lab.slider("Point on side 2", 0.05, 0.95, 1 / 3, { step: 0.01, group: "Rule" }).value;
      const iters = lab.slider("Iterations", 1, 14, 6, { step: 1, group: "Rule" }).value;
      const extend = lab.toggle("Extend lines to edge", true, { group: "Display" }).value;
      const twoColour = lab.toggle("Two-colour fill", true, { group: "Display" }).value;
      const showFirst = lab.toggle("Mark first rule", true, { group: "Display" }).value;

      // lines as point + direction; squares as corner lists
      const lines: { p: Pt; d: Pt; s0: Pt; s1: Pt }[] = [];
      const squares: Pt[][] = [];
      let sq: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
      squares.push(sq);
      const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      let steps = 0;
      for (let k = 0; k < iters; k++) {
        const L = [0, 1, 2, 3].map((i) => {
          const A = lerp(sq[i], sq[(i + 1) % 4], a);
          const B = lerp(sq[(i + 1) % 4], sq[(i + 2) % 4], b);
          return { p: A, d: [B[0] - A[0], B[1] - A[1]] as Pt, s0: A, s1: B };
        });
        const next = [0, 1, 2, 3].map((i) => intersect(L[i], L[(i + 1) % 4]));
        if (next.some((q) => !q)) break;
        const side = Math.hypot(next[1]![0] - next[0]![0], next[1]![1] - next[0]![1]);
        const prevSide = Math.hypot(sq[1][0] - sq[0][0], sq[1][1] - sq[0][1]);
        if (side >= prevSide * 0.999 || side < 1e-4) break;
        lines.push(...L);
        sq = next as Pt[];
        squares.push(sq);
        steps++;
      }
      const scale = squares.length > 1 ? Math.hypot(squares[1][1][0] - squares[1][0][0], squares[1][1][1] - squares[1][0][1]) : 1;
      lab.log("Iterations", steps);
      lab.log("Scale per step", scale.toFixed(3));
      lab.log("Lines", lines.length);

      lab.draw((ctx, w, h) => {
        clear(ctx, w, h);
        const m = extend ? 0.08 : 0.14;
        const v = fit(-m, -m, 1 + m, 1 + m, 0, 0, w, h - BAR, 18);
        const S = (p: Pt): Pt => [v.X(p[0]), v.Y(p[1])];
        const x0 = v.X(0), y0 = v.Y(1), side = v.X(1) - v.X(0);

        if (extend && twoColour && lines.length) {
          const n = Math.max(1, Math.round(side));
          const key = `${a},${b},${steps},${n},${P.ink},${P.paper}`;
          if (!parityCache || parityCache.key !== key) parityCache = { key, img: parityImage(lines, n) };
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(parityCache.img, x0, y0, side, side);
        }

        ctx.save();
        if (extend) { path(ctx, squares[0].map(S), true); ctx.clip(); }
        ctx.strokeStyle = P.ink;
        if (extend) {
          ctx.lineWidth = 0.9;
          for (const L of lines) {
            const [p, q] = clipToUnit(L.p, L.d);
            if (!p) continue;
            const s0 = S(p), s1 = S(q!);
            ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
          }
        } else {
          ctx.lineWidth = 1;
          for (const s of squares) { path(ctx, s.map(S), true); ctx.stroke(); }
          ctx.strokeStyle = P.grey(0.45);
          ctx.lineWidth = 0.7;
          for (const L of lines) { const s0 = S(L.s0), s1 = S(L.s1); ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke(); }
        }
        ctx.restore();

        if (showFirst && lines.length >= 4) {
          // the first application of the rule: two points per side, four lines, a new square
          ctx.strokeStyle = P.ink;
          ctx.fillStyle = P.paper;
          ctx.lineWidth = 2.4;
          ctx.setLineDash([6, 4]);
          path(ctx, squares[1].map(S), true);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 1.2;
          for (let i = 0; i < 4; i++) {
            for (const p of [lines[i].s0, lines[i].s1]) {
              const s = S(p);
              ctx.beginPath(); ctx.arc(s[0], s[1], 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
          }
        }
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 2.5;
        path(ctx, squares[0].map(S), true);
        ctx.stroke();
      });
    },
  };

  function parityImage(lines: { p: Pt; d: Pt }[], n: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = n; c.height = n;
    const g = c.getContext("2d")!;
    const img = g.createImageData(n, n);
    const ink = rgbOf(P.ink), paper = rgbOf(P.paper), mid = ink.map((v, i) => paper[i] + (v - paper[i]) * 0.14);
    const L = lines.map(({ p, d }) => [d[1], -d[0], -(d[1] * p[0] - d[0] * p[1])]);
    for (let j = 0; j < n; j++) {
      const y = 1 - (j + 0.5) / n;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) / n;
        let par = 0;
        for (const [A, B, C] of L) if (A * x + B * y + C > 0) par ^= 1;
        const col = par ? mid : paper;
        const o = (j * n + i) * 4;
        img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
};

function rgbOf(css: string): number[] {
  const m = css.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"];
  return m.slice(0, 3).map(Number);
}

function intersect(l1: { p: Pt; d: Pt }, l2: { p: Pt; d: Pt }): Pt | null {
  const den = l1.d[0] * l2.d[1] - l1.d[1] * l2.d[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((l2.p[0] - l1.p[0]) * l2.d[1] - (l2.p[1] - l1.p[1]) * l2.d[0]) / den;
  return [l1.p[0] + l1.d[0] * t, l1.p[1] + l1.d[1] * t];
}

/** Clip the infinite line p + t d to the unit square. */
function clipToUnit(p: Pt, d: Pt): [Pt | null, Pt | null] {
  let t0 = -Infinity, t1 = Infinity;
  for (let k = 0; k < 2; k++) {
    if (Math.abs(d[k]) < 1e-12) { if (p[k] < 0 || p[k] > 1) return [null, null]; continue; }
    let a = (0 - p[k]) / d[k], b = (1 - p[k]) / d[k];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
  }
  if (t0 > t1) return [null, null];
  return [[p[0] + d[0] * t0, p[1] + d[1] * t0], [p[0] + d[0] * t1, p[1] + d[1] * t1]];
}
