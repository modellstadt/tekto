import { b as SectionRequest, q as StandardView, S as Scene, V as Vec3 } from './Scene-BHniJuab.mjs';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { D as Doc } from './Doc-QTiSEVwH.mjs';

/**
 * Tekto GUI theme — the single source of panel chrome colors.
 *
 * Every tekto panel (sketch, sketch2d, appShell, LayerPanel, ControlPanel)
 * derives its colors from here instead of re-declaring hex literals inline.
 *
 * Chrome is WHITE on the dark background by design: white slider accents and
 * value labels, white toggle tracks, plain white titles — no colored accents
 * in panel chrome. (Content colors — e.g. a colorPicker's default value — are
 * the sketch's business, not the theme's.)
 */
/** The colours of tekto's panel chrome (white on dark by default), from `getTheme`; every panel reads them instead of its own hex literals. */
interface Theme {
    isDark: boolean;
    /** App background behind the viewport */
    bg: string;
    /** Panel / header background */
    panelBg: string;
    /** Elevated surface (dropdowns, popovers) */
    popupBg: string;
    /** Hairline borders between panel sections */
    border: string;
    /** Borders on individual controls (inputs, selects, buttons) */
    controlBorder: string;
    /** Primary text */
    text: string;
    /** Secondary text (control labels) */
    textDim: string;
    /** Tertiary text (group headers, disabled) */
    textFaint: string;
    /** Chrome accent — white on dark, near-black on light */
    accent: string;
    /** Hover wash for rows / buttons */
    hoverBg: string;
    /** Input field background (selects, text inputs) */
    fieldBg: string;
    /** Panel font stack */
    font: string;
}
/** The panel chrome colours for dark (default, white-on-dark) or light mode. */
declare function getTheme(mode?: "dark" | "light"): Theme;

/** What the host wants said about one thing in the scene. */
interface CalloutItem {
    id: string;
    /** the line that is read. Keep it short: this is a margin, not a panel. */
    text: string;
    /** a quieter second line, for a grade or a count */
    detail?: string;
    /** a swatch, so a callout and the element it points at agree by colour */
    colour?: string;
    /** What it points at: scene object ids, or record keys (`"walls/w1"`, which follow their
     *  record through rebuilds). The anchor is the centre of their combined bounds. */
    objects: readonly string[];
}
/** One label, placed. Pixel coordinates within the host. */
interface Placement {
    id: string;
    side: "left" | "right";
    /** where the label's own box sits */
    x: number;
    y: number;
    /** where its leader ends */
    anchorX: number;
    anchorY: number;
}
/**
 * How wide a label may be in a host of this width.
 *
 * Fixed at 150 px this was fine in a full-window viewport and useless in a
 * panel: two 150 px margins in a 374 px column leave 74 px of drawing, so the
 * annotation covered the thing it annotated. A share of the width instead,
 * floored at something a product code still fits in and capped so a wide
 * viewport does not grow billboards.
 */
declare function labelWidthFor(hostWidth: number): number;
/** Options for `layoutLabels`: the host size in pixels, and optionally the row pitch, label width and edge inset. */
interface LayoutOptions {
    width: number;
    height: number;
    /** vertical pitch between labels, which is a label's height plus its gap */
    rowHeight?: number;
    /** how wide a label is allowed to be */
    labelWidth?: number;
    /** clearance from the host's edges */
    inset?: number;
}
/** What a layout could place, and what it could not. */
interface Layout {
    placed: Placement[];
    /**
     * Ids there was no room for, in the order they were given.
     *
     * Reported rather than clipped. A margin holds a fixed number of rows, and
     * the first version of this let the surplus run off the bottom edge into an
     * `overflow: hidden`, so eleven of thirty labels simply were not there and
     * nothing said so. A reader counting labelled elements would have counted
     * wrong. The caller is expected to say how many are missing.
     */
    dropped: string[];
}
/**
 * Stack labels into the left and right margins without overlapping.
 *
 * Each label wants to sit level with its own anchor and is pushed down until
 * it clears the one above; if that runs the column off the bottom, the whole
 * column is lifted back inside. Labels keep the vertical order of their
 * anchors, which is what makes the leaders readable: leaders that cross each
 * other are worse than no leaders, because the reader follows the wrong one
 * and believes the answer.
 *
 * Anchors on the left half of the screen get the left margin. Not because the
 * side matters, but because a leader that crosses the whole drawing to reach
 * the far margin passes over everything in between.
 *
 * More labels than rows is resolved by *input order*, which is the caller's
 * priority, and never by compressing the pitch: labels printed on top of each
 * other are not more information, they are less.
 */
declare function layoutLabels(anchors: {
    id: string;
    x: number;
    y: number;
}[], opts: LayoutOptions): Layout;
/**
 * The DOM layer: labels, leaders, and clicks.
 *
 * Knows nothing about cameras or meshes. It is handed placements in pixels and
 * renders them, which is what keeps the layout rule above testable.
 */
declare class Callouts {
    private opts;
    private root;
    private svg;
    private labels;
    private items;
    private overflow;
    private labelWidth;
    constructor(host: HTMLElement, opts?: {
        labelWidth?: number;
        onPick?: (id: string) => void;
        onHover?: (id: string | null) => void;
    });
    /** What there is to say. Placements arrive separately, each frame. */
    setItems(items: CalloutItem[]): void;
    /** Track the host's width, so labels stay a share of it rather than a
     *  constant that only suits one panel size. */
    setLabelWidth(px: number): void;
    /** The objects a caller must measure to anchor each callout. */
    objectsOf(id: string): readonly string[];
    get ids(): string[];
    /**
     * Draw this frame's placements. Anything not placed is hidden, not removed:
     * an element that comes back into view keeps its element rather than
     * flickering a new one in.
     *
     * `unplaced` is how many the margins had no room for, and it is shown. A
     * reader who can see fifteen labels and is not told there were twenty-two
     * has been given a wrong count, quietly, which is the failure this whole
     * project is arranged against. `upTo`: some of them were never looked at
     * (the margins were full), so it is how many there could be: "up to n".
     */
    update(placements: Placement[], unplaced?: number, upTo?: boolean): void;
    private showOverflow;
    private make;
    setVisible(on: boolean): void;
    dispose(): void;
}

/**
 * The rules a 3D view draws by — what each render mode paints, where a named view puts the
 * camera, how far back to sit to fit, where a section cuts — as plain functions, so they
 * can be tested without a GPU. `ThreeRenderer` draws by them.
 */

/**
 * How the content is drawn. Not decoration: each answers a different question.
 *  shaded      what is it made of
 *  ghost       where does this part sit in the whole, everything else stepped
 *              back so the selection reads through the fabric
 *  hidden-line the drawing convention: white surfaces, dark creases, occluded
 *              lines hidden by the surfaces in front of them
 */
type ViewMode = "shaded" | "ghost" | "hidden-line";
/** How one mesh is painted. Colours are hex integers, as three.js takes them. */
interface Appearance {
    colour: number;
    opacity: number;
    depthWrite: boolean;
    polygonOffset: boolean;
}
/** The page shaded and hidden-line are drawn on, when the host names none. */
declare const DEFAULT_BACKGROUND = 16119802;
/** Crease colour and weight for a mode. Hidden line draws them at full strength
 *  because in that mode the lines are the drawing. `background` (default: the dark ground
 *  ghost brings with it) turns ghost's pale creases dark on a light page. */
declare function edgeStyle(mode: ViewMode, background?: THREE.ColorRepresentation): {
    colour: number;
    opacity: number;
};
/**
 * The page a mode is drawn on.
 *
 * Ghost inverts: pale edges over a dark ground read where dark edges over a
 * pale one wash out, and a translucent surface adds light instead of
 * subtracting it, so the parts stack up legibly instead of greying together.
 * The other two keep the host's own background.
 */
declare function modeBackground(mode: ViewMode, base: number): number;
/**
 * How a cut face is drawn.
 *
 * Poché: solid and dark, and flat rather than lit. A section is a drawing
 * convention before it is a picture, and the convention is that cut material
 * reads as one mass so the eye separates what was sliced from what is merely
 * seen beyond it. Shading the cut instead, which is what a lit material does,
 * gives it highlights and gradients and it stops reading as a cut at all: it
 * becomes another grey surface among the grey surfaces behind it.
 *
 * Ghost inverts, as it does everywhere else here. On its dark ground a black
 * poché would be a hole rather than a solid, so the cut goes pale and the
 * relationship survives.
 */
declare function sectionAppearance(mode: ViewMode): {
    colour: number;
};
/**
 * The visible plane the content stands on.
 *
 * Independent of whether the sun is casting: a building floating in a void
 * with a smudge under it reads as floating, and the smudge alone was doing all
 * the work of saying which way is down. Hidden in hidden line, where a grey
 * plate is not what a drawing is. The tone is a step off the background rather
 * than a colour of its own, so it reads as ground and not as a surface
 * somebody modelled.
 */
declare function groundAppearance(mode: ViewMode): {
    visible: boolean;
    colour: number;
    opacity: number;
};
/** How a mode paints a surface whose own colour is `base`. */
declare function surfaceAppearance(mode: ViewMode, base: number): Appearance;
/**
 * Sun and sky intensity for a mode.
 *
 * Ghost is transparent throughout and a shadow cast by something you can see
 * through reads as dirt on the drawing, so it never casts. With the sun doing
 * the work the sky has to step back, or the shadows wash out.
 */
declare function lightBalance(mode: ViewMode, shadows: boolean): {
    shadowed: boolean;
    sun: number;
    sky: number;
    groundOpacity: number;
};
/**
 * Where the camera sits for a named view, as three.js spherical angles: phi
 * from +Y, theta around Y from +Z towards +X.
 */
declare function standardOrbit(view: StandardView): {
    phi: number;
    theta: number;
};
/**
 * Where the camera sits to look down `direction`, which points from the subject
 * towards the camera. The inverse of what the tick loop does with a spherical.
 *
 * Clamped off the poles like the named views, so clicking the gizmo's Y ball
 * lands on the same well-defined orientation that `setView("top")` does rather
 * than on a plan whose north is whatever floating point decided.
 */
declare function orbitFor(direction: {
    x: number;
    y: number;
    z: number;
}): {
    phi: number;
    theta: number;
};
/**
 * The end angle to interpolate towards so a turn takes the short way round.
 *
 * Without this, orbiting from theta 3.0 to -3.0 (a tenth of a turn apart on the
 * screen) spins the building almost the whole way about instead, which reads as
 * the viewport having lost its place rather than as a view change.
 */
declare function shortestTurn(from: number, to: number): number;
/**
 * Whichever of the six axis directions a view is already closest to. What a
 * double click on the gizmo snaps to: the reader is nearly at an elevation and
 * wants to be exactly at one, without having to work out which.
 */
declare function nearestAxis(direction: {
    x: number;
    y: number;
    z: number;
}): THREE.Vector3;
/**
 * The clipping plane for a section, in the frame `axisWorld` was given in (the content's
 * axis turned into the scene's). Three.js keeps what lies on the plane's positive side, so
 * the plane faces back down the axis: everything below the cut stays, or above with `flip`.
 * Null when the cut is a fraction (`at`) and there is no content to measure.
 */
declare function sectionPlane(req: SectionRequest, axisWorld: THREE.Vector3, box: THREE.Box3 | null): THREE.Plane | null;
/** A named sun for the shading bar: where it stands, as azimuth (degrees clockwise from
 *  north) and altitude (degrees above the horizon). */
type SunPreset = "morning" | "noon" | "sunset";
/** Smoothstep. A camera that starts and stops abruptly reads as a cut, and a
 *  cut is exactly what an animated view change exists to avoid. */
declare function easeInOut(t: number): number;
/**
 * How far back to sit so a sphere of `boundingRadius` fits, on the tighter of
 * the two field-of-view axes. A portrait panel clips a wide building on the
 * horizontal, which is exactly the case a vertical-only fit gets wrong.
 */
declare function fitRadius(boundingRadius: number, fovDeg: number, aspect: number, margin?: number): number;
/**
 * The orthographic frustum that frames what a perspective camera would see at
 * the same distance, so switching projection changes the drawing convention
 * and not the subject.
 */
declare function orthoFrustum(distance: number, fovDeg: number, aspect: number): {
    left: number;
    right: number;
    top: number;
    bottom: number;
};

/**
 * What a pointer does in a ThreeRenderer's viewport: picking (a click, the object under a
 * point, the ground under a point), hover, drag handles, and the transform gizmo that moves
 * an object and writes its transform back to the Scene.
 */

type GizmoMode = "translate" | "rotate" | "scale" | "none";
/** Modifier keys held during a pick (a click on the viewport). */
interface PickInfo {
    shiftKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
}

/**
 * Ambient occlusion over a ThreeRenderer's frame, with three's GTAO: darkening where
 * surfaces meet and close in (corners, reveals, under decks and steps). The frame is drawn
 * as the renderer draws it, its tone mapping, background, grid, antialiasing and section as
 * they are, and the occlusion is then computed and multiplied over it; running the frame
 * through an EffectComposer instead tone-maps the background and hides the grid. It follows
 * the section, and the orthographic (drawing) views and the modes other than solid go
 * without. Built on first use.
 */

/** How far occlusion reaches (m) and how dark it gets (0..1). */
interface AmbientOcclusionOptions {
    radius?: number;
    intensity?: number;
}

/** Corner of the view the bar sits in. */
type ShadingBarCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Tekto Three.js Renderer — the one 3D renderer under `sketch()` and `appShell()`.
 *
 * Keeps a three.js scene in step with a tekto `Scene` (objects added, restyled, rebuilt,
 * removed as scene events arrive) and draws it on demand. The work is split into parts that
 * share a `RendererCore`; this class owns the scene sync and the draw loop, and its public
 * methods are the API apps use:
 *
 *   ObjectBuilder  scene objects → three.js objects, per lighting and render mode
 *   Lighting       Flat / Studio, the sun framed to the content, environment, fog
 *   CameraRig      perspective / orthographic, named views, fitTo, the axis widget
 *   Pointer        picking, hover, drag handles, the transform gizmo
 *   Marks          selection (tint or outline), section cuts, callouts
 */

/** Construction options of a `ThreeRenderer` — background, grid and axes, orbit controls, initial camera, up axis, axis widget; pass any subset (default Y-up, no widget). */
interface ThreeRendererConfig {
    antialias: boolean;
    backgroundColor: number;
    showGrid: boolean;
    /**
     * How the grid is drawn: `"lines"`, a fixed `gridSize` grid of `gridDivisions` lines;
     * `"fading"`, the ground ruled in round metres for the size of the content (1 m under a
     * house, 10 m under a block, every fifth line stronger) that fades out with distance, so
     * it gives a sense of scale and has no edge. It follows the content. Default `"lines"`.
     */
    gridStyle: "lines" | "fading";
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
    /** The axis widget in a corner (`true` = bottom right): click an axis for a plan or an
     *  elevation, drag it to orbit, double-click to square up, toggle persp/ortho under it. */
    navGizmo: boolean | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** The shading bar in a corner of the view (`true` = top left): minimal icons for the
     *  render style, the lighting and the sun (morning, noon, sunset), as Blender has in its
     *  viewport header. The renderer draws it, so an app only switches it on. */
    shadingBar: boolean | ShadingBarCorner;
    /**
     * The scene's unit, as a label (`"m"`, `"mm"`, `"ft"`): readouts such as the shading bar's
     * section show coordinates in it, and a cut stays at its coordinate. Unset (null, the
     * default): readouts are relative to the content's extent (`35 %`), and a cut stays at its
     * share of the content as the content changes. An app that knows its units says so.
     */
    units: string | null;
}
/**
 * The one 3D renderer under `sketch()` and `appShell()`: keeps a three.js scene in step with a tekto `Scene` and draws it on demand.
 * The work is split into parts (ObjectBuilder, Lighting, CameraRig, Pointer, Marks — see the file header); this class owns the scene sync and the draw loop, and its methods are the app API.
 * Drive it with `renderIfNeeded()` each animation frame, or `startLoop()`.
 */
declare class ThreeRenderer {
    readonly threeScene: THREE.Scene;
    readonly camera: THREE.PerspectiveCamera;
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
    private _needsRender;
    private hideHelpers;
    private gridHelper;
    private fadingGrid;
    private shadingBar;
    private overlayState;
    private overlayExtra;
    private ao;
    private gridDirty;
    private axesHelper;
    private externalObjects;
    private container;
    private resizeObserver;
    private core;
    private lighting;
    private builder;
    private marks;
    private rig;
    private pointer;
    constructor(gScene: Scene, container: HTMLElement, config?: Partial<ThreeRendererConfig>);
    private handleEvent;
    private addToThree;
    /** Apply a style patch to the existing three object if it only touches colour,
     *  opacity, visibility or inert keys. False → the caller rebuilds the object. */
    private _restyleInPlace;
    /** Set colour + opacity on a single-material object exactly as convert() would build
     *  it: lines (segment, polyline, circle), tube segments and unlabelled points. Meshes,
     *  polygons, planes and labelled points have mode- or label-dependent materials → false. */
    private _repaint;
    /** Apply `obj.transform` (position/rotation/scale) to a Three.Object3D. */
    private applyTransform;
    private removeFromThree;
    private clearThree;
    /** Rebuild all mesh objects (called when render mode changes). */
    private rebuildAllMeshes;
    private _isHelper;
    /**
     * Add a raw THREE.Object3D (e.g. a loaded glTF/GLB scene) to the renderer,
     * persisting across sketch re-runs. Re-adding the same id replaces it.
     * Meshes are flagged to cast + receive shadows (visible in Studio lighting).
     */
    addExternalObject(obj: THREE.Object3D, id: string): void;
    removeExternalObject(id: string): void;
    /**
     * Show/hide line + point "helper" objects (axes, construction lines, markers,
     * labels). Solid meshes are unaffected. Applies immediately to existing
     * objects and to all future ones until changed.
     */
    setHelpersVisible(visible: boolean): void;
    /**
     * What is drawn over the model besides it, each on or off: `grid`, `axes`, `wireframe`
     * (the faint triangles on solid surfaces), `labels` (callouts), and any overlay an app
     * registered (`registerOverlay`; a notes layer registers "notes"). The shading bar's
     * overlays popover lists them. An unknown name fails loudly.
     */
    setOverlays(overlays: Record<string, boolean>): void;
    /** The overlays there are and whether each is on (see `setOverlays`). */
    get overlays(): Record<string, boolean>;
    /**
     * Add an overlay of the app's own to `overlays` and the shading bar's popover: `apply(on)`
     * shows or hides it. Returns the unregister.
     */
    registerOverlay(name: string, apply: (on: boolean) => void, on?: boolean): () => void;
    /** Frame the selection (the highlighted objects), or everything when nothing is selected:
     *  Blender's Frame Selected / Home. Animated. */
    frame(): void;
    /** Save the view as a PNG, as a person sees it (with notes and drawings over it), named
     *  `fileName` with a date-time stamp. */
    saveSnapshot(fileName?: string): void;
    getThreeObject(id: string): THREE.Object3D | undefined;
    /** World-space bounds of a scene object as currently rendered, or null if empty/unknown. */
    objectBounds(id: string): {
        min: Vec3;
        max: Vec3;
    } | null;
    /** Is the scene object currently shown (its own style and every parent)? */
    isObjectShown(id: string): boolean;
    /** Render now and read the canvas back as a PNG data URL. Must stay synchronous: without
     *  `preserveDrawingBuffer` the buffer is only readable in the same task as the draw. */
    snapshotPng(): string;
    /** Bounds of what the scene shows. */
    private contentBox;
    /** Draw now, unconditionally. */
    render(): void;
    private _draw;
    private drawListeners;
    /**
     * Run `cb` after every frame is drawn, for an overlay that follows the camera (notes,
     * labels of your own): the camera and the view are current then. Returns the unsubscribe.
     */
    onDraw(cb: () => void): () => void;
    /**
     * Ask for a draw on the next `renderIfNeeded()`. Scene events, the camera API,
     * lights, drag handles, the gizmo, orbit controls and resizes already ask; call
     * it after changing three.js objects directly (e.g. one added with
     * `addExternalObject`).
     */
    requestRender(): void;
    /**
     * Draw only if something changed since the last draw, or while orbit damping
     * is still moving the camera. Returns whether it drew. An idle scene of 10k
     * objects otherwise costs a full draw on every animation frame.
     */
    renderIfNeeded(): boolean;
    startLoop(): () => void;
    resize(): void;
    /** Scene ids, or record keys resolved through the scene, to the three objects drawn for them. */
    private resolve;
    /** The WebGL canvas element (for attaching input listeners / overlays). */
    get canvasEl(): HTMLCanvasElement;
    /** Set the viewport background color. */
    setBackground(color: number | string): void;
    private disposeObject;
    dispose(): void;
    /**
     * Set the Studio-mode default PBR material applied to meshes that don't
     * carry their own metalness/roughness. Takes effect on the next material
     * build (e.g. the next sketch re-run). metalness/roughness in 0..1.
     */
    setStudioMaterial(metalness: number, roughness: number, color?: string | null, flatShading?: boolean): void;
    /**
     * Show/hide the studio shadow-catcher plane at the world origin. Hide it when
     * the app supplies its own ground mesh to receive shadows (avoids a duplicate
     * shadow at z=0).
     */
    setShadowGroundVisible(visible: boolean): void;
    /** Exponential distance fog tinted `color`; density 0 (or omitted) clears it. ~0.005–0.03 is a
     *  useful range at building scale. */
    setFog(color: string, density?: number): void;
    /** Tone-mapping exposure (1 = neutral; <1 darker, >1 brighter). */
    setExposure(v: number): void;
    /**
     * Light the model from `direction` (FROM the model TO the sun), in Z-up scene coords
     * (+X east, +Y north, +Z up) — the `SunPosition` convention; a Y-up scene is remapped.
     * In Studio the shadow camera is framed to whatever the scene shows, so a 1 m object
     * and a 100 m site both get sharp, complete shadows. `distance` is how far back the
     * light sits at least (m).
     */
    setSunDirection(direction: Vec3, distance?: number): void;
    /**
     * A named sun, as the shading bar's sun button sets it: `"morning"` (low in the east),
     * `"noon"` (high in the south) or `"sunset"` (just above the horizon in the west). It
     * switches to Studio and lets the light follow the sun (`setDaylight`), so a sunset is warm
     * with a dusk sky. Moving the sun any other way clears it (`sunPreset` is then null).
     */
    setSunPreset(name: SunPreset): void;
    /** The sun preset last set (`setSunPreset`), or null once the sun was moved another way. */
    get sunPreset(): SunPreset | null;
    /**
     * Let Studio's light follow the sun: with it on, the sun's colour and strength, the sky,
     * the exposure and the background come from the sun's altitude (`setSunDirection`, which
     * the shell's Sun popover drives by date and hour), so evening and dusk follow from the
     * hour: noon as Studio is, a warm low sun, a blue dusk, night. Flat lighting is unchanged.
     * Off by default.
     */
    setDaylight(on: boolean): void;
    /** Whether Studio's light follows the sun (`setDaylight`). */
    get daylight(): boolean;
    /** The sun's altitude above the ground, in degrees (from `setSunDirection`). */
    get sunAltitude(): number;
    /**
     * Ambient occlusion: darken where surfaces meet and close in (corners, reveals, under
     * decks and steps), with three's GTAO multiplied over the drawn frame, so tone mapping,
     * background, grid and the section stay as they are; it follows the section. Solid mode
     * in perspective only: hidden line stays black and white, and the orthographic drawing
     * views go without. `true`, `false`, or
     * `{ radius, intensity }`: how far it reaches (m, default 0.6) and how dark (0..1, 0.85).
     */
    setAmbientOcclusion(on: boolean | AmbientOcclusionOptions): void;
    /** Whether ambient occlusion is on. */
    get ambientOcclusion(): boolean;
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
    /**
     * A sky in one call: an equirectangular image (an .hdr from three's `HDRLoader`, or
     * `RGBELoader` before r180, or a plain panorama as an image or a canvas) lights the scene
     * (Studio's PBR materials) and, unless
     * `background: false`, shows behind it. In a Z-up scene it is stood upright (an equirect's
     * up is +Y). `intensity` (default 1) scales both: turn it down for an interior view, since
     * image-based light ignores walls. `null` takes it away and brings the plain background back.
     *
     *   renderer.setSky(await new HDRLoader().loadAsync("sky.hdr"));
     */
    setSky(sky: THREE.Texture | HTMLImageElement | HTMLCanvasElement | null, opts?: {
        background?: boolean;
        intensity?: number;
    }): void;
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
    /** Enable/disable orbit ROTATION (pan + zoom stay). Off → a strict-2D view. */
    setOrbitRotateEnabled(enabled: boolean): void;
    /** The camera as plain numbers, enough to reproduce the view. */
    cameraState(): {
        projection: "perspective" | "orthographic";
        position: number[];
        target: number[];
        up: number[];
        fov: number;
    };
    /**
     * Switch between perspective and orthographic projection.
     * Transfers the current camera position/orientation so the view is continuous.
     */
    setProjection(type: "perspective" | "orthographic"): void;
    /** Hear about projection changes from anywhere (the axis widget, a toolbar, code), so
     *  every control that shows the projection stays true. Returns the unsubscribe. */
    onProjection(listener: (projection: "perspective" | "orthographic") => void): () => void;
    /** "perspective" or "orthographic". */
    get projection(): "perspective" | "orthographic";
    /**
     * Look at the model from a named side, keeping the distance: `"top"` is a plan,
     * `"front"` / `"back"` / `"left"` / `"right"` are elevations, `"iso"` the diagonal. With
     * `setProjection("orthographic")` they are drawings rather than pictures. Turns there
     * (about a third of a second) unless `{ animate: false }`.
     */
    setView(view: StandardView, opts?: {
        animate?: boolean;
    }): void;
    /** Put the camera on `direction` from the target, looking back along it, at the same
     *  distance. What `setView` and the axis widget do. */
    orbitTo(direction: {
        x: number;
        y: number;
        z: number;
    }, opts?: {
        animate?: boolean;
    }): void;
    /**
     * Frame part of the model — a selection, a storey, one element: centre on it and come
     * close enough that it fills the view with room around it (`margin`, default 1.8, so the
     * surroundings still say which part it is). `objects` are scene ids or record keys.
     * Animated unless `{ animate: false }`, keeping the direction you look from.
     */
    fitTo(objects: readonly string[], opts?: {
        margin?: number;
        animate?: boolean;
    }): void;
    /**
     * Stand inside: the camera at `eye` (say, 1.6 m above a floor) looking at `target`, with a
     * wider lens (`fov`, default 75°), in perspective. Animated unless `{ animate: false }`.
     * The next `setView`, `orbitTo`, `fitTo` or `fitAll` gives the lens back and, for a view,
     * stands back to see the content again.
     */
    walkTo(eye: Vec3, target: Vec3, opts?: {
        fov?: number;
        animate?: boolean;
    }): void;
    /** Is the camera standing inside (after `walkTo`, until a view or a fit takes it out)? */
    get inside(): boolean;
    /**
     * Set the camera up vector. Use (0,1,0) for top-down plan views (Z-up scenes),
     * and restore (0,0,1) for side/elevation views.
     */
    setCameraUp(x: number, y: number, z: number): void;
    /** Move the camera without changing its target. */
    setCameraPosition(x: number, y: number, z: number): void;
    /** Aim the camera (and orbit-controls target) at a point. */
    lookAt(x: number, y: number, z: number): void;
    /**
     * Fit all visible scene objects inside the current view.
     * Preserves the camera direction; only adjusts distance and target.
     */
    fitAll(): void;
    /** Enable/disable click-to-pick on the canvas. */
    setPickEnabled(enabled: boolean): void;
    /** Subscribe to pick events. Returns unsubscribe. `id` is null when the user clicked background;
     *  `info` carries the modifier keys (Shift/⌘-click to add to a selection). */
    onPick(listener: (id: string | null, info: PickInfo) => void): () => void;
    /** Raycast at viewport coordinates and return the topmost pickable scene id (or null). */
    pickAt(clientX: number, clientY: number): string | null;
    /** Like `pickAt`, but also returns the world-space hit point, and skips hidden objects
     *  (the raycaster alone tests invisible ones too). Used by the markup overlay. */
    hitAt(clientX: number, clientY: number): {
        id: string;
        point: Vec3;
    } | null;
    /** Where a viewport ray meets the ground plane (z=0 for Z-up, y=0 otherwise), via the active camera. */
    groundAt(clientX: number, clientY: number): Vec3 | null;
    /** Pick scene objects under a screen coordinate */
    pick(screenX: number, screenY: number): {
        id: string;
        point: THREE.Vector3;
    } | null;
    /** Project a screen position onto a plane */
    screenToPlane(screenX: number, screenY: number, plane?: THREE.Plane): THREE.Vector3 | null;
    /**
     * Hear which object the pointer is over (null over nothing): reported only when it
     * changes, never while a button is held (an orbit), at most every 40 ms — so an app can
     * light what a click would select without a raycast per frame. Returns the unsubscribe.
     */
    onHover(listener: (id: string | null) => void): () => void;
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
    setGizmoMode(mode: GizmoMode): void;
    getGizmoMode(): GizmoMode;
    attachGizmo(id: string): void;
    detachGizmo(): void;
    /**
     * How `setSelectionHighlight` marks a selection: `"tint"` (default) lights it up in the
     * accent colour; `"outline"` draws its edges on top of everything instead and leaves its
     * fill alone — for apps whose colours mean something (a product, a state, a grade), and
     * so a selection behind other parts still shows.
     */
    setSelectionStyle(style: "tint" | "outline"): void;
    /** Highlight one object, several (a record's objects, a multi-selection), or none. */
    setSelectionHighlight(ids: string | readonly string[] | null): void;
    /** Outline what other people have selected, each set in its person's colour (see
     *  `shareSelection`); an empty list clears. Drawn on top, clipped by a section. */
    setPresenceHighlight(entries: readonly {
        ids: readonly string[];
        color: string;
    }[]): void;
    /**
     * Cut the model with a plane and fill the cut, so it reads as solid: `{ axis: "z",
     * coordinate: 1.2 }` is a plan cut at 1.2 m (what is above goes), `{ axis: "x", at: 0.5 }`
     * a section through the middle of the content, `flip` keeps the other side. Null clears.
     * Everything the scene draws is clipped (grid, axes, handles and the gizmo are not); a
     * click picks what is still there. The cut stays while the scene is rebuilt — a `sketch()`
     * re-run keeps it; `at` is measured against the content present when it is set.
     *
     * The cut face is the meshes' inside — their back faces, painted flat (poché) — not a
     * capped polygon, so it needs nothing of the geometry: no closed solids, no winding. Only
     * opaque surfaces get it: through a translucent one the inside would show uncut too.
     */
    setSection(section: SectionRequest | null): void;
    /**
     * The storeys, for the shading bar's section: a chip each that cuts its plan `cutHeight`
     * above its floor (default 1.2 m, where walls, doors and windows read), ticks on the plan
     * slider, and the slider snapping to them. Call it when the app knows its levels (after an
     * IFC loads, a storey is added); `[]` clears them. Elevations in the content's units.
     */
    setSectionLevels(levels: readonly {
        name: string;
        elevation: number;
    }[], opts?: {
        cutHeight?: number;
    }): void;
    /** The section in force, or null. */
    get section(): SectionRequest | null;
    /** Paint the cut this colour; null follows the render mode (dark, pale in ghost). */
    setSectionColour(colour: number | string | null): void;
    /**
     * Labels in the margins with leaders to what they name, the way a drawing is annotated:
     * they never overlap and don't swim as the model turns; a label whose thing is hidden
     * behind other things is left out; what doesn't fit is counted, not dropped silently.
     * `objects` are scene ids or record keys (a key follows its record through rebuilds).
     * Pass `[]` to clear. `onPick` / `onHover` hear clicks and hovers on the labels.
     */
    setCallouts(items: CalloutItem[], handlers?: {
        onPick?: (id: string) => void;
        onHover?: (id: string | null) => void;
    }): void;
    /** Crease lines still to be drawn (hidden line and ghost build them a frame at a time). */
    get pendingEdges(): number;
}

/**
 * The viewer toolbar, as a DOM element any app can mount: the controls appShell's top bar has.
 */

/** The viewer toolbar's controls; each is shown unless set to false. */
interface TopBarOptions {
    /** Flat / Studio lighting. */
    light?: boolean;
    /** Ambient occlusion on and off, beside the lighting (`renderer.setAmbientOcclusion`). */
    ao?: boolean;
    /** Solid / Wire / Hidden / Ghost. */
    mode?: boolean;
    /** Perspective / isometric. */
    camera?: boolean;
    /** A section through the model (`renderer.setSection`). */
    cut?: boolean;
    /** The sun for a place, date and hour, and Studio's light following it. */
    sun?: boolean;
}
/**
 * The viewer toolbar: lighting (Flat / Studio, ambient occlusion), render mode, camera
 * (Persp / Ortho, Iso), a section (Cut ▾) and the sun for a place, date and hour (Sun ▾,
 * with Studio's light following it). `appShell()` mounts it in its header; any app can
 * mount `el` anywhere (`tekto/react`'s `ViewerToolbar` does), so apps stop copying the bar.
 * Each control follows the state when it changes elsewhere. `dispose()` unhooks it.
 *
 *   const bar = viewerToolbar(scene, renderer, { cut: false });
 *   header.append(bar.el);
 */
declare function viewerToolbar(scene: Scene, renderer: ThreeRenderer, opts?: TopBarOptions & {
    theme?: Theme;
}): {
    el: HTMLElement;
    dispose(): void;
};

/**
 * Notes that live with the model. A sketched note is its strokes in world space, its text,
 * who wrote it and when, the records it is about and the view it was drawn from. It is kept
 * as a plain record in a `Doc` collection, so it is saved and opened with the document,
 * undone like any edit, and shared with everyone working on it.
 *
 * A `NotesLayer` draws the notes over the view from any camera: their strokes, and a numbered
 * pin each. A pin opens the note, with "Go to view" (the camera it was drawn from) and
 * "Delete". Markup's "Keep as notes" turns marks into notes (`markup(…, { notes })`,
 * `appShell({ notes: doc })`).
 *
 *   const notes = notesLayer(renderer, doc);              // the doc's "notes" collection
 *   markup(renderer, scene, { notes, author: "BD" });
 */

/** A note kept with the model. Plain JSON, so it lives in a `Doc` collection. */
interface Note {
    /** What it says. */
    text: string;
    /** Who wrote it. */
    author?: string;
    /** When, as an ISO date. */
    createdAt: string;
    /** Where its number sits, in world coordinates. */
    pin: [number, number, number];
    /** The strokes as drawn, laid on the model (or the ground), in world coordinates. */
    strokes: [number, number, number][][];
    /** The records it is about (`"blocks/k3f9x2"`), from what the strokes touched. */
    keys: string[];
    /** The view it was drawn from, for "Go to view". */
    view: {
        position: number[];
        target: number[];
        projection?: "perspective" | "orthographic";
    };
}
/** What a `NotesLayer` needs from a renderer: structurally a `ThreeRenderer`. */
interface NotesRenderer {
    readonly canvasEl: HTMLCanvasElement;
    worldToScreen(world: Vec3): {
        x: number;
        y: number;
        visible: boolean;
    };
    onDraw(cb: () => void): () => void;
    requestRender(): void;
    /** When the renderer has it, the notes join its overlays ("notes") and the shading bar's popover. */
    registerOverlay?(name: string, apply: (on: boolean) => void, on?: boolean): () => void;
    setProjection(projection: "perspective" | "orthographic"): void;
    setCameraPosition(x: number, y: number, z: number): void;
    lookAt(x: number, y: number, z: number): void;
}
/** The notes of one `Doc` collection, drawn over a renderer's view. */
declare class NotesLayer {
    private renderer;
    private doc;
    readonly collection: string;
    private host;
    private canvas;
    private ctx;
    private pinLayer;
    private pins;
    private card;
    private openId;
    private shown;
    private offs;
    constructor(renderer: NotesRenderer, doc: Doc<any>, opts?: {
        collection?: string;
        host?: HTMLElement;
    });
    /** The notes, oldest first, with their ids: the order of their numbers. */
    list(): [string, Note][];
    /** Keep a note: one undo step. Returns its id. */
    add(note: Note): string;
    /** Keep several notes as one undo step ("Keep as notes"). Returns their ids. */
    keep(notes: readonly Note[]): string[];
    remove(id: string): void;
    /** Back to the view the note was drawn from. */
    goTo(id: string): void;
    /** Show or hide the notes (they stay in the document). */
    setVisible(on: boolean): void;
    get visible(): boolean;
    dispose(): void;
    private draw;
    private makePin;
    private openCard;
    private placeCard;
    private closeCard;
}
/** Draw the notes of `doc`'s collection (default `"notes"`) over a renderer's view. */
declare function notesLayer(renderer: NotesRenderer, doc: Doc<any>, opts?: {
    collection?: string;
    host?: HTMLElement;
}): NotesLayer;

/**
 * Markup — draw on the viewport to tell an AI (or a colleague) what to change.
 *
 * The point is not the drawing, it is what the drawing is resolved to. A circle
 * in a screenshot makes the reader guess which object, where in space, and which
 * line of code. Here every mark is resolved at the moment it is drawn:
 *
 *   - the strokes are kept as vectors (screen space), simplified for the file;
 *   - each mark is raycast into the scene: which objects it touches or encloses
 *     (with their layer, label and the source line that created them), and the
 *     world points it lands on;
 *   - the same marks are burnt into a PNG with big numbers, for a vision model.
 *
 * A capture is a bundle — `view.png` (marks), `clean.png` (no marks) and
 * `markup.json` (camera, params, marks, scene summary). It is POSTed to the dev
 * server (tools/markup-vite-plugin.mjs writes it to `.tekto/markup/`); without
 * the plugin the three files are downloaded instead.
 *
 * `window.__tekto.snapshot()` produces the same bundle without any marks, so an
 * agent driving a headless browser (tools/snap.mjs) sees what a person sees.
 */

/** A scene object as a mark or snapshot names it: id, type, layer, label, pick tag, colour, the source line that created it, and its document `key`. */
interface MarkupObjectRef {
    id: string;
    type: string;
    layer?: string;
    label?: string;
    tag?: string;
    color?: string;
    /** Where the object was created, e.g. "pages/primitives.ts:12" (resolved by the dev server). */
    src?: string;
    /** The document record it shows, e.g. "blocks/k3f9x2" (`bindScene` / `scene.withKey`). */
    key?: string;
}
/** What a mark was read as from its strokes: a click (`point`), a closed `loop` (the things inside), a straight `line`, two crossing strokes (`cross`), or a free `stroke`. */
type MarkKind = "point" | "loop" | "line" | "cross" | "stroke";
/** Options for a Markup capture: the overall instruction, whether to save it to the dev server, and the folder label. */
interface MarkupCaptureOptions {
    /** Overall instruction, written to markup.json and the PNG legend. */
    note?: string;
    /** POST to the dev server (default true); false only returns the bundle. */
    save?: boolean;
    /** Short word for the folder name, e.g. "snap". */
    label?: string;
}
/** One capture: `markup.json` content, the view with marks (`viewPng`) and without (`cleanPng`) as PNG data URLs, and the folder it was saved to. */
interface MarkupBundle {
    markup: Record<string, unknown>;
    viewPng: string;
    cleanPng: string;
    /** Folder the dev server wrote to, if it did. */
    dir?: string;
}
/** What `markup()` needs from a renderer: structurally a `ThreeRenderer`. */
interface MarkupRenderer {
    readonly canvasEl: HTMLCanvasElement;
    hitAt(clientX: number, clientY: number): {
        id: string;
        point: Vec3;
    } | null;
    groundAt(clientX: number, clientY: number): Vec3 | null;
    snapshotPng(): string;
    isObjectShown(id: string): boolean;
    objectBounds(id: string): {
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
    } | null;
    cameraState(): {
        position: number[];
        target: number[];
        [k: string]: unknown;
    };
}
/**
 * ✎ Markup in any app: the button and the drawing overlay `sketch()` and `appShell()` have,
 * mounted over a renderer's view, for an app that builds its own UI (React, a custom page).
 * Marks resolve to the objects and record keys under them; Save writes view.png, clean.png
 * and markup.json to the dev server (`.tekto/markup/`), or downloads them without it.
 *
 *   const notes = markup(renderer, scene, { title: "7DHouse", context: () => ({ params }) });
 *   // later: notes.dispose()
 */
declare function markup(renderer: MarkupRenderer, scene: Scene, opts?: {
    title?: string;
    context?: () => Record<string, unknown>;
    host?: HTMLElement;
    /** Offer "Keep as notes", keeping marks in this layer's document. */
    notes?: NotesLayer;
    /** Who is drawing, written into kept notes. */
    author?: string;
}): {
    capture(opts?: MarkupCaptureOptions): Promise<MarkupBundle>;
    dispose(): void;
};

export { type AmbientOcclusionOptions as A, orthoFrustum as B, type CalloutItem as C, DEFAULT_BACKGROUND as D, sectionAppearance as E, sectionPlane as F, shortestTurn as G, standardOrbit as H, surfaceAppearance as I, viewerToolbar as J, type LayoutOptions as L, type MarkupRenderer as M, NotesLayer as N, type PickInfo as P, type ShadingBarCorner as S, ThreeRenderer as T, type ViewMode as V, type TopBarOptions as a, type Theme as b, type ThreeRendererConfig as c, type Appearance as d, Callouts as e, type MarkKind as f, type MarkupBundle as g, type MarkupCaptureOptions as h, type MarkupObjectRef as i, type Note as j, type NotesRenderer as k, type Placement as l, type SunPreset as m, easeInOut as n, edgeStyle as o, fitRadius as p, getTheme as q, groundAppearance as r, labelWidthFor as s, layoutLabels as t, lightBalance as u, markup as v, modeBackground as w, nearestAxis as x, notesLayer as y, orbitFor as z };
