/**
 * A viewport for looking at a building.
 *
 * ThreeRenderer draws a `Scene` of `SceneObject`s and is the right thing when
 * the library owns the model. This is the other case: an app that has already
 * built its own meshes (from IFC, from a cut list, from a supplier's geometry)
 * and wants somewhere honest to put them. It takes `THREE.Mesh`es and gives
 * back the five things every such app has otherwise rewritten:
 *
 *  - **view modes** that answer different questions. Shaded says what a thing
 *    is made of; ghost says where a part sits inside the whole; hidden line is
 *    the drawing convention, and with an orthographic camera it is a plan or an
 *    elevation rather than a picture.
 *  - **creases built progressively.** EdgesGeometry runs per mesh on the main
 *    thread, so a project-scale model either stalls the tab or (worse, and this
 *    is what actually happened) silently gets no outlines at all and hidden
 *    line comes out as a white silhouette. Above a threshold they are built
 *    when a mode asks, a few hundred meshes per frame, reporting as they go.
 *  - **a real sun.** `SunPosition` is a Michalsky solar position accurate to
 *    about a hundredth of a degree; what was missing was the part between it
 *    and a light: frame the shadow camera to the content, put a catcher under
 *    the lowest point, and say out loud what was assumed.
 *  - **navigation the reader can reach.** The axis gizmo in the corner is not
 *    decoration: without it the named views and the orthographic camera above
 *    were public API that no application built on this class had ever called,
 *    so the plan and elevation this viewport can draw were unreachable by
 *    anyone using it. It also answers, before you click anything, which way is
 *    up and which face you are looking at.
 *  - **teardown that releases the WebGL context.** `renderer.dispose()` does
 *    not, and a browser allows only a handful of contexts. A couple of
 *    viewports times every hot reload exhausts them, after which new canvases
 *    come back black and nothing says why.
 *
 * What it deliberately does not know: what your meshes mean. Colour by IFC
 * class, by framing role, by whether a decision has been made against it, all
 * of that is the app's, supplied through `appearanceOf`.
 */
import * as THREE from "three";
import { SunPosition } from "../core/solar/SunPosition";
import { NavGizmo } from "./NavGizmo";
import { Callouts, layoutLabels, labelWidthFor, type CalloutItem } from "./Callouts";

/**
 * How the content is drawn. Not decoration: each answers a different question.
 *  shaded      what is it made of
 *  ghost       where does this part sit in the whole, everything else stepped
 *              back so the selection reads through the fabric
 *  hidden-line the drawing convention: white surfaces, dark creases, occluded
 *              lines hidden by the surfaces in front of them
 */
export type ViewMode = "shaded" | "ghost" | "hidden-line";

/**
 * Where to cut, in the content's own axes.
 *
 * `at` is a fraction of the content's extent along that axis, so 0.5 is
 * halfway through whatever is loaded and the caller needs to know nothing
 * about the model's coordinates.
 */
export interface SectionRequest {
  axis: "x" | "y" | "z";
  at: number;
  /** keep the far side instead of the near one */
  flip?: boolean;
}

/** Perspective for looking at a building, orthographic for drawing one. */
export type Projection = "perspective" | "orthographic";

/** The six faces of the bounding box, plus the corner view. */
export type StandardView = "iso" | "top" | "bottom" | "front" | "back" | "left" | "right";

/** How one mesh is painted. Colours are hex integers, as three.js takes them. */
export interface Appearance {
  colour: number;
  opacity: number;
  depthWrite: boolean;
  polygonOffset: boolean;
}

export interface ViewportOptions {
  background?: number;
  /**
   * Whether the content stands on a visible ground. True by default, because a
   * building floating in a void reads as floating. Turn it off for a viewport
   * showing one component rather than a building: a product on a thumbnail is
   * not standing anywhere, and the horizon behind it is noise.
   */
  ground?: boolean;
  /**
   * Up axis of the meshes handed over. Tekto and IFC are both Z-up, but
   * web-ifc returns geometry already turned to three.js Y-up, so an app can
   * have both in play. Getting this wrong lays a storey-height wall on the floor.
   */
  up?: "y" | "z";
  /** The corner the camera starts in. */
  view?: StandardView;
  /**
   * The axis widget in the corner: which way is up, and a click target for
   * every face view. True by default, because without it this class's named
   * views and its orthographic camera are unreachable by anybody using it, and
   * a reader has no way to tell a plan from a steep look down.
   *
   * Turn it off for a viewport showing one component rather than a building,
   * where the same reasoning as `ground` applies: a product on a thumbnail has
   * no north and the widget is noise.
   */
  gizmo?: boolean;
  /** Corner for that widget. Bottom right by default, out of the way of the
   *  toolbars apps put along the top. */
  gizmoCorner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /**
   * The projection changed, which the host cannot otherwise know: the gizmo
   * offers the toggle, so a host that only ever called `setProjection` itself
   * would still be out of date the moment a reader used the widget.
   */
  onProjection?: (projection: Projection) => void;
  /** A click on a callout label. See `setCallouts`. */
  onPickCallout?: (id: string) => void;
  /** The pointer over a callout label, so a host can light the element it
   *  points at. Null on leaving. */
  onHoverCallout?: (id: string | null) => void;
  /** A click that hit nothing reports null. A drag orbits and reports nothing. */
  onPick?: (mesh: THREE.Mesh | null, event: PointerEvent) => void;
  /**
   * What the pointer is over, as it moves. Reported only when it changes, and
   * never while orbiting, so a host can paint a hover without a raycast per
   * frame. Without this a model reads as a picture: nothing answers until you
   * have already clicked, and you cannot tell what a click would select.
   */
  onHover?: (mesh: THREE.Mesh | null) => void;
  /**
   * The app's last word on how one mesh looks, asked before the mode decides.
   * Return null to let the mode paint it. This is where a selection colour, or
   * "this part is spoken for", belongs: the viewport has no opinion on either.
   */
  appearanceOf?: (mesh: THREE.Mesh, mode: ViewMode) => Partial<Appearance> | null;
}

export interface ContentOptions {
  /** Overrides the viewport's own setting for this content only. */
  up?: "y" | "z";
  /**
   * Which meshes get a crease outline: all of them, none, or a predicate. A
   * translucent sheet usually wants none, because an outline around something
   * you can see through reads as a box drawn over the thing that matters.
   */
  outline?: boolean | ((mesh: THREE.Mesh) => boolean);
  /** Crease angle in degrees. 30 keeps a curved surface from turning into wireframe. */
  creaseAngle?: number;
}

/**
 * Above this many meshes the outlines are not built with the content. They are
 * not abandoned either, which is the bug this constant exists to prevent.
 */
const OUTLINE_LIMIT = 1500;
/** Meshes per frame while building outlines in the background. */
const OUTLINE_CHUNK = 250;

const FALLBACK_SURFACE = 0xd9dde3;

// ---------------------------------------------------------------------------
// The decisions, as plain functions. Nothing here touches a GPU, so the rules
// a viewport draws by can be tested without one.
// ---------------------------------------------------------------------------

/** The page shaded and hidden-line are drawn on, when the host names none. */
export const DEFAULT_BACKGROUND = 0xf5f7fa;

/** Crease colour and weight for a mode. Hidden line draws them at full strength
 *  because in that mode the lines are the drawing. */
export function edgeStyle(mode: ViewMode): { colour: number; opacity: number } {
  if (mode === "hidden-line") return { colour: 0x1b2733, opacity: 1 };
  // Ghost draws on a dark ground, so its creases are light and nearly solid.
  // They used to be dark grey at a quarter opacity on an almost white page,
  // which is the faintest thing a screen can show: the mode that exists to
  // reveal what is inside was the hardest one to see anything in.
  if (mode === "ghost") return { colour: 0xe8eef6, opacity: 0.75 };
  return { colour: 0x5a646e, opacity: 0.55 };
}

/**
 * The page a mode is drawn on.
 *
 * Ghost inverts: pale edges over a dark ground read where dark edges over a
 * pale one wash out, and a translucent surface adds light instead of
 * subtracting it, so the parts stack up legibly instead of greying together.
 * The other two keep the host's own background.
 */
export function modeBackground(mode: ViewMode, base: number): number {
  return mode === "ghost" ? 0x1b2129 : base;
}

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
export function groundAppearance(mode: ViewMode): {
  visible: boolean; colour: number; opacity: number;
} {
  if (mode === "hidden-line") return { visible: false, colour: 0xffffff, opacity: 0 };
  if (mode === "ghost") return { visible: true, colour: 0x252d38, opacity: 1 };
  return { visible: true, colour: 0xe7ebf1, opacity: 1 };
}

/** How a mode paints a surface whose own colour is `base`. */
export function surfaceAppearance(mode: ViewMode, base: number): Appearance {
  if (mode === "ghost") {
    // Its own colour, not a uniform grey. Ghost used to flatten everything to
    // one pale slate, which meant the one mode you would use to find a part
    // inside the whole was also the one mode that threw away which product it
    // had been assigned. depthWrite off, so a part behind still reads through.
    return { colour: base, opacity: 0.11, depthWrite: false, polygonOffset: false };
  }
  if (mode === "hidden-line") {
    // the white surfaces are pushed back a hair so the creases sit cleanly on top
    return { colour: 0xffffff, opacity: 1, depthWrite: true, polygonOffset: true };
  }
  return { colour: base, opacity: 1, depthWrite: true, polygonOffset: false };
}

/**
 * Sun and sky intensity for a mode.
 *
 * Ghost is transparent throughout and a shadow cast by something you can see
 * through reads as dirt on the drawing, so it never casts. With the sun doing
 * the work the sky has to step back, or the shadows wash out.
 */
export function lightBalance(mode: ViewMode, shadows: boolean): {
  shadowed: boolean; sun: number; sky: number; groundOpacity: number;
} {
  const shadowed = shadows && mode !== "ghost";
  return {
    shadowed,
    sun: shadowed ? 2.6 : 1.4,
    sky: shadowed ? 1.1 : 2.2,
    // ShadowMaterial darkens whatever is behind it, so on a white hidden-line
    // page the shadow has to be lighter than it is over a shaded model
    groundOpacity: mode === "hidden-line" ? 0.16 : 0.24,
  };
}

/**
 * Both poles are held this far off, because a camera looking exactly along its
 * own up vector has no defined orientation and the view rolls to an arbitrary
 * angle.
 */
const POLE = 0.001;

/**
 * Where the camera sits for a named view, as three.js spherical angles: phi
 * from +Y, theta around Y from +Z towards +X.
 */
export function standardOrbit(view: StandardView): { phi: number; theta: number } {
  const H = Math.PI / 2;
  switch (view) {
    case "top": return { phi: POLE, theta: 0 };
    case "bottom": return { phi: Math.PI - POLE, theta: 0 };
    case "front": return { phi: H, theta: 0 };
    case "back": return { phi: H, theta: Math.PI };
    case "right": return { phi: H, theta: H };
    case "left": return { phi: H, theta: -H };
    default: return { phi: Math.PI / 3, theta: Math.PI / 4 };
  }
}

/**
 * Where the camera sits to look down `direction`, which points from the subject
 * towards the camera. The inverse of what the tick loop does with a spherical.
 *
 * Clamped off the poles like the named views, so clicking the gizmo's Y ball
 * lands on the same well-defined orientation that `setView("top")` does rather
 * than on a plan whose north is whatever floating point decided.
 */
export function orbitFor(direction: { x: number; y: number; z: number }): {
  phi: number; theta: number;
} {
  const s = new THREE.Spherical().setFromVector3(
    new THREE.Vector3(direction.x, direction.y, direction.z).normalize());
  return { phi: Math.min(Math.PI - POLE, Math.max(POLE, s.phi)), theta: s.theta };
}

/**
 * The end angle to interpolate towards so a turn takes the short way round.
 *
 * Without this, orbiting from theta 3.0 to -3.0 (a tenth of a turn apart on the
 * screen) spins the building almost the whole way about instead, which reads as
 * the viewport having lost its place rather than as a view change.
 */
export function shortestTurn(from: number, to: number): number {
  const TAU = Math.PI * 2;
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return from + delta;
}

/**
 * Whichever of the six axis directions a view is already closest to. What a
 * double click on the gizmo snaps to: the reader is nearly at an elevation and
 * wants to be exactly at one, without having to work out which.
 */
export function nearestAxis(direction: { x: number; y: number; z: number }): THREE.Vector3 {
  const v = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
  const axis = new THREE.Vector3();
  const [ax, ay, az] = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
  if (ax >= ay && ax >= az) axis.set(Math.sign(v.x) || 1, 0, 0);
  else if (ay >= az) axis.set(0, Math.sign(v.y) || 1, 0);
  else axis.set(0, 0, Math.sign(v.z) || 1);
  return axis;
}

/** Smoothstep. A camera that starts and stops abruptly reads as a cut, and a
 *  cut is exactly what an animated view change exists to avoid. */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * How far back to sit so a sphere of `boundingRadius` fits, on the tighter of
 * the two field-of-view axes. A portrait panel clips a wide building on the
 * horizontal, which is exactly the case a vertical-only fit gets wrong.
 */
export function fitRadius(
  boundingRadius: number, fovDeg: number, aspect: number, margin = 1.25,
): number {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.01));
  const dist = Math.max(boundingRadius, 1e-6) / Math.sin(Math.min(vFov, hFov) / 2);
  return Math.max(1, dist * margin);
}

/**
 * The orthographic frustum that frames what a perspective camera would see at
 * the same distance, so switching projection changes the drawing convention
 * and not the subject.
 */
export function orthoFrustum(distance: number, fovDeg: number, aspect: number): {
  left: number; right: number; top: number; bottom: number;
} {
  const h = 2 * distance * Math.tan(((fovDeg * Math.PI) / 180) / 2);
  const w = h * aspect;
  return { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 };
}

// ---------------------------------------------------------------------------

export class Viewport {
  readonly scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer;
  private perspective: THREE.PerspectiveCamera;
  private orthographic: THREE.OrthographicCamera;
  private projectionMode: Projection = "perspective";
  private root = new THREE.Group();
  private meshGroup = new THREE.Group();
  private outlines = new THREE.Group();
  /** Bright edges around a chosen set, drawn over everything. See setOutlined. */
  private highlight = new THREE.Group();
  /**
   * A live section is two things in two different spaces, which is why they
   * are two groups.
   *
   * The stencil markers share geometry and local matrices with the meshes, so
   * they belong under `root` and inherit its up-axis rotation exactly as the
   * meshes do. The cap quad is placed from the clipping plane, and three
   * applies clipping planes in world space, so a cap parented under `root` has
   * a world-space position read as a local one and lands wherever the up-axis
   * rotation sends it. That is why the first version cut correctly and capped
   * nothing.
   */
  private sectionGroup = new THREE.Group();
  private sectionCap = new THREE.Group();
  /** kept so a colour change can rebuild the same cut */
  private sectionRequest: SectionRequest | null = null;
  private section: THREE.Plane | null = null;
  private sectionColour = 0xd8d2c4;
  private frame = 0;
  private mode: ViewMode = "shaded";
  private outlinesBuilt = false;
  private buildingOutlines = false;
  private content: ContentOptions = {};

  private sun: THREE.DirectionalLight;
  private sky: THREE.HemisphereLight;
  /** Catches the cast shadow and is otherwise invisible: ShadowMaterial draws
   *  nothing where nothing falls on it, so no ground slab appears. */
  private ground: THREE.Mesh;
  /**
   * A visible plane under the shadow catcher, so the building stands on
   * something rather than floating in a void with a smudge beneath it. Sized
   * and placed with the shadow catcher; hidden in hidden line, where a grey
   * plate is not what a drawing is.
   */
  private groundPlane: THREE.Mesh;
  private shadows = false;
  private hovered: THREE.Mesh | null = null;
  private lastHover = 0;
  /** Where the light comes from, in three.js Y-up. Replaced by a real solar
   *  position through setSun; this is the fallback for a sun below the horizon,
   *  and for a viewport nobody has told a date. */
  private sunDir = new THREE.Vector3(1, 1.6, 1.1).normalize();
  private sunNote = "generic light, no date";

  // simple orbit: enough for looking at a building, and no extra dependency
  private target = new THREE.Vector3();
  private spherical: THREE.Spherical;
  private gizmo: NavGizmo | null = null;
  private callouts: Callouts | null = null;
  /** World-space anchor per callout, remeasured only when the content changes:
   *  a bounding box costs a walk of the geometry and nothing in the scene
   *  moves except the camera. */
  private calloutAnchors = new Map<string, THREE.Vector3>();
  /** Which callouts the reader can actually see, recomputed on a timer rather
   *  than per frame, because it costs a raycast each. */
  private calloutVisible = new Set<string>();
  private calloutCheckedAt = 0;
  /** Last orbit the gizmo was drawn for, so it is redrawn on a move and not on
   *  every one of the frames a still camera also renders. */
  private gizmoAt = { phi: NaN, theta: NaN };
  /**
   * A camera move in progress. Any input from the reader drops it: a view
   * animation that fights an orbit is worse than no animation at all.
   */
  private move: {
    from: { phi: number; theta: number; radius: number; target: THREE.Vector3 };
    to: { phi: number; theta: number; radius: number; target: THREE.Vector3 };
    start: number; ms: number;
  } | null = null;

  constructor(private host: HTMLElement, private opts: ViewportOptions = {}) {
    const home = standardOrbit(opts.view ?? "iso");
    this.spherical = new THREE.Spherical(30, home.phi, home.theta);
    this.scene.background = new THREE.Color(opts.background ?? DEFAULT_BACKGROUND);
    this.perspective = new THREE.PerspectiveCamera(45, 1, 0.05, 5000);
    this.orthographic = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 5000);

    // stencil: true is the default, and named here because the section's caps
    // depend on it entirely. A renderer without a stencil buffer clips the
    // model and leaves the cut hollow, with nothing to say why.
    this.renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 2));
    // fill the host exactly: without this the canvas keeps its intrinsic size
    // and the view sits off-centre inside its container
    const dom = this.renderer.domElement;
    dom.style.display = "block";
    dom.style.width = "100%";
    dom.style.height = "100%";
    host.appendChild(dom);

    this.sky = new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sun.position.set(1, 2, 1.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0005;
    // Nothing in the scene moves except the camera, so the shadow map is
    // rendered when the content or the light changes and never again. That is
    // what makes a few thousand meshes affordable to shade at all.
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShadowMaterial({ opacity: 0.22 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.visible = false;

    this.groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      // unlit, so the plane stays an even tone whatever the sun is doing and
      // never competes with the building for attention
      new THREE.MeshBasicMaterial({ transparent: true }),
    );
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.visible = false;
    this.groundPlane.renderOrder = -1;

    this.setUp(opts.up ?? "y");
    this.root.add(this.meshGroup, this.outlines, this.highlight, this.sectionGroup);
    this.scene.add(this.sectionCap);          // world space: see the field
    this.scene.add(this.sky, this.sun, this.sun.target, this.ground,
                   this.groundPlane, this.root);
    if (opts.gizmo !== false) {
      this.gizmo = new NavGizmo(host, {
        corner: opts.gizmoCorner,
        onAxis: (direction) => this.orbitTo(direction),
        onDrag: (dx, dy) => { this.move = null; this.orbitBy(dx, dy); },
        onSnap: () => this.orbitTo(nearestAxis(this.viewDirection())),
        onProjection: () => this.setProjection(
          this.projectionMode === "perspective" ? "orthographic" : "perspective"),
      });
      this.gizmo.setProjection(this.projectionMode);
    }
    this.bind();
    this.resize();
    this.tick();
  }

  /** The camera currently in use. Follows setProjection. */
  get camera(): THREE.Camera {
    return this.projectionMode === "orthographic" ? this.orthographic : this.perspective;
  }

  private setUp(up: "y" | "z") {
    this.root.rotation.set(up === "z" ? -Math.PI / 2 : 0, 0, 0);
    this.gizmoAt.phi = NaN;                 // the widget's axes just moved
  }

  private bind() {
    const el = this.renderer.domElement;
    let dragging = false, moved = false, lx = 0, ly = 0;
    el.addEventListener("pointerdown", (e) => {
      dragging = true; moved = false; lx = e.clientX; ly = e.clientY;
      this.move = null;                    // the reader outranks an animation
    });
    el.addEventListener("pointerleave", () => {
      if (this.hovered !== null) { this.hovered = null; this.opts.onHover?.(null); }
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) { this.hover(e); return; }
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      this.orbitBy(dx, dy);
      lx = e.clientX; ly = e.clientY;
    });
    el.addEventListener("pointerup", (e) => {
      dragging = false;
      if (!moved) this.pick(e);            // a drag orbits, a click selects
    });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.move = null;
      this.spherical.radius = Math.max(
        0.05, Math.min(4000, this.spherical.radius * (1 + Math.sign(e.deltaY) * 0.12)));
    }, { passive: false });
    new ResizeObserver(() => this.resize()).observe(this.host);
  }

  /** Orbit by a pointer travel in pixels. Shared by the canvas and the gizmo,
   *  so dragging the widget turns the model exactly as dragging the model does. */
  private orbitBy(dx: number, dy: number) {
    this.spherical.theta -= dx * 0.005;
    this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi - dy * 0.005));
  }

  /** The mesh under the pointer, at most every other animation frame.
   *  Reported only on a change, so the host repaints on a crossing and not on
   *  every pixel of travel. */
  private hover(e: PointerEvent) {
    if (!this.opts.onHover) return;
    const now = performance.now();
    if (now - this.lastHover < 40) return;
    this.lastHover = now;
    const hit = this.meshAt(e.clientX, e.clientY);
    if (hit === this.hovered) return;
    this.hovered = hit;
    this.opts.onHover(hit);
  }

  private meshAt(clientX: number, clientY: number): THREE.Mesh | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    return (ray.intersectObjects(this.meshGroup.children, false)[0]?.object as THREE.Mesh) ?? null;
  }

  private pick(e: PointerEvent) {
    if (!this.opts.onPick) return;
    this.opts.onPick(this.meshAt(e.clientX, e.clientY), e);
  }

  // -- content --------------------------------------------------------------

  /**
   * Show these meshes, replacing whatever was there.
   *
   * The meshes are the app's: build them however the app colours things, and
   * put the unpainted colour on `mesh.userData.baseColour` so shaded mode can
   * return to it.
   */
  setContent(meshes: THREE.Mesh[], opts: ContentOptions = {}) {
    this.clear();
    this.content = opts;
    if (opts.up) this.setUp(opts.up);
    for (const mesh of meshes) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.meshGroup.add(mesh);
    }
    this.applyMode(this.mode);
    // content small enough gets its outlines with everything else, so the
    // first frame is already complete; a large model waits until a mode asks
    if (this.wantsOutlines().length <= OUTLINE_LIMIT) this.buildOutlines();
    this.root.updateMatrixWorld(true);
    this.fit();
    this.frameSun();
  }

  /** Which meshes the content options ask for an outline around. */
  private wantsOutlines(): THREE.Mesh[] {
    const rule = this.content.outline ?? true;
    if (rule === false) return [];
    const all = this.meshGroup.children as THREE.Mesh[];
    return rule === true ? all : all.filter(rule);
  }

  clear() {
    for (const child of this.meshGroup.children as THREE.Mesh[]) {
      child.geometry.dispose();
      const m = child.material;
      (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
    }
    for (const line of this.outlines.children as THREE.LineSegments[]) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.clearSection();            // its markers share geometry with the meshes
    this.meshGroup.clear();
    this.outlines.clear();
    this.setOutlined([]);           // its geometry came from meshes now gone
    // anchors were measured from meshes that no longer exist, so a label left
    // over from the last model would point at where something used to be
    this.calloutAnchors.clear();
    this.calloutVisible.clear();
    this.callouts?.setItems([]);
    this.outlinesBuilt = false;
    this.buildingOutlines = false;
  }

  /** Convenience for the common case: a mesh from raw buffers, which is what
   *  every Tekto generator and every IFC reader hands over. */
  static meshFrom(
    buffers: { positions: Float32Array; normals?: Float32Array; indices: Uint32Array | Uint16Array },
    material: THREE.Material,
  ): THREE.Mesh {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(buffers.positions, 3));
    if (buffers.normals?.length) {
      g.setAttribute("normal", new THREE.BufferAttribute(buffers.normals, 3));
    }
    g.setIndex(new THREE.BufferAttribute(buffers.indices, 1));
    if (!buffers.normals?.length) g.computeVertexNormals();
    return new THREE.Mesh(g, material);
  }

  // -- how it is drawn ------------------------------------------------------

  get viewMode(): ViewMode { return this.mode; }

  /**
   * The mode a reader chose. Unlike the internal apply, this will go and build
   * the outlines the mode needs if large content was loaded without them.
   */
  setViewMode(mode: ViewMode, onProgress?: (message: string | null) => void) {
    this.applyMode(mode);
    if (!this.outlinesBuilt && this.meshGroup.children.length) this.buildOutlines(onProgress);
  }

  get projection(): Projection { return this.projectionMode; }

  /** Perspective or orthographic. Orthographic with hidden line and a face view
   *  is a plan or an elevation; that pairing is the point of having both. */
  setProjection(projection: Projection) {
    const changed = projection !== this.projectionMode;
    this.projectionMode = projection;
    this.gizmo?.setProjection(projection);
    this.resize();
    if (changed) this.opts.onProjection?.(projection);
  }

  /**
   * Point the camera at a named face, keeping the distance.
   *
   * Animated by default. A view change that jumps is read as the model having
   * been replaced rather than turned, and the reader loses which face they are
   * now looking at, which is the one thing the change was for. Pass
   * `{ animate: false }` where a jump is wanted (restoring a stored view, or a
   * test that wants the end state now).
   */
  setView(view: StandardView, opts: { animate?: boolean } = {}) {
    const { phi, theta } = standardOrbit(view);
    this.orbit(phi, theta, opts.animate !== false);
  }

  /**
   * Look down a direction given in the content's own axes, so a caller with a
   * Z-up model asks for `(0, 0, 1)` and gets a plan whichever way the viewport
   * has turned the content to face three.js.
   */
  orbitTo(direction: THREE.Vector3, opts: { animate?: boolean } = {}) {
    const world = direction.clone().applyQuaternion(this.root.quaternion);
    const { phi, theta } = orbitFor(world);
    this.orbit(phi, theta, opts.animate !== false);
  }

  /** Which way the camera currently lies from the subject, in content axes. */
  private viewDirection(): THREE.Vector3 {
    return new THREE.Vector3().setFromSpherical(this.spherical)
      .applyQuaternion(this.root.quaternion.clone().invert()).normalize();
  }

  private orbit(phi: number, theta: number, animate: boolean) {
    if (!animate) {
      this.move = null;
      this.spherical.phi = phi;
      this.spherical.theta = theta;
      return;
    }
    this.animate({ phi, theta: shortestTurn(this.spherical.theta, theta) });
  }

  /** Start a camera move to a partial end state, holding whatever it omits. */
  private animate(to: Partial<{ phi: number; theta: number; radius: number; target: THREE.Vector3 }>,
                  ms = 340) {
    const from = {
      phi: this.spherical.phi, theta: this.spherical.theta,
      radius: this.spherical.radius, target: this.target.clone(),
    };
    this.move = {
      from,
      to: {
        phi: to.phi ?? from.phi, theta: to.theta ?? from.theta,
        radius: to.radius ?? from.radius, target: to.target?.clone() ?? from.target.clone(),
      },
      start: performance.now(), ms,
    };
  }

  /** Advance a camera move, if one is running. Called once per frame. */
  private step() {
    if (!this.move) return;
    const { from, to, start, ms } = this.move;
    const t = easeInOut((performance.now() - start) / ms);
    this.spherical.phi = from.phi + (to.phi - from.phi) * t;
    this.spherical.theta = from.theta + (to.theta - from.theta) * t;
    this.spherical.radius = from.radius + (to.radius - from.radius) * t;
    this.target.lerpVectors(from.target, to.target, t);
    if (t >= 1) this.move = null;
  }

  /**
   * Label these things, in the margins, with leaders to them.
   *
   * What a label says is the host's business, as colour is: this class knows
   * how a drawing is annotated and nothing about what the annotation means.
   * Pass an empty array to clear.
   *
   * Anchors are measured here and once, because a bounding box costs a walk of
   * the geometry and nothing in this scene moves except the camera.
   */
  setCallouts(items: CalloutItem[]) {
    if (!items.length && !this.callouts) return;
    if (!this.callouts) {
      this.callouts = new Callouts(this.host, {
        onPick: (id) => this.opts.onPickCallout?.(id),
        onHover: (id) => this.opts.onHoverCallout?.(id),
      });
    }
    this.callouts.setItems(items);
    this.calloutAnchors.clear();
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    for (const item of items) {
      if (!item.objects.length) continue;
      box.makeEmpty();
      for (const o of item.objects) box.expandByObject(o);
      if (!box.isEmpty()) this.calloutAnchors.set(item.id, box.getCenter(new THREE.Vector3()));
    }
    this.calloutCheckedAt = 0;             // re-test visibility on the next frame
  }

  /**
   * Which anchors the reader can actually see.
   *
   * A leader pointing confidently at a wall that is behind three other walls
   * is worse than no leader: on a face view half the building is occluded, and
   * without this every one of those elements would still be labelled and the
   * reader would have no way to tell which. One raycast per callout, on a
   * timer, because the answer only changes when the camera moves.
   */
  private checkCalloutVisibility() {
    this.calloutVisible.clear();
    const camera = this.camera;
    const ray = new THREE.Raycaster();
    const meshes = this.meshGroup.children;
    const direction = new THREE.Vector3();
    for (const [id, anchor] of this.calloutAnchors) {
      const wanted = this.callouts?.objectsOf(id) ?? [];
      direction.copy(anchor).sub(camera.position);
      const distance = direction.length();
      ray.set(camera.position, direction.normalize());
      ray.far = distance;                  // nothing beyond the anchor can hide it
      const hit = ray.intersectObjects(meshes, false)[0];
      // its own geometry standing in front of its centre is not occlusion: a
      // wall's centre is inside the wall, so every callout would fail
      if (!hit || wanted.includes(hit.object) || hit.distance >= distance - 1e-3) {
        this.calloutVisible.add(id);
      }
    }
  }

  /** Project, cull and lay out this frame's labels. */
  private drawCallouts() {
    if (!this.callouts) return;
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    const camera = this.camera;
    const now = performance.now();
    if (now - this.calloutCheckedAt > 180) {
      this.checkCalloutVisibility();
      this.calloutCheckedAt = now;
    }
    const v = new THREE.Vector3();
    const anchors: { id: string; x: number; y: number }[] = [];
    for (const [id, anchor] of this.calloutAnchors) {
      if (!this.calloutVisible.has(id)) continue;
      v.copy(anchor).project(camera);
      if (v.z > 1) continue;               // behind the camera
      anchors.push({ id, x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h });
    }
    const labelWidth = labelWidthFor(w);
    this.callouts.setLabelWidth(labelWidth);
    const { placed, dropped } = layoutLabels(anchors, { width: w, height: h, labelWidth });
    this.callouts.update(placed, dropped.length);
  }

  /**
   * Cut the model with a plane, and cap the cut so it reads as solid.
   *
   * `axis` is in the content's own frame, so a Z-up model asks for "z" and
   * gets a horizontal cut whichever way the viewport has turned the content to
   * face three.js. `at` is a fraction of the content's extent along that axis,
   * so 0.5 is halfway through whatever is loaded. Pass null to clear.
   *
   * The capping is the whole point and the reason this is not three lines.
   * A clipping plane on its own leaves the cut hollow: you see the inside of
   * the far face and the building reads as a shell, which is wrong about the
   * one thing a section exists to show. So each mesh is drawn twice more into
   * the stencil buffer, back faces incrementing and front faces decrementing,
   * which leaves a non-zero stencil exactly where the plane passes through
   * solid material; a quad over the plane is then drawn only there.
   *
   * It assumes closed geometry. Our own framing boxes are closed and cap
   * cleanly. Imported IFC geometry frequently is not, and an open mesh caps
   * with holes: that is a fault in the model rather than in this code, and it
   * looks like one, which is better than quietly filling it in.
   */
  setSection(section: SectionRequest | null) {
    this.clearSection();
    this.sectionRequest = section;
    this.renderer.localClippingEnabled = section !== null;
    if (!section) { this.applyClipping([]); return; }

    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.meshGroup);
    // nothing to cut, so nothing to clip either: leaving the planes on would
    // hide whatever content arrives next
    if (box.isEmpty()) { this.applyClipping([]); return; }
    // the axis named in the content's frame, turned into the scene's
    const local = new THREE.Vector3(
      section.axis === "x" ? 1 : 0, section.axis === "y" ? 1 : 0, section.axis === "z" ? 1 : 0);
    const normal = local.clone().applyQuaternion(this.root.quaternion).normalize();
    if (section.flip) normal.negate();
    const lo = new THREE.Vector3(), hi = new THREE.Vector3();
    box.getCenter(lo);
    const half = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const reach = Math.abs(normal.x) * half.x + Math.abs(normal.y) * half.y
                + Math.abs(normal.z) * half.z;
    const centre = box.getCenter(hi);
    // constant of a plane through the point at `at` along the normal
    const t = (Math.min(1, Math.max(0, section.at)) - 0.5) * 2 * reach;
    const plane = new THREE.Plane(normal.clone().negate(),
                                  centre.dot(normal) + t);
    this.section = plane;
    this.applyClipping([plane]);

    // the stencil pair per mesh, and one quad to fill what they mark
    const stencilBase = new THREE.MeshBasicMaterial({
      depthWrite: false, depthTest: false, colorWrite: false,
      stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc,
      clippingPlanes: [plane],
    });
    for (const mesh of this.meshGroup.children as THREE.Mesh[]) {
      if (!mesh.geometry) continue;
      for (const [side, op] of [
        [THREE.BackSide, THREE.IncrementWrapStencilOp],
        [THREE.FrontSide, THREE.DecrementWrapStencilOp],
      ] as const) {
        const material = stencilBase.clone();
        material.side = side;
        material.stencilFail = op;
        material.stencilZFail = op;
        material.stencilZPass = op;
        const marker = new THREE.Mesh(mesh.geometry, material);
        marker.matrixAutoUpdate = false;
        marker.matrix.copy(mesh.matrix);
        marker.renderOrder = 1;
        this.sectionGroup.add(marker);
      }
    }
    stencilBase.dispose();

    // big enough to cover the cut whatever angle it is at, which is the box's
    // diagonal rather than any one of its sides
    const size = box.getSize(new THREE.Vector3()).length() * 1.2;
    const cap = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({
        color: this.sectionColour, metalness: 0, roughness: 1,
        side: THREE.DoubleSide,
        stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      }));
    cap.renderOrder = 2;
    // Centred on the content, not on the plane's own nearest point.
    //
    // `coplanarPoint` returns the point of the plane closest to the world
    // origin, which is only the middle of the cut for content that happens to
    // straddle the origin. A building modelled from a corner at (0,0) put the
    // quad half a building away and capped the near half of the cut and not
    // the far half, which read as one wall being missed rather than as the
    // quad being in the wrong place.
    plane.projectPoint(centre, cap.position);
    cap.lookAt(cap.position.clone().add(plane.normal));
    cap.onAfterRender = (renderer) => renderer.clearStencil();
    this.sectionCap.add(cap);
  }

  /** What the cut face is painted. A tone of its own by default, because a cut
   *  is not a surface anybody specified. */
  setSectionColour(colour: number) {
    if (colour === this.sectionColour) return;
    this.sectionColour = colour;
    if (this.sectionRequest) this.setSection(this.sectionRequest);
  }

  /** The section in force, or null. */
  get sectionAt(): SectionRequest | null { return this.sectionRequest; }

  private clearSection() {
    for (const child of this.sectionCap.children as THREE.Mesh[]) {
      child.geometry.dispose();
      const m = child.material;
      (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
    }
    this.sectionCap.clear();
    for (const child of this.sectionGroup.children as THREE.Mesh[]) {
      const m = child.material;
      (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      if (child.geometry && !(this.meshGroup.children as THREE.Mesh[])
          .some((mesh) => mesh.geometry === child.geometry)) child.geometry.dispose();
    }
    this.sectionGroup.clear();
    this.section = null;
  }

  /** Clipping is per material in three, so it has to reach every one the app
   *  handed over as well as the ones this class makes. */
  private applyClipping(planes: THREE.Plane[]) {
    const set = (m: THREE.Material | THREE.Material[]) => {
      for (const one of Array.isArray(m) ? m : [m]) {
        one.clippingPlanes = planes.length ? planes : null;
        one.needsUpdate = true;
      }
    };
    for (const mesh of this.meshGroup.children as THREE.Mesh[]) set(mesh.material);
    for (const line of this.outlines.children as THREE.LineSegments[]) set(line.material);
    for (const line of this.highlight.children as THREE.LineSegments[]) set(line.material);
  }

  /**
   * Draw a bright outline around these meshes, on top of everything.
   *
   * The way to mark a set of elements without spending their fill colour,
   * which matters once an app paints by something (a product, a state, an
   * evidence grade) and still needs to say "these ones". Dimming everything
   * else says the same thing by destroying the rest of the picture.
   *
   * Drawn with `depthTest` off, so an outlined element reads through the
   * fabric in front of it. That is not a compromise: the usual reason to
   * highlight a set is that some of it is behind something, and an outline you
   * can only see when nothing is in the way answers the easy half of the
   * question.
   *
   * One pixel wide. `LineBasicMaterial.linewidth` is ignored by every WebGL
   * implementation worth naming, and this machine reports an aliased line
   * width range of exactly [1, 1]. Thickness would mean the instanced-quad
   * line from three's examples, which this library already imports elsewhere
   * for its controls, so it is available; it is not used here because drawing
   * over the top is what makes the highlight legible, and a saturated line at
   * one pixel over the fabric reads better than a thick one behind it. If a
   * host wants weight as well, that is the change to make.
   */
  setOutlined(meshes: THREE.Object3D[], colour = 0x1f7ae0) {
    for (const line of this.highlight.children as THREE.LineSegments[]) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.highlight.clear();
    if (!meshes.length) return;
    const material = new THREE.LineBasicMaterial({
      color: colour, depthTest: false, transparent: true, opacity: 0.95,
    });
    const angle = this.content.creaseAngle ?? 30;
    for (const object of meshes) {
      const mesh = object as THREE.Mesh;
      if (!mesh.geometry) continue;
      // recomputed rather than fetched: the cached creases are merged into
      // buffers of a few hundred meshes each, so there is no per-element
      // geometry to reuse. For a selection of a few elements that is cheap.
      const edges = new THREE.EdgesGeometry(mesh.geometry, angle);
      const line = new THREE.LineSegments(edges, material);
      line.applyMatrix4(mesh.matrix);
      line.renderOrder = 999;
      this.highlight.add(line);
    }
  }

  /** Repaint every mesh. Call after changing whatever `appearanceOf` reads. */
  repaint() {
    for (const child of this.meshGroup.children) this.paint(child as THREE.Mesh);
  }

  /** Apply the current mode to one mesh. The app's hook has the first word. */
  private paint(mesh: THREE.Mesh) {
    const material = mesh.material as THREE.MeshStandardMaterial;
    const base = (mesh.userData.baseColour as number) ?? FALLBACK_SURFACE;
    const look: Appearance = {
      ...surfaceAppearance(this.mode, base),
      ...(this.opts.appearanceOf?.(mesh, this.mode) ?? {}),
    };
    material.color.setHex(look.colour);
    // hidden line is a drawing, not a photograph: a lit standard material
    // shades a face-on surface grey, which reads as a fill nobody asked for.
    // Emitting its own colour flattens it without the app having to hand over
    // a different material for one mode. Ghost does the same for a different
    // reason: on a dark ground the unlit side of a translucent surface falls
    // to black, and a part is then legible from one direction only.
    if (material.emissive) {
      const flat = this.mode === "hidden-line" || this.mode === "ghost";
      material.emissive.setHex(flat ? look.colour : 0x000000);
      // ghost emits at less than full strength: a framed wall is dozens of
      // overlapping studs, and at full emission they accumulate until the
      // thing you were trying to see through is opaque again
      material.emissiveIntensity = this.mode === "ghost" ? 0.8 : 1;
    }
    material.opacity = look.opacity;
    material.transparent = look.opacity < 1;
    material.depthWrite = look.depthWrite;
    material.polygonOffset = look.polygonOffset;
    if (look.polygonOffset) {
      material.polygonOffsetFactor = 1;
      material.polygonOffsetUnits = 1;
    }
    material.needsUpdate = true;
  }

  private applyMode(mode: ViewMode) {
    this.mode = mode;
    (this.scene.background as THREE.Color).setHex(
      modeBackground(mode, this.opts.background ?? DEFAULT_BACKGROUND));
    const balance = lightBalance(mode, this.shadows);
    const floor = groundAppearance(mode);
    this.groundPlane.visible = floor.visible && (this.opts.ground ?? true);
    const gm = this.groundPlane.material as THREE.MeshBasicMaterial;
    gm.color.setHex(floor.colour);
    gm.opacity = floor.opacity;
    gm.transparent = floor.opacity < 1;
    gm.needsUpdate = true;
    this.sun.castShadow = balance.shadowed;
    this.ground.visible = balance.shadowed;
    this.sun.intensity = balance.sun;
    this.sky.intensity = balance.sky;
    (this.ground.material as THREE.ShadowMaterial).opacity = balance.groundOpacity;
    this.renderer.shadowMap.needsUpdate = true;
    this.repaint();
    const style = edgeStyle(mode);
    for (const line of this.outlines.children) {
      const lm = (line as THREE.LineSegments).material as THREE.LineBasicMaterial;
      lm.color.setHex(style.colour);
      lm.opacity = style.opacity;
      lm.transparent = style.opacity < 1;
      lm.needsUpdate = true;
    }
  }

  /**
   * Creases for the content, a chunk per frame.
   *
   * One LineSegments per chunk rather than per mesh: a few thousand line
   * objects is a few thousand draw calls, and merging costs nothing here
   * because the outlines are styled as one anyway.
   */
  private buildOutlines(onProgress?: (message: string | null) => void) {
    if (this.buildingOutlines) return;
    const meshes = this.wantsOutlines();
    if (!meshes.length) { this.outlinesBuilt = true; return; }
    this.buildingOutlines = true;
    const angle = this.content.creaseAngle ?? 30;
    const style = edgeStyle(this.mode);
    let i = 0;
    const step = () => {
      const positions: number[] = [];
      const end = Math.min(i + OUTLINE_CHUNK, meshes.length);
      for (; i < end; i++) {
        const edges = new THREE.EdgesGeometry(meshes[i].geometry, angle);
        const p = edges.getAttribute("position").array;
        // the mesh may sit anywhere; the merged buffer is in the group's frame
        const m = meshes[i].matrix;
        const v = new THREE.Vector3();
        for (let k = 0; k < p.length; k += 3) {
          v.set(p[k], p[k + 1], p[k + 2]).applyMatrix4(m);
          positions.push(v.x, v.y, v.z);
        }
        edges.dispose();
      }
      if (positions.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        this.outlines.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({
          color: style.colour, opacity: style.opacity, transparent: style.opacity < 1,
        })));
      }
      if (i < meshes.length) {
        onProgress?.(`Drawing edges: ${i} of ${meshes.length} ...`);
        requestAnimationFrame(step);
      } else {
        this.outlinesBuilt = true;
        this.buildingOutlines = false;
        this.applyMode(this.mode);
        onProgress?.(null);
      }
    };
    requestAnimationFrame(step);
  }

  // -- the sun --------------------------------------------------------------

  get shadowsOn(): boolean { return this.shadows; }

  /** Sun shadows on or off. Off by default: they are a presentation choice, and
   *  in hidden line they are a departure from the drawing convention. */
  setShadows(on: boolean) {
    this.shadows = on;
    this.frameSun();
    this.applyMode(this.mode);
  }

  get sunDescription(): string { return this.sunNote; }

  /**
   * Put a real sun in the sky, for a place and an instant.
   *
   * Two honest limits, both reported through `sunDescription`: the content's
   * +Y (or +Z, for Z-up content) is assumed to be north, because a viewport
   * cannot know a project's true north; and a sun below the horizon falls back
   * to a generic light rather than showing a black building.
   */
  setSun(date: Date, latitude: number, longitude: number, place = "") {
    const sun = SunPosition.compute({ date, latitude, longitude });
    const when = date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
    if (!sun.isDaytime) {
      this.sunDir.set(1, 1.6, 1.1).normalize();
      this.sunNote = `sun is below the horizon at ${when}, showing a generic light`;
    } else {
      // SunPosition works in a geographic Z-up frame (+X east, +Y north, +Z
      // sky); the scene is Y-up, so north becomes -Z
      this.sunDir.set(sun.direction.x, sun.direction.z, -sun.direction.y).normalize();
      const alt = Math.round((sun.altitude * 180) / Math.PI);
      const azi = Math.round((sun.azimuth * 180) / Math.PI);
      this.sunNote = `${place || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`}, `
        + `${when}: altitude ${alt} degrees, azimuth ${azi} from north. `
        + "The model's north is taken as its own up-plane +Y.";
    }
    this.frameSun();
  }

  /** Sun and ground, framed to whatever is in the scene. Cheap, and only run
   *  when the contents or the light change. */
  private frameSun() {
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.meshGroup);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const r = Math.max(sphere.radius, 0.5);
    this.sun.position.copy(sphere.center).addScaledVector(this.sunDir, r * 3);
    this.sun.target.position.copy(sphere.center);
    this.sun.target.updateMatrixWorld();
    this.sun.shadow.normalBias = r * 0.002;
    const cam = this.sun.shadow.camera;
    cam.left = -r * 1.2; cam.right = r * 1.2;
    cam.top = r * 1.2; cam.bottom = -r * 1.2;
    cam.near = r * 0.5; cam.far = r * 6;
    cam.updateProjectionMatrix();
    // just under the lowest thing in the content, so the contact reads
    this.ground.position.set(sphere.center.x, box.min.y - r * 0.001, sphere.center.z);
    this.ground.scale.set(r * 6, r * 6, 1);
    // A hair lower again, so it never fights the shadow catcher for the same
    // depth, and a little wider than it, so every shadow lands on it. Finite
    // on purpose: stretched to the horizon it stops reading as ground and
    // becomes a change of background colour, which anchors nothing.
    this.groundPlane.position.set(sphere.center.x, box.min.y - r * 0.004, sphere.center.z);
    this.groundPlane.scale.set(r * 7, r * 7, 1);
    this.renderer.shadowMap.needsUpdate = true;
  }

  // -- framing --------------------------------------------------------------

  /** Frame the contents: centre on the bounding box and pull back far enough
   *  that it fits the tighter of the two field-of-view axes. */
  fit(margin = 1.25) {
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.root);
    if (box.isEmpty()) return;
    this.move = null;
    box.getCenter(this.target);
    this.spherical.radius = this.radiusFor(box, margin);
    this.resize();
  }

  /**
   * Frame part of the content: a selection, a storey, one component.
   *
   * Animated, unlike `fit`, because the reader is going somewhere within a
   * model they can already see and needs to keep hold of where. The margin is
   * looser than `fit`'s for the same reason: a part framed edge to edge loses
   * the surroundings that say which part it is.
   */
  fitTo(objects: THREE.Object3D[], opts: { margin?: number; animate?: boolean } = {}) {
    if (!objects.length) return;
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    for (const o of objects) box.expandByObject(o);
    if (box.isEmpty()) return;
    const target = box.getCenter(new THREE.Vector3());
    const radius = this.radiusFor(box, opts.margin ?? 1.8);
    if (opts.animate === false) {
      this.move = null;
      this.target.copy(target);
      this.spherical.radius = radius;
      this.resize();
      return;
    }
    this.animate({ radius, target });
  }

  private radiusFor(box: THREE.Box3, margin: number): number {
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
    return fitRadius(radius, this.perspective.fov, this.perspective.aspect, margin);
  }

  private resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h);           // updates the CSS size too
    const aspect = w / h;
    this.perspective.aspect = aspect;
    this.perspective.updateProjectionMatrix();
    const f = orthoFrustum(this.spherical.radius, this.perspective.fov, aspect);
    this.orthographic.left = f.left; this.orthographic.right = f.right;
    this.orthographic.top = f.top; this.orthographic.bottom = f.bottom;
    this.orthographic.near = 0.01;
    this.orthographic.far = Math.max(100, this.spherical.radius * 10);
    this.orthographic.updateProjectionMatrix();
  }

  private tick = () => {
    this.frame = requestAnimationFrame(this.tick);
    this.step();
    const camera = this.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    camera.position.setFromSpherical(this.spherical).add(this.target);
    camera.lookAt(this.target);
    if (this.gizmo
        && (this.spherical.phi !== this.gizmoAt.phi || this.spherical.theta !== this.gizmoAt.theta)) {
      this.gizmo.update(camera, this.root.quaternion);
      this.gizmoAt = { phi: this.spherical.phi, theta: this.spherical.theta };
    }
    // after lookAt, so the labels are placed against the camera that is about
    // to be rendered rather than the one from the frame before
    camera.updateMatrixWorld();
    this.drawCallouts();
    // an orthographic frustum is a function of the orbit radius, so zooming
    // has to reshape it rather than move a camera that does not care
    if (this.projectionMode === "orthographic") {
      const aspect = (this.host.clientWidth || 1) / (this.host.clientHeight || 1);
      const f = orthoFrustum(this.spherical.radius, this.perspective.fov, aspect);
      if (f.top !== this.orthographic.top) {
        this.orthographic.left = f.left; this.orthographic.right = f.right;
        this.orthographic.top = f.top; this.orthographic.bottom = f.bottom;
        this.orthographic.updateProjectionMatrix();
      }
    }
    this.renderer.render(this.scene, camera);
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.gizmo?.dispose();
    this.callouts?.dispose();
    this.setOutlined([]);
    this.clearSection();
    this.clear();
    for (const plane of [this.ground, this.groundPlane]) {
      plane.geometry.dispose();
      (plane.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    // dispose() frees the renderer's resources but leaves the WebGL context
    // itself alive, and a browser allows only a handful of them.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
