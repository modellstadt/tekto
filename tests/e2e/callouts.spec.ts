/**
 * Callouts on the one renderer: a label whose words change is redrawn, an element partly in
 * sight keeps its label, and what writes no depth (ghost) hides none.
 */
import { expect, test, type Page } from "@playwright/test";

const labels = (page: Page) => page.locator("button[title]").filter({ hasText: /×/ });

test("a callout whose count changed says the new count", async ({ page }) => {
  await page.goto("/testbench.html?page=framed-floor");
  await page.waitForFunction(() => (window as any).framedFloor?.parts.length > 5, null, { timeout: 15_000 });
  const joistLabel = async () => labels(page).filter({ hasText: /^Joist/ }).first().getAttribute("title");
  const joists = () => page.evaluate(() => (window as any).framedFloor.parts.filter((p: any) => p.role === "joist").length);
  await expect.poll(joistLabel).toContain(`${await joists()} ×`);

  await page.evaluate(() => (window as any).__tekto.setParams({ northSouth: true }));
  const n = await joists();
  await expect.poll(joistLabel).toContain(`${n} ×`);
});

test("a label shows for what is partly in sight, and nothing see-through hides one", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  // From the front: a block, a narrower one wholly behind it, and a wider one whose middle
  // is behind it but whose ends are in sight.
  await page.evaluate(() => {
    const { doc } = (window as any).siteEditor;
    for (const id of doc.ids("blocks")) doc.remove("blocks", id);
    const add = (y: number, w: number, h: number) => doc.add("blocks", { x: 0, y, w, d: 1, h });
    const keys = [add(0, 4, 6), add(6, 3, 4), add(12, 14, 4)].map((id: string) => `blocks/${id}`);
    const r = (window as any).__tekto.owner.renderer;
    r.setView("front", { animate: false });
    r.fitAll();
    r.setCallouts(["Front", "Hidden", "Wide"].map((text, i) => ({ id: text, text, objects: [keys[i]] })));
  });
  const shown = () => page.locator("button[title]").filter({ visible: true })
    .evaluateAll((els) => els.map((e) => e.getAttribute("title")).filter((t) => ["Front", "Hidden", "Wide"].includes(t!)).sort());
  await expect.poll(shown).toEqual(["Front", "Wide"]);
  await page.evaluate(() => (window as any).__tekto.owner.scene.setRenderMode("ghost"));
  await expect.poll(shown).toEqual(["Front", "Hidden", "Wide"]);
});

/** A row of blocks along x, each its own record, and their keys. */
async function blocks(page: Page, n: number) {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  return page.evaluate((count) => {
    const { doc } = (window as any).siteEditor;
    for (const id of doc.ids("blocks")) doc.remove("blocks", id);
    const keys: string[] = [];
    for (let i = 0; i < count; i++) {
      keys.push(`blocks/${doc.add("blocks", { x: (i % 20) * 2, y: Math.floor(i / 20) * 2, w: 1, d: 1, h: 1 })}`);
    }
    const r = (window as any).__tekto.owner.renderer;
    r.setView("top", { animate: false });
    r.fitAll();
    return keys;
  }, n);
}

test("a label with hundreds of leaders is checked a slice per frame, not in one long frame", async ({ page }) => {
  const keys = await blocks(page, 400);
  // Timed where the work is: each call of the check is one frame's slice. (A long task would
  // time the whole frame, and drawing 400 blocks in software WebGL on a busy machine is
  // longer than any limit one could set for the callouts.)
  const run = await page.evaluate((objects) => new Promise<{ ends: number; slices: number[] }>((done) => {
    const r = (window as any).__tekto.owner.renderer;
    const marks = r.marks;
    const check = marks._checkCalloutVisibility.bind(marks);
    const slices: number[] = [];
    marks._checkCalloutVisibility = (deadline: number) => {
      const t = performance.now();
      check(deadline);
      slices.push(performance.now() - t);
    };
    r.setCallouts([{ id: "all", text: "all", objects, leaders: "each" }], {
      labels: false,
      onEnds: (ends: { id: string; ends: unknown[] }[]) => {
        const n = ends[0]?.ends.length ?? 0;
        if (n >= 300) done({ ends: n, slices });
      },
    });
  }), keys);
  expect(run.ends).toBeGreaterThanOrEqual(300);
  // 400 leaders don't fit one frame's 6 ms: the check goes on over several frames
  expect(run.slices.length).toBeGreaterThan(1);
  // and each slice is the budget plus one leader's rays, with room for a slow machine
  expect(Math.max(...run.slices)).toBeLessThan(40);
});

test("what a section has cut away gets no leader", async ({ page }) => {
  const keys = await blocks(page, 20);
  const ends = await page.evaluate((objects) => new Promise<number>((done) => {
    const r = (window as any).__tekto.owner.renderer;
    r.setSection({ axis: "x", at: 0.5 });
    let calls = 0;
    r.setCallouts([{ id: "row", text: "row", objects, leaders: "each" }], {
      labels: false,
      onEnds: (e: { ends: unknown[] }[]) => { if (++calls > 30 || (e[0]?.ends.length ?? 0) > 0) done(e[0]?.ends.length ?? 0); },
    });
  }), keys);
  // half the row is beyond the cut: those blocks are not there to point at
  expect(ends).toBeGreaterThan(0);
  expect(ends).toBeLessThanOrEqual(11);
});
