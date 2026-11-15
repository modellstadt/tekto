/**
 * Steps: a program read as the steps it ran. Code that wraps its parts in `step(name, inputs,
 * fn)` — by hand, or as an AI writes it — gets recorded as it runs: each step's inputs, what it
 * produced, how long it took, an error, where in the code it was called, and (in an app) the
 * objects it drew. Which step's output fed which step's input is read off the values themselves,
 * so the graph needs no parsing and no declared wiring.
 *
 *   const trace = new StepTrace();
 *   const seeds = trace.step("seeds", { count: 40 }, ({ count }) => scatter(count));
 *   const cells = trace.step("cells", { seeds }, ({ seeds }) => Voronoi2D.cells(seeds));
 *   trace.edges();      // [{ from: "seeds", to: "cells", input: "seeds" }]
 *   trace.analyse();    // slowest steps, the slowest chain, outputs nobody used, errors
 *
 * The record is what a person and an agent read together: the steps panel draws it, and a
 * snapshot (markup.json) carries it, with the notes a person left on steps for the agent.
 */

/** One input of a step: its name, what it was, and the step that produced it (if one did). */
export interface StepInput {
  name: string;
  /** What the value was: `"Array(240) of Vec2"`, `"Mesh, 1,204 faces"`, `"0.8"`. */
  summary: string;
  /** The id of the step whose output this is (or contains). */
  from?: string[];
}

/** A step as it ran. */
export interface StepRecord {
  /** Unique in the run: the name, and `#2`, `#3` … when the same name runs again. */
  id: string;
  name: string;
  inputs: StepInput[];
  /** What it produced, as `describeValue` says it. */
  output: string;
  /** Wall time, milliseconds, including the steps inside it. */
  ms: number;
  /** The message, when it threw (the error is thrown on to the caller). */
  error?: string;
  /** Where it was called: "url:line:col", which the dev server turns into "file.ts:line". */
  src?: string;
  /** Scene ids of the objects drawn while it ran (and not inside a step within it). */
  objects: string[];
  /** The step it ran inside. */
  parent?: string;
}

/** A link in the graph: `from`'s output went into `to`'s input `input`. */
export interface StepEdge {
  from: string;
  to: string;
  input: string;
}

/** What `StepTrace.analyse()` finds. */
export interface StepAnalysis {
  /** Wall time of the top-level steps together, milliseconds. */
  totalMs: number;
  /** The three slowest steps (own time: without the steps inside them), with their share of the total. */
  slowest: { id: string; ms: number; share: number }[];
  /** The chain of linked steps that takes longest, and its time. */
  slowestChain: { ids: string[]; ms: number };
  /** Steps whose output (an object) no later step used and which drew nothing: work for nothing, or a missing link. */
  unused: string[];
  errors: { id: string; error: string }[];
}

/** The whole record, as plain JSON: what a snapshot and an agent get. */
export interface StepTraceJSON {
  steps: StepRecord[];
  edges: StepEdge[];
  analysis: StepAnalysis;
}

/** How deep into an array output the trace looks for values a later step uses. */
const ELEMENT_LIMIT = 20000;

/**
 * Records the steps of one run. Make a new one for each run (the harnesses do: `lab.step`,
 * `app.step`). Steps can sit inside steps.
 */
export class StepTrace {
  readonly steps: StepRecord[] = [];
  private byOutput = new WeakMap<object, string>();
  /** Steps whose output was an object, so a later use of it can be seen (a number can't be followed). */
  private followed = new Set<string>();
  private running: StepRecord[] = [];
  private counts = new Map<string, number>();

  /**
   * Run `fn(inputs)` as the step `name` and record it. Name the inputs (`{ seeds, spacing }`):
   * they are the step's ports, and an input that is (or holds) an earlier step's output links
   * the two. Returns what `fn` returns; an error is recorded and thrown on.
   */
  step<I extends Record<string, unknown>, T>(name: string, inputs: I, fn: (inputs: I) => T, opts: { src?: string } = {}): T {
    const n = (this.counts.get(name) ?? 0) + 1;
    this.counts.set(name, n);
    const record: StepRecord = {
      id: n === 1 ? name : `${name}#${n}`,
      name,
      inputs: Object.entries(inputs).map(([k, v]) => {
        const from = this.originsOf(v);
        return { name: k, summary: describeValue(v), ...(from.length ? { from } : {}) };
      }),
      output: "",
      ms: 0,
      objects: [],
      ...(opts.src ? { src: opts.src } : {}),
      ...(this.running.length ? { parent: this.running[this.running.length - 1].id } : {}),
    };
    this.steps.push(record);
    this.running.push(record);
    const t0 = now();
    try {
      const out = fn(inputs);
      record.output = describeValue(out);
      this.claim(out, record.id);
      return out;
    } catch (e) {
      record.error = e instanceof Error ? e.message : String(e);
      record.output = "(threw)";
      throw e;
    } finally {
      record.ms = now() - t0;
      this.running.pop();
    }
  }

  /** The step running now (the innermost), if any: a harness gives it the objects drawn now. */
  get current(): StepRecord | undefined {
    return this.running[this.running.length - 1];
  }

  /** Every link: which step's output went into which step's input. */
  edges(): StepEdge[] {
    const out: StepEdge[] = [];
    for (const s of this.steps) {
      for (const input of s.inputs) for (const from of input.from ?? []) out.push({ from, to: s.id, input: input.name });
    }
    return out;
  }

  /** The slowest steps and chain, unused outputs and errors. */
  analyse(): StepAnalysis {
    const edges = this.edges();
    const byId = new Map(this.steps.map((s) => [s.id, s]));
    const childMs = new Map<string, number>();
    for (const s of this.steps) if (s.parent) childMs.set(s.parent, (childMs.get(s.parent) ?? 0) + s.ms);
    const own = (s: StepRecord) => Math.max(0, s.ms - (childMs.get(s.id) ?? 0));
    const totalMs = this.steps.filter((s) => !s.parent).reduce((t, s) => t + s.ms, 0);
    const slowest = [...this.steps].sort((a, b) => own(b) - own(a)).slice(0, 3)
      .map((s) => ({ id: s.id, ms: round(own(s)), share: totalMs > 0 ? round(own(s) / totalMs) : 0 }));

    // The slowest chain: the path through the links with the most own time (steps run in order,
    // so every link points forward and one pass in run order finds it).
    const best = new Map<string, { ms: number; prev?: string }>();
    for (const s of this.steps) {
      let base: { ms: number; prev?: string } = { ms: 0 };
      for (const e of edges) {
        if (e.to !== s.id) continue;
        const b = best.get(e.from);
        if (b && b.ms > base.ms) base = { ms: b.ms, prev: e.from };
      }
      best.set(s.id, { ms: base.ms + own(s), prev: base.prev });
    }
    let end: string | undefined;
    for (const [id, b] of best) if (!end || b.ms > best.get(end)!.ms) end = id;
    const chain: string[] = [];
    for (let id = end; id; id = best.get(id)?.prev) chain.unshift(id);

    const used = new Set(edges.map((e) => e.from));
    const drew = (s: StepRecord): boolean => s.objects.length > 0 || this.steps.some((c) => c.parent === s.id && drew(c));
    const unused = this.steps
      .filter((s) => this.followed.has(s.id) && !s.error && !used.has(s.id) && !drew(s)
        && byId.get(s.id) !== this.steps[this.steps.length - 1] && !(s.parent && used.has(s.parent)))
      .map((s) => s.id);

    return {
      totalMs: round(totalMs),
      slowest,
      slowestChain: { ids: chain, ms: round(end ? best.get(end)!.ms : 0) },
      unused,
      errors: this.steps.filter((s) => s.error).map((s) => ({ id: s.id, error: s.error! })),
    };
  }

  toJSON(): StepTraceJSON {
    return { steps: this.steps.map((s) => ({ ...s, ms: round(s.ms) })), edges: this.edges(), analysis: this.analyse() };
  }

  /**
   * Remember an output (and the objects in it, one level down) as this step's. The latest step
   * to hand a value on owns it: a point a filter passed through links from the filter, not from
   * the step that first made it.
   */
  private claim(out: unknown, id: string): void {
    if (out === null || typeof out !== "object") return;
    this.followed.add(id);
    this.byOutput.set(out, id);
    if (Array.isArray(out)) {
      for (let i = 0; i < out.length && i < ELEMENT_LIMIT; i++) {
        const v = out[i];
        if (v !== null && typeof v === "object") this.byOutput.set(v, id);
      }
    }
  }

  /** The steps a value came from: itself, or (for an array) the values in it. */
  private originsOf(v: unknown): string[] {
    if (v === null || typeof v !== "object") return [];
    const direct = this.byOutput.get(v);
    if (direct) return [direct];
    if (!Array.isArray(v)) return [];
    const found = new Set<string>();
    for (let i = 0; i < v.length && i < ELEMENT_LIMIT; i++) {
      const e = v[i];
      if (e !== null && typeof e === "object") {
        const o = this.byOutput.get(e);
        if (o) found.add(o);
      }
    }
    return [...found];
  }
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const round = (v: number) => Math.round(v * 100) / 100;
const num = (v: number) => (Number.isInteger(v) ? v.toLocaleString("en-US") : String(Math.round(v * 1000) / 1000));

/**
 * A value in a few words, as a step's port shows it: `"0.8"`, `"Array(240) of Vec2"`,
 * `"Mesh, 1,204 faces"`, `"{ cells, sites }"`. Never the data itself: it must stay short
 * whatever the size.
 */
export function describeValue(v: unknown): string {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "number") return num(v);
  if (typeof v === "string") return v.length > 40 ? `"${v.slice(0, 37)}…"` : JSON.stringify(v);
  if (typeof v === "boolean") return String(v);
  if (typeof v === "function") return `function ${v.name || "(anonymous)"}`;
  if (Array.isArray(v)) {
    if (!v.length) return "Array(0)";
    const kinds = new Set(v.slice(0, 50).map(kindOf));
    const of = kinds.size === 1 ? ` of ${[...kinds][0]}` : "";
    if (kinds.size === 1 && kinds.has("number")) {
      let lo = Infinity, hi = -Infinity;
      for (const x of v as number[]) { if (x < lo) lo = x; if (x > hi) hi = x; }
      return `Array(${num(v.length)}) of number, ${num(lo)}–${num(hi)}`;
    }
    return `Array(${num(v.length)})${of}`;
  }
  if (v instanceof Map) return `Map(${num(v.size)})`;
  if (v instanceof Set) return `Set(${num(v.size)})`;
  const o = v as Record<string, unknown> & { constructor?: { name?: string } };
  const type = o.constructor?.name;
  if (type === "Mesh" && typeof o.faceCount === "number") return `Mesh, ${num(o.faceCount as number)} faces`;
  if ((type === "Vec2" || type === "Vec3") && typeof o.x === "number") {
    return `${type}(${[o.x, o.y, o.z].filter((c) => typeof c === "number").map((c) => num(c as number)).join(", ")})`;
  }
  if (type && type !== "Object") return type;
  const keys = Object.keys(o);
  return `{ ${keys.slice(0, 5).join(", ")}${keys.length > 5 ? ", …" : ""} }`;
}

function kindOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "Array";
  if (typeof v === "object") return (v as { constructor?: { name?: string } }).constructor?.name ?? "object";
  return typeof v;
}
