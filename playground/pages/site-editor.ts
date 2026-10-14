/**
 * Site Editor — the retained model, end to end: a document of blocks people add, select,
 * resize, move, delete, undo and save.
 *
 *   Doc            the blocks as plain JSON records with stable ids (this browser keeps them;
 *                  `?shared=1` shares them through the dev server, `.tekto/collab/site-editor.json`)
 *   bindScene      block → box mesh; only a changed block is rebuilt
 *   Selection      by record: click, Shift-click; the sliders edit the selection
 *   undo / redo    a slider drag or a run of arrow-key nudges is one step
 *   toJSON / load  Save JSON / Open JSON
 *
 *   shareSelection with `?shared=1`, each window outlines what the others have selected, in
 *                  their colour (the presence bar says whose colour is whose)
 *   commands       Delete, ⌘/Ctrl-Z, ⇧⌘/Ctrl-Shift-Z, ⌘/Ctrl-D, arrows (move 0.5 m) — as
 *                  `app.commands`, so an agent can list and run them too (`__tekto.run`)
 */
import {
  appShell, Doc, bindScene, Selection, selectOnClick, shareSelection, PresenceBar, localAdapter, devServerAdapter,
  MeshFactory, download, type DocJSON,
} from "../../src";

type Block = { x: number; y: number; w: number; d: number; h: number };

export default function (container: HTMLElement) {
  const shared = new URLSearchParams(location.search).get("shared");
  const doc = new Doc<{ blocks: Block }>({ name: "site-editor", adapter: shared ? devServerAdapter() : localAdapter() });
  const selection = new Selection();
  let syncing = false;                     // pushing a selection's values into the sliders

  const app = appShell({
    title: "Site Editor",
    container,
    topBar: false,
    navGizmo: true,
    // No top bar here: the render style, lighting and sun as icons in the view instead.
    shadingBar: true,
    // A site wants a sense of scale: a ground ruled in metres that fades out, fitted to the blocks.
    renderer: { gridStyle: "fading" },
    camera: [34, -40, 34],
    target: [11, 5, 4],
    params: {
      w: { type: "float", min: 1, max: 12, default: 4, step: 0.5, label: "Width" },
      d: { type: "float", min: 1, max: 12, default: 3, step: 0.5, label: "Depth" },
      h: { type: "float", min: 1, max: 30, default: 6, step: 0.5, label: "Height" },
      add: { type: "button", label: "Add block", action: () => addBlock() },
      duplicate: { type: "button", label: "Duplicate", action: () => duplicate() },
      remove: { type: "button", label: "Delete", action: () => removeSelected() },
      undo: { type: "button", label: "Undo", action: () => doc.undo() },
      redo: { type: "button", label: "Redo", action: () => doc.redo() },
      save: { type: "button", label: "Save JSON", action: () => download(JSON.stringify(doc.toJSON(), null, 2), "site.json", { stamp: true }) },
      open: { type: "button", label: "Open JSON", action: () => openJson() },
    },
    groups: {
      "Selected block": ["w", "d", "h"],
      Edit: ["add", "duplicate", "remove"],
      History: ["undo", "redo"],
      File: ["save", "open"],
    },
  });

  // ── Document → scene, and selection ──
  const blocks = bindScene(doc, "blocks", app.scene, (b, id) => {
    const m = MeshFactory.box(b.w, b.d, b.h);
    m.translate(b.x, b.y, b.h / 2);
    app.scene.addMesh(m, { color: "#cfd8dc", label: `block ${id}`, layer: "blocks" });
  });
  const stopSelecting = selectOnClick(app.renderer, app.scene, selection);
  // Who has what selected: this window's selection goes out, the others' are outlined here.
  const stopSharing = shareSelection(selection, doc.store, app.renderer, app.scene);
  const presence = shared ? new PresenceBar(doc.store, app.renderer.canvasEl.parentElement!, { describe: (p) => {
    const n = Array.isArray(p.state.selection) ? p.state.selection.length : 0;
    return n ? `${n} selected` : undefined;
  } }) : null;

  // The sliders show the (first) selected block, and edit every selected one.
  selection.onChange(() => {
    const first = selection.ids("blocks")[0];
    const b = first ? doc.get("blocks", first) : undefined;
    if (b) { syncing = true; app.params.set("w", b.w); app.params.set("d", b.d); app.params.set("h", b.h); syncing = false; }
    status();
  });
  app.params.onChange((key, value) => {
    if (syncing || !(key === "w" || key === "d" || key === "h")) return;
    const ids = selection.ids("blocks");
    if (!ids.length) return;
    doc.transact(`Resize ${key}`, () => { for (const id of ids) doc.update("blocks", id, { [key]: value } as Partial<Block>); }, { coalesce: `size-${key}` });
  });

  // ── Commands ──
  function addBlock() {
    const n = doc.count("blocks");
    const id = doc.add("blocks", {
      x: (n % 4) * 7, y: Math.floor(n / 4) * 7,
      w: app.params.get("w"), d: app.params.get("d"), h: app.params.get("h"),
    }, { label: "Add block" });
    selection.select([`blocks/${id}`]);
  }
  function duplicate() {
    const ids = selection.ids("blocks");
    if (!ids.length) return;
    const copies = doc.transact("Duplicate", () => ids.map(id => {
      const b = doc.get("blocks", id)!;
      return doc.add("blocks", { ...b, x: b.x + b.w + 1 });
    }));
    selection.select(copies.map(id => `blocks/${id}`));
  }
  function removeSelected() {
    const ids = selection.ids("blocks");
    if (!ids.length) return;
    doc.transact(ids.length > 1 ? `Delete ${ids.length} blocks` : "Delete block", () => { for (const id of ids) doc.remove("blocks", id); });
    selection.clear();
  }
  function move(dx: number, dy: number) {
    const ids = selection.ids("blocks");
    if (!ids.length) return;
    doc.transact("Move", () => { for (const id of ids) doc.update("blocks", id, (b) => ({ ...b, x: b.x + dx, y: b.y + dy })); }, { coalesce: "move" });
  }
  function openJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try { doc.load(JSON.parse(await f.text()) as DocJSON); selection.clear(); }
      catch (e) { console.error("Open JSON:", e); }
    };
    input.click();
  }

  // ── Keys, as commands: one list a person, a palette and an agent all read ──
  const STEP = 0.5;
  const selected = () => selection.ids("blocks").length > 0;
  app.commands.add([
    { id: "edit.undo", label: "Undo", keys: "Mod+Z", group: "Edit", run: () => doc.undo(), enabled: () => doc.canUndo() },
    { id: "edit.redo", label: "Redo", keys: ["Shift+Mod+Z", "Mod+Y"], group: "Edit", run: () => doc.redo(), enabled: () => doc.canRedo() },
    { id: "edit.add", label: "Add block", group: "Edit", run: addBlock },
    { id: "edit.duplicate", label: "Duplicate", keys: "Mod+D", group: "Edit", run: duplicate, enabled: selected },
    { id: "edit.delete", label: "Delete", keys: ["Delete", "Backspace"], group: "Edit", run: removeSelected, enabled: selected },
    { id: "move.left", label: "Move left", keys: "ArrowLeft", group: "Move", run: () => move(-STEP, 0), enabled: selected },
    { id: "move.right", label: "Move right", keys: "ArrowRight", group: "Move", run: () => move(STEP, 0), enabled: selected },
    { id: "move.up", label: "Move north", keys: "ArrowUp", group: "Move", run: () => move(0, STEP), enabled: selected },
    { id: "move.down", label: "Move south", keys: "ArrowDown", group: "Move", run: () => move(0, -STEP), enabled: selected },
  ]);

  // ── Status: count, selection, what Undo would do ──
  function status() {
    const sel = selection.ids("blocks").length;
    const undo = doc.undoLabel();
    app.status(`${doc.count("blocks")} blocks · ${sel} selected${undo ? ` · Undo: ${undo}` : ""}`);
  }
  doc.onChange(status);
  doc.onHistory(status);

  // A first block on an empty site, once the stored document has loaded.
  void doc.ready.then(() => {
    if (doc.count("blocks") === 0) doc.add("blocks", { x: 0, y: 0, w: 4, d: 3, h: 6 }, { undoable: false });
    status();
  });

  // For agents and tests: the document and the selection behind the view.
  (window as unknown as { siteEditor: unknown }).siteEditor = { doc, selection, blocks };

  return {
    dispose() {
      stopSelecting();
      stopSharing();
      presence?.destroy();
      blocks.dispose();
      doc.dispose();
      app.dispose();
    },
  };
}
