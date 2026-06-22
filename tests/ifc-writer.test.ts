import { describe, it, expect } from "vitest";
import { Vec2, Vec3 } from "../src/core/math/vectors";
import { Wall, WallOpening, WallSystem } from "../src/core/geometry/walls";
import { WallType, SolidConstruction } from "../src/bim/walls";
import { Slab, SlabType, SolidSlabConstruction } from "../src/bim/slabs";
import { OpeningType } from "../src/bim/openings";
import { Space, boundingWalls } from "../src/bim/spaces";
import { Stair, StairType } from "../src/bim/stairs";
import { IfcWriter } from "../src/io/IfcWriter";

/**
 * `IfcWriter` is a STEP-21 text generator. We can't easily round-trip
 * through `IfcFile` (different schema parse depth) but we CAN assert the
 * shape of the output: required header, expected entity counts, no
 * unresolved references, proper containment in spatial structure.
 */

function countLines(ifc: string, pattern: RegExp): number {
  return ifc.split("\n").filter(l => pattern.test(l)).length;
}

function makeWallType() {
  return new WallType({
    name: "CLT 100",
    construction: SolidConstruction,
    properties: { loadBearing: true },
  });
}

describe("IfcWriter — single storey", () => {
  it("writes a STEP-21 file with the right header + DATA section", () => {
    const w = new IfcWriter({ projectName: "Test", buildingName: "B", storeyName: "Ground" });
    const out = w.save();
    expect(out.startsWith("ISO-10303-21;\n")).toBe(true);
    expect(out.includes("FILE_SCHEMA(('IFC4'));")).toBe(true);
    expect(out.includes("DATA;")).toBe(true);
    expect(out.trim().endsWith("END-ISO-10303-21;")).toBe(true);
  });

  it("creates exactly one of each spatial element when only bootstrap storey is used", () => {
    const w = new IfcWriter({});
    const out = w.save();
    expect(countLines(out, /=IFCPROJECT\(/)).toBe(1);
    expect(countLines(out, /=IFCSITE\(/)).toBe(1);
    expect(countLines(out, /=IFCBUILDING\(/)).toBe(1);
    expect(countLines(out, /=IFCBUILDINGSTOREY\(/)).toBe(1);
  });

  it("addWall emits an IfcWallStandardCase contained in the storey", () => {
    const w = new IfcWriter({});
    const type = makeWallType();
    const wall = new Wall({
      centerline: [new Vec2(0, 0), new Vec2(5, 0)],
      thickness: 0.2, height: 2.5, name: "South", type,
    });
    w.addWall(wall);
    const out = w.save();
    expect(countLines(out, /=IFCWALLSTANDARDCASE\(/)).toBe(1);
    expect(countLines(out, /=IFCRELCONTAINEDINSPATIALSTRUCTURE\(/)).toBe(1);
  });

  it("addWallSystem emits walls + at least one rel-aggregates per type", () => {
    const w = new IfcWriter({});
    const type = makeWallType();
    const walls = [
      new Wall({ centerline:[new Vec2(0,0), new Vec2(5,0)], thickness:0.2, height:2.5, name:"S", type }),
      new Wall({ centerline:[new Vec2(5,0), new Vec2(5,4)], thickness:0.2, height:2.5, name:"E", type }),
    ];
    w.addWallSystem(new WallSystem(walls), {
      includeMembers: false, includeOpenings: false,
      includeMaterials: false, includeJoints: false,
    });
    const out = w.save();
    expect(countLines(out, /=IFCWALLSTANDARDCASE\(/)).toBe(2);
    expect(countLines(out, /=IFCWALLTYPE\(/)).toBe(1);
    expect(countLines(out, /=IFCRELDEFINESBYTYPE\(/)).toBe(1);
  });

  it("addSlab emits IfcSlab + arbitrary closed profile", () => {
    const w = new IfcWriter({});
    const slabType = new SlabType({
      name: "CLT 200",
      construction: SolidSlabConstruction,
    });
    const slab = new Slab({
      boundary: [new Vec2(0,0), new Vec2(5,0), new Vec2(5,4), new Vec2(0,4), new Vec2(0,0)],
      thickness: 0.2, elevation: 0, name: "Floor", type: slabType,
    });
    w.addSlab(slab, { predefinedType: "FLOOR", includeParts: false });
    const out = w.save();
    expect(countLines(out, /=IFCSLAB\(/)).toBe(1);
    expect(countLines(out, /=IFCARBITRARYCLOSEDPROFILEDEF\(/)).toBe(1);
  });
});

describe("IfcWriter — openings (door / window types)", () => {
  it("a typed door emits IfcDoor + IfcDoorType + RelDefinesByType + Pset_DoorCommon", () => {
    const w = new IfcWriter({});
    const doorType = OpeningType.door("Entrance 1hr", {
      operation: "single_swing_left",
      properties: { fireRating: "1hr", isExternal: true },
    });
    const wall = new Wall({ centerline: [new Vec2(0, 0), new Vec2(5, 0)], thickness: 0.2, height: 2.5, name: "S" });
    const door = WallOpening.door(2.5, 1.0, 2.1);
    door.type = doorType;
    wall.openings.push(door);
    w.addWallSystem(new WallSystem([wall]), { includeMembers: false, includeJoints: false, includeMaterials: false });
    const out = w.save();
    expect(countLines(out, /=IFCDOOR\(/)).toBe(1);
    expect(countLines(out, /=IFCDOORTYPE\(/)).toBe(1);
    expect(out.includes(".SINGLE_SWING_LEFT.")).toBe(true);
    expect(countLines(out, /=IFCRELDEFINESBYTYPE\(/)).toBe(1);
    expect(out.includes("'Pset_DoorCommon'")).toBe(true);
    // Carving + filling relations still present.
    expect(countLines(out, /=IFCOPENINGELEMENT\(/)).toBe(1);
    expect(countLines(out, /=IFCRELFILLSELEMENT\(/)).toBe(1);
  });

  it("a typed window emits IfcWindow + IfcWindowType with a partitioning enum", () => {
    const w = new IfcWriter({});
    const winType = OpeningType.window("Casement", { partitioning: "double_panel_vertical", properties: { uValue: 0.9 } });
    const wall = new Wall({ centerline: [new Vec2(0, 0), new Vec2(5, 0)], thickness: 0.2, height: 2.5, name: "S" });
    const win = WallOpening.window(2.5, 1.2, 0.9, 2.2);
    win.type = winType;
    wall.openings.push(win);
    w.addWallSystem(new WallSystem([wall]), { includeMembers: false, includeJoints: false, includeMaterials: false });
    const out = w.save();
    expect(countLines(out, /=IFCWINDOW\(/)).toBe(1);
    expect(countLines(out, /=IFCWINDOWTYPE\(/)).toBe(1);
    expect(out.includes(".DOUBLE_PANEL_VERTICAL.")).toBe(true);
    expect(out.includes("'Pset_WindowCommon'")).toBe(true);
  });
});

describe("IfcWriter — spaces (rooms)", () => {
  it("addSpace emits IfcSpace aggregated under the storey with its function as LongName", () => {
    const w = new IfcWriter({});
    const room = new Space({
      name: "R101",
      boundary: [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 3), new Vec2(0, 3)],
      function: "Bedroom",
      properties: { isExternal: false },
    });
    expect(room.area()).toBeCloseTo(12, 6);
    w.addSpace(room);
    const out = w.save();
    expect(countLines(out, /=IFCSPACE\(/)).toBe(1);
    expect(out.includes("'Bedroom'")).toBe(true);
    expect(out.includes("'Pset_SpaceCommon'")).toBe(true);
    // Space is decomposed under the storey via aggregation (not containment).
    expect(out.includes(`,#${w.getDefaultStorey()},(`)).toBe(true);
  });

  it("boundingWalls detects the walls along a room outline and emits IfcRelSpaceBoundary", () => {
    const w = new IfcWriter({});
    const ext = new WallType({ name: "Ext", construction: SolidConstruction, properties: { isExternal: true } });
    // Two walls running along the south and east edges of a 4×3 room.
    const south = new Wall({ centerline: [new Vec2(0, 0), new Vec2(4, 0)], thickness: 0.2, height: 2.7, name: "S", type: ext });
    const east  = new Wall({ centerline: [new Vec2(4, 0), new Vec2(4, 3)], thickness: 0.2, height: 2.7, name: "E", type: ext });
    // A wall far away that should NOT bound the room.
    const away  = new Wall({ centerline: [new Vec2(0, 20), new Vec2(4, 20)], thickness: 0.2, height: 2.7, name: "X" });
    w.addWall(south); w.addWall(east); w.addWall(away);

    const room = new Space({ name: "R1", boundary: [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 3), new Vec2(0, 3)] });
    const bounds = boundingWalls(room, [south, east, away]);
    expect(bounds).toContain(south);
    expect(bounds).toContain(east);
    expect(bounds).not.toContain(away);

    w.addSpace(room, { boundaries: bounds });
    const out = w.save();
    expect(countLines(out, /=IFCRELSPACEBOUNDARY\(/)).toBe(2);
    // External walls → EXTERNAL boundary flag.
    expect(out.includes(".PHYSICAL.,.EXTERNAL.)")).toBe(true);
  });
});

describe("IfcWriter — stairs", () => {
  it("addStair emits IfcStair aggregating a tessellated IfcStairFlight", () => {
    const w = new IfcWriter({});
    const stairType = new StairType({ name: "RC stair", shape: "straight_run", material: "Concrete" });
    const stair = new Stair({
      name: "ST1",
      start: new Vec3(0, 0, 0),
      direction: new Vec2(1, 0),
      width: 1.1,
      totalRise: 3.0,
      type: stairType,
      properties: { fireExit: true },
    });
    // 3.0 / 0.18 ≈ 17 risers.
    expect(stair.risers).toBe(17);
    w.addStair(stair);
    const out = w.save();
    expect(countLines(out, /=IFCSTAIR\(/)).toBe(1);
    expect(countLines(out, /=IFCSTAIRFLIGHT\(/)).toBe(1);
    expect(countLines(out, /=IFCSTAIRTYPE\(/)).toBe(1);
    expect(countLines(out, /=IFCTRIANGULATEDFACESET\(/)).toBe(1);
    expect(out.includes(".STRAIGHT_RUN.")).toBe(true);
    expect(out.includes("'Pset_StairCommon'")).toBe(true);
    // Contained in storey + aggregates the flight.
    expect(countLines(out, /=IFCRELCONTAINEDINSPATIALSTRUCTURE\(/)).toBe(1);
  });
});

describe("IfcWriter — multi-storey", () => {
  it("addStorey returns a new ref + the file shows N+1 storeys", () => {
    const w = new IfcWriter({ storeyName: "Ground" });
    const s1 = w.addStorey({ name: "First",  elevation: 3.0 });
    const s2 = w.addStorey({ name: "Second", elevation: 6.0 });
    expect(s1).not.toBe(s2);
    expect(s1).not.toBe(w.getDefaultStorey());
    const out = w.save();
    expect(countLines(out, /=IFCBUILDINGSTOREY\(/)).toBe(3);
  });

  it("elements are routed to the storey passed in opts.storey", () => {
    const w = new IfcWriter({});
    const ground = w.getDefaultStorey();
    const first  = w.addStorey({ name: "First", elevation: 3.0 });

    const type = makeWallType();
    const wG = new Wall({ centerline:[new Vec2(0,0), new Vec2(5,0)], thickness:0.2, height:2.5, name:"S0", type });
    const wF = new Wall({ centerline:[new Vec2(0,0), new Vec2(5,0)], thickness:0.2, height:2.5, name:"S1", type, baseElevation: 3.0 });
    w.addWall(wG, { storey: ground });
    w.addWall(wF, { storey: first  });

    const out = w.save();
    // One containment relation per storey that has elements.
    expect(countLines(out, /=IFCRELCONTAINEDINSPATIALSTRUCTURE\(/)).toBe(2);
  });

  it("rejects unknown storey refs with a helpful error", () => {
    const w = new IfcWriter({});
    const type = makeWallType();
    const wall = new Wall({ centerline:[new Vec2(0,0), new Vec2(5,0)], thickness:0.2, height:2.5, name:"S", type });
    expect(() => w.addWall(wall, { storey: 99999 })).toThrowError(/unknown storey ref/i);
  });
});
