/**
 * The part of JSON Schema that tekto checks records against. One schema per collection
 * serves three readers: `checkRecord` validates what a person, a script or an agent writes,
 * an agent's tool definition takes it as its input schema as it is, and the docs show it.
 *
 *   const issues = checkRecord({ x: "4" }, { type: "object", properties: { x: { type: "number" } } });
 *   // → [{ path: "x", message: 'expected a number, got "4"' }]
 *
 * Covered: `type`, `properties`, `required`, `additionalProperties: false`, `items`,
 * `minItems` / `maxItems`, `enum`, `minimum` / `maximum` / `exclusiveMinimum`. Anything else
 * (`description`, `default`, `examples`) is documentation and passes through.
 */

/** A JSON Schema, in the part `checkRecord` understands. */
export interface RecordSchema {
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean";
  description?: string;
  properties?: Record<string, RecordSchema>;
  required?: readonly string[];
  /** `false`: a property the schema does not name is an issue (a misspelt field). */
  additionalProperties?: boolean;
  items?: RecordSchema;
  minItems?: number;
  maxItems?: number;
  enum?: readonly (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  default?: unknown;
  examples?: readonly unknown[];
}

/** One way a value breaks its schema: where (`"path[2]"`, `"openings[0].width"`) and what. */
export interface SchemaIssue {
  path: string;
  message: string;
}

const show = (v: unknown): string => {
  if (typeof v === "string") return JSON.stringify(v);
  if (v === undefined) return "nothing";
  try { const s = JSON.stringify(v); return s.length > 60 ? `${s.slice(0, 57)}…` : s; }
  catch { return String(v); }
};
const kind = (v: unknown): string => (v === null ? "null" : Array.isArray(v) ? "an array" : typeof v === "object" ? "an object" : `a ${typeof v}`);
const join = (path: string, key: string | number) =>
  typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;

/**
 * Check `value` against `schema`. Returns every issue, each with the path to the bad value
 * and a message that names the expected and the actual value, so whoever wrote it (often an
 * agent) can fix it without reading the schema again. An empty list: the value fits.
 */
export function checkRecord(value: unknown, schema: RecordSchema, path = ""): SchemaIssue[] {
  const out: SchemaIssue[] = [];
  const at = path || "(record)";
  if (schema.enum && !schema.enum.includes(value as string | number | boolean)) {
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
      if (schema.minimum !== undefined && value < schema.minimum) out.push({ path: at, message: `must be at least ${schema.minimum}, got ${value}` });
      if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) out.push({ path: at, message: `must be more than ${schema.exclusiveMinimum}, got ${value}` });
      if (schema.maximum !== undefined && value > schema.maximum) out.push({ path: at, message: `must be at most ${schema.maximum}, got ${value}` });
      break;
    }
    case "string":
      if (typeof value !== "string") out.push({ path: at, message: `expected a string, got ${show(value)}` });
      break;
    case "boolean":
      if (typeof value !== "boolean") out.push({ path: at, message: `expected true or false, got ${show(value)}` });
      break;
    case "array": {
      if (!Array.isArray(value)) { out.push({ path: at, message: `expected an array, got ${kind(value)}` }); break; }
      if (schema.minItems !== undefined && value.length < schema.minItems) out.push({ path: at, message: `needs at least ${schema.minItems} items, got ${value.length}` });
      if (schema.maxItems !== undefined && value.length > schema.maxItems) out.push({ path: at, message: `takes at most ${schema.maxItems} items, got ${value.length}` });
      if (schema.items) value.forEach((v, i) => out.push(...checkRecord(v, schema.items!, join(path, i))));
      break;
    }
    case "object": {
      if (value === null || typeof value !== "object" || Array.isArray(value)) { out.push({ path: at, message: `expected an object, got ${kind(value)}` }); break; }
      const rec = value as Record<string, unknown>;
      const props = schema.properties ?? {};
      for (const key of schema.required ?? []) {
        if (rec[key] === undefined) out.push({ path: join(path, key), message: "is required" });
      }
      for (const [key, v] of Object.entries(rec)) {
        const sub = props[key];
        if (sub) { if (v !== undefined) out.push(...checkRecord(v, sub, join(path, key))); }
        else if (schema.additionalProperties === false) {
          out.push({ path: join(path, key), message: `is not a property here (known: ${Object.keys(props).join(", ")})` });
        }
      }
      break;
    }
  }
  return out;
}
