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

test("a thin part the cut doesn't reach keeps its colour from afar, in Flat and Studio", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  // A 27 mm deck board, a plan cut 3 m up: nothing of the board is cut. Seen from 60 m off at
  // a low angle, the polygon offset's slope term once pushed its top face behind its own
  // underside, and the poché drawn there showed through (7DHouse's decks went navy).
  await page.evaluate(() => {
    const { doc } = (window as any).siteEditor;
    for (const id of doc.ids("blocks")) doc.remove("blocks", id);
    doc.add("blocks", { x: 0, y: 0, w: 8, d: 10, h: 0.027 });
    const r = (window as any).__tekto.owner.renderer;
    r.setSection({ axis: "z", coordinate: 3 });
    r.setCameraPosition(0, -60, 10);
    r.lookAt(0, 0, 0);
  });
  const pocheAt = () => page.evaluate(async () => {
    const r = (window as any).__tekto.owner.renderer;
    const img = new Image();
    img.src = r.snapshotPng();
    await img.decode();
    const k = img.width / r.canvasEl.getBoundingClientRect().width;
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    const hits: string[] = [];
    for (const [x, y] of [[-3, -4], [0, 0], [3, 4], [2, -3], [-2, 3]]) {
      const p = r.worldToScreen({ x, y, z: 0.027 });
      const d = g.getImageData(Math.round(p.x * k), Math.round(p.y * k), 1, 1).data;
      if (Math.abs(d[0] - 0x1b) < 14 && Math.abs(d[1] - 0x27) < 14 && Math.abs(d[2] - 0x33) < 14) hits.push(`(${x}, ${y})`);
    }
    return hits;
  });
  for (const mode of ["flat", "studio"]) {
    await page.evaluate((m) => (window as any).__tekto.owner.scene.setLightingMode(m), mode);
    expect(await pocheAt(), `${mode}: poché shows through the board at`).toEqual([]);
  }
  // …and a real cut still fills: a block the plan cut passes through shows its poché inside.
  await page.evaluate(() => {
    const { doc } = (window as any).siteEditor;
    doc.add("blocks", { x: 0, y: 0, w: 4, d: 3, h: 6 });
    const r = (window as any).__tekto.owner.renderer;
    r.setCameraPosition(6, -9, 12);
    r.lookAt(0, 0, 3);
  });
  const cut = await page.evaluate(async () => {
    const r = (window as any).__tekto.owner.renderer;
    const p = r.worldToScreen({ x: 1, y: 0.75, z: 3 });
    const img = new Image();
    img.src = r.snapshotPng();
    await img.decode();
    const k = img.width / r.canvasEl.getBoundingClientRect().width;
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    return [...g.getImageData(Math.round(p.x * k), Math.round(p.y * k), 1, 1).data.slice(0, 3)];
  });
  cut.forEach((v, i) => expect(Math.abs(v - [0x1b, 0x27, 0x33][i])).toBeLessThan(14));
});
