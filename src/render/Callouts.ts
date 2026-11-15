/**
 * Labels that point at elements, laid out the way a drawing does.
 *
 * The distinction that decides everything here: a tag in a modelling tool
 * names what you drew and floats where the thing is. A callout on a drawing
 * sits in the margin, in a column, with a leader to the thing it is about. The
 * second reads at a glance and stays readable while you turn the model,
 * because the labels never overlap and never swim; the first turns into a
 * heap the moment two elements line up behind each other, which on a building
 * is most of the time.
 *
 * So this is not "billboard some text at a world position". It is: project the
 * anchors, drop the ones you cannot see, stack what is left into the two
 * margins in the order their anchors run down the screen, and draw a leader
 * from each label to its anchor.
 *
 * The layout is a pure function of screen positions (`layoutLabels`), so the
 * rule that two labels never overlap is checked without a browser.
 */
import * as THREE from "three";

const SVG = "http://www.w3.org/2000/svg";

/** What the host wants said about one thing in the scene. */
export interface CalloutItem {
  id: string;
  /** the line that is read. Keep it short: this is a margin, not a panel. */
  text: string;
  /** a quieter second line, for a grade or a count */
  detail?: string;
  /** a swatch, so a callout and the element it points at agree by colour */
  colour?: string;
  /** What it points at: scene object ids, or record keys (`"walls/w1"`, which follow their
   *  record through rebuilds). The anchor is the centre of their combined bounds. */
  objects: readonly string[];
  /**
   * One leader to the centre of everything in `objects` (the default), or one to each entry
   * of it: an object id, or a record key and everything drawn for it. "each" is for a label
   * that names what many things share, a product or a material: the margin holds one label
   * per thing rather than one per element, and every element still has its line. Only the
   * entries the reader can see get one.
   */
  leaders?: "one" | "each";
  /** The margin this label keeps to, rather than the one nearer its anchor: a column of
   *  products down the left reads as a key. */
  side?: "left" | "right";
  /** The leader's shape: an elbow (the default), a level run and then a straight line, as a
   *  drawing does; or a curve that leaves the label level and arrives level, as a diagram's
   *  edges do, which stays readable where many leaders leave one label. */
  leaderShape?: "elbow" | "curve";
}

/**
 * How a set of callouts is laid out, and who hears about clicks and hovers on the labels.
 *
 * `stack: "anchors"` (the default) sets each label level with what it points at, pushed
 * clear of its neighbours: the labels move with the model. `stack: "list"` stacks them from
 * the top of their margin in the order given, on a column of their own headed by `title`,
 * like a key: they stay put while the model turns and only the leaders move, and a label
 * whose things are all hidden behind others stays in the list, without a leader.
 */
export interface CalloutOptions {
  onPick?: (id: string) => void;
  onHover?: (id: string | null) => void;
  stack?: "anchors" | "list";
  /** the list's heading, with `stack: "list"` */
  title?: string;
  /**
   * `false`: draw no labels, and report instead where each callout's leaders would end
   * (`onEnds`), for an app that lists the labels itself, outside the view, and draws its own
   * leaders into it. The visibility rule is the same: only the things the reader can see.
   */
  labels?: boolean;
  /** Each callout's leader ends, in pixels within the view, after every frame drawn: only the
   *  entries seen, none for a callout with nothing in sight. With `labels: false`. */
  onEnds?: (ends: { id: string; ends: { x: number; y: number }[] }[]) => void;
}

/** The height a list's title takes at the top of its column, in CSS pixels. */
export const LIST_TITLE_HEIGHT = 24;

/** One label, placed. Pixel coordinates within the host. */
export interface Placement {
  id: string;
  side: "left" | "right";
  /** where the label's own box sits */
  x: number; y: number;
  /** where its leader ends: for a label with several leaders, the middle of their ends */
  anchorX: number; anchorY: number;
  /** each leader's end, for a label with `leaders: "each"` */
  ends?: { x: number; y: number }[];
}

/** What each of a callout's leaders points at: all of `objects` together, or each entry. */
export function calloutGroups(item: Pick<CalloutItem, "objects" | "leaders">): (readonly string[])[] {
  return item.leaders === "each" ? item.objects.map((o) => [o]) : [item.objects];
}

/**
 * A placed label's leader, as SVG path data. An elbow: out of the label's side, a short level
 * run to a knee, then a straight line to each point it goes to, so it reads as a leader on a
 * drawing instead of as a line someone forgot to delete, and one knee for all of a label's
 * leaders, so they read as one label's. Or a curve to each point, level where it leaves the
 * label and level where it arrives.
 */
export function leaderPath(p: Placement, labelWidth: number, shape: "elbow" | "curve" = "elbow"): string {
  const from = p.side === "left" ? p.x + labelWidth : p.x;
  const knee = p.side === "left" ? from + 10 : from - 10;
  const mid = p.y + 9;
  const ends = p.ends ?? [{ x: p.anchorX, y: p.anchorY }];
  // a listed label whose things are all out of sight points at nothing
  if (!ends.length) return "";
  if (shape === "curve") {
    return ends.map((e) => {
      const c = (from + e.x) / 2;
      return `M${from},${mid} C${c},${mid} ${c},${e.y} ${e.x},${e.y}`;
    }).join(" ");
  }
  const run = `M${from},${mid} L${knee},${mid}`;
  return ends.length === 1 ? `${run} L${ends[0].x},${ends[0].y}`
    : run + ends.map((e) => ` M${knee},${mid} L${e.x},${e.y}`).join("");
}

/**
 * How wide a label may be in a host of this width.
 *
 * Fixed at 150 px this was fine in a full-window viewport and useless in a
 * panel: two 150 px margins in a 374 px column leave 74 px of drawing, so the
 * annotation covered the thing it annotated. A share of the width instead,
 * floored at something a product code still fits in and capped so a wide
 * viewport does not grow billboards.
 */
export function labelWidthFor(hostWidth: number): number {
  return Math.round(Math.max(88, Math.min(170, hostWidth * 0.27)));
}

/** Options for `layoutLabels`: the host size in pixels, and optionally the row pitch, label width and edge inset. */
export interface LayoutOptions {
  width: number; height: number;
  /** vertical pitch between labels, which is a label's height plus its gap */
  rowHeight?: number;
  /** how wide a label is allowed to be */
  labelWidth?: number;
  /** clearance from the host's edges */
  inset?: number;
  /** level with the anchors (the default), or listed from the top in the order given */
  stack?: "anchors" | "list";
  /** room kept at the top of each margin, for a list's title */
  top?: number;
}

/** What a layout could place, and what it could not. */
export interface Layout {
  placed: Placement[];
  /**
   * Ids there was no room for, in the order they were given.
   *
   * Reported rather than clipped. A margin holds a fixed number of rows, and
   * the first version of this let the surplus run off the bottom edge into an
   * `overflow: hidden`, so eleven of thirty labels simply were not there and
   * nothing said so. A reader counting labelled elements would have counted
   * wrong. The caller is expected to say how many are missing.
   */
  dropped: string[];
}

/** How many labels one margin holds at a given height, as `layoutLabels` counts. */
export function marginCapacity(height: number, opts: { rowHeight?: number; inset?: number } = {}): number {
  return Math.max(0, Math.floor((height - 2 * (opts.inset ?? 8)) / (opts.rowHeight ?? 30)));
}

/** Whether a label built for `was` no longer says what `now` says (or `now` is gone). */
export function calloutChanged(was: CalloutItem | undefined, now: CalloutItem | undefined): boolean {
  return !was || !now || was.text !== now.text || was.detail !== now.detail || was.colour !== now.colour;
}

/**
 * Stack labels into the left and right margins without overlapping.
 *
 * Each label wants to sit level with its own anchor and is pushed down until
 * it clears the one above; if that runs the column off the bottom, the whole
 * column is lifted back inside. Labels keep the vertical order of their
 * anchors, which is what makes the leaders readable: leaders that cross each
 * other are worse than no leaders, because the reader follows the wrong one
 * and believes the answer.
 *
 * Anchors on the left half of the screen get the left margin. Not because the
 * side matters, but because a leader that crosses the whole drawing to reach
 * the far margin passes over everything in between. An anchor that names its
 * `side` keeps to it.
 *
 * More labels than rows is resolved by *input order*, which is the caller's
 * priority, and never by compressing the pitch: labels printed on top of each
 * other are not more information, they are less.
 */
export function layoutLabels(
  anchors: { id: string; x: number; y: number; side?: "left" | "right"; ends?: { x: number; y: number }[] }[],
  opts: LayoutOptions,
): Layout {
  const rowHeight = opts.rowHeight ?? 30;
  const labelWidth = opts.labelWidth ?? labelWidthFor(opts.width);
  const inset = opts.inset ?? 8;
  const top = opts.top ?? 0;
  const listed = opts.stack === "list";
  const capacity = marginCapacity(opts.height - top, { rowHeight, inset });
  const placed: Placement[] = [];
  const dropped: string[] = [];

  for (const side of ["left", "right"] as const) {
    const mine = anchors.filter((a) => (a.side ?? (a.x < opts.width / 2 ? "left" : "right")) === side);
    // the caller's order decides who keeps a place; anchor order decides where,
    // except in a list, where the caller's order is the order
    const keep = listed ? mine.slice(0, capacity) : mine.slice(0, capacity).sort((a, b) => a.y - b.y);
    for (const a of mine.slice(capacity)) dropped.push(a.id);
    if (!keep.length) continue;

    const ys: number[] = [];
    if (listed) {
      keep.forEach((_, i) => ys.push(top + inset + i * rowHeight));
    } else {
      // greedy downward pass: take the wanted position, or just below the last
      let previous = -Infinity;
      for (const a of keep) {
        const y = Math.max(a.y, previous + rowHeight, top + inset);
        ys.push(y);
        previous = y;
      }
      // if that ran off the bottom, lift the column by exactly the overshoot and
      // let the top of it be clamped in turn. Within capacity this always fits.
      const overshoot = ys[ys.length - 1] + rowHeight - (opts.height - inset);
      if (overshoot > 0) {
        let floor = top + inset;
        for (let i = 0; i < ys.length; i++) {
          ys[i] = Math.max(ys[i] - overshoot, floor);
          floor = ys[i] + rowHeight;
        }
      }
    }
    keep.forEach((a, i) => placed.push({
      id: a.id, side,
      x: side === "left" ? inset : opts.width - inset - labelWidth,
      y: ys[i],
      anchorX: a.x, anchorY: a.y,
      ...(a.ends ? { ends: a.ends } : {}),
    }));
  }
  return { placed, dropped };
}

/**
 * The DOM layer: labels, leaders, and clicks.
 *
 * Knows nothing about cameras or meshes. It is handed placements in pixels and
 * renders them, which is what keeps the layout rule above testable.
 */
export class Callouts {
  private root: HTMLDivElement;
  private svg: SVGSVGElement;
  private labels = new Map<string, { box: HTMLButtonElement; leader: SVGPathElement }>();
  private items = new Map<string, CalloutItem>();
  private overflow: HTMLDivElement | null = null;
  private labelWidth: number;
  /** A list's column, per margin, and its title (`setList`). */
  private columns = new Map<"left" | "right", HTMLDivElement>();
  private list: { on: boolean; title?: string } = { on: false };
  /** Labels shown as the ones meant, and in what colour (`setHighlight`). */
  private highlighted = new Set<string>();
  private highlightColour = "#1f7ae0";

  constructor(host: HTMLElement, private opts: {
    labelWidth?: number;
    onPick?: (id: string) => void;
    onHover?: (id: string | null) => void;
  } = {}) {
    this.labelWidth = opts.labelWidth ?? 150;
    this.root = document.createElement("div");
    // the layer ignores the pointer; the labels themselves take it back, so a
    // drag anywhere between them still orbits the model underneath
    this.root.style.cssText =
      "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4";
    this.svg = document.createElementNS(SVG, "svg") as SVGSVGElement;
    this.svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible";
    this.root.append(this.svg);
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.append(this.root);
  }

  /** What there is to say. Placements arrive separately, each frame. */
  setItems(items: CalloutItem[]) {
    const next = new Map(items.map((i) => [i.id, i]));
    for (const [id, el] of this.labels) {
      // Gone, or now saying something else: a label is built once, so one whose item
      // changed would go on showing the old words. Dropped here, it is rebuilt when next
      // placed.
      if (calloutChanged(this.items.get(id), next.get(id))) {
        el.box.remove(); el.leader.remove(); this.labels.delete(id);
      }
    }
    this.items = next;
  }

  /** Lay the labels out as a list, on a column of their own under `title`, or not. */
  setList(on: boolean, title?: string) {
    this.list = { on, title };
    if (!on) { for (const c of this.columns.values()) c.remove(); this.columns.clear(); }
  }

  /** The column behind a margin's list: full height, as wide as a label and its clearance. */
  private column(side: "left" | "right", shown: boolean) {
    let c = this.columns.get(side);
    if (!shown) { if (c) c.style.display = "none"; return; }
    if (!c) {
      c = document.createElement("div");
      c.style.cssText = `position:absolute;top:0;bottom:0;${side}:0;pointer-events:none;
        box-sizing:border-box;background:rgba(248,250,252,.92);
        border-${side === "left" ? "right" : "left"}:1px solid rgba(90,100,110,.18);
        font:600 9.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        letter-spacing:.08em;text-transform:uppercase;color:#8a949e;padding:9px 8px 0`;
      // under the leaders, so they leave it visibly
      this.root.insertBefore(c, this.svg);
      this.columns.set(side, c);
    }
    c.style.display = "block";
    c.style.width = `${this.labelWidth + 16}px`;
    c.textContent = this.list.title ?? "";
  }

  /**
   * Show these labels, and their leaders, as the ones meant: what the pointer is over in the
   * model, say, so a reader sees which label names it; null clears. Only the look changes.
   */
  setHighlight(ids: Iterable<string> | null, colour?: string) {
    this.highlighted = new Set(ids ?? []);
    if (colour) this.highlightColour = colour;
    for (const [id, el] of this.labels) this.paint(id, el);
  }

  private paint(id: string, el: { box: HTMLButtonElement; leader: SVGPathElement }) {
    const on = this.highlighted.has(id);
    el.leader.setAttribute("stroke", on ? this.highlightColour : "#8a949e");
    el.leader.setAttribute("stroke-width", on ? "1.75" : "1");
    el.box.style.boxShadow = on ? `0 0 0 2px ${this.highlightColour}` : "0 1px 2px rgba(20,30,40,.12)";
    // drawn last, so a lit leader is not crossed out by the others
    if (on) this.svg.append(el.leader);
  }

  /** Track the host's width, so labels stay a share of it rather than a
   *  constant that only suits one panel size. */
  setLabelWidth(px: number) {
    if (px === this.labelWidth) return;
    this.labelWidth = px;
    for (const { box } of this.labels.values()) box.style.width = `${px}px`;
  }

  /** The objects a caller must measure to anchor each callout. */
  objectsOf(id: string): readonly string[] { return this.items.get(id)?.objects ?? []; }

  /** What each of a callout's leaders points at (`calloutGroups`). */
  groupsOf(id: string): (readonly string[])[] {
    const item = this.items.get(id);
    return item ? calloutGroups(item) : [];
  }

  /** The margin a callout keeps to, if it names one. */
  sideOf(id: string): "left" | "right" | undefined { return this.items.get(id)?.side; }

  /** Whether a callout has a leader to each of its entries. */
  fans(id: string): boolean { return this.items.get(id)?.leaders === "each"; }

  get ids(): string[] { return [...this.items.keys()]; }

  /**
   * Draw this frame's placements. Anything not placed is hidden, not removed:
   * an element that comes back into view keeps its element rather than
   * flickering a new one in.
   *
   * `unplaced` is how many the margins had no room for, and it is shown. A
   * reader who can see fifteen labels and is not told there were twenty-two
   * has been given a wrong count, quietly, which is the failure this whole
   * project is arranged against. `upTo`: some of them were never looked at
   * (the margins were full), so it is how many there could be: "up to n".
   */
  update(placements: Placement[], unplaced = 0, upTo = false) {
    const placed = new Set(placements.map((p) => p.id));
    for (const [id, el] of this.labels) {
      // display, not the hidden attribute: the box's own display:block would override that,
      // and a label whose element went out of sight stayed on screen without its leader.
      if (!placed.has(id)) { el.box.style.display = "none"; el.leader.setAttribute("d", ""); }
    }
    if (this.list.on) {
      for (const side of ["left", "right"] as const) this.column(side, placements.some((p) => p.side === side));
    }
    for (const p of placements) {
      const item = this.items.get(p.id);
      if (!item) continue;
      const el = this.labels.get(p.id) ?? this.make(p.id, item);
      el.box.style.display = "block";
      el.box.style.left = `${p.x}px`;
      el.box.style.top = `${p.y}px`;
      el.leader.setAttribute("d", leaderPath(p, this.labelWidth, item.leaderShape));
    }
    this.showOverflow(unplaced, upTo);
  }

  private showOverflow(n: number, upTo = false) {
    if (!n) { this.overflow?.remove(); this.overflow = null; return; }
    if (!this.overflow) {
      this.overflow = document.createElement("div");
      this.overflow.style.cssText = `position:absolute;left:50%;bottom:6px;transform:translateX(-50%);
        pointer-events:none;padding:2px 7px;border-radius:3px;
        background:rgba(255,255,255,.9);border:1px solid rgba(90,100,110,.25);
        font:500 10px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#79838d`;
      this.root.append(this.overflow);
    }
    this.overflow.textContent = `${upTo ? "up to " : ""}${n} more not labelled: no room in the margins`;
  }

  private make(id: string, item: CalloutItem) {
    const leader = document.createElementNS(SVG, "path") as SVGPathElement;
    leader.setAttribute("fill", "none");
    leader.setAttribute("stroke", "#8a949e");
    leader.setAttribute("stroke-width", "1");
    this.svg.append(leader);

    const box = document.createElement("button");
    box.type = "button";
    // The colour is a stripe down the leading edge rather than a dot in the
    // text. A dot cost eleven pixels of a hundred, which in a side panel is
    // the difference between "Aussenwand D1190" and "Aussenwand ...", and it
    // said nothing the leader was not already saying by pointing at a
    // coloured element. A stripe is also what a drawing does.
    const stripe = item.colour ?? "#8a949e";
    box.style.cssText = `position:absolute;pointer-events:auto;width:${this.labelWidth}px;
      box-sizing:border-box;text-align:left;padding:2px 4px 2px 5px;border-radius:2px;
      cursor:pointer;border:1px solid rgba(90,100,110,.28);border-left:3px solid ${stripe};
      background:rgba(255,255,255,.94);
      font:500 10.5px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color:#2b3540;box-shadow:0 1px 2px rgba(20,30,40,.12);display:block;
      overflow:hidden;white-space:nowrap`;
    const text = document.createElement("span");
    text.textContent = item.text;
    text.style.cssText = "display:block;overflow:hidden;text-overflow:ellipsis";
    box.append(text);
    if (item.detail) {
      const d = document.createElement("span");
      d.textContent = item.detail;
      d.style.cssText = `display:block;color:#79838d;font-weight:400;font-size:9.5px;
        overflow:hidden;text-overflow:ellipsis`;
      box.append(d);
    }
    box.title = item.detail ? `${item.text} (${item.detail})` : item.text;
    box.addEventListener("click", (e) => { e.stopPropagation(); this.opts.onPick?.(id); });
    box.addEventListener("pointerenter", () => this.opts.onHover?.(id));
    box.addEventListener("pointerleave", () => this.opts.onHover?.(null));
    box.addEventListener("pointerdown", (e) => e.stopPropagation());
    this.root.append(box);
    const el = { box, leader };
    this.labels.set(id, el);
    this.paint(id, el);
    return el;
  }

  setVisible(on: boolean) { this.root.style.display = on ? "" : "none"; }

  dispose() { this.root.remove(); }
}
