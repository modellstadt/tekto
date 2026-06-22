/**
 * Tekto AABB — Axis-Aligned Bounding Box.
 *
 * Mirrors HDGEO.Core.AABB.
 */

import { Vec3 } from "../math/vectors";

export class AABB {
  constructor(
    public readonly min: Vec3,
    public readonly max: Vec3
  ) {}

  static empty(): AABB {
    return new AABB(
      new Vec3(Infinity, Infinity, Infinity),
      new Vec3(-Infinity, -Infinity, -Infinity)
    );
  }

  static fromPoints(points: Vec3[]): AABB {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); minZ = Math.min(minZ, p.z);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); maxZ = Math.max(maxZ, p.z);
    }
    return new AABB(new Vec3(minX, minY, minZ), new Vec3(maxX, maxY, maxZ));
  }

  center(): Vec3 { return this.min.lerp(this.max, 0.5); }
  size(): Vec3 { return this.max.sub(this.min); }
  volume(): number { const s = this.size(); return s.x * s.y * s.z; }

  expand(point: Vec3): AABB {
    return new AABB(
      new Vec3(Math.min(this.min.x, point.x), Math.min(this.min.y, point.y), Math.min(this.min.z, point.z)),
      new Vec3(Math.max(this.max.x, point.x), Math.max(this.max.y, point.y), Math.max(this.max.z, point.z))
    );
  }

  union(other: AABB): AABB {
    return new AABB(
      new Vec3(Math.min(this.min.x, other.min.x), Math.min(this.min.y, other.min.y), Math.min(this.min.z, other.min.z)),
      new Vec3(Math.max(this.max.x, other.max.x), Math.max(this.max.y, other.max.y), Math.max(this.max.z, other.max.z))
    );
  }

  containsPoint(p: Vec3): boolean {
    return p.x >= this.min.x && p.x <= this.max.x &&
           p.y >= this.min.y && p.y <= this.max.y &&
           p.z >= this.min.z && p.z <= this.max.z;
  }

  intersectsAABB(other: AABB): boolean {
    return this.max.x >= other.min.x && this.min.x <= other.max.x &&
           this.max.y >= other.min.y && this.min.y <= other.max.y &&
           this.max.z >= other.min.z && this.min.z <= other.max.z;
  }

  toJSON() { return { min: this.min.toJSON(), max: this.max.toJSON() }; }
}
