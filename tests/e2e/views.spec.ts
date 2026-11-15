/**
 * Named views and the axis widget on the one renderer: setView puts the camera where a plan
 * or an elevation needs it, a click on an axis ball turns there, the widget's projection
 * toggle and the appShell Cam control agree, Iso is orthographic from the diagonal, and a
 * sketch() has no widget unless it asks.
 */
import { expect, test, type Page } from "@playwright/test";

/** The camera's direction from its target, rounded. */
const viewDir = (page: Page) => page.evaluate(() => {
  const r = (window as any).__tekto.owner.renderer;
  const c = r.activeCamera.position, t = r.controls.target;
  const d = [c.x - t.x, c.y - t.y, c.z - t.z];
  const n = Math.hypot(...d);
  return d.map(v => Math.round((v / n) * 100) / 100 + 0);     // + 0: no -0
});

async function openShell(page: Page) {
  await page.goto("/testbench.html?page=app-shell");
  await page.waitForFunction(() => (window as any).__tekto?.owner?.scene.all().length >= 12, null, { timeout: 15_000 });
}

test("setView: a plan looks down with north up, elevations look level", async ({ page }) => {
  await openShell(page);
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setView("top", { animate: false }));
  expect(await viewDir(page)).toEqual([0, 0, 1]);
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setView("front", { animate: false }));
  expect(await viewDir(page)).toEqual([0, -1, 0]);
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setView("right"));   // animated
  await expect.poll(() => viewDir(page)).toEqual([1, 0, 0]);
});

test("the axis widget turns the view; its projection toggle and the Cam control agree", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await openShell(page);
  const widget = page.locator("svg").filter({ has: page.locator("text", { hasText: /^X$/ }) });
  await expect(widget).toBeVisible();

  await widget.locator("g").filter({ has: page.locator("text", { hasText: /^X$/ }) }).click();
  await expect.poll(() => viewDir(page)).toEqual([1, 0, 0]);

  await page.getByRole("button", { name: "persp", exact: true }).click();          // the widget's toggle
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.projection)).toBe("orthographic");
  const lit = (name: string) => page.getByRole("button", { name, exact: true }).evaluate((b: HTMLElement) => b.style.background !== "transparent");
  expect(await lit("Ortho")).toBe(true);
  expect(await lit("Persp")).toBe(false);

  await page.getByRole("button", { name: "Persp", exact: true }).click();          // the top bar
  expect(await page.getByRole("button", { name: "persp", exact: true }).textContent()).toBe("persp");

  await page.getByRole("button", { name: "Iso", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.projection)).toBe("orthographic");
  await expect.poll(() => viewDir(page)).toEqual([0.58, -0.58, 0.58]);
  expect(errors).toEqual([]);
});

test("the axis widget hides in a strict-2D view and comes back with rotation", async ({ page }) => {
  await openShell(page);
  const widget = page.locator("svg").filter({ has: page.locator("text", { hasText: /^X$/ }) });
  await expect(widget).toBeVisible();
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setOrbitRotateEnabled(false));
  await expect(widget).toBeHidden();
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setOrbitRotateEnabled(true));
  await expect(widget).toBeVisible();
});

test("a sketch() has no axis widget unless it asks for one", async ({ page }) => {
  await page.goto("/testbench.html?page=mesh-factory");
  await page.waitForFunction(() => (window as any).__tekto?.harness === "sketch", null, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "persp", exact: true })).toHaveCount(0);
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setView("top", { animate: false }));
  expect(await viewDir(page)).toEqual([0, 1, 0]);        // Y-up: the plan looks down -Y
});

test("walkTo stands inside with a wide lens; a view gives the lens back and stands clear", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const cam = () => page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer;
    const c = r.activeCamera, t = r.controls.target;
    return { fov: c.fov, dist: c.position.distanceTo(t), inside: r.inside, z: c.position.z };
  });
  const outside = await cam();
  await page.evaluate(() => {
    const { doc } = (window as any).siteEditor;
    const b = doc.get("blocks", doc.ids("blocks")[0]);
    (window as any).__tekto.owner.renderer.walkTo({ x: b.x - 1, y: b.y, z: 1.6 }, { x: b.x + 1, y: b.y, z: 1.6 }, { animate: false });
  });
  expect(await cam()).toMatchObject({ fov: 75, inside: true });
  expect((await cam()).dist).toBeCloseTo(2, 5);
  expect((await cam()).z).toBeCloseTo(1.6, 5);

  await page.evaluate(() => (window as any).__tekto.owner.renderer.setView("iso", { animate: false }));
  const back = await cam();
  expect(back).toMatchObject({ fov: outside.fov, inside: false });
  expect(back.dist).toBeGreaterThan(5);                     // the block in view, not a walker's 2 m

  // Animated, the lens widens on the way in.
  await page.evaluate(() => (window as any).__tekto.owner.renderer.walkTo({ x: 0, y: -1, z: 1.6 }, { x: 0, y: 1, z: 1.6 }, { fov: 90 }));
  await expect.poll(async () => (await cam()).fov).toBe(90);
});
