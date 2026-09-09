/**
 * How labels are stacked in the margins.
 *
 * The whole reason callouts sit in a column rather than floating at the thing
 * they name is that a column can be made not to overlap and not to cross. Both
 * of those are properties of a pure function of screen positions, so both are
 * checked here rather than looked at in a browser.
 */
import { describe, it, expect } from "vitest";
import { layoutLabels } from "../src/render/Callouts";

const BOX = { width: 800, height: 600, rowHeight: 30, labelWidth: 150, inset: 8 };

/** Two labels overlap if their rows do, on the same side. */
function overlaps(a: { side: string; y: number }, b: { side: string; y: number }) {
  return a.side === b.side && Math.abs(a.y - b.y) < BOX.rowHeight;
}

describe("callout layout", () => {
  it("sends each label to the margin its anchor is nearest", () => {
    const { placed: out } = layoutLabels([
      { id: "l", x: 100, y: 300 },
      { id: "r", x: 700, y: 300 },
    ], BOX);
    // a leader that crosses the whole drawing to reach the far margin passes
    // over everything in between, which is what the side rule prevents
    expect(out.find((p) => p.id === "l")!.side).toBe("left");
    expect(out.find((p) => p.id === "r")!.side).toBe("right");
    expect(out.find((p) => p.id === "l")!.x).toBeLessThan(400);
    expect(out.find((p) => p.id === "r")!.x).toBeGreaterThan(400);
  });

  it("never lets two labels sit on top of each other", () => {
    // ten anchors within a few pixels of each other, which is what a face view
    // of a building actually produces: storeys line up
    const { placed: out } = layoutLabels(
      Array.from({ length: 10 }, (_, i) => ({ id: `e${i}`, x: 100, y: 300 + i })), BOX);
    expect(out).toHaveLength(10);
    for (const a of out) {
      for (const b of out) {
        if (a !== b) expect(overlaps(a, b)).toBe(false);
      }
    }
  });

  it("keeps labels in the order their anchors run down the screen", () => {
    // leaders that cross are worse than no leaders: the reader follows the
    // wrong one and believes the answer
    const anchors = [
      { id: "c", x: 100, y: 400 },
      { id: "a", x: 100, y: 100 },
      { id: "b", x: 100, y: 250 },
    ];
    const { placed: out } = layoutLabels(anchors, BOX);
    const order = [...out].sort((p, q) => p.y - q.y).map((p) => p.id);
    expect(order).toEqual(["a", "b", "c"]);
  });

  it("keeps the column inside the viewport, top and bottom", () => {
    // every anchor low on the screen: the column must ride up rather than
    // running off the bottom edge where nothing can be read
    const { placed: out } = layoutLabels(
      Array.from({ length: 8 }, (_, i) => ({ id: `e${i}`, x: 700, y: 560 + i })), BOX);
    for (const p of out) {
      expect(p.y).toBeGreaterThanOrEqual(BOX.inset);
      expect(p.y + BOX.rowHeight).toBeLessThanOrEqual(BOX.height);
    }
  });

  it("says what it could not fit instead of clipping it", () => {
    // 30 labels at 30px in 600px cannot all fit. The first version let the
    // surplus run off the bottom into an overflow:hidden, so eleven of thirty
    // simply were not there and nothing said so: a reader counting labelled
    // elements would have counted wrong.
    const { placed, dropped } = layoutLabels(
      Array.from({ length: 30 }, (_, i) => ({ id: `e${i}`, x: 100, y: 300 })), BOX);
    expect(placed.length + dropped.length).toBe(30);
    expect(dropped.length).toBeGreaterThan(0);
    for (const p of placed) {
      expect(p.y).toBeGreaterThanOrEqual(BOX.inset);
      expect(p.y + BOX.rowHeight).toBeLessThanOrEqual(BOX.height);
    }
    // and never by printing them on top of each other, which is less
    // information rather than more
    for (const a of placed) for (const b of placed) {
      if (a !== b) expect(overlaps(a, b)).toBe(false);
    }
  });

  it("drops by the caller's order, which is the caller's priority", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `e${i}`, x: 100, y: 20 * i }));
    const { placed, dropped } = layoutLabels(many, BOX);
    // whoever was handed over first keeps their place
    expect(placed.some((p) => p.id === "e0")).toBe(true);
    expect(dropped).toContain("e39");
  });

  it("remembers where the leader has to end", () => {
    const { placed: out } = layoutLabels([{ id: "a", x: 123, y: 456 }], BOX);
    expect(out[0].anchorX).toBe(123);
    expect(out[0].anchorY).toBe(456);
  });

  it("has nothing to place when nothing is visible", () => {
    expect(layoutLabels([], BOX)).toEqual({ placed: [], dropped: [] });
  });
});
