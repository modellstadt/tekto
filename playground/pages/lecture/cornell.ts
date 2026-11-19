// The Cornell box, path traced. A room of a single size: white floor, ceiling
// and back wall, a red wall on the left, a green one on the right, a lamp in the
// ceiling and two white blocks. Every pixel is the average of many random paths
// of light: from the camera into the room, bouncing from surface to surface, and
// at every bounce asking how much light reaches that point straight from the
// lamp (Kajiya's rendering equation, solved by sampling). One path is a wild
// guess; the average of hundreds converges. With no bounces you see only direct
// light, as in the façade app; with more, light reflected from the walls fills
// the shadows and the red wall reddens the white block beside it.
// Deliberately small (up to 192 × 192 pixels) and on the CPU, so the source
// stays readable and the noise stays visible while it settles.

import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, text, dot, FONT_SMALL } from "./shared";

// ── The room: a unit box, open towards the camera (z = 0), back wall at z = 1 ──
const WHITE = 0, RED = 1, GREEN = 2, LAMP = 3;
const ALBEDO: [number, number, number][] = [
  [0.725, 0.71, 0.68],     // white
  [0.63, 0.065, 0.05],     // red
  [0.14, 0.45, 0.091],     // green
];
const LAMP_COLOUR: [number, number, number] = [1.0, 0.86, 0.68];
const POWER = 3.6;         // the lamp's power stays the same whatever its size
const LAMP_Y = 0.9995;

interface Block { cx: number; cy: number; cz: number; hx: number; hy: number; hz: number; c: number; s: number }
const block = (cx: number, cz: number, hx: number, hy: number, hz: number, deg: number): Block => {
  const a = (deg * Math.PI) / 180;
  return { cx, cy: hy, cz, hx, hy, hz, c: Math.cos(a), s: Math.sin(a) };
};
const BLOCKS = [block(0.335, 0.63, 0.15, 0.3, 0.15, 17.5), block(0.67, 0.36, 0.15, 0.15, 0.15, -17)];

// camera: in front of the opening, looking in
const EYE: [number, number, number] = [0.5, 0.5, -1.4];
const TAN = 0.362;                 // the opening just fills the image

// ── Ray casting. The nearest hit is left in these variables, to keep the inner loop free of objects. ──
let hT = 0, hNx = 0, hNy = 0, hNz = 0, hMat = -1;
let lampHalf = 0.12;
let colouredWalls = true;

function intersect(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): boolean {
  const EPS = 1e-5;
  let best = Infinity, nx = 0, ny = 0, nz = 0, mat = -1;
  let t: number, x: number, y: number, z: number;
  // floor
  if (dy < 0) {
    t = -oy / dy;
    if (t > EPS && t < best) { x = ox + dx * t; z = oz + dz * t; if (x >= 0 && x <= 1 && z >= 0 && z <= 1) { best = t; nx = 0; ny = 1; nz = 0; mat = WHITE; } }
  }
  // lamp, just under the ceiling, then the ceiling itself
  if (dy > 0) {
    t = (LAMP_Y - oy) / dy;
    if (t > EPS && t < best) { x = ox + dx * t; z = oz + dz * t; if (Math.abs(x - 0.5) <= lampHalf && Math.abs(z - 0.5) <= lampHalf) { best = t; nx = 0; ny = -1; nz = 0; mat = LAMP; } }
    t = (1 - oy) / dy;
    if (t > EPS && t < best) { x = ox + dx * t; z = oz + dz * t; if (x >= 0 && x <= 1 && z >= 0 && z <= 1) { best = t; nx = 0; ny = -1; nz = 0; mat = WHITE; } }
  }
  // left (red) and right (green) walls
  if (dx < 0) {
    t = -ox / dx;
    if (t > EPS && t < best) { y = oy + dy * t; z = oz + dz * t; if (y >= 0 && y <= 1 && z >= 0 && z <= 1) { best = t; nx = 1; ny = 0; nz = 0; mat = colouredWalls ? RED : WHITE; } }
  } else if (dx > 0) {
    t = (1 - ox) / dx;
    if (t > EPS && t < best) { y = oy + dy * t; z = oz + dz * t; if (y >= 0 && y <= 1 && z >= 0 && z <= 1) { best = t; nx = -1; ny = 0; nz = 0; mat = colouredWalls ? GREEN : WHITE; } }
  }
  // back wall
  if (dz > 0) {
    t = (1 - oz) / dz;
    if (t > EPS && t < best) { x = ox + dx * t; y = oy + dy * t; if (x >= 0 && x <= 1 && y >= 0 && y <= 1) { best = t; nx = 0; ny = 0; nz = -1; mat = WHITE; } }
  }
  // the two blocks, each turned about the vertical: slab test in the block's own frame
  for (const b of BLOCKS) {
    const rx = ox - b.cx, ry = oy - b.cy, rz = oz - b.cz;
    const lo = [b.c * rx - b.s * rz, ry, b.s * rx + b.c * rz];
    const ld = [b.c * dx - b.s * dz, dy, b.s * dx + b.c * dz];
    const hh = [b.hx, b.hy, b.hz];
    let tmin = -Infinity, tmax = Infinity, axis = -1, sign = 0, miss = false;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(ld[a]) < 1e-12) { if (Math.abs(lo[a]) > hh[a]) { miss = true; break; } continue; }
      let t1 = (-hh[a] - lo[a]) / ld[a], t2 = (hh[a] - lo[a]) / ld[a];
      if (t1 > t2) { const q = t1; t1 = t2; t2 = q; }
      if (t1 > tmin) { tmin = t1; axis = a; sign = ld[a] > 0 ? -1 : 1; }
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) { miss = true; break; }
    }
    if (!miss && tmin > EPS && tmin < best) {
      const ln = [0, 0, 0]; ln[axis] = sign;
      best = tmin; nx = b.c * ln[0] + b.s * ln[2]; ny = ln[1]; nz = -b.s * ln[0] + b.c * ln[2]; mat = WHITE;
    }
  }
  if (mat < 0) return false;
  hT = best; hNx = nx; hNy = ny; hNz = nz; hMat = mat;
  return true;
}

// a small, fast random number generator (xorshift)
let seed = 2463534242;
function rnd(): number {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
}

/** What one path, through one point of a pixel, brings back. Optionally records where it went. */
interface PathRecord { verts: [number, number, number][]; lamps: { from: [number, number, number]; to: [number, number, number]; seen: boolean }[]; escape?: [number, number, number] }
const out: [number, number, number] = [0, 0, 0];
function trace(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, bounces: number, rec: PathRecord | null): void {
  let r = 0, g = 0, bl = 0, tr = 1, tg = 1, tb = 1;
  const area = 4 * lampHalf * lampHalf;
  const Le = POWER / (Math.PI * area);              // radiance: a smaller lamp is brighter, its power the same
  for (let depth = 0; ; depth++) {
    if (!intersect(ox, oy, oz, dx, dy, dz)) {
      if (rec) rec.escape = [ox + dx * 0.25, oy + dy * 0.25, oz + dz * 0.25];   // left through the opening
      break;
    }
    const px = ox + dx * hT, py = oy + dy * hT, pz = oz + dz * hT;
    if (rec) rec.verts.push([px, py, pz]);
    if (hMat === LAMP) {
      // the lamp seen directly; reached by a bounce, it is already counted below
      if (depth === 0) { r += Le * LAMP_COLOUR[0]; g += Le * LAMP_COLOUR[1]; bl += Le * LAMP_COLOUR[2]; }
      break;
    }
    const nx = hNx, ny = hNy, nz = hNz, alb = ALBEDO[hMat];

    // direct light: one random point on the lamp, and is it visible from here?
    const lx = 0.5 + (rnd() * 2 - 1) * lampHalf, lz = 0.5 + (rnd() * 2 - 1) * lampHalf;
    let wx = lx - px, wy = LAMP_Y - py, wz = lz - pz;
    const d2 = wx * wx + wy * wy + wz * wz, d = Math.sqrt(d2);
    wx /= d; wy /= d; wz /= d;
    const cosS = nx * wx + ny * wy + nz * wz, cosL = wy;     // the lamp faces down
    let seen = false;
    if (cosS > 0 && cosL > 0) {
      const sx = px + nx * 1e-4, sy = py + ny * 1e-4, sz = pz + nz * 1e-4;
      seen = intersect(sx, sy, sz, wx, wy, wz) && (hMat === LAMP || hT >= d - 1e-3);
      if (seen) {
        const k = (Le * cosS * cosL * area) / (d2 * Math.PI);
        r += tr * alb[0] * LAMP_COLOUR[0] * k; g += tg * alb[1] * LAMP_COLOUR[1] * k; bl += tb * alb[2] * LAMP_COLOUR[2] * k;
      }
    }
    if (rec) rec.lamps.push({ from: [px, py, pz], to: [lx, LAMP_Y, lz], seen });
    if (depth >= bounces) break;

    // bounce: a new direction, more often near the normal than at a grazing angle (a matte surface)
    tr *= alb[0]; tg *= alb[1]; tb *= alb[2];
    const u1 = rnd() * 2 * Math.PI, u2 = rnd(), s2 = Math.sqrt(u2);
    const ax = Math.abs(nx) > 0.5 ? 0 : 1, ay = Math.abs(nx) > 0.5 ? 1 : 0;   // any vector not along n
    let tx = ay * nz - 0 * ny, ty = 0 * nx - ax * nz, tz = ax * ny - ay * nx;
    const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
    const a = Math.cos(u1) * s2, b = Math.sin(u1) * s2, c = Math.sqrt(1 - u2);
    dx = tx * a + bx * b + nx * c; dy = ty * a + by * b + ny * c; dz = tz * a + bz * b + nz * c;
    ox = px + nx * 1e-4; oy = py + ny * 1e-4; oz = pz + nz * 1e-4;
  }
  out[0] = r; out[1] = g; out[2] = bl;
}

function cameraRay(n: number, px: number, py: number): [number, number, number] {
  const u = ((px / n) * 2 - 1) * TAN, v = (1 - (py / n) * 2) * TAN;
  const l = Math.hypot(u, v, 1);
  return [u / l, v / l, 1 / l];
}

/** Project a point of the room into the same view, as a fraction of the image (0..1). */
function project(p: [number, number, number]): Pt {
  const k = 1 / (p[2] - EYE[2]);
  return [((p[0] - EYE[0]) * k / TAN + 1) / 2, (1 - (p[1] - EYE[1]) * k / TAN) / 2];
}

const RESOLUTIONS = ["64 × 64", "96 × 96", "128 × 128", "192 × 192"] as const;
const MAX_SPP = 4096;

export const cornell: AppFactory = (env) => {
  let n = 0, sums = new Float32Array(0), cursor = 0, passes = 0, key = "";
  let pixels: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(0);
  let buffer: HTMLCanvasElement | null = null;
  let traceMs = 0, rays = 0;
  let pick: [number, number] = [0.27, 0.55];          // a pixel on the tall block, beside the red wall
  let paths: PathRecord[] = [];
  let view = { x: 0, y: 0, s: 1 };

  const newPaths = (bounces: number) => {
    paths = [];
    const px = Math.floor(pick[0] * n), py = Math.floor(pick[1] * n);
    for (let k = 0; k < 12; k++) {
      const d = cameraRay(n, px + rnd(), py + rnd());
      const rec: PathRecord = { verts: [], lamps: [] };
      trace(EYE[0], EYE[1], EYE[2], d[0], d[1], d[2], bounces, rec);
      paths.push(rec);
    }
  };

  return {
    title: "Light that bounces: the Cornell box",
    height: 600,
    narrowCanvas: 380,
    fn: (lab) => {
      const bounces = lab.slider("Bounces", 0, 8, 4, { step: 1 }).value;
      const coloured = lab.toggle("Coloured walls", true).value;
      const lamp = lab.slider("Lamp size", 0.04, 0.8, 0.24, { step: 0.01 }).value;
      const res = lab.select("Resolution", RESOLUTIONS, "96 × 96").value;
      lab.button("Start again", () => { key = ""; });
      lab.button("New paths", () => newPaths(bounces));

      const size = parseInt(res, 10);
      const k = `${bounces}|${coloured}|${lamp}|${size}`;
      if (k !== key) {
        key = k; n = size;
        sums = new Float32Array(n * n * 3); pixels = new Uint8ClampedArray(n * n * 4);
        cursor = 0; passes = 0; rays = 0; traceMs = 0;
        lampHalf = lamp / 2; colouredWalls = coloured;
        newPaths(bounces);
      }

      lab.onPointerDown((p) => {
        const fx = (p.x - view.x) / view.s, fy = (p.y - view.y) / view.s;
        if (fx >= 0 && fx < 1 && fy >= 0 && fy < 1) { pick = [fx, fy]; newPaths(bounces); }
      });
      lab.animate(() => {});

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        lampHalf = lamp / 2; colouredWalls = coloured;

        // trace for about 14 ms per frame, carrying on where the last frame stopped
        if (passes < MAX_SPP) {
          const t0 = performance.now();
          let done = 0;
          while (performance.now() - t0 < 14 && passes < MAX_SPP) {
            for (let m = 0; m < 128; m++) {
              const i = cursor, x = i % n, y = (i / n) | 0;
              const d = cameraRay(n, x + rnd(), y + rnd());
              trace(EYE[0], EYE[1], EYE[2], d[0], d[1], d[2], bounces, null);
              sums[i * 3] += out[0]; sums[i * 3 + 1] += out[1]; sums[i * 3 + 2] += out[2];
              done++;
              if (++cursor === n * n) { cursor = 0; passes++; if (passes >= MAX_SPP) break; }
            }
          }
          rays += done; traceMs += performance.now() - t0;
          // average, then an exposure curve (the lamp itself is far brighter than white), then gamma
          for (let i = 0; i < n * n; i++) {
            const count = passes + (i < cursor ? 1 : 0) || 1;
            for (let c = 0; c < 3; c++) {
              const v = sums[i * 3 + c] / count;
              pixels[i * 4 + c] = 255 * (1 - Math.exp(-2 * v)) ** (1 / 2.2);
            }
            pixels[i * 4 + 3] = 255;
          }
          if (!buffer || buffer.width !== n) { buffer = document.createElement("canvas"); buffer.width = buffer.height = n; }
          buffer.getContext("2d")!.putImageData(new ImageData(pixels, n, n), 0, 0);
        }

        clear(ctx, w, hh);
        const hgt = hh - BAR;
        const side = Math.min((w - 36) / 2, hgt - 40);
        const ix = 12, iy = 28 + (hgt - 40 - side) / 2;
        view = { x: ix, y: iy, s: side };
        ctx.imageSmoothingEnabled = false;                  // show the pixels as they are
        ctx.drawImage(buffer!, ix, iy, side, side);
        ctx.imageSmoothingEnabled = true;
        // the chosen pixel
        const cell = side / n;
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
        ctx.strokeRect(ix + Math.floor(pick[0] * n) * cell - 2, iy + Math.floor(pick[1] * n) * cell - 2, cell + 4, cell + 4);

        // ── the same view as lines, with some of the paths behind the chosen pixel ──
        const dx0 = ix + side + 12;
        const V = (p: [number, number, number]): Pt => { const q = project(p); return [dx0 + q[0] * side, iy + q[1] * side]; };
        const seg = (a: [number, number, number], b: [number, number, number]) => { const p = V(a), q = V(b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
        ctx.strokeStyle = P.grey(0.35); ctx.lineWidth = 1;
        const C = (x: number, y: number, z: number): [number, number, number] => [x, y, z];
        for (const z of [0, 1]) { seg(C(0, 0, z), C(1, 0, z)); seg(C(1, 0, z), C(1, 1, z)); seg(C(1, 1, z), C(0, 1, z)); seg(C(0, 1, z), C(0, 0, z)); }
        for (const [x, y] of [[0, 0], [1, 0], [1, 1], [0, 1]]) seg(C(x, y, 0), C(x, y, 1));
        for (const b of BLOCKS) {
          const corner = (sx: number, sy: number, sz: number): [number, number, number] => {
            const lx = sx * b.hx, lz = sz * b.hz;
            return [b.cx + b.c * lx + b.s * lz, b.cy + sy * b.hy, b.cz - b.s * lx + b.c * lz];
          };
          for (const sy of [-1, 1]) { seg(corner(-1, sy, -1), corner(1, sy, -1)); seg(corner(1, sy, -1), corner(1, sy, 1)); seg(corner(1, sy, 1), corner(-1, sy, 1)); seg(corner(-1, sy, 1), corner(-1, sy, -1)); }
          for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) seg(corner(sx, -1, sz), corner(sx, 1, sz));
        }
        ctx.strokeStyle = P.ink;
        const lh = lamp / 2;
        seg(C(0.5 - lh, LAMP_Y, 0.5 - lh), C(0.5 + lh, LAMP_Y, 0.5 - lh)); seg(C(0.5 + lh, LAMP_Y, 0.5 - lh), C(0.5 + lh, LAMP_Y, 0.5 + lh));
        seg(C(0.5 + lh, LAMP_Y, 0.5 + lh), C(0.5 - lh, LAMP_Y, 0.5 + lh)); seg(C(0.5 - lh, LAMP_Y, 0.5 + lh), C(0.5 - lh, LAMP_Y, 0.5 - lh));

        for (const pth of paths) {
          ctx.strokeStyle = P.ink; ctx.fillStyle = P.ink; ctx.lineWidth = 1.2; ctx.setLineDash([]);
          for (let v = 0; v + 1 < pth.verts.length; v++) seg(pth.verts[v], pth.verts[v + 1]);
          if (pth.escape && pth.verts.length) seg(pth.verts[pth.verts.length - 1], pth.escape);
          for (const v of pth.verts) { const q = V(v); dot(ctx, q[0], q[1], 1.8); }
          ctx.lineWidth = 0.8; ctx.setLineDash([2, 3]);
          for (const l of pth.lamps) if (l.seen) seg(l.from, l.to);
        }
        ctx.setLineDash([]);

        ctx.fillStyle = P.grey(0.55);
        text(ctx, `path traced, ${n} × ${n} · click a pixel`, ix, 16, "left", "alphabetic", FONT_SMALL);
        text(ctx, "12 of its paths · dotted: direct light", dx0, 16, "left", "alphabetic", FONT_SMALL);

        lab.log("Samples per pixel", `${passes}${passes >= MAX_SPP ? " (done)" : ""}`);
        lab.log("Paths per second", `${Math.round(rays / Math.max(traceMs, 1))} k`);
        lab.log("Bounces", bounces === 0 ? "none: direct light only" : `${bounces}`);
      });
    },
  };
};
