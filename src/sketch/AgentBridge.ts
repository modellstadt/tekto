/**
 * The agent bridge — `window.__tekto`, one per page.
 *
 * Agents drive a browser (tools/snap.mjs) and need the same handle on every kind of app:
 * `sketch()`, `sketch2d()` and `appShell()` all install it. Through it an agent can read
 * the controls (`schema`), set them by label (`setParams`), move the camera, and take a
 * snapshot — the same bundle a person saves with ✎ Markup: `view.png`, `clean.png` and
 * `markup.json`, which now also carries what the app logged and every error the page hit.
 *
 * An app that keeps a `Doc` shares it with `agentDoc(doc, { schema, check })`: then
 * `__tekto.doc` reads the records and applies patches as one undo step, and with the markup
 * dev-server plugin (`tekto/markup-vite`) every call here also reaches this tab from outside,
 * through `POST /__tekto/agent/call` — what `tools/mcp.mjs` gives an agent as tools.
 *
 * No three.js here (`sketch2d` and `tekto/2d` use it): the 3D harnesses pass in what the
 * renderer knows through small structural interfaces.
 */
import { applyPatch, type Doc, type DocPatch, type PatchResult } from "../collab/Doc";
import type { RecordSchema } from "../collab/recordSchema";
import type { ParamStore, ParamDef } from "../gui/Params";
import type { Scene } from "../scene/Scene";
import type { MarkupBundle, MarkupCaptureOptions, MarkupObjectRef } from "./Markup";
import type { Commands } from "../gui/Commands";

/** Which app harness installed the bridge. */
export type AgentHarness = "sketch" | "sketch2d" | "appShell";

/** One control as an agent sees it: the name to pass to `setParams`, its range and value. */
export interface ParamInfo {
  name: string;
  key: string;
  type: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: unknown[];
  default?: unknown;
  value: unknown;
}

export interface AgentBridgeHost {
  /** The app instance (tests and agents may reach in). */
  owner: unknown;
  harness: AgentHarness;
  store: ParamStore<any>;
  /** Build the bundle — saving it unless `save: false` (see `saveBundle`). */
  snapshot(opts?: MarkupCaptureOptions): Promise<MarkupBundle>;
  /** 3D harnesses only. */
  camera?(pos: number[], target?: number[]): void;
  /** 3D harnesses only: cut the view (a plan at `coordinate` on "z", …), or `null` to stop. */
  section?(section: { axis: "x" | "y" | "z"; at?: number; coordinate?: number; flip?: boolean } | null): void;
  /** The app's commands, listed and run by id for agents. */
  commands?: Commands;
}

export interface AgentBridge {
  /** Errors the page logged since the bridge was installed: window errors, rejected
   *  promises, `console.error` (where `sketch()` reports exceptions from the sketch). */
  errors(): string[];
  dispose(): void;
}

const MAX_ERRORS = 50;

/** Install `window.__tekto` for this app; the last app on a page wins. */
export function installAgentBridge(host: AgentBridgeHost): AgentBridge {
  const errors: string[] = [];
  const record = (msg: string) => { if (errors.length < MAX_ERRORS) errors.push(msg.slice(0, 500)); };
  const onError = (e: ErrorEvent) => record(`${e.message}${e.filename ? ` (${e.filename}:${e.lineno})` : ""}`);
  const onRejection = (e: PromiseRejectionEvent) => record(`unhandled rejection: ${String(e.reason?.stack ?? e.reason)}`);
  const origError = console.error;
  const wrapped = (...args: unknown[]) => {
    record(args.map(a => (a instanceof Error ? a.stack ?? a.message : typeof a === "string" ? a : safeJson(a))).join(" "));
    origError.apply(console, args);
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  console.error = wrapped;

  const store = host.store;
  (window as any).__tekto = {
    owner: host.owner,
    harness: host.harness,
    snapshot: (opts?: MarkupCaptureOptions) => host.snapshot(opts),
    params: () => store.getAll(),
    paramNames: () => store.names(),
    schema: () => paramSchema(store),
    errors: () => [...errors],
    // By label ("Radius"), "Group:Label" or key. Names that match nothing, or more than
    // one control, are reported (and warned about) instead of silently dropped.
    setParams: (p: Record<string, unknown>) => {
      const r = store.setByName(p);
      if (r.unknown.length || r.ambiguous.length) {
        console.warn("tekto setParams:", [
          ...r.unknown.map(n => `no control named "${n}"`),
          ...r.ambiguous.map(a => `"${a.name}" matches ${a.keys.length} controls — use Group:Label`),
        ].join("; "), "| controls:", store.names().join(", "));
      }
      return r;
    },
    ...(host.camera ? { camera: host.camera } : {}),
    ...(host.section ? { section: host.section } : {}),
    // What the app can do — undo, delete, the views … — by id, as a person would by key.
    commands: () => host.commands?.list() ?? [],
    run: (id: string) => host.commands ? host.commands.run(id) : Promise.resolve(false),
    // The document the app shares (`agentDoc`), or undefined.
    get doc() { return sharedDoc ?? undefined; },
  };
  connectRelay();

  return {
    errors: () => [...errors],
    dispose() {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      if (console.error === wrapped) console.error = origError;
      if ((window as any).__tekto?.owner === host.owner) delete (window as any).__tekto;
    },
  };
}

// ── A shared document ──────────────────────────────────────────────────────────

/** Something an app's check found: how bad, what, and on which records (`"walls/w3"`). */
export interface AgentIssue {
  severity: "error" | "warning";
  code?: string;
  message: string;
  keys?: string[];
}

/** What an app shares with agents through `agentDoc`. */
export interface AgentDocOptions {
  /** Each collection's JSON Schema: a patch with a record that breaks it is rejected whole. */
  schema?: Record<string, RecordSchema>;
  /** What is wrong now, e.g. `() => house.issues`; asked after every patch. */
  check?: () => readonly AgentIssue[];
}

/** `__tekto.doc`: the document an app shares, as an agent reads and edits it. */
export interface AgentDocApi {
  readonly name: string;
  /** Collection → number of records. */
  collections(): Record<string, number>;
  /** The schema the app gave, or null. */
  schema(): Record<string, RecordSchema> | null;
  /** Collection → id → record; one collection, or all. */
  records(collection?: string): Record<string, Record<string, unknown>>;
  /** Apply a patch as one undo step (or nothing, with the reasons), then run the app's check. */
  apply(patch: DocPatch, label?: string): Promise<PatchResult & { issues: AgentIssue[] }>;
  /** The app's check, once the document's changes have been drawn. */
  check(): Promise<AgentIssue[]>;
  undo(): boolean;
  redo(): boolean;
}

let sharedDoc: AgentDocApi | null = null;

/** After the app has reacted to a change (its bindings rebuild in a microtask or on the next turn). */
const settled = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Share a document with agents: `window.__tekto.doc` reads its records and applies patches
 * (`{ set, update, remove }` by `"collection/id"`) as one undo step — checked against
 * `schema` first, answered with `check()`'s issues after. With `tekto/markup-vite` in the dev
 * server, the same calls reach this tab from outside (`tools/mcp.mjs`). Returns a function
 * that stops sharing. One document per page: the last call wins.
 *
 *   agentDoc(doc, { schema: BUILDING_SCHEMA, check: () => house.issues });
 */
export function agentDoc(doc: Doc<any>, opts: AgentDocOptions = {}): () => void {
  const collections = () => doc.toJSON().collections;
  const api: AgentDocApi = {
    name: doc.name,
    collections: () => Object.fromEntries(Object.entries(collections()).map(([c, rows]) => [c, Object.keys(rows).length])),
    schema: () => opts.schema ?? null,
    records: (collection) => {
      const all = collections() as Record<string, Record<string, Record<string, unknown>>>;
      return collection ? { [collection]: all[collection] ?? {} } : all;
    },
    apply: async (patch, label) => {
      const result = applyPatch(doc, patch, { schema: opts.schema, label: label ?? "Agent edit" });
      await settled();
      return { ...result, issues: [...(opts.check?.() ?? [])] };
    },
    check: async () => { await settled(); return [...(opts.check?.() ?? [])]; },
    undo: () => doc.undo(),
    redo: () => doc.redo(),
  };
  sharedDoc = api;
  return () => { if (sharedDoc === api) sharedDoc = null; };
}

// ── The relay: calls from outside the page, through the dev server ──────────────

let relay: EventSource | null = null;

/**
 * Listen for calls the dev server relays (`tekto/markup-vite` marks the page with
 * `<meta name="tekto-agent-relay">`). Browsers driven by automation (snap, tests) stay out
 * unless the URL asks with `agent-relay`, so a headless snapshot never takes the calls meant
 * for the tab a person has open.
 */
function connectRelay(): void {
  if (relay || typeof document === "undefined" || typeof EventSource === "undefined") return;
  const base = document.querySelector<HTMLMetaElement>('meta[name="tekto-agent-relay"]')?.content;
  if (!base) return;
  if (navigator.webdriver && !/[?&]agent-relay\b/.test(location.search)) return;
  relay = new EventSource(`${base}/events?title=${encodeURIComponent(document.title)}&url=${encodeURIComponent(location.href)}`);
  relay.addEventListener("call", (e) => {
    const { id, op, args } = JSON.parse((e as MessageEvent).data) as { id: string; op: string; args?: Record<string, unknown> };
    void runRelayed(op, args ?? {}).then(
      (result) => ({ id, result }),
      (err) => ({ id, error: err instanceof Error ? err.message : String(err) }),
    ).then((body) => fetch(`${base}/result`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }))
      .catch(() => { /* the dev server went away; the caller times out */ });
  });
}

/** One relayed call, run against this page's `__tekto`. */
async function runRelayed(op: string, args: Record<string, unknown>): Promise<unknown> {
  const t = (window as any).__tekto;
  if (!t) throw new Error("this page has no tekto app (no window.__tekto)");
  const doc: AgentDocApi | undefined = t.doc;
  const needDoc = () => { if (!doc) throw new Error("this app shares no document (agentDoc)"); return doc; };
  switch (op) {
    case "info": return {
      title: document.title, url: location.href, harness: t.harness,
      doc: doc ? { name: doc.name, collections: doc.collections(), schema: doc.schema() } : null,
      controls: t.schema(), commands: t.commands(), errors: t.errors(),
    };
    case "records": return needDoc().records(args.collection as string | undefined);
    case "apply": return needDoc().apply(args.patch as DocPatch, args.label as string | undefined);
    case "check": return needDoc().check();
    case "undo": return { undone: needDoc().undo() };
    case "redo": return { redone: needDoc().redo() };
    case "setParams": return t.setParams(args.params ?? {});
    case "run": return { ran: await t.run(String(args.id)) };
    case "camera":
      if (!t.camera) throw new Error("this app has no 3D camera");
      t.camera(args.position as number[], args.target as number[] | undefined);
      return { ok: true };
    case "section":
      if (!t.section) throw new Error("this app has no 3D view to cut");
      t.section(args.axis ? { axis: args.axis, at: args.at, coordinate: args.coordinate, flip: args.flip } : null);
      return { ok: true };
    case "snapshot": {
      const b = await t.snapshot({ note: args.note as string | undefined, save: args.save === true, label: "agent" }) as MarkupBundle;
      const m = b.markup as unknown as Record<string, unknown>;
      return { viewPng: b.viewPng, camera: m.camera ?? null, scene: m.scene ?? null, logs: m.logs ?? [], errors: m.errors ?? [] };
    }
    default: throw new Error(`unknown call "${op}" (info, records, apply, check, undo, redo, setParams, run, camera, section, snapshot)`);
  }
}

/** Every control: the name `setParams` takes, its type, range, options, default and value. */
export function paramSchema(store: ParamStore<any>): ParamInfo[] {
  const schema = store.getSchema() as Record<string, ParamDef>;
  const names = store.names();
  const values = store.getAll();
  return Object.keys(schema).map((key, i) => {
    const d = schema[key] as ParamDef & { min?: number; max?: number; step?: number; options?: unknown[]; default?: unknown };
    return {
      name: names[i], key, type: d.type,
      ...(d.label ? { label: d.label } : {}),
      ...(d.min !== undefined ? { min: d.min } : {}),
      ...(d.max !== undefined ? { max: d.max } : {}),
      ...(d.step !== undefined ? { step: d.step } : {}),
      ...(d.options !== undefined ? { options: d.options } : {}),
      ...(d.default !== undefined ? { default: d.default } : {}),
      value: values[key],
    };
  });
}

// ── Scene summary (3D harnesses) ─────────────────────────────────────────

/** What the summary needs from a renderer: structurally a ThreeRenderer. */
export interface SceneSummaryRenderer {
  isObjectShown(id: string): boolean;
  objectBounds(id: string): { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } | null;
  cameraState(): { position: number[]; target: number[]; [k: string]: unknown };
}

/** A scene object as Markup reports it: type, layer, label, pick tag, colour, and the
 *  source line that created it when the harness tracks sources. */
export function describeSceneObject(scene: Scene, id: string, src?: string): MarkupObjectRef | null {
  const o = scene.get(id);
  if (!o) return null;
  return {
    id, type: o.type,
    ...(o.style.layer ? { layer: o.style.layer } : {}),
    ...(o.style.label ? { label: o.style.label } : {}),
    ...(o.pickTag ? { tag: o.pickTag } : {}),
    ...(typeof o.style.color === "string" ? { color: o.style.color } : {}),
    ...(o.key ? { key: o.key } : {}),
    ...(src ? { src } : {}),
  };
}

/** Camera plus the shown objects grouped by (layer, label, type, source line, colour). */
export function sceneSummary(
  scene: Scene,
  renderer: SceneSummaryRenderer,
  describe: (id: string) => MarkupObjectRef | null,
): Record<string, unknown> {
  const groups = new Map<string, { layer?: string; label?: string; type: string; src?: string; color?: string; count: number; ids: string[]; min: number[]; max: number[] }>();
  const objects: unknown[] = [];
  const meshIssues: { id: string; label?: string; layer?: string; src?: string; issues: string[] }[] = [];
  let meshesWithIssues = 0;
  let shown = 0;
  for (const o of scene.all()) {
    if (!renderer.isObjectShown(o.id)) continue;
    // A light has no geometry: its place is its bounds, so a snapshot lists it.
    const b = renderer.objectBounds(o.id) ?? (o.type === "light" && o.position ? { min: o.position, max: o.position } : null);
    if (!b) continue;
    shown++;
    const d = describe(o.id)!;
    // Mesh.validate(): what silently breaks volumes, culling and exports (see Mesh.ts).
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
    for (let i = 0; i < 3; i++) { g.min[i] = Math.min(g.min[i], lo[i]); g.max[i] = Math.max(g.max[i], hi[i]); }
    if (objects.length < 150) objects.push({ ...d, bounds: [lo, hi].map((v) => v.map((n) => +n.toFixed(4))) });
  }
  const r4 = (v: number[]) => v.map((n) => +n.toFixed(4));
  const cam = renderer.cameraState();
  return {
    camera: { ...cam, position: r4(cam.position), target: r4(cam.target) },
    scene: {
      shownObjects: shown,
      meshesWithIssues,
      meshIssues,
      groups: [...groups.values()].map(({ min, max, ...g }) => ({ ...g, bounds: [r4(min), r4(max)] })),
      ...(shown <= 150 ? { objects } : {}),
    },
  };
}

// ── Overlays: 2D views laid over the 3D one ─────────────────────────────

/**
 * A new layer over a 3D view (`viewportEl`, inside `wrap`): above the canvas and any layer
 * added before, under what comes after the viewport (status line, ✎ Markup). For a 2D view —
 * a `SheetCanvas` — over the model. Hide it to show the 3D view again.
 */
export function addOverlay(viewportEl: HTMLElement, existing: HTMLElement[]): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "position:absolute;inset:0;";
  (existing[existing.length - 1] ?? viewportEl).after(el);
  existing.push(el);
  return el;
}

export { snapshotWithOverlays } from "../render/snapshot";

// ── Bundles without marks (sketch2d, appShell) ───────────────────────────

/** A snapshot bundle for a harness without the ✎ overlay: the picture plus context. */
export async function plainBundle(opts: MarkupCaptureOptions & {
  title: string;
  harness: AgentHarness;
  png: string;
  viewport: { width: number; height: number };
  context: Record<string, unknown>;
}): Promise<MarkupBundle> {
  const markup = {
    format: "tekto-markup/1",
    createdAt: new Date().toISOString(),
    sketch: { title: opts.title, url: location.href },
    harness: opts.harness,
    instruction: opts.note ?? "",
    viewport: { ...opts.viewport, dpr: window.devicePixelRatio || 1 },
    ...opts.context,
    marks: [],
    files: { view: "view.png", clean: "clean.png" },
  };
  const bundle: MarkupBundle = { markup, viewPng: opts.png, cleanPng: opts.png };
  if (opts.save !== false) bundle.dir = await saveBundle(bundle, opts.label ?? slug(opts.title));
  return bundle;
}

// ── Saving ───────────────────────────────────────────────────────────────

const ENDPOINT = "/__tekto/markup";

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sketch";
}

/** POST the bundle to the dev server (tools/markup-vite-plugin.mjs writes it to
 *  `.tekto/markup/`); without the plugin, download the three files instead. */
export async function saveBundle(b: MarkupBundle, label: string): Promise<string | undefined> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, markup: b.markup, viewPng: b.viewPng, cleanPng: b.cleanPng }),
    });
    if (res.ok) return (await res.json()).dir as string;
  } catch { /* no dev server — fall through to download */ }
  const dl = (name: string, href: string) => { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); };
  dl(`${label}-view.png`, b.viewPng);
  dl(`${label}-clean.png`, b.cleanPng);
  dl(`${label}-markup.json`, URL.createObjectURL(new Blob([JSON.stringify(b.markup, null, 2)], { type: "application/json" })));
  return undefined;
}

function safeJson(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}
