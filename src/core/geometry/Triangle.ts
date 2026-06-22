/**
 * Tekto Triangle primitive.
 *
 * Mirrors HDGEO.Core.Triangle.
 */

import { Vec3 } from "../math/vectors";
import { HMath } from "../math/HMath";
import { HPlane } from "./HPlane";
import { closestPointOnSegment } from "./Segment";

export class Triangle {
  constructor(
    public readonly a: Vec3,
    public readonly b: Vec3,
    public readonly c: Vec3
  ) {}

  normal(): Vec3 {
    return this.b.sub(this.a).cross(this.c.sub(this.a)).normalize();
  }

  area(): number {
    return this.b.sub(this.a).cross(this.c.sub(this.a)).len() * 0.5;
  }

  centroid(): Vec3 {
    return new Vec3(
      (this.a.x + this.b.x + this.c.x) / 3,
      (this.a.y + this.b.y + this.c.y) / 3,
      (this.a.z + this.b.z + this.c.z) / 3
    );
  }

  /** Barycentric coordinates of a point (assumes point is on triangle's plane) */
  barycentric(p: Vec3): Vec3 {
    const v0 = this.b.sub(this.a), v1 = this.c.sub(this.a), v2 = p.sub(this.a);
    const d00 = v0.dot(v0), d01 = v0.dot(v1), d11 = v1.dot(v1);
    const d20 = v2.dot(v0), d21 = v2.dot(v1);
    const denom = d00 * d11 - d01 * d01;
    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    return new Vec3(1 - v - w, v, w);
  }

  containsPoint(p: Vec3): boolean {
    const bary = this.barycentric(p);
    return bary.x >= -HMath.EPSILON && bary.y >= -HMath.EPSILON && bary.z >= -HMath.EPSILON;
  }

  closestPointTo(p: Vec3): Vec3 {
    const plane = HPlane.fromThreePoints(this.a, this.b, this.c);
    const proj = plane.projectPoint(p);
    if (this.containsPoint(proj)) return proj;

    const candidates = [
      closestPointOnSegment(p, this.a, this.b),
      closestPointOnSegment(p, this.b, this.c),
      closestPointOnSegment(p, this.c, this.a),
    ];
    let best = candidates[0], bestDist = p.distSqTo(best);
    for (let i = 1; i < 3; i++) {
      const d = p.distSqTo(candidates[i]);
      if (d < bestDist) { best = candidates[i]; bestDist = d; }
    }
    return best;
  }

  toJSON() { return { a: this.a.toJSON(), b: this.b.toJSON(), c: this.c.toJSON() }; }
}
