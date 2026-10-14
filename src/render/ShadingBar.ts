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
import type { Marks } from "./Marks";
import { ensureSliderStyle } from "../gui/ControlPanel";

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
  // A box with a slice through it.
  section: svg(`<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 12.5 12 16l8-3.5M4 12.5 12 9l8 3.5" fill="currentColor" fill-opacity="0.35"/>`),
  flip: svg(`<path d="M8 4v15M5 7l3-3 3 3M16 20V5M13 17l3 3 3-3"/>`),
};

const MODES: [RenderMode, string][] = [["solid", "Solid"], ["wireframe", "Wireframe"], ["hiddenline", "Hidden line"], ["ghost", "Ghost"]];
const LIGHTS: [LightingMode, string][] = [["flat", "Flat lighting"], ["studio", "Studio lighting: soft shadows"]];
const SUNS: [SunPreset, string][] = [["morning", "Morning"], ["noon", "Noon"], ["sunset", "Sunset"]];

/** Corner of the view the bar sits in. */
export type ShadingBarCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export class ShadingBar {
  private root = document.createElement("div");
  private openPop: HTMLDivElement | null = null;
  private paints: (() => void)[] = [];
  private off: () => void;

  constructor(private core: RendererCore, private lighting: Lighting, private marks: Marks, corner: ShadingBarCorner = "top-left") {
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
    const sunPop = this.popover(v, h);
    const sun = this.button(SHADING_ICONS.noon, "Sun: morning, noon, sunset", () => this.openPop === sunPop, () => this.toggle(sunPop));
    this.paints.push(() => { sun.innerHTML = SHADING_ICONS[this.lighting.currentSunPreset ?? "noon"]; });
    for (const [preset, label] of SUNS) {
      const b = this.button(`${SHADING_ICONS[preset]}<span style="font:500 9.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${label}</span>`,
        `${label}: Studio, the light following the sun`, () => this.lighting.currentSunPreset === preset,
        () => { this.lighting.sunPreset(preset); this.toggle(null); }, sunPop);
      b.style.width = "54px";
      b.style.height = "42px";
      b.style.flexDirection = "column";
      b.style.gap = "4px";
    }

    // The section: which way it cuts, where (a slider in metres), which side stays.
    const cutPop = this.popover(v, h);
    cutPop.style.flexDirection = "column";
    cutPop.style.gap = "6px";
    this.button(SHADING_ICONS.section, "Section: cut the model", () => this.openPop === cutPop || !!this.marks.section, () => this.toggle(cutPop));
    this.sectionControls(cutPop);
    host.appendChild(this.root);

    // Follow the state wherever it is changed.
    this.off = scene.on((e) => { if (e.type === "scene:renderMode" || e.type === "scene:lightingMode") this.paint(); });
    this.paint();
  }

  /** Redraw which buttons are on (after a change made elsewhere, such as the sun moved in code). */
  paint(): void { for (const p of this.paints) p(); }

  /** A popover under the bar (above it when the bar sits at the bottom). */
  private popover(v: string, h: string): HTMLDivElement {
    const pop = document.createElement("div");
    pop.style.cssText = `position:absolute;${v === "top" ? "top" : "bottom"}:calc(100% + 6px);${h}:0;display:none;gap:2px;`
      + "padding:4px;border-radius:7px;background:rgba(16,18,26,.92);border:1px solid rgba(255,255,255,.08);"
      + "box-shadow:0 4px 14px rgba(0,0,0,.4);";
    this.root.appendChild(pop);
    return pop;
  }

  /** Open one popover (closing the other), or close it if it is open; null closes. */
  private toggle(pop: HTMLDivElement | null): void {
    const next = pop && this.openPop !== pop ? pop : null;
    if (this.openPop) this.openPop.style.display = "none";
    if (next) next.style.display = "flex";
    this.openPop = next;
    this.paint();
  }

  /** The section popover's controls, kept in step with the cut however it was set. */
  private sectionControls(pop: HTMLDivElement): void {
    const up = this.core.isZUp ? "z" : "y";
    const axes: [string, "x" | "y" | "z" | null, string][] = [
      ["Off", null, "No section"], ["Plan", up, "Plan: a horizontal cut"],
      ["X", "x", "A cut across X"], ...(this.core.isZUp ? [["Y", "y", "A cut across Y"]] : [["Z", "z", "A cut across Z"]]) as [string, "x" | "y" | "z", string][],
    ];
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:2px;align-items:center;";
    pop.appendChild(row);
    const range = (axis: "x" | "y" | "z"): [number, number] | null => {
      const b = this.core.contentBox();
      return b.isEmpty() ? null : [b.min[axis], b.max[axis]];
    };
    const set = (axis: "x" | "y" | "z" | null, coordinate?: number, flip = this.marks.section?.flip ?? false) => {
      if (!axis) { this.marks.setSection(null); this.paint(); return; }
      const r = range(axis);
      this.marks.setSection({ axis, coordinate: coordinate ?? (r ? (r[0] + r[1]) / 2 : 0), ...(flip ? { flip } : {}) });
      this.paint();
    };
    for (const [label, axis, title] of axes) {
      const b = this.button(`<span style="font:600 10px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${label}</span>`,
        title, () => (this.marks.section?.axis ?? null) === axis, () => set(axis, axis === this.marks.section?.axis ? this.marks.sectionCoordinate() ?? undefined : undefined), row);
      b.style.width = label.length > 1 ? "36px" : "26px";
    }
    const sep = document.createElement("div");
    sep.style.cssText = "width:1px;height:16px;margin:0 3px;background:rgba(255,255,255,.14);";
    row.appendChild(sep);
    this.button(SHADING_ICONS.flip, "Keep the other side", () => !!this.marks.section?.flip,
      () => { const sec = this.marks.section; if (sec) set(sec.axis, this.marks.sectionCoordinate() ?? undefined, !sec.flip); }, row);

    // Where: a slider over the content's extent along the axis, in metres.
    ensureSliderStyle(document);
    const line = document.createElement("div");
    line.style.cssText = "display:flex;gap:8px;align-items:center;padding:2px 4px 4px;";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "tekto-slider";
    slider.setAttribute("aria-label", "Section position");
    slider.style.cssText = "width:150px;--tekto-track:rgba(255,255,255,.18);--tekto-thumb:#e8ebf0;";
    const value = document.createElement("span");
    value.style.cssText = "min-width:52px;text-align:right;color:rgba(232,235,240,.8);font:11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;";
    line.append(slider, value);
    pop.appendChild(line);

    // Moving it re-cuts every object: at most once a frame; the plane shows while it moves.
    let pending: number | null = null, frame = 0, hide = 0;
    slider.addEventListener("input", () => {
      pending = Number(slider.value);
      value.textContent = `${pending.toFixed(2)} m`;
      this.marks.showSectionPlane(true);
      clearTimeout(hide);
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        const sec = this.marks.section;
        if (sec && pending !== null) {
          const { at: _share, ...rest } = sec;                         // a coordinate now, not a share
          this.marks.setSection({ ...rest, coordinate: pending });
        }
        this.marks.showSectionPlane(true);
      });
    });
    const settle = () => { clearTimeout(hide); hide = window.setTimeout(() => this.marks.showSectionPlane(false), 600); };
    slider.addEventListener("change", settle);
    slider.addEventListener("pointerup", settle);

    this.paints.push(() => {
      const sec = this.marks.section;
      const r = sec ? range(sec.axis) : null;
      line.style.opacity = sec && r ? "1" : "0.35";
      slider.disabled = !(sec && r);
      if (sec && r) {
        slider.min = String(r[0]);
        slider.max = String(r[1]);
        slider.step = String(Math.max((r[1] - r[0]) / 500, 1e-4));
        const c = this.marks.sectionCoordinate() ?? r[0];
        if (document.activeElement !== slider) slider.value = String(c);
        value.textContent = `${c.toFixed(2)} m`;
      } else {
        value.textContent = "—";
      }
    });
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
    this.marks.showSectionPlane(false);
    this.root.remove();
  }
}
