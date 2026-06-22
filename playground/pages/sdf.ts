/**
 * SDF + MarchingCubes — build SDF scenes and extract isosurfaces.
 * Port of HDGEO SdfTestPage.
 */
import {
  sketch, SketchInstance, Vec3,
  SdfSphere, SdfBox, SdfSmoothUnion, SdfSubtract, SdfTwist,
  VoxelGrid, MarchingCubes, AABB,
} from "../../src";
import type { ISdf } from "../../src";

function smoothUnionScene(): { sdf: ISdf; bounds: AABB } {
  const sphere = new SdfSphere(0.9);
  const box = new SdfBox(new Vec3(0.7, 0.7, 0.7), new Vec3(1.1, 0, 0));
  const sdf = new SdfSmoothUnion(sphere, box, 0.3);
  const m = 0.4;
  const bounds = new AABB(
    new Vec3(-0.9 - m, -0.9 - m, -0.9 - m),
    new Vec3(1.8 + m, 0.9 + m, 0.9 + m),
  );
  return { sdf, bounds };
}

function hollowSphereScene(): { sdf: ISdf; bounds: AABB } {
  const outer = new SdfSphere(1.4);
  const inner = new SdfSphere(1.1);
  const sdf = new SdfSubtract(outer, inner);
  const m = 0.2;
  const bounds = new AABB(
    new Vec3(-1.4 - m, -1.4 - m, -1.4 - m),
    new Vec3(1.4 + m, 1.4 + m, 1.4 + m),
  );
  return { sdf, bounds };
}

function twistedBoxScene(): { sdf: ISdf; bounds: AABB } {
  const box = new SdfBox(new Vec3(0.6, 0.6, 1.5));
  const sdf = new SdfTwist(box, 2, -2, 2);
  const xy = 1.0, m = 0.2;
  const bounds = new AABB(
    new Vec3(-xy - m, -xy - m, -1.5 - m),
    new Vec3(xy + m, xy + m, 1.5 + m),
  );
  return { sdf, bounds };
}

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const scene = lab.select("Scene",
      ["Smooth Union", "Hollow Sphere", "Twisted Box"] as const, "Smooth Union");
    const resolution = lab.slider("Resolution", 15, 100, 40, { step: 1 });

    const { sdf, bounds } = (() => {
      switch (scene.value) {
        case "Hollow Sphere": return hollowSphereScene();
        case "Twisted Box": return twistedBoxScene();
        default: return smoothUnionScene();
      }
    })();

    const grid = VoxelGrid.fromResolution(bounds.min, bounds.max, resolution.value);
    grid.fillFromSdf(sdf);
    const cm = MarchingCubes.extract(grid);

    lab.mesh(cm).color("#66b3e6");

    lab.info("SDF -> VoxelGrid -> MarchingCubes");
    lab.log("Vertices", cm.nodeCount);
    lab.log("Faces", cm.faceCount);
  }, {
    container,
    title: "SDF + Marching Cubes",
    background: 0x0a0b14,
    camera: [3, 3, 4],
    target: [0, 0, 0],
  });
}
