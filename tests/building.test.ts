/**
 * A building as data: records → elements, checks by record, IFC, and a scene kept in step.
 */
import { describe, it, expect } from "vitest";
import {
  realizeBuilding, validateBuilding, bindBuilding, BUILDING_SCHEMA, type BuildingData, type BuildingRecords,
} from "../src/bim/building";
import { checkRecord } from "../src/collab/recordSchema";
import { Doc } from "../src/collab/Doc";
import { Scene } from "../src/scene/Scene";

const rect = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** Two storeys, 10 × 8 m: four outside walls and two partitions each, a stair well, a flat roof. */
function house(): BuildingData {
  return {
    storeys: { eg: { name: "Ground floor", elevation: 0, height: 2.9 }, og: { name: "Upper floor", elevation: 2.9, height: 2.8 } },
    slabs: {
      base: { storey: "eg", boundary: rect(-0.15, -0.15, 10.15, 8.15), type: "ground" },
      floor: { storey: "og", boundary: rect(-0.15, -0.15, 10.15, 8.15), openings: [{ x: 1.6, y: 6.6, width: 2.8, depth: 1.1, name: "Stair" }] },
      roof: { storey: "og", boundary: rect(-0.15, -0.15, 10.15, 8.15), level: "top", type: "roof" },
    },
    walls: {
      s: { storey: "eg", path: [[0, 0], [10, 0]] }, e: { storey: "eg", path: [[10, 0], [10, 8]] },
      n: { storey: "eg", path: [[10, 8], [0, 8]] }, w: { storey: "eg", path: [[0, 8], [0, 0]] },
      p1: { storey: "eg", path: [[6, 0], [6, 8]], type: "interior" }, p2: { storey: "eg", path: [[0, 4.5], [6, 4.5]], type: "interior" },
      s2: { storey: "og", path: [[0, 0], [10, 0]] }, e2: { storey: "og", path: [[10, 0], [10, 8]] },
      n2: { storey: "og", path: [[10, 8], [0, 8]] }, w2: { storey: "og", path: [[0, 8], [0, 0]] },
      q1: { storey: "og", path: [[5, 0], [5, 8]], type: "interior" }, q2: { storey: "og", path: [[5, 4], [10, 4]], type: "interior" },
    },
    openings: {
      entry: { wall: "s", kind: "door", at: 3, width: 1 }, w1: { wall: "s", kind: "window", at: 8, width: 1.6 },
      w2: { wall: "e", kind: "window", at: 4, width: 2 }, d1: { wall: "p1", kind: "door", at: 2, width: 0.9 },
      w3: { wall: "s2", kind: "window", at: 7.5, width: 1.2 },
    },
    spaces: {
      hall: { storey: "eg", name: "Hall", boundary: rect(0, 0, 6, 4.5), use: "hall" },
      study: { storey: "eg", name: "Study", boundary: rect(0, 4.5, 6, 8), use: "office" },
      living: { storey: "eg", name: "Living", boundary: rect(6, 0, 10, 8), use: "living" },
      bed: { storey: "og", name: "Bedroom", boundary: rect(5, 0, 10, 4), use: "bedroom" },
    },
  };
}

describe("checkRecord", () => {
  const schema = BUILDING_SCHEMA.openings;
  it("names the path, what it expected and what it got", () => {
    expect(checkRecord({ wall: "s", kind: "gate", at: "3", width: 0, colour: "red" }, schema).map((i) => `${i.path}: ${i.message}`)).toEqual([
      'kind: expected one of "door", "window", got "gate"',
      'at: expected a number, got "3"',
      "width: must be more than 0, got 0",
      "colour: is not a property here (known: wall, kind, at, width, sill, head, type, name)",
    ]);
    expect(checkRecord({ kind: "door", at: 1, width: 1 }, schema)).toEqual([{ path: "wall", message: "is required" }]);
    expect(checkRecord({ storey: "eg", path: [[0, 0], [1]] }, BUILDING_SCHEMA.walls)).toEqual([{ path: "path[1]", message: "needs at least 2 items, got 1" }]);
  });
});

describe("validateBuilding", () => {
  it("finds broken references, unknown types and degenerate geometry, by record", () => {
    const issues = validateBuilding({
      storeys: { eg: { name: "EG", elevation: 0, height: 3 } },
      walls: { a: { storey: "og", path: [[0, 0], [1, 0]] }, b: { storey: "eg", path: [[0, 0], [0, 0]], type: "brick" } },
      openings: { o: { wall: "x", kind: "door", at: 1, width: 1 } },
    });
    expect(issues.map((i) => `${i.code} ${i.keys.join()}`)).toEqual([
      "unknown-storey walls/a", "unknown-type walls/b", "zero-length walls/b", "unknown-wall openings/o",
    ]);
    expect(issues[1].message).toContain('wall type "brick" is not defined (defined: exterior, interior, solid)');
  });
});

describe("realizeBuilding", () => {
  const b = realizeBuilding(house());

  it("builds every record of a sound house, and finds nothing wrong with it", () => {
    expect(b.check()).toEqual([]);
    expect(b.storeys.map((s) => [s.id, s.walls.size, s.openings.size, s.slabs.size, s.spaces.size])).toEqual([
      ["eg", 6, 4, 1, 3], ["og", 6, 1, 2, 1],
    ]);
    expect(b.areas().total).toBeCloseTo(27 + 21 + 32 + 20, 6);
    expect(b.levels()).toEqual([{ name: "Ground floor", elevation: 0 }, { name: "Upper floor", elevation: 2.9 }]);
  });

  it("stands walls on their storey and runs them up to the underside of the floor above", () => {
    const eg = b.storey("eg")!, og = b.storey("og")!;
    expect(eg.walls.get("s")!.baseElevation).toBe(0);
    expect(eg.walls.get("s")!.height).toBeCloseTo(2.9 - 0.26, 9);    // the joisted floor above
    expect(og.walls.get("s2")!.height).toBeCloseTo(2.8 - 0.3, 9);    // the flat roof on top
    expect(og.slabs.get("roof")!.elevation).toBeCloseTo(5.7, 9);
    expect(eg.walls.get("p1")!.thickness).toBeCloseTo(0.125, 9);
  });

  it("turns a slab opening's world X/Y size into the joists' frame", () => {
    const floor = b.storey("og")!.slabs.get("floor")!;
    const ring = floor.openingRings()[0];
    const xs = ring.map((p) => p.x), ys = ring.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2.8, 9);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(1.1, 9);
  });

  it("checks openings, wall ends, storeys and rooms, naming the records", () => {
    const data = house();
    data.openings!.out = { wall: "e", kind: "window", at: 7.8, width: 1 };           // past the wall's end
    data.openings!.lap = { wall: "s", kind: "window", at: 3.4, width: 1 };           // over the entry door
    data.openings!.tall = { wall: "e2", kind: "window", at: 2, width: 1, head: 2.6 }; // above a 2.5 m wall
    data.walls!.free = { storey: "eg", path: [[7, 2], [8, 2]], type: "interior" };
    data.spaces!.bad = { storey: "eg", name: "Nook", boundary: rect(5, 1, 7, 2), use: "storage" };
    data.storeys!.og.elevation = 3;
    const codes = realizeBuilding(data).check().map((i) => `${i.severity} ${i.code} ${i.keys.join(" ")}`);
    expect(codes).toEqual(expect.arrayContaining([
      "warning storey-gap storeys/eg storeys/og",
      "error opening-outside-wall openings/out walls/e",
      "error openings-overlap openings/entry openings/lap",
      "error opening-above-wall openings/tall walls/e2",
      "warning wall-end-free walls/free",
      "warning spaces-overlap spaces/hall spaces/bad",
      "warning spaces-overlap spaces/living spaces/bad",
    ]));
  });

  it("leaves out what cannot be built and says why", () => {
    const data = house();
    data.slabs!.floor.openings = [{ x: 20, y: 20, width: 1, depth: 1 }];
    const built = realizeBuilding(data);
    expect(built.storey("og")!.slabs.has("floor")).toBe(false);
    expect(built.issues).toEqual([expect.objectContaining({ code: "build-failed", keys: ["slabs/floor"] })]);
    expect(built.issues[0].message).toContain("not inside the slab's boundary");
  });

  it("writes an IFC file with a storey each, walls, openings, slabs and spaces", () => {
    const ifc = b.toIfc({ projectName: "Test house", members: false });
    const count = (t: string) => (ifc.match(new RegExp(`=${t}\\(`, "g")) ?? []).length;
    expect(count("IFCBUILDINGSTOREY")).toBe(2);
    expect(count("IFCWALLSTANDARDCASE")).toBe(12);
    expect(count("IFCDOOR")).toBe(2);
    expect(count("IFCWINDOW")).toBe(3);
    expect(count("IFCSLAB")).toBe(3);
    expect(count("IFCSPACE")).toBe(4);
  });
});

describe("roofs and stairs as records", () => {
  /** The test house with a gable roof on the upper walls (no flat roof) and a half-turn stair. */
  function roofed(): BuildingData {
    const data = house();
    delete data.slabs!.roof;
    delete data.slabs!.floor.openings;
    data.roofs = { r: { storey: "og", kind: "gable", pitch: 35, footprint: rect(-0.125, -0.125, 10.125, 8.125) } };
    data.stairs = { st: { storey: "eg", at: [0.6, 7.3], shape: "half_turn", turn: "right" } };
    return data;
  }

  it("sits the roof on the walls and cuts the stair's well in the floor it reaches", () => {
    const b = realizeBuilding(roofed());
    expect(b.check()).toEqual([]);
    const og = b.storey("og")!, eg = b.storey("eg")!;
    expect(og.walls.get("s2")!.height).toBeCloseTo(2.8, 9);                    // no slab above now
    const roof = og.roofs.get("r")!;
    expect(roof.ridge()!.a.y).toBeCloseTo(4, 6);                               // ridge along the first (south) edge
    expect(roof.gables(b.gableThickness(og))).toHaveLength(2);
    const stair = eg.stairs.get("st")!;
    expect(stair.risers).toBe(16);                                             // 2.9 m in risers near 0.18
    const well = og.slabs.get("floor")!.openingRings()[0];
    const xs = well.map((p) => p.x), ys = well.map((p) => p.y);
    expect([Math.min(...xs), Math.max(...xs)].map((v) => +v.toFixed(2))).toEqual([0.6, 3.49]);
    expect([Math.min(...ys), Math.max(...ys)].map((v) => +v.toFixed(2))).toEqual([5.7, 7.8]);
  });

  it("checks the step and reports a well outside the floor", () => {
    const data = roofed();
    data.stairs!.st = { storey: "eg", at: [0.6, 7.3], shape: "half_turn", turn: "right", riser: 0.22, going: 0.22 };
    data.stairs!.out = { storey: "eg", at: [9.5, 7.6], direction: [0, 1] };   // runs out of the house
    const issues = realizeBuilding(data).check().map((i) => `${i.severity} ${i.code} ${i.keys.join(" ")}`);
    expect(issues).toEqual(expect.arrayContaining([
      "warning stair-step stairs/st",
      "error stair-well stairs/out slabs/floor",
    ]));
  });

  it("writes the roof and the stair to IFC", () => {
    const ifc = realizeBuilding(roofed()).toIfc({ members: false });
    expect(ifc).toContain("=IFCROOF(");
    expect(ifc).toContain("=IFCSTAIR(");
    expect((ifc.match(/=IFCSTAIRFLIGHT\(/g) ?? []).length).toBe(2);
  });
});

describe("bindBuilding", () => {
  it("draws each record under its key and rebuilds when the document changes", async () => {
    const doc = new Doc<BuildingRecords>({ name: "house-test" });
    const data = house();
    doc.transact("Build house", () => {
      for (const [c, rows] of Object.entries(data)) for (const [id, rec] of Object.entries(rows!)) doc.add(c as keyof BuildingRecords, rec as never, { id });
    });
    const scene = new Scene();
    const binding = bindBuilding(doc, scene);
    expect(binding.issues).toEqual([]);
    const keys = new Set(scene.all().map((o) => o.key));
    for (const k of ["walls/s", "openings/entry", "slabs/floor", "spaces/living"]) expect(keys.has(k)).toBe(true);
    const wallObject = binding.objectsOf("walls/s")[0];
    expect(binding.recordOf(wallObject)).toBe("walls/s");

    const builds: number[] = [];
    binding.onBuild((_, issues) => builds.push(issues.length));
    doc.add("openings", { wall: "s", kind: "window", at: 9.9, width: 1 }, { id: "late" });
    doc.update("walls", "n", { path: [[10, 8], [0.5, 8]] });
    expect(builds).toEqual([0]);                          // one build per turn, after it
    await Promise.resolve();
    expect(builds.length).toBe(2);
    expect(binding.issues.map((i) => i.code)).toContain("opening-outside-wall");
    binding.dispose();
    expect(scene.all().filter((o) => o.key?.startsWith("walls/")).length).toBe(0);
  });
});
