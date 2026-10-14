import {
  describeSceneObject,
  getTheme,
  saveBundle,
  sceneSummary,
  slug,
  snapshotWithOverlays
} from "./chunk-R3QZS3QQ.mjs";
import {
  SunPosition
} from "./chunk-4FLH7OLY.mjs";

// src/gui/viewModeIcons.ts
var A = [3, 7.5];
var B = [13, 4];
var C = [21, 8];
var D = [11, 11.5];
var DROP = 9;
var down = ([x, y]) => [x, y + DROP];
var [A2, B2, C2, D2] = [A, B, C, D].map(down);
var pts = (...ps) => ps.map((p) => p.join(",")).join(" ");
var VIEW_MODE_ICON_CORNERS = { front: D, back: B2 };
var OUTLINE = pts(A, B, C, C2, D2, A2);
var inner = () => [[D, A], [D, C], [D, D2]].map(([from, to]) => ({ kind: "line", from, to }));
var hidden = (opacity) => [[B, B2], [A2, B2], [C2, B2]].map(([from, to]) => ({ kind: "line", from, to, ...opacity === void 0 ? {} : { opacity } }));
function viewModeIconShapes(mode) {
  if (mode === "solid") {
    return [
      { kind: "polygon", points: pts(A, B, C, D), fill: 0.18 },
      { kind: "polygon", points: pts(A, D, D2, A2), fill: 0.45 },
      { kind: "polygon", points: pts(D, C, C2, D2), fill: 0.8 },
      { kind: "polygon", points: OUTLINE, stroke: true },
      ...inner()
    ];
  }
  if (mode === "ghost") {
    return [
      { kind: "polygon", points: OUTLINE, fill: 0.12 },
      ...hidden(0.45),
      { kind: "polygon", points: OUTLINE, stroke: true },
      ...inner()
    ];
  }
  if (mode === "wireframe") return [...hidden(), { kind: "polygon", points: OUTLINE, stroke: true }, ...inner()];
  return [{ kind: "polygon", points: OUTLINE, stroke: true }, ...inner()];
}
var VIEW_MODE_ICON_SVG = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round",
  strokeLinecap: "round"
};
function viewModeIconSvg(mode, size = 16) {
  const a = VIEW_MODE_ICON_SVG;
  const body = viewModeIconShapes(mode).map((s) => {
    if (s.kind === "line") {
      const o = s.opacity !== void 0 ? ` stroke-opacity="${s.opacity}"` : "";
      return `<line x1="${s.from[0]}" y1="${s.from[1]}" x2="${s.to[0]}" y2="${s.to[1]}"${o}/>`;
    }
    const fill = s.fill !== void 0 ? ` fill="currentColor" fill-opacity="${s.fill}"` : "";
    return `<polygon points="${s.points}"${fill}${s.stroke ? "" : ` stroke="none"`}/>`;
  }).join("");
  return `<svg xmlns="${a.xmlns}" viewBox="${a.viewBox}" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${a.strokeWidth}" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${body}</svg>`;
}

// src/sketch/Markup.ts
var INK = "#ff00d4";
var MarkupOverlay = class {
  constructor(host) {
    this.marks = [];
    this.drawing = null;
    this.active = false;
    this.onKey = (e) => this.handleKey(e);
    this.host = host;
    const vp = host.viewport;
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:20;cursor:crosshair;touch-action:none;display:none;";
    vp.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.chips = document.createElement("div");
    this.chips.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:21;display:none;";
    vp.appendChild(this.chips);
    const btnCss = "font:12px system-ui,sans-serif;padding:5px 10px;border-radius:5px;border:1px solid #d0d0d6;background:#fff;color:#222;cursor:pointer;";
    this.toggleBtn = document.createElement("button");
    this.toggleBtn.textContent = "\u270E Markup";
    this.toggleBtn.title = "Draw on the view to give instructions (saved as screenshot + JSON)";
    this.toggleBtn.style.cssText = `position:absolute;top:10px;right:10px;z-index:22;${btnCss}`;
    this.toggleBtn.addEventListener("click", () => this.setActive(!this.active));
    vp.appendChild(this.toggleBtn);
    this.bar = document.createElement("div");
    this.bar.style.cssText = "position:absolute;top:10px;right:100px;z-index:22;display:none;gap:6px;align-items:center;background:#fff;border:1px solid #d0d0d6;border-radius:7px;padding:5px;box-shadow:0 2px 8px rgba(0,0,0,.12);";
    this.noteBox = document.createElement("input");
    this.noteBox.placeholder = "Instruction for the whole view\u2026";
    this.noteBox.style.cssText = "font:12px system-ui,sans-serif;width:260px;padding:5px 8px;border:1px solid #d0d0d6;border-radius:5px;";
    this.noteBox.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") void this.save();
    });
    const mk = (label, title, fn) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.title = title;
      b.style.cssText = btnCss;
      b.addEventListener("click", fn);
      return b;
    };
    this.status = document.createElement("span");
    this.status.style.cssText = "font:11px system-ui,sans-serif;color:#666;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    this.bar.append(
      this.noteBox,
      mk("Undo", "Remove last mark (\u2318Z)", () => this.undo()),
      mk("Clear", "Remove all marks", () => {
        this.marks = [];
        this.redraw();
      }),
      mk("Save", "Save view.png + markup.json (\u2318S)", () => void this.save()),
      ...host.keep ? [mk("Keep as notes", "Keep the marks as notes with the model: saved, undoable, shared", () => this.keepNotes())] : [],
      this.status
    );
    vp.appendChild(this.bar);
    this.canvas.addEventListener("pointerdown", (e) => this.down(e));
    this.canvas.addEventListener("pointermove", (e) => this.move(e));
    this.canvas.addEventListener("pointerup", (e) => this.up(e));
  }
  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    this.host.setTracking(on);
    this.canvas.style.display = on ? "block" : "none";
    this.chips.style.display = on ? "block" : "none";
    this.bar.style.display = on ? "flex" : "none";
    this.toggleBtn.textContent = on ? "Done" : "\u270E Markup";
    if (on) {
      this.resize();
      window.addEventListener("keydown", this.onKey, true);
      this.setStatus("Drag to mark \xB7 Shift adds to the last mark");
    } else {
      window.removeEventListener("keydown", this.onKey, true);
      this.marks = [];
      this.redraw();
    }
  }
  dispose() {
    window.removeEventListener("keydown", this.onKey, true);
    this.canvas.remove();
    this.chips.remove();
    this.bar.remove();
    this.toggleBtn.remove();
  }
  // ── Input ──
  local(e) {
    const r = this.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  down(e) {
    if (e.button !== 0) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.drawing = [this.local(e)];
    if (!(e.shiftKey && this.marks.length)) {
      this.marks.push({ n: this.marks.length + 1, strokes: [], note: "" });
    }
    this.marks[this.marks.length - 1].strokes.push(this.drawing);
  }
  move(e) {
    if (!this.drawing) return;
    const p = this.local(e);
    const q = this.drawing[this.drawing.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2) {
      this.drawing.push(p);
      this.redraw();
    }
  }
  up(_e) {
    if (!this.drawing) return;
    this.drawing = null;
    const mark = this.marks[this.marks.length - 1];
    mark.resolved = this.resolve(mark);
    this.redraw();
    if (mark.strokes.length === 1) this.askNote(mark);
  }
  handleKey(e) {
    if (e.target instanceof HTMLInputElement) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      void this.save();
    } else if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.stopPropagation();
      this.undo();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      this.setActive(false);
    }
  }
  undo() {
    this.marks.pop();
    this.redraw();
  }
  /** Each mark as a note: its strokes laid on the model (or the ground), its text, the
   *  records it touched and this view. */
  keepNotes() {
    if (!this.host.keep) return;
    if (!this.marks.length) {
      this.setStatus("Draw a mark first");
      return;
    }
    const r = this.canvas.getBoundingClientRect();
    const onModel = (p) => this.host.hitAt(r.left + p[0], r.top + p[1])?.point ?? this.host.groundAt(r.left + p[0], r.top + p[1]);
    const cam = this.host.context().camera ?? {};
    const instruction = this.noteBox.value.trim();
    const notes = [];
    for (const m of this.marks) {
      const strokes = m.strokes.map((s) => (s.length === 1 ? s : resample(s, 6, 60)).map(onModel).filter((p) => !!p).map((p) => round3(p))).filter((s) => s.length > 0);
      if (!strokes.length) continue;
      const w = m.resolved?.world ?? {};
      const at = w.at ?? w.centroid ?? w.from ?? strokes[0][0];
      notes.push({
        text: m.note || instruction,
        ...this.host.author ? { author: this.host.author } : {},
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        pin: [at[0], at[1], at[2]],
        strokes,
        keys: [...new Set((m.resolved?.hits ?? []).map((h) => h.key).filter((k) => !!k))],
        view: { position: cam.position ?? [0, 0, 10], target: cam.target ?? [0, 0, 0], ...cam.projection ? { projection: cam.projection } : {} }
      });
    }
    if (!notes.length) {
      this.setStatus("The marks lie on nothing to keep them on");
      return;
    }
    this.host.keep(notes);
    this.marks = [];
    this.noteBox.value = "";
    this.redraw();
    this.setStatus(`Kept ${notes.length} note${notes.length > 1 ? "s" : ""}`);
  }
  /** A small input at the mark's badge; Enter keeps it, Escape leaves the mark without a note. */
  askNote(mark) {
    const [x, y] = badgeAt(mark);
    const inp = document.createElement("input");
    inp.placeholder = `note for ${mark.n}\u2026`;
    inp.style.cssText = `position:absolute;left:${x + 16}px;top:${y - 12}px;z-index:23;font:12px system-ui,sans-serif;width:200px;padding:4px 7px;border:2px solid ${INK};border-radius:5px;background:#fff;`;
    let closed = false;
    const done = () => {
      if (closed) return;
      closed = true;
      mark.note = inp.value.trim();
      inp.remove();
      this.redraw();
    };
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") done();
      if (e.key === "Escape") {
        inp.value = mark.note;
        done();
      }
    });
    inp.addEventListener("blur", done);
    this.host.viewport.appendChild(inp);
    setTimeout(() => inp.focus(), 0);
  }
  // ── Resolving a mark against the scene ──
  resolve(mark) {
    const r = this.canvas.getBoundingClientRect();
    const ray = (p) => this.host.hitAt(r.left + p[0], r.top + p[1]);
    const ground = (p) => this.host.groundAt(r.left + p[0], r.top + p[1]);
    const kind = classify(mark.strokes);
    const counts = /* @__PURE__ */ new Map();
    const points = [];
    let samples = 0;
    const hit = (p) => {
      samples++;
      const h = ray(p);
      if (!h) return null;
      counts.set(h.id, (counts.get(h.id) ?? 0) + 1);
      points.push(h.point);
      return h;
    };
    const world = {};
    const all = mark.strokes.flat();
    if (kind === "loop") {
      const ring = mark.strokes[0];
      for (const p of gridInside(ring, 150)) hit(p);
      if (points.length) world.centroid = round3(mean(points));
      if (points.length) world.bounds = bounds(points).map(round3);
    } else if (kind === "point") {
      const h = hit(all[0]);
      const g = h?.point ?? ground(all[0]);
      if (g) world.at = round3(g);
    } else {
      for (const s of mark.strokes) for (const p of resample(s, 8, 80)) hit(p);
      const s0 = mark.strokes[0];
      const a = ray(s0[0])?.point ?? ground(s0[0]);
      const b = ray(s0[s0.length - 1])?.point ?? ground(s0[s0.length - 1]);
      if (a) world.from = round3(a);
      if (b) world.to = round3(b);
      if (a && b) world.length = [+Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z).toFixed(4)];
    }
    const hits = [...counts.entries()].sort((p, q) => q[1] - p[1]).filter(([, c], i) => i < 12 && (c >= 2 || samples <= 3 || i === 0)).map(([id, c]) => ({ ...this.host.describe(id) ?? { id, type: "?" }, share: +(c / Math.max(1, samples)).toFixed(3) }));
    return { kind, hits, world, summary: summarize(kind, hits) };
  }
  // ── Drawing ──
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.host.viewport.clientWidth, h = this.host.viewport.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.redraw();
  }
  redraw() {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    drawMarks(ctx, this.marks);
    this.chips.innerHTML = "";
    for (const m of this.marks) {
      if (!m.resolved) continue;
      const [x, y] = badgeAt(m);
      const chip = document.createElement("div");
      chip.textContent = (m.note ? `${m.note} \u2014 ` : "") + m.resolved.summary;
      chip.style.cssText = `position:absolute;left:${x + 16}px;top:${y + 14}px;font:11px system-ui,sans-serif;color:#222;background:rgba(255,255,255,.9);border:1px solid #ddd;border-radius:4px;padding:2px 6px;max-width:320px;`;
      this.chips.appendChild(chip);
    }
  }
  setStatus(s) {
    this.status.textContent = s;
    this.status.title = s;
  }
  // ── Capture ──
  async save() {
    this.setStatus("Saving\u2026");
    try {
      const b = await this.capture({ note: this.noteBox.value.trim() });
      this.setStatus(b.dir ? `Saved \u2192 ${b.dir}` : "Downloaded (no dev-server plugin)");
    } catch (e) {
      this.setStatus(`Save failed: ${e}`);
    }
  }
  /** Build the bundle for the current view and marks; save it unless `save: false`. */
  async capture(opts = {}) {
    const wasActive = this.active;
    if (!wasActive) this.host.setTracking(true);
    try {
      const cleanPng = this.host.snapshotPng();
      const note = opts.note ?? "";
      const viewPng = await this.composite(cleanPng, note);
      const vp = this.host.viewport;
      const markup2 = {
        format: "tekto-markup/1",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        sketch: { title: this.host.title, url: location.href },
        instruction: note,
        viewport: { width: vp.clientWidth, height: vp.clientHeight, dpr: window.devicePixelRatio || 1 },
        ...this.host.context(),
        marks: this.marks.map((m) => ({
          n: m.n,
          note: m.note,
          kind: m.resolved?.kind,
          summary: m.resolved?.summary,
          hits: m.resolved?.hits ?? [],
          world: m.resolved?.world ?? {},
          screen: {
            bbox: bbox2(m.strokes.flat()),
            strokes: m.strokes.map((s) => simplify(s, 24).map((p) => [Math.round(p[0]), Math.round(p[1])]))
          }
        })),
        files: { view: "view.png", clean: "clean.png" }
      };
      const bundle = { markup: markup2, viewPng, cleanPng };
      if (opts.save !== false) bundle.dir = await saveBundle(bundle, opts.label ?? slug(this.host.title));
      return bundle;
    } finally {
      if (!wasActive) this.host.setTracking(false);
    }
  }
  /** The 3D view with the marks and a legend burnt in, at device resolution. */
  async composite(cleanPng, note) {
    const img = new Image();
    img.src = cleanPng;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const s = img.width / Math.max(1, this.host.viewport.clientWidth);
    g.setTransform(s, 0, 0, s, 0, 0);
    drawMarks(g, this.marks);
    const lines = [
      ...note ? [note] : [],
      ...this.marks.filter((m) => m.note).map((m) => `${m.n}  ${m.note}`)
    ];
    if (lines.length) {
      g.font = "13px system-ui,sans-serif";
      const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 20;
      const h = lines.length * 18 + 12;
      const y0 = img.height / s - h - 10;
      g.fillStyle = "rgba(255,255,255,.92)";
      g.fillRect(10, y0, w, h);
      g.fillStyle = "#111";
      lines.forEach((l, i) => g.fillText(l, 20, y0 + 20 + i * 18));
    }
    return c.toDataURL("image/png");
  }
};
function drawMarks(g, marks) {
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const m of marks) {
    for (const [w, col] of [[8, "rgba(255,255,255,.9)"], [3.5, INK]]) {
      g.strokeStyle = col;
      g.lineWidth = w;
      for (const s of m.strokes) {
        if (s.length === 1) {
          g.beginPath();
          g.arc(s[0][0], s[0][1], w, 0, Math.PI * 2);
          g.fillStyle = col;
          g.fill();
          continue;
        }
        g.beginPath();
        s.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        g.stroke();
      }
    }
    const [x, y] = badgeAt(m);
    g.beginPath();
    g.arc(x, y, 12, 0, Math.PI * 2);
    g.fillStyle = INK;
    g.fill();
    g.lineWidth = 2.5;
    g.strokeStyle = "#fff";
    g.stroke();
    g.fillStyle = "#fff";
    g.font = "bold 14px system-ui,sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(m.n), x, y + 0.5);
    g.textAlign = "start";
    g.textBaseline = "alphabetic";
  }
}
function badgeAt(m) {
  const p = m.strokes[0]?.[0] ?? [0, 0];
  return [Math.max(14, p[0] - 16), Math.max(14, p[1] - 16)];
}
function classify(strokes) {
  const all = strokes.flat();
  const len = strokes.reduce((a, s2) => a + pathLength(s2), 0);
  if (len < 8) return "point";
  if (strokes.length === 2 && strokes.every(isStraight) && segmentsCross(strokes[0], strokes[1])) return "cross";
  const s = strokes[0];
  const L = pathLength(s);
  const gap = dist(s[0], s[s.length - 1]);
  if (strokes.length === 1 && L > 40 && gap < 0.25 * L) return "loop";
  if (strokes.length === 1 && isStraight(s)) return "line";
  return all.length ? "stroke" : "point";
}
function isStraight(s) {
  return pathLength(s) > 0 && dist(s[0], s[s.length - 1]) / pathLength(s) > 0.9;
}
function segmentsCross(a, b) {
  const [p, q, r, s] = [a[0], a[a.length - 1], b[0], b[b.length - 1]];
  const o = (u, v, w) => Math.sign((v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]));
  return o(p, q, r) !== o(p, q, s) && o(r, s, p) !== o(r, s, q);
}
function summarize(kind, hits) {
  const verb = { point: "at", loop: "around", line: "along", cross: "crossing out", stroke: "over" }[kind];
  if (!hits.length) return `${kind} ${verb} empty space`;
  const names = /* @__PURE__ */ new Map();
  for (const h of hits) {
    const name = h.label ?? h.key ?? h.layer ?? h.tag ?? (h.color ? `${h.type} ${h.color}` : h.type);
    const key = h.src ? `${name} (${h.src})` : name;
    names.set(key, (names.get(key) ?? 0) + 1);
  }
  return `${kind} ${verb} ` + [...names].map(([k, c]) => c > 1 ? `${k} \xD7${c}` : k).join(", ");
}
function pathLength(s) {
  let L = 0;
  for (let i = 1; i < s.length; i++) L += dist(s[i - 1], s[i]);
  return L;
}
function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function resample(s, step, max) {
  const L = pathLength(s);
  if (s.length < 2 || L === 0) return s.slice(0, 1);
  const d = Math.max(step, L / max);
  const out = [s[0]];
  let carry = 0;
  for (let i = 1; i < s.length; i++) {
    const seg = dist(s[i - 1], s[i]);
    let t = d - carry;
    while (t <= seg) {
      const f = t / seg;
      out.push([s[i - 1][0] + (s[i][0] - s[i - 1][0]) * f, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * f]);
      t += d;
    }
    carry = seg - (t - d);
  }
  out.push(s[s.length - 1]);
  return out;
}
function gridInside(ring, target) {
  const [x0, y0, x1, y1] = bbox2(ring);
  const area = Math.abs(ring.reduce((a, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return a + p[0] * q[1] - q[0] * p[1];
  }, 0)) / 2;
  const step = Math.max(4, Math.sqrt(area / target));
  const out = [];
  for (let y = y0 + step / 2; y < y1; y += step) {
    for (let x = x0 + step / 2; x < x1; x += step) if (inside([x, y], ring)) out.push([x, y]);
  }
  return out;
}
function inside(p, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function simplify(s, max) {
  if (s.length <= 2) return s;
  for (let eps = 1; ; eps *= 1.5) {
    const out = rdp(s, eps);
    if (out.length <= max) return out;
  }
}
function rdp(s, eps) {
  if (s.length <= 2) return s;
  const [a, b] = [s[0], s[s.length - 1]];
  const L = dist(a, b) || 1;
  let best = -1, idx = 0;
  for (let i = 1; i < s.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - s[i][1]) - (a[0] - s[i][0]) * (b[1] - a[1])) / L;
    if (d > best) {
      best = d;
      idx = i;
    }
  }
  if (best <= eps) return [a, b];
  return [...rdp(s.slice(0, idx + 1), eps).slice(0, -1), ...rdp(s.slice(idx), eps)];
}
function bbox2(ps) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ps) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)];
}
function mean(ps) {
  const s = ps.reduce((a, p) => [a[0] + p.x, a[1] + p.y, a[2] + p.z], [0, 0, 0]);
  return { x: s[0] / ps.length, y: s[1] / ps.length, z: s[2] / ps.length };
}
function bounds(ps) {
  const lo = { x: Infinity, y: Infinity, z: Infinity }, hi = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const p of ps) {
    lo.x = Math.min(lo.x, p.x);
    lo.y = Math.min(lo.y, p.y);
    lo.z = Math.min(lo.z, p.z);
    hi.x = Math.max(hi.x, p.x);
    hi.y = Math.max(hi.y, p.y);
    hi.z = Math.max(hi.z, p.z);
  }
  return [lo, hi];
}
function round3(p) {
  return [p.x, p.y, p.z].map((v) => +v.toFixed(4));
}
function markup(renderer, scene, opts = {}) {
  const viewport = opts.host ?? renderer.canvasEl.parentElement;
  if (!viewport) throw new Error("markup: the renderer's canvas is not in the page yet (or pass opts.host)");
  if (getComputedStyle(viewport).position === "static") viewport.style.position = "relative";
  const describe = (id) => describeSceneObject(scene, id);
  const overlay = new MarkupOverlay({
    viewport,
    title: opts.title ?? "app",
    hitAt: (x, y) => renderer.hitAt(x, y),
    groundAt: (x, y) => renderer.groundAt(x, y),
    snapshotPng: () => snapshotWithOverlays(renderer, viewport),
    describe,
    context: () => ({ ...sceneSummary(scene, renderer, describe), ...opts.context?.() ?? {} }),
    setTracking: () => {
    },
    ...opts.notes ? { keep: (ns) => {
      opts.notes.keep(ns);
    } } : {},
    ...opts.author ? { author: opts.author } : {}
  });
  return { capture: (o) => overlay.capture(o), dispose: () => overlay.dispose() };
}

// src/sketch/ViewerToolbar.ts
function viewerToolbar(scene, renderer, opts = {}) {
  const t = opts.theme ?? getTheme();
  const show = opts;
  const offs = [];
  const bar = document.createElement("div");
  bar.style.cssText = "margin-left:auto; display:flex; align-items:center; gap:16px;";
  const tag = (label) => {
    const el = document.createElement("span");
    el.textContent = label;
    el.style.cssText = `color:${t.textFaint}; text-transform:uppercase; letter-spacing:1px; font-size:9px;`;
    return el;
  };
  function segmented(opts2, initial, onSel, follow) {
    const wrap = document.createElement("div");
    wrap.style.cssText = `display:flex; border:1px solid ${t.border}; border-radius:5px; overflow:hidden;`;
    const btns = [];
    const set = (val) => {
      for (const [b, v] of btns) {
        const on = v === val;
        b.style.background = on ? t.accent : "transparent";
        b.style.color = on ? t.panelBg : t.textDim;
      }
    };
    for (const [label, val, icon] of opts2) {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = "padding:3px 9px; border:0; background:transparent; font:inherit; font-size:11px; cursor:pointer;";
      if (icon) {
        b.insertAdjacentHTML("afterbegin", icon);
        b.style.cssText += "display:flex; align-items:center; gap:4px; padding-left:6px;";
      }
      b.onclick = () => {
        set(val);
        onSel(val);
      };
      wrap.appendChild(b);
      btns.push([b, val]);
    }
    set(initial);
    follow?.(set);
    return wrap;
  }
  const toggle = (label, title, initial, onSet) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.title = title;
    let on = initial;
    const paint = () => {
      b.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; font:inherit; font-size:11px; cursor:pointer; ` + (on ? `background:${t.accent}; color:${t.panelBg};` : `background:transparent; color:${t.textDim};`);
      b.setAttribute("aria-pressed", String(on));
    };
    b.onclick = () => {
      on = !on;
      paint();
      onSet(on);
    };
    paint();
    return b;
  };
  const group = (label, control) => {
    const g = document.createElement("div");
    g.style.cssText = "display:flex; align-items:center; gap:6px;";
    g.append(tag(label), control);
    return g;
  };
  if (show.light !== false) {
    const light = group("Light", segmented(
      [["Flat", "flat"], ["Studio", "studio"]],
      scene.lightingMode,
      (v) => scene.setLightingMode(v),
      (set) => offs.push(scene.on((e) => {
        if (e.type === "scene:lightingMode") set(e.mode);
      }))
    ));
    if (show.ao !== false) {
      light.appendChild(toggle(
        "AO",
        "Ambient occlusion: darker where surfaces meet (perspective views)",
        renderer.ambientOcclusion,
        (on) => renderer.setAmbientOcclusion(on)
      ));
    }
    bar.appendChild(light);
  }
  if (show.mode !== false) bar.appendChild(group("Mode", segmented(
    [["Solid", "solid"], ["Wire", "wireframe"], ["Hidden", "hiddenline"], ["Ghost", "ghost"]].map(([label, mode]) => [label, mode, viewModeIconSvg(mode, 14)]),
    scene.renderMode,
    (v) => scene.setRenderMode(v),
    (set) => offs.push(scene.on((e) => {
      if (e.type === "scene:renderMode") set(e.mode);
    }))
  )));
  if (show.camera !== false) {
    const cam = group("Cam", segmented(
      [["Persp", "perspective"], ["Ortho", "orthographic"]],
      renderer.projection,
      (v) => renderer.setProjection(v),
      (set) => offs.push(renderer.onProjection(set))
    ));
    const iso = document.createElement("button");
    iso.textContent = "Iso";
    iso.title = "Isometric: orthographic, from the diagonal";
    iso.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
    iso.onclick = () => {
      renderer.setProjection("orthographic");
      renderer.setView("iso");
    };
    cam.appendChild(iso);
    bar.appendChild(cam);
  }
  if (show.cut !== false) bar.appendChild(buildCut(renderer, t, segmented));
  if (show.sun !== false) bar.appendChild(buildSun(renderer, t));
  return { el: bar, dispose() {
    for (const off of offs) off();
    offs.length = 0;
    bar.remove();
  } };
}
function buildCut(renderer, t, segmented) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;";
  const btn = document.createElement("button");
  btn.textContent = "Cut \u25BE";
  btn.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
  const pop = document.createElement("div");
  pop.style.cssText = `position:absolute; top:130%; right:0; z-index:50; display:none; flex-direction:column; gap:8px;
    padding:12px; border:1px solid ${t.border}; border-radius:8px; background:${t.panelBg};
    box-shadow:0 8px 24px rgba(0,0,0,.45); width:228px; font-size:11px; color:${t.textDim};`;
  btn.onclick = () => {
    pop.style.display = pop.style.display === "none" ? "flex" : "none";
  };
  wrap.append(btn, pop);
  const state = { axis: "off", at: 50, flip: false };
  const apply = () => {
    renderer.setSection(state.axis === "off" ? null : { axis: state.axis, at: state.at / 100, flip: state.flip });
    btn.style.color = state.axis === "off" ? t.textDim : t.accent;
  };
  const pos = document.createElement("input");
  pos.type = "range";
  pos.min = "0";
  pos.max = "100";
  pos.step = "1";
  pos.value = "50";
  pos.className = "tekto-slider";
  pos.style.cssText = `cursor:pointer;--tekto-track:${t.controlBorder};--tekto-thumb:${t.accent};`;
  pos.oninput = () => {
    state.at = Number(pos.value);
    apply();
  };
  const flip = document.createElement("label");
  flip.style.cssText = "display:flex; align-items:center; gap:6px; cursor:pointer;";
  const flipBox = document.createElement("input");
  flipBox.type = "checkbox";
  flipBox.onchange = () => {
    state.flip = flipBox.checked;
    apply();
  };
  flip.append(flipBox, "Keep the other side");
  pop.append(
    segmented([["Off", "off"], ["Plan", "z"], ["X", "x"], ["Y", "y"]], "off", (v) => {
      state.axis = v;
      apply();
    }),
    pos,
    flip
  );
  return wrap;
}
function buildSun(renderer, t) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;";
  const btn = document.createElement("button");
  btn.innerHTML = "&#x2600;&#xFE0E; Sun &#x25BE;";
  btn.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
  wrap.appendChild(btn);
  const pop = document.createElement("div");
  pop.style.cssText = `position:absolute; top:130%; right:0; z-index:50; display:none; flex-direction:column; gap:8px;
    padding:12px; border:1px solid ${t.border}; border-radius:8px; background:${t.panelBg};
    box-shadow:0 8px 24px rgba(0,0,0,.45); width:228px;`;
  wrap.appendChild(pop);
  btn.onclick = () => {
    pop.style.display = pop.style.display === "none" ? "flex" : "none";
  };
  const state = { lat: 47.37, lon: 8.55, month: 6, day: 21, hour: 13 };
  const readout = document.createElement("div");
  readout.style.cssText = `font-size:10px; color:${t.textDim}; font-family:${t.font};`;
  const apply = () => {
    const date = new Date(Date.UTC(2025, state.month - 1, state.day, Math.floor(state.hour), Math.round(state.hour % 1 * 60)));
    const sun = SunPosition.compute({ date, latitude: state.lat, longitude: state.lon });
    renderer.setSunDirection(sun.direction);
    const deg = (r) => Math.round(r * 180 / Math.PI);
    readout.textContent = `alt ${deg(sun.altitude)}\xB0  az ${deg(sun.azimuth)}\xB0  ${sun.isDaytime ? "day" : "night"}`;
  };
  const num = (label, value, min, max, step, onCh) => {
    const r = document.createElement("label");
    r.style.cssText = `display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; color:${t.textDim};`;
    const sp = document.createElement("span");
    sp.textContent = label;
    const i = document.createElement("input");
    i.type = "number";
    i.value = String(value);
    i.min = String(min);
    i.max = String(max);
    i.step = String(step);
    i.style.cssText = `width:84px; padding:2px 5px; background:${t.fieldBg}; border:1px solid ${t.border}; border-radius:4px; color:inherit; font:inherit; font-size:11px;`;
    i.oninput = () => onCh(Number(i.value));
    r.append(sp, i);
    return r;
  };
  pop.append(
    num("Latitude", state.lat, -90, 90, 0.1, (v) => {
      state.lat = v;
      apply();
    }),
    num("Longitude", state.lon, -180, 180, 0.1, (v) => {
      state.lon = v;
      apply();
    }),
    num("Month", state.month, 1, 12, 1, (v) => {
      state.month = v;
      apply();
    }),
    num("Day", state.day, 1, 31, 1, (v) => {
      state.day = v;
      apply();
    })
  );
  const hourWrap = document.createElement("label");
  hourWrap.style.cssText = `display:flex; flex-direction:column; gap:4px; font-size:11px; color:${t.textDim};`;
  const hourLabel = document.createElement("span");
  hourLabel.textContent = "Hour 13:00";
  const hour = document.createElement("input");
  hour.type = "range";
  hour.min = "0";
  hour.max = "24";
  hour.step = "0.25";
  hour.value = "13";
  hour.className = "tekto-slider";
  hour.style.cssText = `cursor:pointer;--tekto-track:${t.controlBorder};--tekto-thumb:${t.accent};`;
  hour.oninput = () => {
    state.hour = Number(hour.value);
    const h = Math.floor(state.hour), m = Math.round(state.hour % 1 * 60);
    hourLabel.textContent = `Hour ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    apply();
  };
  hourWrap.append(hourLabel, hour);
  const follow = document.createElement("label");
  follow.style.cssText = `display:flex; align-items:center; gap:6px; font-size:11px; color:${t.textDim}; cursor:pointer;`;
  const followBox = document.createElement("input");
  followBox.type = "checkbox";
  followBox.checked = renderer.daylight;
  followBox.onchange = () => renderer.setDaylight(followBox.checked);
  follow.append(followBox, "Light follows the sun (Studio)");
  pop.append(hourWrap, readout, follow);
  apply();
  return wrap;
}

export {
  VIEW_MODE_ICON_CORNERS,
  viewModeIconShapes,
  VIEW_MODE_ICON_SVG,
  viewModeIconSvg,
  MarkupOverlay,
  markup,
  viewerToolbar
};
