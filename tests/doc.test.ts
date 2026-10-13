/**
 * Doc — the document of a retained app.
 *
 * What an app relies on: an id that stays the object's handle; edits that undo as the user
 * thinks of them (a drag is one step, "Duplicate" is one step); notifications once per
 * transaction, so a scene re-renders a record once; another client's edits arriving as
 * "remote"; Save/Open as plain JSON; and a local adapter that survives a reload.
 */
import { describe, it, expect } from "vitest";
import { Doc, localAdapter, type DocChange, type DocChangeSource } from "../src/collab/Doc";
import { memoryAdapter } from "../src/collab/SharedStore";

type Block = { x: number; y: number; w: number; h: number };
type Site = { blocks: Block; notes: { text: string } };
const flush = () => new Promise(r => setTimeout(r, 0));

async function site(adapter = memoryAdapter()) {
  const doc = new Doc<Site>({ name: "site", adapter });
  await doc.ready;
  return doc;
}

describe("Doc records", () => {
  it("adds, reads, merges, maps and removes by stable id", async () => {
    const doc = await site();
    const a = doc.add("blocks", { x: 0, y: 0, w: 4, h: 9 });
    const b = doc.add("blocks", { x: 5, y: 0, w: 2, h: 3 }, { id: "tower" });
    expect(b).toBe("tower");
    expect(doc.ids("blocks")).toEqual([a, "tower"]);
    doc.update("blocks", a, { h: 12 });
    expect(doc.get("blocks", a)).toEqual({ x: 0, y: 0, w: 4, h: 12 });
    doc.update("blocks", a, (blk) => ({ ...blk, w: blk.w * 2 }));
    expect(doc.get("blocks", a)!.w).toBe(8);
    doc.remove("blocks", "tower");
    expect(doc.has("blocks", "tower")).toBe(false);
    expect(doc.count("blocks")).toBe(1);
    expect(() => doc.update("blocks", "tower", { h: 1 })).toThrow(/does not exist/);
    expect(() => doc.add("blocks", { x: 0, y: 0, w: 1, h: 1 }, { id: a })).toThrow(/already exists/);
  });

  it("keeps collections apart", async () => {
    const doc = await site();
    doc.add("blocks", { x: 0, y: 0, w: 1, h: 1 }, { id: "1" });
    doc.add("notes", { text: "north" }, { id: "1" });
    expect(doc.get("notes", "1")).toEqual({ text: "north" });
    expect(doc.count("blocks")).toBe(1);
  });
});

describe("Doc undo / redo", () => {
  it("undoes and redoes single edits, with labels", async () => {
    const doc = await site();
    const a = doc.add("blocks", { x: 0, y: 0, w: 4, h: 9 }, { label: "Add tower" });
    doc.update("blocks", a, { h: 12 }, { label: "Raise" });
    expect(doc.undoLabel()).toBe("Raise");
    expect(doc.undo()).toBe(true);
    expect(doc.get("blocks", a)!.h).toBe(9);
    expect(doc.redoLabel()).toBe("Raise");
    doc.undo();
    expect(doc.has("blocks", a)).toBe(false);
    doc.redo(); doc.redo();
    expect(doc.get("blocks", a)!.h).toBe(12);
    expect(doc.canRedo()).toBe(false);
  });

  it("a transaction is one undo step and one notification", async () => {
    const doc = await site();
    const a = doc.add("blocks", { x: 0, y: 0, w: 4, h: 9 });
    const seen: [DocChange<Site>[], DocChangeSource][] = [];
    doc.onChange((c, s) => seen.push([c, s]));
    doc.transact("Shift and copy", () => {
      doc.update("blocks", a, { x: 1 });
      doc.update("blocks", a, { x: 2 });          // same record twice: reported once
      doc.add("blocks", { x: 9, y: 0, w: 1, h: 1 }, { id: "copy" });
    });
    expect(seen.length).toBe(1);
    expect(seen[0][1]).toBe("local");
    expect(seen[0][0].map(c => c.id).sort()).toEqual([a, "copy"].sort());
    expect(doc.undoLabel()).toBe("Shift and copy");
    doc.undo();
    expect(doc.get("blocks", a)!.x).toBe(0);
    expect(doc.has("blocks", "copy")).toBe(false);
    expect(seen[1][1]).toBe("history");
  });

  it("edits with the same coalesce key merge into one step (a drag)", async () => {
    const doc = await site();
    const a = doc.add("blocks", { x: 0, y: 0, w: 4, h: 9 });
    for (let h = 10; h <= 20; h++) doc.update("blocks", a, { h }, { label: "Height", coalesce: "h" });
    doc.update("blocks", a, { w: 5 }, { label: "Width" });
    doc.undo();                                    // Width
    expect(doc.get("blocks", a)).toMatchObject({ w: 4, h: 20 });
    doc.undo();                                    // the whole drag
    expect(doc.get("blocks", a)!.h).toBe(9);
    expect(doc.undoLabel()).toMatch(/^Add/);
  });

  it("a new edit clears redo; undoable: false stays out of the history", async () => {
    const doc = await site();
    const a = doc.add("blocks", { x: 0, y: 0, w: 4, h: 9 });
    doc.update("blocks", a, { h: 1 });
    doc.undo();
    doc.update("blocks", a, { x: 3 }, { undoable: false });
    expect(doc.canRedo()).toBe(true);
    doc.update("blocks", a, { y: 3 });
    expect(doc.canRedo()).toBe(false);
  });
});

describe("Doc across clients", () => {
  it("another client's edit arrives as remote; undo writes back only my values", async () => {
    const adapter = memoryAdapter();
    const mine = await site(adapter), theirs = await site(adapter);
    const remote: DocChangeSource[] = [];
    mine.onChange((_c, s) => remote.push(s));
    const a = mine.add("blocks", { x: 0, y: 0, w: 4, h: 9 });
    await flush();
    expect(theirs.get("blocks", a)).toEqual({ x: 0, y: 0, w: 4, h: 9 });
    theirs.update("blocks", a, { w: 6 });
    await flush();
    expect(mine.get("blocks", a)!.w).toBe(6);
    expect(remote).toContain("remote");
    expect(mine.canUndo()).toBe(true);
    expect(theirs.undoLabel()).toMatch(/^Edit/);   // their history holds their edit, not mine
  });
});

describe("Doc save and open", () => {
  it("round-trips through JSON; load replaces and starts a new history", async () => {
    const doc = await site();
    doc.add("blocks", { x: 0, y: 0, w: 4, h: 9 }, { id: "a" });
    doc.add("notes", { text: "hi" }, { id: "n" });
    const json = doc.toJSON();
    expect(json).toEqual({ format: "tekto-doc/1", name: "site", collections: { blocks: { a: { x: 0, y: 0, w: 4, h: 9 } }, notes: { n: { text: "hi" } } } });
    const other = await site();
    other.add("blocks", { x: 9, y: 9, w: 1, h: 1 }, { id: "gone" });
    other.load(json);
    expect(other.ids("blocks")).toEqual(["a"]);
    expect(other.has("blocks", "gone")).toBe(false);
    expect(other.canUndo()).toBe(false);
    expect(() => other.load({ format: "nope" } as any)).toThrow(/not a tekto document/);
  });

  it("localAdapter keeps the document across a reload", async () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const first = new Doc<Site>({ name: "plan", adapter: localAdapter({ storage }) });
    await first.ready;
    const id = first.add("blocks", { x: 1, y: 2, w: 3, h: 4 });
    first.remove("blocks", first.add("blocks", { x: 0, y: 0, w: 1, h: 1 }));
    await flush();
    const reopened = new Doc<Site>({ name: "plan", adapter: localAdapter({ storage }) });
    await reopened.ready;
    expect(reopened.all("blocks")).toEqual([[id, { x: 1, y: 2, w: 3, h: 4 }]]);
    expect(JSON.parse(mem.get("tekto.doc.plan")!).length).toBe(1);   // removed records aren't kept
  });
});
