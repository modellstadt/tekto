// ====================================================================
// BIM / Walls — public surface
// ====================================================================
//
// Domain-semantics layer over the geometric wall envelope in
// `src/core/geometry/walls.ts`. See `src/bim/walls/README.md` for the
// design notes and the IFC mapping.

export {
  WallType,
  realize,
  buildCutList,
} from "./types";
export type {
  WallConstruction, WallPart, WallPartRole,
  MaterialLayer, LayerPosition,
  PartProfile,
  CutListItem,
  PropertyMap,
  RealizedWall,
} from "./types";

export { SolidConstruction } from "./solid";
export { BalloonFrame } from "./balloon-frame";
export type { BalloonFrameOptions } from "./balloon-frame";
export { HolzrahmenBau, holzrahmenbauLayers, HolzrahmenBauJointStyle } from "./holzrahmenbau";
export type { HolzrahmenBauOptions } from "./holzrahmenbau";
export { CltConstruction, cltLayers } from "./clt";
export type { CltOptions } from "./clt";
export { WallJoint } from "./joints";
export type { ConnectionType, WallJointOptions } from "./joints";
