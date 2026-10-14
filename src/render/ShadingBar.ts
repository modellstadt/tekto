/**
 * The shading bar: a small strip of icons in a corner of the 3D view, as Blender has one in
 * its viewport header. The render style (solid, wireframe, hidden line, ghost), the lighting
 * (Flat, Studio) and the sun (Morning, Noon, Sunset). The renderer draws it in its own view,
 * so an app only switches it on (`shadingBar: true`); it follows changes made in code.
 */
import type { RenderMode, LightingMode } from "../scene/Scene";
import type { SunPreset } from "./viewRules";
import { viewModeIconSvg } from "../gui/viewModeIcons";
import type { RendererCore } from "./RendererCore";
import type { Lighting } from "./Lighting";

const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" `
  + `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

// The sun's rays, and a half sun on a horizon with an arrow up (morning) or down (sunset).
const RAYS = "M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4";
const HORIZON = (arrow: string) => svg(
  `<path d="M3 19h18M7.5 19a4.5 4.5 0 0 1 9 0M12 9.5V3M4.6 13.6l1.4 1.4M19.4 13.6 18 15"/><path d="${arrow}"/>`);

/** Minimal icons for the lighting and the sun, in `currentColor` on a 24 grid. */
export const SHADING_ICONS = {
  flat: svg(`<circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity="0.35"/>`),
  studio: svg(`<circle cx="12" cy="12" r="8"/><path d="M20 12a8 8 0 0 1-8 8a10 10 0 0 0 8-8z" fill="currentColor" fill-opacity="0.55" stroke="none"/>`
    + `<circle cx="9" cy="9" r="1.7" fill="currentColor" stroke="none"/>`),
  noon: svg(`<circle cx="12" cy="12" r="4"/><path d="${RAYS}"/>`),
  morning: HORIZON("M9 5.5 12 2.5l3 3"),
  sunset: HORIZON("M9 6.5l3 3 3-3"),
};

const MODES: [RenderMode, string][] = [["solid", "Solid"], ["wireframe", "Wireframe"], ["hiddenline", "Hidden line"], ["ghost", "Ghost"]];
const LIGHTS: [LightingMode, string][] = [["flat", "Flat lighting"], ["studio", "Studio lighting: soft shadows"]];
const SUNS: [SunPreset, string][] = [["morning", "Morning"], ["noon", "Noon"], ["sunset", "Sunset"]];

/** Corner of the view the bar sits in. */
export type ShadingBarCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export class ShadingBar {
  private root = document.createElement("div");
  private pop = document.createElement("div");
  private paints: (() => void)[] = [];
  private off: () => void;

  constructor(private core: RendererCore, private lighting: Lighting, corner: ShadingBarCorner = "top-left") {
    const host = core.container;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const [v, h] = [corner.startsWith("top") ? "top" : "bottom", corner.endsWith("left") ? "left" : "right"];
    this.root.style.cssText = `position:absolute;${v}:10px;${h}:10px;z-index:5;display:flex;align-items:center;gap:2px;`
      + "padding:3px;border-radius:7px;background:rgba(16,18,26,.78);border:1px solid rgba(255,255,255,.08);"
      + "box-shadow:0 2px 8px rgba(0,0,0,.3);user-select:none;";
    this.root.dataset.tektoShadingBar = "";

    const scene = core.gScene;
    for (const [mode, label] of MODES) this.button(viewModeIconSvg(mode, 16), label, () => scene.renderMode === mode, () => scene.setRenderMode(mode));
    this.separator();
    for (const [mode, label] of LIGHTS) this.button(SHADING_ICONS[mode], label, () => scene.lightingMode === mode, () => scene.setLightingMode(mode));
    this.separator();
    const sun = this.button(SHADING_ICONS.noon, "Sun: morning, noon, sunset", () => this.pop.style.display === "flex", () => this.togglePop());
    this.paints.push(() => { sun.innerHTML = SHADING_ICONS[this.lighting.currentSunPreset ?? "noon"]; });

    // The sun's presets, under the bar.
    this.pop.style.cssText = `position:absolute;${v === "top" ? "top" : "bottom"}:calc(100% + 6px);${h}:0;display:none;gap:2px;`
      + "padding:4px;border-radius:7px;background:rgba(16,18,26,.92);border:1px solid rgba(255,255,255,.08);"
      + "box-shadow:0 4px 14px rgba(0,0,0,.4);";
    for (const [preset, label] of SUNS) {
      const b = this.button(`${SHADING_ICONS[preset]}<span style="font:500 9.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${label}</span>`,
        `${label}: Studio, the light following the sun`, () => this.lighting.currentSunPreset === preset,
        () => { this.lighting.sunPreset(preset); this.togglePop(false); }, this.pop);
      b.style.width = "54px";
      b.style.height = "42px";
      b.style.flexDirection = "column";
      b.style.gap = "4px";
    }
    this.root.appendChild(this.pop);
    host.appendChild(this.root);

    // Follow the state wherever it is changed.
    this.off = scene.on((e) => { if (e.type === "scene:renderMode" || e.type === "scene:lightingMode") this.paint(); });
    this.paint();
  }

  /** Redraw which buttons are on (after a change made elsewhere, such as the sun moved in code). */
  paint(): void { for (const p of this.paints) p(); }

  private togglePop(open = this.pop.style.display !== "flex"): void {
    this.pop.style.display = open ? "flex" : "none";
    this.paint();
  }

  private button(icon: string, title: string, on: () => boolean, run: () => void, parent: HTMLElement = this.root): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    b.innerHTML = icon;
    b.style.cssText = "display:flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:0;"
      + "border-radius:5px;cursor:pointer;";
    const paint = () => {
      const active = on();
      b.setAttribute("aria-pressed", String(active));
      b.style.background = active ? "#e8ebf0" : "transparent";
      b.style.color = active ? "#11131a" : "rgba(232,235,240,.72)";
    };
    b.onmouseenter = () => { if (!on()) b.style.color = "#fff"; };
    b.onmouseleave = paint;
    b.onclick = () => { run(); this.paint(); };
    this.paints.push(paint);
    parent.appendChild(b);
    return b;
  }

  private separator(): void {
    const s = document.createElement("div");
    s.style.cssText = "width:1px;height:18px;margin:0 3px;background:rgba(255,255,255,.14);";
    this.root.appendChild(s);
  }

  dispose(): void {
    this.off();
    this.root.remove();
  }
}
