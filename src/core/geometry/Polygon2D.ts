/**
 * Tekto Polygon2D — 2D polygon algorithms.
 *
 * Mirrors HDGEO.Core.Polygon2D.
 */

import { Vec2, Vec3 } from "../math/vectors";
import { HMath } from "../math/HMath";
import { VecMath } from "../math/VecMath";
import { OBB2D } from "./OBB2D";

const TWO_PI = Math.PI * 2;

export interface FilletResult {
  center: Vec2;
  radius: number;
  startAngle: number;
  sweepAngle: number;
  startPt: Vec2;
  endPt: Vec2;
}

export const Polygon2D = {

  // ================================================================
  // CROSS PRODUCT / ORIENTATION
  // ================================================================

  /** 2D cross product of vectors OA x OB */
  cross2D(o: Vec2, a: Vec2, b: Vec2): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  },

  // ================================================================
  // AREA & PERIMETER
  // ================================================================

  /** Signed area of a 2D polygon (positive if CCW, negative if CW). */
  signedArea(polygon: Vec2[]): number {
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    }
    return area / 2;
  },

  /** Unsigned area. */
  area(polygon: Vec2[]): number {
    return Math.abs(Polygon2D.signedArea(polygon));
  },

  /** Total perimeter length. */
  perimeter(polygon: Vec2[]): number {
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
  polylineLength(polyline: Vec2[]): number {
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
  openRing(polygon: Vec2[], eps = 1e-12): Vec2[] {
    return polygon.length >= 3 &&
      polygon[0].distSqTo(polygon[polygon.length - 1]) < eps
      ? polygon.slice(0, -1)
      : polygon.slice();
  },

  /**
   * Return `polygon` with a closing duplicate vertex appended (closed ring).
   * Polygons with <3 vertices are returned as a fresh copy unchanged.
   * Always returns a fresh array.
   */
  closeRing(polygon: Vec2[], eps = 1e-12): Vec2[] {
    if (polygon.length < 3) return polygon.slice();
    return polygon[0].distSqTo(polygon[polygon.length - 1]) < eps
      ? polygon.slice()
      : [...polygon, polygon[0]];
  },

  /** Returns true if polygon vertices are in counter-clockwise order. */
  isCCW(polygon: Vec2[]): boolean {
    return Polygon2D.signedArea(polygon) > 0;
  },

  // ================================================================
  // CENTER
  // ================================================================

  /** Average center (centroid of vertices, fast but not area-weighted). */
  averageCenter(polygon: Vec2[]): Vec2 {
    let sx = 0, sy = 0;
    for (const p of polygon) { sx += p.x; sy += p.y; }
    return new Vec2(sx / polygon.length, sy / polygon.length);
  },

  /** Area-weighted centroid (gravity center). */
  centroid2D(polygon: Vec2[]): Vec2 {
    const A = Polygon2D.signedArea(polygon);
    if (Math.abs(A) < HMath.EPSILON) return Polygon2D.averageCenter(polygon);
    let cx = 0, cy = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const f = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      cx += (polygon[i].x + polygon[j].x) * f;
      cy += (polygon[i].y + polygon[j].y) * f;
    }
    const factor = 1 / (6 * A);
    return new Vec2(cx * factor, cy * factor);
  },

  // ================================================================
  // CONTAINMENT
  // ================================================================

  /** Point-in-polygon (ray casting, 2D). */
  pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if ((yi > point.y) !== (yj > point.y) &&
          point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  },

  /** Point-in-polygon test using winding number (robust for concave polygons). */
  containsWinding(polygon: Vec2[], point: Vec2): boolean {
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
  closestVertexIndex(polygon: Vec2[], point: Vec2): number {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < polygon.length; i++) {
      const d = polygon[i].distSqTo(point);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  },

  /** Closest point on the polygon boundary to a given point. Returns { point, edgeIndex }. */
  closestPointOnEdge(polygon: Vec2[], point: Vec2): { point: Vec2; edgeIndex: number } {
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
      if (d < bestDist) { bestDist = d; bestPt = proj; bestEdge = i; }
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
  closestPointOnPolyline(
    polyline: Vec2[], point: Vec2, opts: { closed?: boolean } = {},
  ): { point: Vec2; arcLength: number; segmentIndex: number; segmentT: number; distance: number } {
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
      distance: Math.sqrt(bestDistSq),
    };
  },

  // ================================================================
  // INTERSECTION
  // ================================================================

  /** Segment-segment intersection (2D), returns parameter t along first segment. */
  segmentIntersect2D(
    a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2
  ): { t: number; u: number; point: Vec2 } | null {
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
  offset(polygon: Vec2[], distance: number): Vec2[] {
    const n = polygon.length;
    if (n < 3) return [...polygon];

    const d = distance;

    const result: Vec2[] = [];
    for (let i = 0; i < n; i++) {
      const prev = (i - 1 + n) % n;
      const next = (i + 1) % n;

      const e1Dir = polygon[i].sub(polygon[prev]).normalize();
      const e2Dir = polygon[next].sub(polygon[i]).normalize();

      // RIGHT-normals (perpendicular, rotation by −90°). For a CCW
      // polygon these point OUTWARD; for a CW polygon they point
      // INWARD. We DON'T flip the sign of `d` for CW — the
      // `sinHalfAngle` cross product flips sign with the winding too,
      // and the two cancel: positive `d` ends up outward in both cases.
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
  simplify(polygon: Vec2[], tolerance: number): Vec2[] {
    if (polygon.length <= 3) return [...polygon];

    const keep = new Array<boolean>(polygon.length).fill(true);
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

    const result: Vec2[] = [];
    for (let i = 0; i < n; i++)
      if (keep[i]) result.push(polygon[i]);
    return result.length >= 3 ? result : [...polygon];
  },

  /**
   * Removes vertices where the interior angle is close to 180°
   * (i.e. the vertex barely deviates from a straight line).
   */
  simplifyByAngle(polygon: Vec2[], minAngleRadians: number): Vec2[] {
    if (polygon.length <= 3) return [...polygon];

    const result: Vec2[] = [];
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
  removeShortEdges(polygon: Vec2[], minLength: number): Vec2[] {
    if (polygon.length <= 3) return [...polygon];
    const minSq = minLength * minLength;
    const result: Vec2[] = [polygon[0]];
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
  subdivideEdges(polygon: Vec2[], subdivisions: number): Vec2[] {
    if (subdivisions < 2) return [...polygon];
    const n = polygon.length;
    const result: Vec2[] = [];
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      for (let s = 0; s < subdivisions; s++)
        result.push(a.lerp(b, s / subdivisions));
    }
    return result;
  },

  /** Splits edges to ensure no edge is longer than maxLength. */
  splitLongEdges(polygon: Vec2[], maxLength: number): Vec2[] {
    const n = polygon.length;
    const result: Vec2[] = [];
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
  normal3D(polygon: Vec3[]): Vec3 {
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
  createCircle(radius: number, segments: number): Vec2[] {
    const pts: Vec2[] = [];
    const twoPi = Math.PI * 2;
    for (let i = 0; i < segments; i++) {
      const angle = twoPi * i / segments;
      pts.push(new Vec2(radius * Math.cos(angle), radius * Math.sin(angle)));
    }
    return pts;
  },

  /** Creates a rectangle centered at origin. */
  createRect(width: number, height: number): Vec2[] {
    const w = width * 0.5, h = height * 0.5;
    return [
      new Vec2(-w, -h), new Vec2(w, -h),
      new Vec2(w, h), new Vec2(-w, h)
    ];
  },

  /** Returns the polygon with reversed winding order. */
  reverse(polygon: Vec2[]): Vec2[] {
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
  filletRays(
    origin: Vec2, angle1: number, angle2: number, radius: number
  ): FilletResult {
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

    // Orient sweep toward the ray origin
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
      endPt,
    };
  },

  // ================================================================
  // CONVEX HULL
  // ================================================================

  /** Convex hull (Andrew's monotone chain). Returns CCW-ordered hull points. */
  convexHull2D(points: Vec2[]): Vec2[] {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    if (sorted.length <= 2) return sorted;

    const lower: Vec2[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && Polygon2D.cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper: Vec2[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && Polygon2D.cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
  },

  // ================================================================
  // TRIANGULATION
  // ================================================================

  /** Ear-clipping triangulation for simple 2D polygons. */
  triangulate2D(polygon: Vec2[]): [number, number, number][] {
    if (polygon.length < 3) return [];
    if (polygon.length === 3) return [[0, 1, 2]];

    const isCCW = Polygon2D.signedArea(polygon) > 0;
    const remaining = polygon.map((_, i) => i);
    const triangles: [number, number, number][] = [];

    const isEar = (prev: number, curr: number, next: number): boolean => {
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
  minEnclosingCircle(points: Vec2[]): { center: Vec2; radius: number } {
    if (points.length === 0) return { center: new Vec2(), radius: 0 };
    if (points.length === 1) return { center: points[0], radius: 0 };

    const p = [...points].sort(() => Math.random() - 0.5);

    type Circle = { center: Vec2; radius: number };

    const from2 = (a: Vec2, b: Vec2): Circle => ({
      center: a.lerp(b, 0.5),
      radius: a.distTo(b) / 2,
    });
    const from3 = (a: Vec2, b: Vec2, c: Vec2): Circle => {
      const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(d) < 1e-10) {
        const d01 = a.distTo(b), d12 = b.distTo(c), d02 = a.distTo(c);
        if (d01 >= d12 && d01 >= d02) return from2(a, b);
        if (d12 >= d01 && d12 >= d02) return from2(b, c);
        return from2(a, c);
      }
      const ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) +
                  (b.x * b.x + b.y * b.y) * (c.y - a.y) +
                  (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
      const uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) +
                  (b.x * b.x + b.y * b.y) * (a.x - c.x) +
                  (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
      const center = new Vec2(ux, uy);
      return { center, radius: center.distTo(a) };
    };

    const inside = (circ: Circle, q: Vec2) =>
      circ.center.distTo(q) <= circ.radius + 1e-8;

    let D: Circle = from2(p[0], p[1]);
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
  minAreaRect(points: Vec2[]): OBB2D {
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
  },
};

// ── helpers ──

function pointInTriangle2D(p: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const d1 = Polygon2D.cross2D(a, b, p);
  const d2 = Polygon2D.cross2D(b, c, p);
  const d3 = Polygon2D.cross2D(c, a, p);
  return !(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0)));
}

function nextKept(keep: boolean[], i: number, n: number): number {
  let next = (i + 1) % n;
  while (!keep[next] && next !== i) next = (next + 1) % n;
  return next;
}

function prevKept(keep: boolean[], i: number, n: number): number {
  let prev = (i - 1 + n) % n;
  while (!keep[prev] && prev !== i) prev = (prev - 1 + n) % n;
  return prev;
}

// ================================================================
// POLYGON BOOLEAN — Greiner-Hormann intersection
// ================================================================

/** Linked list node for polygon boundary */
class BoolNode {
  pos: Vec2;
  next: BoolNode = this;
  prev: BoolNode = this;
  isIntersection = false;
  entering = false;
  visited = false;
  partner: BoolNode | null = null;
  alpha = 0;
  constructor(pos: Vec2) { this.pos = pos; }
}

function buildBoolList(poly: Vec2[]): BoolNode {
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

function insertBoolNode(after: BoolNode, node: BoolNode): void {
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

function boolSegHit(ax: number, ay: number, bx: number, by: number,
                    cx: number, cy: number, dx: number, dy: number): { t: number; u: number } | null {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
  if (t > 1e-8 && t < 1 - 1e-8 && u > 1e-8 && u < 1 - 1e-8) return { t, u };
  return null;
}

function boolPip(pt: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if ((poly[i].y > pt.y) !== (poly[j].y > pt.y) &&
        pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Compute the intersection of two simple polygons using Greiner-Hormann.
 * Returns an array of result polygons (intersection may be multiple regions).
 *
 * Inspired by Java's Area.intersect() — treats polygons as filled regions.
 */
export function polygonIntersection(subjPoly: Vec2[], clipPoly: Vec2[]): Vec2[][] {
  const subj = buildBoolList(subjPoly);
  const clip = buildBoolList(clipPoly);

  // Find and insert all intersection points
  let hasIntersections = false;
  let sNode = subj;
  do {
    let cNode = clip;
    do {
      const hit = boolSegHit(
        sNode.pos.x, sNode.pos.y, sNode.next.pos.x, sNode.next.pos.y,
        cNode.pos.x, cNode.pos.y, cNode.next.pos.x, cNode.next.pos.y,
      );
      if (hit) {
        const pt = new Vec2(
          sNode.pos.x + hit.t * (sNode.next.pos.x - sNode.pos.x),
          sNode.pos.y + hit.t * (sNode.next.pos.y - sNode.pos.y),
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

  // Mark entering/exiting on subject list
  let cur = subj;
  let inside = boolPip(cur.pos, clipPoly);
  do {
    if (cur.isIntersection) {
      cur.entering = !inside;
      inside = !inside;
    }
    cur = cur.next;
  } while (cur !== subj);

  // Walk to build result polygons
  const results: Vec2[][] = [];
  cur = subj;
  do {
    if (cur.isIntersection && cur.entering && !cur.visited) {
      const poly: Vec2[] = [];
      let walker: BoolNode = cur;
      let onSubject = true;

      for (let safety = 0; safety < 1000; safety++) {
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
