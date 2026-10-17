import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Wall, WallOpening, WallSystem } from "../src/core/geometry/walls";
import { WallType, SolidConstruction } from "../src/bim/walls";
import { IfcWriter } from "../src/io/IfcWriter";
import { IfcModel } from "../src/io/IfcModel";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";
import { Slab, SlabOpening } from "../src/bim/slabs";
import { Roof } from "../src/bim/roofs";

/**
 * Reading an element's properties back out of a file.
 *
 * The case worth pinning is a property set that exists on the type AND on the
 * occurrence under the same name, which is the ordinary shape of a Revit
 * export. web-ifc's `includeTypeProperties` is substitutive rather than
 * additive: it returns the type's sets INSTEAD of the element's. So an element
 * whose type carries a shorter Pset_WallCommon came back with the type's view
 * of it and lost everything only the occurrence states, quantities included.
 * It never threw on such a file, so the loss was silent.
 *
 * The fixture is written by IfcWriter rather than checked in, which only works
 * because the writer now puts the type's sets in `IfcTypeObject.HasPropertySets`
 * where a reader can find them. While that attribute was null, web-ifc raised
 * "HasPropertySets is not iterable", the reader's fallback fired, and a file
 * from this writer could not reproduce the bug at all.
 */

/**
 * A one-wall model whose type states its own Pset_WallCommon, disagreeing with
 * the wall's and carrying one member the wall does not.
 */
function oneWall(): ArrayBuffer {
  const type = new WallType({
    name: "SIP 202",
    construction: SolidConstruction,
    // the type's defaults: one the wall contradicts, one only the type has
    properties: { IsExternal: false, Reference: "SIP-202" },
  });
  const wall = new Wall({
    centerline: [new Vec2(0, 0), new Vec2(4, 0)],
    thickness: 0.202,
    height: 2.7,
    name: "Basic Wall:SIP 202",
    type,
    // what this particular wall says, which is what a reader has to get back
    properties: { IsExternal: true, LoadBearing: true },
  });
  const writer = new IfcWriter({ projectName: "pset precedence" });
  writer.addWall(wall);
  return writer.saveBytes().buffer as ArrayBuffer;
}

async function readWall() {
  const model = await IfcModel.parse(oneWall(), { wasmPath: "", tree: false, recenter: false });
  const wall = model.elements.find((e) => /Wall/i.test(e.ifcClass));
  expect(wall, "the written wall came back with no geometry").toBeTruthy();
  return wall!;
}

describe("IfcModel.parse property sets", () => {
  it("lets the occurrence override the type, which is what a type default means", async () => {
    // the type says false, the wall says true
    expect((await readWall()).properties.IsExternal).toBe(true);
  });

  it("keeps what only the occurrence states", async () => {
    // asking web-ifc for type properties returns the type's sets instead of
    // the wall's, and this member is only on the wall
    expect((await readWall()).properties.LoadBearing).toBe(true);
  });

  it("keeps what only the type states", async () => {
    expect((await readWall()).properties.Reference).toBe("SIP-202");
  });

  it("merges same-named sets rather than replacing one with the other", async () => {
    const common = (await readWall()).psets.Pset_WallCommon;
    expect(common, "Pset_WallCommon is on both the type and the wall").toBeTruthy();
    expect(Object.keys(common).sort()).toEqual(["IsExternal", "LoadBearing", "Reference"]);
  });
});

describe("IfcWriter type property sets", () => {
  it("puts them where a reader looks, in HasPropertySets", async () => {
    const text = new TextDecoder().decode(oneWall());
    const line = text.split("\n").find((l) => l.includes("IFCWALLTYPE"));
    expect(line, "no IfcWallType was written").toBeTruthy();
    // GlobalId, OwnerHistory, Name, Description, ApplicableOccurrence, then
    // HasPropertySets: a null there is a type nothing can read
    const attrs = line!.slice(line!.indexOf("(") + 1).split(",");
    expect(attrs[5], `HasPropertySets is null in ${line}`).toMatch(/^\(#\d+\)$/);
  });
});

describe("IfcWriter storeys, read back by web-ifc", () => {
  it("a wall on an upper storey comes back at its own height, not a storey higher", async () => {
    // Heights in the writer's API are absolute, and the storey's placement is raised already.
    const w = new IfcWriter({ storeyElevation: 0.5 });
    const first = w.addStorey({ name: "First", elevation: 3 });
    w.addWall(new Wall({ centerline: [new Vec2(0, 0), new Vec2(4, 0)], thickness: 0.2, height: 2.5, name: "W1", baseElevation: 3 }), { storey: first });
    const stud = MeshFactory.box(0.06, 0.12, 2.5);
    stud.translate(1, 0, 0.5 + 1.25);                            // world coordinates: 0.5 to 3 m
    w.addMember(0, { name: "Stud", role: "stud", mesh: stud });
    const model = await IfcModel.parse(w.saveBytes().buffer as ArrayBuffer, { wasmPath: "", tree: false, recenter: false, relations: false, properties: false });
    // web-ifc hands geometry back Y-up: IFC's z is its y.
    const heights = (cls: RegExp) => {
      const p = model.elements.find((e) => cls.test(e.ifcClass))!.mesh.positions;
      let lo = Infinity, hi = -Infinity;
      for (let i = 1; i < p.length; i += 3) { lo = Math.min(lo, p[i]); hi = Math.max(hi, p[i]); }
      return [lo, hi];
    };
    expect(heights(/Wall/i)[0]).toBeCloseTo(3, 6);
    expect(heights(/Wall/i)[1]).toBeCloseTo(5.5, 6);
    expect(heights(/Member/i)[0]).toBeCloseTo(0.5, 6);
  });
});

describe("IfcWriter wall corners, read back by web-ifc", () => {
  it("a mitred L closes its corner, and a polyline wall's window cuts the segment it is on", async () => {
    const w = new IfcWriter({});
    w.addWallSystem(new WallSystem([
      new Wall({ centerline: [new Vec2(0, 0), new Vec2(4, 0)], thickness: 0.2, height: 2.5, name: "A" }),
      new Wall({ centerline: [new Vec2(4, 0), new Vec2(4, 3)], thickness: 0.2, height: 2.5, name: "B" }),
    ]));
    const poly = new Wall({ centerline: [new Vec2(0, 10), new Vec2(4, 10), new Vec2(4, 13), new Vec2(8, 13)], thickness: 0.2, height: 2.5, name: "P" });
    poly.openings.push(WallOpening.window(9, 1.2, 0.9, 2.1));       // on the third segment
    w.addWallSystem(new WallSystem([poly]));
    const model = await IfcModel.parse(w.saveBytes().buffer as ArrayBuffer, { wasmPath: "", tree: false, recenter: false, relations: false, properties: false });
    const wall = (name: string) => model.elements.find((e) => e.name === name)!.mesh;
    // web-ifc hands geometry back Y-up: IFC's (x, y) is its (x, −z).
    const extent = (name: string, axis: 0 | 2) => {
      const p = wall(name).positions;
      let lo = Infinity, hi = -Infinity;
      for (let i = axis; i < p.length; i += 3) { lo = Math.min(lo, p[i]); hi = Math.max(hi, p[i]); }
      return [lo, hi];
    };
    expect(extent("A", 0)[1]).toBeCloseTo(4.1, 6);                    // A runs on to the outer corner
    expect(extent("B", 2)[1]).toBeCloseTo(0.1, 6);                    // and so does B: y = −0.1
    // a box is 12 triangles; the window's hole makes more, in the third segment only
    expect(wall("P_1").indices.length / 3).toBe(12);
    expect(wall("P_3").indices.length / 3).toBeGreaterThan(12);
  });
});

describe("IfcWriter slab openings, read back by web-ifc", () => {
  it("the slab comes back with its stair well cut out", async () => {
    const w = new IfcWriter({});
    w.addSlab(new Slab({
      boundary: [new Vec2(0, 0), new Vec2(5, 0), new Vec2(5, 4), new Vec2(0, 4)], thickness: 0.2, elevation: 3,
      openings: [new SlabOpening(3.5, 2, 1, 2.5, "Stair well")],
    }), { includeParts: false });
    const model = await IfcModel.parse(w.saveBytes().buffer as ArrayBuffer, { wasmPath: "", tree: false, recenter: false, relations: false, properties: false });
    const { positions: p, indices: ix } = model.elements.find((e) => /Slab/i.test(e.ifcClass))!.mesh;
    // web-ifc hands geometry back Y-up: the top face is at y = 3. Sum its area in plan (x, z).
    let top = 0;
    for (let t = 0; t < ix.length; t += 3) {
      const [a, b, c] = [ix[t] * 3, ix[t + 1] * 3, ix[t + 2] * 3];
      if ([a, b, c].some((k) => Math.abs(p[k + 1] - 3) > 1e-6)) continue;
      top += Math.abs((p[b] - p[a]) * (p[c + 2] - p[a + 2]) - (p[c] - p[a]) * (p[b + 2] - p[a + 2])) / 2;
    }
    expect(top).toBeCloseTo(20 - 1 * 2.5, 3);
  });
});

describe("IfcWriter roofs, read back by web-ifc", () => {
  it("a gable roof comes back as its two roof slabs and two gable walls, at their heights", async () => {
    const roof = new Roof({
      kind: "gable", pitch: 40, eavesElevation: 6, thickness: 0.3,
      footprint: [new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 8), new Vec2(0, 8)],
    });
    const w = new IfcWriter({});
    w.addRoof(roof, { storey: w.addStorey({ name: "Attic", elevation: 6 }), gableThickness: 0.3 });
    const model = await IfcModel.parse(w.saveBytes().buffer as ArrayBuffer, { wasmPath: "", tree: false, recenter: false, relations: false, properties: false });
    // web-ifc hands geometry back Y-up: heights are y.
    const tops = (cls: RegExp) => model.elements.filter((e) => cls.test(e.ifcClass)).map((e) => {
      let hi = -Infinity;
      for (let i = 1; i < e.mesh.positions.length; i += 3) hi = Math.max(hi, e.mesh.positions[i]);
      return hi.toFixed(4);
    });
    expect(tops(/Slab/i)).toEqual(Array(2).fill(roof.ridgeHeight().toFixed(4)));
    expect(tops(/Wall/i)).toEqual(Array(2).fill((6 + roof.gables(0.3)[0].height).toFixed(4)));
  });
});
