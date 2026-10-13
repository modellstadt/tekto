/**
 * The Drawing Sheet page: a Sheet on screen over the 3D viewport — picking by key in the
 * plan and in an elevation, one selection shared with the 3D view, zoom kept across a
 * rebuild, fit on double-click, and a DXF export of the same drawing.
 */
import { expect, test, type Page } from "@playwright/test";

type DS = { sheet: any; view: any; selection: any };
/** Run `fn` in the page against the drawing, its view and the selection. */
const ds = <T>(page: Page, fn: (d: DS) => T) => page.evaluate(`(${fn.toString()})(window.drawingSheet)`) as Promise<T>;

async function open(page: Page) {
  await page.goto("/testbench.html?page=drawing-sheet");
  await page.waitForFunction(() => (window as any).drawingSheet?.sheet.explode().length > 50, null, { timeout: 15_000 });
}

/** Click a sheet point (sheet coordinates) on the canvas. */
async function clickSheet(page: Page, x: number, y: number, mods: ("Shift" | "ControlOrMeta")[] = []) {
  const at = await page.evaluate(([x, y]) => {
    const { view } = (window as any).drawingSheet;
    const p = view.toScreen({ x, y });
    const r = view.canvas.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, [x, y]);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.click(at.x, at.y);
  for (const m of mods) await page.keyboard.up(m);
}

test("pick in the plan and an elevation; the 3D view shares the selection", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await open(page);
  await expect(page.locator("canvas[data-tekto-overlay]")).toBeVisible();

  // Plan: column A3 sits at x = 6 m (12 m, 4 bays), y = 0.
  await clickSheet(page, 6, 0);
  expect(await ds(page, (d) => d.selection.keys())).toEqual(["columns/A3"]);
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.marks.selectionMaterials.size)).toBeGreaterThan(0);

  // South elevation: Shift-click the edge of column A2 adds it.
  const elev = await ds(page, (d) => d.sheet.view("south").options.at);
  await clickSheet(page, 3 + 0.15, elev[1] + 1.6, ["Shift"]);
  expect((await ds(page, (d) => d.selection.keys())).sort()).toEqual(["columns/A2", "columns/A3"]);

  // Paper clears.
  await clickSheet(page, 1.5, 3.5);
  expect(await ds(page, (d) => d.selection.size)).toBe(0);
  expect(errors).toEqual([]);
});

test("a rebuild keeps the zoom; double-click fits; DXF exports the drawing", async ({ page }) => {
  await open(page);
  const box = (await page.locator("canvas[data-tekto-overlay]").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(50);
  const zoomed = await ds(page, (d) => d.view.transform);
  const before = await ds(page, (d) => d.sheet.explode().length);

  await page.evaluate(() => (window as any).__tekto.setParams({ Bays: 6 }));
  expect(await ds(page, (d) => d.sheet.explode().length)).toBeGreaterThan(before);
  expect(await ds(page, (d) => d.view.transform)).toEqual(zoomed);

  await page.mouse.dblclick(box.x + 40, box.y + 40);
  expect((await ds(page, (d) => d.view.transform)).scale).toBeLessThan(zoomed.scale);

  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export DXF" }).click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/^pavilion-\d{8}-\d{4}\.dxf$/);
  expect(await dl.failure()).toBeNull();

  // An agent's snapshot shows the drawing (white paper), not the dark 3D view under it.
  const corner = await page.evaluate(async () => {
    const b = await (window as any).__tekto.snapshot({ save: false });
    const img = new Image();
    img.src = b.cleanPng;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    return [...g.getImageData(4, 4, 1, 1).data.slice(0, 3)];
  });
  expect(Math.min(...corner)).toBeGreaterThan(240);
});
