// 3D printing: slicing. A printable object is cut into horizontal layers; each
// layer becomes a toolpath (perimeters plus infill). Layer height decides the
// stair-stepping on sloped surfaces and the print time; material that sticks
// out more than 45° beyond the layer below has nothing to rest on (overhang).
// All sections are computed analytically, so any layer height works instantly.
// The left view is an axonometric of the stack: every layer is a slab of
// constant section, so the staircase is the object itself, not a drawing of it.

import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, path, hatch, text, FONT_SMALL } from "./shared";

type Loop = Pt[];
interface Section { outer: Loop; inner: Loop | null }

const SHAPES = ["House (printed upright)", "Twisted column", "Bowl"] as const;
type Shape = (typeof SHAPES)[number];

// dimensions in metres (a printed concrete house / column / planter)
const HOUSE = { W: 6, D: 5, E: 3, R: 4.6, t: 0.3 };

function rect(cx: number, cy: number, w: number, d: number): Loop {
  return [[cx - w / 2, cy - d / 2], [cx + w / 2, cy - d / 2], [cx + w / 2, cy + d / 2], [cx - w / 2, cy + d / 2]];
}

function height(shape: Shape): number {
  return shape === "House (printed upright)" ? HOUSE.R : shape === "Twisted column" ? 4 : 1.2;
}

/** The section of the solid at height z. */
function section(shape: Shape, z: number, twist: number): Section | null {
  if (shape === "House (printed upright)") {
    const { W, D, E, R, t } = HOUSE;
    if (z < E) return { outer: rect(0, 0, W, D), inner: rect(0, 0, W - 2 * t, D - 2 * t) };
    const d = (D * (R - z)) / (R - E);                         // gable roof, ridge along x
    if (d <= 0.02) return null;
    // roof shell of thickness t: its inner face runs parallel to the outer one,
    // t / sin(pitch) further in when measured horizontally
    const pitch = Math.atan((R - E) / (D / 2));
    const di = d - (2 * t) / Math.sin(pitch);
    return { outer: rect(0, 0, W, d), inner: di > 0.05 ? rect(0, 0, W - 2 * t, di) : null };
  }
  if (shape === "Twisted column") {
    const H = 4, u = z / H;
    const a = u * twist * Math.PI / 180, s = 0.55 - 0.12 * Math.sin(u * Math.PI);
    const loop = (r: number): Loop => Array.from({ length: 48 }, (_, i) => {
      const th = (i / 48) * Math.PI * 2;
      const k = r * (1 + 0.18 * Math.cos(4 * th));                // rounded square
      return [Math.cos(th + a) * k, Math.sin(th + a) * k] as Pt;
    });
    return { outer: loop(s), inner: loop(s - 0.05) };
  }
  // bowl: radius grows with height, faster near the rim
  const H = 1.2, u = z / H, r = 0.12 + 0.75 * Math.pow(u, 0.55);
  const circ = (rr: number): Loop => Array.from({ length: 64 }, (_, i) => [Math.cos((i / 64) * 2 * Math.PI) * rr, Math.sin((i / 64) * 2 * Math.PI) * rr] as Pt);
  return { outer: circ(r), inner: u > 0.06 ? circ(r - 0.04) : null };
}

function perimeter(l: Loop): number {
  let s = 0;
  for (let i = 0; i < l.length; i++) { const a = l[i], b = l[(i + 1) % l.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return s;
}

/** Largest outward step of the outer loop and inward step of the inner loop (the new material hanging over nothing). */
function overhang(prev: Section, cur: Section): number {
  const maxR = (l: Loop, dirs: number) => Array.from({ length: dirs }, (_, i) => {
    const th = (i / dirs) * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
    let m = 0; for (const p of l) m = Math.max(m, p[0] * dx + p[1] * dy);
    return m;
  });
  const po = maxR(prev.outer, 16), co = maxR(cur.outer, 16);
  let o = 0;
  for (let i = 0; i < 16; i++) o = Math.max(o, co[i] - po[i]);
  if (prev.inner && cur.inner) {
    const pi = maxR(prev.inner, 16), ci = maxR(cur.inner, 16);
    for (let i = 0; i < 16; i++) o = Math.max(o, pi[i] - ci[i]);
  } else if (prev.inner && !cur.inner) o = Infinity;          // a layer that closes over a cavity
  return o;
}

export const slicing: AppFactory = () => ({
  title: "3D printing: slicing",
  height: 540,
  fn: (lab) => {
    const shape = lab.select("Object", SHAPES, "House (printed upright)").value;
    const nLayers = lab.slider("Layers", 6, 240, 40, { step: 1 }).value;
    const pick = lab.slider("Show layer", 0, 1, 0.5, { step: 0.001 }).value;
    const twist = shape === "Twisted column" ? lab.slider("Twist °", 0, 180, 60, { step: 1 }).value : 0;
    const infill = lab.select("Infill", ["None", "Lines", "Zigzag"] as const, "Lines", { group: "Toolpath" }).value;
    const walls = lab.slider("Perimeters", 1, 3, 2, { step: 1, group: "Toolpath" }).value;
    const speed = lab.slider("Print speed mm/s", 50, 400, 150, { step: 10, group: "Toolpath" }).value;
    const showOver = lab.toggle("Mark overhangs > 45°", true, { group: "Toolpath" }).value;
    const phi = (lab.slider("View angle °", -80, 80, 35, { step: 1, group: "View" }).value * Math.PI) / 180;

    const H = height(shape), h = H / nLayers;
    const layers: (Section | null)[] = Array.from({ length: nLayers }, (_, k) => section(shape, (k + 0.5) * h, twist));
    const over = layers.map((s, k) => (k && s && layers[k - 1] ? overhang(layers[k - 1]!, s) > h : false));
    const sel = Math.min(nLayers - 1, Math.floor(pick * nLayers));
    let pathLen = 0;
    for (const s of layers) if (s) pathLen += walls * (perimeter(s.outer) + (s.inner ? perimeter(s.inner) : 0));
    const minutes = (pathLen * 1000) / speed / 60;
    lab.log("Layer height", `${(h * 1000).toFixed(0)} mm`);
    lab.log("Walls only", `${pathLen.toFixed(0)} m of toolpath, ${minutes < 90 ? minutes.toFixed(0) + " min" : (minutes / 60).toFixed(1) + " h"}`);
    lab.log("Overhanging layers", `${over.filter(Boolean).length}`);

    lab.draw((ctx, w, hh) => {
      clear(ctx, w, hh);
      const hgt = hh - BAR;
      const narrow = w < 560;
      // ── left: axonometric of the stack of layers ──
      const sw = narrow ? w : w * 0.5, sh = narrow ? hgt * 0.5 : hgt;
      // same convention as the parametric house: plan rotated by phi, 30° above the horizon
      const eps = (30 * Math.PI) / 180;
      const cp = Math.cos(phi), sp = Math.sin(phi), ce = Math.cos(eps), se = Math.sin(eps);
      const proj = (x: number, y: number, z: number): Pt => [x * cp - y * sp, z * ce + (x * sp + y * cp) * se];
      const fx = sp * ce, fy = cp * ce;                   // view direction, in plan

      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity, foot = 0;
      for (let k = 0; k < nLayers; k++) {
        const s = layers[k];
        if (!s) continue;
        for (const p of s.outer) {
          foot = Math.max(foot, Math.abs(p[0]), Math.abs(p[1]));
          for (const z of [k * h, (k + 1) * h]) {
            const q = proj(p[0], p[1], z);
            minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]);
            miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]);
          }
        }
      }
      const gnd = foot * 1.35;
      for (const [gxs, gys] of [[-gnd, -gnd], [gnd, -gnd], [gnd, gnd], [-gnd, gnd]] as Pt[]) {
        const q = proj(gxs, gys, 0);
        minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]);
        miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]);
      }
      const sc = Math.min((sw - 44) / Math.max(maxx - minx, 1e-6), (sh - 56) / Math.max(maxy - miny, 1e-6));
      const ox = sw / 2 - ((minx + maxx) / 2) * sc, oy = sh / 2 + 10 + ((miny + maxy) / 2) * sc;
      const A = (x: number, y: number, z: number): Pt => {
        const q = proj(x, y, z);
        return [ox + q[0] * sc, oy - q[1] * sc];
      };

      // the print bed
      ctx.strokeStyle = P.grey(0.35); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      path(ctx, ([[-gnd, -gnd], [gnd, -gnd], [gnd, gnd], [-gnd, gnd]] as Pt[]).map((p) => A(p[0], p[1], 0)), true);
      ctx.stroke(); ctx.setLineDash([]);

      // bottom to top, so a higher layer covers the one it sits on
      const outline = nLayers <= 90;
      for (let k = 0; k < nLayers; k++) {
        const s = layers[k];
        if (!s) continue;
        const z0 = k * h, z1 = (k + 1) * h;
        const isSel = k === sel, isOver = over[k] && showOver;
        // the side of the slab: only the edges whose outward normal faces us
        for (let i = 0; i < s.outer.length; i++) {
          const a = s.outer[i], b = s.outer[(i + 1) % s.outer.length];
          const nx = b[1] - a[1], ny = a[0] - b[0];       // loops run counter-clockwise
          if (nx * fx + ny * fy >= 0) continue;
          const q: Pt[] = [A(a[0], a[1], z0), A(b[0], b[1], z0), A(b[0], b[1], z1), A(a[0], a[1], z1)];
          const nl = Math.hypot(nx, ny) || 1;
          ctx.fillStyle = isSel ? P.grey(0.62) : P.grey(0.11 + 0.13 * Math.abs(nx / nl));
          path(ctx, q, true); ctx.fill();
          if (outline) { ctx.strokeStyle = P.grey(isSel ? 0.85 : 0.42); ctx.lineWidth = 0.6; ctx.stroke(); }
        }
        // the top of the slab, with the cavity as a hole
        ctx.beginPath();
        s.outer.forEach((p, i) => { const q = A(p[0], p[1], z1); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.closePath();
        if (s.inner) {
          for (let i = s.inner.length - 1; i >= 0; i--) {
            const q = A(s.inner[i][0], s.inner[i][1], z1);
            i === s.inner.length - 1 ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]);
          }
          ctx.closePath();
        }
        ctx.fillStyle = isSel ? P.ink : P.grey(0.05);
        ctx.fill("evenodd");
        if (outline) { ctx.strokeStyle = P.grey(isSel ? 1 : 0.38); ctx.lineWidth = 0.6; ctx.stroke(); }
        if (isOver && !isSel) {
          ctx.strokeStyle = P.ink;
          hatch(ctx, s.outer.map((p) => A(p[0], p[1], z1)), 3, Math.PI / 4, 0.8);
        }
      }

      // the design before slicing: the silhouette of the smooth solid
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      for (const side of [1, -1]) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 140; i++) {
          const z = Math.min((i / 140) * H, H - 1e-4);
          const sm = section(shape, z, twist);
          if (!sm) continue;
          let best: Pt | null = null, bv = -Infinity;
          for (const p of sm.outer) {
            const q = proj(p[0], p[1], z);
            if (side * q[0] > bv) { bv = side * q[0]; best = [ox + q[0] * sc, oy - q[1] * sc]; }
          }
          if (!best) continue;
          if (started) ctx.lineTo(best[0], best[1]); else ctx.moveTo(best[0], best[1]);
          started = true;
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = P.grey(0.55);
      text(ctx, "axonometric: layers, design outline dashed", 12, 16, "left", "alphabetic", FONT_SMALL);
      if (showOver) text(ctx, "hatched: overhang > 45°, needs support", 12, 30, "left", "alphabetic", FONT_SMALL);

      // ── right: toolpath of the selected layer, in plan ──
      const px = narrow ? 0 : sw, py = narrow ? sh : 0, pw = narrow ? w : w - sw, ph = narrow ? hgt - sh : hgt;
      const s = layers[sel];
      ctx.fillStyle = P.grey(0.55);
      text(ctx, `layer ${sel + 1} of ${nLayers} at ${(((sel + 0.5) * h)).toFixed(2)} m: toolpath in plan`, px + 12, py + 16, "left", "alphabetic", FONT_SMALL);
      if (!s) return;
      let m = 0; for (const p of s.outer) m = Math.max(m, Math.abs(p[0]), Math.abs(p[1]));
      const ext = shape === "House (printed upright)" ? HOUSE.W / 2 + 0.2 : m + 0.1;
      const ps = Math.min((pw - 30) / (2 * ext), (ph - 50) / (2 * ext));
      const cx = px + pw / 2, cy = py + ph / 2 + 10;
      const S = (p: Pt): Pt => [cx + p[0] * ps, cy - p[1] * ps];
      const bead = Math.max(1, (HOUSE.t / (walls + 1)) * ps * (shape === "House (printed upright)" ? 1 : 0.3));
      ctx.strokeStyle = P.ink; ctx.lineWidth = Math.min(bead, 3); ctx.lineJoin = "round";
      const offsetLoop = (l: Loop, d: number): Loop => {
        // offset towards the centroid (small, for parallel perimeters)
        const c = l.reduce((a, p) => [a[0] + p[0] / l.length, a[1] + p[1] / l.length], [0, 0]);
        return l.map((p) => { const dx = p[0] - c[0], dy = p[1] - c[1], r = Math.hypot(dx, dy) || 1; return [p[0] - (dx / r) * d, p[1] - (dy / r) * d] as Pt; });
      };
      const gap = shape === "House (printed upright)" ? HOUSE.t / (walls + 1) : 0.015;
      for (let k = 0; k < walls; k++) {
        path(ctx, offsetLoop(s.outer, gap * (k + 0.5)).map(S), true); ctx.stroke();
        if (s.inner) { path(ctx, offsetLoop(s.inner, -gap * (k + 0.5)).map(S), true); ctx.stroke(); }
      }
      // infill between the walls of a solid layer (roof top, bowl bottom) or inside thin columns
      if (infill !== "None" && !s.inner) {
        ctx.save(); path(ctx, offsetLoop(s.outer, gap * walls).map(S), true); ctx.clip();
        ctx.lineWidth = 0.9; ctx.strokeStyle = P.grey(0.6);
        const step = Math.max(4, gap * ps * 1.5), R = ext * ps * 1.5;
        ctx.beginPath();
        let flip = false;
        for (let t = -R; t <= R; t += step) {
          const ang = (sel % 2 ? 1 : -1) * Math.PI / 4;
          const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
          const x0 = cx + nx * t - dx * R, y0 = cy + ny * t - dy * R, x1 = cx + nx * t + dx * R, y1 = cy + ny * t + dy * R;
          if (infill === "Zigzag" && flip) { ctx.lineTo(x1, y1); ctx.lineTo(x0, y0); } else { if (infill === "Lines") ctx.moveTo(x0, y0); else ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); }
          flip = !flip;
        }
        ctx.stroke(); ctx.restore();
      }
      if (over[sel] && showOver) { ctx.fillStyle = P.ink; text(ctx, "this layer overhangs the one below", px + 12, py + ph - 10, "left", "alphabetic", FONT_SMALL); }
    });
  },
});
