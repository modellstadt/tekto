/**
 * LayerPanel — reusable tree-based layer panel, laid out like Rhino's:
 * name · active (✓) · on (bulb) · lock · colour swatch.
 *
 * Pure DOM, no framework dependency. Embeds in the Sketch API via
 * lab.layerTree(), or use standalone by appending .el to any container.
 *
 * Parent visibility and lock work as a NON-DESTRUCTIVE MASK:
 *   - Turning a parent off (or locking it) dims its children's icons but does
 *     NOT change their stored state. Undoing it restores children as they were.
 *   - Use computeEffectiveVisibility() / computeEffectiveLock() to get the
 *     resolved state of each node (own state AND all ancestor states combined).
 *
 * One layer is ACTIVE (Rhino: "current") — the one new objects go on. It is
 * always on and unlocked: making a layer active turns it and its parents on
 * and unlocks them (activateLayer), and their bulbs and locks are disabled.
 */

// ─── Types ───────────────────────────────────────────────────────

/** One layer in a `LayerPanel` tree: id, label, initial visibility, lock and colour, and child layers. */
export interface LayerNode {
  /** Unique identifier — used as key in LayerMap */
  id: string;
  /** Display label */
  label: string;
  /** Initial visibility (default: true) */
  defaultVisible?: boolean;
  /** Initial lock (default: false) */
  defaultLocked?: boolean;
  /** Initial color (default: #888888) */
  defaultColor?: string;
  /** Child nodes */
  children?: LayerNode[];
}

/** A layer's own stored state: on/off, colour and lock (not ancestor-aware — see `computeEffectiveVisibility` / `computeEffectiveLock`). */
export interface LayerState {
  visible: boolean;
  color: string;
  /** Locked: its objects are drawn but can't be picked or hovered. */
  locked?: boolean;
}

/** Flat map of node id → stored state (own toggle only, not ancestor-aware) */
export type LayerMap = Record<string, LayerState>;

/** Which of the optional columns a `LayerPanel` shows — all of them unless switched off. */
export interface LayerColumns {
  /** The active-layer check (✓). Off: the tree has no active layer (a viewer's tree), so none is kept on. */
  active?: boolean;
  /** The padlock. */
  locked?: boolean;
  /** The colour swatch. */
  color?: boolean;
}

// ─── Utility ─────────────────────────────────────────────────────

const DEFAULT_COLOR = "#888888";

const defaultState = (node: LayerNode): LayerState => ({
  visible: node.defaultVisible ?? true,
  color:   node.defaultColor   ?? DEFAULT_COLOR,
  locked:  node.defaultLocked  ?? false,
});

const stateIn = (node: LayerNode, value: LayerMap): LayerState =>
  ({ ...defaultState(node), ...value[node.id] });

/** The nodes from the root down to `id` (inclusive); empty if `id` isn't in the tree. */
function pathTo(nodes: LayerNode[], id: string): LayerNode[] {
  for (const node of nodes) {
    if (node.id === id) return [node];
    const below = node.children ? pathTo(node.children, id) : [];
    if (below.length) return [node, ...below];
  }
  return [];
}

/**
 * Traverse a layer tree and return a map of id → effective visibility,
 * where a node is effectively visible only when it AND all its ancestors
 * are individually visible.
 *
 * Use this in your render function instead of reading `layers[id].visible`
 * directly — it gives the correct CAD-style masked result.
 */
export function computeEffectiveVisibility(
  nodes: LayerNode[],
  value: LayerMap,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const walk = (node: LayerNode, parentEffective: boolean) => {
    const own       = value[node.id]?.visible ?? (node.defaultVisible ?? true);
    const effective = parentEffective && own;
    result[node.id] = effective;
    node.children?.forEach(child => walk(child, effective));
  };
  nodes.forEach(node => walk(node, true));
  return result;
}

/**
 * The lock counterpart of `computeEffectiveVisibility`: a node is effectively
 * locked when it OR any of its ancestors is locked.
 */
export function computeEffectiveLock(
  nodes: LayerNode[],
  value: LayerMap,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const walk = (node: LayerNode, parentLocked: boolean) => {
    const own       = value[node.id]?.locked ?? (node.defaultLocked ?? false);
    const effective = parentLocked || own;
    result[node.id] = effective;
    node.children?.forEach(child => walk(child, effective));
  };
  nodes.forEach(node => walk(node, false));
  return result;
}

/** Every node's initial state (from `defaultVisible` / `defaultLocked` / `defaultColor`): the full map a layer tree starts from. */
export function layerDefaults(nodes: LayerNode[]): LayerMap {
  const result: LayerMap = {};
  const walk = (node: LayerNode) => {
    result[node.id] = defaultState(node);
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return result;
}

/**
 * The state changes that make `id` the active layer, as in Rhino: it and its
 * parents turn on and unlock. Returns only the nodes that change (empty when
 * none do, or `id` isn't in the tree); merge them into your `LayerMap`.
 */
export function activateLayer(nodes: LayerNode[], value: LayerMap, id: string): LayerMap {
  const updates: LayerMap = {};
  for (const node of pathTo(nodes, id)) {
    const state = stateIn(node, value);
    if (!state.visible || state.locked) updates[node.id] = { ...state, visible: true, locked: false };
  }
  return updates;
}

/** The first layer (depth-first) that is on and unlocked, else the first layer; "" for an empty tree. */
function defaultActiveLayer(nodes: LayerNode[], value: LayerMap): string {
  const on = computeEffectiveVisibility(nodes, value);
  const locked = computeEffectiveLock(nodes, value);
  const ids = Object.keys(on);
  return ids.find(id => on[id] && !locked[id]) ?? ids[0] ?? "";
}

/**
 * Drop the parts of `updates` that would turn the active layer or one of its
 * parents off or lock it — they stay on and unlocked while it is active.
 */
export function keepActiveOn(
  nodes: LayerNode[],
  active: string,
  updates: Record<string, Partial<LayerState>>,
): Record<string, Partial<LayerState>> {
  const guarded = new Set(pathTo(nodes, active).map(n => n.id));
  const result: Record<string, Partial<LayerState>> = {};
  for (const [id, patch] of Object.entries(updates)) {
    if (!guarded.has(id)) { result[id] = patch; continue; }
    const { visible, locked, ...kept } = patch;
    if (visible) (kept as Partial<LayerState>).visible = true;
    if (locked === false) (kept as Partial<LayerState>).locked = false;
    result[id] = kept;
  }
  return result;
}

// ─── Look ────────────────────────────────────────────────────────

// Square ("Rhino-style") colour swatches — a flat chip with a thin border.
// The native picker's inner swatch is a pseudo-element that can't be styled
// inline, so a stylesheet is injected once per document; the border colour
// flows through a CSS variable set inline on each input.
const SWATCH_STYLE_ID = "tekto-swatch-style";
function ensureSwatchStyle(doc: Document): void {
  if (doc.getElementById(SWATCH_STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = SWATCH_STYLE_ID;
  el.textContent = `
    .tekto-swatch{-webkit-appearance:none;appearance:none;width:12px;height:12px;padding:0;margin:0 2px 0 0;border:1px solid var(--tekto-swatch-border,#9ca3af);border-radius:0;background:none;cursor:pointer;flex-shrink:0;outline:none;}
    .tekto-swatch::-webkit-color-swatch-wrapper{padding:0;}
    .tekto-swatch::-webkit-color-swatch{border:none;border-radius:0;}
    .tekto-swatch::-moz-color-swatch{border:none;border-radius:0;}
  `;
  doc.head.appendChild(el);
}

// 16-unit icons drawn in currentColor, so a button's `color` tints them.
const svg = (body: string) =>
  `<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">${body}</svg>`;
const BULB_GLASS = "M8 1.5a4.5 4.5 0 0 0-2.7 8.1c.5.4.7.9.7 1.4v.5h4v-.5c0-.5.2-1 .7-1.4A4.5 4.5 0 0 0 8 1.5z";
const BULB_BASE = `<path d="M6.2 13.5h3.6M6.8 15h2.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`;
const ICON = {
  check:      svg(`<path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
  bulbOn:     svg(`<path d="${BULB_GLASS}" fill="currentColor"/>${BULB_BASE}`),
  bulbOff:    svg(`<path d="${BULB_GLASS}" fill="none" stroke="currentColor" stroke-width="1.2"/>${BULB_BASE}`),
  lockClosed: svg(`<rect x="3.5" y="7" width="9" height="7" rx="1" fill="currentColor"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.4"/>`),
  lockOpen:   svg(`<rect x="3.5" y="7" width="9" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0" fill="none" stroke="currentColor" stroke-width="1.2"/>`),
};

// ─── LayerPanel class ────────────────────────────────────────────

/**
 * A Rhino-style layer tree: per node an active-layer check, an on/off bulb, a lock and a
 * colour swatch; turning a parent off (or locking it) dims its children without changing their stored state.
 * Used by `lab.layerTree()`, or standalone by appending `.el`; `onChange` receives only the changed nodes
 * (and the new active id when it changed), and `update(nodes, value)` re-renders.
 */
export class LayerPanel {
  /** Mount this element anywhere in your UI */
  readonly el: HTMLElement;

  private _nodes: LayerNode[] = [];
  private _value: LayerMap = {};
  private _onChange: (updates: LayerMap, active?: string) => void;
  private _collapsed = new Set<string>();
  private _isDark: boolean;
  private _columns: Required<LayerColumns>;
  private _active = "";
  /** The active layer and its parents: they can't be turned off or locked. */
  private _activePath = new Set<string>();

  constructor(opts: {
    nodes: LayerNode[];
    value: LayerMap;
    /** `active` is set when the user made another layer active; `updates` then turn it (and its parents) on and unlock them. */
    onChange: (updates: LayerMap, active?: string) => void;
    isDark?: boolean;
    /** The initial active layer (default: the first one that is on and unlocked). */
    active?: string;
    columns?: LayerColumns;
  }) {
    this._isDark = opts.isDark ?? true;
    this._onChange = opts.onChange;
    this._columns = { active: true, locked: true, color: true, ...opts.columns };
    this._active = opts.active ?? "";
    ensureSwatchStyle(document);
    this.el = document.createElement("div");
    this.el.style.cssText = "overflow-y:auto;max-height:300px;";
    this.update(opts.nodes, opts.value);
  }

  /** The active layer's id: "" for an empty tree, or with the active column hidden (`columns.active: false`),
   *  where the tree has no active layer and nothing is kept on. */
  get active(): string { return this._active; }

  /**
   * Re-render with new nodes/value, and optionally another active layer (an
   * id not in `nodes` is ignored). Scroll position and collapsed state are
   * preserved. If the active layer leaves the tree, the first layer that is on
   * and unlocked becomes active.
   */
  update(nodes: LayerNode[], value: LayerMap, active?: string): void {
    this._nodes = nodes;
    this._value = value;
    if (!this._columns.active) this._active = "";                  // no active layer in this tree
    else {
      if (active !== undefined && pathTo(nodes, active).length) this._active = active;
      if (!pathTo(nodes, this._active).length) this._active = defaultActiveLayer(nodes, value);
    }
    this._rebuild();
  }

  // ── Private helpers ──

  private _rebuild(): void {
    this._activePath = new Set(pathTo(this._nodes, this._active).map(n => n.id));
    const scroll = this.el.scrollTop;
    this.el.innerHTML = "";
    for (const node of this._nodes) this._renderNode(node, 0, true, false);
    this.el.scrollTop = scroll;
  }

  private _iconButton(opts: {
    icon: string; label: string; title: string; role: "checkbox" | "radio";
    checked: boolean; color: string; opacity?: number; disabled?: boolean; onClick: () => void;
  }): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = opts.icon;
    b.title = opts.title;
    b.setAttribute("role", opts.role);
    b.setAttribute("aria-label", opts.label);
    b.setAttribute("aria-checked", String(opts.checked));
    b.disabled = !!opts.disabled;
    b.style.cssText = `
      all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;
      width:14px;height:14px;flex-shrink:0;color:${opts.color};opacity:${opts.opacity ?? 1};
      cursor:${opts.disabled ? "default" : "pointer"};
    `;
    b.addEventListener("click", e => {
      e.stopPropagation();
      opts.onClick();
    });
    return b;
  }

  /**
   * @param ancestorVisible — whether all ancestors are currently on.
   * @param ancestorLocked — whether any ancestor is locked.
   *   Both are used only for visual dimming; they do NOT affect stored state.
   */
  private _renderNode(node: LayerNode, depth: number, ancestorVisible: boolean, ancestorLocked: boolean): void {
    const state           = stateIn(node, this._value);
    const hasChildren     = !!node.children?.length;
    const isCollapsed     = this._collapsed.has(node.id);
    const effectiveVisible = ancestorVisible && state.visible;
    const effectiveLocked = ancestorLocked || !!state.locked;
    const isActive        = node.id === this._active;
    const guarded         = this._activePath.has(node.id);
    const d               = this._isDark;

    // Dim text when this node or any ancestor is off
    const labelColor = d
      ? (effectiveVisible ? "#b8bdd4" : "#3a3f5a")
      : (effectiveVisible ? "#2a2d3a" : "#b0b4c0");
    const arrowColor = d ? "#3a3f5a" : "#b0b4c0";
    const hoverBg    = d ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";
    const iconOn     = d ? "#b8bdd4" : "#2a2d3a";
    const iconOff    = d ? "#3a3f5a" : "#b0b4c0";
    const bulbOn     = d ? "#fbbf24" : "#d97706";
    const checkColor = d ? "#ffffff" : "#16182c";

    // Row
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:5px;
      padding:3px 6px 3px ${6 + depth * 14}px;
      border-radius:3px;cursor:default;transition:background .1s;min-height:22px;
    `;

    // Expand / collapse arrow (or spacer for alignment)
    const arrow = document.createElement("span");
    arrow.style.cssText = `width:10px;font-size:7px;flex-shrink:0;line-height:1;color:${arrowColor};user-select:none;`;
    if (hasChildren) {
      arrow.textContent = isCollapsed ? "▶" : "▼";
      arrow.style.cursor = "pointer";
      arrow.addEventListener("click", e => {
        e.stopPropagation();
        this._collapsed.has(node.id)
          ? this._collapsed.delete(node.id)
          : this._collapsed.add(node.id);
        this._rebuild();
      });
    }
    row.appendChild(arrow);

    // Label
    const lbl = document.createElement("span");
    lbl.textContent = node.label;
    lbl.style.cssText = `
      flex:1;font-size:11px;color:${labelColor};
      user-select:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    `;
    row.appendChild(lbl);

    // Active layer — a check on the active one; the others show it faintly on hover
    let activeBtn: HTMLButtonElement | null = null;
    if (this._columns.active) {
      activeBtn = this._iconButton({
        icon: ICON.check, role: "radio", checked: isActive,
        label: `Active: ${node.label}`, title: isActive ? "Active layer" : "Make active",
        color: checkColor, opacity: isActive ? 1 : 0,
        onClick: () => {
          if (isActive) return;
          const updates = activateLayer(this._nodes, this._value, node.id);
          this._active = node.id;
          this._onChange(updates, node.id);
        },
      });
      row.appendChild(activeBtn);
    }
    row.addEventListener("mouseenter", () => {
      row.style.background = hoverBg;
      if (activeBtn && !isActive) activeBtn.style.opacity = "0.35";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "";
      if (activeBtn && !isActive) activeBtn.style.opacity = "0";
    });

    // On / off — reflects OWN state only (not ancestor-masked); dimmed when a parent masks it
    const which = isActive ? "The active layer" : "A parent of the active layer";
    row.appendChild(this._iconButton({
      icon: state.visible ? ICON.bulbOn : ICON.bulbOff, role: "checkbox", checked: state.visible,
      label: `On: ${node.label}`,
      title: guarded ? `${which} can't be turned off` : state.visible ? "Turn off" : "Turn on",
      color: state.visible ? bulbOn : iconOff, opacity: ancestorVisible ? 1 : 0.35, disabled: guarded,
      // Only update this node's own state — children are NOT touched (non-destructive mask)
      onClick: () => this._onChange({ [node.id]: { ...state, visible: !state.visible } }),
    }));

    // Lock — same masking as on / off
    if (this._columns.locked) {
      row.appendChild(this._iconButton({
        icon: state.locked ? ICON.lockClosed : ICON.lockOpen, role: "checkbox", checked: !!state.locked,
        label: `Locked: ${node.label}`,
        title: guarded ? `${which} can't be locked` : state.locked ? "Unlock" : "Lock",
        color: state.locked ? iconOn : iconOff, opacity: ancestorLocked ? 0.35 : 1, disabled: guarded,
        onClick: () => this._onChange({ [node.id]: { ...state, locked: !state.locked } }),
      }));
    }

    // Color — a square swatch that opens the system colour chooser
    if (this._columns.color) {
      const cp = document.createElement("input");
      cp.type  = "color";
      cp.value = state.color;
      cp.title = "Layer color";
      cp.setAttribute("aria-label", `Color: ${node.label}`);
      cp.className = "tekto-swatch";
      cp.style.setProperty("--tekto-swatch-border", d ? "#9ca3af" : "#6b7280");
      cp.addEventListener("change", e => {
        e.stopPropagation();
        this._onChange({ [node.id]: { ...state, color: cp.value } });
      });
      row.appendChild(cp);
    }

    this.el.appendChild(row);

    // Recurse — pass effective state so children can dim themselves
    if (hasChildren && !isCollapsed) {
      for (const child of node.children!) {
        this._renderNode(child, depth + 1, effectiveVisible, effectiveLocked);
      }
    }
  }
}
