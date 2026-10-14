// src/gui/theme.ts
var DARK = {
  isDark: true,
  bg: "#07080e",
  panelBg: "#0c0d16",
  popupBg: "#0d0f1e",
  border: "#16182a",
  controlBorder: "#1e2140",
  text: "#b8bdd4",
  textDim: "#7a80a0",
  textFaint: "#5a6080",
  accent: "#ffffff",
  hoverBg: "rgba(255,255,255,.06)",
  fieldBg: "#07080e",
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
var LIGHT = {
  isDark: false,
  bg: "#f4f5f8",
  panelBg: "#ffffff",
  popupBg: "#f5f6fa",
  border: "#e0e2ea",
  controlBorder: "#d0d3de",
  text: "#2a2d3a",
  textDim: "#5a6080",
  textFaint: "#8a8fa0",
  accent: "#16182c",
  hoverBg: "rgba(0,0,0,.05)",
  fieldBg: "#f4f5f8",
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
function getTheme(mode = "dark") {
  return mode === "light" ? LIGHT : DARK;
}

// src/sketch/AgentBridge.ts
var MAX_ERRORS = 50;
function installAgentBridge(host) {
  const errors = [];
  const record = (msg) => {
    if (errors.length < MAX_ERRORS) errors.push(msg.slice(0, 500));
  };
  const onError = (e) => record(`${e.message}${e.filename ? ` (${e.filename}:${e.lineno})` : ""}`);
  const onRejection = (e) => record(`unhandled rejection: ${String(e.reason?.stack ?? e.reason)}`);
  const origError = console.error;
  const wrapped = (...args) => {
    record(args.map((a) => a instanceof Error ? a.stack ?? a.message : typeof a === "string" ? a : safeJson(a)).join(" "));
    origError.apply(console, args);
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  console.error = wrapped;
  const store = host.store;
  window.__tekto = {
    owner: host.owner,
    harness: host.harness,
    snapshot: (opts) => host.snapshot(opts),
    params: () => store.getAll(),
    paramNames: () => store.names(),
    schema: () => paramSchema(store),
    errors: () => [...errors],
    // By label ("Radius"), "Group:Label" or key. Names that match nothing, or more than
    // one control, are reported (and warned about) instead of silently dropped.
    setParams: (p) => {
      const r = store.setByName(p);
      if (r.unknown.length || r.ambiguous.length) {
        console.warn("tekto setParams:", [
          ...r.unknown.map((n) => `no control named "${n}"`),
          ...r.ambiguous.map((a) => `"${a.name}" matches ${a.keys.length} controls \u2014 use Group:Label`)
        ].join("; "), "| controls:", store.names().join(", "));
      }
      return r;
    },
    ...host.camera ? { camera: host.camera } : {},
    // What the app can do — undo, delete, the views … — by id, as a person would by key.
    commands: () => host.commands?.list() ?? [],
    run: (id) => host.commands ? host.commands.run(id) : Promise.resolve(false)
  };
  return {
    errors: () => [...errors],
    dispose() {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      if (console.error === wrapped) console.error = origError;
      if (window.__tekto?.owner === host.owner) delete window.__tekto;
    }
  };
}
function paramSchema(store) {
  const schema = store.getSchema();
  const names = store.names();
  const values = store.getAll();
  return Object.keys(schema).map((key, i) => {
    const d = schema[key];
    return {
      name: names[i],
      key,
      type: d.type,
      ...d.label ? { label: d.label } : {},
      ...d.min !== void 0 ? { min: d.min } : {},
      ...d.max !== void 0 ? { max: d.max } : {},
      ...d.step !== void 0 ? { step: d.step } : {},
      ...d.options !== void 0 ? { options: d.options } : {},
      ...d.default !== void 0 ? { default: d.default } : {},
      value: values[key]
    };
  });
}
function describeSceneObject(scene, id, src) {
  const o = scene.get(id);
  if (!o) return null;
  return {
    id,
    type: o.type,
    ...o.style.layer ? { layer: o.style.layer } : {},
    ...o.style.label ? { label: o.style.label } : {},
    ...o.pickTag ? { tag: o.pickTag } : {},
    ...typeof o.style.color === "string" ? { color: o.style.color } : {},
    ...o.key ? { key: o.key } : {},
    ...src ? { src } : {}
  };
}
function sceneSummary(scene, renderer, describe) {
  const groups = /* @__PURE__ */ new Map();
  const objects = [];
  const meshIssues = [];
  let meshesWithIssues = 0;
  let shown = 0;
  for (const o of scene.all()) {
    if (!renderer.isObjectShown(o.id)) continue;
    const b = renderer.objectBounds(o.id) ?? (o.type === "light" && o.position ? { min: o.position, max: o.position } : null);
    if (!b) continue;
    shown++;
    const d = describe(o.id);
    if (o.mesh && typeof o.mesh.validate === "function") {
      const v = o.mesh.validate();
      if (!v.valid) {
        meshesWithIssues++;
        if (meshIssues.length < 20) meshIssues.push({ id: o.id, label: d.label, layer: d.layer, src: d.src, issues: v.issues });
      }
    }
    const key = [d.layer, d.label, d.type, d.src, d.color].join("|");
    let g = groups.get(key);
    if (!g) {
      g = { layer: d.layer, label: d.label, type: d.type, src: d.src, color: d.color, count: 0, ids: [], min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      groups.set(key, g);
    }
    g.count++;
    if (g.ids.length < 10) g.ids.push(o.id);
    const lo = [b.min.x, b.min.y, b.min.z], hi = [b.max.x, b.max.y, b.max.z];
    for (let i = 0; i < 3; i++) {
      g.min[i] = Math.min(g.min[i], lo[i]);
      g.max[i] = Math.max(g.max[i], hi[i]);
    }
    if (objects.length < 150) objects.push({ ...d, bounds: [lo, hi].map((v) => v.map((n) => +n.toFixed(4))) });
  }
  const r4 = (v) => v.map((n) => +n.toFixed(4));
  const cam = renderer.cameraState();
  return {
    camera: { ...cam, position: r4(cam.position), target: r4(cam.target) },
    scene: {
      shownObjects: shown,
      meshesWithIssues,
      meshIssues,
      groups: [...groups.values()].map(({ min, max, ...g }) => ({ ...g, bounds: [r4(min), r4(max)] })),
      ...shown <= 150 ? { objects } : {}
    }
  };
}
function addOverlay(viewportEl, existing) {
  const el = document.createElement("div");
  el.style.cssText = "position:absolute;inset:0;";
  (existing[existing.length - 1] ?? viewportEl).after(el);
  existing.push(el);
  return el;
}
function snapshotWithOverlays(renderer, wrap) {
  const base = renderer.snapshotPng();
  const shown = [...wrap.querySelectorAll("canvas[data-tekto-overlay]")].filter((c) => c.getClientRects().length > 0);
  if (!shown.length) return base;
  const src = renderer.canvasEl, r0 = src.getBoundingClientRect(), k = src.width / Math.max(1, r0.width);
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const g = out.getContext("2d");
  g.drawImage(src, 0, 0);
  for (const c of shown) {
    const r = c.getBoundingClientRect();
    g.drawImage(c, (r.left - r0.left) * k, (r.top - r0.top) * k, r.width * k, r.height * k);
  }
  return out.toDataURL("image/png");
}
async function plainBundle(opts) {
  const markup = {
    format: "tekto-markup/1",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    sketch: { title: opts.title, url: location.href },
    harness: opts.harness,
    instruction: opts.note ?? "",
    viewport: { ...opts.viewport, dpr: window.devicePixelRatio || 1 },
    ...opts.context,
    marks: [],
    files: { view: "view.png", clean: "clean.png" }
  };
  const bundle = { markup, viewPng: opts.png, cleanPng: opts.png };
  if (opts.save !== false) bundle.dir = await saveBundle(bundle, opts.label ?? slug(opts.title));
  return bundle;
}
var ENDPOINT = "/__tekto/markup";
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sketch";
}
async function saveBundle(b, label) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, markup: b.markup, viewPng: b.viewPng, cleanPng: b.cleanPng })
    });
    if (res.ok) return (await res.json()).dir;
  } catch {
  }
  const dl = (name, href) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  };
  dl(`${label}-view.png`, b.viewPng);
  dl(`${label}-clean.png`, b.cleanPng);
  dl(`${label}-markup.json`, URL.createObjectURL(new Blob([JSON.stringify(b.markup, null, 2)], { type: "application/json" })));
  return void 0;
}
function safeJson(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export {
  getTheme,
  installAgentBridge,
  describeSceneObject,
  sceneSummary,
  addOverlay,
  snapshotWithOverlays,
  plainBundle,
  slug,
  saveBundle
};
