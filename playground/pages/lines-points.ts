/**
 * Lines & Points — point clouds, spirals, wireframes, color palette.
 * Port of HDGEO LinesPointsTestPage.
 */
import { sketch, SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    // Point cloud (fixed seed)
    lab.randomSeed(42);
    for (let i = 0; i < 50; i++) {
      const x = lab.random(-2, 2) + 5;
      const y = lab.random(0, 4);
      const z = lab.random(-2, 2);
      lab.point(x, y, z).color("#ffff00").size(0.06);
    }

    // Line spiral
    const steps = 60;
    lab.beginShape("line_strip");
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 4;
      const r = 1.5;
      lab.vertex(Math.cos(a) * r - 4, t * 4, Math.sin(a) * r);
    }
    lab.endShape()?.color("#80ccff");

    // Wireframe box using lines
    const cx = 0, cy = 0.5, cz = -4;
    const h = 0.5;
    const v = [
      [cx - h, cy - h, cz - h], [cx + h, cy - h, cz - h],
      [cx + h, cy + h, cz - h], [cx - h, cy + h, cz - h],
      [cx - h, cy - h, cz + h], [cx + h, cy - h, cz + h],
      [cx + h, cy + h, cz + h], [cx - h, cy + h, cz + h],
    ];
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    for (const [a, b] of edges) {
      lab.line(v[a][0], v[a][1], v[a][2], v[b][0], v[b][1], v[b][2]).color("#ffffff");
    }

    // Stroke color palette
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
    for (let i = 0; i < colors.length; i++) {
      const y = 0.1 + i * 0.3;
      lab.line(3, y, -3, 7, y, -3).color(colors[i]);
    }

    lab.info("Yellow point cloud (50 pts)");
    lab.info("Cyan line spiral");
    lab.info("White wireframe box");
    lab.info("Color palette lines");
  }, {
    container,
    title: "Lines & Points",
    background: 0x0a0b14,
    camera: [6, 6, 8],
    target: [0, 2, 0],
  });
}
