/**
 * A viewport for looking at a building.
 *
 * ThreeRenderer draws a `Scene` of `SceneObject`s and is the right thing when
 * the library owns the model. This is the other case: an app that has already
 * built its own meshes (from IFC, from a cut list, from a supplier's geometry)
 * and wants somewhere honest to put them. It takes `THREE.Mesh`es and gives
 * back the four things every such app has otherwise rewritten:
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

/**
 * How the content is drawn. Not decoration: each answers a different question.
 *  shaded      what is it made of
 *  ghost       where does this part sit in the whole, everything else stepped
 *              back so the selection reads through the fabric
 *  hidden-line the drawing convention: white surfaces, dark creases, occluded
 *              lines hidden by the surfaces in front of them
 */
export type ViewMode = "shaded" | "ghost" | "hidden-line";

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
   * Up axis of the meshes handed over. Tekto and IFC are both Z-up, but
   * web-ifc returns geometry already turned to three.js Y-up, so an app can
   * have both in play. Getting this wrong lays a storey-height wall on the floor.
   */
  up?: "y" | "z";
  /** The corner the camera starts in. */
  view?: StandardView;
  /** A click that hit nothing reports null. A drag orbits and reports nothing. */
  onPick?: (mesh: THREE.Mesh | null, event: PointerEvent) => void;
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

/** Crease colour and weight for a mode. Hidden line draws them at full strength
 *  because in that mode the lines are the drawing. */
export function edgeStyle(mode: ViewMode): { colour: number; opacity: number } {
  if (mode === "hidden-line") return { colour: 0x1b2733, opacity: 1 };
  return { colour: 0x5a646e, opacity: mode === "ghost" ? 0.25 : 0.55 };
}

/** How a mode paints a surface whose own colour is `base`. */
export function surfaceAppearance(mode: ViewMode, base: number): Appearance {
  if (mode === "ghost") {
    // depthWrite off, so a part behind still reads through
    return { colour: 0xbfc8d2, opacity: 0.14, depthWrite: false, polygonOffset: false };
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
 * Where the camera sits for a named view, as three.js spherical angles: phi
 * from +Y, theta around Y from +Z towards +X.
 *
 * Top and bottom are held a thousandth of a radian off the pole, because a
 * camera looking exactly along its own up vector has no defined orientation
 * and the view rolls to an arbitrary angle.
 */
export function standardOrbit(view: StandardView): { phi: number; theta: number } {
  const H = Math.PI / 2;
  switch (view) {
    case "top": return { phi: 0.001, theta: 0 };
    case "bottom": return { phi: Math.PI - 0.001, theta: 0 };
    case "front": return { phi: H, theta: 0 };
    case "back": return { phi: H, theta: Math.PI };
    case "right": return { phi: H, theta: H };
    case "left": return { phi: H, theta: -H };
    default: return { phi: Math.PI / 3, theta: Math.PI / 4 };
  }
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
  private shadows = false;
  /** Where the light comes from, in three.js Y-up. Replaced by a real solar
   *  position through setSun; this is the fallback for a sun below the horizon,
   *  and for a viewport nobody has told a date. */
  private sunDir = new THREE.Vector3(1, 1.6, 1.1).normalize();
  private sunNote = "generic light, no date";

  // simple orbit: enough for looking at a building, and no extra dependency
  private target = new THREE.Vector3();
  private spherical: THREE.Spherical;

  constructor(private host: HTMLElement, private opts: ViewportOptions = {}) {
    const home = standardOrbit(opts.view ?? "iso");
    this.spherical = new THREE.Spherical(30, home.phi, home.theta);
    this.scene.background = new THREE.Color(opts.background ?? 0xf5f7fa);
    this.perspective = new THREE.PerspectiveCamera(45, 1, 0.05, 5000);
    this.orthographic = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 5000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
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

    this.setUp(opts.up ?? "y");
    this.root.add(this.meshGroup, this.outlines);
    this.scene.add(this.sky, this.sun, this.sun.target, this.ground, this.root);
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
  }

  private bind() {
    const el = this.renderer.domElement;
    let dragging = false, moved = false, lx = 0, ly = 0;
    el.addEventListener("pointerdown", (e) => {
      dragging = true; moved = false; lx = e.clientX; ly = e.clientY;
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      this.spherical.theta -= dx * 0.005;
      this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi - dy * 0.005));
      lx = e.clientX; ly = e.clientY;
    });
    el.addEventListener("pointerup", (e) => {
      dragging = false;
      if (!moved) this.pick(e);            // a drag orbits, a click selects
    });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(
        0.05, Math.min(4000, this.spherical.radius * (1 + Math.sign(e.deltaY) * 0.12)));
    }, { passive: false });
    new ResizeObserver(() => this.resize()).observe(this.host);
  }

  private pick(e: PointerEvent) {
    if (!this.opts.onPick) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObjects(this.meshGroup.children, false)[0];
    this.opts.onPick((hit?.object as THREE.Mesh) ?? null, e);
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
    this.meshGroup.clear();
    this.outlines.clear();
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
    this.projectionMode = projection;
    this.resize();
  }

  /** Point the camera at a named face, keeping the distance. */
  setView(view: StandardView) {
    const { phi, theta } = standardOrbit(view);
    this.spherical.phi = phi;
    this.spherical.theta = theta;
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
    // a different material for one mode.
    if (material.emissive) {
      material.emissive.setHex(this.mode === "hidden-line" ? look.colour : 0x000000);
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
    const balance = lightBalance(mode, this.shadows);
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
    this.renderer.shadowMap.needsUpdate = true;
  }

  // -- framing --------------------------------------------------------------

  /** Frame the contents: centre on the bounding box and pull back far enough
   *  that it fits the tighter of the two field-of-view axes. */
  fit(margin = 1.25) {
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.root);
    if (box.isEmpty()) return;
    box.getCenter(this.target);
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
    this.spherical.radius = fitRadius(radius, this.perspective.fov, this.perspective.aspect, margin);
    this.resize();
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
    const camera = this.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    camera.position.setFromSpherical(this.spherical).add(this.target);
    camera.lookAt(this.target);
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
    this.clear();
    this.renderer.dispose();
    // dispose() frees the renderer's resources but leaves the WebGL context
    // itself alive, and a browser allows only a handful of them.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
