/**
 * The fading grid ground (`gridStyle: "fading"`): the ground plane ruled in round metres
 * for the size of the content, every fifth line stronger, fading to nothing well inside
 * its own edge, so a reader gets a sense of size and the edge of the sheet is never seen.
 * Lines only, a step off the background, a pixel wide at any distance (fwidth); ruled from
 * the world origin so a line falls on a round coordinate, faded round the content.
 */
import * as THREE from "three";
import { groundGrid, gridLineColour } from "./viewRules";

const srgb = (hex: number) => new THREE.Vector3((hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255);

export class FadingGrid {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  constructor(background: THREE.ColorRepresentation, zUp: boolean) {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      defines: zUp ? { Z_UP: 1 } : {},
      uniforms: {
        // A plain vector of sRGB components, not a Color: a ShaderMaterial writes its colour
        // to the screen as is, without the linear-to-sRGB step other materials get.
        uLine: { value: srgb(gridLineColour(background)) },
        uCentre: { value: new THREE.Vector2() },
        uMinor: { value: 1 },
        uMajor: { value: 5 },
        uFadeFrom: { value: 10 },
        uFadeTo: { value: 30 },
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }`,
      fragmentShader: `
        uniform vec3 uLine;
        uniform vec2 uCentre;
        uniform float uMinor;
        uniform float uMajor;
        uniform float uFadeFrom;
        uniform float uFadeTo;
        varying vec3 vWorld;
        float rule(vec2 p, float step) {
          vec2 q = p / step;
          vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
          return 1.0 - min(min(g.x, g.y), 1.0);
        }
        void main() {
          #ifdef Z_UP
            vec2 p = vWorld.xy;
          #else
            vec2 p = vWorld.xz;
          #endif
          float fade = 1.0 - smoothstep(uFadeFrom, uFadeTo, length(p - uCentre));
          float line = max(rule(p, uMinor) * 0.55, rule(p, uMajor));
          gl_FragColor = vec4(uLine, line * fade);
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    if (!zUp) this.mesh.rotation.x = -Math.PI / 2;           // the plane lies in XY; Y-up's ground is XZ
    this.mesh.renderOrder = -2;                              // under the content's own transparency
    this.mesh.raycast = () => {};
    this.zUp = zUp;
  }

  private zUp: boolean;

  /** Space and centre the grid for content of this bounding sphere (world coordinates). */
  fit(sphere: THREE.Sphere): void {
    const grid = groundGrid(sphere.radius);
    const c = sphere.center;
    const [u, v] = this.zUp ? [c.x, c.y] : [c.x, c.z];
    const uni = this.mesh.material.uniforms;
    (uni.uCentre.value as THREE.Vector2).set(u, v);
    uni.uMinor.value = grid.minor;
    uni.uMajor.value = grid.major;
    uni.uFadeFrom.value = grid.fadeFrom;
    uni.uFadeTo.value = grid.fadeTo;
    this.mesh.position.set(u, this.zUp ? v : 0, this.zUp ? 0 : v);
    this.mesh.scale.set(grid.size, grid.size, 1);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
