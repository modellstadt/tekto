// src/core/math/HMath.ts
var HMath = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,
  EPSILON: 1e-10,
  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  smoothstep(edge0, edge1, x) {
    const t = HMath.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },
  /** Map value from one range to another */
  remap(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
  },
  almostEqual(a, b, eps = 1e-10) {
    return Math.abs(a - b) < eps;
  },
  /** Returns t in [0,1] if angle lies within arc(startAngle, sweepAngle), else null. */
  sweepFraction(angle, startAngle, sweepAngle) {
    if (Math.abs(sweepAngle) < 1e-12) return null;
    let delta = angle - startAngle;
    const TAU = Math.PI * 2;
    if (sweepAngle > 0) {
      delta = (delta % TAU + TAU) % TAU;
    } else {
      delta = -((-delta % TAU + TAU) % TAU);
    }
    const t = delta / sweepAngle;
    return t >= -1e-9 && t <= 1 + 1e-9 ? Math.max(0, Math.min(1, t)) : null;
  },
  /** Solve quadratic Bezier (1-t)²a + 2(1-t)t·b + t²c = target for t ∈ [0,1]. Returns t or null. */
  solveQuadraticBezier(a, b, c, target) {
    const A = a - 2 * b + c;
    const B = 2 * (b - a);
    const C = a - target;
    if (Math.abs(A) < 1e-12) {
      if (Math.abs(B) < 1e-12) return null;
      const t = -C / B;
      return t >= -1e-6 && t <= 1 + 1e-6 ? Math.max(0, Math.min(1, t)) : null;
    }
    const disc = B * B - 4 * A * C;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const t1 = (-B - sq) / (2 * A);
    const t2 = (-B + sq) / (2 * A);
    for (const t of [t1, t2]) {
      if (t >= -1e-6 && t <= 1 + 1e-6) return Math.max(0, Math.min(1, t));
    }
    return null;
  }
};
var MathUtils = HMath;

// src/core/math/vectors.ts
var Vec2 = class _Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  static zero() {
    return new _Vec2(0, 0);
  }
  static one() {
    return new _Vec2(1, 1);
  }
  static unitX() {
    return new _Vec2(1, 0);
  }
  static unitY() {
    return new _Vec2(0, 1);
  }
  static fromAngle(radians) {
    return new _Vec2(Math.cos(radians), Math.sin(radians));
  }
  static fromArray(a) {
    return new _Vec2(a[0] ?? 0, a[1] ?? 0);
  }
  add(v) {
    return new _Vec2(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new _Vec2(this.x - v.x, this.y - v.y);
  }
  mul(s) {
    return new _Vec2(this.x * s, this.y * s);
  }
  div(s) {
    return new _Vec2(this.x / s, this.y / s);
  }
  neg() {
    return new _Vec2(-this.x, -this.y);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  lenSq() {
    return this.x * this.x + this.y * this.y;
  }
  normalize() {
    const l = this.len();
    return l > 1e-12 ? this.div(l) : _Vec2.zero();
  }
  distTo(v) {
    return this.sub(v).len();
  }
  distSqTo(v) {
    return this.sub(v).lenSq();
  }
  lerp(v, t) {
    return new _Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
  }
  angle() {
    return Math.atan2(this.y, this.x);
  }
  angleTo(v) {
    return Math.atan2(this.cross(v), this.dot(v));
  }
  rotate(radians) {
    const c = Math.cos(radians), s = Math.sin(radians);
    return new _Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }
  perp() {
    return new _Vec2(-this.y, this.x);
  }
  almostEqual(v, eps = 1e-10) {
    return Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps;
  }
  toArray() {
    return [this.x, this.y];
  }
  toVec3(z = 0) {
    return new Vec3(this.x, this.y, z);
  }
  toString() {
    return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)})`;
  }
  clone() {
    return new _Vec2(this.x, this.y);
  }
  toJSON() {
    return { x: this.x, y: this.y };
  }
  static fromJSON(j) {
    return new _Vec2(j.x, j.y);
  }
};
var Vec3 = class _Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  static zero() {
    return new _Vec3(0, 0, 0);
  }
  static one() {
    return new _Vec3(1, 1, 1);
  }
  static unitX() {
    return new _Vec3(1, 0, 0);
  }
  static unitY() {
    return new _Vec3(0, 1, 0);
  }
  static unitZ() {
    return new _Vec3(0, 0, 1);
  }
  static fromArray(a) {
    return new _Vec3(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0);
  }
  add(v) {
    return new _Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  sub(v) {
    return new _Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  mul(s) {
    return new _Vec3(this.x * s, this.y * s, this.z * s);
  }
  div(s) {
    return new _Vec3(this.x / s, this.y / s, this.z / s);
  }
  neg() {
    return new _Vec3(-this.x, -this.y, -this.z);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }
  cross(v) {
    return new _Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  lenSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  normalize() {
    const l = this.len();
    return l > 1e-12 ? this.div(l) : _Vec3.zero();
  }
  distTo(v) {
    return this.sub(v).len();
  }
  distSqTo(v) {
    return this.sub(v).lenSq();
  }
  lerp(v, t) {
    return new _Vec3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t
    );
  }
  project(onto) {
    const d = onto.lenSq();
    return d > 1e-12 ? onto.mul(this.dot(onto) / d) : _Vec3.zero();
  }
  reflect(normal) {
    return this.sub(normal.mul(2 * this.dot(normal)));
  }
  almostEqual(v, eps = 1e-10) {
    return Math.abs(this.x - v.x) < eps && Math.abs(this.y - v.y) < eps && Math.abs(this.z - v.z) < eps;
  }
  toArray() {
    return [this.x, this.y, this.z];
  }
  toVec2() {
    return new Vec2(this.x, this.y);
  }
  xz() {
    return new Vec2(this.x, this.z);
  }
  toString() {
    return `(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`;
  }
  clone() {
    return new _Vec3(this.x, this.y, this.z);
  }
  toJSON() {
    return { x: this.x, y: this.y, z: this.z };
  }
  static fromJSON(j) {
    return new _Vec3(j.x, j.y, j.z);
  }
};
var Vec4 = class {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }
  toVec3() {
    return new Vec3(this.x, this.y, this.z);
  }
  toArray() {
    return [this.x, this.y, this.z, this.w];
  }
};
var Mat4 = class _Mat4 {
  /** 16 elements in column-major order */
  constructor(m = new Float64Array(16)) {
    this.m = m;
    if (m.length === 0) {
      this.m = _Mat4.identity().m;
    }
  }
  static identity() {
    const m = new Float64Array(16);
    m[0] = 1;
    m[5] = 1;
    m[10] = 1;
    m[15] = 1;
    return new _Mat4(m);
  }
  static translation(x, y, z) {
    const m = _Mat4.identity().m.slice();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return new _Mat4(new Float64Array(m));
  }
  static scaling(x, y, z) {
    const m = new Float64Array(16);
    m[0] = x;
    m[5] = y;
    m[10] = z;
    m[15] = 1;
    return new _Mat4(m);
  }
  static rotationX(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = _Mat4.identity().m.slice();
    m[5] = c;
    m[6] = s;
    m[9] = -s;
    m[10] = c;
    return new _Mat4(new Float64Array(m));
  }
  static rotationY(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = _Mat4.identity().m.slice();
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    return new _Mat4(new Float64Array(m));
  }
  static rotationZ(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const m = _Mat4.identity().m.slice();
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return new _Mat4(new Float64Array(m));
  }
  static lookAt(eye, target, up) {
    const z = eye.sub(target).normalize();
    const x = up.cross(z).normalize();
    const y = z.cross(x);
    const m = new Float64Array(16);
    m[0] = x.x;
    m[1] = y.x;
    m[2] = z.x;
    m[3] = 0;
    m[4] = x.y;
    m[5] = y.y;
    m[6] = z.y;
    m[7] = 0;
    m[8] = x.z;
    m[9] = y.z;
    m[10] = z.z;
    m[11] = 0;
    m[12] = -x.dot(eye);
    m[13] = -y.dot(eye);
    m[14] = -z.dot(eye);
    m[15] = 1;
    return new _Mat4(m);
  }
  multiply(b) {
    const a = this.m, bm = b.m, r = new Float64Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        r[col * 4 + row] = a[row] * bm[col * 4] + a[4 + row] * bm[col * 4 + 1] + a[8 + row] * bm[col * 4 + 2] + a[12 + row] * bm[col * 4 + 3];
      }
    }
    return new _Mat4(r);
  }
  transformPoint(v) {
    const m = this.m;
    const w = m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15];
    return new Vec3(
      (m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12]) / w,
      (m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13]) / w,
      (m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14]) / w
    );
  }
  transformDirection(v) {
    const m = this.m;
    return new Vec3(
      m[0] * v.x + m[4] * v.y + m[8] * v.z,
      m[1] * v.x + m[5] * v.y + m[9] * v.z,
      m[2] * v.x + m[6] * v.y + m[10] * v.z
    );
  }
  invert() {
    const m = this.m, r = new Float64Array(16);
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7], a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (Math.abs(det) < 1e-12) return _Mat4.identity();
    det = 1 / det;
    r[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    r[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    r[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    r[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    r[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    r[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    r[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    r[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    r[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    r[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    r[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    r[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    r[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    r[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    r[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    r[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return new _Mat4(r);
  }
  toArray() {
    return Array.from(this.m);
  }
};

// src/collab/SharedStore.ts
var PALETTE = ["#e8590c", "#1c7ed6", "#2f9e44", "#ae3ec9", "#f08c00", "#0ca678", "#d6336c", "#4263eb"];
function collabColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = h * 31 + id.charCodeAt(i) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
var SharedStore = class {
  constructor(opts) {
    /** This client (tab). */
    this.session = randomId();
    this.records = /* @__PURE__ */ new Map();
    /** Keys written here and not yet confirmed by the backend: remote versions wait … */
    this.pending = /* @__PURE__ */ new Map();
    /** … here (the newest per key), and the newer of it and ours wins on confirmation. */
    this.deferred = /* @__PURE__ */ new Map();
    this._status = "offline";
    this._user = null;
    this._presence = [];
    this.myState = {};
    this.unsub = null;
    this.unsubUser = null;
    this.changeL = /* @__PURE__ */ new Set();
    this.presenceL = /* @__PURE__ */ new Set();
    this.statusL = /* @__PURE__ */ new Set();
    this.userL = /* @__PURE__ */ new Set();
    this.broadcastL = /* @__PURE__ */ new Set();
    this.errorL = /* @__PURE__ */ new Set();
    this.doc = opts.doc;
    this.adapter = opts.adapter;
    this.color = opts.color;
  }
  /** Load the document and go live. Safe to call again after `disconnect()`. */
  async connect() {
    this.setStatus("connecting");
    this._user = await this.adapter.user();
    this.unsubUser = this.adapter.onUser?.((u) => {
      this._user = u;
      this.announce();
      for (const l of this.userL) l(u);
    }) ?? null;
    this.unsub = this.adapter.subscribe(this.doc, this.session, {
      record: (rec) => this.receive(rec),
      presence: (list) => {
        this._presence = list;
        for (const l of this.presenceL) l(list);
      },
      broadcast: (event, payload, from) => {
        if (from !== this.session) for (const l of this.broadcastL) l(event, payload, from);
      },
      status: (s, d) => this.setStatus(s, d)
    });
    try {
      const all = await this.adapter.load(this.doc);
      const keys = [];
      for (const rec of all) if (this.take(rec)) keys.push(rec.key);
      if (keys.length) this.emit(keys, "remote");
    } catch (e) {
      this.setStatus("error", String(e));
      throw e;
    }
    this.announce();
  }
  disconnect() {
    this.unsub?.();
    this.unsub = null;
    this.unsubUser?.();
    this.unsubUser = null;
    this.setStatus("offline");
  }
  // ── records ──
  get(key) {
    const r = this.records.get(key);
    return r && r.value !== null ? r.value : void 0;
  }
  has(key) {
    return this.get(key) !== void 0;
  }
  /** Live entries (removed records left out). */
  entries() {
    const out = [];
    for (const [k, r] of this.records) if (r.value !== null) out.push([k, r.value]);
    return out;
  }
  /** Who wrote a key last, and when (backend time). */
  meta(key) {
    const r = this.records.get(key);
    return r && { by: r.by, at: r.at };
  }
  /** Write a key: applied here at once, then stored; on failure the stored version comes back. */
  set(key, value) {
    const before = this.records.get(key);
    const ticket = (this.pending.get(key) ?? 0) + 1;
    this.pending.set(key, ticket);
    this.records.set(key, { key, value, by: this._user?.id ?? "", at: before?.at ?? 0 });
    this.emit([key], "local");
    const settle = () => {
      if (this.pending.get(key) !== ticket) return false;
      this.pending.delete(key);
      const d = this.deferred.get(key);
      this.deferred.delete(key);
      return d ? this.take(d) : false;
    };
    this.adapter.put(this.doc, key, value).then(
      (stored) => {
        this.take(stored, true);
        if (settle()) this.emit([key], "remote");
      },
      (err) => {
        if (this.pending.get(key) === ticket) {
          if (before) this.records.set(key, before);
          else this.records.delete(key);
          settle();
          this.emit([key], "remote");
        }
        const msg = String(err?.message ?? err);
        for (const l of this.errorL) l(key, msg);
      }
    );
  }
  delete(key) {
    this.set(key, null);
  }
  // ── presence, broadcasts ──
  get presence() {
    return this._presence;
  }
  /** The other clients (this tab left out). */
  get others() {
    return this._presence.filter((p) => p.session !== this.session);
  }
  /** Merge into this client's presence state and announce it (only when something changed,
   *  so calling it on every sketch run costs nothing). */
  setPresence(state) {
    const next = { ...this.myState, ...state };
    if (JSON.stringify(next) === JSON.stringify(this.myState)) return;
    this.myState = next;
    this.announce();
  }
  broadcast(event, payload) {
    this.adapter.broadcast(this.doc, this.session, event, payload);
  }
  // ── user, status ──
  get user() {
    return this._user;
  }
  get status() {
    return this._status;
  }
  async signIn() {
    await this.adapter.signIn?.();
  }
  async signOut() {
    await this.adapter.signOut?.();
  }
  // ── listeners (each returns its unsubscribe) ──
  onChange(cb) {
    this.changeL.add(cb);
    return () => this.changeL.delete(cb);
  }
  onPresence(cb) {
    this.presenceL.add(cb);
    return () => this.presenceL.delete(cb);
  }
  onStatus(cb) {
    this.statusL.add(cb);
    return () => this.statusL.delete(cb);
  }
  onUser(cb) {
    this.userL.add(cb);
    return () => this.userL.delete(cb);
  }
  onBroadcast(cb) {
    this.broadcastL.add(cb);
    return () => this.broadcastL.delete(cb);
  }
  /** A write the backend refused (e.g. not signed in / not an editor). */
  onError(cb) {
    this.errorL.add(cb);
    return () => this.errorL.delete(cb);
  }
  // ── internals ──
  receive(rec) {
    if (this.take(rec)) this.emit([rec.key], "remote");
  }
  /** Take a backend version unless this one is as new (or newer); while a local write of the
   *  key is pending, remote versions are held back (deferred). */
  take(rec, own = false) {
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
  emit(keys, source) {
    for (const l of this.changeL) l(keys, source);
  }
  setStatus(s, detail) {
    this._status = s;
    for (const l of this.statusL) l(s, detail);
  }
  announce() {
    if (!this.unsub) return;
    const user = this._user ?? { id: `guest-${this.session}`, name: "Guest" };
    this.adapter.setPresence(this.doc, { session: this.session, user, color: this.color ?? collabColor(user.id), state: this.myState });
  }
};
function memoryAdapter(opts = {}) {
  const docs = /* @__PURE__ */ new Map();
  const subs = /* @__PURE__ */ new Map();
  const presence = /* @__PURE__ */ new Map();
  let clock = 0;
  const now2 = () => clock = Math.max(clock + 1, Date.now());
  const docOf = (m, doc) => m.get(doc) ?? m.set(doc, /* @__PURE__ */ new Map()).get(doc);
  const make = (user) => ({
    async load(doc) {
      return [...docOf(docs, doc).values()].map((r) => ({ ...r }));
    },
    async put(doc, key, value) {
      const rec = { key, value: value ?? null, by: user?.id ?? "guest", at: now2() };
      docOf(docs, doc).set(key, rec);
      queueMicrotask(() => {
        for (const s of docOf(subs, doc).values()) s.record({ ...rec });
      });
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
      queueMicrotask(() => {
        for (const s of docOf(subs, doc).values()) s.presence(list);
      });
    },
    broadcast(doc, session, event, payload) {
      queueMicrotask(() => {
        for (const [sid, s] of docOf(subs, doc)) if (sid !== session) s.broadcast(event, payload, session);
      });
    },
    async user() {
      return user;
    }
  });
  return Object.assign(make(opts.user ?? null), { withUser: make });
}
var DEV_ENDPOINT = "/__tekto/collab";
var DEV_NAME_KEY = "tekto.collab.name";
var DEV_ID_KEY = "tekto.collab.id";
function devServerAdapter(opts = {}) {
  const base = opts.endpoint ?? DEV_ENDPOINT;
  const userL = /* @__PURE__ */ new Set();
  const store = (k, v) => {
    try {
      if (v !== void 0) localStorage.setItem(k, v);
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const currentUser = () => {
    const name = store(DEV_NAME_KEY);
    if (!name) return null;
    const id = store(DEV_ID_KEY) ?? store(DEV_ID_KEY, `dev-${randomId()}`);
    return { id, name };
  };
  const post = async (path, body) => {
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
      let es = null;
      let closed = false;
      const open = () => {
        on.status("connecting");
        es = new EventSource(`${base}/events?doc=${encodeURIComponent(doc)}&session=${session}`);
        es.addEventListener("open", () => on.status("online"));
        es.addEventListener("record", (e) => on.record(JSON.parse(e.data)));
        es.addEventListener("presence", (e) => on.presence(JSON.parse(e.data)));
        es.addEventListener("broadcast", (e) => {
          const m = JSON.parse(e.data);
          on.broadcast(m.event, m.payload, m.from);
        });
        es.addEventListener("error", () => {
          if (!closed) on.status("connecting", "reconnecting");
        });
      };
      open();
      return () => {
        closed = true;
        es?.close();
        on.status("offline");
      };
    },
    setPresence(doc, presence) {
      void post("/presence", { doc, presence }).catch(() => {
      });
    },
    broadcast(doc, session, event, payload) {
      void post("/broadcast", { doc, from: session, event, payload }).catch(() => {
      });
    },
    async user() {
      return currentUser();
    },
    async signIn() {
      const name = window.prompt("Your name (shown to the others)", store(DEV_NAME_KEY) ?? "");
      if (!name) return;
      store(DEV_NAME_KEY, name.trim());
      const u = currentUser();
      for (const l of userL) l(u);
    },
    async signOut() {
      try {
        localStorage.removeItem(DEV_NAME_KEY);
      } catch {
      }
      for (const l of userL) l(null);
    },
    onUser(cb) {
      userL.add(cb);
      return () => userL.delete(cb);
    }
  };
}
function supabaseUser(u) {
  if (!u) return null;
  const m = u.user_metadata ?? {};
  return { id: m.user_name ?? m.preferred_username ?? u.email ?? u.id, name: m.full_name ?? m.name ?? m.user_name ?? u.email ?? "user", avatarUrl: m.avatar_url };
}
function fromRow(row) {
  return { key: row.key, value: row.value ?? null, by: row.by ?? "", at: Date.parse(row.at) };
}
function supabaseAdapter(client, opts = {}) {
  const table = opts.table ?? "tekto_records";
  const channels = /* @__PURE__ */ new Map();
  const joined = /* @__PURE__ */ new Set();
  const lastPresence = /* @__PURE__ */ new Map();
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
      ch.on("postgres_changes", { event: "*", schema: "public", table, filter: `doc=eq.${doc}` }, (p) => {
        if (p.new?.key) on.record(fromRow(p.new));
      });
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        on.presence(Object.values(state).map((metas) => metas[metas.length - 1]).filter(Boolean));
      });
      ch.on("broadcast", { event: "tekto" }, (m) => on.broadcast(m.payload.event, m.payload.payload, m.payload.from));
      ch.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          joined.add(doc);
          on.status("online");
          const p = lastPresence.get(doc);
          if (p) void ch.track(p);
        } else if (status === "CLOSED") {
          joined.delete(doc);
          on.status("offline");
        } else on.status(status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "error" : "connecting", err?.message ?? status);
      });
      channels.set(doc, ch);
      return () => {
        channels.delete(doc);
        joined.delete(doc);
        void client.removeChannel(ch);
        on.status("offline");
      };
    },
    setPresence(doc, presence) {
      lastPresence.set(doc, presence);
      if (joined.has(doc)) void channels.get(doc)?.track(presence);
    },
    broadcast(doc, session, event, payload) {
      void channels.get(doc)?.send({ type: "broadcast", event: "tekto", payload: { event, payload, from: session } });
    },
    async user() {
      return supabaseUser((await client.auth.getUser()).data.user);
    },
    async signIn() {
      await client.auth.signInWithOAuth({ provider: opts.provider ?? "github", options: { redirectTo: location.href } });
    },
    async signOut() {
      await client.auth.signOut();
    },
    onUser(cb) {
      const { data } = client.auth.onAuthStateChange((_e, s) => cb(supabaseUser(s?.user)));
      return () => data.subscription.unsubscribe();
    }
  };
}

// src/collab/recordSchema.ts
var show = (v) => {
  if (typeof v === "string") return JSON.stringify(v);
  if (v === void 0) return "nothing";
  try {
    const s = JSON.stringify(v);
    return s.length > 60 ? `${s.slice(0, 57)}\u2026` : s;
  } catch {
    return String(v);
  }
};
var kind = (v) => v === null ? "null" : Array.isArray(v) ? "an array" : typeof v === "object" ? "an object" : `a ${typeof v}`;
var join = (path, key) => typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;
function checkRecord(value, schema, path = "") {
  const out = [];
  const at = path || "(record)";
  if (schema.enum && !schema.enum.includes(value)) {
    out.push({ path: at, message: `expected one of ${schema.enum.map(show).join(", ")}, got ${show(value)}` });
    return out;
  }
  switch (schema.type) {
    case "number":
    case "integer": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        out.push({ path: at, message: `expected a number, got ${show(value)}` });
        break;
      }
      if (schema.type === "integer" && !Number.isInteger(value)) out.push({ path: at, message: `expected a whole number, got ${value}` });
      if (schema.minimum !== void 0 && value < schema.minimum) out.push({ path: at, message: `must be at least ${schema.minimum}, got ${value}` });
      if (schema.exclusiveMinimum !== void 0 && value <= schema.exclusiveMinimum) out.push({ path: at, message: `must be more than ${schema.exclusiveMinimum}, got ${value}` });
      if (schema.maximum !== void 0 && value > schema.maximum) out.push({ path: at, message: `must be at most ${schema.maximum}, got ${value}` });
      break;
    }
    case "string":
      if (typeof value !== "string") out.push({ path: at, message: `expected a string, got ${show(value)}` });
      break;
    case "boolean":
      if (typeof value !== "boolean") out.push({ path: at, message: `expected true or false, got ${show(value)}` });
      break;
    case "array": {
      if (!Array.isArray(value)) {
        out.push({ path: at, message: `expected an array, got ${kind(value)}` });
        break;
      }
      if (schema.minItems !== void 0 && value.length < schema.minItems) out.push({ path: at, message: `needs at least ${schema.minItems} items, got ${value.length}` });
      if (schema.maxItems !== void 0 && value.length > schema.maxItems) out.push({ path: at, message: `takes at most ${schema.maxItems} items, got ${value.length}` });
      if (schema.items) value.forEach((v, i) => out.push(...checkRecord(v, schema.items, join(path, i))));
      break;
    }
    case "object": {
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        out.push({ path: at, message: `expected an object, got ${kind(value)}` });
        break;
      }
      const rec = value;
      const props = schema.properties ?? {};
      for (const key of schema.required ?? []) {
        if (rec[key] === void 0) out.push({ path: join(path, key), message: "is required" });
      }
      for (const [key, v] of Object.entries(rec)) {
        const sub = props[key];
        if (sub) {
          if (v !== void 0) out.push(...checkRecord(v, sub, join(path, key)));
        } else if (schema.additionalProperties === false) {
          out.push({ path: join(path, key), message: `is not a property here (known: ${Object.keys(props).join(", ")})` });
        }
      }
      break;
    }
  }
  return out;
}

// src/collab/Doc.ts
var SEP = "/";
function newId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
}
var Doc = class {
  constructor(opts) {
    this.past = [];
    this.future = [];
    this.open = null;
    // the transaction being written
    this.depth = 0;
    this.applying = null;
    this.pendingKeys = /* @__PURE__ */ new Set();
    // changed during a transaction, emitted once at the end
    this.pendingSource = "local";
    this.listeners = /* @__PURE__ */ new Set();
    this.historyL = /* @__PURE__ */ new Set();
    this.name = opts.name;
    this.historyLimit = opts.historyLimit ?? 200;
    this.coalesceMs = opts.coalesceMs ?? 800;
    this.store = new SharedStore({ doc: opts.name, adapter: opts.adapter ?? memoryAdapter() });
    this.unsubStore = this.store.onChange((keys, source) => {
      const src = this.applying ?? source;
      if (this.depth > 0) {
        for (const k of keys) this.pendingKeys.add(k);
        this.pendingSource = src;
        return;
      }
      this.emit(keys, src);
    });
    this.ready = this.store.connect();
  }
  // ── Reading ──
  get(collection, id) {
    return this.store.get(collection + SEP + id);
  }
  has(collection, id) {
    return this.store.has(collection + SEP + id);
  }
  /** `[id, record]` for every record of a collection, in insertion order. */
  all(collection) {
    const prefix = collection + SEP;
    return this.store.entries().filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]);
  }
  ids(collection) {
    return this.all(collection).map(([id]) => id);
  }
  count(collection) {
    return this.all(collection).length;
  }
  // ── Writing ──
  /** Add a record; returns its id (or uses `id` if given). */
  add(collection, value, opts = {}) {
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
  update(collection, id, change, opts = {}) {
    const cur = this.get(collection, id);
    if (cur === void 0) throw new Error(`Doc.update: ${collection}${SEP}${id} does not exist`);
    const next = typeof change === "function" ? change(cur) : { ...cur, ...change };
    this.write(collection + SEP + id, next, opts, `Edit ${collection}`);
  }
  /** Remove a record (a no-op if it is already gone). */
  remove(collection, id, opts = {}) {
    if (!this.has(collection, id)) return;
    this.write(collection + SEP + id, null, opts, `Delete ${collection}`);
  }
  /**
   * Run several edits as one undo step and one change notification. Nested transactions
   * join the outer one.
   *
   *   doc.transact("Duplicate", () => { for (const id of sel) doc.add("blocks", { ...doc.get("blocks", id)!, x: … }); });
   */
  transact(label, fn, opts = {}) {
    const outer = this.depth === 0;
    if (outer) this.open = { label, changes: /* @__PURE__ */ new Map(), coalesce: opts.coalesce, at: now() };
    this.depth++;
    try {
      return fn();
    } finally {
      this.depth--;
      if (outer) {
        const step = this.open;
        this.open = null;
        if (step.changes.size && opts.undoable !== false) this.record(step);
        const keys = [...this.pendingKeys];
        this.pendingKeys.clear();
        if (keys.length) this.emit(keys, this.pendingSource);
      }
    }
  }
  // ── Undo / redo ──
  undo() {
    return this.travel(this.past, this.future, "before");
  }
  redo() {
    return this.travel(this.future, this.past, "after");
  }
  canUndo() {
    return this.past.length > 0;
  }
  canRedo() {
    return this.future.length > 0;
  }
  /** "Undo <this>": the label of the step `undo()` would revert. */
  undoLabel() {
    return this.past[this.past.length - 1]?.label;
  }
  redoLabel() {
    return this.future[this.future.length - 1]?.label;
  }
  /** Forget the history (after Open, or to make a state the new baseline). */
  clearHistory() {
    this.past = [];
    this.future = [];
    this.notifyHistory();
  }
  // ── Listening ──
  /** Records that changed, once per transaction, and where the change came from. */
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  /** The undo/redo history changed (enable or relabel Undo / Redo). */
  onHistory(cb) {
    this.historyL.add(cb);
    return () => this.historyL.delete(cb);
  }
  // ── Save / Open ──
  toJSON() {
    var _a;
    const collections = {};
    for (const [key, value] of this.store.entries()) {
      const i = key.indexOf(SEP);
      if (i < 0) continue;
      (collections[_a = key.slice(0, i)] ?? (collections[_a] = {}))[key.slice(i + 1)] = value;
    }
    return { format: "tekto-doc/1", name: this.name, collections };
  }
  /**
   * Replace the document's records with `json` (from `toJSON()`): records not in it are
   * removed. Not undoable by default — Open starts a new history — pass `undoable: true`
   * to make it one undo step ("Load").
   */
  load(json, opts = {}) {
    if (json?.format !== "tekto-doc/1") throw new Error(`Doc.load: not a tekto document (format ${String(json?.format)})`);
    const wanted = /* @__PURE__ */ new Map();
    for (const [c, recs] of Object.entries(json.collections ?? {})) {
      for (const [id, v] of Object.entries(recs)) wanted.set(c + SEP + id, v);
    }
    this.transact("Load", () => {
      for (const [k] of this.store.entries()) if (!wanted.has(k)) this.write(k, null, {}, "Load");
      for (const [k, v] of wanted) this.write(k, v, {}, "Load");
    }, { undoable: opts.undoable ?? false });
    if (!opts.undoable) this.clearHistory();
  }
  dispose() {
    this.unsubStore();
    this.store.disconnect();
  }
  // ── Internals ──
  write(key, value, opts, defaultLabel) {
    if (this.depth > 0) {
      this.track(this.open, key, value);
      this.store.set(key, value ?? null);
      return;
    }
    this.transact(opts.label ?? defaultLabel, () => {
      this.track(this.open, key, value);
      this.store.set(key, value ?? null);
    }, { coalesce: opts.coalesce, undoable: opts.undoable });
  }
  track(step, key, after) {
    const prev = step.changes.get(key);
    const before = prev ? prev.before : this.store.get(key) ?? null;
    step.changes.set(key, { before, after: after ?? null });
  }
  record(step) {
    const top = this.past[this.past.length - 1];
    if (step.coalesce && top && top.coalesce === step.coalesce && step.at - top.at < this.coalesceMs) {
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
  travel(from, to, side) {
    const step = from.pop();
    if (!step) return false;
    this.applying = "history";
    try {
      this.depth++;
      for (const [k, c] of step.changes) this.store.set(k, c[side] ?? null);
    } finally {
      this.depth--;
      this.applying = null;
    }
    step.coalesce = void 0;
    to.push(step);
    const keys = [...this.pendingKeys];
    this.pendingKeys.clear();
    if (keys.length) this.emit(keys, "history");
    this.notifyHistory();
    return true;
  }
  emit(keys, source) {
    const changes = [];
    for (const key of new Set(keys)) {
      const i = key.indexOf(SEP);
      if (i < 0) continue;
      changes.push({ collection: key.slice(0, i), id: key.slice(i + 1), value: this.store.get(key) });
    }
    if (!changes.length) return;
    for (const l of this.listeners) l(changes, source);
  }
  notifyHistory() {
    for (const l of this.historyL) l();
  }
};
function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
function localAdapter(opts = {}) {
  const prefix = opts.prefix ?? "tekto.doc.";
  const storage = opts.storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
  const docs = /* @__PURE__ */ new Map();
  let clock = 0;
  const tick = () => clock = Math.max(clock + 1, Date.now());
  const read = (doc) => {
    let m = docs.get(doc);
    if (m) return m;
    m = /* @__PURE__ */ new Map();
    try {
      const raw = storage?.getItem(prefix + doc);
      if (raw) for (const r of JSON.parse(raw)) m.set(r.key, r);
    } catch {
    }
    docs.set(doc, m);
    return m;
  };
  const save = (doc) => {
    try {
      storage?.setItem(prefix + doc, JSON.stringify([...read(doc).values()].filter((r) => r.value !== null)));
    } catch (e) {
      console.warn(`localAdapter: could not save "${doc}" (${String(e)})`);
    }
  };
  const user = { id: "local", name: "You" };
  return {
    async load(doc) {
      return [...read(doc).values()].map((r) => ({ ...r }));
    },
    async put(doc, key, value) {
      const rec = { key, value: value ?? null, by: user.id, at: tick() };
      read(doc).set(key, rec);
      save(doc);
      return { ...rec };
    },
    subscribe(_doc, _session, on) {
      queueMicrotask(() => on.status("online"));
      return () => on.status("offline");
    },
    setPresence(_doc, _p) {
    },
    broadcast() {
    },
    async user() {
      return user;
    }
  };
}
function applyPatch(doc, patch, opts = {}) {
  const rejected = [];
  const changed = { set: [], updated: [], removed: [] };
  const split = (key) => {
    const at = key.indexOf(SEP);
    if (at <= 0 || at === key.length - 1) {
      rejected.push({ key, message: `a record is named "collection${SEP}id", got "${key}"` });
      return null;
    }
    const c = key.slice(0, at);
    if (opts.schema && !opts.schema[c]) {
      rejected.push({ key, message: `"${c}" is not a collection here (collections: ${Object.keys(opts.schema).join(", ")})` });
      return null;
    }
    return [c, key.slice(at + 1)];
  };
  const checkValue = (key, c, value) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      rejected.push({ key, message: "a record is a JSON object" });
      return;
    }
    const schema = opts.schema?.[c];
    if (schema) for (const i of checkRecord(value, schema)) rejected.push({ key, message: `${i.path}: ${i.message}` });
  };
  const plan = [];
  const get = (c, id) => doc.get(c, id);
  for (const [key, value] of Object.entries(patch.set ?? {})) {
    const k = split(key);
    if (!k) continue;
    checkValue(key, k[0], value);
    plan.push(() => {
      const [c, id] = k;
      if (doc.has(c, id)) doc.update(c, id, () => value);
      else doc.add(c, value, { id });
      changed.set.push(key);
    });
  }
  for (const [key, change] of Object.entries(patch.update ?? {})) {
    const k = split(key);
    if (!k) continue;
    const cur = get(k[0], k[1]);
    if (cur === void 0) {
      rejected.push({ key, message: "does not exist (use set to add it)" });
      continue;
    }
    if (change === null || typeof change !== "object" || Array.isArray(change)) {
      rejected.push({ key, message: "an update is a JSON object of fields" });
      continue;
    }
    checkValue(key, k[0], { ...cur, ...change });
    plan.push(() => {
      doc.update(k[0], k[1], change);
      changed.updated.push(key);
    });
  }
  for (const key of patch.remove ?? []) {
    const k = split(key);
    if (!k) continue;
    if (get(k[0], k[1]) === void 0) {
      rejected.push({ key, message: "does not exist" });
      continue;
    }
    plan.push(() => {
      doc.remove(k[0], k[1]);
      changed.removed.push(key);
    });
  }
  if (rejected.length) return { ok: false, rejected, changed };
  if (!plan.length) return { ok: true, rejected, changed };
  const n = plan.length;
  doc.transact(opts.label ?? `Apply ${n} change${n === 1 ? "" : "s"}`, () => {
    for (const step of plan) step();
  });
  return { ok: true, rejected, changed, undo: doc.undoLabel() };
}
function bindScene(doc, collection, scene, render) {
  const objects = /* @__PURE__ */ new Map();
  const keyOf = (id) => `${collection}${SEP}${id}`;
  let capturing = null;
  const unsubScene = scene.on((e) => {
    if (e.type === "object:add" && capturing) capturing.push(e.id);
    else if (e.type === "scene:clear") objects.clear();
  });
  const drop = (id) => {
    for (const sid of objects.get(id) ?? []) scene.remove(sid);
    objects.delete(id);
  };
  const draw = (id, record) => {
    drop(id);
    if (record === void 0) return;
    const added = [];
    capturing = added;
    try {
      scene.withKey(keyOf(id), () => render(record, id));
    } catch (e) {
      console.error(`bindScene("${collection}"): rendering ${keyOf(id)} failed:`, e);
    } finally {
      capturing = null;
    }
    objects.set(id, added);
  };
  for (const [id, rec] of doc.all(collection)) draw(id, rec);
  const unsubDoc = doc.onChange((changes) => {
    for (const c of changes) if (c.collection === collection) draw(c.id, c.value);
  });
  return {
    collection,
    objectsOf: (id) => [...objects.get(id) ?? []],
    recordOf: (sceneId) => {
      const key = scene.get(sceneId)?.key;
      return key && key.startsWith(collection + SEP) ? key.slice(collection.length + 1) : void 0;
    },
    refresh: (id) => {
      if (id !== void 0) draw(id, doc.get(collection, id));
      else for (const [rid, rec] of doc.all(collection)) draw(rid, rec);
    },
    dispose: () => {
      unsubDoc();
      unsubScene();
      for (const id of [...objects.keys()]) drop(id);
    }
  };
}
var Selection = class {
  constructor() {
    this.set = /* @__PURE__ */ new Set();
    this.listeners = /* @__PURE__ */ new Set();
  }
  keys() {
    return [...this.set];
  }
  has(key) {
    return this.set.has(key);
  }
  get size() {
    return this.set.size;
  }
  /** The ids of the selected records of one collection. */
  ids(collection) {
    const prefix = collection + SEP;
    return this.keys().filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
  }
  /** Replace the selection. */
  select(keys) {
    const next = new Set(keys);
    if (next.size === this.set.size && [...next].every((k) => this.set.has(k))) return;
    this.set = next;
    this.emit();
  }
  add(key) {
    if (!this.set.has(key)) {
      this.set.add(key);
      this.emit();
    }
  }
  remove(key) {
    if (this.set.delete(key)) this.emit();
  }
  toggle(key) {
    if (!this.set.delete(key)) this.set.add(key);
    this.emit();
  }
  clear() {
    if (this.set.size) {
      this.set.clear();
      this.emit();
    }
  }
  /** A click on a record (`key`) or on nothing (null): it selects the record, Shift/⌘/Ctrl
   *  adds or removes it, a plain click on nothing clears. The rule every view shares — a
   *  3D viewport (`selectOnClick`), a drawing (`SheetCanvas.onPick`), a list. */
  click(key, mods = {}) {
    const adding = !!(mods.shiftKey || mods.metaKey || mods.ctrlKey);
    if (!key) {
      if (!adding) this.clear();
      return;
    }
    if (adding) this.toggle(key);
    else this.select([key]);
  }
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  emit() {
    const keys = this.keys();
    for (const l of this.listeners) l(keys);
  }
};
function selectOnClick(view, scene, selection) {
  view.setPickEnabled(true);
  const highlight = () => {
    if (!selection.size) {
      view.setSelectionHighlight(null);
      return;
    }
    const ids = [];
    for (const o of scene.all()) if (o.key && selection.has(o.key)) ids.push(o.id);
    view.setSelectionHighlight(ids);
  };
  const offPick = view.onPick((sceneId, info) => selection.click(sceneId ? scene.get(sceneId)?.key : null, info));
  const offSel = selection.onChange(highlight);
  let queued = false;
  const offScene = scene.on((e) => {
    if (e.type !== "object:add" || !selection.size || queued) return;
    const key = scene.get(e.id)?.key;
    if (!key || !selection.has(key)) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      highlight();
    });
  });
  highlight();
  return () => {
    offPick();
    offSel();
    offScene();
    view.setSelectionHighlight(null);
  };
}
function shareSelection(selection, store, view, scene) {
  const publish = () => store.setPresence({ selection: selection.keys() });
  const offSel = selection.onChange(publish);
  publish();
  if (!view || !scene) return () => {
    offSel();
    store.setPresence({ selection: [] });
  };
  const show2 = () => {
    const entries = store.others.map((p) => {
      const keys = Array.isArray(p.state.selection) ? p.state.selection : [];
      const want = new Set(keys);
      const ids = scene.all().filter((o) => o.key && want.has(o.key)).map((o) => o.id);
      return { ids, color: p.color };
    }).filter((e) => e.ids.length);
    view.setPresenceHighlight(entries);
  };
  let queued = false;
  const offScene = scene.on((e) => {
    if (e.type !== "object:add" && e.type !== "scene:clear" || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      show2();
    });
  });
  const offPresence = store.onPresence(show2);
  show2();
  return () => {
    offSel();
    offPresence();
    offScene();
    view.setPresenceHighlight([]);
    store.setPresence({ selection: [] });
  };
}

// src/io/download.ts
function stampName(fileName, date = /* @__PURE__ */ new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? `${fileName.slice(0, dot)}-${stamp}${fileName.slice(dot)}` : `${fileName}-${stamp}`;
}
var MIME = {
  dxf: "application/dxf",
  svg: "image/svg+xml",
  json: "application/json",
  obj: "model/obj",
  mtl: "model/mtl",
  ifc: "application/x-step",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  stl: "model/stl",
  pdf: "application/pdf"
};
function download(data, fileName, opts = {}) {
  const name = opts.stamp ? stampName(fileName) : fileName;
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  const blob = data instanceof Blob ? data : new Blob([data], { type: opts.type ?? MIME[ext] ?? "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6e4);
}

// src/core/math/VecMath.ts
var EPSILON = HMath.EPSILON;
var TWO_PI = Math.PI * 2;
var VecMath = {
  // ================================================================
  // INTERPOLATION & POINT CONSTRUCTION
  // ================================================================
  /** Point between a and b at parameter t (0=a, 1=b). */
  pointBetween(a, b, t) {
    return a.lerp(b, t);
  },
  /** Point on segment a→b at absolute distance from a. */
  pointBetweenAbsolute(a, b, distance) {
    const len = a.distTo(b);
    if (len < EPSILON) return a;
    return a.lerp(b, distance / len);
  },
  /** Generates evenly spaced points along a segment (inclusive of endpoints). */
  pointsBetween(a, b, segments) {
    if (segments < 1) return [a, b];
    const pts = [];
    for (let i = 0; i <= segments; i++)
      pts.push(a.lerp(b, i / segments));
    return pts;
  },
  /** Generates points along a segment with minimum spacing. */
  pointsAlongSegment(a, b, spacing) {
    const len = a.distTo(b);
    const n = Math.max(1, Math.floor(len / spacing));
    const step = b.sub(a).div(n);
    const pts = [];
    for (let i = 0; i <= n; i++)
      pts.push(a.add(step.mul(i)));
    return pts;
  },
  // ================================================================
  // POLAR / ANGLE CONSTRUCTION
  // ================================================================
  /** Creates a 2D unit vector from an angle (radians). */
  fromAngle2D(angle) {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  },
  /** Creates a 3D point from polar coordinates in XY plane. */
  polar(angle, length) {
    return new Vec3(length * Math.cos(angle), length * Math.sin(angle), 0);
  },
  /** Creates a 3D point from polar coordinates in XZ plane with height Y. */
  polarXZ(angle, length, y = 0) {
    return new Vec3(length * Math.cos(angle), y, length * Math.sin(angle));
  },
  /** Creates a point at origin offset by polar (angle, length). */
  polarOffset(origin, angle, length) {
    return origin.add(VecMath.fromAngle2D(angle).mul(length));
  },
  // ================================================================
  // ANGLES
  // ================================================================
  /** 2D heading angle of a Vec2 (radians, -PI..PI). */
  angle2D(v) {
    return Math.atan2(v.y, v.x);
  },
  /** 2D heading angle of a Vec3 projected to XY. */
  angle2DFrom3D(v) {
    return Math.atan2(v.y, v.x);
  },
  /** Positive angle (0..2PI) of a 2D vector. */
  anglePositive(v) {
    const a = Math.atan2(v.y, v.x);
    return a < 0 ? a + TWO_PI : a;
  },
  /**
   * Angle between two 3D vectors (radians, 0..PI).
   * Safe: returns 0 for zero-length vectors, clamps dot to avoid NaN.
   */
  angleBetween(a, b) {
    const ma = a.len();
    const mb = b.len();
    if (ma < EPSILON || mb < EPSILON) return 0;
    const dot = HMath.clamp(a.dot(b) / (ma * mb), -1, 1);
    return Math.acos(dot);
  },
  /**
   * Signed angle from vector a to vector b around the given axis (radians, -PI..PI).
   */
  angleBetweenSigned(a, b, axis) {
    const angle = VecMath.angleBetween(a, b);
    const cross = a.cross(b);
    if (cross.dot(axis) < 0) return -angle;
    return angle;
  },
  /** Counter-clockwise angle from direction a to b (radians, 0..2PI). */
  angleBetweenCCW(a, b) {
    let angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
    if (angle < 0) angle += TWO_PI;
    return angle;
  },
  /** Angle at vertex P between edges PA and PB (radians, 0..PI). */
  angleAtVertex(p, a, b) {
    const va = a.sub(p);
    const vb = b.sub(p);
    const dot = va.dot(vb);
    const cross = va.x * vb.y - va.y * vb.x;
    return Math.abs(Math.atan2(cross, dot));
  },
  /** Angle between two line segments sharing a common endpoint (radians). */
  angleBetweenSegments(a1, a2, b1, b2) {
    return VecMath.angleBetween(a2.sub(a1), b2.sub(b1));
  },
  // ================================================================
  // PERPENDICULAR / ROTATION 2D
  // ================================================================
  /** Rotates a 2D vector 90° counter-clockwise. */
  rotate90(v) {
    return new Vec2(-v.y, v.x);
  },
  /** Rotates a 2D vector 90° clockwise. */
  rotate90CW(v) {
    return new Vec2(v.y, -v.x);
  },
  /** Rotates a 2D vector by an angle (radians). */
  rotate2D(v, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(v.x * c - v.y * s, v.x * s + v.y * c);
  },
  // ================================================================
  // DISTANCE UTILITIES
  // ================================================================
  /** Shortest distance from point to infinite line through a and b. */
  distanceToLine(p, lineA, lineB) {
    const ab = lineB.sub(lineA);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(lineA);
    const t = p.sub(lineA).dot(ab) / abSq;
    return p.distTo(lineA.add(ab.mul(t)));
  },
  /** Shortest distance from point to segment ab. */
  distanceToSegment(p, a, b) {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distTo(a.add(ab.mul(t)));
  },
  /** Squared distance from point to segment ab (avoids sqrt). */
  distanceToSegmentSq(p, a, b) {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distSqTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distSqTo(a.add(ab.mul(t)));
  },
  /** 2D distance from point to segment (XY only). */
  distanceToSegment2D(p, a, b) {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = HMath.clamp(p.sub(a).dot(ab) / abSq, 0, 1);
    return p.distTo(a.add(ab.mul(t)));
  },
  /** 2D distance from point to infinite line through a and b. */
  distanceToLine2D(p, a, b) {
    const ab = b.sub(a);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return p.distTo(a);
    const t = p.sub(a).dot(ab) / abSq;
    return p.distTo(a.add(ab.mul(t)));
  },
  // ================================================================
  // CLOSEST POINT
  // ================================================================
  /** Closest point on infinite line through a and b to point p. */
  closestPointOnLine(p, lineA, lineB) {
    const ab = lineB.sub(lineA);
    const abSq = ab.lenSq();
    if (abSq < EPSILON) return lineA;
    const t = p.sub(lineA).dot(ab) / abSq;
    return lineA.add(ab.mul(t));
  },
  /**
   * Closest points between two 3D line segments.
   * Returns { c1, c2 } — points on segment 1 and segment 2.
   */
  closestPointsSegmentSegment(a1, a2, b1, b2) {
    const u = a2.sub(a1);
    const v = b2.sub(b1);
    const w = a1.sub(b1);
    const a = u.dot(u);
    const b = u.dot(v);
    const c = v.dot(v);
    const d = u.dot(w);
    const e = v.dot(w);
    const D = a * c - b * b;
    let sN, sD = D;
    let tN, tD = D;
    if (D < EPSILON) {
      sN = 0;
      sD = 1;
      tN = e;
      tD = c;
    } else {
      sN = b * e - c * d;
      tN = a * e - b * d;
      if (sN < 0) {
        sN = 0;
        tN = e;
        tD = c;
      } else if (sN > sD) {
        sN = sD;
        tN = e + b;
        tD = c;
      }
    }
    if (tN < 0) {
      tN = 0;
      if (-d < 0) sN = 0;
      else if (-d > a) sN = sD;
      else {
        sN = -d;
        sD = a;
      }
    } else if (tN > tD) {
      tN = tD;
      if (-d + b < 0) sN = 0;
      else if (-d + b > a) sN = sD;
      else {
        sN = -d + b;
        sD = a;
      }
    }
    const sc = Math.abs(sN) < EPSILON ? 0 : sN / sD;
    const tc = Math.abs(tN) < EPSILON ? 0 : tN / tD;
    return {
      c1: a1.add(u.mul(sc)),
      c2: b1.add(v.mul(tc))
    };
  },
  // ================================================================
  // PROJECTION
  // ================================================================
  /** Projects a vector onto a plane defined by its normal. */
  projectOnPlane(v, planeNormal) {
    return v.sub(planeNormal.mul(v.dot(planeNormal)));
  },
  // ================================================================
  // OFFSET (2D line offset for polygon operations)
  // ================================================================
  /**
   * Offsets a 2D line segment by a perpendicular distance.
   * Positive = left side when walking from p1 to p2.
   */
  offsetSegment2D(p1, p2, offset) {
    const dir = p2.sub(p1).normalize();
    const perp = new Vec2(-dir.y, dir.x);
    const off = perp.mul(offset);
    return { a: p1.add(off), b: p2.add(off) };
  },
  // ================================================================
  // MATRIX CONSTRUCTION
  // ================================================================
  /**
   * Creates a rotation matrix that rotates direction 'from' to direction 'to'.
   * Both should be unit vectors.
   */
  rotationBetween(from, to) {
    const dot = from.dot(to);
    if (dot > 1 - EPSILON) return Mat4.identity();
    if (dot < -1 + EPSILON) {
      let axis2 = Vec3.unitX().cross(from);
      if (axis2.lenSq() < EPSILON) axis2 = Vec3.unitY().cross(from);
      axis2 = axis2.normalize();
      const k = axis2;
      const m2 = new Float64Array(16);
      m2[0] = 2 * k.x * k.x - 1;
      m2[4] = 2 * k.x * k.y;
      m2[8] = 2 * k.x * k.z;
      m2[12] = 0;
      m2[1] = 2 * k.y * k.x;
      m2[5] = 2 * k.y * k.y - 1;
      m2[9] = 2 * k.y * k.z;
      m2[13] = 0;
      m2[2] = 2 * k.z * k.x;
      m2[6] = 2 * k.z * k.y;
      m2[10] = 2 * k.z * k.z - 1;
      m2[14] = 0;
      m2[3] = 0;
      m2[7] = 0;
      m2[11] = 0;
      m2[15] = 1;
      return new Mat4(m2);
    }
    const cross = from.cross(to);
    const angle = Math.acos(HMath.clamp(dot, -1, 1));
    const axis = cross.normalize();
    const co = Math.cos(angle), s = Math.sin(angle), t = 1 - co;
    const { x, y, z } = axis;
    const m = new Float64Array(16);
    m[0] = t * x * x + co;
    m[4] = t * x * y - s * z;
    m[8] = t * x * z + s * y;
    m[12] = 0;
    m[1] = t * x * y + s * z;
    m[5] = t * y * y + co;
    m[9] = t * y * z - s * x;
    m[13] = 0;
    m[2] = t * x * z - s * y;
    m[6] = t * y * z + s * x;
    m[10] = t * z * z + co;
    m[14] = 0;
    m[3] = 0;
    m[7] = 0;
    m[11] = 0;
    m[15] = 1;
    return new Mat4(m);
  },
  /**
   * Builds a coordinate frame matrix from an origin, a Z-axis direction (normal),
   * and an approximate X-axis hint.
   */
  frameFromNormal(origin, normal, xHint) {
    const z = normal.normalize();
    const hint = xHint ?? (Math.abs(z.dot(Vec3.unitY())) < 0.99 ? Vec3.unitY() : Vec3.unitX());
    const x = hint.cross(z).normalize();
    const y = z.cross(x);
    const m = new Float64Array(16);
    m[0] = x.x;
    m[1] = x.y;
    m[2] = x.z;
    m[3] = 0;
    m[4] = y.x;
    m[5] = y.y;
    m[6] = y.z;
    m[7] = 0;
    m[8] = z.x;
    m[9] = z.y;
    m[10] = z.z;
    m[11] = 0;
    m[12] = origin.x;
    m[13] = origin.y;
    m[14] = origin.z;
    m[15] = 1;
    return new Mat4(m);
  },
  // ================================================================
  // WINDING & ORIENTATION
  // ================================================================
  /**
   * Returns the signed area of the parallelogram formed by triangle (p0, p1, p2) in 2D.
   * Positive if counter-clockwise, negative if clockwise.
   */
  cross2D(p0, p1, p2) {
    return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
  },
  /** Returns +1 (CCW/left), -1 (CW/right), or 0 (collinear). */
  orientation(p0, p1, p2) {
    const c = VecMath.cross2D(p0, p1, p2);
    if (c > EPSILON) return 1;
    if (c < -EPSILON) return -1;
    return 0;
  },
  /** Tests if four 2D points form a convex quadrilateral. */
  isConvexQuad(a, b, c, d) {
    const o1 = VecMath.orientation(a, b, c);
    const o2 = VecMath.orientation(b, c, d);
    const o3 = VecMath.orientation(c, d, a);
    const o4 = VecMath.orientation(d, a, b);
    return o1 === o2 && o2 === o3 && o3 === o4 && o1 !== 0;
  },
  /** Tests if a point lies on the line segment ab (2D, within tolerance). */
  isPointOnSegment2D(a, b, p, tolerance = 1e-3) {
    return VecMath.distanceToSegment2D(p, a, b) < tolerance;
  },
  // ================================================================
  // TRIANGLE UTILITIES
  // ================================================================
  /** Signed volume of tetrahedron formed by triangle and origin (for mesh volume). */
  triangleSignedVolume(a, b, c) {
    return a.dot(b.cross(c)) / 6;
  },
  /** 3D triangle area via cross product magnitude. */
  triangleArea(a, b, c) {
    return b.sub(a).cross(c.sub(a)).len() * 0.5;
  },
  /** 2D triangle area (signed). */
  triangleArea2D(a, b, c) {
    return VecMath.cross2D(a, b, c) * 0.5;
  },
  /** Normal of a triangle (unit length). */
  triangleNormal(a, b, c) {
    return b.sub(a).cross(c.sub(a)).normalize();
  },
  // ================================================================
  // BISECTOR
  // ================================================================
  /**
   * 2D angular bisector direction at vertex P between edges PA and PB.
   * The returned vector points into the bisector, unit length.
   */
  bisector2D(p, a, b) {
    const da = a.sub(p).normalize();
    const db = b.sub(p).normalize();
    const bisect = da.add(db);
    const len = bisect.len();
    if (len < EPSILON) return VecMath.rotate90(da);
    return bisect.div(len);
  },
  // ================================================================
  // ARC UTILITIES
  // ================================================================
  /** Arc length from angle and radius. */
  arcLength(angle, radius) {
    return radius * angle;
  },
  /** Arc angle from arc length and radius. */
  arcAngle(length, radius) {
    return length / radius;
  },
  // ================================================================
  // 3x3 DETERMINANT
  // ================================================================
  /** Determinant of a 3x3 matrix given by rows. */
  determinant3x3(a, b, c, d, e, f, g, h, i) {
    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  },
  /** Direction, length, and unit perpendicular of a 2D segment (XY plane). */
  segmentPerpendicular2D(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < EPSILON) return { dx: 0, dy: 0, len: 0, px: 0, py: 0 };
    return { dx: dx / len, dy: dy / len, len, px: -dy / len, py: dx / len };
  }
};

// src/core/geometry/AABB.ts
var AABB = class _AABB {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }
  static empty() {
    return new _AABB(
      new Vec3(Infinity, Infinity, Infinity),
      new Vec3(-Infinity, -Infinity, -Infinity)
    );
  }
  static fromPoints(points) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      minZ = Math.min(minZ, p.z);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      maxZ = Math.max(maxZ, p.z);
    }
    return new _AABB(new Vec3(minX, minY, minZ), new Vec3(maxX, maxY, maxZ));
  }
  center() {
    return this.min.lerp(this.max, 0.5);
  }
  size() {
    return this.max.sub(this.min);
  }
  volume() {
    const s = this.size();
    return s.x * s.y * s.z;
  }
  expand(point) {
    return new _AABB(
      new Vec3(Math.min(this.min.x, point.x), Math.min(this.min.y, point.y), Math.min(this.min.z, point.z)),
      new Vec3(Math.max(this.max.x, point.x), Math.max(this.max.y, point.y), Math.max(this.max.z, point.z))
    );
  }
  union(other) {
    return new _AABB(
      new Vec3(Math.min(this.min.x, other.min.x), Math.min(this.min.y, other.min.y), Math.min(this.min.z, other.min.z)),
      new Vec3(Math.max(this.max.x, other.max.x), Math.max(this.max.y, other.max.y), Math.max(this.max.z, other.max.z))
    );
  }
  containsPoint(p) {
    return p.x >= this.min.x && p.x <= this.max.x && p.y >= this.min.y && p.y <= this.max.y && p.z >= this.min.z && p.z <= this.max.z;
  }
  intersectsAABB(other) {
    return this.max.x >= other.min.x && this.min.x <= other.max.x && this.max.y >= other.min.y && this.min.y <= other.max.y && this.max.z >= other.min.z && this.min.z <= other.max.z;
  }
  toJSON() {
    return { min: this.min.toJSON(), max: this.max.toJSON() };
  }
};

// src/core/geometry/Segment.ts
var Segment = class _Segment {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  get direction() {
    return this.b.sub(this.a);
  }
  get length() {
    return this.a.distTo(this.b);
  }
  get lengthSquared() {
    return this.a.distSqTo(this.b);
  }
  get midpoint() {
    return this.a.add(this.b).mul(0.5);
  }
  /** Point on segment at parameter t (0=A, 1=B). */
  pointAt(t) {
    return this.a.lerp(this.b, t);
  }
  /** Closest point on this segment to point p. */
  closestPoint(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.lenSq();
    if (abSq < HMath.EPSILON) return this.a;
    const t = HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
    return this.a.add(ab.mul(t));
  }
  /** Parameter t of the closest point on the segment to p (clamped 0..1). */
  closestParameter(p) {
    const ab = this.b.sub(this.a);
    const abSq = ab.lenSq();
    if (abSq < HMath.EPSILON) return 0;
    return HMath.clamp(p.sub(this.a).dot(ab) / abSq, 0, 1);
  }
  /** Distance from a point to this segment. */
  distanceTo(p) {
    return p.distTo(this.closestPoint(p));
  }
  /** Squared distance from a point to this segment. */
  distanceSquaredTo(p) {
    return p.distSqTo(this.closestPoint(p));
  }
  /** Bounding box of this segment. */
  get bounds() {
    return new AABB(
      new Vec3(Math.min(this.a.x, this.b.x), Math.min(this.a.y, this.b.y), Math.min(this.a.z, this.b.z)),
      new Vec3(Math.max(this.a.x, this.b.x), Math.max(this.a.y, this.b.y), Math.max(this.a.z, this.b.z))
    );
  }
  /** Splits a segment into n equal parts, returning n+1 points. */
  static split(a, b, segments) {
    if (segments < 1) segments = 1;
    const pts = [];
    for (let i = 0; i <= segments; i++)
      pts.push(a.lerp(b, i / segments));
    return pts;
  }
  /**
   * Finds the closest points between this segment and another.
   * Returns { c1, c2 } — points on this segment and the other.
   */
  closestPointsTo(other) {
    return VecMath.closestPointsSegmentSegment(this.a, this.b, other.a, other.b);
  }
  /** Shortest distance between two segments. */
  distanceToSegment(other) {
    const { c1, c2 } = this.closestPointsTo(other);
    return c1.distTo(c2);
  }
  /** Returns a new segment reversed (B→A). */
  reversed() {
    return new _Segment(this.b, this.a);
  }
  toString() {
    return `Segment [${this.a} \u2192 ${this.b}]`;
  }
};
function closestPointOnSegment(p, a, b) {
  const ab = b.sub(a);
  const lenSq = ab.lenSq();
  if (lenSq < HMath.EPSILON) return a;
  const t = HMath.clamp(p.sub(a).dot(ab) / lenSq, 0, 1);
  return a.add(ab.mul(t));
}
function segmentSegmentClosest(a1, a2, b1, b2) {
  const d1 = a2.sub(a1), d2 = b2.sub(b1), r = a1.sub(b1);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  let t, u;
  if (a <= HMath.EPSILON && e <= HMath.EPSILON) {
    return { pointA: a1, pointB: b1, t: 0, u: 0 };
  }
  if (a <= HMath.EPSILON) {
    t = 0;
    u = HMath.clamp(f / e, 0, 1);
  } else {
    const c = d1.dot(r);
    if (e <= HMath.EPSILON) {
      u = 0;
      t = HMath.clamp(-c / a, 0, 1);
    } else {
      const b = d1.dot(d2);
      const denom = a * e - b * b;
      t = denom !== 0 ? HMath.clamp((b * f - c * e) / denom, 0, 1) : 0;
      u = (b * t + f) / e;
      if (u < 0) {
        u = 0;
        t = HMath.clamp(-c / a, 0, 1);
      } else if (u > 1) {
        u = 1;
        t = HMath.clamp((b - c) / a, 0, 1);
      }
    }
  }
  return {
    pointA: a1.add(d1.mul(t)),
    pointB: b1.add(d2.mul(u)),
    t,
    u
  };
}

// src/io/DxfWriter.ts
function _sanLayer(s) {
  return s.trim().replace(/[^A-Za-z0-9$_-]/g, "_").slice(0, 31) || "LAYER0";
}
function _real(n) {
  if (!Number.isFinite(n) || Math.abs(n) < 1e-9) return "0";
  let s = n.toFixed(9);
  if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}
function _resolveLayers(defs, used) {
  const colorOf = /* @__PURE__ */ new Map();
  const names = [];
  for (const d of defs) {
    const n = _sanLayer(d.name);
    if (!colorOf.has(n)) {
      names.push(n);
      colorOf.set(n, d.color ?? 7);
    }
  }
  for (const raw of used) {
    const n = _sanLayer(raw);
    if (!colorOf.has(n)) {
      names.push(n);
      colorOf.set(n, 7);
    }
  }
  return { names, colorOf };
}
var LINETYPES = {
  DASHED: { desc: "Dashed __ __ __", pattern: [3, -1.5] },
  HIDDEN: { desc: "Hidden _ _ _ _", pattern: [1.5, -1] },
  DOTTED: { desc: "Dotted . . . .", pattern: [0, -1] },
  CENTER: { desc: "Center ____ _ ____", pattern: [6, -1.2, 1, -1.2] }
};
function _writeR12Prologue(lines, names, colorOf, scale = 1e3, linetypes = {}) {
  const used = [.../* @__PURE__ */ new Set([...linetypes.used ?? [], ...linetypes.layerType?.values() ?? []])].filter((n) => n in LINETYPES);
  const ps = linetypes.patternScale ?? 1;
  lines.push(
    "0",
    "SECTION",
    "2",
    "HEADER",
    "9",
    "$ACADVER",
    "1",
    "AC1009",
    "9",
    "$INSUNITS",
    "70",
    scale === 1 ? "6" : "4",
    "9",
    "$MEASUREMENT",
    "70",
    "1",
    "0",
    "ENDSEC"
  );
  lines.push("0", "SECTION", "2", "TABLES");
  lines.push("0", "TABLE", "2", "LTYPE", "70", String(1 + used.length));
  lines.push("0", "LTYPE", "2", "CONTINUOUS", "70", "0", "3", "Solid line", "72", "65", "73", "0", "40", "0");
  for (const name of used) {
    const { desc, pattern } = LINETYPES[name];
    const total = pattern.reduce((a, b) => a + Math.abs(b), 0) * ps;
    lines.push("0", "LTYPE", "2", name, "70", "0", "3", desc, "72", "65", "73", String(pattern.length), "40", _real(total));
    for (const d of pattern) lines.push("49", _real(d * ps));
  }
  lines.push("0", "ENDTAB");
  lines.push("0", "TABLE", "2", "LAYER", "70", String(names.length));
  for (const name of names) lines.push("0", "LAYER", "2", name, "70", "0", "62", String(colorOf.get(name) ?? 7), "6", linetypes.layerType?.get(name) ?? "CONTINUOUS");
  lines.push("0", "ENDTAB", "0", "ENDSEC");
  lines.push("0", "SECTION", "2", "BLOCKS", "0", "ENDSEC");
}
function writeDxf3D(content) {
  const polylines = content.polylines ?? [];
  const lineSegs = content.lines ?? [];
  const points = content.points ?? [];
  const arcs = content.arcs ?? [];
  const circles = content.circles ?? [];
  const lines = [];
  const okR = (r) => Number.isFinite(r) && r > 1e-9;
  const finite = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
  const bad = (what, i, layer) => {
    throw new Error(`writeDxf3D: ${what} ${i} (layer "${layer}") has a non-finite coordinate`);
  };
  polylines.forEach((p, i) => {
    if (!p.points.every(finite)) bad("polyline", i, p.layer);
  });
  lineSegs.forEach((l, i) => {
    if (!finite(l.start) || !finite(l.end)) bad("line", i, l.layer);
  });
  points.forEach((pt, i) => {
    if (!finite(pt.position)) bad("point", i, pt.layer);
  });
  arcs.forEach((a, i) => {
    if (okR(a.radius) && (!finite(a.center) || !Number.isFinite(a.startDeg) || !Number.isFinite(a.endDeg))) bad("arc", i, a.layer);
  });
  circles.forEach((c, i) => {
    if (okR(c.radius) && !finite(c.center)) bad("circle", i, c.layer);
  });
  const used = /* @__PURE__ */ new Set();
  for (const p of polylines) if (p.points.length >= 2) used.add(p.layer);
  for (const s of lineSegs) used.add(s.layer);
  for (const a of arcs) if (okR(a.radius)) used.add(a.layer);
  for (const c of circles) if (okR(c.radius)) used.add(c.layer);
  for (const pt of points) used.add(pt.layer);
  const { names, colorOf } = _resolveLayers(content.layers ?? [], used);
  _writeR12Prologue(lines, names, colorOf, 1);
  const emitCircle = (layer, c, r) => lines.push("0", "CIRCLE", "8", _sanLayer(layer), "10", _real(c.x), "20", _real(c.y), "30", _real(c.z), "40", _real(r));
  lines.push("0", "SECTION", "2", "ENTITIES");
  for (const poly of polylines) {
    if (poly.points.length < 2) continue;
    const layer = _sanLayer(poly.layer);
    lines.push("0", "POLYLINE", "8", layer, "66", "1", "70", poly.closed ? "9" : "8");
    lines.push("10", "0", "20", "0", "30", "0");
    for (const p of poly.points) {
      lines.push("0", "VERTEX", "8", layer, "10", _real(p.x), "20", _real(p.y), "30", _real(p.z), "70", "32");
    }
    lines.push("0", "SEQEND", "8", layer);
  }
  for (const s of lineSegs) {
    lines.push(
      "0",
      "LINE",
      "8",
      _sanLayer(s.layer),
      "10",
      _real(s.start.x),
      "20",
      _real(s.start.y),
      "30",
      _real(s.start.z),
      "11",
      _real(s.end.x),
      "21",
      _real(s.end.y),
      "31",
      _real(s.end.z)
    );
  }
  for (const c of circles) if (okR(c.radius)) emitCircle(c.layer, c.center, c.radius);
  for (const a of arcs) {
    if (!okR(a.radius)) continue;
    if (Math.abs(a.endDeg - a.startDeg) >= 360 - 1e-6) {
      emitCircle(a.layer, a.center, a.radius);
      continue;
    }
    const norm = (d) => {
      let x = d % 360;
      if (x < 0) x += 360;
      return x;
    };
    lines.push(
      "0",
      "ARC",
      "8",
      _sanLayer(a.layer),
      "10",
      _real(a.center.x),
      "20",
      _real(a.center.y),
      "30",
      _real(a.center.z),
      "40",
      _real(a.radius),
      "50",
      _real(norm(a.startDeg)),
      "51",
      _real(norm(a.endDeg))
    );
  }
  for (const pt of points) {
    lines.push("0", "POINT", "8", _sanLayer(pt.layer), "10", _real(pt.position.x), "20", _real(pt.position.y), "30", _real(pt.position.z));
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\r\n") + "\r\n";
}
function writeDxf2D(content, opts = {}) {
  const scale = opts.scale ?? 1;
  if (!(Number.isFinite(scale) && scale > 0)) throw new Error(`writeDxf2D: scale must be a positive number, got ${scale}`);
  const polylines = content.polylines ?? [];
  const lineSegs = content.lines ?? [];
  const circles = content.circles ?? [];
  const arcs = content.arcs ?? [];
  const texts = content.texts ?? [];
  const solids = content.solids ?? [];
  const okR = (r) => Number.isFinite(r) && r > 1e-9;
  const finite = (p) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const bad = (what, i, layer, why = "a non-finite coordinate") => {
    throw new Error(`writeDxf2D: ${what} ${i} (layer "${layer}") has ${why}`);
  };
  polylines.forEach((p, i) => {
    if (!p.points.every(finite)) bad("polyline", i, p.layer);
  });
  lineSegs.forEach((l, i) => {
    if (!finite(l.start) || !finite(l.end)) bad("line", i, l.layer);
  });
  circles.forEach((c, i) => {
    if (okR(c.radius) && !finite(c.center)) bad("circle", i, c.layer);
  });
  arcs.forEach((a, i) => {
    if (okR(a.radius) && (!finite(a.center) || !Number.isFinite(a.startDeg) || !Number.isFinite(a.endDeg))) bad("arc", i, a.layer);
  });
  texts.forEach((t, i) => {
    if (!finite(t.at)) bad("text", i, t.layer);
    if (!(Number.isFinite(t.height) && t.height > 0)) bad("text", i, t.layer, `a height of ${t.height} (needs > 0)`);
  });
  const used = /* @__PURE__ */ new Set();
  for (const p of polylines) if (p.points.length >= 2) used.add(p.layer);
  for (const l of lineSegs) used.add(l.layer);
  for (const c of circles) if (okR(c.radius)) used.add(c.layer);
  for (const a of arcs) if (okR(a.radius)) used.add(a.layer);
  for (const t of texts) used.add(t.layer);
  for (const so of solids) if (so.points.length >= 3) used.add(so.layer);
  solids.forEach((so, i) => {
    if (!so.points.every(finite)) bad("solid", i, so.layer);
  });
  const lines = [];
  const { names, colorOf } = _resolveLayers(content.layers ?? [], used);
  const layerType = /* @__PURE__ */ new Map();
  for (const d of content.layers ?? []) if (d.lineType && d.lineType !== "CONTINUOUS") layerType.set(_sanLayer(d.name), d.lineType.toUpperCase());
  const usedTypes = [...polylines, ...lineSegs, ...circles, ...arcs].map((e) => e.linetype).filter((t) => !!t);
  _writeR12Prologue(lines, names, colorOf, scale, { used: usedTypes, layerType, patternScale: opts.linetypeScale ?? 1 });
  const look = (e) => [...e.linetype ? ["6", e.linetype] : [], ...e.color !== void 0 ? ["62", String(e.color)] : []];
  const v = (n) => _real(n * scale);
  const xy = (p) => ["10", v(p.x), "20", v(p.y), "30", "0"];
  const emitCircle = (e, c, r) => lines.push("0", "CIRCLE", "8", _sanLayer(e.layer), ...look(e), ...xy(c), "40", v(r));
  lines.push("0", "SECTION", "2", "ENTITIES");
  for (const poly of polylines) {
    if (poly.points.length < 2) continue;
    const layer = _sanLayer(poly.layer);
    lines.push("0", "POLYLINE", "8", layer, ...look(poly), "66", "1", "70", poly.closed ? "1" : "0", "10", "0", "20", "0", "30", "0");
    for (const p of poly.points) lines.push("0", "VERTEX", "8", layer, ...xy(p), "70", "0");
    lines.push("0", "SEQEND", "8", layer);
  }
  for (const l of lineSegs) {
    lines.push("0", "LINE", "8", _sanLayer(l.layer), ...look(l), ...xy(l.start), "11", v(l.end.x), "21", v(l.end.y), "31", "0");
  }
  for (const c of circles) if (okR(c.radius)) emitCircle(c, c.center, c.radius);
  for (const a of arcs) {
    if (!okR(a.radius)) continue;
    if (Math.abs(a.endDeg - a.startDeg) >= 360 - 1e-6) {
      emitCircle(a, a.center, a.radius);
      continue;
    }
    const norm = (d) => {
      let x = d % 360;
      if (x < 0) x += 360;
      return x;
    };
    lines.push("0", "ARC", "8", _sanLayer(a.layer), ...look(a), ...xy(a.center), "40", v(a.radius), "50", _real(norm(a.startDeg)), "51", _real(norm(a.endDeg)));
  }
  for (const so of solids) {
    if (so.points.length < 3) continue;
    const [p1, p2, p3, p4 = so.points[2]] = so.points;
    lines.push(
      "0",
      "SOLID",
      "8",
      _sanLayer(so.layer),
      ...so.color !== void 0 ? ["62", String(so.color)] : [],
      "10",
      v(p1.x),
      "20",
      v(p1.y),
      "30",
      "0",
      "11",
      v(p2.x),
      "21",
      v(p2.y),
      "31",
      "0",
      "12",
      v(p4.x),
      "22",
      v(p4.y),
      "32",
      "0",
      "13",
      v(p3.x),
      "23",
      v(p3.y),
      "33",
      "0"
    );
  }
  for (const t of texts) {
    const h = t.align === "center" ? 1 : t.align === "right" ? 2 : 0;
    const vj = t.valign === "bottom" ? 1 : t.valign === "middle" ? 2 : t.valign === "top" ? 3 : 0;
    lines.push(
      "0",
      "TEXT",
      "8",
      _sanLayer(t.layer),
      ...t.color !== void 0 ? ["62", String(t.color)] : [],
      ...xy(t.at),
      "40",
      v(t.height),
      "1",
      t.text.replace(/[\r\n]+/g, " "),
      "50",
      _real(t.rotationDeg ?? 0)
    );
    if (h || vj) lines.push("72", String(h), "11", v(t.at.x), "21", v(t.at.y), "31", "0", "73", String(vj));
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\r\n") + "\r\n";
}
var ACI = [
  [1, 255, 0, 0],
  [2, 255, 255, 0],
  [3, 0, 255, 0],
  [4, 0, 255, 255],
  [5, 0, 0, 255],
  [6, 255, 0, 255],
  [7, 0, 0, 0],
  [8, 128, 128, 128],
  [9, 192, 192, 192],
  [250, 51, 51, 51],
  [251, 80, 80, 80],
  [252, 105, 105, 105],
  [253, 130, 130, 130],
  [254, 190, 190, 190],
  [255, 255, 255, 255],
  [30, 255, 127, 0],
  [140, 0, 127, 255],
  [210, 255, 0, 127],
  [94, 0, 127, 0],
  [14, 127, 0, 0]
];
function aciFromHex(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 7;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  if (Math.max(r, g, b) - Math.min(r, g, b) < 24 && (r < 40 || r > 235)) return 7;
  let best = 7, bestD = Infinity;
  for (const [i, R, G, B] of ACI) {
    const d = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export {
  HMath,
  MathUtils,
  Vec2,
  Vec3,
  Vec4,
  Mat4,
  collabColor,
  SharedStore,
  memoryAdapter,
  devServerAdapter,
  supabaseAdapter,
  checkRecord,
  Doc,
  localAdapter,
  applyPatch,
  bindScene,
  Selection,
  selectOnClick,
  shareSelection,
  stampName,
  download,
  VecMath,
  AABB,
  Segment,
  closestPointOnSegment,
  segmentSegmentClosest,
  _sanLayer,
  _resolveLayers,
  _writeR12Prologue,
  writeDxf3D,
  writeDxf2D,
  ACI,
  aciFromHex
};
