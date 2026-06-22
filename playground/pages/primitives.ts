/**
 * Primitives — 6 standard shapes in a row.
 * Port of HDGEO PrimitivesTestPage.
 */
import { sketch, SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const spacing = 3;
    const startX = -spacing * 2.5;

    // Box (white)
    lab.box(1, 1, 1).color(lab.rgb(230, 230, 230)).translate(startX, 0.5, 0);

    // Sphere (blue)
    lab.sphere(0.6, 24, 16).color(lab.rgb(50, 150, 255)).translate(startX + spacing, 0.6, 0);

    // Cylinder (green)
    lab.cylinder(0.5, 0.5, 1.5, 16).color(lab.rgb(50, 200, 100)).translate(startX + spacing * 2, 0.75, 0);

    // Cone (orange) — cylinder with 0 top radius
    lab.cylinder(0, 0.5, 1.5, 16).color(lab.rgb(255, 150, 50)).translate(startX + spacing * 3, 0.75, 0);

    // Torus (red)
    lab.torus(0.8, 0.25, 24, 12).color(lab.rgb(230, 50, 75)).translate(startX + spacing * 4, 0.5, 0);

    // Plane (gray) — thin flat box
    lab.box(2, 0.02, 2).color(lab.rgb(150, 150, 180)).translate(startX + spacing * 5, 0.01, 0);

    lab.info("6 standard primitives:");
    lab.info("Box, Sphere, Cylinder, Cone, Torus, Plane");
  }, {
    container,
    title: "Primitives",
    background: 0x0a0b14,
    camera: [8, 6, 10],
    target: [0, 0, 0],
  });
}
