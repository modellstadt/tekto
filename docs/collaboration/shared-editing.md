# Shared editing

![One NURBS curve edited from two windows](/shots/shared-editing.webp)

<Live page="site-editor" label="Site Editor" />
<Live page="house" label="House" />

`SharedStore` is a document of keyed records that everyone with the same document name edits together. A write applies locally at once, is stored by the backend and reaches the other clients live. Per key the last write wins, which suits small teams, especially with **presence** showing who is on what. Broadcasts carry passing messages, such as a point while it is dragged, that are never stored. A [`Doc`](/buildings/doc) sits on a `SharedStore`, so a retained app becomes shared by choosing its adapter.

```ts
import { NurbsCurve, PresenceBar, SharedStore, Vec3, devServerAdapter, sketch } from "tekto";

type XYZ = [number, number, number];
const START: XYZ[] = [[-3, 0, 0], [-1, 0, 2.5], [1, 0, -2.5], [3, 0, 0]];
const store = new SharedStore<XYZ>({ doc: "my-curve", adapter: devServerAdapter() });

sketch((lab) => {
  lab.once(() => {
    new PresenceBar(store, lab.viewport);                  // badges of who is online, and Sign in
    store.onChange(() => lab.invalidate());               // a local or remote change → run again
    store.onPresence(() => lab.invalidate());
    void store.connect();
  });
  const cps = START.map((p, i) => new Vec3(...(store.get(`p${i}`) ?? p)));
  const curve = new NurbsCurve(cps, 3, [0, 0, 0, 0, 1, 1, 1, 1]);
  lab.polyline(Array.from({ length: 65 }, (_, i) => curve.getPoint(i / 64))).color("#f2b35a");
  lab.handles(cps.map((p, i) => ({ p, i })), {
    key: (d) => `cp-${d.i}`,
    position: (d) => d.p,
    onDrag: (d, q) => {
      store.set(`p${d.i}`, [q.x, q.y, q.z]);              // applied here, stored, sent to everyone
      store.setPresence({ dragging: `p${d.i}` });          // the others see it in store.others
    },
  });
});
```

## Backends

| adapter | for | records live in |
|---|---|---|
| `memoryAdapter()` | tests, one-page demos | memory |
| `devServerAdapter()` | windows on one Vite dev server, and agents | `.tekto/collab/<doc>.json`: edit it and the windows follow |
| `supabaseAdapter(client)` | online, with GitHub sign-in | a Supabase table, with a history of every write |

The dev adapter needs the Vite plugin, which the playground already has:

```js
// vite.config.mjs
import tektoCollab from "tekto/collab-vite";
export default { plugins: [tektoCollab()] };
```

In a retained app, `shareSelection(selection, doc.store, app.renderer, app.scene)` sends this window's selection with its presence and outlines what the others have selected, each in their colour. The README has the SQL for the Supabase tables and their row-level security.

::: tip Playground
[Shared Editing](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/shared-editing.ts) (`?page=shared-editing`): open it in two windows and drag the points. It talks to the dev server, so it runs from a clone (`npm run playground`), not on this site. The [Site Editor](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/site-editor.ts) and [House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts) share with `&shared=1`.
:::
