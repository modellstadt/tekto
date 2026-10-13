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
  page.on("console", (m) => { if (/THREE\.Material: parameter/.test(m.text())) warnings.push(m.text()); });
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

test("lamps: a point light at each point, replaced and removed, no shadows", async ({ page }) => {
  await page.goto("/testbench.html?page=site-editor");
  await page.waitForFunction(() => (window as any).siteEditor?.doc.count("blocks") >= 1, null, { timeout: 15_000 });
  const lamps = () => page.evaluate(() => {
    const out: { at: number[]; shadow: boolean }[] = [];
    (window as any).__tekto.owner.renderer.threeScene.traverse((o: any) => {
      if (o.isPointLight) out.push({ at: o.position.toArray(), shadow: o.castShadow });
    });
    return out;
  });
  const set = (l: unknown) => page.evaluate((l) => (window as any).__tekto.owner.renderer.setLamps(l), l);
  await set([{ at: { x: 0, y: 0, z: 2.4 } }, { at: { x: 4, y: 0, z: 2.4 }, intensity: 8 }]);
  expect(await lamps()).toEqual([{ at: [0, 0, 2.4], shadow: false }, { at: [4, 0, 2.4], shadow: false }]);
  await set([{ at: { x: 1, y: 1, z: 2.2 } }]);
  expect((await lamps()).map((l) => l.at)).toEqual([[1, 1, 2.2]]);
  await set([]);
  expect(await lamps()).toEqual([]);
  expect(await page.evaluate(() => {
    try { (window as any).__tekto.owner.renderer.setLamps([{ at: { x: NaN, y: 0, z: 0 } }]); return "no error"; }
    catch (e) { return String(e); }
  })).toMatch(/non-finite/);
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
  await page.evaluate(() => (window as any).__tekto.owner.renderer.setProjection("orthographic"));
  expect(await compare()).toEqual({ darker: 0, lighter: 0 });
  expect(errors).toEqual([]);
});
