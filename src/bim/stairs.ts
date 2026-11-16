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
// Structures: solid steps, a concrete waist slab, timber treads between
// stringers, a folded steel plate on flat stringers (`structure`).
// Not yet: winders, spirals, railings.

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

/**
 * How a stair is built — what its flights are made of and how much of them there is:
 * - "solid": every step a block down to the stair's base (the massing).
 * - "concrete": the steps on a sloping waist slab, 160 mm thick under the steps' inner corners.
 * - "timber": 50 mm treads between two 60 × 300 mm stringers, open risers, each tread 30 mm over
 *   the one below.
 * - "steel": an 8 mm plate folded into treads and risers, on two 12 × 200 mm flat stringers.
 */
export type StairStructure = "solid" | "concrete" | "timber" | "steel";

/** The structures `Stair` builds, and the landing thickness each defaults to (m). */
const STRUCTURES: Record<StairStructure, { landing: number }> = {
  solid: { landing: 0.2 }, concrete: { landing: 0.2 }, timber: { landing: 0.12 }, steel: { landing: 0.08 },
};

/**
 * One part of a flight as its side profile: `outline` in the flight's own plane — x along the
 * flight from its first riser, y the absolute height — swept across the flight from `across[0]`
 * to `across[1]` (from the centre of its width, positive to the left walking up). What a section
 * along the flight cuts, or an elevation from its side sees.
 */
export interface StairPart {
  /** "step" (solid), "flight" (concrete), "stringer", "tread", "plate". */
  name: "step" | "flight" | "stringer" | "tread" | "plate";
  outline: Vec2[];
  across: [number, number];
}

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
  /** Thickness of the landing slab under its top. Default by `structure`: 0.2 m (solid, concrete), 0.12 (timber), 0.08 (steel); at most down to the stair's base. */
  landingThickness?: number;
  /** How the flights are built: "solid" blocks (default), a "concrete" waist slab, "timber" treads between stringers, a folded "steel" plate. */
  structure?: StairStructure;
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
  structure: StairStructure;
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
    this.structure = opts.structure ?? "solid";
    if (!STRUCTURES[this.structure]) throw new Error(`Stair "${this.name}": structure must be ${Object.keys(STRUCTURES).map((k) => `"${k}"`).join(", ")}, got "${this.structure}".`);
    this.landingThickness = opts.landingThickness ?? STRUCTURES[this.structure].landing;
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
   * The flights' geometry, one closed solid per flight in world coordinates, built as
   * `structure` says from the parts `parts()` describes, with the code metrics. Tread i of a
   * flight spans going [i·tread, (i+1)·tread], (i+1) risers above the flight's start.
   */
  flights(): StairFlight[] {
    const { runs } = this.plan();
    const riser = this.actualRiser;
    const tread = this.treadDepth;
    return runs.map((run, k) => {
      // Local frame: along = run.dir, across = its left-hand perpendicular.
      const across = run.dir.perp();
      const positions: number[] = [];
      const indices: number[] = [];
      for (const part of this.flightParts(run, k)) {
        prism(part, (along, side, z) => {
          const p = run.at.add(run.dir.mul(along)).add(across.mul(side));
          positions.push(p.x, p.y, z);
          return positions.length / 3 - 1;
        }, indices);
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
   * Each flight's parts as side profiles: where the flight starts and runs in plan (`at`, the
   * centre of its width at its first riser; `dir`, a unit vector) and the parts `structure`
   * builds it from. Draw `outline`s for a section along a flight or an elevation from its side:
   * a point (x, y) of an outline is at `at + dir·x`, height y.
   */
  parts(): { at: Vec2; dir: Vec2; parts: StairPart[] }[] {
    return this.plan().runs.map((run, k) => ({ at: run.at, dir: run.dir, parts: this.flightParts(run, k) }));
  }

  /** One flight's parts, as `structure` builds it. */
  private flightParts(run: FlightRun, k: number): StairPart[] {
    const WAIST = 0.16;                                     // concrete: under the steps' inner corners
    const TIMBER = { stringer: 0.06, depth: 0.3, above: 0.05, tread: 0.05, nosing: 0.03 };
    const STEEL = { plate: 0.008, stringer: 0.012, depth: 0.2 };
    const r = this.actualRiser, g = this.treadDepth, halfW = this.width * 0.5;
    const n = run.risers, z0 = run.z, top = z0 + n * r, L = (n - 1) * g;
    // The flight rests on the stair's base, or on the landing below it (down to the landing's underside).
    const base = k === 0 ? this.start.z : Math.max(this.start.z, z0 - this.landingThickness);
    const cos = g / Math.hypot(g, r);                       // of the pitch
    const corner = (a: number) => z0 + (a * r) / g;         // the line through the steps' inner corners
    const full: [number, number] = [-halfW, halfW];
    const out: StairPart[] = [];
    // The stepped line: up the first riser, along each tread, up the last riser to the arrival.
    const steps = (dx = 0, dz = 0): Vec2[] => {
      const pts: Vec2[] = [];
      for (let i = 0; i < n; i++) pts.push(new Vec2(i * g + dx, z0 + i * r + dz), new Vec2(i * g + dx, z0 + (i + 1) * r + dz));
      return pts;
    };
    // A band parallel to the pitch, `from`..`to` above the inner-corner line, cut level at the
    // base and the arrival and plumb at the last riser.
    const band = (from: number, to: number, plumbStart = false): Vec2[] => {
      const X = L + 2 * (top - base) * (g / r) + 1;          // far enough to be cut on both sides
      let ring = [new Vec2(-X, corner(-X) + from), new Vec2(L, corner(L) + from), new Vec2(L, corner(L) + to), new Vec2(-X, corner(-X) + to)];
      ring = clip(ring, (p) => p.y - base);
      ring = clip(ring, (p) => top - p.y);
      if (plumbStart) ring = clip(ring, (p) => p.x);
      return ring;
    };

    switch (this.structure) {
      case "solid":
        for (let i = 0; i < n - 1; i++) {
          const a0 = i * g, a1 = (i + 1) * g, z1 = z0 + (i + 1) * r;
          out.push({ name: "step", outline: [new Vec2(a0, this.start.z), new Vec2(a1, this.start.z), new Vec2(a1, z1), new Vec2(a0, z1)], across: full });
        }
        break;
      case "concrete": {
        const soffit = -WAIST / cos;
        let ring = [...steps(), new Vec2(L, corner(L) + soffit), new Vec2(-L - 10, corner(-L - 10) + soffit)];
        ring = clip(clip(clip(ring, (p) => p.y - base), (p) => p.x), (p) => top - p.y);
        out.push({ name: "flight", outline: ring, across: full });
        break;
      }
      case "timber": {
        const t = TIMBER, depth = t.depth / cos;
        // The stringers' top edge runs `above` over the nosings, which are one riser over the corner line.
        const upper = r + t.above / cos;
        for (const side of [-1, 1]) {
          const s0 = side < 0 ? -halfW : halfW - t.stringer;
          out.push({ name: "stringer", outline: band(upper - depth, upper), across: [s0, s0 + t.stringer] });
        }
        for (let i = 0; i < n - 1; i++) {
          const z1 = z0 + (i + 1) * r, a0 = i * g - t.nosing, a1 = (i + 1) * g;
          out.push({ name: "tread", outline: [new Vec2(a0, z1 - t.tread), new Vec2(a1, z1 - t.tread), new Vec2(a1, z1), new Vec2(a0, z1)], across: [-halfW + t.stringer, halfW - t.stringer] });
        }
        break;
      }
      case "steel": {
        const t = STEEL;
        // The plate: the stepped line and its offset `plate` inside (behind each riser, under each tread).
        const outer = steps();
        const inner: Vec2[] = [];
        for (let i = 0; i < n; i++) {
          inner.push(new Vec2(i * g + t.plate, z0 + i * r - (i === 0 ? 0 : t.plate)), new Vec2(i * g + t.plate, z0 + (i + 1) * r - (i === n - 1 ? 0 : t.plate)));
        }
        out.push({ name: "plate", outline: [...outer, ...inner.reverse()], across: full });
        const under = -t.plate / cos;
        for (const side of [-1, 1]) {
          const s0 = side < 0 ? -halfW : halfW - t.stringer;
          out.push({ name: "stringer", outline: band(under - t.depth / cos, under, true), across: [s0, s0 + t.stringer] });
        }
        break;
      }
    }
    return out.map((p) => ({ ...p, outline: tidy(p.outline) })).filter((p) => p.outline.length >= 3);
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

/** The ring's part where `f(p) ≥ 0` (Sutherland–Hodgman against one half-plane, `f` linear). */
function clip(ring: Vec2[], f: (p: Vec2) => number): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) out.push(a.add(b.sub(a).mul(fa / (fa - fb))));
  }
  return out;
}

/** The ring counter-clockwise, without repeated points or points on a straight line. */
function tidy(ring: Vec2[]): Vec2[] {
  const EPS = 1e-9;
  let pts = ring.filter((p, i) => p.sub(ring[(i + 1) % ring.length]).len() > EPS);
  let changed = true;
  while (changed && pts.length >= 3) {
    changed = false;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
      if (Math.abs(Polygon2D.cross2D(a, b, c)) < EPS) { pts = pts.filter((_, j) => j !== i); changed = true; break; }
    }
  }
  return Polygon2D.signedArea(pts) < 0 ? pts.reverse() : pts;
}

/**
 * A part as a closed solid: its outline (counter-clockwise, x along, y height) at both
 * `across` ends, and a quad for each edge. `at(along, across, z)` adds a vertex and returns its index.
 */
function prism(part: StairPart, at: (along: number, side: number, z: number) => number, out: number[]): void {
  const ring = part.outline, [s0, s1] = part.across, n = ring.length;
  const near = ring.map((p) => at(p.x, s0, p.y));
  const far = ring.map((p) => at(p.x, s1, p.y));
  // (along, across, up) is right-handed, so a ring counter-clockwise in (along, up) faces −across.
  for (const [a, b, c] of Polygon2D.triangulate2D(ring)) {
    out.push(near[a], near[b], near[c]);
    out.push(far[a], far[c], far[b]);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    out.push(near[i], far[i], far[j], near[i], far[j], near[j]);
  }
}
