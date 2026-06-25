// ====================================================================
// BIM / Walls / Balloon Frame — North-American light-frame construction
// ====================================================================
//
// Decomposes a wall into:
//
//   • Sill plate                   horizontal, bottom
//   • Top plate(s) (typ. doubled)  horizontal, top
//   • Studs                        vertical, at studSpacing
//   • King + Jack studs            flanking each opening
//   • Header                       across each opening (sized by width)
//   • Cripples (above + below)     short verticals above headers, below sills
//   • Rough sill                   horizontal blocking under windows
//
// Convention follows NA practice — 2×4 / 2×6 SPF lumber, 16″ o.c.
// (0.4 m) spacing, doubled top plate. For Central-European convention
// (KVH, 0.625 m spacing, single top plate, doubled-stud kings) see
// the sibling `holzrahmenbau.ts`.

import type { Wall, WallOpening } from "../../core/geometry/walls";
import type { WallConstruction, WallPart, PartProfile, WallContext } from "./types";
import {
  makePlate, makeStud,
  pointAt, tangentAt,
  addHeaderSillCripples,
  effectiveStartArc, effectiveEndArc, addChannelStuds,
  addEndAndCornerStuds,
} from "./framing-helpers";

// ─── Options ─────────────────────────────────────────────────────────

export interface BalloonFrameOptions {
  /** Stud cross-section. Default: SPF 2×4 nominal (38 × 89 mm actual). */
  studProfile?: PartProfile;
  /** Plate cross-section. Default: same as stud profile. */
  plateProfile?: PartProfile;
  /** Spacing between stud centerlines, in metres. Default: 0.4 (~16″ o.c.). */
  studSpacing?: number;
  /** Number of top plates (1 or 2). Default: 2 (doubled top plate). */
  topPlateCount?: 1 | 2;
  /** Header depth as a function of opening width. */
  headerDepth?: (openingWidth: number) => number;
  /** Material name for all framing members. Default: `"SPF"`. */
  material?: string;
}

const DEFAULTS: Required<BalloonFrameOptions> = {
  studProfile:    { w: 0.038, h: 0.089, name: "SPF 2×4 (38×89)" },
  plateProfile:   { w: 0.038, h: 0.089, name: "SPF 2×4 (38×89)" },
  studSpacing:    0.4,
  topPlateCount:  2,
  headerDepth:    (w) => (w >= 1.8 ? 0.235 : w >= 1.2 ? 0.184 : 0.140),
  material:       "SPF",
};

// ─── Construction ────────────────────────────────────────────────────

/**
 * Balloon-frame construction factory (North-American light-frame timber).
 *
 * @example
 * const Framed2x4 = new WallType({
 *   name: "2×4 framed @ 400 mm o.c.",
 *   construction: BalloonFrame({ studSpacing: 0.4 }),
 *   properties: { loadBearing: true },
 * });
 */
export function BalloonFrame(options: BalloonFrameOptions = {}): WallConstruction {
  const opts = { ...DEFAULTS, ...options };

  return (wall: Wall, ctx?: WallContext): WallPart[] => {
    const parts: WallPart[] = [];
    const cl     = wall.centerline;
    const baseZ  = wall.baseElevation;
    const wallH  = wall.height;
    const plate  = opts.plateProfile;
    const stud   = opts.studProfile;
    const sp     = opts.studSpacing;
    const topN   = opts.topPlateCount;
    const plateVerticalH  = plate.w;
    const plateAcrossWall = plate.h;
    const topAll = plateVerticalH * topN;

    // Junction-aware effective span: studs/plates live within [startArc..endArc].
    const startArc = ctx?.startTrim ? effectiveStartArc(cl, ctx.startTrim) : 0;
    const endArc   = effectiveEndArc(cl, ctx?.endTrim ?? null);

    // ── Plates (trimmed to junction faces if applicable) ──
    parts.push(makePlate(
      "Sill plate", "sillPlate", cl,
      baseZ, plateVerticalH, plateAcrossWall, opts.material, plate,
      ctx?.startTrim ?? null, ctx?.endTrim ?? null,
    ));
    for (let i = 0; i < topN; i++) {
      const z = baseZ + wallH - topAll + i * plateVerticalH;
      parts.push(makePlate(
        topN > 1 ? `Top plate ${i + 1}` : "Top plate",
        "topPlate", cl, z, plateVerticalH, plateAcrossWall, opts.material, plate,
        ctx?.startTrim ?? null, ctx?.endTrim ?? null,
      ));
    }

    const studZ0 = baseZ + plateVerticalH;
    const studH  = wallH - plateVerticalH - topAll;

    // ── Opening framing (king + jack + header + cripples + rough sill) ──
    const openingExtents: { uL: number; uR: number }[] = [];
    let openingIdx = 0;
    for (const o of wall.openings) {
      openingIdx++;
      const uL = o.centerlinePosition - o.width / 2;
      const uR = o.centerlinePosition + o.width / 2;
      openingExtents.push({ uL, uR });
      addOpeningFramingNA(parts, wall, o, uL, uR, openingIdx, opts, studZ0, studH);
    }

    // ── Channel studs for T-junctions on this wall's interior ──
    const channelZones: number[] = [];
    if (ctx?.tJunctions) {
      for (const j of ctx.tJunctions) {
        const placed = addChannelStuds(parts, cl, j, stud, opts.material, studZ0, studH);
        channelZones.push(...placed);
      }
    }

    // ── End studs + corner posts (wall closes with posts, not cantilevers) ──
    const mandatoryZones = addEndAndCornerStuds(
      parts, wall, ctx?.startTrim ?? null, ctx?.endTrim ?? null,
      stud, opts.material, studZ0, studH,
    );

    // ── Regular studs, skipping opening / channel / mandatory zones ──
    let studIdx = 0;
    for (let m = startArc + sp; m < endArc; m += sp) {
      const inOpening = openingExtents.some(
        (r) => m >= r.uL - stud.h * 0.5 && m <= r.uR + stud.h * 0.5,
      );
      if (inOpening) continue;
      const inChannel = channelZones.some(p => Math.abs(p - m) < stud.h);
      if (inChannel) continue;
      const nearMandatory = mandatoryZones.some(p => Math.abs(p - m) < stud.h);
      if (nearMandatory) continue;
      parts.push(makeStud(
        `Stud ${++studIdx}`, "stud",
        pointAt(cl, m), tangentAt(cl, m),
        studZ0, studH, stud, opts.material,
      ));
    }

    return parts;
  };
}

// ─── Opening framing: NA convention (king + jack pair) ──────────────

function addOpeningFramingNA(
  parts: WallPart[], wall: Wall, opening: WallOpening,
  uL: number, uR: number, idx: number,
  opts: Required<BalloonFrameOptions>,
  studZ0: number, studH: number,
): void {
  const cl    = wall.centerline;
  const baseZ = wall.baseElevation;
  const stud  = opts.studProfile;
  const plate = opts.plateProfile;
  const plateVerticalH  = plate.w;

  // King studs (just outside opening edges).
  parts.push(makeStud(
    `King L (op ${idx})`, "stud",
    pointAt(cl, uL - stud.h * 0.5), tangentAt(cl, uL),
    studZ0, studH, stud, opts.material,
  ));
  parts.push(makeStud(
    `King R (op ${idx})`, "stud",
    pointAt(cl, uR + stud.h * 0.5), tangentAt(cl, uR),
    studZ0, studH, stud, opts.material,
  ));

  // Jack studs (inboard, supporting the header bottom).
  const jackHeight = opening.headHeight - plateVerticalH;
  const jackZ0 = baseZ + plateVerticalH;
  parts.push(makeStud(
    `Jack L (op ${idx})`, "jackStud",
    pointAt(cl, uL + stud.h * 0.5), tangentAt(cl, uL),
    jackZ0, jackHeight, stud, opts.material,
  ));
  parts.push(makeStud(
    `Jack R (op ${idx})`, "jackStud",
    pointAt(cl, uR - stud.h * 0.5), tangentAt(cl, uR),
    jackZ0, jackHeight, stud, opts.material,
  ));

  // Header, above-header cripples, rough sill + below-sill cripples (shared).
  addHeaderSillCripples(
    parts, wall, opening, uL, uR, idx,
    stud, plate, opts.material, opts.topPlateCount,
    opts.studSpacing, opts.headerDepth,
    {
      headerMargin: stud.h * 0.5,
      headerLabel: "Header",
      headerName: "Header",
      sillMargin: stud.h * 0.5,
      sillLabel: "Rough sill",
      sillName: "Sill blocking",
      crippleUpLabel: "Cripple ↑",
      crippleDownLabel: "Cripple ↓",
    },
  );
}
