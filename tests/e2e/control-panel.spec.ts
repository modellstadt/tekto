/**
 * ControlPanel tabs: an extra tab (the sketch's Info, its log) shows the controls declared in
 * that tab too, above its own content.
 */
import { expect, test } from "@playwright/test";

// A tekto source module's URL on the playground's dev server (/@fs + its absolute path), found
// from this spec's own path: no Node types needed (CI's clean install has none).
const srcUrl = (f: string) => "/@fs" + test.info().file.replace(/\\/g, "/").replace(/^(?!\/)/, "/").replace(/tests\/e2e\/[^/]+$/, `src/gui/${f}`);

test("an extra tab shows the controls declared in it, above its own content", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=primitives");
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  const src = srcUrl;
  await page.evaluate(async ([cp, params]) => {
    const { ControlPanel } = await import(/* @vite-ignore */ cp);
    const { ParamStore } = await import(/* @vite-ignore */ params);
    const store = new ParamStore({
      size: { type: "float", min: 0, max: 10, default: 2, label: "Size" },
      wall: { type: "float", min: 0, max: 20, default: 5, label: "Wall thickness" },
    });
    const panel = new ControlPanel({ store });
    panel.el.id = "test-panel";
    panel.el.style.cssText += "position:fixed;top:0;left:0;width:300px;z-index:100000;background:#111;";
    document.body.appendChild(panel.el);
    panel.render([{ key: "size", tab: "Design" }, { key: "wall", group: "Material", tab: "Info" }], [],
      [{ name: "Info", render: (c: HTMLElement) => { c.id = "test-log"; c.textContent = "LOG LINES"; } }]);
  }, [src("ControlPanel.ts"), src("Params.ts")]);

  const panel = page.locator("#test-panel");
  await expect(panel).toContainText("Size");
  await expect(panel).not.toContainText("LOG LINES");
  await panel.locator("button", { hasText: /^Info$/ }).click();
  await expect(panel).toContainText("Wall thickness");
  await expect(panel.locator("#test-log")).toHaveText("LOG LINES");
  // the control sits above the log
  const [ctrlY, logY] = await panel.evaluate((el) => {
    const ctrl = [...el.querySelectorAll("*")].find((e) => e.childElementCount === 0 && e.textContent === "Wall thickness")!;
    return [ctrl.getBoundingClientRect().top, el.querySelector("#test-log")!.getBoundingClientRect().top];
  });
  expect(ctrlY).toBeLessThan(logY);
  expect(errors).toEqual([]);
});
