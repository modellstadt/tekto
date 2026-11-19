// L-systems. A string of symbols is rewritten in parallel by a few rules,
// then read by a turtle: F = draw forward, + / − = turn, [ ] = push / pop.
// The same machinery grows plants, snowflakes and space-filling curves.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, rng, FONT_SMALL } from "./shared";

interface Preset {
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  iters: number;
  maxIters: number;
  heading: number;
}

const PRESETS: Record<string, Preset> = {
  "Plant": { axiom: "X", rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" }, angle: 25, iters: 4, maxIters: 6, heading: 90 },
  "Branching": { axiom: "F", rules: { F: "FF+[+F-F-F]-[-F+F+F]" }, angle: 22.5, iters: 4, maxIters: 5, heading: 90 },
  "Koch snowflake": { axiom: "F--F--F", rules: { F: "F+F--F+F" }, angle: 60, iters: 4, maxIters: 6, heading: 0 },
  "Sierpiński": { axiom: "F-G-G", rules: { F: "F-G+F+G-F", G: "GG" }, angle: 120, iters: 5, maxIters: 7, heading: 0 },
  "Dragon": { axiom: "FX", rules: { X: "X+YF+", Y: "-FX-Y" }, angle: 90, iters: 11, maxIters: 12, heading: 0 },
  // Hilbert: checked to visit every cell of a 2^n × 2^n grid exactly once, n ≤ 7
  "Hilbert": { axiom: "A", rules: { A: "+BF-AFA-FB+", B: "-AF+BFB+FA-" }, angle: 90, iters: 5, maxIters: 7, heading: 0 },
};
const NAMES = Object.keys(PRESETS) as (keyof typeof PRESETS)[];

function rewrite(axiom: string, rules: Record<string, string>, n: number, cap = 400_000): string[] {
  const gens = [axiom];
  let s = axiom;
  for (let i = 0; i < n; i++) {
    let out = "";
    for (const c of s) { out += rules[c] ?? c; if (out.length > cap) break; }
    s = out;
    gens.push(s);
    if (s.length > cap) break;
  }
  return gens;
}

export const lsystem: AppFactory = (env) => {
  let growStart = -1;
  let growth = 1;
  let run = 0;
  let drawn = "";
  let off: HTMLCanvasElement | null = null;

  return {
    title: "L-system",
    height: 500,
    fn: (lab) => {
      const name = lab.select("Preset", NAMES as unknown as readonly string[], "Plant").value;
      const pre = PRESETS[name];
      // the sliders live in a group named after the preset, so each preset
      // starts from its own defaults
      const n = lab.slider("Iterations", 0, pre.maxIters, pre.iters, { step: 1, group: name }).value;
      const dAngle = lab.slider("Angle offset °", -20, 20, 0, { step: 0.5, group: name }).value;
      const jitter = lab.slider("Randomness °", 0, 15, 0, { step: 0.5, group: name }).value;
      const seed = lab.slider("Seed", 1, 50, 1, { step: 1, group: name }).value;
      lab.button("Grow", () => { growStart = -1; growth = 0; });
      run++;

      const iters = Math.min(n, pre.maxIters);
      const gens = rewrite(pre.axiom, pre.rules, Math.max(0, iters));
      const str = gens[gens.length - 1];
      const angle = ((pre.angle + dAngle) * Math.PI) / 180;

      // Turtle → polyline segments
      const rand = rng(seed * 31);
      const segs: number[] = [];
      let x = 0, y = 0, a = (pre.heading * Math.PI) / 180;
      const stack: number[] = [];
      for (const c of str) {
        if (c === "F" || c === "G") {
          const nx = x + Math.cos(a), ny = y + Math.sin(a);
          segs.push(x, y, nx, ny, stack.length / 3);
          x = nx; y = ny;
        } else if (c === "+") a += angle + (jitter ? (rand() - 0.5) * 2 * (jitter * Math.PI / 180) : 0);
        else if (c === "-") a -= angle + (jitter ? (rand() - 0.5) * 2 * (jitter * Math.PI / 180) : 0);
        else if (c === "[") stack.push(x, y, a);
        else if (c === "]") { a = stack.pop()!; y = stack.pop()!; x = stack.pop()!; }
      }
      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      for (let i = 0; i < segs.length; i += 5) {
        minx = Math.min(minx, segs[i], segs[i + 2]); maxx = Math.max(maxx, segs[i], segs[i + 2]);
        miny = Math.min(miny, segs[i + 1], segs[i + 3]); maxy = Math.max(maxy, segs[i + 1], segs[i + 3]);
      }
      const nSeg = segs.length / 5;
      let maxDepth = 1;
      for (let i = 4; i < segs.length; i += 5) if (segs[i] > maxDepth) maxDepth = segs[i];
      lab.log("Rules", Object.entries(pre.rules).map(([k, v]) => `${k}→${v}`).join("  "));
      lab.log("Generation", `${gens.length - 1}`);
      lab.log("Length", `${str.length.toLocaleString("en")} symbols, ${nSeg.toLocaleString("en")} lines`);

      lab.animate((t) => {
        if (!env.visible || growth >= 1) return;
        if (growStart < 0) growStart = t;
        growth = Math.min(1, (t - growStart) / 2.5);
      });

      lab.draw((ctx, w, h) => {
        // redraw only when something changed: the drawing can be large
        // (rendered into an offscreen canvas, then copied)
        if (!env.visible) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const k = `${run}|${w}|${h}|${growth}|${P.ink}|${dpr}`;
        if (k !== drawn || !off) {
          drawn = k;
          off ??= document.createElement("canvas");
          off.width = Math.round(w * dpr); off.height = Math.round(h * dpr);
          const oc = off.getContext("2d")!;
          oc.setTransform(dpr, 0, 0, dpr, 0, 0);
          render(oc, w, h - BAR);
        }
        ctx.drawImage(off, 0, 0, w, h);
      });

      function render(ctx: CanvasRenderingContext2D, w: number, h: number) {
        clear(ctx, w, h + BAR);
        // the first generations of the string, as text
        ctx.fillStyle = P.grey(0.55);
        const lines = gens.slice(0, 4);
        lines.forEach((g, i) => {
          const shown = g.length > 70 ? g.slice(0, 70) + "…" : g;
          text(ctx, `${i}: ${shown}`, 12, 18 + i * 14, "left", "alphabetic", FONT_SMALL);
        });
        if (!nSeg) return;
        const top = 18 + lines.length * 14;
        const pad = 16;
        const s = Math.min((w - 2 * pad) / Math.max(maxx - minx, 1e-6), (h - top - 2 * pad) / Math.max(maxy - miny, 1e-6));
        const ox = (w - (maxx - minx) * s) / 2 - minx * s;
        const oy = top + (h - top + (maxy - miny) * s) / 2 + miny * s;
        const count = Math.floor(nSeg * growth);
        ctx.strokeStyle = P.ink;
        ctx.lineCap = "round";
        const branching = /\[/.test(Object.values(pre.rules).join(""));
        if (branching) {
          // thicker near the root: bucket segments by stack depth
          for (let d = 0; d <= maxDepth + 1; d++) {
            ctx.lineWidth = Math.max(0.5, 2.6 * Math.pow(0.72, d));
            ctx.beginPath();
            for (let i = 0; i < count; i++) {
              const o = i * 5;
              if (segs[o + 4] !== d) continue;
              ctx.moveTo(ox + segs[o] * s, oy - segs[o + 1] * s);
              ctx.lineTo(ox + segs[o + 2] * s, oy - segs[o + 3] * s);
            }
            ctx.stroke();
          }
        } else {
          ctx.lineWidth = Math.max(0.6, Math.min(1.6, s * 0.25));
          ctx.beginPath();
          for (let i = 0; i < count; i++) {
            const o = i * 5;
            ctx.moveTo(ox + segs[o] * s, oy - segs[o + 1] * s);
            ctx.lineTo(ox + segs[o + 2] * s, oy - segs[o + 3] * s);
          }
          ctx.stroke();
        }
      }
    },
  };
};
