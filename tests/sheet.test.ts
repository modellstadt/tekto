/**
 * Sheet — one drawing, three outputs.
 *
 * The point of the Sheet is that the screen, the SVG and the DXF draw the same thing. So the
 * central test is structural: SVG and DXF each contain exactly the exploded primitives, kind
 * for kind. Around it: views land where they're placed (moved, rotated, enlarged, projected
 * from 3D), annotation keeps its paper size at any scale, and a dimension is built the way a
 * drawing needs it — offset, extension lines, ticks, the length in mm, text upright and above
 * — and so are radius dimensions, leaders and level marks.
 */
import { describe, it, expect } from "vitest";
import { Sheet, type SheetPrim } from "../src/core/drawing/Sheet";
import { aciFromHex } from "../src/io/DxfWriter";
import { Vec3 } from "../src/core/math/vectors";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
const texts = (p: SheetPrim[]) => p.filter((q): q is Extract<SheetPrim, { kind: "text" }> => q.kind === "text");
const byKind = (p: SheetPrim[]) => p.reduce<Record<string, number>>((m, q) => ({ ...m, [q.kind]: (m[q.kind] ?? 0) + 1 }), {});

function dxfPairs(dxf: string): [string, string][] {
  const L = dxf.replace(/\r/g, "").split("\n"); if (L[L.length - 1] === "") L.pop();
  const out: [string, string][] = [];
  for (let k = 0; k * 2 + 1 < L.length; k++) out.push([L[2 * k], L[2 * k + 1]]);
  return out;
}
const dxfEntities = (pv: [string, string][]) => {
  const start = pv.findIndex(([c, v]) => c === "2" && v === "ENTITIES");
  return pv.slice(start).filter(([c, v]) => c === "0" && ["POLYLINE", "LINE", "CIRCLE", "ARC", "TEXT", "SOLID"].includes(v)).map(([, v]) => v);
};

describe("views", () => {
  it("place, rotate and enlarge their entities on the sheet", () => {
    const sheet = new Sheet();
    sheet.view("a", { at: [10, 5] }).line([0, 0], [1, 0]);
    sheet.view("b", { at: [0, 0], rotation: 90 }).line([0, 0], [1, 0]);
    sheet.view("c", { scale: 5 }).line([0, 0], [1, 0]);
    const [a, b, c] = sheet.explode() as Extract<SheetPrim, { kind: "polyline" }>[];
    expect(a.points).toEqual([{ x: 10, y: 5 }, { x: 11, y: 5 }]);
    expect(close(b.points[1].x, 0) && close(b.points[1].y, 1)).toBe(true);
    expect(c.points[1]).toEqual({ x: 5, y: 0 });
  });

  it("project 3D points onto an elevation's axes", () => {
    const sheet = new Sheet();
    const east = sheet.view("east", { at: [0, 20], project: { right: new Vec3(0, 1, 0), up: new Vec3(0, 0, 1) } });
    east.polyline([new Vec3(9, 0, 0), new Vec3(9, 2, 3)]);
    const [p] = sheet.explode() as Extract<SheetPrim, { kind: "polyline" }>[];
    expect(p.points).toEqual([{ x: 0, y: 20 }, { x: 2, y: 23 }]);
  });

  it("a function maps 3D points for views no axis pair describes (an unrolled strip)", () => {
    const sheet = new Sheet();
    const strip = sheet.view("strip", { project: (p) => [Math.hypot(p.x, p.y), p.z] });
    strip.line(new Vec3(3, 4, 0), new Vec3(6, 8, 2));
    const [p] = sheet.explode() as Extract<SheetPrim, { kind: "polyline" }>[];
    expect(p.points).toEqual([{ x: 5, y: 0 }, { x: 10, y: 2 }]);
  });

  it("an arc's bounds are its own, not its circle's", () => {
    const sheet = new Sheet();
    sheet.main.arc([0, 0], 1, 0, 90);
    const b = sheet.bounds()!;
    expect([b.min.x, b.min.y, b.max.x, b.max.y].map(v => +v.toFixed(12))).toEqual([0, 0, 1, 1]);
    const s2 = new Sheet();
    s2.main.arc([0, 0], 1, 300, 30);                                    // through 0°
    expect(s2.bounds()!.max.x).toBe(1);
  });

  it("annotation keeps its paper size: 2.5 mm at 1:50, also in an enlarged detail", () => {
    const sheet = new Sheet({ scale: 50 });
    sheet.main.text("plan", [0, 0]);
    sheet.view("detail", { at: [10, 0], scale: 5 }).text("1:10", [0, 0]);
    const [a, b] = texts(sheet.explode());
    expect(a.height).toBeCloseTo(0.125, 12);         // 2.5 mm × 50 / 1000
    expect(b.height).toBeCloseTo(0.125, 12);
  });

  it("a view title sits centred under the view", () => {
    const sheet = new Sheet({ scale: 50 });
    sheet.view("plan", { title: "Plan 1:50" }).rect(0, 0, 4, 2);
    const t = texts(sheet.explode())[0];
    expect(t.text).toBe("Plan 1:50");
    expect(t.at.x).toBeCloseTo(2);
    expect(t.at.y).toBeLessThan(0);
    expect(t.align).toBe("center");
  });

  it("fills come first, under the lines", () => {
    const sheet = new Sheet();
    sheet.main.line([0, 0], [1, 1]);
    sheet.main.rect(0, 0, 1, 1, { fill: "#ccc" });
    expect(sheet.explode()[0].kind).toBe("fill");
  });
});

describe("dimensions", () => {
  it("an aligned dimension: line offset in paper mm, extension lines, ticks, length in mm above", () => {
    const sheet = new Sheet({ scale: 50 });
    sheet.main.dim([0, 0], [4.2, 0], { offset: 8 });
    const prims = sheet.explode();
    expect(byKind(prims)).toEqual({ polyline: 5, text: 1 });           // 2 extensions, the line, 2 ticks
    const line = prims[2] as Extract<SheetPrim, { kind: "polyline" }>;
    expect(line.points.map(p => p.y)).toEqual([0.4, 0.4]);               // 8 mm × 50
    const t = texts(prims)[0];
    expect(t.text).toBe("4200");
    expect(t.rotation).toBe(0);
    expect(t.align).toBe("center");
    expect(t.baseline).toBe("bottom");
    expect(t.at.x).toBeCloseTo(2.1);
    expect(t.at.y).toBeGreaterThan(0.4);
  });

  it("text stays upright whichever way the dimension runs", () => {
    for (const [a, b] of [[[4, 0], [0, 0]], [[0, 0], [0, 3]], [[0, 3], [0, 0]], [[3, 3], [0, 0]]] as [number, number][][]) {
      const sheet = new Sheet({ scale: 50 });
      sheet.main.dim(a, b);
      const r = texts(sheet.explode())[0].rotation;
      expect(r > -90 - 1e-9 && r <= 90 + 1e-9 || (r >= 270 - 1e-9)).toBe(true);
    }
  });

  it("horizontal and vertical dimensions measure one axis; units and overrides", () => {
    const sheet = new Sheet({ scale: 100 });
    sheet.main.dim([0, 0], [3, 4], { direction: "horizontal" });
    sheet.main.dim([0, 0], [3, 4], { direction: "vertical", unit: "m" });
    sheet.main.dim([0, 0], [3, 4], { text: "≈ 5 m" });
    expect(texts(sheet.explode()).map(t => t.text)).toEqual(["3000", "4.00", "≈ 5 m"]);
  });

  it("the text reads above the line on either side of the geometry", () => {
    const sheet = new Sheet({ scale: 50 });
    sheet.main.dim([0, 0], [6, 0], { offset: -10 });                   // below the wall
    const prims = sheet.explode();
    const line = prims[2] as Extract<SheetPrim, { kind: "polyline" }>;
    const t = texts(prims)[0];
    expect(line.points[0].y).toBeCloseTo(-0.5);
    expect(t.at.y).toBeGreaterThan(-0.5);
    expect(t.baseline).toBe("bottom");
  });
});

describe("annotations", () => {
  it("a radius: centre mark, the radius line with an arrow, R and the length along it", () => {
    const sheet = new Sheet({ scale: 50 });
    sheet.main.radius([0, 0], 1.2, { angle: 0 });
    const prims = sheet.explode();
    expect(byKind(prims)).toEqual({ polyline: 4, text: 1 });            // cross ×2, line, arrow
    expect((prims[3] as Extract<SheetPrim, { kind: "polyline" }>).points[1]).toEqual({ x: 1.2, y: 0 });
    const t = texts(prims)[0];
    expect(t.text).toBe("R 1200");
    expect(t.at.x).toBeCloseTo(0.6);
  });

  it("a leader: arrow at what it points to, text past its end on that side", () => {
    const sheet = new Sheet({ scale: 50 });
    sheet.main.leader([[0, 0], [1, 1], [2, 1]], "Oak, oiled");
    sheet.main.leader([[0, 0], [-1, 1]], "left");
    const [right, left] = texts(sheet.explode());
    expect(right.align).toBe("left");
    expect(right.at.x).toBeGreaterThan(2);
    expect(left.align).toBe("right");
    expect(left.at.x).toBeLessThan(-1);
  });

  it("a level mark writes the height with its sign, from the point or a value", () => {
    const sheet = new Sheet({ scale: 50 });
    const east = sheet.view("east", { project: { right: new Vec3(0, 1, 0), up: new Vec3(0, 0, 1) } });
    east.level(new Vec3(0, 0, 2.45));
    east.level([0, 0]);
    east.level([0, 0], { value: -0.5 });
    expect(texts(sheet.explode()).map(t => t.text)).toEqual(["+2.450", "±0.000", "-0.500"]);
  });
});

describe("one source: SVG and DXF draw exactly the exploded primitives", () => {
  function drawing() {
    const sheet = new Sheet({ scale: 50, layers: { cut: { weight: 0.5 }, hidden: { dash: "hidden", color: "#808080" }, dims: { weight: 0.13 } } });
    const plan = sheet.view("plan", { title: "Plan" });
    plan.polyline([[0, 0], [6, 0], [6, 4], [0, 4]], { layer: "cut", closed: true, fill: "#e0e0e0" });
    plan.line([0, 2], [6, 2], { layer: "hidden" });
    plan.circle([3, 2], 0.5, { layer: "cut" });
    plan.arc([0, 0], 1, 0, 90, { layer: "cut", key: "doors/d1" });
    plan.dim([0, 0], [6, 0], { layer: "dims", offset: -8 });
    plan.radius([3, 2], 0.5, { layer: "dims" });
    plan.leader([[3, 2], [4, 3]], "column", { layer: "dims" });
    plan.fill([[[1, 1], [2, 1], [2, 2], [1, 2]], [[1.4, 1.4], [1.6, 1.4], [1.6, 1.6], [1.4, 1.6]]], { color: "#999" });
    const east = sheet.view("east", { at: [10, 0], project: { right: new Vec3(0, 1, 0), up: new Vec3(0, 0, 1) } });
    east.polyline([new Vec3(6, 0, 0), new Vec3(6, 4, 0), new Vec3(6, 4, 3), new Vec3(6, 0, 3)], { layer: "cut", closed: true });
    east.level(new Vec3(6, 4, 3), { layer: "dims" });
    return sheet;
  }

  it("SVG: one element per primitive, sized in mm, styles from layers", () => {
    const sheet = drawing();
    const prims = sheet.explode();
    const svg = sheet.toSVG();
    const k = byKind(prims);
    const count = (re: RegExp) => (svg.match(re) ?? []).length;
    const closedPolys = prims.filter(p => p.kind === "polyline" && p.closed).length;
    expect(count(/<polygon /g)).toBe(closedPolys);
    expect(count(/<polyline /g)).toBe(k.polyline - closedPolys);
    expect(count(/<circle /g)).toBe(k.circle);
    expect(count(/<text /g)).toBe(k.text);
    expect(count(/<path d="M [^"]* A /g)).toBe(k.arc);
    expect(count(/fill-rule="evenodd"/g)).toBe(k.fill);
    expect(svg).toMatch(/^<svg [^>]*width="[\d.]+mm" height="[\d.]+mm"/);
    expect(svg).toContain(`stroke-dasharray="1.5 1"`);                 // the hidden layer
    expect(svg).toContain(`data-key="doors/d1"`);
  });

  it("DXF: the same primitives as entities; fills as SOLIDs covering the area", () => {
    const sheet = drawing();
    const prims = sheet.explode();
    const k = byKind(prims);
    const pv = dxfPairs(sheet.toDXF());
    const ents = dxfEntities(pv);
    const n = (e: string) => ents.filter(x => x === e).length;
    expect(n("POLYLINE")).toBe(k.polyline);
    expect(n("CIRCLE")).toBe(k.circle);
    expect(n("ARC")).toBe(k.arc);
    expect(n("TEXT")).toBe(k.text);
    // Fills: the room's (4×6 rect) as 2 triangles, the holed square as triangles of area 1 − 0.04.
    const solids: number[][][] = [];
    for (let i = 0; i < pv.length; i++) if (pv[i][0] === "0" && pv[i][1] === "SOLID") {
      const g = (code: string) => Number(pv.slice(i + 1, i + 30).find(([c]) => c === code)![1]) / 1000;
      solids.push([[g("10"), g("20")], [g("11"), g("21")], [g("13"), g("23")]]);
    }
    const triArea = (t: number[][]) => Math.abs((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[1][1] - t[0][1]) * (t[2][0] - t[0][0])) / 2;
    expect(solids.reduce((s, t) => s + triArea(t), 0)).toBeCloseTo(24 + 0.96, 6);
  });

  it("DXF: dashed layers get an R12 line type sized for paper; centred text keeps its alignment", () => {
    const pv = dxfPairs(drawing().toDXF());
    const i = pv.findIndex(([c, v]) => c === "2" && v === "HIDDEN");
    expect(i).toBeGreaterThan(0);
    const dashes = pv.slice(i, i + 12).filter(([c]) => c === "49").map(([, v]) => Number(v));
    expect(dashes).toEqual([75, -50]);                                   // 1.5 mm and 1 mm on paper at 1:50, in mm
    const layerHidden = pv.findIndex(([c, v], j) => c === "2" && v === "hidden" && pv[j - 1][1] === "LAYER");
    expect(pv.slice(layerHidden, layerHidden + 8).find(([c]) => c === "6")?.[1]).toBe("HIDDEN");
    const title = pv.findIndex(([c, v]) => c === "1" && v === "Plan");
    const t = pv.slice(title, title + pv.slice(title).findIndex(([c]) => c === "0"));
    expect(t.find(([c]) => c === "72")?.[1]).toBe("1");                  // the view title: centred …
    expect(t.find(([c]) => c === "73")?.[1]).toBe("3");                  // … hanging from its top
  });
});

describe("aciFromHex", () => {
  it("maps CSS colours to the nearest AutoCAD index", () => {
    expect(aciFromHex("#000")).toBe(7);
    expect(aciFromHex("#ffffff")).toBe(7);
    expect(aciFromHex("#ff0000")).toBe(1);
    expect(aciFromHex("#0000ff")).toBe(5);
    expect([8, 253]).toContain(aciFromHex("#808080"));
    expect(aciFromHex("nonsense")).toBe(7);
  });
});
