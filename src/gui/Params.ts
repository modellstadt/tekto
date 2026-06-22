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

export interface FloatParam {
  type: "float";
  min: number;
  max: number;
  default: number;
  step?: number;
  label?: string;
}

export interface IntParam {
  type: "int";
  min: number;
  max: number;
  default: number;
  step?: number;
  label?: string;
}

export interface BoolParam {
  type: "bool";
  default: boolean;
  label?: string;
}

export interface SelectParam {
  type: "select";
  options: string[];
  default: string;
  label?: string;
}

export interface ColorParam {
  type: "color";
  default: string;
  label?: string;
}

export interface StringParam {
  type: "string";
  default: string;
  label?: string;
  placeholder?: string;
}

export interface Vec3Param {
  type: "vec3";
  default: [number, number, number];
  min?: [number, number, number];
  max?: [number, number, number];
  step?: number;
  label?: string;
}

export interface ButtonParam {
  type: "button";
  label?: string;
  action: () => void;
}

export type ParamDef =
  | FloatParam
  | IntParam
  | BoolParam
  | SelectParam
  | ColorParam
  | StringParam
  | Vec3Param
  | ButtonParam;

export type ParamSchema = Record<string, ParamDef>;

// ─── Value types ─────────────────────────────

export type ParamValue<T extends ParamDef> =
  T extends FloatParam ? number :
  T extends IntParam ? number :
  T extends BoolParam ? boolean :
  T extends SelectParam ? string :
  T extends ColorParam ? string :
  T extends StringParam ? string :
  T extends Vec3Param ? [number, number, number] :
  T extends ButtonParam ? never :
  never;

// ─── Param Store ─────────────────────────────

export type ParamChangeListener = (key: string, value: any, allValues: Record<string, any>) => void;

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

  get<K extends keyof S>(key: K): any {
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

  /** Get all current values */
  getAll(): Record<string, any> {
    return { ...this.values };
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
}

/** Convenience factory */
export function createParams<S extends ParamSchema>(schema: S): ParamStore<S> {
  return new ParamStore(schema);
}

// ─── Folder System (for grouping params in the GUI) ──

export interface ParamFolder {
  label: string;
  open?: boolean;
  params: string[];  // keys from schema
}

export interface ParamLayout {
  folders: ParamFolder[];
}

/** Create a layout that groups params into collapsible folders */
export function createLayout(folders: ParamFolder[]): ParamLayout {
  return { folders };
}
