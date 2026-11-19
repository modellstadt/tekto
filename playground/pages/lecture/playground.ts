// Neural network playground (after Smilkov and Carter's TensorFlow
// Playground). Points in a square plan belong to one of two classes. A small
// network with one hidden layer (tanh) learns to separate them by gradient
// descent; the grey field is its answer for every position, the line where
// it is undecided. With no hidden neurons it is a perceptron and can only
// draw a straight line.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, dot, rng, FONT_SMALL } from "./shared";

interface Pt { x: number; y: number; c: 0 | 1 }

const DATASETS = ["Two groups", "Courtyard", "Spiral", "Checkerboard", "Draw your own"] as const;

function makeData(kind: string, seed: number): Pt[] {
  const r = rng(seed), g = () => (r() + r() + r() - 1.5) * 0.5;
  const out: Pt[] = [];
  const n = 160;
  for (let i = 0; i < n; i++) {
    const c = (i % 2) as 0 | 1;
    if (kind === "Two groups") out.push({ x: (c ? 0.45 : -0.45) + g() * 0.6, y: (c ? 0.35 : -0.35) + g() * 0.6, c });
    else if (kind === "Courtyard") {
      // inside the courtyard vs the ring of buildings around it
      const a = r() * Math.PI * 2, rad = c ? r() * 0.38 : 0.6 + r() * 0.3;
      out.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, c });
    } else if (kind === "Spiral") {
      const t = (i / n) * 3.2 + 0.2, a = t * 2.1 + (c ? Math.PI : 0);
      out.push({ x: Math.cos(a) * t * 0.27 + g() * 0.05, y: Math.sin(a) * t * 0.27 + g() * 0.05, c });
    } else if (kind === "Checkerboard") {
      const x = r() * 1.8 - 0.9, y = r() * 1.8 - 0.9;
      out.push({ x, y, c: ((x > 0) !== (y > 0) ? 1 : 0) });
    }
  }
  return out;
}

class MLP {
  W1: Float64Array; b1: Float64Array; W2: Float64Array; b2 = 0;
  m: Float64Array[];     // momentum buffers
  constructor(public h: number, seed: number) {
    const r = rng(seed);
    this.W1 = Float64Array.from({ length: h * 2 }, () => (r() - 0.5) * 2);
    this.b1 = Float64Array.from({ length: h }, () => (r() - 0.5));
    this.W2 = Float64Array.from({ length: Math.max(h, 2) }, () => (r() - 0.5) * 2);
    this.m = [new Float64Array(h * 2), new Float64Array(h), new Float64Array(Math.max(h, 2)), new Float64Array(1)];
  }
  /** Probability of class 1. With h = 0 the input feeds the output directly (a perceptron). */
  forward(x: number, y: number, hid?: Float64Array): number {
    let z = this.b2;
    if (this.h === 0) z += this.W2[0] * x + this.W2[1] * y;
    for (let j = 0; j < this.h; j++) {
      const a = Math.tanh(this.W1[j * 2] * x + this.W1[j * 2 + 1] * y + this.b1[j]);
      if (hid) hid[j] = a;
      z += this.W2[j] * a;
    }
    return 1 / (1 + Math.exp(-z));
  }
  /** One full-batch gradient step (cross-entropy loss, momentum). Returns the loss. */
  step(data: Pt[], lr: number): number {
    const h = this.h, gW1 = new Float64Array(h * 2), gb1 = new Float64Array(h), gW2 = new Float64Array(this.W2.length);
    let gb2 = 0, loss = 0;
    const hid = new Float64Array(h);
    for (const p of data) {
      const o = this.forward(p.x, p.y, hid);
      loss -= p.c ? Math.log(Math.max(o, 1e-9)) : Math.log(Math.max(1 - o, 1e-9));
      const d = o - p.c;
      gb2 += d;
      if (h === 0) { gW2[0] += d * p.x; gW2[1] += d * p.y; }
      for (let j = 0; j < h; j++) {
        gW2[j] += d * hid[j];
        const dh = d * this.W2[j] * (1 - hid[j] * hid[j]);
        gW1[j * 2] += dh * p.x; gW1[j * 2 + 1] += dh * p.y; gb1[j] += dh;
      }
    }
    const n = Math.max(1, data.length), mu = 0.9;
    const upd = (w: Float64Array, g: Float64Array, m: Float64Array) => {
      for (let i = 0; i < w.length; i++) { m[i] = mu * m[i] - lr * (g[i] / n); w[i] += m[i]; }
    };
    upd(this.W1, gW1, this.m[0]); upd(this.b1, gb1, this.m[1]); upd(this.W2, gW2, this.m[2]);
    this.m[3][0] = mu * this.m[3][0] - lr * (gb2 / n); this.b2 += this.m[3][0];
    return loss / n;
  }
}

export const playground: AppFactory = (env) => {
  let data: Pt[] = [];
  let dataKey = "";
  let net = new MLP(4, 1);
  let netKey = "";
  let epoch = 0, loss = NaN;
  let seed = 1;
  let area = { x: 0, y: 0, s: 1 };
  const own: Pt[] = [];

  return {
    title: "Neural network playground",
    height: 500,
    fn: (lab) => {
      const kind = lab.select("Data", DATASETS as unknown as readonly string[], "Courtyard").value;
      const hidden = lab.slider("Hidden neurons", 0, 16, 4, { step: 1, group: "Network" }).value;
      const lr = lab.slider("Learning rate", 0.01, 1, 0.3, { step: 0.01, group: "Network" }).value;
      const train = lab.toggle("Train", true, { group: "Network" }).value;
      const showNeurons = lab.toggle("Show hidden neurons", false, { group: "Display" }).value;
      const addClass = kind === "Draw your own" ? lab.select("Click adds", ["● filled", "○ open"] as const, "● filled", { group: "Data" }).value : "● filled";
      lab.button("New starting weights", () => { seed++; netKey = ""; });
      if (kind === "Draw your own") lab.button("Clear points", () => { own.length = 0; epoch = 0; });

      const dk = kind;
      if (dk !== dataKey) { dataKey = dk; data = kind === "Draw your own" ? own : makeData(kind, 3); netKey = ""; }
      const nk = `${hidden}|${seed}|${dataKey}`;
      if (nk !== netKey) { netKey = nk; net = new MLP(hidden, seed); epoch = 0; loss = NaN; }

      lab.onPointerDown((p) => {
        if (kind !== "Draw your own") return;
        const x = (p.x - area.x) / area.s * 2 - 1, y = 1 - (p.y - area.y) / area.s * 2;
        if (Math.abs(x) <= 1 && Math.abs(y) <= 1) own.push({ x, y, c: addClass.startsWith("●") ? 1 : 0 });
      });

      lab.animate(() => {
        if (!env.visible) return;
        if (train && data.length) for (let k = 0; k < 5; k++) { loss = net.step(data, lr); epoch++; }
        const acc = data.length ? data.filter((p) => (net.forward(p.x, p.y) > 0.5 ? 1 : 0) === p.c).length / data.length : NaN;
        lab.log("Epoch", epoch);
        lab.log("Loss", Number.isFinite(loss) ? loss.toFixed(3) : "–");
        lab.log("Correct", Number.isFinite(acc) ? `${Math.round(acc * 100)} %` : "–");
        lab.log("Weights", hidden === 0 ? "3 (a perceptron)" : `${hidden * 4 + 1}`);
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const neurons = showNeurons && hidden > 0;
        const side = Math.min(neurons ? w * 0.62 : w - 24, h - 24);
        area = { x: neurons ? 12 : (w - side) / 2, y: (h - side) / 2, s: side };
        const G = 48, cell = side / G;
        // decision field: grey = probability of the filled class
        for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
          const x = ((i + 0.5) / G) * 2 - 1, y = 1 - ((j + 0.5) / G) * 2;
          const o = net.forward(x, y);
          ctx.fillStyle = P.grey(0.04 + 0.34 * o);
          ctx.fillRect(area.x + i * cell, area.y + j * cell, cell + 0.6, cell + 0.6);
        }
        // the boundary (p = 0.5) by marching over the grid
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6;
        ctx.beginPath();
        const f = (i: number, j: number) => net.forward((i / G) * 2 - 1, 1 - (j / G) * 2) - 0.5;
        for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
          const a = f(i, j), b = f(i + 1, j), c = f(i + 1, j + 1), d = f(i, j + 1);
          const pts: [number, number][] = [];
          const edge = (v0: number, v1: number, x0: number, y0: number, x1: number, y1: number) => {
            if ((v0 > 0) !== (v1 > 0)) { const t = v0 / (v0 - v1); pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); }
          };
          edge(a, b, i, j, i + 1, j); edge(b, c, i + 1, j, i + 1, j + 1); edge(c, d, i + 1, j + 1, i, j + 1); edge(d, a, i, j + 1, i, j);
          for (let k = 0; k + 1 < pts.length; k += 2) {
            ctx.moveTo(area.x + pts[k][0] * cell, area.y + pts[k][1] * cell);
            ctx.lineTo(area.x + pts[k + 1][0] * cell, area.y + pts[k + 1][1] * cell);
          }
        }
        ctx.stroke();
        ctx.strokeStyle = P.grey(0.4); ctx.lineWidth = 1;
        ctx.strokeRect(area.x + 0.5, area.y + 0.5, side, side);
        // points
        for (const p of data) {
          const X = area.x + ((p.x + 1) / 2) * side, Y = area.y + ((1 - p.y) / 2) * side;
          ctx.fillStyle = p.c ? P.ink : P.paper; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2;
          dot(ctx, X, Y, 3.2); dot(ctx, X, Y, 3.2, false);
        }
        // hidden neurons: each one is a straight line (a tanh ramp) across the plan
        if (neurons) {
          const cols = Math.ceil(Math.sqrt(hidden)), ts = Math.min((w - side - 40) / cols - 6, 64);
          const x0 = area.x + side + 24;
          const hid = new Float64Array(hidden);
          for (let k = 0; k < hidden; k++) {
            const X = x0 + (k % cols) * (ts + 6), Y = area.y + Math.floor(k / cols) * (ts + 6);
            const g = 12, cs = ts / g;
            for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
              net.forward(((i + 0.5) / g) * 2 - 1, 1 - ((j + 0.5) / g) * 2, hid);
              ctx.fillStyle = P.grey(0.5 + 0.45 * hid[k]);
              ctx.fillRect(X + i * cs, Y + j * cs, cs + 0.5, cs + 0.5);
            }
            ctx.strokeStyle = P.grey(0.4); ctx.strokeRect(X + 0.5, Y + 0.5, ts, ts);
          }
          ctx.fillStyle = P.grey(0.55);
          text(ctx, "hidden neurons", x0, area.y - 6, "left", "alphabetic", FONT_SMALL);
        }
        if (kind === "Draw your own" && !data.length) {
          ctx.fillStyle = P.grey(0.6);
          text(ctx, "click to add points of both classes", area.x + side / 2, area.y + side / 2, "center", "middle", FONT_SMALL);
        }
      });
    },
  };
};
