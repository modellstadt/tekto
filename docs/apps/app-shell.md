# appShell: an app people edit

<Live page="app-shell" label="App Shell" poster="/shots/twisted-tower.webp" alt="A twisting tower in an appShell" />

<Live page="site-editor" label="Site Editor" />

`appShell()` is the harness for a real app: a panel built once from a declared schema of params, a Z-up 3D view, and a top bar for light, render mode, camera, section and sun. Unlike `sketch()`, nothing is rebuilt unless you rebuild it: the app owns its `Scene` and decides what changes. That makes it the place for the retained model, with a [`Doc`](/buildings/doc), selection, undo and saving.

```ts
import { appShell, MeshFactory, MeshTransform, Vec3 } from "tekto";

const app = appShell({
  container: document.getElementById("app")!,
  title: "Tower",
  topBar: true,
  navGizmo: true,
  camera: [14, -16, 12],
  target: [0, 0, 4],
  params: {
    floors: { type: "int", min: 2, max: 40, default: 12, label: "Floors" },
    twist: { type: "float", min: 0, max: 180, default: 60, step: 1, label: "Twist (°)" },
    color: { type: "color", default: "#cfd8dc", label: "Color", display: true },
  },
});

const slabs: string[] = [];
app.onBuild(() => {                                   // build params changed: new geometry
  app.scene.clear();
  slabs.length = 0;
  const floors = app.params.get("floors") as number;
  const twist = ((app.params.get("twist") as number) * Math.PI) / 180;
  for (let i = 0; i < floors; i++) {
    const slab = MeshFactory.box(4, 2.4, 0.12);      // Z-up: thickness along z
    MeshTransform.rotate(slab, new Vec3(0, 0, 1), (twist * i) / (floors - 1));
    slab.translate(0, 0, i * 0.7);
    slabs.push(app.scene.addMesh(slab, { label: `floor ${i + 1}` }).id);
  }
  app.status(`${floors} floors`);
});
app.onDisplay(() => {                                 // display params changed: restyle only
  for (const id of slabs) app.scene.setStyle(id, { color: app.params.get("color") as string });
});
app.rebuild();
```

## What to know

- **Params are declared once.** A param with `display: true` calls `onDisplay` only, so changing a colour does not rebuild geometry. `groups` sorts params into folders.
- **Top bar and view**: `topBar: { cut: false }` drops a control the app does not need; `shadingBar: true` puts render style, lighting and sun as icons in the view; `navGizmo: true` adds the axis widget for plans and elevations.
- **Commands**: `app.commands.add([{ id: "edit.undo", label: "Undo", keys: "Mod+Z", run }])`. People get the key, agents get the id.
- **Notes**: `appShell({ notes: doc })` keeps ✎ Markup's marks as notes in the document. See [Markup and notes](/collaboration/notes).
- `app.overlay()` is a layer over the view, for a [drawing](/drawings/sheet-canvas) of the same model.

::: tip Playground
[App Shell](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/app-shell.ts) (`?page=app-shell`) and the [Site Editor](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/site-editor.ts) (`?page=site-editor`), the retained model end to end.
:::
