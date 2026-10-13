/**
 * The rules a 3D view draws by — what each render mode paints, where a named view puts the
 * camera, how far back to sit to fit, where a section cuts — as plain functions, so they
 * can be tested without a GPU. `ThreeRenderer` draws by them.
 */
import * as THREE from "three";
import type { SectionRequest, Projection, StandardView } from "../scene/Scene";

/**
 * How the content is drawn. Not decoration: each answers a different question.
 *  shaded      what is it made of
 *  ghost       where does this part sit in the whole, everything else stepped
 *              back so the selection reads through the fabric
 *  hidden-line the drawing convention: white surfaces, dark creases, occluded
 *              lines hidden by the surfaces in front of them
 */
export type ViewMode = "shaded" | "ghost" | "hidden-line";

/** How one mesh is painted. Colours are hex integers, as three.js takes them. */
export interface Appearance {
  colour: number;
  opacity: number;
  depthWrite: boolean;
  polygonOffset: boolean;
}

// ---------------------------------------------------------------------------
// The decisions, as plain functions. Nothing here touches a GPU, so the rules
// a viewport draws by can be tested without one.
// ---------------------------------------------------------------------------

/** The page shaded and hidden-line are drawn on, when the host names none. */
export const DEFAULT_BACKGROUND = 0xf5f7fa;

/** Crease colour and weight for a mode. Hidden line draws them at full strength
 *  because in that mode the lines are the drawing. `background` (default: the dark ground
 *  ghost brings with it) turns ghost's pale creases dark on a light page. */
export function edgeStyle(mode: ViewMode, background: THREE.ColorRepresentation = modeBackground(mode, DEFAULT_BACKGROUND)): { colour: number; opacity: number } {
  if (mode === "hidden-line") return { colour: 0x1b2733, opacity: 1 };
  if (mode === "ghost" && luminance(background) > 0.5) return { colour: 0x1b2733, opacity: 0.6 };
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
export function sectionAppearance(mode: ViewMode): { colour: number } {
  if (mode === "ghost") return { colour: 0xe8eef6 };
  // the same near-black the hidden-line creases use, so a cut and a line agree
  return { colour: 0x1b2733 };
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
 * Where the camera sits for a named view, as a unit direction from what it looks at, in the
 * content's own axes; `up` says which of them is up. Top looks straight down (a plan), the
 * four sides look level (elevations: front from −Y in a Z-up model, from +Z in a Y-up one,
 * as three.js has it), iso sits on the diagonal with equal foreshortening on all three axes.
 * Top and bottom are held a hair off the pole, as `standardOrbit` does, so a plan keeps a
 * north instead of rolling to whatever floating point decides.
 */
export function viewDirection(view: StandardView, up: "y" | "z"): THREE.Vector3 {
  const c = Math.cos(POLE), s = Math.sin(POLE), k = 1 / Math.sqrt(3);
  const z = up === "z";
  switch (view) {
    case "top": return z ? new THREE.Vector3(0, -s, c) : new THREE.Vector3(0, c, s);
    case "bottom": return z ? new THREE.Vector3(0, -s, -c) : new THREE.Vector3(0, -c, s);
    case "front": return z ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, 1);
    case "back": return z ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, -1);
    case "right": return new THREE.Vector3(1, 0, 0);
    case "left": return new THREE.Vector3(-1, 0, 0);
    default: return z ? new THREE.Vector3(k, -k, k) : new THREE.Vector3(k, k, k);
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

/**
 * The clipping plane for a section, in the frame `axisWorld` was given in (the content's
 * axis turned into the scene's). Three.js keeps what lies on the plane's positive side, so
 * the plane faces back down the axis: everything below the cut stays, or above with `flip`.
 * Null when the cut is a fraction (`at`) and there is no content to measure.
 */
export function sectionPlane(req: SectionRequest, axisWorld: THREE.Vector3, box: THREE.Box3 | null): THREE.Plane | null {
  const a = axisWorld.clone().normalize();
  let level: number;                                   // the cut's position along a
  if (req.coordinate !== undefined) level = req.coordinate;
  else {
    if (!box || box.isEmpty()) return null;
    const centre = box.getCenter(new THREE.Vector3());
    const half = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const reach = Math.abs(a.x) * half.x + Math.abs(a.y) * half.y + Math.abs(a.z) * half.z;
    level = centre.dot(a) + (Math.min(1, Math.max(0, req.at ?? 0.5)) - 0.5) * 2 * reach;
  }
  return req.flip ? new THREE.Plane(a, -level) : new THREE.Plane(a.negate(), level);
}

/**
 * The spacing and reach of a fading grid ground, for content of a given bounding radius in
 * metres. The minor step is a power of ten, so a line always means a round number of
 * metres: 1 m under a house, 10 m under a block; every fifth line is stronger. Solid out to
 * twice the radius and gone by six times it, inside a sheet `size` across, so the model
 * always stands on something and the edge is never seen.
 */
export function groundGrid(radius: number): { minor: number; major: number; fadeFrom: number; fadeTo: number; size: number } {
  const r = Math.max(radius, 0.5);
  const minor = 10 ** Math.floor(Math.log10(r / 4));
  return { minor, major: minor * 5, fadeFrom: r * 2, fadeTo: r * 6, size: r * 14 };
}

/** The grid's line colour: a step off the background, lighter on a dark page and darker on
 *  a light one, so a grid reads as a rule on the ground and never outshouts the model. */
export function gridLineColour(background: THREE.ColorRepresentation): number {
  // mixed in sRGB, as the eye steps it: in linear light a fifth of the way to white is mid grey
  const hex = new THREE.Color(background).getHex();
  const to = luminance(background) > 0.5 ? 0 : 255;
  let out = 0;
  for (const shift of [16, 8, 0]) {
    const c = (hex >> shift) & 255;
    out |= Math.round(c + (to - c) * 0.2) << shift;
  }
  return out;
}

/** Studio light at one sun altitude (see `daylight`). */
export interface Daylight {
  sun: number; sunIntensity: number;
  sky: number; ground: number; skyIntensity: number;
  ambient: number; exposure: number;
  /** Mixed over the app's background by `backgroundAmount` (0: the app's own). */
  background: number; backgroundAmount: number;
}

// Altitude (degrees) → light, high sun first. Noon is Studio's own balance; the evening stop
// is 7DHouse's (sun 0xffc898 at ~20°, sky 0x6a7ca6, exposure 1.25, background 0x1c2536).
const DAYLIGHT: [number, Daylight][] = [
  [35, { sun: 0xffffff, sunIntensity: 2.8, sky: 0x4466aa, ground: 0x332211, skyIntensity: 0.30, ambient: 0.35, exposure: 1.00, background: 0x1c2536, backgroundAmount: 0 }],
  [20, { sun: 0xffc898, sunIntensity: 2.4, sky: 0x6a7ca6, ground: 0x3a2c22, skyIntensity: 0.32, ambient: 0.30, exposure: 1.25, background: 0x1c2536, backgroundAmount: 0.6 }],
  [5, { sun: 0xffa060, sunIntensity: 1.5, sky: 0x55648c, ground: 0x2a2018, skyIntensity: 0.30, ambient: 0.22, exposure: 1.35, background: 0x1a2232, backgroundAmount: 1 }],
  [-4, { sun: 0xff7a40, sunIntensity: 0.25, sky: 0x3a4870, ground: 0x181410, skyIntensity: 0.26, ambient: 0.14, exposure: 1.5, background: 0x121826, backgroundAmount: 1 }],
  [-12, { sun: 0x8090c0, sunIntensity: 0, sky: 0x1a2238, ground: 0x0c0c10, skyIntensity: 0.18, ambient: 0.08, exposure: 1.6, background: 0x07090f, backgroundAmount: 1 }],
];

/**
 * Studio light for a sun `altitudeDeg` above the horizon, so dusk follows from the hour
 * rather than a preset: Studio's own balance above 35°, warming and dimming through the
 * evening, a blue dusk below the horizon and night from −12°. Interpolated between stops.
 */
export function daylight(altitudeDeg: number): Daylight {
  const a = Number.isFinite(altitudeDeg) ? altitudeDeg : 90;
  if (a >= DAYLIGHT[0][0]) return { ...DAYLIGHT[0][1] };
  for (let i = 1; i < DAYLIGHT.length; i++) {
    const [hi, from] = DAYLIGHT[i - 1], [lo, to] = DAYLIGHT[i];
    if (a < lo) continue;
    const t = (hi - a) / (hi - lo);
    const mix = (x: number, y: number) => new THREE.Color(x).lerp(new THREE.Color(y), t).getHex();
    const num = (x: number, y: number) => x + (y - x) * t;
    return {
      sun: mix(from.sun, to.sun), sunIntensity: num(from.sunIntensity, to.sunIntensity),
      sky: mix(from.sky, to.sky), ground: mix(from.ground, to.ground), skyIntensity: num(from.skyIntensity, to.skyIntensity),
      ambient: num(from.ambient, to.ambient), exposure: num(from.exposure, to.exposure),
      background: mix(from.background, to.background), backgroundAmount: num(from.backgroundAmount, to.backgroundAmount),
    };
  }
  return { ...DAYLIGHT[DAYLIGHT.length - 1][1] };
}

/** Is this object drawn: itself and every parent visible? (The raycaster ignores it.) */
export function shown(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/**
 * Where to look for a callout's element: its centre first, then eight points between the
 * centre and the corners of its box. An element counts as seen if any of them is: a wall
 * whose middle is a door, or a slab whose middle is behind a beam, is still plainly on
 * screen. Most of the way out, not all of it: a corner is shared with the neighbours, and
 * a ray to it hits them as often as the element.
 */
export function calloutSamples(box: THREE.Box3): THREE.Vector3[] {
  const centre = box.getCenter(new THREE.Vector3());
  const out = [centre];
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) out.push(new THREE.Vector3(x, y, z).lerp(centre, 0.3));
    }
  }
  return out;
}

/**
 * Whether a surface hides what is behind it from a callout: the renderer's own answer. A
 * material that writes no depth (ghost, or whatever an app made see-through) hides nothing
 * on screen, so it hides no label.
 */
export function occludes(material: THREE.Material | THREE.Material[]): boolean {
  const m = Array.isArray(material) ? material[0] : material;
  return !!m && m.visible !== false && m.depthWrite !== false;
}

/** Brightness 0..1 of a colour three.js understands (hex number or CSS string). */
export function luminance(colour: THREE.ColorRepresentation): number {
  const c = new THREE.Color(colour);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
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
