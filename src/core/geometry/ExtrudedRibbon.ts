// ====================================================================
// EXTRUDED RIBBON — generic geometric primitive
// ====================================================================
//
// A 2D polyline centerline, offset by ±Width/2 to form a ribbon, then
// extruded vertically by Height. Rectangular openings can be punched
// through both faces. Corners at interior polyline vertices are mitered.
//
// This is the scale-independent geometric operation underlying:
//   • Walls           (centerline = wall axis,   width = 0.2m, height = 3m)
//   • Building masses (centerline = footprint,   width = facade depth, height = building)
//   • Fences          (centerline = fence line,  width = post depth,   height = 1.2m)
//   • Urban blocks    (centerline = block edge,  width = setback,      height = max)
//
// Domain semantics (name, IFC type, material) live on a thin wrapper —
// see Wall/WallSystem in walls.ts.
//
// Ported from HDGEO C# (HDGEO.Core.Geometry.ExtrudedRibbon).

import { Vec2, Vec3 } from "../math/vectors";
import { Mesh } from "./mesh/Mesh";

// ─── Local frame ─────────────────────────────────────────────────────

/**
 * Local coordinate frame for a single straight segment of an ExtrudedRibbon.
 *
 *   U = along the centerline (0 at segment start, segLength at segment end)
 *   V = up / vertical (0 at baseZ, height at top)
 *   W = perpendicular to the wall face (+W = left side, −W = right side)
 *
 * Opening, attachment, and dimension math becomes trivial 1D/2D in this frame.
 * Multi-segment walls have one RibbonFrame per segment with a `uOffset` equal
 * to the cumulative arc-length up to that segment.
 */
export class RibbonFrame {
  readonly origin: Vec2;     // world XY position at segment start
  readonly dirU: Vec2;       // unit along centerline
  readonly dirW: Vec2;       // unit perpendicular (left)
  readonly segLength: number;
  readonly halfWidth: number;
  readonly baseZ: number;
  readonly height: number;
  readonly uOffset: number;

  constructor(
    segStart: Vec2, segEnd: Vec2,
    halfWidth: number, baseZ: number, height: number,
    uOffset = 0,
  ) {
    this.origin = segStart;
    const delta = segEnd.sub(segStart);
    this.segLength = delta.len();
    this.dirU = this.segLength > 1e-9 ? delta.div(this.segLength) : new Vec2(1, 0);
    this.dirW = new Vec2(-this.dirU.y, this.dirU.x);
    this.halfWidth = halfWidth;
    this.baseZ = baseZ;
    this.height = height;
    this.uOffset = uOffset;
  }

  /** Local (u, v, w) → world (x, y, z). */
  toWorld(u: number, v: number, w = 0): Vec3 {
    const xy = this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(w));
    return new Vec3(xy.x, xy.y, this.baseZ + v);
  }

  /** Local (u, w) → world XY (height ignored). */
  toWorldXY(u: number, w = 0): Vec2 {
    return this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(w));
  }

  /** World point → (u, v, w). */
  toLocal(world: Vec3): { u: number; v: number; w: number } {
    const delta = new Vec2(world.x, world.y).sub(this.origin);
    return {
      u: delta.dot(this.dirU),
      w: delta.dot(this.dirW),
      v: world.z - this.baseZ,
    };
  }

  leftAt(u: number):  Vec2 { return this.origin.add(this.dirU.mul(u)).add(this.dirW.mul(this.halfWidth)); }
  rightAt(u: number): Vec2 { return this.origin.add(this.dirU.mul(u)).sub(this.dirW.mul(this.halfWidth)); }
  centerAt(u: number): Vec2 { return this.origin.add(this.dirU.mul(u)); }

  get leftNormal():  Vec3 { return new Vec3( this.dirW.x,  this.dirW.y, 0); }
  get rightNormal(): Vec3 { return new Vec3(-this.dirW.x, -this.dirW.y, 0); }
}

// ─── Openings ────────────────────────────────────────────────────────

/**
 * A rectangular cutout in an ExtrudedRibbon, positioned along the centerline.
 * Pure geometry — door/window semantics live on the BIM wrapper (WallOpening).
 */
export class RibbonOpening {
  centerlinePosition: number;
  width: number;
  bottomOffset: number;
  topOffset: number;

  constructor(centerlinePosition: number, width = 0.9, bottomOffset = 0, topOffset = 2.1) {
    this.centerlinePosition = centerlinePosition;
    this.width = width;
    this.bottomOffset = bottomOffset;
    this.topOffset = topOffset;
  }
}

// ─── End trims (junction info from RibbonSystem) ─────────────────────

/**
 * Trim specification for one end of an open ribbon. Each side (left/right)
 * can carry its own trim line — necessary when ≥3 ribbons meet at a point
 * and the left offset trims against a different angular neighbor than the right.
 *
 * For a 2-way junction (L/T-joint), both sides use the same bisector — pass
 * a single (point, dir) via `RibbonEndTrim.bothSides(...)`.
 */
export class RibbonEndTrim {
  /**
   * If `true`, the trimmed end gets an explicit cap face (built from the
   * trimmed leftPts / rightPts). Use for butt-style joints where the
   * trimmed end is visible at the joint. Default `false` (no cap), which
   * is correct for mitered joints where the two walls' offset edges
   * meet along the bisector and a cap would z-fight.
   */
  drawCap = false;

  constructor(
    public leftTrimPoint: Vec2,  public leftTrimDir: Vec2,
    public rightTrimPoint: Vec2, public rightTrimDir: Vec2,
  ) {}

  static bothSides(pointOnLine: Vec2, lineDirection: Vec2): RibbonEndTrim {
    return new RibbonEndTrim(pointOnLine, lineDirection, pointOnLine, lineDirection);
  }
}

// ─── ExtrudedRibbon ──────────────────────────────────────────────────

export interface ExtrudedRibbonOptions {
  centerline: Vec2[];
  width?: number;
  height?: number;
  baseZ?: number;
}

/**
 * Maximum miter extension as a multiple of half-width.
 * Clamps acute angles to avoid self-intersection.
 */
export const MITER_LIMIT = 6;

export class ExtrudedRibbon {
  centerline: Vec2[];
  width = 0.2;
  height = 3.0;
  baseZ = 0.0;
  readonly openings: RibbonOpening[] = [];

  constructor(opts: ExtrudedRibbonOptions | Vec2[]) {
    const o = Array.isArray(opts) ? { centerline: opts } : opts;
    if (!o.centerline || o.centerline.length < 2) {
      throw new Error("ExtrudedRibbon: centerline needs at least 2 points");
    }
    this.centerline = o.centerline;
    if (o.width  !== undefined) this.width  = o.width;
    if (o.height !== undefined) this.height = o.height;
    if (o.baseZ  !== undefined) this.baseZ  = o.baseZ;
  }

  get length(): number {
    let total = 0;
    for (let i = 0; i < this.centerline.length - 1; i++) {
      total += this.centerline[i].distTo(this.centerline[i + 1]);
    }
    return total;
  }

  get segmentCount(): number { return this.centerline.length - 1; }

  get isClosedPolyline(): boolean {
    const cl = this.centerline;
    return cl.length >= 3 && cl[0].distSqTo(cl[cl.length - 1]) < 1e-10;
  }

  // ── Meshing ──

  /** Build a stand-alone triangle mesh for this ribbon. */
  toMesh(): Mesh {
    const buf = newBuffers();
    this.buildInto(buf, null, null);
    return finishMesh(buf);
  }

  /**
   * Append this ribbon's geometry into accumulator buffers (used by
   * RibbonSystem to combine many ribbons in one mesh).
   */
  buildInto(buf: MeshBuffers, startTrim: RibbonEndTrim | null, endTrim: RibbonEndTrim | null): void {
    const cl = this.centerline;
    const n = cl.length;
    if (n < 2) return;

    const isClosed = this.isClosedPolyline;
    const vCount = isClosed ? n - 1 : n;

    const r  = this.width * 0.5;
    const z0 = this.baseZ;
    const z1 = this.baseZ + this.height;

    // ── 1. Mitered offset points ──
    const leftPts  = new Array<Vec2>(vCount);
    const rightPts = new Array<Vec2>(vCount);
    for (let i = 0; i < vCount; i++) {
      const p = cl[i];
      let prev: Vec2 | null = null;
      let next: Vec2 | null = null;
      if (i > 0)            prev = cl[i - 1];
      else if (isClosed)    prev = cl[vCount - 1];
      if (i < vCount - 1)   next = cl[i + 1];
      else if (isClosed)    next = cl[0];

      const { left, right } = computeOffsetPoint(p, prev, next, r);
      leftPts[i]  = left;
      rightPts[i] = right;
    }

    // ── 1b. End trims (junction info) ──
    if (!isClosed && vCount >= 2) {
      if (startTrim) {
        const d = safeNormalize(cl[1].sub(cl[0]));
        const trimmed = applyEndTrim(cl[0], d, r, startTrim);
        leftPts[0]  = trimmed.left;
        rightPts[0] = trimmed.right;
      }
      if (endTrim) {
        const last = vCount - 1;
        const d = safeNormalize(cl[last].sub(cl[last - 1]));
        const trimmed = applyEndTrim(cl[last], d, r, endTrim);
        leftPts[last]  = trimmed.left;
        rightPts[last] = trimmed.right;
      }
    }

    // ── 1c. Cumulative arc-length (opening placement) ──
    const arcLen = new Array<number>(vCount).fill(0);
    for (let i = 1; i < vCount; i++) {
      arcLen[i] = arcLen[i - 1] + cl[i - 1].distTo(cl[i]);
    }

    // ── 2. Per-segment faces ──
    const segCount = isClosed ? vCount : vCount - 1;
    for (let s = 0; s < segCount; s++) {
      const i = s;
      const j = (s + 1) % vCount;

      const iL = leftPts[i],  iR = rightPts[i];
      const jL = leftPts[j],  jR = rightPts[j];

      const segStart = arcLen[i];
      let   segEnd   = arcLen[j < vCount ? j : 0];
      if (segEnd <= segStart) segEnd = segStart + cl[i].distTo(cl[j]);
      const segLen = segEnd - segStart;

      const frame = new RibbonFrame(cl[i], cl[j], r, z0, z1 - z0, segStart);

      // Miter U offsets at each end of this segment.
      // Tells us the actual wall-face boundary for openings touching corners.
      const iLu = iL.sub(cl[i]).dot(frame.dirU);
      const iRu = iR.sub(cl[i]).dot(frame.dirU);
      const jLu = segLen + jL.sub(cl[j]).dot(frame.dirU);
      const jRu = segLen + jR.sub(cl[j]).dot(frame.dirU);

      const startMinU = Math.min(iLu, iRu);
      const endMaxU   = Math.max(jLu, jRu);

      // Collect openings in local U.
      const minStrip = Math.max(0.02, segLen * 0.02);
      const ops: { uL: number; uR: number; vBot: number; vTop: number }[] = [];
      for (const op of this.openings) {
        if (op.centerlinePosition < segStart || op.centerlinePosition > segEnd) continue;
        const cu = op.centerlinePosition - segStart;
        let uL = Math.max(cu - op.width * 0.5, 0);
        let uR = Math.min(cu + op.width * 0.5, segLen);
        if (uR <= uL + 1e-6) continue;
        if (uL < minStrip) uL = Math.max(startMinU, 0);
        if (segLen - uR < minStrip) uR = Math.min(endMaxU, segLen);
        ops.push({ uL, uR, vBot: op.bottomOffset, vTop: op.topOffset });
      }
      ops.sort((a, b) => a.uL - b.uL);

      if (ops.length === 0) {
        // Seamless mitered offset edges.
        emitQuad(buf,
          new Vec3(iL.x, iL.y, z0), new Vec3(iL.x, iL.y, z1),
          new Vec3(jL.x, jL.y, z1), new Vec3(jL.x, jL.y, z0),
          frame.leftNormal);
        emitQuad(buf,
          new Vec3(iR.x, iR.y, z0), new Vec3(jR.x, jR.y, z0),
          new Vec3(jR.x, jR.y, z1), new Vec3(iR.x, iR.y, z1),
          frame.rightNormal);
      } else {
        const h = z1 - z0;

        emitSideLocal(buf, frame, segLen, h, ops, +1, iL, jL);
        emitSideLocal(buf, frame, segLen, h, ops, -1, iR, jR);

        const eps = segLen * 0.01;
        for (const { uL, uR, vBot, vTop } of ops) {
          const atStart = uL < eps;
          const atEnd   = uR > segLen - eps;

          const llXY = atStart ? iL : frame.toWorldXY(uL, +r);
          const lrXY = atEnd   ? jL : frame.toWorldXY(uR, +r);
          const rlXY = atStart ? iR : frame.toWorldXY(uL, -r);
          const rrXY = atEnd   ? jR : frame.toWorldXY(uR, -r);

          const zSill = z0 + vBot;
          const zHead = z0 + vTop;

          // Top soffit (downward normal)
          emitQuad(buf,
            new Vec3(llXY.x, llXY.y, zHead), new Vec3(rlXY.x, rlXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zHead), new Vec3(lrXY.x, lrXY.y, zHead),
            new Vec3(0, 0, -1));
          // Bottom sill (upward normal)
          if (vBot > 0.001) {
            emitQuad(buf,
              new Vec3(llXY.x, llXY.y, zSill), new Vec3(lrXY.x, lrXY.y, zSill),
              new Vec3(rrXY.x, rrXY.y, zSill), new Vec3(rlXY.x, rlXY.y, zSill),
              new Vec3(0, 0, 1));
          }
          // Left jamb (−U normal)
          const jambLN = new Vec3(-frame.dirU.x, -frame.dirU.y, 0);
          emitQuad(buf,
            new Vec3(llXY.x, llXY.y, zSill), new Vec3(rlXY.x, rlXY.y, zSill),
            new Vec3(rlXY.x, rlXY.y, zHead), new Vec3(llXY.x, llXY.y, zHead),
            jambLN);
          // Right jamb (+U normal)
          const jambRN = new Vec3(frame.dirU.x, frame.dirU.y, 0);
          emitQuad(buf,
            new Vec3(lrXY.x, lrXY.y, zSill), new Vec3(lrXY.x, lrXY.y, zHead),
            new Vec3(rrXY.x, rrXY.y, zHead), new Vec3(rrXY.x, rrXY.y, zSill),
            jambRN);
        }
      }

      // Top face
      emitQuad(buf,
        new Vec3(iL.x, iL.y, z1), new Vec3(iR.x, iR.y, z1),
        new Vec3(jR.x, jR.y, z1), new Vec3(jL.x, jL.y, z1),
        new Vec3(0, 0, 1));

      // Bottom face
      emitQuad(buf,
        new Vec3(iL.x, iL.y, z0), new Vec3(jL.x, jL.y, z0),
        new Vec3(jR.x, jR.y, z0), new Vec3(iR.x, iR.y, z0),
        new Vec3(0, 0, -1));
    }

    // ── 3. End caps ──
    if (!isClosed) {
      if (startTrim === null || startTrim.drawCap) {
        const firstDir = safeNormalize(cl[1].sub(cl[0]));
        const startNormal = new Vec3(-firstDir.x, -firstDir.y, 0);
        const sL = leftPts[0], sR = rightPts[0];
        emitQuad(buf,
          new Vec3(sL.x, sL.y, z0), new Vec3(sR.x, sR.y, z0),
          new Vec3(sR.x, sR.y, z1), new Vec3(sL.x, sL.y, z1),
          startNormal);
      }
      if (endTrim === null || endTrim.drawCap) {
        const last = vCount - 1;
        const lastDir = safeNormalize(cl[last].sub(cl[last - 1]));
        const endNormal = new Vec3(lastDir.x, lastDir.y, 0);
        const eL = leftPts[last], eR = rightPts[last];
        emitQuad(buf,
          new Vec3(eR.x, eR.y, z0), new Vec3(eL.x, eL.y, z0),
          new Vec3(eL.x, eL.y, z1), new Vec3(eR.x, eR.y, z1),
          endNormal);
      }
    }
  }
}

// ─── Shared mesh buffer helpers (internal) ──────────────────────────

export interface MeshBuffers {
  positions: number[];
  normals: number[];
  indices: number[];
}

export function newBuffers(): MeshBuffers {
  return { positions: [], normals: [], indices: [] };
}

export function finishMesh(buf: MeshBuffers): Mesh {
  return new Mesh(
    new Float32Array(buf.positions),
    new Uint32Array(buf.indices),
    new Float32Array(buf.normals),
  );
}

function emitQuad(buf: MeshBuffers, a: Vec3, b: Vec3, c: Vec3, d: Vec3, normal: Vec3): void {
  const base = buf.positions.length / 3;
  buf.positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
  for (let i = 0; i < 4; i++) buf.normals.push(normal.x, normal.y, normal.z);
  buf.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

// ─── Geometric helpers (also used by RibbonSystem) ──────────────────

/**
 * Mitered offset points for a polyline vertex `p`, given optional neighbors.
 * Returned `left` = +half-width offset, `right` = −half-width offset.
 */
function computeOffsetPoint(
  p: Vec2, prev: Vec2 | null, next: Vec2 | null, r: number,
): { left: Vec2; right: Vec2 } {
  if (prev === null && next === null) return { left: p, right: p };

  if (prev === null) {
    const d = safeNormalize(next!.sub(p));
    const n = new Vec2(-d.y, d.x);
    return { left: p.add(n.mul(r)), right: p.sub(n.mul(r)) };
  }
  if (next === null) {
    const d = safeNormalize(p.sub(prev));
    const n = new Vec2(-d.y, d.x);
    return { left: p.add(n.mul(r)), right: p.sub(n.mul(r)) };
  }

  const d1 = safeNormalize(p.sub(prev));
  const d2 = safeNormalize(next.sub(p));
  const n1 = new Vec2(-d1.y, d1.x);
  const n2 = new Vec2(-d2.y, d2.x);
  const dot = d1.x * d2.x + d1.y * d2.y;

  if (dot < -0.999) {
    return { left: p.add(n1.mul(r)), right: p.sub(n1.mul(r)) };
  }

  let miter = n1.add(n2).mul(r / (1 + dot));
  const maxLen = r * MITER_LIMIT;
  if (miter.lenSq() > maxLen * maxLen) miter = n1.mul(r);

  return { left: p.add(miter), right: p.sub(miter) };
}

function applyEndTrim(
  endpoint: Vec2, wallDir: Vec2, r: number, trim: RibbonEndTrim,
): { left: Vec2; right: Vec2 } {
  const perp = new Vec2(-wallDir.y, wallDir.x);
  const leftLineOrigin  = endpoint.add(perp.mul(r));
  const rightLineOrigin = endpoint.sub(perp.mul(r));

  const left  = intersectLines(leftLineOrigin,  wallDir, trim.leftTrimPoint,  trim.leftTrimDir)  ?? leftLineOrigin;
  const right = intersectLines(rightLineOrigin, wallDir, trim.rightTrimPoint, trim.rightTrimDir) ?? rightLineOrigin;
  return { left, right };
}

export function intersectLines(p1: Vec2, d1: Vec2, p2: Vec2, d2: Vec2): Vec2 | null {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-9) return null;
  const delta = p2.sub(p1);
  const t = (delta.x * d2.y - delta.y * d2.x) / denom;
  return p1.add(d1.mul(t));
}

export function safeNormalize(v: Vec2): Vec2 {
  const len = v.len();
  return len > 1e-9 ? v.div(len) : new Vec2(1, 0);
}

// ─── Side-face emitters with opening cutouts (internal) ─────────────

function emitSideLocal(
  buf: MeshBuffers, frame: RibbonFrame, segLen: number, height: number,
  openings: { uL: number; uR: number; vBot: number; vTop: number }[],
  side: -1 | 1, startMiter: Vec2, endMiter: Vec2,
): void {
  const w = frame.halfWidth * side;
  const normal = side > 0 ? frame.leftNormal : frame.rightNormal;
  const flip = side < 0;

  let cursor = 0;
  const minU = segLen * 0.005;

  for (let oi = 0; oi < openings.length; oi++) {
    const { uL, uR, vBot, vTop } = openings[oi];

    // Solid strip before opening (full height)
    if (uL > cursor + minU) {
      const isFirst = cursor < 0.001;
      emitSideStrip(buf, frame, cursor, uL, 0, height, w, normal, flip,
        isFirst ? startMiter : null, null);
    }

    // Header above opening — follows miter at boundary
    if (vTop < height - 0.001) {
      const hAtStart = uL < 0.001;
      const hAtEnd   = uR > segLen - 0.001;
      emitSideStrip(buf, frame, uL, uR, vTop, height, w, normal, flip,
        hAtStart ? startMiter : null, hAtEnd ? endMiter : null);
    }

    // Sill below opening — follows miter at boundary
    if (vBot > 0.001) {
      const sAtStart = uL < 0.001;
      const sAtEnd   = uR > segLen - 0.001;
      emitSideStrip(buf, frame, uL, uR, 0, vBot, w, normal, flip,
        sAtStart ? startMiter : null, sAtEnd ? endMiter : null);
    }

    cursor = uR;
  }

  // Solid strip after last opening
  if (cursor < segLen - minU) {
    emitSideStrip(buf, frame, cursor, segLen, 0, height, w, normal, flip,
      null, endMiter);
  }
}

function emitSideStrip(
  buf: MeshBuffers, frame: RibbonFrame,
  u0: number, u1: number, v0: number, v1: number, w: number,
  normal: Vec3, flipWinding: boolean,
  startMiterPt: Vec2 | null, endMiterPt: Vec2 | null,
): void {
  let a: Vec3, b: Vec3;
  if (startMiterPt) {
    a = new Vec3(startMiterPt.x, startMiterPt.y, frame.baseZ + v0);
    b = new Vec3(startMiterPt.x, startMiterPt.y, frame.baseZ + v1);
  } else {
    a = frame.toWorld(u0, v0, w);
    b = frame.toWorld(u0, v1, w);
  }

  let c: Vec3, d: Vec3;
  if (endMiterPt) {
    c = new Vec3(endMiterPt.x, endMiterPt.y, frame.baseZ + v1);
    d = new Vec3(endMiterPt.x, endMiterPt.y, frame.baseZ + v0);
  } else {
    c = frame.toWorld(u1, v1, w);
    d = frame.toWorld(u1, v0, w);
  }

  if (flipWinding) emitQuad(buf, a, d, c, b, normal);
  else             emitQuad(buf, a, b, c, d, normal);
}
