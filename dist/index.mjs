import {
  AABB,
  ConnectedMesh,
  HMath,
  HPlane,
  Mat4,
  MathUtils,
  Scene,
  Segment,
  Triangle,
  Vec2,
  Vec3,
  Vec4,
  VecMath,
  closestPointOnSegment,
  segmentSegmentClosest
} from "./chunk-QKIO3ZDY.mjs";

// src/core/math/noise.ts
var P = [
  151,
  160,
  137,
  91,
  90,
  15,
  131,
  13,
  201,
  95,
  96,
  53,
  194,
  233,
  7,
  225,
  140,
  36,
  103,
  30,
  69,
  142,
  8,
  99,
  37,
  240,
  21,
  10,
  23,
  190,
  6,
  148,
  247,
  120,
  234,
  75,
  0,
  26,
  197,
  62,
  94,
  252,
  219,
  203,
  117,
  35,
  11,
  32,
  57,
  177,
  33,
  88,
  237,
  149,
  56,
  87,
  174,
  20,
  125,
  136,
  171,
  168,
  68,
  175,
  74,
  165,
  71,
  134,
  139,
  48,
  27,
  166,
  77,
  146,
  158,
  231,
  83,
  111,
  229,
  122,
  60,
  211,
  133,
  230,
  220,
  105,
  92,
  41,
  55,
  46,
  245,
  40,
  244,
  102,
  143,
  54,
  65,
  25,
  63,
  161,
  1,
  216,
  80,
  73,
  209,
  76,
  132,
  187,
  208,
  89,
  18,
  169,
  200,
  196,
  135,
  130,
  116,
  188,
  159,
  86,
  164,
  100,
  109,
  198,
  173,
  186,
  3,
  64,
  52,
  217,
  226,
  250,
  124,
  123,
  5,
  202,
  38,
  147,
  118,
  126,
  255,
  82,
  85,
  212,
  207,
  206,
  59,
  227,
  47,
  16,
  58,
  17,
  182,
  189,
  28,
  42,
  223,
  183,
  170,
  213,
  119,
  248,
  152,
  2,
  44,
  154,
  163,
  70,
  221,
  153,
  101,
  155,
  167,
  43,
  172,
  9,
  129,
  22,
  39,
  253,
  19,
  98,
  108,
  110,
  79,
  113,
  224,
  232,
  178,
  185,
  112,
  104,
  218,
  246,
  97,
  228,
  251,
  34,
  242,
  193,
  238,
  210,
  144,
  12,
  191,
  179,
  162,
  241,
  81,
  51,
  145,
  235,
  249,
  14,
  239,
  107,
  49,
  192,
  214,
  31,
  181,
  199,
  106,
  157,
  184,
  84,
  204,
  176,
  115,
  121,
  50,
  45,
  127,
  4,
  150,
  254,
  138,
  236,
  205,
  93,
  222,
  114,
  67,
  29,
  24,
  72,
  243,
  141,
  128,
  195,
  78,
  66,
  215,
  61,
  156,
  180
];
var perm = new Uint8Array(512);
for (let i = 0; i < 512; i++) perm[i] = P[i & 255];
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(t, a, b) {
  return a + t * (b - a);
}
function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
function noise3D(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = perm[X] + Y;
  const AA = perm[A] + Z;
  const AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y;
  const BA = perm[B] + Z;
  const BB = perm[B + 1] + Z;
  const res = lerp(
    w,
    lerp(
      v,
      lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
      lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1))
    )
  );
  return (res + 1) * 0.5;
}
function noise(x, y = 0, z = 0) {
  return noise3D(x, y, z);
}

// src/core/math/random.ts
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function createRandom(seed) {
  let rng = mulberry32(seed ?? Date.now() ^ Math.random() * 4294967295);
  return {
    random(min, max) {
      const v = rng();
      if (min === void 0) return v;
      if (max === void 0) return v * min;
      return min + v * (max - min);
    },
    randomSeed(s) {
      rng = mulberry32(s);
    }
  };
}

// src/core/geometry/Ray.ts
var Ray = class {
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }
  at(t) {
    return this.origin.add(this.direction.mul(t));
  }
  closestPointTo(point) {
    const t = Math.max(0, point.sub(this.origin).dot(this.direction));
    return this.at(t);
  }
  distToPoint(point) {
    return this.closestPointTo(point).distTo(point);
  }
  intersectPlane(plane) {
    const denom = this.direction.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(this.origin.dot(plane.normal) + plane.d) / denom;
    if (t < 0) return null;
    return { t, point: this.at(t) };
  }
  intersectTriangle(tri) {
    const edge1 = tri.b.sub(tri.a);
    const edge2 = tri.c.sub(tri.a);
    const h = this.direction.cross(edge2);
    const a = edge1.dot(h);
    if (Math.abs(a) < HMath.EPSILON) return null;
    const f2 = 1 / a;
    const s = this.origin.sub(tri.a);
    const u = f2 * s.dot(h);
    if (u < 0 || u > 1) return null;
    const q = s.cross(edge1);
    const v = f2 * this.direction.dot(q);
    if (v < 0 || u + v > 1) return null;
    const t = f2 * edge2.dot(q);
    if (t < HMath.EPSILON) return null;
    return { t, point: this.at(t), u, v };
  }
  intersectSphere(sphere) {
    const oc = this.origin.sub(sphere.center);
    const a = this.direction.dot(this.direction);
    const b = 2 * oc.dot(this.direction);
    const c = oc.dot(oc) - sphere.radius * sphere.radius;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return [];
    const sqrtDisc = Math.sqrt(disc);
    const results = [];
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    if (t1 >= 0) results.push({ t: t1, point: this.at(t1) });
    if (t2 >= 0 && !HMath.almostEqual(t1, t2)) results.push({ t: t2, point: this.at(t2) });
    return results;
  }
  intersectAABB(box) {
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
  toJSON() {
    return { origin: this.origin.toJSON(), direction: this.direction.toJSON() };
  }
};

// src/core/geometry/Sphere.ts
var Sphere = class {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }
  containsPoint(p) {
    return this.center.distSqTo(p) <= this.radius * this.radius + HMath.EPSILON;
  }
  intersectsSphere(other) {
    const r = this.radius + other.radius;
    return this.center.distSqTo(other.center) <= r * r;
  }
  toJSON() {
    return { center: this.center.toJSON(), radius: this.radius };
  }
};

// src/core/geometry/OBB2D.ts
var OBB2D = class {
  constructor(center, width, height, angle) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.angle = angle;
  }
  /** Unit direction along the width axis. */
  get axisU() {
    return VecMath.fromAngle2D(this.angle);
  }
  /** Unit direction along the height axis. */
  get axisV() {
    return VecMath.fromAngle2D(this.angle + Math.PI / 2);
  }
  get area() {
    return this.width * this.height;
  }
  /** Returns the 4 corners of the rectangle (CCW order). */
  get corners() {
    const u = this.axisU;
    const v = this.axisV;
    const hw = this.width * 0.5;
    const hh = this.height * 0.5;
    return [
      this.center.sub(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).add(v.mul(hh)),
      this.center.sub(u.mul(hw)).add(v.mul(hh))
    ];
  }
  /** Tests whether a point lies inside the OBB. */
  contains(p) {
    const d = p.sub(this.center);
    const u = this.axisU;
    const v = this.axisV;
    const projU = Math.abs(d.dot(u));
    const projV = Math.abs(d.dot(v));
    return projU <= this.width * 0.5 + HMath.EPSILON && projV <= this.height * 0.5 + HMath.EPSILON;
  }
  toString() {
    return `OBB2D [Center:${this.center} W:${this.width.toFixed(3)} H:${this.height.toFixed(3)} Angle:${(this.angle * HMath.RAD2DEG).toFixed(1)}\xB0]`;
  }
};

// src/core/geometry/Intersections.ts
var EPS = 1e-8;
var EPS2D = 1e-10;
var Intersections = {
  // ================================================================
  // 3D RAY INTERSECTIONS
  // ================================================================
  /**
   * Intersects a Ray with a line segment (A, B).
   * Returns the intersection point. If parallel/miss, returns midpoint of segment.
   */
  raySegment(rayOrigin, rayDir, pA, pB) {
    const edgeDir = pB.sub(pA);
    const v3 = rayOrigin.sub(pA);
    const crossDirEdge = rayDir.cross(edgeDir);
    const denom = crossDirEdge.lenSq();
    if (denom < EPS) return pA.add(pB).mul(0.5);
    const crossRayV3 = rayDir.cross(v3);
    let u = crossRayV3.dot(crossDirEdge) / denom;
    u = HMath.clamp(u, 0, 1);
    return pA.add(edgeDir.mul(u));
  },
  /**
   * Moller-Trumbore ray-triangle intersection.
   * Returns { t, u, v } if hit, or null if miss.
   */
  rayTriangle(rayOrigin, rayDir, v0, v1, v2) {
    const edge1 = v1.sub(v0);
    const edge2 = v2.sub(v0);
    const h = rayDir.cross(edge2);
    const a = edge1.dot(h);
    if (a > -EPS && a < EPS) return null;
    const f2 = 1 / a;
    const s = rayOrigin.sub(v0);
    const u = f2 * s.dot(h);
    if (u < 0 || u > 1) return null;
    const q = s.cross(edge1);
    const v = f2 * rayDir.dot(q);
    if (v < 0 || u + v > 1) return null;
    const t = f2 * edge2.dot(q);
    if (t <= EPS) return null;
    return { t, u, v };
  },
  /**
   * Checks if a point P (assumed to be on the triangle plane) is inside ABC.
   * Uses the "Same Side" technique with cross products.
   */
  pointInTriangle3D(p, a, b, c) {
    const ab = b.sub(a), bc = c.sub(b), ca = a.sub(c);
    const pa = p.sub(a), pb = p.sub(b), pc = p.sub(c);
    const n = ab.cross(ca);
    if (ab.cross(pa).dot(n) < 0) return false;
    if (bc.cross(pb).dot(n) < 0) return false;
    if (ca.cross(pc).dot(n) < 0) return false;
    return true;
  },
  /** Returns the closest point on segment AB to point P. */
  closestPointOnSegment(a, b, p) {
    const ab = b.sub(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / ab.lenSq(), 0, 1);
    return a.add(ab.mul(t));
  },
  /**
   * Finds the closest points on two 3D lines (not segments).
   * Returns { c1, c2 }.
   */
  closestPointsLineLine(p1, d1, p2, d2) {
    const r = p1.sub(p2);
    const a = d1.dot(d1);
    const b = d1.dot(d2);
    const c = d1.dot(r);
    const e = d2.dot(d2);
    const f2 = d2.dot(r);
    const d = a * e - b * b;
    if (d < EPS) {
      return { c1: p1, c2: p2.add(d2.mul(p1.sub(p2).dot(d2))) };
    }
    const s = (b * f2 - c * e) / d;
    const t = (a * f2 - b * c) / d;
    return { c1: p1.add(d1.mul(s)), c2: p2.add(d2.mul(t)) };
  },
  // ================================================================
  // RAY-PLANE / RAY-SPHERE / RAY-AABB
  // ================================================================
  /** Intersects a ray with a plane. Returns { t, point } or null. */
  rayPlane(ray, plane) {
    const denom = ray.direction.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(ray.origin.dot(plane.normal) + plane.d) / denom;
    if (t < 0) return null;
    return { t, point: ray.at(t) };
  },
  /** Intersects a ray with a sphere. Returns { t1, t2 } or null. */
  raySphere(ray, sphere) {
    const oc = ray.origin.sub(sphere.center);
    const a = ray.direction.dot(ray.direction);
    const b = 2 * oc.dot(ray.direction);
    const c = oc.dot(oc) - sphere.radius * sphere.radius;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    if (t1 >= 0 || t2 >= 0) return { t1, t2 };
    return null;
  },
  /** Intersects a ray with an AABB. Returns { tMin, tMax } or null. */
  rayAABB(ray, box) {
    let tMin = -Infinity;
    let tMax = Infinity;
    const invX = 1 / ray.direction.x;
    const invY = 1 / ray.direction.y;
    const invZ = 1 / ray.direction.z;
    let tx0 = (box.min.x - ray.origin.x) * invX;
    let tx1 = (box.max.x - ray.origin.x) * invX;
    if (invX < 0) {
      const tmp = tx0;
      tx0 = tx1;
      tx1 = tmp;
    }
    tMin = Math.max(tMin, tx0);
    tMax = Math.min(tMax, tx1);
    if (tMax < tMin) return null;
    let ty0 = (box.min.y - ray.origin.y) * invY;
    let ty1 = (box.max.y - ray.origin.y) * invY;
    if (invY < 0) {
      const tmp = ty0;
      ty0 = ty1;
      ty1 = tmp;
    }
    tMin = Math.max(tMin, ty0);
    tMax = Math.min(tMax, ty1);
    if (tMax < tMin) return null;
    let tz0 = (box.min.z - ray.origin.z) * invZ;
    let tz1 = (box.max.z - ray.origin.z) * invZ;
    if (invZ < 0) {
      const tmp = tz0;
      tz0 = tz1;
      tz1 = tmp;
    }
    tMin = Math.max(tMin, tz0);
    tMax = Math.min(tMax, tz1);
    if (tMax >= tMin) return { tMin, tMax };
    return null;
  },
  // ================================================================
  // 2D LINE/SEGMENT/RAY INTERSECTIONS
  // ================================================================
  /**
   * Intersects two 2D line segments with full parameter info.
   * Returns { t, u, point } or null.
   */
  segmentIntersect2D(a1, a2, b1, b2) {
    const d1 = a2.sub(a1), d2 = b2.sub(b1);
    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = b1.sub(a1);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const u = (diff.x * d1.y - diff.y * d1.x) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { t, u, point: a1.add(d1.mul(t)) };
    }
    return null;
  },
  /** Intersects two 2D line segments, returns the point or null. */
  segmentSegment2D(a1, a2, b1, b2) {
    const d1 = a2.sub(a1), d2 = b2.sub(b1);
    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = b1.sub(a1);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const u = (diff.x * d1.y - diff.y * d1.x) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return a1.add(d1.mul(t));
    }
    return null;
  },
  /** Intersects two infinite 2D lines. Returns point or null. */
  lineLine2D(a1, a2, b1, b2) {
    const denom = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
    if (Math.abs(denom) < EPS2D) return null;
    const num = (a1.y - b1.y) * (b2.x - b1.x) - (a1.x - b1.x) * (b2.y - b1.y);
    const t = num / denom;
    return new Vec2(a1.x + t * (a2.x - a1.x), a1.y + t * (a2.y - a1.y));
  },
  /** Intersects a 2D ray (origin + direction) with a segment. */
  raySegment2D(rayOrigin, rayDir, a, b) {
    const d2 = b.sub(a);
    const cross = rayDir.x * d2.y - rayDir.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = a.sub(rayOrigin);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const u = (diff.x * rayDir.y - diff.y * rayDir.x) / cross;
    if (t >= 0 && u >= 0 && u <= 1) {
      return rayOrigin.add(rayDir.mul(t));
    }
    return null;
  },
  /** Intersects a 2D ray with an infinite line through a and b. */
  rayLine2D(rayOrigin, rayDir, lineA, lineB) {
    const lineDir = lineB.sub(lineA);
    const denom = rayDir.x * lineDir.y - rayDir.y * lineDir.x;
    if (Math.abs(denom) < EPS2D) return null;
    const diff = lineA.sub(rayOrigin);
    const t = (diff.x * lineDir.y - diff.y * lineDir.x) / denom;
    if (t < 0) return null;
    return rayOrigin.add(rayDir.mul(t));
  },
  /** Intersects a 2D segment with an infinite line. */
  segmentLine2D(segA, segB, lineA, lineB) {
    const d1 = segB.sub(segA);
    const d2 = lineB.sub(lineA);
    const denom = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(denom) < EPS2D) return null;
    const diff = lineA.sub(segA);
    const t = (diff.x * d2.y - diff.y * d2.x) / denom;
    if (t < 0 || t > 1) return null;
    return segA.add(d1.mul(t));
  },
  /** Intersects two 2D rays (each defined by origin + direction). */
  rayRay2D(o1, d1, o2, d2) {
    const cross = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(cross) < EPS2D) return null;
    const diff = o2.sub(o1);
    const t = (diff.x * d2.y - diff.y * d2.x) / cross;
    const s = (diff.x * d1.y - diff.y * d1.x) / cross;
    if (t < 0 || s < 0) return null;
    return o1.add(d1.mul(t));
  },
  // ================================================================
  // CIRCLE INTERSECTIONS (2D)
  // ================================================================
  /** Intersects an infinite line with a circle. Returns 0, 1, or 2 intersection points. */
  circleLine(a, b, center, radius) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const cx = center.x - a.x;
    const cy = center.y - a.y;
    const A = dx * dx + dy * dy;
    const B = dx * cx + dy * cy;
    const C = cx * cx + cy * cy - radius * radius;
    const pBy2 = B / A;
    const q = C / A;
    const disc = pBy2 * pBy2 - q;
    if (disc < 0) return [];
    const sqrtDisc = Math.sqrt(disc);
    const s1 = -pBy2 + sqrtDisc;
    const s2 = -pBy2 - sqrtDisc;
    const p1 = new Vec2(a.x - dx * s1, a.y - dy * s1);
    if (Math.abs(disc) < EPS2D) return [p1];
    const p2 = new Vec2(a.x - dx * s2, a.y - dy * s2);
    return [p1, p2];
  },
  /** Intersect two circles. Returns 0, 1, or 2 intersection points. */
  circleCircle(c1x, c1y, r1, c2x, c2y, r2) {
    const dx = c2x - c1x, dy = c2y - c1y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9 || d < 1e-12) return [];
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const mx = c1x + a * dx / d, my = c1y + a * dy / d;
    const h2 = r1 * r1 - a * a;
    if (h2 < 0) return [[mx, my]];
    const h = Math.sqrt(h2);
    const px = -dy / d * h, py = dx / d * h;
    if (h < 1e-9) return [[mx, my]];
    return [[mx + px, my + py], [mx - px, my - py]];
  },
  /** Intersects a segment with a circle. Returns only points within the segment. */
  circleSegment(a, b, center, radius) {
    const lineHits = Intersections.circleLine(a, b, center, radius);
    if (lineHits.length === 0) return [];
    const mid = a.add(b).mul(0.5);
    const halfLen = a.distTo(b) * 0.5;
    return lineHits.filter((p) => p.distTo(mid) <= halfLen + HMath.EPSILON);
  },
  // ================================================================
  // 3D PLANE INTERSECTIONS
  // ================================================================
  /** Intersects a line segment with a plane. Returns the hit point or null. */
  segmentPlane(a, b, plane) {
    const dA = plane.distToPoint(a);
    const dB = plane.distToPoint(b);
    if (dA * dB > 0) return null;
    const denom = dA - dB;
    if (Math.abs(denom) < HMath.EPSILON) return a;
    const t = dA / denom;
    return a.lerp(b, t);
  },
  /** Intersects an infinite line with a plane. Returns the hit point or null. */
  linePlane(a, b, plane) {
    const dir = b.sub(a);
    const denom = dir.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(a.dot(plane.normal) + plane.d) / denom;
    return a.add(dir.mul(t));
  },
  /** Intersects two planes. Returns { point, direction } of the line, or null if parallel. */
  planePlane(p1, p2) {
    const dir = p1.normal.cross(p2.normal);
    if (dir.lenSq() < HMath.EPSILON) return null;
    const absX = Math.abs(dir.x);
    const absY = Math.abs(dir.y);
    const absZ = Math.abs(dir.z);
    let point;
    if (absZ >= absX && absZ >= absY)
      point = solvePlanePair(2, 0, 1, p1, p2);
    else if (absY >= absX)
      point = solvePlanePair(1, 2, 0, p1, p2);
    else
      point = solvePlanePair(0, 1, 2, p1, p2);
    return { point, direction: dir.normalize() };
  },
  // ================================================================
  // POLYGON-RAY (2D)
  // ================================================================
  /** Finds all intersection points of a 2D ray with a polygon's edges. */
  polygonRay2D(rayOrigin, rayDir, polygon) {
    const hits = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const hit = Intersections.raySegment2D(rayOrigin, rayDir, polygon[i], polygon[(i + 1) % n]);
      if (hit) hits.push(hit);
    }
    return hits;
  }
};
function coord(v, i) {
  return i === 0 ? v.x : i === 1 ? v.y : v.z;
}
function setCoord(x, y, z, i, val) {
  if (i === 0) return new Vec3(val, y, z);
  if (i === 1) return new Vec3(x, val, z);
  return new Vec3(x, y, val);
}
function solvePlanePair(_zeroCoord, coordA, coordB, p1, p2) {
  const a1 = coord(p1.normal, coordA);
  const b1 = coord(p1.normal, coordB);
  const d1 = -p1.d;
  const a2 = coord(p2.normal, coordA);
  const b2 = coord(p2.normal, coordB);
  const d2 = -p2.d;
  const denom = a1 * b2 - a2 * b1;
  const A0 = (b2 * d1 - b1 * d2) / denom;
  const B0 = (a1 * d2 - a2 * d1) / denom;
  let result = new Vec3(0, 0, 0);
  result = setCoord(result.x, result.y, result.z, coordA, A0);
  result = setCoord(result.x, result.y, result.z, coordB, B0);
  return result;
}

// src/core/geometry/Polygon2D.ts
var TWO_PI = Math.PI * 2;
var Polygon2D = {
  // ================================================================
  // CROSS PRODUCT / ORIENTATION
  // ================================================================
  /** 2D cross product of vectors OA x OB */
  cross2D(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  },
  // ================================================================
  // AREA & PERIMETER
  // ================================================================
  /** Signed area of a 2D polygon (positive if CCW, negative if CW). */
  signedArea(polygon) {
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    }
    return area / 2;
  },
  /** Unsigned area. */
  area(polygon) {
    return Math.abs(Polygon2D.signedArea(polygon));
  },
  /** Total perimeter length. */
  perimeter(polygon) {
    let total = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++)
      total += polygon[i].distTo(polygon[(i + 1) % n]);
    return total;
  },
  /**
   * Total arc length of an open polyline (no implied closing edge).
   * Sums segment lengths between consecutive vertices.
   */
  polylineLength(polyline) {
    let total = 0;
    for (let i = 0; i < polyline.length - 1; i++)
      total += polyline[i].distTo(polyline[i + 1]);
    return total;
  },
  // ================================================================
  // RING NORMALIZATION
  // ================================================================
  /**
   * Return `polygon` with the closing duplicate vertex stripped (open ring).
   * Only strips when the polygon has ≥3 vertices and its first/last vertices
   * coincide within `eps`. Always returns a fresh array.
   */
  openRing(polygon, eps = 1e-12) {
    return polygon.length >= 3 && polygon[0].distSqTo(polygon[polygon.length - 1]) < eps ? polygon.slice(0, -1) : polygon.slice();
  },
  /**
   * Return `polygon` with a closing duplicate vertex appended (closed ring).
   * Polygons with <3 vertices are returned as a fresh copy unchanged.
   * Always returns a fresh array.
   */
  closeRing(polygon, eps = 1e-12) {
    if (polygon.length < 3) return polygon.slice();
    return polygon[0].distSqTo(polygon[polygon.length - 1]) < eps ? polygon.slice() : [...polygon, polygon[0]];
  },
  /** Returns true if polygon vertices are in counter-clockwise order. */
  isCCW(polygon) {
    return Polygon2D.signedArea(polygon) > 0;
  },
  // ================================================================
  // CENTER
  // ================================================================
  /** Average center (centroid of vertices, fast but not area-weighted). */
  averageCenter(polygon) {
    let sx = 0, sy = 0;
    for (const p of polygon) {
      sx += p.x;
      sy += p.y;
    }
    return new Vec2(sx / polygon.length, sy / polygon.length);
  },
  /** Area-weighted centroid (gravity center). */
  centroid2D(polygon) {
    const A = Polygon2D.signedArea(polygon);
    if (Math.abs(A) < HMath.EPSILON) return Polygon2D.averageCenter(polygon);
    let cx = 0, cy = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const f2 = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      cx += (polygon[i].x + polygon[j].x) * f2;
      cy += (polygon[i].y + polygon[j].y) * f2;
    }
    const factor = 1 / (6 * A);
    return new Vec2(cx * factor, cy * factor);
  },
  // ================================================================
  // CONTAINMENT
  // ================================================================
  /** Point-in-polygon (ray casting, 2D). */
  pointInPolygon(point, polygon) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (yi > point.y !== yj > point.y && point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  },
  /** Point-in-polygon test using winding number (robust for concave polygons). */
  containsWinding(polygon, point) {
    let winding = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      if (a.y <= point.y) {
        if (b.y > point.y && VecMath.cross2D(a, b, point) > 0) winding++;
      } else {
        if (b.y <= point.y && VecMath.cross2D(a, b, point) < 0) winding--;
      }
    }
    return winding !== 0;
  },
  // ================================================================
  // CLOSEST POINT / VERTEX
  // ================================================================
  /** Index of the closest vertex to a point. */
  closestVertexIndex(polygon, point) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < polygon.length; i++) {
      const d = polygon[i].distSqTo(point);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  },
  /** Closest point on the polygon boundary to a given point. Returns { point, edgeIndex }. */
  closestPointOnEdge(polygon, point) {
    let bestEdge = 0;
    let bestDist = Infinity;
    let bestPt = polygon[0];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      const ab = b.sub(a);
      const abSq = ab.lenSq();
      const t = abSq < HMath.EPSILON ? 0 : HMath.clamp(point.sub(a).dot(ab) / abSq, 0, 1);
      const proj = a.add(ab.mul(t));
      const d = point.distSqTo(proj);
      if (d < bestDist) {
        bestDist = d;
        bestPt = proj;
        bestEdge = i;
      }
    }
    return { point: bestPt, edgeIndex: bestEdge };
  },
  /**
   * Closest point on a polyline to a query point, with arc-length.
   *
   * Treats `polyline` as a *sequence of segments* — if it's a closed polygon
   * (first point == last point), every segment is considered. If it's an open
   * polyline (first ≠ last), the last vertex closes a segment only when
   * `closed: true` is passed.
   *
   * Returns:
   *   - `point`        — the projected 2D point on the polyline.
   *   - `arcLength`    — distance from the polyline start to the projected point.
   *   - `segmentIndex` — index of the segment containing the projection.
   *   - `segmentT`     — 0..1 parameter along that segment.
   *   - `distance`     — distance from the query point to the projection.
   */
  closestPointOnPolyline(polyline, point, opts = {}) {
    const n = polyline.length;
    if (n < 2) return { point: polyline[0] ?? new Vec2(0, 0), arcLength: 0, segmentIndex: 0, segmentT: 0, distance: 0 };
    const closed = opts.closed ?? polyline[0].distSqTo(polyline[n - 1]) < 1e-12;
    const segCount = closed ? n : n - 1;
    let bestArc = 0, bestSeg = 0, bestT = 0;
    let bestPt = polyline[0];
    let bestDistSq = Infinity;
    let accLen = 0;
    for (let i = 0; i < segCount; i++) {
      const a = polyline[i];
      const b = polyline[(i + 1) % n];
      const ab = b.sub(a);
      const abSq = ab.lenSq();
      const t = abSq < HMath.EPSILON ? 0 : HMath.clamp(point.sub(a).dot(ab) / abSq, 0, 1);
      const proj = a.add(ab.mul(t));
      const d = point.distSqTo(proj);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestPt = proj;
        bestSeg = i;
        bestT = t;
        bestArc = accLen + t * Math.sqrt(abSq);
      }
      accLen += Math.sqrt(abSq);
    }
    return {
      point: bestPt,
      arcLength: bestArc,
      segmentIndex: bestSeg,
      segmentT: bestT,
      distance: Math.sqrt(bestDistSq)
    };
  },
  // ================================================================
  // INTERSECTION
  // ================================================================
  /** Segment-segment intersection (2D), returns parameter t along first segment. */
  segmentIntersect2D(a1, a2, b1, b2) {
    const d1 = a2.sub(a1), d2 = b2.sub(b1);
    const cross = d1.cross(d2);
    if (Math.abs(cross) < 1e-10) return null;
    const diff = b1.sub(a1);
    const t = diff.cross(d2) / cross;
    const u = diff.cross(d1) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { t, u, point: a1.add(d1.mul(t)) };
    }
    return null;
  },
  // ================================================================
  // OFFSET (parallel inset/outset)
  // ================================================================
  /**
   * Offsets a polygon by a distance. Works for both CCW and CW windings;
   * the function detects the orientation via signed area and produces a
   * geometrically *outward* offset for positive distance regardless.
   *
   *   distance > 0  →  polygon grows (outward / outset)
   *   distance < 0  →  polygon shrinks (inward / inset)
   *
   * Simple miter-join approach; may produce artifacts on very sharp angles
   * (the miter is clamped to 4× the offset distance to avoid spikes).
   */
  offset(polygon, distance) {
    const n = polygon.length;
    if (n < 3) return [...polygon];
    const d = distance;
    const result = [];
    for (let i = 0; i < n; i++) {
      const prev = (i - 1 + n) % n;
      const next = (i + 1) % n;
      const e1Dir = polygon[i].sub(polygon[prev]).normalize();
      const e2Dir = polygon[next].sub(polygon[i]).normalize();
      const n1 = new Vec2(e1Dir.y, -e1Dir.x);
      const n2 = new Vec2(e2Dir.y, -e2Dir.x);
      const bisector = n1.add(n2);
      const bisLen = bisector.len();
      if (bisLen < HMath.EPSILON) {
        result.push(polygon[i].add(n1.mul(d)));
      } else {
        const bisNorm = bisector.div(bisLen);
        const sinHalfAngle = n1.x * bisNorm.y - n1.y * bisNorm.x;
        let scale = Math.abs(sinHalfAngle) < HMath.EPSILON ? d : d / sinHalfAngle;
        scale = HMath.clamp(scale, -Math.abs(d) * 4, Math.abs(d) * 4);
        result.push(polygon[i].add(bisNorm.mul(scale)));
      }
    }
    return result;
  },
  // ================================================================
  // SIMPLIFICATION
  // ================================================================
  /**
   * Douglas-Peucker simplification — removes points closer than tolerance
   * to the line between their neighbors.
   */
  simplify(polygon, tolerance) {
    if (polygon.length <= 3) return [...polygon];
    const keep = new Array(polygon.length).fill(true);
    let changed = true;
    const n = polygon.length;
    while (changed) {
      changed = false;
      for (let i = 0; i < n; i++) {
        if (!keep[i]) continue;
        const prev = prevKept(keep, i, n);
        const next = nextKept(keep, i, n);
        if (prev === next) continue;
        const dist = VecMath.distanceToSegment2D(polygon[i], polygon[prev], polygon[next]);
        if (dist < tolerance) {
          keep[i] = false;
          changed = true;
        }
      }
    }
    const result = [];
    for (let i = 0; i < n; i++)
      if (keep[i]) result.push(polygon[i]);
    return result.length >= 3 ? result : [...polygon];
  },
  /**
   * Removes vertices where the interior angle is close to 180°
   * (i.e. the vertex barely deviates from a straight line).
   */
  simplifyByAngle(polygon, minAngleRadians) {
    if (polygon.length <= 3) return [...polygon];
    const result = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const prev = polygon[(i - 1 + n) % n];
      const curr = polygon[i];
      const next = polygon[(i + 1) % n];
      const angle = VecMath.angleAtVertex(curr, prev, next);
      if (Math.PI - angle > minAngleRadians) result.push(curr);
    }
    return result.length >= 3 ? result : [...polygon];
  },
  /** Removes edges shorter than minLength by dropping one endpoint. */
  removeShortEdges(polygon, minLength) {
    if (polygon.length <= 3) return [...polygon];
    const minSq = minLength * minLength;
    const result = [polygon[0]];
    const n = polygon.length;
    for (let i = 1; i < n; i++) {
      if (result[result.length - 1].distSqTo(polygon[i]) >= minSq)
        result.push(polygon[i]);
    }
    if (result.length > 1 && result[result.length - 1].distSqTo(result[0]) < minSq)
      result.pop();
    return result.length >= 3 ? result : [...polygon];
  },
  // ================================================================
  // SUBDIVISION
  // ================================================================
  /** Subdivides every edge into n segments, producing n*vertexCount vertices. */
  subdivideEdges(polygon, subdivisions) {
    if (subdivisions < 2) return [...polygon];
    const n = polygon.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      for (let s = 0; s < subdivisions; s++)
        result.push(a.lerp(b, s / subdivisions));
    }
    return result;
  },
  /** Splits edges to ensure no edge is longer than maxLength. */
  splitLongEdges(polygon, maxLength) {
    const n = polygon.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      result.push(a);
      const len = a.distTo(b);
      if (len > maxLength) {
        const splits = Math.ceil(len / maxLength);
        for (let s = 1; s < splits; s++)
          result.push(a.lerp(b, s / splits));
      }
    }
    return result;
  },
  // ================================================================
  // NORMAL (for 3D n-gon, Newell's method)
  // ================================================================
  /**
   * Computes the best-fit normal for a 3D polygon using Newell's method.
   * Works for any number of vertices (not just triangles).
   */
  normal3D(polygon) {
    let nx = 0, ny = 0, nz = 0;
    const count = polygon.length;
    for (let i = 0; i < count; i++) {
      const curr = polygon[i];
      const next = polygon[(i + 1) % count];
      nx += (curr.y - next.y) * (curr.z + next.z);
      ny += (curr.z - next.z) * (curr.x + next.x);
      nz += (curr.x - next.x) * (curr.y + next.y);
    }
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return len > HMath.EPSILON ? new Vec3(nx / len, ny / len, nz / len) : Vec3.unitZ();
  },
  // ================================================================
  // FACTORY
  // ================================================================
  /** Creates a regular polygon (circle approximation) with n sides. */
  createCircle(radius, segments) {
    const pts = [];
    const twoPi = Math.PI * 2;
    for (let i = 0; i < segments; i++) {
      const angle = twoPi * i / segments;
      pts.push(new Vec2(radius * Math.cos(angle), radius * Math.sin(angle)));
    }
    return pts;
  },
  /** Creates a rectangle centered at origin. */
  createRect(width, height) {
    const w = width * 0.5, h = height * 0.5;
    return [
      new Vec2(-w, -h),
      new Vec2(w, -h),
      new Vec2(w, h),
      new Vec2(-w, h)
    ];
  },
  /** Returns the polygon with reversed winding order. */
  reverse(polygon) {
    return [...polygon].reverse();
  },
  // ================================================================
  // FILLET
  // ================================================================
  /**
   * Computes the fillet arc of given radius between two rays from a common origin.
   * Returns the arc center, tangent points, and oriented sweep angle.
   * The sweep is oriented so the arc passes through the interior
   * (the side facing the ray origin).
   */
  filletRays(origin, angle1, angle2, radius) {
    const d1x = Math.cos(angle1), d1y = Math.sin(angle1);
    const d2x = Math.cos(angle2), d2y = Math.sin(angle2);
    let interior = angle2 - angle1;
    while (interior > Math.PI) interior -= TWO_PI;
    while (interior <= -Math.PI) interior += TWO_PI;
    const half = Math.abs(interior) / 2;
    const bis = angle1 + interior / 2;
    const dist = radius / Math.sin(half);
    const cx = origin.x + Math.cos(bis) * dist;
    const cy = origin.y + Math.sin(bis) * dist;
    const vx = cx - origin.x, vy = cy - origin.y;
    const t1 = vx * d1x + vy * d1y;
    const t2 = vx * d2x + vy * d2y;
    const startPt = new Vec2(origin.x + d1x * t1, origin.y + d1y * t1);
    const endPt = new Vec2(origin.x + d2x * t2, origin.y + d2y * t2);
    const startAngle = Math.atan2(startPt.y - cy, startPt.x - cx);
    let endAngle = Math.atan2(endPt.y - cy, endPt.x - cx);
    const toOrigin = Math.atan2(origin.y - cy, origin.x - cx);
    let ccw = endAngle - startAngle;
    if (ccw < 0) ccw += TWO_PI;
    let offset = toOrigin - startAngle;
    if (offset < 0) offset += TWO_PI;
    const sweepAngle = offset <= ccw ? ccw : -(TWO_PI - ccw);
    return {
      center: new Vec2(cx, cy),
      radius,
      startAngle,
      sweepAngle,
      startPt,
      endPt
    };
  },
  // ================================================================
  // CONVEX HULL
  // ================================================================
  /** Convex hull (Andrew's monotone chain). Returns CCW-ordered hull points. */
  convexHull2D(points) {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    if (sorted.length <= 2) return sorted;
    const lower = [];
    for (const p of sorted) {
      while (lower.length >= 2 && Polygon2D.cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && Polygon2D.cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  },
  // ================================================================
  // TRIANGULATION
  // ================================================================
  /** Ear-clipping triangulation for simple 2D polygons. */
  triangulate2D(polygon) {
    if (polygon.length < 3) return [];
    if (polygon.length === 3) return [[0, 1, 2]];
    const isCCW = Polygon2D.signedArea(polygon) > 0;
    const remaining = polygon.map((_, i) => i);
    const triangles = [];
    const isEar = (prev, curr, next) => {
      const a = polygon[remaining[prev]];
      const b = polygon[remaining[curr]];
      const c = polygon[remaining[next]];
      const cross = Polygon2D.cross2D(a, b, c);
      if (isCCW ? cross <= 0 : cross >= 0) return false;
      for (let i = 0; i < remaining.length; i++) {
        if (i === prev || i === curr || i === next) continue;
        if (pointInTriangle2D(polygon[remaining[i]], a, b, c)) return false;
      }
      return true;
    };
    let safety = remaining.length * 3;
    while (remaining.length > 3 && safety-- > 0) {
      let found = false;
      for (let i = 0; i < remaining.length; i++) {
        const prev = (i - 1 + remaining.length) % remaining.length;
        const next = (i + 1) % remaining.length;
        if (isEar(prev, i, next)) {
          triangles.push([remaining[prev], remaining[i], remaining[next]]);
          remaining.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) break;
    }
    if (remaining.length === 3) {
      triangles.push([remaining[0], remaining[1], remaining[2]]);
    }
    return triangles;
  },
  // ================================================================
  // MINIMUM ENCLOSING CIRCLE
  // ================================================================
  /** Minimum enclosing circle (Welzl's algorithm, randomized). */
  minEnclosingCircle(points) {
    if (points.length === 0) return { center: new Vec2(), radius: 0 };
    if (points.length === 1) return { center: points[0], radius: 0 };
    const p = [...points].sort(() => Math.random() - 0.5);
    const from2 = (a, b) => ({
      center: a.lerp(b, 0.5),
      radius: a.distTo(b) / 2
    });
    const from3 = (a, b, c) => {
      const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(d) < 1e-10) {
        const d01 = a.distTo(b), d12 = b.distTo(c), d02 = a.distTo(c);
        if (d01 >= d12 && d01 >= d02) return from2(a, b);
        if (d12 >= d01 && d12 >= d02) return from2(b, c);
        return from2(a, c);
      }
      const ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
      const uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
      const center = new Vec2(ux, uy);
      return { center, radius: center.distTo(a) };
    };
    const inside = (circ, q) => circ.center.distTo(q) <= circ.radius + 1e-8;
    let D = from2(p[0], p[1]);
    for (let i = 2; i < p.length; i++) {
      if (inside(D, p[i])) continue;
      D = { center: p[i], radius: 0 };
      for (let j = 0; j < i; j++) {
        if (inside(D, p[j])) continue;
        D = from2(p[i], p[j]);
        for (let k = 0; k < j; k++) {
          if (!inside(D, p[k])) D = from3(p[i], p[j], p[k]);
        }
      }
    }
    return D;
  },
  // ================================================================
  // MINIMUM AREA RECTANGLE (OBB)
  // ================================================================
  /**
   * Computes the minimum-area oriented bounding rectangle of a point set.
   * Uses convex hull + edge-projection. O(n log n) total.
   */
  minAreaRect(points) {
    if (points.length === 0) return new OBB2D(Vec2.zero(), 0, 0, 0);
    if (points.length === 1) return new OBB2D(points[0], 0, 0, 0);
    const hull = Polygon2D.convexHull2D(points);
    const n = hull.length;
    if (n === 1) return new OBB2D(hull[0], 0, 0, 0);
    if (n === 2) {
      const mid = hull[0].lerp(hull[1], 0.5);
      const len = hull[0].distTo(hull[1]);
      const angle = VecMath.angle2D(hull[1].sub(hull[0]));
      return new OBB2D(mid, len, 0, angle);
    }
    let bestArea = Infinity;
    let bestAngle = 0;
    let bestW = 0, bestH = 0;
    let bestCenter = Vec2.zero();
    for (let i = 0; i < n; i++) {
      const edge = hull[(i + 1) % n].sub(hull[i]);
      if (edge.lenSq() < HMath.EPSILON) continue;
      const angle = VecMath.angle2D(edge);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let minU = Infinity, maxU = -Infinity;
      let minV = Infinity, maxV = -Infinity;
      for (let k = 0; k < n; k++) {
        const u = hull[k].x * cos + hull[k].y * sin;
        const v = -hull[k].x * sin + hull[k].y * cos;
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      const w = maxU - minU;
      const h = maxV - minV;
      const area = w * h;
      if (area < bestArea) {
        bestArea = area;
        bestAngle = angle;
        bestW = w;
        bestH = h;
        const cu = (minU + maxU) * 0.5;
        const cv = (minV + maxV) * 0.5;
        bestCenter = new Vec2(cu * cos - cv * sin, cu * sin + cv * cos);
      }
    }
    return new OBB2D(bestCenter, bestW, bestH, bestAngle);
  }
};
function pointInTriangle2D(p, a, b, c) {
  const d1 = Polygon2D.cross2D(a, b, p);
  const d2 = Polygon2D.cross2D(b, c, p);
  const d3 = Polygon2D.cross2D(c, a, p);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function nextKept(keep, i, n) {
  let next = (i + 1) % n;
  while (!keep[next] && next !== i) next = (next + 1) % n;
  return next;
}
function prevKept(keep, i, n) {
  let prev = (i - 1 + n) % n;
  while (!keep[prev] && prev !== i) prev = (prev - 1 + n) % n;
  return prev;
}
var BoolNode = class {
  constructor(pos) {
    this.next = this;
    this.prev = this;
    this.isIntersection = false;
    this.entering = false;
    this.visited = false;
    this.partner = null;
    this.alpha = 0;
    this.pos = pos;
  }
};
function buildBoolList(poly) {
  const head = new BoolNode(poly[0]);
  let prev = head;
  for (let i = 1; i < poly.length; i++) {
    const node = new BoolNode(poly[i]);
    node.prev = prev;
    prev.next = node;
    prev = node;
  }
  prev.next = head;
  head.prev = prev;
  return head;
}
function insertBoolNode(after, node) {
  let cur = after;
  while (cur.next !== after.next || cur === after) {
    if (!cur.next.isIntersection || cur.next.alpha > node.alpha) break;
    cur = cur.next;
    if (cur === after) break;
  }
  node.next = cur.next;
  node.prev = cur;
  cur.next.prev = node;
  cur.next = node;
}
function boolSegHit(ax, ay, bx, by, cx, cy, dx, dy) {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
  if (t > 1e-8 && t < 1 - 1e-8 && u > 1e-8 && u < 1 - 1e-8) return { t, u };
  return null;
}
function boolPip(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (poly[i].y > pt.y !== poly[j].y > pt.y && pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) {
      inside = !inside;
    }
  }
  return inside;
}
function polygonIntersection(subjPoly, clipPoly) {
  const subj = buildBoolList(subjPoly);
  const clip = buildBoolList(clipPoly);
  let hasIntersections = false;
  let sNode = subj;
  do {
    let cNode = clip;
    do {
      const hit = boolSegHit(
        sNode.pos.x,
        sNode.pos.y,
        sNode.next.pos.x,
        sNode.next.pos.y,
        cNode.pos.x,
        cNode.pos.y,
        cNode.next.pos.x,
        cNode.next.pos.y
      );
      if (hit) {
        const pt = new Vec2(
          sNode.pos.x + hit.t * (sNode.next.pos.x - sNode.pos.x),
          sNode.pos.y + hit.t * (sNode.next.pos.y - sNode.pos.y)
        );
        const sInt = new BoolNode(pt);
        sInt.isIntersection = true;
        sInt.alpha = hit.t;
        const cInt = new BoolNode(pt);
        cInt.isIntersection = true;
        cInt.alpha = hit.u;
        sInt.partner = cInt;
        cInt.partner = sInt;
        insertBoolNode(sNode, sInt);
        insertBoolNode(cNode, cInt);
        hasIntersections = true;
      }
      cNode = cNode.next;
      while (cNode.isIntersection && cNode !== clip) cNode = cNode.next;
    } while (cNode !== clip);
    sNode = sNode.next;
    while (sNode.isIntersection && sNode !== subj) sNode = sNode.next;
  } while (sNode !== subj);
  if (!hasIntersections) {
    if (boolPip(subjPoly[0], clipPoly)) return [subjPoly];
    if (boolPip(clipPoly[0], subjPoly)) return [clipPoly];
    return [];
  }
  let cur = subj;
  let inside = boolPip(cur.pos, clipPoly);
  do {
    if (cur.isIntersection) {
      cur.entering = !inside;
      inside = !inside;
    }
    cur = cur.next;
  } while (cur !== subj);
  const results = [];
  cur = subj;
  do {
    if (cur.isIntersection && cur.entering && !cur.visited) {
      const poly = [];
      let walker = cur;
      let onSubject = true;
      for (let safety = 0; safety < 1e3; safety++) {
        walker.visited = true;
        if (walker.partner) walker.partner.visited = true;
        poly.push(walker.pos);
        walker = walker.next;
        if (walker.isIntersection) {
          if (walker === cur) break;
          walker.visited = true;
          if (walker.partner) walker.partner.visited = true;
          if (walker.partner) {
            walker = walker.partner;
            onSubject = !onSubject;
          }
        }
        if (walker === cur) break;
      }
      if (poly.length >= 3) results.push(poly);
    }
    cur = cur.next;
  } while (cur !== subj);
  return results;
}

// src/core/geometry/mesh/MeshAnalysis.ts
var MeshAnalysis = {
  /** Compute mesh volume (for closed, consistent-winding triangle meshes) */
  meshVolume(mesh) {
    let volume = 0;
    for (const face of mesh.faces()) {
      if (face.nodes.length !== 3) continue;
      const a = mesh.node(face.nodes[0]).position;
      const b = mesh.node(face.nodes[1]).position;
      const c = mesh.node(face.nodes[2]).position;
      volume += a.dot(b.cross(c)) / 6;
    }
    return Math.abs(volume);
  },
  /** Compute mesh surface area */
  meshSurfaceArea(mesh) {
    let area = 0;
    for (const face of mesh.faces()) {
      if (face.nodes.length < 3) continue;
      const positions = face.nodes.map((n) => mesh.node(n).position);
      for (let i = 1; i < positions.length - 1; i++) {
        area += positions[i].sub(positions[0]).cross(positions[i + 1].sub(positions[0])).len() * 0.5;
      }
    }
    return area;
  },
  /** Mesh centroid (vertex average) */
  meshCentroid(mesh) {
    let sum = Vec3.zero();
    let count = 0;
    for (const node of mesh.nodes()) {
      sum = sum.add(node.position);
      count++;
    }
    return count > 0 ? sum.div(count) : Vec3.zero();
  },
  /** Laplacian smooth (moves each vertex toward the average of its neighbors) */
  laplacianSmooth(mesh, iterations = 1, factor = 0.5) {
    for (let iter = 0; iter < iterations; iter++) {
      const newPositions = /* @__PURE__ */ new Map();
      for (const node of mesh.nodes()) {
        const neighbors = mesh.nodeNeighbors(node.id);
        if (neighbors.length === 0 || mesh.isBoundaryNode(node.id)) {
          newPositions.set(node.id, node.position);
          continue;
        }
        const avg = neighbors.map((nid) => mesh.node(nid).position).reduce((s, p) => s.add(p), Vec3.zero()).div(neighbors.length);
        newPositions.set(node.id, node.position.lerp(avg, factor));
      }
      for (const [id, pos] of newPositions) {
        const node = mesh.node(id);
        node.position = pos;
      }
    }
    mesh.computeVertexNormals();
  },
  /** 3D Convex hull — returns a ConnectedMesh */
  convexHull3D(points) {
    if (points.length < 4) return new ConnectedMesh();
    const mesh = new ConnectedMesh();
    const ids = mesh.addNodes(points);
    let i0 = 0, i1 = 1, i2 = -1, i3 = -1;
    for (let i = 2; i < points.length; i++) {
      const cross = points[i1].sub(points[i0]).cross(points[i].sub(points[i0]));
      if (cross.len() > 1e-8) {
        i2 = i;
        break;
      }
    }
    if (i2 === -1) return mesh;
    const testNormal = points[i1].sub(points[i0]).cross(points[i2].sub(points[i0])).normalize();
    for (let i = 0; i < points.length; i++) {
      if (i === i0 || i === i1 || i === i2) continue;
      const d2 = Math.abs(points[i].sub(points[i0]).dot(testNormal));
      if (d2 > 1e-8) {
        i3 = i;
        break;
      }
    }
    if (i3 === -1) return mesh;
    const d = points[i3].sub(points[i0]).dot(testNormal);
    if (d > 0) {
      mesh.addTriangle(ids[i0], ids[i2], ids[i1]);
      mesh.addTriangle(ids[i0], ids[i1], ids[i3]);
      mesh.addTriangle(ids[i1], ids[i2], ids[i3]);
      mesh.addTriangle(ids[i2], ids[i0], ids[i3]);
    } else {
      mesh.addTriangle(ids[i0], ids[i1], ids[i2]);
      mesh.addTriangle(ids[i0], ids[i3], ids[i1]);
      mesh.addTriangle(ids[i1], ids[i3], ids[i2]);
      mesh.addTriangle(ids[i2], ids[i3], ids[i0]);
    }
    const used = /* @__PURE__ */ new Set([i0, i1, i2, i3]);
    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue;
      const p = points[i];
      mesh.computeFaceNormals();
      const visible = [];
      for (const face of mesh.faces()) {
        if (!face.normal) continue;
        const centroid = face.nodes.map((nid) => mesh.node(nid).position).reduce((s, v) => s.add(v), Vec3.zero()).div(face.nodes.length);
        if (p.sub(centroid).dot(face.normal) > 1e-8) {
          visible.push(face.id);
        }
      }
      if (visible.length === 0) continue;
      used.add(i);
      const edgeVisCount = /* @__PURE__ */ new Map();
      for (const fid of visible) {
        const face = mesh.face(fid);
        for (const eid of face.edges) {
          edgeVisCount.set(eid, (edgeVisCount.get(eid) || 0) + 1);
        }
      }
      const horizon = [];
      for (const [eid, count] of edgeVisCount) {
        if (count === 1) horizon.push(eid);
      }
      for (const fid of visible) mesh.removeFace(fid);
      const pid = ids[i];
      for (const eid of horizon) {
        const edge = mesh.edge(eid);
        if (!edge) continue;
        let a = edge.nodes[0], b = edge.nodes[1];
        const survivingFace = edge.faces.length > 0 ? mesh.face(edge.faces[0]) : void 0;
        if (survivingFace) {
          const nl = survivingFace.nodes;
          for (let si = 0; si < nl.length; si++) {
            if (nl[si] === edge.nodes[0] && nl[(si + 1) % nl.length] === edge.nodes[1]) {
              a = edge.nodes[1];
              b = edge.nodes[0];
              break;
            }
          }
        }
        mesh.addTriangle(a, b, pid);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  }
};

// src/core/geometry/curves/index.ts
var ArcLengthCache = class {
  constructor(precisionSteps = 50) {
    this.table = [];
    this._totalLength = 0;
    this.steps = precisionSteps;
  }
  get totalLength() {
    return this._totalLength;
  }
  rebuild(getPoint) {
    this.table = [0];
    let currentLen = 0;
    let prevPos = getPoint(0);
    const step = 1 / this.steps;
    for (let i = 1; i <= this.steps; i++) {
      const t = i * step;
      const currentPos = getPoint(t);
      currentLen += prevPos.distTo(currentPos);
      this.table.push(currentLen);
      prevPos = currentPos;
    }
    this._totalLength = currentLen;
  }
  getTFromDistance(distance) {
    if (distance <= 0) return 0;
    if (distance >= this._totalLength) return 1;
    let lo = 0, hi = this.table.length - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >> 1;
      if (this.table[mid] < distance) lo = mid;
      else hi = mid;
    }
    const lenPrev = this.table[lo];
    const lenNext = this.table[hi];
    const ratio = (distance - lenPrev) / (lenNext - lenPrev);
    const stepSize = 1 / this.steps;
    return lo * stepSize + ratio * stepSize;
  }
};
var LineCurve = class {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  get length() {
    return this.start.distTo(this.end);
  }
  getTFromDistance(distance) {
    const len = this.length;
    if (len <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / len, 0, 1);
  }
  getPoint(t) {
    return this.start.lerp(this.end, HMath.clamp(t, 0, 1));
  }
  getTangent(_t) {
    return this.end.sub(this.start).normalize();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var ArcCurve = class {
  constructor(center, radius, startAngle, sweepAngle, normal) {
    this.center = center;
    this.radius = radius;
    this.startAngle = startAngle;
    this.sweepAngle = sweepAngle;
    this.normal = normal;
    this.normal = normal.normalize();
    let fwd = this.normal.cross(Vec3.unitY());
    if (fwd.lenSq() < 1e-3) fwd = this.normal.cross(Vec3.unitX());
    this.forward = fwd.normalize();
  }
  get length() {
    return Math.abs(this.radius * this.sweepAngle);
  }
  getTFromDistance(distance) {
    return HMath.clamp(distance / this.length, 0, 1);
  }
  getPoint(t) {
    const angle = this.startAngle + this.sweepAngle * t;
    const c = Math.cos(angle), s = Math.sin(angle);
    const k = this.normal;
    const v = this.forward;
    const rotated = v.mul(c).add(k.cross(v).mul(s)).add(k.mul(k.dot(v) * (1 - c)));
    return this.center.add(rotated.mul(this.radius));
  }
  getTangent(t) {
    const angle = this.startAngle + this.sweepAngle * t;
    const c = Math.cos(angle), s = Math.sin(angle);
    const k = this.normal;
    const v = this.forward;
    const direction = v.mul(c).add(k.cross(v).mul(s)).add(k.mul(k.dot(v) * (1 - c)));
    const tangent = k.cross(direction);
    return this.sweepAngle >= 0 ? tangent : tangent.neg();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var HelixCurve = class {
  constructor(center, radius, startAngle, sweepAngle, startZ, endZ) {
    this.center = center;
    this.radius = radius;
    this.startAngle = startAngle;
    this.sweepAngle = sweepAngle;
    this.startZ = startZ;
    this.endZ = endZ;
  }
  get length() {
    const absSweep = Math.abs(this.sweepAngle);
    if (absSweep < HMath.EPSILON) return Math.abs(this.endZ - this.startZ);
    const dz = this.endZ - this.startZ;
    const pitchPerRad = dz / this.sweepAngle;
    return absSweep * Math.sqrt(this.radius * this.radius + pitchPerRad * pitchPerRad);
  }
  getTFromDistance(distance) {
    const len = this.length;
    if (len <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / len, 0, 1);
  }
  getPoint(t) {
    const a = this.startAngle + this.sweepAngle * t;
    const z = this.startZ + (this.endZ - this.startZ) * t;
    return new Vec3(
      this.center.x + this.radius * Math.cos(a),
      this.center.y + this.radius * Math.sin(a),
      z
    );
  }
  getTangent(t) {
    const a = this.startAngle + this.sweepAngle * t;
    const dz = this.endZ - this.startZ;
    return new Vec3(
      -this.radius * Math.sin(a) * this.sweepAngle,
      this.radius * Math.cos(a) * this.sweepAngle,
      dz
    ).normalize();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var CubicBezierCurve = class {
  constructor(p0, p1, p2, p3) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.cache = new ArcLengthCache(50);
    this.cache.rebuild((t) => this.getPoint(t));
  }
  updateControlPoints(p0, p1, p2, p3) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.cache.rebuild((t) => this.getPoint(t));
  }
  getPoint(t) {
    t = HMath.clamp(t, 0, 1);
    const u = 1 - t;
    const tt = t * t, uu = u * u;
    const uuu = uu * u, ttt = tt * t;
    return this.p0.mul(uuu).add(this.p1.mul(3 * uu * t)).add(this.p2.mul(3 * u * tt)).add(this.p3.mul(ttt));
  }
  getTangent(t) {
    t = HMath.clamp(t, 0, 1);
    const u = 1 - t;
    const uu = u * u, tt = t * t;
    return this.p1.sub(this.p0).mul(3 * uu).add(this.p2.sub(this.p1).mul(6 * u * t)).add(this.p3.sub(this.p2).mul(3 * tt)).normalize();
  }
  get length() {
    return this.cache.totalLength;
  }
  getTFromDistance(distance) {
    return this.cache.getTFromDistance(distance);
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var NurbsCurve = class {
  constructor(controlPoints, degree, knots, weights) {
    this.controlPoints = controlPoints;
    this.degree = degree;
    this.knots = knots;
    this.weights = weights;
    this.cache = new ArcLengthCache(100);
    this.cache.rebuild((t) => this.getPoint(t));
  }
  getPoint(t) {
    const uMin = this.knots[this.degree];
    const uMax = this.knots[this.knots.length - this.degree - 1];
    const u = uMin + (uMax - uMin) * HMath.clamp(t, 0, 1);
    return this.evaluateDeBoor(u);
  }
  getTangent(t) {
    const eps = 1e-3;
    const t0 = HMath.clamp(t - eps, 0, 1);
    const t1 = HMath.clamp(t + eps, 0, 1);
    return this.getPoint(t1).sub(this.getPoint(t0)).normalize();
  }
  get length() {
    return this.cache.totalLength;
  }
  getTFromDistance(distance) {
    return this.cache.getTFromDistance(distance);
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
  evaluateDeBoor(u) {
    const k = this.findKnotSpan(u);
    const d = [];
    for (let j = 0; j <= this.degree; j++) {
      d[j] = this.controlPoints[k - this.degree + j];
    }
    for (let r = 1; r <= this.degree; r++) {
      for (let j = this.degree; j >= r; j--) {
        const denom = this.knots[k + 1 + j - r] - this.knots[k - this.degree + j];
        const alpha = (u - this.knots[k - this.degree + j]) / denom;
        d[j] = d[j - 1].mul(1 - alpha).add(d[j].mul(alpha));
      }
    }
    return d[this.degree];
  }
  findKnotSpan(u) {
    const n = this.controlPoints.length - 1;
    if (Math.abs(u - this.knots[n + 1]) < 1e-4) return n;
    let low = this.degree, high = n + 1;
    let mid = low + high >> 1;
    while (u < this.knots[mid] || u >= this.knots[mid + 1]) {
      if (u < this.knots[mid]) high = mid;
      else low = mid;
      mid = low + high >> 1;
    }
    return mid;
  }
};
var PolylineCurve = class {
  constructor(points) {
    if (points.length < 2) throw new Error("Polyline must have at least 2 points.");
    this.points = [...points];
    this.accumulatedLengths = [0];
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
      sum += points[i].distTo(points[i + 1]);
      this.accumulatedLengths.push(sum);
    }
    this._totalLength = sum;
  }
  get length() {
    return this._totalLength;
  }
  getTFromDistance(distance) {
    if (this._totalLength <= HMath.EPSILON) return 0;
    return HMath.clamp(distance / this._totalLength, 0, 1);
  }
  getPoint(t) {
    const targetDist = HMath.clamp(t, 0, 1) * this._totalLength;
    let lo = 0, hi = this.accumulatedLengths.length - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >> 1;
      if (this.accumulatedLengths[mid] < targetDist) lo = mid;
      else hi = mid;
    }
    if (hi >= this.points.length) return this.points[this.points.length - 1];
    if (lo < 0) return this.points[0];
    const distStart = this.accumulatedLengths[lo];
    const distEnd = this.accumulatedLengths[hi];
    const segLen = distEnd - distStart;
    if (segLen < HMath.EPSILON) return this.points[lo];
    const alpha = (targetDist - distStart) / segLen;
    return this.points[lo].lerp(this.points[hi], alpha);
  }
  getTangent(t) {
    const targetDist = HMath.clamp(t, 0, 1) * this._totalLength;
    let lo = 0, hi = this.accumulatedLengths.length - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >> 1;
      if (this.accumulatedLengths[mid] < targetDist) lo = mid;
      else hi = mid;
    }
    const segIdx = Math.min(lo, this.points.length - 2);
    return this.points[segIdx + 1].sub(this.points[segIdx]).normalize();
  }
  getPointAtDistance(distance) {
    return this.getPoint(this.getTFromDistance(distance));
  }
};
var CurveUtils = {
  /** Returns exactly 'count' points distributed along the curve. */
  divideByCount(curve, count) {
    if (count < 2) count = 2;
    const points = [];
    if ("length" in curve && typeof curve.getTFromDistance === "function") {
      const mc = curve;
      const stepDist = mc.length / (count - 1);
      for (let i = 0; i < count; i++) {
        if (i === 0) points.push(curve.getPoint(0));
        else if (i === count - 1) points.push(curve.getPoint(1));
        else points.push(mc.getPointAtDistance(i * stepDist));
      }
    } else {
      const stepT = 1 / (count - 1);
      for (let i = 0; i < count; i++) {
        points.push(curve.getPoint(i * stepT));
      }
    }
    return points;
  },
  /** Steps along the curve by exactly 'segmentLength'. */
  divideByFixedLength(curve, segmentLength) {
    if (segmentLength <= 1e-4) return [curve.getPoint(0), curve.getPoint(1)];
    const totalLength = curve.length;
    const points = [];
    let d = 0;
    while (d <= totalLength) {
      points.push(curve.getPointAtDistance(d));
      d += segmentLength;
    }
    const endPt = curve.getPoint(1);
    if (points[points.length - 1].distTo(endPt) > 1e-3) {
      points.push(endPt);
    }
    return points;
  },
  /** Divides curve with segments roughly equal to targetLength (all equal). */
  divideByTargetLength(curve, targetLength) {
    const totalLength = curve.length;
    if (totalLength <= targetLength) return [curve.getPoint(0), curve.getPoint(1)];
    const segments = Math.max(1, Math.round(totalLength / targetLength));
    return CurveUtils.divideByCount(curve, segments + 1);
  },
  /** Evaluate one component of a cubic Bezier at parameter t. */
  cubicEval(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  },
  /** Extract sub-curve [tStart, tEnd] from a cubic Bezier via De Casteljau. */
  splitCubic(p0, p1, p2, p3, tStart, tEnd) {
    function lerp3(a2, b2, t) {
      return new Vec3(a2.x + (b2.x - a2.x) * t, a2.y + (b2.y - a2.y) * t, a2.z + (b2.z - a2.z) * t);
    }
    function splitAt(q0, q1, q2, q3, t) {
      const a2 = lerp3(q0, q1, t), b2 = lerp3(q1, q2, t), c2 = lerp3(q2, q3, t);
      const d = lerp3(a2, b2, t), e = lerp3(b2, c2, t);
      const f2 = lerp3(d, e, t);
      return { left: [q0, a2, d, f2], right: [f2, e, c2, q3] };
    }
    if (tStart <= 0 && tEnd >= 1) return new CubicBezierCurve(p0, p1, p2, p3);
    const { left } = splitAt(p0, p1, p2, p3, tEnd);
    const [a, b, c, d_] = left;
    const tMapped = tEnd > 1e-12 ? tStart / tEnd : 0;
    const { right } = splitAt(a, b, c, d_, tMapped);
    const [ra, rb, rc, rd] = right;
    return new CubicBezierCurve(ra, rb, rc, rd);
  },
  /** Binary search for parameter t where curve.getPoint(t)[component] ~ target. Assumes monotonic. */
  findTForComponent(curve, target, component, iterations = 40) {
    let lo = 0, hi = 1;
    for (let i = 0; i < iterations; i++) {
      const mid = (lo + hi) / 2;
      if (curve.getPoint(mid)[component] < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  },
  /** Unroll a 3D polyline into a flat elevation profile: X = cumulative XY arc length, Z = original height. */
  unrollPolyline(pts, yOffset = 0) {
    const out = [];
    let cumD = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
        cumD += Math.sqrt(dx * dx + dy * dy);
      }
      out.push(new Vec3(cumD, yOffset, pts[i].z));
    }
    return out;
  },
  /** Find the unrolled X position for a 3D point projected onto a polyline's XY footprint. */
  findUnrollX(polyline, pt) {
    let bestDist = Infinity, bestCum = 0, cumDist = 0;
    for (let i = 1; i < polyline.length; i++) {
      const a = polyline[i - 1], b = polyline[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const px = pt.x - a.x, py = pt.y - a.y;
      let t = segLen > 0 ? (px * dx + py * dy) / (segLen * segLen) : 0;
      t = Math.max(0, Math.min(1, t));
      const cx = a.x + dx * t, cy = a.y + dy * t;
      const d = Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2);
      if (d < bestDist) {
        bestDist = d;
        bestCum = cumDist + segLen * t;
      }
      cumDist += segLen;
    }
    return bestCum;
  },
  /**
   * Compute rotation-minimizing (parallel transport) frames along a polyline path.
   * Returns one frame per path point: tangent T, normal U, binormal V (all unit vectors).
   */
  parallelTransportFrames(path) {
    if (path.length < 2) return [];
    const frames = [];
    let T = path[1].sub(path[0]).normalize();
    let U = T.cross(Vec3.unitZ());
    if (U.lenSq() < 1e-3) U = T.cross(Vec3.unitX());
    U = U.normalize();
    let V = T.cross(U).normalize();
    frames.push({ tangent: T, normal: U, binormal: V });
    for (let i = 1; i < path.length; i++) {
      if (i < path.length - 1) {
        T = path[i + 1].sub(path[i - 1]).normalize();
      } else {
        T = path[i].sub(path[i - 1]).normalize();
      }
      U = U.sub(T.mul(T.dot(U))).normalize();
      if (U.lenSq() < 1e-12) {
        U = T.cross(Vec3.unitZ());
        if (U.lenSq() < 1e-3) U = T.cross(Vec3.unitX());
        U = U.normalize();
      }
      V = T.cross(U).normalize();
      frames.push({ tangent: T, normal: U, binormal: V });
    }
    return frames;
  },
  /**
   * Constructs a circular arc starting at p1 with the given tangent direction,
   * ending at p2. The arc lies in the XY plane (Z = 0).
   *
   * Finds the center at the intersection of:
   *  - the perpendicular to the tangent at p1
   *  - the perpendicular bisector of chord p1→p2
   */
  arcFromPointTangentPoint(p1, tangent, p2) {
    const perpX = -tangent.y, perpY = tangent.x;
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const chordDx = p2.x - p1.x, chordDy = p2.y - p1.y;
    const pbDx = -chordDy, pbDy = chordDx;
    const det = perpX * pbDy - perpY * pbDx;
    if (Math.abs(det) < 1e-12) {
      return new ArcCurve(
        new Vec3(mx, my, 0),
        1e6,
        0,
        0,
        Vec3.unitZ()
      );
    }
    const t = ((mx - p1.x) * pbDy - (my - p1.y) * pbDx) / det;
    const cx = p1.x + t * perpX;
    const cy = p1.y + t * perpY;
    const radius = Math.hypot(cx - p1.x, cy - p1.y);
    const startAngle = Math.atan2(p1.y - cy, p1.x - cx);
    let endAngle = Math.atan2(p2.y - cy, p2.x - cx);
    const radDx = p1.x - cx, radDy = p1.y - cy;
    const ccwDot = tangent.x * -radDy + tangent.y * radDx;
    let ccwSweep = endAngle - startAngle;
    if (ccwSweep < 0) ccwSweep += Math.PI * 2;
    const sweepAngle = ccwDot > 0 ? ccwSweep : -(Math.PI * 2 - ccwSweep);
    return new ArcCurve(
      new Vec3(cx, cy, 0),
      radius,
      startAngle,
      sweepAngle,
      Vec3.unitZ()
    );
  }
};

// src/core/geometry/mesh/MeshFactory.ts
var MeshFactory = {
  // ── Parametric Surfaces ──
  grid(width, depth, divisionsX, divisionsZ, heightFn = () => 0) {
    const mesh = new ConnectedMesh();
    const ids = [];
    for (let iz = 0; iz <= divisionsZ; iz++) {
      ids[iz] = [];
      for (let ix = 0; ix <= divisionsX; ix++) {
        const x = (ix / divisionsX - 0.5) * width;
        const z = (iz / divisionsZ - 0.5) * depth;
        const y = heightFn(x, z);
        ids[iz][ix] = mesh.addNode(new Vec3(x, y, z));
      }
    }
    for (let iz = 0; iz < divisionsZ; iz++) {
      for (let ix = 0; ix < divisionsX; ix++) {
        mesh.addQuad(ids[iz][ix], ids[iz][ix + 1], ids[iz + 1][ix + 1], ids[iz + 1][ix]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  extrude(polygon, direction, cap = true) {
    const mesh = new ConnectedMesh();
    const n = polygon.length;
    const bottom = polygon.map((p) => mesh.addNode(p));
    const top = polygon.map((p) => mesh.addNode(p.add(direction)));
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      mesh.addQuad(bottom[i], bottom[next], top[next], top[i]);
    }
    if (cap && n >= 3) {
      mesh.addFace(bottom);
      mesh.addFace([...top].reverse());
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  revolve(profile, segments = 32, angleRange = Math.PI * 2) {
    const mesh = new ConnectedMesh();
    const n = profile.length;
    const ids = [];
    const isClosed = Math.abs(angleRange - Math.PI * 2) < 1e-6;
    const slices = isClosed ? segments : segments + 1;
    for (let s = 0; s < slices; s++) {
      ids[s] = [];
      const angle = s / segments * angleRange;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let i = 0; i < n; i++) {
        const p = profile[i];
        ids[s][i] = mesh.addNode(new Vec3(p.x * cos, p.y, p.x * sin));
      }
    }
    for (let s = 0; s < segments; s++) {
      const ns = (s + 1) % slices;
      for (let i = 0; i < n - 1; i++) {
        mesh.addQuad(ids[s][i], ids[s][i + 1], ids[ns][i + 1], ids[ns][i]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  loft(profiles, closedProfile = true) {
    const mesh = new ConnectedMesh();
    const ids = [];
    for (let p = 0; p < profiles.length; p++) {
      ids[p] = profiles[p].map((pos) => mesh.addNode(pos));
    }
    for (let p = 0; p < profiles.length - 1; p++) {
      const currIds = ids[p];
      const nextIds = ids[p + 1];
      const n = Math.min(currIds.length, nextIds.length);
      const limit = closedProfile ? n : n - 1;
      for (let i = 0; i < limit; i++) {
        const ni = (i + 1) % n;
        mesh.addQuad(currIds[i], currIds[ni], nextIds[ni], nextIds[i]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  // ── Primitives ──
  box(width = 1, height = 1, depth = 1) {
    const w = width / 2, h = height / 2, d = depth / 2;
    const mesh = new ConnectedMesh();
    const v = [
      mesh.addNode(new Vec3(-w, -h, -d)),
      mesh.addNode(new Vec3(w, -h, -d)),
      mesh.addNode(new Vec3(w, h, -d)),
      mesh.addNode(new Vec3(-w, h, -d)),
      mesh.addNode(new Vec3(-w, -h, d)),
      mesh.addNode(new Vec3(w, -h, d)),
      mesh.addNode(new Vec3(w, h, d)),
      mesh.addNode(new Vec3(-w, h, d))
    ];
    mesh.addQuad(v[0], v[3], v[2], v[1]);
    mesh.addQuad(v[4], v[5], v[6], v[7]);
    mesh.addQuad(v[0], v[1], v[5], v[4]);
    mesh.addQuad(v[2], v[3], v[7], v[6]);
    mesh.addQuad(v[0], v[4], v[7], v[3]);
    mesh.addQuad(v[1], v[2], v[6], v[5]);
    mesh.computeVertexNormals();
    return mesh;
  },
  sphere(radius = 1, segments = 24, rings = 16) {
    const mesh = new ConnectedMesh();
    const ids = [];
    for (let r = 0; r <= rings; r++) {
      ids[r] = [];
      const phi = r / rings * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      for (let s = 0; s <= segments; s++) {
        const theta = s / segments * Math.PI * 2;
        ids[r][s] = mesh.addNode(new Vec3(
          radius * sinPhi * Math.cos(theta),
          radius * cosPhi,
          radius * sinPhi * Math.sin(theta)
        ));
      }
    }
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        if (r > 0) {
          mesh.addTriangle(ids[r][s], ids[r][s + 1], ids[r + 1][s + 1]);
        }
        if (r < rings - 1) {
          mesh.addTriangle(ids[r][s], ids[r + 1][s + 1], ids[r + 1][s]);
        }
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  cylinder(radiusTop = 1, radiusBottom = 1, height = 2, segments = 24, cap = true) {
    const mesh = new ConnectedMesh();
    const h2 = height / 2;
    const bottomIds = [];
    const topIds = [];
    for (let s = 0; s <= segments; s++) {
      const angle = s / segments * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      bottomIds.push(mesh.addNode(new Vec3(radiusBottom * cos, -h2, radiusBottom * sin)));
      topIds.push(mesh.addNode(new Vec3(radiusTop * cos, h2, radiusTop * sin)));
    }
    for (let s = 0; s < segments; s++) {
      mesh.addQuad(bottomIds[s], bottomIds[s + 1], topIds[s + 1], topIds[s]);
    }
    if (cap) {
      const bottomCenter = mesh.addNode(new Vec3(0, -h2, 0));
      const topCenter = mesh.addNode(new Vec3(0, h2, 0));
      for (let s = 0; s < segments; s++) {
        mesh.addTriangle(bottomCenter, bottomIds[s + 1], bottomIds[s]);
        mesh.addTriangle(topCenter, topIds[s], topIds[s + 1]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  torus(majorRadius = 1, minorRadius = 0.3, segments = 32, sides = 16) {
    const mesh = new ConnectedMesh();
    const ids = [];
    for (let s = 0; s <= segments; s++) {
      ids[s] = [];
      const theta = s / segments * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      for (let r = 0; r <= sides; r++) {
        const phi = r / sides * Math.PI * 2;
        const x = (majorRadius + minorRadius * Math.cos(phi)) * cosT;
        const y = minorRadius * Math.sin(phi);
        const z = (majorRadius + minorRadius * Math.cos(phi)) * sinT;
        ids[s][r] = mesh.addNode(new Vec3(x, y, z));
      }
    }
    for (let s = 0; s < segments; s++) {
      for (let r = 0; r < sides; r++) {
        mesh.addQuad(ids[s][r], ids[s][r + 1], ids[s + 1][r + 1], ids[s + 1][r]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  /**
   * Create a tube mesh by sweeping a circular cross-section along a path.
   * Accepts uniform radius (number) or per-point varying radii (number[]).
   */
  pipe(path, radius, sides = 8) {
    const mesh = new ConnectedMesh();
    const frames = CurveUtils.parallelTransportFrames(path);
    if (frames.length === 0) return mesh;
    const ids = [];
    for (let p = 0; p < path.length; p++) {
      ids[p] = [];
      const r = typeof radius === "number" ? radius : radius[p];
      const frame = frames[p];
      for (let s = 0; s < sides; s++) {
        const angle = s / sides * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const offset = frame.normal.mul(cos * r).add(frame.binormal.mul(sin * r));
        ids[p][s] = mesh.addNode(path[p].add(offset));
      }
    }
    for (let p = 0; p < path.length - 1; p++) {
      for (let s = 0; s < sides; s++) {
        const ns = (s + 1) % sides;
        mesh.addQuad(ids[p][s], ids[p][ns], ids[p + 1][ns], ids[p + 1][s]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  },
  // ── Mesh Modifiers ──
  subdivide(mesh) {
    const result = new ConnectedMesh();
    const facePoints = /* @__PURE__ */ new Map();
    const edgePoints = /* @__PURE__ */ new Map();
    const nodeMap = /* @__PURE__ */ new Map();
    for (const face of mesh.faces()) {
      const positions = face.nodes.map((nid) => mesh.node(nid).position);
      const centroid = positions.reduce((sum, p) => sum.add(p), Vec3.zero()).div(positions.length);
      facePoints.set(face.id, result.addNode(centroid));
    }
    for (const edge of mesh.edges()) {
      const p0 = mesh.node(edge.nodes[0]).position;
      const p1 = mesh.node(edge.nodes[1]).position;
      const mid = p0.lerp(p1, 0.5);
      if (edge.faces.length === 2) {
        const fc0 = mesh.face(edge.faces[0]).nodes.map((n) => mesh.node(n).position);
        const fc1 = mesh.face(edge.faces[1]).nodes.map((n) => mesh.node(n).position);
        const c0 = fc0.reduce((s, p) => s.add(p), Vec3.zero()).div(fc0.length);
        const c1 = fc1.reduce((s, p) => s.add(p), Vec3.zero()).div(fc1.length);
        const ep = p0.add(p1).add(c0).add(c1).mul(0.25);
        edgePoints.set(edge.id, result.addNode(ep));
      } else {
        edgePoints.set(edge.id, result.addNode(mid));
      }
    }
    for (const node of mesh.nodes()) {
      const n = node.faces.length;
      if (n === 0) {
        nodeMap.set(node.id, result.addNode(node.position));
        continue;
      }
      const F = node.faces.map((fid) => {
        const fp = facePoints.get(fid);
        return result.node(fp).position;
      }).reduce((s, p) => s.add(p), Vec3.zero()).div(n);
      const R = node.edges.map((eid) => {
        const e = mesh.edge(eid);
        const p0 = mesh.node(e.nodes[0]).position;
        const p1 = mesh.node(e.nodes[1]).position;
        return p0.lerp(p1, 0.5);
      }).reduce((s, p) => s.add(p), Vec3.zero()).div(node.edges.length);
      const newPos = F.add(R.mul(2)).add(node.position.mul(n - 3)).div(n);
      nodeMap.set(node.id, result.addNode(mesh.isBoundaryNode(node.id) ? node.position : newPos));
    }
    for (const face of mesh.faces()) {
      const fp = facePoints.get(face.id);
      const n = face.nodes.length;
      for (let i = 0; i < n; i++) {
        const curr = face.nodes[i];
        const prevEdge = face.edges[(i + n - 1) % n];
        const currEdge = face.edges[i];
        result.addQuad(
          edgePoints.get(prevEdge),
          nodeMap.get(curr),
          edgePoints.get(currEdge),
          fp
        );
      }
    }
    result.computeVertexNormals();
    return result;
  },
  triangulate(mesh) {
    const result = mesh.clone();
    for (const face of [...result.faces()]) {
      if (face.nodes.length <= 3) continue;
      const nodes = face.nodes;
      result.removeFace(face.id);
      for (let i = 1; i < nodes.length - 1; i++) {
        result.addTriangle(nodes[0], nodes[i], nodes[i + 1]);
      }
    }
    result.computeVertexNormals();
    return result;
  }
};

// src/core/geometry/mesh/Mesh.ts
var Mesh = class _Mesh {
  constructor(positions, indices, normals, uvs, colors) {
    this._adjacency = null;
    this._bounds = null;
    this.positions = positions;
    this.indices = indices;
    this.normals = normals ?? new Float32Array(positions.length);
    this.uvs = uvs ?? null;
    this.colors = colors ?? null;
    if (!normals) this.computeNormals();
  }
  // ── Counts ──
  get vertexCount() {
    return this.positions.length / 3;
  }
  get triangleCount() {
    return this.indices.length / 3;
  }
  get edgeCount() {
    return this.adjacency.edges.length / 2;
  }
  // ── Vertex Access ──
  getPosition(i) {
    const o = i * 3;
    return new Vec3(this.positions[o], this.positions[o + 1], this.positions[o + 2]);
  }
  setPosition(i, p) {
    const o = i * 3;
    this.positions[o] = p.x;
    this.positions[o + 1] = p.y;
    this.positions[o + 2] = p.z;
    this._bounds = null;
  }
  getNormal(i) {
    const o = i * 3;
    return new Vec3(this.normals[o], this.normals[o + 1], this.normals[o + 2]);
  }
  getTriangle(triIdx) {
    const o = triIdx * 3;
    return [this.indices[o], this.indices[o + 1], this.indices[o + 2]];
  }
  getTrianglePositions(triIdx) {
    const [a, b, c] = this.getTriangle(triIdx);
    return [this.getPosition(a), this.getPosition(b), this.getPosition(c)];
  }
  // ── Normals ──
  computeNormals() {
    const pos = this.positions, nrm = this.normals, idx = this.indices;
    nrm.fill(0);
    for (let t = 0; t < idx.length; t += 3) {
      const ai = idx[t] * 3, bi = idx[t + 1] * 3, ci = idx[t + 2] * 3;
      const abx = pos[bi] - pos[ai], aby = pos[bi + 1] - pos[ai + 1], abz = pos[bi + 2] - pos[ai + 2];
      const acx = pos[ci] - pos[ai], acy = pos[ci + 1] - pos[ai + 1], acz = pos[ci + 2] - pos[ai + 2];
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      nrm[ai] += nx;
      nrm[ai + 1] += ny;
      nrm[ai + 2] += nz;
      nrm[bi] += nx;
      nrm[bi + 1] += ny;
      nrm[bi + 2] += nz;
      nrm[ci] += nx;
      nrm[ci + 1] += ny;
      nrm[ci + 2] += nz;
    }
    for (let i = 0; i < nrm.length; i += 3) {
      const x = nrm[i], y = nrm[i + 1], z = nrm[i + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 1e-12) {
        const inv = 1 / len;
        nrm[i] *= inv;
        nrm[i + 1] *= inv;
        nrm[i + 2] *= inv;
      } else {
        nrm[i] = 0;
        nrm[i + 1] = 1;
        nrm[i + 2] = 0;
      }
    }
  }
  // ── Lazy Adjacency ──
  get adjacency() {
    if (!this._adjacency) this._adjacency = this._buildAdjacency();
    return this._adjacency;
  }
  invalidateAdjacency() {
    this._adjacency = null;
  }
  _buildAdjacency() {
    const vc = this.vertexCount;
    const idx = this.indices;
    const tc = this.triangleCount;
    const vtCounts = new Uint32Array(vc);
    for (let i = 0; i < idx.length; i++) vtCounts[idx[i]]++;
    const vertexTriangles = new Array(vc);
    const vtOffsets = new Uint32Array(vc);
    for (let v = 0; v < vc; v++) vertexTriangles[v] = new Uint32Array(vtCounts[v]);
    for (let t = 0; t < tc; t++) {
      const o = t * 3;
      for (let j = 0; j < 3; j++) {
        const v = idx[o + j];
        vertexTriangles[v][vtOffsets[v]++] = t;
      }
    }
    const edgeSet = /* @__PURE__ */ new Map();
    const edgeTris = /* @__PURE__ */ new Map();
    const neighborSets = new Array(vc);
    for (let v = 0; v < vc; v++) neighborSets[v] = /* @__PURE__ */ new Set();
    for (let t = 0; t < tc; t++) {
      const o = t * 3;
      for (let j = 0; j < 3; j++) {
        const a = idx[o + j], b = idx[o + (j + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (!edgeSet.has(key)) edgeSet.set(key, [Math.min(a, b), Math.max(a, b)]);
        if (!edgeTris.has(key)) edgeTris.set(key, []);
        edgeTris.get(key).push(t);
        neighborSets[a].add(b);
        neighborSets[b].add(a);
      }
    }
    const neighbors = neighborSets.map((s) => new Uint32Array(s));
    const edges = new Uint32Array(edgeSet.size * 2);
    let ei = 0;
    for (const [a, b] of edgeSet.values()) {
      edges[ei++] = a;
      edges[ei++] = b;
    }
    const boundary = new Uint8Array(vc);
    for (const [key, tris] of edgeTris) {
      if (tris.length < 2) {
        const [a, b] = key.split(":").map(Number);
        boundary[a] = 1;
        boundary[b] = 1;
      }
    }
    return { neighbors, edges, vertexTriangles, edgeTriangles: edgeTris, boundary };
  }
  // ── Queries ──
  neighbors(i) {
    return this.adjacency.neighbors[i];
  }
  isBoundary(i) {
    return this.adjacency.boundary[i] === 1;
  }
  bounds() {
    if (this._bounds) return this._bounds;
    const pos = this.positions;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i + 1], z = pos[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    this._bounds = new AABB(new Vec3(minX, minY, minZ), new Vec3(maxX, maxY, maxZ));
    return this._bounds;
  }
  volume() {
    const pos = this.positions, idx = this.indices;
    let vol = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const ai = idx[t] * 3, bi = idx[t + 1] * 3, ci = idx[t + 2] * 3;
      vol += (pos[ai] * (pos[bi + 1] * pos[ci + 2] - pos[bi + 2] * pos[ci + 1]) + pos[ai + 1] * (pos[bi + 2] * pos[ci] - pos[bi] * pos[ci + 2]) + pos[ai + 2] * (pos[bi] * pos[ci + 1] - pos[bi + 1] * pos[ci])) / 6;
    }
    return Math.abs(vol);
  }
  surfaceArea() {
    const pos = this.positions, idx = this.indices;
    let area = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const ai = idx[t] * 3, bi = idx[t + 1] * 3, ci = idx[t + 2] * 3;
      const abx = pos[bi] - pos[ai], aby = pos[bi + 1] - pos[ai + 1], abz = pos[bi + 2] - pos[ai + 2];
      const acx = pos[ci] - pos[ai], acy = pos[ci + 1] - pos[ai + 1], acz = pos[ci + 2] - pos[ai + 2];
      const cx = aby * acz - abz * acy, cy = abz * acx - abx * acz, cz = abx * acy - aby * acx;
      area += Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    }
    return area;
  }
  centroid() {
    const pos = this.positions;
    let sx = 0, sy = 0, sz = 0;
    const n = this.vertexCount;
    for (let i = 0; i < pos.length; i += 3) {
      sx += pos[i];
      sy += pos[i + 1];
      sz += pos[i + 2];
    }
    return new Vec3(sx / n, sy / n, sz / n);
  }
  eulerCharacteristic() {
    return this.vertexCount - this.edgeCount + this.triangleCount;
  }
  // ── Modification ──
  smooth(iterations = 1, factor = 0.5) {
    const vc = this.vertexCount;
    const pos = this.positions;
    const adj = this.adjacency;
    const tmp = new Float32Array(pos.length);
    for (let iter = 0; iter < iterations; iter++) {
      tmp.set(pos);
      for (let v = 0; v < vc; v++) {
        if (adj.boundary[v]) continue;
        const nb = adj.neighbors[v];
        if (nb.length === 0) continue;
        const o = v * 3;
        let ax = 0, ay = 0, az = 0;
        for (let j = 0; j < nb.length; j++) {
          const no = nb[j] * 3;
          ax += tmp[no];
          ay += tmp[no + 1];
          az += tmp[no + 2];
        }
        const inv = 1 / nb.length;
        pos[o] = tmp[o] + (ax * inv - tmp[o]) * factor;
        pos[o + 1] = tmp[o + 1] + (ay * inv - tmp[o + 1]) * factor;
        pos[o + 2] = tmp[o + 2] + (az * inv - tmp[o + 2]) * factor;
      }
    }
    this.computeNormals();
    this._bounds = null;
  }
  translate(dx, dy, dz) {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += dx;
      pos[i + 1] += dy;
      pos[i + 2] += dz;
    }
    this._bounds = null;
  }
  scale(s) {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i++) pos[i] *= s;
    this._bounds = null;
  }
  scaleXYZ(sx, sy, sz) {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] *= sx;
      pos[i + 1] *= sy;
      pos[i + 2] *= sz;
    }
    this.computeNormals();
    this._bounds = null;
  }
  mapPositions(fn) {
    const pos = this.positions;
    for (let i = 0; i < pos.length; i += 3) {
      const [x, y, z] = fn(pos[i], pos[i + 1], pos[i + 2], i / 3);
      pos[i] = x;
      pos[i + 1] = y;
      pos[i + 2] = z;
    }
    this.computeNormals();
    this._bounds = null;
  }
  // ── Merge ──
  merge(other) {
    const vc = this.vertexCount;
    const newPos = new Float32Array(this.positions.length + other.positions.length);
    newPos.set(this.positions);
    newPos.set(other.positions, this.positions.length);
    const newNrm = new Float32Array(this.normals.length + other.normals.length);
    newNrm.set(this.normals);
    newNrm.set(other.normals, this.normals.length);
    const newIdx = new Uint32Array(this.indices.length + other.indices.length);
    newIdx.set(this.indices);
    for (let i = 0; i < other.indices.length; i++) {
      newIdx[this.indices.length + i] = other.indices[i] + vc;
    }
    return new _Mesh(newPos, newIdx, newNrm);
  }
  // ── Clone ──
  clone() {
    return new _Mesh(
      new Float32Array(this.positions),
      new Uint32Array(this.indices),
      new Float32Array(this.normals),
      this.uvs ? new Float32Array(this.uvs) : void 0,
      this.colors ? new Float32Array(this.colors) : void 0
    );
  }
  // ── Serialization ──
  toJSON() {
    return {
      positions: Array.from(this.positions),
      indices: Array.from(this.indices),
      normals: Array.from(this.normals),
      uvs: this.uvs ? Array.from(this.uvs) : void 0
    };
  }
  static fromJSON(json) {
    return new _Mesh(
      new Float32Array(json.positions),
      new Uint32Array(json.indices),
      json.normals ? new Float32Array(json.normals) : void 0,
      json.uvs ? new Float32Array(json.uvs) : void 0
    );
  }
  // ── Conversion: ConnectedMesh <-> Mesh ──
  static fromConnectedMesh(mesh) {
    const data = mesh.toIndexedTriangles();
    return new _Mesh(data.positions, data.indices, data.normals);
  }
  toConnectedMesh() {
    const positions = [];
    for (let i = 0; i < this.positions.length; i += 3) {
      positions.push(new Vec3(this.positions[i], this.positions[i + 1], this.positions[i + 2]));
    }
    const indices = Array.from(this.indices);
    return ConnectedMesh.fromIndexedTriangles(positions, indices);
  }
  static fromArrays(positions, indices, normals) {
    return new _Mesh(
      positions instanceof Float32Array ? positions : new Float32Array(positions),
      indices instanceof Uint32Array ? indices : new Uint32Array(indices),
      normals ? normals instanceof Float32Array ? normals : new Float32Array(normals) : void 0
    );
  }
};

// src/core/mesh/FlatMesh.ts
var FlatMeshGen = {
  grid(width, depth, divsX, divsZ, heightFn = () => 0) {
    const vx = divsX + 1, vz = divsZ + 1, vc = vx * vz;
    const pos = new Float32Array(vc * 3);
    const nrm = new Float32Array(vc * 3);
    const idx = new Uint32Array(divsX * divsZ * 6);
    let ii = 0;
    for (let iz = 0; iz < divsZ; iz++) {
      for (let ix = 0; ix < divsX; ix++) {
        const a = iz * vx + ix, b = a + 1, c = a + vx, d = c + 1;
        idx[ii++] = a;
        idx[ii++] = b;
        idx[ii++] = d;
        idx[ii++] = a;
        idx[ii++] = d;
        idx[ii++] = c;
      }
    }
    let vi = 0;
    for (let iz = 0; iz <= divsZ; iz++) {
      for (let ix = 0; ix <= divsX; ix++) {
        const x = (ix / divsX - 0.5) * width;
        const z = (iz / divsZ - 0.5) * depth;
        pos[vi] = x;
        pos[vi + 1] = heightFn(x, z);
        pos[vi + 2] = z;
        vi += 3;
      }
    }
    const fm = new Mesh(pos, idx, nrm);
    fm.update = function(hfn) {
      let vi2 = 0;
      for (let iz = 0; iz <= divsZ; iz++) {
        for (let ix = 0; ix <= divsX; ix++) {
          const x = (ix / divsX - 0.5) * width;
          const z = (iz / divsZ - 0.5) * depth;
          pos[vi2 + 1] = hfn(x, z);
          vi2 += 3;
        }
      }
      for (let iz = 0; iz <= divsZ; iz++) {
        for (let ix = 0; ix <= divsX; ix++) {
          const i3 = (iz * vx + ix) * 3;
          const il = ix > 0 ? i3 - 3 : i3;
          const ir = ix < divsX ? i3 + 3 : i3;
          const iu = iz > 0 ? i3 - vx * 3 : i3;
          const id = iz < divsZ ? i3 + vx * 3 : i3;
          const dx = pos[ir + 1] - pos[il + 1];
          const dz = pos[id + 1] - pos[iu + 1];
          const len = Math.sqrt(dx * dx + 1 + dz * dz);
          nrm[i3] = -dx / len;
          nrm[i3 + 1] = 1 / len;
          nrm[i3 + 2] = -dz / len;
        }
      }
    };
    fm.computeNormals();
    return fm;
  },
  sphere(radius = 1, segments = 24, rings = 16) {
    const vc = (rings + 1) * (segments + 1);
    const tc = rings * segments * 2;
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array(tc * 3);
    let vi = 0;
    for (let r = 0; r <= rings; r++) {
      const phi = r / rings * Math.PI;
      const sp = Math.sin(phi), cp = Math.cos(phi);
      for (let s = 0; s <= segments; s++) {
        const theta = s / segments * Math.PI * 2;
        pos[vi++] = radius * sp * Math.cos(theta);
        pos[vi++] = radius * cp;
        pos[vi++] = radius * sp * Math.sin(theta);
      }
    }
    let ii = 0;
    const w = segments + 1;
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = r * w + s, b = a + 1, c = a + w, d = c + 1;
        if (r > 0) {
          idx[ii++] = a;
          idx[ii++] = b;
          idx[ii++] = d;
        }
        if (r < rings - 1) {
          idx[ii++] = a;
          idx[ii++] = d;
          idx[ii++] = c;
        }
      }
    }
    return new Mesh(pos, idx.subarray(0, ii));
  },
  box(width = 1, height = 1, depth = 1) {
    const w = width / 2, h = height / 2, d = depth / 2;
    const pos = new Float32Array([
      -w,
      -h,
      -d,
      w,
      -h,
      -d,
      w,
      h,
      -d,
      -w,
      h,
      -d,
      -w,
      -h,
      d,
      w,
      -h,
      d,
      w,
      h,
      d,
      -w,
      h,
      d,
      -w,
      h,
      -d,
      w,
      h,
      -d,
      w,
      h,
      d,
      -w,
      h,
      d,
      -w,
      -h,
      -d,
      w,
      -h,
      -d,
      w,
      -h,
      d,
      -w,
      -h,
      d,
      w,
      -h,
      -d,
      w,
      h,
      -d,
      w,
      h,
      d,
      w,
      -h,
      d,
      -w,
      -h,
      -d,
      -w,
      h,
      -d,
      -w,
      h,
      d,
      -w,
      -h,
      d
    ]);
    const idx = new Uint32Array([
      0,
      1,
      2,
      0,
      2,
      3,
      4,
      6,
      5,
      4,
      7,
      6,
      8,
      9,
      10,
      8,
      10,
      11,
      12,
      14,
      13,
      12,
      15,
      14,
      16,
      17,
      18,
      16,
      18,
      19,
      20,
      22,
      21,
      20,
      23,
      22
    ]);
    return new Mesh(pos, idx);
  },
  torus(majorR = 1, minorR = 0.3, segments = 32, sides = 16) {
    const vc = (segments + 1) * (sides + 1);
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array(segments * sides * 6);
    let vi = 0;
    for (let s = 0; s <= segments; s++) {
      const th = s / segments * Math.PI * 2;
      const ct = Math.cos(th), st = Math.sin(th);
      for (let r = 0; r <= sides; r++) {
        const ph = r / sides * Math.PI * 2;
        pos[vi++] = (majorR + minorR * Math.cos(ph)) * ct;
        pos[vi++] = minorR * Math.sin(ph);
        pos[vi++] = (majorR + minorR * Math.cos(ph)) * st;
      }
    }
    let ii = 0;
    const w = sides + 1;
    for (let s = 0; s < segments; s++) {
      for (let r = 0; r < sides; r++) {
        const a = s * w + r, b = a + 1, c = a + w, d = c + 1;
        idx[ii++] = a;
        idx[ii++] = b;
        idx[ii++] = d;
        idx[ii++] = a;
        idx[ii++] = d;
        idx[ii++] = c;
      }
    }
    return new Mesh(pos, idx);
  },
  cylinder(radiusTop = 1, radiusBottom = 1, height = 2, segments = 24) {
    const h2 = height / 2;
    const sideVerts = (segments + 1) * 2;
    const capVerts = (segments + 1) * 2 + 2;
    const vc = sideVerts + capVerts;
    const sideTris = segments * 2;
    const capTris = segments * 2;
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array((sideTris + capTris) * 3);
    let vi = 0, ii = 0, vOff = 0;
    for (let s = 0; s <= segments; s++) {
      const a = s / segments * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      pos[vi++] = radiusBottom * c;
      pos[vi++] = -h2;
      pos[vi++] = radiusBottom * sn;
      pos[vi++] = radiusTop * c;
      pos[vi++] = h2;
      pos[vi++] = radiusTop * sn;
    }
    for (let s = 0; s < segments; s++) {
      const a = s * 2, b = a + 1, c = a + 2, d = a + 3;
      idx[ii++] = a;
      idx[ii++] = c;
      idx[ii++] = b;
      idx[ii++] = b;
      idx[ii++] = c;
      idx[ii++] = d;
    }
    vOff = (segments + 1) * 2;
    const bc = vOff;
    pos[vi++] = 0;
    pos[vi++] = -h2;
    pos[vi++] = 0;
    vOff++;
    for (let s = 0; s <= segments; s++) {
      const a = s / segments * Math.PI * 2;
      pos[vi++] = radiusBottom * Math.cos(a);
      pos[vi++] = -h2;
      pos[vi++] = radiusBottom * Math.sin(a);
    }
    for (let s = 0; s < segments; s++) {
      idx[ii++] = bc;
      idx[ii++] = vOff + s + 1;
      idx[ii++] = vOff + s;
    }
    vOff += segments + 1;
    const tc = vOff;
    pos[vi++] = 0;
    pos[vi++] = h2;
    pos[vi++] = 0;
    vOff++;
    for (let s = 0; s <= segments; s++) {
      const a = s / segments * Math.PI * 2;
      pos[vi++] = radiusTop * Math.cos(a);
      pos[vi++] = h2;
      pos[vi++] = radiusTop * Math.sin(a);
    }
    for (let s = 0; s < segments; s++) {
      idx[ii++] = tc;
      idx[ii++] = vOff + s;
      idx[ii++] = vOff + s + 1;
    }
    return new Mesh(pos.subarray(0, vi), idx.subarray(0, ii));
  },
  revolve(profile, segments = 32) {
    const n = profile.length;
    const vc = (segments + 1) * n;
    const tc = segments * (n - 1) * 2;
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array(tc * 3);
    let vi = 0;
    for (let s = 0; s <= segments; s++) {
      const a = s / segments * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let i = 0; i < n; i++) {
        const p = profile[i];
        pos[vi++] = p.x * ca;
        pos[vi++] = p.y;
        pos[vi++] = p.x * sa;
      }
    }
    let ii = 0;
    for (let s = 0; s < segments; s++) {
      for (let i = 0; i < n - 1; i++) {
        const a = s * n + i, b = a + 1, c = a + n, d = c + 1;
        idx[ii++] = a;
        idx[ii++] = b;
        idx[ii++] = d;
        idx[ii++] = a;
        idx[ii++] = d;
        idx[ii++] = c;
      }
    }
    return new Mesh(pos, idx);
  },
  subdivide(fm) {
    const pos = fm.positions, idx = fm.indices;
    const vc = fm.vertexCount, tc = fm.triangleCount;
    const edgeMidpoints = /* @__PURE__ */ new Map();
    let newVc = vc;
    for (let t = 0; t < idx.length; t += 3) {
      for (let j = 0; j < 3; j++) {
        const a = idx[t + j], b = idx[t + (j + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (!edgeMidpoints.has(key)) {
          edgeMidpoints.set(key, newVc++);
        }
      }
    }
    const newPos = new Float32Array(newVc * 3);
    const newIdx = new Uint32Array(tc * 4 * 3);
    newPos.set(pos);
    for (const [key, mid] of edgeMidpoints) {
      const [as, bs] = key.split(":");
      const a = parseInt(as) * 3, b = parseInt(bs) * 3;
      const o = mid * 3;
      newPos[o] = (pos[a] + pos[b]) * 0.5;
      newPos[o + 1] = (pos[a + 1] + pos[b + 1]) * 0.5;
      newPos[o + 2] = (pos[a + 2] + pos[b + 2]) * 0.5;
    }
    let ii = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const v0 = idx[t], v1 = idx[t + 1], v2 = idx[t + 2];
      const k01 = v0 < v1 ? `${v0}:${v1}` : `${v1}:${v0}`;
      const k12 = v1 < v2 ? `${v1}:${v2}` : `${v2}:${v1}`;
      const k20 = v2 < v0 ? `${v2}:${v0}` : `${v0}:${v2}`;
      const m01 = edgeMidpoints.get(k01);
      const m12 = edgeMidpoints.get(k12);
      const m20 = edgeMidpoints.get(k20);
      newIdx[ii++] = v0;
      newIdx[ii++] = m01;
      newIdx[ii++] = m20;
      newIdx[ii++] = m01;
      newIdx[ii++] = v1;
      newIdx[ii++] = m12;
      newIdx[ii++] = m20;
      newIdx[ii++] = m12;
      newIdx[ii++] = v2;
      newIdx[ii++] = m01;
      newIdx[ii++] = m12;
      newIdx[ii++] = m20;
    }
    return new Mesh(newPos, newIdx);
  }
};

// src/core/geometry/mesh/MeshTransform.ts
var MeshTransform = {
  // ================================================================
  // AFFINE TRANSFORMS
  // ================================================================
  /** Applies an arbitrary 4x4 matrix to all vertex positions. */
  transform(mesh, matrix) {
    for (const node of mesh.nodes()) {
      node.position = matrix.transformPoint(node.position);
    }
    mesh.computeVertexNormals();
  },
  /** Translates all vertices by an offset vector. */
  translate(mesh, offset) {
    for (const node of mesh.nodes()) {
      node.position = node.position.add(offset);
    }
  },
  /** Uniform scale around origin. */
  scale(mesh, factor) {
    for (const node of mesh.nodes()) {
      node.position = node.position.mul(factor);
    }
  },
  /** Non-uniform scale around origin. */
  scaleXYZ(mesh, sx, sy, sz) {
    for (const node of mesh.nodes()) {
      const p = node.position;
      node.position = new Vec3(p.x * sx, p.y * sy, p.z * sz);
    }
    mesh.computeVertexNormals();
  },
  /** Non-uniform scale around a center point. */
  scaleAbout(mesh, sx, sy, sz, center) {
    for (const node of mesh.nodes()) {
      const p = node.position.sub(center);
      node.position = new Vec3(p.x * sx, p.y * sy, p.z * sz).add(center);
    }
    mesh.computeVertexNormals();
  },
  /** Rotates the mesh around an axis through the origin. */
  rotate(mesh, axis, angleRadians) {
    const a = axis.normalize();
    const c = Math.cos(angleRadians), s = Math.sin(angleRadians), t = 1 - c;
    const { x, y, z } = a;
    const m = new Float64Array(16);
    m[0] = t * x * x + c;
    m[4] = t * x * y - s * z;
    m[8] = t * x * z + s * y;
    m[12] = 0;
    m[1] = t * x * y + s * z;
    m[5] = t * y * y + c;
    m[9] = t * y * z - s * x;
    m[13] = 0;
    m[2] = t * x * z - s * y;
    m[6] = t * y * z + s * x;
    m[10] = t * z * z + c;
    m[14] = 0;
    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;
    const mat = new Mat4(m);
    for (const node of mesh.nodes()) {
      node.position = mat.transformPoint(node.position);
    }
    mesh.computeVertexNormals();
  },
  /** Rotates the mesh around an axis through a center point. */
  rotateAbout(mesh, axis, angleRadians, center) {
    const a = axis.normalize();
    const c = Math.cos(angleRadians), s = Math.sin(angleRadians), t = 1 - c;
    const { x, y, z } = a;
    const m = new Float64Array(16);
    m[0] = t * x * x + c;
    m[4] = t * x * y - s * z;
    m[8] = t * x * z + s * y;
    m[12] = 0;
    m[1] = t * x * y + s * z;
    m[5] = t * y * y + c;
    m[9] = t * y * z - s * x;
    m[13] = 0;
    m[2] = t * x * z - s * y;
    m[6] = t * y * z + s * x;
    m[10] = t * z * z + c;
    m[14] = 0;
    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;
    const mat = new Mat4(m);
    for (const node of mesh.nodes()) {
      node.position = mat.transformPoint(node.position.sub(center)).add(center);
    }
    mesh.computeVertexNormals();
  },
  // ================================================================
  // AXIS OPERATIONS
  // ================================================================
  /** Swaps two coordinate axes (e.g. Y↔Z for Z-up to Y-up conversion). */
  swapAxes(mesh, a, b) {
    if (a === b) return;
    for (const node of mesh.nodes()) {
      const p = node.position;
      const va = getCoord(p, a), vb = getCoord(p, b);
      node.position = setCoord2(setCoord2(p, a, vb), b, va);
    }
    MeshTransform.flipFaces(mesh);
    mesh.computeVertexNormals();
  },
  /** Mirrors the mesh across a plane through the origin. */
  mirror(mesh, axis) {
    for (const node of mesh.nodes()) {
      const p = node.position;
      switch (axis) {
        case "x":
          node.position = new Vec3(-p.x, p.y, p.z);
          break;
        case "y":
          node.position = new Vec3(p.x, -p.y, p.z);
          break;
        case "z":
          node.position = new Vec3(p.x, p.y, -p.z);
          break;
      }
    }
    MeshTransform.flipFaces(mesh);
    mesh.computeVertexNormals();
  },
  // ================================================================
  // FACE ORIENTATION
  // ================================================================
  /** Reverses the winding order of all faces (flips normals). */
  flipFaces(mesh) {
    for (const face of mesh.faces()) {
      face.nodes.reverse();
    }
    mesh.computeVertexNormals();
  },
  /**
   * Makes all face normals consistent using BFS flood-fill.
   * Picks an initial face and propagates its orientation to neighbors.
   */
  reorientFaces(mesh) {
    const allFaces = mesh.facesArray();
    const faceCount = allFaces.length;
    if (faceCount === 0) return;
    const checked = /* @__PURE__ */ new Set();
    const queue = [];
    for (const startFace of allFaces) {
      if (checked.has(startFace.id)) continue;
      checked.add(startFace.id);
      queue.push(startFace.id);
      while (queue.length > 0) {
        const fId = queue.shift();
        const f2 = mesh.face(fId);
        const neighborIds = /* @__PURE__ */ new Set();
        for (const eId of f2.edges) {
          const e = mesh.edge(eId);
          if (!e) continue;
          for (const nfId of e.faces) {
            if (nfId !== fId) neighborIds.add(nfId);
          }
        }
        for (const nbId of neighborIds) {
          if (checked.has(nbId)) continue;
          checked.add(nbId);
          if (!hasSameOrientation(mesh, fId, nbId)) {
            const nb = mesh.face(nbId);
            nb.nodes.reverse();
          }
          queue.push(nbId);
        }
      }
    }
    mesh.computeVertexNormals();
  },
  // ================================================================
  // CENTER
  // ================================================================
  /** Moves the mesh so its bounding box center is at the origin. */
  centerAtOrigin(mesh) {
    const allNodes = mesh.nodesArray();
    if (allNodes.length === 0) return;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const n of allNodes) {
      const p = n.position;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const center = new Vec3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    MeshTransform.translate(mesh, center.neg());
  },
  /** Moves the mesh so its centroid (average of vertices) is at the origin. */
  centerAtCentroid(mesh) {
    const allNodes = mesh.nodesArray();
    if (allNodes.length === 0) return;
    let sx = 0, sy = 0, sz = 0;
    for (const n of allNodes) {
      sx += n.position.x;
      sy += n.position.y;
      sz += n.position.z;
    }
    const centroid = new Vec3(sx / allNodes.length, sy / allNodes.length, sz / allNodes.length);
    MeshTransform.translate(mesh, centroid.neg());
  }
};
function getCoord(v, axis) {
  switch (axis) {
    case "x":
      return v.x;
    case "y":
      return v.y;
    case "z":
      return v.z;
  }
}
function setCoord2(v, axis, val) {
  switch (axis) {
    case "x":
      return new Vec3(val, v.y, v.z);
    case "y":
      return new Vec3(v.x, val, v.z);
    case "z":
      return new Vec3(v.x, v.y, val);
  }
}
function hasSameOrientation(mesh, fId1, fId2) {
  const f1 = mesh.face(fId1);
  const f2 = mesh.face(fId2);
  const v1 = f1.nodes;
  const v2 = f2.nodes;
  for (let i = 0; i < v1.length; i++) {
    const a = v1[i];
    const b = v1[(i + 1) % v1.length];
    for (let j = 0; j < v2.length; j++) {
      if (v2[j] === a && v2[(j + 1) % v2.length] === b) return false;
    }
  }
  return true;
}

// src/core/geometry/mesh/MeshSubdivide.ts
var MeshSubdivide = {
  /** Splits all edges longer than maxLength in a single pass. */
  splitLongEdges(mesh, maxLength) {
    const maxLenSq = maxLength * maxLength;
    const toSplit = [];
    for (const e of mesh.edges()) {
      const a = mesh.node(e.nodes[0]).position;
      const b = mesh.node(e.nodes[1]).position;
      if (a.distSqTo(b) > maxLenSq) toSplit.push(e.id);
    }
    if (toSplit.length === 0) return;
    for (const eid of toSplit) {
      const e = mesh.edge(eid);
      if (!e) continue;
      mesh.splitEdge(eid);
    }
    mesh.computeVertexNormals();
  },
  /**
   * Iteratively subdivides the mesh until all edges are shorter than targetLength.
   */
  refineByEdgeLength(mesh, targetLength, maxIterations = 5) {
    for (let iter = 0; iter < maxIterations; iter++) {
      const targetSq = targetLength * targetLength;
      const toSplit = [];
      for (const e of mesh.edges()) {
        const a = mesh.node(e.nodes[0]).position;
        const b = mesh.node(e.nodes[1]).position;
        if (a.distSqTo(b) > targetSq) toSplit.push(e.id);
      }
      if (toSplit.length === 0) break;
      for (const eid of toSplit) {
        const e = mesh.edge(eid);
        if (!e) continue;
        mesh.splitEdge(eid);
      }
    }
    mesh.computeVertexNormals();
  },
  /**
   * Doo-Sabin subdivision: each face shrinks toward its centroid, creating
   * new F-faces, E-faces (edge quads), and V-faces (vertex n-gons).
   */
  dooSabin(mesh) {
    const allFaces = mesh.facesArray();
    const allEdges = mesh.edgesArray();
    const allNodes = mesh.nodesArray();
    const nodeIdToIdx = /* @__PURE__ */ new Map();
    allNodes.forEach((n, i) => nodeIdToIdx.set(n.id, i));
    const newPositions = [];
    const newVertIdx = [];
    const faceIdToLocalIdx = /* @__PURE__ */ new Map();
    for (let fi = 0; fi < allFaces.length; fi++) {
      const f2 = allFaces[fi];
      faceIdToLocalIdx.set(f2.id, fi);
      const n = f2.nodes.length;
      const verts = f2.nodes;
      let center = Vec3.zero();
      for (const nid of verts) center = center.add(mesh.node(nid).position);
      center = center.div(n);
      const indices = [];
      for (let i = 0; i < n; i++) {
        const iPrev = (i - 1 + n) % n;
        const iNext = (i + 1) % n;
        const v = mesh.node(verts[i]).position;
        const midBefore = mesh.node(verts[iPrev]).position.add(v).mul(0.5);
        const midAfter = v.add(mesh.node(verts[iNext]).position).mul(0.5);
        newPositions.push(center.add(v).add(midBefore).add(midAfter).mul(0.25));
        indices.push(newPositions.length - 1);
      }
      newVertIdx.push(indices);
    }
    const vertPosInFace = /* @__PURE__ */ new Map();
    for (let fi = 0; fi < allFaces.length; fi++) {
      const f2 = allFaces[fi];
      for (let i = 0; i < f2.nodes.length; i++) {
        vertPosInFace.set(`${f2.nodes[i]}_${f2.id}`, i);
      }
    }
    const newFaces = [];
    for (let fi = 0; fi < allFaces.length; fi++) {
      newFaces.push([...newVertIdx[fi]]);
    }
    for (const e of allEdges) {
      if (e.faces.length < 2) continue;
      const faceA = e.faces[0];
      const faceB = e.faces[1];
      const fiA = faceIdToLocalIdx.get(faceA);
      const fiB = faceIdToLocalIdx.get(faceB);
      const posFromA = vertPosInFace.get(`${e.nodes[0]}_${faceA}`);
      const posToA = vertPosInFace.get(`${e.nodes[1]}_${faceA}`);
      const posFromB = vertPosInFace.get(`${e.nodes[0]}_${faceB}`);
      const posToB = vertPosInFace.get(`${e.nodes[1]}_${faceB}`);
      const fA = mesh.face(faceA);
      const vertsA = fA.nodes;
      const forwardInA = posToA === (posFromA + 1) % vertsA.length;
      let nA0, nA1, nB0, nB1;
      if (forwardInA) {
        nA0 = newVertIdx[fiA][posFromA];
        nA1 = newVertIdx[fiA][posToA];
        nB0 = newVertIdx[fiB][posToB];
        nB1 = newVertIdx[fiB][posFromB];
      } else {
        nA0 = newVertIdx[fiA][posToA];
        nA1 = newVertIdx[fiA][posFromA];
        nB0 = newVertIdx[fiB][posFromB];
        nB1 = newVertIdx[fiB][posToB];
      }
      newFaces.push([nA0, nA1, nB0, nB1]);
    }
    for (const node of allNodes) {
      if (mesh.isBoundaryNode(node.id)) continue;
      const faceRing = dooSabinFaceRing(mesh, node, allFaces, vertPosInFace, faceIdToLocalIdx);
      if (!faceRing || faceRing.length < 3) continue;
      const vFaceVerts = [];
      for (const fId of faceRing) {
        const fi = faceIdToLocalIdx.get(fId);
        const posInFace = vertPosInFace.get(`${node.id}_${fId}`);
        vFaceVerts.push(newVertIdx[fi][posInFace]);
      }
      vFaceVerts.reverse();
      if (vFaceVerts.length <= 4) {
        newFaces.push(vFaceVerts);
      } else {
        for (let i = 1; i < vFaceVerts.length - 1; i++) {
          newFaces.push([vFaceVerts[0], vFaceVerts[i], vFaceVerts[i + 1]]);
        }
      }
    }
    mesh.clear();
    const nodeIds = newPositions.map((p) => mesh.addNode(p));
    for (const face of newFaces) {
      const mapped = face.map((i) => nodeIds[i]);
      mesh.addFace(mapped);
    }
    MeshTransform.reorientFaces(mesh);
  }
};
function dooSabinFaceRing(mesh, node, _allFaces, _vertPosInFace, _faceIdToLocalIdx) {
  const facesAround = node.faces;
  if (facesAround.length === 0) return null;
  const ring = [];
  const visited = /* @__PURE__ */ new Set();
  const startFace = facesAround[0];
  ring.push(startFace);
  visited.add(startFace);
  const startFaceObj = mesh.face(startFace);
  const posInFace = startFaceObj.nodes.indexOf(node.id);
  if (posInFace < 0) return null;
  let crossVert = startFaceObj.nodes[(posInFace + 1) % startFaceObj.nodes.length];
  let sharedEdge = findSharedEdge(mesh, node.id, crossVert);
  if (!sharedEdge) return null;
  let currentFace = sharedEdge.faces.find((f2) => f2 !== startFace);
  if (currentFace === void 0) return null;
  while (!visited.has(currentFace)) {
    ring.push(currentFace);
    visited.add(currentFace);
    const cf = mesh.face(currentFace);
    const idx = cf.nodes.indexOf(node.id);
    if (idx < 0) break;
    const n = cf.nodes.length;
    const prev = cf.nodes[(idx - 1 + n) % n];
    const next = cf.nodes[(idx + 1) % n];
    const otherVert = next === crossVert ? prev : next;
    sharedEdge = findSharedEdge(mesh, node.id, otherVert);
    if (!sharedEdge) break;
    const nextFace = sharedEdge.faces.find((f2) => f2 !== currentFace);
    if (nextFace === void 0) break;
    crossVert = otherVert;
    currentFace = nextFace;
  }
  return ring.length === facesAround.length ? ring : null;
}
function findSharedEdge(mesh, nodeA, nodeB) {
  const nA = mesh.node(nodeA);
  if (!nA) return null;
  for (const eId of nA.edges) {
    const e = mesh.edge(eId);
    if (!e) continue;
    if (e.nodes[0] === nodeA && e.nodes[1] === nodeB || e.nodes[0] === nodeB && e.nodes[1] === nodeA) {
      return e;
    }
  }
  return null;
}

// src/core/geometry/mesh/MeshCleanup.ts
var MeshCleanup = {
  /** Merges vertices that have the exact same position (binary equality). */
  mergeIdenticalVertices(mesh) {
    const allNodes = mesh.nodesArray();
    const allFaces = mesh.facesArray();
    const uniquePos = /* @__PURE__ */ new Map();
    const positions = [];
    const oldToNew = /* @__PURE__ */ new Map();
    for (const node of allNodes) {
      const key = `${node.position.x},${node.position.y},${node.position.z}`;
      if (uniquePos.has(key)) {
        oldToNew.set(node.id, uniquePos.get(key));
      } else {
        const newIdx = positions.length;
        uniquePos.set(key, newIdx);
        positions.push(node.position);
        oldToNew.set(node.id, newIdx);
      }
    }
    const newFaces = [];
    for (const f2 of allFaces) {
      const mapped = f2.nodes.map((n) => oldToNew.get(n));
      const distinct = new Set(mapped);
      if (distinct.size < 3) continue;
      if (distinct.size < mapped.length) {
        const deduped = [];
        for (const v of mapped) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== v) deduped.push(v);
        }
        if (deduped.length >= 3) newFaces.push(deduped);
      } else {
        newFaces.push(mapped);
      }
    }
    applyRemap(mesh, positions, newFaces);
  },
  /** Merges vertices that are within a certain distance of each other. */
  weldVertices(mesh, threshold) {
    if (threshold <= 1e-6) {
      MeshCleanup.mergeIdenticalVertices(mesh);
      return;
    }
    const allNodes = mesh.nodesArray();
    const allFaces = mesh.facesArray();
    const count = allNodes.length;
    const sorted = allNodes.slice().sort((a, b) => a.position.x - b.position.x);
    const oldToNew = /* @__PURE__ */ new Map();
    const positions = [];
    const sqThreshold = threshold * threshold;
    for (let i = 0; i < count; i++) {
      const nodeA = sorted[i];
      if (oldToNew.has(nodeA.id)) continue;
      const newIdx = positions.length;
      oldToNew.set(nodeA.id, newIdx);
      positions.push(nodeA.position);
      for (let j = i + 1; j < count; j++) {
        const nodeB = sorted[j];
        if (oldToNew.has(nodeB.id)) continue;
        if (nodeB.position.x - nodeA.position.x > threshold) break;
        if (nodeA.position.distSqTo(nodeB.position) <= sqThreshold) {
          oldToNew.set(nodeB.id, newIdx);
        }
      }
    }
    const newFaces = [];
    for (const f2 of allFaces) {
      const mapped = f2.nodes.map((n) => oldToNew.get(n));
      const distinct = new Set(mapped);
      if (distinct.size < 3) continue;
      if (distinct.size < mapped.length) {
        const deduped = [];
        for (const v of mapped) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== v) deduped.push(v);
        }
        if (deduped.length >= 3) newFaces.push(deduped);
      } else {
        newFaces.push(mapped);
      }
    }
    applyRemap(mesh, positions, newFaces);
  }
};
function applyRemap(mesh, positions, faces) {
  mesh.clear();
  const ids = positions.map((p) => mesh.addNode(p));
  for (const f2 of faces) {
    mesh.addFace(f2.map((i) => ids[i]));
  }
  mesh.computeVertexNormals();
}

// src/core/algo/algorithms.ts
var Algo = { ...Polygon2D, ...MeshAnalysis };

// src/core/algo/Curvature.ts
function tangentBasis(n) {
  if (n.lenSq() < 1e-12) return { u: Vec3.unitX(), v: Vec3.unitZ() };
  const axis = Math.abs(n.z) < 0.9 ? Vec3.unitZ() : Vec3.unitX();
  const u = axis.sub(n.mul(axis.dot(n))).normalize();
  const v = n.cross(u).normalize();
  return { u, v };
}
function triangleArea(a, b, c) {
  return b.sub(a).cross(c.sub(a)).len() * 0.5;
}
var Curvature = {
  /**
   * Estimate per-vertex principal curvatures and directions.
   *
   * `mesh.computeVertexNormals()` is invoked internally to ensure normals are
   * available and up-to-date.
   *
   * Returns a Map keyed by node id. Boundary and degenerate vertices receive
   * zero curvature and an arbitrary (but unit) direction pair; check
   * `result.isBoundary` to filter them out.
   */
  taubin(mesh) {
    mesh.computeVertexNormals();
    const result = /* @__PURE__ */ new Map();
    for (const node of mesh.nodes()) {
      const n = node.normal ?? Vec3.zero();
      const p = node.position;
      const isBoundary = mesh.isBoundaryNode(node.id) || node.faces.length === 0 || n.lenSq() < 1e-12;
      const { u, v } = tangentBasis(n);
      let mUU = 0, mVV = 0, mUV = 0;
      let totalW = 0;
      for (const eid of node.edges) {
        const edge = mesh.edge(eid);
        const otherId = edge.nodes[0] === node.id ? edge.nodes[1] : edge.nodes[0];
        const other = mesh.node(otherId);
        if (!other) continue;
        const e = other.position.sub(p);
        const eLenSq = e.lenSq();
        if (eLenSq < 1e-20) continue;
        let w = 0;
        for (const fid of edge.faces) {
          const face = mesh.face(fid);
          if (!face || face.nodes.length < 3) continue;
          const fn = face.nodes;
          const p0 = mesh.node(fn[0]).position;
          for (let i = 1; i < fn.length - 1; i++) {
            w += triangleArea(p0, mesh.node(fn[i]).position, mesh.node(fn[i + 1]).position);
          }
        }
        if (w < 1e-20) continue;
        const kappa = -2 * n.dot(e) / eLenSq;
        const tProj = e.sub(n.mul(n.dot(e)));
        const tLen = tProj.len();
        if (tLen < 1e-12) continue;
        const tU = tProj.dot(u) / tLen;
        const tV = tProj.dot(v) / tLen;
        mUU += w * kappa * tU * tU;
        mVV += w * kappa * tV * tV;
        mUV += w * kappa * tU * tV;
        totalW += w;
      }
      if (totalW < 1e-20) {
        result.set(node.id, {
          kMax: 0,
          kMin: 0,
          dirMax: u,
          dirMin: v,
          meanCurvature: 0,
          gaussCurvature: 0,
          isBoundary
        });
        continue;
      }
      mUU /= totalW;
      mVV /= totalW;
      mUV /= totalW;
      const trace = mUU + mVV;
      const halfDiff = (mUU - mVV) * 0.5;
      const gap = Math.sqrt(halfDiff * halfDiff + mUV * mUV);
      const m1 = trace * 0.5 + gap;
      const m2 = trace * 0.5 - gap;
      let e1U, e1V;
      if (Math.abs(mUV) > 1e-12) {
        e1U = m1 - mVV;
        e1V = mUV;
      } else {
        if (mUU >= mVV) {
          e1U = 1;
          e1V = 0;
        } else {
          e1U = 0;
          e1V = 1;
        }
      }
      const inv = 1 / Math.sqrt(e1U * e1U + e1V * e1V);
      e1U *= inv;
      e1V *= inv;
      const e2U = -e1V, e2V = e1U;
      const kMax = 3 * m1 - m2;
      const kMin = 3 * m2 - m1;
      const dirMax = u.mul(e1U).add(v.mul(e1V)).normalize();
      const dirMin = u.mul(e2U).add(v.mul(e2V)).normalize();
      result.set(node.id, {
        kMax,
        kMin,
        dirMax,
        dirMin,
        meanCurvature: (kMax + kMin) * 0.5,
        gaussCurvature: kMax * kMin,
        isBoundary
      });
    }
    return result;
  },
  /**
   * Build a per-face direction field by averaging the vertex principal
   * directions around each face. Use `which: "max" | "min"` to pick which
   * eigenvector to average. The result is scaled by the (averaged) curvature
   * magnitude so that flat / umbilic faces produce near-zero vectors and can
   * be filtered out by the streamline tracer.
   *
   * Run `combDirections` first — otherwise face-averaged vectors will cancel
   * each other out wherever two adjacent vertices have opposite sign.
   */
  facePrincipalField(mesh, curvatures, which) {
    const field = /* @__PURE__ */ new Map();
    for (const face of mesh.faces()) {
      let sx = 0, sy = 0, sz = 0;
      let magSum = 0;
      let count = 0;
      let refDir = null;
      for (const nid of face.nodes) {
        const c = curvatures.get(nid);
        if (!c) continue;
        let d = which === "max" ? c.dirMax : c.dirMin;
        if (refDir === null) refDir = d;
        else if (d.dot(refDir) < 0) d = d.neg();
        const mag = Math.abs(which === "max" ? c.kMax : c.kMin);
        sx += d.x;
        sy += d.y;
        sz += d.z;
        magSum += mag;
        count++;
      }
      if (count === 0) {
        field.set(face.id, Vec3.zero());
        continue;
      }
      const inv = 1 / count;
      const avg = new Vec3(sx * inv, sy * inv, sz * inv);
      const len = avg.len();
      if (len < 1e-9) {
        field.set(face.id, Vec3.zero());
        continue;
      }
      const fn = face.normal ?? avg;
      let planar = avg.sub(fn.mul(avg.dot(fn) / Math.max(fn.lenSq(), 1e-12)));
      const pLen = planar.len();
      if (pLen < 1e-9) {
        field.set(face.id, Vec3.zero());
        continue;
      }
      planar = planar.div(pLen).mul(magSum * inv);
      field.set(face.id, planar);
    }
    return field;
  },
  /**
   * Make the principal direction field sign-consistent across the mesh by greedy
   * BFS. For each visited vertex, flip both `dirMax` and `dirMin` if their dot
   * with the corresponding direction of an already-visited neighbor is negative.
   *
   * Not globally optimal — seams will appear near umbilic / singular points.
   * Mutates `curvatures` in place.
   */
  combDirections(mesh, curvatures) {
    const visited = /* @__PURE__ */ new Set();
    const queue = [];
    for (const node of mesh.nodes()) {
      if (visited.has(node.id)) continue;
      const c0 = curvatures.get(node.id);
      if (!c0) continue;
      visited.add(node.id);
      queue.push(node.id);
      while (queue.length > 0) {
        const id = queue.shift();
        const cur = curvatures.get(id);
        if (!cur) continue;
        for (const nid of mesh.nodeNeighbors(id)) {
          if (visited.has(nid)) continue;
          const nc = curvatures.get(nid);
          if (!nc) continue;
          visited.add(nid);
          if (nc.dirMax.dot(cur.dirMax) < 0) {
            nc.dirMax = nc.dirMax.neg();
          }
          if (nc.dirMin.dot(cur.dirMin) < 0) {
            nc.dirMin = nc.dirMin.neg();
          }
          queue.push(nid);
        }
      }
    }
  }
};

// src/core/algo/StreamlineTracer.ts
var StreamlineTracer = {
  /**
   * Laplacian smoothing of a single polyline. Each interior point is moved
   * toward the midpoint of its two neighbors. The endpoints are fixed so the
   * curve doesn't shrink at the silhouette / boundary.
   *
   * Pass `iterations > 1` for stronger smoothing; `weight ∈ [0,1]` controls
   * per-iteration step. Point count is unchanged (good for plotters — output
   * length stays predictable).
   */
  smoothPolyline(points, iterations = 1, weight = 0.5) {
    if (points.length < 3 || iterations < 1) return points;
    let cur = points;
    for (let it = 0; it < iterations; it++) {
      const next = new Array(cur.length);
      next[0] = cur[0];
      for (let i = 1; i < cur.length - 1; i++) {
        const mid = cur[i - 1].add(cur[i + 1]).mul(0.5);
        next[i] = cur[i].lerp(mid, weight);
      }
      next[cur.length - 1] = cur[cur.length - 1];
      cur = next;
    }
    return cur;
  },
  /**
   * Trace streamlines across a triangle/quad mesh given a per-face direction field.
   *
   * @param mesh           connected mesh
   * @param field          `Map<faceId, Vec3>` — direction (and magnitude) per face
   * @param options        tracing parameters
   * @returns              array of polylines (each polyline is Vec3[])
   */
  trace(mesh, field, options = {}) {
    const {
      maxSteps = 200,
      stride = 1,
      minMagSq = 1e-12,
      stepFactor = 0.25,
      liftFactor = 0.02
    } = options;
    const avgEdge = computeAverageEdgeLength(mesh);
    const dt = avgEdge * stepFactor;
    const lift = avgEdge * liftFactor;
    const lines = [];
    const cache = buildFaceCache(mesh);
    const faces = mesh.facesArray();
    for (let i = 0; i < faces.length; i += stride) {
      const seedFace = faces[i];
      const seedDir = field.get(seedFace.id);
      if (!seedDir || seedDir.lenSq() < minMagSq) continue;
      const fwd = traceEuler(mesh, cache, seedFace.id, seedDir, field, maxSteps, dt, lift);
      const bwd = traceEuler(mesh, cache, seedFace.id, seedDir.neg(), field, maxSteps, dt, lift);
      if (bwd.length > 0) {
        bwd.reverse();
        if (fwd.length > 1) bwd.push(...fwd.slice(1));
        if (bwd.length > 2) lines.push(bwd);
      } else if (fwd.length > 1) {
        lines.push(fwd);
      }
    }
    return lines;
  }
};
function computeAverageEdgeLength(mesh) {
  const edges = mesh.edgesArray();
  if (edges.length === 0) return 0.1;
  let total = 0;
  let count = 0;
  for (let i = 0; i < edges.length; i += 5) {
    const e = edges[i];
    const a = mesh.node(e.nodes[0]).position;
    const b = mesh.node(e.nodes[1]).position;
    total += a.distTo(b);
    count++;
  }
  return count > 0 ? total / count : 0.1;
}
function buildFaceCache(mesh) {
  const normals = /* @__PURE__ */ new Map();
  const centers = /* @__PURE__ */ new Map();
  for (const f2 of mesh.faces()) {
    const a = mesh.node(f2.nodes[0]).position;
    const b = mesh.node(f2.nodes[1]).position;
    const c = mesh.node(f2.nodes[2]).position;
    normals.set(f2.id, f2.normal ?? b.sub(a).cross(c.sub(a)).normalize());
    let sx = 0, sy = 0, sz = 0;
    for (const nid of f2.nodes) {
      const p = mesh.node(nid).position;
      sx += p.x;
      sy += p.y;
      sz += p.z;
    }
    const inv = 1 / f2.nodes.length;
    centers.set(f2.id, new Vec3(sx * inv, sy * inv, sz * inv));
  }
  return { normals, centers };
}
function isPointInFace(mesh, faceId, p) {
  const f2 = mesh.face(faceId);
  const n = f2.nodes;
  const p0 = mesh.node(n[0]).position;
  for (let i = 1; i < n.length - 1; i++) {
    const p1 = mesh.node(n[i]).position;
    const p2 = mesh.node(n[i + 1]).position;
    if (pointInTriangle(p, p0, p1, p2)) return true;
  }
  return false;
}
function pointInTriangle(p, a, b, c) {
  const normal = b.sub(a).cross(c.sub(a));
  const wA = b.sub(p).cross(c.sub(p)).dot(normal);
  const wB = c.sub(p).cross(a.sub(p)).dot(normal);
  const wC = a.sub(p).cross(b.sub(p)).dot(normal);
  return wA >= 0 && wB >= 0 && wC >= 0;
}
function findExitEdge(mesh, faceId, pos, dir, faceNormalFor) {
  const f2 = mesh.face(faceId);
  const n = faceNormalFor(faceId);
  let closest = Infinity;
  let bestEdge = -1;
  let bestPoint = Vec3.zero();
  for (const eid of f2.edges) {
    const edge = mesh.edge(eid);
    const A = mesh.node(edge.nodes[0]).position;
    const B = mesh.node(edge.nodes[1]).position;
    const edgeDir = B.sub(A);
    const cross = edgeDir.cross(n);
    const denom = dir.dot(cross);
    if (Math.abs(denom) < 1e-6) continue;
    const t = A.sub(pos).dot(cross) / denom;
    if (t > -1e-4 && t < closest) {
      const hit = pos.add(dir.mul(t));
      const lenSq = edgeDir.lenSq();
      const u = lenSq > 0 ? hit.sub(A).dot(edgeDir) / lenSq : 0;
      if (u >= -0.01 && u <= 1.01) {
        closest = t;
        bestEdge = eid;
        bestPoint = hit;
      }
    }
  }
  return bestEdge >= 0 ? { edgeId: bestEdge, point: bestPoint } : null;
}
function closestEdgeFallback(mesh, faceId, proposedNext) {
  const f2 = mesh.face(faceId);
  let minDist = Infinity;
  let bestEdge = -1;
  let bestPoint = Vec3.zero();
  for (const eid of f2.edges) {
    const edge = mesh.edge(eid);
    const A = mesh.node(edge.nodes[0]).position;
    const B = mesh.node(edge.nodes[1]).position;
    const close = closestPointOnSegment(proposedNext, A, B);
    const d = proposedNext.distSqTo(close);
    if (d < minDist) {
      minDist = d;
      bestEdge = eid;
      bestPoint = close;
    }
  }
  return bestEdge >= 0 ? { edgeId: bestEdge, point: bestPoint } : null;
}
function neighborFace(mesh, edgeId, currentFaceId) {
  const e = mesh.edge(edgeId);
  if (e.faces.length < 2) return -1;
  return e.faces[0] === currentFaceId ? e.faces[1] : e.faces[0];
}
function traceEuler(mesh, cache, startFaceId, startDir, field, maxSteps, dt, lift) {
  const normalFor = (id) => cache.normals.get(id) ?? Vec3.unitY();
  const centerFor = (id) => cache.centers.get(id) ?? Vec3.zero();
  const points = [];
  let currFace = startFaceId;
  let currPos = centerFor(currFace);
  let currDir = startDir;
  let normal = normalFor(currFace);
  points.push(currPos.add(normal.mul(lift)));
  for (let step = 0; step < maxSteps; step++) {
    let target = field.get(currFace);
    if (!target || target.lenSq() < 1e-12) break;
    if (target.dot(currDir) < 0) target = target.neg();
    let blended = currDir.lerp(target, 0.5);
    const blendedLen = blended.len();
    if (blendedLen < 1e-9) break;
    currDir = blended.div(blendedLen);
    normal = normalFor(currFace);
    let planeDir = currDir.sub(normal.mul(currDir.dot(normal)));
    const planeLen = planeDir.len();
    if (planeLen < 1e-9) break;
    planeDir = planeDir.div(planeLen);
    const nextPos = currPos.add(planeDir.mul(dt));
    if (isPointInFace(mesh, currFace, nextPos)) {
      currPos = nextPos;
      points.push(currPos.add(normal.mul(lift)));
      continue;
    }
    let exit = findExitEdge(mesh, currFace, currPos, planeDir, normalFor);
    if (!exit) exit = closestEdgeFallback(mesh, currFace, nextPos);
    if (!exit) break;
    currPos = exit.point;
    points.push(currPos.add(normal.mul(lift)));
    if (mesh.isBoundaryEdge(exit.edgeId)) break;
    const nextFace = neighborFace(mesh, exit.edgeId, currFace);
    if (nextFace < 0) break;
    currFace = nextFace;
    const nextNormal = normalFor(currFace);
    let nextDir = currDir.sub(nextNormal.mul(currDir.dot(nextNormal)));
    const nLen = nextDir.len();
    if (nLen < 1e-9) break;
    nextDir = nextDir.div(nLen);
    currPos = currPos.add(nextDir.mul(dt * 0.1));
  }
  return points;
}

// src/core/algo/BspTree.ts
var EPS2 = 1e-5;
function polygonFromVertices(vertices, shared) {
  const plane = HPlane.fromThreePoints(vertices[0], vertices[1], vertices[2]);
  return { vertices, plane, shared };
}
function flipPolygon(p) {
  return { vertices: [...p.vertices].reverse(), plane: p.plane.flipped(), shared: p.shared };
}
function splitPolygon(polygon, plane, coplanarFront, coplanarBack, front, back) {
  const verts = polygon.vertices;
  const n = verts.length;
  const dists = new Array(n);
  const sides = new Array(n);
  let type = 0 /* COPLANAR */;
  for (let i = 0; i < n; i++) {
    const d = plane.distToPoint(verts[i]);
    dists[i] = d;
    const s = d > EPS2 ? 1 /* FRONT */ : d < -EPS2 ? 2 /* BACK */ : 0 /* COPLANAR */;
    sides[i] = s;
    type |= s;
  }
  switch (type) {
    case 0 /* COPLANAR */:
      if (plane.normal.dot(polygon.plane.normal) > 0) coplanarFront.push(polygon);
      else coplanarBack.push(polygon);
      break;
    case 1 /* FRONT */:
      front.push(polygon);
      break;
    case 2 /* BACK */:
      back.push(polygon);
      break;
    case 3 /* SPANNING */: {
      const f2 = [];
      const b = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const si = sides[i], sj = sides[j];
        const vi = verts[i], vj = verts[j];
        if (si !== 2 /* BACK */) f2.push(vi);
        if (si !== 1 /* FRONT */) b.push(vi);
        if ((si | sj) === 3 /* SPANNING */) {
          const t = dists[i] / (dists[i] - dists[j]);
          const v = vi.lerp(vj, t);
          f2.push(v);
          b.push(v);
        }
      }
      if (f2.length >= 3) front.push({ vertices: f2, plane: polygon.plane, shared: polygon.shared });
      if (b.length >= 3) back.push({ vertices: b, plane: polygon.plane, shared: polygon.shared });
      break;
    }
  }
}
function buildNode(polygons) {
  if (polygons.length === 0) return null;
  const plane = polygons[0].plane;
  const coF = [];
  const coB = [];
  const front = [];
  const back = [];
  for (const p of polygons) {
    splitPolygon(p, plane, coF, coB, front, back);
  }
  return {
    plane,
    front: buildNode(front),
    back: buildNode(back),
    coplanarFront: coF,
    coplanarBack: coB
  };
}
function allPolygons(node) {
  if (!node) return [];
  return [
    ...node.coplanarFront,
    ...node.coplanarBack,
    ...allPolygons(node.front),
    ...allPolygons(node.back)
  ];
}
function cloneNode(node) {
  if (!node) return null;
  return {
    plane: node.plane,
    front: cloneNode(node.front),
    back: cloneNode(node.back),
    coplanarFront: [...node.coplanarFront],
    coplanarBack: [...node.coplanarBack]
  };
}
function invertNode(node) {
  if (!node) return;
  for (let i = 0; i < node.coplanarFront.length; i++) {
    node.coplanarFront[i] = flipPolygon(node.coplanarFront[i]);
  }
  for (let i = 0; i < node.coplanarBack.length; i++) {
    node.coplanarBack[i] = flipPolygon(node.coplanarBack[i]);
  }
  const tmp = node.coplanarFront;
  node.coplanarFront = node.coplanarBack;
  node.coplanarBack = tmp;
  node.plane = node.plane.flipped();
  const tmpChild = node.front;
  node.front = node.back;
  node.back = tmpChild;
  invertNode(node.front);
  invertNode(node.back);
}
function clipPolygons(node, polygons) {
  if (!node) return [...polygons];
  let front = [];
  let back = [];
  const coF = [];
  const coB = [];
  for (const p of polygons) {
    splitPolygon(p, node.plane, coF, coB, front, back);
  }
  front = front.concat(coF);
  back = back.concat(coB);
  front = clipPolygons(node.front, front);
  back = node.back ? clipPolygons(node.back, back) : [];
  return front.concat(back);
}
function clipTo(a, b) {
  if (!a || !b) return;
  a.coplanarFront = clipPolygons(b, a.coplanarFront);
  a.coplanarBack = clipPolygons(b, a.coplanarBack);
  clipTo(a.front, b);
  clipTo(a.back, b);
}
function classifyPointNode(node, point) {
  if (!node) return "outside";
  const d = node.plane.distToPoint(point);
  if (d > EPS2) return classifyPointNode(node.front, point);
  if (d < -EPS2) {
    return node.back ? classifyPointNode(node.back, point) : "inside";
  }
  for (const poly of node.coplanarFront) {
    if (pointInConvexPolygon(point, poly)) return "on";
  }
  for (const poly of node.coplanarBack) {
    if (pointInConvexPolygon(point, poly)) return "on";
  }
  const fc = classifyPointNode(node.front, point);
  if (fc === "inside") return "inside";
  return classifyPointNode(node.back, point);
}
function pointInConvexPolygon(point, poly) {
  const verts = poly.vertices;
  const n = verts.length;
  const normal = poly.plane.normal;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const edge = verts[j].sub(verts[i]);
    const toPoint = point.sub(verts[i]);
    if (edge.cross(toPoint).dot(normal) < -EPS2) return false;
  }
  return true;
}
function traverseFTB(node, eye, visit) {
  if (!node) return;
  const d = node.plane.distToPoint(eye);
  if (d > 0) {
    traverseFTB(node.back, eye, visit);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    traverseFTB(node.front, eye, visit);
  } else {
    traverseFTB(node.front, eye, visit);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    traverseFTB(node.back, eye, visit);
  }
}
function traverseBTF(node, eye, visit) {
  if (!node) return;
  const d = node.plane.distToPoint(eye);
  if (d > 0) {
    traverseBTF(node.front, eye, visit);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    traverseBTF(node.back, eye, visit);
  } else {
    traverseBTF(node.back, eye, visit);
    if (node.coplanarBack.length) visit(node.coplanarBack);
    if (node.coplanarFront.length) visit(node.coplanarFront);
    traverseBTF(node.front, eye, visit);
  }
}
function polygonsFromMesh(positions, indices) {
  const nVerts = positions.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < positions.length; i += 3) {
    cx += positions[i];
    cy += positions[i + 1];
    cz += positions[i + 2];
  }
  cx /= nVerts;
  cy /= nVerts;
  cz /= nVerts;
  const polys = [];
  const nTri = indices.length / 3;
  for (let i = 0; i < nTri; i++) {
    const i0 = indices[i * 3] * 3;
    const i1 = indices[i * 3 + 1] * 3;
    const i2 = indices[i * 3 + 2] * 3;
    let a = new Vec3(positions[i0], positions[i0 + 1], positions[i0 + 2]);
    let b = new Vec3(positions[i1], positions[i1 + 1], positions[i1 + 2]);
    let c = new Vec3(positions[i2], positions[i2 + 1], positions[i2 + 2]);
    const cross = b.sub(a).cross(c.sub(a));
    if (cross.len() < EPS2) continue;
    const triCenter = new Vec3(
      (a.x + b.x + c.x) / 3,
      (a.y + b.y + c.y) / 3,
      (a.z + b.z + c.z) / 3
    );
    const outward = new Vec3(triCenter.x - cx, triCenter.y - cy, triCenter.z - cz);
    if (cross.dot(outward) < 0) {
      const tmp = b;
      b = c;
      c = tmp;
    }
    polys.push(polygonFromVertices([a, b, c]));
  }
  return polys;
}
function polygonsToMesh(polys) {
  const QUANT = 1e5;
  const vertMap = /* @__PURE__ */ new Map();
  const verts = [];
  const idxs = [];
  function addVert(v) {
    const key = `${Math.round(v.x * QUANT)}:${Math.round(v.y * QUANT)}:${Math.round(v.z * QUANT)}`;
    let idx = vertMap.get(key);
    if (idx !== void 0) return idx;
    idx = verts.length / 3;
    vertMap.set(key, idx);
    verts.push(v.x, v.y, v.z);
    return idx;
  }
  for (const p of polys) {
    const vs = p.vertices;
    if (vs.length < 3) continue;
    const i0 = addVert(vs[0]);
    for (let j = 1; j < vs.length - 1; j++) {
      idxs.push(i0, addVert(vs[j]), addVert(vs[j + 1]));
    }
  }
  return {
    positions: new Float32Array(verts),
    indices: new Uint32Array(idxs)
  };
}
var BspTree = class _BspTree {
  constructor(root) {
    this.root = root;
  }
  // ── Construction ──
  /** Build a BSP tree from polygons. */
  static fromPolygons(polys) {
    return new _BspTree(buildNode(polys));
  }
  /** Build a BSP tree from an indexed triangle mesh. */
  static fromMesh(positions, indices) {
    return _BspTree.fromPolygons(polygonsFromMesh(positions, indices));
  }
  // ── Queries ──
  /** Collect all polygons in the tree. */
  toPolygons() {
    return allPolygons(this.root);
  }
  /** Triangulate all polygons and return as typed arrays (shared vertices). */
  toMesh() {
    return polygonsToMesh(this.toPolygons());
  }
  /** Triangulate with flat (per-face) normals — ready for rendering.
   *  No vertex deduplication; each triangle gets its own 3 vertices + normal. */
  toFlatMesh() {
    const polys = this.toPolygons();
    let nTris = 0;
    for (const p of polys) nTris += Math.max(0, p.vertices.length - 2);
    const positions = new Float32Array(nTris * 9);
    const normals = new Float32Array(nTris * 9);
    const indices = new Uint32Array(nTris * 3);
    let vi = 0, ii = 0;
    for (const p of polys) {
      const vs = p.vertices;
      if (vs.length < 3) continue;
      const nx = p.plane.normal.x, ny = p.plane.normal.y, nz = p.plane.normal.z;
      for (let j = 1; j < vs.length - 1; j++) {
        const base = vi / 3;
        positions[vi] = vs[0].x;
        positions[vi + 1] = vs[0].y;
        positions[vi + 2] = vs[0].z;
        normals[vi] = nx;
        normals[vi + 1] = ny;
        normals[vi + 2] = nz;
        vi += 3;
        positions[vi] = vs[j].x;
        positions[vi + 1] = vs[j].y;
        positions[vi + 2] = vs[j].z;
        normals[vi] = nx;
        normals[vi + 1] = ny;
        normals[vi + 2] = nz;
        vi += 3;
        positions[vi] = vs[j + 1].x;
        positions[vi + 1] = vs[j + 1].y;
        positions[vi + 2] = vs[j + 1].z;
        normals[vi] = nx;
        normals[vi + 1] = ny;
        normals[vi + 2] = nz;
        vi += 3;
        indices[ii++] = base;
        indices[ii++] = base + 1;
        indices[ii++] = base + 2;
      }
    }
    return { positions, normals, indices };
  }
  /** Deep clone. */
  clone() {
    return new _BspTree(cloneNode(this.root));
  }
  /** Flip solid inside/outside. */
  invert() {
    invertNode(this.root);
    return this;
  }
  /** Classify a point relative to the solid. */
  classifyPoint(point) {
    return classifyPointNode(this.root, point);
  }
  // ── Traversal ──
  /** Visit polygons front-to-back from the given eye position. */
  traverseFrontToBack(eye, visit) {
    traverseFTB(this.root, eye, visit);
  }
  /** Visit polygons back-to-front from the given eye position (painter's order). */
  traverseBackToFront(eye, visit) {
    traverseBTF(this.root, eye, visit);
  }
  // ── CSG operations (return new trees, inputs unchanged) ──
  /** Return a new tree representing the union of a and b. */
  static union(a, b) {
    const ac = a.clone();
    const bc = b.clone();
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    return _BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
  }
  /** Return a new tree representing a with b subtracted. */
  static subtract(a, b) {
    const ac = a.clone();
    const bc = b.clone();
    invertNode(ac.root);
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    const result = _BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
    result.invert();
    return result;
  }
  /** Return a new tree representing the intersection of a and b. */
  static intersect(a, b) {
    const ac = a.clone();
    const bc = b.clone();
    invertNode(ac.root);
    clipTo(bc.root, ac.root);
    invertNode(bc.root);
    clipTo(ac.root, bc.root);
    clipTo(bc.root, ac.root);
    invertNode(ac.root);
    invertNode(bc.root);
    return _BspTree.fromPolygons([...allPolygons(ac.root), ...allPolygons(bc.root)]);
  }
};

// src/core/geometry/surfaces/index.ts
function findKnotSpan(u, degree, knots, numCtrl) {
  const n = numCtrl - 1;
  if (u >= knots[n + 1]) return n;
  if (u <= knots[degree]) return degree;
  let low = degree, high = n + 1;
  let mid = low + high >> 1;
  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid;
    else low = mid;
    mid = low + high >> 1;
  }
  return mid;
}
function deBoor4D(pw, w, degree, knots, u) {
  const k = findKnotSpan(u, degree, knots, pw.length);
  const dPw = new Array(degree + 1);
  const dW = new Array(degree + 1);
  for (let j = 0; j <= degree; j++) {
    const idx = k - degree + j;
    dPw[j] = pw[idx];
    dW[j] = w[idx];
  }
  for (let r = 1; r <= degree; r++) {
    for (let j = degree; j >= r; j--) {
      const denom = knots[k + 1 + j - r] - knots[k - degree + j];
      const alpha = denom > 0 ? (u - knots[k - degree + j]) / denom : 0;
      dPw[j] = dPw[j - 1].mul(1 - alpha).add(dPw[j].mul(alpha));
      dW[j] = dW[j - 1] * (1 - alpha) + dW[j] * alpha;
    }
  }
  return { pw: dPw[degree], w: dW[degree] };
}
function clampedUniformKnots(numCtrl, degree) {
  if (numCtrl <= degree) {
    throw new Error(`Need at least degree+1 control points (got ${numCtrl}, degree ${degree})`);
  }
  const knots = [];
  for (let i = 0; i <= degree; i++) knots.push(0);
  const interior = numCtrl - degree - 1;
  for (let i = 1; i <= interior; i++) knots.push(i / (interior + 1));
  for (let i = 0; i <= degree; i++) knots.push(1);
  return knots;
}
var NurbsSurface = class _NurbsSurface {
  /**
   * @param controlPoints  controlPoints[uIdx][vIdx], size (nU+1) × (nV+1)
   * @param degreeU        degree in the u-direction
   * @param degreeV        degree in the v-direction
   * @param knotsU         length must equal controlPoints.length + degreeU + 1
   * @param knotsV         length must equal controlPoints[0].length + degreeV + 1
   * @param weights        optional, same shape as controlPoints (defaults to all 1)
   */
  constructor(controlPoints, degreeU, degreeV, knotsU, knotsV, weights) {
    this.controlPoints = controlPoints;
    this.degreeU = degreeU;
    this.degreeV = degreeV;
    this.knotsU = knotsU;
    this.knotsV = knotsV;
    this.weights = weights;
    const nU = controlPoints.length;
    const nV = controlPoints[0]?.length ?? 0;
    if (knotsU.length !== nU + degreeU + 1) {
      throw new Error(`knotsU length ${knotsU.length} != ${nU} + ${degreeU} + 1`);
    }
    if (knotsV.length !== nV + degreeV + 1) {
      throw new Error(`knotsV length ${knotsV.length} != ${nV} + ${degreeV} + 1`);
    }
  }
  /** Evaluate the surface at (u, v), both normalized to [0, 1]. */
  getPoint(u, v) {
    const uMin = this.knotsU[this.degreeU];
    const uMax = this.knotsU[this.knotsU.length - this.degreeU - 1];
    const vMin = this.knotsV[this.degreeV];
    const vMax = this.knotsV[this.knotsV.length - this.degreeV - 1];
    const uu = uMin + (uMax - uMin) * HMath.clamp(u, 0, 1);
    const vv = vMin + (vMax - vMin) * HMath.clamp(v, 0, 1);
    return this.evaluate(uu, vv);
  }
  /** Outward normal at (u, v) via finite differences in parameter space. */
  getNormal(u, v) {
    const eps = 1e-3;
    const u1 = u + eps > 1 ? u - eps : u + eps;
    const v1 = v + eps > 1 ? v - eps : v + eps;
    const signU = u + eps > 1 ? -1 : 1;
    const signV = v + eps > 1 ? -1 : 1;
    const p = this.getPoint(u, v);
    const du = this.getPoint(u1, v).sub(p).mul(signU);
    const dv = this.getPoint(u, v1).sub(p).mul(signV);
    return du.cross(dv).normalize();
  }
  /**
   * Tessellate the surface into a ConnectedMesh by sampling on a (uDivs × vDivs) grid.
   * `closedU` / `closedV` merge the seam (use closedU=true for surfaces from `revolve`).
   */
  toMesh(uDivs = 32, vDivs = 32, closedU = false, closedV = false) {
    const mesh = new ConnectedMesh();
    const uSteps = closedU ? uDivs : uDivs + 1;
    const vSteps = closedV ? vDivs : vDivs + 1;
    const ids = [];
    for (let i = 0; i < uSteps; i++) {
      ids[i] = [];
      const u = i / uDivs;
      for (let j = 0; j < vSteps; j++) {
        const v = j / vDivs;
        ids[i][j] = mesh.addNode(this.getPoint(u, v));
      }
    }
    for (let i = 0; i < uDivs; i++) {
      for (let j = 0; j < vDivs; j++) {
        const ni = closedU ? (i + 1) % uSteps : i + 1;
        const nj = closedV ? (j + 1) % vSteps : j + 1;
        mesh.addQuad(ids[i][j], ids[ni][j], ids[ni][nj], ids[i][nj]);
      }
    }
    mesh.computeVertexNormals();
    return mesh;
  }
  // ── Static constructors ──
  /**
   * Skinned NURBS surface through a set of compatible cross-section curves.
   *
   * All input curves must share the same degree, knot vector, and number of
   * control points. The curves become rows of the surface control net in the
   * u-direction; v-direction inherits from the curves. The resulting surface
   * passes exactly through the first and last curve (clamped knot ends).
   *
   * @param curves      ≥ 2 compatible NurbsCurves
   * @param degreeU     desired u-direction degree (clamped to curves.length - 1)
   */
  static loft(curves, degreeU = 3) {
    if (curves.length < 2) throw new Error("loft requires at least 2 curves");
    const degreeV = curves[0].degree;
    const knotsV = curves[0].knots.slice();
    const nV = curves[0].controlPoints.length;
    for (let i = 1; i < curves.length; i++) {
      if (curves[i].degree !== degreeV) {
        throw new Error(`loft: curve ${i} has degree ${curves[i].degree}, expected ${degreeV}`);
      }
      if (curves[i].controlPoints.length !== nV) {
        throw new Error(`loft: curve ${i} has ${curves[i].controlPoints.length} control points, expected ${nV}`);
      }
      if (curves[i].knots.length !== knotsV.length) {
        throw new Error(`loft: curve ${i} has incompatible knot vector`);
      }
    }
    const grid = curves.map((c) => c.controlPoints.map((p) => new Vec3(p.x, p.y, p.z)));
    const weights = curves.map(
      (c) => c.weights ? c.weights.slice() : new Array(nV).fill(1)
    );
    const nU = curves.length;
    const actualDegreeU = Math.max(1, Math.min(degreeU, nU - 1));
    const knotsU = clampedUniformKnots(nU, actualDegreeU);
    return new _NurbsSurface(grid, actualDegreeU, degreeV, knotsU, knotsV, weights);
  }
  /**
   * Revolve a NURBS profile curve around an axis to produce a NURBS surface of revolution.
   *
   * Uses the standard 9-control-point / 4-arc rational quadratic encoding of a
   * full circle (degree 2 in the u-direction, weights alternating 1 and 1/√2),
   * so the result is geometrically exact.
   *
   * @param profile      profile curve. Treated as the v-direction of the output.
   * @param axisOrigin   a point on the axis. Default origin.
   * @param axisDir      axis direction (need not be unit). Default world Y.
   */
  static revolve(profile, axisOrigin = new Vec3(0, 0, 0), axisDir = new Vec3(0, 1, 0)) {
    const A = axisDir.normalize();
    let xRef = Math.abs(A.dot(new Vec3(1, 0, 0))) < 0.9 ? new Vec3(1, 0, 0) : new Vec3(0, 0, 1);
    xRef = xRef.sub(A.mul(A.dot(xRef))).normalize();
    const yRef = A.cross(xRef).normalize();
    const SQRT1_2 = Math.SQRT1_2;
    const distMul = [1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1];
    const weightMul = [1, SQRT1_2, 1, SQRT1_2, 1, SQRT1_2, 1, SQRT1_2, 1];
    const nV = profile.controlPoints.length;
    const grid = [];
    const weights = [];
    for (let i = 0; i < 9; i++) {
      grid[i] = [];
      weights[i] = [];
      const angle = i * Math.PI / 4;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      for (let j = 0; j < nV; j++) {
        const P2 = profile.controlPoints[j];
        const rel = P2.sub(axisOrigin);
        const h = rel.dot(A);
        const radialVec = rel.sub(A.mul(h));
        const radius = radialVec.len();
        let radialDir;
        let perpRadialDir;
        if (radius > 1e-10) {
          radialDir = radialVec.div(radius);
          perpRadialDir = A.cross(radialDir);
        } else {
          radialDir = xRef;
          perpRadialDir = yRef;
        }
        const offset = radialDir.mul(ca).add(perpRadialDir.mul(sa)).mul(radius * distMul[i]);
        const pos = axisOrigin.add(A.mul(h)).add(offset);
        const profW = profile.weights ? profile.weights[j] : 1;
        grid[i][j] = pos;
        weights[i][j] = weightMul[i] * profW;
      }
    }
    const knotsU = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4];
    return new _NurbsSurface(grid, 2, profile.degree, knotsU, profile.knots.slice(), weights);
  }
  // ── Internal ──
  evaluate(u, v) {
    const nU = this.controlPoints.length;
    const rowPw = new Array(nU);
    const rowW = new Array(nU);
    for (let i = 0; i < nU; i++) {
      const pts = this.controlPoints[i];
      const wts = this.weights ? this.weights[i] : null;
      const nV = pts.length;
      const pw = new Array(nV);
      const w = new Array(nV);
      for (let j = 0; j < nV; j++) {
        const wj = wts ? wts[j] : 1;
        pw[j] = pts[j].mul(wj);
        w[j] = wj;
      }
      const r = deBoor4D(pw, w, this.degreeV, this.knotsV, v);
      rowPw[i] = r.pw;
      rowW[i] = r.w;
    }
    const final = deBoor4D(rowPw, rowW, this.degreeU, this.knotsU, u);
    return final.pw.mul(1 / final.w);
  }
};

// src/core/solar/SunPosition.ts
var SunPosition = {
  /**
   * Compute the sun's position in the sky for a given UTC instant and
   * geographic coordinates.
   *
   * @example
   *   // Solar noon, summer solstice, Zurich:
   *   const sun = SunPosition.compute({
   *     date:      new Date(Date.UTC(2025, 5, 21, 11, 30)),
   *     latitude:  47.37,
   *     longitude: 8.55,
   *   });
   *   // sun.altitude ≈ 1.10 rad (≈ 63°), sun.azimuth ≈ π (south).
   *   threeLight.position.copy(sun.direction).multiplyScalar(50);
   */
  compute(opts) {
    const { date, latitude, longitude } = opts;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const jd0 = julianDay(year, month, day);
    const t = jd0 + hour / 24 - 2451545;
    const meanLon = mod360(280.46 + 0.9856474 * t);
    const meanAnom = mod360(357.528 + 0.9856003 * t);
    const mA = rad(meanAnom);
    const eclLon = mod360(
      meanLon + 1.915 * Math.sin(mA) + 0.02 * Math.sin(2 * mA)
    );
    const eL = rad(eclLon);
    const obliq = rad(23.439 - 4e-7 * t);
    let ra = Math.atan2(Math.cos(obliq) * Math.sin(eL), Math.cos(eL));
    if (ra < 0) ra += 2 * Math.PI;
    const decl = Math.asin(Math.sin(obliq) * Math.sin(eL));
    let gmst = (6.697375 + 0.0657098242 * t + hour) % 24;
    if (gmst < 0) gmst += 24;
    let lmst = (gmst + longitude / 15) % 24;
    if (lmst < 0) lmst += 24;
    let ha = rad(lmst * 15) - ra;
    if (ha > Math.PI) ha -= 2 * Math.PI;
    if (ha < -Math.PI) ha += 2 * Math.PI;
    const lat = rad(latitude);
    const sinAlt = Math.sin(decl) * Math.sin(lat) + Math.cos(decl) * Math.cos(lat) * Math.cos(ha);
    const altitude = Math.asin(clamp(sinAlt, -1, 1));
    const cosAlt = Math.cos(altitude);
    let azimuth = 0;
    if (cosAlt > 1e-9) {
      const sinAz = -Math.cos(decl) * Math.sin(ha);
      const cosAz = Math.sin(decl) * Math.cos(lat) - Math.cos(decl) * Math.cos(ha) * Math.sin(lat);
      azimuth = Math.atan2(sinAz, cosAz);
      if (azimuth < 0) azimuth += 2 * Math.PI;
      if (azimuth >= 2 * Math.PI) azimuth -= 2 * Math.PI;
    }
    const direction = new Vec3(
      Math.sin(azimuth) * cosAlt,
      Math.cos(azimuth) * cosAlt,
      Math.sin(altitude)
    );
    return { altitude, azimuth, direction, isDaytime: altitude > 0 };
  }
};
function rad(deg) {
  return deg * Math.PI / 180;
}
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
function mod360(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}
function julianDay(year, month, day) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

// src/core/graph/index.ts
var MinHeap = class {
  constructor() {
    this.data = [];
  }
  get size() {
    return this.data.length;
  }
  push(val, priority) {
    this.data.push({ val, pri: priority });
    this.bubbleUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return void 0;
    const top = this.data[0].val;
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  bubbleUp(i) {
    while (i > 0) {
      const p = i - 1 >> 1;
      if (this.data[i].pri >= this.data[p].pri) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }
  bubbleDown(i) {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].pri < this.data[min].pri) min = l;
      if (r < n && this.data[r].pri < this.data[min].pri) min = r;
      if (min === i) break;
      [this.data[i], this.data[min]] = [this.data[min], this.data[i]];
      i = min;
    }
  }
};
var Graph = class _Graph {
  constructor(nodeCount, getNeighbors, getWeight) {
    this.nodeCount = nodeCount;
    this.getNeighbors = getNeighbors;
    this.getWeight = getWeight ?? (() => 1);
  }
  // ── Dijkstra ──
  dijkstra(source) {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    dist[source] = 0;
    return this.dijkstraFromDistances(dist);
  }
  dijkstraFromSources(sources) {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    for (const s of sources) dist[s] = 0;
    return this.dijkstraFromDistances(dist);
  }
  dijkstraFromDistances(startDist) {
    const dist = new Float64Array(startDist);
    const pred = new Int32Array(this.nodeCount).fill(-1);
    const pq = new MinHeap();
    for (let i = 0; i < this.nodeCount; i++) {
      if (dist[i] < Infinity) pq.push(i, dist[i]);
    }
    while (pq.size > 0) {
      const u = pq.pop();
      for (const v of this.getNeighbors(u)) {
        const d = dist[u] + this.getWeight(u, v);
        if (d < dist[v]) {
          dist[v] = d;
          pred[v] = u;
          pq.push(v, d);
        }
      }
    }
    return { dist, pred };
  }
  shortestPath(source, target) {
    const { pred } = this.dijkstra(source);
    return _Graph.tracePath(pred, target);
  }
  static tracePath(pred, target) {
    const path = [];
    let v = target;
    while (v !== -1) {
      path.push(v);
      v = pred[v];
    }
    return path;
  }
  // ── Voronoi ──
  dijkstraVoronoi(sources) {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    const pred = new Int32Array(this.nodeCount).fill(-1);
    const closest = new Int32Array(this.nodeCount).fill(-1);
    const pq = new MinHeap();
    for (const s of sources) {
      dist[s] = 0;
      closest[s] = s;
      pq.push({ node: s, origin: s }, 0);
    }
    while (pq.size > 0) {
      const { node: u, origin } = pq.pop();
      if (closest[u] !== -1 && closest[u] !== origin && dist[u] < Infinity) continue;
      for (const v of this.getNeighbors(u)) {
        const d = dist[u] + this.getWeight(u, v);
        if (d < dist[v]) {
          dist[v] = d;
          pred[v] = u;
          closest[v] = origin;
          pq.push({ node: v, origin }, d);
        }
      }
    }
    return { dist, pred, closest };
  }
  // ── Connected components ──
  connectedComponents() {
    const labels = new Int32Array(this.nodeCount).fill(-1);
    const components = [];
    for (let i = 0; i < this.nodeCount; i++) {
      if (labels[i] >= 0) continue;
      const gid = components.length;
      const component = [];
      components.push(component);
      const queue = [i];
      labels[i] = gid;
      component.push(i);
      while (queue.length > 0) {
        const current = queue.shift();
        for (const nb of this.getNeighbors(current)) {
          if (labels[nb] < 0) {
            labels[nb] = gid;
            component.push(nb);
            queue.push(nb);
          }
        }
      }
    }
    return components;
  }
  componentLabels() {
    const labels = new Int32Array(this.nodeCount).fill(-1);
    let gid = 0;
    for (let i = 0; i < this.nodeCount; i++) {
      if (labels[i] >= 0) continue;
      const queue = [i];
      labels[i] = gid;
      while (queue.length > 0) {
        const current = queue.shift();
        for (const nb of this.getNeighbors(current)) {
          if (labels[nb] < 0) {
            labels[nb] = gid;
            queue.push(nb);
          }
        }
      }
      gid++;
    }
    return labels;
  }
  // ── Flood fill ──
  floodFill(seeds, maxDistance = Infinity) {
    const { dist } = this.dijkstraFromSources(seeds);
    const result = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (dist[i] <= maxDistance) result.push(i);
    return result;
  }
  floodFillPredicate(seed, predicate) {
    const visited = new Uint8Array(this.nodeCount);
    const result = [];
    const queue = [];
    if (!predicate(seed)) return result;
    visited[seed] = 1;
    queue.push(seed);
    result.push(seed);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const nb of this.getNeighbors(current)) {
        if (!visited[nb] && predicate(nb)) {
          visited[nb] = 1;
          result.push(nb);
          queue.push(nb);
        }
      }
    }
    return result;
  }
  // ── Degree analysis ──
  degrees() {
    const deg = new Int32Array(this.nodeCount);
    for (let i = 0; i < this.nodeCount; i++)
      deg[i] = this.getNeighbors(i).length;
    return deg;
  }
  leafNodes() {
    const leaves = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (this.getNeighbors(i).length === 1) leaves.push(i);
    return leaves;
  }
  junctionNodes() {
    const junctions = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (this.getNeighbors(i).length >= 3) junctions.push(i);
    return junctions;
  }
  // ── Eccentricity / Diameter ──
  eccentricity(node) {
    const { dist } = this.dijkstra(node);
    let max = 0;
    for (let i = 0; i < dist.length; i++)
      if (dist[i] < Infinity && dist[i] > max) max = dist[i];
    return max;
  }
  diameter() {
    let max = 0;
    for (let i = 0; i < this.nodeCount; i++)
      max = Math.max(max, this.eccentricity(i));
    return max;
  }
  // ── Factories ──
  static fromAdjacencyList(adjacency, weightFn) {
    return new _Graph(adjacency.length, (i) => adjacency[i], weightFn);
  }
  static fromEdgeList(nodeCount, edges, undirected = true, weightFn) {
    const adj = Array.from({ length: nodeCount }, () => []);
    for (const [from, to] of edges) {
      adj[from].push(to);
      if (undirected) adj[to].push(from);
    }
    return new _Graph(nodeCount, (i) => adj[i], weightFn);
  }
};
var GridGraph = {
  /** Creates a 2D 4-connected grid graph (N/S/E/W neighbors). */
  grid2D4(nx, ny, weightFn) {
    const n = nx * ny;
    const nbs = new Array(n);
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const list = [];
        if (x < nx - 1) list.push((x + 1) * ny + y);
        if (y < ny - 1) list.push(x * ny + y + 1);
        if (x > 0) list.push((x - 1) * ny + y);
        if (y > 0) list.push(x * ny + y - 1);
        nbs[x * ny + y] = list;
      }
    }
    return new Graph(n, (i) => nbs[i], weightFn ?? (() => 1));
  },
  /** Creates a 2D 8-connected grid graph (includes diagonals). */
  grid2D8(nx, ny, weightFn) {
    const n = nx * ny;
    const nbs = new Array(n);
    const sqrt2 = Math.SQRT2;
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const list = [];
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx2 = x + dx, ny2 = y + dy;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny)
              list.push(nx2 * ny + ny2);
          }
        nbs[x * ny + y] = list;
      }
    }
    if (!weightFn) {
      weightFn = (i, j) => {
        const x1 = Math.floor(i / ny), y1 = i % ny;
        const x2 = Math.floor(j / ny), y2 = j % ny;
        return x1 !== x2 && y1 !== y2 ? sqrt2 : 1;
      };
    }
    return new Graph(n, (i) => nbs[i], weightFn);
  },
  /** Creates a 3D 6-connected voxel grid graph (face neighbors only). */
  grid3D6(nx, ny, nz, weightFn) {
    const nyz = ny * nz;
    const n = nx * ny * nz;
    const nbs = new Array(n);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const list = [];
          if (x > 0) list.push((x - 1) * nyz + y * nz + z);
          if (x < nx - 1) list.push((x + 1) * nyz + y * nz + z);
          if (y > 0) list.push(x * nyz + (y - 1) * nz + z);
          if (y < ny - 1) list.push(x * nyz + (y + 1) * nz + z);
          if (z > 0) list.push(x * nyz + y * nz + z - 1);
          if (z < nz - 1) list.push(x * nyz + y * nz + z + 1);
          nbs[x * nyz + y * nz + z] = list;
        }
    return new Graph(n, (i) => nbs[i], weightFn ?? (() => 1));
  }
};

// src/core/geometry/planarGraph/index.ts
var PGVertex = class {
  constructor(position) {
    this.edge = null;
    this.tag = 0;
    this.position = position;
  }
  get isIsolated() {
    return this.edge === null;
  }
  get degree() {
    if (!this.edge) return 0;
    let n = 0;
    let h = this.edge;
    do {
      n++;
      h = h.nextAtOrigin;
    } while (h !== this.edge);
    return n;
  }
  *outgoingEdges() {
    if (!this.edge) return;
    let h = this.edge;
    do {
      yield h;
      h = h.nextAtOrigin;
    } while (h !== this.edge);
  }
  *neighbors() {
    for (const h of this.outgoingEdges()) yield h.destination;
  }
  getEdgeTo(dest) {
    if (!this.edge) return null;
    let h = this.edge;
    do {
      if (h.destination === dest) return h;
      h = h.nextAtOrigin;
    } while (h !== this.edge);
    return null;
  }
  isNeighbor(other) {
    return this.getEdgeTo(other) !== null;
  }
};
var PGHalfEdge = class {
  constructor() {
    this.face = null;
    this.tag = 0;
  }
  get destination() {
    return this.twin.origin;
  }
  get nextAtOrigin() {
    return this.twin.next;
  }
  get prevAtOrigin() {
    let h = this;
    while (h.nextAtOrigin !== this) h = h.nextAtOrigin;
    return h;
  }
  get prev() {
    return this.prevAtOrigin.twin;
  }
  get direction() {
    return this.destination.position.sub(this.origin.position);
  }
  get midpoint() {
    return this.origin.position.add(this.destination.position).mul(0.5);
  }
  get length() {
    return this.direction.len();
  }
  get angle() {
    const d = this.direction;
    return Math.atan2(d.y, d.x);
  }
  get isSingle() {
    return this.nextAtOrigin === this;
  }
};
var PGFace = class {
  constructor() {
    this.tag = 0;
    this.color = null;
  }
  *edges() {
    let h = this.edge;
    do {
      yield h;
      h = h.next;
    } while (h !== this.edge);
  }
  *vertices() {
    let h = this.edge;
    do {
      yield h.origin;
      h = h.next;
    } while (h !== this.edge);
  }
  polygon() {
    const poly = [];
    for (const v of this.vertices()) poly.push(v.position);
    return poly;
  }
  get edgeCount() {
    let n = 0;
    let h = this.edge;
    do {
      n++;
      h = h.next;
    } while (h !== this.edge);
    return n;
  }
  signedArea() {
    let area = 0;
    let h = this.edge;
    do {
      const a = h.origin.position;
      const b = h.destination.position;
      area += a.x * b.y - b.x * a.y;
      h = h.next;
    } while (h !== this.edge);
    return area * 0.5;
  }
  get isCCW() {
    return this.signedArea() > 0;
  }
};
var PlanarGraph = class {
  constructor() {
    this.vertices = [];
    this.halfEdges = [];
    this.faces = [];
    this._removed = null;
  }
  // ── Construction ──
  addVertex(position) {
    const v = new PGVertex(position);
    this.vertices.push(v);
    return v;
  }
  addEdge(from, to) {
    const h = this.createEdgePair(from, to);
    this.attach(h);
    return h;
  }
  createEdgePair(from, to) {
    const h = new PGHalfEdge();
    const t = new PGHalfEdge();
    h.origin = from;
    t.origin = to;
    h.twin = t;
    t.twin = h;
    h.next = t;
    t.next = h;
    this.halfEdges.push(h, t);
    return h;
  }
  // ── Attach / Detach ──
  attach(h) {
    attachAtVertex(h);
    attachAtVertex(h.twin);
  }
  detach(h) {
    detachHalf(h);
    detachHalf(h.twin);
    h.next = h.twin;
    h.twin.next = h;
  }
  removeEdge(h) {
    this.detach(h);
    if (!this._removed) this._removed = /* @__PURE__ */ new Set();
    this._removed.add(h);
    this._removed.add(h.twin);
  }
  flushRemovals() {
    if (!this._removed || this._removed.size === 0) return;
    const rem = this._removed;
    for (let i = this.halfEdges.length - 1; i >= 0; i--) {
      if (rem.has(this.halfEdges[i])) this.halfEdges.splice(i, 1);
    }
    this._removed.clear();
  }
  // ── Face Construction ──
  buildFaces() {
    this.flushRemovals();
    this.clearFaces();
    for (const he of this.halfEdges) he.face = null;
    for (const he of this.halfEdges) {
      if (he.face !== null) continue;
      const face = new PGFace();
      face.edge = he;
      this.faces.push(face);
      let cur = he;
      do {
        cur.face = face;
        cur = cur.next;
      } while (cur !== he);
    }
  }
  clearFaces() {
    this.faces.length = 0;
    for (const he of this.halfEdges) he.face = null;
  }
  removeNegativeFaces(removeNegative = true) {
    for (let i = this.faces.length - 1; i >= 0; i--) {
      const neg = this.faces[i].signedArea() < 0;
      if (neg === removeNegative) {
        let cur = this.faces[i].edge;
        const start = cur;
        do {
          cur.face = null;
          cur = cur.next;
        } while (cur !== start);
        this.faces.splice(i, 1);
      }
    }
  }
  // ── Queries ──
  getUniqueEdges() {
    this.flushRemovals();
    const result = [];
    const seen = /* @__PURE__ */ new Set();
    for (const he of this.halfEdges) {
      if (seen.has(he)) continue;
      seen.add(he);
      seen.add(he.twin);
      result.push(he);
    }
    return result;
  }
  findClosestVertex(point, tolerance) {
    const tolSq = tolerance * tolerance;
    let best = null;
    let bestDist = Infinity;
    for (const v of this.vertices) {
      const d = v.position.distSqTo(point);
      if (d < tolSq && d < bestDist) {
        bestDist = d;
        best = v;
      }
    }
    return best;
  }
  getBounds() {
    if (this.vertices.length === 0) return { min: Vec2.zero(), max: Vec2.zero() };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of this.vertices) {
      if (v.position.x < minX) minX = v.position.x;
      if (v.position.y < minY) minY = v.position.y;
      if (v.position.x > maxX) maxX = v.position.x;
      if (v.position.y > maxY) maxY = v.position.y;
    }
    return { min: new Vec2(minX, minY), max: new Vec2(maxX, maxY) };
  }
  clearTags() {
    for (const v of this.vertices) v.tag = 0;
    for (const he of this.halfEdges) he.tag = 0;
    for (const f2 of this.faces) f2.tag = 0;
  }
  /** Edge positions as Vec3 pairs on the XZ ground plane (Y-up). */
  getEdgePositions3D() {
    const unique = this.getUniqueEdges();
    const result = [];
    for (const he of unique) {
      const a = he.origin.position;
      const b = he.destination.position;
      result.push(new Vec3(a.x, 0, a.y), new Vec3(b.x, 0, b.y));
    }
    return result;
  }
  /**
   * Creates a flat Mesh from CCW faces on the XZ ground plane.
   * Uses ear-clipping triangulation (handles non-convex faces correctly).
   * Optional per-face color callback.
   */
  toFlatMesh(faceColor) {
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    for (let fi = 0; fi < this.faces.length; fi++) {
      const face = this.faces[fi];
      if (face.signedArea() <= 0) continue;
      const poly = face.polygon();
      if (poly.length < 3) continue;
      const col = face.color ?? (faceColor ? faceColor(face, fi) : [0.4, 0.6, 0.9, 1]);
      const baseIdx = positions.length / 3;
      for (const v of poly) {
        positions.push(v.x, 0, v.y);
        normals.push(0, 1, 0);
        colors.push(col[0], col[1], col[2], col[3]);
      }
      const triIndices = earClipTriangulate(poly);
      for (const idx of triIndices) {
        indices.push(baseIdx + idx);
      }
    }
    if (positions.length === 0) {
      return new Mesh(new Float32Array(0), new Uint32Array(0));
    }
    const fm = new Mesh(
      new Float32Array(positions),
      new Uint32Array(indices),
      new Float32Array(normals),
      void 0,
      // uvs
      new Float32Array(colors)
    );
    return fm;
  }
};
function earClipTriangulate(poly) {
  const n = poly.length;
  if (n < 3) return [];
  if (n === 3) return [0, 1, 2];
  const indices = [];
  const remaining = [];
  for (let i = 0; i < n; i++) remaining.push(i);
  let safety = n * n;
  while (remaining.length > 3 && safety-- > 0) {
    let earFound = false;
    for (let i = 0; i < remaining.length; i++) {
      const pi = (i + remaining.length - 1) % remaining.length;
      const ni = (i + 1) % remaining.length;
      const a = poly[remaining[pi]];
      const b = poly[remaining[i]];
      const c = poly[remaining[ni]];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross <= 0) continue;
      let isEar = true;
      for (let j = 0; j < remaining.length; j++) {
        if (j === pi || j === i || j === ni) continue;
        if (pointInTriangle2D2(poly[remaining[j]], a, b, c)) {
          isEar = false;
          break;
        }
      }
      if (isEar) {
        indices.push(remaining[pi], remaining[i], remaining[ni]);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }
    if (!earFound) break;
  }
  if (remaining.length === 3) {
    indices.push(remaining[0], remaining[1], remaining[2]);
  }
  return indices;
}
function pointInTriangle2D2(p, a, b, c) {
  const d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  const d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y);
  const d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}
function attachAtVertex(h) {
  const v = h.origin;
  if (v.edge === null) {
    v.edge = h;
    return;
  }
  if (v.edge.isSingle) {
    attachAfter(v.edge, h);
    return;
  }
  const newAngle = h.angle;
  let insertAfterEdge = null;
  let maxAngleEdge = null;
  let bestAngle = -Infinity;
  let maxAngle = -Infinity;
  let cur = v.edge;
  do {
    const a = cur.angle;
    if (a < newAngle && a > bestAngle) {
      bestAngle = a;
      insertAfterEdge = cur;
    }
    if (a > maxAngle) {
      maxAngle = a;
      maxAngleEdge = cur;
    }
    cur = cur.nextAtOrigin;
  } while (cur !== v.edge);
  const target = insertAfterEdge ?? maxAngleEdge;
  attachBefore(target, h);
}
function attachAfter(existing, newEdge) {
  const save = existing.nextAtOrigin;
  existing.twin.next = newEdge;
  newEdge.twin.next = save;
}
function attachBefore(existing, newEdge) {
  const prev = existing.prevAtOrigin;
  prev.twin.next = newEdge;
  newEdge.twin.next = existing;
}
function detachHalf(h) {
  const v = h.origin;
  if (v.edge === h) {
    const nextO = h.nextAtOrigin;
    v.edge = nextO === h ? null : nextO;
  }
  const pr = h.prev;
  const nextInFace = h.twin.next;
  pr.next = nextInFace;
}
var PlanarGraphRepair = {
  /** Creates a valid planar graph from line segments. */
  fromSegments(segments, tolerance) {
    const graph = new PlanarGraph();
    for (const seg of segments) {
      const v1 = graph.addVertex(seg.a);
      const v2 = graph.addVertex(seg.b);
      const h = graph.createEdgePair(v1, v2);
      graph.attach(h);
    }
    fuseCloseVertices(graph, tolerance);
    intersectWithVertices(graph, tolerance);
    intersectEdges(graph, tolerance);
    graph.buildFaces();
    return graph;
  }
};
function fuseCloseVertices(graph, tolerance) {
  const tolSq = tolerance * tolerance;
  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;
  const rep = /* @__PURE__ */ new Map();
  for (const v of graph.vertices) rep.set(v, v);
  for (let i = 0; i < graph.vertices.length; i++) {
    const vi = graph.vertices[i];
    if (rep.get(vi) !== vi) continue;
    for (let j = i + 1; j < graph.vertices.length; j++) {
      const vj = graph.vertices[j];
      if (rep.get(vj) !== vj) continue;
      if (vi.position.distSqTo(vj.position) < tolSq) rep.set(vj, vi);
    }
  }
  for (const h of edges) {
    h.origin = rep.get(h.origin);
    h.twin.origin = rep.get(h.twin.origin);
  }
  reattachEdges(graph, edges);
}
function intersectWithVertices(graph, tolerance) {
  const EPS3 = 1e-3;
  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;
  const edgeSplits = /* @__PURE__ */ new Map();
  for (let ei = 0; ei < edges.length; ei++) {
    const h = edges[ei];
    const a = h.origin.position;
    const b = h.destination.position;
    for (const v of graph.vertices) {
      if (v === h.origin || v === h.destination) continue;
      const dist = VecMath.distanceToSegment2D(v.position, a, b);
      if (dist < tolerance) {
        const t = projectOnSegment(v.position, a, b);
        if (t > EPS3 && t < 1 - EPS3) {
          if (!edgeSplits.has(ei)) edgeSplits.set(ei, []);
          edgeSplits.get(ei).push({ t, v });
        }
      }
    }
  }
  const allEdges = [];
  for (let ei = 0; ei < edges.length; ei++) {
    const splits = edgeSplits.get(ei);
    if (!splits) {
      allEdges.push(edges[ei]);
      continue;
    }
    splitEdgeIntoChain(graph, edges[ei], splits, allEdges);
  }
  reattachEdges(graph, allEdges);
}
function intersectEdges(graph, tolerance) {
  const EPS3 = 1e-3;
  const edges = graph.getUniqueEdges();
  for (const h of edges) graph.detach(h);
  for (const v of graph.vertices) v.edge = null;
  const edgeSplits = /* @__PURE__ */ new Map();
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const h1 = edges[i];
      const h2 = edges[j];
      if (h1.origin === h2.origin || h1.origin === h2.destination || h1.destination === h2.origin || h1.destination === h2.destination) continue;
      const result = Polygon2D.segmentIntersect2D(
        h1.origin.position,
        h1.destination.position,
        h2.origin.position,
        h2.destination.position
      );
      if (result && result.t > EPS3 && result.t < 1 - EPS3 && result.u > EPS3 && result.u < 1 - EPS3) {
        const v = graph.findClosestVertex(result.point, tolerance) ?? graph.addVertex(result.point);
        if (!edgeSplits.has(i)) edgeSplits.set(i, []);
        edgeSplits.get(i).push({ t: result.t, v });
        if (!edgeSplits.has(j)) edgeSplits.set(j, []);
        edgeSplits.get(j).push({ t: result.u, v });
      }
    }
  }
  const allEdges = [];
  for (let ei = 0; ei < edges.length; ei++) {
    const splits = edgeSplits.get(ei);
    if (!splits) {
      allEdges.push(edges[ei]);
      continue;
    }
    splitEdgeIntoChain(graph, edges[ei], splits, allEdges);
  }
  reattachEdges(graph, allEdges);
}
function splitEdgeIntoChain(graph, h, splits, output) {
  const origin = h.origin;
  const dest = h.destination;
  splits.sort((a, b) => a.t - b.t);
  for (let k = splits.length - 1; k > 0; k--) {
    if (splits[k].v === splits[k - 1].v) splits.splice(k, 1);
  }
  const filtered = splits.filter((s) => s.v !== origin && s.v !== dest);
  if (filtered.length === 0) {
    output.push(h);
    return;
  }
  h.twin.origin = filtered[0].v;
  output.push(h);
  for (let k = 0; k < filtered.length - 1; k++) {
    output.push(graph.createEdgePair(filtered[k].v, filtered[k + 1].v));
  }
  output.push(graph.createEdgePair(filtered[filtered.length - 1].v, dest));
}
function reattachEdges(graph, edges) {
  const valid = [];
  for (const h of edges) {
    if (h.origin === h.destination) continue;
    if (h.origin.isNeighbor(h.destination)) continue;
    graph.attach(h);
    valid.push(h);
  }
  graph.halfEdges.length = 0;
  for (const h of valid) {
    graph.halfEdges.push(h, h.twin);
  }
  const referenced = /* @__PURE__ */ new Set();
  for (const he of graph.halfEdges) {
    referenced.add(he.origin);
    referenced.add(he.destination);
  }
  for (let i = graph.vertices.length - 1; i >= 0; i--) {
    if (!referenced.has(graph.vertices[i])) graph.vertices.splice(i, 1);
  }
}
function projectOnSegment(p, a, b) {
  const ab = b.sub(a);
  const lenSq = ab.lenSq();
  if (lenSq < HMath.EPSILON) return 0;
  return p.sub(a).dot(ab) / lenSq;
}
var PlanarGraphCleanup = {
  /** Iteratively removes degree-1 vertices (dead ends). */
  removeDeadEnds(graph) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        const v = graph.vertices[i];
        if (v.degree === 1) {
          graph.removeEdge(v.edge);
          changed = true;
        }
      }
      graph.flushRemovals();
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
      }
    }
  },
  /** Dissolves degree-2 vertices with collinear edges. */
  removeLinearVertices(graph, angleTolerance = 0.01) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        const v = graph.vertices[i];
        if (v.degree !== 2) continue;
        const h1 = v.edge;
        const h2 = h1.nextAtOrigin;
        if (h2 === h1) continue;
        const d1 = h1.direction;
        const d2 = h2.direction;
        const cross = d1.x * d2.y - d1.y * d2.x;
        const dot = d1.dot(d2);
        const angle = Math.abs(Math.atan2(cross, dot));
        if (Math.abs(angle - Math.PI) < angleTolerance) {
          const a = h1.destination;
          const b = h2.destination;
          graph.removeEdge(h1);
          graph.removeEdge(h2);
          graph.vertices.splice(i, 1);
          if (!a.isNeighbor(b)) graph.addEdge(a, b);
          changed = true;
          break;
        }
      }
    }
  },
  /** Removes edges where both sides belong to the same face. */
  removeEdgesWithSameFace(graph) {
    const toRemove = [];
    for (const h of graph.getUniqueEdges()) {
      if (h.face !== null && h.twin.face !== null && h.face === h.twin.face)
        toRemove.push(h);
    }
    for (const h of toRemove) graph.removeEdge(h);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    if (toRemove.length > 0) graph.buildFaces();
  },
  /** Removes inner edges (both sides are bounded faces). */
  removeInnerEdges(graph) {
    const toRemove = [];
    for (const h of graph.getUniqueEdges()) {
      const leftBounded = h.face !== null && h.face.signedArea() > 0;
      const rightBounded = h.twin.face !== null && h.twin.face.signedArea() > 0;
      if (leftBounded && rightBounded) toRemove.push(h);
    }
    for (const h of toRemove) graph.removeEdge(h);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    if (toRemove.length > 0) graph.buildFaces();
  }
};
var DTriangle = class {
  constructor(v0, v1, v2) {
    this.children = [];
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
  }
};
var Delaunay2D = {
  /** Triangulates 2D points and returns a PlanarGraph with Delaunay faces. */
  triangulate(points) {
    if (points.length < 3) throw new Error("Need at least 3 points for triangulation.");
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const margin = Math.max(maxX - minX, maxY - minY) * 2 + 1;
    const cx = (minX + maxX) * 0.5, cy = (minY + maxY) * 0.5;
    const graph = new PlanarGraph();
    const sv0 = graph.addVertex(new Vec2(cx - margin, cy - margin));
    const sv1 = graph.addVertex(new Vec2(cx + margin, cy - margin));
    const sv2 = graph.addVertex(new Vec2(cx, cy + margin));
    graph.addEdge(sv0, sv1);
    graph.addEdge(sv1, sv2);
    graph.addEdge(sv2, sv0);
    const root = new DTriangle(sv0, sv1, sv2);
    for (const p of points) {
      const v = graph.addVertex(p);
      delaunayInsert(graph, v, root);
    }
    removeSuperTriangle(graph, sv0, sv1, sv2);
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      if (graph.vertices[i].isIsolated) graph.vertices.splice(i, 1);
    }
    repairConvexHull(graph);
    graph.buildFaces();
    return graph;
  }
};
function delaunayInsert(graph, v, root) {
  const tri = locateTriangle(root, v.position);
  if (!tri) return;
  const a = tri.v0, b = tri.v1, c = tri.v2;
  const edgeHit = onEdge(v.position, a.position, b.position, c.position);
  if (edgeHit < 0) {
    splitTriangle(graph, tri, v, root);
  } else {
    splitOnEdge(graph, tri, v, edgeHit, root);
  }
}
function splitTriangle(graph, tri, v, root) {
  const { v0: a, v1: b, v2: c } = tri;
  graph.addEdge(v, a);
  graph.addEdge(v, b);
  graph.addEdge(v, c);
  tri.children.push(new DTriangle(v, a, b), new DTriangle(v, b, c), new DTriangle(v, c, a));
  flipIfNeeded(graph, v, a, b, root);
  flipIfNeeded(graph, v, b, c, root);
  flipIfNeeded(graph, v, c, a, root);
}
function splitOnEdge(graph, tri, v, edgeHit, root) {
  let a = tri.v0, b = tri.v1, c = tri.v2;
  if (edgeHit === 1) {
    const tmp = a;
    a = b;
    b = c;
    c = tmp;
  } else if (edgeHit === 2) {
    const tmp = c;
    c = b;
    b = a;
    a = tmp;
  }
  let d = null;
  let opposite = null;
  const hab = a.getEdgeTo(b);
  if (hab) {
    const twin = hab.twin;
    let cur = twin.next;
    let safety = 0;
    while (cur !== twin && safety++ < 20) {
      if (cur.origin !== a && cur.origin !== b) {
        d = cur.origin;
        break;
      }
      cur = cur.next;
    }
    if (d) {
      const cx = (a.position.x + b.position.x + d.position.x) / 3;
      const cy = (a.position.y + b.position.y + d.position.y) / 3;
      opposite = locateTriangle(root, new Vec2(cx, cy));
    }
  }
  if (hab) graph.removeEdge(hab);
  graph.addEdge(v, a);
  graph.addEdge(v, b);
  graph.addEdge(v, c);
  tri.children.push(new DTriangle(v, a, c), new DTriangle(v, b, c));
  if (d) {
    graph.addEdge(v, d);
    const t3 = new DTriangle(v, a, d);
    const t4 = new DTriangle(v, b, d);
    if (opposite) {
      opposite.children.push(t3, t4);
    }
    flipIfNeeded(graph, v, a, d, root);
    flipIfNeeded(graph, v, d, b, root);
  }
  flipIfNeeded(graph, v, a, c, root);
  flipIfNeeded(graph, v, c, b, root);
}
function flipIfNeeded(graph, v, p1, p2, root) {
  const h = p1.getEdgeTo(p2);
  if (!h) return;
  const opp = findOppositeVertex(h, v);
  if (!opp) return;
  if (inCircumcircle(v.position, p1.position, p2.position, opp.position)) {
    const c1x = (v.position.x + p1.position.x + p2.position.x) / 3;
    const c1y = (v.position.y + p1.position.y + p2.position.y) / 3;
    const c2x = (opp.position.x + p1.position.x + p2.position.x) / 3;
    const c2y = (opp.position.y + p1.position.y + p2.position.y) / 3;
    const tri1 = locateTriangle(root, new Vec2(c1x, c1y));
    const tri2 = locateTriangle(root, new Vec2(c2x, c2y));
    graph.removeEdge(h);
    graph.addEdge(v, opp);
    const newT1 = new DTriangle(v, p1, opp);
    const newT2 = new DTriangle(v, opp, p2);
    if (tri1) {
      tri1.children.push(newT1, newT2);
    }
    if (tri2 && tri2 !== tri1) {
      tri2.children.push(newT1, newT2);
    }
    flipIfNeeded(graph, v, p1, opp, root);
    flipIfNeeded(graph, v, opp, p2, root);
  }
}
function findOppositeVertex(h, exclude) {
  const twin = h.twin;
  let cur = twin.next;
  let safety = 0;
  while (cur !== twin && safety++ < 20) {
    if (cur.origin !== h.origin && cur.origin !== h.destination && cur.origin !== exclude)
      return cur.origin;
    cur = cur.next;
  }
  return null;
}
function inCircumcircle(a, b, c, d) {
  const ax = a.x - d.x, ay = a.y - d.y;
  const bx = b.x - d.x, by = b.y - d.y;
  const cx2 = c.x - d.x, cy = c.y - d.y;
  const aSq = ax * ax + ay * ay;
  const bSq = bx * bx + by * by;
  const cSq = cx2 * cx2 + cy * cy;
  const det = ax * (by * cSq - cy * bSq) - bx * (ay * cSq - cy * aSq) + cx2 * (ay * bSq - by * aSq);
  const orient = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return orient > 0 ? det > 0 : det < 0;
}
function locateTriangle(node, p) {
  if (node.children.length === 0)
    return containsPoint(node, p) ? node : null;
  for (const child of node.children) {
    if (containsPoint(child, p)) {
      const result = locateTriangle(child, p);
      if (result) return result;
    }
  }
  return locateTriangleBrute(node, p);
}
function locateTriangleBrute(node, p) {
  if (node.children.length === 0)
    return containsPointRelaxed(node, p) ? node : null;
  for (const child of node.children) {
    const result = locateTriangleBrute(child, p);
    if (result) return result;
  }
  return null;
}
function containsPoint(tri, p) {
  const d1 = triSign(p, tri.v0.position, tri.v1.position);
  const d2 = triSign(p, tri.v1.position, tri.v2.position);
  const d3 = triSign(p, tri.v2.position, tri.v0.position);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function containsPointRelaxed(tri, p) {
  const EPS3 = 1e-10;
  const d1 = triSign(p, tri.v0.position, tri.v1.position);
  const d2 = triSign(p, tri.v1.position, tri.v2.position);
  const d3 = triSign(p, tri.v2.position, tri.v0.position);
  const hasNeg = d1 < -EPS3 || d2 < -EPS3 || d3 < -EPS3;
  const hasPos = d1 > EPS3 || d2 > EPS3 || d3 > EPS3;
  return !(hasNeg && hasPos);
}
function triSign(p, a, b) {
  return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
}
function onEdge(p, a, b, c) {
  const EPS3 = 1e-6;
  if (Math.abs(triSign(p, a, b)) < EPS3) return 0;
  if (Math.abs(triSign(p, b, c)) < EPS3) return 1;
  if (Math.abs(triSign(p, c, a)) < EPS3) return 2;
  return -1;
}
function removeSuperTriangle(graph, sv0, sv1, sv2) {
  const superVerts = /* @__PURE__ */ new Set([sv0, sv1, sv2]);
  const toRemove = [];
  for (const h of graph.getUniqueEdges()) {
    if (superVerts.has(h.origin) || superVerts.has(h.destination))
      toRemove.push(h);
  }
  for (const h of toRemove) graph.removeEdge(h);
  for (let i = graph.vertices.length - 1; i >= 0; i--) {
    if (superVerts.has(graph.vertices[i])) graph.vertices.splice(i, 1);
  }
}
function repairConvexHull(graph) {
  for (let iter = 0; iter < 1e3; iter++) {
    graph.buildFaces();
    const extFace = graph.faces.find((f2) => f2.signedArea() < 0);
    if (!extFace) return;
    const edges = [];
    for (const he of extFace.edges()) edges.push(he);
    let foundConcavity = false;
    for (let i = 0; i < edges.length; i++) {
      const cur = edges[i];
      const nxt = edges[(i + 1) % edges.length];
      const d1 = cur.direction;
      const d2 = nxt.direction;
      const cross = d1.x * d2.y - d1.y * d2.x;
      if (cross > 1e-9) {
        graph.addEdge(cur.origin, nxt.destination);
        foundConcavity = true;
        break;
      }
    }
    if (!foundConcavity) break;
  }
}

// src/core/voxel/index.ts
function gaussianKernel(radius) {
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);
  const sigma = radius / 3;
  const s2 = 2 * sigma * sigma;
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / s2);
    sum += kernel[i];
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}
var VoxelGrid2D = class _VoxelGrid2D {
  constructor(nx, ny, cellSize = 1, x1 = 0, y1 = 0) {
    this.nx = nx;
    this.ny = ny;
    this.cellSize = cellSize;
    this.x1 = x1;
    this.y1 = y1;
    this.values = new Float32Array(nx * ny);
  }
  static fromBounds(min, max, cellSize) {
    const nx = Math.floor((max.x - min.x) / cellSize) + 2;
    const ny = Math.floor((max.y - min.y) / cellSize) + 2;
    return new _VoxelGrid2D(nx, ny, cellSize, min.x - cellSize, min.y - cellSize);
  }
  static fromResolution(min, max, resolution) {
    const cs = Math.max(max.x - min.x, max.y - min.y) / (resolution - 1);
    return _VoxelGrid2D.fromBounds(min, max, cs);
  }
  // ── Indexing ──
  getIndex(x, y) {
    return x * this.ny + y;
  }
  get(x, y) {
    if (x < 0 || x >= this.nx || y < 0 || y >= this.ny) return Infinity;
    return this.values[x * this.ny + y];
  }
  set(x, y, value) {
    if (x >= 0 && x < this.nx && y >= 0 && y < this.ny)
      this.values[x * this.ny + y] = value;
  }
  getPosition(x, y) {
    return new Vec2(this.x1 + x * this.cellSize, this.y1 + y * this.cellSize);
  }
  getVoxelCoord(worldPos) {
    return {
      x: Math.round((worldPos.x - this.x1) / this.cellSize),
      y: Math.round((worldPos.y - this.y1) / this.cellSize)
    };
  }
  // ── Fill ──
  fillFromFunction(fn) {
    for (let x = 0; x < this.nx; x++) {
      const xc = this.x1 + x * this.cellSize;
      for (let y = 0; y < this.ny; y++) {
        const yc = this.y1 + y * this.cellSize;
        this.values[x * this.ny + y] = fn(new Vec2(xc, yc));
      }
    }
  }
  clear(value = Infinity) {
    this.values.fill(value);
  }
  // ── Scalar offset ──
  offset(amount) {
    for (let i = 0; i < this.values.length; i++)
      this.values[i] += amount;
  }
  // ── Gaussian blur (separable 2-pass) ──
  blur(radius) {
    if (radius <= 0) return;
    const kernel = gaussianKernel(radius);
    const kSize = kernel.length;
    const { nx, ny, values } = this;
    const temp = new Float32Array(values.length);
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        let v = 0, wSum = 0;
        for (let k = 0; k < kSize; k++) {
          const cx = x + k - radius;
          if (cx >= 0 && cx < nx) {
            v += values[cx * ny + y] * kernel[k];
            wSum += kernel[k];
          }
        }
        temp[x * ny + y] = v / wSum;
      }
    }
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        let v = 0, wSum = 0;
        for (let k = 0; k < kSize; k++) {
          const cy = y + k - radius;
          if (cy >= 0 && cy < ny) {
            v += temp[x * ny + cy] * kernel[k];
            wSum += kernel[k];
          }
        }
        values[x * ny + y] = v / wSum;
      }
    }
  }
  // ── Utilities ──
  getRange() {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] < min) min = this.values[i];
      if (this.values[i] > max) max = this.values[i];
    }
    return { min, max };
  }
  clone() {
    const copy = new _VoxelGrid2D(this.nx, this.ny, this.cellSize, this.x1, this.y1);
    copy.values.set(this.values);
    return copy;
  }
};
var VoxelGrid = class _VoxelGrid {
  constructor(nx, ny, nz, cellSize = 1, x1 = 0, y1 = 0, z1 = 0) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.cellSize = cellSize;
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
    this.values = new Float32Array(nx * ny * nz);
  }
  static fromBounds(min, max, cellSize) {
    const nx = Math.floor((max.x - min.x) / cellSize) + 2;
    const ny = Math.floor((max.y - min.y) / cellSize) + 2;
    const nz = Math.floor((max.z - min.z) / cellSize) + 2;
    return new _VoxelGrid(
      nx,
      ny,
      nz,
      cellSize,
      min.x - cellSize,
      min.y - cellSize,
      min.z - cellSize
    );
  }
  static fromResolution(min, max, resolution) {
    const cs = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) / (resolution - 1);
    return _VoxelGrid.fromBounds(min, max, cs);
  }
  // ── Indexing ──
  getIndex(x, y, z) {
    return x * this.ny * this.nz + y * this.nz + z;
  }
  get(x, y, z) {
    if (x < 0 || x >= this.nx || y < 0 || y >= this.ny || z < 0 || z >= this.nz) return Infinity;
    return this.values[this.getIndex(x, y, z)];
  }
  set(x, y, z, value) {
    if (x >= 0 && x < this.nx && y >= 0 && y < this.ny && z >= 0 && z < this.nz)
      this.values[this.getIndex(x, y, z)] = value;
  }
  getPosition(x, y, z) {
    return new Vec3(
      this.x1 + x * this.cellSize,
      this.y1 + y * this.cellSize,
      this.z1 + z * this.cellSize
    );
  }
  getVoxelCoord(worldPos) {
    return {
      x: Math.round((worldPos.x - this.x1) / this.cellSize),
      y: Math.round((worldPos.y - this.y1) / this.cellSize),
      z: Math.round((worldPos.z - this.z1) / this.cellSize)
    };
  }
  // ── Fill ──
  fillFromSdf(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          values[x * nyz + y * nz + z] = sdf.distance(new Vec3(xc, yc, z1 + z * cellSize));
        }
      }
    }
  }
  fillFromFunction(fn) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          values[x * nyz + y * nz + z] = fn(new Vec3(xc, yc, z1 + z * cellSize));
        }
      }
    }
  }
  clear(value = Infinity) {
    this.values.fill(value);
  }
  // ── Boolean ops (modify in place) ──
  union(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.min(values[idx], sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }
  subtract(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.max(values[idx], -sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }
  intersect(sdf) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.max(values[idx], sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }
  // ── Scalar offset ──
  offset(amount) {
    for (let i = 0; i < this.values.length; i++)
      this.values[i] += amount;
  }
  // ── Gaussian blur (separable 3-pass) ──
  blur(radius) {
    if (radius <= 0) return;
    const kernel = gaussianKernel(radius);
    const kSize = kernel.length;
    const { nx, ny, nz, values } = this;
    const nyz = ny * nz;
    const temp = new Float32Array(values.length);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cx = x + k - radius;
            if (cx >= 0 && cx < nx) {
              v += values[cx * nyz + y * nz + z] * kernel[k];
              wSum += kernel[k];
            }
          }
          temp[x * nyz + y * nz + z] = v / wSum;
        }
    const temp2 = new Float32Array(values.length);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cy = y + k - radius;
            if (cy >= 0 && cy < ny) {
              v += temp[x * nyz + cy * nz + z] * kernel[k];
              wSum += kernel[k];
            }
          }
          temp2[x * nyz + y * nz + z] = v / wSum;
        }
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cz = z + k - radius;
            if (cz >= 0 && cz < nz) {
              v += temp2[x * nyz + y * nz + cz] * kernel[k];
              wSum += kernel[k];
            }
          }
          values[x * nyz + y * nz + z] = v / wSum;
        }
  }
  // ── Utilities ──
  getRange() {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] < min) min = this.values[i];
      if (this.values[i] > max) max = this.values[i];
    }
    return { min, max };
  }
  clone() {
    const copy = new _VoxelGrid(
      this.nx,
      this.ny,
      this.nz,
      this.cellSize,
      this.x1,
      this.y1,
      this.z1
    );
    copy.values.set(this.values);
    return copy;
  }
};
var MarchingSquares = {
  extract(values, nx, ny, iso = 0, cellSize = 1, originX = 0, originY = 0) {
    const segments = [];
    const n = new Float32Array(4);
    for (let x = 0; x < nx - 1; x++) {
      for (let y = 0; y < ny - 1; y++) {
        n[0] = values[x * ny + y];
        n[1] = values[(x + 1) * ny + y];
        n[2] = values[(x + 1) * ny + y + 1];
        n[3] = values[x * ny + y + 1];
        let caseNum = 0;
        for (let i = 3; i >= 0; i--) {
          if (n[i] > iso) caseNum++;
          if (i > 0) caseNum <<= 1;
        }
        const x1 = originX + x * cellSize;
        const y1 = originY + y * cellSize;
        const x2 = x1 + cellSize;
        const y2 = y1 + cellSize;
        const offset = caseNum * 4;
        for (let i = offset; i < offset + 4; i += 2) {
          const e1 = MS_EDGE_TABLE[i];
          const e2 = MS_EDGE_TABLE[i + 1];
          if (e1 < 0 || e2 < 0) break;
          segments.push({
            a: msEdgePoint(e1, n, x1, y1, x2, y2, iso, cellSize),
            b: msEdgePoint(e2, n, x1, y1, x2, y2, iso, cellSize)
          });
        }
      }
    }
    return segments;
  },
  extractFromGrid(grid, iso = 0) {
    return MarchingSquares.extract(
      grid.values,
      grid.nx,
      grid.ny,
      iso,
      grid.cellSize,
      grid.x1,
      grid.y1
    );
  }
};
function msInterp(v1, v2, iso) {
  const denom = v2 - v1;
  if (Math.abs(denom) < 1e-10) return 0;
  return (iso - v1) / denom;
}
function msEdgePoint(edge, n, x1, y1, x2, y2, iso, cellSize) {
  switch (edge) {
    case 0:
      return new Vec2(x1 + msInterp(n[0], n[1], iso) * cellSize, y1);
    case 1:
      return new Vec2(x2, y1 + msInterp(n[1], n[2], iso) * cellSize);
    case 2:
      return new Vec2(x1 + msInterp(n[3], n[2], iso) * cellSize, y2);
    case 3:
      return new Vec2(x1, y1 + msInterp(n[0], n[3], iso) * cellSize);
    default:
      return new Vec2(x1, y1);
  }
}
var MS_EDGE_TABLE = new Int8Array([
  -1,
  -1,
  -1,
  -1,
  0,
  3,
  -1,
  -1,
  1,
  0,
  -1,
  -1,
  1,
  3,
  -1,
  -1,
  2,
  1,
  -1,
  -1,
  0,
  1,
  2,
  3,
  2,
  0,
  -1,
  -1,
  2,
  3,
  -1,
  -1,
  3,
  2,
  -1,
  -1,
  0,
  2,
  -1,
  -1,
  1,
  0,
  3,
  2,
  1,
  2,
  -1,
  -1,
  3,
  1,
  -1,
  -1,
  0,
  1,
  -1,
  -1,
  3,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1
]);
var MarchingCubes = {
  extract(grid, iso = 0) {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = grid;
    const nyz = ny * nz;
    const n = new Float32Array(8);
    const positions = [];
    const indices = [];
    const vertMap = /* @__PURE__ */ new Map();
    function addVertex(vx, vy, vz) {
      const qx = Math.round(vx * 1e4);
      const qy = Math.round(vy * 1e4);
      const qz = Math.round(vz * 1e4);
      const key = `${qx},${qy},${qz}`;
      let idx = vertMap.get(key);
      if (idx !== void 0) return idx;
      idx = positions.length;
      positions.push(new Vec3(vx, vy, vz));
      vertMap.set(key, idx);
      return idx;
    }
    for (let x = 0; x < nx - 1; x++) {
      for (let y = 0; y < ny - 1; y++) {
        for (let z = 0; z < nz - 1; z++) {
          const idx = x * nyz + y * nz + z;
          n[0] = values[idx + nz];
          n[1] = values[idx + nyz + nz];
          n[2] = values[idx + nyz];
          n[3] = values[idx];
          n[4] = values[idx + nz + 1];
          n[5] = values[idx + nyz + nz + 1];
          n[6] = values[idx + nyz + 1];
          n[7] = values[idx + 1];
          let caseNum = 0;
          for (let i = 7; i >= 0; i--) {
            if (n[i] > iso) caseNum++;
            if (i > 0) caseNum <<= 1;
          }
          const offset = caseNum * 15;
          for (let i = offset; i < offset + 15; i += 3) {
            if (MC_TRI_TABLE[i] < 0) break;
            for (let j = i; j < i + 3; j++) {
              let vx, vy, vz;
              switch (MC_TRI_TABLE[j]) {
                case 0:
                  vx = x + mcInterp(n[0], n[1], iso);
                  vy = y + 1;
                  vz = z;
                  break;
                case 1:
                  vx = x + 1;
                  vy = y + mcInterp(n[2], n[1], iso);
                  vz = z;
                  break;
                case 2:
                  vx = x + mcInterp(n[3], n[2], iso);
                  vy = y;
                  vz = z;
                  break;
                case 3:
                  vx = x;
                  vy = y + mcInterp(n[3], n[0], iso);
                  vz = z;
                  break;
                case 4:
                  vx = x + mcInterp(n[4], n[5], iso);
                  vy = y + 1;
                  vz = z + 1;
                  break;
                case 5:
                  vx = x + 1;
                  vy = y + mcInterp(n[6], n[5], iso);
                  vz = z + 1;
                  break;
                case 6:
                  vx = x + mcInterp(n[7], n[6], iso);
                  vy = y;
                  vz = z + 1;
                  break;
                case 7:
                  vx = x;
                  vy = y + mcInterp(n[7], n[4], iso);
                  vz = z + 1;
                  break;
                case 8:
                  vx = x;
                  vy = y + 1;
                  vz = z + mcInterp(n[0], n[4], iso);
                  break;
                case 9:
                  vx = x + 1;
                  vy = y + 1;
                  vz = z + mcInterp(n[1], n[5], iso);
                  break;
                case 10:
                  vx = x;
                  vy = y;
                  vz = z + mcInterp(n[3], n[7], iso);
                  break;
                case 11:
                  vx = x + 1;
                  vy = y;
                  vz = z + mcInterp(n[2], n[6], iso);
                  break;
                default:
                  vx = x;
                  vy = y;
                  vz = z;
                  break;
              }
              indices.push(addVertex(
                x1 + vx * cellSize,
                y1 + vy * cellSize,
                z1 + vz * cellSize
              ));
            }
          }
        }
      }
    }
    return ConnectedMesh.fromIndexedTriangles(positions, indices);
  }
};
function mcInterp(v1, v2, iso) {
  const denom = v2 - v1;
  if (Math.abs(denom) < 1e-10) return 0;
  return (iso - v1) / denom;
}
var MC_TRI_TABLE = new Int8Array([
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  8,
  3,
  9,
  8,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  1,
  2,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  2,
  11,
  0,
  2,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  8,
  3,
  2,
  11,
  8,
  11,
  9,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  10,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  10,
  2,
  8,
  10,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  9,
  0,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  10,
  2,
  1,
  9,
  10,
  9,
  8,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  11,
  1,
  10,
  11,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  11,
  1,
  0,
  8,
  11,
  8,
  10,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  9,
  0,
  3,
  10,
  9,
  10,
  11,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  8,
  11,
  11,
  8,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  7,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  3,
  0,
  7,
  3,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  1,
  9,
  4,
  7,
  1,
  7,
  3,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  4,
  7,
  3,
  0,
  4,
  1,
  2,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  2,
  11,
  9,
  0,
  2,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  11,
  9,
  2,
  9,
  7,
  2,
  7,
  3,
  7,
  9,
  4,
  -1,
  -1,
  -1,
  8,
  4,
  7,
  3,
  10,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  4,
  7,
  10,
  2,
  4,
  2,
  0,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  0,
  1,
  8,
  4,
  7,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  7,
  10,
  9,
  4,
  10,
  9,
  10,
  2,
  9,
  2,
  1,
  -1,
  -1,
  -1,
  3,
  11,
  1,
  3,
  10,
  11,
  7,
  8,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  10,
  11,
  1,
  4,
  10,
  1,
  0,
  4,
  7,
  10,
  4,
  -1,
  -1,
  -1,
  4,
  7,
  8,
  9,
  0,
  10,
  9,
  10,
  11,
  10,
  0,
  3,
  -1,
  -1,
  -1,
  4,
  7,
  10,
  4,
  10,
  9,
  9,
  10,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  0,
  8,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  5,
  4,
  1,
  5,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  5,
  4,
  8,
  3,
  5,
  3,
  1,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  9,
  5,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  8,
  1,
  2,
  11,
  4,
  9,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  2,
  11,
  5,
  4,
  2,
  4,
  0,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  11,
  5,
  3,
  2,
  5,
  3,
  5,
  4,
  3,
  4,
  8,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  10,
  2,
  0,
  8,
  10,
  4,
  9,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  5,
  4,
  0,
  1,
  5,
  2,
  3,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  1,
  5,
  2,
  5,
  8,
  2,
  8,
  10,
  4,
  8,
  5,
  -1,
  -1,
  -1,
  11,
  3,
  10,
  11,
  1,
  3,
  9,
  5,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  5,
  0,
  8,
  1,
  8,
  11,
  1,
  8,
  10,
  11,
  -1,
  -1,
  -1,
  5,
  4,
  0,
  5,
  0,
  10,
  5,
  10,
  11,
  10,
  0,
  3,
  -1,
  -1,
  -1,
  5,
  4,
  8,
  5,
  8,
  11,
  11,
  8,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  7,
  8,
  5,
  7,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  3,
  0,
  9,
  5,
  3,
  5,
  7,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  7,
  8,
  0,
  1,
  7,
  1,
  5,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  5,
  3,
  3,
  5,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  7,
  8,
  9,
  5,
  7,
  11,
  1,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  1,
  2,
  9,
  5,
  0,
  5,
  3,
  0,
  5,
  7,
  3,
  -1,
  -1,
  -1,
  8,
  0,
  2,
  8,
  2,
  5,
  8,
  5,
  7,
  11,
  5,
  2,
  -1,
  -1,
  -1,
  2,
  11,
  5,
  2,
  5,
  3,
  3,
  5,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  9,
  5,
  7,
  8,
  9,
  3,
  10,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  7,
  9,
  7,
  2,
  9,
  2,
  0,
  2,
  7,
  10,
  -1,
  -1,
  -1,
  2,
  3,
  10,
  0,
  1,
  8,
  1,
  7,
  8,
  1,
  5,
  7,
  -1,
  -1,
  -1,
  10,
  2,
  1,
  10,
  1,
  7,
  7,
  1,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  8,
  8,
  5,
  7,
  11,
  1,
  3,
  11,
  3,
  10,
  -1,
  -1,
  -1,
  5,
  7,
  0,
  5,
  0,
  9,
  7,
  10,
  0,
  1,
  0,
  11,
  10,
  11,
  0,
  10,
  11,
  0,
  10,
  0,
  3,
  11,
  5,
  0,
  8,
  0,
  7,
  5,
  7,
  0,
  10,
  11,
  5,
  7,
  10,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  0,
  1,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  8,
  3,
  1,
  9,
  8,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  6,
  5,
  2,
  6,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  6,
  5,
  1,
  2,
  6,
  3,
  0,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  6,
  5,
  9,
  0,
  6,
  0,
  2,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  9,
  8,
  5,
  8,
  2,
  5,
  2,
  6,
  3,
  2,
  8,
  -1,
  -1,
  -1,
  2,
  3,
  10,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  0,
  8,
  10,
  2,
  0,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  2,
  3,
  10,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  11,
  6,
  1,
  9,
  2,
  9,
  10,
  2,
  9,
  8,
  10,
  -1,
  -1,
  -1,
  6,
  3,
  10,
  6,
  5,
  3,
  5,
  1,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  10,
  0,
  10,
  5,
  0,
  5,
  1,
  5,
  10,
  6,
  -1,
  -1,
  -1,
  3,
  10,
  6,
  0,
  3,
  6,
  0,
  6,
  5,
  0,
  5,
  9,
  -1,
  -1,
  -1,
  6,
  5,
  9,
  6,
  9,
  10,
  10,
  9,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  11,
  6,
  4,
  7,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  3,
  0,
  4,
  7,
  3,
  6,
  5,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  9,
  0,
  5,
  11,
  6,
  8,
  4,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  6,
  5,
  1,
  9,
  7,
  1,
  7,
  3,
  7,
  9,
  4,
  -1,
  -1,
  -1,
  6,
  1,
  2,
  6,
  5,
  1,
  4,
  7,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  5,
  5,
  2,
  6,
  3,
  0,
  4,
  3,
  4,
  7,
  -1,
  -1,
  -1,
  8,
  4,
  7,
  9,
  0,
  5,
  0,
  6,
  5,
  0,
  2,
  6,
  -1,
  -1,
  -1,
  7,
  3,
  9,
  7,
  9,
  4,
  3,
  2,
  9,
  5,
  9,
  6,
  2,
  6,
  9,
  3,
  10,
  2,
  7,
  8,
  4,
  11,
  6,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  11,
  6,
  4,
  7,
  2,
  4,
  2,
  0,
  2,
  7,
  10,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  4,
  7,
  8,
  2,
  3,
  10,
  5,
  11,
  6,
  -1,
  -1,
  -1,
  9,
  2,
  1,
  9,
  10,
  2,
  9,
  4,
  10,
  7,
  10,
  4,
  5,
  11,
  6,
  8,
  4,
  7,
  3,
  10,
  5,
  3,
  5,
  1,
  5,
  10,
  6,
  -1,
  -1,
  -1,
  5,
  1,
  10,
  5,
  10,
  6,
  1,
  0,
  10,
  7,
  10,
  4,
  0,
  4,
  10,
  0,
  5,
  9,
  0,
  6,
  5,
  0,
  3,
  6,
  10,
  6,
  3,
  8,
  4,
  7,
  6,
  5,
  9,
  6,
  9,
  10,
  4,
  7,
  9,
  7,
  10,
  9,
  -1,
  -1,
  -1,
  11,
  4,
  9,
  6,
  4,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  11,
  6,
  4,
  9,
  11,
  0,
  8,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  0,
  1,
  11,
  6,
  0,
  6,
  4,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  3,
  1,
  8,
  1,
  6,
  8,
  6,
  4,
  6,
  1,
  11,
  -1,
  -1,
  -1,
  1,
  4,
  9,
  1,
  2,
  4,
  2,
  6,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  8,
  1,
  2,
  9,
  2,
  4,
  9,
  2,
  6,
  4,
  -1,
  -1,
  -1,
  0,
  2,
  4,
  4,
  2,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  3,
  2,
  8,
  2,
  4,
  4,
  2,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  4,
  9,
  11,
  6,
  4,
  10,
  2,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  2,
  2,
  8,
  10,
  4,
  9,
  11,
  4,
  11,
  6,
  -1,
  -1,
  -1,
  3,
  10,
  2,
  0,
  1,
  6,
  0,
  6,
  4,
  6,
  1,
  11,
  -1,
  -1,
  -1,
  6,
  4,
  1,
  6,
  1,
  11,
  4,
  8,
  1,
  2,
  1,
  10,
  8,
  10,
  1,
  9,
  6,
  4,
  9,
  3,
  6,
  9,
  1,
  3,
  10,
  6,
  3,
  -1,
  -1,
  -1,
  8,
  10,
  1,
  8,
  1,
  0,
  10,
  6,
  1,
  9,
  1,
  4,
  6,
  4,
  1,
  3,
  10,
  6,
  3,
  6,
  0,
  0,
  6,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  4,
  8,
  10,
  6,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  11,
  6,
  7,
  8,
  11,
  8,
  9,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  7,
  3,
  0,
  11,
  7,
  0,
  9,
  11,
  6,
  7,
  11,
  -1,
  -1,
  -1,
  11,
  6,
  7,
  1,
  11,
  7,
  1,
  7,
  8,
  1,
  8,
  0,
  -1,
  -1,
  -1,
  11,
  6,
  7,
  11,
  7,
  1,
  1,
  7,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  6,
  1,
  6,
  8,
  1,
  8,
  9,
  8,
  6,
  7,
  -1,
  -1,
  -1,
  2,
  6,
  9,
  2,
  9,
  1,
  6,
  7,
  9,
  0,
  9,
  3,
  7,
  3,
  9,
  7,
  8,
  0,
  7,
  0,
  6,
  6,
  0,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  3,
  2,
  6,
  7,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  10,
  11,
  6,
  8,
  11,
  8,
  9,
  8,
  6,
  7,
  -1,
  -1,
  -1,
  2,
  0,
  7,
  2,
  7,
  10,
  0,
  9,
  7,
  6,
  7,
  11,
  9,
  11,
  7,
  1,
  8,
  0,
  1,
  7,
  8,
  1,
  11,
  7,
  6,
  7,
  11,
  2,
  3,
  10,
  10,
  2,
  1,
  10,
  1,
  7,
  11,
  6,
  1,
  6,
  7,
  1,
  -1,
  -1,
  -1,
  8,
  9,
  6,
  8,
  6,
  7,
  9,
  1,
  6,
  10,
  6,
  3,
  1,
  3,
  6,
  0,
  9,
  1,
  10,
  6,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  8,
  0,
  7,
  0,
  6,
  3,
  10,
  0,
  10,
  6,
  0,
  -1,
  -1,
  -1,
  7,
  10,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  8,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  1,
  9,
  8,
  3,
  1,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  1,
  2,
  6,
  10,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  3,
  0,
  8,
  6,
  10,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  9,
  0,
  2,
  11,
  9,
  6,
  10,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  10,
  7,
  2,
  11,
  3,
  11,
  8,
  3,
  11,
  9,
  8,
  -1,
  -1,
  -1,
  7,
  2,
  3,
  6,
  2,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  7,
  0,
  8,
  7,
  6,
  0,
  6,
  2,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  7,
  6,
  2,
  3,
  7,
  0,
  1,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  6,
  2,
  1,
  8,
  6,
  1,
  9,
  8,
  8,
  7,
  6,
  -1,
  -1,
  -1,
  11,
  7,
  6,
  11,
  1,
  7,
  1,
  3,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  7,
  6,
  1,
  7,
  11,
  1,
  8,
  7,
  1,
  0,
  8,
  -1,
  -1,
  -1,
  0,
  3,
  7,
  0,
  7,
  11,
  0,
  11,
  9,
  6,
  11,
  7,
  -1,
  -1,
  -1,
  7,
  6,
  11,
  7,
  11,
  8,
  8,
  11,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  8,
  4,
  10,
  8,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  6,
  10,
  3,
  0,
  6,
  0,
  4,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  6,
  10,
  8,
  4,
  6,
  9,
  0,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  4,
  6,
  9,
  6,
  3,
  9,
  3,
  1,
  10,
  3,
  6,
  -1,
  -1,
  -1,
  6,
  8,
  4,
  6,
  10,
  8,
  2,
  11,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  3,
  0,
  10,
  0,
  6,
  10,
  0,
  4,
  6,
  -1,
  -1,
  -1,
  4,
  10,
  8,
  4,
  6,
  10,
  0,
  2,
  9,
  2,
  11,
  9,
  -1,
  -1,
  -1,
  11,
  9,
  3,
  11,
  3,
  2,
  9,
  4,
  3,
  10,
  3,
  6,
  4,
  6,
  3,
  8,
  2,
  3,
  8,
  4,
  2,
  4,
  6,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  4,
  2,
  4,
  6,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  9,
  0,
  2,
  3,
  4,
  2,
  4,
  6,
  4,
  3,
  8,
  -1,
  -1,
  -1,
  1,
  9,
  4,
  1,
  4,
  2,
  2,
  4,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  1,
  3,
  8,
  6,
  1,
  8,
  4,
  6,
  6,
  11,
  1,
  -1,
  -1,
  -1,
  11,
  1,
  0,
  11,
  0,
  6,
  6,
  0,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  6,
  3,
  4,
  3,
  8,
  6,
  11,
  3,
  0,
  3,
  9,
  11,
  9,
  3,
  11,
  9,
  4,
  6,
  11,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  5,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  4,
  9,
  5,
  10,
  7,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  0,
  1,
  5,
  4,
  0,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  7,
  6,
  8,
  3,
  4,
  3,
  5,
  4,
  3,
  1,
  5,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  11,
  1,
  2,
  7,
  6,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  6,
  10,
  7,
  1,
  2,
  11,
  0,
  8,
  3,
  4,
  9,
  5,
  -1,
  -1,
  -1,
  7,
  6,
  10,
  5,
  4,
  11,
  4,
  2,
  11,
  4,
  0,
  2,
  -1,
  -1,
  -1,
  3,
  4,
  8,
  3,
  5,
  4,
  3,
  2,
  5,
  11,
  5,
  2,
  10,
  7,
  6,
  7,
  2,
  3,
  7,
  6,
  2,
  5,
  4,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  5,
  4,
  0,
  8,
  6,
  0,
  6,
  2,
  6,
  8,
  7,
  -1,
  -1,
  -1,
  3,
  6,
  2,
  3,
  7,
  6,
  1,
  5,
  0,
  5,
  4,
  0,
  -1,
  -1,
  -1,
  6,
  2,
  8,
  6,
  8,
  7,
  2,
  1,
  8,
  4,
  8,
  5,
  1,
  5,
  8,
  9,
  5,
  4,
  11,
  1,
  6,
  1,
  7,
  6,
  1,
  3,
  7,
  -1,
  -1,
  -1,
  1,
  6,
  11,
  1,
  7,
  6,
  1,
  0,
  7,
  8,
  7,
  0,
  9,
  5,
  4,
  4,
  0,
  11,
  4,
  11,
  5,
  0,
  3,
  11,
  6,
  11,
  7,
  3,
  7,
  11,
  7,
  6,
  11,
  7,
  11,
  8,
  5,
  4,
  11,
  4,
  8,
  11,
  -1,
  -1,
  -1,
  6,
  9,
  5,
  6,
  10,
  9,
  10,
  8,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  6,
  10,
  0,
  6,
  3,
  0,
  5,
  6,
  0,
  9,
  5,
  -1,
  -1,
  -1,
  0,
  10,
  8,
  0,
  5,
  10,
  0,
  1,
  5,
  5,
  6,
  10,
  -1,
  -1,
  -1,
  6,
  10,
  3,
  6,
  3,
  5,
  5,
  3,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  11,
  9,
  5,
  10,
  9,
  10,
  8,
  10,
  5,
  6,
  -1,
  -1,
  -1,
  0,
  10,
  3,
  0,
  6,
  10,
  0,
  9,
  6,
  5,
  6,
  9,
  1,
  2,
  11,
  10,
  8,
  5,
  10,
  5,
  6,
  8,
  0,
  5,
  11,
  5,
  2,
  0,
  2,
  5,
  6,
  10,
  3,
  6,
  3,
  5,
  2,
  11,
  3,
  11,
  5,
  3,
  -1,
  -1,
  -1,
  5,
  8,
  9,
  5,
  2,
  8,
  5,
  6,
  2,
  3,
  8,
  2,
  -1,
  -1,
  -1,
  9,
  5,
  6,
  9,
  6,
  0,
  0,
  6,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  5,
  8,
  1,
  8,
  0,
  5,
  6,
  8,
  3,
  8,
  2,
  6,
  2,
  8,
  1,
  5,
  6,
  2,
  1,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  3,
  6,
  1,
  6,
  11,
  3,
  8,
  6,
  5,
  6,
  9,
  8,
  9,
  6,
  11,
  1,
  0,
  11,
  0,
  6,
  9,
  5,
  0,
  5,
  6,
  0,
  -1,
  -1,
  -1,
  0,
  3,
  8,
  5,
  6,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  5,
  6,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  5,
  11,
  7,
  5,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  5,
  11,
  10,
  7,
  5,
  8,
  3,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  10,
  7,
  5,
  11,
  10,
  1,
  9,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  11,
  7,
  5,
  11,
  10,
  7,
  9,
  8,
  1,
  8,
  3,
  1,
  -1,
  -1,
  -1,
  10,
  1,
  2,
  10,
  7,
  1,
  7,
  5,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  1,
  2,
  7,
  1,
  7,
  5,
  7,
  2,
  10,
  -1,
  -1,
  -1,
  9,
  7,
  5,
  9,
  2,
  7,
  9,
  0,
  2,
  2,
  10,
  7,
  -1,
  -1,
  -1,
  7,
  5,
  2,
  7,
  2,
  10,
  5,
  9,
  2,
  3,
  2,
  8,
  9,
  8,
  2,
  2,
  5,
  11,
  2,
  3,
  5,
  3,
  7,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  2,
  0,
  8,
  5,
  2,
  8,
  7,
  5,
  11,
  2,
  5,
  -1,
  -1,
  -1,
  9,
  0,
  1,
  5,
  11,
  3,
  5,
  3,
  7,
  3,
  11,
  2,
  -1,
  -1,
  -1,
  9,
  8,
  2,
  9,
  2,
  1,
  8,
  7,
  2,
  11,
  2,
  5,
  7,
  5,
  2,
  1,
  3,
  5,
  3,
  7,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  7,
  0,
  7,
  1,
  1,
  7,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  0,
  3,
  9,
  3,
  5,
  5,
  3,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  8,
  7,
  5,
  9,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  8,
  4,
  5,
  11,
  8,
  11,
  10,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  5,
  0,
  4,
  5,
  10,
  0,
  5,
  11,
  10,
  10,
  3,
  0,
  -1,
  -1,
  -1,
  0,
  1,
  9,
  8,
  4,
  11,
  8,
  11,
  10,
  11,
  4,
  5,
  -1,
  -1,
  -1,
  11,
  10,
  4,
  11,
  4,
  5,
  10,
  3,
  4,
  9,
  4,
  1,
  3,
  1,
  4,
  2,
  5,
  1,
  2,
  8,
  5,
  2,
  10,
  8,
  4,
  5,
  8,
  -1,
  -1,
  -1,
  0,
  4,
  10,
  0,
  10,
  3,
  4,
  5,
  10,
  2,
  10,
  1,
  5,
  1,
  10,
  0,
  2,
  5,
  0,
  5,
  9,
  2,
  10,
  5,
  4,
  5,
  8,
  10,
  8,
  5,
  9,
  4,
  5,
  2,
  10,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  5,
  11,
  3,
  5,
  2,
  3,
  4,
  5,
  3,
  8,
  4,
  -1,
  -1,
  -1,
  5,
  11,
  2,
  5,
  2,
  4,
  4,
  2,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  11,
  2,
  3,
  5,
  11,
  3,
  8,
  5,
  4,
  5,
  8,
  0,
  1,
  9,
  5,
  11,
  2,
  5,
  2,
  4,
  1,
  9,
  2,
  9,
  4,
  2,
  -1,
  -1,
  -1,
  8,
  4,
  5,
  8,
  5,
  3,
  3,
  5,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  4,
  5,
  1,
  0,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  8,
  4,
  5,
  8,
  5,
  3,
  9,
  0,
  5,
  0,
  3,
  5,
  -1,
  -1,
  -1,
  9,
  4,
  5,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  10,
  7,
  4,
  9,
  10,
  9,
  11,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  8,
  3,
  4,
  9,
  7,
  9,
  10,
  7,
  9,
  11,
  10,
  -1,
  -1,
  -1,
  1,
  11,
  10,
  1,
  10,
  4,
  1,
  4,
  0,
  7,
  4,
  10,
  -1,
  -1,
  -1,
  3,
  1,
  4,
  3,
  4,
  8,
  1,
  11,
  4,
  7,
  4,
  10,
  11,
  10,
  4,
  4,
  10,
  7,
  9,
  10,
  4,
  9,
  2,
  10,
  9,
  1,
  2,
  -1,
  -1,
  -1,
  9,
  7,
  4,
  9,
  10,
  7,
  9,
  1,
  10,
  2,
  10,
  1,
  0,
  8,
  3,
  10,
  7,
  4,
  10,
  4,
  2,
  2,
  4,
  0,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  10,
  7,
  4,
  10,
  4,
  2,
  8,
  3,
  4,
  3,
  2,
  4,
  -1,
  -1,
  -1,
  2,
  9,
  11,
  2,
  7,
  9,
  2,
  3,
  7,
  7,
  4,
  9,
  -1,
  -1,
  -1,
  9,
  11,
  7,
  9,
  7,
  4,
  11,
  2,
  7,
  8,
  7,
  0,
  2,
  0,
  7,
  3,
  7,
  11,
  3,
  11,
  2,
  7,
  4,
  11,
  1,
  11,
  0,
  4,
  0,
  11,
  1,
  11,
  2,
  8,
  7,
  4,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  1,
  4,
  1,
  7,
  7,
  1,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  9,
  1,
  4,
  1,
  7,
  0,
  8,
  1,
  8,
  7,
  1,
  -1,
  -1,
  -1,
  4,
  0,
  3,
  7,
  4,
  3,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  4,
  8,
  7,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  11,
  8,
  11,
  10,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  9,
  3,
  9,
  10,
  10,
  9,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  11,
  0,
  11,
  8,
  8,
  11,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  1,
  11,
  10,
  3,
  11,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  2,
  10,
  1,
  10,
  9,
  9,
  10,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  0,
  9,
  3,
  9,
  10,
  1,
  2,
  9,
  2,
  10,
  9,
  -1,
  -1,
  -1,
  0,
  2,
  10,
  8,
  0,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  3,
  2,
  10,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  8,
  2,
  8,
  11,
  11,
  8,
  9,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  11,
  2,
  0,
  9,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  8,
  2,
  8,
  11,
  0,
  1,
  8,
  1,
  11,
  8,
  -1,
  -1,
  -1,
  1,
  11,
  2,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  3,
  8,
  9,
  1,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  9,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  3,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1
]);
function matchesSign(value, targetSign) {
  return targetSign > 0 ? value > 0 : value < 0;
}
var FloodFill = {
  fill2D(grid, seeds, targetSign = 1) {
    const { values, nx, ny } = grid;
    const visited = new Uint8Array(values.length);
    const queue = [];
    for (const { x: sx, y: sy } of seeds) {
      if (sx < 0 || sx >= nx || sy < 0 || sy >= ny) continue;
      const idx = sx * ny + sy;
      if (visited[idx]) continue;
      if (!matchesSign(values[idx], targetSign)) continue;
      visited[idx] = 1;
      values[idx] = -values[idx];
      queue.push(idx);
    }
    const dx = [-1, 1, 0, 0];
    const dy = [0, 0, -1, 1];
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = Math.floor(idx / ny);
      const y = idx % ny;
      for (let d = 0; d < 4; d++) {
        const nx2 = x + dx[d], ny2 = y + dy[d];
        if (nx2 < 0 || nx2 >= nx || ny2 < 0 || ny2 >= ny) continue;
        const nIdx = nx2 * ny + ny2;
        if (visited[nIdx]) continue;
        if (!matchesSign(values[nIdx], targetSign)) continue;
        visited[nIdx] = 1;
        values[nIdx] = -values[nIdx];
        queue.push(nIdx);
      }
    }
  },
  fill3D(grid, seeds, targetSign = 1) {
    const { values, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const visited = new Uint8Array(values.length);
    const queue = [];
    for (const { x: sx, y: sy, z: sz } of seeds) {
      if (sx < 0 || sx >= nx || sy < 0 || sy >= ny || sz < 0 || sz >= nz) continue;
      const idx = sx * nyz + sy * nz + sz;
      if (visited[idx]) continue;
      if (!matchesSign(values[idx], targetSign)) continue;
      visited[idx] = 1;
      values[idx] = -values[idx];
      queue.push(idx);
    }
    const ddx = [-1, 1, 0, 0, 0, 0];
    const ddy = [0, 0, -1, 1, 0, 0];
    const ddz = [0, 0, 0, 0, -1, 1];
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = Math.floor(idx / nyz);
      const rem = idx % nyz;
      const y = Math.floor(rem / nz);
      const z = rem % nz;
      for (let d = 0; d < 6; d++) {
        const nx2 = x + ddx[d], ny2 = y + ddy[d], nz2 = z + ddz[d];
        if (nx2 < 0 || nx2 >= nx || ny2 < 0 || ny2 >= ny || nz2 < 0 || nz2 >= nz) continue;
        const nIdx = nx2 * nyz + ny2 * nz + nz2;
        if (visited[nIdx]) continue;
        if (!matchesSign(values[nIdx], targetSign)) continue;
        visited[nIdx] = 1;
        values[nIdx] = -values[nIdx];
        queue.push(nIdx);
      }
    }
  }
};
var DistanceTransform = {
  compute2D(grid, d1 = 1, d2 = 1.414) {
    const { values: v, nx, ny } = grid;
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        let cur = v[idx];
        if (cur === 0) continue;
        if (x > 0) {
          const c = v[(x - 1) * ny + y] + d1;
          if (c < cur) cur = c;
        }
        if (y > 0) {
          const c = v[idx - 1] + d1;
          if (c < cur) cur = c;
        }
        if (x > 0 && y > 0) {
          const c = v[(x - 1) * ny + y - 1] + d2;
          if (c < cur) cur = c;
        }
        if (x < nx - 1 && y > 0) {
          const c = v[(x + 1) * ny + y - 1] + d2;
          if (c < cur) cur = c;
        }
        v[idx] = cur;
      }
    }
    for (let x = nx - 1; x >= 0; x--) {
      for (let y = ny - 1; y >= 0; y--) {
        const idx = x * ny + y;
        let cur = v[idx];
        if (cur === 0) continue;
        if (x < nx - 1) {
          const c = v[(x + 1) * ny + y] + d1;
          if (c < cur) cur = c;
        }
        if (y < ny - 1) {
          const c = v[idx + 1] + d1;
          if (c < cur) cur = c;
        }
        if (x < nx - 1 && y < ny - 1) {
          const c = v[(x + 1) * ny + y + 1] + d2;
          if (c < cur) cur = c;
        }
        if (x > 0 && y < ny - 1) {
          const c = v[(x - 1) * ny + y + 1] + d2;
          if (c < cur) cur = c;
        }
        v[idx] = cur;
      }
    }
  },
  compute2DWithLabels(grid, labels, d1 = 1, d2 = 1.414) {
    const { values: v, nx, ny } = grid;
    function tryUpdate(idx, nIdx, cost, valid, cur) {
      if (!valid) return;
      const c = v[nIdx] + cost;
      if (c < cur.v) {
        cur.v = c;
        labels[idx] = labels[nIdx];
      }
    }
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        if (v[idx] === 0) continue;
        const cur = { v: v[idx] };
        tryUpdate(idx, (x - 1) * ny + y, d1, x > 0, cur);
        tryUpdate(idx, idx - 1, d1, y > 0, cur);
        tryUpdate(idx, (x - 1) * ny + y - 1, d2, x > 0 && y > 0, cur);
        tryUpdate(idx, (x + 1) * ny + y - 1, d2, x < nx - 1 && y > 0, cur);
        v[idx] = cur.v;
      }
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--) {
        const idx = x * ny + y;
        if (v[idx] === 0) continue;
        const cur = { v: v[idx] };
        tryUpdate(idx, (x + 1) * ny + y, d1, x < nx - 1, cur);
        tryUpdate(idx, idx + 1, d1, y < ny - 1, cur);
        tryUpdate(idx, (x + 1) * ny + y + 1, d2, x < nx - 1 && y < ny - 1, cur);
        tryUpdate(idx, (x - 1) * ny + y + 1, d2, x > 0 && y < ny - 1, cur);
        v[idx] = cur.v;
      }
  },
  compute3D(grid, d1 = 1, d2 = 1.414, d3 = 1.732) {
    const { values: v, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const costs = [d1, d2, d3];
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of FORWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const c = v[nx2 * nyz + ny2 * nz + nz2] + costs[ci];
              if (c < cur) cur = c;
            }
          }
          v[idx] = cur;
        }
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--)
        for (let z = nz - 1; z >= 0; z--) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of BACKWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const c = v[nx2 * nyz + ny2 * nz + nz2] + costs[ci];
              if (c < cur) cur = c;
            }
          }
          v[idx] = cur;
        }
  },
  compute3DWithLabels(grid, labels, d1 = 1, d2 = 1.414, d3 = 1.732) {
    const { values: v, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const costs = [d1, d2, d3];
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of FORWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const nIdx = nx2 * nyz + ny2 * nz + nz2;
              const c = v[nIdx] + costs[ci];
              if (c < cur) {
                cur = c;
                labels[idx] = labels[nIdx];
              }
            }
          }
          v[idx] = cur;
        }
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--)
        for (let z = nz - 1; z >= 0; z--) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of BACKWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const nIdx = nx2 * nyz + ny2 * nz + nz2;
              const c = v[nIdx] + costs[ci];
              if (c < cur) {
                cur = c;
                labels[idx] = labels[nIdx];
              }
            }
          }
          v[idx] = cur;
        }
  }
};
var FORWARD_3D = [
  [-1, 0, 0, 0],
  [0, -1, 0, 0],
  [0, 0, -1, 0],
  [-1, -1, 0, 1],
  [-1, 1, 0, 1],
  [-1, 0, -1, 1],
  [-1, 0, 1, 1],
  [0, -1, -1, 1],
  [0, -1, 1, 1],
  [-1, -1, -1, 2],
  [-1, -1, 1, 2],
  [-1, 1, -1, 2],
  [-1, 1, 1, 2]
];
var BACKWARD_3D = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [1, 1, 0, 1],
  [1, -1, 0, 1],
  [1, 0, 1, 1],
  [1, 0, -1, 1],
  [0, 1, 1, 1],
  [0, 1, -1, 1],
  [1, 1, 1, 2],
  [1, 1, -1, 2],
  [1, -1, 1, 2],
  [1, -1, -1, 2]
];
var BlobDetect = {
  labelComponents2D(grid, threshold = 0) {
    const { values: v, nx, ny } = grid;
    const labels = new Int32Array(v.length);
    let blobCount = 0;
    const queue = [];
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        if (labels[idx] !== 0) continue;
        if (v[idx] <= threshold) continue;
        blobCount++;
        labels[idx] = blobCount;
        queue.length = 0;
        queue.push(idx);
        let head = 0;
        while (head < queue.length) {
          const ci = queue[head++];
          const cx = Math.floor(ci / ny);
          const cy = ci % ny;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const bx = cx + dx, by = cy + dy;
            if (bx < 0 || bx >= nx || by < 0 || by >= ny) continue;
            const nIdx = bx * ny + by;
            if (labels[nIdx] !== 0) continue;
            if (v[nIdx] <= threshold) continue;
            labels[nIdx] = blobCount;
            queue.push(nIdx);
          }
        }
      }
    }
    return { labels, blobCount };
  },
  traceContours2D(grid, threshold = 0) {
    const { values: v, nx, ny } = grid;
    const DX = [1, 1, 0, -1, -1, -1, 0, 1];
    const DY = [0, -1, -1, -1, 0, 1, 1, 1];
    const fg = new Uint8Array(v.length);
    const border = new Uint8Array(v.length);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        fg[idx] = v[idx] > threshold ? 1 : 0;
        if (!fg[idx]) continue;
        if (x === 0 || x === nx - 1 || y === 0 || y === ny - 1) {
          border[idx] = 1;
          continue;
        }
        for (let d = 0; d < 8; d += 2) {
          const bx = x + DX[d], by = y + DY[d];
          if (bx < 0 || bx >= nx || by < 0 || by >= ny || v[bx * ny + by] <= threshold) {
            border[idx] = 1;
            break;
          }
        }
      }
    const visited = new Uint8Array(v.length);
    const contours = [];
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const startIdx = x * ny + y;
        if (!border[startIdx] || visited[startIdx]) continue;
        let startDir = -1;
        for (let d = 0; d < 8; d++) {
          const bx = x + DX[d], by = y + DY[d];
          if (bx < 0 || bx >= nx || by < 0 || by >= ny || !fg[bx * ny + by]) {
            startDir = d;
            break;
          }
        }
        if (startDir === -1) continue;
        const contour = [];
        let cx = x, cy = y;
        let lastDir = (startDir + 4) % 8;
        do {
          const searchStart = ((lastDir + 4) % 8 + 1) % 8;
          let nextDir = -1;
          for (let i = 0; i < 8; i++) {
            const d = (searchStart + i) % 8;
            const bx = cx + DX[d], by = cy + DY[d];
            if (bx < 0 || bx >= nx || by < 0 || by >= ny) continue;
            if (border[bx * ny + by]) {
              nextDir = d;
              break;
            }
          }
          if (nextDir === -1) break;
          const nextX = cx + DX[nextDir], nextY = cy + DY[nextDir];
          const nextIdx = nextX * ny + nextY;
          if (!visited[nextIdx]) {
            visited[nextIdx] = 1;
            contour.push({ x: nextX, y: nextY });
          }
          cx = nextX;
          cy = nextY;
          lastDir = nextDir;
        } while (cx !== x || cy !== y);
        if (contour.length >= 3) contours.push(contour);
      }
    return contours;
  }
};
var PixelView = {
  /**
   * Computes visibility from a single viewpoint, incrementing the result grid
   * for each visible cell (both open and obstacle cells).
   * @param obstacles Grid where values <= 0 are obstacles, > 0 are open.
   * @param result Grid to increment for each visible cell (same dimensions).
   * @param x Viewpoint X (grid coords).
   * @param y Viewpoint Y (grid coords).
   */
  analyse(obstacles, result, x, y) {
    stepView(obstacles, result, x, y, 1, 0);
    stepView(obstacles, result, x, y, -1, 0);
    stepView(obstacles, result, x, y, 0, 1);
    stepView(obstacles, result, x, y, 0, -1);
  },
  /**
   * Computes visibility from every non-obstacle cell, accumulating total visibility
   * counts. Result cells with higher values are visible from more viewpoints.
   */
  analyseAll(obstacles, result) {
    for (let x = 0; x < obstacles.nx; x++)
      for (let y = 0; y < obstacles.ny; y++)
        if (!isObstacle(obstacles, x, y))
          PixelView.analyse(obstacles, result, x, y);
  }
};
function isObstacle(obstacles, x, y) {
  if (x < 0 || x >= obstacles.nx || y < 0 || y >= obstacles.ny) return true;
  return obstacles.values[x * obstacles.ny + y] <= 0;
}
function inBounds(x, y, nx, ny) {
  return x >= 0 && x < nx && y >= 0 && y < ny;
}
var ViewEvent = class _ViewEvent {
  constructor(startX, startY, endX, endY) {
    const dX = endX - startX;
    const dY = endY - startY;
    const adX = Math.abs(dX);
    const adY = Math.abs(dY);
    this.stepDX = Math.sign(dX);
    this.stepDY = Math.sign(dY);
    if (adX > adY) {
      this.stepPX = this.stepDX;
      this.stepPY = 0;
      this.dFast = adY;
      this.dSlow = adX;
    } else {
      this.stepPX = 0;
      this.stepPY = this.stepDY;
      this.dFast = adX;
      this.dSlow = adY;
    }
    this.x = startX;
    this.y = startY;
    this.error = this.dSlow / 2;
  }
  stepForward() {
    this.error -= this.dFast;
    if (this.error < 0) {
      this.error += this.dSlow;
      this.x += this.stepDX;
      this.y += this.stepDY;
    } else {
      this.x += this.stepPX;
      this.y += this.stepPY;
    }
  }
  clone() {
    const ev = Object.create(_ViewEvent.prototype);
    Object.assign(ev, this);
    return ev;
  }
};
function stepView(obstacles, result, x, y, stepX, stepY) {
  const nx = obstacles.nx, ny = obstacles.ny;
  const maxDepth = Math.max(nx, ny);
  let plusX, plusY;
  let events = [];
  let nextEvents = [];
  if (stepX !== 0) {
    events.push(new ViewEvent(x, y, x + stepX, y - 1));
    events.push(new ViewEvent(x, y + 1, x + stepX, y + 2));
    plusX = 0;
    plusY = 1;
  } else {
    events.push(new ViewEvent(x, y, x - 1, y + stepY));
    events.push(new ViewEvent(x + 1, y, x + 2, y + stepY));
    plusX = 1;
    plusY = 0;
  }
  for (let depth = 0; depth < maxDepth && events.length > 0; depth++) {
    nextEvents.length = 0;
    for (const ev of events) ev.stepForward();
    for (let i = 0; i + 1 < events.length; i += 2) {
      const cEvent0 = events[i];
      const cEvent1 = events[i + 1];
      const scanSteps = plusY !== 0 ? cEvent1.y - cEvent0.y : cEvent1.x - cEvent0.x;
      if (scanSteps <= 0) continue;
      if (plusX === 0 && (cEvent0.x < 0 || cEvent0.x >= nx)) continue;
      if (plusY === 0 && (cEvent0.y < 0 || cEvent0.y >= ny)) continue;
      let cX = cEvent0.x;
      let cY = cEvent0.y;
      let isOpen = !isObstacle(obstacles, cX, cY);
      let openStart = cEvent0.clone();
      if (inBounds(cX, cY, nx, ny))
        result.values[cX * ny + cY] += 1;
      cX += plusX;
      cY += plusY;
      for (let s = 1; s < scanSteps; s++) {
        const isObs = isObstacle(obstacles, cX, cY);
        if (inBounds(cX, cY, nx, ny))
          result.values[cX * ny + cY] += 1;
        if (isOpen && isObs) {
          nextEvents.push(openStart);
          nextEvents.push(new ViewEvent(cX, cY, cX + cX - x, cY + cY - y));
          isOpen = false;
        } else if (!isOpen && !isObs) {
          openStart = new ViewEvent(cX, cY, cX + cX - x, cY + cY - y);
          isOpen = true;
        }
        cX += plusX;
        cY += plusY;
      }
      if (isOpen) {
        nextEvents.push(openStart);
        nextEvents.push(cEvent1);
      }
    }
    [events, nextEvents] = [nextEvents, events];
  }
}

// src/core/sdf/index.ts
var EPSILON = HMath.EPSILON;
var TWO_PI2 = Math.PI * 2;
var SdfSphere = class {
  constructor(radius, center = Vec3.zero()) {
    this.radius = radius;
    this.center = center;
  }
  distance(p) {
    return p.sub(this.center).len() - this.radius;
  }
};
var SdfBox = class _SdfBox {
  constructor(halfExtents, center = Vec3.zero()) {
    this.halfExtents = halfExtents;
    this.center = center;
  }
  static fromSize(sx, sy, sz) {
    return new _SdfBox(new Vec3(sx * 0.5, sy * 0.5, sz * 0.5));
  }
  distance(p) {
    const d = p.sub(this.center);
    const qx = Math.abs(d.x) - this.halfExtents.x;
    const qy = Math.abs(d.y) - this.halfExtents.y;
    const qz = Math.abs(d.z) - this.halfExtents.z;
    const outside = new Vec3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)).len();
    const inside = Math.min(Math.max(qx, Math.max(qy, qz)), 0);
    return outside + inside;
  }
};
var SdfCapsule = class {
  constructor(a, b, radius) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  distance(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.dot(ab);
    const t = abSq < EPSILON ? 0 : HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
    return p.sub(this.a.add(ab.mul(t))).len() - this.radius;
  }
};
var SdfCylinder = class _SdfCylinder {
  constructor(a, b, radius) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  static vertical(height, radius) {
    return new _SdfCylinder(
      new Vec3(0, -height * 0.5, 0),
      new Vec3(0, height * 0.5, 0),
      radius
    );
  }
  distance(p) {
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
};
var SdfCone = class {
  constructor(a, b, radiusA, radiusB) {
    this.a = a;
    this.b = b;
    this.radiusA = radiusA;
    this.radiusB = radiusB;
  }
  distance(p) {
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
};
var SdfTorus = class {
  constructor(majorRadius, minorRadius) {
    this.majorRadius = majorRadius;
    this.minorRadius = minorRadius;
  }
  distance(p) {
    const qx = Math.sqrt(p.x * p.x + p.z * p.z) - this.majorRadius;
    return Math.sqrt(qx * qx + p.y * p.y) - this.minorRadius;
  }
};
var SdfEllipsoid = class {
  constructor(radii) {
    this.radii = radii;
  }
  distance(p) {
    const scaled = new Vec3(p.x / this.radii.x, p.y / this.radii.y, p.z / this.radii.z);
    const scaled2 = new Vec3(
      p.x / (this.radii.x * this.radii.x),
      p.y / (this.radii.y * this.radii.y),
      p.z / (this.radii.z * this.radii.z)
    );
    const k0 = scaled.len();
    const k1 = scaled2.len();
    return k1 < EPSILON ? 0 : k0 * (k0 - 1) / k1;
  }
};
var SdfPlane = class {
  constructor(normal, dOrPoint) {
    this.normal = normal.normalize();
    if (typeof dOrPoint === "number") {
      this.d = dOrPoint;
    } else {
      this.d = this.normal.dot(dOrPoint);
    }
  }
  distance(p) {
    return p.dot(this.normal) - this.d;
  }
};
var SdfLine = class {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  distance(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.dot(ab);
    if (abSq < EPSILON) return p.sub(this.a).len();
    const t = p.sub(this.a).dot(ab) / abSq;
    return p.sub(this.a.add(ab.mul(t))).len();
  }
};
var SdfUnion = class {
  constructor(...children) {
    this.children = children;
  }
  distance(p) {
    let min = Infinity;
    for (const c of this.children) min = Math.min(min, c.distance(p));
    return min;
  }
};
var SdfIntersect = class {
  constructor(...children) {
    this.children = children;
  }
  distance(p) {
    let max = -Infinity;
    for (const c of this.children) max = Math.max(max, c.distance(p));
    return max;
  }
};
var SdfSubtract = class {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  distance(p) {
    return Math.max(this.a.distance(p), -this.b.distance(p));
  }
};
var SdfBlend = class {
  constructor(a, b, radius = 1) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  distance(p) {
    const dA = this.a.distance(p);
    const dB = this.b.distance(p);
    const e = Math.max(this.radius - Math.abs(dA - dB), 0);
    return Math.min(dA, dB) - e * e * 0.25 / this.radius;
  }
};
var SdfSmoothSubtract = class {
  constructor(a, b, radius = 1) {
    this.a = a;
    this.b = b;
    this.radius = radius;
  }
  distance(p) {
    const dA = this.a.distance(p);
    const dB = this.b.distance(p);
    const e = Math.max(this.radius - Math.abs(dA + dB), 0);
    return Math.max(dA, -dB) + e * e * 0.25 / this.radius;
  }
};
var SdfSmoothUnion = class {
  constructor(a, b, k = 1) {
    this.a = a;
    this.b = b;
    this.k = k;
  }
  distance(p) {
    const a = this.a.distance(p);
    const b = this.b.distance(p);
    const h = HMath.clamp(0.5 + 0.5 * (b - a) / this.k, 0, 1);
    const mix = b + h * (a - b);
    return mix - this.k * h * (1 - h);
  }
};
var SdfShell = class {
  constructor(input, thickness = 1) {
    this.input = input;
    this.thickness = thickness;
  }
  distance(p) {
    return Math.abs(this.input.distance(p)) - this.thickness;
  }
};
var SdfOnion = class {
  constructor(input, thickness, layers = 1) {
    this.input = input;
    this.thickness = thickness;
    this.layers = layers;
  }
  distance(p) {
    let d = this.input.distance(p);
    for (let i = 0; i < this.layers; i++) d = Math.abs(d) - this.thickness;
    return d;
  }
};
var SdfTwist = class {
  constructor(input, anglePerUnit, z1 = -1, z2 = 1) {
    this.input = input;
    this.anglePerUnit = anglePerUnit;
    this.z1 = z1;
    this.z2 = z2;
  }
  distance(p) {
    const range = this.z2 - this.z1;
    const t = range < EPSILON ? 0 : (p.z - this.z1) / range - 0.5;
    const theta = t * this.anglePerUnit;
    const c = Math.cos(theta), s = Math.sin(theta);
    return this.input.distance(new Vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z));
  }
};
var SdfRevolution = class {
  constructor(input) {
    this.input = input;
  }
  distance(p) {
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    return this.input.distance(new Vec3(r, p.y, 0));
  }
};
var SdfExtrude = class {
  constructor(input) {
    this.input = input;
  }
  distance(p) {
    return this.input.distance(new Vec3(p.x, p.y, 0));
  }
};
var SdfBoundedExtrude = class {
  constructor(input, height) {
    this.input = input;
    this.halfHeight = height * 0.5;
  }
  distance(p) {
    const d2d = this.input.distance(new Vec3(p.x, p.y, 0));
    return Math.max(d2d, Math.abs(p.z) - this.halfHeight);
  }
};
var SdfMirror = class {
  constructor(input, planeNormal) {
    this.input = input;
    this.normal = planeNormal.normalize();
  }
  distance(p) {
    const d = p.dot(this.normal);
    const q = d < 0 ? p.sub(this.normal.mul(2 * d)) : p;
    return this.input.distance(q);
  }
};
var SdfRadialArray = class {
  constructor(input, count) {
    this.input = input;
    this.count = count;
    this.deltaAngle = TWO_PI2 / count;
  }
  distance(p) {
    let angle = Math.atan2(p.y, p.x);
    if (angle < 0) angle += TWO_PI2;
    const closest = Math.round(angle / this.deltaAngle) * this.deltaAngle;
    const rot = closest - angle;
    const r = Math.sqrt(p.x * p.x + p.y * p.y);
    return this.input.distance(new Vec3(r * Math.cos(rot), r * Math.sin(rot), p.z));
  }
};
var SdfTransform = class {
  constructor(input, transform) {
    this.input = input;
    this.inverse = transform.invert();
  }
  setTransform(transform) {
    this.inverse = transform.invert();
  }
  distance(p) {
    return this.input.distance(this.inverse.transformPoint(p));
  }
};
var SdfOffset = class {
  constructor(input, amount) {
    this.input = input;
    this.amount = amount;
  }
  distance(p) {
    return this.input.distance(p) - this.amount;
  }
};
var SdfGradient = class {
  constructor(a, b, factor = 1) {
    this.a = a;
    this.b = b;
    this.factor = factor;
  }
  distance(p) {
    return this.a.distance(p) + this.factor * this.b.distance(p);
  }
};
var SdfVoronoi = class {
  constructor(offset = 0) {
    this.offset = offset;
    this.children = [];
  }
  distance(p) {
    let min1 = Infinity, min2 = Infinity;
    for (const c of this.children) {
      const d = c.distance(p);
      if (d < min1) {
        min2 = min1;
        min1 = d;
      } else if (d < min2) {
        min2 = d;
      }
    }
    return this.children.length > 0 ? Math.abs(min1 - min2) - this.offset : 0;
  }
};
var SdfLattice = class {
  constructor(type = "gyroid", scale = 1, offset = 0, shell = false) {
    this.type = type;
    this.scale = scale;
    this.offset = offset;
    this.shell = shell;
  }
  distance(p) {
    const a = p.x / this.scale;
    const b = p.y / this.scale;
    const c = p.z / this.scale;
    const { sin, cos } = Math;
    let value;
    switch (this.type) {
      case "schwarz":
        value = cos(a) + cos(b) + cos(c);
        break;
      case "gyroid":
        value = sin(a) * cos(b) + sin(b) * cos(c) + sin(c) * cos(a);
        break;
      case "diamond":
        value = sin(a) * sin(b) * sin(c) + sin(a) * cos(b) * cos(c) + cos(a) * sin(b) * cos(c) + cos(a) * cos(b) * sin(c);
        break;
      case "lidinoid":
        value = 0.5 * (sin(2 * a) * cos(b) * sin(c) + sin(2 * b) * cos(c) * sin(a) + sin(2 * c) * cos(a) * sin(b)) - 0.5 * (cos(2 * a) * cos(2 * b) + cos(2 * b) * cos(2 * c) + cos(2 * c) * cos(2 * a)) + 0.15;
        break;
      case "neovius":
        value = 3 * cos(a) + cos(b) + cos(c) + 4 * cos(a) * cos(b) * cos(c);
        break;
      case "fischerKoch":
        value = cos(2 * a) * sin(b) * cos(c) + cos(2 * b) * sin(c) * cos(a) + cos(2 * c) * sin(a) * cos(b);
        break;
      case "frd":
        value = 8 * cos(a) * cos(b) * cos(c) + cos(2 * a) * cos(2 * c) * cos(2 * a) - (cos(2 * a) * sin(2 * b) + cos(2 * b) * sin(2 * c) + cos(2 * c) * sin(2 * a));
        break;
      case "doubleDiamond":
        value = sin(2 * a) * sin(2 * b) + sin(2 * b) * sin(2 * c) + sin(2 * a) * sin(2 * c) + cos(2 * a) * cos(2 * b) * cos(2 * c);
        break;
      case "doubleGyroid":
        value = 2.75 * (sin(2 * a) * sin(c) * cos(b) + sin(2 * b) * sin(a) * cos(c) + sin(2 * c) * sin(b) * cos(a)) - (cos(2 * a) * cos(2 * b) + cos(2 * b) * cos(2 * c) + cos(2 * c) * cos(2 * a));
        break;
      case "s":
        value = cos(2 * a) * sin(b) * cos(c) + cos(2 * b) * sin(c) * cos(a) + cos(2 * c) * sin(a) * cos(b) - 0.4;
        break;
      default:
        value = 0;
    }
    return this.shell ? Math.abs(value) - this.offset : value + this.offset;
  }
};
var SdfMicrostructure = class {
  constructor(cellSize = 10, strutRadius = 1, pattern = "bigX") {
    this.cellSize = cellSize;
    this.strutRadius = strutRadius;
    this.pattern = pattern;
    this.struts = generateStruts(pattern, cellSize);
  }
  distance(p) {
    const cs = this.cellSize;
    const hs = cs * 0.5;
    const q = new Vec3(
      Math.abs(Math.abs(p.x) % cs - hs),
      Math.abs(Math.abs(p.y) % cs - hs),
      Math.abs(Math.abs(p.z) % cs - hs)
    );
    let minDist = Infinity;
    for (const { a, b } of this.struts) {
      const d = distToSegment(q, a, b);
      if (d < minDist) minDist = d;
    }
    return minDist - this.strutRadius;
  }
};
function distToSegment(p, a, b) {
  const ab = b.sub(a);
  const abSq = ab.dot(ab);
  if (abSq < EPSILON) return p.sub(a).len();
  const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
  return p.sub(a.add(ab.mul(t))).len();
}
function generateStruts(pattern, dim) {
  const v1 = 0, v2 = dim * 0.5, v3 = dim * 0.25;
  const p = [
    new Vec3(v1, v1, v1),
    new Vec3(v2, v1, v1),
    new Vec3(v2, v2, v1),
    new Vec3(v1, v2, v1),
    new Vec3(v1, v1, v2),
    new Vec3(v2, v1, v2),
    new Vec3(v2, v2, v2),
    new Vec3(v1, v2, v2),
    new Vec3(v3, v1, v1),
    new Vec3(v2, v3, v1),
    new Vec3(v3, v2, v1),
    new Vec3(v1, v3, v1),
    new Vec3(v1, v1, v3),
    new Vec3(v2, v1, v3),
    new Vec3(v2, v2, v3),
    new Vec3(v1, v2, v3),
    new Vec3(v3, v1, v2),
    new Vec3(v2, v3, v2),
    new Vec3(v3, v2, v2),
    new Vec3(v1, v3, v2)
  ];
  const s = (a, b) => ({ a: p[a], b: p[b] });
  switch (pattern) {
    case "bigX":
      return [s(0, 6)];
    case "grid":
      return [s(2, 6), s(5, 6), s(7, 6)];
    case "star":
      return [s(0, 6), s(2, 6), s(5, 6), s(7, 6)];
    case "cross":
      return [s(1, 6), s(3, 6), s(4, 6)];
    case "octagon":
      return [s(1, 3), s(3, 4), s(4, 1)];
    case "octet":
      return [s(1, 6), s(3, 6), s(4, 6), s(1, 3), s(3, 4), s(4, 1)];
    case "vintile":
      return [s(8, 13), s(13, 17), s(17, 18), s(18, 15), s(15, 11), s(11, 8)];
    case "dual":
      return [s(0, 1), s(0, 3), s(0, 4)];
    case "interlock":
      return [s(2, 6), s(5, 6), s(7, 6), s(0, 1), s(0, 3), s(0, 4)];
    case "isotrop":
      return [s(0, 1), s(2, 1), s(5, 1), s(7, 1), s(7, 3), s(7, 6), s(7, 4)];
    default:
      return [s(0, 6)];
  }
}
var SdfUtils = {
  gradient(sdf, p, epsilon = 1e-3) {
    const dx = sdf.distance(new Vec3(p.x + epsilon, p.y, p.z)) - sdf.distance(new Vec3(p.x - epsilon, p.y, p.z));
    const dy = sdf.distance(new Vec3(p.x, p.y + epsilon, p.z)) - sdf.distance(new Vec3(p.x, p.y - epsilon, p.z));
    const dz = sdf.distance(new Vec3(p.x, p.y, p.z + epsilon)) - sdf.distance(new Vec3(p.x, p.y, p.z - epsilon));
    return new Vec3(dx, dy, dz).normalize();
  },
  rayMarch(sdf, origin, direction, maxDistance = 1e3, tolerance = 1e-3, maxSteps = 256) {
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
  surfaceNormal(sdf, p, projectionSteps = 3, epsilon = 1e-3) {
    let q = p;
    for (let i = 0; i < projectionSteps; i++) {
      const d = sdf.distance(q);
      const grad2 = SdfUtils.gradient(sdf, q, epsilon);
      q = q.sub(grad2.mul(d));
    }
    return SdfUtils.gradient(sdf, q, epsilon);
  },
  projectToSurface(sdf, p, maxSteps = 16, epsilon = 1e-3) {
    let q = p;
    for (let i = 0; i < maxSteps; i++) {
      const d = sdf.distance(q);
      if (Math.abs(d) < epsilon) break;
      q = q.sub(SdfUtils.gradient(sdf, q, epsilon).mul(d));
    }
    return q;
  },
  estimateCurvature(sdf, p, epsilon = 0.01) {
    const center = sdf.distance(p);
    const laplacian = sdf.distance(new Vec3(p.x + epsilon, p.y, p.z)) + sdf.distance(new Vec3(p.x - epsilon, p.y, p.z)) + sdf.distance(new Vec3(p.x, p.y + epsilon, p.z)) + sdf.distance(new Vec3(p.x, p.y - epsilon, p.z)) + sdf.distance(new Vec3(p.x, p.y, p.z + epsilon)) + sdf.distance(new Vec3(p.x, p.y, p.z - epsilon)) - 6 * center;
    return laplacian / (epsilon * epsilon);
  },
  ambientOcclusion(sdf, surfacePoint, normal, samples = 5, maxDistance = 1) {
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
  }
};
var SdfOps = {
  translate(sdf, x, y, z) {
    return new SdfTransform(sdf, Mat4.translation(x, y, z));
  },
  rotateX(sdf, radians) {
    return new SdfTransform(sdf, Mat4.rotationX(radians));
  },
  rotateY(sdf, radians) {
    return new SdfTransform(sdf, Mat4.rotationY(radians));
  },
  rotateZ(sdf, radians) {
    return new SdfTransform(sdf, Mat4.rotationZ(radians));
  },
  scale(sdf, factor) {
    return new SdfTransform(sdf, Mat4.scaling(factor, factor, factor));
  },
  union(a, b) {
    return new SdfUnion(a, b);
  },
  intersect(a, b) {
    return new SdfIntersect(a, b);
  },
  subtract(a, b) {
    return new SdfSubtract(a, b);
  },
  blend(a, b, radius = 1) {
    return new SdfBlend(a, b, radius);
  },
  shell(sdf, thickness) {
    return new SdfShell(sdf, thickness);
  },
  round(sdf, radius) {
    return new SdfOffset(sdf, radius);
  },
  mirror(sdf, normal) {
    return new SdfMirror(sdf, normal);
  },
  twist(sdf, anglePerUnit) {
    return new SdfTwist(sdf, anglePerUnit);
  },
  revolve(sdf) {
    return new SdfRevolution(sdf);
  }
};

// src/core/geometry/Capsule2D.ts
var Capsule2D = class _Capsule2D {
  constructor(center, halfLength, radius, angle = 0) {
    this.center = center;
    this.halfLength = halfLength;
    this.radius = radius;
    this.angle = angle;
  }
  /** The two endpoint centers of the internal segment. */
  get endpoints() {
    const dir = Vec2.fromAngle(this.angle).mul(this.halfLength);
    return [this.center.sub(dir), this.center.add(dir)];
  }
  /** Full length including endcaps. */
  get totalLength() {
    return this.halfLength * 2 + this.radius * 2;
  }
  /** Approximate area. */
  get area() {
    return this.halfLength * 2 * this.radius * 2 + Math.PI * this.radius * this.radius;
  }
  /** Approximate mass (proportional to area). */
  get mass() {
    return (this.halfLength * 2 + Math.PI * this.radius) * this.radius * 0.01;
  }
  /** Approximate moment of inertia about center. */
  get inertia() {
    return this.mass * ((this.halfLength * 2) ** 2 + this.radius ** 2) / 6;
  }
  /** Three grab handles: endA, center, endB. */
  get handles() {
    const [a, b] = this.endpoints;
    return [a, this.center, b];
  }
  /** Closest point on the internal segment to a world point. */
  closestSegmentPoint(p) {
    const [a, b] = this.endpoints;
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < 1e-12) return a;
    const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / abSq));
    return a.add(ab.mul(t));
  }
  /** Signed distance from capsule surface to a point. Negative = inside. */
  distToPoint(p) {
    return p.distTo(this.closestSegmentPoint(p)) - this.radius;
  }
  /** Test if a point is inside the capsule. */
  containsPoint(p) {
    return this.distToPoint(p) <= 0;
  }
  /** Hit-test handles first (rotation priority), then body (translate). */
  hitTest(p, handleRadius) {
    const [a, , b] = this.handles;
    const r2 = handleRadius * handleRadius;
    if (p.distSqTo(a) <= r2) return { type: "endA" };
    if (p.distSqTo(b) <= r2) return { type: "endB" };
    if (this.containsPoint(p)) return { type: "center" };
    return null;
  }
  /** Clone with optional overrides. */
  clone() {
    return new _Capsule2D(this.center, this.halfLength, this.radius, this.angle);
  }
};

// src/core/physics/index.ts
var SpringSystem3D = class {
  constructor() {
    this.pos = [];
    this.vel = [];
    this.invMass = new Float32Array(0);
    this.springs = [];
    // Settings
    this.gravity = new Vec3(0, -9.81, 0);
    this.floorPlane = new HPlane(new Vec3(0, 0, 1), -10);
    this.globalVelDamping = 0.02;
    this.useGlobalStiffness = true;
    this.globalStiffness = 200;
    this.globalDamping = 2;
    this.stiffnessStrut = 2e3;
    this.stiffnessShear = 1e3;
    this.stiffnessHinge = 500;
    this.maxForce = 1e5;
  }
  // ── Init from mesh ──
  initFromMesh(mesh, trussThickness = 0, useHinges = true) {
    const useTruss = Math.abs(trussThickness) > 1e-3;
    const nodes = mesh.nodesArray();
    const layer1Count = nodes.length;
    const totalCount = useTruss ? layer1Count * 2 : layer1Count;
    const idToIdx = /* @__PURE__ */ new Map();
    for (let i = 0; i < nodes.length; i++) {
      idToIdx.set(nodes[i].id, i);
    }
    this.pos = new Array(totalCount);
    this.vel = new Array(totalCount);
    this.invMass = new Float32Array(totalCount);
    this.springs = [];
    for (let i = 0; i < layer1Count; i++) {
      this.pos[i] = nodes[i].position;
      this.vel[i] = Vec3.zero();
      this.invMass[i] = 1;
    }
    if (useTruss) {
      const normals = this.computeSmoothNormals(mesh, nodes, idToIdx);
      for (let i = 0; i < layer1Count; i++) {
        const ghostIdx = i + layer1Count;
        this.pos[ghostIdx] = this.pos[i].sub(normals[i].mul(trussThickness));
        this.vel[ghostIdx] = Vec3.zero();
        this.invMass[ghostIdx] = 1;
        this.addSpring(i, ghostIdx, this.stiffnessStrut);
      }
    }
    for (const edge of mesh.edges()) {
      const u = idToIdx.get(edge.nodes[0]);
      const v = idToIdx.get(edge.nodes[1]);
      this.addSpring(u, v, this.stiffnessStrut);
      if (useTruss) {
        const u2 = u + layer1Count;
        const v2 = v + layer1Count;
        this.addSpring(u2, v2, this.stiffnessStrut);
        this.addSpring(u, v2, this.stiffnessShear);
        this.addSpring(v, u2, this.stiffnessShear);
      }
    }
    for (const face of mesh.faces()) {
      if (face.nodes.length === 4) {
        const [a, b, c, d] = face.nodes.map((n) => idToIdx.get(n));
        this.addSpring(a, c, this.stiffnessShear);
        this.addSpring(b, d, this.stiffnessShear);
        if (useTruss) {
          this.addSpring(a + layer1Count, c + layer1Count, this.stiffnessShear);
          this.addSpring(b + layer1Count, d + layer1Count, this.stiffnessShear);
        }
      }
    }
    if (useHinges) this.addBendingSprings(mesh, idToIdx);
  }
  computeSmoothNormals(mesh, nodes, idToIdx) {
    const normals = new Array(nodes.length).fill(Vec3.zero());
    for (const face of mesh.faces()) {
      if (face.nodes.length < 3) continue;
      const pA = mesh.node(face.nodes[0]).position;
      const pB = mesh.node(face.nodes[1]).position;
      const pC = mesh.node(face.nodes[2]).position;
      const n = pB.sub(pA).cross(pC.sub(pA)).normalize();
      for (const nid of face.nodes) {
        const idx = idToIdx.get(nid);
        normals[idx] = normals[idx].add(n);
      }
    }
    for (let i = 0; i < normals.length; i++) {
      normals[i] = normals[i].lenSq() > 0 ? normals[i].normalize() : new Vec3(0, 0, 1);
    }
    return normals;
  }
  addBendingSprings(mesh, idToIdx) {
    for (const edge of mesh.edges()) {
      if (edge.faces.length < 2) continue;
      const fA = mesh.face(edge.faces[0]);
      const fB = mesh.face(edge.faces[1]);
      if (!fA || !fB) continue;
      const wingA = this.getOppositeVertex(fA.nodes, edge.nodes[0], edge.nodes[1]);
      const wingB = this.getOppositeVertex(fB.nodes, edge.nodes[0], edge.nodes[1]);
      if (wingA !== -1 && wingB !== -1) {
        this.addSpring(idToIdx.get(wingA), idToIdx.get(wingB), this.stiffnessHinge);
      }
    }
  }
  getOppositeVertex(faceNodes, v1, v2) {
    for (const n of faceNodes) {
      if (n !== v1 && n !== v2) return n;
    }
    return -1;
  }
  // ── Spring management ──
  addSpring(i, j, k = 200) {
    if (i < 0 || i >= this.pos.length || j < 0 || j >= this.pos.length) return;
    const restLength = this.pos[i].sub(this.pos[j]).len();
    this.springs.push({ i, j, restLength, k });
  }
  // ── Pin/unpin vertices ──
  pin(index) {
    this.invMass[index] = 0;
  }
  unpin(index) {
    this.invMass[index] = 1;
  }
  // ── Simulation step ──
  step(dt, substeps = 8) {
    if (substeps < 1) substeps = 1;
    const h = dt / substeps;
    const count = this.pos.length;
    const force = new Array(count);
    for (let s = 0; s < substeps; s++) {
      for (let i = 0; i < count; i++) force[i] = Vec3.zero();
      for (let i = 0; i < count; i++) {
        if (this.invMass[i] > 0)
          force[i] = force[i].add(this.gravity.mul(1 / this.invMass[i]));
      }
      for (const sp of this.springs) {
        const d = this.pos[sp.j].sub(this.pos[sp.i]);
        const len = d.len();
        if (isNaN(len) || len < 1e-8) continue;
        const n = d.mul(1 / len);
        const stretch = len - sp.restLength;
        const currentK = this.useGlobalStiffness ? this.globalStiffness : sp.k;
        const fs = currentK * stretch;
        const vRel = this.vel[sp.j].sub(this.vel[sp.i]).dot(n);
        const fd = this.globalDamping * vRel;
        let f2 = n.mul(fs + fd);
        const magSq = f2.dot(f2);
        if (magSq > this.maxForce * this.maxForce)
          f2 = f2.normalize().mul(this.maxForce);
        force[sp.i] = force[sp.i].add(f2);
        force[sp.j] = force[sp.j].sub(f2);
      }
      for (let i = 0; i < count; i++) {
        if (this.invMass[i] === 0) continue;
        const accel = force[i].mul(this.invMass[i]);
        this.vel[i] = this.vel[i].add(accel.mul(h));
        this.vel[i] = this.vel[i].mul(1 - this.globalVelDamping);
        this.pos[i] = this.pos[i].add(this.vel[i].mul(h));
        if (isNaN(this.pos[i].x) || isNaN(this.pos[i].y) || isNaN(this.pos[i].z)) {
          this.pos[i] = Vec3.zero();
          this.vel[i] = Vec3.zero();
        }
        const dist = this.floorPlane.distToPoint(this.pos[i]);
        if (dist < 0) {
          this.pos[i] = this.pos[i].sub(this.floorPlane.normal.mul(dist));
          const vNormal = this.vel[i].dot(this.floorPlane.normal);
          if (vNormal < 0)
            this.vel[i] = this.vel[i].sub(this.floorPlane.normal.mul(vNormal * 1.3));
        }
      }
    }
  }
  // ── Update mesh from simulation ──
  updateMesh(mesh) {
    const nodes = mesh.nodesArray();
    if (this.pos.length < nodes.length) return;
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].position = this.pos[i];
    }
    mesh.computeVertexNormals();
  }
};

// src/core/physics/RigidBody2D.ts
var DEFAULTS = {
  damping: 0.984,
  angularDamping: 0.975,
  wallRestitution: -0.4
};
var RigidBody2D = class {
  constructor(shape, config) {
    // Velocities
    this.vx = 0;
    this.vy = 0;
    this.va = 0;
    this.shape = shape;
    this.mass = shape.mass;
    this.inertia = shape.inertia;
    this.cfg = { ...DEFAULTS, ...config };
  }
  // ── Convenience accessors ──
  get x() {
    return this.shape.center.x;
  }
  set x(v) {
    this.shape.center = new Vec2(v, this.shape.center.y);
  }
  get y() {
    return this.shape.center.y;
  }
  set y(v) {
    this.shape.center = new Vec2(this.shape.center.x, v);
  }
  get angle() {
    return this.shape.angle;
  }
  set angle(v) {
    this.shape.angle = v;
  }
  get position() {
    return this.shape.center;
  }
  set position(v) {
    this.shape.center = v;
  }
  // ── Physics ──
  /**
   * Apply a force at a world-space point.
   * Generates both linear acceleration and torque.
   */
  applyForceAt(fx, fy, px, py) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
    const rx = px - this.x;
    const ry = py - this.y;
    this.va += (rx * fy - ry * fx) / this.inertia;
  }
  /** Apply a central force (no torque). */
  applyForce(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }
  /** Integrate velocities → positions with damping. */
  integrate(gravity = 0) {
    this.vy += gravity;
    this.vx *= this.cfg.damping;
    this.vy *= this.cfg.damping;
    this.va *= this.cfg.angularDamping;
    this.shape.center = new Vec2(this.x + this.vx, this.y + this.vy);
    this.shape.angle += this.va;
  }
  /** Constrain capsule inside a rectangular box. Produces angular impulse on wall hits. */
  constrainToBox(bx, by, bw, bh) {
    const [a, b] = this.shape.endpoints;
    const r = this.shape.radius;
    const rest = this.cfg.wallRestitution;
    for (const p of [a, b]) {
      if (p.x - r < bx) {
        const pen = bx - (p.x - r);
        this.x += pen;
        if (this.vx < 0) this.vx *= rest;
        this.va += (p.y - this.y) * pen * 0.01 / this.inertia;
      }
      if (p.x + r > bx + bw) {
        const pen = p.x + r - (bx + bw);
        this.x -= pen;
        if (this.vx > 0) this.vx *= rest;
        this.va -= (p.y - this.y) * pen * 0.01 / this.inertia;
      }
      if (p.y - r < by) {
        const pen = by - (p.y - r);
        this.y += pen;
        if (this.vy < 0) this.vy *= rest;
        this.va -= (p.x - this.x) * pen * 0.01 / this.inertia;
      }
      if (p.y + r > by + bh) {
        const pen = p.y + r - (by + bh);
        this.y -= pen;
        if (this.vy > 0) this.vy *= rest;
        this.va += (p.x - this.x) * pen * 0.01 / this.inertia;
      }
    }
  }
  /** Kill all velocities. */
  stop() {
    this.vx = 0;
    this.vy = 0;
    this.va = 0;
  }
};
var Spring2D = class {
  constructor(a, b, restLength, config) {
    /** Cached surface attachment points (for rendering). */
    this.surfA = null;
    this.surfB = null;
    /** Current stretch beyond rest length. */
    this.stretch = 0;
    this.bodyA = a;
    this.bodyB = b;
    this.restLength = restLength;
    this.stiffness = config?.stiffness ?? 0.35;
    this.damping = config?.damping ?? 0.055;
  }
  /** Compute and apply spring + damping forces for one timestep. */
  apply() {
    const [a0, a1] = this.bodyA.shape.endpoints;
    const [b0, b1] = this.bodyB.shape.endpoints;
    const { pA, pB } = segSegClosest2D(a0, a1, b0, b1);
    const d = pB.sub(pA);
    const dist = d.len() || 1e-6;
    const n = d.div(dist);
    const surfDist = dist - this.bodyA.shape.radius - this.bodyB.shape.radius;
    const stretch = surfDist - this.restLength;
    const dvx = this.bodyB.vx - this.bodyA.vx;
    const dvy = this.bodyB.vy - this.bodyA.vy;
    const dampF = (dvx * n.x + dvy * n.y) * this.damping;
    const force = stretch * this.stiffness + dampF;
    const fx = n.x * force;
    const fy = n.y * force;
    this.bodyA.applyForceAt(fx, fy, pA.x, pA.y);
    this.bodyB.applyForceAt(-fx, -fy, pB.x, pB.y);
    this.surfA = pA.add(n.mul(this.bodyA.shape.radius));
    this.surfB = pB.sub(n.mul(this.bodyB.shape.radius));
    this.stretch = stretch;
  }
};
function repelBodies(a, b, stiffness = 1.2) {
  const [a0, a1] = a.shape.endpoints;
  const [b0, b1] = b.shape.endpoints;
  const { pA, pB } = segSegClosest2D(a0, a1, b0, b1);
  const d = pB.sub(pA);
  const dist = d.len() || 1e-6;
  const minDist = a.shape.radius + b.shape.radius + 2;
  if (dist < minDist) {
    const pen = minDist - dist;
    const n = d.div(dist);
    const f2 = pen * stiffness;
    a.applyForceAt(-n.x * f2, -n.y * f2, pA.x, pA.y);
    b.applyForceAt(n.x * f2, n.y * f2, pB.x, pB.y);
  }
}
function segSegClosest2D(a0, a1, b0, b1) {
  const da = a1.sub(a0);
  const db = b1.sub(b0);
  const r0 = a0.sub(b0);
  const aa = da.dot(da);
  const ee = db.dot(db);
  const ff = db.dot(r0);
  let s, t;
  if (aa < 1e-8 && ee < 1e-8) {
    s = 0;
    t = 0;
  } else if (aa < 1e-8) {
    s = 0;
    t = clamp01(ff / ee);
  } else {
    const cc = da.dot(r0);
    if (ee < 1e-8) {
      t = 0;
      s = clamp01(-cc / aa);
    } else {
      const bb = da.dot(db);
      const denom = aa * ee - bb * bb;
      s = denom !== 0 ? clamp01((bb * ff - cc * ee) / denom) : 0;
      t = (bb * s + ff) / ee;
      if (t < 0) {
        t = 0;
        s = clamp01(-cc / aa);
      } else if (t > 1) {
        t = 1;
        s = clamp01((bb - cc) / aa);
      }
    }
  }
  return {
    pA: a0.add(da.mul(s)),
    pB: b0.add(db.mul(t))
  };
}
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// src/io/index.ts
function emptyMeshData() {
  return { positions: [], normals: [], uvs: [], faces: [], groups: [] };
}
var ObjFile = {
  /** Parses an OBJ string into MeshData. Handles v/vt/vn/f lines. */
  parse(source) {
    const result = emptyMeshData();
    const rawPositions = [];
    const rawUVs = [];
    const rawNormals = [];
    const indexCache = /* @__PURE__ */ new Map();
    let activeGroup = null;
    let activeGroupFaceStart = 0;
    const flushGroup = () => {
      if (activeGroup === null) return;
      const count = result.faces.length - activeGroupFaceStart;
      if (count > 0) {
        result.groups.push({
          name: activeGroup,
          faceStart: activeGroupFaceStart,
          faceCount: count
        });
      }
    };
    for (const line of source.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed[0] === "#") continue;
      const parts = trimmed.split(/\s+/);
      const type = parts[0];
      if (type === "g" && parts.length >= 2) {
        flushGroup();
        activeGroup = parts.slice(1).join(" ");
        activeGroupFaceStart = result.faces.length;
        continue;
      }
      if (type === "v" && parts.length >= 4) {
        rawPositions.push(new Vec3(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ));
      } else if (type === "vt" && parts.length >= 3) {
        rawUVs.push(new Vec2(
          parseFloat(parts[1]),
          parseFloat(parts[2])
        ));
      } else if (type === "vn" && parts.length >= 4) {
        rawNormals.push(new Vec3(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ));
      } else if (type === "f" && parts.length >= 4) {
        const faceIndices = [];
        for (let i = 1; i < parts.length; i++) {
          const block = parts[i];
          const key = block;
          let finalIndex = indexCache.get(key);
          if (finalIndex === void 0) {
            const { p, t, n } = parseObjIndex(block, rawPositions.length, rawUVs.length, rawNormals.length);
            result.positions.push(rawPositions[p]);
            if (t >= 0) result.uvs.push(rawUVs[t]);
            else if (result.uvs.length > 0) result.uvs.push(Vec2.zero());
            if (n >= 0) result.normals.push(rawNormals[n]);
            else if (result.normals.length > 0) result.normals.push(new Vec3(0, 1, 0));
            finalIndex = result.positions.length - 1;
            indexCache.set(key, finalIndex);
          }
          faceIndices.push(finalIndex);
        }
        result.faces.push(faceIndices);
      }
    }
    flushGroup();
    if (result.groups.length === 0) result.groups = void 0;
    return result;
  },
  /** Serializes MeshData to an OBJ format string. */
  serialize(data) {
    const lines = [];
    lines.push("# Exported by Tekto");
    lines.push(`# Vertices: ${data.positions.length}`);
    lines.push(`# Faces: ${data.faces.length}`);
    for (const v of data.positions)
      lines.push(`v ${f(v.x)} ${f(v.y)} ${f(v.z)}`);
    for (const vt of data.uvs)
      lines.push(`vt ${f(vt.x)} ${f(vt.y)}`);
    for (const vn of data.normals)
      lines.push(`vn ${f(vn.x)} ${f(vn.y)} ${f(vn.z)}`);
    const hasUV = data.uvs.length > 0;
    const hasNorm = data.normals.length > 0;
    for (const face of data.faces) {
      let line = "f";
      for (const idx of face) {
        const val = idx + 1;
        if (hasUV && hasNorm) line += ` ${val}/${val}/${val}`;
        else if (hasUV) line += ` ${val}/${val}`;
        else if (hasNorm) line += ` ${val}//${val}`;
        else line += ` ${val}`;
      }
      lines.push(line);
    }
    return lines.join("\n") + "\n";
  }
};
function f(v) {
  return v.toFixed(6).replace(/\.?0+$/, "");
}
function parseObjIndex(block, pCount, tCount, nCount) {
  const bits = block.split("/");
  let p = parseInt(bits[0], 10);
  let t = -1;
  let n = -1;
  if (bits.length > 1 && bits[1] !== "") t = parseInt(bits[1], 10);
  if (bits.length > 2 && bits[2] !== "") n = parseInt(bits[2], 10);
  if (p < 0) p = pCount + p;
  else p--;
  if (t < 0) t = tCount + t;
  else if (t > 0) t--;
  if (n < 0) n = nCount + n;
  else if (n > 0) n--;
  return { p, t, n };
}

// src/io/IdBufferHiddenLine.ts
import * as THREE from "three";
var ID_VERTEX_SHADER = (
  /* glsl */
  `
  attribute float objectId;
  varying float vId;
  void main() {
    vId = objectId;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
);
var ID_FRAGMENT_SHADER = (
  /* glsl */
  `
  precision highp float;
  varying float vId;
  void main() {
    int id = int(vId + 0.5);
    float r = float(id - (id / 256) * 256) / 255.0;
    int id2 = id / 256;
    float g = float(id2 - (id2 / 256) * 256) / 255.0;
    int id3 = id2 / 256;
    float b = float(id3 - (id3 / 256) * 256) / 255.0;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`
);
function hiddenLineIdBuffer(positions, indices, edges, _triNormals, view, options) {
  const resolution = options?.resolution ?? 2048;
  const debugLayers = options?.debugLayers ?? false;
  const preserveSet = new Set(options?.preserveLayers ?? []);
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  let fx = view.viewDir.x, fy = view.viewDir.y, fz = view.viewDir.z;
  const fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let rx = upDir.y * fz - upDir.z * fy;
  let ry = upDir.z * fx - upDir.x * fz;
  let rz = upDir.x * fy - upDir.y * fx;
  const rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
  function proj(x, y, z) {
    return {
      u: x * rx + y * ry + z * rz,
      v: x * ux + y * uy + z * uz,
      d: x * fx + y * fy + z * fz
    };
  }
  const nVerts = positions.length / 3;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  let minD = Infinity, maxD = -Infinity;
  for (let i = 0; i < nVerts; i++) {
    const p = proj(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    if (p.u < minU) minU = p.u;
    if (p.u > maxU) maxU = p.u;
    if (p.v < minV) minV = p.v;
    if (p.v > maxV) maxV = p.v;
    if (p.d < minD) minD = p.d;
    if (p.d > maxD) maxD = p.d;
  }
  const margin = Math.max(maxU - minU, maxV - minV) * 0.02;
  minU -= margin;
  maxU += margin;
  minV -= margin;
  maxV += margin;
  const depthRange = maxD - minD || 1;
  minD -= depthRange * 0.1;
  maxD += depthRange * 0.1;
  const nTri = indices.length / 3;
  const scene = new THREE.Scene();
  const camZ = -minD + 1;
  const farZ = -minD - -maxD + 2;
  const camera = new THREE.OrthographicCamera(minU, maxU, maxV, minV, 0.5, farZ);
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, camZ - 1);
  const triPositions = new Float32Array(nTri * 9);
  const objectIds = new Float32Array(nTri * 3);
  for (let ti = 0; ti < nTri; ti++) {
    const origId = ti + 1;
    for (let vi = 0; vi < 3; vi++) {
      const srcVtx = indices[ti * 3 + vi];
      const p = proj(positions[srcVtx * 3], positions[srcVtx * 3 + 1], positions[srcVtx * 3 + 2]);
      triPositions[ti * 9 + vi * 3] = p.u;
      triPositions[ti * 9 + vi * 3 + 1] = p.v;
      triPositions[ti * 9 + vi * 3 + 2] = -p.d;
      objectIds[ti * 3 + vi] = origId;
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(triPositions, 3));
  geom.setAttribute("objectId", new THREE.BufferAttribute(objectIds, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: ID_VERTEX_SHADER,
    fragmentShader: ID_FRAGMENT_SHADER,
    side: THREE.DoubleSide,
    // let GPU depth test decide, we already culled back-faces
    depthTest: true,
    depthWrite: true
  });
  scene.add(new THREE.Mesh(geom, material));
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(resolution, resolution);
  renderer.setClearColor(new THREE.Color(0, 0, 0), 0);
  const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType
  });
  renderer.setRenderTarget(renderTarget);
  renderer.clear();
  renderer.render(scene, camera);
  const pixels = new Uint8Array(resolution * resolution * 4);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, resolution, resolution, pixels);
  renderer.setRenderTarget(null);
  renderTarget.dispose();
  geom.dispose();
  material.dispose();
  try {
    renderer.forceContextLoss();
  } catch {
  }
  renderer.dispose();
  function readId(px, py) {
    if (px < 0 || px >= resolution || py < 0 || py >= resolution) return 0;
    const idx = (py * resolution + px) * 4;
    const a = pixels[idx + 3];
    if (a === 0) return 0;
    return pixels[idx] + (pixels[idx + 1] << 8) + (pixels[idx + 2] << 16);
  }
  function toPixel(u, v) {
    const px = (u - minU) / (maxU - minU) * resolution;
    const py = (v - minV) / (maxV - minV) * resolution;
    return [px, py];
  }
  const result = [];
  for (const edge of edges) {
    let isVisibleAt2 = function(px, py) {
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const id = readId(px + ox, py + oy);
          if (id === 0) return true;
          if (adjSet != null && adjSet.has(id - 1)) return true;
        }
      }
      return false;
    }, _emitRun2 = function(visible, t0, t1) {
      if (t1 - t0 < 1e-7) return;
      const u0 = ea.u + (eb.u - ea.u) * t0;
      const v0 = ea.v + (eb.v - ea.v) * t0;
      const u1 = ea.u + (eb.u - ea.u) * t1;
      const v1 = ea.v + (eb.v - ea.v) * t1;
      if (preserveSet.has(edge.layer)) {
        if (visible) result.push({ u0, v0, u1, v1, layer: edge.layer });
      } else if (visible) {
        const lyr = debugLayers ? isSilhouette ? "silhouette" : "visible" : edge.layer;
        result.push({ u0, v0, u1, v1, layer: lyr });
      } else if (debugLayers) {
        result.push({ u0, v0, u1, v1, layer: "occluded" });
      }
    };
    var isVisibleAt = isVisibleAt2, _emitRun = _emitRun2;
    const ea = proj(edge.ax, edge.ay, edge.az);
    const eb = proj(edge.bx, edge.by, edge.bz);
    const adjN = edge.adjNormals;
    let isSilhouette = false;
    if (adjN && adjN.length > 1) {
      const hasFrontFace = adjN.some((n) => n[0] * fx + n[1] * fy + n[2] * fz <= 0.087);
      const hasBackFace = adjN.some((n) => n[0] * fx + n[1] * fy + n[2] * fz > 0.087);
      if (!hasFrontFace) {
        if (debugLayers) {
          result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: "occluded" });
        }
        continue;
      }
      isSilhouette = hasFrontFace && hasBackFace;
    }
    const [px0, py0] = toPixel(ea.u, ea.v);
    const [px1, py1] = toPixel(eb.u, eb.v);
    const dx = px1 - px0, dy = py1 - py0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps < 1) {
      const id = readId(Math.round(px0), Math.round(py0));
      const adj2 = edge.adjTris;
      const isVis = id === 0 || adj2 != null && adj2.indexOf(id - 1) >= 0;
      if (preserveSet.has(edge.layer)) {
        if (isVis) result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: edge.layer });
      } else if (isVis) {
        const lyr = debugLayers ? isSilhouette ? "silhouette" : "visible" : edge.layer;
        result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: lyr });
      } else if (debugLayers) {
        result.push({ u0: ea.u, v0: ea.v, u1: eb.u, v1: eb.v, layer: "occluded" });
      }
      continue;
    }
    const adj = edge.adjTris;
    const adjSet = adj ? new Set(adj) : null;
    const nSamples = Math.ceil(steps);
    let prevVis = false;
    let runStart = 0;
    let firstSample = true;
    for (let s = 0; s <= nSamples; s++) {
      const t = Math.min(s / nSamples, 1);
      const px = Math.round(px0 + dx * t);
      const py = Math.round(py0 + dy * t);
      const isVis = isVisibleAt2(px, py);
      if (firstSample) {
        prevVis = isVis;
        runStart = t;
        firstSample = false;
        continue;
      }
      if (isVis !== prevVis) {
        const tEnd = t;
        _emitRun2(prevVis, runStart, tEnd);
        runStart = tEnd;
        prevVis = isVis;
      }
    }
    _emitRun2(prevVis, runStart, 1);
  }
  if (options?.flipU) {
    for (const s of result) {
      s.u0 = -s.u0;
      s.u1 = -s.u1;
    }
  }
  return result;
}

// src/io/DxfExporter.ts
var DxfExporter = class {
  constructor() {
    this._tris = [];
    /** Per-triangle face normal (parallel to _tris). null = normals unavailable. */
    this._triNormals = null;
    this._edges = [];
    /** Edges whose visibility depends on view direction (silhouette candidates). */
    this._silhouetteEdges = [];
    this._layers = /* @__PURE__ */ new Map();
  }
  /** Define a layer with color and line type. */
  layer(def) {
    this._layers.set(def.name, def);
    return this;
  }
  /**
   * Add a triangulated mesh. Extracts triangles for occlusion and
   * feature / boundary edges for drawing.
   */
  addMesh(positions, indices, options) {
    const layer = options?.layer ?? "0";
    const featAngle = options?.featureAngle ?? 30;
    const boundary = options?.boundary ?? true;
    const softEdgeLayer = options?.softEdgeLayer;
    const cosThresh = Math.cos(featAngle * Math.PI / 180);
    const nTri = indices.length / 3;
    const triBase = this._tris.length;
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      this._tris.push({
        ax: positions[i0],
        ay: positions[i0 + 1],
        az: positions[i0 + 2],
        bx: positions[i1],
        by: positions[i1 + 1],
        bz: positions[i1 + 2],
        cx: positions[i2],
        cy: positions[i2 + 1],
        cz: positions[i2 + 2]
      });
    }
    const QUANT = 1e6;
    const posKey = (vi) => {
      const o = vi * 3;
      return `${Math.round(positions[o] * QUANT)}:${Math.round(positions[o + 1] * QUANT)}:${Math.round(positions[o + 2] * QUANT)}`;
    };
    const weldMap = /* @__PURE__ */ new Map();
    const weld = (vi) => {
      const k = posKey(vi);
      const existing = weldMap.get(k);
      if (existing !== void 0) return existing;
      weldMap.set(k, vi);
      return vi;
    };
    const vtxTris = /* @__PURE__ */ new Map();
    const edgeMap = /* @__PURE__ */ new Map();
    const eKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
    for (let i = 0; i < nTri; i++) {
      const a = weld(indices[i * 3]), b = weld(indices[i * 3 + 1]), c = weld(indices[i * 3 + 2]);
      for (const v of [a, b, c]) {
        const arr = vtxTris.get(v);
        if (arr) arr.push(i);
        else vtxTris.set(v, [i]);
      }
      for (const [p, q] of [[a, b], [b, c], [c, a]]) {
        const k = eKey(p, q);
        const arr = edgeMap.get(k) ?? [];
        arr.push(i);
        edgeMap.set(k, arr);
      }
    }
    if (!this._triNormals) this._triNormals = new Array(this._tris.length - nTri).fill([0, 0, 0]);
    const fn = [];
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      const ux = positions[i1] - positions[i0], uy = positions[i1 + 1] - positions[i0 + 1], uz = positions[i1 + 2] - positions[i0 + 2];
      const vx = positions[i2] - positions[i0], vy = positions[i2 + 1] - positions[i0 + 1], vz = positions[i2 + 2] - positions[i0 + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const n = [nx / l, ny / l, nz / l];
      fn.push(n);
      this._triNormals.push(n);
    }
    for (const [key, tris] of edgeMap) {
      const [as, bs] = key.split(":");
      const aVtx = +as, bVtx = +bs;
      const ai = aVtx * 3, bi = bVtx * 3;
      let include = false;
      let kind;
      let edgeLayer = layer;
      const uniqueNormals = [];
      for (const t of tris) {
        const n = fn[t];
        const isDup = uniqueNormals.some((u) => {
          const nu = fn[u];
          return n[0] * nu[0] + n[1] * nu[1] + n[2] * nu[2] > 0.999;
        });
        if (!isDup) uniqueNormals.push(t);
      }
      if (tris.length === 1) {
        if (boundary) {
          include = true;
          kind = "boundary";
        }
      } else if (uniqueNormals.length === 1) {
        if (softEdgeLayer) {
          include = true;
          kind = "feature";
          edgeLayer = softEdgeLayer;
        }
      } else if (featAngle < 0) {
        include = true;
        kind = "feature";
      } else {
        let minDot = 1;
        for (let i = 0; i < uniqueNormals.length; i++) {
          for (let j = i + 1; j < uniqueNormals.length; j++) {
            const ni = fn[uniqueNormals[i]], nj = fn[uniqueNormals[j]];
            const d = ni[0] * nj[0] + ni[1] * nj[1] + ni[2] * nj[2];
            if (d < minDot) minDot = d;
          }
        }
        if (minDot < cosThresh) {
          include = true;
          kind = "feature";
        } else if (softEdgeLayer) {
          include = true;
          kind = "feature";
          edgeLayer = softEdgeLayer;
        }
      }
      if (include) {
        const ring1 = /* @__PURE__ */ new Set();
        const aTris = vtxTris.get(aVtx);
        if (aTris) for (const t of aTris) ring1.add(t);
        const bTris = vtxTris.get(bVtx);
        if (bTris) for (const t of bTris) ring1.add(t);
        const ring2 = /* @__PURE__ */ new Set();
        ring1.forEach((t) => ring2.add(t));
        ring1.forEach((t) => {
          const va = weld(indices[t * 3]), vb = weld(indices[t * 3 + 1]), vc = weld(indices[t * 3 + 2]);
          for (const v of [va, vb, vc]) {
            const vt = vtxTris.get(v);
            if (vt) for (const tt of vt) ring2.add(tt);
          }
        });
        const adjArr = [];
        ring2.forEach((t) => adjArr.push(triBase + t));
        this._edges.push({
          ax: positions[ai],
          ay: positions[ai + 1],
          az: positions[ai + 2],
          bx: positions[bi],
          by: positions[bi + 1],
          bz: positions[bi + 2],
          layer: edgeLayer,
          kind,
          adjTris: adjArr,
          adjNormals: uniqueNormals.map((t) => fn[t]),
          meshTriRange: [triBase, triBase + nTri]
        });
      }
    }
    return this;
  }
  /** Add triangles for occlusion only — edges NOT drawn. */
  addOccluder(positions, indices) {
    const nTri = indices.length / 3;
    for (let i = 0; i < nTri; i++) {
      const i0 = indices[i * 3] * 3, i1 = indices[i * 3 + 1] * 3, i2 = indices[i * 3 + 2] * 3;
      this._tris.push({
        ax: positions[i0],
        ay: positions[i0 + 1],
        az: positions[i0 + 2],
        bx: positions[i1],
        by: positions[i1 + 1],
        bz: positions[i1 + 2],
        cx: positions[i2],
        cy: positions[i2 + 1],
        cz: positions[i2 + 2]
      });
    }
    return this;
  }
  /** Add a polyline as a sequence of edges. */
  addPolyline(pts, options) {
    const layer = options?.layer ?? "0";
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      this._edges.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer });
    }
    return this;
  }
  /** Add a single edge. */
  addEdge(a, b, options) {
    this._edges.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer: options?.layer ?? "0" });
    return this;
  }
  /**
   * Add geometry from a BSP tree. Extracts occluder triangles, feature/boundary
   * edges, and silhouette edge candidates (view-dependent, resolved at export).
   *
   * BSP polygons have reliable normals, enabling back-face culling and silhouette
   * detection in the hidden-line pass.
   */
  addBspTree(bsp, options) {
    const layer = options?.layer ?? "0";
    const featAngle = options?.featureAngle ?? 30;
    const boundary = options?.boundary ?? true;
    const cosThresh = Math.cos(featAngle * Math.PI / 180);
    const polys = bsp.toPolygons();
    if (!this._triNormals) this._triNormals = new Array(this._tris.length).fill([0, 0, 0]);
    for (const p of polys) {
      const vs = p.vertices;
      if (vs.length < 3) continue;
      const n = p.plane.normal;
      const nArr = [n.x, n.y, n.z];
      for (let j = 1; j < vs.length - 1; j++) {
        this._tris.push({
          ax: vs[0].x,
          ay: vs[0].y,
          az: vs[0].z,
          bx: vs[j].x,
          by: vs[j].y,
          bz: vs[j].z,
          cx: vs[j + 1].x,
          cy: vs[j + 1].y,
          cz: vs[j + 1].z
        });
        this._triNormals.push(nArr);
      }
    }
    const QUANT = 1e5;
    const vKey = (v) => `${Math.round(v.x * QUANT)}:${Math.round(v.y * QUANT)}:${Math.round(v.z * QUANT)}`;
    const edgeMap = /* @__PURE__ */ new Map();
    for (let pi = 0; pi < polys.length; pi++) {
      const vs = polys[pi].vertices;
      for (let i = 0; i < vs.length; i++) {
        const j = (i + 1) % vs.length;
        const ka = vKey(vs[i]), kb = vKey(vs[j]);
        const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        let entry = edgeMap.get(key);
        if (!entry) {
          entry = { a: vs[i], b: vs[j], pis: [] };
          edgeMap.set(key, entry);
        }
        entry.pis.push(pi);
      }
    }
    for (const entry of edgeMap.values()) {
      const { a, b, pis } = entry;
      const ea = { ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, layer };
      if (pis.length === 1) {
        if (boundary) this._edges.push(ea);
      } else if (pis.length >= 2) {
        const n0 = polys[pis[0]].plane.normal;
        const n1 = polys[pis[1]].plane.normal;
        const dot = n0.x * n1.x + n0.y * n1.y + n0.z * n1.z;
        if (featAngle < 0 || dot < cosThresh) {
          this._edges.push(ea);
        } else {
          this._silhouetteEdges.push({
            ...ea,
            n0x: n0.x,
            n0y: n0.y,
            n0z: n0.z,
            n1x: n1.x,
            n1y: n1.y,
            n1z: n1.z
          });
        }
      }
    }
    return this;
  }
  /** Returns a serializable request object for Web Worker hidden-line computation. */
  toWorkerRequest(view, options) {
    const trisFlat = [];
    for (const t of this._tris) trisFlat.push(t.ax, t.ay, t.az, t.bx, t.by, t.bz, t.cx, t.cy, t.cz);
    const triNormalsFlat = this._triNormals ? this._triNormals.flatMap((n) => n) : void 0;
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    return {
      trisFlat,
      triNormalsFlat,
      edges: [...allEdges],
      layers: [...this._layers.values()],
      viewDir: [view.viewDir.x, view.viewDir.y, view.viewDir.z],
      upDir: [upDir.x, upDir.y, upDir.z],
      scale: options?.scale ?? 1e3,
      precision: options?.precision ?? 3,
      depthBias: options?.depthBias
    };
  }
  /** Return raw projected segments with layer classification (for live preview). */
  toSegments(view, options) {
    const bias = options?.depthBias;
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    if (options?.debugLayers) {
      return _hiddenLineDebug(this._tris, allEdges, view, this._triNormals, bias);
    }
    if (options?.hiddenLine !== false) {
      return _hiddenLine(this._tris, allEdges, view, void 0, this._triNormals, bias);
    }
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const b = _basis(view.viewDir, upDir);
    const segs = [];
    for (const e of allEdges) {
      const u0 = e.ax * b.rx + e.ay * b.ry + e.az * b.rz;
      const v0 = e.ax * b.ux + e.ay * b.uy + e.az * b.uz;
      const u1 = e.bx * b.rx + e.by * b.ry + e.bz * b.rz;
      const v1 = e.bx * b.ux + e.by * b.uy + e.bz * b.uz;
      const du = u1 - u0, dv = v1 - v0;
      if (du * du + dv * dv < 1e-12) continue;
      segs.push({ u0, v0, u1, v1, layer: e.layer });
    }
    return segs;
  }
  /** Project edges and write DXF. Runs hidden-line removal unless hiddenLine=false. */
  toDxf(view, options) {
    const scale = options?.scale ?? 1e3;
    const prec = options?.precision ?? 3;
    const doHL = options?.hiddenLine !== false;
    const bias = options?.depthBias ?? 0.01;
    if (options?.debugLayers) {
      const allEdges2 = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
      const debugSegs = _hiddenLineDebug(this._tris, allEdges2, view, this._triNormals, bias);
      const debugLayerDefs = [
        ...this._layers.values(),
        { name: "visible", color: 3 },
        // green
        { name: "occluded", color: 1 },
        // red
        { name: "feature", color: 5 },
        // blue
        { name: "boundary", color: 2 },
        // yellow
        { name: "silhouette", color: 4 }
        // cyan
      ];
      return _writeDxf(debugSegs, debugLayerDefs, scale, prec);
    }
    if (doHL) {
      const allEdges2 = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
      const segs2 = _hiddenLine(this._tris, allEdges2, view, void 0, this._triNormals, bias);
      return _writeDxf(segs2, [...this._layers.values()], scale, prec);
    }
    const upDir = view.upDir ?? new Vec3(0, 0, 1);
    const b = _basis(view.viewDir, upDir);
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    const segs = [];
    for (const e of allEdges) {
      const u0 = e.ax * b.rx + e.ay * b.ry + e.az * b.rz;
      const v0 = e.ax * b.ux + e.ay * b.uy + e.az * b.uz;
      const u1 = e.bx * b.rx + e.by * b.ry + e.bz * b.rz;
      const v1 = e.bx * b.ux + e.by * b.uy + e.bz * b.uz;
      const du = u1 - u0, dv = v1 - v0;
      if (du * du + dv * dv < 1e-12) continue;
      segs.push({ u0, v0, u1, v1, layer: e.layer });
    }
    return _writeDxf(segs, [...this._layers.values()], scale, prec);
  }
  /**
   * GPU-accelerated hidden-line removal using ID buffer rendering.
   * Returns projected segments — same output as toSegments() but uses the GPU
   * for visibility, which handles intersecting/overlapping meshes naturally.
   * Requires Three.js.
   */
  toSegmentsGpu(view, options) {
    const allEdges = _withSilhouettes(this._edges, this._silhouetteEdges, view.viewDir);
    const nTri = this._tris.length;
    const positions = new Float32Array(nTri * 9);
    const indices = new Uint32Array(nTri * 3);
    for (let i = 0; i < nTri; i++) {
      const t = this._tris[i];
      const o = i * 9;
      positions[o] = t.ax;
      positions[o + 1] = t.ay;
      positions[o + 2] = t.az;
      positions[o + 3] = t.bx;
      positions[o + 4] = t.by;
      positions[o + 5] = t.bz;
      positions[o + 6] = t.cx;
      positions[o + 7] = t.cy;
      positions[o + 8] = t.cz;
      indices[i * 3] = i * 3;
      indices[i * 3 + 1] = i * 3 + 1;
      indices[i * 3 + 2] = i * 3 + 2;
    }
    return hiddenLineIdBuffer(positions, indices, allEdges, this._triNormals, view, options);
  }
  /**
   * GPU-accelerated hidden-line DXF export.
   * Same as toDxf() but uses GPU ID buffer for visibility testing.
   * Requires Three.js.
   */
  toDxfGpu(view, options) {
    const scale = options?.scale ?? 1e3;
    const prec = options?.precision ?? 3;
    const segs = this.toSegmentsGpu(view, {
      resolution: options?.resolution ?? 4096,
      debugLayers: options?.debugLayers,
      flipU: options?.flipU
    });
    const layers = [...this._layers.values()];
    if (options?.debugLayers) {
      layers.push(
        { name: "visible", color: 3 },
        { name: "occluded", color: 1 },
        { name: "feature", color: 5 },
        { name: "boundary", color: 2 },
        { name: "silhouette", color: 4 }
      );
    }
    return _writeDxf(segs, layers, scale, prec);
  }
  /** Write DXF from pre-computed segments (e.g. merged from multiple sources). */
  toDxfFromSegments(segs, options) {
    return _writeDxf(segs, [...this._layers.values()], options?.scale ?? 1e3, options?.precision ?? 3);
  }
  /** Return edge counts grouped by layer name. Useful for debugging edge classification. */
  debugEdgeCounts() {
    const counts = {};
    for (const e of this._edges) counts[e.layer] = (counts[e.layer] ?? 0) + 1;
    return counts;
  }
  /** Clear all geometry (reuse the exporter for a different view). */
  clear() {
    this._tris = [];
    this._triNormals = null;
    this._edges = [];
    this._silhouetteEdges = [];
    return this;
  }
};
function _withSilhouettes(edges, silhouettes, viewDir) {
  if (silhouettes.length === 0) return edges;
  const vx = viewDir.x, vy = viewDir.y, vz = viewDir.z;
  const result = [...edges];
  for (const s of silhouettes) {
    const d0 = s.n0x * vx + s.n0y * vy + s.n0z * vz;
    const d1 = s.n1x * vx + s.n1y * vy + s.n1z * vz;
    if (d0 < 0 !== d1 < 0) {
      result.push(s);
    }
  }
  return result;
}
function _basis(viewDir, upDir) {
  let fx = viewDir.x, fy = viewDir.y, fz = viewDir.z;
  const fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let rx = upDir.y * fz - upDir.z * fy;
  let ry = upDir.z * fx - upDir.x * fz;
  let rz = upDir.x * fy - upDir.y * fx;
  const rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
  return { rx, ry, rz, ux, uy, uz, fx, fy, fz };
}
function _proj(x, y, z, b) {
  return {
    u: x * b.rx + y * b.ry + z * b.rz,
    v: x * b.ux + y * b.uy + z * b.uz,
    d: x * b.fx + y * b.fy + z * b.fz
  };
}
var _c2 = (ax, ay, bx, by) => ax * by - ay * bx;
function _clipTri(p0u, p0v, p1u, p1v, t0u, t0v, t1u, t1v, t2u, t2v) {
  const du = p1u - p0u, dv = p1v - p0v;
  let tEn = 0, tEx = 1;
  const edges = [
    [t0u, t0v, t1u, t1v],
    [t1u, t1v, t2u, t2v],
    [t2u, t2v, t0u, t0v]
  ];
  for (const [qu, qv, ru, rv] of edges) {
    const nx = -(rv - qv), ny = ru - qu;
    const num = nx * (qu - p0u) + ny * (qv - p0v);
    const den = nx * du + ny * dv;
    if (Math.abs(den) < 1e-12) {
      if (num < -1e-8) return null;
      continue;
    }
    const t = num / den;
    if (den > 0) tEn = Math.max(tEn, t);
    else tEx = Math.min(tEx, t);
    if (tEn > tEx + 1e-8) return null;
  }
  tEn = Math.max(0, tEn);
  tEx = Math.min(1, tEx);
  return tEn < tEx - 1e-6 ? [tEn, tEx] : null;
}
function _subInterval(vis, a, b) {
  const out = [];
  for (const [lo, hi] of vis) {
    if (b <= lo + 1e-7 || a >= hi - 1e-7) {
      out.push([lo, hi]);
      continue;
    }
    if (a > lo + 1e-7) out.push([lo, a]);
    if (b < hi - 1e-7) out.push([b, hi]);
  }
  return out;
}
function processWorkerRequest(req, onProgress) {
  const tris = [];
  for (let i = 0; i < req.trisFlat.length; i += 9) {
    tris.push({
      ax: req.trisFlat[i],
      ay: req.trisFlat[i + 1],
      az: req.trisFlat[i + 2],
      bx: req.trisFlat[i + 3],
      by: req.trisFlat[i + 4],
      bz: req.trisFlat[i + 5],
      cx: req.trisFlat[i + 6],
      cy: req.trisFlat[i + 7],
      cz: req.trisFlat[i + 8]
    });
  }
  let triNormals = null;
  if (req.triNormalsFlat) {
    triNormals = [];
    for (let i = 0; i < req.triNormalsFlat.length; i += 3) {
      triNormals.push([req.triNormalsFlat[i], req.triNormalsFlat[i + 1], req.triNormalsFlat[i + 2]]);
    }
  }
  const view = {
    viewDir: new Vec3(req.viewDir[0], req.viewDir[1], req.viewDir[2]),
    upDir: new Vec3(req.upDir[0], req.upDir[1], req.upDir[2])
  };
  const segs = _hiddenLine(tris, req.edges, view, onProgress, triNormals, req.depthBias);
  return _writeDxf(segs, req.layers, req.scale, req.precision);
}
var BVH_LEAF_MAX = 8;
function _buildBvh2D(stris) {
  const n = stris.length;
  const triOrder = new Array(n);
  for (let i = 0; i < n; i++) triOrder[i] = i;
  const nodes = [];
  function build(start, count) {
    let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
    for (let i = start; i < start + count; i++) {
      const t = stris[triOrder[i]];
      if (t.minU < minU) minU = t.minU;
      if (t.maxU > maxU) maxU = t.maxU;
      if (t.minV < minV) minV = t.minV;
      if (t.maxV > maxV) maxV = t.maxV;
    }
    if (count <= BVH_LEAF_MAX) {
      const idx2 = nodes.length;
      nodes.push({ minU, minV, maxU, maxV, rightOff: 0, start, count });
      return idx2;
    }
    const splitU = maxU - minU >= maxV - minV;
    const mid = start + (count >> 1);
    _nthElement(triOrder, start, start + count - 1, mid, stris, splitU);
    const idx = nodes.length;
    nodes.push({ minU, minV, maxU, maxV, rightOff: 0, start: 0, count: 0 });
    build(start, mid - start);
    const rightIdx = build(mid, start + count - mid);
    nodes[idx].rightOff = rightIdx - idx;
    return idx;
  }
  if (n > 0) build(0, n);
  return { nodes, triOrder };
}
function _triCentroid(stris, idx, splitU) {
  const t = stris[idx];
  return splitU ? t.minU + t.maxU : t.minV + t.maxV;
}
function _nthElement(order, lo, hi, nth, stris, splitU) {
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (_triCentroid(stris, order[lo], splitU) > _triCentroid(stris, order[mid], splitU)) {
      const tmp = order[lo];
      order[lo] = order[mid];
      order[mid] = tmp;
    }
    if (_triCentroid(stris, order[lo], splitU) > _triCentroid(stris, order[hi], splitU)) {
      const tmp = order[lo];
      order[lo] = order[hi];
      order[hi] = tmp;
    }
    if (_triCentroid(stris, order[mid], splitU) > _triCentroid(stris, order[hi], splitU)) {
      const tmp = order[mid];
      order[mid] = order[hi];
      order[hi] = tmp;
    }
    {
      const tmp = order[mid];
      order[mid] = order[hi - 1];
      order[hi - 1] = tmp;
    }
    const pivotVal = _triCentroid(stris, order[hi - 1], splitU);
    let i = lo, j = hi - 1;
    for (; ; ) {
      while (_triCentroid(stris, order[++i], splitU) < pivotVal) {
      }
      while (_triCentroid(stris, order[--j], splitU) > pivotVal) {
      }
      if (i >= j) break;
      {
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }
    }
    {
      const tmp = order[i];
      order[i] = order[hi - 1];
      order[hi - 1] = tmp;
    }
    if (i === nth) return;
    if (nth < i) hi = i - 1;
    else lo = i + 1;
  }
}
function _queryBvh(bvh, qMinU, qMinV, qMaxU, qMaxV, out) {
  const { nodes, triOrder } = bvh;
  if (nodes.length === 0) return;
  const stack = [0];
  while (stack.length > 0) {
    const ni = stack.pop();
    const nd = nodes[ni];
    if (qMaxU < nd.minU || qMinU > nd.maxU || qMaxV < nd.minV || qMinV > nd.maxV) continue;
    if (nd.rightOff === 0) {
      for (let i = nd.start, end = nd.start + nd.count; i < end; i++) {
        out.push(triOrder[i]);
      }
    } else {
      stack.push(ni + 1);
      stack.push(ni + nd.rightOff);
    }
  }
}
function _buildBvh3D(tris, indices) {
  const n = indices.length;
  const triOrder = indices.slice();
  const nodes = [];
  const cx = new Float64Array(tris.length);
  const cy = new Float64Array(tris.length);
  const cz = new Float64Array(tris.length);
  for (let i = 0; i < tris.length; i++) {
    const t = tris[i];
    cx[i] = (t.ax + t.bx + t.cx) / 3;
    cy[i] = (t.ay + t.by + t.cy) / 3;
    cz[i] = (t.az + t.bz + t.cz) / 3;
  }
  function build(start, count) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = start; i < start + count; i++) {
      const t = tris[triOrder[i]];
      minX = Math.min(minX, t.ax, t.bx, t.cx);
      minY = Math.min(minY, t.ay, t.by, t.cy);
      minZ = Math.min(minZ, t.az, t.bz, t.cz);
      maxX = Math.max(maxX, t.ax, t.bx, t.cx);
      maxY = Math.max(maxY, t.ay, t.by, t.cy);
      maxZ = Math.max(maxZ, t.az, t.bz, t.cz);
    }
    if (count <= BVH_LEAF_MAX) {
      const idx2 = nodes.length;
      nodes.push({ minX, minY, minZ, maxX, maxY, maxZ, rightOff: 0, start, count });
      return idx2;
    }
    const sx = maxX - minX, sy = maxY - minY, sz = maxZ - minZ;
    const axis = sx >= sy && sx >= sz ? 0 : sy >= sz ? 1 : 2;
    const cArr = axis === 0 ? cx : axis === 1 ? cy : cz;
    const mid = start + (count >> 1);
    _nthElement3D(triOrder, start, start + count - 1, mid, cArr);
    const idx = nodes.length;
    nodes.push({ minX, minY, minZ, maxX, maxY, maxZ, rightOff: 0, start: 0, count: 0 });
    build(start, mid - start);
    const rightIdx = build(mid, start + count - mid);
    nodes[idx].rightOff = rightIdx - idx;
    return idx;
  }
  if (n > 0) build(0, n);
  return { nodes, triOrder };
}
function _nthElement3D(order, lo, hi, nth, vals) {
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (vals[order[lo]] > vals[order[mid]]) {
      const t = order[lo];
      order[lo] = order[mid];
      order[mid] = t;
    }
    if (vals[order[lo]] > vals[order[hi]]) {
      const t = order[lo];
      order[lo] = order[hi];
      order[hi] = t;
    }
    if (vals[order[mid]] > vals[order[hi]]) {
      const t = order[mid];
      order[mid] = order[hi];
      order[hi] = t;
    }
    {
      const t = order[mid];
      order[mid] = order[hi - 1];
      order[hi - 1] = t;
    }
    const pivotVal = vals[order[hi - 1]];
    let i = lo, j = hi - 1;
    for (; ; ) {
      while (vals[order[++i]] < pivotVal) {
      }
      while (vals[order[--j]] > pivotVal) {
      }
      if (i >= j) break;
      {
        const t = order[i];
        order[i] = order[j];
        order[j] = t;
      }
    }
    {
      const t = order[i];
      order[i] = order[hi - 1];
      order[hi - 1] = t;
    }
    if (i === nth) return;
    if (nth < i) hi = i - 1;
    else lo = i + 1;
  }
}
function _rayAabb(ox, oy, oz, invDx, invDy, invDz, node) {
  let tmin = ((invDx >= 0 ? node.minX : node.maxX) - ox) * invDx;
  let tmax = ((invDx >= 0 ? node.maxX : node.minX) - ox) * invDx;
  const tymin = ((invDy >= 0 ? node.minY : node.maxY) - oy) * invDy;
  const tymax = ((invDy >= 0 ? node.maxY : node.minY) - oy) * invDy;
  if (tmin > tymax || tymin > tmax) return false;
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;
  const tzmin = ((invDz >= 0 ? node.minZ : node.maxZ) - oz) * invDz;
  const tzmax = ((invDz >= 0 ? node.maxZ : node.minZ) - oz) * invDz;
  if (tmin > tzmax || tzmin > tmax) return false;
  if (tzmin > tmin) tmin = tzmin;
  if (tzmax < tmax) tmax = tzmax;
  return tmax >= 0 && tmin <= tmax;
}
function _rayTri(ox, oy, oz, dx, dy, dz, t) {
  const e1x = t.bx - t.ax, e1y = t.by - t.ay, e1z = t.bz - t.az;
  const e2x = t.cx - t.ax, e2y = t.cy - t.ay, e2z = t.cz - t.az;
  const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x;
  const a = e1x * hx + e1y * hy + e1z * hz;
  if (a > -1e-10 && a < 1e-10) return -1;
  const f2 = 1 / a;
  const sx = ox - t.ax, sy = oy - t.ay, sz = oz - t.az;
  const u = f2 * (sx * hx + sy * hy + sz * hz);
  if (u < -1e-6 || u > 1 + 1e-6) return -1;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
  const v = f2 * (dx * qx + dy * qy + dz * qz);
  if (v < -1e-6 || u + v > 1 + 1e-6) return -1;
  const tt = f2 * (e2x * qx + e2y * qy + e2z * qz);
  return tt > 1e-6 ? tt : -1;
}
function _isOccluded3D(ox, oy, oz, dx, dy, dz, bvh, allTris, adjTris) {
  const { nodes, triOrder } = bvh;
  if (nodes.length === 0) return false;
  const invDx = 1 / dx, invDy = 1 / dy, invDz = 1 / dz;
  const stack = [0];
  while (stack.length > 0) {
    const ni = stack.pop();
    const nd = nodes[ni];
    if (!_rayAabb(ox, oy, oz, invDx, invDy, invDz, nd)) continue;
    if (nd.rightOff === 0) {
      for (let i = nd.start, end = nd.start + nd.count; i < end; i++) {
        const ti = triOrder[i];
        if (adjTris && adjTris.indexOf(ti) >= 0) continue;
        const t = _rayTri(ox, oy, oz, dx, dy, dz, allTris[ti]);
        if (t > 0) return true;
      }
    } else {
      stack.push(ni + 1);
      stack.push(ni + nd.rightOff);
    }
  }
  return false;
}
function _hiddenLine(tris, edges, view, onProgress, triNormals, _depthBias) {
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  const b = _basis(view.viewDir, upDir);
  const hasNormals = triNormals != null && triNormals.length === tris.length;
  const frontIdx = [];
  const stris = [];
  for (let ti = 0; ti < tris.length; ti++) {
    if (hasNormals) {
      const n = triNormals[ti];
      if (n[0] * b.fx + n[1] * b.fy + n[2] * b.fz > 0) continue;
    }
    frontIdx.push(ti);
    const tri = tris[ti];
    const pa = _proj(tri.ax, tri.ay, tri.az, b);
    const pb = _proj(tri.bx, tri.by, tri.bz, b);
    const pc = _proj(tri.cx, tri.cy, tri.cz, b);
    const cross = _c2(pb.u - pa.u, pb.v - pa.v, pc.u - pa.u, pc.v - pa.v);
    if (Math.abs(cross) < 1e-10) continue;
    const p1 = cross > 0 ? pb : pc;
    const p2 = cross > 0 ? pc : pb;
    stris.push({
      p: [pa, p1, p2],
      avgD: (pa.d + pb.d + pc.d) / 3,
      minU: Math.min(pa.u, pb.u, pc.u),
      maxU: Math.max(pa.u, pb.u, pc.u),
      minV: Math.min(pa.v, pb.v, pc.v),
      maxV: Math.max(pa.v, pb.v, pc.v),
      srcIdx: ti
    });
  }
  stris.sort((a, z) => a.avgD - z.avgD);
  const bvh2d = _buildBvh2D(stris);
  const bvh3d = _buildBvh3D(tris, frontIdx);
  const rdx = -b.fx, rdy = -b.fy, rdz = -b.fz;
  const result = [];
  const nEdges = edges.length;
  const candBuf = [];
  for (let ei = 0; ei < nEdges; ei++) {
    if (onProgress && (ei & 63) === 0) onProgress(ei / nEdges);
    const edge = edges[ei];
    const ea = _proj(edge.ax, edge.ay, edge.az, b);
    const eb = _proj(edge.bx, edge.by, edge.bz, b);
    const adjN = edge.adjNormals;
    const hasFrontFace = !adjN || adjN.length === 0 || adjN.some((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    const allFrontFaces = adjN && adjN.length > 0 && adjN.every((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    let vis;
    if (!hasFrontFace) {
      vis = [];
    } else if (allFrontFaces) {
      vis = [[0, 1]];
    } else {
      vis = [[0, 1]];
    }
    if (vis.length > 0 && !allFrontFaces) {
      const adj = edge.adjTris;
      const eMinU = Math.min(ea.u, eb.u), eMaxU = Math.max(ea.u, eb.u);
      const eMinV = Math.min(ea.v, eb.v), eMaxV = Math.max(ea.v, eb.v);
      candBuf.length = 0;
      _queryBvh(bvh2d, eMinU, eMinV, eMaxU, eMaxV, candBuf);
      for (let ci = 0; ci < candBuf.length; ci++) {
        if (!vis.length) break;
        const tri = stris[candBuf[ci]];
        if (adj && adj.indexOf(tri.srcIdx) >= 0) continue;
        const [ta, tb, tc] = tri.p;
        const interval = _clipTri(
          ea.u,
          ea.v,
          eb.u,
          eb.v,
          ta.u,
          ta.v,
          tb.u,
          tb.v,
          tc.u,
          tc.v
        );
        if (!interval) continue;
        const tM = (interval[0] + interval[1]) * 0.5;
        const px = edge.ax + (edge.bx - edge.ax) * tM;
        const py = edge.ay + (edge.by - edge.ay) * tM;
        const pz = edge.az + (edge.bz - edge.az) * tM;
        if (!_isOccluded3D(px, py, pz, rdx, rdy, rdz, bvh3d, tris, adj)) continue;
        vis = _subInterval(vis, interval[0], interval[1]);
      }
    }
    for (const [t0, t1] of vis) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * t0,
        v0: ea.v + (eb.v - ea.v) * t0,
        u1: ea.u + (eb.u - ea.u) * t1,
        v1: ea.v + (eb.v - ea.v) * t1,
        layer: edge.layer
      });
    }
  }
  return result;
}
function _hiddenLineDebug(tris, edges, view, triNormals, _depthBias) {
  const upDir = view.upDir ?? new Vec3(0, 0, 1);
  const b = _basis(view.viewDir, upDir);
  const hasNormals = triNormals != null && triNormals.length === tris.length;
  const frontIdx = [];
  const stris = [];
  for (let ti = 0; ti < tris.length; ti++) {
    if (hasNormals) {
      const n = triNormals[ti];
      if (n[0] * b.fx + n[1] * b.fy + n[2] * b.fz > 0) continue;
    }
    frontIdx.push(ti);
    const tri = tris[ti];
    const pa = _proj(tri.ax, tri.ay, tri.az, b);
    const pb = _proj(tri.bx, tri.by, tri.bz, b);
    const pc = _proj(tri.cx, tri.cy, tri.cz, b);
    const cross = _c2(pb.u - pa.u, pb.v - pa.v, pc.u - pa.u, pc.v - pa.v);
    if (Math.abs(cross) < 1e-10) continue;
    const p1 = cross > 0 ? pb : pc;
    const p2 = cross > 0 ? pc : pb;
    stris.push({
      p: [pa, p1, p2],
      avgD: (pa.d + pb.d + pc.d) / 3,
      minU: Math.min(pa.u, pb.u, pc.u),
      maxU: Math.max(pa.u, pb.u, pc.u),
      minV: Math.min(pa.v, pb.v, pc.v),
      maxV: Math.max(pa.v, pb.v, pc.v),
      srcIdx: ti
    });
  }
  stris.sort((a, z) => a.avgD - z.avgD);
  const bvh2d = _buildBvh2D(stris);
  const bvh3d = _buildBvh3D(tris, frontIdx);
  const rdx = -b.fx, rdy = -b.fy, rdz = -b.fz;
  const result = [];
  const candBuf = [];
  for (const edge of edges) {
    const ea = _proj(edge.ax, edge.ay, edge.az, b);
    const eb = _proj(edge.bx, edge.by, edge.bz, b);
    const kindLayer = edge.kind ?? "feature";
    result.push({
      u0: ea.u,
      v0: ea.v,
      u1: eb.u,
      v1: eb.v,
      layer: kindLayer
    });
    const adjN = edge.adjNormals;
    const hasFrontFace = !adjN || adjN.length === 0 || adjN.some((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    const allFrontFaces = adjN && adjN.length > 0 && adjN.every((n) => n[0] * b.fx + n[1] * b.fy + n[2] * b.fz <= 0);
    let vis;
    if (!hasFrontFace) {
      vis = [];
    } else if (allFrontFaces) {
      vis = [[0, 1]];
    } else {
      vis = [[0, 1]];
    }
    if (vis.length > 0 && !allFrontFaces) {
      const adj = edge.adjTris;
      candBuf.length = 0;
      _queryBvh(
        bvh2d,
        Math.min(ea.u, eb.u),
        Math.min(ea.v, eb.v),
        Math.max(ea.u, eb.u),
        Math.max(ea.v, eb.v),
        candBuf
      );
      for (let ci = 0; ci < candBuf.length; ci++) {
        if (!vis.length) break;
        const tri = stris[candBuf[ci]];
        if (adj && adj.indexOf(tri.srcIdx) >= 0) continue;
        const [ta, tb, tc] = tri.p;
        const interval = _clipTri(ea.u, ea.v, eb.u, eb.v, ta.u, ta.v, tb.u, tb.v, tc.u, tc.v);
        if (!interval) continue;
        const tM = (interval[0] + interval[1]) * 0.5;
        const px = edge.ax + (edge.bx - edge.ax) * tM;
        const py = edge.ay + (edge.by - edge.ay) * tM;
        const pz = edge.az + (edge.bz - edge.az) * tM;
        if (!_isOccluded3D(px, py, pz, rdx, rdy, rdz, bvh3d, tris, adj)) continue;
        vis = _subInterval(vis, interval[0], interval[1]);
      }
    }
    for (const [t0, t1] of vis) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * t0,
        v0: ea.v + (eb.v - ea.v) * t0,
        u1: ea.u + (eb.u - ea.u) * t1,
        v1: ea.v + (eb.v - ea.v) * t1,
        layer: "visible"
      });
    }
    let prev = 0;
    for (const [t0, t1] of vis) {
      if (t0 > prev + 1e-7) {
        result.push({
          u0: ea.u + (eb.u - ea.u) * prev,
          v0: ea.v + (eb.v - ea.v) * prev,
          u1: ea.u + (eb.u - ea.u) * t0,
          v1: ea.v + (eb.v - ea.v) * t0,
          layer: "occluded"
        });
      }
      prev = t1;
    }
    if (prev < 1 - 1e-7) {
      result.push({
        u0: ea.u + (eb.u - ea.u) * prev,
        v0: ea.v + (eb.v - ea.v) * prev,
        u1: eb.u,
        v1: eb.v,
        layer: "occluded"
      });
    }
  }
  return result;
}
function _writeDxf(segs, layers, scale, prec) {
  const f2 = (n) => (n * scale).toFixed(prec);
  const lines = [];
  if (layers.length > 0) {
    lines.push("0", "SECTION", "2", "TABLES");
    lines.push("0", "TABLE", "2", "LAYER", "70", String(layers.length));
    for (const l of layers) {
      lines.push("0", "LAYER", "2", l.name, "70", "0", "62", String(l.color ?? 7), "6", l.lineType ?? "CONTINUOUS");
    }
    lines.push("0", "ENDTAB");
    lines.push("0", "ENDSEC");
  }
  lines.push("0", "SECTION", "2", "ENTITIES");
  for (const s of segs) {
    lines.push(
      "0",
      "LINE",
      "8",
      s.layer,
      "10",
      f2(s.u0),
      "20",
      f2(s.v0),
      "30",
      "0.0",
      "11",
      f2(s.u1),
      "21",
      f2(s.v1),
      "31",
      "0.0"
    );
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\r\n") + "\r\n";
}

// src/io/PolylineVisibility.ts
import * as THREE2 from "three";
var DEPTH_PACK = (
  /* glsl */
  `
  vec4 packDepth(float d) {
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
    vec4 res = fract(d * bitShift);
    res -= res.xxyz * bitMask;
    return res;
  }
`
);
var VS = (
  /* glsl */
  `
  varying float vDepth01;
  uniform float uMinD;
  uniform float uMaxD;
  void main() {
    // CPU side stored position.z = -d (negated so the ortho camera looking
    // along -Z renders closer-to-camera as nearer). Un-flip here to read
    // the original view-space depth.
    float vd = -position.z;
    vDepth01 = clamp((vd - uMinD) / (uMaxD - uMinD), 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
);
var FS = (
  /* glsl */
  `
  precision highp float;
  varying float vDepth01;
  ${DEPTH_PACK}
  void main() { gl_FragColor = packDepth(vDepth01); }
`
);
function extractVisiblePolylines(mesh, polylines, view, options) {
  const resolution = options?.resolution ?? 1024;
  const biasFraction = options?.bias ?? 5e-3;
  const up = view.upDir ?? new Vec3(0, 1, 0);
  let fx = view.viewDir.x, fy = view.viewDir.y, fz = view.viewDir.z;
  {
    const l = Math.hypot(fx, fy, fz) || 1;
    fx /= l;
    fy /= l;
    fz /= l;
  }
  let rx = up.y * fz - up.z * fy;
  let ry = up.z * fx - up.x * fz;
  let rz = up.x * fy - up.y * fx;
  {
    const l = Math.hypot(rx, ry, rz) || 1;
    rx /= l;
    ry /= l;
    rz /= l;
  }
  const ux = fy * rz - fz * ry;
  const uy = fz * rx - fx * rz;
  const uz = fx * ry - fy * rx;
  const proj = (x, y, z) => ({
    u: x * rx + y * ry + z * rz,
    v: x * ux + y * uy + z * uz,
    d: x * fx + y * fy + z * fz
  });
  let minU = Infinity, maxU = -Infinity;
  let minV = Infinity, maxV = -Infinity;
  let minD = Infinity, maxD = -Infinity;
  const verts = [];
  for (const face of mesh.faces()) {
    if (face.nodes.length < 3) continue;
    const ps = face.nodes.map((id) => mesh.node(id).position);
    const p0 = ps[0];
    for (let i = 1; i < ps.length - 1; i++) {
      const a = p0, b = ps[i], c = ps[i + 1];
      for (const p of [a, b, c]) {
        const pr = proj(p.x, p.y, p.z);
        verts.push(pr.u, pr.v, pr.d);
        if (pr.u < minU) minU = pr.u;
        if (pr.u > maxU) maxU = pr.u;
        if (pr.v < minV) minV = pr.v;
        if (pr.v > maxV) maxV = pr.v;
        if (pr.d < minD) minD = pr.d;
        if (pr.d > maxD) maxD = pr.d;
      }
    }
  }
  if (verts.length === 0) {
    return { segments: [], bounds: { minU: 0, maxU: 0, minV: 0, maxV: 0 } };
  }
  const sceneSize = Math.max(maxU - minU, maxV - minV);
  const margin = sceneSize * 0.02;
  minU -= margin;
  maxU += margin;
  minV -= margin;
  maxV += margin;
  const depthRange = maxD - minD || 1;
  const depthPad = depthRange * 0.1;
  minD -= depthPad;
  maxD += depthPad;
  const triPositions = new Float32Array(verts);
  const geo = new THREE2.BufferGeometry();
  geo.setAttribute("position", new THREE2.BufferAttribute(triPositions, 3));
  for (let i = 2; i < triPositions.length; i += 3) triPositions[i] = -triPositions[i];
  geo.attributes.position.needsUpdate = true;
  const material = new THREE2.ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    side: THREE2.DoubleSide,
    depthTest: true,
    depthWrite: true,
    uniforms: { uMinD: { value: minD }, uMaxD: { value: maxD } }
  });
  const scene = new THREE2.Scene();
  scene.add(new THREE2.Mesh(geo, material));
  const camZ = -minD + 1;
  const farZ = maxD - minD + 2;
  const camera = new THREE2.OrthographicCamera(minU, maxU, maxV, minV, 0.5, farZ);
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, camZ - 1);
  const renderer = new THREE2.WebGLRenderer({ antialias: false });
  renderer.setSize(resolution, resolution);
  renderer.setClearColor(new THREE2.Color(0, 0, 0), 0);
  const rt = new THREE2.WebGLRenderTarget(resolution, resolution, {
    minFilter: THREE2.NearestFilter,
    magFilter: THREE2.NearestFilter,
    format: THREE2.RGBAFormat,
    type: THREE2.UnsignedByteType
  });
  renderer.setRenderTarget(rt);
  renderer.clear();
  renderer.render(scene, camera);
  const pixels = new Uint8Array(resolution * resolution * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, resolution, resolution, pixels);
  renderer.setRenderTarget(null);
  rt.dispose();
  geo.dispose();
  material.dispose();
  renderer.dispose();
  function unpackDepth01(px, py) {
    if (px < 0 || px >= resolution || py < 0 || py >= resolution) return null;
    const idx = (py * resolution + px) * 4;
    if (pixels[idx + 3] === 0) return null;
    const r = pixels[idx] / 255;
    const g = pixels[idx + 1] / 255;
    const b = pixels[idx + 2] / 255;
    const a = pixels[idx + 3] / 255;
    return r / (256 * 256 * 256) + g / (256 * 256) + b / 256 + a;
  }
  function toPixel(u, v) {
    return [
      Math.round((u - minU) / (maxU - minU) * (resolution - 1)),
      Math.round((v - minV) / (maxV - minV) * (resolution - 1))
    ];
  }
  const bias01 = biasFraction;
  const segments = [];
  function isVisible(p) {
    const pr = proj(p.x, p.y, p.z);
    const [px, py] = toPixel(pr.u, pr.v);
    let best = null;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const s = unpackDepth01(px + ox, py + oy);
        if (s !== null && (best === null || s < best)) best = s;
      }
    }
    if (best === null) return true;
    const d01 = (pr.d - minD) / (maxD - minD);
    return d01 <= best + bias01;
  }
  for (const poly of polylines) {
    if (poly.length < 2) continue;
    let run3 = [];
    let run2 = [];
    for (const p of poly) {
      if (isVisible(p)) {
        run3.push(p);
        const pr = proj(p.x, p.y, p.z);
        run2.push({ u: pr.u, v: pr.v });
      } else if (run3.length >= 2) {
        segments.push({ points3D: run3, points2D: run2 });
        run3 = [];
        run2 = [];
      } else {
        run3 = [];
        run2 = [];
      }
    }
    if (run3.length >= 2) segments.push({ points3D: run3, points2D: run2 });
  }
  return { segments, bounds: { minU, maxU, minV, maxV } };
}
function polylinesToSVG(segments, bounds, options) {
  const stroke = options?.stroke ?? "#000";
  const sw = options?.strokeWidth ?? 0.5;
  const pad = options?.padFraction ?? 0.02;
  const w = bounds.maxU - bounds.minU;
  const h = bounds.maxV - bounds.minV;
  const padX = w * pad;
  const padY = h * pad;
  const vbX = bounds.minU - padX;
  const vbY = -(bounds.maxV + padY);
  const vbW = w + 2 * padX;
  const vbH = h + 2 * padY;
  const parts = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(4)} ${vbY.toFixed(4)} ${vbW.toFixed(4)} ${vbH.toFixed(4)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">`
  );
  for (const seg of segments) {
    if (seg.points2D.length < 2) continue;
    const d = seg.points2D.map((p) => `${p.u.toFixed(4)},${(-p.v).toFixed(4)}`).join(" ");
    parts.push(`<polyline points="${d}"/>`);
  }
  parts.push(`</svg>
`);
  return parts.join("\n");
}

// src/io/IfcFile.ts
var IfcFile = {
  /**
   * Parse an IFC file (as ArrayBuffer) into a single fused FlatMeshData.
   * All elements are merged; no per-element groups are produced.
   */
  async parse(buffer, options = {}) {
    const wasmPath = options.wasmPath ?? "/";
    const recenter = options.recenter ?? true;
    const log = options.onProgress ?? (() => {
    });
    const { IfcAPI } = await import("web-ifc");
    const api = new IfcAPI();
    api.SetWasmPath(wasmPath);
    await api.Init();
    const t0 = performance.now();
    const modelID = api.OpenModel(new Uint8Array(buffer));
    if (modelID < 0) {
      throw new Error("IfcFile.parse: failed to open IFC model");
    }
    log(`opened in ${(performance.now() - t0).toFixed(0)}ms`);
    const positions = [];
    const normals = [];
    const indices = [];
    const t1 = performance.now();
    let meshCount = 0;
    api.StreamAllMeshes(modelID, (flatMesh) => {
      const placedGeoms = flatMesh.geometries;
      const n = placedGeoms.size();
      for (let i = 0; i < n; i++) {
        const placed = placedGeoms.get(i);
        const geom = api.GetGeometry(modelID, placed.geometryExpressID);
        const verts = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
        const idxs = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());
        const m = placed.flatTransformation;
        const baseVertex = positions.length / 3;
        for (let v = 0; v < verts.length; v += 6) {
          const x = verts[v], y = verts[v + 1], z = verts[v + 2];
          const nx = verts[v + 3], ny = verts[v + 4], nz = verts[v + 5];
          positions.push(
            m[0] * x + m[4] * y + m[8] * z + m[12],
            m[1] * x + m[5] * y + m[9] * z + m[13],
            m[2] * x + m[6] * y + m[10] * z + m[14]
          );
          normals.push(
            m[0] * nx + m[4] * ny + m[8] * nz,
            m[1] * nx + m[5] * ny + m[9] * nz,
            m[2] * nx + m[6] * ny + m[10] * nz
          );
        }
        for (let k = 0; k < idxs.length; k++) {
          indices.push(idxs[k] + baseVertex);
        }
        geom.delete();
      }
      meshCount++;
    });
    log(`streamed ${meshCount} meshes in ${(performance.now() - t1).toFixed(0)}ms`);
    log(`vertices: ${positions.length / 3}, triangles: ${indices.length / 3}`);
    api.CloseModel(modelID);
    if (recenter && positions.length > 0) {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] -= cx;
        positions[i + 1] -= cy;
        positions[i + 2] -= cz;
      }
      log(`recentered: bbox center was (${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)})`);
    }
    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 1e-9) {
        normals[i] = nx / len;
        normals[i + 1] = ny / len;
        normals[i + 2] = nz / len;
      }
    }
    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      indices: new Uint32Array(indices)
    };
  }
};

// src/io/IfcWriter.ts
var IfcWriter = class {
  constructor(opts = {}) {
    this.entities = [];
    this.nextId = 1;
    // Bootstrap refs.
    this.ownerHistoryRef = 0;
    this.contextRef = 0;
    this.projectRef = 0;
    this.siteRef = 0;
    this.buildingRef = 0;
    this.buildingPlacementRef = 0;
    this.storeyRef = 0;
    // default storey ref (the one bootstrapped from `IfcWriterOptions`)
    this.storeyPlacementRef = 0;
    // its local placement
    this.originPointRef = 0;
    this.dirXRef = 0;
    this.dirZRef = 0;
    this.worldPlacementRef = 0;
    this.rootPlacementRef = 0;
    // Multi-storey tracking — every storey created via `addStorey` (plus
    // the default one) has its placement ref and its list of contained
    // elements, emitted as one `IfcRelContainedInSpatialStructure` per
    // storey at save time.
    this.storeyPlacementByRef = /* @__PURE__ */ new Map();
    // storeyRef → placementRef
    this.elementsByStorey = /* @__PURE__ */ new Map();
    // storeyRef → contained element refs
    // Tracking.
    this.wallRefs = [];
    this.wallByObject = /* @__PURE__ */ new Map();
    this.slabRefs = [];
    this.slabTypeRefs = /* @__PURE__ */ new Map();
    this.slabDefinesByTypeBatches = /* @__PURE__ */ new Map();
    this.placementByWall = /* @__PURE__ */ new Map();
    // wall → its local placement ref
    this.wallTypeRefs = /* @__PURE__ */ new Map();
    this.materialLayerSetRefs = /* @__PURE__ */ new Map();
    this.materialRefs = /* @__PURE__ */ new Map();
    this.definesByTypeBatches = /* @__PURE__ */ new Map();
    // typeRef → [wallRefs]
    this.openingTypeRefs = /* @__PURE__ */ new Map();
    this.openingDefinesByTypeBatches = /* @__PURE__ */ new Map();
    // door/window typeRef → [instanceRefs]
    this.spacesByStorey = /* @__PURE__ */ new Map();
    // storeyRef → IfcSpace refs (aggregated, not contained)
    this.stairTypeRefs = /* @__PURE__ */ new Map();
    this.stairDefinesByTypeBatches = /* @__PURE__ */ new Map();
    /**
     * Per-wall arc-length deltas applied to the body geometry at each end:
     *   • Through wall in a butt joint → extension (negative at start, positive at end).
     *   • Butting wall in a butt joint → shortening (positive at start, negative at end).
     * Populated by `computeWallTrims` before `writeStraightWall` consumes it.
     */
    this.wallTrimMap = /* @__PURE__ */ new Map();
    this.opts = {
      projectName: opts.projectName ?? "Tekto Project",
      projectDescription: opts.projectDescription ?? "",
      siteName: opts.siteName ?? "Site",
      buildingName: opts.buildingName ?? "Building",
      storeyName: opts.storeyName ?? "Ground Floor",
      storeyElevation: opts.storeyElevation ?? 0,
      author: opts.author ?? "",
      authorGivenName: opts.authorGivenName ?? "",
      organization: opts.organization ?? "Tekto",
      application: opts.application ?? "Tekto",
      applicationVersion: opts.applicationVersion ?? "0.1",
      viewDefinition: opts.viewDefinition ?? "ViewDefinition [DesignTransferView_V1.0]"
    };
    this.bootstrap();
  }
  // ── Public API ────────────────────────────────────────────────────
  /**
   * Add an additional `IfcBuildingStorey` to the model and return its
   * line id. Pass that id as `opts.storey` on subsequent `addWall` /
   * `addSlab` / `addWallSystem` calls to attach elements to the new
   * storey. The bootstrap storey (created from `IfcWriterOptions`)
   * stays the default for any call that omits `storey`.
   *
   * @example
   *   const writer = new IfcWriter({ storeyName: "Ground floor", storeyElevation: 0 });
   *   writer.addWallSystem(groundFloorSystem);          // → ground floor
   *   const first = writer.addStorey({ name: "First floor", elevation: 3.0 });
   *   writer.addWallSystem(firstFloorSystem, { storey: first });
   */
  addStorey(opts) {
    const { storeyRef, placementRef } = this.createStoreyEntities(opts.name, opts.elevation);
    this.storeyPlacementByRef.set(storeyRef, placementRef);
    this.elementsByStorey.set(storeyRef, []);
    return storeyRef;
  }
  /** Convenience: returns the bootstrap storey's IFC line id. */
  getDefaultStorey() {
    return this.storeyRef;
  }
  /**
   * Add a `WallSystem` and everything it carries — the recommended one-shot
   * entry point. Emits wall types, materials, walls, openings, members,
   * and joint relations in a single coherent batch.
   *
   * `opts.storey` (optional) selects which storey to attach the walls to.
   * Defaults to the bootstrap storey from `IfcWriterOptions`.
   */
  addWallSystem(system, opts = {}) {
    const incMembers = opts.includeMembers ?? true;
    const incJoints = opts.includeJoints ?? true;
    const incOpenings = opts.includeOpenings ?? true;
    const incMaterials = opts.includeMaterials ?? true;
    const realised = incMembers ? system.realize() : null;
    this.computeWallTrims(system);
    const storey = this.resolveStorey(opts.storey);
    for (const wall of system.walls) {
      const wallRef = this.addWall(wall, { includeMaterials: incMaterials, storey });
      if (incOpenings) {
        for (const op of wall.openings) this.addOpening(wall, wallRef, op, storey);
      }
    }
    if (incMembers && realised) {
      for (const r of realised) {
        const wallRef = this.wallByObject.get(r.wall);
        if (wallRef == null) continue;
        const memberRefs = [];
        for (const part of r.parts) {
          if (part.role === "monolithic") continue;
          const ref = this.addMember(wallRef, part);
          memberRefs.push(ref);
        }
        if (memberRefs.length > 0) {
          this.addEntity(
            `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${wallRef},(${memberRefs.map((r2) => `#${r2}`).join(",")}))`
          );
        }
      }
    }
    if (incJoints) {
      for (const j of system.joints) this.addJoint(j);
    }
  }
  /**
   * Add one wall — returns its IFC line id. Used internally by
   * `addWallSystem`; can also be called directly for one-off walls.
   *
   * `opts.storey` selects which storey to attach the wall to. Defaults
   * to the bootstrap storey.
   */
  addWall(wall, opts = {}) {
    const cl = wall.centerline;
    if (cl.length < 2) throw new Error("IfcWriter.addWall: centerline needs \u2265 2 points");
    const storey = this.resolveStorey(opts.storey);
    const refs = [];
    for (let i = 0; i < cl.length - 1; i++) {
      refs.push(this.writeStraightWall(wall, cl[i], cl[i + 1], i, cl.length - 1, storey));
    }
    const primaryRef = refs[0];
    this.wallByObject.set(wall, primaryRef);
    for (const r of refs) this.attachToStorey(r, storey);
    if (wall.type) {
      const typeRef = this.ensureWallType(wall.type, opts.includeMaterials ?? true);
      const batch = this.definesByTypeBatches.get(typeRef) ?? [];
      batch.push(primaryRef);
      this.definesByTypeBatches.set(typeRef, batch);
      if (opts.includeMaterials ?? true) {
        const layerSetRef = this.materialLayerSetRefs.get(wall.type);
        if (layerSetRef !== void 0) {
          this.writeMaterialLayerSetUsage(primaryRef, layerSetRef, wall);
        }
      }
    }
    return primaryRef;
  }
  /**
   * Add an opening (door or window) on the given wall. Emits
   * IfcOpeningElement + IfcRelVoidsElement (carving the wall) and
   * IfcDoor or IfcWindow + IfcRelFillsElement (filling the void).
   */
  addOpening(wall, wallRef, opening, storeyRef) {
    const isDoor = opening.sillHeight <= 1e-3;
    const opHeight = opening.headHeight - opening.sillHeight;
    const opWidth = opening.width;
    const opDepth = wall.thickness;
    const opCenter = pointAlongCenterline(wall.centerline, opening.centerlinePosition);
    const tangent = tangentAlongCenterline(wall.centerline, opening.centerlinePosition);
    const z = wall.baseElevation + opening.sillHeight;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(opCenter.x)},${ifcReal(opCenter.y)},${ifcReal(z)}))`);
    const refDir = this.addEntity(`IFCDIRECTION((${ifcReal(tangent.x)},${ifcReal(tangent.y)},0.))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${refDir})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storeyRef ?? this.storeyRef) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const profileOrigin = this.addEntity(`IFCCARTESIANPOINT((0.,0.))`);
    const profileAxis2D = this.addEntity(`IFCAXIS2PLACEMENT2D(#${profileOrigin},${"$"})`);
    const profile = this.addEntity(
      `IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profileAxis2D},${ifcReal(opWidth)},${ifcReal(opDepth)})`
    );
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(opHeight)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const openingName = opening.name ?? (isDoor ? "Door opening" : "Window opening");
    const openingRef = this.addEntity(
      `IFCOPENINGELEMENT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(openingName)},$,$,#${localPlacement},#${productShape},$,.OPENING.)`
    );
    this.addEntity(
      `IFCRELVOIDSELEMENT(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${wallRef},#${openingRef})`
    );
    const type = opening.type;
    const asDoor = type ? type.kind === "door" : isDoor;
    const fillName = opening.name ?? type?.name ?? (asDoor ? "Door" : "Window");
    const fillType = asDoor ? "IFCDOOR" : "IFCWINDOW";
    const fillPredefined = asDoor ? ".DOOR." : ".WINDOW.";
    const fillOperation = type ? asDoor ? ifcDoorOperation(type.operation) : ifcWindowPartitioning(type.partitioning) : ".NOTDEFINED.";
    const fillRef = this.addEntity(
      `${fillType}(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(fillName)},$,$,#${localPlacement},#${productShape},$,${ifcReal(opHeight)},${ifcReal(opWidth)},${fillPredefined},${fillOperation},$)`
    );
    this.addEntity(
      `IFCRELFILLSELEMENT(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${openingRef},#${fillRef})`
    );
    if (type) {
      const typeRef = this.ensureOpeningType(type);
      const batch = this.openingDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(fillRef);
      this.openingDefinesByTypeBatches.set(typeRef, batch);
    }
    const mergedProps = {
      ...type?.properties ?? {},
      ...opening.properties ?? {}
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(fillRef, asDoor ? "Pset_DoorCommon" : "Pset_WindowCommon", mergedProps);
    }
    return { openingRef, fillRef };
  }
  /**
   * Add a framed member (stud / plate / header / cripple / etc.) as an
   * IfcMember with a tessellated body (IfcTriangulatedFaceSet — efficient,
   * IFC4-native). Aggregating under a wall is the caller's responsibility
   * (see addWallSystem).
   */
  addMember(_parentWallRef, part) {
    void _parentWallRef;
    const mesh = part.mesh;
    const positions = mesh.positions;
    const indices = mesh.indices;
    const coords = [];
    for (let i = 0; i < positions.length; i += 3) {
      coords.push(`(${ifcReal(positions[i])},${ifcReal(positions[i + 1])},${ifcReal(positions[i + 2])})`);
    }
    const pointListRef = this.addEntity(`IFCCARTESIANPOINTLIST3D((${coords.join(",")}))`);
    const tris = [];
    for (let i = 0; i < indices.length; i += 3) {
      tris.push(`(${indices[i] + 1},${indices[i + 1] + 1},${indices[i + 2] + 1})`);
    }
    const faceSet = this.addEntity(`IFCTRIANGULATEDFACESET(#${pointListRef},$,$,(${tris.join(",")}),$)`);
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','Tessellation',(#${faceSet}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const placement = this.addEntity(`IFCLOCALPLACEMENT(#${this.storeyPlacementRef},#${this.worldPlacementRef})`);
    const ifcType = part.ifcType ?? "IfcMember";
    const typeName = ifcType.toUpperCase();
    const memberRef = this.addEntity(
      `${typeName}(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(part.name)},$,${ifcStr(part.role)},#${placement},#${productShape},$,.NOTDEFINED.)`
    );
    if (part.material) {
      const matRef = this.ensureMaterial(part.material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${memberRef}),#${matRef})`
      );
    }
    return memberRef;
  }
  /**
   * Add a wall-to-wall joint as IfcRelConnectsPathElements. The joint's
   * style + throughWall hint are exposed in a custom Pset attached to the
   * relation (so receiving applications can read the design intent).
   */
  addJoint(joint) {
    if (joint.walls.length < 2) return null;
    const w0 = this.wallByObject.get(joint.walls[0]);
    const w1 = this.wallByObject.get(joint.walls[1]);
    if (w0 == null || w1 == null) return null;
    const through = joint.throughWall;
    const throughIsW0 = through === joint.walls[0];
    const throughEndAtJoint = endIsAtJoint(through ?? joint.walls[0], joint.ribbonJoint.point);
    const buttingEndAtJoint = endIsAtJoint(throughIsW0 ? joint.walls[1] : joint.walls[0], joint.ribbonJoint.point);
    const throughConnectionType = joint.kind === "T" ? ".ATPATH." : connectionTypeFromEnd(throughEndAtJoint);
    const buttingConnectionType = connectionTypeFromEnd(buttingEndAtJoint);
    const relatingRef = throughIsW0 ? w0 : w1;
    const relatedRef = throughIsW0 ? w1 : w0;
    const relRef = this.addEntity(
      `IFCRELCONNECTSPATHELEMENTS(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(`${joint.kind}-joint`)},$,$,#${relatingRef},#${relatedRef},(0),(0),${throughConnectionType},${buttingConnectionType})`
    );
    const props = {
      style: joint.style,
      throughWall: through?.name ?? "",
      kind: joint.kind,
      connectionType: joint.connectionType ?? "unspecified",
      ...joint.properties
    };
    this.writePset(relRef, "Pset_JointCommon", props);
    return relRef;
  }
  // ── Slabs ────────────────────────────────────────────────────────
  /**
   * Add a slab (floor / ceiling / roof) — returns its IFC line id.
   * Geometry: `IfcExtrudedAreaSolid` with an `IfcArbitraryClosedProfileDef`
   * built from the slab boundary, extruded up by `slab.thickness` from
   * the slab's bottom (`elevation − thickness`).
   *
   * Optionally aggregates SlabParts (joists, sheathing, ceiling) under
   * the slab via `IfcRelAggregates` when `opts.includeParts` is true.
   */
  addSlab(slab, opts = {}) {
    const storey = this.resolveStorey(opts.storey);
    const ring = Polygon2D.openRing(slab.boundary);
    const ptRefs = [];
    for (const p of ring) {
      ptRefs.push(this.addEntity(`IFCCARTESIANPOINT((${ifcReal(p.x)},${ifcReal(p.y)}))`));
    }
    const closedPts = [...ptRefs, ptRefs[0]];
    const polyline = this.addEntity(`IFCPOLYLINE((${closedPts.map((r) => `#${r}`).join(",")}))`);
    const profile = this.addEntity(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#${polyline})`);
    const bottomZ = slab.elevation - slab.thickness;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(bottomZ)}))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${this.dirXRef})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storey) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(slab.thickness)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const slabName = slab.name ?? "Slab";
    const predef = opts.predefinedType ?? "FLOOR";
    const slabRef = this.addEntity(
      `IFCSLAB(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(slabName)},$,$,#${localPlacement},#${productShape},$,.${predef}.)`
    );
    this.slabRefs.push(slabRef);
    this.attachToStorey(slabRef, storey);
    const mergedProps = {
      ...slab.type?.properties ?? {},
      ...slab.properties ?? {}
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(slabRef, "Pset_SlabCommon", mergedProps);
    }
    if (slab.type) {
      const typeRef = this.ensureSlabType(slab.type);
      const batch = this.slabDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(slabRef);
      this.slabDefinesByTypeBatches.set(typeRef, batch);
    }
    if (opts.includeParts !== false) {
      let parts = opts.parts;
      if (!parts && slab.type?.construction) {
        const ctx = slab.joistDirection ? { joistDirection: slab.joistDirection } : void 0;
        parts = slab.type.construction(slab, ctx);
      }
      if (parts && parts.length > 0) {
        const partRefs = [];
        for (const p of parts) {
          if (p.role === "monolithic") continue;
          partRefs.push(this.addMember(slabRef, p));
        }
        if (partRefs.length > 0) {
          this.addEntity(
            `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${slabRef},(${partRefs.map((r) => `#${r}`).join(",")}))`
          );
        }
      }
    }
    return slabRef;
  }
  ensureSlabType(type) {
    const existing = this.slabTypeRefs.get(type);
    if (existing !== void 0) return existing;
    const typeRef = this.addEntity(
      `IFCSLABTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.NOTDEFINED.)`
    );
    this.slabTypeRefs.set(type, typeRef);
    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, "Pset_SlabCommon", type.properties);
    }
    return typeRef;
  }
  // ── Stairs ───────────────────────────────────────────────────────
  /**
   * Add a stair as an `IfcStair` that aggregates one `IfcStairFlight` per
   * computed flight. The stair is contained in its storey; flights carry the
   * tessellated step geometry and the riser/tread metrics. A `StairType`
   * links via `IfcRelDefinesByType`; `properties` go on `Pset_StairCommon`.
   */
  addStair(stair, opts = {}) {
    const storey = this.resolveStorey(opts.storey);
    const stairPlacement = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${this.worldPlacementRef})`
    );
    const stairRef = this.addEntity(
      `IFCSTAIR(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(stair.name)},$,$,#${stairPlacement},$,$,${ifcStairShape(stair.type?.shape ?? "straight_run")})`
    );
    this.attachToStorey(stairRef, storey);
    const flightRefs = [];
    for (const flight of stair.flights()) {
      flightRefs.push(this.writeStairFlight(flight, stair.type?.material));
    }
    if (flightRefs.length > 0) {
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${stairRef},(${flightRefs.map((r) => `#${r}`).join(",")}))`
      );
    }
    if (stair.type) {
      const typeRef = this.ensureStairType(stair.type);
      const batch = this.stairDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(stairRef);
      this.stairDefinesByTypeBatches.set(typeRef, batch);
    }
    const mergedProps = {
      ...stair.type?.properties ?? {},
      ...stair.properties
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(stairRef, "Pset_StairCommon", mergedProps);
    }
    return stairRef;
  }
  writeStairFlight(flight, material) {
    const productShape = this.writeTriangulatedShape(flight.positions, flight.indices);
    const placement = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${this.worldPlacementRef})`
    );
    const flightRef = this.addEntity(
      `IFCSTAIRFLIGHT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(flight.name)},$,$,#${placement},#${productShape},$,${flight.risers},${flight.treads},${ifcReal(flight.riserHeight)},${ifcReal(flight.treadDepth)},.STRAIGHT.)`
    );
    if (material) {
      const matRef = this.ensureMaterial(material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${flightRef}),#${matRef})`
      );
    }
    return flightRef;
  }
  ensureStairType(type) {
    const existing = this.stairTypeRefs.get(type);
    if (existing !== void 0) return existing;
    const typeRef = this.addEntity(
      `IFCSTAIRTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,${ifcStairShape(type.shape)})`
    );
    this.stairTypeRefs.set(type, typeRef);
    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, "Pset_StairCommon", type.properties);
    }
    return typeRef;
  }
  /**
   * Emit a tessellated solid (IfcCartesianPointList3D + IfcTriangulatedFaceSet)
   * from a flat positions array and 0-based triangle indices. Returns the
   * IfcProductDefinitionShape ref.
   */
  writeTriangulatedShape(positions, indices) {
    const coords = [];
    for (let i = 0; i < positions.length; i += 3) {
      coords.push(`(${ifcReal(positions[i])},${ifcReal(positions[i + 1])},${ifcReal(positions[i + 2])})`);
    }
    const pointListRef = this.addEntity(`IFCCARTESIANPOINTLIST3D((${coords.join(",")}))`);
    const tris = [];
    for (let i = 0; i < indices.length; i += 3) {
      tris.push(`(${indices[i] + 1},${indices[i + 1] + 1},${indices[i + 2] + 1})`);
    }
    const faceSet = this.addEntity(`IFCTRIANGULATEDFACESET(#${pointListRef},$,$,(${tris.join(",")}),$)`);
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','Tessellation',(#${faceSet}))`
    );
    return this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
  }
  // ── Spaces (rooms) ───────────────────────────────────────────────
  /**
   * Add a room as an `IfcSpace` — returns its IFC line id. Geometry is the
   * boundary polygon extruded up by `space.height` from `space.elevation`.
   * The space is aggregated under its storey via `IfcRelAggregates` (the
   * correct spatial-decomposition relationship for spaces), its `function`
   * becomes `IfcSpace.LongName`, and `properties` go on `Pset_SpaceCommon`.
   *
   * `opts.boundaries` — walls that bound the room (e.g. from
   * `boundingWalls(space, walls)`). Each already-added wall emits an
   * `IfcRelSpaceBoundary` (PHYSICAL; INTERNAL/EXTERNAL from the wall's
   * `isExternal` property). Walls not yet added to the writer are skipped.
   */
  addSpace(space, opts = {}) {
    const storey = this.resolveStorey(opts.storey);
    const ring = Polygon2D.openRing(space.boundary);
    const ptRefs = [];
    for (const p of ring) {
      ptRefs.push(this.addEntity(`IFCCARTESIANPOINT((${ifcReal(p.x)},${ifcReal(p.y)}))`));
    }
    const closedPts = [...ptRefs, ptRefs[0]];
    const polyline = this.addEntity(`IFCPOLYLINE((${closedPts.map((r) => `#${r}`).join(",")}))`);
    const profile = this.addEntity(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#${polyline})`);
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(space.elevation)}))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${this.dirXRef})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storey) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(space.height)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const spaceRef = this.addEntity(
      `IFCSPACE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(space.name)},$,$,#${localPlacement},#${productShape},${ifcOpt(space.function ?? "")},.ELEMENT.,.INTERNAL.,$)`
    );
    const list = this.spacesByStorey.get(storey) ?? [];
    list.push(spaceRef);
    this.spacesByStorey.set(storey, list);
    const props = {
      GrossFloorArea: round3(space.area()),
      ...space.properties
    };
    this.writePset(spaceRef, "Pset_SpaceCommon", props);
    if (opts.boundaries) {
      for (const wall of opts.boundaries) {
        const wallRef = this.wallByObject.get(wall);
        if (wallRef == null) continue;
        const ext = isExternalWall(wall) ? ".EXTERNAL." : ".INTERNAL.";
        this.addEntity(
          `IFCRELSPACEBOUNDARY(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${spaceRef},#${wallRef},$,.PHYSICAL.,${ext})`
        );
      }
    }
    return spaceRef;
  }
  /**
   * Ensure an `IfcDoorType` / `IfcWindowType` exists for this opening type,
   * returning its line id. Door types carry an OperationType; window types
   * carry a PartitioningType. The type's `properties` go on a common Pset.
   */
  ensureOpeningType(type) {
    const existing = this.openingTypeRefs.get(type);
    if (existing !== void 0) return existing;
    let typeRef;
    if (type.kind === "door") {
      typeRef = this.addEntity(
        `IFCDOORTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.DOOR.,${ifcDoorOperation(type.operation)},$,$)`
      );
    } else {
      typeRef = this.addEntity(
        `IFCWINDOWTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.WINDOW.,${ifcWindowPartitioning(type.partitioning)},$,$)`
      );
    }
    this.openingTypeRefs.set(type, typeRef);
    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, type.kind === "door" ? "Pset_DoorCommon" : "Pset_WindowCommon", type.properties);
    }
    if (type.material) {
      const matRef = this.ensureMaterial(type.material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${typeRef}),#${matRef})`
      );
    }
    return typeRef;
  }
  // ── Save ──────────────────────────────────────────────────────────
  save() {
    this.flushDefinesByType();
    this.linkSpatialStructure();
    return this.assembleStep();
  }
  saveBytes() {
    return new TextEncoder().encode(this.save());
  }
  saveBlob() {
    return new Blob([this.save()], { type: "application/ifc" });
  }
  // ── Bootstrap ────────────────────────────────────────────────────
  bootstrap() {
    this.originPointRef = this.addEntity(`IFCCARTESIANPOINT((0.,0.,0.))`);
    this.dirXRef = this.addEntity(`IFCDIRECTION((1.,0.,0.))`);
    this.dirZRef = this.addEntity(`IFCDIRECTION((0.,0.,1.))`);
    this.worldPlacementRef = this.addEntity(
      `IFCAXIS2PLACEMENT3D(#${this.originPointRef},#${this.dirZRef},#${this.dirXRef})`
    );
    const person = this.addEntity(
      `IFCPERSON($,${ifcOpt(this.opts.author)},${ifcOpt(this.opts.authorGivenName)},$,$,$,$,$)`
    );
    const org = this.addEntity(`IFCORGANIZATION($,${ifcStr(this.opts.organization)},$,$,$)`);
    const personAndOrg = this.addEntity(`IFCPERSONANDORGANIZATION(#${person},#${org},$)`);
    const app = this.addEntity(
      `IFCAPPLICATION(#${org},${ifcStr(this.opts.applicationVersion)},${ifcStr(this.opts.application)},${ifcStr(this.opts.application.toLowerCase())})`
    );
    const epoch = 17e8;
    this.ownerHistoryRef = this.addEntity(
      `IFCOWNERHISTORY(#${personAndOrg},#${app},$,.ADDED.,$,$,$,${epoch})`
    );
    const metre = this.addEntity(`IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)`);
    const radian = this.addEntity(`IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)`);
    const squareMetre = this.addEntity(`IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`);
    const cubicMetre = this.addEntity(`IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)`);
    const unitAssign = this.addEntity(
      `IFCUNITASSIGNMENT((#${metre},#${squareMetre},#${cubicMetre},#${radian}))`
    );
    this.contextRef = this.addEntity(
      `IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-5,#${this.worldPlacementRef},$)`
    );
    this.projectRef = this.addEntity(
      `IFCPROJECT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.projectName)},${ifcOpt(this.opts.projectDescription)},$,$,$,(#${this.contextRef}),#${unitAssign})`
    );
    this.rootPlacementRef = this.addEntity(`IFCLOCALPLACEMENT($,#${this.worldPlacementRef})`);
    this.siteRef = this.addEntity(
      `IFCSITE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.siteName)},$,$,#${this.rootPlacementRef},$,$,.ELEMENT.,$,$,$,$,$)`
    );
    this.buildingPlacementRef = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.rootPlacementRef},#${this.worldPlacementRef})`
    );
    this.buildingRef = this.addEntity(
      `IFCBUILDING(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.buildingName)},$,$,#${this.buildingPlacementRef},$,$,.ELEMENT.,$,$,$)`
    );
    const { storeyRef, placementRef } = this.createStoreyEntities(
      this.opts.storeyName,
      this.opts.storeyElevation
    );
    this.storeyRef = storeyRef;
    this.storeyPlacementRef = placementRef;
    this.storeyPlacementByRef.set(storeyRef, placementRef);
    this.elementsByStorey.set(storeyRef, []);
    this.addEntity(`IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.projectRef},(#${this.siteRef}))`);
    this.addEntity(`IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.siteRef},(#${this.buildingRef}))`);
  }
  /** Build the IfcBuildingStorey + IfcLocalPlacement pair. Returns both refs. */
  createStoreyEntities(name, elevation) {
    const originPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(elevation)}))`);
    const axis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${originPt},#${this.dirZRef},#${this.dirXRef})`);
    const placementRef = this.addEntity(`IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${axis})`);
    const storeyRef = this.addEntity(
      `IFCBUILDINGSTOREY(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(name)},$,$,#${placementRef},$,$,.ELEMENT.,${ifcReal(elevation)})`
    );
    return { storeyRef, placementRef };
  }
  // ── Wall geometry ────────────────────────────────────────────────
  /**
   * Per-wall deltas from butt joints. Sign convention along the wall's
   * tangent (p0 → p1):
   *   - Through wall, start at joint → startDelta negative (extend back)
   *   - Through wall, end at joint   → endDelta   positive (extend fwd)
   *   - Butting wall, start at joint → startDelta positive (shorten in)
   *   - Butting wall, end at joint   → endDelta   negative (shorten in)
   * Mitered joints leave deltas at 0 — both walls meet at centerline.
   */
  computeWallTrims(system) {
    this.wallTrimMap.clear();
    for (const w of system.walls) {
      this.wallTrimMap.set(w, { startDelta: 0, endDelta: 0 });
    }
    for (const joint of system.joints) {
      if (joint.style !== "butt") continue;
      const through = joint.throughWall;
      if (!through) continue;
      const halfThrough = through.thickness * 0.5;
      const buttings = joint.walls.filter((w) => w !== through);
      const maxButtHalfW = buttings.reduce((m, w) => Math.max(m, w.thickness * 0.5), 0);
      for (const wall of joint.walls) {
        const trim = this.wallTrimMap.get(wall);
        if (!trim) continue;
        const endPos = endIsAtJoint(wall, joint.ribbonJoint.point);
        if (wall === through) {
          if (endPos === "start") trim.startDelta -= maxButtHalfW;
          else if (endPos === "end") trim.endDelta += maxButtHalfW;
        } else {
          if (endPos === "start") trim.startDelta += halfThrough;
          else if (endPos === "end") trim.endDelta -= halfThrough;
        }
      }
    }
  }
  writeStraightWall(wall, p0, p1, segIndex, segTotal, storeyRef) {
    const rawDx = p1.x - p0.x;
    const rawDy = p1.y - p0.y;
    const rawLen = Math.hypot(rawDx, rawDy);
    if (rawLen < 1e-9) throw new Error("IfcWriter: zero-length wall segment");
    const ux = rawDx / rawLen;
    const uy = rawDy / rawLen;
    const trim = this.wallTrimMap.get(wall);
    let startX = p0.x, startY = p0.y;
    let endX = p1.x, endY = p1.y;
    if (trim) {
      if (segIndex === 0) {
        startX = p0.x + ux * trim.startDelta;
        startY = p0.y + uy * trim.startDelta;
      }
      if (segIndex === segTotal - 1) {
        endX = p1.x + ux * trim.endDelta;
        endY = p1.y + uy * trim.endDelta;
      }
    }
    const length = Math.hypot(endX - startX, endY - startY);
    if (length < 1e-9) throw new Error("IfcWriter: zero-length trimmed wall segment");
    const z = wall.baseElevation;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(startX)},${ifcReal(startY)},${ifcReal(z)}))`);
    const refDir = this.addEntity(`IFCDIRECTION((${ifcReal(ux)},${ifcReal(uy)},0.))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${refDir})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storeyRef ?? this.storeyRef) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);
    const profileOrigin = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(length / 2)},0.))`);
    const profileAxisDir = this.addEntity(`IFCDIRECTION((1.,0.))`);
    const profileAxis = this.addEntity(`IFCAXIS2PLACEMENT2D(#${profileOrigin},#${profileAxisDir})`);
    const profile = this.addEntity(
      `IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profileAxis},${ifcReal(length)},${ifcReal(wall.thickness)})`
    );
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(wall.height)})`
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const wallName = segTotal > 1 ? `${wall.name ?? "Wall"}_${segIndex + 1}` : wall.name ?? "Wall";
    const wallRef = this.addEntity(
      `IFCWALLSTANDARDCASE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(wallName)},$,$,#${localPlacement},#${productShape},$,.NOTDEFINED.)`
    );
    this.wallRefs.push(wallRef);
    this.placementByWall.set(wall, localPlacement);
    const mergedProps = {
      ...wall.type?.properties ?? {},
      ...wall.properties ?? {}
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(wallRef, "Pset_WallCommon", mergedProps);
    }
    return wallRef;
  }
  // ── Wall type registry ──────────────────────────────────────────
  ensureWallType(type, includeMaterials) {
    const existing = this.wallTypeRefs.get(type);
    if (existing !== void 0) return existing;
    const typeRef = this.addEntity(
      `IFCWALLTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.NOTDEFINED.)`
    );
    this.wallTypeRefs.set(type, typeRef);
    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, "Pset_WallCommon", type.properties);
    }
    if (includeMaterials && type.layers && type.layers.length > 0) {
      const layerSetRef = this.writeMaterialLayerSet(type.layers, type.name);
      this.materialLayerSetRefs.set(type, layerSetRef);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${typeRef}),#${layerSetRef})`
      );
    }
    return typeRef;
  }
  flushDefinesByType() {
    for (const [typeRef, wallRefs] of this.definesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${wallRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
    for (const [typeRef, slabRefs] of this.slabDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${slabRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
    for (const [typeRef, instanceRefs] of this.openingDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${instanceRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
    for (const [typeRef, stairRefs] of this.stairDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${stairRefs.map((r) => `#${r}`).join(",")}),#${typeRef})`
      );
    }
  }
  // ── Materials ────────────────────────────────────────────────────
  ensureMaterial(name) {
    const existing = this.materialRefs.get(name);
    if (existing !== void 0) return existing;
    const ref = this.addEntity(`IFCMATERIAL(${ifcStr(name)},$,$)`);
    this.materialRefs.set(name, ref);
    return ref;
  }
  writeMaterialLayerSet(layers, setName) {
    const layerRefs = [];
    for (const l of layers) {
      const matRef = this.ensureMaterial(l.material);
      const layerRef = this.addEntity(
        `IFCMATERIALLAYER(#${matRef},${ifcReal(l.thickness)},$,$,$,$,$)`
      );
      layerRefs.push(layerRef);
    }
    const layerSetRef = this.addEntity(
      `IFCMATERIALLAYERSET((${layerRefs.map((r) => `#${r}`).join(",")}),${ifcStr(setName)},$)`
    );
    return layerSetRef;
  }
  writeMaterialLayerSetUsage(wallRef, layerSetRef, wall) {
    const offset = -wall.thickness * 0.5;
    const usageRef = this.addEntity(
      `IFCMATERIALLAYERSETUSAGE(#${layerSetRef},.AXIS2.,.POSITIVE.,${ifcReal(offset)},$)`
    );
    this.addEntity(
      `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${wallRef}),#${usageRef})`
    );
  }
  // ── Property sets ───────────────────────────────────────────────
  writePset(elementRef, name, props) {
    const propRefs = [];
    for (const [key, value] of Object.entries(props)) {
      propRefs.push(this.writeSingleValue(key, value));
    }
    if (propRefs.length === 0) return;
    const psetRef = this.addEntity(
      `IFCPROPERTYSET(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(name)},$,(${propRefs.map((r) => `#${r}`).join(",")}))`
    );
    this.addEntity(
      `IFCRELDEFINESBYPROPERTIES(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${elementRef}),#${psetRef})`
    );
  }
  writeSingleValue(name, value) {
    return this.addEntity(`IFCPROPERTYSINGLEVALUE(${ifcStr(name)},$,${ifcTypedValue(value)},$)`);
  }
  // ── Spatial linking ─────────────────────────────────────────────
  /** Validate / default the storey ref for an add* call. */
  resolveStorey(storeyRef) {
    if (storeyRef == null) return this.storeyRef;
    if (!this.elementsByStorey.has(storeyRef)) {
      throw new Error(
        `IfcWriter: unknown storey ref #${storeyRef} (must come from addStorey() or getDefaultStorey()).`
      );
    }
    return storeyRef;
  }
  /** Record an element ref under its storey for later spatial linking. */
  attachToStorey(elementRef, storeyRef) {
    const list = this.elementsByStorey.get(storeyRef);
    if (list) list.push(elementRef);
  }
  linkSpatialStructure() {
    const storeyRefs = Array.from(this.elementsByStorey.keys());
    if (storeyRefs.length > 0) {
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.buildingRef},(${storeyRefs.map((r) => `#${r}`).join(",")}))`
      );
    }
    for (const [storeyRef, elements] of this.elementsByStorey) {
      if (elements.length === 0) continue;
      const list = elements.map((r) => `#${r}`).join(",");
      this.addEntity(
        `IFCRELCONTAINEDINSPATIALSTRUCTURE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${list}),#${storeyRef})`
      );
    }
    for (const [storeyRef, spaces] of this.spacesByStorey) {
      if (spaces.length === 0) continue;
      const list = spaces.map((r) => `#${r}`).join(",");
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${storeyRef},(${list}))`
      );
    }
  }
  // ── Plumbing ────────────────────────────────────────────────────
  addEntity(content) {
    const id = this.nextId++;
    this.entities.push(`#${id}=${content};`);
    return id;
  }
  assembleStep() {
    const date = (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "");
    const filename = `${(this.opts.projectName || "model").replace(/[^\w-]/g, "_")}.ifc`;
    const header = `HEADER;
FILE_DESCRIPTION((${ifcStr(this.opts.viewDefinition)}),'2;1');
FILE_NAME(${ifcStr(filename)},${ifcStr(date)},(${ifcStr(this.opts.author)}),(${ifcStr(this.opts.organization)}),${ifcStr(this.opts.application + " " + this.opts.applicationVersion)},${ifcStr(this.opts.application)},'');
FILE_SCHEMA(('IFC4'));
ENDSEC;`;
    return `ISO-10303-21;
${header}
DATA;
${this.entities.join("\n")}
ENDSEC;
END-ISO-10303-21;
`;
  }
};
function ifcStr(s) {
  return `'${s.replace(/'/g, "''")}'`;
}
function ifcOpt(s) {
  return s ? ifcStr(s) : "$";
}
function ifcReal(n) {
  if (!Number.isFinite(n)) return "0.";
  const s = n.toString();
  return s.includes(".") || s.includes("e") || s.includes("E") ? s : `${s}.`;
}
function round3(n) {
  return Math.round(n * 1e3) / 1e3;
}
function isExternalWall(wall) {
  return wall.properties?.isExternal === true || wall.type?.properties?.isExternal === true;
}
function ifcTypedValue(v) {
  if (typeof v === "string") return `IFCTEXT(${ifcStr(v)})`;
  if (typeof v === "boolean") return `IFCBOOLEAN(${v ? ".T." : ".F."})`;
  if (typeof v === "number") return `IFCREAL(${ifcReal(v)})`;
  return `IFCTEXT(${ifcStr(String(v))})`;
}
function ifcGuid() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  let s = "";
  for (let i = 0; i < 22; i++) s += chars[Math.floor(Math.random() * 64)];
  return `'${s}'`;
}
function ifcDoorOperation(op) {
  switch (op) {
    case "single_swing_left":
      return ".SINGLE_SWING_LEFT.";
    case "single_swing_right":
      return ".SINGLE_SWING_RIGHT.";
    case "double_swing":
      return ".DOUBLE_DOOR_DOUBLE_SWING.";
    case "double_door_single_swing":
      return ".DOUBLE_DOOR_SINGLE_SWING.";
    case "sliding":
      return ".SLIDING_TO_LEFT.";
    case "folding":
      return ".FOLDING_TO_LEFT.";
    case "revolving":
      return ".REVOLVING.";
    default:
      return ".NOTDEFINED.";
  }
}
function ifcWindowPartitioning(p) {
  switch (p) {
    case "single_panel":
      return ".SINGLE_PANEL.";
    case "double_panel_vertical":
      return ".DOUBLE_PANEL_VERTICAL.";
    case "double_panel_horizontal":
      return ".DOUBLE_PANEL_HORIZONTAL.";
    case "triple_panel":
      return ".TRIPLE_PANEL_VERTICAL.";
    default:
      return ".NOTDEFINED.";
  }
}
function ifcStairShape(s) {
  switch (s) {
    case "straight_run":
      return ".STRAIGHT_RUN.";
    case "two_straight_run":
      return ".TWO_STRAIGHT_RUN_STAIR.";
    case "quarter_turn":
      return ".QUARTER_TURN_STAIR.";
    case "half_turn":
      return ".HALF_TURN_STAIR.";
    case "spiral":
      return ".SPIRAL_STAIR.";
    default:
      return ".NOTDEFINED.";
  }
}
function pointAlongCenterline(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const dx = cl[i + 1].x - cl[i].x;
    const dy = cl[i + 1].y - cl[i].y;
    const len = Math.hypot(dx, dy);
    if (m <= acc + len) {
      const t = len > 1e-9 ? (m - acc) / len : 0;
      return { x: cl[i].x + dx * t, y: cl[i].y + dy * t };
    }
    acc += len;
  }
  const last = cl[cl.length - 1];
  return { x: last.x, y: last.y };
}
function tangentAlongCenterline(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const dx2 = cl[i + 1].x - cl[i].x;
    const dy2 = cl[i + 1].y - cl[i].y;
    const len2 = Math.hypot(dx2, dy2);
    if (m <= acc + len2) {
      return len2 > 1e-9 ? { x: dx2 / len2, y: dy2 / len2 } : { x: 1, y: 0 };
    }
    acc += len2;
  }
  const n = cl.length;
  const dx = cl[n - 1].x - cl[n - 2].x;
  const dy = cl[n - 1].y - cl[n - 2].y;
  const len = Math.hypot(dx, dy);
  return len > 1e-9 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
}
function endIsAtJoint(wall, pt) {
  const cl = wall.centerline;
  const startDist = Math.hypot(pt.x - cl[0].x, pt.y - cl[0].y);
  const endDist = Math.hypot(pt.x - cl[cl.length - 1].x, pt.y - cl[cl.length - 1].y);
  if (startDist < 1e-3) return "start";
  if (endDist < 1e-3) return "end";
  return "interior";
}
function connectionTypeFromEnd(end) {
  if (end === "start") return ".ATSTART.";
  if (end === "end") return ".ATEND.";
  return ".ATPATH.";
}

// src/core/geometry/ExtrudedRibbon.ts
var RibbonFrame = class {
  constructor(segStart, segEnd, halfWidth, baseZ, height, uOffset = 0) {
    this.origin = segStart;
    const delta = segEnd.sub(segStart);
    this.segLength = delta.len();
    this.dirU = this.segLength > 1e-9 ? delta.div(this.segLength) : new Vec2(1, 0);
    this.dirW = new Vec2(-this.dirU.y, this.dirU.x);
    this.halfWidth = halfWidth;
    this.baseZ = baseZ;
    this.height = height;
    this.uOffset = uOffset;
  }
  /** Local (u, v, w) → world (x, y, z). */
  toWorld(u, v, w = 0) {
    const xy = this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(w));
    return new Vec3(xy.x, xy.y, this.baseZ + v);
  }
  /** Local (u, w) → world XY (height ignored). */
  toWorldXY(u, w = 0) {
    return this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(w));
  }
  /** World point → (u, v, w). */
  toLocal(world) {
    const delta = new Vec2(world.x, world.y).sub(this.origin);
    return {
      u: delta.dot(this.dirU),
      w: delta.dot(this.dirW),
      v: world.z - this.baseZ
    };
  }
  leftAt(u) {
    return this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(this.halfWidth));
  }
  rightAt(u) {
    return this.origin.add(this.dirU.mul(u)).sub(this.dirW.mul(this.halfWidth));
  }
  centerAt(u) {
    return this.origin.add(this.dirU.mul(u));
  }
  get leftNormal() {
    return new Vec3(this.dirW.x, this.dirW.y, 0);
  }
  get rightNormal() {
    return new Vec3(-this.dirW.x, -this.dirW.y, 0);
  }
};
var RibbonOpening = class {
  constructor(centerlinePosition, width = 0.9, bottomOffset = 0, topOffset = 2.1) {
    this.centerlinePosition = centerlinePosition;
    this.width = width;
    this.bottomOffset = bottomOffset;
    this.topOffset = topOffset;
  }
};
var RibbonEndTrim = class _RibbonEndTrim {
  constructor(leftTrimPoint, leftTrimDir, rightTrimPoint, rightTrimDir) {
    this.leftTrimPoint = leftTrimPoint;
    this.leftTrimDir = leftTrimDir;
    this.rightTrimPoint = rightTrimPoint;
    this.rightTrimDir = rightTrimDir;
    /**
     * If `true`, the trimmed end gets an explicit cap face (built from the
     * trimmed leftPts / rightPts). Use for butt-style joints where the
     * trimmed end is visible at the joint. Default `false` (no cap), which
     * is correct for mitered joints where the two walls' offset edges
     * meet along the bisector and a cap would z-fight.
     */
    this.drawCap = false;
  }
  static bothSides(pointOnLine, lineDirection) {
    return new _RibbonEndTrim(pointOnLine, lineDirection, pointOnLine, lineDirection);
  }
};
var MITER_LIMIT = 6;
var ExtrudedRibbon = class {
  constructor(opts) {
    this.width = 0.2;
    this.height = 3;
    this.baseZ = 0;
    this.openings = [];
    const o = Array.isArray(opts) ? { centerline: opts } : opts;
    if (!o.centerline || o.centerline.length < 2) {
      throw new Error("ExtrudedRibbon: centerline needs at least 2 points");
    }
    this.centerline = o.centerline;
    if (o.width !== void 0) this.width = o.width;
    if (o.height !== void 0) this.height = o.height;
    if (o.baseZ !== void 0) this.baseZ = o.baseZ;
  }
  get length() {
    let total = 0;
    for (let i = 0; i < this.centerline.length - 1; i++) {
      total += this.centerline[i].distTo(this.centerline[i + 1]);
    }
    return total;
  }
  get segmentCount() {
    return this.centerline.length - 1;
  }
  get isClosedPolyline() {
    const cl = this.centerline;
    return cl.length >= 3 && cl[0].distSqTo(cl[cl.length - 1]) < 1e-10;
  }
  // ── Meshing ──
  /** Build a stand-alone triangle mesh for this ribbon. */
  toMesh() {
    const buf = newBuffers();
    this.buildInto(buf, null, null);
    return finishMesh(buf);
  }
  /**
   * Append this ribbon's geometry into accumulator buffers (used by
   * RibbonSystem to combine many ribbons in one mesh).
   */
  buildInto(buf, startTrim, endTrim) {
    const cl = this.centerline;
    const n = cl.length;
    if (n < 2) return;
    const isClosed = this.isClosedPolyline;
    const vCount = isClosed ? n - 1 : n;
    const r = this.width * 0.5;
    const z0 = this.baseZ;
    const z1 = this.baseZ + this.height;
    const leftPts = new Array(vCount);
    const rightPts = new Array(vCount);
    for (let i = 0; i < vCount; i++) {
      const p = cl[i];
      let prev = null;
      let next = null;
      if (i > 0) prev = cl[i - 1];
      else if (isClosed) prev = cl[vCount - 1];
      if (i < vCount - 1) next = cl[i + 1];
      else if (isClosed) next = cl[0];
      const { left, right } = computeOffsetPoint(p, prev, next, r);
      leftPts[i] = left;
      rightPts[i] = right;
    }
    if (!isClosed && vCount >= 2) {
      if (startTrim) {
        const d = safeNormalize(cl[1].sub(cl[0]));
        const trimmed = applyEndTrim(cl[0], d, r, startTrim);
        leftPts[0] = trimmed.left;
        rightPts[0] = trimmed.right;
      }
      if (endTrim) {
        const last = vCount - 1;
        const d = safeNormalize(cl[last].sub(cl[last - 1]));
        const trimmed = applyEndTrim(cl[last], d, r, endTrim);
        leftPts[last] = trimmed.left;
        rightPts[last] = trimmed.right;
      }
    }
    const arcLen = new Array(vCount).fill(0);
    for (let i = 1; i < vCount; i++) {
      arcLen[i] = arcLen[i - 1] + cl[i - 1].distTo(cl[i]);
    }
    const segCount = isClosed ? vCount : vCount - 1;
    for (let s = 0; s < segCount; s++) {
      const i = s;
      const j = (s + 1) % vCount;
      const iL = leftPts[i], iR = rightPts[i];
      const jL = leftPts[j], jR = rightPts[j];
      const segStart = arcLen[i];
      let segEnd = arcLen[j < vCount ? j : 0];
      if (segEnd <= segStart) segEnd = segStart + cl[i].distTo(cl[j]);
      const segLen = segEnd - segStart;
      const frame = new RibbonFrame(cl[i], cl[j], r, z0, z1 - z0, segStart);
      const iLu = iL.sub(cl[i]).dot(frame.dirU);
      const iRu = iR.sub(cl[i]).dot(frame.dirU);
      const jLu = segLen + jL.sub(cl[j]).dot(frame.dirU);
      const jRu = segLen + jR.sub(cl[j]).dot(frame.dirU);
      const startMinU = Math.min(iLu, iRu);
      const endMaxU = Math.max(jLu, jRu);
      const minStrip = Math.max(0.02, segLen * 0.02);
      const ops = [];
      for (const op of this.openings) {
        if (op.centerlinePosition < segStart || op.centerlinePosition > segEnd) continue;
        const cu = op.centerlinePosition - segStart;
        let uL = Math.max(cu - op.width * 0.5, 0);
        let uR = Math.min(cu + op.width * 0.5, segLen);
        if (uR <= uL + 1e-6) continue;
        if (uL < minStrip) uL = Math.max(startMinU, 0);
        if (segLen - uR < minStrip) uR = Math.min(endMaxU, segLen);
        ops.push({ uL, uR, vBot: op.bottomOffset, vTop: op.topOffset });
      }
      ops.sort((a, b) => a.uL - b.uL);
      if (ops.length === 0) {
        emitQuad(
          buf,
          new Vec3(iL.x, iL.y, z0),
          new Vec3(iL.x, iL.y, z1),
          new Vec3(jL.x, jL.y, z1),
          new Vec3(jL.x, jL.y, z0),
          frame.leftNormal
        );
        emitQuad(
          buf,
          new Vec3(iR.x, iR.y, z0),
          new Vec3(jR.x, jR.y, z0),
          new Vec3(jR.x, jR.y, z1),
          new Vec3(iR.x, iR.y, z1),
          frame.rightNormal
        );
      } else {
        const h = z1 - z0;
        emitSideLocal(buf, frame, segLen, h, ops, 1, iL, jL);
        emitSideLocal(buf, frame, segLen, h, ops, -1, iR, jR);
        const eps = segLen * 0.01;
        for (const { uL, uR, vBot, vTop } of ops) {
          const atStart = uL < eps;
          const atEnd = uR > segLen - eps;
          const llXY = atStart ? iL : frame.toWorldXY(uL, +r);
          const lrXY = atEnd ? jL : frame.toWorldXY(uR, +r);
          const rlXY = atStart ? iR : frame.toWorldXY(uL, -r);
          const rrXY = atEnd ? jR : frame.toWorldXY(uR, -r);
          const zSill = z0 + vBot;
          const zHead = z0 + vTop;
          emitQuad(
            buf,
            new Vec3(llXY.x, llXY.y, zHead),
            new Vec3(rlXY.x, rlXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zHead),
            new Vec3(lrXY.x, lrXY.y, zHead),
            new Vec3(0, 0, -1)
          );
          if (vBot > 1e-3) {
            emitQuad(
              buf,
              new Vec3(llXY.x, llXY.y, zSill),
              new Vec3(lrXY.x, lrXY.y, zSill),
              new Vec3(rrXY.x, rrXY.y, zSill),
              new Vec3(rlXY.x, rlXY.y, zSill),
              new Vec3(0, 0, 1)
            );
          }
          const jambLN = new Vec3(-frame.dirU.x, -frame.dirU.y, 0);
          emitQuad(
            buf,
            new Vec3(llXY.x, llXY.y, zSill),
            new Vec3(rlXY.x, rlXY.y, zSill),
            new Vec3(rlXY.x, rlXY.y, zHead),
            new Vec3(llXY.x, llXY.y, zHead),
            jambLN
          );
          const jambRN = new Vec3(frame.dirU.x, frame.dirU.y, 0);
          emitQuad(
            buf,
            new Vec3(lrXY.x, lrXY.y, zSill),
            new Vec3(lrXY.x, lrXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zSill),
            jambRN
          );
        }
      }
      emitQuad(
        buf,
        new Vec3(iL.x, iL.y, z1),
        new Vec3(iR.x, iR.y, z1),
        new Vec3(jR.x, jR.y, z1),
        new Vec3(jL.x, jL.y, z1),
        new Vec3(0, 0, 1)
      );
      emitQuad(
        buf,
        new Vec3(iL.x, iL.y, z0),
        new Vec3(jL.x, jL.y, z0),
        new Vec3(jR.x, jR.y, z0),
        new Vec3(iR.x, iR.y, z0),
        new Vec3(0, 0, -1)
      );
    }
    if (!isClosed) {
      if (startTrim === null || startTrim.drawCap) {
        const firstDir = safeNormalize(cl[1].sub(cl[0]));
        const startNormal = new Vec3(-firstDir.x, -firstDir.y, 0);
        const sL = leftPts[0], sR = rightPts[0];
        emitQuad(
          buf,
          new Vec3(sL.x, sL.y, z0),
          new Vec3(sR.x, sR.y, z0),
          new Vec3(sR.x, sR.y, z1),
          new Vec3(sL.x, sL.y, z1),
          startNormal
        );
      }
      if (endTrim === null || endTrim.drawCap) {
        const last = vCount - 1;
        const lastDir = safeNormalize(cl[last].sub(cl[last - 1]));
        const endNormal = new Vec3(lastDir.x, lastDir.y, 0);
        const eL = leftPts[last], eR = rightPts[last];
        emitQuad(
          buf,
          new Vec3(eR.x, eR.y, z0),
          new Vec3(eL.x, eL.y, z0),
          new Vec3(eL.x, eL.y, z1),
          new Vec3(eR.x, eR.y, z1),
          endNormal
        );
      }
    }
  }
};
function newBuffers() {
  return { positions: [], normals: [], indices: [] };
}
function finishMesh(buf) {
  return new Mesh(
    new Float32Array(buf.positions),
    new Uint32Array(buf.indices),
    new Float32Array(buf.normals)
  );
}
function emitQuad(buf, a, b, c, d, normal) {
  const base = buf.positions.length / 3;
  buf.positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
  for (let i = 0; i < 4; i++) buf.normals.push(normal.x, normal.y, normal.z);
  buf.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
function computeOffsetPoint(p, prev, next, r) {
  if (prev === null && next === null) return { left: p, right: p };
  if (prev === null) {
    const d = safeNormalize(next.sub(p));
    const n = new Vec2(-d.y, d.x);
    return { left: p.add(n.mul(r)), right: p.sub(n.mul(r)) };
  }
  if (next === null) {
    const d = safeNormalize(p.sub(prev));
    const n = new Vec2(-d.y, d.x);
    return { left: p.add(n.mul(r)), right: p.sub(n.mul(r)) };
  }
  const d1 = safeNormalize(p.sub(prev));
  const d2 = safeNormalize(next.sub(p));
  const n1 = new Vec2(-d1.y, d1.x);
  const n2 = new Vec2(-d2.y, d2.x);
  const dot = d1.x * d2.x + d1.y * d2.y;
  if (dot < -0.999) {
    return { left: p.add(n1.mul(r)), right: p.sub(n1.mul(r)) };
  }
  let miter = n1.add(n2).mul(r / (1 + dot));
  const maxLen = r * MITER_LIMIT;
  if (miter.lenSq() > maxLen * maxLen) miter = n1.mul(r);
  return { left: p.add(miter), right: p.sub(miter) };
}
function applyEndTrim(endpoint, wallDir, r, trim) {
  const perp = new Vec2(-wallDir.y, wallDir.x);
  const leftLineOrigin = endpoint.add(perp.mul(r));
  const rightLineOrigin = endpoint.sub(perp.mul(r));
  const left = intersectLines(leftLineOrigin, wallDir, trim.leftTrimPoint, trim.leftTrimDir) ?? leftLineOrigin;
  const right = intersectLines(rightLineOrigin, wallDir, trim.rightTrimPoint, trim.rightTrimDir) ?? rightLineOrigin;
  return { left, right };
}
function intersectLines(p1, d1, p2, d2) {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-9) return null;
  const delta = p2.sub(p1);
  const t = (delta.x * d2.y - delta.y * d2.x) / denom;
  return p1.add(d1.mul(t));
}
function safeNormalize(v) {
  const len = v.len();
  return len > 1e-9 ? v.div(len) : new Vec2(1, 0);
}
function emitSideLocal(buf, frame, segLen, height, openings, side, startMiter, endMiter) {
  const w = frame.halfWidth * side;
  const normal = side > 0 ? frame.leftNormal : frame.rightNormal;
  const flip = side < 0;
  let cursor = 0;
  const minU = segLen * 5e-3;
  for (let oi = 0; oi < openings.length; oi++) {
    const { uL, uR, vBot, vTop } = openings[oi];
    if (uL > cursor + minU) {
      const isFirst = cursor < 1e-3;
      emitSideStrip(
        buf,
        frame,
        cursor,
        uL,
        0,
        height,
        w,
        normal,
        flip,
        isFirst ? startMiter : null,
        null
      );
    }
    if (vTop < height - 1e-3) {
      const hAtStart = uL < 1e-3;
      const hAtEnd = uR > segLen - 1e-3;
      emitSideStrip(
        buf,
        frame,
        uL,
        uR,
        vTop,
        height,
        w,
        normal,
        flip,
        hAtStart ? startMiter : null,
        hAtEnd ? endMiter : null
      );
    }
    if (vBot > 1e-3) {
      const sAtStart = uL < 1e-3;
      const sAtEnd = uR > segLen - 1e-3;
      emitSideStrip(
        buf,
        frame,
        uL,
        uR,
        0,
        vBot,
        w,
        normal,
        flip,
        sAtStart ? startMiter : null,
        sAtEnd ? endMiter : null
      );
    }
    cursor = uR;
  }
  if (cursor < segLen - minU) {
    emitSideStrip(
      buf,
      frame,
      cursor,
      segLen,
      0,
      height,
      w,
      normal,
      flip,
      null,
      endMiter
    );
  }
}
function emitSideStrip(buf, frame, u0, u1, v0, v1, w, normal, flipWinding, startMiterPt, endMiterPt) {
  let a, b;
  if (startMiterPt) {
    a = new Vec3(startMiterPt.x, startMiterPt.y, frame.baseZ + v0);
    b = new Vec3(startMiterPt.x, startMiterPt.y, frame.baseZ + v1);
  } else {
    a = frame.toWorld(u0, v0, w);
    b = frame.toWorld(u0, v1, w);
  }
  let c, d;
  if (endMiterPt) {
    c = new Vec3(endMiterPt.x, endMiterPt.y, frame.baseZ + v1);
    d = new Vec3(endMiterPt.x, endMiterPt.y, frame.baseZ + v0);
  } else {
    c = frame.toWorld(u1, v1, w);
    d = frame.toWorld(u1, v0, w);
  }
  if (flipWinding) emitQuad(buf, a, d, c, b, normal);
  else emitQuad(buf, a, b, c, d, normal);
}

// src/core/geometry/RibbonJoint.ts
var RibbonJoint = class {
  constructor(participants, point, kind) {
    this.style = "mitered";
    this.participants = participants;
    this.point = point;
    this.kind = kind;
    const interiorP = participants.find((p) => p.endIsAtJoint === null);
    if (interiorP) {
      this.throughRibbon = interiorP.ribbon;
    } else {
      this.throughRibbon = participants.map((p) => p.ribbon).reduce((a, b) => clLen(a.centerline) > clLen(b.centerline) ? a : b);
    }
  }
  /** Compute per-ribbon trim contributions from this joint. */
  computeTrims() {
    const out = /* @__PURE__ */ new Map();
    if (this.style === "butt") this.computeButtTrims(out);
    else this.computeMiteredTrims(out);
    return out;
  }
  // ── Style: mitered ──────────────────────────────────────────────
  computeMiteredTrims(out) {
    if (this.kind === "T") {
      const throughP = this.participants.find((p) => p.endIsAtJoint === null);
      const stemP = this.participants.find((p) => p.endIsAtJoint !== null);
      if (!throughP || !stemP) return;
      out.set(throughP.ribbon, {});
      const segDir = segmentTangent(throughP.ribbon.centerline, throughP.arcLength);
      const perp = new Vec2(-segDir.y, segDir.x);
      const halfW = throughP.ribbon.width * 0.5;
      const stemInteriorRef = interiorReference(stemP);
      const toStem = stemInteriorRef.sub(this.point);
      const side = perp.x * toStem.x + perp.y * toStem.y;
      const nearFacePoint = side >= 0 ? this.point.add(perp.mul(halfW)) : this.point.sub(perp.mul(halfW));
      const trim = RibbonEndTrim.bothSides(nearFacePoint, segDir);
      setEndTrim(out, stemP, trim);
      return;
    }
    const dirs = this.participants.filter((p) => p.endIsAtJoint !== null).map((p) => ({ p, dir: dirAwayFromJoint(p) })).map((e) => ({ ...e, angle: Math.atan2(e.dir.y, e.dir.x) })).sort((a, b) => a.angle - b.angle);
    if (dirs.length < 2) return;
    for (let i = 0; i < dirs.length; i++) {
      const cur = dirs[i];
      const cw = dirs[(i - 1 + dirs.length) % dirs.length].dir;
      const ccw = dirs[(i + 1) % dirs.length].dir;
      const cwBisector = safeNormalize(cur.dir.add(cw));
      const ccwBisector = safeNormalize(cur.dir.add(ccw));
      const crossCW = cur.dir.x * cw.y - cur.dir.y * cw.x;
      const crossCCW = cur.dir.x * ccw.y - cur.dir.y * ccw.x;
      if (Math.abs(crossCW) < 1e-6 && Math.abs(crossCCW) < 1e-6) continue;
      setEndTrim(out, cur.p, new RibbonEndTrim(this.point, ccwBisector, this.point, cwBisector));
    }
  }
  // ── Style: butt ────────────────────────────────────────────────
  computeButtTrims(out) {
    const through = this.throughRibbon;
    if (!through) {
      this.computeMiteredTrims(out);
      return;
    }
    const throughP = this.participants.find((p) => p.ribbon === through);
    if (!throughP) {
      this.computeMiteredTrims(out);
      return;
    }
    const throughDirAway = throughP.endIsAtJoint === null ? segmentTangent(through.centerline, throughP.arcLength) : dirAwayFromJoint(throughP);
    const perp = new Vec2(-throughDirAway.y, throughDirAway.x);
    const halfW_through = through.width * 0.5;
    if (throughP.endIsAtJoint === null) {
      out.set(through, {});
    } else {
      const buttings = this.participants.filter((p) => p.ribbon !== through);
      const maxButtHalfW = buttings.reduce((m, p) => Math.max(m, p.ribbon.width * 0.5), 0);
      const extensionDir = throughDirAway.mul(-1);
      const extendedPoint = this.point.add(extensionDir.mul(maxButtHalfW));
      const trim = RibbonEndTrim.bothSides(extendedPoint, perp);
      trim.drawCap = true;
      const t = {};
      if (throughP.endIsAtJoint === "start") t.start = trim;
      else t.end = trim;
      out.set(through, t);
    }
    for (const p of this.participants) {
      if (p.ribbon === through) continue;
      const interiorRef = interiorReference(p);
      const toInside = interiorRef.sub(this.point);
      const side = perp.x * toInside.x + perp.y * toInside.y;
      const nearFacePoint = side >= 0 ? this.point.add(perp.mul(halfW_through)) : this.point.sub(perp.mul(halfW_through));
      const trim = RibbonEndTrim.bothSides(nearFacePoint, throughDirAway);
      trim.drawCap = true;
      setEndTrim(out, p, trim);
    }
  }
};
function clLen(cl) {
  let total = 0;
  for (let i = 0; i < cl.length - 1; i++) total += cl[i].distTo(cl[i + 1]);
  return total;
}
function segmentTangent(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const d2 = cl[i + 1].sub(cl[i]);
      const len2 = d2.len();
      return len2 > 1e-9 ? d2.div(len2) : new Vec2(1, 0);
    }
    acc += segLen;
  }
  const d = cl[cl.length - 1].sub(cl[cl.length - 2]);
  const len = d.len();
  return len > 1e-9 ? d.div(len) : new Vec2(1, 0);
}
function dirAwayFromJoint(p) {
  const cl = p.ribbon.centerline;
  if (p.endIsAtJoint === "start") return safeNormalize(cl[1].sub(cl[0]));
  if (p.endIsAtJoint === "end") return safeNormalize(cl[cl.length - 2].sub(cl[cl.length - 1]));
  return new Vec2(1, 0);
}
function interiorReference(p) {
  const cl = p.ribbon.centerline;
  if (p.endIsAtJoint === "start") return cl[1];
  if (p.endIsAtJoint === "end") return cl[cl.length - 2];
  return cl[0];
}
function setEndTrim(out, p, trim) {
  const cur = out.get(p.ribbon) ?? {};
  if (p.endIsAtJoint === "start") cur.start = trim;
  else if (p.endIsAtJoint === "end") cur.end = trim;
  out.set(p.ribbon, cur);
}

// src/core/geometry/RibbonSystem.ts
var RibbonSystem = class {
  constructor(ribbons) {
    this.ribbons = [];
    this.joints = [];
    this.touchEpsilon = 1e-3;
    this._jointsDetected = false;
    if (ribbons) for (const r of ribbons) this.ribbons.push(r);
  }
  add(ribbon) {
    this.ribbons.push(ribbon);
    this._jointsDetected = false;
  }
  // ── Joint detection ────────────────────────────────────────────────
  /**
   * Re-scan the ribbon geometry and rebuild the `joints` array. Called
   * implicitly by `buildMesh` / `computeTrims` when no detection has
   * happened yet. Call explicitly if you've mutated ribbon centerlines
   * after the initial detection.
   *
   * Existing joint *styles* are preserved when the same set of ribbons
   * meet at the same point — useful so a user-set `style: "butt"`
   * survives a geometry update.
   */
  detectJoints() {
    const eps = this.touchEpsilon;
    const oldStyles = /* @__PURE__ */ new Map();
    for (const j of this.joints) oldStyles.set(this.jointKey(j), j);
    const next = [];
    for (let i = 0; i < this.ribbons.length; i++) {
      const stem = this.ribbons[i];
      if (stem.isClosedPolyline) continue;
      const stemEndpoints = ["start", "end"];
      for (const which of stemEndpoints) {
        const ep = which === "start" ? stem.centerline[0] : stem.centerline[stem.centerline.length - 1];
        for (let j = 0; j < this.ribbons.length; j++) {
          if (j === i) continue;
          const through = this.ribbons[j];
          const segCount = through.centerline.length - 1;
          let acc = 0;
          let found = false;
          for (let s = 0; s < segCount && !found; s++) {
            const a = through.centerline[s];
            const b = through.centerline[s + 1];
            const ab = b.sub(a);
            const lenSq = ab.lenSq();
            if (lenSq < 1e-18) continue;
            const t = ep.sub(a).dot(ab) / lenSq;
            if (t > eps && t < 1 - eps) {
              const closest = a.add(ab.mul(t));
              if (closest.distTo(ep) < eps) {
                const arcOnThrough = acc + t * Math.sqrt(lenSq);
                const participants = [
                  { ribbon: through, endIsAtJoint: null, arcLength: arcOnThrough },
                  { ribbon: stem, endIsAtJoint: which, arcLength: which === "start" ? 0 : clLen2(stem.centerline) }
                ];
                const joint = new RibbonJoint(participants, ep, "T");
                this.applyOldStyle(joint, oldStyles);
                next.push(joint);
                found = true;
              }
            }
            acc += Math.sqrt(lenSq);
          }
        }
      }
    }
    const endpoints = [];
    for (const r of this.ribbons) {
      if (r.isClosedPolyline) continue;
      endpoints.push({ ribbon: r, which: "start", point: r.centerline[0] });
      endpoints.push({ ribbon: r, which: "end", point: r.centerline[r.centerline.length - 1] });
    }
    const used = /* @__PURE__ */ new Set();
    for (let i = 0; i < endpoints.length; i++) {
      if (used.has(i)) continue;
      const cluster = [endpoints[i]];
      for (let k = i + 1; k < endpoints.length; k++) {
        if (used.has(k)) continue;
        if (endpoints[k].point.distTo(endpoints[i].point) < eps) {
          cluster.push(endpoints[k]);
          used.add(k);
        }
      }
      if (cluster.length < 2) continue;
      used.add(i);
      const participants = cluster.map((e) => ({
        ribbon: e.ribbon,
        endIsAtJoint: e.which,
        arcLength: e.which === "start" ? 0 : clLen2(e.ribbon.centerline)
      }));
      const kind = cluster.length === 2 ? "L" : cluster.length === 3 ? "Y" : cluster.length === 4 ? "X" : "cluster";
      const joint = new RibbonJoint(participants, cluster[0].point, kind);
      this.applyOldStyle(joint, oldStyles);
      next.push(joint);
    }
    this.joints = next;
    this._jointsDetected = true;
  }
  applyOldStyle(joint, old) {
    const prior = old.get(this.jointKey(joint));
    if (prior) {
      joint.style = prior.style;
      joint.throughRibbon = prior.throughRibbon;
    }
  }
  jointKey(j) {
    const idxs = j.participants.map((p) => this.ribbons.indexOf(p.ribbon)).filter((i) => i >= 0).sort((a, b) => a - b);
    return `${j.kind}:${idxs.join(",")}`;
  }
  // ── Trim aggregation ───────────────────────────────────────────────
  /** Aggregate per-ribbon trims from every joint. Returns `{start, end}` per ribbon. */
  computeTrims() {
    if (!this._jointsDetected) this.detectJoints();
    const trims = this.ribbons.map(() => ({ start: null, end: null }));
    for (const j of this.joints) {
      const byRibbon = j.computeTrims();
      for (const [ribbon, t] of byRibbon) {
        const i = this.ribbons.indexOf(ribbon);
        if (i < 0) continue;
        if (t.start !== void 0) trims[i].start = t.start;
        if (t.end !== void 0) trims[i].end = t.end;
      }
    }
    return trims;
  }
  /**
   * Backward-compat: return T-junctions where another ribbon's endpoint
   * lands on this ribbon's interior. Drawn from the populated `joints`
   * array — does not re-scan geometry independently.
   */
  findTJunctionsOnRibbon(ribbon) {
    if (!this._jointsDetected) this.detectJoints();
    const result = [];
    for (const j of this.joints) {
      if (j.kind !== "T") continue;
      const throughP = j.participants.find((p) => p.endIsAtJoint === null);
      const stemP = j.participants.find((p) => p.endIsAtJoint !== null);
      if (!throughP || !stemP) continue;
      if (throughP.ribbon !== ribbon) continue;
      result.push({ arcLength: throughP.arcLength, otherRibbon: stemP.ribbon });
    }
    return result;
  }
  // ── Meshing ────────────────────────────────────────────────────────
  buildMesh() {
    const buf = newBuffers();
    this.buildInto(buf);
    return finishMesh(buf);
  }
  buildInto(buf) {
    const trims = this.computeTrims();
    for (let i = 0; i < this.ribbons.length; i++) {
      this.ribbons[i].buildInto(buf, trims[i].start, trims[i].end);
    }
  }
};
function clLen2(cl) {
  let total = 0;
  for (let i = 0; i < cl.length - 1; i++) total += cl[i].distTo(cl[i + 1]);
  return total;
}

// src/bim/walls/types.ts
var WallType = class {
  constructor(opts) {
    this.name = opts.name;
    this.description = opts.description;
    this.construction = opts.construction;
    this.layers = opts.layers;
    this.properties = opts.properties ?? {};
    this.junctionStyle = opts.junctionStyle;
  }
  /** Total nominal thickness summed from material layers (0 if none). */
  get layeredThickness() {
    return (this.layers ?? []).reduce((s, l) => s + l.thickness, 0);
  }
};
function realize(wall, ctx) {
  const type = wall.type;
  const envelopeMesh = wall.toMesh();
  const parts = type?.construction ? type.construction(wall, ctx) : [];
  const layers = type?.layers ?? [];
  const properties = { ...type?.properties ?? {}, ...wall.properties ?? {} };
  return { wall, parts, layers, envelopeMesh, properties };
}
function realizeSystem(system) {
  const trims = system.ribbons.computeTrims();
  const out = [];
  for (let i = 0; i < system.walls.length; i++) {
    const wall = system.walls[i];
    const t = trims[i] ?? { start: null, end: null };
    const tJunctions = system.ribbons.findTJunctionsOnRibbon(wall.ribbon).map((j) => {
      const otherWall = system.walls.find((w) => w.ribbon === j.otherRibbon);
      return {
        arcLength: j.arcLength,
        otherWall: otherWall ?? wall,
        otherThickness: otherWall?.thickness ?? 0
      };
    });
    const ctx = {
      startTrim: t.start ?? void 0,
      endTrim: t.end ?? void 0,
      tJunctions
    };
    out.push(realize(wall, ctx));
  }
  return out;
}
function buildCutList(parts, roundMm = 1) {
  const buckets = /* @__PURE__ */ new Map();
  for (const p of parts) {
    if (p.length === void 0 || !p.profile || !p.material) continue;
    const lenMm = Math.round(p.length * 1e3 / roundMm) * roundMm;
    const key = `${p.material}|${p.profile.name ?? `${p.profile.w}x${p.profile.h}`}|${lenMm}|${p.role}`;
    const existing = buckets.get(key);
    if (existing) existing.count++;
    else buckets.set(key, {
      material: p.material,
      profile: p.profile,
      length: lenMm / 1e3,
      count: 1,
      role: p.role
    });
  }
  return [...buckets.values()].sort(
    (a, b) => a.material.localeCompare(b.material) || a.length - b.length
  );
}

// src/bim/walls/joints.ts
var WallJoint = class {
  constructor(opts) {
    this.connectionType = "unspecified";
    this.properties = {};
    this.ribbonJoint = opts.ribbonJoint;
    this.walls = opts.walls;
    if (opts.connectionType) this.connectionType = opts.connectionType;
    if (opts.fastenerCount !== void 0) this.fastenerCount = opts.fastenerCount;
    if (opts.properties) this.properties = opts.properties;
  }
  /** Joint geometry style. Mirrors `ribbonJoint.style`. */
  get style() {
    return this.ribbonJoint.style;
  }
  set style(v) {
    this.ribbonJoint.style = v;
  }
  /** For "butt" style: which wall passes through. */
  get throughWall() {
    const through = this.ribbonJoint.throughRibbon;
    return through ? this.walls.find((w) => w.ribbon === through) : void 0;
  }
  set throughWall(w) {
    this.ribbonJoint.throughRibbon = w?.ribbon;
  }
  /** Joint kind (L/T/Y/X/cluster). Read-only — derived from geometry. */
  get kind() {
    return this.ribbonJoint.kind;
  }
};

// src/core/geometry/walls.ts
var WallOpening = class _WallOpening {
  constructor(centerlinePosition, width = 0.9, sillHeight = 0, headHeight = 2.1, name) {
    this.centerlinePosition = centerlinePosition;
    this.width = width;
    this.sillHeight = sillHeight;
    this.headHeight = headHeight;
    this.name = name;
  }
  /** True if sillHeight is effectively zero (door-type opening). */
  get isDoor() {
    return this.sillHeight <= 1e-3;
  }
  static door(centerlinePosition, width = 0.9, headHeight = 2.1) {
    return new _WallOpening(centerlinePosition, width, 0, headHeight, "Door");
  }
  static window(centerlinePosition, width = 1.2, sillHeight = 0.9, headHeight = 2.2) {
    return new _WallOpening(centerlinePosition, width, sillHeight, headHeight, "Window");
  }
};
var Wall = class _Wall {
  constructor(opts) {
    /** Rectangular openings (doors, windows). Synced into the ribbon at meshing time. */
    this.openings = [];
    if (Array.isArray(opts)) {
      this.ribbon = new ExtrudedRibbon(opts);
    } else {
      this.ribbon = new ExtrudedRibbon({
        centerline: opts.centerline,
        width: opts.thickness,
        height: opts.height,
        baseZ: opts.baseElevation
      });
      this.name = opts.name;
      this.type = opts.type;
      this.properties = opts.properties;
    }
  }
  /** Convenience constructor for a single straight wall. */
  static segment(start, end, opts = {}) {
    return new _Wall({
      centerline: [start, end],
      thickness: opts.thickness,
      height: opts.height,
      baseElevation: opts.baseElevation,
      name: opts.name
    });
  }
  // ── Forwarded properties (convenience) ──
  get centerline() {
    return this.ribbon.centerline;
  }
  set centerline(v) {
    this.ribbon.centerline = v;
  }
  get thickness() {
    return this.ribbon.width;
  }
  set thickness(v) {
    this.ribbon.width = v;
  }
  get height() {
    return this.ribbon.height;
  }
  set height(v) {
    this.ribbon.height = v;
  }
  get baseElevation() {
    return this.ribbon.baseZ;
  }
  set baseElevation(v) {
    this.ribbon.baseZ = v;
  }
  get length() {
    return this.ribbon.length;
  }
  get segmentCount() {
    return this.ribbon.segmentCount;
  }
  get isClosedPolyline() {
    return this.ribbon.isClosedPolyline;
  }
  // ── Meshing ──
  /** Build a stand-alone triangle mesh for this wall (no junction analysis). */
  toMesh() {
    this.syncOpeningsToRibbon();
    return this.ribbon.toMesh();
  }
  /** Build a combined mesh from a collection of walls (no junction analysis). */
  static buildMesh(walls) {
    const buf = newBuffers();
    for (const w of walls) {
      w.syncOpeningsToRibbon();
      w.ribbon.buildInto(buf, null, null);
    }
    return finishMesh(buf);
  }
  /**
   * Translate WallOpenings (BIM level) → RibbonOpenings (geometry level).
   * Called automatically by `toMesh` / `Wall.buildMesh` / `WallSystem.buildMesh`.
   */
  syncOpeningsToRibbon() {
    this.ribbon.openings.length = 0;
    for (const wo of this.openings) {
      this.ribbon.openings.push(new RibbonOpening(
        wo.centerlinePosition,
        wo.width,
        wo.sillHeight,
        wo.headHeight
      ));
    }
  }
};
var WallSystem = class {
  constructor(walls) {
    /** The underlying geometry-level ribbon system. */
    this.ribbons = new RibbonSystem();
    /** BIM-level wall references (parallel to `ribbons.ribbons`). */
    this.walls = [];
    this._jointCache = [];
    this._jointCacheStamp = -1;
    if (walls) for (const w of walls) this.add(w);
  }
  get touchEpsilon() {
    return this.ribbons.touchEpsilon;
  }
  set touchEpsilon(v) {
    this.ribbons.touchEpsilon = v;
  }
  add(wall) {
    this.walls.push(wall);
    wall.syncOpeningsToRibbon();
    this.ribbons.add(wall.ribbon);
    this._jointCacheStamp = -1;
  }
  /** BIM-level joints, mirroring `ribbons.joints` 1-to-1. Built lazily. */
  get joints() {
    this.ensureJoints();
    return this._jointCache;
  }
  /**
   * Force a fresh joint detection (RibbonSystem-level) and rebuild the
   * `WallJoint` wrappers with per-`WallType` default styles applied.
   * Call after mutating wall centerlines / types.
   */
  detectJoints() {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ribbons.detectJoints();
    this.rebuildJointCache();
  }
  ensureJoints() {
    this.ribbons.detectJoints();
    if (this._jointCacheStamp !== this.ribbons.joints.length || this._jointCache.length !== this.ribbons.joints.length) {
      this.rebuildJointCache();
    }
  }
  rebuildJointCache() {
    this._jointCache = this.ribbons.joints.map((rj) => {
      const walls = rj.participants.map((p) => this.walls.find((w) => w.ribbon === p.ribbon)).filter((w) => !!w);
      const styleVotes = /* @__PURE__ */ new Map();
      for (const w of walls) {
        const s = w.type?.junctionStyle;
        if (s) styleVotes.set(s, (styleVotes.get(s) ?? 0) + 1);
      }
      let winner;
      let winCount = 0;
      for (const [s, c] of styleVotes) if (c > winCount) {
        winner = s;
        winCount = c;
      }
      if (winner === "butt" || winner === "mitered") rj.style = winner;
      return new WallJoint({ ribbonJoint: rj, walls });
    });
    this._jointCacheStamp = this.ribbons.joints.length;
  }
  /** Build one combined mesh for every wall, with junction trims applied. */
  buildMesh() {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ensureJoints();
    return this.ribbons.buildMesh();
  }
  /**
   * Realise every wall in the system with **junction-aware framing**:
   * plate trims, partition-end shortening, channel-stud insertion in
   * through-walls. Joints are detected (or refreshed) automatically.
   */
  realize() {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ensureJoints();
    return realizeSystem(this);
  }
};

// src/bim/walls/solid.ts
var SolidConstruction = (wall) => [{
  name: "shell",
  role: "monolithic",
  mesh: wall.toMesh(),
  ifcType: "IfcWall"
}];

// src/bim/walls/framing-helpers.ts
function makePlate(name, role, centerline, z, verticalH, acrossWallW, material, profile, startTrim = null, endTrim = null) {
  const ribbon = new ExtrudedRibbon({
    centerline,
    width: acrossWallW,
    height: verticalH,
    baseZ: z
  });
  let mesh;
  if (startTrim || endTrim) {
    const buf = newBuffers();
    ribbon.buildInto(buf, startTrim, endTrim);
    mesh = finishMesh(buf);
  } else {
    mesh = ribbon.toMesh();
  }
  return {
    name,
    role,
    mesh,
    material,
    profile,
    length: polylineLength(centerline),
    ifcType: "IfcMember"
  };
}
function makeStud(name, role, position, tangent, baseZ, height, profile, material) {
  const depthH = profile.h;
  const widthW = profile.w;
  const perp = new Vec2(-tangent.y, tangent.x);
  const studStart = position.sub(perp.mul(depthH * 0.5));
  const studEnd = position.add(perp.mul(depthH * 0.5));
  const ribbon = new ExtrudedRibbon({
    centerline: [studStart, studEnd],
    width: widthW,
    height,
    baseZ
  });
  return {
    name,
    role,
    mesh: ribbon.toMesh(),
    material,
    profile,
    length: height,
    ifcType: "IfcMember"
  };
}
function makeBeam(name, role, centerline, z, verticalDepth, acrossWallW, material, profile) {
  const ribbon = new ExtrudedRibbon({
    centerline,
    width: acrossWallW,
    height: verticalDepth,
    baseZ: z
  });
  return {
    name,
    role,
    mesh: ribbon.toMesh(),
    material,
    profile,
    length: polylineLength(centerline),
    ifcType: "IfcMember"
  };
}
function polylineLength(cl) {
  return Polygon2D.polylineLength(cl);
}
function pointAt(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const t = segLen > 1e-9 ? (m - acc) / segLen : 0;
      return cl[i].add(cl[i + 1].sub(cl[i]).mul(t));
    }
    acc += segLen;
  }
  return cl[cl.length - 1];
}
function tangentAt(cl, m) {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const d2 = cl[i + 1].sub(cl[i]);
      const len2 = d2.len();
      return len2 > 1e-9 ? d2.div(len2) : new Vec2(1, 0);
    }
    acc += segLen;
  }
  const d = cl[cl.length - 1].sub(cl[cl.length - 2]);
  const len = d.len();
  return len > 1e-9 ? d.div(len) : new Vec2(1, 0);
}
function subCenterline(cl, uStart, uEnd) {
  if (uEnd <= uStart) return [];
  const result = [];
  let acc = 0;
  let started = false;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    const segStart = acc;
    const segEnd = acc + segLen;
    if (uEnd <= segStart) break;
    if (uStart >= segEnd) {
      acc += segLen;
      continue;
    }
    if (!started) {
      const t = segLen > 1e-9 ? (Math.max(uStart, segStart) - segStart) / segLen : 0;
      result.push(cl[i].add(cl[i + 1].sub(cl[i]).mul(t)));
      started = true;
    }
    if (uEnd <= segEnd) {
      const t = segLen > 1e-9 ? (uEnd - segStart) / segLen : 0;
      result.push(cl[i].add(cl[i + 1].sub(cl[i]).mul(t)));
      return result;
    } else {
      result.push(cl[i + 1]);
    }
    acc += segLen;
  }
  return result;
}
function effectiveStartArc(centerline, startTrim) {
  if (!startTrim || centerline.length < 2) return 0;
  const dir = safeNormalize(centerline[1].sub(centerline[0]));
  const hit = intersectLines(centerline[0], dir, startTrim.leftTrimPoint, startTrim.leftTrimDir);
  if (!hit) return 0;
  const d = hit.sub(centerline[0]).dot(dir);
  return Math.max(0, d);
}
function effectiveEndArc(centerline, endTrim) {
  const total = polylineLength(centerline);
  if (!endTrim || centerline.length < 2) return total;
  const n = centerline.length;
  const dir = safeNormalize(centerline[n - 1].sub(centerline[n - 2]));
  const hit = intersectLines(centerline[n - 1], dir, endTrim.leftTrimPoint, endTrim.leftTrimDir);
  if (!hit) return total;
  const d = hit.sub(centerline[n - 1]).dot(dir);
  return Math.min(total, total + d);
}
function envelopeStartArc(centerline, startTrim) {
  if (!startTrim || centerline.length < 2) return 0;
  const dir = safeNormalize(centerline[1].sub(centerline[0]));
  const hit = intersectLines(centerline[0], dir, startTrim.leftTrimPoint, startTrim.leftTrimDir);
  if (!hit) return 0;
  return hit.sub(centerline[0]).dot(dir);
}
function envelopeEndArc(centerline, endTrim) {
  const total = polylineLength(centerline);
  if (!endTrim || centerline.length < 2) return total;
  const n = centerline.length;
  const dir = safeNormalize(centerline[n - 1].sub(centerline[n - 2]));
  const hit = intersectLines(centerline[n - 1], dir, endTrim.leftTrimPoint, endTrim.leftTrimDir);
  if (!hit) return total;
  return total + hit.sub(centerline[n - 1]).dot(dir);
}
function pointAtExtrapolating(cl, m) {
  if (cl.length < 2) return cl[0] ?? new Vec2(0, 0);
  const total = polylineLength(cl);
  if (m < 0) {
    const dir = safeNormalize(cl[1].sub(cl[0]));
    return cl[0].add(dir.mul(m));
  }
  if (m > total) {
    const n = cl.length;
    const dir = safeNormalize(cl[n - 1].sub(cl[n - 2]));
    return cl[n - 1].add(dir.mul(m - total));
  }
  return pointAt(cl, m);
}
function addEndAndCornerStuds(parts, wall, startTrim, endTrim, studProfile, material, studZ0, studH) {
  const cl = wall.centerline;
  const isClosed = wall.isClosedPolyline;
  const n = cl.length;
  const positions = [];
  if (!isClosed) {
    const envStart = envelopeStartArc(cl, startTrim);
    const envEnd = envelopeEndArc(cl, endTrim);
    const startPostArc = envStart + studProfile.w * 0.5;
    const endPostArc = envEnd - studProfile.w * 0.5;
    const startTangentArc = Math.max(0, Math.min(polylineLength(cl), startPostArc));
    const endTangentArc = Math.max(0, Math.min(polylineLength(cl), endPostArc));
    parts.push(makeStud(
      "End stud (start)",
      "stud",
      pointAtExtrapolating(cl, startPostArc),
      tangentAt(cl, startTangentArc),
      studZ0,
      studH,
      studProfile,
      material
    ));
    positions.push(startPostArc);
    parts.push(makeStud(
      "End stud (end)",
      "stud",
      pointAtExtrapolating(cl, endPostArc),
      tangentAt(cl, endTangentArc),
      studZ0,
      studH,
      studProfile,
      material
    ));
    positions.push(endPostArc);
  }
  const uniqueCount = isClosed ? n - 1 : n;
  let acc = 0;
  for (let i = 0; i < uniqueCount; i++) {
    if (i > 0) acc += cl[i - 1].distTo(cl[i]);
    if (!isClosed && (i === 0 || i === uniqueCount - 1)) continue;
    parts.push(makeStud(
      `Corner post ${i + 1}`,
      "stud",
      pointAt(cl, acc),
      tangentAt(cl, acc),
      studZ0,
      studH,
      studProfile,
      material
    ));
    positions.push(acc);
  }
  return positions;
}
function addChannelStuds(parts, cl, junction, studProfile, material, studZ0, studH) {
  const offset = junction.otherThickness * 0.5 + studProfile.w * 0.5;
  const positions = [junction.arcLength - offset, junction.arcLength + offset];
  let i = 0;
  for (const m of positions) {
    if (m < studProfile.w * 0.5 || m > polylineLength(cl) - studProfile.w * 0.5) continue;
    parts.push(makeStud(
      `Channel ${++i} (T-junc @ ${junction.arcLength.toFixed(2)} m)`,
      "stud",
      pointAt(cl, m),
      tangentAt(cl, m),
      studZ0,
      studH,
      studProfile,
      material
    ));
  }
  return positions;
}
function placeCripples(parts, cl, uL, uR, studProfile, material, studSpacing, z0, h, role, namePrefix, margin = studProfile.h * 1.5) {
  const cuL = uL + margin;
  const cuR = uR - margin;
  if (cuR <= cuL) return;
  const startK = Math.ceil((cuL - studSpacing * 0.5) / studSpacing);
  const endK = Math.floor((cuR - studSpacing * 0.5) / studSpacing);
  let i = 0;
  for (let k = startK; k <= endK; k++) {
    const m = studSpacing * 0.5 + k * studSpacing;
    parts.push(makeStud(
      `${namePrefix} ${++i}`,
      role,
      pointAt(cl, m),
      tangentAt(cl, m),
      z0,
      h,
      studProfile,
      material
    ));
  }
}
function addHeaderSillCripples(parts, wall, opening, uL, uR, idx, studProfile, plateProfile, material, topPlateCount, studSpacing, headerDepthFor, cfg) {
  const cl = wall.centerline;
  const baseZ = wall.baseElevation;
  const stud = studProfile;
  const plate = plateProfile;
  const plateVerticalH = plate.w;
  const plateAcrossWall = plate.h;
  const topAll = plateVerticalH * topPlateCount;
  const wallH = wall.height;
  const isDoor = opening.sillHeight <= 1e-3;
  const headerDepth = headerDepthFor(opening.width);
  const headerZ = baseZ + opening.headHeight;
  const headerCl = subCenterline(cl, uL - cfg.headerMargin, uR + cfg.headerMargin);
  if (headerCl.length >= 2 && polylineLength(headerCl) > 1e-3) {
    parts.push(makeBeam(
      `${cfg.headerLabel} (op ${idx})`,
      "header",
      headerCl,
      headerZ,
      headerDepth,
      stud.h,
      material,
      { w: stud.h, h: headerDepth, name: `${cfg.headerName} ${(headerDepth * 1e3).toFixed(0)}` }
    ));
  }
  const upperZ0 = headerZ + headerDepth;
  const upperZ1 = baseZ + wallH - topAll;
  const upperH = upperZ1 - upperZ0;
  if (upperH > 0.05) {
    placeCripples(
      parts,
      cl,
      uL,
      uR,
      stud,
      material,
      studSpacing,
      upperZ0,
      upperH,
      "cripple",
      `${cfg.crippleUpLabel} (op ${idx})`,
      cfg.crippleMargin
    );
  }
  if (!isDoor) {
    const sillZ = baseZ + opening.sillHeight;
    const sillCl = subCenterline(cl, uL - cfg.sillMargin, uR + cfg.sillMargin);
    if (sillCl.length >= 2 && polylineLength(sillCl) > 1e-3) {
      parts.push(makeBeam(
        `${cfg.sillLabel} (op ${idx})`,
        "blocking",
        sillCl,
        sillZ - plateVerticalH,
        plateVerticalH,
        plateAcrossWall,
        material,
        { w: plate.w, h: plate.h, name: cfg.sillName }
      ));
    }
    const lowerZ0 = baseZ + plateVerticalH;
    const lowerZ1 = sillZ - plateVerticalH;
    const lowerH = lowerZ1 - lowerZ0;
    if (lowerH > 0.05) {
      placeCripples(
        parts,
        cl,
        uL,
        uR,
        stud,
        material,
        studSpacing,
        lowerZ0,
        lowerH,
        "cripple",
        `${cfg.crippleDownLabel} (op ${idx})`,
        cfg.crippleMargin
      );
    }
  }
}

// src/bim/walls/balloon-frame.ts
var DEFAULTS2 = {
  studProfile: { w: 0.038, h: 0.089, name: "SPF 2\xD74 (38\xD789)" },
  plateProfile: { w: 0.038, h: 0.089, name: "SPF 2\xD74 (38\xD789)" },
  studSpacing: 0.4,
  topPlateCount: 2,
  headerDepth: (w) => w >= 1.8 ? 0.235 : w >= 1.2 ? 0.184 : 0.14,
  material: "SPF"
};
function BalloonFrame(options = {}) {
  const opts = { ...DEFAULTS2, ...options };
  return (wall, ctx) => {
    const parts = [];
    const cl = wall.centerline;
    const baseZ = wall.baseElevation;
    const wallH = wall.height;
    const plate = opts.plateProfile;
    const stud = opts.studProfile;
    const sp = opts.studSpacing;
    const topN = opts.topPlateCount;
    const plateVerticalH = plate.w;
    const plateAcrossWall = plate.h;
    const topAll = plateVerticalH * topN;
    const startArc = ctx?.startTrim ? effectiveStartArc(cl, ctx.startTrim) : 0;
    const endArc = effectiveEndArc(cl, ctx?.endTrim ?? null);
    parts.push(makePlate(
      "Sill plate",
      "sillPlate",
      cl,
      baseZ,
      plateVerticalH,
      plateAcrossWall,
      opts.material,
      plate,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null
    ));
    for (let i = 0; i < topN; i++) {
      const z = baseZ + wallH - topAll + i * plateVerticalH;
      parts.push(makePlate(
        topN > 1 ? `Top plate ${i + 1}` : "Top plate",
        "topPlate",
        cl,
        z,
        plateVerticalH,
        plateAcrossWall,
        opts.material,
        plate,
        ctx?.startTrim ?? null,
        ctx?.endTrim ?? null
      ));
    }
    const studZ0 = baseZ + plateVerticalH;
    const studH = wallH - plateVerticalH - topAll;
    const openingExtents = [];
    let openingIdx = 0;
    for (const o of wall.openings) {
      openingIdx++;
      const uL = o.centerlinePosition - o.width / 2;
      const uR = o.centerlinePosition + o.width / 2;
      openingExtents.push({ uL, uR });
      addOpeningFramingNA(parts, wall, o, uL, uR, openingIdx, opts, studZ0, studH);
    }
    const channelZones = [];
    if (ctx?.tJunctions) {
      for (const j of ctx.tJunctions) {
        const placed = addChannelStuds(parts, cl, j, stud, opts.material, studZ0, studH);
        channelZones.push(...placed);
      }
    }
    const mandatoryZones = addEndAndCornerStuds(
      parts,
      wall,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null,
      stud,
      opts.material,
      studZ0,
      studH
    );
    let studIdx = 0;
    for (let m = startArc + sp; m < endArc; m += sp) {
      const inOpening = openingExtents.some(
        (r) => m >= r.uL - stud.h * 0.5 && m <= r.uR + stud.h * 0.5
      );
      if (inOpening) continue;
      const inChannel = channelZones.some((p) => Math.abs(p - m) < stud.h);
      if (inChannel) continue;
      const nearMandatory = mandatoryZones.some((p) => Math.abs(p - m) < stud.h);
      if (nearMandatory) continue;
      parts.push(makeStud(
        `Stud ${++studIdx}`,
        "stud",
        pointAt(cl, m),
        tangentAt(cl, m),
        studZ0,
        studH,
        stud,
        opts.material
      ));
    }
    return parts;
  };
}
function addOpeningFramingNA(parts, wall, opening, uL, uR, idx, opts, studZ0, studH) {
  const cl = wall.centerline;
  const baseZ = wall.baseElevation;
  const stud = opts.studProfile;
  const plate = opts.plateProfile;
  const plateVerticalH = plate.w;
  parts.push(makeStud(
    `King L (op ${idx})`,
    "stud",
    pointAt(cl, uL - stud.h * 0.5),
    tangentAt(cl, uL),
    studZ0,
    studH,
    stud,
    opts.material
  ));
  parts.push(makeStud(
    `King R (op ${idx})`,
    "stud",
    pointAt(cl, uR + stud.h * 0.5),
    tangentAt(cl, uR),
    studZ0,
    studH,
    stud,
    opts.material
  ));
  const jackHeight = opening.headHeight - plateVerticalH;
  const jackZ0 = baseZ + plateVerticalH;
  parts.push(makeStud(
    `Jack L (op ${idx})`,
    "jackStud",
    pointAt(cl, uL + stud.h * 0.5),
    tangentAt(cl, uL),
    jackZ0,
    jackHeight,
    stud,
    opts.material
  ));
  parts.push(makeStud(
    `Jack R (op ${idx})`,
    "jackStud",
    pointAt(cl, uR - stud.h * 0.5),
    tangentAt(cl, uR),
    jackZ0,
    jackHeight,
    stud,
    opts.material
  ));
  addHeaderSillCripples(
    parts,
    wall,
    opening,
    uL,
    uR,
    idx,
    stud,
    plate,
    opts.material,
    opts.topPlateCount,
    opts.studSpacing,
    opts.headerDepth,
    {
      headerMargin: stud.h * 0.5,
      headerLabel: "Header",
      headerName: "Header",
      sillMargin: stud.h * 0.5,
      sillLabel: "Rough sill",
      sillName: "Sill blocking",
      crippleUpLabel: "Cripple \u2191",
      crippleDownLabel: "Cripple \u2193"
    }
  );
}

// src/bim/walls/holzrahmenbau.ts
var DEFAULTS3 = {
  studProfile: { w: 0.06, h: 0.12, name: "KVH 60\xD7120" },
  plateProfile: { w: 0.06, h: 0.12, name: "KVH 60\xD7120" },
  studSpacing: 0.625,
  topPlateCount: 1,
  headerDepth: (w) => w >= 2 ? 0.24 : w >= 1.4 ? 0.2 : 0.16,
  material: "KVH C24",
  doubledKings: true
};
var HolzrahmenBauJointStyle = "butt";
function HolzrahmenBau(options = {}) {
  const opts = { ...DEFAULTS3, ...options };
  return (wall, ctx) => {
    const parts = [];
    const cl = wall.centerline;
    const baseZ = wall.baseElevation;
    const wallH = wall.height;
    const plate = opts.plateProfile;
    const stud = opts.studProfile;
    const sp = opts.studSpacing;
    const topN = opts.topPlateCount;
    const plateVerticalH = plate.w;
    const plateAcrossWall = plate.h;
    const topAll = plateVerticalH * topN;
    const startArc = ctx?.startTrim ? effectiveStartArc(cl, ctx.startTrim) : 0;
    const endArc = effectiveEndArc(cl, ctx?.endTrim ?? null);
    parts.push(makePlate(
      "Schwelle",
      "sillPlate",
      cl,
      baseZ,
      plateVerticalH,
      plateAcrossWall,
      opts.material,
      plate,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null
    ));
    for (let i = 0; i < topN; i++) {
      const z = baseZ + wallH - topAll + i * plateVerticalH;
      parts.push(makePlate(
        topN > 1 ? `R\xE4hm ${i + 1}` : "R\xE4hm",
        "topPlate",
        cl,
        z,
        plateVerticalH,
        plateAcrossWall,
        opts.material,
        plate,
        ctx?.startTrim ?? null,
        ctx?.endTrim ?? null
      ));
    }
    const studZ0 = baseZ + plateVerticalH;
    const studH = wallH - plateVerticalH - topAll;
    const openingExtents = [];
    let openingIdx = 0;
    for (const o of wall.openings) {
      openingIdx++;
      const uL = o.centerlinePosition - o.width / 2;
      const uR = o.centerlinePosition + o.width / 2;
      openingExtents.push({ uL, uR });
      addOpeningFramingDE(parts, wall, o, uL, uR, openingIdx, opts, studZ0, studH);
    }
    const channelZones = [];
    if (ctx?.tJunctions) {
      for (const j of ctx.tJunctions) {
        const placed = addChannelStuds(parts, cl, j, stud, opts.material, studZ0, studH);
        channelZones.push(...placed);
      }
    }
    const mandatoryZones = addEndAndCornerStuds(
      parts,
      wall,
      ctx?.startTrim ?? null,
      ctx?.endTrim ?? null,
      stud,
      opts.material,
      studZ0,
      studH
    );
    const edgeSkip = opts.doubledKings ? stud.w * 1.5 : stud.h * 0.5;
    let studIdx = 0;
    for (let m = startArc + sp; m < endArc; m += sp) {
      const inOpening = openingExtents.some(
        (r) => m >= r.uL - edgeSkip && m <= r.uR + edgeSkip
      );
      if (inOpening) continue;
      const inChannel = channelZones.some((p) => Math.abs(p - m) < stud.h);
      if (inChannel) continue;
      const nearMandatory = mandatoryZones.some((p) => Math.abs(p - m) < stud.h);
      if (nearMandatory) continue;
      parts.push(makeStud(
        `St\xE4nder ${++studIdx}`,
        "stud",
        pointAt(cl, m),
        tangentAt(cl, m),
        studZ0,
        studH,
        stud,
        opts.material
      ));
    }
    return parts;
  };
}
function addOpeningFramingDE(parts, wall, opening, uL, uR, idx, opts, studZ0, studH) {
  const cl = wall.centerline;
  const stud = opts.studProfile;
  const plate = opts.plateProfile;
  const placeEdgeKings = (mEdge, side) => {
    const sign = side === "L" ? -1 : 1;
    const m1 = mEdge + sign * stud.w * 0.5;
    parts.push(makeStud(
      `St\xE4nder Kant ${side} (op ${idx})`,
      "stud",
      pointAt(cl, m1),
      tangentAt(cl, m1),
      studZ0,
      studH,
      stud,
      opts.material
    ));
    if (opts.doubledKings) {
      const m2 = mEdge + sign * stud.w * 1.5;
      parts.push(makeStud(
        `Doppelst\xE4nder ${side} (op ${idx})`,
        "stud",
        pointAt(cl, m2),
        tangentAt(cl, m2),
        studZ0,
        studH,
        stud,
        opts.material
      ));
    }
  };
  placeEdgeKings(uL, "L");
  placeEdgeKings(uR, "R");
  addHeaderSillCripples(
    parts,
    wall,
    opening,
    uL,
    uR,
    idx,
    stud,
    plate,
    opts.material,
    opts.topPlateCount,
    opts.studSpacing,
    opts.headerDepth,
    {
      headerMargin: stud.w * 0.5,
      headerLabel: "Sturz",
      headerName: "Sturz",
      sillMargin: stud.w * 0.5,
      sillLabel: "Br\xFCstungsriegel",
      sillName: "Br\xFCstungsriegel",
      crippleUpLabel: "Kopfriegel",
      crippleDownLabel: "Fu\xDFriegel",
      crippleMargin: stud.w * 2.5
    }
  );
}
function holzrahmenbauLayers(opts = {}) {
  const layers = [];
  const intBoard = opts.interiorBoard ?? { material: "Gipsfaser", thickness: 0.0125 };
  const instCav = opts.installationCavity ?? { thickness: 0.03 };
  const vapour = opts.vapourBarrier ?? { material: "Dampfbremse" };
  const insul = opts.insulation ?? { material: "Mineralwolle", thickness: 0.12 };
  const extBoard = opts.exteriorBoard ?? { material: "DWD-Platte", thickness: 0.016 };
  const weather = opts.weatherMembrane ?? { material: "Wind-/Wetterbahn" };
  const battens = opts.ventilationBattens ?? { thickness: 0.03 };
  const cladding = opts.cladding ?? { material: "Holzfassade", thickness: 0.02 };
  layers.push({ material: intBoard.material, thickness: intBoard.thickness, position: "interior" });
  layers.push({
    material: "Installationsebene",
    thickness: instCav.thickness,
    position: "interior",
    properties: { airGap: true }
  });
  layers.push({
    material: vapour.material,
    thickness: 2e-4,
    position: "core",
    properties: { sd: 100 }
  });
  layers.push({
    material: insul.material,
    thickness: insul.thickness,
    position: "core",
    properties: { lambda: 0.035 }
  });
  layers.push({
    material: extBoard.material,
    thickness: extBoard.thickness,
    position: "exterior",
    properties: { sd: 0.2 }
  });
  layers.push({ material: weather.material, thickness: 5e-4, position: "exterior" });
  layers.push({
    material: "Lattung",
    thickness: battens.thickness,
    position: "exterior",
    properties: { ventilated: true }
  });
  layers.push({ material: cladding.material, thickness: cladding.thickness, position: "exterior" });
  return layers;
}

// src/bim/walls/clt.ts
var DEFAULT_LAMELLAE = [0.04, 0.02, 0.04, 0.02, 0.04];
function cltLayers(opts = {}) {
  const lamellae = opts.lamellae ?? DEFAULT_LAMELLAE;
  const grade = opts.grade ?? "C24";
  return lamellae.map((thk, i) => ({
    material: `CLT ${grade} (${(thk * 1e3).toFixed(0)} mm)`,
    thickness: thk,
    position: i === 0 ? "interior" : i === lamellae.length - 1 ? "exterior" : "core",
    properties: { grainDirection: i % 2 === 0 ? "longitudinal" : "transverse" }
  }));
}
var CltConstruction = (wall) => [{
  name: "CLT panel",
  role: "monolithic",
  mesh: wall.toMesh(),
  material: "CLT",
  ifcType: "IfcWall"
}];

// src/bim/slabs/types.ts
var SlabOpening = class {
  constructor(centerX, centerY, width, depth, name) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.width = width;
    this.depth = depth;
    this.name = name;
  }
};
var SlabType = class {
  constructor(opts) {
    this.name = opts.name;
    this.description = opts.description;
    this.construction = opts.construction;
    this.layers = opts.layers;
    this.properties = opts.properties ?? {};
    this.defaultJoistSpacing = opts.defaultJoistSpacing;
    this.defaultJoistProfile = opts.defaultJoistProfile;
    this.defaultMaterial = opts.defaultMaterial;
  }
  get layeredThickness() {
    return (this.layers ?? []).reduce((s, l) => s + l.thickness, 0);
  }
};
var Slab = class {
  constructor(opts) {
    this.openings = [];
    this.boundary = opts.boundary;
    this.thickness = opts.thickness ?? 0.2;
    this.elevation = opts.elevation ?? 0;
    this.name = opts.name;
    this.type = opts.type;
    this.properties = opts.properties;
    if (opts.openings) this.openings.push(...opts.openings);
    this.joistDirection = opts.joistDirection;
  }
  /** Total perimeter length (m). */
  get perimeter() {
    let total = 0;
    const b = this.boundary;
    for (let i = 0; i < b.length - 1; i++) total += b[i].distTo(b[i + 1]);
    return total;
  }
  /** Slab footprint area (m²). Uses signed-area magnitude. */
  get area() {
    return Math.abs(Polygon2D.signedArea(this.boundary));
  }
  /**
   * Build the slab envelope mesh: top face + bottom face + side quads.
   * Uses `Polygon2D.triangulate2D` (ear-clipping) for the caps.
   */
  toMesh() {
    const ring = Polygon2D.openRing(this.boundary);
    const n = ring.length;
    if (n < 3) {
      return new Mesh(new Float32Array(), new Uint32Array(), new Float32Array());
    }
    const zTop = this.elevation;
    const zBot = this.elevation - this.thickness;
    const positions = [];
    const normals = [];
    const indices = [];
    const tris = Polygon2D.triangulate2D(ring);
    const topBase = positions.length / 3;
    for (const p of ring) {
      positions.push(p.x, p.y, zTop);
      normals.push(0, 0, 1);
    }
    for (const [a, b2, c] of tris) {
      indices.push(topBase + a, topBase + b2, topBase + c);
    }
    const botBase = positions.length / 3;
    for (const p of ring) {
      positions.push(p.x, p.y, zBot);
      normals.push(0, 0, -1);
    }
    for (const [a, b2, c] of tris) {
      indices.push(botBase + c, botBase + b2, botBase + a);
    }
    for (let i = 0; i < n; i++) {
      const p0 = ring[i];
      const p1 = ring[(i + 1) % n];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-9) continue;
      const nx = dy / len, ny = -dx / len;
      const base = positions.length / 3;
      positions.push(p0.x, p0.y, zBot, p1.x, p1.y, zBot, p1.x, p1.y, zTop, p0.x, p0.y, zTop);
      for (let k = 0; k < 4; k++) normals.push(nx, ny, 0);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    return new Mesh(new Float32Array(positions), new Uint32Array(indices), new Float32Array(normals));
  }
};
function realizeSlab(slab, ctx) {
  const type = slab.type;
  const envelopeMesh = slab.toMesh();
  const parts = type?.construction ? type.construction(slab, ctx) : [];
  const layers = type?.layers ?? [];
  const properties = { ...type?.properties ?? {}, ...slab.properties ?? {} };
  return { slab, parts, layers, envelopeMesh, properties, joistDirection: ctx?.joistDirection };
}

// src/bim/slabs/orientation.ts
function chooseJoistDirection(slab, opts = {}) {
  const method = opts.method ?? "auto";
  if ((method === "auto" || method === "supports") && opts.supports && opts.supports.length >= 2) {
    const fromSupports = joistDirectionFromSupports(slab, opts.supports, opts.angleTolerance);
    if (fromSupports) return fromSupports;
  }
  return joistDirectionFromBounds(slab.boundary);
}
function joistDirectionFromBounds(boundary) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of boundary) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = maxX - minX;
  const dy = maxY - minY;
  return dx > dy ? new Vec2(0, 1) : new Vec2(1, 0);
}
function joistDirectionFromPCA(boundary) {
  if (boundary.length < 3) return new Vec2(1, 0);
  let cx = 0, cy = 0;
  for (const p of boundary) {
    cx += p.x;
    cy += p.y;
  }
  cx /= boundary.length;
  cy /= boundary.length;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of boundary) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  sxx /= boundary.length;
  sxy /= boundary.length;
  syy /= boundary.length;
  const trace = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, trace * trace * 0.25 - det));
  const lamMajor = trace * 0.5 + disc;
  let mx, my;
  if (Math.abs(sxy) > 1e-12) {
    mx = lamMajor - syy;
    my = sxy;
  } else {
    mx = sxx >= syy ? 1 : 0;
    my = sxx >= syy ? 0 : 1;
  }
  const len = Math.hypot(mx, my);
  if (len < 1e-12) return new Vec2(1, 0);
  return new Vec2(-my / len, mx / len);
}
function joistDirectionFromSupports(_slab, supports, angleTol = 5 * Math.PI / 180) {
  if (supports.length < 2) return null;
  const groups = [];
  for (const w of supports) {
    const cl = w.centerline;
    if (cl.length < 2) continue;
    const dx = cl[cl.length - 1].x - cl[0].x;
    const dy = cl[cl.length - 1].y - cl[0].y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const tx = dx / len, ty = dy / len;
    let angle = Math.atan2(ty, tx);
    if (angle < 0) angle += Math.PI;
    if (angle >= Math.PI) angle -= Math.PI;
    let merged = false;
    for (const g of groups) {
      const dAng = Math.abs(angle - g.angle);
      const wrap = Math.min(dAng, Math.PI - dAng);
      if (wrap < angleTol) {
        g.walls.push(w);
        merged = true;
        break;
      }
    }
    if (!merged) groups.push({ angle, tangent: new Vec2(tx, ty), walls: [w] });
  }
  let best = null;
  for (const g of groups) {
    if (g.walls.length < 2) continue;
    const perp = new Vec2(-g.tangent.y, g.tangent.x);
    let minP = Infinity, maxP = -Infinity;
    for (const w of g.walls) {
      const cl = w.centerline;
      const midX = (cl[0].x + cl[cl.length - 1].x) * 0.5;
      const midY = (cl[0].y + cl[cl.length - 1].y) * 0.5;
      const proj = midX * perp.x + midY * perp.y;
      if (proj < minP) minP = proj;
      if (proj > maxP) maxP = proj;
    }
    const span = maxP - minP;
    if (!best || span < best.span) best = { tangent: g.tangent, span };
  }
  if (!best) return null;
  return new Vec2(-best.tangent.y, best.tangent.x);
}
function lineClipPolygon(origin, direction, boundary) {
  const hits = [];
  const dx = direction.x, dy = direction.y;
  for (let i = 0; i < boundary.length - 1; i++) {
    const a = boundary[i];
    const b = boundary[i + 1];
    const ex = b.x - a.x, ey = b.y - a.y;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) continue;
    const s = ((a.x - origin.x) * ey - (a.y - origin.y) * ex) / denom;
    const u = ((a.x - origin.x) * dy - (a.y - origin.y) * dx) / denom;
    if (u < -1e-9 || u > 1 + 1e-9) continue;
    hits.push(s);
  }
  hits.sort((a, b) => a - b);
  const dedup = [];
  for (const h of hits) {
    if (dedup.length === 0 || Math.abs(dedup[dedup.length - 1] - h) > 1e-6) {
      dedup.push(h);
    }
  }
  return dedup;
}

// src/bim/slabs/solid.ts
var SolidSlabConstruction = (slab) => [{
  name: "shell",
  role: "monolithic",
  mesh: slab.toMesh(),
  ifcType: "IfcSlab"
}];

// src/bim/slabs/joisted.ts
var DEFAULTS4 = {
  profile: { w: 0.06, h: 0.22, name: "KVH 60\xD7220" },
  spacing: 0.625,
  material: "KVH C24",
  rim: true,
  rimProfile: { w: 0.06, h: 0.22, name: "KVH 60\xD7220 (rim)" },
  edgeOffset: -1,
  // sentinel — resolved per-call to `spacing/2`
  bearingGap: 0.01,
  sheathingThickness: 0.022,
  sheathingMaterial: "OSB",
  ceilingThickness: 0.0125,
  ceilingMaterial: "Gipsfaser"
};
function JoistedSlab(options = {}) {
  const opts = { ...DEFAULTS4, ...options };
  return (slab, ctx) => {
    const direction = slab.joistDirection ?? ctx?.joistDirection ?? joistDirectionFromBounds(slab.boundary);
    const perp = new Vec2(-direction.y, direction.x);
    const parts = [];
    const joistTopZ = slab.elevation - opts.sheathingThickness;
    const joistBottomZ = joistTopZ - opts.profile.h;
    const closingRing = ensureClosedRing(slab.boundary);
    const rimW = opts.rim ? opts.rimProfile.w : 0;
    const bearingGap = Math.max(0, opts.bearingGap);
    const edgeOffset = opts.edgeOffset >= 0 ? opts.edgeOffset : opts.spacing * 0.5;
    let regularJoistClipBoundary = closingRing;
    if (opts.rim) {
      const rimCenterline = ensureClosedRing(Polygon2D.offset(stripClose(closingRing), -rimW * 0.5));
      const rimRibbon = new ExtrudedRibbon({
        centerline: rimCenterline,
        width: rimW,
        height: opts.rimProfile.h,
        baseZ: joistBottomZ
      });
      parts.push({
        name: "Rim joist",
        role: "beam",
        mesh: rimRibbon.toMesh(),
        material: opts.material,
        profile: opts.rimProfile,
        length: ringPerimeter(rimCenterline),
        ifcType: "IfcMember"
      });
      regularJoistClipBoundary = ensureClosedRing(
        Polygon2D.offset(stripClose(closingRing), -(rimW + bearingGap))
      );
    } else if (bearingGap > 1e-9) {
      regularJoistClipBoundary = ensureClosedRing(
        Polygon2D.offset(stripClose(closingRing), -bearingGap)
      );
    }
    let minP = Infinity, maxP = -Infinity;
    for (const p of regularJoistClipBoundary) {
      const proj = p.x * perp.x + p.y * perp.y;
      if (proj < minP) minP = proj;
      if (proj > maxP) maxP = proj;
    }
    const startP = minP + edgeOffset;
    const endP = maxP - edgeOffset;
    let joistIdx = 0;
    for (let p = startP; p <= endP + 1e-6; p += opts.spacing) {
      const origin = new Vec2(perp.x * p, perp.y * p);
      const hits = lineClipPolygon(origin, direction, regularJoistClipBoundary);
      if (hits.length < 2) continue;
      const tMin = hits[0];
      const tMax = hits[hits.length - 1];
      const startPt = new Vec2(origin.x + direction.x * tMin, origin.y + direction.y * tMin);
      const endPt = new Vec2(origin.x + direction.x * tMax, origin.y + direction.y * tMax);
      const length = startPt.distTo(endPt);
      if (length < 0.01) continue;
      const ribbon = new ExtrudedRibbon({
        centerline: [startPt, endPt],
        width: opts.profile.w,
        height: opts.profile.h,
        baseZ: joistBottomZ
      });
      parts.push({
        name: `Joist ${++joistIdx}`,
        role: "joist",
        mesh: ribbon.toMesh(),
        material: opts.material,
        profile: opts.profile,
        length,
        ifcType: "IfcMember"
      });
    }
    if (opts.sheathingThickness > 1e-6) {
      const sheathingSlab = makeFlatPlate(
        slab.boundary,
        slab.elevation - opts.sheathingThickness,
        opts.sheathingThickness
      );
      parts.push({
        name: "Sheathing",
        role: "sheathing",
        mesh: sheathingSlab,
        material: opts.sheathingMaterial,
        ifcType: "IfcPlate"
      });
    }
    if (opts.ceilingThickness > 1e-6) {
      const ceilingZ = joistBottomZ - opts.ceilingThickness;
      const ceilingMesh = makeFlatPlate(slab.boundary, ceilingZ, opts.ceilingThickness);
      parts.push({
        name: "Ceiling",
        role: "ceiling",
        mesh: ceilingMesh,
        material: opts.ceilingMaterial,
        ifcType: "IfcCovering"
      });
    }
    return parts;
  };
}
function stripClose(polygon) {
  return Polygon2D.openRing(polygon);
}
function ensureClosedRing(polygon) {
  return Polygon2D.closeRing(polygon);
}
function ringPerimeter(closedRing) {
  return Polygon2D.polylineLength(closedRing);
}
function makeFlatPlate(boundary, baseZ, thickness) {
  const ring = Polygon2D.openRing(boundary);
  const n = ring.length;
  if (n < 3) return new Mesh(new Float32Array(), new Uint32Array(), new Float32Array());
  const positions = [];
  const normals = [];
  const indices = [];
  const tris = Polygon2D.triangulate2D(ring);
  const topBase = positions.length / 3;
  for (const p of ring) {
    positions.push(p.x, p.y, baseZ + thickness);
    normals.push(0, 0, 1);
  }
  for (const [a, b, c] of tris) indices.push(topBase + a, topBase + b, topBase + c);
  const botBase = positions.length / 3;
  for (const p of ring) {
    positions.push(p.x, p.y, baseZ);
    normals.push(0, 0, -1);
  }
  for (const [a, b, c] of tris) indices.push(botBase + c, botBase + b, botBase + a);
  for (let i = 0; i < n; i++) {
    const p0 = ring[i];
    const p1 = ring[(i + 1) % n];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const nx = dy / len, ny = -dx / len;
    const base = positions.length / 3;
    positions.push(p0.x, p0.y, baseZ, p1.x, p1.y, baseZ, p1.x, p1.y, baseZ + thickness, p0.x, p0.y, baseZ + thickness);
    for (let k = 0; k < 4; k++) normals.push(nx, ny, 0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return new Mesh(new Float32Array(positions), new Uint32Array(indices), new Float32Array(normals));
}

// src/bim/openings.ts
var OpeningType = class _OpeningType {
  constructor(opts) {
    this.name = opts.name;
    this.kind = opts.kind ?? "door";
    this.operation = opts.operation ?? "not_defined";
    this.partitioning = opts.partitioning ?? "not_defined";
    this.material = opts.material;
    this.description = opts.description;
    this.properties = opts.properties ?? {};
  }
  /** Convenience: a swinging interior/exterior door type. */
  static door(name, opts = {}) {
    return new _OpeningType({ ...opts, name, kind: "door" });
  }
  /** Convenience: a window type. */
  static window(name, opts = {}) {
    return new _OpeningType({ ...opts, name, kind: "window" });
  }
};

// src/bim/spaces.ts
var Space = class {
  constructor(opts) {
    if (opts.boundary.length < 3) {
      throw new Error("Space: boundary needs \u2265 3 points");
    }
    this.name = opts.name;
    this.boundary = opts.boundary;
    this.elevation = opts.elevation ?? 0;
    this.height = opts.height ?? 2.7;
    this.function = opts.function;
    this.properties = opts.properties ?? {};
  }
  /** Floor area of the boundary polygon (shoelace formula), in m². */
  area() {
    const b = this.boundary;
    let a = 0;
    for (let i = 0, n = b.length; i < n; i++) {
      const p = b[i];
      const q = b[(i + 1) % n];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) * 0.5;
  }
  /** Approximate room volume (floor area × clear height), in m³. */
  volume() {
    return this.area() * this.height;
  }
};
function boundingWalls(space, walls, tol = 0.35) {
  const ring = space.boundary;
  const n = ring.length;
  const out = [];
  for (const wall of walls) {
    const cl = wall.centerline;
    let bounds = false;
    for (let e = 0; e < n && !bounds; e++) {
      const a = ring[e];
      const b = ring[(e + 1) % n];
      for (let s = 0; s < cl.length - 1 && !bounds; s++) {
        if (segmentAlongEdge(cl[s], cl[s + 1], a, b, tol)) bounds = true;
      }
    }
    if (bounds) out.push(wall);
  }
  return out;
}
function segmentAlongEdge(c, d, a, b, tol) {
  const ex = b.x - a.x, ey = b.y - a.y;
  const elen = Math.hypot(ex, ey);
  if (elen < 1e-9) return false;
  const ux = ex / elen, uy = ey / elen;
  const perp = (px, py) => Math.abs((px - a.x) * -uy + (py - a.y) * ux);
  if (perp(c.x, c.y) > tol || perp(d.x, d.y) > tol) return false;
  const wx = d.x - c.x, wy = d.y - c.y;
  const wlen = Math.hypot(wx, wy);
  if (wlen < 1e-9) return false;
  if (Math.abs((wx * ux + wy * uy) / wlen) < 0.99) return false;
  const tc = (c.x - a.x) * ux + (c.y - a.y) * uy;
  const td = (d.x - a.x) * ux + (d.y - a.y) * uy;
  const lo = Math.max(0, Math.min(tc, td));
  const hi = Math.min(elen, Math.max(tc, td));
  return hi - lo > 0.1;
}

// src/bim/stairs.ts
var StairType = class {
  constructor(opts) {
    this.name = opts.name;
    this.shape = opts.shape ?? "straight_run";
    this.material = opts.material;
    this.description = opts.description;
    this.properties = opts.properties ?? {};
  }
};
var Stair = class {
  constructor(opts) {
    if (!(opts.totalRise > 0)) throw new Error("Stair: totalRise must be > 0");
    this.name = opts.name ?? "Stair";
    this.start = opts.start;
    this.direction = opts.direction ?? new Vec2(1, 0);
    this.width = opts.width ?? 1;
    this.totalRise = opts.totalRise;
    this.riserHeight = opts.riserHeight ?? 0.18;
    this.treadDepth = opts.treadDepth ?? 0.27;
    this.type = opts.type;
    this.properties = opts.properties ?? {};
  }
  /** Number of risers, chosen so the actual riser is closest to the target. */
  get risers() {
    return Math.max(1, Math.round(this.totalRise / this.riserHeight));
  }
  /** Actual riser height (`totalRise` split evenly). */
  get actualRiser() {
    return this.totalRise / this.risers;
  }
  /**
   * Compute the flight geometry. A straight run is a single flight built as
   * a stepped solid: step i is a box spanning going [i·tread, (i+1)·tread],
   * rising from the floor to (i+1)·riser, across the full width.
   */
  flights() {
    const risers = this.risers;
    const riser = this.actualRiser;
    const tread = this.treadDepth;
    const dLen = Math.hypot(this.direction.x, this.direction.y) || 1;
    const ux = this.direction.x / dLen;
    const uy = this.direction.y / dLen;
    const ax = -uy;
    const ay = ux;
    const halfW = this.width * 0.5;
    const sx = this.start.x, sy = this.start.y, sz = this.start.z;
    const positions = [];
    const indices = [];
    const push = (along, across, z) => {
      const x = sx + ux * along + ax * across;
      const y = sy + uy * along + ay * across;
      positions.push(x, y, z);
      return positions.length / 3 - 1;
    };
    for (let i = 0; i < risers; i++) {
      const a0 = i * tread;
      const a1 = (i + 1) * tread;
      const z0 = sz;
      const z1 = sz + (i + 1) * riser;
      const flb = push(a0, -halfW, z0), frb = push(a1, -halfW, z0);
      const blb = push(a0, +halfW, z0), brb = push(a1, +halfW, z0);
      const flt = push(a0, -halfW, z1), frt = push(a1, -halfW, z1);
      const blt = push(a0, +halfW, z1), brt = push(a1, +halfW, z1);
      pushBox(indices, flb, frb, brb, blb, flt, frt, brt, blt);
    }
    return [{
      name: `${this.name} flight`,
      positions,
      indices,
      risers,
      treads: Math.max(0, risers - 1),
      riserHeight: riser,
      treadDepth: tread
    }];
  }
};
function pushBox(out, flb, frb, brb, blb, flt, frt, brt, blt) {
  const quad = (a, b, c, d) => {
    out.push(a, b, c, a, c, d);
  };
  quad(flb, blb, brb, frb);
  quad(flt, frt, brt, blt);
  quad(flb, frb, frt, flt);
  quad(brb, blb, blt, brt);
  quad(frb, brb, brt, frt);
  quad(blb, flb, flt, blt);
}

// src/gui/Params.ts
var ParamStore = class {
  constructor(schema) {
    this.values = {};
    this.listeners = /* @__PURE__ */ new Set();
    this.keyListeners = /* @__PURE__ */ new Map();
    this.schema = schema;
    for (const [key, def] of Object.entries(schema)) {
      if (def.type !== "button") {
        this.values[key] = def.default;
      }
    }
  }
  get(key) {
    return this.values[key];
  }
  set(key, value) {
    const def = this.schema[key];
    if (!def || def.type === "button") return;
    if (def.type === "float" || def.type === "int") {
      value = Math.max(def.min, Math.min(def.max, value));
      if (def.type === "int") value = Math.round(value);
    }
    if (def.type === "select" && !def.options.includes(value)) return;
    this.values[key] = value;
    for (const l of this.listeners) l(key, value, this.values);
    const kl = this.keyListeners.get(key);
    if (kl) for (const l of kl) l(value);
  }
  /** Get all current values */
  getAll() {
    return { ...this.values };
  }
  /** Get the schema for a specific key */
  getDef(key) {
    return this.schema[key];
  }
  /** Get entire schema */
  getSchema() {
    return this.schema;
  }
  /** Listen to all changes */
  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /** Listen to a specific key */
  onKey(key, listener) {
    if (!this.keyListeners.has(key)) this.keyListeners.set(key, /* @__PURE__ */ new Set());
    this.keyListeners.get(key).add(listener);
    return () => this.keyListeners.get(key)?.delete(listener);
  }
  /** Reset all to defaults */
  reset() {
    for (const [key, def] of Object.entries(this.schema)) {
      if (def.type !== "button") {
        this.set(key, def.default);
      }
    }
  }
  /** Serialization */
  toJSON() {
    return { ...this.values };
  }
  loadJSON(json) {
    for (const [key, value] of Object.entries(json)) {
      if (key in this.schema) {
        this.set(key, value);
      }
    }
  }
};
function createParams(schema) {
  return new ParamStore(schema);
}
function createLayout(folders) {
  return { folders };
}

// src/render/ThreeRenderer.ts
import * as THREE3 from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
var DEFAULTS5 = {
  antialias: true,
  backgroundColor: 658196,
  showGrid: true,
  gridSize: 20,
  gridDivisions: 20,
  showAxes: true,
  axesSize: 3,
  enableOrbitControls: true,
  enableDamping: true,
  cameraPosition: [6, 8, 10],
  cameraTarget: [0, 0, 0],
  fov: 55,
  up: "y"
};
var ThreeRenderer = class {
  constructor(gScene, container, config) {
    this._isOrtho = false;
    this.objectMap = /* @__PURE__ */ new Map();
    this.unsub = null;
    this.rafId = 0;
    this.currentLighting = "flat";
    // Studio-mode default PBR material, used when a mesh sets no explicit
    // metalness/roughness in its VisualStyle. Configurable via setStudioMaterial.
    this.studioMetalness = 0;
    this.studioRoughness = 0.65;
    // When set, forces this color on studio meshes (overriding their own); null = keep per-mesh color.
    this.studioColor = null;
    this.studioFlatShading = false;
    // When true, line/point "helper" objects are hidden (e.g. a clean render view
    // that shows only solid meshes). Solid geometry is unaffected.
    this.hideHelpers = false;
    this.gridHelper = null;
    this.axesHelper = null;
    // Invisible shadow-catcher plane added only in Studio mode so the
    // PCF-soft shadows have a surface to land on.
    this.shadowGround = null;
    // When true, the studio shadow-catcher plane (at the world origin) is hidden —
    // e.g. when the app provides its own ground to receive shadows.
    this.shadowGroundHidden = false;
    // Raw THREE objects (e.g. loaded glTF scenes) added by the app, kept across
    // sketch re-runs (clearThree only touches objectMap-managed objects).
    this.externalObjects = /* @__PURE__ */ new Map();
    // Prefiltered (PMREM) environment map for image-based reflections.
    // Built lazily once on first enable, then reused. Only visibly affects
    // studio PBR materials.
    this.envMap = null;
    // Optional equirectangular source (e.g. a loaded HDR) for the environment.
    // null → the built-in procedural gradient. The app owns/disposes this texture.
    this.envSourceTex = null;
    this.envEnabled = false;
    this.envBackground = false;
    this.resizeObserver = null;
    // ── Picking + Gizmo ──
    this.raycaster = new THREE3.Raycaster();
    this.pickEnabled = false;
    this.pickListeners = /* @__PURE__ */ new Set();
    this.transformControls = null;
    this.gizmoMode = "translate";
    this.gizmoAttachedId = null;
    this.pointerDown = null;
    this.selectionMaterials = /* @__PURE__ */ new Map();
    // ── Drag handles ──
    this.dragHandles = /* @__PURE__ */ new Map();
    this.dragHandleConstraints = /* @__PURE__ */ new Map();
    this.dragHandlePlanes = /* @__PURE__ */ new Map();
    this.dragHandleMoveCb = null;
    this.dragHandleEndCb = null;
    this.dragHandlePickCb = null;
    this.activeDragHandle = null;
    this.selectedDragHandle = null;
    this.dragPlane = new THREE3.Plane();
    this.dragSeenThisRun = /* @__PURE__ */ new Set();
    this.onPointerDown = (e) => {
      const handleName = this.dragHandleHitTest(e.clientX, e.clientY);
      if (handleName) {
        e.preventDefault();
        this.activeDragHandle = handleName;
        this.setHandleSelected(handleName);
        if (this.controls) this.controls.enabled = false;
        const handle = this.dragHandles.get(handleName);
        let normal;
        if (this.dragHandlePlanes.get(handleName) === "screen") {
          normal = new THREE3.Vector3();
          this.activeCamera.getWorldDirection(normal);
        } else {
          normal = this.isZUp ? new THREE3.Vector3(0, 0, 1) : new THREE3.Vector3(0, 1, 0);
        }
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, handle.position);
        const dom = this.renderer.domElement;
        dom.addEventListener("pointermove", this.onPointerMoveDragging);
        dom.addEventListener("pointerup", this.onPointerUpDragging, { once: true });
        dom.setPointerCapture(e.pointerId);
        return;
      }
      this.pointerDown = { x: e.clientX, y: e.clientY };
    };
    this.onPointerUp = (e) => {
      if (!this.pointerDown) return;
      const dx = e.clientX - this.pointerDown.x;
      const dy = e.clientY - this.pointerDown.y;
      this.pointerDown = null;
      if (dx * dx + dy * dy > 25) return;
      if (this.transformControls?.dragging) return;
      if (this.selectedDragHandle !== null) this.setHandleSelected(null);
      const id = this.pickAt(e.clientX, e.clientY);
      for (const l of this.pickListeners) l(id);
    };
    this.onPointerMoveDragging = (e) => {
      if (!this.activeDragHandle) return;
      const hit = this.raycastPlane(e.clientX, e.clientY, this.dragPlane);
      if (!hit) return;
      const handle = this.dragHandles.get(this.activeDragHandle);
      if (!handle) return;
      let x = hit.x, y = hit.y, z = hit.z;
      const constrain = this.dragHandleConstraints.get(this.activeDragHandle);
      if (constrain) {
        const c = constrain(x, y, z);
        x = c[0];
        y = c[1];
        z = c[2];
      }
      handle.position.set(x, y, z);
      if (this.dragHandleMoveCb) {
        this.dragHandleMoveCb(this.activeDragHandle, x, y, z);
      }
    };
    this.onPointerUpDragging = (_e) => {
      const name = this.activeDragHandle;
      this.activeDragHandle = null;
      if (this.controls) this.controls.enabled = true;
      const dom = this.renderer.domElement;
      dom.removeEventListener("pointermove", this.onPointerMoveDragging);
      if (name && this.dragHandlePickCb) this.dragHandlePickCb(name);
      if (name && this.dragHandleEndCb) this.dragHandleEndCb(name);
    };
    this.gScene = gScene;
    this.container = container;
    this.config = { ...DEFAULTS5, ...config };
    this.isZUp = this.config.up === "z";
    const cfg = this.config;
    this.threeScene = new THREE3.Scene();
    this.threeScene.background = new THREE3.Color(cfg.backgroundColor);
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE3.PerspectiveCamera(cfg.fov, aspect, 0.1, 1e3);
    if (this.isZUp) this.camera.up.set(0, 0, 1);
    this.camera.position.set(...cfg.cameraPosition);
    this.camera.lookAt(...cfg.cameraTarget);
    this._orthoCam = new THREE3.OrthographicCamera(-10, 10, 10, -10, 0.01, 2e3);
    if (this.isZUp) this._orthoCam.up.set(0, 0, 1);
    this._orthoCam.position.set(...cfg.cameraPosition);
    this._orthoCam.lookAt(...cfg.cameraTarget);
    this.renderer = new THREE3.WebGLRenderer({ antialias: cfg.antialias });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    this.ambientLight = new THREE3.AmbientLight(16777215, 0.5);
    this.threeScene.add(this.ambientLight);
    this.dirLight = new THREE3.DirectionalLight(16777215, 0.7);
    this.dirLight.position.set(8, this.isZUp ? 10 : 15, this.isZUp ? 15 : 10);
    this.dirLight.target.position.set(0, 0, 0);
    this.threeScene.add(this.dirLight);
    this.threeScene.add(this.dirLight.target);
    this.hemiLight = new THREE3.HemisphereLight(4482730, 3351057, 0.4);
    this.threeScene.add(this.hemiLight);
    this._applyLighting(this.gScene.lightingMode);
    if (cfg.showGrid) {
      const grid = new THREE3.GridHelper(cfg.gridSize, cfg.gridDivisions, 3816538, 2763850);
      if (this.isZUp) grid.rotation.x = Math.PI / 2;
      this.gridHelper = grid;
      this.threeScene.add(grid);
    }
    if (cfg.showAxes) {
      this.axesHelper = new THREE3.AxesHelper(cfg.axesSize);
      this.threeScene.add(this.axesHelper);
    }
    if (cfg.enableOrbitControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = cfg.enableDamping;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(...cfg.cameraTarget);
    }
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.unsub = gScene.on((e) => this.handleEvent(e));
    for (const obj of gScene.all()) this.addToThree(obj);
  }
  /** The currently active camera — perspective or orthographic. */
  get activeCamera() {
    return this._isOrtho ? this._orthoCam : this.camera;
  }
  // ── Event Handling ──
  handleEvent(event) {
    switch (event.type) {
      case "object:add": {
        const obj2 = this.gScene.get(event.id);
        if (obj2) this.addToThree(obj2);
        break;
      }
      case "object:remove":
        this.removeFromThree(event.id);
        break;
      case "object:update":
      case "object:style":
        this.removeFromThree(event.id);
        const obj = this.gScene.get(event.id);
        if (obj) this.addToThree(obj);
        break;
      case "scene:clear":
        this.clearThree();
        break;
      case "scene:renderMode":
        this.rebuildAllMeshes();
        break;
      case "scene:lightingMode":
        this._applyLighting(event.mode);
        this.rebuildAllMeshes();
        break;
      case "scene:environment":
        this._applyEnvironment(event.enabled);
        break;
    }
  }
  // ── Object Conversion ──
  addToThree(obj) {
    const t = this.convert(obj);
    if (!t) return;
    t.userData.geomId = obj.id;
    t.userData.pickable = obj.pickable !== false;
    t.userData.objType = obj.type;
    t.userData.styleVisible = obj.style.visible;
    t.visible = obj.style.visible && !(this.hideHelpers && this._isHelper(obj.type));
    this.applyTransform(t, obj);
    if (this.currentLighting === "studio") {
      t.traverse((child) => {
        if (child instanceof THREE3.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    this.threeScene.add(t);
    this.objectMap.set(obj.id, t);
    if (this.gizmoAttachedId === obj.id) this.attachGizmo(obj.id);
  }
  /** Apply `obj.transform` (position/rotation/scale) to a Three.Object3D. */
  applyTransform(t, obj) {
    const tr = obj.transform;
    if (!tr) return;
    if (tr.position) t.position.set(tr.position.x, tr.position.y, tr.position.z);
    if (tr.rotation) t.rotation.set(tr.rotation.x, tr.rotation.y, tr.rotation.z);
    if (tr.scale) t.scale.set(tr.scale.x, tr.scale.y, tr.scale.z);
  }
  removeFromThree(id) {
    const t = this.objectMap.get(id);
    if (!t) return;
    this.threeScene.remove(t);
    this.disposeObject(t);
    this.objectMap.delete(id);
  }
  clearThree() {
    for (const [, t] of this.objectMap) {
      this.threeScene.remove(t);
      this.disposeObject(t);
    }
    this.objectMap.clear();
  }
  /** Rebuild all mesh objects (called when render mode changes). */
  rebuildAllMeshes() {
    for (const obj of this.gScene.all()) {
      if (obj.type !== "mesh") continue;
      this.removeFromThree(obj.id);
      this.addToThree(obj);
    }
  }
  /**
   * Build a material that respects the current lighting mode. Studio mode
   * returns an `MeshStandardMaterial` (PBR; reacts correctly to shadows
   * and tonemapping); Flat mode returns the original `MeshPhongMaterial`.
   * Same option surface — caller doesn't have to care which one comes back.
   */
  _makeMaterial(opts) {
    if (this.currentLighting === "studio") {
      return new THREE3.MeshStandardMaterial({
        color: this.studioColor ?? opts.color,
        emissive: opts.emissive,
        emissiveIntensity: opts.emissiveIntensity,
        opacity: opts.opacity,
        transparent: opts.transparent,
        side: opts.side,
        wireframe: opts.wireframe,
        flatShading: opts.flatShading ?? this.studioFlatShading,
        depthTest: opts.depthTest,
        depthWrite: opts.depthWrite,
        vertexColors: opts.vertexColors,
        roughness: opts.roughness ?? this.studioRoughness,
        metalness: opts.metalness ?? this.studioMetalness
      });
    }
    const { metalness: _m, roughness: _r, ...rest } = opts;
    return new THREE3.MeshPhongMaterial(rest);
  }
  /**
   * Set the Studio-mode default PBR material applied to meshes that don't
   * carry their own metalness/roughness. Takes effect on the next material
   * build (e.g. the next sketch re-run). metalness/roughness in 0..1.
   */
  setStudioMaterial(metalness, roughness, color = null, flatShading = false) {
    this.studioMetalness = metalness;
    this.studioRoughness = roughness;
    this.studioColor = color;
    this.studioFlatShading = flatShading;
  }
  // Line/point "helper" object types (vs solid meshes/polygons/planes).
  _isHelper(type) {
    return type === "segment" || type === "polyline" || type === "point" || type === "circle";
  }
  /**
   * Show/hide line + point "helper" objects (axes, construction lines, markers,
   * labels). Solid meshes are unaffected. Applies immediately to existing
   * objects and to all future ones until changed.
   */
  /**
   * Show/hide the studio shadow-catcher plane at the world origin. Hide it when
   * the app supplies its own ground mesh to receive shadows (avoids a duplicate
   * shadow at z=0).
   */
  setShadowGroundVisible(visible) {
    this.shadowGroundHidden = !visible;
    if (this.shadowGround) this.shadowGround.visible = visible;
  }
  /**
   * Add a raw THREE.Object3D (e.g. a loaded glTF/GLB scene) to the renderer,
   * persisting across sketch re-runs. Re-adding the same id replaces it.
   * Meshes are flagged to cast + receive shadows (visible in Studio lighting).
   */
  addExternalObject(obj, id) {
    const prev = this.externalObjects.get(id);
    if (prev) this.threeScene.remove(prev);
    obj.traverse((o) => {
      const m = o;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    this.externalObjects.set(id, obj);
    this.threeScene.add(obj);
  }
  removeExternalObject(id) {
    const prev = this.externalObjects.get(id);
    if (prev) {
      this.threeScene.remove(prev);
      this.externalObjects.delete(id);
    }
  }
  setHelpersVisible(visible) {
    this.hideHelpers = !visible;
    if (this.gridHelper) this.gridHelper.visible = visible;
    if (this.axesHelper) this.axesHelper.visible = visible;
    this.threeScene.traverse((o) => {
      if (this._isHelper(o.userData?.objType)) {
        o.visible = visible ? o.userData.styleVisible ?? true : false;
      }
    });
  }
  /**
   * Aim the main directional light at the origin from the given unit
   * direction (FROM origin TO light). Input is in Z-up scene coords
   * (+X east, +Y north, +Z up) — typical sun-vector convention; the
   * renderer remaps internally if the scene is Y-up.
   *
   * @param direction Unit vector pointing toward the light source.
   * @param distance  How far back to place the light (m). Default 50.
   */
  setSunDirection(direction, distance = 50) {
    const x = direction.x;
    const y = this.isZUp ? direction.y : direction.z;
    const z = this.isZUp ? direction.z : -direction.y;
    this.dirLight.position.set(x * distance, y * distance, z * distance);
    this.dirLight.target.position.set(0, 0, 0);
    this.dirLight.target.updateMatrixWorld();
    this.dirLight.shadow.camera.updateProjectionMatrix();
  }
  /**
   * Reconfigure renderer + lights + scene shadow flags for the given mode.
   * Material swapping happens after this returns, via `rebuildAllMeshes`.
   */
  _applyLighting(mode) {
    this.currentLighting = mode;
    const studio = mode === "studio";
    this.renderer.shadowMap.enabled = studio;
    this.renderer.shadowMap.type = THREE3.PCFSoftShadowMap;
    this.renderer.toneMapping = studio ? THREE3.ACESFilmicToneMapping : THREE3.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE3.SRGBColorSpace;
    if (studio) {
      this.ambientLight.intensity = 0.35;
      this.hemiLight.intensity = 0.3;
      this.dirLight.intensity = 2.8;
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.set(2048, 2048);
      this.dirLight.shadow.bias = -5e-4;
      const sc = this.dirLight.shadow.camera;
      const d = 30;
      sc.near = 0.5;
      sc.far = 200;
      sc.left = -d;
      sc.right = d;
      sc.top = d;
      sc.bottom = -d;
      sc.updateProjectionMatrix();
    } else {
      this.ambientLight.intensity = 0.5;
      this.hemiLight.intensity = 0.4;
      this.dirLight.intensity = 0.7;
      this.dirLight.castShadow = false;
    }
    this.threeScene.traverse((obj) => {
      if (obj instanceof THREE3.Mesh) {
        obj.castShadow = studio;
        obj.receiveShadow = studio;
      }
    });
    if (studio && !this.shadowGround) {
      const geo = new THREE3.PlaneGeometry(400, 400);
      const mat = new THREE3.ShadowMaterial({ opacity: 0.35 });
      this.shadowGround = new THREE3.Mesh(geo, mat);
      this.shadowGround.receiveShadow = true;
      if (!this.isZUp) this.shadowGround.rotation.x = -Math.PI / 2;
      this.shadowGround.position.set(0, this.isZUp ? 0 : -1e-3, this.isZUp ? -1e-3 : 0);
      this.shadowGround.visible = !this.shadowGroundHidden;
      this.threeScene.add(this.shadowGround);
    } else if (!studio && this.shadowGround) {
      this.threeScene.remove(this.shadowGround);
      this.shadowGround.geometry.dispose();
      this.shadowGround.material.dispose();
      this.shadowGround = null;
    }
  }
  /**
   * Toggle a prefiltered environment map on `threeScene.environment`. Only
   * studio PBR (`MeshStandardMaterial`) materials sample it, so this is a
   * no-op visually in flat mode — but it's safe to enable in either mode.
   * The map is built once on first enable and reused thereafter.
   */
  _applyEnvironment(enabled) {
    this.envEnabled = enabled;
    if (enabled) {
      if (!this.envMap) this.envMap = this._buildEnvironment();
      this.threeScene.environment = this.envMap;
    } else {
      this.threeScene.environment = null;
    }
  }
  /**
   * Set an equirectangular source texture for the environment (e.g. a loaded
   * HDR via RGBELoader). Pass null to use the built-in procedural gradient.
   * The texture is PMREM-prefiltered here; the caller keeps ownership of it.
   */
  setEnvironmentSource(equirect) {
    if (this.envSourceTex === equirect) return;
    this.envSourceTex = equirect;
    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }
    if (this.envEnabled) {
      this.envMap = this._buildEnvironment();
      this.threeScene.environment = this.envMap;
    }
    this._applyBackground();
  }
  /**
   * Show the equirectangular environment source as the scene backdrop (sky).
   * No-op until a source is set via setEnvironmentSource. When off, the
   * background is left to setBackground().
   */
  setEnvironmentBackground(visible) {
    this.envBackground = visible;
    this._applyBackground();
  }
  /**
   * Rotate the environment + background (Euler radians) — e.g. to align a Y-up
   * HDRI/equirect source with a Z-up scene (tilt ~90° about X).
   */
  setEnvironmentRotation(x, y, z) {
    const s = this.threeScene;
    s.environmentRotation?.set(x, y, z);
    s.backgroundRotation?.set(x, y, z);
  }
  _applyBackground() {
    if (this.envBackground && this.envSourceTex) {
      this.envSourceTex.mapping = THREE3.EquirectangularReflectionMapping;
      this.threeScene.background = this.envSourceTex;
    }
  }
  /**
   * Build a prefiltered (PMREM) environment from a procedural vertical
   * gradient — bright neutral sky at the top, mid horizon, darker ground —
   * using core Three only (no `three/examples` RoomEnvironment). Returns the
   * PMREM-filtered cube texture; the source `DataTexture` and the generator
   * are disposed before returning.
   */
  _buildEnvironment() {
    if (this.envSourceTex) {
      this.envSourceTex.mapping = THREE3.EquirectangularReflectionMapping;
      const pmremSrc = new THREE3.PMREMGenerator(this.renderer);
      const envSrc = pmremSrc.fromEquirectangular(this.envSourceTex).texture;
      pmremSrc.dispose();
      return envSrc;
    }
    const W = 16, H = 256;
    const data = new Uint8Array(W * H * 4);
    const sky = [0.85, 0.88, 0.95];
    const horizon = [0.55, 0.55, 0.55];
    const ground = [0.12, 0.12, 0.13];
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1);
      let r, g, b;
      if (t < 0.5) {
        const k = t / 0.5;
        r = ground[0] + (horizon[0] - ground[0]) * k;
        g = ground[1] + (horizon[1] - ground[1]) * k;
        b = ground[2] + (horizon[2] - ground[2]) * k;
      } else {
        const k = (t - 0.5) / 0.5;
        r = horizon[0] + (sky[0] - horizon[0]) * k;
        g = horizon[1] + (sky[1] - horizon[1]) * k;
        b = horizon[2] + (sky[2] - horizon[2]) * k;
      }
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i] = Math.round(r * 255);
        data[i + 1] = Math.round(g * 255);
        data[i + 2] = Math.round(b * 255);
        data[i + 3] = 255;
      }
    }
    const tex = new THREE3.DataTexture(data, W, H, THREE3.RGBAFormat);
    tex.mapping = THREE3.EquirectangularReflectionMapping;
    tex.colorSpace = THREE3.SRGBColorSpace;
    tex.needsUpdate = true;
    const pmrem = new THREE3.PMREMGenerator(this.renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }
  /** Build a THREE.Line for a line-type object — dashed material (+ line distances)
   *  when the style requests it, else a basic line material. */
  _makeLine(geo, s) {
    const mat = s.dash ? new THREE3.LineDashedMaterial({ color: s.color, opacity: s.opacity, transparent: s.opacity < 1, dashSize: s.dash.size, gapSize: s.dash.gap }) : new THREE3.LineBasicMaterial({ color: s.color, opacity: s.opacity, transparent: s.opacity < 1 });
    const line = new THREE3.Line(geo, mat);
    if (s.dash) line.computeLineDistances();
    return line;
  }
  convert(obj) {
    const s = obj.style;
    switch (obj.type) {
      case "point": {
        const geo = new THREE3.SphereGeometry(s.pointSize, 12, 12);
        const mat = this._makeMaterial({
          color: s.color,
          emissive: s.color,
          emissiveIntensity: 0.3,
          opacity: s.opacity,
          transparent: s.opacity < 1,
          metalness: s.metalness,
          roughness: s.roughness
        });
        const mesh = new THREE3.Mesh(geo, mat);
        if (obj.position) mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        if (s.label) {
          const group = new THREE3.Group();
          group.add(mesh);
          const sprite = this.createTextSprite(s.label, s.labelColor ?? s.color);
          if (obj.position) sprite.position.set(obj.position.x, obj.position.y, obj.position.z);
          if (this.isZUp) sprite.position.z += s.pointSize + 0.15;
          else sprite.position.y += s.pointSize + 0.15;
          group.add(sprite);
          return group;
        }
        return mesh;
      }
      case "segment": {
        if (!obj.start || !obj.end) return null;
        const a = new THREE3.Vector3(obj.start.x, obj.start.y, obj.start.z);
        const b = new THREE3.Vector3(obj.end.x, obj.end.y, obj.end.z);
        if (s.tubeRadius && s.tubeRadius > 0) {
          const dir = new THREE3.Vector3().subVectors(b, a);
          const len = dir.length();
          if (len < 1e-8) return null;
          const geo2 = new THREE3.CylinderGeometry(s.tubeRadius, s.tubeRadius, len, 6, 1);
          geo2.rotateX(Math.PI / 2);
          geo2.translate(0, 0, len / 2);
          const mesh = new THREE3.Mesh(geo2, this._makeMaterial({
            color: s.color,
            opacity: s.opacity,
            transparent: s.opacity < 1,
            metalness: s.metalness,
            roughness: s.roughness
          }));
          mesh.position.copy(a);
          mesh.lookAt(b);
          return mesh;
        }
        const geo = new THREE3.BufferGeometry().setFromPoints([a, b]);
        return this._makeLine(geo, s);
      }
      case "polyline": {
        if (!obj.vertices || obj.vertices.length < 2) return null;
        const n = obj.vertices.length;
        const arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const v = obj.vertices[i];
          arr[i * 3] = v.x;
          arr[i * 3 + 1] = v.y;
          arr[i * 3 + 2] = v.z;
        }
        const geo = new THREE3.BufferGeometry();
        geo.setAttribute("position", new THREE3.BufferAttribute(arr, 3));
        return this._makeLine(geo, s);
      }
      case "polygon": {
        if (!obj.vertices || obj.vertices.length < 2) return null;
        const group = new THREE3.Group();
        const pts = obj.vertices.map((v) => new THREE3.Vector3(v.x, v.y, v.z));
        if (pts.length > 2) pts.push(pts[0].clone());
        const lineGeo = new THREE3.BufferGeometry().setFromPoints(pts);
        group.add(new THREE3.Line(lineGeo, new THREE3.LineBasicMaterial({ color: s.color })));
        if (obj.vertices.length >= 3) {
          if (this.isZUp) {
            const shape = new THREE3.Shape(obj.vertices.map((v) => new THREE3.Vector2(v.x, v.y)));
            const shapeGeo = new THREE3.ShapeGeometry(shape);
            group.add(new THREE3.Mesh(shapeGeo, this._makeMaterial({
              color: s.color,
              opacity: s.opacity,
              transparent: true,
              side: THREE3.DoubleSide,
              metalness: s.metalness,
              roughness: s.roughness
            })));
          } else {
            const shape = new THREE3.Shape(obj.vertices.map((v) => new THREE3.Vector2(v.x, v.z)));
            const shapeGeo = new THREE3.ShapeGeometry(shape);
            shapeGeo.rotateX(-Math.PI / 2);
            group.add(new THREE3.Mesh(shapeGeo, this._makeMaterial({
              color: s.color,
              opacity: s.opacity,
              transparent: true,
              side: THREE3.DoubleSide,
              metalness: s.metalness,
              roughness: s.roughness
            })));
          }
        }
        return group;
      }
      case "mesh": {
        if (obj.flatMeshData) return this.convertFlatMesh(obj.flatMeshData, s);
        if (!obj.mesh) return null;
        return this.convertMesh(obj.mesh, s);
      }
      case "circle": {
        if (!obj.center || obj.radius == null) return null;
        const pts = [];
        const seg = 64;
        for (let i = 0; i <= seg; i++) {
          const a = i / seg * Math.PI * 2;
          const ca = Math.cos(a) * obj.radius, sa = Math.sin(a) * obj.radius;
          if (this.isZUp) {
            pts.push(new THREE3.Vector3(obj.center.x + ca, obj.center.y + sa, obj.center.z));
          } else {
            pts.push(new THREE3.Vector3(obj.center.x + ca, obj.center.y, obj.center.z + sa));
          }
        }
        const geo = new THREE3.BufferGeometry().setFromPoints(pts);
        return this._makeLine(geo, s);
      }
      case "plane": {
        if (!obj.normal) return null;
        const geo = new THREE3.PlaneGeometry(10, 10);
        const mat = this._makeMaterial({
          color: s.color,
          opacity: s.opacity,
          transparent: true,
          side: THREE3.DoubleSide,
          metalness: s.metalness,
          roughness: s.roughness
        });
        const mesh = new THREE3.Mesh(geo, mat);
        const n = new THREE3.Vector3(obj.normal.x, obj.normal.y, obj.normal.z).normalize();
        mesh.lookAt(n);
        mesh.position.copy(n.multiplyScalar(obj.distance ?? 0));
        return mesh;
      }
      default:
        return null;
    }
  }
  /** Convert a Tekto Mesh → Three.js group with solid + wireframe */
  convertMesh(gmesh, s) {
    const data = gmesh.toIndexedTriangles();
    const geo = new THREE3.BufferGeometry();
    geo.setAttribute("position", new THREE3.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE3.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE3.BufferAttribute(data.indices, 1));
    return this.buildMeshGroup(geo, s);
  }
  /** Convert flat mesh data (with optional per-vertex colors) → Three.js group */
  convertFlatMesh(data, s) {
    const geo = new THREE3.BufferGeometry();
    geo.setAttribute("position", new THREE3.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE3.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE3.BufferAttribute(data.indices, 1));
    const hasColors = !!data.colors?.length;
    if (hasColors) geo.setAttribute("color", new THREE3.BufferAttribute(data.colors, 4));
    if (data.groups?.length && this.gScene.renderMode === "solid" && !hasColors) {
      const groupColors = s.groupColors ?? {};
      const side = s.backfaceColor ? THREE3.DoubleSide : s.doubleSided ? THREE3.DoubleSide : THREE3.FrontSide;
      for (let i = 0; i < data.groups.length; i++) {
        const g = data.groups[i];
        geo.addGroup(g.indexStart, g.indexCount, i);
      }
      const materials = data.groups.map((g) => this._makeMaterial({
        color: groupColors[g.name] ?? s.color,
        opacity: s.wireframe ? s.opacity * 0.3 : s.opacity,
        transparent: s.opacity < 1 || s.wireframe,
        side,
        flatShading: s.flatShading ?? false,
        metalness: s.metalness,
        roughness: s.roughness,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      }));
      const group = new THREE3.Group();
      group.add(new THREE3.Mesh(geo, materials));
      if (!s.wireframe) {
        group.add(new THREE3.Mesh(geo.clone(), new THREE3.MeshBasicMaterial({
          color: 16777215,
          wireframe: true,
          opacity: 0.04,
          transparent: true
        })));
      }
      return group;
    }
    return this.buildMeshGroup(geo, s, hasColors);
  }
  /** Shared mesh group builder — handles solid / wireframe / hiddenline render modes */
  buildMeshGroup(geo, s, hasVertexColors = false) {
    const group = new THREE3.Group();
    const mode = this.gScene.renderMode;
    const side = s.doubleSided ? THREE3.DoubleSide : THREE3.FrontSide;
    if (mode === "wireframe") {
      const wireMat = new THREE3.MeshBasicMaterial({
        color: s.color,
        wireframe: true,
        opacity: s.opacity,
        transparent: s.opacity < 1
      });
      group.add(new THREE3.Mesh(geo, wireMat));
    } else if (mode === "hiddenline") {
      const occlusionMat = new THREE3.MeshBasicMaterial({
        color: this.config.backgroundColor,
        side,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      group.add(new THREE3.Mesh(geo, occlusionMat));
      const edgeAngle = s.edgeAngle ?? 30;
      const wireGeo = new THREE3.EdgesGeometry(geo, edgeAngle);
      const wireMat = new THREE3.LineBasicMaterial({ color: 11579568 });
      group.add(new THREE3.LineSegments(wireGeo, wireMat));
    } else {
      const solidMat = this._makeMaterial({
        color: hasVertexColors ? 16777215 : s.color,
        vertexColors: hasVertexColors,
        opacity: s.wireframe ? s.opacity * 0.3 : s.opacity,
        transparent: s.opacity < 1 || s.wireframe,
        side: s.backfaceColor ? THREE3.DoubleSide : side,
        flatShading: s.flatShading ?? false,
        metalness: s.metalness,
        roughness: s.roughness,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      if (s.backfaceColor) {
        const bc = new THREE3.Color(s.backfaceColor);
        solidMat.onBeforeCompile = (shader) => {
          shader.uniforms.backfaceColor = { value: bc };
          shader.fragmentShader = "uniform vec3 backfaceColor;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            `#include <color_fragment>
            if (!gl_FrontFacing) { diffuseColor.rgb = backfaceColor; }`
          );
        };
      }
      group.add(new THREE3.Mesh(geo, solidMat));
      if (s.wireframe) {
        const wireMat = new THREE3.MeshBasicMaterial({
          color: s.color,
          wireframe: true,
          opacity: s.opacity * 0.8,
          transparent: true
        });
        group.add(new THREE3.Mesh(geo.clone(), wireMat));
      } else if (!hasVertexColors) {
        const subtleWire = new THREE3.MeshBasicMaterial({
          color: 16777215,
          wireframe: true,
          opacity: 0.04,
          transparent: true
        });
        group.add(new THREE3.Mesh(geo.clone(), subtleWire));
      }
    }
    return group;
  }
  // ── Text Sprites ──
  createTextSprite(text, color) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSize = 48;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width) + 16;
    const h = fontSize + 16;
    canvas.width = w;
    canvas.height = h;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, w / 2, h / 2);
    const tex = new THREE3.CanvasTexture(canvas);
    tex.minFilter = THREE3.LinearFilter;
    const mat = new THREE3.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE3.Sprite(mat);
    const scale = 5e-3;
    sprite.scale.set(w * scale, h * scale, 1);
    return sprite;
  }
  // ── Get Three.js object for a scene ID ──
  getThreeObject(id) {
    return this.objectMap.get(id);
  }
  /**
   * Project a world-space point into the viewport. Returned `x`, `y` are
   * relative to the canvas's bounding rect (top-left = 0, 0).
   * `visible` is false when the point is behind the camera or outside
   * the normalised device cube — caller should hide the overlay.
   */
  worldToScreen(world) {
    const v = new THREE3.Vector3(world.x, world.y, world.z).project(this.activeCamera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = (v.x * 0.5 + 0.5) * rect.width;
    const y = (-v.y * 0.5 + 0.5) * rect.height;
    const visible = v.z > -1 && v.z < 1;
    return { x, y, visible };
  }
  // ── Picking ──
  /** Enable/disable click-to-pick on the canvas. */
  setPickEnabled(enabled) {
    if (enabled === this.pickEnabled) return;
    this.pickEnabled = enabled;
    const dom = this.renderer.domElement;
    if (enabled) {
      dom.addEventListener("pointerdown", this.onPointerDown);
      dom.addEventListener("pointerup", this.onPointerUp);
    } else {
      dom.removeEventListener("pointerdown", this.onPointerDown);
      dom.removeEventListener("pointerup", this.onPointerUp);
      this.pointerDown = null;
    }
  }
  /** Subscribe to pick events. Returns unsubscribe. `id` is null when the user clicked background. */
  onPick(listener) {
    this.pickListeners.add(listener);
    return () => this.pickListeners.delete(listener);
  }
  /** Returns the handle name under (clientX, clientY) or null. */
  dragHandleHitTest(clientX, clientY) {
    if (this.dragHandles.size === 0) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const meshes = [...this.dragHandles.values()];
    const hits = this.raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? hits[0].object.userData.handleName : null;
  }
  /** Raycast at (clientX, clientY) against a Three.Plane; returns the intersection point. */
  raycastPlane(clientX, clientY, plane) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const hit = new THREE3.Vector3();
    return this.raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  }
  // ── Drag handles API ──
  /** Register the per-drag, per-drag-end, and per-pick callbacks. */
  setDragHandleCallbacks(onMove, onEnd, onPick) {
    this.dragHandleMoveCb = onMove;
    this.dragHandleEndCb = onEnd ?? null;
    this.dragHandlePickCb = onPick ?? null;
  }
  /** Mark the start of a sketch run: clear the "seen this run" set. */
  beginDragHandleSweep() {
    this.dragSeenThisRun.clear();
  }
  /**
   * Create or update a drag handle by stable name. Position is world-space.
   * `constrain` (optional) snaps the dragged position — e.g. to a polyline.
   */
  upsertDragHandle(name, x, y, z, color = "#38d9a9", size = 0.12, constrain, plane) {
    this.dragSeenThisRun.add(name);
    let mesh = this.dragHandles.get(name);
    if (!mesh) {
      const geo = new THREE3.SphereGeometry(size, 16, 12);
      const mat = this._makeMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55
      });
      mesh = new THREE3.Mesh(geo, mat);
      mesh.userData.handleName = name;
      mesh.userData.baseSize = size;
      mesh.userData.baseColor = color;
      mesh.renderOrder = 999;
      mesh.material.depthTest = false;
      this.threeScene.add(mesh);
      this.dragHandles.set(name, mesh);
    } else {
      const mat = mesh.material;
      if (mat.color.getHexString() !== color.replace(/^#/, "").toLowerCase()) {
        mat.color.set(color);
        mat.emissive.set(color);
        mesh.userData.baseColor = color;
      }
      const cur = mesh.geometry.parameters?.radius;
      if (cur !== size) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE3.SphereGeometry(size, 16, 12);
        mesh.userData.baseSize = size;
      }
    }
    if (constrain) this.dragHandleConstraints.set(name, constrain);
    else this.dragHandleConstraints.delete(name);
    if (plane) this.dragHandlePlanes.set(name, plane);
    else this.dragHandlePlanes.delete(name);
    if (this.activeDragHandle !== name) mesh.position.set(x, y, z);
    if (this.selectedDragHandle === name) this.applyHandleStyle(name, true);
  }
  /** Remove any drag handles that weren't visited in this run. */
  endDragHandleSweep() {
    for (const [name, mesh] of this.dragHandles) {
      if (!this.dragSeenThisRun.has(name)) {
        this.threeScene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.dragHandles.delete(name);
        this.dragHandleConstraints.delete(name);
        this.dragHandlePlanes.delete(name);
        if (this.selectedDragHandle === name) this.selectedDragHandle = null;
      }
    }
  }
  /** Currently selected drag handle, or null. */
  getSelectedHandle() {
    return this.selectedDragHandle;
  }
  /** The handle currently being DRAGGED (set on pointer-down, cleared on pointer-up); null when idle. */
  getActiveDragHandle() {
    return this.activeDragHandle;
  }
  /** Programmatically select / deselect a drag handle (visual + callback). */
  setHandleSelected(name) {
    if (this.selectedDragHandle === name) return;
    if (this.selectedDragHandle) this.applyHandleStyle(this.selectedDragHandle, false);
    this.selectedDragHandle = name;
    if (name) this.applyHandleStyle(name, true);
  }
  applyHandleStyle(name, selected) {
    const mesh = this.dragHandles.get(name);
    if (!mesh) return;
    const mat = mesh.material;
    if (selected) {
      mat.emissiveIntensity = 1;
      mesh.scale.setScalar(1.6);
    } else {
      mat.emissiveIntensity = 0.55;
      mesh.scale.setScalar(1);
    }
  }
  /** Raycast at viewport coordinates and return the topmost pickable scene id (or null). */
  pickAt(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE3.Vector2(
      (clientX - rect.left) / rect.width * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const pickable = [];
    for (const t of this.objectMap.values()) {
      if (t.userData.pickable !== false) pickable.push(t);
    }
    const hits = this.raycaster.intersectObjects(pickable, true);
    for (const h of hits) {
      let cur = h.object;
      while (cur && !cur.userData.geomId) cur = cur.parent;
      if (cur?.userData.geomId) return cur.userData.geomId;
    }
    return null;
  }
  // ── Gizmo (transform controls) ──
  setGizmoMode(mode) {
    this.gizmoMode = mode;
    if (mode === "none") {
      this.detachGizmo();
    } else {
      this.ensureGizmo();
      this.transformControls?.setMode(mode);
      if (this.gizmoAttachedId) this.attachGizmo(this.gizmoAttachedId);
    }
  }
  getGizmoMode() {
    return this.gizmoMode;
  }
  attachGizmo(id) {
    const t = this.objectMap.get(id);
    if (!t) {
      this.detachGizmo();
      return;
    }
    if (this.gizmoMode === "none") {
      this.gizmoAttachedId = id;
      return;
    }
    this.ensureGizmo();
    this.transformControls.attach(t);
    this.gizmoAttachedId = id;
  }
  detachGizmo() {
    this.transformControls?.detach();
    this.gizmoAttachedId = null;
  }
  ensureGizmo() {
    if (this.transformControls) return;
    const tc = new TransformControls(this.activeCamera, this.renderer.domElement);
    tc.setMode(this.gizmoMode === "none" ? "translate" : this.gizmoMode);
    tc.addEventListener("dragging-changed", (e) => {
      if (this.controls) this.controls.enabled = !e.value;
      if (!e.value && this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    tc.addEventListener("objectChange", () => {
      if (this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    this.threeScene.add(tc);
    this.transformControls = tc;
  }
  /** Read the gizmo'd Three.Object3D's transform and write it back into the SceneObject. */
  writeBackTransform(id) {
    const t = this.objectMap.get(id);
    if (!t) return;
    const obj = this.gScene.get(id);
    if (!obj) return;
    const transform = {
      position: new Vec3(t.position.x, t.position.y, t.position.z),
      rotation: new Vec3(t.rotation.x, t.rotation.y, t.rotation.z),
      scale: new Vec3(t.scale.x, t.scale.y, t.scale.z)
    };
    this.gScene.withSuspendedEvents(() => {
      this.gScene.update(id, { transform });
    });
  }
  // ── Selection visual feedback ──
  setSelectionHighlight(id) {
    for (const [, info] of this.selectionMaterials) {
      const m = info.mat;
      m.emissive.copy(info.oldEmissive);
      m.emissiveIntensity = info.oldIntensity;
    }
    this.selectionMaterials.clear();
    if (!id) return;
    const t = this.objectMap.get(id);
    if (!t) return;
    t.traverse((child) => {
      const m = child.material;
      if (m && m.emissive instanceof THREE3.Color) {
        this.selectionMaterials.set(child.uuid, {
          mat: m,
          oldEmissive: m.emissive.clone(),
          oldIntensity: m.emissiveIntensity ?? 0
        });
        m.emissive = new THREE3.Color(3725737);
        m.emissiveIntensity = 0.35;
      }
    });
  }
  // ── Render ──
  render() {
    this.controls?.update();
    this.renderer.render(this.threeScene, this.activeCamera);
  }
  startLoop() {
    let running = true;
    const loop = () => {
      if (!running) return;
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(this.rafId);
    };
  }
  // ── Resize ──
  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._syncOrthoCamFrustum();
    this.renderer.setSize(w, h);
  }
  // ── Projection & View ──
  /** Compute the orthographic frustum to match the current perspective camera view distance. */
  _syncOrthoCamFrustum() {
    const target = this.controls?.target ?? new THREE3.Vector3();
    const dist = Math.max(this.camera.position.distanceTo(target), 0.1);
    const fovRad = this.camera.fov * Math.PI / 180;
    const halfH = Math.tan(fovRad / 2) * dist;
    const halfW = halfH * this.camera.aspect;
    this._orthoCam.left = -halfW;
    this._orthoCam.right = halfW;
    this._orthoCam.top = halfH;
    this._orthoCam.bottom = -halfH;
    this._orthoCam.near = -dist * 10;
    this._orthoCam.far = dist * 10;
    this._orthoCam.updateProjectionMatrix();
  }
  /**
   * Switch between perspective and orthographic projection.
   * Transfers the current camera position/orientation so the view is continuous.
   */
  setProjection(type) {
    const wasOrtho = this._isOrtho;
    this._isOrtho = type === "orthographic";
    if (this._isOrtho && !wasOrtho) {
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this._syncOrthoCamFrustum();
    } else if (!this._isOrtho && wasOrtho) {
      this.camera.position.copy(this._orthoCam.position);
      this.camera.quaternion.copy(this._orthoCam.quaternion);
    }
    if (this.controls) {
      this.controls.object = this.activeCamera;
      this.controls.update();
    }
  }
  /**
   * Set the camera up vector. Use (0,1,0) for top-down plan views (Z-up scenes),
   * and restore (0,0,1) for side/elevation views.
   */
  setCameraUp(x, y, z) {
    this.camera.up.set(x, y, z);
    this._orthoCam.up.set(x, y, z);
    if (this.controls) this.controls.update();
  }
  /**
   * Fit all visible scene objects inside the current view.
   * Preserves the camera direction; only adjusts distance and target.
   */
  fitAll() {
    const box = new THREE3.Box3();
    for (const obj of this.objectMap.values()) {
      if (obj.visible) {
        const b = new THREE3.Box3().setFromObject(obj);
        if (!b.isEmpty()) box.union(b);
      }
    }
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE3.Vector3());
    const sphere = box.getBoundingSphere(new THREE3.Sphere());
    const target = this.controls?.target.clone() ?? center;
    let dir = new THREE3.Vector3().subVectors(this.camera.position, target);
    if (dir.length() < 1e-6) dir.set(1, 1, 1);
    dir.normalize();
    const fovRad = this.camera.fov * Math.PI / 180;
    const dist = sphere.radius / Math.tan(fovRad / 2) * 1.3;
    this.camera.position.copy(center).addScaledVector(dir, dist);
    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
    if (this._isOrtho) {
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this._syncOrthoCamFrustum();
    }
  }
  // ── Raycasting ──
  /** Pick scene objects under a screen coordinate */
  pick(screenX, screenY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE3.Vector2(
      (screenX - rect.left) / rect.width * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE3.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const targets = [...this.objectMap.values()];
    const hits = raycaster.intersectObjects(targets, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj && !obj.userData.geomId) obj = obj.parent;
      if (obj?.userData.geomId) {
        return { id: obj.userData.geomId, point: hit.point };
      }
    }
    return null;
  }
  /** Project a screen position onto a plane */
  screenToPlane(screenX, screenY, plane) {
    const defaultNormal = this.isZUp ? new THREE3.Vector3(0, 0, 1) : new THREE3.Vector3(0, 1, 0);
    const p = plane ?? new THREE3.Plane(defaultNormal, 0);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE3.Vector2(
      (screenX - rect.left) / rect.width * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE3.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const target = new THREE3.Vector3();
    return raycaster.ray.intersectPlane(p, target) ? target : null;
  }
  // ── Cleanup ──
  disposeObject(obj) {
    obj.traverse((child) => {
      const m = child;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material.dispose();
      }
    });
  }
  dispose() {
    this.unsub?.();
    this.clearThree();
    this.threeScene.environment = null;
    this.envMap?.dispose();
    this.envMap = null;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    try {
      this.renderer.forceContextLoss();
    } catch {
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
};

// src/render/SVGRenderer.ts
var DEFAULTS6 = {
  width: 800,
  height: 600,
  viewBox: { minX: -5, minY: -5, width: 10, height: 10 },
  backgroundColor: "#0a0b14",
  showGrid: true,
  gridSpacing: 1,
  gridColor: "#1a1c3a",
  showLabels: true,
  projection: "xz",
  padding: 20,
  pointRadius: 5
};
var SVGRenderer = class {
  constructor(gScene, container, config) {
    this.unsub = null;
    this.gScene = gScene;
    this.config = { ...DEFAULTS6, ...config };
    const c = this.config;
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", String(c.width));
    this.svg.setAttribute("height", String(c.height));
    this.svg.setAttribute("viewBox", `${c.viewBox.minX} ${c.viewBox.minY} ${c.viewBox.width} ${c.viewBox.height}`);
    this.svg.style.background = c.backgroundColor;
    this.svg.style.display = "block";
    container.appendChild(this.svg);
    this.gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.svg.appendChild(this.gridGroup);
    if (c.showGrid) this.drawGrid();
    this.contentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.contentGroup.setAttribute("transform", "scale(1, -1)");
    this.svg.appendChild(this.contentGroup);
    this.unsub = gScene.on(() => this.render());
    this.render();
  }
  project(v) {
    switch (this.config.projection) {
      case "xz":
        return { x: v.x, y: v.z };
      case "xy":
        return { x: v.x, y: v.y };
      case "yz":
        return { x: v.y, y: v.z };
    }
  }
  drawGrid() {
    const { viewBox: vb, gridSpacing: gs, gridColor } = this.config;
    const startX = Math.floor(vb.minX / gs) * gs;
    const startY = Math.floor(vb.minY / gs) * gs;
    const endX = vb.minX + vb.width;
    const endY = vb.minY + vb.height;
    for (let x = startX; x <= endX; x += gs) {
      const line = this.createSVGLine(x, vb.minY, x, vb.minY + vb.height, gridColor, 0.02);
      this.gridGroup.appendChild(line);
    }
    for (let y = startY; y <= endY; y += gs) {
      const line = this.createSVGLine(vb.minX, y, vb.minX + vb.width, y, gridColor, 0.02);
      this.gridGroup.appendChild(line);
    }
    this.gridGroup.appendChild(this.createSVGLine(vb.minX, 0, endX, 0, "#2a3055", 0.04));
    this.gridGroup.appendChild(this.createSVGLine(0, vb.minY, 0, endY, "#2a3055", 0.04));
  }
  render() {
    while (this.contentGroup.firstChild) this.contentGroup.removeChild(this.contentGroup.firstChild);
    for (const obj of this.gScene.all()) {
      if (!obj.style.visible) continue;
      this.renderObject(obj);
    }
  }
  renderObject(obj) {
    const s = obj.style;
    const pr = this.config.pointRadius * this.config.viewBox.width / this.config.width;
    switch (obj.type) {
      case "point": {
        if (!obj.position) break;
        const p = this.project(obj.position);
        const circle = this.createSVGCircle(p.x, p.y, pr, s.color, s.opacity);
        circle.dataset.geomId = obj.id;
        this.contentGroup.appendChild(circle);
        if (s.label && this.config.showLabels) {
          const text = this.createSVGText(p.x + pr * 2, p.y + pr * 2, s.label, s.labelColor ?? s.color);
          text.setAttribute("transform", `scale(1,-1)`);
          text.setAttribute("y", String(-p.y - pr * 2));
          this.contentGroup.appendChild(text);
        }
        break;
      }
      case "segment": {
        if (!obj.start || !obj.end) break;
        const a = this.project(obj.start);
        const b = this.project(obj.end);
        const line = this.createSVGLine(a.x, a.y, b.x, b.y, s.color, 0.03, s.opacity);
        line.dataset.geomId = obj.id;
        this.contentGroup.appendChild(line);
        break;
      }
      case "polygon": {
        if (!obj.vertices || obj.vertices.length < 2) break;
        const pts = obj.vertices.map((v) => this.project(v));
        const poly = this.createSVGPolygon(pts, s.color, s.opacity);
        poly.dataset.geomId = obj.id;
        this.contentGroup.appendChild(poly);
        break;
      }
      case "circle": {
        if (!obj.center || obj.radius == null) break;
        const c = this.project(obj.center);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(c.x));
        circle.setAttribute("cy", String(c.y));
        circle.setAttribute("r", String(obj.radius));
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", s.color);
        circle.setAttribute("stroke-width", "0.03");
        circle.setAttribute("opacity", String(s.opacity));
        circle.dataset.geomId = obj.id;
        this.contentGroup.appendChild(circle);
        break;
      }
      case "mesh": {
        if (!obj.mesh) break;
        for (const face of obj.mesh.faces()) {
          const pts = face.nodes.map((nid) => {
            const node = obj.mesh.node(nid);
            return node ? this.project(node.position) : { x: 0, y: 0 };
          });
          const poly = this.createSVGPolygon(pts, s.color, s.opacity * 0.3);
          this.contentGroup.appendChild(poly);
        }
        for (const edge of obj.mesh.edges()) {
          const a = obj.mesh.node(edge.nodes[0]);
          const b = obj.mesh.node(edge.nodes[1]);
          if (!a || !b) continue;
          const pa = this.project(a.position);
          const pb = this.project(b.position);
          this.contentGroup.appendChild(
            this.createSVGLine(pa.x, pa.y, pb.x, pb.y, s.color, 0.02, s.opacity * 0.5)
          );
        }
        break;
      }
    }
  }
  // ── SVG Helpers ──
  createSVGCircle(cx, cy, r, color, opacity = 1) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", String(cx));
    el.setAttribute("cy", String(cy));
    el.setAttribute("r", String(r));
    el.setAttribute("fill", color);
    el.setAttribute("opacity", String(opacity));
    return el;
  }
  createSVGLine(x1, y1, x2, y2, color, width = 0.02, opacity = 1) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("x1", String(x1));
    el.setAttribute("y1", String(y1));
    el.setAttribute("x2", String(x2));
    el.setAttribute("y2", String(y2));
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", String(width));
    el.setAttribute("opacity", String(opacity));
    return el;
  }
  createSVGPolygon(pts, color, opacity = 0.5) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    el.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
    el.setAttribute("fill", color);
    el.setAttribute("fill-opacity", String(opacity));
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", "0.03");
    return el;
  }
  createSVGText(x, y, text, color) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", String(x));
    el.setAttribute("y", String(y));
    el.setAttribute("fill", color);
    el.setAttribute("font-size", "0.2");
    el.setAttribute("font-family", "monospace");
    el.textContent = text;
    return el;
  }
  /** Update the viewBox (pan/zoom) */
  setViewBox(minX, minY, width, height) {
    this.config.viewBox = { minX, minY, width, height };
    this.svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
    this.render();
  }
  dispose() {
    this.unsub?.();
    this.svg.remove();
  }
};

// src/gui/LayerPanel.ts
function computeEffectiveVisibility(nodes, value) {
  const result = {};
  const walk = (node, parentEffective) => {
    const own = value[node.id]?.visible ?? (node.defaultVisible ?? true);
    const effective = parentEffective && own;
    result[node.id] = effective;
    node.children?.forEach((child) => walk(child, effective));
  };
  nodes.forEach((node) => walk(node, true));
  return result;
}
var LayerPanel = class {
  constructor(opts) {
    this._nodes = [];
    this._value = {};
    this._collapsed = /* @__PURE__ */ new Set();
    this._isDark = opts.isDark ?? true;
    this._onChange = opts.onChange;
    this.el = document.createElement("div");
    this.el.style.cssText = "overflow-y:auto;max-height:300px;";
    this.update(opts.nodes, opts.value);
  }
  /**
   * Re-render with new nodes/value.
   * Scroll position and collapsed state are preserved.
   */
  update(nodes, value) {
    this._nodes = nodes;
    this._value = value;
    const scroll = this.el.scrollTop;
    this.el.innerHTML = "";
    for (const node of this._nodes) this._renderNode(node, 0, true);
    this.el.scrollTop = scroll;
  }
  // ── Private helpers ──
  _stateOf(node) {
    return this._value[node.id] ?? {
      visible: node.defaultVisible ?? true,
      color: node.defaultColor ?? "#888888"
    };
  }
  _rebuild() {
    const scroll = this.el.scrollTop;
    this.el.innerHTML = "";
    for (const node of this._nodes) this._renderNode(node, 0, true);
    this.el.scrollTop = scroll;
  }
  /**
   * @param ancestorVisible — whether all ancestors are currently visible.
   *   Used only for visual dimming; does NOT affect stored state.
   */
  _renderNode(node, depth, ancestorVisible) {
    const state = this._stateOf(node);
    const hasChildren = !!node.children?.length;
    const isCollapsed = this._collapsed.has(node.id);
    const effectiveVisible = ancestorVisible && state.visible;
    const d = this._isDark;
    const labelColor = d ? effectiveVisible ? "#b8bdd4" : "#3a3f5a" : effectiveVisible ? "#2a2d3a" : "#b0b4c0";
    const arrowColor = d ? "#3a3f5a" : "#b0b4c0";
    const hoverBg = d ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:5px;
      padding:3px 6px 3px ${6 + depth * 14}px;
      border-radius:3px;cursor:default;transition:background .1s;min-height:22px;
    `;
    row.addEventListener("mouseenter", () => {
      row.style.background = hoverBg;
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "";
    });
    const arrow = document.createElement("span");
    arrow.style.cssText = `width:10px;font-size:7px;flex-shrink:0;line-height:1;color:${arrowColor};user-select:none;`;
    if (hasChildren) {
      arrow.textContent = isCollapsed ? "\u25B6" : "\u25BC";
      arrow.style.cursor = "pointer";
      arrow.addEventListener("click", (e) => {
        e.stopPropagation();
        this._collapsed.has(node.id) ? this._collapsed.delete(node.id) : this._collapsed.add(node.id);
        this._rebuild();
      });
    }
    row.appendChild(arrow);
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = state.visible;
    cb.style.cssText = `cursor:pointer;width:11px;height:11px;flex-shrink:0;accent-color:#38d9a9;margin:0;opacity:${ancestorVisible ? "1" : "0.35"};`;
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      this._onChange({ [node.id]: { ...state, visible: cb.checked } });
    });
    row.appendChild(cb);
    const lbl = document.createElement("span");
    lbl.textContent = node.label;
    lbl.style.cssText = `
      flex:1;font-size:11px;color:${labelColor};
      user-select:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    `;
    row.appendChild(lbl);
    const cp = document.createElement("input");
    cp.type = "color";
    cp.value = state.color;
    cp.title = "Layer color";
    cp.style.cssText = `
      width:16px;height:13px;border:1px solid ${d ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.15)"};
      border-radius:2px;padding:0;cursor:pointer;flex-shrink:0;outline:none;background:none;
    `;
    cp.addEventListener("change", (e) => {
      e.stopPropagation();
      this._onChange({ [node.id]: { ...state, color: cp.value } });
    });
    row.appendChild(cp);
    this.el.appendChild(row);
    if (hasChildren && !isCollapsed) {
      for (const child of node.children) {
        this._renderNode(child, depth + 1, effectiveVisible);
      }
    }
  }
};

// src/sketch/Sketch.ts
import * as THREE4 from "three";
function sketch(fn, config) {
  return new SketchInstance(fn, config ?? {});
}
var SketchInstance = class {
  constructor(fn, config) {
    // State
    this.params = /* @__PURE__ */ new Map();
    this.buttons = [];
    // Top-bar export / import handlers registered by the sketch. Survive
    // sketch re-runs (re-registering replaces the handler closure).
    this.exports = /* @__PURE__ */ new Map();
    this.imports = /* @__PURE__ */ new Map();
    // Listeners that the host shell (testbench / app frame) subscribes to so
    // it can refresh its Export/Import menus when the sketch registers items.
    this._exportListeners = /* @__PURE__ */ new Set();
    this._importListeners = /* @__PURE__ */ new Set();
    this.logs = [];
    this.infoText = "";
    this.animateFn = null;
    this.frame = 0;
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.disposed = false;
    // Accordion collapse state (persists across panel rebuilds)
    this.collapsedGroups = /* @__PURE__ */ new Set();
    this.activeTab = "";
    this.activeMenu = "";
    // Random state (persists across sketch re-runs)
    this.rng = createRandom();
    // Input state
    this._mouseX = 0;
    this._mouseY = 0;
    this._pmouseX = 0;
    this._pmouseY = 0;
    this._mousePressed = false;
    this._key = "";
    this._keyPressed = false;
    // Input callbacks (set per sketch run)
    this._onMouseClicked = null;
    this._onMouseDragged = null;
    this._onKeyPressed = null;
    this._onKeyReleased = null;
    // Picking + gizmo state
    this._onPick = null;
    this._selectedId = null;
    this._pickEnabled = false;
    this._pickUnsub = null;
    // Drag handle state (persistent across runs)
    this._dragHandles = /* @__PURE__ */ new Map();
    this._dragHandleSeq = 0;
    this._dragHandlesWired = false;
    this._onHandlePick = null;
    // Stored event handlers for cleanup
    this._boundKeyDown = null;
    this._boundKeyUp = null;
    // beginShape state
    this._shapeVerts = [];
    this._shapeMode = "triangles";
    // Continuous re-run mode (set when lab.animate() is called)
    this._continuous = false;
    // Retain mode: animate runs per-frame but sketch only re-runs on param changes
    this._retain = false;
    this.separatorCount = 0;
    this._prevParamFingerprint = "";
    this._panelLogEl = null;
    this._panelInfoEl = null;
    this._lastRerunTime = 0;
    this._rerunTimer = 0;
    this.fn = fn;
    this.config = config;
    this.scene = new Scene();
    if (typeof config.container === "string") {
      this.container = document.querySelector(config.container);
    } else if (config.container) {
      this.container = config.container;
    } else {
      this.container = document.body;
    }
    this.buildDOM();
    this.initRenderer();
    this.wireInput();
    this.runSketch();
    this.startLoop();
  }
  // ── DOM Construction ──
  buildDOM() {
    const defaultWidth = this.config.panelWidth ?? 320;
    const storageKey = `tekto.panelWidth.${this.config.title ?? "default"}`;
    const stored = parseInt(localStorage.getItem(storageKey) ?? "", 10);
    const panelWidth = Number.isFinite(stored) && stored >= 200 && stored <= 800 ? stored : defaultWidth;
    const isDark = this.config.theme !== "light";
    const inShell = this.container instanceof HTMLElement && this.container.dataset.shell != null;
    const showHeader = this.config.showHeader ?? !inShell;
    const headerRow = showHeader ? "44px " : "";
    const root = document.createElement("div");
    root.style.cssText = `
      display:grid; grid-template-columns:${panelWidth}px 1fr; grid-template-rows:${headerRow}1fr;
      height:100%; width:100%; overflow:hidden; position:relative;
      background:${isDark ? "#07080e" : "#f4f5f8"};
      color:${isDark ? "#b8bdd4" : "#2a2d3a"};
      font-family:'IBM Plex Mono',ui-monospace,monospace;
    `;
    if (showHeader) {
      const header = document.createElement("div");
      header.style.cssText = `
        grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
        background:${isDark ? "#0c0d16" : "#fff"};
        border-bottom:1px solid ${isDark ? "#16182a" : "#e0e2ea"};
      `;
      header.innerHTML = `
        <span style="font-weight:600;font-size:14px;color:#38d9a9">
          &#x2B21; ${this.config.title ?? "Tekto Sketch"}
        </span>
        <span style="font-size:9px;padding:2px 6px;border-radius:3px;
          background:rgba(56,217,169,.1);color:#38d9a9">LIVE</span>
      `;
      root.appendChild(header);
    }
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      overflow-y:auto; overflow-x:hidden; padding:0;
      background:${isDark ? "#0c0d16" : "#fff"};
      border-right:1px solid ${isDark ? "#16182a" : "#e0e2ea"};
      position:relative;
    `;
    root.appendChild(this.panelEl);
    const resizeHandle = document.createElement("div");
    resizeHandle.title = "Drag to resize panel \xB7 double-click to reset";
    const handleIdle = isDark ? "rgba(56,217,169,.18)" : "rgba(56,217,169,.28)";
    const handleHover = isDark ? "rgba(56,217,169,.45)" : "rgba(56,217,169,.55)";
    resizeHandle.style.cssText = `
      position:absolute; top:${showHeader ? 44 : 0}px; bottom:0;
      left:${panelWidth - 3}px; width:6px;
      cursor:col-resize; z-index:10;
      background:${handleIdle};
      transition:background .15s;
    `;
    resizeHandle.addEventListener("mouseenter", () => {
      resizeHandle.style.background = handleHover;
    });
    resizeHandle.addEventListener("mouseleave", () => {
      resizeHandle.style.background = handleIdle;
    });
    resizeHandle.addEventListener("dblclick", () => applyWidth(defaultWidth));
    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = parseInt(root.style.gridTemplateColumns, 10) || panelWidth;
      const onMove = (ev) => {
        const next = Math.max(200, Math.min(800, startWidth + (ev.clientX - startX)));
        applyWidth(next);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
      };
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    root.appendChild(resizeHandle);
    let curWidth = panelWidth;
    const applyWidth = (w) => {
      curWidth = w;
      root.style.gridTemplateColumns = `${w}px 1fr`;
      resizeHandle.style.left = `${w - 3}px`;
      collapseBtn.style.left = `${w - 26}px`;
      localStorage.setItem(storageKey, String(w));
    };
    const collapseKey = `tekto.panelCollapsed.${this.config.title ?? "default"}`;
    const btnCss = (left) => `
      position:absolute; top:${(showHeader ? 44 : 0) + 6}px; left:${left}px;
      width:20px; height:24px; z-index:11; cursor:pointer; user-select:none;
      display:flex; align-items:center; justify-content:center;
      font:13px/1 ui-monospace,monospace;
      border:1px solid ${isDark ? "#23263a" : "#d4d7e0"}; border-radius:4px;
      background:${isDark ? "#0c0d16" : "#fff"}; color:#38d9a9;
    `;
    const collapseBtn = document.createElement("div");
    collapseBtn.title = "Collapse panel";
    collapseBtn.textContent = "\u2039";
    collapseBtn.style.cssText = btnCss(panelWidth - 26);
    root.appendChild(collapseBtn);
    const expandBtn = document.createElement("div");
    expandBtn.title = "Show panel";
    expandBtn.textContent = "\u203A";
    expandBtn.style.cssText = btnCss(6);
    expandBtn.style.display = "none";
    root.appendChild(expandBtn);
    const applyCollapsed = (c) => {
      root.style.gridTemplateColumns = c ? "0px 1fr" : `${curWidth}px 1fr`;
      this.panelEl.style.display = c ? "none" : "";
      resizeHandle.style.display = c ? "none" : "";
      collapseBtn.style.display = c ? "none" : "flex";
      collapseBtn.style.left = `${curWidth - 26}px`;
      expandBtn.style.display = c ? "flex" : "none";
      localStorage.setItem(collapseKey, c ? "1" : "0");
    };
    collapseBtn.addEventListener("click", () => applyCollapsed(true));
    expandBtn.addEventListener("click", () => applyCollapsed(false));
    if (localStorage.getItem(collapseKey) === "1") applyCollapsed(true);
    const vpWrap = document.createElement("div");
    vpWrap.style.cssText = "position:relative;overflow:hidden;";
    this.viewportEl = document.createElement("div");
    this.viewportEl.style.cssText = "width:100%;height:100%;";
    vpWrap.appendChild(this.viewportEl);
    this.logEl = document.createElement("div");
    this.logEl.style.cssText = `
      position:absolute; bottom:12px; left:12px;
      padding:8px 12px; border-radius:6px;
      background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
      font-size:11px; line-height:1.7; color:#7a80a0;
      pointer-events:none; max-width:300px;
      border:1px solid rgba(22,24,42,.8);
      display:none;
    `;
    vpWrap.appendChild(this.logEl);
    root.appendChild(vpWrap);
    if (this.container === document.body) {
      this.container.style.margin = "0";
      this.container.style.height = "100vh";
      this.container.style.overflow = "hidden";
    }
    this.container.appendChild(root);
  }
  initRenderer() {
    const zUp = this.config.up === "z";
    this.renderer = new ThreeRenderer(this.scene, this.viewportEl, {
      backgroundColor: this.config.background ?? 460814,
      showGrid: this.config.grid !== false,
      showAxes: this.config.axes !== false,
      cameraPosition: this.config.camera ?? (zUp ? [8, -10, 6] : [5, 6, 8]),
      cameraTarget: this.config.target ?? [0, 0, 0],
      up: this.config.up ?? "y"
    });
  }
  // ── Input Wiring ──
  wireInput() {
    const canvas = this.renderer.renderer.domElement;
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this._pmouseX = this._mouseX;
      this._pmouseY = this._mouseY;
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
      if (this._mousePressed && this._onMouseDragged) {
        this._onMouseDragged();
      }
    });
    canvas.addEventListener("mousedown", () => {
      this._mousePressed = true;
      if (this._onMouseClicked) this._onMouseClicked();
    });
    canvas.addEventListener("mouseup", () => {
      this._mousePressed = false;
    });
    this._boundKeyDown = (e) => {
      this._key = e.key;
      this._keyPressed = true;
      if (this._onKeyPressed) this._onKeyPressed(e.key);
    };
    this._boundKeyUp = (e) => {
      this._key = e.key;
      this._keyPressed = false;
      if (this._onKeyReleased) this._onKeyReleased(e.key);
    };
    window.addEventListener("keydown", this._boundKeyDown);
    window.addEventListener("keyup", this._boundKeyUp);
  }
  // ── Picking + gizmo ──
  enablePicking(enabled) {
    if (enabled === this._pickEnabled) return;
    this._pickEnabled = enabled;
    this.renderer.setPickEnabled(enabled);
    if (enabled) {
      this._pickUnsub = this.renderer.onPick((id) => {
        this.setSelected(id);
        if (this._onPick) this._onPick(id);
        this.runSketch();
      });
    } else {
      this._pickUnsub?.();
      this._pickUnsub = null;
      this.setSelected(null);
    }
  }
  setGizmoMode(mode) {
    this.renderer.setGizmoMode(mode);
  }
  setSelected(id) {
    this._selectedId = id;
    this.renderer.setSelectionHighlight(id);
    if (id) this.renderer.attachGizmo(id);
    else this.renderer.detachGizmo();
    this.scene.clearSelection();
    if (id) this.scene.select(id);
  }
  /** Create or update a drag handle for this sketch run; returns a Reactive<Vec3>. */
  registerDragHandle(initX, initY, initZ, opts) {
    if (!this._dragHandlesWired) {
      this.renderer.setPickEnabled(true);
      this.renderer.setDragHandleCallbacks(
        (name2, x, y, z) => {
          this._dragHandles.set(name2, new Vec3(x, y, z));
          this.runSketch();
        },
        void 0,
        (name2) => {
          if (this._onHandlePick) this._onHandlePick(name2);
          this.runSketch();
        }
      );
      this._dragHandlesWired = true;
    }
    const name = opts?.name ?? `handle_${this._dragHandleSeq++}`;
    if (!this._dragHandles.has(name)) {
      this._dragHandles.set(name, new Vec3(initX, initY, initZ));
    }
    let cur = this._dragHandles.get(name);
    if (opts?.constrain) {
      const [cx, cy, cz] = opts.constrain(cur.x, cur.y, cur.z);
      if (cx !== cur.x || cy !== cur.y || cz !== cur.z) {
        cur = new Vec3(cx, cy, cz);
        this._dragHandles.set(name, cur);
      }
    }
    this.renderer.upsertDragHandle(name, cur.x, cur.y, cur.z, opts?.color, opts?.size, opts?.constrain, opts?.plane);
    return { value: cur };
  }
  setHandleSelected(name) {
    this.renderer.setHandleSelected(name);
  }
  get selectedHandle() {
    return this.renderer.getSelectedHandle();
  }
  get activeDragHandle() {
    return this.renderer.getActiveDragHandle();
  }
  /** Programmatically set a slider's value — updates the stored param AND its live DOM control. */
  setSlider(label, value, group = "") {
    const p = this.params.get(`slider:${group}:${label}`);
    if (!p || p.type !== "slider") return;
    const v = Math.min(p.config.max, Math.max(p.config.min, value));
    p.value = v;
    p._applyValue?.(v);
  }
  // ── Run Sketch ──
  runSketch() {
    this.scene.clear();
    this.buttons = [];
    this.logs = [];
    this.infoText = "";
    this.animateFn = null;
    this._continuous = false;
    this._retain = false;
    this.separatorCount = 0;
    this._onMouseClicked = null;
    this._onMouseDragged = null;
    this._onKeyPressed = null;
    this._onKeyReleased = null;
    this._onPick = null;
    this._onHandlePick = null;
    this._dragHandleSeq = 0;
    this.renderer.beginDragHandleSweep();
    const usedParams = /* @__PURE__ */ new Set();
    const lab = this.buildLab(usedParams);
    try {
      this.fn(lab);
    } catch (e) {
      console.error("Tekto sketch error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }
    this.renderer.endDragHandleSweep();
    for (const key of this.params.keys()) {
      if (!usedParams.has(key)) this.params.delete(key);
    }
    const fingerprint = [...this.params.values()].map((p) => `${p.key}@${p.tab}`).sort().join("|");
    if (fingerprint !== this._prevParamFingerprint) {
      this._prevParamFingerprint = fingerprint;
      this.rebuildPanel();
    }
    this.updateLog();
  }
  buildLab(usedParams) {
    const self = this;
    const now = performance.now();
    const lab = {
      // ── GUI Controls ──
      slider(label, min, max, defaultValue, opts) {
        const key = `slider:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key,
            type: "slider",
            label,
            group: opts?.group ?? "Parameters",
            tab: opts?.tab ?? "",
            menu: opts?.menu ?? "",
            value: defaultValue,
            config: { min, max, step: opts?.step ?? (max - min) / 100, color: opts?.color }
          });
        }
        const p = self.params.get(key);
        return { get value() {
          return p.value;
        } };
      },
      setSlider(label, value, opts) {
        self.setSlider(label, value, opts?.group ?? "");
      },
      toggle(label, defaultValue = false, opts) {
        const key = `toggle:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key,
            type: "toggle",
            label,
            group: opts?.group ?? "Parameters",
            tab: opts?.tab ?? "",
            menu: opts?.menu ?? "",
            value: defaultValue,
            config: {}
          });
        }
        const p = self.params.get(key);
        return { get value() {
          return p.value;
        } };
      },
      select(label, options, defaultValue, opts) {
        const key = `select:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key,
            type: "select",
            label,
            group: opts?.group ?? "Parameters",
            tab: opts?.tab ?? "",
            menu: opts?.menu ?? "",
            value: defaultValue ?? options[0],
            config: { options }
          });
        }
        const p = self.params.get(key);
        return { get value() {
          return p.value;
        } };
      },
      colorPicker(label, defaultValue = "#38d9a9", opts) {
        const key = `color:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key,
            type: "color",
            label,
            group: opts?.group ?? "Display",
            tab: opts?.tab ?? "",
            menu: opts?.menu ?? "",
            value: defaultValue,
            config: {}
          });
        }
        const p = self.params.get(key);
        return { get value() {
          return p.value;
        } };
      },
      layerTree(label, nodes, opts) {
        const key = `layertree:${opts?.group ?? ""}:${label}`;
        usedParams.add(key);
        if (!self.params.has(key)) {
          self.params.set(key, {
            key,
            type: "layertree",
            label,
            group: opts?.group ?? "Layers",
            tab: opts?.tab ?? "",
            menu: "",
            value: {},
            config: { nodes }
          });
        } else {
          self.params.get(key).config.nodes = nodes;
        }
        const p = self.params.get(key);
        return { get value() {
          return p.value;
        } };
      },
      // ── Actions ──
      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions", tab: opts?.tab ?? "", menu: opts?.menu ?? "" });
      },
      separator() {
        self.separatorCount++;
      },
      registerExport(opts) {
        self.exports.set(opts.name, { ...opts });
        for (const l of self._exportListeners) l();
      },
      registerImport(opts) {
        self.imports.set(opts.name, { ...opts });
        for (const l of self._importListeners) l();
      },
      // ── Geometry Builders ──
      mesh(m, style) {
        return self.addMeshHandle(m, style);
      },
      flatMesh(data, style) {
        return self.addFlatMeshHandle(data, style);
      },
      sphere(r = 1, seg = 24, rings = 16) {
        return self.addMeshHandle(MeshFactory.sphere(r, seg, rings));
      },
      box(w = 1, h = 1, d = 1) {
        return self.addMeshHandle(MeshFactory.box(w, h, d));
      },
      torus(R = 1, r = 0.3, seg = 32, sides = 16) {
        return self.addMeshHandle(MeshFactory.torus(R, r, seg, sides));
      },
      cylinder(rt = 1, rb = 1, h = 2, seg = 24) {
        return self.addMeshHandle(MeshFactory.cylinder(rt, rb, h, seg));
      },
      grid(w = 10, d = 10, dx = 24, dz = 24, hfn) {
        return self.addMeshHandle(MeshFactory.grid(w, d, dx, dz, hfn));
      },
      revolve(profile, seg = 32) {
        return self.addMeshHandle(MeshFactory.revolve(profile, seg));
      },
      extrude(polygon, direction) {
        return self.addMeshHandle(MeshFactory.extrude(polygon, direction));
      },
      point(x, y, z) {
        return self.addPointHandle(new Vec3(x, y, z));
      },
      points(positions) {
        return positions.map((p) => self.addPointHandle(p));
      },
      line(x1, y1, z1, x2, y2, z2) {
        return self.addLineHandle(new Vec3(x1, y1, z1), new Vec3(x2, y2, z2));
      },
      polyline(points) {
        return self.addPolylineHandle(points);
      },
      polygon(vertices, style) {
        return self.scene.addPolygon(vertices, style).id;
      },
      circle(cx, cy, cz, radius) {
        return self.scene.addCircle(new Vec3(cx, cy, cz), radius).id;
      },
      // ── Algorithms ──
      algo: Algo,
      MeshGen: MeshFactory,
      // ── Scene Control ──
      clear() {
        self.scene.clear();
      },
      background(c) {
        self.renderer.threeScene.background = new THREE4.Color(c);
      },
      camera(x, y, z) {
        self.renderer.camera.position.set(x, y, z);
      },
      lookAt(x, y, z) {
        self.renderer.camera.lookAt(x, y, z);
        if (self.renderer.controls) {
          self.renderer.controls.target.set(x, y, z);
          self.renderer.controls.update();
        }
      },
      fitAll() {
        self.renderer.fitAll();
      },
      setProjection(type) {
        self.renderer.setProjection(type);
      },
      cameraUp(x, y, z) {
        self.renderer.setCameraUp(x, y, z);
      },
      // ── Info ──
      log(label, value) {
        self.logs.push({ label, value: value != null ? String(value) : "" });
      },
      info(text) {
        self.infoText = text;
      },
      setSunDirection(direction, distance) {
        self.renderer.setSunDirection(direction, distance);
      },
      // ── Math constructors ──
      vec2: (x, y) => new Vec2(x, y),
      vec3: (x, y, z) => new Vec3(x, y, z),
      // ── Processing Constants ──
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      HALF_PI: Math.PI / 2,
      TAU: Math.PI * 2,
      QUARTER_PI: Math.PI / 4,
      // ── Math Helpers ──
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      atan2: Math.atan2,
      abs: Math.abs,
      sqrt: Math.sqrt,
      pow: Math.pow,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      lerp: MathUtils.lerp,
      map: MathUtils.remap,
      constrain: MathUtils.clamp,
      dist(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      },
      rad(degrees) {
        return degrees * MathUtils.DEG2RAD;
      },
      deg(radians) {
        return radians * MathUtils.RAD2DEG;
      },
      // ── Noise & Random ──
      noise(x, y, z) {
        return noise(x, y ?? 0, z ?? 0);
      },
      random(min, max) {
        return self.rng.random(min, max);
      },
      randomSeed(seed) {
        self.rng.randomSeed(seed);
      },
      // ── Color Utility ──
      rgb(r, g, b) {
        if (g === void 0) {
          const v = Math.round(MathUtils.clamp(r, 0, 255));
          return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
        }
        const rr = Math.round(MathUtils.clamp(r, 0, 255));
        const gg = Math.round(MathUtils.clamp(g, 0, 255));
        const bb = Math.round(MathUtils.clamp(b ?? 0, 0, 255));
        return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
      },
      // ── Mouse & Keyboard Input ──
      get mouseX() {
        return self._mouseX;
      },
      get mouseY() {
        return self._mouseY;
      },
      get pmouseX() {
        return self._pmouseX;
      },
      get pmouseY() {
        return self._pmouseY;
      },
      get mousePressed() {
        return self._mousePressed;
      },
      get key() {
        return self._key;
      },
      get keyPressed() {
        return self._keyPressed;
      },
      onMouseClicked(fn) {
        self._onMouseClicked = fn;
      },
      onMouseDragged(fn) {
        self._onMouseDragged = fn;
      },
      onKeyPressed(fn) {
        self._onKeyPressed = fn;
      },
      onKeyReleased(fn) {
        self._onKeyReleased = fn;
      },
      // ── Viewport / overlays ──
      get viewport() {
        return self.viewportEl;
      },
      worldToScreen(x, y, z) {
        return self.renderer.worldToScreen(new Vec3(x, y, z));
      },
      invalidate() {
        self.runSketch();
      },
      // ── Picking + transform gizmo ──
      enablePicking(enabled = true) {
        self.enablePicking(enabled);
      },
      onPick(fn) {
        self._onPick = fn;
      },
      setGizmoMode(mode) {
        self.setGizmoMode(mode);
      },
      setSelected(id) {
        self.setSelected(id);
      },
      get selectedId() {
        return self._selectedId;
      },
      // ── Drag handles ──
      dragHandle(x, y, z, opts) {
        return self.registerDragHandle(x, y, z, opts);
      },
      onHandlePick(fn) {
        self._onHandlePick = fn;
      },
      setHandleSelected(name) {
        self.setHandleSelected(name);
      },
      get selectedHandle() {
        return self.selectedHandle;
      },
      get activeDragHandle() {
        return self.activeDragHandle;
      },
      // ── beginShape/endShape ──
      beginShape(mode = "triangles") {
        self._shapeVerts = [];
        self._shapeMode = mode;
      },
      vertex(x, y, z) {
        self._shapeVerts.push(new Vec3(x, y, z));
      },
      hQuad(ax, ay, bx, by, cx, cy, dx, dy, z) {
        const v = self._shapeVerts;
        v.push(new Vec3(ax, ay, z), new Vec3(bx, by, z), new Vec3(cx, cy, z), new Vec3(dx, dy, z));
      },
      vQuad(ax, ay, bx, by, zTop, zBot) {
        const v = self._shapeVerts;
        v.push(new Vec3(ax, ay, zTop), new Vec3(bx, by, zTop), new Vec3(bx, by, zBot), new Vec3(ax, ay, zBot));
      },
      endShape(close = false) {
        const verts = self._shapeVerts;
        if (verts.length < 2) return null;
        const mode = self._shapeMode;
        if (mode === "lines" || mode === "line_strip") {
          const handles = [];
          if (mode === "lines") {
            for (let i = 0; i + 1 < verts.length; i += 2) {
              handles.push(self.addLineHandle(verts[i], verts[i + 1]));
            }
          } else {
            for (let i = 0; i < verts.length - 1; i++) {
              handles.push(self.addLineHandle(verts[i], verts[i + 1]));
            }
            if (close && verts.length >= 3) {
              handles.push(self.addLineHandle(verts[verts.length - 1], verts[0]));
            }
          }
          self._shapeVerts = [];
          if (handles.length === 0) return null;
          const compound = {
            get id() {
              return handles[0].id;
            },
            color(c) {
              for (const h of handles) h.color(c);
              return compound;
            },
            opacity(o) {
              for (const h of handles) h.opacity(o);
              return compound;
            },
            radius(r) {
              for (const h of handles) h.radius(r);
              return compound;
            },
            layer(name) {
              for (const h of handles) h.layer(name);
              return compound;
            },
            dashed(size, gap) {
              for (const h of handles) h.dashed(size, gap);
              return compound;
            }
          };
          return compound;
        }
        const mesh = new ConnectedMesh();
        const nodeIds = verts.map((v) => mesh.addNode(v));
        if (mode === "triangles") {
          for (let i = 0; i + 2 < nodeIds.length; i += 3) {
            mesh.addTriangle(nodeIds[i], nodeIds[i + 1], nodeIds[i + 2]);
          }
        } else if (mode === "quads") {
          for (let i = 0; i + 3 < nodeIds.length; i += 4) {
            mesh.addQuad(nodeIds[i], nodeIds[i + 1], nodeIds[i + 2], nodeIds[i + 3]);
          }
        }
        mesh.computeVertexNormals();
        self._shapeVerts = [];
        return self.addMeshHandle(mesh);
      },
      // ── Time ──
      get frame() {
        return self.frame;
      },
      get time() {
        return (now - self.startTime) / 1e3;
      },
      get dt() {
        return (now - self.lastTime) / 1e3;
      },
      // ── Animation ──
      animate(fn, opts) {
        self.animateFn = fn;
        self._continuous = true;
        if (opts?.retain) self._retain = true;
      },
      // ── Scene Access ──
      getScene() {
        return self.scene;
      }
    };
    return lab;
  }
  // ── Handle Factories ──
  addMeshHandle(mesh, style) {
    const obj = this.scene.addMesh(mesh, style);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      get mesh() {
        return mesh;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      wireframe(w = true) {
        self.scene.setStyle(obj.id, { wireframe: w });
        return handle;
      },
      visible(v = true) {
        self.scene.setStyle(obj.id, { visible: v });
        return handle;
      },
      label(l) {
        self.scene.setStyle(obj.id, { label: l });
        return handle;
      },
      doubleSided(d = true) {
        self.scene.setStyle(obj.id, { doubleSided: d });
        return handle;
      },
      backfaceColor(c) {
        self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c });
        return handle;
      },
      groupColor(_name, _color) {
        return handle;
      },
      noExport(v = true) {
        self.scene.setStyle(obj.id, { noExport: v });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      translate(x, y, z) {
        for (const n of mesh.nodes()) {
          n.position = n.position.add(new Vec3(x, y, z));
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      scale(s) {
        for (const n of mesh.nodes()) {
          n.position = n.position.mul(s);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      rotateX(rad2) {
        const c = Math.cos(rad2), s = Math.sin(rad2);
        for (const n of mesh.nodes()) {
          const p = n.position;
          n.position = new Vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      rotateY(rad2) {
        const c = Math.cos(rad2), s = Math.sin(rad2);
        for (const n of mesh.nodes()) {
          const p = n.position;
          n.position = new Vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      rotateZ(rad2) {
        const c = Math.cos(rad2), s = Math.sin(rad2);
        for (const n of mesh.nodes()) {
          const p = n.position;
          n.position = new Vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
        }
        mesh.computeVertexNormals();
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      subdivide(iterations = 1) {
        let m = mesh;
        for (let i = 0; i < iterations; i++) m = MeshFactory.subdivide(m);
        self.scene.remove(obj.id);
        return self.addMeshHandle(m, obj.style);
      },
      smooth(iterations = 1, factor = 0.5) {
        Algo.laplacianSmooth(mesh, iterations, factor);
        self.scene.update(obj.id, { mesh });
        return handle;
      },
      volume() {
        return Algo.meshVolume(mesh);
      },
      surfaceArea() {
        return Algo.meshSurfaceArea(mesh);
      },
      nodeCount() {
        return mesh.nodeCount;
      },
      faceCount() {
        return mesh.faceCount;
      },
      edgeCount() {
        return mesh.edgeCount;
      }
    };
    return handle;
  }
  addFlatMeshHandle(data, style) {
    const obj = this.scene.addFlatMesh(data, style);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      get mesh() {
        return null;
      },
      // no ConnectedMesh backing
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      wireframe(w = true) {
        self.scene.setStyle(obj.id, { wireframe: w });
        return handle;
      },
      visible(v = true) {
        self.scene.setStyle(obj.id, { visible: v });
        return handle;
      },
      label(l) {
        self.scene.setStyle(obj.id, { label: l });
        return handle;
      },
      doubleSided(d = true) {
        self.scene.setStyle(obj.id, { doubleSided: d });
        return handle;
      },
      backfaceColor(c) {
        self.scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c });
        return handle;
      },
      groupColor(name, color) {
        const existing = self.scene.get(obj.id)?.style.groupColors ?? {};
        self.scene.setStyle(obj.id, { groupColors: { ...existing, [name]: color } });
        return handle;
      },
      noExport(v = true) {
        self.scene.setStyle(obj.id, { noExport: v });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      translate() {
        return handle;
      },
      scale() {
        return handle;
      },
      rotateX() {
        return handle;
      },
      rotateY() {
        return handle;
      },
      rotateZ() {
        return handle;
      },
      subdivide() {
        return handle;
      },
      smooth() {
        return handle;
      },
      volume() {
        return 0;
      },
      surfaceArea() {
        return 0;
      },
      nodeCount() {
        return data.positions.length / 3;
      },
      faceCount() {
        return data.indices.length / 3;
      },
      edgeCount() {
        return 0;
      }
    };
    return handle;
  }
  addPointHandle(pos) {
    const obj = this.scene.addPoint(pos);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      size(s) {
        self.scene.setStyle(obj.id, { pointSize: s });
        return handle;
      },
      label(l) {
        self.scene.setStyle(obj.id, { label: l });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      moveTo(x, y, z) {
        self.scene.update(obj.id, { position: new Vec3(x, y, z) });
        return handle;
      },
      position() {
        return self.scene.get(obj.id)?.position ?? pos;
      }
    };
    return handle;
  }
  addLineHandle(a, b) {
    const obj = this.scene.addSegment(a, b);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      radius(r) {
        self.scene.setStyle(obj.id, { tubeRadius: r });
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      dashed(size, gap) {
        self.scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } });
        return handle;
      }
    };
    return handle;
  }
  addPolylineHandle(points) {
    const obj = this.scene.addPolyline(points);
    const self = this;
    const handle = {
      get id() {
        return obj.id;
      },
      color(c) {
        self.scene.setStyle(obj.id, { color: c });
        return handle;
      },
      opacity(o) {
        self.scene.setStyle(obj.id, { opacity: o });
        return handle;
      },
      // tubeRadius has no effect on the buffered Line — kept for API parity.
      radius(_r) {
        return handle;
      },
      layer(name) {
        self.scene.setStyle(obj.id, { layer: name });
        return handle;
      },
      dashed(size, gap) {
        self.scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } });
        return handle;
      }
    };
    return handle;
  }
  // ── Panel Rendering ──
  rebuildPanel() {
    this._panelLogEl = null;
    this._panelInfoEl = null;
    const isDark = this.config.theme !== "light";
    const border = isDark ? "#16182a" : "#e0e2ea";
    const dimColor = isDark ? "#5a6080" : "#8a8fa0";
    const textColor = isDark ? "#7a80a0" : "#4a4f60";
    const accentColor = "#ffffff";
    const hoverBg = "rgba(56,217,169,.08)";
    this.panelEl.innerHTML = "";
    const menuNames = [];
    const menuParams = /* @__PURE__ */ new Map();
    const menuButtons = /* @__PURE__ */ new Map();
    for (const p of this.params.values()) {
      if (!p.menu) continue;
      if (!menuNames.includes(p.menu)) menuNames.push(p.menu);
      if (!menuParams.has(p.menu)) menuParams.set(p.menu, []);
      menuParams.get(p.menu).push(p);
    }
    for (const b of this.buttons) {
      if (!b.menu) continue;
      if (!menuNames.includes(b.menu)) menuNames.push(b.menu);
      if (!menuButtons.has(b.menu)) menuButtons.set(b.menu, []);
      menuButtons.get(b.menu).push(b);
    }
    const tabOrder = [];
    for (const p of this.params.values()) {
      if (p.tab && !tabOrder.includes(p.tab)) tabOrder.push(p.tab);
    }
    for (const b of this.buttons) {
      if (b.tab && !tabOrder.includes(b.tab)) tabOrder.push(b.tab);
    }
    if (tabOrder.length > 0 && this.logs.length > 0 && !tabOrder.includes("Info")) {
      tabOrder.push("Info");
    }
    const hasTabs = tabOrder.length > 1;
    if (hasTabs && (!this.activeTab || !tabOrder.includes(this.activeTab))) {
      this.activeTab = tabOrder[0];
    }
    if (menuNames.length > 0) {
      const menuBar = document.createElement("div");
      menuBar.style.cssText = `
        display:flex;border-bottom:1px solid ${border};flex-shrink:0;position:relative;
      `;
      for (const menuName of menuNames) {
        const menuBtn = document.createElement("button");
        menuBtn.textContent = menuName + " \u25BE";
        menuBtn.style.cssText = `
          padding:8px 10px;border:none;background:transparent;
          color:${dimColor};font-family:inherit;font-size:9px;font-weight:500;
          text-transform:uppercase;letter-spacing:1.2px;cursor:pointer;transition:color .12s;
        `;
        menuBtn.addEventListener("mouseenter", () => {
          menuBtn.style.color = accentColor;
        });
        menuBtn.addEventListener("mouseleave", () => {
          menuBtn.style.color = this.activeMenu === menuName ? accentColor : dimColor;
        });
        const dropdown = document.createElement("div");
        dropdown.style.cssText = `
          display:none;position:absolute;top:100%;left:0;z-index:100;
          min-width:160px;background:${isDark ? "#0d0f1e" : "#f5f6fa"};
          border:1px solid ${border};border-radius:4px;padding:4px 0;
          box-shadow:0 4px 16px rgba(0,0,0,.4);
        `;
        const params = menuParams.get(menuName) ?? [];
        const btns = menuButtons.get(menuName) ?? [];
        for (const p of params) {
          if (p.type === "toggle") {
            const row = document.createElement("div");
            row.style.cssText = `
              display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;
              font-size:11px;color:${textColor};transition:background .1s;
            `;
            const check = document.createElement("span");
            check.textContent = p.value ? "\u2713" : " ";
            check.style.cssText = `width:12px;text-align:center;color:${accentColor};font-size:10px;`;
            const lbl = document.createElement("span");
            lbl.textContent = p.label;
            row.appendChild(check);
            row.appendChild(lbl);
            row.addEventListener("mouseenter", () => {
              row.style.background = hoverBg;
            });
            row.addEventListener("mouseleave", () => {
              row.style.background = "transparent";
            });
            row.addEventListener("click", (e) => {
              e.stopPropagation();
              p.value = !p.value;
              check.textContent = p.value ? "\u2713" : " ";
              this.runSketch();
            });
            dropdown.appendChild(row);
          }
        }
        if (params.length > 0 && btns.length > 0) {
          const sep = document.createElement("div");
          sep.style.cssText = `border-top:1px solid ${border};margin:4px 0;`;
          dropdown.appendChild(sep);
        }
        for (const b of btns) {
          const row = document.createElement("div");
          row.style.cssText = `
            padding:7px 12px;cursor:pointer;font-size:11px;
            color:${textColor};transition:background .1s;
          `;
          row.textContent = b.label;
          row.addEventListener("mouseenter", () => {
            row.style.background = hoverBg;
            row.style.color = accentColor;
          });
          row.addEventListener("mouseleave", () => {
            row.style.background = "transparent";
            row.style.color = textColor;
          });
          const btnLabel = b.label, btnMenu = b.menu;
          row.addEventListener("click", () => {
            this.activeMenu = "";
            dropdown.style.display = "none";
            const current = this.buttons.find((cb) => cb.label === btnLabel && cb.menu === btnMenu);
            current?.action();
            this.runSketch();
          });
          dropdown.appendChild(row);
        }
        menuBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isOpen = this.activeMenu === menuName;
          menuBar.querySelectorAll(".menu-dropdown").forEach((d) => {
            d.style.display = "none";
          });
          this.activeMenu = isOpen ? "" : menuName;
          if (!isOpen) dropdown.style.display = "block";
          menuBtn.style.color = isOpen ? dimColor : accentColor;
        });
        dropdown.classList.add("menu-dropdown");
        menuBar.appendChild(menuBtn);
        menuBar.appendChild(dropdown);
      }
      document.addEventListener("click", () => {
        this.activeMenu = "";
        menuBar.querySelectorAll(".menu-dropdown").forEach((d) => {
          d.style.display = "none";
        });
      }, { once: false, capture: false });
      this.panelEl.appendChild(menuBar);
    }
    if (hasTabs) {
      const tabBar = document.createElement("div");
      tabBar.style.cssText = `display:flex;border-bottom:1px solid ${border};flex-shrink:0;`;
      for (const tab of tabOrder) {
        const btn = document.createElement("button");
        btn.textContent = tab;
        const isActive = tab === this.activeTab;
        btn.style.cssText = `
          flex:1;padding:9px 4px;border:none;
          border-bottom:2px solid ${isActive ? accentColor : "transparent"};
          background:transparent;color:${isActive ? accentColor : dimColor};
          font-family:inherit;font-size:9px;font-weight:500;text-transform:uppercase;
          letter-spacing:1.2px;cursor:pointer;transition:all .12s;
        `;
        btn.addEventListener("click", () => {
          this.activeTab = tab;
          this.rebuildPanel();
        });
        tabBar.appendChild(btn);
      }
      this.panelEl.appendChild(tabBar);
    }
    if (hasTabs && this.activeTab === "Info") {
      this._panelLogEl = document.createElement("div");
      this._panelLogEl.style.cssText = `padding:12px 14px;font-size:11px;color:${textColor};line-height:1.9;`;
      this.panelEl.appendChild(this._panelLogEl);
      this.updateLog();
      return;
    }
    const activeTabFilter = (tab, menu) => menu === "" && (!hasTabs || tab === this.activeTab || tab === "");
    const groups = /* @__PURE__ */ new Map();
    for (const p of this.params.values()) {
      if (!activeTabFilter(p.tab, p.menu)) continue;
      if (!groups.has(p.group)) groups.set(p.group, []);
      groups.get(p.group).push(p);
    }
    const buttonGroups = /* @__PURE__ */ new Map();
    for (const b of this.buttons) {
      if (!activeTabFilter(b.tab, b.menu)) continue;
      if (!buttonGroups.has(b.group)) buttonGroups.set(b.group, []);
      buttonGroups.get(b.group).push(b);
    }
    const allGroupNames = /* @__PURE__ */ new Set([...groups.keys(), ...buttonGroups.keys()]);
    for (const groupName of allGroupNames) {
      const section = document.createElement("div");
      section.style.cssText = `border-bottom:1px solid ${border};`;
      const collapsed = this.collapsedGroups.has(groupName);
      const header = document.createElement("div");
      header.style.cssText = `
        padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:6px;
        user-select:none;transition:background .1s;
      `;
      header.addEventListener("mouseenter", () => {
        header.style.background = "rgba(56,217,169,.04)";
      });
      header.addEventListener("mouseleave", () => {
        header.style.background = "transparent";
      });
      const arrow = document.createElement("span");
      arrow.style.cssText = `font-size:8px;color:${dimColor};transition:transform .15s;width:10px;`;
      arrow.textContent = collapsed ? "\u25B6" : "\u25BC";
      header.appendChild(arrow);
      const title = document.createElement("span");
      title.style.cssText = `font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:1.8px;color:${dimColor};`;
      title.textContent = groupName;
      header.appendChild(title);
      section.appendChild(header);
      const content = document.createElement("div");
      content.style.cssText = `padding:0 14px 10px;${collapsed ? "display:none;" : ""}`;
      const params = groups.get(groupName) ?? [];
      for (const p of params) content.appendChild(this.renderParam(p, isDark));
      const btns = buttonGroups.get(groupName) ?? [];
      for (const b of btns) {
        const row = document.createElement("div");
        row.style.cssText = "margin-bottom:4px;";
        const btn = document.createElement("button");
        btn.textContent = b.label;
        btn.style.cssText = `
          width:100%;padding:7px 10px;border:1px solid ${border};border-radius:5px;
          background:transparent;color:${textColor};font-family:inherit;font-size:10px;
          cursor:pointer;transition:all .12s;
        `;
        btn.addEventListener("mouseenter", () => {
          btn.style.background = hoverBg;
          btn.style.borderColor = accentColor;
          btn.style.color = accentColor;
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background = "transparent";
          btn.style.borderColor = border;
          btn.style.color = textColor;
        });
        btn.addEventListener("click", () => {
          b.action();
          this.runSketch();
        });
        row.appendChild(btn);
        content.appendChild(row);
      }
      section.appendChild(content);
      header.addEventListener("click", () => {
        if (this.collapsedGroups.has(groupName)) {
          this.collapsedGroups.delete(groupName);
          content.style.display = "";
          arrow.textContent = "\u25BC";
        } else {
          this.collapsedGroups.add(groupName);
          content.style.display = "none";
          arrow.textContent = "\u25B6";
        }
      });
      this.panelEl.appendChild(section);
    }
    {
      const section = document.createElement("div");
      section.style.cssText = `padding:12px 14px;border-bottom:1px solid ${border};font-size:11px;color:${textColor};line-height:1.7;white-space:pre-wrap;`;
      section.textContent = this.infoText;
      section.style.display = this.infoText ? "block" : "none";
      this.panelEl.appendChild(section);
      this._panelInfoEl = section;
    }
    if (!hasTabs) {
      this._panelLogEl = document.createElement("div");
      this._panelLogEl.style.cssText = `padding:10px 14px;border-bottom:1px solid ${border};display:none;`;
      this.panelEl.appendChild(this._panelLogEl);
    }
  }
  renderParam(p, isDark) {
    if (p.type === "layertree") {
      if (!p._layerPanel) {
        p._layerPanel = new LayerPanel({
          nodes: p.config.nodes,
          value: p.value,
          isDark,
          onChange: (updates) => {
            p.value = { ...p.value, ...updates };
            this.runSketch();
          }
        });
      } else {
        p._layerPanel.update(p.config.nodes, p.value);
      }
      const wrap = document.createElement("div");
      wrap.style.cssText = "margin:0 -14px;";
      wrap.appendChild(p._layerPanel.el);
      return wrap;
    }
    const border = isDark ? "#1e2140" : "#d0d3de";
    const dimColor = isDark ? "#7a80a0" : "#6a6f80";
    const accentColor = "#ffffff";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:5px;min-height:26px;";
    const label = document.createElement("span");
    label.style.cssText = `width:80px;flex-shrink:0;font-size:11px;color:${dimColor};text-transform:capitalize;`;
    label.textContent = p.label;
    row.appendChild(label);
    switch (p.type) {
      case "slider": {
        const input = document.createElement("input");
        input.type = "range";
        input.min = String(p.config.min);
        input.max = String(p.config.max);
        input.step = String(p.config.step);
        input.value = String(p.value);
        input.style.cssText = `
          flex:1;height:3px;-webkit-appearance:none;appearance:none;
          background:${border};border-radius:2px;outline:none;cursor:pointer;
          accent-color:${p.config.color || accentColor};
        `;
        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `width:42px;text-align:right;font-size:10px;color:${accentColor};`;
        const isInt = p.config.step >= 1;
        const rawDec = isInt ? 0 : Math.max(2, -Math.floor(Math.log10(p.config.step) - 1e-3));
        const decimals = Math.min(Math.max(0, rawDec), 20);
        const fmt = (v) => isInt ? String(v) : v.toFixed(decimals);
        valueSpan.textContent = fmt(p.value);
        input.addEventListener("input", () => {
          const v = parseFloat(input.value);
          p.value = v;
          valueSpan.textContent = fmt(v);
          this.scheduleRerun();
        });
        input.addEventListener("change", () => {
          if (this._rerunTimer) {
            clearTimeout(this._rerunTimer);
            this._rerunTimer = 0;
          }
          this.runSketch();
        });
        p._applyValue = (v) => {
          input.value = String(v);
          valueSpan.textContent = fmt(v);
        };
        row.appendChild(input);
        row.appendChild(valueSpan);
        break;
      }
      case "toggle": {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = p.value;
        input.style.cssText = `accent-color:${accentColor};cursor:pointer;width:14px;height:14px;`;
        input.addEventListener("change", () => {
          p.value = input.checked;
          this.runSketch();
        });
        row.appendChild(input);
        break;
      }
      case "select": {
        const select = document.createElement("select");
        select.style.cssText = `
          flex:1;padding:4px 8px;background:${isDark ? "#07080e" : "#f4f5f8"};
          border:1px solid ${border};border-radius:4px;color:inherit;
          font-family:inherit;font-size:11px;outline:none;cursor:pointer;
        `;
        for (const opt of p.config.options) {
          const el = document.createElement("option");
          el.value = opt;
          el.textContent = opt;
          if (opt === p.value) el.selected = true;
          select.appendChild(el);
        }
        select.addEventListener("change", () => {
          p.value = select.value;
          this.runSketch();
        });
        row.appendChild(select);
        break;
      }
      case "color": {
        const input = document.createElement("input");
        input.type = "color";
        input.value = p.value;
        input.style.cssText = `width:32px;height:24px;border:1px solid ${border};border-radius:4px;padding:0;cursor:pointer;background:none;`;
        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `font-size:10px;color:${dimColor};`;
        valueSpan.textContent = p.value;
        input.addEventListener("input", () => {
          p.value = input.value;
          valueSpan.textContent = input.value;
          this.runSketch();
        });
        row.appendChild(input);
        row.appendChild(valueSpan);
        break;
      }
    }
    return row;
  }
  // ── Log Display ──
  updateLog() {
    if (this.logs.length > 0) {
      this.logEl.innerHTML = this.logs.map((l) => `<span style="color:#5a5e7a">${l.label}</span>${l.value ? ` <span style="color:#fff">${l.value}</span>` : ""}`).join("<br>");
      this.logEl.style.display = "block";
    } else {
      this.logEl.style.display = "none";
    }
    if (this._panelInfoEl) {
      this._panelInfoEl.textContent = this.infoText;
      this._panelInfoEl.style.display = this.infoText ? "block" : "none";
    }
    if (this._panelLogEl) {
      if (this.logs.length > 0) {
        this._panelLogEl.innerHTML = this.logs.map((l) => `<div style="font-size:10px;line-height:1.7;"><span style="color:#7a80a0">${l.label}</span>${l.value ? ` <span style="color:#fff">${l.value}</span>` : ""}</div>`).join("");
        this._panelLogEl.style.display = "block";
      } else {
        this._panelLogEl.style.display = "none";
      }
    }
  }
  // ── Render Loop ──
  startLoop() {
    const loop = () => {
      if (this.disposed) return;
      this.frame++;
      const now = performance.now();
      const dt = (now - this.lastTime) / 1e3;
      this.lastTime = now;
      if (this._continuous && !this._retain) {
        this.runSketch();
      }
      if (this.animateFn) {
        this.animateFn((now - this.startTime) / 1e3, dt);
      }
      this.renderer.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
  // ── Public Methods ──
  /** Throttled sketch re-run — at most once per 50ms so the browser stays responsive during slider drag. */
  scheduleRerun() {
    if (this._rerunTimer) return;
    const elapsed = performance.now() - this._lastRerunTime;
    const delay = Math.max(0, 50 - elapsed);
    this._rerunTimer = window.setTimeout(() => {
      this._rerunTimer = 0;
      this._lastRerunTime = performance.now();
      this.runSketch();
    }, delay);
  }
  /** Force re-run the sketch */
  rerun() {
    this.runSketch();
  }
  /** Change the scene render mode (solid / wireframe / hiddenline). */
  setRenderMode(mode) {
    this.scene.setRenderMode(mode);
  }
  /**
   * Switch shading preset. `"studio"` enables PBR materials, sun-style
   * shadows, and ACES tonemapping; `"flat"` is the lightweight default.
   * See `LightingMode` in `src/scene/Scene.ts` for the trade-offs.
   */
  setLightingMode(mode) {
    this.scene.setLightingMode(mode);
  }
  /**
   * Toggle a procedural environment map for image-based reflections. Only
   * visibly affects `"studio"` PBR materials (it modulates their specular
   * highlights / reflections); harmless in `"flat"` mode.
   */
  setEnvironment(enabled) {
    this.scene.setEnvironment(enabled);
  }
  /**
   * Set an equirectangular source texture (e.g. an HDR loaded via RGBELoader)
   * for the environment map. Pass null for the built-in procedural gradient.
   */
  setEnvironmentSource(equirect) {
    this.renderer.setEnvironmentSource(equirect);
  }
  /** Show the environment source (e.g. the HDR) as the visible sky backdrop. */
  setEnvironmentBackground(visible) {
    this.renderer.setEnvironmentBackground(visible);
  }
  /** Rotate the environment + background (Euler radians); aligns a Y-up HDRI to Z-up. */
  setEnvironmentRotation(x, y, z) {
    this.renderer.setEnvironmentRotation(x, y, z);
  }
  /**
   * Add a raw THREE.Object3D (e.g. a glTF/GLB scene loaded with GLTFLoader) to
   * the scene, kept across sketch re-runs. Re-adding the same id replaces it.
   */
  addExternalObject(obj, id) {
    this.renderer.addExternalObject(obj, id);
  }
  removeExternalObject(id) {
    this.renderer.removeExternalObject(id);
  }
  /**
   * Studio-mode default PBR material for meshes that don't set their own
   * metalness/roughness in their VisualStyle. metalness 0..1 (1 = metal),
   * roughness 0..1 (0 = mirror). Applies on the next sketch re-run.
   */
  setStudioMaterial(metalness, roughness, color = null, flatShading = false) {
    this.renderer.setStudioMaterial(metalness, roughness, color, flatShading);
  }
  /**
   * Show/hide line + point "helper" objects (axes, construction lines, markers,
   * labels) while keeping solid meshes — e.g. for a clean render view.
   */
  setHelpersVisible(visible) {
    this.renderer.setHelpersVisible(visible);
  }
  /**
   * Show/hide tekto's studio shadow-catcher plane at the origin. Hide it when
   * your sketch provides its own ground to receive shadows.
   */
  setShadowGroundVisible(visible) {
    this.renderer.setShadowGroundVisible(visible);
  }
  /**
   * Aim the main directional light from outside the sketch fn — used
   * by host shells (testbench, custom apps) to push a sun position
   * computed from their own date/location UI. Inside a sketch, prefer
   * `lab.setSunDirection(direction)`.
   */
  setSunDirection(direction, distance) {
    this.renderer.setSunDirection(direction, distance);
  }
  /**
   * Read the sketch's registered export entries (via `lab.registerExport`).
   * Returns a fresh snapshot — safe to iterate without holding a reference
   * to the underlying Map.
   */
  getExports() {
    return Array.from(this.exports.values());
  }
  getImports() {
    return Array.from(this.imports.values());
  }
  /**
   * Subscribe to export/import registration changes. The shell (testbench
   * top bar, app frame) uses this to re-render its menus when the sketch
   * adds or replaces entries between re-runs.
   */
  onExportsChange(fn) {
    this._exportListeners.add(fn);
    return () => this._exportListeners.delete(fn);
  }
  onImportsChange(fn) {
    this._importListeners.add(fn);
    return () => this._importListeners.delete(fn);
  }
  /** Destroy the sketch and clean up */
  dispose() {
    this.disposed = true;
    if (this._boundKeyDown) window.removeEventListener("keydown", this._boundKeyDown);
    if (this._boundKeyUp) window.removeEventListener("keyup", this._boundKeyUp);
    this._boundKeyDown = null;
    this._boundKeyUp = null;
    this.renderer.dispose();
  }
};

// src/sketch/Sketch2D.ts
function sketch2d(fn, config) {
  return new Sketch2DInstance(fn, config ?? {});
}
var Sketch2DInstance = class {
  constructor(fn, config) {
    this.params = /* @__PURE__ */ new Map();
    this.buttons = [];
    this.logs = [];
    this.drawFn = null;
    this.animateFn = null;
    this.pointerDownFns = [];
    this.pointerMoveFns = [];
    this.pointerUpFns = [];
    this.continuous = false;
    this._prevFingerprint = "";
    this.rng = createRandom();
    this.disposed = false;
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.rerunTimer = 0;
    // Input state
    this._mouseX = 0;
    this._mouseY = 0;
    this._mousePressed = false;
    this.fn = fn;
    this.config = config;
    if (typeof config.container === "string") {
      this.container = document.querySelector(config.container);
    } else if (config.container) {
      this.container = config.container;
    } else {
      this.container = document.body;
    }
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.buildDOM();
    this.wireInput();
    this.runSketch();
    this.startLoop();
  }
  // ── DOM ──
  get isDark() {
    return this.config.theme !== "light";
  }
  buildDOM() {
    const pw = this.config.panelWidth ?? 280;
    const dk = this.isDark;
    const bg = dk ? "#07080e" : "#f4f5f8";
    const panelBg = dk ? "#0c0d16" : "#fff";
    const border = dk ? "#16182a" : "#e0e2ea";
    const textColor = dk ? "#b8bdd4" : "#2a2d3a";
    const root = document.createElement("div");
    root.style.cssText = `
      display:grid; grid-template-columns:${pw}px 1fr; grid-template-rows:44px 1fr;
      height:100%; width:100%; overflow:hidden; position:relative;
      background:${bg}; color:${textColor};
      font-family:'IBM Plex Mono',ui-monospace,monospace;
    `;
    const header = document.createElement("div");
    header.style.cssText = `
      grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
      background:${panelBg}; border-bottom:1px solid ${border};
    `;
    header.innerHTML = `
      <span style="font-weight:600;font-size:14px;
        background:linear-gradient(135deg,#38d9a9,#4dabf7);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent">
        &#x2B21; ${this.config.title ?? "Tekto Sketch2D"}
      </span>
      <span style="font-size:9px;padding:2px 6px;border-radius:3px;
        background:rgba(56,217,169,.1);color:#38d9a9">2D</span>
    `;
    root.appendChild(header);
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      grid-column:1; grid-row:2; overflow-y:auto; overflow-x:hidden; padding:0;
      background:${panelBg}; border-right:1px solid ${border};
    `;
    root.appendChild(this.panelEl);
    const collapseKey = "tekto.sketch2d.collapsed";
    let collapsed = false;
    try {
      collapsed = localStorage.getItem(collapseKey) === "1";
    } catch {
    }
    const toggleBtn = document.createElement("button");
    toggleBtn.style.cssText = `
      margin-left:auto; cursor:pointer; width:28px; height:26px; border-radius:6px;
      border:1px solid ${border}; background:transparent; color:${textColor};
      font-size:15px; line-height:1; padding:0; flex:none;
    `;
    const applyCollapse = () => {
      root.style.gridTemplateColumns = collapsed ? "0 1fr" : `${pw}px 1fr`;
      this.panelEl.style.display = collapsed ? "none" : "";
      toggleBtn.textContent = collapsed ? "\u203A" : "\u2039";
      toggleBtn.title = collapsed ? "Show controls" : "Hide controls";
    };
    toggleBtn.addEventListener("click", () => {
      collapsed = !collapsed;
      try {
        localStorage.setItem(collapseKey, collapsed ? "1" : "0");
      } catch {
      }
      applyCollapse();
      this.resizeCanvas();
    });
    header.appendChild(toggleBtn);
    const vpWrap = document.createElement("div");
    vpWrap.style.cssText = "grid-column:2;grid-row:2;position:relative;overflow:hidden;";
    this.canvas.style.cssText = `
      width:100%; height:100%; display:block;
      background:${this.config.background ?? (dk ? "#0a0a10" : "#ffffff")};
    `;
    vpWrap.appendChild(this.canvas);
    this.logEl = document.createElement("div");
    this.logEl.style.cssText = `
      position:absolute; bottom:12px; left:12px;
      padding:8px 12px; border-radius:6px;
      background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
      font-size:11px; line-height:1.7; color:#7a80a0;
      pointer-events:none; max-width:300px;
      border:1px solid rgba(22,24,42,.8); display:none;
    `;
    vpWrap.appendChild(this.logEl);
    root.appendChild(vpWrap);
    if (this.container === document.body) {
      this.container.style.margin = "0";
      this.container.style.height = "100vh";
      this.container.style.overflow = "hidden";
    }
    this.container.appendChild(root);
    applyCollapse();
    const ro = new ResizeObserver(() => this.resizeCanvas());
    ro.observe(vpWrap);
    this.resizeCanvas();
  }
  resizeCanvas() {
    const parent = this.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w > 0 && h > 0) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.redraw();
    }
  }
  wireInput() {
    this.canvas.style.touchAction = "none";
    const sample = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, id: e.pointerId };
    };
    this.canvas.addEventListener("pointerdown", (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      this._mousePressed = true;
      for (const fn of this.pointerDownFns) fn(p);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      for (const fn of this.pointerMoveFns) fn(p);
    });
    const onUp = (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      this._mousePressed = false;
      for (const fn of this.pointerUpFns) fn(p);
    };
    this.canvas.addEventListener("pointerup", onUp);
    this.canvas.addEventListener("pointercancel", onUp);
  }
  // ── Sketch execution ──
  runSketch() {
    this.buttons = [];
    this.logs = [];
    this.drawFn = null;
    this.animateFn = null;
    this.continuous = false;
    this.pointerDownFns = [];
    this.pointerMoveFns = [];
    this.pointerUpFns = [];
    const usedParams = /* @__PURE__ */ new Set();
    const lab = this.buildLab(usedParams);
    try {
      this.fn(lab);
    } catch (e) {
      console.error("Sketch2D error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }
    for (const key of this.params.keys()) {
      if (!usedParams.has(key)) this.params.delete(key);
    }
    const fingerprint = [...this.params.values()].map((p) => p.key).sort().join("|");
    if (fingerprint !== this._prevFingerprint) {
      this._prevFingerprint = fingerprint;
      this.rebuildPanel();
    }
    this.updateLog();
    this.redraw();
  }
  redraw() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    if (w > 0 && h > 0 && this.drawFn) {
      this.ctx.save();
      this.drawFn(this.ctx, w, h);
      this.ctx.restore();
    }
  }
  scheduleRerun() {
    if (this.rerunTimer) return;
    this.rerunTimer = requestAnimationFrame(() => {
      this.rerunTimer = 0;
      this.runSketch();
    });
  }
  buildLab(usedParams) {
    const self = this;
    function makeParam(type, label, defaultVal, group, config) {
      const key = `${type}:${group}:${label}`;
      usedParams.add(key);
      if (!self.params.has(key)) {
        self.params.set(key, { key, type, label, group, value: defaultVal, config });
      }
      const p = self.params.get(key);
      return { get value() {
        return p.value;
      } };
    }
    return {
      slider(label, min, max, def, opts) {
        return makeParam("slider", label, def, opts?.group ?? "Parameters", { min, max, step: opts?.step ?? (max - min) / 100 });
      },
      toggle(label, def = false, opts) {
        return makeParam("toggle", label, def, opts?.group ?? "Parameters", {});
      },
      select(label, options, def, opts) {
        return makeParam("select", label, def ?? options[0], opts?.group ?? "Parameters", { options });
      },
      colorPicker(label, def = "#38d9a9", opts) {
        return makeParam("color", label, def, opts?.group ?? "Display", {});
      },
      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions" });
      },
      draw(fn) {
        self.drawFn = fn;
      },
      animate(fn) {
        self.animateFn = fn;
        self.continuous = true;
      },
      get canvas() {
        return self.canvas;
      },
      get ctx() {
        return self.ctx;
      },
      get width() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.width / dpr;
      },
      get height() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.height / dpr;
      },
      get dpr() {
        return Math.min(window.devicePixelRatio, 2);
      },
      log(label, value) {
        self.logs.push({ label, value: value != null ? String(value) : "" });
      },
      // Math
      vec2: (x, y) => new Vec2(x, y),
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      sin: Math.sin,
      cos: Math.cos,
      atan2: Math.atan2,
      abs: Math.abs,
      sqrt: Math.sqrt,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      lerp: MathUtils.lerp,
      clamp: MathUtils.clamp,
      noise(x, y, z) {
        return noise(x, y ?? 0, z ?? 0);
      },
      random(min, max) {
        return self.rng.random(min, max);
      },
      randomSeed(seed) {
        self.rng = createRandom(seed);
      },
      // Input
      get mouseX() {
        return self._mouseX;
      },
      get mouseY() {
        return self._mouseY;
      },
      get mousePressed() {
        return self._mousePressed;
      },
      onPointerDown(fn) {
        self.pointerDownFns.push(fn);
      },
      onPointerMove(fn) {
        self.pointerMoveFns.push(fn);
      },
      onPointerUp(fn) {
        self.pointerUpFns.push(fn);
      }
    };
  }
  // ── Panel Building ──
  rebuildPanel() {
    const dk = this.isDark;
    const groups = /* @__PURE__ */ new Map();
    for (const p of this.params.values()) {
      if (!groups.has(p.group)) groups.set(p.group, []);
      groups.get(p.group).push(p);
    }
    for (const b of this.buttons) {
      if (!groups.has(b.group)) groups.set(b.group, []);
    }
    const html = [];
    for (const [group, params] of groups) {
      html.push(`<div style="border-bottom:1px solid ${dk ? "#16182a" : "#e0e2ea"};padding:10px 14px;">`);
      html.push(`<div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${dk ? "#4a5070" : "#8890a0"};margin-bottom:8px;">${group}</div>`);
      for (const p of params) {
        if (p.type === "slider") {
          const { min, max, step } = p.config;
          html.push(`
            <div style="margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
                <span style="color:${dk ? "#7a80a0" : "#5a6080"}">${p.label}</span>
                <span style="color:#38d9a9;font-weight:500" data-val="${p.key}">${typeof p.value === "number" ? Number.isInteger(step) && step >= 1 ? p.value : p.value.toFixed(2) : p.value}</span>
              </div>
              <input type="range" data-key="${p.key}" min="${min}" max="${max}" step="${step}" value="${p.value}"
                style="width:100%;height:4px;accent-color:#38d9a9;cursor:pointer;">
            </div>
          `);
        } else if (p.type === "toggle") {
          html.push(`
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:11px;">
              <span style="color:${dk ? "#7a80a0" : "#5a6080"}">${p.label}</span>
              <label style="position:relative;width:32px;height:18px;cursor:pointer;">
                <input type="checkbox" data-key="${p.key}" ${p.value ? "checked" : ""}
                  style="position:absolute;opacity:0;width:0;height:0;">
                <span style="position:absolute;inset:0;border-radius:9px;transition:.2s;
                  background:${p.value ? "#38d9a9" : dk ? "#1e2040" : "#d0d4e0"};">
                  <span style="position:absolute;left:${p.value ? "16px" : "2px"};top:2px;width:14px;height:14px;
                    border-radius:50%;background:white;transition:.2s;"></span>
                </span>
              </label>
            </div>
          `);
        } else if (p.type === "select") {
          const opts = p.config.options.map(
            (o) => `<option value="${o}" ${o === p.value ? "selected" : ""}>${o}</option>`
          ).join("");
          html.push(`
            <div style="margin-bottom:6px;">
              <div style="font-size:11px;color:${dk ? "#7a80a0" : "#5a6080"};margin-bottom:3px;">${p.label}</div>
              <select data-key="${p.key}" style="width:100%;padding:4px 6px;border-radius:4px;font-size:11px;
                font-family:inherit;background:${dk ? "#0f1020" : "#f0f2f8"};color:inherit;
                border:1px solid ${dk ? "#1e2040" : "#d0d4e0"};cursor:pointer;">
                ${opts}
              </select>
            </div>
          `);
        } else if (p.type === "color") {
          html.push(`
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:11px;">
              <span style="color:${dk ? "#7a80a0" : "#5a6080"}">${p.label}</span>
              <input type="color" data-key="${p.key}" value="${p.value}"
                style="width:28px;height:22px;border:none;cursor:pointer;background:none;">
            </div>
          `);
        }
      }
      for (const b of this.buttons.filter((b2) => b2.group === group)) {
        html.push(`
          <button data-btn="${b.label}" style="width:100%;padding:6px 10px;margin-bottom:4px;
            font-family:inherit;font-size:11px;cursor:pointer;border-radius:4px;
            background:${dk ? "#151730" : "#e8eaf0"};color:inherit;
            border:1px solid ${dk ? "#1e2040" : "#d0d4e0"};">
            ${b.label}
          </button>
        `);
      }
      html.push("</div>");
    }
    this.panelEl.innerHTML = html.join("");
    this.panelEl.querySelectorAll("input[type=range]").forEach((el) => {
      const input = el;
      const key = input.dataset.key;
      input.addEventListener("input", () => {
        const p = this.params.get(key);
        p.value = parseFloat(input.value);
        const valEl = this.panelEl.querySelector(`[data-val="${key}"]`);
        if (valEl) {
          const step = p.config.step;
          valEl.textContent = Number.isInteger(step) && step >= 1 ? String(p.value) : p.value.toFixed(2);
        }
        this.scheduleRerun();
      });
    });
    this.panelEl.querySelectorAll("input[type=checkbox]").forEach((el) => {
      const input = el;
      input.addEventListener("change", () => {
        this.params.get(input.dataset.key).value = input.checked;
        this.scheduleRerun();
      });
    });
    this.panelEl.querySelectorAll("select").forEach((el) => {
      const sel = el;
      sel.addEventListener("change", () => {
        this.params.get(sel.dataset.key).value = sel.value;
        this.scheduleRerun();
      });
    });
    this.panelEl.querySelectorAll("input[type=color]").forEach((el) => {
      const input = el;
      input.addEventListener("input", () => {
        this.params.get(input.dataset.key).value = input.value;
        this.scheduleRerun();
      });
    });
    this.panelEl.querySelectorAll("button[data-btn]").forEach((el) => {
      const btn = el;
      btn.addEventListener("click", () => {
        const b = this.buttons.find((b2) => b2.label === btn.dataset.btn);
        if (b) b.action();
      });
    });
  }
  updateLog() {
    if (this.logs.length === 0) {
      this.logEl.style.display = "none";
      return;
    }
    this.logEl.style.display = "block";
    this.logEl.innerHTML = this.logs.map(
      (l) => `<div style="display:flex;gap:8px;"><span style="color:#4a5070">${l.label}</span><span style="color:#b8bdd4">${l.value}</span></div>`
    ).join("");
  }
  // ── Animation Loop ──
  startLoop() {
    const loop = () => {
      if (this.disposed) return;
      if (this.continuous && this.animateFn) {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1e3;
        this.lastTime = now;
        this.animateFn((now - this.startTime) / 1e3, Math.min(dt, 1 / 15));
        this.redraw();
        this.updateLog();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  /** Tear down the sketch */
  dispose() {
    this.disposed = true;
    this.container.innerHTML = "";
  }
};
export {
  AABB,
  Algo,
  ArcCurve,
  BalloonFrame,
  BlobDetect,
  BspTree,
  Capsule2D,
  CltConstruction,
  ConnectedMesh,
  CubicBezierCurve,
  Curvature,
  CurveUtils,
  Delaunay2D,
  DistanceTransform,
  DxfExporter,
  ExtrudedRibbon,
  Mesh as FlatMesh,
  FlatMeshGen,
  FloodFill,
  Graph,
  GridGraph,
  HMath,
  HPlane,
  HelixCurve,
  HolzrahmenBau,
  HolzrahmenBauJointStyle,
  IfcFile,
  IfcWriter,
  Intersections,
  JoistedSlab,
  LayerPanel,
  LineCurve,
  MITER_LIMIT,
  MarchingCubes,
  MarchingSquares,
  Mat4,
  MathUtils,
  ConnectedMesh as Mesh,
  MeshAnalysis,
  MeshCleanup,
  MeshFactory,
  MeshFactory as MeshGen,
  MeshSubdivide,
  MeshTransform,
  NurbsCurve,
  NurbsSurface,
  OBB2D,
  ObjFile,
  OpeningType,
  PGFace,
  PGHalfEdge,
  PGVertex,
  ParamStore,
  PixelView,
  PlanarGraph,
  PlanarGraphCleanup,
  PlanarGraphRepair,
  HPlane as Plane,
  Polygon2D,
  PolylineCurve,
  Ray,
  Mesh as RenderMesh,
  RibbonEndTrim,
  RibbonFrame,
  RibbonJoint,
  RibbonOpening,
  RibbonSystem,
  RigidBody2D,
  SVGRenderer,
  Scene,
  SdfBlend,
  SdfBoundedExtrude,
  SdfBox,
  SdfCapsule,
  SdfCone,
  SdfCylinder,
  SdfEllipsoid,
  SdfExtrude,
  SdfGradient,
  SdfIntersect,
  SdfLattice,
  SdfLine as SdfLineField,
  SdfMicrostructure,
  SdfMirror,
  SdfOffset,
  SdfOnion,
  SdfOps,
  SdfPlane as SdfPlaneField,
  SdfRadialArray,
  SdfRevolution,
  SdfShell,
  SdfSmoothSubtract,
  SdfSmoothUnion,
  SdfSphere,
  SdfSubtract,
  SdfTorus,
  SdfTransform,
  SdfTwist,
  SdfUnion,
  SdfUtils,
  SdfVoronoi,
  Segment,
  Sketch2DInstance,
  SketchInstance,
  Slab,
  SlabOpening,
  SlabType,
  SolidConstruction,
  SolidSlabConstruction,
  Space,
  Sphere,
  Spring2D,
  SpringSystem3D,
  Stair,
  StairType,
  StreamlineTracer,
  SunPosition,
  ThreeRenderer,
  Triangle,
  Vec2,
  Vec3,
  Vec4,
  VecMath,
  VoxelGrid,
  VoxelGrid2D,
  Wall,
  WallJoint,
  WallOpening,
  WallSystem,
  WallType,
  boundingWalls,
  buildCutList,
  chooseJoistDirection,
  clampedUniformKnots,
  closestPointOnSegment,
  cltLayers,
  computeEffectiveVisibility,
  createLayout,
  createParams,
  createRandom,
  extractVisiblePolylines,
  hiddenLineIdBuffer,
  holzrahmenbauLayers,
  joistDirectionFromBounds,
  joistDirectionFromPCA,
  joistDirectionFromSupports,
  lineClipPolygon,
  noise,
  polygonFromVertices,
  polygonIntersection,
  polylinesToSVG,
  processWorkerRequest,
  realize,
  realizeSlab,
  repelBodies,
  segmentSegmentClosest,
  sketch,
  sketch2d
};
