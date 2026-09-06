/**
 * Tekto React Integration
 *
 * Components and hooks that wire the Scene, Renderer, and Params together.
 */

import React, {
  useEffect, useState, useCallback, useMemo, useRef,
  createContext, useContext, type ReactNode, type CSSProperties,
} from "react";

import { Scene, SceneObject } from "../scene/Scene";
import { ParamStore, ParamSchema, ParamDef, ParamLayout, ParamFolder } from "../gui/Params";

// ═══════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════

interface TektoCtx {
  scene: Scene;
}

const Ctx = createContext<TektoCtx | null>(null);

export function useScene(): Scene {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useScene must be inside <TektoApp>");
  return ctx.scene;
}

export function TektoApp({
  scene: extScene,
  children,
}: {
  scene?: Scene;
  children: ReactNode;
}) {
  const scene = useMemo(() => extScene ?? new Scene(), [extScene]);
  return <Ctx.Provider value={{ scene }}>{children}</Ctx.Provider>;
}

// ═══════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════

/** Reactively watch all scene objects */
export function useSceneObjects(): SceneObject[] {
  const scene = useScene();
  const [objects, setObjects] = useState<SceneObject[]>(scene.all());
  useEffect(() => scene.on(() => setObjects([...scene.all()])), [scene]);
  return objects;
}

/** Watch selection */
export function useSelection() {
  const scene = useScene();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => scene.on(e => {
    if (e.type === "selection:change") setIds(e.ids);
  }), [scene]);
  return {
    ids,
    select: (id: string) => scene.select(id),
    deselect: (id: string) => scene.deselect(id),
    toggle: (id: string) => scene.toggleSelect(id),
    clear: () => scene.clearSelection(),
    isSelected: (id: string) => scene.isSelected(id),
  };
}

/** Use a ParamStore reactively */
export function useParams<S extends ParamSchema>(store: ParamStore<S>) {
  const [values, setValues] = useState(store.getAll());

  useEffect(() => {
    return store.onChange(() => setValues({ ...store.getAll() }));
  }, [store]);

  const set = useCallback((key: string, value: any) => store.set(key as any, value), [store]);

  return { values, set, store };
}

// ═══════════════════════════════════════════════
// Param Panel — auto-generates UI from ParamStore
// ═══════════════════════════════════════════════

interface ParamPanelProps {
  store: ParamStore;
  layout?: ParamLayout;
  title?: string;
  style?: CSSProperties;
  className?: string;
}

export function ParamPanel({ store, layout, title, style, className }: ParamPanelProps) {
  const { values, set } = useParams(store);
  const schema = store.getSchema();

  const renderParam = (key: string) => {
    const def = schema[key] as ParamDef;
    if (!def) return null;
    const label = def.label ?? key;

    switch (def.type) {
      case "float":
      case "int":
        return (
          <div key={key} style={rowStyle}>
            <label style={labelStyle}>{label}</label>
            <input
              type="range"
              min={def.min}
              max={def.max}
              step={def.step ?? (def.type === "int" ? 1 : (def.max - def.min) / 100)}
              value={values[key]}
              onChange={e => set(key, parseFloat(e.target.value))}
              style={sliderStyle}
            />
            <span style={valueStyle}>{def.type === "int" ? values[key] : values[key]?.toFixed(2)}</span>
          </div>
        );

      case "bool":
        return (
          <div key={key} style={rowStyle}>
            <label style={labelStyle}>{label}</label>
            <input
              type="checkbox"
              checked={values[key]}
              onChange={e => set(key, e.target.checked)}
              style={checkStyle}
            />
          </div>
        );

      case "select":
        return (
          <div key={key} style={rowStyle}>
            <label style={labelStyle}>{label}</label>
            <select
              value={values[key]}
              onChange={e => set(key, e.target.value)}
              style={selectStyle}
            >
              {def.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        );

      case "color":
        return (
          <div key={key} style={rowStyle}>
            <label style={labelStyle}>{label}</label>
            <input
              type="color"
              value={values[key]}
              onChange={e => set(key, e.target.value)}
              style={colorStyle}
            />
            <span style={valueStyle}>{values[key]}</span>
          </div>
        );

      case "string":
        return (
          <div key={key} style={rowStyle}>
            <label style={labelStyle}>{label}</label>
            <input
              type="text"
              value={values[key]}
              placeholder={def.placeholder}
              onChange={e => set(key, e.target.value)}
              style={textStyle}
            />
          </div>
        );

      case "vec3":
        const v = values[key] as [number, number, number];
        return (
          <div key={key} style={{ ...rowStyle, flexDirection: "column", alignItems: "stretch" }}>
            <label style={labelStyle}>{label}</label>
            <div style={{ display: "flex", gap: 4 }}>
              {["x", "y", "z"].map((axis, i) => (
                <input
                  key={axis}
                  type="number"
                  value={v[i]}
                  step={def.step ?? 0.1}
                  onChange={e => {
                    const nv: [number, number, number] = [...v];
                    nv[i] = parseFloat(e.target.value) || 0;
                    set(key, nv);
                  }}
                  style={{ ...textStyle, flex: 1 }}
                  placeholder={axis}
                />
              ))}
            </div>
          </div>
        );

      case "button":
        return (
          <div key={key} style={rowStyle}>
            <button onClick={def.action} style={buttonStyle}>{label}</button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFolder = (folder: ParamFolder) => (
    <FolderWidget key={folder.label} label={folder.label} defaultOpen={folder.open !== false}>
      {folder.params.map(renderParam)}
    </FolderWidget>
  );

  // All param keys (if no layout, list everything)
  const allKeys = Object.keys(schema);
  const layoutKeys = layout?.folders.flatMap(f => f.params) ?? [];
  const ungroupedKeys = allKeys.filter(k => !layoutKeys.includes(k));

  return (
    <div className={className} style={{ ...panelStyle, ...style }}>
      {title && <div style={panelTitleStyle}>{title}</div>}
      {layout?.folders.map(renderFolder)}
      {ungroupedKeys.length > 0 && ungroupedKeys.map(renderParam)}
    </div>
  );
}

// ── Collapsible Folder ──

function FolderWidget({
  label, defaultOpen = true, children,
}: { label: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          padding: "6px 0", color: "#8899bb", fontSize: 11, fontWeight: 600,
          textTransform: "uppercase" as const, letterSpacing: "1px",
          userSelect: "none" as const,
        }}
      >
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", fontSize: 10 }}>▶</span>
        {label}
      </div>
      {open && <div style={{ paddingLeft: 4 }}>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Inspector Panel
// ═══════════════════════════════════════════════

export function InspectorPanel({
  style, className, onSelect,
}: {
  style?: CSSProperties;
  className?: string;
  onSelect?: (id: string) => void;
}) {
  const objects = useSceneObjects();
  const selection = useSelection();

  return (
    <div className={className} style={{ ...panelStyle, ...style }}>
      <div style={panelTitleStyle}>Scene Objects ({objects.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {objects.map(obj => (
          <div
            key={obj.id}
            onClick={() => { selection.toggle(obj.id); onSelect?.(obj.id); }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 8px", borderRadius: 4, cursor: "pointer",
              background: selection.isSelected(obj.id) ? "rgba(59,130,246,.15)" : "transparent",
              borderLeft: `3px solid ${obj.style.color}`,
            }}
          >
            <span style={{ color: "#5a6080", fontSize: 11, fontFamily: "monospace" }}>{obj.type}</span>
            <span style={{ color: "#9aa0b8", fontSize: 11, fontFamily: "monospace" }}>{obj.id}</span>
            {obj.style.label && (
              <span style={{ color: "#6a7090", fontSize: 10, fontStyle: "italic" }}>"{obj.style.label}"</span>
            )}
          </div>
        ))}
        {objects.length === 0 && (
          <div style={{ color: "#3a3f58", fontStyle: "italic", fontSize: 12, padding: 8 }}>Empty scene</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Toolbar
// ═══════════════════════════════════════════════

export interface ToolbarAction {
  key: string;
  label: string;
  icon?: string;
  shortcut?: string;
  onClick: () => void;
  active?: boolean;
  group?: string;
}

export function Toolbar({
  actions, style, className,
}: {
  actions: ToolbarAction[];
  style?: CSSProperties;
  className?: string;
}) {
  const groups = new Map<string, ToolbarAction[]>();
  for (const a of actions) {
    const g = a.group ?? "__default";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(a);
  }

  return (
    <div className={className} style={{ display: "flex", gap: 2, ...style }}>
      {[...groups.entries()].map(([group, items], gi) => (
        <React.Fragment key={group}>
          {gi > 0 && <div style={{ width: 1, background: "#1e2035", margin: "4px 4px" }} />}
          {items.map(a => (
            <button
              key={a.key}
              onClick={a.onClick}
              title={a.shortcut ? `${a.label} (${a.shortcut})` : a.label}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", border: "1px solid",
                borderColor: a.active ? "#3b82f6" : "#1e2035",
                borderRadius: 6,
                background: a.active ? "rgba(59,130,246,.12)" : "transparent",
                color: a.active ? "#93c5fd" : "#6a7090",
                cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.12s",
                whiteSpace: "nowrap" as const,
              }}
            >
              {a.icon && <span>{a.icon}</span>}
              {a.label}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Styles (inline, framework-agnostic)
// ═══════════════════════════════════════════════

const panelStyle: CSSProperties = {
  padding: 12,
  background: "rgba(14, 15, 26, 0.95)",
  borderRadius: 8,
  border: "1px solid #1a1c2e",
  color: "#c8cad8",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  maxHeight: "100%",
  overflowY: "auto",
};

const panelTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  color: "#5a6080",
  marginBottom: 12,
  fontFamily: "monospace",
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 6,
};

const labelStyle: CSSProperties = {
  width: 80,
  flexShrink: 0,
  fontSize: 12,
  color: "#8a90a8",
  textTransform: "capitalize" as const,
};

const sliderStyle: CSSProperties = {
  flex: 1,
  height: 4,
  appearance: "auto" as const,
  accentColor: "#3b82f6",
  cursor: "pointer",
};

const valueStyle: CSSProperties = {
  width: 48,
  textAlign: "right" as const,
  fontSize: 11,
  fontFamily: "monospace",
  color: "#6ee7b7",
};

const checkStyle: CSSProperties = {
  accentColor: "#3b82f6",
  cursor: "pointer",
};

const selectStyle: CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  background: "#0a0b14",
  border: "1px solid #1e2035",
  borderRadius: 4,
  color: "#c8cad8",
  fontSize: 12,
  fontFamily: "inherit",
};

const textStyle: CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  background: "#0a0b14",
  border: "1px solid #1e2035",
  borderRadius: 4,
  color: "#c8cad8",
  fontSize: 12,
  fontFamily: "inherit",
};

const colorStyle: CSSProperties = {
  width: 32,
  height: 24,
  border: "1px solid #1e2035",
  borderRadius: 4,
  padding: 0,
  cursor: "pointer",
  background: "none",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  padding: "7px 12px",
  border: "1px solid #1e2035",
  borderRadius: 5,
  background: "transparent",
  color: "#8a90a8",
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "monospace",
  transition: "all 0.15s",
};

// ═══════════════════════════════════════════════
// Accordion column
// ═══════════════════════════════════════════════

/**
 * One section of an AccordionColumn.
 *
 * `meta` is the part that earns a closed section its place on screen: a count,
 * a total, a setting. A header that says only "Cut list" is worth nothing shut;
 * one that says "Cut list, 94 pieces" answers the question most readers had.
 */
export interface AccordionSection {
  id: string;
  title: string;
  /** Shown at the right of the header, whether the section is open or closed. */
  meta?: ReactNode;
  /**
   * The section that takes whatever height is left, until a drag gives it one
   * of its own. At most one.
   */
  fill?: boolean;
  /** Open before the reader has an opinion. Defaults to true for `fill`. */
  defaultOpen?: boolean;
  /**
   * Body height in pixels when opened, which also makes the section resizable.
   * Leave it out and the body is as tall as its content, which is what prose
   * of unpredictable length wants: a supplier's note is three lines or thirty,
   * and pinning either to 220 pixels is wrong for the other.
   */
  defaultHeight?: number;
  /** Hover text on the header. */
  hint?: string;
  children: ReactNode;
}

export interface AccordionColumnProps {
  sections: AccordionSection[];
  /** localStorage key for what is open and how tall. Omit to keep it per mount. */
  storageKey?: string;
  className?: string;
  /** The host decides how wide the column is, and where it sits. */
  style?: CSSProperties;
  /**
   * Class names for the parts, so the column takes the host's look rather than
   * bringing its own. The built-in styles are structural only: what is left if
   * you pass nothing is a plain, legible column, not a themed one.
   */
  classes?: Partial<Record<"header" | "title" | "meta" | "body" | "handle" | "marker", string>>;
}

/** Smallest a body may be dragged to. Below this a section is worth closing. */
const ACCORDION_MIN = 40;

/** Marks a section that is open and still taking the leftover height, as
 *  opposed to one whose stored number is a real pixel height. */
const FLEXING = 1;

/**
 * A column of collapsible sections, one of which may take the leftover height.
 *
 * The pattern every inspector ends up with: a tree that should have all the
 * room going, and beneath it a few references (a cut list, a property bag, a
 * project setting) that are worth a line each until you want them. Doing it ad
 * hoc gives every section a slightly different header, a different way to
 * collapse, and a different answer to what happens when two are open at once.
 *
 * **A boundary is a sash between its two neighbours**, which is the convention
 * and the only reading under which the rule follows the pointer. What the
 * section above gains, the section below gives up: the top of the one and the
 * bottom of the other stay put, and the line moves by exactly the distance
 * dragged. Resizing a single section instead looks right only while some other
 * section has slack to absorb the difference, and at its limit the line stops
 * dead while a different edge moves.
 *
 * The flexible section takes the leftover until a sash gives it a height of its
 * own; from then on it is a section like the others, which is what makes a
 * boundary stay where it was put.
 */
export function AccordionColumn({
  sections, storageKey, className, style, classes = {},
}: AccordionColumnProps) {
  const initial = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of sections) {
      const open = s.defaultOpen ?? !!s.fill;
      out[s.id] = open ? (s.fill ? FLEXING : s.defaultHeight ?? FLEXING) : 0;
    }
    return out;
  }, [sections]);

  const [state, setState] = useState<Record<string, number>>(() => {
    if (!storageKey) return initial;
    try {
      // merged over the defaults, so a section added later still appears
      return { ...initial, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
      return initial;                       // private window, or a bad value
    }
  });

  useEffect(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* private */ }
  }, [state, storageKey]);

  const toggle = useCallback((s: AccordionSection) => {
    setState((v) => ({
      ...v,
      [s.id]: v[s.id] > 0 ? 0 : (s.fill ? FLEXING : s.defaultHeight ?? FLEXING),
    }));
  }, []);

  /** Every open body, so a sash can start from the height actually on screen. */
  const bodies = useRef<Record<string, HTMLDivElement | null>>({});

  /**
   * Move one boundary, and nothing else.
   *
   * Both starting heights are read from the DOM at the start of the gesture
   * rather than from state, because the flexible section has no stored height
   * until it is dragged, and because a body sized by its content has none
   * either. Neither side may go under the minimum, which is what stops the
   * gesture at the ends rather than letting it push a section off the column.
   */
  const sash = useCallback((
    aboveId: string, belowId: string, dy: number, start: { above: number; below: number },
  ) => {
    const move = Math.max(
      ACCORDION_MIN - start.above,
      Math.min(dy, start.below - ACCORDION_MIN),
    );
    setState((v) => ({
      ...v,
      [aboveId]: start.above + move,
      [belowId]: start.below - move,
    }));
  }, []);

  /** The sections on screen, so a boundary knows which two it lies between. */
  const open = sections.filter((s) => (state[s.id] ?? 0) > 0);
  /** A body sized by a number can be dragged; one sized by its content cannot. */
  const resizable = (s: AccordionSection) => !!s.fill || s.defaultHeight !== undefined;

  return (
    <div className={className}
      style={{
        display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto", ...style,
      }}>
      {sections.map((s) => {
        const isOpen = (state[s.id] ?? 0) > 0;
        const at = open.indexOf(s);
        const above = isOpen && at > 0 ? open[at - 1] : undefined;
        const flexing = !!s.fill && state[s.id] === FLEXING;
        return (
          <React.Fragment key={s.id}>
            {above && resizable(above) && resizable(s) && (
              <AccordionHandle className={classes.handle}
                onStart={() => ({
                  above: bodies.current[above.id]?.clientHeight ?? 0,
                  below: bodies.current[s.id]?.clientHeight ?? 0,
                })}
                onDrag={(dy, start) => sash(above.id, s.id, dy, start)} />
            )}
            <button type="button" onClick={() => toggle(s)} title={s.hint}
              className={classes.header}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, width: "100%", flexShrink: 0, textAlign: "left",
                font: "inherit", background: "none", border: 0, cursor: "pointer",
                ...(classes.header ? {} : { padding: "6px 12px" }),
              }}>
              <span className={classes.title}>{s.title}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {s.meta !== undefined && <span className={classes.meta}>{s.meta}</span>}
                {/* a chevron rather than a triangle glyph, and on the right
                    where a reader scanning the headings finds it in one column
                    rather than beside titles of different lengths */}
                <svg className={classes.marker} width="11" height="11" viewBox="0 0 12 12"
                  aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"
                  // no opacity of its own: the marker is part of the heading and
                  // reads at the heading's weight, which is the host's call
                  style={{
                    flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s",
                  }}>
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </span>
            </button>
            {isOpen && (
              <div className={classes.body}
                ref={(el) => { bodies.current[s.id] = el; }}
                style={flexing
                  // while it is still taking the leftover, a floor keeps it
                  // worth looking at: opening everything else should not squeeze
                  // the tree down to two rows before anyone has dragged anything
                  ? { flex: 1, minHeight: s.defaultHeight ?? 120, overflow: "auto" }
                  : resizable(s)
                    ? { flexShrink: 0, height: state[s.id], overflow: "auto" }
                    : { flexShrink: 0 }}>
                {s.children}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * The grab strip on a boundary between two sections.
 *
 * It takes no height: negative margins pull it back over the rule already
 * drawn there, so what a reader grabs is that line and the layout does not
 * shift by the width of an affordance. Transparent, because the line is the
 * affordance and a grey strip beside it would say the same thing twice.
 */
function AccordionHandle({ onStart, onDrag, className }: {
  onStart: () => { above: number; below: number };
  onDrag: (dy: number, start: { above: number; below: number }) => void;
  className?: string;
}) {
  return (
    <div
      className={className}
      onPointerDown={(e) => {
        e.preventDefault();
        const from = e.clientY;
        const start = onStart();
        const move = (m: PointerEvent) => onDrag(m.clientY - from, start);
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
      style={{
        position: "relative", zIndex: 1, flexShrink: 0,
        height: 7, marginTop: -4, marginBottom: -3,
        cursor: "row-resize", touchAction: "none",
      }}
    />
  );
}
