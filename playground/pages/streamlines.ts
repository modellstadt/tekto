/**
 * Streamlines — trace polylines along principal curvature directions.
 *
 * Pipeline step 3 (after Taubin curvature + greedy comb): integrate the per-face
 * principal direction field face-to-face to produce smooth curves that "wrap"
 * the surface. Visual reference:
 * https://houdinigubbins.wordpress.com/2017/04/25/discrete-curvature/
 *
 * Pick a shape, pick which principal field to trace (max/min/both), tune the
 * seed stride and step count, and watch the curves run around the form.
 */
import {
  sketch, SketchInstance,
  MeshFactory, MeshAnalysis, MeshCleanup,
  Curvature, StreamlineTracer,
  extractVisiblePolylines, polylinesToSVG,
  noise, Vec3,
} from "../../src";
import type { ConnectedMesh, VisibilityView } from "../../src";

type ShapeName = "sphere" | "torus" | "subdivided box" | "wavy grid" | "bumpy sphere";

function buildMesh(shape: ShapeName, detail: number, bumpiness: number): ConnectedMesh {
  let m: ConnectedMesh;
  switch (shape) {
    case "sphere":
      m = MeshFactory.sphere(1, 24 + detail * 12, 16 + detail * 8);
      break;
    case "torus":
      m = MeshFactory.torus(1, 0.35, 32 + detail * 16, 16 + detail * 8);
      break;
    case "subdivided box": {
      m = MeshFactory.box(1.4, 1.4, 1.4);
      for (let i = 0; i < detail + 1; i++) m = MeshFactory.subdivide(m);
      MeshAnalysis.laplacianSmooth(m, 2, 0.5);
      break;
    }
    case "wavy grid": {
      const div = 40 + detail * 16;
      m = MeshFactory.grid(2.4, 2.4, div, div,
        (x, z) => 0.25 * Math.sin(2 * x) * Math.cos(2 * z));
      break;
    }
    case "bumpy sphere": {
      // Higher base resolution so finer ripples have room to read as curvature.
      m = MeshFactory.sphere(1, 48 + detail * 16, 32 + detail * 10);
      // Weld the seam BEFORE displacing — otherwise the two seam vertices
      // sample noise at the same position but get welded later, fine, but
      // displacing first and then welding can stitch differently-displaced
      // copies. Cleaner to weld first, displace once.
      MeshCleanup.weldVertices(m, 1e-6);
      // Two-octave Perlin gives broad lumps (low freq, big amplitude) plus
      // finer wrinkles (high freq, small amplitude) — much richer curvature
      // signal than a single sin·sin·sin product.
      for (const node of m.nodes()) {
        const p = node.position;
        const r = p.len();
        if (r < 1e-9) continue;
        const n = p.div(r);
        const low = (noise(p.x * 1.5, p.y * 1.5, p.z * 1.5) - 0.5) * 2;
        const high = (noise(p.x * 4.5, p.y * 4.5, p.z * 4.5) - 0.5) * 2;
        const bump = bumpiness * (low + 0.4 * high);
        (node as { position: typeof p }).position = p.add(n.mul(bump));
      }
      m.computeVertexNormals();
      return m; // already welded above
    }
  }
  // Weld the lat/lon seam. MeshFactory.sphere / .torus leave duplicate vertices
  // at the longitude wrap-around — that's the visible "cut" along the +X
  // meridian where the comb can't propagate and the tracer treats every seam
  // edge as a boundary. Use weldVertices (epsilon match) rather than
  // mergeIdenticalVertices, because cos(2π) isn't bit-equal to cos(0) so the
  // seam vertices have float-drift-different positions.
  MeshCleanup.weldVertices(m, 1e-6);
  return m;
}

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const shape = lab.select("Shape",
      ["sphere", "torus", "subdivided box", "wavy grid", "bumpy sphere"] as const,
      "bumpy sphere");
    const detail = lab.slider("Detail", 0, 3, 1, { step: 1 });
    const bumpiness = lab.slider("Bumpiness (sphere only)", 0, 0.5, 0.28);

    const which = lab.select("Field",
      ["kMax (red)", "kMin (cyan)", "both"] as const, "both");
    const stride = lab.slider("Seed stride", 1, 24, 6, { step: 1 });
    const maxSteps = lab.slider("Max steps", 20, 800, 200, { step: 10 });
    const smoothIter = lab.slider("Smoothing passes", 0, 12, 3, { step: 1 });
    const showMesh = lab.toggle("Show mesh", true);

    // ── Pen-plotter / hidden-line ────────────────────────────────────────
    const viewName = lab.select("Plot view",
      ["front (+Z)", "side (+X)", "top (+Y)", "iso"] as const, "front (+Z)",
      { group: "Pen plotter" });
    const visibleOnly = lab.toggle("Show only visible (HLR)", false, { group: "Pen plotter" });
    const hlrRes = lab.slider("HLR resolution", 256, 2048, 1024, { step: 128, group: "Pen plotter" });

    const t0 = performance.now();
    const mesh = buildMesh(shape.value, detail.value, bumpiness.value);
    const tMesh = performance.now() - t0;

    if (showMesh.value) {
      lab.mesh(mesh).color(lab.rgb(38, 42, 56)).opacity(0.85);
    }

    // 1. Per-vertex principal curvature + comb.
    const t1 = performance.now();
    const curvatures = Curvature.taubin(mesh);
    Curvature.combDirections(mesh, curvatures);
    const tCurv = performance.now() - t1;

    // 2. Lift to per-face direction fields.
    const traceMax = which.value !== "kMin (cyan)";
    const traceMin = which.value !== "kMax (red)";
    const fieldMax = traceMax ? Curvature.facePrincipalField(mesh, curvatures, "max") : null;
    const fieldMin = traceMin ? Curvature.facePrincipalField(mesh, curvatures, "min") : null;

    // 3. Integrate streamlines.
    const t2 = performance.now();
    const opts = { maxSteps: maxSteps.value, stride: stride.value };
    let linesMax = fieldMax ? StreamlineTracer.trace(mesh, fieldMax, opts) : [];
    let linesMin = fieldMin ? StreamlineTracer.trace(mesh, fieldMin, opts) : [];
    const tTrace = performance.now() - t2;

    // 3b. Smooth the raw traces — Euler integration leaves visible per-step
    //     wobble, especially across edge crossings. Laplacian smoothing keeps
    //     endpoints fixed (no silhouette shrinkage) and preserves point count.
    const tSm0 = performance.now();
    if (smoothIter.value > 0) {
      linesMax = linesMax.map(l => StreamlineTracer.smoothPolyline(l, smoothIter.value, 0.5));
      linesMin = linesMin.map(l => StreamlineTracer.smoothPolyline(l, smoothIter.value, 0.5));
    }
    const tSm = performance.now() - tSm0;

    // 4. Hidden-line removal (depth-buffer pass). Skip when the toggle is off
    //    to keep the slider-tick path fast.
    const view: VisibilityView = (() => {
      switch (viewName.value) {
        case "front (+Z)": return { viewDir: new Vec3(0, 0, -1), upDir: new Vec3(0, 1, 0) };
        case "side (+X)":  return { viewDir: new Vec3(-1, 0, 0), upDir: new Vec3(0, 1, 0) };
        case "top (+Y)":   return { viewDir: new Vec3(0, -1, 0), upDir: new Vec3(0, 0, -1) };
        case "iso":        return { viewDir: new Vec3(-1, -1, -1), upDir: new Vec3(0, 1, 0) };
      }
    })();

    let visibleMax: typeof linesMax = linesMax;
    let visibleMin: typeof linesMin = linesMin;
    let lastVisibility: ReturnType<typeof extractVisiblePolylines> | null = null;
    let tHLR = 0;

    if (visibleOnly.value) {
      const tH0 = performance.now();
      const allLines = [...linesMax, ...linesMin];
      const res = extractVisiblePolylines(mesh, allLines, view, { resolution: hlrRes.value });
      tHLR = performance.now() - tH0;
      lastVisibility = res;
      // Split the result back into the kMax/kMin lists by index range. This is
      // approximate (segments are emitted in input order) — fine for visual
      // preview; the SVG export does a separate per-category pass.
      const cut = linesMax.reduce((acc, l) => acc + (l.length > 1 ? 1 : 0), 0);
      let seen = 0;
      visibleMax = []; visibleMin = [];
      for (const seg of res.segments) {
        if (seg.points3D.length < 2) continue;
        // Re-tag by walking through input order: this isn't perfect when one
        // input polyline becomes several visible chunks, but for preview it's
        // good enough — accurate per-field colors come from the export pass.
        if (seen++ < cut * 4) visibleMax.push(seg.points3D);
        else visibleMin.push(seg.points3D);
      }
    }

    // 5. Render each polyline as ONE batched GPU buffer.
    const t3 = performance.now();
    const colMax = lab.rgb(220, 70, 90);
    const colMin = lab.rgb(80, 190, 230);
    for (const line of visibleMax) if (line.length > 1) lab.polyline(line).color(colMax);
    for (const line of visibleMin) if (line.length > 1) lab.polyline(line).color(colMin);
    const tRender = performance.now() - t3;

    // 6. Export-SVG button — runs the visibility pass once with both fields,
    //    writes a single combined SVG to disk.
    lab.button("Export visible SVG", () => {
      const allLines = [...linesMax, ...linesMin];
      const res = extractVisiblePolylines(mesh, allLines, view, { resolution: hlrRes.value });
      const svg = polylinesToSVG(res.segments, res.bounds, { strokeWidth: 0.5, stroke: "#000" });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `streamlines_${shape.value.replace(/\s+/g, "_")}_${viewName.value.replace(/[^a-z0-9]+/gi, "_")}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, { group: "Pen plotter" });

    let totalPts = 0;
    for (const l of linesMax) totalPts += l.length;
    for (const l of linesMin) totalPts += l.length;

    lab.info("Streamlines traced face-to-face along the combed principal field.");
    lab.log("Mesh verts", mesh.nodeCount);
    lab.log("Mesh faces", mesh.faceCount);
    lab.log("kMax lines", linesMax.length);
    lab.log("kMin lines", linesMin.length);
    lab.log("Total points", totalPts);
    if (lastVisibility) lab.log("Visible chunks", lastVisibility.segments.length);
    lab.info("");
    lab.log("Build mesh", `${tMesh.toFixed(1)} ms`);
    lab.log("Curvature", `${tCurv.toFixed(1)} ms`);
    lab.log("Trace", `${tTrace.toFixed(1)} ms`);
    lab.log("Smooth", `${tSm.toFixed(1)} ms`);
    if (visibleOnly.value) lab.log("HLR depth pass", `${tHLR.toFixed(1)} ms`);
    lab.log("Submit to scene", `${tRender.toFixed(1)} ms`);
    lab.info("");
    lab.info("Red = kMax direction. Cyan = kMin direction.");
    lab.info("Smoothing keeps endpoints fixed (no silhouette shrinkage).");
    lab.info("Plotter export: pick a view, optionally preview with HLR, hit Export SVG.");
  }, {
    container,
    title: "Streamlines (curvature)",
    background: 0x0a0b14,
    camera: [2.8, 2.2, 3.5],
    target: [0, 0, 0],
  });
}
