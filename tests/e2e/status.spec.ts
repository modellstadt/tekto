/**
 * The status line over an appShell's view: folded to an ⓘ by its button and back, the choice
 * remembered across reloads, and the view still taking clicks through the box.
 */
import { expect, test } from "@playwright/test";

test("the status line folds to an ⓘ and back, and remembers it", async ({ page }) => {
  await page.goto("/testbench.html?page=house");
  const status = page.locator("[data-tekto-status]");
  await expect(status.getByText(/2 storeys · 13 walls/)).toBeVisible();

  const toggle = status.getByRole("button", { name: "Hide status" });
  await toggle.click();
  await expect(status.getByText(/storeys/)).toBeHidden();
  const show = status.getByRole("button", { name: "Show status" });
  await expect(show).toHaveText("i");
  await expect(show).toHaveAttribute("title", /^Show status: 2 storeys · 13 walls/);
  const folded = await status.boundingBox();
  expect(folded!.width).toBeLessThan(40);

  await page.reload();
  await expect(page.locator("[data-tekto-status]").getByRole("button", { name: "Show status" })).toBeVisible();

  await page.locator("[data-tekto-status]").getByRole("button", { name: "Show status" }).click();
  await expect(page.locator("[data-tekto-status]").getByText(/2 storeys · 13 walls/)).toBeVisible();
});

test("the open status line lets clicks through to the view", async ({ page }) => {
  await page.goto("/testbench.html?page=house");
  const status = page.locator("[data-tekto-status]");
  await expect(status).toContainText(/storeys/);
  expect(await status.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
});
