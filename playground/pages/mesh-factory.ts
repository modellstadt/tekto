/**
 * MeshFactory — procedurally generated meshes.
 * Port of HDGEO MeshFactoryTestPage.
 */
import { sketch, SketchInstance, MeshFactory, Vec2, Vec3 } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const subLevels = lab.slider("Subdivision Levels", 0, 3, 1, { step: 1 });
    const sp = 3.5;

    // Box
    lab.mesh(MeshFactory.box(1.5, 1.5, 1.5))
      .color(lab.rgb(230, 230, 230)).translate(-sp * 2, 0, 0);

    // Sphere
    lab.mesh(MeshFactory.sphere(0.8, 16, 12))
      .color(lab.rgb(50, 150, 255)).translate(-sp, 0, 0);

    // Subdivided sphere (approximates icosphere)
    let subdSphere = MeshFactory.sphere(0.8, 6, 4);
    for (let i = 0; i < subLevels.value; i++)
      subdSphere = MeshFactory.subdivide(subdSphere);
    lab.mesh(subdSphere)
      .color(lab.rgb(75, 230, 130)).translate(0, 0, 0);

    // Cylinder
    lab.mesh(MeshFactory.cylinder(0.5, 0.5, 1.5, 16))
      .color(lab.rgb(255, 180, 50)).translate(sp, 0, 0);

    // Torus
    lab.mesh(MeshFactory.torus(0.7, 0.25, 24, 12))
      .color(lab.rgb(230, 50, 75)).translate(sp * 2, 0, 0);

    // Height grid
    lab.mesh(MeshFactory.grid(10, 10, 20, 20,
      (x, z) => Math.sin(x * 2) * Math.cos(z * 2) * 0.3))
      .color(lab.rgb(130, 180, 230)).translate(-sp, 0, -sp);

    // Extrude a hexagon
    const hex: Vec3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 2 * i / 6;
      hex.push(new Vec3(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6));
    }
    lab.mesh(MeshFactory.extrude(hex, new Vec3(0, 1.5, 0)))
      .color(lab.rgb(150, 100, 230)).translate(sp, 0, -sp);

    // Revolve an L-profile
    const profile: Vec2[] = [
      new Vec2(0.2, 0), new Vec2(0.8, 0), new Vec2(0.8, 0.2),
      new Vec2(0.3, 0.2), new Vec2(0.3, 1.2), new Vec2(0.2, 1.2),
    ];
    lab.mesh(MeshFactory.revolve(profile, 32))
      .color(lab.rgb(230, 150, 75)).translate(sp * 2, 0, -sp);

    // Loft between 3 circles at different heights
    const profiles: Vec3[][] = [];
    for (let ring = 0; ring < 3; ring++) {
      const y = ring * 0.8;
      const r = 0.5 + 0.3 * Math.sin(ring * Math.PI / 2);
      const pts: Vec3[] = [];
      for (let i = 0; i < 16; i++) {
        const a = Math.PI * 2 * i / 16;
        pts.push(new Vec3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
      profiles.push(pts);
    }
    lab.mesh(MeshFactory.loft(profiles, true))
      .color(lab.rgb(100, 200, 180)).translate(0, 0, -sp);

    lab.info("MeshFactory generated meshes:");
    lab.info("Box, Sphere, Subdivided Sphere, Cylinder, Torus");
    lab.info("HeightGrid, Extrude, Revolve, Loft");
    lab.log("Subdivision levels", subLevels.value);
  }, {
    container,
    title: "MeshFactory",
    background: 0x0a0b14,
    camera: [10, 8, 12],
    target: [0, 0, 0],
  });
}
