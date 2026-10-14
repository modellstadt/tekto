import { S as Scene } from './Scene-BHniJuab.mjs';

/**
 * Tekto Parameter System
 *
 * Declare parameters, get reactive values + auto-generated UI.
 *
 * Usage:
 *   const params = createParams({
 *     radius: { type: "float", min: 0.1, max: 5, default: 1, step: 0.1, label: "Radius" },
 *     segments: { type: "int", min: 3, max: 64, default: 16, label: "Segments" },
 *     algorithm: { type: "select", options: ["delaunay", "greedy"], default: "delaunay" },
 *     wireframe: { type: "bool", default: false },
 *     color: { type: "color", default: "#6ee7b7" },
 *     name: { type: "string", default: "Mesh 1" },
 *   });
 *
 *   params.get("radius")       // 1
 *   params.set("radius", 2.5)  // triggers listeners
 *   params.onChange((key, value) => rebuild())
 */
/** A number slider from `min` to `max`; values set outside the range are clamped. */
interface FloatParam {
    type: "float";
    min: number;
    max: number;
    default: number;
    step?: number;
    label?: string;
}
/** An integer slider from `min` to `max`; values are clamped and rounded. */
interface IntParam {
    type: "int";
    min: number;
    max: number;
    default: number;
    step?: number;
    label?: string;
}
/** An on/off toggle. */
interface BoolParam {
    type: "bool";
    default: boolean;
    label?: string;
}
/** A dropdown of fixed string `options`; setting a value not in the list is ignored. */
interface SelectParam {
    type: "select";
    options: readonly string[];
    default: string;
    label?: string;
}
/** A colour picker whose value is a CSS hex string (`"#6ee7b7"`). */
interface ColorParam {
    type: "color";
    default: string;
    label?: string;
}
/** A single-line text field. */
interface StringParam {
    type: "string";
    default: string;
    label?: string;
    placeholder?: string;
}
/** Three number fields holding an `[x, y, z]` value. */
interface Vec3Param {
    type: "vec3";
    default: [number, number, number];
    min?: [number, number, number];
    max?: [number, number, number];
    step?: number;
    label?: string;
}
/** A button that runs `action`; it holds no value. */
interface ButtonParam {
    type: "button";
    label?: string;
    action: () => void;
}
/** One control in a schema — slider, toggle, select, colour, text, vec3 or button — plus the `display` flag. */
type ParamDef = (FloatParam | IntParam | BoolParam | SelectParam | ColorParam | StringParam | Vec3Param | ButtonParam) & {
    /** Display-only param: `appShell` routes its changes to `onDisplay`
     *  (restyle existing objects) instead of `onBuild` (regenerate geometry). */
    display?: boolean;
};
/** Controls by key — what `new ParamStore(schema)` and `createParams` take; the store's values are typed from it. */
type ParamSchema = Record<string, ParamDef>;
/** The value a param definition holds: `float`/`int` → number, `bool` → boolean,
 *  `select`/`color`/`string` → string, `vec3` → [x, y, z], `button` → undefined. */
type ParamValue<D> = D extends {
    type: "float" | "int";
} ? number : D extends {
    type: "bool";
} ? boolean : D extends {
    type: "select" | "color" | "string";
} ? string : D extends {
    type: "vec3";
} ? [number, number, number] : D extends {
    type: "button";
} ? undefined : unknown;
/** Every value of a schema, typed: `{ radius: number, wireframe: boolean, … }`. */
type ParamValues<S extends ParamSchema> = {
    [K in keyof S]: ParamValue<S[K]>;
};
type ParamChangeListener = (key: string, value: any, allValues: Record<string, any>) => void;
/**
 * The one parameter model: a schema of controls (`float`, `int`, `bool`, `select`, `color`,
 * `string`, `vec3`, `button`) and their values, typed from the schema. Every harness keeps
 * its controls here. `setByName` sets by label for tools and agents.
 *
 *   const p = new ParamStore({ r: { type: "float", min: 0, max: 5, default: 1 } }); p.get("r"); // number
 */
declare class ParamStore<S extends ParamSchema = ParamSchema> {
    private schema;
    private values;
    private listeners;
    private keyListeners;
    constructor(schema: S);
    get<K extends keyof S>(key: K): ParamValue<S[K]>;
    set<K extends keyof S>(key: K, value: any): void;
    /**
     * Dynamically add (or refresh) a parameter definition. Used by the sketch
     * APIs, whose immediate-mode `lab.slider(...)` calls declare params during
     * the sketch run. Initializes the value from `default` the first time;
     * an existing value is preserved so re-defining across re-runs is cheap.
     * Does NOT notify listeners (definition is structure, not a value change).
     */
    define(key: string, def: ParamDef): void;
    /** Remove a parameter (and its value). Does not notify listeners. */
    remove(key: string): void;
    has(key: string): boolean;
    keys(): string[];
    /** Get all current values */
    getAll(): ParamValues<S>;
    /** Get the schema for a specific key */
    getDef<K extends keyof S>(key: K): S[K];
    /** Get entire schema */
    getSchema(): S;
    /** Listen to all changes */
    onChange(listener: ParamChangeListener): () => void;
    /** Listen to a specific key */
    onKey(key: string, listener: (value: any) => void): () => void;
    /** Reset all to defaults */
    reset(): void;
    /** Serialization */
    toJSON(): Record<string, any>;
    loadJSON(json: Record<string, any>): void;
    /**
     * The keys a person or an agent means by `name`, most specific first: the exact key;
     * else the control's label, ignoring case ("Radius"); else "Group:Label" for sketch
     * keys, which read `type:group:label`. One key when the name is unambiguous.
     */
    findKeys(name: string): string[];
    /**
     * Set params by key or label (see `findKeys`) and say what could not be applied,
     * instead of dropping it the way `loadJSON` does. For tools and agents.
     */
    setByName(values: Record<string, unknown>): {
        applied: string[];
        unknown: string[];
        ambiguous: {
            name: string;
            keys: string[];
        }[];
    };
    /** Every param as the name to use with `setByName`: its label, or "Group:Label" when two share a label. */
    names(): string[];
}
/**
 * Convenience factory
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function createParams<S extends ParamSchema>(schema: S): ParamStore<S>;
/** A collapsible group in a `ParamLayout`: its label, whether it starts open (default yes), and the schema keys it holds. */
interface ParamFolder {
    label: string;
    open?: boolean;
    params: string[];
}
/** How the React `ParamPanel` groups a store's params into folders; keys in no folder are listed after them. */
interface ParamLayout {
    folders: ParamFolder[];
}
/**
 * Create a layout that groups params into collapsible folders
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function createLayout(folders: ParamFolder[]): ParamLayout;

/**
 * SharedStore — a document of keyed records that several people (and agents) edit together.
 *
 * Each record is one value under one key ("map:ch218.0" → the curve's control points). The
 * store applies a write locally at once, sends it to the backend, and takes the backend's
 * stored version back; other clients receive it live. Per key the LAST write wins, ordered by
 * the backend's clock — fine for small teams, where two people rarely change the same key in
 * the same second (presence shows who is on what, so they don't).
 *
 * Presence (who is online, what they have selected) and broadcasts (transient messages, e.g.
 * a point while it is dragged) travel through the same backend but are never stored.
 *
 * The backend is an adapter (CollabAdapter):
 *   - memoryAdapter()              — in-process, for tests and single-page demos
 *   - devServerAdapter()           — the Vite dev server (tools/collab-vite-plugin.mjs): browser
 *                                    windows share `.tekto/collab/<doc>.json`, which an agent
 *                                    can read and edit too
 *   - supabaseAdapter(client)      — Supabase (database + realtime + GitHub/email login); the
 *                                    app passes its own client, tekto has no dependency on it
 */
/** One stored record. `value: null` = removed. `by` / `at` are set by the backend. */
interface SharedRecord<T = unknown> {
    key: string;
    value: T | null;
    by: string;
    /** Backend time in ms (orders writes to the same key). */
    at: number;
}
/** A signed-in (or guest) user. */
interface CollabUser {
    id: string;
    name: string;
    avatarUrl?: string;
}
/** One connected client (a browser tab): its user, colour and free-form state. */
interface Presence {
    session: string;
    user: CollabUser;
    color: string;
    state: Record<string, unknown>;
}
/** Connection state of a `SharedStore` (the `PresenceBar` dot). */
type CollabStatus = "offline" | "connecting" | "online" | "error";
/** The callbacks an adapter's `subscribe` calls: live records, the presence list, broadcasts and connection status. */
interface CollabEvents {
    record(rec: SharedRecord): void;
    presence(list: Presence[]): void;
    broadcast(event: string, payload: unknown, from: string): void;
    status(status: CollabStatus, detail?: string): void;
}
/** A backend. Every method is per document (`doc`); `session` identifies this client. */
interface CollabAdapter {
    /** All records of the document. */
    load(doc: string): Promise<SharedRecord[]>;
    /** Store one record; resolves with the stored version (backend `by` / `at`). */
    put(doc: string, key: string, value: unknown): Promise<SharedRecord>;
    /** Live records, presence, broadcasts and connection status. Returns the unsubscribe. */
    subscribe(doc: string, session: string, on: CollabEvents): () => void;
    /** Announce this client's presence (sent again on every change). */
    setPresence(doc: string, presence: Presence): void;
    /** A transient message to the other clients. */
    broadcast(doc: string, session: string, event: string, payload: unknown): void;
    /** The current user, or null when nobody is signed in. */
    user(): Promise<CollabUser | null>;
    signIn?(): Promise<void>;
    signOut?(): Promise<void>;
    /** Called with the user whenever sign-in changes. Returns the unsubscribe. */
    onUser?(cb: (user: CollabUser | null) => void): () => void;
}
/** Options for `new SharedStore(...)`: the document name, the backend adapter and an optional presence colour. */
interface SharedStoreOptions {
    /** Document name: every client with the same name shares the records. */
    doc: string;
    adapter: CollabAdapter;
    /** Presence colour; default: one derived from the user id. */
    color?: string;
}
/** A stable colour per user id (the same person gets the same colour in every tab). */
declare function collabColor(id: string): string;
/**
 * A document of keyed records that several people (and agents) edit together: `set` applies
 * locally at once and syncs through an adapter (`memoryAdapter`, `devServerAdapter`,
 * `supabaseAdapter`); last write wins per key; presence and broadcasts included.
 *
 *   const store = new SharedStore<[number, number, number]>({ doc: "site", adapter: devServerAdapter() });
 */
declare class SharedStore<T = unknown> {
    readonly doc: string;
    /** This client (tab). */
    readonly session: string;
    private adapter;
    private records;
    /** Keys written here and not yet confirmed by the backend: remote versions wait … */
    private pending;
    /** … here (the newest per key), and the newer of it and ours wins on confirmation. */
    private deferred;
    private _status;
    private _user;
    private _presence;
    private myState;
    private color;
    private unsub;
    private unsubUser;
    private changeL;
    private presenceL;
    private statusL;
    private userL;
    private broadcastL;
    private errorL;
    constructor(opts: SharedStoreOptions);
    /** Load the document and go live. Safe to call again after `disconnect()`. */
    connect(): Promise<void>;
    disconnect(): void;
    get(key: string): T | undefined;
    has(key: string): boolean;
    /** Live entries (removed records left out). */
    entries(): [string, T][];
    /** Who wrote a key last, and when (backend time). */
    meta(key: string): {
        by: string;
        at: number;
    } | undefined;
    /** Write a key: applied here at once, then stored; on failure the stored version comes back. */
    set(key: string, value: T | null): void;
    delete(key: string): void;
    get presence(): Presence[];
    /** The other clients (this tab left out). */
    get others(): Presence[];
    /** Merge into this client's presence state and announce it (only when something changed,
     *  so calling it on every sketch run costs nothing). */
    setPresence(state: Record<string, unknown>): void;
    broadcast(event: string, payload: unknown): void;
    get user(): CollabUser | null;
    get status(): CollabStatus;
    signIn(): Promise<void>;
    signOut(): Promise<void>;
    onChange(cb: (keys: string[], source: "local" | "remote") => void): () => void;
    onPresence(cb: (list: Presence[]) => void): () => void;
    onStatus(cb: (status: CollabStatus, detail?: string) => void): () => void;
    onUser(cb: (user: CollabUser | null) => void): () => void;
    onBroadcast(cb: (event: string, payload: unknown, from: string) => void): () => void;
    /** A write the backend refused (e.g. not signed in / not an editor). */
    onError(cb: (key: string, message: string) => void): () => void;
    private receive;
    /** Take a backend version unless this one is as new (or newer); while a local write of the
     *  key is pending, remote versions are held back (deferred). */
    private take;
    private emit;
    private setStatus;
    private announce;
}
/** An in-process backend: stores on the same adapter share records, presence and broadcasts. */
declare function memoryAdapter(opts?: {
    user?: CollabUser | null;
}): CollabAdapter & {
    withUser(user: CollabUser | null): CollabAdapter;
};
/**
 * The Vite dev server as backend: records live in `.tekto/collab/<doc>.json` (an agent can read
 * and edit that file — the browsers pick the change up). Guests pick a name (`signIn()`).
 * Needs `tektoCollab()` from "tekto/collab-vite" in vite.config.
 */
declare function devServerAdapter(opts?: {
    endpoint?: string;
}): CollabAdapter;
/** The part of a supabase-js v2 client the adapter uses (typed loosely: no dependency). */
interface SupabaseLike {
    from(table: string): any;
    channel(name: string, opts?: unknown): any;
    removeChannel(channel: unknown): unknown;
    auth: {
        getUser(): Promise<{
            data: {
                user: any;
            };
        }>;
        signInWithOAuth(opts: {
            provider: string;
            options?: {
                redirectTo?: string;
            };
        }): Promise<unknown>;
        signOut(): Promise<unknown>;
        onAuthStateChange(cb: (event: string, session: {
            user: any;
        } | null) => void): {
            data: {
                subscription: {
                    unsubscribe(): void;
                };
            };
        };
    };
}
/**
 * Supabase as backend. `provider` is the sign-in provider (default "github"); `table` the
 * records table (default "tekto_records"). Who may write is decided by the table's policies.
 */
declare function supabaseAdapter(client: SupabaseLike, opts?: {
    table?: string;
    provider?: string;
}): CollabAdapter;

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

/** What a collection's records look like: collection name → record type. */
type DocSchema = Record<string, object>;
/** One record that changed. `value` is the new value, `undefined` once removed. */
interface DocChange<S extends DocSchema = DocSchema> {
    collection: keyof S & string;
    id: string;
    value: S[keyof S] | undefined;
}
/** Where a batch of changes came from: this client, another client, or undo/redo. */
type DocChangeSource = "local" | "remote" | "history";
/** Options for one edit (`add`/`update`/`remove`/`transact`): its undo label, coalescing key, and whether it is undoable. */
interface DocEditOptions {
    /** Shown as "Undo <label>"; default from the operation ("Add blocks", "Edit blocks"…). */
    label?: string;
    /** Edits with the same key within `coalesceMs` merge into one undo step (a slider drag). */
    coalesce?: string;
    /** Leave this change out of the undo history (view state, imports). */
    undoable?: boolean;
}
/** Options for `new Doc(...)`: its name, storage adapter and undo history settings. */
interface DocOptions {
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
interface DocJSON {
    format: "tekto-doc/1";
    name: string;
    collections: Record<string, Record<string, unknown>>;
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
declare class Doc<S extends DocSchema = DocSchema> {
    readonly name: string;
    /** The record store underneath: presence, broadcasts, sign-in, status. */
    readonly store: SharedStore<unknown>;
    /** Resolves once the stored records are loaded; edit after it. */
    readonly ready: Promise<void>;
    private past;
    private future;
    private open;
    private depth;
    private applying;
    private pendingKeys;
    private pendingSource;
    private listeners;
    private historyL;
    private historyLimit;
    private coalesceMs;
    private unsubStore;
    constructor(opts: DocOptions);
    get<C extends keyof S & string>(collection: C, id: string): S[C] | undefined;
    has<C extends keyof S & string>(collection: C, id: string): boolean;
    /** `[id, record]` for every record of a collection, in insertion order. */
    all<C extends keyof S & string>(collection: C): [string, S[C]][];
    ids<C extends keyof S & string>(collection: C): string[];
    count<C extends keyof S & string>(collection: C): number;
    /** Add a record; returns its id (or uses `id` if given). */
    add<C extends keyof S & string>(collection: C, value: S[C], opts?: DocEditOptions & {
        id?: string;
    }): string;
    /**
     * Change a record: an object merges into it (`{ h: 12 }`), a function maps it
     * (`b => ({ ...b, h: b.h * 2 })`). Throws if the record doesn't exist.
     */
    update<C extends keyof S & string>(collection: C, id: string, change: Partial<S[C]> | ((value: S[C]) => S[C]), opts?: DocEditOptions): void;
    /** Remove a record (a no-op if it is already gone). */
    remove<C extends keyof S & string>(collection: C, id: string, opts?: DocEditOptions): void;
    /**
     * Run several edits as one undo step and one change notification. Nested transactions
     * join the outer one.
     *
     *   doc.transact("Duplicate", () => { for (const id of sel) doc.add("blocks", { ...doc.get("blocks", id)!, x: … }); });
     */
    transact<T>(label: string, fn: () => T, opts?: Omit<DocEditOptions, "label">): T;
    undo(): boolean;
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    /** "Undo <this>": the label of the step `undo()` would revert. */
    undoLabel(): string | undefined;
    redoLabel(): string | undefined;
    /** Forget the history (after Open, or to make a state the new baseline). */
    clearHistory(): void;
    /** Records that changed, once per transaction, and where the change came from. */
    onChange(cb: (changes: DocChange<S>[], source: DocChangeSource) => void): () => void;
    /** The undo/redo history changed (enable or relabel Undo / Redo). */
    onHistory(cb: () => void): () => void;
    toJSON(): DocJSON;
    /**
     * Replace the document's records with `json` (from `toJSON()`): records not in it are
     * removed. Not undoable by default — Open starts a new history — pass `undoable: true`
     * to make it one undo step ("Load").
     */
    load(json: DocJSON, opts?: {
        undoable?: boolean;
    }): void;
    dispose(): void;
    private write;
    private track;
    private record;
    private travel;
    private emit;
    private notifyHistory;
}
/**
 * Keep a document in this browser (`localStorage`): for single-user apps on a static site.
 * Survives reloads; nothing is shared. `storage` can be any Storage (tests pass their own).
 */
declare function localAdapter(opts?: {
    prefix?: string;
    storage?: Pick<Storage, "getItem" | "setItem">;
}): CollabAdapter;
/** What `bindScene` returns: the record ↔ scene-object map, and a way out. */
interface SceneBinding {
    readonly collection: string;
    /** Scene ids of the objects showing a record (what to highlight when it is selected). */
    objectsOf(id: string): string[];
    /** The record a scene object shows (what a click picked), or undefined if not this collection's. */
    recordOf(sceneId: string): string | undefined;
    /** Render a record again (or every record), e.g. after a style setting changed. */
    refresh(id?: string): void;
    /** Stop following the document and remove this binding's objects from the scene. */
    dispose(): void;
}
/**
 * Keep a scene in step with one collection of a document. `render(record, id)` adds the
 * objects that show a record (any `scene.add…` calls); each gets `key` = `"collection/id"`.
 * When a record changes only its objects are rebuilt, when it is removed they go. A record
 * whose render throws is reported (`console.error`, which snapshots pick up) and skipped.
 *
 *   const blocks = bindScene(doc, "blocks", app.scene, (b) => {
 *     const m = MeshFactory.box(b.w, b.d, b.h); m.translate(b.x, b.y, b.h / 2);   // in place
 *     app.scene.addMesh(m, { color: "#ccc" });
 *   });
 *   blocks.recordOf(pickedSceneId);   // → the block id
 */
declare function bindScene<S extends DocSchema, C extends keyof S & string>(doc: Doc<S>, collection: C, scene: Scene, render: (record: S[C], id: string) => void): SceneBinding;
/**
 * The selected records, by key (`"blocks/k3f9x2"` — the `key` every object of a record
 * carries). Records, not scene objects: a selection survives re-renders, undo and reload.
 * View state — keep it out of the document (or share it as presence).
 *
 *   const sel = new Selection();
 *   selectOnClick(app.renderer, app.scene, sel);
 *   sel.onChange(() => panel.show(sel.ids("blocks")));
 */
declare class Selection {
    private set;
    private listeners;
    keys(): string[];
    has(key: string): boolean;
    get size(): number;
    /** The ids of the selected records of one collection. */
    ids(collection: string): string[];
    /** Replace the selection. */
    select(keys: Iterable<string>): void;
    add(key: string): void;
    remove(key: string): void;
    toggle(key: string): void;
    clear(): void;
    /** A click on a record (`key`) or on nothing (null): it selects the record, Shift/⌘/Ctrl
     *  adds or removes it, a plain click on nothing clears. The rule every view shares — a
     *  3D viewport (`selectOnClick`), a drawing (`SheetCanvas.onPick`), a list. */
    click(key: string | null | undefined, mods?: {
        shiftKey?: boolean;
        metaKey?: boolean;
        ctrlKey?: boolean;
    }): void;
    onChange(cb: (keys: string[]) => void): () => void;
    private emit;
}
/** What `selectOnClick` needs from a renderer: structurally a ThreeRenderer. */
interface PickingView {
    setPickEnabled(enabled: boolean): void;
    onPick(listener: (sceneId: string | null, info: {
        shiftKey: boolean;
        metaKey: boolean;
        ctrlKey: boolean;
    }) => void): () => void;
    setSelectionHighlight(sceneIds: readonly string[] | null): void;
}
/**
 * Click to select records in a viewport: a click selects the record an object shows,
 * Shift/⌘/Ctrl-click adds or removes it, a click on the background clears. Every object of
 * a selected record is highlighted — again after `bindScene` rebuilds it. Returns the
 * unsubscribe.
 */
declare function selectOnClick(view: PickingView, scene: Scene, selection: Selection): () => void;
/** What `shareSelection` draws others' selections with: structurally a ThreeRenderer. */
interface PresenceView {
    setPresenceHighlight(entries: readonly {
        ids: readonly string[];
        color: string;
    }[]): void;
}
/**
 * Share a selection with everyone on the same document: this client's selected record keys go
 * into its presence, and `view` outlines what the others have selected, each in their presence
 * colour — so two people (or a person and an agent) see who is on what before they collide.
 * Others' outlines follow their records through rebuilds. Returns the unsubscribe (which also
 * withdraws this client's selection).
 *
 *   shareSelection(selection, doc.store, app.renderer, app.scene);
 */
declare function shareSelection(selection: Selection, store: SharedStore<any>, view?: PresenceView, scene?: Scene): () => void;

export { bindScene as A, type BoolParam as B, type CollabAdapter as C, Doc as D, collabColor as E, type FloatParam as F, createLayout as G, createParams as H, type IntParam as I, devServerAdapter as J, localAdapter as K, memoryAdapter as L, selectOnClick as M, shareSelection as N, supabaseAdapter as O, ParamStore as P, SharedStore as S, type Vec3Param as V, type ParamLayout as a, type ParamSchema as b, type ParamValues as c, type Presence as d, type ButtonParam as e, type CollabEvents as f, type CollabStatus as g, type CollabUser as h, type ColorParam as i, type DocChange as j, type DocChangeSource as k, type DocEditOptions as l, type DocJSON as m, type DocOptions as n, type DocSchema as o, type ParamDef as p, type ParamFolder as q, type PickingView as r, type PresenceView as s, type SceneBinding as t, type SelectParam as u, Selection as v, type SharedRecord as w, type SharedStoreOptions as x, type StringParam as y, type SupabaseLike as z };
