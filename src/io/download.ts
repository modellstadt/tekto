/**
 * Save data as a file from the browser — the helper ten apps had each written themselves.
 *
 * Two details the copies got wrong: the object URL must outlive the click (revoking it at
 * once truncates large files in some browsers, because the download reads the URL after
 * `click()` returns), and the anchor must be in the document for Firefox to follow it.
 */

/** "stair.dxf" → "stair-20261013-1542.dxf": a timestamp before the extension. */
export function stampName(fileName: string, date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? `${fileName.slice(0, dot)}-${stamp}${fileName.slice(dot)}` : `${fileName}-${stamp}`;
}

const MIME: Record<string, string> = {
  dxf: "application/dxf", svg: "image/svg+xml", json: "application/json", obj: "model/obj",
  ifc: "application/x-step", csv: "text/csv", txt: "text/plain", png: "image/png", stl: "model/stl",
};

/**
 * Download `data` as `fileName`. Strings and bytes get a MIME type from the extension
 * (override with `type`); `stamp: true` adds a date-time to the name.
 *
 *   download(writeDxf2D(plan), "plan.dxf", { stamp: true });
 */
export function download(
  data: string | Blob | ArrayBuffer | Uint8Array,
  fileName: string,
  opts: { stamp?: boolean; type?: string } = {},
): void {
  const name = opts.stamp ? stampName(fileName) : fileName;
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: opts.type ?? MIME[ext] ?? "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
