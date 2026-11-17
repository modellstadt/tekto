# The agent relay

<Live page="house" label="House" poster="/shots/house-ghost-framing.webp" alt="The house in ghost mode: records an agent reads and edits" />

Underneath the MCP server is a plain HTTP relay. An app that calls `agentDoc` puts its document on `window.__tekto.doc`: the collections with their schema, the records, and `apply` for a patch. With `tekto/markup-vite` in the dev server, the same calls reach the page from outside through `POST /__tekto/agent/call`; the newest tab to connect takes them. Any script can drive an open app this way, not only an MCP client.

```ts
// Run in Node next to `npm run playground`, with the House page open in a browser.
async function call(op: string, args: Record<string, unknown> = {}) {
  const res = await fetch("http://localhost:5173/__tekto/agent/call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op, args, agent: "My script", page: "house" }),   // `page` picks a tab by URL or title
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
  return body.result;
}

async function main() {
  const info = await call("info");                                    // collections, schema, controls, open notes
  const result = await call("apply", {
    patch: { update: { "openings/ew1": { width: 2.6 } } },            // one undo step for the person
    label: "Wider east window",
  });
  console.log(info.title, result.issues);                             // answered with the app's checks
  await call("section", { axis: "z", coordinate: 1.2 });
  await call("snapshot");                                             // what the person sees now
}
void main();
```

The calls are `info`, `records`, `apply`, `check`, `notes`, `noteReply`, `noteResolve`, `undo`, `redo`, `setParams`, `run`, `camera`, `section`, `steps` and `snapshot`.

## What to know

- A patch that breaks the schema is rejected whole, with the reasons. Nothing half-applies.
- Automated browsers (Playwright, `snap`) stay off the relay unless their URL contains `agent-relay`, so a test does not take the calls meant for a person's tab.
- In the page, `window.__tekto` also lists the controls (`schema()`), sets them (`setParams`), lists and runs commands (`commands()`, `run(id)`) and moves the camera. `npm run snap` uses the same handle from headless Chrome.

::: tip Playground
Every playground page installs `window.__tekto`; the [House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts) shares its document with `agentDoc`.
:::
