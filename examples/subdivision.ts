/**
 * Tekto Example: Subdivision Sculpting
 *
 * Start from a box, subdivide and smooth to create organic shapes.
 */

import { sketch } from "tekto";

sketch((lab) => {
  const shape = lab.select("Base", ["box", "cylinder", "torus"], "box");
  const subdivisions = lab.slider("Subdivisions", 0, 3, 1, { step: 1 });
  const smoothIterations = lab.slider("Smooth Iters", 0, 8, 3, { step: 1 });
  const smoothFactor = lab.slider("Smooth Factor", 0.1, 0.9, 0.5);
  const wireframe = lab.toggle("Wireframe", true, { group: "Display" });

  // Generate base shape
  let mesh;
  switch (shape.value) {
    case "box":      mesh = lab.MeshGen.box(2, 2, 2); break;
    case "cylinder": mesh = lab.MeshGen.cylinder(1, 1, 2.5, 12); break;
    case "torus":    mesh = lab.MeshGen.torus(1.2, 0.45, 16, 8); break;
  }

  // Subdivide
  for (let i = 0; i < subdivisions.value; i++) {
    mesh = lab.MeshGen.subdivide(mesh);
  }

  // Smooth
  if (smoothIterations.value > 0) {
    lab.algo.laplacianSmooth(mesh, smoothIterations.value, smoothFactor.value);
  }

  // Display
  const obj = lab.mesh(mesh, { wireframe: wireframe.value, color: "#4dabf7" });

  lab.log("Nodes", mesh.nodeCount);
  lab.log("Faces", mesh.faceCount);
  lab.log("Edges", mesh.edgeCount);
}, {
  title: "Subdivision Sculpting",
});
