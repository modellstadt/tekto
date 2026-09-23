/**
 * Every playground page must mount, draw, and stay silent.
 *
 * Cheap to keep, and it catches what unit tests cannot: a renderer path that
 * throws in the browser (a three.js API that moved, a shader that fails to
 * compile, a missing export). Add a slug here when you add a page.
 */
import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  "primitives", "transforms", "lines-points", "shape-modes", "colors",
  "mesh-factory", "curves", "nurbs-surfaces", "mesh-ops", "curvature", "streamlines", "bsp-csg",
  "sdf", "graph", "planar-graph", "voxel-2d",
  "particles", "camera", "gizmo",
  "pointer-2d",
  "timber", "viewport", "dxf-test", "dxf-3d",
] as const;

/** Console errors and uncaught exceptions seen since the call. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

/** A canvas that is actually on screen and has a drawing buffer. */
async function expectLiveCanvas(page: Page) {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const size = await canvas.evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
  expect(size[0]).toBeGreaterThan(0);
  expect(size[1]).toBeGreaterThan(0);
}

for (const slug of PAGES) {
  test(`page ${slug} renders without errors`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/testbench.html?page=${slug}`);
    await expectLiveCanvas(page);
    await page.waitForTimeout(600); // a few animation frames
    expect(errors, `console errors on ${slug}`).toEqual([]);
  });
}

test("the page chooser switches pages", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/testbench.html?page=primitives");
  await expectLiveCanvas(page);
  await page.getByRole("combobox").first().selectOption("sdf");
  await expect(page).toHaveURL(/page=sdf/);
  await expectLiveCanvas(page);
  expect(errors).toEqual([]);
});

test("a slider re-runs the sketch with the new value", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/testbench.html?page=mesh-factory");
  await expectLiveCanvas(page);

  // The page's own slider (.tekto-slider) — not the sun control in the top bar.
  const slider = page.locator("input.tekto-slider").first();
  const { min, max, step } = await slider.evaluate((el: HTMLInputElement) => ({
    min: Number(el.min), max: Number(el.max), step: Number(el.step) || 1,
  }));
  const target = Math.min(max, min + Math.max(step, Math.round((max - min) / 2)));

  await slider.evaluate((el: HTMLInputElement, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, target);

  // window.__tekto is the handle agents drive (tools/snap.mjs uses it too):
  // it reports the values the sketch actually ran with.
  await expect
    .poll(() => page.evaluate(() => Object.values((window as any).__tekto.params() as Record<string, unknown>)))
    .toContain(target);
  expect(errors).toEqual([]);
});

test("the render mode and lighting controls apply", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/testbench.html?page=mesh-factory");
  await expectLiveCanvas(page);
  await page.getByRole("combobox").nth(1).selectOption("wireframe"); // RENDER
  await page.waitForTimeout(300);
  await page.getByRole("combobox").nth(2).selectOption("studio");    // LIGHT
  await page.waitForTimeout(500);
  await expectLiveCanvas(page);
  expect(errors).toEqual([]);
});
