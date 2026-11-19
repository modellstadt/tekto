// Biomorphs, after Richard Dawkins (The Blind Watchmaker, 1986). Nine genes
// drive a recursive branching drawing: eight set the branch vectors, one the
// depth of recursion. The parent sits in the middle; each of its eight
// children differs in one gene. There is no fitness function: you choose.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, rng, FONT_SMALL } from "./shared";

type Genome = number[]; // g[0..7] in −9..9, g[8] = depth 1..9

function segments(g: Genome): number[] {
  const dx = [-g[1], -g[0], 0, g[0], g[1], g[2], 0, -g[2]];
  const dy = [g[5], g[4], g[3], g[4], g[5], g[6], g[7], g[6]];
  const out: number[] = [];
  const tree = (x: number, y: number, len: number, dir: number) => {
    dir = ((dir % 8) + 8) % 8;
    const x2 = x + len * dx[dir], y2 = y + len * dy[dir];
    out.push(x, y, x2, y2, len);
    if (len > 1) { tree(x2, y2, len - 1, dir - 1); tree(x2, y2, len - 1, dir + 1); }
  };
  tree(0, 0, g[8], 2);
  return out;
}

function mutate(g: Genome, i: number, delta: number): Genome {
  const c = [...g];
  if (i === 8) c[8] = Math.min(9, Math.max(1, c[8] + Math.sign(delta)));
  else c[i] = Math.min(9, Math.max(-9, c[i] + delta));
  return c;
}

function drawBiomorph(ctx: CanvasRenderingContext2D, g: Genome, cx: number, cy: number, size: number, lw: number) {
  const s = segments(g);
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < s.length; i += 5) {
    minx = Math.min(minx, s[i], s[i + 2]); maxx = Math.max(maxx, s[i], s[i + 2]);
    miny = Math.min(miny, s[i + 1], s[i + 3]); maxy = Math.max(maxy, s[i + 1], s[i + 3]);
  }
  const sc = Math.min(size / Math.max(maxx - minx, 1), size / Math.max(maxy - miny, 1), size / 6);
  const ox = cx - ((minx + maxx) / 2) * sc, oy = cy + ((miny + maxy) / 2) * sc;
  ctx.beginPath();
  for (let i = 0; i < s.length; i += 5) {
    ctx.moveTo(ox + s[i] * sc, oy - s[i + 1] * sc);
    ctx.lineTo(ox + s[i + 2] * sc, oy - s[i + 3] * sc);
  }
  ctx.lineWidth = lw;
  ctx.stroke();
}

export const biomorph: AppFactory = (env) => {
  const START: Genome = [1, 1, -1, 2, -1, 1, -1, 1, 4];
  let parent: Genome = START;
  let children: { g: Genome; gene: number; delta: number }[] = [];
  let history: Genome[] = [];
  let generation = 0;
  let seed = 1;
  let layout: { x: number; y: number; cw: number; ch: number } | null = null;

  const breed = (size: number) => {
    const r = rng(seed++ * 977 + generation);
    const genes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = genes.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [genes[i], genes[j]] = [genes[j], genes[i]]; }
    children = genes.slice(0, 8).map((gene) => {
      let delta = (r() < 0.5 ? -1 : 1) * size;
      // at the end of a gene's range, mutate the other way
      if (mutate(parent, gene, delta)[gene] === parent[gene]) delta = -delta;
      return { g: mutate(parent, gene, delta), gene, delta };
    });
  };

  return {
    title: "Biomorphs: you are the fitness function",
    height: 520,
    fn: (lab) => {
      const size = lab.slider("Mutation size", 1, 3, 1, { step: 1 }).value;
      const showGenes = lab.toggle("Show genes", false).value;
      lab.button("◂ Back", () => { if (history.length) { parent = history.pop()!; generation--; breed(size); } });
      lab.button("New children", () => breed(size));
      lab.button("Random parent", () => {
        const r = rng(Date.now() % 100000);
        history.push(parent);
        parent = [...Array.from({ length: 8 }, () => Math.round(r() * 12 - 6)), 3 + Math.floor(r() * 5)];
        generation++;
        breed(size);
      });
      lab.button("Reset", () => { parent = START; history = []; generation = 0; breed(size); });

      if (!children.length || children[0].delta !== 0 && Math.abs(children[0].delta) !== size) breed(size);

      lab.onPointerDown((p) => {
        if (!layout) return;
        const c = Math.floor((p.x - layout.x) / layout.cw), r = Math.floor((p.y - layout.y) / layout.ch);
        if (c < 0 || c > 2 || r < 0 || r > 2 || (c === 1 && r === 1)) return;
        const k = r * 3 + c;
        const idx = k > 4 ? k - 1 : k;
        history.push(parent);
        parent = children[idx].g;
        generation++;
        breed(size);
      });

      // pointer clicks change the children: redraw (and relog) every frame while visible
      lab.animate(() => {
        if (!env.visible) return;
        lab.log("Generation", generation);
        lab.log("Parent genes", `${parent.slice(0, 8).join(" ")} · depth ${parent[8]}`);
      });

      lab.draw((ctx, w, h) => {
        if (!env.visible) return;
        clear(ctx, w, h);
        const top = 22, avail = h - BAR - top;
        const side = Math.min(w - 16, avail - 8);
        const cw = side / 3, ch = side / 3;
        const x0 = (w - side) / 2, y0 = top + (avail - side) / 2;
        layout = { x: x0, y: y0, cw, ch };
        ctx.lineCap = "round";
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
          const k = r * 3 + c;
          const cx = x0 + c * cw + cw / 2, cy = y0 + r * ch + ch / 2;
          const isParent = k === 4;
          const item = isParent ? { g: parent, gene: -1, delta: 0 } : children[k > 4 ? k - 1 : k];
          ctx.strokeStyle = isParent ? P.ink : P.grey(0.25);
          ctx.lineWidth = isParent ? 2 : 1;
          ctx.strokeRect(x0 + c * cw + 4, y0 + r * ch + 4, cw - 8, ch - 8);
          ctx.strokeStyle = P.ink;
          drawBiomorph(ctx, item.g, cx, cy, cw * 0.72, isParent ? 1.3 : 1);
          ctx.fillStyle = P.grey(0.55);
          if (isParent) text(ctx, `parent · gen ${generation}`, x0 + c * cw + 10, y0 + r * ch + 18, "left", "alphabetic", FONT_SMALL);
          else if (showGenes) text(ctx, `gene ${item.gene + 1} ${item.delta > 0 ? "+" : "−"}${Math.abs(item.delta)}`, x0 + c * cw + 10, y0 + r * ch + 18, "left", "alphabetic", FONT_SMALL);
          if (showGenes) text(ctx, item.g.join(" "), x0 + c * cw + 10, y0 + (r + 1) * ch - 10, "left", "alphabetic", FONT_SMALL);
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "click a child to breed from it", x0 + 4, y0 - 7, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
