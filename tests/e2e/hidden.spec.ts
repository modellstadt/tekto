/**
 * A hidden object is hidden from everything the renderer does with it, the way a layer
 * switch means it: not drawn, not picked or hovered, no outline, no callout.
 */
import { expect, test } from "@playwright/test";

test("a hidden object can't be picked, and shows no outline and no callout", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  await page.evaluate(() => {
    const { doc, selection } = (window as any).siteEditor;
    const r = (window as any).__tekto.owner.renderer;
    const key = `blocks/${doc.ids("blocks")[0]}`;
    r.setSelectionStyle("outline");
    selection.select([key]);
    r.setCallouts([{ id: "b", text: "Block", objects: [key] }]);
  });
  const state = () => page.evaluate(() => {
    const { doc, blocks } = (window as any).siteEditor;
    const r = (window as any).__tekto.owner.renderer;
    const b = doc.get("blocks", doc.ids("blocks")[0]);
    const p = r.worldToScreen({ x: b.x, y: b.y, z: b.h / 2 });
    const rect = r.canvasEl.getBoundingClientRect();
    r.render();
    return {
      picked: r.pickAt(rect.left + p.x, rect.top + p.y) === blocks.objectsOf(doc.ids("blocks")[0])[0],
      outlines: r.marks.outlineGroup.children.filter((c: any) => c.visible).length,
    };
  });
  const label = () => page.locator("button[title='Block']").filter({ visible: true }).count();

  expect(await state()).toMatchObject({ picked: true });
  expect((await state()).outlines).toBeGreaterThan(0);
  await expect.poll(label).toBe(1);

  const setVisible = (visible: boolean) => page.evaluate((visible) => {
    const { doc, blocks } = (window as any).siteEditor;
    (window as any).__tekto.owner.scene.setStyle(blocks.objectsOf(doc.ids("blocks")[0])[0], { visible });
  }, visible);
  await setVisible(false);
  expect(await state()).toEqual({ picked: false, outlines: 0 });
  await expect.poll(label).toBe(0);

  await setVisible(true);
  expect(await state()).toMatchObject({ picked: true });
  await expect.poll(label).toBe(1);
});
