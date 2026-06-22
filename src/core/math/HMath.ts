/**
 * Tekto HMath — Scalar math utilities.
 *
 * Mirrors HDGEO.Core.HMath.
 */

export const HMath = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,
  EPSILON: 1e-10,

  clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  },

  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  smoothstep(edge0: number, edge1: number, x: number): number {
    const t = HMath.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },

  /** Map value from one range to another */
  remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
  },

  almostEqual(a: number, b: number, eps = 1e-10): boolean {
    return Math.abs(a - b) < eps;
  },

  /** Returns t in [0,1] if angle lies within arc(startAngle, sweepAngle), else null. */
  sweepFraction(angle: number, startAngle: number, sweepAngle: number): number | null {
    if (Math.abs(sweepAngle) < 1e-12) return null;
    let delta = angle - startAngle;
    const TAU = Math.PI * 2;
    if (sweepAngle > 0) { delta = ((delta % TAU) + TAU) % TAU; }
    else { delta = -((((-delta) % TAU) + TAU) % TAU); }
    const t = delta / sweepAngle;
    return (t >= -1e-9 && t <= 1 + 1e-9) ? Math.max(0, Math.min(1, t)) : null;
  },

  /** Solve quadratic Bezier (1-t)²a + 2(1-t)t·b + t²c = target for t ∈ [0,1]. Returns t or null. */
  solveQuadraticBezier(a: number, b: number, c: number, target: number): number | null {
    const A = a - 2 * b + c;
    const B = 2 * (b - a);
    const C = a - target;
    if (Math.abs(A) < 1e-12) {
      if (Math.abs(B) < 1e-12) return null;
      const t = -C / B;
      return (t >= -1e-6 && t <= 1 + 1e-6) ? Math.max(0, Math.min(1, t)) : null;
    }
    const disc = B * B - 4 * A * C;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const t1 = (-B - sq) / (2 * A);
    const t2 = (-B + sq) / (2 * A);
    for (const t of [t1, t2]) {
      if (t >= -1e-6 && t <= 1 + 1e-6) return Math.max(0, Math.min(1, t));
    }
    return null;
  },
};

/** Backward-compat alias */
export const MathUtils = HMath;
