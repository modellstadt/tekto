// Boids (Reynolds 1987). Each bird sees only its neighbours and follows three
// rules: keep apart (separation), fly the same way (alignment), stay close
// (cohesion). Nobody leads and nothing describes the flock, yet a flock appears.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, dot, rng, FONT_SMALL } from "./shared";

interface Bird { x: number; y: number; vx: number; vy: number }

export const boids: AppFactory = (env) => {
  const W = 160, H = 100;                 // world size (wraps around)
  const r = rng(5);
  let birds: Bird[] = [];
  const obstacles: [number, number][] = [];
  let view = { s: 1, ox: 0, oy: 0 };
  let predator: [number, number] | null = null;

  const spawn = (n: number) => {
    while (birds.length < n) {
      const a = r() * Math.PI * 2;
      birds.push({ x: r() * W, y: r() * H, vx: Math.cos(a) * 12, vy: Math.sin(a) * 12 });
    }
    birds.length = n;
  };

  return {
    title: "Boids: emergence",
    height: 480,
    fn: (lab) => {
      const n = lab.slider("Birds", 10, 400, 160, { step: 10 }).value;
      const sep = lab.slider("Separation", 0, 3, 1.5, { step: 0.05, group: "Rules" }).value;
      const ali = lab.slider("Alignment", 0, 3, 1, { step: 0.05, group: "Rules" }).value;
      const coh = lab.slider("Cohesion", 0, 3, 1, { step: 0.05, group: "Rules" }).value;
      const radius = lab.slider("Sight radius", 2, 30, 10, { step: 0.5, group: "Rules" }).value;
      const speed = lab.slider("Speed", 5, 40, 18, { step: 1, group: "Rules" }).value;
      const trails = lab.toggle("Trails", false, { group: "Display" }).value;
      const showSight = lab.toggle("Show one bird's sight", false, { group: "Display" }).value;
      lab.button("Scatter", () => { birds = []; spawn(n); });
      lab.button("Remove columns", () => { obstacles.length = 0; });
      spawn(n);

      const toWorld = (px: number, py: number): [number, number] => [(px - view.ox) / view.s, (py - view.oy) / view.s];
      lab.onPointerDown((p) => {
        const [x, y] = toWorld(p.x, p.y);
        if (x < 0 || y < 0 || x > W || y > H) return;
        const hit = obstacles.findIndex(([ox, oy]) => Math.hypot(ox - x, oy - y) < 4);
        if (hit >= 0) obstacles.splice(hit, 1); else obstacles.push([x, y]);
      });
      lab.onPointerMove((p) => {
        const [x, y] = toWorld(p.x, p.y);
        predator = x >= 0 && y >= 0 && x <= W && y <= H ? [x, y] : null;
      });
      lab.once(() => lab.canvas.addEventListener("pointerleave", () => { predator = null; }));

      lab.animate((_t, dt) => {
        if (!env.visible) return;
        const h = Math.min(dt, 1 / 30);
        const R2 = radius * radius;
        // uniform grid for neighbour search
        const cell = Math.max(radius, 4), gx = Math.ceil(W / cell), gy = Math.ceil(H / cell);
        const grid: number[][] = Array.from({ length: gx * gy }, () => []);
        birds.forEach((b, i) => grid[Math.min(gx - 1, Math.floor(b.x / cell)) + Math.min(gy - 1, Math.floor(b.y / cell)) * gx].push(i));
        for (const b of birds) {
          let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, k = 0;
          const bx = Math.floor(b.x / cell), by = Math.floor(b.y / cell);
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            const list = grid[((bx + dx + gx) % gx) + ((by + dy + gy) % gy) * gx];
            for (const j of list) {
              const o = birds[j];
              if (o === b) continue;
              let ddx = o.x - b.x, ddy = o.y - b.y;
              if (ddx > W / 2) ddx -= W; if (ddx < -W / 2) ddx += W;
              if (ddy > H / 2) ddy -= H; if (ddy < -H / 2) ddy += H;
              const d2 = ddx * ddx + ddy * ddy;
              if (d2 > R2) continue;
              k++;
              cx += ddx; cy += ddy;
              ax += o.vx; ay += o.vy;
              const d = Math.sqrt(d2) || 1e-3;
              if (d < radius * 0.4) { sx -= ddx / (d * d); sy -= ddy / (d * d); }
            }
          }
          let fx = 0, fy = 0;
          if (k) {
            fx += coh * (cx / k) * 1.2 + ali * (ax / k - b.vx) * 2.5 + sep * sx * 18;
            fy += coh * (cy / k) * 1.2 + ali * (ay / k - b.vy) * 2.5 + sep * sy * 18;
          }
          for (const [ox, oy] of obstacles) {
            const ddx = b.x - ox, ddy = b.y - oy, d = Math.hypot(ddx, ddy);
            if (d < 9) { fx += (ddx / d) * (9 - d) * 20; fy += (ddy / d) * (9 - d) * 20; }
          }
          if (predator) {
            const ddx = b.x - predator[0], ddy = b.y - predator[1], d = Math.hypot(ddx, ddy);
            if (d < 20) { fx += (ddx / d) * (20 - d) * 12; fy += (ddy / d) * (20 - d) * 12; }
          }
          b.vx += fx * h; b.vy += fy * h;
          const s = Math.hypot(b.vx, b.vy) || 1;
          const target = Math.min(speed * 1.6, Math.max(speed * 0.6, s));
          b.vx *= target / s; b.vy *= target / s;
          b.x = (b.x + b.vx * h + W) % W; b.y = (b.y + b.vy * h + H) % H;
        }
        // polarisation: 1 = everybody flies the same way
        let mx = 0, my = 0;
        for (const b of birds) { const s = Math.hypot(b.vx, b.vy) || 1; mx += b.vx / s; my += b.vy / s; }
        lab.log("Birds", birds.length);
        lab.log("Order (polarisation)", (Math.hypot(mx, my) / Math.max(1, birds.length)).toFixed(2));
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        const h = hh - BAR;
        const s = Math.min((w - 20) / W, (h - 20) / H);
        view = { s, ox: (w - W * s) / 2, oy: (h - H * s) / 2 };
        if (trails) {
          ctx.globalAlpha = 0.12; ctx.fillStyle = P.paper; ctx.fillRect(0, 0, w, hh); ctx.globalAlpha = 1;
          ctx.strokeStyle = P.ink; ctx.fillStyle = P.ink; ctx.lineWidth = 1;
        } else clear(ctx, w, hh);
        ctx.strokeStyle = P.grey(0.3); ctx.lineWidth = 1;
        ctx.strokeRect(view.ox + 0.5, view.oy + 0.5, W * s, H * s);
        ctx.fillStyle = P.ink;
        for (const [ox, oy] of obstacles) dot(ctx, view.ox + ox * s, view.oy + oy * s, 2.5 * s);
        for (const b of birds) {
          const v = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / v, uy = b.vy / v;
          const X = view.ox + b.x * s, Y = view.oy + b.y * s, L = 1.8 * s, Wd = 0.7 * s;
          ctx.beginPath();
          ctx.moveTo(X + ux * L, Y + uy * L);
          ctx.lineTo(X - ux * L * 0.6 - uy * Wd, Y - uy * L * 0.6 + ux * Wd);
          ctx.lineTo(X - ux * L * 0.6 + uy * Wd, Y - uy * L * 0.6 - ux * Wd);
          ctx.closePath();
          ctx.fill();
        }
        if (showSight && birds.length) {
          const b = birds[0];
          ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          dot(ctx, view.ox + b.x * s, view.oy + b.y * s, radius * s, false);
          ctx.setLineDash([]);
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "click to place or remove a column · the pointer scares the flock", view.ox, view.oy - 5 > 10 ? view.oy - 5 : 12, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
