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
 * The fixture is written by IfcWriter and then given the one thing the writer
 * does not emit: property sets hung on the type itself. Without that,
 * IfcTypeObject.HasPropertySets is null, web-ifc raises "HasPropertySets is
 * not iterable", the reader's fallback fires, and the file cannot reproduce
 * the bug at all. Both edits assert that they applied, because a fixture that
 * silently stops constructing the case is a test that silently stops testing.
 */

/**
 * A one-wall model whose type states its own Pset_WallCommon, disagreeing with
 * the wall's and carrying one member the wall does not.
 */
function oneWallWithTypeProperties(): ArrayBuffer {
  const type = new WallType({ name: "SIP 202", construction: SolidConstruction });
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
  let text = writer.save();

  let highest = 0;
  for (const m of text.matchAll(/^#(\d+)=/gm)) highest = Math.max(highest, Number(m[1]));
  const next = () => ++highest;

  // the type's own defaults: one contradicting the wall, one only it has
  const isExternal = next(), reference = next(), pset = next();
  const lines = [
    `#${isExternal}=IFCPROPERTYSINGLEVALUE('IsExternal',$,IFCBOOLEAN(.F.),$);`,
    `#${reference}=IFCPROPERTYSINGLEVALUE('Reference',$,IFCLABEL('SIP-202'),$);`,
    `#${pset}=IFCPROPERTYSET('1TypePsetForTheTest00',$,'Pset_WallCommon',$,`
      + `(#${isExternal},#${reference}));`,
  ].join("\n");
  const withPset = text.replace("ENDSEC;", `${lines}\nENDSEC;`);
  if (withPset === text) throw new Error("fixture: could not append the type property set");
  text = withPset;

  // hang it on the type. HasPropertySets is IfcTypeObject's sixth attribute,
  // which IfcWriter leaves null, and web-ifc will not read a type without it.
  const wired = text.replace(/(IFCWALLTYPE\((?:[^,)]*,){5})\$/, `$1(#${pset})`);
  if (wired === text) throw new Error("fixture: could not wire the pset onto IFCWALLTYPE");

  return new TextEncoder().encode(wired).buffer as ArrayBuffer;
}

async function readWall() {
  const model = await IfcModel.parse(oneWallWithTypeProperties(),
    { wasmPath: "", tree: false, recenter: false });
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
