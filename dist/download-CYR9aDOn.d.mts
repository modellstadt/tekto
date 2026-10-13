import { M as Mesh, V as Vec3, b as Vec2, A as AABB } from './Scene-CVb27q1H.mjs';

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
 * Tekto MeshFactory — Factory functions that produce Mesh instances.
 *
 * Mirrors HDGEO.Core.MeshFactory.
 */

/** A grid whose heights can be rewritten in place (animation) without rebuilding topology. */
type GridMesh = Mesh & {
    update(heightFn: (x: number, z: number) => number): void;
};
/**
 * Generators that return a {@link Mesh}. Primitives `box`, `sphere`, `cylinder`, `torus`,
 * `grid` (heightfield, with `.update(fn)`); sweeps `extrude`, `revolve`, `loft`, `pipe`;
 * modifiers `subdivide` (Catmull-Clark), `midpointSubdivide`, `triangulate`.
 * Primitives are Y-up (three.js); faces point outward. Impossible arguments throw.
 *
 *   const wall = MeshFactory.extrude(outline, new Vec3(0, 0, 3));
 */
declare const MeshFactory: {
    grid(width: number, depth: number, divisionsX: number, divisionsZ: number, heightFn?: (x: number, z: number) => number): GridMesh;
    /**
     * Extrude a closed polygon (no repeated last point) along `direction`. Faces point
     * outward whichever way the polygon winds: it is reoriented to run counter-clockwise
     * seen from the tip of `direction` first.
     */
    extrude(polygon: Vec3[], direction: Vec3, cap?: boolean): Mesh;
    revolve(profile: Vec2[], segments?: number, angleRange?: number): Mesh;
    loft(profiles: Vec3[][], closedProfile?: boolean): Mesh;
    box(width?: number, height?: number, depth?: number): Mesh;
    sphere(radius?: number, segments?: number, rings?: number): Mesh;
    cylinder(radiusTop?: number, radiusBottom?: number, height?: number, segments?: number, cap?: boolean): Mesh;
    torus(majorRadius?: number, minorRadius?: number, segments?: number, sides?: number): Mesh;
    /**
     * Create a tube mesh by sweeping a circular cross-section along a path.
     * Accepts uniform radius (number) or per-point varying radii (number[]).
     */
    pipe(path: Vec3[], radius: number | number[], sides?: number): Mesh;
    /**
     * Catmull-Clark subdivision. With `opts.creaseAngleDeg`, edges whose
     * adjacent faces meet at a dihedral angle sharper than the threshold are
     * treated as CREASES (sharp-edge rules: edge point = midpoint; a vertex on
     * exactly two crease edges moves by the 1D B-spline rule (a + 6v + b)/8;
     * three or more crease edges pin the vertex). Boundary edges always count
     * as creases in that mode. Without opts the classic behavior is unchanged.
     */
    subdivide(mesh: Mesh, opts?: {
        creaseAngleDeg?: number;
        /** Extra crease test by edge endpoint positions — flagged edges follow the
         *  sharp rules regardless of the dihedral angle. */
        creaseEdge?: (a: Vec3, b: Vec3) => boolean;
        /** Vertices matching this predicate keep their EXACT position (pinned) —
         *  e.g. column feet that must stay on the ground through every level. */
        pinVertex?: (p: Vec3) => boolean;
    }): Mesh;
    triangulate(mesh: Mesh): Mesh;
    /**
     * Midpoint (1→4) subdivision of the triangulated mesh: every triangle becomes
     * four, vertices stay where they are. Linear — no smoothing; for the smooth
     * limit surface use `subdivide` (Catmull-Clark).
     */
    midpointSubdivide(mesh: Mesh): Mesh;
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
/**
 * 2D polygon operations on open rings of `Vec2` (no repeated closing point): `area`,
 * `signedArea`, `centroid2D`, `pointInPolygon`, `offset`, `simplify`, `convexHull2D`,
 * `triangulate2D`, `filletRays`, `minAreaRect`, `openRing`/`closeRing`, `createRect`/`createCircle`
 * and more. For booleans with holes use {@link PolygonBool}.
 */
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
    /**
     * Offset a simple polygon by moving each vertex along its corner bisector: positive
     * `distance` grows it, negative shrinks it, whichever way it winds. A ring that repeats
     * its first point comes back closed the same way. Insetting past the polygon's inner
     * radius returns `[]` (the polygon is gone) instead of an inverted shape. Vertex offset
     * only — no clean-up of self-intersections at deep concave insets; for those use
     * `PolygonBool`.
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
 * Re-export shim — algorithms have moved to:
 *   - src/core/geometry/Polygon2D.ts  (2D polygon operations)
 *   - src/core/geometry/mesh/MeshAnalysis.ts  (mesh operations)
 *
 * Import from the new locations for new code.
 */
declare const Algo: {
    meshVolume(mesh: Mesh): number;
    meshSurfaceArea(mesh: Mesh): number;
    meshCentroid(mesh: Mesh): Vec3;
    laplacianSmooth(mesh: Mesh, iterations?: number, factor?: number): void;
    convexHull3D(points: Vec3[]): Mesh;
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
 * Tekto PolygonBool — robust 2D boolean operations on polygons *with holes*.
 *
 * Thin, Vec2-native wrapper over `polygon-clipping` (pure-JS, sweepline-robust).
 * Unlike {@link polygonIntersection} (Greiner–Hormann, two simple rings, no
 * holes), these operate on multipolygons that may contain holes — which is
 * exactly what you need when a packed/placed region encloses a gap, or when a
 * No-Fit Polygon develops an interior void.
 *
 * Representation:
 *   Ring2      = Vec2[]            one ring, *open* (no repeated closing vertex)
 *   Poly2      = Ring2[]           [outerRing, ...holeRings]
 *   MultiPoly2 = Poly2[]           zero or more disjoint polygons, each w/ holes
 *
 * Winding is not required on input (polygon-clipping normalises). On output,
 * outer rings are CCW and holes CW, following polygon-clipping's convention.
 */

type Ring2 = Vec2[];
type Poly2 = Ring2[];
type MultiPoly2 = Poly2[];
/** Set the coordinate snap grid used before boolean ops (mm). 0 disables it. */
declare function setClipSnap(grid: number): void;
/**
 * Robust 2D booleans on polygons with holes: `union`, `intersection`, `difference` over
 * multipolygons (`Ring2` → `Poly2` = [outer, …holes] → `MultiPoly2`), plus `fromRing`,
 * `rings`, `area`. Winding doesn't matter on input. Prefer this over `polygonIntersection`.
 *
 *   const rooms = PolygonBool.difference(PolygonBool.fromRing(site), PolygonBool.fromRing(core));
 */
declare const PolygonBool: {
    /** Wrap a single solid ring as a multipolygon. */
    fromRing(ring: Ring2): MultiPoly2;
    /** Flatten every ring (outer + holes, all polygons) — handy for drawing. */
    rings(mp: MultiPoly2): Ring2[];
    /** True when the multipolygon encloses no area. */
    isEmpty(mp: MultiPoly2): boolean;
    /**
     * Total enclosed area (outer rings minus holes). Always non-negative; relies
     * on polygon-clipping's CCW-outer / CW-hole output, but uses absolute ring
     * areas so it is also correct for hand-built input with consistent winding.
     */
    area(mp: MultiPoly2): number;
    /** Union of one or more multipolygons. */
    union(...mps: MultiPoly2[]): MultiPoly2;
    /** `subject` minus every `clip`. */
    difference(subject: MultiPoly2, ...clips: MultiPoly2[]): MultiPoly2;
    /** Intersection of two or more multipolygons. */
    intersection(...mps: MultiPoly2[]): MultiPoly2;
};

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
 * Pure DXF text writers — no three.js, no DOM, so they run in Node and in `tekto/core`.
 *
 * `writeDxf3D` writes true-3D geometry in world space. The R12 primitives below are
 * shared with `DxfExporter` (mesh views with hidden-line removal, browser entry), which
 * imports them from here; the underscore names are internal, not part of the API.
 */

interface DxfLayerDef {
    name: string;
    /** AutoCAD Color Index (ACI): 1=red 2=yellow 3=green 4=cyan 5=blue 7=white */
    color?: number;
    /** Currently ignored: the R12 writer emits every layer as CONTINUOUS (the only linetype it defines). */
    lineType?: string;
}
/** A polyline in world space (Z-up); emitted as a DXF 3D POLYLINE. */
interface Dxf3DPolyline {
    layer: string;
    points: Vec3[];
    closed?: boolean;
}
/** A straight segment in world space; emitted as a DXF LINE (use for standalone lines — a POLYLINE
 *  is heavier and some CAD tools prefer discrete LINEs). */
interface Dxf3DLine {
    layer: string;
    start: Vec3;
    end: Vec3;
}
/** A single point node; emitted as a DXF POINT. */
interface Dxf3DPoint {
    layer: string;
    position: Vec3;
}
/** A horizontal circular arc at elevation z (world XY plane, CCW, angles in degrees). A full sweep
 *  (|endDeg − startDeg| ≥ 360) is written as a CIRCLE — AutoCAD collapses a 0→360 ARC to nothing. */
interface Dxf3DArc {
    layer: string;
    center: Vec3;
    radius: number;
    startDeg: number;
    endDeg: number;
}
/** A full circle in the world XY plane at elevation z. */
interface Dxf3DCircle {
    layer: string;
    center: Vec3;
    radius: number;
}
/** Input to {@link writeDxf3D}. Any layer used by an entity but absent from `layers` is declared color 7. */
interface Dxf3DContent {
    polylines?: Dxf3DPolyline[];
    lines?: Dxf3DLine[];
    points?: Dxf3DPoint[];
    arcs?: Dxf3DArc[];
    circles?: Dxf3DCircle[];
    layers?: DxfLayerDef[];
}
/**
 * Write a true-3D DXF (R12 / AC1009): 3D POLYLINEs, LINEs, POINTs, horizontal ARCs and CIRCLEs in
 * world coordinates — unlike {@link DxfExporter}, which flattens geometry to a 2D view plane. AutoCAD-safe
 * by construction: every referenced layer is auto-declared, names are sanitized to R12 tokens, reals
 * are plain decimals (never exponential), and the file carries a full HEADER/LTYPE/BLOCKS skeleton.
 * A full-sweep arc (|endDeg − startDeg| ≥ 360) is emitted as a CIRCLE, since AutoCAD collapses a
 * 0→360 ARC to a zero-sweep (invisible) arc; partial arc angles are normalized into [0, 360).
 *
 * Coordinates are Z-up world space (tekto convention), written verbatim — scale before calling if
 * your CAD target expects millimetres.
 */
declare function writeDxf3D(content: Dxf3DContent): string;
/** A point in the drawing plane. `Vec2`, or anything with x and y. */
interface Dxf2DPoint {
    x: number;
    y: number;
}
/** A polyline in the drawing plane; emitted as an R12 2D POLYLINE (closed = the ring is shut). */
interface Dxf2DPolyline {
    layer: string;
    points: Dxf2DPoint[];
    closed?: boolean;
}
interface Dxf2DLine {
    layer: string;
    start: Dxf2DPoint;
    end: Dxf2DPoint;
}
interface Dxf2DCircle {
    layer: string;
    center: Dxf2DPoint;
    radius: number;
}
/** CCW arc, angles in degrees; a full sweep is written as a CIRCLE (AutoCAD drops a 0→360 ARC). */
interface Dxf2DArc {
    layer: string;
    center: Dxf2DPoint;
    radius: number;
    startDeg: number;
    endDeg: number;
}
/** Single-line text at `at` (its baseline start), `height` in drawing units, rotated CCW. */
interface Dxf2DText {
    layer: string;
    at: Dxf2DPoint;
    text: string;
    height: number;
    rotationDeg?: number;
}
/** Input to {@link writeDxf2D}. Any layer an entity uses but `layers` doesn't list is declared colour 7. */
interface Dxf2DContent {
    polylines?: Dxf2DPolyline[];
    lines?: Dxf2DLine[];
    circles?: Dxf2DCircle[];
    arcs?: Dxf2DArc[];
    texts?: Dxf2DText[];
    layers?: DxfLayerDef[];
}
/**
 * Write a 2D drawing (plan, section, cut sheet) as DXF R12: POLYLINEs, LINEs, CIRCLEs,
 * ARCs and TEXT on named layers — the same AutoCAD-safe writer as {@link writeDxf3D}
 * (every layer declared, R12 names, plain decimals).
 *
 * `scale` multiplies every coordinate, radius and text height and sets the file's unit:
 * 1 (default) writes your numbers as metres, 1000 writes metres as millimetres (the usual
 * CAD drawing unit). A NaN or infinite coordinate throws; a circle or arc with a degenerate
 * radius is dropped, as in `writeDxf3D`.
 *
 *   download(writeDxf2D({ polylines: [{ layer: "cut", points: outline, closed: true }],
 *     texts: [{ layer: "text", at: { x: 0, y: -0.5 }, text: "Plan 1:50", height: 0.25 }] },
 *     { scale: 1000 }), "plan.dxf");
 */
declare function writeDxf2D(content: Dxf2DContent, opts?: {
    scale?: number;
}): string;

/**
 * Save data as a file from the browser — the helper ten apps had each written themselves.
 *
 * Two details the copies got wrong: the object URL must outlive the click (revoking it at
 * once truncates large files in some browsers, because the download reads the URL after
 * `click()` returns), and the anchor must be in the document for Firefox to follow it.
 */
/** "stair.dxf" → "stair-20261013-1542.dxf": a timestamp before the extension. */
declare function stampName(fileName: string, date?: Date): string;
/**
 * Download `data` as `fileName`. Strings and bytes get a MIME type from the extension
 * (override with `type`); `stamp: true` adds a date-time to the name.
 *
 *   download(writeDxf2D(plan), "plan.dxf", { stamp: true });
 */
declare function download(data: string | Blob | ArrayBuffer | Uint8Array, fileName: string, opts?: {
    stamp?: boolean;
    type?: string;
}): void;

export { Algo as A, writeDxf2D as B, writeDxf3D as C, type DxfLayerDef as D, type FilletResult as F, HMath as H, MathUtils as M, OBB2D as O, type Poly2 as P, type Ring2 as R, type SeededRandom as S, type Dxf2DArc as a, type Dxf2DCircle as b, type Dxf2DContent as c, type Dxf2DLine as d, type Dxf2DPoint as e, type Dxf2DPolyline as f, type Dxf2DText as g, type Dxf3DArc as h, type Dxf3DCircle as i, type Dxf3DContent as j, type Dxf3DLine as k, type Dxf3DPoint as l, type Dxf3DPolyline as m, MeshFactory as n, type MultiPoly2 as o, Polygon2D as p, PolygonBool as q, Segment as r, closestPointOnSegment as s, createRandom as t, download as u, noise as v, polygonIntersection as w, segmentSegmentClosest as x, setClipSnap as y, stampName as z };
