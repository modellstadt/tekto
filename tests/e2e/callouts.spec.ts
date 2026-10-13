/**
 * Callouts on the one renderer: a label whose words change is redrawn, an element partly in
 * sight keeps its label, and what writes no depth (ghost) hides none.
 */
import { expect, test, type Page } from "@playwright/test";

const labels = (page: Page) => page.locator("button[title]").filter({ hasText: /×/ });

test("a callout whose count changed says the new count", async ({ page }) => {
  await page.goto("/testbench.html?page=framed-floor");
  await page.waitForFunction(() => (window as any).framedFloor?.parts.length > 5, null, { timeout: 15_000 });
  const joistLabel = async () => labels(page).filter({ hasText: /^Joist/ }).first().getAttribute("title");
  const joists = () => page.evaluate(() => (window as any).framedFloor.parts.filter((p: any) => p.role === "joist").length);
  await expect.poll(joistLabel).toContain(`${await joists()} ×`);

  await page.evaluate(() => (window as any).__tekto.setParams({ northSouth: true }));
  const n = await joists();
  await expect.poll(joistLabel).toContain(`${n} ×`);
});

test("a label shows for what is partly in sight, and nothing see-through hides one", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  // From the front: a block, a narrower one wholly behind it, and a wider one whose middle
  // is behind it but whose ends are in sight.
  await page.evaluate(() => {
    const { doc } = (window as any).siteEditor;
    for (const id of doc.ids("blocks")) doc.remove("blocks", id);
    const add = (y: number, w: number, h: number) => doc.add("blocks", { x: 0, y, w, d: 1, h });
    const keys = [add(0, 4, 6), add(6, 3, 4), add(12, 14, 4)].map((id: string) => `blocks/${id}`);
    const r = (window as any).__tekto.owner.renderer;
    r.setView("front", { animate: false });
    r.fitAll();
    r.setCallouts(["Front", "Hidden", "Wide"].map((text, i) => ({ id: text, text, objects: [keys[i]] })));
  });
  const shown = () => page.locator("button[title]").filter({ visible: true })
    .evaluateAll((els) => els.map((e) => e.getAttribute("title")).filter((t) => ["Front", "Hidden", "Wide"].includes(t!)).sort());
  await expect.poll(shown).toEqual(["Front", "Wide"]);
  await page.evaluate(() => (window as any).__tekto.owner.scene.setRenderMode("ghost"));
  await expect.poll(shown).toEqual(["Front", "Hidden", "Wide"]);
});
