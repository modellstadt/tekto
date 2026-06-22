/**
 * BSP Tree & CSG — boolean operations on meshes.
 */
import {
  sketch, SketchInstance, MeshFactory, ConnectedMesh, BspTree, Vec3,
} from "../../src";

/** Convert ConnectedMesh → {positions, indices} for BSP, with optional translation. */
function meshToFlat(mesh: ConnectedMesh, dx = 0, dy = 0, dz = 0) {
  const idMap = new Map<number, number>();
  const positions: number[] = [];
  let idx = 0;
  for (const n of mesh.nodes()) {
    idMap.set(n.id, idx++);
    positions.push(n.position.x + dx, n.position.y + dy, n.position.z + dz);
  }
  const indices: number[] = [];
  for (const f of mesh.faces()) {
    const ns = f.nodes;
    if (ns.length >= 3) {
      // Fan-triangulate
      for (let j = 1; j < ns.length - 1; j++) {
        indices.push(idMap.get(ns[0])!, idMap.get(ns[j])!, idMap.get(ns[j + 1])!);
      }
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const op = lab.select("Operation", ["Union", "Subtract", "Intersect"] as const, "Subtract");
    const sep = lab.slider("Separation", 0, 2, 0.6, { step: 0.01 });
    const showA = lab.toggle("Show A", true, { group: "Display" });
    const showB = lab.toggle("Show B", true, { group: "Display" });
    const showResult = lab.toggle("Show Result", true, { group: "Display" });
    const wireframe = lab.toggle("Wireframe", false, { group: "Display" });

    const shapeA = lab.select("Shape A", ["Box", "Sphere", "Cylinder"] as const, "Box", { group: "Shapes" });
    const shapeB = lab.select("Shape B", ["Box", "Sphere", "Cylinder"] as const, "Sphere", { group: "Shapes" });

    // ── Build meshes ──
    function makeMesh(shape: string) {
      switch (shape) {
        case "Sphere":   return MeshFactory.sphere(0.8, 16, 10);
        case "Cylinder": return MeshFactory.cylinder(0.6, 0.6, 1.6, 16);
        default:         return MeshFactory.box(1.3, 1.3, 1.3);
      }
    }

    const meshA = makeMesh(shapeA.value);
    const meshB = makeMesh(shapeB.value);

    const offset = sep.value;

    // Convert to flat arrays for BSP
    const flatA = meshToFlat(meshA);
    const flatB = meshToFlat(meshB, offset, 0, 0);

    // Build BSP trees
    const bspA = BspTree.fromMesh(flatA.positions, flatA.indices);
    const bspB = BspTree.fromMesh(flatB.positions, flatB.indices);

    // CSG operation
    let result: BspTree;
    switch (op.value) {
      case "Union":     result = BspTree.union(bspA, bspB); break;
      case "Subtract":  result = BspTree.subtract(bspA, bspB); break;
      case "Intersect": result = BspTree.intersect(bspA, bspB); break;
    }

    const flat = result.toFlatMesh();
    const nTris = flat.indices.length / 3;
    const sp = 4;

    // ── Display originals (left) ──
    if (showA.value) {
      lab.mesh(meshA.clone()).color(lab.rgb(100, 180, 255)).opacity(0.4)
        .wireframe(wireframe.value).translate(-sp, 0, 0);
    }
    if (showB.value) {
      lab.mesh(meshB.clone()).color(lab.rgb(255, 130, 80)).opacity(0.4)
        .wireframe(wireframe.value).translate(-sp + offset, 0, 0);
    }

    // ── Display result (right) ──
    if (showResult.value && nTris > 0) {
      lab.flatMesh(flat)
        .color(lab.rgb(56, 217, 169)).wireframe(wireframe.value)
        .doubleSided(true)
        .translate(sp, 0, 0);
    }

    // ── Labels ──
    lab.point(-sp, -1.8, 0).color("#555").size(0.01).label("Inputs");
    lab.point(sp, -1.8, 0).color("#555").size(0.01).label(op.value);

    // ── Info ──
    lab.log("Operation", op.value);
    lab.log("A faces", meshA.faceCount);
    lab.log("B faces", meshB.faceCount);
    lab.log("Result tris", nTris);
    lab.log("Result verts", flat.positions.length / 3);

    // ── Point classification demo ──
    const probeX = lab.slider("Probe X", -2, 2, 0, { group: "Point Test", step: 0.05 });
    const probeY = lab.slider("Probe Y", -2, 2, 0, { group: "Point Test", step: 0.05 });
    const probeZ = lab.slider("Probe Z", -2, 2, 0, { group: "Point Test", step: 0.05 });
    const probe = new Vec3(probeX.value, probeY.value, probeZ.value);
    const classR = result.classifyPoint(probe);

    const probeColor = classR === "inside" ? "#00ff88" : classR === "on" ? "#ffff00" : "#ff4444";
    lab.point(probe.x + sp, probe.y, probe.z).color(probeColor).size(0.1);
    lab.point(probe.x - sp, probe.y, probe.z).color(probeColor).size(0.08);

    lab.log("Point class", classR);
  }, {
    container,
    title: "BSP Tree & CSG",
    background: 0x0a0b14,
    camera: [8, 6, 10],
    target: [0, 0, 0],
  });
}
