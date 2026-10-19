/**
 * A building as data: records → elements, checks by record, IFC, and a scene kept in step.
 */
import { describe, it, expect, vi } from "vitest";
import {
  realizeBuilding, validateBuilding, bindBuilding, buildingSchema, BUILDING_SCHEMA, type Building, type BuildingData, type BuildingRecords,
} from "../src/bim/building";
import { checkRecord } from "../src/collab/recordSchema";
import { PolygonBool } from "../src/core/geometry/PolygonBool";
import { Polygon2D } from "../src/core/geometry/Polygon2D";
import type { Vec2 } from "../src/core/math/vectors";
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
      d2: { wall: "p2", kind: "door", at: 3, width: 0.9 }, w4: { wall: "w", kind: "window", at: 2, width: 1.2 },
      d3: { wall: "q1", kind: "door", at: 2, width: 0.9 },
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
      ["eg", 6, 6, 1, 3], ["og", 6, 2, 2, 1],
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

  it("asks for a way into every room, and daylight in the ones people stay in", () => {
    const data = house();
    delete data.openings!.d3;                                     // the upper bedroom's only door
    delete data.openings!.w4;                                     // the study's only window
    const codes = realizeBuilding(data).check().map((i) => `${i.code} ${i.keys.join(" ")}`);
    expect(codes).toEqual(["space-no-window spaces/study"]);       // one room upstairs needs no door to reach it
    data.spaces!.bath = { storey: "og", name: "Bath", boundary: rect(0, 0, 5, 4), use: "bath" };
    expect(realizeBuilding(data).check().map((i) => `${i.code} ${i.keys.join(" ")}`)).toEqual([
      "space-no-window spaces/study", "space-no-door spaces/bed", "space-no-door spaces/bath",
    ]);
  });

  it("names the types a record may take in the schema", () => {
    const wallType = buildingSchema().walls.properties!.type;
    expect(wallType.enum).toEqual(["exterior", "interior", "solid"]);
    expect(wallType.description).toMatch(/"interior": Partition, timber frame, 0\.13 m thick/);
    expect(checkRecord({ storey: "eg", path: [[0, 0], [1, 0]], type: "brick" }, buildingSchema().walls)[0].message)
      .toBe('expected one of "exterior", "interior", "solid", got "brick"');
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
    expect(count("IFCDOOR")).toBe(4);
    expect(count("IFCWINDOW")).toBe(4);
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

describe("check() on a generated storey", () => {
  /** A random number generator that gives the same numbers every run. */
  const random = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /**
   * Cells of a jittered grid, side × side, about 5 m across, as a Voronoi plan makes them: each
   * cell a room, a wall on each edge, a door in each inner wall and a window in each outer one.
   */
  function cells(side: number): BuildingData {
    const rnd = random(7);
    const at = Array.from({ length: side + 1 }, (_, i) => Array.from({ length: side + 1 }, (_, j): [number, number] => {
      const edge = i === 0 || j === 0 || i === side || j === side;
      return [i * 5 + (edge ? 0 : (rnd() - 0.5) * 2.4), j * 5 + (edge ? 0 : (rnd() - 0.5) * 2.4)];
    }));
    const data: Required<Pick<BuildingData, "storeys" | "spaces" | "walls" | "openings">> = {
      storeys: { eg: { name: "Ground floor", elevation: 0, height: 3.5 } }, spaces: {}, walls: {}, openings: {},
    };
    for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) {
      data.spaces[`c${i}_${j}`] = { storey: "eg", name: `Cell ${i},${j}`, use: "hall", boundary: [at[i][j], at[i + 1][j], at[i + 1][j + 1], at[i][j + 1]] };
    }
    const wall = (id: string, a: [number, number], b: [number, number], outer: boolean) => {
      data.walls[id] = { storey: "eg", path: [a, b], type: outer ? "exterior" : "interior" };
      data.openings[id] = { wall: id, kind: outer ? "window" : "door", at: Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, width: 0.9 };
    };
    for (let i = 0; i <= side; i++) for (let j = 0; j < side; j++) {
      wall(`v${i}_${j}`, at[i][j], at[i][j + 1], i === 0 || i === side);
      wall(`h${j}_${i}`, at[j][i], at[j + 1][i], i === 0 || i === side);
    }
    return data;
  }

  it("checks 900 rooms with their walls and doors in well under a second, each room against its neighbours", () => {
    const b = realizeBuilding(cells(30));
    expect(b.storey("eg")!.spaces.size).toBe(900);
    const intersections = vi.spyOn(PolygonBool, "intersection");
    const t0 = performance.now();
    const issues = b.check();
    const ms = performance.now() - t0;
    const compared = intersections.mock.calls.length;
    intersections.mockRestore();
    expect(issues).toEqual([]);
    expect(compared).toBeLessThanOrEqual(4 * 900);        // up to 8 neighbours each, not all 404 550 pairs
    expect(ms).toBeLessThan(1000);                        // ~50 ms; comparing every pair took 1–1.5 s
  });

  /** Distance from a point to a polyline. */
  const distance = (p: Vec2, line: Vec2[]) => Math.min(...line.slice(1).map((b, i) => {
    const a = line[i], ab = b.sub(a);
    const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / ab.dot(ab)));
    return p.distTo(a.add(ab.mul(t)));
  }));

  /** What check() says about wall ends and rooms, worked out by comparing every pair. */
  function everyPair(b: Building): string[] {
    const out: string[] = [];
    for (const s of b.storeys) {
      const walls = [...s.walls];
      for (const [id, wall] of walls) {
        const cl = wall.centerline;
        for (const end of wall.isClosedPolyline ? [] : [cl[0], cl[cl.length - 1]]) {
          const met = walls.some(([oid, other]) => oid !== id && distance(end, other.centerline) <= (other.thickness + wall.thickness) / 2 + 0.05);
          if (!met) out.push(`wall-end-free walls/${id}`);
        }
      }
      const spaces = [...s.spaces];
      const onOutline = (boundary: Vec2[], door: boolean) => walls.some(([, wall]) => wall.openings.some((o) => {
        const at = wall.centerline[0].lerp(wall.centerline[1], o.centerlinePosition / wall.length);   // straight walls
        return (o.type!.kind === "door") === door && distance(at, Polygon2D.closeRing(boundary)) <= wall.thickness / 2 + 0.05;
      }));
      for (const [id, sp] of spaces) {
        if (spaces.length > 1 && !onOutline(sp.boundary, true)) out.push(`space-no-door spaces/${id}`);
        if (sp.function === "office" && !onOutline(sp.boundary, false)) out.push(`space-no-window spaces/${id}`);
      }
      for (let i = 0; i < spaces.length; i++) for (let j = i + 1; j < spaces.length; j++) {
        const shared = PolygonBool.area(PolygonBool.intersection(PolygonBool.fromRing(spaces[i][1].boundary), PolygonBool.fromRing(spaces[j][1].boundary)));
        if (shared > 0.05) out.push(`spaces-overlap spaces/${spaces[i][0]} spaces/${spaces[j][0]}`);
      }
    }
    return out;
  }

  it("finds what comparing every pair finds, in the same order", () => {
    const rnd = random(11);
    const data: Required<Pick<BuildingData, "storeys" | "spaces" | "walls" | "openings">> = {
      storeys: { eg: { name: "Ground floor", elevation: 0, height: 3 } }, spaces: {}, walls: {}, openings: {},
    };
    // Rooms that overlap, touch along an edge or at a corner (on a 1 m grid), or turn.
    for (let k = 0; k < 40; k++) {
      const cx = rnd() * 30, cy = rnd() * 30, w = 1 + rnd() * 7, h = 1 + rnd() * 7, turn = rnd() < 0.5 ? 0 : rnd() * Math.PI;
      const c = Math.cos(turn), s = Math.sin(turn), grid = turn === 0 && rnd() < 0.6;
      const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
        .map(([x, y]): [number, number] => [cx + x * c - y * s, cy + x * s + y * c])
        .map(([x, y]): [number, number] => grid ? [Math.round(x), Math.round(y)] : [x, y]);
      data.spaces[`r${k}`] = { storey: "eg", name: `Room ${k}`, use: k % 2 ? "office" : "hall", boundary: corners };
    }
    // Straight walls on the same grid, some meeting, each with a door or a window halfway.
    for (let k = 0; k < 40; k++) {
      const x = Math.round(rnd() * 30), y = Math.round(rnd() * 30), length = 2 + Math.round(rnd() * 6);
      data.walls[`w${k}`] = { storey: "eg", path: rnd() < 0.5 ? [[x, y], [x + length, y]] : [[x, y], [x, y + length]], type: rnd() < 0.5 ? "interior" : "exterior" };
      data.openings[`o${k}`] = { wall: `w${k}`, kind: rnd() < 0.5 ? "door" : "window", at: length / 2, width: 0.8 };
    }
    // And along the first edge of every third room, so some doors and windows are on an outline.
    for (let k = 0; k < 40; k += 3) {
      const [a, b] = data.spaces[`r${k}`].boundary;
      data.walls[`e${k}`] = { storey: "eg", path: [a, b], type: "interior" };
      data.openings[`e${k}`] = { wall: `e${k}`, kind: k % 2 ? "window" : "door", at: Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, width: 0.8 };
    }
    const b = realizeBuilding(data);
    const codes = new Set(["wall-end-free", "space-no-door", "space-no-window", "spaces-overlap"]);
    const found = b.check().filter((i) => codes.has(i.code)).map((i) => `${i.code} ${i.keys.join(" ")}`);
    const expected = everyPair(b);
    expect(found).toEqual(expected);
    // Each check finds some here and passes some: 54 walls, 40 rooms, 20 of them offices.
    const count = (code: string) => expected.filter((e) => e.startsWith(`${code} `)).length;
    expect(count("spaces-overlap")).toBeGreaterThan(10);
    expect(count("wall-end-free")).toBeGreaterThan(10);
    expect(count("wall-end-free")).toBeLessThan(2 * 54 - 10);
    expect(count("space-no-door")).toBeGreaterThan(10);
    expect(count("space-no-door")).toBeLessThan(40 - 5);
    expect(count("space-no-window")).toBeGreaterThan(5);
    expect(count("space-no-window")).toBeLessThan(20 - 5);
  });
});
