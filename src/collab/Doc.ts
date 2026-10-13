/**
 * Doc — the document of a retained CAD app: typed records with stable ids, undo/redo,
 * save/open, and (through SharedStore) persistence and shared editing.
 *
 * The rule it is built on: **the document stores decisions, geometry is derived.** A record
 * is plain JSON — a wall's two points and its type, a block's footprint and height — and the
 * app turns records into geometry (see `bindScene`). That keeps everything else simple:
 * saving is JSON, syncing is per record, undo is "write the old value back", and a diff of
 * two versions reads like a list of design decisions.
 *
 * Records live in named collections (`doc.add("walls", {...})`); the id `add` returns is the
 * object's handle for its whole life — through edits, undo, saving and reopening, and in the
 * selection, the scene and Markup. Underneath, each record is one key of a `SharedStore`
 * (`walls/k3f9x2`), so the adapters give persistence for free: `localAdapter` (this browser),
 * `devServerAdapter` (a JSON file an agent can read and edit), `supabaseAdapter` (online,
 * several people), `memoryAdapter` (tests).
 *
 * Undo is per document and per client: it writes the values from before your change back,
 * so the undo itself syncs. Two people editing the same record: the last write wins.
 */
import { SharedStore, memoryAdapter, type CollabAdapter, type SharedRecord, type CollabUser, type CollabEvents, type Presence } from "./SharedStore";

/** What a collection's records look like: collection name → record type. */
export type DocSchema = Record<string, object>;

/** One record that changed. `value` is the new value, `undefined` once removed. */
export interface DocChange<S extends DocSchema = DocSchema> {
  collection: keyof S & string;
  id: string;
  value: S[keyof S] | undefined;
}

/** Where a batch of changes came from: this client, another client, or undo/redo. */
export type DocChangeSource = "local" | "remote" | "history";

export interface DocEditOptions {
  /** Shown as "Undo <label>"; default from the operation ("Add blocks", "Edit blocks"…). */
  label?: string;
  /** Edits with the same key within `coalesceMs` merge into one undo step (a slider drag). */
  coalesce?: string;
  /** Leave this change out of the undo history (view state, imports). */
  undoable?: boolean;
}

export interface DocOptions {
  /** Document name: with a shared adapter, every client using it edits the same records. */
  name: string;
  /** Where records are stored; default `memoryAdapter()` (nothing persists). */
  adapter?: CollabAdapter;
  /** Undo steps kept (default 200). */
  historyLimit?: number;
  /** Window in which edits with the same `coalesce` key merge (default 800 ms). */
  coalesceMs?: number;
}

/** What `toJSON()` writes and `load()` reads: collections of id → record. */
export interface DocJSON {
  format: "tekto-doc/1";
  name: string;
  collections: Record<string, Record<string, unknown>>;
}

interface Step {
  label: string;
  /** key → value before and after the step (null = absent). */
  changes: Map<string, { before: unknown; after: unknown }>;
  coalesce?: string;
  at: number;
}

const SEP = "/";

function newId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
}

/**
 * The document of a retained CAD app: typed records in named collections, each with a stable
 * id; `transact` groups writes into one undo step; `undo`/`redo`; `toJSON`/`load` for Save
 * and Open; persistence and shared editing through the adapter.
 *
 *   const doc = new Doc<{ blocks: Block }>({ name: "site", adapter: localAdapter() });
 *   await doc.ready;
 *   const id = doc.add("blocks", { x: 0, y: 0, w: 4, d: 3, h: 9 });
 *   doc.update("blocks", id, { h: 12 }, { coalesce: "height" });
 *   doc.undo();
 */
export class Doc<S extends DocSchema = DocSchema> {
  readonly name: string;
  /** The record store underneath: presence, broadcasts, sign-in, status. */
  readonly store: SharedStore<unknown>;
  /** Resolves once the stored records are loaded; edit after it. */
  readonly ready: Promise<void>;

  private past: Step[] = [];
  private future: Step[] = [];
  private open: Step | null = null;          // the transaction being written
  private depth = 0;
  private applying: "history" | null = null;
  private pendingKeys = new Set<string>();   // changed during a transaction, emitted once at the end
  private pendingSource: DocChangeSource = "local";
  private listeners = new Set<(changes: DocChange<S>[], source: DocChangeSource) => void>();
  private historyL = new Set<() => void>();
  private historyLimit: number;
  private coalesceMs: number;
  private unsubStore: () => void;

  constructor(opts: DocOptions) {
    this.name = opts.name;
    this.historyLimit = opts.historyLimit ?? 200;
    this.coalesceMs = opts.coalesceMs ?? 800;
    this.store = new SharedStore<unknown>({ doc: opts.name, adapter: opts.adapter ?? memoryAdapter() });
    this.unsubStore = this.store.onChange((keys, source) => {
      const src: DocChangeSource = this.applying ?? source;
      if (this.depth > 0) { for (const k of keys) this.pendingKeys.add(k); this.pendingSource = src; return; }
      this.emit(keys, src);
    });
    this.ready = this.store.connect();
  }

  // ── Reading ──

  get<C extends keyof S & string>(collection: C, id: string): S[C] | undefined {
    return this.store.get(collection + SEP + id) as S[C] | undefined;
  }

  has<C extends keyof S & string>(collection: C, id: string): boolean {
    return this.store.has(collection + SEP + id);
  }

  /** `[id, record]` for every record of a collection, in insertion order. */
  all<C extends keyof S & string>(collection: C): [string, S[C]][] {
    const prefix = collection + SEP;
    return this.store.entries()
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, v]) => [k.slice(prefix.length), v as S[C]]);
  }

  ids<C extends keyof S & string>(collection: C): string[] {
    return this.all(collection).map(([id]) => id);
  }

  count<C extends keyof S & string>(collection: C): number {
    return this.all(collection).length;
  }

  // ── Writing ──

  /** Add a record; returns its id (or uses `id` if given). */
  add<C extends keyof S & string>(collection: C, value: S[C], opts: DocEditOptions & { id?: string } = {}): string {
    if (collection.includes(SEP)) throw new Error(`Doc: a collection name can't contain "${SEP}" (got "${collection}")`);
    const id = opts.id ?? newId();
    if (this.has(collection, id)) throw new Error(`Doc.add: ${collection}${SEP}${id} already exists`);
    this.write(collection + SEP + id, value, opts, `Add ${collection}`);
    return id;
  }

  /**
   * Change a record: an object merges into it (`{ h: 12 }`), a function maps it
   * (`b => ({ ...b, h: b.h * 2 })`). Throws if the record doesn't exist.
   */
  update<C extends keyof S & string>(collection: C, id: string, change: Partial<S[C]> | ((value: S[C]) => S[C]), opts: DocEditOptions = {}): void {
    const cur = this.get(collection, id);
    if (cur === undefined) throw new Error(`Doc.update: ${collection}${SEP}${id} does not exist`);
    const next = typeof change === "function" ? (change as (v: S[C]) => S[C])(cur) : { ...cur, ...change };
    this.write(collection + SEP + id, next, opts, `Edit ${collection}`);
  }

  /** Remove a record (a no-op if it is already gone). */
  remove<C extends keyof S & string>(collection: C, id: string, opts: DocEditOptions = {}): void {
    if (!this.has(collection, id)) return;
    this.write(collection + SEP + id, null, opts, `Delete ${collection}`);
  }

  /**
   * Run several edits as one undo step and one change notification. Nested transactions
   * join the outer one.
   *
   *   doc.transact("Duplicate", () => { for (const id of sel) doc.add("blocks", { ...doc.get("blocks", id)!, x: … }); });
   */
  transact<T>(label: string, fn: () => T, opts: Omit<DocEditOptions, "label"> = {}): T {
    const outer = this.depth === 0;
    if (outer) this.open = { label, changes: new Map(), coalesce: opts.coalesce, at: now() };
    this.depth++;
    try {
      return fn();
    } finally {
      this.depth--;
      if (outer) {
        const step = this.open!;
        this.open = null;
        if (step.changes.size && opts.undoable !== false) this.record(step);
        const keys = [...this.pendingKeys];
        this.pendingKeys.clear();
        if (keys.length) this.emit(keys, this.pendingSource);
      }
    }
  }

  // ── Undo / redo ──

  undo(): boolean { return this.travel(this.past, this.future, "before"); }
  redo(): boolean { return this.travel(this.future, this.past, "after"); }
  canUndo(): boolean { return this.past.length > 0; }
  canRedo(): boolean { return this.future.length > 0; }
  /** "Undo <this>": the label of the step `undo()` would revert. */
  undoLabel(): string | undefined { return this.past[this.past.length - 1]?.label; }
  redoLabel(): string | undefined { return this.future[this.future.length - 1]?.label; }
  /** Forget the history (after Open, or to make a state the new baseline). */
  clearHistory(): void { this.past = []; this.future = []; this.notifyHistory(); }

  // ── Listening ──

  /** Records that changed, once per transaction, and where the change came from. */
  onChange(cb: (changes: DocChange<S>[], source: DocChangeSource) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** The undo/redo history changed (enable or relabel Undo / Redo). */
  onHistory(cb: () => void): () => void {
    this.historyL.add(cb);
    return () => this.historyL.delete(cb);
  }

  // ── Save / Open ──

  toJSON(): DocJSON {
    const collections: Record<string, Record<string, unknown>> = {};
    for (const [key, value] of this.store.entries()) {
      const i = key.indexOf(SEP);
      if (i < 0) continue;
      (collections[key.slice(0, i)] ??= {})[key.slice(i + 1)] = value;
    }
    return { format: "tekto-doc/1", name: this.name, collections };
  }

  /**
   * Replace the document's records with `json` (from `toJSON()`): records not in it are
   * removed. Not undoable by default — Open starts a new history — pass `undoable: true`
   * to make it one undo step ("Load").
   */
  load(json: DocJSON, opts: { undoable?: boolean } = {}): void {
    if (json?.format !== "tekto-doc/1") throw new Error(`Doc.load: not a tekto document (format ${String((json as any)?.format)})`);
    const wanted = new Map<string, unknown>();
    for (const [c, recs] of Object.entries(json.collections ?? {})) {
      for (const [id, v] of Object.entries(recs)) wanted.set(c + SEP + id, v);
    }
    this.transact("Load", () => {
      for (const [k] of this.store.entries()) if (!wanted.has(k)) this.write(k, null, {}, "Load");
      for (const [k, v] of wanted) this.write(k, v, {}, "Load");
    }, { undoable: opts.undoable ?? false });
    if (!opts.undoable) this.clearHistory();
  }

  dispose(): void {
    this.unsubStore();
    this.store.disconnect();
  }

  // ── Internals ──

  private write(key: string, value: unknown, opts: DocEditOptions, defaultLabel: string): void {
    if (this.depth > 0) {
      this.track(this.open!, key, value);
      this.store.set(key, value ?? null);
      return;
    }
    // A single edit is a transaction of its own.
    this.transact(opts.label ?? defaultLabel, () => {
      this.track(this.open!, key, value);
      this.store.set(key, value ?? null);
    }, { coalesce: opts.coalesce, undoable: opts.undoable });
  }

  private track(step: Step, key: string, after: unknown): void {
    const prev = step.changes.get(key);
    const before = prev ? prev.before : (this.store.get(key) ?? null);
    step.changes.set(key, { before, after: after ?? null });
  }

  private record(step: Step): void {
    const top = this.past[this.past.length - 1];
    if (step.coalesce && top && top.coalesce === step.coalesce && step.at - top.at < this.coalesceMs) {
      // Merge: keep the oldest "before", take the newest "after".
      for (const [k, c] of step.changes) {
        const t = top.changes.get(k);
        top.changes.set(k, { before: t ? t.before : c.before, after: c.after });
      }
      top.at = step.at;
    } else {
      this.past.push(step);
      if (this.past.length > this.historyLimit) this.past.shift();
    }
    this.future = [];
    this.notifyHistory();
  }

  private travel(from: Step[], to: Step[], side: "before" | "after"): boolean {
    const step = from.pop();
    if (!step) return false;
    this.applying = "history";
    try {
      this.depth++;
      for (const [k, c] of step.changes) this.store.set(k, (c[side] ?? null) as unknown);
    } finally {
      this.depth--;
      this.applying = null;
    }
    step.coalesce = undefined;     // a step that was undone never merges again
    to.push(step);
    const keys = [...this.pendingKeys];
    this.pendingKeys.clear();
    if (keys.length) this.emit(keys, "history");
    this.notifyHistory();
    return true;
  }

  private emit(keys: string[], source: DocChangeSource): void {
    const changes: DocChange<S>[] = [];
    for (const key of new Set(keys)) {
      const i = key.indexOf(SEP);
      if (i < 0) continue;
      changes.push({ collection: key.slice(0, i) as keyof S & string, id: key.slice(i + 1), value: this.store.get(key) as S[keyof S] | undefined });
    }
    if (!changes.length) return;
    for (const l of this.listeners) l(changes, source);
  }

  private notifyHistory(): void {
    for (const l of this.historyL) l();
  }
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Keep a document in this browser (`localStorage`): for single-user apps on a static site.
 * Survives reloads; nothing is shared. `storage` can be any Storage (tests pass their own).
 */
export function localAdapter(opts: { prefix?: string; storage?: Pick<Storage, "getItem" | "setItem"> } = {}): CollabAdapter {
  const prefix = opts.prefix ?? "tekto.doc.";
  const storage = opts.storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  const docs = new Map<string, Map<string, SharedRecord>>();
  let clock = 0;
  const tick = () => (clock = Math.max(clock + 1, Date.now()));
  const read = (doc: string): Map<string, SharedRecord> => {
    let m = docs.get(doc);
    if (m) return m;
    m = new Map();
    try {
      const raw = storage?.getItem(prefix + doc);
      if (raw) for (const r of JSON.parse(raw) as SharedRecord[]) m.set(r.key, r);
    } catch { /* unreadable: start empty */ }
    docs.set(doc, m);
    return m;
  };
  const save = (doc: string) => {
    try { storage?.setItem(prefix + doc, JSON.stringify([...read(doc).values()].filter(r => r.value !== null))); }
    catch (e) { console.warn(`localAdapter: could not save "${doc}" (${String(e)})`); }
  };
  const user: CollabUser = { id: "local", name: "You" };
  return {
    async load(doc) { return [...read(doc).values()].map(r => ({ ...r })); },
    async put(doc, key, value) {
      const rec: SharedRecord = { key, value: value ?? null, by: user.id, at: tick() };
      read(doc).set(key, rec);
      save(doc);
      return { ...rec };
    },
    subscribe(_doc: string, _session: string, on: CollabEvents) {
      queueMicrotask(() => on.status("online"));
      return () => on.status("offline");
    },
    setPresence(_doc: string, _p: Presence) { /* one user */ },
    broadcast() { /* one user */ },
    async user() { return user; },
  };
}
