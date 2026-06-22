/**
 * Colors & Style — fill colors, grayscale, opacity.
 * Port of HDGEO ColorsTestPage.
 */
import { sketch, SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const spacing = 2.5;
    const startX = -spacing * 2;

    // Row 1 (Z=3): Fill colors
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
    const labels = ["Red", "Green", "Blue", "Yellow", "Magenta"];
    for (let i = 0; i < colors.length; i++) {
      lab.box(1, 1, 1).color(colors[i]).translate(startX + i * spacing, 0.5, 3);
    }

    // Row 2 (Z=0): Grayscale
    const grays = [50, 100, 150, 200, 255];
    for (let i = 0; i < grays.length; i++) {
      const g = grays[i];
      lab.box(1, 1, 1).color(lab.rgb(g, g, g)).translate(startX + i * spacing, 0.5, 0);
    }

    // Row 3 (Z=-3): Opacity test
    lab.sphere(0.6, 16, 12).color("#33cc66").opacity(0.3).translate(-2, 0.6, -3);
    lab.sphere(0.6, 16, 12).color("#33cc66").opacity(0.6).translate(0, 0.6, -3);
    lab.sphere(0.6, 16, 12).color("#33cc66").opacity(1.0).translate(2, 0.6, -3);

    // Color palette lines
    const lineColors = ["#ff8000", "#8000ff", "#ffffff", "#ff6b6b"];
    for (let i = 0; i < lineColors.length; i++) {
      const z = -5 - i * 0.4;
      lab.line(3, 0.1, z, 7, 0.1, z).color(lineColors[i]);
    }

    lab.info("Row 1: Fill colors - R, G, B, Y, M");
    lab.info("Row 2: Grayscale 50-255");
    lab.info("Row 3: Opacity 0.3, 0.6, 1.0");
    lab.info("Lines: Color palette");
  }, {
    container,
    title: "Colors & Style",
    background: 0x0a0b14,
    camera: [8, 6, 10],
    target: [0, 0, 0],
  });
}
