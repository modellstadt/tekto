/**
 * The Rhino-style layer panel on the playground's Layers page: square colour
 * swatches, the active layer (always on and unlocked) and locked layers whose
 * objects can't be picked.
 */
import { expect, test, type Page } from "@playwright/test";

/** Pick at the screen point of a world position; returns the picked object's layer, or null. */
const layerAt = (page: Page, p: [number, number, number]) => page.evaluate(([x, y, z]) => {
  const { renderer, scene } = (window as any).__tekto.owner;
  renderer.render();
  const s = renderer.worldToScreen({ x, y, z });
  const rect = renderer.canvasEl.getBoundingClientRect();
  const id = renderer.pickAt(rect.left + s.x, rect.top + s.y) as string | null;
  return id ? (scene.get(id)?.style.layer ?? "untagged") as string : null;
}, p);

async function open(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=layers");
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("radio", { name: "Active: Structure" })).toBeVisible();
  return errors;
}

const info = (page: Page) => page.locator("#app");

test("a layer's colour is a square swatch and recolours the sketch", async ({ page }) => {
  const errors = await open(page);
  // Rhino-style chip: square, sharp corners (the injected .tekto-swatch rule).
  const swatches = page.locator('#app input.tekto-swatch[title="Layer color"]');
  await expect(swatches).toHaveCount(5);
  const columns = page.getByLabel("Color: Columns");
  const box = (await columns.boundingBox())!;
  expect(Math.round(box.width)).toBe(Math.round(box.height));
  expect(await columns.evaluate(el => getComputedStyle(el).borderRadius)).toBe("0px");

  await columns.evaluate((el: HTMLInputElement) => {
    el.value = "#00ff88";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(info(page)).toContainText(/Columns\s*#00ff88/);
  expect(errors).toEqual([]);
});

test("the active layer is always on and unlocked; new objects go on it", async ({ page }) => {
  const errors = await open(page);
  // The first layer that is on starts active; its bulb and lock are disabled.
  await expect(page.getByRole("radio", { name: "Active: Structure" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("checkbox", { name: "On: Structure" })).toBeDisabled();
  await expect(info(page)).toContainText(/Active layer\s*structure/);

  // Making the hidden Guides layer active turns it on.
  const guidesOn = page.getByRole("checkbox", { name: "On: Guides" });
  await expect(guidesOn).toHaveAttribute("aria-checked", "false");
  await page.getByRole("radio", { name: "Active: Guides" }).click();
  await expect(guidesOn).toHaveAttribute("aria-checked", "true");
  await expect(guidesOn).toBeDisabled();
  await expect(page.getByRole("radio", { name: "Active: Structure" })).toHaveAttribute("aria-checked", "false");
  await expect(info(page)).toContainText(/Active layer\s*guides/);

  // A child made active: its parent can't be turned off either; Guides can again.
  await page.getByRole("radio", { name: "Active: Beams" }).click();
  await expect(page.getByRole("checkbox", { name: "On: Structure" })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Locked: Beams" })).toBeDisabled();
  await guidesOn.click();
  await expect(guidesOn).toHaveAttribute("aria-checked", "false");

  // A new post lands on the active layer.
  const onBeams = () => page.evaluate(() =>
    (window as any).__tekto.owner.scene.all().filter((o: any) => o.style.layer === "beams").length as number);
  const before = await onBeams();
  await page.getByRole("button", { name: "Add a post on the active layer" }).click();
  await expect.poll(onBeams).toBe(before + 1);
  expect(errors).toEqual([]);
});

test("objects on a locked layer can't be picked; the pick goes through", async ({ page }) => {
  const errors = await open(page);
  const column: [number, number, number] = [3, 1.5, 3];
  expect(await layerAt(page, column)).toBe("columns");

  await page.getByRole("checkbox", { name: "Locked: Columns" }).click();
  await expect(page.getByRole("checkbox", { name: "Locked: Columns" })).toHaveAttribute("aria-checked", "true");
  expect(await layerAt(page, column)).not.toBe("columns");

  // Locking the parent masks the child: unlocking Columns alone isn't enough.
  await page.getByRole("checkbox", { name: "Locked: Columns" }).click();
  expect(await layerAt(page, column)).toBe("columns");
  await page.getByRole("radio", { name: "Active: Slab" }).click();
  await page.getByRole("checkbox", { name: "Locked: Structure" }).click();
  expect(await layerAt(page, column)).not.toBe("columns");
  expect(errors).toEqual([]);
});
