// Brick bonds. The same brick, laid in different orders, makes different walls:
// stretcher, header, English, Flemish, English garden and stack bond, each a
// rule for the next course. A digital bond lets every brick turn a little,
// driven by a drag-able attractor, as in Gramazio Kohler's robotically laid
// façade for the Gantenbein winery: an image appears in the shading.

import type { AppFactory } from "./shared";
import { P, BAR, clear, text, dot, FONT_SMALL } from "./shared";

// brick 240 × 115 × 71 mm, joints 10 mm
const LEN = 250, HEAD = 125, COURSE = 81;
const WALL_W = 3500, WALL_H = 2100;

type Brick = { x: number; w: number; header: boolean; course: number };
const BONDS = ["Stretcher", "Header", "English", "Flemish", "English garden", "Stack", "Digital (rotated)"] as const;

function course(bond: string, k: number): Brick[] {
  const out: Brick[] = [];
  const push = (x: number, w: number, header: boolean) => out.push({ x, w, header, course: k });
  let x = 0;
  const lay = (pattern: boolean[], start: number) => {
    x = start;
    let i = 0;
    while (x < WALL_W) { const hd = pattern[i++ % pattern.length]; push(x, hd ? HEAD : LEN, hd); x += hd ? HEAD : LEN; }
  };
  switch (bond) {
    case "Stretcher": case "Digital (rotated)": lay([false], k % 2 ? -LEN / 2 : 0); break;
    case "Header": lay([true], k % 2 ? -HEAD / 2 : 0); break;
    case "Stack": lay([false], 0); break;
    case "English": lay([k % 2 === 1], k % 2 ? -HEAD / 2 : 0); break;          // header courses start with a queen closer
    case "Flemish": lay([false, true], k % 2 ? -(LEN + HEAD) / 2 : 0); break;
    case "English garden": k % 4 === 3 ? lay([true], -HEAD / 2) : lay([false], k % 2 ? -LEN / 2 : 0); break;
  }
  return out.filter((b) => b.x + b.w > 0);
}

export const bricks: AppFactory = (env) => {
  let attractor: [number, number] = [WALL_W * 0.35, WALL_H * 0.55];
  let view = { s: 1, ox: 0, oy: 0 };
  let drag = false;

  return {
    title: "Brick bonds",
    height: 500,
    fn: (lab) => {
      const bond = lab.select("Bond", BONDS, "Flemish").value;
      const joints = lab.toggle("Mark stacked joints", true).value;
      const maxRot = bond === "Digital (rotated)" ? lab.slider("Max rotation °", 0, 60, 35, { step: 1, group: "Digital" }).value : 0;
      const radius = bond === "Digital (rotated)" ? lab.slider("Attractor radius m", 0.3, 3, 1.2, { step: 0.05, group: "Digital" }).value * 1000 : 0;
      const light = bond === "Digital (rotated)" ? lab.slider("Sun from °", -80, 80, -40, { step: 1, group: "Digital" }).value : 0;

      const courses = Math.floor(WALL_H / COURSE);
      const all: Brick[][] = Array.from({ length: courses }, (_, k) => course(bond, k));
      // a head joint that lines up with one in the course below: a crack waits there
      let stacked = 0, jointsTotal = 0;
      const aligned: [number, number][] = [];
      for (let k = 1; k < courses; k++) {
        const below = new Set(all[k - 1].map((b) => Math.round(b.x)));
        for (const b of all[k]) {
          if (b.x <= 0) continue;
          jointsTotal++;
          if (below.has(Math.round(b.x))) { stacked++; aligned.push([b.x, k]); }
        }
      }
      const count = all.reduce((a, c) => a + c.filter((b) => b.x < WALL_W).length, 0);
      lab.log("Bricks in view", count);
      lab.log("Headers", `${Math.round((100 * all.flat().filter((b) => b.header).length) / Math.max(1, all.flat().length))} %`);
      lab.log("Stacked head joints", `${stacked} of ${jointsTotal}`);

      lab.onPointerDown((p) => {
        if (bond !== "Digital (rotated)") return;
        drag = true; lab.canvas.setPointerCapture(p.id);
        attractor = [(p.x - view.ox) / view.s, (view.oy - p.y) / view.s];
      });
      lab.onPointerMove((p) => { if (drag) attractor = [(p.x - view.ox) / view.s, (view.oy - p.y) / view.s]; });
      lab.onPointerUp(() => { drag = false; });
      if (bond === "Digital (rotated)") lab.animate(() => {});

      lab.draw((ctx, w, hh) => {
        if (!env.visible && bond === "Digital (rotated)") return;
        clear(ctx, w, hh);
        const h = hh - BAR;
        const s = Math.min((w - 24) / WALL_W, (h - 36) / WALL_H);
        view = { s, ox: (w - WALL_W * s) / 2, oy: 24 + WALL_H * s };
        const X = (x: number) => view.ox + x * s, Y = (y: number) => view.oy - y * s;
        ctx.save(); ctx.beginPath(); ctx.rect(X(0), Y(WALL_H), WALL_W * s, WALL_H * s); ctx.clip();
        ctx.fillStyle = P.grey(0.08); ctx.fillRect(X(0), Y(WALL_H), WALL_W * s, WALL_H * s);   // mortar
        const sun = (light * Math.PI) / 180;
        all.forEach((row, k) => row.forEach((b) => {
          const y0 = k * COURSE + 5, y1 = y0 + 71;
          let x0 = b.x + 5, x1 = b.x + b.w - 5;
          let tone = b.header ? 0.62 : 0.4;
          if (bond === "Digital (rotated)") {
            const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
            const d = Math.hypot(cx - attractor[0], cy - attractor[1]);
            const rot = ((maxRot * Math.PI) / 180) * Math.max(0, 1 - d / radius);
            const half = (240 * Math.cos(rot) + 115 * Math.sin(rot)) / 2;   // projected width of the turned brick
            x0 = cx - half; x1 = cx + half;
            tone = 0.18 + 0.6 * Math.max(0, Math.cos(rot - sun));           // face lit by the sun, turned faces darker
          }
          ctx.fillStyle = P.grey(tone);
          ctx.fillRect(X(x0), Y(y1), (x1 - x0) * s, (y1 - y0) * s);
        }));
        if (joints && bond !== "Digital (rotated)") {
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
          for (const [x, k] of aligned) { ctx.beginPath(); ctx.moveTo(X(x), Y((k - 1) * COURSE)); ctx.lineTo(X(x), Y((k + 1) * COURSE)); ctx.stroke(); }
        }
        ctx.restore();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.strokeRect(X(0) + 0.5, Y(WALL_H) + 0.5, WALL_W * s, WALL_H * s);
        ctx.fillStyle = P.grey(0.55);
        if (bond === "Digital (rotated)") {
          ctx.strokeStyle = P.ink; dot(ctx, X(attractor[0]), Y(attractor[1]), 5, false);
          text(ctx, "drag the attractor · every brick turns by its distance to it", X(0), 14, "left", "alphabetic", FONT_SMALL);
        } else {
          text(ctx, `${WALL_W / 1000} × ${WALL_H / 1000} m wall · headers lighter · ${joints ? "black: head joints stacked above each other" : ""}`, X(0), 14, "left", "alphabetic", FONT_SMALL);
        }
      });
    },
  };
};
