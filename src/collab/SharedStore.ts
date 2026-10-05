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
export interface SharedRecord<T = unknown> {
  key: string;
  value: T | null;
  by: string;
  /** Backend time in ms (orders writes to the same key). */
  at: number;
}

/** A signed-in (or guest) user. */
export interface CollabUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

/** One connected client (a browser tab): its user, colour and free-form state. */
export interface Presence {
  session: string;
  user: CollabUser;
  color: string;
  state: Record<string, unknown>;
}

export type CollabStatus = "offline" | "connecting" | "online" | "error";

export interface CollabEvents {
  record(rec: SharedRecord): void;
  presence(list: Presence[]): void;
  broadcast(event: string, payload: unknown, from: string): void;
  status(status: CollabStatus, detail?: string): void;
}

/** A backend. Every method is per document (`doc`); `session` identifies this client. */
export interface CollabAdapter {
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

export interface SharedStoreOptions {
  /** Document name: every client with the same name shares the records. */
  doc: string;
  adapter: CollabAdapter;
  /** Presence colour; default: one derived from the user id. */
  color?: string;
}

type Listener<A extends unknown[]> = (...args: A) => void;

const PALETTE = ["#e8590c", "#1c7ed6", "#2f9e44", "#ae3ec9", "#f08c00", "#0ca678", "#d6336c", "#4263eb"];

/** A stable colour per user id (the same person gets the same colour in every tab). */
export function collabColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class SharedStore<T = unknown> {
  readonly doc: string;
  /** This client (tab). */
  readonly session = randomId();
  private adapter: CollabAdapter;
  private records = new Map<string, SharedRecord<T>>();
  /** Keys written here and not yet confirmed by the backend: remote versions wait … */
  private pending = new Map<string, number>();
  /** … here (the newest per key), and the newer of it and ours wins on confirmation. */
  private deferred = new Map<string, SharedRecord<T>>();
  private _status: CollabStatus = "offline";
  private _user: CollabUser | null = null;
  private _presence: Presence[] = [];
  private myState: Record<string, unknown> = {};
  private color: string | undefined;
  private unsub: (() => void) | null = null;
  private unsubUser: (() => void) | null = null;
  private changeL = new Set<Listener<[string[], "local" | "remote"]>>();
  private presenceL = new Set<Listener<[Presence[]]>>();
  private statusL = new Set<Listener<[CollabStatus, string | undefined]>>();
  private userL = new Set<Listener<[CollabUser | null]>>();
  private broadcastL = new Set<Listener<[string, unknown, string]>>();
  private errorL = new Set<Listener<[string, string]>>();

  constructor(opts: SharedStoreOptions) {
    this.doc = opts.doc;
    this.adapter = opts.adapter;
    this.color = opts.color;
  }

  /** Load the document and go live. Safe to call again after `disconnect()`. */
  async connect(): Promise<void> {
    this.setStatus("connecting");
    this._user = await this.adapter.user();
    this.unsubUser = this.adapter.onUser?.((u) => { this._user = u; this.announce(); for (const l of this.userL) l(u); }) ?? null;
    this.unsub = this.adapter.subscribe(this.doc, this.session, {
      record: (rec) => this.receive(rec as SharedRecord<T>),
      presence: (list) => { this._presence = list; for (const l of this.presenceL) l(list); },
      broadcast: (event, payload, from) => { if (from !== this.session) for (const l of this.broadcastL) l(event, payload, from); },
      status: (s, d) => this.setStatus(s, d),
    });
    try {
      const all = await this.adapter.load(this.doc);
      const keys: string[] = [];
      for (const rec of all) if (this.take(rec as SharedRecord<T>)) keys.push(rec.key);
      if (keys.length) this.emit(keys, "remote");
    } catch (e) {
      this.setStatus("error", String(e));
      throw e;
    }
    this.announce();
  }

  disconnect(): void {
    this.unsub?.(); this.unsub = null;
    this.unsubUser?.(); this.unsubUser = null;
    this.setStatus("offline");
  }

  // ── records ──
  get(key: string): T | undefined {
    const r = this.records.get(key);
    return r && r.value !== null ? r.value : undefined;
  }
  has(key: string): boolean { return this.get(key) !== undefined; }
  /** Live entries (removed records left out). */
  entries(): [string, T][] {
    const out: [string, T][] = [];
    for (const [k, r] of this.records) if (r.value !== null) out.push([k, r.value]);
    return out;
  }
  /** Who wrote a key last, and when (backend time). */
  meta(key: string): { by: string; at: number } | undefined {
    const r = this.records.get(key);
    return r && { by: r.by, at: r.at };
  }

  /** Write a key: applied here at once, then stored; on failure the stored version comes back. */
  set(key: string, value: T | null): void {
    const before = this.records.get(key);
    const ticket = (this.pending.get(key) ?? 0) + 1;
    this.pending.set(key, ticket);
    this.records.set(key, { key, value, by: this._user?.id ?? "", at: before?.at ?? 0 });
    this.emit([key], "local");
    const settle = () => {
      if (this.pending.get(key) !== ticket) return false;   // a later write of ours is still out
      this.pending.delete(key);
      const d = this.deferred.get(key);
      this.deferred.delete(key);
      return d ? this.take(d) : false;
    };
    this.adapter.put(this.doc, key, value).then(
      (stored) => {
        this.take(stored as SharedRecord<T>, true);
        if (settle()) this.emit([key], "remote");
      },
      (err) => {
        if (this.pending.get(key) === ticket) {
          if (before) this.records.set(key, before); else this.records.delete(key);
          settle();
          this.emit([key], "remote");
        }
        const msg = String(err?.message ?? err);
        for (const l of this.errorL) l(key, msg);
      },
    );
  }
  delete(key: string): void { this.set(key, null); }

  // ── presence, broadcasts ──
  get presence(): Presence[] { return this._presence; }
  /** The other clients (this tab left out). */
  get others(): Presence[] { return this._presence.filter((p) => p.session !== this.session); }
  /** Merge into this client's presence state and announce it (only when something changed,
   *  so calling it on every sketch run costs nothing). */
  setPresence(state: Record<string, unknown>): void {
    const next = { ...this.myState, ...state };
    if (JSON.stringify(next) === JSON.stringify(this.myState)) return;
    this.myState = next;
    this.announce();
  }
  broadcast(event: string, payload: unknown): void {
    this.adapter.broadcast(this.doc, this.session, event, payload);
  }

  // ── user, status ──
  get user(): CollabUser | null { return this._user; }
  get status(): CollabStatus { return this._status; }
  async signIn(): Promise<void> { await this.adapter.signIn?.(); }
  async signOut(): Promise<void> { await this.adapter.signOut?.(); }

  // ── listeners (each returns its unsubscribe) ──
  onChange(cb: (keys: string[], source: "local" | "remote") => void): () => void { this.changeL.add(cb); return () => this.changeL.delete(cb); }
  onPresence(cb: (list: Presence[]) => void): () => void { this.presenceL.add(cb); return () => this.presenceL.delete(cb); }
  onStatus(cb: (status: CollabStatus, detail?: string) => void): () => void { this.statusL.add(cb); return () => this.statusL.delete(cb); }
  onUser(cb: (user: CollabUser | null) => void): () => void { this.userL.add(cb); return () => this.userL.delete(cb); }
  onBroadcast(cb: (event: string, payload: unknown, from: string) => void): () => void { this.broadcastL.add(cb); return () => this.broadcastL.delete(cb); }
  /** A write the backend refused (e.g. not signed in / not an editor). */
  onError(cb: (key: string, message: string) => void): () => void { this.errorL.add(cb); return () => this.errorL.delete(cb); }

  // ── internals ──
  private receive(rec: SharedRecord<T>): void {
    if (this.take(rec)) this.emit([rec.key], "remote");
  }
  /** Take a backend version unless this one is as new (or newer); while a local write of the
   *  key is pending, remote versions are held back (deferred). */
  private take(rec: SharedRecord<T>, own = false): boolean {
    if (!own && this.pending.has(rec.key)) {
      const d = this.deferred.get(rec.key);
      if (!d || d.at < rec.at) this.deferred.set(rec.key, rec);
      return false;
    }
    const cur = this.records.get(rec.key);
    if (cur && (own ? cur.at > rec.at : cur.at >= rec.at)) return false;
    this.records.set(rec.key, rec);
    return true;
  }
  private emit(keys: string[], source: "local" | "remote"): void {
    for (const l of this.changeL) l(keys, source);
  }
  private setStatus(s: CollabStatus, detail?: string): void {
    this._status = s;
    for (const l of this.statusL) l(s, detail);
  }
  private announce(): void {
    if (!this.unsub) return;
    const user = this._user ?? { id: `guest-${this.session}`, name: "Guest" };
    this.adapter.setPresence(this.doc, { session: this.session, user, color: this.color ?? collabColor(user.id), state: this.myState });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// memoryAdapter — one in-process backend shared by every store created with it.

/** An in-process backend: stores on the same adapter share records, presence and broadcasts. */
export function memoryAdapter(opts: { user?: CollabUser | null } = {}): CollabAdapter & { withUser(user: CollabUser | null): CollabAdapter } {
  const docs = new Map<string, Map<string, SharedRecord>>();
  const subs = new Map<string, Map<string, CollabEvents>>();
  const presence = new Map<string, Map<string, Presence>>();
  let clock = 0;
  const now = () => (clock = Math.max(clock + 1, Date.now()));   // strictly increasing
  const docOf = <V>(m: Map<string, Map<string, V>>, doc: string) => m.get(doc) ?? m.set(doc, new Map()).get(doc)!;
  const make = (user: CollabUser | null): CollabAdapter => ({
    async load(doc) { return [...docOf(docs, doc).values()].map((r) => ({ ...r })); },
    async put(doc, key, value) {
      const rec: SharedRecord = { key, value: value ?? null, by: user?.id ?? "guest", at: now() };
      docOf(docs, doc).set(key, rec);
      queueMicrotask(() => { for (const s of docOf(subs, doc).values()) s.record({ ...rec }); });
      return { ...rec };
    },
    subscribe(doc, session, on) {
      docOf(subs, doc).set(session, on);
      queueMicrotask(() => on.status("online"));
      return () => {
        docOf(subs, doc).delete(session);
        docOf(presence, doc).delete(session);
        const list = [...docOf(presence, doc).values()];
        for (const s of docOf(subs, doc).values()) s.presence(list);
      };
    },
    setPresence(doc, p) {
      docOf(presence, doc).set(p.session, p);
      const list = [...docOf(presence, doc).values()];
      queueMicrotask(() => { for (const s of docOf(subs, doc).values()) s.presence(list); });
    },
    broadcast(doc, session, event, payload) {
      queueMicrotask(() => { for (const [sid, s] of docOf(subs, doc)) if (sid !== session) s.broadcast(event, payload, session); });
    },
    async user() { return user; },
  });
  return Object.assign(make(opts.user ?? null), { withUser: make });
}

// ─────────────────────────────────────────────────────────────────────────────
// devServerAdapter — the Vite dev server (tools/collab-vite-plugin.mjs).

const DEV_ENDPOINT = "/__tekto/collab";
const DEV_NAME_KEY = "tekto.collab.name";
const DEV_ID_KEY = "tekto.collab.id";

/**
 * The Vite dev server as backend: records live in `.tekto/collab/<doc>.json` (an agent can read
 * and edit that file — the browsers pick the change up). Guests pick a name (`signIn()`).
 * Needs `tektoCollab()` from "tekto/collab-vite" in vite.config.
 */
export function devServerAdapter(opts: { endpoint?: string } = {}): CollabAdapter {
  const base = opts.endpoint ?? DEV_ENDPOINT;
  const userL = new Set<(u: CollabUser | null) => void>();
  const store = (k: string, v?: string): string | null => {
    try { if (v !== undefined) localStorage.setItem(k, v); return localStorage.getItem(k); } catch { return null; }
  };
  const currentUser = (): CollabUser | null => {
    const name = store(DEV_NAME_KEY);
    if (!name) return null;
    const id = store(DEV_ID_KEY) ?? store(DEV_ID_KEY, `dev-${randomId()}`)!;
    return { id, name };
  };
  const post = async (path: string, body: unknown) => {
    const r = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  };
  return {
    async load(doc) {
      const r = await fetch(`${base}/records?doc=${encodeURIComponent(doc)}`);
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
      return r.json();
    },
    put(doc, key, value) {
      return post("/put", { doc, key, value: value ?? null, by: currentUser()?.name ?? "guest" });
    },
    subscribe(doc, session, on) {
      let es: EventSource | null = null;
      let closed = false;
      const open = () => {
        on.status("connecting");
        es = new EventSource(`${base}/events?doc=${encodeURIComponent(doc)}&session=${session}`);
        es.addEventListener("open", () => on.status("online"));
        es.addEventListener("record", (e) => on.record(JSON.parse((e as MessageEvent).data)));
        es.addEventListener("presence", (e) => on.presence(JSON.parse((e as MessageEvent).data)));
        es.addEventListener("broadcast", (e) => { const m = JSON.parse((e as MessageEvent).data); on.broadcast(m.event, m.payload, m.from); });
        es.addEventListener("error", () => { if (!closed) on.status("connecting", "reconnecting"); });
      };
      open();
      return () => { closed = true; es?.close(); on.status("offline"); };
    },
    setPresence(doc, presence) { void post("/presence", { doc, presence }).catch(() => { /* next announce retries */ }); },
    broadcast(doc, session, event, payload) { void post("/broadcast", { doc, from: session, event, payload }).catch(() => { /* transient */ }); },
    async user() { return currentUser(); },
    async signIn() {
      const name = window.prompt("Your name (shown to the others)", store(DEV_NAME_KEY) ?? "");
      if (!name) return;
      store(DEV_NAME_KEY, name.trim());
      const u = currentUser();
      for (const l of userL) l(u);
    },
    async signOut() {
      try { localStorage.removeItem(DEV_NAME_KEY); } catch { /* storage unavailable */ }
      for (const l of userL) l(null);
    },
    onUser(cb) { userL.add(cb); return () => userL.delete(cb); },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// supabaseAdapter — Supabase (Postgres + Realtime + Auth). The app creates the client
// (`createClient(url, anonKey)` from "@supabase/supabase-js") and passes it in; the table and
// policies are set up once with the SQL in README → "Shared editing".

/** The part of a supabase-js v2 client the adapter uses (typed loosely: no dependency). */
export interface SupabaseLike {
  // supabase-js's builders are generic over the database schema; tekto only needs these calls.
  from(table: string): any;
  channel(name: string, opts?: unknown): any;
  removeChannel(channel: unknown): unknown;
  auth: {
    getUser(): Promise<{ data: { user: any } }>;
    signInWithOAuth(opts: { provider: string; options?: { redirectTo?: string } }): Promise<unknown>;
    signOut(): Promise<unknown>;
    onAuthStateChange(cb: (event: string, session: { user: any } | null) => void): { data: { subscription: { unsubscribe(): void } } };
  };
}

function supabaseUser(u: any): CollabUser | null {
  if (!u) return null;
  const m = u.user_metadata ?? {};
  return { id: m.user_name ?? m.preferred_username ?? u.email ?? u.id, name: m.full_name ?? m.name ?? m.user_name ?? u.email ?? "user", avatarUrl: m.avatar_url };
}

function fromRow(row: any): SharedRecord {
  return { key: row.key, value: row.value ?? null, by: row.by ?? "", at: Date.parse(row.at) };
}

/**
 * Supabase as backend. `provider` is the sign-in provider (default "github"); `table` the
 * records table (default "tekto_records"). Who may write is decided by the table's policies.
 */
export function supabaseAdapter(client: SupabaseLike, opts: { table?: string; provider?: string } = {}): CollabAdapter {
  const table = opts.table ?? "tekto_records";
  const channels = new Map<string, any>();   // doc → realtime channel (records, presence, broadcasts)
  const joined = new Set<string>();          // docs whose channel is subscribed
  const lastPresence = new Map<string, Presence>();   // tracked again once the channel is joined
  return {
    async load(doc) {
      const { data, error } = await client.from(table).select("key,value,by,at").eq("doc", doc);
      if (error) throw new Error(error.message);
      return (data ?? []).map(fromRow);
    },
    async put(doc, key, value) {
      const { data, error } = await client.from(table).upsert({ doc, key, value: value ?? null }, { onConflict: "doc,key" }).select("key,value,by,at").single();
      if (error) throw new Error(error.message);
      return fromRow(data);
    },
    subscribe(doc, session, on) {
      on.status("connecting");
      const ch = client.channel(`tekto:${doc}`, { config: { presence: { key: session }, broadcast: { self: false } } });
      ch.on("postgres_changes", { event: "*", schema: "public", table, filter: `doc=eq.${doc}` }, (p: any) => { if (p.new?.key) on.record(fromRow(p.new)); });
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState() as Record<string, Presence[]>;
        on.presence(Object.values(state).map((metas) => metas[metas.length - 1]).filter(Boolean));
      });
      ch.on("broadcast", { event: "tekto" }, (m: any) => on.broadcast(m.payload.event, m.payload.payload, m.payload.from));
      ch.subscribe((status: string, err?: Error) => {
        if (status === "SUBSCRIBED") {
          joined.add(doc);
          on.status("online");
          const p = lastPresence.get(doc);
          if (p) void ch.track(p);
        } else if (status === "CLOSED") { joined.delete(doc); on.status("offline"); }
        else on.status(status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "error" : "connecting", err?.message ?? status);
      });
      channels.set(doc, ch);
      return () => { channels.delete(doc); joined.delete(doc); void client.removeChannel(ch); on.status("offline"); };
    },
    setPresence(doc, presence) {
      lastPresence.set(doc, presence);
      if (joined.has(doc)) void channels.get(doc)?.track(presence);
    },
    broadcast(doc, session, event, payload) {
      void channels.get(doc)?.send({ type: "broadcast", event: "tekto", payload: { event, payload, from: session } });
    },
    async user() { return supabaseUser((await client.auth.getUser()).data.user); },
    async signIn() { await client.auth.signInWithOAuth({ provider: opts.provider ?? "github", options: { redirectTo: location.href } }); },
    async signOut() { await client.auth.signOut(); },
    onUser(cb) {
      const { data } = client.auth.onAuthStateChange((_e, s) => cb(supabaseUser(s?.user)));
      return () => data.subscription.unsubscribe();
    },
  };
}
