import { describe, it, expect } from "vitest";
import { writeDxf3D, DxfExporter, Vec3 } from "../src";
import type { Dxf3DArc, Dxf3DCircle, Dxf3DLine, Dxf3DPoint, Dxf3DPolyline } from "../src";

/** Split a DXF into code/value pairs (dropping the trailing CRLF's empty token). */
function pairs(dxf: string): [string, string][] {
  const L = dxf.replace(/\r/g, "").split("\n");
  if (L[L.length - 1] === "") L.pop();
  expect(L.length % 2).toBe(0);                       // complete code/value pairs (no truncation)
  const out: [string, string][] = [];
  for (let k = 0; k * 2 + 1 < L.length; k++) out.push([L[2 * k], L[2 * k + 1]]);
  return out;
}
/** Sequence of entity type markers (value after a group-0 that names an entity). */
const ENTS = new Set(["POLYLINE", "VERTEX", "SEQEND", "ARC", "CIRCLE", "POINT", "LINE"]);
function entitySeq(pv: [string, string][]): string[] {
  return pv.filter(([c, v]) => c === "0" && ENTS.has(v)).map(([, v]) => v);
}
/** The color (group 62) of a declared LAYER record. */
function layerColor(pv: [string, string][], name: string): number | undefined {
  for (let i = 0; i + 3 < pv.length; i++)
    if (pv[i][0] === "0" && pv[i][1] === "LAYER" && pv[i + 1][0] === "2" && pv[i + 1][1] === name)
      for (let j = i + 2; j < pv.length && pv[j][0] !== "0"; j++) if (pv[j][0] === "62") return Number(pv[j][1]);
  return undefined;
}

describe("writeDxf3D", () => {
  const polylines: Dxf3DPolyline[] = [
    // includes a coord that String() would render exponential (5e-7) and float noise (1e-15).
    { layer: "transverse arches", points: [new Vec3(0, 0, 0), new Vec3(0.0000005, 1e-15, 6.988)] },
    { layer: "helix", points: [new Vec3(0, 0, 0), new Vec3(1, 1, 1)], closed: false },
  ];
  const arcs: Dxf3DArc[] = [
    { layer: "arc",   center: new Vec3(1, 2, 3), radius: 5, startDeg: 10, endDeg: 100 }, // partial → ARC
    { layer: "rings", center: new Vec3(0, 0, 0), radius: 2, startDeg: 0, endDeg: 360 },  // full sweep → CIRCLE
  ];
  const circles: Dxf3DCircle[] = [{ layer: "rings", center: new Vec3(0, 0, 3), radius: 2 }]; // explicit CIRCLE
  const lineSegs: Dxf3DLine[] = [{ layer: "axis", start: new Vec3(0, 0, 0), end: new Vec3(0, 0, 5) }];
  const points: Dxf3DPoint[] = [{ layer: "nodes", position: new Vec3(9, 8, 7) }];
  const dxf = writeDxf3D({ polylines, lines: lineSegs, arcs, circles, points, layers: [{ name: "helix", color: 5 }] });
  const pv = pairs(dxf);

  it("emits a complete R12 skeleton terminated by ENDSEC/EOF", () => {
    for (const tok of ["AC1009", "HEADER", "LTYPE", "BLOCKS", "ENTITIES", "POLYLINE", "VERTEX", "SEQEND", "POINT"])
      expect(dxf).toContain(tok);
    expect(pv[pv.length - 1]).toEqual(["0", "EOF"]);
    expect(pv[pv.length - 2]).toEqual(["0", "ENDSEC"]);
  });

  it("declares every layer an entity uses, with a matching 70 count", () => {
    const declared = new Set<string>();
    for (let i = 0; i + 1 < pv.length; i++)
      if (pv[i][0] === "0" && pv[i][1] === "LAYER" && pv[i + 1][0] === "2") declared.add(pv[i + 1][1]);
    const used = new Set(pv.filter(([c]) => c === "8").map(([, v]) => v));
    for (const u of used) expect(declared.has(u)).toBe(true);
    const li = pv.findIndex(([c, v], i) => c === "2" && v === "LAYER" && pv[i - 1]?.[1] === "TABLE");
    expect(Number(pv[li + 1][1])).toBe(declared.size);
  });

  it("sanitizes layer names to R12 tokens (no spaces) on table and entities", () => {
    expect(pv.filter(([c, v]) => (c === "2" || c === "8") && / /.test(v))).toEqual([]);
    expect(dxf).toContain("transverse_arches");
    expect(dxf).not.toContain("transverse arches");
  });

  it("assigns declared color, defaults auto-derived layers to 7", () => {
    expect(layerColor(pv, "helix")).toBe(5);   // from layers def
    expect(layerColor(pv, "nodes")).toBe(7);   // auto-derived (used but not in def)
  });

  it("writes reals as plain decimals — never exponential — and snaps sub-1e-9 noise to 0", () => {
    expect(/\d[eE][-+]?\d/.test(dxf)).toBe(false);   // no 5e-7 / 1.2E3 anywhere
    expect(dxf).toContain("0.0000005");              // 5e-7 written long-form
    expect(dxf).toContain("6.988");
  });

  it("marks 3D polyline (70/8) + closed (70/9) + 3D vertex (70/32) flags", () => {
    expect(dxf).toMatch(/POLYLINE\r\n8\r\nhelix\r\n66\r\n1\r\n70\r\n8/);
    expect(dxf).toMatch(/VERTEX\r\n8\r\nhelix\r\n10\r\n0\r\n20\r\n0\r\n30\r\n0\r\n70\r\n32/);
    const closed = writeDxf3D({ polylines: [{ layer: "a", points: [new Vec3(0,0,0), new Vec3(1,0,0), new Vec3(1,1,0)], closed: true }] });
    expect(closed).toMatch(/POLYLINE\r\n8\r\na\r\n66\r\n1\r\n70\r\n9/);
  });

  it("emits full sweeps as CIRCLE and partial sweeps as normalized ARC", () => {
    const seq = entitySeq(pv);
    expect(seq.filter(e => e === "CIRCLE").length).toBe(2);  // explicit + auto-promoted 0→360 arc
    expect(seq.filter(e => e === "ARC").length).toBe(1);     // the partial 10→100
    // the single ARC's angle codes are the partial ones, not 360
    const ai = pv.findIndex(([c, v]) => c === "0" && v === "ARC");
    const after = pv.slice(ai);
    const end = after.find(([c]) => c === "51");
    expect(end?.[1]).toBe("100");
    expect(dxf).not.toMatch(/51\r\n360/);                    // no degenerate 0→360 ARC
  });

  it("drops arcs with a non-finite radius without leaking their layer", () => {
    const bad = writeDxf3D({ arcs: [{ layer: "ghost", center: new Vec3(0,0,0), radius: NaN, startDeg: 0, endDeg: 90 }] });
    expect(bad).not.toContain("ghost");                      // layer neither declared nor referenced
    expect(entitySeq(pairs(bad)).filter(e => e === "ARC" || e === "CIRCLE")).toEqual([]);
  });

  it("emits a 3D LINE with both endpoints' z (30/31)", () => {
    expect(entitySeq(pv).filter(e => e === "LINE").length).toBe(1);
    expect(dxf).toMatch(/LINE\r\n8\r\naxis\r\n10\r\n0\r\n20\r\n0\r\n30\r\n0\r\n11\r\n0\r\n21\r\n0\r\n31\r\n5/);
  });

  it("handles empty content — still a valid, terminated file", () => {
    const empty = pairs(writeDxf3D({}));
    expect(empty[empty.length - 1]).toEqual(["0", "EOF"]);
  });
});

describe("DxfExporter R12 hardening", () => {
  it("auto-declares + sanitizes an undeclared, spaced segment layer and adds the R12 skeleton", () => {
    const exp = new DxfExporter();
    const dxf = exp.toDxfFromSegments([{ u0: 0, v0: 0, u1: 1, v1: 1, layer: "my layer" }], { scale: 1 });
    expect(dxf).toContain("AC1009");
    expect(dxf).toContain("BLOCKS");
    expect(dxf).toContain("my_layer");        // auto-declared + sanitized
    expect(dxf).not.toContain("my layer");
    expect(dxf).toContain("LINE");
    expect(dxf.trimEnd().endsWith("EOF")).toBe(true);
  });
});
