import { describe, it, expect } from "vitest";
import { Vec2, Vec3 } from "../src/core/math/vectors";
import { Wall, WallOpening, WallSystem } from "../src/core/geometry/walls";
import { WallType, SolidConstruction } from "../src/bim/walls";
import { Slab, SlabType, SolidSlabConstruction } from "../src/bim/slabs";
import { OpeningType } from "../src/bim/openings";
import { Space, boundingWalls } from "../src/bim/spaces";
import { Stair, StairType } from "../src/bim/stairs";
import { Roof } from "../src/bim/roofs";
import { IfcWriter, standardPropertyName } from "../src/io/IfcWriter";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";

/**
 * `IfcWriter` is a STEP-21 text generator. We can't easily round-trip
 * through `IfcFile` (different schema parse depth) but we CAN assert the
 * shape of the output: required header, expected entity counts, no
 * unresolved references, proper containment in spatial structure.
 */

function countLines(ifc: string, pattern: RegExp): number {
  return ifc.split("\n").filter(l => pattern.test(l)).length;
}

/** The arguments of a STEP entity, split at its top-level commas. */
function stepArgs(line: string): string[] {
  const body = line.slice(line.indexOf("(") + 1, line.lastIndexOf(")"));
  const out: string[] = [];
  let depth = 0, quoted = false, start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === "'") quoted = !quoted;
    else if (!quoted && c === "(") depth++;
    else if (!quoted && c === ")") depth--;
    else if (!quoted && depth === 0 && c === ",") { out.push(body.slice(start, i)); start = i + 1; }
  }
  out.push(body.slice(start));
  return out;
}

/**
 * World z of the first `entity`'s placement: its IfcLocalPlacement chain followed to the
 * root, adding each IfcAxis2Placement3D's z (every placement the writer makes keeps +Z up).
 */
function placementZ(ifc: string, entity: string): number {
  const lines = new Map<string, string>();
  for (const l of ifc.split("\n")) { const m = /^(#\d+)=(.*);$/.exec(l); if (m) lines.set(m[1], m[2]); }
  const element = [...lines.values()].find(l => l.startsWith(entity + "("));
  if (!element) throw new Error(`no ${entity} in the file`);
  let z = 0;
  let ref: string | undefined = stepArgs(element)[5];          // ObjectPlacement
  while (ref && ref !== "$") {
    const [parent, axis] = stepArgs(lines.get(ref)!);           // IFCLOCALPLACEMENT(parent, axis)
    const point = stepArgs(lines.get(axis)!)[0];                 // IFCAXIS2PLACEMENT3D(location, …)
    z += Number(/\(\((.*)\)\)/.exec(lines.get(point)!)![1].split(",")[2]);
    ref = parent;
  }
  return z;
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
    expect(out.includes(".STRAIGHT_RUN_STAIR.")).toBe(true);
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

  it("an element on an upper storey is as high in the file as in the model, not a storey higher", () => {
    // Heights in the API are absolute; the storey's placement is already raised to its
    // elevation, so the writer subtracts it. Read back by following the placements.
    const w = new IfcWriter({ storeyElevation: 0.5 });
    const first = w.addStorey({ name: "First", elevation: 3 });
    const wall = new Wall({ centerline: [new Vec2(0, 0), new Vec2(4, 0)], thickness: 0.2, height: 2.5, name: "W1", baseElevation: 3 });
    wall.openings.push(WallOpening.window(2, 1.2, 0.9, 2.1));
    w.addWallSystem(new WallSystem([wall]), { storey: first, includeMembers: false, includeJoints: false, includeMaterials: false });
    w.addSlab(new Slab({ boundary: [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 3), new Vec2(0, 3)], thickness: 0.2, elevation: 3, name: "F1" }),
      { storey: first, includeParts: false });
    w.addSpace(new Space({ name: "R1", boundary: [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 3), new Vec2(0, 3)], elevation: 3 }), { storey: first });
    // A member's mesh is in world coordinates (a stud from 0.5 to 3 m): nothing is added to it.
    const stud = MeshFactory.box(0.06, 0.12, 2.5);
    stud.translate(1, 0, 0.5 + 1.25);
    w.addMember(0, { name: "Stud", role: "stud", mesh: stud });
    const out = w.save();

    expect(placementZ(out, "IFCWALLSTANDARDCASE")).toBeCloseTo(3, 9);
    expect(placementZ(out, "IFCOPENINGELEMENT")).toBeCloseTo(3 + 0.9, 9);
    expect(placementZ(out, "IFCSLAB")).toBeCloseTo(3 - 0.2, 9);
    expect(placementZ(out, "IFCSPACE")).toBeCloseTo(3, 9);
    expect(placementZ(out, "IFCMEMBER")).toBeCloseTo(0, 9);
  });

  it("rejects unknown storey refs with a helpful error", () => {
    const w = new IfcWriter({});
    const type = makeWallType();
    const wall = new Wall({ centerline:[new Vec2(0,0), new Vec2(5,0)], thickness:0.2, height:2.5, name:"S", type });
    expect(() => w.addWall(wall, { storey: 99999 })).toThrowError(/unknown storey ref/i);
  });
});

describe("IfcWriter — roofs and loose elements", () => {
  /** The refs a storey's containment relation lists, or [] if it has none. */
  const containedIn = (ifc: string, storey: number): number[] => {
    const line = ifc.split("\n").find(l => l.includes("=IFCRELCONTAINEDINSPATIALSTRUCTURE(") && l.endsWith(`,#${storey});`));
    return line ? [...stepArgs(line)[4].matchAll(/#(\d+)/g)].map(m => Number(m[1])) : [];
  };

  it("a member given a storey is contained in it; one without stays a part", () => {
    const w = new IfcWriter({});
    const first = w.addStorey({ name: "First", elevation: 3 });
    const rail = w.addMember(0, { name: "Railing", role: "railing", mesh: MeshFactory.box(2, 0.05, 1), ifcType: "IfcRailing" }, { storey: first });
    const stud = w.addMember(0, { name: "Stud", role: "stud", mesh: MeshFactory.box(0.06, 0.12, 2.5) });
    const out = w.save();
    expect(out).toContain(`#${rail}=IFCRAILING(`);
    expect(containedIn(out, first)).toEqual([rail]);
    expect(containedIn(out, w.getDefaultStorey())).not.toContain(stud);
  });

  it("addRoof gathers its parts and is contained in the storey in their place", () => {
    const w = new IfcWriter({});
    const top = w.addStorey({ name: "Roof", elevation: 6 });
    const deck = w.addSlab(new Slab({ boundary: [new Vec2(0, 0), new Vec2(4, 0), new Vec2(4, 3), new Vec2(0, 3)], thickness: 0.2, elevation: 6.2, name: "Deck" }),
      { predefinedType: "ROOF", storey: top, includeParts: false });
    const rafter = w.addMember(0, { name: "Rafter", role: "rafter", mesh: MeshFactory.box(0.08, 4, 0.2) }, { storey: top });
    const roof = w.addRoof([deck, rafter], { name: "Gable", storey: top, predefinedType: "GABLE_ROOF" });
    const out = w.save();
    expect(out).toMatch(new RegExp(`#${roof}=IFCROOF\\('[^']+',#\\d+,'Gable',\\$,\\$,#\\d+,\\$,\\$,\\.GABLE_ROOF\\.\\);`));
    expect(out).toMatch(new RegExp(`=IFCRELAGGREGATES\\([^;]*,#${roof},\\(#${deck},#${rafter}\\)\\);`));
    expect(containedIn(out, top)).toEqual([roof]);
  });

  it("a roof needs parts this writer wrote", () => {
    const w = new IfcWriter({});
    expect(() => w.addRoof([])).toThrow(/at least one part/);
    expect(() => w.addRoof([w.getDefaultStorey()])).toThrow(/not a slab or member/);
    expect(() => w.addMember(0, { name: "x", role: "x", mesh: MeshFactory.box(1, 1, 1) }, { storey: 99999 })).toThrow(/unknown storey ref/);
  });

  it("addRoof(roof) writes an IfcRoof gathering a ROOF slab per plane, and the gables as walls of the storey", () => {
    const w = new IfcWriter({});
    const top = w.addStorey({ name: "Attic", elevation: 6 });
    const roof = new Roof({
      kind: "gable", name: "Main roof", pitch: 40, eavesElevation: 6, thickness: 0.3,
      footprint: [new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 8), new Vec2(0, 8)], properties: { fireRating: "REI30" },
    });
    const roofRef = w.addRoof(roof, { storey: top, gableThickness: 0.3 });
    const out = w.save();
    expect(out).toMatch(new RegExp(`#${roofRef}=IFCROOF\\('[^']+',#\\d+,'Main roof',\\$,\\$,#\\d+,\\$,\\$,\\.GABLE_ROOF\\.\\);`));
    const slabs = [...out.matchAll(/#(\d+)=IFCSLAB\([^;]*'Main roof plane \d'[^;]*,#\d+,\$,\.ROOF\.\);/g)].map(m => Number(m[1]));
    expect(slabs).toHaveLength(2);
    expect(out).toMatch(new RegExp(`=IFCRELAGGREGATES\\([^;]*,#${roofRef},\\(${slabs.map(s => `#${s}`).join(",")}\\)\\);`));
    expect(countLines(out, /=IFCTRIANGULATEDFACESET\(/)).toBe(4);   // two slabs, two gables
    const walls = [...out.matchAll(/#(\d+)=IFCWALL\('[^']+',#\d+,'Main roof gable \d',\$,'gable',/g)].map(m => Number(m[1]));
    expect(walls).toHaveLength(2);
    expect(containedIn(out, top)).toEqual([roofRef, ...walls]);
    expect(out).toMatch(/IFCPROPERTYSET\('[^']+',#\d+,'Pset_RoofCommon'/);
    expect(out).toContain("IFCPROPERTYSINGLEVALUE('FireRating',$,IFCTEXT('REI30'),$)");
    expect(out).toContain("IFCPROPERTYSINGLEVALUE('IsExternal',$,IFCBOOLEAN(.T.),$)");
    // a hip roof has four planes and no gables, with or without a gable thickness
    const hip = new IfcWriter({});
    hip.addRoof(new Roof({ ...roof, kind: "hip" }), { gableThickness: 0.3 });
    const hipOut = hip.save();
    expect(hipOut).toContain(".HIP_ROOF.");
    expect(countLines(hipOut, /=IFCSLAB\(.*\.ROOF\.\);/)).toBe(4);
    expect(countLines(hipOut, /=IFCWALL\(/)).toBe(0);
  });
});

describe("standard property sets carry standard property names", () => {
  it("spells the IFC name inside a Pset_, and leaves a custom set alone", () => {
    // Pset_WallCommon is not a free-form bag. Every consumer asks for
    // IsExternal; a file that declares the standard set and fills it with the
    // javascript spelling has properties that are invisible to everything
    // except the writer that produced them.
    expect(standardPropertyName("Pset_WallCommon", "isExternal")).toBe("IsExternal");
    expect(standardPropertyName("Pset_WallCommon", "loadBearing")).toBe("LoadBearing");
    expect(standardPropertyName("Pset_SlabCommon", "fireRating")).toBe("FireRating");
    // already correct, and unknown names, both pass through untouched
    expect(standardPropertyName("Pset_WallCommon", "IsExternal")).toBe("IsExternal");
    expect(standardPropertyName("Pset_WallCommon", "somethingOurOwn")).toBe("somethingOurOwn");
    // a custom set is the caller's vocabulary, not IFC's
    expect(standardPropertyName("Tekto_Joint", "isExternal")).toBe("isExternal");
  });

  it("writes IsExternal into an exported wall", () => {
    const type = new WallType({
      name: "Test wall", construction: SolidConstruction,
      properties: { loadBearing: true, isExternal: true },
    });
    const wall = new Wall({
      centerline: [new Vec2(0, 0), new Vec2(4, 0)],
      thickness: 0.3, height: 2.8, name: "South", type,
    });
    const writer = new IfcWriter({ projectName: "P", buildingName: "B" });
    writer.addWallSystem(new WallSystem([wall]), { storey: writer.getDefaultStorey() });
    const ifc = writer.save();
    expect(ifc).toContain("'IsExternal'");
    expect(ifc).toContain("'LoadBearing'");
    // and not the spelling that nothing reads
    expect(ifc).not.toContain("'isExternal'");
  });
});
