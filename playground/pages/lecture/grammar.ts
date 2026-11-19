// Shape grammar house. A small set of labelled replacement rules, applied one
// at a time to the first unresolved shape, derives a house elevation from a
// bare lot. Step through a derivation, or look at the "language": the family
// of houses the same rules produce with different random choices.

import type { AppFactory, Pt } from "./shared";
import { P, BAR, clear, fit, path, hatch, text, rng, FONT, FONT_SMALL } from "./shared";

const FH = 2.8;            // storey height
const BAY = 2.4;           // bay module
const LOT = 22;            // lot width

interface Shape {
  label: string;
  terminal: boolean;
  x: number; y: number; w: number; h: number;
  pts?: Pt[];
  a: Record<string, number | string | boolean>;
}
interface Step { rule: string; text: string; shapes: Shape[]; changed: Set<Shape> }
interface Opts { annex: boolean; chimney: boolean; oculus: boolean }

function derive(seed: number, o: Opts): Step[] {
  const rand = rng(seed * 104729 + 17);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  let shapes: Shape[] = [{ label: "Lot", terminal: false, x: 0, y: 0, w: LOT, h: 13, a: {} }];
  const steps: Step[] = [{ rule: "", text: "Start: a lot", shapes, changed: new Set(shapes) }];

  for (let guard = 0; guard < 200; guard++) {
    const idx = shapes.findIndex((s) => !s.terminal);
    if (idx < 0) break;
    const s = shapes[idx];
    const r = apply(s);
    shapes = [...shapes.slice(0, idx), ...r.out, ...shapes.slice(idx + 1)];
    steps.push({ rule: r.rule, text: r.text, shapes, changed: new Set(r.out) });
  }
  return steps;

  function apply(s: Shape): { rule: string; text: string; out: Shape[] } {
    const nt = (label: string, x: number, y: number, w: number, h: number, a: Shape["a"] = {}, pts?: Pt[]): Shape =>
      ({ label, terminal: false, x, y, w, h, a, pts });
    const t = (label: string, x: number, y: number, w: number, h: number, a: Shape["a"] = {}, pts?: Pt[]): Shape =>
      ({ label, terminal: true, x, y, w, h, a, pts });

    switch (s.label) {
      case "Lot": {
        const m = pick([3, 3, 4, 4, 5]), n = pick([1, 2, 2, 3]);
        const w = m * BAY, x = (LOT - w) / 2 + (rand() - 0.5) * 3;
        return {
          rule: "R1", text: `Lot → House(${m} bays, ${n} storeys) + ground`,
          out: [t("Ground", 0, 0, LOT, 0), nt("House", x, 0, w, n * FH, { m, n, grown: false })],
        };
      }
      case "House": {
        if (o.annex && !s.a.grown && rand() < 0.65) {
          const aw = pick([2.4, 3.0, 3.6]), left = rand() < 0.5;
          const ax = left ? s.x - aw : s.x + s.w;
          return {
            rule: "R2", text: "House → House + Annex",
            out: [{ ...s, a: { ...s.a, grown: true } }, nt("Annex", ax, 0, aw, FH, { left })],
          };
        }
        const type = pick(["gable", "gable", "gable", "shed", "flat"]);
        const E = s.h, ov = 0.4;
        let pts: Pt[];
        let rh = 0;
        if (type === "gable") {
          const pitch = pick([30, 38, 45]) * Math.PI / 180;
          rh = (s.w / 2 + ov) * Math.tan(pitch);
          pts = [[s.x - ov, E], [s.x + s.w + ov, E], [s.x + s.w / 2, E + rh]];
        } else if (type === "shed") {
          rh = pick([1.2, 1.8]);
          const up = rand() < 0.5;
          pts = [[s.x - ov, E], [s.x + s.w + ov, E], [s.x + s.w + ov, E + (up ? rh : 0.35)], [s.x - ov, E + (up ? 0.35 : rh)]];
        } else {
          rh = 0.5;
          pts = [[s.x - 0.15, E], [s.x + s.w + 0.15, E], [s.x + s.w + 0.15, E + rh], [s.x - 0.15, E + rh]];
        }
        return {
          rule: "R3", text: `House → Body + Roof(${type})`,
          out: [nt("Body", s.x, 0, s.w, E, { ...s.a }), nt("Roof", s.x, E, s.w, rh, { type }, pts)],
        };
      }
      case "Body": {
        const n = s.a.n as number;
        const out = Array.from({ length: n }, (_, k) => nt("Floor", s.x, k * FH, s.w, FH, { k, m: s.a.m }));
        return { rule: "R4", text: `Body → Floor × ${n}`, out };
      }
      case "Floor": {
        const m = s.a.m as number, k = s.a.k as number;
        const door = Math.floor(m / 2);
        const out = Array.from({ length: m }, (_, i) => nt("Bay", s.x + i * BAY, s.y, BAY, FH, { k, door: k === 0 && i === door }));
        return { rule: "R5", text: `Floor → Bay × ${m}`, out };
      }
      case "Bay": {
        if (s.a.door) return { rule: "R6", text: "Bay(entrance) → Door", out: [t("Door", s.x, s.y, s.w, s.h)] };
        const k = s.a.k as number;
        const u = rand();
        if (k > 0 && u < 0.18) return { rule: "R7", text: "Bay → French window", out: [t("French", s.x, s.y, s.w, s.h)] };
        if (u > 0.86) return { rule: "R8", text: "Bay → Wall", out: [t("Wall", s.x, s.y, s.w, s.h)] };
        return { rule: "R9", text: "Bay → Window", out: [t("Window", s.x, s.y, s.w, s.h)] };
      }
      case "Roof": {
        const type = s.a.type as string;
        const out: Shape[] = [t("Roof", s.x, s.y, s.w, s.h, s.a, s.pts)];
        const bits: string[] = [];
        if (o.oculus && type === "gable" && s.h > 2.6) {
          out.push(t("Oculus", s.x + s.w / 2 - 0.45, s.y + s.h * 0.38, 0.9, 0.9));
          bits.push("Oculus");
        }
        if (o.chimney && type !== "flat" && rand() < 0.7) {
          const cx = s.x + s.w * (0.2 + rand() * 0.6);
          const top = roofHeightAt(s, cx);
          out.push(t("Chimney", cx - 0.35, s.y, 0.7, top - s.y + 0.9, { top }));
          bits.push("Chimney");
        }
        return { rule: bits.length ? "R10" : "R11", text: bits.length ? `Roof → Roof + ${bits.join(" + ")}` : "Roof → Roof", out };
      }
      case "Annex": {
        const left = s.a.left as boolean;
        const roof: Pt[] = left
          ? [[s.x - 0.3, s.h], [s.x + s.w, s.h], [s.x + s.w, s.h + 0.9], [s.x - 0.3, s.h + 0.25]]
          : [[s.x, s.h], [s.x + s.w + 0.3, s.h], [s.x + s.w + 0.3, s.h + 0.25], [s.x, s.h + 0.9]];
        return {
          rule: "R12", text: "Annex → Wall + shed roof + Bay",
          out: [t("AnnexBody", s.x, 0, s.w, s.h), t("Roof", s.x, s.h, s.w, 0.9, { type: "shed" }, roof),
                nt("Bay", s.x + (s.w - BAY) / 2, 0, BAY, FH, { k: 0, door: rand() < 0.5 })],
        };
      }
    }
    return { rule: "?", text: `${s.label} (no rule)`, out: [{ ...s, terminal: true }] };
  }
}

function roofHeightAt(s: Shape, x: number): number {
  const p = s.pts!;
  if (p.length === 3) {
    const [a, , c] = p;
    const t = Math.abs(x - c[0]) / (c[0] - a[0]);
    return c[1] - (c[1] - a[1]) * t;
  }
  const t = (x - p[0][0]) / (p[1][0] - p[0][0]);
  return p[3][1] + (p[2][1] - p[3][1]) * t;
}

// ── Drawing ──────────────────────────────────────────────────────────────

function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], X: (x: number) => number, Y: (y: number) => number, s: number,
  labels: boolean, changed?: Set<Shape>) {
  const R = (x: number, y: number, w: number, h: number): Pt[] => [[X(x), Y(y)], [X(x + w), Y(y)], [X(x + w), Y(y + h)], [X(x), Y(y + h)]];
  const lw = Math.max(0.6, Math.min(1.4, s * 0.05));

  // Pass 1: masses (body, annex, roof, chimney) so that openings sit on top.
  for (const sh of shapes) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = P.ink;
    ctx.fillStyle = P.paper;
    switch (sh.label) {
      case "Ground":
        ctx.lineWidth = lw * 1.6;
        path(ctx, [[X(0), Y(0)], [X(LOT), Y(0)]]);
        ctx.stroke();
        break;
      case "Roof": {
        const q = sh.pts!.map(([x, y]) => [X(x), Y(y)] as Pt);
        path(ctx, q, true); ctx.fill();
        ctx.strokeStyle = P.grey(0.35);
        if (sh.a.type !== "flat") hatch(ctx, q, Math.max(2.5, s * 0.22), Math.PI / 2, 0.5);
        ctx.strokeStyle = P.ink;
        path(ctx, q, true); ctx.stroke();
        break;
      }
      case "Chimney":
        path(ctx, R(sh.x, sh.a.top as number - 0.4, sh.w, sh.h - (sh.a.top as number - sh.y) + 0.4), true);
        ctx.fillStyle = P.ink; ctx.fill();
        break;
      case "AnnexBody":
        path(ctx, R(sh.x, sh.y, sh.w, sh.h), true); ctx.fill(); ctx.stroke();
        break;
    }
  }
  // outline of the main body = union of its terminal bays
  for (const sh of shapes) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = P.ink;
    ctx.fillStyle = P.ink;
    const cx = sh.x + sh.w / 2;
    switch (sh.label) {
      case "Window": case "French": case "Door": case "Wall": {
        path(ctx, R(sh.x, sh.y, sh.w, sh.h), true);
        ctx.fillStyle = P.paper; ctx.fill();
        ctx.strokeStyle = P.grey(0.18); ctx.stroke();
        ctx.strokeStyle = P.ink;
        if (sh.label === "Window") {
          const ww = 1.2, z0 = sh.y + 0.9, z1 = sh.y + 2.3;
          path(ctx, R(cx - ww / 2, z0, ww, z1 - z0), true); ctx.stroke();
          path(ctx, [[X(cx), Y(z0)], [X(cx), Y(z1)]]); ctx.stroke();
          path(ctx, [[X(cx - ww / 2 - 0.1), Y(z0)], [X(cx + ww / 2 + 0.1), Y(z0)]]); ctx.lineWidth = lw * 1.8; ctx.stroke();
        } else if (sh.label === "French") {
          const ww = 1.2, z0 = sh.y + 0.05, z1 = sh.y + 2.35;
          path(ctx, R(cx - ww / 2, z0, ww, z1 - z0), true); ctx.stroke();
          path(ctx, [[X(cx), Y(z0)], [X(cx), Y(z1)]]); ctx.stroke();
          // balcony railing
          const bw = 1.8;
          path(ctx, R(cx - bw / 2, sh.y, bw, 1.0), true); ctx.fillStyle = P.paper; ctx.fill(); ctx.stroke();
          for (let i = 1; i < 6; i++) { const xx = cx - bw / 2 + (bw * i) / 6; path(ctx, [[X(xx), Y(sh.y)], [X(xx), Y(sh.y + 1)]]); ctx.stroke(); }
        } else if (sh.label === "Door") {
          const dw = 1.1, z1 = sh.y + 2.25;
          path(ctx, R(cx - dw / 2, sh.y, dw, z1 - sh.y), true); ctx.fillStyle = P.ink; ctx.fill();
          ctx.fillStyle = P.paper;
          ctx.beginPath(); ctx.arc(X(cx + dw / 2 - 0.2), Y(sh.y + 1.05), Math.max(1, lw), 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case "Oculus":
        ctx.beginPath(); ctx.arc(X(cx), Y(sh.y + sh.h / 2), (sh.w / 2) * s, 0, Math.PI * 2);
        ctx.fillStyle = P.paper; ctx.fill(); ctx.stroke();
        path(ctx, [[X(sh.x), Y(sh.y + sh.h / 2)], [X(sh.x + sh.w), Y(sh.y + sh.h / 2)]]); ctx.stroke();
        break;
    }
  }
  // outer contour of the body (all terminal bays of the main house)
  const bays = shapes.filter((sh) => ["Window", "French", "Door", "Wall"].includes(sh.label) && !isAnnexBay(sh, shapes));
  if (bays.length) {
    const x0 = Math.min(...bays.map((b) => b.x)), x1 = Math.max(...bays.map((b) => b.x + b.w));
    const y1 = Math.max(...bays.map((b) => b.y + b.h));
    ctx.strokeStyle = P.ink; ctx.lineWidth = lw * 1.3;
    path(ctx, R(x0, 0, x1 - x0, y1), true); ctx.stroke();
  }

  // Non-terminal shapes: dashed outline + label.
  for (const sh of shapes) {
    if (sh.terminal) continue;
    const q = sh.pts ? sh.pts.map(([x, y]) => [X(x), Y(y)] as Pt) : R(sh.x, sh.y, sh.w, sh.h);
    const isNew = changed?.has(sh);
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = isNew ? 1.6 : 0.9;
    ctx.strokeStyle = isNew ? P.ink : P.grey(0.55);
    path(ctx, q, true); ctx.stroke();
    ctx.setLineDash([]);
    if (labels) {
      ctx.fillStyle = isNew ? P.ink : P.grey(0.6);
      const cx = q.reduce((a, p) => a + p[0], 0) / q.length, cy = q.reduce((a, p) => a + p[1], 0) / q.length;
      text(ctx, sh.label, cx, cy, "center", "middle", s > 12 ? FONT : FONT_SMALL);
    }
  }
  // terminals created in the last step get a light underline mark
  if (changed) {
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.5;
    for (const sh of changed) {
      if (!sh.terminal || sh.label === "Ground") continue;
      const q = sh.pts ? sh.pts.map(([x, y]) => [X(x), Y(y)] as Pt) : R(sh.x, sh.y, sh.w, sh.h);
      ctx.globalAlpha = 0.18;
      path(ctx, q, true); ctx.fillStyle = P.ink; ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function isAnnexBay(b: Shape, shapes: Shape[]): boolean {
  return shapes.some((s) => s.label === "AnnexBody" && b.x >= s.x - 1e-6 && b.x + b.w <= s.x + s.w + 1e-6 && b.y < FH);
}

// ── App ──────────────────────────────────────────────────────────────────

export const grammar: AppFactory = (env) => {
  let step = 0;
  let lastKey = "";
  let clock = 0;

  return {
    title: "Shape grammar house",
    height: 500,
    fn: (lab) => {
      const view = lab.select("View", ["Derivation", "Language"] as const, "Derivation").value;
      const seed = lab.slider("Seed", 1, 300, 23, { step: 1 }).value;
      const o: Opts = {
        annex: lab.toggle("Rule: annex", true, { group: "Rules" }).value,
        chimney: lab.toggle("Rule: chimney", true, { group: "Rules" }).value,
        oculus: lab.toggle("Rule: oculus", true, { group: "Rules" }).value,
      };
      const labels = lab.toggle("Show labels", true, { group: "Display" }).value;
      const play = lab.toggle("Auto-play", false, { group: "Display" }).value;

      const steps = derive(seed, o);
      const key = `${seed}|${o.annex}|${o.chimney}|${o.oculus}`;
      if (key !== lastKey) { lastKey = key; step = steps.length - 1; }
      step = Math.min(step, steps.length - 1);
      const status = () => {
        const cur = steps[step];
        lab.log("Rules applied", `${step}`);
        lab.log("Shapes", `${cur.shapes.length} (${cur.shapes.filter((s) => !s.terminal).length} unresolved)`);
      };
      if (view === "Language") lab.log("Houses", `seeds ${seed}–${seed + 11}, same rules`);
      else if (!play) status();

      if (view === "Derivation") {
        const g = { group: "Parameters" };
        lab.button("Restart", () => { step = 0; }, g);
        lab.button("Step ▸", () => { step = Math.min(step + 1, steps.length - 1); }, g);
        lab.button("◂ Back", () => { step = Math.max(step - 1, 0); }, g);
        lab.button("Derive all", () => { step = steps.length - 1; }, g);
      }
      if (play && view === "Derivation") {
        lab.animate((t) => {
          if (!env.visible) return;
          if (t - clock > 0.7) { clock = t; step = step >= steps.length - 1 ? 0 : step + 1; }
          status();
        });
      }

      lab.draw((ctx, w, h) => {
        clear(ctx, w, h);
        if (view === "Language") {
          const cols = w > 520 ? 4 : 3, rows = cols === 4 ? 3 : 4;
          const cw = w / cols, ch = (h - BAR) / rows;
          for (let i = 0; i < cols * rows; i++) {
            const sd = seed + i;
            const st = derive(sd, o);
            const last = st[st.length - 1];
            const c = i % cols, r = Math.floor(i / cols);
            const v = fit(0, -0.5, LOT, 13, c * cw, r * ch, cw, ch, 10);
            drawShapes(ctx, last.shapes, v.X, v.Y, v.s, false);
            ctx.fillStyle = P.grey(0.5);
            text(ctx, `#${sd}`, c * cw + 8, r * ch + 14, "left", "alphabetic", FONT_SMALL);
          }
          return;
        }
        const cur = steps[step];
        const v = fit(0, -0.5, LOT, 13.5, 0, 34, w, h - 34 - BAR, 14);
        drawShapes(ctx, cur.shapes, v.X, v.Y, v.s, labels, step > 0 ? cur.changed : undefined);
        ctx.fillStyle = P.ink;
        text(ctx, `${cur.rule ? cur.rule + "  " : ""}${cur.text}`, 14, 22, "left", "alphabetic", FONT);
        ctx.fillStyle = P.grey(0.5);
        text(ctx, `step ${step} / ${steps.length - 1}`, w - 14, 22, "right", "alphabetic", FONT_SMALL);
      });
    },
  };
};
