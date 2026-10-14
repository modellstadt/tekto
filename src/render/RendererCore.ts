/**
 * What the parts of a ThreeRenderer (ObjectBuilder, Lighting, CameraRig, Pointer, Marks)
 * share: the scene on both sides, the canvas, the camera in use, and a few questions only
 * the whole renderer can answer. Internal — apps use ThreeRenderer.
 */
import type * as THREE from "three";
// @ts-ignore — OrbitControls typings vary across Three.js versions
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Scene as GScene } from "../scene/Scene";

export interface RendererCore {
  readonly gScene: GScene;
  readonly threeScene: THREE.Scene;
  readonly renderer: THREE.WebGLRenderer;
  readonly container: HTMLElement;
  readonly isZUp: boolean;
  /** Scene object id → the three.js object drawn for it. */
  readonly objectMap: Map<string, THREE.Object3D>;
  /** Raw three.js objects the app added (`addExternalObject`). */
  readonly externalObjects: Map<string, THREE.Object3D>;
  /** OrbitControls, when enabled. */
  readonly controls?: OrbitControls;
  readonly config: { backgroundColor: number; units: string | null };
  readonly camera: THREE.PerspectiveCamera;
  readonly activeCamera: THREE.Camera;
  requestRender(): void;
  /** Scene ids, or record keys resolved through the scene, to the three objects drawn for them. */
  resolve(objects: readonly string[]): THREE.Object3D[];
  /** Bounds of what the scene shows. */
  contentBox(): THREE.Box3;
}
