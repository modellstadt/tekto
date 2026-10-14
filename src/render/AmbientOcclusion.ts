/**
 * Ambient occlusion over a ThreeRenderer's frame, with three's GTAO: darkening where
 * surfaces meet and close in (corners, reveals, under decks and steps). The frame is drawn
 * as the renderer draws it, its tone mapping, background, grid, antialiasing and section as
 * they are, and the occlusion is then computed and multiplied over it; running the frame
 * through an EffectComposer instead tone-maps the background and hides the grid. It follows
 * the section, and the orthographic (drawing) views and the modes other than solid go
 * without. Built on first use.
 */
import * as THREE from "three";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import type { RendererCore } from "./RendererCore";

/** How far occlusion reaches (m) and how dark it gets (0..1). */
export interface AmbientOcclusionOptions { radius?: number; intensity?: number }

export class AmbientOcclusion {
  private gtao: GTAOPass | null = null;
  private quad: FullScreenQuad | null = null;
  private target: THREE.WebGLRenderTarget | null = null;   // GTAO's output, which it never writes (Off)
  private size = new THREE.Vector2();
  private last = new THREE.Vector2();
  private ratio = 0;
  private clip: THREE.Plane | null = null;
  enabled = false;
  private radius = 0.6;                                     // a hand's breadth to a stride
  private intensity = 0.85;

  constructor(private core: RendererCore) {}

  set(on: boolean | AmbientOcclusionOptions): void {
    this.enabled = on !== false;
    if (typeof on === "object") {
      if (on.radius !== undefined) {
        if (!(on.radius > 0)) throw new Error(`setAmbientOcclusion: radius must be above 0, got ${on.radius}`);
        this.radius = on.radius;
      }
      if (on.intensity !== undefined) this.intensity = Math.min(1, Math.max(0, on.intensity));
      this.gtao?.updateGtaoMaterial({ radius: this.radius });
    }
    this.core.requestRender();
  }

  /** After the frame is on the screen: multiply the occlusion over it. */
  apply(camera: THREE.Camera, clip: THREE.Plane | null): void {
    if (!this.enabled || !(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    // Shading, so the shaded view only: a hidden-line drawing stays black and white, and
    // wireframe and ghost have no surfaces for it to sit on.
    if (this.core.gScene.renderMode !== "solid") return;
    const gl = this.core.renderer;
    if (gl.getRenderTarget() !== null) return;
    gl.getSize(this.size);
    if (!this.gtao) {
      this.gtao = new GTAOPass(this.core.threeScene, camera, this.size.x, this.size.y);
      this.gtao.updateGtaoMaterial({ radius: this.radius, distanceExponent: 1.5, thickness: 1, scale: 1, samples: 16 });
      this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
      this.gtao.output = GTAOPass.OUTPUT.Off;               // compute only: the frame is drawn already
      this.quad = new FullScreenQuad(this.gtao.blendMaterial);
      this.target = new THREE.WebGLRenderTarget(1, 1);
    }
    const g = this.gtao;
    if (!this.size.equals(this.last) || gl.getPixelRatio() !== this.ratio) {
      this.last.copy(this.size);
      this.ratio = gl.getPixelRatio();
      g.setSize(this.size.x * this.ratio, this.size.y * this.ratio);
    }
    if (clip !== this.clip) {
      // What the section cut away casts no occlusion either.
      this.clip = clip;
      g.normalMaterial.clippingPlanes = clip ? [clip] : null;
      g.normalMaterial.needsUpdate = true;
    }
    g.camera = camera;
    g.render(gl, this.target!, this.target!, 0, false);
    gl.setRenderTarget(null);
    g.blendMaterial.uniforms.tDiffuse.value = g.gtaoMap;
    g.blendMaterial.uniforms.intensity.value = this.intensity;
    const clear = gl.autoClear;
    gl.autoClear = false;
    this.quad!.render(gl);
    gl.autoClear = clear;
  }

  dispose(): void {
    this.quad?.dispose();
    this.target?.dispose();
    this.gtao?.dispose();
    this.gtao = null;
  }
}
