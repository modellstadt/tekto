/**
 * bindScene — a scene that follows a document record by record.
 *
 * The promises: every object carries the key of the record it shows, from the moment it is
 * added; a changed record rebuilds only its own objects, once per transaction; a removed
 * record's objects go; undo shows up in the scene like any edit; one record that fails to
 * render doesn't take the others with it; and dispose leaves the scene as it found it.
 */
import { describe, it, expect, vi } from "vitest";
import { Doc, bindScene } from "../src/collab/Doc";
import { Scene } from "../src/scene/Scene";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";
import { Vec3 } from "../src/core/math/vectors";

type Block = { x: number; h: number };
async function setup() {
  const doc = new Doc<{ blocks: Block; notes: { t: string } }>({ name: "t" });
  await doc.ready;
  const scene = new Scene();
  const renders: string[] = [];
  const binding = bindScene(doc, "blocks", scene, (b, id) => {
    renders.push(id);
    const m = MeshFactory.box(1, 1, b.h);
    m.translate(b.x, 0, b.h / 2);
    scene.addMesh(m, { label: `block ${id}` });
    scene.addPoint(new Vec3(b.x, 0, b.h));             // a second object for the same record
  });
  return { doc, scene, binding, renders };
}

describe("bindScene", () => {
  it("renders existing and new records, each object keyed by its record", async () => {
    const { doc, scene, binding } = await setup();
    const a = doc.add("blocks", { x: 0, h: 3 }, { id: "a" });
    expect(scene.count()).toBe(2);
    const [mesh, point] = binding.objectsOf(a).map(id => scene.get(id)!);
    expect(mesh.key).toBe("blocks/a");
    expect(point.key).toBe("blocks/a");
    expect(binding.recordOf(mesh.id)).toBe("a");
    expect(scene.byKey("blocks/a").length).toBe(2);
  });

  it("the key is on the object when its add event fires", async () => {
    const { doc, scene } = await setup();
    const seen: (string | undefined)[] = [];
    scene.on((e) => { if (e.type === "object:add") seen.push(scene.get(e.id)!.key); });
    doc.add("blocks", { x: 1, h: 1 }, { id: "b" });
    expect(seen).toEqual(["blocks/b", "blocks/b"]);
  });

  it("an edit rebuilds only that record, once per transaction; removal clears it", async () => {
    const { doc, scene, binding, renders } = await setup();
    doc.add("blocks", { x: 0, h: 3 }, { id: "a" });
    doc.add("blocks", { x: 5, h: 2 }, { id: "b" });
    renders.length = 0;
    const before = binding.objectsOf("b");
    doc.transact("Raise", () => {
      doc.update("blocks", "a", { h: 4 });
      doc.update("blocks", "a", { h: 5 });
    });
    expect(renders).toEqual(["a"]);                       // b untouched, a once
    expect(binding.objectsOf("b")).toEqual(before);
    expect(scene.get(binding.objectsOf("a")[0])!.mesh!.bounds().max.z).toBeCloseTo(5);
    doc.remove("blocks", "a");
    expect(binding.objectsOf("a")).toEqual([]);
    expect(scene.count()).toBe(2);
  });

  it("undo is just another change for the scene", async () => {
    const { doc, scene, binding } = await setup();
    doc.add("blocks", { x: 0, h: 3 }, { id: "a" });
    doc.update("blocks", "a", { h: 9 });
    doc.undo();
    expect(scene.get(binding.objectsOf("a")[0])!.mesh!.bounds().max.z).toBeCloseTo(3);
    doc.undo();
    expect(scene.count()).toBe(0);
  });

  it("ignores other collections; a failing record is reported and skipped", async () => {
    const { doc, scene, binding } = await setup();
    doc.add("notes", { t: "x" });
    expect(scene.count()).toBe(0);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    doc.add("blocks", { x: 0, h: NaN }, { id: "broken" });   // MeshFactory.box throws on NaN
    doc.add("blocks", { x: 2, h: 1 }, { id: "fine" });
    expect(err.mock.calls[0][0]).toMatch(/rendering blocks\/broken failed/);
    err.mockRestore();
    expect(binding.objectsOf("fine").length).toBe(2);
  });

  it("dispose stops following and removes its objects; keys survive Scene.toJSON", async () => {
    const { doc, scene, binding } = await setup();
    doc.add("blocks", { x: 0, h: 3 }, { id: "a" });
    expect(Scene.fromJSON(scene.toJSON()).byKey("blocks/a").length).toBe(2);
    binding.dispose();
    expect(scene.count()).toBe(0);
    doc.add("blocks", { x: 1, h: 1 });
    expect(scene.count()).toBe(0);
  });
});
