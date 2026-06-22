// ====================================================================
// WALLS — BIM wrappers over ExtrudedRibbon + RibbonSystem
// ====================================================================
//
//   WallOpening  — door/window with sill/head heights (BIM-level).
//   Wall         — thin wrapper around ExtrudedRibbon adding name + openings.
//   WallSystem   — thin wrapper around RibbonSystem adding a parallel Wall list.
//
// The geometry is 100% delegated to the Ribbon stack — the same engine
// works at any scale. This file only adds BIM semantics.
//
// Ported from HDGEO C# (HDGEO.Core.BIM).

import { Vec2 } from "../math/vectors";
import { Mesh } from "./mesh/Mesh";
import {
  ExtrudedRibbon, RibbonOpening, newBuffers, finishMesh,
} from "./ExtrudedRibbon";
import { RibbonSystem } from "./RibbonSystem";
import type { WallType, PropertyMap, RealizedWall } from "../../bim/walls/types";
import { realizeSystem } from "../../bim/walls/types";
import { WallJoint } from "../../bim/walls/joints";
import type { OpeningType } from "../../bim/openings";

// ─── Wall openings (doors / windows) ────────────────────────────────

/**
 * A rectangular opening (door or window) in a wall, positioned along the
 * wall's centerline. The opening punches through the wall perpendicular
 * to the wall face, cutting both sides and generating reveal-jamb faces
 * that show the wall thickness.
 *
 * All dimensions are in model units (typically meters).
 * Heights are relative to the wall's `baseElevation` (NOT absolute Z).
 */
export class WallOpening {
  /**
   * Distance along the wall's centerline from the wall's start point to
   * the opening's center (arc-length along the polyline).
   */
  centerlinePosition: number;
  /** Width of the opening along the wall face. */
  width: number;
  /**
   * Height of the bottom of the opening above the wall's baseElevation.
   * Door → 0. Window → typically 0.8–1.0 m.
   */
  sillHeight: number;
  /**
   * Height of the top of the opening above the wall's baseElevation.
   * Standard door → 2.1 m. Window → typically 2.0–2.2 m.
   * Must be > sillHeight and ≤ wall.height.
   */
  headHeight: number;
  /** Optional label (e.g. "D1", "W3"). */
  name?: string;
  /**
   * Optional reusable door/window type (IFC `IfcDoorType` / `IfcWindowType`
   * analogue). When set, the IFC exporter links the door/window to the type
   * and writes its operation + common Pset. See `src/bim/openings.ts`.
   */
  type?: OpeningType;
  /** Instance-level Pset overrides, merged on top of `type.properties`. */
  properties?: PropertyMap;

  constructor(centerlinePosition: number, width = 0.9, sillHeight = 0, headHeight = 2.1, name?: string) {
    this.centerlinePosition = centerlinePosition;
    this.width = width;
    this.sillHeight = sillHeight;
    this.headHeight = headHeight;
    this.name = name;
  }

  /** True if sillHeight is effectively zero (door-type opening). */
  get isDoor(): boolean { return this.sillHeight <= 0.001; }

  static door(centerlinePosition: number, width = 0.9, headHeight = 2.1): WallOpening {
    return new WallOpening(centerlinePosition, width, 0, headHeight, "Door");
  }
  static window(centerlinePosition: number, width = 1.2, sillHeight = 0.9, headHeight = 2.2): WallOpening {
    return new WallOpening(centerlinePosition, width, sillHeight, headHeight, "Window");
  }
}

// ─── Wall (BIM wrapper) ─────────────────────────────────────────────

export interface WallOptions {
  centerline: Vec2[];
  thickness?: number;
  height?: number;
  baseElevation?: number;
  name?: string;
  /**
   * Optional reference to a reusable wall type (the IFC `IfcWallType`
   * analogue). When set, `realize(wall)` produces the framed parts and
   * layered materials; without one, the wall is treated as monolithic.
   */
  type?: WallType;
  /**
   * Wall-instance Pset overrides. Merged on top of `type.properties`.
   */
  properties?: PropertyMap;
}

/**
 * BIM-level wall. Thin wrapper around ExtrudedRibbon adding:
 *   • a name (round-trips to IfcWall.Name)
 *   • door/window openings with sill/head heights
 *
 * Geometry is 100% delegated to the underlying ExtrudedRibbon.
 */
export class Wall {
  /** The underlying geometry engine. */
  readonly ribbon: ExtrudedRibbon;
  /** Optional human-readable identifier (round-trips to `IfcWall.Name`). */
  name?: string;
  /** Rectangular openings (doors, windows). Synced into the ribbon at meshing time. */
  readonly openings: WallOpening[] = [];
  /** Reusable type definition (IFC `IfcWallType` analogue). See `src/bim/walls/`. */
  type?: WallType;
  /** Wall-instance property overrides (merged with `type.properties` at realize time). */
  properties?: PropertyMap;

  constructor(opts: WallOptions | Vec2[]) {
    if (Array.isArray(opts)) {
      this.ribbon = new ExtrudedRibbon(opts);
    } else {
      this.ribbon = new ExtrudedRibbon({
        centerline: opts.centerline,
        width:  opts.thickness,
        height: opts.height,
        baseZ:  opts.baseElevation,
      });
      this.name       = opts.name;
      this.type       = opts.type;
      this.properties = opts.properties;
    }
  }

  /** Convenience constructor for a single straight wall. */
  static segment(start: Vec2, end: Vec2, opts: { thickness?: number; height?: number; baseElevation?: number; name?: string } = {}): Wall {
    return new Wall({
      centerline: [start, end],
      thickness:  opts.thickness,
      height:     opts.height,
      baseElevation: opts.baseElevation,
      name:       opts.name,
    });
  }

  // ── Forwarded properties (convenience) ──
  get centerline(): Vec2[] { return this.ribbon.centerline; }
  set centerline(v: Vec2[]) { this.ribbon.centerline = v; }
  get thickness(): number { return this.ribbon.width; }
  set thickness(v: number) { this.ribbon.width = v; }
  get height(): number { return this.ribbon.height; }
  set height(v: number) { this.ribbon.height = v; }
  get baseElevation(): number { return this.ribbon.baseZ; }
  set baseElevation(v: number) { this.ribbon.baseZ = v; }
  get length(): number { return this.ribbon.length; }
  get segmentCount(): number { return this.ribbon.segmentCount; }
  get isClosedPolyline(): boolean { return this.ribbon.isClosedPolyline; }

  // ── Meshing ──

  /** Build a stand-alone triangle mesh for this wall (no junction analysis). */
  toMesh(): Mesh {
    this.syncOpeningsToRibbon();
    return this.ribbon.toMesh();
  }

  /** Build a combined mesh from a collection of walls (no junction analysis). */
  static buildMesh(walls: Iterable<Wall>): Mesh {
    const buf = newBuffers();
    for (const w of walls) {
      w.syncOpeningsToRibbon();
      w.ribbon.buildInto(buf, null, null);
    }
    return finishMesh(buf);
  }

  /**
   * Translate WallOpenings (BIM level) → RibbonOpenings (geometry level).
   * Called automatically by `toMesh` / `Wall.buildMesh` / `WallSystem.buildMesh`.
   */
  syncOpeningsToRibbon(): void {
    this.ribbon.openings.length = 0;
    for (const wo of this.openings) {
      this.ribbon.openings.push(new RibbonOpening(
        wo.centerlinePosition, wo.width, wo.sillHeight, wo.headHeight,
      ));
    }
  }
}

// ─── WallSystem (BIM wrapper around RibbonSystem) ────────────────────

/**
 * BIM-level wrapper around RibbonSystem. Maintains a parallel list of
 * Walls (with BIM metadata) alongside the generic RibbonSystem (which
 * handles junction analysis and meshing).
 *
 * Use this — not the bare RibbonSystem — when you want T-joints / L-joints
 * to trim cleanly between multiple walls.
 */
export class WallSystem {
  /** The underlying geometry-level ribbon system. */
  readonly ribbons: RibbonSystem = new RibbonSystem();
  /** BIM-level wall references (parallel to `ribbons.ribbons`). */
  readonly walls: Wall[] = [];

  get touchEpsilon(): number { return this.ribbons.touchEpsilon; }
  set touchEpsilon(v: number) { this.ribbons.touchEpsilon = v; }

  constructor(walls?: Iterable<Wall>) {
    if (walls) for (const w of walls) this.add(w);
  }

  add(wall: Wall): void {
    this.walls.push(wall);
    wall.syncOpeningsToRibbon();
    this.ribbons.add(wall.ribbon);
    this._jointCacheStamp = -1;
  }

  /** BIM-level joints, mirroring `ribbons.joints` 1-to-1. Built lazily. */
  get joints(): WallJoint[] {
    this.ensureJoints();
    return this._jointCache;
  }
  private _jointCache: WallJoint[] = [];
  private _jointCacheStamp = -1;

  /**
   * Force a fresh joint detection (RibbonSystem-level) and rebuild the
   * `WallJoint` wrappers with per-`WallType` default styles applied.
   * Call after mutating wall centerlines / types.
   */
  detectJoints(): void {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ribbons.detectJoints();
    this.rebuildJointCache();
  }

  private ensureJoints(): void {
    // Detect first (idempotent — preserves explicit style overrides via jointKey),
    // then mirror into the BIM-level cache so per-WallType defaults can be applied.
    this.ribbons.detectJoints();
    if (this._jointCacheStamp !== this.ribbons.joints.length || this._jointCache.length !== this.ribbons.joints.length) {
      this.rebuildJointCache();
    }
  }

  private rebuildJointCache(): void {
    this._jointCache = this.ribbons.joints.map(rj => {
      const walls = rj.participants
        .map(p => this.walls.find(w => w.ribbon === p.ribbon))
        .filter((w): w is Wall => !!w);
      // Default style: most-common preference among participants' WallTypes.
      // Ties / unset → keep the current style (default "mitered").
      const styleVotes = new Map<string, number>();
      for (const w of walls) {
        const s = w.type?.junctionStyle;
        if (s) styleVotes.set(s, (styleVotes.get(s) ?? 0) + 1);
      }
      let winner: string | undefined;
      let winCount = 0;
      for (const [s, c] of styleVotes) if (c > winCount) { winner = s; winCount = c; }
      if (winner === "butt" || winner === "mitered") rj.style = winner;
      return new WallJoint({ ribbonJoint: rj, walls });
    });
    this._jointCacheStamp = this.ribbons.joints.length;
  }

  /** Build one combined mesh for every wall, with junction trims applied. */
  buildMesh(): Mesh {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ensureJoints();
    return this.ribbons.buildMesh();
  }

  /**
   * Realise every wall in the system with **junction-aware framing**:
   * plate trims, partition-end shortening, channel-stud insertion in
   * through-walls. Joints are detected (or refreshed) automatically.
   */
  realize(): RealizedWall[] {
    for (const w of this.walls) w.syncOpeningsToRibbon();
    this.ensureJoints();
    return realizeSystem(this);
  }
}
