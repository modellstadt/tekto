/**
 * The cameras of a ThreeRenderer: perspective and orthographic and the switch between them,
 * named views and animated moves (setView, orbitTo, fitTo), orbit-damping settling, framing,
 * and the axis widget (NavGizmo) in a corner.
 */
import * as THREE from "three";
import { Vec3 } from "../core/math/vectors";
import type { StandardView } from "../scene/Scene";
import { viewDirection, nearestAxis, easeInOut, fitRadius } from "./viewRules";
import { NavGizmo } from "./NavGizmo";
import type { RendererCore } from "./RendererCore";

/** ThreeRenderer keeps the content's axes (it turns the camera's up, not the model). */
export const NO_TURN = new THREE.Quaternion();

export class CameraRig {
  private _isOrtho = false;
  private _rotateEnabled = true;
  // Camera position at the previous renderIfNeeded(), to follow orbit damping
  // below OrbitControls' change threshold (see settleDamping).
  private _lastCamPos = new THREE.Vector3(NaN, NaN, NaN);
  private navGizmo: NavGizmo | null = null;
  // A camera move in progress: a turn about the target, and a glide of the target and the distance.
  private cameraMove: {
    from: THREE.Vector3; turn: THREE.Quaternion; fromTarget: THREE.Vector3; toTarget: THREE.Vector3;
    toDist: number; fromZoom: number; toZoom: number; start: number; ms: number;
    fromFov: number; toFov: number;
  } | null = null;
  // Standing inside (walkTo): the lens the camera had outside, given back on the way out.
  private outsideFov: number | null = null;
  private projectionListeners = new Set<(projection: "perspective" | "orthographic") => void>();

  constructor(
    private core: RendererCore,
    readonly camera: THREE.PerspectiveCamera,
    private _orthoCam: THREE.OrthographicCamera,
    gizmo: boolean | "top-left" | "top-right" | "bottom-left" | "bottom-right",
    gizmoTop = 0,   // a header strip's height: the widget goes top-right, under it
  ) {
    // The reader outranks an animation: a view turn that fights an orbit is worse than none.
    core.controls?.addEventListener("start", () => { this.cameraMove = null; });
    if (gizmo) {
      this.navGizmo = new NavGizmo(core.container, {
        corner: typeof gizmo === "string" ? gizmo : gizmoTop ? "top-right" : "bottom-right",
        offsetTop: gizmoTop,
        onAxis: (direction) => this.orbitTo(direction),
        onDrag: (dx, dy) => this.orbitBy(dx, dy),
        onSnap: () => this.orbitTo(nearestAxis(this._viewOffset())),
        onProjection: () => this.setProjection(this._isOrtho ? "perspective" : "orthographic"),
      });
    }
  }

  /** The currently active camera — perspective or orthographic. */
  get activeCamera(): THREE.Camera { return this._isOrtho ? this._orthoCam : this.camera; }

  /** Redraw the axis widget for the camera just drawn. */
  updateGizmo(): void { this.navGizmo?.update(this.activeCamera, NO_TURN); }

  worldToScreen(world: Vec3): { x: number; y: number; visible: boolean } {
    const v = new THREE.Vector3(world.x, world.y, world.z).project(this.activeCamera);
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const x = (v.x * 0.5 + 0.5) * rect.width;
    const y = (-v.y * 0.5 + 0.5) * rect.height;
    const visible = v.z > -1 && v.z < 1;
    return { x, y, visible };
  }

  setOrbitRotateEnabled(enabled: boolean): void {
    this._rotateEnabled = enabled;
    if (this.core.controls) (this.core.controls as { enableRotate?: boolean }).enableRotate = enabled;
    this.navGizmo?.setVisible(enabled);   // a flat sheet has no axes to turn to
  }

  /** The axis widget's element, or null without one. */
  get navGizmoEl(): HTMLElement | null { return this.navGizmo?.el ?? null; }

  /** False in a strict-2D view: pan and zoom only. */
  get orbitRotateEnabled(): boolean { return this._rotateEnabled; }

  /** Zoom in (`factor` > 1) or out (< 1) about the target: closer in perspective, a larger zoom in orthographic. */
  zoomBy(factor: number, opts: { animate?: boolean } = {}): void {
    if (!(factor > 0)) throw new Error(`zoomBy: factor must be > 0 (got ${factor})`);
    const target = this.core.controls?.target.clone() ?? new THREE.Vector3();
    const offset = this.activeCamera.position.clone().sub(target);
    const dist = this._isOrtho ? offset.length() : offset.length() / factor;
    const zoom = this._isOrtho ? this._orthoCam.zoom * factor : this._orthoCam.zoom;
    if (opts.animate === false) {
      this.cameraMove = null;
      if (this._isOrtho) { this._orthoCam.zoom = zoom; this._orthoCam.updateProjectionMatrix(); }
      this._placeCamera(target, offset.setLength(dist));
      return;
    }
    this._moveCamera(offset.normalize(), target, dist, zoom);
  }

  cameraState(): { projection: "perspective" | "orthographic"; position: number[]; target: number[]; up: number[]; fov: number } {
    const c = this.activeCamera;
    const t = this.core.controls?.target ?? new THREE.Vector3();
    return {
      projection: this._isOrtho ? "orthographic" : "perspective",
      position: [c.position.x, c.position.y, c.position.z],
      target: [t.x, t.y, t.z],
      up: [c.up.x, c.up.y, c.up.z],
      fov: this.camera.fov,
    };
  }


  /**
   * OrbitControls only reports moves above its EPS (~1e-3 rad), but damping keeps
   * creeping the camera after that, so the last drawn frame would lag the camera
   * slightly. Follow the creep frame by frame instead, and once the remaining
   * glide is under ~0.1 px apply it at once: the camera then rests exactly where
   * it was last drawn. Returns whether the camera moved this frame.
   */
  settleDamping(): boolean {
    const c = this.core.controls;
    if (!c) return false;
    const pos = c.object.position;
    const step = pos.distanceTo(this._lastCamPos);
    this._lastCamPos.copy(pos);
    // OrbitControls re-derives the position from its spherical angles every update, which
    // leaves float noise (~1e-13 at a top-down view): no motion, or idle would draw every frame.
    if (!(step > 1e-9 * Math.max(pos.distanceTo(c.target), 1))) return false; // also NaN on the first frame
    if (c.enableDamping && c.dampingFactor > 0) {
      // Each frame applies `dampingFactor` of what is left, so the rest of the
      // glide is step * (1 - f) / f; as an angle, divide by the orbit radius.
      const f = c.dampingFactor;
      const rest = (step * (1 - f) / f) / Math.max(pos.distanceTo(c.target), 1e-9);
      if (rest < 1e-4) {
        c.enableDamping = false;
        c.update(); // undamped update applies the remaining deltas and zeroes them
        c.enableDamping = true;
        this._lastCamPos.copy(pos);
      }
    }
    return true;
  }


  // ── Projection & View ──

  /** Compute the orthographic frustum to match the current perspective camera view distance. */
  syncOrthoFrustum() {
    const target = this.core.controls?.target ?? new THREE.Vector3();
    const dist = Math.max(this.camera.position.distanceTo(target), 0.1);
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const halfH = Math.tan(fovRad / 2) * dist;
    const halfW = halfH * this.camera.aspect;
    this._orthoCam.left   = -halfW;
    this._orthoCam.right  =  halfW;
    this._orthoCam.top    =  halfH;
    this._orthoCam.bottom = -halfH;
    this._orthoCam.near   = -dist * 10;
    this._orthoCam.far    =  dist * 10;
    this._orthoCam.updateProjectionMatrix();
  }

  setProjection(type: "perspective" | "orthographic") {
    const wasOrtho = this._isOrtho;
    this._isOrtho = type === "orthographic";
    if (this._isOrtho && !wasOrtho) {
      // Copy current perspective camera state to ortho
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this._orthoCam.zoom = 1; // fresh session — the frustum comes from the view distance
      this.syncOrthoFrustum();
    } else if (!this._isOrtho && wasOrtho) {
      // Sync back to persp position (OrbitControls already tracks target)
      this.camera.position.copy(this._orthoCam.position);
      this.camera.quaternion.copy(this._orthoCam.quaternion);
      // Ortho wheel-zoom scales _orthoCam.zoom (the position stays put) — fold
      // it into the perspective distance so the framing carries over.
      const zoom = this._orthoCam.zoom;
      if (zoom !== 1 && this.core.controls) {
        const t = this.core.controls.target;
        this.camera.position.sub(t).divideScalar(zoom).add(t);
        this._orthoCam.zoom = 1;
      }
    }
    // Swap OrbitControls to the active camera
    if (this.core.controls) {
      (this.core.controls as any).object = this.activeCamera;
      this.core.controls.update();
    }
    this.navGizmo?.setProjection(type);
    if (wasOrtho !== this._isOrtho) for (const l of this.projectionListeners) l(type);
    this.core.requestRender();
  }

  onProjection(listener: (projection: "perspective" | "orthographic") => void): () => void {
    this.projectionListeners.add(listener);
    return () => this.projectionListeners.delete(listener);
  }

  get projection(): "perspective" | "orthographic" { return this._isOrtho ? "orthographic" : "perspective"; }

  setView(view: StandardView, opts: { animate?: boolean } = {}): void {
    this.orbitTo(viewDirection(view, this.core.isZUp ? "z" : "y"), opts);
  }

  orbitTo(direction: { x: number; y: number; z: number }, opts: { animate?: boolean } = {}): void {
    // Coming out from inside: stand back to see the content, not at a walker's distance.
    const out = this._leaveInside();
    let target = this.core.controls?.target ?? new THREE.Vector3();
    const cam = this.activeCamera;
    const offset = cam.position.clone().sub(target);
    let dist = offset.length() || 10;
    if (out) { target = out.target; dist = out.dist; }
    const dir = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
    // Looking exactly along the up axis leaves the roll undefined: hold a hair off the pole,
    // towards the viewer's south, so a plan keeps its north up.
    if (Math.abs(dir.dot(cam.up)) > 1 - 1e-6) {
      dir.addScaledVector(this.core.isZUp ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, 1), 1e-3).normalize();
    }
    if (opts.animate === false || offset.lengthSq() === 0) {
      this.cameraMove = null;
      if (out) this._setFov(out.fov);
      if (this.core.controls) this.core.controls.target.copy(target);
      this._placeCamera(target, dir.multiplyScalar(dist));
      return;
    }
    this._moveCamera(dir, target.clone(), dist, this._orthoCam.zoom, out?.fov);
  }

  /**
   * Stand inside: the camera at `eye`, looking at `target`, with a wider lens (`fov`, default
   * 75°), in perspective. The way out gives the lens back: the next `setView`, `orbitTo`,
   * `fitTo` or `fitAll` restores the fov the camera had outside, and `setView` / `orbitTo`
   * stand back to see the content rather than keeping the walker's distance.
   */
  walkTo(eye: Vec3, target: Vec3, opts: { fov?: number; animate?: boolean } = {}): void {
    if (this._isOrtho) this.setProjection("perspective");
    this.outsideFov ??= this.camera.fov;
    const fov = opts.fov ?? 75;
    const t = new THREE.Vector3(target.x, target.y, target.z);
    const offset = new THREE.Vector3(eye.x, eye.y, eye.z).sub(t);
    if (offset.lengthSq() === 0) throw new Error("walkTo: the eye and the target are the same point");
    if (opts.animate === false) {
      this.cameraMove = null;
      this._setFov(fov);
      if (this.core.controls) this.core.controls.target.copy(t);
      this._placeCamera(t, offset);
      return;
    }
    this._moveCamera(offset.clone().normalize(), t, offset.length(), this._orthoCam.zoom, fov);
  }

  /** Is the camera standing inside (after `walkTo`, before a view or a fit takes it out)? */
  get inside(): boolean { return this.outsideFov !== null; }

  /** Leave the inside, if there: the lens to go back to, and a framing of the content. */
  private _leaveInside(): { fov: number; target: THREE.Vector3; dist: number } | null {
    if (this.outsideFov === null) return null;
    const fov = this.outsideFov;
    this.outsideFov = null;
    const box = this.core.contentBox();
    const sphere = box.isEmpty() ? new THREE.Sphere(new THREE.Vector3(), 5) : box.getBoundingSphere(new THREE.Sphere());
    return { fov, target: sphere.center, dist: fitRadius(Math.max(sphere.radius, 0.5), fov, this.camera.aspect, 1.3) };
  }

  private _setFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  fitTo(objects: readonly string[], opts: { margin?: number; animate?: boolean } = {}): void {
    const box = new THREE.Box3();
    for (const t of this.core.resolve(objects)) box.expandByObject(t);
    this.fitBox(box, opts);
  }

  /** Frame a world-space box, as `fitTo` frames objects. */
  fitBox(box: THREE.Box3, opts: { margin?: number; animate?: boolean } = {}): void {
    if (box.isEmpty()) return;
    const out = this._leaveInside();
    if (out) this._setFov(out.fov);                // framed with the outside lens
    const target = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
    const margin = opts.margin ?? 1.8;
    const dist = fitRadius(radius, this.camera.fov, this.camera.aspect, margin);
    // Orthographic framing is the zoom: the frustum came from the perspective distance.
    const halfH = (this._orthoCam.top - this._orthoCam.bottom) / 2;
    const halfW = (this._orthoCam.right - this._orthoCam.left) / 2;
    const zoom = Math.min(halfH, halfW) / (radius * margin);
    const dir = this._viewOffset();
    if (opts.animate === false) {
      this.cameraMove = null;
      if (this.core.controls) this.core.controls.target.copy(target);
      if (this._isOrtho) { this._orthoCam.zoom = zoom; this._orthoCam.updateProjectionMatrix(); }
      this._placeCamera(target, dir.multiplyScalar(dist));
      return;
    }
    this._moveCamera(dir, target, dist, this._isOrtho ? zoom : this._orthoCam.zoom);
  }


  /** Start a move to `dir` from `target` at `dist` (and, in orthographic, `zoom`). */
  private _moveCamera(dir: THREE.Vector3, target: THREE.Vector3, dist: number, zoom: number, fov = this.camera.fov): void {
    const from = this.core.controls?.target.clone() ?? new THREE.Vector3();
    const offset = this.activeCamera.position.clone().sub(from);
    this.cameraMove = {
      from: offset, turn: new THREE.Quaternion().setFromUnitVectors(offset.clone().normalize(), dir.clone().normalize()),
      fromTarget: from, toTarget: target, toDist: dist, fromZoom: this._orthoCam.zoom, toZoom: zoom,
      fromFov: this.camera.fov, toFov: fov,
      start: performance.now(), ms: 340,
    };
    this.core.requestRender();
  }


  /** Orbit by a pointer travel in pixels — the axis widget's drag. */
  private orbitBy(dx: number, dy: number): void {
    this.cameraMove = null;
    const target = this.core.controls?.target ?? new THREE.Vector3();
    const cam = this.activeCamera;
    const up = cam.up.clone().normalize();
    const offset = cam.position.clone().sub(target).applyAxisAngle(up, -dx * 0.005);
    const polar = offset.angleTo(up);
    const next = THREE.MathUtils.clamp(polar - dy * 0.005, 0.05, Math.PI - 0.05);
    const side = new THREE.Vector3().crossVectors(offset, up);
    if (side.lengthSq() > 0) offset.applyAxisAngle(side.normalize(), polar - next);
    this._placeCamera(target, offset);
  }


  private _placeCamera(target: THREE.Vector3, offset: THREE.Vector3): void {
    const cam = this.activeCamera;
    cam.position.copy(target).add(offset);
    cam.lookAt(target);
    this.core.controls?.update();
    this.core.requestRender();
  }


  /** Advance a camera move, if one is running. True while it moves the camera. */
  stepMove(): boolean {
    const m = this.cameraMove;
    if (!m) return false;
    const t = easeInOut((performance.now() - m.start) / m.ms);
    const q = new THREE.Quaternion().slerpQuaternions(NO_TURN, m.turn, t);
    const target = new THREE.Vector3().lerpVectors(m.fromTarget, m.toTarget, t);
    const dist = THREE.MathUtils.lerp(m.from.length(), m.toDist, t);
    if (this.core.controls) this.core.controls.target.copy(target);
    const cam = this.activeCamera;
    cam.position.copy(target).add(m.from.clone().applyQuaternion(q).setLength(dist));
    cam.lookAt(target);
    if (m.toZoom !== m.fromZoom) {
      this._orthoCam.zoom = THREE.MathUtils.lerp(m.fromZoom, m.toZoom, t);
      this._orthoCam.updateProjectionMatrix();
    }
    if (m.toFov !== m.fromFov) this._setFov(THREE.MathUtils.lerp(m.fromFov, m.toFov, t));
    if (t >= 1) this.cameraMove = null;
    return true;
  }


  /** Where the camera sits, as a direction from its target. */
  private _viewOffset(): THREE.Vector3 {
    return this.activeCamera.position.clone().sub(this.core.controls?.target ?? new THREE.Vector3()).normalize();
  }

  setCameraUp(x: number, y: number, z: number) {
    this.camera.up.set(x, y, z);
    this._orthoCam.up.set(x, y, z);
    if (this.core.controls) this.core.controls.update();
    this.core.requestRender();
  }

  setCameraPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
    this.core.requestRender();
  }

  lookAt(x: number, y: number, z: number) {
    this.camera.lookAt(x, y, z);
    if (this.core.controls) {
      this.core.controls.target.set(x, y, z);
      this.core.controls.update();
    }
    this.core.requestRender();
  }

  fitAll() {
    const out = this._leaveInside();
    if (out) this._setFov(out.fov);
    const box = new THREE.Box3();
    for (const obj of this.core.objectMap.values()) {
      if (obj.visible) {
        const b = new THREE.Box3().setFromObject(obj);
        if (!b.isEmpty()) box.union(b);
      }
    }
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());

    // Direction from current camera to its target
    const target = this.core.controls?.target.clone() ?? center;
    let dir = new THREE.Vector3().subVectors(this.camera.position, target);
    if (dir.length() < 1e-6) dir.set(1, 1, 1);
    dir.normalize();

    // Distance so the bounding sphere fills ~80% of the frustum
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const dist = (sphere.radius / Math.tan(fovRad / 2)) * 1.3;

    this.camera.position.copy(center).addScaledVector(dir, dist);
    if (this.core.controls) {
      this.core.controls.target.copy(center);
      this.core.controls.update();
    }

    if (this._isOrtho) {
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this.syncOrthoFrustum();
    }
    this.core.requestRender();
  }

  dispose(): void { this.navGizmo?.dispose(); }
}
