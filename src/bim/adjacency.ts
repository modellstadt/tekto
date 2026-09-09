/**
 * Which elements touch which, worked out from geometry.
 *
 * The companion to the relations an IFC file states, and deliberately a
 * separate module, because the two are different kinds of claim. A file that
 * records `IfcRelConnectsPathElements` is telling you its author drew those
 * two walls as meeting. A bounding box overlap is telling you that we measured
 * something and decided to call it contact. The first is testimony and the
 * second is inference, and an app that shows them alike will eventually assert
 * a load path nobody modelled.
 *
 * So every result here carries the tolerance it was found at, and the caller is
 * expected to say so. "Bears on, derived at 50 mm" is a different sentence from
 * "connected, stated by the file", and the difference is exactly the difference
 * between a certified figure and one somebody typed.
 *
 * Boxes rather than surfaces on purpose. Real contact between two solids is a
 * surface intersection, which is expensive, needs closed geometry that
 * imported models rarely have, and answers a question nobody asked: what a
 * reader wants is "what is next to this", not the area of the interface. An
 * axis-aligned box test over a few hundred elements is milliseconds, degrades
 * honestly on skew geometry (it over-reports, which a stated tolerance
 * warns about) and needs nothing of the mesh but its extent.
 */

/** An axis-aligned box, in whatever units the model is in. */
export interface Box {
  min: [number, number, number];
  max: [number, number, number];
}

/**
 * How two elements meet, named for what a builder would call it.
 *
 * The vertical cases are separated from the horizontal one because they are
 * different questions. "What does this wall carry" and "what does this wall
 * butt against" have different answers, different trades and, in this project,
 * different interface requirements. Collapsing them into one "adjacent" would
 * throw away the half that matters.
 */
export type Contact = "supports" | "supportedBy" | "abuts" | "overlaps";

export interface Adjacency {
  a: number;
  b: number;
  /** how `a` meets `b`; the reverse pair carries the opposite sense */
  contact: Contact;
  /** the gap that was tolerated to call this contact, in model units */
  tolerance: number;
  /** how much of the two boxes' footprint is shared, 0 to 1. A wall resting
   *  its whole length on a slab reads differently from one clipping a corner. */
  overlap: number;
}

/** Up, as an axis index. Tekto and IFC are Z-up; three.js content is Y-up. */
export type UpAxis = 0 | 1 | 2;

export interface AdjacencyOptions {
  /** How close counts as touching, in model units. 0.05 for metres is a
   *  builder's tolerance: it catches a wall drawn 30 mm off a slab and does
   *  not join two walls a hand's width apart. */
  tolerance?: number;
  up?: UpAxis;
  /** Below this shared footprint the pair is dropped, so two elements that
   *  merely graze at a corner are not reported as bearing on each other. */
  minOverlap?: number;
}

/** The box of a set of points, or null for no points. */
export function boxOf(positions: ArrayLike<number>): Box | null {
  if (!positions.length) return null;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i + 2 < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  return { min, max };
}

/** How much two intervals share, as a length. Negative is a gap. */
function share(aMin: number, aMax: number, bMin: number, bMax: number): number {
  return Math.min(aMax, bMax) - Math.max(aMin, bMin);
}

/**
 * Whether two boxes touch, and how.
 *
 * The test is the same in every axis: they must overlap or nearly overlap in
 * all three. What decides the *kind* of contact is which axis is the tight
 * one. If the pair only just meets along the up axis and one sits above the
 * other, that is bearing. If they meet tightly in a horizontal axis, they
 * abut. If they genuinely interpenetrate in all three, the geometry overlaps,
 * which is usually a modelling fault worth reporting rather than hiding.
 */
export function contactBetween(
  a: Box, b: Box, opts: AdjacencyOptions = {},
): { contact: Contact; overlap: number } | null {
  const tol = opts.tolerance ?? 0.05;
  const up = opts.up ?? 2;
  const gaps = [0, 1, 2].map((k) => share(a.min[k], a.max[k], b.min[k], b.max[k]));
  if (gaps.some((g) => g < -tol)) return null;          // apart in some axis

  // The shared footprint, as a fraction of the smaller element's own.
  //
  // Of the smaller one's area, not of the smaller extent in each axis. Taking
  // the minimum per axis multiplies out to a footprint neither box has: two
  // walls crossing at a corner, 0.3 by 4 and 6 by 0.3, gave 0.09, which is
  // exactly their intersection, so a coincidence of coordinates scored a
  // perfect overlap. Read this way a post standing wholly on a slab is fully
  // supported, which is true, and a wall hanging off the edge is not.
  const flat = [0, 1, 2].filter((k) => k !== up);
  const area = flat.reduce((p, k) => p * Math.max(0, gaps[k]), 1);
  const footprint = (box: Box) => flat.reduce((p, k) => p * (box.max[k] - box.min[k]), 1);
  const smaller = Math.min(footprint(a), footprint(b));
  const overlap = smaller > 0 ? Math.min(1, area / smaller) : 0;

  const verticalTouch = gaps[up] <= tol;
  if (verticalTouch) {
    if (overlap < (opts.minOverlap ?? 0.02)) return null;  // grazing a corner
    // whichever sits higher is carried by the other
    const aAbove = a.min[up] >= b.max[up] - tol;
    const bAbove = b.min[up] >= a.max[up] - tol;
    if (aAbove) return { contact: "supportedBy", overlap };
    if (bAbove) return { contact: "supports", overlap };
  }
  if (flat.some((k) => gaps[k] <= tol)) return { contact: "abuts", overlap };
  return { contact: "overlaps", overlap };
}

/** The opposite sense, so both elements can be asked the same question. */
export function reverse(contact: Contact): Contact {
  return contact === "supports" ? "supportedBy"
    : contact === "supportedBy" ? "supports" : contact;
}

/**
 * Every touching pair among these elements.
 *
 * Swept along the up axis rather than compared pairwise: sorting by the bottom
 * of each box and walking forward until the next box starts above the current
 * one's top turns a quadratic scan into something a project-scale model can
 * afford. On 446 elements the difference is 99,000 comparisons against a few
 * thousand.
 */
export function findAdjacent(
  elements: { id: number; box: Box }[], opts: AdjacencyOptions = {},
): Adjacency[] {
  const tol = opts.tolerance ?? 0.05;
  const up = opts.up ?? 2;
  const sorted = [...elements].sort((p, q) => p.box.min[up] - q.box.min[up]);
  const out: Adjacency[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      // sorted by the low edge, so once one starts above this one's top plus
      // the tolerance, so does everything after it
      if (b.box.min[up] > a.box.max[up] + tol) break;
      const met = contactBetween(a.box, b.box, opts);
      if (!met) continue;
      out.push({ a: a.id, b: b.id, contact: met.contact, tolerance: tol,
                 overlap: met.overlap });
    }
  }
  return out;
}

/** The adjacencies of one element, both directions folded together, so a
 *  caller can ask "what is next to this" without knowing which side of the
 *  pair it was found on. */
export function neighboursOf(
  id: number, all: Adjacency[],
): { id: number; contact: Contact; overlap: number; tolerance: number }[] {
  const out: { id: number; contact: Contact; overlap: number; tolerance: number }[] = [];
  for (const r of all) {
    if (r.a === id) out.push({ id: r.b, contact: r.contact, overlap: r.overlap, tolerance: r.tolerance });
    else if (r.b === id) out.push({ id: r.a, contact: reverse(r.contact), overlap: r.overlap, tolerance: r.tolerance });
  }
  return out;
}
