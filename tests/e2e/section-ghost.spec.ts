/**
 * Section cuts and ghost mode on the one renderer: the appShell top bar's Cut popover and
 * Ghost button, picking that ignores what the cut removed, poché on opaque surfaces only,
 * a ghosted selection drawn solid, and the testbench's Cut control on a sketch() page.
 */
import { expect, test, type Page } from "@playwright/test";

/** Pick at the screen point of a world position; returns the scene id or null. */
const pickWorld = (page: Page, p: [number, number, number]) => page.evaluate(([x, y, z]) => {
  const r = (window as any).__tekto.owner.renderer;
  const s = r.worldToScreen({ x, y, z });
  const rect = r.canvasEl.getBoundingClientRect();
  r.render();
  return r.pickAt(rect.left + s.x, rect.top + s.y) as string | null;
}, p);

test("appShell: Cut cuts the tower, picking skips what is gone; Ghost and Flip", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=app-shell");
  await page.waitForFunction(() => (window as any).__tekto?.owner?.scene.all().length >= 12, null, { timeout: 15_000 });
  const top: [number, number, number] = [0, 0, 11 * 0.7];       // 12 floors, 0.7 m apart
  const bottom: [number, number, number] = [0, 0, 0];
  expect(await pickWorld(page, top)).not.toBeNull();

  await page.getByRole("button", { name: "Cut ▾" }).click();
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.section)).toEqual({ axis: "z", at: 0.5, flip: false });
  expect(await pickWorld(page, top)).toBeNull();                  // above the cut: gone
  expect(await pickWorld(page, bottom)).not.toBeNull();

  await page.getByLabel("Keep the other side").check();
  expect(await pickWorld(page, top)).not.toBeNull();
  expect(await pickWorld(page, bottom)).toBeNull();

  await page.getByRole("button", { name: "Ghost" }).click();
  expect(await page.evaluate(() => (window as any).__tekto.owner.scene.renderMode)).toBe("ghost");

  await page.getByRole("button", { name: "Off", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.section)).toBeNull();
  expect(await pickWorld(page, bottom)).not.toBeNull();
  expect(errors).toEqual([]);
});

test("ghost draws a selection solid; poché only on opaque surfaces, none in ghost", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const surface = () => page.evaluate(() => {
    const { doc, blocks } = (window as any).siteEditor;
    const r = (window as any).__tekto.owner.renderer;
    const group = r.getThreeObject(blocks.objectsOf(doc.ids("blocks")[0])[0]);
    const s = group.children.find((c: any) => c.userData.surface);
    return { opacity: s.material.opacity, depthWrite: s.material.depthWrite, poche: group.children.some((c: any) => c.userData.poche) };
  });

  await page.evaluate(() => (window as any).__tekto.owner.scene.setRenderMode("ghost"));
  expect(await surface()).toMatchObject({ depthWrite: false });
  expect((await surface()).opacity).toBeLessThan(0.2);
  await page.evaluate(() => { const { doc, selection } = (window as any).siteEditor; selection.select([`blocks/${doc.ids("blocks")[0]}`]); });
  expect(await surface()).toMatchObject({ opacity: 0.85, depthWrite: true });
  await page.evaluate(() => (window as any).siteEditor.selection.clear());
  expect((await surface()).opacity).toBeLessThan(0.2);

  await page.evaluate(() => (window as any).__tekto.owner.renderer.setSection({ axis: "z", coordinate: 3 }));
  expect((await surface()).poche).toBe(false);                    // ghost: see-through, no fill
  await page.evaluate(() => (window as any).__tekto.owner.scene.setRenderMode("solid"));
  expect((await surface()).poche).toBe(true);                     // rebuilt for the mode, and cut again
});

test("testbench: Cut and Ghost reach a sketch() page, and the cut survives a re-run", async ({ page }) => {
  await page.goto("/testbench.html?page=mesh-factory");
  await page.waitForFunction(() => (window as any).__tekto?.harness === "sketch", null, { timeout: 15_000 });
  await page.selectOption("#section-axis", "z");
  await page.locator("#section-at").evaluate((el: HTMLInputElement) => { el.value = "30"; el.dispatchEvent(new Event("input")); });
  const section = () => page.evaluate(() => (window as any).__tekto.owner.renderer.section);
  expect(await section()).toEqual({ axis: "z", at: 0.3 });
  await page.selectOption("#render-mode", "ghost");
  expect(await page.evaluate(() => (window as any).__tekto.owner.scene.renderMode)).toBe("ghost");

  // A slider re-runs the sketch: every object is rebuilt, and the cut stays on them.
  const slider = (await page.evaluate(() => (window as any).__tekto.schema())).find((p: any) => p.type === "float" || p.type === "int");
  expect(slider).toBeTruthy();
  await page.evaluate(([n, v]) => (window as any).__tekto.setParams({ [n]: v }), [slider.name, slider.max] as const);
  await page.waitForTimeout(100);
  expect(await section()).toEqual({ axis: "z", at: 0.3 });
  const clipped = await page.evaluate(() => {
    let n = 0;
    (window as any).__tekto.owner.renderer.threeScene.traverse((o: any) => { if (o.material?.clippingPlanes?.length) n++; });
    return n;
  });
  expect(clipped).toBeGreaterThan(0);
});
