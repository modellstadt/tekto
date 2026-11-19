// A latent space you can walk through. 120 sketched openings (32 × 32 pixels
// each, 1024 numbers) are compressed by principal component analysis to the
// two directions along which they vary most. Every sketch becomes a point on a
// 2D map, and every point of the map can be turned back into an image: drag
// across it and watch arches blend into lintels.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, dot, line, rng, FONT_SMALL } from "./shared";
import { rasterStrokes, sampleStrokes, toVector, SAMPLE_NAMES } from "./teach";

const R = 32, D = R * R, PER_CLASS = 40, K = 2;

interface Model { X: Float32Array[]; cls: number[]; mean: Float64Array; pcs: Float64Array[]; coords: [number, number][]; varShare: number[] }

function build(): Model {
  const r = rng(99);
  const X: Float32Array[] = [], cls: number[] = [];
  for (let c = 0; c < 3; c++) for (let k = 0; k < PER_CLASS; k++) {
    const v = toVector(rasterStrokes(sampleStrokes(c, r), 7 + r() * 4), R);
    if (v) { X.push(v); cls.push(c); }
  }
  const n = X.length;
  const mean = new Float64Array(D);
  for (const x of X) for (let d = 0; d < D; d++) mean[d] += x[d] / n;
  const C = X.map((x) => Float64Array.from(x, (v, d) => v - mean[d]));   // centred data
  let total = 0;
  for (const c of C) for (let d = 0; d < D; d++) total += c[d] * c[d];
  // power iteration with deflation: v <- Xᵀ(X v)
  const pcs: Float64Array[] = [], varShare: number[] = [];
  const pr = rng(7);
  for (let k = 0; k < K; k++) {
    let v = Float64Array.from({ length: D }, () => pr() - 0.5);
    let lambda = 0;
    for (let it = 0; it < 60; it++) {
      const s = C.map((c) => { let a = 0; for (let d = 0; d < D; d++) a += c[d] * v[d]; return a; });
      const nv = new Float64Array(D);
      C.forEach((c, i) => { for (let d = 0; d < D; d++) nv[d] += c[d] * s[i]; });
      for (const p of pcs) { let a = 0; for (let d = 0; d < D; d++) a += nv[d] * p[d]; for (let d = 0; d < D; d++) nv[d] -= a * p[d]; }
      let norm = 0; for (let d = 0; d < D; d++) norm += nv[d] * nv[d];
      norm = Math.sqrt(norm) || 1;
      lambda = norm;
      v = nv.map((x) => x / norm);
    }
    pcs.push(v);
    varShare.push(lambda / total);
  }
  const coords = C.map((c) => pcs.map((p) => { let a = 0; for (let d = 0; d < D; d++) a += c[d] * p[d]; return a; }) as [number, number]);
  return { X, cls, mean, pcs, coords, varShare };
}

function imageCanvas(v: ArrayLike<number>, col: (t: number) => string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = R;
  const g = c.getContext("2d")!;
  for (let i = 0; i < D; i++) { g.fillStyle = col(Math.max(0, Math.min(1, v[i]))); g.fillRect(i % R, Math.floor(i / R), 1, 1); }
  return c;
}

export const latent: AppFactory = (env) => {
  let m: Model | null = null;
  let cursor: [number, number] = [0, 0];
  let dragging = false;
  let walk = -1;             // animation phase of the walk between two sketches
  let walkFrom = 0, walkTo = 1;
  let mapBox = { x: 0, y: 0, s: 1, cx: 0, cy: 0 };
  let recon: HTMLCanvasElement | null = null, reconKey = "";
  let pcImgs: HTMLCanvasElement[] = [], pcKey = "";

  return {
    title: "Latent space: a map of sketches",
    height: 500,
    fn: (lab) => {
      const showSamples = lab.toggle("Show the sketches on the map", false).value;
      lab.button("Walk between two sketches", () => {
        if (!m) return;
        const r = Math.random;
        walkFrom = Math.floor(r() * m.X.length);
        do walkTo = Math.floor(r() * m.X.length); while (m.cls[walkTo] === m.cls[walkFrom]);
        walk = 0;
      });
      lab.once(() => { m = build(); cursor = [...m.coords[0]] as [number, number]; });

      const toLatent = (px: number, py: number): [number, number] => [(px - mapBox.cx) / mapBox.s, -(py - mapBox.cy) / mapBox.s];
      lab.onPointerDown((p) => {
        const [a, b] = toLatent(p.x, p.y);
        if (Math.abs(p.x - mapBox.cx) <= mapBox.x && Math.abs(p.y - mapBox.cy) <= mapBox.y) { dragging = true; walk = -1; cursor = [a, b]; lab.canvas.setPointerCapture(p.id); }
      });
      lab.onPointerMove((p) => { if (dragging) cursor = toLatent(p.x, p.y); });
      lab.onPointerUp(() => { dragging = false; });

      lab.animate((_t, dt) => {
        if (!env.visible || !m) return;
        if (walk >= 0) {
          walk = Math.min(1, walk + dt / 3);
          const a = m.coords[walkFrom], b = m.coords[walkTo];
          cursor = [a[0] + (b[0] - a[0]) * walk, a[1] + (b[1] - a[1]) * walk];
          if (walk >= 1) walk = -1;
        }
        lab.log("Each sketch", `${D} numbers (32 × 32)`);
        lab.log("The map", `2 numbers, keeping ${Math.round((m.varShare[0] + m.varShare[1]) * 100)} % of the variation`);
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible || !m) return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const model = m;
        let ext = 0;
        for (const [a, b] of model.coords) ext = Math.max(ext, Math.abs(a), Math.abs(b));
        ext *= 1.15;
        const narrow = w < 520;
        const ms = narrow ? Math.min(w - 24, h * 0.55) : Math.min(h - 40, w * 0.55);
        const mx = 12, my = narrow ? 24 : (h - ms) / 2 + 6;
        mapBox = { x: ms / 2, y: ms / 2, s: ms / 2 / ext, cx: mx + ms / 2, cy: my + ms / 2 };
        const X = (a: number) => mapBox.cx + a * mapBox.s, Y = (b: number) => mapBox.cy - b * mapBox.s;

        // map
        ctx.strokeStyle = P.grey(0.25); ctx.lineWidth = 1;
        line(ctx, mx, mapBox.cy, mx + ms, mapBox.cy); line(ctx, mapBox.cx, my, mapBox.cx, my + ms);
        ctx.strokeStyle = P.grey(0.4); ctx.strokeRect(mx + 0.5, my + 0.5, ms, ms);
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "component 1 →", mx + ms - 2, mapBox.cy - 5, "right", "alphabetic", FONT_SMALL);
        text(ctx, "component 2 ↑", mapBox.cx + 5, my + 12, "left", "alphabetic", FONT_SMALL);
        const thumbs = showSamples;
        model.coords.forEach(([a, b], i) => {
          const x = X(a), y = Y(b);
          if (thumbs) {
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(imageCanvasCached(i), x - 9, y - 9, 18, 18);
            return;
          }
          ctx.strokeStyle = P.ink; ctx.fillStyle = P.ink; ctx.lineWidth = 1.2;
          const c = model.cls[i];
          if (c === 0) dot(ctx, x, y, 3.2, false);
          else if (c === 1) { ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 3.6, y + 2.6); ctx.lineTo(x - 3.6, y + 2.6); ctx.closePath(); ctx.stroke(); }
          else ctx.strokeRect(x - 3, y - 3, 6, 6);
        });
        {
          const [ca, cb] = cursor;
          ctx.strokeStyle = P.ink; ctx.lineWidth = 1;
          line(ctx, X(ca) - 9, Y(cb), X(ca) + 9, Y(cb)); line(ctx, X(ca), Y(cb) - 9, X(ca), Y(cb) + 9);
          ctx.lineWidth = 2; dot(ctx, X(ca), Y(cb), 5, false);
        }
        // legend
        ctx.fillStyle = P.grey(0.6);
        const ly = my + ms + 14;
        if (!thumbs) text(ctx, `○ ${SAMPLE_NAMES[0]}   △ ${SAMPLE_NAMES[1]}   □ ${SAMPLE_NAMES[2]}`, mx, ly, "left", "alphabetic", FONT_SMALL);

        // reconstruction from the two numbers under the cursor
        const rx = narrow ? mx : mx + ms + 28, ry = narrow ? ly + 12 : my;
        const rs = narrow ? Math.min(h - ry - 20, (w - 36) / 2) : Math.min(w - rx - 16, ms * 0.62);
        const key = `${cursor[0].toFixed(3)},${cursor[1].toFixed(3)}|${P.ink}`;
        if (key !== reconKey || !recon) {
          reconKey = key;
          const v = new Float64Array(D);
          for (let d = 0; d < D; d++) v[d] = model.mean[d] + cursor[0] * model.pcs[0][d] + cursor[1] * model.pcs[1][d];
          recon = imageCanvas(v, (t) => P.grey(t));
        }
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(recon, rx, ry, rs, rs);
        ctx.strokeStyle = P.grey(0.4); ctx.lineWidth = 1; ctx.strokeRect(rx + 0.5, ry + 0.5, rs, rs);
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "image from the 2 numbers under the cross", rx, ry + rs + 14, "left", "alphabetic", FONT_SMALL);

        // the two components themselves
        if (!narrow) {
          const pk = P.ink + P.paper;
          if (pk !== pcKey) {
            pcKey = pk;
            pcImgs = model.pcs.map((pc) => {
              let a = 1e-9; for (let d = 0; d < D; d++) a = Math.max(a, Math.abs(pc[d]));
              return imageCanvas(Array.from(pc, (x) => 0.5 + 0.5 * x / a), (t) => P.grey(t));
            });
          }
          const ps = Math.min(64, (w - rx - 30) / 2);
          const py = ry + rs + 32;
          pcImgs.forEach((im, k) => {
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(im, rx + k * (ps + 14), py, ps, ps);
            ctx.strokeStyle = P.grey(0.4); ctx.strokeRect(rx + k * (ps + 14) + 0.5, py + 0.5, ps, ps);
            ctx.fillStyle = P.grey(0.55);
            text(ctx, `PC ${k + 1} · ${Math.round(model.varShare[k] * 100)} %`, rx + k * (ps + 14), py + ps + 12, "left", "alphabetic", FONT_SMALL);
          });
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "drag the cross across the map", mx, my - 8 < 12 ? 12 : my - 8, "left", "alphabetic", FONT_SMALL);
      });

      const cache = new Map<number, HTMLCanvasElement>();
      let cacheKey = "";
      function imageCanvasCached(i: number): HTMLCanvasElement {
        const k = P.ink + P.paper;
        if (k !== cacheKey) { cache.clear(); cacheKey = k; }
        let c = cache.get(i);
        if (!c) { c = imageCanvas(m!.X[i], (t) => P.grey(t)); cache.set(i, c); }
        return c;
      }
    },
  };
};
