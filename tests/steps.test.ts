/**
 * Steps: a program recorded as it runs — inputs, outputs, time, errors, the links between
 * steps read off the values, and what the record says about the program.
 */
import { describe, it, expect } from "vitest";
import { StepTrace, describeValue } from "../src/core/steps/StepTrace";
import { Vec2 } from "../src/core/math/vectors";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";

const busy = (ms: number) => { const t = performance.now(); while (performance.now() - t < ms) { /* wait */ } };

describe("StepTrace", () => {
  it("links steps by the values that flow between them, also through filtered arrays", () => {
    const t = new StepTrace();
    const seeds = t.step("seeds", { count: 4 }, ({ count }) => Array.from({ length: count }, (_, i) => new Vec2(i, 0)));
    const kept = t.step("keep", { seeds }, ({ seeds }) => seeds.filter((p) => p.x > 0));   // a new array of the same points
    const spacing = t.step("spacing", { kept, gap: 0.5 }, ({ kept }) => kept.length * 0.5);
    t.step("label", { spacing, first: kept[0] }, ({ spacing }) => `gap ${spacing}`);
    expect(t.edges()).toEqual([
      { from: "seeds", to: "keep", input: "seeds" },
      { from: "keep", to: "spacing", input: "kept" },
      { from: "keep", to: "label", input: "first" },
    ]);
    expect(t.steps.map((s) => [s.id, s.output])).toEqual([
      ["seeds", "Array(4) of Vec2"], ["keep", "Array(3) of Vec2"], ["spacing", "1.5"], ["label", '"gap 1.5"'],
    ]);
    expect(t.steps[2].inputs).toEqual([
      { name: "kept", summary: "Array(3) of Vec2", from: ["keep"] },
      { name: "gap", summary: "0.5" },
    ]);
  });

  it("names repeats, nests steps, and records an error before throwing it on", () => {
    const t = new StepTrace();
    t.step("relax", {}, () => { for (let i = 0; i < 2; i++) t.step("iterate", { i }, () => i); return null; });
    expect(t.steps.map((s) => [s.id, s.parent])).toEqual([["relax", undefined], ["iterate", "relax"], ["iterate#2", "relax"]]);
    expect(t.current).toBeUndefined();
    expect(() => t.step("divide", { by: 0 }, () => { throw new Error("nothing to divide"); })).toThrow("nothing to divide");
    expect(t.analyse().errors).toEqual([{ id: "divide", error: "nothing to divide" }]);
  });

  it("finds the slowest steps and chain, and outputs nobody used", () => {
    const t = new StepTrace();
    const a = t.step("site", {}, () => { busy(4); return [new Vec2(0, 0)]; });
    const b = t.step("cells", { a }, ({ a }) => { busy(12); return a.map((p) => ({ p })); });
    t.step("unusedGrid", {}, () => { busy(1); return MeshFactory.box(1, 1, 1); });
    const c = t.step("mass", { b }, ({ b }) => { busy(2); return b.length; });
    t.step("report", { c }, ({ c }) => `n=${c}`);
    const r = t.analyse();
    expect(r.slowest[0].id).toBe("cells");
    expect(r.slowestChain.ids).toEqual(["site", "cells", "mass"]);
    expect(r.unused).toEqual(["unusedGrid"]);            // a Mesh nobody took; numbers can't be followed
    expect(r.totalMs).toBeGreaterThan(18);
    expect(JSON.parse(JSON.stringify(t.toJSON())).steps).toHaveLength(5);
  });
});

describe("describeValue", () => {
  it("says what a value is in a few words, whatever its size", () => {
    expect(describeValue(0.81234)).toBe("0.812");
    expect(describeValue(12000)).toBe("12,000");
    expect(describeValue([3, 1, 2])).toBe("Array(3) of number, 1–3");
    expect(describeValue(MeshFactory.box(1, 1, 1))).toBe("Mesh, 6 faces");
    expect(describeValue(new Vec2(1.5, 2))).toBe("Vec2(1.5, 2)");
    expect(describeValue({ cells: [], sites: [], a: 1, b: 2, c: 3, d: 4 })).toBe("{ cells, sites, a, b, c, … }");
    expect(describeValue("x".repeat(60))).toHaveLength(40);
  });
});
