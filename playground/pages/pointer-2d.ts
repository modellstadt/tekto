/**
 * Pointer Input (sketch2d) — drag handles around to shape a polygon.
 *
 * Demonstrates the sketch2d pointer API: `lab.onPointerDown / onPointerMove /
 * onPointerUp`, each receiving `{ x, y, id }` in canvas CSS-pixels, unified
 * across mouse + touch + pen. The `id` lets several fingers drag different
 * handles at once (try it on a touchscreen). `lab.animate(() => {})` keeps the
 * canvas redrawing every frame so drags show live — pointer events themselves
 * don't trigger a redraw.
 *
 * This is also the canonical "2D interactive app" example: a page that returns
 * a Sketch2DInstance instead of a 3D SketchInstance. The testbench hides the
 * render/lighting/sun controls for it automatically.
 */
import { sketch2d, Sketch2DInstance, Vec2 } from "../../src";

export default function (container: HTMLElement): Sketch2DInstance {
  const points: Vec2[] = [];
  const dragging = new Map<number, number>(); // pointerId -> point index

  return sketch2d((lab) => {
    const handleR = lab.slider("Handle radius", 8, 40, 18, { step: 1 });
    const fill = lab.toggle("Fill polygon", true);
    const link = lab.toggle("Link points", true);
    lab.button("Clear", () => { points.length = 0; dragging.clear(); });

    // Nearest handle within grab radius, or -1.
    function grab(x: number, y: number): number {
      let best = -1, bestD = handleR.value * handleR.value;
      for (let i = 0; i < points.length; i++) {
        const dx = points[i].x - x, dy = points[i].y - y, d = dx * dx + dy * dy;
        if (d <= bestD) { bestD = d; best = i; }
      }
      return best;
    }

    lab.onPointerDown((p) => {
      let idx = grab(p.x, p.y);
      if (idx < 0) { points.push(lab.vec2(p.x, p.y)); idx = points.length - 1; }
      dragging.set(p.id, idx);                    // track this finger
      lab.canvas.setPointerCapture(p.id);         // keep the drag if it leaves the canvas
    });
    lab.onPointerMove((p) => {
      const idx = dragging.get(p.id);
      if (idx != null) points[idx] = lab.vec2(p.x, p.y);
    });
    lab.onPointerUp((p) => { dragging.delete(p.id); });

    lab.draw((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        if (points.length >= 3) ctx.closePath();
        if (fill.value && points.length >= 3) { ctx.fillStyle = "rgba(56,217,169,.16)"; ctx.fill(); }
        if (link.value) { ctx.strokeStyle = "#38d9a9"; ctx.lineWidth = 2; ctx.stroke(); }
      }

      const active = new Set(dragging.values());
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        ctx.beginPath(); ctx.arc(pt.x, pt.y, handleR.value, 0, Math.PI * 2);
        ctx.fillStyle = active.has(i) ? "#ffd479" : "#4dabf7"; ctx.fill();
        ctx.fillStyle = "#07080e"; ctx.font = "600 11px ui-monospace, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), pt.x, pt.y);
      }

      ctx.fillStyle = "#7a80a0"; ctx.font = "13px ui-monospace, monospace";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(
        points.length
          ? "Drag a handle · tap empty space to add one · multi-touch drags several at once"
          : "Tap to drop a point, then drag it. Multi-touch works.",
        16, 16,
      );

      lab.log("Points", points.length);
      lab.log("Active drags", dragging.size);
    });

    // Pointer events don't auto-redraw; this keeps drag feedback live.
    lab.animate(() => {});
  }, { container, title: "Pointer Input", background: "#0a0a12" });
}
