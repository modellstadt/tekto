/**
 * Render on demand: the sketch viewport draws only when something changed, so an
 * idle scene costs nothing, while orbiting, re-runs and animations still draw.
 * Also: colour / layer / pickTag restyles patch the existing three object.
 */
import { expect, test, type Page } from "@playwright/test";

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

/** Count WebGL draws and animation frames (renderer reached through window.__tekto). */
async function countDraws(page: Page) {
  await page.evaluate(() => {
    const gl = (window as any).__tekto.owner.renderer.renderer;
    const w = window as any;
    w.__draws = 0;
    w.__frames = 0;
    const orig = gl.render.bind(gl);
    gl.render = (s: unknown, c: any) => { w.__draws++; w.__drawnCam = c.position.toArray(); orig(s, c); };
    const tick = () => { w.__frames++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  return {
    reset: () => page.evaluate(() => { (window as any).__draws = 0; (window as any).__frames = 0; }),
    get: () => page.evaluate(() => (window as any).__draws as number),
    frames: () => page.evaluate(() => (window as any).__frames as number),
  };
}

async function open(page: Page, slug: string) {
  await page.goto(`/testbench.html?page=${slug}`);
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => !!(window as any).__tekto?.owner);
  await page.waitForTimeout(600); // first frames, orbit damping settles
}

test("an idle sketch stops drawing; orbiting and re-runs draw", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, "lines-points");
  const draws = await countDraws(page);

  await page.waitForTimeout(500);
  await draws.reset();
  await page.waitForTimeout(1000);
  expect(await draws.get(), "draws while idle").toBe(0);

  // Orbit with the mouse: draws during the drag and while damping settles. Damping
  // decays per frame and headless frames are slow: settle in ~20 frames, not ~150.
  await page.evaluate(() => { (window as any).__tekto.owner.renderer.controls.dampingFactor = 0.5; });
  const box = (await page.locator("canvas").first().boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * 0.5 + i * 15, box.y + box.height * 0.5);
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await draws.get(), "draws while orbiting").toBeGreaterThan(0);

  // Damping ends, drawing stops.
  await expect.poll(async () => {
    await draws.reset();
    await page.waitForTimeout(500);
    return draws.get();
  }, { message: "draws after the orbit settled", timeout: 30_000 }).toBe(0);
  // …and the camera rests exactly where it was last drawn (damping creeps below
  // OrbitControls' change threshold; the renderer finishes the glide and stops it).
  await page.waitForTimeout(300);
  const cam = await page.evaluate(() => {
    const w = window as any;
    return { drawn: w.__drawnCam, now: w.__tekto.owner.renderer.activeCamera.position.toArray() };
  });
  expect(cam.now, "camera moved after the last draw").toEqual(cam.drawn);

  // A re-run draws one frame.
  await page.evaluate(() => (window as any).__tekto.owner.rerun());
  await page.waitForTimeout(200);
  expect(await draws.get(), "draws after a re-run").toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("a restored WebGL context draws again without input", async ({ page }) => {
  await open(page, "lines-points");
  const draws = await countDraws(page);
  await page.evaluate(async () => {
    const ext = (window as any).__tekto.owner.renderer.renderer.getContext().getExtension("WEBGL_lose_context");
    ext.loseContext();
    await new Promise((r) => setTimeout(r, 300));
    (window as any).__draws = 0;
    ext.restoreContext();
  });
  await expect.poll(() => draws.get(), { message: "draws after the restore", timeout: 5_000 }).toBeGreaterThan(0);
});

test("an animated sketch keeps drawing", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, "particles");
  const draws = await countDraws(page);
  await draws.reset();
  await page.waitForTimeout(1000);
  const [drawn, frames] = [await draws.get(), await draws.frames()];
  expect(frames).toBeGreaterThan(0);
  expect(drawn, "a draw on every animation frame").toBeGreaterThanOrEqual(frames - 1);
  expect(errors).toEqual([]);
});

test("colour, layer and pickTag restyle the existing three object", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, "lines-points");
  const r = await page.evaluate(() => {
    const owner = (window as any).__tekto.owner;
    const seg = owner.scene.all().find((o: { type: string }) => o.type === "segment");
    const before = owner.renderer.getThreeObject(seg.id);
    owner.scene.setStyle(seg.id, { color: "#ff0000", layer: "x" });
    owner.scene.setStyle(seg.id, { opacity: 0.5 });
    owner.scene.update(seg.id, { pickTag: "t", pickable: false });
    const after = owner.renderer.getThreeObject(seg.id);
    owner.scene.setStyle(seg.id, { dash: { size: 0.1, gap: 0.1 } });   // not in place → rebuilt
    return {
      same: before === after,
      color: after.material.color.getHexString(),
      opacity: after.material.opacity,
      transparent: after.material.transparent,
      pickable: after.userData.pickable,
      rebuiltForDash: owner.renderer.getThreeObject(seg.id) !== after,
    };
  });
  expect(r).toEqual({ same: true, color: "ff0000", opacity: 0.5, transparent: true, pickable: false, rebuiltForDash: true });
  expect(errors).toEqual([]);
});
