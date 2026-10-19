/**
 * Scene objects → three.js objects, for ThreeRenderer: the material each lighting mode wants
 * (Phong in Flat, PBR in Studio), meshes as each render mode draws them (solid with its wire
 * overlay, wireframe, the hidden-line occluder with creases and silhouettes, ghost), lines,
 * points, labels, polygons and planes. Crease lines are queued and built a frame at a time
 * (`buildEdges`), so a mode switch on a large model doesn't stall.
 */
import * as THREE from "three";
import type { SceneObject } from "../scene/Scene";
import { Mesh as GMesh } from "../core/geometry/mesh/Mesh";
import { surfaceAppearance, edgeStyle } from "./viewRules";
import type { RendererCore } from "./RendererCore";
import type { Lighting } from "./Lighting";

export class ObjectBuilder {
  private edgeQueue: { line: THREE.LineSegments; source: THREE.BufferGeometry; angle: number }[] = [];

  constructor(private core: RendererCore, private lighting: Lighting) {}


  /**
   * Build a material that respects the current lighting mode. Studio mode
   * returns an `MeshStandardMaterial` (PBR; reacts correctly to shadows
   * and tonemapping); Flat mode returns the original `MeshPhongMaterial`.
   * Same option surface — caller doesn't have to care which one comes back.
   */
  makeMaterial(
    opts: THREE.MeshPhongMaterialParameters & { metalness?: number; roughness?: number },
  ): THREE.MeshPhongMaterial | THREE.MeshStandardMaterial {
    // Only the parameters that are set: three.js warns once per material for each one passed as
    // undefined, and a list of named keys silently drops the rest (polygonOffset did, so in
    // Studio a surface's back faces painted over a section's poché).
    const { metalness, roughness, ...rest } = opts;
    const given = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    if (this.lighting.currentLighting === "studio") {
      return new THREE.MeshStandardMaterial({
        ...given,
        color:       this.lighting.studioColor ?? opts.color,
        flatShading: opts.flatShading ?? this.lighting.studioFlatShading,
        roughness:   roughness ?? this.lighting.studioRoughness,
        metalness:   metalness ?? this.lighting.studioMetalness,
      });
    }
    // Phong has no metalness/roughness.
    return new THREE.MeshPhongMaterial(given);
  }


  /** Cached horizontal-stripe textures for print-layer shading, keyed by layer height (m). One texture
   *  period = one printed bead: bright rounded crown, dark groove at the layer boundary. The pipe UVs
   *  carry V in metres, so repeat.y = 1/layerH gives physically-true layer spacing. */
  private _stripeTexCache = new Map<number, THREE.Texture>();

  private _stripeTexture(layerH: number): THREE.Texture {
    let tex = this._stripeTexCache.get(layerH);
    if (tex) return tex;
    const H = 64;
    const cv = document.createElement("canvas");
    cv.width = 2; cv.height = H;
    const ctx = cv.getContext("2d")!;
    for (let y = 0; y < H; y++) {
      const t = y / H;                                        // 0..1 across one bead
      const crown = Math.sin(Math.PI * t);                    // rounded bead profile
      const v = Math.round(150 + 105 * Math.pow(crown, 0.7)); // 150 (groove) … 255 (crown)
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, 2, 1);
    }
    tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1 / layerH);
    tex.anisotropy = 4;
    this._stripeTexCache.set(layerH, tex);
    return tex;
  }


  /** Build a THREE.Line for a line-type object — dashed material (+ line distances)
   *  when the style requests it, else a basic line material. */
  private _makeLine(geo: THREE.BufferGeometry, s: SceneObject["style"]): THREE.Line {
    const mat = s.dash
      ? new THREE.LineDashedMaterial({ color: s.color, opacity: s.opacity, transparent: s.opacity < 1, dashSize: s.dash.size, gapSize: s.dash.gap })
      : new THREE.LineBasicMaterial({ color: s.color, opacity: s.opacity, transparent: s.opacity < 1 });
    const line = new THREE.Line(geo, mat);
    if (s.dash) line.computeLineDistances();
    return line;
  }


  convert(obj: SceneObject): THREE.Object3D | null {
    const s = obj.style;
    switch (obj.type) {
      case "point": {
        const geo = new THREE.SphereGeometry(s.pointSize, 12, 12);
        const mat = this.makeMaterial({
          color: s.color, emissive: s.color, emissiveIntensity: 0.3,
          opacity: s.opacity, transparent: s.opacity < 1,
          metalness: s.metalness, roughness: s.roughness,
        });
        const mesh = new THREE.Mesh(geo, mat);
        if (obj.position) mesh.position.set(obj.position.x, obj.position.y, obj.position.z);

        if (s.label) {
          const group = new THREE.Group();
          group.add(mesh);
          const sprite = this.createTextSprite(s.label, s.labelColor ?? s.color, s.labelScale ?? 1);
          if (obj.position) sprite.position.set(obj.position.x, obj.position.y, obj.position.z);
          // Offset label slightly above the point
          if (this.core.isZUp) sprite.position.z += s.pointSize + 0.15;
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
          const mesh = new THREE.Mesh(geo, this.makeMaterial({
            color: s.color, opacity: s.opacity, transparent: s.opacity < 1,
            metalness: s.metalness, roughness: s.roughness,
          }));
          // Orient: look from a towards b
          mesh.position.copy(a);
          mesh.lookAt(b);
          return mesh;
        }

        const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
        return this._makeLine(geo, s);
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
        return this._makeLine(geo, s);
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
          if (this.core.isZUp) {
            const shape = new THREE.Shape(obj.vertices.map(v => new THREE.Vector2(v.x, v.y)));
            const shapeGeo = new THREE.ShapeGeometry(shape);
            group.add(new THREE.Mesh(shapeGeo, this.makeMaterial({
              color: s.color, opacity: s.opacity, transparent: true, side: THREE.DoubleSide,
              metalness: s.metalness, roughness: s.roughness,
            })));
          } else {
            const shape = new THREE.Shape(obj.vertices.map(v => new THREE.Vector2(v.x, v.z)));
            const shapeGeo = new THREE.ShapeGeometry(shape);
            shapeGeo.rotateX(-Math.PI / 2);
            group.add(new THREE.Mesh(shapeGeo, this.makeMaterial({
              color: s.color, opacity: s.opacity, transparent: true, side: THREE.DoubleSide,
              metalness: s.metalness, roughness: s.roughness,
            })));
          }
        }
        return group;
      }

      case "light": {
        // A light the model holds: no shadows (a point light's shadow is six renders, per light).
        if (!obj.position || !obj.light) return null;
        const L = obj.light, p = obj.position;
        const group = new THREE.Group();
        if (L.kind === "spot" && L.target) {
          const spot = new THREE.SpotLight(s.color, L.intensity, L.range, L.angle * Math.PI / 180, 0.3, 2);
          spot.position.set(p.x, p.y, p.z);
          spot.target.position.set(L.target.x, L.target.y, L.target.z);
          group.add(spot, spot.target);
        } else {
          const bulb = new THREE.PointLight(s.color, L.intensity, L.range, 2);
          bulb.position.set(p.x, p.y, p.z);
          group.add(bulb);
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
          if (this.core.isZUp) {
            pts.push(new THREE.Vector3(obj.center.x + ca, obj.center.y + sa, obj.center.z));
          } else {
            pts.push(new THREE.Vector3(obj.center.x + ca, obj.center.y, obj.center.z + sa));
          }
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return this._makeLine(geo, s);
      }

      case "plane": {
        if (!obj.normal) return null;
        const geo = new THREE.PlaneGeometry(10, 10);
        const mat = this.makeMaterial({
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
    const data = gmesh.toMeshData();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
    // Node colours (`Mesh.setColors`, e.g. from a `ColorRamp`) win over the style colour.
    const hasColors = !!data.colors?.length;
    if (hasColors) geo.setAttribute("color", new THREE.BufferAttribute(data.colors!, 4));

    // Pipe UVs (tube meshes tag themselves with __pipeUV = { sides, vAtRing }): vertices are
    // ring-major (toMeshData keeps node order), so vertex k sits on ring
    // floor(k/sides). U = fraction around the section, V = centreline length in METRES — print-layer
    // striping (style.printLayerH) repeats a texture along V at true physical scale.
    const pipeUV = (gmesh as unknown as { __pipeUV?: { sides: number; vAtRing: number[] } }).__pipeUV;
    if (pipeUV && pipeUV.sides > 0) {
      const n = data.positions.length / 3;
      const uv = new Float32Array(n * 2);
      for (let k = 0; k < n; k++) {
        const ring = Math.min(Math.floor(k / pipeUV.sides), pipeUV.vAtRing.length - 1);
        uv[k * 2] = (k % pipeUV.sides) / pipeUV.sides;
        uv[k * 2 + 1] = pipeUV.vAtRing[ring] ?? 0;
      }
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }

    return this.buildMeshGroup(geo, s, hasColors);
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
    if (data.groups?.length && this.core.gScene.renderMode === "solid" && !hasColors) {
      const groupColors = s.groupColors ?? {};
      const side = s.backfaceColor ? THREE.DoubleSide : (s.doubleSided ? THREE.DoubleSide : THREE.FrontSide);
      for (let i = 0; i < data.groups.length; i++) {
        const g = data.groups[i];
        geo.addGroup(g.indexStart, g.indexCount, i);
      }
      const materials = data.groups.map(g => this.makeMaterial({
        color: groupColors[g.name] ?? s.color,
        opacity: s.wireframe ? s.opacity * 0.3 : s.opacity,
        transparent: s.opacity < 1 || s.wireframe,
        side,
        flatShading: s.flatShading ?? false,
        metalness: s.metalness, roughness: s.roughness,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
      }));
      const group = new THREE.Group();
      const surface = new THREE.Mesh(geo, materials);
      surface.userData.surface = true;
      group.add(surface);
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
    const mode = this.core.gScene.renderMode;
    const side = s.doubleSided ? THREE.DoubleSide : THREE.FrontSide;

    if (mode === "wireframe") {
      // Wireframe only
      const wireMat = new THREE.MeshBasicMaterial({
        color: s.color, wireframe: true,
        opacity: s.opacity, transparent: s.opacity < 1,
      });
      group.add(new THREE.Mesh(geo, wireMat));

    } else if (mode === "hiddenline") {
      // Pass 1: solid in background color for depth occlusion. toneMapped:false
      // on both passes — the background clear color is never tone-mapped, so in
      // Studio lighting (ACES) a tone-mapped fill would read as a visible gray
      // silhouette, and edge colors would shift from their set edgeColor.
      const occlusionMat = new THREE.MeshBasicMaterial({
        color: this.core.config.backgroundColor,
        side,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      group.add(new THREE.Mesh(geo, occlusionMat));

      // Pass 2: feature (sharp / crease) edges on top. EdgesGeometry keeps only
      // edges whose dihedral angle exceeds `edgeAngle`, so coplanar tessellation
      // seams (quad diagonals, flat-wall tiling) drop out — a clean line drawing.
      const edgeAngle = s.edgeAngle ?? 30; // degrees
      const wireMat = new THREE.LineBasicMaterial({ color: s.edgeColor ?? 0x2f2f2f, toneMapped: false });
      group.add(this._edgeLines(geo, edgeAngle, wireMat));

      // Pass 3: view-dependent SILHOUETTES for smooth geometry (pipes, posts,
      // subdivision surfaces) — those have no dihedral above the threshold, so
      // passes 1+2 leave them invisible. Render the same mesh as BACK faces in
      // edge colour with no depth offset: the front occluder (offset +1) wins
      // everywhere except along the contour rim, leaving a thin outline that
      // tracks the view — each tube reads as its two silhouette lines.
      const rimMat = new THREE.MeshBasicMaterial({
        color: s.edgeColor ?? 0x2f2f2f,
        side: THREE.BackSide,
        toneMapped: false,
      });
      group.add(new THREE.Mesh(geo, rimMat));

    } else if (mode === "ghost") {
      // Every surface in its own colour, faint and without depth writes, so a part
      // behind reads through the ones in front; flat (emissive), so the side turned
      // away from the light doesn't drop to black. Creases carry the form.
      const look = surfaceAppearance("ghost", 0);
      const surface = new THREE.Mesh(geo, this.makeMaterial({
        color: hasVertexColors ? 0xffffff : s.color, vertexColors: hasVertexColors,
        emissive: hasVertexColors ? 0x000000 : s.color, emissiveIntensity: 0.8,
        opacity: look.opacity, transparent: true, depthWrite: look.depthWrite,
        side: THREE.DoubleSide,
      }));
      surface.userData.surface = true;
      group.add(surface);
      const edge = edgeStyle("ghost", this.core.config.backgroundColor);
      group.add(this._edgeLines(geo, s.edgeAngle ?? 30, new THREE.LineBasicMaterial({
        color: edge.colour, opacity: edge.opacity, transparent: true, depthWrite: false,
      })));

    } else {
      // Solid mode (default) — polygonOffset pushes mesh depth back so
      // coplanar lines (lab.line) render cleanly on top without z-fighting.
      const solidMat = this.makeMaterial({
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
      // Print-layer striping: with printLayerH set (metres) and pipe UVs present (V = metres along the
      // tube), modulate colour + bump with a horizontal stripe texture repeating once per layer height —
      // the stacked-bead look of wire-arc printed metal, at true physical scale.
      if (s.printLayerH && s.printLayerH > 1e-5 && geo.getAttribute("uv")) {
        const tex = this._stripeTexture(s.printLayerH);
        solidMat.map = tex;
        solidMat.bumpMap = tex;
        solidMat.bumpScale = s.printLayerH * 0.35;   // groove depth scales with the bead size
        solidMat.needsUpdate = true;
      }

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

      const surface = new THREE.Mesh(geo, solidMat);
      surface.userData.surface = true;
      group.add(surface);

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
        const wire = new THREE.Mesh(geo.clone(), subtleWire);
        wire.userData.wireOverlay = true;                    // the "wireframe" overlay switches it
        wire.visible = this.core.overlay("wireframe");
        group.add(wire);
      }
    }

    return group;
  }


  // ── Text Sprites ──

  private createTextSprite(text: string, color: string, labelScale = 1): THREE.Sprite {
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
    const scale = 0.005 * labelScale;
    sprite.scale.set(w * scale, h * scale, 1);
    return sprite;
  }


  // ── Edges, a frame at a time ──

  /** Crease lines for `geo`, built on a later frame (see `buildEdges`): a mode switch on a
   *  model of thousands of meshes no longer stalls the tab, it draws the creases in. */
  private _edgeLines(geo: THREE.BufferGeometry, angle: number, mat: THREE.LineBasicMaterial): THREE.LineSegments {
    const line = new THREE.LineSegments(new THREE.BufferGeometry(), mat);
    this.edgeQueue.push({ line, source: geo, angle });
    return line;
  }


  /** Build queued crease lines for up to `budgetMs`. Lines whose object is gone are skipped. */
  buildEdges(budgetMs: number): void {
    if (!this.edgeQueue.length) return;
    const t0 = performance.now();
    let built = 0;
    while (this.edgeQueue.length && (built === 0 || performance.now() - t0 < budgetMs)) {
      const { line, source, angle } = this.edgeQueue.shift()!;
      let top: THREE.Object3D = line;
      while (top.parent) top = top.parent;
      if (top !== this.core.threeScene) continue;
      line.geometry.dispose();
      line.geometry = new THREE.EdgesGeometry(source, angle);
      built++;
    }
    this.core.requestRender();
  }

  get pendingEdges(): number { return this.edgeQueue.length; }
}
