// Runs tools/mcp.mjs against a stand-in for the dev server's relay, for tests/agent-doc.test.ts.
// Plain JavaScript, so the typed tests need no Node type definitions.
import { spawn } from "node:child_process";
import http from "node:http";

/**
 * Start the stand-in relay (`respond(op, args)` answers each call: `{ result }` or
 * `{ status, error }`), send `messages` to a fresh MCP server over stdio, and resolve with the
 * replies to the ones that have an id, in id order, and the calls the relay received.
 */
export async function mcpSession(messages, respond) {
  const calls = [];
  const relay = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      const { op, args } = JSON.parse(body);
      calls.push({ op, args });
      const r = respond(op, args);
      res.statusCode = r.status ?? 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(r.error !== undefined ? { error: r.error } : { result: r.result }));
    });
  });
  await new Promise((r) => relay.listen(0, "127.0.0.1", r));
  const { port } = relay.address();
  const child = spawn(process.execPath, ["tools/mcp.mjs"], { env: { ...process.env, TEKTO_URL: `http://127.0.0.1:${port}` } });
  const want = messages.filter((m) => m.id !== undefined).length;
  const replies = [];
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timed out with ${replies.length}/${want} replies`)), 10000);
      let buf = "";
      child.stdout.on("data", (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          replies.push(JSON.parse(buf.slice(0, i)));
          buf = buf.slice(i + 1);
          if (replies.length === want) { clearTimeout(timer); resolve(); }
        }
      });
      for (const m of messages) child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...m })}\n`);
    });
  } finally {
    child.kill();
    relay.close();
  }
  return { replies: replies.sort((a, b) => a.id - b.id), calls };
}
