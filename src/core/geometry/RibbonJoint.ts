// ====================================================================
// RIBBON JOINT — geometric junction between 2+ ribbons
// ====================================================================
//
// First-class geometric object representing a point where ribbons meet.
// Encapsulates the trim policy (mitered vs butt) so the trim math lives
// in ONE place instead of being scattered across RibbonSystem and
// downstream constructions.
//
// Two layers:
//   • RibbonJoint  (this file)    — pure geometry, no domain concepts.
//   • WallJoint   (src/bim/walls) — wraps a RibbonJoint, adds
//                                    connection-type, fasteners, Psets.
//
// JointStyle:
//   "mitered" — all participants are trimmed to the angular bisector
//               (classic L/Y/X corner).
//   "butt"    — one participant is the through-ribbon (no trim); the
//               others are trimmed perpendicular to it at its inside face.
//               Models prefab panel construction (Holzrahmenbau /
//               Holztafelbau / steel-stud panels), masonry block returns,
//               etc.

import { Vec2 } from "../math/vectors";
import { ExtrudedRibbon, RibbonEndTrim, safeNormalize } from "./ExtrudedRibbon";

export type JointStyle = "mitered" | "butt";

/**
 * Kind of joint, derived from how many ribbons touch and how.
 *   "L"       — exactly 2 ribbons, both endpoints meet at the joint.
 *   "T"       — one ribbon's endpoint lies on another's interior (no others).
 *   "X"/"Y"   — 3+ endpoints meeting at one point (X = 4, Y = 3, etc.).
 *   "cluster" — anything else (mixed interior + endpoint participation).
 */
export type JointKind = "L" | "T" | "X" | "Y" | "cluster";

/** A single ribbon's participation in a joint. */
export interface JointParticipant {
  ribbon: ExtrudedRibbon;
  /**
   * Which end of this ribbon is at the joint:
   *   "start" — centerline[0] is at the joint point.
   *   "end"   — centerline[last] is at the joint point.
   *   null    — the joint lies on this ribbon's INTERIOR (T-junction through-ribbon).
   */
  endIsAtJoint: "start" | "end" | null;
  /** Arc-length along this ribbon's centerline at the joint point. */
  arcLength: number;
}

/**
 * Trim contributions from a joint, per (ribbon, end). Either start, end, or
 * neither may be present. A missing entry means "no trim from THIS joint"
 * (the ribbon's existing trim from a different joint, or its natural end
 * cap, applies).
 */
export type JointTrim = { start?: RibbonEndTrim | null; end?: RibbonEndTrim | null };

// ─── RibbonJoint ─────────────────────────────────────────────────────

export class RibbonJoint {
  readonly participants: JointParticipant[];
  readonly point: Vec2;
  readonly kind: JointKind;
  style: JointStyle = "mitered";
  /** For "butt" style: which ribbon passes through. Default: the longest. */
  throughRibbon?: ExtrudedRibbon;

  constructor(participants: JointParticipant[], point: Vec2, kind: JointKind) {
    this.participants = participants;
    this.point = point;
    this.kind = kind;
    // Default through-ribbon for butt joints: the participant with the longest
    // centerline. For T-junctions, the through-ribbon is the participant whose
    // joint lies on its interior — that's the structurally honest choice
    // regardless of length.
    const interiorP = participants.find(p => p.endIsAtJoint === null);
    if (interiorP) {
      this.throughRibbon = interiorP.ribbon;
    } else {
      this.throughRibbon = participants
        .map(p => p.ribbon)
        .reduce((a, b) => clLen(a.centerline) > clLen(b.centerline) ? a : b);
    }
  }

  /** Compute per-ribbon trim contributions from this joint. */
  computeTrims(): Map<ExtrudedRibbon, JointTrim> {
    const out = new Map<ExtrudedRibbon, JointTrim>();
    if (this.style === "butt") this.computeButtTrims(out);
    else                       this.computeMiteredTrims(out);
    return out;
  }

  // ── Style: mitered ──────────────────────────────────────────────

  private computeMiteredTrims(out: Map<ExtrudedRibbon, JointTrim>): void {
    if (this.kind === "T") {
      const throughP = this.participants.find(p => p.endIsAtJoint === null);
      const stemP    = this.participants.find(p => p.endIsAtJoint !== null);
      if (!throughP || !stemP) return;

      // Through ribbon: no trim — its envelope passes uninterrupted.
      out.set(throughP.ribbon, {});

      // Stem: trim perpendicular to through, at through's near face.
      const segDir = segmentTangent(throughP.ribbon.centerline, throughP.arcLength);
      const perp = new Vec2(-segDir.y, segDir.x);
      const halfW = throughP.ribbon.width * 0.5;
      const stemInteriorRef = interiorReference(stemP);
      const toStem = stemInteriorRef.sub(this.point);
      const side = perp.x * toStem.x + perp.y * toStem.y;
      const nearFacePoint = side >= 0
        ? this.point.add(perp.mul(halfW))
        : this.point.sub(perp.mul(halfW));
      const trim = RibbonEndTrim.bothSides(nearFacePoint, segDir);
      setEndTrim(out, stemP, trim);
      return;
    }

    // L / Y / X: classic angular-bisector trim for every participant.
    const dirs = this.participants
      .filter(p => p.endIsAtJoint !== null)
      .map(p => ({ p, dir: dirAwayFromJoint(p) }))
      .map(e => ({ ...e, angle: Math.atan2(e.dir.y, e.dir.x) }))
      .sort((a, b) => a.angle - b.angle);

    if (dirs.length < 2) return;

    for (let i = 0; i < dirs.length; i++) {
      const cur = dirs[i];
      const cw  = dirs[(i - 1 + dirs.length) % dirs.length].dir;
      const ccw = dirs[(i + 1) % dirs.length].dir;
      const cwBisector  = safeNormalize(cur.dir.add(cw));
      const ccwBisector = safeNormalize(cur.dir.add(ccw));
      const crossCW  = cur.dir.x * cw.y  - cur.dir.y * cw.x;
      const crossCCW = cur.dir.x * ccw.y - cur.dir.y * ccw.x;
      if (Math.abs(crossCW) < 1e-6 && Math.abs(crossCCW) < 1e-6) continue;
      setEndTrim(out, cur.p, new RibbonEndTrim(this.point, ccwBisector, this.point, cwBisector));
    }
  }

  // ── Style: butt ────────────────────────────────────────────────

  private computeButtTrims(out: Map<ExtrudedRibbon, JointTrim>): void {
    const through = this.throughRibbon;
    if (!through) { this.computeMiteredTrims(out); return; }

    const throughP = this.participants.find(p => p.ribbon === through);
    if (!throughP) { this.computeMiteredTrims(out); return; }

    // Through-wall tangent at the joint, pointing AWAY from the joint.
    const throughDirAway = throughP.endIsAtJoint === null
      ? segmentTangent(through.centerline, throughP.arcLength)
      : dirAwayFromJoint(throughP);
    const perp = new Vec2(-throughDirAway.y, throughDirAway.x);
    const halfW_through = through.width * 0.5;

    // ── Through wall ──────────────────────────────────────────────────
    // L-junction: extend the through wall's plate past its centerline
    // endpoint by max(halfWidth) of the butting walls so the plate wraps
    // the corner (real Holzrahmenbau panel detail). Trim line is
    // perpendicular to the through direction. End cap is drawn so the
    // wrapped end face closes.
    if (throughP.endIsAtJoint === null) {
      // T-junction: through wall is uninterrupted.
      out.set(through, {});
    } else {
      const buttings = this.participants.filter(p => p.ribbon !== through);
      const maxButtHalfW = buttings.reduce((m, p) => Math.max(m, p.ribbon.width * 0.5), 0);
      const extensionDir = throughDirAway.mul(-1);
      const extendedPoint = this.point.add(extensionDir.mul(maxButtHalfW));
      const trim = RibbonEndTrim.bothSides(extendedPoint, perp);
      trim.drawCap = true;
      const t: JointTrim = {};
      if (throughP.endIsAtJoint === "start") t.start = trim;
      else                                    t.end   = trim;
      out.set(through, t);
    }

    // ── Butting walls ─────────────────────────────────────────────────
    // Each butter: trim perpendicular to through at through's near face,
    // and request an explicit cap face at the trimmed end (so the plates
    // close cleanly against the through wall).
    for (const p of this.participants) {
      if (p.ribbon === through) continue;
      const interiorRef = interiorReference(p);
      const toInside = interiorRef.sub(this.point);
      const side = perp.x * toInside.x + perp.y * toInside.y;
      const nearFacePoint = side >= 0
        ? this.point.add(perp.mul(halfW_through))
        : this.point.sub(perp.mul(halfW_through));
      const trim = RibbonEndTrim.bothSides(nearFacePoint, throughDirAway);
      trim.drawCap = true;
      setEndTrim(out, p, trim);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function clLen(cl: Vec2[]): number {
  let total = 0;
  for (let i = 0; i < cl.length - 1; i++) total += cl[i].distTo(cl[i + 1]);
  return total;
}

function segmentTangent(cl: Vec2[], m: number): Vec2 {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const d = cl[i + 1].sub(cl[i]);
      const len = d.len();
      return len > 1e-9 ? d.div(len) : new Vec2(1, 0);
    }
    acc += segLen;
  }
  const d = cl[cl.length - 1].sub(cl[cl.length - 2]);
  const len = d.len();
  return len > 1e-9 ? d.div(len) : new Vec2(1, 0);
}

function dirAwayFromJoint(p: JointParticipant): Vec2 {
  const cl = p.ribbon.centerline;
  if (p.endIsAtJoint === "start") return safeNormalize(cl[1].sub(cl[0]));
  if (p.endIsAtJoint === "end")   return safeNormalize(cl[cl.length - 2].sub(cl[cl.length - 1]));
  return new Vec2(1, 0);
}

function interiorReference(p: JointParticipant): Vec2 {
  const cl = p.ribbon.centerline;
  if (p.endIsAtJoint === "start") return cl[1];
  if (p.endIsAtJoint === "end")   return cl[cl.length - 2];
  return cl[0];
}

function setEndTrim(out: Map<ExtrudedRibbon, JointTrim>, p: JointParticipant, trim: RibbonEndTrim): void {
  const cur = out.get(p.ribbon) ?? {};
  if (p.endIsAtJoint === "start") cur.start = trim;
  else if (p.endIsAtJoint === "end") cur.end = trim;
  out.set(p.ribbon, cur);
}
