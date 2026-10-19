/**
 * The legend of a colour scale: a continuous bar with labelled ticks (a `ColorRamp` and its
 * value range), or labelled swatches (categories). Drawn on one canvas marked
 * `data-tekto-overlay`, so over the 3D view it is in snapshots and ✎ Markup — an agent reading
 * the picture reads the key too. Text wears the theme's ink colours, never a series colour;
 * the swatch beside a label carries the identity.
 */
import type { ColorRamp } from "../core/math/ColorRamp";
import { getTheme } from "./theme";

/** What a `colorLegend` shows and where: a ramp with its range, or labelled swatches. */
export interface ColorLegendOptions {
  /** The heading, e.g. "Elevation"; `unit` is added in brackets. */
  title?: string;
  /** Continuous: the ramp, drawn as a bar from `min` (left) to `max` (right). */
  ramp?: ColorRamp;
  /** The value at the ramp's start (default 0). */
  min?: number;
  /** The value at the ramp's end (default 1). */
  max?: number;
  /** About how many labelled ticks, at round numbers (default 5); labels that would touch are thinned. */
  ticks?: number;
  /** A tick label from its value (default: as many decimals as the tick step needs). */
  format?: (v: number) => string;
  /** The unit of the values, shown with the title: "Elevation (m)". */
  unit?: string;
  /** Categorical: a swatch and a label each, in this order (they win over `ramp`). Past 8, fold the rest into "other". */
  items?: { label: string; color: string }[];
  /** Ink and panel colours for the background it sits on: `"dark"` (default, tekto's 3D view) or `"light"`. */
  mode?: "dark" | "light";
  /** Sit in this corner of the parent (absolute, 12 px in) — over the 3D view; unset: in the flow, e.g. a panel row. */
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Width of a continuous legend in CSS px (default 200). */
  width?: number;
}

/** A legend from `colorLegend`: its element, to mount, and `update` to redraw it. */
export interface ColorLegend {
  /** The legend; it lets the pointer through, so the view under it still orbits. */
  readonly el: HTMLDivElement;
  /** Redraw with these options (they replace the previous ones). */
  update(options: ColorLegendOptions): void;
}

const PAD = 8;
const FONT_PX = 11;
const TITLE_GAP = 6;
const BAR_H = 10;
const TICK_H = 4;
const LABEL_GAP = 6;     // the least room between two tick labels
const EDGE = 5;          // the least room between a tick label and the panel's edge
const ROW_H = 17;
const SWATCH = 10;
const INSET = 12;

/**
 * A small legend panel for a corner of the 3D view or a panel row: a continuous bar with
 * ticks (`ramp`, `min`, `max`) or labelled swatches (`items`), styled from the theme.
 *
 *   const legend = colorLegend({ title: "Elevation", unit: "m", ramp, min: 0, max: 12, corner: "bottom-right" });
 *   lab.viewport.append(legend.el);                                // sketch(): over the view
 *   const layer = app.overlay(); layer.style.pointerEvents = "none"; layer.append(legend.el);  // appShell()
 *   panel.render(items, [{ key: "legend", el: legend.el, group: "Key" }]);                     // a ControlPanel row
 *   legend.update({ title: "Elevation", unit: "m", ramp, min: 0, max: 20, corner: "bottom-right" });  // new values: all options again
 *
 * The canvas is marked `data-tekto-overlay`, so over the view it is in snapshots and ✎ Markup.
 *
 * @experimental No app uses this yet; it may still change.
 */
export function colorLegend(options: ColorLegendOptions): ColorLegend {
  const el = document.createElement("div");
  el.dataset.tektoColorLegend = "";
  const canvas = document.createElement("canvas");
  canvas.dataset.tektoOverlay = "";                  // in snapshots and ✎ Markup
  canvas.setAttribute("role", "img");
  canvas.style.display = "block";
  el.appendChild(canvas);
  let current = options;
  const update = (next: ColorLegendOptions) => {
    current = next;
    const c = next.corner;
    el.style.cssText = "pointer-events:none;user-select:none;line-height:0;"
      + (c ? `position:absolute;z-index:4;${c.startsWith("top") ? "top" : "bottom"}:${INSET}px;${c.endsWith("left") ? "left" : "right"}:${INSET}px;`
        : "display:inline-block;");
    draw(canvas, next);
  };
  update(options);
  // The panel font may arrive after the first draw.
  document.fonts?.ready.then(() => { if (canvas.isConnected) draw(canvas, current); });
  return { el, update };
}

function draw(canvas: HTMLCanvasElement, o: ColorLegendOptions): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const t = getTheme(o.mode ?? "dark");
  const fontTitle = `600 ${FONT_PX}px ${t.font}`, fontLabel = `${FONT_PX}px ${t.font}`;
  const title = o.title ? (o.unit ? `${o.title} (${o.unit})` : o.title) : (o.unit ?? "");
  ctx.font = fontTitle;
  const titleW = title ? ctx.measureText(title).width : 0;
  const top = PAD + (title ? FONT_PX + TITLE_GAP : 0);
  ctx.font = fontLabel;

  // Measure first: resizing the canvas resets the context.
  let W: number, H: number, paint: () => void, aria: string;
  const items = o.items?.length ? o.items : null;
  if (items) {
    const labelW = Math.max(...items.map((it) => ctx.measureText(it.label).width));
    W = Math.ceil(Math.max(titleW, SWATCH + 6 + labelW) + 2 * PAD);
    H = Math.ceil(top + (items.length - 1) * ROW_H + Math.max(SWATCH, FONT_PX) + PAD);
    aria = `${title ? title + ": " : ""}${items.map((it) => it.label).join(", ")}`;
    paint = () => items.forEach((it, i) => {
      const cy = top + i * ROW_H + SWATCH / 2;
      ctx.fillStyle = it.color;
      roundRect(ctx, PAD, cy - SWATCH / 2, SWATCH, SWATCH, 2);
      ctx.fill();
      ctx.fillStyle = t.text;
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, PAD + SWATCH + 6, cy + 0.5);
    });
  } else {
    const min = o.min ?? 0, max = o.max ?? 1;
    const fmt = o.format ?? formatFor(niceStep(min, max, o.ticks ?? 5));
    W = Math.ceil(Math.max(o.width ?? 200, titleW + 2 * PAD));
    const barX = PAD, barW = W - 2 * PAD, labelY = top + BAR_H + TICK_H + 2;
    H = labelY + FONT_PX + PAD;
    const x = (v: number) => barX + (max === min ? 0.5 : (v - min) / (max - min)) * barW;
    const labels = fitLabels(niceTicks(min, max, o.ticks ?? 5).map((v) => ({ v, text: fmt(v), x: x(v), w: ctx.measureText(fmt(v)).width })), W);
    aria = `${title ? title + ": " : ""}${fmt(min)} to ${fmt(max)}`;
    paint = () => {
      const ramp = o.ramp;
      if (ramp) {
        const SAMPLES = 64;                           // dense, so the canvas's sRGB mix follows the OKLab ramp
        const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        for (let i = 0; i <= SAMPLES; i++) g.addColorStop(i / SAMPLES, ramp.hex(i / SAMPLES));
        ctx.fillStyle = g;
      } else ctx.fillStyle = t.textFaint;
      roundRect(ctx, barX, top, barW, BAR_H, 2);
      ctx.fill();
      ctx.textBaseline = "top";
      for (const l of labels) {
        ctx.fillStyle = t.textFaint;
        ctx.fillRect(Math.round(l.x) - 0.5, top + BAR_H, 1, TICK_H);
        ctx.fillStyle = t.textDim;
        ctx.fillText(l.text, l.left, labelY);
      }
    };
  }

  const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.setAttribute("aria-label", aria);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  // The panel: the theme's panel colour, a little translucent, with its hairline border.
  ctx.fillStyle = withAlpha(t.panelBg, 0.9);
  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 6);
  ctx.fill();
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (title) {
    ctx.font = fontTitle;
    ctx.fillStyle = t.text;
    ctx.textBaseline = "top";
    ctx.fillText(title, PAD, PAD);
  }
  ctx.font = fontLabel;
  paint();
}

/** The tick step: 1, 2 or 5 × 10ⁿ, about `count` ticks over min..max. */
function niceStep(min: number, max: number, count: number): number {
  const span = Math.abs(max - min);
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const raw = span / Math.max(1, count);
  const p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  return (m >= Math.sqrt(50) ? 10 : m >= Math.sqrt(10) ? 5 : m >= Math.SQRT2 ? 2 : 1) * p;
}

/** Round-number ticks inside min..max (both ends when fewer than two fall inside). */
function niceTicks(min: number, max: number, count: number): number[] {
  const lo = Math.min(min, max), hi = Math.max(min, max);
  if (!(hi > lo)) return [lo];
  const s = niceStep(lo, hi, count);
  const out: number[] = [];
  for (let i = Math.ceil(lo / s - 1e-9); i * s <= hi + s * 1e-9; i++) out.push(+(i * s).toPrecision(12));
  return out.length >= 2 ? out : [lo, hi];
}

/** As many decimals as `step` needs; a true minus sign, and no "−0". */
function formatFor(step: number): (v: number) => string {
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return (v) => {
    const s = v.toFixed(Math.min(decimals, 20));
    return /^-0(\.0*)?$/.test(s) ? s.slice(1) : s.replace(/^-/, "−");
  };
}

/** Place labels centred under their ticks, inside the panel; thin them (keeping zero) until none touch. */
function fitLabels(ticks: { v: number; text: string; x: number; w: number }[], W: number) {
  const placed = ticks.map((l) => ({ ...l, left: Math.min(Math.max(l.x - l.w / 2, EDGE), W - EDGE - l.w) }));
  const zero = Math.max(0, placed.findIndex((l) => l.v === 0));
  for (let k = 1; k <= placed.length; k++) {
    const keep = placed.filter((_, i) => (i - zero) % k === 0);
    if (keep.every((l, i) => i === 0 || l.left >= keep[i - 1].left + keep[i - 1].w + LABEL_GAP)) return keep;
  }
  return placed.slice(0, 1);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/** "#rrggbb" with an alpha, as rgba(); anything else as it is. */
function withAlpha(color: string, a: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : color;
}
