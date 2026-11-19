// Camera: how the choice of lens and settings composes an image of the same
// house. A pinhole camera with a 36 × 24 mm sensor looks at a small scene:
// focal length sets the angle of view, distance sets the perspective, tilting
// the camera makes verticals converge while shifting the lens keeps them
// parallel, exposure brightens or darkens the whole image, and aperture plus
// focus distance decide what is sharp (depth of field). Rendered as flat grey
// polygons, back to front, each object blurred by its circle of confusion.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, FONT_SMALL } from "./shared";

type V3 = [number, number, number];
interface Face { pts: V3[]; lum: number; edge?: boolean }
interface Obj { faces: Face[]; balls?: { c: V3; r: number; lum: number }[] }

const SUN: V3 = norm([-0.5, -0.65, 0.75]);
function norm(v: V3): V3 { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const shade = (n: V3, base = 1) => base * (0.32 + 0.68 * Math.max(0, dot3(norm(n), SUN)));

function faceOf(pts: V3[], base = 1, edge = true): Face {
  const n = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
  return { pts, lum: shade(n, base), edge };
}

function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, base = 1): Obj {
  const f: Face[] = [
    faceOf([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], base),
    faceOf([[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]], base),
    faceOf([[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]], base),
    faceOf([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], base),
    faceOf([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], base),
  ];
  return { faces: f };
}

function house(): Obj {
  const W = 10, D = 8, E = 6, R = 8.8, o = 0.6, x0 = -W / 2, x1 = W / 2, y0 = -D / 2, y1 = D / 2;
  const f: Face[] = [
    faceOf([[x0, y0, 0], [x1, y0, 0], [x1, y0, E], [x0, y0, E]], 0.95),
    faceOf([[x1, y1, 0], [x0, y1, 0], [x0, y1, E], [x1, y1, E]], 0.95),
    faceOf([[x0, y1, 0], [x0, y0, 0], [x0, y0, E], [x0, 0, R], [x0, y1, E]], 0.95),
    faceOf([[x1, y0, 0], [x1, y1, 0], [x1, y1, E], [x1, 0, R], [x1, y0, E]], 0.95),
    faceOf([[x0 - o, y0 - o, E - o * 0.7], [x1 + o, y0 - o, E - o * 0.7], [x1 + o, 0, R], [x0 - o, 0, R]], 0.55),
    faceOf([[x1 + o, y1 + o, E - o * 0.7], [x0 - o, y1 + o, E - o * 0.7], [x0 - o, 0, R], [x1 + o, 0, R]], 0.55),
  ];
  // windows and door: dark glass just in front of the walls
  const g = 0.02;
  for (const z of [0.9, 3.9]) for (const x of [-3.2, 0, 3.2]) {
    if (z < 1 && x === 0) continue;
    f.push({ pts: [[x - 0.6, y0 - g, z], [x + 0.6, y0 - g, z], [x + 0.6, y0 - g, z + 1.4], [x - 0.6, y0 - g, z + 1.4]], lum: 0.12, edge: true });
  }
  f.push({ pts: [[-0.55, y0 - g, 0], [0.55, y0 - g, 0], [0.55, y0 - g, 2.2], [-0.55, y0 - g, 2.2]], lum: 0.2, edge: true });
  for (const z of [0.9, 3.9]) for (const y of [-1.8, 1.8]) {
    f.push({ pts: [[x0 - g, y + 0.6, z], [x0 - g, y - 0.6, z], [x0 - g, y - 0.6, z + 1.4], [x0 - g, y + 0.6, z + 1.4]], lum: 0.12, edge: true });
    f.push({ pts: [[x1 + g, y - 0.6, z], [x1 + g, y + 0.6, z], [x1 + g, y + 0.6, z + 1.4], [x1 + g, y - 0.6, z + 1.4]], lum: 0.12, edge: true });
  }
  return { faces: f };
}

function tree(x: number, y: number, h: number, r: number): Obj {
  const t = box(x - 0.15, y - 0.15, 0, x + 0.15, y + 0.15, h - r * 0.6, 0.5);
  t.balls = [{ c: [x, y, h], r, lum: 0.42 }];
  return t;
}

function scene(): Obj[] {
  const objs: Obj[] = [house()];
  for (let i = -3; i <= 3; i++) objs.push(box(i * 4.5 - 0.15, -14 - 0.15, 0, i * 4.5 + 0.15, -14 + 0.15, 1.1, 0.9)); // bollards
  objs.push(tree(-13, 3, 7, 2.6), tree(12, -6, 6, 2.2), tree(16, 10, 8, 3), tree(-6, -24, 5, 1.8));
  const hs = [18, 26, 14, 32, 20, 24, 16];
  hs.forEach((hh, i) => objs.push(box(-66 + i * 19, 55, 0, -52 + i * 19, 68, hh, 0.9)));
  return objs;
}
const SCENE = scene();

export const camera: AppFactory = () => {
  const layer = document.createElement("canvas");
  let filterOK: boolean | null = null;

  return {
    title: "Camera: lens, perspective, exposure, focus",
    height: 560,
    fn: (lab) => {
      const f = lab.slider("Focal length mm", 14, 200, 35, { step: 1, group: "Lens" }).value;
      const dist35 = lab.slider("Distance m (at 35 mm)", 8, 60, 22, { step: 0.5, group: "Position" }).value;
      const dolly = lab.toggle("Keep the house the same size", true, { group: "Position" }).value;
      const az = lab.slider("Walk around °", -70, 70, 25, { step: 1, group: "Position" }).value;
      const hc = lab.slider("Camera height m", 0.3, 30, 1.6, { step: 0.1, group: "Position" }).value;
      const mode = lab.select("Verticals", ["Tilt the camera", "Shift the lens"] as const, "Tilt the camera", { group: "Position" }).value;
      const ev = lab.slider("Exposure EV", -3, 3, 0, { step: 0.1, group: "Exposure" }).value;
      const N = lab.slider("Aperture f/", 1.4, 22, 8, { step: 0.1, group: "Focus" }).value;
      const focusOn = lab.select("Focus on", ["House", "Foreground post", "Bollards", "Background", "Manual"] as const, "House", { group: "Focus" }).value;
      const post = lab.toggle("Foreground post", true, { group: "Display" }).value;
      const manual = focusOn === "Manual" ? lab.slider("Focus distance m", 1, 150, 20, { step: 0.5, group: "Focus" }).value : 0;
      const showPlan = lab.toggle("Show plan inset", true, { group: "Display" }).value;

      // camera position: on a circle around the house, aimed at its centre
      const d = dolly ? (dist35 * f) / 35 : dist35;
      const a = ((az - 90) * Math.PI) / 180;
      const C: V3 = [Math.cos(a) * d, Math.sin(a) * d, hc];
      const T: V3 = [0, 0, 4];
      const hdir = norm([T[0] - C[0], T[1] - C[1], 0]);
      const pitch = Math.atan2(T[2] - C[2], Math.hypot(T[0] - C[0], T[1] - C[1]));
      const tilt = mode === "Tilt the camera";
      const cp = Math.cos(tilt ? pitch : 0), sp = Math.sin(tilt ? pitch : 0);
      const F: V3 = [hdir[0] * cp, hdir[1] * cp, sp];
      const Rt: V3 = [hdir[1], -hdir[0], 0];
      const U: V3 = [-hdir[0] * sp, -hdir[1] * sp, cp];
      const shiftMM = tilt ? 0 : f * Math.tan(pitch);        // lens shift on the sensor
      const toCam = (q: V3): V3 => { const v = sub(q, C); return [dot3(v, Rt), dot3(v, U), dot3(v, F)]; };

      // a post 3 m in front of the lens, always a third from the left edge: a framing device
      const fovHalf = Math.atan(18 / f);
      const postAt: V3 = [C[0] + hdir[0] * 3 + Rt[0] * -3 * Math.tan(fovHalf) * 0.62, C[1] + hdir[1] * 3 + Rt[1] * -3 * Math.tan(fovHalf) * 0.62, 0];
      const objects: Obj[] = post ? [...SCENE, box(postAt[0] - 0.07, postAt[1] - 0.07, 0, postAt[0] + 0.07, postAt[1] + 0.07, 12, 0.35)] : SCENE;
      const focusDist = focusOn === "Foreground post" ? 3 : focusOn === "House" ? Math.hypot(C[0], C[1]) - 4 : focusOn === "Bollards" ? Math.abs(toCam([0, -14, 0.5])[2]) : focusOn === "Background" ? Math.abs(toCam([0, 60, 10])[2]) : manual;
      const fov = (2 * Math.atan(18 / f) * 180) / Math.PI;
      // depth of field (circle of confusion 0.03 mm)
      const cMM = 0.03, H = (f * f) / (N * cMM) + f, s = focusDist * 1000;
      const near = (s * (H - f)) / (H + s - 2 * f) / 1000, far = s < H ? (s * (H - f)) / (H - s) / 1000 : Infinity;
      lab.log("Lens", `${f} mm, ${fov.toFixed(0)}° wide, f/${N.toFixed(1)}`);
      lab.log("Camera", `${d.toFixed(1)} m away, ${hc.toFixed(1)} m high, ${tilt ? `tilted ${((pitch * 180) / Math.PI).toFixed(0)}°` : `level, lens shifted ${shiftMM.toFixed(1)} mm`}`);
      lab.log("Sharp", `${near.toFixed(1)} m to ${Number.isFinite(far) ? far.toFixed(1) + " m" : "infinity"}`);

      lab.draw((ctx, w, hh) => {
        clear(ctx, w, hh);
        const h = hh - BAR - 22;
        const fw = Math.min(w - 24, h * 1.5), fh = fw / 1.5;
        const fx = (w - fw) / 2, fy = 10;
        const k = fw / 36;                                    // px per sensor mm
        const cx = fx + fw / 2, cy = fy + fh / 2;
        const scr = (q: V3): [number, number] => [cx + (f * q[0] / q[2]) * k, cy - (f * q[1] / q[2] - shiftMM) * k];
        const expo = Math.pow(2, ev);
        const grey = (l: number) => { const v = Math.round(255 * Math.min(1, Math.max(0, l * expo * 0.95))); return `rgb(${v},${v},${v})`; };
        const coc = (z: number) => {
          const zz = Math.max(0.2, z) * 1000;
          const c = ((f * f) / (N * (s - f))) * Math.abs(zz - s) / zz;   // mm on the sensor
          return Math.min(18, (c * k) / 2);
        };

        layer.width = Math.ceil(fw * 2); layer.height = Math.ceil(fh * 2);
        const lg = layer.getContext("2d")!;
        if (filterOK === null) { ctx.filter = "blur(2px)"; filterOK = ctx.filter === "blur(2px)"; ctx.filter = "none"; }

        ctx.save();
        ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
        // sky and ground: the horizon is where the camera's level line meets the frame
        ctx.fillStyle = grey(0.82); ctx.fillRect(fx, fy, fw, fh);
        const horizon = cy - ((tilt ? f * Math.tan(-pitch) : 0) - shiftMM) * k;
        ctx.fillStyle = grey(0.5); ctx.fillRect(fx, horizon, fw, fy + fh - horizon);

        const composite = (draw: (g: CanvasRenderingContext2D) => void, blur: number) => {
          lg.setTransform(1, 0, 0, 1, 0, 0);
          lg.clearRect(0, 0, layer.width, layer.height);
          lg.setTransform(2, 0, 0, 2, -fx * 2, -fy * 2);
          draw(lg);
          if (blur < 0.4) { ctx.drawImage(layer, fx, fy, fw, fh); return; }
          if (filterOK) { ctx.filter = `blur(${blur.toFixed(1)}px)`; ctx.drawImage(layer, fx, fy, fw, fh); ctx.filter = "none"; return; }
          ctx.globalAlpha = 1 / 6;
          for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; ctx.drawImage(layer, fx + Math.cos(t) * blur, fy + Math.sin(t) * blur, fw, fh); }
          ctx.globalAlpha = 1;
        };

        // ground grid in depth bands, each band blurred on its own
        const bands = new Map<number, [number, number, number, number][]>();
        const seg = (p: V3, q: V3) => {
          let a1 = toCam(p), b1 = toCam(q);
          if (a1[2] < 0.3 && b1[2] < 0.3) return;
          if (a1[2] < 0.3) { const t = (0.3 - a1[2]) / (b1[2] - a1[2]); a1 = [a1[0] + (b1[0] - a1[0]) * t, a1[1] + (b1[1] - a1[1]) * t, 0.3]; }
          if (b1[2] < 0.3) { const t = (0.3 - b1[2]) / (a1[2] - b1[2]); b1 = [b1[0] + (a1[0] - b1[0]) * t, b1[1] + (a1[1] - b1[1]) * t, 0.3]; }
          const band = Math.round(Math.log2(Math.max(1, (a1[2] + b1[2]) / 2)) * 3);
          const [x1, y1] = scr(a1), [x2, y2] = scr(b1);
          if (!bands.has(band)) bands.set(band, []);
          bands.get(band)!.push([x1, y1, x2, y2]);
        };
        for (let g = -80; g <= 80; g += 4) for (let t = -80; t < 80; t += 4) { seg([g, t, 0], [g, t + 4, 0]); seg([t, g, 0], [t + 4, g, 0]); }
        [...bands.keys()].sort((p, q) => q - p).forEach((band) => {
          const z = Math.pow(2, band / 3);
          composite((g) => {
            g.strokeStyle = grey(0.38); g.lineWidth = 0.7;
            g.beginPath();
            for (const [x1, y1, x2, y2] of bands.get(band)!) { g.moveTo(x1, y1); g.lineTo(x2, y2); }
            g.stroke();
          }, coc(z));
        });

        // objects, far to near, each blurred by its distance
        const objs = objects.map((o) => {
          const all = o.faces.flatMap((fc) => fc.pts);
          const zc = all.reduce((acc, p) => acc + toCam(p)[2], 0) / all.length;
          return { o, zc };
        }).filter(({ zc }) => zc > 0.3).sort((p, q) => q.zc - p.zc);
        for (const { o, zc } of objs) {
          composite((g) => {
            const faces = o.faces.map((fc) => {
              const cam = fc.pts.map(toCam);
              const z = cam.reduce((acc, p) => acc + p[2], 0) / cam.length;
              return { fc, cam, z };
            }).filter(({ fc, cam }) => {
              if (cam.some((p) => p[2] < 0.3)) return false;
              const n = cross(sub(fc.pts[1], fc.pts[0]), sub(fc.pts[2], fc.pts[0]));
              return dot3(n, sub(C, fc.pts[0])) > 0;                 // facing the camera
            }).sort((p, q) => q.z - p.z);
            for (const { fc, cam } of faces) {
              const q = cam.map(scr);
              g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
              g.fillStyle = grey(fc.lum); g.fill();
              if (fc.edge) { g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 0.6; g.stroke(); }
            }
            for (const b of o.balls ?? []) {
              const c = toCam(b.c);
              if (c[2] < 0.5) continue;
              const [x, y] = scr(c);
              g.fillStyle = grey(b.lum);
              g.beginPath(); g.arc(x, y, (f * b.r / c[2]) * k, 0, Math.PI * 2); g.fill();
            }
          }, coc(zc));
        }
        ctx.restore();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1;
        ctx.strokeRect(fx + 0.5, fy + 0.5, fw, fh);

        // plan inset: camera, angle of view, focus distance
        if (showPlan) {
          const ps = Math.min(120, fh * 0.42), px = fx + fw - ps - 8, py = fy + fh - ps - 8;
          ctx.fillStyle = P.paper; ctx.fillRect(px, py, ps, ps);
          ctx.strokeStyle = P.ink; ctx.strokeRect(px + 0.5, py + 0.5, ps, ps);
          const span = Math.max(40, d * 1.25), sc = ps / (2 * span), ox = px + ps / 2, oy = py + ps / 2;
          const PX = (x: number) => ox + x * sc, PY = (y: number) => oy - y * sc;
          ctx.save(); ctx.beginPath(); ctx.rect(px, py, ps, ps); ctx.clip();
          ctx.fillStyle = P.ink; ctx.fillRect(PX(-5), PY(4), 10 * sc, 8 * sc);
          ctx.fillStyle = P.grey(0.5);
          for (let i = -3; i <= 3; i++) ctx.fillRect(PX(i * 4.5) - 1, PY(-14) - 1, 2, 2);
          // angle of view
          const half = Math.atan(18 / f), ha = Math.atan2(hdir[1], hdir[0]), L = span * 3;
          ctx.fillStyle = P.inkA(0.12); ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(PX(C[0]), PY(C[1]));
          ctx.lineTo(PX(C[0] + Math.cos(ha + half) * L), PY(C[1] + Math.sin(ha + half) * L));
          ctx.lineTo(PX(C[0] + Math.cos(ha - half) * L), PY(C[1] + Math.sin(ha - half) * L));
          ctx.closePath(); ctx.fill(); ctx.stroke();
          // focus line
          ctx.setLineDash([2, 2]);
          const fxp = C[0] + hdir[0] * focusDist, fyp = C[1] + hdir[1] * focusDist;
          ctx.beginPath(); ctx.moveTo(PX(fxp - hdir[1] * 8), PY(fyp + hdir[0] * 8)); ctx.lineTo(PX(fxp + hdir[1] * 8), PY(fyp - hdir[0] * 8)); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(PX(C[0]), PY(C[1]), 3, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = P.grey(0.6);
        text(ctx, `${f} mm · ${fov.toFixed(0)}° · f/${N.toFixed(1)} · EV ${ev >= 0 ? "+" : ""}${ev.toFixed(1)} · focus ${focusDist.toFixed(1)} m`, fx, fy + fh + 15, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
