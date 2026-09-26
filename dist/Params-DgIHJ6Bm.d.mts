/**
 * Tekto Core Math
 *
 * Immutable vector/matrix types with fluent API.
 * All operations return new instances (no mutation).
 */
declare class Vec2 {
    readonly x: number;
    readonly y: number;
    constructor(x?: number, y?: number);
    static zero(): Vec2;
    static one(): Vec2;
    static unitX(): Vec2;
    static unitY(): Vec2;
    static fromAngle(radians: number): Vec2;
    static fromArray(a: number[]): Vec2;
    add(v: Vec2): Vec2;
    sub(v: Vec2): Vec2;
    mul(s: number): Vec2;
    div(s: number): Vec2;
    neg(): Vec2;
    dot(v: Vec2): number;
    cross(v: Vec2): number;
    len(): number;
    lenSq(): number;
    normalize(): Vec2;
    distTo(v: Vec2): number;
    distSqTo(v: Vec2): number;
    lerp(v: Vec2, t: number): Vec2;
    angle(): number;
    angleTo(v: Vec2): number;
    rotate(radians: number): Vec2;
    perp(): Vec2;
    almostEqual(v: Vec2, eps?: number): boolean;
    toArray(): [number, number];
    toVec3(z?: number): Vec3;
    toString(): string;
    clone(): Vec2;
    toJSON(): {
        x: number;
        y: number;
    };
    static fromJSON(j: {
        x: number;
        y: number;
    }): Vec2;
}
declare class Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    constructor(x?: number, y?: number, z?: number);
    static zero(): Vec3;
    static one(): Vec3;
    static unitX(): Vec3;
    static unitY(): Vec3;
    static unitZ(): Vec3;
    static fromArray(a: number[]): Vec3;
    add(v: Vec3): Vec3;
    sub(v: Vec3): Vec3;
    mul(s: number): Vec3;
    div(s: number): Vec3;
    neg(): Vec3;
    dot(v: Vec3): number;
    cross(v: Vec3): Vec3;
    len(): number;
    lenSq(): number;
    normalize(): Vec3;
    distTo(v: Vec3): number;
    distSqTo(v: Vec3): number;
    lerp(v: Vec3, t: number): Vec3;
    project(onto: Vec3): Vec3;
    reflect(normal: Vec3): Vec3;
    almostEqual(v: Vec3, eps?: number): boolean;
    toArray(): [number, number, number];
    toVec2(): Vec2;
    xz(): Vec2;
    toString(): string;
    clone(): Vec3;
    toJSON(): {
        x: number;
        y: number;
        z: number;
    };
    static fromJSON(j: {
        x: number;
        y: number;
        z: number;
    }): Vec3;
}
declare class Vec4 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    dot(v: Vec4): number;
    toVec3(): Vec3;
    toArray(): [number, number, number, number];
}
declare class Mat4 {
    readonly m: Float64Array;
    /** 16 elements in column-major order */
    constructor(m?: Float64Array);
    static identity(): Mat4;
    static translation(x: number, y: number, z: number): Mat4;
    static scaling(x: number, y: number, z: number): Mat4;
    static rotationX(rad: number): Mat4;
    static rotationY(rad: number): Mat4;
    static rotationZ(rad: number): Mat4;
    static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4;
    multiply(b: Mat4): Mat4;
    transformPoint(v: Vec3): Vec3;
    transformDirection(v: Vec3): Vec3;
    invert(): Mat4;
    toArray(): number[];
}

/**
 * Tekto Triangle primitive.
 *
 * Mirrors HDGEO.Core.Triangle.
 */

declare class Triangle {
    readonly a: Vec3;
    readonly b: Vec3;
    readonly c: Vec3;
    constructor(a: Vec3, b: Vec3, c: Vec3);
    normal(): Vec3;
    area(): number;
    centroid(): Vec3;
    /** Barycentric coordinates of a point (assumes point is on triangle's plane) */
    barycentric(p: Vec3): Vec3;
    containsPoint(p: Vec3): boolean;
    closestPointTo(p: Vec3): Vec3;
    toJSON(): {
        a: {
            x: number;
            y: number;
            z: number;
        };
        b: {
            x: number;
            y: number;
            z: number;
        };
        c: {
            x: number;
            y: number;
            z: number;
        };
    };
}

/**
 * Tekto AABB — Axis-Aligned Bounding Box.
 *
 * Mirrors HDGEO.Core.AABB.
 */

declare class AABB {
    readonly min: Vec3;
    readonly max: Vec3;
    constructor(min: Vec3, max: Vec3);
    static empty(): AABB;
    static fromPoints(points: Vec3[]): AABB;
    center(): Vec3;
    size(): Vec3;
    volume(): number;
    expand(point: Vec3): AABB;
    union(other: AABB): AABB;
    containsPoint(p: Vec3): boolean;
    intersectsAABB(other: AABB): boolean;
    toJSON(): {
        min: {
            x: number;
            y: number;
            z: number;
        };
        max: {
            x: number;
            y: number;
            z: number;
        };
    };
}

/**
 * Mesh — the one mesh class: edited, analysed and rendered from the same object.
 *
 * Storage is typed arrays, so a million triangles fit in tens of megabytes and
 * the render upload is a copy of the arrays, not a walk over objects. On top of
 * that the mesh keeps full connectivity — edges, and the links node↔edge↔face —
 * as typed-array linked lists that are maintained incrementally by every edit.
 * So `addFace`, `removeFace`, `splitEdge` cost what they touch, never a rebuild,
 * and an id handed out by `addNode`/`addEdge`/`addFace` stays valid until
 * `compact()` is called.
 *
 *   - Ids are indices. Removal tombstones the element; `nodeCount`/`edgeCount`/
 *     `faceCount` count the live ones, `vertexCount` counts vertex slots (what
 *     `positions.length / 3` is). `compact()` drops the tombstones and renumbers.
 *   - Faces are polygons (triangles, quads, n-gons); `indices` fan-triangulates
 *     on demand for the GPU and is cached until the topology changes.
 *   - `node(id)` / `edge(id)` / `face(id)` return small views (`MeshNode` …) that
 *     read and write through to the arrays: `node.position = p` works, and
 *     `face.nodes` is a snapshot array — to reverse a face use `reverseFace(id)`.
 *   - Normals, bounds and the triangle index are caches: computed on first use,
 *     dropped by whatever invalidates them.
 *   - Positions are Float64 (the analysis code compares to 1e-8); normals, uvs
 *     and colours are Float32.
 *
 * Both older classes' APIs are kept: the id-based topology API of the former
 * `ConnectedMesh` and the array API (`positions`, `indices`, `vertexCount`,
 * `smooth` …) of the former flat `Mesh`/`FlatMesh`.
 */

/** Flat arrays for rendering and IO: what a GPU or an OBJ writer wants. */
interface MeshData$1 {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
    uvs?: Float32Array;
    colors?: Float32Array;
}
/** What `toJSON()` writes. Dense: tombstones are dropped, ids renumbered. */
interface MeshJSON {
    positions: number[];
    faces: number[][];
    normals?: number[];
    uvs?: number[];
    colors?: number[];
    nodeData?: [number, Record<string, any>][];
    faceData?: [number, Record<string, any>][];
}
/** Formats `fromJSON()` still reads: the former ConnectedMesh and flat-mesh files. */
type LegacyMeshJSON = {
    nodes: {
        id: number;
        position: {
            x: number;
            y: number;
            z: number;
        };
        data?: Record<string, any>;
    }[];
    faces: {
        id: number;
        nodes: number[];
        data?: Record<string, any>;
    }[];
} | {
    positions: number[];
    indices: number[];
    normals?: number[];
    uvs?: number[];
};
/** A node seen through `mesh.node(id)`: reads and writes go to the mesh. */
interface MeshNode {
    readonly id: number;
    position: Vec3;
    /** Incident edge ids (snapshot). */
    readonly edges: number[];
    /** Incident face ids (snapshot). */
    readonly faces: number[];
    /** Set by `computeVertexNormals()`; undefined before. */
    normal?: Vec3;
    readonly data: Record<string, any>;
}
interface MeshEdge {
    readonly id: number;
    readonly nodes: [number, number];
    /** Incident face ids (snapshot). */
    readonly faces: number[];
    readonly data: Record<string, any>;
}
interface MeshFace {
    readonly id: number;
    /** Node ids in winding order (snapshot — see `Mesh.reverseFace`). */
    readonly nodes: number[];
    /** Edge ids, `edges[i]` joining `nodes[i]` to `nodes[i+1]` (snapshot). */
    readonly edges: number[];
    /** Set by `computeFaceNormals()`; undefined before. */
    normal?: Vec3;
    readonly data: Record<string, any>;
}
declare class Mesh {
    private _pos;
    private _nrm;
    private _nrmN;
    private _uv;
    private _col;
    private _nodeAlive;
    private _nodeFirstEdge;
    private _nodeFirstCorner;
    private _nodeN;
    private _nodeLive;
    private _edgeA;
    private _edgeB;
    private _edgeNext;
    private _edgeFirstCorner;
    private _edgeAlive;
    private _edgeN;
    private _edgeLive;
    private _faceStart;
    private _faceAlive;
    private _faceNrm;
    private _faceNrmN;
    private _faceN;
    private _faceLive;
    private _cVert;
    private _cFace;
    private _cEdge;
    private _cNextInNode;
    private _cNextInEdge;
    private _cornerN;
    private _triCount;
    private _nodeData;
    private _edgeData;
    private _faceData;
    private _bounds;
    private _tri;
    /**
     * `new Mesh()` is empty. `new Mesh(positions, indices, normals?, uvs?, colors?)`
     * loads flat triangle arrays (the former flat-mesh constructor).
     */
    constructor(positions?: ArrayLike<number>, indices?: ArrayLike<number>, normals?: ArrayLike<number>, uvs?: ArrayLike<number>, colors?: ArrayLike<number>);
    /** Live nodes. */
    get nodeCount(): number;
    /** Live edges. */
    get edgeCount(): number;
    /** Live faces (polygons). */
    get faceCount(): number;
    /** Vertex slots — `positions.length / 3`. Equals `nodeCount` unless nodes were removed. */
    get vertexCount(): number;
    /** Triangles after fan-triangulating the live faces. */
    get triangleCount(): number;
    /** True if any element was removed and not yet compacted. */
    get hasTombstones(): boolean;
    /** xyz per vertex slot. A view into the mesh: edits are live, but call
     *  `markPositionsChanged()` afterwards so normals and bounds are recomputed. */
    get positions(): Float64Array;
    /** Vertex normals, computed on first use. */
    get normals(): Float32Array;
    /** Triangle index over the live faces (fan-triangulated). Cached; a plain view of
     *  the corner array when the mesh is all triangles with nothing removed. */
    get indices(): Uint32Array;
    get uvs(): Float32Array | null;
    get colors(): Float32Array | null;
    /** Attach per-vertex uvs (2 floats per slot). */
    setUVs(uvs: ArrayLike<number> | null): void;
    /** Attach per-vertex colours (4 floats per slot, RGBA). */
    setColors(colors: ArrayLike<number> | null): void;
    /** Call after writing into `positions` directly. */
    markPositionsChanged(): void;
    getPosition(id: number): Vec3;
    setPosition(id: number, p: Vec3): void;
    /** Vertex normal, computing all of them if they are stale. */
    getNormal(id: number): Vec3;
    /** Vertex normal if `computeVertexNormals()` covered this node, else undefined. */
    nodeNormal(id: number): Vec3 | undefined;
    setNormal(id: number, n: Vec3): void;
    nodeData(id: number): Record<string, any>;
    isNodeAlive(id: number): boolean;
    node(id: number): MeshNode | undefined;
    nodes(): IterableIterator<MeshNode>;
    nodesArray(): MeshNode[];
    /** Live node ids, in order. */
    nodeIds(): number[];
    addNode(position: Vec3, data?: Record<string, any>): number;
    addNodes(positions: Vec3[]): number[];
    private _addNodeXYZ;
    /** Incident edge ids. */
    nodeEdges(id: number): number[];
    /** Incident face ids. */
    nodeFaces(id: number): number[];
    nodeNeighbors(id: number): number[];
    /** Neighbour ids as a typed array (the flat-mesh spelling of `nodeNeighbors`). */
    neighbors(id: number): Uint32Array;
    isBoundaryNode(id: number): boolean;
    /** Flat-mesh spelling of `isBoundaryNode`. */
    isBoundary(id: number): boolean;
    removeNode(id: number): void;
    edgeNodes(id: number): [number, number];
    /** Incident face ids. */
    edgeFaces(id: number): number[];
    edgeData(id: number): Record<string, any>;
    isEdgeAlive(id: number): boolean;
    edge(id: number): MeshEdge | undefined;
    edges(): IterableIterator<MeshEdge>;
    edgesArray(): MeshEdge[];
    /** The edge joining two nodes, in either direction, or undefined. */
    findEdge(a: number, b: number): number | undefined;
    /** Adds an edge, or returns the existing one between the two nodes. */
    addEdge(a: number, b: number, data?: Record<string, any>): number;
    edgeOtherNode(edgeId: number, nodeId: number): number;
    isBoundaryEdge(id: number): boolean;
    boundaryEdges(): MeshEdge[];
    /** Removes the edge and every face that uses it. */
    removeEdge(id: number): void;
    private _nextEdgeOf;
    private _edgeCornerCount;
    private _unlinkEdge;
    /** Node ids of a face as a view into the corner array — no copy, valid until the next edit. */
    faceVerts(id: number): Uint32Array;
    faceNodes(id: number): number[];
    faceEdges(id: number): number[];
    faceSize(id: number): number;
    /** Face normal if `computeFaceNormals()` covered this face, else undefined. */
    faceNormal(id: number): Vec3 | undefined;
    setFaceNormal(id: number, n: Vec3): void;
    faceData(id: number): Record<string, any>;
    isFaceAlive(id: number): boolean;
    face(id: number): MeshFace | undefined;
    faces(): IterableIterator<MeshFace>;
    facesArray(): MeshFace[];
    /** Live face ids, in order. */
    faceIds(): number[];
    addFace(nodeIds: ArrayLike<number>, data?: Record<string, any>): number;
    addTriangle(a: number, b: number, c: number, data?: Record<string, any>): number;
    addQuad(a: number, b: number, c: number, d: number, data?: Record<string, any>): number;
    /** Removes the face. Its edges stay (an edge is its own element). */
    removeFace(id: number): void;
    /** Reverses the winding of a face in place (what `face.nodes.reverse()` used to do). */
    reverseFace(id: number): void;
    faceTriangle(id: number): Triangle | null;
    /** Registers the face's corners with their edges and nodes (edges are created as needed). */
    private _linkCorners;
    private _unlinkCorners;
    clear(): void;
    /**
     * Drops removed elements and renumbers the rest densely, in order. Returns the
     * old→new maps (−1 for removed). Every id held before this call is stale.
     */
    compact(): {
        nodes: Int32Array;
        edges: Int32Array;
        faces: Int32Array;
    };
    clone(): Mesh;
    /** Copies the live elements into `m` (densely renumbered) and returns the id maps. */
    private _copyInto;
    /** Appends another mesh (its live nodes, edges and faces) and returns the combined mesh. */
    merge(other: Mesh): Mesh;
    /** Newell normal per live face (robust for non-planar quads). */
    computeFaceNormals(): void;
    /** Vertex normal = normalised sum of the unit normals of the faces around it. */
    computeVertexNormals(): void;
    /** Flat-mesh spelling of `computeVertexNormals`. */
    computeNormals(): void;
    bounds(): AABB;
    /** Signed-tetrahedra volume (closed, consistently wound meshes). */
    volume(): number;
    surfaceArea(): number;
    /** Average of the live node positions. */
    centroid(): Vec3;
    /** V − E + F over the live elements. */
    eulerCharacteristic(): number;
    translate(dx: number, dy: number, dz: number): void;
    scale(s: number): void;
    scaleXYZ(sx: number, sy: number, sz: number): void;
    mapPositions(fn: (x: number, y: number, z: number, index: number) => [number, number, number]): void;
    /** Laplacian smoothing: each interior node moves toward the mean of its neighbours. */
    smooth(iterations?: number, factor?: number): void;
    /** Splits an edge at parameter `t`, splitting its faces; returns the new node id. */
    splitEdge(edgeId: number, t?: number): number;
    /** Collapses an edge to its midpoint; returns the surviving node id. */
    collapseEdge(edgeId: number): number;
    getTriangle(t: number): [number, number, number];
    getTrianglePositions(t: number): [Vec3, Vec3, Vec3];
    /** Flat Float32 arrays for rendering/IO. Dense: removed nodes are dropped. */
    toMeshData(): MeshData$1;
    static fromMeshData(d: MeshData$1): Mesh;
    static fromArrays(positions: ArrayLike<number>, indices: ArrayLike<number>, normals?: ArrayLike<number>, uvs?: ArrayLike<number>, colors?: ArrayLike<number>): Mesh;
    static fromIndexedTriangles(positions: Vec3[], indices: number[], data?: Record<string, any>[]): Mesh;
    static fromFaces(positions: Vec3[], faces: number[][]): Mesh;
    private _load;
    toJSON(): MeshJSON;
    /** Reads the current format and both legacy ones (`{nodes, faces}` and `{positions, indices}`). */
    static fromJSON(json: MeshJSON | LegacyMeshJSON): Mesh;
    private _needNodes;
    private _needEdges;
    private _needFaces;
    private _needCorners;
}

/**
 * Tekto IO — Wavefront OBJ file import/export.
 *
 * Mirrors HDGEO.Core.IO.ObjFile.
 */

interface MeshData {
    positions: Vec3[];
    normals: Vec3[];
    uvs: Vec2[];
    faces: number[][];
    /**
     * Optional OBJ group ranges. Populated by `ObjFile.parse` whenever the
     * file contains `g <name>` directives. Each entry is a contiguous run
     * of face indices that share the named group — used by consumers
     * (e.g. the stair app's FEM/streamline pipeline) to keep sub-meshes
     * separable after the file is loaded.
     */
    groups?: {
        name: string;
        faceStart: number;
        faceCount: number;
    }[];
}
declare const ObjFile: {
    /** Parses an OBJ string into MeshData. Handles v/vt/vn/f lines. */
    parse(source: string): MeshData;
    /** Serializes MeshData to an OBJ format string. */
    serialize(data: MeshData): string;
};

/**
 * Tekto Scene
 *
 * Scene graph layer that wraps core geometry with:
 *   - Visual properties (color, opacity, wireframe, labels)
 *   - Selection and hover state
 *   - Event system
 *   - Serialization
 */

type SceneObjectType = "point" | "segment" | "polyline" | "polygon" | "mesh" | "circle" | "plane" | "group";
type RenderMode = "solid" | "wireframe" | "hiddenline";
/**
 * High-level lighting / shading preset applied across the scene.
 *
 *   "flat"   — current defaults: 3 cheap lights, MeshPhongMaterial, no
 *              shadows, no tonemapping. Fast, neutral, good for inspection.
 *   "studio" — PBR (MeshStandardMaterial), one sun-style directional light
 *              with PCF-soft shadow maps, ACES filmic tonemapping. Surfaces
 *              read as real materials; readable contact shadows on the
 *              floor; significantly slower (~2-3× per frame).
 */
type LightingMode = "flat" | "studio";
interface VisualStyle {
    color: string;
    opacity: number;
    wireframe: boolean;
    lineWidth: number;
    pointSize: number;
    doubleSided: boolean;
    visible: boolean;
    /** Render with per-face (faceted) normals instead of smooth/averaged vertex
     *  normals. Doesn't change the geometry — only the material — so it also works
     *  on shared-vertex meshes (e.g. `MeshFactory.box`, whose 8 shared corners
     *  otherwise read as a subtly rounded cube). Default false. */
    flatShading?: boolean;
    /** Hidden-line render mode: draw only edges where the angle between the two
     *  adjacent faces exceeds this many degrees (feature / crease edges). Coplanar
     *  tessellation edges — e.g. a quad's diagonal split, or the tiling seams
     *  across a flat wall — are dropped, leaving a clean technical-drawing look.
     *  Default 30. */
    edgeAngle?: number;
    /** Hidden-line render mode: color of this object's feature-edge lines.
     *  Default #b0b0b0 — a neutral gray line drawing; set per object to keep
     *  its identity color readable in the hidden-line view. */
    edgeColor?: string;
    /** When set, renders back-faces in this color (enables doubleSided automatically). */
    backfaceColor?: string;
    /** Per-group colors keyed by group name (only used when FlatMeshData has groups). */
    groupColors?: Record<string, string>;
    /** When true, this object is excluded from mesh export (e.g. toMeshData). */
    noExport?: boolean;
    /** Optional semantic layer/class name. Invisible in the 3D display but
     *  queryable for exports (DXF layers), selection, and filtering. */
    layer?: string;
    label?: string;
    labelColor?: string;
    /** Font-size multiplier for the label sprite (1 = default, 0.5 = half). */
    labelScale?: number;
    tubeRadius?: number;
    /** Print-layer striping (metres): tube meshes with pipe UVs get a repeating layer-line texture along
     *  their length, one stripe per this height — the stacked-bead look of 3D-printed metal. */
    printLayerH?: number;
    /** PBR metalness (studio lighting only): 0 = dielectric, 1 = metal. Default 0. */
    metalness?: number;
    /** PBR roughness (studio lighting only): 0 = mirror, 1 = diffuse. Default 0.65. */
    roughness?: number;
    /** Dashed line (segment / polyline / circle): world-unit dash + gap lengths.
     *  Renders via THREE.LineDashedMaterial (+ computeLineDistances). */
    dash?: {
        size: number;
        gap: number;
    };
}
interface SceneObject {
    id: string;
    type: SceneObjectType;
    style: VisualStyle;
    interactive: boolean;
    data: Record<string, any>;
    position?: Vec3;
    start?: Vec3;
    end?: Vec3;
    vertices?: Vec3[];
    center?: Vec3;
    radius?: number;
    normal?: Vec3;
    distance?: number;
    mesh?: Mesh;
    flatMeshData?: FlatMeshData;
    children?: string[];
    /** Optional transform applied on top of the baked geometry (interactive editing / gizmo drag). */
    transform?: SceneTransform;
    /** Pickable in the viewport (click → select). Default: true. */
    pickable?: boolean;
    /** Semantic pick tag surfaced in lab.onPick — select by meaning, not raw scene id. */
    pickTag?: string;
}
/** A renderer-applied transform on top of baked geometry. All fields optional. */
interface SceneTransform {
    position?: Vec3;
    /** Euler angles in radians (XYZ order). */
    rotation?: Vec3;
    scale?: Vec3;
}
/**
 * Flat mesh data for direct rendering (positions/normals/indices + optional
 * vertex colors). Extends the core render-mesh `MeshData` (inheriting
 * `positions`/`normals`/`indices`/`colors`/`uvs`) and adds named sub-groups.
 */
interface FlatMeshData extends MeshData$1 {
    colors?: Float32Array;
    /** Named sub-groups as contiguous index ranges (from OBJ `g` lines or manual splits). */
    groups?: {
        name: string;
        indexStart: number;
        indexCount: number;
    }[];
}
type SceneEvent = {
    type: "object:add";
    id: string;
} | {
    type: "object:remove";
    id: string;
} | {
    type: "object:update";
    id: string;
    changes: Partial<SceneObject>;
} | {
    type: "object:style";
    id: string;
    style: Partial<VisualStyle>;
} | {
    type: "selection:change";
    ids: string[];
} | {
    type: "hover:change";
    id: string | null;
} | {
    type: "scene:clear";
} | {
    type: "scene:renderMode";
    mode: RenderMode;
} | {
    type: "scene:lightingMode";
    mode: LightingMode;
} | {
    type: "scene:environment";
    enabled: boolean;
} | {
    type: "camera:change";
};
type SceneEventListener = (event: SceneEvent) => void;
declare class Scene {
    private objects;
    /** Per-scene, reset by clear(): see genId. */
    private idCounter;
    private listeners;
    private selectedIds;
    private hoveredId;
    private suspendDepth;
    renderMode: RenderMode;
    lightingMode: LightingMode;
    environmentEnabled: boolean;
    setRenderMode(mode: RenderMode): void;
    setLightingMode(mode: LightingMode): void;
    setEnvironment(enabled: boolean): void;
    on(listener: SceneEventListener): () => void;
    private emit;
    /**
     * Run a block of mutations without emitting events.
     * Use this from sync/CRDT consumers to apply remote mutations
     * without echoing them back into the broadcast layer.
     * Nested calls are allowed; events resume when the outermost block ends.
     */
    withSuspendedEvents<T>(fn: () => T): T;
    private add;
    get(id: string): SceneObject | undefined;
    has(id: string): boolean;
    all(): SceneObject[];
    count(): number;
    update(id: string, changes: Partial<SceneObject>): void;
    setStyle(id: string, style: Partial<VisualStyle>): void;
    remove(id: string): void;
    clear(): void;
    /**
     * Ids are per-scene and restart at clear(), so a sketch that declares the
     * same objects in the same order gets the SAME ids on every run. That is what
     * lets a selection (highlight + transform gizmo) survive a re-run.
     *
     * The stability is POSITIONAL: ids follow declaration order, so a run that
     * adds, removes or reorders an object shifts every id after it — a selection
     * can then land on the neighbour. Sketches that need a selection to hold
     * across such a change should declare their objects unconditionally (and
     * vary style instead), or track their own keys.
     *
     * Ids stay unique within a scene; they are NOT unique across scenes or across
     * clears, so don't store them outside the scene's lifetime.
     */
    private genId;
    addPoint(position: Vec3, style?: Partial<VisualStyle>, data?: Record<string, any>): SceneObject;
    addPoints(positions: Vec3[], style?: Partial<VisualStyle>): SceneObject[];
    addSegment(start: Vec3, end: Vec3, style?: Partial<VisualStyle>): SceneObject;
    addPolygon(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject;
    /** Batched polyline — renders as a single buffered Three.js Line, not one
     *  object per segment. Use for streamlines, hatches, sketched curves, etc.
     *  where N can be in the thousands. */
    addPolyline(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject;
    addMesh(mesh: Mesh, style?: Partial<VisualStyle>): SceneObject;
    addFlatMesh(data: FlatMeshData, style?: Partial<VisualStyle>): SceneObject;
    addCircle(center: Vec3, radius: number, style?: Partial<VisualStyle>): SceneObject;
    addPlane(normal: Vec3, distance: number, style?: Partial<VisualStyle>): SceneObject;
    select(id: string): void;
    deselect(id: string): void;
    toggleSelect(id: string): void;
    clearSelection(): void;
    getSelection(): string[];
    isSelected(id: string): boolean;
    setHover(id: string | null): void;
    getHover(): string | null;
    byType(type: SceneObjectType): SceneObject[];
    /** Merges all visible mesh geometry into a single MeshData for OBJ export. */
    toMeshData(): MeshData;
    /** Generate a cylinder tube mesh between two points. */
    private static _addTubeMesh;
    toJSON(): SceneJSON;
    static fromJSON(json: SceneJSON): Scene;
}
interface SceneJSON {
    objects: any[];
}

/**
 * Tekto Parameter System
 *
 * Declare parameters, get reactive values + auto-generated UI.
 *
 * Usage:
 *   const params = createParams({
 *     radius: { type: "float", min: 0.1, max: 5, default: 1, step: 0.1, label: "Radius" },
 *     segments: { type: "int", min: 3, max: 64, default: 16, label: "Segments" },
 *     algorithm: { type: "select", options: ["delaunay", "greedy"], default: "delaunay" },
 *     wireframe: { type: "bool", default: false },
 *     color: { type: "color", default: "#6ee7b7" },
 *     name: { type: "string", default: "Mesh 1" },
 *   });
 *
 *   params.get("radius")       // 1
 *   params.set("radius", 2.5)  // triggers listeners
 *   params.onChange((key, value) => rebuild())
 */
interface FloatParam {
    type: "float";
    min: number;
    max: number;
    default: number;
    step?: number;
    label?: string;
}
interface IntParam {
    type: "int";
    min: number;
    max: number;
    default: number;
    step?: number;
    label?: string;
}
interface BoolParam {
    type: "bool";
    default: boolean;
    label?: string;
}
interface SelectParam {
    type: "select";
    options: readonly string[];
    default: string;
    label?: string;
}
interface ColorParam {
    type: "color";
    default: string;
    label?: string;
}
interface StringParam {
    type: "string";
    default: string;
    label?: string;
    placeholder?: string;
}
interface Vec3Param {
    type: "vec3";
    default: [number, number, number];
    min?: [number, number, number];
    max?: [number, number, number];
    step?: number;
    label?: string;
}
interface ButtonParam {
    type: "button";
    label?: string;
    action: () => void;
}
type ParamDef = (FloatParam | IntParam | BoolParam | SelectParam | ColorParam | StringParam | Vec3Param | ButtonParam) & {
    /** Display-only param: `appShell` routes its changes to `onDisplay`
     *  (restyle existing objects) instead of `onBuild` (regenerate geometry). */
    display?: boolean;
};
type ParamSchema = Record<string, ParamDef>;
type ParamChangeListener = (key: string, value: any, allValues: Record<string, any>) => void;
declare class ParamStore<S extends ParamSchema = ParamSchema> {
    private schema;
    private values;
    private listeners;
    private keyListeners;
    constructor(schema: S);
    get<K extends keyof S>(key: K): any;
    set<K extends keyof S>(key: K, value: any): void;
    /**
     * Dynamically add (or refresh) a parameter definition. Used by the sketch
     * APIs, whose immediate-mode `lab.slider(...)` calls declare params during
     * the sketch run. Initializes the value from `default` the first time;
     * an existing value is preserved so re-defining across re-runs is cheap.
     * Does NOT notify listeners (definition is structure, not a value change).
     */
    define(key: string, def: ParamDef): void;
    /** Remove a parameter (and its value). Does not notify listeners. */
    remove(key: string): void;
    has(key: string): boolean;
    keys(): string[];
    /** Get all current values */
    getAll(): Record<string, any>;
    /** Get the schema for a specific key */
    getDef<K extends keyof S>(key: K): S[K];
    /** Get entire schema */
    getSchema(): S;
    /** Listen to all changes */
    onChange(listener: ParamChangeListener): () => void;
    /** Listen to a specific key */
    onKey(key: string, listener: (value: any) => void): () => void;
    /** Reset all to defaults */
    reset(): void;
    /** Serialization */
    toJSON(): Record<string, any>;
    loadJSON(json: Record<string, any>): void;
}
/** Convenience factory */
declare function createParams<S extends ParamSchema>(schema: S): ParamStore<S>;
interface ParamFolder {
    label: string;
    open?: boolean;
    params: string[];
}
interface ParamLayout {
    folders: ParamFolder[];
}
/** Create a layout that groups params into collapsible folders */
declare function createLayout(folders: ParamFolder[]): ParamLayout;

export { AABB as A, type BoolParam as B, type ColorParam as C, createParams as D, type FlatMeshData as F, type IntParam as I, type LightingMode as L, Mat4 as M, ObjFile as O, ParamStore as P, type RenderMode as R, Scene as S, Triangle as T, Vec3 as V, Vec2 as a, Mesh as b, type MeshData$1 as c, type VisualStyle as d, type ParamSchema as e, type ButtonParam as f, type FloatParam as g, type LegacyMeshJSON as h, type MeshEdge as i, type MeshFace as j, type MeshJSON as k, type MeshNode as l, type MeshData as m, type ParamDef as n, type ParamFolder as o, type ParamLayout as p, type SceneEvent as q, type SceneEventListener as r, type SceneJSON as s, type SceneObject as t, type SceneObjectType as u, type SelectParam as v, type StringParam as w, type Vec3Param as x, Vec4 as y, createLayout as z };
