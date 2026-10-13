/**
 * What a pointer does in a ThreeRenderer's viewport: picking (a click, the object under a
 * point, the ground under a point), hover, drag handles, and the transform gizmo that moves
 * an object and writes its transform back to the Scene.
 */
import * as THREE from "three";
// @ts-ignore — TransformControls typings vary across Three.js versions
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Vec3 } from "../core/math/vectors";
import type { RendererCore } from "./RendererCore";
import type { ObjectBuilder } from "./ObjectBuilder";
import type { Marks } from "./Marks";

export type GizmoMode = "translate" | "rotate" | "scale" | "none";

/** Modifier keys held during a pick (a click on the viewport). */
export interface PickInfo { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean; }

export class Pointer {
  private raycaster = new THREE.Raycaster();
  private pickEnabled = false;
  private pickListeners = new Set<(id: string | null, info: PickInfo) => void>();
  private transformControls: TransformControls | null = null;
  private gizmoMode: GizmoMode = "translate";
  gizmoAttachedId: string | null = null;
  private pointerDown: { x: number; y: number } | null = null;

  // ── Drag handles ──
  private dragHandles = new Map<string, THREE.Mesh>();
  private dragHandleConstraints = new Map<string, (x: number, y: number, z: number) => [number, number, number]>();
  private dragHandlePlanes = new Map<string, "ground" | "screen">();
  private dragHandleMoveCb:  ((name: string, x: number, y: number, z: number) => void) | null = null;
  private dragHandleEndCb:   ((name: string) => void) | null = null;
  private dragHandlePickCb:  ((name: string | null) => void) | null = null;
  private activeDragHandle: string | null = null;
  private selectedDragHandle: string | null = null;
  private dragPlane = new THREE.Plane();
  private dragSeenThisRun = new Set<string>();

  // ── Hover ──
  private hoverListeners = new Set<(id: string | null) => void>();
  private hovered: string | null = null;
  private hoverAt = 0;

  constructor(private core: RendererCore, private builder: ObjectBuilder, private marks: Marks) {}

  setPickEnabled(enabled: boolean): void {
    if (enabled === this.pickEnabled) return;
    this.pickEnabled = enabled;
    const dom = this.core.renderer.domElement;
    if (enabled) {
      dom.addEventListener("pointerdown", this.onPointerDown);
      dom.addEventListener("pointerup",   this.onPointerUp);
    } else {
      dom.removeEventListener("pointerdown", this.onPointerDown);
      dom.removeEventListener("pointerup",   this.onPointerUp);
      this.pointerDown = null;
    }
  }

  onPick(listener: (id: string | null, info: PickInfo) => void): () => void {
    this.pickListeners.add(listener);
    return () => this.pickListeners.delete(listener);
  }


  private onPointerDown = (e: PointerEvent) => {
    // Drag handle pick? — start dragging it, don't fire normal pick.
    const handleName = this.dragHandleHitTest(e.clientX, e.clientY);
    if (handleName) {
      e.preventDefault();
      this.activeDragHandle = handleName;
      // Select the handle on pointerdown (regardless of click-vs-drag).
      this.setHandleSelected(handleName);
      if (this.core.controls) this.core.controls.enabled = false;
      // Set up a drag plane through the handle's current position. Default:
      // perpendicular to the world up axis (the ground plane). "screen":
      // perpendicular to the camera view direction, so the handle drags in the
      // view plane (e.g. arc + elevation in a side view) instead of the ground.
      const handle = this.dragHandles.get(handleName)!;
      let normal: THREE.Vector3;
      if (this.dragHandlePlanes.get(handleName) === "screen") {
        normal = new THREE.Vector3();
        this.core.activeCamera.getWorldDirection(normal);
      } else {
        normal = this.core.isZUp ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      }
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, handle.position);
      const dom = this.core.renderer.domElement;
      dom.addEventListener("pointermove", this.onPointerMoveDragging);
      dom.addEventListener("pointerup",   this.onPointerUpDragging,   { once: true });
      dom.setPointerCapture(e.pointerId);
      return;
    }
    this.pointerDown = { x: e.clientX, y: e.clientY };
  };


  private onPointerUp = (e: PointerEvent) => {
    if (!this.pointerDown) return;
    const dx = e.clientX - this.pointerDown.x;
    const dy = e.clientY - this.pointerDown.y;
    this.pointerDown = null;
    // Treat as a click only if pointer barely moved.
    if (dx * dx + dy * dy > 25) return;
    // Ignore clicks while the gizmo is being dragged.
    if (this.transformControls?.dragging) return;

    // Click on the viewport (not on a drag handle) — clear any prior handle
    // selection so the new pick wins focus.
    if (this.selectedDragHandle !== null) this.setHandleSelected(null);

    const id = this.pickAt(e.clientX, e.clientY);
    const info: PickInfo = { shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey, altKey: e.altKey };
    for (const l of this.pickListeners) l(id, info);
  };


  private onPointerMoveDragging = (e: PointerEvent) => {
    if (!this.activeDragHandle) return;
    const hit = this.raycastPlane(e.clientX, e.clientY, this.dragPlane);
    if (!hit) return;
    const handle = this.dragHandles.get(this.activeDragHandle);
    if (!handle) return;

    // Apply the per-handle constraint, if any (e.g., snap to a curve).
    let x = hit.x, y = hit.y, z = hit.z;
    const constrain = this.dragHandleConstraints.get(this.activeDragHandle);
    if (constrain) {
      const c = constrain(x, y, z);
      x = c[0]; y = c[1]; z = c[2];
    }

    handle.position.set(x, y, z);
    this.core.requestRender();
    if (this.dragHandleMoveCb) {
      this.dragHandleMoveCb(this.activeDragHandle, x, y, z);
    }
  };


  private onPointerUpDragging = (_e: PointerEvent) => {
    const name = this.activeDragHandle;
    this.activeDragHandle = null;
    if (this.core.controls) this.core.controls.enabled = true;
    const dom = this.core.renderer.domElement;
    dom.removeEventListener("pointermove", this.onPointerMoveDragging);
    // Fire the pick event regardless — click-without-drag still counts.
    if (name && this.dragHandlePickCb) this.dragHandlePickCb(name);
    if (name && this.dragHandleEndCb)  this.dragHandleEndCb(name);
  };


  /** Returns the handle name under (clientX, clientY) or null. */
  private dragHandleHitTest(clientX: number, clientY: number): string | null {
    if (this.dragHandles.size === 0) return null;
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.core.activeCamera);
    const meshes = [...this.dragHandles.values()];
    const hits = this.raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? (hits[0].object.userData.handleName as string) : null;
  }


  /** Raycast at (clientX, clientY) against a Three.Plane; returns the intersection point. */
  private raycastPlane(clientX: number, clientY: number, plane: THREE.Plane): THREE.Vector3 | null {
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.core.activeCamera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  }

  setDragHandleCallbacks(
    onMove: (name: string, x: number, y: number, z: number) => void,
    onEnd?:  (name: string) => void,
    onPick?: (name: string | null) => void,
  ): void {
    this.dragHandleMoveCb = onMove;
    this.dragHandleEndCb  = onEnd  ?? null;
    this.dragHandlePickCb = onPick ?? null;
  }

  beginDragHandleSweep(): void { this.dragSeenThisRun.clear(); }

  upsertDragHandle(
    name: string, x: number, y: number, z: number,
    color = "#38d9a9", size = 0.12,
    constrain?: (x: number, y: number, z: number) => [number, number, number],
    plane?: "ground" | "screen",
  ): void {
    this.dragSeenThisRun.add(name);
    let mesh = this.dragHandles.get(name);
    if (!mesh) {
      const geo = new THREE.SphereGeometry(size, 16, 12);
      const mat = this.builder.makeMaterial({
        color, emissive: color, emissiveIntensity: 0.55,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.userData.handleName = name;
      mesh.userData.baseSize = size;
      mesh.userData.baseColor = color;
      mesh.renderOrder = 999;
      (mesh.material as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial)).depthTest = false;
      this.core.threeScene.add(mesh);
      this.dragHandles.set(name, mesh);
    } else {
      const mat = mesh.material as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial);
      if (mat.color.getHexString() !== color.replace(/^#/, "").toLowerCase()) {
        mat.color.set(color);
        mat.emissive.set(color);
        mesh.userData.baseColor = color;
      }
      const cur = (mesh.geometry as THREE.SphereGeometry).parameters?.radius;
      if (cur !== size) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.SphereGeometry(size, 16, 12);
        mesh.userData.baseSize = size;
      }
    }
    if (constrain) this.dragHandleConstraints.set(name, constrain);
    else           this.dragHandleConstraints.delete(name);
    if (plane) this.dragHandlePlanes.set(name, plane);
    else       this.dragHandlePlanes.delete(name);
    if (this.activeDragHandle !== name) mesh.position.set(x, y, z);

    // Re-apply selection styling if this happens to be the selected handle.
    if (this.selectedDragHandle === name) this.applyHandleStyle(name, true);
    this.core.requestRender();
  }

  endDragHandleSweep(): void {
    for (const [name, mesh] of this.dragHandles) {
      if (!this.dragSeenThisRun.has(name)) {
        this.core.threeScene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.dragHandles.delete(name);
        this.dragHandleConstraints.delete(name);
        this.dragHandlePlanes.delete(name);
        if (this.selectedDragHandle === name) this.selectedDragHandle = null;
        this.core.requestRender();
      }
    }
  }

  getSelectedHandle(): string | null { return this.selectedDragHandle; }

  getActiveDragHandle(): string | null { return this.activeDragHandle; }

  setHandleSelected(name: string | null): void {
    if (this.selectedDragHandle === name) return;
    if (this.selectedDragHandle) this.applyHandleStyle(this.selectedDragHandle, false);
    this.selectedDragHandle = name;
    if (name) this.applyHandleStyle(name, true);
  }


  private applyHandleStyle(name: string, selected: boolean): void {
    const mesh = this.dragHandles.get(name);
    if (!mesh) return;
    const mat = mesh.material as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial);
    if (selected) {
      mat.emissiveIntensity = 1.0;
      mesh.scale.setScalar(1.6);
    } else {
      mat.emissiveIntensity = 0.55;
      mesh.scale.setScalar(1.0);
    }
    this.core.requestRender();
  }

  pickAt(clientX: number, clientY: number): string | null {
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.core.activeCamera);
    // Thin lines need a hit tolerance, or they're near-impossible to click. Scale it to
    // the view: ortho → from the camera frustum height; perspective → a small world default.
    const cam = this.core.activeCamera as THREE.OrthographicCamera & THREE.PerspectiveCamera;
    this.raycaster.params.Line.threshold =
      cam.isOrthographicCamera ? Math.max(1e-3, (cam.top - cam.bottom) / cam.zoom * 0.012) : 0.08;
    const pickable: THREE.Object3D[] = [];
    for (const t of this.core.objectMap.values()) {
      if (t.userData.pickable !== false) pickable.push(t);
    }
    const hits = this.raycaster.intersectObjects(pickable, true);
    for (const h of hits) {
      if (this.marks.cutAway(h.point)) continue;
      let cur: THREE.Object3D | null = h.object;
      while (cur && !cur.userData.geomId) cur = cur.parent;
      if (cur?.userData.geomId) return cur.userData.geomId as string;
    }
    return null;
  }

  hitAt(clientX: number, clientY: number): { id: string; point: Vec3 } | null {
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.core.activeCamera);
    const cam = this.core.activeCamera as THREE.OrthographicCamera & THREE.PerspectiveCamera;
    this.raycaster.params.Line.threshold =
      cam.isOrthographicCamera ? Math.max(1e-3, (cam.top - cam.bottom) / cam.zoom * 0.012) : 0.08;
    const targets: THREE.Object3D[] = [];
    for (const t of this.core.objectMap.values()) if (t.visible) targets.push(t);
    const hits = this.raycaster.intersectObjects(targets, true);
    for (const h of hits) {
      if (this.marks.cutAway(h.point)) continue;
      let cur: THREE.Object3D | null = h.object;
      let shown = true;
      while (cur && !cur.userData.geomId) { if (!cur.visible) shown = false; cur = cur.parent; }
      if (shown && cur?.userData.geomId) {
        return { id: cur.userData.geomId as string, point: new Vec3(h.point.x, h.point.y, h.point.z) };
      }
    }
    return null;
  }

  groundAt(clientX: number, clientY: number): Vec3 | null {
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.core.activeCamera);
    const n = this.core.isZUp ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(new THREE.Plane(n, 0), hit) ? new Vec3(hit.x, hit.y, hit.z) : null;
  }

  setGizmoMode(mode: GizmoMode): void {
    this.gizmoMode = mode;
    if (mode === "none") {
      this.detachGizmo();
    } else {
      this.ensureGizmo();
      this.transformControls?.setMode(mode);
      if (this.gizmoAttachedId) this.attachGizmo(this.gizmoAttachedId);
    }
    this.core.requestRender();
  }

  getGizmoMode(): GizmoMode { return this.gizmoMode; }

  attachGizmo(id: string): void {
    const t = this.core.objectMap.get(id);
    if (!t) { this.detachGizmo(); return; }
    if (this.gizmoMode === "none") { this.gizmoAttachedId = id; return; }
    this.ensureGizmo();
    this.transformControls!.attach(t);
    this.gizmoAttachedId = id;
    this.core.requestRender();
  }

  detachGizmo(): void {
    this.transformControls?.detach();
    this.gizmoAttachedId = null;
    this.core.requestRender();
  }


  private ensureGizmo(): void {
    if (this.transformControls) return;
    const tc = new TransformControls(this.core.activeCamera, this.core.renderer.domElement);
    tc.setMode(this.gizmoMode === "none" ? "translate" : this.gizmoMode);
    // Disable OrbitControls during gizmo drag, and write changes back to Scene.
    tc.addEventListener("dragging-changed", (e) => {
      const dragging = e.value === true;
      if (this.core.controls) this.core.controls.enabled = !dragging;
      if (!dragging && this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    tc.addEventListener("objectChange", () => {
      if (this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    // Axis hover highlight and drags change the picture without a scene event.
    tc.addEventListener("change", () => this.core.requestRender());
    // three ≥ r169: TransformControls is no longer an Object3D — its visible
    // gizmo is `getHelper()`. Adding `tc` itself throws ("not an instance of
    // THREE.Object3D") and no gizmo appears. Older three: add the controls.
    this.core.threeScene.add(typeof tc.getHelper === "function" ? tc.getHelper() : (tc as unknown as THREE.Object3D));
    this.transformControls = tc;
  }


  /** Read the gizmo'd Three.Object3D's transform and write it back into the SceneObject. */
  private writeBackTransform(id: string): void {
    const t = this.core.objectMap.get(id);
    if (!t) return;
    const obj = this.core.gScene.get(id);
    if (!obj) return;
    const transform = {
      position: new Vec3(t.position.x, t.position.y, t.position.z),
      rotation: new Vec3(t.rotation.x, t.rotation.y, t.rotation.z),
      scale:    new Vec3(t.scale.x,    t.scale.y,    t.scale.z),
    };
    // Suspend events so this echo doesn't re-render and detach the gizmo.
    this.core.gScene.withSuspendedEvents(() => {
      this.core.gScene.update(id, { transform });
    });
  }

  onHover(listener: (id: string | null) => void): () => void {
    const dom = this.core.renderer.domElement;
    if (this.hoverListeners.size === 0) { dom.addEventListener("pointermove", this.onHoverMove); dom.addEventListener("pointerleave", this.onHoverLeave); }
    this.hoverListeners.add(listener);
    return () => {
      this.hoverListeners.delete(listener);
      if (this.hoverListeners.size === 0) { dom.removeEventListener("pointermove", this.onHoverMove); dom.removeEventListener("pointerleave", this.onHoverLeave); }
    };
  }

  private onHoverMove = (e: PointerEvent) => {
    if (e.buttons !== 0) return;
    const now = performance.now();
    if (now - this.hoverAt < 40) return;
    this.hoverAt = now;
    this._hover(this.pickAt(e.clientX, e.clientY));
  };

  private onHoverLeave = () => this._hover(null);

  private _hover(id: string | null): void {
    if (id === this.hovered) return;
    this.hovered = id;
    for (const l of this.hoverListeners) l(id);
  }

  pick(screenX: number, screenY: number): { id: string; point: THREE.Vector3 } | null {
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.core.camera);

    const targets = [...this.core.objectMap.values()];
    const hits = raycaster.intersectObjects(targets, true);

    for (const hit of hits) {
      if (this.marks.cutAway(hit.point)) continue;
      let obj: THREE.Object3D | null = hit.object;
      while (obj && !obj.userData.geomId) obj = obj.parent;
      if (obj?.userData.geomId) {
        return { id: obj.userData.geomId, point: hit.point };
      }
    }
    return null;
  }

  screenToPlane(
    screenX: number, screenY: number,
    plane?: THREE.Plane
  ): THREE.Vector3 | null {
    const defaultNormal = this.core.isZUp ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const p = plane ?? new THREE.Plane(defaultNormal, 0);
    const rect = this.core.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.core.camera);
    const target = new THREE.Vector3();
    return raycaster.ray.intersectPlane(p, target) ? target : null;
  }

  dispose(): void {
    this.core.renderer.domElement.removeEventListener("pointermove", this.onHoverMove);
    this.core.renderer.domElement.removeEventListener("pointerleave", this.onHoverLeave);
  }
}
