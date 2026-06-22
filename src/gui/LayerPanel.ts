/**
 * LayerPanel — reusable tree-based layer/visibility panel.
 *
 * Pure DOM, no framework dependency. Embeds in the Sketch API via
 * lab.layerTree(), or use standalone by appending .el to any container.
 *
 * Parent visibility works as a NON-DESTRUCTIVE MASK:
 *   - Hiding a parent dims its children visually but does NOT change their
 *     stored state. Re-enabling the parent restores children as they were.
 *   - Use computeEffectiveVisibility() to get the resolved visibility for
 *     each node (own state AND all ancestor states combined).
 */

// ─── Types ───────────────────────────────────────────────────────

export interface LayerNode {
  /** Unique identifier — used as key in LayerMap */
  id: string;
  /** Display label */
  label: string;
  /** Initial visibility (default: true) */
  defaultVisible?: boolean;
  /** Initial color. When defined, a color picker is shown next to the label. */
  defaultColor?: string;
  /** Child nodes */
  children?: LayerNode[];
}

export interface LayerState {
  visible: boolean;
  color: string;
}

/** Flat map of node id → stored state (own toggle only, not ancestor-aware) */
export type LayerMap = Record<string, LayerState>;

// ─── Utility ─────────────────────────────────────────────────────

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

// ─── LayerPanel class ────────────────────────────────────────────

export class LayerPanel {
  /** Mount this element anywhere in your UI */
  readonly el: HTMLElement;

  private _nodes: LayerNode[] = [];
  private _value: LayerMap = {};
  private _onChange: (updates: LayerMap) => void;
  private _collapsed = new Set<string>();
  private _isDark: boolean;

  constructor(opts: {
    nodes: LayerNode[];
    value: LayerMap;
    onChange: (updates: LayerMap) => void;
    isDark?: boolean;
  }) {
    this._isDark = opts.isDark ?? true;
    this._onChange = opts.onChange;
    this.el = document.createElement("div");
    this.el.style.cssText = "overflow-y:auto;max-height:300px;";
    this.update(opts.nodes, opts.value);
  }

  /**
   * Re-render with new nodes/value.
   * Scroll position and collapsed state are preserved.
   */
  update(nodes: LayerNode[], value: LayerMap): void {
    this._nodes = nodes;
    this._value = value;
    const scroll = this.el.scrollTop;
    this.el.innerHTML = "";
    for (const node of this._nodes) this._renderNode(node, 0, true);
    this.el.scrollTop = scroll;
  }

  // ── Private helpers ──

  private _stateOf(node: LayerNode): LayerState {
    return this._value[node.id] ?? {
      visible: node.defaultVisible ?? true,
      color:   node.defaultColor   ?? "#888888",
    };
  }

  private _rebuild(): void {
    const scroll = this.el.scrollTop;
    this.el.innerHTML = "";
    for (const node of this._nodes) this._renderNode(node, 0, true);
    this.el.scrollTop = scroll;
  }

  /**
   * @param ancestorVisible — whether all ancestors are currently visible.
   *   Used only for visual dimming; does NOT affect stored state.
   */
  private _renderNode(node: LayerNode, depth: number, ancestorVisible: boolean): void {
    const state           = this._stateOf(node);
    const hasChildren     = !!node.children?.length;
    const isCollapsed     = this._collapsed.has(node.id);
    const effectiveVisible = ancestorVisible && state.visible;
    const d               = this._isDark;

    // Dim text when this node or any ancestor is hidden
    const labelColor = d
      ? (effectiveVisible ? "#b8bdd4" : "#3a3f5a")
      : (effectiveVisible ? "#2a2d3a" : "#b0b4c0");
    const arrowColor = d ? "#3a3f5a" : "#b0b4c0";
    const hoverBg    = d ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";

    // Row
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:5px;
      padding:3px 6px 3px ${6 + depth * 14}px;
      border-radius:3px;cursor:default;transition:background .1s;min-height:22px;
    `;
    row.addEventListener("mouseenter", () => { row.style.background = hoverBg; });
    row.addEventListener("mouseleave", () => { row.style.background = ""; });

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

    // Visibility checkbox — reflects OWN state only (not ancestor-masked)
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = state.visible;
    // Dim the checkbox when parent is masking this node
    cb.style.cssText = `cursor:pointer;width:11px;height:11px;flex-shrink:0;accent-color:#38d9a9;margin:0;opacity:${ancestorVisible ? "1" : "0.35"};`;
    cb.addEventListener("change", e => {
      e.stopPropagation();
      // Only update this node's own state — children are NOT touched (non-destructive mask)
      this._onChange({ [node.id]: { ...state, visible: cb.checked } });
    });
    row.appendChild(cb);

    // Label
    const lbl = document.createElement("span");
    lbl.textContent = node.label;
    lbl.style.cssText = `
      flex:1;font-size:11px;color:${labelColor};
      user-select:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    `;
    row.appendChild(lbl);

    // Color picker — always shown on every node
    const cp = document.createElement("input");
    cp.type  = "color";
    cp.value = state.color;
    cp.title = "Layer color";
    cp.style.cssText = `
      width:16px;height:13px;border:1px solid ${d ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.15)"};
      border-radius:2px;padding:0;cursor:pointer;flex-shrink:0;outline:none;background:none;
    `;
    cp.addEventListener("change", e => {
      e.stopPropagation();
      this._onChange({ [node.id]: { ...state, color: cp.value } });
    });
    row.appendChild(cp);

    this.el.appendChild(row);

    // Recurse — pass effective visibility so children can dim themselves
    if (hasChildren && !isCollapsed) {
      for (const child of node.children!) {
        this._renderNode(child, depth + 1, effectiveVisible);
      }
    }
  }
}
