// From noise to form: diffusion in two dimensions. The "training images" are
// points on a drawing (a house, a plan, an arch). The forward process blurs
// them into Gaussian noise; generation runs it backwards: at every step each
// particle asks "which clean drawing am I most likely a noisy version of?"
// and moves a little towards the answer. In a real image generator a neural
// network learns that answer from millions of images. Here it is computed
// exactly from the training points, which is why this model can only ever
// redraw its training set: the simplest case of memorisation.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, dot, rng, FONT_SMALL } from "./shared";

const T = 60;          // denoising steps
const NP = 700;        // generated particles

type Shape = [number, number][];

function polyline(pts: [number, number][], n: number, closed = false): Shape {
  const segs: [number, number, number, number, number][] = [];
  let total = 0;
  const m = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push([a[0], a[1], b[0], b[1], l]); total += l;
  }
  const out: Shape = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * total;
    for (const [x0, y0, x1, y1, l] of segs) {
      if (d <= l) { out.push([x0 + ((x1 - x0) * d) / l, y0 + ((y1 - y0) * d) / l]); break; }
      d -= l;
    }
  }
  return out;
}

const TARGETS: Record<string, () => Shape> = {
  House: () => [
    ...polyline([[-0.6, -0.7], [0.6, -0.7], [0.6, 0.15], [0, 0.7], [-0.6, 0.15]], 150, true),
    ...polyline([[-0.12, -0.7], [-0.12, -0.25], [0.12, -0.25], [0.12, -0.7]], 30),
    ...polyline([[0.25, -0.2], [0.45, -0.2], [0.45, 0.0], [0.25, 0.0]], 20, true),
    ...polyline([[-0.45, -0.2], [-0.25, -0.2], [-0.25, 0.0], [-0.45, 0.0]], 20, true),
  ],
  Plan: () => [
    ...polyline([[-0.75, -0.55], [0.75, -0.55], [0.75, 0.55], [-0.75, 0.55]], 150, true),
    ...polyline([[-0.1, -0.55], [-0.1, 0.3]], 30),
    ...polyline([[-0.75, 0.05], [-0.35, 0.05]], 16),
    ...polyline([[0.3, 0.55], [0.3, -0.1], [0.75, -0.1]], 34),
  ],
  Arch: () => {
    const pts: [number, number][] = [[-0.5, -0.75], [-0.5, 0.05]];
    for (let i = 1; i < 20; i++) { const a = Math.PI - (Math.PI * i) / 20; pts.push([Math.cos(a) * 0.5, 0.05 + Math.sin(a) * 0.5]); }
    pts.push([0.5, 0.05], [0.5, -0.75]);
    return [...polyline(pts, 170), ...polyline([[-0.75, -0.75], [0.75, -0.75]], 40)];
  },
};

// noise schedule (cosine, as in improved DDPM)
const abar = Array.from({ length: T + 1 }, (_, t) => {
  const f = (s: number) => Math.cos(((s / T + 0.008) / 1.008) * (Math.PI / 2)) ** 2;
  return Math.max(1e-4, f(t) / f(0));
});

export const diffusion: AppFactory = (env) => {
  let data: Shape = [];
  let traj: Float32Array[] = [];       // traj[t] = positions of all particles at step t (T = pure noise)
  let guess: Float32Array[] = [];      // the model's guess of the clean drawing at each step
  let key = "";
  let t = T, playing = false, clock = 0, prevStep = 0;

  function generate(shape: string, seed: number, stochastic: boolean) {
    data = TARGETS[shape]();
    const r = rng(seed), g = () => { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    traj = Array.from({ length: T + 1 }, () => new Float32Array(NP * 2));
    guess = Array.from({ length: T + 1 }, () => new Float32Array(NP * 2));
    for (let i = 0; i < NP * 2; i++) traj[T][i] = g();
    const w = new Float64Array(data.length);
    for (let s = T; s > 0; s--) {
      const a = abar[s], ap = abar[s - 1], sa = Math.sqrt(a), s1 = Math.sqrt(1 - a);
      for (let i = 0; i < NP; i++) {
        const x = traj[s][i * 2], y = traj[s][i * 2 + 1];
        // ideal denoiser: posterior mean of the clean point, a softmax over the training points
        let mx = -Infinity;
        for (let k = 0; k < data.length; k++) {
          const dx = x - sa * data[k][0], dy = y - sa * data[k][1];
          w[k] = -(dx * dx + dy * dy) / (2 * (1 - a));
          if (w[k] > mx) mx = w[k];
        }
        let z = 0, gx = 0, gy = 0;
        for (let k = 0; k < data.length; k++) { const e = Math.exp(w[k] - mx); z += e; gx += e * data[k][0]; gy += e * data[k][1]; }
        gx /= z; gy /= z;
        guess[s][i * 2] = gx; guess[s][i * 2 + 1] = gy;
        // predicted noise, then a DDIM step (plus optional fresh noise, DDPM-like)
        const ex = (x - sa * gx) / s1, ey = (y - sa * gy) / s1;
        const eta = stochastic ? 1 : 0;
        const sig = eta * Math.sqrt(((1 - ap) / (1 - a)) * (1 - a / ap));
        const c = Math.sqrt(Math.max(0, 1 - ap - sig * sig));
        traj[s - 1][i * 2] = Math.sqrt(ap) * gx + c * ex + sig * g();
        traj[s - 1][i * 2 + 1] = Math.sqrt(ap) * gy + c * ey + sig * g();
      }
    }
    for (let i = 0; i < NP * 2; i++) guess[0][i] = traj[0][i];
  }

  return {
    title: "Diffusion: from noise to form",
    height: 500,
    fn: (lab) => {
      const shape = lab.select("Training drawing", Object.keys(TARGETS) as readonly string[], "House").value;
      const step = lab.slider("Step (noise → form)", 0, T, 0, { step: 1 });
      const stochastic = lab.toggle("Add fresh noise at each step", true).value;
      const showGuess = lab.toggle("Show the model's guess", false).value;
      const showData = lab.toggle("Show training points", false).value;
      const seed = lab.slider("Seed", 1, 50, 1, { step: 1 }).value;
      lab.button("Generate ▸", () => { t = T; playing = true; });
      lab.button("Back to noise", () => { t = T; playing = false; });

      const k = `${shape}|${seed}|${stochastic}`;
      if (k !== key) { key = k; generate(shape, seed, stochastic); t = T; }
      // moving the step slider scrubs through the generation
      if (step.value !== prevStep) { prevStep = step.value; t = T - step.value; playing = false; }

      lab.animate((time) => {
        if (!env.visible) return;
        if (playing && time - clock > 0.05) { clock = time; t = Math.max(0, t - 1); if (t === 0) playing = false; }
        lab.log("Step", `${T - t} of ${T}`);
        lab.log("Noise left", `${Math.round(Math.sqrt(1 - abar[t]) * 100)} %`);
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const s = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2 + 6;
        ctx.strokeStyle = P.grey(0.2); ctx.lineWidth = 1;
        ctx.strokeRect(cx - s * 1.6, cy - s * 1.6, s * 3.2, s * 3.2);
        if (showData) { ctx.fillStyle = P.grey(0.35); for (const [x, y] of data) dot(ctx, cx + x * s, cy - y * s, 1.3); }
        const pos = traj[t];
        if (showGuess && t > 0) {
          ctx.strokeStyle = P.grey(0.35); ctx.lineWidth = 0.6;
          ctx.beginPath();
          for (let i = 0; i < NP; i += 3) {
            ctx.moveTo(cx + pos[i * 2] * s, cy - pos[i * 2 + 1] * s);
            ctx.lineTo(cx + guess[t][i * 2] * s, cy - guess[t][i * 2 + 1] * s);
          }
          ctx.stroke();
        }
        ctx.fillStyle = P.ink;
        for (let i = 0; i < NP; i++) {
          const x = cx + pos[i * 2] * s, y = cy - pos[i * 2 + 1] * s;
          if (x > 0 && y > 0 && x < w && y < h) ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, t === T ? "pure noise: press Generate or drag the step slider" : t === 0 ? "done" : "denoising…", 12, 18, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
