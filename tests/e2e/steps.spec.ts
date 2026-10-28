/**
 * The steps panel: a generated program (playground Steps) read as the steps it ran — the graph,
 * a step's details, geometry ↔ step both ways, and a note on a step saved for the agent.
 */
import { expect, test } from "@playwright/test";

test("reads a program as its steps: graph, details, geometry to step, a note for the agent", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/testbench.html?page=steps");
  const pill = page.locator('[data-tekto-steps="pill"]');
  await expect(pill).toHaveText("Steps · 10");

  // What an agent reads: the steps, their links and the analysis.
  const trace = await page.evaluate(() => (window as any).__tekto.steps());
  expect(trace.steps.filter((s: any) => !s.parent).map((s: any) => s.id)).toEqual([
    "site", "seeds", "relax", "cells", "plots", "keep", "heights", "massing", "streets", "figures",
  ]);
  expect(trace.edges).toContainEqual({ from: "keep", to: "massing", input: "kept" });
  expect(trace.analysis.unused).toEqual(["streets"]);           // computed, never drawn or used

  await pill.click();
  const panel = page.locator('[data-tekto-steps="panel"]');
  await panel.locator('[data-step="cells"]').click();
  await expect(panel).toContainText("in relaxed Array(32) of Vec2 ← relax");
  await expect(panel).toContainText(/code steps\.ts:\d+/);

  // A building leads to the step that made it.
  const at = await page.evaluate(() => {
    const t = (window as any).__tekto, r = t.owner.renderer;
    const mass = t.steps().steps.find((s: any) => s.id === "massing");
    let best: any = null;
    for (const id of mass.objects) {
      const b = r.objectBounds(id);
      const c = { x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: b.max.z };
      if (!best || c.z > best.z) best = c;
    }
    const p = r.worldToScreen(best), rect = r.canvasEl.getBoundingClientRect();
    return { x: rect.left + p.x, y: rect.top + p.y + 3 };
  });
  await page.mouse.click(at.x, at.y);
  await expect(panel).toContainText("out Array(32) of Mesh");

  // A note on the step, saved for the agent with the steps.
  await panel.locator("textarea").fill("Taller towards the north edge.");
  await panel.getByRole("button", { name: "Mark step for agent" }).click();
  expect(await page.evaluate(() => (window as any).__tekto.steps().marks.map((m: any) => [m.step, m.note])))
    .toEqual([["massing", "Taller towards the north edge."]]);
  await panel.getByRole("button", { name: "Save 1 mark for agent" }).click();
  await expect(panel).toContainText(/Saved for the agent/);
  expect(errors).toEqual([]);
});
