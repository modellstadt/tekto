// Spring system: a hanging chain, simulated with tekto's SpringSystem3D (in
// the plane z = 0). Hang weights on it the way Gaudí hung sachets of shot on
// his string models, then turn it upside down: the chain in pure tension
// becomes an arch in pure compression.

import { SpringSystem3D, Vec3, Plane } from "../../../src";
import type { AppFactory } from "./shared";
import { P, BAR, clear, fit, line, dot, text, hatch, FONT_SMALL } from "./shared";
import type { Pt } from "./shared";

export const chain: AppFactory = (env) => {
  let sys: SpringSystem3D | null = null;
  let key = "";
  let anchors: [Pt, Pt] = [[-6, 0], [6, 0]];
  const DEFAULT_WEIGHTS = [13];
  const weights = new Set<number>(DEFAULT_WEIGHTS);
  let drag: number | null = null; // 0 / 1 anchors
  let view: ReturnType<typeof fit> | null = null;

  function build(n: number, slack: number) {
    const s = new SpringSystem3D();
    const [A, B] = anchors;
    const span = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const L = span * slack, seg = L / (n - 1);
    const d = Math.sqrt((3 * span * Math.max(L - span, 0)) / 8);
    s.pos = []; s.vel = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      s.pos.push(new Vec3(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - 4 * d * t * (1 - t), 0));
      s.vel.push(Vec3.zero());
    }
    s.invMass = new Float32Array(n).fill(1);
    for (let i = 0; i < n - 1; i++) { s.addSpring(i, i + 1); s.springs[i].restLength = seg; }
    s.pin(0); s.pin(n - 1);
    s.globalStiffness = 20000;
    s.globalDamping = 6;
    s.globalVelDamping = 0.01;
    s.floorPlane = new Plane(new Vec3(0, 0, 1), 1e6); // no floor
    return s;
  }

  return {
    title: "Spring system: hanging chain",
    height: 480,
    fn: (lab) => {
      const n = lab.slider("Links", 6, 40, 20, { step: 1 }).value;
      const slack = lab.slider("Chain length ×", 1.02, 1.8, 1.3, { step: 0.01 }).value;
      const load = lab.slider("Sachet weight", 1, 12, 5, { step: 0.5 }).value;
      const invert = lab.toggle("Invert: chain → arch", false).value;
      const forces = lab.toggle("Line weight = force", true).value;
      lab.button("Remove weights", () => { weights.clear(); });
      lab.button("Reset", () => { anchors = [[-6, 0], [6, 0]]; weights.clear(); DEFAULT_WEIGHTS.forEach((i) => weights.add(i)); key = ""; });

      const k = `${n}|${slack}|${anchors.flat().join(",")}`;
      if (!sys || k !== key) {
        // rebuild on topology change; anchor drags only move the pins
        if (!sys || !key.startsWith(`${n}|${slack}|`)) {
          sys = build(n, slack);
          for (const i of [...weights]) if (i >= n) weights.delete(i);
        }
        key = k;
      }
      const s = sys!;
      for (let i = 1; i < n - 1; i++) s.invMass[i] = weights.has(i) ? 1 / load : 1;

      lab.onPointerDown((p) => {
        if (!view) return;
        const [wx, wy] = view.inv(p.x, p.y);
        const my = invert ? mirrorY(wy) : wy;
        for (let a = 0; a < 2 && !invert; a++) {
          if (Math.hypot(anchors[a][0] - wx, anchors[a][1] - wy) * view.s < 14) { drag = a; lab.canvas.setPointerCapture(p.id); return; }
        }
        // toggle a sachet on the nearest free node
        let best = -1, bd = 18 / view.s;
        for (let i = 1; i < s.pos.length - 1; i++) {
          const dd = Math.hypot(s.pos[i].x - wx, s.pos[i].y - my);
          if (dd < bd) { bd = dd; best = i; }
        }
        if (best > 0) { if (weights.has(best)) weights.delete(best); else weights.add(best); }
      });
      lab.onPointerMove((p) => {
        if (drag === null || !view) return;
        const [wx, wy] = view.inv(p.x, p.y);
        anchors[drag] = [Math.max(-11, Math.min(11, wx)), Math.max(-3, Math.min(5, wy))];
        const i = drag === 0 ? 0 : s.pos.length - 1;
        s.pos[i] = new Vec3(anchors[drag][0], anchors[drag][1], 0);
        key = `${n}|${slack}|${anchors.flat().join(",")}`;
      });
      lab.onPointerUp(() => { drag = null; });

      lab.animate(() => {
        if (!env.visible) return;
        for (let i = 1; i < s.pos.length - 1; i++) s.invMass[i] = weights.has(i) ? 1 / load : 1;
        s.step(1 / 60, 16);
        let lowest = Infinity;
        for (const p of s.pos) lowest = Math.min(lowest, p.y);
        const mid = (anchors[0][1] + anchors[1][1]) / 2;
        lab.log(invert ? "Rise" : "Sag", `${(mid - lowest).toFixed(2)} m`);
        lab.log("Span", `${Math.abs(anchors[1][0] - anchors[0][0]).toFixed(1)} m`);
        lab.log("Weights", `${weights.size}`);
      });

      function mirrorY(y: number) {
        const mid = (anchors[0][1] + anchors[1][1]) / 2;
        return 2 * mid - y;
      }

      lab.draw((ctx, w, h) => {
        if (!env.visible) return;
        clear(ctx, w, h);
        view = invert ? fit(-12, -5, 12, 11, 0, 0, w, h - BAR, 18) : fit(-12, -11, 12, 5, 0, 0, w, h - BAR, 18);
        const v = view;
        const pts: Pt[] = s.pos.map((p) => [p.x, invert ? mirrorY(p.y) : p.y]);
        const S = (p: Pt): Pt => [v.X(p[0]), v.Y(p[1])];

        // supports / ground
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 1;
        for (let a = 0; a < 2; a++) {
          const [x, y] = anchors[a];
          const yy = invert ? mirrorY(y) : y;
          const sx = v.X(x), sy = v.Y(yy);
          if (invert) {
            // abutment below the springing point
            const q: Pt[] = [[sx - 10, sy], [sx + 10, sy], [sx + 10, sy + 10], [sx - 10, sy + 10]];
            ctx.strokeStyle = P.grey(0.5); hatch(ctx, q, 3.5, Math.PI / 4, 0.7);
            ctx.strokeStyle = P.ink; line(ctx, sx - 12, sy, sx + 12, sy);
          } else {
            const q: Pt[] = [[sx - 10, sy - 10], [sx + 10, sy - 10], [sx + 10, sy], [sx - 10, sy]];
            ctx.strokeStyle = P.grey(0.5); hatch(ctx, q, 3.5, Math.PI / 4, 0.7);
            ctx.strokeStyle = P.ink; line(ctx, sx - 12, sy, sx + 12, sy);
          }
          ctx.fillStyle = drag === a ? P.ink : P.paper;
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 1.4;
          dot(ctx, sx, sy, 5); dot(ctx, sx, sy, 5, false);
        }

        // chain / arch, line weight proportional to axial force
        let maxT = 1e-9;
        const T = s.springs.map((sp) => {
          const a = s.pos[sp.i], b = s.pos[sp.j];
          const t = Math.max(0, Math.hypot(b.x - a.x, b.y - a.y) - sp.restLength) * s.globalStiffness;
          maxT = Math.max(maxT, t);
          return t;
        });
        for (let i = 0; i < pts.length - 1; i++) {
          ctx.lineWidth = forces ? 1 + 5 * (T[i] / maxT) : 2;
          const a = S(pts[i]), b = S(pts[i + 1]);
          line(ctx, a[0], a[1], b[0], b[1]);
        }
        // nodes and sachets
        for (let i = 1; i < pts.length - 1; i++) {
          const [x, y] = S(pts[i]);
          if (weights.has(i)) {
            ctx.fillStyle = P.ink;
            const r = 2.5 + Math.sqrt(load) * 1.6;
            if (invert) {
              // load arrow onto the arch
              ctx.lineWidth = 1;
              line(ctx, x, y - 26, x, y - 6);
              ctx.beginPath(); ctx.moveTo(x - 4, y - 11); ctx.lineTo(x, y - 5); ctx.lineTo(x + 4, y - 11); ctx.fill();
            } else {
              ctx.lineWidth = 0.8;
              line(ctx, x, y, x, y + 10);
              ctx.fillRect(x - r, y + 10, 2 * r, 2 * r);
            }
          } else {
            ctx.fillStyle = P.paper;
            ctx.lineWidth = 1;
            dot(ctx, x, y, 2.4); dot(ctx, x, y, 2.4, false);
          }
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, invert ? "compression (turned upside down)" : "tension (hanging)", 12, 20, "left", "alphabetic", FONT_SMALL);
        text(ctx, invert ? "click a node to add or remove a load" : "drag the supports · click a node to hang a weight", 12, 34, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
