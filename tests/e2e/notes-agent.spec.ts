/**
 * Notes as the way a person tells an agent what to change (the House page): Markup's Save
 * keeps a mark as a note; an agent lists the open notes through the relay, edits, and resolves
 * the note with what it did; the person sees the reply and the grey pin, and can reopen it.
 * While the agent works, a chip in the page (and, on a shared document, a badge in the
 * presence bar) says so.
 */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/** Open the House page under a name of its own, so this test's calls reach this page (tests run side by side). */
async function open(page: Page, request: APIRequestContext, query = "") {
  const tab = `tab=${Math.random().toString(36).slice(2, 10)}`;
  await page.goto(`/testbench.html?page=house&agent-relay&${tab}${query}`);
  await page.waitForFunction(() => (window as any).house?.building.storeys.length === 2, null, { timeout: 30_000 });
  await expect.poll(async () => (await (await request.get("/__tekto/agent/status")).json()).pages.some((p: { url: string }) => p.url.includes(tab))).toBe(true);
  /** A call as an agent named Claude makes it (what tools/mcp.mjs sends). */
  return async (op: string, args: object = {}) =>
    (await request.post("/__tekto/agent/call", { data: { op, args, agent: "Claude", page: tab } })).json();
}

test("an agent works through a note: lists it, edits, resolves it; the person sees it and reopens", async ({ page, request }) => {
  const call = await open(page, request);

  // A person's note on the east window.
  const id = await page.evaluate(() => (window as any).house.notes.add({
    text: "Make the east window wider", author: "BD", createdAt: new Date().toISOString(),
    pin: [10, 4, 1.6], strokes: [[[10, 3, 1.6], [10, 5, 1.6]]], keys: ["openings/ew1"],
    view: { position: [22, -18, 16], target: [5, 4, 2.5] },
  }));
  expect((await call("info")).result.notes).toEqual({ open: 1, done: 0 });
  const [note] = (await call("notes")).result;
  expect(note).toMatchObject({ id, key: `notes/${id}`, n: 1, text: "Make the east window wider", author: "BD", status: "open", keys: ["openings/ew1"], replies: [] });

  // The agent makes the change: its name is on the page while it works.
  const edit = (await call("apply", { patch: { update: { "openings/ew1": { width: 2.6 } } }, label: "Claude: wider east window" })).result;
  expect(edit.ok).toBe(true);
  await expect(page.locator("[data-tekto-agent]")).toHaveText("Claude · Claude: wider east window");

  expect((await call("noteReply", { id, text: "" })).error).toBe("text is required");
  expect((await call("noteResolve", { id, text: "Widened ew1 from 2 m to 2.6 m." })).result).toEqual({ ok: true, open: 0 });
  expect((await call("notes")).result).toEqual([]);
  expect((await call("notes", { status: "all" })).result[0]).toMatchObject({ status: "done", replies: [{ text: "Widened ew1 from 2 m to 2.6 m.", author: "Claude" }] });

  // The person: a grey pin, the agent's answer on the card, and Reopen.
  const pin = page.locator(`[data-note="${id}"]`);
  await expect(pin).toHaveAttribute("data-status", "done");
  await pin.click();
  const card = page.locator(`[data-note-card="${id}"]`);
  await expect(card).toContainText("Claude: Widened ew1 from 2 m to 2.6 m.");
  await card.getByRole("button", { name: "Reopen" }).click();
  await expect(pin).toHaveAttribute("data-status", "open");
  expect((await call("info")).result.notes).toEqual({ open: 1, done: 0 });

  // Each of the agent's steps is the person's to undo: reopen, resolve, the edit.
  await page.evaluate(() => { const d = (window as any).house.doc; d.undo(); d.undo(); d.undo(); });
  expect(await page.evaluate(() => (window as any).house.doc.get("openings", "ew1").width)).toBe(2);
});

test("Markup's Save keeps the marks as notes and names them in the bundle", async ({ page, request }) => {
  await open(page, request);
  await page.getByRole("button", { name: /Markup/ }).click();
  // A stroke across the south wall.
  const at = await page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer;
    const rect = r.canvasEl.getBoundingClientRect();
    const p = (x: number, y: number, z: number) => { const s = r.worldToScreen({ x, y, z }); return { x: rect.left + s.x, y: rect.top + s.y }; };
    return [p(2, 0, 1.2), p(5, 0, 1.2)];
  });
  await page.mouse.move(at[0].x, at[0].y);
  await page.mouse.down();
  await page.mouse.move((at[0].x + at[1].x) / 2, (at[0].y + at[1].y) / 2, { steps: 4 });
  await page.mouse.move(at[1].x, at[1].y, { steps: 4 });
  await page.mouse.up();
  const input = page.getByPlaceholder(/note for 1/);
  await input.fill("Door here");
  await input.press("Enter");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/kept 1 note/)).toBeVisible();

  const notes = await page.evaluate(() => (window as any).__tekto.notes.describe());
  expect(notes).toHaveLength(1);
  expect(notes[0]).toMatchObject({ n: 1, text: "Door here", status: "open" });
  expect(notes[0].keys).toContain("walls/s");
});

test("on a shared house, the presence bar shows the agent beside the window it works through", async ({ page, request }) => {
  const call = await open(page, request, "&shared=1");
  expect((await call("records", { collection: "storeys" })).result.storeys).toBeTruthy();   // a read: nothing changes
  const badge = page.locator('[data-agent="Claude"]');
  await expect(badge).toHaveText("Claude");
  await expect(badge).toHaveAttribute("title", "Claude, through your window: reading the model");
});
