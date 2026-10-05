/**
 * Shared editing: two windows on the same dev server edit one document. Dragging a control
 * point in one must move it in the other (SharedStore + devServerAdapter + the collab plugin).
 */
import { expect, test, type Page } from "@playwright/test";

/** The page's log block ("Status online  Online Ann, Bob  Last change p1 by Bob"). */
const log = (page: Page) => page.locator("div").filter({ hasText: /^Status/ }).last();

async function open(page: Page) {
  await page.goto("/testbench.html?page=shared-editing");
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  await expect(log(page)).toContainText(/Status\s*online/, { timeout: 15_000 });
}

/** Screen position of a drag handle (the renderer is reachable through window.__tekto). */
async function handleAt(page: Page, key: string) {
  return page.evaluate((key) => {
    const r = (window as any).__tekto.owner.renderer;
    const h = r.dragHandles.get(key);
    const w = h.getWorldPosition(h.position.clone());
    const s = r.worldToScreen({ x: w.x, y: w.y, z: w.z });
    const rect = r.renderer.domElement.getBoundingClientRect();
    return { x: s.x + rect.left, y: s.y + rect.top };
  }, key);
}

test("a point dragged in one window moves in the other", async ({ page, context }) => {
  const other = await context.newPage();
  await open(page);
  await open(other);
  await expect(log(page)).toContainText(/Online\s*\S+, \S+/);   // two clients

  const at = await handleAt(page, "cp-1");
  const before = await handleAt(other, "cp-1");
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.move(at.x + 60, at.y + 40, { steps: 10 });
  await page.mouse.up();

  await expect(log(other)).toContainText(/Last change\s*p1 by/, { timeout: 5_000 });
  await expect.poll(async () => {
    const now = await handleAt(other, "cp-1");
    return Math.hypot(now.x - before.x, now.y - before.y);
  }, { timeout: 5_000 }).toBeGreaterThan(30);
});
