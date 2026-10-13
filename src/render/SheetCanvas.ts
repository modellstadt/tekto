/**
 * A Sheet on screen — the same exploded primitives `toSVG` and `toDXF` write, drawn on a
 * canvas: pens at their paper weight, dashes at their paper length, text at its paper
 * height, all at the current zoom.
 *
 *   drawSheet(ctx, sheet, fitSheet(sheet.bounds(), w, h))      // in any 2D canvas (sketch2d)
 *
 *   const view = new SheetCanvas(container, { sheet });         // a widget: pan, zoom, pick
 *   view.onPick((prim) => selection.select(prim?.key ? [prim.key] : []));
 *   selection.onChange((keys) => view.setHighlight(keys));
 *
 * No three.js — this is part of `tekto/2d`.
 */
import { DASH_PATTERNS, boundsOf, pickPrim, type Pt, type Sheet, type SheetPrim, type ResolvedStyle } from "../core/drawing/Sheet";

/** Sheet → screen: `scale` CSS pixels per sheet unit, the sheet origin at (`x`, `y`); y up. */
export interface SheetTransform { scale: number; x: number; y: number; }

export interface DrawSheetOptions {
  /** The exploded sheet, if you have it already (`sheet.explode()`). */
  prims?: readonly SheetPrim[];
  /** Keys whose primitives are drawn highlighted. */
  highlight?: Iterable<string> | null;
  highlightColor?: string;
}

const FONT = "Helvetica, Arial, sans-serif";
const MIN_PEN_PX = 0.75;
const HIGHLIGHT = "#1e88e5";

/** The transform that fits `bounds` into a `width` × `height` canvas with a pixel margin. */
export function fitSheet(bounds: { min: Pt; max: Pt } | null, width: number, height: number, margin = 24): SheetTransform {
  if (!bounds) return { scale: 1, x: width / 2, y: height / 2 };
  const bw = Math.max(bounds.max.x - bounds.min.x, 1e-9), bh = Math.max(bounds.max.y - bounds.min.y, 1e-9);
  const scale = Math.max(1e-9, Math.min((width - 2 * margin) / bw, (height - 2 * margin) / bh));
  const cx = (bounds.min.x + bounds.max.x) / 2, cy = (bounds.min.y + bounds.max.y) / 2;
  return { scale, x: width / 2 - cx * scale, y: height / 2 + cy * scale };
}

/** Draw the sheet's primitives with `t`; the canvas transform (e.g. device-pixel ratio) is kept. */
export function drawSheet(ctx: CanvasRenderingContext2D, sheet: Sheet, t: SheetTransform, opts: DrawSheetOptions = {}): void {
  const prims = opts.prims ?? sheet.explode();
  const hl = opts.highlight ? new Set(opts.highlight) : null;
  const hlColor = opts.highlightColor ?? HIGHLIGHT;
  const mmPx = (sheet.scale / 1000) * t.scale;            // one paper millimetre in CSS pixels
  const X = (p: Pt) => t.x + p.x * t.scale, Y = (p: Pt) => t.y - p.y * t.scale;
  const pen = (s: ResolvedStyle, lit: boolean) => {
    ctx.strokeStyle = lit ? hlColor : s.color;
    ctx.lineWidth = Math.max(MIN_PEN_PX, s.weight * mmPx) + (lit ? 1.5 : 0);
    ctx.setLineDash(s.dash === "solid" ? [] : DASH_PATTERNS[s.dash].map(d => Math.max(d * mmPx, 0.5)));
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of prims) {
    const lit = !!(hl && p.key && hl.has(p.key));
    if (p.kind === "fill") {
      ctx.beginPath();
      for (const r of p.rings) r.forEach((q, i) => (i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q))));
      ctx.fillStyle = p.color;
      ctx.fill("evenodd");
      if (lit) { ctx.globalAlpha = 0.35; ctx.fillStyle = hlColor; ctx.fill("evenodd"); ctx.globalAlpha = 1; }
    } else if (p.kind === "polyline") {
      pen(p.style, lit);
      ctx.beginPath();
      p.points.forEach((q, i) => (i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q))));
      if (p.closed) ctx.closePath();
      ctx.stroke();
    } else if (p.kind === "circle") {
      pen(p.style, lit);
      ctx.beginPath();
      ctx.arc(X(p.center), Y(p.center), p.radius * t.scale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === "arc") {
      // y flips on screen: a counter-clockwise arc in the drawing runs anticlockwise from −start.
      let sweep = (p.endDeg - p.startDeg) % 360; if (sweep <= 0) sweep += 360;
      const a0 = (-p.startDeg * Math.PI) / 180, a1 = (-(p.startDeg + sweep) * Math.PI) / 180;
      pen(p.style, lit);
      ctx.beginPath();
      ctx.arc(X(p.center), Y(p.center), p.radius * t.scale, a0, a1, true);
      ctx.stroke();
    } else {
      const px = p.height * t.scale;
      if (px < 0.5) continue;                              // too small to read: skip, as CAD does
      ctx.save();
      ctx.translate(X(p.at), Y(p.at));
      if (p.rotation) ctx.rotate((-p.rotation * Math.PI) / 180);
      ctx.font = `${px}px ${FONT}`;
      ctx.fillStyle = lit ? hlColor : p.style.color;
      ctx.textAlign = p.align;
      ctx.textBaseline = p.baseline === "bottom" ? "alphabetic" : p.baseline === "middle" ? "middle" : "hanging";
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

export interface SheetCanvasOptions {
  sheet?: Sheet | null;
  /** Paper colour (default white; "transparent" shows what is underneath). */
  background?: string;
  /** How close a click must be to pick a line, in CSS pixels (default 6). */
  pickTolerance?: number;
  /** Margin when fitting, in CSS pixels (default 24). */
  margin?: number;
  highlightColor?: string;
}

type Mods = { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean };

/**
 * A sheet in a container: fills it, fits the drawing, zooms with the wheel (about the
 * cursor), pans by dragging, fits again on double-click. A click picks the primitive under
 * it (`onPick` — its `key` names the record); `setHighlight(keys)` shows a selection.
 * `onDraw` paints on top in screen pixels (handles, markers that keep their size), with
 * `toScreen` / `toSheet` to convert. The canvas is marked `data-tekto-overlay`, so over
 * an `appShell()` viewport (`app.overlay()`) it shows in snapshots.
 */
export class SheetCanvas {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _sheet: Sheet | null = null;
  private prims: SheetPrim[] = [];
  private t: SheetTransform = { scale: 1, x: 0, y: 0 };
  private fitted = false;
  private highlight: string[] = [];
  private pickFns: ((prim: SheetPrim | null, mods: Mods) => void)[] = [];
  private drawFns: ((ctx: CanvasRenderingContext2D, t: SheetTransform) => void)[] = [];
  private frame = 0;
  private ro: ResizeObserver;
  private off: () => void;
  private opts: SheetCanvasOptions;

  constructor(container: HTMLElement, opts: SheetCanvasOptions = {}) {
    this.opts = opts;
    this.canvas = document.createElement("canvas");
    this.canvas.dataset.tektoOverlay = "";
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;";
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
    this.off = this.wire();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    if (opts.sheet) this.setSheet(opts.sheet);
  }

  get sheet(): Sheet | null { return this._sheet; }
  /** The primitives on screen (the sheet, exploded once per `setSheet`). */
  get primitives(): readonly SheetPrim[] { return this.prims; }
  get transform(): SheetTransform { return { ...this.t }; }

  /** Show a sheet. The first one is fitted; later ones keep the zoom, so a sheet rebuilt on
   *  every edit stays put (`fit: true` to refit). */
  setSheet(sheet: Sheet | null, opts: { fit?: boolean } = {}): void {
    this._sheet = sheet;
    this.prims = sheet ? sheet.explode() : [];
    if (opts.fit || !this.fitted) this.fit(); else this.redraw();
  }
  setTransform(t: SheetTransform): void { this.t = { ...t }; this.redraw(); }
  fit(): void {
    const { width, height } = this.size();
    if (!this._sheet || !width || !height) { this.redraw(); return; }
    this.t = fitSheet(boundsOf(this.prims), width, height, this.opts.margin ?? 24);
    this.fitted = true;
    this.redraw();
  }

  toSheet(x: number, y: number): Pt { return { x: (x - this.t.x) / this.t.scale, y: (this.t.y - y) / this.t.scale }; }
  toScreen(p: Pt): { x: number; y: number } { return { x: this.t.x + p.x * this.t.scale, y: this.t.y - p.y * this.t.scale }; }

  /** The primitive at a canvas position (CSS pixels), or null. */
  pick(x: number, y: number): SheetPrim | null {
    return pickPrim(this.prims, this.toSheet(x, y), (this.opts.pickTolerance ?? 6) / this.t.scale);
  }
  /** Clicks (not drags): the picked primitive, or null for paper. Returns the unsubscribe. */
  onPick(fn: (prim: SheetPrim | null, mods: Mods) => void): () => void {
    this.pickFns.push(fn);
    return () => { this.pickFns = this.pickFns.filter(f => f !== fn); };
  }
  /** Draw primitives with these keys highlighted (a selection); null clears. */
  setHighlight(keys: Iterable<string> | null): void { this.highlight = keys ? [...keys] : []; this.redraw(); }
  /** Paint over the sheet in screen pixels after every redraw. Returns the unsubscribe. */
  onDraw(fn: (ctx: CanvasRenderingContext2D, t: SheetTransform) => void): () => void {
    this.drawFns.push(fn);
    this.redraw();
    return () => { this.drawFns = this.drawFns.filter(f => f !== fn); this.redraw(); };
  }

  /** Redraw on the next frame (calls coalesce). */
  redraw(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.paint(); });
  }
  /** Draw now — before reading the canvas back. */
  paint(): void {
    const { width, height, dpr } = this.size();
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // Paper is painted, not a CSS background, so a snapshot of the canvas shows it too.
    const bg = this.opts.background ?? "#ffffff";
    if (bg !== "transparent") { ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height); }
    if (this._sheet) drawSheet(ctx, this._sheet, this.t, { prims: this.prims, highlight: this.highlight, highlightColor: this.opts.highlightColor });
    for (const fn of this.drawFns) { ctx.save(); fn(ctx, this.transform); ctx.restore(); }
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.off();
    this.canvas.remove();
  }

  private size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { width: this.canvas.clientWidth, height: this.canvas.clientHeight, dpr };
  }

  private resize(): void {
    const { width, height, dpr } = this.size();
    if (!width || !height) return;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    if (!this.fitted && this._sheet) this.fit(); else this.paint();
  }

  private wire(): () => void {
    const c = this.canvas;
    const local = (e: MouseEvent) => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e), k = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015));
      this.t = { scale: this.t.scale * k, x: p.x - (p.x - this.t.x) * k, y: p.y - (p.y - this.t.y) * k };
      this.redraw();
    };
    let drag: { id: number; x: number; y: number; t: SheetTransform; moved: boolean } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      const p = local(e);
      drag = { id: e.pointerId, x: p.x, y: p.y, t: { ...this.t }, moved: false };
      c.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = local(e);
      if (!drag.moved && Math.hypot(p.x - drag.x, p.y - drag.y) < 4) return;
      drag.moved = true;
      this.t = { ...drag.t, x: drag.t.x + p.x - drag.x, y: drag.t.y + p.y - drag.y };
      this.redraw();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasClick = !drag.moved && e.button === 0;
      drag = null;
      if (!wasClick) return;
      const p = local(e), prim = this.pick(p.x, p.y);
      for (const fn of this.pickFns) fn(prim, { shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey });
    };
    const onCancel = () => { drag = null; };
    const onDbl = () => this.fit();
    c.addEventListener("wheel", onWheel, { passive: false });
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onCancel);
    c.addEventListener("dblclick", onDbl);
    return () => {
      c.removeEventListener("wheel", onWheel);
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp);
      c.removeEventListener("pointercancel", onCancel);
      c.removeEventListener("dblclick", onDbl);
    };
  }
}
