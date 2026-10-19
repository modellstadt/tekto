/**
 * OBJ keeps groups and materials.
 *
 * `ObjFile.parse` read `g` groups but `serialize` dropped them, and neither knew `usemtl`, so an
 * export could not stay separable by element type with its colours (Rhino, Cinema 4D). Now
 * groups and materials go both ways, `serializeMtl` writes the .mtl, and `Scene.toMeshData`
 * groups a scene by object or by layer — while its default output stays one ungrouped mesh.
 */
import { describe, it, expect } from "vitest";
import { Vec3 } from "../src/core/math/vectors";
import { Mesh } from "../src/core/geometry/mesh/Mesh";
import { ObjFile, type MeshData } from "../src/io";
import { Scene } from "../src/scene/Scene";

/** A unit quad at height z: 4 nodes, 1 face. */
const quad = (z = 0) => {
  const m = new Mesh();
  const ids = [new Vec3(0, 0, z), new Vec3(1, 0, z), new Vec3(1, 1, z), new Vec3(0, 1, z)].map(p => m.addNode(p));
  m.addFace(ids);
  return m;
};

/** A strip of `n` triangles over 2 + n vertices, all faces ungrouped. */
const strip = (n: number): MeshData => ({
  positions: Array.from({ length: n + 2 }, (_, i) => new Vec3(i, i % 2, 0)),
  normals: [],
  uvs: [],
  faces: Array.from({ length: n }, (_, i) => [i, i + 1, i + 2]),
});

const faceLines = (text: string) => text.split("\n").filter(l => /^(f|g|usemtl) /.test(l));

describe("ObjFile round trip", () => {
  it("without groups: positions and faces come back, no g or usemtl is written", () => {
    const d = strip(3);
    const text = ObjFile.serialize(d);
    expect(text).not.toMatch(/^(g|usemtl|mtllib) /m);
    const back = ObjFile.parse(text);
    expect(back.positions).toEqual(d.positions);
    expect(back.faces).toEqual(d.faces);
    expect(back.groups).toBeUndefined();
  });

  it("with groups and materials: ranges, names and materials come back", () => {
    const d: MeshData = {
      ...strip(6),
      groups: [
        { name: "offices", faceStart: 1, faceCount: 2, material: "c_ff0000" },
        { name: "offices", faceStart: 3, faceCount: 1, material: "c_9cc8e8_a45" },
        { name: "roof", faceStart: 4, faceCount: 2, material: "c_a8705a" },
      ],
    };
    const text = ObjFile.serialize(d, { mtllib: "house.mtl" });
    expect(text).toMatch(/^mtllib house\.mtl$/m);
    const back = ObjFile.parse(text);
    expect(back.positions).toEqual(d.positions);
    expect(back.faces).toEqual(d.faces);
    expect(back.groups).toEqual(d.groups);
  });

  it("groups without materials come back without one", () => {
    const d: MeshData = { ...strip(2), groups: [{ name: "a", faceStart: 0, faceCount: 1 }, { name: "b", faceStart: 1, faceCount: 1 }] };
    const back = ObjFile.parse(ObjFile.serialize(d));
    expect(back.groups).toEqual(d.groups);
    for (const g of back.groups!) expect(g).not.toHaveProperty("material");
  });

  it("writes the faces in no group first, then each group's run", () => {
    const d: MeshData = {
      ...strip(4),
      groups: [{ name: "b", faceStart: 2, faceCount: 2, material: "m" }, { name: "a", faceStart: 0, faceCount: 1 }],
    };
    expect(faceLines(ObjFile.serialize(d))).toEqual([
      "f 2 3 4",            // face 1, in no group
      "g b", "usemtl m", "f 3 4 5", "f 4 5 6",
      "g a", "f 1 2 3",
    ]);
  });

  it("turns whitespace in group and material names into _", () => {
    const d: MeshData = { ...strip(2), groups: [{ name: "office  floor 2", faceStart: 0, faceCount: 1, material: "blue glass" }, { name: " ", faceStart: 1, faceCount: 1 }] };
    const text = ObjFile.serialize(d);
    expect(faceLines(text)).toEqual(["g office_floor_2", "usemtl blue_glass", "f 1 2 3", "g default", "f 2 3 4"]);
    expect(ObjFile.parse(text).groups!.map(g => g.name)).toEqual(["office_floor_2", "default"]);
  });

  it("refuses groups that overlap or run past the faces", () => {
    expect(() => ObjFile.serialize({ ...strip(3), groups: [{ name: "a", faceStart: 0, faceCount: 2 }, { name: "b", faceStart: 1, faceCount: 2 }] }))
      .toThrow(/face 1 is in group "b" and in an earlier one/);
    expect(() => ObjFile.serialize({ ...strip(3), groups: [{ name: "a", faceStart: 2, faceCount: 2 }] }))
      .toThrow(/group "a" covers faces 2\.\.3, but there are 3 faces/);
  });
});

describe("ObjFile.parse", () => {
  it("reads mtllib, usemtl and g interleaved: a material change starts a run, a material carries into the next g", () => {
    const text = [
      "# hand-written",
      "mtllib model.mtl",
      "v 0 0 0", "v 1 0 0", "v 1 1 0", "v 0 1 0",
      "v 0 0 1", "v 1 0 1", "v 1 1 1", "v 0 1 1",
      "f 1 2 3",               // 0: in no group
      "usemtl red",            // before any g: runs under "default"
      "f 1 3 4",               // 1
      "g walls",
      "f 1 2 6",               // 2: walls, still red
      "usemtl blue",
      "f 2 3 7",               // 3: walls, blue
      "g roof",
      "f 5 6 7",               // 4: roof, blue carried over
      "usemtl blue",           // no change: same run
      "f 5 7 8",               // 5
      "g walls",
      "f 3 4 8",               // 6: walls again, blue
    ].join("\n");
    const d = ObjFile.parse(text);
    expect(d.faces).toHaveLength(7);
    expect(d.positions).toHaveLength(8);
    expect(d.groups).toEqual([
      { name: "default", faceStart: 1, faceCount: 1, material: "red" },
      { name: "walls", faceStart: 2, faceCount: 1, material: "red" },
      { name: "walls", faceStart: 3, faceCount: 1, material: "blue" },
      { name: "roof", faceStart: 4, faceCount: 2, material: "blue" },
      { name: "walls", faceStart: 6, faceCount: 1, material: "blue" },
    ]);
  });

  it("keeps groups unset for a file with neither g nor usemtl, and g-only groups without a material", () => {
    expect(ObjFile.parse("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n").groups).toBeUndefined();
    const g = ObjFile.parse("v 0 0 0\nv 1 0 0\nv 0 1 0\ng tri\nf 1 2 3\n").groups!;
    expect(g).toEqual([{ name: "tri", faceStart: 0, faceCount: 1 }]);
    expect(g[0]).not.toHaveProperty("material");
  });
});

describe("ObjFile.serializeMtl", () => {
  it("writes newmtl, a small Ka, Kd and d per material, from hex or 0..1 colours", () => {
    const mtl = ObjFile.serializeMtl([
      { name: "c_ff8000", color: "#ff8000" },
      { name: "blue glass", color: [0.2, 0.4, 1], opacity: 0.45 },
      { name: "grey", color: "#ccc" },
    ]);
    expect(mtl.split("\n")).toEqual([
      "# Exported by Tekto", "# Materials: 3",
      "", "newmtl c_ff8000", "Ka 0.1 0.050196 0", "Kd 1 0.501961 0", "d 1",
      "", "newmtl blue_glass", "Ka 0.02 0.04 0.1", "Kd 0.2 0.4 1", "d 0.45",
      "", "newmtl grey", "Ka 0.08 0.08 0.08", "Kd 0.8 0.8 0.8", "d 1",
      "",
    ]);
  });

  it("refuses colours it cannot read and opacities outside 0..1", () => {
    expect(() => ObjFile.serializeMtl([{ name: "x", color: "red" }])).toThrow(/material "x" has the colour "red"/);
    expect(() => ObjFile.serializeMtl([{ name: "x", color: [1, 2, 0] }])).toThrow(/\[r, g, b\] in 0\.\.1/);
    expect(() => ObjFile.serializeMtl([{ name: "x", color: "#fff", opacity: 1.5 }])).toThrow(/opacity 1\.5/);
  });
});

describe("Scene.toMeshData", () => {
  /** walls (2 quads, one grey, one glass), a roof, a space without a layer, and what is not exported. */
  const building = () => {
    const s = new Scene();
    s.withKey("walls/s", () => s.addMesh(quad(0), { color: "#cccccc", layer: "walls" }));       // mesh_1
    s.addMesh(quad(3), { color: "#a8705a", layer: "roof" });                                     // mesh_2
    s.addPoint(new Vec3(0, 0, 0), { layer: "walls" });                                          // pt_3: no faces
    s.withKey("walls/n", () => s.addMesh(quad(1), { color: "#cccccc", layer: "walls" }));       // mesh_4
    s.addMesh(quad(0.5), { color: "#d9cbe8", opacity: 0.5 });                                    // mesh_5: no layer
    s.addMesh(quad(9), { color: "#cccccc", layer: "walls", noExport: true });                    // mesh_6
    s.addMesh(quad(8), { color: "#cccccc", layer: "walls", visible: false });                    // mesh_7
    s.withKey("openings/w", () => s.addMesh(quad(2), { color: "#9cc8e8", opacity: 0.45, layer: "walls" })); // mesh_8
    return s;
  };

  it("without options: one ungrouped mesh, objects in order, as before", () => {
    const d = building().toMeshData();
    expect(Object.keys(d).sort()).toEqual(["faces", "normals", "positions", "uvs"]);
    expect(d.positions).toHaveLength(20);
    expect(d.normals).toHaveLength(20);
    expect(d.uvs).toEqual([]);
    expect(d.faces).toEqual([[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [16, 17, 18, 19]]);
    expect(d.positions.map(p => p.z).filter((_, i) => i % 4 === 0)).toEqual([0, 3, 1, 0.5, 2]);
  });

  it("groupBy object: one group per exported object, named by key or id, with a colour material", () => {
    const d = building().toMeshData({ groupBy: "object" });
    expect(d.faces).toEqual(building().toMeshData().faces);
    expect(d.groups).toEqual([
      { name: "walls/s", faceStart: 0, faceCount: 1, material: "c_cccccc" },
      { name: "mesh_2", faceStart: 1, faceCount: 1, material: "c_a8705a" },
      { name: "walls/n", faceStart: 2, faceCount: 1, material: "c_cccccc" },
      { name: "mesh_5", faceStart: 3, faceCount: 1, material: "c_d9cbe8_a50" },
      { name: "openings/w", faceStart: 4, faceCount: 1, material: "c_9cc8e8_a45" },
    ]);
    expect(d.materials).toEqual([
      { name: "c_cccccc", color: "#cccccc", opacity: 1 },
      { name: "c_a8705a", color: "#a8705a", opacity: 1 },
      { name: "c_d9cbe8_a50", color: "#d9cbe8", opacity: 0.5 },
      { name: "c_9cc8e8_a45", color: "#9cc8e8", opacity: 0.45 },
    ]);
  });

  it("groupBy layer: each layer's faces contiguous, split by colour, layers in first-seen order", () => {
    const d = building().toMeshData({ groupBy: "layer" });
    expect(d.groups).toEqual([
      { name: "walls", faceStart: 0, faceCount: 2, material: "c_cccccc" },
      { name: "walls", faceStart: 2, faceCount: 1, material: "c_9cc8e8_a45" },
      { name: "roof", faceStart: 3, faceCount: 1, material: "c_a8705a" },
      { name: "default", faceStart: 4, faceCount: 1, material: "c_d9cbe8_a50" },
    ]);
    // Every face once, in its layer's block: walls at z 0, 1, 2; then the roof; then the space.
    const z = d.faces.map(f => d.positions[f[0]].z);
    expect(z).toEqual([0, 1, 2, 3, 0.5]);
    expect(d.positions).toHaveLength(20);
    expect(d.materials!.map(m => m.name)).toEqual(["c_cccccc", "c_9cc8e8_a45", "c_a8705a", "c_d9cbe8_a50"]);
  });

  it("a colour that is not hex keeps its name and exports grey, so the .mtl still writes", () => {
    const s = new Scene();
    s.addMesh(quad(0), { color: "tomato", layer: "walls" });
    const d = s.toMeshData({ groupBy: "layer" });
    expect(d.materials).toEqual([{ name: "c_tomato", color: "#808080", opacity: 1 }]);
    expect(ObjFile.serializeMtl(d.materials!)).toContain("newmtl c_tomato\nKa 0.050196 0.050196 0.050196\nKd 0.501961 0.501961 0.501961\nd 1");
  });

  it("goes through OBJ and MTL text intact", () => {
    const d = building().toMeshData({ groupBy: "layer" });
    const back = ObjFile.parse(ObjFile.serialize(d, { mtllib: "b.mtl" }));
    expect(back.groups).toEqual(d.groups);
    expect(back.faces).toHaveLength(d.faces.length);
    const mtl = ObjFile.serializeMtl(d.materials!);
    for (const g of d.groups!) expect(mtl).toContain(`newmtl ${g.material}\n`);
    expect(mtl).toContain("newmtl c_9cc8e8_a45\nKa 0.061176 0.078431 0.09098\nKd 0.611765 0.784314 0.909804\nd 0.45");
  });
});
