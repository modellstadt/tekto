/**
 * A snapshot of the view as a person sees it: the 3D frame with the overlay canvases drawn
 * over it (`data-tekto-overlay`: notes, a drawing over a sketch), and saving it as a PNG.
 */
import { download } from "../io/download";

/** The 3D view as a PNG, with every visible overlay canvas (`data-tekto-overlay`) in `wrap`
 *  drawn over it where it sits — what a person sees, for snapshots and ✎ Markup. */
export function snapshotWithOverlays(renderer: { snapshotPng(): string; readonly canvasEl: HTMLCanvasElement }, wrap: HTMLElement): string {
  const base = renderer.snapshotPng();
  const shown = [...wrap.querySelectorAll<HTMLCanvasElement>("canvas[data-tekto-overlay]")].filter(c => c.getClientRects().length > 0);
  if (!shown.length) return base;
  const src = renderer.canvasEl, r0 = src.getBoundingClientRect(), k = src.width / Math.max(1, r0.width);
  const out = document.createElement("canvas");
  out.width = src.width; out.height = src.height;
  const g = out.getContext("2d")!;
  g.drawImage(src, 0, 0);                     // drawn in the same task as the render, so the buffer still holds it
  for (const c of shown) {
    const r = c.getBoundingClientRect();
    g.drawImage(c, (r.left - r0.left) * k, (r.top - r0.top) * k, r.width * k, r.height * k);
  }
  return out.toDataURL("image/png");
}

/** Save the view (with its overlays) as a PNG, named `fileName` with a date-time stamp. */
export function downloadSnapshot(renderer: { snapshotPng(): string; readonly canvasEl: HTMLCanvasElement }, wrap: HTMLElement, fileName = "view.png"): void {
  const url = snapshotWithOverlays(renderer, wrap);
  const bytes = Uint8Array.from(atob(url.slice(url.indexOf(",") + 1)), (c) => c.charCodeAt(0));
  download(bytes, fileName, { stamp: true, type: "image/png" });
}
