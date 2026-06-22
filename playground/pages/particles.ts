/**
 * Particles 2D — bouncing particle simulation.
 * Port of HDGEO ParticleTestPage.
 */
import { sketch, SketchInstance, Vec2 } from "../../src";

// Simulation state persists across sketch re-runs
interface ParticleState {
  pos: Vec2[];
  vel: Vec2[];
  radius: number[];
  color: string[];
}

let state: ParticleState | null = null;
let stateSeed = -1;
let stateCount = -1;

function hsvToRgb(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return `rgb(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)})`;
}

function createState(count: number, seed: number, minR: number, maxR: number,
                     boundX: number, boundY: number): ParticleState {
  // Simple seeded random
  let s = seed;
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };

  const pos: Vec2[] = [];
  const vel: Vec2[] = [];
  const radius: number[] = [];
  const color: string[] = [];

  for (let i = 0; i < count; i++) {
    const r = minR + rand() * (maxR - minR);
    radius.push(r);
    pos.push(new Vec2(
      (rand() * 2 - 1) * (boundX - r),
      (rand() * 2 - 1) * (boundY - r),
    ));
    vel.push(new Vec2(
      (rand() * 2 - 1) * 3,
      (rand() * 2 - 1) * 3,
    ));
    color.push(hsvToRgb(rand() * 360, 0.6, 0.9));
  }

  return { pos, vel, radius, color };
}

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const count = lab.slider("Count", 2, 300, 80, { step: 1 });
    const seed = lab.slider("Seed", 0, 1000, 42, { step: 1 });
    const minRadius = lab.slider("Min Radius", 0.02, 0.3, 0.08);
    const maxRadius = lab.slider("Max Radius", 0.1, 0.5, 0.25);
    const gravity = lab.slider("Gravity", -30, 30, -9.81);
    const damping = lab.slider("Damping", 0.9, 1.0, 0.99);
    const restitution = lab.slider("Restitution", 0, 1, 0.8);
    const boundX = lab.slider("Bound X", 1, 10, 5);
    const boundY = lab.slider("Bound Y", 1, 10, 5);
    const paused = lab.toggle("Pause", false);

    // Reset state when count or seed changes
    if (!state || stateCount !== count.value || stateSeed !== seed.value) {
      state = createState(count.value, seed.value, minRadius.value, maxRadius.value,
                          boundX.value, boundY.value);
      stateCount = count.value;
      stateSeed = seed.value;
    }

    // Draw boundary
    const bx = boundX.value, by = boundY.value;
    lab.line(-bx, 0, -by, bx, 0, -by).color("#666680");
    lab.line(bx, 0, -by, bx, 0, by).color("#666680");
    lab.line(bx, 0, by, -bx, 0, by).color("#666680");
    lab.line(-bx, 0, by, -bx, 0, -by).color("#666680");

    // Draw particles as circles (line loops on the XZ plane)
    const seg = 16;
    for (let i = 0; i < state.pos.length; i++) {
      const px = state.pos[i].x;
      const pz = state.pos[i].y; // 2D Y → 3D Z
      const r = state.radius[i];
      lab.beginShape("line_strip");
      for (let j = 0; j <= seg; j++) {
        const a = Math.PI * 2 * j / seg;
        lab.vertex(px + r * Math.cos(a), 0.01, pz + r * Math.sin(a));
      }
      lab.endShape()?.color(state.color[i]);
    }

    // Physics update
    lab.animate((_time, dt) => {
      if (paused.value || !state) return;
      dt = Math.min(dt, 1 / 30);

      const n = state.pos.length;
      const g = gravity.value;
      const damp = damping.value;
      const rest = restitution.value;
      const bxv = boundX.value;
      const byv = boundY.value;

      // Semi-implicit Euler
      for (let i = 0; i < n; i++) {
        state.vel[i] = new Vec2(
          state.vel[i].x,
          state.vel[i].y + g * dt,
        );
        const dampFactor = Math.pow(damp, dt);
        state.vel[i] = new Vec2(state.vel[i].x * dampFactor, state.vel[i].y * dampFactor);
        state.pos[i] = new Vec2(
          state.pos[i].x + state.vel[i].x * dt,
          state.pos[i].y + state.vel[i].y * dt,
        );
      }

      // Wall collisions
      for (let i = 0; i < n; i++) {
        const r = state.radius[i];
        let px = state.pos[i].x, py = state.pos[i].y;
        let vx = state.vel[i].x, vy = state.vel[i].y;

        if (px - r < -bxv) { px = -bxv + r; vx = Math.abs(vx) * rest; }
        else if (px + r > bxv) { px = bxv - r; vx = -Math.abs(vx) * rest; }
        if (py - r < -byv) { py = -byv + r; vy = Math.abs(vy) * rest; }
        else if (py + r > byv) { py = byv - r; vy = -Math.abs(vy) * rest; }

        state.pos[i] = new Vec2(px, py);
        state.vel[i] = new Vec2(vx, vy);
      }

      // Circle-circle collisions
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = state.pos[j].x - state.pos[i].x;
          const dy = state.pos[j].y - state.pos[i].y;
          const distSq = dx * dx + dy * dy;
          const minDist = state.radius[i] + state.radius[j];

          if (distSq >= minDist * minDist || distSq < 1e-8) continue;

          const dist = Math.sqrt(distSq);
          const nx = dx / dist, ny = dy / dist;
          const overlap = minDist - dist;

          state.pos[i] = new Vec2(state.pos[i].x - nx * overlap * 0.5,
                                   state.pos[i].y - ny * overlap * 0.5);
          state.pos[j] = new Vec2(state.pos[j].x + nx * overlap * 0.5,
                                   state.pos[j].y + ny * overlap * 0.5);

          const relVelN = (state.vel[j].x - state.vel[i].x) * nx +
                          (state.vel[j].y - state.vel[i].y) * ny;
          if (relVelN < 0) {
            const impulse = -(1 + rest) * relVelN * 0.5;
            state.vel[i] = new Vec2(state.vel[i].x - nx * impulse,
                                     state.vel[i].y - ny * impulse);
            state.vel[j] = new Vec2(state.vel[j].x + nx * impulse,
                                     state.vel[j].y + ny * impulse);
          }
        }
      }
    });

    lab.button("Reset", () => { state = null; });
    lab.button("Kick", () => {
      if (!state) return;
      for (let i = 0; i < state.vel.length; i++) {
        state.vel[i] = new Vec2(
          state.vel[i].x + (Math.random() * 2 - 1) * 5,
          state.vel[i].y + (Math.random() * 2 - 1) * 5,
        );
      }
    });

    lab.log("Particles", state.pos.length);
  }, {
    container,
    title: "Particles 2D",
    background: 0x0a0b14,
    camera: [0, 15, 0],
    target: [0, 0, 0],
  });
}
