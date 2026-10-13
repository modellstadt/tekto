/**
 * The Site Editor page: the retained model in a real browser — Doc, bindScene, selection by
 * click with highlight, sliders editing the selection, keyboard undo, delete, save, and a
 * snapshot that names the records an agent would edit.
 */
import { expect, test, type Page } from "@playwright/test";

type Editor = { doc: any; selection: any; blocks: any };
/** Run `fn` in the page against the editor's document and selection. */
const ed = <T>(page: Page, fn: (e: Editor) => T) => page.evaluate(`(${fn.toString()})(window.siteEditor)`) as Promise<T>;

async function open(page: Page) {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
}

/** Click a block in the viewport (its centre, projected). */
async function clickBlock(page: Page, id: string, mods: ("Shift" | "ControlOrMeta")[] = []) {
  const at = await page.evaluate((id) => {
    const { doc } = (window as any).siteEditor;
    const b = doc.get("blocks", id);
    const r = (window as any).__tekto.owner.renderer;
    const p = r.worldToScreen({ x: b.x, y: b.y, z: b.h / 2 });
    const rect = r.canvasEl.getBoundingClientRect();
    return { x: rect.left + p.x, y: rect.top + p.y };
  }, id);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.click(at.x, at.y);
  for (const m of mods) await page.keyboard.up(m);
}

test("add, select by click, resize as one undo step, delete and undo", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await open(page);
  const first = await ed(page, (e) => e.doc.ids("blocks")[0]);

  // Add: a second block, selected.
  await page.getByRole("button", { name: "Add block" }).click();
  expect(await ed(page, (e) => e.doc.count("blocks"))).toBe(2);
  const second = await ed(page, (e) => e.doc.ids("blocks")[1]);
  expect(await ed(page, (e) => e.selection.keys())).toEqual([`blocks/${second}`]);

  // Click the first block: it is selected and highlighted.
  await clickBlock(page, first);
  expect(await ed(page, (e) => e.selection.keys())).toEqual([`blocks/${first}`]);
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.marks.selectionMaterials.size)).toBeGreaterThan(0);

  // Shift-click adds the second.
  await clickBlock(page, second, ["Shift"]);
  expect((await ed(page, (e) => e.selection.keys())).sort()).toEqual([`blocks/${first}`, `blocks/${second}`].sort());
  await clickBlock(page, second, ["Shift"]);              // and removes it again

  // A slider drag on Height: many writes, one undo step.
  for (const h of [7, 8, 9, 10, 11, 12]) await page.evaluate((h) => (window as any).__tekto.setParams({ Height: h }), h);
  expect(await ed(page, (e) => e.doc.get("blocks", e.selection.ids("blocks")[0]).h)).toBe(12);
  await page.keyboard.press("ControlOrMeta+z");
  expect(await page.evaluate((id) => (window as any).siteEditor.doc.get("blocks", id).h, first)).toBe(6);

  // Delete with the key, bring it back with undo.
  await clickBlock(page, first);
  await page.keyboard.press("Delete");
  expect(await ed(page, (e) => e.doc.count("blocks"))).toBe(1);
  await page.keyboard.press("ControlOrMeta+z");
  expect(await page.evaluate((id) => (window as any).siteEditor.doc.has("blocks", id), first)).toBe(true);

  // The status line says what Undo would do.
  await expect(page.getByText(/2 blocks · \d selected/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("save writes the document as JSON; a snapshot names the records", async ({ page }) => {
  await open(page);
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save JSON" }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/^site-\d{8}-\d{4}\.json$/);
  expect(await dl.failure()).toBeNull();

  const m = await page.evaluate(() => (window as any).__tekto.snapshot({ save: false }).then((b: any) => b.markup));
  const id = await ed(page, (e) => e.doc.ids("blocks")[0]);
  expect(m.harness).toBe("appShell");
  expect(m.scene.objects.some((o: any) => o.key === `blocks/${id}`)).toBe(true);
});
