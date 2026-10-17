/**
 * What a ThreeRenderer marks on the model: the selection (tinted, or outlined on top), a
 * section cut with its poché, and callouts in the margins with leaders to what they name.
 */
import * as THREE from "three";
import type { SectionRequest } from "../scene/Scene";
import { sectionPlane, sectionAppearance, calloutSamples, occludes, shown, rayTargets, cameraKey } from "./viewRules";
import { Callouts, layoutLabels, labelWidthFor, marginCapacity, type CalloutItem } from "./Callouts";
import type { RendererCore } from "./RendererCore";

/** How long the camera must be still before callout visibility is redone (ms). */
const CALLOUT_SETTLE_MS = 120;
/** Time per frame spent on callout visibility while it is being redone (ms). */
const CALLOUT_BUDGET_MS = 6;

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
  /** Per callout, where to look for it: its centre, then points toward its box's corners. */
  private calloutAnchors = new Map<string, THREE.Vector3[]>();
  /** Per callout seen, the point its leader goes to. Redone only once the camera is still. */
  private calloutVisible = new Map<string, THREE.Vector3>();
  /** Something that decides visibility changed since the last answer. */
  private calloutCheckDirty = true;
  /** The camera the answer is for, and since when it has been still. */
  private calloutCamera = "";
  private calloutStillSince = 0;
  /** A check in progress, a slice per frame: what is left, and how many labels each margin
   *  has found so far against what it holds. */
  private calloutPending: {
    queue: string[]; skipped: string[]; left: number; right: number; capacity: number;
    /** what the rays test, gathered once per check rather than per slice */
    targets: THREE.Mesh[];
  } | null = null;
  /** Callouts the last check never looked at, because the margins were full. */
  private calloutUnchecked = 0;
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

  /** Keep outlines on their objects (a gizmo drag moves them without a rebuild), and hidden
   *  with them: a hidden object shows no outline. */
  followOutlines(): void {
    for (const o of [...this.outlined, ...this.presenceLines]) {
      o.line.matrix.copy(o.source.matrixWorld);
      o.line.visible = shown(o.source);
    }
  }

  setSelectionStyle(style: "tint" | "outline"): void {
    this.selectionStyle = style;
    this.setSelectionHighlight(this.highlightIds);
  }

  private highlightIds: readonly string[] | null = null;

  /** The selection as highlighted (scene ids), empty when none. */
  get highlighted(): readonly string[] { return this.highlightIds ?? []; }

  private calloutsShown = true;

  /** Show or hide the callout labels (they keep working while hidden). */
  setCalloutsVisible(on: boolean): void {
    this.calloutsShown = on;
    this.callouts?.setVisible(on);
  }

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
    this.calloutCheckDirty = true;                 // what the cut removed hides no label
    for (const t of this.core.objectMap.values()) this.dressSection(t);
    if (this.outlineMat) this._outlineMaterial();
    for (const c of this.presenceMats.keys()) this._presenceMaterial(c);
    this.core.requestRender();
  }

  get section(): SectionRequest | null { return this.sectionReq; }

  /** Where the cut lies along its axis: its coordinate, or its `at` share of the content. */
  sectionCoordinate(): number | null {
    const req = this.sectionReq;
    if (!req) return null;
    if (req.coordinate !== undefined) return req.coordinate;
    const box = this.core.contentBox();
    return box.isEmpty() ? 0 : THREE.MathUtils.lerp(box.min[req.axis], box.max[req.axis], req.at ?? 0.5);
  }

  private sectionFrame: THREE.LineLoop | null = null;

  /** Show the cut as a thin frame around the content, while it is being moved. */
  showSectionPlane(on: boolean): void {
    if (this.sectionFrame) {
      this.sectionFrame.removeFromParent();
      this.sectionFrame.geometry.dispose();
      (this.sectionFrame.material as THREE.Material).dispose();
      this.sectionFrame = null;
    }
    const req = this.sectionReq, c = this.sectionCoordinate(), box = this.core.contentBox();
    if (on && req && c !== null && !box.isEmpty()) {
      const pad = box.getSize(new THREE.Vector3()).multiplyScalar(0.06);
      const lo = box.min.clone().sub(pad), hi = box.max.clone().add(pad);
      const [u, v] = req.axis === "x" ? ["y", "z"] as const : req.axis === "y" ? ["x", "z"] as const : ["x", "y"] as const;
      const corner = (a: number, b: number) => { const p = new THREE.Vector3(); p[req.axis] = c; p[u] = a; p[v] = b; return p; };
      const geo = new THREE.BufferGeometry().setFromPoints([corner(lo[u], lo[v]), corner(hi[u], lo[v]), corner(hi[u], hi[v]), corner(lo[u], hi[v])]);
      this.sectionFrame = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthTest: false }));
      this.sectionFrame.renderOrder = 1000;
      this.core.threeScene.add(this.sectionFrame);
    }
    this.core.requestRender();
  }

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
          one.clipShadows = !!plane;               // what the cut removed casts no shadow either
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
    // The same slope term as the surfaces' polygon offset (factor 1), without their unit (0):
    // the poché still beats a surface's own back faces by that unit, while a thin part's top
    // face is no longer pushed behind its own underside's poché at a glancing view (a 27 mm
    // board under a plan cut turned the poché colour).
    this.pocheMat = new THREE.MeshBasicMaterial({
      color: colour, side: THREE.BackSide, clippingPlanes: [plane], toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 0,
    });
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
    this.callouts.setVisible(this.calloutsShown);
    this.callouts.setItems(items);
    // Keep the last answer for what is still there, so a relabel doesn't blank the margins
    // while the new one is worked out.
    const ids = new Set(items.map((i) => i.id));
    for (const id of [...this.calloutVisible.keys()]) if (!ids.has(id)) this.calloutVisible.delete(id);
    this.calloutPending = null;
    this.calloutsDirty = true;
    this.core.requestRender();
  }


  /** Re-measure where to look for each callout: points in its objects' bounds. */
  private _measureCallouts(): void {
    this.calloutsDirty = false;
    this.calloutAnchors.clear();
    const box = new THREE.Box3();
    for (const id of this.callouts?.ids ?? []) {
      box.makeEmpty();
      for (const t of this.core.resolve(this.callouts!.objectsOf(id))) if (t.visible) box.expandByObject(t);
      if (!box.isEmpty()) this.calloutAnchors.set(id, calloutSamples(box));
    }
    this.calloutPending = null;
    this.calloutCheckDirty = true;
  }


  /**
   * Work on which callouts the reader can see, until `deadline`. Seen means any of its
   * sample points is: the centre first, the others only if it is hidden, and the leader goes
   * to the first one seen. Only a surface that writes depth hides it (`occludes`), its own
   * objects don't count, nor does what the section removed. A margin that is full takes no
   * more, so its side needs no rays, and the check ends when both are.
   */
  private _checkCalloutVisibility(deadline: number): void {
    const pending = this.calloutPending;
    if (!pending) return;
    const cam = this.core.activeCamera;
    const ray = new THREE.Raycaster();
    const eye = cam.getWorldPosition(new THREE.Vector3());
    const view = cam.getWorldDirection(new THREE.Vector3());
    const ortho = (cam as THREE.OrthographicCamera).isOrthographicCamera;
    const ndc = new THREE.Vector3(), dir = new THREE.Vector3();
    const full = () => pending.left >= pending.capacity && pending.right >= pending.capacity;
    while (pending.queue.length && !full() && performance.now() < deadline) {
      const id = pending.queue.pop()!;
      const samples = this.calloutAnchors.get(id);
      if (!samples) continue;
      const side = ndc.copy(samples[0]).project(cam).x < 0 ? "left" : "right";
      if (pending[side] >= pending.capacity) { pending.skipped.push(id); continue; }
      const own = new Set(this.core.resolve(this.callouts!.objectsOf(id)));
      let seen: THREE.Vector3 | null = null;
      for (const point of samples) {
        ndc.copy(point).project(cam);
        if (ndc.z > 1 || Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) continue;   // off screen: no ray
        if (ortho) {
          ray.set(point.clone().addScaledVector(view, -1e4), view);              // parallel rays: along the view
          ray.far = 1e4;
        } else {
          dir.copy(point).sub(eye);
          ray.far = dir.length();
          ray.set(eye, dir.normalize());
        }
        // Surfaces only: three.js picks lines within a whole unit of the ray.
        const hit = ray.intersectObjects(pending.targets, false)
          .find(h => (h.object as THREE.Mesh).isMesh && occludes((h.object as THREE.Mesh).material) && !this.cutAway(h.point));
        let owner: THREE.Object3D | null = hit?.object ?? null;
        while (owner && !own.has(owner)) owner = owner.parent;
        if (!hit || owner || hit.distance >= ray.far - 1e-3) { seen = point; break; }
      }
      // In place, so labels appear as they are found and a recheck never blanks the margins.
      if (seen) { this.calloutVisible.set(id, seen); pending[side]++; } else this.calloutVisible.delete(id);
    }
    if (!pending.queue.length || full()) {
      // What was never looked at shows no label, and is counted as "up to".
      const unchecked = [...pending.queue, ...pending.skipped];
      for (const id of unchecked) this.calloutVisible.delete(id);
      this.calloutUnchecked = unchecked.length;
      this.calloutPending = null;
    }
  }


  /** Project, cull and lay out this frame's labels. */
  drawCallouts(): void {
    if (!this.callouts) return;
    if (this.calloutsDirty) this._measureCallouts();
    const w = this.core.container.clientWidth || 1, h = this.core.container.clientHeight || 1;
    const now = performance.now();
    const cam = this.core.activeCamera;
    cam.updateMatrixWorld();
    // Visibility costs rays, up to nine per callout against every mesh: more than a frame can
    // afford on a model of a few hundred elements. So it is never worked out while the camera
    // moves (the labels keep the last answer and follow their anchors), and is redone once the
    // camera has been still a moment, a slice per frame.
    // Rounded: the controls recompute the camera each frame, with noise in the last digits.
    const at = `${cameraKey(cam.matrixWorld.elements, cam.projectionMatrix.elements)}|${w}|${h}`;
    if (at !== this.calloutCamera) {
      this.calloutCamera = at;
      this.calloutStillSince = now;
      this.calloutPending = null;
      this.calloutCheckDirty = true;
    }
    if (this.calloutCheckDirty && !this.calloutPending) {
      if (now - this.calloutStillSince >= CALLOUT_SETTLE_MS) {
        this.calloutPending = {
          queue: [...this.calloutAnchors.keys()].reverse(), skipped: [], left: 0, right: 0,
          capacity: marginCapacity(h), targets: rayTargets(this.core.objectMap.values()),
        };
        this.calloutCheckDirty = false;                  // cleared as it starts: a change while it runs asks for another
      } else if (!this.calloutRecheck) {
        // Frames are drawn on demand: ask for one when the camera will have settled.
        this.calloutRecheck = window.setTimeout(() => { this.calloutRecheck = 0; this.core.requestRender(); },
          CALLOUT_SETTLE_MS - (now - this.calloutStillSince) + 5);
      }
    }
    if (this.calloutPending) {
      this._checkCalloutVisibility(now + CALLOUT_BUDGET_MS);
      if (this.calloutPending) this.core.requestRender();          // the next slice
    }
    const v = new THREE.Vector3();
    const anchors: { id: string; x: number; y: number }[] = [];
    // In the caller's order, which is priority.
    for (const id of this.calloutAnchors.keys()) {
      const anchor = this.calloutVisible.get(id);
      if (!anchor) continue;
      v.copy(anchor).project(cam);
      if (v.z > 1) continue;
      anchors.push({ id, x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h });
    }
    const labelWidth = labelWidthFor(w);
    this.callouts.setLabelWidth(labelWidth);
    const { placed, dropped } = layoutLabels(anchors, { width: w, height: h, labelWidth });
    this.callouts.update(placed, dropped.length + this.calloutUnchecked, this.calloutUnchecked > 0);
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
