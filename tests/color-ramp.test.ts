import { describe, it, expect } from "vitest";
import { ColorRamp } from "../src/core/math/ColorRamp";

const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

describe("ColorRamp", () => {
  it("starts and ends on its stops, and passes through the inner ones", () => {
    const r = new ColorRamp(["#102030", "#cde2fb", [1, 0.5, 0]]);
    expect(r.hex(0)).toBe("#102030");
    expect(r.hex(0.5)).toBe("#cde2fb");
    expect(r.hex(1)).toBe("#ff8000");
    const [a, b, c] = r.at(1);
    expect(a).toBeCloseTo(1, 6);
    expect(b).toBeCloseTo(0.5, 6);
    expect(c).toBeCloseTo(0, 6);
  });

  it("clamps t to 0..1", () => {
    const r = new ColorRamp(["#000000", "#ffffff"]);
    expect(r.hex(-3)).toBe("#000000");
    expect(r.hex(7)).toBe("#ffffff");
    expect(r.at(-Infinity)).toEqual(r.at(0));
  });

  it("interpolates in OKLab, not sRGB: blue–red's middle is a light violet, not the dark sRGB mix", () => {
    const r = new ColorRamp(["#0000ff", "#ff0000"]);
    const mid = r.at(0.5);
    const naive = [0.5, 0, 0.5];
    expect(Math.hypot(mid[0] - naive[0], mid[1] - naive[1], mid[2] - naive[2])).toBeGreaterThan(0.1);
    // OKLab keeps the middle as light as the ends average; the sRGB mix #800080 is darker than both.
    const lum = (c: number[]) => 0.2126 * toLinear(c[0]) + 0.7152 * toLinear(c[1]) + 0.0722 * toLinear(c[2]);
    expect(lum(mid)).toBeGreaterThan(lum(naive));
    expect(r.hex(0.5)).toBe("#8c53a2");
  });

  it("colors(): 4 per value, range mapping, NaN and missing entries → the missing colour, alpha 1", () => {
    const r = new ColorRamp(["#000000", "#ffffff"]);
    const c = r.colors([0, 5, 10, NaN, Infinity]);
    expect(c).toBeInstanceOf(Float32Array);
    expect(c.length).toBe(20);
    expect([...c.slice(0, 4)]).toEqual([0, 0, 0, 1]);              // min → start
    expect([...c.slice(8, 12)]).toEqual([1, 1, 1, 1]);             // max → end
    const grey = toLinear(0x89 / 255);                             // the muted grey #898781, linear
    expect(c[12]).toBeCloseTo(grey, 5);
    expect(c[16]).toBeCloseTo(grey, 5);
    // A range of its own: 5 of 0..20 is a quarter of the way; values beyond it clamp.
    const q = r.colors([5, 40, -1], { min: 0, max: 20 });
    expect(q[0]).toBeCloseTo(toLinear(r.at(0.25)[0]), 5);
    expect(q[4]).toBe(1);
    expect(q[8]).toBe(0);
    // A missing colour of its own; sparse input counts as missing.
    const m = r.colors([1, undefined as unknown as number, 2], undefined, [1, 0, 0]);
    expect([...m.slice(4, 8)]).toEqual([1, 0, 0, 1]);
    // Equal ends put every value mid-ramp.
    expect(r.colors([3, 3])[0]).toBeCloseTo(toLinear(r.at(0.5)[0]), 5);
  });

  it("colors() are linear light, so the renderer shows hex(): the stop #3987e5 comes out as its linear channels", () => {
    const r = new ColorRamp(["#3987e5", "#ffffff"]);
    const c = r.colors([0, 1]);
    hexRgb("#3987e5").forEach((v, i) => expect(c[i]).toBeCloseTo(toLinear(v), 5));
  });

  it("diverging: its middle is the neutral grey, the arms are blue and red", () => {
    expect(ColorRamp.diverging().hex(0.5)).toBe("#383835");
    expect(ColorRamp.diverging("light").hex(0.5)).toBe("#f0efec");
    const dark = ColorRamp.diverging("dark").steps(11);
    expect(dark[0]).toBe("#9ec5f4");                                // blue 200, the light extreme on dark
    expect(dark[10]).toBe("#f8aaa3");                               // red 200
    const light = ColorRamp.diverging("light").steps(15);
    expect(light[0]).toBe("#0d366b");                               // blue 700, the dark extreme on light
    expect(light[11]).toBe("#e34948");                              // red 400 is the anchor
    expect(light[14]).toBe("#681013");
    // A symmetric range puts zero on the grey.
    const c = ColorRamp.diverging().colors([-4, 0, 4]);
    hexRgb("#383835").forEach((v, i) => expect(c[4 + i]).toBeCloseTo(toLinear(v), 5));
  });

  it("sequential: one blue, the low end receding into each mode's background", () => {
    expect(ColorRamp.sequential().steps(6)).toEqual(["#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#cde2fb"]);
    const light = ColorRamp.sequential("light");
    expect(light.hex(0)).toBe("#cde2fb");
    expect(light.hex(1)).toBe("#0d366b");
    expect(light.hex(4 / 12)).toBe("#6da7ec");                     // at(k / 12) is step 100 + 50·k
  });

  it("categorical: the 8 colours in their fixed order, a fresh array each time", () => {
    const dark = ColorRamp.categorical();
    expect(dark).toEqual(["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"]);
    expect(ColorRamp.categorical("light")).toEqual(["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]);
    dark[0] = "#000000";
    expect(ColorRamp.categorical()[0]).toBe("#3987e5");
  });

  it("reversed() runs the other way; steps() spans both ends", () => {
    const r = new ColorRamp(["#112233", "#445566", "#ddeeff"]);
    expect(r.reversed().steps(3)).toEqual(["#ddeeff", "#445566", "#112233"]);
    expect(r.steps(3)).toEqual(["#112233", "#445566", "#ddeeff"]);
    expect(r.steps(1)).toEqual(["#445566"]);
    expect(r.reversed().hex(0.3)).toBe(r.hex(0.7));
  });

  it("parses #rgb and #rrggbb, in any case, with or without the #", () => {
    expect(new ColorRamp(["#f80"]).hex(0)).toBe("#ff8800");
    expect(new ColorRamp(["#FF8800"]).hex(0)).toBe("#ff8800");
    expect(new ColorRamp(["0a0"]).hex(0)).toBe("#00aa00");
    expect(new ColorRamp(["#0a0b14"]).at(0).map((v) => Math.round(v * 255))).toEqual([10, 11, 20]);
  });

  it("refuses bad input, naming the call and the value", () => {
    expect(() => new ColorRamp([])).toThrow(/new ColorRamp: needs at least one colour stop, got \[\]/);
    expect(() => new ColorRamp(["#12"])).toThrow(/new ColorRamp \(stop 0\): bad colour "#12"/);
    expect(() => new ColorRamp(["#fff", "red"])).toThrow(/stop 1\): bad colour "red"/);
    expect(() => new ColorRamp([[1, 2, 0]])).toThrow(/bad colour \[1,2,0\]/);
    const r = ColorRamp.sequential();
    expect(() => r.at(NaN)).toThrow(/ColorRamp.at: t must be a number, got NaN/);
    expect(() => r.steps(0)).toThrow(/ColorRamp.steps: n must be a whole number ≥ 1, got 0/);
    expect(() => r.colors([1], { min: 0, max: NaN })).toThrow(/ColorRamp.colors: range must be finite/);
    expect(() => ColorRamp.sequential("night" as "dark")).toThrow(/ColorRamp.sequential: mode must be "dark" or "light", got "night"/);
  });
});
