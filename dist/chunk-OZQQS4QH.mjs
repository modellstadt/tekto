import {
  applyPatch,
  download
} from "./chunk-56LGGW6L.mjs";

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

// src/render/snapshot.ts
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
function downloadSnapshot(renderer, wrap, fileName = "view.png") {
  const url = snapshotWithOverlays(renderer, wrap);
  const bytes = Uint8Array.from(atob(url.slice(url.indexOf(",") + 1)), (c) => c.charCodeAt(0));
  download(bytes, fileName, { stamp: true, type: "image/png" });
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
    ...host.section ? { section: host.section } : {},
    // The program as the steps it ran: inputs, outputs, times, links, and a person's notes on steps.
    steps: () => host.steps?.() ?? null,
    // What the app can do — undo, delete, the views … — by id, as a person would by key.
    commands: () => host.commands?.list() ?? [],
    run: (id) => host.commands ? host.commands.run(id) : Promise.resolve(false),
    // The document the app shares (`agentDoc`), or undefined.
    get doc() {
      return sharedDoc ?? void 0;
    },
    // The notes people left on the model (the app's notes layer, or `agentDoc`'s), or undefined.
    get notes() {
      return host.notes?.() ?? sharedNotes ?? void 0;
    }
  };
  connectRelay();
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
var sharedDoc = null;
var sharedNotes = null;
var announceAgent = null;
var settled = () => new Promise((r) => setTimeout(r, 0));
function agentDoc(doc, opts = {}) {
  const collections = () => doc.toJSON().collections;
  const api = {
    name: doc.name,
    collections: () => Object.fromEntries(Object.entries(collections()).map(([c, rows]) => [c, Object.keys(rows).length])),
    schema: () => opts.schema ?? null,
    records: (collection) => {
      const all = collections();
      return collection ? { [collection]: all[collection] ?? {} } : all;
    },
    apply: async (patch, label) => {
      const result = applyPatch(doc, patch, { schema: opts.schema, label: label ?? "Agent edit" });
      await settled();
      return { ...result, issues: [...opts.check?.() ?? []] };
    },
    check: async () => {
      await settled();
      return [...opts.check?.() ?? []];
    },
    undo: () => doc.undo(),
    redo: () => doc.redo()
  };
  sharedDoc = api;
  if (opts.notes) sharedNotes = opts.notes;
  const announce = (agent) => doc.store.setPresence({ agent });
  announceAgent = announce;
  return () => {
    if (sharedDoc === api) sharedDoc = null;
    if (sharedNotes === opts.notes) sharedNotes = null;
    if (announceAgent === announce) announceAgent = null;
  };
}
var AGENT_LINGER_MS = 8e3;
var agentChip = null;
var agentTimer;
function showAgent(name, doing) {
  if (!agentChip) {
    agentChip = document.createElement("div");
    agentChip.dataset.tektoAgent = "";
    agentChip.style.cssText = "position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:1000;display:flex;gap:7px;align-items:center;max-width:340px;padding:6px 11px;border-radius:14px;background:rgba(17,19,26,.92);border:1px solid rgba(255,255,255,.18);color:#e8ebf0;font:500 11px/1.3 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;";
    const dot = document.createElement("span");
    dot.style.cssText = "width:7px;height:7px;border-radius:50%;background:#ffb020;flex:none;";
    const text = document.createElement("span");
    text.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    agentChip.append(dot, text);
  }
  agentChip.lastChild.textContent = `${name} \xB7 ${doing}`;
  if (!agentChip.isConnected) document.body.appendChild(agentChip);
  announceAgent?.({ name, doing, at: Date.now() });
  clearTimeout(agentTimer);
  agentTimer = setTimeout(() => {
    agentChip?.remove();
    announceAgent?.(null);
  }, AGENT_LINGER_MS);
}
function doingOf(op, args) {
  switch (op) {
    case "apply":
      return typeof args.label === "string" && args.label ? args.label : "editing";
    case "undo":
      return "undo";
    case "redo":
      return "redo";
    case "noteReply":
      return "answering a note";
    case "noteResolve":
      return "resolving a note";
    case "notes":
      return "reading the notes";
    case "snapshot":
      return "looking at the view";
    case "setParams":
      return "setting controls";
    case "run":
      return `running ${String(args.id)}`;
    default:
      return "reading the model";
  }
}
var relay = null;
function connectRelay() {
  if (relay || typeof document === "undefined" || typeof EventSource === "undefined") return;
  const base = document.querySelector('meta[name="tekto-agent-relay"]')?.content;
  if (!base) return;
  if (navigator.webdriver && !/[?&]agent-relay\b/.test(location.search)) return;
  relay = new EventSource(`${base}/events?title=${encodeURIComponent(document.title)}&url=${encodeURIComponent(location.href)}`);
  relay.addEventListener("call", (e) => {
    const { id, op, args, agent } = JSON.parse(e.data);
    void runRelayed(op, args ?? {}, agent || "Agent").then(
      (result) => ({ id, result }),
      (err) => ({ id, error: err instanceof Error ? err.message : String(err) })
    ).then((body) => fetch(`${base}/result`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).catch(() => {
    });
  });
}
async function runRelayed(op, args, agent) {
  const t = window.__tekto;
  if (!t) throw new Error("this page has no tekto app (no window.__tekto)");
  const doc = t.doc;
  const notes = t.notes;
  const needDoc = () => {
    if (!doc) throw new Error("this app shares no document (agentDoc)");
    return doc;
  };
  const needNotes = () => {
    if (!notes) throw new Error("this app keeps no notes (appShell({ notes }) or agentDoc(doc, { notes }))");
    return notes;
  };
  const needText = () => {
    const text = String(args.text ?? "").trim();
    if (!text) throw new Error("text is required");
    return text;
  };
  showAgent(agent, doingOf(op, args));
  switch (op) {
    case "info": {
      const all = notes?.describe("all") ?? [];
      return {
        title: document.title,
        url: location.href,
        harness: t.harness,
        doc: doc ? { name: doc.name, collections: doc.collections(), schema: doc.schema() } : null,
        notes: notes ? { open: all.filter((n) => n.status === "open").length, done: all.filter((n) => n.status === "done").length } : null,
        controls: t.schema(),
        commands: t.commands(),
        errors: t.errors()
      };
    }
    case "notes":
      return needNotes().describe(args.status === "all" ? "all" : "open");
    case "noteReply":
      needNotes().reply(String(args.id), needText(), agent);
      return { ok: true };
    case "noteResolve":
      needNotes().resolve(String(args.id), String(args.text ?? "").trim() || void 0, agent);
      return { ok: true, open: needNotes().describe("open").length };
    case "records":
      return needDoc().records(args.collection);
    case "apply":
      return needDoc().apply(args.patch, args.label);
    case "check":
      return needDoc().check();
    case "undo":
      return { undone: needDoc().undo() };
    case "redo":
      return { redone: needDoc().redo() };
    case "setParams":
      return t.setParams(args.params ?? {});
    case "run":
      return { ran: await t.run(String(args.id)) };
    case "camera":
      if (!t.camera) throw new Error("this app has no 3D camera");
      t.camera(args.position, args.target);
      return { ok: true };
    case "steps":
      return t.steps?.() ?? null;
    case "section":
      if (!t.section) throw new Error("this app has no 3D view to cut");
      t.section(args.axis ? { axis: args.axis, at: args.at, coordinate: args.coordinate, flip: args.flip } : null);
      return { ok: true };
    case "snapshot": {
      const b = await t.snapshot({ note: args.note, save: args.save === true, label: "agent" });
      const m = b.markup;
      return { viewPng: b.viewPng, camera: m.camera ?? null, scene: m.scene ?? null, logs: m.logs ?? [], errors: m.errors ?? [] };
    }
    default:
      throw new Error(`unknown call "${op}" (info, records, apply, check, notes, noteReply, noteResolve, undo, redo, setParams, run, camera, section, steps, snapshot)`);
  }
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
function callSite() {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 40;
  const stack = new Error().stack ?? "";
  Error.stackTraceLimit = limit;
  for (const line of stack.split("\n").slice(1)) {
    const m = line.match(/(https?:\/\/[^\s)]+):(\d+):(\d+)/) ?? line.match(/@(\S+):(\d+):(\d+)$/);
    if (!m) continue;
    const url = m[1];
    if (/\/tekto\/(src|dist)\/|node_modules|\/@vite\/|\/@fs\/.*\/tekto\/src\//.test(url)) continue;
    return `${url}:${m[2]}:${m[3]}`;
  }
  return void 0;
}

export {
  getTheme,
  snapshotWithOverlays,
  downloadSnapshot,
  installAgentBridge,
  agentDoc,
  describeSceneObject,
  sceneSummary,
  addOverlay,
  plainBundle,
  slug,
  saveBundle,
  callSite
};
