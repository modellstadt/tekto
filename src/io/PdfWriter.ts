/**
 * Vector PDF of a 2D drawing — the same content `writeDxf2D` takes (polylines, lines, circles, arcs,
 * texts, solids on named layers), drawn at a true scale on one page sized to the drawing, with an
 * optional title and scale bar. No dependency: a single uncompressed content stream, the standard
 * Helvetica font (WinAnsi), so every viewer and plotter reads it.
 */
import { ACI, type Dxf2DContent, type Dxf2DLook, type Dxf2DPoint } from "./DxfWriter";

/** Options of {@link writePdf2D}. Lengths on paper are in millimetres. */
export interface Pdf2DOptions {
  /** The drawing scale's denominator: 50 draws at 1:50 (default 50). */
  scale?: number;
  /** Metres per drawing unit (default 1: the drawing is in metres; 0.001 for millimetres). */
  unit?: number;
  /** Paper margin around the drawing, mm (default 10). */
  margin?: number;
  /** Line width on paper, mm (default 0.18). */
  lineWidth?: number;
  /** Printed top left with the scale, e.g. "Unrolled elevation" → "Unrolled elevation · 1:50". */
  title?: string;
  /** A scale bar under the drawing (default true). */
  scaleBar?: boolean;
  /** Colours made dark enough for white paper (default true): lighter than the limit, a colour keeps
   *  its hue and is darkened; white and near-white become black. false: the colours as given. */
  forPaper?: boolean;
}

/** Helvetica advance widths (1/1000 em) for ASCII 32–126 — to place centred / right-aligned text. */
const HELV = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778,
  722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const CAP = 0.718, DESC = 0.207;   // Helvetica cap height and descender (em)
const MM = 72 / 25.4;              // PDF points per millimetre

const textWidth = (s: string) => [...s].reduce((w, ch) => { const c = ch.charCodeAt(0); return w + (c >= 32 && c <= 126 ? HELV[c - 32] : 556); }, 0) / 1000;
/** The WinAnsi codes 0x80–0x9F of the usual typographic characters (dashes, quotes, ellipsis, euro …). */
const WIN_ANSI: Record<string, number> = { "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "‰": 0x89, "‘": 0x91, "’": 0x92,
  "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "™": 0x99 };
/** A PDF string literal in WinAnsi: \, ( and ) escaped; anything WinAnsi lacks → "?". */
const pdfString = (s: string) => "(" + [...s.replace(/[\r\n]+/g, " ")].map(ch => {
  const c = ch.charCodeAt(0), w = WIN_ANSI[ch];
  if (ch === "\\" || ch === "(" || ch === ")") return "\\" + ch;
  if (c >= 32 && c <= 126) return ch;
  if (w !== undefined || (c >= 160 && c <= 255)) return "\\" + (w ?? c).toString(8).padStart(3, "0");
  return "?";
}).join("") + ")";

const parseHex = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map(c => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
};
/** Darkened for white paper: HSL lightness capped at 0.42 (hue kept); greys lighter than mid → black. */
const forPaper = ([r, g, b]: [number, number, number]): [number, number, number] => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 0.08) return l > 0.5 ? [0, 0, 0] : [r, g, b];
  if (l <= 0.42) return [r, g, b];
  const s = d / (1 - Math.abs(2 * l - 1)), L = 0.42, C = (1 - Math.abs(2 * L - 1)) * s;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  if (h < 0) h += 6;
  const X = C * (1 - Math.abs((h % 2) - 1)), m = L - C / 2;
  const [R, G, B] = h < 1 ? [C, X, 0] : h < 2 ? [X, C, 0] : h < 3 ? [0, C, X] : h < 4 ? [0, X, C] : h < 5 ? [X, 0, C] : [C, 0, X];
  return [R + m, G + m, B + m];
};

/**
 * Write a 2D drawing as a vector PDF at a true scale: one page, sized to the drawing plus margins,
 * the drawing's y up. Takes the same {@link Dxf2DContent} as `writeDxf2D`; an entity's colour is its
 * `rgb` (CSS hex), else its ACI `color`, else its layer's `rgb` / `color`, else black. Line types (its own, else its layer's)
 * become dash patterns; text is Helvetica (`height` = cap height, as in DXF). Returns the file's bytes.
 *
 *   download(writePdf2D(plan, { scale: 50, title: "Plan" }), "plan.pdf");
 *
 * A page over 5080 mm (200 in) is valid PDF, but Acrobat refuses it — pick a smaller scale then.
 * A NaN or infinite coordinate throws, as in `writeDxf2D`.
 */
export function writePdf2D(content: Dxf2DContent, opts: Pdf2DOptions = {}): Uint8Array {
  const scale = opts.scale ?? 50, unit = opts.unit ?? 1, margin = opts.margin ?? 10, lw = opts.lineWidth ?? 0.18;
  if (!(Number.isFinite(scale) && scale > 0)) throw new Error(`writePdf2D: scale must be a positive number, got ${scale}`);
  if (!(Number.isFinite(unit) && unit > 0)) throw new Error(`writePdf2D: unit must be a positive number, got ${unit}`);
  const polylines = content.polylines ?? [], lineSegs = content.lines ?? [], circles = content.circles ?? [];
  const arcs = content.arcs ?? [], texts = content.texts ?? [], solids = content.solids ?? [];
  const finite = (p: Dxf2DPoint) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const bad = (what: string, i: number, layer: string, why = "a non-finite coordinate") => { throw new Error(`writePdf2D: ${what} ${i} (layer "${layer}") has ${why}`); };
  polylines.forEach((p, i) => { if (!p.points.every(finite)) bad("polyline", i, p.layer); });
  lineSegs.forEach((l, i) => { if (!finite(l.start) || !finite(l.end)) bad("line", i, l.layer); });
  circles.forEach((c, i) => { if (!finite(c.center) || !Number.isFinite(c.radius)) bad("circle", i, c.layer); });
  arcs.forEach((a, i) => { if (!finite(a.center) || ![a.radius, a.startDeg, a.endDeg].every(Number.isFinite)) bad("arc", i, a.layer); });
  texts.forEach((t, i) => { if (!finite(t.at)) bad("text", i, t.layer); if (!(Number.isFinite(t.height) && t.height > 0)) bad("text", i, t.layer, `a height of ${t.height} (needs > 0)`); });
  solids.forEach((s, i) => { if (!s.points.every(finite)) bad("solid", i, s.layer); });

  // the drawing's extent (texts by their estimated box)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const grow = (x: number, y: number) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
  for (const p of polylines) for (const q of p.points) grow(q.x, q.y);
  for (const l of lineSegs) { grow(l.start.x, l.start.y); grow(l.end.x, l.end.y); }
  for (const c of [...circles, ...arcs]) if (c.radius > 0) { grow(c.center.x - c.radius, c.center.y - c.radius); grow(c.center.x + c.radius, c.center.y + c.radius); }
  for (const s of solids) for (const q of s.points) grow(q.x, q.y);
  for (const t of texts) { const w = textWidth(t.text) * t.height / CAP, h = t.height / CAP; grow(t.at.x - w, t.at.y - h); grow(t.at.x + w, t.at.y + h); }
  if (!(x1 >= x0)) { x0 = y0 = 0; x1 = y1 = 1; }

  const k = unit * 1000 / scale;   // mm on paper per drawing unit
  const foot = (opts.scaleBar ?? true) ? 14 : 0, head = opts.title ? 10 : 0;
  const Wmm = (x1 - x0) * k + 2 * margin, Hmm = (y1 - y0) * k + 2 * margin + foot + head;
  const X = (x: number) => (margin + (x - x0) * k) * MM, Y = (y: number) => (margin + foot + (y - y0) * k) * MM;
  const n = (v: number) => (Math.abs(v) < 5e-4 ? "0" : v.toFixed(2).replace(/\.?0+$/, ""));

  const layerRgb = new Map<string, [number, number, number]>(), layerType = new Map<string, string>();
  const aciRgb = (c: number): [number, number, number] | null => { const e = ACI.find(a => a[0] === c); return e ? [e[1] / 255, e[2] / 255, e[3] / 255] : null; };
  for (const d of content.layers ?? []) {
    const c = (d.rgb && parseHex(d.rgb)) || (d.color !== undefined ? aciRgb(d.color) : null); if (c) layerRgb.set(d.name, c);
    if (d.lineType) layerType.set(d.name, d.lineType.toUpperCase());   // as writeDxf2D: an entity without its own follows its layer
  }
  const paper = opts.forPaper ?? true;
  const colourOf = (e: { layer: string; rgb?: string; color?: number }): [number, number, number] => {
    const c = (e.rgb && parseHex(e.rgb)) || (e.color !== undefined ? aciRgb(e.color) : null) || layerRgb.get(e.layer) || [0, 0, 0];
    return paper ? forPaper(c) : c;
  };
  const ops: string[] = [`1 J 1 j ${n(lw * MM)} w`];
  let stroke = "", fill = "", dash = "[] 0 d";
  const setStroke = (c: [number, number, number]) => { const s = `${n(c[0])} ${n(c[1])} ${n(c[2])} RG`; if (s !== stroke) { ops.push(s); stroke = s; } };
  const setFill = (c: [number, number, number]) => { const s = `${n(c[0])} ${n(c[1])} ${n(c[2])} rg`; if (s !== fill) { ops.push(s); fill = s; } };
  const DASH: Record<string, number[]> = { DASHED: [3, 1.5], HIDDEN: [1.5, 1], DOTTED: [0.2, 1], CENTER: [6, 1.2, 1.2, 1.2] };
  const setLook = (e: Dxf2DLook & { layer: string }) => {
    setStroke(colourOf(e));
    const pattern = DASH[e.linetype ?? layerType.get(e.layer) ?? ""];   // CONTINUOUS or unknown: solid
    const d = pattern ? `[${pattern.map(v => n(v * MM)).join(" ")}] 0 d` : "[] 0 d";
    if (d !== dash) { ops.push(d); dash = d; }
  };
  /** A circular arc as cubic Béziers (≤ 90° each), from angle a to b (radians, CCW). */
  const arcPath = (c: Dxf2DPoint, r: number, a: number, b: number) => {
    const seg = Math.max(1, Math.ceil(Math.abs(b - a) / (Math.PI / 2))), da = (b - a) / seg, t = 4 / 3 * Math.tan(da / 4);
    const out = [`${n(X(c.x + r * Math.cos(a)))} ${n(Y(c.y + r * Math.sin(a)))} m`];
    for (let i = 0; i < seg; i++) {
      const p = a + i * da, q = p + da;
      const P1 = [c.x + r * (Math.cos(p) - t * Math.sin(p)), c.y + r * (Math.sin(p) + t * Math.cos(p))];
      const P2 = [c.x + r * (Math.cos(q) + t * Math.sin(q)), c.y + r * (Math.sin(q) - t * Math.cos(q))];
      out.push(`${n(X(P1[0]))} ${n(Y(P1[1]))} ${n(X(P2[0]))} ${n(Y(P2[1]))} ${n(X(c.x + r * Math.cos(q)))} ${n(Y(c.y + r * Math.sin(q)))} c`);
    }
    return out.join(" ");
  };

  for (const s of solids) {
    if (s.points.length < 3) continue;
    setFill(colourOf(s));
    ops.push(s.points.map((q, i) => `${n(X(q.x))} ${n(Y(q.y))} ${i ? "l" : "m"}`).join(" ") + " h f");
  }
  for (const p of polylines) {
    if (p.points.length < 2) continue;
    setLook(p);
    ops.push(p.points.map((q, i) => `${n(X(q.x))} ${n(Y(q.y))} ${i ? "l" : "m"}`).join(" ") + (p.closed ? " h S" : " S"));
  }
  for (const l of lineSegs) { setLook(l); ops.push(`${n(X(l.start.x))} ${n(Y(l.start.y))} m ${n(X(l.end.x))} ${n(Y(l.end.y))} l S`); }
  for (const c of circles) if (c.radius > 0) { setLook(c); ops.push(arcPath(c.center, c.radius, 0, 2 * Math.PI) + " h S"); }
  for (const a of arcs) {
    if (!(a.radius > 0)) continue;
    setLook(a);
    let b = a.endDeg; while (b <= a.startDeg) b += 360;
    ops.push(arcPath(a.center, a.radius, a.startDeg * Math.PI / 180, Math.min(b, a.startDeg + 360) * Math.PI / 180) + " S");
  }
  const text = (s: string, x: number, y: number, size: number, rot: number, align: string, valign: string) => {
    const w = textWidth(s) * size, dx = align === "center" ? -w / 2 : align === "right" ? -w : 0;
    const dy = valign === "top" ? -CAP * size : valign === "middle" ? -CAP * size / 2 : valign === "bottom" ? DESC * size : 0;
    const c = Math.cos(rot), sn = Math.sin(rot), tx = x + dx * c - dy * sn, ty = y + dx * sn + dy * c;
    ops.push(`BT /F1 ${n(size)} Tf ${n(c)} ${n(sn)} ${n(-sn)} ${n(c)} ${n(tx)} ${n(ty)} Tm ${pdfString(s)} Tj ET`);
  };
  for (const t of texts) {
    setFill(colourOf(t));
    text(t.text, X(t.at.x), Y(t.at.y), t.height * k * MM / CAP, (t.rotationDeg ?? 0) * Math.PI / 180, t.align ?? "left", t.valign ?? "baseline");
  }
  // title and scale bar (black, paper units)
  if (opts.title) { setFill([0, 0, 0]); text(`${opts.title} · 1:${scale}`, margin * MM, (Hmm - margin - 4) * MM, 3.5 / CAP * MM, 0, "left", "baseline"); }
  if (foot) {
    const want = (x1 - x0) * unit / 5, nice = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find(v => v >= want / 4) ?? 1000;
    const steps = 4, len = nice * steps, bx = margin, by = margin, bw = len / unit * k, bh = 1.5;   // a bar of 4 steps (metres)
    ops.push("[] 0 d"); dash = "[] 0 d"; setStroke([0, 0, 0]);
    for (let i = 0; i < steps; i++) {
      setFill(i % 2 ? [1, 1, 1] : [0, 0, 0]);
      ops.push(`${n((bx + bw * i / steps) * MM)} ${n(by * MM)} ${n(bw / steps * MM)} ${n(bh * MM)} re B`);
    }
    setFill([0, 0, 0]);
    for (let i = 0; i <= steps; i++) text(`${+(nice * i).toFixed(3)}${i === steps ? " m" : ""}`, (bx + bw * i / steps) * MM, (by + bh + 1) * MM, 2.2 / CAP * MM, 0, "center", "baseline");
  }

  // the file: catalog, pages, page, font, content — byte offsets in the xref table
  const body = ops.join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(Wmm * MM)} ${n(Hmm * MM)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
  ];
  let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(o => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;   // (every char is Latin-1: the escapes keep it so)
  return bytes;
}
