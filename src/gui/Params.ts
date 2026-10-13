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

// ─── Parameter Definitions ───────────────────

/** A number slider from `min` to `max`; values set outside the range are clamped. */
export interface FloatParam {
  type: "float";
  min: number;
  max: number;
  default: number;
  step?: number;
  label?: string;
}

/** An integer slider from `min` to `max`; values are clamped and rounded. */
export interface IntParam {
  type: "int";
  min: number;
  max: number;
  default: number;
  step?: number;
  label?: string;
}

/** An on/off toggle. */
export interface BoolParam {
  type: "bool";
  default: boolean;
  label?: string;
}

/** A dropdown of fixed string `options`; setting a value not in the list is ignored. */
export interface SelectParam {
  type: "select";
  options: readonly string[];
  default: string;
  label?: string;
}

/** A colour picker whose value is a CSS hex string (`"#6ee7b7"`). */
export interface ColorParam {
  type: "color";
  default: string;
  label?: string;
}

/** A single-line text field. */
export interface StringParam {
  type: "string";
  default: string;
  label?: string;
  placeholder?: string;
}

/** Three number fields holding an `[x, y, z]` value. */
export interface Vec3Param {
  type: "vec3";
  default: [number, number, number];
  min?: [number, number, number];
  max?: [number, number, number];
  step?: number;
  label?: string;
}

/** A button that runs `action`; it holds no value. */
export interface ButtonParam {
  type: "button";
  label?: string;
  action: () => void;
}

/** One control in a schema — slider, toggle, select, colour, text, vec3 or button — plus the `display` flag. */
export type ParamDef = (
  | FloatParam
  | IntParam
  | BoolParam
  | SelectParam
  | ColorParam
  | StringParam
  | Vec3Param
  | ButtonParam
) & {
  /** Display-only param: `appShell` routes its changes to `onDisplay`
   *  (restyle existing objects) instead of `onBuild` (regenerate geometry). */
  display?: boolean;
};

/** Controls by key — what `new ParamStore(schema)` and `createParams` take; the store's values are typed from it. */
export type ParamSchema = Record<string, ParamDef>;

/** The value a param definition holds: `float`/`int` → number, `bool` → boolean,
 *  `select`/`color`/`string` → string, `vec3` → [x, y, z], `button` → undefined. */
export type ParamValue<D> =
  D extends { type: "float" | "int" } ? number :
  D extends { type: "bool" } ? boolean :
  D extends { type: "select" | "color" | "string" } ? string :
  D extends { type: "vec3" } ? [number, number, number] :
  D extends { type: "button" } ? undefined :
  unknown;

/** Every value of a schema, typed: `{ radius: number, wireframe: boolean, … }`. */
export type ParamValues<S extends ParamSchema> = { [K in keyof S]: ParamValue<S[K]> };

// ─── Param Store ─────────────────────────────

export type ParamChangeListener = (key: string, value: any, allValues: Record<string, any>) => void;

/**
 * The one parameter model: a schema of controls (`float`, `int`, `bool`, `select`, `color`,
 * `string`, `vec3`, `button`) and their values, typed from the schema. Every harness keeps
 * its controls here. `setByName` sets by label for tools and agents.
 *
 *   const p = new ParamStore({ r: { type: "float", min: 0, max: 5, default: 1 } }); p.get("r"); // number
 */
export class ParamStore<S extends ParamSchema = ParamSchema> {
  private schema: S;
  private values: Record<string, any> = {};
  private listeners = new Set<ParamChangeListener>();
  private keyListeners = new Map<string, Set<(value: any) => void>>();

  constructor(schema: S) {
    this.schema = schema;
    // Initialize defaults
    for (const [key, def] of Object.entries(schema)) {
      if (def.type !== "button") {
        this.values[key] = (def as any).default;
      }
    }
  }

  get<K extends keyof S>(key: K): ParamValue<S[K]> {
    return this.values[key as string];
  }

  set<K extends keyof S>(key: K, value: any): void {
    const def = this.schema[key];
    if (!def || def.type === "button") return;

    // Clamp/validate
    if (def.type === "float" || def.type === "int") {
      value = Math.max(def.min, Math.min(def.max, value));
      if (def.type === "int") value = Math.round(value);
    }
    if (def.type === "select" && !def.options.includes(value)) return;

    this.values[key as string] = value;

    // Notify
    for (const l of this.listeners) l(key as string, value, this.values);
    const kl = this.keyListeners.get(key as string);
    if (kl) for (const l of kl) l(value);
  }

  /**
   * Dynamically add (or refresh) a parameter definition. Used by the sketch
   * APIs, whose immediate-mode `lab.slider(...)` calls declare params during
   * the sketch run. Initializes the value from `default` the first time;
   * an existing value is preserved so re-defining across re-runs is cheap.
   * Does NOT notify listeners (definition is structure, not a value change).
   */
  define(key: string, def: ParamDef): void {
    const existed = key in this.schema;
    (this.schema as ParamSchema)[key] = def;
    if (!existed && def.type !== "button") {
      this.values[key] = (def as any).default;
    }
  }

  /** Remove a parameter (and its value). Does not notify listeners. */
  remove(key: string): void {
    delete (this.schema as ParamSchema)[key];
    delete this.values[key];
    this.keyListeners.delete(key);
  }

  has(key: string): boolean {
    return key in this.schema;
  }

  keys(): string[] {
    return Object.keys(this.schema);
  }

  /** Get all current values */
  getAll(): ParamValues<S> {
    return { ...this.values } as ParamValues<S>;
  }

  /** Get the schema for a specific key */
  getDef<K extends keyof S>(key: K): S[K] {
    return this.schema[key];
  }

  /** Get entire schema */
  getSchema(): S {
    return this.schema;
  }

  /** Listen to all changes */
  onChange(listener: ParamChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Listen to a specific key */
  onKey(key: string, listener: (value: any) => void): () => void {
    if (!this.keyListeners.has(key)) this.keyListeners.set(key, new Set());
    this.keyListeners.get(key)!.add(listener);
    return () => this.keyListeners.get(key)?.delete(listener);
  }

  /** Reset all to defaults */
  reset(): void {
    for (const [key, def] of Object.entries(this.schema)) {
      if (def.type !== "button") {
        this.set(key as any, (def as any).default);
      }
    }
  }

  /** Serialization */
  toJSON(): Record<string, any> {
    return { ...this.values };
  }

  loadJSON(json: Record<string, any>): void {
    for (const [key, value] of Object.entries(json)) {
      if (key in this.schema) {
        this.set(key as any, value);
      }
    }
  }

  /**
   * The keys a person or an agent means by `name`, most specific first: the exact key;
   * else the control's label, ignoring case ("Radius"); else "Group:Label" for sketch
   * keys, which read `type:group:label`. One key when the name is unambiguous.
   */
  findKeys(name: string): string[] {
    if (name in this.schema) return [name];
    const n = name.trim().toLowerCase();
    const keys = Object.keys(this.schema);
    const byLabel = keys.filter(k => ((this.schema[k] as ParamDef).label ?? k).toLowerCase() === n);
    if (byLabel.length) return byLabel;
    return keys.filter(k => {
      const parts = k.split(":");
      return parts.length >= 3 && `${parts[1]}:${parts.slice(2).join(":")}`.toLowerCase() === n;
    });
  }

  /**
   * Set params by key or label (see `findKeys`) and say what could not be applied,
   * instead of dropping it the way `loadJSON` does. For tools and agents.
   */
  setByName(values: Record<string, unknown>): {
    applied: string[];
    unknown: string[];
    ambiguous: { name: string; keys: string[] }[];
  } {
    const applied: string[] = [], unknown: string[] = [];
    const ambiguous: { name: string; keys: string[] }[] = [];
    for (const [name, value] of Object.entries(values)) {
      const keys = this.findKeys(name);
      if (keys.length === 0) unknown.push(name);
      else if (keys.length > 1) ambiguous.push({ name, keys });
      else { this.set(keys[0] as any, value as any); applied.push(keys[0]); }
    }
    return { applied, unknown, ambiguous };
  }

  /** Every param as the name to use with `setByName`: its label, or "Group:Label" when two share a label. */
  names(): string[] {
    const keys = Object.keys(this.schema);
    const label = (k: string) => (this.schema[k] as ParamDef).label ?? k;
    return keys.map(k => {
      if (keys.filter(o => label(o).toLowerCase() === label(k).toLowerCase()).length === 1) return label(k);
      const parts = k.split(":");
      return parts.length >= 3 && parts[1] ? `${parts[1]}:${parts.slice(2).join(":")}` : k;
    });
  }
}

/** Convenience factory */
export function createParams<S extends ParamSchema>(schema: S): ParamStore<S> {
  return new ParamStore(schema);
}

// ─── Folder System (for grouping params in the GUI) ──

/** A collapsible group in a `ParamLayout`: its label, whether it starts open (default yes), and the schema keys it holds. */
export interface ParamFolder {
  label: string;
  open?: boolean;
  params: string[];  // keys from schema
}

/** How the React `ParamPanel` groups a store's params into folders; keys in no folder are listed after them. */
export interface ParamLayout {
  folders: ParamFolder[];
}

/** Create a layout that groups params into collapsible folders */
export function createLayout(folders: ParamFolder[]): ParamLayout {
  return { folders };
}
