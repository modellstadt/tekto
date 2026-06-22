// ====================================================================
// RIBBON SYSTEM — multi-ribbon collection with first-class joints
// ====================================================================
//
// Owns a list of ribbons + a list of `RibbonJoint`s. Joints are
// auto-detected from the current ribbon geometry on first need (or
// explicitly via `detectJoints()`), and can be inspected / edited
// before meshing.
//
// Joint kinds detected:
//   T — one ribbon's endpoint lies on another's interior.
//   L — exactly two ribbon endpoints meet at the same point.
//   Y — three ribbon endpoints meet at the same point.
//   X — four ribbon endpoints meet at the same point.
//   cluster — anything else.
//
// Trims for meshing come from `joint.computeTrims()` aggregated across
// all joints; each ribbon's start/end trim is the contribution from
// whichever joint owns that side (most ribbons have at most one joint
// per end).
//
// Ported originally from HDGEO; rebuilt around RibbonJoint.

import { Vec2 } from "../math/vectors";
import { Mesh } from "./mesh/Mesh";
import {
  ExtrudedRibbon, RibbonEndTrim,
  MeshBuffers, newBuffers, finishMesh,
} from "./ExtrudedRibbon";
import { RibbonJoint, JointKind, JointParticipant } from "./RibbonJoint";

export class RibbonSystem {
  readonly ribbons: ExtrudedRibbon[] = [];
  joints: RibbonJoint[] = [];
  touchEpsilon = 1e-3;
  private _jointsDetected = false;

  constructor(ribbons?: Iterable<ExtrudedRibbon>) {
    if (ribbons) for (const r of ribbons) this.ribbons.push(r);
  }

  add(ribbon: ExtrudedRibbon): void {
    this.ribbons.push(ribbon);
    this._jointsDetected = false; // force re-detection
  }

  // ── Joint detection ────────────────────────────────────────────────

  /**
   * Re-scan the ribbon geometry and rebuild the `joints` array. Called
   * implicitly by `buildMesh` / `computeTrims` when no detection has
   * happened yet. Call explicitly if you've mutated ribbon centerlines
   * after the initial detection.
   *
   * Existing joint *styles* are preserved when the same set of ribbons
   * meet at the same point — useful so a user-set `style: "butt"`
   * survives a geometry update.
   */
  detectJoints(): void {
    const eps = this.touchEpsilon;
    const oldStyles = new Map<string, RibbonJoint>();
    for (const j of this.joints) oldStyles.set(this.jointKey(j), j);

    const next: RibbonJoint[] = [];

    // Pass 1: T-junctions (endpoint-on-interior).
    for (let i = 0; i < this.ribbons.length; i++) {
      const stem = this.ribbons[i];
      if (stem.isClosedPolyline) continue;
      const stemEndpoints: ("start" | "end")[] = ["start", "end"];
      for (const which of stemEndpoints) {
        const ep = which === "start"
          ? stem.centerline[0]
          : stem.centerline[stem.centerline.length - 1];

        for (let j = 0; j < this.ribbons.length; j++) {
          if (j === i) continue;
          const through = this.ribbons[j];
          const segCount = through.centerline.length - 1;
          let acc = 0;
          let found = false;
          for (let s = 0; s < segCount && !found; s++) {
            const a = through.centerline[s];
            const b = through.centerline[s + 1];
            const ab = b.sub(a);
            const lenSq = ab.lenSq();
            if (lenSq < 1e-18) continue;
            const t = ep.sub(a).dot(ab) / lenSq;
            if (t > eps && t < 1 - eps) {
              const closest = a.add(ab.mul(t));
              if (closest.distTo(ep) < eps) {
                const arcOnThrough = acc + t * Math.sqrt(lenSq);
                const participants: JointParticipant[] = [
                  { ribbon: through, endIsAtJoint: null, arcLength: arcOnThrough },
                  { ribbon: stem,    endIsAtJoint: which, arcLength: which === "start" ? 0 : clLen(stem.centerline) },
                ];
                const joint = new RibbonJoint(participants, ep, "T");
                this.applyOldStyle(joint, oldStyles);
                next.push(joint);
                found = true;
              }
            }
            acc += Math.sqrt(lenSq);
          }
        }
      }
    }

    // Pass 2: endpoint clusters (L / Y / X / star).
    // Group all open-ribbon endpoints by spatial proximity.
    interface EndpointEntry { ribbon: ExtrudedRibbon; which: "start" | "end"; point: Vec2 }
    const endpoints: EndpointEntry[] = [];
    for (const r of this.ribbons) {
      if (r.isClosedPolyline) continue;
      endpoints.push({ ribbon: r, which: "start", point: r.centerline[0] });
      endpoints.push({ ribbon: r, which: "end",   point: r.centerline[r.centerline.length - 1] });
    }

    const used = new Set<number>();
    for (let i = 0; i < endpoints.length; i++) {
      if (used.has(i)) continue;
      const cluster: EndpointEntry[] = [endpoints[i]];
      for (let k = i + 1; k < endpoints.length; k++) {
        if (used.has(k)) continue;
        if (endpoints[k].point.distTo(endpoints[i].point) < eps) {
          cluster.push(endpoints[k]);
          used.add(k);
        }
      }
      if (cluster.length < 2) continue;
      used.add(i);

      // Avoid re-creating an endpoint cluster that's already a T-junction's
      // stem participation (the stem endpoint is at the cluster point too).
      // For now we accept overlap — the stem joint is the T (interior on
      // another ribbon), the cluster joint adds extra info if other ribbons
      // meet at the same point.

      const participants: JointParticipant[] = cluster.map(e => ({
        ribbon: e.ribbon,
        endIsAtJoint: e.which,
        arcLength: e.which === "start" ? 0 : clLen(e.ribbon.centerline),
      }));
      const kind: JointKind = cluster.length === 2 ? "L"
                            : cluster.length === 3 ? "Y"
                            : cluster.length === 4 ? "X"
                            : "cluster";
      const joint = new RibbonJoint(participants, cluster[0].point, kind);
      this.applyOldStyle(joint, oldStyles);
      next.push(joint);
    }

    this.joints = next;
    this._jointsDetected = true;
  }

  private applyOldStyle(joint: RibbonJoint, old: Map<string, RibbonJoint>): void {
    const prior = old.get(this.jointKey(joint));
    if (prior) {
      joint.style = prior.style;
      joint.throughRibbon = prior.throughRibbon;
    }
  }

  private jointKey(j: RibbonJoint): string {
    // Stable identity = sorted list of ribbon indices in this system.
    const idxs = j.participants
      .map(p => this.ribbons.indexOf(p.ribbon))
      .filter(i => i >= 0)
      .sort((a, b) => a - b);
    return `${j.kind}:${idxs.join(",")}`;
  }

  // ── Trim aggregation ───────────────────────────────────────────────

  /** Aggregate per-ribbon trims from every joint. Returns `{start, end}` per ribbon. */
  computeTrims(): { start: RibbonEndTrim | null; end: RibbonEndTrim | null }[] {
    if (!this._jointsDetected) this.detectJoints();

    const trims: { start: RibbonEndTrim | null; end: RibbonEndTrim | null }[]
      = this.ribbons.map(() => ({ start: null, end: null }));

    for (const j of this.joints) {
      const byRibbon = j.computeTrims();
      for (const [ribbon, t] of byRibbon) {
        const i = this.ribbons.indexOf(ribbon);
        if (i < 0) continue;
        if (t.start !== undefined) trims[i].start = t.start;
        if (t.end   !== undefined) trims[i].end   = t.end;
      }
    }

    return trims;
  }

  /**
   * Backward-compat: return T-junctions where another ribbon's endpoint
   * lands on this ribbon's interior. Drawn from the populated `joints`
   * array — does not re-scan geometry independently.
   */
  findTJunctionsOnRibbon(ribbon: ExtrudedRibbon): { arcLength: number; otherRibbon: ExtrudedRibbon }[] {
    if (!this._jointsDetected) this.detectJoints();
    const result: { arcLength: number; otherRibbon: ExtrudedRibbon }[] = [];
    for (const j of this.joints) {
      if (j.kind !== "T") continue;
      const throughP = j.participants.find(p => p.endIsAtJoint === null);
      const stemP    = j.participants.find(p => p.endIsAtJoint !== null);
      if (!throughP || !stemP) continue;
      if (throughP.ribbon !== ribbon) continue;
      result.push({ arcLength: throughP.arcLength, otherRibbon: stemP.ribbon });
    }
    return result;
  }

  // ── Meshing ────────────────────────────────────────────────────────

  buildMesh(): Mesh {
    const buf = newBuffers();
    this.buildInto(buf);
    return finishMesh(buf);
  }

  buildInto(buf: MeshBuffers): void {
    const trims = this.computeTrims();
    for (let i = 0; i < this.ribbons.length; i++) {
      this.ribbons[i].buildInto(buf, trims[i].start, trims[i].end);
    }
  }
}

function clLen(cl: Vec2[]): number {
  let total = 0;
  for (let i = 0; i < cl.length - 1; i++) total += cl[i].distTo(cl[i + 1]);
  return total;
}
