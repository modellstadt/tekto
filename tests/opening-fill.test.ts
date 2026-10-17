/**
 * What fills an opening: frame, glass and leaves from the opening's type, or the app's own
 * parts, and the IFC door / window written with them as its body.
 */
import { describe, it, expect } from "vitest";
import { Vec2 } from "../src/core/math/vectors";
import { Wall, WallOpening, WallSystem } from "../src/core/geometry/walls";
import { MeshFactory } from "../src/core/geometry/mesh/MeshFactory";
import { OpeningType, openingFill } from "../src/bim/openings";
import { IfcWriter } from "../src/io/IfcWriter";

/** A 0.3 m wall from (0, 0) to (6, 0), 2.6 m high, standing at z = 3. */
const wall = () => new Wall({ centerline: [new Vec2(0, 0), new Vec2(6, 0)], thickness: 0.3, height: 2.6, baseElevation: 3 });
const bounds = (m: { bounds(): { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } }) => {
  const b = m.bounds();
  return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map((v) => Math.round(v * 1000) / 1000);
};

describe("openingFill", () => {
  it("fills a window with a frame and a pane, inside the opening", () => {
    const w = wall();
    const o = WallOpening.window(2, 1.2, 0.9, 2.2);
    const parts = openingFill(w, o);
    expect(parts.map((p) => [p.name, p.role])).toEqual([["Window frame", "frame"], ["Glazing", "glazing"]]);
    expect(bounds(parts[0].mesh)).toEqual([1.4, -0.04, 3.9, 2.6, 0.04, 5.2]);          // 1.2 wide, 0.08 deep, sill to head
    expect(bounds(parts[1].mesh)).toEqual([1.47, -0.012, 3.97, 2.53, 0.012, 5.13]);    // inside the 0.07 frame
    expect(parts[1].mesh.faceCount).toBe(6);                                            // one pane
  });

  it("divides a window by its partitioning, and sizes the frame from its type", () => {
    const o = WallOpening.window(3, 1.8, 0.5, 2.1);
    o.type = OpeningType.window("Two-light", { partitioning: "double_panel_vertical", frame: { width: 0.09, depth: 0.1 }, offset: 0.05 });
    const [frame, glass] = openingFill(wall(), o);
    expect(glass.mesh.faceCount).toBe(12);                                              // two panes
    expect(frame.mesh.faceCount).toBe(30);                                              // four members and a mullion
    expect(bounds(frame.mesh)[1]).toBeCloseTo(0, 6);                                         // 0.1 deep, 0.05 off the centreline
    expect(bounds(frame.mesh)[4]).toBeCloseTo(0.1, 6);
  });

  it("hangs one leaf in a door, two in a double door, and follows a turned wall", () => {
    const turned = new Wall({ centerline: [new Vec2(0, 0), new Vec2(0, 5)], thickness: 0.2, height: 2.5 });
    const single = openingFill(turned, WallOpening.door(1, 0.9));
    expect(single.map((p) => p.role)).toEqual(["frame", "leaf"]);
    const b = bounds(single[1].mesh);
    expect(b[4] - b[1]).toBeCloseTo(0.9 - 2 * 0.06 - 2 * 0.005, 6);                    // the leaf runs along y here
    expect(b[3] - b[0]).toBeCloseTo(0.04, 6);
    const pair = WallOpening.door(3, 1.6);
    pair.type = OpeningType.door("Double", { operation: "double_swing" });
    expect(openingFill(turned, pair).map((p) => p.name)).toEqual(["Door frame", "Door leaf 1", "Door leaf 2"]);
  });

  it("takes the parts an app made itself", () => {
    const o = WallOpening.window(2);
    o.fill = [{ name: "Supplier window", role: "frame", mesh: MeshFactory.box(1, 0.1, 1) }];
    expect(openingFill(wall(), o)).toBe(o.fill);
  });
});

describe("IfcWriter: doors and windows with their fill", () => {
  const file = (opts: { openingFills?: boolean } = {}) => {
    const w = wall();
    w.openings.push(WallOpening.window(2, 1.2, 0.9, 2.2), WallOpening.door(4.5, 0.9));
    const ifc = new IfcWriter(opts);
    ifc.addWallSystem(new WallSystem([w]), { includeMembers: false });
    return ifc.save();
  };
  const bodyOf = (ifc: string, entity: string) => {
    const line = ifc.split("\n").find((l) => l.includes(`=${entity}(`))!;
    const shape = /,#(\d+),\$,[\d.E+-]+,[\d.E+-]+,\./.exec(line)![1];
    const rep = new RegExp(`#${shape}=IFCPRODUCTDEFINITIONSHAPE\\(\\$,\\$,\\(#(\\d+)\\)\\)`).exec(ifc)![1];
    return new RegExp(`#${rep}=IFCSHAPEREPRESENTATION\\([^,]+,'Body','(\\w+)',\\(([^)]*)\\)`).exec(ifc)!.slice(1);
  };

  it("writes a window's frame and glass, a door's frame and leaf, as their bodies", () => {
    const ifc = file();
    const [winKind, winItems] = bodyOf(ifc, "IFCWINDOW");
    expect(winKind).toBe("Tessellation");
    expect(winItems.split(",")).toHaveLength(2);
    const [doorKind, doorItems] = bodyOf(ifc, "IFCDOOR");
    expect(doorKind).toBe("Tessellation");
    expect(doorItems.split(",")).toHaveLength(2);
    expect((ifc.match(/=IFCOPENINGELEMENT\(/g) ?? []).length).toBe(2);              // the voids stay boxes
  });

  it("keeps the opening's box with openingFills: false", () => {
    expect(bodyOf(file({ openingFills: false }), "IFCWINDOW")[0]).toBe("SweptSolid");
  });
});
