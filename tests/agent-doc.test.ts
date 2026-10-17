/**
 * Edits as data (`applyPatch`) and the MCP server that carries them from an agent to the
 * open page (`tools/mcp.mjs`, here against a stand-in for the dev server's relay).
 */
import { describe, it, expect, afterAll } from "vitest";
import { spawn } from "node:child_process";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Doc, applyPatch } from "../src/collab/Doc";
import { BUILDING_SCHEMA, type BuildingRecords } from "../src/bim/building";

function storeyDoc() {
  const doc = new Doc<BuildingRecords>({ name: "patch-test" });
  doc.add("storeys", { name: "EG", elevation: 0, height: 3 }, { id: "eg", undoable: false });
  doc.add("walls", { storey: "eg", path: [[0, 0], [5, 0]] }, { id: "s", undoable: false });
  return doc;
}

describe("applyPatch", () => {
  it("applies set, update and remove as one undo step", () => {
    const doc = storeyDoc();
    const r = applyPatch(doc, {
      set: { "walls/e": { storey: "eg", path: [[5, 0], [5, 4]] }, "openings/d": { wall: "s", kind: "door", at: 2, width: 1 } },
      update: { "walls/s": { thickness: 0.3 } },
    }, { schema: BUILDING_SCHEMA, label: "Agent: east wall" });
    expect(r).toEqual({
      ok: true, rejected: [], undo: "Agent: east wall",
      changed: { set: ["walls/e", "openings/d"], updated: ["walls/s"], removed: [] },
    });
    expect(doc.get("walls", "s")!.thickness).toBe(0.3);
    applyPatch(doc, { remove: ["openings/d"] });
    expect(doc.has("openings", "d")).toBe(false);
    doc.undo();
    doc.undo();
    expect(doc.has("walls", "e")).toBe(false);
    expect(doc.get("walls", "s")!.thickness).toBeUndefined();
  });

  it("applies nothing when one record is wrong, and says why for each", () => {
    const doc = storeyDoc();
    const r = applyPatch(doc, {
      set: { "walls/e": { storey: "eg", path: [[5, 0], [5, 4]] }, "doors/r": { kind: "gable" }, "openings/d": { wall: "s", kind: "gate", at: 2, width: 1 } },
      update: { "walls/s": { path: [[0, 0]] }, "walls/zz": { height: 2 } },
      remove: ["slabs/none", "bad-key"],
    }, { schema: BUILDING_SCHEMA });
    expect(r.ok).toBe(false);
    expect(r.rejected.map((x) => `${x.key}: ${x.message}`)).toEqual([
      'doors/r: "doors" is not a collection here (collections: storeys, walls, openings, slabs, spaces, roofs, stairs)',
      'openings/d: kind: expected one of "door", "window", got "gate"',
      "walls/s: path: needs at least 2 items, got 1",
      "walls/zz: does not exist (use set to add it)",
      "slabs/none: does not exist",
      'bad-key: a record is named "collection/id", got "bad-key"',
    ]);
    expect(doc.has("walls", "e")).toBe(false);
    expect(doc.canUndo()).toBe(false);
  });
});

describe("tools/mcp.mjs", () => {
  const calls: { op: string; args: Record<string, unknown> }[] = [];
  const relay = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      const { op, args } = JSON.parse(body);
      calls.push({ op, args });
      res.setHeader("content-type", "application/json");
      if (op === "apply") return res.end(JSON.stringify({ result: { ok: true, changed: { set: Object.keys(args.patch.set ?? {}) }, issues: [] } }));
      if (op === "snapshot") return res.end(JSON.stringify({ result: { viewPng: "data:image/png;base64,iVBORw0K", scene: { shownObjects: 3 }, logs: [], errors: [] } }));
      res.statusCode = 503;
      res.end(JSON.stringify({ error: "No tekto page is open on this dev server: open the app in a browser first." }));
    });
  });
  afterAll(() => relay.close());

  async function session(messages: object[]): Promise<any[]> {
    await new Promise<void>((r) => (relay.listening ? r() : relay.listen(0, "127.0.0.1", () => r())));
    const port = (relay.address() as AddressInfo).port;
    const child = spawn(process.execPath, ["tools/mcp.mjs"], { env: { ...process.env, TEKTO_URL: `http://127.0.0.1:${port}` } });
    const replies: any[] = [];
    let buf = "";
    const want = messages.filter((m: any) => m.id !== undefined).length;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { child.kill(); reject(new Error(`timed out with ${replies.length}/${want} replies`)); }, 10000);
      child.stdout.on("data", (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          replies.push(JSON.parse(buf.slice(0, i)));
          buf = buf.slice(i + 1);
          if (replies.length === want) { clearTimeout(timer); child.kill(); resolve(replies.sort((a, b) => a.id - b.id)); }
        }
      });
      for (const m of messages) child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...m })}\n`);
    });
  }

  it("speaks MCP: initialize, tools/list, tools/call through the relay", async () => {
    const [init, list, apply, info, snap, unknown] = await session([
      { id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } },
      { method: "notifications/initialized" },
      { id: 2, method: "tools/list" },
      { id: 3, method: "tools/call", params: { name: "tekto_apply", arguments: { patch: { set: { "walls/a": { storey: "eg", path: [[0, 0], [1, 0]] } } }, label: "Agent" } } },
      { id: 4, method: "tools/call", params: { name: "tekto_info", arguments: {} } },
      { id: 5, method: "tools/call", params: { name: "tekto_snapshot", arguments: {} } },
      { id: 6, method: "tools/call", params: { name: "tekto_fly", arguments: {} } },
    ]);
    expect(init.result).toMatchObject({ protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "tekto" } });
    expect(list.result.tools.map((t: any) => t.name)).toEqual([
      "tekto_info", "tekto_records", "tekto_apply", "tekto_check", "tekto_snapshot", "tekto_undo", "tekto_set_params", "tekto_run_command", "tekto_section", "tekto_camera",
    ]);
    expect(JSON.parse(apply.result.content[0].text)).toMatchObject({ ok: true, changed: { set: ["walls/a"] } });
    expect(calls.find((c) => c.op === "apply")).toEqual({ op: "apply", args: { patch: { set: { "walls/a": { storey: "eg", path: [[0, 0], [1, 0]] } } }, label: "Agent" } });
    expect(info.result).toEqual({ content: [{ type: "text", text: "No tekto page is open on this dev server: open the app in a browser first." }], isError: true });
    expect(snap.result.content[0]).toEqual({ type: "image", data: "iVBORw0K", mimeType: "image/png" });
    expect(unknown.error.message).toContain('Unknown tool "tekto_fly"');
  });
});
