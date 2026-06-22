/**
 * Tekto SDF — Signed Distance Fields: primitives, boolean/smooth ops,
 * modifiers, lattices, microstructures, and utilities.
 *
 * Mirrors HDGEO.Core.SDF.
 */

import { Vec3, Mat4 } from "../math/vectors";
import { HMath } from "../math/HMath";

const EPSILON = HMath.EPSILON;
const TWO_PI = Math.PI * 2;

// ═════════════════════════════════════════════
// ISdf Interface
// ═════════════════════════════════════════════

export interface ISdf {
  distance(point: Vec3): number;
}

// ═════════════════════════════════════════════
// Primitives
// ═════════════════════════════════════════════

export class SdfSphere implements ISdf {
  constructor(public radius: number, public center = Vec3.zero()) {}
  distance(p: Vec3): number { return p.sub(this.center).len() - this.radius; }
}

export class SdfBox implements ISdf {
  constructor(public halfExtents: Vec3, public center = Vec3.zero()) {}

  static fromSize(sx: number, sy: number, sz: number): SdfBox {
    return new SdfBox(new Vec3(sx * 0.5, sy * 0.5, sz * 0.5));
  }

  distance(p: Vec3): number {
    const d = p.sub(this.center);
    const qx = Math.abs(d.x) - this.halfExtents.x;
    const qy = Math.abs(d.y) - this.halfExtents.y;
    const qz = Math.abs(d.z) - this.halfExtents.z;
    const outside = new Vec3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)).len();
    const inside = Math.min(Math.max(qx, Math.max(qy, qz)), 0);
    return outside + inside;
  }
}

export class SdfCapsule implements ISdf {
  constructor(public a: Vec3, public b: Vec3, public radius: number) {}

  distance(p: Vec3): number {
    const ab = this.b.sub(this.a);
    const abSq = ab.dot(ab);
    const t = abSq < EPSILON ? 0 : HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
    return p.sub(this.a.add(ab.mul(t))).len() - this.radius;
  }
}

export class SdfCylinder implements ISdf {
  constructor(public a: Vec3, public b: Vec3, public radius: number) {}

  static vertical(height: number, radius: number): SdfCylinder {
    return new SdfCylinder(
      new Vec3(0, -height * 0.5, 0),
      new Vec3(0, height * 0.5, 0),
      radius,
    );
  }

  distance(p: Vec3): number {
    const ab = this.b.sub(this.a);
    const abLen = ab.len();
    if (abLen < EPSILON) return p.sub(this.a).len() - this.radius;

    const axis = ab.mul(1 / abLen);
    const ap = p.sub(this.a);
    const h = ap.dot(axis);
    const radial = ap.sub(axis.mul(h));
    const r = radial.len();

    const dR = r - this.radius;
    const dH = Math.max(-h, h - abLen);

    if (dR <= 0 && dH <= 0) return Math.max(dR, dH);
    if (dR > 0 && dH > 0) return Math.sqrt(dR * dR + dH * dH);
    return Math.max(dR, dH);
  }
}

export class SdfCone implements ISdf {
  constructor(
    public a: Vec3, public b: Vec3,
    public radiusA: number, public radiusB: number,
  ) {}

  distance(p: Vec3): number {
    const ab = this.b.sub(this.a);
    const abLen = ab.len();
    if (abLen < EPSILON)
      return p.sub(this.a).len() - Math.max(this.radiusA, this.radiusB);

    const axis = ab.mul(1 / abLen);
    const ap = p.sub(this.a);
    const h = ap.dot(axis);
    const t = HMath.clamp(h / abLen, 0, 1);
    const r = ap.sub(axis.mul(h)).len();
    const rAtH = this.radiusA + (this.radiusB - this.radiusA) * t;

    const dR = r - rAtH;
    const dH = Math.max(-h, h - abLen);

    if (dR <= 0 && dH <= 0) return Math.max(dR, dH);
    if (dR > 0 && dH > 0) return Math.sqrt(dR * dR + dH * dH);
    return Math.max(dR, dH);
  }
}

export class SdfTorus implements ISdf {
  constructor(public majorRadius: number, public minorRadius: number) {}

  distance(p: Vec3): number {
    const qx = Math.sqrt(p.x * p.x + p.z * p.z) - this.majorRadius;
    return Math.sqrt(qx * qx + p.y * p.y) - this.minorRadius;
  }
}

export class SdfEllipsoid implements ISdf {
  constructor(public radii: Vec3) {}

  distance(p: Vec3): number {
    const scaled = new Vec3(p.x / this.radii.x, p.y / this.radii.y, p.z / this.radii.z);
    const scaled2 = new Vec3(
      p.x / (this.radii.x * this.radii.x),
      p.y / (this.radii.y * this.radii.y),
      p.z / (this.radii.z * this.radii.z),
    );
    const k0 = scaled.len();
    const k1 = scaled2.len();
    return k1 < EPSILON ? 0 : k0 * (k0 - 1) / k1;
  }
}

export class SdfPlane implements ISdf {
  normal: Vec3;
  d: number;

  constructor(normal: Vec3, dOrPoint: number | Vec3) {
    this.normal = normal.normalize();
    if (typeof dOrPoint === "number") {
      this.d = dOrPoint;
    } else {
      this.d = this.normal.dot(dOrPoint);
    }
  }

  distance(p: Vec3): number { return p.dot(this.normal) - this.d; }
}

export class SdfLine implements ISdf {
  constructor(public a: Vec3, public b: Vec3) {}

  distance(p: Vec3): number {
    const ab = this.b.sub(this.a);
    const abSq = ab.dot(ab);
    if (abSq < EPSILON) return p.sub(this.a).len();
    const t = p.sub(this.a).dot(ab) / abSq;
    return p.sub(this.a.add(ab.mul(t))).len();
  }
}

// ═════════════════════════════════════════════
// Boolean Operations
// ═════════════════════════════════════════════

export class SdfUnion implements ISdf {
  children: ISdf[];
  constructor(...children: ISdf[]) { this.children = children; }

  distance(p: Vec3): number {
    let min = Infinity;
    for (const c of this.children) min = Math.min(min, c.distance(p));
    return min;
  }
}

export class SdfIntersect implements ISdf {
  children: ISdf[];
  constructor(...children: ISdf[]) { this.children = children; }

  distance(p: Vec3): number {
    let max = -Infinity;
    for (const c of this.children) max = Math.max(max, c.distance(p));
    return max;
  }
}

export class SdfSubtract implements ISdf {
  constructor(public a: ISdf, public b: ISdf) {}
  distance(p: Vec3): number { return Math.max(this.a.distance(p), -this.b.distance(p)); }
}

// ═════════════════════════════════════════════
// Smooth Operations
// ═════════════════════════════════════════════

export class SdfBlend implements ISdf {
  constructor(public a: ISdf, public b: ISdf, public radius = 1) {}

  distance(p: Vec3): number {
    const dA = this.a.distance(p);
    const dB = this.b.distance(p);
    const e = Math.max(this.radius - Math.abs(dA - dB), 0);
    return Math.min(dA, dB) - e * e * 0.25 / this.radius;
  }
}

export class SdfSmoothSubtract implements ISdf {
  constructor(public a: ISdf, public b: ISdf, public radius = 1) {}

  distance(p: Vec3): number {
    const dA = this.a.distance(p);
    const dB = this.b.distance(p);
    const e = Math.max(this.radius - Math.abs(dA + dB), 0);
    return Math.max(dA, -dB) + e * e * 0.25 / this.radius;
  }
}

export class SdfSmoothUnion implements ISdf {
  constructor(public a: ISdf, public b: ISdf, public k = 1) {}

  distance(p: Vec3): number {
    const a = this.a.distance(p);
    const b = this.b.distance(p);
    const h = HMath.clamp(0.5 + 0.5 * (b - a) / this.k, 0, 1);
    const mix = b + h * (a - b);
    return mix - this.k * h * (1 - h);
  }
}

// ═════════════════════════════════════════════
// Modifiers
// ═════════════════════════════════════════════

export class SdfShell implements ISdf {
  constructor(public input: ISdf, public thickness = 1) {}
  distance(p: Vec3): number { return Math.abs(this.input.distance(p)) - this.thickness; }
}

export class SdfOnion implements ISdf {
  constructor(public input: ISdf, public thickness: number, public layers = 1) {}
  distance(p: Vec3): number {
    let d = this.input.distance(p);
    for (let i = 0; i < this.layers; i++) d = Math.abs(d) - this.thickness;
    return d;
  }
}

export class SdfTwist implements ISdf {
  constructor(
    public input: ISdf, public anglePerUnit: number,
    public z1 = -1, public z2 = 1,
  ) {}

  distance(p: Vec3): number {
    const range = this.z2 - this.z1;
    const t = range < EPSILON ? 0 : (p.z - this.z1) / range - 0.5;
    const theta = t * this.anglePerUnit;
    const c = Math.cos(theta), s = Math.sin(theta);
    return this.input.distance(new Vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z));
  }
}

export class SdfRevolution implements ISdf {
  constructor(public input: ISdf) {}
  distance(p: Vec3): number {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    return this.input.distance(new Vec3(r, p.y, 0));
  }
}

export class SdfExtrude implements ISdf {
  constructor(public input: ISdf) {}
  distance(p: Vec3): number { return this.input.distance(new Vec3(p.x, p.y, 0)); }
}

export class SdfBoundedExtrude implements ISdf {
  halfHeight: number;
  constructor(public input: ISdf, height: number) { this.halfHeight = height * 0.5; }
  distance(p: Vec3): number {
    const d2d = this.input.distance(new Vec3(p.x, p.y, 0));
    return Math.max(d2d, Math.abs(p.z) - this.halfHeight);
  }
}

export class SdfMirror implements ISdf {
  normal: Vec3;
  constructor(public input: ISdf, planeNormal: Vec3) {
    this.normal = planeNormal.normalize();
  }
  distance(p: Vec3): number {
    const d = p.dot(this.normal);
    const q = d < 0 ? p.sub(this.normal.mul(2 * d)) : p;
    return this.input.distance(q);
  }
}

export class SdfRadialArray implements ISdf {
  private deltaAngle: number;
  constructor(public input: ISdf, public count: number) {
    this.deltaAngle = TWO_PI / count;
  }
  distance(p: Vec3): number {
    let angle = Math.atan2(p.y, p.x);
    if (angle < 0) angle += TWO_PI;
    const closest = Math.round(angle / this.deltaAngle) * this.deltaAngle;
    const rot = closest - angle;
    const r = Math.sqrt(p.x * p.x + p.y * p.y);
    return this.input.distance(new Vec3(r * Math.cos(rot), r * Math.sin(rot), p.z));
  }
}

export class SdfTransform implements ISdf {
  private inverse: Mat4;
  constructor(public input: ISdf, transform: Mat4) {
    this.inverse = transform.invert();
  }
  setTransform(transform: Mat4): void {
    this.inverse = transform.invert();
  }
  distance(p: Vec3): number {
    return this.input.distance(this.inverse.transformPoint(p));
  }
}

export class SdfOffset implements ISdf {
  constructor(public input: ISdf, public amount: number) {}
  distance(p: Vec3): number { return this.input.distance(p) - this.amount; }
}

export class SdfGradient implements ISdf {
  constructor(public a: ISdf, public b: ISdf, public factor = 1) {}
  distance(p: Vec3): number { return this.a.distance(p) + this.factor * this.b.distance(p); }
}

export class SdfVoronoi implements ISdf {
  children: ISdf[];
  constructor(public offset = 0) { this.children = []; }
  distance(p: Vec3): number {
    let min1 = Infinity, min2 = Infinity;
    for (const c of this.children) {
      const d = c.distance(p);
      if (d < min1) { min2 = min1; min1 = d; }
      else if (d < min2) { min2 = d; }
    }
    return this.children.length > 0 ? Math.abs(min1 - min2) - this.offset : 0;
  }
}

// ═════════════════════════════════════════════
// SdfLattice (TPMS)
// ═════════════════════════════════════════════

export type LatticeType =
  | "schwarz" | "gyroid" | "diamond" | "lidinoid" | "neovius"
  | "fischerKoch" | "frd" | "doubleDiamond" | "doubleGyroid" | "s";

export class SdfLattice implements ISdf {
  constructor(
    public type: LatticeType = "gyroid",
    public scale = 1,
    public offset = 0,
    public shell = false,
  ) {}

  distance(p: Vec3): number {
    const a = p.x / this.scale;
    const b = p.y / this.scale;
    const c = p.z / this.scale;
    const { sin, cos } = Math;
    let value: number;

    switch (this.type) {
      case "schwarz":
        value = cos(a) + cos(b) + cos(c); break;
      case "gyroid":
        value = sin(a) * cos(b) + sin(b) * cos(c) + sin(c) * cos(a); break;
      case "diamond":
        value = sin(a) * sin(b) * sin(c)
              + sin(a) * cos(b) * cos(c)
              + cos(a) * sin(b) * cos(c)
              + cos(a) * cos(b) * sin(c); break;
      case "lidinoid":
        value = 0.5 * (sin(2*a)*cos(b)*sin(c) + sin(2*b)*cos(c)*sin(a) + sin(2*c)*cos(a)*sin(b))
              - 0.5 * (cos(2*a)*cos(2*b) + cos(2*b)*cos(2*c) + cos(2*c)*cos(2*a)) + 0.15; break;
      case "neovius":
        value = 3*cos(a) + cos(b) + cos(c) + 4*cos(a)*cos(b)*cos(c); break;
      case "fischerKoch":
        value = cos(2*a)*sin(b)*cos(c) + cos(2*b)*sin(c)*cos(a) + cos(2*c)*sin(a)*cos(b); break;
      case "frd":
        value = 8*cos(a)*cos(b)*cos(c)
              + cos(2*a)*cos(2*c)*cos(2*a)
              - (cos(2*a)*sin(2*b) + cos(2*b)*sin(2*c) + cos(2*c)*sin(2*a)); break;
      case "doubleDiamond":
        value = sin(2*a)*sin(2*b) + sin(2*b)*sin(2*c) + sin(2*a)*sin(2*c)
              + cos(2*a)*cos(2*b)*cos(2*c); break;
      case "doubleGyroid":
        value = 2.75 * (sin(2*a)*sin(c)*cos(b) + sin(2*b)*sin(a)*cos(c) + sin(2*c)*sin(b)*cos(a))
              - (cos(2*a)*cos(2*b) + cos(2*b)*cos(2*c) + cos(2*c)*cos(2*a)); break;
      case "s":
        value = cos(2*a)*sin(b)*cos(c) + cos(2*b)*sin(c)*cos(a) + cos(2*c)*sin(a)*cos(b) - 0.4; break;
      default:
        value = 0;
    }

    return this.shell ? Math.abs(value) - this.offset : value + this.offset;
  }
}

// ═════════════════════════════════════════════
// SdfMicrostructure
// ═════════════════════════════════════════════

export type MicroPatternType =
  | "bigX" | "grid" | "star" | "cross" | "octagon"
  | "octet" | "vintile" | "dual" | "interlock" | "isotrop";

export class SdfMicrostructure implements ISdf {
  private struts: { a: Vec3; b: Vec3 }[];

  constructor(
    public cellSize = 10,
    public strutRadius = 1,
    public pattern: MicroPatternType = "bigX",
  ) {
    this.struts = generateStruts(pattern, cellSize);
  }

  distance(p: Vec3): number {
    const cs = this.cellSize;
    const hs = cs * 0.5;
    const q = new Vec3(
      Math.abs(Math.abs(p.x) % cs - hs),
      Math.abs(Math.abs(p.y) % cs - hs),
      Math.abs(Math.abs(p.z) % cs - hs),
    );

    let minDist = Infinity;
    for (const { a, b } of this.struts) {
      const d = distToSegment(q, a, b);
      if (d < minDist) minDist = d;
    }
    return minDist - this.strutRadius;
  }
}

function distToSegment(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = b.sub(a);
  const abSq = ab.dot(ab);
  if (abSq < EPSILON) return p.sub(a).len();
  const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
  return p.sub(a.add(ab.mul(t))).len();
}

function generateStruts(pattern: MicroPatternType, dim: number): { a: Vec3; b: Vec3 }[] {
  const v1 = 0, v2 = dim * 0.5, v3 = dim * 0.25;
  const p = [
    new Vec3(v1,v1,v1), new Vec3(v2,v1,v1), new Vec3(v2,v2,v1), new Vec3(v1,v2,v1),
    new Vec3(v1,v1,v2), new Vec3(v2,v1,v2), new Vec3(v2,v2,v2), new Vec3(v1,v2,v2),
    new Vec3(v3,v1,v1), new Vec3(v2,v3,v1), new Vec3(v3,v2,v1), new Vec3(v1,v3,v1),
    new Vec3(v1,v1,v3), new Vec3(v2,v1,v3), new Vec3(v2,v2,v3), new Vec3(v1,v2,v3),
    new Vec3(v3,v1,v2), new Vec3(v2,v3,v2), new Vec3(v3,v2,v2), new Vec3(v1,v3,v2),
  ];
  const s = (a: number, b: number) => ({ a: p[a], b: p[b] });

  switch (pattern) {
    case "bigX": return [s(0,6)];
    case "grid": return [s(2,6), s(5,6), s(7,6)];
    case "star": return [s(0,6), s(2,6), s(5,6), s(7,6)];
    case "cross": return [s(1,6), s(3,6), s(4,6)];
    case "octagon": return [s(1,3), s(3,4), s(4,1)];
    case "octet": return [s(1,6), s(3,6), s(4,6), s(1,3), s(3,4), s(4,1)];
    case "vintile": return [s(8,13), s(13,17), s(17,18), s(18,15), s(15,11), s(11,8)];
    case "dual": return [s(0,1), s(0,3), s(0,4)];
    case "interlock": return [s(2,6), s(5,6), s(7,6), s(0,1), s(0,3), s(0,4)];
    case "isotrop": return [s(0,1), s(2,1), s(5,1), s(7,1), s(7,3), s(7,6), s(7,4)];
    default: return [s(0,6)];
  }
}

// ═════════════════════════════════════════════
// SdfUtils
// ═════════════════════════════════════════════

export const SdfUtils = {
  gradient(sdf: ISdf, p: Vec3, epsilon = 0.001): Vec3 {
    const dx = sdf.distance(new Vec3(p.x + epsilon, p.y, p.z))
             - sdf.distance(new Vec3(p.x - epsilon, p.y, p.z));
    const dy = sdf.distance(new Vec3(p.x, p.y + epsilon, p.z))
             - sdf.distance(new Vec3(p.x, p.y - epsilon, p.z));
    const dz = sdf.distance(new Vec3(p.x, p.y, p.z + epsilon))
             - sdf.distance(new Vec3(p.x, p.y, p.z - epsilon));
    return new Vec3(dx, dy, dz).normalize();
  },

  rayMarch(
    sdf: ISdf, origin: Vec3, direction: Vec3,
    maxDistance = 1000, tolerance = 0.001, maxSteps = 256,
  ): { hitPoint: Vec3; distance: number } | null {
    const dir = direction.normalize();
    let t = 0;
    for (let i = 0; i < maxSteps && t < maxDistance; i++) {
      const p = origin.add(dir.mul(t));
      const d = sdf.distance(p);
      if (d < tolerance) return { hitPoint: p, distance: t };
      t += d;
    }
    return null;
  },

  surfaceNormal(sdf: ISdf, p: Vec3, projectionSteps = 3, epsilon = 0.001): Vec3 {
    let q = p;
    for (let i = 0; i < projectionSteps; i++) {
      const d = sdf.distance(q);
      const grad = SdfUtils.gradient(sdf, q, epsilon);
      q = q.sub(grad.mul(d));
    }
    return SdfUtils.gradient(sdf, q, epsilon);
  },

  projectToSurface(sdf: ISdf, p: Vec3, maxSteps = 16, epsilon = 0.001): Vec3 {
    let q = p;
    for (let i = 0; i < maxSteps; i++) {
      const d = sdf.distance(q);
      if (Math.abs(d) < epsilon) break;
      q = q.sub(SdfUtils.gradient(sdf, q, epsilon).mul(d));
    }
    return q;
  },

  estimateCurvature(sdf: ISdf, p: Vec3, epsilon = 0.01): number {
    const center = sdf.distance(p);
    const laplacian =
        sdf.distance(new Vec3(p.x + epsilon, p.y, p.z))
      + sdf.distance(new Vec3(p.x - epsilon, p.y, p.z))
      + sdf.distance(new Vec3(p.x, p.y + epsilon, p.z))
      + sdf.distance(new Vec3(p.x, p.y - epsilon, p.z))
      + sdf.distance(new Vec3(p.x, p.y, p.z + epsilon))
      + sdf.distance(new Vec3(p.x, p.y, p.z - epsilon))
      - 6 * center;
    return laplacian / (epsilon * epsilon);
  },

  ambientOcclusion(
    sdf: ISdf, surfacePoint: Vec3, normal: Vec3,
    samples = 5, maxDistance = 1,
  ): number {
    let ao = 0;
    let weight = 1;
    const stepSize = maxDistance / samples;

    for (let i = 1; i <= samples; i++) {
      const expectedDist = i * stepSize;
      const actualDist = sdf.distance(surfacePoint.add(normal.mul(expectedDist)));
      ao += weight * Math.max(0, expectedDist - actualDist);
      weight *= 0.5;
    }

    return HMath.clamp(1 - ao, 0, 1);
  },
};

// ═════════════════════════════════════════════
// Fluent builder helpers
// ═════════════════════════════════════════════

export const SdfOps = {
  translate(sdf: ISdf, x: number, y: number, z: number): ISdf {
    return new SdfTransform(sdf, Mat4.translation(x, y, z));
  },
  rotateX(sdf: ISdf, radians: number): ISdf {
    return new SdfTransform(sdf, Mat4.rotationX(radians));
  },
  rotateY(sdf: ISdf, radians: number): ISdf {
    return new SdfTransform(sdf, Mat4.rotationY(radians));
  },
  rotateZ(sdf: ISdf, radians: number): ISdf {
    return new SdfTransform(sdf, Mat4.rotationZ(radians));
  },
  scale(sdf: ISdf, factor: number): ISdf {
    return new SdfTransform(sdf, Mat4.scaling(factor, factor, factor));
  },
  union(a: ISdf, b: ISdf): ISdf { return new SdfUnion(a, b); },
  intersect(a: ISdf, b: ISdf): ISdf { return new SdfIntersect(a, b); },
  subtract(a: ISdf, b: ISdf): ISdf { return new SdfSubtract(a, b); },
  blend(a: ISdf, b: ISdf, radius = 1): ISdf { return new SdfBlend(a, b, radius); },
  shell(sdf: ISdf, thickness: number): ISdf { return new SdfShell(sdf, thickness); },
  round(sdf: ISdf, radius: number): ISdf { return new SdfOffset(sdf, radius); },
  mirror(sdf: ISdf, normal: Vec3): ISdf { return new SdfMirror(sdf, normal); },
  twist(sdf: ISdf, anglePerUnit: number): ISdf { return new SdfTwist(sdf, anglePerUnit); },
  revolve(sdf: ISdf): ISdf { return new SdfRevolution(sdf); },
};
