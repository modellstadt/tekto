/**
 * Tekto Segment — A line segment in 3D space defined by two endpoints.
 *
 * Mirrors HDGEO.Core.Segment.
 */

import { Vec3 } from "../math/vectors";
import { HMath } from "../math/HMath";
import { AABB } from "./AABB";
import { VecMath } from "../math/VecMath";

export class Segment {
  constructor(
    public readonly a: Vec3,
    public readonly b: Vec3
  ) {}

  get direction(): Vec3 { return this.b.sub(this.a); }
  get length(): number { return this.a.distTo(this.b); }
  get lengthSquared(): number { return this.a.distSqTo(this.b); }
  get midpoint(): Vec3 { return this.a.add(this.b).mul(0.5); }

  /** Point on segment at parameter t (0=A, 1=B). */
  pointAt(t: number): Vec3 { return this.a.lerp(this.b, t); }

  /** Closest point on this segment to point p. */
  closestPoint(p: Vec3): Vec3 {
    const ab = this.b.sub(this.a);
    const abSq = ab.lenSq();
    if (abSq < HMath.EPSILON) return this.a;
    const t = HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
    return this.a.add(ab.mul(t));
  }

  /** Parameter t of the closest point on the segment to p (clamped 0..1). */
  closestParameter(p: Vec3): number {
    const ab = this.b.sub(this.a);
    const abSq = ab.lenSq();
    if (abSq < HMath.EPSILON) return 0;
    return HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
  }

  /** Distance from a point to this segment. */
  distanceTo(p: Vec3): number {
    return p.distTo(this.closestPoint(p));
  }

  /** Squared distance from a point to this segment. */
  distanceSquaredTo(p: Vec3): number {
    return p.distSqTo(this.closestPoint(p));
  }

  /** Bounding box of this segment. */
  get bounds(): AABB {
    return new AABB(
      new Vec3(Math.min(this.a.x, this.b.x), Math.min(this.a.y, this.b.y), Math.min(this.a.z, this.b.z)),
      new Vec3(Math.max(this.a.x, this.b.x), Math.max(this.a.y, this.b.y), Math.max(this.a.z, this.b.z))
    );
  }

  /** Splits a segment into n equal parts, returning n+1 points. */
  static split(a: Vec3, b: Vec3, segments: number): Vec3[] {
    if (segments < 1) segments = 1;
    const pts: Vec3[] = [];
    for (let i = 0; i <= segments; i++)
      pts.push(a.lerp(b, i / segments));
    return pts;
  }

  /**
   * Finds the closest points between this segment and another.
   * Returns { c1, c2 } — points on this segment and the other.
   */
  closestPointsTo(other: Segment): { c1: Vec3; c2: Vec3 } {
    return VecMath.closestPointsSegmentSegment(this.a, this.b, other.a, other.b);
  }

  /** Shortest distance between two segments. */
  distanceToSegment(other: Segment): number {
    const { c1, c2 } = this.closestPointsTo(other);
    return c1.distTo(c2);
  }

  /** Returns a new segment reversed (B→A). */
  reversed(): Segment { return new Segment(this.b, this.a); }

  toString(): string { return `Segment [${this.a} → ${this.b}]`; }
}

// Backward-compat: keep standalone functions
export function closestPointOnSegment(p: Vec3, a: Vec3, b: Vec3): Vec3 {
  const ab = b.sub(a);
  const lenSq = ab.lenSq();
  if (lenSq < HMath.EPSILON) return a;
  const t = HMath.clamp(p.sub(a).dot(ab) / lenSq, 0, 1);
  return a.add(ab.mul(t));
}

export function segmentSegmentClosest(
  a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3
): { pointA: Vec3; pointB: Vec3; t: number; u: number } {
  const d1 = a2.sub(a1), d2 = b2.sub(b1), r = a1.sub(b1);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);

  let t: number, u: number;
  if (a <= HMath.EPSILON && e <= HMath.EPSILON) {
    return { pointA: a1, pointB: b1, t: 0, u: 0 };
  }
  if (a <= HMath.EPSILON) {
    t = 0; u = HMath.clamp(f / e, 0, 1);
  } else {
    const c = d1.dot(r);
    if (e <= HMath.EPSILON) {
      u = 0; t = HMath.clamp(-c / a, 0, 1);
    } else {
      const b = d1.dot(d2);
      const denom = a * e - b * b;
      t = denom !== 0 ? HMath.clamp((b * f - c * e) / denom, 0, 1) : 0;
      u = (b * t + f) / e;
      if (u < 0) { u = 0; t = HMath.clamp(-c / a, 0, 1); }
      else if (u > 1) { u = 1; t = HMath.clamp((b - c) / a, 0, 1); }
    }
  }

  return {
    pointA: a1.add(d1.mul(t)),
    pointB: b1.add(d2.mul(u)),
    t, u
  };
}
