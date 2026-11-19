// Light inside stone: subsurface scattering in a marble panel, as in the walls of
// Bunshaft's Beinecke Library (1963), 32 mm of marble that lets daylight in as a
// warm glow. Light that enters the stone does not travel straight: it is
// scattered by the grains of the crystal again and again, a random walk, until it
// leaves through the front (the soft glow of marble), through the back (the
// light inside the building), or is absorbed. The walk is simulated photon by
// photon, in three dimensions and drawn in section, with the optical properties
// measured for white marble by Jensen, Marschner, Levoy and Hanrahan (2001):
// scattering and absorption per millimetre, for red, green and blue. Blue is
// absorbed most, so what gets through is amber; nothing here is painted.
// Simplifications: isotropic scattering with the measured reduced coefficients,
// a flat panel, light entering head-on, Fresnel reflection at both faces (n = 1.5).

import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, text, FONT_SMALL } from "./shared";

// white marble, per mm, red / green / blue (Jensen et al. 2001, figure 5)
const SCATTER = [2.19, 2.62, 3.0];
const ABSORB = [0.0021, 0.0041, 0.0071];
const ETA = 1.5;
const LUMA = [0.2126, 0.7152, 0.0722];
const CHANNEL_INK = ["rgb(196,64,52)", "rgb(58,150,70)", "rgb(60,96,200)"];

// tallies across the line of light, y in mm
const BINS = 120;

/** Unpolarised Fresnel reflectance for light inside the stone meeting its face at cos(theta). */
function fresnelOut(cosI: number): number {
  const sinT = ETA * Math.sqrt(Math.max(0, 1 - cosI * cosI));
  if (sinT >= 1) return 1;                               // total internal reflection
  const cosT = Math.sqrt(1 - sinT * sinT);
  const rs = (ETA * cosI - cosT) / (ETA * cosI + cosT), rp = (ETA * cosT - cosI) / (ETA * cosT + cosI);
  return (rs * rs + rp * rp) / 2;
}
const R_IN = ((ETA - 1) / (ETA + 1)) ** 2;               // head-on, from the air: 4 % mirrored straight back

let seed = 1234567;
function rnd(): number {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return ((seed >>> 0) + 0.5) / 4294967296;
}

// a marble pattern for the panel view: veins along a turbulent diagonal
function hash(x: number, y: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function veins(n: number, sizeMm: number): Float32Array {
  const v = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i / n) * sizeMm, y = (j / n) * sizeMm;
      let t = 0, amp = 1, f = 1 / 60;
      for (let o = 0; o < 5; o++) { t += amp * noise(x * f, y * f); amp *= 0.5; f *= 2; }
      const s = Math.abs(Math.sin((x * 0.6 + y) / 38 + 5.5 * t));
      v[j * n + i] = Math.pow(1 - s, 6) + 0.25 * Math.pow(1 - Math.abs(Math.sin((x - y * 0.4) / 23 + 3 * t)), 10);
    }
  }
  return v;
}

function blur(src: Float32Array, n: number, r: number): Float32Array {
  if (r < 1) return src;
  let a: Float32Array = src, b: Float32Array = new Float32Array(n * n);
  for (let pass = 0; pass < 3; pass++) {               // three box passes: close to a Gaussian
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let d = -r; d <= r; d++) { const q = Math.min(n - 1, Math.max(0, i + d)); s += a[j * n + q]; c++; }
      b[j * n + i] = s / c;
    }
    [a, b] = [b, a];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let d = -r; d <= r; d++) { const q = Math.min(n - 1, Math.max(0, j + d)); s += a[q * n + i]; c++; }
      b[j * n + i] = s / c;
    }
    [a, b] = [b, a];
  }
  return a;
}

interface Walk { pts: number[]; c: number; through: boolean }

export const translucency: AppFactory = (env) => {
  // tallies, reset whenever the stone changes
  let key = "";
  let launched = [0, 0, 0], mirrored = [0, 0, 0], front = [0, 0, 0], back = [0, 0, 0], steps = 0, done = 0;
  let frontBins = new Float32Array(BINS * 3), backBins = new Float32Array(BINS * 3);
  let walks: Walk[] = [];
  const PANEL = 112, PANEL_MM = 300;
  const veinMap = veins(PANEL, PANEL_MM);
  let panel: HTMLCanvasElement | null = null, lastPanel = 0;

  return {
    title: "Light inside stone",
    height: 640,
    narrowCanvas: 420,
    fn: (lab) => {
      const T = lab.slider("Thickness mm", 2, 120, 32, { step: 1 }).value;
      const sScale = lab.slider("Scattering ×", 0.1, 3, 1, { step: 0.05, group: "Marble" }).value;
      const aScale = lab.slider("Absorption ×", 0, 10, 1, { step: 0.1, group: "Marble" }).value;
      const veinStrength = lab.slider("Veins", 0, 1, 0.5, { step: 0.05, group: "Marble" }).value;
      const showWalks = lab.toggle("Show the walks", true).value;

      const yr = Math.max(14, T * 1.1);                    // half-height of the section, mm
      const k = `${T}|${sScale}|${aScale}`;
      if (k !== key) {
        key = k;
        launched = [0, 0, 0]; mirrored = [0, 0, 0]; front = [0, 0, 0]; back = [0, 0, 0]; steps = 0; done = 0;
        frontBins = new Float32Array(BINS * 3); backBins = new Float32Array(BINS * 3);
        walks = []; lastPanel = 0;
      }

      /** One photon, of one colour, entering head-on at the middle of the panel. */
      const photon = (record: boolean) => {
        const c = done % 3;
        done++; launched[c]++;
        if (rnd() < R_IN) { mirrored[c]++; return; }
        const ss = SCATTER[c] * sScale, sa = ABSORB[c] * aScale;
        let x = 0, y = 0, z = 0, dx = 1, dy = 0, dz = 0, len = 0;
        const pts: number[] = record ? [0, 0] : [];
        const limit = 30 / Math.max(sa, 1e-9);             // past this, less than e^-30 survives
        let n = 0;
        for (; n < 2_000_000; n++) {
          const d = -Math.log(rnd()) / ss;
          let nx = x + dx * d;
          if (nx < 0 || nx > T) {
            // reaches a face: go there, then leave or be reflected back inside
            const wall = nx < 0 ? 0 : T;
            const t = (wall - x) / dx;
            x = wall; y += dy * t; z += dz * t; len += t;
            if (record && pts.length < 24000) pts.push(x, y);
            if (rnd() >= fresnelOut(Math.abs(dx))) {
              const w = Math.exp(-sa * len);
              const bin = Math.floor(((y + yr) / (2 * yr)) * BINS);
              if (wall === 0) { front[c] += w; if (bin >= 0 && bin < BINS) frontBins[bin * 3 + c] += w; }
              else {
                back[c] += w; if (bin >= 0 && bin < BINS) backBins[bin * 3 + c] += w;
              }
              if (record) walks.push({ pts, c, through: wall === T });
              steps += n;
              return;
            }
            dx = -dx;
            continue;
          }
          x = nx; y += dy * d; z += dz * d; len += d;
          if (record && pts.length < 24000) pts.push(x, y);
          if (len > limit) break;                          // absorbed
          // scatter: any direction, equally likely
          const cz = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), sz = Math.sqrt(1 - cz * cz);
          dx = cz; dy = sz * Math.cos(ph); dz = sz * Math.sin(ph);
        }
        steps += n;                                        // absorbed on the way
      };

      lab.animate(() => {});
      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        if (done < 4_000_000) {
          const t0 = performance.now();
          while (performance.now() - t0 < 12) for (let m = 0; m < 32; m++) photon(done % 97 === 0);
          // keep a few walks of each kind: the ones that come back out, and the rarer ones that get through
          const fronts = walks.filter((q) => !q.through).slice(-9), backs = walks.filter((q) => q.through).slice(-5);
          walks = [...fronts, ...backs];
        }

        // ── the numbers ──
        const share = (a: number[]) => [0, 1, 2].reduce((s, c) => s + LUMA[c] * (a[c] / Math.max(1, launched[c])), 0);
        const through = share(back), out = share(front) + share(mirrored), kept = Math.max(0, 1 - through - out);
        const profile = (bins: Float32Array) => {
          let s = 0, s2 = 0, m = 0;
          for (let b = 0; b < BINS; b++) { const v = bins[b * 3] + bins[b * 3 + 1] + bins[b * 3 + 2], y = ((b + 0.5) / BINS) * 2 * yr - yr; s += v; s2 += v * y * y; m = Math.max(m, v); }
          return { sigma: s > 0 ? Math.sqrt(s2 / s) : 0, max: m };
        };
        const fp = profile(frontBins), bp = profile(backBins);
        // colour of the light that gets through, brightest channel at 1
        const tc = [0, 1, 2].map((c) => back[c] / Math.max(1, launched[c]));
        const tmax = Math.max(...tc, 1e-12);
        const tint = tc.map((v) => Math.round(255 * Math.pow(v / tmax, 1 / 2.2)));
        const fc = [0, 1, 2].map((c) => front[c] / Math.max(1, launched[c]));
        const fmax = Math.max(...fc, 1e-12);
        const ftint = fc.map((v) => Math.round(255 * Math.pow(v / fmax, 1 / 2.2)));

        lab.log("Gets through", `${(through * 100).toFixed(through < 0.01 ? 2 : 1)} %`);
        lab.log("Back out", `${(out * 100).toFixed(0)} %`);
        lab.log("Absorbed", `${(kept * 100).toFixed(0)} %`);
        lab.log("A line of light spreads to", bp.sigma > 0 ? `${(2 * bp.sigma).toFixed(0)} mm` : "…");
        lab.log("Scatterings", `${Math.round(steps / Math.max(1, done))} per photon`);

        // ── layout ──
        clear(ctx, w, hh);
        const hgt = hh - BAR;
        const secW = Math.round(w * 0.56) - 18, top = 30, secH = hgt - top - 18;
        const s = Math.min(secW / (2 * T), secH / (2 * yr));
        const cx = 12 + secW / 2 - (T * s) / 2, cy = top + secH / 2;
        const X = (x: number) => cx + x * s, Y = (y: number) => cy - y * s;

        // the stone in section
        ctx.fillStyle = P.grey(0.07);
        ctx.fillRect(X(0), Y(yr), T * s, 2 * yr * s);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(0), Y(yr)); ctx.lineTo(X(0), Y(-yr)); ctx.moveTo(X(T), Y(yr)); ctx.lineTo(X(T), Y(-yr)); ctx.stroke();

        // the line of sunlight arriving from outside
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(12, Y(0)); ctx.lineTo(X(0) - 2, Y(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X(0) - 2, Y(0)); ctx.lineTo(X(0) - 9, Y(0) - 4); ctx.lineTo(X(0) - 9, Y(0) + 4); ctx.closePath(); ctx.fillStyle = P.ink; ctx.fill();

        // the walks
        if (showWalks) {
          ctx.save();                                      // walks that wander far sideways stay inside the drawing
          ctx.beginPath(); ctx.rect(X(0) - 1, Y(yr), T * s + 2, 2 * yr * s); ctx.clip();
          for (const q of walks) {
            ctx.strokeStyle = CHANNEL_INK[q.c]; ctx.globalAlpha = q.through ? 0.9 : 0.55; ctx.lineWidth = q.through ? 1 : 0.8;
            ctx.beginPath();
            for (let i = 0; i < q.pts.length; i += 2) { const px = X(q.pts[i]), py = Y(q.pts[i + 1]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // how much light leaves each face, along its height: drawn outside the face, each to its own scale
        const curve = (bins: Float32Array, max: number, face: number, dir: number, colour: number[]) => {
          if (max <= 0) return;
          const reach = Math.min(cx - 14, 0.45 * T * s, 70);
          const pts: Pt[] = [[X(face), Y(yr)]];
          for (let b = 0; b < BINS; b++) {
            let v = 0;
            for (let q = Math.max(0, b - 1); q <= Math.min(BINS - 1, b + 1); q++) v += bins[q * 3] + bins[q * 3 + 1] + bins[q * 3 + 2];
            v /= 3 * max;                                    // three bins together: the back face collects few photons
            pts.push([X(face) + dir * v * reach, Y(((b + 0.5) / BINS) * 2 * yr - yr)]);
          }
          pts.push([X(face), Y(-yr)]);
          ctx.fillStyle = `rgb(${colour.join(",")})`; ctx.globalAlpha = 0.75;
          ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1; ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8; ctx.stroke();
        };
        curve(frontBins, fp.max, 0, -1, ftint);
        curve(backBins, bp.max, T, 1, tint);

        ctx.fillStyle = P.grey(0.55);
        text(ctx, "outside", 12, 16, "left", "alphabetic", FONT_SMALL);
        text(ctx, "inside", 12 + secW, 16, "right", "alphabetic", FONT_SMALL);
        text(ctx, `${T} mm of marble`, X(T / 2), 16, "center", "alphabetic", FONT_SMALL);

        // ── the panel seen from inside, built from the photons that got through ──
        const px0 = 12 + secW + 18, pw = w - 12 - px0;
        const side = Math.min(pw, hgt - top - 46);
        const py0 = top + 4;
        if (side > 40) {
          const now = performance.now();
          if (!panel || now - lastPanel > 250) {
            lastPanel = now;
            // Clear stone lets through what the simulation measured, colour by colour. A vein is a thin
            // sheet of darker mineral that the light crosses once: it lets through a fixed smaller share.
            // Then the light spreads sideways on its way through, by the width the simulation measured
            // for a line of light, which blurs the veins: sharp in a thin panel, soft in a thick one.
            const VEIN_OPACITY = 3;                          // a full vein lets through e^-3, about 5 %
            const gain = new Float32Array(PANEL * PANEL);
            for (let i = 0; i < PANEL * PANEL; i++) gain[i] = Math.exp(-VEIN_OPACITY * veinStrength * veinMap[i]);
            const r = bp.sigma / (PANEL_MM / PANEL);       // spread, in panel pixels
            const g = blur(gain, PANEL, Math.round(r / 1.7));  // three box passes of this radius ≈ that spread
            // Exposed as an adapting eye would: a brighter panel looks brighter, but not in proportion,
            // so neither a thin panel burns out nor a thick one goes black. The status bar gives the true share.
            const lum = [0, 1, 2].reduce((s, c) => s + LUMA[c] * tc[c], 0);
            const expose = 150 * Math.pow(0.0022 / Math.max(lum, 1e-9), 0.7);
            const rgba = new Uint8ClampedArray(PANEL * PANEL * 4);
            for (let i = 0; i < PANEL * PANEL; i++) {
              for (let c = 0; c < 3; c++) rgba[i * 4 + c] = 255 * (1 - Math.exp(-expose * tc[c] * g[i])) ** (1 / 2.2);
              rgba[i * 4 + 3] = 255;
            }
            if (!panel) { panel = document.createElement("canvas"); panel.width = panel.height = PANEL; }
            panel.getContext("2d")!.putImageData(new ImageData(rgba, PANEL, PANEL), 0, 0);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(panel, px0, py0, side, side);
          ctx.strokeStyle = P.grey(0.35); ctx.lineWidth = 1; ctx.strokeRect(px0, py0, side, side);
          ctx.fillStyle = P.grey(0.55);
          text(ctx, `from inside, ${PANEL_MM} × ${PANEL_MM} mm`, px0, 16, "left", "alphabetic", FONT_SMALL);
          // the colour of the light that gets through, at full strength
          ctx.fillStyle = `rgb(${tint.join(",")})`;
          ctx.fillRect(px0, py0 + side + 10, 26, 14);
          ctx.strokeStyle = P.grey(0.35); ctx.strokeRect(px0, py0 + side + 10, 26, 14);
          ctx.fillStyle = P.grey(0.55);
          text(ctx, "its colour, at full strength", px0 + 34, py0 + side + 21, "left", "alphabetic", FONT_SMALL);
        }
      });
    },
  };
};
