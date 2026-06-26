/**
 * Tekto Three.js Renderer
 *
 * Converts Scene objects → Three.js scene graph.
 * Manages lifecycle, materials, and GPU resources.
 */

import * as THREE from "three";
// @ts-ignore — OrbitControls typings vary across Three.js versions
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// @ts-ignore — TransformControls typings vary across Three.js versions
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { Scene as GScene, SceneObject, SceneEvent } from "../scene/Scene";
import { ConnectedMesh as GMesh } from "../core/geometry/mesh/ConnectedMesh";
import { Vec3 } from "../core/math/vectors";

export type GizmoMode = "translate" | "rotate" | "scale" | "none";

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
}

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
};

export class ThreeRenderer {
  readonly threeScene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private _orthoCam: THREE.OrthographicCamera;
  private _isOrtho = false;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls?: OrbitControls;

  /** The currently active camera — perspective or orthographic. */
  get activeCamera(): THREE.Camera { return this._isOrtho ? this._orthoCam : this.camera; }

  private gScene: GScene;
  private config: ThreeRendererConfig;
  private isZUp: boolean;
  private objectMap = new Map<string, THREE.Object3D>();
  private unsub: (() => void) | null = null;
  private rafId = 0;

  // Lighting (created in the constructor; mutated by `_applyLighting`).
  private ambientLight!: THREE.AmbientLight;
  private dirLight!:     THREE.DirectionalLight;
  private hemiLight!:    THREE.HemisphereLight;
  private currentLighting: import("../scene/Scene").LightingMode = "flat";
  // Studio-mode default PBR material, used when a mesh sets no explicit
  // metalness/roughness in its VisualStyle. Configurable via setStudioMaterial.
  private studioMetalness = 0.0;
  private studioRoughness = 0.65;
  // When set, forces this color on studio meshes (overriding their own); null = keep per-mesh color.
  private studioColor: string | null = null;
  private studioFlatShading = false;
  // When true, line/point "helper" objects are hidden (e.g. a clean render view
  // that shows only solid meshes). Solid geometry is unaffected.
  private hideHelpers = false;
  private gridHelper: THREE.Object3D | null = null;
  private axesHelper: THREE.Object3D | null = null;
  // Invisible shadow-catcher plane added only in Studio mode so the
  // PCF-soft shadows have a surface to land on.
  private shadowGround: THREE.Mesh | null = null;
  // When true, the studio shadow-catcher plane (at the world origin) is hidden —
  // e.g. when the app provides its own ground to receive shadows.
  private shadowGroundHidden = false;
  // Prefiltered (PMREM) environment map for image-based reflections.
  // Built lazily once on first enable, then reused. Only visibly affects
  // studio PBR materials.
  private envMap: THREE.Texture | null = null;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver | null = null;

  // ── Picking + Gizmo ──
  private raycaster = new THREE.Raycaster();
  private pickEnabled = false;
  private pickListeners = new Set<(id: string | null) => void>();
  private transformControls: TransformControls | null = null;
  private gizmoMode: GizmoMode = "translate";
  private gizmoAttachedId: string | null = null;
  private pointerDown: { x: number; y: number } | null = null;
  private selectionMaterials = new Map<string, { mat: THREE.Material; oldEmissive: THREE.Color; oldIntensity: number }>();

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
    this._orthoCam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.01, 2000);
    if (this.isZUp) this._orthoCam.up.set(0, 0, 1);
    this._orthoCam.position.set(...cfg.cameraPosition);
    this._orthoCam.lookAt(...cfg.cameraTarget);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: cfg.antialias });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Lighting — references kept so `_applyLighting` can re-tune them
    // when switching between Flat and Studio modes.
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.threeScene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    this.dirLight.position.set(8, this.isZUp ? 10 : 15, this.isZUp ? 15 : 10);
    // Aim it at the origin so shadow-camera framing covers a reasonable
    // volume around the scene without per-demo configuration.
    this.dirLight.target.position.set(0, 0, 0);
    this.threeScene.add(this.dirLight);
    this.threeScene.add(this.dirLight.target);

    this.hemiLight = new THREE.HemisphereLight(0x4466aa, 0x332211, 0.4);
    this.threeScene.add(this.hemiLight);

    // Apply whatever lighting mode the scene was last set to.
    this._applyLighting(this.gScene.lightingMode);

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
    }

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
    switch (event.type) {
      case "object:add": {
        const obj = this.gScene.get(event.id);
        if (obj) this.addToThree(obj);
        break;
      }
      case "object:remove":
        this.removeFromThree(event.id);
        break;
      case "object:update":
      case "object:style":
        this.removeFromThree(event.id);
        const obj = this.gScene.get(event.id);
        if (obj) this.addToThree(obj);
        break;
      case "scene:clear":
        this.clearThree();
        break;
      case "scene:renderMode":
        this.rebuildAllMeshes();
        break;
      case "scene:lightingMode":
        this._applyLighting(event.mode);
        // Materials change Phong↔Standard with the mode — rebuild meshes
        // so existing objects re-create their materials in the new family.
        this.rebuildAllMeshes();
        break;
      case "scene:environment":
        this._applyEnvironment(event.enabled);
        break;
    }
  }

  // ── Object Conversion ──

  private addToThree(obj: SceneObject) {
    const t = this.convert(obj);
    if (!t) return;
    t.userData.geomId = obj.id;
    t.userData.pickable = obj.pickable !== false;
    t.userData.objType = obj.type;
    t.userData.styleVisible = obj.style.visible;
    t.visible = obj.style.visible && !(this.hideHelpers && this._isHelper(obj.type));
    this.applyTransform(t, obj);
    // Apply the current lighting's shadow flags so freshly-added meshes
    // immediately participate in the shadow map (Studio mode) without
    // waiting for the next `_applyLighting` pass. Cheap; just two
    // booleans per mesh.
    if (this.currentLighting === "studio") {
      t.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });
    }
    this.threeScene.add(t);
    this.objectMap.set(obj.id, t);
    // If this is the currently selected object, reattach the gizmo.
    if (this.gizmoAttachedId === obj.id) this.attachGizmo(obj.id);
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
    this.threeScene.remove(t);
    this.disposeObject(t);
    this.objectMap.delete(id);
  }

  private clearThree() {
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

  /**
   * Build a material that respects the current lighting mode. Studio mode
   * returns an `MeshStandardMaterial` (PBR; reacts correctly to shadows
   * and tonemapping); Flat mode returns the original `MeshPhongMaterial`.
   * Same option surface — caller doesn't have to care which one comes back.
   */
  private _makeMaterial(
    opts: THREE.MeshPhongMaterialParameters & { metalness?: number; roughness?: number },
  ): THREE.MeshPhongMaterial | THREE.MeshStandardMaterial {
    if (this.currentLighting === "studio") {
      return new THREE.MeshStandardMaterial({
        color:             this.studioColor ?? opts.color,
        emissive:          opts.emissive,
        emissiveIntensity: opts.emissiveIntensity,
        opacity:           opts.opacity,
        transparent:       opts.transparent,
        side:              opts.side,
        wireframe:         opts.wireframe,
        flatShading:       opts.flatShading ?? this.studioFlatShading,
        depthTest:         opts.depthTest,
        depthWrite:        opts.depthWrite,
        vertexColors:      opts.vertexColors,
        roughness:         opts.roughness ?? this.studioRoughness,
        metalness:         opts.metalness ?? this.studioMetalness,
      });
    }
    // Phong has no metalness/roughness — strip them before constructing.
    const { metalness: _m, roughness: _r, ...rest } = opts;
    return new THREE.MeshPhongMaterial(rest);
  }

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
  ): void {
    this.studioMetalness = metalness;
    this.studioRoughness = roughness;
    this.studioColor = color;
    this.studioFlatShading = flatShading;
  }

  // Line/point "helper" object types (vs solid meshes/polygons/planes).
  private _isHelper(type: unknown): boolean {
    return type === "segment" || type === "polyline" || type === "point" || type === "circle";
  }

  /**
   * Show/hide line + point "helper" objects (axes, construction lines, markers,
   * labels). Solid meshes are unaffected. Applies immediately to existing
   * objects and to all future ones until changed.
   */
  /**
   * Show/hide the studio shadow-catcher plane at the world origin. Hide it when
   * the app supplies its own ground mesh to receive shadows (avoids a duplicate
   * shadow at z=0).
   */
  setShadowGroundVisible(visible: boolean): void {
    this.shadowGroundHidden = !visible;
    if (this.shadowGround) this.shadowGround.visible = visible;
  }

  setHelpersVisible(visible: boolean): void {
    this.hideHelpers = !visible;
    if (this.gridHelper) this.gridHelper.visible = visible;
    if (this.axesHelper) this.axesHelper.visible = visible;
    this.threeScene.traverse((o) => {
      if (this._isHelper(o.userData?.objType)) {
        o.visible = visible ? (o.userData.styleVisible ?? true) : false;
      }
    });
  }

  /**
   * Aim the main directional light at the origin from the given unit
   * direction (FROM origin TO light). Input is in Z-up scene coords
   * (+X east, +Y north, +Z up) — typical sun-vector convention; the
   * renderer remaps internally if the scene is Y-up.
   *
   * @param direction Unit vector pointing toward the light source.
   * @param distance  How far back to place the light (m). Default 50.
   */
  setSunDirection(direction: Vec3, distance = 50): void {
    // Re-map Z-up sun direction → renderer up-axis.
    const x = direction.x;
    const y = this.isZUp ? direction.y :  direction.z;
    const z = this.isZUp ? direction.z : -direction.y;
    this.dirLight.position.set(x * distance, y * distance, z * distance);
    this.dirLight.target.position.set(0, 0, 0);
    this.dirLight.target.updateMatrixWorld();
    this.dirLight.shadow.camera.updateProjectionMatrix();
  }

  /**
   * Reconfigure renderer + lights + scene shadow flags for the given mode.
   * Material swapping happens after this returns, via `rebuildAllMeshes`.
   */
  private _applyLighting(mode: import("../scene/Scene").LightingMode): void {
    this.currentLighting = mode;
    const studio = mode === "studio";

    // ── Renderer: shadow map + tonemapping + colour space ─────────
    this.renderer.shadowMap.enabled = studio;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping       = studio ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace  = THREE.SRGBColorSpace;

    // ── Lights: rebalance so Studio reads more like a sunlit scene ─
    if (studio) {
      this.ambientLight.intensity = 0.35;
      this.hemiLight.intensity    = 0.30;
      this.dirLight.intensity     = 2.8;
      this.dirLight.castShadow    = true;
      this.dirLight.shadow.mapSize.set(2048, 2048);
      this.dirLight.shadow.bias   = -0.0005;
      // Shadow camera frustum. 30 m half-extent covers a 4-storey house
      // comfortably without making the resolution too coarse.
      const sc = this.dirLight.shadow.camera;
      const d = 30;
      sc.near = 0.5;
      sc.far  = 200;
      sc.left = -d; sc.right = d; sc.top = d; sc.bottom = -d;
      sc.updateProjectionMatrix();
    } else {
      this.ambientLight.intensity = 0.50;
      this.hemiLight.intensity    = 0.40;
      this.dirLight.intensity     = 0.70;
      this.dirLight.castShadow    = false;
    }

    // ── Mesh cast/receive flags ───────────────────────────────────
    // Walk the existing tree; rebuildAllMeshes (called by the scene
    // event handler) will set the same flags on freshly-built meshes.
    this.threeScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow    = studio;
        obj.receiveShadow = studio;
      }
    });

    // ── Shadow-catching ground (invisible except for shadows) ─────
    if (studio && !this.shadowGround) {
      const geo = new THREE.PlaneGeometry(400, 400);
      const mat = new THREE.ShadowMaterial({ opacity: 0.35 });
      this.shadowGround = new THREE.Mesh(geo, mat);
      this.shadowGround.receiveShadow = true;
      // For Y-up scenes the plane needs to lie on XZ (rotate −90° around X).
      // For Z-up scenes the plane already lies on XY by default.
      if (!this.isZUp) this.shadowGround.rotation.x = -Math.PI / 2;
      // Drop slightly below the grid so it doesn't z-fight with anything
      // sitting at the ground plane.
      this.shadowGround.position.set(0, this.isZUp ? 0 : -0.001, this.isZUp ? -0.001 : 0);
      this.shadowGround.visible = !this.shadowGroundHidden;
      this.threeScene.add(this.shadowGround);
    } else if (!studio && this.shadowGround) {
      this.threeScene.remove(this.shadowGround);
      this.shadowGround.geometry.dispose();
      (this.shadowGround.material as THREE.Material).dispose();
      this.shadowGround = null;
    }
  }

  /**
   * Toggle a prefiltered environment map on `threeScene.environment`. Only
   * studio PBR (`MeshStandardMaterial`) materials sample it, so this is a
   * no-op visually in flat mode — but it's safe to enable in either mode.
   * The map is built once on first enable and reused thereafter.
   */
  private _applyEnvironment(enabled: boolean): void {
    if (enabled) {
      if (!this.envMap) this.envMap = this._buildEnvironment();
      this.threeScene.environment = this.envMap;
    } else {
      this.threeScene.environment = null;
    }
  }

  /**
   * Build a prefiltered (PMREM) environment from a procedural vertical
   * gradient — bright neutral sky at the top, mid horizon, darker ground —
   * using core Three only (no `three/examples` RoomEnvironment). Returns the
   * PMREM-filtered cube texture; the source `DataTexture` and the generator
   * are disposed before returning.
   */
  private _buildEnvironment(): THREE.Texture {
    const W = 16, H = 256; // narrow: the gradient is purely vertical
    const data = new Uint8Array(W * H * 4);
    const sky    = [0.85, 0.88, 0.95]; // top
    const horizon = [0.55, 0.55, 0.55];
    const ground = [0.12, 0.12, 0.13]; // bottom
    for (let y = 0; y < H; y++) {
      // t: 0 at bottom row → 1 at top row (DataTexture row 0 is bottom).
      const t = y / (H - 1);
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const k = t / 0.5;
        r = ground[0] + (horizon[0] - ground[0]) * k;
        g = ground[1] + (horizon[1] - ground[1]) * k;
        b = ground[2] + (horizon[2] - ground[2]) * k;
      } else {
        const k = (t - 0.5) / 0.5;
        r = horizon[0] + (sky[0] - horizon[0]) * k;
        g = horizon[1] + (sky[1] - horizon[1]) * k;
        b = horizon[2] + (sky[2] - horizon[2]) * k;
      }
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        data[i]     = Math.round(r * 255);
        data[i + 1] = Math.round(g * 255);
        data[i + 2] = Math.round(b * 255);
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }

  private convert(obj: SceneObject): THREE.Object3D | null {
    const s = obj.style;
    switch (obj.type) {
      case "point": {
        const geo = new THREE.SphereGeometry(s.pointSize, 12, 12);
        const mat = this._makeMaterial({
          color: s.color, emissive: s.color, emissiveIntensity: 0.3,
          opacity: s.opacity, transparent: s.opacity < 1,
          metalness: s.metalness, roughness: s.roughness,
        });
        const mesh = new THREE.Mesh(geo, mat);
        if (obj.position) mesh.position.set(obj.position.x, obj.position.y, obj.position.z);

        if (s.label) {
          const group = new THREE.Group();
          group.add(mesh);
          const sprite = this.createTextSprite(s.label, s.labelColor ?? s.color);
          if (obj.position) sprite.position.set(obj.position.x, obj.position.y, obj.position.z);
          // Offset label slightly above the point
          if (this.isZUp) sprite.position.z += s.pointSize + 0.15;
          else sprite.position.y += s.pointSize + 0.15;
          group.add(sprite);
          return group;
        }
        return mesh;
      }

      case "segment": {
        if (!obj.start || !obj.end) return null;
        const a = new THREE.Vector3(obj.start.x, obj.start.y, obj.start.z);
        const b = new THREE.Vector3(obj.end.x, obj.end.y, obj.end.z);

        if (s.tubeRadius && s.tubeRadius > 0) {
          const dir = new THREE.Vector3().subVectors(b, a);
          const len = dir.length();
          if (len < 1e-8) return null;
          const geo = new THREE.CylinderGeometry(s.tubeRadius, s.tubeRadius, len, 6, 1);
          // CylinderGeometry is along Y axis; rotate to align with direction
          geo.rotateX(Math.PI / 2); // now along Z
          geo.translate(0, 0, len / 2); // origin at start
          const mesh = new THREE.Mesh(geo, this._makeMaterial({
            color: s.color, opacity: s.opacity, transparent: s.opacity < 1,
            metalness: s.metalness, roughness: s.roughness,
          }));
          // Orient: look from a towards b
          mesh.position.copy(a);
          mesh.lookAt(b);
          return mesh;
        }

        const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
        const mat = new THREE.LineBasicMaterial({
          color: s.color, opacity: s.opacity, transparent: s.opacity < 1,
        });
        return new THREE.Line(geo, mat);
      }

      case "polyline": {
        if (!obj.vertices || obj.vertices.length < 2) return null;
        // Pack directly into a typed array — avoids per-point Vector3 allocs
        // when emitting many polylines (streamlines, hatch fields, ...).
        const n = obj.vertices.length;
        const arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const v = obj.vertices[i];
          arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        return new THREE.Line(geo, new THREE.LineBasicMaterial({
          color: s.color, opacity: s.opacity, transparent: s.opacity < 1,
        }));
      }

      case "polygon": {
        if (!obj.vertices || obj.vertices.length < 2) return null;
        const group = new THREE.Group();

        // Outline
        const pts = obj.vertices.map(v => new THREE.Vector3(v.x, v.y, v.z));
        if (pts.length > 2) pts.push(pts[0].clone());
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: s.color })));

        // Fill
        if (obj.vertices.length >= 3) {
          if (this.isZUp) {
            const shape = new THREE.Shape(obj.vertices.map(v => new THREE.Vector2(v.x, v.y)));
            const shapeGeo = new THREE.ShapeGeometry(shape);
            group.add(new THREE.Mesh(shapeGeo, this._makeMaterial({
              color: s.color, opacity: s.opacity, transparent: true, side: THREE.DoubleSide,
              metalness: s.metalness, roughness: s.roughness,
            })));
          } else {
            const shape = new THREE.Shape(obj.vertices.map(v => new THREE.Vector2(v.x, v.z)));
            const shapeGeo = new THREE.ShapeGeometry(shape);
            shapeGeo.rotateX(-Math.PI / 2);
            group.add(new THREE.Mesh(shapeGeo, this._makeMaterial({
              color: s.color, opacity: s.opacity, transparent: true, side: THREE.DoubleSide,
              metalness: s.metalness, roughness: s.roughness,
            })));
          }
        }
        return group;
      }

      case "mesh": {
        if (obj.flatMeshData) return this.convertFlatMesh(obj.flatMeshData, s);
        if (!obj.mesh) return null;
        return this.convertMesh(obj.mesh, s);
      }

      case "circle": {
        if (!obj.center || obj.radius == null) return null;
        const pts: THREE.Vector3[] = [];
        const seg = 64;
        for (let i = 0; i <= seg; i++) {
          const a = (i / seg) * Math.PI * 2;
          const ca = Math.cos(a) * obj.radius, sa = Math.sin(a) * obj.radius;
          if (this.isZUp) {
            pts.push(new THREE.Vector3(obj.center.x + ca, obj.center.y + sa, obj.center.z));
          } else {
            pts.push(new THREE.Vector3(obj.center.x + ca, obj.center.y, obj.center.z + sa));
          }
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return new THREE.Line(geo, new THREE.LineBasicMaterial({
          color: s.color, opacity: s.opacity, transparent: s.opacity < 1,
        }));
      }

      case "plane": {
        if (!obj.normal) return null;
        const geo = new THREE.PlaneGeometry(10, 10);
        const mat = this._makeMaterial({
          color: s.color, opacity: s.opacity, transparent: true, side: THREE.DoubleSide,
          metalness: s.metalness, roughness: s.roughness,
        });
        const mesh = new THREE.Mesh(geo, mat);
        const n = new THREE.Vector3(obj.normal.x, obj.normal.y, obj.normal.z).normalize();
        mesh.lookAt(n);
        mesh.position.copy(n.multiplyScalar(obj.distance ?? 0));
        return mesh;
      }

      default:
        return null;
    }
  }

  /** Convert a Tekto Mesh → Three.js group with solid + wireframe */
  private convertMesh(gmesh: GMesh, s: SceneObject["style"]): THREE.Group {
    const data = gmesh.toIndexedTriangles();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(data.indices, 1));

    return this.buildMeshGroup(geo, s);
  }

  /** Convert flat mesh data (with optional per-vertex colors) → Three.js group */
  private convertFlatMesh(data: SceneObject["flatMeshData"] & {}, s: SceneObject["style"]): THREE.Group {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(data.indices, 1));

    const hasColors = !!(data.colors?.length);
    if (hasColors) geo.setAttribute("color", new THREE.BufferAttribute(data.colors!, 4));

    // Multi-material path: per-group colors in solid mode
    if (data.groups?.length && this.gScene.renderMode === "solid" && !hasColors) {
      const groupColors = s.groupColors ?? {};
      const side = s.backfaceColor ? THREE.DoubleSide : (s.doubleSided ? THREE.DoubleSide : THREE.FrontSide);
      for (let i = 0; i < data.groups.length; i++) {
        const g = data.groups[i];
        geo.addGroup(g.indexStart, g.indexCount, i);
      }
      const materials = data.groups.map(g => this._makeMaterial({
        color: groupColors[g.name] ?? s.color,
        opacity: s.wireframe ? s.opacity * 0.3 : s.opacity,
        transparent: s.opacity < 1 || s.wireframe,
        side,
        flatShading: s.flatShading ?? false,
        metalness: s.metalness, roughness: s.roughness,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
      }));
      const group = new THREE.Group();
      group.add(new THREE.Mesh(geo, materials));
      if (!s.wireframe) {
        group.add(new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
          color: 0xffffff, wireframe: true, opacity: 0.04, transparent: true,
        })));
      }
      return group;
    }

    return this.buildMeshGroup(geo, s, hasColors);
  }

  /** Shared mesh group builder — handles solid / wireframe / hiddenline render modes */
  private buildMeshGroup(
    geo: THREE.BufferGeometry,
    s: SceneObject["style"],
    hasVertexColors = false,
  ): THREE.Group {
    const group = new THREE.Group();
    const mode = this.gScene.renderMode;
    const side = s.doubleSided ? THREE.DoubleSide : THREE.FrontSide;

    if (mode === "wireframe") {
      // Wireframe only
      const wireMat = new THREE.MeshBasicMaterial({
        color: s.color, wireframe: true,
        opacity: s.opacity, transparent: s.opacity < 1,
      });
      group.add(new THREE.Mesh(geo, wireMat));

    } else if (mode === "hiddenline") {
      // Pass 1: solid in background color for depth occlusion
      const occlusionMat = new THREE.MeshBasicMaterial({
        color: this.config.backgroundColor,
        side,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      group.add(new THREE.Mesh(geo, occlusionMat));

      // Pass 2: feature (sharp / crease) edges on top. EdgesGeometry keeps only
      // edges whose dihedral angle exceeds `edgeAngle`, so coplanar tessellation
      // seams (quad diagonals, flat-wall tiling) drop out — a clean line drawing.
      const edgeAngle = s.edgeAngle ?? 30; // degrees
      const wireGeo = new THREE.EdgesGeometry(geo, edgeAngle);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xb0b0b0 });
      group.add(new THREE.LineSegments(wireGeo, wireMat));

    } else {
      // Solid mode (default) — polygonOffset pushes mesh depth back so
      // coplanar lines (lab.line) render cleanly on top without z-fighting.
      const solidMat = this._makeMaterial({
        color: hasVertexColors ? 0xffffff : s.color,
        vertexColors: hasVertexColors,
        opacity: s.wireframe ? s.opacity * 0.3 : s.opacity,
        transparent: s.opacity < 1 || s.wireframe,
        side: s.backfaceColor ? THREE.DoubleSide : side,
        flatShading: s.flatShading ?? false,
        metalness: s.metalness, roughness: s.roughness,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      // Backface debug: tint back-facing triangles a different color
      if (s.backfaceColor) {
        const bc = new THREE.Color(s.backfaceColor);
        solidMat.onBeforeCompile = (shader) => {
          shader.uniforms.backfaceColor = { value: bc };
          shader.fragmentShader = 'uniform vec3 backfaceColor;\n' + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            if (!gl_FrontFacing) { diffuseColor.rgb = backfaceColor; }`,
          );
        };
      }

      group.add(new THREE.Mesh(geo, solidMat));

      if (s.wireframe) {
        const wireMat = new THREE.MeshBasicMaterial({
          color: s.color, wireframe: true,
          opacity: s.opacity * 0.8, transparent: true,
        });
        group.add(new THREE.Mesh(geo.clone(), wireMat));
      } else if (!hasVertexColors) {
        // Subtle wireframe overlay
        const subtleWire = new THREE.MeshBasicMaterial({
          color: 0xffffff, wireframe: true, opacity: 0.04, transparent: true,
        });
        group.add(new THREE.Mesh(geo.clone(), subtleWire));
      }
    }

    return group;
  }

  // ── Text Sprites ──

  private createTextSprite(text: string, color: string): THREE.Sprite {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const fontSize = 48;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width) + 16;
    const h = fontSize + 16;
    canvas.width = w;
    canvas.height = h;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, w / 2, h / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    const scale = 0.005;
    sprite.scale.set(w * scale, h * scale, 1);
    return sprite;
  }

  // ── Get Three.js object for a scene ID ──

  getThreeObject(id: string): THREE.Object3D | undefined {
    return this.objectMap.get(id);
  }

  /**
   * Project a world-space point into the viewport. Returned `x`, `y` are
   * relative to the canvas's bounding rect (top-left = 0, 0).
   * `visible` is false when the point is behind the camera or outside
   * the normalised device cube — caller should hide the overlay.
   */
  worldToScreen(world: Vec3): { x: number; y: number; visible: boolean } {
    const v = new THREE.Vector3(world.x, world.y, world.z).project(this.activeCamera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = (v.x * 0.5 + 0.5) * rect.width;
    const y = (-v.y * 0.5 + 0.5) * rect.height;
    const visible = v.z > -1 && v.z < 1;
    return { x, y, visible };
  }

  // ── Picking ──

  /** Enable/disable click-to-pick on the canvas. */
  setPickEnabled(enabled: boolean): void {
    if (enabled === this.pickEnabled) return;
    this.pickEnabled = enabled;
    const dom = this.renderer.domElement;
    if (enabled) {
      dom.addEventListener("pointerdown", this.onPointerDown);
      dom.addEventListener("pointerup",   this.onPointerUp);
    } else {
      dom.removeEventListener("pointerdown", this.onPointerDown);
      dom.removeEventListener("pointerup",   this.onPointerUp);
      this.pointerDown = null;
    }
  }

  /** Subscribe to pick events. Returns unsubscribe. `id` is null when the user clicked background. */
  onPick(listener: (id: string | null) => void): () => void {
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
      if (this.controls) this.controls.enabled = false;
      // Set up a drag plane through the handle's current position. Default:
      // perpendicular to the world up axis (the ground plane). "screen":
      // perpendicular to the camera view direction, so the handle drags in the
      // view plane (e.g. arc + elevation in a side view) instead of the ground.
      const handle = this.dragHandles.get(handleName)!;
      let normal: THREE.Vector3;
      if (this.dragHandlePlanes.get(handleName) === "screen") {
        normal = new THREE.Vector3();
        this.activeCamera.getWorldDirection(normal);
      } else {
        normal = this.isZUp ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      }
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, handle.position);
      const dom = this.renderer.domElement;
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
    for (const l of this.pickListeners) l(id);
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
    if (this.dragHandleMoveCb) {
      this.dragHandleMoveCb(this.activeDragHandle, x, y, z);
    }
  };

  private onPointerUpDragging = (_e: PointerEvent) => {
    const name = this.activeDragHandle;
    this.activeDragHandle = null;
    if (this.controls) this.controls.enabled = true;
    const dom = this.renderer.domElement;
    dom.removeEventListener("pointermove", this.onPointerMoveDragging);
    // Fire the pick event regardless — click-without-drag still counts.
    if (name && this.dragHandlePickCb) this.dragHandlePickCb(name);
    if (name && this.dragHandleEndCb)  this.dragHandleEndCb(name);
  };

  /** Returns the handle name under (clientX, clientY) or null. */
  private dragHandleHitTest(clientX: number, clientY: number): string | null {
    if (this.dragHandles.size === 0) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const meshes = [...this.dragHandles.values()];
    const hits = this.raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? (hits[0].object.userData.handleName as string) : null;
  }

  /** Raycast at (clientX, clientY) against a Three.Plane; returns the intersection point. */
  private raycastPlane(clientX: number, clientY: number, plane: THREE.Plane): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  }

  // ── Drag handles API ──

  /** Register the per-drag, per-drag-end, and per-pick callbacks. */
  setDragHandleCallbacks(
    onMove: (name: string, x: number, y: number, z: number) => void,
    onEnd?:  (name: string) => void,
    onPick?: (name: string | null) => void,
  ): void {
    this.dragHandleMoveCb = onMove;
    this.dragHandleEndCb  = onEnd  ?? null;
    this.dragHandlePickCb = onPick ?? null;
  }

  /** Mark the start of a sketch run: clear the "seen this run" set. */
  beginDragHandleSweep(): void { this.dragSeenThisRun.clear(); }

  /**
   * Create or update a drag handle by stable name. Position is world-space.
   * `constrain` (optional) snaps the dragged position — e.g. to a polyline.
   */
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
      const mat = this._makeMaterial({
        color, emissive: color, emissiveIntensity: 0.55,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.userData.handleName = name;
      mesh.userData.baseSize = size;
      mesh.userData.baseColor = color;
      mesh.renderOrder = 999;
      (mesh.material as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial)).depthTest = false;
      this.threeScene.add(mesh);
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
  }

  /** Remove any drag handles that weren't visited in this run. */
  endDragHandleSweep(): void {
    for (const [name, mesh] of this.dragHandles) {
      if (!this.dragSeenThisRun.has(name)) {
        this.threeScene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.dragHandles.delete(name);
        this.dragHandleConstraints.delete(name);
        this.dragHandlePlanes.delete(name);
        if (this.selectedDragHandle === name) this.selectedDragHandle = null;
      }
    }
  }

  /** Currently selected drag handle, or null. */
  getSelectedHandle(): string | null { return this.selectedDragHandle; }
  /** The handle currently being DRAGGED (set on pointer-down, cleared on pointer-up); null when idle. */
  getActiveDragHandle(): string | null { return this.activeDragHandle; }

  /** Programmatically select / deselect a drag handle (visual + callback). */
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
  }

  /** Raycast at viewport coordinates and return the topmost pickable scene id (or null). */
  pickAt(clientX: number, clientY: number): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.activeCamera);
    const pickable: THREE.Object3D[] = [];
    for (const t of this.objectMap.values()) {
      if (t.userData.pickable !== false) pickable.push(t);
    }
    const hits = this.raycaster.intersectObjects(pickable, true);
    for (const h of hits) {
      let cur: THREE.Object3D | null = h.object;
      while (cur && !cur.userData.geomId) cur = cur.parent;
      if (cur?.userData.geomId) return cur.userData.geomId as string;
    }
    return null;
  }

  // ── Gizmo (transform controls) ──

  setGizmoMode(mode: GizmoMode): void {
    this.gizmoMode = mode;
    if (mode === "none") {
      this.detachGizmo();
    } else {
      this.ensureGizmo();
      this.transformControls?.setMode(mode);
      if (this.gizmoAttachedId) this.attachGizmo(this.gizmoAttachedId);
    }
  }

  getGizmoMode(): GizmoMode { return this.gizmoMode; }

  attachGizmo(id: string): void {
    const t = this.objectMap.get(id);
    if (!t) { this.detachGizmo(); return; }
    if (this.gizmoMode === "none") { this.gizmoAttachedId = id; return; }
    this.ensureGizmo();
    this.transformControls!.attach(t);
    this.gizmoAttachedId = id;
  }

  detachGizmo(): void {
    this.transformControls?.detach();
    this.gizmoAttachedId = null;
  }

  private ensureGizmo(): void {
    if (this.transformControls) return;
    const tc = new TransformControls(this.activeCamera, this.renderer.domElement);
    tc.setMode(this.gizmoMode === "none" ? "translate" : this.gizmoMode);
    // Disable OrbitControls during gizmo drag, and write changes back to Scene.
    tc.addEventListener("dragging-changed", (e: { value: boolean }) => {
      if (this.controls) this.controls.enabled = !e.value;
      if (!e.value && this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    tc.addEventListener("objectChange", () => {
      if (this.gizmoAttachedId) this.writeBackTransform(this.gizmoAttachedId);
    });
    this.threeScene.add(tc);
    this.transformControls = tc;
  }

  /** Read the gizmo'd Three.Object3D's transform and write it back into the SceneObject. */
  private writeBackTransform(id: string): void {
    const t = this.objectMap.get(id);
    if (!t) return;
    const obj = this.gScene.get(id);
    if (!obj) return;
    const transform = {
      position: new Vec3(t.position.x, t.position.y, t.position.z),
      rotation: new Vec3(t.rotation.x, t.rotation.y, t.rotation.z),
      scale:    new Vec3(t.scale.x,    t.scale.y,    t.scale.z),
    };
    // Suspend events so this echo doesn't re-render and detach the gizmo.
    this.gScene.withSuspendedEvents(() => {
      this.gScene.update(id, { transform });
    });
  }

  // ── Selection visual feedback ──

  setSelectionHighlight(id: string | null): void {
    // Restore prior highlight.
    for (const [, info] of this.selectionMaterials) {
      const m = info.mat as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial);
      m.emissive.copy(info.oldEmissive);
      m.emissiveIntensity = info.oldIntensity;
    }
    this.selectionMaterials.clear();
    if (!id) return;
    const t = this.objectMap.get(id);
    if (!t) return;
    t.traverse((child: THREE.Object3D) => {
      const m = (child as THREE.Mesh).material as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial) | undefined;
      if (m && (m as any).emissive instanceof THREE.Color) {
        this.selectionMaterials.set(child.uuid, {
          mat: m,
          oldEmissive: m.emissive.clone(),
          oldIntensity: m.emissiveIntensity ?? 0,
        });
        m.emissive = new THREE.Color(0x38d9a9);
        m.emissiveIntensity = 0.35;
      }
    });
  }

  // ── Render ──

  render() {
    this.controls?.update();
    this.renderer.render(this.threeScene, this.activeCamera);
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
    this._syncOrthoCamFrustum();
    this.renderer.setSize(w, h);
  }

  // ── Projection & View ──

  /** Compute the orthographic frustum to match the current perspective camera view distance. */
  private _syncOrthoCamFrustum() {
    const target = this.controls?.target ?? new THREE.Vector3();
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

  /**
   * Switch between perspective and orthographic projection.
   * Transfers the current camera position/orientation so the view is continuous.
   */
  setProjection(type: "perspective" | "orthographic") {
    const wasOrtho = this._isOrtho;
    this._isOrtho = type === "orthographic";
    if (this._isOrtho && !wasOrtho) {
      // Copy current perspective camera state to ortho
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this._syncOrthoCamFrustum();
    } else if (!this._isOrtho && wasOrtho) {
      // Sync back to persp position (OrbitControls already tracks target)
      this.camera.position.copy(this._orthoCam.position);
      this.camera.quaternion.copy(this._orthoCam.quaternion);
    }
    // Swap OrbitControls to the active camera
    if (this.controls) {
      (this.controls as any).object = this.activeCamera;
      this.controls.update();
    }
  }

  /**
   * Set the camera up vector. Use (0,1,0) for top-down plan views (Z-up scenes),
   * and restore (0,0,1) for side/elevation views.
   */
  setCameraUp(x: number, y: number, z: number) {
    this.camera.up.set(x, y, z);
    this._orthoCam.up.set(x, y, z);
    if (this.controls) this.controls.update();
  }

  /**
   * Fit all visible scene objects inside the current view.
   * Preserves the camera direction; only adjusts distance and target.
   */
  fitAll() {
    const box = new THREE.Box3();
    for (const obj of this.objectMap.values()) {
      if (obj.visible) {
        const b = new THREE.Box3().setFromObject(obj);
        if (!b.isEmpty()) box.union(b);
      }
    }
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());

    // Direction from current camera to its target
    const target = this.controls?.target.clone() ?? center;
    let dir = new THREE.Vector3().subVectors(this.camera.position, target);
    if (dir.length() < 1e-6) dir.set(1, 1, 1);
    dir.normalize();

    // Distance so the bounding sphere fills ~80% of the frustum
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const dist = (sphere.radius / Math.tan(fovRad / 2)) * 1.3;

    this.camera.position.copy(center).addScaledVector(dir, dist);
    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }

    if (this._isOrtho) {
      this._orthoCam.position.copy(this.camera.position);
      this._orthoCam.quaternion.copy(this.camera.quaternion);
      this._syncOrthoCamFrustum();
    }
  }

  // ── Raycasting ──

  /** Pick scene objects under a screen coordinate */
  pick(screenX: number, screenY: number): { id: string; point: THREE.Vector3 } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const targets = [...this.objectMap.values()];
    const hits = raycaster.intersectObjects(targets, true);

    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj && !obj.userData.geomId) obj = obj.parent;
      if (obj?.userData.geomId) {
        return { id: obj.userData.geomId, point: hit.point };
      }
    }
    return null;
  }

  /** Project a screen position onto a plane */
  screenToPlane(
    screenX: number, screenY: number,
    plane?: THREE.Plane
  ): THREE.Vector3 | null {
    const defaultNormal = this.isZUp ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const p = plane ?? new THREE.Plane(defaultNormal, 0);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const target = new THREE.Vector3();
    return raycaster.ray.intersectPlane(p, target) ? target : null;
  }

  // ── Cleanup ──

  private disposeObject(obj: THREE.Object3D) {
    obj.traverse(child => {
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
    this.threeScene.environment = null;
    this.envMap?.dispose();
    this.envMap = null;
    cancelAnimationFrame(this.rafId);
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
}
