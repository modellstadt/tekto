/**
 * Curves — LineCurve, ArcCurve, CubicBezier, Polyline with arc-length markers.
 * Port of HDGEO CurvesTestPage.
 */
import {
  sketch, SketchInstance, Vec3,
  LineCurve, ArcCurve, CubicBezierCurve, PolylineCurve,
} from "../../src";
import type { ICurve, IMetricCurve } from "../../src";

function drawCurve(lab: any, curve: ICurve, color: string, samples: number) {
  lab.beginShape("line_strip");
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPoint(t);
    lab.vertex(p.x, p.y, p.z);
  }
  lab.endShape()?.color(color);
}

function drawArcLengthMarkers(lab: any, curve: ICurve, color: string) {
  if (!("length" in curve)) return;
  const metric = curve as IMetricCurve;
  const len = metric.length;
  for (let i = 0; i <= 10; i++) {
    const dist = len * i / 10;
    const t = metric.getTFromDistance(dist);
    const p = curve.getPoint(t);
    const sz = 0.08;
    lab.line(p.x - sz, p.y, p.z, p.x + sz, p.y, p.z).color(color);
    lab.line(p.x, p.y - sz, p.z, p.x, p.y + sz, p.z).color(color);
  }
}

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const samples = lab.slider("Samples", 10, 200, 100, { step: 1 });

    let yOff = 4;

    // 1. LineCurve
    const line = new LineCurve(new Vec3(-3, yOff, 0), new Vec3(3, yOff, 0));
    drawCurve(lab, line, "#ffffff", samples.value);
    drawArcLengthMarkers(lab, line, "#ff8080");

    // 2. ArcCurve - 180 degree arc
    yOff -= 3;
    const arc = new ArcCurve(new Vec3(0, yOff, 0), 2, 0, Math.PI, new Vec3(0, 0, 1));
    drawCurve(lab, arc, "#ff9933", samples.value);
    drawArcLengthMarkers(lab, arc, "#cc4d1a");

    // 3. CubicBezierCurve - S-curve
    yOff -= 3;
    const bezier = new CubicBezierCurve(
      new Vec3(-3, yOff, 0), new Vec3(-1, yOff + 2, 0),
      new Vec3(1, yOff - 2, 0), new Vec3(3, yOff, 0),
    );
    drawCurve(lab, bezier, "#33ccff", samples.value);
    drawArcLengthMarkers(lab, bezier, "#1a66cc");

    // Control points and polygon
    const cp = [
      new Vec3(-3, yOff, 0), new Vec3(-1, yOff + 2, 0),
      new Vec3(1, yOff - 2, 0), new Vec3(3, yOff, 0),
    ];
    for (let i = 0; i < cp.length - 1; i++) {
      lab.line(cp[i].x, cp[i].y, cp[i].z, cp[i + 1].x, cp[i + 1].y, cp[i + 1].z)
        .color("#666666");
    }
    for (const p of cp) {
      lab.point(p.x, p.y, p.z).color("#ffff00").size(0.06);
    }

    // Tangent vectors at 5 points along the bezier
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const pt = bezier.getPoint(t);
      const tan = bezier.getTangent(t).normalize().mul(0.5);
      lab.line(pt.x, pt.y, pt.z, pt.x + tan.x, pt.y + tan.y, pt.z + tan.z)
        .color("#80ff80");
    }

    // 4. PolylineCurve - zigzag
    yOff -= 3;
    const zigzag = new PolylineCurve([
      new Vec3(-3, yOff, 0), new Vec3(-1.5, yOff + 1, 0),
      new Vec3(0, yOff, 0), new Vec3(1.5, yOff + 1, 0),
      new Vec3(3, yOff, 0),
    ]);
    drawCurve(lab, zigzag, "#33ff66", samples.value);
    drawArcLengthMarkers(lab, zigzag, "#1a9933");

    lab.info("Curve types (top to bottom):");
    lab.info("LineCurve (white)");
    lab.info("ArcCurve 180 deg (orange)");
    lab.info("CubicBezier S-curve (cyan)");
    lab.info("PolylineCurve zigzag (green)");
    lab.info("Cross markers = arc-length evenly spaced");
  }, {
    container,
    title: "Curves",
    background: 0x0a0b14,
    camera: [0, 0, 14],
    target: [0, -1, 0],
  });
}
