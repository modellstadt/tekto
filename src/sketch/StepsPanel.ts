/**
 * The steps panel: a program's run (`StepTrace`) as a graph over the bottom of a view. Steps
 * read left to right as the values flow; each shows its time, what it produced and its share
 * of the run; an error is red, a step whose output nobody used is dashed. Click a step for its
 * inputs, output and code location, its geometry lights up in the view, and a note on it goes
 * to the agent with the next snapshot ("Save for agent"). Steps run inside a step are folded
 * into it.
 *
 * Mounted by `sketch()` and `appShell()` when a run recorded steps (`lab.step`, `app.step`).
 */
import type { StepRecord, StepTraceJSON } from "../core/steps/StepTrace";
import type { Theme } from "../gui/theme";

/** A person's note on a step, for the agent: the step as it ran, and what to change. */
export interface StepMark {
  step: string;
  note: string;
  name: string;
  inputs: StepRecord["inputs"];
  output: string;
  ms: number;
  src?: string;
}

/** What the panel asks of the app around it. */
export interface StepsPanelOptions {
  theme: Theme;
  /** A step was picked (or none): light up its objects in the view. */
  onSelect(step: StepRecord | null, objects: string[]): void;
  /** Save the marks for the agent (a snapshot carries them). Resolves to where it went, if anywhere. */
  onSave(marks: StepMark[]): Promise<string | undefined>;
}

const W = 172, H = 60, GAP_X = 60, GAP_Y = 14, PAD = 16;

/**
 * A run's steps (`StepTraceJSON`) as a graph over the bottom of a view, with a button to open
 * it. `sketch()` and `appShell()` mount one; an app with its own view mounts it in the view's
 * element and calls `show(trace.toJSON())` after each run.
 */
export class StepsPanel {
  readonly el = document.createElement("div");
  private pill = document.createElement("button");
  private graph = document.createElement("div");
  private details = document.createElement("div");
  private summaryEl = document.createElement("span");
  private saveBtn = document.createElement("button");
  private trace: StepTraceJSON | null = null;
  private selected: string | null = null;
  private marks: StepMark[] = [];
  private open = false;

  constructor(private host: HTMLElement, private opts: StepsPanelOptions) {
    const t = opts.theme;
    this.pill.type = "button";
    this.pill.dataset.tektoSteps = "pill";
    this.pill.style.cssText = `position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:20;display:none;
      padding:5px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(7,8,14,.85);
      backdrop-filter:blur(8px);color:${t.text};font:500 11px/1.2 ${t.font};cursor:pointer;`;
    this.pill.addEventListener("click", () => this.setOpen(true));

    this.el.dataset.tektoSteps = "panel";
    this.el.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:38%;min-height:200px;max-height:340px;z-index:20;
      display:none;flex-direction:column;background:rgba(7,8,14,.92);backdrop-filter:blur(8px);
      border-top:1px solid rgba(255,255,255,.12);color:${t.textDim};font:11px/1.45 ${t.font};`;
    const head = document.createElement("div");
    head.style.cssText = "display:flex;align-items:center;gap:10px;padding:6px 10px 6px 14px;border-bottom:1px solid rgba(255,255,255,.08);";
    const title = document.createElement("b");
    title.textContent = "Steps";
    title.style.color = t.text;
    this.summaryEl.style.cssText = "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    this.saveBtn.type = "button";
    this.saveBtn.style.cssText = button(t);
    this.saveBtn.addEventListener("click", () => void this.save());
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.title = "Hide steps";
    close.style.cssText = button(t) + "font-size:14px;padding:0 8px;";
    close.addEventListener("click", () => this.setOpen(false));
    head.append(title, this.summaryEl, this.saveBtn, close);

    const body = document.createElement("div");
    body.style.cssText = "flex:1;min-height:0;display:flex;";
    this.graph.style.cssText = "flex:1;min-width:0;overflow:auto;position:relative;";
    this.details.style.cssText = `width:280px;flex:none;overflow:auto;padding:10px 12px;border-left:1px solid rgba(255,255,255,.08);`;
    body.append(this.graph, this.details);
    this.el.append(head, body);
    host.append(this.pill, this.el);
  }

  /** Show a run's steps (`null` or no steps: nothing to show, the panel and its button go). */
  show(trace: StepTraceJSON | null): void {
    this.trace = trace && trace.steps.length ? trace : null;
    if (this.selected && !this.trace?.steps.some((s) => s.id === this.selected)) this.selected = null;
    this.paint();
  }

  /** Pick a step (from a click on its geometry), opening the panel. */
  select(id: string | null): void {
    this.selected = id;
    if (id) this.open = true;
    this.paint();
    this.notifySelect();
  }

  /** The step that drew an object (its top-level step), if any. */
  stepOfObject(objectId: string): string | undefined {
    const s = this.trace?.steps.find((r) => r.objects.includes(objectId));
    return s ? this.topOf(s.id) : undefined;
  }

  get isOpen(): boolean { return this.open && !!this.trace; }

  /** The marks not yet saved. */
  get pendingMarks(): readonly StepMark[] { return this.marks; }

  dispose(): void { this.pill.remove(); this.el.remove(); }

  // ── Drawing ──

  private setOpen(on: boolean): void {
    this.open = on;
    if (!on && this.selected) { this.selected = null; this.notifySelect(); }
    this.paint();
  }

  private topOf(id: string): string {
    const byId = new Map(this.trace?.steps.map((s) => [s.id, s]) ?? []);
    let s = byId.get(id);
    while (s?.parent && byId.has(s.parent)) s = byId.get(s.parent);
    return s?.id ?? id;
  }

  private paint(): void {
    const t = this.opts.theme;
    const trace = this.trace;
    this.pill.style.display = trace && !this.open ? "block" : "none";
    this.el.style.display = trace && this.open ? "flex" : "none";
    if (!trace) return;
    const a = trace.analysis;
    const top = trace.steps.filter((s) => !s.parent);
    this.pill.textContent = `Steps · ${top.length}${a.errors.length ? ` · ${a.errors.length} error${a.errors.length > 1 ? "s" : ""}` : ""}`;
    const slow = a.slowest[0];
    this.summaryEl.textContent = [
      `${top.length} steps`, `${a.totalMs.toFixed(1)} ms`,
      slow ? `slowest ${slow.id} (${Math.round(slow.share * 100)} %)` : "",
      a.unused.length ? `${a.unused.length} unused` : "",
      a.errors.length ? `${a.errors.length} errors` : "",
    ].filter(Boolean).join(" · ");
    this.saveBtn.style.display = this.marks.length ? "" : "none";
    this.saveBtn.textContent = `Save ${this.marks.length} mark${this.marks.length > 1 ? "s" : ""} for agent`;

    // Layout: a column per depth along the links (between top-level steps), rows in run order.
    // Links into a step inside another are that step's own wiring: its parent's inputs show them.
    const topIds = new Set(top.map((s) => s.id));
    const edges = new Map<string, { from: string; to: string; input: string }>();
    for (const e of trace.edges) {
      if (!topIds.has(e.to)) continue;
      const from = this.topOf(e.from);
      if (from !== e.to) edges.set(`${from}>${e.to}>${e.input}`, { from, to: e.to, input: e.input });
    }
    const depth = new Map<string, number>();
    for (const s of top) {
      let d = 0;
      for (const e of edges.values()) if (e.to === s.id) d = Math.max(d, (depth.get(e.from) ?? 0) + 1);
      depth.set(s.id, d);
    }
    // A link that skips columns arcs over the steps between, higher the further it jumps.
    const lift = (e: { from: string; to: string }) => {
      const span = (depth.get(e.to) ?? 0) - (depth.get(e.from) ?? 0);
      return span > 1 ? 40 + (span - 2) * 8 : 0;
    };
    const top0 = PAD + Math.min(90, Math.max(0, ...[...edges.values()].map(lift)));
    const rows = new Map<number, number>();
    const at = new Map<string, { x: number; y: number }>();
    for (const s of top) {
      const d = depth.get(s.id)!, r = rows.get(d) ?? 0;
      rows.set(d, r + 1);
      at.set(s.id, { x: PAD + d * (W + GAP_X), y: top0 + r * (H + GAP_Y) });
    }
    const width = PAD * 2 + (Math.max(...depth.values()) + 1) * (W + GAP_X) - GAP_X;
    const height = top0 + PAD + Math.max(...rows.values()) * (H + GAP_Y) - GAP_Y;

    this.graph.textContent = "";
    const canvas = document.createElement("div");
    canvas.style.cssText = `position:relative;width:${width}px;height:${height}px;`;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;";
    // A port per input that has a link, down the left of its step.
    for (const e of edges.values()) {
      const a0 = at.get(e.from), b0 = at.get(e.to);
      if (!a0 || !b0) continue;
      const target = trace.steps.find((s) => s.id === e.to)!;
      const linked = target.inputs.filter((i) => [...edges.values()].some((x) => x.to === e.to && x.input === i.name));
      const k = Math.max(0, linked.findIndex((i) => i.name === e.input));
      const y1 = a0.y + H / 2, y2 = b0.y + Math.min(H - 8, 14 + k * 12);
      const x1 = a0.x + W, x2 = b0.x, dx = Math.max(28, (x2 - x1) / 2);
      const hot = this.selected === e.from || this.selected === e.to;
      const up = Math.min(90, lift(e));
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", up
        ? `M${x1},${y1} C${x1 + 40},${y1 - up * 1.33} ${x2 - 40},${y2 - up * 1.33} ${x2},${y2}`
        : `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", hot ? "#ffffff" : "rgba(255,255,255,.35)");
      path.setAttribute("stroke-width", hot ? "1.6" : "1.1");
      svg.append(path);
      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", String(x2 - 5));
      label.setAttribute("y", String(y2 - 3));
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", hot ? "#ffffff" : "rgba(232,235,240,.55)");
      label.setAttribute("font-size", "9.5");
      label.textContent = e.input;
      svg.append(label);
    }
    canvas.append(svg);

    const own = new Map(a.slowest.map((s) => [s.id, s.share]));
    const unused = new Set(a.unused);
    for (const s of top) {
      const p = at.get(s.id)!;
      const node = document.createElement("button");
      node.type = "button";
      node.dataset.step = s.id;
      const sel = this.selected === s.id;
      const share = own.get(s.id) ?? (a.totalMs > 0 ? s.ms / a.totalMs : 0);
      node.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;width:${W}px;height:${H}px;text-align:left;cursor:pointer;
        padding:6px 9px;border-radius:6px;background:${sel ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.04)"};
        border:1px ${unused.has(s.id) ? "dashed" : "solid"} ${s.error ? "#e5484d" : sel ? "#ffffff" : "rgba(255,255,255,.18)"};
        color:${t.textDim};font:11px/1.35 ${t.font};overflow:hidden;opacity:${unused.has(s.id) ? 0.6 : 1};`;
      const marked = this.marks.some((m) => m.step === s.id) ? " ✎" : "";
      const inner = trace.steps.filter((c) => c.parent === s.id).length;
      node.innerHTML = `<div style="display:flex;gap:6px;color:${s.error ? "#ff8c8f" : t.text}"><b style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></b><span></span></div>`
        + `<div class="out" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>`
        + `<div style="position:absolute;left:9px;right:9px;bottom:6px;height:3px;background:rgba(255,255,255,.08);border-radius:2px">`
        + `<div style="height:100%;width:${Math.min(100, Math.max(2, share * 100)).toFixed(0)}%;background:#ffb020;border-radius:2px"></div></div>`;
      (node.querySelector("b") as HTMLElement).textContent = s.id + marked;
      (node.querySelector("span") as HTMLElement).textContent = `${s.ms.toFixed(1)} ms`;
      (node.querySelector(".out") as HTMLElement).textContent = s.error ? `✕ ${s.error}` : `→ ${s.output}${inner ? ` · ${inner} inside` : ""}`;
      node.title = [`${s.id}: ${s.output}`, ...s.inputs.map((i) => `  ${i.name} = ${i.summary}${i.from ? ` ← ${i.from.join(", ")}` : ""}`)].join("\n");
      node.addEventListener("click", () => this.select(this.selected === s.id ? null : s.id));
      canvas.append(node);
    }
    this.graph.append(canvas);
    // Keep the picked step in sight (it may have been picked by clicking its geometry).
    const picked = this.selected ? canvas.querySelector<HTMLElement>(`[data-step="${CSS.escape(this.selected)}"]`) : null;
    if (picked) {
      const g = this.graph, left = picked.offsetLeft, right = left + picked.offsetWidth;
      if (left < g.scrollLeft || right > g.scrollLeft + g.clientWidth) g.scrollLeft = Math.max(0, left - (g.clientWidth - picked.offsetWidth) / 2);
    }
    this.paintDetails();
  }

  private paintDetails(): void {
    const t = this.opts.theme;
    const d = this.details;
    d.textContent = "";
    const step = this.trace?.steps.find((s) => s.id === this.selected);
    if (!step) {
      d.style.color = t.textFaint;
      d.textContent = "Click a step for its inputs, output and code, and to leave a note for the agent. Click geometry to find the step that made it.";
      return;
    }
    d.style.color = t.textDim;
    const line = (label: string, value: string, strong = false) => {
      const row = document.createElement("div");
      row.style.cssText = "margin-bottom:3px;word-break:break-word;";
      const k = document.createElement("span");
      k.textContent = `${label} `;
      k.style.color = t.textFaint;
      const v = document.createElement("span");
      v.textContent = value;
      if (strong) v.style.color = t.text;
      row.append(k, v);
      d.append(row);
    };
    const h = document.createElement("div");
    h.textContent = step.id;
    h.style.cssText = `color:${t.text};font-weight:600;margin-bottom:6px;`;
    d.append(h);
    if (step.src) line("code", shortSrc(step.src));
    line("time", `${step.ms.toFixed(2)} ms`);
    for (const i of step.inputs) line(`in ${i.name}`, `${i.summary}${i.from ? ` ← ${i.from.join(", ")}` : ""}`);
    line("out", step.error ? `threw: ${step.error}` : step.output, true);
    const inner = this.trace!.steps.filter((c) => c.parent === step.id);
    if (inner.length) line("inside", `${inner.length} steps (${[...new Set(inner.map((c) => c.name))].join(", ")})`);
    if (step.objects.length) line("drew", `${step.objects.length} objects`);

    const note = document.createElement("textarea");
    note.placeholder = "What should change in this step?";
    note.rows = 3;
    const existing = this.marks.find((m) => m.step === step.id);
    note.value = existing?.note ?? "";
    note.style.cssText = `width:100%;box-sizing:border-box;margin-top:8px;resize:vertical;background:rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.15);border-radius:5px;color:${t.text};font:11px/1.4 ${t.font};padding:5px 7px;`;
    note.addEventListener("keydown", (e) => e.stopPropagation());        // typing is not a shortcut
    const mark = document.createElement("button");
    mark.type = "button";
    mark.textContent = existing ? "Update note" : "Mark step for agent";
    mark.style.cssText = button(t) + "margin-top:6px;";
    mark.addEventListener("click", () => {
      const text = note.value.trim();
      this.marks = this.marks.filter((m) => m.step !== step.id);
      if (text) this.marks.push({ step: step.id, note: text, name: step.name, inputs: step.inputs, output: step.output, ms: step.ms, ...(step.src ? { src: step.src } : {}) });
      this.paint();
    });
    d.append(note, mark);
  }

  private async save(): Promise<void> {
    if (!this.marks.length) return;
    this.saveBtn.disabled = true;
    try {
      const where = await this.opts.onSave(this.marks);
      this.marks = [];
      this.paint();
      this.summaryEl.textContent = where ? `Saved for the agent: ${where}` : "Saved for the agent";
    } finally {
      this.saveBtn.disabled = false;
    }
  }

  private notifySelect(): void {
    const trace = this.trace;
    if (!trace || !this.selected) { this.opts.onSelect(null, []); return; }
    const step = trace.steps.find((s) => s.id === this.selected) ?? null;
    // Its own objects and those of the steps inside it.
    const ids = new Set<string>([this.selected]);
    for (const s of trace.steps) if (s.parent && ids.has(s.parent)) ids.add(s.id);
    this.opts.onSelect(step, trace.steps.filter((s) => ids.has(s.id)).flatMap((s) => s.objects));
  }
}

function button(t: Theme): string {
  return `cursor:pointer;padding:3px 9px;border-radius:5px;border:1px solid rgba(255,255,255,.18);background:transparent;
    color:${t.text};font:11px/1.4 ${t.font};`;
}

/** "http://localhost:5173/pages/steps.ts?t=1:40:9" → "steps.ts:40" (the dev server maps it properly in a snapshot). */
function shortSrc(src: string): string {
  const m = /([^/?#]+?)(?:\?[^:]*)?:(\d+):\d+$/.exec(src);
  return m ? `${m[1]}:${m[2]}` : src;
}
