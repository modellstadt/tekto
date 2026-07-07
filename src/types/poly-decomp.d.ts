// Ambient declaration for `poly-decomp` (ships no types).
// Convex decomposition of simple polygons. Points are [x, y] pairs; rings are
// open (no repeated closing vertex). Several functions mutate their input.
declare module "poly-decomp" {
  type Pt = [number, number];
  type Poly = Pt[];

  /** Optimal (slow) convex decomposition. */
  export function decomp(polygon: Poly): Poly[];
  /** Fast (greedy) convex decomposition — good enough for nesting. */
  export function quickDecomp(polygon: Poly): Poly[];
  /** True if the polygon is simple (non-self-intersecting). */
  export function isSimple(polygon: Poly): boolean;
  /** Remove near-collinear vertices in place; returns how many were removed. */
  export function removeCollinearPoints(polygon: Poly, thresholdAngle?: number): number;
  /** Remove duplicate vertices in place. */
  export function removeDuplicatePoints(polygon: Poly, precision?: number): void;
  /** Reverse to CCW winding in place; returns true if it reversed. */
  export function makeCCW(polygon: Poly): boolean;
}
