/**
 * Tekto RigidBody2D — 2D rigid body with capsule shape.
 *
 * 3 DOF: position (x,y), angle.
 * Supports force/torque application at world-space points,
 * velocity integration, and box constraint with angular impulse.
 */

import { Vec2 } from "../math/vectors";
import { Capsule2D } from "../geometry/Capsule2D";

export interface RigidBodyConfig {
  damping?: number;          // linear velocity decay per frame (default 0.984)
  angularDamping?: number;   // angular velocity decay per frame (default 0.975)
  wallRestitution?: number;  // wall bounce factor (default -0.4)
}

const DEFAULTS: Required<RigidBodyConfig> = {
  damping: 0.984,
  angularDamping: 0.975,
  wallRestitution: -0.4,
};

export class RigidBody2D {
  shape: Capsule2D;

  // Velocities
  vx = 0;
  vy = 0;
  va = 0;  // angular velocity

  // Derived from shape
  mass: number;
  inertia: number;

  // Config
  private cfg: Required<RigidBodyConfig>;

  constructor(shape: Capsule2D, config?: RigidBodyConfig) {
    this.shape = shape;
    this.mass = shape.mass;
    this.inertia = shape.inertia;
    this.cfg = { ...DEFAULTS, ...config };
  }

  // ── Convenience accessors ──

  get x() { return this.shape.center.x; }
  set x(v: number) { this.shape.center = new Vec2(v, this.shape.center.y); }

  get y() { return this.shape.center.y; }
  set y(v: number) { this.shape.center = new Vec2(this.shape.center.x, v); }

  get angle() { return this.shape.angle; }
  set angle(v: number) { this.shape.angle = v; }

  get position() { return this.shape.center; }
  set position(v: Vec2) { this.shape.center = v; }

  // ── Physics ──

  /**
   * Apply a force at a world-space point.
   * Generates both linear acceleration and torque.
   */
  applyForceAt(fx: number, fy: number, px: number, py: number): void {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
    const rx = px - this.x;
    const ry = py - this.y;
    this.va += (rx * fy - ry * fx) / this.inertia;
  }

  /** Apply a central force (no torque). */
  applyForce(fx: number, fy: number): void {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }

  /** Integrate velocities → positions with damping. */
  integrate(gravity = 0): void {
    this.vy += gravity;
    this.vx *= this.cfg.damping;
    this.vy *= this.cfg.damping;
    this.va *= this.cfg.angularDamping;
    this.shape.center = new Vec2(this.x + this.vx, this.y + this.vy);
    this.shape.angle += this.va;
  }

  /** Constrain capsule inside a rectangular box. Produces angular impulse on wall hits. */
  constrainToBox(bx: number, by: number, bw: number, bh: number): void {
    const [a, b] = this.shape.endpoints;
    const r = this.shape.radius;
    const rest = this.cfg.wallRestitution;

    for (const p of [a, b]) {
      if (p.x - r < bx) {
        const pen = bx - (p.x - r);
        this.x += pen;
        if (this.vx < 0) this.vx *= rest;
        this.va += (p.y - this.y) * pen * 0.01 / this.inertia;
      }
      if (p.x + r > bx + bw) {
        const pen = p.x + r - (bx + bw);
        this.x -= pen;
        if (this.vx > 0) this.vx *= rest;
        this.va -= (p.y - this.y) * pen * 0.01 / this.inertia;
      }
      if (p.y - r < by) {
        const pen = by - (p.y - r);
        this.y += pen;
        if (this.vy < 0) this.vy *= rest;
        this.va -= (p.x - this.x) * pen * 0.01 / this.inertia;
      }
      if (p.y + r > by + bh) {
        const pen = p.y + r - (by + bh);
        this.y -= pen;
        if (this.vy > 0) this.vy *= rest;
        this.va += (p.x - this.x) * pen * 0.01 / this.inertia;
      }
    }
  }

  /** Kill all velocities. */
  stop(): void {
    this.vx = 0;
    this.vy = 0;
    this.va = 0;
  }
}

// ─── Spring between two rigid bodies ─────────

export interface SpringConfig {
  stiffness?: number;   // default 0.35
  damping?: number;     // default 0.055
}

/**
 * A spring connecting two RigidBody2D surfaces.
 * Attaches at the closest surface points between capsule segments.
 */
export class Spring2D {
  bodyA: RigidBody2D;
  bodyB: RigidBody2D;
  restLength: number;
  stiffness: number;
  damping: number;

  /** Cached surface attachment points (for rendering). */
  surfA: Vec2 | null = null;
  surfB: Vec2 | null = null;
  /** Current stretch beyond rest length. */
  stretch = 0;

  constructor(a: RigidBody2D, b: RigidBody2D, restLength: number, config?: SpringConfig) {
    this.bodyA = a;
    this.bodyB = b;
    this.restLength = restLength;
    this.stiffness = config?.stiffness ?? 0.35;
    this.damping = config?.damping ?? 0.055;
  }

  /** Compute and apply spring + damping forces for one timestep. */
  apply(): void {
    const [a0, a1] = this.bodyA.shape.endpoints;
    const [b0, b1] = this.bodyB.shape.endpoints;
    const { pA, pB } = segSegClosest2D(a0, a1, b0, b1);

    const d = pB.sub(pA);
    const dist = d.len() || 1e-6;
    const n = d.div(dist);

    const surfDist = dist - this.bodyA.shape.radius - this.bodyB.shape.radius;
    const stretch = surfDist - this.restLength;

    const dvx = this.bodyB.vx - this.bodyA.vx;
    const dvy = this.bodyB.vy - this.bodyA.vy;
    const dampF = (dvx * n.x + dvy * n.y) * this.damping;

    const force = stretch * this.stiffness + dampF;
    const fx = n.x * force;
    const fy = n.y * force;

    this.bodyA.applyForceAt(fx, fy, pA.x, pA.y);
    this.bodyB.applyForceAt(-fx, -fy, pB.x, pB.y);

    // Cache for rendering
    this.surfA = pA.add(n.mul(this.bodyA.shape.radius));
    this.surfB = pB.sub(n.mul(this.bodyB.shape.radius));
    this.stretch = stretch;
  }
}

/**
 * Repel two rigid bodies if their capsule surfaces overlap.
 */
export function repelBodies(a: RigidBody2D, b: RigidBody2D, stiffness = 1.2): void {
  const [a0, a1] = a.shape.endpoints;
  const [b0, b1] = b.shape.endpoints;
  const { pA, pB } = segSegClosest2D(a0, a1, b0, b1);

  const d = pB.sub(pA);
  const dist = d.len() || 1e-6;
  const minDist = a.shape.radius + b.shape.radius + 2;

  if (dist < minDist) {
    const pen = minDist - dist;
    const n = d.div(dist);
    const f = pen * stiffness;
    a.applyForceAt(-n.x * f, -n.y * f, pA.x, pA.y);
    b.applyForceAt(n.x * f, n.y * f, pB.x, pB.y);
  }
}

// ─── 2D segment-segment closest point ────────

function segSegClosest2D(
  a0: Vec2, a1: Vec2, b0: Vec2, b1: Vec2,
): { pA: Vec2; pB: Vec2 } {
  const da = a1.sub(a0);
  const db = b1.sub(b0);
  const r0 = a0.sub(b0);

  const aa = da.dot(da);
  const ee = db.dot(db);
  const ff = db.dot(r0);

  let s: number, t: number;

  if (aa < 1e-8 && ee < 1e-8) {
    s = 0; t = 0;
  } else if (aa < 1e-8) {
    s = 0; t = clamp01(ff / ee);
  } else {
    const cc = da.dot(r0);
    if (ee < 1e-8) {
      t = 0; s = clamp01(-cc / aa);
    } else {
      const bb = da.dot(db);
      const denom = aa * ee - bb * bb;
      s = denom !== 0 ? clamp01((bb * ff - cc * ee) / denom) : 0;
      t = (bb * s + ff) / ee;
      if (t < 0) { t = 0; s = clamp01(-cc / aa); }
      else if (t > 1) { t = 1; s = clamp01((bb - cc) / aa); }
    }
  }

  return {
    pA: a0.add(da.mul(s)),
    pB: b0.add(db.mul(t)),
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
