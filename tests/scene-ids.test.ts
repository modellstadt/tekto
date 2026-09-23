import { describe, it, expect } from "vitest";
import { Scene } from "../src/scene/Scene";
import { Vec3 } from "../src/core/math/vectors";

/** Ids must be stable across clear(): that is what lets a sketch re-run keep
 *  its selection (highlight + transform gizmo) attached to the same object. */
describe("Scene ids", () => {
  const build = (s: Scene) => [
    s.addPoint(new Vec3(0, 0, 0)).id,
    s.addSegment(new Vec3(0, 0, 0), new Vec3(1, 0, 0)).id,
    s.addCircle(new Vec3(0, 0, 0), 1).id,
  ];

  it("repeat after clear(): same content, same ids", () => {
    const scene = new Scene();
    const first = build(scene);
    scene.clear();
    const second = build(scene);
    expect(second).toEqual(first);
  });

  it("are unique within one run", () => {
    const scene = new Scene();
    const ids = [...build(scene), ...build(scene)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("are per scene, not global", () => {
    expect(build(new Scene())).toEqual(build(new Scene()));
  });

  it("restored objects keep their ids, and new ones don't collide", () => {
    const scene = new Scene();
    build(scene);
    const restored = Scene.fromJSON(JSON.parse(JSON.stringify(scene.toJSON())));
    const ids = restored.all().map((o) => o.id);
    const added = restored.addPoint(new Vec3(1, 1, 1)).id;
    expect(ids).not.toContain(added);
  });
});
