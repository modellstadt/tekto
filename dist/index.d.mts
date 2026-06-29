import { V as Vec3, a as Vec2, M as Mat4, T as Triangle, A as AABB, C as ConnectedMesh, b as Mesh, c as MeshData, S as Scene, d as VisualStyle, F as FlatMeshData, R as RenderMode, L as LightingMode } from './Params-c5RUx8In.mjs';
export { B as BoolParam, e as ButtonParam, f as ColorParam, g as FlatMeshJSON, h as FloatParam, I as IntParam, i as MeshEdge, j as MeshFace, k as MeshJSON, l as MeshNode, O as ObjFile, m as ObjMeshData, P as ParamDef, n as ParamFolder, o as ParamLayout, p as ParamSchema, q as ParamStore, r as SceneEvent, s as SceneEventListener, t as SceneJSON, u as SceneObject, v as SceneObjectType, w as SelectParam, x as StringParam, y as Vec3Param, z as Vec4, D as createLayout, E as createParams } from './Params-c5RUx8In.mjs';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Tekto HMath — Scalar math utilities.
 *
 * Mirrors HDGEO.Core.HMath.
 */
declare const HMath: {
    DEG2RAD: number;
    RAD2DEG: number;
    EPSILON: number;
    clamp(v: number, min: number, max: number): number;
    lerp(a: number, b: number, t: number): number;
    smoothstep(edge0: number, edge1: number, x: number): number;
    /** Map value from one range to another */
    remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
    almostEqual(a: number, b: number, eps?: number): boolean;
    /** Returns t in [0,1] if angle lies within arc(startAngle, sweepAngle), else null. */
    sweepFraction(angle: number, startAngle: number, sweepAngle: number): number | null;
    /** Solve quadratic Bezier (1-t)²a + 2(1-t)t·b + t²c = target for t ∈ [0,1]. Returns t or null. */
    solveQuadraticBezier(a: number, b: number, c: number, target: number): number | null;
};
/** Backward-compat alias */
declare const MathUtils: {
    DEG2RAD: number;
    RAD2DEG: number;
    EPSILON: number;
    clamp(v: number, min: number, max: number): number;
    lerp(a: number, b: number, t: number): number;
    smoothstep(edge0: number, edge1: number, x: number): number;
    /** Map value from one range to another */
    remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
    almostEqual(a: number, b: number, eps?: number): boolean;
    /** Returns t in [0,1] if angle lies within arc(startAngle, sweepAngle), else null. */
    sweepFraction(angle: number, startAngle: number, sweepAngle: number): number | null;
    /** Solve quadratic Bezier (1-t)²a + 2(1-t)t·b + t²c = target for t ∈ [0,1]. Returns t or null. */
    solveQuadraticBezier(a: number, b: number, c: number, target: number): number | null;
};

/**
 * Tekto VecMath — Static vector/geometry utility functions.
 *
 * Mirrors HDGEO.Core.VecMath — all bugs fixed, no mutating inputs.
 */

declare const VecMath: {
    /** Point between a and b at parameter t (0=a, 1=b). */
    pointBetween(a: Vec3, b: Vec3, t: number): Vec3;
    /** Point on segment a→b at absolute distance from a. */
    pointBetweenAbsolute(a: Vec3, b: Vec3, distance: number): Vec3;
    /** Generates evenly spaced points along a segment (inclusive of endpoints). */
    pointsBetween(a: Vec3, b: Vec3, segments: number): Vec3[];
    /** Generates points along a segment with minimum spacing. */
    pointsAlongSegment(a: Vec3, b: Vec3, spacing: number): Vec3[];
    /** Creates a 2D unit vector from an angle (radians). */
    fromAngle2D(angle: number): Vec2;
    /** Creates a 3D point from polar coordinates in XY plane. */
    polar(angle: number, length: number): Vec3;
    /** Creates a 3D point from polar coordinates in XZ plane with height Y. */
    polarXZ(angle: number, length: number, y?: number): Vec3;
    /** Creates a point at origin offset by polar (angle, length). */
    polarOffset(origin: Vec2, angle: number, length: number): Vec2;
    /** 2D heading angle of a Vec2 (radians, -PI..PI). */
    angle2D(v: Vec2): number;
    /** 2D heading angle of a Vec3 projected to XY. */
    angle2DFrom3D(v: Vec3): number;
    /** Positive angle (0..2PI) of a 2D vector. */
    anglePositive(v: Vec2): number;
    /**
     * Angle between two 3D vectors (radians, 0..PI).
     * Safe: returns 0 for zero-length vectors, clamps dot to avoid NaN.
     */
    angleBetween(a: Vec3, b: Vec3): number;
    /**
     * Signed angle from vector a to vector b around the given axis (radians, -PI..PI).
     */
    angleBetweenSigned(a: Vec3, b: Vec3, axis: Vec3): number;
    /** Counter-clockwise angle from direction a to b (radians, 0..2PI). */
    angleBetweenCCW(a: Vec2, b: Vec2): number;
    /** Angle at vertex P between edges PA and PB (radians, 0..PI). */
    angleAtVertex(p: Vec2, a: Vec2, b: Vec2): number;
    /** Angle between two line segments sharing a common endpoint (radians). */
    angleBetweenSegments(a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): number;
    /** Rotates a 2D vector 90° counter-clockwise. */
    rotate90(v: Vec2): Vec2;
    /** Rotates a 2D vector 90° clockwise. */
    rotate90CW(v: Vec2): Vec2;
    /** Rotates a 2D vector by an angle (radians). */
    rotate2D(v: Vec2, angle: number): Vec2;
    /** Shortest distance from point to infinite line through a and b. */
    distanceToLine(p: Vec3, lineA: Vec3, lineB: Vec3): number;
    /** Shortest distance from point to segment ab. */
    distanceToSegment(p: Vec3, a: Vec3, b: Vec3): number;
    /** Squared distance from point to segment ab (avoids sqrt). */
    distanceToSegmentSq(p: Vec3, a: Vec3, b: Vec3): number;
    /** 2D distance from point to segment (XY only). */
    distanceToSegment2D(p: Vec2, a: Vec2, b: Vec2): number;
    /** 2D distance from point to infinite line through a and b. */
    distanceToLine2D(p: Vec2, a: Vec2, b: Vec2): number;
    /** Closest point on infinite line through a and b to point p. */
    closestPointOnLine(p: Vec3, lineA: Vec3, lineB: Vec3): Vec3;
    /**
     * Closest points between two 3D line segments.
     * Returns { c1, c2 } — points on segment 1 and segment 2.
     */
    closestPointsSegmentSegment(a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): {
        c1: Vec3;
        c2: Vec3;
    };
    /** Projects a vector onto a plane defined by its normal. */
    projectOnPlane(v: Vec3, planeNormal: Vec3): Vec3;
    /**
     * Offsets a 2D line segment by a perpendicular distance.
     * Positive = left side when walking from p1 to p2.
     */
    offsetSegment2D(p1: Vec2, p2: Vec2, offset: number): {
        a: Vec2;
        b: Vec2;
    };
    /**
     * Creates a rotation matrix that rotates direction 'from' to direction 'to'.
     * Both should be unit vectors.
     */
    rotationBetween(from: Vec3, to: Vec3): Mat4;
    /**
     * Builds a coordinate frame matrix from an origin, a Z-axis direction (normal),
     * and an approximate X-axis hint.
     */
    frameFromNormal(origin: Vec3, normal: Vec3, xHint?: Vec3): Mat4;
    /**
     * Returns the signed area of the parallelogram formed by triangle (p0, p1, p2) in 2D.
     * Positive if counter-clockwise, negative if clockwise.
     */
    cross2D(p0: Vec2, p1: Vec2, p2: Vec2): number;
    /** Returns +1 (CCW/left), -1 (CW/right), or 0 (collinear). */
    orientation(p0: Vec2, p1: Vec2, p2: Vec2): -1 | 0 | 1;
    /** Tests if four 2D points form a convex quadrilateral. */
    isConvexQuad(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean;
    /** Tests if a point lies on the line segment ab (2D, within tolerance). */
    isPointOnSegment2D(a: Vec2, b: Vec2, p: Vec2, tolerance?: number): boolean;
    /** Signed volume of tetrahedron formed by triangle and origin (for mesh volume). */
    triangleSignedVolume(a: Vec3, b: Vec3, c: Vec3): number;
    /** 3D triangle area via cross product magnitude. */
    triangleArea(a: Vec3, b: Vec3, c: Vec3): number;
    /** 2D triangle area (signed). */
    triangleArea2D(a: Vec2, b: Vec2, c: Vec2): number;
    /** Normal of a triangle (unit length). */
    triangleNormal(a: Vec3, b: Vec3, c: Vec3): Vec3;
    /**
     * 2D angular bisector direction at vertex P between edges PA and PB.
     * The returned vector points into the bisector, unit length.
     */
    bisector2D(p: Vec2, a: Vec2, b: Vec2): Vec2;
    /** Arc length from angle and radius. */
    arcLength(angle: number, radius: number): number;
    /** Arc angle from arc length and radius. */
    arcAngle(length: number, radius: number): number;
    /** Determinant of a 3x3 matrix given by rows. */
    determinant3x3(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number): number;
    /** Direction, length, and unit perpendicular of a 2D segment (XY plane). */
    segmentPerpendicular2D(ax: number, ay: number, bx: number, by: number): {
        dx: number;
        dy: number;
        len: number;
        px: number;
        py: number;
    };
};

/**
 * Improved Perlin Noise (Ken Perlin 2002)
 *
 * Port of HDGEO's PerlinNoise.cs — same permutation table,
 * same fade/grad functions, same output range [0, 1].
 */
/**
 * Perlin noise — 1D, 2D, or 3D. Returns [0, 1].
 */
declare function noise(x: number, y?: number, z?: number): number;

/**
 * Seeded pseudo-random number generator.
 *
 * Uses mulberry32 algorithm — fast, compact, good distribution.
 * Matches HDGEO's Random() / RandomSeed() API.
 */
interface SeededRandom {
    /** Returns a random float. 0 args → [0,1). 1 arg → [0,max). 2 args → [min,max). */
    random(min?: number, max?: number): number;
    /** Reset the PRNG with a new seed. */
    randomSeed(seed: number): void;
}
/**
 * Create a seeded random number generator.
 * If no seed is provided, uses a time-based seed.
 */
declare function createRandom(seed?: number): SeededRandom;

/**
 * Tekto HPlane — Infinite plane (ax + by + cz + d = 0).
 *
 * Renamed from `Plane` to avoid conflict with DOM Plane.
 * Mirrors HDGEO.Core.HPlane.
 */

declare class HPlane {
    readonly normal: Vec3;
    readonly d: number;
    /** ax + by + cz + d = 0 */
    constructor(normal: Vec3, d: number);
    static fromPointNormal(point: Vec3, normal: Vec3): HPlane;
    static fromThreePoints(a: Vec3, b: Vec3, c: Vec3): HPlane;
    static XY(): HPlane;
    static XZ(): HPlane;
    static YZ(): HPlane;
    distToPoint(point: Vec3): number;
    projectPoint(point: Vec3): Vec3;
    side(point: Vec3): -1 | 0 | 1;
    /** Reflects a vector off the plane (like a light ray bouncing). */
    reflectVector(direction: Vec3): Vec3;
    /** Reflects a point to the other side of the plane. */
    reflectPoint(point: Vec3): Vec3;
    /** Returns a new plane with the normal flipped. */
    flipped(): HPlane;
    toJSON(): {
        normal: {
            x: number;
            y: number;
            z: number;
        };
        d: number;
    };
}

/**
 * Tekto Sphere primitive.
 *
 * Mirrors HDGEO.Core.Sphere.
 */

declare class Sphere {
    readonly center: Vec3;
    readonly radius: number;
    constructor(center: Vec3, radius: number);
    containsPoint(p: Vec3): boolean;
    intersectsSphere(other: Sphere): boolean;
    toJSON(): {
        center: {
            x: number;
            y: number;
            z: number;
        };
        radius: number;
    };
}

/**
 * Tekto Ray — origin + direction with intersection tests.
 *
 * Mirrors HDGEO.Core.Ray.
 */

declare class Ray {
    readonly origin: Vec3;
    readonly direction: Vec3;
    constructor(origin: Vec3, direction: Vec3);
    at(t: number): Vec3;
    closestPointTo(point: Vec3): Vec3;
    distToPoint(point: Vec3): number;
    intersectPlane(plane: HPlane): {
        t: number;
        point: Vec3;
    } | null;
    intersectTriangle(tri: Triangle): {
        t: number;
        point: Vec3;
        u: number;
        v: number;
    } | null;
    intersectSphere(sphere: Sphere): {
        t: number;
        point: Vec3;
    }[];
    intersectAABB(box: AABB): {
        tMin: number;
        tMax: number;
    } | null;
    toJSON(): {
        origin: {
            x: number;
            y: number;
            z: number;
        };
        direction: {
            x: number;
            y: number;
            z: number;
        };
    };
}

/**
 * Tekto Segment — A line segment in 3D space defined by two endpoints.
 *
 * Mirrors HDGEO.Core.Segment.
 */

declare class Segment {
    readonly a: Vec3;
    readonly b: Vec3;
    constructor(a: Vec3, b: Vec3);
    get direction(): Vec3;
    get length(): number;
    get lengthSquared(): number;
    get midpoint(): Vec3;
    /** Point on segment at parameter t (0=A, 1=B). */
    pointAt(t: number): Vec3;
    /** Closest point on this segment to point p. */
    closestPoint(p: Vec3): Vec3;
    /** Parameter t of the closest point on the segment to p (clamped 0..1). */
    closestParameter(p: Vec3): number;
    /** Distance from a point to this segment. */
    distanceTo(p: Vec3): number;
    /** Squared distance from a point to this segment. */
    distanceSquaredTo(p: Vec3): number;
    /** Bounding box of this segment. */
    get bounds(): AABB;
    /** Splits a segment into n equal parts, returning n+1 points. */
    static split(a: Vec3, b: Vec3, segments: number): Vec3[];
    /**
     * Finds the closest points between this segment and another.
     * Returns { c1, c2 } — points on this segment and the other.
     */
    closestPointsTo(other: Segment): {
        c1: Vec3;
        c2: Vec3;
    };
    /** Shortest distance between two segments. */
    distanceToSegment(other: Segment): number;
    /** Returns a new segment reversed (B→A). */
    reversed(): Segment;
    toString(): string;
}
declare function closestPointOnSegment(p: Vec3, a: Vec3, b: Vec3): Vec3;
declare function segmentSegmentClosest(a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): {
    pointA: Vec3;
    pointB: Vec3;
    t: number;
    u: number;
};

/**
 * Tekto OBB2D — Oriented Bounding Box in 2D space (minimum-area rectangle).
 *
 * Mirrors HDGEO.Core.OBB2D.
 */

declare class OBB2D {
    readonly center: Vec2;
    readonly width: number;
    readonly height: number;
    readonly angle: number;
    constructor(center: Vec2, width: number, height: number, angle: number);
    /** Unit direction along the width axis. */
    get axisU(): Vec2;
    /** Unit direction along the height axis. */
    get axisV(): Vec2;
    get area(): number;
    /** Returns the 4 corners of the rectangle (CCW order). */
    get corners(): [Vec2, Vec2, Vec2, Vec2];
    /** Tests whether a point lies inside the OBB. */
    contains(p: Vec2): boolean;
    toString(): string;
}

/**
 * Tekto Intersections — 2D and 3D intersection tests.
 *
 * Mirrors HDGEO.Core.Intersections.
 */

interface Intersect2DResult {
    t: number;
    u: number;
    point: Vec2;
}
declare const Intersections: {
    /**
     * Intersects a Ray with a line segment (A, B).
     * Returns the intersection point. If parallel/miss, returns midpoint of segment.
     */
    raySegment(rayOrigin: Vec3, rayDir: Vec3, pA: Vec3, pB: Vec3): Vec3;
    /**
     * Moller-Trumbore ray-triangle intersection.
     * Returns { t, u, v } if hit, or null if miss.
     */
    rayTriangle(rayOrigin: Vec3, rayDir: Vec3, v0: Vec3, v1: Vec3, v2: Vec3): {
        t: number;
        u: number;
        v: number;
    } | null;
    /**
     * Checks if a point P (assumed to be on the triangle plane) is inside ABC.
     * Uses the "Same Side" technique with cross products.
     */
    pointInTriangle3D(p: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean;
    /** Returns the closest point on segment AB to point P. */
    closestPointOnSegment(a: Vec3, b: Vec3, p: Vec3): Vec3;
    /**
     * Finds the closest points on two 3D lines (not segments).
     * Returns { c1, c2 }.
     */
    closestPointsLineLine(p1: Vec3, d1: Vec3, p2: Vec3, d2: Vec3): {
        c1: Vec3;
        c2: Vec3;
    };
    /** Intersects a ray with a plane. Returns { t, point } or null. */
    rayPlane(ray: Ray, plane: HPlane): {
        t: number;
        point: Vec3;
    } | null;
    /** Intersects a ray with a sphere. Returns { t1, t2 } or null. */
    raySphere(ray: Ray, sphere: Sphere): {
        t1: number;
        t2: number;
    } | null;
    /** Intersects a ray with an AABB. Returns { tMin, tMax } or null. */
    rayAABB(ray: Ray, box: AABB): {
        tMin: number;
        tMax: number;
    } | null;
    /**
     * Intersects two 2D line segments with full parameter info.
     * Returns { t, u, point } or null.
     */
    segmentIntersect2D(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Intersect2DResult | null;
    /** Intersects two 2D line segments, returns the point or null. */
    segmentSegment2D(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null;
    /** Intersects two infinite 2D lines. Returns point or null. */
    lineLine2D(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null;
    /** Intersects a 2D ray (origin + direction) with a segment. */
    raySegment2D(rayOrigin: Vec2, rayDir: Vec2, a: Vec2, b: Vec2): Vec2 | null;
    /** Intersects a 2D ray with an infinite line through a and b. */
    rayLine2D(rayOrigin: Vec2, rayDir: Vec2, lineA: Vec2, lineB: Vec2): Vec2 | null;
    /** Intersects a 2D segment with an infinite line. */
    segmentLine2D(segA: Vec2, segB: Vec2, lineA: Vec2, lineB: Vec2): Vec2 | null;
    /** Intersects two 2D rays (each defined by origin + direction). */
    rayRay2D(o1: Vec2, d1: Vec2, o2: Vec2, d2: Vec2): Vec2 | null;
    /** Intersects an infinite line with a circle. Returns 0, 1, or 2 intersection points. */
    circleLine(a: Vec2, b: Vec2, center: Vec2, radius: number): Vec2[];
    /** Intersect two circles. Returns 0, 1, or 2 intersection points. */
    circleCircle(c1x: number, c1y: number, r1: number, c2x: number, c2y: number, r2: number): [number, number][];
    /** Intersects a segment with a circle. Returns only points within the segment. */
    circleSegment(a: Vec2, b: Vec2, center: Vec2, radius: number): Vec2[];
    /** Intersects a line segment with a plane. Returns the hit point or null. */
    segmentPlane(a: Vec3, b: Vec3, plane: HPlane): Vec3 | null;
    /** Intersects an infinite line with a plane. Returns the hit point or null. */
    linePlane(a: Vec3, b: Vec3, plane: HPlane): Vec3 | null;
    /** Intersects two planes. Returns { point, direction } of the line, or null if parallel. */
    planePlane(p1: HPlane, p2: HPlane): {
        point: Vec3;
        direction: Vec3;
    } | null;
    /** Finds all intersection points of a 2D ray with a polygon's edges. */
    polygonRay2D(rayOrigin: Vec2, rayDir: Vec2, polygon: Vec2[]): Vec2[];
};

/**
 * Tekto Polygon2D — 2D polygon algorithms.
 *
 * Mirrors HDGEO.Core.Polygon2D.
 */

interface FilletResult {
    center: Vec2;
    radius: number;
    startAngle: number;
    sweepAngle: number;
    startPt: Vec2;
    endPt: Vec2;
}
declare const Polygon2D: {
    /** 2D cross product of vectors OA x OB */
    cross2D(o: Vec2, a: Vec2, b: Vec2): number;
    /** Signed area of a 2D polygon (positive if CCW, negative if CW). */
    signedArea(polygon: Vec2[]): number;
    /** Unsigned area. */
    area(polygon: Vec2[]): number;
    /** Total perimeter length. */
    perimeter(polygon: Vec2[]): number;
    /**
     * Total arc length of an open polyline (no implied closing edge).
     * Sums segment lengths between consecutive vertices.
     */
    polylineLength(polyline: Vec2[]): number;
    /**
     * Return `polygon` with the closing duplicate vertex stripped (open ring).
     * Only strips when the polygon has ≥3 vertices and its first/last vertices
     * coincide within `eps`. Always returns a fresh array.
     */
    openRing(polygon: Vec2[], eps?: number): Vec2[];
    /**
     * Return `polygon` with a closing duplicate vertex appended (closed ring).
     * Polygons with <3 vertices are returned as a fresh copy unchanged.
     * Always returns a fresh array.
     */
    closeRing(polygon: Vec2[], eps?: number): Vec2[];
    /** Returns true if polygon vertices are in counter-clockwise order. */
    isCCW(polygon: Vec2[]): boolean;
    /** Average center (centroid of vertices, fast but not area-weighted). */
    averageCenter(polygon: Vec2[]): Vec2;
    /** Area-weighted centroid (gravity center). */
    centroid2D(polygon: Vec2[]): Vec2;
    /** Point-in-polygon (ray casting, 2D). */
    pointInPolygon(point: Vec2, polygon: Vec2[]): boolean;
    /** Point-in-polygon test using winding number (robust for concave polygons). */
    containsWinding(polygon: Vec2[], point: Vec2): boolean;
    /** Index of the closest vertex to a point. */
    closestVertexIndex(polygon: Vec2[], point: Vec2): number;
    /** Closest point on the polygon boundary to a given point. Returns { point, edgeIndex }. */
    closestPointOnEdge(polygon: Vec2[], point: Vec2): {
        point: Vec2;
        edgeIndex: number;
    };
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
    closestPointOnPolyline(polyline: Vec2[], point: Vec2, opts?: {
        closed?: boolean;
    }): {
        point: Vec2;
        arcLength: number;
        segmentIndex: number;
        segmentT: number;
        distance: number;
    };
    /** Segment-segment intersection (2D), returns parameter t along first segment. */
    segmentIntersect2D(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): {
        t: number;
        u: number;
        point: Vec2;
    } | null;
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
    offset(polygon: Vec2[], distance: number): Vec2[];
    /**
     * Douglas-Peucker simplification — removes points closer than tolerance
     * to the line between their neighbors.
     */
    simplify(polygon: Vec2[], tolerance: number): Vec2[];
    /**
     * Removes vertices where the interior angle is close to 180°
     * (i.e. the vertex barely deviates from a straight line).
     */
    simplifyByAngle(polygon: Vec2[], minAngleRadians: number): Vec2[];
    /** Removes edges shorter than minLength by dropping one endpoint. */
    removeShortEdges(polygon: Vec2[], minLength: number): Vec2[];
    /** Subdivides every edge into n segments, producing n*vertexCount vertices. */
    subdivideEdges(polygon: Vec2[], subdivisions: number): Vec2[];
    /** Splits edges to ensure no edge is longer than maxLength. */
    splitLongEdges(polygon: Vec2[], maxLength: number): Vec2[];
    /**
     * Computes the best-fit normal for a 3D polygon using Newell's method.
     * Works for any number of vertices (not just triangles).
     */
    normal3D(polygon: Vec3[]): Vec3;
    /** Creates a regular polygon (circle approximation) with n sides. */
    createCircle(radius: number, segments: number): Vec2[];
    /** Creates a rectangle centered at origin. */
    createRect(width: number, height: number): Vec2[];
    /** Returns the polygon with reversed winding order. */
    reverse(polygon: Vec2[]): Vec2[];
    /**
     * Computes the fillet arc of given radius between two rays from a common origin.
     * Returns the arc center, tangent points, and oriented sweep angle.
     * The sweep is oriented so the arc passes through the interior
     * (the side facing the ray origin).
     */
    filletRays(origin: Vec2, angle1: number, angle2: number, radius: number): FilletResult;
    /** Convex hull (Andrew's monotone chain). Returns CCW-ordered hull points. */
    convexHull2D(points: Vec2[]): Vec2[];
    /** Ear-clipping triangulation for simple 2D polygons. */
    triangulate2D(polygon: Vec2[]): [number, number, number][];
    /** Minimum enclosing circle (Welzl's algorithm, randomized). */
    minEnclosingCircle(points: Vec2[]): {
        center: Vec2;
        radius: number;
    };
    /**
     * Computes the minimum-area oriented bounding rectangle of a point set.
     * Uses convex hull + edge-projection. O(n log n) total.
     */
    minAreaRect(points: Vec2[]): OBB2D;
};
/**
 * Compute the intersection of two simple polygons using Greiner-Hormann.
 * Returns an array of result polygons (intersection may be multiple regions).
 *
 * Inspired by Java's Area.intersect() — treats polygons as filled regions.
 */
declare function polygonIntersection(subjPoly: Vec2[], clipPoly: Vec2[]): Vec2[][];

/**
 * Tekto MeshAnalysis — Mesh measurement and processing algorithms.
 *
 * Mirrors HDGEO.Core.MeshAnalysis.
 */

declare const MeshAnalysis: {
    /** Compute mesh volume (for closed, consistent-winding triangle meshes) */
    meshVolume(mesh: ConnectedMesh): number;
    /** Compute mesh surface area */
    meshSurfaceArea(mesh: ConnectedMesh): number;
    /** Mesh centroid (vertex average) */
    meshCentroid(mesh: ConnectedMesh): Vec3;
    /** Laplacian smooth (moves each vertex toward the average of its neighbors) */
    laplacianSmooth(mesh: ConnectedMesh, iterations?: number, factor?: number): void;
    /** 3D Convex hull — returns a ConnectedMesh */
    convexHull3D(points: Vec3[]): ConnectedMesh;
};

/**
 * Tekto MeshFactory — Factory functions that produce ConnectedMesh instances.
 *
 * Mirrors HDGEO.Core.MeshFactory.
 */

declare const MeshFactory: {
    grid(width: number, depth: number, divisionsX: number, divisionsZ: number, heightFn?: (x: number, z: number) => number): ConnectedMesh;
    extrude(polygon: Vec3[], direction: Vec3, cap?: boolean): ConnectedMesh;
    revolve(profile: Vec2[], segments?: number, angleRange?: number): ConnectedMesh;
    loft(profiles: Vec3[][], closedProfile?: boolean): ConnectedMesh;
    box(width?: number, height?: number, depth?: number): ConnectedMesh;
    sphere(radius?: number, segments?: number, rings?: number): ConnectedMesh;
    cylinder(radiusTop?: number, radiusBottom?: number, height?: number, segments?: number, cap?: boolean): ConnectedMesh;
    torus(majorRadius?: number, minorRadius?: number, segments?: number, sides?: number): ConnectedMesh;
    /**
     * Create a tube mesh by sweeping a circular cross-section along a path.
     * Accepts uniform radius (number) or per-point varying radii (number[]).
     */
    pipe(path: Vec3[], radius: number | number[], sides?: number): ConnectedMesh;
    subdivide(mesh: ConnectedMesh): ConnectedMesh;
    triangulate(mesh: ConnectedMesh): ConnectedMesh;
};

/**
 * FlatMeshGen — procedural generators for `Mesh` (typed-array flat
 * mesh). The flat-mesh CLASS lives at `src/core/geometry/mesh/Mesh.ts`;
 * this file only holds the generators that haven't been ported into
 * `MeshFactory` yet.
 *
 * Public names in `src/index.ts`:
 *   FlatMeshGen      — generators (here)
 *   FlatMesh, RenderMesh — aliases of the `Mesh` class from `core/geometry/mesh/Mesh`
 */

declare const FlatMeshGen: {
    grid(width: number, depth: number, divsX: number, divsZ: number, heightFn?: (x: number, z: number) => number): Mesh & {
        update(hfn: (x: number, z: number) => number): void;
    };
    sphere(radius?: number, segments?: number, rings?: number): Mesh;
    box(width?: number, height?: number, depth?: number): Mesh;
    torus(majorR?: number, minorR?: number, segments?: number, sides?: number): Mesh;
    cylinder(radiusTop?: number, radiusBottom?: number, height?: number, segments?: number): Mesh;
    revolve(profile: Vec2[] | {
        x: number;
        y: number;
    }[], segments?: number): Mesh;
    subdivide(fm: Mesh): Mesh;
};

/**
 * Tekto MeshTransform — Geometric transformations on ConnectedMesh.
 *
 * Mirrors HDGEO.Core.MeshTransform.
 */

type Axis = "x" | "y" | "z";
declare const MeshTransform: {
    /** Applies an arbitrary 4x4 matrix to all vertex positions. */
    transform(mesh: ConnectedMesh, matrix: Mat4): void;
    /** Translates all vertices by an offset vector. */
    translate(mesh: ConnectedMesh, offset: Vec3): void;
    /** Uniform scale around origin. */
    scale(mesh: ConnectedMesh, factor: number): void;
    /** Non-uniform scale around origin. */
    scaleXYZ(mesh: ConnectedMesh, sx: number, sy: number, sz: number): void;
    /** Non-uniform scale around a center point. */
    scaleAbout(mesh: ConnectedMesh, sx: number, sy: number, sz: number, center: Vec3): void;
    /** Rotates the mesh around an axis through the origin. */
    rotate(mesh: ConnectedMesh, axis: Vec3, angleRadians: number): void;
    /** Rotates the mesh around an axis through a center point. */
    rotateAbout(mesh: ConnectedMesh, axis: Vec3, angleRadians: number, center: Vec3): void;
    /** Swaps two coordinate axes (e.g. Y↔Z for Z-up to Y-up conversion). */
    swapAxes(mesh: ConnectedMesh, a: Axis, b: Axis): void;
    /** Mirrors the mesh across a plane through the origin. */
    mirror(mesh: ConnectedMesh, axis: Axis): void;
    /** Reverses the winding order of all faces (flips normals). */
    flipFaces(mesh: ConnectedMesh): void;
    /**
     * Makes all face normals consistent using BFS flood-fill.
     * Picks an initial face and propagates its orientation to neighbors.
     */
    reorientFaces(mesh: ConnectedMesh): void;
    /** Moves the mesh so its bounding box center is at the origin. */
    centerAtOrigin(mesh: ConnectedMesh): void;
    /** Moves the mesh so its centroid (average of vertices) is at the origin. */
    centerAtCentroid(mesh: ConnectedMesh): void;
};

/**
 * Tekto MeshSubdivide — Subdivision and refinement operations on ConnectedMesh.
 *
 * Mirrors HDGEO.Core.MeshSubdivide.
 * Note: CatmullClark is in MeshFactory.subdivide().
 */

declare const MeshSubdivide: {
    /** Splits all edges longer than maxLength in a single pass. */
    splitLongEdges(mesh: ConnectedMesh, maxLength: number): void;
    /**
     * Iteratively subdivides the mesh until all edges are shorter than targetLength.
     */
    refineByEdgeLength(mesh: ConnectedMesh, targetLength: number, maxIterations?: number): void;
    /**
     * Doo-Sabin subdivision: each face shrinks toward its centroid, creating
     * new F-faces, E-faces (edge quads), and V-faces (vertex n-gons).
     */
    dooSabin(mesh: ConnectedMesh): void;
};

/**
 * Tekto MeshCleanup — Vertex merging and welding on ConnectedMesh.
 *
 * Mirrors HDGEO.Core.MeshCleanup.
 */

declare const MeshCleanup: {
    /** Merges vertices that have the exact same position (binary equality). */
    mergeIdenticalVertices(mesh: ConnectedMesh): void;
    /** Merges vertices that are within a certain distance of each other. */
    weldVertices(mesh: ConnectedMesh, threshold: number): void;
};

/**
 * Re-export shim — algorithms have moved to:
 *   - src/core/geometry/Polygon2D.ts  (2D polygon operations)
 *   - src/core/geometry/mesh/MeshAnalysis.ts  (mesh operations)
 *
 * Import from the new locations for new code.
 */
declare const Algo: {
    meshVolume(mesh: ConnectedMesh): number;
    meshSurfaceArea(mesh: ConnectedMesh): number;
    meshCentroid(mesh: ConnectedMesh): Vec3;
    laplacianSmooth(mesh: ConnectedMesh, iterations?: number, factor?: number): void;
    convexHull3D(points: Vec3[]): ConnectedMesh;
    cross2D(o: Vec2, a: Vec2, b: Vec2): number;
    signedArea(polygon: Vec2[]): number;
    area(polygon: Vec2[]): number;
    perimeter(polygon: Vec2[]): number;
    polylineLength(polyline: Vec2[]): number;
    openRing(polygon: Vec2[], eps?: number): Vec2[];
    closeRing(polygon: Vec2[], eps?: number): Vec2[];
    isCCW(polygon: Vec2[]): boolean;
    averageCenter(polygon: Vec2[]): Vec2;
    centroid2D(polygon: Vec2[]): Vec2;
    pointInPolygon(point: Vec2, polygon: Vec2[]): boolean;
    containsWinding(polygon: Vec2[], point: Vec2): boolean;
    closestVertexIndex(polygon: Vec2[], point: Vec2): number;
    closestPointOnEdge(polygon: Vec2[], point: Vec2): {
        point: Vec2;
        edgeIndex: number;
    };
    closestPointOnPolyline(polyline: Vec2[], point: Vec2, opts?: {
        closed?: boolean;
    }): {
        point: Vec2;
        arcLength: number;
        segmentIndex: number;
        segmentT: number;
        distance: number;
    };
    segmentIntersect2D(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): {
        t: number;
        u: number;
        point: Vec2;
    } | null;
    offset(polygon: Vec2[], distance: number): Vec2[];
    simplify(polygon: Vec2[], tolerance: number): Vec2[];
    simplifyByAngle(polygon: Vec2[], minAngleRadians: number): Vec2[];
    removeShortEdges(polygon: Vec2[], minLength: number): Vec2[];
    subdivideEdges(polygon: Vec2[], subdivisions: number): Vec2[];
    splitLongEdges(polygon: Vec2[], maxLength: number): Vec2[];
    normal3D(polygon: Vec3[]): Vec3;
    createCircle(radius: number, segments: number): Vec2[];
    createRect(width: number, height: number): Vec2[];
    reverse(polygon: Vec2[]): Vec2[];
    filletRays(origin: Vec2, angle1: number, angle2: number, radius: number): FilletResult;
    convexHull2D(points: Vec2[]): Vec2[];
    triangulate2D(polygon: Vec2[]): [number, number, number][];
    minEnclosingCircle(points: Vec2[]): {
        center: Vec2;
        radius: number;
    };
    minAreaRect(points: Vec2[]): OBB2D;
};

/**
 * Per-vertex principal curvature estimation via Taubin's tensor method.
 *
 * Reference: G. Taubin, "Estimating the Tensor of Curvature of a Surface from a
 * Polyhedral Approximation," ICCV 1995.
 *
 * For each vertex we accumulate a symmetric tensor over the one-ring, then
 * solve a closed-form 2×2 eigendecomposition in the tangent plane (the surface
 * normal is the third — trivial — eigenvector, so the full 3×3 Jacobi can be
 * skipped). This mirrors the tangent-plane trick used by HDGEO's
 * `StressVisualizer.ComputeTensorFields`.
 *
 * Output is a *line field*: principal directions are defined up to a 180° flip
 * (the eigensolver's per-vertex sign is arbitrary). Call `combDirections` to
 * make the field sign-consistent across the mesh before tracing streamlines.
 */

interface VertexCurvature {
    /** Principal curvature with larger (signed) value. */
    kMax: number;
    /** Principal curvature with smaller (signed) value. */
    kMin: number;
    /** Unit principal direction (in the tangent plane) corresponding to kMax. */
    dirMax: Vec3;
    /** Unit principal direction (in the tangent plane) corresponding to kMin. */
    dirMin: Vec3;
    /** (kMax + kMin) / 2 */
    meanCurvature: number;
    /** kMax * kMin */
    gaussCurvature: number;
    /** True if this vertex lies on a mesh boundary (open edge). Curvature is unreliable here. */
    isBoundary: boolean;
}
declare const Curvature: {
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
    taubin(mesh: ConnectedMesh): Map<number, VertexCurvature>;
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
    facePrincipalField(mesh: ConnectedMesh, curvatures: Map<number, VertexCurvature>, which: "max" | "min"): Map<number, Vec3>;
    /**
     * Make the principal direction field sign-consistent across the mesh by greedy
     * BFS. For each visited vertex, flip both `dirMax` and `dirMin` if their dot
     * with the corresponding direction of an already-visited neighbor is negative.
     *
     * Not globally optimal — seams will appear near umbilic / singular points.
     * Mutates `curvatures` in place.
     */
    combDirections(mesh: ConnectedMesh, curvatures: Map<number, VertexCurvature>): void;
};

/**
 * Face-based streamline tracer for a direction field defined on mesh faces.
 *
 * Ported from HDGEO's `MeshStreamlineTracer` (see
 * `HDGEO/src/HDGEO.Core/Geometry/Mesh/MeshStreamLineTracer.cs`).
 *
 * Algorithm: for each seed face, take an Euler step in the face's field
 * direction (smoothed against the previous step's heading to keep the curve
 * coherent across discontinuities), then walk across the edge into the next
 * face when the step exits. Trace both directions from the seed and join the
 * results into a single polyline.
 *
 * Caveats:
 *  - The field must be sign-aligned (combed) before tracing — otherwise the
 *    180° eigensolver flips will tear streamlines apart at every face boundary.
 *  - Quads are supported but treated as ABC-triangle for normal / inside-test
 *    purposes (consistent with HDGEO's approach).
 *  - Seeds are picked by integer stride over face ids; this is *not* the
 *    Jobard-Lefebvre evenly-spaced placement. A separation-distance pass can
 *    be added later if streamline density needs to be uniform across the mesh.
 */

interface StreamlineOptions {
    /** Maximum integration steps per direction (forward + backward each get this budget). */
    maxSteps?: number;
    /** Skip every `stride` face ids when seeding. Lower = denser. */
    stride?: number;
    /** Drop seeds whose field magnitude² is below this. */
    minMagSq?: number;
    /** Multiplier on the mesh's average edge length to set the Euler step. */
    stepFactor?: number;
    /** Lift each emitted point along the face normal by this fraction of edge length (anti-Z-fight). */
    liftFactor?: number;
}
declare const StreamlineTracer: {
    /**
     * Laplacian smoothing of a single polyline. Each interior point is moved
     * toward the midpoint of its two neighbors. The endpoints are fixed so the
     * curve doesn't shrink at the silhouette / boundary.
     *
     * Pass `iterations > 1` for stronger smoothing; `weight ∈ [0,1]` controls
     * per-iteration step. Point count is unchanged (good for plotters — output
     * length stays predictable).
     */
    smoothPolyline(points: Vec3[], iterations?: number, weight?: number): Vec3[];
    /**
     * Trace streamlines across a triangle/quad mesh given a per-face direction field.
     *
     * @param mesh           connected mesh
     * @param field          `Map<faceId, Vec3>` — direction (and magnitude) per face
     * @param options        tracing parameters
     * @returns              array of polylines (each polyline is Vec3[])
     */
    trace(mesh: ConnectedMesh, field: Map<number, Vec3>, options?: StreamlineOptions): Vec3[][];
};

/**
 * BSP (Binary Space Partition) Tree.
 *
 * Supports:
 *  - Autopartition BSP construction from convex polygons
 *  - CSG operations: union, subtract, intersect
 *  - Point classification: inside / outside / on
 *  - Front-to-back / back-to-front traversal for painter's algorithm
 *  - Mesh I/O: fromMesh / toMesh
 */

interface BspPolygon {
    vertices: Vec3[];
    plane: HPlane;
    /** Optional user data carried through splits (e.g. material, layer). */
    shared?: unknown;
}
/** BSP tree node. null children represent empty half-spaces. */
interface BspNode {
    plane: HPlane;
    front: BspNode | null;
    back: BspNode | null;
    coplanarFront: BspPolygon[];
    coplanarBack: BspPolygon[];
}
/** Create a BspPolygon from vertices, computing the plane automatically. */
declare function polygonFromVertices(vertices: Vec3[], shared?: unknown): BspPolygon;
type PointClassification = "inside" | "outside" | "on";
type TraversalCallback = (polygons: BspPolygon[]) => void;
declare class BspTree {
    root: BspNode | null;
    constructor(root: BspNode | null);
    /** Build a BSP tree from polygons. */
    static fromPolygons(polys: BspPolygon[]): BspTree;
    /** Build a BSP tree from an indexed triangle mesh. */
    static fromMesh(positions: Float32Array, indices: Uint32Array): BspTree;
    /** Collect all polygons in the tree. */
    toPolygons(): BspPolygon[];
    /** Triangulate all polygons and return as typed arrays (shared vertices). */
    toMesh(): {
        positions: Float32Array;
        indices: Uint32Array;
    };
    /** Triangulate with flat (per-face) normals — ready for rendering.
     *  No vertex deduplication; each triangle gets its own 3 vertices + normal. */
    toFlatMesh(): {
        positions: Float32Array;
        normals: Float32Array;
        indices: Uint32Array;
    };
    /** Deep clone. */
    clone(): BspTree;
    /** Flip solid inside/outside. */
    invert(): BspTree;
    /** Classify a point relative to the solid. */
    classifyPoint(point: Vec3): PointClassification;
    /** Visit polygons front-to-back from the given eye position. */
    traverseFrontToBack(eye: Vec3, visit: TraversalCallback): void;
    /** Visit polygons back-to-front from the given eye position (painter's order). */
    traverseBackToFront(eye: Vec3, visit: TraversalCallback): void;
    /** Return a new tree representing the union of a and b. */
    static union(a: BspTree, b: BspTree): BspTree;
    /** Return a new tree representing a with b subtracted. */
    static subtract(a: BspTree, b: BspTree): BspTree;
    /** Return a new tree representing the intersection of a and b. */
    static intersect(a: BspTree, b: BspTree): BspTree;
}

/**
 * Tekto Curves — Parametric curve types.
 *
 * Mirrors HDGEO.Core.Curves.
 */

/** Parametric curve where t is normalized [0..1]. */
interface ICurve {
    getPoint(t: number): Vec3;
    getTangent(t: number): Vec3;
}
/** Curve that supports distance-based queries (arc length). */
interface IMetricCurve extends ICurve {
    readonly length: number;
    getTFromDistance(distance: number): number;
    getPointAtDistance(distance: number): Vec3;
}
declare class LineCurve implements IMetricCurve {
    start: Vec3;
    end: Vec3;
    constructor(start: Vec3, end: Vec3);
    get length(): number;
    getTFromDistance(distance: number): number;
    getPoint(t: number): Vec3;
    getTangent(_t: number): Vec3;
    getPointAtDistance(distance: number): Vec3;
}
declare class ArcCurve implements IMetricCurve {
    center: Vec3;
    radius: number;
    startAngle: number;
    sweepAngle: number;
    normal: Vec3;
    forward: Vec3;
    constructor(center: Vec3, radius: number, startAngle: number, sweepAngle: number, normal: Vec3);
    get length(): number;
    getTFromDistance(distance: number): number;
    getPoint(t: number): Vec3;
    getTangent(t: number): Vec3;
    getPointAtDistance(distance: number): Vec3;
}
/**
 * Helical curve in the XY plane with Z height.
 * Generalizes a circular arc (when startZ === endZ) to a helix
 * with linear Z interpolation along the sweep.
 */
declare class HelixCurve implements IMetricCurve {
    center: Vec3;
    radius: number;
    startAngle: number;
    sweepAngle: number;
    startZ: number;
    endZ: number;
    constructor(center: Vec3, radius: number, startAngle: number, sweepAngle: number, startZ: number, endZ: number);
    get length(): number;
    getTFromDistance(distance: number): number;
    getPoint(t: number): Vec3;
    getTangent(t: number): Vec3;
    getPointAtDistance(distance: number): Vec3;
}
declare class CubicBezierCurve implements IMetricCurve {
    p0: Vec3;
    p1: Vec3;
    p2: Vec3;
    p3: Vec3;
    private cache;
    constructor(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3);
    updateControlPoints(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): void;
    getPoint(t: number): Vec3;
    getTangent(t: number): Vec3;
    get length(): number;
    getTFromDistance(distance: number): number;
    getPointAtDistance(distance: number): Vec3;
}
declare class NurbsCurve implements IMetricCurve {
    controlPoints: Vec3[];
    degree: number;
    knots: number[];
    weights?: number[] | undefined;
    private cache;
    constructor(controlPoints: Vec3[], degree: number, knots: number[], weights?: number[] | undefined);
    getPoint(t: number): Vec3;
    getTangent(t: number): Vec3;
    get length(): number;
    getTFromDistance(distance: number): number;
    getPointAtDistance(distance: number): Vec3;
    private evaluateDeBoor;
    private findKnotSpan;
}
declare class PolylineCurve implements IMetricCurve {
    private points;
    private accumulatedLengths;
    private _totalLength;
    constructor(points: Vec3[]);
    get length(): number;
    getTFromDistance(distance: number): number;
    getPoint(t: number): Vec3;
    getTangent(t: number): Vec3;
    getPointAtDistance(distance: number): Vec3;
}
declare const CurveUtils: {
    /** Returns exactly 'count' points distributed along the curve. */
    divideByCount(curve: ICurve, count: number): Vec3[];
    /** Steps along the curve by exactly 'segmentLength'. */
    divideByFixedLength(curve: IMetricCurve, segmentLength: number): Vec3[];
    /** Divides curve with segments roughly equal to targetLength (all equal). */
    divideByTargetLength(curve: IMetricCurve, targetLength: number): Vec3[];
    /** Evaluate one component of a cubic Bezier at parameter t. */
    cubicEval(p0: number, p1: number, p2: number, p3: number, t: number): number;
    /** Extract sub-curve [tStart, tEnd] from a cubic Bezier via De Casteljau. */
    splitCubic(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, tStart: number, tEnd: number): CubicBezierCurve;
    /** Binary search for parameter t where curve.getPoint(t)[component] ~ target. Assumes monotonic. */
    findTForComponent(curve: {
        getPoint(t: number): Vec3;
    }, target: number, component: "x" | "y" | "z", iterations?: number): number;
    /** Unroll a 3D polyline into a flat elevation profile: X = cumulative XY arc length, Z = original height. */
    unrollPolyline(pts: Vec3[], yOffset?: number): Vec3[];
    /** Find the unrolled X position for a 3D point projected onto a polyline's XY footprint. */
    findUnrollX(polyline: Vec3[], pt: Vec3): number;
    /**
     * Compute rotation-minimizing (parallel transport) frames along a polyline path.
     * Returns one frame per path point: tangent T, normal U, binormal V (all unit vectors).
     */
    parallelTransportFrames(path: Vec3[]): {
        tangent: Vec3;
        normal: Vec3;
        binormal: Vec3;
    }[];
    /**
     * Constructs a circular arc starting at p1 with the given tangent direction,
     * ending at p2. The arc lies in the XY plane (Z = 0).
     *
     * Finds the center at the intersection of:
     *  - the perpendicular to the tangent at p1
     *  - the perpendicular bisector of chord p1→p2
     */
    arcFromPointTangentPoint(p1: Vec2, tangent: Vec2, p2: Vec2): ArcCurve;
};

/**
 * Tekto Surfaces — Parametric NURBS surface (tensor-product rational B-spline).
 *
 * Companion to NurbsCurve. A NurbsSurface is defined by a 2D control grid
 * controlPoints[uIdx][vIdx] together with degrees (degreeU, degreeV),
 * knot vectors (knotsU, knotsV), and optional weights (same shape as the grid).
 *
 * Evaluation uses rational De Boor in homogeneous form so revolved surfaces
 * (which need weight = 1/√2 at corner control points) are geometrically exact.
 */

/** Build a clamped uniform knot vector with `numCtrl` control points and given degree. */
declare function clampedUniformKnots(numCtrl: number, degree: number): number[];
declare class NurbsSurface {
    controlPoints: Vec3[][];
    degreeU: number;
    degreeV: number;
    knotsU: number[];
    knotsV: number[];
    weights?: number[][] | undefined;
    /**
     * @param controlPoints  controlPoints[uIdx][vIdx], size (nU+1) × (nV+1)
     * @param degreeU        degree in the u-direction
     * @param degreeV        degree in the v-direction
     * @param knotsU         length must equal controlPoints.length + degreeU + 1
     * @param knotsV         length must equal controlPoints[0].length + degreeV + 1
     * @param weights        optional, same shape as controlPoints (defaults to all 1)
     */
    constructor(controlPoints: Vec3[][], degreeU: number, degreeV: number, knotsU: number[], knotsV: number[], weights?: number[][] | undefined);
    /** Evaluate the surface at (u, v), both normalized to [0, 1]. */
    getPoint(u: number, v: number): Vec3;
    /** Outward normal at (u, v) via finite differences in parameter space. */
    getNormal(u: number, v: number): Vec3;
    /**
     * Tessellate the surface into a ConnectedMesh by sampling on a (uDivs × vDivs) grid.
     * `closedU` / `closedV` merge the seam (use closedU=true for surfaces from `revolve`).
     */
    toMesh(uDivs?: number, vDivs?: number, closedU?: boolean, closedV?: boolean): ConnectedMesh;
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
    static loft(curves: NurbsCurve[], degreeU?: number): NurbsSurface;
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
    static revolve(profile: NurbsCurve, axisOrigin?: Vec3, axisDir?: Vec3): NurbsSurface;
    private evaluate;
}

interface SunPositionInput {
    /**
     * UTC date+time. The algorithm internally converts to Julian Date in
     * UT, so make sure the `Date` carries UTC fields (a `new Date()` is
     * fine — `getUTC*()` methods are used).
     */
    date: Date;
    /** Latitude in degrees, north positive. e.g. Zurich = +47.37. */
    latitude: number;
    /** Longitude in degrees, east positive. e.g. Zurich = +8.55. */
    longitude: number;
}
interface SunPositionResult {
    /** Solar altitude above horizon (radians). Negative ⇒ below horizon (night). */
    altitude: number;
    /**
     * Solar azimuth from north, clockwise (radians).
     * 0 = N, π/2 = E, π = S, 3π/2 = W.
     */
    azimuth: number;
    /**
     * Unit vector pointing FROM the origin TO the sun, in Z-up scene
     * coordinates (+X = east, +Y = north, +Z = up). When daytime, this
     * is the direction a directional light "comes from" — set the light
     * position to `direction × distance` and aim it at the origin.
     */
    direction: Vec3;
    /** Convenience: `altitude > 0`. */
    isDaytime: boolean;
}
declare const SunPosition: {
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
    readonly compute: (opts: SunPositionInput) => SunPositionResult;
};

/**
 * Tekto Graph — Weighted graph with Dijkstra, components, flood fill.
 *
 * Mirrors HDGEO.Core.Graph + GridGraph.
 */
declare class Graph {
    getNeighbors: (node: number) => number[];
    getWeight: (a: number, b: number) => number;
    nodeCount: number;
    constructor(nodeCount: number, getNeighbors: (node: number) => number[], getWeight?: (a: number, b: number) => number);
    dijkstra(source: number): {
        dist: Float64Array;
        pred: Int32Array;
    };
    dijkstraFromSources(sources: number[]): {
        dist: Float64Array;
        pred: Int32Array;
    };
    dijkstraFromDistances(startDist: Float64Array): {
        dist: Float64Array;
        pred: Int32Array;
    };
    shortestPath(source: number, target: number): number[];
    static tracePath(pred: Int32Array, target: number): number[];
    dijkstraVoronoi(sources: number[]): {
        dist: Float64Array;
        pred: Int32Array;
        closest: Int32Array;
    };
    connectedComponents(): number[][];
    componentLabels(): Int32Array;
    floodFill(seeds: number[], maxDistance?: number): number[];
    floodFillPredicate(seed: number, predicate: (node: number) => boolean): number[];
    degrees(): Int32Array;
    leafNodes(): number[];
    junctionNodes(): number[];
    eccentricity(node: number): number;
    diameter(): number;
    static fromAdjacencyList(adjacency: number[][], weightFn?: (a: number, b: number) => number): Graph;
    static fromEdgeList(nodeCount: number, edges: [number, number][], undirected?: boolean, weightFn?: (a: number, b: number) => number): Graph;
}
declare const GridGraph: {
    /** Creates a 2D 4-connected grid graph (N/S/E/W neighbors). */
    grid2D4(nx: number, ny: number, weightFn?: (a: number, b: number) => number): Graph;
    /** Creates a 2D 8-connected grid graph (includes diagonals). */
    grid2D8(nx: number, ny: number, weightFn?: (a: number, b: number) => number): Graph;
    /** Creates a 3D 6-connected voxel grid graph (face neighbors only). */
    grid3D6(nx: number, ny: number, nz: number, weightFn?: (a: number, b: number) => number): Graph;
};

/**
 * Tekto PlanarGraph — 2D planar graph based on a doubly-connected edge list (DCEL).
 *
 * Ports HDGEO.Core.Geometry.PlanarGraph (PlanarGraph.cs, PlanarGraphRepair.cs, PlanarGraphCleanup.cs).
 *
 * Supports:
 *   - Building valid planar graphs from raw line segments
 *   - Angle-based radial edge ordering at vertices
 *   - Face construction via half-edge loop traversal
 *   - Cleanup: dead-end removal, linear vertex dissolution
 */

/** Vertex in a 2D planar graph (DCEL). */
declare class PGVertex {
    position: Vec2;
    edge: PGHalfEdge | null;
    tag: number;
    constructor(position: Vec2);
    get isIsolated(): boolean;
    get degree(): number;
    outgoingEdges(): IterableIterator<PGHalfEdge>;
    neighbors(): IterableIterator<PGVertex>;
    getEdgeTo(dest: PGVertex): PGHalfEdge | null;
    isNeighbor(other: PGVertex): boolean;
}
/** Half-edge in a 2D planar graph (DCEL). */
declare class PGHalfEdge {
    origin: PGVertex;
    twin: PGHalfEdge;
    next: PGHalfEdge;
    face: PGFace | null;
    tag: number;
    get destination(): PGVertex;
    get nextAtOrigin(): PGHalfEdge;
    get prevAtOrigin(): PGHalfEdge;
    get prev(): PGHalfEdge;
    get direction(): Vec2;
    get midpoint(): Vec2;
    get length(): number;
    get angle(): number;
    get isSingle(): boolean;
}
/** Face in a 2D planar graph (DCEL). */
declare class PGFace {
    edge: PGHalfEdge;
    tag: number;
    color: [number, number, number, number] | null;
    edges(): IterableIterator<PGHalfEdge>;
    vertices(): IterableIterator<PGVertex>;
    polygon(): Vec2[];
    get edgeCount(): number;
    signedArea(): number;
    get isCCW(): boolean;
}
declare class PlanarGraph {
    readonly vertices: PGVertex[];
    readonly halfEdges: PGHalfEdge[];
    readonly faces: PGFace[];
    private _removed;
    addVertex(position: Vec2): PGVertex;
    addEdge(from: PGVertex, to: PGVertex): PGHalfEdge;
    createEdgePair(from: PGVertex, to: PGVertex): PGHalfEdge;
    attach(h: PGHalfEdge): void;
    detach(h: PGHalfEdge): void;
    removeEdge(h: PGHalfEdge): void;
    flushRemovals(): void;
    buildFaces(): void;
    clearFaces(): void;
    removeNegativeFaces(removeNegative?: boolean): void;
    getUniqueEdges(): PGHalfEdge[];
    findClosestVertex(point: Vec2, tolerance: number): PGVertex | null;
    getBounds(): {
        min: Vec2;
        max: Vec2;
    };
    clearTags(): void;
    /** Edge positions as Vec3 pairs on the XZ ground plane (Y-up). */
    getEdgePositions3D(): Vec3[];
    /**
     * Creates a flat Mesh from CCW faces on the XZ ground plane.
     * Uses ear-clipping triangulation (handles non-convex faces correctly).
     * Optional per-face color callback.
     */
    toFlatMesh(faceColor?: (face: PGFace, index: number) => [number, number, number, number]): Mesh;
}
declare const PlanarGraphRepair: {
    /** Creates a valid planar graph from line segments. */
    fromSegments(segments: {
        a: Vec2;
        b: Vec2;
    }[], tolerance: number): PlanarGraph;
};
declare const PlanarGraphCleanup: {
    /** Iteratively removes degree-1 vertices (dead ends). */
    removeDeadEnds(graph: PlanarGraph): void;
    /** Dissolves degree-2 vertices with collinear edges. */
    removeLinearVertices(graph: PlanarGraph, angleTolerance?: number): void;
    /** Removes edges where both sides belong to the same face. */
    removeEdgesWithSameFace(graph: PlanarGraph): void;
    /** Removes inner edges (both sides are bounded faces). */
    removeInnerEdges(graph: PlanarGraph): void;
};
declare const Delaunay2D: {
    /** Triangulates 2D points and returns a PlanarGraph with Delaunay faces. */
    triangulate(points: Vec2[]): PlanarGraph;
};

/**
 * Tekto Voxel — 2D/3D scalar grids, marching squares/cubes, flood fill,
 * distance transforms, and blob detection.
 *
 * Mirrors HDGEO.Core.Voxel.
 */

declare class VoxelGrid2D {
    values: Float32Array;
    nx: number;
    ny: number;
    x1: number;
    y1: number;
    cellSize: number;
    constructor(nx: number, ny: number, cellSize?: number, x1?: number, y1?: number);
    static fromBounds(min: Vec2, max: Vec2, cellSize: number): VoxelGrid2D;
    static fromResolution(min: Vec2, max: Vec2, resolution: number): VoxelGrid2D;
    getIndex(x: number, y: number): number;
    get(x: number, y: number): number;
    set(x: number, y: number, value: number): void;
    getPosition(x: number, y: number): Vec2;
    getVoxelCoord(worldPos: Vec2): {
        x: number;
        y: number;
    };
    fillFromFunction(fn: (pos: Vec2) => number): void;
    clear(value?: number): void;
    offset(amount: number): void;
    blur(radius: number): void;
    getRange(): {
        min: number;
        max: number;
    };
    clone(): VoxelGrid2D;
}
declare class VoxelGrid {
    values: Float32Array;
    nx: number;
    ny: number;
    nz: number;
    x1: number;
    y1: number;
    z1: number;
    cellSize: number;
    constructor(nx: number, ny: number, nz: number, cellSize?: number, x1?: number, y1?: number, z1?: number);
    static fromBounds(min: Vec3, max: Vec3, cellSize: number): VoxelGrid;
    static fromResolution(min: Vec3, max: Vec3, resolution: number): VoxelGrid;
    getIndex(x: number, y: number, z: number): number;
    get(x: number, y: number, z: number): number;
    set(x: number, y: number, z: number, value: number): void;
    getPosition(x: number, y: number, z: number): Vec3;
    getVoxelCoord(worldPos: Vec3): {
        x: number;
        y: number;
        z: number;
    };
    fillFromSdf(sdf: {
        distance(p: Vec3): number;
    }): void;
    fillFromFunction(fn: (pos: Vec3) => number): void;
    clear(value?: number): void;
    union(sdf: {
        distance(p: Vec3): number;
    }): void;
    subtract(sdf: {
        distance(p: Vec3): number;
    }): void;
    intersect(sdf: {
        distance(p: Vec3): number;
    }): void;
    offset(amount: number): void;
    blur(radius: number): void;
    getRange(): {
        min: number;
        max: number;
    };
    clone(): VoxelGrid;
}
declare const MarchingSquares: {
    extract(values: ArrayLike<number>, nx: number, ny: number, iso?: number, cellSize?: number, originX?: number, originY?: number): {
        a: Vec2;
        b: Vec2;
    }[];
    extractFromGrid(grid: VoxelGrid2D, iso?: number): {
        a: Vec2;
        b: Vec2;
    }[];
};
declare const MarchingCubes: {
    extract(grid: VoxelGrid, iso?: number): ConnectedMesh;
};
declare const FloodFill: {
    fill2D(grid: VoxelGrid2D, seeds: {
        x: number;
        y: number;
    }[], targetSign?: number): void;
    fill3D(grid: VoxelGrid, seeds: {
        x: number;
        y: number;
        z: number;
    }[], targetSign?: number): void;
};
declare const DistanceTransform: {
    compute2D(grid: VoxelGrid2D, d1?: number, d2?: number): void;
    compute2DWithLabels(grid: VoxelGrid2D, labels: Int32Array, d1?: number, d2?: number): void;
    compute3D(grid: VoxelGrid, d1?: number, d2?: number, d3?: number): void;
    compute3DWithLabels(grid: VoxelGrid, labels: Int32Array, d1?: number, d2?: number, d3?: number): void;
};
declare const BlobDetect: {
    labelComponents2D(grid: VoxelGrid2D, threshold?: number): {
        labels: Int32Array;
        blobCount: number;
    };
    traceContours2D(grid: VoxelGrid2D, threshold?: number): {
        x: number;
        y: number;
    }[][];
};
/**
 * Discrete 2D shadow-casting visibility analysis (isovist).
 * For each viewpoint, casts in 4 cardinal directions using Bresenham line-steppers
 * as visibility cone boundaries. Obstacles split the cone, creating shadows.
 *
 * Mirrors HDGEO.Core.Voxel.PixelView.
 */
declare const PixelView: {
    /**
     * Computes visibility from a single viewpoint, incrementing the result grid
     * for each visible cell (both open and obstacle cells).
     * @param obstacles Grid where values <= 0 are obstacles, > 0 are open.
     * @param result Grid to increment for each visible cell (same dimensions).
     * @param x Viewpoint X (grid coords).
     * @param y Viewpoint Y (grid coords).
     */
    analyse(obstacles: VoxelGrid2D, result: VoxelGrid2D, x: number, y: number): void;
    /**
     * Computes visibility from every non-obstacle cell, accumulating total visibility
     * counts. Result cells with higher values are visible from more viewpoints.
     */
    analyseAll(obstacles: VoxelGrid2D, result: VoxelGrid2D): void;
};

/**
 * Tekto SDF — Signed Distance Fields: primitives, boolean/smooth ops,
 * modifiers, lattices, microstructures, and utilities.
 *
 * Mirrors HDGEO.Core.SDF.
 */

interface ISdf {
    distance(point: Vec3): number;
}
declare class SdfSphere implements ISdf {
    radius: number;
    center: Vec3;
    constructor(radius: number, center?: Vec3);
    distance(p: Vec3): number;
}
declare class SdfBox implements ISdf {
    halfExtents: Vec3;
    center: Vec3;
    constructor(halfExtents: Vec3, center?: Vec3);
    static fromSize(sx: number, sy: number, sz: number): SdfBox;
    distance(p: Vec3): number;
}
declare class SdfCapsule implements ISdf {
    a: Vec3;
    b: Vec3;
    radius: number;
    constructor(a: Vec3, b: Vec3, radius: number);
    distance(p: Vec3): number;
}
declare class SdfCylinder implements ISdf {
    a: Vec3;
    b: Vec3;
    radius: number;
    constructor(a: Vec3, b: Vec3, radius: number);
    static vertical(height: number, radius: number): SdfCylinder;
    distance(p: Vec3): number;
}
declare class SdfCone implements ISdf {
    a: Vec3;
    b: Vec3;
    radiusA: number;
    radiusB: number;
    constructor(a: Vec3, b: Vec3, radiusA: number, radiusB: number);
    distance(p: Vec3): number;
}
declare class SdfTorus implements ISdf {
    majorRadius: number;
    minorRadius: number;
    constructor(majorRadius: number, minorRadius: number);
    distance(p: Vec3): number;
}
declare class SdfEllipsoid implements ISdf {
    radii: Vec3;
    constructor(radii: Vec3);
    distance(p: Vec3): number;
}
declare class SdfPlane implements ISdf {
    normal: Vec3;
    d: number;
    constructor(normal: Vec3, dOrPoint: number | Vec3);
    distance(p: Vec3): number;
}
declare class SdfLine implements ISdf {
    a: Vec3;
    b: Vec3;
    constructor(a: Vec3, b: Vec3);
    distance(p: Vec3): number;
}
declare class SdfUnion implements ISdf {
    children: ISdf[];
    constructor(...children: ISdf[]);
    distance(p: Vec3): number;
}
declare class SdfIntersect implements ISdf {
    children: ISdf[];
    constructor(...children: ISdf[]);
    distance(p: Vec3): number;
}
declare class SdfSubtract implements ISdf {
    a: ISdf;
    b: ISdf;
    constructor(a: ISdf, b: ISdf);
    distance(p: Vec3): number;
}
declare class SdfBlend implements ISdf {
    a: ISdf;
    b: ISdf;
    radius: number;
    constructor(a: ISdf, b: ISdf, radius?: number);
    distance(p: Vec3): number;
}
declare class SdfSmoothSubtract implements ISdf {
    a: ISdf;
    b: ISdf;
    radius: number;
    constructor(a: ISdf, b: ISdf, radius?: number);
    distance(p: Vec3): number;
}
declare class SdfSmoothUnion implements ISdf {
    a: ISdf;
    b: ISdf;
    k: number;
    constructor(a: ISdf, b: ISdf, k?: number);
    distance(p: Vec3): number;
}
declare class SdfShell implements ISdf {
    input: ISdf;
    thickness: number;
    constructor(input: ISdf, thickness?: number);
    distance(p: Vec3): number;
}
declare class SdfOnion implements ISdf {
    input: ISdf;
    thickness: number;
    layers: number;
    constructor(input: ISdf, thickness: number, layers?: number);
    distance(p: Vec3): number;
}
declare class SdfTwist implements ISdf {
    input: ISdf;
    anglePerUnit: number;
    z1: number;
    z2: number;
    constructor(input: ISdf, anglePerUnit: number, z1?: number, z2?: number);
    distance(p: Vec3): number;
}
declare class SdfRevolution implements ISdf {
    input: ISdf;
    constructor(input: ISdf);
    distance(p: Vec3): number;
}
declare class SdfExtrude implements ISdf {
    input: ISdf;
    constructor(input: ISdf);
    distance(p: Vec3): number;
}
declare class SdfBoundedExtrude implements ISdf {
    input: ISdf;
    halfHeight: number;
    constructor(input: ISdf, height: number);
    distance(p: Vec3): number;
}
declare class SdfMirror implements ISdf {
    input: ISdf;
    normal: Vec3;
    constructor(input: ISdf, planeNormal: Vec3);
    distance(p: Vec3): number;
}
declare class SdfRadialArray implements ISdf {
    input: ISdf;
    count: number;
    private deltaAngle;
    constructor(input: ISdf, count: number);
    distance(p: Vec3): number;
}
declare class SdfTransform implements ISdf {
    input: ISdf;
    private inverse;
    constructor(input: ISdf, transform: Mat4);
    setTransform(transform: Mat4): void;
    distance(p: Vec3): number;
}
declare class SdfOffset implements ISdf {
    input: ISdf;
    amount: number;
    constructor(input: ISdf, amount: number);
    distance(p: Vec3): number;
}
declare class SdfGradient implements ISdf {
    a: ISdf;
    b: ISdf;
    factor: number;
    constructor(a: ISdf, b: ISdf, factor?: number);
    distance(p: Vec3): number;
}
declare class SdfVoronoi implements ISdf {
    offset: number;
    children: ISdf[];
    constructor(offset?: number);
    distance(p: Vec3): number;
}
type LatticeType = "schwarz" | "gyroid" | "diamond" | "lidinoid" | "neovius" | "fischerKoch" | "frd" | "doubleDiamond" | "doubleGyroid" | "s";
declare class SdfLattice implements ISdf {
    type: LatticeType;
    scale: number;
    offset: number;
    shell: boolean;
    constructor(type?: LatticeType, scale?: number, offset?: number, shell?: boolean);
    distance(p: Vec3): number;
}
type MicroPatternType = "bigX" | "grid" | "star" | "cross" | "octagon" | "octet" | "vintile" | "dual" | "interlock" | "isotrop";
declare class SdfMicrostructure implements ISdf {
    cellSize: number;
    strutRadius: number;
    pattern: MicroPatternType;
    private struts;
    constructor(cellSize?: number, strutRadius?: number, pattern?: MicroPatternType);
    distance(p: Vec3): number;
}
declare const SdfUtils: {
    gradient(sdf: ISdf, p: Vec3, epsilon?: number): Vec3;
    rayMarch(sdf: ISdf, origin: Vec3, direction: Vec3, maxDistance?: number, tolerance?: number, maxSteps?: number): {
        hitPoint: Vec3;
        distance: number;
    } | null;
    surfaceNormal(sdf: ISdf, p: Vec3, projectionSteps?: number, epsilon?: number): Vec3;
    projectToSurface(sdf: ISdf, p: Vec3, maxSteps?: number, epsilon?: number): Vec3;
    estimateCurvature(sdf: ISdf, p: Vec3, epsilon?: number): number;
    ambientOcclusion(sdf: ISdf, surfacePoint: Vec3, normal: Vec3, samples?: number, maxDistance?: number): number;
};
declare const SdfOps: {
    translate(sdf: ISdf, x: number, y: number, z: number): ISdf;
    rotateX(sdf: ISdf, radians: number): ISdf;
    rotateY(sdf: ISdf, radians: number): ISdf;
    rotateZ(sdf: ISdf, radians: number): ISdf;
    scale(sdf: ISdf, factor: number): ISdf;
    union(a: ISdf, b: ISdf): ISdf;
    intersect(a: ISdf, b: ISdf): ISdf;
    subtract(a: ISdf, b: ISdf): ISdf;
    blend(a: ISdf, b: ISdf, radius?: number): ISdf;
    shell(sdf: ISdf, thickness: number): ISdf;
    round(sdf: ISdf, radius: number): ISdf;
    mirror(sdf: ISdf, normal: Vec3): ISdf;
    twist(sdf: ISdf, anglePerUnit: number): ISdf;
    revolve(sdf: ISdf): ISdf;
};

/**
 * Tekto Capsule2D — A 2D capsule (stadium) shape.
 *
 * Defined by a center, half-length, radius, and angle.
 * The shape is the Minkowski sum of a line segment and a disk.
 *
 * Useful for: rigid body simulation, collision detection, hit testing.
 */

declare class Capsule2D {
    /** Center position */
    center: Vec2;
    /** Half the internal segment length */
    halfLength: number;
    /** Endcap / tube radius */
    radius: number;
    /** Rotation angle (radians) */
    angle: number;
    constructor(
    /** Center position */
    center: Vec2, 
    /** Half the internal segment length */
    halfLength: number, 
    /** Endcap / tube radius */
    radius: number, 
    /** Rotation angle (radians) */
    angle?: number);
    /** The two endpoint centers of the internal segment. */
    get endpoints(): [Vec2, Vec2];
    /** Full length including endcaps. */
    get totalLength(): number;
    /** Approximate area. */
    get area(): number;
    /** Approximate mass (proportional to area). */
    get mass(): number;
    /** Approximate moment of inertia about center. */
    get inertia(): number;
    /** Three grab handles: endA, center, endB. */
    get handles(): [Vec2, Vec2, Vec2];
    /** Closest point on the internal segment to a world point. */
    closestSegmentPoint(p: Vec2): Vec2;
    /** Signed distance from capsule surface to a point. Negative = inside. */
    distToPoint(p: Vec2): number;
    /** Test if a point is inside the capsule. */
    containsPoint(p: Vec2): boolean;
    /** Hit-test handles first (rotation priority), then body (translate). */
    hitTest(p: Vec2, handleRadius: number): {
        type: "endA" | "center" | "endB";
    } | null;
    /** Clone with optional overrides. */
    clone(): Capsule2D;
}

/**
 * Tekto Physics — Spring-mass simulation with truss support, hinge springs,
 * force clamping, velocity damping, and floor collision.
 *
 * Mirrors HDGEO.Core.Physics.SpringSystem3DHinge.
 */

interface Spring {
    i: number;
    j: number;
    restLength: number;
    k: number;
}
declare class SpringSystem3D {
    pos: Vec3[];
    vel: Vec3[];
    invMass: Float32Array;
    springs: Spring[];
    gravity: Vec3;
    floorPlane: HPlane;
    globalVelDamping: number;
    useGlobalStiffness: boolean;
    globalStiffness: number;
    globalDamping: number;
    stiffnessStrut: number;
    stiffnessShear: number;
    stiffnessHinge: number;
    maxForce: number;
    initFromMesh(mesh: ConnectedMesh, trussThickness?: number, useHinges?: boolean): void;
    private computeSmoothNormals;
    private addBendingSprings;
    private getOppositeVertex;
    addSpring(i: number, j: number, k?: number): void;
    pin(index: number): void;
    unpin(index: number): void;
    step(dt: number, substeps?: number): void;
    updateMesh(mesh: ConnectedMesh): void;
}

/**
 * Tekto RigidBody2D — 2D rigid body with capsule shape.
 *
 * 3 DOF: position (x,y), angle.
 * Supports force/torque application at world-space points,
 * velocity integration, and box constraint with angular impulse.
 */

interface RigidBodyConfig {
    damping?: number;
    angularDamping?: number;
    wallRestitution?: number;
}
declare class RigidBody2D {
    shape: Capsule2D;
    vx: number;
    vy: number;
    va: number;
    mass: number;
    inertia: number;
    private cfg;
    constructor(shape: Capsule2D, config?: RigidBodyConfig);
    get x(): number;
    set x(v: number);
    get y(): number;
    set y(v: number);
    get angle(): number;
    set angle(v: number);
    get position(): Vec2;
    set position(v: Vec2);
    /**
     * Apply a force at a world-space point.
     * Generates both linear acceleration and torque.
     */
    applyForceAt(fx: number, fy: number, px: number, py: number): void;
    /** Apply a central force (no torque). */
    applyForce(fx: number, fy: number): void;
    /** Integrate velocities → positions with damping. */
    integrate(gravity?: number): void;
    /** Constrain capsule inside a rectangular box. Produces angular impulse on wall hits. */
    constrainToBox(bx: number, by: number, bw: number, bh: number): void;
    /** Kill all velocities. */
    stop(): void;
}
interface SpringConfig {
    stiffness?: number;
    damping?: number;
}
/**
 * A spring connecting two RigidBody2D surfaces.
 * Attaches at the closest surface points between capsule segments.
 */
declare class Spring2D {
    bodyA: RigidBody2D;
    bodyB: RigidBody2D;
    restLength: number;
    stiffness: number;
    damping: number;
    /** Cached surface attachment points (for rendering). */
    surfA: Vec2 | null;
    surfB: Vec2 | null;
    /** Current stretch beyond rest length. */
    stretch: number;
    constructor(a: RigidBody2D, b: RigidBody2D, restLength: number, config?: SpringConfig);
    /** Compute and apply spring + damping forces for one timestep. */
    apply(): void;
}
/**
 * Repel two rigid bodies if their capsule surfaces overlap.
 */
declare function repelBodies(a: RigidBody2D, b: RigidBody2D, stiffness?: number): void;

/**
 * GPU-accelerated hidden-line removal using ID buffer rendering.
 *
 * Pipeline:
 *  1. Render all front-facing triangles to an offscreen ID buffer (each pixel = triangle index)
 *  2. For each edge, walk its projected pixels via DDA
 *  3. Classify each pixel as visible (background or adjacent triangle) or occluded
 *  4. Detect transition points along the edge, output exact vector segments
 *
 * Advantages over CPU ray casting:
 *  - GPU depth test handles intersecting/overlapping meshes naturally
 *  - No depth bias, no adjacency heuristics beyond 1-ring skip
 *  - Resolution-independent vector output (raster only determines WHERE transitions happen)
 */

interface IdBufferOptions {
    /** ID buffer resolution (square). Default: 2048. Higher = more accurate transitions. */
    resolution?: number;
    /** Show only visible edges (false) or both visible + occluded (true). Default: false. */
    debugLayers?: boolean;
    /** Negate u-coordinates in output. Use when viewDir is flipped relative to the
     *  non-HL projection to correct mirroring. Default: false. */
    flipU?: boolean;
    /**
     * Layer names that bypass the debugLayers classification and keep their original
     * name. Only their *visible* segments are output (occluded ones are dropped).
     * Useful for "soft" / tessellation edges that should always appear as their own
     * layer regardless of visibility classification.
     */
    preserveLayers?: string[];
}
interface IEdgeLite {
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    layer: string;
    adjTris?: number[];
    /** Face normals of the triangles sharing this edge — for front/back classification. */
    adjNormals?: [number, number, number][];
}
/**
 * Compute hidden-line segments using GPU ID buffer rendering.
 *
 * @param positions - Float32Array of vertex positions (x,y,z interleaved)
 * @param indices - Uint32Array of triangle indices
 * @param edges - Edge list with 3D endpoints, layer, and adjacency info
 * @param triNormals - Per-triangle face normals for back-face culling [optional]
 * @param view - Orthographic view direction
 * @param options - Resolution and debug settings
 */
declare function hiddenLineIdBuffer(positions: Float32Array, indices: Uint32Array, edges: IEdgeLite[], _triNormals: [number, number, number][] | null, view: DxfView, options?: IdBufferOptions): DxfSegment[];

/**
 * DXF Exporter with hidden-line removal.
 *
 * Pipeline:
 *  1. Collect triangles (occluders) and edges (to draw)
 *  2. Project orthographically onto the view plane
 *  3. Back-face cull, depth-sort front-facing triangles
 *  4. Per-edge interval subtraction: clip visible [0,1] range against each
 *     closer triangle using Cyrus-Beck 2D clipping
 *  5. Write DXF R12 (AC1009) — universally compatible
 *
 * Usage:
 *   const exp = new DxfExporter();
 *   exp.addMesh(mesh.positions, mesh.indices, { layer: 'stairs' });
 *   exp.addPolyline(pts, { layer: 'centerline' });
 *   const dxf = exp.toDxf({ viewDir: new Vec3(0, 1, 0) });
 */

interface DxfView {
    /** Direction the camera looks toward (into the scene). Will be normalized. */
    viewDir: Vec3;
    /** Up direction for the 2D output. Default: Vec3(0, 0, 1). */
    upDir?: Vec3;
}
interface DxfLayerDef {
    name: string;
    /** AutoCAD Color Index (ACI): 1=red 2=yellow 3=green 4=cyan 5=blue 7=white */
    color?: number;
    lineType?: string;
}
interface DxfMeshOptions {
    /** DXF layer name for edges of this mesh. Default: '0'. */
    layer?: string;
    /**
     * Include edges with dihedral angle above this threshold (degrees).
     * Lower = more edges. Default: 30.
     */
    featureAngle?: number;
    /** Include boundary (open) edges. Default: true. */
    boundary?: boolean;
    /**
     * If provided, soft edges (below featureAngle — e.g. tessellation lines)
     * are written to this layer instead of being discarded. Lets CAD users
     * toggle triangulation noise on/off independently.
     */
    softEdgeLayer?: string;
}
interface DxfEdgeOptions {
    layer?: string;
}
interface DxfWriteOptions {
    /** Scale multiplier applied to all coordinates. Default 1000 (meters→mm). */
    scale?: number;
    /** Decimal places in output. Default 3. */
    precision?: number;
    /**
     * Run hidden-line removal. Default true.
     * Set false for a fast export that projects all edges without occlusion testing.
     */
    hiddenLine?: boolean;
    /**
     * Debug mode: export ALL edges on classified layers instead of removing hidden lines.
     * Layers: "visible", "occluded", "all-edges" (projected without HL).
     * Overrides hiddenLine when true.
     */
    debugLayers?: boolean;
    /**
     * Depth bias for hidden-line self-occlusion prevention, in world units.
     * Must exceed tessellation error of curved surfaces but be smaller than
     * the thinnest geometry. Default 0.01.
     */
    depthBias?: number;
}
interface IEdge {
    ax: number;
    ay: number;
    az: number;
    bx: number;
    by: number;
    bz: number;
    layer: string;
    kind?: 'feature' | 'boundary' | 'silhouette';
    adjTris?: number[];
    /** Face normals of adjacent triangles — used for front/back classification. */
    adjNormals?: [number, number, number][];
    /** Triangle index range [start, end) for the mesh this edge belongs to — used to
     *  skip all same-mesh triangles when depth-testing silhouette edges. */
    meshTriRange?: [number, number];
}
interface DxfSegment {
    u0: number;
    v0: number;
    u1: number;
    v1: number;
    layer: string;
}
declare class DxfExporter {
    private _tris;
    /** Per-triangle face normal (parallel to _tris). null = normals unavailable. */
    private _triNormals;
    private _edges;
    /** Edges whose visibility depends on view direction (silhouette candidates). */
    private _silhouetteEdges;
    private _layers;
    /** Define a layer with color and line type. */
    layer(def: DxfLayerDef): this;
    /**
     * Add a triangulated mesh. Extracts triangles for occlusion and
     * feature / boundary edges for drawing.
     */
    addMesh(positions: Float32Array, indices: Uint32Array, options?: DxfMeshOptions): this;
    /** Add triangles for occlusion only — edges NOT drawn. */
    addOccluder(positions: Float32Array, indices: Uint32Array): this;
    /** Add a polyline as a sequence of edges. */
    addPolyline(pts: Vec3[], options?: DxfEdgeOptions): this;
    /** Add a single edge. */
    addEdge(a: Vec3, b: Vec3, options?: DxfEdgeOptions): this;
    /**
     * Add geometry from a BSP tree. Extracts occluder triangles, feature/boundary
     * edges, and silhouette edge candidates (view-dependent, resolved at export).
     *
     * BSP polygons have reliable normals, enabling back-face culling and silhouette
     * detection in the hidden-line pass.
     */
    addBspTree(bsp: BspTree, options?: DxfMeshOptions): this;
    /** Returns a serializable request object for Web Worker hidden-line computation. */
    toWorkerRequest(view: DxfView, options?: DxfWriteOptions): DxfWorkerRequest;
    /** Return raw projected segments with layer classification (for live preview). */
    toSegments(view: DxfView, options?: DxfWriteOptions): DxfSegment[];
    /** Project edges and write DXF. Runs hidden-line removal unless hiddenLine=false. */
    toDxf(view: DxfView, options?: DxfWriteOptions): string;
    /**
     * GPU-accelerated hidden-line removal using ID buffer rendering.
     * Returns projected segments — same output as toSegments() but uses the GPU
     * for visibility, which handles intersecting/overlapping meshes naturally.
     * Requires Three.js.
     */
    toSegmentsGpu(view: DxfView, options?: IdBufferOptions): DxfSegment[];
    /**
     * GPU-accelerated hidden-line DXF export.
     * Same as toDxf() but uses GPU ID buffer for visibility testing.
     * Requires Three.js.
     */
    toDxfGpu(view: DxfView, options?: DxfWriteOptions & IdBufferOptions): string;
    /** Write DXF from pre-computed segments (e.g. merged from multiple sources). */
    toDxfFromSegments(segs: DxfSegment[], options?: {
        scale?: number;
        precision?: number;
    }): string;
    /** Return edge counts grouped by layer name. Useful for debugging edge classification. */
    debugEdgeCounts(): Record<string, number>;
    /** Clear all geometry (reuse the exporter for a different view). */
    clear(): this;
}
interface DxfWorkerRequest {
    /** Flat array: ax,ay,az,bx,by,bz,cx,cy,cz per triangle */
    trisFlat: number[];
    /** Flat array: nx,ny,nz per triangle (parallel to trisFlat). Optional. */
    triNormalsFlat?: number[];
    edges: IEdge[];
    layers: DxfLayerDef[];
    viewDir: [number, number, number];
    upDir: [number, number, number];
    scale: number;
    precision: number;
    depthBias?: number;
}
/** Run hidden-line DXF computation — intended to be called from a Web Worker. */
declare function processWorkerRequest(req: DxfWorkerRequest, onProgress?: (p: number) => void): string;

interface VisibilityView {
    /** View direction (camera-to-target). The unit vector is fine. */
    viewDir: Vec3;
    /** World-up reference (defaults to +Y). */
    upDir?: Vec3;
}
interface VisibilityOptions {
    /** Offscreen target resolution. Higher = sharper silhouettes. Default 1024. */
    resolution?: number;
    /** Depth tolerance, in fraction of the scene's view-depth range. Default 0.005.
     *  Increase if you see streamlines breaking up where they sit just above the
     *  mesh; decrease if back-side lines bleed through silhouettes. */
    bias?: number;
}
interface ProjectedSegment {
    /** 2D points (u, v) in view space — ready for SVG / DXF. */
    points2D: {
        u: number;
        v: number;
    }[];
    /** Original 3D points (for in-scene preview rendering). */
    points3D: Vec3[];
}
interface VisibilityResult {
    /** Visible polyline chunks. Long polylines may yield multiple chunks. */
    segments: ProjectedSegment[];
    /** View bounds in 2D (the (u, v) range covered by the mesh's projection). */
    bounds: {
        minU: number;
        maxU: number;
        minV: number;
        maxV: number;
    };
}
declare function extractVisiblePolylines(mesh: ConnectedMesh, polylines: Vec3[][], view: VisibilityView, options?: VisibilityOptions): VisibilityResult;
interface SVGOptions {
    /** Stroke width in SVG user units. Default 0.5. */
    strokeWidth?: number;
    /** Stroke color (any CSS color). Default "#000". */
    stroke?: string;
    /** Pad the viewBox by this fraction of scene size. Default 0.02. */
    padFraction?: number;
}
declare function polylinesToSVG(segments: ProjectedSegment[], bounds: {
    minU: number;
    maxU: number;
    minV: number;
    maxV: number;
}, options?: SVGOptions): string;

/**
 * Tekto IFC import — wraps `web-ifc` (WASM) to extract triangle geometry
 * from an IFC file as one fused FlatMeshData. Suitable for context geometry
 * (buildings, sites) where per-element selection is not needed.
 *
 * `web-ifc` is loaded via dynamic import so it stays out of the main Tekto
 * bundle. Apps that use IfcFile must install it themselves:
 *
 *   npm install web-ifc
 *
 * The wasm binary (web-ifc.wasm) must be reachable from the browser. Easiest
 * setup: copy node_modules/web-ifc/web-ifc.wasm to your app's public/ folder
 * and call IfcFile.parse(buf, { wasmPath: '/' }).
 *
 * Example:
 *   const buf  = await fetch('/site.ifc').then(r => r.arrayBuffer());
 *   const mesh = await IfcFile.parse(buf, { wasmPath: '/' });
 *   lab.flatMesh(mesh);
 */

interface IfcParseOptions {
    /** Directory (with trailing slash) where web-ifc.wasm is served. Default: '/'. */
    wasmPath?: string;
    /** Recenter the mesh so its bbox center sits at the origin. Avoids large
     *  site offsets (e.g. UTM coordinates) blowing up float precision in WebGL.
     *  Default: true. */
    recenter?: boolean;
    /** Optional progress / stats callback. */
    onProgress?: (msg: string) => void;
}
declare const IfcFile: {
    /**
     * Parse an IFC file (as ArrayBuffer) into a single fused FlatMeshData.
     * All elements are merged; no per-element groups are produced.
     */
    parse(buffer: ArrayBuffer, options?: IfcParseOptions): Promise<MeshData>;
};

/**
 * Local coordinate frame for a single straight segment of an ExtrudedRibbon.
 *
 *   U = along the centerline (0 at segment start, segLength at segment end)
 *   V = up / vertical (0 at baseZ, height at top)
 *   W = perpendicular to the wall face (+W = left side, −W = right side)
 *
 * Opening, attachment, and dimension math becomes trivial 1D/2D in this frame.
 * Multi-segment walls have one RibbonFrame per segment with a `uOffset` equal
 * to the cumulative arc-length up to that segment.
 */
declare class RibbonFrame {
    readonly origin: Vec2;
    readonly dirU: Vec2;
    readonly dirW: Vec2;
    readonly segLength: number;
    readonly halfWidth: number;
    readonly baseZ: number;
    readonly height: number;
    readonly uOffset: number;
    constructor(segStart: Vec2, segEnd: Vec2, halfWidth: number, baseZ: number, height: number, uOffset?: number);
    /** Local (u, v, w) → world (x, y, z). */
    toWorld(u: number, v: number, w?: number): Vec3;
    /** Local (u, w) → world XY (height ignored). */
    toWorldXY(u: number, w?: number): Vec2;
    /** World point → (u, v, w). */
    toLocal(world: Vec3): {
        u: number;
        v: number;
        w: number;
    };
    leftAt(u: number): Vec2;
    rightAt(u: number): Vec2;
    centerAt(u: number): Vec2;
    get leftNormal(): Vec3;
    get rightNormal(): Vec3;
}
/**
 * A rectangular cutout in an ExtrudedRibbon, positioned along the centerline.
 * Pure geometry — door/window semantics live on the BIM wrapper (WallOpening).
 */
declare class RibbonOpening {
    centerlinePosition: number;
    width: number;
    bottomOffset: number;
    topOffset: number;
    constructor(centerlinePosition: number, width?: number, bottomOffset?: number, topOffset?: number);
}
/**
 * Trim specification for one end of an open ribbon. Each side (left/right)
 * can carry its own trim line — necessary when ≥3 ribbons meet at a point
 * and the left offset trims against a different angular neighbor than the right.
 *
 * For a 2-way junction (L/T-joint), both sides use the same bisector — pass
 * a single (point, dir) via `RibbonEndTrim.bothSides(...)`.
 */
declare class RibbonEndTrim {
    leftTrimPoint: Vec2;
    leftTrimDir: Vec2;
    rightTrimPoint: Vec2;
    rightTrimDir: Vec2;
    /**
     * If `true`, the trimmed end gets an explicit cap face (built from the
     * trimmed leftPts / rightPts). Use for butt-style joints where the
     * trimmed end is visible at the joint. Default `false` (no cap), which
     * is correct for mitered joints where the two walls' offset edges
     * meet along the bisector and a cap would z-fight.
     */
    drawCap: boolean;
    constructor(leftTrimPoint: Vec2, leftTrimDir: Vec2, rightTrimPoint: Vec2, rightTrimDir: Vec2);
    static bothSides(pointOnLine: Vec2, lineDirection: Vec2): RibbonEndTrim;
}
interface ExtrudedRibbonOptions {
    centerline: Vec2[];
    width?: number;
    height?: number;
    baseZ?: number;
}
/**
 * Maximum miter extension as a multiple of half-width.
 * Clamps acute angles to avoid self-intersection.
 */
declare const MITER_LIMIT = 6;
declare class ExtrudedRibbon {
    centerline: Vec2[];
    width: number;
    height: number;
    baseZ: number;
    readonly openings: RibbonOpening[];
    constructor(opts: ExtrudedRibbonOptions | Vec2[]);
    get length(): number;
    get segmentCount(): number;
    get isClosedPolyline(): boolean;
    /** Build a stand-alone triangle mesh for this ribbon. */
    toMesh(): Mesh;
    /**
     * Append this ribbon's geometry into accumulator buffers (used by
     * RibbonSystem to combine many ribbons in one mesh).
     */
    buildInto(buf: MeshBuffers, startTrim: RibbonEndTrim | null, endTrim: RibbonEndTrim | null): void;
}
interface MeshBuffers {
    positions: number[];
    normals: number[];
    indices: number[];
}

type JointStyle = "mitered" | "butt";
/**
 * Kind of joint, derived from how many ribbons touch and how.
 *   "L"       — exactly 2 ribbons, both endpoints meet at the joint.
 *   "T"       — one ribbon's endpoint lies on another's interior (no others).
 *   "X"/"Y"   — 3+ endpoints meeting at one point (X = 4, Y = 3, etc.).
 *   "cluster" — anything else (mixed interior + endpoint participation).
 */
type JointKind = "L" | "T" | "X" | "Y" | "cluster";
/** A single ribbon's participation in a joint. */
interface JointParticipant {
    ribbon: ExtrudedRibbon;
    /**
     * Which end of this ribbon is at the joint:
     *   "start" — centerline[0] is at the joint point.
     *   "end"   — centerline[last] is at the joint point.
     *   null    — the joint lies on this ribbon's INTERIOR (T-junction through-ribbon).
     */
    endIsAtJoint: "start" | "end" | null;
    /** Arc-length along this ribbon's centerline at the joint point. */
    arcLength: number;
}
/**
 * Trim contributions from a joint, per (ribbon, end). Either start, end, or
 * neither may be present. A missing entry means "no trim from THIS joint"
 * (the ribbon's existing trim from a different joint, or its natural end
 * cap, applies).
 */
type JointTrim = {
    start?: RibbonEndTrim | null;
    end?: RibbonEndTrim | null;
};
declare class RibbonJoint {
    readonly participants: JointParticipant[];
    readonly point: Vec2;
    readonly kind: JointKind;
    style: JointStyle;
    /** For "butt" style: which ribbon passes through. Default: the longest. */
    throughRibbon?: ExtrudedRibbon;
    constructor(participants: JointParticipant[], point: Vec2, kind: JointKind);
    /** Compute per-ribbon trim contributions from this joint. */
    computeTrims(): Map<ExtrudedRibbon, JointTrim>;
    private computeMiteredTrims;
    private computeButtTrims;
}

declare class RibbonSystem {
    readonly ribbons: ExtrudedRibbon[];
    joints: RibbonJoint[];
    touchEpsilon: number;
    private _jointsDetected;
    constructor(ribbons?: Iterable<ExtrudedRibbon>);
    add(ribbon: ExtrudedRibbon): void;
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
    detectJoints(): void;
    private applyOldStyle;
    private jointKey;
    /** Aggregate per-ribbon trims from every joint. Returns `{start, end}` per ribbon. */
    computeTrims(): {
        start: RibbonEndTrim | null;
        end: RibbonEndTrim | null;
    }[];
    /**
     * Backward-compat: return T-junctions where another ribbon's endpoint
     * lands on this ribbon's interior. Drawn from the populated `joints`
     * array — does not re-scan geometry independently.
     */
    findTJunctionsOnRibbon(ribbon: ExtrudedRibbon): {
        arcLength: number;
        otherRibbon: ExtrudedRibbon;
    }[];
    buildMesh(): Mesh;
    buildInto(buf: MeshBuffers): void;
}

/**
 * Open-ended key/value map for property sets. Maps to `IfcPropertySet`
 * at export time. Standard keys for walls (recognised by the IFC exporter
 * when present and mapped to `Pset_WallCommon`):
 *
 *   - `fireRating`        (string, e.g. "1hr")
 *   - `acousticRating`    (number, dB)
 *   - `uValue`            (number, W/m²K)
 *   - `loadBearing`       (boolean)
 *   - `isExternal`        (boolean)
 *   - `combustible`       (boolean)
 *   - `surfaceSpreadOfFlame` (string)
 *
 * Any other key/value passes through as a custom Pset.
 */
type PropertyMap = Record<string, unknown>;
/** Position of a material layer relative to the wall's axis (centerline). */
type LayerPosition = "interior" | "exterior" | "core" | number;
/**
 * One layer in a layered wall. Order in `WallType.layers` matters — by
 * convention, list from **interior to exterior**, the same order IFC uses
 * for `IfcMaterialLayerSet`.
 *
 * Maps to `IfcMaterialLayer` (+ position becomes `IfcMaterialLayerSetUsage`).
 *
 * @example
 * { material: "Gypsum board 12.5 mm", thickness: 0.0125, position: "interior" }
 */
interface MaterialLayer {
    /** Human-readable material name. Maps to `IfcMaterial.Name`. */
    material: string;
    /** Layer thickness, in metres. Maps to `IfcMaterialLayer.LayerThickness`. */
    thickness: number;
    /** Where this layer sits relative to the wall axis. Default: `"core"`. */
    position?: LayerPosition;
    /** Layer-specific properties (will become a Pset on the IfcMaterial). */
    properties?: PropertyMap;
}
/**
 * Role tag for a wall part. Used by the IFC exporter to pick the right
 * IFC subtype (an `IfcMember` for studs, an `IfcCovering` for sheathing,
 * an `IfcPlate` for top/bottom plates).
 *
 * The set is open — pass any string for custom roles. The known values
 * have default IFC mappings; unknown roles default to `IfcBuildingElementProxy`.
 */
type WallPartRole = "stud" | "topPlate" | "sillPlate" | "header" | "jackStud" | "cripple" | "blocking" | "sheathing" | "cladding" | "insulation" | "vaporBarrier" | "drywall" | "monolithic" | string;
/**
 * Cross-section profile for a stud/plate/header. Most lumber is rectangular.
 * Maps to `IfcRectangleProfileDef` (rectangular) or a custom profile.
 *
 * Convention (looking at the wall in plan from above, axis running L→R):
 *
 *   `w` = the dimension **along the wall direction** (parallel to the wall face).
 *   `h` = the dimension **across the wall** (perpendicular to the wall face;
 *         into the wall — defines the cavity depth for studs / the breadth
 *         of a horizontal member like a plate).
 *
 * For a North-American 2×4 stud (38 × 89): `{ w: 0.038, h: 0.089 }` — 38 mm
 * visible between sheathings, 89 mm into the wall.
 * For a German KVH 60×120: `{ w: 0.060, h: 0.120 }`.
 */
interface PartProfile {
    /** Width parallel to the wall face — along the wall direction. */
    w: number;
    /** Depth perpendicular to the wall face — into the wall thickness. */
    h: number;
    /** Optional profile name (e.g. "SPF 2×4 (38×89)", "KVH 60×120"). */
    name?: string;
}
/**
 * A single mesh sub-element of a wall (one stud, one plate, one piece
 * of sheathing). Carries enough metadata to ship to IFC, generate a
 * cut list, or paint by material.
 *
 * Maps to `IfcMember` / `IfcPlate` / `IfcCovering` (chosen by `ifcType`,
 * defaulted from `role`).
 */
interface WallPart {
    /** Display name (e.g. "Stud 12", "Top plate", "Sheathing panel"). */
    name: string;
    /** Role tag — drives the IFC mapping; see {@link WallPartRole}. */
    role: WallPartRole;
    /** Triangle mesh for this part (use the flat `Mesh` from `core/geometry/mesh`). */
    mesh: Mesh;
    /** Material name (free-form; the exporter resolves to `IfcMaterial`). */
    material?: string;
    /** Cross-section profile (for studs/plates/etc.). Used by the cut list. */
    profile?: PartProfile;
    /** Linear length, in metres (along the part's main axis). Used by the cut list. */
    length?: number;
    /** Explicit IFC subtype override. Default: derived from `role`. */
    ifcType?: "IfcMember" | "IfcCovering" | "IfcPlate" | "IfcWall" | "IfcBuildingElementProxy";
    /** Part-specific property set. Maps to an `IfcPropertySet` on the IFC element. */
    properties?: PropertyMap;
}
/**
 * One entry in a fabrication cut list. Used by the BalloonFrame and
 * similar framed-wall constructions to report what lumber is needed.
 */
interface CutListItem {
    material: string;
    profile: PartProfile;
    length: number;
    count: number;
    role: WallPartRole;
}
/**
 * One T-junction landing on the **interior** of this wall — i.e., another
 * wall's centerline endpoint touches this wall's centerline between two
 * of its own vertices. The through-wall construction uses this to insert
 * channel/backing studs that provide a nailing surface for the partition's
 * drywall return.
 */
interface WallTJunction {
    /** Arc-length along THIS wall's centerline where the other wall meets. */
    arcLength: number;
    /** The OTHER wall — the partition / spur whose endpoint lands here. */
    otherWall: Wall;
    /** Convenience: the other wall's thickness in metres. */
    otherThickness: number;
}
/**
 * Optional context passed by `WallSystem.realize()` to each wall's
 * construction. Lets the construction respond to junctions: trim plates
 * to neighbour faces, shorten partition end-studs to land at the through
 * wall, and insert channel studs in through-walls.
 */
interface WallContext {
    /** Trim line at the start endpoint (from `RibbonSystem` junction analysis). */
    startTrim?: RibbonEndTrim;
    /** Trim line at the end endpoint. */
    endTrim?: RibbonEndTrim;
    /** T-junctions landing on this wall's *interior* (through-wall responsibility). */
    tJunctions?: WallTJunction[];
}
/**
 * The geometric realization of a wall type. Pure function: takes the
 * wall envelope + optional junction context, returns the aggregated parts.
 *
 * If a wall type is purely layered (CMU + plaster + finish) and not
 * decomposed, the construction function returns `[]` and the layers
 * are carried on the `WallType` itself.
 *
 * @example
 * const stripped: WallConstruction = (wall) => [
 *   { name: "shell", role: "monolithic", mesh: wall.toMesh() }
 * ];
 */
type WallConstruction = (wall: Wall, ctx?: WallContext) => WallPart[];
/**
 * A reusable wall *type* — the IFC `IfcWallType` analogue. Define once,
 * apply to many `Wall` instances. Carries the construction (parts),
 * layers (materials), and properties (Psets).
 *
 * Walls can be:
 *   - **Monolithic** — only `layers` is set; the envelope mesh is the geometry.
 *   - **Framed** — only `construction` is set; parts make up the geometry.
 *   - **Both** — framed-and-sheathed (timber frame + gypsum/OSB layers).
 *
 * @example Monolithic CMU + drywall (no decomposition, just layered material):
 * const CmuWall = new WallType({
 *   name: "200 mm CMU + 13 mm drywall",
 *   layers: [
 *     { material: "Drywall 13 mm",     thickness: 0.013, position: "interior" },
 *     { material: "CMU 190 mm",        thickness: 0.190, position: "core" },
 *     { material: "Render 10 mm",      thickness: 0.010, position: "exterior" },
 *   ],
 *   properties: { fireRating: "2hr", uValue: 1.6, loadBearing: true, isExternal: true },
 * });
 *
 * @example Framed 2×4 wall (decomposed into studs + plates + sheathing):
 * const Framed2x4 = new WallType({
 *   name: "2×4 framed w/ OSB",
 *   construction: BalloonFrame({ studSpacing: 0.4, studSize: { w: 0.038, h: 0.089 } }),
 *   layers: [
 *     { material: "OSB 11 mm",         thickness: 0.011, position: "exterior" },
 *     { material: "Gypsum 13 mm",      thickness: 0.013, position: "interior" },
 *   ],
 *   properties: { fireRating: "1hr", loadBearing: true },
 * });
 */
declare class WallType {
    readonly name: string;
    readonly description?: string;
    readonly construction?: WallConstruction;
    readonly layers?: MaterialLayer[];
    readonly properties: PropertyMap;
    /**
     * Preferred joint style for joints involving this wall type. Used by
     * `WallSystem.realize()` to set sensible defaults on auto-detected
     * joints. `"butt"` matches prefab-panel construction (Holzrahmenbau,
     * Holztafelbau, steel-stud panel); `"mitered"` matches monolithic
     * construction (concrete, CMU, CLT slab). Default: `"mitered"`.
     */
    readonly junctionStyle?: JointStyle;
    constructor(opts: {
        name: string;
        description?: string;
        construction?: WallConstruction;
        layers?: MaterialLayer[];
        properties?: PropertyMap;
        junctionStyle?: JointStyle;
    });
    /** Total nominal thickness summed from material layers (0 if none). */
    get layeredThickness(): number;
}
/**
 * The result of `realize(wall)`. The geometry side of the type-instance
 * relationship — what you actually render or export.
 *
 * - `parts` is populated when the wall type has a construction function
 *   (framed walls). Empty for purely-monolithic walls.
 * - `layers` is populated when the wall type defines layered materials.
 *   Empty for purely-framed walls.
 * - `envelopeMesh` is the whole-wall envelope (single mesh from the
 *   underlying `ExtrudedRibbon`). Always present; useful for quick
 *   rendering and for monolithic walls as the primary mesh.
 * - `properties` is the merged Pset (wall instance overrides type defaults).
 */
interface RealizedWall {
    wall: Wall;
    parts: WallPart[];
    layers: MaterialLayer[];
    envelopeMesh: Mesh;
    properties: PropertyMap;
}
/**
 * Apply a wall's type to produce its realized geometry + metadata.
 * If the wall has no type, returns a monolithic realization using only
 * the envelope mesh (sensible default for quick visualisation).
 *
 * For junction-aware framing (channel studs, plate trims, partition
 * shortening), pass a `WallContext` — or use `WallSystem.realize()`
 * which computes the context for every wall automatically.
 *
 * The function is pure — no side effects, safe to call repeatedly.
 */
declare function realize(wall: Wall, ctx?: WallContext): RealizedWall;
/**
 * Roll a list of parts (typically from a `RealizedWall.parts`) into a
 * cut list keyed by (material × profile × length-bucket). The default
 * bucket is exact-millimetre — pass `roundMm` to coarsen.
 */
declare function buildCutList(parts: WallPart[], roundMm?: number): CutListItem[];

/** Mechanical connection class. Influences fastener listing / structural calc. */
type ConnectionType = "screwed" | "nailed" | "glued" | "mortise" | "metalBracket" | "boltedPlate" | "unspecified";
interface WallJointOptions {
    ribbonJoint: RibbonJoint;
    walls: Wall[];
    connectionType?: ConnectionType;
    fastenerCount?: number;
    properties?: PropertyMap;
}
/**
 * BIM wrapper around a geometric `RibbonJoint`. Read-through to the
 * underlying joint's `style` and `throughRibbon` via getters/setters so
 * either the geometry-side or the BIM-side can drive the policy.
 */
declare class WallJoint {
    readonly ribbonJoint: RibbonJoint;
    readonly walls: Wall[];
    connectionType: ConnectionType;
    fastenerCount?: number;
    properties: PropertyMap;
    constructor(opts: WallJointOptions);
    /** Joint geometry style. Mirrors `ribbonJoint.style`. */
    get style(): JointStyle;
    set style(v: JointStyle);
    /** For "butt" style: which wall passes through. */
    get throughWall(): Wall | undefined;
    set throughWall(w: Wall | undefined);
    /** Joint kind (L/T/Y/X/cluster). Read-only — derived from geometry. */
    get kind(): JointKind;
}

/** How a door leaf operates. Maps to `IfcDoorTypeOperationEnum`. */
type DoorOperation = "single_swing_left" | "single_swing_right" | "double_swing" | "double_door_single_swing" | "sliding" | "folding" | "revolving" | "not_defined";
/** How a window is partitioned. Maps to `IfcWindowTypePartitioningEnum`. */
type WindowPartitioning = "single_panel" | "double_panel_vertical" | "double_panel_horizontal" | "triple_panel" | "not_defined";
interface OpeningTypeOptions {
    name: string;
    /** "door" → IfcDoor(Type); "window" → IfcWindow(Type). Default "door". */
    kind?: "door" | "window";
    /** Door leaf operation (ignored for windows). Default "not_defined". */
    operation?: DoorOperation;
    /** Window panel partitioning (ignored for doors). Default "not_defined". */
    partitioning?: WindowPartitioning;
    /** Leaf / frame material name, e.g. "Oak", "Aluminium". */
    material?: string;
    description?: string;
    /**
     * Open Pset map. Recognised keys map to `Pset_DoorCommon` /
     * `Pset_WindowCommon` (e.g. `fireRating`, `acousticRating`, `uValue`,
     * `isExternal`, `securityRating`); anything else passes through.
     */
    properties?: PropertyMap;
}
/**
 * Reusable door/window type — the IFC `IfcDoorType` / `IfcWindowType`
 * analogue. Attach one to a `WallOpening` (its `type` field) and the IFC
 * exporter emits the type once, links every instance via
 * `IfcRelDefinesByType`, and writes the matching common Pset.
 */
declare class OpeningType {
    name: string;
    kind: "door" | "window";
    operation: DoorOperation;
    partitioning: WindowPartitioning;
    material?: string;
    description?: string;
    properties: PropertyMap;
    constructor(opts: OpeningTypeOptions);
    /** Convenience: a swinging interior/exterior door type. */
    static door(name: string, opts?: Omit<OpeningTypeOptions, "name" | "kind">): OpeningType;
    /** Convenience: a window type. */
    static window(name: string, opts?: Omit<OpeningTypeOptions, "name" | "kind">): OpeningType;
}

/**
 * A rectangular opening (door or window) in a wall, positioned along the
 * wall's centerline. The opening punches through the wall perpendicular
 * to the wall face, cutting both sides and generating reveal-jamb faces
 * that show the wall thickness.
 *
 * All dimensions are in model units (typically meters).
 * Heights are relative to the wall's `baseElevation` (NOT absolute Z).
 */
declare class WallOpening {
    /**
     * Distance along the wall's centerline from the wall's start point to
     * the opening's center (arc-length along the polyline).
     */
    centerlinePosition: number;
    /** Width of the opening along the wall face. */
    width: number;
    /**
     * Height of the bottom of the opening above the wall's baseElevation.
     * Door → 0. Window → typically 0.8–1.0 m.
     */
    sillHeight: number;
    /**
     * Height of the top of the opening above the wall's baseElevation.
     * Standard door → 2.1 m. Window → typically 2.0–2.2 m.
     * Must be > sillHeight and ≤ wall.height.
     */
    headHeight: number;
    /** Optional label (e.g. "D1", "W3"). */
    name?: string;
    /**
     * Optional reusable door/window type (IFC `IfcDoorType` / `IfcWindowType`
     * analogue). When set, the IFC exporter links the door/window to the type
     * and writes its operation + common Pset. See `src/bim/openings.ts`.
     */
    type?: OpeningType;
    /** Instance-level Pset overrides, merged on top of `type.properties`. */
    properties?: PropertyMap;
    constructor(centerlinePosition: number, width?: number, sillHeight?: number, headHeight?: number, name?: string);
    /** True if sillHeight is effectively zero (door-type opening). */
    get isDoor(): boolean;
    static door(centerlinePosition: number, width?: number, headHeight?: number): WallOpening;
    static window(centerlinePosition: number, width?: number, sillHeight?: number, headHeight?: number): WallOpening;
}
interface WallOptions {
    centerline: Vec2[];
    thickness?: number;
    height?: number;
    baseElevation?: number;
    name?: string;
    /**
     * Optional reference to a reusable wall type (the IFC `IfcWallType`
     * analogue). When set, `realize(wall)` produces the framed parts and
     * layered materials; without one, the wall is treated as monolithic.
     */
    type?: WallType;
    /**
     * Wall-instance Pset overrides. Merged on top of `type.properties`.
     */
    properties?: PropertyMap;
}
/**
 * BIM-level wall. Thin wrapper around ExtrudedRibbon adding:
 *   • a name (round-trips to IfcWall.Name)
 *   • door/window openings with sill/head heights
 *
 * Geometry is 100% delegated to the underlying ExtrudedRibbon.
 */
declare class Wall {
    /** The underlying geometry engine. */
    readonly ribbon: ExtrudedRibbon;
    /** Optional human-readable identifier (round-trips to `IfcWall.Name`). */
    name?: string;
    /** Rectangular openings (doors, windows). Synced into the ribbon at meshing time. */
    readonly openings: WallOpening[];
    /** Reusable type definition (IFC `IfcWallType` analogue). See `src/bim/walls/`. */
    type?: WallType;
    /** Wall-instance property overrides (merged with `type.properties` at realize time). */
    properties?: PropertyMap;
    constructor(opts: WallOptions | Vec2[]);
    /** Convenience constructor for a single straight wall. */
    static segment(start: Vec2, end: Vec2, opts?: {
        thickness?: number;
        height?: number;
        baseElevation?: number;
        name?: string;
    }): Wall;
    get centerline(): Vec2[];
    set centerline(v: Vec2[]);
    get thickness(): number;
    set thickness(v: number);
    get height(): number;
    set height(v: number);
    get baseElevation(): number;
    set baseElevation(v: number);
    get length(): number;
    get segmentCount(): number;
    get isClosedPolyline(): boolean;
    /** Build a stand-alone triangle mesh for this wall (no junction analysis). */
    toMesh(): Mesh;
    /** Build a combined mesh from a collection of walls (no junction analysis). */
    static buildMesh(walls: Iterable<Wall>): Mesh;
    /**
     * Translate WallOpenings (BIM level) → RibbonOpenings (geometry level).
     * Called automatically by `toMesh` / `Wall.buildMesh` / `WallSystem.buildMesh`.
     */
    syncOpeningsToRibbon(): void;
}
/**
 * BIM-level wrapper around RibbonSystem. Maintains a parallel list of
 * Walls (with BIM metadata) alongside the generic RibbonSystem (which
 * handles junction analysis and meshing).
 *
 * Use this — not the bare RibbonSystem — when you want T-joints / L-joints
 * to trim cleanly between multiple walls.
 */
declare class WallSystem {
    /** The underlying geometry-level ribbon system. */
    readonly ribbons: RibbonSystem;
    /** BIM-level wall references (parallel to `ribbons.ribbons`). */
    readonly walls: Wall[];
    get touchEpsilon(): number;
    set touchEpsilon(v: number);
    constructor(walls?: Iterable<Wall>);
    add(wall: Wall): void;
    /** BIM-level joints, mirroring `ribbons.joints` 1-to-1. Built lazily. */
    get joints(): WallJoint[];
    private _jointCache;
    private _jointCacheStamp;
    /**
     * Force a fresh joint detection (RibbonSystem-level) and rebuild the
     * `WallJoint` wrappers with per-`WallType` default styles applied.
     * Call after mutating wall centerlines / types.
     */
    detectJoints(): void;
    private ensureJoints;
    private rebuildJointCache;
    /** Build one combined mesh for every wall, with junction trims applied. */
    buildMesh(): Mesh;
    /**
     * Realise every wall in the system with **junction-aware framing**:
     * plate trims, partition-end shortening, channel-stud insertion in
     * through-walls. Joints are detected (or refreshed) automatically.
     */
    realize(): RealizedWall[];
}

/**
 * Role tag for a slab part. Drives the IFC mapping at export time:
 *   joist / beam / header / blocking → IfcMember
 *   sheathing / decking              → IfcPlate / IfcCovering
 *   topping / screed / finish        → IfcCovering
 *   monolithic                       → IfcSlab (the whole envelope as one piece)
 */
type SlabPartRole = "joist" | "beam" | "header" | "blocking" | "sheathing" | "decking" | "topping" | "insulation" | "ceiling" | "monolithic" | string;
interface SlabPart {
    name: string;
    role: SlabPartRole;
    mesh: Mesh;
    material?: string;
    profile?: PartProfile;
    /** Linear length (joists, beams). */
    length?: number;
    /** Explicit IFC subtype override. Default: derived from role. */
    ifcType?: "IfcMember" | "IfcPlate" | "IfcCovering" | "IfcSlab" | "IfcBuildingElementProxy";
    properties?: PropertyMap;
}
/**
 * A rectangular opening in a slab (stair well, mechanical penetration,
 * skylight). Positioned in world coordinates within the slab boundary.
 * Aligned with the slab's local frame (X = joist direction by default,
 * but can be overridden by the construction).
 */
declare class SlabOpening {
    centerX: number;
    centerY: number;
    /** Dimension along the slab's local X (joist direction). */
    width: number;
    /** Dimension along the slab's local Y (across joists). */
    depth: number;
    name?: string;
    constructor(centerX: number, centerY: number, width: number, depth: number, name?: string);
}
/**
 * Optional context passed to a `SlabConstruction`. Provides the joist
 * direction (auto-resolved by the system or explicitly set) and the
 * supporting walls (used by the structural-aware construction variants).
 */
interface SlabContext {
    /** Resolved joist direction (unit vector in the XY plane). */
    joistDirection: Vec2;
    /** Walls that support this slab (used by joisted constructions). */
    supports?: Wall[];
}
type SlabConstruction = (slab: Slab, ctx?: SlabContext) => SlabPart[];
interface SlabTypeOptions {
    name: string;
    description?: string;
    construction?: SlabConstruction;
    layers?: MaterialLayer[];
    properties?: PropertyMap;
    /** Default joist spacing for joisted constructions (m). */
    defaultJoistSpacing?: number;
    /** Default joist profile (cross-section). */
    defaultJoistProfile?: PartProfile;
    /** Material name for joists / structural members. */
    defaultMaterial?: string;
}
/**
 * Reusable slab *type* — the IFC `IfcSlabType` analogue.
 *
 * @example Solid CLT slab (monolithic, layered material):
 * const Clt200 = new SlabType({
 *   name: "CLT 200 (5-ply)",
 *   construction: SolidSlabConstruction,
 *   layers: cltLayers({ lamellae: [0.04, 0.02, 0.04, 0.02, 0.04, 0.02, 0.04] }),
 *   properties: { loadBearing: true, fireRating: "REI60" },
 * });
 *
 * @example Joisted timber slab (parts + sheathing/ceiling layers):
 * const Joisted = new SlabType({
 *   name: "Timber joist + OSB",
 *   construction: JoistedSlab({ spacing: 0.625, profile: { w: 0.06, h: 0.22 } }),
 *   layers: [
 *     { material: "Gipsfaser 12.5 mm", thickness: 0.0125, position: "interior" },
 *     { material: "OSB 22 mm",         thickness: 0.022,  position: "exterior" },
 *   ],
 *   properties: { loadBearing: true, fireRating: "REI60" },
 * });
 */
declare class SlabType {
    readonly name: string;
    readonly description?: string;
    readonly construction?: SlabConstruction;
    readonly layers?: MaterialLayer[];
    readonly properties: PropertyMap;
    readonly defaultJoistSpacing?: number;
    readonly defaultJoistProfile?: PartProfile;
    readonly defaultMaterial?: string;
    constructor(opts: SlabTypeOptions);
    get layeredThickness(): number;
}
interface SlabOptions {
    /**
     * Closed XY polygon defining the slab footprint. Must be closed
     * (first point ≈ last point) and either CCW or CW.
     */
    boundary: Vec2[];
    /** Structural thickness of the slab (m). Default: 0.2. */
    thickness?: number;
    /**
     * Top-of-slab elevation in world Z (m). The slab body extends from
     * (elevation − thickness) up to `elevation`. Default: 0.
     */
    elevation?: number;
    name?: string;
    type?: SlabType;
    properties?: PropertyMap;
    openings?: SlabOpening[];
    /**
     * Explicit joist direction override. If unset, the construction (or
     * `SlabSystem`) auto-computes via the orientation helpers.
     */
    joistDirection?: Vec2;
}
declare class Slab {
    readonly boundary: Vec2[];
    thickness: number;
    elevation: number;
    name?: string;
    type?: SlabType;
    properties?: PropertyMap;
    readonly openings: SlabOpening[];
    /**
     * Optional override for joist direction. When set, `SlabSystem` /
     * `realize` will use this instead of auto-computing.
     */
    joistDirection?: Vec2;
    constructor(opts: SlabOptions);
    /** Total perimeter length (m). */
    get perimeter(): number;
    /** Slab footprint area (m²). Uses signed-area magnitude. */
    get area(): number;
    /**
     * Build the slab envelope mesh: top face + bottom face + side quads.
     * Uses `Polygon2D.triangulate2D` (ear-clipping) for the caps.
     */
    toMesh(): Mesh;
}
interface RealizedSlab {
    slab: Slab;
    parts: SlabPart[];
    layers: MaterialLayer[];
    envelopeMesh: Mesh;
    properties: PropertyMap;
    joistDirection?: Vec2;
}
declare function realizeSlab(slab: Slab, ctx?: SlabContext): RealizedSlab;

interface SpaceOptions {
    name: string;
    /** Boundary polygon in the XY ground plane (CCW), in metres. */
    boundary: Vec2[];
    /** Floor level (world Z). Default 0. */
    elevation?: number;
    /** Clear room height. Default 2.7 m. */
    height?: number;
    /** Room use, e.g. "Bedroom", "Kitchen", "Circulation". → IfcSpace.LongName. */
    function?: string;
    /** Open Pset map → Pset_SpaceCommon (+ any custom keys). */
    properties?: PropertyMap;
}
/**
 * A room — the IFC `IfcSpace` analogue. Aggregated under its building
 * storey at export (via `IfcRelAggregates`, the correct spatial-decomposition
 * relationship for spaces — not `IfcRelContainedInSpatialStructure`).
 */
declare class Space {
    name: string;
    boundary: Vec2[];
    elevation: number;
    height: number;
    function?: string;
    properties: PropertyMap;
    constructor(opts: SpaceOptions);
    /** Floor area of the boundary polygon (shoelace formula), in m². */
    area(): number;
    /** Approximate room volume (floor area × clear height), in m³. */
    volume(): number;
}
/**
 * Find which walls bound a space: a wall whose centerline runs along one of
 * the space's boundary edges (approximately collinear, and overlapping in
 * projection). Pass the result to `IfcWriter.addSpace(space, { boundaries })`
 * to emit `IfcRelSpaceBoundary` relations.
 *
 * @param tol  Max perpendicular distance from the edge line to accept a wall
 *             (≈ how far a wall centerline may sit off the room outline).
 */
declare function boundingWalls(space: Space, walls: Wall[], tol?: number): Wall[];

/** Overall stair shape — maps to `IfcStairTypeEnum`. */
type StairShape = "straight_run" | "two_straight_run" | "quarter_turn" | "half_turn" | "spiral" | "not_defined";
interface StairTypeOptions {
    name: string;
    /** Overall shape. Default "straight_run". */
    shape?: StairShape;
    /** Tread / structure material, e.g. "Concrete", "Oak". */
    material?: string;
    description?: string;
    properties?: PropertyMap;
}
/** Reusable stair type — the IFC `IfcStairType` analogue. */
declare class StairType {
    name: string;
    shape: StairShape;
    material?: string;
    description?: string;
    properties: PropertyMap;
    constructor(opts: StairTypeOptions);
}
/**
 * One computed flight: solid step geometry as a triangle soup plus the
 * code metrics (riser/tread counts and dimensions). `positions` is a flat
 * [x,y,z, …] array in world coordinates; `indices` are 0-based triangles.
 */
interface StairFlight {
    name: string;
    positions: number[];
    indices: number[];
    risers: number;
    treads: number;
    riserHeight: number;
    treadDepth: number;
}
interface StairOptions {
    name?: string;
    /** Bottom of the stair: centre of the flight width at floor level. */
    start: Vec3;
    /** Horizontal travel direction (need not be unit). Default +X. */
    direction?: Vec2;
    /** Flight width. Default 1.0 m. */
    width?: number;
    /** Floor-to-floor height the flight climbs. Required. */
    totalRise: number;
    /** Target riser height; the actual riser divides `totalRise` evenly. Default 0.18 m. */
    riserHeight?: number;
    /** Going (horizontal tread depth). Default 0.27 m. */
    treadDepth?: number;
    type?: StairType;
    properties?: PropertyMap;
}
/**
 * A stair — the IFC `IfcStair` analogue. Holds the parameters and computes
 * its flight geometry on demand via `flights()`. Both the IFC exporter and
 * any renderer consume the same `StairFlight` structs.
 */
declare class Stair {
    name: string;
    start: Vec3;
    direction: Vec2;
    width: number;
    totalRise: number;
    riserHeight: number;
    treadDepth: number;
    type?: StairType;
    properties: PropertyMap;
    constructor(opts: StairOptions);
    /** Number of risers, chosen so the actual riser is closest to the target. */
    get risers(): number;
    /** Actual riser height (`totalRise` split evenly). */
    get actualRiser(): number;
    /**
     * Compute the flight geometry. A straight run is a single flight built as
     * a stepped solid: step i is a box spanning going [i·tread, (i+1)·tread],
     * rising from the floor to (i+1)·riser, across the full width.
     */
    flights(): StairFlight[];
}

interface IfcWriterOptions {
    projectName?: string;
    projectDescription?: string;
    siteName?: string;
    buildingName?: string;
    storeyName?: string;
    storeyElevation?: number;
    author?: string;
    authorGivenName?: string;
    organization?: string;
    application?: string;
    applicationVersion?: string;
    /** Default: ViewDefinition [DesignTransferView_V1.0] — the round-trippable MVD. */
    viewDefinition?: string;
}
interface AddWallSystemOptions {
    /** Aggregate framed members (studs, plates, headers) under each wall. Default: true. */
    includeMembers?: boolean;
    /** Emit IfcRelConnectsPathElements for every joint. Default: true. */
    includeJoints?: boolean;
    /** Emit IfcOpeningElement + IfcDoor/IfcWindow for each opening. Default: true. */
    includeOpenings?: boolean;
    /** Emit IfcMaterialLayerSet + IfcMaterialLayerSetUsage from WallType.layers. Default: true. */
    includeMaterials?: boolean;
}
declare class IfcWriter {
    private entities;
    private nextId;
    private ownerHistoryRef;
    private contextRef;
    private projectRef;
    private siteRef;
    private buildingRef;
    private buildingPlacementRef;
    private storeyRef;
    private storeyPlacementRef;
    private originPointRef;
    private dirXRef;
    private dirZRef;
    private worldPlacementRef;
    private rootPlacementRef;
    private storeyPlacementByRef;
    private elementsByStorey;
    private wallRefs;
    private wallByObject;
    private slabRefs;
    private slabTypeRefs;
    private slabDefinesByTypeBatches;
    private placementByWall;
    private wallTypeRefs;
    private materialLayerSetRefs;
    private materialRefs;
    private definesByTypeBatches;
    private openingTypeRefs;
    private openingDefinesByTypeBatches;
    private spacesByStorey;
    private stairTypeRefs;
    private stairDefinesByTypeBatches;
    /**
     * Per-wall arc-length deltas applied to the body geometry at each end:
     *   • Through wall in a butt joint → extension (negative at start, positive at end).
     *   • Butting wall in a butt joint → shortening (positive at start, negative at end).
     * Populated by `computeWallTrims` before `writeStraightWall` consumes it.
     */
    private wallTrimMap;
    private readonly opts;
    constructor(opts?: IfcWriterOptions);
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
    addStorey(opts: {
        name: string;
        elevation: number;
    }): number;
    /** Convenience: returns the bootstrap storey's IFC line id. */
    getDefaultStorey(): number;
    /**
     * Add a `WallSystem` and everything it carries — the recommended one-shot
     * entry point. Emits wall types, materials, walls, openings, members,
     * and joint relations in a single coherent batch.
     *
     * `opts.storey` (optional) selects which storey to attach the walls to.
     * Defaults to the bootstrap storey from `IfcWriterOptions`.
     */
    addWallSystem(system: WallSystem, opts?: AddWallSystemOptions & {
        storey?: number;
    }): void;
    /**
     * Add one wall — returns its IFC line id. Used internally by
     * `addWallSystem`; can also be called directly for one-off walls.
     *
     * `opts.storey` selects which storey to attach the wall to. Defaults
     * to the bootstrap storey.
     */
    addWall(wall: Wall, opts?: {
        includeMaterials?: boolean;
        storey?: number;
    }): number;
    /**
     * Add an opening (door or window) on the given wall. Emits
     * IfcOpeningElement + IfcRelVoidsElement (carving the wall) and
     * IfcDoor or IfcWindow + IfcRelFillsElement (filling the void).
     */
    addOpening(wall: Wall, wallRef: number, opening: WallOpening, storeyRef?: number): {
        openingRef: number;
        fillRef: number;
    };
    /**
     * Add a framed member (stud / plate / header / cripple / etc.) as an
     * IfcMember with a tessellated body (IfcTriangulatedFaceSet — efficient,
     * IFC4-native). Aggregating under a wall is the caller's responsibility
     * (see addWallSystem).
     */
    addMember(_parentWallRef: number, part: {
        name: string;
        role: string;
        mesh: Mesh;
        material?: string;
        profile?: {
            w: number;
            h: number;
            name?: string;
        };
        length?: number;
        ifcType?: string;
        properties?: PropertyMap;
    }): number;
    /**
     * Add a wall-to-wall joint as IfcRelConnectsPathElements. The joint's
     * style + throughWall hint are exposed in a custom Pset attached to the
     * relation (so receiving applications can read the design intent).
     */
    addJoint(joint: WallJoint): number | null;
    /**
     * Add a slab (floor / ceiling / roof) — returns its IFC line id.
     * Geometry: `IfcExtrudedAreaSolid` with an `IfcArbitraryClosedProfileDef`
     * built from the slab boundary, extruded up by `slab.thickness` from
     * the slab's bottom (`elevation − thickness`).
     *
     * Optionally aggregates SlabParts (joists, sheathing, ceiling) under
     * the slab via `IfcRelAggregates` when `opts.includeParts` is true.
     */
    addSlab(slab: Slab, opts?: {
        predefinedType?: "FLOOR" | "ROOF" | "LANDING" | "BASESLAB";
        includeParts?: boolean;
        parts?: SlabPart[];
        /** Storey to attach the slab to. Defaults to the bootstrap storey. */
        storey?: number;
    }): number;
    private ensureSlabType;
    /**
     * Add a stair as an `IfcStair` that aggregates one `IfcStairFlight` per
     * computed flight. The stair is contained in its storey; flights carry the
     * tessellated step geometry and the riser/tread metrics. A `StairType`
     * links via `IfcRelDefinesByType`; `properties` go on `Pset_StairCommon`.
     */
    addStair(stair: Stair, opts?: {
        storey?: number;
    }): number;
    private writeStairFlight;
    private ensureStairType;
    /**
     * Emit a tessellated solid (IfcCartesianPointList3D + IfcTriangulatedFaceSet)
     * from a flat positions array and 0-based triangle indices. Returns the
     * IfcProductDefinitionShape ref.
     */
    private writeTriangulatedShape;
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
    addSpace(space: Space, opts?: {
        storey?: number;
        boundaries?: Wall[];
    }): number;
    /**
     * Ensure an `IfcDoorType` / `IfcWindowType` exists for this opening type,
     * returning its line id. Door types carry an OperationType; window types
     * carry a PartitioningType. The type's `properties` go on a common Pset.
     */
    private ensureOpeningType;
    save(): string;
    saveBytes(): Uint8Array;
    saveBlob(): Blob;
    private bootstrap;
    /** Build the IfcBuildingStorey + IfcLocalPlacement pair. Returns both refs. */
    private createStoreyEntities;
    /**
     * Per-wall deltas from butt joints. Sign convention along the wall's
     * tangent (p0 → p1):
     *   - Through wall, start at joint → startDelta negative (extend back)
     *   - Through wall, end at joint   → endDelta   positive (extend fwd)
     *   - Butting wall, start at joint → startDelta positive (shorten in)
     *   - Butting wall, end at joint   → endDelta   negative (shorten in)
     * Mitered joints leave deltas at 0 — both walls meet at centerline.
     */
    private computeWallTrims;
    private writeStraightWall;
    private ensureWallType;
    private flushDefinesByType;
    private ensureMaterial;
    private writeMaterialLayerSet;
    private writeMaterialLayerSetUsage;
    private writePset;
    private writeSingleValue;
    /** Validate / default the storey ref for an add* call. */
    private resolveStorey;
    /** Record an element ref under its storey for later spatial linking. */
    private attachToStorey;
    private linkSpatialStructure;
    private addEntity;
    private assembleStep;
}

/**
 * The trivial construction: the whole wall is one part, the envelope mesh.
 *
 * Use this when the wall has material layers (CMU + plaster + finish) but
 * no need to model each lamella as separate geometry. The wall renders and
 * exports as a single solid; the layers are metadata for take-off, U-value
 * calculation, and IFC.
 *
 * @example
 * const ConcreteWall = new WallType({
 *   name: "200 mm concrete",
 *   construction: SolidConstruction,
 *   layers: [{ material: "C25/30", thickness: 0.2, position: "core" }],
 *   properties: { fireRating: "4hr", loadBearing: true },
 * });
 */
declare const SolidConstruction: WallConstruction;

interface BalloonFrameOptions {
    /** Stud cross-section. Default: SPF 2×4 nominal (38 × 89 mm actual). */
    studProfile?: PartProfile;
    /** Plate cross-section. Default: same as stud profile. */
    plateProfile?: PartProfile;
    /** Spacing between stud centerlines, in metres. Default: 0.4 (~16″ o.c.). */
    studSpacing?: number;
    /** Number of top plates (1 or 2). Default: 2 (doubled top plate). */
    topPlateCount?: 1 | 2;
    /** Header depth as a function of opening width. */
    headerDepth?: (openingWidth: number) => number;
    /** Material name for all framing members. Default: `"SPF"`. */
    material?: string;
}
/**
 * Balloon-frame construction factory (North-American light-frame timber).
 *
 * @example
 * const Framed2x4 = new WallType({
 *   name: "2×4 framed @ 400 mm o.c.",
 *   construction: BalloonFrame({ studSpacing: 0.4 }),
 *   properties: { loadBearing: true },
 * });
 */
declare function BalloonFrame(options?: BalloonFrameOptions): WallConstruction;

interface HolzrahmenBauOptions {
    /** Stud cross-section. Default: KVH 60×120 (engineered softwood). */
    studProfile?: PartProfile;
    /** Plate cross-section. Default: same as stud profile. */
    plateProfile?: PartProfile;
    /** Spacing between stud centerlines, in metres. Default: 0.625 (matches Gipsfaser/OSB panel widths). */
    studSpacing?: number;
    /** Number of Rähm (top plates). Default: 1. */
    topPlateCount?: 1 | 2;
    /** Header depth as a function of opening width. Default: KVH-sized. */
    headerDepth?: (openingWidth: number) => number;
    /** Material name for all framing members. Default: `"KVH C24"`. */
    material?: string;
    /**
     * Use doubled studs at opening edges (Doppelständer) instead of the
     * NA king + jack pair. Default: true.
     */
    doubledKings?: boolean;
}
/**
 * The conventional joint style for Holzrahmenbau / Holztafelbau panels —
 * walls are prefab elements built flat in a factory, so corners are
 * butt-jointed (one panel through, one butting) rather than mitred.
 *
 * Use as a default on `WallType.junctionStyle` when building a
 * `WallType` with `HolzrahmenBau(...)`.
 */
declare const HolzrahmenBauJointStyle: "butt";
/**
 * Holzrahmenbau construction factory (Central-European timber frame).
 *
 * @example
 * const HRB60x120 = new WallType({
 *   name: "Holzrahmenbau KVH 60×120 @ 625 mm",
 *   construction: HolzrahmenBau({ studSpacing: 0.625 }),
 *   layers: holzrahmenbauLayers(),
 *   properties: { loadBearing: true, isExternal: true, fireRating: "REI60", uValue: 0.18 },
 * });
 */
declare function HolzrahmenBau(options?: HolzrahmenBauOptions): WallConstruction;
/**
 * Returns a typical Holzrahmenbau exterior-wall layered build-up,
 * interior → exterior. Override any layer by editing the result.
 *
 * Typical structure:
 *   1. Gipsfaser 12.5 mm   (interior board / fire layer)
 *   2. Installation cavity 30 mm (optional services layer)
 *   3. Vapour barrier (Dampfbremse)
 *   4. KVH stud cavity 120 mm + Mineralwolle (insulation)
 *   5. DWD board 16 mm     (diffusion-open exterior board)
 *   6. Diffusionsoffene Folie (wind/weather membrane)
 *   7. Lattung 30 mm       (ventilation battens)
 *   8. Fassade / cladding ~20 mm
 *
 * The KVH stud cavity layer is *not* included here — that's the
 * structural framing, modelled by `HolzrahmenBau()` as parts. The
 * layered build-up describes only the non-structural layers around it.
 *
 * @example
 * const ExtWall = new WallType({
 *   name: "HRB exterior wall",
 *   construction: HolzrahmenBau({ studProfile: { w: 0.06, h: 0.14 } }),
 *   layers: holzrahmenbauLayers({ insulation: { material: "Mineralwolle", thickness: 0.140 } }),
 *   properties: { isExternal: true, fireRating: "REI60", uValue: 0.18 },
 * });
 */
declare function holzrahmenbauLayers(opts?: {
    interiorBoard?: {
        material: string;
        thickness: number;
    };
    installationCavity?: {
        thickness: number;
    };
    vapourBarrier?: {
        material: string;
    };
    insulation?: {
        material: string;
        thickness: number;
    };
    exteriorBoard?: {
        material: string;
        thickness: number;
    };
    weatherMembrane?: {
        material: string;
    };
    ventilationBattens?: {
        thickness: number;
    };
    cladding?: {
        material: string;
        thickness: number;
    };
}): MaterialLayer[];

interface CltOptions {
    /**
     * Lamella thicknesses, in order interior → exterior, in metres.
     * Default: `[0.04, 0.02, 0.04, 0.02, 0.04]` (standard 160 mm 5-ply,
     * alternating 40/20 mm boards).
     */
    lamellae?: number[];
    /** Grade name (e.g. `"C24"` for European, `"V2 M5"` for ETA panels). */
    grade?: string;
    /** Total expected panel thickness — sanity check against summed lamellae. */
    totalThickness?: number;
}
/**
 * Build the `MaterialLayer[]` for a CLT panel from a list of lamella
 * thicknesses. Grain alternates 0° / 90° starting from the interior.
 */
declare function cltLayers(opts?: CltOptions): MaterialLayer[];
/**
 * CLT construction: the wall is a single panel (one `WallPart`), the
 * lamellae are layered metadata.
 *
 * @example
 * const Clt160 = new WallType({
 *   name: "CLT 160 (5-ply)",
 *   construction: CltConstruction,
 *   layers: cltLayers({ lamellae: [0.04, 0.02, 0.04, 0.02, 0.04], grade: "C24" }),
 *   properties: { loadBearing: true, fireRating: "REI60" },
 * });
 */
declare const CltConstruction: WallConstruction;

/** Strategy options for `chooseJoistDirection`. */
interface JoistOrientationOptions {
    /** Walls that support the slab. When provided, method 2 is used. */
    supports?: Wall[];
    /**
     * Maximum angle (radians) between two walls to consider them parallel
     * for grouping in method 2. Default: 5°.
     */
    angleTolerance?: number;
    /** Force a particular method. Default: auto. */
    method?: "bbox" | "supports" | "auto";
}
/**
 * Pick a joist direction for a slab. Returns a unit Vec2 indicating the
 * direction joists should run.
 *
 * If `opts.supports` is provided and not empty, uses the support-driven
 * method (#2). Otherwise falls back to the bounding-box heuristic (#1).
 *
 * @example
 *   const dir = chooseJoistDirection(slab, { supports: room.walls });
 */
declare function chooseJoistDirection(slab: Slab, opts?: JoistOrientationOptions): Vec2;
/**
 * Method 1 — joists span the SHORTER dimension of the slab's
 * axis-aligned bounding box. Returns one of `(1, 0)` or `(0, 1)`.
 *
 * For tilted slabs use {@link joistDirectionFromPCA} instead.
 */
declare function joistDirectionFromBounds(boundary: Vec2[]): Vec2;
/**
 * Method 1 variant — PCA-based: returns the unit vector along the
 * shorter principal axis of the boundary point cloud. Better than the
 * AABB heuristic for tilted/rotated slabs.
 */
declare function joistDirectionFromPCA(boundary: Vec2[]): Vec2;
/**
 * Method 2 — joists run perpendicular to the parallel pair of supports
 * with the smallest gap (≈ shortest joist span). Returns `null` when no
 * pair of parallel supporting walls is found (caller should fall back).
 *
 * Walls are grouped by their tangent direction within `angleTol` radians;
 * for each group with ≥ 2 members, the perpendicular spread of the wall
 * centerlines is the candidate joist span; the smallest-spread group
 * wins.
 */
declare function joistDirectionFromSupports(_slab: Slab, supports: Wall[], angleTol?: number): Vec2 | null;
/**
 * Intersect an infinite 2D line `origin + t · direction` with a closed
 * polygon's edges. Returns the *sorted* list of `t` parameters where
 * intersections occur. For convex polygons this is exactly 0 or 2 hits;
 * for non-convex polygons it may be more.
 *
 * Used by `JoistedSlab` to clip joist segments to the slab outline.
 */
declare function lineClipPolygon(origin: Vec2, direction: Vec2, boundary: Vec2[]): number[];

/**
 * Trivial construction: the whole slab is one part (the envelope mesh).
 * Combine with `layers` on the `SlabType` for layered build-ups
 * (concrete + finish, CLT lamellae, etc.).
 *
 * @example
 * const ConcreteSlab = new SlabType({
 *   name: "RC slab 200 mm",
 *   construction: SolidSlabConstruction,
 *   layers: [{ material: "C30/37", thickness: 0.2, position: "core" }],
 *   properties: { loadBearing: true, fireRating: "REI120" },
 * });
 */
declare const SolidSlabConstruction: SlabConstruction;

interface JoistedSlabOptions {
    /** Joist cross-section. Default: KVH 60×220 (typical timber-joist size). */
    profile?: PartProfile;
    /** Joist spacing between centerlines (m). Default: 0.625. */
    spacing?: number;
    /** Material name for joists. Default: `"KVH C24"`. */
    material?: string;
    /**
     * Include a rim joist around the slab perimeter ("Randträger"). When
     * true (default), regular joists are clipped to the rim's inside face
     * so their end faces are perpendicular to their own axis. Set `false`
     * to revert to the unframed behaviour.
     */
    rim?: boolean;
    /** Rim joist cross-section. Default: same as regular joist. */
    rimProfile?: PartProfile;
    /**
     * Distance from the inside face of the rim (or slab boundary, if no rim)
     * to the first / last regular joist's centerline. Larger values give
     * more room between rim and first joist; the canonical value is
     * `spacing` (so the rim-to-first bay matches the inter-joist bay) or
     * `spacing/2` (uniform half-bay at each edge). Default: `spacing/2`.
     */
    edgeOffset?: number;
    /**
     * Gap between a regular joist's end and the rim joist's inside face,
     * in metres. Models the bearing pocket / Balkenschuh (joist hanger)
     * clearance. Set to 0 if you want joists to butt flush. Default: 0.01.
     */
    bearingGap?: number;
    /** Thickness of the structural sheathing layer (m). 0 → no sheathing. Default: 0.022 (22 mm OSB). */
    sheathingThickness?: number;
    /** Material name for sheathing. Default: `"OSB"`. */
    sheathingMaterial?: string;
    /** Thickness of the ceiling layer (m). 0 → no ceiling. Default: 0.0125. */
    ceilingThickness?: number;
    /** Material name for the ceiling layer. Default: `"Gipsfaser"`. */
    ceilingMaterial?: string;
}
/**
 * Joisted-slab construction factory.
 *
 * Determines joist direction in this order:
 *   1. `slab.joistDirection` (explicit user override)
 *   2. `ctx.joistDirection`  (passed in via `realizeSlab` / `SlabSystem`)
 *   3. {@link joistDirectionFromBounds} (bounding-box fallback)
 *
 * @example
 * const FloorType = new SlabType({
 *   name: "Timber joist floor @ 625 mm",
 *   construction: JoistedSlab({ spacing: 0.625, profile: { w: 0.06, h: 0.22 } }),
 *   properties: { loadBearing: true },
 * });
 */
declare function JoistedSlab(options?: JoistedSlabOptions): SlabConstruction;

/**
 * Tekto Three.js Renderer
 *
 * Converts Scene objects → Three.js scene graph.
 * Manages lifecycle, materials, and GPU resources.
 */

type GizmoMode = "translate" | "rotate" | "scale" | "none";
interface ThreeRendererConfig {
    antialias: boolean;
    backgroundColor: number;
    showGrid: boolean;
    gridSize: number;
    gridDivisions: number;
    showAxes: boolean;
    axesSize: number;
    enableOrbitControls: boolean;
    enableDamping: boolean;
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
    fov: number;
    /** Coordinate system up-axis: "y" (Three.js default) or "z" (CAD convention). */
    up: "y" | "z";
}
declare class ThreeRenderer {
    readonly threeScene: THREE.Scene;
    readonly camera: THREE.PerspectiveCamera;
    private _orthoCam;
    private _isOrtho;
    readonly renderer: THREE.WebGLRenderer;
    readonly controls?: OrbitControls;
    /** The currently active camera — perspective or orthographic. */
    get activeCamera(): THREE.Camera;
    private gScene;
    private config;
    private isZUp;
    private objectMap;
    private unsub;
    private rafId;
    private ambientLight;
    private dirLight;
    private hemiLight;
    private currentLighting;
    private studioMetalness;
    private studioRoughness;
    private studioColor;
    private studioFlatShading;
    private hideHelpers;
    private gridHelper;
    private axesHelper;
    private shadowGround;
    private shadowGroundHidden;
    private externalObjects;
    private envMap;
    private envSourceTex;
    private envEnabled;
    private envBackground;
    private container;
    private resizeObserver;
    private raycaster;
    private pickEnabled;
    private pickListeners;
    private transformControls;
    private gizmoMode;
    private gizmoAttachedId;
    private pointerDown;
    private selectionMaterials;
    private dragHandles;
    private dragHandleConstraints;
    private dragHandlePlanes;
    private dragHandleMoveCb;
    private dragHandleEndCb;
    private dragHandlePickCb;
    private activeDragHandle;
    private selectedDragHandle;
    private dragPlane;
    private dragSeenThisRun;
    constructor(gScene: Scene, container: HTMLElement, config?: Partial<ThreeRendererConfig>);
    private handleEvent;
    private addToThree;
    /** Apply `obj.transform` (position/rotation/scale) to a Three.Object3D. */
    private applyTransform;
    private removeFromThree;
    private clearThree;
    /** Rebuild all mesh objects (called when render mode changes). */
    private rebuildAllMeshes;
    /**
     * Build a material that respects the current lighting mode. Studio mode
     * returns an `MeshStandardMaterial` (PBR; reacts correctly to shadows
     * and tonemapping); Flat mode returns the original `MeshPhongMaterial`.
     * Same option surface — caller doesn't have to care which one comes back.
     */
    private _makeMaterial;
    /**
     * Set the Studio-mode default PBR material applied to meshes that don't
     * carry their own metalness/roughness. Takes effect on the next material
     * build (e.g. the next sketch re-run). metalness/roughness in 0..1.
     */
    setStudioMaterial(metalness: number, roughness: number, color?: string | null, flatShading?: boolean): void;
    private _isHelper;
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
    setShadowGroundVisible(visible: boolean): void;
    /**
     * Add a raw THREE.Object3D (e.g. a loaded glTF/GLB scene) to the renderer,
     * persisting across sketch re-runs. Re-adding the same id replaces it.
     * Meshes are flagged to cast + receive shadows (visible in Studio lighting).
     */
    addExternalObject(obj: THREE.Object3D, id: string): void;
    removeExternalObject(id: string): void;
    setHelpersVisible(visible: boolean): void;
    /**
     * Aim the main directional light at the origin from the given unit
     * direction (FROM origin TO light). Input is in Z-up scene coords
     * (+X east, +Y north, +Z up) — typical sun-vector convention; the
     * renderer remaps internally if the scene is Y-up.
     *
     * @param direction Unit vector pointing toward the light source.
     * @param distance  How far back to place the light (m). Default 50.
     */
    setSunDirection(direction: Vec3, distance?: number): void;
    /**
     * Reconfigure renderer + lights + scene shadow flags for the given mode.
     * Material swapping happens after this returns, via `rebuildAllMeshes`.
     */
    private _applyLighting;
    /**
     * Toggle a prefiltered environment map on `threeScene.environment`. Only
     * studio PBR (`MeshStandardMaterial`) materials sample it, so this is a
     * no-op visually in flat mode — but it's safe to enable in either mode.
     * The map is built once on first enable and reused thereafter.
     */
    private _applyEnvironment;
    /**
     * Set an equirectangular source texture for the environment (e.g. a loaded
     * HDR via RGBELoader). Pass null to use the built-in procedural gradient.
     * The texture is PMREM-prefiltered here; the caller keeps ownership of it.
     */
    setEnvironmentSource(equirect: THREE.Texture | null): void;
    /**
     * Show the equirectangular environment source as the scene backdrop (sky).
     * No-op until a source is set via setEnvironmentSource. When off, the
     * background is left to setBackground().
     */
    setEnvironmentBackground(visible: boolean): void;
    /**
     * Rotate the environment + background (Euler radians) — e.g. to align a Y-up
     * HDRI/equirect source with a Z-up scene (tilt ~90° about X).
     */
    setEnvironmentRotation(x: number, y: number, z: number): void;
    private _applyBackground;
    /**
     * Build a prefiltered (PMREM) environment from a procedural vertical
     * gradient — bright neutral sky at the top, mid horizon, darker ground —
     * using core Three only (no `three/examples` RoomEnvironment). Returns the
     * PMREM-filtered cube texture; the source `DataTexture` and the generator
     * are disposed before returning.
     */
    private _buildEnvironment;
    /** Build a THREE.Line for a line-type object — dashed material (+ line distances)
     *  when the style requests it, else a basic line material. */
    private _makeLine;
    private convert;
    /** Convert a Tekto Mesh → Three.js group with solid + wireframe */
    private convertMesh;
    /** Convert flat mesh data (with optional per-vertex colors) → Three.js group */
    private convertFlatMesh;
    /** Shared mesh group builder — handles solid / wireframe / hiddenline render modes */
    private buildMeshGroup;
    private createTextSprite;
    getThreeObject(id: string): THREE.Object3D | undefined;
    /**
     * Project a world-space point into the viewport. Returned `x`, `y` are
     * relative to the canvas's bounding rect (top-left = 0, 0).
     * `visible` is false when the point is behind the camera or outside
     * the normalised device cube — caller should hide the overlay.
     */
    worldToScreen(world: Vec3): {
        x: number;
        y: number;
        visible: boolean;
    };
    /** Enable/disable click-to-pick on the canvas. */
    setPickEnabled(enabled: boolean): void;
    /** Subscribe to pick events. Returns unsubscribe. `id` is null when the user clicked background. */
    onPick(listener: (id: string | null) => void): () => void;
    private onPointerDown;
    private onPointerUp;
    private onPointerMoveDragging;
    private onPointerUpDragging;
    /** Returns the handle name under (clientX, clientY) or null. */
    private dragHandleHitTest;
    /** Raycast at (clientX, clientY) against a Three.Plane; returns the intersection point. */
    private raycastPlane;
    /** Register the per-drag, per-drag-end, and per-pick callbacks. */
    setDragHandleCallbacks(onMove: (name: string, x: number, y: number, z: number) => void, onEnd?: (name: string) => void, onPick?: (name: string | null) => void): void;
    /** Mark the start of a sketch run: clear the "seen this run" set. */
    beginDragHandleSweep(): void;
    /**
     * Create or update a drag handle by stable name. Position is world-space.
     * `constrain` (optional) snaps the dragged position — e.g. to a polyline.
     */
    upsertDragHandle(name: string, x: number, y: number, z: number, color?: string, size?: number, constrain?: (x: number, y: number, z: number) => [number, number, number], plane?: "ground" | "screen"): void;
    /** Remove any drag handles that weren't visited in this run. */
    endDragHandleSweep(): void;
    /** Currently selected drag handle, or null. */
    getSelectedHandle(): string | null;
    /** The handle currently being DRAGGED (set on pointer-down, cleared on pointer-up); null when idle. */
    getActiveDragHandle(): string | null;
    /** Programmatically select / deselect a drag handle (visual + callback). */
    setHandleSelected(name: string | null): void;
    private applyHandleStyle;
    /** Raycast at viewport coordinates and return the topmost pickable scene id (or null). */
    pickAt(clientX: number, clientY: number): string | null;
    setGizmoMode(mode: GizmoMode): void;
    getGizmoMode(): GizmoMode;
    attachGizmo(id: string): void;
    detachGizmo(): void;
    private ensureGizmo;
    /** Read the gizmo'd Three.Object3D's transform and write it back into the SceneObject. */
    private writeBackTransform;
    setSelectionHighlight(id: string | null): void;
    render(): void;
    startLoop(): () => void;
    resize(): void;
    /** Compute the orthographic frustum to match the current perspective camera view distance. */
    private _syncOrthoCamFrustum;
    /**
     * Switch between perspective and orthographic projection.
     * Transfers the current camera position/orientation so the view is continuous.
     */
    setProjection(type: "perspective" | "orthographic"): void;
    /**
     * Set the camera up vector. Use (0,1,0) for top-down plan views (Z-up scenes),
     * and restore (0,0,1) for side/elevation views.
     */
    setCameraUp(x: number, y: number, z: number): void;
    /**
     * Fit all visible scene objects inside the current view.
     * Preserves the camera direction; only adjusts distance and target.
     */
    fitAll(): void;
    /** Pick scene objects under a screen coordinate */
    pick(screenX: number, screenY: number): {
        id: string;
        point: THREE.Vector3;
    } | null;
    /** Project a screen position onto a plane */
    screenToPlane(screenX: number, screenY: number, plane?: THREE.Plane): THREE.Vector3 | null;
    private disposeObject;
    dispose(): void;
}

/**
 * Tekto SVG Renderer
 *
 * Renders Scene objects as SVG for clean 2D visualization.
 * Supports labels, annotations, and CSS styling.
 * Uses XZ plane projection by default.
 */

interface SVGRendererConfig {
    width: number;
    height: number;
    viewBox: {
        minX: number;
        minY: number;
        width: number;
        height: number;
    };
    backgroundColor: string;
    showGrid: boolean;
    gridSpacing: number;
    gridColor: string;
    showLabels: boolean;
    projection: "xz" | "xy" | "yz";
    padding: number;
    pointRadius: number;
}
declare class SVGRenderer {
    private gScene;
    private config;
    private svg;
    private contentGroup;
    private gridGroup;
    private unsub;
    constructor(gScene: Scene, container: HTMLElement, config?: Partial<SVGRendererConfig>);
    private project;
    private drawGrid;
    render(): void;
    private renderObject;
    private createSVGCircle;
    private createSVGLine;
    private createSVGPolygon;
    private createSVGText;
    /** Update the viewBox (pan/zoom) */
    setViewBox(minX: number, minY: number, width: number, height: number): void;
    dispose(): void;
}

/**
 * LayerPanel — reusable tree-based layer/visibility panel.
 *
 * Pure DOM, no framework dependency. Embeds in the Sketch API via
 * lab.layerTree(), or use standalone by appending .el to any container.
 *
 * Parent visibility works as a NON-DESTRUCTIVE MASK:
 *   - Hiding a parent dims its children visually but does NOT change their
 *     stored state. Re-enabling the parent restores children as they were.
 *   - Use computeEffectiveVisibility() to get the resolved visibility for
 *     each node (own state AND all ancestor states combined).
 */
interface LayerNode {
    /** Unique identifier — used as key in LayerMap */
    id: string;
    /** Display label */
    label: string;
    /** Initial visibility (default: true) */
    defaultVisible?: boolean;
    /** Initial color. When defined, a color picker is shown next to the label. */
    defaultColor?: string;
    /** Child nodes */
    children?: LayerNode[];
}
interface LayerState {
    visible: boolean;
    color: string;
}
/** Flat map of node id → stored state (own toggle only, not ancestor-aware) */
type LayerMap = Record<string, LayerState>;
/**
 * Traverse a layer tree and return a map of id → effective visibility,
 * where a node is effectively visible only when it AND all its ancestors
 * are individually visible.
 *
 * Use this in your render function instead of reading `layers[id].visible`
 * directly — it gives the correct CAD-style masked result.
 */
declare function computeEffectiveVisibility(nodes: LayerNode[], value: LayerMap): Record<string, boolean>;
declare class LayerPanel {
    /** Mount this element anywhere in your UI */
    readonly el: HTMLElement;
    private _nodes;
    private _value;
    private _onChange;
    private _collapsed;
    private _isDark;
    constructor(opts: {
        nodes: LayerNode[];
        value: LayerMap;
        onChange: (updates: LayerMap) => void;
        isDark?: boolean;
    });
    /**
     * Re-render with new nodes/value.
     * Scroll position and collapsed state are preserved.
     */
    update(nodes: LayerNode[], value: LayerMap): void;
    private _stateOf;
    private _rebuild;
    /**
     * @param ancestorVisible — whether all ancestors are currently visible.
     *   Used only for visual dimming; does NOT affect stored state.
     */
    private _renderNode;
}

/**
 * Sketch public type definitions.
 *
 * Extracted from `Sketch.ts` to keep the implementation file focused on
 * runtime behaviour. All `Lab.*` methods, handle interfaces, config
 * interfaces, and the export/import registration shapes live here.
 *
 * Internal types (`SketchFn`, `ParamState`, `LogEntry`) stay in
 * `Sketch.ts` since they're implementation details of `SketchInstance`.
 */

interface SketchConfig {
    /** DOM element or CSS selector to mount into */
    container?: HTMLElement | string;
    /** Title shown in the header */
    title?: string;
    /** Background color (hex number) */
    background?: number;
    /** Show grid */
    grid?: boolean;
    /** Show axes */
    axes?: boolean;
    /** Camera starting position */
    camera?: [number, number, number];
    /** Camera look-at target */
    target?: [number, number, number];
    /** Show the 2D projection panel */
    show2D?: boolean;
    /** Panel width in pixels */
    panelWidth?: number;
    /** Dark or light theme */
    theme?: "dark" | "light";
    /** Up-axis: "y" (Three.js default) or "z" (CAD convention, XY = ground plane) */
    up?: "y" | "z";
    /**
     * Show the sketch's internal title/LIVE-badge header. Default `true`.
     * Set `false` when the sketch is mounted inside a shell (testbench / app
     * frame) that already provides a top bar with the current page title.
     */
    showHeader?: boolean;
}
/** Item registered via `lab.registerExport(...)`. */
interface ExportRegistration {
    name: string;
    fileName: string;
    mimeType?: string;
    handler: () => Blob | Promise<Blob>;
}
/** Item registered via `lab.registerImport(...)`. */
interface ImportRegistration {
    name: string;
    accept?: string;
    handler: (file: File) => void | Promise<void>;
}
/** A reactive value — reads .value, triggers sketch re-run on change */
interface Reactive$1<T> {
    readonly value: T;
}
/** Options for slider */
interface SliderOpts$1 {
    step?: number;
    label?: string;
    group?: string;
    tab?: string;
    menu?: string;
    color?: string;
}
/** Options for select */
interface SelectOpts$1 {
    label?: string;
    group?: string;
    tab?: string;
    menu?: string;
}
/** A handle to a mesh in the scene — fluent chainable API */
interface MeshHandle {
    readonly id: string;
    readonly mesh: ConnectedMesh;
    color(c: string): MeshHandle;
    opacity(o: number): MeshHandle;
    wireframe(w?: boolean): MeshHandle;
    visible(v?: boolean): MeshHandle;
    label(l: string): MeshHandle;
    doubleSided(d?: boolean): MeshHandle;
    /** Show back-faces in this color (debug: reveals flipped normals). */
    backfaceColor(c: string | undefined): MeshHandle;
    /** Set the color for a named group (only applies when the mesh has groups). */
    groupColor(name: string, color: string): MeshHandle;
    /** Exclude this mesh from export (e.g. DXF). */
    noExport(v?: boolean): MeshHandle;
    /** Assign a semantic layer / class name (used by exports, filtering, debug). */
    layer(name: string): MeshHandle;
    translate(x: number, y: number, z: number): MeshHandle;
    scale(s: number): MeshHandle;
    rotateX(rad: number): MeshHandle;
    rotateY(rad: number): MeshHandle;
    rotateZ(rad: number): MeshHandle;
    subdivide(iterations?: number): MeshHandle;
    smooth(iterations?: number, factor?: number): MeshHandle;
    volume(): number;
    surfaceArea(): number;
    nodeCount(): number;
    faceCount(): number;
    edgeCount(): number;
}
/** A handle to a point */
interface PointHandle {
    readonly id: string;
    color(c: string): PointHandle;
    size(s: number): PointHandle;
    label(l: string): PointHandle;
    moveTo(x: number, y: number, z: number): PointHandle;
    position(): Vec3;
    /** Assign a semantic layer / class name (used by exports, filtering, debug). */
    layer(name: string): PointHandle;
}
/** A handle to a line/segment */
interface LineHandle {
    readonly id: string;
    color(c: string): LineHandle;
    opacity(o: number): LineHandle;
    radius(r: number): LineHandle;
    /** Assign a semantic layer / class name (used by exports, filtering, debug). */
    layer(name: string): LineHandle;
    /** Render dashed (world-unit dash/gap), via THREE.LineDashedMaterial.
     *  Defaults: size 0.05, gap = size. */
    dashed(size?: number, gap?: number): LineHandle;
    /** Tag this line for selection — surfaced as `pick.tag` in lab.onPick. */
    pickTag(tag: string): LineHandle;
    /** Enable/disable click-picking for this line (default true). */
    pickable(p?: boolean): LineHandle;
}
/** Shape mode for beginShape/endShape */
type ShapeMode = "triangles" | "lines" | "line_strip" | "quads";
/** The Lab context passed to every sketch function */
/** Where an interactive handle may move (used by lab.handles). */
type DragSpace = {
    kind: "free";
} | {
    kind: "ground";
} | {
    kind: "plane";
    origin: Vec3;
    normal: Vec3;
} | {
    kind: "axis";
    origin: Vec3;
    dir: Vec3;
} | {
    kind: "curve";
    at: (t: number) => Vec3;
    samples?: number;
};
/** Options for lab.handles — a data-bound set of draggable handles. The model is
 *  the source of truth: handles re-seed from `position` each run (so slider/other
 *  edits are followed) except the one actively being dragged, whose moved position
 *  is written back via `onDrag`. */
interface HandleSetOpts<T> {
    key: (item: T, i: number) => string;
    position: (item: T, i: number) => Vec3;
    space?: (item: T, i: number) => DragSpace;
    onDrag: (item: T, p: Vec3, i: number) => void;
    color?: string;
    size?: number;
}
interface Lab {
    slider(label: string, min: number, max: number, defaultValue: number, opts?: SliderOpts$1): Reactive$1<number>;
    /**
     * Programmatically set an existing slider's value — updates both the value the
     * sketch reads and the on-screen slider control. Identify the slider by its
     * `label` and (if it was created with one) its `group`. No-op if not found.
     */
    setSlider(label: string, value: number, opts?: {
        group?: string;
    }): void;
    toggle(label: string, defaultValue?: boolean, opts?: {
        group?: string;
        tab?: string;
        menu?: string;
    }): Reactive$1<boolean>;
    select<T extends string>(label: string, options: T[], defaultValue?: T, opts?: SelectOpts$1): Reactive$1<T>;
    colorPicker(label: string, defaultValue?: string, opts?: {
        group?: string;
        tab?: string;
        menu?: string;
    }): Reactive$1<string>;
    /**
     * Render a scrollable layer-tree panel — checkboxes, collapse/expand, and
     * optional per-node color pickers. Returns a reactive `LayerMap`
     * (`Record<id, { visible, color }>`).
     *
     * The panel instance is persistent: collapsed state and scroll position
     * survive sketch re-runs. Nodes can change between runs (e.g. async loads).
     */
    layerTree(label: string, nodes: LayerNode[], opts?: {
        group?: string;
        tab?: string;
    }): Reactive$1<LayerMap>;
    button(label: string, action: () => void, opts?: {
        group?: string;
        tab?: string;
        menu?: string;
    }): void;
    separator(): void;
    /**
     * Register an "Export ▾" item for the host shell (testbench / app)
     * to surface in its top-bar Export menu. The handler returns a `Blob`
     * (or a Promise of one); the shell handles the download.
     *
     * Idempotent across sketch re-runs (re-registering the same `name`
     * just refreshes the handler closure).
     *
     *   lab.registerExport({
     *     name:     "IFC",                          // shown as menu label
     *     fileName: "model.ifc",                    // default download name
     *     mimeType: "application/ifc",              // optional
     *     handler:  () => writer.saveBlob(),
     *   });
     */
    registerExport(opts: {
        name: string;
        fileName: string;
        mimeType?: string;
        handler: () => Blob | Promise<Blob>;
    }): void;
    /**
     * Register an "Import ▾" item for the host shell. The handler receives
     * the user-selected `File`.
     *
     *   lab.registerImport({
     *     name:    "OBJ",
     *     accept:  ".obj",                          // file-input filter
     *     handler: async (file) => loadObj(await file.text()),
     *   });
     */
    registerImport(opts: {
        name: string;
        accept?: string;
        handler: (file: File) => void | Promise<void>;
    }): void;
    mesh(m: ConnectedMesh, style?: Partial<VisualStyle>): MeshHandle;
    flatMesh(data: FlatMeshData, style?: Partial<VisualStyle>): MeshHandle;
    sphere(radius?: number, segments?: number, rings?: number): MeshHandle;
    box(width?: number, height?: number, depth?: number): MeshHandle;
    torus(majorR?: number, minorR?: number, segments?: number, sides?: number): MeshHandle;
    cylinder(radiusTop?: number, radiusBottom?: number, height?: number, segments?: number): MeshHandle;
    grid(width?: number, depth?: number, divX?: number, divZ?: number, heightFn?: (x: number, z: number) => number): MeshHandle;
    revolve(profile: Vec2[], segments?: number): MeshHandle;
    extrude(polygon: Vec3[], direction: Vec3): MeshHandle;
    point(x: number, y: number, z: number): PointHandle;
    points(positions: Vec3[]): PointHandle[];
    line(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): LineHandle;
    /**
     * Draw a polyline as a single GPU-buffered line — orders of magnitude faster
     * than `beginShape("line_strip")` when emitting thousands of curves. The
     * returned handle's `radius()` is a no-op (buffered lines don't support
     * tube radius).
     */
    polyline(points: Vec3[]): LineHandle;
    polygon(vertices: Vec3[], style?: Partial<VisualStyle>): string;
    circle(cx: number, cy: number, cz: number, radius: number): string;
    algo: typeof Algo;
    MeshGen: typeof MeshFactory;
    clear(): void;
    background(color: number): void;
    camera(x: number, y: number, z: number): void;
    lookAt(x: number, y: number, z: number): void;
    /** Fit all visible scene objects into the current view. */
    fitAll(): void;
    /** Switch between perspective and parallel (orthographic) projection. */
    setProjection(type: "perspective" | "orthographic"): void;
    /**
     * Set the camera up vector.
     * Use (0,1,0) for top-down plan views (avoids gimbal lock in Z-up scenes).
     * Use (0,0,1) to restore Z-up for elevation/side views.
     */
    cameraUp(x: number, y: number, z: number): void;
    log(label: string, value?: string | number): void;
    info(text: string): void;
    /**
     * Aim the main directional light at the origin from `direction`
     * (FROM origin TO light, Z-up scene coords). Use with `SunPosition`
     * to drive shadow studies from date + lat/lon — see the Timber demo.
     *
     *   const sun = SunPosition.compute({ date, latitude, longitude });
     *   if (sun.isDaytime) lab.setSunDirection(sun.direction);
     */
    setSunDirection(direction: Vec3, distance?: number): void;
    vec2(x: number, y: number): Vec2;
    vec3(x: number, y: number, z: number): Vec3;
    readonly PI: number;
    readonly TWO_PI: number;
    readonly HALF_PI: number;
    readonly TAU: number;
    readonly QUARTER_PI: number;
    sin(a: number): number;
    cos(a: number): number;
    tan(a: number): number;
    atan2(y: number, x: number): number;
    abs(v: number): number;
    sqrt(v: number): number;
    pow(b: number, e: number): number;
    floor(v: number): number;
    ceil(v: number): number;
    round(v: number): number;
    min(a: number, b: number): number;
    max(a: number, b: number): number;
    lerp(a: number, b: number, t: number): number;
    map(value: number, start1: number, stop1: number, start2: number, stop2: number): number;
    constrain(val: number, min: number, max: number): number;
    dist(x1: number, y1: number, x2: number, y2: number): number;
    rad(degrees: number): number;
    deg(radians: number): number;
    noise(x: number, y?: number, z?: number): number;
    random(min?: number, max?: number): number;
    randomSeed(seed: number): void;
    rgb(r: number, g?: number, b?: number): string;
    readonly mouseX: number;
    readonly mouseY: number;
    readonly pmouseX: number;
    readonly pmouseY: number;
    readonly mousePressed: boolean;
    readonly key: string;
    readonly keyPressed: boolean;
    onMouseClicked(fn: () => void): void;
    onMouseDragged(fn: () => void): void;
    onKeyPressed(fn: (key: string) => void): void;
    onKeyReleased(fn: (key: string) => void): void;
    /**
     * The viewport container element (parent of the canvas). Append custom
     * HTML overlays (popups, tooltips, in-scene labels) here — they will be
     * cleaned up automatically when the sketch is disposed.
     */
    readonly viewport: HTMLElement;
    /**
     * Project a world-space point to canvas-local pixel coordinates. Use
     * to position HTML overlays at 3D points (joint markers, callouts,
     * annotations). Returns `visible: false` when the point is behind the
     * camera or outside the frustum.
     */
    worldToScreen(x: number, y: number, z: number): {
        x: number;
        y: number;
        visible: boolean;
    };
    /**
     * Force a sketch re-run. Use after mutating shared state from a custom
     * event handler (e.g. an `<select>` `change` listener inside an HTML
     * overlay) that the library doesn't already track.
     */
    invalidate(): void;
    /**
     * Enable or disable click-to-pick on the viewport. When enabled, clicking
     * a pickable object selects it (and attaches the transform gizmo if a mode
     * other than "none" is active). Default: disabled.
     */
    enablePicking(enabled?: boolean): void;
    /** Register a callback invoked on every click pick. `id` is null for background clicks. */
    onPick(fn: (id: string | null, pick?: {
        tag?: string;
        layer?: string;
    }) => void): void;
    /** Set the gizmo mode: translate (W), rotate (E), scale (R), or none. */
    setGizmoMode(mode: "translate" | "rotate" | "scale" | "none"): void;
    /** Programmatically select an object (shows the gizmo + highlight). */
    setSelected(id: string | null): void;
    /** The currently selected object id, or null. */
    readonly selectedId: string | null;
    /**
     * Create a draggable control point. Returns a reactive `Vec3` value:
     * read `.value.x` / `.value.y` / `.value.z` to use the current position.
     * Dragging the handle in the viewport (left-click + drag, ground-plane constrained)
     * updates the value and re-runs the sketch.
     *
     * Handles are persisted across re-runs by `opts.name` (default: declaration order).
     * Pass an explicit name when you want stable identity, e.g. when the call site moves.
     *
     * `opts.constrain` (optional): snap function applied during drag — receives
     * the raw raycast position and returns the constrained position. Use to lock
     * a handle to a curve (e.g. opening positions along a wall centerline) or
     * a plane.
     *
     * `opts.plane` (optional): which plane the drag is constrained to. "ground"
     * (default) drags perpendicular to the world up axis; "screen" drags in the
     * camera-facing plane, letting a handle move in elevation in a side view.
     */
    dragHandle(x: number, y: number, z: number, opts?: {
        name?: string;
        color?: string;
        size?: number;
        constrain?: (x: number, y: number, z: number) => [number, number, number];
        plane?: "ground" | "screen";
    }): Reactive$1<Vec3>;
    /**
     * Data-bound set of draggable handles. Declare it every run with your model
     * items; each gets a handle keyed by `key`. The model is the source of truth —
     * handles re-seed from `position` each run (so slider/other edits are followed)
     * except the one actively being dragged, whose moved position is written back
     * via `onDrag`. Built on dragHandle + the mark-and-sweep lifecycle.
     */
    handles<T>(items: T[], opts: HandleSetOpts<T>): void;
    /**
     * Register a callback invoked when a drag handle is clicked (with or
     * without movement). `name` is null when the user clicks empty space.
     * Used for selecting opening positions, joint handles, etc.
     */
    onHandlePick(fn: (name: string | null) => void): void;
    /** Programmatically select or deselect a drag handle. */
    setHandleSelected(name: string | null): void;
    /** The currently selected drag handle name, or null. */
    readonly selectedHandle: string | null;
    /**
     * The handle currently being dragged (set on pointer-down, null on release).
     * Use to detect an in-progress drag — unlike `selectedHandle`, which persists
     * after the gesture ends until another pick.
     */
    readonly activeDragHandle: string | null;
    beginShape(mode?: ShapeMode): void;
    vertex(x: number, y: number, z: number): void;
    /** Horizontal quad at height z. Vertices A→B→C→D CCW from above = normal up. Reverse order for normal down. Must be inside beginShape("quads"). */
    hQuad(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number, z: number): void;
    /** Vertical quad spanning zTop→zBot. Normal points LEFT of A→B direction (looking down from +Z). Must be inside beginShape("quads"). */
    vQuad(ax: number, ay: number, bx: number, by: number, zTop: number, zBot: number): void;
    endShape(close?: boolean): MeshHandle | LineHandle | null;
    readonly frame: number;
    readonly time: number;
    readonly dt: number;
    /**
     * Register a per-frame callback.
     *
     * Default: the sketch function re-runs every frame (immediate mode).
     * With `{ retain: true }`: the sketch only re-runs on param changes.
     * The animate callback runs per-frame either way.
     */
    animate(fn: (time: number, dt: number) => void, opts?: {
        retain?: boolean;
    }): void;
    getScene(): Scene;
}

type SketchFn = (lab: Lab) => void;
declare function sketch(fn: SketchFn, config?: SketchConfig): SketchInstance;
declare class SketchInstance {
    private fn;
    private config;
    private container;
    private scene;
    private renderer;
    private params;
    private buttons;
    exports: Map<string, ExportRegistration>;
    imports: Map<string, ImportRegistration>;
    private _exportListeners;
    private _importListeners;
    private logs;
    private infoText;
    private animateFn;
    private frame;
    private startTime;
    private lastTime;
    private disposed;
    private collapsedGroups;
    private activeTab;
    private activeMenu;
    private rng;
    private _mouseX;
    private _mouseY;
    private _pmouseX;
    private _pmouseY;
    private _mousePressed;
    private _key;
    private _keyPressed;
    private _onMouseClicked;
    private _onMouseDragged;
    private _onKeyPressed;
    private _onKeyReleased;
    private _onPick;
    private _selectedId;
    private _pickEnabled;
    private _pickUnsub;
    private _dragHandles;
    private _dragHandleSeq;
    private _dragHandlesWired;
    private _onHandlePick;
    private _boundKeyDown;
    private _boundKeyUp;
    private _shapeVerts;
    private _shapeMode;
    private _continuous;
    private _retain;
    private panelEl;
    private viewportEl;
    private logEl;
    private separatorCount;
    private _prevParamFingerprint;
    private _panelLogEl;
    private _panelInfoEl;
    private _lastRerunTime;
    private _rerunTimer;
    constructor(fn: SketchFn, config: SketchConfig);
    private buildDOM;
    private initRenderer;
    private wireInput;
    enablePicking(enabled: boolean): void;
    setGizmoMode(mode: "translate" | "rotate" | "scale" | "none"): void;
    setSelected(id: string | null): void;
    /** Create or update a drag handle for this sketch run; returns a Reactive<Vec3>. */
    registerDragHandle(initX: number, initY: number, initZ: number, opts?: {
        name?: string;
        color?: string;
        size?: number;
        constrain?: (x: number, y: number, z: number) => [number, number, number];
        plane?: "ground" | "screen";
    }): Reactive$1<Vec3>;
    setHandleSelected(name: string | null): void;
    get selectedHandle(): string | null;
    get activeDragHandle(): string | null;
    /** Programmatically set a slider's value — updates the stored param AND its live DOM control. */
    setSlider(label: string, value: number, group?: string): void;
    private runSketch;
    private buildLab;
    private addMeshHandle;
    private addFlatMeshHandle;
    private addPointHandle;
    private addLineHandle;
    private addPolylineHandle;
    private rebuildPanel;
    private renderParam;
    private updateLog;
    private startLoop;
    /** Throttled sketch re-run — at most once per 50ms so the browser stays responsive during slider drag. */
    private scheduleRerun;
    /** Force re-run the sketch */
    rerun(): void;
    /** Change the scene render mode (solid / wireframe / hiddenline). */
    setRenderMode(mode: RenderMode): void;
    /**
     * Switch shading preset. `"studio"` enables PBR materials, sun-style
     * shadows, and ACES tonemapping; `"flat"` is the lightweight default.
     * See `LightingMode` in `src/scene/Scene.ts` for the trade-offs.
     */
    setLightingMode(mode: LightingMode): void;
    /**
     * Toggle a procedural environment map for image-based reflections. Only
     * visibly affects `"studio"` PBR materials (it modulates their specular
     * highlights / reflections); harmless in `"flat"` mode.
     */
    setEnvironment(enabled: boolean): void;
    /**
     * Set an equirectangular source texture (e.g. an HDR loaded via RGBELoader)
     * for the environment map. Pass null for the built-in procedural gradient.
     */
    setEnvironmentSource(equirect: THREE.Texture | null): void;
    /** Show the environment source (e.g. the HDR) as the visible sky backdrop. */
    setEnvironmentBackground(visible: boolean): void;
    /** Rotate the environment + background (Euler radians); aligns a Y-up HDRI to Z-up. */
    setEnvironmentRotation(x: number, y: number, z: number): void;
    /**
     * Add a raw THREE.Object3D (e.g. a glTF/GLB scene loaded with GLTFLoader) to
     * the scene, kept across sketch re-runs. Re-adding the same id replaces it.
     */
    addExternalObject(obj: THREE.Object3D, id: string): void;
    removeExternalObject(id: string): void;
    /**
     * Studio-mode default PBR material for meshes that don't set their own
     * metalness/roughness in their VisualStyle. metalness 0..1 (1 = metal),
     * roughness 0..1 (0 = mirror). Applies on the next sketch re-run.
     */
    setStudioMaterial(metalness: number, roughness: number, color?: string | null, flatShading?: boolean): void;
    /**
     * Show/hide line + point "helper" objects (axes, construction lines, markers,
     * labels) while keeping solid meshes — e.g. for a clean render view.
     */
    setHelpersVisible(visible: boolean): void;
    /**
     * Show/hide tekto's studio shadow-catcher plane at the origin. Hide it when
     * your sketch provides its own ground to receive shadows.
     */
    setShadowGroundVisible(visible: boolean): void;
    /**
     * Aim the main directional light from outside the sketch fn — used
     * by host shells (testbench, custom apps) to push a sun position
     * computed from their own date/location UI. Inside a sketch, prefer
     * `lab.setSunDirection(direction)`.
     */
    setSunDirection(direction: Vec3, distance?: number): void;
    /**
     * Read the sketch's registered export entries (via `lab.registerExport`).
     * Returns a fresh snapshot — safe to iterate without holding a reference
     * to the underlying Map.
     */
    getExports(): ExportRegistration[];
    getImports(): ImportRegistration[];
    /**
     * Subscribe to export/import registration changes. The shell (testbench
     * top bar, app frame) uses this to re-render its menus when the sketch
     * adds or replaces entries between re-runs.
     */
    onExportsChange(fn: () => void): () => void;
    onImportsChange(fn: () => void): () => void;
    /** Destroy the sketch and clean up */
    dispose(): void;
}

/**
 * Tekto Sketch2D API
 *
 * Lightweight 2D canvas sketch — same panel/controls as Sketch,
 * but renders to a raw CanvasRenderingContext2D instead of Three.js.
 * No WebGL, no Three.js dependency.
 *
 * ─── Usage ───────────────────────────────────
 *
 *   import { sketch2d } from "tekto";
 *
 *   sketch2d((lab) => {
 *     const r = lab.slider("Radius", 1, 100, 30);
 *     const color = lab.colorPicker("Fill", "#38d9a9");
 *
 *     lab.draw((ctx, w, h) => {
 *       ctx.clearRect(0, 0, w, h);
 *       ctx.fillStyle = color.value;
 *       ctx.beginPath();
 *       ctx.arc(w / 2, h / 2, r.value, 0, Math.PI * 2);
 *       ctx.fill();
 *     });
 *   });
 *
 * ─── How it works ────────────────────────────
 *
 *   Like Sketch, the function re-runs when any parameter changes.
 *   The draw callback receives a 2D context and canvas dimensions.
 *   Use lab.animate() for continuous rendering.
 */

interface Sketch2DConfig {
    /** DOM element or CSS selector to mount into */
    container?: HTMLElement | string;
    /** Title shown in the header */
    title?: string;
    /** Canvas background color (CSS) */
    background?: string;
    /** Panel width in pixels (default 280) */
    panelWidth?: number;
    /** Dark or light theme */
    theme?: "dark" | "light";
}
interface Reactive<T> {
    readonly value: T;
}
interface SliderOpts {
    step?: number;
    group?: string;
}
interface SelectOpts {
    group?: string;
}
type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
type AnimateFn = (time: number, dt: number) => void;
/** A single pointer (mouse / touch / pen) sample in CSS pixels relative to the canvas. */
interface Pointer2D {
    /** X in CSS pixels, relative to the canvas top-left. */
    x: number;
    /** Y in CSS pixels, relative to the canvas top-left. */
    y: number;
    /** Stable id for this pointer — match it across down/move/up to track one finger. */
    id: number;
}
type PointerFn = (p: Pointer2D) => void;
/** The lab context passed to the sketch function */
interface Lab2D {
    slider(label: string, min: number, max: number, defaultValue: number, opts?: SliderOpts): Reactive<number>;
    toggle(label: string, defaultValue?: boolean, opts?: {
        group?: string;
    }): Reactive<boolean>;
    select<T extends string>(label: string, options: readonly T[], defaultValue?: T, opts?: SelectOpts): Reactive<T>;
    colorPicker(label: string, defaultValue?: string, opts?: {
        group?: string;
    }): Reactive<string>;
    button(label: string, action: () => void, opts?: {
        group?: string;
    }): void;
    /** Register the draw callback. Called on every re-run and animation frame. */
    draw(fn: DrawFn): void;
    /** Enable continuous animation. Callback runs each frame. */
    animate(fn: AnimateFn): void;
    /** Get the raw canvas element (for advanced use like multiple canvases) */
    readonly canvas: HTMLCanvasElement;
    /** Get the 2D rendering context */
    readonly ctx: CanvasRenderingContext2D;
    /** Canvas width in CSS pixels */
    readonly width: number;
    /** Canvas height in CSS pixels */
    readonly height: number;
    /** Device pixel ratio */
    readonly dpr: number;
    log(label: string, value?: string | number): void;
    vec2(x: number, y: number): Vec2;
    PI: number;
    TWO_PI: number;
    sin: typeof Math.sin;
    cos: typeof Math.cos;
    atan2: typeof Math.atan2;
    abs: typeof Math.abs;
    sqrt: typeof Math.sqrt;
    floor: typeof Math.floor;
    ceil: typeof Math.ceil;
    round: typeof Math.round;
    min: typeof Math.min;
    max: typeof Math.max;
    lerp: typeof MathUtils.lerp;
    clamp: typeof MathUtils.clamp;
    noise(x: number, y?: number, z?: number): number;
    random(min?: number, max?: number): number;
    randomSeed(seed: number): void;
    readonly mouseX: number;
    readonly mouseY: number;
    readonly mousePressed: boolean;
    /**
     * Pointer input (mouse + touch + pen, unified). Register a handler that
     * fires on every pointer-down. Coordinates are CSS pixels relative to the
     * canvas; `id` is stable across the down/move/up of one finger so multi-touch
     * gestures can be tracked. Handlers are re-collected on each sketch re-run,
     * so register them at the top level of the sketch body (like `draw`).
     *
     * To keep a drag tracking outside the canvas bounds, call
     * `lab.canvas.setPointerCapture(id)` inside the down handler.
     */
    onPointerDown(fn: PointerFn): void;
    /** Fires on pointer-move for any active pointer. See {@link onPointerDown}. */
    onPointerMove(fn: PointerFn): void;
    /** Fires on pointer-up / pointer-cancel. See {@link onPointerDown}. */
    onPointerUp(fn: PointerFn): void;
}
type Sketch2DFn = (lab: Lab2D) => void;
declare function sketch2d(fn: Sketch2DFn, config?: Sketch2DConfig): Sketch2DInstance;
declare class Sketch2DInstance {
    private fn;
    private config;
    private container;
    private canvas;
    private ctx;
    private panelEl;
    private logEl;
    private params;
    private buttons;
    private logs;
    private drawFn;
    private animateFn;
    private pointerDownFns;
    private pointerMoveFns;
    private pointerUpFns;
    private continuous;
    private _prevFingerprint;
    private rng;
    private disposed;
    private startTime;
    private lastTime;
    private rerunTimer;
    private _mouseX;
    private _mouseY;
    private _mousePressed;
    constructor(fn: Sketch2DFn, config: Sketch2DConfig);
    private get isDark();
    private buildDOM;
    private resizeCanvas;
    private wireInput;
    private runSketch;
    private redraw;
    private scheduleRerun;
    private buildLab;
    private rebuildPanel;
    private updateLog;
    private startLoop;
    /** Tear down the sketch */
    dispose(): void;
}

export { AABB, type AddWallSystemOptions, Algo, type AnimateFn, ArcCurve, type Axis, BalloonFrame, type BalloonFrameOptions, BlobDetect, type BspNode, type BspPolygon, BspTree, Capsule2D, CltConstruction, type CltOptions, FlatMeshData as ColoredMeshData, ConnectedMesh, type ConnectionType, CubicBezierCurve, Curvature, CurveUtils, type CutListItem, Delaunay2D, DistanceTransform, type DoorOperation, type DrawFn, type DxfEdgeOptions, DxfExporter, type DxfLayerDef, type DxfMeshOptions, type DxfSegment, type DxfView, type DxfWorkerRequest, type DxfWriteOptions, type ExportRegistration, ExtrudedRibbon, type ExtrudedRibbonOptions, type FilletResult, Mesh as FlatMesh, MeshData as FlatMeshData, FlatMeshGen, FloodFill, Graph, GridGraph, HMath, HPlane, HelixCurve, HolzrahmenBau, HolzrahmenBauJointStyle, type HolzrahmenBauOptions, type ICurve, type IMetricCurve, type ISdf, type IdBufferOptions, IfcFile, type IfcParseOptions, IfcWriter, type IfcWriterOptions, type ImportRegistration, type Intersect2DResult, Intersections, type JointKind, type JointParticipant, type JointStyle, type JointTrim, type JoistOrientationOptions, JoistedSlab, type JoistedSlabOptions, type Lab, type Lab2D, type LatticeType, type LayerMap, type LayerNode, LayerPanel, type LayerPosition, type LayerState, LightingMode, LineCurve, type LineHandle, MITER_LIMIT, MarchingCubes, MarchingSquares, Mat4, type MaterialLayer, MathUtils, ConnectedMesh as Mesh, MeshAnalysis, type MeshBuffers, MeshCleanup, MeshFactory, MeshFactory as MeshGen, type MeshHandle, MeshSubdivide, MeshTransform, type MicroPatternType, NurbsCurve, NurbsSurface, OBB2D, OpeningType, type OpeningTypeOptions, PGFace, PGHalfEdge, PGVertex, type PartProfile, PixelView, PlanarGraph, PlanarGraphCleanup, PlanarGraphRepair, HPlane as Plane, type PointClassification, type PointHandle, type Pointer2D, type PointerFn, Polygon2D, PolylineCurve, type ProjectedSegment, type PropertyMap, Ray, type Reactive$1 as Reactive, type RealizedSlab, type RealizedWall, Mesh as RenderMesh, RenderMode, RibbonEndTrim, RibbonFrame, RibbonJoint, RibbonOpening, RibbonSystem, RigidBody2D, type RigidBodyConfig, type SVGOptions, SVGRenderer, type SVGRendererConfig, Scene, SdfBlend, SdfBoundedExtrude, SdfBox, SdfCapsule, SdfCone, SdfCylinder, SdfEllipsoid, SdfExtrude, SdfGradient, SdfIntersect, SdfLattice, SdfLine as SdfLineField, SdfMicrostructure, SdfMirror, SdfOffset, SdfOnion, SdfOps, SdfPlane as SdfPlaneField, SdfRadialArray, SdfRevolution, SdfShell, SdfSmoothSubtract, SdfSmoothUnion, SdfSphere, SdfSubtract, SdfTorus, SdfTransform, SdfTwist, SdfUnion, SdfUtils, SdfVoronoi, type SeededRandom, Segment, type SelectOpts$1 as SelectOpts, type ShapeMode, type Sketch2DConfig, type Sketch2DFn, Sketch2DInstance, type SketchConfig, SketchInstance, Slab, type SlabConstruction, type SlabContext, SlabOpening, type SlabOptions, type SlabPart, type SlabPartRole, SlabType, type SlabTypeOptions, type SliderOpts$1 as SliderOpts, SolidConstruction, SolidSlabConstruction, Space, type SpaceOptions, Sphere, type Spring, Spring2D, type SpringConfig, SpringSystem3D, Stair, type StairFlight, type StairOptions, type StairShape, StairType, type StairTypeOptions, type StreamlineOptions, StreamlineTracer, SunPosition, type SunPositionInput, type SunPositionResult, ThreeRenderer, type ThreeRendererConfig, Triangle, Vec2, Vec3, VecMath, type VertexCurvature, type VisibilityOptions, type VisibilityResult, type VisibilityView, VisualStyle, VoxelGrid, VoxelGrid2D, Wall, type WallConstruction, WallJoint, type WallJointOptions, WallOpening, type WallOptions, type WallPart, type WallPartRole, WallSystem, WallType, type WindowPartitioning, boundingWalls, buildCutList, chooseJoistDirection, clampedUniformKnots, closestPointOnSegment, cltLayers, computeEffectiveVisibility, createRandom, extractVisiblePolylines, hiddenLineIdBuffer, holzrahmenbauLayers, joistDirectionFromBounds, joistDirectionFromPCA, joistDirectionFromSupports, lineClipPolygon, noise, polygonFromVertices, polygonIntersection, polylinesToSVG, processWorkerRequest, realize, realizeSlab, repelBodies, segmentSegmentClosest, sketch, sketch2d };
