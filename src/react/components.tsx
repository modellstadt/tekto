/**
 * Tekto React Integration
 *
 * Components and hooks that wire the Scene, Renderer, and Params together.
 */

import React, {
  useEffect, useState, useCallback, useMemo,
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
