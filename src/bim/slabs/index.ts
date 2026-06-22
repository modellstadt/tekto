// ====================================================================
// BIM / Slabs — public surface
// ====================================================================
//
// Domain-semantics layer for slabs (floors, ceilings, roofs). Mirrors
// `src/bim/walls/` — same Type-Instance + Layers + Parts + Psets shape.
//
// See `types.ts` for the core types; `orientation.ts` for joist-
// direction helpers; `solid.ts` and `joisted.ts` for concrete
// constructions.

export {
  Slab, SlabType, SlabOpening, realizeSlab,
} from "./types";
export type {
  SlabConstruction, SlabPart, SlabPartRole,
  SlabOptions, SlabTypeOptions, SlabContext, RealizedSlab,
} from "./types";

export {
  chooseJoistDirection,
  joistDirectionFromBounds,
  joistDirectionFromPCA,
  joistDirectionFromSupports,
  lineClipPolygon,
} from "./orientation";
export type { JoistOrientationOptions } from "./orientation";

export { SolidSlabConstruction } from "./solid";

export { JoistedSlab } from "./joisted";
export type { JoistedSlabOptions } from "./joisted";
