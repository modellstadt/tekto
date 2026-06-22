/**
 * Tekto Intersections — 2D and 3D intersection tests.
 *
 * Mirrors HDGEO.Core.Intersections.
 */

import { Vec2, Vec3 } from "../math/vectors";
import { HMath } from "../math/HMath";
import { HPlane } from "./HPlane";
import { Ray } from "./Ray";
import { Sphere } from "./Sphere";
import { AABB } from "./AABB";
const EPS = 1e-8;
const EPS2D = 1e-10;

export interface Intersect2DResult {
  t: number;
  u: number;
  point: Vec2;
}

export const Intersections = {

  // ================================================================
  // 3D RAY INTERSECTIONS
  // ================================================================

  /**
   * Intersects a Ray with a line segment (A, B).
   * Returns the intersection point. If parallel/miss, returns midpoint of segment.
   */
  raySegment(rayOrigin: Vec3, rayDir: Vec3, pA: Vec3, pB: Vec3): Vec3 {
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
  rayTriangle(
    rayOrigin: Vec3, rayDir: Vec3,
    v0: Vec3, v1: Vec3, v2: Vec3
  ): { t: number; u: number; v: number } | null {
    const edge1 = v1.sub(v0);
    const edge2 = v2.sub(v0);
    const h = rayDir.cross(edge2);
    const a = edge1.dot(h);
    if (a > -EPS && a < EPS) return null;

    const f = 1 / a;
    const s = rayOrigin.sub(v0);
    const u = f * s.dot(h);
    if (u < 0 || u > 1) return null;

    const q = s.cross(edge1);
    const v = f * rayDir.dot(q);
    if (v < 0 || u + v > 1) return null;

    const t = f * edge2.dot(q);
    if (t <= EPS) return null;

    return { t, u, v };
  },

  /**
   * Checks if a point P (assumed to be on the triangle plane) is inside ABC.
   * Uses the "Same Side" technique with cross products.
   */
  pointInTriangle3D(p: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean {
    const ab = b.sub(a), bc = c.sub(b), ca = a.sub(c);
    const pa = p.sub(a), pb = p.sub(b), pc = p.sub(c);
    const n = ab.cross(ca);
    if (ab.cross(pa).dot(n) < 0) return false;
    if (bc.cross(pb).dot(n) < 0) return false;
    if (ca.cross(pc).dot(n) < 0) return false;
    return true;
  },

  /** Returns the closest point on segment AB to point P. */
  closestPointOnSegment(a: Vec3, b: Vec3, p: Vec3): Vec3 {
    const ab = b.sub(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / ab.lenSq(), 0, 1);
    return a.add(ab.mul(t));
  },

  /**
   * Finds the closest points on two 3D lines (not segments).
   * Returns { c1, c2 }.
   */
  closestPointsLineLine(
    p1: Vec3, d1: Vec3, p2: Vec3, d2: Vec3
  ): { c1: Vec3; c2: Vec3 } {
    const r = p1.sub(p2);
    const a = d1.dot(d1);
    const b = d1.dot(d2);
    const c = d1.dot(r);
    const e = d2.dot(d2);
    const f = d2.dot(r);
    const d = a * e - b * b;

    if (d < EPS) {
      return { c1: p1, c2: p2.add(d2.mul(p1.sub(p2).dot(d2))) };
    }

    const s = (b * f - c * e) / d;
    const t = (a * f - b * c) / d;
    return { c1: p1.add(d1.mul(s)), c2: p2.add(d2.mul(t)) };
  },

  // ================================================================
  // RAY-PLANE / RAY-SPHERE / RAY-AABB
  // ================================================================

  /** Intersects a ray with a plane. Returns { t, point } or null. */
  rayPlane(ray: Ray, plane: HPlane): { t: number; point: Vec3 } | null {
    const denom = ray.direction.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(ray.origin.dot(plane.normal) + plane.d) / denom;
    if (t < 0) return null;
    return { t, point: ray.at(t) };
  },

  /** Intersects a ray with a sphere. Returns { t1, t2 } or null. */
  raySphere(ray: Ray, sphere: Sphere): { t1: number; t2: number } | null {
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
  rayAABB(ray: Ray, box: AABB): { tMin: number; tMax: number } | null {
    let tMin = -Infinity;
    let tMax = Infinity;

    const invX = 1 / ray.direction.x;
    const invY = 1 / ray.direction.y;
    const invZ = 1 / ray.direction.z;

    let tx0 = (box.min.x - ray.origin.x) * invX;
    let tx1 = (box.max.x - ray.origin.x) * invX;
    if (invX < 0) { const tmp = tx0; tx0 = tx1; tx1 = tmp; }
    tMin = Math.max(tMin, tx0);
    tMax = Math.min(tMax, tx1);
    if (tMax < tMin) return null;

    let ty0 = (box.min.y - ray.origin.y) * invY;
    let ty1 = (box.max.y - ray.origin.y) * invY;
    if (invY < 0) { const tmp = ty0; ty0 = ty1; ty1 = tmp; }
    tMin = Math.max(tMin, ty0);
    tMax = Math.min(tMax, ty1);
    if (tMax < tMin) return null;

    let tz0 = (box.min.z - ray.origin.z) * invZ;
    let tz1 = (box.max.z - ray.origin.z) * invZ;
    if (invZ < 0) { const tmp = tz0; tz0 = tz1; tz1 = tmp; }
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
  segmentIntersect2D(
    a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2
  ): Intersect2DResult | null {
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
  segmentSegment2D(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
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
  lineLine2D(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
    const denom = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
    if (Math.abs(denom) < EPS2D) return null;
    const num = (a1.y - b1.y) * (b2.x - b1.x) - (a1.x - b1.x) * (b2.y - b1.y);
    const t = num / denom;
    return new Vec2(a1.x + t * (a2.x - a1.x), a1.y + t * (a2.y - a1.y));
  },

  /** Intersects a 2D ray (origin + direction) with a segment. */
  raySegment2D(rayOrigin: Vec2, rayDir: Vec2, a: Vec2, b: Vec2): Vec2 | null {
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
  rayLine2D(rayOrigin: Vec2, rayDir: Vec2, lineA: Vec2, lineB: Vec2): Vec2 | null {
    const lineDir = lineB.sub(lineA);
    const denom = rayDir.x * lineDir.y - rayDir.y * lineDir.x;
    if (Math.abs(denom) < EPS2D) return null;

    const diff = lineA.sub(rayOrigin);
    const t = (diff.x * lineDir.y - diff.y * lineDir.x) / denom;
    if (t < 0) return null;
    return rayOrigin.add(rayDir.mul(t));
  },

  /** Intersects a 2D segment with an infinite line. */
  segmentLine2D(segA: Vec2, segB: Vec2, lineA: Vec2, lineB: Vec2): Vec2 | null {
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
  rayRay2D(o1: Vec2, d1: Vec2, o2: Vec2, d2: Vec2): Vec2 | null {
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
  circleLine(a: Vec2, b: Vec2, center: Vec2, radius: number): Vec2[] {
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
  circleCircle(c1x: number, c1y: number, r1: number, c2x: number, c2y: number, r2: number): [number, number][] {
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
  circleSegment(a: Vec2, b: Vec2, center: Vec2, radius: number): Vec2[] {
    const lineHits = Intersections.circleLine(a, b, center, radius);
    if (lineHits.length === 0) return [];

    const mid = a.add(b).mul(0.5);
    const halfLen = a.distTo(b) * 0.5;

    return lineHits.filter(p => p.distTo(mid) <= halfLen + HMath.EPSILON);
  },

  // ================================================================
  // 3D PLANE INTERSECTIONS
  // ================================================================

  /** Intersects a line segment with a plane. Returns the hit point or null. */
  segmentPlane(a: Vec3, b: Vec3, plane: HPlane): Vec3 | null {
    const dA = plane.distToPoint(a);
    const dB = plane.distToPoint(b);
    if (dA * dB > 0) return null; // both on same side

    const denom = dA - dB;
    if (Math.abs(denom) < HMath.EPSILON) return a;

    const t = dA / denom;
    return a.lerp(b, t);
  },

  /** Intersects an infinite line with a plane. Returns the hit point or null. */
  linePlane(a: Vec3, b: Vec3, plane: HPlane): Vec3 | null {
    const dir = b.sub(a);
    const denom = dir.dot(plane.normal);
    if (Math.abs(denom) < HMath.EPSILON) return null;
    const t = -(a.dot(plane.normal) + plane.d) / denom;
    return a.add(dir.mul(t));
  },

  /** Intersects two planes. Returns { point, direction } of the line, or null if parallel. */
  planePlane(p1: HPlane, p2: HPlane): { point: Vec3; direction: Vec3 } | null {
    const dir = p1.normal.cross(p2.normal);
    if (dir.lenSq() < HMath.EPSILON) return null;

    const absX = Math.abs(dir.x);
    const absY = Math.abs(dir.y);
    const absZ = Math.abs(dir.z);

    let point: Vec3;
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
  polygonRay2D(rayOrigin: Vec2, rayDir: Vec2, polygon: Vec2[]): Vec2[] {
    const hits: Vec2[] = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const hit = Intersections.raySegment2D(rayOrigin, rayDir, polygon[i], polygon[(i + 1) % n]);
      if (hit) hits.push(hit);
    }
    return hits;
  },
};

// ── helpers ──

function coord(v: Vec3, i: number): number {
  return i === 0 ? v.x : i === 1 ? v.y : v.z;
}

function setCoord(x: number, y: number, z: number, i: number, val: number): Vec3 {
  if (i === 0) return new Vec3(val, y, z);
  if (i === 1) return new Vec3(x, val, z);
  return new Vec3(x, y, val);
}

function solvePlanePair(_zeroCoord: number, coordA: number, coordB: number, p1: HPlane, p2: HPlane): Vec3 {
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
