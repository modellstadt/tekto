/**
 * The viewer header (shadingBar: "header", the Camera page): a strip across the top of the view
 * with the app's controls on the left, the shading icons, snapshot and ✎ Markup on the right, the
 * axis widget under it and the zoom column below that — and the 2D form of all of it.
 */
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=camera");
  await expect(page.locator("[data-tekto-viewer-header]")).toBeVisible({ timeout: 15_000 });
  return errors;
}
const box = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => {
  const r = el.getBoundingClientRect(), p = (el.parentElement as HTMLElement).getBoundingClientRect();
  return { top: r.top - p.top, left: r.left - p.left, width: r.width, height: r.height, parentWidth: p.width, bottom: r.bottom - p.top };
});
const gizmo = (page: Page) => page.locator("svg").filter({ has: page.locator("text", { hasText: /^X$/ }) });
const dist = (page: Page) => page.evaluate(() => {
  const { position: p, target: t } = (window as any).__tekto.owner.renderer.cameraState();
  return Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]);
});

test("the header spans the top of the view: the app's controls left, shading and Markup right", async ({ page }) => {
  const errors = await open(page);
  const header = page.locator("[data-tekto-viewer-header]");
  const h = await box(page, "[data-tekto-viewer-header]");
  expect(h.top).toBe(0);
  expect(Math.round(h.width)).toBe(Math.round(h.parentWidth));
  await expect(header.getByRole("button", { name: "Ghost" })).toBeVisible();
  await expect(header.getByRole("button", { name: /^Snapshot/ })).toBeVisible();
  await expect(header.getByRole("button", { name: "✎ Markup" })).toBeVisible();
  // the page's own buttons, in the left slot, before the shading icons
  const top = header.getByRole("button", { name: "Top", exact: true });
  const [topX, ghostX] = [(await top.boundingBox())!.x, (await header.getByRole("button", { name: "Ghost" }).boundingBox())!.x];
  expect(topX).toBeLessThan(ghostX);
  await top.click();
  await expect.poll(() => page.evaluate(() => {
    const { position: p, target: t } = (window as any).__tekto.owner.renderer.cameraState();
    return Math.round((p[1] - t[1]) / Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]));
  })).toBe(1);                                                   // Y-up: the plan looks down
  expect(errors).toEqual([]);
});

test("the axis widget sits under the header, the zoom column under it; zoom works", async ({ page }) => {
  const errors = await open(page);
  await expect(gizmo(page)).toBeVisible();
  const g = (await gizmo(page).boundingBox())!, hdr = (await page.locator("[data-tekto-viewer-header]").boundingBox())!;
  const nav = page.locator("[data-tekto-nav-column]");
  const n = (await nav.boundingBox())!;
  expect(g.y).toBeGreaterThan(hdr.y + hdr.height - 1);
  expect(n.y).toBeGreaterThan(g.y + g.height);
  const d0 = await dist(page);
  await nav.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(() => dist(page)).toBeCloseTo(d0 / 1.25, 3);
  await nav.getByRole("button", { name: /^Zoom to bounds/ }).click();
  expect(errors).toEqual([]);
});

test("in a strict-2D view the header keeps snapshot and Markup, the column moves up under it", async ({ page }) => {
  const errors = await open(page);
  const header = page.locator("[data-tekto-viewer-header]");
  const nav = page.locator("[data-tekto-nav-column]");
  const before = (await nav.boundingBox())!.y;
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setOrbitRotateEnabled(false));
  await expect(header).toHaveAttribute("data-palette", "2d");
  await expect(header.getByRole("button", { name: "Ghost" })).toBeHidden();
  await expect(header.getByRole("button", { name: /^Snapshot/ })).toBeVisible();
  await expect(header.getByRole("button", { name: "✎ Markup" })).toBeVisible();
  await expect(gizmo(page)).toBeHidden();
  await expect(nav.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect.poll(async () => (await nav.boundingBox())!.y).toBeLessThan(before);
  expect(errors).toEqual([]);
});

test("in a strict-2D view the column has the hand: on, a left drag moves the view along", async ({ page }) => {
  const errors = await open(page);
  const nav = page.locator("[data-tekto-nav-column]");
  const hand = nav.getByRole("button", { name: /^Hand/ });
  await expect(hand).toBeHidden();                                // 3D: the left button turns the view
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setOrbitRotateEnabled(false));
  await expect(hand).toBeVisible();
  const canvas = page.locator("canvas").first();
  const state = () => page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer, { position: p, target: t } = r.cameraState();
    return { t, d: Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]), cursor: r.renderer.domElement.style.cursor };
  });
  const drag = async () => {
    const b = (await canvas.boundingBox())!, x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 120, y + 40, { steps: 8 }); await page.mouse.up();
  };
  const s0 = await state();
  await drag();                                                   // the hand off: a plain left drag does nothing in 2D
  const s1 = await state();
  expect(Math.hypot(s1.t[0] - s0.t[0], s1.t[1] - s0.t[1], s1.t[2] - s0.t[2])).toBeLessThan(1e-6);
  await hand.click();
  await expect(hand).toHaveAttribute("aria-pressed", "true");
  expect((await state()).cursor).toBe("grab");
  await drag();
  await expect.poll(async () => { const s = await state(); return Math.hypot(s.t[0] - s1.t[0], s.t[1] - s1.t[1], s.t[2] - s1.t[2]); }).toBeGreaterThan(0.05);
  expect((await state()).d).toBeCloseTo(s1.d, 3);                 // moved along, not zoomed
  await hand.click();                                             // off again
  await expect(hand).toHaveAttribute("aria-pressed", "false");
  expect((await state()).cursor).toBe("");
  await hand.click();
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setOrbitRotateEnabled(true));
  await expect(hand).toBeHidden();                                // back in 3D: the hand is off
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.handMode)).toBe(false);
  expect((await state()).cursor).toBe("");
  expect(errors).toEqual([]);
});

test("a header popover opens under its button; Markup's Done stays in reach while drawing", async ({ page }) => {
  const errors = await open(page);
  const header = page.locator("[data-tekto-viewer-header]");
  const sun = header.getByRole("button", { name: "Sun: morning, noon, sunset" });
  await sun.click();
  const morning = header.getByRole("button", { name: /^Morning/ });   // the popover's first preset
  await expect(morning).toBeVisible();
  const [s, p] = [(await sun.boundingBox())!, (await morning.boundingBox())!];
  expect(Math.abs(p.x - s.x)).toBeLessThan(60);                 // under the sun, not at the far end
  expect(p.y).toBeGreaterThan(s.y + s.height);
  await sun.click();

  await header.getByRole("button", { name: "✎ Markup" }).click();
  const done = header.getByRole("button", { name: "Done" });
  await expect(done).toBeVisible();
  await done.click();                                             // the header is above the drawing layer
  await expect(header.getByRole("button", { name: "✎ Markup" })).toBeVisible();
  expect(errors).toEqual([]);
});
