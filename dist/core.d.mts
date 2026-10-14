import { V as Vec3, r as Vec2, f as Mat4, T as Triangle, A as AABB, M as Mesh, c as MeshData } from './Scene-BHniJuab.mjs';
export { F as ColoredMeshData, d as LegacyMeshJSON, e as LightSpec, L as LightingMode, g as MeshEdge, h as MeshFace, i as MeshJSON, j as MeshNode, k as MeshValidation, O as ObjFile, l as ObjMeshData, P as Projection, R as RenderMode, S as Scene, m as SceneEvent, n as SceneEventListener, o as SceneJSON, a as SceneObject, p as SceneObjectType, b as SectionRequest, q as StandardView, s as Vec4, t as VisualStyle } from './Scene-BHniJuab.mjs';
import { z as Ring2, v as MultiPoly2, g as Dxf2DContent } from './download--iWpT4l7.mjs';
export { A as Algo, a as DASH_PATTERNS, b as Dash, c as DimOptions, d as DrawOptions, e as Dxf2DArc, f as Dxf2DCircle, h as Dxf2DLine, i as Dxf2DLook, j as Dxf2DPoint, k as Dxf2DPolyline, l as Dxf2DSolid, m as Dxf2DText, n as Dxf3DArc, o as Dxf3DCircle, p as Dxf3DContent, q as Dxf3DLine, r as Dxf3DPoint, s as Dxf3DPolyline, D as DxfLayerDef, F as FilletResult, H as HMath, L as LevelOptions, t as LineStyle, M as MathUtils, u as MeshFactory, O as OBB2D, P as Poly2, w as Polygon2D, x as PolygonBool, y as Pt, R as ResolvedStyle, S as SeededRandom, B as Segment, C as Sheet, E as SheetOptions, G as SheetPrim, I as SheetView, T as TextOptions, V as ViewOptions, J as aciFromHex, K as closestPointOnSegment, N as createRandom, U as noise, W as pickPrim, X as polygonIntersection, Y as segmentSegmentClosest, Z as setClipSnap, _ as stampName, $ as writeDxf2D, a0 as writeDxf3D } from './download--iWpT4l7.mjs';
export { B as BoolParam, e as ButtonParam, C as CollabAdapter, f as CollabEvents, g as CollabStatus, h as CollabUser, i as ColorParam, D as Doc, j as DocChange, k as DocChangeSource, l as DocEditOptions, m as DocJSON, n as DocOptions, o as DocSchema, F as FloatParam, I as IntParam, p as ParamDef, q as ParamFolder, a as ParamLayout, b as ParamSchema, P as ParamStore, r as PickingView, d as Presence, s as PresenceView, t as SceneBinding, u as SelectParam, v as Selection, w as SharedRecord, S as SharedStore, x as SharedStoreOptions, y as StringParam, z as SupabaseLike, V as Vec3Param, A as bindScene, E as collabColor, G as createLayout, H as createParams, J as devServerAdapter, K as localAdapter, L as memoryAdapter, M as selectOnClick, N as shareSelection, O as supabaseAdapter } from './Doc-QTiSEVwH.mjs';

/**
 * Tekto VecMath — Static vector/geometry utility functions.
 *
 * Mirrors HDGEO.Core.VecMath — all bugs fixed, no mutating inputs.
 */

/**
 * Stateless vector helpers that never mutate their inputs: interpolation, polar points, angles (radians),
 * point–line/segment distances and closest points, 2D orientation tests, triangle area/normal, and
 * `rotationBetween` / `frameFromNormal` matrices.
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
 * Tekto Plane — Infinite plane (ax + by + cz + d = 0).
 *
 * Mirrors HDGEO.Core.Plane.
 */

/**
 * Infinite plane `normal·p + d = 0` with a unit `normal`; `distToPoint` is signed (positive on the normal's side). Immutable.
 * Build it with `fromPointNormal` / `fromThreePoints` (they normalise) or `XY()`/`XZ()`/`YZ()`.
 */
declare class Plane {
    readonly normal: Vec3;
    readonly d: number;
    /** ax + by + cz + d = 0 */
    constructor(normal: Vec3, d: number);
    static fromPointNormal(point: Vec3, normal: Vec3): Plane;
    static fromThreePoints(a: Vec3, b: Vec3, c: Vec3): Plane;
    static XY(): Plane;
    static XZ(): Plane;
    static YZ(): Plane;
    distToPoint(point: Vec3): number;
    projectPoint(point: Vec3): Vec3;
    side(point: Vec3): -1 | 0 | 1;
    /** Reflects a vector off the plane (like a light ray bouncing). */
    reflectVector(direction: Vec3): Vec3;
    /** Reflects a point to the other side of the plane. */
    reflectPoint(point: Vec3): Vec3;
    /** Returns a new plane with the normal flipped. */
    flipped(): Plane;
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

/** Immutable sphere (`center`, `radius`) for containment and overlap tests and `Ray.intersectSphere`. */
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

/**
 * Half-line `origin + t·direction` (t ≥ 0) with hit tests against planes, triangles, spheres and AABBs; immutable.
 * Pass a unit `direction`: `closestPointTo`/`distToPoint` assume it, and `t` is then a distance.
 */
declare class Ray {
    readonly origin: Vec3;
    readonly direction: Vec3;
    constructor(origin: Vec3, direction: Vec3);
    at(t: number): Vec3;
    closestPointTo(point: Vec3): Vec3;
    distToPoint(point: Vec3): number;
    intersectPlane(plane: Plane): {
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
 * Tekto Intersections — 2D and 3D intersection tests.
 *
 * Mirrors HDGEO.Core.Intersections.
 */

/**
 * Hit of two 2D segments: `t` along the first (0..1), `u` along the second (0..1), and the `point`.
 *
 * @experimental No app uses this yet; it may still change.
 */
interface Intersect2DResult {
    t: number;
    u: number;
    point: Vec2;
}
/**
 * 2D and 3D intersection tests: ray vs segment/triangle/plane/sphere/AABB, segments, lines and rays in 2D,
 * circles, planes, a ray through a polygon, plus closest points on segments and lines. A miss gives `null` (lists: `[]`),
 * except `raySegment`, which clamps and always returns a point.
 *
 * @experimental No app uses this yet; it may still change.
 */
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
    rayPlane(ray: Ray, plane: Plane): {
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
    segmentPlane(a: Vec3, b: Vec3, plane: Plane): Vec3 | null;
    /** Intersects an infinite line with a plane. Returns the hit point or null. */
    linePlane(a: Vec3, b: Vec3, plane: Plane): Vec3 | null;
    /** Intersects two planes. Returns { point, direction } of the line, or null if parallel. */
    planePlane(p1: Plane, p2: Plane): {
        point: Vec3;
        direction: Vec3;
    } | null;
    /** Finds all intersection points of a 2D ray with a polygon's edges. */
    polygonRay2D(rayOrigin: Vec2, rayDir: Vec2, polygon: Vec2[]): Vec2[];
};

/**
 * Tekto NoFitPolygon — Minkowski sums, No-Fit Polygons (NFP), and Inner-Fit
 * regions for 2D nesting / packing.
 *
 * The NFP of B about A is the locus of B's reference point (the origin of B's
 * local frame) at which B *touches* A without overlapping it:
 *
 *     interior(NFP) ⇔ B overlaps A   (forbidden)
 *     boundary(NFP) ⇔ B touches A     (the tightest legal placements)
 *     exterior(NFP) ⇔ B disjoint A    (loose)
 *
 * and is computed as the Minkowski sum  NFP(A, B) = A ⊕ (−B).
 *
 * Concave shapes are handled the robust way: decompose A and B into convex
 * pieces, Minkowski-sum every pair (a convex sum is just the convex hull of the
 * pairwise vertex sums), then union the lot — which naturally produces the
 * interior holes a concave NFP can have (e.g. B trapped in a pocket of A).
 *
 * Depends on tekto's own {@link Polygon2D.convexHull2D} and {@link PolygonBool};
 * the only external piece is `poly-decomp` for the convex decomposition.
 */

/**
 * No-fit polygons and Minkowski sums for 2D nesting: `nfp(fixed, orbiting)` is the region where `orbiting`'s origin
 * would overlap `fixed` (its boundary = touching), `innerFit(container, orbiting)` where it stays inside.
 * Concave rings are split into convex parts; results are `MultiPoly2` and may have holes.
 */
declare const NoFitPolygon: {
    /** Reflect a ring through the origin (negate every vertex) — forms −B. */
    reflect(ring: Ring2): Ring2;
    /**
     * Decompose a simple polygon into convex pieces (poly-decomp quickDecomp).
     * Input may have any winding; pieces come back CCW. Triangles and convex
     * inputs pass through as a single piece.
     */
    decomposeConvex(ring: Ring2): Ring2[];
    /**
     * Minkowski sum of two *convex* rings = convex hull of all pairwise vertex
     * sums. O(|a|·|b|) but the inputs are small convex pieces.
     */
    minkowskiSumConvex(a: Ring2, b: Ring2): Ring2;
    /**
     * Minkowski sum of two arbitrary simple polygons. Decomposes both into convex
     * pieces, sums every pair, and unions the results (may produce holes).
     */
    minkowskiSum(a: Ring2, b: Ring2): MultiPoly2;
    /**
     * No-Fit Polygon of `orbiting` about `fixed`: NFP = fixed ⊕ (−orbiting).
     * Both polygons are given in absolute coordinates; the result is the locus of
     * `orbiting`'s reference point (its frame origin) for touching placements on
     * the boundary, overlapping placements in the interior.
     */
    nfp(fixed: Ring2, orbiting: Ring2): MultiPoly2;
    /**
     * Inner-Fit region: the locus of `orbiting`'s reference point such that
     * `orbiting` stays fully inside `container`.
     *
     * Computed as ∩ over vertices v of conv(orbiting) of (container − v). This is
     * exact for convex or rectangular containers (the common surface case) and a
     * mild over-approximation for concave containers.
     */
    innerFit(container: Ring2, orbiting: Ring2): MultiPoly2;
};

/** A segment as its two endpoints: an obstacle wall (or the edge to skip) for {@link perpVisibility}. */
type PerpSegment = readonly [Vec2, Vec2];
/**
 * Perpendicular-visibility region of segment a→b, with rays shot toward its
 * LEFT side (the direction rot90ccw(b−a)). `obstacles` are opaque one-sided
 * walls; each ray stops at the nearest. `maxDist` bounds otherwise-endless rays.
 *
 * Returns the region as zero or more simple rings in WORLD coordinates (more
 * than one only when obstacles split the beam into disjoint lit strips). Empty
 * if the segment is degenerate or nothing is visible.
 */
declare function perpVisibility(a: Vec2, b: Vec2, obstacles: readonly PerpSegment[], maxDist: number): Ring2[];
/** As {@link perpVisibility}, but obstacles are given as polygon rings (each
 *  decomposed to its edges). `skipEdge`, if given, is dropped from the obstacle
 *  set — pass the emitter's own edge so it doesn't shadow its own beam. */
declare function perpVisibilityOfPolys(a: Vec2, b: Vec2, polygons: readonly Ring2[], maxDist: number, skipEdge?: PerpSegment): Ring2[];
/**
 * Visibility of edge `i` of `ring`, shot toward its OUTWARD side (away from the
 * ring interior — winding is detected, so either orientation works), against a
 * set of obstacle rings. The emitter's own edge is excluded automatically.
 */
declare function edgeOutwardVisibility(ring: Ring2, i: number, obstacles: readonly Ring2[], maxDist: number): Ring2[];

/**
 * Tekto MeshAnalysis — Mesh measurement and processing algorithms.
 *
 * Mirrors HDGEO.Core.MeshAnalysis.
 */

/** Measurements on a `Mesh` (volume, area, centroid), Laplacian smoothing, and a 3D convex hull of points. */
declare const MeshAnalysis: {
    /** Mesh volume (closed, consistently wound; polygons are fan-triangulated). */
    meshVolume(mesh: Mesh): number;
    /** Mesh surface area. */
    meshSurfaceArea(mesh: Mesh): number;
    /** Mesh centroid (vertex average). */
    meshCentroid(mesh: Mesh): Vec3;
    /** Laplacian smooth (moves each interior vertex toward the average of its neighbors). */
    laplacianSmooth(mesh: Mesh, iterations?: number, factor?: number): void;
    /** 3D Convex hull — returns a Mesh */
    convexHull3D(points: Vec3[]): Mesh;
};

/**
 * Tekto MeshTransform — Geometric transformations on Mesh.
 *
 * Mirrors HDGEO.Core.MeshTransform.
 */

/** A world axis, as named by `MeshTransform.swapAxes` and `mirror`. */
type Axis = "x" | "y" | "z";
/**
 * In-place transforms of a {@link Mesh}: `transform` (Mat4), `translate`, `scale`,
 * `rotate`/`rotateAbout`, `swapAxes` (Y-up ↔ Z-up), `mirror`, `flipFaces`, `reorientFaces`,
 * `centerAtOrigin`. Mirroring and axis swaps re-wind faces so they still point outward.
 */
declare const MeshTransform: {
    /** Applies an arbitrary 4x4 matrix to all vertex positions. */
    transform(mesh: Mesh, matrix: Mat4): void;
    /** Translates all vertices by an offset vector. */
    translate(mesh: Mesh, offset: Vec3): void;
    /** Uniform scale around origin. */
    scale(mesh: Mesh, factor: number): void;
    /** Non-uniform scale around origin. */
    scaleXYZ(mesh: Mesh, sx: number, sy: number, sz: number): void;
    /** Non-uniform scale around a center point. */
    scaleAbout(mesh: Mesh, sx: number, sy: number, sz: number, center: Vec3): void;
    /** Rotates the mesh around an axis through the origin. */
    rotate(mesh: Mesh, axis: Vec3, angleRadians: number): void;
    /** Rotates the mesh around an axis through a center point. */
    rotateAbout(mesh: Mesh, axis: Vec3, angleRadians: number, center: Vec3): void;
    /** Swaps two coordinate axes (e.g. Y↔Z for Z-up to Y-up conversion). */
    swapAxes(mesh: Mesh, a: Axis, b: Axis): void;
    /** Mirrors the mesh across a plane through the origin. */
    mirror(mesh: Mesh, axis: Axis): void;
    /** Reverses the winding order of all faces (flips normals). */
    flipFaces(mesh: Mesh): void;
    /**
     * Makes all face normals consistent using BFS flood-fill.
     * Picks an initial face and propagates its orientation to neighbors.
     */
    reorientFaces(mesh: Mesh): void;
    /** Moves the mesh so its bounding box center is at the origin. */
    centerAtOrigin(mesh: Mesh): void;
    /** Moves the mesh so its centroid (average of vertices) is at the origin. */
    centerAtCentroid(mesh: Mesh): void;
};

/**
 * Tekto MeshSubdivide — Subdivision and refinement operations on Mesh.
 *
 * Mirrors HDGEO.Core.MeshSubdivide.
 * Note: CatmullClark is in MeshFactory.subdivide().
 */

/** In-place refinement of a `Mesh`: split long edges, refine to a target edge length, Doo-Sabin. Catmull-Clark is `MeshFactory.subdivide`. */
declare const MeshSubdivide: {
    /** Splits all edges longer than maxLength in a single pass. */
    splitLongEdges(mesh: Mesh, maxLength: number): void;
    /**
     * Iteratively subdivides the mesh until all edges are shorter than targetLength.
     */
    refineByEdgeLength(mesh: Mesh, targetLength: number, maxIterations?: number): void;
    /**
     * Doo-Sabin subdivision: each face shrinks toward its centroid, creating
     * new F-faces, E-faces (edge quads), and V-faces (vertex n-gons).
     */
    dooSabin(mesh: Mesh): void;
};

/**
 * Tekto MeshCleanup — Vertex merging and welding on Mesh.
 *
 * Mirrors HDGEO.Core.MeshCleanup.
 */

/** Merges coincident vertices of a `Mesh` in place (exactly equal or within a distance) and drops faces that collapse; the mesh is rebuilt, so ids are renumbered. */
declare const MeshCleanup: {
    /** Merges vertices that have the exact same position (binary equality). */
    mergeIdenticalVertices(mesh: Mesh): void;
    /** Merges vertices that are within a certain distance of each other. */
    weldVertices(mesh: Mesh, threshold: number): void;
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

/** Principal curvatures and directions at one mesh node, as estimated by `Curvature.taubin` (positive = convex w.r.t. the outward normal). */
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
/**
 * Per-node principal curvature on a `Mesh` (Taubin's tensor method), plus helpers to comb the
 * resulting line field into consistent signs and average it per face, e.g. for `StreamlineTracer`.
 */
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
    taubin(mesh: Mesh): Map<number, VertexCurvature>;
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
    facePrincipalField(mesh: Mesh, curvatures: Map<number, VertexCurvature>, which: "max" | "min"): Map<number, Vec3>;
    /**
     * Make the principal direction field sign-consistent across the mesh by greedy
     * BFS. For each visited vertex, flip both `dirMax` and `dirMin` if their dot
     * with the corresponding direction of an already-visited neighbor is negative.
     *
     * Not globally optimal — seams will appear near umbilic / singular points.
     * Mutates `curvatures` in place.
     */
    combDirections(mesh: Mesh, curvatures: Map<number, VertexCurvature>): void;
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

/** Tuning for `StreamlineTracer.trace`: step budget, seed density, step size and lift off the surface. */
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
/**
 * Traces polylines along a per-face direction field on a `Mesh` (e.g. combed principal curvature
 * from `Curvature`), walking face to face from seed faces in both directions; plus polyline smoothing.
 */
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
    trace(mesh: Mesh, field: Map<number, Vec3>, options?: StreamlineOptions): Vec3[][];
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

/** A convex polygon with its supporting plane, as stored, split and clipped by `BspTree`. */
interface BspPolygon {
    vertices: Vec3[];
    plane: Plane;
    /** Optional user data carried through splits (e.g. material, layer). */
    shared?: unknown;
}
/** BSP tree node. null children represent empty half-spaces. */
interface BspNode {
    plane: Plane;
    front: BspNode | null;
    back: BspNode | null;
    coplanarFront: BspPolygon[];
    coplanarBack: BspPolygon[];
}
/** Create a BspPolygon from vertices, computing the plane automatically. */
declare function polygonFromVertices(vertices: Vec3[], shared?: unknown): BspPolygon;
/** Where a point lies relative to a `BspTree` solid; `"on"` means on one of its boundary polygons. */
type PointClassification = "inside" | "outside" | "on";
type TraversalCallback = (polygons: BspPolygon[]) => void;
/**
 * A BSP tree of convex polygons, for CSG on closed solids: build with `fromPolygons`/`fromMesh`,
 * combine with `union`/`subtract`/`intersect` (new trees, inputs unchanged), read back with `toMesh()`
 * (indexed typed arrays, not a `Mesh`). Also classifies points and walks polygons in depth order.
 */
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
/** Straight segment from `start` to `end`; `t` in [0, 1] is proportional to arc length. */
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
/**
 * Circular arc of `radius` around `center` in the plane perpendicular to `normal`. Angles are radians,
 * counter-clockwise about `normal` from `forward` = normal × Y (−X for a +Z normal, not +X).
 */
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
/** Cubic Bézier with control points `p0`..`p3`; arc length comes from a 50-step table, so move it with `updateControlPoints` rather than the fields. */
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
/**
 * Non-uniform rational B-spline curve. `t` in [0, 1] maps onto the valid knot range.
 * With `weights` the curve is rational (exact circles and conics: a quarter circle is
 * degree 2 with weights `[1, √½, 1]`); without them it is a plain B-spline.
 */
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
    /** De Boor in homogeneous coordinates: blend (w·P, w), then divide. Weights of 1 reduce to the plain B-spline. */
    private evaluateDeBoor;
    private findKnotSpan;
}
/** Polyline through 2+ points (copied); `t` in [0, 1] is proportional to arc length over the whole polyline. */
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
/**
 * Helpers over curves (`LineCurve`, `ArcCurve`, `HelixCurve`, `CubicBezierCurve`,
 * `NurbsCurve`, `PolylineCurve` — all with `getPoint(t)`, `getTangent(t)`, arc length):
 * `divideByCount` / `divideByFixedLength` / `divideByTargetLength` (sampling),
 * `parallelTransportFrames` (sweeps), `unrollPolyline`, `arcFromPointTangentPoint`.
 */
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
/**
 * Tensor-product NURBS surface on a `controlPoints[u][v]` grid; `getPoint(u, v)` takes u, v in [0, 1] over the
 * valid knot range. Build one with `loft` or `revolve` (exact circles via rational weights), tessellate with `toMesh`.
 */
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
     * Tessellate the surface into a Mesh by sampling on a (uDivs × vDivs) grid.
     * `closedU` / `closedV` merge the seam (use closedU=true for surfaces from `revolve`).
     */
    toMesh(uDivs?: number, vDivs?: number, closedU?: boolean, closedV?: boolean): Mesh;
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

/** A UTC instant and a site (latitude/longitude in degrees) for `SunPosition.compute`. */
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
/** The sun's altitude and azimuth (radians) and its unit direction in the Z-up frame (+X east, +Y north). */
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
/** Sun direction from a date and a site (Michalsky 1988, ~0.01° for 1950–2050), as a Z-up vector: +X east, +Y north, +Z sky. */
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
/**
 * A weighted graph on nodes `0..nodeCount-1`, defined by a neighbour callback and an optional weight
 * callback (default 1) rather than stored edges: Dijkstra (single/multi-source, Voronoi), components, flood fill.
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
/** Ready-made `Graph`s over regular 2D/3D grids (4-, 8- and 6-connected); node index is `x * ny + y` (3D: `x * ny * nz + y * nz + z`). */
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
/**
 * A 2D planar graph as a half-edge structure (DCEL): vertices, twin half-edges kept in angular order
 * around each vertex, and faces from `buildFaces()` (CCW = bounded, CW = outer). Build one from raw
 * segments with `PlanarGraphRepair.fromSegments`.
 */
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
/** Builds a valid `PlanarGraph` from raw 2D segments: fuses vertices within `tolerance`, splits edges at vertices and crossings, then builds faces. */
declare const PlanarGraphRepair: {
    /** Creates a valid planar graph from line segments. */
    fromSegments(segments: {
        a: Vec2;
        b: Vec2;
    }[], tolerance: number): PlanarGraph;
};
/** In-place passes on a `PlanarGraph`: remove dead ends, dissolve collinear degree-2 vertices, drop edges with the same face on both sides or bounded faces on both sides. */
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
/** Incremental Delaunay triangulation of 2D points (at least 3), returned as a `PlanarGraph` whose CCW faces are the triangles. */
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

/** A 2D scalar field of `nx × ny` samples `cellSize` apart from the corner (`x1`, `y1`), stored x-major (`x * ny + y`); `get` outside the grid returns Infinity. */
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
/**
 * A 3D scalar field (typically a signed distance, negative inside) of `nx × ny × nz` samples `cellSize` apart from
 * (`x1`, `y1`, `z1`), stored x-major; fill from SDFs, combine with `union`/`subtract`/`intersect` in place, mesh with `MarchingCubes`.
 */
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
/**
 * Iso-contour of a 2D scalar grid as loose line segments in world coordinates (marching squares).
 *
 * @experimental No app uses this yet; it may still change.
 */
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
/** Iso-surface of a `VoxelGrid` as a welded triangle `Mesh` (marching cubes). */
declare const MarchingCubes: {
    extract(grid: VoxelGrid, iso?: number): Mesh;
};
/** In-place flood fill on a voxel grid: from the seed cells, negates every connected cell (4/6-neighbours) whose sign matches `targetSign`. */
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
/** In-place chamfer distance on a voxel grid: cells at 0 are sources, all others (set them large, e.g. Infinity) get the distance in cells to the nearest source; the `WithLabels` variants also spread each source's label. */
declare const DistanceTransform: {
    compute2D(grid: VoxelGrid2D, d1?: number, d2?: number): void;
    compute2DWithLabels(grid: VoxelGrid2D, labels: Int32Array, d1?: number, d2?: number): void;
    compute3D(grid: VoxelGrid, d1?: number, d2?: number, d3?: number): void;
    compute3DWithLabels(grid: VoxelGrid, labels: Int32Array, d1?: number, d2?: number, d3?: number): void;
};
/** Regions of a `VoxelGrid2D` above a threshold: 4-connected component labels, and their outlines as cell-coordinate loops. */
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

/**
 * A signed distance field: `distance(p)` is negative inside, 0 on the surface, positive outside.
 * Mesh one with `VoxelGrid.fillFromSdf` + `MarchingCubes.extract`.
 */
interface ISdf {
    distance(point: Vec3): number;
}
/** Sphere of `radius` around `center` (default origin); exact distance. */
declare class SdfSphere implements ISdf {
    radius: number;
    center: Vec3;
    constructor(radius: number, center?: Vec3);
    distance(p: Vec3): number;
}
/** Axis-aligned box of `halfExtents` around `center`; exact distance. `SdfBox.fromSize(sx, sy, sz)` takes full sizes at the origin. */
declare class SdfBox implements ISdf {
    halfExtents: Vec3;
    center: Vec3;
    constructor(halfExtents: Vec3, center?: Vec3);
    static fromSize(sx: number, sy: number, sz: number): SdfBox;
    distance(p: Vec3): number;
}
/**
 * Capsule: every point within `radius` of segment a→b (round ends).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfCapsule implements ISdf {
    a: Vec3;
    b: Vec3;
    radius: number;
    constructor(a: Vec3, b: Vec3, radius: number);
    distance(p: Vec3): number;
}
/**
 * Flat-capped cylinder of `radius` from `a` to `b`; `SdfCylinder.vertical(height, radius)` stands one on the Y axis, centred on the origin.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfCylinder implements ISdf {
    a: Vec3;
    b: Vec3;
    radius: number;
    constructor(a: Vec3, b: Vec3, radius: number);
    static vertical(height: number, radius: number): SdfCylinder;
    distance(p: Vec3): number;
}
/**
 * Capped cone (frustum) from `a` (radius `radiusA`) to `b` (radius `radiusB`); the slanted side uses radial distance, so it is approximate.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfCone implements ISdf {
    a: Vec3;
    b: Vec3;
    radiusA: number;
    radiusB: number;
    constructor(a: Vec3, b: Vec3, radiusA: number, radiusB: number);
    distance(p: Vec3): number;
}
/**
 * Torus at the origin around the Y axis (ring in the XZ plane): `majorRadius` to the tube centre, `minorRadius` of the tube.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfTorus implements ISdf {
    majorRadius: number;
    minorRadius: number;
    constructor(majorRadius: number, minorRadius: number);
    distance(p: Vec3): number;
}
/**
 * Ellipsoid at the origin with semi-axes `radii`; the distance is an approximation (exact only for a sphere).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfEllipsoid implements ISdf {
    radii: Vec3;
    constructor(radii: Vec3);
    distance(p: Vec3): number;
}
/**
 * Half-space behind a plane (exported as `SdfPlaneField`): negative on the side away from `normal`.
 * Give the plane as `normal` plus offset `d` (normal·p = d) or a point on it; the normal is normalised.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfPlane implements ISdf {
    normal: Vec3;
    d: number;
    constructor(normal: Vec3, dOrPoint: number | Vec3);
    distance(p: Vec3): number;
}
/**
 * Unsigned distance to the infinite line through `a` and `b` (exported as `SdfLineField`); wrap in `SdfOffset` for an endless rod.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfLine implements ISdf {
    a: Vec3;
    b: Vec3;
    constructor(a: Vec3, b: Vec3);
    distance(p: Vec3): number;
}
/**
 * Union of any number of fields (the minimum of their distances).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfUnion implements ISdf {
    children: ISdf[];
    constructor(...children: ISdf[]);
    distance(p: Vec3): number;
}
/**
 * Intersection of any number of fields (the maximum of their distances).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfIntersect implements ISdf {
    children: ISdf[];
    constructor(...children: ISdf[]);
    distance(p: Vec3): number;
}
/** `a` minus `b`: max(a, −b). */
declare class SdfSubtract implements ISdf {
    a: ISdf;
    b: ISdf;
    constructor(a: ISdf, b: ISdf);
    distance(p: Vec3): number;
}
/**
 * Smooth union of `a` and `b`, filleting the joint over `radius` (quadratic smooth-min; same field as `SdfSmoothUnion` with k = radius).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfBlend implements ISdf {
    a: ISdf;
    b: ISdf;
    radius: number;
    constructor(a: ISdf, b: ISdf, radius?: number);
    distance(p: Vec3): number;
}
/**
 * `a` minus `b` with the cut edge rounded over `radius`.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfSmoothSubtract implements ISdf {
    a: ISdf;
    b: ISdf;
    radius: number;
    constructor(a: ISdf, b: ISdf, radius?: number);
    distance(p: Vec3): number;
}
/** Smooth union of `a` and `b`; `k` is the blend width (larger = softer fillet). */
declare class SdfSmoothUnion implements ISdf {
    a: ISdf;
    b: ISdf;
    k: number;
    constructor(a: ISdf, b: ISdf, k?: number);
    distance(p: Vec3): number;
}
/**
 * Hollows `input` into a wall `2 × thickness` thick, centred on its surface (|d| − thickness).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfShell implements ISdf {
    input: ISdf;
    thickness: number;
    constructor(input: ISdf, thickness?: number);
    distance(p: Vec3): number;
}
/**
 * Nested shells: applies |d| − thickness `layers` times, each pass splitting every wall in two.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfOnion implements ISdf {
    input: ISdf;
    thickness: number;
    layers: number;
    constructor(input: ISdf, thickness: number, layers?: number);
    distance(p: Vec3): number;
}
/**
 * Twists `input` about the Z axis: the rotation grows linearly with z, by `anglePerUnit` radians across the whole
 * `z1`..`z2` span (not per metre), zero at its midpoint, and keeps growing outside it. The result is not an exact distance.
 */
declare class SdfTwist implements ISdf {
    input: ISdf;
    anglePerUnit: number;
    z1: number;
    z2: number;
    constructor(input: ISdf, anglePerUnit: number, z1?: number, z2?: number);
    distance(p: Vec3): number;
}
/**
 * Revolves a profile around the Y axis: `input` is sampled in its z = 0 plane at (distance from the Y axis, y).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfRevolution implements ISdf {
    input: ISdf;
    constructor(input: ISdf);
    distance(p: Vec3): number;
}
/**
 * Extrudes `input`'s z = 0 section endlessly along Z.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfExtrude implements ISdf {
    input: ISdf;
    constructor(input: ISdf);
    distance(p: Vec3): number;
}
/**
 * Extrudes `input`'s z = 0 section along Z over `height`, centred on z = 0 (flat caps).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfBoundedExtrude implements ISdf {
    input: ISdf;
    halfHeight: number;
    constructor(input: ISdf, height: number);
    distance(p: Vec3): number;
}
/**
 * Mirror symmetry about the plane through the origin with `planeNormal`: the part of `input` on the normal's side is reflected onto the other side (what was there is dropped).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfMirror implements ISdf {
    input: ISdf;
    normal: Vec3;
    constructor(input: ISdf, planeNormal: Vec3);
    distance(p: Vec3): number;
}
/**
 * `count` copies of `input` around the Z axis, 360°/count apart, taken from the sector around +X.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfRadialArray implements ISdf {
    input: ISdf;
    count: number;
    private deltaAngle;
    constructor(input: ISdf, count: number);
    distance(p: Vec3): number;
}
/**
 * Places `input` with a Mat4 (stored inverted; `input` is sampled at transform⁻¹·p).
 * Exact for rigid transforms; under scaling the distance stays in `input`'s unscaled units.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfTransform implements ISdf {
    input: ISdf;
    private inverse;
    constructor(input: ISdf, transform: Mat4);
    setTransform(transform: Mat4): void;
    distance(p: Vec3): number;
}
/**
 * Grows `input` outward by `amount` (shrinks it if negative), which also rounds its edges.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfOffset implements ISdf {
    input: ISdf;
    amount: number;
    constructor(input: ISdf, amount: number);
    distance(p: Vec3): number;
}
/**
 * Weighted sum `a + factor × b`: modulates one field by another (the result is not a true distance).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfGradient implements ISdf {
    a: ISdf;
    b: ISdf;
    factor: number;
    constructor(a: ISdf, b: ISdf, factor?: number);
    distance(p: Vec3): number;
}
/**
 * Voronoi walls between the fields in `children` (push them in after construction): |d1 − d2| − `offset` over the two
 * nearest, so the walls are where they are equally near, `2 × offset` thick. 0 everywhere when there are no children.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfVoronoi implements ISdf {
    offset: number;
    children: ISdf[];
    constructor(offset?: number);
    distance(p: Vec3): number;
}
/**
 * Triply periodic minimal surface (TPMS) family for {@link SdfLattice}.
 *
 * @experimental No app uses this yet; it may still change.
 */
type LatticeType = "schwarz" | "gyroid" | "diamond" | "lidinoid" | "neovius" | "fischerKoch" | "frd" | "doubleDiamond" | "doubleGyroid" | "s";
/**
 * Endless TPMS lattice (gyroid, Schwarz, diamond …) as an implicit field, not a true distance: period 2π·`scale`
 * on each axis, `offset` shifts the level (solid fraction); `shell: true` gives a wall |f| − offset instead of a solid.
 * Intersect it with a body to fill that body.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfLattice implements ISdf {
    type: LatticeType;
    scale: number;
    offset: number;
    shell: boolean;
    constructor(type?: LatticeType, scale?: number, offset?: number, shell?: boolean);
    distance(p: Vec3): number;
}
/** Strut layout of one {@link SdfMicrostructure} cell. */
type MicroPatternType = "bigX" | "grid" | "star" | "cross" | "octagon" | "octet" | "vintile" | "dual" | "interlock" | "isotrop";
/**
 * Endless strut lattice: `pattern`'s struts, laid out in one octant of a `cellSize` cube and mirrored to fill it,
 * tiled through space; `strutRadius` is the strut radius.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SdfMicrostructure implements ISdf {
    cellSize: number;
    strutRadius: number;
    pattern: MicroPatternType;
    private struts;
    constructor(cellSize?: number, strutRadius?: number, pattern?: MicroPatternType);
    distance(p: Vec3): number;
}
/**
 * Queries on any {@link ISdf}: central-difference `gradient`, sphere-tracing `rayMarch`, `surfaceNormal`,
 * `projectToSurface`, `estimateCurvature` (Laplacian) and `ambientOcclusion` (0..1, 1 = open).
 *
 * @experimental No app uses this yet; it may still change.
 */
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
/**
 * One-call wrappers that return a new {@link ISdf}: `translate`, `rotateX|Y|Z` (radians), `scale` (via
 * {@link SdfTransform}), `union`, `intersect`, `subtract`, `blend`, `shell`, `round`, `mirror`, `twist`, `revolve`.
 *   const s = SdfOps.translate(new SdfSphere(1), 0, 0, 2);
 *
 * @experimental No app uses this yet; it may still change.
 */
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

/**
 * 2D capsule (stadium): a segment of `2 × halfLength` through `center` at `angle` (radians), swept by a disk of `radius`.
 * Mutable — it is the shape of a `RigidBody2D` — with signed distance, hit testing and grab handles for dragging.
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

/** A linear spring between particles `i` and `j` of a `SpringSystem3D`; `k` is ignored while `useGlobalStiffness` is on. */
interface Spring {
    i: number;
    j: number;
    restLength: number;
    k: number;
}
/**
 * Spring-mass simulation of a `Mesh`: `initFromMesh` makes a particle per node with edge, quad-diagonal and hinge
 * springs (optionally a second truss layer), `step(dt)` integrates in substeps, `updateMesh` writes positions back.
 * The defaults are Y-up: gravity −Y and a floor at y = −10; for a Z-up model set both
 * (`gravity = new Vec3(0, 0, -9.81)`, `floorPlane = new Plane(new Vec3(0, 0, 1), d)`).
 *
 * @experimental No app uses this yet; it may still change.
 */
declare class SpringSystem3D {
    pos: Vec3[];
    vel: Vec3[];
    invMass: Float32Array;
    springs: Spring[];
    gravity: Vec3;
    floorPlane: Plane;
    globalVelDamping: number;
    useGlobalStiffness: boolean;
    globalStiffness: number;
    globalDamping: number;
    stiffnessStrut: number;
    stiffnessShear: number;
    stiffnessHinge: number;
    maxForce: number;
    initFromMesh(mesh: Mesh, trussThickness?: number, useHinges?: boolean): void;
    private computeSmoothNormals;
    private addBendingSprings;
    private getOppositeVertex;
    addSpring(i: number, j: number, k?: number): void;
    pin(index: number): void;
    unpin(index: number): void;
    step(dt: number, substeps?: number): void;
    updateMesh(mesh: Mesh): void;
}

/**
 * Tekto RigidBody2D — 2D rigid body with capsule shape.
 *
 * 3 DOF: position (x,y), angle.
 * Supports force/torque application at world-space points,
 * velocity integration, and box constraint with angular impulse.
 */

/** Per-frame damping factors and wall restitution of a `RigidBody2D`. */
interface RigidBodyConfig {
    damping?: number;
    angularDamping?: number;
    wallRestitution?: number;
}
/**
 * A 2D rigid body with a `Capsule2D` shape (x, y, angle in radians), stepped per frame without a dt:
 * apply forces at points, `integrate()`, then `constrainToBox` to bounce off walls. Mass and inertia come from the shape.
 */
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
/** Stiffness and damping of a `Spring2D`. */
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
 * Vector PDF of a 2D drawing — the same content `writeDxf2D` takes (polylines, lines, circles, arcs,
 * texts, solids on named layers), drawn at a true scale on one page sized to the drawing, with an
 * optional title and scale bar. No dependency: a single uncompressed content stream, the standard
 * Helvetica font (WinAnsi), so every viewer and plotter reads it.
 */

/** Options of {@link writePdf2D}. Lengths on paper are in millimetres. */
interface Pdf2DOptions {
    /** The drawing scale's denominator: 50 draws at 1:50 (default 50). */
    scale?: number;
    /** Metres per drawing unit (default 1: the drawing is in metres; 0.001 for millimetres). */
    unit?: number;
    /** Paper margin around the drawing, mm (default 10). */
    margin?: number;
    /** Line width on paper, mm (default 0.18). */
    lineWidth?: number;
    /** Printed top left with the scale, e.g. "Unrolled elevation" → "Unrolled elevation · 1:50". */
    title?: string;
    /** A scale bar under the drawing (default true). */
    scaleBar?: boolean;
    /** Colours made dark enough for white paper (default true): lighter than the limit, a colour keeps
     *  its hue and is darkened; white and near-white become black. false: the colours as given. */
    forPaper?: boolean;
}
/**
 * Write a 2D drawing as a vector PDF at a true scale: one page, sized to the drawing plus margins,
 * the drawing's y up. Takes the same {@link Dxf2DContent} as `writeDxf2D`; an entity's colour is its
 * `rgb` (CSS hex), else its ACI `color`, else its layer's `rgb` / `color`, else black. Line types (its own, else its layer's)
 * become dash patterns; text is Helvetica (`height` = cap height, as in DXF). Returns the file's bytes.
 *
 *   download(writePdf2D(plan, { scale: 50, title: "Plan" }), "plan.pdf");
 *
 * A page over 5080 mm (200 in) is valid PDF, but Acrobat refuses it — pick a smaller scale then.
 * A NaN or infinite coordinate throws, as in `writeDxf2D`.
 */
declare function writePdf2D(content: Dxf2DContent, opts?: Pdf2DOptions): Uint8Array;

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

/** Options for `IfcFile.parse`: where web-ifc.wasm is served (default "/"), whether to recentre on the bounding-box centre (default true, so site coordinates don't break WebGL precision), and a progress callback. */
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
/**
 * IFC import as one fused mesh, for context geometry that nobody selects;
 * use `IfcModel` to keep elements apart. Needs the optional `web-ifc`
 * dependency and its wasm served by the app.
 *
 *   const mesh = await IfcFile.parse(buf, { wasmPath: '/' });
 */
declare const IfcFile: {
    /**
     * Parse an IFC file (as ArrayBuffer) into a single fused FlatMeshData.
     * All elements are merged; no per-element groups are produced.
     */
    parse(buffer: ArrayBuffer, options?: IfcParseOptions): Promise<MeshData>;
};

/**
 * Tekto IFC import, per element.
 *
 * `IfcFile.parse` fuses a model into one mesh, which is right for context
 * geometry and wrong for anything the user clicks: selection, a model tree and
 * property inspection all need the elements kept apart. `IfcModel.parse` keeps
 * them, each with its own mesh, its IFC class, its property sets and its
 * quantities, so an app can pick an element and ask questions about it.
 *
 * Same `web-ifc` dependency and the same setup as IfcFile: install it in the
 * app and serve `web-ifc.wasm`.
 *
 *   const buf   = await fetch('/model.ifc').then(r => r.arrayBuffer());
 *   const model = await IfcModel.parse(buf, { wasmPath: '/' });
 *   model.elements[0].ifcClass      // "IfcSlab"
 *   model.elements[0].properties    // { Width: 0.22, Span: 9.0, ... }
 *
 * Properties are flattened from every property set and quantity set into one
 * bag, because that is what a consumer usually wants, and the original sets are
 * kept alongside in `psets` for when the distinction matters.
 */

/** Options for `IfcModel.parse`: where web-ifc.wasm is served, recentring, and whether to read property sets, the spatial tree and relations (all default true). */
interface IfcParseElementsOptions {
    /** Directory (with trailing slash) where web-ifc.wasm is served. Default: '/'. */
    wasmPath?: string;
    /** Recentre every element by the model bounding-box centre. Default: true. */
    recenter?: boolean;
    /** Read property and quantity sets. Costs a round trip per element on large
     *  models, so it can be turned off for a geometry-only pass. Default: true. */
    properties?: boolean;
    /** Read the spatial structure (site / storey / space). Default: true. */
    tree?: boolean;
    /**
     * Read element-to-element relations: what fills what, what touches what,
     * what type an occurrence is. A handful of whole-model queries rather than
     * per element, so it is cheap even on a large file. Default: true.
     */
    relations?: boolean;
    onProgress?: (msg: string) => void;
}
/**
 * How one element relates to another, in IFC's own vocabulary.
 *
 * The names are IFC's because the concepts are: there is no reason to invent a
 * word for "the window is in this wall" when the schema has spent thirty years
 * settling on one, and an app that speaks these names can hand them to any
 * other tool that reads the format.
 *
 *   hosts / hostedBy   IfcRelVoidsElement + IfcRelFillsElement, chained. A wall
 *                      hosts the window filling the opening carved into it.
 *   connectedTo        IfcRelConnectsElements and its subtypes, of which
 *                      IfcRelConnectsPathElements (wall meets wall) is the one
 *                      that actually appears in files.
 *   typeId             IfcRelDefinesByType. The unit a specification is
 *                      written against: nobody picks a product for one wall.
 *   partOf / parts     IfcRelAggregates, a whole and its pieces.
 */
interface IfcRelations {
    /** openings in this element are filled by these elements */
    hosts?: number[];
    /** this element fills an opening in that one */
    hostedBy?: number;
    /** elements this one is recorded as touching, and how the file said so */
    connectedTo?: {
        to: number;
        relation: string;
        description?: string;
    }[];
    /** the IfcTypeObject this occurrence is defined by */
    typeId?: number;
    typeName?: string;
    /** the whole this is a part of, and the parts it is made of */
    partOf?: number;
    parts?: number[];
}
/** One element from `IfcModel.parse`: express id, IFC class, name and GlobalId, its own mesh, its property and quantity values (flattened and by set) and the relations the file states. */
interface IfcElementData {
    expressID: number;
    /** "IfcSlab", "IfcWall", ... in IFC's own casing where web-ifc reports it. */
    ifcClass: string;
    name?: string;
    globalId?: string;
    mesh: MeshData;
    /** Every property and quantity, flattened. Later sets win on a name clash. */
    properties: Record<string, string | number | boolean>;
    /** The same values kept by their set name, when the origin matters. */
    psets: Record<string, Record<string, string | number | boolean>>;
    /**
     * What the file says this element is connected to.
     *
     * Stated, never inferred. Everything here was written down by whoever
     * authored the model; anything worked out from geometry is a different kind
     * of claim and lives in `adjacency.ts`, which says so. A file that records
     * no connections leaves this empty rather than guessing, because "the author
     * did not say" and "these do not touch" are different facts.
     */
    relations?: IfcRelations;
}
/** A node of the model's spatial structure (project, site, building, storey, …) as web-ifc reports it: express id, class, name and children. */
interface IfcSpatialNode {
    expressID: number;
    ifcClass: string;
    name?: string;
    children: IfcSpatialNode[];
}
/** What `IfcModel.parse` returns: the elements, the spatial tree, the recentring offset, and `lengthScale`, the metres per length unit of the file. */
interface IfcModelData {
    elements: IfcElementData[];
    tree?: IfcSpatialNode;
    /** Offset subtracted from every vertex when `recenter` is on. */
    center: [number, number, number];
    /**
     * Metres per project length unit, read from the file's own unit assignment.
     * A quantity or a coordinate multiplied by this is in metres.
     *
     * Not cosmetic: an ArchiCAD export states a slab thickness as 0.2 and a
     * Revit export states the same thickness as 150, because one project is in
     * metres and the other in millimetres. Anything comparing a model against
     * external data has to normalise, and cannot do it by guessing magnitudes.
     */
    lengthScale: number;
}
/**
 * IFC import per element: each keeps its mesh, IFC class, property and
 * quantity sets and stated relations, so an app can select and inspect it.
 * Same optional `web-ifc` dependency and wasm setup as `IfcFile`.
 *
 *   const model = await IfcModel.parse(buf, { wasmPath: '/' });
 */
declare const IfcModel: {
    /**
     * Parse an IFC file into its elements, each with geometry and properties.
     */
    parse(buffer: ArrayBuffer, options?: IfcParseElementsOptions): Promise<IfcModelData>;
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
 *
 * @experimental No app uses this yet; it may still change.
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
/** Centerline (XY, at least 2 points) and section of an `ExtrudedRibbon`; defaults are width 0.2 m, height 3 m, baseZ 0. */
interface ExtrudedRibbonOptions {
    centerline: Vec2[];
    width?: number;
    height?: number;
    baseZ?: number;
}
/**
 * Maximum miter extension as a multiple of half-width.
 * Clamps acute angles to avoid self-intersection.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare const MITER_LIMIT = 6;
/**
 * A 2D polyline centerline offset by ±width/2 and extruded up Z by `height` (Z-up, metres), with mitered
 * corners and rectangular `openings` cut through both faces. The pure geometry under walls, masses and fences.
 */
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
/** Growable position/normal/index arrays that ribbons append into; `finishMesh` turns them into one `Mesh`. */
interface MeshBuffers {
    positions: number[];
    normals: number[];
    indices: number[];
}

/** How a joint trims its ribbons: `"mitered"` cuts each to the angular bisector; `"butt"` lets one ribbon run through and stops the others at its inside face. */
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
/**
 * A plan point where 2+ ribbons meet. Owns the trim policy (`style`, `throughRibbon`) so the trim math
 * lives in one place; `computeTrims()` turns it into end trims per ribbon. `WallJoint` wraps it for BIM.
 */
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

/**
 * A set of `ExtrudedRibbon`s with their `RibbonJoint`s (L/T/X/Y), detected from the centerlines on first
 * need and editable before meshing; `buildMesh()` trims every ribbon at its joints and merges them into one `Mesh`.
 */
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
 *   underlying `ExtrudedRibbon`), trimmed at its joints when it comes from
 *   `WallSystem.realize()` (or a `WallContext` with trims), so the walls of a
 *   system meet at their corners as `WallSystem.buildMesh()` draws them.
 *   Always present; useful for quick rendering and for monolithic walls as
 *   the primary mesh.
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
 * Roll a list of parts into a cut list keyed by (material × profile × length-bucket): a
 * wall's (`RealizedWall.parts`), a slab's (`realizeSlab(…).parts`), or both together. Parts
 * without a length, profile or material (sheathing, the envelope) are left out. The default
 * bucket is exact-millimetre — pass `roundMm` to coarsen.
 */
declare function buildCutList(parts: readonly Pick<WallPart, "material" | "profile" | "length" | "role">[], roundMm?: number): CutListItem[];

/** Mechanical connection class. Influences fastener listing / structural calc. */
type ConnectionType = "screwed" | "nailed" | "glued" | "mortise" | "metalBracket" | "boltedPlate" | "unspecified";
/** Options for `new WallJoint(...)`: the geometric `RibbonJoint` it wraps, the walls that meet there, and connection type, fastener count and Psets for IFC export. */
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
/** Options for `new OpeningType(...)`: name, door or window, how it operates or is partitioned, material and Pset properties. */
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
/** Centerline (XY, metres) and section of a `Wall`; `thickness`/`height`/`baseElevation` become the ribbon's width/height/baseZ (defaults 0.2 m, 3 m, 0). */
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
type SlabPartRole = "joist" | "beam" | "header" | "trimmer" | "blocking" | "sheathing" | "decking" | "topping" | "insulation" | "ceiling" | "monolithic" | string;
/** One mesh sub-element of a slab (a joist, the sheathing, the ceiling) with the material, profile and length a cut list or the IFC exporter needs; `ifcType` defaults from `role`. */
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
 * but can be overridden by the construction). `Slab.openingRings()` gives
 * its outline; the slab's mesh and its IFC export cut it out.
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
/** How a slab type turns a slab into parts (joists, plates, coverings), e.g. `JoistedSlab({...})` or `SolidSlabConstruction`; return `[]` for a purely layered slab. */
type SlabConstruction = (slab: Slab, ctx?: SlabContext) => SlabPart[];
/** Options for `new SlabType(...)`: name, construction, material layers, Pset properties and joist defaults. */
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
/** Options for `new Slab(...)`: a closed XY footprint, thickness (default 0.2 m) and top elevation in Z (default 0), plus type, Psets, openings and a joist-direction override. */
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
/**
 * A floor, ceiling or roof slab: a closed XY footprint extruded down by
 * `thickness` from its top at `elevation` (Z-up, metres). `toMesh()` is
 * the plain envelope; give it a `SlabType` and call `realizeSlab` for
 * the parts.
 */
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
     * The openings as rings in the XY plane (counter-clockwise, open): each a rectangle
     * `width` along `direction` and `depth` across it, about its centre. `direction` defaults
     * to the way `JoistedSlab` runs its joists without a context: `joistDirection`, else the
     * one the bounds suggest. Throws for an opening that is empty or not inside the boundary.
     */
    openingRings(direction?: Vec2): Vec2[][];
    /**
     * Build the slab envelope mesh: top and bottom faces with the openings cut out, the
     * outside edge and the openings' sides.
     */
    toMesh(): Mesh;
}
/** The result of `realizeSlab(slab)`: the construction's parts, the type's layers, the envelope mesh, the merged Pset (instance over type) and the context's joist direction, if one was passed. */
interface RealizedSlab {
    slab: Slab;
    parts: SlabPart[];
    layers: MaterialLayer[];
    envelopeMesh: Mesh;
    properties: PropertyMap;
    joistDirection?: Vec2;
}
/**
 * Apply a slab's type to get its parts, layers, envelope mesh and merged
 * Psets; without a type construction there are no parts, only the
 * envelope. Pure. Pass a `SlabContext` to set the joist direction or
 * name the supporting walls.
 */
declare function realizeSlab(slab: Slab, ctx?: SlabContext): RealizedSlab;

/** Options for `new Space(...)`: name, XY boundary (≥ 3 points, metres), floor elevation (default 0), clear height (default 2.7 m), room function and Psets. */
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
/** Options for `new StairType(...)`: name, overall shape (default "straight_run"), material, description and Psets. */
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
/** Options for `new Stair(...)`: a straight run from `start` (Z-up, metres) along `direction`, climbing `totalRise` in even risers near `riserHeight` (default 0.18) with `treadDepth` goings (default 0.27). */
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

/** Options for `new IfcWriter(...)`: project, site, building and default-storey names, that storey's elevation (m), the author and application written into the file, and the MVD (default DesignTransferView_V1.0). */
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
/** Options for `IfcWriter.addWallSystem`: whether to emit framed members, joint relations, openings and material layer sets (all default true). */
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
/**
 * Writes an IFC4 file as STEP text — no web-ifc needed. Add storeys, then walls, wall
 * systems, openings, slabs, stairs; `save()` returns the `.ifc` content.
 *
 *   const ifc = new IfcWriter({ projectName: "Pavilion" }); const s = ifc.addStorey({ name: "EG", elevation: 0 });
 *   ifc.addWallSystem(walls, { storey: s }); download(ifc.save(), "pavilion.ifc");
 */
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
    private storeyElevationByRef;
    private elementsByStorey;
    private partRefs;
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
     * stays the default for any call that omits `storey`. Heights stay
     * absolute: a wall on a storey at 3 m has `baseElevation: 3`.
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
     * IFC4-native). The mesh is in world coordinates. Aggregating under a
     * wall is the caller's responsibility (see addWallSystem).
     *
     * An element that stands on its own — a railing, a column — passes
     * `opts.storey` and is contained in that storey. A part that a wall, slab
     * or roof gathers leaves it out: it is contained through its whole.
     *
     *   ifc.addMember(0, { name: "Railing", role: "railing", mesh, ifcType: "IfcRailing" }, { storey: first });
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
    }, opts?: {
        storey?: number;
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
     * Add a roof: an `IfcRoof` that gathers its parts — slabs, members, plates,
     * coverings already written with `addSlab` / `addMember` — and is contained
     * in a storey (default: the bootstrap storey). The parts stop being
     * contained in a storey themselves: in IFC a part belongs to its whole, and
     * the whole to the storey.
     *
     *   const deck = ifc.addSlab(roofSlab, { predefinedType: "ROOF", storey: top });
     *   const rafters = rafterParts.map((p) => ifc.addMember(0, p));
     *   ifc.addRoof([deck, ...rafters], { storey: top, predefinedType: "GABLE_ROOF" });
     */
    addRoof(parts: readonly number[], opts?: {
        name?: string;
        storey?: number;
        predefinedType?: "FLAT_ROOF" | "SHED_ROOF" | "GABLE_ROOF" | "HIP_ROOF" | "HIPPED_GABLE_ROOF" | "GAMBREL_ROOF" | "MANSARD_ROOF" | "BARREL_ROOF" | "RAINBOW_ROOF" | "BUTTERFLY_ROOF" | "PAVILION_ROOF" | "DOME_ROOF" | "FREEFORM" | "NOTDEFINED";
    }): number;
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
     * Where an element on a storey is placed: in the storey's placement, which is already
     * raised to the storey's elevation. Heights in the API are absolute (`Wall.baseElevation`,
     * `Slab.elevation`, `Space.elevation`), so the element's local z is its height minus
     * `elevation`.
     */
    private storeyFrame;
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
    /** The set on its own, with no relationship: what a type holds directly. */
    private writePsetEntity;
    /** The set plus the relationship that attaches it to an occurrence. */
    private writePset;
    /**
     * A type's property sets, for its `HasPropertySets` attribute.
     *
     * They belong there and not on an `IfcRelDefinesByProperties`, which is how
     * an occurrence gets its own. The attribute used to be written null, and a
     * reader asking for type properties then gets nothing at all: web-ifc raises
     * "HasPropertySets is not iterable" and gives up on the element. It was
     * invisible from here only because the type's properties are also copied
     * onto the occurrence's set, so a round trip through this writer looked
     * complete while anything reading the type saw an empty type.
     *
     * The set has to exist before the type entity that names it, so this is
     * called first and its result inlined.
     */
    private typePropertySets;
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

/** Options for `BalloonFrame`: stud and plate profiles, stud spacing, single or doubled top plate, header depth by opening width, and material (defaults SPF 2×4 @ 0.4 m, doubled top plate). */
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

/** Options for `HolzrahmenBau`: stud and plate profiles, stud spacing, Rähm count, header depth by opening width, material and Doppelständer at openings (defaults KVH 60×120 @ 0.625 m, single Rähm). */
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

/** Options for `cltLayers`: lamella thicknesses interior → exterior (default 5-ply, 160 mm) and timber grade (default "C24"). */
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

/** Options for `JoistedSlab`: joist profile, spacing and material, the rim joist, edge and bearing offsets, and the sheathing and ceiling layers (metres; defaults KVH 60×220 @ 0.625, 22 mm OSB, 12.5 mm ceiling). */
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
 * Which elements touch which, worked out from geometry.
 *
 * The companion to the relations an IFC file states, and deliberately a
 * separate module, because the two are different kinds of claim. A file that
 * records `IfcRelConnectsPathElements` is telling you its author drew those
 * two walls as meeting. A bounding box overlap is telling you that we measured
 * something and decided to call it contact. The first is testimony and the
 * second is inference, and an app that shows them alike will eventually assert
 * a load path nobody modelled.
 *
 * So every result here carries the tolerance it was found at, and the caller is
 * expected to say so. "Bears on, derived at 50 mm" is a different sentence from
 * "connected, stated by the file", and the difference is exactly the difference
 * between a certified figure and one somebody typed.
 *
 * Boxes rather than surfaces on purpose. Real contact between two solids is a
 * surface intersection, which is expensive, needs closed geometry that
 * imported models rarely have, and answers a question nobody asked: what a
 * reader wants is "what is next to this", not the area of the interface. An
 * axis-aligned box test over a few hundred elements is milliseconds, degrades
 * honestly on skew geometry (it over-reports, which a stated tolerance
 * warns about) and needs nothing of the mesh but its extent.
 */
/** An axis-aligned box, in whatever units the model is in. */
interface Box {
    min: [number, number, number];
    max: [number, number, number];
}
/**
 * How two elements meet, named for what a builder would call it.
 *
 * The vertical cases are separated from the horizontal one because they are
 * different questions. "What does this wall carry" and "what does this wall
 * butt against" have different answers, different trades and, in this project,
 * different interface requirements. Collapsing them into one "adjacent" would
 * throw away the half that matters.
 */
type Contact = "supports" | "supportedBy" | "abuts" | "overlaps";
/** One touching pair from `findAdjacent`: element ids `a` and `b`, how `a` meets `b`, and the tolerance it was found at (an inference, not a stated relation). */
interface Adjacency {
    a: number;
    b: number;
    /** how `a` meets `b`; the reverse pair carries the opposite sense */
    contact: Contact;
    /** the gap that was tolerated to call this contact, in model units */
    tolerance: number;
    /** how much of the two boxes' footprint is shared, 0 to 1. A wall resting
     *  its whole length on a slab reads differently from one clipping a corner. */
    overlap: number;
}
/** Up, as an axis index. Tekto and IFC are Z-up; three.js content is Y-up. */
type UpAxis = 0 | 1 | 2;
/** Options for `contactBetween` / `findAdjacent`: contact tolerance (default 0.05), up axis (default 2, Z) and minimum shared footprint (default 0.02). */
interface AdjacencyOptions {
    /** How close counts as touching, in model units. 0.05 for metres is a
     *  builder's tolerance: it catches a wall drawn 30 mm off a slab and does
     *  not join two walls a hand's width apart. */
    tolerance?: number;
    up?: UpAxis;
    /** Below this shared footprint the pair is dropped, so two elements that
     *  merely graze at a corner are not reported as bearing on each other. */
    minOverlap?: number;
}
/** The box of a set of points, or null for no points. */
declare function boxOf(positions: ArrayLike<number>): Box | null;
/**
 * Whether two boxes touch, and how.
 *
 * The test is the same in every axis: they must overlap or nearly overlap in
 * all three. What decides the *kind* of contact is which axis is the tight
 * one. If the pair only just meets along the up axis and one sits above the
 * other, that is bearing. If they meet tightly in a horizontal axis, they
 * abut. If they genuinely interpenetrate in all three, the geometry overlaps,
 * which is usually a modelling fault worth reporting rather than hiding.
 */
declare function contactBetween(a: Box, b: Box, opts?: AdjacencyOptions): {
    contact: Contact;
    overlap: number;
} | null;
/**
 * The opposite sense, so both elements can be asked the same question.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function reverse(contact: Contact): Contact;
/**
 * Every touching pair among these elements.
 *
 * Swept along the up axis rather than compared pairwise: sorting by the bottom
 * of each box and walking forward until the next box starts above the current
 * one's top turns a quadratic scan into something a project-scale model can
 * afford. On 446 elements the difference is 99,000 comparisons against a few
 * thousand.
 */
declare function findAdjacent(elements: {
    id: number;
    box: Box;
}[], opts?: AdjacencyOptions): Adjacency[];
/** The adjacencies of one element, both directions folded together, so a
 *  caller can ask "what is next to this" without knowing which side of the
 *  pair it was found on. */
declare function neighboursOf(id: number, all: Adjacency[]): {
    id: number;
    contact: Contact;
    overlap: number;
    tolerance: number;
}[];

export { AABB, type AddWallSystemOptions, type Adjacency, type AdjacencyOptions, ArcCurve, type Axis, BalloonFrame, type BalloonFrameOptions, BlobDetect, type Box, type BspNode, type BspPolygon, BspTree, Capsule2D, CltConstruction, type CltOptions, type ConnectionType, type Contact, CubicBezierCurve, Curvature, CurveUtils, type CutListItem, Delaunay2D, DistanceTransform, type DoorOperation, Dxf2DContent, ExtrudedRibbon, type ExtrudedRibbonOptions, MeshData as FlatMeshData, FloodFill, Graph, GridGraph, HelixCurve, HolzrahmenBau, HolzrahmenBauJointStyle, type HolzrahmenBauOptions, type ICurve, type IMetricCurve, type ISdf, type IfcElementData, IfcFile, IfcModel, type IfcModelData, type IfcParseElementsOptions, type IfcParseOptions, type IfcRelations, type IfcSpatialNode, IfcWriter, type IfcWriterOptions, type Intersect2DResult, Intersections, type JointKind, type JointParticipant, type JointStyle, type JointTrim, type JoistOrientationOptions, JoistedSlab, type JoistedSlabOptions, type LatticeType, type LayerPosition, LineCurve, MITER_LIMIT, MarchingCubes, MarchingSquares, Mat4, type MaterialLayer, Mesh, MeshAnalysis, type MeshBuffers, MeshCleanup, MeshSubdivide, MeshTransform, type MicroPatternType, MultiPoly2, NoFitPolygon, NurbsCurve, NurbsSurface, OpeningType, type OpeningTypeOptions, PGFace, PGHalfEdge, PGVertex, type PartProfile, type Pdf2DOptions, type PerpSegment, PixelView, PlanarGraph, PlanarGraphCleanup, PlanarGraphRepair, Plane, type PointClassification, PolylineCurve, type PropertyMap, Ray, type RealizedSlab, type RealizedWall, RibbonEndTrim, RibbonFrame, RibbonJoint, RibbonOpening, RibbonSystem, RigidBody2D, type RigidBodyConfig, Ring2, SdfBlend, SdfBoundedExtrude, SdfBox, SdfCapsule, SdfCone, SdfCylinder, SdfEllipsoid, SdfExtrude, SdfGradient, SdfIntersect, SdfLattice, SdfLine as SdfLineField, SdfMicrostructure, SdfMirror, SdfOffset, SdfOnion, SdfOps, SdfPlane as SdfPlaneField, SdfRadialArray, SdfRevolution, SdfShell, SdfSmoothSubtract, SdfSmoothUnion, SdfSphere, SdfSubtract, SdfTorus, SdfTransform, SdfTwist, SdfUnion, SdfUtils, SdfVoronoi, Slab, type SlabConstruction, type SlabContext, SlabOpening, type SlabOptions, type SlabPart, type SlabPartRole, SlabType, type SlabTypeOptions, SolidConstruction, SolidSlabConstruction, Space, type SpaceOptions, Sphere, type Spring, Spring2D, type SpringConfig, SpringSystem3D, Stair, type StairFlight, type StairOptions, type StairShape, StairType, type StairTypeOptions, type StreamlineOptions, StreamlineTracer, SunPosition, type SunPositionInput, type SunPositionResult, Triangle, type UpAxis, Vec2, Vec3, VecMath, type VertexCurvature, VoxelGrid, VoxelGrid2D, Wall, type WallConstruction, WallJoint, type WallJointOptions, WallOpening, type WallOptions, type WallPart, type WallPartRole, WallSystem, WallType, type WindowPartitioning, boundingWalls, boxOf, buildCutList, chooseJoistDirection, clampedUniformKnots, cltLayers, contactBetween, edgeOutwardVisibility, findAdjacent, holzrahmenbauLayers, joistDirectionFromBounds, joistDirectionFromPCA, joistDirectionFromSupports, lineClipPolygon, neighboursOf, perpVisibility, perpVisibilityOfPolys, polygonFromVertices, realize, realizeSlab, repelBodies, reverse as reverseContact, writePdf2D };
