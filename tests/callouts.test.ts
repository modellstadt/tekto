/**
 * How labels are stacked in the margins.
 *
 * The whole reason callouts sit in a column rather than floating at the thing
 * they name is that a column can be made not to overlap and not to cross. Both
 * of those are properties of a pure function of screen positions, so both are
 * checked here rather than looked at in a browser.
 */
import { describe, it, expect } from "vitest";
import { calloutChanged, calloutGroups, layoutLabels, leaderPath, marginCapacity } from "../src/render/Callouts";

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

  it("keeps a label to the margin it names, whichever half its anchor is in", () => {
    // a column of products down the left reads as a key
    const { placed: out } = layoutLabels([
      { id: "p", x: 700, y: 100, side: "left" },
      { id: "q", x: 100, y: 200, side: "right" },
      { id: "r", x: 700, y: 300 },
    ], BOX);
    const side = (id: string) => out.find((p) => p.id === id)!;
    expect(side("p").side).toBe("left");
    expect(side("p").x).toBe(BOX.inset);
    expect(side("q").side).toBe("right");
    expect(side("r").side).toBe("right");
  });

  it("carries each leader's end through, and none for a label with one", () => {
    const ends = [{ x: 500, y: 100 }, { x: 600, y: 300 }];
    const { placed: out } = layoutLabels([{ id: "p", x: 550, y: 200, side: "left", ends },
                                          { id: "e", x: 100, y: 400 }], BOX);
    expect(out.find((p) => p.id === "p")!.ends).toEqual(ends);
    expect(out.find((p) => p.id === "e")).not.toHaveProperty("ends");
  });
});

describe("callouts as a list", () => {
  const LIST = { ...BOX, stack: "list" as const, top: 24 };

  it("stacks labels from the top in the order given, wherever their anchors are", () => {
    // a key: it stays put while the model turns, and only the leaders move
    const { placed: out } = layoutLabels([
      { id: "walls", x: 100, y: 500, side: "left", ends: [] },
      { id: "floors", x: 100, y: 50, side: "left", ends: [] },
      { id: "windows", x: 100, y: 300, side: "left", ends: [] },
    ], LIST);
    expect(out.map((p) => p.id)).toEqual(["walls", "floors", "windows"]);
    expect(out.map((p) => p.y)).toEqual([24 + 8, 24 + 8 + 30, 24 + 8 + 60]);
  });

  it("keeps room for the title, and says what it had no room for", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: `p${i}`, x: 100, y: 0, side: "left" as const }));
    const { placed, dropped } = layoutLabels(many, LIST);
    expect(placed).toHaveLength(marginCapacity(BOX.height - 24, BOX));
    expect(dropped).toHaveLength(30 - placed.length);
    expect(dropped[0]).toBe(`p${placed.length}`);
  });

  it("draws no leader for a listed label whose things are all out of sight", () => {
    expect(leaderPath({ id: "p", side: "left", x: 8, y: 40, anchorX: 0, anchorY: 0, ends: [] }, 150, "curve")).toBe("");
  });
});

describe("callout leaders", () => {
  it("points at everything together by default, and at each entry when asked", () => {
    const objects = ["walls/a", "walls/b", "walls/c"];
    expect(calloutGroups({ objects })).toEqual([objects]);
    expect(calloutGroups({ objects, leaders: "one" })).toEqual([objects]);
    expect(calloutGroups({ objects, leaders: "each" })).toEqual([["walls/a"], ["walls/b"], ["walls/c"]]);
  });

  it("draws one elbow to its anchor for a label with one leader", () => {
    const p = { id: "e", side: "left" as const, x: 8, y: 100, anchorX: 300, anchorY: 250 };
    // out of the label's right edge, a short level run, then to the anchor
    expect(leaderPath(p, 150)).toBe("M158,109 L168,109 L300,250");
    expect(leaderPath({ ...p, side: "right", x: 642 }, 150)).toBe("M642,109 L632,109 L300,250");
  });

  it("curves each leader out of the label level and into its end level", () => {
    const ends = [{ x: 300, y: 50 }, { x: 500, y: 400 }];
    const p = { id: "p", side: "left" as const, x: 8, y: 100, anchorX: 400, anchorY: 225, ends };
    // from the label's edge, control points half way across at either height
    expect(leaderPath(p, 150, "curve"))
      .toBe("M158,109 C229,109 229,50 300,50 M158,109 C329,109 329,400 500,400");
    expect(leaderPath({ ...p, ends: undefined }, 150, "curve")).toBe("M158,109 C279,109 279,225 400,225");
    // the default stays the elbow
    expect(leaderPath({ ...p, ends: undefined }, 150)).toBe("M158,109 L168,109 L400,225");
  });

  it("fans a label's leaders out from one knee, one line to each end", () => {
    const ends = [{ x: 300, y: 50 }, { x: 320, y: 250 }, { x: 500, y: 400 }];
    const d = leaderPath({ id: "p", side: "left", x: 8, y: 100, anchorX: 373, anchorY: 233, ends }, 150);
    expect(d).toBe("M158,109 L168,109 M168,109 L300,50 M168,109 L320,250 M168,109 L500,400");
    // every leader starts at the same knee, so they read as one label's
    expect(d.match(/M168,109/g)).toHaveLength(3);
  });
});

describe("callout text", () => {
  const item = { id: "w", objects: [], text: "not asked yet", detail: "not asked yet", colour: "#e4e8ec" };
  it("rebuilds a label whose words or colour changed, and keeps one that did not", () => {
    expect(calloutChanged(item, { ...item })).toBe(false);
    // the app's answer arrived: the label must stop saying it has none
    expect(calloutChanged(item, { ...item, text: "Aussenwand D1190", detail: "datasheet" })).toBe(true);
    expect(calloutChanged(item, { ...item, colour: "#5a9e7f" })).toBe(true);
    expect(calloutChanged(item, undefined)).toBe(true);
  });
});

describe("margin capacity", () => {
  it("is the number of rows layoutLabels places on one side", () => {
    const cap = marginCapacity(BOX.height, BOX);
    const many = Array.from({ length: 60 }, (_, i) => ({ id: `l${i}`, x: 100, y: 10 + i * 9 }));
    const { placed, dropped } = layoutLabels(many, BOX);
    expect(placed).toHaveLength(cap);
    expect(dropped).toHaveLength(60 - cap);
    expect(marginCapacity(10)).toBe(0);
  });
});
