/**
 * Notes that live with the model. A sketched note is its strokes in world space, its text,
 * who wrote it and when, the records it is about and the view it was drawn from. It is kept
 * as a plain record in a `Doc` collection, so it is saved and opened with the document,
 * undone like any edit, and shared with everyone working on it.
 *
 * A `NotesLayer` draws the notes over the view from any camera: their strokes, and a numbered
 * pin each. A pin opens the note, with "Go to view" (the camera it was drawn from) and
 * "Delete". Markup's "Keep as notes" turns marks into notes (`markup(…, { notes })`,
 * `appShell({ notes: doc })`).
 *
 *   const notes = notesLayer(renderer, doc);              // the doc's "notes" collection
 *   markup(renderer, scene, { notes, author: "BD" });
 */
import { Vec3 } from "../core/math/vectors";
import type { Doc } from "../collab/Doc";

/** A note kept with the model. Plain JSON, so it lives in a `Doc` collection. */
export interface Note {
  /** What it says. */
  text: string;
  /** Who wrote it. */
  author?: string;
  /** When, as an ISO date. */
  createdAt: string;
  /** Where its number sits, in world coordinates. */
  pin: [number, number, number];
  /** The strokes as drawn, laid on the model (or the ground), in world coordinates. */
  strokes: [number, number, number][][];
  /** The records it is about (`"blocks/k3f9x2"`), from what the strokes touched. */
  keys: string[];
  /** The view it was drawn from, for "Go to view". */
  view: { position: number[]; target: number[]; projection?: "perspective" | "orthographic" };
}

/** What a `NotesLayer` needs from a renderer: structurally a `ThreeRenderer`. */
export interface NotesRenderer {
  readonly canvasEl: HTMLCanvasElement;
  worldToScreen(world: Vec3): { x: number; y: number; visible: boolean };
  onDraw(cb: () => void): () => void;
  requestRender(): void;
  setProjection(projection: "perspective" | "orthographic"): void;
  setCameraPosition(x: number, y: number, z: number): void;
  lookAt(x: number, y: number, z: number): void;
}

const INK = "#ffb020";                    // amber: a note, not geometry, and not Markup's magenta

/** The notes of one `Doc` collection, drawn over a renderer's view. */
export class NotesLayer {
  readonly collection: string;
  private host: HTMLElement;
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private pinLayer = document.createElement("div");
  private pins = new Map<string, HTMLButtonElement>();
  private card: HTMLDivElement | null = null;
  private openId: string | null = null;
  private shown = true;
  private offs: (() => void)[] = [];

  constructor(private renderer: NotesRenderer, private doc: Doc<any>, opts: { collection?: string; host?: HTMLElement } = {}) {
    this.collection = opts.collection ?? "notes";
    const host = opts.host ?? renderer.canvasEl.parentElement;
    if (!host) throw new Error("notesLayer: the renderer's canvas is not in the page yet (or pass opts.host)");
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    this.host = host;
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:15;";
    this.canvas.dataset.tektoNotes = "";
    this.canvas.dataset.tektoOverlay = "";                          // model content: in snapshots too
    this.ctx = this.canvas.getContext("2d")!;
    this.pinLayer.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:16;";
    host.append(this.canvas, this.pinLayer);
    this.offs.push(renderer.onDraw(() => this.draw()));
    this.offs.push(doc.onChange((changes) => {
      if (!changes.some((c) => c.collection === this.collection)) return;
      if (this.openId && !doc.has(this.collection, this.openId)) this.closeCard();
      renderer.requestRender();
    }));
    renderer.requestRender();
  }

  /** The notes, oldest first, with their ids: the order of their numbers. */
  list(): [string, Note][] {
    return (this.doc.all(this.collection) as [string, Note][])
      .slice().sort((a, b) => a[1].createdAt.localeCompare(b[1].createdAt));
  }

  /** Keep a note: one undo step. Returns its id. */
  add(note: Note): string {
    return this.doc.add(this.collection, note, { label: "Add note" });
  }

  /** Keep several notes as one undo step ("Keep as notes"). Returns their ids. */
  keep(notes: readonly Note[]): string[] {
    return this.doc.transact(notes.length > 1 ? "Add notes" : "Add note", () => notes.map((n) => this.doc.add(this.collection, n)));
  }

  remove(id: string): void { this.doc.remove(this.collection, id, { label: "Delete note" }); }

  /** Back to the view the note was drawn from. */
  goTo(id: string): void {
    const n = this.doc.get(this.collection, id) as Note | undefined;
    if (!n) return;
    if (n.view.projection) this.renderer.setProjection(n.view.projection);
    this.renderer.setCameraPosition(n.view.position[0], n.view.position[1], n.view.position[2]);
    this.renderer.lookAt(n.view.target[0], n.view.target[1], n.view.target[2]);
  }

  /** Show or hide the notes (they stay in the document). */
  setVisible(on: boolean): void {
    this.shown = on;
    if (!on) this.closeCard();
    this.renderer.requestRender();
  }

  get visible(): boolean { return this.shown; }

  dispose(): void {
    for (const off of this.offs) off();
    this.closeCard();
    this.canvas.remove();
    this.pinLayer.remove();
  }

  // ── Drawing, after each frame ──

  private draw(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    const g = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const notes = this.shown ? this.list() : [];
    const seen = new Set<string>();
    // worldToScreen is relative to the renderer's canvas; the layer covers its host.
    const c = this.renderer.canvasEl.getBoundingClientRect(), hb = this.host.getBoundingClientRect();
    const ox = c.left - hb.left, oy = c.top - hb.top;
    const at = (p: number[]) => { const q = this.renderer.worldToScreen(new Vec3(p[0], p[1], p[2])); return { x: q.x + ox, y: q.y + oy, visible: q.visible }; };
    if (notes.length) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.lineCap = "round"; g.lineJoin = "round";
      const project = at;
      for (const [width, colour] of [[6, "rgba(10,12,18,.55)"], [2.5, INK]] as const) {
        g.strokeStyle = colour; g.fillStyle = colour; g.lineWidth = width;
        for (const [, n] of notes) for (const s of n.strokes) {
          if (s.length === 1) {
            const q = project(s[0]);
            if (q.visible) { g.beginPath(); g.arc(q.x, q.y, width, 0, Math.PI * 2); g.fill(); }
            continue;
          }
          g.beginPath();
          let down = false;
          for (const p of s) {
            const q = project(p);
            if (!q.visible) { down = false; continue; }            // behind the camera: break the line
            if (down) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y);
            down = true;
          }
          g.stroke();
        }
      }
    }
    notes.forEach(([id, n], i) => {
      seen.add(id);
      const q = at(n.pin);
      const pin = this.pins.get(id) ?? this.makePin(id);
      pin.textContent = String(i + 1);
      pin.title = n.text || "(no text)";
      pin.style.display = q.visible ? "flex" : "none";
      pin.style.left = `${q.x - 11}px`;
      pin.style.top = `${q.y - 11}px`;
      if (this.openId === id && this.card) this.placeCard(q.x, q.y);
    });
    for (const [id, pin] of this.pins) if (!seen.has(id)) { pin.remove(); this.pins.delete(id); }
  }

  private makePin(id: string): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.note = id;
    b.setAttribute("aria-label", "Note");
    b.style.cssText = `position:absolute;width:22px;height:22px;border-radius:50%;border:2px solid #fff;background:${INK};`
      + "color:#14161e;font:700 11px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;"
      + "padding:0;cursor:pointer;pointer-events:auto;box-shadow:0 1px 4px rgba(0,0,0,.45);";
    b.addEventListener("click", (e) => { e.stopPropagation(); this.openId === id ? this.closeCard() : this.openCard(id); });
    this.pinLayer.appendChild(b);
    this.pins.set(id, b);
    return b;
  }

  // ── The open note ──

  private openCard(id: string): void {
    this.closeCard();
    const n = this.doc.get(this.collection, id) as Note | undefined;
    if (!n) return;
    this.openId = id;
    const card = this.card = document.createElement("div");
    card.dataset.noteCard = id;
    card.style.cssText = "position:absolute;z-index:17;width:230px;padding:10px 12px;border-radius:8px;pointer-events:auto;"
      + "background:#11131a;border:1px solid rgba(255,255,255,.12);box-shadow:0 6px 18px rgba(0,0,0,.45);"
      + "color:#e8ebf0;font:12px/1.45 system-ui,sans-serif;";
    const text = document.createElement("div");
    text.textContent = n.text || "(no text)";
    text.style.cssText = "white-space:pre-wrap;margin-bottom:6px;";
    const meta = document.createElement("div");
    const when = new Date(n.createdAt);
    meta.textContent = [n.author, isNaN(when.getTime()) ? "" : when.toLocaleString(), n.keys.length ? n.keys.join(", ") : ""]
      .filter(Boolean).join(" · ");
    meta.style.cssText = "color:rgba(232,235,240,.55);font-size:10.5px;margin-bottom:8px;";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:6px;";
    const btn = (label: string, run: () => void) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.cssText = "font:11px system-ui,sans-serif;padding:3px 9px;border-radius:5px;cursor:pointer;"
        + "border:1px solid rgba(255,255,255,.18);background:transparent;color:#e8ebf0;";
      b.addEventListener("click", (e) => { e.stopPropagation(); run(); });
      return b;
    };
    row.append(btn("Go to view", () => this.goTo(id)), btn("Delete", () => this.remove(id)), btn("Close", () => this.closeCard()));
    card.append(text, meta, row);
    this.pinLayer.appendChild(card);
    this.renderer.requestRender();                                   // placed on the next draw
  }

  private placeCard(x: number, y: number): void {
    const card = this.card!;
    const w = this.host.clientWidth;
    card.style.left = `${Math.min(Math.max(8, x + 16), w - 246)}px`;
    card.style.top = `${Math.max(8, y - 12)}px`;
  }

  private closeCard(): void {
    this.card?.remove();
    this.card = null;
    this.openId = null;
  }
}

/** Draw the notes of `doc`'s collection (default `"notes"`) over a renderer's view. */
export function notesLayer(renderer: NotesRenderer, doc: Doc<any>, opts: { collection?: string; host?: HTMLElement } = {}): NotesLayer {
  return new NotesLayer(renderer, doc, opts);
}
