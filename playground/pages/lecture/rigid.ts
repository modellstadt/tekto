// Rigid bodies: timber logs dropped into a bin, simulated with tekto's
// RigidBody2D (capsule shape: position, angle, velocity, spin) and
// repelBodies for contact. A rigid body never changes shape; everything that
// happens is movement, rotation and collision.

import { RigidBody2D, Capsule2D, repelBodies, Vec2 } from "../../../src";
import type { AppFactory } from "./shared";
import { P, BAR, clear, text, line, rng, FONT_SMALL } from "./shared";

// World units follow tekto's RigidBody2D defaults (about one unit per screen pixel).
const WW = 600, WH = 360;

export const rigid: AppFactory = (env) => {
  const r = rng(3);
  let bodies: RigidBody2D[] = [];
  // static floor and walls: long, fat capsules that are reset every step,
  // so contacts with them produce proper forces and torques
  const statics: { body: RigidBody2D; at: Vec2; angle: number }[] = [
    [new Vec2(WW / 2, WH + 40), WW, 40, 0],
    [new Vec2(-40, WH / 2), WH, 40, Math.PI / 2],
    [new Vec2(WW + 40, WH / 2), WH, 40, Math.PI / 2],
  ].map(([at, half, rad, angle]) => ({
    body: new RigidBody2D(new Capsule2D(at as Vec2, half as number, rad as number, angle as number)),
    at: at as Vec2, angle: angle as number,
  }));
  let view = { s: 1, ox: 0, oy: 0 };
  let grab: { b: RigidBody2D; lx: number; ly: number; tx: number; ty: number } | null = null;
  let dropQueue = 0, clock = 0;

  const makeLog = (x: number, y: number, damping: number) => {
    const half = 26 + r() * 46, rad = 7 + r() * 5;
    const body = new RigidBody2D(new Capsule2D(new Vec2(x, y), half, rad, (r() - 0.5) * 1.2), { damping, angularDamping: Math.min(0.995, damping + 0.005), wallRestitution: -0.25 });
    body.va = (r() - 0.5) * 0.05;
    bodies.push(body);
  };

  return {
    title: "Rigid bodies: a timber pile",
    height: 470,
    fn: (lab) => {
      const gravity = lab.slider("Gravity", 0, 0.6, 0.25, { step: 0.01 }).value;
      const damping = lab.slider("Air damping", 0.9, 0.999, 0.985, { step: 0.001 }).value;
      const stiff = lab.slider("Contact stiffness", 0.2, 2, 0.9, { step: 0.05 }).value;
      const showSkeleton = lab.toggle("Show capsule axes", false).value;
      lab.button("Drop 12 logs", () => { dropQueue += 12; });
      lab.button("Clear", () => { bodies = []; });
      lab.button("Shake", () => { for (const b of bodies) { b.vx += (r() - 0.5) * 8; b.vy -= 4 + r() * 4; b.va += (r() - 0.5) * 0.1; } });
      lab.once(() => { dropQueue = 14; });

      const toWorld = (px: number, py: number) => [(px - view.ox) / view.s, (py - view.oy) / view.s];
      lab.onPointerDown((p) => {
        const [x, y] = toWorld(p.x, p.y);
        const hit = bodies.find((b) => b.shape.containsPoint(new Vec2(x, y)));
        if (hit) {
          // remember the grab point in the body's own frame
          const c = Math.cos(-hit.angle), s = Math.sin(-hit.angle), dx = x - hit.x, dy = y - hit.y;
          grab = { b: hit, lx: dx * c - dy * s, ly: dx * s + dy * c, tx: x, ty: y };
          lab.canvas.setPointerCapture(p.id);
        } else if (x > 0 && x < WW && y > 0 && y < WH) makeLog(x, y, damping);
      });
      lab.onPointerMove((p) => { if (grab) { const [x, y] = toWorld(p.x, p.y); grab.tx = x; grab.ty = y; } });
      lab.onPointerUp(() => { grab = null; });

      lab.animate((t) => {
        if (!env.visible) return;
        if (dropQueue > 0 && t - clock > 0.12 && bodies.length < 60) { clock = t; dropQueue--; makeLog(80 + r() * (WW - 160), -30, damping); }
        for (let sub = 0; sub < 3; sub++) {
          for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) repelBodies(bodies[i], bodies[j], stiff);
            for (const st of statics) repelBodies(bodies[i], st.body, stiff * 2);
          }
          for (const st of statics) { st.body.stop(); st.body.position = st.at; st.body.angle = st.angle; }
          if (grab) {
            const b = grab.b, c = Math.cos(b.angle), s = Math.sin(b.angle);
            const px = b.x + grab.lx * c - grab.ly * s, py = b.y + grab.lx * s + grab.ly * c;
            b.applyForceAt((grab.tx - px) * b.mass * 0.02 - b.vx * b.mass * 0.05, (grab.ty - py) * b.mass * 0.02 - b.vy * b.mass * 0.05, px, py);
          }
          for (const b of bodies) { b.integrate(gravity / 3); b.constrainToBox(-10, -400, WW + 20, WH + 400); } // safety net only
        }
        let ke = 0;
        for (const b of bodies) ke += b.vx * b.vx + b.vy * b.vy;
        lab.log("Logs", bodies.length);
        lab.log("Motion", ke / Math.max(1, bodies.length) < 0.1 ? "at rest" : "moving");
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const s = Math.min((w - 30) / WW, (h - 40) / WH);
        view = { s, ox: (w - WW * s) / 2, oy: h - 16 - WH * s };
        const X = (x: number) => view.ox + x * s, Y = (y: number) => view.oy + y * s;
        // bin
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(0), Y(WH * 0.25)); ctx.lineTo(X(0), Y(WH)); ctx.lineTo(X(WW), Y(WH)); ctx.lineTo(X(WW), Y(WH * 0.25)); ctx.stroke();
        for (const b of bodies) {
          const [a, e] = b.shape.endpoints, rr = b.shape.radius * s;
          ctx.lineCap = "round";
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2 * rr + 2;
          line(ctx, X(a.x), Y(a.y), X(e.x), Y(e.y));
          ctx.strokeStyle = b === grab?.b ? P.grey(0.3) : P.paper; ctx.lineWidth = Math.max(1, 2 * rr - 2);
          line(ctx, X(a.x), Y(a.y), X(e.x), Y(e.y));
          // end grain rings: the log is a solid, it only moves and turns
          ctx.strokeStyle = P.ink; ctx.lineWidth = 0.8;
          for (const q of [a, e]) { ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), rr * 0.45, 0, Math.PI * 2); ctx.stroke(); }
          if (showSkeleton) {
            ctx.setLineDash([2, 2]); line(ctx, X(a.x), Y(a.y), X(e.x), Y(e.y)); ctx.setLineDash([]);
            ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), 2, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.lineCap = "butt";
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "click to drop a log · drag a log to throw it", X(0), 14, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
