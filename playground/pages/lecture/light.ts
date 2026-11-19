// Light and shadow. A stone façade of one single colour, stored as a relief: for
// every point of the elevation, how far it stands proud of the wall or sinks
// into it. A sun lights it from any direction and at any angle to the wall.
// The stone never changes colour; everything that reads as depth is light:
// surfaces turned towards or away from the sun (shading), and the shadows cast
// by whatever projects (traced from every point towards the sun across the
// relief). An overcast sky lights from everywhere at once and leaves only the
// darkness of deep recesses (ambient occlusion). No light bounces from one
// surface to another: that is what a full rendering adds.

import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, path, hatch, text, dot, FONT_SMALL } from "./shared";

// the façade, in metres: a three-storey palazzo, top of the cornice at H
const W = 20, H = 22;
const BAYS = [2.4, 6.2, 10, 13.8, 17.6];
const STONE: [number, number, number] = [0.8, 0.76, 0.68];     // one colour: a pale limestone, linear RGB

const RES = { "Coarse (25 cm)": 0.25, "Medium (10 cm)": 0.1, "Fine (5 cm)": 0.05 } as const;
type ResName = keyof typeof RES;

interface Relief { r: number; nx: number; ny: number; h: Float32Array; hmax: number }

/** Rasterise the façade at r metres per cell. Row 0 is the top. */
function buildRelief(r: number): Relief {
  const nx = Math.round(W / r), ny = Math.round(H / r);
  const h = new Float32Array(nx * ny);
  const each = (x0: number, y0: number, x1: number, y1: number, f: (x: number, y: number, i: number) => void) => {
    const c0 = Math.max(0, Math.ceil(x0 / r - 0.5)), c1 = Math.min(nx - 1, Math.floor(x1 / r - 0.5));
    const r0 = Math.max(0, Math.ceil((H - y1) / r - 0.5)), r1 = Math.min(ny - 1, Math.floor((H - y0) / r - 0.5));
    for (let row = r0; row <= r1; row++) {
      const y = H - (row + 0.5) * r;
      for (let col = c0; col <= c1; col++) f((col + 0.5) * r, y, row * nx + col);
    }
  };
  const set = (x0: number, y0: number, x1: number, y1: number, v: number) => each(x0, y0, x1, y1, (_x, _y, i) => { h[i] = v; });
  const raise = (x0: number, y0: number, x1: number, y1: number, v: number) => each(x0, y0, x1, y1, (_x, _y, i) => { if (h[i] < v) h[i] = v; });
  // a block standing proud by v, its edges bevelled over b
  const block = (fx: number, fy: number, w: number, hgt: number, v: number, b: number) => {
    const e = Math.min(fx, w - fx, fy, hgt - fy);
    return e <= 0 ? 0 : v * Math.min(1, e / b);
  };

  // ground floor: rusticated blocks, courses of 0.6 m, joints staggered
  each(0, 0, W, 6, (x, y, i) => {
    const k = Math.floor(y / 0.6), off = k % 2 ? 0.75 : 0;
    const fx = (((x + off) % 1.5) + 1.5) % 1.5, fy = y - k * 0.6;
    h[i] = block(fx - 0.04, fy - 0.04, 1.42, 0.52, 0.08, 0.1);
  });
  // portal: an arched opening with a band of voussoirs and a keystone
  each(7.9, 0, 12.1, 5.6, (x, y, i) => {
    const d = Math.hypot(x - 10, y - 3.4);
    const jamb = y < 3.4 && (x < 8.5 || x > 11.5);
    const arch = y >= 3.4 && d <= 2.1 && d >= 1.5;
    if (jamb || arch) h[i] = Math.max(h[i], 0.14);
  });
  raise(9.72, 4.7, 10.28, 5.65, 0.26);
  each(8.5, 0, 11.5, 4.9, (x, y, i) => { if (y < 3.4 || Math.hypot(x - 10, y - 3.4) < 1.5) h[i] = -0.9; });
  // ground floor windows
  for (const c of [2.8, 6.0, 14.0, 17.2]) {
    raise(c - 0.75, 2.4, c + 0.75, 4.08, 0.12);
    raise(c - 0.85, 2.18, c + 0.85, 2.4, 0.2);
    set(c - 0.55, 2.4, c + 0.55, 3.9, -0.4);
  }
  // first string course
  raise(0, 6.0, W, 6.15, 0.18); raise(0, 6.15, W, 6.32, 0.26); raise(0, 6.32, W, 6.4, 0.14);

  // quoins at both corners, long and short blocks in turn
  for (let k = 0; 6.4 + k * 0.55 < 19.4; k++) {
    const y0 = 6.4 + k * 0.55, w = k % 2 ? 0.7 : 1.1;
    each(0, y0, w, y0 + 0.55, (x, y, i) => { h[i] = Math.max(h[i], block(x - 0.0, y - y0 - 0.03, w - 0.03, 0.49, 0.08, 0.08)); });
    each(W - w, y0, W, y0 + 0.55, (x, y, i) => { h[i] = Math.max(h[i], block(x - (W - w) - 0.03, y - y0 - 0.03, w - 0.03, 0.49, 0.08, 0.08)); });
  }

  BAYS.forEach((c, b) => {
    // piano nobile: sill on consoles, aedicule of pilasters, entablature, pediment
    raise(c - 1.2, 6.95, c + 1.2, 7.3, 0.22);
    raise(c - 1.1, 6.5, c - 0.88, 6.95, 0.24); raise(c + 0.88, 6.5, c + 1.1, 6.95, 0.24);
    raise(c - 0.95, 7.3, c - 0.7, 10.45, 0.13); raise(c + 0.7, 7.3, c + 0.95, 10.45, 0.13);
    raise(c - 1.0, 10.45, c - 0.65, 10.6, 0.17); raise(c + 0.65, 10.45, c + 1.0, 10.6, 0.17);
    raise(c - 0.7, 7.3, c + 0.7, 10.35, 0.06);
    raise(c - 1.1, 10.6, c + 1.1, 10.95, 0.2);
    raise(c - 1.22, 10.95, c + 1.22, 11.1, 0.3);
    if (b % 2 === 0) {
      // triangular pediment: a raking cornice round a recessed tympanum
      each(c - 1.22, 11.1, c + 1.22, 12.0, (x, y, i) => {
        const top = 11.97 - (Math.abs(x - c) / 1.22) * 0.87;
        if (y <= top) h[i] = Math.max(h[i], top - y < 0.17 ? 0.3 : 0.1);
      });
    } else {
      // segmental pediment: the same, on an arc
      each(c - 1.22, 11.1, c + 1.22, 11.75, (x, y, i) => {
        const d = Math.hypot(x - c, y - 10.2);
        if (d <= 1.55) h[i] = Math.max(h[i], d > 1.38 ? 0.3 : 0.1);
      });
    }
    set(c - 0.65, 7.3, c + 0.65, 10.3, -0.42);

    // second floor: sill, moulded surround, straight hood
    raise(c - 0.9, 14.1, c + 0.9, 14.3, 0.16);
    raise(c - 0.78, 14.3, c + 0.78, 16.98, 0.1);
    raise(c - 0.82, 16.98, c + 0.82, 17.2, 0.12);
    raise(c - 1.0, 17.2, c + 1.0, 17.42, 0.28);
    set(c - 0.6, 14.3, c + 0.6, 16.8, -0.38);
  });

  // second string course, architrave band under the frieze
  raise(0, 13.2, W, 13.5, 0.16); raise(0, 13.5, W, 13.6, 0.1);
  raise(0, 19.4, W, 19.6, 0.08);
  // the cornice: moulding, dentils, ovolo, modillions under the corona, cyma
  raise(0, 20.2, W, 20.45, 0.12);
  each(0, 20.45, W, 20.75, (x, _y, i) => { h[i] = Math.max(h[i], x % 0.3 < 0.18 ? 0.42 : 0.3); });
  raise(0, 20.75, W, 20.9, 0.5);
  each(0, 20.9, W, 21.4, (x, _y, i) => { const m = x % 0.9; h[i] = Math.max(h[i], m > 0.3 && m < 0.6 ? 0.95 : 0.55); });
  raise(0, 21.4, W, 21.75, 1.1);
  raise(0, 21.75, W, H, 1.2);

  let hmax = 0;
  for (const v of h) hmax = Math.max(hmax, v);
  return { r, nx, ny, h, hmax };
}

/** Sky visibility per cell: how much of the sky in front each point can see. */
function ambientOcclusion(rf: Relief, depth: number): Float32Array {
  const { r, nx, ny, h } = rf;
  const ao = new Float32Array(nx * ny);
  const steps = Math.max(2, Math.ceil(1.2 / r));
  // sixteen directions: with eight, every window surround throws a visible star of rays
  const dirs = Array.from({ length: 16 }, (_, k) => [Math.cos((k * Math.PI) / 8), Math.sin((k * Math.PI) / 8)]);
  for (let row = 0; row < ny; row++) {
    for (let col = 0; col < nx; col++) {
      const i = row * nx + col, z0 = h[i] * depth;
      let occ = 0;
      for (const [dx, dy] of dirs) {
        let best = 0;
        for (let s = 1; s <= steps; s++) {
          const c = Math.round(col + dx * s), rr = Math.round(row + dy * s);
          if (c < 0 || rr < 0 || c >= nx || rr >= ny) break;
          const t = (h[rr * nx + c] * depth - z0) / (s * r * Math.hypot(dx, dy));
          if (t > best) best = t;
        }
        occ += best / Math.sqrt(1 + best * best);      // sine of the horizon angle
      }
      ao[i] = 1 - occ / dirs.length;
    }
  }
  return blur(ao, nx, ny, Math.max(1, Math.round(0.1 / r)));
}

/** Box blur, rows then columns: light from the sky is soft, and so is its absence. */
function blur(a: Float32Array, nx: number, ny: number, k: number): Float32Array {
  const tmp = new Float32Array(a.length), out = new Float32Array(a.length);
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      let s = 0, n = 0;
      for (let d = -k; d <= k; d++) { const c = x + d; if (c >= 0 && c < nx) { s += a[y * nx + c]; n++; } }
      tmp[y * nx + x] = s / n;
    }
  }
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      let s = 0, n = 0;
      for (let d = -k; d <= k; d++) { const q = y + d; if (q >= 0 && q < ny) { s += tmp[q * nx + x]; n++; } }
      out[y * nx + x] = s / n;
    }
  }
  return out;
}

interface Lit { rgba: Uint8ClampedArray<ArrayBuffer>; lit: Uint8Array; occ: Int32Array; occZ: Float32Array; shadowShare: number }

function render(
  rf: Relief, ao: Float32Array, depth: number, u: [number, number, number],
  sun: number, sky: number, castShadows: boolean, shading: boolean,
): Lit {
  const { r, nx, ny, h, hmax } = rf;
  const n = nx * ny;
  const rgba = new Uint8ClampedArray(n * 4);
  const lit = new Uint8Array(n).fill(1);
  const occ = new Int32Array(n).fill(-1);
  const occZ = new Float32Array(n);
  const [ux, uy, uz] = u;
  const uxy = Math.hypot(ux, uy);
  const m = Math.max(Math.abs(ux), Math.abs(uy));
  const traceable = castShadows && uxy > 1e-3 && uz > 0;
  const sx = traceable ? ux / m : 0, sy = traceable ? -uy / m : 0;     // one cell per step; rows run downwards
  const dz = traceable ? (r * Math.hypot(sx, sy) * uz) / uxy : 0;
  const top = hmax * depth;
  const gamma = 1 / 2.2;
  let shadowed = 0;

  for (let row = 0; row < ny; row++) {
    for (let col = 0; col < nx; col++) {
      const i = row * nx + col;
      // surface normal from the slope of the relief
      const l = h[row * nx + Math.max(0, col - 1)], rr = h[row * nx + Math.min(nx - 1, col + 1)];
      const up = h[Math.max(0, row - 1) * nx + col], dn = h[Math.min(ny - 1, row + 1) * nx + col];
      const gx = ((rr - l) * depth) / (2 * r), gy = ((up - dn) * depth) / (2 * r);
      const len = Math.hypot(gx, gy, 1);
      let ndl = shading ? (-gx * ux - gy * uy + uz) / len : uz;
      if (ndl < 0) ndl = 0;

      if (uz <= 0) lit[i] = 0;                         // a sun behind the wall lights nothing
      else if (traceable && ndl > 0) {
        let px = col, py = row, z = h[i] * depth + 1e-4;
        for (;;) {
          px += sx; py += sy; z += dz;
          if (z > top) break;
          const c = Math.round(px), q = Math.round(py);
          if (c < 0 || q < 0 || c >= nx || q >= ny) break;
          if (h[q * nx + c] * depth > z) { lit[i] = 0; occ[i] = q * nx + c; occZ[i] = z; break; }
        }
      }
      if (!lit[i] || ndl === 0) shadowed++;

      // the sky lights a face by how much of it the face can see: fronts and tops more than
      // sides and undersides. This keeps edges crisp on an overcast day, as they are.
      const nz = shading ? 1 / len : 1, nUp = shading ? -gy / len : 0;
      const skyFace = Math.max(0, 0.55 + 0.45 * nz + 0.25 * nUp);
      const e = sky * ao[i] * skyFace + sun * ndl * lit[i];
      rgba[i * 4] = 255 * Math.min(1, STONE[0] * e) ** gamma;
      rgba[i * 4 + 1] = 255 * Math.min(1, STONE[1] * e) ** gamma;
      rgba[i * 4 + 2] = 255 * Math.min(1, STONE[2] * e) ** gamma;
      rgba[i * 4 + 3] = 255;
    }
  }
  return { rgba, lit, occ, occZ, shadowShare: shadowed / n };
}

export const light: AppFactory = (env) => {
  let cut = 10;                                          // section through the central bay
  let view = { s: 1, ox: 0, oy: 0 };
  let drag = false;
  let time = 0;
  // caches: the relief by resolution, the sky by relief and depth, the image by everything
  let relief: Relief | null = null, reliefKey = "";
  let ao: Float32Array | null = null, aoKey = "";
  let image: Lit | null = null, imageKey = "";
  let buffer: HTMLCanvasElement | null = null;

  return {
    title: "Light and shadow",
    height: 640,
    narrowCanvas: 540,                                   // a façade is tall: give it room when the panel sits below
    fn: (lab) => {
      const from = lab.slider("Light from °", -180, 180, -45, { step: 1, group: "Sun" }).value;
      const angle = lab.slider("Angle to the wall °", 2, 90, 35, { step: 1, group: "Sun" }).value;
      const sweep = lab.toggle("Move the sun", false, { group: "Sun" }).value;
      const overcast = lab.slider("Overcast", 0, 1, 0, { step: 0.01, group: "Sky" }).value;
      const depth = lab.slider("Depth of the relief ×", 0, 2, 1, { step: 0.05, group: "Façade" }).value;
      const castShadows = lab.toggle("Cast shadows", true, { group: "Façade" }).value;
      const shading = lab.toggle("Shading", true, { group: "Façade" }).value;
      const showSection = lab.toggle("Section", true, { group: "Façade" }).value;
      const resName = lab.select("Resolution", Object.keys(RES) as ResName[], "Medium (10 cm)", { group: "Façade" }).value as ResName;

      lab.onPointerDown((p) => {
        drag = true; lab.canvas.setPointerCapture(p.id);
        cut = Math.min(W - 0.05, Math.max(0.05, (p.x - view.ox) / view.s));
      });
      lab.onPointerMove((p) => { if (drag) cut = Math.min(W - 0.05, Math.max(0.05, (p.x - view.ox) / view.s)); });
      lab.onPointerUp(() => { drag = false; });
      lab.animate((t) => { time = t; });

      const sunNow = () => (sweep ? 75 * Math.sin(time * 0.35) : from);
      const beta = (angle * Math.PI) / 180;
      const cot = angle >= 89.5 ? 0 : Math.cos(beta) / Math.sin(beta);
      lab.log("1 m of relief casts", angle >= 89.5 ? "no shadow" : `${cot.toFixed(2)} m of shadow`);

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        const hgt = hh - BAR;
        const r = RES[resName];
        if (reliefKey !== resName) { relief = buildRelief(r); reliefKey = resName; aoKey = ""; }
        const rf = relief!;
        const ak = `${resName}|${depth}`;
        if (aoKey !== ak) { ao = ambientOcclusion(rf, depth); aoKey = ak; imageKey = ""; }

        const dir = (sunNow() * Math.PI) / 180;
        const u: [number, number, number] = [Math.cos(beta) * Math.sin(dir), Math.cos(beta) * Math.cos(dir), Math.sin(beta)];
        const sun = 1 - overcast, sky = 0.16 + 0.72 * overcast;
        const ik = `${ak}|${u.map((v) => v.toFixed(4)).join(",")}|${sun}|${castShadows}|${shading}`;
        if (imageKey !== ik) {
          image = render(rf, ao!, depth, u, sun, sky, castShadows, shading);
          imageKey = ik;
          if (!buffer || buffer.width !== rf.nx || buffer.height !== rf.ny) {
            buffer = document.createElement("canvas");
            buffer.width = rf.nx; buffer.height = rf.ny;
          }
          buffer.getContext("2d")!.putImageData(new ImageData(image.rgba, rf.nx, rf.ny), 0, 0);
        }
        const im = image!;

        // ── elevation ──
        const wide = showSection && w >= 560;
        const boxW = (wide ? w * 0.66 : w) - 24, boxH = hgt - 40;
        const s = Math.min(boxW / W, boxH / H);
        const ox = 12 + (boxW - W * s) / 2, top = 28 + (boxH - H * s) / 2;
        view = { s, ox, oy: top + H * s };
        const X = (x: number) => ox + x * s, Y = (y: number) => top + (H - y) * s;
        ctx.imageSmoothingEnabled = r <= 0.1;
        ctx.drawImage(buffer!, X(0), Y(H), W * s, H * s);
        ctx.imageSmoothingEnabled = true;

        // the section line, draggable
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(X(cut), Y(H) - 6); ctx.lineTo(X(cut), Y(0) + 6); ctx.stroke(); ctx.setLineDash([]);

        // where the light comes from: an arrow on the wall plane, shorter the more head-on it is.
        // In the margin beside the façade if there is one, else in the empty lower right of the
        // section (a ground floor projects little), else over the façade's lower corner.
        const R = 20;
        const margin = ox - 12 >= 2 * R + 16;
        const ax = margin ? ox - R - 10 : wide ? w - 12 - R - 6 : X(W) - R - 8;
        const ay = margin ? top + R + 6 : Y(0) - R - (wide ? 18 : 8);
        const L = R * Math.cos(beta);
        ctx.strokeStyle = P.ink; ctx.fillStyle = P.ink; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ax, ay, R, 0, Math.PI * 2); ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.moveTo(ax + Math.sin(dir) * L, ay - Math.cos(dir) * L); ctx.lineTo(ax, ay); ctx.stroke();
        dot(ctx, ax + Math.sin(dir) * L, ay - Math.cos(dir) * L, 4);
        if (margin || wide) text(ctx, "light", ax, ay + R + 12, "center", "alphabetic", FONT_SMALL);

        ctx.fillStyle = P.grey(0.55);
        text(ctx, "elevation · drag to move the section", 12, 16, "left", "alphabetic", FONT_SMALL);

        // ── section through the relief, with the rays that make the shadows ──
        if (wide) {
          const { nx, ny, h } = rf;
          const col = Math.min(nx - 1, Math.max(0, Math.round(cut / r - 0.5)));
          const zmin = -1.0, zmax = Math.max(0.2, rf.hmax * depth);
          const sx0 = X(W) + 34, sw = w - 12 - sx0;
          const E = Math.min(2, sw / ((zmax - zmin) * s));
          const Z = (z: number) => sx0 + (z - zmin) * s * E;
          const face: Pt[] = [];
          for (let row = 0; row < ny; row++) face.push([Z(h[row * nx + col] * depth), Y(H - (row + 0.5) * r)]);
          const solid: Pt[] = [[Z(zmin), Y(H)], ...face, [Z(zmin), Y(0)]];
          ctx.fillStyle = P.paper; path(ctx, solid, true); ctx.fill();
          ctx.strokeStyle = P.ink; hatch(ctx, solid, 5, Math.PI / 4, 0.6);
          ctx.lineWidth = 1; path(ctx, solid, true); ctx.stroke();

          // the face: thick where the sun reaches it, thin and dashed in shadow
          for (let row = 0; row < ny; row++) {
            const i = row * nx + col;
            const a = face[row], b: Pt = [a[0], a[1] + r * s];
            const sunlit = im.lit[i] || sun <= 0.01;           // under a full overcast, the face is drawn plain
            ctx.lineWidth = sunlit ? 2.4 : 1;
            ctx.setLineDash(sunlit ? [] : [2, 2]);
            ctx.beginPath(); ctx.moveTo(a[0], a[1] - (r * s) / 2); ctx.lineTo(b[0], b[1] - (r * s) / 2); ctx.stroke();
          }
          ctx.setLineDash([]);

          // a ray for each edge of a shadow: from the point it grazes to where the shadow ends
          ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.fillStyle = P.ink;
          let rays = sun > 0.01 ? 0 : Infinity;               // no sun, no rays
          for (let row = 1; row < ny && rays < 10; row++) {
            const i = row * nx + col, above = (row - 1) * nx + col;
            const edge = im.lit[i] !== im.lit[above];
            const k = edge ? (im.lit[i] ? above : i) : -1;
            if (k < 0 || im.occ[k] < 0) continue;
            const kr = Math.floor(k / nx), or = Math.floor(im.occ[k] / nx);
            const from: Pt = [Z(h[k] * depth), Y(H - (kr + 0.5) * r)];
            const to: Pt = [Z(im.occZ[k]), Y(H - (or + 0.5) * r)];
            ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...to); ctx.stroke();
            dot(ctx, to[0], to[1], 2);
            rays++;
          }
          ctx.setLineDash([]);
          ctx.fillStyle = P.grey(0.55);
          text(ctx, `section at ${cut.toFixed(1)} m${E < 1.99 ? "" : ", depth ×2"}`, sx0, 16, "left", "alphabetic", FONT_SMALL);
        }

        lab.log("Light from", `${Math.round(sunNow())}°, ${angle}° to the wall`);
        lab.log("In shadow", sun > 0.01 ? `${Math.round(im.shadowShare * 100)} % of the façade` : "none: no sun, only sky");
      });
    },
  };
};
