/**
 * Tekto Plane — Infinite plane (ax + by + cz + d = 0).
 *
 * Mirrors HDGEO.Core.Plane.
 */

import { Vec3 } from "../math/vectors";
import { HMath } from "../math/HMath";

export class Plane {
  /** ax + by + cz + d = 0 */
  constructor(
    public readonly normal: Vec3,
    public readonly d: number
  ) {}

  static fromPointNormal(point: Vec3, normal: Vec3): Plane {
    const n = normal.normalize();
    return new Plane(n, -n.dot(point));
  }

  static fromThreePoints(a: Vec3, b: Vec3, c: Vec3): Plane {
    const n = b.sub(a).cross(c.sub(a)).normalize();
    return new Plane(n, -n.dot(a));
  }

  static XY(): Plane { return new Plane(Vec3.unitZ(), 0); }
  static XZ(): Plane { return new Plane(Vec3.unitY(), 0); }
  static YZ(): Plane { return new Plane(Vec3.unitX(), 0); }

  distToPoint(point: Vec3): number {
    return this.normal.dot(point) + this.d;
  }

  projectPoint(point: Vec3): Vec3 {
    return point.sub(this.normal.mul(this.distToPoint(point)));
  }

  side(point: Vec3): -1 | 0 | 1 {
    const d = this.distToPoint(point);
    if (d > HMath.EPSILON) return 1;
    if (d < -HMath.EPSILON) return -1;
    return 0;
  }

  /** Reflects a vector off the plane (like a light ray bouncing). */
  reflectVector(direction: Vec3): Vec3 {
    return direction.reflect(this.normal);
  }

  /** Reflects a point to the other side of the plane. */
  reflectPoint(point: Vec3): Vec3 {
    const dist = this.distToPoint(point);
    return point.sub(this.normal.mul(2 * dist));
  }

  /** Returns a new plane with the normal flipped. */
  flipped(): Plane {
    return new Plane(this.normal.neg(), -this.d);
  }

  toJSON() { return { normal: this.normal.toJSON(), d: this.d }; }
}
