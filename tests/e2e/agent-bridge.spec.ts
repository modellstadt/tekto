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
