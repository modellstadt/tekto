/**
 * Shared selection: two windows on the same Site Editor document (`?shared=1`, the dev
 * server's collab store). What one selects is outlined in the other in the first one's
 * presence colour — and follows the record through a rebuild — and clearing clears it.
 */
import { expect, test, type Page } from "@playwright/test";

const DOC = "site-editor";

async function open(page: Page) {
  await page.goto("/testbench.html?page=site-editor&shared=1");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
}
/** Others' outlines in this window: how many lines, and their colours. */
const othersOutlines = (page: Page) => page.evaluate(() => {
  const marks = (window as any).__tekto.owner.renderer.marks;
  const lines = marks.presenceLines as { line: any }[];
  return { count: lines.length, colors: [...new Set(lines.map(l => "#" + l.line.material.color.getHexString()))] };
});

test("what one window selects is outlined in the other, in its colour", async ({ page, context, request }) => {
  // A fresh shared document: one block.
  const reset = await request.post("/__tekto/collab/put", { data: { doc: DOC, key: "blocks/e2e1", value: { x: 0, y: 0, w: 4, d: 3, h: 6 }, by: "e2e" } });
  expect(reset.ok()).toBe(true);
  await open(page);
  const other = await context.newPage();
  await open(other);

  const key = "blocks/e2e1";                                       // the record this test owns
  await page.evaluate((k) => (window as any).siteEditor.selection.select([k]), key);
  await expect.poll(async () => (await othersOutlines(other)).count, { timeout: 10_000 }).toBeGreaterThan(0);
  // …in the colour the other window has for the first one's presence.
  const theirColor = await other.evaluate((k) => (window as any).siteEditor.doc.store.others
    .find((p: any) => (p.state.selection ?? []).includes(k))?.color, key);
  expect((await othersOutlines(other)).colors).toEqual([String(theirColor).toLowerCase()]);
  expect((await othersOutlines(page)).count).toBe(0);              // one's own selection isn't a presence outline

  // The record is rebuilt (resized) in the first window: the outline follows it.
  await page.evaluate((k) => (window as any).siteEditor.doc.update("blocks", k.split("/")[1], { h: 9 }), key);
  await expect.poll(async () => (await othersOutlines(other)).count, { timeout: 10_000 }).toBeGreaterThan(0);

  await page.evaluate(() => (window as any).siteEditor.selection.clear());
  await expect.poll(async () => (await othersOutlines(other)).count, { timeout: 10_000 }).toBe(0);
});
