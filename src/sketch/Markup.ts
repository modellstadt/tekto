/**
 * Markup — draw on the viewport to tell an AI (or a colleague) what to change.
 *
 * The point is not the drawing, it is what the drawing is resolved to. A circle
 * in a screenshot makes the reader guess which object, where in space, and which
 * line of code. Here every mark is resolved at the moment it is drawn:
 *
 *   - the strokes are kept as vectors (screen space), simplified for the file;
 *   - each mark is raycast into the scene: which objects it touches or encloses
 *     (with their layer, label and the source line that created them), and the
 *     world points it lands on;
 *   - the same marks are burnt into a PNG with big numbers, for a vision model.
 *
 * A capture is a bundle — `view.png` (marks), `clean.png` (no marks) and
 * `markup.json` (camera, params, marks, scene summary). It is POSTed to the dev
 * server (tools/markup-vite-plugin.mjs writes it to `.tekto/markup/`); without
 * the plugin the three files are downloaded instead.
 *
 * `window.__tekto.snapshot()` produces the same bundle without any marks, so an
 * agent driving a headless browser (tools/snap.mjs) sees what a person sees.
 */
import type { Vec3 } from "../core/math/vectors";

type Pt = [number, number];

/** What the overlay needs from its sketch. Kept narrow so the overlay stays testable. */
export interface MarkupHost {
  /** Positioned element that the overlay covers (the viewport wrapper). */
  viewport: HTMLElement;
  hitAt(clientX: number, clientY: number): { id: string; point: Vec3 } | null;
  groundAt(clientX: number, clientY: number): Vec3 | null;
  describe(id: string): MarkupObjectRef | null;
  /** Render and read back the 3D view (no overlay). */
  snapshotPng(): string;
  /** Camera, params and scene summary, as of now. */
  context(): Record<string, unknown>;
  /** Record creation sites for objects (costs a stack trace per object, so only while needed). */
  setTracking(on: boolean): void;
  title: string;
}

export interface MarkupObjectRef {
  id: string;
  type: string;
  layer?: string;
  label?: string;
  tag?: string;
  color?: string;
  /** Where the object was created, e.g. "pages/primitives.ts:12" (resolved by the dev server). */
  src?: string;
}

export type MarkKind = "point" | "loop" | "line" | "cross" | "stroke";

interface Mark {
  n: number;
  strokes: Pt[][];
  note: string;
  resolved?: ResolvedMark;
}

interface ResolvedMark {
  kind: MarkKind;
  hits: Array<MarkupObjectRef & { share: number }>;
  world: Record<string, number[] | number[][]>;
  summary: string;
}

export interface MarkupCaptureOptions {
  /** Overall instruction, written to markup.json and the PNG legend. */
  note?: string;
  /** POST to the dev server (default true); false only returns the bundle. */
  save?: boolean;
  /** Short word for the folder name, e.g. "snap". */
  label?: string;
}

export interface MarkupBundle {
  markup: Record<string, unknown>;
  viewPng: string;
  cleanPng: string;
  /** Folder the dev server wrote to, if it did. */
  dir?: string;
}

const INK = "#ff00d4";         // a colour no model uses, so marks never read as geometry
const ENDPOINT = "/__tekto/markup";

export class MarkupOverlay {
  private host: MarkupHost;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bar: HTMLDivElement;
  private noteBox: HTMLInputElement;
  private status: HTMLSpanElement;
  private chips: HTMLDivElement;
  private toggleBtn: HTMLButtonElement;
  private marks: Mark[] = [];
  private drawing: Pt[] | null = null;
  private active = false;
  private onKey = (e: KeyboardEvent) => this.handleKey(e);

  constructor(host: MarkupHost) {
    this.host = host;
    const vp = host.viewport;

    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:20;cursor:crosshair;touch-action:none;display:none;";
    vp.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;

    this.chips = document.createElement("div");
    this.chips.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:21;display:none;";
    vp.appendChild(this.chips);

    const btnCss = "font:12px system-ui,sans-serif;padding:5px 10px;border-radius:5px;border:1px solid #d0d0d6;background:#fff;color:#222;cursor:pointer;";
    this.toggleBtn = document.createElement("button");
    this.toggleBtn.textContent = "✎ Markup";
    this.toggleBtn.title = "Draw on the view to give instructions (saved as screenshot + JSON)";
    this.toggleBtn.style.cssText = `position:absolute;top:10px;right:10px;z-index:22;${btnCss}`;
    this.toggleBtn.addEventListener("click", () => this.setActive(!this.active));
    vp.appendChild(this.toggleBtn);

    this.bar = document.createElement("div");
    this.bar.style.cssText = "position:absolute;top:10px;right:100px;z-index:22;display:none;gap:6px;align-items:center;background:#fff;border:1px solid #d0d0d6;border-radius:7px;padding:5px;box-shadow:0 2px 8px rgba(0,0,0,.12);";
    this.noteBox = document.createElement("input");
    this.noteBox.placeholder = "Instruction for the whole view…";
    this.noteBox.style.cssText = "font:12px system-ui,sans-serif;width:260px;padding:5px 8px;border:1px solid #d0d0d6;border-radius:5px;";
    this.noteBox.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") void this.save(); });
    const mk = (label: string, title: string, fn: () => void) => {
      const b = document.createElement("button");
      b.textContent = label; b.title = title; b.style.cssText = btnCss;
      b.addEventListener("click", fn);
      return b;
    };
    this.status = document.createElement("span");
    this.status.style.cssText = "font:11px system-ui,sans-serif;color:#666;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    this.bar.append(
      this.noteBox,
      mk("Undo", "Remove last mark (⌘Z)", () => this.undo()),
      mk("Clear", "Remove all marks", () => { this.marks = []; this.redraw(); }),
      mk("Save", "Save view.png + markup.json (⌘S)", () => void this.save()),
      this.status,
    );
    vp.appendChild(this.bar);

    this.canvas.addEventListener("pointerdown", (e) => this.down(e));
    this.canvas.addEventListener("pointermove", (e) => this.move(e));
    this.canvas.addEventListener("pointerup", (e) => this.up(e));
  }

  setActive(on: boolean) {
    if (on === this.active) return;
    this.active = on;
    this.host.setTracking(on);
    this.canvas.style.display = on ? "block" : "none";
    this.chips.style.display = on ? "block" : "none";
    this.bar.style.display = on ? "flex" : "none";
    this.toggleBtn.textContent = on ? "Done" : "✎ Markup";
    if (on) {
      this.resize();
      window.addEventListener("keydown", this.onKey, true);
      this.setStatus("Drag to mark · Shift adds to the last mark");
    } else {
      window.removeEventListener("keydown", this.onKey, true);
      // Marks are screen-space: once the camera moves they point at nothing.
      this.marks = [];
      this.redraw();
    }
  }

  dispose() {
    window.removeEventListener("keydown", this.onKey, true);
    this.canvas.remove(); this.chips.remove(); this.bar.remove(); this.toggleBtn.remove();
  }

  // ── Input ──

  private local(e: PointerEvent): Pt {
    const r = this.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  private down(e: PointerEvent) {
    if (e.button !== 0) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.drawing = [this.local(e)];
    // Shift continues the previous mark (an arrow head, a second loop, a cross).
    if (!(e.shiftKey && this.marks.length)) {
      this.marks.push({ n: this.marks.length + 1, strokes: [], note: "" });
    }
    this.marks[this.marks.length - 1].strokes.push(this.drawing);
  }

  private move(e: PointerEvent) {
    if (!this.drawing) return;
    const p = this.local(e);
    const q = this.drawing[this.drawing.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2) { this.drawing.push(p); this.redraw(); }
  }

  private up(_e: PointerEvent) {
    if (!this.drawing) return;
    this.drawing = null;
    const mark = this.marks[this.marks.length - 1];
    mark.resolved = this.resolve(mark);
    this.redraw();
    if (mark.strokes.length === 1) this.askNote(mark);
  }

  private handleKey(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); e.stopPropagation(); void this.save(); }
    else if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.stopPropagation(); this.undo(); }
    else if (e.key === "Escape") { e.stopPropagation(); this.setActive(false); }
  }

  private undo() { this.marks.pop(); this.redraw(); }

  /** A small input at the mark's badge; Enter keeps it, Escape leaves the mark without a note. */
  private askNote(mark: Mark) {
    const [x, y] = badgeAt(mark);
    const inp = document.createElement("input");
    inp.placeholder = `note for ${mark.n}…`;
    inp.style.cssText = `position:absolute;left:${x + 16}px;top:${y - 12}px;z-index:23;font:12px system-ui,sans-serif;width:200px;padding:4px 7px;border:2px solid ${INK};border-radius:5px;background:#fff;`;
    let closed = false;   // Enter removes the input, which fires blur: finish once
    const done = () => { if (closed) return; closed = true; mark.note = inp.value.trim(); inp.remove(); this.redraw(); };
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") done();
      if (e.key === "Escape") { inp.value = mark.note; done(); }
    });
    inp.addEventListener("blur", done);
    this.host.viewport.appendChild(inp);
    setTimeout(() => inp.focus(), 0);
  }

  // ── Resolving a mark against the scene ──

  private resolve(mark: Mark): ResolvedMark {
    const r = this.canvas.getBoundingClientRect();
    const ray = (p: Pt) => this.host.hitAt(r.left + p[0], r.top + p[1]);
    const ground = (p: Pt) => this.host.groundAt(r.left + p[0], r.top + p[1]);
    const kind = classify(mark.strokes);
    const counts = new Map<string, number>();
    const points: Vec3[] = [];
    let samples = 0;
    const hit = (p: Pt) => {
      samples++;
      const h = ray(p);
      if (!h) return null;
      counts.set(h.id, (counts.get(h.id) ?? 0) + 1);
      points.push(h.point);
      return h;
    };

    const world: ResolvedMark["world"] = {};
    const all = mark.strokes.flat();
    if (kind === "loop") {
      // Sample the enclosed area: a loop means "the things inside".
      const ring = mark.strokes[0];
      for (const p of gridInside(ring, 150)) hit(p);
      if (points.length) world.centroid = round3(mean(points));
      if (points.length) world.bounds = bounds(points).map(round3);
    } else if (kind === "point") {
      const h = hit(all[0]);
      const g = h?.point ?? ground(all[0]);
      if (g) world.at = round3(g);
    } else {
      // Lines and free strokes: what they run over, and where they start and end.
      for (const s of mark.strokes) for (const p of resample(s, 8, 80)) hit(p);
      const s0 = mark.strokes[0];
      const a = ray(s0[0])?.point ?? ground(s0[0]);
      const b = ray(s0[s0.length - 1])?.point ?? ground(s0[s0.length - 1]);
      if (a) world.from = round3(a);
      if (b) world.to = round3(b);
      if (a && b) world.length = [+Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z).toFixed(4)];
    }

    const hits = [...counts.entries()]
      .sort((p, q) => q[1] - p[1])
      .filter(([, c], i) => i < 12 && (c >= 2 || samples <= 3 || i === 0))
      .map(([id, c]) => ({ ...(this.host.describe(id) ?? { id, type: "?" }), share: +(c / Math.max(1, samples)).toFixed(3) }));

    return { kind, hits, world, summary: summarize(kind, hits) };
  }

  // ── Drawing ──

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.host.viewport.clientWidth, h = this.host.viewport.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.redraw();
  }

  private redraw() {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    drawMarks(ctx, this.marks);
    this.chips.innerHTML = "";
    for (const m of this.marks) {
      if (!m.resolved) continue;
      const [x, y] = badgeAt(m);
      const chip = document.createElement("div");
      chip.textContent = (m.note ? `${m.note} — ` : "") + m.resolved.summary;
      chip.style.cssText = `position:absolute;left:${x + 16}px;top:${y + 14}px;font:11px system-ui,sans-serif;color:#222;background:rgba(255,255,255,.9);border:1px solid #ddd;border-radius:4px;padding:2px 6px;max-width:320px;`;
      this.chips.appendChild(chip);
    }
  }

  private setStatus(s: string) { this.status.textContent = s; this.status.title = s; }

  // ── Capture ──

  private async save() {
    this.setStatus("Saving…");
    try {
      const b = await this.capture({ note: this.noteBox.value.trim() });
      this.setStatus(b.dir ? `Saved → ${b.dir}` : "Downloaded (no dev-server plugin)");
    } catch (e) {
      this.setStatus(`Save failed: ${e}`);
    }
  }

  /** Build the bundle for the current view and marks; save it unless `save: false`. */
  async capture(opts: MarkupCaptureOptions = {}): Promise<MarkupBundle> {
    // Creation sites are only recorded while tracking; a snapshot without the overlay open
    // turns it on for one re-run so the scene summary can point at code.
    const wasActive = this.active;
    if (!wasActive) this.host.setTracking(true);
    try {
      const cleanPng = this.host.snapshotPng();
      const note = opts.note ?? "";
      const viewPng = await this.composite(cleanPng, note);
      const vp = this.host.viewport;
      const markup = {
        format: "tekto-markup/1",
        createdAt: new Date().toISOString(),
        sketch: { title: this.host.title, url: location.href },
        instruction: note,
        viewport: { width: vp.clientWidth, height: vp.clientHeight, dpr: window.devicePixelRatio || 1 },
        ...this.host.context(),
        marks: this.marks.map((m) => ({
          n: m.n,
          note: m.note,
          kind: m.resolved?.kind,
          summary: m.resolved?.summary,
          hits: m.resolved?.hits ?? [],
          world: m.resolved?.world ?? {},
          screen: {
            bbox: bbox2(m.strokes.flat()),
            strokes: m.strokes.map((s) => simplify(s, 24).map((p) => [Math.round(p[0]), Math.round(p[1])])),
          },
        })),
        files: { view: "view.png", clean: "clean.png" },
      };
      const bundle: MarkupBundle = { markup, viewPng, cleanPng };
      if (opts.save !== false) bundle.dir = await post(bundle, opts.label ?? slug(this.host.title));
      return bundle;
    } finally {
      if (!wasActive) this.host.setTracking(false);
    }
  }

  /** The 3D view with the marks and a legend burnt in, at device resolution. */
  private async composite(cleanPng: string, note: string): Promise<string> {
    const img = new Image();
    img.src = cleanPng;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    const s = img.width / Math.max(1, this.host.viewport.clientWidth);
    g.setTransform(s, 0, 0, s, 0, 0);
    drawMarks(g, this.marks);
    const lines = [
      ...(note ? [note] : []),
      ...this.marks.filter((m) => m.note).map((m) => `${m.n}  ${m.note}`),
    ];
    if (lines.length) {
      g.font = "13px system-ui,sans-serif";
      const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 20;
      const h = lines.length * 18 + 12;
      const y0 = img.height / s - h - 10;
      g.fillStyle = "rgba(255,255,255,.92)";
      g.fillRect(10, y0, w, h);
      g.fillStyle = "#111";
      lines.forEach((l, i) => g.fillText(l, 20, y0 + 20 + i * 18));
    }
    return c.toDataURL("image/png");
  }
}

// ── Pure helpers (no DOM state) ────────────────────────────────────────

function drawMarks(g: CanvasRenderingContext2D, marks: Mark[]) {
  g.lineCap = "round"; g.lineJoin = "round";
  for (const m of marks) {
    for (const [w, col] of [[8, "rgba(255,255,255,.9)"], [3.5, INK]] as const) {
      g.strokeStyle = col; g.lineWidth = w;
      for (const s of m.strokes) {
        if (s.length === 1) { g.beginPath(); g.arc(s[0][0], s[0][1], w, 0, Math.PI * 2); g.fillStyle = col; g.fill(); continue; }
        g.beginPath();
        s.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
        g.stroke();
      }
    }
    const [x, y] = badgeAt(m);
    g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2);
    g.fillStyle = INK; g.fill();
    g.lineWidth = 2.5; g.strokeStyle = "#fff"; g.stroke();
    g.fillStyle = "#fff"; g.font = "bold 14px system-ui,sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(m.n), x, y + 0.5);
    g.textAlign = "start"; g.textBaseline = "alphabetic";
  }
}

/** Badge sits up-left of the mark's first point, so it never covers what was marked. */
function badgeAt(m: Mark): Pt {
  const p = m.strokes[0]?.[0] ?? [0, 0];
  return [Math.max(14, p[0] - 16), Math.max(14, p[1] - 16)];
}

export function classify(strokes: Pt[][]): MarkKind {
  const all = strokes.flat();
  const len = strokes.reduce((a, s) => a + pathLength(s), 0);
  if (len < 8) return "point";
  if (strokes.length === 2 && strokes.every(isStraight) && segmentsCross(strokes[0], strokes[1])) return "cross";
  const s = strokes[0];
  const L = pathLength(s);
  const gap = dist(s[0], s[s.length - 1]);
  if (strokes.length === 1 && L > 40 && gap < 0.25 * L) return "loop";
  if (strokes.length === 1 && isStraight(s)) return "line";
  return all.length ? "stroke" : "point";
}

function isStraight(s: Pt[]) { return pathLength(s) > 0 && dist(s[0], s[s.length - 1]) / pathLength(s) > 0.9; }

function segmentsCross(a: Pt[], b: Pt[]) {
  const [p, q, r, s] = [a[0], a[a.length - 1], b[0], b[b.length - 1]];
  const o = (u: Pt, v: Pt, w: Pt) => Math.sign((v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]));
  return o(p, q, r) !== o(p, q, s) && o(r, s, p) !== o(r, s, q);
}

function summarize(kind: MarkKind, hits: MarkupObjectRef[]): string {
  const verb = { point: "at", loop: "around", line: "along", cross: "crossing out", stroke: "over" }[kind];
  if (!hits.length) return `${kind} ${verb} empty space`;
  const names = new Map<string, number>();
  for (const h of hits) {
    const name = h.label ?? h.layer ?? h.tag ?? (h.color ? `${h.type} ${h.color}` : h.type);
    const key = h.src ? `${name} (${h.src})` : name;
    names.set(key, (names.get(key) ?? 0) + 1);
  }
  return `${kind} ${verb} ` + [...names].map(([k, c]) => (c > 1 ? `${k} ×${c}` : k)).join(", ");
}

function pathLength(s: Pt[]) { let L = 0; for (let i = 1; i < s.length; i++) L += dist(s[i - 1], s[i]); return L; }
function dist(a: Pt, b: Pt) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

/** Evenly spaced points along a polyline, at most `max`. */
export function resample(s: Pt[], step: number, max: number): Pt[] {
  const L = pathLength(s);
  if (s.length < 2 || L === 0) return s.slice(0, 1);
  const d = Math.max(step, L / max);
  const out: Pt[] = [s[0]];
  let carry = 0;
  for (let i = 1; i < s.length; i++) {
    const seg = dist(s[i - 1], s[i]);
    let t = d - carry;
    while (t <= seg) {
      const f = t / seg;
      out.push([s[i - 1][0] + (s[i][0] - s[i - 1][0]) * f, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * f]);
      t += d;
    }
    carry = seg - (t - d);
  }
  out.push(s[s.length - 1]);
  return out;
}

/** Up to ~`target` grid points inside a closed ring. */
export function gridInside(ring: Pt[], target: number): Pt[] {
  const [x0, y0, x1, y1] = bbox2(ring);
  const area = Math.abs(ring.reduce((a, p, i) => { const q = ring[(i + 1) % ring.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const step = Math.max(4, Math.sqrt(area / target));
  const out: Pt[] = [];
  for (let y = y0 + step / 2; y < y1; y += step) {
    for (let x = x0 + step / 2; x < x1; x += step) if (inside([x, y], ring)) out.push([x, y]);
  }
  return out;
}

function inside(p: Pt, ring: Pt[]) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Ramer–Douglas–Peucker, loosening the tolerance until at most `max` points remain. */
export function simplify(s: Pt[], max: number): Pt[] {
  if (s.length <= 2) return s;
  for (let eps = 1; ; eps *= 1.5) {
    const out = rdp(s, eps);
    if (out.length <= max) return out;
  }
}

function rdp(s: Pt[], eps: number): Pt[] {
  if (s.length <= 2) return s;
  const [a, b] = [s[0], s[s.length - 1]];
  const L = dist(a, b) || 1;
  let best = -1, idx = 0;
  for (let i = 1; i < s.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - s[i][1]) - (a[0] - s[i][0]) * (b[1] - a[1])) / L;
    if (d > best) { best = d; idx = i; }
  }
  if (best <= eps) return [a, b];
  return [...rdp(s.slice(0, idx + 1), eps).slice(0, -1), ...rdp(s.slice(idx), eps)];
}

function bbox2(ps: Pt[]): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ps) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)];
}

function mean(ps: Vec3[]) {
  const s = ps.reduce((a, p) => [a[0] + p.x, a[1] + p.y, a[2] + p.z], [0, 0, 0]);
  return { x: s[0] / ps.length, y: s[1] / ps.length, z: s[2] / ps.length };
}

function bounds(ps: Vec3[]) {
  const lo = { x: Infinity, y: Infinity, z: Infinity }, hi = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const p of ps) {
    lo.x = Math.min(lo.x, p.x); lo.y = Math.min(lo.y, p.y); lo.z = Math.min(lo.z, p.z);
    hi.x = Math.max(hi.x, p.x); hi.y = Math.max(hi.y, p.y); hi.z = Math.max(hi.z, p.z);
  }
  return [lo, hi];
}

export function round3(p: { x: number; y: number; z: number }): number[] {
  return [p.x, p.y, p.z].map((v) => +v.toFixed(4));
}

function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sketch"; }

async function post(b: MarkupBundle, label: string): Promise<string | undefined> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, markup: b.markup, viewPng: b.viewPng, cleanPng: b.cleanPng }),
    });
    if (res.ok) return (await res.json()).dir as string;
  } catch { /* no dev server — fall through to download */ }
  const dl = (name: string, href: string) => { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); };
  dl(`${label}-view.png`, b.viewPng);
  dl(`${label}-clean.png`, b.cleanPng);
  dl(`${label}-markup.json`, URL.createObjectURL(new Blob([JSON.stringify(b.markup, null, 2)], { type: "application/json" })));
  return undefined;
}
