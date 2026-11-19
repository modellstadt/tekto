// Teach the machine (after Google's Teachable Machine). Give a few examples
// per class, drawn on a pad or captured from the camera, and let a model
// classify new input. Two models: a nearest-neighbour classifier, which only
// remembers its examples, and a one-layer perceptron (softmax regression),
// which is trained and turns each class into a 16 × 16 weight image.
// Everything runs in the browser; camera frames never leave the page.

import type { AppFactory } from "./shared";
import { P, BAR, clear, path, text, rng, FONT, FONT_SMALL } from "./shared";

const N = 16;            // input resolution: N × N pixels
const D = N * N;
const PAD_RES = 128;     // drawing raster
const MAX_CLASSES = 4;
const CLASS_OPTS = ["Class 1", "Class 2", "Class 3", "Class 4"] as const;

export type Stroke = [number, number][];              // pad coordinates 0..1
interface Example { x: Float32Array; c: number; thumb?: HTMLCanvasElement; thumbKey?: string }

// ── Input: strokes → 16 × 16 vector ──────────────────────────────────────

export function rasterStrokes(strokes: Stroke[], width: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = PAD_RES;
  const g = c.getContext("2d")!;
  g.lineCap = g.lineJoin = "round";
  g.lineWidth = width;
  g.strokeStyle = "#000";
  for (const s of strokes) {
    if (s.length === 1) { g.beginPath(); g.arc(s[0][0] * PAD_RES, s[0][1] * PAD_RES, width / 2, 0, Math.PI * 2); g.fill(); continue; }
    g.beginPath();
    s.forEach(([x, y], i) => (i ? g.lineTo(x * PAD_RES, y * PAD_RES) : g.moveTo(x * PAD_RES, y * PAD_RES)));
    g.stroke();
  }
  return c;
}

/** Crop the ink to its bounding box, scale it into the middle of an n × n grid, read ink amount 0..1. */
export function toVector(src: HTMLCanvasElement, n = N): Float32Array | null {
  const a = src.getContext("2d")!.getImageData(0, 0, src.width, src.height).data;
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    if (a[(y * src.width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = (n * 0.75) / Math.max(bw, bh);
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  g.imageSmoothingQuality = "high";
  g.drawImage(src, x0, y0, bw, bh, (n - bw * s) / 2, (n - bh * s) / 2, bw * s, bh * s);
  const d = g.getImageData(0, 0, n, n).data;
  const v = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) v[i] = Math.min(1, (d[i * 4 + 3] / 255) * 1.6);
  return v;
}

/** Camera frame → 16 × 16 greyscale, contrast-normalised to 0..1 (dark = 1). */
function frameVector(video: HTMLVideoElement, work: HTMLCanvasElement): Float32Array | null {
  if (video.readyState < 2) return null;
  const g = work.getContext("2d", { willReadFrequently: true })!;
  const side = Math.min(video.videoWidth, video.videoHeight);
  g.drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N).data;
  const v = new Float32Array(D);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < D; i++) {
    const lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    v[i] = 1 - lum / 255;
    lo = Math.min(lo, v[i]); hi = Math.max(hi, v[i]);
  }
  const r = Math.max(hi - lo, 1e-3);
  for (let i = 0; i < D; i++) v[i] = (v[i] - lo) / r;
  // mirror horizontally so the image behaves like a mirror
  for (let y = 0; y < N; y++) for (let x = 0; x < N / 2; x++) {
    const a = y * N + x, b = y * N + (N - 1 - x);
    const t = v[a]; v[a] = v[b]; v[b] = t;
  }
  return v;
}

// ── Sample set: sketches of openings ─────────────────────────────────────

export const SAMPLE_NAMES = ["Round arch", "Pointed arch", "Flat lintel"];

export function sampleStrokes(kind: number, r: () => number): Stroke[] {
  const j = (s: number) => (r() - 0.5) * s;
  const w = 0.28 + r() * 0.22, h = 0.3 + r() * 0.25, cx = 0.5 + j(0.1), base = 0.88 + j(0.06);
  const xl = cx - w / 2, xr = cx + w / 2, spring = base - h;
  const line = (x0: number, y0: number, x1: number, y1: number, n = 6): Stroke =>
    Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n + j(0.012), y0 + ((y1 - y0) * i) / n + j(0.012)] as [number, number]);
  const out: Stroke[] = [];
  if (kind === 2) {
    // lintel: jambs plus a horizontal head that overhangs a little
    const o = 0.02 + r() * 0.05;
    out.push(line(xl, base, xl, spring), line(xr, base, xr, spring), line(xl - o, spring, xr + o, spring + j(0.02)));
    return out;
  }
  const head: [number, number][] = [];
  const steps = 16;
  if (kind === 0) {
    for (let i = 0; i <= steps; i++) {
      const t = Math.PI - (Math.PI * i) / steps;
      head.push([cx + Math.cos(t) * (w / 2) + j(0.01), spring - Math.sin(t) * (w / 2) * (0.85 + r() * 0.2) + j(0.01)]);
    }
  } else {
    // pointed (equilateral-ish) arch: two arcs centred on the opposite jamb
    const rise = w * (0.95 + r() * 0.35);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const side = t < 0.5 ? 0 : 1, u = side ? (t - 0.5) * 2 : t * 2;
      const x = side ? cx + (w / 2) * u : xl + (w / 2) * u;
      const k = side ? 1 - u : u;
      head.push([x + j(0.01), spring - rise * Math.sqrt(Math.max(0, 1 - (1 - k) * (1 - k))) + j(0.01)]);
    }
  }
  out.push([...line(xl, base, xl, spring).slice(0, -1), ...head, ...line(xr, spring, xr, base).slice(1)]);
  return out;
}

// ── Models ───────────────────────────────────────────────────────────────

function nearest(ex: Example[], x: Float32Array, n: number, k = 3): { p: number[]; best: number } {
  const ds = ex.map((e, i) => {
    let s = 0;
    for (let d = 0; d < D; d++) { const t = e.x[d] - x[d]; s += t * t; }
    return { i, s };
  }).sort((a, b) => a.s - b.s);
  const p = new Array(n).fill(0);
  const kk = Math.min(k, ds.length);
  for (let m = 0; m < kk; m++) p[ex[ds[m].i].c] += 1 / kk;
  return { p, best: ds.length ? ds[0].i : -1 };
}

class Perceptron {
  W: Float32Array[] = [];
  b: number[] = [];
  losses: number[] = [];
  constructor(public n: number) { this.reset(n); }
  reset(n: number) {
    this.n = n;
    this.W = Array.from({ length: n }, () => new Float32Array(D));
    this.b = new Array(n).fill(0);
    this.losses = [];
  }
  probs(x: Float32Array): number[] {
    const z = this.W.map((w, c) => { let s = this.b[c]; for (let d = 0; d < D; d++) s += w[d] * x[d]; return s; });
    const m = Math.max(...z), e = z.map((v) => Math.exp(v - m)), t = e.reduce((a, v) => a + v, 0);
    return e.map((v) => v / t);
  }
  epoch(ex: Example[], lr: number, r: () => number) {
    const order = ex.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [order[i], order[k]] = [order[k], order[i]]; }
    let loss = 0;
    for (const i of order) {
      const { x, c } = ex[i];
      const p = this.probs(x);
      loss -= Math.log(Math.max(p[c], 1e-9));
      for (let k = 0; k < this.n; k++) {
        const g = p[k] - (k === c ? 1 : 0);
        const w = this.W[k];
        for (let d = 0; d < D; d++) w[d] -= lr * (g * x[d] + 1e-4 * w[d]);
        this.b[k] -= lr * g;
      }
    }
    this.losses.push(loss / Math.max(1, ex.length));
  }
}

// ── App ──────────────────────────────────────────────────────────────────

export const teach: AppFactory = (env) => {
  let strokes: Stroke[] = [];
  let drawing: Stroke | null = null;
  let input: Float32Array | null = null;
  // drawn and camera examples are kept apart: mixing them would make no sense
  const sets: Record<string, { examples: Example[]; names: string[] }> = {
    Draw: { examples: [], names: [...SAMPLE_NAMES, "Class 4"] },
    Camera: { examples: [], names: [...CLASS_OPTS] },
  };
  let examples: Example[] = sets.Draw.examples;
  let names = sets.Draw.names;
  const net = new Perceptron(3);
  let trainedOn = "";          // fingerprint of the data the perceptron last saw
  let training = 0;            // epochs left to run
  const EPOCHS = 60;
  const trainRng = rng(7);
  let video: HTMLVideoElement | null = null;
  let stream: MediaStream | null = null;
  let camError = "";
  let burst = 0, burstClock = 0;
  const work = document.createElement("canvas");
  work.width = work.height = N;
  let layout: { pad: [number, number, number] } | null = null;

  const fingerprint = (n: number) => `${examples === sets.Draw.examples ? "D" : "C"}|${n}|${examples.length}|${examples.reduce((a, e) => a + e.c * 7 + e.x[40] + e.x[120], 0).toFixed(3)}`;

  function loadSamples() {
    const r = rng(2024);
    examples = [];
    for (let c = 0; c < 3; c++) for (let k = 0; k < 12; k++) {
      const v = toVector(rasterStrokes(sampleStrokes(c, r), 7 + r() * 4));
      if (v) examples.push({ x: v, c });
    }
    names = [...SAMPLE_NAMES, "Class 4"];
    sets.Draw = { examples, names };
    trainedOn = "";
  }
  loadSamples();

  async function startCamera() {
    if (stream || camError) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      video = document.createElement("video");
      video.muted = true; video.playsInline = true;
      video.srcObject = stream;
      await video.play();
    } catch (e) {
      camError = "Camera not available (" + ((e as Error).name || "blocked") + ")";
    }
  }
  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null; video = null; camError = "";
  }

  function thumb(e: Example): HTMLCanvasElement {
    const key = P.ink + P.paper;
    if (e.thumb && e.thumbKey === key) return e.thumb;
    e.thumb = vecCanvas(e.x, (t) => P.grey(t));
    e.thumbKey = key;
    return e.thumb;
  }

  return {
    title: "Teach the machine",
    height: 540,
    fn: (lab) => {
      const source = lab.select("Input", ["Draw", "Camera"] as const, "Draw").value;
      const n = lab.slider("Classes", 2, MAX_CLASSES, 3, { step: 1 }).value;
      const target = lab.select("Examples go to", CLASS_OPTS, "Class 1").value;
      const model = lab.select("Model", ["Nearest neighbour", "Perceptron"] as const, "Nearest neighbour").value;
      const cls = Math.min(CLASS_OPTS.indexOf(target), n - 1);
      examples = sets[source].examples;
      names = sets[source].names;

      const addExample = () => {
        if (!input) return;
        examples.push({ x: input.slice(), c: cls });
        if (source === "Draw") { strokes = []; input = null; }
      };
      if (source === "Draw") {
        lab.button("Add drawing as example", addExample, { group: "Examples" });
        lab.button("Clear pad", () => { strokes = []; input = null; }, { group: "Examples" });
      } else {
        lab.button("Record 10 frames", () => { burst = 10; }, { group: "Examples" });
      }
      lab.button("Remove all examples", () => { sets[source] = { examples: [], names: [...CLASS_OPTS] }; trainedOn = ""; net.reset(n); }, { group: "Examples" });
      if (source === "Draw") lab.button("Load sample set", () => { loadSamples(); net.reset(n); }, { group: "Examples" });
      if (model === "Perceptron") lab.button("Train", () => { net.reset(n); training = EPOCHS; trainedOn = fingerprint(n); }, { group: "Model" });

      if (source === "Camera") void startCamera(); else if (stream) stopCamera();
      lab.once(() => {
        // stop the camera when the app scrolls out of view
        new IntersectionObserver((es) => { if (!es[0].isIntersecting && stream) stopCamera(); }).observe(lab.canvas);
      });

      // drawing on the pad
      lab.onPointerDown((p) => {
        if (source !== "Draw" || !layout) return;
        const [px, py, ps] = layout.pad;
        const u = (p.x - px) / ps, v = (p.y - py) / ps;
        if (u < 0 || v < 0 || u > 1 || v > 1) return;
        drawing = [[u, v]];
        strokes.push(drawing);
        lab.canvas.setPointerCapture(p.id);
      });
      lab.onPointerMove((p) => {
        if (!drawing || !layout) return;
        const [px, py, ps] = layout.pad;
        drawing.push([Math.min(1, Math.max(0, (p.x - px) / ps)), Math.min(1, Math.max(0, (p.y - py) / ps))]);
      });
      lab.onPointerUp(() => {
        if (!drawing) return;
        drawing = null;
        input = toVector(rasterStrokes(strokes, 9));
      });

      lab.animate((t) => {
        if (!env.visible) return;
        const active = examples.filter((e) => e.c < n);
        if (source === "Camera" && video) {
          input = frameVector(video, work);
          if (burst > 0 && t - burstClock > 0.1) { burstClock = t; burst--; addExample(); }
        }
        if (training > 0) {
          if (net.n !== n) net.reset(n);
          for (let k = 0; k < 3 && training > 0; k++, training--) net.epoch(active, 0.15, trainRng);
        }
        const counts = Array.from({ length: n }, (_, c) => active.filter((e) => e.c === c).length);
        lab.log("Examples", counts.join(" · "));
        if (model === "Perceptron") {
          const stale = trainedOn !== fingerprint(n);
          const acc = active.length && !stale ? active.filter((e) => argmax(net.probs(e.x)) === e.c).length / active.length : NaN;
          lab.log("Perceptron", training > 0 ? `training… epoch ${EPOCHS - training}` : stale ? "not trained on these examples: press Train" : `training accuracy ${(acc * 100).toFixed(0)} %`);
        } else {
          lab.log("Nearest neighbour", "no training: compares with every example (k = 3)");
        }
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const active = examples.filter((e) => e.c < n);
        const narrow = w < 520;
        const ps = narrow ? Math.min(w - 32, h * 0.42) : Math.min(h - 96, w * 0.42);
        const px = 16, py = 30;
        layout = { pad: [px, py, ps] };

        // ── pad ──
        ctx.fillStyle = P.grey(0.55);
        text(ctx, source === "Draw" ? "draw here" : camError || (video ? "camera (mirrored)" : "starting camera…"), px, py - 9, "left", "alphabetic", FONT_SMALL);
        ctx.strokeStyle = P.grey(0.35); ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, ps, ps);
        if (source === "Draw") {
          ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(3, ps * 0.055); ctx.lineCap = ctx.lineJoin = "round";
          for (const s of strokes) {
            if (s.length === 1) { ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(px + s[0][0] * ps, py + s[0][1] * ps, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); continue; }
            path(ctx, s.map(([u, v]) => [px + u * ps, py + v * ps])); ctx.stroke();
          }
        } else if (video && video.readyState >= 2) {
          // live greyscale, pixelated: what a 48 × 48 camera would see
          const side = Math.min(video.videoWidth, video.videoHeight);
          const big = document.createElement("canvas"); big.width = big.height = 48;
          const bg = big.getContext("2d", { willReadFrequently: true })!;
          bg.translate(48, 0); bg.scale(-1, 1);
          bg.drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, 48, 48);
          const img = bg.getImageData(0, 0, 48, 48);
          for (let i = 0; i < img.data.length; i += 4) {
            const l = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
            img.data[i] = img.data[i + 1] = img.data[i + 2] = l;
          }
          bg.setTransform(1, 0, 0, 1, 0, 0);
          bg.putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(big, px, py, ps, ps);
          if (burst > 0) { ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(px + ps - 12, py + 12, 5, 0, Math.PI * 2); ctx.fill(); }
        }

        // ── what the machine sees ──
        const iy = narrow ? py + ps + 16 : py + ps + 14, is = 56;
        ctx.lineWidth = 1;
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "what the model sees: 16 × 16", px + is + 10, iy + 12, "left", "alphabetic", FONT_SMALL);
        ctx.strokeStyle = P.grey(0.35); ctx.strokeRect(px + 0.5, iy + 0.5, is, is);
        if (input) { ctx.imageSmoothingEnabled = false; ctx.drawImage(vecCanvas(input, (t) => P.grey(t)), px, iy, is, is); }

        // ── classes: examples, weights, prediction ──
        const pred = input && active.length
          ? model === "Nearest neighbour" ? nearest(active, input, n) : trainedOn === fingerprint(n) && training === 0 ? { p: net.probs(input), best: -1 } : null
          : null;
        const rx = narrow ? 16 : px + ps + 30, ry = narrow ? iy + is + 22 : py;
        const rw = w - rx - 16;
        const rowH = Math.max(52, Math.min(90, ((narrow ? h - ry : h - py) - 10) / n));
        const tile = 22, barW = Math.min(120, rw * 0.3);
        const winner = pred ? argmax(pred.p) : -1;
        for (let c = 0; c < n; c++) {
          const y = ry + c * rowH;
          const own = active.filter((e) => e.c === c);
          ctx.fillStyle = c === cls ? P.ink : P.grey(0.6);
          text(ctx, `${names[c]} · ${own.length}${c === cls ? "  ← examples" : ""}`, rx, y + 11, "left", "alphabetic", c === winner ? FONT : FONT_SMALL);
          // perceptron weights: the class as the network sees it
          let tx = rx;
          if (model === "Perceptron" && trainedOn === fingerprint(n) && net.W[c]) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(weightCanvas(net.W[c]), tx, y + 18, tile * 1.6, tile * 1.6);
            ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.strokeRect(tx + 0.5, y + 18.5, tile * 1.6, tile * 1.6);
            tx += tile * 1.6 + 10;
          }
          const room = Math.max(1, Math.floor((rw - barW - 16 - (tx - rx)) / (tile + 3)));
          const rows = Math.max(1, Math.floor((rowH - 24) / (tile + 3)));
          const cap = room * rows;
          own.slice(-cap).forEach((e, k) => {
            const X = tx + (k % room) * (tile + 3), Y = y + 18 + Math.floor(k / room) * (tile + 3);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(thumb(e), X, Y, tile, tile);
            if (pred && pred.best >= 0 && active[pred.best] === e) { ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(X - 1, Y - 1, tile + 2, tile + 2); }
          });
          // prediction bar
          const bx = rx + rw - barW, by = y + 18;
          ctx.strokeStyle = P.grey(0.4); ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, barW, 12);
          if (pred) {
            ctx.fillStyle = c === winner ? P.ink : P.grey(0.45);
            ctx.fillRect(bx, by, barW * pred.p[c], 13);
            ctx.fillStyle = P.grey(0.6);
            text(ctx, `${Math.round(pred.p[c] * 100)} %`, bx + barW, by + 26, "right", "alphabetic", FONT_SMALL);
          }
          ctx.strokeStyle = P.grey(0.18); ctx.lineWidth = 1;
          if (c < n - 1) { ctx.beginPath(); ctx.moveTo(rx, y + rowH - 4); ctx.lineTo(rx + rw, y + rowH - 4); ctx.stroke(); }
        }

        // loss curve while / after training
        if (model === "Perceptron" && net.losses.length > 1 && !narrow) {
          const lx = px + is + 10, ly = iy + 20, lw = ps - is - 10, lh = 34;
          const m = Math.max(...net.losses);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2;
          path(ctx, net.losses.map((l, i) => [lx + (i / (EPOCHS - 1)) * lw, ly + lh - (l / m) * lh]));
          ctx.stroke();
          ctx.fillStyle = P.grey(0.55);
          text(ctx, "loss", lx, ly + lh + 12, "left", "alphabetic", FONT_SMALL);
        }
      });
    },
  };
};

function argmax(a: number[]): number {
  let b = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i;
  return b;
}

/** A 16 × 16 vector as a tiny canvas (0 → paper, 1 → ink). */
function vecCanvas(v: Float32Array, col: (t: number) => string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  for (let i = 0; i < D; i++) {
    g.fillStyle = col(Math.max(0, Math.min(1, v[i])));
    g.fillRect(i % N, Math.floor(i / N), 1, 1);
  }
  return c;
}

/** Perceptron weights: positive (evidence for the class) dark, negative light, zero mid-grey. */
function weightCanvas(w: Float32Array): HTMLCanvasElement {
  let m = 1e-6;
  for (let i = 0; i < D; i++) m = Math.max(m, Math.abs(w[i]));
  const v = new Float32Array(D);
  for (let i = 0; i < D; i++) v[i] = 0.5 + 0.5 * (w[i] / m);
  return vecCanvas(v, (t) => P.grey(t));
}
