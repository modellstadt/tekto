// ====================================================================
// BIM / Walls / Holzrahmenbau — Central-European timber-frame wall
// ====================================================================
//
// Decomposes a wall the German/Austrian/Swiss way:
//
//   • Schwelle (sill plate)        horizontal, bottom — often pressure-treated
//   • Rähm (top plate)             horizontal, top — single, full-width
//   • Ständer (studs / posts)      KVH 60×120/140/200, at studSpacing
//                                   (≈ 625 mm to match sheathing widths)
//   • Doppelständer (king posts)   doubled studs flanking each opening
//   • Sturz (header)               KVH or BSH beam across each opening
//   • Brüstungsriegel (sill rail)  horizontal under each window
//   • Kopfriegel / Fußriegel       short verticals above / below openings
//
// Differences from balloon-frame ("BalloonFrame"):
//   - Stud profile is beefier (60×120 KVH, not 38×89 SPF).
//   - Stud spacing is 625 mm (matches OSB / Gipsfaser panel widths).
//   - Single Rähm by default, not doubled.
//   - Opening edges use Doppelständer (two studs joined) rather than the
//     king+jack pair of NA practice.
//   - Header is typically a single KVH beam, sized per Eurocode 5.
//
// IFC mapping is the same — each member becomes `IfcMember` aggregated
// under the parent `IfcWall`. The Pset_WallCommon defaults reflect German
// practice (fire rating REI, U-value lower target).

import type { Wall, WallOpening } from "../../core/geometry/walls";
import type {
  WallConstruction, WallPart, PartProfile, MaterialLayer, WallContext,
} from "./types";
import {
  makePlate, makeStud, makeBeam,
  pointAt, tangentAt, subCenterline, polylineLength,
  placeCripples,
  effectiveStartArc, effectiveEndArc, addChannelStuds,
  addEndAndCornerStuds,
} from "./framing-helpers";

// ─── Options ─────────────────────────────────────────────────────────

export interface HolzrahmenBauOptions {
  /** Stud cross-section. Default: KVH 60×120 (engineered softwood). */
  studProfile?: PartProfile;
  /** Plate cross-section. Default: same as stud profile. */
  plateProfile?: PartProfile;
  /** Spacing between stud centerlines, in metres. Default: 0.625 (matches Gipsfaser/OSB panel widths). */
  studSpacing?: number;
  /** Number of Rähm (top plates). Default: 1. */
  topPlateCount?: 1 | 2;
  /** Header depth as a function of opening width. Default: KVH-sized. */
  headerDepth?: (openingWidth: number) => number;
  /** Material name for all framing members. Default: `"KVH C24"`. */
  material?: string;
  /**
   * Use doubled studs at opening edges (Doppelständer) instead of the
   * NA king + jack pair. Default: true.
   */
  doubledKings?: boolean;
}

const DEFAULTS: Required<HolzrahmenBauOptions> = {
  studProfile:    { w: 0.060, h: 0.120, name: "KVH 60×120" },
  plateProfile:   { w: 0.060, h: 0.120, name: "KVH 60×120" },
  studSpacing:    0.625,
  topPlateCount:  1,
  headerDepth:    (w) => (w >= 2.0 ? 0.240 : w >= 1.4 ? 0.200 : 0.160),
  material:       "KVH C24",
  doubledKings:   true,
};

// ─── Construction ────────────────────────────────────────────────────

/**
 * The conventional joint style for Holzrahmenbau / Holztafelbau panels —
 * walls are prefab elements built flat in a factory, so corners are
 * butt-jointed (one panel through, one butting) rather than mitred.
 *
 * Use as a default on `WallType.junctionStyle` when building a
 * `WallType` with `HolzrahmenBau(...)`.
 */
export const HolzrahmenBauJointStyle = "butt" as const;

/**
 * Holzrahmenbau construction factory (Central-European timber frame).
 *
 * @example
 * const HRB60x120 = new WallType({
 *   name: "Holzrahmenbau KVH 60×120 @ 625 mm",
 *   construction: HolzrahmenBau({ studSpacing: 0.625 }),
 *   layers: holzrahmenbauLayers(),
 *   properties: { loadBearing: true, isExternal: true, fireRating: "REI60", uValue: 0.18 },
 * });
 */
export function HolzrahmenBau(options: HolzrahmenBauOptions = {}): WallConstruction {
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

    // Junction-aware effective span.
    const startArc = ctx?.startTrim ? effectiveStartArc(cl, ctx.startTrim) : 0;
    const endArc   = effectiveEndArc(cl, ctx?.endTrim ?? null);

    // ── Schwelle (trimmed to junction faces if applicable) ──
    parts.push(makePlate(
      "Schwelle", "sillPlate", cl,
      baseZ, plateVerticalH, plateAcrossWall, opts.material, plate,
      ctx?.startTrim ?? null, ctx?.endTrim ?? null,
    ));

    // ── Rähm (top plate) ──
    for (let i = 0; i < topN; i++) {
      const z = baseZ + wallH - topAll + i * plateVerticalH;
      parts.push(makePlate(
        topN > 1 ? `Rähm ${i + 1}` : "Rähm",
        "topPlate", cl, z, plateVerticalH, plateAcrossWall, opts.material, plate,
        ctx?.startTrim ?? null, ctx?.endTrim ?? null,
      ));
    }

    const studZ0 = baseZ + plateVerticalH;
    const studH  = wallH - plateVerticalH - topAll;

    // ── Opening framing (Doppelständer + Sturz + Riegel) ──
    const openingExtents: { uL: number; uR: number }[] = [];
    let openingIdx = 0;
    for (const o of wall.openings) {
      openingIdx++;
      const uL = o.centerlinePosition - o.width / 2;
      const uR = o.centerlinePosition + o.width / 2;
      openingExtents.push({ uL, uR });
      addOpeningFramingDE(parts, wall, o, uL, uR, openingIdx, opts, studZ0, studH);
    }

    // ── Channel studs (T-Stoß) for T-junctions on this wall's interior ──
    const channelZones: number[] = [];
    if (ctx?.tJunctions) {
      for (const j of ctx.tJunctions) {
        const placed = addChannelStuds(parts, cl, j, stud, opts.material, studZ0, studH);
        channelZones.push(...placed);
      }
    }

    // ── End-/Eckpfosten (wall closes with posts, not cantilevers) ──
    const mandatoryZones = addEndAndCornerStuds(
      parts, wall, ctx?.startTrim ?? null, ctx?.endTrim ?? null,
      stud, opts.material, studZ0, studH,
    );

    // ── Regular Ständer, skipping opening / channel / mandatory zones ──
    const edgeSkip = opts.doubledKings ? stud.w * 1.5 : stud.h * 0.5;
    let studIdx = 0;
    for (let m = startArc + sp; m < endArc; m += sp) {
      const inOpening = openingExtents.some(
        (r) => m >= r.uL - edgeSkip && m <= r.uR + edgeSkip,
      );
      if (inOpening) continue;
      const inChannel = channelZones.some(p => Math.abs(p - m) < stud.h);
      if (inChannel) continue;
      const nearMandatory = mandatoryZones.some(p => Math.abs(p - m) < stud.h);
      if (nearMandatory) continue;
      parts.push(makeStud(
        `Ständer ${++studIdx}`, "stud",
        pointAt(cl, m), tangentAt(cl, m),
        studZ0, studH, stud, opts.material,
      ));
    }

    return parts;
  };
}

// ─── Opening framing: DE convention ──────────────────────────────────

function addOpeningFramingDE(
  parts: WallPart[], wall: Wall, opening: WallOpening,
  uL: number, uR: number, idx: number,
  opts: Required<HolzrahmenBauOptions>,
  studZ0: number, studH: number,
): void {
  const cl    = wall.centerline;
  const baseZ = wall.baseElevation;
  const stud  = opts.studProfile;
  const plate = opts.plateProfile;
  const plateVerticalH  = plate.w;
  const plateAcrossWall = plate.h;
  const topAll = plateVerticalH * opts.topPlateCount;
  const wallH = wall.height;
  const isDoor = opening.sillHeight <= 0.001;

  // ── Doppelständer (or single king) at each opening edge ──
  // First stud sits flush with the rough-opening edge; the second sits
  // immediately outboard, joined to the first.
  const placeEdgeKings = (mEdge: number, side: "L" | "R") => {
    // Edge stud: centered at mEdge ± stud.w/2 (so its inner face = rough opening edge).
    const sign = side === "L" ? -1 : +1;
    const m1 = mEdge + sign * stud.w * 0.5;
    parts.push(makeStud(
      `Ständer Kant ${side} (op ${idx})`, "stud",
      pointAt(cl, m1), tangentAt(cl, m1),
      studZ0, studH, stud, opts.material,
    ));
    if (opts.doubledKings) {
      const m2 = mEdge + sign * stud.w * 1.5;
      parts.push(makeStud(
        `Doppelständer ${side} (op ${idx})`, "stud",
        pointAt(cl, m2), tangentAt(cl, m2),
        studZ0, studH, stud, opts.material,
      ));
    }
  };
  placeEdgeKings(uL, "L");
  placeEdgeKings(uR, "R");

  // ── Sturz (header beam) — single KVH/BSH spanning between edge studs ──
  // Across-wall width = stud depth (centered in the cavity).
  const headerDepth = opts.headerDepth(opening.width);
  const headerZ    = baseZ + opening.headHeight;
  const headerCl   = subCenterline(cl, uL - stud.w * 0.5, uR + stud.w * 0.5);
  if (headerCl.length >= 2 && polylineLength(headerCl) > 1e-3) {
    parts.push(makeBeam(
      `Sturz (op ${idx})`, "header", headerCl,
      headerZ, headerDepth, stud.h, opts.material,
      { w: stud.h, h: headerDepth, name: `Sturz ${(headerDepth*1000).toFixed(0)}` },
    ));
  }

  // ── Kopfriegel (cripples above header) ──
  const upperZ0 = headerZ + headerDepth;
  const upperZ1 = baseZ + wallH - topAll;
  const upperH  = upperZ1 - upperZ0;
  if (upperH > 0.05) {
    placeCripples(
      parts, cl, uL, uR, stud, opts.material,
      opts.studSpacing, upperZ0, upperH, "cripple",
      `Kopfriegel (op ${idx})`,
      stud.w * 2.5, // wider margin — Doppelständer is wider than NA king+jack
    );
  }

  // ── Brüstungsriegel + Fußriegel (rough sill + cripples below) ──
  if (!isDoor) {
    const sillZ = baseZ + opening.sillHeight;
    const sillCl = subCenterline(cl, uL - stud.w * 0.5, uR + stud.w * 0.5);
    if (sillCl.length >= 2 && polylineLength(sillCl) > 1e-3) {
      parts.push(makeBeam(
        `Brüstungsriegel (op ${idx})`, "blocking", sillCl,
        sillZ - plateVerticalH, plateVerticalH, plateAcrossWall, opts.material,
        { w: plate.w, h: plate.h, name: "Brüstungsriegel" },
      ));
    }
    const lowerZ0 = baseZ + plateVerticalH;
    const lowerZ1 = sillZ - plateVerticalH;
    const lowerH  = lowerZ1 - lowerZ0;
    if (lowerH > 0.05) {
      placeCripples(
        parts, cl, uL, uR, stud, opts.material,
        opts.studSpacing, lowerZ0, lowerH, "cripple",
        `Fußriegel (op ${idx})`,
        stud.w * 2.5,
      );
    }
  }
}

// ─── Default layered build-up ────────────────────────────────────────

/**
 * Returns a typical Holzrahmenbau exterior-wall layered build-up,
 * interior → exterior. Override any layer by editing the result.
 *
 * Typical structure:
 *   1. Gipsfaser 12.5 mm   (interior board / fire layer)
 *   2. Installation cavity 30 mm (optional services layer)
 *   3. Vapour barrier (Dampfbremse)
 *   4. KVH stud cavity 120 mm + Mineralwolle (insulation)
 *   5. DWD board 16 mm     (diffusion-open exterior board)
 *   6. Diffusionsoffene Folie (wind/weather membrane)
 *   7. Lattung 30 mm       (ventilation battens)
 *   8. Fassade / cladding ~20 mm
 *
 * The KVH stud cavity layer is *not* included here — that's the
 * structural framing, modelled by `HolzrahmenBau()` as parts. The
 * layered build-up describes only the non-structural layers around it.
 *
 * @example
 * const ExtWall = new WallType({
 *   name: "HRB exterior wall",
 *   construction: HolzrahmenBau({ studProfile: { w: 0.06, h: 0.14 } }),
 *   layers: holzrahmenbauLayers({ insulation: { material: "Mineralwolle", thickness: 0.140 } }),
 *   properties: { isExternal: true, fireRating: "REI60", uValue: 0.18 },
 * });
 */
export function holzrahmenbauLayers(opts: {
  interiorBoard?: { material: string; thickness: number };
  installationCavity?: { thickness: number };
  vapourBarrier?: { material: string };
  insulation?: { material: string; thickness: number };
  exteriorBoard?: { material: string; thickness: number };
  weatherMembrane?: { material: string };
  ventilationBattens?: { thickness: number };
  cladding?: { material: string; thickness: number };
} = {}): MaterialLayer[] {
  const layers: MaterialLayer[] = [];

  const intBoard = opts.interiorBoard      ?? { material: "Gipsfaser",       thickness: 0.0125 };
  const instCav  = opts.installationCavity ?? { thickness: 0.030 };
  const vapour   = opts.vapourBarrier      ?? { material: "Dampfbremse" };
  const insul    = opts.insulation         ?? { material: "Mineralwolle",    thickness: 0.120 };
  const extBoard = opts.exteriorBoard      ?? { material: "DWD-Platte",      thickness: 0.016 };
  const weather  = opts.weatherMembrane    ?? { material: "Wind-/Wetterbahn" };
  const battens  = opts.ventilationBattens ?? { thickness: 0.030 };
  const cladding = opts.cladding           ?? { material: "Holzfassade",     thickness: 0.020 };

  layers.push({ material: intBoard.material,   thickness: intBoard.thickness, position: "interior" });
  layers.push({ material: "Installationsebene", thickness: instCav.thickness, position: "interior",
                properties: { airGap: true } });
  layers.push({ material: vapour.material,     thickness: 0.0002, position: "core",
                properties: { sd: 100 } });
  layers.push({ material: insul.material,      thickness: insul.thickness, position: "core",
                properties: { lambda: 0.035 } });
  layers.push({ material: extBoard.material,   thickness: extBoard.thickness, position: "exterior",
                properties: { sd: 0.2 } });
  layers.push({ material: weather.material,    thickness: 0.0005, position: "exterior" });
  layers.push({ material: "Lattung",           thickness: battens.thickness, position: "exterior",
                properties: { ventilated: true } });
  layers.push({ material: cladding.material,   thickness: cladding.thickness, position: "exterior" });

  return layers;
}
