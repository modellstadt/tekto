/**
 * The renderer's quality features (once the separate Viewport's): crease lines built a frame at a
 * time (and finished for a snapshot), the sun's shadow camera framed to the content,
 * selection as outlines, and hover.
 */
import { expect, test, type Page } from "@playwright/test";


async function openShell(page: Page) {
  await page.goto("/testbench.html?page=app-shell");
  await page.waitForFunction(() => (window as any).__tekto?.owner?.scene.all().length >= 12, null, { timeout: 15_000 });
}

test("hidden line queues its creases, draws them in, and a snapshot waits for them", async ({ page }) => {
  await openShell(page);
  const queued = await page.evaluate(() => {
    const o = (window as any).__tekto.owner;
    o.scene.setRenderMode("hiddenline");
    return o.renderer.pendingEdges;                        // nothing built yet: the switch didn't stall
  });
  expect(queued).toBeGreaterThanOrEqual(12);
  await expect.poll(() => page.evaluate(() => (window as any).__tekto.owner.renderer.pendingEdges)).toBe(0);

  const afterSnapshot = await page.evaluate(() => {
    const o = (window as any).__tekto.owner;
    o.scene.setRenderMode("ghost");
    const before = o.renderer.pendingEdges;
    o.renderer.snapshotPng();
    let lines = 0;
    o.renderer.threeScene.traverse((c: any) => { if (c.isLineSegments && c.geometry.getAttribute("position")?.count) lines++; });
    return { before, after: o.renderer.pendingEdges, lines };
  });
  expect(afterSnapshot.before).toBeGreaterThan(0);
  expect(afterSnapshot.after).toBe(0);
  expect(afterSnapshot.lines).toBeGreaterThanOrEqual(12);
});

test("in Studio the sun's shadow camera frames the content, not a fixed 30 m box", async ({ page }) => {
  await openShell(page);
  const frame = () => page.evaluate(() => {
    const rr = (window as any).__tekto.owner.renderer;
    rr.render();
    const sc = rr.lighting.dirLight.shadow.camera;
    return { right: sc.right, targetZ: rr.lighting.dirLight.target.position.z };
  });
  await page.evaluate(() => (window as any).__tekto.owner.scene.setLightingMode("studio"));
  const tower = await frame();                              // 12 floors, 0.7 m apart, 4 × 2.4 m slabs
  expect(tower.right).toBeGreaterThan(4);
  expect(tower.right).toBeLessThan(10);
  expect(tower.targetZ).toBeCloseTo(11 * 0.7 / 2, 0);
  await page.evaluate(() => (window as any).__tekto.setParams({ Floors: 40 }));
  await page.waitForTimeout(100);
  expect((await frame()).right).toBeGreaterThan(tower.right * 2);   // a taller tower, a bigger frame
});

test("selection as outlines leaves the colour alone; outlines go with their object; hover", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const state = () => page.evaluate(() => {
    const { doc, blocks } = (window as any).siteEditor;
    const rr = (window as any).__tekto.owner.renderer;
    const id = doc.ids("blocks")[0];
    const group = id ? rr.getThreeObject(blocks.objectsOf(id)[0]) : null;
    const surface = group?.children.find((c: any) => c.userData.surface);
    return { outlines: rr.marks.outlineGroup.children.length, emissive: surface?.material.emissive.getHex() ?? null };
  });

  await page.evaluate(() => (window as any).__tekto.owner.renderer.setSelectionStyle("outline"));
  await page.evaluate(() => { const { doc, selection } = (window as any).siteEditor; selection.select([`blocks/${doc.ids("blocks")[0]}`]); });
  const lit = await state();
  expect(lit.outlines).toBeGreaterThan(0);
  expect(lit.emissive).toBe(0);                              // no tint: the emissive stays black

  await page.evaluate(() => { const { doc } = (window as any).siteEditor; doc.remove("blocks", doc.ids("blocks")[0]); });
  await page.waitForTimeout(50);
  expect((await state()).outlines).toBe(0);
  await page.evaluate(() => (window as any).siteEditor.doc.undo());

  // Hover: the object under the pointer, reported on change.
  await page.evaluate(() => {
    (window as any).__hovered = [];
    (window as any).__tekto.owner.renderer.onHover((id: string | null) => (window as any).__hovered.push(id));
  });
  const at = await page.evaluate(() => {
    const { doc } = (window as any).siteEditor;
    const b = doc.get("blocks", doc.ids("blocks")[0]);
    const rr = (window as any).__tekto.owner.renderer;
    const p = rr.worldToScreen({ x: b.x, y: b.y, z: b.h / 2 });
    const rect = rr.canvasEl.getBoundingClientRect();
    return { x: rect.left + p.x, y: rect.top + p.y, left: rect.left + 8, top: rect.top + 8 };
  });
  await page.mouse.move(at.left, at.top);
  await page.waitForTimeout(60);
  await page.mouse.move(at.x, at.y);
  await expect.poll(() => page.evaluate(() => (window as any).__hovered.filter(Boolean).length)).toBeGreaterThan(0);
  await page.waitForTimeout(60);
  await page.mouse.move(at.left, at.top);
  await expect.poll(() => page.evaluate(() => (window as any).__hovered.at(-1))).toBeNull();
});

test("Studio: no warnings, a cut shows its poché on double-sided meshes and drops its shadows; the flat sky is up", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (m) => { if (/THREE\.Material: parameter|deprecated/.test(m.text())) warnings.push(m.text()); });
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  // appShell is Z-up: the hemisphere's sky comes from +Z, not from the side.
  expect(await page.evaluate(() => (window as any).__tekto.owner.renderer.lighting.hemiLight.position.toArray())).toEqual([0, 0, 1]);

  await page.evaluate(() => (window as any).__tekto.owner.scene.setLightingMode("studio"));
  const cut = () => page.evaluate(async () => {
    const { doc, blocks } = (window as any).siteEditor;
    const r = (window as any).__tekto.owner.renderer;
    const id = doc.ids("blocks")[0];
    const b = doc.get("blocks", id);
    r.setSection({ axis: "z", coordinate: b.h / 2 });
    const surface = r.getThreeObject(blocks.objectsOf(id)[0]).children.find((c: any) => c.userData.surface);
    // Seen from the default view, a point of the block at the cut height (off the axes at the
    // origin) is inside it: the pixel there is the poché, not the lit inside of its far walls.
    const p = r.worldToScreen({ x: b.x + b.w / 4, y: b.y + b.d / 4, z: b.h / 2 });
    const img = new Image();
    img.src = r.snapshotPng();
    await img.decode();
    const k = img.width / r.canvasEl.getBoundingClientRect().width;
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    return {
      pixel: [...g.getImageData(Math.round(p.x * k), Math.round(p.y * k), 1, 1).data.slice(0, 3)],
      offset: surface.material.polygonOffset,
      clipShadows: surface.material.clipShadows,
    };
  });
  const studio = await cut();
  expect(studio.offset).toBe(true);
  expect(studio.clipShadows).toBe(true);
  // The poché colour (0x1b2733, untoned) give or take the fog; the lit inside walls are far lighter.
  studio.pixel.forEach((v, i) => expect(Math.abs(v - [0x1b, 0x27, 0x33][i])).toBeLessThan(14));
  expect(warnings).toEqual([]);

  await page.evaluate(() => (window as any).__tekto.owner.renderer.setSection(null));
  expect(await page.evaluate(() => {
    const { doc, blocks } = (window as any).siteEditor;
    const r = (window as any).__tekto.owner.renderer;
    return r.getThreeObject(blocks.objectsOf(doc.ids("blocks")[0])[0]).children.find((c: any) => c.userData.surface).material.clipShadows;
  })).toBe(false);
});

test("scene lights: a point or a spot in the model, drawn without shadows, gone with the object", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const lights = () => page.evaluate(() => {
    const out: { kind: string; at: number[]; shadow: boolean; target?: number[] }[] = [];
    (window as any).__tekto.owner.renderer.threeScene.traverse((o: any) => {
      if (o.isPointLight) out.push({ kind: "point", at: o.position.toArray(), shadow: o.castShadow });
      if (o.isSpotLight) out.push({ kind: "spot", at: o.position.toArray(), shadow: o.castShadow, target: o.target.position.toArray() });
    });
    return out;
  });
  const ids = await page.evaluate(() => {
    const scene = (window as any).__tekto.owner.scene;
    const V = (x: number, y: number, z: number) => ({ x, y, z });
    return [
      scene.addLight(V(0, 0, 2.4)).id,
      scene.addLight(V(4, 0, 3), { kind: "spot", target: V(4, 2, 0), angle: 25 }, { color: "#ffd2a0" }).id,
    ];
  });
  expect(await lights()).toEqual([
    { kind: "point", at: [0, 0, 2.4], shadow: false },
    { kind: "spot", at: [4, 0, 3], shadow: false, target: [4, 2, 0] },
  ]);
  // Hidden like any object, and gone with it.
  await page.evaluate((id) => (window as any).__tekto.owner.scene.setStyle(id, { visible: false }), ids[0]);
  expect(await page.evaluate(() => {
    let on = 0;
    (window as any).__tekto.owner.renderer.threeScene.traverse((o: any) => { if (o.isPointLight && o.parent?.visible) on++; });
    return on;
  })).toBe(0);
  await page.evaluate((ids) => ids.forEach((id: string) => (window as any).__tekto.owner.scene.remove(id)), ids);
  expect(await lights()).toEqual([]);
});

test("daylight: Studio's light follows the sun's altitude, and goes back when it is off", async ({ page }) => {
  await page.goto("/testbench.html?page=app-shell");                 // appShell: Z-up
  await page.waitForFunction(() => (window as any).__tekto?.owner?.scene.all().length >= 12, null, { timeout: 15_000 });
  const light = () => page.evaluate(() => {
    const r = (window as any).__tekto.owner.renderer;
    r.render();
    const sun = r.lighting.dirLight.color;
    return {
      altitude: Math.round(r.sunAltitude), warm: sun.r > sun.b + 0.05, exposure: r.renderer.toneMappingExposure,
      background: r.threeScene.background.getHex(),
    };
  });
  const sunAt = (deg: number) => page.evaluate((deg) => {
    const a = deg * Math.PI / 180;
    (window as any).__tekto.owner.renderer.setSunDirection({ x: Math.cos(a), y: 0, z: Math.sin(a) });
  }, deg);
  await page.evaluate(() => { const o = (window as any).__tekto.owner; o.scene.setLightingMode("studio"); o.renderer.setDaylight(true); });
  const plain = 0x0a0b14;
  await sunAt(60);
  expect(await light()).toMatchObject({ altitude: 60, warm: false, exposure: 1, background: plain });
  await sunAt(8);
  const evening = await light();
  expect(evening).toMatchObject({ altitude: 8, warm: true });
  expect(evening.exposure).toBeGreaterThan(1.2);
  expect(evening.background).not.toBe(plain);
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setDaylight(false));
  expect(await light()).toMatchObject({ warm: false, exposure: 1, background: plain });
});

test("ambient occlusion darkens the frame in perspective, never lightens it, and skips orthographic", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/testbench.html?page=app-shell");
  await page.waitForFunction(() => (window as any).__tekto?.owner?.scene.all().length >= 12, null, { timeout: 15_000 });
  /** The frame with AO off and on: how many pixels got darker, and how many lighter. */
  const compare = () => page.evaluate(async () => {
    const r = (window as any).__tekto.owner.renderer;
    const grab = async () => {
      const img = new Image();
      img.src = r.snapshotPng();
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const g = c.getContext("2d")!;
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, c.width, c.height).data;
    };
    r.setAmbientOcclusion(false);
    const off = await grab();
    r.setAmbientOcclusion(true);
    const on = await grab();
    let darker = 0, lighter = 0;
    for (let i = 0; i < off.length; i += 4) {
      const d = (on[i] + on[i + 1] + on[i + 2]) - (off[i] + off[i + 1] + off[i + 2]);
      if (d < -6) darker++;
      if (d > 6) lighter++;
    }
    r.setAmbientOcclusion(false);
    return { darker, lighter };
  });
  const persp = await compare();
  expect(persp.darker).toBeGreaterThan(500);                     // the slabs' undersides and the floor plates
  expect(persp.lighter).toBe(0);
  // Solid only: a hidden-line drawing stays black and white (7DHouse saw grey shading).
  for (const mode of ["hiddenline", "wireframe", "ghost"]) {
    await page.evaluate((m) => (window as any).__tekto.owner.scene.setRenderMode(m), mode);
    expect(await compare(), mode).toEqual({ darker: 0, lighter: 0 });
  }
  await page.evaluate(() => (window as any).__tekto.owner.scene.setRenderMode("solid"));
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setProjection("orthographic"));
  expect(await compare()).toEqual({ darker: 0, lighter: 0 });
  expect(errors).toEqual([]);
});

test("setSky lights and backs the scene with an image, stood upright in Z-up; null takes it away", async ({ page }) => {
  await page.goto("/testbench.html?page=app-shell");                 // appShell: Z-up
  await page.waitForFunction(() => (window as any).__tekto?.owner?.scene.all().length >= 12, null, { timeout: 15_000 });
  const corners = () => page.evaluate(async () => {
    const r = (window as any).__tekto.owner.renderer;
    const img = new Image();
    img.src = r.snapshotPng();
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0);
    const at = (y: number) => [...g.getImageData(6, y, 1, 1).data.slice(0, 3)];
    return { top: at(6), bottom: at(c.height - 6), env: !!r.threeScene.environment };
  });
  await page.evaluate(() => {
    // A panorama: sky blue above the horizon, earth brown below.
    const c = document.createElement("canvas");
    c.width = 64; c.height = 32;
    const g = c.getContext("2d")!;
    g.fillStyle = "#285adc"; g.fillRect(0, 0, 64, 16);
    g.fillStyle = "#785028"; g.fillRect(0, 16, 64, 16);
    const r = (window as any).__tekto.owner.renderer;
    r.setView("front", { animate: false });                          // level: sky above, ground below
    r.setSky(c);
  });
  const sky = await corners();
  expect(sky.env).toBe(true);
  expect(sky.top[2]).toBeGreaterThan(sky.top[0] + 60);               // blue above
  expect(sky.bottom[0]).toBeGreaterThan(sky.bottom[2] + 30);         // brown below
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setSky(null));
  const plain = await corners();
  expect(plain.env).toBe(false);
  expect(plain.top).toEqual([0x0a, 0x0b, 0x14]);
});

test("the shading bar: render style, lighting and the sun's presets as icons in the view, following code", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");                // shadingBar: true
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const bar = page.locator("[data-tekto-shading-bar]");
  const state = () => page.evaluate(() => {
    const o = (window as any).__tekto.owner;
    return { mode: o.scene.renderMode, light: o.scene.lightingMode, preset: o.renderer.sunPreset, daylight: o.renderer.daylight };
  });
  await bar.getByRole("button", { name: "Ghost" }).click();
  expect((await state()).mode).toBe("ghost");
  await expect(bar.getByRole("button", { name: "Ghost" })).toHaveAttribute("aria-pressed", "true");

  // Sunset: Studio, the light following the sun, the sun low in the west.
  await bar.getByRole("button", { name: /^Sun/ }).click();
  await bar.getByRole("button", { name: /^Sunset/ }).click();
  expect(await state()).toMatchObject({ light: "studio", preset: "sunset", daylight: true });
  expect(await page.evaluate(() => Math.round((window as any).__tekto.owner.renderer.sunAltitude))).toBe(4);
  await expect(bar.getByRole("button", { name: /^Studio/ })).toHaveAttribute("aria-pressed", "true");

  // Changed in code, the bar follows; moving the sun another way clears the preset.
  await page.evaluate(() => {
    const o = (window as any).__tekto.owner;
    o.scene.setRenderMode("hiddenline");
    o.renderer.setSunDirection({ x: 0, y: -1, z: 1 });
  });
  await expect(bar.getByRole("button", { name: "Hidden line" })).toHaveAttribute("aria-pressed", "true");
  expect((await state()).preset).toBeNull();
});

test("the shading bar's section: axis, a slider in metres, flip and off, following a cut set in code", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");                // shadingBar: true
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const bar = page.locator("[data-tekto-shading-bar]");
  const section = () => page.evaluate(() => (window as any).__tekto.owner.renderer.section);
  const block = await page.evaluate(() => { const { doc } = (window as any).siteEditor; return doc.get("blocks", doc.ids("blocks")[0]); });

  await bar.getByRole("button", { name: /^Section/ }).click();
  await bar.getByRole("button", { name: /^Plan: a horizontal cut/ }).click();
  expect(await section()).toEqual({ axis: "z", coordinate: block.h / 2 });          // the middle of the content
  await expect(bar.getByRole("button", { name: /^Section/ })).toHaveAttribute("aria-pressed", "true");

  // The slider is in metres over the content's height; moving it moves the cut and shows its plane.
  const slider = bar.getByLabel("Section position");
  expect(await slider.evaluate((el: HTMLInputElement) => [Number(el.min), Number(el.max)])).toEqual([0, block.h]);
  await slider.evaluate((el: HTMLInputElement) => { el.value = "1.5"; el.dispatchEvent(new Event("input")); });
  await expect.poll(async () => (await section())?.coordinate).toBeCloseTo(1.5, 5);
  await expect(bar).toContainText("1.50 m");
  expect(await page.evaluate(() => {
    let frames = 0;
    (window as any).__tekto.owner.renderer.threeScene.traverse((o: any) => { if (o.isLineLoop) frames++; });
    return frames;
  })).toBe(1);

  await bar.getByRole("button", { name: "Keep the other side" }).click();
  expect(await section()).toMatchObject({ axis: "z", coordinate: 1.5, flip: true });
  await bar.getByRole("button", { name: /^No section/ }).click();
  expect(await section()).toBeNull();

  // A cut set in code shows in the bar.
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setSection({ axis: "x", coordinate: 0.5 }));
  await expect(bar.getByRole("button", { name: /^A cut across X/ })).toHaveAttribute("aria-pressed", "true");
  await expect(bar).toContainText("0.50 m");
});

test("section levels: a chip per storey cuts its plan above the floor; ticks; the slider snaps", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");                // levels every 3 m (L0…L5)
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  await page.evaluate(() => {                                         // a 12 m block: storeys L0–L4 within it
    const { doc } = (window as any).siteEditor;
    doc.update("blocks", doc.ids("blocks")[0], { h: 12 });
  });
  const bar = page.locator("[data-tekto-shading-bar]");
  const section = () => page.evaluate(() => (window as any).__tekto.owner.renderer.section);
  await bar.getByRole("button", { name: /^Section/ }).click();
  await bar.getByRole("button", { name: /^Plan of L1/ }).click();
  expect(await section()).toEqual({ axis: "z", coordinate: 3 + 1.2 });
  await expect(bar.getByRole("button", { name: /^Plan of L1/ })).toHaveAttribute("aria-pressed", "true");
  expect(await bar.locator("[data-level]").count()).toBe(5);                         // 0, 3, 6, 9, 12 m

  // Near a storey's plan height the slider snaps to it.
  await bar.getByLabel("Section position").evaluate((el: HTMLInputElement) => { el.value = "7.35"; el.dispatchEvent(new Event("input")); });
  await expect.poll(async () => (await section())?.coordinate).toBeCloseTo(7.2, 9);
  await expect(bar.getByRole("button", { name: /^Plan of L2/ })).toHaveAttribute("aria-pressed", "true");

  await page.evaluate(() => (window as any).__tekto.owner.renderer.setSectionLevels([]));
  expect(await bar.getByRole("button", { name: /^Plan of/ }).count()).toBe(0);
  expect(await page.evaluate(() => {
    try { (window as any).__tekto.owner.renderer.setSectionLevels([{ name: "x", elevation: NaN }]); return "no error"; }
    catch (e) { return String(e); }
  })).toMatch(/non-finite elevation/);
});
