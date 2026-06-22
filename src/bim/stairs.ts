// ====================================================================
// BIM / Stairs — parametric straight-run stair (IfcStair + IfcStairFlight)
// ====================================================================
//
// A clean, self-contained stair element for the library. Given a start
// point, a travel direction, a floor-to-floor rise and a target riser
// height, it computes a code-sensible step count and emits the flight as
// solid step geometry (triangle soup, ready for IFC tessellation).
//
//   ✓ TYPE-INSTANCE  — `StairType` ↔ `IfcStairType`; reused across `Stair`s.
//   ✓ DECOMPOSITION  — a `Stair` owns one or more flights; at export the
//                      `IfcStair` aggregates `IfcStairFlight`s (and, later,
//                      `IfcSlab` landings + `IfcRailing`s).
//   ✓ PROPERTY SETS  — open `properties` map → `Pset_StairCommon`.
//
// Scope: this is a single STRAIGHT_RUN flight — the cleanest reusable
// primitive. L-/U-shaped stairs (multiple flights + half-landings) and the
// bottom-up app's free-running cell stair can both feed the same `Stair`
// export later by contributing more `StairFlight`s; nothing here needs to
// change for that.

import { Vec2, Vec3 } from "../core/math/vectors";
import type { PropertyMap } from "./walls/types";

/** Overall stair shape — maps to `IfcStairTypeEnum`. */
export type StairShape =
  | "straight_run"
  | "two_straight_run"
  | "quarter_turn"
  | "half_turn"
  | "spiral"
  | "not_defined";

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

export interface StairOptions {
  name?: string;
  /** Bottom of the stair: centre of the flight width at floor level. */
  start: Vec3;
  /** Horizontal travel direction (need not be unit). Default +X. */
  direction?: Vec2;
  /** Flight width. Default 1.0 m. */
  width?: number;
  /** Floor-to-floor height the flight climbs. Required. */
  totalRise: number;
  /** Target riser height; the actual riser divides `totalRise` evenly. Default 0.18 m. */
  riserHeight?: number;
  /** Going (horizontal tread depth). Default 0.27 m. */
  treadDepth?: number;
  type?: StairType;
  properties?: PropertyMap;
}

/**
 * A stair — the IFC `IfcStair` analogue. Holds the parameters and computes
 * its flight geometry on demand via `flights()`. Both the IFC exporter and
 * any renderer consume the same `StairFlight` structs.
 */
export class Stair {
  name: string;
  start: Vec3;
  direction: Vec2;
  width: number;
  totalRise: number;
  riserHeight: number;
  treadDepth: number;
  type?: StairType;
  properties: PropertyMap;

  constructor(opts: StairOptions) {
    if (!(opts.totalRise > 0)) throw new Error("Stair: totalRise must be > 0");
    this.name = opts.name ?? "Stair";
    this.start = opts.start;
    this.direction = opts.direction ?? new Vec2(1, 0);
    this.width = opts.width ?? 1.0;
    this.totalRise = opts.totalRise;
    this.riserHeight = opts.riserHeight ?? 0.18;
    this.treadDepth = opts.treadDepth ?? 0.27;
    this.type = opts.type;
    this.properties = opts.properties ?? {};
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
   * Compute the flight geometry. A straight run is a single flight built as
   * a stepped solid: step i is a box spanning going [i·tread, (i+1)·tread],
   * rising from the floor to (i+1)·riser, across the full width.
   */
  flights(): StairFlight[] {
    const risers = this.risers;
    const riser = this.actualRiser;
    const tread = this.treadDepth;

    // Local frame: u = travel (horizontal), across = left-hand perpendicular.
    const dLen = Math.hypot(this.direction.x, this.direction.y) || 1;
    const ux = this.direction.x / dLen;
    const uy = this.direction.y / dLen;
    const ax = -uy;
    const ay = ux;
    const halfW = this.width * 0.5;
    const sx = this.start.x, sy = this.start.y, sz = this.start.z;

    const positions: number[] = [];
    const indices: number[] = [];

    // World point from (along travel, across width, absolute z).
    const push = (along: number, across: number, z: number): number => {
      const x = sx + ux * along + ax * across;
      const y = sy + uy * along + ay * across;
      positions.push(x, y, z);
      return positions.length / 3 - 1;
    };

    for (let i = 0; i < risers; i++) {
      const a0 = i * tread;
      const a1 = (i + 1) * tread;
      const z0 = sz;
      const z1 = sz + (i + 1) * riser;
      // 8 corners: front/back × left/right × bottom/top.
      const flb = push(a0, -halfW, z0), frb = push(a1, -halfW, z0);
      const blb = push(a0, +halfW, z0), brb = push(a1, +halfW, z0);
      const flt = push(a0, -halfW, z1), frt = push(a1, -halfW, z1);
      const blt = push(a0, +halfW, z1), brt = push(a1, +halfW, z1);
      pushBox(indices, flb, frb, brb, blb, flt, frt, brt, blt);
    }

    return [{
      name: `${this.name} flight`,
      positions,
      indices,
      risers,
      treads: Math.max(0, risers - 1),
      riserHeight: riser,
      treadDepth: tread,
    }];
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
