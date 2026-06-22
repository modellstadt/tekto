/**
 * Re-export shim — primitives have moved to src/core/geometry/.
 * Import from the new locations for new code.
 */

export { Ray } from "../geometry/Ray";
export { HPlane as Plane, HPlane } from "../geometry/HPlane";
export { Triangle } from "../geometry/Triangle";
export { AABB } from "../geometry/AABB";
export { Sphere } from "../geometry/Sphere";
export { closestPointOnSegment, segmentSegmentClosest } from "../geometry/Segment";
