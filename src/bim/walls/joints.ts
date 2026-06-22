// ====================================================================
// BIM / Walls / Joints — domain wrapper over RibbonJoint
// ====================================================================
//
// A `WallJoint` is the BIM-level identity of a joint between walls:
// connection type (screwed, glued, mortise), fastener count, fire-stop
// data, and an open property set. The underlying geometry — which
// ribbons meet, where, in what style — lives in the wrapped `RibbonJoint`.
//
// At IFC export time, a `WallJoint` becomes an `IfcRelConnectsElements`
// (or `IfcRelConnectsPathElements` for path-like walls) between the
// participating walls; `connectionType` and `properties` populate the
// `Pset_ElementConnectionCommon` Pset.

import type { Wall } from "../../core/geometry/walls";
import type { RibbonJoint, JointStyle } from "../../core/geometry/RibbonJoint";
import type { PropertyMap } from "./types";

/** Mechanical connection class. Influences fastener listing / structural calc. */
export type ConnectionType =
  | "screwed"
  | "nailed"
  | "glued"
  | "mortise"        // mortise-and-tenon
  | "metalBracket"
  | "boltedPlate"
  | "unspecified";

export interface WallJointOptions {
  ribbonJoint: RibbonJoint;
  walls: Wall[];
  connectionType?: ConnectionType;
  fastenerCount?: number;
  properties?: PropertyMap;
}

/**
 * BIM wrapper around a geometric `RibbonJoint`. Read-through to the
 * underlying joint's `style` and `throughRibbon` via getters/setters so
 * either the geometry-side or the BIM-side can drive the policy.
 */
export class WallJoint {
  readonly ribbonJoint: RibbonJoint;
  readonly walls: Wall[];
  connectionType: ConnectionType = "unspecified";
  fastenerCount?: number;
  properties: PropertyMap = {};

  constructor(opts: WallJointOptions) {
    this.ribbonJoint = opts.ribbonJoint;
    this.walls = opts.walls;
    if (opts.connectionType) this.connectionType = opts.connectionType;
    if (opts.fastenerCount !== undefined) this.fastenerCount = opts.fastenerCount;
    if (opts.properties) this.properties = opts.properties;
  }

  /** Joint geometry style. Mirrors `ribbonJoint.style`. */
  get style(): JointStyle { return this.ribbonJoint.style; }
  set style(v: JointStyle) { this.ribbonJoint.style = v; }

  /** For "butt" style: which wall passes through. */
  get throughWall(): Wall | undefined {
    const through = this.ribbonJoint.throughRibbon;
    return through ? this.walls.find(w => w.ribbon === through) : undefined;
  }
  set throughWall(w: Wall | undefined) {
    this.ribbonJoint.throughRibbon = w?.ribbon;
  }

  /** Joint kind (L/T/Y/X/cluster). Read-only — derived from geometry. */
  get kind() { return this.ribbonJoint.kind; }
}
