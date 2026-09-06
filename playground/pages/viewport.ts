/**
 * Viewport - view modes, camera projections and a real sun, over meshes the
 * page built itself.
 *
 * Unlike every other page here, this one owns its renderer: that is the whole
 * point of `Viewport`, which exists for apps that already have geometry (from
 * IFC, from a cut list, from a supplier) and want somewhere honest to put it
 * rather than a Scene the library owns.
 *
 * The subject is a framed wall from `WallSystem`, so the modes have something
 * with real depth to show: shaded reads the framing against the boards, ghost
 * shows the studs through the sheathing, and hidden line with an orthographic
 * camera on the front view is an elevation drawing.
 */
import * as THREE from "three";
import {
  Viewport, Vec2, Wall, WallOpening, WallType, HolzrahmenBau, holzrahmenbauLayers, realize,
} from "../../src";
import type { ViewMode, Projection, StandardView } from "../../src";

/** Colour by framing role, the way a cut list groups them. */
const ROLE_COLOUR: Record<string, number> = {
  stud: 0xd2a86a, king: 0xc79355, jack: 0xc79355, cripple: 0xdcbc8b,
  topPlate: 0xb98442, bottomPlate: 0xb98442, sillPlate: 0xb98442,
  header: 0xa8702f, sill: 0xa8702f, blocking: 0xdcbc8b, noggin: 0xdcbc8b,
  sheathing: 0xcfc09a, cladding: 0xb0a98f, drywall: 0xe8e8e4, insulation: 0xe6dfae,
};
/** Roles drawn as translucent sheets: they wrap the frame, and an opaque one
 *  would hide everything worth looking at. */
const SHEET = new Set(["sheathing", "cladding", "drywall", "insulation"]);
const SELECTED = 0x1f7ae0;

export default function (container: HTMLElement): { dispose(): void } {
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;inset:0";
  // only if it is not positioned already: the testbench's #app is absolute and
  // fills the area under the bar, and overwriting that collapses it to nothing
  if (getComputedStyle(container).position === "static") container.style.position = "relative";
  container.appendChild(host);

  let selected: THREE.Mesh | null = null;
  const readout = document.createElement("div");

  const viewport = new Viewport(host, {
    // Tekto is Z-up and three.js is Y-up: without this the wall lies down
    up: "z",
    onPick: (mesh) => {
      selected = mesh;
      viewport.repaint();
      readout.textContent = mesh
        ? `${mesh.userData.role} ${mesh.userData.size ?? ""}`
        : "click a member";
    },
    // the app's last word on colour, asked before the mode decides. A viewport
    // has no idea what "selected" means, and should not.
    appearanceOf: (mesh) => (mesh === selected
      ? { colour: SELECTED, opacity: 1, depthWrite: true }
      : null),
  });

  // -- the subject ----------------------------------------------------------

  const studDepth = 0.16, spacing = 0.625, height = 2.7, length = 5;
  const layers = holzrahmenbauLayers({
    insulation: { material: "Mineralwolle", thickness: studDepth },
  });
  const type = new WallType({
    name: `Holzrahmenbau ${studDepth * 1000} mm`,
    construction: HolzrahmenBau({
      studProfile: { w: 0.06, h: studDepth, name: `KVH 60x${studDepth * 1000}` },
      studSpacing: spacing,
    }),
    layers,
    properties: { loadBearing: true, isExternal: true },
  });
  const wall = new Wall({
    centerline: [new Vec2(0, 0), new Vec2(length, 0)],
    thickness: layers.reduce((t, l) => t + l.thickness, 0),
    height, name: "Wall", type,
  });
  wall.openings.push(WallOpening.window(length / 2, 1.4, 0.9, 2.2));
  wall.syncOpeningsToRibbon();
  const built = realize(wall);

  const meshes = built.parts
    .filter((part) => part.mesh.positions.length)
    .map((part) => {
      const role = String(part.role);
      const colour = ROLE_COLOUR[role] ?? 0xd9dde3;
      const sheet = SHEET.has(role);
      const mesh = Viewport.meshFrom(part.mesh, new THREE.MeshStandardMaterial({
        color: colour, roughness: 0.85, side: THREE.DoubleSide,
        transparent: sheet, opacity: sheet ? 0.35 : 1, depthWrite: !sheet,
      }));
      mesh.userData.baseColour = colour;
      mesh.userData.role = role;
      return mesh;
    });

  // no outline around the translucent sheets: a box drawn over the thing that
  // matters reads as clutter rather than as a boundary
  viewport.setContent(meshes, { outline: (m) => !SHEET.has(m.userData.role) });
  viewport.setSun(new Date("2026-06-21T09:00:00Z"), 47.37, 8.55, "Zurich");

  // -- controls -------------------------------------------------------------

  const bar = document.createElement("div");
  bar.style.cssText = "position:absolute;left:12px;top:12px;display:flex;gap:6px;"
    + "flex-wrap:wrap;font:12px system-ui;align-items:center";
  container.appendChild(bar);

  const group = <T extends string>(values: T[], initial: T, onPick: (v: T) => void) => {
    const box = document.createElement("div");
    box.style.cssText = "display:flex;border:1px solid #cbd2d9;border-radius:4px;"
      + "overflow:hidden;background:#fff";
    const buttons = values.map((v) => {
      const b = document.createElement("button");
      b.textContent = v;
      b.style.cssText = "border:0;padding:4px 9px;font:12px system-ui;cursor:pointer;background:#fff";
      b.onclick = () => {
        onPick(v);
        buttons.forEach((other, i) => {
          const on = values[i] === v;
          other.style.background = on ? "#33414f" : "#fff";
          other.style.color = on ? "#fff" : "#33414f";
        });
      };
      box.appendChild(b);
      return b;
    });
    buttons[values.indexOf(initial)]?.click();
    bar.appendChild(box);
    return box;
  };

  group<ViewMode>(["shaded", "ghost", "hidden-line"], "shaded", (m) => viewport.setViewMode(m));
  group<Projection>(["perspective", "orthographic"], "perspective", (p) => viewport.setProjection(p));
  group<StandardView>(["iso", "top", "front", "right"], "iso", (v) => viewport.setView(v));

  const sun = document.createElement("button");
  sun.textContent = "sun";
  sun.title = viewport.sunDescription;
  sun.style.cssText = "border:1px solid #cbd2d9;border-radius:4px;background:#fff;"
    + "padding:4px 9px;font:12px system-ui;cursor:pointer";
  sun.onclick = () => {
    viewport.setShadows(!viewport.shadowsOn);
    sun.style.background = viewport.shadowsOn ? "#33414f" : "#fff";
    sun.style.color = viewport.shadowsOn ? "#fff" : "#33414f";
  };
  bar.appendChild(sun);

  readout.textContent = "click a member";
  readout.style.cssText = "position:absolute;left:12px;bottom:12px;font:12px system-ui;"
    + "background:#fff;border:1px solid #cbd2d9;border-radius:4px;padding:4px 9px";
  container.appendChild(readout);

  // orthographic + hidden line + front is an elevation, which is the pairing
  // the two controls exist for
  const hint = document.createElement("div");
  hint.textContent = "orthographic + hidden line + front is an elevation";
  hint.style.cssText = "position:absolute;right:12px;bottom:12px;font:12px system-ui;color:#6b7680";
  container.appendChild(hint);

  return {
    dispose() {
      viewport.dispose();
      bar.remove(); readout.remove(); hint.remove(); host.remove();
    },
  };
}
