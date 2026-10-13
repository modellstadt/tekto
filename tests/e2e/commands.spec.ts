/**
 * Commands in a real browser: the Site Editor's keys run as commands (and not while typing
 * in a field), an agent lists and runs them through window.__tekto, the view commands are
 * there in every 3D app, and a snapshot names them.
 */
import { expect, test } from "@playwright/test";

test("keys and agents run the same commands; typing in a field is left alone", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });

  const list = await page.evaluate(() => (window as any).__tekto.commands());
  const ids = list.map((c: any) => c.id);
  expect(ids).toEqual(expect.arrayContaining(["edit.undo", "edit.delete", "move.left", "view.top", "view.fitAll"]));
  expect(list.find((c: any) => c.id === "edit.delete")).toMatchObject({ keys: ["Delete", "Backspace"], enabled: false });

  // An agent adds a block by id, a person undoes it by key.
  const count = () => page.evaluate(() => (window as any).siteEditor.doc.count("blocks"));
  const before = await count();
  expect(await page.evaluate(() => (window as any).__tekto.run("edit.add"))).toBe(true);
  expect(await count()).toBe(before + 1);
  await page.locator("canvas").first().click({ position: { x: 5, y: 5 } });   // focus the app, clear the selection
  await page.keyboard.press("ControlOrMeta+z");
  expect(await count()).toBe(before);

  // A disabled command doesn't run; arrows typed into a field stay in the field.
  expect(await page.evaluate(() => (window as any).__tekto.run("edit.delete"))).toBe(false);
  const id = await page.evaluate(() => (window as any).siteEditor.doc.ids("blocks")[0]);
  await page.evaluate((id) => (window as any).siteEditor.selection.select([`blocks/${id}`]), id);
  const x0 = await page.evaluate((id) => (window as any).siteEditor.doc.get("blocks", id).x, id);
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate((id) => (window as any).siteEditor.doc.get("blocks", id).x, id)).toBe(x0 + 0.5);
  await page.evaluate(() => { const i = document.createElement("input"); i.id = "probe"; document.body.appendChild(i); });
  await page.locator("#probe").focus();
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate((id) => (window as any).siteEditor.doc.get("blocks", id).x, id)).toBe(x0 + 0.5);

  // The view commands, and a snapshot that names what the app can do.
  await page.evaluate(() => (window as any).__tekto.run("view.top"));
  await page.waitForTimeout(450);
  const dir = await page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer;
    const c = r.activeCamera.position, t = r.controls.target;
    return (c.z - t.z) / c.distanceTo(t);
  });
  expect(dir).toBeGreaterThan(0.99);
  const m = await page.evaluate(() => (window as any).__tekto.snapshot({ save: false }).then((b: any) => b.markup));
  expect(m.commands.some((c: any) => c.id === "edit.undo")).toBe(true);
  expect(errors).toEqual([]);
});

test("a sketch declares commands per run with lab.command", async ({ page }) => {
  await page.goto("/testbench.html?page=mesh-factory");
  await page.waitForFunction(() => (window as any).__tekto?.harness === "sketch", null, { timeout: 15_000 });
  const ids = () => page.evaluate(() => (window as any).__tekto.commands().map((c: any) => c.id));
  expect(await ids()).toEqual(expect.arrayContaining(["view.fitAll", "subdiv.more", "subdiv.less"]));
  const level = () => page.evaluate(() => (window as any).__tekto.params()["Subdivision Levels"] ?? Object.values((window as any).__tekto.params())[0]);
  const l0 = await level();
  await page.locator("canvas").first().click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("]");                                    // a key runs it; the sketch re-runs
  await expect.poll(level).toBe(l0 + 1);
  expect((await ids()).filter((i: string) => i === "subdiv.more")).toHaveLength(1);   // re-declared, not doubled
  expect(await page.evaluate(() => (window as any).__tekto.run("subdiv.less"))).toBe(true);
  await expect.poll(level).toBe(l0);
  expect(await page.evaluate(() => (window as any).__tekto.run("view.toggleProjection"))).toBe(true);
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.projection)).toBe("orthographic");
});
