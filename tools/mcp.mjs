#!/usr/bin/env node
/**
 * An MCP server for the tekto app a person has open: an agent (Claude Code, Claude Desktop,
 * any MCP client) reads and edits the app's shared document, checks it, sees it, sets its
 * controls — in that tab, while the person watches, every edit one undo step for them.
 *
 *   claude mcp add tekto -- node node_modules/tekto/tools/mcp.mjs
 *   TEKTO_URL=http://localhost:5174 …        the app's dev server (default http://localhost:5173)
 *
 * The app's dev server needs `tekto/markup-vite` (it relays the calls into the page) and the
 * app shares its document with `agentDoc(doc, { schema, check })`. No dependencies: JSON-RPC
 * over stdio, newline-delimited, as MCP's stdio transport specifies.
 */
import fs from "node:fs";
import readline from "node:readline";

const BASE = (process.env.TEKTO_URL ?? "http://localhost:5173").replace(/\/$/, "");
const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const VERSION = (() => {
  try { return JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version; }
  catch { return "0.0.0"; }
})();

/** One call into the open page, through the dev server's relay. */
async function relay(op, args = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/__tekto/agent/call`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op, args }),
    });
  } catch (e) {
    throw new Error(`No dev server at ${BASE} (${e.cause?.code ?? e.message}). Start the app's dev server, or set TEKTO_URL.`);
  }
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`${BASE} answered ${res.status} without JSON: is tekto/markup-vite in its vite config?`); }
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body.result;
}

const text = (v) => ({ type: "text", text: typeof v === "string" ? v : JSON.stringify(v, null, 1) });
const POINT3 = { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 };

const TOOLS = [
  {
    name: "tekto_info",
    description: "What the open tekto app is: its title, the document it shares (collections with record counts, and each collection's JSON Schema — read it before writing records), its controls and commands, and errors the page logged. Call this first.",
    inputSchema: { type: "object", properties: {} },
    run: async () => [text(await relay("info"))],
  },
  {
    name: "tekto_records",
    description: "The records of the app's document: collection → id → record. Give a collection to read only that one.",
    inputSchema: { type: "object", properties: { collection: { type: "string" } } },
    run: async (a) => [text(await relay("records", { collection: a.collection }))],
  },
  {
    name: "tekto_apply",
    description: "Edit the app's document. Records are named \"collection/id\" (e.g. \"walls/w3\"): `set` adds a record or replaces it whole, `update` merges fields into an existing one, `remove` deletes. The patch is checked against the collections' schema first: if any record is invalid nothing is applied and `rejected` says why, by record. Otherwise it is applied as one undo step for the person (named by `label`), and the result lists what changed and the app's `issues` afterwards (errors and warnings by record): fix them with another patch. Write a whole building in one patch, then refine.",
    inputSchema: {
      type: "object", required: ["patch"],
      properties: {
        patch: {
          type: "object",
          properties: {
            set: { type: "object", description: "\"collection/id\" → whole record", additionalProperties: { type: "object" } },
            update: { type: "object", description: "\"collection/id\" → fields to change", additionalProperties: { type: "object" } },
            remove: { type: "array", items: { type: "string" }, description: "\"collection/id\" to delete" },
          },
        },
        label: { type: "string", description: "What the person sees as \"Undo <label>\"" },
      },
    },
    run: async (a) => [text(await relay("apply", { patch: a.patch ?? {}, label: a.label }))],
  },
  {
    name: "tekto_check",
    description: "What is wrong with the app's document now, as the app checks it: errors and warnings, each with the records it concerns.",
    inputSchema: { type: "object", properties: {} },
    run: async () => [text(await relay("check"))],
  },
  {
    name: "tekto_snapshot",
    description: "See the app as the person sees it: an image of the view, and a summary of what is drawn (objects by record key, bounds) with the app's log lines and errors. Look after edits: a check passing is not the same as the result looking right.",
    inputSchema: { type: "object", properties: { note: { type: "string", description: "Written into the snapshot's legend" } } },
    run: async (a) => {
      const r = await relay("snapshot", { note: a.note });
      const out = [];
      const m = /^data:(image\/\w+);base64,(.*)$/.exec(r.viewPng ?? "");
      if (m) out.push({ type: "image", data: m[2], mimeType: m[1] });
      const summary = JSON.stringify({ camera: r.camera, scene: r.scene, logs: r.logs, errors: r.errors }, null, 1);
      out.push(text(summary.length > 12000 ? `${summary.slice(0, 12000)}\n… (cut)` : summary));
      return out;
    },
  },
  {
    name: "tekto_undo",
    description: "Undo the last step in the app's document (the person's or yours), as Undo in the app would.",
    inputSchema: { type: "object", properties: {} },
    run: async () => [text(await relay("undo"))],
  },
  {
    name: "tekto_set_params",
    description: "Set the app's controls by label (\"Radius\"), \"Group:Label\" or key, e.g. {\"Framing\": true}. Names that match nothing are reported.",
    inputSchema: { type: "object", required: ["params"], properties: { params: { type: "object" } } },
    run: async (a) => [text(await relay("setParams", { params: a.params ?? {} }))],
  },
  {
    name: "tekto_run_command",
    description: "Run one of the app's commands by id (tekto_info lists them), as a person would by key or menu.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
    run: async (a) => [text(await relay("run", { id: a.id }))],
  },
  {
    name: "tekto_steps",
    description: "The program as the steps it ran (code that wraps its parts in lab.step / app.step): each step's inputs (and which step each came from), output, time, error, code location and the objects it drew; the links between steps; an analysis (slowest steps and chain, outputs nobody used, errors); and the notes the person left on steps (`marks`) — what they want changed, step by step. Read this before changing generated code the person has marked.",
    inputSchema: { type: "object", properties: {} },
    run: async () => [text(await relay("steps"))],
  },
  {
    name: "tekto_section",
    description: "Cut the 3D view, to see inside before a snapshot: a plan is axis \"z\" at a height (`coordinate`, metres, e.g. 1.2 above a storey's floor), an elevation cut is \"x\" or \"y\"; `flip` keeps the other side. No axis: remove the cut. Views (top, front, orthographic) are commands: tekto_run_command.",
    inputSchema: { type: "object", properties: { axis: { type: "string", enum: ["x", "y", "z"] }, coordinate: { type: "number" }, at: { type: "number", description: "0–1 across the model instead of a coordinate" }, flip: { type: "boolean" } } },
    run: async (a) => [text(await relay("section", { axis: a.axis, coordinate: a.coordinate, at: a.at, flip: a.flip }))],
  },
  {
    name: "tekto_camera",
    description: "Move the app's 3D camera: position [x, y, z] and the point it looks at, in the scene's coordinates (metres, Z up in building apps).",
    inputSchema: { type: "object", required: ["position"], properties: { position: POINT3, target: POINT3 } },
    run: async (a) => [text(await relay("camera", { position: a.position, target: a.target }))],
  },
];

const INSTRUCTIONS = "These tools work in the tekto app open in the person's browser. Start with tekto_info: it gives the document's collections and the JSON Schema of their records. Make changes with tekto_apply (one undo step each), read tekto_apply's issues and fix them, and look with tekto_snapshot.";

// ── JSON-RPC over stdio ───────────────────────────────────────────────────────

const send = (msg) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...msg })}\n`);

async function handle(msg) {
  const { id, method, params } = msg;
  const reply = (result) => { if (id !== undefined) send({ id, result }); };
  const fail = (code, message) => { if (id !== undefined) send({ id, error: { code, message } }); };
  switch (method) {
    case "initialize":
      return reply({
        protocolVersion: VERSIONS.includes(params?.protocolVersion) ? params.protocolVersion : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "tekto", version: VERSION },
        instructions: INSTRUCTIONS,
      });
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return fail(-32602, `Unknown tool "${params?.name}" (tools: ${TOOLS.map((t) => t.name).join(", ")})`);
      try { return reply({ content: await tool.run(params.arguments ?? {}) }); }
      catch (e) { return reply({ content: [text(e instanceof Error ? e.message : String(e))], isError: true }); }
    }
    default:
      if (method?.startsWith("notifications/")) return;     // initialized, cancelled …: nothing to answer
      return fail(-32601, `Method not found: ${method}`);
  }
}

const lines = readline.createInterface({ input: process.stdin });
lines.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return send({ id: null, error: { code: -32700, message: "Parse error" } }); }
  void handle(msg).catch((e) => process.stderr.write(`tekto mcp: ${e?.stack ?? e}\n`));
});
