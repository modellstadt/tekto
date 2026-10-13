/**
 * Pure DXF text writers — no three.js, no DOM, so they run in Node and in `tekto/core`.
 *
 * `writeDxf3D` writes true-3D geometry in world space. The R12 primitives below are
 * shared with `DxfExporter` (mesh views with hidden-line removal, browser entry), which
 * imports them from here; the underscore names are internal, not part of the API.
 */

import { Vec3 } from '../core/math/vectors';

export interface DxfLayerDef {
  name: string;
  /** AutoCAD Color Index (ACI): 1=red 2=yellow 3=green 4=cyan 5=blue 7=white */
  color?: number;
  /** Currently ignored: the R12 writer emits every layer as CONTINUOUS (the only linetype it defines). */
  lineType?: string;
}

// ── True-3D DXF content (for writeDxf3D) ────────────────────────────────────────
// Unlike DxfExporter (which projects to a 2D view plane), these describe geometry in world space.

/** A polyline in world space (Z-up); emitted as a DXF 3D POLYLINE. */
export interface Dxf3DPolyline { layer: string; points: Vec3[]; closed?: boolean; }
/** A straight segment in world space; emitted as a DXF LINE (use for standalone lines — a POLYLINE
 *  is heavier and some CAD tools prefer discrete LINEs). */
export interface Dxf3DLine { layer: string; start: Vec3; end: Vec3; }
/** A single point node; emitted as a DXF POINT. */
export interface Dxf3DPoint { layer: string; position: Vec3; }
/** A horizontal circular arc at elevation z (world XY plane, CCW, angles in degrees). A full sweep
 *  (|endDeg − startDeg| ≥ 360) is written as a CIRCLE — AutoCAD collapses a 0→360 ARC to nothing. */
export interface Dxf3DArc { layer: string; center: Vec3; radius: number; startDeg: number; endDeg: number; }
/** A full circle in the world XY plane at elevation z. */
export interface Dxf3DCircle { layer: string; center: Vec3; radius: number; }
/** Input to {@link writeDxf3D}. Any layer used by an entity but absent from `layers` is declared color 7. */
export interface Dxf3DContent {
  polylines?: Dxf3DPolyline[];
  lines?: Dxf3DLine[];
  points?: Dxf3DPoint[];
  arcs?: Dxf3DArc[];
  circles?: Dxf3DCircle[];
  layers?: DxfLayerDef[];
}

// ── R12 (AC1009) writer primitives — shared by the 2D LINE writer and writeDxf3D ────────────────
// AutoCAD's loader is far stricter than Rhino/LibreCAD. Three things it needs that a minimal DXF
// often omits — and which then make it reject the file, usually misreported as a truncation:
//   • the R12 skeleton: a HEADER declaring $ACADVER, an LTYPE table, and a BLOCKS section;
//   • every layer referenced by an entity must be declared in the LAYER table (older AutoCAD does
//     not reliably auto-create them on file-open and aborts on the first undeclared reference);
//   • symbol names must be single tokens — no spaces, <= 31 chars.

/** R12/AC1009 symbol name: trim, map any char outside [A-Za-z0-9$_-] to '_', cap at 31. Applied to
 *  BOTH the LAYER-table names and every entity's layer ref, so declared names and references match. */
export function _sanLayer(s: string): string {
  return s.trim().replace(/[^A-Za-z0-9$_-]/g, '_').slice(0, 31) || 'LAYER0';
}

/** Format a DXF real as a plain decimal — never exponential ("1e-7" is rejected by AutoCAD). Snaps
 *  float noise below 1e-9 to 0 and strips trailing zeros. */
export function _real(n: number): string {
  if (!Number.isFinite(n) || Math.abs(n) < 1e-9) return '0';
  let s = n.toFixed(9);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

/** Sanitized, deduped layer set: declared defs (with colors) unioned with every layer an entity
 *  actually uses (default color 7). Guarantees no entity references an undeclared layer. */
export function _resolveLayers(defs: DxfLayerDef[], used: Iterable<string>): { names: string[]; colorOf: Map<string, number> } {
  const colorOf = new Map<string, number>();
  const names: string[] = [];
  for (const d of defs)  { const n = _sanLayer(d.name); if (!colorOf.has(n)) { names.push(n); colorOf.set(n, d.color ?? 7); } }
  for (const raw of used) { const n = _sanLayer(raw);   if (!colorOf.has(n)) { names.push(n); colorOf.set(n, 7); } }
  return { names, colorOf };
}

/** Emit HEADER + TABLES(LTYPE, LAYER) + empty BLOCKS — the R12 prologue AutoCAD expects. */
export function _writeR12Prologue(lines: string[], names: string[], colorOf: Map<string, number>, scale = 1000): void {
  // Declare the drawing unit so CAD doesn't guess: model space is metres, so
  // scale 1 exports metres ($INSUNITS 6); any other scale is treated as the
  // classic mm output ($INSUNITS 4). $MEASUREMENT 1 = metric.
  lines.push('0', 'SECTION', '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1009',
    '9', '$INSUNITS', '70', scale === 1 ? '6' : '4',
    '9', '$MEASUREMENT', '70', '1',
    '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'TABLES');
  lines.push('0', 'TABLE', '2', 'LTYPE', '70', '1');
  lines.push('0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0');
  lines.push('0', 'ENDTAB');
  lines.push('0', 'TABLE', '2', 'LAYER', '70', String(names.length));
  for (const name of names) lines.push('0', 'LAYER', '2', name, '70', '0', '62', String(colorOf.get(name) ?? 7), '6', 'CONTINUOUS');
  lines.push('0', 'ENDTAB', '0', 'ENDSEC');
  lines.push('0', 'SECTION', '2', 'BLOCKS', '0', 'ENDSEC');
}

/**
 * Write a true-3D DXF (R12 / AC1009): 3D POLYLINEs, LINEs, POINTs, horizontal ARCs and CIRCLEs in
 * world coordinates — unlike {@link DxfExporter}, which flattens geometry to a 2D view plane. AutoCAD-safe
 * by construction: every referenced layer is auto-declared, names are sanitized to R12 tokens, reals
 * are plain decimals (never exponential), and the file carries a full HEADER/LTYPE/BLOCKS skeleton.
 * A full-sweep arc (|endDeg − startDeg| ≥ 360) is emitted as a CIRCLE, since AutoCAD collapses a
 * 0→360 ARC to a zero-sweep (invisible) arc; partial arc angles are normalized into [0, 360).
 *
 * Coordinates are Z-up world space (tekto convention), written verbatim — scale before calling if
 * your CAD target expects millimetres.
 */
export function writeDxf3D(content: Dxf3DContent): string {
  const polylines = content.polylines ?? [];
  const lineSegs  = content.lines ?? [];
  const points    = content.points ?? [];
  const arcs      = content.arcs ?? [];
  const circles   = content.circles ?? [];
  const lines: string[] = [];
  const okR = (r: number) => Number.isFinite(r) && r > 1e-9;

  // A NaN written as 0 moves a point to the origin without a word; refuse it instead.
  // (Arcs and circles with a degenerate radius are dropped below, as before — only the
  // ones that will be written are checked.)
  const finite = (v: Vec3) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
  const bad = (what: string, i: number, layer: string) => {
    throw new Error(`writeDxf3D: ${what} ${i} (layer "${layer}") has a non-finite coordinate`);
  };
  polylines.forEach((p, i) => { if (!p.points.every(finite)) bad("polyline", i, p.layer); });
  lineSegs.forEach((l, i) => { if (!finite(l.start) || !finite(l.end)) bad("line", i, l.layer); });
  points.forEach((pt, i) => { if (!finite(pt.position)) bad("point", i, pt.layer); });
  arcs.forEach((a, i) => { if (okR(a.radius) && (!finite(a.center) || !Number.isFinite(a.startDeg) || !Number.isFinite(a.endDeg))) bad("arc", i, a.layer); });
  circles.forEach((c, i) => { if (okR(c.radius) && !finite(c.center)) bad("circle", i, c.layer); });

  const used = new Set<string>();
  for (const p of polylines) if (p.points.length >= 2) used.add(p.layer);
  for (const s of lineSegs)                            used.add(s.layer);
  for (const a of arcs)      if (okR(a.radius))        used.add(a.layer);
  for (const c of circles)   if (okR(c.radius))        used.add(c.layer);
  for (const pt of points)                             used.add(pt.layer);
  const { names, colorOf } = _resolveLayers(content.layers ?? [], used);
  _writeR12Prologue(lines, names, colorOf, 1);   // this writer emits raw model coordinates (metres)

  const emitCircle = (layer: string, c: Vec3, r: number) =>
    lines.push('0', 'CIRCLE', '8', _sanLayer(layer), '10', _real(c.x), '20', _real(c.y), '30', _real(c.z), '40', _real(r));

  lines.push('0', 'SECTION', '2', 'ENTITIES');
  for (const poly of polylines) {
    if (poly.points.length < 2) continue;
    const layer = _sanLayer(poly.layer);
    lines.push('0', 'POLYLINE', '8', layer, '66', '1', '70', poly.closed ? '9' : '8'); // 8 = 3D polyline (| 1 = closed)
    lines.push('10', '0', '20', '0', '30', '0');                                        // placeholder; VERTEX rows carry coords
    for (const p of poly.points) {
      lines.push('0', 'VERTEX', '8', layer, '10', _real(p.x), '20', _real(p.y), '30', _real(p.z), '70', '32'); // 32 = 3D vertex
    }
    lines.push('0', 'SEQEND', '8', layer);
  }
  for (const s of lineSegs) {
    lines.push('0', 'LINE', '8', _sanLayer(s.layer),
      '10', _real(s.start.x), '20', _real(s.start.y), '30', _real(s.start.z),
      '11', _real(s.end.x), '21', _real(s.end.y), '31', _real(s.end.z));
  }
  for (const c of circles) if (okR(c.radius)) emitCircle(c.layer, c.center, c.radius);
  for (const a of arcs) {                                    // horizontal arc at elevation z, CCW, degrees
    if (!okR(a.radius)) continue;
    if (Math.abs(a.endDeg - a.startDeg) >= 360 - 1e-6) { emitCircle(a.layer, a.center, a.radius); continue; } // full sweep → CIRCLE
    const norm = (d: number) => { let x = d % 360; if (x < 0) x += 360; return x; };
    lines.push('0', 'ARC', '8', _sanLayer(a.layer),
      '10', _real(a.center.x), '20', _real(a.center.y), '30', _real(a.center.z),
      '40', _real(a.radius), '50', _real(norm(a.startDeg)), '51', _real(norm(a.endDeg)));
  }
  for (const pt of points) {
    lines.push('0', 'POINT', '8', _sanLayer(pt.layer), '10', _real(pt.position.x), '20', _real(pt.position.y), '30', _real(pt.position.z));
  }
  lines.push('0', 'ENDSEC', '0', 'EOF');

  return lines.join('\r\n') + '\r\n';
}

// ── 2D drawings (for writeDxf2D) ────────────────────────────────────────────────

/** A point in the drawing plane. `Vec2`, or anything with x and y. */
export interface Dxf2DPoint { x: number; y: number; }
/** A polyline in the drawing plane; emitted as an R12 2D POLYLINE (closed = the ring is shut). */
export interface Dxf2DPolyline { layer: string; points: Dxf2DPoint[]; closed?: boolean; }
export interface Dxf2DLine { layer: string; start: Dxf2DPoint; end: Dxf2DPoint; }
export interface Dxf2DCircle { layer: string; center: Dxf2DPoint; radius: number; }
/** CCW arc, angles in degrees; a full sweep is written as a CIRCLE (AutoCAD drops a 0→360 ARC). */
export interface Dxf2DArc { layer: string; center: Dxf2DPoint; radius: number; startDeg: number; endDeg: number; }
/** Single-line text at `at` (its baseline start), `height` in drawing units, rotated CCW. */
export interface Dxf2DText { layer: string; at: Dxf2DPoint; text: string; height: number; rotationDeg?: number; }
/** Input to {@link writeDxf2D}. Any layer an entity uses but `layers` doesn't list is declared colour 7. */
export interface Dxf2DContent {
  polylines?: Dxf2DPolyline[];
  lines?: Dxf2DLine[];
  circles?: Dxf2DCircle[];
  arcs?: Dxf2DArc[];
  texts?: Dxf2DText[];
  layers?: DxfLayerDef[];
}

/**
 * Write a 2D drawing (plan, section, cut sheet) as DXF R12: POLYLINEs, LINEs, CIRCLEs,
 * ARCs and TEXT on named layers — the same AutoCAD-safe writer as {@link writeDxf3D}
 * (every layer declared, R12 names, plain decimals).
 *
 * `scale` multiplies every coordinate, radius and text height and sets the file's unit:
 * 1 (default) writes your numbers as metres, 1000 writes metres as millimetres (the usual
 * CAD drawing unit). A NaN or infinite coordinate throws; a circle or arc with a degenerate
 * radius is dropped, as in `writeDxf3D`.
 *
 *   download(writeDxf2D({ polylines: [{ layer: "cut", points: outline, closed: true }],
 *     texts: [{ layer: "text", at: { x: 0, y: -0.5 }, text: "Plan 1:50", height: 0.25 }] },
 *     { scale: 1000 }), "plan.dxf");
 */
export function writeDxf2D(content: Dxf2DContent, opts: { scale?: number } = {}): string {
  const scale = opts.scale ?? 1;
  if (!(Number.isFinite(scale) && scale > 0)) throw new Error(`writeDxf2D: scale must be a positive number, got ${scale}`);
  const polylines = content.polylines ?? [];
  const lineSegs = content.lines ?? [];
  const circles = content.circles ?? [];
  const arcs = content.arcs ?? [];
  const texts = content.texts ?? [];
  const okR = (r: number) => Number.isFinite(r) && r > 1e-9;
  const finite = (p: Dxf2DPoint) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const bad = (what: string, i: number, layer: string, why = "a non-finite coordinate") => {
    throw new Error(`writeDxf2D: ${what} ${i} (layer "${layer}") has ${why}`);
  };
  polylines.forEach((p, i) => { if (!p.points.every(finite)) bad("polyline", i, p.layer); });
  lineSegs.forEach((l, i) => { if (!finite(l.start) || !finite(l.end)) bad("line", i, l.layer); });
  circles.forEach((c, i) => { if (okR(c.radius) && !finite(c.center)) bad("circle", i, c.layer); });
  arcs.forEach((a, i) => { if (okR(a.radius) && (!finite(a.center) || !Number.isFinite(a.startDeg) || !Number.isFinite(a.endDeg))) bad("arc", i, a.layer); });
  texts.forEach((t, i) => {
    if (!finite(t.at)) bad("text", i, t.layer);
    if (!(Number.isFinite(t.height) && t.height > 0)) bad("text", i, t.layer, `a height of ${t.height} (needs > 0)`);
  });

  const used = new Set<string>();
  for (const p of polylines) if (p.points.length >= 2) used.add(p.layer);
  for (const l of lineSegs) used.add(l.layer);
  for (const c of circles) if (okR(c.radius)) used.add(c.layer);
  for (const a of arcs) if (okR(a.radius)) used.add(a.layer);
  for (const t of texts) used.add(t.layer);
  const lines: string[] = [];
  const { names, colorOf } = _resolveLayers(content.layers ?? [], used);
  _writeR12Prologue(lines, names, colorOf, scale);

  const v = (n: number) => _real(n * scale);
  const xy = (p: Dxf2DPoint) => ['10', v(p.x), '20', v(p.y), '30', '0'];
  const emitCircle = (layer: string, c: Dxf2DPoint, r: number) => lines.push('0', 'CIRCLE', '8', _sanLayer(layer), ...xy(c), '40', v(r));

  lines.push('0', 'SECTION', '2', 'ENTITIES');
  for (const poly of polylines) {
    if (poly.points.length < 2) continue;
    const layer = _sanLayer(poly.layer);
    lines.push('0', 'POLYLINE', '8', layer, '66', '1', '70', poly.closed ? '1' : '0', '10', '0', '20', '0', '30', '0');
    for (const p of poly.points) lines.push('0', 'VERTEX', '8', layer, ...xy(p), '70', '0');
    lines.push('0', 'SEQEND', '8', layer);
  }
  for (const l of lineSegs) {
    lines.push('0', 'LINE', '8', _sanLayer(l.layer), ...xy(l.start), '11', v(l.end.x), '21', v(l.end.y), '31', '0');
  }
  for (const c of circles) if (okR(c.radius)) emitCircle(c.layer, c.center, c.radius);
  for (const a of arcs) {
    if (!okR(a.radius)) continue;
    if (Math.abs(a.endDeg - a.startDeg) >= 360 - 1e-6) { emitCircle(a.layer, a.center, a.radius); continue; }
    const norm = (d: number) => { let x = d % 360; if (x < 0) x += 360; return x; };
    lines.push('0', 'ARC', '8', _sanLayer(a.layer), ...xy(a.center), '40', v(a.radius), '50', _real(norm(a.startDeg)), '51', _real(norm(a.endDeg)));
  }
  for (const t of texts) {
    lines.push('0', 'TEXT', '8', _sanLayer(t.layer), ...xy(t.at), '40', v(t.height),
      '1', t.text.replace(/[\r\n]+/g, ' '), '50', _real(t.rotationDeg ?? 0));
  }
  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\r\n') + '\r\n';
}

