/**
 * lab.overlay() in a sketch(): a 2D view laid over the 3D one survives re-runs (one layer,
 * one canvas), toggles with a control, and shows in the agent's snapshot.
 */
import { expect, test } from "@playwright/test";

test("a sketch's drawing overlay: one layer across re-runs, shown in snapshots", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=sketch-drawing");
  await page.waitForFunction(() => (window as any).__tekto?.harness === "sketch", null, { timeout: 15_000 });
  const overlay = page.locator("canvas[data-tekto-overlay]");
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toBeHidden();

  await page.evaluate(() => (window as any).__tekto.setParams({ Drawing: true }));
  await expect(overlay).toBeVisible();

  // A re-run rebuilds the sheet into the same layer: still one canvas.
  await page.evaluate(() => (window as any).__tekto.setParams({ Steps: 16 }));
  await page.waitForTimeout(100);
  await expect(overlay).toHaveCount(1);

  // The agent sees the drawing (white paper), not the dark 3D view.
  const corner = await page.evaluate(async () => {
    const b = await (window as any).__tekto.snapshot({ save: false });
    const img = new Image();
    img.src = b.cleanPng;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    return [...g.getImageData(4, 4, 1, 1).data.slice(0, 3)];
  });
  expect(Math.min(...corner)).toBeGreaterThan(240);

  await page.evaluate(() => (window as any).__tekto.setParams({ Drawing: false }));
  await expect(overlay).toBeHidden();
  expect(errors).toEqual([]);
});
