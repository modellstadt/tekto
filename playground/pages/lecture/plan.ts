// A pixel plan shared by the two analysis apps (walking and seeing): a grid of
// 0.5 m cells, some of them wall. Edit it in one app and the other sees the
// change. Cell index follows tekto's VoxelGrid2D convention: i = x * NY + y.

import type { Lab2D } from "../../../src";
import type { View } from "./shared";
import { P } from "./shared";

export const NX = 72, NY = 44, CELL = 0.5;

export interface Plan {
  wall: Uint8Array;
  version: number;
  /** True while a wall is being drawn or erased (expensive analyses wait). */
  editing: boolean;
  exit: [number, number];
  start: [number, number];
  viewer: [number, number];
}

export const plan: Plan = { wall: new Uint8Array(NX * NY), version: 0, editing: false, exit: [70, 21], start: [8, 35], viewer: [27, 15] };

export const idx = (x: number, y: number) => x * NY + y;
export const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < NX && y < NY;
export const isWall = (x: number, y: number) => !inside(x, y) || plan.wall[idx(x, y)] === 1;
/** Cells within the building envelope (the analyses ignore the surroundings). */
export const interior = (x: number, y: number) => x > 4 && x < 67 && y > 4 && y < 39;

export function resetPlan(): void {
  const w = plan.wall;
  w.fill(0);
  const set = (x0: number, y0: number, x1: number, y1: number, v = 1) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (inside(x, y)) w[idx(x, y)] = v;
  };
  // envelope with an exit on the east side
  set(4, 4, 67, 4); set(4, 39, 67, 39); set(4, 4, 4, 39); set(67, 4, 67, 39);
  set(67, 19, 67, 23, 0);
  // row of rooms along the north side, each with a door onto the hall
  set(5, 27, 50, 27);
  for (const dx of [9, 23, 37]) set(dx, 27, dx + 2, 27, 0);
  for (const x of [18, 32]) set(x, 28, x, 38);
  set(50, 5, 50, 38);
  set(50, 12, 50, 16, 0);
  set(50, 31, 50, 34, 0);
  // columns in the hall
  for (let x = 11; x <= 44; x += 8) for (const y of [11, 19]) set(x, y, x + 1, y + 1);
  // a free-standing wall in the east lobby
  set(57, 10, 57, 30);
  plan.exit = [70, 21];
  plan.start = [8, 35];
  plan.viewer = [27, 15];
  plan.version++;
}
resetPlan();

/** Paint walls (1) or floor (0) in a small brush around a cell. */
export function paint(cx: number, cy: number, value: 0 | 1): void {
  let changed = false;
  const marker = (x: number, y: number) =>
    [plan.exit, plan.start, plan.viewer].some(([mx, my]) => mx === x && my === y);
  for (let x = cx - 1; x <= cx; x++) for (let y = cy - 1; y <= cy; y++) {
    if (!inside(x, y) || (value === 1 && marker(x, y))) continue;
    if (plan.wall[idx(x, y)] !== value) { plan.wall[idx(x, y)] = value; changed = true; }
  }
  if (changed) plan.version++;
}

/** Screen → cell. */
export function cellAt(v: View, px: number, py: number): [number, number] {
  const [wx, wy] = v.inv(px, py);
  return [Math.floor(wx), Math.floor(wy)];
}

export function drawWalls(ctx: CanvasRenderingContext2D, v: View): void {
  ctx.fillStyle = P.ink;
  const s = v.s;
  for (let x = 0; x < NX; x++) for (let y = 0; y < NY; y++) {
    if (plan.wall[idx(x, y)]) ctx.fillRect(v.X(x), v.Y(y + 1), s + 0.5, s + 0.5);
  }
}

/** Pointer handling common to both apps: paint / erase / move a marker. */
export function planPointer(
  lab: Lab2D, getView: () => View | null, getTool: () => string,
  markers: Record<string, "exit" | "start" | "viewer">,
): void {
  let active: string | null = null;
  const act = (px: number, py: number) => {
    const v = getView();
    if (!v || !active) return;
    const [cx, cy] = cellAt(v, px, py);
    if (active === "Draw wall") paint(cx, cy, 1);
    else if (active === "Erase") paint(cx, cy, 0);
    else if (markers[active] && inside(cx, cy) && !isWall(cx, cy)) {
      plan[markers[active]] = [cx, cy];
      plan.version++;
    }
  };
  lab.onPointerDown((p) => {
    active = getTool();
    plan.editing = active === "Draw wall" || active === "Erase";
    lab.canvas.setPointerCapture(p.id);
    act(p.x, p.y);
  });
  lab.onPointerMove((p) => act(p.x, p.y));
  lab.onPointerUp(() => { active = null; plan.editing = false; });
}
