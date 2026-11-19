// Soft bodies: air cushions, the principle of pneumatic structures. Each
// cushion is a ring of masses joined by springs (tekto SpringSystem3D, in the
// plane z = 0). An internal pressure pushes every edge outwards in proportion
// to how much the enclosed area has shrunk. Low pressure: a sagging bag.
// High pressure: a firm cushion that can carry a load.

import { SpringSystem3D, Vec3, Plane } from "../../../src";
import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, fit, path, text, dot, hatch, FONT_SMALL } from "./shared";
import type { View } from "./shared";

const RING = 28;

interface Cushion { first: number; rest: number }

export const soft: AppFactory = (env) => {
  let sys: SpringSystem3D | null = null;
  let cushions: Cushion[] = [];
  let key = "";
  let view: View | null = null;
  let grab: number | null = null;
  let target: [number, number] = [0, 0];
  let load = { on: false, x: 0, y: 6, vy: 0 };

  function build(count: number) {
    const s = new SpringSystem3D();
    s.pos = []; s.vel = []; cushions = [];
    const R = 1.6;
    for (let c = 0; c < count; c++) {
      const cx = (c - (count - 1) / 2) * 3.6, cy = 2 + (c % 2) * 3.4 + 1.5;
      const first = s.pos.length;
      for (let i = 0; i < RING; i++) {
        const a = (i / RING) * Math.PI * 2;
        s.pos.push(new Vec3(cx + Math.cos(a) * R * 1.3, cy + Math.sin(a) * R * 0.8, 0));
        s.vel.push(Vec3.zero());
      }
      cushions.push({ first, rest: Math.PI * R * R });
    }
    s.invMass = new Float32Array(s.pos.length).fill(1);
    const seg = (2 * Math.PI * R) / RING;
    for (const cu of cushions) for (let i = 0; i < RING; i++) {
      s.addSpring(cu.first + i, cu.first + ((i + 1) % RING));
      s.springs[s.springs.length - 1].restLength = seg;
    }
    s.globalStiffness = 3000;
    s.globalDamping = 3;
    s.globalVelDamping = 0.004;
    s.gravity = new Vec3(0, -9.81, 0);
    s.floorPlane = new Plane(new Vec3(0, 1, 0), 0);   // ground at y = 0
    return s;
  }

  const area = (s: SpringSystem3D, cu: Cushion) => {
    let a = 0;
    for (let i = 0; i < RING; i++) {
      const p = s.pos[cu.first + i], q = s.pos[cu.first + ((i + 1) % RING)];
      a += p.x * q.y - q.x * p.y;
    }
    return a / 2;
  };

  return {
    title: "Soft bodies: air cushions",
    height: 470,
    fn: (lab) => {
      const count = lab.slider("Cushions", 1, 5, 3, { step: 1 }).value;
      const pressure = lab.slider("Pressure", 0, 3, 1.2, { step: 0.05 }).value;
      const stiffness = lab.slider("Membrane stiffness", 200, 6000, 3000, { step: 100 }).value;
      const withLoad = lab.toggle("Put a plank on top", false).value;
      lab.button("Reset", () => { key = ""; });

      const k = `${count}`;
      if (!sys || k !== key) { sys = build(count); key = k; load = { on: false, x: 0, y: 9, vy: 0 }; }
      const s = sys!;
      s.globalStiffness = stiffness;
      load.on = withLoad;

      lab.onPointerDown((p) => {
        if (!view) return;
        const [x, y] = view.inv(p.x, p.y);
        let best = -1, bd = 0.6;
        s.pos.forEach((q, i) => { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = i; } });
        if (best >= 0) { grab = best; target = [x, y]; lab.canvas.setPointerCapture(p.id); }
      });
      lab.onPointerMove((p) => { if (grab !== null && view) target = view.inv(p.x, p.y) as [number, number]; });
      lab.onPointerUp(() => { grab = null; });

      lab.animate(() => {
        if (!env.visible) return;
        const dt = 1 / 60, sub = 4, h = dt / sub;
        for (let k2 = 0; k2 < sub; k2++) {
          // pressure: p ∝ (rest area / current area); force along each edge's outward normal
          for (const cu of cushions) {
            const A = Math.max(0.05, area(s, cu));
            const pr = pressure * 60 * (cu.rest / A);
            for (let i = 0; i < RING; i++) {
              const a = cu.first + i, b = cu.first + ((i + 1) % RING);
              const ex = s.pos[b].x - s.pos[a].x, ey = s.pos[b].y - s.pos[a].y;
              // CCW ring: outward normal of edge (ex, ey) is (ey, -ex); its length is the edge length
              const fx = ey * pr * 0.5 * h, fy = -ex * pr * 0.5 * h;
              s.vel[a] = s.vel[a].add(new Vec3(fx, fy, 0));
              s.vel[b] = s.vel[b].add(new Vec3(fx, fy, 0));
            }
          }
          // cushions push each other apart: node against the other rings' nodes
          for (let c1 = 0; c1 < cushions.length; c1++) for (let c2 = c1 + 1; c2 < cushions.length; c2++) {
            for (let i = 0; i < RING; i++) for (let j = 0; j < RING; j++) {
              const a = cushions[c1].first + i, b = cushions[c2].first + j;
              const dx = s.pos[b].x - s.pos[a].x, dy = s.pos[b].y - s.pos[a].y, d = Math.hypot(dx, dy);
              if (d < 0.35 && d > 1e-6) {
                const f = (0.35 - d) * 40 * h / d;
                s.vel[a] = s.vel[a].sub(new Vec3(dx * f, dy * f, 0));
                s.vel[b] = s.vel[b].add(new Vec3(dx * f, dy * f, 0));
              }
            }
          }
          // a rigid plank resting on the cushions (only moves up and down)
          if (load.on) {
            const halfW = 6, bottom = load.y;
            let support = 0;
            s.pos.forEach((q, i) => {
              if (Math.abs(q.x - load.x) < halfW && q.y > bottom) {
                const pen = q.y - bottom;
                support += pen * 60;
                s.vel[i] = s.vel[i].add(new Vec3(0, -pen * 60 * h, 0));
              }
            });
            load.vy += (-9.81 * 3 + support / 12) * h;
            load.vy *= 0.995;
            load.y += load.vy * h;
          }
          if (grab !== null) {
            const q = s.pos[grab];
            s.vel[grab] = s.vel[grab].add(new Vec3((target[0] - q.x) * 80 * h, (target[1] - q.y) * 80 * h, 0));
          }
          s.step(h, 1);
          // walls
          for (let i = 0; i < s.pos.length; i++) {
            const q = s.pos[i];
            if (Math.abs(q.x) > 11) { s.pos[i] = new Vec3(Math.sign(q.x) * 11, q.y, 0); s.vel[i] = new Vec3(0, s.vel[i].y, 0); }
          }
        }
        const fill = cushions.map((cu) => area(s, cu) / cu.rest);
        lab.log("Volume (share of round)", fill.map((f) => `${Math.round(f * 100)} %`).join(" · "));
        if (load.on) lab.log("Plank height", `${load.y.toFixed(2)} m`);
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        view = fit(-11.5, -0.8, 11.5, 11, 0, 0, w, hh - BAR, 14);
        const v = view;
        const S = (q: Vec3): Pt => [v.X(q.x), v.Y(q.y)];
        // ground
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
        path(ctx, [[v.X(-11.5), v.Y(0)], [v.X(11.5), v.Y(0)]]); ctx.stroke();
        ctx.strokeStyle = P.grey(0.4);
        hatch(ctx, [[v.X(-11.5), v.Y(0)], [v.X(11.5), v.Y(0)], [v.X(11.5), v.Y(-0.6)], [v.X(-11.5), v.Y(-0.6)]], 5, Math.PI / 4, 0.6);
        for (const cu of cushions) {
          const ring = Array.from({ length: RING }, (_, i) => S(s.pos[cu.first + i]));
          ctx.fillStyle = P.grey(0.08); path(ctx, ring, true); ctx.fill();
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2; path(ctx, ring, true); ctx.stroke();
          ctx.fillStyle = P.ink;
          for (const q of ring) dot(ctx, q[0], q[1], 1.6);
        }
        if (load.on) {
          const q: Pt[] = [[v.X(-6), v.Y(load.y + 0.5)], [v.X(6), v.Y(load.y + 0.5)], [v.X(6), v.Y(load.y)], [v.X(-6), v.Y(load.y)]];
          ctx.fillStyle = P.paper; path(ctx, q, true); ctx.fill();
          ctx.strokeStyle = P.grey(0.5); hatch(ctx, q, 4, 0, 0.6);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; path(ctx, q, true); ctx.stroke();
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "drag the membrane · change the pressure", 12, 18, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
