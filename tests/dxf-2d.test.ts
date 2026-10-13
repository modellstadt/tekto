/**
 * writeDxf2D — the plan / section / cut-sheet writer three apps had each copied.
 *
 * Same AutoCAD-safe R12 skeleton as writeDxf3D (every layer declared, R12 names, plain
 * decimals), plus what 2D drawings need: closed polylines, text, and a scale that turns
 * model metres into drawing millimetres and says so in the header.
 */
import { describe, it, expect } from "vitest";
import { writeDxf2D } from "../src/io/DxfWriter";
import { stampName } from "../src/io/download";

function pairs(dxf: string): [string, string][] {
  const L = dxf.replace(/\r/g, "").split("\n");
  if (L[L.length - 1] === "") L.pop();
  expect(L.length % 2).toBe(0);
  const out: [string, string][] = [];
  for (let k = 0; k * 2 + 1 < L.length; k++) out.push([L[2 * k], L[2 * k + 1]]);
  return out;
}
const ENTS = new Set(["POLYLINE", "VERTEX", "SEQEND", "ARC", "CIRCLE", "LINE", "TEXT"]);
const entitySeq = (pv: [string, string][]) => pv.filter(([c, v]) => c === "0" && ENTS.has(v)).map(([, v]) => v);
const header = (pv: [string, string][], name: string) => { const i = pv.findIndex(([c, v]) => c === "9" && v === name); return i >= 0 ? pv[i + 1][1] : undefined; };
const declared = (pv: [string, string][]) => pv.filter((_, i) => i > 0 && pv[i - 1][0] === "0" && pv[i - 1][1] === "LAYER" && pv[i][0] === "2").map(([, v]) => v);

describe("writeDxf2D", () => {
  const square = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 1 }];

  it("writes closed and open polylines, lines, circles, arcs and text in order", () => {
    const pv = pairs(writeDxf2D({
      polylines: [{ layer: "cut", points: square, closed: true }, { layer: "axis", points: square.slice(0, 2) }],
      lines: [{ layer: "axis", start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }],
      circles: [{ layer: "holes", center: { x: 1, y: 0.5 }, radius: 0.1 }],
      arcs: [{ layer: "arc", center: { x: 0, y: 0 }, radius: 1, startDeg: -90, endDeg: 90 }],
      texts: [{ layer: "text", at: { x: 0, y: -0.5 }, text: "Plan\n1:50", height: 0.25, rotationDeg: 90 }],
    }));
    expect(entitySeq(pv)).toEqual([
      "POLYLINE", "VERTEX", "VERTEX", "VERTEX", "VERTEX", "SEQEND",
      "POLYLINE", "VERTEX", "VERTEX", "SEQEND",
      "LINE", "CIRCLE", "ARC", "TEXT",
    ]);
    const closedFlags = pv.filter((_, i) => i > 0 && pv[i - 1][1] === "POLYLINE" || false);
    void closedFlags;
    const poly = pv.findIndex(([c, v]) => c === "0" && v === "POLYLINE");
    expect(pv.slice(poly, poly + 6).find(([c]) => c === "70")?.[1]).toBe("1");   // closed
    const arc = pv.findIndex(([c, v]) => c === "0" && v === "ARC");
    expect(pv.slice(arc, arc + 14).filter(([c]) => c === "50" || c === "51").map(([, v]) => v)).toEqual(["270", "90"]);
    const text = pv.findIndex(([c, v]) => c === "0" && v === "TEXT");
    expect(pv.slice(text, text + 14).find(([c]) => c === "1")?.[1]).toBe("Plan 1:50");   // one line
    expect(pv.slice(text, text + 14).find(([c]) => c === "50")?.[1]).toBe("90");
    expect(declared(pv).sort()).toEqual(["arc", "axis", "cut", "holes", "text"]);
    expect(pv[pv.length - 1]).toEqual(["0", "EOF"]);
  });

  it("scale 1000 writes metres as millimetres and declares mm; scale 1 declares metres", () => {
    const mm = pairs(writeDxf2D({ lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 1.25, y: 0 } }] }, { scale: 1000 }));
    expect(header(mm, "$INSUNITS")).toBe("4");
    const line = mm.findIndex(([c, v]) => c === "0" && v === "LINE");
    expect(mm.slice(line, line + 12).find(([c]) => c === "11")?.[1]).toBe("1250");
    const m = pairs(writeDxf2D({ lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 1.25, y: 0 } }] }));
    expect(header(m, "$INSUNITS")).toBe("6");
  });

  it("a full-sweep arc becomes a CIRCLE; a degenerate radius is dropped with its layer", () => {
    const pv = pairs(writeDxf2D({
      arcs: [{ layer: "full", center: { x: 0, y: 0 }, radius: 1, startDeg: 0, endDeg: 360 },
             { layer: "ghost", center: { x: 0, y: 0 }, radius: 0, startDeg: 0, endDeg: 90 }],
    }));
    expect(entitySeq(pv)).toEqual(["CIRCLE"]);
    expect(declared(pv)).toEqual(["full"]);
  });

  it("refuses NaN coordinates, a text without height and a bad scale", () => {
    expect(() => writeDxf2D({ polylines: [{ layer: "cut", points: [{ x: 0, y: 0 }, { x: NaN, y: 1 }] }] }))
      .toThrow(/polyline 0 \(layer "cut"\) has a non-finite coordinate/);
    expect(() => writeDxf2D({ texts: [{ layer: "t", at: { x: 0, y: 0 }, text: "x", height: 0 }] })).toThrow(/height of 0/);
    expect(() => writeDxf2D({}, { scale: -1 })).toThrow(/scale must be a positive number/);
  });
});

describe("stampName", () => {
  it("puts a date-time before the extension", () => {
    const d = new Date(2026, 9, 13, 15, 42);
    expect(stampName("plan.dxf", d)).toBe("plan-20261013-1542.dxf");
    expect(stampName("archive.tar.gz", d)).toBe("archive.tar-20261013-1542.gz");
    expect(stampName("README", d)).toBe("README-20261013-1542");
  });
});
