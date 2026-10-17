/**
 * The House page: a building as records in a real browser, and an agent editing it from
 * outside the page — through the dev server's relay, as `tools/mcp.mjs` does.
 */
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, query = "") {
  await page.goto(`/testbench.html?page=house${query}`);
  await page.waitForFunction(() => (window as any).house?.building.storeys.length === 2, null, { timeout: 30_000 });
}

test("builds the example house from its records, with nothing to report", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await open(page);
  const keys = await page.evaluate(() => {
    const scene = (window as any).__tekto.owner.scene;
    return [...new Set(scene.all().map((o: any) => o.key).filter(Boolean))].length;
  });
  expect(keys).toBe(13 + 13 + 3 + 7);                     // walls, openings, slabs, spaces
  expect(await page.evaluate(() => (window as any).house.issues.length)).toBe(0);
  await expect(page.getByText(/2 storeys · 13 walls · 160\.0 m² · no issues/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("an agent edits it from outside: a bad patch changes nothing, a good one is one undo step with its issues", async ({ page, request }) => {
  await open(page, "&agent-relay");
  await expect.poll(async () => (await (await request.get("/__tekto/agent/status")).json()).pages.length).toBeGreaterThan(0);
  const call = async (op: string, args: object = {}) => (await request.post("/__tekto/agent/call", { data: { op, args } })).json();

  const info = (await call("info")).result;
  expect(info.doc).toMatchObject({ name: "house", collections: { storeys: 2, walls: 13 } });
  expect(Object.keys(info.doc.schema)).toEqual(["storeys", "walls", "openings", "slabs", "spaces"]);

  const bad = (await call("apply", { patch: { set: { "openings/x": { wall: "e", kind: "hatch", at: 1, width: 1 } } } })).result;
  expect(bad.ok).toBe(false);
  expect(bad.rejected[0].message).toContain('expected one of "door", "window"');
  expect(await page.evaluate(() => (window as any).house.doc.canUndo())).toBe(false);

  const good = (await call("apply", { patch: { set: { "openings/x": { wall: "e", kind: "window", at: 7.8, width: 1 } } }, label: "Agent: east window" })).result;
  expect(good).toMatchObject({ ok: true, undo: "Agent: east window" });
  expect(good.issues.map((i: any) => i.code)).toEqual(["opening-outside-wall"]);
  await expect(page.getByText(/1 errors · 0 warnings/)).toBeVisible();

  expect((await call("undo")).result).toEqual({ undone: true });
  expect(await page.evaluate(() => (window as any).house.doc.has("openings", "x"))).toBe(false);
  expect((await call("check")).result).toEqual([]);
});
