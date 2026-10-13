/**
 * The fading grid ground: ruled in round metres for the size of the content, and refitted
 * when the content changes.
 */
import { expect, test } from "@playwright/test";

test("the fading grid follows the content: centred on it, spaced for its size", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const grid = () => page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer;
    r.render();
    const u = r.fadingGrid.mesh.material.uniforms;
    let lineGrids = 0;
    r.threeScene.traverse((o: any) => { if (o.isGridHelper) lineGrids++; });
    return { minor: u.uMinor.value, centre: u.uCentre.value.toArray().map(Math.round), lineGrids };
  });
  // A house-sized block: a metre grid.
  await page.evaluate(() => { const { doc } = (window as any).siteEditor; doc.update("blocks", doc.ids("blocks")[0], { w: 12, d: 10, h: 9 }); });
  expect(await grid()).toMatchObject({ minor: 1, lineGrids: 0 });
  await page.evaluate(() => (window as any).siteEditor.doc.add("blocks", { x: 400, y: 0, w: 4, d: 3, h: 6 }));
  const far = await grid();
  expect(far.minor).toBe(10);                                               // ~200 m across: ten
  expect(far.centre[0]).toBeGreaterThan(150);                               // and centred on it all
});
