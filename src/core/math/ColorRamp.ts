/**
 * Colour ramps for analysis values: a scale over 0..1 built from stops and interpolated in
 * OKLab, so equal steps in t look like equal steps in colour. The built-in ramps follow the
 * data-viz rules:
 *
 *   sequential   magnitude — ONE hue (blue), light→dark. The near-zero end recedes toward the
 *                background: low is the light step on a light background and the dark step on
 *                a dark one. Dark mode is its own selected steps, not a flip of light.
 *   diverging    polarity — blue and red arms, as many steps each, meeting at a NEUTRAL GREY
 *                (never a hue at the midpoint). The red arm sits on the blue arm's lightness.
 *   categorical  identity — 8 colours in a fixed order. Never cycled, never generated: past 8,
 *                fold the rest into "other".
 *
 * No rainbow. No DOM, no three.js: the legend that shows a ramp is `colorLegend` in "tekto".
 */

/** An sRGB colour, each channel in 0..1. */
export type RGB = [number, number, number];

type Lab = [number, number, number];
type Mode = "dark" | "light";

// ── The palette (hex as documented; see the comments for what is derived) ──

/** Blue, steps 100 → 700 (every 50): the sequential hue and the diverging cool arm. */
const BLUE = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5",
  "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
];
/**
 * Red, steps 100 → 700, derived for the diverging warm arm: each step has the OKLCH lightness
 * of the blue step of the same number, the hue of #e34948 (24.9°) and the blue step's chroma
 * × 1.184 (gamut-clipped at 100), so step 400 IS #e34948 and step 350 is within ΔE 0.8 of the
 * dark categorical red #e66767.
 */
const RED = [
  "#ffd4d0", "#fac0ba", "#f8aaa3", "#f3958d", "#ef7e76", "#e86761", "#e34948",
  "#d33739", "#bc2f32", "#a82428", "#921d21", "#7e1419", "#681013",
];
/** Step 100 + 50·i of a 13-step ramp. */
const step = (ramp: string[], s: number) => ramp[(s - 100) / 50];
/** The diverging midpoint: a neutral grey near each mode's background. */
const MID = { light: "#f0efec", dark: "#383835" };
/** Missing values: the muted ink grey — no hue, and neither diverging midpoint. */
const MISSING = "#898781";

const CATEGORICAL = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

// ── Colour conversions: sRGB ↔ linear ↔ OKLab (Björn Ottosson, 2020) ──

const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
const clamp01 = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;

function oklab([r, g, b]: RGB): Lab {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** OKLab → linear-light RGB, clipped to the gamut. */
function linearFromOklab([L, a, b]: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    clamp01(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp01(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp01(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A stop as sRGB 0..1: "#rgb", "#rrggbb" (the # optional) or [r, g, b] in 0..1. */
function parseStop(c: string | RGB, call: string): RGB {
  if (typeof c === "string") {
    const m = HEX.exec(c.trim());
    if (!m) throw new Error(`${call}: bad colour ${JSON.stringify(c)} — need "#rgb", "#rrggbb" or [r, g, b] in 0..1`);
    const h = m[1].length === 3 ? m[1].replace(/./g, (d) => d + d) : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
  }
  if (!Array.isArray(c) || c.length !== 3 || !c.every((v) => typeof v === "number" && v >= 0 && v <= 1)) {
    throw new Error(`${call}: bad colour ${JSON.stringify(c)} — need "#rgb", "#rrggbb" or [r, g, b] in 0..1`);
  }
  return [c[0], c[1], c[2]];
}

const hexOf = (c: RGB) => "#" + c.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0")).join("");

function modeOf(mode: unknown, call: string): Mode {
  if (mode !== "dark" && mode !== "light") throw new Error(`${call}: mode must be "dark" or "light", got ${JSON.stringify(mode)}`);
  return mode;
}

/**
 * A colour scale over 0..1 built from stops, interpolated in OKLab (perceptually even, unlike
 * a mix in sRGB, which dips grey and dark between distant hues).
 *
 *   const ramp = ColorRamp.sequential();                       // blue, for the dark 3D view
 *   mesh.setColors(ramp.colors(heights));                      // per node, range = min..max
 *   scene.addMesh(mesh);                                       // drawn in its node colours
 *   ramp.hex(0.5);                                             // "#5598e7" (step 350), for CSS
 *
 * A mesh with node colours is drawn in them (`addMesh`, `lab.mesh`, `addFlatMesh`), not in its
 * style colour.
 *
 * Lit faces darken their colour; the renderer config `flatLighting: "plain"` (e.g.
 * `appShell({ renderer: { flatLighting: "plain" } })`) keeps a face toward the sky true to the
 * legend. Show the scale with `colorLegend` (from "tekto").
 *
 * @experimental No app uses this yet; it may still change.
 */
export class ColorRamp {
  private readonly rgb: RGB[];
  private readonly lab: Lab[];

  /** A ramp through `stops`, evenly spaced over 0..1: hex strings or [r, g, b] in 0..1 (sRGB). */
  constructor(stops: (string | RGB)[]) {
    if (!Array.isArray(stops) || stops.length === 0) {
      throw new Error(`new ColorRamp: needs at least one colour stop, got ${JSON.stringify(stops)}`);
    }
    this.rgb = stops.map((s, i) => parseStop(s, `new ColorRamp (stop ${i})`));
    this.lab = this.rgb.map(oklab);
  }

  /** The colour at `t` (clamped to 0..1), as sRGB 0..1. */
  at(t: number): RGB {
    return this.srgbAt(t, "ColorRamp.at");
  }

  /** The colour at `t` (clamped to 0..1) as "#rrggbb". */
  hex(t: number): string {
    return hexOf(this.srgbAt(t, "ColorRamp.hex"));
  }

  /**
   * Per-value RGBA (length 4·n, alpha 1), ready for `Mesh.setColors` when the values are per
   * node; NaN, ±Infinity or a missing entry get `missing` (default the muted grey #898781).
   * `range` maps `min` to the ramp's start and `max` to its end (default the finite values'
   * min..max; equal ends put every value mid-ramp). For a diverging ramp pass a range
   * symmetric about your baseline, `{ min: -m, max: m }`, so the grey sits at zero.
   *
   * The channels are LINEAR light, which is how the renderer reads node colours (three.js
   * takes vertex colours as linear and encodes them for the screen), so the view shows the
   * same colours as `hex()` and the legend. `at()` and `hex()` are sRGB, for CSS and canvas.
   */
  colors(values: ArrayLike<number>, range?: { min: number; max: number }, missing?: RGB): Float32Array {
    const n = values.length;
    let min = Infinity, max = -Infinity;
    if (range) {
      if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) {
        throw new Error(`ColorRamp.colors: range must be finite, got { min: ${range.min}, max: ${range.max} }`);
      }
      ({ min, max } = range);
    } else {
      for (let i = 0; i < n; i++) {
        const v = values[i];
        if (Number.isFinite(v)) { if (v < min) min = v; if (v > max) max = v; }
      }
    }
    const lost = parseStop(missing ?? MISSING, "ColorRamp.colors (missing)").map(toLinear);
    const span = max - min;
    const out = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = values[i];
      const c = Number.isFinite(v) ? this.linearAt(span !== 0 ? (v - min) / span : 0.5) : lost;
      out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 1;
    }
    return out;
  }

  /** A CSS `linear-gradient` of the ramp (sampled densely, so CSS's sRGB mix follows the OKLab ramp), e.g. for a legend bar. */
  css(direction = "to right"): string {
    const n = Math.max(2, (this.lab.length - 1) * 4 + 1);
    const stops: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      stops.push(`${this.hex(t)} ${+(t * 100).toFixed(2)}%`);
    }
    return `linear-gradient(${direction}, ${stops.join(", ")})`;
  }

  /** `n` evenly spaced hex colours from start to end (one: the middle), for an ordinal or stepped scale. */
  steps(n: number): string[] {
    if (!Number.isInteger(n) || n < 1) throw new Error(`ColorRamp.steps: n must be a whole number ≥ 1, got ${n}`);
    if (n === 1) return [this.hex(0.5)];
    return Array.from({ length: n }, (_, i) => this.hex(i / (n - 1)));
  }

  /** The same ramp run the other way. */
  reversed(): ColorRamp {
    return new ColorRamp([...this.rgb].reverse());
  }

  /**
   * Magnitude: blue, one hue, its near-zero end receding into the background. `"dark"`
   * (default; tekto's 3D view is dark) runs from step 600 #184f95 (low) up to step 100 #cde2fb
   * (high), 11 stops; `"light"` from step 100 (low) to step 700 #0d366b (high), 13 stops, so
   * `at(k / 12)` is step 100 + 50·k. As separate marks on a light surface (ordinal classes)
   * start at step 300 (t = 0.33), where a class still clears 2:1 against the background.
   */
  static sequential(mode: Mode = "dark"): ColorRamp {
    return modeOf(mode, "ColorRamp.sequential") === "light" ? new ColorRamp(BLUE) : new ColorRamp(BLUE.slice(0, 11).reverse());
  }

  /**
   * Polarity: blue (low) – neutral grey (t = 0.5) – red (high), the same number of steps on
   * each arm and the two arms on the same lightness. `"dark"` (default): steps 200 → 600 of
   * each arm meeting at #383835, extremes light; `"light"`: steps 700 → 100 meeting at
   * #f0efec, extremes dark. Map with a range symmetric about the baseline.
   */
  static diverging(mode: Mode = "dark"): ColorRamp {
    const light = modeOf(mode, "ColorRamp.diverging") === "light";
    const arm = light ? [700, 600, 500, 400, 300, 200, 100] : [200, 300, 400, 500, 600];
    return new ColorRamp([...arm.map((s) => step(BLUE, s)), MID[light ? "light" : "dark"], ...[...arm].reverse().map((s) => step(RED, s))]);
  }

  /** The 8 categorical colours in their fixed order (blue, orange, aqua, yellow, magenta, green, violet, red); assign in order, fold past 8 into "other". */
  static categorical(mode: Mode = "dark"): string[] {
    return [...CATEGORICAL[modeOf(mode, "ColorRamp.categorical")]];
  }

  /** sRGB at t: the stop itself where t lands on one, else the OKLab mix of the two around it. */
  private srgbAt(t: number, call: string): RGB {
    const [i, f] = this.locate(t, call);
    return f === 0 ? [...this.rgb[i]] : this.mix(i, f).map(toSrgb) as RGB;
  }

  private linearAt(t: number): RGB {
    const [i, f] = this.locate(t, "ColorRamp.colors");
    return f === 0 ? this.rgb[i].map(toLinear) as RGB : this.mix(i, f);
  }

  /** The stop before t (clamped to 0..1) and how far t is past it, 0 ≤ f < 1. */
  private locate(t: number, call: string): [number, number] {
    if (typeof t !== "number" || Number.isNaN(t)) throw new Error(`${call}: t must be a number, got ${t}`);
    const k = this.lab.length - 1, x = clamp01(t) * k, i = Math.floor(x);
    return i >= k ? [k, 0] : [i, x - i];
  }

  /** Linear RGB a share `f` of the way from stop i to stop i + 1, mixed in OKLab. */
  private mix(i: number, f: number): RGB {
    const a = this.lab[i], b = this.lab[i + 1];
    return linearFromOklab([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
  }
}
