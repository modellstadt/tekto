// Hot-wire cutting. A heated wire, held straight, melts its way through a foam
// block while its two ends follow two guide curves on opposite faces. Every
// surface it can cut is therefore a ruled surface: a family of straight lines.
// Two lines give a hyperbolic paraboloid, two circles a hyperboloid, a line
// and an arc a conoid. A sphere or a dome is not in the solution space.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, FONT_SMALL } from "./shared";

type V3 = [number, number, number];
const LX = 1.2;                      // block length along the wire (m)
const MODES = ["Hypar: two lines", "Hyperboloid: two circles", "Conoid: line and arc", "Two waves"] as const;

export const hotwire: AppFactory = (env) => {
  let yaw = -0.6, drag: number | null = null, yaw0 = 0;
  let t0 = 0;

  return {
    title: "Hot-wire cutting: ruled surfaces",
    height: 500,
    fn: (lab) => {
      const mode = lab.select("Guide curves", MODES, "Hypar: two lines").value;
      const twist = lab.slider("Twist between the faces °", -90, 90, mode.startsWith("Hyperboloid") ? 60 : 40, { step: 1 }).value;
      const amp = lab.slider("Curvature", 0, 1, 0.5, { step: 0.01 }).value;
      const rulings = lab.slider("Rulings shown", 6, 60, 28, { step: 1 }).value;
      const animateWire = lab.toggle("Move the wire", true).value;
      const showDome = lab.toggle("Compare: a dome", false).value;

      const tw = (twist * Math.PI) / 180;
      // guide curves on the faces x = 0 (A) and x = LX (B); t in [0,1]
      const A = (t: number): V3 => {
        if (mode.startsWith("Hypar")) { const y = -0.9 + 1.8 * t; return [0, y, 0.6 + Math.tan(tw / 2) * 0.5 * y * amp * 2]; }
        if (mode.startsWith("Hyperboloid")) { const a = t * Math.PI * 2; return [0, Math.cos(a) * 0.45, 0.6 + Math.sin(a) * 0.45]; }
        if (mode.startsWith("Conoid")) { const y = -0.9 + 1.8 * t; return [0, y, 0.35]; }
        const y = -0.9 + 1.8 * t; return [0, y, 0.6 + 0.3 * amp * Math.sin(y * Math.PI * 1.5)];
      };
      const B = (t: number): V3 => {
        if (mode.startsWith("Hypar")) { const y = -0.9 + 1.8 * t; return [LX, y, 0.6 - Math.tan(tw / 2) * 0.5 * y * amp * 2]; }
        if (mode.startsWith("Hyperboloid")) { const a = t * Math.PI * 2 + tw; return [LX, Math.cos(a) * 0.45, 0.6 + Math.sin(a) * 0.45]; }
        if (mode.startsWith("Conoid")) { const y = -0.9 + 1.8 * t; return [LX, y, 0.35 + (0.2 + 0.6 * amp) * Math.sqrt(Math.max(0, 1 - (y / 0.9) ** 2))]; }
        const y = -0.9 + 1.8 * t; return [LX, y, 0.6 + 0.3 * amp * Math.sin(y * Math.PI * 1.5 + tw)];
      };

      lab.onPointerDown((p) => { drag = p.x; yaw0 = yaw; lab.canvas.setPointerCapture(p.id); });
      lab.onPointerMove((p) => { if (drag !== null) yaw = yaw0 + (p.x - drag) * 0.01; });
      lab.onPointerUp(() => { drag = null; });

      // largest angle of the wire against the block axis (wire tilt the machine has to allow)
      let maxTilt = 0;
      for (let i = 0; i <= 50; i++) {
        const a = A(i / 50), b = B(i / 50);
        maxTilt = Math.max(maxTilt, Math.atan2(Math.hypot(b[1] - a[1], b[2] - a[2]), LX));
      }
      lab.log("Surface", mode.split(":")[0]);
      lab.log("Largest wire angle", `${((maxTilt * 180) / Math.PI).toFixed(0)}°`);
      lab.log("Every line on it", "straight");

      lab.animate((_t, dt) => { if (env.visible && animateWire) t0 = (t0 + dt * 0.12) % 1; });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const cy = Math.cos(yaw), sy = Math.sin(yaw), el = 0.5;
        const pr = ([x, y, z]: V3): [number, number] => {
          const xr = (x - LX / 2) * cy - y * sy, yr = (x - LX / 2) * sy + y * cy;
          return [xr, z * Math.cos(el) + yr * Math.sin(el)];
        };
        const sc = Math.min(w, h) / 3.1, ox = w / 2, oy = h * 0.72;
        const S = (v: V3): [number, number] => { const [a, b] = pr(v); return [ox + a * sc, oy - b * sc]; };
        const seg = (a: V3, b: V3) => { const p = S(a), q = S(b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
        // foam block
        ctx.strokeStyle = P.grey(0.35); ctx.lineWidth = 1;
        const c: V3[] = [[0, -1, 0], [LX, -1, 0], [LX, 1, 0], [0, 1, 0], [0, -1, 1.2], [LX, -1, 1.2], [LX, 1, 1.2], [0, 1, 1.2]];
        [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => seg(c[i], c[j]));
        // rulings: the cut surface
        const cut = animateWire ? t0 : 1;
        ctx.lineWidth = 0.8;
        for (let i = 0; i <= rulings; i++) {
          const t = i / rulings;
          ctx.strokeStyle = t <= cut ? P.ink : P.grey(0.2);
          seg(A(t), B(t));
        }
        // guide curves
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.2;
        for (const G of [A, B]) { ctx.beginPath(); for (let i = 0; i <= 80; i++) { const [x, y] = S(G(i / 80)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
        // the wire itself, with its bow
        if (animateWire) {
          const a = A(t0), b = B(t0);
          const ext = (p: V3, q: V3, k: number): V3 => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
          ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
          seg(ext(a, b, -0.25), ext(a, b, 1.25));
          ctx.fillStyle = P.ink;
          for (const e of [ext(a, b, -0.25), ext(a, b, 1.25)]) { const [x, y] = S(e); ctx.fillRect(x - 4, y - 4, 8, 8); }
        }
        // a dome, for comparison: no straight lines lie on it
        if (showDome) {
          ctx.strokeStyle = P.grey(0.5); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          for (let k = 1; k < 6; k++) {
            const ph = (k / 6) * Math.PI;
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) { const th = (i / 40) * Math.PI; const [x, y] = S([LX / 2 + Math.cos(ph) * 0.55 * Math.sin(th), Math.cos(th) * 0.55, 1.2 + Math.sin(ph) * 0.55 * Math.sin(th) * 0.8]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
            ctx.stroke();
          }
          ctx.setLineDash([]);
          ctx.fillStyle = P.grey(0.55);
          const [dx, dy] = S([LX / 2, 0, 1.75]);
          text(ctx, "dome: curved in both directions, no straight line on it", dx, dy - 6, "center", "alphabetic", FONT_SMALL);
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "drag to turn the block · thick curves: the two guides · straight lines: the wire", 12, 16, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
