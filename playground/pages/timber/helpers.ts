/**
 * Timber demo — visual + geometry helpers, info-panel builders.
 *
 * Pure functions / DOM constructors used by the main sketch fn. Keeping
 * them here lets `index.ts` stay focused on building geometry and
 * wiring drag-handles / selection / IFC export.
 */

import { Vec2, Polygon2D, Wall, WallOpening } from "../../../src";
import type { Lab, WallPartRole, SlabPartRole } from "../../../src";

// ─── Role → colour tables (panel and 3D tint) ───────────────────────

const WALL_ROLE_COLOR: Partial<Record<WallPartRole, string>> = {
  sillPlate:  "#b87333",
  topPlate:   "#cd853f",
  stud:       "#deb887",
  jackStud:   "#f4a460",
  header:     "#8b4513",
  cripple:    "#daa520",
  blocking:   "#a0522d",
  sheathing:  "#cfd8dc",
  monolithic: "#cfd8dc",
};
export function colorForRole(role: WallPartRole): string {
  return WALL_ROLE_COLOR[role] ?? "#cfd8dc";
}

const SLAB_ROLE_COLOR: Partial<Record<SlabPartRole, string>> = {
  joist:      "#deb887",
  beam:       "#8b4513",
  header:     "#a0522d",
  blocking:   "#daa520",
  sheathing:  "#cfd8dc",
  decking:    "#b87333",
  topping:    "#a9a9a9",
  ceiling:    "#e9ecef",
  insulation: "#f0c987",
  monolithic: "#cfd8dc",
};
export function colorForSlabRole(role: SlabPartRole): string {
  return SLAB_ROLE_COLOR[role] ?? "#cfd8dc";
}

// ─── Geometry helpers ───────────────────────────────────────────────

/** Point at arc-length `m` along the polyline `pl`. */
export function pointAtArcLength(pl: Vec2[], m: number): Vec2 {
  let acc = 0;
  for (let i = 0; i < pl.length - 1; i++) {
    const seg = pl[i + 1].sub(pl[i]);
    const len = seg.len();
    if (m <= acc + len) {
      const t = len > 1e-9 ? (m - acc) / len : 0;
      return pl[i].add(seg.mul(t));
    }
    acc += len;
  }
  return pl[pl.length - 1];
}

/**
 * Given a (snapped) handle position on the room loop, pick which
 * perimeter wall it sits on and add a (copied + repositioned) opening
 * to that wall.
 */
export function placeOpeningOnPerimeter(
  handle: { x: number; y: number; z: number },
  perimeter: { wall: Wall; startArc: number }[],
  loop: Vec2[],
  opening: WallOpening,
): void {
  const proj = Polygon2D.closestPointOnPolyline(loop, new Vec2(handle.x, handle.y), { closed: true });
  const globalArc = proj.arcLength;
  for (let i = 0; i < perimeter.length; i++) {
    const seg = perimeter[i];
    const segLen = seg.wall.length;
    const segEnd = seg.startArc + segLen;
    if (globalArc >= seg.startArc - 1e-9 && globalArc <= segEnd + 1e-9) {
      const local = Math.max(0, Math.min(segLen, globalArc - seg.startArc));
      const op = new WallOpening(local, opening.width, opening.sillHeight, opening.headHeight, opening.name);
      seg.wall.openings.push(op);
      return;
    }
  }
}

// ─── Info-panel builders (top-right overlay in the viewport) ────────

let infoPanelEl: HTMLDivElement | null = null;

/**
 * Build or refresh the top-right info panel. Shows static facts for
 * the current selection and, when applicable, *interactive controls* —
 * e.g. style + through-wall dropdowns for a selected joint.
 *
 * The panel is rebuilt every sketch run; controls preserve their value
 * via module-scope override maps in the calling page.
 */
export function syncInfoPanel(
  lab: Lab,
  title: string,
  rows: ({ label: string; value: string } | { control: HTMLElement })[],
): void {
  if (!infoPanelEl) {
    infoPanelEl = document.createElement("div");
    infoPanelEl.style.cssText = `
      position:absolute; top:12px; right:12px; z-index:50;
      min-width:220px; max-width:300px;
      background:#0c0d16; color:#c8cad0;
      border:1px solid #16182a; border-radius:6px;
      padding:10px 12px;
      font-family:'IBM Plex Mono', ui-monospace, monospace; font-size:11px;
      box-shadow:0 4px 12px rgba(0,0,0,.3);
      pointer-events:auto;
    `;
    lab.viewport.appendChild(infoPanelEl);
  }
  // Clear and rebuild content nodes (preserving the container element).
  infoPanelEl.innerHTML = "";
  const titleEl = document.createElement("div");
  titleEl.style.cssText = "color:#38d9a9;font-weight:600;font-size:12px;margin-bottom:8px;";
  titleEl.textContent = title;
  infoPanelEl.appendChild(titleEl);

  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "color:#7a80a0;font-style:italic;";
    empty.textContent = "no selection — click a wall, opening, joint, corner, or spur";
    infoPanelEl.appendChild(empty);
    return;
  }

  for (const r of rows) {
    if ("control" in r) {
      infoPanelEl.appendChild(r.control);
      continue;
    }
    const row = document.createElement("div");
    row.style.cssText = "display:flex;justify-content:space-between;gap:10px;margin-bottom:3px;";
    const l = document.createElement("span"); l.style.color = "#7a80a0"; l.textContent = r.label;
    const v = document.createElement("span"); v.style.color = "#c8cad0"; v.textContent = r.value;
    row.appendChild(l); row.appendChild(v);
    infoPanelEl.appendChild(row);
  }
}

/** Build a label+range-input row for numeric values in the info panel. */
export function makeNumberRow(
  labelText: string, min: number, max: number, step: number, current: number,
  formatter: (v: number) => string,
  onChange: (v: number) => void,
): HTMLDivElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:6px;margin:6px 0;";
  const lbl = document.createElement("span");
  lbl.textContent = labelText;
  lbl.style.cssText = "color:#7a80a0;flex-shrink:0;min-width:80px;";
  const inp = document.createElement("input");
  inp.type = "range";
  inp.min = String(min); inp.max = String(max); inp.step = String(step);
  inp.value = String(current);
  inp.style.cssText = "flex:1;accent-color:#38d9a9;min-width:60px;";
  const val = document.createElement("span");
  val.style.cssText = "color:#c8cad0;min-width:60px;text-align:right;font-variant-numeric:tabular-nums;";
  val.textContent = formatter(current);
  inp.oninput = () => {
    const v = parseFloat(inp.value);
    val.textContent = formatter(v);
    onChange(v);
  };
  row.appendChild(lbl); row.appendChild(inp); row.appendChild(val);
  return row;
}

/** Build a label+select control row for inline use in the info panel. */
export function makeSelectRow(
  labelText: string, options: string[], current: string,
  onChange: (v: string) => void,
): HTMLDivElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:6px;margin:6px 0;";
  const lbl = document.createElement("span");
  lbl.textContent = labelText;
  lbl.style.cssText = "color:#7a80a0;flex-shrink:0;min-width:60px;";
  const sel = document.createElement("select");
  sel.style.cssText = "flex:1;background:#16182a;color:#c8cad0;border:1px solid #262840;border-radius:3px;padding:2px 4px;font-family:inherit;font-size:11px;";
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt; o.textContent = opt; if (opt === current) o.selected = true;
    sel.appendChild(o);
  }
  sel.onchange = () => onChange(sel.value);
  row.appendChild(lbl); row.appendChild(sel);
  return row;
}
