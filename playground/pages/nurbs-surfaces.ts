/**
 * NURBS Surfaces — parametric mushroom column.
 *
 * Thin sketch wrapper around `buildMushroomColumn` (see ../lib/mushroomColumn).
 * All the construction lives in that function so it can be reused — e.g. to
 * lay out a grid of columns in another scene. Here we just expose sliders and
 * forward their values; the function returns line/point primitives that we
 * paint to the renderer.
 */
import { sketch, SketchInstance, Vec3 } from "../../src";
import type { LineHandle } from "../../src";
import { buildMushroomColumn } from "../lib/mushroomColumn";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    // ── Capital shape ────────────────────────────────────────────────────────
    const r0       = lab.slider("Bottom radius (r0)", 0.05, 1.0, 0.15, { group: "Capital" });
    const r1       = lab.slider("Top ellipse r1",     0.5,  5.0, 4.0,  { group: "Capital" });
    const r2       = lab.slider("Top ellipse r2",     0.2,  3.0, 0.6,  { group: "Capital" });
    const capH     = lab.slider("Capital height",     0.5,  4.0, 2.0,  { group: "Capital" });
    const shearPos = lab.slider("Rim shear +X side", -0.5,  0.5, 0.0,  { group: "Capital" });
    const shearNeg = lab.slider("Rim shear −X side", -0.5,  0.5, 0.0,  { group: "Capital" });
    const geometricShear = lab.toggle(
      "Geometric shear (curves react)",
      true,
      { group: "Capital" },
    );
    // 0 = smooth ellipse rim, →1 = sharp lens with cusps on the short axis.
    const rimPointiness = lab.slider("Rim pointiness (lens)", 0.0, 1.0, 1.0, { group: "Capital" });

    // ── Smoothness ──────────────────────────────────────────────────────────
    const sections = lab.slider("Cross-sections",    2,    11,  6,    { step: 1, group: "Smoothness" });
    const flareExp = lab.slider("Flare exponent",    0.3,  4.0, 2.2,  { group: "Smoothness" });

    // ── Trunk ───────────────────────────────────────────────────────────────
    const trunkH   = lab.slider("Trunk height",      0.0,  6.0, 4.0,  { group: "Trunk" });

    // ── Density (independent sliders for each family, per-quarter) ──────────
    const isoPerQuarter   = lab.slider("Isocurves per quarter",       1, 16, 4, { step: 1, group: "Isocurves" });
    const isoMode         = lab.select(
      "Distribution",
      ["equalX", "equalAngle", "equalArc", "uniform"],
      "equalX",
      { group: "Isocurves" },
    );
    const principalPerQ   = lab.slider("Principal curves per quarter", 1, 16, 8, { step: 1, group: "Plane march" });
    const principalMethod = lab.select(
      "Method",
      ["planeMarch", "closestPoint"],
      "closestPoint",
      { group: "Plane march" },
    );
    const secondaryFromShortAxis = lab.toggle(
      "Secondary fan from short axis (X=0)",
      true,
      { group: "Plane march" },
    );
    const secondaryFromLongAxis = lab.toggle(
      "Also secondary fan from long axis (extra)",
      false,
      { group: "Plane march" },
    );
    const secondaryDensity = lab.slider(
      "Long-axis fan density",
      0.1, 4.0, 1.0,
      { group: "Plane march" },
    );
    const secondaryShortAxisCount = lab.slider(
      "Short-axis fan: seeds along v=0.25",
      1, 30, 4,
      { step: 1, group: "Plane march" },
    );

    // ── Material assumptions (drives both rendered line radius and mass) ───
    const tubeDiamCm  = lab.slider("Tube diameter (cm)",   1.0, 20.0, 5.0, { step: 0.5, group: "Material" });
    const wallThickMm = lab.slider("Wall thickness (mm)",  0.5, 20.0, 5.0, { step: 0.5, group: "Material" });

    // ── Build the column geometry ───────────────────────────────────────────
    const geom = buildMushroomColumn({
      r0: r0.value,
      r1: r1.value,
      r2: r2.value,
      capH: capH.value,
      trunkH: trunkH.value,
      flareExp: flareExp.value,
      crossSections: sections.value,
      isoMode: isoMode.value as "uniform" | "equalX" | "equalAngle" | "equalArc",
      isoCount: isoPerQuarter.value * 4,
      seedCount: principalPerQ.value,
      principalMethod: principalMethod.value as "planeMarch" | "closestPoint",
      secondaryFromShortAxis: secondaryFromShortAxis.value,
      secondaryFromLongAxis: secondaryFromLongAxis.value,
      secondaryDensity: secondaryDensity.value,
      secondaryShortAxisCount: secondaryShortAxisCount.value,
      geometricShear: geometricShear.value,
      shearPos: shearPos.value,
      shearNeg: shearNeg.value,
      rimPointiness: rimPointiness.value,
      lineThickness: (tubeDiamCm.value * 0.01) / 2,
      origin: new Vec3(0, 0, 0),
    });

    // ── Render: walk the returned primitives and paint them to lab ─────────
    for (const ln of geom.lines) {
      lab.beginShape("line_strip");
      for (const p of ln.points) lab.vertex(p.x, p.y, p.z);
      const h = lab.endShape();
      if (h && "radius" in h) {
        const lh = h as LineHandle;
        lh.color(ln.color);
        if (ln.thickness) lh.radius(ln.thickness);
      } else {
        h?.color(ln.color);
      }
    }
    for (const pt of geom.points) {
      lab.point(pt.position.x, pt.position.y, pt.position.z)
        .color(pt.color)
        .size(pt.size);
    }

    let totalLen = 0;
    for (const ln of geom.lines) {
      for (let i = 1; i < ln.points.length; i++) {
        totalLen += ln.points[i].distTo(ln.points[i - 1]);
      }
    }

    const rOuter   = (tubeDiamCm.value * 0.01) / 2;
    const rInner   = Math.max(0, rOuter - wallThickMm.value * 0.001);
    const xArea    = Math.PI * (rOuter * rOuter - rInner * rInner);
    const volPerM  = xArea;
    const massPerM = volPerM * 7850;
    const totalVol  = volPerM * totalLen;
    const totalMass = massPerM * totalLen;

    lab.info(
      `Ø${tubeDiamCm.value} cm × ${wallThickMm.value} mm wall  ·  `
      + `${massPerM.toFixed(2)} kg/m  ·  `
      + `Length ${totalLen.toFixed(2)} m → `
      + `Volume ${(totalVol * 1000).toFixed(1)} L, Mass ${totalMass.toFixed(1)} kg`,
    );
  }, {
    container,
    title: "NURBS Surfaces — Mushroom Column",
    background: 0x0a0b14,
    camera: [6, 5, 9],
    target: [0, 3, 0],
  });
}
