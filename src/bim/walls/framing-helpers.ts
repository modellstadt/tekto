// ====================================================================
// BIM / Walls / Framing helpers — shared building blocks
// ====================================================================
//
// Low-level geometry helpers used by every stick-framed wall
// construction (BalloonFrame, HolzrahmenBau, and future Holztafelbau /
// steel-stud variants). Pure functions; no policy.
//
// Convention (looking at the wall in plan from above, axis L→R):
//   • `profile.w` runs along the wall direction  (the dimension visible
//                                                  between sheathings)
//   • `profile.h` runs across the wall  (the cavity depth)
// See `types.ts → PartProfile` for the canonical definition.

import { Vec2 } from "../../core/math/vectors";
import {
  ExtrudedRibbon, RibbonEndTrim, newBuffers, finishMesh, intersectLines, safeNormalize,
} from "../../core/geometry/ExtrudedRibbon";
import type { Wall } from "../../core/geometry/walls";
import type { PartProfile, WallPart, WallPartRole, WallTJunction } from "./types";

// ─── Geometry primitives ─────────────────────────────────────────────

/**
 * Horizontal plate-class member (sill plate, top plate, rough sill).
 * Lies flat: `verticalH` is the vertical face (the thin 38 mm dimension
 * for a 2×4), `acrossWallW` is the breadth across the wall (the 89 mm
 * dimension). Runs along the supplied centerline.
 *
 * Optional `startTrim`/`endTrim` (junction-aware): when supplied, the
 * plate's offset edges are trimmed to the junction face — produces an
 * angled end cap that aligns with neighbouring walls.
 */
export function makePlate(
  name: string, role: WallPartRole, centerline: Vec2[],
  z: number, verticalH: number, acrossWallW: number,
  material: string, profile: PartProfile,
  startTrim: RibbonEndTrim | null = null,
  endTrim:   RibbonEndTrim | null = null,
): WallPart {
  const ribbon = new ExtrudedRibbon({
    centerline, width: acrossWallW, height: verticalH, baseZ: z,
  });
  let mesh;
  if (startTrim || endTrim) {
    const buf = newBuffers();
    ribbon.buildInto(buf, startTrim, endTrim);
    mesh = finishMesh(buf);
  } else {
    mesh = ribbon.toMesh();
  }
  return {
    name, role, mesh,
    material, profile,
    length: polylineLength(centerline),
    ifcType: "IfcMember",
  };
}

/**
 * Vertical stud-class member (regular stud, king, jack, cripple).
 * Oriented conventionally: wide face (`profile.h`) perpendicular to the
 * wall (cavity depth); narrow face (`profile.w`) along the wall.
 */
export function makeStud(
  name: string, role: WallPartRole,
  position: Vec2, tangent: Vec2,
  baseZ: number, height: number,
  profile: PartProfile, material: string,
): WallPart {
  const depthH = profile.h;  // across the wall
  const widthW = profile.w;  // along the wall direction
  const perp = new Vec2(-tangent.y, tangent.x); // left-perpendicular to wall
  const studStart = position.sub(perp.mul(depthH * 0.5));
  const studEnd   = position.add(perp.mul(depthH * 0.5));
  const ribbon = new ExtrudedRibbon({
    centerline: [studStart, studEnd],
    width: widthW,
    height, baseZ,
  });
  return {
    name, role,
    mesh: ribbon.toMesh(),
    material, profile,
    length: height,
    ifcType: "IfcMember",
  };
}

/**
 * Horizontal beam (header, ring beam, ledger). Runs along a sub-piece of
 * the wall centerline. Same shape as a plate but with caller-controlled
 * depth (vertical) — used for headers that are deeper than a plate.
 */
export function makeBeam(
  name: string, role: WallPartRole, centerline: Vec2[],
  z: number, verticalDepth: number, acrossWallW: number,
  material: string, profile: PartProfile,
): WallPart {
  const ribbon = new ExtrudedRibbon({
    centerline, width: acrossWallW, height: verticalDepth, baseZ: z,
  });
  return {
    name, role,
    mesh: ribbon.toMesh(),
    material, profile,
    length: polylineLength(centerline),
    ifcType: "IfcMember",
  };
}

// ─── Centerline helpers ──────────────────────────────────────────────

/** Total polyline arc length. */
export function polylineLength(cl: Vec2[]): number {
  let total = 0;
  for (let i = 0; i < cl.length - 1; i++) total += cl[i].distTo(cl[i + 1]);
  return total;
}

/** Point at arc-length `m` along a polyline. */
export function pointAt(cl: Vec2[], m: number): Vec2 {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    if (m <= acc + segLen) {
      const t = segLen > 1e-9 ? (m - acc) / segLen : 0;
      return cl[i].add(cl[i + 1].sub(cl[i]).mul(t));
    }
    acc += segLen;
  }
  return cl[cl.length - 1];
}

/** Unit tangent at arc-length `m` along a polyline. */
export function tangentAt(cl: Vec2[], m: number): Vec2 {
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

/**
 * Slice a polyline between two arc-length parameters. Includes any
 * interior vertices that fall between them.
 */
export function subCenterline(cl: Vec2[], uStart: number, uEnd: number): Vec2[] {
  if (uEnd <= uStart) return [];
  const result: Vec2[] = [];
  let acc = 0;
  let started = false;
  for (let i = 0; i < cl.length - 1; i++) {
    const segLen = cl[i].distTo(cl[i + 1]);
    const segStart = acc;
    const segEnd   = acc + segLen;

    if (uEnd <= segStart) break;
    if (uStart >= segEnd) { acc += segLen; continue; }

    if (!started) {
      const t = segLen > 1e-9 ? (Math.max(uStart, segStart) - segStart) / segLen : 0;
      result.push(cl[i].add(cl[i + 1].sub(cl[i]).mul(t)));
      started = true;
    }

    if (uEnd <= segEnd) {
      const t = segLen > 1e-9 ? (uEnd - segStart) / segLen : 0;
      result.push(cl[i].add(cl[i + 1].sub(cl[i]).mul(t)));
      return result;
    } else {
      result.push(cl[i + 1]);
    }

    acc += segLen;
  }
  return result;
}

// ─── Junction-aware arc-length helpers ───────────────────────────────

/**
 * The arc-length along `centerline` at which the *start* trim line
 * crosses the wall's centerline direction. Clamped to `[0, total]` —
 * used to define the range for regular stud sweep (which never goes
 * past the centerline). For end-post placement that needs to honour
 * envelope extension, use `envelopeStartArc`.
 */
export function effectiveStartArc(centerline: Vec2[], startTrim: RibbonEndTrim | null): number {
  if (!startTrim || centerline.length < 2) return 0;
  const dir = safeNormalize(centerline[1].sub(centerline[0]));
  const hit = intersectLines(centerline[0], dir, startTrim.leftTrimPoint, startTrim.leftTrimDir);
  if (!hit) return 0;
  const d = hit.sub(centerline[0]).dot(dir);
  return Math.max(0, d);
}

/**
 * The arc-length along `centerline` at which the *end* trim line
 * crosses the wall's centerline. Clamped to `[0, total]`.
 */
export function effectiveEndArc(centerline: Vec2[], endTrim: RibbonEndTrim | null): number {
  const total = polylineLength(centerline);
  if (!endTrim || centerline.length < 2) return total;
  const n = centerline.length;
  const dir = safeNormalize(centerline[n - 1].sub(centerline[n - 2]));
  const hit = intersectLines(centerline[n - 1], dir, endTrim.leftTrimPoint, endTrim.leftTrimDir);
  if (!hit) return total;
  const d = hit.sub(centerline[n - 1]).dot(dir);
  return Math.min(total, total + d);
}

/**
 * Arc-length at which the *envelope* (the trimmed/extended plate) starts.
 * UNCLAMPED — negative values mean the envelope extends past `cl[0]`
 * (through-wall extension); positive values mean the envelope starts
 * inside the centerline (butt-wall shortening).
 *
 * Used to position end posts so their outer face is flush with the
 * plate's outer face.
 */
export function envelopeStartArc(centerline: Vec2[], startTrim: RibbonEndTrim | null): number {
  if (!startTrim || centerline.length < 2) return 0;
  const dir = safeNormalize(centerline[1].sub(centerline[0]));
  const hit = intersectLines(centerline[0], dir, startTrim.leftTrimPoint, startTrim.leftTrimDir);
  if (!hit) return 0;
  return hit.sub(centerline[0]).dot(dir);
}

/**
 * Arc-length at which the *envelope* ends. UNCLAMPED — values past
 * `total` indicate envelope extension (through-wall); values below
 * `total` indicate shortening (butt-wall).
 */
export function envelopeEndArc(centerline: Vec2[], endTrim: RibbonEndTrim | null): number {
  const total = polylineLength(centerline);
  if (!endTrim || centerline.length < 2) return total;
  const n = centerline.length;
  const dir = safeNormalize(centerline[n - 1].sub(centerline[n - 2]));
  const hit = intersectLines(centerline[n - 1], dir, endTrim.leftTrimPoint, endTrim.leftTrimDir);
  if (!hit) return total;
  return total + hit.sub(centerline[n - 1]).dot(dir);
}

/**
 * Point along the polyline at arc-length `m`, EXTRAPOLATED beyond the
 * endpoints when `m < 0` or `m > total`. Used to position end posts at
 * extended envelope ends.
 */
export function pointAtExtrapolating(cl: Vec2[], m: number): Vec2 {
  if (cl.length < 2) return cl[0] ?? new Vec2(0, 0);
  const total = polylineLength(cl);
  if (m < 0) {
    const dir = safeNormalize(cl[1].sub(cl[0]));
    return cl[0].add(dir.mul(m));
  }
  if (m > total) {
    const n = cl.length;
    const dir = safeNormalize(cl[n - 1].sub(cl[n - 2]));
    return cl[n - 1].add(dir.mul(m - total));
  }
  return pointAt(cl, m);
}

// ─── End studs + corner posts (mandatory studs) ─────────────────────

/**
 * Place the *mandatory* studs that close a wall: end studs at each open
 * terminus and corner posts at every interior polyline vertex.
 *
 * End-stud placement honours the envelope (trim-extended or trim-shortened):
 * the post is positioned so its OUTER face is flush with the plate's outer
 * face. Concretely: post center = `envelope_end ∓ profile.w/2` so it sits
 * INSIDE the plate cap, never cantilevered past it.
 *
 * For a closed polyline (a room shell), there are no termini — every
 * unique vertex becomes a corner post.
 *
 * Returns the arc-length positions of the placed studs so the regular
 * sweep can skip nearby positions.
 */
export function addEndAndCornerStuds(
  parts: WallPart[], wall: Wall,
  startTrim: RibbonEndTrim | null, endTrim: RibbonEndTrim | null,
  studProfile: PartProfile, material: string,
  studZ0: number, studH: number,
): number[] {
  const cl = wall.centerline;
  const isClosed = wall.isClosedPolyline;
  const n = cl.length;
  const positions: number[] = [];

  if (!isClosed) {
    const envStart = envelopeStartArc(cl, startTrim);
    const envEnd   = envelopeEndArc(cl, endTrim);
    // Push posts inward by half the stud's along-wall width so the outer
    // face of the post is flush with the plate's outer face.
    const startPostArc = envStart + studProfile.w * 0.5;
    const endPostArc   = envEnd   - studProfile.w * 0.5;

    // Tangents read from the un-extrapolated centerline (segment tangents
    // are constant within a segment, and extrapolated points share the
    // direction of the nearest endpoint segment).
    const startTangentArc = Math.max(0, Math.min(polylineLength(cl), startPostArc));
    const endTangentArc   = Math.max(0, Math.min(polylineLength(cl), endPostArc));

    parts.push(makeStud(
      "End stud (start)", "stud",
      pointAtExtrapolating(cl, startPostArc), tangentAt(cl, startTangentArc),
      studZ0, studH, studProfile, material,
    ));
    positions.push(startPostArc);

    parts.push(makeStud(
      "End stud (end)", "stud",
      pointAtExtrapolating(cl, endPostArc), tangentAt(cl, endTangentArc),
      studZ0, studH, studProfile, material,
    ));
    positions.push(endPostArc);
  }

  // Corner posts at interior vertices (or every unique vertex for closed).
  const uniqueCount = isClosed ? n - 1 : n;
  let acc = 0;
  for (let i = 0; i < uniqueCount; i++) {
    if (i > 0) acc += cl[i - 1].distTo(cl[i]);
    if (!isClosed && (i === 0 || i === uniqueCount - 1)) continue;
    parts.push(makeStud(
      `Corner post ${i + 1}`, "stud",
      pointAt(cl, acc), tangentAt(cl, acc),
      studZ0, studH, studProfile, material,
    ));
    positions.push(acc);
  }

  return positions;
}

// ─── Channel-stud insertion (through-wall T-junctions) ───────────────

/**
 * For one T-junction landing on this wall's interior, place a pair of
 * channel studs flanking the junction position. These provide a nailing
 * surface for the partition's drywall return. Symmetric placement at
 * ±(otherThickness/2 + studProfile.w/2) from the junction.
 *
 * Returns the arc-length positions of the channel studs so the caller
 * can skip regular studs in those zones.
 */
export function addChannelStuds(
  parts: WallPart[], cl: Vec2[], junction: WallTJunction,
  studProfile: PartProfile, material: string,
  studZ0: number, studH: number,
): number[] {
  const offset = junction.otherThickness * 0.5 + studProfile.w * 0.5;
  const positions = [junction.arcLength - offset, junction.arcLength + offset];
  let i = 0;
  for (const m of positions) {
    if (m < studProfile.w * 0.5 || m > polylineLength(cl) - studProfile.w * 0.5) continue;
    parts.push(makeStud(
      `Channel ${++i} (T-junc @ ${junction.arcLength.toFixed(2)} m)`,
      "stud",
      pointAt(cl, m), tangentAt(cl, m),
      studZ0, studH, studProfile, material,
    ));
  }
  return positions;
}

// ─── Cripple placement ───────────────────────────────────────────────

/**
 * Place cripple-class studs at regular spacing inside an opening's u range,
 * aligned to the global stud grid so cripples sit above/below the regular
 * studs that were skipped through the opening.
 *
 * `studProfile` controls the cross-section. `margin` keeps the cripples
 * clear of the jack / king studs at the edges (default = 1.5 × stud.h).
 */
export function placeCripples(
  parts: WallPart[], cl: Vec2[],
  uL: number, uR: number,
  studProfile: PartProfile, material: string,
  studSpacing: number,
  z0: number, h: number,
  role: WallPartRole, namePrefix: string,
  margin = studProfile.h * 1.5,
): void {
  const cuL = uL + margin;
  const cuR = uR - margin;
  if (cuR <= cuL) return;
  const startK = Math.ceil((cuL - studSpacing * 0.5) / studSpacing);
  const endK   = Math.floor((cuR - studSpacing * 0.5) / studSpacing);
  let i = 0;
  for (let k = startK; k <= endK; k++) {
    const m = studSpacing * 0.5 + k * studSpacing;
    parts.push(makeStud(
      `${namePrefix} ${++i}`, role,
      pointAt(cl, m), tangentAt(cl, m),
      z0, h, studProfile, material,
    ));
  }
}
