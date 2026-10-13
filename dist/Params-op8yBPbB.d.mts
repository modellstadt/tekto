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

export { type BoolParam as B, type ColorParam as C, type FloatParam as F, type IntParam as I, ParamStore as P, type SelectParam as S, type Vec3Param as V, type ParamLayout as a, type ParamSchema as b, type ParamValues as c, type ButtonParam as d, type ParamDef as e, type ParamFolder as f, type StringParam as g, createLayout as h, createParams as i };
