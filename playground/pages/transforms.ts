/**
 * Transforms — Translation, rotation, scale, and nested transforms.
 * Port of HDGEO TransformTestPage.
 */
import { sketch, SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    // Row 1: Translation (Y = 2)
    for (let i = -1; i <= 1; i++) {
      lab.box(0.8, 0.8, 0.8).color(lab.rgb(200, 75, 75)).translate(i * 3, 0.4, 2);
    }

    // Row 2: Rotation (Y = 0.4)
    lab.box(0.8, 0.8, 0.8).color(lab.rgb(75, 200, 75)).rotateX(Math.PI / 4).translate(-3, 0.4, -2);
    lab.box(0.8, 0.8, 0.8).color(lab.rgb(75, 200, 75)).rotateY(Math.PI / 4).translate(0, 0.4, -2);
    lab.box(0.8, 0.8, 0.8).color(lab.rgb(75, 200, 75)).rotateZ(Math.PI / 4).translate(3, 0.4, -2);

    // Row 3: Scale (Y = -4)
    lab.sphere(1, 16, 12).color(lab.rgb(75, 75, 200)).scale(0.5).translate(-3, 0.25, -6);
    lab.sphere(1, 16, 12).color(lab.rgb(75, 75, 200)).translate(0, 0.5, -6);

    // Nested transforms: solar system (right side, animated)
    const t = lab.time;

    // Sun
    lab.sphere(0.5, 16, 12).color(lab.rgb(255, 230, 50)).translate(8, 0.5, 0);

    // Planet orbiting sun
    const planetAngle = t * 0.8;
    const px = 8 + Math.cos(planetAngle) * 2.5;
    const pz = Math.sin(planetAngle) * 2.5;
    lab.sphere(0.25, 12, 8).color(lab.rgb(50, 150, 255)).translate(px, 0.5, pz);

    // Moon orbiting planet
    const moonAngle = t * 3;
    const mx = px + Math.cos(moonAngle) * 0.8;
    const mz = pz + Math.sin(moonAngle) * 0.8;
    lab.sphere(0.1, 8, 6).color(lab.rgb(180, 180, 180)).translate(mx, 0.5, mz);

    lab.info("Row 1: Translation");
    lab.info("Row 2: RotateX / RotateY / RotateZ by 45 deg");
    lab.info("Row 3: Scale (0.5x, 1x)");
    lab.info("Right: Nested solar system (animated)");

    lab.animate(() => {}); // enable continuous re-run for animation
  }, {
    container,
    title: "Transforms",
    background: 0x0a0b14,
    camera: [8, 8, 12],
    target: [2, 0, 0],
  });
}
