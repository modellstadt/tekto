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
 * Tekto ConnectedMesh — Topological mesh with adjacency queries.
 *
 * A flexible mesh data structure with:
 *   - Nodes (vertices) with edge adjacency lists
 *   - Edges with face adjacency
 *   - Faces with ordered node/edge references
 *
 * Mirrors HDGEO.Core.ConnectedMesh.
 */

interface MeshNode {
    id: number;
    position: Vec3;
    edges: number[];
    faces: number[];
    normal?: Vec3;
    data: Record<string, any>;
}
interface MeshEdge {
    id: number;
    nodes: [number, number];
    faces: number[];
    data: Record<string, any>;
}
interface MeshFace {
    id: number;
    nodes: number[];
    edges: number[];
    normal?: Vec3;
    data: Record<string, any>;
}
declare class ConnectedMesh {
    private _nodes;
    private _edges;
    private _faces;
    private _nextNodeId;
    private _nextEdgeId;
    private _nextFaceId;
    private _bounds;
    get nodeCount(): number;
    get edgeCount(): number;
    get faceCount(): number;
    node(id: number): MeshNode | undefined;
    edge(id: number): MeshEdge | undefined;
    face(id: number): MeshFace | undefined;
    nodes(): IterableIterator<MeshNode>;
    edges(): IterableIterator<MeshEdge>;
    faces(): IterableIterator<MeshFace>;
    nodesArray(): MeshNode[];
    edgesArray(): MeshEdge[];
    facesArray(): MeshFace[];
    addNode(position: Vec3, data?: Record<string, any>): number;
    addNodes(positions: Vec3[]): number[];
    addEdge(nodeA: number, nodeB: number, data?: Record<string, any>): number;
    addFace(nodeIds: number[], data?: Record<string, any>): number;
    addTriangle(a: number, b: number, c: number, data?: Record<string, any>): number;
    addQuad(a: number, b: number, c: number, d: number, data?: Record<string, any>): number;
    removeNode(id: number): void;
    removeEdge(id: number): void;
    removeFace(id: number): void;
    clear(): void;
    findEdge(nodeA: number, nodeB: number): number | undefined;
    nodeNeighbors(nodeId: number): number[];
    edgeFaces(edgeId: number): MeshFace[];
    isBoundaryEdge(edgeId: number): boolean;
    isBoundaryNode(nodeId: number): boolean;
    boundaryEdges(): MeshEdge[];
    edgeOtherNode(edgeId: number, nodeId: number): number;
    bounds(): AABB;
    faceTriangle(faceId: number): Triangle | null;
    computeFaceNormals(): void;
    computeVertexNormals(): void;
    splitEdge(edgeId: number, t?: number): number;
    collapseEdge(edgeId: number): number;
    static fromIndexedTriangles(positions: Vec3[], indices: number[], data?: Record<string, any>[]): ConnectedMesh;
    static fromFaces(positions: Vec3[], faces: number[][]): ConnectedMesh;
    toIndexedTriangles(): {
        positions: Float32Array;
        indices: Uint32Array;
        normals: Float32Array;
    };
    toJSON(): MeshJSON$1;
    static fromJSON(json: MeshJSON$1): ConnectedMesh;
    clone(): ConnectedMesh;
}

interface MeshJSON$1 {
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
}

/**
 * Tekto Mesh — High-performance flat mesh using typed arrays.
 *
 * Designed for rendering, animation, GPU upload, and large meshes.
 * All faces are triangles. Adjacency is computed lazily.
 *
 * Mirrors HDGEO.Core.Mesh (the flat render mesh).
 */

interface MeshData$1 {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
    uvs?: Float32Array;
    colors?: Float32Array;
}
interface MeshJSON {
    positions: number[];
    indices: number[];
    normals?: number[];
    uvs?: number[];
}
/** Lazy-built adjacency data */
interface AdjacencyData {
    neighbors: Uint32Array[];
    edges: Uint32Array;
    vertexTriangles: Uint32Array[];
    edgeTriangles: Map<string, number[]>;
    boundary: Uint8Array;
}
declare class Mesh {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
    uvs: Float32Array | null;
    colors: Float32Array | null;
    private _adjacency;
    private _bounds;
    constructor(positions: Float32Array, indices: Uint32Array, normals?: Float32Array, uvs?: Float32Array, colors?: Float32Array);
    get vertexCount(): number;
    get triangleCount(): number;
    get edgeCount(): number;
    getPosition(i: number): Vec3;
    setPosition(i: number, p: Vec3): void;
    getNormal(i: number): Vec3;
    getTriangle(triIdx: number): [number, number, number];
    getTrianglePositions(triIdx: number): [Vec3, Vec3, Vec3];
    computeNormals(): void;
    get adjacency(): AdjacencyData;
    invalidateAdjacency(): void;
    private _buildAdjacency;
    neighbors(i: number): Uint32Array;
    isBoundary(i: number): boolean;
    bounds(): AABB;
    volume(): number;
    surfaceArea(): number;
    centroid(): Vec3;
    eulerCharacteristic(): number;
    smooth(iterations?: number, factor?: number): void;
    translate(dx: number, dy: number, dz: number): void;
    scale(s: number): void;
    scaleXYZ(sx: number, sy: number, sz: number): void;
    mapPositions(fn: (x: number, y: number, z: number, index: number) => [number, number, number]): void;
    merge(other: Mesh): Mesh;
    clone(): Mesh;
    toJSON(): MeshJSON;
    static fromJSON(json: MeshJSON): Mesh;
    static fromConnectedMesh(mesh: ConnectedMesh): Mesh;
    toConnectedMesh(): ConnectedMesh;
    static fromArrays(positions: Float32Array | number[], indices: Uint32Array | number[], normals?: Float32Array | number[]): Mesh;
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
    tubeRadius?: number;
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
    mesh?: ConnectedMesh;
    flatMeshData?: FlatMeshData;
    children?: string[];
    /** Optional transform applied on top of the baked geometry (interactive editing / gizmo drag). */
    transform?: SceneTransform;
    /** Pickable in the viewport (click → select). Default: true. */
    pickable?: boolean;
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
    type: "camera:change";
};
type SceneEventListener = (event: SceneEvent) => void;
declare class Scene {
    private objects;
    private listeners;
    private selectedIds;
    private hoveredId;
    private suspendDepth;
    renderMode: RenderMode;
    lightingMode: LightingMode;
    setRenderMode(mode: RenderMode): void;
    setLightingMode(mode: LightingMode): void;
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
    addPoint(position: Vec3, style?: Partial<VisualStyle>, data?: Record<string, any>): SceneObject;
    addPoints(positions: Vec3[], style?: Partial<VisualStyle>): SceneObject[];
    addSegment(start: Vec3, end: Vec3, style?: Partial<VisualStyle>): SceneObject;
    addPolygon(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject;
    /** Batched polyline — renders as a single buffered Three.js Line, not one
     *  object per segment. Use for streamlines, hatches, sketched curves, etc.
     *  where N can be in the thousands. */
    addPolyline(vertices: Vec3[], style?: Partial<VisualStyle>): SceneObject;
    addMesh(mesh: ConnectedMesh, style?: Partial<VisualStyle>): SceneObject;
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
    options: string[];
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
type ParamDef = FloatParam | IntParam | BoolParam | SelectParam | ColorParam | StringParam | Vec3Param | ButtonParam;
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

export { AABB as A, type BoolParam as B, ConnectedMesh as C, createLayout as D, createParams as E, type FlatMeshData as F, type IntParam as I, type LightingMode as L, Mat4 as M, ObjFile as O, type ParamDef as P, type RenderMode as R, Scene as S, Triangle as T, Vec3 as V, Vec2 as a, Mesh as b, type MeshData$1 as c, type VisualStyle as d, type ButtonParam as e, type ColorParam as f, type MeshJSON as g, type FloatParam as h, type MeshEdge as i, type MeshFace as j, type MeshJSON$1 as k, type MeshNode as l, type MeshData as m, type ParamFolder as n, type ParamLayout as o, type ParamSchema as p, ParamStore as q, type SceneEvent as r, type SceneEventListener as s, type SceneJSON as t, type SceneObject as u, type SceneObjectType as v, type SelectParam as w, type StringParam as x, type Vec3Param as y, Vec4 as z };
