/**
 * Markup in any app: `markup(renderer, scene)` mounts the same overlay the shells have over
 * a renderer an app built itself (the Custom Viewer page), and a mark resolves to the record
 * under it.
 */
import { expect, test } from "@playwright/test";

test("an app without a shell gets ✎ Markup, and a mark names the record under it", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=custom-viewer");
  await page.waitForFunction(() => !!(window as any).customViewer, null, { timeout: 15_000 });
  // The viewer toolbar sits in the app's own header.
  await expect(page.getByRole("button", { name: "Ghost" }).first()).toBeVisible();

  await page.getByRole("button", { name: /Markup/ }).click();
  const at = await page.evaluate(() => {
    const r = (window as any).customViewer.renderer;
    r.render();
    const p = r.worldToScreen({ x: 0, y: -1.2, z: 2.5 });              // block B's front face
    const rect = r.canvasEl.getBoundingClientRect();
    return { x: rect.left + p.x, y: rect.top + p.y };
  });
  await page.mouse.click(at.x, at.y);
  const note = page.getByPlaceholder(/note for 1/);
  await note.fill("make it taller");
  await note.press("Enter");

  const bundle = await page.evaluate(async () => (await (window as any).customViewer.markup.capture({ save: false })).markup);
  expect(bundle.marks).toHaveLength(1);
  expect(bundle.marks[0]).toMatchObject({ note: "make it taller", kind: "point" });
  expect(bundle.marks[0].hits[0]).toMatchObject({ key: "blocks/B", label: "block B" });
  expect(bundle.scene.shownObjects).toBe(3);
  expect(errors).toEqual([]);
});
