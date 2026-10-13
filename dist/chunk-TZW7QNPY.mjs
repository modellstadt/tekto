import {
  HMath,
  Vec2,
  Vec3,
  VecMath
} from "./chunk-VTSIDLJ7.mjs";

// src/core/math/noise.ts
var P = [
  151,
  160,
  137,
  91,
  90,
  15,
  131,
  13,
  201,
  95,
  96,
  53,
  194,
  233,
  7,
  225,
  140,
  36,
  103,
  30,
  69,
  142,
  8,
  99,
  37,
  240,
  21,
  10,
  23,
  190,
  6,
  148,
  247,
  120,
  234,
  75,
  0,
  26,
  197,
  62,
  94,
  252,
  219,
  203,
  117,
  35,
  11,
  32,
  57,
  177,
  33,
  88,
  237,
  149,
  56,
  87,
  174,
  20,
  125,
  136,
  171,
  168,
  68,
  175,
  74,
  165,
  71,
  134,
  139,
  48,
  27,
  166,
  77,
  146,
  158,
  231,
  83,
  111,
  229,
  122,
  60,
  211,
  133,
  230,
  220,
  105,
  92,
  41,
  55,
  46,
  245,
  40,
  244,
  102,
  143,
  54,
  65,
  25,
  63,
  161,
  1,
  216,
  80,
  73,
  209,
  76,
  132,
  187,
  208,
  89,
  18,
  169,
  200,
  196,
  135,
  130,
  116,
  188,
  159,
  86,
  164,
  100,
  109,
  198,
  173,
  186,
  3,
  64,
  52,
  217,
  226,
  250,
  124,
  123,
  5,
  202,
  38,
  147,
  118,
  126,
  255,
  82,
  85,
  212,
  207,
  206,
  59,
  227,
  47,
  16,
  58,
  17,
  182,
  189,
  28,
  42,
  223,
  183,
  170,
  213,
  119,
  248,
  152,
  2,
  44,
  154,
  163,
  70,
  221,
  153,
  101,
  155,
  167,
  43,
  172,
  9,
  129,
  22,
  39,
  253,
  19,
  98,
  108,
  110,
  79,
  113,
  224,
  232,
  178,
  185,
  112,
  104,
  218,
  246,
  97,
  228,
  251,
  34,
  242,
  193,
  238,
  210,
  144,
  12,
  191,
  179,
  162,
  241,
  81,
  51,
  145,
  235,
  249,
  14,
  239,
  107,
  49,
  192,
  214,
  31,
  181,
  199,
  106,
  157,
  184,
  84,
  204,
  176,
  115,
  121,
  50,
  45,
  127,
  4,
  150,
  254,
  138,
  236,
  205,
  93,
  222,
  114,
  67,
  29,
  24,
  72,
  243,
  141,
  128,
  195,
  78,
  66,
  215,
  61,
  156,
  180
];
var perm = new Uint8Array(512);
for (let i = 0; i < 512; i++) perm[i] = P[i & 255];
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(t, a, b) {
  return a + t * (b - a);
}
function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
function noise3D(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = perm[X] + Y;
  const AA = perm[A] + Z;
  const AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y;
  const BA = perm[B] + Z;
  const BB = perm[B + 1] + Z;
  const res = lerp(
    w,
    lerp(
      v,
      lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
      lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1))
    )
  );
  return (res + 1) * 0.5;
}
function noise(x, y = 0, z = 0) {
  return noise3D(x, y, z);
}

// src/core/math/random.ts
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function createRandom(seed) {
  let rng = mulberry32(seed ?? Date.now() ^ Math.random() * 4294967295);
  return {
    random(min, max) {
      const v = rng();
      if (min === void 0) return v;
      if (max === void 0) return v * min;
      return min + v * (max - min);
    },
    randomSeed(s) {
      rng = mulberry32(s);
    }
  };
}

// src/gui/Params.ts
var ParamStore = class {
  constructor(schema) {
    this.values = {};
    this.listeners = /* @__PURE__ */ new Set();
    this.keyListeners = /* @__PURE__ */ new Map();
    this.schema = schema;
    for (const [key, def] of Object.entries(schema)) {
      if (def.type !== "button") {
        this.values[key] = def.default;
      }
    }
  }
  get(key) {
    return this.values[key];
  }
  set(key, value) {
    const def = this.schema[key];
    if (!def || def.type === "button") return;
    if (def.type === "float" || def.type === "int") {
      value = Math.max(def.min, Math.min(def.max, value));
      if (def.type === "int") value = Math.round(value);
    }
    if (def.type === "select" && !def.options.includes(value)) return;
    this.values[key] = value;
    for (const l of this.listeners) l(key, value, this.values);
    const kl = this.keyListeners.get(key);
    if (kl) for (const l of kl) l(value);
  }
  /**
   * Dynamically add (or refresh) a parameter definition. Used by the sketch
   * APIs, whose immediate-mode `lab.slider(...)` calls declare params during
   * the sketch run. Initializes the value from `default` the first time;
   * an existing value is preserved so re-defining across re-runs is cheap.
   * Does NOT notify listeners (definition is structure, not a value change).
   */
  define(key, def) {
    const existed = key in this.schema;
    this.schema[key] = def;
    if (!existed && def.type !== "button") {
      this.values[key] = def.default;
    }
  }
  /** Remove a parameter (and its value). Does not notify listeners. */
  remove(key) {
    delete this.schema[key];
    delete this.values[key];
    this.keyListeners.delete(key);
  }
  has(key) {
    return key in this.schema;
  }
  keys() {
    return Object.keys(this.schema);
  }
  /** Get all current values */
  getAll() {
    return { ...this.values };
  }
  /** Get the schema for a specific key */
  getDef(key) {
    return this.schema[key];
  }
  /** Get entire schema */
  getSchema() {
    return this.schema;
  }
  /** Listen to all changes */
  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /** Listen to a specific key */
  onKey(key, listener) {
    if (!this.keyListeners.has(key)) this.keyListeners.set(key, /* @__PURE__ */ new Set());
    this.keyListeners.get(key).add(listener);
    return () => this.keyListeners.get(key)?.delete(listener);
  }
  /** Reset all to defaults */
  reset() {
    for (const [key, def] of Object.entries(this.schema)) {
      if (def.type !== "button") {
        this.set(key, def.default);
      }
    }
  }
  /** Serialization */
  toJSON() {
    return { ...this.values };
  }
  loadJSON(json) {
    for (const [key, value] of Object.entries(json)) {
      if (key in this.schema) {
        this.set(key, value);
      }
    }
  }
  /**
   * The keys a person or an agent means by `name`, most specific first: the exact key;
   * else the control's label, ignoring case ("Radius"); else "Group:Label" for sketch
   * keys, which read `type:group:label`. One key when the name is unambiguous.
   */
  findKeys(name) {
    if (name in this.schema) return [name];
    const n = name.trim().toLowerCase();
    const keys = Object.keys(this.schema);
    const byLabel = keys.filter((k) => (this.schema[k].label ?? k).toLowerCase() === n);
    if (byLabel.length) return byLabel;
    return keys.filter((k) => {
      const parts = k.split(":");
      return parts.length >= 3 && `${parts[1]}:${parts.slice(2).join(":")}`.toLowerCase() === n;
    });
  }
  /**
   * Set params by key or label (see `findKeys`) and say what could not be applied,
   * instead of dropping it the way `loadJSON` does. For tools and agents.
   */
  setByName(values) {
    const applied = [], unknown = [];
    const ambiguous = [];
    for (const [name, value] of Object.entries(values)) {
      const keys = this.findKeys(name);
      if (keys.length === 0) unknown.push(name);
      else if (keys.length > 1) ambiguous.push({ name, keys });
      else {
        this.set(keys[0], value);
        applied.push(keys[0]);
      }
    }
    return { applied, unknown, ambiguous };
  }
  /** Every param as the name to use with `setByName`: its label, or "Group:Label" when two share a label. */
  names() {
    const keys = Object.keys(this.schema);
    const label = (k) => this.schema[k].label ?? k;
    return keys.map((k) => {
      if (keys.filter((o) => label(o).toLowerCase() === label(k).toLowerCase()).length === 1) return label(k);
      const parts = k.split(":");
      return parts.length >= 3 && parts[1] ? `${parts[1]}:${parts.slice(2).join(":")}` : k;
    });
  }
};
function createParams(schema) {
  return new ParamStore(schema);
}
function createLayout(folders) {
  return { folders };
}

// src/core/geometry/OBB2D.ts
var OBB2D = class {
  constructor(center, width, height, angle) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.angle = angle;
  }
  /** Unit direction along the width axis. */
  get axisU() {
    return VecMath.fromAngle2D(this.angle);
  }
  /** Unit direction along the height axis. */
  get axisV() {
    return VecMath.fromAngle2D(this.angle + Math.PI / 2);
  }
  get area() {
    return this.width * this.height;
  }
  /** Returns the 4 corners of the rectangle (CCW order). */
  get corners() {
    const u = this.axisU;
    const v = this.axisV;
    const hw = this.width * 0.5;
    const hh = this.height * 0.5;
    return [
      this.center.sub(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).sub(v.mul(hh)),
      this.center.add(u.mul(hw)).add(v.mul(hh)),
      this.center.sub(u.mul(hw)).add(v.mul(hh))
    ];
  }
  /** Tests whether a point lies inside the OBB. */
  contains(p) {
    const d = p.sub(this.center);
    const u = this.axisU;
    const v = this.axisV;
    const projU = Math.abs(d.dot(u));
    const projV = Math.abs(d.dot(v));
    return projU <= this.width * 0.5 + HMath.EPSILON && projV <= this.height * 0.5 + HMath.EPSILON;
  }
  toString() {
    return `OBB2D [Center:${this.center} W:${this.width.toFixed(3)} H:${this.height.toFixed(3)} Angle:${(this.angle * HMath.RAD2DEG).toFixed(1)}\xB0]`;
  }
};

// src/core/geometry/Polygon2D.ts
var TWO_PI = Math.PI * 2;
var Polygon2D = {
  // ================================================================
  // CROSS PRODUCT / ORIENTATION
  // ================================================================
  /** 2D cross product of vectors OA x OB */
  cross2D(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  },
  // ================================================================
  // AREA & PERIMETER
  // ================================================================
  /** Signed area of a 2D polygon (positive if CCW, negative if CW). */
  signedArea(polygon) {
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    }
    return area / 2;
  },
  /** Unsigned area. */
  area(polygon) {
    return Math.abs(Polygon2D.signedArea(polygon));
  },
  /** Total perimeter length. */
  perimeter(polygon) {
    let total = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++)
      total += polygon[i].distTo(polygon[(i + 1) % n]);
    return total;
  },
  /**
   * Total arc length of an open polyline (no implied closing edge).
   * Sums segment lengths between consecutive vertices.
   */
  polylineLength(polyline) {
    let total = 0;
    for (let i = 0; i < polyline.length - 1; i++)
      total += polyline[i].distTo(polyline[i + 1]);
    return total;
  },
  // ================================================================
  // RING NORMALIZATION
  // ================================================================
  /**
   * Return `polygon` with the closing duplicate vertex stripped (open ring).
   * Only strips when the polygon has ≥3 vertices and its first/last vertices
   * coincide within `eps`. Always returns a fresh array.
   */
  openRing(polygon, eps = 1e-12) {
    return polygon.length >= 3 && polygon[0].distSqTo(polygon[polygon.length - 1]) < eps ? polygon.slice(0, -1) : polygon.slice();
  },
  /**
   * Return `polygon` with a closing duplicate vertex appended (closed ring).
   * Polygons with <3 vertices are returned as a fresh copy unchanged.
   * Always returns a fresh array.
   */
  closeRing(polygon, eps = 1e-12) {
    if (polygon.length < 3) return polygon.slice();
    return polygon[0].distSqTo(polygon[polygon.length - 1]) < eps ? polygon.slice() : [...polygon, polygon[0]];
  },
  /** Returns true if polygon vertices are in counter-clockwise order. */
  isCCW(polygon) {
    return Polygon2D.signedArea(polygon) > 0;
  },
  // ================================================================
  // CENTER
  // ================================================================
  /** Average center (centroid of vertices, fast but not area-weighted). */
  averageCenter(polygon) {
    let sx = 0, sy = 0;
    for (const p of polygon) {
      sx += p.x;
      sy += p.y;
    }
    return new Vec2(sx / polygon.length, sy / polygon.length);
  },
  /** Area-weighted centroid (gravity center). */
  centroid2D(polygon) {
    const A = Polygon2D.signedArea(polygon);
    if (Math.abs(A) < HMath.EPSILON) return Polygon2D.averageCenter(polygon);
    let cx = 0, cy = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const f = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
      cx += (polygon[i].x + polygon[j].x) * f;
      cy += (polygon[i].y + polygon[j].y) * f;
    }
    const factor = 1 / (6 * A);
    return new Vec2(cx * factor, cy * factor);
  },
  // ================================================================
  // CONTAINMENT
  // ================================================================
  /** Point-in-polygon (ray casting, 2D). */
  pointInPolygon(point, polygon) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (yi > point.y !== yj > point.y && point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  },
  /** Point-in-polygon test using winding number (robust for concave polygons). */
  containsWinding(polygon, point) {
    let winding = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      if (a.y <= point.y) {
        if (b.y > point.y && VecMath.cross2D(a, b, point) > 0) winding++;
      } else {
        if (b.y <= point.y && VecMath.cross2D(a, b, point) < 0) winding--;
      }
    }
    return winding !== 0;
  },
  // ================================================================
  // CLOSEST POINT / VERTEX
  // ================================================================
  /** Index of the closest vertex to a point. */
  closestVertexIndex(polygon, point) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < polygon.length; i++) {
      const d = polygon[i].distSqTo(point);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  },
  /** Closest point on the polygon boundary to a given point. Returns { point, edgeIndex }. */
  closestPointOnEdge(polygon, point) {
    let bestEdge = 0;
    let bestDist = Infinity;
    let bestPt = polygon[0];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      const ab = b.sub(a);
      const abSq = ab.lenSq();
      const t = abSq < HMath.EPSILON ? 0 : HMath.clamp(point.sub(a).dot(ab) / abSq, 0, 1);
      const proj = a.add(ab.mul(t));
      const d = point.distSqTo(proj);
      if (d < bestDist) {
        bestDist = d;
        bestPt = proj;
        bestEdge = i;
      }
    }
    return { point: bestPt, edgeIndex: bestEdge };
  },
  /**
   * Closest point on a polyline to a query point, with arc-length.
   *
   * Treats `polyline` as a *sequence of segments* — if it's a closed polygon
   * (first point == last point), every segment is considered. If it's an open
   * polyline (first ≠ last), the last vertex closes a segment only when
   * `closed: true` is passed.
   *
   * Returns:
   *   - `point`        — the projected 2D point on the polyline.
   *   - `arcLength`    — distance from the polyline start to the projected point.
   *   - `segmentIndex` — index of the segment containing the projection.
   *   - `segmentT`     — 0..1 parameter along that segment.
   *   - `distance`     — distance from the query point to the projection.
   */
  closestPointOnPolyline(polyline, point, opts = {}) {
    const n = polyline.length;
    if (n < 2) return { point: polyline[0] ?? new Vec2(0, 0), arcLength: 0, segmentIndex: 0, segmentT: 0, distance: 0 };
    const closed = opts.closed ?? polyline[0].distSqTo(polyline[n - 1]) < 1e-12;
    const segCount = closed ? n : n - 1;
    let bestArc = 0, bestSeg = 0, bestT = 0;
    let bestPt = polyline[0];
    let bestDistSq = Infinity;
    let accLen = 0;
    for (let i = 0; i < segCount; i++) {
      const a = polyline[i];
      const b = polyline[(i + 1) % n];
      const ab = b.sub(a);
      const abSq = ab.lenSq();
      const t = abSq < HMath.EPSILON ? 0 : HMath.clamp(point.sub(a).dot(ab) / abSq, 0, 1);
      const proj = a.add(ab.mul(t));
      const d = point.distSqTo(proj);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestPt = proj;
        bestSeg = i;
        bestT = t;
        bestArc = accLen + t * Math.sqrt(abSq);
      }
      accLen += Math.sqrt(abSq);
    }
    return {
      point: bestPt,
      arcLength: bestArc,
      segmentIndex: bestSeg,
      segmentT: bestT,
      distance: Math.sqrt(bestDistSq)
    };
  },
  // ================================================================
  // INTERSECTION
  // ================================================================
  /** Segment-segment intersection (2D), returns parameter t along first segment. */
  segmentIntersect2D(a1, a2, b1, b2) {
    const d1 = a2.sub(a1), d2 = b2.sub(b1);
    const cross = d1.cross(d2);
    if (Math.abs(cross) < 1e-10) return null;
    const diff = b1.sub(a1);
    const t = diff.cross(d2) / cross;
    const u = diff.cross(d1) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { t, u, point: a1.add(d1.mul(t)) };
    }
    return null;
  },
  // ================================================================
  // OFFSET (parallel inset/outset)
  // ================================================================
  /**
   * Offsets a polygon by a distance. Works for both CCW and CW windings;
   * the function detects the orientation via signed area and produces a
   * geometrically *outward* offset for positive distance regardless.
   *
   *   distance > 0  →  polygon grows (outward / outset)
   *   distance < 0  →  polygon shrinks (inward / inset)
   *
   * Simple miter-join approach; may produce artifacts on very sharp angles
   * (the miter is clamped to 4× the offset distance to avoid spikes).
   */
  /**
   * Offset a simple polygon by moving each vertex along its corner bisector: positive
   * `distance` grows it, negative shrinks it, whichever way it winds. A ring that repeats
   * its first point comes back closed the same way. Insetting past the polygon's inner
   * radius returns `[]` (the polygon is gone) instead of an inverted shape. Vertex offset
   * only — no clean-up of self-intersections at deep concave insets; for those use
   * `PolygonBool`.
   */
  offset(polygon, distance) {
    if (!Number.isFinite(distance)) throw new Error(`Polygon2D.offset: distance must be a finite number, got ${distance}`);
    const closed = polygon.length > 3 && polygon[0].distSqTo(polygon[polygon.length - 1]) <= 1e-24;
    if (closed) polygon = Polygon2D.openRing(polygon);
    const n = polygon.length;
    if (n < 3) return [...polygon];
    const d = distance;
    const result = [];
    for (let i = 0; i < n; i++) {
      const prev = (i - 1 + n) % n;
      const next = (i + 1) % n;
      const e1Dir = polygon[i].sub(polygon[prev]).normalize();
      const e2Dir = polygon[next].sub(polygon[i]).normalize();
      const n1 = new Vec2(e1Dir.y, -e1Dir.x);
      const n2 = new Vec2(e2Dir.y, -e2Dir.x);
      const bisector = n1.add(n2);
      const bisLen = bisector.len();
      if (bisLen < HMath.EPSILON) {
        result.push(polygon[i].add(n1.mul(d)));
      } else {
        const bisNorm = bisector.div(bisLen);
        const sinHalfAngle = n1.x * bisNorm.y - n1.y * bisNorm.x;
        let scale = Math.abs(sinHalfAngle) < HMath.EPSILON ? d : d / sinHalfAngle;
        scale = HMath.clamp(scale, -Math.abs(d) * 4, Math.abs(d) * 4);
        result.push(polygon[i].add(bisNorm.mul(scale)));
      }
    }
    if (d < 0) {
      let reversed = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        if (polygon[j].sub(polygon[i]).dot(result[j].sub(result[i])) < 0) reversed++;
      }
      const a0 = Polygon2D.signedArea(polygon), a1 = Polygon2D.signedArea(result);
      if (reversed === n || Math.sign(a1) !== Math.sign(a0) || Math.abs(a1) < 1e-12 * Math.max(1, Math.abs(a0))) return [];
    }
    if (closed) result.push(result[0]);
    return result;
  },
  // ================================================================
  // SIMPLIFICATION
  // ================================================================
  /**
   * Douglas-Peucker simplification — removes points closer than tolerance
   * to the line between their neighbors.
   */
  simplify(polygon, tolerance) {
    if (polygon.length <= 3) return [...polygon];
    const keep = new Array(polygon.length).fill(true);
    let changed = true;
    const n = polygon.length;
    while (changed) {
      changed = false;
      for (let i = 0; i < n; i++) {
        if (!keep[i]) continue;
        const prev = prevKept(keep, i, n);
        const next = nextKept(keep, i, n);
        if (prev === next) continue;
        const dist = VecMath.distanceToSegment2D(polygon[i], polygon[prev], polygon[next]);
        if (dist < tolerance) {
          keep[i] = false;
          changed = true;
        }
      }
    }
    const result = [];
    for (let i = 0; i < n; i++)
      if (keep[i]) result.push(polygon[i]);
    return result.length >= 3 ? result : [...polygon];
  },
  /**
   * Removes vertices where the interior angle is close to 180°
   * (i.e. the vertex barely deviates from a straight line).
   */
  simplifyByAngle(polygon, minAngleRadians) {
    if (polygon.length <= 3) return [...polygon];
    const result = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const prev = polygon[(i - 1 + n) % n];
      const curr = polygon[i];
      const next = polygon[(i + 1) % n];
      const angle = VecMath.angleAtVertex(curr, prev, next);
      if (Math.PI - angle > minAngleRadians) result.push(curr);
    }
    return result.length >= 3 ? result : [...polygon];
  },
  /** Removes edges shorter than minLength by dropping one endpoint. */
  removeShortEdges(polygon, minLength) {
    if (polygon.length <= 3) return [...polygon];
    const minSq = minLength * minLength;
    const result = [polygon[0]];
    const n = polygon.length;
    for (let i = 1; i < n; i++) {
      if (result[result.length - 1].distSqTo(polygon[i]) >= minSq)
        result.push(polygon[i]);
    }
    if (result.length > 1 && result[result.length - 1].distSqTo(result[0]) < minSq)
      result.pop();
    return result.length >= 3 ? result : [...polygon];
  },
  // ================================================================
  // SUBDIVISION
  // ================================================================
  /** Subdivides every edge into n segments, producing n*vertexCount vertices. */
  subdivideEdges(polygon, subdivisions) {
    if (subdivisions < 2) return [...polygon];
    const n = polygon.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      for (let s = 0; s < subdivisions; s++)
        result.push(a.lerp(b, s / subdivisions));
    }
    return result;
  },
  /** Splits edges to ensure no edge is longer than maxLength. */
  splitLongEdges(polygon, maxLength) {
    const n = polygon.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      result.push(a);
      const len = a.distTo(b);
      if (len > maxLength) {
        const splits = Math.ceil(len / maxLength);
        for (let s = 1; s < splits; s++)
          result.push(a.lerp(b, s / splits));
      }
    }
    return result;
  },
  // ================================================================
  // NORMAL (for 3D n-gon, Newell's method)
  // ================================================================
  /**
   * Computes the best-fit normal for a 3D polygon using Newell's method.
   * Works for any number of vertices (not just triangles).
   */
  normal3D(polygon) {
    let nx = 0, ny = 0, nz = 0;
    const count = polygon.length;
    for (let i = 0; i < count; i++) {
      const curr = polygon[i];
      const next = polygon[(i + 1) % count];
      nx += (curr.y - next.y) * (curr.z + next.z);
      ny += (curr.z - next.z) * (curr.x + next.x);
      nz += (curr.x - next.x) * (curr.y + next.y);
    }
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return len > HMath.EPSILON ? new Vec3(nx / len, ny / len, nz / len) : Vec3.unitZ();
  },
  // ================================================================
  // FACTORY
  // ================================================================
  /** Creates a regular polygon (circle approximation) with n sides. */
  createCircle(radius, segments) {
    const pts = [];
    const twoPi = Math.PI * 2;
    for (let i = 0; i < segments; i++) {
      const angle = twoPi * i / segments;
      pts.push(new Vec2(radius * Math.cos(angle), radius * Math.sin(angle)));
    }
    return pts;
  },
  /** Creates a rectangle centered at origin. */
  createRect(width, height) {
    const w = width * 0.5, h = height * 0.5;
    return [
      new Vec2(-w, -h),
      new Vec2(w, -h),
      new Vec2(w, h),
      new Vec2(-w, h)
    ];
  },
  /** Returns the polygon with reversed winding order. */
  reverse(polygon) {
    return [...polygon].reverse();
  },
  // ================================================================
  // FILLET
  // ================================================================
  /**
   * Computes the fillet arc of given radius between two rays from a common origin.
   * Returns the arc center, tangent points, and oriented sweep angle.
   * The sweep is oriented so the arc passes through the interior
   * (the side facing the ray origin).
   */
  filletRays(origin, angle1, angle2, radius) {
    const d1x = Math.cos(angle1), d1y = Math.sin(angle1);
    const d2x = Math.cos(angle2), d2y = Math.sin(angle2);
    let interior = angle2 - angle1;
    while (interior > Math.PI) interior -= TWO_PI;
    while (interior <= -Math.PI) interior += TWO_PI;
    const half = Math.abs(interior) / 2;
    const bis = angle1 + interior / 2;
    const dist = radius / Math.sin(half);
    const cx = origin.x + Math.cos(bis) * dist;
    const cy = origin.y + Math.sin(bis) * dist;
    const vx = cx - origin.x, vy = cy - origin.y;
    const t1 = vx * d1x + vy * d1y;
    const t2 = vx * d2x + vy * d2y;
    const startPt = new Vec2(origin.x + d1x * t1, origin.y + d1y * t1);
    const endPt = new Vec2(origin.x + d2x * t2, origin.y + d2y * t2);
    const startAngle = Math.atan2(startPt.y - cy, startPt.x - cx);
    let endAngle = Math.atan2(endPt.y - cy, endPt.x - cx);
    const toOrigin = Math.atan2(origin.y - cy, origin.x - cx);
    let ccw = endAngle - startAngle;
    if (ccw < 0) ccw += TWO_PI;
    let offset = toOrigin - startAngle;
    if (offset < 0) offset += TWO_PI;
    const sweepAngle = offset <= ccw ? ccw : -(TWO_PI - ccw);
    return {
      center: new Vec2(cx, cy),
      radius,
      startAngle,
      sweepAngle,
      startPt,
      endPt
    };
  },
  // ================================================================
  // CONVEX HULL
  // ================================================================
  /** Convex hull (Andrew's monotone chain). Returns CCW-ordered hull points. */
  convexHull2D(points) {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    if (sorted.length <= 2) return sorted;
    const lower = [];
    for (const p of sorted) {
      while (lower.length >= 2 && Polygon2D.cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && Polygon2D.cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  },
  // ================================================================
  // TRIANGULATION
  // ================================================================
  /** Ear-clipping triangulation for simple 2D polygons. */
  triangulate2D(polygon) {
    if (polygon.length < 3) return [];
    if (polygon.length === 3) return [[0, 1, 2]];
    const isCCW = Polygon2D.signedArea(polygon) > 0;
    const remaining = polygon.map((_, i) => i);
    const triangles = [];
    const isEar = (prev, curr, next) => {
      const a = polygon[remaining[prev]];
      const b = polygon[remaining[curr]];
      const c = polygon[remaining[next]];
      const cross = Polygon2D.cross2D(a, b, c);
      if (isCCW ? cross <= 0 : cross >= 0) return false;
      for (let i = 0; i < remaining.length; i++) {
        if (i === prev || i === curr || i === next) continue;
        if (pointInTriangle2D(polygon[remaining[i]], a, b, c)) return false;
      }
      return true;
    };
    let safety = remaining.length * 3;
    while (remaining.length > 3 && safety-- > 0) {
      let found = false;
      for (let i = 0; i < remaining.length; i++) {
        const prev = (i - 1 + remaining.length) % remaining.length;
        const next = (i + 1) % remaining.length;
        if (isEar(prev, i, next)) {
          triangles.push([remaining[prev], remaining[i], remaining[next]]);
          remaining.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) break;
    }
    if (remaining.length === 3) {
      triangles.push([remaining[0], remaining[1], remaining[2]]);
    }
    return triangles;
  },
  // ================================================================
  // MINIMUM ENCLOSING CIRCLE
  // ================================================================
  /** Minimum enclosing circle (Welzl's algorithm, randomized). */
  minEnclosingCircle(points) {
    if (points.length === 0) return { center: new Vec2(), radius: 0 };
    if (points.length === 1) return { center: points[0], radius: 0 };
    const p = [...points].sort(() => Math.random() - 0.5);
    const from2 = (a, b) => ({
      center: a.lerp(b, 0.5),
      radius: a.distTo(b) / 2
    });
    const from3 = (a, b, c) => {
      const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(d) < 1e-10) {
        const d01 = a.distTo(b), d12 = b.distTo(c), d02 = a.distTo(c);
        if (d01 >= d12 && d01 >= d02) return from2(a, b);
        if (d12 >= d01 && d12 >= d02) return from2(b, c);
        return from2(a, c);
      }
      const ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
      const uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
      const center = new Vec2(ux, uy);
      return { center, radius: center.distTo(a) };
    };
    const inside = (circ, q) => circ.center.distTo(q) <= circ.radius + 1e-8;
    let D = from2(p[0], p[1]);
    for (let i = 2; i < p.length; i++) {
      if (inside(D, p[i])) continue;
      D = { center: p[i], radius: 0 };
      for (let j = 0; j < i; j++) {
        if (inside(D, p[j])) continue;
        D = from2(p[i], p[j]);
        for (let k = 0; k < j; k++) {
          if (!inside(D, p[k])) D = from3(p[i], p[j], p[k]);
        }
      }
    }
    return D;
  },
  // ================================================================
  // MINIMUM AREA RECTANGLE (OBB)
  // ================================================================
  /**
   * Computes the minimum-area oriented bounding rectangle of a point set.
   * Uses convex hull + edge-projection. O(n log n) total.
   */
  minAreaRect(points) {
    if (points.length === 0) return new OBB2D(Vec2.zero(), 0, 0, 0);
    if (points.length === 1) return new OBB2D(points[0], 0, 0, 0);
    const hull = Polygon2D.convexHull2D(points);
    const n = hull.length;
    if (n === 1) return new OBB2D(hull[0], 0, 0, 0);
    if (n === 2) {
      const mid = hull[0].lerp(hull[1], 0.5);
      const len = hull[0].distTo(hull[1]);
      const angle = VecMath.angle2D(hull[1].sub(hull[0]));
      return new OBB2D(mid, len, 0, angle);
    }
    let bestArea = Infinity;
    let bestAngle = 0;
    let bestW = 0, bestH = 0;
    let bestCenter = Vec2.zero();
    for (let i = 0; i < n; i++) {
      const edge = hull[(i + 1) % n].sub(hull[i]);
      if (edge.lenSq() < HMath.EPSILON) continue;
      const angle = VecMath.angle2D(edge);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let minU = Infinity, maxU = -Infinity;
      let minV = Infinity, maxV = -Infinity;
      for (let k = 0; k < n; k++) {
        const u = hull[k].x * cos + hull[k].y * sin;
        const v = -hull[k].x * sin + hull[k].y * cos;
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      const w = maxU - minU;
      const h = maxV - minV;
      const area = w * h;
      if (area < bestArea) {
        bestArea = area;
        bestAngle = angle;
        bestW = w;
        bestH = h;
        const cu = (minU + maxU) * 0.5;
        const cv = (minV + maxV) * 0.5;
        bestCenter = new Vec2(cu * cos - cv * sin, cu * sin + cv * cos);
      }
    }
    return new OBB2D(bestCenter, bestW, bestH, bestAngle);
  }
};
function pointInTriangle2D(p, a, b, c) {
  const d1 = Polygon2D.cross2D(a, b, p);
  const d2 = Polygon2D.cross2D(b, c, p);
  const d3 = Polygon2D.cross2D(c, a, p);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function nextKept(keep, i, n) {
  let next = (i + 1) % n;
  while (!keep[next] && next !== i) next = (next + 1) % n;
  return next;
}
function prevKept(keep, i, n) {
  let prev = (i - 1 + n) % n;
  while (!keep[prev] && prev !== i) prev = (prev - 1 + n) % n;
  return prev;
}
var BoolNode = class {
  constructor(pos) {
    this.next = this;
    this.prev = this;
    this.isIntersection = false;
    this.entering = false;
    this.visited = false;
    this.partner = null;
    this.alpha = 0;
    this.pos = pos;
  }
};
function buildBoolList(poly) {
  const head = new BoolNode(poly[0]);
  let prev = head;
  for (let i = 1; i < poly.length; i++) {
    const node = new BoolNode(poly[i]);
    node.prev = prev;
    prev.next = node;
    prev = node;
  }
  prev.next = head;
  head.prev = prev;
  return head;
}
function insertBoolNode(after, node) {
  let cur = after;
  while (cur.next !== after.next || cur === after) {
    if (!cur.next.isIntersection || cur.next.alpha > node.alpha) break;
    cur = cur.next;
    if (cur === after) break;
  }
  node.next = cur.next;
  node.prev = cur;
  cur.next.prev = node;
  cur.next = node;
}
function boolSegHit(ax, ay, bx, by, cx, cy, dx, dy) {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
  if (t > 1e-8 && t < 1 - 1e-8 && u > 1e-8 && u < 1 - 1e-8) return { t, u };
  return null;
}
function boolPip(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (poly[i].y > pt.y !== poly[j].y > pt.y && pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) {
      inside = !inside;
    }
  }
  return inside;
}
function polygonIntersection(subjPoly, clipPoly) {
  const subj = buildBoolList(subjPoly);
  const clip = buildBoolList(clipPoly);
  let hasIntersections = false;
  let sNode = subj;
  do {
    let cNode = clip;
    do {
      const hit = boolSegHit(
        sNode.pos.x,
        sNode.pos.y,
        sNode.next.pos.x,
        sNode.next.pos.y,
        cNode.pos.x,
        cNode.pos.y,
        cNode.next.pos.x,
        cNode.next.pos.y
      );
      if (hit) {
        const pt = new Vec2(
          sNode.pos.x + hit.t * (sNode.next.pos.x - sNode.pos.x),
          sNode.pos.y + hit.t * (sNode.next.pos.y - sNode.pos.y)
        );
        const sInt = new BoolNode(pt);
        sInt.isIntersection = true;
        sInt.alpha = hit.t;
        const cInt = new BoolNode(pt);
        cInt.isIntersection = true;
        cInt.alpha = hit.u;
        sInt.partner = cInt;
        cInt.partner = sInt;
        insertBoolNode(sNode, sInt);
        insertBoolNode(cNode, cInt);
        hasIntersections = true;
      }
      cNode = cNode.next;
      while (cNode.isIntersection && cNode !== clip) cNode = cNode.next;
    } while (cNode !== clip);
    sNode = sNode.next;
    while (sNode.isIntersection && sNode !== subj) sNode = sNode.next;
  } while (sNode !== subj);
  if (!hasIntersections) {
    if (boolPip(subjPoly[0], clipPoly)) return [subjPoly];
    if (boolPip(clipPoly[0], subjPoly)) return [clipPoly];
    return [];
  }
  let cur = subj;
  let inside = boolPip(cur.pos, clipPoly);
  do {
    if (cur.isIntersection) {
      cur.entering = !inside;
      inside = !inside;
    }
    cur = cur.next;
  } while (cur !== subj);
  const results = [];
  cur = subj;
  do {
    if (cur.isIntersection && cur.entering && !cur.visited) {
      const poly = [];
      let walker = cur;
      let onSubject = true;
      for (let safety = 0; safety < 1e3; safety++) {
        walker.visited = true;
        if (walker.partner) walker.partner.visited = true;
        poly.push(walker.pos);
        walker = walker.next;
        if (walker.isIntersection) {
          if (walker === cur) break;
          walker.visited = true;
          if (walker.partner) walker.partner.visited = true;
          if (walker.partner) {
            walker = walker.partner;
            onSubject = !onSubject;
          }
        }
        if (walker === cur) break;
      }
      if (poly.length >= 3) results.push(poly);
    }
    cur = cur.next;
  } while (cur !== subj);
  return results;
}

// src/core/geometry/PolygonBool.ts
import polygonClipping from "polygon-clipping";
var SNAP = 1e-3;
function setClipSnap(grid) {
  SNAP = grid > 0 ? grid : 0;
}
function snap(n) {
  return SNAP > 0 ? Math.round(n / SNAP) * SNAP : n;
}
function ringToPC(ring) {
  return ring.map((v) => [snap(v.x), snap(v.y)]);
}
function multiToPC(mp) {
  return mp.map((poly) => poly.map(ringToPC));
}
function pcRingToRing(r) {
  const pts = r.map(([x, y]) => new Vec2(x, y));
  if (pts.length > 1) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (a.x === b.x && a.y === b.y) pts.pop();
  }
  return pts;
}
function pcToMulti(geom) {
  return geom.map((poly) => poly.map(pcRingToRing));
}
var PolygonBool = {
  // ── construction / inspection ──
  /** Wrap a single solid ring as a multipolygon. */
  fromRing(ring) {
    return [[ring]];
  },
  /** Flatten every ring (outer + holes, all polygons) — handy for drawing. */
  rings(mp) {
    const out = [];
    for (const poly of mp) for (const ring of poly) out.push(ring);
    return out;
  },
  /** True when the multipolygon encloses no area. */
  isEmpty(mp) {
    return mp.length === 0 || mp.every((poly) => poly.length === 0);
  },
  /**
   * Total enclosed area (outer rings minus holes). Always non-negative; relies
   * on polygon-clipping's CCW-outer / CW-hole output, but uses absolute ring
   * areas so it is also correct for hand-built input with consistent winding.
   */
  area(mp) {
    let total = 0;
    for (const poly of mp) {
      poly.forEach((ring, i) => {
        const a = Math.abs(Polygon2D.signedArea(ring));
        total += i === 0 ? a : -a;
      });
    }
    return total;
  },
  // ── boolean ops ──
  /** Union of one or more multipolygons. */
  union(...mps) {
    const nonEmpty = mps.filter((m) => !PolygonBool.isEmpty(m));
    if (nonEmpty.length === 0) return [];
    const [first, ...rest] = nonEmpty.map(multiToPC);
    return pcToMulti(polygonClipping.union(first, ...rest));
  },
  /** `subject` minus every `clip`. */
  difference(subject, ...clips) {
    if (PolygonBool.isEmpty(subject)) return [];
    const clipsNonEmpty = clips.filter((m) => !PolygonBool.isEmpty(m));
    if (clipsNonEmpty.length === 0) return PolygonBool.union(subject);
    return pcToMulti(
      polygonClipping.difference(multiToPC(subject), ...clipsNonEmpty.map(multiToPC))
    );
  },
  /** Intersection of two or more multipolygons. */
  intersection(...mps) {
    if (mps.length === 0 || mps.some((m) => PolygonBool.isEmpty(m))) return [];
    const [first, ...rest] = mps.map(multiToPC);
    return pcToMulti(polygonClipping.intersection(first, ...rest));
  }
};

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
function _writeR12Prologue(lines, names, colorOf, scale = 1e3) {
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
  lines.push("0", "TABLE", "2", "LTYPE", "70", "1");
  lines.push("0", "LTYPE", "2", "CONTINUOUS", "70", "0", "3", "Solid line", "72", "65", "73", "0", "40", "0");
  lines.push("0", "ENDTAB");
  lines.push("0", "TABLE", "2", "LAYER", "70", String(names.length));
  for (const name of names) lines.push("0", "LAYER", "2", name, "70", "0", "62", String(colorOf.get(name) ?? 7), "6", "CONTINUOUS");
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
  const lines = [];
  const { names, colorOf } = _resolveLayers(content.layers ?? [], used);
  _writeR12Prologue(lines, names, colorOf, scale);
  const v = (n) => _real(n * scale);
  const xy = (p) => ["10", v(p.x), "20", v(p.y), "30", "0"];
  const emitCircle = (layer, c, r) => lines.push("0", "CIRCLE", "8", _sanLayer(layer), ...xy(c), "40", v(r));
  lines.push("0", "SECTION", "2", "ENTITIES");
  for (const poly of polylines) {
    if (poly.points.length < 2) continue;
    const layer = _sanLayer(poly.layer);
    lines.push("0", "POLYLINE", "8", layer, "66", "1", "70", poly.closed ? "1" : "0", "10", "0", "20", "0", "30", "0");
    for (const p of poly.points) lines.push("0", "VERTEX", "8", layer, ...xy(p), "70", "0");
    lines.push("0", "SEQEND", "8", layer);
  }
  for (const l of lineSegs) {
    lines.push("0", "LINE", "8", _sanLayer(l.layer), ...xy(l.start), "11", v(l.end.x), "21", v(l.end.y), "31", "0");
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
    lines.push("0", "ARC", "8", _sanLayer(a.layer), ...xy(a.center), "40", v(a.radius), "50", _real(norm(a.startDeg)), "51", _real(norm(a.endDeg)));
  }
  for (const t of texts) {
    lines.push(
      "0",
      "TEXT",
      "8",
      _sanLayer(t.layer),
      ...xy(t.at),
      "40",
      v(t.height),
      "1",
      t.text.replace(/[\r\n]+/g, " "),
      "50",
      _real(t.rotationDeg ?? 0)
    );
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\r\n") + "\r\n";
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
  ifc: "application/x-step",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  stl: "model/stl"
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

export {
  noise,
  createRandom,
  ParamStore,
  createParams,
  createLayout,
  OBB2D,
  Polygon2D,
  polygonIntersection,
  setClipSnap,
  PolygonBool,
  _sanLayer,
  _resolveLayers,
  _writeR12Prologue,
  writeDxf3D,
  writeDxf2D,
  stampName,
  download
};
