/**
 * Tekto Sphere primitive.
 *
 * Mirrors HDGEO.Core.Sphere.
 */

import { Vec3 } from "../math/vectors";
import { HMath } from "../math/HMath";

export class Sphere {
  constructor(
    public readonly center: Vec3,
    public readonly radius: number
  ) {}

  containsPoint(p: Vec3): boolean {
    return this.center.distSqTo(p) <= this.radius * this.radius + HMath.EPSILON;
  }

  intersectsSphere(other: Sphere): boolean {
    const r = this.radius + other.radius;
    return this.center.distSqTo(other.center) <= r * r;
  }

  toJSON() { return { center: this.center.toJSON(), radius: this.radius }; }
}
