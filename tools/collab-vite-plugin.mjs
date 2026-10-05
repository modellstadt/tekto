/**
 * Vite dev-server plugin: the backend for devServerAdapter() (src/collab/SharedStore.ts).
 * Browser windows on the same dev server share a document's records, presence and broadcasts.
 *
 *   .tekto/collab/<doc>.json     ← the records ({ key: { value, by, at } }), written on every put
 *
 * An agent may edit that file: the plugin notices and sends the changed records to the browsers.
 *
 * Endpoints (under /__tekto/collab):
 *   GET  /records?doc=…              all records
 *   POST /put        {doc,key,value,by}    store one (the server stamps `at`), sent to all
 *   GET  /events?doc=…&session=…     server-sent events: record / presence / broadcast
 *   POST /presence   {doc,presence}  a client's presence (sent again on change; dropped when its
 *                                    event stream closes)
 *   POST /broadcast  {doc,from,event,payload}   a transient message to the other clients
 *
 * Usage (vite.config.mjs):
 *   import tektoCollab from "tekto/collab-vite";
 *   export default { plugins: [tektoCollab()] };
 */
import fs from "node:fs";
import path from "node:path";

export default function tektoCollab(opts = {}) {
  const dir = path.resolve(opts.dir ?? ".tekto/collab");
  const docs = new Map();      // doc → { records: Map<key, {key,value,by,at}>, clients: Map<session, res>, presence: Map<session, p> }
  let clock = 0;
  const now = () => (clock = Math.max(clock + 1, Date.now()));
  const fileOf = (doc) => path.join(dir, `${doc.replace(/[^\w.-]/g, "_")}.json`);

  const readFile = (doc) => {
    try {
      const j = JSON.parse(fs.readFileSync(fileOf(doc), "utf8"));
      return new Map(Object.entries(j).map(([key, r]) => [key, { key, value: r.value ?? null, by: r.by ?? "", at: r.at ?? 0 }]));
    } catch { return new Map(); }
  };
  const writeFile = (d, doc) => {
    fs.mkdirSync(dir, { recursive: true });
    const obj = Object.fromEntries([...d.records].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, r]) => [k, { value: r.value, by: r.by, at: r.at }]));
    d.written = JSON.stringify(obj, null, 1) + "\n";
    fs.writeFileSync(fileOf(doc), d.written);
  };
  const docOf = (doc) => {
    let d = docs.get(doc);
    if (!d) {
      d = { records: readFile(doc), clients: new Map(), presence: new Map(), written: null };
      docs.set(doc, d);
      // An agent (or a person) editing the file: send what changed.
      fs.mkdirSync(dir, { recursive: true });
      fs.watchFile(fileOf(doc), { interval: 700 }, () => {
        let text;
        try { text = fs.readFileSync(fileOf(doc), "utf8"); } catch { return; }
        if (text === d.written) return;   // our own write
        let next;
        try { next = JSON.parse(text); } catch { return; }   // half-written: the next change retries
        d.written = text;
        const keys = new Set([...d.records.keys(), ...Object.keys(next)]);
        for (const key of keys) {
          const cur = d.records.get(key), n = next[key];
          const value = n ? n.value ?? null : null;
          if (cur && JSON.stringify(cur.value) === JSON.stringify(value)) continue;
          if (!cur && value === null) continue;
          const rec = { key, value, by: n?.by ?? "file", at: now() };
          d.records.set(key, rec);
          send(d, "record", rec);
        }
      });
    }
    return d;
  };
  const send = (d, event, data, except) => {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [session, res] of d.clients) if (session !== except) res.write(msg);
  };
  const sendPresence = (d) => send(d, "presence", [...d.presence.values()]);
  const readBody = (req) => new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (c) => { body += c; });
    req.on("end", () => { try { resolve(JSON.parse(body || "{}")); } catch (e) { reject(e); } });
  });
  const json = (res, data) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(data)); };

  return {
    name: "tekto-collab",
    apply: "serve",
    configureServer(server) {
      // the records file is data, not source: no reload when it changes
      server.watcher.unwatch(path.join(dir, "**"));
      server.middlewares.use("/__tekto/collab", async (req, res) => {
        const url = new URL(req.url ?? "/", "http://x");
        try {
          if (req.method === "GET" && url.pathname === "/records") {
            return json(res, [...docOf(url.searchParams.get("doc") ?? "default").records.values()]);
          }
          if (req.method === "GET" && url.pathname === "/events") {
            const d = docOf(url.searchParams.get("doc") ?? "default");
            const session = url.searchParams.get("session") ?? Math.random().toString(36).slice(2);
            res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
            res.write(": connected\n\n");
            d.clients.set(session, res);
            res.write(`event: presence\ndata: ${JSON.stringify([...d.presence.values()])}\n\n`);
            const ping = setInterval(() => res.write(": ping\n\n"), 20000);
            req.on("close", () => {
              clearInterval(ping);
              d.clients.delete(session);
              if (d.presence.delete(session)) sendPresence(d);
            });
            return;
          }
          if (req.method !== "POST") { res.statusCode = 405; return res.end(); }
          const body = await readBody(req);
          const d = docOf(body.doc ?? "default");
          if (url.pathname === "/put") {
            const rec = { key: String(body.key), value: body.value ?? null, by: String(body.by ?? "guest"), at: now() };
            d.records.set(rec.key, rec);
            writeFile(d, body.doc ?? "default");
            send(d, "record", rec);
            return json(res, rec);
          }
          if (url.pathname === "/presence") {
            d.presence.set(body.presence.session, body.presence);
            sendPresence(d);
            return json(res, { ok: true });
          }
          if (url.pathname === "/broadcast") {
            send(d, "broadcast", { event: body.event, payload: body.payload, from: body.from }, body.from);
            return json(res, { ok: true });
          }
          res.statusCode = 404; res.end();
        } catch (e) {
          res.statusCode = 500;
          res.end(String(e?.stack ?? e));
        }
      });
    },
  };
}
