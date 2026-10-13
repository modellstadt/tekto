/**
 * What a ThreeRenderer marks on the model: the selection (tinted, or outlined on top), a
 * section cut with its poché, and callouts in the margins with leaders to what they name.
 */
import * as THREE from "three";
import type { SectionRequest } from "../scene/Scene";
import { sectionPlane, sectionAppearance } from "./viewRules";
import { Callouts, layoutLabels, labelWidthFor, type CalloutItem } from "./Callouts";
import type { RendererCore } from "./RendererCore";

/** A material you can see through (its back faces would show without a cut). */
function seeThrough(m: THREE.Material | THREE.Material[]): boolean {
  return (Array.isArray(m) ? m : [m]).some(x => x.transparent && x.opacity < 1);
}

export class Marks {
  selectionMaterials = new Map<string, { mat: THREE.Material; oldEmissive: THREE.Color; oldIntensity: number; oldOpacity: number; oldDepthWrite: boolean }>();

  // ── Section (setSection) ──
  private sectionReq: SectionRequest | null = null;
  sectionClip: THREE.Plane | null = null;
  private sectionColour: number | null = null;
  // One poché material for every cut mesh; its colour follows the render mode.
  private pocheMat: THREE.MeshBasicMaterial | null = null;

  // ── Callouts (setCallouts) ──
  private callouts: Callouts | null = null;
  private calloutAnchors = new Map<string, THREE.Vector3>();
  private calloutVisible = new Set<string>();
  private calloutCheckedAt = 0;
  private calloutRecheck = 0;
  calloutsDirty = false;
  private calloutHandlers: { onPick?: (id: string) => void; onHover?: (id: string | null) => void } = {};

  // ── Selection as outlines ──
  private selectionStyle: "tint" | "outline" = "tint";
  outlineGroup = new THREE.Group();
  private outlined: { line: THREE.LineSegments; source: THREE.Object3D }[] = [];
  // ── Others' selections (shared presence): outlines in each person's colour ──
  private presenceLines: { line: THREE.LineSegments; source: THREE.Object3D }[] = [];
  private presenceMats = new Map<string, THREE.LineBasicMaterial>();

  constructor(private core: RendererCore) {
    this.outlineGroup.renderOrder = 999;
    core.threeScene.add(this.outlineGroup);
  }

  /** Keep outlines on their objects (a gizmo drag moves them without a rebuild). */
  followOutlines(): void {
    for (const o of this.outlined) o.line.matrix.copy(o.source.matrixWorld);
    for (const o of this.presenceLines) o.line.matrix.copy(o.source.matrixWorld);
  }

  setSelectionStyle(style: "tint" | "outline"): void {
    this.selectionStyle = style;
    this.setSelectionHighlight(this.highlightIds);
  }

  private highlightIds: readonly string[] | null = null;

  setSelectionHighlight(ids: string | readonly string[] | null): void {
    this.core.requestRender();
    this.highlightIds = ids === null ? null : typeof ids === "string" ? [ids] : [...ids];
    for (const o of this.outlined) { o.line.geometry.dispose(); o.line.removeFromParent(); }
    this.outlined = [];
    // Restore prior highlight.
    for (const [, info] of this.selectionMaterials) {
      const m = info.mat as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial);
      m.emissive.copy(info.oldEmissive);
      m.emissiveIntensity = info.oldIntensity;
      m.opacity = info.oldOpacity;
      m.depthWrite = info.oldDepthWrite;
    }
    this.selectionMaterials.clear();
    const list = ids === null ? [] : typeof ids === "string" ? [ids] : ids;
    const ghost = this.core.gScene.renderMode === "ghost";
    if (this.selectionStyle === "outline") {
      for (const id of list) {
        const t = this.core.objectMap.get(id);
        if (!t) continue;
        t.updateMatrixWorld(true);
        t.traverse((c) => {
          if (!c.userData.surface) return;
          const line = new THREE.LineSegments(new THREE.EdgesGeometry((c as THREE.Mesh).geometry, 30), this._outlineMaterial());
          line.matrixAutoUpdate = false;
          line.matrix.copy(c.matrixWorld);
          line.renderOrder = 999;
          this.outlineGroup.add(line);
          this.outlined.push({ line, source: c });
        });
      }
    }
    for (const id of this.selectionStyle === "outline" ? [] : list) {
      const t = this.core.objectMap.get(id);
      if (!t) continue;
      t.traverse((child: THREE.Object3D) => {
        const m = (child as THREE.Mesh).material as (THREE.MeshPhongMaterial | THREE.MeshStandardMaterial) | undefined;
        if (m && (m as any).emissive instanceof THREE.Color) {
          this.selectionMaterials.set(child.uuid, {
            mat: m,
            oldEmissive: m.emissive.clone(),
            oldIntensity: m.emissiveIntensity ?? 0,
            oldOpacity: m.opacity,
            oldDepthWrite: m.depthWrite,
          });
          m.emissive = new THREE.Color(0x38d9a9);
          m.emissiveIntensity = 0.35;
          // Ghost exists so a selection reads through everything else: draw it solid.
          if (ghost && child.userData.surface) { m.opacity = 0.85; m.depthWrite = true; }
        }
      });
    }
  }


  /** Remove the outlines traced from `root`'s meshes (all of them for null). */
  dropOutlines(root: THREE.Object3D | null): void {
    const keep = (o: { line: THREE.LineSegments; source: THREE.Object3D }) => {
      let inside = root === null;
      for (let c: THREE.Object3D | null = o.source; c && !inside; c = c.parent) inside = c === root;
      if (inside) { o.line.geometry.dispose(); o.line.removeFromParent(); }
      return !inside;
    };
    this.outlined = this.outlined.filter(keep);
    this.presenceLines = this.presenceLines.filter(keep);
  }

  /** Outline what other people have selected, each set in its person's colour, on top of
   *  everything (and clipped by a section). An empty list clears. */
  setPresenceHighlight(entries: readonly { ids: readonly string[]; color: string }[]): void {
    for (const o of this.presenceLines) { o.line.geometry.dispose(); o.line.removeFromParent(); }
    this.presenceLines = [];
    for (const e of entries) {
      const mat = this._presenceMaterial(e.color);
      for (const id of e.ids) {
        const t = this.core.objectMap.get(id);
        if (!t) continue;
        t.updateMatrixWorld(true);
        t.traverse((c) => {
          if (!c.userData.surface) return;
          const line = new THREE.LineSegments(new THREE.EdgesGeometry((c as THREE.Mesh).geometry, 30), mat);
          line.matrixAutoUpdate = false;
          line.matrix.copy(c.matrixWorld);
          line.renderOrder = 998;                  // under this person's own selection outline
          this.outlineGroup.add(line);
          this.presenceLines.push({ line, source: c });
        });
      }
    }
    this.core.requestRender();
  }

  private _presenceMaterial(color: string): THREE.LineBasicMaterial {
    let m = this.presenceMats.get(color);
    if (!m) { m = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 }); this.presenceMats.set(color, m); }
    m.clippingPlanes = this.sectionClip ? [this.sectionClip] : null;
    return m;
  }


  private outlineMat: THREE.LineBasicMaterial | null = null;

  private _outlineMaterial(): THREE.LineBasicMaterial {
    if (!this.outlineMat) this.outlineMat = new THREE.LineBasicMaterial({ color: 0x1f7ae0, depthTest: false, transparent: true, opacity: 0.95 });
    this.outlineMat.clippingPlanes = this.sectionClip ? [this.sectionClip] : null;
    return this.outlineMat;
  }

  setSection(section: SectionRequest | null): void {
    this.sectionReq = section;
    const axis = section && new THREE.Vector3(section.axis === "x" ? 1 : 0, section.axis === "y" ? 1 : 0, section.axis === "z" ? 1 : 0);
    this.sectionClip = section && axis ? sectionPlane(section, axis, section.coordinate === undefined ? this.core.contentBox() : null) : null;
    this.core.renderer.localClippingEnabled = !!this.sectionClip;
    for (const t of this.core.objectMap.values()) this.dressSection(t);
    if (this.outlineMat) this._outlineMaterial();
    for (const c of this.presenceMats.keys()) this._presenceMaterial(c);
    this.core.requestRender();
  }

  get section(): SectionRequest | null { return this.sectionReq; }

  setSectionColour(colour: number | string | null): void {
    this.sectionColour = colour === null ? null : new THREE.Color(colour).getHex();
    if (this.sectionReq) this.setSection(this.sectionReq);
  }


  /** Clip one object's materials with the live section (or unclip it) and give its
   *  surfaces their poché. */
  dressSection(t: THREE.Object3D): void {
    const plane = this.sectionClip;
    const old: THREE.Object3D[] = [];
    const surfaces: THREE.Mesh[] = [];
    t.traverse((c) => {
      if (c.userData.poche) { old.push(c); return; }
      const m = (c as THREE.Mesh).material;
      if (m) {
        for (const one of Array.isArray(m) ? m : [m]) {
          if ((one.clippingPlanes?.length ?? 0) === 0 && !plane) continue;
          one.clippingPlanes = plane ? [plane] : null;
          one.needsUpdate = true;
        }
      }
      if (plane && c.userData.surface && !seeThrough((c as THREE.Mesh).material)) surfaces.push(c as THREE.Mesh);
    });
    for (const o of old) o.removeFromParent();
    // Hidden line draws back faces in the edge colour already: the cut shows as poché. Ghost
    // and other see-through surfaces get none — their back faces show through them uncut.
    if (!plane || this.core.gScene.renderMode === "hiddenline" || this.core.gScene.renderMode === "ghost") return;
    const mat = this._poche(plane);
    for (const s of surfaces) {
      const p = new THREE.Mesh(s.geometry, mat);
      p.userData.poche = true;
      p.renderOrder = -1;
      p.raycast = () => {};                  // a pick goes to the surface, not the fill behind it
      s.parent!.add(p);
    }
  }


  private _poche(plane: THREE.Plane): THREE.MeshBasicMaterial {
    const mode = this.core.gScene.renderMode === "ghost" ? "ghost" : "shaded";
    const colour = this.sectionColour ?? sectionAppearance(mode).colour;
    const m = this.pocheMat;
    if (m && m.color.getHex() === colour && m.clippingPlanes?.[0] === plane) return m;
    m?.dispose();
    this.pocheMat = new THREE.MeshBasicMaterial({ color: colour, side: THREE.BackSide, clippingPlanes: [plane], toneMapped: false });
    return this.pocheMat;
  }


  /** Is this world point on the side the section removed? */
  cutAway(p: THREE.Vector3): boolean {
    return !!this.sectionClip && this.sectionClip.distanceToPoint(p) < -1e-9;
  }

  setCallouts(items: CalloutItem[], handlers: { onPick?: (id: string) => void; onHover?: (id: string | null) => void } = {}): void {
    this.calloutHandlers = handlers;
    if (!items.length && !this.callouts) return;
    this.callouts ??= new Callouts(this.core.container, {
      onPick: (id) => this.calloutHandlers.onPick?.(id),
      onHover: (id) => this.calloutHandlers.onHover?.(id),
    });
    this.callouts.setItems(items);
    this.calloutsDirty = true;
    this.core.requestRender();
  }


  /** Re-measure each callout's anchor: the centre of its objects' bounds. */
  private _measureCallouts(): void {
    this.calloutsDirty = false;
    this.calloutAnchors.clear();
    const box = new THREE.Box3();
    for (const id of this.callouts?.ids ?? []) {
      box.makeEmpty();
      for (const t of this.core.resolve(this.callouts!.objectsOf(id))) if (t.visible) box.expandByObject(t);
      if (!box.isEmpty()) this.calloutAnchors.set(id, box.getCenter(new THREE.Vector3()));
    }
    this.calloutCheckedAt = 0;
  }


  /** Which anchors the reader can see: one ray each, its own objects not counting as cover. */
  private _checkCalloutVisibility(): void {
    this.calloutVisible.clear();
    const cam = this.core.activeCamera;
    const meshes = [...this.core.objectMap.values()].filter(t => t.visible);
    const ray = new THREE.Raycaster();
    const eye = cam.getWorldPosition(new THREE.Vector3());
    for (const [id, anchor] of this.calloutAnchors) {
      const own = new Set(this.core.resolve(this.callouts!.objectsOf(id)));
      const dir = anchor.clone().sub(eye);
      const dist = dir.length();
      if ((cam as THREE.OrthographicCamera).isOrthographicCamera) {
        cam.getWorldDirection(dir);                       // parallel rays: along the view
        ray.set(anchor.clone().addScaledVector(dir, -1e4), dir);
        ray.far = 1e4;
      } else { ray.set(eye, dir.normalize()); ray.far = dist; }
      const hit = ray.intersectObjects(meshes, true).find(h => !this.cutAway(h.point));
      let owner: THREE.Object3D | null = hit?.object ?? null;
      while (owner && !own.has(owner)) owner = owner.parent;
      if (!hit || owner || hit.distance >= ray.far - 1e-3) this.calloutVisible.add(id);
    }
  }


  /** Project, cull and lay out this frame's labels. */
  drawCallouts(): void {
    if (!this.callouts) return;
    if (this.calloutsDirty) this._measureCallouts();
    const w = this.core.container.clientWidth || 1, h = this.core.container.clientHeight || 1;
    const now = performance.now();
    if (now - this.calloutCheckedAt > 180) {
      this._checkCalloutVisibility();
      this.calloutCheckedAt = now;
    } else if (!this.calloutRecheck) {
      // The camera may stop before the next check is due: look once more when it is.
      this.calloutRecheck = window.setTimeout(() => { this.calloutRecheck = 0; this.calloutCheckedAt = 0; this.core.requestRender(); }, 200);
    }
    const cam = this.core.activeCamera;
    cam.updateMatrixWorld();
    const v = new THREE.Vector3();
    const anchors: { id: string; x: number; y: number }[] = [];
    for (const [id, anchor] of this.calloutAnchors) {
      if (!this.calloutVisible.has(id)) continue;
      v.copy(anchor).project(cam);
      if (v.z > 1) continue;
      anchors.push({ id, x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h });
    }
    const labelWidth = labelWidthFor(w);
    this.callouts.setLabelWidth(labelWidth);
    const { placed, dropped } = layoutLabels(anchors, { width: w, height: h, labelWidth });
    this.callouts.update(placed, dropped.length);
  }

  dispose(): void {
    this.pocheMat?.dispose();
    this.outlineMat?.dispose();
    for (const o of this.outlined) o.line.geometry.dispose();
    for (const o of this.presenceLines) o.line.geometry.dispose();
    for (const m of this.presenceMats.values()) m.dispose();
    this.callouts?.dispose();
    clearTimeout(this.calloutRecheck);
  }
}
