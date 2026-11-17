# Callouts

<Live page="framed-wall" label="Framed Wall" poster="/shots/framed-wall-callouts.webp" alt="A callout per kind of member on a framed wall" />

<Live page="framed-floor" label="Framed Floor" />
<Live page="house" label="House" />

Callouts are labels in the margins of the view with leaders to the objects they name. They are laid out so they don't overlap, follow the model as it turns, and leave out what is hidden behind other objects. Name objects by scene id or by record key (`"walls/s"`, and everything drawn for it). Use them for a key of materials, for the issues a check found, or for what an agent changed.

```ts
import { appShell, MeshFactory } from "tekto";

const app = appShell({
  container: document.getElementById("app")!,
  title: "Callouts",
  params: {},
  camera: [6, -7, 4],
  target: [2, 0, 1],
});
const keys: string[] = [];
for (let i = 0; i < 5; i++) {
  app.scene.withKey(`studs/${i}`, () => {                 // every object added here carries this key
    const stud = MeshFactory.box(0.06, 0.16, 2.6);
    stud.translate(i * 0.625, 0, 1.3);
    app.scene.addMesh(stud, { color: "#d2a86a", label: `Stud ${i + 1}` });
  });
  keys.push(`studs/${i}`);
}

app.renderer.setCallouts([
  { id: "studs", text: "Stud", detail: "5 × KVH 60×160", colour: "#d2a86a", objects: keys, leaders: "each" },
], {
  onPick: (id) => console.log("clicked", id),
});
```

## What to know

- By default a callout draws one leader to the centre of its objects, in the nearer margin. `leaders: "each"` draws one to each object; `side: "left"` keeps a label in one margin; `leaderShape: "curve"` curves the leaders.
- `setCallouts(items, { stack: "list", title })` lists the labels down one margin in the given order, like a key.
- `setCalloutHighlight(ids, colour)` marks labels and their leaders, for example the one naming what the pointer is over.

::: tip Playground
[Framed Wall](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/framed-wall.ts) (`?page=framed-wall`) and [Framed Floor](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/framed-floor.ts) (`?page=framed-floor`); the [House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts) shows its issues as callouts.
:::
