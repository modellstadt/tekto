/**
 * Notes that live with the model: Markup's marks kept as notes in the document, drawn over
 * the view with a pin each, opened, gone back to, undone and deleted like any edit.
 */
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  await page.evaluate(() => {                                         // start from no notes (the doc persists locally)
    const { doc } = (window as any).siteEditor;
    for (const id of doc.ids("notes")) doc.remove("notes", id);
  });
}

/** The screen point of a world position, in page coordinates. */
const screenOf = (page: Page, p: { x: number; y: number; z: number }) => page.evaluate((p) => {
  const r = (window as any).__tekto.owner.renderer;
  r.render();
  const s = r.worldToScreen(p);
  const rect = r.canvasEl.getBoundingClientRect();
  return { x: rect.left + s.x, y: rect.top + s.y };
}, p);

test("Markup's marks are kept as notes with the model, pinned, and come back from any view", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await open(page);
  const block = await page.evaluate(() => { const { doc } = (window as any).siteEditor; const id = doc.ids("blocks")[0]; return { id, ...doc.get("blocks", id) }; });

  // Mark the block, write the note, keep it.
  await page.getByRole("button", { name: /Markup/ }).click();
  const at = await screenOf(page, { x: block.x, y: block.y, z: block.h / 2 });
  await page.mouse.click(at.x, at.y);
  const input = page.getByPlaceholder(/note for 1/);
  await input.fill("check the setback here");
  await input.press("Enter");
  await page.getByRole("button", { name: "Keep as notes" }).click();
  await page.getByRole("button", { name: "Done" }).click();

  const kept = await page.evaluate(() => (window as any).siteEditor.doc.all("notes").map(([, n]: [string, any]) => n));
  expect(kept).toHaveLength(1);
  expect(kept[0]).toMatchObject({ text: "check the setback here", keys: [`blocks/${block.id}`] });
  expect(kept[0].strokes[0].length).toBeGreaterThan(0);

  // A pin numbered 1, still on the note after the camera moves.
  const pin = page.locator("button[data-note]");
  await expect(pin).toHaveText("1");
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setView("top", { animate: false }));
  await expect(pin).toBeVisible();
  const pinAt = await screenOf(page, { x: kept[0].pin[0], y: kept[0].pin[1], z: kept[0].pin[2] });   // draws the new view
  const pinBox = (await pin.boundingBox())!;
  expect(Math.abs(pinBox.x + pinBox.width / 2 - pinAt.x)).toBeLessThan(2);

  // Open it; "Go to view" brings back the camera it was drawn from.
  await pin.click();
  await expect(page.locator("[data-note-card]")).toContainText("check the setback here");
  const card = page.locator("[data-note-card]");
  await card.getByRole("button", { name: "Go to view" }).click();
  const cam = await page.evaluate(() => (window as any).__tekto.owner.renderer.cameraState().position);
  kept[0].view.position.forEach((v: number, i: number) => expect(cam[i]).toBeCloseTo(v, 3));

  // Undo takes the note away like any edit, redo brings it back; Delete removes it.
  await page.evaluate(() => (window as any).siteEditor.doc.undo());
  await expect(pin).toHaveCount(0);
  await page.evaluate(() => (window as any).siteEditor.doc.redo());
  await expect(pin).toHaveCount(1);
  await pin.click();
  await card.getByRole("button", { name: "Delete" }).click();
  await expect(pin).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).siteEditor.doc.count("notes"))).toBe(0);
  expect(errors).toEqual([]);
});
