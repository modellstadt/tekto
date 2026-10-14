/**
 * writePdf2D — the same 2D content as writeDxf2D, as a vector PDF at a true scale.
 */
import { describe, it, expect } from "vitest";
import { writePdf2D } from "../src/io/PdfWriter";

const text = (b: Uint8Array) => String.fromCharCode(...b);
const MM = 72 / 25.4;

describe("writePdf2D", () => {
  const square = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 1 }];

  it("is a well-formed PDF: header, every object at its xref offset, startxref at the table", () => {
    const pdf = text(writePdf2D({ polylines: [{ layer: "cut", points: square, closed: true }] }));
    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
    const start = Number(/startxref\n(\d+)\n/.exec(pdf)![1]);
    expect(pdf.slice(start, start + 4)).toBe("xref");
    const rows = pdf.slice(start).split("\n").slice(3, 8);   // objects 1-5
    rows.forEach((row, i) => { const at = Number(row.slice(0, 10)), head = `${i + 1} 0 obj\n`; expect(pdf.slice(at, at + head.length)).toBe(head); });
    const len = Number(/\/Length (\d+) >>\nstream\n/.exec(pdf)![1]), body = pdf.slice(pdf.indexOf("stream\n") + 7);
    expect(body.slice(len, len + 10)).toBe("\nendstream");
  });

  it("sizes the page to the drawing at the scale (+ margins, scale bar, title)", () => {
    const box = (o: object) => /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(text(writePdf2D({ lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 10, y: 2 } }] }, o)))!.slice(1).map(Number);
    const [w, h] = box({ scale: 50, margin: 10, scaleBar: false });
    expect(w / MM).toBeCloseTo(10 * 1000 / 50 + 20, 1);   // 200 mm + margins
    expect(h / MM).toBeCloseTo(2 * 1000 / 50 + 20, 1);
    const [, h2] = box({ scale: 50, margin: 10, title: "Plan" });   // + 14 mm scale bar, + 10 mm title
    expect(h2 / MM).toBeCloseTo(40 + 20 + 14 + 10, 1);
    const [w3] = box({ scale: 1000, unit: 0.001, margin: 0, scaleBar: false });   // a drawing in mm at 1:1000
    expect(w3 / MM).toBeCloseTo(0.01, 2);
  });

  it("draws at the scale: a 1 m line at 1:50 is 20 mm long on paper", () => {
    const pdf = text(writePdf2D({ lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }] }, { scale: 50, margin: 10, scaleBar: false }));
    const m = /([\d.]+) ([\d.]+) m ([\d.]+) ([\d.]+) l S/.exec(pdf)!.slice(1).map(Number);
    expect((m[2] - m[0]) / MM).toBeCloseTo(20, 2);
    expect(m[0] / MM).toBeCloseTo(10, 2);   // the margin
  });

  it("takes the true colour, else the ACI colour, else the layer's — darkened for white paper unless asked not to", () => {
    const c = { lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, rgb: "#22c3d8" }], layers: [{ name: "a", rgb: "#ff0000" }] };
    expect(text(writePdf2D(c, { forPaper: false }))).toContain("0.13 0.76 0.85 RG");
    const paper = /([\d.]+) ([\d.]+) ([\d.]+) RG/.exec(text(writePdf2D(c)))!.slice(1).map(Number);
    expect(Math.max(...paper) + Math.min(...paper)).toBeLessThanOrEqual(0.85);   // HSL lightness ≤ 0.42
    expect(paper[2]).toBeGreaterThan(paper[0]);   // still cyan
    const layer = text(writePdf2D({ lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }], layers: [{ name: "a", rgb: "#ff0000" }] }, { forPaper: false }));
    expect(layer).toContain("1 0 0 RG");
    expect(text(writePdf2D({ lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, rgb: "#ffffff" }] }))).toContain("0 0 0 RG");   // white → black on paper
  });

  it("writes text in Helvetica, escaped, with its alignment; line types as dashes; arcs as Béziers", () => {
    const pdf = text(writePdf2D({
      texts: [{ layer: "t", at: { x: 0, y: 0 }, text: "a(b)\\c Ø ✓ —", height: 0.25, align: "center" }],
      lines: [{ layer: "a", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, linetype: "DASHED" }],
      arcs: [{ layer: "a", center: { x: 0, y: 0 }, radius: 1, startDeg: 0, endDeg: 180 }],
    }));
    expect(pdf).toContain("/BaseFont /Helvetica /Encoding /WinAnsiEncoding");
    expect(pdf).toContain("(a\\(b\\)\\\\c \\330 ? \\227) Tj");
    expect(pdf).toMatch(/\[[\d.]+ [\d.]+\] 0 d/);
    const onLayer = (lineType: string) => text(writePdf2D({ lines: [{ layer: "h", start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }], layers: [{ name: "h", lineType }] }));
    expect(onLayer("hidden")).toMatch(/\[[\d.]+ [\d.]+\] 0 d\n[\d. ]+ m [\d. ]+ l S/);   // follows its layer's line type, as in the DXF
    expect(onLayer("CONTINUOUS")).not.toMatch(/\[[\d.][\d. ]*\] 0 d/);
    expect((pdf.match(/ c/g) ?? []).length).toBeGreaterThanOrEqual(2);   // 180° = two quarter Béziers
  });

  it("throws on a non-finite coordinate or a bad scale, like writeDxf2D", () => {
    expect(() => writePdf2D({ lines: [{ layer: "a", start: { x: 0, y: NaN }, end: { x: 1, y: 0 } }] })).toThrow(/line 0 \(layer "a"\)/);
    expect(() => writePdf2D({}, { scale: 0 })).toThrow(/scale/);
  });
});
