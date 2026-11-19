// Seeing, pixel-based. The isovist is the set of floor cells visible from one
// point (tekto PixelView). Computed from every floor cell and summed, the same
// operation gives a visibility map: how much of the plan each place sees,
// which is also how visible that place is.

import { VoxelGrid2D, PixelView } from "../../../src";
import type { AppFactory, View } from "./shared";
import { P, BAR, clear, fit, text, dot, FONT_SMALL } from "./shared";
import { plan, NX, NY, CELL, idx, isWall, interior, drawWalls, planPointer, resetPlan } from "./plan";

export const isovist: AppFactory = (env) => {
  let view: View | null = null;
  let mapVersion = -1;
  let map: Float32Array | null = null;
  let mapMax = 1;

  const obstacles = () => {
    const g = new VoxelGrid2D(NX, NY, 1, 0, 0);
    for (let i = 0; i < NX * NY; i++) g.values[i] = plan.wall[i] ? 0 : 1;
    return g;
  };

  function visibleFrom(x: number, y: number): Float32Array {
    const res = new VoxelGrid2D(NX, NY, 1, 0, 0);
    PixelView.analyse(obstacles(), res, x, y);
    res.values[idx(x, y)] += 1;
    return res.values;
  }

  function computeMap() {
    const obs = obstacles();
    const res = new VoxelGrid2D(NX, NY, 1, 0, 0);
    // only cells inside the building count as viewpoints
    for (let x = 5; x < 67; x++) for (let y = 5; y < 39; y++) {
      if (!isWall(x, y)) PixelView.analyse(obs, res, x, y);
    }
    map = res.values;
    mapMax = 1;
    for (let x = 5; x < 67; x++) for (let y = 5; y < 39; y++) if (!isWall(x, y)) mapMax = Math.max(mapMax, map[idx(x, y)]);
    mapVersion = plan.version;
  }

  return {
    title: "Seeing: isovist and visibility",
    height: 470,
    fn: (lab) => {
      const tool = lab.select("Tool", ["Move viewer", "Draw wall", "Erase"] as const, "Move viewer").value;
      const showMap = lab.toggle("Visibility map", false, { group: "Show" }).value;
      const showIso = lab.toggle("Isovist", true, { group: "Show" }).value;
      lab.button("Reset plan", () => { resetPlan(); });

      planPointer(lab, () => view, () => tool, { "Move viewer": "viewer" });

      let seenVersion = -1, seenAt = "", vis: Float32Array | null = null, area = 0, floor = 0;
      lab.animate(() => {
        if (!env.visible) return;
        const at = plan.viewer.join(",");
        if (seenVersion !== plan.version || at !== seenAt) {
          vis = visibleFrom(plan.viewer[0], plan.viewer[1]);
          seenVersion = plan.version; seenAt = at;
          area = 0; floor = 0;
          for (let x = 5; x < 67; x++) for (let y = 5; y < 39; y++) {
            if (isWall(x, y)) continue;
            floor++;
            if (vis[idx(x, y)] > 0) area++;
          }
        }
        if (showMap && mapVersion !== plan.version && !plan.editing) computeMap(); // wait for the stroke to end
        lab.log("Isovist area", `${(area * CELL * CELL).toFixed(0)} m²`);
        lab.log("Share of floor seen", `${((100 * area) / Math.max(1, floor)).toFixed(0)} %`);
      });

      lab.draw((ctx, w, h) => {
        if (!env.visible) return;
        clear(ctx, w, h);
        view = fit(0, 0, NX, NY, 0, 0, w, h - BAR, 8);
        const v = view, s = v.s;

        if (showMap && map) {
          for (let x = 5; x < 67; x++) for (let y = 5; y < 39; y++) {
            if (isWall(x, y)) continue;
            const t = map[idx(x, y)] / mapMax;
            ctx.fillStyle = P.grey(0.05 + 0.75 * t * t);
            ctx.fillRect(v.X(x), v.Y(y + 1), s + 0.5, s + 0.5);
          }
        }
        if (showIso && vis) {
          // cells not visible from the viewer: fine dots; visible: clear
          if (!showMap) {
            ctx.fillStyle = P.grey(0.16);
            for (let x = 0; x < NX; x++) for (let y = 0; y < NY; y++) {
              if (isWall(x, y) || !interior(x, y) || vis[idx(x, y)] > 0) continue;
              ctx.fillRect(v.X(x), v.Y(y + 1), s + 0.5, s + 0.5);
            }
          }
          // isovist boundary: edges between visible and hidden floor
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          const seen = (x: number, y: number) => !isWall(x, y) && vis![idx(x, y)] > 0;
          for (let x = 4; x < 67; x++) for (let y = 4; y < 39; y++) {
            const a = seen(x, y);
            if (a !== seen(x + 1, y) && !isWall(x, y) && !isWall(x + 1, y)) { ctx.moveTo(v.X(x + 1), v.Y(y)); ctx.lineTo(v.X(x + 1), v.Y(y + 1)); }
            if (a !== seen(x, y + 1) && !isWall(x, y) && !isWall(x, y + 1)) { ctx.moveTo(v.X(x), v.Y(y + 1)); ctx.lineTo(v.X(x + 1), v.Y(y + 1)); }
          }
          ctx.stroke();
        }
        drawWalls(ctx, v);

        // viewer
        const [vx, vy] = plan.viewer;
        const X = v.X(vx + 0.5), Y = v.Y(vy + 0.5);
        ctx.fillStyle = P.ink;
        dot(ctx, X, Y, 6);
        ctx.fillStyle = P.paper;
        dot(ctx, X, Y, 2.4);
        ctx.fillStyle = P.grey(0.6);
        text(ctx, "drag the viewer", X + 10, Y + 4, "left", "alphabetic", FONT_SMALL);
      });
    },
  };
};
