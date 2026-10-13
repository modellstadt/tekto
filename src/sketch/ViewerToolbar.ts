/**
 * The viewer toolbar, as a DOM element any app can mount: the controls appShell's top bar has.
 */
import type { Scene, LightingMode, RenderMode } from "../scene/Scene";
import type { ThreeRenderer } from "../render/ThreeRenderer";
import { getTheme, type Theme } from "../gui/theme";
import { SunPosition } from "../core/solar/SunPosition";
import { viewModeIconSvg } from "../gui/viewModeIcons";

/** The viewer toolbar's controls; each is shown unless set to false. */
export interface TopBarOptions {
  /** Flat / Studio lighting. */
  light?: boolean;
  /** Ambient occlusion on and off, beside the lighting (`renderer.setAmbientOcclusion`). */
  ao?: boolean;
  /** Solid / Wire / Hidden / Ghost. */
  mode?: boolean;
  /** Perspective / isometric. */
  camera?: boolean;
  /** A section through the model (`renderer.setSection`). */
  cut?: boolean;
  /** The sun for a place, date and hour, and Studio's light following it. */
  sun?: boolean;
}

/**
 * The viewer toolbar: lighting (Flat / Studio, ambient occlusion), render mode, camera
 * (Persp / Ortho, Iso), a section (Cut ▾) and the sun for a place, date and hour (Sun ▾,
 * with Studio's light following it). `appShell()` mounts it in its header; any app can
 * mount `el` anywhere (`tekto/react`'s `ViewerToolbar` does), so apps stop copying the bar.
 * Each control follows the state when it changes elsewhere. `dispose()` unhooks it.
 *
 *   const bar = viewerToolbar(scene, renderer, { cut: false });
 *   header.append(bar.el);
 */
export function viewerToolbar(scene: Scene, renderer: ThreeRenderer, opts: TopBarOptions & { theme?: Theme } = {}): { el: HTMLElement; dispose(): void } {
  const t = opts.theme ?? getTheme();
  const show = opts;
  const offs: (() => void)[] = [];
  const bar = document.createElement("div");
  bar.style.cssText = "margin-left:auto; display:flex; align-items:center; gap:16px;";

  const tag = (label: string) => {
    const el = document.createElement("span");
    el.textContent = label;
    el.style.cssText = `color:${t.textFaint}; text-transform:uppercase; letter-spacing:1px; font-size:9px;`;
    return el;
  };

  /** Buttons of which one is on: [label, value, optional SVG icon before the label]. */
  function segmented<T extends string>(opts: Array<[string, T, string?]>, initial: T, onSel: (v: T) => void, follow?: (set: (v: T) => void) => void): HTMLElement {
    const wrap = document.createElement("div");
    wrap.style.cssText = `display:flex; border:1px solid ${t.border}; border-radius:5px; overflow:hidden;`;
    const btns: Array<[HTMLButtonElement, T]> = [];
    const set = (val: T) => {
      for (const [b, v] of btns) {
        const on = v === val;
        b.style.background = on ? t.accent : "transparent";
        b.style.color = on ? t.panelBg : t.textDim;
      }
    };
    for (const [label, val, icon] of opts) {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = "padding:3px 9px; border:0; background:transparent; font:inherit; font-size:11px; cursor:pointer;";
      if (icon) {
        b.insertAdjacentHTML("afterbegin", icon);
        b.style.cssText += "display:flex; align-items:center; gap:4px; padding-left:6px;";
      }
      b.onclick = () => { set(val); onSel(val); };
      wrap.appendChild(b);
      btns.push([b, val]);
    }
    set(initial);
    follow?.(set);                       // the state can change elsewhere: show it when it does
    return wrap;
  }

  /** A button that is on or off. */
  const toggle = (label: string, title: string, initial: boolean, onSet: (on: boolean) => void) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.title = title;
    let on = initial;
    const paint = () => {
      b.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; font:inherit; font-size:11px; cursor:pointer; `
        + (on ? `background:${t.accent}; color:${t.panelBg};` : `background:transparent; color:${t.textDim};`);
      b.setAttribute("aria-pressed", String(on));
    };
    b.onclick = () => { on = !on; paint(); onSet(on); };
    paint();
    return b;
  };

  const group = (label: string, control: HTMLElement) => {
    const g = document.createElement("div");
    g.style.cssText = "display:flex; align-items:center; gap:6px;";
    g.append(tag(label), control);
    return g;
  };

  if (show.light !== false) {
    const light = group("Light", segmented<LightingMode>(
      [["Flat", "flat"], ["Studio", "studio"]], scene.lightingMode, (v) => scene.setLightingMode(v),
      (set) => offs.push(scene.on((e) => { if (e.type === "scene:lightingMode") set(e.mode); }))));
    if (show.ao !== false) {
      light.appendChild(toggle("AO", "Ambient occlusion: darker where surfaces meet (perspective views)",
        renderer.ambientOcclusion, (on) => renderer.setAmbientOcclusion(on)));
    }
    bar.appendChild(light);
  }
  if (show.mode !== false) bar.appendChild(group("Mode", segmented<RenderMode>(
    ([["Solid", "solid"], ["Wire", "wireframe"], ["Hidden", "hiddenline"], ["Ghost", "ghost"]] as const)
      .map(([label, mode]): [string, RenderMode, string] => [label, mode, viewModeIconSvg(mode, 14)]),
    scene.renderMode, (v) => scene.setRenderMode(v),
    (set) => offs.push(scene.on((e) => { if (e.type === "scene:renderMode") set(e.mode); })))));
  if (show.camera !== false) {
    const cam = group("Cam", segmented<"perspective" | "orthographic">(
      [["Persp", "perspective"], ["Ortho", "orthographic"]], renderer.projection,
      (v) => renderer.setProjection(v), (set) => offs.push(renderer.onProjection(set))));
    // True isometric: orthographic, on the diagonal with equal foreshortening on X, Y and Z.
    // Orbiting afterwards stays orthographic (a general axonometric).
    const iso = document.createElement("button");
    iso.textContent = "Iso";
    iso.title = "Isometric: orthographic, from the diagonal";
    iso.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
    iso.onclick = () => { renderer.setProjection("orthographic"); renderer.setView("iso"); };
    cam.appendChild(iso);
    bar.appendChild(cam);
  }
  if (show.cut !== false) bar.appendChild(buildCut(renderer, t, segmented));
  if (show.sun !== false) bar.appendChild(buildSun(renderer, t));
  return { el: bar, dispose() { for (const off of offs) off(); offs.length = 0; bar.remove(); } };
}

/** "Cut ▾": a section along an axis, its position through the model, which side stays. */
function buildCut(
  renderer: ThreeRenderer, t: Theme,
  segmented: <T extends string>(opts: Array<[string, T]>, initial: T, onSel: (v: T) => void) => HTMLElement,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;";
  const btn = document.createElement("button");
  btn.textContent = "Cut ▾";
  btn.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
  const pop = document.createElement("div");
  pop.style.cssText = `position:absolute; top:130%; right:0; z-index:50; display:none; flex-direction:column; gap:8px;
    padding:12px; border:1px solid ${t.border}; border-radius:8px; background:${t.panelBg};
    box-shadow:0 8px 24px rgba(0,0,0,.45); width:228px; font-size:11px; color:${t.textDim};`;
  btn.onclick = () => { pop.style.display = pop.style.display === "none" ? "flex" : "none"; };
  wrap.append(btn, pop);

  const state = { axis: "off" as "off" | "x" | "y" | "z", at: 50, flip: false };
  const apply = () => {
    renderer.setSection(state.axis === "off" ? null : { axis: state.axis, at: state.at / 100, flip: state.flip });
    btn.style.color = state.axis === "off" ? t.textDim : t.accent;
  };
  const pos = document.createElement("input");
  pos.type = "range"; pos.min = "0"; pos.max = "100"; pos.step = "1"; pos.value = "50";
  pos.className = "tekto-slider";
  pos.style.cssText = `cursor:pointer;--tekto-track:${t.controlBorder};--tekto-thumb:${t.accent};`;
  pos.oninput = () => { state.at = Number(pos.value); apply(); };
  const flip = document.createElement("label");
  flip.style.cssText = "display:flex; align-items:center; gap:6px; cursor:pointer;";
  const flipBox = document.createElement("input");
  flipBox.type = "checkbox";
  flipBox.onchange = () => { state.flip = flipBox.checked; apply(); };
  flip.append(flipBox, "Keep the other side");
  pop.append(
    segmented<"off" | "x" | "y" | "z">([["Off", "off"], ["Plan", "z"], ["X", "x"], ["Y", "y"]], "off", (v) => { state.axis = v; apply(); }),
    pos, flip,
  );
  return wrap;
}

function buildSun(renderer: ThreeRenderer, t: Theme): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;";

  const btn = document.createElement("button");
  btn.innerHTML = "&#x2600;&#xFE0E; Sun &#x25BE;";
  btn.style.cssText = `padding:3px 9px; border:1px solid ${t.border}; border-radius:5px; background:transparent; color:${t.textDim}; font:inherit; font-size:11px; cursor:pointer;`;
  wrap.appendChild(btn);

  const pop = document.createElement("div");
  pop.style.cssText = `position:absolute; top:130%; right:0; z-index:50; display:none; flex-direction:column; gap:8px;
    padding:12px; border:1px solid ${t.border}; border-radius:8px; background:${t.panelBg};
    box-shadow:0 8px 24px rgba(0,0,0,.45); width:228px;`;
  wrap.appendChild(pop);
  btn.onclick = () => { pop.style.display = pop.style.display === "none" ? "flex" : "none"; };

  // Default: Zürich, summer solstice, 13:00.
  const state = { lat: 47.37, lon: 8.55, month: 6, day: 21, hour: 13 };

  const readout = document.createElement("div");
  readout.style.cssText = `font-size:10px; color:${t.textDim}; font-family:${t.font};`;

  const apply = () => {
    const date = new Date(Date.UTC(2025, state.month - 1, state.day, Math.floor(state.hour), Math.round((state.hour % 1) * 60)));
    const sun = SunPosition.compute({ date, latitude: state.lat, longitude: state.lon });
    renderer.setSunDirection(sun.direction);
    const deg = (r: number) => Math.round((r * 180) / Math.PI);
    readout.textContent = `alt ${deg(sun.altitude)}°  az ${deg(sun.azimuth)}°  ${sun.isDaytime ? "day" : "night"}`;
  };

  const num = (label: string, value: number, min: number, max: number, step: number, onCh: (v: number) => void) => {
    const r = document.createElement("label");
    r.style.cssText = `display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; color:${t.textDim};`;
    const sp = document.createElement("span"); sp.textContent = label;
    const i = document.createElement("input");
    i.type = "number"; i.value = String(value); i.min = String(min); i.max = String(max); i.step = String(step);
    i.style.cssText = `width:84px; padding:2px 5px; background:${t.fieldBg}; border:1px solid ${t.border}; border-radius:4px; color:inherit; font:inherit; font-size:11px;`;
    i.oninput = () => onCh(Number(i.value));
    r.append(sp, i);
    return r;
  };

  pop.append(
    num("Latitude", state.lat, -90, 90, 0.1, (v) => { state.lat = v; apply(); }),
    num("Longitude", state.lon, -180, 180, 0.1, (v) => { state.lon = v; apply(); }),
    num("Month", state.month, 1, 12, 1, (v) => { state.month = v; apply(); }),
    num("Day", state.day, 1, 31, 1, (v) => { state.day = v; apply(); }),
  );

  // Hour slider.
  const hourWrap = document.createElement("label");
  hourWrap.style.cssText = `display:flex; flex-direction:column; gap:4px; font-size:11px; color:${t.textDim};`;
  const hourLabel = document.createElement("span"); hourLabel.textContent = "Hour 13:00";
  const hour = document.createElement("input");
  hour.type = "range"; hour.min = "0"; hour.max = "24"; hour.step = "0.25"; hour.value = "13";
  hour.className = "tekto-slider";
  hour.style.cssText = `cursor:pointer;--tekto-track:${t.controlBorder};--tekto-thumb:${t.accent};`;
  hour.oninput = () => {
    state.hour = Number(hour.value);
    const h = Math.floor(state.hour), m = Math.round((state.hour % 1) * 60);
    hourLabel.textContent = `Hour ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    apply();
  };
  hourWrap.append(hourLabel, hour);
  // Studio's light follows the sun: evening and dusk from the hour (renderer.setDaylight).
  const follow = document.createElement("label");
  follow.style.cssText = `display:flex; align-items:center; gap:6px; font-size:11px; color:${t.textDim}; cursor:pointer;`;
  const followBox = document.createElement("input");
  followBox.type = "checkbox";
  followBox.checked = renderer.daylight;
  followBox.onchange = () => renderer.setDaylight(followBox.checked);
  follow.append(followBox, "Light follows the sun (Studio)");
  pop.append(hourWrap, readout, follow);

  apply(); // seed an initial sun direction so Studio has a sensible light
  return wrap;
}
