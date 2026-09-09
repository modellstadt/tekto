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
  /** what it points at. The anchor is the centre of their combined bounds. */
  objects: THREE.Object3D[];
}

/** One label, placed. Pixel coordinates within the host. */
export interface Placement {
  id: string;
  side: "left" | "right";
  /** where the label's own box sits */
  x: number; y: number;
  /** where its leader ends */
  anchorX: number; anchorY: number;
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

export interface LayoutOptions {
  width: number; height: number;
  /** vertical pitch between labels, which is a label's height plus its gap */
  rowHeight?: number;
  /** how wide a label is allowed to be */
  labelWidth?: number;
  /** clearance from the host's edges */
  inset?: number;
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
 * the far margin passes over everything in between.
 *
 * More labels than rows is resolved by *input order*, which is the caller's
 * priority, and never by compressing the pitch: labels printed on top of each
 * other are not more information, they are less.
 */
export function layoutLabels(
  anchors: { id: string; x: number; y: number }[],
  opts: LayoutOptions,
): Layout {
  const rowHeight = opts.rowHeight ?? 30;
  const labelWidth = opts.labelWidth ?? labelWidthFor(opts.width);
  const inset = opts.inset ?? 8;
  const capacity = Math.max(0, Math.floor((opts.height - 2 * inset) / rowHeight));
  const placed: Placement[] = [];
  const dropped: string[] = [];

  for (const side of ["left", "right"] as const) {
    const mine = anchors.filter((a) => (a.x < opts.width / 2) === (side === "left"));
    // the caller's order decides who keeps a place; anchor order decides where
    const keep = mine.slice(0, capacity).sort((a, b) => a.y - b.y);
    for (const a of mine.slice(capacity)) dropped.push(a.id);
    if (!keep.length) continue;

    // greedy downward pass: take the wanted position, or just below the last
    const ys: number[] = [];
    let previous = -Infinity;
    for (const a of keep) {
      const y = Math.max(a.y, previous + rowHeight, inset);
      ys.push(y);
      previous = y;
    }
    // if that ran off the bottom, lift the column by exactly the overshoot and
    // let the top of it be clamped in turn. Within capacity this always fits.
    const overshoot = ys[ys.length - 1] + rowHeight - (opts.height - inset);
    if (overshoot > 0) {
      let floor = inset;
      for (let i = 0; i < ys.length; i++) {
        ys[i] = Math.max(ys[i] - overshoot, floor);
        floor = ys[i] + rowHeight;
      }
    }
    keep.forEach((a, i) => placed.push({
      id: a.id, side,
      x: side === "left" ? inset : opts.width - inset - labelWidth,
      y: ys[i],
      anchorX: a.x, anchorY: a.y,
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
  private labels = new Map<string, { box: HTMLButtonElement; leader: SVGPolylineElement }>();
  private items = new Map<string, CalloutItem>();
  private overflow: HTMLDivElement | null = null;
  private labelWidth: number;

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
    this.items = new Map(items.map((i) => [i.id, i]));
    for (const [id, el] of this.labels) {
      if (!this.items.has(id)) {
        el.box.remove(); el.leader.remove(); this.labels.delete(id);
      }
    }
  }

  /** Track the host's width, so labels stay a share of it rather than a
   *  constant that only suits one panel size. */
  setLabelWidth(px: number) {
    if (px === this.labelWidth) return;
    this.labelWidth = px;
    for (const { box } of this.labels.values()) box.style.width = `${px}px`;
  }

  /** The objects a caller must measure to anchor each callout. */
  objectsOf(id: string): THREE.Object3D[] { return this.items.get(id)?.objects ?? []; }

  get ids(): string[] { return [...this.items.keys()]; }

  /**
   * Draw this frame's placements. Anything not placed is hidden, not removed:
   * an element that comes back into view keeps its element rather than
   * flickering a new one in.
   *
   * `unplaced` is how many the margins had no room for, and it is shown. A
   * reader who can see fifteen labels and is not told there were twenty-two
   * has been given a wrong count, quietly, which is the failure this whole
   * project is arranged against.
   */
  update(placements: Placement[], unplaced = 0) {
    const placed = new Set(placements.map((p) => p.id));
    for (const [id, el] of this.labels) {
      if (!placed.has(id)) { el.box.hidden = true; el.leader.setAttribute("points", ""); }
    }
    for (const p of placements) {
      const item = this.items.get(p.id);
      if (!item) continue;
      const el = this.labels.get(p.id) ?? this.make(p.id, item);
      el.box.hidden = false;
      el.box.style.left = `${p.x}px`;
      el.box.style.top = `${p.y}px`;
      // an elbow rather than a straight line: a horizontal run out of the
      // label, then one segment to the anchor. It reads as a leader on a
      // drawing instead of as a line someone forgot to delete.
      const from = p.side === "left" ? p.x + this.labelWidth : p.x;
      const knee = p.side === "left" ? from + 10 : from - 10;
      const mid = p.y + 9;
      el.leader.setAttribute("points",
        `${from},${mid} ${knee},${mid} ${p.anchorX},${p.anchorY}`);
    }
    this.showOverflow(unplaced);
  }

  private showOverflow(n: number) {
    if (!n) { this.overflow?.remove(); this.overflow = null; return; }
    if (!this.overflow) {
      this.overflow = document.createElement("div");
      this.overflow.style.cssText = `position:absolute;left:50%;bottom:6px;transform:translateX(-50%);
        pointer-events:none;padding:2px 7px;border-radius:3px;
        background:rgba(255,255,255,.9);border:1px solid rgba(90,100,110,.25);
        font:500 10px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#79838d`;
      this.root.append(this.overflow);
    }
    this.overflow.textContent = `${n} more not labelled: no room in the margins`;
  }

  private make(id: string, item: CalloutItem) {
    const leader = document.createElementNS(SVG, "polyline") as SVGPolylineElement;
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
    return el;
  }

  setVisible(on: boolean) { this.root.style.display = on ? "" : "none"; }

  dispose() { this.root.remove(); }
}
