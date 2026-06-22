/**
 * Mushroom-column construction — encapsulated.
 *
 * Returns the line / point geometry of one parametric NURBS mushroom column
 * (trunk + tilted-ellipse capital + isocurves + principal-curve fans).
 * The function is pure: it doesn't touch the renderer. Call it once per
 * column you want to place; render the returned primitives however you like.
 *
 * Coordinate convention:
 *   - X: long ellipse axis (semi-axis r1)
 *   - Z: short ellipse axis (semi-axis r2)
 *   - Y: vertical (column axis)
 *   - origin: base of the trunk on the floor; column extends in +Y from there.
 */

import { Vec3, NurbsCurve, NurbsSurface } from "../../src";

// ─── Public API ─────────────────────────────────────────────────────────────

export interface ColumnParams {
  /** Trunk radius (= bottom ring of capital). Default 0.15. */
  r0?: number;
  /** Top ellipse semi-axis along +X (long, positive side). Default 4.0. */
  r1?: number;
  /**
   * Top ellipse semi-axis along −X (long, negative side, as a positive
   * distance). Optional; if omitted, defaults to r1 so the cap is
   * symmetric. When set asymmetric, the lens is built directly with two
   * different X extents and the principal-curve march tracks the actual
   * asymmetric surface (no post-build scaling needed by callers).
   */
  r1Neg?: number;
  /** Top ellipse semi-axis along Z (short). Default 0.6. */
  r2?: number;
  /** Capital height (top of trunk → rim). Default 2.0. */
  capH?: number;
  /** Trunk height (floor → trunk top). Default 4.0. */
  trunkH?: number;
  /** Flare exponent in (0, ∞). 1 = linear cone, >1 = mushroom bell. Default 2.2. */
  flareExp?: number;
  /**
   * If true, replace the power-flare with a quadratic Bezier (r, y) profile
   * that is tangent to the trunk at the bottom (vertical tangent) and to
   * the rim plane at the top (horizontal tangent). The cap then joins the
   * trunk smoothly with no curvature kink and lands flat at the rim.
   * Default false (uses flareExp). */
  tangentialFlare?: boolean;
  /** Number of intermediate rings in the loft (≥ 2). Default 6. */
  crossSections?: number;

  /** Isocurve v-distribution mode. Default "equalAngle". */
  isoMode?: "uniform" | "equalX" | "equalAngle" | "equalArc";
  /** Total isocurves when mode = "uniform". Default 16. */
  isoCount?: number;
  /** Per-quadrant seed count for equalX/Angle/Arc modes; also drives plane-march fans. Default 8. */
  seedCount?: number;

  /** Render-time shear: lifts +X half of rim. Default 0. */
  shearPos?: number;
  /** Render-time shear: lifts −X half of rim. Default 0. */
  shearNeg?: number;
  /**
   * Profile of the shear lift along each half of the rim:
   *   "linear" (default) — lift is `(x/r1)·dy`, constant slope from
   *     column center to tip.
   *   "parabolicPeak"   — lift is `−dy/r1² · x² + 2·dy/r1 · x`, a
   *     parabola with peak at the tip (slope = 0 at the rim tip,
   *     slope = 2·dy/r1 at the column center). Adjacent columns whose
   *     tips share a meeting point therefore join with matching
   *     horizontal tangents at that point.
   */
  shearProfile?: "linear" | "parabolicPeak";

  /**
   * Principal-curve construction method.
   *   - "planeMarch"   : perpendicular plane at the current point intersects the next iso (default).
   *   - "closestPoint" : step to the geometrically closest point on the next iso.
   */
  principalMethod?: "planeMarch" | "closestPoint";

  /**
   * Enable the short-axis-seeded secondary fan (default true). Seeds on
   * v=0.25 (X=0 isocurve) below the rim; each curve marches DOWN through
   * iso targets to v=0 (long-axis isocurve).
   */
  secondaryFromShortAxis?: boolean;

  /**
   * Enable the long-axis-seeded secondary fan (default true). Seeds on
   * v = longAxisV below the lowest upper-fan landing; each curve marches UP
   * through iso targets to v=0.25. Set both flags true to draw BOTH families
   * — they fill the inner-column region from opposite axes and cover the gap
   * one alone leaves toward the trunk.
   */
  secondaryFromLongAxis?: boolean;

  /**
   * Density multiplier for the LONG-axis secondary fan. Default 1.0. Higher =
   * denser. Ignored by the short-axis fan, which is controlled by
   * `secondaryShortAxisCount`.
   */
  secondaryDensity?: number;

  /**
   * Number of seed points distributed by equal arc length along the v=0.25
   * (X=0 short-axis) isocurve for the short-axis secondary fan. Each seed
   * spawns one principal-curve line marching toward the long-axis. Default 10.
   */
  secondaryShortAxisCount?: number;

  /**
   * If true, bake the shear into the loft's control points so the marching
   * actually runs on the sheared geometry — every principal curve is a true
   * principal line on the sheared shape. Costs ~2× compute (the X-mirror is
   * broken by asymmetric shear, so we march in +X and −X halves separately).
   * If false (default), shear is applied only at render time and the curves
   * are computed on the symmetric unsheared surface.
   */
  geometricShear?: boolean;

  /** Origin of the column base (floor center). Default (0, 0, 0). */
  origin?: Vec3;

  /** Toggle individual feature families. All true by default. */
  showIsocurves?: boolean;
  showTrunkExtensions?: boolean;
  showTopRim?: boolean;
  showUpperFan?: boolean;
  showSecondaryFan?: boolean;
  showBottomCurve?: boolean;

  /** Samples per isocurve segment on the capital. Default 24. */
  isocurveSamples?: number;
  /** Samples for the top rim polyline. Default 192. */
  rimSamples?: number;
  /**
   * Cusp sharpness at the short-axis tips (±r2). 0 = smooth ellipse,
   * approaching 1 = sharp lens. Implemented by pulling the diagonal control
   * points toward the X-axis, which breaks tangent continuity at v=0.25 /
   * v=0.75 (those are already multiplicity-2 knots). Default 0.
   */
  rimPointiness?: number;
  /** Skip the very first secondary-fan seed (matches the playground behaviour). Default true. */
  skipTopSecondary?: boolean;

  /**
   * Rendered tube radius applied to EVERY emitted line (isocurves, top rim,
   * upper-fan curves, secondary-fan curves, bottom curve). Default 0.025 m
   * (= 5 cm diameter). Driven by the material-tube-diameter slider so the
   * rendered geometry matches the mass calculation's assumption.
   */
  lineThickness?: number;
}

export interface ColumnLine {
  points: Vec3[];
  color: string;
  /** Optional tube radius. If set, renderer should draw as a thickened tube. */
  thickness?: number;
}

export interface ColumnPoint {
  position: Vec3;
  color: string;
  size: number;
}

export interface ColumnGeometry {
  lines: ColumnLine[];
  points: ColumnPoint[];
}

/** Build the full line + point geometry for one mushroom column. */
export function buildMushroomColumn(params: ColumnParams = {}): ColumnGeometry {
  const r0       = params.r0       ?? 0.15;
  const r1Val    = params.r1       ?? 4.0;
  const r1NegVal = params.r1Neg    ?? r1Val;
  const r2Val    = params.r2       ?? 0.6;
  const capH     = params.capH     ?? 2.0;
  const trunkH   = params.trunkH   ?? 4.0;
  const flareExp = params.flareExp ?? 2.2;
  const tangentialFlare = params.tangentialFlare ?? false;
  const N        = Math.max(2, params.crossSections ?? 6);

  const isoMode   = params.isoMode   ?? "equalAngle";
  const isoCount  = Math.max(4, params.isoCount  ?? 16);
  const seedCount = Math.max(2, params.seedCount ?? 8);

  const shearPos = params.shearPos ?? 0;
  const shearNeg = params.shearNeg ?? 0;
  const shearProfile = params.shearProfile ?? "linear";

  const marchFn = params.principalMethod === "closestPoint"
    ? marchByClosestPoint
    : planeMarchThroughVs;

  const origin = params.origin ?? new Vec3(0, 0, 0);

  const showIsocurves        = params.showIsocurves        ?? true;
  const showTrunkExtensions  = params.showTrunkExtensions  ?? true;
  const showTopRim           = params.showTopRim           ?? true;
  const showUpperFan         = params.showUpperFan         ?? true;
  const showSecondaryFan     = params.showSecondaryFan     ?? true;
  const showBottomCurve      = params.showBottomCurve      ?? true;
  const skipTopSecondary     = params.skipTopSecondary     ?? true;
  const secondaryFromShortAxis = params.secondaryFromShortAxis ?? true;
  const secondaryFromLongAxis  = params.secondaryFromLongAxis  ?? false;
  const secondaryDensity       = Math.max(0.05, params.secondaryDensity ?? 1.0);
  const secondaryShortAxisCount = Math.max(1, Math.floor(params.secondaryShortAxisCount ?? 10));
  const geometricShear         = params.geometricShear         ?? true;

  const isoSamples = Math.max(8, params.isocurveSamples ?? 24);
  const rimSamples = Math.max(32, params.rimSamples ?? 192);
  const lineThickness = Math.max(0, params.lineThickness ?? 0.025);
  const rimPointiness = Math.max(0, Math.min(1, params.rimPointiness ?? 0));

  // ── Loft construction ─────────────────────────────────────────────────────
  // In geometricShear mode the shear is baked into each ring's control points,
  // so the curve marching runs on the truly sheared surface (and a balanced
  // column still gives a symmetric result because both sides see the same
  // process). Otherwise shear is left for render-time application below.
  const rings: NurbsCurve[] = [];
  const yBase = trunkH;
  for (let k = 0; k < N; k++) {
    const t  = k / (N - 1);
    // Two flare modes:
    //   power-flare   (default): r = r0 + (r1−r0)·t^flareExp,  y = capH·t
    //   tangential    (Bezier):  r = r0 + (r1−r0)·t²,           y = capH·(2t − t²)
    //   — the Bezier form is the quadratic curve in (r, y) with control
    //   points (r0,0), (r0,capH), (r1,capH); tangent is vertical at the
    //   trunk top and horizontal at the rim plane.
    const f  = tangentialFlare ? t * t : Math.pow(t, flareExp);
    const yFrac = tangentialFlare ? t * (2 - t) : t;
    const rA_pos = r0 + (r1Val    - r0) * f;
    const rA_neg = r0 + (r1NegVal - r0) * f;
    const rB     = r0 + (r2Val    - r0) * f;
    const y  = yBase + capH * yFrac;
    const ptK = rimPointiness * t;
    if (geometricShear) {
      // Lift at the +X tip = shearPos · rA_pos · t; at −X tip = shearNeg · rA_neg · t.
      rings.push(makeRing(rA_pos, rA_neg, rB, y, shearPos * rA_pos * t, shearNeg * rA_neg * t, ptK, shearProfile));
    } else {
      rings.push(makeRing(rA_pos, rA_neg, rB, y, 0, 0, ptK, shearProfile));
    }
  }
  const capital = NurbsSurface.loft(rings, 3);

  // ── Per-vertex transform: origin offset + (in non-geometric mode) shear ──
  // Shear ramps from 0 at the trunk top to full at the rim, so the trunk
  // stays vertical and only the capital portion tilts. In geometricShear mode
  // the surface is already sheared, so we skip the render-time shear.
  const apply = (mx: number, my: number, mz: number): Vec3 => {
    if (geometricShear) {
      return new Vec3(origin.x + mx, origin.y + my, origin.z + mz);
    }
    const t = Math.max(0, Math.min(1, (my - yBase) / capH));
    const shift = (mx >= 0 ? shearPos : -shearNeg) * mx * t;
    return new Vec3(origin.x + mx, origin.y + my + shift, origin.z + mz);
  };

  const lines: ColumnLine[] = [];
  const points: ColumnPoint[] = [];

  // ── Equal-X-style v-list helper ─────────────────────────────────────────
  // Build vQ1ByK[0…Nq] for an arbitrary per-quadrant resolution Nq. The
  // endpoints are pinned: k=0 → X=0, v=0.25; k=Nq → X=r1, v=0. Interior X
  // values follow the active isoMode.
  //
  // The arc-length lookup table is built once (it depends only on the rim,
  // not on Nq) and reused for both calls below.
  let vForArc: ((s: number) => number) | null = null;
  let arcTotal = 0;
  if (isoMode === "equalArc") {
    const RS = 240;
    const vs: number[] = new Array(RS + 1);
    const cum: number[] = new Array(RS + 1);
    vs[0] = 0;
    cum[0] = 0;
    let prev = capital.getPoint(1, 0);
    for (let i = 1; i <= RS; i++) {
      vs[i] = (i / RS) * 0.25;
      const pt = capital.getPoint(1, vs[i]);
      cum[i] = cum[i - 1] + pt.distTo(prev);
      prev = pt;
    }
    arcTotal = cum[RS];
    vForArc = (s: number): number => {
      if (s <= 0) return 0;
      if (s >= arcTotal) return 0.25;
      let lo = 0, hi = RS;
      while (lo < hi - 1) {
        const m = (lo + hi) >> 1;
        if (cum[m] < s) lo = m; else hi = m;
      }
      const seg = cum[hi] - cum[lo];
      const a = seg > 1e-9 ? (s - cum[lo]) / seg : 0;
      return vs[lo] + (vs[hi] - vs[lo]) * a;
    };
  }

  function buildVQ1ByK(Nq: number): number[] {
    const arr: number[] = new Array(Nq + 1);
    arr[0] = 0.25;
    arr[Nq] = 0;
    for (let k = 1; k < Nq; k++) {
      if (isoMode === "equalArc" && vForArc) {
        arr[k] = vForArc(arcTotal * (Nq - k) / Nq);
      } else if (isoMode === "equalAngle") {
        arr[k] = vForRimX(capital, r1Val * Math.sin(k * Math.PI / (2 * Nq)));
      } else if (isoMode === "equalX") {
        arr[k] = vForRimX(capital, r1Val * k / Nq);
      }
    }
    return arr;
  }

  // Resolutions (per-quadrant):
  //   Niso  — isocurve count, driven by isoCount / 4
  //   Nseed — plane-march seed count, driven by seedCount
  //
  // The principal-curve SEEDS are drawn FROM the isocurve v-list (not from a
  // separate table) — every seed coincides with an isocurve at the rim, and
  // every hop target is also an isocurve v-position. So the orange dots
  // always land on blue lines regardless of the Nseed/Niso ratio.
  const Niso  = Math.max(2, Math.floor(isoCount / 4));
  const Nseed = Math.max(1, Math.min(Niso, seedCount));   // ≤ Niso so we can sample
  const vIsoByK = buildVQ1ByK(Niso);
  // Map a seed index s ∈ [0, Nseed) to an iso index k ∈ [0, Niso−1].
  // Spread the Nseed seeds uniformly across the Niso iso positions; when
  // Nseed == Niso this reduces to k = s (one seed per iso position).
  const seedToIso = (s: number): number =>
    Math.min(Niso - 1, Math.round(s * Niso / Math.max(1, Nseed)));

  // ── Build the isocurve v-list ────────────────────────────────────────────
  type IsoEntry = { v: number; principal: "long" | "short" | "none" };
  const vList: IsoEntry[] = [];
  if (isoMode === "uniform") {
    const M = isoCount;
    for (let k = 0; k < M; k++) {
      const v = k / M;
      const onLong  = M % 2 === 0 && (k === 0 || k === M / 2);
      const onShort = M % 4 === 0 && (k === M / 4 || k === 3 * M / 4);
      vList.push({ v, principal: onLong ? "long" : onShort ? "short" : "none" });
    }
  } else {
    // Isocurves use vIsoByK (Niso entries) — independent of plane-march seeds.
    for (let k = 0; k <= Niso; k++) {
      if (k === 0) {
        vList.push({ v: 0.25, principal: "short" });
        vList.push({ v: 0.75, principal: "short" });
      } else if (k === Niso) {
        vList.push({ v: 0,    principal: "long" });
        vList.push({ v: 0.5,  principal: "long" });
      } else {
        const vQ1 = vIsoByK[k];
        vList.push({ v: vQ1,         principal: "none" });
        vList.push({ v: 0.5 - vQ1,   principal: "none" });
        vList.push({ v: 0.5 + vQ1,   principal: "none" });
        vList.push({ v: 1 - vQ1,     principal: "none" });
      }
    }
  }

  // ── Isocurves (with optional trunk extension) ───────────────────────────
  if (showIsocurves) {
    for (const iso of vList) {
      const pts: Vec3[] = [];
      if (showTrunkExtensions) {
        const pBase = capital.getPoint(0, iso.v);
        pts.push(apply(pBase.x, 0, pBase.z));
      }
      for (let i = 0; i <= isoSamples; i++) {
        const p = capital.getPoint(i / isoSamples, iso.v);
        pts.push(apply(p.x, p.y, p.z));
      }
      const color = iso.principal === "long"  ? "#ffffff"
                  : iso.principal === "short" ? "#9ad8ff"
                                              : "#5a78a8";
      lines.push({ points: pts, color, thickness: lineThickness });
    }
  }

  // ── Top rim (closing ellipse / lens) ────────────────────────────────────
  // Sample per quadrant so the multiplicity-2 knots at v=0.25/0.5/0.75 are
  // exact vertices in the polyline — under positive rimPointiness those are
  // cusps and chord interpolation across them would round the corner off.
  if (showTopRim) {
    const pts: Vec3[] = [];
    const perQuad = Math.max(8, Math.floor(rimSamples / 4));
    const knots = [0, 0.25, 0.5, 0.75, 1];
    for (let q = 0; q < 4; q++) {
      const v0 = knots[q], v1 = knots[q + 1];
      const n = q === 3 ? perQuad : perQuad;
      const last = q === 3 ? n : n - 1; // include final endpoint only on last quadrant
      for (let i = 0; i <= last; i++) {
        const v = v0 + (v1 - v0) * (i / n);
        const p = capital.getPoint(1, v);
        pts.push(apply(p.x, p.y, p.z));
      }
    }
    lines.push({ points: pts, color: "#ffd166", thickness: lineThickness });
  }

  // ── Principal curves ────────────────────────────────────────────────────
  // Wrapped in a function so we can run it once (current default — Q1 with
  // 4-mirror) or twice (geometricShear: Q1 + Q2-mirrored-in-v, each with
  // Z-only 2-mirror). The marching itself uses the surface's actual geometry,
  // so in geometricShear mode it sees the asymmetrically sheared surface and
  // produces true principal curves on the sheared shape.
  type EmitFn = (
    src: Vec3[], color: string,
    apply: (mx: number, my: number, mz: number) => Vec3,
    lines: ColumnLine[], points: ColumnPoint[],
    thickness?: number,
  ) => void;
  const runPrincipalCurves = (
    mapV: (v: number) => number,
    emitFn: EmitFn,
  ): void => {
    const longAxisV = mapV(0);                 // 0 for +X, 0.5 for −X
    const xSign     = mapV(0) < 0.25 ? 1 : -1; // surface x-sign on long axis
    let uLow = Infinity;

    // Upper fan: seeds at rim positions equally distributed by X (in the half).
    if (showUpperFan) {
      for (let s = 0; s < Nseed; s++) {
        const kSeed = seedToIso(s);
        const vRim = mapV(vIsoByK[kSeed]);
        const targets: number[] = [];
        for (let kp = kSeed + 1; kp <= Niso; kp++) targets.push(mapV(vIsoByK[kp]));
        const res = marchFn(capital, vRim, targets, 1);
        if (res.points.length < 2) continue;
        if (Math.abs(res.finalV - longAxisV) < 1e-6) uLow = Math.min(uLow, res.finalU);

        const t = Nseed === 1 ? 0 : s / (Nseed - 1);
        const R = Math.round(255 - 60 * t);
        const G = Math.round(170 - 40 * t);
        const B = Math.round(100 + 100 * t);
        emitFn(res.points, `rgb(${R},${G},${B})`, apply, lines, points, lineThickness);
      }
    }

    // Secondary fan(s). Both flags can be on — they're drawn one after the
    // other so the short-axis + long-axis fans fill the inner column from
    // opposite seeding sides and cover the gap one alone would leave near
    // the trunk.
    if (showSecondaryFan && secondaryFromShortAxis) {
        // Distribute N seeds by equal arc length along the v=0.25 (X=0 short
        // axis) isocurve, then march a principal-curve line from each.
        // Seeds at arc = k · arcTotal / (N+1) for k = 1…N — that's N evenly
        // spaced positions strictly between the trunk seam (arc=0) and the
        // rim (arc=arcTotal). Every interior gap is arcTotal/(N+1); the gap
        // to either endpoint is the same.
        const downTargets: number[] = [];
        for (let kp = 1; kp <= Niso; kp++) downTargets.push(mapV(vIsoByK[kp]));

        // Cumulative arc-length table along v=0.25.
        const AS = 120;
        const arcUs: number[] = new Array(AS + 1);
        const arcCum: number[] = new Array(AS + 1);
        arcUs[0] = 0;
        arcCum[0] = 0;
        let prevArcP = capital.getPoint(0, 0.25);
        for (let i = 1; i <= AS; i++) {
          arcUs[i] = i / AS;
          const p = capital.getPoint(arcUs[i], 0.25);
          arcCum[i] = arcCum[i - 1] + p.distTo(prevArcP);
          prevArcP = p;
        }
        const arcTotal = arcCum[AS];
        const N = secondaryShortAxisCount;

        for (let k = 1; k <= N; k++) {
          const arcNew = (k / (N + 1)) * arcTotal;
          // Look up u for this cumulative arc length.
          let lo = 0, hi = AS;
          while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (arcCum[mid] < arcNew) lo = mid;
            else hi = mid;
          }
          const seg = arcCum[hi] - arcCum[lo];
          const alpha = seg > 1e-9 ? (arcNew - arcCum[lo]) / seg : 0;
          const uSeed = arcUs[lo] + (arcUs[hi] - arcUs[lo]) * alpha;
          const res = marchFn(capital, 0.25, downTargets, uSeed);
          if (res.points.length < 2) continue;

          // Colour ramp: k=1 (closest to trunk) → cool; k=N (closest to rim) → warmer.
          const tt = N === 1 ? 0 : (k - 1) / (N - 1);
          const Rc = Math.round(120 + 80 * tt);
          const Gc = Math.round(170 - 30 * tt);
          const Bc = Math.round(200 - 30 * tt);
          emitFn(res.points, `rgb(${Rc},${Gc},${Bc})`, apply, lines, points, lineThickness);
        }

        if (showBottomCurve) {
          const resB = marchFn(capital, 0.25, downTargets, 0);
          if (resB.points.length >= 2) {
            emitFn(resB.points, "rgb(180,130,200)", apply, lines, points, lineThickness);
          }
        }
    }
    if (showSecondaryFan && secondaryFromLongAxis && Number.isFinite(uLow) && uLow > 1e-3) {
      {
        // Long-axis seeding: seeds on v = longAxisV, march toward v=0.25.
        const Xspacing = r1Val / (2 * Nseed * secondaryDensity);
        const Xlow_abs = Math.abs(capital.getPoint(uLow, longAxisV).x);
        const upTargets: number[] = [];
        for (let kp = Niso - 1; kp >= 0; kp--) upTargets.push(mapV(vIsoByK[kp]));

        const startMult = skipTopSecondary ? 2 : 1;
        let stepIndex = startMult;
        for (let Xabs = Xlow_abs - startMult * Xspacing;
             Xabs > r0 + 1e-6;
             Xabs -= Xspacing, stepIndex++) {
          let lo = 0, hi = 1;
          for (let it = 0; it < 32; it++) {
            const mid = 0.5 * (lo + hi);
            const xAbs = Math.abs(capital.getPoint(mid, longAxisV).x);
            if (xAbs < Xabs) lo = mid;
            else hi = mid;
            if (hi - lo < 1e-8) break;
          }
          const uSeed = 0.5 * (lo + hi);
          const res = marchFn(capital, longAxisV, upTargets, uSeed);
          if (res.points.length < 2) continue;

          const tt = stepIndex / Math.max(1, Math.ceil((Xlow_abs - r0) / Xspacing));
          const Rc = Math.round(120 + 60 * tt);
          const Gc = Math.round(150 - 20 * tt);
          const Bc = 200;
          emitFn(res.points, `rgb(${Rc},${Gc},${Bc})`, apply, lines, points, lineThickness);
        }

        if (showBottomCurve) {
          const resB = marchFn(capital, longAxisV, upTargets, 0);
          if (resB.points.length >= 2) {
            emitFn(resB.points, "rgb(180,130,200)", apply, lines, points, lineThickness);
          }
        }
      }
    }

    // xSign isn't used directly above but documents the side; keep silenced.
    void xSign;
  };

  if (geometricShear) {
    runPrincipalCurves((v) => v, emit2MirrorZ);          // +X half
    runPrincipalCurves((v) => 0.5 - v, emit2MirrorZ);    // −X half (v mirrored across v=0.25)
  } else {
    runPrincipalCurves((v) => v, emit4Mirror);            // single pass, X-mirror works
  }

  return { lines, points };
}

// ─── Internal helpers ───────────────────────────────────────────────────────

const SQ = Math.SQRT1_2;
const RING_KNOTS    = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4];
const RING_WEIGHTS  = [1, SQ, 1, SQ, 1, SQ, 1, SQ, 1];

/**
 * 9-control-point rational quadratic NURBS ellipse / circle in the XZ plane.
 * dyPos / dyNeg optionally lift the +X-side and −X-side control points so
 * the rim can be tilted independently per half (used by the geometric-shear
 * path).
 */
function makeRing(
  r1Pos: number,
  r1Neg: number,
  r2: number,
  y: number,
  dyPos: number = 0,
  dyNeg: number = 0,
  pointiness: number = 0,
  shearProfile: "linear" | "parabolicPeak" = "linear",
): NurbsCurve {
  // Asymmetric 9-CP rational-quadratic lens. r1Pos / r1Neg are the +X /
  // −X long-axis extents (both positive distances). When equal, the curve
  // is the standard symmetric ellipse / lens.
  const k    = Math.max(0, Math.min(1, pointiness));
  const r1pd = r1Pos * (1 - 0.5 * k);
  const r1nd = r1Neg * (1 - 0.5 * k);
  const wDiag = (1 - k) * SQ + k * 1;
  const weights = [1, wDiag, 1, wDiag, 1, wDiag, 1, wDiag, 1];

  // Shear: lift profile across X. Two modes:
  //   "linear"        — `lift(x) = (x/r1)·dy`, slope is constant.
  //   "parabolicPeak" — `lift(x) = −dy/r1²·x² + 2·dy/r1·x`, parabola with
  //     peak at the tip (slope=0 at x=±r1, slope=2·dy/r1 at x=0). Lets
  //     adjacent columns meeting at the same point join with matching
  //     horizontal tangents.
  const lift = (x: number): number => {
    if (shearProfile === "parabolicPeak") {
      if (x >= 0) return (-dyPos / (r1Pos * r1Pos)) * x * x + (2 * dyPos / r1Pos) * x;
      return (-dyNeg / (r1Neg * r1Neg)) * x * x + (-2 * dyNeg / r1Neg) * x;
    }
    return x >= 0 ? (x / r1Pos) * dyPos : (-x / r1Neg) * dyNeg;
  };

  const xs = [ r1Pos,  r1pd, 0,  -r1nd, -r1Neg, -r1nd,  0,  r1pd, r1Pos ];
  const zs = [ 0,      r2,   r2,  r2,    0,     -r2,   -r2, -r2,   0    ];
  const pts = xs.map((x, i) => new Vec3(x, y + lift(x), zs[i]));

  return new NurbsCurve(pts, 2, RING_KNOTS, weights);
}

/** Bisect for v on the surface's top rim (u=1) such that the x-coord equals Xtarget. */
function vForRimX(surf: NurbsSurface, Xtarget: number, vMin = 0, vMax = 0.25): number {
  let lo = vMin, hi = vMax;
  for (let it = 0; it < 40; it++) {
    const mid = 0.5 * (lo + hi);
    if (surf.getPoint(1, mid).x > Xtarget) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-8) break;
  }
  return 0.5 * (lo + hi);
}

/** Plane-march step: find u on iso-v at vTarget where (Q(u) − P) · T = 0. */
function planeMarchStep(
  surf: NurbsSurface,
  P: Vec3,
  T: Vec3,
  vTarget: number,
  initialSamples: number = 60,
): { p: Vec3; u: number } | null {
  const fAt = (u: number) => surf.getPoint(u, vTarget).sub(P).dot(T);
  let prevU = 0;
  let prevF = fAt(0);
  for (let i = 1; i <= initialSamples; i++) {
    const u = i / initialSamples;
    const f = fAt(u);
    if (prevF * f <= 0) {
      let lo = prevU, hi = u, loF = prevF;
      for (let iter = 0; iter < 30; iter++) {
        const mid = 0.5 * (lo + hi);
        const midF = fAt(mid);
        if (loF * midF <= 0) { hi = mid; }
        else { lo = mid; loF = midF; }
        if (hi - lo < 1e-6) break;
      }
      const uF = 0.5 * (lo + hi);
      return { p: surf.getPoint(uF, vTarget), u: uF };
    }
    prevU = u;
    prevF = f;
  }
  return null;
}

/**
 * Closest point on iso-v (curve at fixed v) to the given point P.
 * Solves (Q(u) − P) · Q'(u) = 0 by coarse sampling + bracketed refinement.
 */
function closestPointOnIsoV(
  surf: NurbsSurface,
  vTarget: number,
  P: Vec3,
  samples: number = 60,
): { p: Vec3; u: number } {
  let bestU = 0;
  let bestD = Infinity;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const d = surf.getPoint(u, vTarget).sub(P).lenSq();
    if (d < bestD) { bestD = d; bestU = u; }
  }
  // Refine on the bracket around bestU using the sign of d/du |Q − P|²:
  //   d/du = 2 · (Q − P) · Q'(u)
  let lo = Math.max(0, bestU - 1 / samples);
  let hi = Math.min(1, bestU + 1 / samples);
  const eps = 1e-4;
  for (let it = 0; it < 30; it++) {
    const mid = 0.5 * (lo + hi);
    const um = Math.max(0, mid - eps);
    const up = Math.min(1, mid + eps);
    const dm = surf.getPoint(um, vTarget).sub(P).lenSq();
    const dp = surf.getPoint(up, vTarget).sub(P).lenSq();
    if (dp > dm) hi = mid; else lo = mid;
    if (hi - lo < 1e-6) break;
  }
  const uF = 0.5 * (lo + hi);
  return { p: surf.getPoint(uF, vTarget), u: uF };
}

/**
 * "Closest-point" march: from a seed at (uStart, vSeed), step to the closest
 * point on each successive iso-v target. Same return shape as
 * planeMarchThroughVs so callers can swap freely.
 */
function marchByClosestPoint(
  surf: NurbsSurface,
  vSeed: number,
  vTargets: number[],
  uStart: number = 1,
): { points: Vec3[]; finalU: number; finalV: number } {
  const out: Vec3[] = [];
  let u = uStart;
  let v = vSeed;
  let P = surf.getPoint(u, v);
  out.push(P);
  for (const vNext of vTargets) {
    const r = closestPointOnIsoV(surf, vNext, P);
    P = r.p;
    u = r.u;
    v = vNext;
    out.push(P);
  }
  return { points: out, finalU: u, finalV: v };
}

/** Plane-march from (uStart, vSeed) through an explicit list of v-targets. */
function planeMarchThroughVs(
  surf: NurbsSurface,
  vSeed: number,
  vTargets: number[],
  uStart: number = 1,
): { points: Vec3[]; finalU: number; finalV: number } {
  const out: Vec3[] = [];
  let u = uStart;
  let v = vSeed;
  let P = surf.getPoint(u, v);
  out.push(P);
  const h = 1.5e-3;
  for (const vNext of vTargets) {
    const uA = Math.max(h, Math.min(1 - h, u));
    const T = surf.getPoint(uA + h, v).sub(surf.getPoint(uA - h, v)).normalize();
    const r = planeMarchStep(surf, P, T, vNext);
    if (!r) break;
    P = r.p;
    u = r.u;
    v = vNext;
    out.push(P);
  }
  return { points: out, finalU: u, finalV: v };
}

/** Emit a line and its dot markers across an arbitrary list of (sx, sz) mirrors. */
function emitMirrors(
  src: Vec3[],
  color: string,
  apply: (mx: number, my: number, mz: number) => Vec3,
  lines: ColumnLine[],
  points: ColumnPoint[],
  mirrors: Array<[number, number]>,
  thickness?: number,
): void {
  for (const [sx, sz] of mirrors) {
    const lineP: Vec3[] = src.map(p => apply(sx * p.x, p.y, sz * p.z));
    lines.push({ points: lineP, color, thickness });
    for (const p of lineP) points.push({ position: p, color, size: 0.025 });
  }
}

/** Default 4-fold dihedral mirror (used when the underlying surface is symmetric). */
function emit4Mirror(
  src: Vec3[],
  color: string,
  apply: (mx: number, my: number, mz: number) => Vec3,
  lines: ColumnLine[],
  points: ColumnPoint[],
  thickness?: number,
): void {
  emitMirrors(src, color, apply, lines, points, [[1, 1], [-1, 1], [-1, -1], [1, -1]], thickness);
}

/** Z-only 2-fold mirror (used when X-mirror is broken by asymmetric shear). */
function emit2MirrorZ(
  src: Vec3[],
  color: string,
  apply: (mx: number, my: number, mz: number) => Vec3,
  lines: ColumnLine[],
  points: ColumnPoint[],
  thickness?: number,
): void {
  emitMirrors(src, color, apply, lines, points, [[1, 1], [1, -1]], thickness);
}
