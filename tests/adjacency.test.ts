/**
 * Derived adjacency, which is inference and therefore has to be careful.
 *
 * The failure that matters is over-reporting: telling an app that a wall bears
 * on a slab it merely passes near, which the app would then turn into a claim
 * about a load path nobody modelled. So most of these tests are about what is
 * *not* reported.
 */
import { describe, it, expect } from "vitest";
import {
  boxOf, contactBetween, findAdjacent, neighboursOf, reverse, type Box,
} from "../src/bim/adjacency";

/** A box from its corner and size, in metres, Z up. */
const at = (x: number, y: number, z: number, dx: number, dy: number, dz: number): Box =>
  ({ min: [x, y, z], max: [x + dx, y + dy, z + dz] });

const SLAB = at(0, 0, 0, 6, 4, 0.28);
const WALL_ON_SLAB = at(0, 0, 0.28, 6, 0.3, 2.8);

describe("what counts as contact", () => {
  it("calls a wall standing on a slab bearing, and says which carries which", () => {
    const met = contactBetween(WALL_ON_SLAB, SLAB)!;
    expect(met.contact).toBe("supportedBy");
    // asked the other way round it is the same fact with the sense flipped
    expect(contactBetween(SLAB, WALL_ON_SLAB)!.contact).toBe("supports");
    expect(reverse("supports")).toBe("supportedBy");
  });

  it("tolerates a builder's gap, and not a designer's", () => {
    // drawn 30 mm off the slab: still bearing, because that is a modelling
    // slip rather than a wall floating in the air
    expect(contactBetween(at(0, 0, 0.31, 6, 0.3, 2.8), SLAB)).not.toBeNull();
    // half a metre above it is not
    expect(contactBetween(at(0, 0, 0.78, 6, 0.3, 2.8), SLAB)).toBeNull();
  });

  it("does not call two walls meeting at a corner bearing on each other", () => {
    // they share almost no footprint, so reporting support would invent a load
    // path out of a coincidence of coordinates
    const met = contactBetween(at(0, 0, 0, 0.3, 4, 2.8), at(0, 0, 0, 6, 0.3, 2.8));
    expect(met && met.contact).not.toBe("supports");
    expect(met && met.contact).not.toBe("supportedBy");
  });

  it("calls two walls in the same plane abutting", () => {
    expect(contactBetween(at(0, 0, 0, 3, 0.3, 2.8), at(3, 0, 0, 3, 0.3, 2.8))!.contact)
      .toBe("abuts");
  });

  it("reports geometry that interpenetrates rather than hiding it", () => {
    // two solids sharing volume is usually a modelling fault, and a reader is
    // better served knowing than being told they merely touch
    expect(contactBetween(at(0, 0, 0, 3, 3, 3), at(1, 1, 1, 3, 3, 3))!.contact)
      .toBe("overlaps");
  });

  it("says nothing about elements that are simply apart", () => {
    expect(contactBetween(at(0, 0, 0, 1, 1, 1), at(5, 5, 5, 1, 1, 1))).toBeNull();
  });

  it("measures the shared footprint against the smaller element's own", () => {
    // a wall wholly on the slab is wholly supported, and so is a post: the
    // question is what fraction of the thing being carried is over the thing
    // carrying it, not how big either is
    expect(contactBetween(WALL_ON_SLAB, SLAB)!.overlap).toBeCloseTo(1);
    expect(contactBetween(at(1, 1, 0.28, 0.3, 0.3, 2.8), SLAB)!.overlap).toBeCloseTo(1);
    // hanging most of the way off the edge is not
    const hanging = contactBetween(at(5.8, 0, 0.28, 6, 0.3, 2.8), SLAB)!;
    expect(hanging.overlap).toBeLessThan(0.1);
  });

  it("does not score a coincidence of coordinates as a perfect overlap", () => {
    // two walls crossing at a corner: 0.3 by 4 against 6 by 0.3. Taking the
    // smaller extent in each axis multiplies out to 0.09, which is exactly
    // their intersection, so this scored 1.0 and read as total contact
    const a = at(0, 0, 0, 0.3, 4, 2.8), b = at(0, 0, 0, 6, 0.3, 2.8);
    expect(contactBetween(a, b)!.overlap).toBeLessThan(0.15);
  });

  it("follows the up axis it is given", () => {
    // web-ifc hands geometry over already turned to three.js Y-up, so a
    // consumer can have both conventions in play. Reading the wrong axis makes
    // every bearing wall look like it abuts.
    const slabY = at(0, 0, 0, 6, 0.28, 4);
    const wallY = at(0, 0.28, 0, 6, 2.8, 0.3);
    expect(contactBetween(wallY, slabY, { up: 1 })!.contact).toBe("supportedBy");
  });
});

describe("finding every pair", () => {
  it("finds the pairs and skips the rest", () => {
    const found = findAdjacent([
      { id: 1, box: SLAB },
      { id: 2, box: WALL_ON_SLAB },
      { id: 3, box: at(20, 20, 0, 1, 1, 1) },      // nowhere near
    ]);
    expect(found).toHaveLength(1);
    expect([found[0].a, found[0].b].sort()).toEqual([1, 2]);
    // the tolerance travels with the answer, because the answer depends on it
    expect(found[0].tolerance).toBe(0.05);
  });

  it("answers for one element in either direction it was recorded", () => {
    const all = findAdjacent([{ id: 1, box: SLAB }, { id: 2, box: WALL_ON_SLAB }]);
    expect(neighboursOf(1, all)).toEqual([
      expect.objectContaining({ id: 2, contact: "supports" })]);
    expect(neighboursOf(2, all)).toEqual([
      expect.objectContaining({ id: 1, contact: "supportedBy" })]);
  });

  it("stays affordable on a project-scale model", () => {
    // a naive pass over 500 elements is 124,750 comparisons; the sweep along
    // the up axis is what makes this usable on an imported building
    const storeys = Array.from({ length: 500 }, (_, i) =>
      ({ id: i, box: at(0, 0, i * 3, 6, 4, 0.28) }));
    const t0 = performance.now();
    const found = findAdjacent(storeys);
    expect(performance.now() - t0).toBeLessThan(120);
    expect(found).toHaveLength(0);            // stacked 3 m apart, none touch
  });
});

describe("boxes", () => {
  it("measures a mesh's extent", () => {
    expect(boxOf([0, 0, 0, 1, 2, 3])).toEqual({ min: [0, 0, 0], max: [1, 2, 3] });
  });

  it("has nothing to say about no geometry", () => {
    expect(boxOf([])).toBeNull();
  });
});
