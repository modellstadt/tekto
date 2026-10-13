/**
 * The renderer's quality features, folded in from Viewport: crease lines built a frame at a
 * time (and finished for a snapshot), the sun's shadow camera framed to the content,
 * selection as outlines, and hover.
 */
import { expect, test, type Page } from "@playwright/test";


async function openShell(page: Page) {
  await page.goto("/testbench.html?page=app-shell");
  await page.waitForFunction(() => (window as any).__tekto?.owner?.scene.all().length >= 12, null, { timeout: 15_000 });
}

test("hidden line queues its creases, draws them in, and a snapshot waits for them", async ({ page }) => {
  await openShell(page);
  const queued = await page.evaluate(() => {
    const o = (window as any).__tekto.owner;
    o.scene.setRenderMode("hiddenline");
    return o.renderer.pendingEdges;                        // nothing built yet: the switch didn't stall
  });
  expect(queued).toBeGreaterThanOrEqual(12);
  await expect.poll(() => page.evaluate(() => (window as any).__tekto.owner.renderer.pendingEdges)).toBe(0);

  const afterSnapshot = await page.evaluate(() => {
    const o = (window as any).__tekto.owner;
    o.scene.setRenderMode("ghost");
    const before = o.renderer.pendingEdges;
    o.renderer.snapshotPng();
    let lines = 0;
    o.renderer.threeScene.traverse((c: any) => { if (c.isLineSegments && c.geometry.getAttribute("position")?.count) lines++; });
    return { before, after: o.renderer.pendingEdges, lines };
  });
  expect(afterSnapshot.before).toBeGreaterThan(0);
  expect(afterSnapshot.after).toBe(0);
  expect(afterSnapshot.lines).toBeGreaterThanOrEqual(12);
});

test("in Studio the sun's shadow camera frames the content, not a fixed 30 m box", async ({ page }) => {
  await openShell(page);
  const frame = () => page.evaluate(() => {
    const rr = (window as any).__tekto.owner.renderer;
    rr.render();
    const sc = rr.dirLight.shadow.camera;
    return { right: sc.right, targetZ: rr.dirLight.target.position.z };
  });
  await page.evaluate(() => (window as any).__tekto.owner.scene.setLightingMode("studio"));
  const tower = await frame();                              // 12 floors, 0.7 m apart, 4 × 2.4 m slabs
  expect(tower.right).toBeGreaterThan(4);
  expect(tower.right).toBeLessThan(10);
  expect(tower.targetZ).toBeCloseTo(11 * 0.7 / 2, 0);
  await page.evaluate(() => (window as any).__tekto.setParams({ Floors: 40 }));
  await page.waitForTimeout(100);
  expect((await frame()).right).toBeGreaterThan(tower.right * 2);   // a taller tower, a bigger frame
});

test("selection as outlines leaves the colour alone; outlines go with their object; hover", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const state = () => page.evaluate(() => {
    const { doc, blocks } = (window as any).siteEditor;
    const rr = (window as any).__tekto.owner.renderer;
    const id = doc.ids("blocks")[0];
    const group = id ? rr.getThreeObject(blocks.objectsOf(id)[0]) : null;
    const surface = group?.children.find((c: any) => c.userData.surface);
    return { outlines: rr.outlineGroup.children.length, emissive: surface?.material.emissive.getHex() ?? null };
  });

  await page.evaluate(() => (window as any).__tekto.owner.renderer.setSelectionStyle("outline"));
  await page.evaluate(() => { const { doc, selection } = (window as any).siteEditor; selection.select([`blocks/${doc.ids("blocks")[0]}`]); });
  const lit = await state();
  expect(lit.outlines).toBeGreaterThan(0);
  expect(lit.emissive).toBe(0);                              // no tint: the emissive stays black

  await page.evaluate(() => { const { doc } = (window as any).siteEditor; doc.remove("blocks", doc.ids("blocks")[0]); });
  await page.waitForTimeout(50);
  expect((await state()).outlines).toBe(0);
  await page.evaluate(() => (window as any).siteEditor.doc.undo());

  // Hover: the object under the pointer, reported on change.
  await page.evaluate(() => {
    (window as any).__hovered = [];
    (window as any).__tekto.owner.renderer.onHover((id: string | null) => (window as any).__hovered.push(id));
  });
  const at = await page.evaluate(() => {
    const { doc } = (window as any).siteEditor;
    const b = doc.get("blocks", doc.ids("blocks")[0]);
    const rr = (window as any).__tekto.owner.renderer;
    const p = rr.worldToScreen({ x: b.x, y: b.y, z: b.h / 2 });
    const rect = rr.canvasEl.getBoundingClientRect();
    return { x: rect.left + p.x, y: rect.top + p.y, left: rect.left + 8, top: rect.top + 8 };
  });
  await page.mouse.move(at.left, at.top);
  await page.waitForTimeout(60);
  await page.mouse.move(at.x, at.y);
  await expect.poll(() => page.evaluate(() => (window as any).__hovered.filter(Boolean).length)).toBeGreaterThan(0);
  await page.waitForTimeout(60);
  await page.mouse.move(at.left, at.top);
  await expect.poll(() => page.evaluate(() => (window as any).__hovered.at(-1))).toBeNull();
});
