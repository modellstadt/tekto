/**
 * The Framed Wall page — the one renderer with what the separate Viewport used to do:
 * callouts in the margins that follow their records through a rebuild, a click on a
 * callout selecting its members, fitTo framing a selection (perspective and orthographic),
 * and top-bar controls that follow the state wherever it was changed.
 */
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("/testbench.html?page=framed-wall");
  await page.waitForFunction(() => (window as any).framedWall?.parts.length > 10, null, { timeout: 15_000 });
}
const labels = (page: Page) => page.locator("button[title]").filter({ hasText: /×/ });

test("callouts label each kind of member, follow a rebuild, and select on click", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await open(page);
  await expect.poll(() => labels(page).filter({ visible: true }).count()).toBeGreaterThanOrEqual(3);

  // A rebuild replaces every scene object; the callouts name records, so they stay.
  await page.evaluate(() => (window as any).__tekto.setParams({ "Stud spacing": 0.45 }));
  await page.waitForTimeout(400);
  await expect.poll(() => labels(page).filter({ visible: true }).count()).toBeGreaterThanOrEqual(3);

  await labels(page).filter({ visible: true }).first().click();
  expect(await page.evaluate(() => (window as any).framedWall.selection.size)).toBeGreaterThan(0);

  await page.evaluate(() => (window as any).__tekto.setParams({ Callouts: false }));
  await expect.poll(() => labels(page).filter({ visible: true }).count()).toBe(0);
  expect(errors).toEqual([]);
});

test("fitTo frames a selection, in perspective and in orthographic", async ({ page }) => {
  await open(page);
  const cam = () => page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer;
    const t = r.controls.target, c = r.activeCamera.position;
    return { target: [t.x, t.y, t.z], dist: c.distanceTo(t), zoom: r.activeCamera.zoom };
  });
  const before = await cam();
  const centre = await page.evaluate(() => {
    const { selection } = (window as any).framedWall;
    selection.select(["members/3"]);
    const o = (window as any).__tekto.owner;
    const b = o.renderer.objectBounds(o.scene.byKey("members/3")[0].id);
    return [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2];
  });
  await page.getByRole("button", { name: "Frame selection" }).click();
  await expect.poll(async () => (await cam()).target.map((v, i) => Math.round((v - centre[i]) * 100))).toEqual([0, 0, 0]);
  expect((await cam()).dist).toBeLessThan(before.dist);

  await page.getByRole("button", { name: "Ortho", exact: true }).click();
  const z0 = (await cam()).zoom;
  await page.getByRole("button", { name: "Frame all" }).click();
  await expect.poll(async () => (await cam()).zoom).not.toBe(z0);
});

test("the top bar follows render mode and lighting changed from code", async ({ page }) => {
  await open(page);
  const lit = (name: string) => page.getByRole("button", { name, exact: true }).evaluate((b: HTMLElement) => b.style.background !== "transparent");
  await page.evaluate(() => (window as any).__tekto.owner.scene.setRenderMode("ghost"));
  expect(await lit("Ghost")).toBe(true);
  expect(await lit("Solid")).toBe(false);
  await page.evaluate(() => (window as any).__tekto.owner.scene.setLightingMode("studio"));
  expect(await lit("Studio")).toBe(true);
});
