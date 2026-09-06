import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Wall } from "../src/core/geometry/walls";
import { WallType, SolidConstruction } from "../src/bim/walls";
import { IfcWriter } from "../src/io/IfcWriter";
import { IfcModel } from "../src/io/IfcModel";

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
