// Marble: slabs and matching. A block is sawn into consecutive slabs; because
// the veins run through the block, neighbouring slabs are almost identical.
// Laid side by side, flipped like the pages of a book (bookmatching), they form
// mirror images; four of them make a quarter match. Thicker slabs, or slabs
// that are not neighbours, and the symmetry falls apart.

import { noise } from "../../../src";
import type { AppFactory } from "./shared";
import { P, BAR, clear, text, FONT_SMALL } from "./shared";

const LAYOUTS = ["As cut (slip match)", "Bookmatch", "Quarter match", "Random slabs, random turns", "One slab repeated"] as const;
const SW = 120, SH = 180;          // slab texture resolution (px)

export const marble: AppFactory = () => {
  const cache = new Map<string, HTMLCanvasElement>();

  function slab(index: number, o: { thick: number; scale: number; turb: number; dir: number; seed: number }, key: string): HTMLCanvasElement {
    const k = `${key}|${index}`;
    const hit = cache.get(k);
    if (hit) return hit;
    const c = document.createElement("canvas");
    c.width = SW; c.height = SH;
    const g = c.getContext("2d")!;
    const img = g.createImageData(SW, SH);
    const z = o.seed * 3.1 + index * o.thick * 0.004;         // depth of this slab in the block (1 unit ≈ 250 mm)
    const dx = Math.cos(o.dir), dy = Math.sin(o.dir);
    const ink = P.dark ? [230, 230, 230] : [20, 20, 20], paper = P.dark ? [38, 38, 38] : [250, 250, 248];
    for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) {
      const x = (i / SW) * 1.2 * o.scale, y = (j / SH) * 1.8 * o.scale;
      let t = 0, amp = 1, f = 1.2;
      for (let oc = 0; oc < 4; oc++) { t += Math.abs(noise(x * f, y * f, z * f + oc * 10) - 0.5) * amp; amp *= 0.5; f *= 2; }
      const v = Math.abs(Math.sin((x * dx + y * dy) * 3.2 + t * o.turb * 5));
      const vein = Math.pow(1 - v, 14) * 0.85 + Math.pow(1 - v, 3) * 0.15;
      const q = (j * SW + i) * 4;
      for (let ch = 0; ch < 3; ch++) img.data[q + ch] = paper[ch] + (ink[ch] - paper[ch]) * Math.min(1, vein);
      img.data[q + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (cache.size > 64) cache.clear();
    cache.set(k, c);
    return c;
  }

  return {
    title: "Marble: slabs and bookmatching",
    height: 520,
    fn: (lab) => {
      const layout = lab.select("Layout", LAYOUTS, "Bookmatch").value;
      const thick = lab.slider("Slab thickness incl. saw cut mm", 10, 120, 22, { step: 1, group: "Block" }).value;
      const skip = lab.slider("Use every n-th slab", 1, 6, 1, { step: 1, group: "Block" }).value;
      const scale = lab.slider("Vein scale", 0.5, 2.5, 1.2, { step: 0.05, group: "Stone" }).value;
      const turb = lab.slider("Turbulence", 0, 1.5, 0.7, { step: 0.01, group: "Stone" }).value;
      const dirDeg = lab.slider("Vein direction °", 0, 180, 60, { step: 1, group: "Stone" }).value;
      const seed = lab.slider("Block", 1, 40, 7, { step: 1, group: "Stone" }).value;
      const o = { thick, scale, turb, dir: (dirDeg * Math.PI) / 180, seed };
      const key = `${thick}|${scale}|${turb}|${dirDeg}|${seed}|${P.dark}`;

      const quarter = layout === "Quarter match";
      // for each panel: slab index and mirroring
      const panels: { idx: number; fx: boolean; fy: boolean; rot: number }[] = [];
      const r = (i: number) => { const s = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return s - Math.floor(s); };
      for (let i = 0; i < 4; i++) {
        if (layout === "As cut (slip match)") panels.push({ idx: i * skip, fx: false, fy: false, rot: 0 });
        else if (layout === "Bookmatch") panels.push({ idx: i * skip, fx: i % 2 === 1, fy: false, rot: 0 });
        else if (quarter) panels.push({ idx: i * skip, fx: i % 2 === 1, fy: i >= 2, rot: 0 });
        else if (layout === "One slab repeated") panels.push({ idx: 0, fx: false, fy: false, rot: 0 });
        else panels.push({ idx: Math.floor(r(i) * 20) * skip, fx: r(i + 7) > 0.5, fy: r(i + 9) > 0.5, rot: 0 });
      }
      lab.log("Slabs used", [...new Set(panels.map((p) => p.idx + 1))].join(", "));
      lab.log("Distance between neighbouring slabs", `${thick * skip} mm`);

      lab.draw((ctx, w, hh) => {
        clear(ctx, w, hh);
        const h = hh - BAR;
        // block diagram on the left: the slabs as sawn
        const bw = Math.min(110, w * 0.2);
        const cols = quarter ? 2 : 4, rows = quarter ? 2 : 1;
        const pw = Math.min((w - bw - 60) / cols, ((h - 50) / rows) * (SW / SH)), ph = pw * (SH / SW);
        const gx = bw + 40 + (w - bw - 40 - cols * pw) / 2, gy = 30 + (h - 30 - rows * ph) / 2;
        panels.forEach((p, i) => {
          const c = i % cols, rr = Math.floor(i / cols);
          const X = gx + c * pw, Y = gy + rr * ph;
          ctx.save();
          ctx.translate(X + pw / 2, Y + ph / 2);
          ctx.scale(p.fx ? -1 : 1, p.fy ? -1 : 1);
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(slab(p.idx, o, key), -pw / 2, -ph / 2, pw, ph);
          ctx.restore();
          ctx.strokeStyle = P.grey(0.5); ctx.lineWidth = 1; ctx.strokeRect(X + 0.5, Y + 0.5, pw, ph);
          ctx.fillStyle = P.grey(0.6);
          text(ctx, `${p.idx + 1}${p.fx || p.fy ? " flipped" : ""}`, X + 4, Y + ph + 12, "left", "alphabetic", FONT_SMALL);
        });
        // block with slab lines
        const bx = 16, by = gy + 10, bd = Math.min(h - by - 30, 150);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bd);
        const n = 12;
        for (let k = 1; k < n; k++) {
          const y = by + (k / n) * bd;
          const used = panels.some((p) => p.idx === k - 1 || p.idx === k);
          ctx.strokeStyle = used ? P.ink : P.grey(0.3); ctx.lineWidth = used ? 1.2 : 0.6;
          ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke();
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "block, sawn into slabs", bx, by - 6, "left", "alphabetic", FONT_SMALL);
        text(ctx, "wall", gx, gy - 8, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
