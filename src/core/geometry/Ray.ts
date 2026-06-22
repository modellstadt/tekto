/**
 * Tekto Ray — origin + direction with intersection tests.
 *
 * Mirrors HDGEO.Core.Ray.
 */

import { Vec3 } from "../math/vectors";
import { HMath } from "../math/HMath";
import { HPlane } from "./HPlane";
import { Triangle } from "./Triangle";
import { Sphere } from "./Sphere";
import { AABB } from "./AABB";

export class Ray {
  constructor(
    public readonly origin: Vec3,
    public readonly direction: Vec3
  ) {}

  at(t: number): Vec3 {
    return this.origin.add(this.direction.mul(t));
  }

  closestPointTo(point: Vec3): Vec3 {
    const t = Math.max(0, point.sub(this.origin).dot(this.direction));
    return this.at(t);
  }

  distToPoint(point: Vec3): number {
    return this.closestPointTo(point).distTo(point);
  }

  intersectPlane(plane: HPlane): { t: number; point: Vec3 } | null {
    const denom = this.direction.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(this.origin.dot(plane.normal) + plane.d) / denom;
    if (t < 0) return null;
    return { t, point: this.at(t) };
  }

  intersectTriangle(tri: Triangle): { t: number; point: Vec3; u: number; v: number } | null {
    const edge1 = tri.b.sub(tri.a);
    const edge2 = tri.c.sub(tri.a);
    const h = this.direction.cross(edge2);
    const a = edge1.dot(h);
    if (Math.abs(a) < HMath.EPSILON) return null;

    const f = 1 / a;
    const s = this.origin.sub(tri.a);
    const u = f * s.dot(h);
    if (u < 0 || u > 1) return null;

    const q = s.cross(edge1);
    const v = f * this.direction.dot(q);
    if (v < 0 || u + v > 1) return null;

    const t = f * edge2.dot(q);
    if (t < HMath.EPSILON) return null;

    return { t, point: this.at(t), u, v };
  }

  intersectSphere(sphere: Sphere): { t: number; point: Vec3 }[] {
    const oc = this.origin.sub(sphere.center);
    const a = this.direction.dot(this.direction);
    const b = 2 * oc.dot(this.direction);
    const c = oc.dot(oc) - sphere.radius * sphere.radius;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return [];

    const sqrtDisc = Math.sqrt(disc);
    const results: { t: number; point: Vec3 }[] = [];
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    if (t1 >= 0) results.push({ t: t1, point: this.at(t1) });
    if (t2 >= 0 && !HMath.almostEqual(t1, t2)) results.push({ t: t2, point: this.at(t2) });
    return results;
  }

  intersectAABB(box: AABB): { tMin: number; tMax: number } | null {
    let tMin = -Infinity, tMax = Infinity;
    const invD = [1 / this.direction.x, 1 / this.direction.y, 1 / this.direction.z];
    const orig = this.origin.toArray();
    const bMin = box.min.toArray();
    const bMax = box.max.toArray();

    for (let i = 0; i < 3; i++) {
      let t0 = (bMin[i] - orig[i]) * invD[i];
      let t1 = (bMax[i] - orig[i]) * invD[i];
      if (invD[i] < 0) [t0, t1] = [t1, t0];
      tMin = Math.max(tMin, t0);
      tMax = Math.min(tMax, t1);
      if (tMax < tMin) return null;
    }
    return { tMin, tMax };
  }

  toJSON() { return { origin: this.origin.toJSON(), direction: this.direction.toJSON() }; }
}
