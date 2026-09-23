/**
 * Picking + transform gizmo, the renderer path with the worst failure mode:
 * when it breaks, nothing appears and only the console says so.
 */
import { expect, test, type Page } from "@playwright/test";

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

/** The sketch's "Selected" log line (label and value are separate spans). */
const selected = (page: Page) => page.locator("div").filter({ hasText: /^Selected / }).last();

/** The "Dark ground" switch: its checkbox is visually hidden inside a label. */
const groundSwitch = (page: Page) =>
  page.locator("label").filter({ has: page.locator("input[type=checkbox]") }).first();

/** The page's Gizmo dropdown — not the top bar's page chooser. */
const gizmoSelect = (page: Page) =>
  page.locator("select").filter({ has: page.locator('option[value="translate"]') }).first();

/** Click the green box (left of centre, sitting on the ground). */
async function clickBox(page: Page) {
  const canvas = page.locator("canvas").first();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.37, box.y + box.height * 0.5);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/testbench.html?page=gizmo");
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(400); // first frames
});

test("clicking an object selects it, and the gizmo attaches silently", async ({ page }) => {
  const errors = watchErrors(page);
  await expect(selected(page)).toContainText("—");
  await clickBox(page);
  await expect(selected(page)).toContainText("box");
  await page.waitForTimeout(500); // frames with TransformControls in the scene
  expect(errors, "renderer logged while the gizmo was attached").toEqual([]);
});

test("the selection survives the re-runs that follow it", async ({ page }) => {
  const errors = watchErrors(page);
  await clickBox(page);
  await expect(selected(page)).toContainText("box");

  // Toggling a param re-runs the sketch, which clears and rebuilds the scene.
  // Scene ids restart at clear(), so the selection must still point at the box.
  // (Ids are positional: this page deliberately always declares the same
  // objects, so the toggle only changes a colour.)
  await groundSwitch(page).click();
  await expect(selected(page)).toContainText("box");
  await groundSwitch(page).click();
  await expect(selected(page)).toContainText("box");
  expect(errors).toEqual([]);
});

test("every gizmo mode applies without errors", async ({ page }) => {
  const errors = watchErrors(page);
  await clickBox(page);
  for (const mode of ["rotate", "scale", "none", "translate"]) {
    await gizmoSelect(page).selectOption(mode);
    await page.waitForTimeout(300);
  }
  await expect(selected(page)).toContainText("box");
  expect(errors).toEqual([]);
});
