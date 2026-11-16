# A house

![The example house: two storeys, a gable roof, a half-turn stair](/shots/house-sunset.webp)

In an app, `bindBuilding(doc, scene)` keeps a scene in step with the building records of a [`Doc`](/buildings/doc). Any change to a record rebuilds the house; every object is keyed by its record (`"walls/s"`), so selection, ✎ Markup and callouts name records, and the checks can point at the walls they are about. Add `agentDoc` and an agent edits the same records: see [Working with Claude](/claude/mcp).

```ts
import { appShell, bindBuilding, Doc, localAdapter, Selection, selectOnClick, type BuildingRecords } from "tekto";

const doc = new Doc<BuildingRecords>({ name: "house", adapter: localAdapter() });
const app = appShell({
  container: document.getElementById("app")!,
  title: "House",
  shadingBar: true,
  navGizmo: true,
  units: "m",
  camera: [22, -18, 16],
  target: [5, 4, 2.5],
  params: { framing: { type: "bool", default: false, label: "Framing" } },
});

const house = bindBuilding(doc, app.scene);
house.onBuild((building, issues) => {
  app.renderer.setSectionLevels(building.levels());          // a plan cut per storey in the shading bar
  app.renderer.setCallouts(issues.filter((i) => i.keys.length).map((i, n) => ({
    id: `${i.code}-${n}`, text: i.code, detail: i.message,
    colour: i.severity === "error" ? "#e5484d" : "#f5a524",
    objects: i.keys,                                         // the records the issue is about
  })));
  app.status(`${building.storeys.length} storeys · ${building.areas().total.toFixed(1)} m²`);
});
app.params.onChange((key, value) => {
  if (key === "framing") house.setDetail(value ? "framing" : "envelope");
});
selectOnClick(app.renderer, app.scene, new Selection());

void doc.ready.then(() => {
  if (doc.count("storeys") > 0) return;
  doc.transact("Start a house", () => {
    doc.add("storeys", { name: "Ground floor", elevation: 0, height: 2.9 }, { id: "eg" });
    const corners: [number, number][] = [[0, 0], [10, 0], [10, 8], [0, 8]];
    corners.forEach((p, i) => doc.add("walls", { storey: "eg", path: [p, corners[(i + 1) % 4]] }, { id: `w${i}` }));
    doc.add("slabs", { storey: "eg", boundary: [[0, 0], [10, 0], [10, 8], [0, 8]], type: "ground" }, { id: "base" });
  });
});
```

## What to know

- `setDetail("framing")` draws studs, plates, joists and sheathing; `"envelope"` draws the wall and slab envelopes, much lighter.
- `house.building` is the building as last built, `house.issues` its checks; `house.recordOf(sceneId)` finds the record of a clicked object.
- The House page also exports IFC (`building.toIfc()`) and OBJ grouped by layer, saves and opens JSON, and keeps ✎ Markup's notes with the model.

::: tip Playground
[House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts): `?page=house`, or `?page=house&empty` to start on an empty site.
:::
