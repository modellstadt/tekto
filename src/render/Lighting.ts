/**
 * The lights of a ThreeRenderer and the two lighting modes: Flat (Phong, three cheap lights,
 * no shadows) and Studio (PBR, a sun with soft shadows framed to the content, ACES tone
 * mapping, a shadow catcher), plus the environment map, fog and exposure.
 */
import * as THREE from "three";
import { Vec3 } from "../core/math/vectors";
import type { LightingMode } from "../scene/Scene";
import type { RendererCore } from "./RendererCore";
import { daylight, flatLights, sunDirection, SUN_PRESETS, type SunPreset } from "./viewRules";

export class Lighting {
  ambientLight: THREE.AmbientLight;
  dirLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  currentLighting: LightingMode = "flat";
  // Studio-mode default PBR material, used when a mesh sets no explicit
  // metalness/roughness in its VisualStyle. Configurable via setStudioMaterial.
  studioMetalness = 0.0;
  studioRoughness = 0.65;
  // When set, forces this color on studio meshes (overriding their own); null = keep per-mesh color.
  studioColor: string | null = null;
  studioFlatShading = false;
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
  // Optional equirectangular source (e.g. a loaded HDR) for the environment.
  // null → the built-in procedural gradient. The app owns/disposes this texture.
  private envSourceTex: THREE.Texture | null = null;
  // A sky texture setSky made from an image or a canvas (the app's own textures stay the app's).
  private ownSky: THREE.Texture | null = null;
  private envEnabled = false;
  private envBackground = false;   // show the equirect source as the scene backdrop
  // The sun framed to the content (Studio): its direction, how far back at least, and
  // whether the content moved since it was framed.
  private sunDir = new THREE.Vector3(8, 10, 15).normalize();
  private sunMinDistance = 50;
  sunDirty = true;
  /** Studio's light follows the sun's altitude (setDaylight). */
  daylightOn = false;

  constructor(private core: RendererCore) {
    const isZUp = core.isZUp;
    // Lighting — references kept so `applyMode` can re-tune them
    // when switching between Flat and Studio modes.
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    core.threeScene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    this.dirLight.position.set(8, isZUp ? 10 : 15, isZUp ? 15 : 10);
    // Aim it at the origin so shadow-camera framing covers a reasonable
    // volume around the scene without per-demo configuration.
    this.dirLight.target.position.set(0, 0, 0);
    core.threeScene.add(this.dirLight);
    core.threeScene.add(this.dirLight.target);

    this.hemiLight = new THREE.HemisphereLight(0x4466aa, 0x332211, 0.4);
    // The sky comes from the light's position: +Y by default, so a Z-up scene needs it on +Z,
    // or its -Y facades (the ones the default and iso cameras look at) get the ground colour.
    if (isZUp) this.hemiLight.position.set(0, 0, 1);
    core.threeScene.add(this.hemiLight);
    this.sunDir.copy(this.dirLight.position).normalize();
  }

  setStudioMaterial(
    metalness: number,
    roughness: number,
    color: string | null = null,
    flatShading = false,
  ): void {
    const metalChanged = this.studioMetalness !== metalness || this.studioRoughness !== roughness;
    this.studioMetalness = metalness;
    this.studioRoughness = roughness;
    this.studioColor = color;
    this.studioFlatShading = flatShading;
    // Retroactively patch metalness/roughness on the existing Studio
    // materials of meshes that don't carry their OWN values — this mirrors
    // the `opts.metalness ?? studioMetalness` creation rule, so metal sliders
    // can be display-only (no sketch re-run). Color is NOT patched: the
    // color override is creation-ORDER dependent (e.g. neutral context drawn
    // first, then the override enabled for the stair solids).
    if (metalChanged && this.currentLighting === "studio") {
      for (const obj of this.core.gScene.all()) {
        if (obj.type !== "mesh") continue;
        const s = obj.style as { metalness?: number; roughness?: number };
        if (s.metalness !== undefined && s.roughness !== undefined) continue;
        const t = this.core.objectMap.get(obj.id);
        if (!t) continue;
        t.traverse((c) => {
          if (!(c instanceof THREE.Mesh)) return;
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          for (const m of mats) {
            if (m instanceof THREE.MeshStandardMaterial) {
              if (s.metalness === undefined) m.metalness = metalness;
              if (s.roughness === undefined) m.roughness = roughness;
            }
          }
        });
      }
    }
    this.core.requestRender();
  }

  setShadowGroundVisible(visible: boolean): void {
    this.shadowGroundHidden = !visible;
    if (this.shadowGround) this.shadowGround.visible = visible;
    this.core.requestRender();
  }

  setFog(color: string, density = 0): void {
    this.core.threeScene.fog = density > 1e-6 ? new THREE.FogExp2(new THREE.Color(color), density) : null;
    this.core.requestRender();
  }

  setExposure(v: number): void {
    this.core.renderer.toneMappingExposure = v;
    this.core.requestRender();
  }

  setSunDirection(direction: Vec3, distance = 50): void {
    this.currentSunPreset = null;
    const x = direction.x;
    const y = this.core.isZUp ? direction.y :  direction.z;
    const z = this.core.isZUp ? direction.z : -direction.y;
    this.sunDir.set(x, y, z).normalize();
    this.sunMinDistance = distance;
    this.sunDirty = true;
    this.fitSun();
    this.core.requestRender();
  }


  /** Aim the sun at the content's centre and fit its shadow camera around it. */
  fitSun(): void {
    this.sunDirty = false;
    const box = this.core.contentBox();
    for (const o of this.core.externalObjects.values()) if (o.visible) box.expandByObject(o);
    const sphere = box.isEmpty() ? new THREE.Sphere(new THREE.Vector3(), 10) : box.getBoundingSphere(new THREE.Sphere());
    const r = Math.max(sphere.radius, 0.5);
    const d = Math.max(this.sunMinDistance, r * 3);
    this.dirLight.position.copy(sphere.center).addScaledVector(this.sunDir, d);
    this.dirLight.target.position.copy(sphere.center);
    this.dirLight.target.updateMatrixWorld();
    // A framed shadow map has small texels: push the lookup out along the normal, scaled to
    // the content, or lit faces shadow themselves (acne); a low sun grazes the facades and
    // needs more.
    const lift = Math.max(this.sunAltitude(), 0) * Math.PI / 180;
    this.dirLight.shadow.normalBias = r * 0.002 * (Math.sin(lift) >= 0.5 ? 1 : 0.5 / Math.max(Math.sin(lift), 0.1));
    // A low sun's long shadows show the shadow map's texels as steps along their edges:
    // soften them more the lower it is (three r180+ PCF; the default sun keeps radius 1).
    this.dirLight.shadow.radius = Math.sin(lift) >= 0.5 ? 1 : 1 + 3 * (1 - Math.sin(lift) / 0.5);
    this._applyDaylight();
    const sc = this.dirLight.shadow.camera;
    sc.left = -r * 1.2; sc.right = r * 1.2; sc.top = r * 1.2; sc.bottom = -r * 1.2;
    sc.near = Math.max(0.01, d - r * 1.5);
    sc.far = d + r * 1.5;
    sc.updateProjectionMatrix();
  }


  /** The sun's altitude above the ground plane, in degrees. */
  sunAltitude(): number {
    const up = this.core.isZUp ? this.sunDir.z : this.sunDir.y;
    return Math.asin(Math.max(-1, Math.min(1, up))) * 180 / Math.PI;
  }

  /** The last preset `sunPreset` set, until the sun is moved another way. */
  currentSunPreset: SunPreset | null = null;

  /** A named sun: Studio, the light following the sun, the sun where the preset puts it. */
  sunPreset(name: SunPreset): void {
    const p = SUN_PRESETS[name];
    if (!p) throw new Error(`sunPreset: unknown preset "${name}" (morning, noon or sunset)`);
    this.core.gScene.setLightingMode("studio");
    this.setDaylight(true);
    const d = sunDirection(p.azimuth, p.altitude);
    this.setSunDirection(new Vec3(d.x, d.y, d.z));
    this.currentSunPreset = name;
  }

  setDaylight(on: boolean): void {
    this.daylightOn = on;
    if (on) this.sunDirty = true;
    else this._resetDaylight();
    this.core.requestRender();
  }

  /** In Studio with daylight on: sun, sky, ambient, exposure and background from the altitude. */
  private _applyDaylight(): void {
    if (!this.daylightOn || this.currentLighting !== "studio") return;
    const d = daylight(this.sunAltitude());
    this.dirLight.color.setHex(d.sun);
    this.dirLight.intensity = d.sunIntensity;
    this.hemiLight.color.setHex(d.sky);
    this.hemiLight.groundColor.setHex(d.ground);
    this.hemiLight.intensity = d.skyIntensity;
    this.ambientLight.intensity = d.ambient;
    this.core.renderer.toneMappingExposure = d.exposure;
    if (!(this.envBackground && this.envSourceTex)) {
      this.core.threeScene.background = new THREE.Color(this.core.config.backgroundColor).lerp(new THREE.Color(d.background), d.backgroundAmount);
    }
  }

  /** Back to the plain balance of the current mode. */
  private _resetDaylight(): void {
    this.dirLight.color.setHex(0xffffff);              // the sky's colours come back with applyMode
    if (!(this.envBackground && this.envSourceTex)) this.core.threeScene.background = new THREE.Color(this.core.config.backgroundColor);
    this.applyMode(this.currentLighting);
  }

  /**
   * Reconfigure renderer + lights + scene shadow flags for the given mode.
   * Material swapping happens after this returns, via `rebuildAllMeshes`.
   */
  applyMode(mode: import("../scene/Scene").LightingMode): void {
    this.currentLighting = mode;
    const studio = mode === "studio";

    // ── Renderer: shadow map + tonemapping + colour space ─────────
    this.core.renderer.shadowMap.enabled = studio;
    // Soft PCF: from r180 three makes PCFShadowMap soft and warns that PCFSoftShadowMap is
    // deprecated (it maps it to PCFShadowMap anyway), so ask for what each version draws soft.
    this.core.renderer.shadowMap.type    = parseInt(THREE.REVISION, 10) >= 180 ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    this.core.renderer.toneMapping       = studio ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.core.renderer.toneMappingExposure = 1.0;
    this.core.renderer.outputColorSpace  = THREE.SRGBColorSpace;

    // ── Lights: rebalance so Studio reads more like a sunlit scene ─
    if (studio) {
      // Studio's own sky, whatever Flat was given (daylight retints it after this)
      const sketch = flatLights("sketch");
      this.hemiLight.color.setHex(sketch.skyColour);
      this.hemiLight.groundColor.setHex(sketch.groundColour);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.intensity    = 0.30;
      this.dirLight.intensity     = 2.8;
      this.dirLight.castShadow    = true;
      this.dirLight.shadow.mapSize.set(2048, 2048);
      this.dirLight.shadow.bias   = -0.0005;
      // The shadow camera is framed to the content on the next draw (fitSun).
      this.sunDirty = true;
    } else {
      // the app's balance: dim and cool for a dark sketch, or plain colours (flatLights)
      const flat = flatLights(this.core.config.flatLighting);
      this.ambientLight.intensity = flat.ambient;
      this.hemiLight.intensity    = flat.sky;
      this.hemiLight.color.setHex(flat.skyColour);
      this.hemiLight.groundColor.setHex(flat.groundColour);
      this.dirLight.intensity     = flat.sun;
      this.dirLight.castShadow    = false;
      // Daylight is Studio's: flat draws in the plain colours.
      if (this.daylightOn) {
        this.dirLight.color.setHex(0xffffff);
        if (!(this.envBackground && this.envSourceTex)) this.core.threeScene.background = new THREE.Color(this.core.config.backgroundColor);
      }
    }

    // ── Mesh cast/receive flags ───────────────────────────────────
    // Walk the existing tree; rebuildAllMeshes (called by the scene
    // event handler) will set the same flags on freshly-built meshes.
    const cast = studio && this.core.gScene.renderMode !== "ghost";
    this.core.threeScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow    = cast;
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
      if (!this.core.isZUp) this.shadowGround.rotation.x = -Math.PI / 2;
      // Drop slightly below the grid so it doesn't z-fight with anything
      // sitting at the ground plane.
      this.shadowGround.position.set(0, this.core.isZUp ? 0 : -0.001, this.core.isZUp ? -0.001 : 0);
      this.shadowGround.visible = !this.shadowGroundHidden;
      this.core.threeScene.add(this.shadowGround);
    } else if (!studio && this.shadowGround) {
      this.core.threeScene.remove(this.shadowGround);
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
  applyEnvironment(enabled: boolean): void {
    this.envEnabled = enabled;
    if (enabled) {
      if (!this.envMap) this.envMap = this._buildEnvironment();
      this.core.threeScene.environment = this.envMap;
    } else {
      this.core.threeScene.environment = null;
    }
  }

  setEnvironmentSource(equirect: THREE.Texture | null): void {
    if (this.envSourceTex === equirect) return;
    this.envSourceTex = equirect;
    if (this.envMap) { this.envMap.dispose(); this.envMap = null; }
    if (this.envEnabled) {
      this.envMap = this._buildEnvironment();
      this.core.threeScene.environment = this.envMap;
    }
    this._applyBackground();
    this.core.requestRender();
  }

  setEnvironmentBackground(visible: boolean): void {
    this.envBackground = visible;
    this._applyBackground();
    this.core.requestRender();
  }

  setEnvironmentRotation(x: number, y: number, z: number): void {
    // environment/backgroundRotation exist on three >= r163; the consuming app
    // supplies three 0.183 at runtime (peer dep). tekto's type-check three may
    // predate them, so reach through a cast and no-op gracefully if absent.
    const s = this.core.threeScene as unknown as {
      environmentRotation?: THREE.Euler;
      backgroundRotation?: THREE.Euler;
    };
    s.environmentRotation?.set(x, y, z);
    s.backgroundRotation?.set(x, y, z);
    this.core.requestRender();
  }


  private _applyBackground(): void {
    if (this.envBackground && this.envSourceTex) {
      this.envSourceTex.mapping = THREE.EquirectangularReflectionMapping;
      this.core.threeScene.background = this.envSourceTex;
    } else if ((this.core.threeScene.background as THREE.Texture | null)?.isTexture) {
      // The image off: the plain background comes back (it stayed up before).
      this.core.threeScene.background = new THREE.Color(this.core.config.backgroundColor);
    }
  }

  /** A sky: an equirectangular image lighting the scene and, by default, behind it. */
  setSky(source: THREE.Texture | HTMLImageElement | HTMLCanvasElement | null, opts: { background?: boolean; intensity?: number } = {}): void {
    const s = this.core.threeScene as THREE.Scene & { environmentIntensity?: number; backgroundIntensity?: number };
    // An image or a canvas (an LDR panorama) is wrapped here, and the wrapper is ours to free.
    this.ownSky?.dispose();
    this.ownSky = null;
    let texture: THREE.Texture | null = null;
    if (source && (source as THREE.Texture).isTexture) texture = source as THREE.Texture;
    else if (source) {
      texture = this.ownSky = new THREE.Texture(source as HTMLImageElement | HTMLCanvasElement);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    }
    const intensity = opts.intensity ?? 1;
    if (!(intensity >= 0)) throw new Error(`setSky: intensity must be 0 or more, got ${opts.intensity}`);
    s.environmentIntensity = texture ? intensity : 1;
    s.backgroundIntensity = texture ? intensity : 1;
    this.envBackground = !!texture && (opts.background ?? true);
    this.setEnvironmentSource(texture);
    // An equirect's up is +Y: stand it up in a Z-up scene.
    if (texture && this.core.isZUp) this.setEnvironmentRotation(Math.PI / 2, 0, 0);
    this.core.gScene.setEnvironment(!!texture);
    this.core.requestRender();
  }


  /**
   * Build a prefiltered (PMREM) environment from a procedural vertical
   * gradient — bright neutral sky at the top, mid horizon, darker ground —
   * using core Three only (no `three/examples` RoomEnvironment). Returns the
   * PMREM-filtered cube texture; the source `DataTexture` and the generator
   * are disposed before returning.
   */
  private _buildEnvironment(): THREE.Texture {
    // App-supplied equirectangular source (e.g. an HDR) takes precedence.
    if (this.envSourceTex) {
      this.envSourceTex.mapping = THREE.EquirectangularReflectionMapping;
      const pmremSrc = new THREE.PMREMGenerator(this.core.renderer);
      const envSrc = pmremSrc.fromEquirectangular(this.envSourceTex).texture;
      pmremSrc.dispose();
      return envSrc;
    }
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

    const pmrem = new THREE.PMREMGenerator(this.core.renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }

  dispose(): void {
    this.core.threeScene.environment = null;
    this.envMap?.dispose();
    this.envMap = null;
    this.ownSky?.dispose();
    this.ownSky = null;
  }
}
