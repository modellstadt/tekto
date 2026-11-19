// Timber floor: pattern and grain. Wood looks lighter or darker depending on
// how its grain runs relative to the light and the viewer (it reflects
// anisotropically, along the fibres). The same planks laid in a different
// pattern therefore make a floor that changes as you walk across the room.

import { noise } from "../../../src";
import type { AppFactory } from "./shared";
import { P, BAR, clear, text, rng, FONT_SMALL } from "./shared";

interface Plank { cx: number; cy: number; len: number; wid: number; ang: number; tone: number; seed: number }
const PATTERNS = ["Straight, random lengths", "Brick bond", "Herringbone", "Basket weave", "Diagonal"] as const;
const ROOM = { W: 5.0, D: 3.6 };

function layout(kind: string, wid: number, ratio: number, seed: number): Plank[] {
  const r = rng(seed), out: Plank[] = [];
  const add = (cx: number, cy: number, len: number, w: number, ang: number) => out.push({ cx, cy, len, wid: w, ang, tone: r(), seed: Math.floor(r() * 1e6) });
  const L = wid * ratio;
  if (kind === "Straight, random lengths" || kind === "Brick bond" || kind === "Diagonal") {
    const ang = kind === "Diagonal" ? Math.PI / 4 : 0;
    const ext = Math.hypot(ROOM.W, ROOM.D);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let v = -ext; v < ext; v += wid) {
      let u = kind === "Brick bond" ? (Math.round(v / wid) % 2 ? -L / 2 : 0) - ext : -ext - r() * L;
      while (u < ext) {
        const len = kind === "Brick bond" ? L : L * (0.45 + r() * 0.9);
        const cu = u + len / 2, cv = v + wid / 2;
        add(ROOM.W / 2 + cu * ca - cv * sa, ROOM.D / 2 + cu * sa + cv * ca, len, wid, ang);
        u += len;
      }
    }
  } else if (kind === "Herringbone") {
    // horizontal planks at k(w,w) + m(2L,0), vertical ones offset by (L, w - L); the whole pattern turned 45°
    const n = Math.max(2, Math.round(ratio)), Lh = n * wid, a = Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
    const ext = Math.hypot(ROOM.W, ROOM.D) * 1.2;
    const put = (x: number, y: number, len: number, horizontal: boolean) => {
      const cx = x + (horizontal ? len : wid) / 2, cy = y + (horizontal ? wid : len) / 2;
      add(ROOM.W / 2 + cx * ca - cy * sa, ROOM.D / 2 + cx * sa + cy * ca, len, wid, horizontal ? a : a + Math.PI / 2);
    };
    for (let k = -Math.ceil(ext / wid); k <= Math.ceil(ext / wid); k++) for (let m = -Math.ceil(ext / (2 * Lh)) - 2; m <= Math.ceil(ext / (2 * Lh)) + 2; m++) {
      const x = k * wid + m * 2 * Lh, y = k * wid;
      if (Math.abs(x) > ext || Math.abs(y) > ext) continue;
      put(x, y, Lh, true);
      put(x + Lh, y + wid - Lh, Lh, false);
    }
  } else {
    // basket weave: squares of three slats, alternating direction
    const sq = wid * 3;
    for (let i = 0; i * sq < ROOM.W + sq; i++) for (let j = 0; j * sq < ROOM.D + sq; j++) {
      const hor = (i + j) % 2 === 0;
      for (let s = 0; s < 3; s++) {
        const off = (s + 0.5) * wid;
        if (hor) add(i * sq + sq / 2, j * sq + off, sq, wid, 0); else add(i * sq + off, j * sq + sq / 2, sq, wid, Math.PI / 2);
      }
    }
  }
  return out;
}

export const woodfloor: AppFactory = () => ({
  title: "Timber floor: pattern and grain",
  height: 500,
  fn: (lab) => {
    const kind = lab.select("Pattern", PATTERNS, "Herringbone").value;
    const wid = lab.slider("Plank width mm", 60, 240, 90, { step: 5 }).value / 1000;
    const ratio = lab.slider("Length : width", 3, 12, 6, { step: 1 }).value;
    const light = lab.slider("Light and view from °", 0, 180, 30, { step: 1, group: "Light" }).value;
    const sheen = lab.slider("Sheen (oiled → lacquered)", 0, 1, 0.6, { step: 0.01, group: "Light" }).value;
    const grain = lab.toggle("Draw grain", true, { group: "Light" }).value;
    const seed = lab.slider("Seed", 1, 50, 3, { step: 1, group: "Light" }).value;

    const planks = layout(kind, wid, ratio, seed);
    const la = (light * Math.PI) / 180;
    const inRoom = planks.filter((p) => p.cx > -p.len && p.cx < ROOM.W + p.len && p.cy > -p.len && p.cy < ROOM.D + p.len);
    lab.log("Planks (incl. cut)", inRoom.length);
    lab.log("Grain directions", kind === "Straight, random lengths" || kind === "Brick bond" ? "1" : "2");

    lab.draw((ctx, w, hh) => {
      clear(ctx, w, hh);
      const h = hh - BAR;
      const s = Math.min((w - 24) / ROOM.W, (h - 40) / ROOM.D);
      const ox = (w - ROOM.W * s) / 2, oy = 26;
      ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, ROOM.W * s, ROOM.D * s); ctx.clip();
      for (const p of inRoom) {
        // anisotropic sheen: strongest when the fibres run towards the light
        const along = Math.abs(Math.cos(p.ang - la));
        const b = 0.3 + 0.25 * p.tone + sheen * 0.45 * Math.pow(along, 3);
        ctx.save();
        ctx.translate(ox + p.cx * s, oy + p.cy * s); ctx.rotate(p.ang);
        const L = p.len * s, W = p.wid * s;
        ctx.fillStyle = P.grey(1 - b);
        ctx.fillRect(-L / 2, -W / 2, L, W);
        if (grain && W > 3) {
          ctx.beginPath(); ctx.rect(-L / 2, -W / 2, L, W); ctx.clip();
          ctx.strokeStyle = P.grey(Math.min(1, 1 - b + 0.18)); ctx.lineWidth = 0.6;
          const lines = Math.max(3, Math.round(W / 3));
          for (let k = 0; k < lines; k++) {
            ctx.beginPath();
            for (let i = 0; i <= 24; i++) {
              const u = -L / 2 + (L * i) / 24;
              const v = -W / 2 + ((k + 0.5) / lines) * W + (noise(p.seed * 0.01 + i * 0.15, k * 0.7) - 0.5) * W * 0.5;
              if (i) ctx.lineTo(u, v); else ctx.moveTo(u, v);
            }
            ctx.stroke();
          }
        }
        ctx.restore();
        ctx.strokeStyle = P.grey(0.85); ctx.lineWidth = 0.5;
        ctx.save(); ctx.translate(ox + p.cx * s, oy + p.cy * s); ctx.rotate(p.ang); ctx.strokeRect(-p.len * s / 2, -p.wid * s / 2, p.len * s, p.wid * s); ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(ox, oy, ROOM.W * s, ROOM.D * s);
      // light direction
      const ax = ox + ROOM.W * s / 2 - Math.cos(la) * (ROOM.W * s / 2 + 2), ay = oy + ROOM.D * s / 2 - Math.sin(la) * (ROOM.D * s / 2 + 2);
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.grey(0.55);
      text(ctx, `${ROOM.W} × ${ROOM.D} m room · light and viewer from the dot · planks along the light look brighter`, ox, 16, "left", "alphabetic", FONT_SMALL);
    });
  },
});
