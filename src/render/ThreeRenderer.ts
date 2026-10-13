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

import * as THREE from "three";
// @ts-ignore — OrbitControls typings vary across Three.js versions
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Scene as GScene, SceneObject, SceneEvent, type SectionRequest, type StandardView } from "../scene/Scene";
import { Vec3 } from "../core/math/vectors";
import type { CalloutItem } from "./Callouts";
import type { RendererCore } from "./RendererCore";
import { ObjectBuilder } from "./ObjectBuilder";
import { Lighting } from "./Lighting";
import { CameraRig } from "./CameraRig";
import { Pointer, type GizmoMode, type PickInfo } from "./Pointer";
import { Marks } from "./Marks";

export type { GizmoMode, PickInfo } from "./Pointer";

export interface ThreeRendererConfig {
  antialias: boolean;
  backgroundColor: number;
  showGrid: boolean;
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
}

// Style keys that never change the three.js object: layer is metadata, WebGL
// lines ignore lineWidth, noExport only filters exports.
const INERT_STYLE_KEYS = new Set(["layer", "lineWidth", "noExport"]);

const DEFAULTS: ThreeRendererConfig = {
  antialias: true,
  backgroundColor: 0x0a0b14,
  showGrid: true,
  gridSize: 20,
  gridDivisions: 20,
  showAxes: true,
  axesSize: 3,
  enableOrbitControls: true,
  enableDamping: true,
  cameraPosition: [6, 8, 10],
  cameraTarget: [0, 0, 0],
  fov: 55,
  up: "y",
  navGizmo: false,
};

/** How long a frame may spend building crease lines before it draws. */
const EDGE_BUDGET_MS = 8;

export class ThreeRenderer {
  readonly threeScene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls?: OrbitControls;

  /** The currently active camera — perspective or orthographic. */
  get activeCamera(): THREE.Camera { return this.rig.activeCamera; }

  private gScene: GScene;
  private config: ThreeRendererConfig;
  private isZUp: boolean;
  private objectMap = new Map<string, THREE.Object3D>();
  private unsub: (() => void) | null = null;
  private rafId = 0;
  // Render on demand: set by anything that can change the picture (scene events,
  // camera, lights, handles, resize); cleared by a draw. See renderIfNeeded().
  private _needsRender = true;
  // When true, line/point "helper" objects are hidden (e.g. a clean render view
  // that shows only solid meshes). Solid geometry is unaffected.
  private hideHelpers = false;
  private gridHelper: THREE.Object3D | null = null;
  private axesHelper: THREE.Object3D | null = null;
  // Raw THREE objects (e.g. loaded glTF scenes) added by the app, kept across
  // sketch re-runs (clearThree only touches objectMap-managed objects).
  private externalObjects = new Map<string, THREE.Object3D>();
  private container: HTMLElement;
  private resizeObserver: ResizeObserver | null = null;

  // The parts (see the file header).
  private core: RendererCore;
  private lighting: Lighting;
  private builder: ObjectBuilder;
  private marks: Marks;
  private rig: CameraRig;
  private pointer: Pointer;

  constructor(gScene: GScene, container: HTMLElement, config?: Partial<ThreeRendererConfig>) {
    this.gScene = gScene;
    this.container = container;
    this.config = { ...DEFAULTS, ...config };
    this.isZUp = this.config.up === "z";
    const cfg = this.config;

    // Three.js scene
    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(cfg.backgroundColor);

    // Camera — perspective
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(cfg.fov, aspect, 0.1, 1000);
    if (this.isZUp) this.camera.up.set(0, 0, 1);
    this.camera.position.set(...cfg.cameraPosition);
    this.camera.lookAt(...cfg.cameraTarget);

    // Camera — orthographic (initialized to match perspective frustum)
    const orthoCam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.01, 2000);
    if (this.isZUp) orthoCam.up.set(0, 0, 1);
    orthoCam.position.set(...cfg.cameraPosition);
    orthoCam.lookAt(...cfg.cameraTarget);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: cfg.antialias });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // What the parts share. Getters, because controls and the rig come later.
    const self = this;
    this.core = {
      gScene, threeScene: this.threeScene, renderer: this.renderer, container, isZUp: this.isZUp,
      objectMap: this.objectMap, externalObjects: this.externalObjects, config: this.config, camera: this.camera,
      get controls() { return self.controls; },
      get activeCamera() { return self.rig.activeCamera; },
      requestRender: () => this.requestRender(),
      resolve: (objects) => this.resolve(objects),
      contentBox: () => this.contentBox(),
    };

    this.lighting = new Lighting(this.core);
    this.marks = new Marks(this.core);
    // Apply whatever lighting mode the scene was last set to.
    this.lighting.applyMode(this.gScene.lightingMode);
    this.builder = new ObjectBuilder(this.core, this.lighting);

    // Helpers
    if (cfg.showGrid) {
      const grid = new THREE.GridHelper(cfg.gridSize, cfg.gridDivisions, 0x3a3c5a, 0x2a2c4a);
      if (this.isZUp) grid.rotation.x = Math.PI / 2;
      this.gridHelper = grid;
      this.threeScene.add(grid);
    }
    if (cfg.showAxes) {
      this.axesHelper = new THREE.AxesHelper(cfg.axesSize);
      this.threeScene.add(this.axesHelper);
    }

    // Orbit controls
    if (cfg.enableOrbitControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = cfg.enableDamping;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(...cfg.cameraTarget);
      // Fires on user orbit/pan/zoom (the pointer handlers call update() themselves).
      this.controls.addEventListener("change", () => this.requestRender());
    }

    this.rig = new CameraRig(this.core, this.camera, orthoCam, cfg.navGizmo);
    this.pointer = new Pointer(this.core, this.builder, this.marks);

    // A restored context comes back blank; nothing else would ask for a draw.
    this.renderer.domElement.addEventListener("webglcontextrestored", () => this.requestRender());

    // Resize
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    // Subscribe to scene events
    this.unsub = gScene.on(e => this.handleEvent(e));

    // Sync existing objects
    for (const obj of gScene.all()) this.addToThree(obj);
  }

  // ── Event Handling ──

  private handleEvent(event: SceneEvent) {
    this._needsRender = true;
    this.lighting.sunDirty = true;
    this.marks.calloutsDirty = true;
    switch (event.type) {
      case "object:add": {
        const obj = this.gScene.get(event.id);
        if (obj) this.addToThree(obj);
        break;
      }
      case "object:remove":
        this.removeFromThree(event.id);
        break;
      case "object:style": {
        // Fast path: colour, opacity, visibility and layer patch the existing
        // three object — chained `.color().layer()` calls on every object of a
        // run, and display passes over many objects, stay cheap. Anything else
        // (dash, tube radius, label, mesh options …) rebuilds it.
        const t = this.objectMap.get(event.id);
        const srcObj = this.gScene.get(event.id);
        if (t && srcObj && this._restyleInPlace(t, srcObj, event.style)) break;
        this.removeFromThree(event.id);
        if (srcObj) this.addToThree(srcObj);
        break;
      }
      case "object:update": {
        const t = this.objectMap.get(event.id);
        const obj = this.gScene.get(event.id);
        // pickTag / pickable are picking metadata: no rebuild.
        if (t && obj && Object.keys(event.changes).every(k => k === "pickTag" || k === "pickable")) {
          t.userData.pickable = obj.pickable !== false;
          break;
        }
        this.removeFromThree(event.id);
        if (obj) this.addToThree(obj);
        break;
      }
      case "scene:clear":
        this.clearThree();
        break;
      case "scene:renderMode":
        this.rebuildAllMeshes();
        break;
      case "scene:lightingMode":
        this.lighting.applyMode(event.mode);
        // Materials change Phong↔Standard with the mode — rebuild meshes
        // so existing objects re-create their materials in the new family.
        this.rebuildAllMeshes();
        break;
      case "scene:environment":
        this.lighting.applyEnvironment(event.enabled);
        break;
    }
  }

  // ── Object Conversion ──

  private addToThree(obj: SceneObject) {
    const t = this.builder.convert(obj);
    if (!t) return;
    t.userData.geomId = obj.id;
    t.userData.pickable = obj.pickable !== false;
    t.userData.objType = obj.type;
    t.userData.styleVisible = obj.style.visible;
    t.visible = obj.style.visible && !(this.hideHelpers && this._isHelper(obj.type));
    this.applyTransform(t, obj);
    // Apply the current lighting's shadow flags so freshly-added meshes
    // immediately participate in the shadow map (Studio mode) without
    // waiting for the next `applyMode` pass. Cheap; just two
    // booleans per mesh.
    if (this.lighting.currentLighting === "studio") {
      // A ghost is see-through: its shadow would read as dirt on the drawing.
      const cast = this.gScene.renderMode !== "ghost";
      t.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow    = cast;
          child.receiveShadow = true;
        }
      });
    }
    if (this.marks.sectionClip) this.marks.dressSection(t);
    this.threeScene.add(t);
    this.objectMap.set(obj.id, t);
    // If this is the currently selected object, reattach the gizmo.
    if (this.pointer.gizmoAttachedId === obj.id) this.pointer.attachGizmo(obj.id);
  }

  /** Apply a style patch to the existing three object if it only touches colour,
   *  opacity, visibility or inert keys. False → the caller rebuilds the object. */
  private _restyleInPlace(t: THREE.Object3D, obj: SceneObject, patch: Partial<SceneObject["style"]>): boolean {
    let paint = false;
    for (const k of Object.keys(patch)) {
      if (k === "color" || k === "opacity") paint = true;
      else if (k !== "visible" && !INERT_STYLE_KEYS.has(k)) return false;
    }
    if (paint && !this._repaint(t, obj)) return false;
    if ("visible" in patch) {
      t.userData.styleVisible = obj.style.visible;
      t.visible = obj.style.visible && !(this.hideHelpers && this._isHelper(obj.type));
    }
    return true;
  }

  /** Set colour + opacity on a single-material object exactly as convert() would build
   *  it: lines (segment, polyline, circle), tube segments and unlabelled points. Meshes,
   *  polygons, planes and labelled points have mode- or label-dependent materials → false. */
  private _repaint(t: THREE.Object3D, obj: SceneObject): boolean {
    const s = obj.style;
    const tube = obj.type === "segment" && !!s.tubeRadius && s.tubeRadius > 0;
    const line = !tube && (obj.type === "segment" || obj.type === "polyline" || obj.type === "circle");
    const solid = tube || (obj.type === "point" && !s.label);
    const m = (t as THREE.Mesh).material;
    if ((!line && !solid) || !m || Array.isArray(m)) return false;
    const mat = m as THREE.LineBasicMaterial | THREE.MeshPhongMaterial;
    // makeMaterial lets the studio colour override win on solids.
    mat.color.set(solid && this.lighting.currentLighting === "studio" ? (this.lighting.studioColor ?? s.color) : s.color);
    if (obj.type === "point") {
      // While selected, the highlight owns emissive; update what it restores to.
      const sel = this.marks.selectionMaterials.get(t.uuid);
      (sel ? sel.oldEmissive : (mat as THREE.MeshPhongMaterial).emissive).set(s.color);
    }
    const transparent = s.opacity < 1;
    if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true; }
    mat.opacity = s.opacity;
    return true;
  }

  /** Apply `obj.transform` (position/rotation/scale) to a Three.Object3D. */
  private applyTransform(t: THREE.Object3D, obj: SceneObject) {
    const tr = obj.transform;
    if (!tr) return;
    if (tr.position) t.position.set(tr.position.x, tr.position.y, tr.position.z);
    if (tr.rotation) t.rotation.set(tr.rotation.x, tr.rotation.y, tr.rotation.z);
    if (tr.scale)    t.scale.set(tr.scale.x, tr.scale.y, tr.scale.z);
  }

  private removeFromThree(id: string) {
    const t = this.objectMap.get(id);
    if (!t) return;
    this.marks.dropOutlines(t);
    this.threeScene.remove(t);
    this.disposeObject(t);
    this.objectMap.delete(id);
  }

  private clearThree() {
    this.marks.dropOutlines(null);
    for (const [, t] of this.objectMap) {
      this.threeScene.remove(t);
      this.disposeObject(t);
    }
    this.objectMap.clear();
  }

  /** Rebuild all mesh objects (called when render mode changes). */
  private rebuildAllMeshes() {
    for (const obj of this.gScene.all()) {
      if (obj.type !== "mesh") continue;
      this.removeFromThree(obj.id);
      this.addToThree(obj);
    }
  }

  // Line/point "helper" object types (vs solid meshes/polygons/planes).
  private _isHelper(type: unknown): boolean {
    return type === "segment" || type === "polyline" || type === "point" || type === "circle";
  }

  /**
   * Add a raw THREE.Object3D (e.g. a loaded glTF/GLB scene) to the renderer,
   * persisting across sketch re-runs. Re-adding the same id replaces it.
   * Meshes are flagged to cast + receive shadows (visible in Studio lighting).
   */
  addExternalObject(obj: THREE.Object3D, id: string): void {
    const prev = this.externalObjects.get(id);
    if (prev) this.threeScene.remove(prev);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    this.externalObjects.set(id, obj);
    this.threeScene.add(obj);
    this.requestRender();
  }

  removeExternalObject(id: string): void {
    const prev = this.externalObjects.get(id);
    if (prev) { this.threeScene.remove(prev); this.externalObjects.delete(id); }
    this.requestRender();
  }

  /**
   * Show/hide line + point "helper" objects (axes, construction lines, markers,
   * labels). Solid meshes are unaffected. Applies immediately to existing
   * objects and to all future ones until changed.
   */
  setHelpersVisible(visible: boolean): void {
    this.hideHelpers = !visible;
    if (this.gridHelper) this.gridHelper.visible = visible;
    if (this.axesHelper) this.axesHelper.visible = visible;
    this.threeScene.traverse((o) => {
      if (this._isHelper(o.userData?.objType)) {
        o.visible = visible ? (o.userData.styleVisible ?? true) : false;
      }
    });
    this.requestRender();
  }

  // ── Get Three.js object for a scene ID ──

  getThreeObject(id: string): THREE.Object3D | undefined {
    return this.objectMap.get(id);
  }

  /** World-space bounds of a scene object as currently rendered, or null if empty/unknown. */
  objectBounds(id: string): { min: Vec3; max: Vec3 } | null {
    const t = this.objectMap.get(id);
    if (!t) return null;
    const b = new THREE.Box3().setFromObject(t);
    if (b.isEmpty()) return null;
    return { min: new Vec3(b.min.x, b.min.y, b.min.z), max: new Vec3(b.max.x, b.max.y, b.max.z) };
  }

  /** Is the scene object currently shown (its own style and every parent)? */
  isObjectShown(id: string): boolean {
    let cur: THREE.Object3D | null = this.objectMap.get(id) ?? null;
    if (!cur) return false;
    for (; cur; cur = cur.parent) if (!cur.visible) return false;
    return true;
  }

  /** Render now and read the canvas back as a PNG data URL. Must stay synchronous: without
   *  `preserveDrawingBuffer` the buffer is only readable in the same task as the draw. */
  snapshotPng(): string {
    this.builder.buildEdges(Infinity);                // a snapshot shows the finished drawing
    this.render();
    return this.renderer.domElement.toDataURL("image/png");
  }

  /** Bounds of what the scene shows. */
  private contentBox(): THREE.Box3 {
    const box = new THREE.Box3();
    for (const t of this.objectMap.values()) if (t.visible) box.expandByObject(t);
    return box;
  }

  // ── Render ──

  /** Draw now, unconditionally. */
  render() {
    this.rig.stepMove();
    this.builder.buildEdges(EDGE_BUDGET_MS);
    this.controls?.update();
    this._draw();
  }

  private _draw(): void {
    if (this.lighting.sunDirty && this.lighting.currentLighting === "studio") this.lighting.fitSun();
    this.marks.followOutlines();
    this.renderer.render(this.threeScene, this.activeCamera);
    this._needsRender = false;
    this.rig.updateGizmo();
    this.marks.drawCallouts();
  }

  /**
   * Ask for a draw on the next `renderIfNeeded()`. Scene events, the camera API,
   * lights, drag handles, the gizmo, orbit controls and resizes already ask; call
   * it after changing three.js objects directly (e.g. one added with
   * `addExternalObject`).
   */
  requestRender(): void {
    this._needsRender = true;
  }

  /**
   * Draw only if something changed since the last draw, or while orbit damping
   * is still moving the camera. Returns whether it drew. An idle scene of 10k
   * objects otherwise costs a full draw on every animation frame.
   */
  renderIfNeeded(): boolean {
    const turning = this.rig.stepMove();
    this.builder.buildEdges(EDGE_BUDGET_MS);
    // update() advances damping and reports whether the camera moved.
    const moved = this.controls?.update() ?? false;
    const settling = this.rig.settleDamping();
    if (!moved && !settling && !turning && !this._needsRender) return false;
    this._draw();
    return true;
  }

  startLoop(): () => void {
    let running = true;
    const loop = () => {
      if (!running) return;
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(this.rafId); };
  }

  // ── Resize ──

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.rig.syncOrthoFrustum();
    this.renderer.setSize(w, h);
    // setSize clears the canvas: draw now, not next frame, so it never shows blank.
    this.render();
  }

  /** Scene ids, or record keys resolved through the scene, to the three objects drawn for them. */
  private resolve(objects: readonly string[]): THREE.Object3D[] {
    const out: THREE.Object3D[] = [];
    for (const s of objects) {
      const t = this.objectMap.get(s);
      if (t) { out.push(t); continue; }
      for (const o of this.gScene.byKey(s)) { const k = this.objectMap.get(o.id); if (k) out.push(k); }
    }
    return out;
  }

  /** The WebGL canvas element (for attaching input listeners / overlays). */
  get canvasEl(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** Set the viewport background color. */
  setBackground(color: number | string) {
    this.threeScene.background = new THREE.Color(color as any);
    // Hidden-line occlusion faces are tinted from config.backgroundColor at
    // mesh build time — keep it in sync so they always match the live bg.
    this.config.backgroundColor = color as unknown as number;
    this.requestRender();
  }

  // ── Cleanup ──

  private disposeObject(obj: THREE.Object3D) {
    obj.traverse(child => {
      if (child.userData.poche) return;      // shares the surface's geometry and the renderer's material
      const m = child as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
        else m.material.dispose();
      }
    });
  }

  dispose() {
    this.unsub?.();
    this.clearThree();
    this.marks.dispose();
    this.pointer.dispose();
    this.lighting.dispose();
    cancelAnimationFrame(this.rafId);
    this.rig.dispose();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    // `WebGLRenderer.dispose()` only frees managed resources (textures,
    // geometries, the WebGLState/RenderLists); it does NOT release the
    // underlying GL context. Without an explicit forceContextLoss the
    // browser hits its ~16-context cap after a few page switches and
    // refuses to create a new one — surfacing as "Error creating WebGL
    // context" on the next page. Force-loss + remove the canvas before
    // dispose so the context is properly returned to the browser.
    try { this.renderer.forceContextLoss(); } catch { /* no-op */ }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ── Lighting ──

  /**
   * Set the Studio-mode default PBR material applied to meshes that don't
   * carry their own metalness/roughness. Takes effect on the next material
   * build (e.g. the next sketch re-run). metalness/roughness in 0..1.
   */
  setStudioMaterial(
    metalness: number,
    roughness: number,
    color: string | null = null,
    flatShading = false,
  ): void { this.lighting.setStudioMaterial(metalness, roughness, color, flatShading); }

  /**
   * Show/hide the studio shadow-catcher plane at the world origin. Hide it when
   * the app supplies its own ground mesh to receive shadows (avoids a duplicate
   * shadow at z=0).
   */
  setShadowGroundVisible(visible: boolean): void { this.lighting.setShadowGroundVisible(visible); }

  /** Exponential distance fog tinted `color`; density 0 (or omitted) clears it. ~0.005–0.03 is a
   *  useful range at building scale. */
  setFog(color: string, density = 0): void { this.lighting.setFog(color, density); }

  /** Tone-mapping exposure (1 = neutral; <1 darker, >1 brighter). */
  setExposure(v: number): void { this.lighting.setExposure(v); }

  /**
   * Light the model from `direction` (FROM the model TO the sun), in Z-up scene coords
   * (+X east, +Y north, +Z up) — the `SunPosition` convention; a Y-up scene is remapped.
   * In Studio the shadow camera is framed to whatever the scene shows, so a 1 m object
   * and a 100 m site both get sharp, complete shadows. `distance` is how far back the
   * light sits at least (m).
   */
  setSunDirection(direction: Vec3, distance = 50): void { this.lighting.setSunDirection(direction, distance); }

  /**
   * Set an equirectangular source texture for the environment (e.g. a loaded
   * HDR via RGBELoader). Pass null to use the built-in procedural gradient.
   * The texture is PMREM-prefiltered here; the caller keeps ownership of it.
   */
  setEnvironmentSource(equirect: THREE.Texture | null): void { this.lighting.setEnvironmentSource(equirect); }

  /**
   * Show the equirectangular environment source as the scene backdrop (sky).
   * No-op until a source is set via setEnvironmentSource. When off, the
   * background is left to setBackground().
   */
  setEnvironmentBackground(visible: boolean): void { this.lighting.setEnvironmentBackground(visible); }

  /**
   * Rotate the environment + background (Euler radians) — e.g. to align a Y-up
   * HDRI/equirect source with a Z-up scene (tilt ~90° about X).
   */
  setEnvironmentRotation(x: number, y: number, z: number): void { this.lighting.setEnvironmentRotation(x, y, z); }

  // ── Camera ──

  /**
   * Project a world-space point into the viewport. Returned `x`, `y` are
   * relative to the canvas's bounding rect (top-left = 0, 0).
   * `visible` is false when the point is behind the camera or outside
   * the normalised device cube — caller should hide the overlay.
   */
  worldToScreen(world: Vec3): { x: number; y: number; visible: boolean } { return this.rig.worldToScreen(world); }

  /** Enable/disable orbit ROTATION (pan + zoom stay). Off → a strict-2D view. */
  setOrbitRotateEnabled(enabled: boolean): void { this.rig.setOrbitRotateEnabled(enabled); }

  /** The camera as plain numbers, enough to reproduce the view. */
  cameraState(): { projection: "perspective" | "orthographic"; position: number[]; target: number[]; up: number[]; fov: number } { return this.rig.cameraState(); }

  /**
   * Switch between perspective and orthographic projection.
   * Transfers the current camera position/orientation so the view is continuous.
   */
  setProjection(type: "perspective" | "orthographic") { this.rig.setProjection(type); }

  /** Hear about projection changes from anywhere (the axis widget, a toolbar, code), so
   *  every control that shows the projection stays true. Returns the unsubscribe. */
  onProjection(listener: (projection: "perspective" | "orthographic") => void): () => void { return this.rig.onProjection(listener); }

  /** "perspective" or "orthographic". */
  get projection(): "perspective" | "orthographic" { return this.rig.projection; }

  /**
   * Look at the model from a named side, keeping the distance: `"top"` is a plan,
   * `"front"` / `"back"` / `"left"` / `"right"` are elevations, `"iso"` the diagonal. With
   * `setProjection("orthographic")` they are drawings rather than pictures. Turns there
   * (about a third of a second) unless `{ animate: false }`.
   */
  setView(view: StandardView, opts: { animate?: boolean } = {}): void { this.rig.setView(view, opts); }

  /** Put the camera on `direction` from the target, looking back along it, at the same
   *  distance. What `setView` and the axis widget do. */
  orbitTo(direction: { x: number; y: number; z: number }, opts: { animate?: boolean } = {}): void { this.rig.orbitTo(direction, opts); }

  /**
   * Frame part of the model — a selection, a storey, one element: centre on it and come
   * close enough that it fills the view with room around it (`margin`, default 1.8, so the
   * surroundings still say which part it is). `objects` are scene ids or record keys.
   * Animated unless `{ animate: false }`, keeping the direction you look from.
   */
  fitTo(objects: readonly string[], opts: { margin?: number; animate?: boolean } = {}): void { this.rig.fitTo(objects, opts); }

  /**
   * Set the camera up vector. Use (0,1,0) for top-down plan views (Z-up scenes),
   * and restore (0,0,1) for side/elevation views.
   */
  setCameraUp(x: number, y: number, z: number) { this.rig.setCameraUp(x, y, z); }

  /** Move the camera without changing its target. */
  setCameraPosition(x: number, y: number, z: number) { this.rig.setCameraPosition(x, y, z); }

  /** Aim the camera (and orbit-controls target) at a point. */
  lookAt(x: number, y: number, z: number) { this.rig.lookAt(x, y, z); }

  /**
   * Fit all visible scene objects inside the current view.
   * Preserves the camera direction; only adjusts distance and target.
   */
  fitAll() { this.rig.fitAll(); }

  // ── Picking, hover, drag handles, transform gizmo ──

  /** Enable/disable click-to-pick on the canvas. */
  setPickEnabled(enabled: boolean): void { this.pointer.setPickEnabled(enabled); }

  /** Subscribe to pick events. Returns unsubscribe. `id` is null when the user clicked background;
   *  `info` carries the modifier keys (Shift/⌘-click to add to a selection). */
  onPick(listener: (id: string | null, info: PickInfo) => void): () => void { return this.pointer.onPick(listener); }

  /** Raycast at viewport coordinates and return the topmost pickable scene id (or null). */
  pickAt(clientX: number, clientY: number): string | null { return this.pointer.pickAt(clientX, clientY); }

  /** Like `pickAt`, but also returns the world-space hit point, and skips hidden objects
   *  (the raycaster alone tests invisible ones too). Used by the markup overlay. */
  hitAt(clientX: number, clientY: number): { id: string; point: Vec3 } | null { return this.pointer.hitAt(clientX, clientY); }

  /** Where a viewport ray meets the ground plane (z=0 for Z-up, y=0 otherwise), via the active camera. */
  groundAt(clientX: number, clientY: number): Vec3 | null { return this.pointer.groundAt(clientX, clientY); }

  /** Pick scene objects under a screen coordinate */
  pick(screenX: number, screenY: number): { id: string; point: THREE.Vector3 } | null { return this.pointer.pick(screenX, screenY); }

  /** Project a screen position onto a plane */
  screenToPlane(
    screenX: number, screenY: number,
    plane?: THREE.Plane
  ): THREE.Vector3 | null { return this.pointer.screenToPlane(screenX, screenY, plane); }

  /**
   * Hear which object the pointer is over (null over nothing): reported only when it
   * changes, never while a button is held (an orbit), at most every 40 ms — so an app can
   * light what a click would select without a raycast per frame. Returns the unsubscribe.
   */
  onHover(listener: (id: string | null) => void): () => void { return this.pointer.onHover(listener); }

  /** Register the per-drag, per-drag-end, and per-pick callbacks. */
  setDragHandleCallbacks(
    onMove: (name: string, x: number, y: number, z: number) => void,
    onEnd?:  (name: string) => void,
    onPick?: (name: string | null) => void,
  ): void { this.pointer.setDragHandleCallbacks(onMove, onEnd, onPick); }

  /** Mark the start of a sketch run: clear the "seen this run" set. */
  beginDragHandleSweep(): void { this.pointer.beginDragHandleSweep(); }

  /**
   * Create or update a drag handle by stable name. Position is world-space.
   * `constrain` (optional) snaps the dragged position — e.g. to a polyline.
   */
  upsertDragHandle(
    name: string, x: number, y: number, z: number,
    color = "#38d9a9", size = 0.12,
    constrain?: (x: number, y: number, z: number) => [number, number, number],
    plane?: "ground" | "screen",
  ): void { this.pointer.upsertDragHandle(name, x, y, z, color, size, constrain, plane); }

  /** Remove any drag handles that weren't visited in this run. */
  endDragHandleSweep(): void { this.pointer.endDragHandleSweep(); }

  /** Currently selected drag handle, or null. */
  getSelectedHandle(): string | null { return this.pointer.getSelectedHandle(); }

  /** The handle currently being DRAGGED (set on pointer-down, cleared on pointer-up); null when idle. */
  getActiveDragHandle(): string | null { return this.pointer.getActiveDragHandle(); }

  /** Programmatically select / deselect a drag handle (visual + callback). */
  setHandleSelected(name: string | null): void { this.pointer.setHandleSelected(name); }

  setGizmoMode(mode: GizmoMode): void { this.pointer.setGizmoMode(mode); }

  getGizmoMode(): GizmoMode { return this.pointer.getGizmoMode(); }

  attachGizmo(id: string): void { this.pointer.attachGizmo(id); }

  detachGizmo(): void { this.pointer.detachGizmo(); }

  // ── Marks: selection, section, callouts ──

  /**
   * How `setSelectionHighlight` marks a selection: `"tint"` (default) lights it up in the
   * accent colour; `"outline"` draws its edges on top of everything instead and leaves its
   * fill alone — for apps whose colours mean something (a product, a state, a grade), and
   * so a selection behind other parts still shows.
   */
  setSelectionStyle(style: "tint" | "outline"): void { this.marks.setSelectionStyle(style); }

  /** Highlight one object, several (a record's objects, a multi-selection), or none. */
  setSelectionHighlight(ids: string | readonly string[] | null): void { this.marks.setSelectionHighlight(ids); }

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
  setSection(section: SectionRequest | null): void { this.marks.setSection(section); }

  /** The section in force, or null. */
  get section(): SectionRequest | null { return this.marks.section; }

  /** Paint the cut this colour; null follows the render mode (dark, pale in ghost). */
  setSectionColour(colour: number | string | null): void { this.marks.setSectionColour(colour); }

  /**
   * Labels in the margins with leaders to what they name, the way a drawing is annotated:
   * they never overlap and don't swim as the model turns; a label whose thing is hidden
   * behind other things is left out; what doesn't fit is counted, not dropped silently.
   * `objects` are scene ids or record keys (a key follows its record through rebuilds).
   * Pass `[]` to clear. `onPick` / `onHover` hear clicks and hovers on the labels.
   */
  setCallouts(items: CalloutItem[], handlers: { onPick?: (id: string) => void; onHover?: (id: string | null) => void } = {}): void { this.marks.setCallouts(items, handlers); }

  // ── Crease lines ──

  /** Crease lines still to be drawn (hidden line and ghost build them a frame at a time). */
  get pendingEdges(): number { return this.builder.pendingEdges; }
}
