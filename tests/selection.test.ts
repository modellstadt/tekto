/**
 * Selection by record — click, Shift-click, background click — and its highlight.
 *
 * A record is usually several scene objects, and bindScene replaces them on every edit; the
 * selection must name the record, highlight all its objects, and still highlight them after
 * the record has been rebuilt with new scene ids.
 */
import { describe, it, expect } from "vitest";
import { Doc, bindScene, Selection, selectOnClick, type PickingView } from "../src/collab/Doc";
import type { ThreeRenderer } from "../src/render/ThreeRenderer";
import { Scene } from "../src/scene/Scene";
import { Vec3 } from "../src/core/math/vectors";

// The real renderer must fit the structural interface selectOnClick uses.
const _fits: PickingView = null as unknown as ThreeRenderer;
void _fits;

type Info = { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean };
function fakeView() {
  let pick: ((id: string | null, info: Info) => void) | null = null;
  const view = {
    picking: false,
    highlighted: null as readonly string[] | null,
    setPickEnabled(on: boolean) { view.picking = on; },
    onPick(l: (id: string | null, info: Info) => void) { pick = l; return () => { pick = null; }; },
    setSelectionHighlight(ids: readonly string[] | null) { view.highlighted = ids; },
    click(id: string | null, mods: Partial<Info> = {}) { pick?.(id, { shiftKey: false, metaKey: false, ctrlKey: false, ...mods }); },
  };
  return view;
}

async function setup() {
  const doc = new Doc<{ posts: { x: number } }>({ name: "s" });
  await doc.ready;
  const scene = new Scene();
  const binding = bindScene(doc, "posts", scene, (p) => {
    scene.addPoint(new Vec3(p.x, 0, 0));
    scene.addSegment(new Vec3(p.x, 0, 0), new Vec3(p.x, 0, 3));
  });
  doc.add("posts", { x: 0 }, { id: "a" });
  doc.add("posts", { x: 2 }, { id: "b" });
  const view = fakeView();
  const sel = new Selection();
  const off = selectOnClick(view, scene, sel);
  return { doc, scene, binding, view, sel, off };
}

describe("selectOnClick", () => {
  it("a click selects the record and highlights all its objects", async () => {
    const { binding, view, sel } = await setup();
    expect(view.picking).toBe(true);
    view.click(binding.objectsOf("a")[1]);
    expect(sel.keys()).toEqual(["posts/a"]);
    expect(sel.ids("posts")).toEqual(["a"]);
    expect([...view.highlighted!].sort()).toEqual(binding.objectsOf("a").sort());
  });

  it("Shift/⌘-click toggles; a background click clears", async () => {
    const { binding, view, sel } = await setup();
    view.click(binding.objectsOf("a")[0]);
    view.click(binding.objectsOf("b")[0], { shiftKey: true });
    expect(sel.keys().sort()).toEqual(["posts/a", "posts/b"]);
    expect(view.highlighted!.length).toBe(4);
    view.click(binding.objectsOf("a")[0], { metaKey: true });
    expect(sel.keys()).toEqual(["posts/b"]);
    view.click(null);
    expect(sel.size).toBe(0);
    expect(view.highlighted).toBeNull();
  });

  it("the highlight follows a rebuilt record onto its new objects", async () => {
    const { doc, binding, view } = await setup();
    view.click(binding.objectsOf("a")[0]);
    const old = binding.objectsOf("a");
    doc.update("posts", "a", { x: 5 });
    await Promise.resolve();
    const now = binding.objectsOf("a");
    expect(now).not.toEqual(old);
    expect([...view.highlighted!].sort()).toEqual(now.sort());
  });

  it("an object that shows no record clears the selection; dispose stops it", async () => {
    const { scene, binding, view, sel, off } = await setup();
    view.click(binding.objectsOf("a")[0]);
    const loose = scene.addPoint(new Vec3(9, 9, 9));
    view.click(loose.id);
    expect(sel.size).toBe(0);
    off();
    view.click(binding.objectsOf("b")[0]);
    expect(sel.size).toBe(0);
    expect(view.highlighted).toBeNull();
  });
});

describe("Selection", () => {
  it("emits only on real changes", () => {
    const sel = new Selection();
    let n = 0;
    sel.onChange(() => n++);
    sel.select(["a/1", "a/2"]);
    sel.select(["a/2", "a/1"]);      // same set
    sel.add("a/1");                  // already in
    sel.remove("a/9");               // not in
    sel.clear(); sel.clear();
    expect(n).toBe(2);
  });
});
