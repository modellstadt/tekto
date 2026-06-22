/**
 * Shape Modes — beginShape/endShape with different modes.
 * Port of HDGEO ShapeModeTestPage.
 */
import { sketch, SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const spacing = 4;

    // Row 1: Lines, LineStrip, Triangles

    // Lines mode - X pattern
    lab.beginShape("lines");
    lab.vertex(-1 - spacing, 0.1, spacing / 2);
    lab.vertex(1 - spacing, 0.1, spacing / 2 + 2);
    lab.vertex(-1 - spacing, 0.1, spacing / 2 + 2);
    lab.vertex(1 - spacing, 0.1, spacing / 2);
    lab.endShape()?.color("#ff4d4d");

    // LineStrip - pentagon
    lab.beginShape("line_strip");
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI * 2 * i / 5 - Math.PI / 2;
      lab.vertex(Math.cos(angle), 0.1, Math.sin(angle) + spacing / 2 + 1);
    }
    lab.endShape(true)?.color("#4dff4d");

    // Triangles - two independent triangles
    lab.beginShape("triangles");
    lab.vertex(-1 + spacing, 0.1, spacing / 2);
    lab.vertex(0 + spacing, 0.1, spacing / 2);
    lab.vertex(-0.5 + spacing, 0.1, spacing / 2 + 1);
    lab.vertex(0 + spacing, 0.1, spacing / 2);
    lab.vertex(1 + spacing, 0.1, spacing / 2);
    lab.vertex(0.5 + spacing, 0.1, spacing / 2 + 1);
    lab.endShape()?.color("#4d4dff");

    // Row 2: Quads
    lab.beginShape("quads");
    // Quad 1
    lab.vertex(-1 + spacing, 0.1, -spacing / 2);
    lab.vertex(0 + spacing, 0.1, -spacing / 2);
    lab.vertex(0 + spacing, 0.1, -spacing / 2 + 1);
    lab.vertex(-1 + spacing, 0.1, -spacing / 2 + 1);
    // Quad 2
    lab.vertex(0.2 + spacing, 0.1, -spacing / 2);
    lab.vertex(1.2 + spacing, 0.1, -spacing / 2);
    lab.vertex(1.2 + spacing, 0.1, -spacing / 2 + 1);
    lab.vertex(0.2 + spacing, 0.1, -spacing / 2 + 1);
    lab.endShape()?.color("#4dcccc");

    lab.info("BeginShape/EndShape modes:");
    lab.info("Lines - X pattern (red)");
    lab.info("LineStrip - pentagon (green outline)");
    lab.info("Triangles - bowtie (blue)");
    lab.info("Quads - two quads (cyan)");
  }, {
    container,
    title: "Shape Modes",
    background: 0x0a0b14,
    camera: [6, 10, 8],
    target: [0, 0, 0],
  });
}
