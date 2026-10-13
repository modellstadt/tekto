/**
 * ParamStore: setting params by the name a person sees.
 *
 * `snap --params '{"Radius":2}'` was documented and did nothing: sketch keys read
 * `slider::Radius`, and `loadJSON` drops unknown keys without a word. An agent then
 * snapshots the unchanged design and believes its change landed. `setByName` resolves
 * labels and reports what it could not apply; these tests hold it to that.
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { ParamStore, type ParamSchema } from "../src/gui/Params";

/** The keys sketch() declares: `type:group:label`. */
function sketchStore() {
  const s = new ParamStore<ParamSchema>({});
  s.define("slider::Radius", { type: "float", min: 0, max: 5, default: 1, label: "Radius" });
  s.define("slider:Beam:Depth", { type: "float", min: 0, max: 1, default: 0.3, label: "Depth" });
  s.define("slider:Slab:Depth", { type: "float", min: 0, max: 1, default: 0.2, label: "Depth" });
  s.define("toggle:Display:Wireframe", { type: "bool", default: false, label: "Wireframe" });
  return s;
}

describe("ParamStore.setByName", () => {
  it("finds a control by its label, ignoring case", () => {
    const s = sketchStore();
    const r = s.setByName({ radius: 2, Wireframe: true });
    expect(r).toEqual({ applied: ["slider::Radius", "toggle:Display:Wireframe"], unknown: [], ambiguous: [] });
    expect(s.get("slider::Radius")).toBe(2);
    expect(s.get("toggle:Display:Wireframe")).toBe(true);
  });

  it("reports a label shared by two controls instead of guessing, and takes Group:Label", () => {
    const s = sketchStore();
    const r = s.setByName({ Depth: 0.5 });
    expect(r.applied).toEqual([]);
    expect(r.ambiguous).toEqual([{ name: "Depth", keys: ["slider:Beam:Depth", "slider:Slab:Depth"] }]);
    expect(s.get("slider:Beam:Depth")).toBe(0.3);       // untouched
    s.setByName({ "Slab:Depth": 0.5 });
    expect(s.get("slider:Slab:Depth")).toBe(0.5);
    expect(s.get("slider:Beam:Depth")).toBe(0.3);
  });

  it("reports names that match nothing (loadJSON drops them silently)", () => {
    const s = sketchStore();
    expect(s.setByName({ Height: 3 }).unknown).toEqual(["Height"]);
  });

  it("still takes the exact key", () => {
    const s = sketchStore();
    expect(s.setByName({ "slider:Beam:Depth": 0.9 }).applied).toEqual(["slider:Beam:Depth"]);
    expect(s.get("slider:Beam:Depth")).toBe(0.9);
  });

  it("names() lists what to pass: labels, with the group where two share one", () => {
    expect(sketchStore().names()).toEqual(["Radius", "Beam:Depth", "Slab:Depth", "Wireframe"]);
  });

  it("works for appShell-style schemas (plain keys with labels)", () => {
    const s = new ParamStore({
      radius: { type: "float", min: 0.1, max: 5, default: 1, label: "Radius" },
      segments: { type: "int", min: 3, max: 64, default: 16 },
    });
    expect(s.setByName({ Radius: 3, segments: 8 }).applied).toEqual(["radius", "segments"]);
    expect(s.get("radius")).toBe(3);
    expect(s.names()).toEqual(["Radius", "segments"]);
  });
});

describe("ParamStore values are typed from the schema", () => {
  it("get() and getAll() return the value type each param holds", () => {
    const s = new ParamStore({
      radius: { type: "float", min: 0, max: 5, default: 1 },
      count: { type: "int", min: 1, max: 9, default: 3 },
      wire: { type: "bool", default: false },
      mode: { type: "select", options: ["a", "b"], default: "a" },
      tint: { type: "color", default: "#ffffff" },
      at: { type: "vec3", default: [0, 0, 0] },
    });
    expectTypeOf(s.get("radius")).toEqualTypeOf<number>();
    expectTypeOf(s.get("count")).toEqualTypeOf<number>();
    expectTypeOf(s.get("wire")).toEqualTypeOf<boolean>();
    expectTypeOf(s.get("mode")).toEqualTypeOf<string>();
    expectTypeOf(s.get("at")).toEqualTypeOf<[number, number, number]>();
    expectTypeOf(s.getAll().tint).toEqualTypeOf<string>();
    expect(s.get("radius") + s.get("count")).toBe(4);   // no casts needed
  });
});

describe("vec3 params", () => {
  it("clamp each component to min / max, like a slider", () => {
    const store = new ParamStore({ p: { type: "vec3", default: [0, 0, 0], min: [-1, 0, 0], max: [1, 2, 10] } });
    store.set("p", [5, -3, 4]);
    expect(store.get("p")).toEqual([1, 0, 4]);
  });
});
