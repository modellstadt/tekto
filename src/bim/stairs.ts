// ====================================================================
// BIM / Stairs — parametric stair with landings (IfcStair + IfcStairFlight)
// ====================================================================
//
// A clean, self-contained stair element for the library. Given a start
// point, a travel direction, a floor-to-floor rise and a target riser
// height, it computes a code-sensible step count and emits the flights as
// solid step geometry (triangle soup, ready for IFC tessellation).
//
//   ✓ TYPE-INSTANCE  — `StairType` ↔ `IfcStairType`; reused across `Stair`s.
//   ✓ DECOMPOSITION  — a `Stair` owns one or two flights and the landing
//                      between them; at export the `IfcStair` aggregates
//                      the `IfcStairFlight`s and the `IfcSlab` LANDING.
//   ✓ PROPERTY SETS  — open `properties` map → `Pset_StairCommon`.
//   ✓ SLAB LINK      — `footprint()` is the plan outline, `slabOpening(slab)`
//                      the well the floor above needs over it.
//
// Shapes: a straight run (one flight), two straight runs in line, a quarter
// turn (L) and a half turn (U), each of the last three with one landing.
// Not yet: winders, spirals, railings, stringers.

import { Vec2, Vec3 } from "../core/math/vectors";
import { Polygon2D } from "../core/geometry/Polygon2D";
import { Slab, SlabOpening } from "./slabs/types";
import { joistDirectionFromBounds } from "./slabs/orientation";
import type { PropertyMap } from "./walls/types";

/** Overall stair shape — maps to `IfcStairTypeEnum`. `Stair` builds the first four; "spiral" and "not_defined" name a type only. */
export type StairShape =
  | "straight_run"
  | "two_straight_run"
  | "quarter_turn"
  | "half_turn"
  | "spiral"
  | "not_defined";

/** The shapes `Stair` has geometry for. */
const BUILT_SHAPES: readonly StairShape[] = ["straight_run", "two_straight_run", "quarter_turn", "half_turn"];

/** Options for `new StairType(...)`: name, overall shape (default "straight_run"), material, description and Psets. */
export interface StairTypeOptions {
  name: string;
  /** Overall shape. Default "straight_run". */
  shape?: StairShape;
  /** Tread / structure material, e.g. "Concrete", "Oak". */
  material?: string;
  description?: string;
  properties?: PropertyMap;
}

/** Reusable stair type — the IFC `IfcStairType` analogue. */
export class StairType {
  name: string;
  shape: StairShape;
  material?: string;
  description?: string;
  properties: PropertyMap;

  constructor(opts: StairTypeOptions) {
    this.name = opts.name;
    this.shape = opts.shape ?? "straight_run";
    this.material = opts.material;
    this.description = opts.description;
    this.properties = opts.properties ?? {};
  }
}

/**
 * One computed flight: solid step geometry as a triangle soup plus the
 * code metrics (riser/tread counts and dimensions). `positions` is a flat
 * [x,y,z, …] array in world coordinates; `indices` are 0-based triangles.
 */
export interface StairFlight {
  name: string;
  positions: number[];
  indices: number[];
  risers: number;
  treads: number;
  riserHeight: number;
  treadDepth: number;
}

/**
 * Options for `new Stair(...)`: from `start` (Z-up, metres) along `direction`, climbing `totalRise` in even
 * risers near `riserHeight` (default 0.18) with `treadDepth` goings (default 0.27); `shape` straight, two runs in
 * line, quarter turn (L) or half turn (U), the last three with a landing after riser `landingAfter`.
 */
export interface StairOptions {
  name?: string;
  /** Bottom of the stair: centre of the first flight's width at its first riser, at floor level. */
  start: Vec3;
  /** Horizontal travel direction of the first flight (need not be unit). Default +X. */
  direction?: Vec2;
  /** Flight width. Default 1.0 m. */
  width?: number;
  /** Floor-to-floor height the stair climbs. Required. */
  totalRise: number;
  /** Target riser height; the actual riser divides `totalRise` evenly. Default 0.18 m. */
  riserHeight?: number;
  /** Going (horizontal tread depth). Default 0.27 m. */
  treadDepth?: number;
  /**
   * Plan shape: "straight_run" (one flight), "two_straight_run" (two flights in line), "quarter_turn"
   * (L: the second flight leaves the landing sideways) or "half_turn" (U: the second flight runs back
   * beside the first). Default: the type's shape, else "straight_run".
   */
  shape?: StairShape;
  /** Which way a quarter or half turn turns, seen walking up the first flight. Default "left". */
  turn?: "left" | "right";
  /** The landing comes after this riser, the first flight's last. Default: half the risers, rounded up. */
  landingAfter?: number;
  /**
   * Length of the landing along the first flight. Default `width`. A quarter turn needs at least
   * `width`: the second flight leaves from its side, flush with its far edge.
   */
  landingDepth?: number;
  /** Thickness of the landing slab under its top. Default 0.2 m, at most down to the stair's base. */
  landingThickness?: number;
  /** Clear gap between the two flights of a half turn. Default 0.1 m. */
  gap?: number;
  type?: StairType;
  properties?: PropertyMap;
}

/** Options for `Stair.slabOpening`: the headroom to keep (default 2.0 m) and the opening's name. */
export interface StairOpeningOptions {
  /** Headroom over every tread and the landing, up to the slab's underside. Default 2.0 m; `Infinity` opens over the whole stair. */
  clearance?: number;
  /** Default: the stair's name + " well". */
  name?: string;
}

/** One flight in plan: the centre of its width at its first riser, where it goes, the level it climbs from. */
interface FlightRun {
  at: Vec2;
  dir: Vec2;
  z: number;
  risers: number;
}

/**
 * A stair — the IFC `IfcStair` analogue: one flight, or two with a landing between them (two in
 * line, a quarter turn, a half turn). A flight of n risers has n − 1 treads; its last riser arrives
 * at the landing or the floor above. Every step stands on the stair's base level, so the flights are
 * solid below. `flights()` and `landing()` give the geometry, `footprint()` the plan outline and
 * `slabOpening(slab)` the well the floor above needs; the IFC exporter and any renderer consume the
 * same structs.
 *
 *   const stair = new Stair({ start: new Vec3(1, 1, 0), totalRise: 2.8, shape: "half_turn" });
 *   floor.openings.push(stair.slabOpening(floor)!);
 */
export class Stair {
  name: string;
  start: Vec3;
  direction: Vec2;
  width: number;
  totalRise: number;
  riserHeight: number;
  treadDepth: number;
  shape: StairShape;
  turn: "left" | "right";
  /** The first flight's risers; undefined splits the risers evenly, the first flight taking an odd one. */
  landingAfter?: number;
  landingDepth: number;
  landingThickness: number;
  gap: number;
  type?: StairType;
  properties: PropertyMap;

  constructor(opts: StairOptions) {
    this.name = opts.name ?? "Stair";
    this.start = opts.start;
    this.direction = opts.direction ?? new Vec2(1, 0);
    this.width = opts.width ?? 1.0;
    this.totalRise = opts.totalRise;
    this.riserHeight = opts.riserHeight ?? 0.18;
    this.treadDepth = opts.treadDepth ?? 0.27;
    this.shape = opts.shape ?? opts.type?.shape ?? "straight_run";
    this.turn = opts.turn ?? "left";
    this.landingAfter = opts.landingAfter;
    this.landingDepth = opts.landingDepth ?? this.width;
    this.landingThickness = opts.landingThickness ?? 0.2;
    this.gap = opts.gap ?? 0.1;
    this.type = opts.type;
    this.properties = opts.properties ?? {};
    this.plan(); // throws now, naming the bad input, rather than at the first use
  }

  /** Number of risers, chosen so the actual riser is closest to the target. */
  get risers(): number {
    return Math.max(1, Math.round(this.totalRise / this.riserHeight));
  }
  /** Actual riser height (`totalRise` split evenly). */
  get actualRiser(): number {
    return this.totalRise / this.risers;
  }

  /**
   * Compute the flight geometry: one flight per run, each built as a
   * stepped solid. Tread i of a flight is a box spanning going
   * [i·tread, (i+1)·tread] across the full width, from the stair's base
   * level up to its walking surface, (i+1) risers above the flight's start.
   */
  flights(): StairFlight[] {
    const { runs } = this.plan();
    const riser = this.actualRiser;
    const tread = this.treadDepth;
    const halfW = this.width * 0.5;
    const z0 = this.start.z;

    return runs.map((run, k) => {
      // Local frame: along = run.dir, across = its left-hand perpendicular.
      const across = run.dir.perp();
      const positions: number[] = [];
      const indices: number[] = [];

      // World point from (along travel, across width, absolute z).
      const push = (along: number, side: number, z: number): number => {
        const p = run.at.add(run.dir.mul(along)).add(across.mul(side));
        positions.push(p.x, p.y, z);
        return positions.length / 3 - 1;
      };

      for (let i = 0; i < run.risers - 1; i++) {
        const a0 = i * tread;
        const a1 = (i + 1) * tread;
        const z1 = run.z + (i + 1) * riser;
        // 8 corners: front/back × left/right × bottom/top.
        const flb = push(a0, -halfW, z0), frb = push(a1, -halfW, z0);
        const blb = push(a0, +halfW, z0), brb = push(a1, +halfW, z0);
        const flt = push(a0, -halfW, z1), frt = push(a1, -halfW, z1);
        const blt = push(a0, +halfW, z1), brt = push(a1, +halfW, z1);
        pushBox(indices, flb, frb, brb, blb, flt, frt, brt, blt);
      }

      return {
        name: runs.length === 1 ? `${this.name} flight` : `${this.name} flight ${k + 1}`,
        positions,
        indices,
        risers: run.risers,
        treads: run.risers - 1,
        riserHeight: riser,
        treadDepth: tread,
      };
    });
  }

  /**
   * The landing between the two flights as a `Slab` (written as an `IfcSlab` LANDING): its top
   * `landingAfter` risers above the base, `landingThickness` thick, its plan the rectangle between the
   * flights (across both flights and the gap for a half turn). `null` for a straight run.
   */
  landing(): Slab | null {
    const { landing, landingTop } = this.plan();
    if (!landing) return null;
    return new Slab({
      boundary: Polygon2D.closeRing(landing),
      thickness: Math.min(this.landingThickness, landingTop - this.start.z),
      elevation: landingTop,
      name: `${this.name} landing`,
    });
  }

  /**
   * The stair's outline in plan: an open, counter-clockwise ring around the flights and the landing.
   * A half turn's gap between its flights counts as part of it.
   */
  footprint(): Vec2[] {
    return this.plan().footprint;
  }

  /**
   * The opening the slab above needs over this stair, as a `SlabOpening` for `slab.openings`: the
   * rectangle that covers every tread, and the landing, with less than `clearance` (default 2.0 m)
   * of headroom under the slab — measured vertically from the tread's top to the slab's underside
   * (`elevation − thickness`). The rectangle is laid out in the frame `slab.openingRings()` uses by
   * default (the slab's `joistDirection`, else the one its bounds suggest), so a stair not aligned
   * with that frame gets the bounds of those treads in it, larger than the flights. `null` when no
   * tread comes that close, as under a slab well above the stair.
   *
   *   floor.openings.push(stair.slabOpening(floor)!);
   */
  slabOpening(slab: Slab, opts: StairOpeningOptions = {}): SlabOpening | null {
    const clearance = opts.clearance ?? 2.0;
    if (!(clearance >= 0)) throw new Error(`Stair "${this.name}".slabOpening: clearance must be 0 or more, got ${clearance}.`);
    const { runs, landing, landingTop } = this.plan();
    const limit = slab.elevation - slab.thickness - clearance;   // a walking surface above this is too close
    const riser = this.actualRiser, tread = this.treadDepth, halfW = this.width * 0.5;

    const close: Vec2[] = [];
    for (const run of runs) {
      const across = run.dir.perp();
      for (let i = 0; i < run.risers - 1; i++) {
        if (run.z + (i + 1) * riser <= limit) continue;
        for (const a of [i * tread, (i + 1) * tread]) {
          for (const s of [-halfW, halfW]) close.push(run.at.add(run.dir.mul(a)).add(across.mul(s)));
        }
      }
    }
    if (landing && landingTop > limit) close.push(...landing);
    if (close.length === 0) return null;

    // The frame `Slab.openingRings()` lays openings out in by default.
    const u = (slab.joistDirection ?? joistDirectionFromBounds(slab.boundary)).normalize();
    const v = u.perp();
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const p of close) {
      const pu = p.dot(u), pv = p.dot(v);
      u0 = Math.min(u0, pu); u1 = Math.max(u1, pu);
      v0 = Math.min(v0, pv); v1 = Math.max(v1, pv);
    }
    const centre = u.mul((u0 + u1) / 2).add(v.mul((v0 + v1) / 2));
    return new SlabOpening(centre.x, centre.y, u1 - u0, v1 - v0, opts.name ?? `${this.name} well`);
  }

  /** The flights in plan, the landing between them and the outline, checking the inputs on the way. */
  private plan(): { runs: FlightRun[]; landing: Vec2[] | null; landingTop: number; footprint: Vec2[] } {
    const label = `Stair "${this.name}"`;
    const positive = (key: string, value: number) => {
      if (!(value > 0 && Number.isFinite(value))) throw new Error(`${label}: ${key} must be above 0, got ${value}.`);
    };
    positive("totalRise", this.totalRise);
    positive("width", this.width);
    positive("riserHeight", this.riserHeight);
    positive("treadDepth", this.treadDepth);
    if (!(Math.hypot(this.direction.x, this.direction.y) > 0)) {
      throw new Error(`${label}: direction must be a non-zero vector in plan, got ${this.direction}.`);
    }
    if (!BUILT_SHAPES.includes(this.shape)) {
      throw new Error(`${label}: shape "${this.shape}" has no geometry; use ${BUILT_SHAPES.map((s) => `"${s}"`).join(", ")}.`);
    }

    const risers = this.risers;
    const riser = this.actualRiser;
    const tread = this.treadDepth;
    const w = this.width;
    const halfW = w * 0.5;
    const u = this.direction.normalize();
    const s0 = new Vec2(this.start.x, this.start.y);
    const z0 = this.start.z;
    const ccw = (ring: Vec2[]) => {
      const clean = Polygon2D.simplify(ring, 1e-9);           // drops repeated and in-line corners
      return Polygon2D.isCCW(clean) ? clean : Polygon2D.reverse(clean);
    };

    if (this.shape === "straight_run") {
      const run = (risers - 1) * tread;
      const at = (along: number, across: number) => s0.add(u.mul(along)).add(u.perp().mul(across));
      return {
        runs: [{ at: s0, dir: u, z: z0, risers }],
        landing: null,
        landingTop: z0,
        footprint: ccw([at(0, -halfW), at(run, -halfW), at(run, halfW), at(0, halfW)]),
      };
    }

    positive("landingDepth", this.landingDepth);
    positive("landingThickness", this.landingThickness);
    if (!(this.gap >= 0 && Number.isFinite(this.gap))) throw new Error(`${label}: gap must be 0 or more, got ${this.gap}.`);
    if (this.turn !== "left" && this.turn !== "right") throw new Error(`${label}: turn must be "left" or "right", got "${this.turn}".`);
    if (risers < 2) {
      throw new Error(`${label}: a ${this.shape} stair needs 2 risers or more, one flight either side of its landing; totalRise ${this.totalRise} at riserHeight ${this.riserHeight} gives ${risers}.`);
    }
    const n1 = this.landingAfter ?? Math.ceil(risers / 2);
    if (!Number.isInteger(n1) || n1 < 1 || n1 > risers - 1) {
      throw new Error(`${label}: landingAfter must be a whole riser from 1 to ${risers - 1} (the stair has ${risers}), got ${n1}.`);
    }
    const depth = this.landingDepth;
    if (this.shape === "quarter_turn" && depth < w - 1e-9) {
      throw new Error(`${label}: a quarter-turn landing must be at least as deep as the flight is wide, for the second flight to leave from its side; landingDepth ${depth} < width ${w}.`);
    }

    const n2 = risers - n1;
    const run1 = (n1 - 1) * tread;                             // first flight, start to the landing
    const run2 = (n2 - 1) * tread;
    const far = run1 + depth;                                  // the landing's far edge
    const side = this.turn === "left" ? u.perp() : u.perp().neg();
    const at = (along: number, across: number) => s0.add(u.mul(along)).add(side.mul(across));
    const landingTop = z0 + n1 * riser;
    const first: FlightRun = { at: s0, dir: u, z: z0, risers: n1 };

    if (this.shape === "two_straight_run") {
      const length = far + run2;
      return {
        runs: [first, { at: at(far, 0), dir: u, z: landingTop, risers: n2 }],
        landing: ccw([at(run1, -halfW), at(far, -halfW), at(far, halfW), at(run1, halfW)]),
        landingTop,
        footprint: ccw([at(0, -halfW), at(length, -halfW), at(length, halfW), at(0, halfW)]),
      };
    }

    if (this.shape === "quarter_turn") {
      // The second flight leaves from the landing's side, flush with its far edge.
      const reach = halfW + run2;
      return {
        runs: [first, { at: at(far - halfW, halfW), dir: side, z: landingTop, risers: n2 }],
        landing: ccw([at(run1, -halfW), at(far, -halfW), at(far, halfW), at(run1, halfW)]),
        landingTop,
        footprint: ccw([
          at(0, -halfW), at(far, -halfW), at(far, reach), at(far - w, reach), at(far - w, halfW), at(0, halfW),
        ]),
      };
    }

    // Half turn: the second flight runs back beside the first, `gap` away; both meet the landing at
    // one line. The outline takes in the gap where the two flights run side by side.
    const outer = halfW + this.gap + w;
    const back = run1 - run2;                                  // where the second flight ends
    const outline = [at(0, -halfW), at(far, -halfW), at(far, outer), at(back, outer)];
    if (back > 0) outline.push(at(back, halfW), at(0, halfW));
    else if (back < 0) outline.push(at(back, halfW + this.gap), at(0, halfW + this.gap));
    return {
      runs: [first, { at: at(run1, outer - halfW), dir: u.neg(), z: landingTop, risers: n2 }],
      landing: ccw([at(run1, -halfW), at(far, -halfW), at(far, outer), at(run1, outer)]),
      landingTop,
      footprint: ccw(outline),
    };
  }
}

/**
 * Append the 12 triangles (6 quads) of a box to `indices`, given its 8
 * corner indices: bottom face flb,frb,brb,blb and top face flt,frt,brt,blt
 * (front/back along travel, left/right across width). Winding is outward.
 */
function pushBox(
  out: number[],
  flb: number, frb: number, brb: number, blb: number,
  flt: number, frt: number, brt: number, blt: number,
): void {
  const quad = (a: number, b: number, c: number, d: number) => {
    out.push(a, b, c, a, c, d);
  };
  quad(flb, blb, brb, frb); // bottom (−Z)
  quad(flt, frt, brt, blt); // top (+Z)
  quad(flb, frb, frt, flt); // front (−across side / +travel start) — left face
  quad(brb, blb, blt, brt); // back — right face
  quad(frb, brb, brt, frt); // +travel end
  quad(blb, flb, flt, blt); // −travel start
}
