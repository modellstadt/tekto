/**
 * Sheet — a 2D drawing drawn on screen and exported to SVG and DXF from one source.
 *
 * Apps drew their plans, elevations and unrolled strips twice: once for the screen, once in
 * a separate export path that had to repeat every transform — and drifted. A Sheet is data:
 * views placed on the sheet, each holding entities (lines, polylines, arcs, circles, fills,
 * text, dimensions, leaders, level marks). `explode()` turns it into plain primitives in
 * sheet coordinates, and every output draws exactly that list — what you see is what you
 * export, by construction.
 *
 * Units, the way CAD does it: geometry in model units (metres), annotation in paper
 * millimetres at the sheet's scale (`scale: 50` = 1:50). A 2.5 mm label stays 2.5 mm on
 * paper whether the view is a site plan or a joint detail.
 *
 *   const sheet = new Sheet({ scale: 50, layers: { cut: { weight: 0.5 }, hidden: { dash: "hidden" } } });
 *   const plan = sheet.view("plan");
 *   plan.polyline(outline, { layer: "cut", closed: true, fill: "#ddd" });
 *   plan.dim(outline[0], outline[1], { offset: 8 });
 *   const east = sheet.view("east", { at: [0, 12], project: { right: new Vec3(0, 1, 0), up: new Vec3(0, 0, 1) } });
 *   east.polyline(points3D, { layer: "cut" });                   // 3D points, projected into the view
 *   download(sheet.toDXF(), "drawings.dxf"); download(sheet.toSVG(), "drawings.svg");
 */
import type { Vec3 } from "../math/vectors";
import { writeDxf2D, aciFromHex, type Dxf2DContent, type DxfLayerDef } from "../../io/DxfWriter";

/** A point in a view or on the sheet. `Vec2` fits, or any `{ x, y }`. */
export interface Pt { x: number; y: number; }
type PtIn = Pt | readonly [number, number];

/** Line patterns, sized in paper millimetres. */
export type Dash = "solid" | "dashed" | "dotted" | "center" | "hidden";

/** How lines look. `weight` is a pen width in paper millimetres (0.13–0.7 are usual). */
export interface LineStyle {
  color?: string;
  weight?: number;
  dash?: Dash;
}

/** Per-entity style: a layer (whose style applies) and overrides. `key` names the document
 *  record the entity shows, like `SceneObject.key` — kept through explode for picking. */
export interface DrawOptions extends LineStyle {
  layer?: string;
  key?: string;
}

export interface TextOptions extends DrawOptions {
  /** Height in paper millimetres (default 2.5). */
  size?: number;
  /** Degrees, counter-clockwise, in the view. */
  rotation?: number;
  align?: "left" | "center" | "right";
  baseline?: "bottom" | "middle" | "top";
}

export interface DimOptions extends DrawOptions {
  /** Distance of the dimension line from the measured points, in paper mm (default 8;
   *  negative puts it on the other side). */
  offset?: number;
  /** "aligned" (default) measures along a→b; "horizontal" / "vertical" measure one axis. */
  direction?: "aligned" | "horizontal" | "vertical";
  /** Replace the measured text. */
  text?: string;
  /** Unit of the measured text (default "mm", the drawing convention). */
  unit?: "mm" | "cm" | "m";
  decimals?: number;
  /** Text height in paper mm (default 2.5). */
  size?: number;
}

export interface LevelOptions extends DrawOptions {
  /** The level to write (default: the point's y in the view — its height in an elevation). */
  value?: number;
  /** Replace the text ("OK FFB"). */
  text?: string;
  /** Decimals of the value in metres (default 3: "+2.450"). */
  decimals?: number;
  /** Text height in paper mm (default 2.5). */
  size?: number;
}

export interface ViewOptions {
  /** Where the view's origin sits on the sheet, in sheet (model) units. */
  at?: PtIn;
  /** Degrees, counter-clockwise. */
  rotation?: number;
  /** Enlarge the view relative to the sheet's scale: 5 on a 1:50 sheet draws it at 1:10. */
  scale?: number;
  /** For 3D input: the view's x and y axes in the model, and its origin — points given as
   *  `Vec3` are projected onto them (an elevation: right = east, up = z). Or a function for
   *  any other mapping (an unrolled strip); circles and arcs then map their centre only. */
  project?: { right: Vec3; up: Vec3; origin?: Vec3 } | ((p: Vec3) => PtIn);
  /** Title drawn under the view's bounds ("Plan 1:50"); sized in paper mm. */
  title?: string;
}

export interface SheetOptions {
  /** Drawing scale: 50 means 1:50 (default 1). */
  scale?: number;
  /** Named layers and their styles; entities without a layer use "0". */
  layers?: Record<string, LineStyle & { fill?: string }>;
}

// ── Exploded primitives (sheet coordinates, model units) ───────────────────────

export interface ResolvedStyle { layer: string; color: string; weight: number; dash: Dash; }
export type SheetPrim =
  | { kind: "polyline"; points: Pt[]; closed: boolean; style: ResolvedStyle; key?: string }
  | { kind: "circle"; center: Pt; radius: number; style: ResolvedStyle; key?: string }
  | { kind: "arc"; center: Pt; radius: number; startDeg: number; endDeg: number; style: ResolvedStyle; key?: string }
  | { kind: "fill"; rings: Pt[][]; color: string; layer: string; key?: string }
  | { kind: "text"; at: Pt; text: string; height: number; rotation: number; align: "left" | "center" | "right"; baseline: "bottom" | "middle" | "top"; style: ResolvedStyle; key?: string };

/** Dash patterns in paper mm (dash, gap, …). */
export const DASH_PATTERNS: Record<Exclude<Dash, "solid">, number[]> = {
  dashed: [3, 1.5],
  hidden: [1.5, 1],
  dotted: [0.2, 1],
  center: [6, 1.2, 1, 1.2],
};

const DEFAULT_STYLE = { color: "#000000", weight: 0.25, dash: "solid" as Dash };

// ── Entities as stored (view-local coordinates) ────────────────────────────────

type Entity =
  | { t: "polyline"; points: Pt[]; closed: boolean; fill?: string; o: DrawOptions }
  | { t: "circle"; c: Pt; r: number; o: DrawOptions }
  | { t: "arc"; c: Pt; r: number; a0: number; a1: number; o: DrawOptions }
  | { t: "fill"; rings: Pt[][]; color?: string; o: DrawOptions }
  | { t: "text"; at: Pt; text: string; o: TextOptions }
  | { t: "dim"; a: Pt; b: Pt; o: DimOptions }
  | { t: "radius"; c: Pt; r: number; angle: number; o: DimOptions }
  | { t: "leader"; points: Pt[]; text: string; o: TextOptions }
  | { t: "level"; at: Pt; o: LevelOptions };

/** One view on the sheet: a plan, an elevation, an unrolled strip, a detail. */
export class SheetView {
  readonly name: string;
  readonly entities: Entity[] = [];
  private opts: ViewOptions;
  private sheet: Sheet;

  /** @internal — views come from `sheet.view(name)`. */
  constructor(sheet: Sheet, name: string, opts: ViewOptions) {
    this.sheet = sheet; this.name = name; this.opts = opts;
  }

  get options(): Readonly<ViewOptions> { return this.opts; }

  /** Lines through points; `closed` shuts the ring, `fill` colours its inside. Accepts 2D
   *  points, or `Vec3` when the view has `project`. */
  polyline(points: readonly (PtIn | Vec3)[], opts: DrawOptions & { closed?: boolean; fill?: string } = {}): this {
    const pts = points.map(p => this.local(p));
    if (pts.length >= 2) this.entities.push({ t: "polyline", points: pts, closed: !!opts.closed, fill: opts.fill, o: opts });
    return this;
  }
  line(a: PtIn | Vec3, b: PtIn | Vec3, opts: DrawOptions = {}): this { return this.polyline([a, b], opts); }
  /** Axis-aligned rectangle from its lower-left corner. */
  rect(x: number, y: number, w: number, h: number, opts: DrawOptions & { fill?: string } = {}): this {
    return this.polyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...opts, closed: true });
  }
  circle(center: PtIn | Vec3, radius: number, opts: DrawOptions = {}): this {
    this.entities.push({ t: "circle", c: this.local(center), r: radius, o: opts });
    return this;
  }
  /** Counter-clockwise arc from `startDeg` to `endDeg`. */
  arc(center: PtIn | Vec3, radius: number, startDeg: number, endDeg: number, opts: DrawOptions = {}): this {
    this.entities.push({ t: "arc", c: this.local(center), r: radius, a0: startDeg, a1: endDeg, o: opts });
    return this;
  }
  /** A solid fill (poché): one ring, or [outer, ...holes]. */
  fill(rings: readonly (PtIn | Vec3)[] | readonly (readonly (PtIn | Vec3)[])[], opts: DrawOptions & { color?: string } = {}): this {
    const nested = Array.isArray(rings[0]) && (rings[0] as unknown[]).length > 0 && typeof (rings[0] as unknown[])[0] === "object";
    const list = (nested ? rings : [rings]) as readonly (readonly (PtIn | Vec3)[])[];
    this.entities.push({ t: "fill", rings: list.map(r => r.map(p => this.local(p))), color: opts.color, o: opts });
    return this;
  }
  text(text: string, at: PtIn | Vec3, opts: TextOptions = {}): this {
    this.entities.push({ t: "text", at: this.local(at), text, o: opts });
    return this;
  }
  /** A dimension between two points, with extension lines, ticks and the measured length. */
  dim(a: PtIn | Vec3, b: PtIn | Vec3, opts: DimOptions = {}): this {
    this.entities.push({ t: "dim", a: this.local(a), b: this.local(b), o: opts });
    return this;
  }
  /** A radius dimension: centre mark, a line from the centre to the arc at `angle` degrees
   *  (default 45) with an arrow, and "R 1200" along it. */
  radius(center: PtIn | Vec3, radius: number, opts: DimOptions & { angle?: number } = {}): this {
    this.entities.push({ t: "radius", c: this.local(center), r: radius, angle: opts.angle ?? 45, o: opts });
    return this;
  }
  /** A leader: an arrow at `points[0]` (what it points at), lines through the rest, and the
   *  text beside the last point. */
  leader(points: readonly (PtIn | Vec3)[], text: string, opts: TextOptions = {}): this {
    const pts = points.map(p => this.local(p));
    if (pts.length >= 2) this.entities.push({ t: "leader", points: pts, text, o: opts });
    return this;
  }
  /** A level mark: a triangle standing on the level at `at`, and the level in metres with
   *  its sign ("+2.450", "±0.000"). */
  level(at: PtIn | Vec3, opts: LevelOptions = {}): this {
    this.entities.push({ t: "level", at: this.local(at), o: opts });
    return this;
  }
  /** Projected segments, e.g. from `DxfExporter.toSegments(view)` (hidden lines removed). */
  segments(segs: readonly { u0: number; v0: number; u1: number; v1: number; layer?: string }[], opts: DrawOptions = {}): this {
    for (const s of segs) this.entities.push({ t: "polyline", points: [{ x: s.u0, y: s.v0 }, { x: s.u1, y: s.v1 }], closed: false, o: { layer: s.layer, ...opts } });
    return this;
  }

  private local(p: PtIn | Vec3): Pt {
    let q = toPt(p as PtIn);
    const pr = this.opts.project, z = (p as { z?: number }).z;
    if (z !== undefined && pr) {
      if (typeof pr === "function") q = toPt(pr(p as Vec3));
      else {
        const { right, up, origin } = pr;
        const dx = q.x - (origin?.x ?? 0), dy = q.y - (origin?.y ?? 0), dz = z - (origin?.z ?? 0);
        q = { x: dx * right.x + dy * right.y + dz * right.z, y: dx * up.x + dy * up.y + dz * up.z };
      }
    }
    if (!Number.isFinite(q.x) || !Number.isFinite(q.y)) throw new Error(`Sheet view "${this.name}": non-finite point (${q.x}, ${q.y})`);
    return { x: q.x, y: q.y };
  }

  /** @internal */ get sheetRef(): Sheet { return this.sheet; }
}

/**
 * A 2D drawing — views on a sheet at a scale — whose outputs (`toSVG`, `toDXF`) all draw
 * the same exploded primitives.
 */
export class Sheet {
  readonly scale: number;
  private layerStyles = new Map<string, LineStyle & { fill?: string }>();
  private views = new Map<string, SheetView>();

  constructor(opts: SheetOptions = {}) {
    this.scale = opts.scale ?? 1;
    if (!(this.scale > 0)) throw new Error(`Sheet: scale must be positive (50 = 1:50), got ${opts.scale}`);
    for (const [name, style] of Object.entries(opts.layers ?? {})) this.layerStyles.set(name, style);
  }

  /** Define or change a layer's style. */
  layer(name: string, style: LineStyle & { fill?: string }): this { this.layerStyles.set(name, { ...this.layerStyles.get(name), ...style }); return this; }
  get layers(): ReadonlyMap<string, LineStyle & { fill?: string }> { return this.layerStyles; }

  /** The view named `name` — created with `opts` the first time. */
  view(name: string, opts: ViewOptions = {}): SheetView {
    let v = this.views.get(name);
    if (!v) { v = new SheetView(this, name, opts); this.views.set(name, v); }
    return v;
  }
  /** The default view at the origin (`sheet.main.polyline(…)`). */
  get main(): SheetView { return this.view("main"); }
  viewNames(): string[] { return [...this.views.keys()]; }

  /** Paper millimetres → sheet (model) units. */
  paper(mm: number): number { return (mm * this.scale) / 1000; }

  /** Everything as plain primitives in sheet coordinates — what every output draws. */
  explode(): SheetPrim[] {
    const fills: SheetPrim[] = [], rest: SheetPrim[] = [];
    for (const view of this.views.values()) {
      const vo = view.options;
      const k = vo.scale ?? 1;
      const rot = ((vo.rotation ?? 0) * Math.PI) / 180, cr = Math.cos(rot), sr = Math.sin(rot);
      const at = vo.at ? toPt(vo.at) : { x: 0, y: 0 };
      const T = (p: Pt): Pt => ({ x: at.x + k * (p.x * cr - p.y * sr), y: at.y + k * (p.x * sr + p.y * cr) });
      // Annotation sizes are paper mm; in view-local units they shrink as the view is enlarged.
      const P = (mm: number) => this.paper(mm) / k;
      const local: SheetPrim[] = [];
      for (const e of view.entities) this.explodeEntity(e, P, local);
      if (vo.title) {
        const b = boundsOf(local);
        if (b) local.push(textPrim(vo.title, { x: (b.min.x + b.max.x) / 2, y: b.min.y - P(8) }, P(3.5), 0, "center", "top", this.style({})));
      }
      for (const p of local) {
        const q = transformPrim(p, T, k, vo.rotation ?? 0);
        (q.kind === "fill" ? fills : rest).push(q);
      }
    }
    return [...fills, ...rest];   // fills under lines
  }

  /** Bounds of the exploded drawing (text estimated), or null when empty. */
  bounds(): { min: Pt; max: Pt } | null { return boundsOf(this.explode()); }

  /** The resolved style of an entity: layer style, then its overrides. */
  style(o: DrawOptions): ResolvedStyle {
    const layer = o.layer ?? "0";
    const ls = this.layerStyles.get(layer) ?? {};
    return {
      layer,
      color: o.color ?? ls.color ?? DEFAULT_STYLE.color,
      weight: o.weight ?? ls.weight ?? DEFAULT_STYLE.weight,
      dash: o.dash ?? ls.dash ?? DEFAULT_STYLE.dash,
    };
  }

  /** The sheet as an SVG document, sized in millimetres on paper (`margin` in mm). */
  toSVG(opts: { margin?: number; background?: string } = {}): string {
    return sheetToSVG(this, opts);
  }

  /**
   * The sheet as DXF R12: lines, polylines, arcs, circles, text with its alignment, dashed
   * line types, layers with their colours; fills as SOLID triangles. `units: "mm"` (default)
   * writes model metres as millimetres. Pen weights have no place in R12 — they travel with
   * the layers, as CAD plotting does.
   */
  toDXF(opts: { units?: "mm" | "m" } = {}): string {
    return sheetToDXF(this, opts);
  }

  private explodeEntity(e: Entity, P: (mm: number) => number, out: SheetPrim[]): void {
    const st = this.style(e.o);
    const key = e.o.key;
    switch (e.t) {
      case "polyline": {
        if (e.fill) out.push({ kind: "fill", rings: [e.points], color: e.fill, layer: st.layer, key });
        out.push({ kind: "polyline", points: e.points, closed: e.closed, style: st, key });
        break;
      }
      case "circle": out.push({ kind: "circle", center: e.c, radius: e.r, style: st, key }); break;
      case "arc": out.push({ kind: "arc", center: e.c, radius: e.r, startDeg: e.a0, endDeg: e.a1, style: st, key }); break;
      case "fill": {
        const layerFill = this.layerStyles.get(st.layer)?.fill;
        out.push({ kind: "fill", rings: e.rings, color: e.color ?? layerFill ?? "#d9d9d9", layer: st.layer, key });
        break;
      }
      case "text": {
        const o = e.o;
        out.push({ ...textPrim(e.text, e.at, P(o.size ?? 2.5), o.rotation ?? 0, o.align ?? "left", o.baseline ?? "bottom", st), ...(key ? { key } : {}) });
        break;
      }
      case "dim": explodeDim(e.a, e.b, e.o, st, P, out); break;
      case "radius": explodeRadius(e.c, e.r, e.angle, e.o, st, P, out); break;
      case "leader": explodeLeader(e.points, e.text, e.o, st, P, out); break;
      case "level": explodeLevel(e.at, e.o, st, P, out); break;
    }
  }
}

// ── Dimensions ──────────────────────────────────────────────────────────────────

function explodeDim(a: Pt, b: Pt, o: DimOptions, st: ResolvedStyle, P: (mm: number) => number, out: SheetPrim[]): void {
  const dir = o.direction ?? "aligned";
  // The measuring direction u and the offset direction n (to the left of u).
  let ux = b.x - a.x, uy = b.y - a.y;
  if (dir === "horizontal") { ux = Math.sign(ux) || 1; uy = 0; }
  if (dir === "vertical") { ux = 0; uy = Math.sign(uy) || 1; }
  const len = Math.hypot(ux, uy);
  if (len < 1e-12) return;
  ux /= len; uy /= len;
  const nx = -uy, ny = ux;
  const measured = Math.abs((b.x - a.x) * ux + (b.y - a.y) * uy);
  const off = P(o.offset ?? 8);
  // Dimension line: through the point further out along n, offset by `off`.
  const ka = a.x * nx + a.y * ny, kb = b.x * nx + b.y * ny;
  const base = (off >= 0 ? Math.max(ka, kb) : Math.min(ka, kb)) + off;
  const onLine = (p: Pt): Pt => { const d = base - (p.x * nx + p.y * ny); return { x: p.x + nx * d, y: p.y + ny * d }; };
  const da = onLine(a), db = onLine(b);
  const gap = P(1), over = P(2);
  const ext = (p: Pt, q: Pt) => {           // from near the measured point to just past the dim line
    const L = Math.hypot(q.x - p.x, q.y - p.y);
    if (L <= gap) return;
    const ex = (q.x - p.x) / L, ey = (q.y - p.y) / L;
    out.push({ kind: "polyline", points: [{ x: p.x + ex * gap, y: p.y + ey * gap }, { x: q.x + ex * over, y: q.y + ey * over }], closed: false, style: st });
  };
  ext(a, da); ext(b, db);
  out.push({ kind: "polyline", points: [da, db], closed: false, style: st });
  // Architectural ticks: 45° slashes through the ends.
  const t = P(1.25), tx = (ux + nx) * Math.SQRT1_2 * t, ty = (uy + ny) * Math.SQRT1_2 * t;
  for (const p of [da, db]) out.push({ kind: "polyline", points: [{ x: p.x - tx, y: p.y - ty }, { x: p.x + tx, y: p.y + ty }], closed: false, style: { ...st, weight: Math.max(st.weight, 0.35) } });
  // Text: the measured length, upright and above the line as it reads (ISO 129), whichever
  // side of the geometry the line is on.
  const text = o.text ?? formatLength(measured, o);
  const ang = upright(ux, uy), r = (ang * Math.PI) / 180;
  const mid = { x: (da.x + db.x) / 2 - Math.sin(r) * P(1), y: (da.y + db.y) / 2 + Math.cos(r) * P(1) };
  out.push(textPrim(text, mid, P(o.size ?? 2.5), ang, "center", "bottom", st));
}

function explodeRadius(c: Pt, radius: number, angle: number, o: DimOptions, st: ResolvedStyle, P: (mm: number) => number, out: SheetPrim[]): void {
  const ux = Math.cos((angle * Math.PI) / 180), uy = Math.sin((angle * Math.PI) / 180);
  const m = P(1.5);
  out.push({ kind: "polyline", points: [{ x: c.x - m, y: c.y }, { x: c.x + m, y: c.y }], closed: false, style: st });
  out.push({ kind: "polyline", points: [{ x: c.x, y: c.y - m }, { x: c.x, y: c.y + m }], closed: false, style: st });
  const end = { x: c.x + ux * radius, y: c.y + uy * radius };
  out.push({ kind: "polyline", points: [c, end], closed: false, style: st });
  out.push(arrow(end, ux, uy, P, st));
  const ang = upright(ux, uy), r = (ang * Math.PI) / 180;
  const mid = { x: c.x + ux * radius / 2 - Math.sin(r) * P(1), y: c.y + uy * radius / 2 + Math.cos(r) * P(1) };
  out.push(textPrim(o.text ?? `R ${formatLength(radius, o)}`, mid, P(o.size ?? 2.5), ang, "center", "bottom", st));
}

function explodeLeader(points: Pt[], text: string, o: TextOptions, st: ResolvedStyle, P: (mm: number) => number, out: SheetPrim[]): void {
  out.push({ kind: "polyline", points, closed: false, style: st });
  const [p0, p1] = points, L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  if (L > 0) out.push(arrow(p0, (p0.x - p1.x) / L, (p0.y - p1.y) / L, P, st));
  // The text sits past the end, on the side the last segment runs towards.
  const a = points[points.length - 2], b = points[points.length - 1];
  const right = b.x >= a.x;
  const at = { x: b.x + (right ? P(1) : -P(1)), y: b.y };
  out.push(textPrim(text, at, P(o.size ?? 2.5), 0, o.align ?? (right ? "left" : "right"), o.baseline ?? "middle", st));
}

function explodeLevel(at: Pt, o: LevelOptions, st: ResolvedStyle, P: (mm: number) => number, out: SheetPrim[]): void {
  const h = P(2.2), w = P(1.3);
  out.push({ kind: "polyline", points: [at, { x: at.x - w, y: at.y + h }, { x: at.x + w, y: at.y + h }], closed: true, style: st });
  const v = o.value ?? at.y;
  const s = v.toFixed(o.decimals ?? 3);
  const text = o.text ?? (Number(s) === 0 ? `±${s.replace("-", "")}` : v > 0 ? `+${s}` : s);
  out.push(textPrim(text, { x: at.x + w + P(1), y: at.y + h / 2 }, P(o.size ?? 2.5), 0, "left", "middle", st));
}

/** An open arrowhead at `p`, pointing along (ux, uy). */
function arrow(p: Pt, ux: number, uy: number, P: (mm: number) => number, st: ResolvedStyle): SheetPrim {
  const L = P(2.5), c = Math.cos(0.3), s = Math.sin(0.3);
  const back = (sg: number) => ({ x: p.x - L * (ux * c - sg * uy * s), y: p.y - L * (uy * c + sg * ux * s) });
  return { kind: "polyline", points: [back(1), p, back(-1)], closed: false, style: st };
}

/** Degrees for text along (ux, uy), turned to read from the bottom or the right. */
function upright(ux: number, uy: number): number {
  let ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  if (ang > 90 + 1e-9 || ang <= -90 + 1e-9) ang += 180;
  return ((ang % 360) + 360) % 360;
}

/** A model length (metres) as dimension text: mm by default, as drawings are dimensioned. */
function formatLength(m: number, o: DimOptions): string {
  const unit = o.unit ?? "mm";
  const value = m * (unit === "mm" ? 1000 : unit === "cm" ? 100 : 1);
  return value.toFixed(o.decimals ?? (unit === "mm" ? 0 : unit === "cm" ? 1 : 2));
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function toPt(p: PtIn): Pt { return Array.isArray(p) ? { x: p[0], y: p[1] } : (p as Pt); }

function textPrim(text: string, at: Pt, height: number, rotation: number, align: "left" | "center" | "right", baseline: "bottom" | "middle" | "top", style: ResolvedStyle): SheetPrim {
  return { kind: "text", at, text, height, rotation, align, baseline, style };
}

function transformPrim(p: SheetPrim, T: (q: Pt) => Pt, k: number, rotDeg: number): SheetPrim {
  switch (p.kind) {
    case "polyline": return { ...p, points: p.points.map(T) };
    case "circle": return { ...p, center: T(p.center), radius: p.radius * k };
    case "arc": return { ...p, center: T(p.center), radius: p.radius * k, startDeg: p.startDeg + rotDeg, endDeg: p.endDeg + rotDeg };
    case "fill": return { ...p, rings: p.rings.map(r => r.map(T)) };
    case "text": return { ...p, at: T(p.at), height: p.height * k, rotation: p.rotation + rotDeg };
  }
}

/** Approximate text box (0.6 × height per character) for bounds. */
function textCorners(t: Extract<SheetPrim, { kind: "text" }>): Pt[] {
  const w = t.text.length * t.height * 0.6, h = t.height;
  const x0 = t.align === "left" ? 0 : t.align === "center" ? -w / 2 : -w;
  const y0 = t.baseline === "bottom" ? 0 : t.baseline === "middle" ? -h / 2 : -h;
  const r = (t.rotation * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]].map(([x, y]) => ({ x: t.at.x + x * c - y * s, y: t.at.y + x * s + y * c }));
}

export function boundsOf(prims: readonly SheetPrim[]): { min: Pt; max: Pt } | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (p: Pt) => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); };
  for (const p of prims) {
    if (p.kind === "polyline") p.points.forEach(add);
    else if (p.kind === "fill") p.rings.forEach(r => r.forEach(add));
    else if (p.kind === "circle") { add({ x: p.center.x - p.radius, y: p.center.y - p.radius }); add({ x: p.center.x + p.radius, y: p.center.y + p.radius }); }
    else if (p.kind === "arc") {
      let sweep = (p.endDeg - p.startDeg) % 360; if (sweep <= 0) sweep += 360;
      const at = (deg: number) => add({ x: p.center.x + p.radius * Math.cos((deg * Math.PI) / 180), y: p.center.y + p.radius * Math.sin((deg * Math.PI) / 180) });
      at(p.startDeg); at(p.startDeg + sweep);
      for (let q = Math.ceil(p.startDeg / 90) * 90; q < p.startDeg + sweep; q += 90) at(q);
    }
    else textCorners(p).forEach(add);
  }
  return x0 === Infinity ? null : { min: { x: x0, y: y0 }, max: { x: x1, y: y1 } };
}

/**
 * The primitive at `p` (sheet coordinates): the topmost line, arc, circle or text within
 * `tolerance` (sheet units — divide a pixel tolerance by the screen scale), else the topmost
 * fill containing `p`, else null. Its `key` names the record it shows.
 */
export function pickPrim(prims: readonly SheetPrim[], p: Pt, tolerance: number): SheetPrim | null {
  for (let i = prims.length - 1; i >= 0; i--) {
    const q = prims[i];
    if (q.kind !== "fill" && primDistance(q, p) <= tolerance) return q;
  }
  for (let i = prims.length - 1; i >= 0; i--) {
    const q = prims[i];
    if (q.kind === "fill" && q.rings.reduce((inside, r) => inside !== inRing(r, p), false)) return q;
  }
  return null;
}

function primDistance(q: Exclude<SheetPrim, { kind: "fill" }>, p: Pt): number {
  if (q.kind === "polyline") {
    let d = Infinity;
    const n = q.points.length, m = q.closed ? n : n - 1;
    for (let i = 0; i < m; i++) d = Math.min(d, segDistance(p, q.points[i], q.points[(i + 1) % n]));
    return d;
  }
  if (q.kind === "circle") return Math.abs(Math.hypot(p.x - q.center.x, p.y - q.center.y) - q.radius);
  if (q.kind === "arc") {
    let a = (Math.atan2(p.y - q.center.y, p.x - q.center.x) * 180) / Math.PI - q.startDeg;
    a = ((a % 360) + 360) % 360;
    let sweep = (q.endDeg - q.startDeg) % 360; if (sweep <= 0) sweep += 360;
    if (a <= sweep) return Math.abs(Math.hypot(p.x - q.center.x, p.y - q.center.y) - q.radius);
    const end = (deg: number) => ({ x: q.center.x + q.radius * Math.cos((deg * Math.PI) / 180), y: q.center.y + q.radius * Math.sin((deg * Math.PI) / 180) });
    const e0 = end(q.startDeg), e1 = end(q.startDeg + sweep);
    return Math.min(Math.hypot(p.x - e0.x, p.y - e0.y), Math.hypot(p.x - e1.x, p.y - e1.y));
  }
  const c = textCorners(q);
  if (inRing(c, p)) return 0;
  return Math.min(...c.map((a, i) => segDistance(p, a, c[(i + 1) % 4])));
}

function segDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  const t = L2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

function inRing(r: readonly Pt[], p: Pt): boolean {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// ── SVG ──────────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sheetToSVG(sheet: Sheet, opts: { margin?: number; background?: string }): string {
  const prims = sheet.explode();
  const k = 1000 / sheet.scale;                         // model units → paper mm
  const n = (v: number) => +v.toFixed(3);
  const X = (p: Pt) => n(p.x * k), Y = (p: Pt) => n(-p.y * k);
  const b = boundsOf(prims) ?? { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  const m = opts.margin ?? 10;
  const minX = b.min.x * k - m, minY = -b.max.y * k - m;
  const w = (b.max.x - b.min.x) * k + 2 * m, h = (b.max.y - b.min.y) * k + 2 * m;
  const stroke = (s: ResolvedStyle) =>
    `stroke="${s.color}" stroke-width="${n(s.weight)}"${s.dash !== "solid" ? ` stroke-dasharray="${DASH_PATTERNS[s.dash].join(" ")}"` : ""}`;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}mm" height="${n(h)}mm" viewBox="${n(minX)} ${n(minY)} ${n(w)} ${n(h)}">`);
  if (opts.background) out.push(`<rect x="${n(minX)}" y="${n(minY)}" width="${n(w)}" height="${n(h)}" fill="${opts.background}"/>`);
  out.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round">`);
  for (const p of prims) {
    const key = p.key ? ` data-key="${esc(p.key)}"` : "";
    const layer = ` data-layer="${esc(p.kind === "fill" ? p.layer : p.style.layer)}"`;
    if (p.kind === "polyline") {
      const pts = p.points.map(q => `${X(q)},${Y(q)}`).join(" ");
      out.push(`<${p.closed ? "polygon" : "polyline"} points="${pts}" ${stroke(p.style)}${layer}${key}/>`);
    } else if (p.kind === "circle") {
      out.push(`<circle cx="${X(p.center)}" cy="${Y(p.center)}" r="${n(p.radius * k)}" ${stroke(p.style)}${layer}${key}/>`);
    } else if (p.kind === "arc") {
      const a0 = (p.startDeg * Math.PI) / 180, a1 = (p.endDeg * Math.PI) / 180;
      let sweep = (p.endDeg - p.startDeg) % 360; if (sweep <= 0) sweep += 360;
      const s = { x: p.center.x + p.radius * Math.cos(a0), y: p.center.y + p.radius * Math.sin(a0) };
      const e = { x: p.center.x + p.radius * Math.cos(a1), y: p.center.y + p.radius * Math.sin(a1) };
      const r = n(p.radius * k);
      // y is flipped, so a counter-clockwise arc in the model is clockwise (sweep flag 0) in SVG.
      out.push(`<path d="M ${X(s)} ${Y(s)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${X(e)} ${Y(e)}" ${stroke(p.style)}${layer}${key}/>`);
    } else if (p.kind === "fill") {
      const d = p.rings.map(r => "M " + r.map(q => `${X(q)} ${Y(q)}`).join(" L ") + " Z").join(" ");
      out.push(`<path d="${d}" fill="${p.color}" fill-rule="evenodd" stroke="none"${layer}${key}/>`);
    } else {
      const anchor = p.align === "left" ? "start" : p.align === "center" ? "middle" : "end";
      const base = p.baseline === "bottom" ? "alphabetic" : p.baseline === "middle" ? "central" : "hanging";
      const x = X(p.at), y = Y(p.at);
      out.push(`<text x="${x}" y="${y}" font-size="${n(p.height * k)}" font-family="Helvetica, Arial, sans-serif" fill="${p.style.color}" stroke="none" text-anchor="${anchor}" dominant-baseline="${base}"${p.rotation ? ` transform="rotate(${n(-p.rotation)} ${x} ${y})"` : ""}${layer}${key}>${esc(p.text)}</text>`);
    }
  }
  out.push(`</g>`, `</svg>`);
  return out.join("\n") + "\n";
}

// ── DXF ──────────────────────────────────────────────────────────────────────────


function sheetToDXF(sheet: Sheet, opts: { units?: "mm" | "m" }): string {
  const prims = sheet.explode();
  const units = opts.units ?? "mm";
  const c: Required<Pick<Dxf2DContent, "polylines" | "circles" | "arcs" | "texts" | "solids" | "layers">> = {
    polylines: [], circles: [], arcs: [], texts: [], solids: [], layers: [],
  };
  const lt = (d: Dash) => (d === "solid" ? undefined : d.toUpperCase() as "DASHED");
  const layerColor = new Map<string, number>();
  for (const [name, st] of sheet.layers) layerColor.set(name, aciFromHex(st.color ?? DEFAULT_STYLE.color));
  for (const p of prims) {
    if (p.kind === "fill") {
      for (const tri of triangulateRings(p.rings)) c.solids.push({ layer: p.layer, points: tri, color: aciFromHex(p.color) });
      continue;
    }
    const s = p.style;
    const color = aciFromHex(s.color) === (layerColor.get(s.layer) ?? 7) ? undefined : aciFromHex(s.color);
    const common = { layer: s.layer, ...(color !== undefined ? { color } : {}), ...(lt(s.dash) ? { linetype: lt(s.dash) } : {}) };
    if (p.kind === "polyline") c.polylines.push({ ...common, points: p.points, closed: p.closed });
    else if (p.kind === "circle") c.circles.push({ ...common, center: p.center, radius: p.radius });
    else if (p.kind === "arc") c.arcs.push({ ...common, center: p.center, radius: p.radius, startDeg: p.startDeg, endDeg: p.endDeg });
    else c.texts.push({ layer: s.layer, ...(color !== undefined ? { color } : {}), at: p.at, text: p.text, height: p.height, rotationDeg: p.rotation, align: p.align, valign: p.baseline });
  }
  const layers: DxfLayerDef[] = [...sheet.layers].map(([name, st]) => ({ name, color: layerColor.get(name), ...(st.dash && st.dash !== "solid" ? { lineType: st.dash.toUpperCase() } : {}) }));
  return writeDxf2D({ ...c, layers }, { scale: units === "mm" ? 1000 : 1, linetypeScale: sheet.scale * (units === "mm" ? 1 : 0.001) });
}

/** Triangles covering rings ([outer, …holes]) — ear clipping on the outer ring after
 *  bridging holes in. Good for poché; not for self-intersecting input. */
function triangulateRings(rings: Pt[][]): Pt[][] {
  let poly = normalize(rings[0], true);
  for (const hole of rings.slice(1)) poly = bridge(poly, normalize(hole, false));
  return earClip(poly);
}
function area(r: Pt[]): number { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.y - q.x * p.y; } return a / 2; }
function normalize(r: Pt[], ccw: boolean): Pt[] {
  let ring = r.length > 1 && r[0].x === r[r.length - 1].x && r[0].y === r[r.length - 1].y ? r.slice(0, -1) : r.slice();
  if ((area(ring) > 0) !== ccw) ring = ring.reverse();
  return ring;
}
/** Join a hole into the outer ring through a cut from the hole's rightmost point. */
function bridge(outer: Pt[], hole: Pt[]): Pt[] {
  let hi = 0; for (let i = 1; i < hole.length; i++) if (hole[i].x > hole[hi].x) hi = i;
  const h = hole[hi];
  let best = -1, bestD = Infinity;
  for (let i = 0; i < outer.length; i++) {
    const o = outer[i];
    if (o.x < h.x) continue;
    const d = (o.x - h.x) ** 2 + (o.y - h.y) ** 2;
    if (d < bestD && !crossesAny(h, o, outer, hole)) { bestD = d; best = i; }
  }
  if (best < 0) best = 0;
  const holeLoop = [...hole.slice(hi), ...hole.slice(0, hi), h];
  return [...outer.slice(0, best + 1), ...holeLoop, ...outer.slice(best)];
}
function crossesAny(a: Pt, b: Pt, ...rings: Pt[][]): boolean {
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length];
    if (p === a || q === a || p === b || q === b) continue;
    if (segX(a, b, p, q)) return true;
  }
  return false;
}
function segX(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
function earClip(poly: Pt[]): Pt[][] {
  const tris: Pt[][] = [];
  const idx = poly.map((_, i) => i);
  const isEar = (i: number, j: number, k: number) => {
    const a = poly[i], b = poly[j], c = poly[k];
    if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 1e-18) return false;
    for (const m of idx) {
      if (m === i || m === j || m === k) continue;
      const p = poly[m];
      const s1 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      const s2 = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
      const s3 = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x);
      if (s1 >= 0 && s2 >= 0 && s3 >= 0 && !(p.x === a.x && p.y === a.y) && !(p.x === b.x && p.y === b.y) && !(p.x === c.x && p.y === c.y)) return false;
    }
    return true;
  };
  let guard = 0;
  while (idx.length > 3 && guard++ < 10000) {
    let clipped = false;
    for (let n = 0; n < idx.length; n++) {
      const i = idx[(n + idx.length - 1) % idx.length], j = idx[n], k = idx[(n + 1) % idx.length];
      if (isEar(i, j, k)) { tris.push([poly[i], poly[j], poly[k]]); idx.splice(n, 1); clipped = true; break; }
    }
    if (!clipped) break;   // degenerate input: stop rather than loop
  }
  if (idx.length === 3) tris.push(idx.map(i => poly[i]));
  return tris;
}
