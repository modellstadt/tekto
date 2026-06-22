/**
 * Tekto OBB2D — Oriented Bounding Box in 2D space (minimum-area rectangle).
 *
 * Mirrors HDGEO.Core.OBB2D.
 */

import { Vec2 } from "../math/vectors";
import { HMath } from "../math/HMath";
import { VecMath } from "../math/VecMath";

export class OBB2D {
  constructor(
    public readonly center: Vec2,
    public readonly width: number,
    public readonly height: number,
    public readonly angle: number
  ) {}

  /** Unit direction along the width axis. */
  get axisU(): Vec2 { return VecMath.fromAngle2D(this.angle); }

  /** Unit direction along the height axis. */
  get axisV(): Vec2 { return VecMath.fromAngle2D(this.angle + Math.PI / 2); }

  get area(): number { return this.width * this.height; }

  /** Returns the 4 corners of the rectangle (CCW order). */
  get corners(): [Vec2, Vec2, Vec2, Vec2] {
    const u = this.axisU;
    const v = this.axisV;
    const hw = this.width * 0.5;
    const hh = this.height * 0.5;
    return [
      this.center.sub(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).add(v.mul(hh)),
      this.center.sub(u.mul(hw)).add(v.mul(hh)),
    ];
  }

  /** Tests whether a point lies inside the OBB. */
  contains(p: Vec2): boolean {
    const d = p.sub(this.center);
    const u = this.axisU;
    const v = this.axisV;
    const projU = Math.abs(d.dot(u));
    const projV = Math.abs(d.dot(v));
    return projU <= this.width * 0.5 + HMath.EPSILON
        && projV <= this.height * 0.5 + HMath.EPSILON;
  }

  toString(): string {
    return `OBB2D [Center:${this.center} W:${this.width.toFixed(3)} H:${this.height.toFixed(3)} Angle:${(this.angle * HMath.RAD2DEG).toFixed(1)}°]`;
  }
}
