/**
 * window.__tekto on every harness: an agent driving a browser gets the same handle on a
 * 3D sketch(), a sketch2d() and an appShell() app — the controls (schema, set by label),
 * and a snapshot whose markup.json carries params, logs and the page's errors.
 */
import { expect, test } from "@playwright/test";

const HARNESSES = [
  { slug: "mesh-factory", harness: "sketch", control: "Subdivision Levels", value: 2, scene: true },
  { slug: "pointer-2d", harness: "sketch2d", control: null, value: null, scene: false },
  { slug: "app-shell", harness: "appShell", control: "Floors", value: 5, scene: true },
] as const;

for (const h of HARNESSES) {
  test(`${h.harness} (${h.slug}) exposes the agent bridge`, async ({ page }) => {
    await page.goto(`/testbench.html?page=${h.slug}`);
    await page.waitForFunction(() => !!(window as any).__tekto?.owner, null, { timeout: 15_000 });

    const schema = await page.evaluate(() => (window as any).__tekto.schema());
    expect(Array.isArray(schema)).toBe(true);
    if (h.control) {
      const ctl = schema.find((c: any) => c.name === h.control);
      expect(ctl, `control "${h.control}" in the schema`).toBeTruthy();
      const r = await page.evaluate(([n, v]) => (window as any).__tekto.setParams({ [n as string]: v }), [h.control, h.value]);
      expect(r.applied.length).toBe(1);
      await page.waitForTimeout(300);
    }

    const m = await page.evaluate(() =>
      (window as any).__tekto.snapshot({ save: false }).then((b: any) => ({ ...b.markup, png: b.viewPng.length })));
    expect(m.harness).toBe(h.harness);
    expect(m.png).toBeGreaterThan(1000);
    expect(Array.isArray(m.logs)).toBe(true);
    expect(m.errors).toEqual([]);
    expect(!!m.scene).toBe(h.scene);
    if (h.control) {
      const value = Object.entries(m.params).find(([k]) => k === h.control || k.endsWith(`:${h.control}`) || k === (h.control as string).toLowerCase());
      expect(value?.[1]).toBe(h.value);
    }
  });
}

test("errors the page hits land in the bridge (and so in markup.json)", async ({ page }) => {
  await page.goto("/testbench.html?page=pointer-2d");
  await page.waitForFunction(() => !!(window as any).__tekto?.owner);
  await page.evaluate(() => console.error("boom from the test"));
  const m = await page.evaluate(() => (window as any).__tekto.snapshot({ save: false }).then((b: any) => b.markup));
  expect(m.errors.some((e: string) => e.includes("boom from the test"))).toBe(true);
});

test("controls can be set from code, and a design round-trips through getParams/setParams", async ({ page }) => {
  await page.goto("/testbench.html?page=mesh-factory");
  await page.waitForFunction(() => !!(window as any).__tekto?.owner);
  const level = () => page.evaluate(() => (window as any).__tekto.params()["slider::Subdivision Levels"]);
  expect(await level()).toBe(1);

  // Reactive.set from a button: the stored value changes and the sketch re-runs.
  await page.getByRole("button", { name: "Smoothest" }).click();
  await expect.poll(level).toBe(3);

  // Save, change, reopen — without a page reload.
  const saved = await page.evaluate(() => (window as any).__tekto.owner.getParams());
  await page.evaluate(() => (window as any).__tekto.owner.setParams({ "Subdivision Levels": 0 }));
  await expect.poll(level).toBe(0);
  const r = await page.evaluate((v) => (window as any).__tekto.owner.setParams(v), saved);
  expect(r.unknown).toEqual([]);
  await expect.poll(level).toBe(3);
});

test("a standalone sketch shows its registered exports and downloads them", async ({ page }) => {
  await page.goto("/");                                   // playground/main.ts: a sketch() with no shell
  const exportBtn = page.getByRole("button", { name: "Export ▾" });
  await expect(exportBtn).toBeVisible({ timeout: 15_000 });
  await exportBtn.click();
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Plan (DXF)" }).click(),
  ]);
  expect(dl.suggestedFilename()).toBe("playground-plan.dxf");
  expect(await dl.failure()).toBeNull();                   // the file arrived whole (content: tests/dxf-2d)
});

test("appShell has ✎ Markup: a loop drawn on the view resolves to the objects inside", async ({ page }) => {
  await page.goto("/testbench.html?page=app-shell");
  await page.waitForFunction(() => !!(window as any).__tekto?.owner);
  await page.getByRole("button", { name: "✎ Markup" }).click();
  const overlay = page.locator('canvas[style*="crosshair"]');
  await expect(overlay).toBeVisible();
  // Where the middle of the tower is on screen (canvas coordinates → page coordinates).
  const at = await page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer;
    const p = r.worldToScreen({ x: 0, y: 0, z: 4 });
    const rect = r.canvasEl.getBoundingClientRect();
    return { x: rect.left + p.x, y: rect.top + p.y };
  });
  const R = 70;
  await page.mouse.move(at.x + R, at.y);
  await page.mouse.down();
  for (let a = 0; a <= Math.PI * 2 + 0.2; a += 0.2) await page.mouse.move(at.x + R * Math.cos(a), at.y + R * Math.sin(a));
  await page.mouse.up();
  // The note field opens at the mark; Enter there keeps the mark (Esc on the overlay would close Markup).
  const note = page.getByPlaceholder("note for 1…");
  await expect(note).toBeFocused();
  await note.fill("thicker slabs");
  await note.press("Enter");

  const m = await page.evaluate(() => (window as any).__tekto.snapshot({ save: false }).then((b: any) => b.markup));
  expect(m.harness).toBe("appShell");
  expect(m.marks.length).toBe(1);
  expect(m.marks[0].kind).toBe("loop");
  expect(m.marks[0].note).toBe("thicker slabs");
  expect(m.marks[0].hits.some((h: any) => /^floor \d+$/.test(h.label))).toBe(true);
});
