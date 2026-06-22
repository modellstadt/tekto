/**
 * Tekto Capsule2D — A 2D capsule (stadium) shape.
 *
 * Defined by a center, half-length, radius, and angle.
 * The shape is the Minkowski sum of a line segment and a disk.
 *
 * Useful for: rigid body simulation, collision detection, hit testing.
 */

import { Vec2 } from "../math/vectors";

export class Capsule2D {
  constructor(
    /** Center position */
    public center: Vec2,
    /** Half the internal segment length */
    public halfLength: number,
    /** Endcap / tube radius */
    public radius: number,
    /** Rotation angle (radians) */
    public angle: number = 0,
  ) {}

  /** The two endpoint centers of the internal segment. */
  get endpoints(): [Vec2, Vec2] {
    const dir = Vec2.fromAngle(this.angle).mul(this.halfLength);
    return [this.center.sub(dir), this.center.add(dir)];
  }

  /** Full length including endcaps. */
  get totalLength(): number { return this.halfLength * 2 + this.radius * 2; }

  /** Approximate area. */
  get area(): number {
    return this.halfLength * 2 * this.radius * 2 + Math.PI * this.radius * this.radius;
  }

  /** Approximate mass (proportional to area). */
  get mass(): number {
    return (this.halfLength * 2 + Math.PI * this.radius) * this.radius * 0.01;
  }

  /** Approximate moment of inertia about center. */
  get inertia(): number {
    return this.mass * ((this.halfLength * 2) ** 2 + this.radius ** 2) / 6;
  }

  /** Three grab handles: endA, center, endB. */
  get handles(): [Vec2, Vec2, Vec2] {
    const [a, b] = this.endpoints;
    return [a, this.center, b];
  }

  /** Closest point on the internal segment to a world point. */
  closestSegmentPoint(p: Vec2): Vec2 {
    const [a, b] = this.endpoints;
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < 1e-12) return a;
    const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / abSq));
    return a.add(ab.mul(t));
  }

  /** Signed distance from capsule surface to a point. Negative = inside. */
  distToPoint(p: Vec2): number {
    return p.distTo(this.closestSegmentPoint(p)) - this.radius;
  }

  /** Test if a point is inside the capsule. */
  containsPoint(p: Vec2): boolean {
    return this.distToPoint(p) <= 0;
  }

  /** Hit-test handles first (rotation priority), then body (translate). */
  hitTest(p: Vec2, handleRadius: number): { type: "endA" | "center" | "endB" } | null {
    const [a, , b] = this.handles;
    const r2 = handleRadius * handleRadius;
    if (p.distSqTo(a) <= r2) return { type: "endA" };
    if (p.distSqTo(b) <= r2) return { type: "endB" };
    if (this.containsPoint(p)) return { type: "center" };
    return null;
  }

  /** Clone with optional overrides. */
  clone(): Capsule2D {
    return new Capsule2D(this.center, this.halfLength, this.radius, this.angle);
  }
}
