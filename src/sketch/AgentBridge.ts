/**
 * The agent bridge — `window.__tekto`, one per page.
 *
 * Agents drive a browser (tools/snap.mjs) and need the same handle on every kind of app:
 * `sketch()`, `sketch2d()` and `appShell()` all install it. Through it an agent can read
 * the controls (`schema`), set them by label (`setParams`), move the camera, and take a
 * snapshot — the same bundle a person saves with ✎ Markup: `view.png`, `clean.png` and
 * `markup.json`, which now also carries what the app logged and every error the page hit.
 *
 * No three.js here (`sketch2d` and `tekto/2d` use it): the 3D harnesses pass in what the
 * renderer knows through small structural interfaces.
 */
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
    // What the app can do — undo, delete, the views … — by id, as a person would by key.
    commands: () => host.commands?.list() ?? [],
    run: (id: string) => host.commands ? host.commands.run(id) : Promise.resolve(false),
  };

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
    const b = renderer.objectBounds(o.id);
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

/** The 3D view as a PNG, with every visible overlay canvas (`data-tekto-overlay`) in `wrap`
 *  drawn over it where it sits — what a person sees, for snapshots and ✎ Markup. */
export function snapshotWithOverlays(renderer: { snapshotPng(): string; readonly canvasEl: HTMLCanvasElement }, wrap: HTMLElement): string {
  const base = renderer.snapshotPng();
  const shown = [...wrap.querySelectorAll<HTMLCanvasElement>("canvas[data-tekto-overlay]")].filter(c => c.getClientRects().length > 0);
  if (!shown.length) return base;
  const src = renderer.canvasEl, r0 = src.getBoundingClientRect(), k = src.width / Math.max(1, r0.width);
  const out = document.createElement("canvas");
  out.width = src.width; out.height = src.height;
  const g = out.getContext("2d")!;
  g.drawImage(src, 0, 0);                     // drawn in the same task as the render, so the buffer still holds it
  for (const c of shown) {
    const r = c.getBoundingClientRect();
    g.drawImage(c, (r.left - r0.left) * k, (r.top - r0.top) * k, r.width * k, r.height * k);
  }
  return out.toDataURL("image/png");
}

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
