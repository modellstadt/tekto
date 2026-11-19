/// <reference types="vite/client" />
// Next word: a tiny language model. In the lecture book it has read the other
// chapters of the script; here in the playground it has read the tekto docs.
// It counted, for every sequence of one, two or three words, which
// word came next. To write, it looks at the last words, turns the counts into
// probabilities (sharpened or flattened by the temperature) and draws one.
// Large language models do the same thing, with a neural network in place of
// the counting and thousands of words of context in place of three.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, rng, FONT, FONT_SMALL } from "./shared";
// every page of the tekto docs, as text (Vite inlines them at build time)
const DOCS = import.meta.glob("../../../docs/**/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function clean(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/m, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?/g, " ")
    .replace(/\[@[^\]]*\]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*:::.*$/gm, " ")
    .replace(/^\s*\|.*$/gm, " ")
    .replace(/^#+\s.*$/gm, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/[*_`#>~]/g, "")
    .replace(/\(Slides?[^)]*\)/g, " ")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function tokenize(s: string): string[] {
  return s.match(/[A-Za-zÀ-ÿ0-9]+(?:['-][A-Za-zÀ-ÿ0-9]+)*|[.,;:?!]/g) ?? [];
}

const CORPUS = tokenize(Object.values(DOCS).map(clean).join(" \n "));
const JOINED = " " + CORPUS.join(" ") + " ";
const MAX_ORDER = 3;

/** counts[k]: context of k words → next word → count */
const counts: Map<string, Map<string, number>>[] = Array.from({ length: MAX_ORDER + 1 }, () => new Map());
for (let i = 0; i < CORPUS.length - 1; i++) {
  for (let k = 0; k <= MAX_ORDER && k <= i + 1; k++) {
    const ctx = CORPUS.slice(i + 1 - k, i + 1).join(" ");
    let m = counts[k].get(ctx);
    if (!m) counts[k].set(ctx, (m = new Map()));
    const nxt = CORPUS[i + 1];
    m.set(nxt, (m.get(nxt) ?? 0) + 1);
  }
}
const VOCAB = counts[0].get("")!.size;

const PROMPTS = ["The house", "A plan", "A stair", "A building", "The playground", "Claude"] as const;
const isPunct = (t: string) => /^[.,;:?!]$/.test(t);

export const textgen: AppFactory = (env) => {
  let words: string[] = [];
  let start = 0;                 // how many words came from the prompt
  let promptKey = "";
  let cands: { w: string; p: number }[] = [];
  let usedOrder = 0;
  let longest = 0;
  let clock = 0, toWrite = 0;
  const r = rng(Date.now() % 100000);
  let bars: { x: number; y: number; w: number; h: number; word: string }[] = [];

  function candidates(order: number, temp: number) {
    for (let k = Math.min(order, words.length); k >= 0; k--) {
      const m = counts[k].get(words.slice(words.length - k).join(" "));
      if (m && m.size) {
        usedOrder = k;
        const arr = [...m.entries()].map(([w, c]) => ({ w, q: Math.pow(c, 1 / temp) }));
        const z = arr.reduce((a, e) => a + e.q, 0);
        return arr.map((e) => ({ w: e.w, p: e.q / z })).sort((a, b) => b.p - a.p);
      }
    }
    return [];
  }

  function push(w: string) {
    words.push(w);
    // longest stretch of generated words that appears word for word in the source
    const gen = words.slice(start);
    let run = 1;
    while (run < gen.length && JOINED.includes(" " + gen.slice(gen.length - run - 1).join(" ") + " ")) run++;
    longest = Math.max(longest, run);
  }

  return {
    title: "Next word: a tiny language model",
    height: 520,
    fn: (lab) => {
      const prompt = lab.select("Prompt", PROMPTS as unknown as readonly string[], "The house").value;
      const order = lab.slider("Words of context", 1, MAX_ORDER, 2, { step: 1 }).value;
      const temp = lab.slider("Temperature", 0.1, 2.5, 1, { step: 0.05 }).value;
      const auto = lab.toggle("Keep writing", false).value;
      const restart = () => { words = tokenize(prompt); start = words.length; longest = 0; toWrite = 0; };
      lab.button("Next word", () => { const c = candidates(order, temp); if (c.length) push(sample(c)); });
      lab.button("Write 30 words", () => { toWrite = 30; });
      lab.button("Start again", restart);
      if (prompt !== promptKey) { promptKey = prompt; restart(); }

      function sample(c: { w: string; p: number }[]): string {
        let u = r();
        for (const e of c) { u -= e.p; if (u <= 0) return e.w; }
        return c[c.length - 1].w;
      }

      lab.onPointerDown((p) => {
        const b = bars.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
        if (b) push(b.word);   // you choose instead of the dice
      });

      lab.animate((t) => {
        if (!env.visible) return;
        if ((auto || toWrite > 0) && t - clock > 0.25) {
          clock = t;
          const c = candidates(order, temp);
          if (c.length) push(sample(c));
          if (toWrite > 0) toWrite--;
          if (words.length - start > 400) { words.splice(start, 100); }
        }
        cands = candidates(order, temp);
        lab.log("Read", `${CORPUS.length.toLocaleString("en")} words, ${VOCAB.toLocaleString("en")} different`);
        lab.log("Context used", `${usedOrder} word${usedOrder === 1 ? "" : "s"}${usedOrder < order ? " (backed off: never seen)" : ""}`);
        lab.log("Longest copied stretch", `${longest} words`);
      });

      lab.draw((ctx, w, hh) => {
        if (!env.visible) return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const pad = 16;
        // ── the text ──
        ctx.font = "15px Georgia, 'Times New Roman', serif";
        const lineH = 22, maxW = w - 2 * pad;
        const lines: { t: string; gen: boolean; last: boolean }[][] = [[]];
        let lw = 0;
        const topH = h * 0.52;
        words.forEach((wd, i) => {
          const sep = i === 0 || isPunct(wd) ? "" : " ";
          const tw = ctx.measureText(sep + wd).width;
          if (lw + tw > maxW && !isPunct(wd)) { lines.push([]); lw = 0; }
          lines[lines.length - 1].push({ t: (lw === 0 ? "" : sep) + wd, gen: i >= start, last: i === words.length - 1 });
          lw += ctx.measureText((lw === 0 ? "" : sep) + wd).width;
        });
        const maxLines = Math.floor((topH - 20) / lineH);
        const shown = lines.slice(Math.max(0, lines.length - maxLines));
        shown.forEach((ln, li) => {
          let x = pad;
          const y = 28 + li * lineH;
          for (const piece of ln) {
            ctx.font = "15px Georgia, 'Times New Roman', serif";
            ctx.fillStyle = piece.gen ? P.ink : P.grey(0.5);
            ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
            ctx.fillText(piece.t, x, y);
            const tw = ctx.measureText(piece.t).width;
            if (piece.last) { ctx.fillRect(x + (piece.t.startsWith(" ") ? ctx.measureText(" ").width : 0), y + 4, tw - (piece.t.startsWith(" ") ? ctx.measureText(" ").width : 0), 1.5); }
            x += tw;
          }
        });
        // ── next-word candidates ──
        const by = topH + 10;
        ctx.strokeStyle = P.grey(0.25); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad, by - 4); ctx.lineTo(w - pad, by - 4); ctx.stroke();
        ctx.fillStyle = P.grey(0.55);
        const ctxWords = words.slice(words.length - usedOrder).join(" ");
        text(ctx, `after “${ctxWords || "…"}” the model has seen:`, pad, by + 12, "left", "alphabetic", FONT_SMALL);
        const top = cands.slice(0, 8);
        const rowH = Math.min(22, (h - by - 30) / 8);
        const labelW = 120, barMax = w - 2 * pad - labelW - 60;
        bars = [];
        top.forEach((c, i) => {
          const y = by + 22 + i * rowH;
          ctx.fillStyle = P.ink;
          text(ctx, c.w, pad + labelW - 8, y + rowH * 0.62, "right", "alphabetic", FONT);
          ctx.fillStyle = i === 0 ? P.ink : P.grey(0.45);
          ctx.fillRect(pad + labelW, y + 3, Math.max(1, barMax * c.p), rowH - 7);
          ctx.fillStyle = P.grey(0.6);
          text(ctx, `${(c.p * 100).toFixed(c.p < 0.1 ? 1 : 0)} %`, pad + labelW + barMax * c.p + 6, y + rowH * 0.62, "left", "alphabetic", FONT_SMALL);
          bars.push({ x: pad, y, w: w - 2 * pad, h: rowH, word: c.w });
        });
        if (cands.length > 8) {
          ctx.fillStyle = P.grey(0.55);
          const rest = cands.slice(8).reduce((a, c) => a + c.p, 0);
          text(ctx, `+ ${cands.length - 8} other words (${(rest * 100).toFixed(0)} %)`, pad + labelW, by + 22 + 8 * rowH + 10, "left", "alphabetic", FONT_SMALL);
        }
        ctx.fillStyle = P.grey(0.55);
        text(ctx, "click a word to choose it yourself", w - pad, by + 12, "right", "alphabetic", FONT_SMALL);
      });
    },
  };
};
