/**
 * Mesh Operations — subdivision, smoothing, Catmull-Clark, Doo-Sabin.
 * Port of HDGEO MeshOpsTestPage (subset: features ported to tekto).
 */
import {
  sketch, SketchInstance,
  MeshFactory, MeshSubdivide, MeshAnalysis,
} from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const subMode = lab.select("Subdivision",
      ["Midpoint + Smooth", "Catmull-Clark", "Doo-Sabin"] as const, "Midpoint + Smooth");
    const subLevel = lab.slider("Levels", 0, 3, 2, { step: 1 });
    const smoothIter = lab.slider("Smooth Iterations", 0, 10, 3, { step: 1 });

    const sp = 4;

    // Original box
    const original = MeshFactory.box(1.5, 1.5, 1.5);
    lab.mesh(original.clone()).color(lab.rgb(230, 230, 230)).translate(-sp * 2, 0, 0);

    // Subdivided mesh (user-selected mode)
    let sub = original.clone();
    let subLabel: string;
    if (subMode.value === "Midpoint + Smooth") {
      // Use Catmull-Clark as midpoint subdivision + smoothing
      for (let i = 0; i < subLevel.value; i++)
        sub = MeshFactory.subdivide(sub);
      if (smoothIter.value > 0)
        MeshAnalysis.laplacianSmooth(sub, smoothIter.value, 0.5);
      subLabel = `Catmull-Clark x${subLevel.value} + Smooth x${smoothIter.value}`;
    } else if (subMode.value === "Catmull-Clark") {
      for (let i = 0; i < subLevel.value; i++)
        sub = MeshFactory.subdivide(sub);
      subLabel = `Catmull-Clark x${subLevel.value}`;
    } else {
      for (let i = 0; i < subLevel.value; i++)
        MeshSubdivide.dooSabin(sub);
      subLabel = `Doo-Sabin x${subLevel.value}`;
    }
    lab.mesh(sub).color(lab.rgb(75, 200, 100)).translate(-sp, 0, 0);

    // Subdivided sphere
    let sphereSub = MeshFactory.sphere(1, 6, 4);
    for (let i = 0; i < subLevel.value; i++)
      sphereSub = MeshFactory.subdivide(sphereSub);
    MeshAnalysis.laplacianSmooth(sphereSub, 2, 0.5);
    lab.mesh(sphereSub).color(lab.rgb(100, 150, 255)).translate(0, 0, 0);

    // Catmull-Clark on a box
    let ccCube = original.clone();
    for (let i = 0; i < Math.min(subLevel.value, 3); i++)
      ccCube = MeshFactory.subdivide(ccCube);
    lab.mesh(ccCube).color(lab.rgb(255, 180, 50)).translate(sp, 0, 0);

    // Doo-Sabin on a box
    const dsCube = original.clone();
    for (let i = 0; i < Math.min(subLevel.value, 3); i++)
      MeshSubdivide.dooSabin(dsCube);
    lab.mesh(dsCube).color(lab.rgb(230, 75, 150)).translate(sp * 2, 0, 0);

    lab.info("ConnectedMesh operations:");
    lab.log("Selected", subLabel);
    lab.log("Sub verts", sub.nodeCount);
    lab.log("Sub faces", sub.faceCount);
    lab.info("");
    lab.info("Left: Original box");
    lab.info("Center-left: Selected subdivision");
    lab.info("Center: Subdivided sphere");
    lab.info("Center-right: Catmull-Clark box");
    lab.info("Right: Doo-Sabin box");
  }, {
    container,
    title: "Mesh Operations",
    background: 0x0a0b14,
    camera: [8, 6, 10],
    target: [0, 0, 0],
  });
}
