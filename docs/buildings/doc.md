# Doc: the retained model

<Live page="site-editor" label="Site Editor" poster="/shots/site-editor.webp" alt="Blocks in the Site Editor, each a record in a Doc" />

A `Doc` is the document of a retained CAD app: typed records in named collections, each with a stable id. It keeps the history (`transact` groups writes into one undo step, `coalesce` makes a slider drag one step), saves and opens as plain JSON, and persists through an adapter: this browser, the dev server, or Supabase. `bindScene` derives the scene from one collection and rebuilds only the records that changed. Store decisions in the document, never meshes: geometry is derived.

```ts
import { appShell, bindScene, Doc, localAdapter, MeshFactory, Selection, selectOnClick } from "tekto";

type Block = { x: number; y: number; w: number; d: number; h: number };

const doc = new Doc<{ blocks: Block }>({ name: "site", adapter: localAdapter() });
const app = appShell({
  container: document.getElementById("app")!,
  title: "Site",
  params: {},
  navGizmo: true,
  camera: [34, -40, 34],
  target: [11, 5, 4],
});

bindScene(doc, "blocks", app.scene, (b, id) => {          // record → objects; each carries key "blocks/<id>"
  const m = MeshFactory.box(b.w, b.d, b.h);
  m.translate(b.x, b.y, b.h / 2);
  app.scene.addMesh(m, { color: "#cfd8dc", label: `block ${id}` });
});

const selection = new Selection();
selectOnClick(app.renderer, app.scene, selection);         // click a block, Shift-click adds

void doc.ready.then(() => {
  const id = doc.add("blocks", { x: 0, y: 0, w: 4, d: 3, h: 6 }, { label: "Add block" });
  doc.update("blocks", id, { h: 12 }, { coalesce: "h" });  // a drag of many updates is one undo step
  doc.undo();
  const saved = doc.toJSON();                              // Save; doc.load(saved) is Open
  console.log(doc.count("blocks"), saved);
});

app.commands.add([
  { id: "edit.undo", label: "Undo", keys: "Mod+Z", run: () => { doc.undo(); }, enabled: () => doc.canUndo() },
]);
```

## What to know

- **The record id is the handle.** Selection, ✎ Markup, callouts and snapshots name a record as `"collection/id"`, and that name holds through edits, undo, saving and reopening.
- **Adapters**: `localAdapter()` keeps the document in this browser, `devServerAdapter()` shares it between windows on one Vite dev server, `supabaseAdapter(client)` puts it online with sign-in. See [Shared editing](/collaboration/shared-editing).
- **Don't hand-roll** an undo stack or a save format. Anything with selection, undo or save belongs on a `Doc`.

::: tip Playground
[Site Editor](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/site-editor.ts): `?page=site-editor`. Add `&shared=1` and open it in two windows.
:::
