# Markup and notes

![A note on the roof, answered by Claude](/shots/notes-with-claude.webp)

Every 3D app has a **✎ Markup** button. Draw on the view, give each mark a short note and press Save. Each mark keeps its strokes and the objects they touch, resolved when it is drawn: their layer, label and colour, the world points it lands on, and the source line that created each object. So a note says which wall, where and in which file.

In an app with notes, the marks are kept as **notes with the model**: pinned where they were drawn, naming the records they touch, saved and undoable in the [`Doc`](/buildings/doc), and on a shared document visible to everyone. A note is open until it is done, and carries its replies. That makes notes the way to tell an agent what to change: it lists the open notes, makes the change and resolves each with what it did, or asks back.

```ts
import { appShell, Doc, localAdapter, type Note } from "tekto";

type Block = { x: number; y: number; h: number };
const doc = new Doc<{ blocks: Block; notes: Note }>({ name: "site", adapter: localAdapter() });

const app = appShell({
  container: document.getElementById("app")!,
  title: "Site",
  params: {},
  notes: doc,                 // Markup's Save keeps marks as notes in doc.notes
});

const notes = app.notes!;
const id = notes.add({
  text: "Make this block taller", author: "BD", createdAt: new Date().toISOString(),
  pin: [2, 1, 6], strokes: [], keys: ["blocks/a1"],
  view: { position: [20, -20, 15], target: [2, 1, 3] },
});
notes.reply(id, "Which height did you have in mind?", "Claude");
notes.resolve(id, "Raised it from 6 m to 9 m.", "Claude");   // its pin turns grey; Reopen brings it back
notes.describe("open");                                      // the open notes, as a list
```

## What to know

- Without a `Doc`, Save writes a bundle to `.tekto/markup/<stamp>/`: `view.png` with numbered marks, `clean.png` without, and `markup.json` with the camera, params and one entry per mark. "See the markup" means read that folder.
- An app with its own UI mounts Markup with `markup(renderer, scene)` and draws notes with `notesLayer(renderer, doc)`.
- Agents reach notes through `__tekto.notes` in the page, the relay, and the MCP tools `tekto_notes`, `tekto_note_reply` and `tekto_note_resolve`.

::: tip Playground
[House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts) (`?page=house`) and the [Site Editor](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/site-editor.ts) keep notes with the model.
:::
