import {
  Scene
} from "./chunk-QKIO3ZDY.mjs";

// src/react/components.tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext
} from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var Ctx = createContext(null);
function useScene() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useScene must be inside <TektoApp>");
  return ctx.scene;
}
function TektoApp({
  scene: extScene,
  children
}) {
  const scene = useMemo(() => extScene ?? new Scene(), [extScene]);
  return /* @__PURE__ */ jsx(Ctx.Provider, { value: { scene }, children });
}
function useSceneObjects() {
  const scene = useScene();
  const [objects, setObjects] = useState(scene.all());
  useEffect(() => scene.on(() => setObjects([...scene.all()])), [scene]);
  return objects;
}
function useSelection() {
  const scene = useScene();
  const [ids, setIds] = useState([]);
  useEffect(() => scene.on((e) => {
    if (e.type === "selection:change") setIds(e.ids);
  }), [scene]);
  return {
    ids,
    select: (id) => scene.select(id),
    deselect: (id) => scene.deselect(id),
    toggle: (id) => scene.toggleSelect(id),
    clear: () => scene.clearSelection(),
    isSelected: (id) => scene.isSelected(id)
  };
}
function useParams(store) {
  const [values, setValues] = useState(store.getAll());
  useEffect(() => {
    return store.onChange(() => setValues({ ...store.getAll() }));
  }, [store]);
  const set = useCallback((key, value) => store.set(key, value), [store]);
  return { values, set, store };
}
function ParamPanel({ store, layout, title, style, className }) {
  const { values, set } = useParams(store);
  const schema = store.getSchema();
  const renderParam = (key) => {
    const def = schema[key];
    if (!def) return null;
    const label = def.label ?? key;
    switch (def.type) {
      case "float":
      case "int":
        return /* @__PURE__ */ jsxs("div", { style: rowStyle, children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: def.min,
              max: def.max,
              step: def.step ?? (def.type === "int" ? 1 : (def.max - def.min) / 100),
              value: values[key],
              onChange: (e) => set(key, parseFloat(e.target.value)),
              style: sliderStyle
            }
          ),
          /* @__PURE__ */ jsx("span", { style: valueStyle, children: def.type === "int" ? values[key] : values[key]?.toFixed(2) })
        ] }, key);
      case "bool":
        return /* @__PURE__ */ jsxs("div", { style: rowStyle, children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: values[key],
              onChange: (e) => set(key, e.target.checked),
              style: checkStyle
            }
          )
        ] }, key);
      case "select":
        return /* @__PURE__ */ jsxs("div", { style: rowStyle, children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: values[key],
              onChange: (e) => set(key, e.target.value),
              style: selectStyle,
              children: def.options.map((o) => /* @__PURE__ */ jsx("option", { value: o, children: o }, o))
            }
          )
        ] }, key);
      case "color":
        return /* @__PURE__ */ jsxs("div", { style: rowStyle, children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "color",
              value: values[key],
              onChange: (e) => set(key, e.target.value),
              style: colorStyle
            }
          ),
          /* @__PURE__ */ jsx("span", { style: valueStyle, children: values[key] })
        ] }, key);
      case "string":
        return /* @__PURE__ */ jsxs("div", { style: rowStyle, children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: values[key],
              placeholder: def.placeholder,
              onChange: (e) => set(key, e.target.value),
              style: textStyle
            }
          )
        ] }, key);
      case "vec3":
        const v = values[key];
        return /* @__PURE__ */ jsxs("div", { style: { ...rowStyle, flexDirection: "column", alignItems: "stretch" }, children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, children: label }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 4 }, children: ["x", "y", "z"].map((axis, i) => /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: v[i],
              step: def.step ?? 0.1,
              onChange: (e) => {
                const nv = [...v];
                nv[i] = parseFloat(e.target.value) || 0;
                set(key, nv);
              },
              style: { ...textStyle, flex: 1 },
              placeholder: axis
            },
            axis
          )) })
        ] }, key);
      case "button":
        return /* @__PURE__ */ jsx("div", { style: rowStyle, children: /* @__PURE__ */ jsx("button", { onClick: def.action, style: buttonStyle, children: label }) }, key);
      default:
        return null;
    }
  };
  const renderFolder = (folder) => /* @__PURE__ */ jsx(FolderWidget, { label: folder.label, defaultOpen: folder.open !== false, children: folder.params.map(renderParam) }, folder.label);
  const allKeys = Object.keys(schema);
  const layoutKeys = layout?.folders.flatMap((f) => f.params) ?? [];
  const ungroupedKeys = allKeys.filter((k) => !layoutKeys.includes(k));
  return /* @__PURE__ */ jsxs("div", { className, style: { ...panelStyle, ...style }, children: [
    title && /* @__PURE__ */ jsx("div", { style: panelTitleStyle, children: title }),
    layout?.folders.map(renderFolder),
    ungroupedKeys.length > 0 && ungroupedKeys.map(renderParam)
  ] });
}
function FolderWidget({
  label,
  defaultOpen = true,
  children
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 8 }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => setOpen(!open),
        style: {
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 0",
          color: "#8899bb",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "1px",
          userSelect: "none"
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", fontSize: 10 }, children: "\u25B6" }),
          label
        ]
      }
    ),
    open && /* @__PURE__ */ jsx("div", { style: { paddingLeft: 4 }, children })
  ] });
}
function InspectorPanel({
  style,
  className,
  onSelect
}) {
  const objects = useSceneObjects();
  const selection = useSelection();
  return /* @__PURE__ */ jsxs("div", { className, style: { ...panelStyle, ...style }, children: [
    /* @__PURE__ */ jsxs("div", { style: panelTitleStyle, children: [
      "Scene Objects (",
      objects.length,
      ")"
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 1 }, children: [
      objects.map((obj) => /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => {
            selection.toggle(obj.id);
            onSelect?.(obj.id);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 8px",
            borderRadius: 4,
            cursor: "pointer",
            background: selection.isSelected(obj.id) ? "rgba(59,130,246,.15)" : "transparent",
            borderLeft: `3px solid ${obj.style.color}`
          },
          children: [
            /* @__PURE__ */ jsx("span", { style: { color: "#5a6080", fontSize: 11, fontFamily: "monospace" }, children: obj.type }),
            /* @__PURE__ */ jsx("span", { style: { color: "#9aa0b8", fontSize: 11, fontFamily: "monospace" }, children: obj.id }),
            obj.style.label && /* @__PURE__ */ jsxs("span", { style: { color: "#6a7090", fontSize: 10, fontStyle: "italic" }, children: [
              '"',
              obj.style.label,
              '"'
            ] })
          ]
        },
        obj.id
      )),
      objects.length === 0 && /* @__PURE__ */ jsx("div", { style: { color: "#3a3f58", fontStyle: "italic", fontSize: 12, padding: 8 }, children: "Empty scene" })
    ] })
  ] });
}
function Toolbar({
  actions,
  style,
  className
}) {
  const groups = /* @__PURE__ */ new Map();
  for (const a of actions) {
    const g = a.group ?? "__default";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(a);
  }
  return /* @__PURE__ */ jsx("div", { className, style: { display: "flex", gap: 2, ...style }, children: [...groups.entries()].map(([group, items], gi) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
    gi > 0 && /* @__PURE__ */ jsx("div", { style: { width: 1, background: "#1e2035", margin: "4px 4px" } }),
    items.map((a) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: a.onClick,
        title: a.shortcut ? `${a.label} (${a.shortcut})` : a.label,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          border: "1px solid",
          borderColor: a.active ? "#3b82f6" : "#1e2035",
          borderRadius: 6,
          background: a.active ? "rgba(59,130,246,.12)" : "transparent",
          color: a.active ? "#93c5fd" : "#6a7090",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.12s",
          whiteSpace: "nowrap"
        },
        children: [
          a.icon && /* @__PURE__ */ jsx("span", { children: a.icon }),
          a.label
        ]
      },
      a.key
    ))
  ] }, group)) });
}
var panelStyle = {
  padding: 12,
  background: "rgba(14, 15, 26, 0.95)",
  borderRadius: 8,
  border: "1px solid #1a1c2e",
  color: "#c8cad8",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  maxHeight: "100%",
  overflowY: "auto"
};
var panelTitleStyle = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  color: "#5a6080",
  marginBottom: 12,
  fontFamily: "monospace"
};
var rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 6
};
var labelStyle = {
  width: 80,
  flexShrink: 0,
  fontSize: 12,
  color: "#8a90a8",
  textTransform: "capitalize"
};
var sliderStyle = {
  flex: 1,
  height: 4,
  appearance: "auto",
  accentColor: "#3b82f6",
  cursor: "pointer"
};
var valueStyle = {
  width: 48,
  textAlign: "right",
  fontSize: 11,
  fontFamily: "monospace",
  color: "#6ee7b7"
};
var checkStyle = {
  accentColor: "#3b82f6",
  cursor: "pointer"
};
var selectStyle = {
  flex: 1,
  padding: "4px 8px",
  background: "#0a0b14",
  border: "1px solid #1e2035",
  borderRadius: 4,
  color: "#c8cad8",
  fontSize: 12,
  fontFamily: "inherit"
};
var textStyle = {
  flex: 1,
  padding: "4px 8px",
  background: "#0a0b14",
  border: "1px solid #1e2035",
  borderRadius: 4,
  color: "#c8cad8",
  fontSize: 12,
  fontFamily: "inherit"
};
var colorStyle = {
  width: 32,
  height: 24,
  border: "1px solid #1e2035",
  borderRadius: 4,
  padding: 0,
  cursor: "pointer",
  background: "none"
};
var buttonStyle = {
  width: "100%",
  padding: "7px 12px",
  border: "1px solid #1e2035",
  borderRadius: 5,
  background: "transparent",
  color: "#8a90a8",
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "monospace",
  transition: "all 0.15s"
};
export {
  InspectorPanel,
  ParamPanel,
  TektoApp,
  Toolbar,
  useParams,
  useScene,
  useSceneObjects,
  useSelection
};
